import React, { useState } from 'react';
import { Type, X, ScanLine, ArrowRight } from 'lucide-react';
import CameraScanner from './CameraScanner';
import { ingestLabel } from '../services/labelIngestService';
import { Package } from '../types';

interface AddPackageModalProps {
  onAdd: (pkg: Package) => void;
  onClose: () => void;
}

export const AddPackageModal: React.FC<AddPackageModalProps> = ({ onAdd, onClose }) => {
  const [mode, setMode] = useState<'SELECT' | 'SCAN' | 'MANUAL'>('SELECT');
  const [manualInput, setManualInput] = useState('');

  const handleScanResult = (data: string) => {
    const pkg = ingestLabel(data);
    onAdd(pkg);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const pkg = ingestLabel(manualInput);
    onAdd(pkg);
    onClose();
  };

  if (mode === 'SCAN') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
        <CameraScanner onScan={handleScanResult} onCancel={() => setMode('SELECT')} />
        
        {/* UI Overlay for Camera */}
        <button 
          onClick={() => setMode('SELECT')} 
          className="absolute top-4 right-4 bg-gray-800 p-2 rounded-full text-white z-50"
        >
          <X size={24} />
        </button>
        <div className="absolute inset-0 pointer-events-none border-2 border-inpost-yellow opacity-50 m-12 rounded-lg animate-pulse"></div>
        <p className="absolute bottom-10 bg-black/60 text-white px-4 py-2 rounded-full font-mono text-sm z-50 pointer-events-none">
          Zeskanuj etykietę InPost
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-gray-900 w-full max-w-sm rounded-xl border border-gray-700 shadow-2xl overflow-hidden animate-fade-in-up">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Dodaj paczkę</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {mode === 'SELECT' && (
            <div className="grid gap-4">
              <button 
                onClick={() => setMode('SCAN')}
                className="flex items-center gap-4 bg-inpost-yellow p-4 rounded-lg text-black hover:bg-yellow-400 transition-colors group"
              >
                <div className="bg-black/10 p-3 rounded-full">
                  <ScanLine size={24} />
                </div>
                <div className="text-left">
                  <span className="block font-black text-lg uppercase tracking-wider">Skanuj etykietę</span>
                  <span className="text-xs font-semibold opacity-70">Kamera QR / Barcode</span>
                </div>
              </button>

              <button 
                onClick={() => setMode('MANUAL')}
                className="flex items-center gap-4 bg-gray-800 p-4 rounded-lg text-white hover:bg-gray-700 transition-colors border border-gray-700"
              >
                <div className="bg-black/30 p-3 rounded-full text-gray-400">
                  <Type size={24} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-md">Wpisz ręcznie</span>
                  <span className="text-xs text-gray-500">Adres lub numer paczki</span>
                </div>
              </button>
            </div>
          )}

          {mode === 'MANUAL' && (
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Adres lub ID</label>
                <input 
                  autoFocus
                  type="text" 
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="np. ul. Kolejowa 5 lub ID paczkomatu"
                  className="w-full bg-black border border-gray-600 rounded p-3 text-white focus:border-inpost-yellow focus:outline-none"
                />
              </div>
              <button 
                type="submit" 
                className="bg-white text-inpost-black font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-gray-200"
              >
                Zapisz paczkę <ArrowRight size={16} />
              </button>
              <button 
                type="button" 
                onClick={() => setMode('SELECT')}
                className="text-gray-500 text-sm hover:text-white"
              >
                Wróć do wyboru
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};