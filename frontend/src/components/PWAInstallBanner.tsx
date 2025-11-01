import React, { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export default function PWAInstallBanner() {
  const { isInstalled, isInstallable, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show banner if app is installed, not installable, or dismissed
  if (isInstalled || !isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Store dismissal in localStorage
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // Check if banner was previously dismissed
  React.useEffect(() => {
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg border p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900">
              Instalar App
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Instale o app para acesso rápido e notificações offline
            </p>
            
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex-1 bg-primary-600 text-white text-xs px-3 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center space-x-1"
              >
                <Download className="w-3 h-3" />
                <span>Instalar</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

