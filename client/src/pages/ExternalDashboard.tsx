import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Wrench, TrendingUp, Calendar, FileText, ArrowRight, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

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

export default function ExternalDashboard() {
  const { language } = useLanguage();

  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['/api/external-dashboard-summary'],
    staleTime: 2 * 60 * 1000,
  });

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          {language === "es" ? "Inicio" : "Home"}
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

      <div className="grid gap-4 lg:grid-cols-2">
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

        <Card data-testid="card-rentals-summary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {language === "es" ? "Rentas" : "Rentals"}
            </CardTitle>
            <CardDescription className="text-xs">
              {language === "es" ? "Estado de contratos" : "Contract status"}
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
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <p className="text-sm font-medium">
                      {language === "es" ? "Rentas Activas" : "Active Rentals"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/50">
                    {stats.activeRentals}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium">
                      {language === "es" ? "Por vencer pronto" : "Ending soon"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50">
                    {stats.rentalsEndingSoon}
                  </Badge>
                </div>
                <Link href="/external/rentals">
                  <Button variant="ghost" size="sm" className="w-full mt-2" data-testid="button-view-rentals">
                    {language === "es" ? "Ver rentas" : "View rentals"}
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
