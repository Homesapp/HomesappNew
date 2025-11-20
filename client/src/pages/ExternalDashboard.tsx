import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, DollarSign, Wrench, AlertCircle, TrendingUp, Calendar, FileText, ClipboardCheck, ArrowRight, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { format, addDays, startOfDay, isBefore } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { ExternalCondominium, ExternalUnit, ExternalRentalContract, ExternalPayment, ExternalMaintenanceTicket, ExternalOwner } from "@shared/schema";

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

  const { data: owners, isLoading: ownersLoading } = useQuery<ExternalOwner[]>({
    queryKey: ['/api/external-owners'],
  });

  // Calculate statistics
  const today = new Date();
  const next7Days = addDays(today, 7);
  const next30Days = addDays(today, 30);

  // Active rentals (status=active AND today between start and end dates)
  const activeRentals = (rentalContracts ?? []).filter(contract => {
    if (contract.status !== 'active') return false;
    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.endDate);
    return today >= startDate && today <= endDate;
  });

  // Rentals ending soon (within next 30 days)
  const rentalsEndingSoon = activeRentals.filter(contract => {
    const endDate = new Date(contract.endDate);
    return endDate >= today && endDate <= next30Days;
  });

  // Completed rentals (past end date, status could be active or completed)
  const completedRentals = (rentalContracts ?? []).filter(contract => {
    const endDate = new Date(contract.endDate);
    return isBefore(endDate, today);
  });

  const unitsWithActiveContracts = new Set(activeRentals.map(c => c.unitId));

  const totalCondominiums = condominiums?.length || 0;
  const totalUnits = units?.length || 0;
  const activeUnits = units ? units.filter(u => u.status === 'active').length : 0;
  const occupiedUnits = units ? units.filter(u => unitsWithActiveContracts.has(u.id)).length : 0;
  const availableUnits = activeUnits - occupiedUnits;
  
  // Payments
  const pendingPayments = payments ? payments.filter(p => p.status === 'pending').length : 0;
  const overduePayments = payments ? payments.filter(p => p.status === 'overdue').length : 0;
  const paymentsNext7Days = payments ? payments.filter(p => {
    if (p.status !== 'pending') return false;
    const dueDate = new Date(p.dueDate);
    return dueDate >= today && dueDate <= next7Days;
  }).length : 0;

  // Maintenance tickets
  const openTickets = tickets ? tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length : 0;
  const scheduledTicketsNext7Days = tickets ? tickets.filter(t => {
    if (!t.scheduledDate || (t.status !== 'open' && t.status !== 'in_progress')) return false;
    const scheduledDate = new Date(t.scheduledDate);
    return scheduledDate >= today && scheduledDate <= next7Days;
  }).length : 0;

  const totalOwners = owners?.length || 0;

  const stats = {
    totalCondominiums,
    totalUnits,
    activeUnits,
    occupiedUnits,
    availableUnits,
    activeRentals: activeRentals.length,
    rentalsEndingSoon: rentalsEndingSoon.length,
    completedRentals: completedRentals.length,
    pendingPayments,
    overduePayments,
    paymentsNext7Days,
    openTickets,
    scheduledTicketsNext7Days,
    totalOwners,
  };

  const occupancyRate = activeUnits > 0 
    ? Math.round((occupiedUnits / activeUnits) * 100) 
    : 0;

  const isLoading = condosLoading || unitsLoading || contractsLoading || paymentsLoading || ticketsLoading || ownersLoading;

  // Quick access links
  const quickActions = [
    {
      title: language === "es" ? "Rentas Activas" : "Active Rentals",
      description: language === "es" ? "Gestionar contratos de renta" : "Manage rental contracts",
      icon: FileText,
      href: "/external/rentals",
      color: "text-purple-600",
      count: stats.activeRentals,
    },
    {
      title: language === "es" ? "Calendario" : "Calendar",
      description: language === "es" ? "Ver eventos y citas" : "View events and appointments",
      icon: Calendar,
      href: "/external/calendar",
      color: "text-blue-600",
      count: stats.paymentsNext7Days + stats.scheduledTicketsNext7Days,
    },
    {
      title: language === "es" ? "Propietarios" : "Owners",
      description: language === "es" ? "Gestionar propietarios" : "Manage owners",
      icon: User,
      href: "/external/owners",
      color: "text-green-600",
      count: stats.totalOwners,
    },
    {
      title: language === "es" ? "Mantenimiento" : "Maintenance",
      description: language === "es" ? "Tickets y trabajadores" : "Tickets and workers",
      icon: Wrench,
      href: "/external/maintenance",
      color: "text-orange-600",
      count: stats.openTickets,
    },
  ];

  // Upcoming events in the next 7 days
  const upcomingEvents = [];

  // Add payments due soon
  if (payments) {
    payments
      .filter(p => {
        if (p.status !== 'pending') return false;
        const dueDate = new Date(p.dueDate);
        return dueDate >= today && dueDate <= next7Days;
      })
      .slice(0, 3)
      .forEach(p => {
        const unit = units?.find(u => u.id === p.unitId);
        upcomingEvents.push({
          type: 'payment',
          title: `${language === "es" ? "Pago" : "Payment"}: ${p.serviceType}`,
          subtitle: unit ? `${unit.condominium?.name || ''} - ${unit.unitNumber}` : '',
          date: new Date(p.dueDate),
          icon: DollarSign,
          color: 'text-green-600',
        });
      });
  }

  // Add scheduled maintenance
  if (tickets) {
    tickets
      .filter(t => {
        if (!t.scheduledDate || (t.status !== 'open' && t.status !== 'in_progress')) return false;
        const scheduledDate = new Date(t.scheduledDate);
        return scheduledDate >= today && scheduledDate <= next7Days;
      })
      .slice(0, 3)
      .forEach(t => {
        const unit = units?.find(u => u.id === t.unitId);
        upcomingEvents.push({
          type: 'ticket',
          title: t.title,
          subtitle: unit ? `${unit.condominium?.name || ''} - ${unit.unitNumber}` : '',
          date: new Date(t.scheduledDate!),
          icon: Wrench,
          color: 'text-blue-600',
        });
      });
  }

  // Add rentals ending soon
  rentalsEndingSoon.slice(0, 2).forEach(contract => {
    const unit = units?.find(u => u.id === contract.unitId);
    upcomingEvents.push({
      type: 'rental',
      title: `${language === "es" ? "Fin de renta" : "Rental ending"}: ${contract.tenantName}`,
      subtitle: unit ? `${unit.condominium?.name || ''} - ${unit.unitNumber}` : '',
      date: new Date(contract.endDate),
      icon: ClipboardCheck,
      color: 'text-purple-600',
    });
  });

  // Sort by date
  upcomingEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

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

      {/* Main Stats Row */}
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
              {stats.totalUnits} {language === "es" ? "unidades totales" : "total units"}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-occupancy-rate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Ocupación" : "Occupancy"}
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
                  {stats.occupiedUnits}/{stats.activeUnits} {language === "es" ? "ocupadas" : "occupied"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-active-rentals">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Rentas Activas" : "Active Rentals"}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-active-rentals">
                  {stats.activeRentals}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.rentalsEndingSoon > 0 && (
                    <span className="text-orange-600">
                      {stats.rentalsEndingSoon} {language === "es" ? "por vencer" : "ending soon"}
                    </span>
                  )}
                  {stats.rentalsEndingSoon === 0 && (
                    <span>{language === "es" ? "Todas vigentes" : "All current"}</span>
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-open-tickets">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Mantenimiento" : "Maintenance"}
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-open-tickets">
                  {stats.openTickets}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.scheduledTicketsNext7Days > 0 && (
                    <span className="text-blue-600">
                      {stats.scheduledTicketsNext7Days} {language === "es" ? "esta semana" : "this week"}
                    </span>
                  )}
                  {stats.scheduledTicketsNext7Days === 0 && stats.openTickets > 0 && (
                    <span>{language === "es" ? "Abiertos" : "Open"}</span>
                  )}
                  {stats.openTickets === 0 && (
                    <span>{language === "es" ? "Ninguno abierto" : "None open"}</span>
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{language === "es" ? "Acceso Rápido" : "Quick Access"}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, idx) => (
            <Link key={idx} href={action.href}>
              <Card className="hover-elevate cursor-pointer transition-all" data-testid={`quick-action-${idx}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                    {action.count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {action.count}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Upcoming Events */}
        <Card data-testid="card-upcoming-events" className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {language === "es" ? "Próximos Eventos" : "Upcoming Events"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {language === "es" ? "Próximos 7 días" : "Next 7 days"}
                </CardDescription>
              </div>
              <Link href="/external/calendar">
                <Button variant="ghost" size="sm" data-testid="button-view-calendar">
                  <Calendar className="h-4 w-4 mr-1" />
                  {language === "es" ? "Ver calendario" : "View calendar"}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 5).map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2.5 border rounded-md hover-elevate"
                    data-testid={`event-${idx}`}
                  >
                    <div className="mt-0.5">
                      <event.icon className={`h-4 w-4 ${event.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      {event.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{event.subtitle}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium">
                        {format(event.date, 'd MMM', { locale: language === "es" ? es : enUS })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(event.date, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-events">
                {language === "es" 
                  ? "No hay eventos programados en los próximos 7 días" 
                  : "No events scheduled in the next 7 days"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card data-testid="card-payment-summary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {language === "es" ? "Estado de Pagos" : "Payment Status"}
            </CardTitle>
            <CardDescription className="text-xs">
              {language === "es" ? "Resumen de cobros" : "Payment overview"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">
                    {language === "es" ? "Pendientes" : "Pending"}
                  </span>
                </div>
                <div className="text-right">
                  {isLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <p className="text-lg font-bold" data-testid="text-pending-payments-summary">
                      {stats.pendingPayments}
                    </p>
                  )}
                </div>
              </div>

              {stats.overduePayments > 0 && (
                <div className="flex items-center justify-between p-2 border rounded-md border-destructive/50 bg-destructive/5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">
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
              )}

              {stats.paymentsNext7Days > 0 && (
                <div className="flex items-center justify-between p-2 border rounded-md border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">
                      {language === "es" ? "Esta semana" : "This week"}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {stats.paymentsNext7Days}
                    </p>
                  </div>
                </div>
              )}

              {!isLoading && stats.pendingPayments === 0 && stats.overduePayments === 0 && (
                <div className="text-center py-6">
                  <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-sm font-medium text-green-600" data-testid="text-no-pending-payments">
                    {language === "es" ? "¡Todos al día!" : "All up to date!"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Condominiums Overview */}
      <Card data-testid="card-condominiums-overview">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {language === "es" ? "Condominios" : "Condominiums"}
              </CardTitle>
              <CardDescription className="text-xs">
                {language === "es" ? "Vista general de tus complejos" : "Overview of your complexes"}
              </CardDescription>
            </div>
            <Link href="/external/condominiums">
              <Button variant="ghost" size="sm" data-testid="button-view-condos">
                {language === "es" ? "Ver todos" : "View all"}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : condominiums && condominiums.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {condominiums.slice(0, 6).map((condo) => {
                const condoUnits = units?.filter(u => u.condominiumId === condo.id) || [];
                const condoOccupied = condoUnits.filter(u => unitsWithActiveContracts.has(u.id)).length;
                const condoActive = condoUnits.filter(u => u.status === 'active').length;
                const condoOccupancyRate = condoActive > 0 ? Math.round((condoOccupied / condoActive) * 100) : 0;

                return (
                  <Link key={condo.id} href={`/external/condominiums/${condo.id}`}>
                    <div
                      className="p-3 border rounded-md hover-elevate cursor-pointer"
                      data-testid={`condo-summary-${condo.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{condo.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{condo.address}</p>
                        </div>
                        <Badge variant="secondary" className="ml-2 text-xs flex-shrink-0">
                          {condoOccupancyRate}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {condoUnits.length} {language === "es" ? "unidades" : "units"}
                        </span>
                        <span className="font-medium">
                          {condoOccupied}/{condoActive} {language === "es" ? "ocupadas" : "occupied"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-condos">
              {language === "es" ? "No hay condominios registrados" : "No condominiums registered"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
