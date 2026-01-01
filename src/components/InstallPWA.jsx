import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 30) {
        // Don't show again for 30 days
        return;
      }
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show prompt after 10 seconds (give user time to explore)
      setTimeout(() => {
        setShowPrompt(true);
      }, 10000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-2xl p-5 text-white">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">
              Install Stock Monitor
            </h3>
            <p className="text-sm text-blue-100 mb-4">
              Install our app for quick access, offline support, and better performance!
            </p>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                Not Now
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="grid grid-cols-3 gap-2 text-xs text-blue-100">
            <div className="text-center">
              <div className="font-semibold text-white">⚡</div>
              <div>Faster</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-white">📱</div>
              <div>Home Screen</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-white">🔒</div>
              <div>Offline Mode</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstallPWA;
