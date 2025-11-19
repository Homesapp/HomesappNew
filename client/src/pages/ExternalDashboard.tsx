import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, DollarSign, Wrench, Home, AlertCircle, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ExternalCondominium, ExternalUnit, ExternalRentalContract, ExternalPayment, ExternalMaintenanceTicket } from "@shared/schema";

export default function ExternalDashboard() {
  const { language } = useLanguage();

  const { data: condominiums, isLoading: condosLoading } = useQuery<ExternalCondominium[]>({
    queryKey: ['/api/external-condominiums'],
  });

  const { data: units, isLoading: unitsLoading } = useQuery<ExternalUnit[]>({
    queryKey: ['/api/external-units'],
  });

  const { data: rentalContracts, isLoading: contractsLoading } = useQuery<ExternalRentalContract[]>({
    queryKey: ['/api/external-rental-contracts'],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<ExternalPayment[]>({
    queryKey: ['/api/external-payments'],
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery<ExternalMaintenanceTicket[]>({
    queryKey: ['/api/external-tickets'],
  });

  // Calculate which units have active rental contracts (occupied = has active tenant)
  // Contract is truly active if status='active' AND today is between startDate and endDate
  const today = new Date();
  const unitsWithActiveContracts = new Set(
    (rentalContracts ?? [])
      .filter(contract => {
        if (contract.status !== 'active') return false;
        const startDate = new Date(contract.startDate);
        const endDate = new Date(contract.endDate);
        return today >= startDate && today <= endDate;
      })
      .map(contract => contract.unitId)
  );

  const totalCondominiums = condominiums?.length || 0;
  const totalUnits = units?.length || 0;
  const occupiedUnits = units ? units.filter(u => unitsWithActiveContracts.has(u.id)).length : 0;
  const pendingPayments = payments ? payments.filter(p => p.status === 'pending').length : 0;
  const overduePayments = payments ? payments.filter(p => p.status === 'overdue').length : 0;
  const openTickets = tickets ? tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length : 0;

  const stats = {
    totalCondominiums,
    totalUnits,
    occupiedUnits,
    pendingPayments,
    overduePayments,
    openTickets,
  };

  const occupancyRate = totalUnits > 0 
    ? Math.round((occupiedUnits / totalUnits) * 100) 
    : 0;

  const isLoading = condosLoading || unitsLoading || contractsLoading || paymentsLoading || ticketsLoading;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          {language === "es" ? "Dashboard de Gestión Externa" : "External Management Dashboard"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "es" 
            ? "Resumen general de tus condominios y unidades"
            : "Overview of your condominiums and units"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-condominiums">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Condominios" : "Condominiums"}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-condominiums">
                {stats.totalCondominiums}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {language === "es" ? "Total registrados" : "Total registered"}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-units">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Unidades" : "Units"}
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-units">
                  {stats.totalUnits}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.occupiedUnits} {language === "es" ? "ocupadas" : "occupied"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-occupancy-rate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Tasa de Ocupación" : "Occupancy Rate"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-occupancy-rate">
                  {occupancyRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "es" ? "De todas las unidades" : "Of all units"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-open-tickets">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Tickets Abiertos" : "Open Tickets"}
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-open-tickets">
                {stats.openTickets}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {language === "es" ? "Requieren atención" : "Require attention"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-condominiums-overview">
          <CardHeader>
            <CardTitle>
              {language === "es" ? "Condominios" : "Condominiums"}
            </CardTitle>
            <CardDescription>
              {language === "es" ? "Vista general de tus complejos" : "Overview of your complexes"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : condominiums && condominiums.length > 0 ? (
              <div className="space-y-3">
                {condominiums.slice(0, 5).map((condo) => (
                  <div
                    key={condo.id}
                    className="flex items-center justify-between border-b pb-3"
                    data-testid={`condo-summary-${condo.id}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{condo.name}</p>
                      <p className="text-xs text-muted-foreground">{condo.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{condo.totalUnits}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "unidades" : "units"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-condos">
                {language === "es" ? "No hay condominios registrados" : "No condominiums registered"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-payment-summary">
          <CardHeader>
            <CardTitle>
              {language === "es" ? "Resumen de Pagos" : "Payment Summary"}
            </CardTitle>
            <CardDescription>
              {language === "es" ? "Estado de pagos pendientes y vencidos" : "Pending and overdue payment status"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">
                    {language === "es" ? "Pendientes" : "Pending"}
                  </span>
                </div>
                <div className="text-right">
                  {isLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <p className="text-lg font-bold text-yellow-600" data-testid="text-pending-payments-summary">
                      {stats.pendingPayments}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">
                    {language === "es" ? "Vencidos" : "Overdue"}
                  </span>
                </div>
                <div className="text-right">
                  {isLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <p className="text-lg font-bold text-destructive" data-testid="text-overdue-payments-summary">
                      {stats.overduePayments}
                    </p>
                  )}
                </div>
              </div>
              {!isLoading && stats.pendingPayments === 0 && stats.overduePayments === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-pending-payments">
                  {language === "es" ? "¡Todos los pagos están al día!" : "All payments are up to date!"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
