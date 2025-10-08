import { useState, useEffect } from 'react';
import { usePWA } from '@/contexts/PWAContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X } from 'lucide-react';

export function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');
    
    if (dismissed && dismissedTime) {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (parseInt(dismissedTime) > sevenDaysAgo) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem('pwa-install-dismissed');
        localStorage.removeItem('pwa-install-dismissed-time');
      }
    }
  }, []);

  useEffect(() => {
    if (isInstallable && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isDismissed]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <Download className="h-5 w-5 text-primary" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-2 -mt-1"
              onClick={handleDismiss}
              data-testid="button-dismiss-pwa"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-base">Instalar HomesApp</CardTitle>
          <CardDescription className="text-sm">
            Instala la aplicación para acceso rápido y funcionalidad offline
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3 text-sm text-muted-foreground">
          <ul className="space-y-1 list-disc list-inside">
            <li>Acceso más rápido</li>
            <li>Funciona offline</li>
            <li>Notificaciones push</li>
          </ul>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="flex-1"
            data-testid="button-dismiss-pwa-footer"
          >
            Ahora no
          </Button>
          <Button
            size="sm"
            onClick={handleInstall}
            className="flex-1"
            data-testid="button-install-pwa"
          >
            Instalar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
