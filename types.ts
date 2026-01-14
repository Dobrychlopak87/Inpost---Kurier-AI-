export enum PackageStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Package {
  id: string;
  shipmentId?: string; // ID from barcode
  address?: string; // Optional: might be unknown for barcode scans
  coords?: Coordinates; // Optional: scanning might not yield GPS
  priority: boolean;
  status: PackageStatus;
  estimatedTimeWindow?: string;
  calculatedEta?: string;
  clusterId?: string;
  isLocked?: boolean;
  
  // 1.0 = Locker/GPS, 0.5 = Address text, 0.0 = Raw ID
  locationConfidence: number; 
}

export interface CitySegment {
  fromId: string;
  toId: string;
  durationMinutes: number;
  confidence: number;
}

export interface CopilotSuggestion {
  id: string;
  type: 'SHORTCUT' | 'PRIORITY_FIX';
  savingsMinutes: number;
  message: string;
  affectedPackageIds: string[];
  proposedPackages: Package[];
}

export interface AIState {
  isCalculating: boolean;
  suggestion: CopilotSuggestion | null;
}