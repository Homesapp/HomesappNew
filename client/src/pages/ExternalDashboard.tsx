import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  DollarSign, 
  Wrench, 
  TrendingUp, 
  Calendar, 
  FileText, 
  User, 
  ScrollText, 
  UserCircle2, 
  Users,
  Key,
  Target,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Percent,
  UserPlus,
  Activity,
  Home,
  Bell,
  Share2,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation, useRoute } from "wouter";
import { FirstStepsChecklist, QuickActionsCard, EmptyState } from "@/components/OnboardingSystem";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

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

type SellerDashboardSummary = {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  todayShowings: number;
  upcomingShowings: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    leadName: string;
    propertyName: string | null;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    notes: string | null;
    createdAt: string;
    leadName: string;
  }>;
  convertedLeads: number;
  thisMonthLeads: number;
  conversionRate: number;
};

const LEAD_STATUS_LABELS: Record<string, Record<string, string>> = {
  es: {
    nuevo_lead: "Nuevo Lead",
    opciones_enviadas: "Opciones Enviadas",
    cita_coordinada: "Cita Coordinada",
    cita_concretada: "Cita Concretada",
    cita_cancelada: "Cita Cancelada",
    reprogramar_cita: "Reprogramar Cita",
    interesado: "Interesado",
    oferta_enviada: "Oferta Enviada",
    formato_renta_enviado: "Formato Renta Enviado",
    proceso_renta: "Proceso de Renta",
    renta_concretada: "Renta Concretada",
    no_responde: "No Responde",
    muerto: "Muerto",
    no_dar_servicio: "No Dar Servicio",
  },
  en: {
    nuevo_lead: "New Lead",
    opciones_enviadas: "Options Sent",
    cita_coordinada: "Appointment Scheduled",
    cita_concretada: "Appointment Completed",
    cita_cancelada: "Appointment Cancelled",
    reprogramar_cita: "Reschedule",
    interesado: "Interested",
    oferta_enviada: "Offer Sent",
    formato_renta_enviado: "Rental Form Sent",
    proceso_renta: "Rental Process",
    renta_concretada: "Rental Completed",
    no_responde: "No Response",
    muerto: "Dead Lead",
    no_dar_servicio: "Do Not Service",
  },
};

const ACTIVITY_TYPE_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  whatsapp: Phone,
  showing: MapPin,
  note: FileText,
};

