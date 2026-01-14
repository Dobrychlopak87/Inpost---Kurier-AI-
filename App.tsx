import React, { useState, useEffect } from 'react';
import { Package, PackageStatus, CopilotSuggestion } from './types';
import { INITIAL_PACKAGES, TOAST_DURATION, MAP_CENTER } from './constants';
import { initialClusterSort, calculateTimeline, checkOptimizationOpportunity } from './services/aiService';
import MapVisualizer from './components/MapVisualizer';
import { PackageItem } from './components/PackageItem';
import { Scan, AlertTriangle, CheckCircle, Navigation, Sparkles, X } from 'lucide-react';

const App: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>(INITIAL_PACKAGES);
  const [suggestion, setSuggestion] = useState<CopilotSuggestion | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initial Cluster Sort (Run once)
  useEffect(() => {
    const sorted = initialClusterSort(INITIAL_PACKAGES);
    setPackages(sorted);
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), TOAST_DURATION);
  };

  // --- CORE WORKFLOW ---

  const handleStatusChange = async (id: string, newStatus: PackageStatus) => {
    // 1. Update status locally
    const updatedList = packages.map(p => 
      p.id === id ? { ...p, status: newStatus } : p
    );
    
    // 2. Recalculate Timeline (Synchronous, fast)
    // We do NOT reorder, just update ETAs for remaining items
    const withTimeline = calculateTimeline(updatedList);
    setPackages(withTimeline);

    // 3. Trigger Passive Copilot Check (Async)
    // Runs in background to see if remaining route can be optimized
    checkForOptimization(withTimeline);
  };

  const checkForOptimization = async (currentPackages: Package[]) => {
    setIsProcessing(true);
    // Simulate async calculation
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

    // Swap
    [newPackages[index], newPackages[targetIndex]] = [newPackages[targetIndex], newPackages[index]];
    
    // Mark as Locked (Copilot won't touch these)
    newPackages[index].isLocked = true;
    newPackages[targetIndex].isLocked = true;

    // Recalculate times only
    const withTimeline = calculateTimeline(newPackages);
    setPackages(withTimeline);
    
    // Clear any existing suggestions as context changed
    setSuggestion(null);
  };

  const simulateScan = () => {
    const newPkg: Package = {
        id: `PKG-${Math.floor(Math.random() * 9000) + 1000}`,
        address: 'ul. Kolejowa 3 (Skan)',
        coords: { lat: MAP_CENTER.lat + 0.005, lng: MAP_CENTER.lng - 0.005 },
        priority: false,
        status: PackageStatus.PENDING,
        isLocked: true // Newly scanned are locked to end by default until optimized
    };
    
    // Add to end of pending
    const pendingIdx = packages.findIndex(p => p.status === PackageStatus.PENDING);
    let newList = [...packages];
    
    if (pendingIdx === -1) {
        newList.push(newPkg);
    } else {
        // Find end of pending
        newList.splice(newList.length, 0, newPkg);
    }

    const withTimeline = calculateTimeline(newList);
    setPackages(withTimeline);
    showNotification("Dodano paczkę. Sprawdzam trasę...");
    
    checkForOptimization(withTimeline);
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
         <button onClick={simulateScan} className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors border border-gray-600 mx-1">
            <Scan size={16} className="text-inpost-yellow" /> Skanuj nową paczkę
         </button>
      </div>

      {/* SUGGESTION BANNER (The "Copilot" Interface) */}
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
           {/* Decor */}
           <div className="absolute -right-4 -bottom-8 text-blue-800/20 rotate-12">
             <Navigation size={80} />
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

    </div>
  );
};

export default App;