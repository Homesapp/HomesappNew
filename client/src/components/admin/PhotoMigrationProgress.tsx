import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Image as ImageIcon,
  Loader2,
  Play,
  Pause
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface MigrationStats {
  totalPhotos: number;
  processedPhotos: number;
  pendingPhotos: number;
  processingPhotos: number;
  errors: number;
  notMigrated: number;
  lastUpdatedAt: string | null;
  percentComplete: number;
}

interface PhotoMigrationProgressProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function PhotoMigrationProgress({ 
  autoRefresh = true, 
  refreshInterval = 15000 
}: PhotoMigrationProgressProps) {
  const { language } = useLanguage();
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(autoRefresh);
  
  const { data: stats, isLoading, isError, refetch, isFetching } = useQuery<MigrationStats>({
    queryKey: ["/api/external/photos/migration-stats"],
    refetchInterval: isAutoRefreshing ? refreshInterval : false,
    staleTime: 5000,
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US').format(num);
  };

  const getLastUpdatedText = () => {
    if (!stats?.lastUpdatedAt) {
      return language === 'es' ? 'Sin datos' : 'No data';
    }
    try {
      return formatDistanceToNow(new Date(stats.lastUpdatedAt), { 
        addSuffix: true, 
        locale: language === 'es' ? es : enUS 
      });
    } catch {
      return stats.lastUpdatedAt;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
          <AlertCircle className="h-5 w-5 mr-2" />
          {language === 'es' ? 'Error al cargar estadísticas' : 'Failed to load stats'}
        </CardContent>
      </Card>
    );
  }

  const isComplete = stats.processedPhotos === stats.totalPhotos && stats.pendingPhotos === 0;
  const isInProgress = stats.processingPhotos > 0 || stats.pendingPhotos > 0;

  return (
    <Card data-testid="card-photo-migration-progress">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              {language === 'es' ? 'Migración de Fotos' : 'Photo Migration'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
              title={isAutoRefreshing ? 'Pause auto-refresh' : 'Resume auto-refresh'}
              data-testid="button-toggle-auto-refresh"
            >
              {isAutoRefreshing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              title={language === 'es' ? 'Actualizar' : 'Refresh'}
              data-testid="button-refresh-stats"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          {language === 'es' 
            ? 'Progreso de reimportación desde Google Drive' 
            : 'Google Drive reimport progress'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {language === 'es' ? 'Progreso' : 'Progress'}: {formatNumber(stats.processedPhotos)} / {formatNumber(stats.totalPhotos)}
            </span>
            <Badge variant={isComplete ? "default" : isInProgress ? "secondary" : "outline"}>
              {stats.percentComplete}%
            </Badge>
          </div>
          <Progress 
            value={stats.percentComplete} 
            className="h-3"
            data-testid="progress-migration"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col items-center p-3 bg-green-500/10 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600 mb-1" />
            <span className="text-lg font-bold text-green-600">{formatNumber(stats.processedPhotos)}</span>
            <span className="text-xs text-muted-foreground">
              {language === 'es' ? 'Completadas' : 'Completed'}
            </span>
          </div>

          <div className="flex flex-col items-center p-3 bg-yellow-500/10 rounded-lg">
            <Clock className="h-5 w-5 text-yellow-600 mb-1" />
            <span className="text-lg font-bold text-yellow-600">{formatNumber(stats.pendingPhotos)}</span>
            <span className="text-xs text-muted-foreground">
              {language === 'es' ? 'Pendientes' : 'Pending'}
            </span>
          </div>

          <div className="flex flex-col items-center p-3 bg-blue-500/10 rounded-lg">
            <Loader2 className={`h-5 w-5 text-blue-600 mb-1 ${stats.processingPhotos > 0 ? 'animate-spin' : ''}`} />
            <span className="text-lg font-bold text-blue-600">{formatNumber(stats.processingPhotos)}</span>
            <span className="text-xs text-muted-foreground">
              {language === 'es' ? 'Procesando' : 'Processing'}
            </span>
          </div>

          <div className="flex flex-col items-center p-3 bg-red-500/10 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mb-1" />
            <span className="text-lg font-bold text-red-600">{formatNumber(stats.errors)}</span>
            <span className="text-xs text-muted-foreground">
              {language === 'es' ? 'Errores' : 'Errors'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <span>
            {language === 'es' ? 'Última actualización' : 'Last update'}: {getLastUpdatedText()}
          </span>
          {isAutoRefreshing && (
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              {language === 'es' ? 'Auto-actualización activa' : 'Auto-refresh active'}
            </span>
          )}
        </div>

        {stats.notMigrated > 0 && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
            {language === 'es' 
              ? `${formatNumber(stats.notMigrated)} fotos aún no marcadas para migración`
              : `${formatNumber(stats.notMigrated)} photos not yet marked for migration`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
