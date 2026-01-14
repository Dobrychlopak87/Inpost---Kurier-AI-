import React from 'react';
import { Package, PackageStatus } from '../types';
import { Phone, CheckCircle, XCircle, MoreVertical, Lock, ArrowUp, ArrowDown } from 'lucide-react';

interface PackageItemProps {
  pkg: Package;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onStatusChange: (id: string, status: PackageStatus) => void;
}

export const PackageItem: React.FC<PackageItemProps> = ({ 
  pkg, index, isFirst, isLast, onMove, onStatusChange 
}) => {
  const isPending = pkg.status === PackageStatus.PENDING;
  const isDelivered = pkg.status === PackageStatus.DELIVERED;

  // --- COMPLETED ITEM (HISTORY) ---
  if (!isPending) {
    return (
      <div className="relative pl-12 py-3 opacity-60 grayscale transition-all duration-500">
        {/* Timeline Line (Solid for past) */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-600"></div>
        
        {/* Node */}
        <div className={`absolute left-[19px] top-4 w-3 h-3 rounded-full border-2 z-10 
          ${isDelivered ? 'bg-inpost-black border-green-500' : 'bg-inpost-black border-red-500'}`}>
        </div>

        <div className="flex justify-between items-center pr-4">
           <div>
              <span className="block text-xs font-mono text-gray-500 line-through">
                {pkg.id}
              </span>
              <span className="text-sm font-bold text-gray-400 line-through">{pkg.address}</span>
           </div>
           <span className={`text-[10px] font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded
             ${isDelivered ? 'text-green-500 border-green-900' : 'text-red-500 border-red-900'}`}>
              {isDelivered ? 'DORĘCZONE' : 'AWIZO'}
           </span>
        </div>
      </div>
    );
  }

  // --- ACTIVE ITEM (PENDING) ---
  return (
    <div className="relative pl-12 pr-2 py-2 group">
      
      {/* TIMELINE CONNECTOR */}
      {/* Górna część linii */}
      <div className={`absolute left-6 top-0 h-6 w-0.5 bg-gray-600`}></div>
      {/* Dolna część linii (dashed dla przyszłości) */}
      {!isLast && (
        <div className="absolute left-6 top-6 bottom-0 w-0.5 border-l-2 border-dotted border-gray-600"></div>
      )}
      
      {/* TIMELINE NODE */}
      <div className={`
        absolute left-[15px] top-6 w-5 h-5 rounded-full z-20 flex items-center justify-center shadow-lg transition-colors duration-300
        ${pkg.priority ? 'bg-red-600 animate-pulse' : 'bg-inpost-yellow'}
      `}>
        <span className="text-[10px] font-bold text-black">{index + 1}</span>
      </div>

      {/* CARD CONTENT */}
      <div className={`
        relative rounded-lg p-3 ml-2 shadow-md transition-all border-l-2
        ${pkg.priority ? 'bg-gradient-to-r from-red-900/10 to-transparent border-red-500' : 'bg-gray-800 border-inpost-yellow'}
        ${pkg.isLocked ? 'border-dashed border-gray-500' : ''}
      `}>
        
        {/* Header: Time & Address */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
               <span className="font-mono text-xl font-black text-white tracking-tight">
                 {pkg.calculatedEta || '--:--'}
               </span>
               {pkg.priority && <span className="text-[10px] bg-red-600 text-white px-1.5 rounded font-bold">PILNE</span>}
               {pkg.isLocked && <Lock size={10} className="text-gray-500" />}
            </div>
            <h3 className="text-sm font-semibold text-gray-200 leading-tight">{pkg.address}</h3>
          </div>

          {/* Reorder Buttons (Micro) */}
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={() => onMove(index, 'up')} className="p-1 hover:bg-gray-700 rounded text-gray-400"><ArrowUp size={14} /></button>
             <button onClick={() => onMove(index, 'down')} className="p-1 hover:bg-gray-700 rounded text-gray-400"><ArrowDown size={14} /></button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex gap-2 mt-3">
          <button 
             className="bg-gray-700 hover:bg-gray-600 text-blue-200 p-2 rounded flex-1 flex items-center justify-center transition-colors"
             title="Zadzwoń"
          >
             <Phone size={16} />
          </button>

          <button 
            onClick={() => onStatusChange(pkg.id, PackageStatus.DELIVERED)}
            className="flex-[3] bg-inpost-yellow hover:bg-yellow-400 text-black py-2 rounded flex items-center justify-center gap-2 text-sm font-black uppercase shadow-lg active:scale-95 transition-transform"
          >
            <CheckCircle size={16} /> Dostarcz
          </button>
          
          <button 
            onClick={() => onStatusChange(pkg.id, PackageStatus.FAILED)}
            className="bg-gray-700 hover:bg-gray-600 text-red-300 p-2 rounded flex-1 flex items-center justify-center transition-colors"
          >
            <XCircle size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};