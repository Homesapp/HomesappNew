import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import { es as esLocale, enUS as enLocale } from "date-fns/locale";
import { Play, Pause, RotateCcw, CheckCircle, AlertCircle, Clock, Activity, Image as ImageIcon } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MigrationStatus {
  totalPhotos: number;
  processedPhotos: number;
  pendingPhotos: number;
  errorPhotos: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  lastUpdatedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

interface PhotoMigrationWidgetProps {
  language: "es" | "en";
}

const POLL_INTERVAL = 15000;

export function PhotoMigrationWidget({ language }: PhotoMigrationWidgetProps) {
  const { toast } = useToast();
  const locale = language === "es" ? esLocale : enLocale;
  const [isPolling, setIsPolling] = useState(true);

  const t = {
    es: {
      loading: "Cargando estado...",
      totalPhotos: "Total de Fotos",
      processed: "Procesadas",
      pending: "Pendientes",
      errors: "Errores",
      statusIdle: "Inactivo",
      statusRunning: "En Progreso",
      statusPaused: "Pausado",
      statusCompleted: "Completado",
      statusError: "Error",
      startMigration: "Iniciar Migración",
      pauseMigration: "Pausar",
      resumeMigration: "Reanudar",
      retryErrors: "Reintentar Errores",
      lastUpdate: "Última actualización",
      startedAt: "Iniciado",
      noPhotos: "No hay fotos pendientes de migración",
      migrationStarted: "Migración iniciada",
      migrationPaused: "Migración pausada",
      errorsReset: "Errores reseteados para reintento",
      autoRefresh: "Auto-actualización",
      on: "Activado",
      off: "Desactivado",
    },
    en: {
      loading: "Loading status...",
      totalPhotos: "Total Photos",
      processed: "Processed",
      pending: "Pending",
      errors: "Errors",
      statusIdle: "Idle",
      statusRunning: "Running",
      statusPaused: "Paused",
      statusCompleted: "Completed",
      statusError: "Error",
      startMigration: "Start Migration",
      pauseMigration: "Pause",
      resumeMigration: "Resume",
      retryErrors: "Retry Errors",
      lastUpdate: "Last update",
      startedAt: "Started",
      noPhotos: "No photos pending migration",
      migrationStarted: "Migration started",
      migrationPaused: "Migration paused",
      errorsReset: "Errors reset for retry",
      autoRefresh: "Auto-refresh",
      on: "On",
      off: "Off",
    },
  }[language];

  const { data: status, isLoading } = useQuery<MigrationStatus>({
    queryKey: ['/api/photo-migration/status'],
    refetchInterval: isPolling ? POLL_INTERVAL : false,
  });

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

  const retryMutation = useMutation({
    mutationFn: () => apiRequest('/api/photo-migration/retry-errors', { method: 'POST' }),
    onSuccess: () => {
      toast({ title: t.errorsReset });
      queryClient.invalidateQueries({ queryKey: ['/api/photo-migration/status'] });
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t.noPhotos}</AlertDescription>
      </Alert>
    );
  }

  const progressPercent = status.totalPhotos 
    ? Math.round((status.processedPhotos / status.totalPhotos) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {getStatusBadge(status.status)}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPolling(!isPolling)}
          data-testid="button-toggle-polling"
        >
          {t.autoRefresh}: {isPolling ? t.on : t.off}
        </Button>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>{status.processedPhotos.toLocaleString()} / {status.totalPhotos.toLocaleString()}</span>
          <span>{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-3" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <ImageIcon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{status.totalPhotos.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{t.totalPhotos}</p>
        </div>
        <div className="p-3 bg-green-500/10 rounded-lg text-center">
          <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
          <p className="text-2xl font-bold text-green-600">{status.processedPhotos.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{t.processed}</p>
        </div>
        <div className="p-3 bg-blue-500/10 rounded-lg text-center">
          <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
          <p className="text-2xl font-bold text-blue-600">{status.pendingPhotos.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{t.pending}</p>
        </div>
        <div className="p-3 bg-red-500/10 rounded-lg text-center">
          <AlertCircle className="h-5 w-5 mx-auto mb-1 text-red-600" />
          <p className="text-2xl font-bold text-red-600">{status.errorPhotos.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{t.errors}</p>
        </div>
      </div>

      {status.lastUpdatedAt && (
        <p className="text-sm text-muted-foreground">
          {t.lastUpdate}: {formatDistanceToNow(new Date(status.lastUpdatedAt), { addSuffix: true, locale })}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {status.status === 'idle' || status.status === 'completed' ? (
          <Button 
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            data-testid="button-start-migration"
          >
            <Play className="h-4 w-4 mr-2" />
            {t.startMigration}
          </Button>
        ) : status.status === 'running' ? (
          <Button 
            variant="outline"
            onClick={() => pauseMutation.mutate()}
            disabled={pauseMutation.isPending}
            data-testid="button-pause-migration"
          >
            <Pause className="h-4 w-4 mr-2" />
            {t.pauseMigration}
          </Button>
        ) : status.status === 'paused' ? (
          <Button 
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            data-testid="button-resume-migration"
          >
            <Play className="h-4 w-4 mr-2" />
            {t.resumeMigration}
          </Button>
        ) : null}

        {status.errorPhotos > 0 && (
          <Button 
            variant="outline"
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
            data-testid="button-retry-errors"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t.retryErrors} ({status.errorPhotos})
          </Button>
        )}
      </div>
    </div>
  );
}
