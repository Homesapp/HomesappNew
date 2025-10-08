import { usePWA } from '@/contexts/PWAContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

export function PWAUpdateNotification() {
  const { isUpdateAvailable, updateServiceWorker } = usePWA();

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <CardTitle className="text-base">Actualización disponible</CardTitle>
              <CardDescription className="text-sm">
                Una nueva versión de HomesApp está disponible
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex justify-end">
          <Button
            size="sm"
            onClick={updateServiceWorker}
            data-testid="button-update-pwa"
          >
            Actualizar ahora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
