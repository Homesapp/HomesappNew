import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ImageIcon, 
  Play, 
  Pause, 
  RefreshCcw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Activity,
  HardDrive,
  Zap,
  RotateCcw,
  FileWarning
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface MigrationStatus {
  totalPhotos: number;
  processedPhotos: number;
  pendingPhotos: number;
  errorPhotos: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  lastUpdatedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  timestamp: string;
}

interface ErrorPhoto {
  id: string;
  unitId: string;
  fileName: string;
  driveFileId: string;
  migrationError: string;
  updatedAt: string;
}

const POLL_INTERVAL = 15000; // 15 seconds

export default function PhotoMigrationPanel() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isPolling, setIsPolling] = useState(true);
  const locale = language === 'es' ? es : enUS;

  const t = {
    es: {
      title: "Migración de Fotos HD",
      subtitle: "Panel de control para la reimportación de fotos desde Google Drive",
      status: "Estado",
      progress: "Progreso",
      totalPhotos: "Total de Fotos",
      processed: "Procesadas",
      pending: "Pendientes",
      errors: "Errores",
      lastUpdate: "Última actualización",
      startedAt: "Iniciado",
      estimatedTime: "Tiempo estimado",
      actions: "Acciones",
      startMigration: "Iniciar Migración",
      pauseMigration: "Pausar",
      resumeMigration: "Reanudar",
      retryErrors: "Reintentar Errores",
      refreshStatus: "Actualizar Estado",
      statusIdle: "Inactivo",
      statusRunning: "En Proceso",
      statusPaused: "Pausado",
      statusCompleted: "Completado",
      statusError: "Error",
      noPhotos: "No hay fotos pendientes de migración",
      photosQueued: "fotos en cola",
      errorDetails: "Detalles de Errores",
      noErrors: "No hay errores registrados",
      viewErrors: "Ver Errores",
      autoRefresh: "Auto-actualización",
      on: "Activada",
      off: "Desactivada",
      settings: "Configuración",
      batchSize: "Tamaño de lote",
      concurrency: "Concurrencia",
      quality: "Calidad WebP",
      maxWidth: "Ancho máximo",
      migrationStarted: "Migración iniciada",
      migrationPaused: "Migración pausada",
      errorsReset: "Errores restablecidos para reintento",
    },
    en: {
      title: "HD Photo Migration",
      subtitle: "Control panel for reimporting photos from Google Drive",
      status: "Status",
      progress: "Progress",
      totalPhotos: "Total Photos",
      processed: "Processed",
      pending: "Pending",
      errors: "Errors",
      lastUpdate: "Last update",
      startedAt: "Started",
      estimatedTime: "Estimated time",
      actions: "Actions",
      startMigration: "Start Migration",
      pauseMigration: "Pause",
      resumeMigration: "Resume",
      retryErrors: "Retry Errors",
      refreshStatus: "Refresh Status",
      statusIdle: "Idle",
      statusRunning: "Running",
      statusPaused: "Paused",
      statusCompleted: "Completed",
      statusError: "Error",
      noPhotos: "No photos pending migration",
      photosQueued: "photos queued",
      errorDetails: "Error Details",
      noErrors: "No errors recorded",
      viewErrors: "View Errors",
      autoRefresh: "Auto-refresh",
      on: "On",
      off: "Off",
      settings: "Settings",
      batchSize: "Batch size",
      concurrency: "Concurrency",
      quality: "WebP quality",
      maxWidth: "Max width",
      migrationStarted: "Migration started",
      migrationPaused: "Migration paused",
      errorsReset: "Errors reset for retry",
    }
  }[language];

  // Fetch migration status with polling
  const { data: status, isLoading, refetch } = useQuery<MigrationStatus>({
    queryKey: ['/api/photo-migration/status'],
    refetchInterval: isPolling ? POLL_INTERVAL : false,
  });

  // Fetch error photos
  const { data: errorsData } = useQuery<{ errors: ErrorPhoto[], count: number }>({
    queryKey: ['/api/photo-migration/errors'],
    enabled: (status?.errorPhotos || 0) > 0,
  });

  // Start migration mutation
  const startMutation = useMutation({
    mutationFn: () => apiRequest('/api/photo-migration/start', { method: 'POST' }),
    onSuccess: () => {
      toast({ title: t.migrationStarted });
      queryClient.invalidateQueries({ queryKey: ['/api/photo-migration/status'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Pause migration mutation
  const pauseMutation = useMutation({
    mutationFn: () => apiRequest('/api/photo-migration/pause', { method: 'POST' }),
    onSuccess: () => {
      toast({ title: t.migrationPaused });
      queryClient.invalidateQueries({ queryKey: ['/api/photo-migration/status'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Retry errors mutation
  const retryMutation = useMutation({
    mutationFn: () => apiRequest('/api/photo-migration/retry-errors', { method: 'POST' }),
    onSuccess: () => {
      toast({ title: t.errorsReset });
      queryClient.invalidateQueries({ queryKey: ['/api/photo-migration/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/photo-migration/errors'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'idle': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{t.statusIdle}</Badge>;
      case 'running': return <Badge className="bg-blue-500"><Activity className="h-3 w-3 mr-1 animate-pulse" />{t.statusRunning}</Badge>;
      case 'paused': return <Badge variant="outline"><Pause className="h-3 w-3 mr-1" />{t.statusPaused}</Badge>;
      case 'completed': return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />{t.statusCompleted}</Badge>;
      case 'error': return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />{t.statusError}</Badge>;
      default: return <Badge variant="secondary">{s}</Badge>;
    }
  };

  const progressPercent = status?.totalPhotos 
    ? Math.round((status.processedPhotos / status.totalPhotos) * 100) 
    : 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-migration-title">
          <HardDrive className="h-6 w-6" />
          {t.title}
        </h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.totalPhotos}</CardDescription>
            <CardTitle className="text-3xl" data-testid="stat-total-photos">
              {status?.totalPhotos?.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.processed}</CardDescription>
            <CardTitle className="text-3xl text-green-600" data-testid="stat-processed">
              {status?.processedPhotos?.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.pending}</CardDescription>
            <CardTitle className="text-3xl text-blue-600" data-testid="stat-pending">
              {status?.pendingPhotos?.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.errors}</CardDescription>
            <CardTitle className="text-3xl text-red-600" data-testid="stat-errors">
              {status?.errorPhotos?.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t.progress}</CardTitle>
                  <CardDescription>
                    {status?.processedPhotos?.toLocaleString()} / {status?.totalPhotos?.toLocaleString()} fotos ({progressPercent}%)
                  </CardDescription>
                </div>
                {status && getStatusBadge(status.status)}
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercent} className="h-4 mb-4" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {status?.lastUpdatedAt && (
                  <div>
                    <span className="text-muted-foreground">{t.lastUpdate}:</span>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(status.lastUpdatedAt), { addSuffix: true, locale })}
                    </p>
                  </div>
                )}
                {status?.startedAt && (
                  <div>
                    <span className="text-muted-foreground">{t.startedAt}:</span>
                    <p className="font-medium">
                      {format(new Date(status.startedAt), 'PPp', { locale })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {errorsData && errorsData.errors && errorsData.count > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileWarning className="h-5 w-5 text-red-500" />
                  {t.errorDetails} ({errorsData.count})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {errorsData.errors.slice(0, 10).map((error) => (
                    <div key={error.id} className="text-sm p-2 bg-muted/50 rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs">{error.fileName || error.id.slice(0, 8)}</span>
                        <span className="text-xs text-muted-foreground">
                          {error.updatedAt && formatDistanceToNow(new Date(error.updatedAt), { addSuffix: true, locale })}
                        </span>
                      </div>
                      <p className="text-xs text-red-600 mt-1">{error.migrationError}</p>
                    </div>
                  ))}
                  {errorsData.count > 10 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{errorsData.count - 10} más errores
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.actions}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {status?.status === 'idle' || status?.status === 'completed' ? (
                <Button 
                  className="w-full" 
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                  data-testid="button-start-migration"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {t.startMigration}
                </Button>
              ) : status?.status === 'running' ? (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => pauseMutation.mutate()}
                  disabled={pauseMutation.isPending}
                  data-testid="button-pause-migration"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  {t.pauseMigration}
                </Button>
              ) : status?.status === 'paused' ? (
                <Button 
                  className="w-full" 
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                  data-testid="button-resume-migration"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {t.resumeMigration}
                </Button>
              ) : null}

              {(status?.errorPhotos || 0) > 0 && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => retryMutation.mutate()}
                  disabled={retryMutation.isPending}
                  data-testid="button-retry-errors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t.retryErrors} ({status?.errorPhotos})
                </Button>
              )}

              <Button 
                className="w-full" 
                variant="ghost"
                onClick={() => refetch()}
                disabled={isLoading}
                data-testid="button-refresh-status"
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {t.refreshStatus}
              </Button>

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.autoRefresh}</span>
                <Button 
                  size="sm" 
                  variant={isPolling ? "default" : "outline"}
                  onClick={() => setIsPolling(!isPolling)}
                >
                  {isPolling ? t.on : t.off}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {t.settings}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.batchSize}</span>
                <span className="font-medium">100 fotos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.concurrency}</span>
                <span className="font-medium">3 paralelo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.quality}</span>
                <span className="font-medium">70%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.maxWidth}</span>
                <span className="font-medium">1600px</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