function SellerDashboard() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const dateLocale = language === "es" ? es : enUS;

  const { data: summary, isLoading } = useQuery<SellerDashboardSummary>({
    queryKey: ['/api/external-dashboard/seller-summary'],
    staleTime: 2 * 60 * 1000,
  });

  const { data: sellerMetrics } = useQuery<{
    leads: { total: number; converted: number; thisMonth: number; conversionRate: number };
    propertiesSent: { total: number; thisMonth: number; interested: number };
    followUps: { pending: number; overdue: number };
  }>({
    queryKey: ['/api/external-seller/metrics'],
    staleTime: 2 * 60 * 1000,
  });

  const { data: followUps } = useQuery<{
    tasks: Array<{
      id: string;
      leadFirstName: string;
      leadLastName: string;
      leadPhone: string;
      dueDate: string;
      priority: string;
      reason: string;
    }>;
    overdueCount: number;
    totalPending: number;
  }>({
    queryKey: ['/api/external-seller/follow-ups'],
    staleTime: 60 * 1000,
  });

  const stats = summary || {
    totalLeads: 0,
    leadsByStatus: {},
    todayShowings: 0,
    upcomingShowings: [],
    recentActivities: [],
    convertedLeads: 0,
    thisMonthLeads: 0,
    conversionRate: 0,
  };

  const quickActions = [
    {
      title: language === "es" ? "Mis Leads" : "My Leads",
      description: language === "es" ? "Gestionar prospectos asignados" : "Manage assigned prospects",
      icon: UserPlus,
      href: "/external/clients",
      color: "text-blue-600",
      count: stats.totalLeads,
    },
    {
      title: language === "es" ? "Catálogo" : "Catalog",
      description: language === "es" ? "Buscar y compartir propiedades" : "Search and share properties",
      icon: Home,
      href: "/external/seller-catalog",
      color: "text-indigo-600",
    },
    {
      title: language === "es" ? "Reportes" : "Reports",
      description: language === "es" ? "Ver mi rendimiento" : "View my performance",
      icon: BarChart3,
      href: "/external/seller-reports",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          {language === "es" ? "Mi Dashboard de Ventas" : "My Sales Dashboard"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "es" 
            ? "Resumen de tus leads, visitas y actividades"
            : "Summary of your leads, showings and activities"}
        </p>
      </div>

      {/* First Steps Checklist - for new sellers */}
      <FirstStepsChecklist
        userRole="seller"
        onStepClick={(stepId, path) => {
          if (path) {
            setLocation(path);
          }
        }}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card data-testid="card-total-leads">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Leads Asignados" : "Assigned Leads"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-leads">
                {stats.totalLeads}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {stats.thisMonthLeads > 0 && (
                <span className="text-green-600">
                  +{stats.thisMonthLeads} {language === "es" ? "este mes" : "this month"}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion-rate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Tasa de Conversión" : "Conversion Rate"}
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-conversion-rate">
                  {stats.conversionRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.convertedLeads} {language === "es" ? "convertidos" : "converted"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-today-showings">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Visitas Hoy" : "Today's Showings"}
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-today-showings">
                  {stats.todayShowings}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "es" ? "Programadas para hoy" : "Scheduled for today"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-properties-sent">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Propiedades Enviadas" : "Properties Sent"}
            </CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-properties-sent">
                  {sellerMetrics?.propertiesSent.total || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {sellerMetrics?.propertiesSent.thisMonth || 0} {language === "es" ? "este mes" : "this month"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-follow-ups">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Seguimientos" : "Follow-ups"}
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold" data-testid="text-follow-ups">
                    {followUps?.totalPending || 0}
                  </span>
                  {(followUps?.overdueCount || 0) > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {followUps?.overdueCount} {language === "es" ? "vencidos" : "overdue"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "es" ? "Pendientes de contactar" : "Pending to contact"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{language === "es" ? "Acceso Rápido" : "Quick Access"}</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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
                  <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Follow-up Reminders */}
      {(followUps?.tasks?.length || 0) > 0 && (
        <Card data-testid="card-followup-reminders" className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-600" />
                {language === "es" ? "Seguimientos Pendientes" : "Pending Follow-ups"}
              </CardTitle>
              {(followUps?.overdueCount || 0) > 0 && (
                <Badge variant="destructive">
                  {followUps?.overdueCount} {language === "es" ? "vencidos" : "overdue"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {followUps?.tasks?.slice(0, 5).map((task) => {
                const isOverdue = new Date(task.dueDate) < new Date();
                return (
                  <div 
                    key={task.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isOverdue ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30' : ''
                    }`}
                    data-testid={`followup-item-${task.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        isOverdue ? 'bg-red-100 dark:bg-red-900' : 'bg-amber-100 dark:bg-amber-900'
                      }`}>
                        {isOverdue ? (
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {task.leadFirstName} {task.leadLastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {task.reason || (language === "es" ? "Seguimiento pendiente" : "Pending follow-up")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {format(new Date(task.dueDate), "d MMM", { locale: dateLocale })}
                      </span>
                      <Link href={`/external/clients`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          {language === "es" ? "Ver" : "View"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Showings */}
        <Card data-testid="card-upcoming-showings-list">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {language === "es" ? "Próximas Visitas" : "Upcoming Showings"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : stats.upcomingShowings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {language === "es" ? "No hay visitas programadas" : "No scheduled showings"}
              </p>
            ) : (
              <div className="space-y-3">
                {stats.upcomingShowings.map((showing) => (
                  <div 
                    key={showing.id} 
                    className="flex items-start gap-3 p-3 rounded-lg border"
                    data-testid={`showing-item-${showing.id}`}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{showing.leadName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {showing.propertyName || (language === "es" ? "Propiedad no especificada" : "Property not specified")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(showing.scheduledAt), "PPp", { locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card data-testid="card-recent-activities">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {language === "es" ? "Actividades Recientes" : "Recent Activities"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : stats.recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {language === "es" ? "No hay actividades recientes" : "No recent activities"}
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivities.map((activity) => {
                  const ActivityIcon = ACTIVITY_TYPE_ICONS[activity.type] || FileText;
                  return (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-3 p-3 rounded-lg border"
                      data-testid={`activity-item-${activity.id}`}
                    >
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <ActivityIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{activity.leadName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.notes || activity.type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.createdAt), "PPp", { locale: dateLocale })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();

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
    {
      title: language === "es" ? "Condominios" : "Condominiums",
      description: language === "es" ? "Administrar propiedades" : "Manage properties",
      icon: Building2,
      href: "/external/condominiums",
      color: "text-indigo-600",
      count: stats.totalCondominiums,
    },
    {
      title: language === "es" ? "Contratos" : "Contracts",
      description: language === "es" ? "Procesos de contratación" : "Contract processes",
      icon: ScrollText,
      href: "/external/contracts",
      color: "text-teal-600",
    },
    {
      title: language === "es" ? "Contabilidad" : "Accounting",
      description: language === "es" ? "Ingresos y gastos" : "Income and expenses",
      icon: DollarSign,
      href: "/external/accounting",
      color: "text-emerald-600",
    },
    {
      title: language === "es" ? "Clientes" : "Clients",
      description: language === "es" ? "CRM y leads" : "CRM and leads",
      icon: UserCircle2,
      href: "/external/clients",
      color: "text-pink-600",
    },
    {
      title: language === "es" ? "Cuentas" : "Accounts",
      description: language === "es" ? "Usuarios del sistema" : "System users",
      icon: Users,
      href: "/external/accounts",
      color: "text-cyan-600",
    },
    {
      title: language === "es" ? "Accesos" : "Accesses",
      description: language === "es" ? "Control de accesos" : "Access control",
      icon: Key,
      href: "/external/accesses",
      color: "text-amber-600",
    },
  ];

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

      {/* First Steps Checklist - for external agency admins */}
      <FirstStepsChecklist
        userRole="external_admin"
        onStepClick={(stepId, path) => {
          if (path) {
            setLocation(path);
          }
        }}
      />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5">
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
                  <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExternalDashboard() {
  const { user } = useAuth();
  
  // Show seller dashboard for external_agency_seller role
  if (user?.role === 'external_agency_seller') {
    return <SellerDashboard />;
  }
  
  // Show admin dashboard for other roles
  return <AdminDashboard />;
}
