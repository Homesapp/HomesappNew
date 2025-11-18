import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAdminTranslation } from "@/lib/adminTranslations";

interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AutoLogoutConfig() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = getAdminTranslation(language);
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(5);

  const { data: setting, isLoading } = useQuery<SystemSetting>({
    queryKey: ["/api/admin/system-settings/auto_logout_timeout_ms"],
  });

  // Sync local state with query data
  useEffect(() => {
    if (setting?.settingValue) {
      const minutes = Math.floor(parseInt(setting.settingValue) / 60000);
      setTimeoutMinutes(minutes);
    }
  }, [setting]);

  const updateMutation = useMutation({
    mutationFn: async (minutes: number) => {
      const milliseconds = minutes * 60000;
      return await apiRequest(
        "PUT",
        `/api/admin/system-settings/auto_logout_timeout_ms`,
        { value: milliseconds.toString() }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-settings/auto_logout_timeout_ms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings/auto-logout-timeout"] });
      toast({
        title: t.autoLogout.savedSuccess,
        description: t.autoLogout.savedDescription,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.common.error,
        description: error.message || "Error al actualizar la configuración",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (timeoutMinutes < 1) {
      toast({
        title: "Error de validación",
        description: "El tiempo mínimo es 1 minuto",
        variant: "destructive",
      });
      return;
    }
    
    if (timeoutMinutes > 1440) {
      toast({
        title: "Error de validación",
        description: "El tiempo máximo es 1440 minutos (24 horas)",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate(timeoutMinutes);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-config" />
      </div>
    );
  }

  const currentMinutes = setting?.settingValue 
    ? Math.floor(parseInt(setting.settingValue) / 60000)
    : 5;

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-auto-logout-config">
          {t.autoLogout.title}
        </h1>
        <p className="text-muted-foreground">
          {t.autoLogout.description}
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Los cambios se aplicarán inmediatamente para todos los usuarios en su próxima sesión.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tiempo de Auto-Logout
          </CardTitle>
          <CardDescription>
            Configura cuántos minutos de inactividad son necesarios antes de cerrar la sesión automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="timeout-input">Tiempo de inactividad (minutos)</Label>
            <div className="flex gap-4 items-center">
              <Input
                id="timeout-input"
                type="number"
                min="1"
                max="1440"
                value={timeoutMinutes}
                onChange={(e) => setTimeoutMinutes(parseInt(e.target.value) || 1)}
                className="max-w-xs"
                data-testid="input-timeout-minutes"
              />
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending || timeoutMinutes === currentMinutes}
                data-testid="button-save-timeout"
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Valor actual: {currentMinutes} minutos ({Math.floor(currentMinutes / 60)}h {currentMinutes % 60}m)
            </p>
          </div>

          <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
            <h4 className="font-medium text-sm">Valores recomendados:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 5 minutos - Para máxima seguridad</li>
              <li>• 15 minutos - Balance entre seguridad y comodidad</li>
              <li>• 30 minutos - Para aplicaciones con menor riesgo</li>
              <li>• 60 minutos - Para entornos de trabajo prolongado</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
