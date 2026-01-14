import React, { useMemo } from 'react';
import { Package, PackageStatus, Coordinates } from '../types';
import { MAP_BOUNDS, DEPOT_COORDS } from '../constants';

interface MapVisualizerProps {
  packages: Package[];
  currentLocation?: Coordinates;
}

const MapVisualizer: React.FC<MapVisualizerProps> = ({ packages, currentLocation = DEPOT_COORDS }) => {
  // Normalize coordinates to 0-100 SVG space
  const normalize = (lat: number, lng: number) => {
    const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
    const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
    return { x, y };
  };

  const pendingPackages = useMemo(() => 
    packages.filter(p => p.status === PackageStatus.PENDING), 
  [packages]);

  // Generate path string only for packages with location confidence > 0
  const pathData = useMemo(() => {
    const mappedPackages = pendingPackages.filter(p => (p.locationConfidence ?? 1.0) > 0);
    if (mappedPackages.length === 0) return '';
    
    const start = normalize(currentLocation.lat, currentLocation.lng);
    let d = `M ${start.x} ${start.y}`;
    
    mappedPackages.forEach(p => {
      const point = normalize(p.coords.lat, p.coords.lng);
      d += ` L ${point.x} ${point.y}`;
    });
    
    return d;
  }, [pendingPackages, currentLocation]);

  // OpenStreetMap Bounding Box
  const bbox = `${MAP_BOUNDS.minLng},${MAP_BOUNDS.minLat},${MAP_BOUNDS.maxLng},${MAP_BOUNDS.maxLat}`;

  return (
    <div className="w-full aspect-[4/3] bg-inpost-gray rounded-lg overflow-hidden relative shadow-inner border border-gray-700">
      {/* Real Map Background */}
      <div className="absolute inset-0 z-0 opacity-70 grayscale contrast-125">
         <iframe 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            scrolling="no" 
            marginHeight={0} 
            marginWidth={0} 
            title="Mapa Krosna Odrzańskiego"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${DEPOT_COORDS.lat},${DEPOT_COORDS.lng}`} 
            style={{ pointerEvents: 'none' }}
         ></iframe>
      </div>
      
      {/* SVG Overlay */}
      <svg className="w-full h-full relative z-10 p-0" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Route Line */}
        <path d={pathData} fill="none" stroke="#FFCC00" strokeWidth="1" strokeDasharray="3" className="animate-pulse shadow-lg" style={{ filter: 'drop-shadow(0px 0px 1px rgba(0,0,0,1))' }} />

        {/* Depot */}
        {(() => {
          const { x, y } = normalize(DEPOT_COORDS.lat, DEPOT_COORDS.lng);
          return (
            <g key="depot">
               <circle cx={x} cy={y} r="3" fill="#fff" stroke="#000" strokeWidth="1" />
               <text x={x} y={y - 4} fill="#fff" fontSize="3" fontWeight="bold" textAnchor="middle" style={{ textShadow: '0px 0px 3px #000' }}>BAZA</text>
            </g>
          );
        })()}

        {/* Packages */}
        {packages.map((pkg) => {
          if (pkg.status !== PackageStatus.PENDING && pkg.status !== PackageStatus.FAILED) return null;
          
          // Don't render marker if we don't know where it is
          if ((pkg.locationConfidence ?? 1.0) === 0) return null;

          const { x, y } = normalize(pkg.coords.lat, pkg.coords.lng);
          const isNext = pkg.id === pendingPackages[0]?.id;
          
          return (
            <g key={pkg.id} className="transition-all duration-500 ease-in-out">
              {isNext && (
                <circle cx={x} cy={y} r="8" fill="#FFCC00" opacity="0.3" className="animate-ping" />
              )}
              
              <circle 
                cx={x} 
                cy={y} 
                r={isNext ? "4" : "2.5"} 
                fill={pkg.priority ? "#ef4444" : "#FFCC00"} 
                stroke="#000"
                strokeWidth="0.5"
              />
              <text x={x} y={y - 4} fill={pkg.priority ? "#ef4444" : "#FFCC00"} fontSize="3.5" fontWeight="bold" textAnchor="middle" style={{ textShadow: '0px 0px 3px #000' }}>
                {packages.indexOf(pkg) + 1}
              </text>
            </g>
          );
        })}
      </svg>
      
      <div className="absolute top-2 left-2 bg-black/80 text-[10px] px-2 py-1 rounded text-white font-mono border border-gray-600">
        KROSNO ODRZAŃSKIE
      </div>
      <div className="absolute bottom-2 right-2 bg-inpost-yellow text-inpost-black text-[10px] px-2 py-1 rounded font-bold border border-black shadow-lg animate-pulse">
        LIVE: NISKIE NATĘŻENIE
      </div>
    </div>
  );
};

export default MapVisualizer;