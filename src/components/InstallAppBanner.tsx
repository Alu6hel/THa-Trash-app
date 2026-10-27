// ==============================================================================
// THa Trash App - PWA Install App Banner (InstallAppBanner.tsx)
// Provides 1-click native installation for Mobile (Android/iOS) and Desktop
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle2, Share } from 'lucide-react';
import { soundService } from '../services/soundService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      soundService.playSuccessChime();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      soundService.playScanBeep();
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        soundService.playFanfare();
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(!showIosGuide);
    } else {
      // Fallback instruction
      alert('To install, tap your browser menu (⋮ or Share) and select "Install app" or "Add to Home Screen".');
    }
  };

  if (isInstalled || isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border-b border-emerald-500/30 px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">Install THa Trash App</span>
            <span className="text-slate-400 hidden sm:inline ml-1.5">
              • Fast 1-tap home screen access & 100% offline in-your-area map
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isIos && showIosGuide ? (
            <div className="bg-slate-800 text-slate-200 px-3 py-1 rounded-lg border border-slate-700 text-[11px] flex items-center gap-1.5">
              <span>Tap</span>
              <Share className="w-3.5 h-3.5 text-blue-400" />
              <span>then select <strong>Add to Home Screen</strong></span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
