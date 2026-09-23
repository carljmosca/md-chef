import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, ChefHat, Download } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showNativePrompt, setShowNativePrompt] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Check if user dismissed prompt previously in this session or last 7 days
    const dismissedAt = localStorage.getItem('md_chef_dismiss_install_prompt');
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        return;
      }
    }

    // 3. Detect iOS device
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
      // Delay slightly so user sees the page first
      const timer = setTimeout(() => {
        setShowIOSPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // 4. For Android / Chrome / Edge: Listen to beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowNativePrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleDismiss = () => {
    setShowIOSPrompt(false);
    setShowNativePrompt(false);
    localStorage.setItem('md_chef_dismiss_install_prompt', Date.now().toString());
  };

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowNativePrompt(false);
    }
    setDeferredPrompt(null);
  };

  // iOS Safari Prompt
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 bg-stone-900 text-stone-100 border border-stone-700/80 rounded-3xl p-5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-300">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center shadow-md">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-white">
                Install MD-Chef on iPhone
              </h4>
              <p className="text-[11px] text-stone-400">
                Install for offline cooking and full screen mode
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step by step guide */}
        <div className="bg-stone-800/80 rounded-2xl p-3 space-y-2 text-xs text-stone-300 border border-stone-700/50">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 font-bold text-[11px] flex items-center justify-center shrink-0">
              1
            </span>
            <span className="flex-1 flex items-center gap-1.5 flex-wrap">
              Tap the Safari <strong className="text-white flex items-center gap-1"><Share className="w-3.5 h-3.5 text-brand-400" /> Share</strong> button below
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 font-bold text-[11px] flex items-center justify-center shrink-0">
              2
            </span>
            <span className="flex-1 flex items-center gap-1.5 flex-wrap">
              Scroll down and tap <strong className="text-white flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-brand-400" /> Add to Home Screen</strong>
            </span>
          </div>
        </div>

        {/* Downward Indicator pointing towards Safari bottom nav on iPhone */}
        <div className="mt-3 pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
          <span className="text-brand-400 font-medium">↓ Look for the share icon in Safari</span>
          <button
            onClick={handleDismiss}
            className="text-stone-400 hover:text-stone-200 underline"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  // Native Chrome / Android Prompt
  if (showNativePrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 bg-stone-900 text-stone-100 border border-stone-700/80 rounded-3xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-300 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-white">Install MD-Chef App</h4>
            <p className="text-[11px] text-stone-400">Offline kitchen companion</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNativeInstall}
            className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

