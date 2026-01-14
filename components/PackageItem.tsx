import React, { useState } from 'react';
import { Package, PackageStatus } from '../types';
import { Phone, CheckCircle, XCircle, Lock, ArrowUp, ArrowDown, AlertTriangle, HelpCircle, Pencil, Save, X } from 'lucide-react';

interface PackageItemProps {
  pkg: Package;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onStatusChange: (id: string, status: PackageStatus) => void;
  onUpdate: (id: string, newAddress: string) => void;
}

export const PackageItem: React.FC<PackageItemProps> = ({ 
  pkg, index, isFirst, isLast, onMove, onStatusChange, onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(pkg.address || '');

  const isPending = pkg.status === PackageStatus.PENDING;
  const isDelivered = pkg.status === PackageStatus.DELIVERED;

  // --- LOGIC: Confidence Display ---
  const confidence = pkg.locationConfidence ?? 1.0;
  
  let ConfidenceIcon = null;
  let borderColorClass = "border-inpost-yellow";
  let bgClass = "bg-gray-800";

  if (confidence === 0.5) {
     ConfidenceIcon = <AlertTriangle size={14} className="text-inpost-yellow" />;
     borderColorClass = "border-orange-500";
  } else if (confidence === 0.0) {
     ConfidenceIcon = <HelpCircle size={14} className="text-red-500" />;
     borderColorClass = "border-red-500";
     bgClass = "bg-red-900/20";
  }

  const handleSave = () => {
    if (editValue.trim()) {
      onUpdate(pkg.id, editValue);
      setIsEditing(false);
    }
  };

  const startEditing = () => {
    setEditValue(pkg.address || pkg.shipmentId || '');
    setIsEditing(true);
  };

  // --- COMPLETED ITEM (HISTORY) ---
  if (!isPending) {
    return (
      <div className="relative pl-12 py-3 opacity-60 grayscale transition-all duration-500">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-600"></div>
        <div className={`absolute left-[19px] top-4 w-3 h-3 rounded-full border-2 z-10 
          ${isDelivered ? 'bg-inpost-black border-green-500' : 'bg-inpost-black border-red-500'}`}>
        </div>
        <div className="flex justify-between items-center pr-4">
           <div>
              <span className="block text-xs font-mono text-gray-500 line-through">{pkg.id}</span>
              <span className="text-sm font-bold text-gray-400 line-through">{pkg.address || pkg.shipmentId}</span>
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
      
      {/* Connector Line */}
      <div className={`absolute left-6 top-0 h-6 w-0.5 bg-gray-600`}></div>
      {!isLast && (
        <div className="absolute left-6 top-6 bottom-0 w-0.5 border-l-2 border-dotted border-gray-600"></div>
      )}
      
      {/* Node Circle */}
      <div className={`
        absolute left-[15px] top-6 w-5 h-5 rounded-full z-20 flex items-center justify-center shadow-lg transition-colors duration-300
        ${pkg.priority ? 'bg-red-600 animate-pulse' : 'bg-inpost-yellow'}
      `}>
        <span className="text-[10px] font-bold text-black">{index + 1}</span>
      </div>

      {/* CARD CONTENT */}
      <div className={`
        relative rounded-lg p-3 ml-2 shadow-md transition-all border-l-2
        ${pkg.priority ? 'bg-gradient-to-r from-red-900/10 to-transparent border-red-500' : bgClass}
        ${pkg.isLocked ? 'border-dashed' : ''}
        ${borderColorClass}
      `}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-0.5">
               <span className="font-mono text-xl font-black text-white tracking-tight">
                 {pkg.calculatedEta || '--:--'}
               </span>
               {pkg.priority && <span className="text-[10px] bg-red-600 text-white px-1.5 rounded font-bold">PILNE</span>}
               {pkg.isLocked && <Lock size={10} className="text-gray-500" />}
               
               {/* Confidence Warning */}
               {ConfidenceIcon && !isEditing && (
                  <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded border border-gray-600 ml-auto">
                     {ConfidenceIcon}
                     <span className="text-[9px] uppercase font-bold text-gray-300">
                        {confidence === 0.5 ? 'SPRAWDŹ ADRES' : 'BŁĄD DANYCH'}
                     </span>
                  </div>
               )}
            </div>
            
            {/* ADDRESS or EDIT FIELD */}
            {isEditing ? (
              <div className="mt-2 flex gap-2">
                 <input 
                    type="text" 
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 bg-black border border-gray-500 text-sm text-white px-2 py-1 rounded focus:border-inpost-yellow focus:outline-none"
                    placeholder="Wpisz poprawny adres..."
                    autoFocus
                 />
                 <button onClick={handleSave} className="bg-green-600 p-1.5 rounded text-white hover:bg-green-500">
                    <Save size={16} />
                 </button>
                 <button onClick={() => setIsEditing(false)} className="bg-gray-700 p-1.5 rounded text-white hover:bg-gray-600">
                    <X size={16} />
                 </button>
              </div>
            ) : (
              <div className="flex items-start justify-between mt-1">
                 <h3 className={`text-sm font-semibold leading-tight flex-1 ${confidence === 0.0 ? 'text-red-300 italic' : 'text-gray-200'}`}>
                    {pkg.address || `Przesyłka ${pkg.shipmentId || 'Nieznana'}`}
                 </h3>
                 
                 {/* Edit Button for low confidence */}
                 {confidence < 1.0 && (
                    <button onClick={startEditing} className="ml-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-inpost-yellow">
                       <Pencil size={14} />
                    </button>
                 )}
              </div>
            )}
            
            {!isEditing && (
              <div className="text-[10px] font-mono text-gray-500 mt-1 flex gap-2">
                 <span>{pkg.id}</span>
                 {confidence < 1.0 && <span className="text-inpost-yellow"> • Lokalizacja przybliżona</span>}
              </div>
            )}

            {/* Critical Warning Flag */}
            {pkg.locationConfidence < 1 && !isEditing && (
              <span style={{ color: "orange", fontWeight: "bold", fontSize: "10px", display: "block", marginTop: "4px" }}>
                Brak potwierdzonej lokalizacji – sprawdź adres
              </span>
            )}
          </div>

          {!isEditing && (
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
               <button onClick={() => onMove(index, 'up')} className="p-1 hover:bg-gray-700 rounded text-gray-400"><ArrowUp size={14} /></button>
               <button onClick={() => onMove(index, 'down')} className="p-1 hover:bg-gray-700 rounded text-gray-400"><ArrowDown size={14} /></button>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex gap-2 mt-3">
          <button className="bg-gray-700 hover:bg-gray-600 text-blue-200 p-2 rounded flex-1 flex items-center justify-center transition-colors">
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