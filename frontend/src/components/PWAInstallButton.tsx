import { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Verificar se é mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Verificar se já está instalado
    const checkInstalled = () => {
      // Verificar display mode standalone (Android)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setIsVisible(false);
        return;
      }

      // Verificar se está em modo standalone (iOS)
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        setIsVisible(false);
        return;
      }

      // Verificar localStorage para não mostrar novamente
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const installed = localStorage.getItem('pwa-installed');
      
      if (installed === 'true') {
        setIsInstalled(true);
        setIsVisible(false);
        return;
      }

      if (dismissed === 'true') {
        setIsVisible(false);
        return;
      }
    };

    checkInstalled();

    // Listener para beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar botão apenas em mobile
      if (isMobile) {
        setIsVisible(true);
      }
    };

    // Listener para quando app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback para navegadores que não suportam beforeinstallprompt (iOS Safari)
      if (isMobile) {
        alert(
          'Para instalar este app:\n\n' +
          'iOS Safari:\n' +
          '1. Toque no botão de compartilhar\n' +
          '2. Selecione "Adicionar à Tela de Início"\n\n' +
          'Android Chrome:\n' +
          '1. Toque no menu (3 pontos)\n' +
          '2. Selecione "Adicionar à tela inicial" ou "Instalar app"'
        );
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsVisible(false);
        localStorage.setItem('pwa-installed', 'true');
      } else {
        // Usuário cancelou - salvar para não mostrar novamente por um tempo
        localStorage.setItem('pwa-install-dismissed', 'true');
        setTimeout(() => {
          localStorage.removeItem('pwa-install-dismissed');
        }, 7 * 24 * 60 * 60 * 1000); // 7 dias
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed');
    }, 7 * 24 * 60 * 60 * 1000); // 7 dias
  };

  // Não mostrar se não for mobile, já instalado, ou não visível
  if (!isMobile || isInstalled || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="bg-white rounded-lg shadow-xl border-2 border-primary-200 p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              📱 Baixe nosso aplicativo agora
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Instale o app para acesso rápido, notificações e funcionamento offline.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>BAIXAR</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




