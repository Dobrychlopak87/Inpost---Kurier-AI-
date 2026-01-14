import React, { useState, useEffect } from 'react';
import { Package, PackageStatus, CopilotSuggestion } from './types';
import { INITIAL_PACKAGES, TOAST_DURATION } from './constants';
import { initialClusterSort, calculateTimeline, checkOptimizationOpportunity } from './services/aiService';
import { AddPackageModal } from './components/AddPackageModal';
import MapVisualizer from './components/MapVisualizer';
import { PackageItem } from './components/PackageItem';
import { Scan, AlertTriangle, CheckCircle, Navigation, Sparkles, X, Plus } from 'lucide-react';

const STORAGE_KEY = 'inpost_packages_v1';

const App: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [suggestion, setSuggestion] = useState<CopilotSuggestion | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load from Storage or Initial
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setPackages(JSON.parse(saved));
    } else {
      const sorted = initialClusterSort(INITIAL_PACKAGES);
      setPackages(sorted);
    }
  }, []);

  // Save to Storage on change
  useEffect(() => {
    if (packages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
    }
  }, [packages]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), TOAST_DURATION);
  };

  const handleStatusChange = async (id: string, newStatus: PackageStatus) => {
    const updatedList = packages.map(p => 
      p.id === id ? { ...p, status: newStatus } : p
    );
    const withTimeline = calculateTimeline(updatedList);
    setPackages(withTimeline);
    checkForOptimization(withTimeline);
  };

  const checkForOptimization = async (currentPackages: Package[]) => {
    setIsProcessing(true);
    setTimeout(async () => {
        const result = await checkOptimizationOpportunity(currentPackages);
        if (result) {
            setSuggestion(result);
        }
        setIsProcessing(false);
    }, 800);
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    setPackages(suggestion.proposedPackages);
    setSuggestion(null);
    showNotification(`Zastosowano skrót! Oszczędzasz ${suggestion.savingsMinutes} min.`);
  };

  const dismissSuggestion = () => {
    setSuggestion(null);
  };

  const handleManualMove = (index: number, direction: 'up' | 'down') => {
    const newPackages = [...packages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPackages.length) return;

    [newPackages[index], newPackages[targetIndex]] = [newPackages[targetIndex], newPackages[index]];
    newPackages[index].isLocked = true;
    newPackages[targetIndex].isLocked = true;

    const withTimeline = calculateTimeline(newPackages);
    setPackages(withTimeline);
    setSuggestion(null);
  };

  const handleAddPackage = (newPkg: Package) => {
    // Insert new package at end of pending list
    const pendingIdx = packages.findIndex(p => p.status === PackageStatus.PENDING);
    let newList = [...packages];
    
    if (pendingIdx === -1) {
        newList.push(newPkg);
    } else {
        // If high priority/confidence, put closer to top, else append
        if (newPkg.priority) {
           newList.splice(pendingIdx, 0, newPkg);
        } else {
           const lastPendingIdx = packages.map(p => p.status).lastIndexOf(PackageStatus.PENDING);
           newList.splice(lastPendingIdx + 1, 0, newPkg);
        }
    }

    const withTimeline = calculateTimeline(newList);
    setPackages(withTimeline);
    
    // Feedback logic
    if (newPkg.locationConfidence === 1.0) {
        showNotification("Paczka dodana (Lokalizacja pewna)");
    } else if (newPkg.locationConfidence === 0.0) {
        showNotification("Paczka dodana. Uzupełnij adres!");
    } else {
        showNotification("Paczka dodana");
    }
  };

  const pendingCount = packages.filter(p => p.status === PackageStatus.PENDING).length;

  return (
    <div className="h-screen flex flex-col max-w-md mx-auto bg-inpost-black border-x border-gray-800 shadow-2xl relative">
      
      {/* Header */}
      <header className="bg-inpost-yellow text-inpost-black p-4 flex justify-between items-center z-20 shadow-md">
        <div>
          <h1 className="font-black text-xl tracking-tighter flex items-center gap-2">
            InPost <span className="text-xs bg-black text-white px-1.5 py-0.5 rounded font-mono">COPILOT</span>
          </h1>
          <p className="text-xs font-semibold opacity-80">Krosno Odrzańskie • {pendingCount} PACZEK</p>
        </div>
        <div className="flex gap-2">
           <button className="p-2 rounded-full border border-black/10 bg-transparent hover:bg-black/5">
              <Navigation size={20} />
           </button>
        </div>
      </header>

      {/* Map Area */}
      <div className="relative z-10 bg-gray-900 border-b border-gray-800">
        <MapVisualizer packages={packages} />
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center p-2 bg-inpost-gray border-b border-gray-700">
         <button 
           onClick={() => setIsModalOpen(true)} 
           className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-200 text-black py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors shadow-lg active:scale-95"
         >
            <Plus size={18} /> Dodaj paczkę
         </button>
      </div>

      {/* SUGGESTION BANNER */}
      {suggestion && (
        <div className="mx-3 mt-3 bg-gradient-to-r from-blue-900 to-inpost-gray border border-blue-500 rounded-lg p-3 flex items-center justify-between shadow-xl animate-fade-in relative overflow-hidden">
           <div className="relative z-10 flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-full text-white animate-pulse">
                 <Sparkles size={18} fill="currentColor" />
              </div>
              <div>
                 <h4 className="font-bold text-white text-sm">Zoptymalizować trasę?</h4>
                 <p className="text-blue-200 text-xs">{suggestion.message}</p>
              </div>
           </div>
           <div className="relative z-10 flex items-center gap-2">
              <button onClick={dismissSuggestion} className="p-2 text-gray-400 hover:text-white"><X size={16}/></button>
              <button 
                onClick={applySuggestion}
                className="bg-white text-blue-900 px-3 py-1.5 rounded font-bold text-xs shadow hover:bg-gray-100"
              >
                Zastosuj
              </button>
           </div>
        </div>
      )}

      {/* TIMELINE LIST */}
      <div className="flex-1 overflow-y-auto p-2 pb-24 scroll-smooth">
        {packages.map((pkg, index) => (
          <PackageItem 
            key={pkg.id} 
            pkg={pkg} 
            index={index}
            isFirst={index === 0}
            isLast={index === packages.length - 1}
            onMove={handleManualMove}
            onStatusChange={handleStatusChange}
          />
        ))}
        
        {pendingCount === 0 && (
            <div className="text-center py-10 opacity-50">
                <div className="inline-block p-4 rounded-full bg-green-900/30 mb-2 border border-green-800">
                    <CheckCircle size={40} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Trasa zakończona</h3>
                <p className="text-gray-400 text-sm">Brak aktywnych zleceń.</p>
            </div>
        )}
      </div>

      {/* Floating Notifications */}
      <div className="absolute bottom-4 left-4 right-4 z-30 pointer-events-none">
         {notification && (
           <div className="bg-white text-inpost-black px-4 py-3 rounded shadow-2xl flex items-center gap-3 animate-bounce border-l-4 border-inpost-yellow">
              <AlertTriangle size={20} className="text-inpost-yellow fill-black" />
              <span className="font-bold text-sm">{notification}</span>
           </div>
         )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <AddPackageModal 
          onAdd={handleAddPackage} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

    </div>
  );
};

export default App;