import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, DollarSign, Wrench, TrendingUp, Calendar, FileText, ArrowRight, User, TrendingDown, ArrowUpRight, ArrowDownRight, Wifi, Zap, Droplet, Flame, Receipt } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { format, addDays, startOfDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { ExternalPayment, ExternalMaintenanceTicket } from "@shared/schema";

type DashboardSummary = {
  totalCondominiums: number;
  totalUnits: number;
  activeRentals: number;
  rentalsEndingSoon: number;
  completedRentals: number;
  pendingPayments: number;
  overduePayments: number;
  paymentsNext7Days: number;
  openTickets: number;
  scheduledTicketsNext7Days: number;
  totalOwners: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  expectedMonthlyIncome: number;
  occupancyRate: number;
};

type TodayEvent = {
  type: 'payment' | 'service' | 'ticket';
  title: string;
  serviceType?: string;
  date: Date;
  status: string;
};

export default function ExternalDashboard() {
  const { language } = useLanguage();
  const today = new Date();

  const { data: summary, isLoading: summaryLoading } = useQuery<DashboardSummary>({
    queryKey: ['/api/external-dashboard-summary'],
    staleTime: 2 * 60 * 1000,
  });

  const { data: todayPaymentsData } = useQuery<{ data: ExternalPayment[]; total: number }>({
    queryKey: ['/api/external-payments?dueToday=true&limit=10'],
    staleTime: 2 * 60 * 1000,
  });

  const { data: todayTicketsResponse } = useQuery<{ data: ExternalMaintenanceTicket[]; total: number }>({
    queryKey: ['/api/external-tickets?dateFilter=today&page=1&pageSize=50'],
    staleTime: 2 * 60 * 1000,
  });
  const todayTicketsData = todayTicketsResponse?.data;

  const isLoading = summaryLoading;

  const stats = summary || {
    totalCondominiums: 0,
    totalUnits: 0,
    activeRentals: 0,
    rentalsEndingSoon: 0,
    completedRentals: 0,
    pendingPayments: 0,
    overduePayments: 0,
    paymentsNext7Days: 0,
    openTickets: 0,
    scheduledTicketsNext7Days: 0,
    totalOwners: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    expectedMonthlyIncome: 0,
    occupancyRate: 0,
  };

  const occupiedUnits = stats.activeRentals;
  const activeUnits = stats.totalUnits;
  const occupancyRate = stats.occupancyRate;
  const monthlyNetIncome = stats.monthlyIncome - stats.monthlyExpenses;

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

  const todayEvents: TodayEvent[] = [];
  const todayStart = startOfDay(today);
  const todayEnd = addDays(todayStart, 1);

  const payments = Array.isArray(todayPaymentsData) ? todayPaymentsData : (todayPaymentsData?.data || []);
  if (payments) {
    payments
      .filter(p => {
        if (p.status !== 'pending') return false;
        const dueDate = new Date(p.dueDate);
        return dueDate >= todayStart && dueDate < todayEnd;
      })
      .slice(0, 5)
      .forEach(p => {
        const isRentPayment = p.serviceType === 'rent';
        const serviceTypeLabel = language === "es"
          ? (p.serviceType === 'electricity' ? 'Electricidad' :
             p.serviceType === 'water' ? 'Agua' :
             p.serviceType === 'internet' ? 'Internet' :
             p.serviceType === 'gas' ? 'Gas' :
             p.serviceType === 'rent' ? 'Renta' : p.serviceType)
          : p.serviceType;
        
        todayEvents.push({
          type: isRentPayment ? 'payment' : 'service',
          title: `${serviceTypeLabel} - ${language === "es" ? "Pago pendiente" : "Pending payment"}`,
          serviceType: p.serviceType,
          date: new Date(p.dueDate),
          status: p.status,
        });
      });
  }

  const tickets = todayTicketsData || [];
  if (tickets) {
    tickets
      .filter(t => {
        if (!t.scheduledDate || (t.status !== 'open' && t.status !== 'in_progress')) return false;
        const scheduledDate = new Date(t.scheduledDate);
        return scheduledDate >= todayStart && scheduledDate < todayEnd;
      })
      .slice(0, 5)
      .forEach(t => {
        todayEvents.push({
          type: 'ticket',
          title: t.title,
          date: new Date(t.scheduledDate!),
          status: t.status,
        });
      });
  }

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
                  {occupiedUnits}/{activeUnits} {language === "es" ? "ocupadas" : "occupied"}
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

      <div className="grid gap-4 lg:grid-cols-3">
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
              </div>
            ) : todayEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {language === "es" ? "No hay eventos para hoy" : "No events for today"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayEvents.map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    data-testid={`today-event-${idx}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        event.type === 'payment' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                        event.type === 'service' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                        'bg-orange-100 text-orange-600 dark:bg-orange-900/30'
                      }`}>
                        {event.type === 'ticket' ? (
                          <Wrench className="h-4 w-4" />
                        ) : (
                          getServiceIcon(event.serviceType)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(event.date, "HH:mm", { locale: language === "es" ? es : enUS })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={event.status === 'pending' ? 'secondary' : 'outline'} className="text-xs">
                      {event.type === 'payment' || event.type === 'service'
                        ? (language === "es" ? "Pendiente" : "Pending")
                        : (event.status === 'in_progress' 
                            ? (language === "es" ? "En progreso" : "In progress")
                            : (language === "es" ? "Abierto" : "Open"))}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-payment-status">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {language === "es" ? "Estado de Pagos" : "Payment Status"}
            </CardTitle>
            <CardDescription className="text-xs">
              {language === "es" ? "Resumen de cobranzas" : "Collection summary"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">
                      {language === "es" ? "Pendientes" : "Pending"}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50">
                    {stats.pendingPayments}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">
                      {language === "es" ? "Vencidos" : "Overdue"}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/50">
                    {stats.overduePayments}
                  </Badge>
                </div>
                <Link href="/external/accounting">
                  <Button variant="ghost" size="sm" className="w-full mt-2" data-testid="button-view-payments">
                    {language === "es" ? "Ver contabilidad" : "View accounting"}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card data-testid="card-financial-summary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {language === "es" ? "Resumen Financiero" : "Financial Summary"}
            </CardTitle>
            <CardDescription className="text-xs">
              {language === "es" ? "Ingresos y gastos del mes" : "Monthly income and expenses"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">{language === "es" ? "Ingresos" : "Income"}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Esperado" : "Expected"}: ${stats.expectedMonthlyIncome.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    ${stats.monthlyIncome.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    <p className="text-sm font-medium">{language === "es" ? "Gastos" : "Expenses"}</p>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    ${stats.monthlyExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    {monthlyNetIncome >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <p className="text-sm font-medium">{language === "es" ? "Neto" : "Net"}</p>
                  </div>
                  <span className={`text-lg font-bold ${monthlyNetIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${monthlyNetIncome.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-maintenance-summary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {language === "es" ? "Mantenimiento" : "Maintenance"}
            </CardTitle>
            <CardDescription className="text-xs">
              {language === "es" ? "Estado de tickets" : "Ticket status"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-orange-600" />
                    <p className="text-sm font-medium">
                      {language === "es" ? "Tickets Abiertos" : "Open Tickets"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/50">
                    {stats.openTickets}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium">
                      {language === "es" ? "Programados esta semana" : "Scheduled this week"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/50">
                    {stats.scheduledTicketsNext7Days}
                  </Badge>
                </div>
                <Link href="/external/maintenance">
                  <Button variant="ghost" size="sm" className="w-full mt-2" data-testid="button-view-maintenance">
                    {language === "es" ? "Ver mantenimiento" : "View maintenance"}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
