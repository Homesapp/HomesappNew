import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Wrench, 
  TrendingUp, 
  Calendar, 
  FileText, 
  User, 
  Users, 
  Key, 
  ScrollText, 
  DollarSign, 
  UserCircle2 
} from "lucide-react";
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
      title: language === "es" ? "Cuentas" : "Accounts",
      description: language === "es" ? "Gestión de usuarios" : "User management",
      icon: Users,
      href: "/external/accounts",
      color: "text-indigo-600",
    },
    {
      title: language === "es" ? "Accesos" : "Accesses",
      description: language === "es" ? "Control de accesos" : "Access control",
      icon: Key,
      href: "/external/accesses",
      color: "text-amber-600",
    },
    {
      title: language === "es" ? "Condominios" : "Condominiums",
      description: language === "es" ? "Propiedades y unidades" : "Properties and units",
      icon: Building2,
      href: "/external/condominiums",
      color: "text-blue-600",
      count: stats.totalCondominiums,
    },
    {
      title: language === "es" ? "Contratos" : "Contracts",
      description: language === "es" ? "Documentos legales" : "Legal documents",
      icon: ScrollText,
      href: "/external/contracts",
      color: "text-cyan-600",
    },
    {
      title: language === "es" ? "Rentas" : "Rentals",
      description: language === "es" ? "Contratos activos" : "Active contracts",
      icon: FileText,
      href: "/external/rentals",
      color: "text-purple-600",
      count: stats.activeRentals,
    },
    {
      title: language === "es" ? "Contabilidad" : "Accounting",
      description: language === "es" ? "Finanzas y reportes" : "Finances and reports",
      icon: DollarSign,
      href: "/external/accounting",
      color: "text-emerald-600",
    },
    {
      title: language === "es" ? "Mantenimiento" : "Maintenance",
      description: language === "es" ? "Tickets y trabajadores" : "Tickets and workers",
      icon: Wrench,
      href: "/external/maintenance",
      color: "text-orange-600",
      count: stats.openTickets,
    },
    {
      title: language === "es" ? "Calendario" : "Calendar",
      description: language === "es" ? "Eventos y citas" : "Events and appointments",
      icon: Calendar,
      href: "/external/calendar",
      color: "text-rose-600",
      count: stats.paymentsNext7Days + stats.scheduledTicketsNext7Days,
    },
    {
      title: language === "es" ? "Propietarios" : "Owners",
      description: language === "es" ? "Portafolio de dueños" : "Owners portfolio",
      icon: User,
      href: "/external/owners/portfolio",
      color: "text-teal-600",
      count: stats.totalOwners,
    },
    {
      title: language === "es" ? "Clientes" : "Clients",
      description: language === "es" ? "CRM y seguimiento" : "CRM and tracking",
      icon: UserCircle2,
      href: "/external/clients",
      color: "text-pink-600",
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
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {quickActions.map((action, idx) => (
            <Link key={idx} href={action.href}>
              <Card className="hover-elevate cursor-pointer transition-all h-full" data-testid={`quick-action-${idx}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                    {action.count !== undefined && action.count > 0 && (
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
    </div>
  );
}
