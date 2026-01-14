import { Package, PackageStatus } from './types';

// Centrum Krosna Odrzańskiego
export const MAP_CENTER = { lat: 52.048, lng: 15.100 }; 

// Granice obejmujące całe miasto (skalibrowane pod aspect ratio ~1.4)
export const MAP_BOUNDS = {
  minLat: 52.030,
  maxLat: 52.065,
  minLng: 15.070,
  maxLng: 15.140
};

// Baza InPost (fikcyjna lokalizacja na obrzeżach przemysłowych)
export const DEPOT_COORDS = { lat: 52.035, lng: 15.130 };

// Helper dla losowych współrzędnych w obrębie miasta
const randomCoord = () => {
  const lat = MAP_BOUNDS.minLat + Math.random() * (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);
  const lng = MAP_BOUNDS.minLng + Math.random() * (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);
  return { lat, lng };
};

export const INITIAL_PACKAGES: Package[] = [
  // Rzeczywiste ulice w Krośnie Odrzańskim
  { 
    id: 'PKG-101', 
    address: 'ul. Poznańska 12', 
    coords: { lat: 52.052, lng: 15.105 }, 
    priority: true, 
    status: PackageStatus.PENDING, 
    estimatedTimeWindow: '10:00 - 11:00' 
  },
  { 
    id: 'PKG-102', 
    address: 'ul. Piastów 5', 
    coords: { lat: 52.048, lng: 15.112 }, 
    priority: false, 
    status: PackageStatus.PENDING, 
    estimatedTimeWindow: '11:00 - 11:15' 
  },
  { 
    id: 'PKG-103', 
    address: 'ul. Bohaterów WP 22', 
    coords: { lat: 52.051, lng: 15.095 }, 
    priority: true, 
    status: PackageStatus.PENDING, 
    estimatedTimeWindow: '09:30 - 10:00' 
  },
  { 
    id: 'PKG-104', 
    address: 'ul. Słoneczna 8', 
    coords: { lat: 52.040, lng: 15.085 }, 
    priority: false, 
    status: PackageStatus.PENDING 
  },
  { 
    id: 'PKG-105', 
    address: 'ul. 1 Maja 45', 
    coords: { lat: 52.058, lng: 15.090 }, 
    priority: false, 
    status: PackageStatus.PENDING 
  },
];

export const TOAST_DURATION = 3000;