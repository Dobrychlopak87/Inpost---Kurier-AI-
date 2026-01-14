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
  address: string;
  coords: Coordinates;
  priority: boolean;
  status: PackageStatus;
  estimatedTimeWindow?: string;
  calculatedEta?: string; // Np. "09:42"
  clusterId?: string; // ID dzielnicy/rejonu
  isLocked?: boolean; // Jeśli kurier ręcznie przesunął, AI tego nie dotyka
  
  // Nowe pole dla LabelIngestService
  // 1.0 = Pewny (Paczkomat, Historyczny GPS)
  // 0.5 = Przybliżony (Tylko ulica, brak numeru)
  // 0.0 = Nieznany (Surowy tekst z OCR)
  locationConfidence?: number; 
}

// "Pamięć Miasta" - zamiast uczyć się tras, uczymy się czasów odcinków
export interface CitySegment {
  fromId: string; // Hash lokalizacji A
  toId: string;   // Hash lokalizacji B
  durationMinutes: number;
  confidence: number; // Ile razy przejechaliśmy (0-100)
}

// Propozycja od Copilota
export interface CopilotSuggestion {
  id: string; // Unikalne ID sugestii
  type: 'SHORTCUT' | 'PRIORITY_FIX';
  savingsMinutes: number;
  message: string;
  affectedPackageIds: string[];
  proposedPackages: Package[]; // Gotowa, przeliczona lista do podmienienia
}

export interface AIState {
  isCalculating: boolean;
  suggestion: CopilotSuggestion | null;
}