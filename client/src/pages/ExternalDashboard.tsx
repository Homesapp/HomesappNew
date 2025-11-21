import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, DollarSign, Wrench, AlertCircle, TrendingUp, Calendar, FileText, ClipboardCheck, ArrowRight, User, TrendingDown, ArrowUpRight, ArrowDownRight, Home, Wifi, Zap, Droplet, Flame, Receipt } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { format, addDays, startOfDay, isBefore, startOfMonth, endOfMonth } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { ExternalCondominium, ExternalUnit, ExternalRentalContract, ExternalPayment, ExternalMaintenanceTicket, ExternalOwner, ExternalFinancialTransaction } from "@shared/schema";

// Type for the enhanced contract response from the API
type RentalContractWithDetails = {
  contract: ExternalRentalContract;
  unit: ExternalUnit | null;
  condominium: ExternalCondominium | null;
  activeServices?: Array<{ serviceType: string; amount: number; dayOfMonth: number }>;
  nextPayment?: ExternalPayment | null;
};

export default function ExternalDashboard() {
  const { language } = useLanguage();

  // Extended cache for static/rarely-changing data
  const { data: condominiums, isLoading: condosLoading } = useQuery<ExternalCondominium[]>({
    queryKey: ['/api/external-condominiums'],
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  const { data: units, isLoading: unitsLoading } = useQuery<ExternalUnit[]>({
    queryKey: ['/api/external-units'],
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  const { data: rentalContractsData, isLoading: contractsLoading } = useQuery<RentalContractWithDetails[]>({
    queryKey: ['/api/external-rental-contracts'],
    staleTime: 5 * 60 * 1000, // 5 minutes (default)
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<ExternalPayment[]>({
    queryKey: ['/api/external-payments'],
    staleTime: 5 * 60 * 1000, // 5 minutes (default)
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery<ExternalMaintenanceTicket[]>({
    queryKey: ['/api/external-tickets'],
    staleTime: 5 * 60 * 1000, // 5 minutes (default)
  });

  const { data: owners, isLoading: ownersLoading } = useQuery<ExternalOwner[]>({
    queryKey: ['/api/external-owners'],
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  const { data: financialTransactions, isLoading: financialLoading } = useQuery<ExternalFinancialTransaction[]>({
    queryKey: ['/api/external-financial-transactions'],
    staleTime: 5 * 60 * 1000, // 5 minutes (default)
  });

  // Calculate statistics
  const today = new Date();
  const next7Days = addDays(today, 7);
  const next30Days = addDays(today, 30);

  // Normalize rental contracts (handle both nested and flat structures)
  // Preserve unit and condominium metadata when present
  const normalizedContracts = (rentalContractsData ?? []).map(item => {
    if ('contract' in item) {
      // Already has nested structure with unit/condominium
      return item;
    } else {
      // Flat structure - look up unit and condominium
      const unit = units?.find(u => u.id === item.unitId);
      const condominium = condominiums?.find(c => c.id === unit?.condominiumId);
      return { contract: item, unit: unit || null, condominium: condominium || null };
    }
  });

  // Active rentals (status=active AND today between start and end dates)
  const activeRentals = normalizedContracts.filter(item => {
    const contract = item.contract;
    if (contract.status !== 'active') return false;
    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.endDate);
    return today >= startDate && today <= endDate;
  });

  // Rentals ending soon (within next 30 days)
  const rentalsEndingSoon = activeRentals.filter(item => {
    const endDate = new Date(item.contract.endDate);
    return endDate >= today && endDate <= next30Days;
  });

  // Completed rentals (past end date, status could be active or completed)
  const completedRentals = normalizedContracts.filter(item => {
    const endDate = new Date(item.contract.endDate);
    return isBefore(endDate, today);
  });

  const unitsWithActiveContracts = new Set(activeRentals.map(item => item.contract.unitId));

  const totalCondominiums = condominiums?.length || 0;
  const totalUnits = units?.length || 0;
  // Use total units instead of filtering by status='active' since units might not have that field properly set
  const activeUnits = totalUnits;
  const occupiedUnits = activeRentals.length; // Count active rentals directly
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

  // Financial calculations for current month
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  
  const monthlyIncome = financialTransactions
    ? financialTransactions
        .filter(t => {
          const dueDate = new Date(t.dueDate);
          return t.direction === 'inflow' && 
                 t.status === 'completed' &&
                 dueDate >= monthStart && 
                 dueDate <= monthEnd;
        })
        .reduce((sum, t) => sum + parseFloat(t.netAmount || '0'), 0)
    : 0;

  const monthlyExpenses = financialTransactions
    ? financialTransactions
        .filter(t => {
          const dueDate = new Date(t.dueDate);
          return t.direction === 'outflow' && 
                 t.status === 'completed' &&
                 dueDate >= monthStart && 
                 dueDate <= monthEnd;
        })
        .reduce((sum, t) => sum + parseFloat(t.netAmount || '0'), 0)
    : 0;

  const monthlyNetIncome = monthlyIncome - monthlyExpenses;

  // Expected income this month (pending + completed)
  const expectedMonthlyIncome = financialTransactions
    ? financialTransactions
        .filter(t => {
          const dueDate = new Date(t.dueDate);
          return t.direction === 'inflow' && 
                 dueDate >= monthStart && 
                 dueDate <= monthEnd;
        })
        .reduce((sum, t) => sum + parseFloat(t.netAmount || '0'), 0)
    : 0;

  const isLoading = condosLoading || unitsLoading || contractsLoading || paymentsLoading || ticketsLoading || ownersLoading || financialLoading;

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
      href: "/external/owners/portfolio",
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

  // Today's events (filtered for today only)
  const todayEvents: any[] = [];
  const todayStart = startOfDay(today);
  const todayEnd = addDays(todayStart, 1);

  // Add payments due today
  if (payments) {
    payments
      .filter(p => {
        if (p.status !== 'pending') return false;
        const dueDate = new Date(p.dueDate);
        return dueDate >= todayStart && dueDate < todayEnd;
      })
      .forEach(p => {
        const unit = units?.find(u => u.id === p.unitId);
        const condo = condominiums?.find(c => c.id === unit?.condominiumId);
        const contract = normalizedContracts.find(c => c.contract.unitId === p.unitId && c.contract.status === 'active');
        const tenantName = contract?.contract.tenantName || '';
        
        todayEvents.push({
          type: 'payment',
          title: `${language === "es" ? "Pago" : "Payment"}: ${p.serviceType}`,
          serviceType: p.serviceType,
          condominium: condo?.name || (language === "es" ? "Sin condominio" : "No condominium"),
          unitNumber: unit?.unitNumber || '',
          tenantName: tenantName,
          date: new Date(p.dueDate),
          status: p.status,
        });
      });
  }

  // Add scheduled maintenance for today
  if (tickets) {
    tickets
      .filter(t => {
        if (!t.scheduledDate || (t.status !== 'open' && t.status !== 'in_progress')) return false;
        const scheduledDate = new Date(t.scheduledDate);
        return scheduledDate >= todayStart && scheduledDate < todayEnd;
      })
      .forEach(t => {
        const unit = units?.find(u => u.id === t.unitId);
        const condo = condominiums?.find(c => c.id === unit?.condominiumId);
        
        todayEvents.push({
          type: 'ticket',
          title: t.title,
          condominium: condo?.name || (language === "es" ? "Sin condominio" : "No condominium"),
          unitNumber: unit?.unitNumber || '',
          date: new Date(t.scheduledDate!),
          status: t.status,
        });
      });
  }

  // Group events by condominium
  const groupedByCondominium = todayEvents.reduce((acc, event) => {
    const key = event.condominium;
    if (!acc[key]) {
      acc[key] = {
        payments: [],
        tickets: [],
      };
    }
    
    if (event.type === 'payment') acc[key].payments.push(event);
    else if (event.type === 'ticket') acc[key].tickets.push(event);
    
    return acc;
  }, {} as Record<string, {payments: any[], tickets: any[]}>);

  const getServiceIcon = (serviceType?: string) => {
    if (!serviceType) return <Receipt className="h-4 w-4" />;
    switch (serviceType) {
      case 'electricity': return <Zap className="h-4 w-4" />;
      case 'water': return <Droplet className="h-4 w-4" />;
      case 'internet': return <Wifi className="h-4 w-4" />;
      case 'gas': return <Flame className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

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
        {/* Today's Events */}
        <Card data-testid="card-today-events" className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {language === "es" ? "Eventos de Hoy" : "Today's Events"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {format(today, language === "es" ? "d 'de' MMMM" : "MMMM d", { locale: language === "es" ? es : enUS })}
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
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : todayEvents.length > 0 ? (
              <div className="space-y-1.5">
                {todayEvents.slice(0, 8).map((event: any, idx: number) => {
                  const eventColor = event.type === 'payment' ? 'blue' : 'green';
                  const borderColor = event.type === 'payment' 
                    ? 'border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/10' 
                    : 'border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-950/10';
                  
                  return (
                    <div
                      key={idx}
                      className={`border rounded-md ${borderColor}`}
                      data-testid={`event-${idx}`}
                    >
                      <div className="p-2.5 hover-elevate cursor-pointer w-full">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-1">
                            <div className={`h-2 w-2 rounded-full bg-${eventColor}-500`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm truncate">{event.title}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-muted-foreground">
                                {event.condominium} - {language === "es" ? "Unidad" : "Unit"} {event.unitNumber}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant={event.status === 'paid' || event.status === 'completed' ? 'default' : 'secondary'} 
                                className="text-xs"
                              >
                                {event.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground" data-testid="text-no-events">
                  {language === "es" 
                    ? "No hay eventos para hoy" 
                    : "No events for today"}
                </p>
              </div>
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
    </div>
  );
}
