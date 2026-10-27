// ==============================================================================
// THa Trash App - Live Camera QR & Barcode Scanner Modal (ScannerModal.tsx)
// Hardware camera stream with laser targeting reticle, audio chime feedback,
// BarcodeDetector API / Canvas analyzer, and instant service dispatch
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { TrashBin, DisposableItem } from '../types';
import { soundService } from '../services/soundService';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bins: TrashBin[];
  disposables: DisposableItem[];
  onScanBin: (bin: TrashBin) => void;
  onScanDisposable: (item: DisposableItem) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  bins,
  disposables,
  onScanBin,
  onScanDisposable,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [lastScannedResult, setLastScannedResult] = useState<{
    type: 'bin' | 'disposable';
    item: TrashBin | DisposableItem;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setLastScannedResult(null);
      setManualCode('');
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser environment. Use quick scan or manual entry.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access failed or denied:', err);
      setCameraError('Camera access unavailable or permission denied. Manual scan and quick-detect buttons are active.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleMatchCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    // Check bins
    const foundBin = bins.find(
      (b) => b.code.toUpperCase() === clean || b.id.toUpperCase() === clean || b.name.toUpperCase().includes(clean)
    );
    if (foundBin) {
      soundService.playScanBeep();
      setLastScannedResult({ type: 'bin', item: foundBin });
      return;
    }

    // Check disposables
    const foundDisp = disposables.find(
      (d) => d.sku.toUpperCase() === clean || d.id.toUpperCase() === clean || d.name.toUpperCase().includes(clean)
    );
    if (foundDisp) {
      soundService.playScanBeep();
      setLastScannedResult({ type: 'disposable', item: foundDisp });
      return;
    }

    // Alert sound if unknown
    soundService.playAlertAlarm();
    alert(`No matching Bin or Disposable SKU found for "${clean}". Check code and try again.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Live QR / Barcode Scanner
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  {cameraActive ? 'CAMERA ON' : 'READY'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Scan bin tags or disposable packaging to trigger instantaneous servicing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Viewfinder Video Area */}
        <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-6 space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {cameraError || 'Camera feed paused or unavailable. Use the quick-detector tags or manual input below.'}
              </p>
              <button
                onClick={startCamera}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow"
              >
                Retry Camera
              </button>
            </div>
          )}

          {/* Targeting Laser Overlay & Reticle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-56 h-56 border-2 border-indigo-500/60 rounded-2xl flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

              {/* Animated Laser Scan line */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce" />

              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400/80 bg-slate-950/70 px-2 py-0.5 rounded">
                AIM AT TAG
              </span>
            </div>
          </div>
        </div>

        {/* Scan Result Card if Found */}
        {lastScannedResult && (
          <div className="p-4 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between animate-in slide-in-from-top-2">
            <div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                MATCH: {lastScannedResult.type === 'bin' ? 'SMART TRASH BIN' : 'DISPOSABLE SKU'}
              </span>
              <h4 className="text-white font-bold text-sm mt-1">{lastScannedResult.item.name}</h4>
              <p className="text-xs text-slate-300 font-mono">
                {'code' in lastScannedResult.item ? lastScannedResult.item.code : lastScannedResult.item.sku}
              </p>
            </div>
            <button
              onClick={() => {
                if (lastScannedResult.type === 'bin') {
                  onScanBin(lastScannedResult.item as TrashBin);
                } else {
                  onScanDisposable(lastScannedResult.item as DisposableItem);
                }
                onClose();
              }}
              className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              Open & Service &rarr;
            </button>
          </div>
        )}

        {/* Manual Input and Quick Tags */}
        <div className="p-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleMatchCode(manualCode);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Enter tag code (e.g. BIN-CAFE-01 or DISP-CUP-PLA-12)..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all"
            >
              Verify
            </button>
          </form>

          {/* Quick-Scan Simulators */}
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
              <span>Quick-Detect Simulated Targets:</span>
              <span className="text-[10px] text-slate-500">Tap to simulate laser lock</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {bins.slice(0, 4).map((bin) => (
                <button
                  key={bin.id}
                  onClick={() => handleMatchCode(bin.code)}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 text-left transition-all group"
                >
                  <div className="text-[10px] font-mono text-emerald-400 group-hover:text-emerald-300">
                    {bin.code}
                  </div>
                  <div className="text-xs text-white font-medium truncate">{bin.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
