import { Package, Coordinates, PackageStatus, CitySegment, CopilotSuggestion } from '../types';
import { DEPOT_COORDS } from '../constants';

// --- CITY MEMORY LAYER ---
// Symulacja bazy danych czasów przejazdu. W realu to byłby IndexedDB/SQLite.
const getCityMemory = (): CitySegment[] => {
  const stored = localStorage.getItem('inpost_city_memory');
  return stored ? JSON.parse(stored) : [];
};

// --- CORE UTILS ---

const calculateDistanceKm = (a: Coordinates, b: Coordinates): number => {
  const R = 6371; 
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
};

const estimateTravelTime = (a: Coordinates, b: Coordinates): number => {
  // 1. Sprawdź pamięć miasta (uproszczone)
  // const memory = getCityMemory();
  // ... logika wyszukiwania segmentu ...

  // 2. Fallback do heurystyki
  const dist = calculateDistanceKm(a, b);
  const baseSpeed = 25; // km/h (miasto)
  const timeHours = dist / baseSpeed;
  return Math.ceil(timeHours * 60) + 2; // +2 min na parkowanie/światła
};

// --- LOGIC: TIMELINE CALCULATOR ---

export const calculateTimeline = (route: Package[], startTime: Date = new Date()): Package[] => {
  let currentTime = startTime.getTime();
  let currentLoc = DEPOT_COORDS;

  // Znajdź pierwszą niedostarczoną paczkę, żeby wiedzieć skąd startujemy z czasem
  // Jeśli są już dostarczone, bierzemy czas ostatniej dostarczonej jako bazę?
  // Dla uproszczenia demo: zawsze liczymy "od teraz" dla pending.
  
  return route.map(pkg => {
    if (pkg.status !== PackageStatus.PENDING) {
        // Dla dostarczonych/nieudanych czyścimy ETA, bo to już historia
        return { ...pkg, calculatedEta: undefined }; 
    }

    const travelMin = estimateTravelTime(currentLoc, pkg.coords);
    const serviceMin = 3; // Czas doręczenia
    
    // Dodajemy czas dojazdu
    currentTime += travelMin * 60 * 1000;
    
    const etaDate = new Date(currentTime);
    const etaString = etaDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    
    // Aktualizacja pozycji kuriera i czasu (po doręczeniu)
    currentLoc = pkg.coords;
    currentTime += serviceMin * 60 * 1000;

    return { ...pkg, calculatedEta: etaString };
  });
};

// --- LOGIC: COPILOT ---

/**
 * Zamiast mieszać całą listę, Copilot patrzy na najbliższe 4 paczki (Sliding Window)
 * i sprawdza, czy ich permutacja daje zysk czasowy > 3 min.
 */
export const checkOptimizationOpportunity = async (packages: Package[]): Promise<CopilotSuggestion | null> => {
  const pendingStartIndex = packages.findIndex(p => p.status === PackageStatus.PENDING);
  if (pendingStartIndex === -1) return null;

  const pending = packages.filter(p => p.status === PackageStatus.PENDING);
  if (pending.length < 3) return null;

  // Analizujemy tylko najbliższe okno (sliding window)
  const windowSize = 4;
  const lookahead = pending.slice(0, windowSize);
  
  // Jeśli użytkownik "zablokował" kolejność (np. ręcznie przesunął), nie ruszamy
  if (lookahead.some(p => p.isLocked)) return null;

  // Znajdź punkt startowy (baza lub ostatnia dostarczona)
  let startCoords = DEPOT_COORDS;
  const prevPkg = packages[pendingStartIndex - 1];
  if (prevPkg) startCoords = prevPkg.coords;

  // Brute Force Permutacji (4 elementy = 24 opcje)
  let bestPermutation = [...lookahead];
  let minTime = Infinity;
  let currentCost = 0;

  // Koszt obecny
  let tempLoc = startCoords;
  lookahead.forEach(p => {
    currentCost += estimateTravelTime(tempLoc, p.coords);
    tempLoc = p.coords;
  });

  const permute = (arr: Package[], m: Package[] = []) => {
    if (arr.length === 0) {
      let cost = 0;
      let loc = startCoords;
      m.forEach(p => {
        cost += estimateTravelTime(loc, p.coords);
        loc = p.coords;
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
  
  // Reguła: Nie zawracaj głowy o 1 minutę.
  if (savings >= 3) {
    // Konstrukcja nowej listy
    const newPending = [...bestPermutation, ...pending.slice(windowSize)];
    
    // Odtwórz pełną listę zachowując historyczne (delivered)
    const history = packages.slice(0, pendingStartIndex);
    const fullProposal = [...history, ...newPending];

    // Przelicz ETA dla propozycji
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

// Sortowanie wstępne (klasteryzacja) - uruchamiane tylko raz na starcie
export const initialClusterSort = (packages: Package[]): Package[] => {
  const sorted = [...packages].sort((a, b) => {
     // Prosty sort: priorytety najpierw, potem geografia (scan-line)
     if (a.priority && !b.priority) return -1;
     if (!a.priority && b.priority) return 1;
     return b.coords.lat - a.coords.lat;
  });
  return calculateTimeline(sorted);
};