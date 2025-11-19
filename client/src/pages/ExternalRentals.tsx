import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Home, 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban
} from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ExternalRentalContract, ExternalUnit, ExternalCondominium } from "@shared/schema";

interface RentalWithDetails {
  contract: ExternalRentalContract;
  unit: ExternalUnit | null;
  condominium: ExternalCondominium | null;
}

export default function ExternalRentals() {
  const { language } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: rentals, isLoading, isError, error, refetch } = useQuery<RentalWithDetails[]>({
    queryKey: statusFilter 
      ? [`/api/external-rental-contracts?status=${statusFilter}`]
      : ["/api/external-rental-contracts"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "completed": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "cancelled": return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "pending": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle2 className="h-3 w-3" />;
      case "completed": return <CheckCircle2 className="h-3 w-3" />;
      case "cancelled": return <Ban className="h-3 w-3" />;
      case "pending": return <Clock className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      active: { es: "Activo", en: "Active" },
      completed: { es: "Completado", en: "Completed" },
      cancelled: { es: "Cancelado", en: "Cancelled" },
      pending: { es: "Pendiente", en: "Pending" },
    };
    return labels[status]?.[language] || status;
  };

  // Calculate statistics
  const stats = rentals ? {
    total: rentals.length,
    active: rentals.filter(r => r.contract.status === "active").length,
    pending: rentals.filter(r => r.contract.status === "pending").length,
    completed: rentals.filter(r => r.contract.status === "completed").length,
  } : { total: 0, active: 0, pending: 0, completed: 0 };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            {language === "es" ? "Rentas Activas" : "Active Rentals"}
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            {language === "es" 
              ? "Administra todos los contratos de renta y sus pagos" 
              : "Manage all rental contracts and payments"}
          </p>
        </div>
      </div>

      <Separator />

      {/* Statistics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-stats-total">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Total Rentas" : "Total Rentals"}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stats-total">{stats.total}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-active">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Activos" : "Active"}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-stats-active">
              {stats.active}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-pending">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Pendientes" : "Pending"}
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400" data-testid="text-stats-pending">
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-completed">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Completados" : "Completed"}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-stats-completed">
              {stats.completed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={statusFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(null)}
          data-testid="button-filter-all"
        >
          {language === "es" ? "Todos" : "All"}
        </Button>
        <Button
          variant={statusFilter === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("active")}
          data-testid="button-filter-active"
        >
          {language === "es" ? "Activos" : "Active"}
        </Button>
        <Button
          variant={statusFilter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("pending")}
          data-testid="button-filter-pending"
        >
          {language === "es" ? "Pendientes" : "Pending"}
        </Button>
        <Button
          variant={statusFilter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("completed")}
          data-testid="button-filter-completed"
        >
          {language === "es" ? "Completados" : "Completed"}
        </Button>
      </div>

      {/* Rentals List */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive" data-testid="text-error">
              {language === "es" ? "Error al cargar las rentas" : "Error loading rentals"}
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {error instanceof Error && error.message 
                ? error.message 
                : (language === "es" 
                    ? "No se pudieron cargar las rentas. Por favor intenta de nuevo." 
                    : "Could not load rentals. Please try again.")}
            </p>
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={() => refetch()}
                data-testid="button-retry"
              >
                {language === "es" ? "Reintentar" : "Retry"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              {language === "es" 
                ? "Si el problema persiste, contacta a soporte" 
                : "If the problem persists, contact support"}
            </p>
          </CardContent>
        </Card>
      ) : rentals && rentals.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {rentals.map(({ contract, unit, condominium }) => (
            <Card key={contract.id} className="hover-elevate" data-testid={`card-rental-${contract.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Home className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate" data-testid={`text-rental-unit-${contract.id}`}>
                        {condominium?.name} - {unit?.unitNumber}
                      </span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate" data-testid={`text-rental-tenant-${contract.id}`}>
                        {contract.tenantName}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge 
                    className={`flex items-center gap-1 ${getStatusColor(contract.status)}`}
                    data-testid={`badge-rental-status-${contract.id}`}
                  >
                    {getStatusIcon(contract.status)}
                    {getStatusLabel(contract.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Separator />
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Renta Mensual" : "Monthly Rent"}
                      </p>
                      <p className="font-semibold" data-testid={`text-rental-rent-${contract.id}`}>
                        ${parseFloat(contract.monthlyRent).toLocaleString()} {contract.currency}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Duración" : "Duration"}
                      </p>
                      <p className="font-semibold" data-testid={`text-rental-duration-${contract.id}`}>
                        {contract.leaseDurationMonths} {language === "es" ? "meses" : "months"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Inicio" : "Start Date"}
                      </p>
                      <p className="font-semibold text-xs" data-testid={`text-rental-start-${contract.id}`}>
                        {format(new Date(contract.startDate), "dd MMM yyyy", { locale: language === "es" ? es : enUS })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Fin" : "End Date"}
                      </p>
                      <p className="font-semibold text-xs" data-testid={`text-rental-end-${contract.id}`}>
                        {format(new Date(contract.endDate), "dd MMM yyyy", { locale: language === "es" ? es : enUS })}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button 
                    asChild 
                    size="sm" 
                    className="flex-1"
                    data-testid={`button-view-rental-${contract.id}`}
                  >
                    <Link href={`/external/rentals/${contract.id}`}>
                      <FileText className="h-4 w-4 mr-2" />
                      {language === "es" ? "Ver Detalles" : "View Details"}
                    </Link>
                  </Button>
                  {unit && (
                    <Button 
                      asChild 
                      variant="outline" 
                      size="sm"
                      data-testid={`button-view-unit-${contract.id}`}
                    >
                      <Link href={`/external/units/${unit.id}`}>
                        <Building2 className="h-4 w-4 mr-2" />
                        {language === "es" ? "Unidad" : "Unit"}
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium" data-testid="text-no-rentals">
              {language === "es" ? "No hay rentas registradas" : "No rentals found"}
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {language === "es" 
                ? "Las rentas aparecerán aquí cuando se creen desde las unidades" 
                : "Rentals will appear here when created from units"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
