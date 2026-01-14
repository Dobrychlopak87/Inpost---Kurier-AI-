import { Package, PackageStatus, Coordinates } from '../types';
import { MAP_CENTER, DEPOT_COORDS } from '../constants';

// --- LOCAL DATA CACHE (Simulating offline knowledge) ---
const KNOWN_LOCKERS: Record<string, Coordinates> = {
  'KRO01A': { lat: 52.055, lng: 15.110 },
  'KRO05M': { lat: 52.035, lng: 15.080 },
  'KRO99P': { lat: 52.060, lng: 15.130 },
};

// --- TYPES ---

export type InputSource = 'SCAN' | 'MANUAL';

// --- LOGIC ---

/**
 * Creates a Package object from input data.
 * @param input Raw text from scanner or manual input
 * @param source Source of the data
 */
export const createPackageFromInput = (input: string, source: InputSource): Package => {
  const normalizedInput = input.trim();
  
  const pkgBase = {
    id: `PKG-${Math.floor(Math.random() * 100000)}`,
    status: PackageStatus.PENDING,
    priority: false,
    isLocked: true, // New packages are locked initially
    coords: MAP_CENTER, // Default center, will be masked by confidence level
    locationConfidence: 0.0
  };

  // 1. Try to detect Locker ID (e.g., "KRO01A" or "LOCKER:KRO01A")
  const lockerMatch = normalizedInput.match(/\b([A-Z]{3}[0-9]{2}[A-Z]|[A-Z]{3}[0-9]{3})\b/);
  if (lockerMatch) {
    const lockerId = lockerMatch[1];
    const coords = KNOWN_LOCKERS[lockerId];
    
    if (coords) {
      return {
        ...pkgBase,
        address: `Paczkomat ${lockerId}`,
        coords: coords,
        locationConfidence: 1.0,
        priority: true
      };
    } else {
      // Known pattern, unknown location
      return {
        ...pkgBase,
        address: `Paczkomat ${lockerId} (Lokalizacja nieznana)`,
        locationConfidence: 0.0, // Needs map pinning
        priority: true
      };
    }
  }

  // 2. Try to detect InPost Shipment ID (24 digits)
  const shipmentMatch = normalizedInput.match(/\b(\d{24})\b/);
  if (shipmentMatch) {
    return {
      ...pkgBase,
      id: shipmentMatch[1].slice(-8), // Show last 8 digits
      address: `Przesyłka ${shipmentMatch[1]}`,
      locationConfidence: 0.0 // No address data in barcode alone
    };
  }

  // 3. Fallback: Treat as manual address or raw text
  // In a real scenario, we might do offline fuzzy matching here against a street db
  const confidence = source === 'MANUAL' ? 0.5 : 0.0;
  
  return {
    ...pkgBase,
    address: normalizedInput || "Nieznana przesyłka",
    locationConfidence: confidence,
    coords: DEPOT_COORDS // Parking spot for unknown items
  };
};