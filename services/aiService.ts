import { Package, Coordinates, PackageStatus, CitySegment, CopilotSuggestion } from '../types';
import { DEPOT_COORDS } from '../constants';

// --- CITY MEMORY LAYER ---
const getCityMemory = (): CitySegment[] => {
  const stored = localStorage.getItem('inpost_city_memory');
  return stored ? JSON.parse(stored) : [];
};

// --- CORE UTILS ---

const calculateDistanceKm = (a?: Coordinates, b?: Coordinates): number => {
  if (!a || !b) return 0; // If coordinates are missing, assume 0 geometric distance for now.

  const R = 6371; 
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
};

const estimateTravelTime = (a?: Coordinates, b?: Coordinates): number => {
  if (!a || !b) return 5; // Default 5 min penalty for unknown locations

  const dist = calculateDistanceKm(a, b);
  const baseSpeed = 25; // km/h (city)
  const timeHours = dist / baseSpeed;
  return Math.ceil(timeHours * 60) + 2; // +2 min parking
};

// --- LOGIC: TIMELINE CALCULATOR ---

export const calculateTimeline = (route: Package[], startTime: Date = new Date()): Package[] => {
  let currentTime = startTime.getTime();
  let currentLoc = DEPOT_COORDS;
  
  return route.map(pkg => {
    if (pkg.status !== PackageStatus.PENDING) {
        return { ...pkg, calculatedEta: undefined }; 
    }

    const travelMin = estimateTravelTime(currentLoc, pkg.coords);
    const serviceMin = 3; 
    
    currentTime += travelMin * 60 * 1000;
    
    const etaDate = new Date(currentTime);
    const etaString = etaDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    
    // Only update current location if the package has valid coords
    if (pkg.coords) {
        currentLoc = pkg.coords;
    }
    currentTime += serviceMin * 60 * 1000;

    return { ...pkg, calculatedEta: etaString };
  });
};

// --- LOGIC: COPILOT ---

export const checkOptimizationOpportunity = async (packages: Package[]): Promise<CopilotSuggestion | null> => {
  const pendingStartIndex = packages.findIndex(p => p.status === PackageStatus.PENDING);
  if (pendingStartIndex === -1) return null;

  const pending = packages.filter(p => p.status === PackageStatus.PENDING);
  if (pending.length < 3) return null;

  const windowSize = 4;
  const lookahead = pending.slice(0, windowSize);
  
  if (lookahead.some(p => p.isLocked)) return null;

  // Filter out packages without coordinates from geometric optimization
  // If a package has no coords, we cannot optimize it geometrically.
  if (lookahead.some(p => !p.coords)) return null;

  let startCoords = DEPOT_COORDS;
  const prevPkg = packages[pendingStartIndex - 1];
  if (prevPkg && prevPkg.coords) startCoords = prevPkg.coords;

  let bestPermutation = [...lookahead];
  let minTime = Infinity;
  let currentCost = 0;

  // Cost calculation
  let tempLoc = startCoords;
  lookahead.forEach(p => {
    currentCost += estimateTravelTime(tempLoc, p.coords);
    if(p.coords) tempLoc = p.coords;
  });

  const permute = (arr: Package[], m: Package[] = []) => {
    if (arr.length === 0) {
      let cost = 0;
      let loc = startCoords;
      m.forEach(p => {
        cost += estimateTravelTime(loc, p.coords);
        if(p.coords) loc = p.coords;
      });
      if (cost < minTime) {
        minTime = cost;
        bestPermutation = m;
      }
    } else {
      for (let i = 0; i < arr.length; i++) {
        let curr = arr.slice();
        let next = curr.splice(i, 1);
        permute(curr.slice(), m.concat(next));
      }
    }
  };

  permute(lookahead);

  const savings = currentCost - minTime;
  
  if (savings >= 3) {
    const newPending = [...bestPermutation, ...pending.slice(windowSize)];
    const history = packages.slice(0, pendingStartIndex);
    const fullProposal = [...history, ...newPending];
    const calculatedProposal = calculateTimeline(fullProposal);

    return {
      id: Date.now().toString(),
      type: 'SHORTCUT',
      savingsMinutes: Math.round(savings),
      message: `Znaleziono skrót (-${Math.round(savings)} min)`,
      affectedPackageIds: lookahead.map(p => p.id),
      proposedPackages: calculatedProposal
    };
  }

  return null;
};

export const initialClusterSort = (packages: Package[]): Package[] => {
  const sorted = [...packages].sort((a, b) => {
     if (a.priority && !b.priority) return -1;
     if (!a.priority && b.priority) return 1;
     
     // Handle missing coords in sort: push to end if missing
     if (!a.coords && !b.coords) return 0;
     if (!a.coords) return 1;
     if (!b.coords) return -1;

     return b.coords.lat - a.coords.lat;
  });
  return calculateTimeline(sorted);
};