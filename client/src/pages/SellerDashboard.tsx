import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Home, 
  TrendingUp, 
  ArrowRight, 
  Calendar,
  Send,
  Bell,
  Target,
  DollarSign,
  FileText,
  MessageCircle,
  Eye,
  Phone,
  Building2,
  Percent,
  Activity,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface SellerSummary {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  todayShowings: number;
  upcomingShowings: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    leadName: string;
    propertyName: string;
  }>;
  recentActivities: Array<{
    id: string;
    activityType: string;
    description: string;
    createdAt: string;
    leadName: string;
  }>;
  convertedLeads: number;
  thisMonthLeads: number;
  conversionRate: number;
}

interface FollowUpsData {
  tasks: Array<{
    id: string;
    leadId: string;
    leadName: string;
    dueDate: string;
    type: string;
    notes: string;
  }>;
  overdueCount: number;
  todayCount: number;
  upcomingCount: number;
}

interface SellerMetrics {
  leads: {
    total: number;
    converted: number;
    thisMonth: number;
    conversionRate: number;
  };
  showings: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  activities: {
    total: number;
    thisWeek: number;
    byType: Record<string, number>;
  };
  propertiesSent: {
    total: number;
    thisMonth: number;
    interested: number;
  };
  followUps: {
    pending: number;
    overdue: number;
  };
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const locale = language === "es" ? es : enUS;
  
  const { data: summary, isLoading: loadingSummary } = useQuery<SellerSummary>({
    queryKey: ["/api/external-dashboard/seller-summary"],
  });

  const { data: followUps, isLoading: loadingFollowUps } = useQuery<FollowUpsData>({
    queryKey: ["/api/external-seller/follow-ups"],
  });

  const { data: metrics, isLoading: loadingMetrics } = useQuery<SellerMetrics>({
    queryKey: ["/api/external-seller/metrics"],
  });

  const isLoading = loadingSummary || loadingFollowUps || loadingMetrics;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone className="h-4 w-4" />;
      case "whatsapp": return <SiWhatsapp className="h-4 w-4" />;
      case "email": return <MessageCircle className="h-4 w-4" />;
      case "meeting": return <Users className="h-4 w-4" />;
      case "showing": return <Eye className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      nuevo_lead: { es: "Nuevo", en: "New" },
      cita_coordinada: { es: "Cita", en: "Scheduled" },
      interesado: { es: "Interesado", en: "Interested" },
      oferta_enviada: { es: "Oferta", en: "Offer Sent" },
      renta_concretada: { es: "Renta", en: "Rented" },
      perdido: { es: "Perdido", en: "Lost" },
    };
    return labels[status]?.[language] || status;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="flex-1 min-w-[100px] h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const totalLeads = summary?.totalLeads || 0;
  const conversionRate = summary?.conversionRate || 0;
  const todayShowings = summary?.todayShowings || 0;
  const propertiesSent = metrics?.propertiesSent?.thisMonth || 0;
  const followUpCount = (followUps?.overdueCount || 0) + (followUps?.todayCount || 0);

  return (
    <div className="space-y-5 sm:space-y-6 p-4 sm:p-6">
      {/* Header con mejor jerarquía tipográfica */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="heading-seller-dashboard">
          {language === "es" ? "Mi Dashboard" : "My Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {language === "es" ? "Resumen de ventas y actividades" : "Sales and activities summary"}
        </p>
      </div>

      {/* KPI Cards con mejor legibilidad */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="hover-elevate">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {language === "es" ? "Leads" : "Leads"}
              </span>
              <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-total-leads">{totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 dark:text-green-400 font-medium">+{summary?.thisMonthLeads || 0}</span> {language === "es" ? "este mes" : "this month"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {language === "es" ? "Conversión" : "Conversion"}
              </span>
              <div className="h-8 w-8 rounded-full bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                <Percent className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-conversion-rate">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.convertedLeads || 0} {language === "es" ? "cerrados" : "closed"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {language === "es" ? "Visitas Hoy" : "Today"}
              </span>
              <div className="h-8 w-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-today-showings">{todayShowings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "es" ? "programadas" : "scheduled"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {language === "es" ? "Enviadas" : "Sent"}
              </span>
              <div className="h-8 w-8 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                <Send className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-properties-sent">{propertiesSent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "es" ? "este mes" : "this month"}
            </p>
          </CardContent>
        </Card>

        <Card className={`col-span-2 sm:col-span-1 hover-elevate ${followUpCount > 0 ? "ring-2 ring-amber-400/50 dark:ring-amber-500/50" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {language === "es" ? "Seguimientos" : "Follow-ups"}
              </span>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${followUpCount > 0 ? "bg-amber-500/10 dark:bg-amber-500/20" : "bg-muted"}`}>
                <Bell className={`h-4 w-4 ${followUpCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-follow-ups">{followUpCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "es" ? "pendientes de contactar" : "pending contact"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acceso Rápido con mejor espaciado */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            {language === "es" ? "Acceso Rápido" : "Quick Access"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-3">
            <Link href="/external/leads">
              <Button variant="outline" className="w-full h-auto min-h-[64px] flex-col gap-1.5 py-3 px-2" data-testid="button-my-leads">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-[11px] sm:text-xs font-medium">{language === "es" ? "Leads" : "Leads"}</span>
              </Button>
            </Link>
            <Link href="/external/catalog">
              <Button variant="outline" className="w-full h-auto min-h-[64px] flex-col gap-1.5 py-3 px-2" data-testid="button-catalog">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] sm:text-xs font-medium">{language === "es" ? "Catálogo" : "Catalog"}</span>
              </Button>
            </Link>
            <Link href="/external/calendar">
              <Button variant="outline" className="w-full h-auto min-h-[64px] flex-col gap-1.5 py-3 px-2" data-testid="button-calendar">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-[11px] sm:text-xs font-medium">{language === "es" ? "Agenda" : "Calendar"}</span>
              </Button>
            </Link>
            <Link href="/external/commissions">
              <Button variant="outline" className="w-full h-auto min-h-[64px] flex-col gap-1.5 py-3 px-2" data-testid="button-commissions">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-[11px] sm:text-xs font-medium">{language === "es" ? "Ingresos" : "Income"}</span>
              </Button>
            </Link>
            <Link href="/external/catalog">
              <Button variant="default" className="w-full h-auto min-h-[64px] flex-col gap-1.5 py-3 px-2" data-testid="button-whatsapp-send">
                <SiWhatsapp className="h-5 w-5" />
                <span className="text-[11px] sm:text-xs font-medium">{language === "es" ? "Enviar" : "Send"}</span>
              </Button>
            </Link>
            <Link href="/external/templates" className="hidden sm:block">
              <Button variant="outline" className="w-full h-auto min-h-[64px] flex-col gap-1.5 py-3 px-2" data-testid="button-templates">
                <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="text-[11px] sm:text-xs font-medium">{language === "es" ? "Plantillas" : "Templates"}</span>
              </Button>
            </Link>
            <Link href="/external/reports" className="hidden sm:block">
              <Button variant="outline" className="w-full h-auto min-h-[64px] flex-col gap-1.5 py-3 px-2" data-testid="button-reports">
                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[11px] sm:text-xs font-medium">{language === "es" ? "Reportes" : "Reports"}</span>
              </Button>
            </Link>
            <Link href="/external/goals" className="hidden lg:block">
              <Button variant="outline" className="w-full h-auto min-h-[64px] flex-col gap-1.5 py-3 px-2" data-testid="button-goals">
                <Target className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                <span className="text-[11px] sm:text-xs font-medium">{language === "es" ? "Metas" : "Goals"}</span>
              </Button>
            </Link>
            <Link href="/external/leads" className="hidden lg:block">
              <Button variant="outline" className="w-full h-auto min-h-[64px] flex-col gap-1.5 py-3 px-2" data-testid="button-reminders">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] sm:text-xs font-medium">{language === "es" ? "Avisos" : "Reminders"}</span>
              </Button>
            </Link>
            <Link href="/external/leads" className="hidden lg:block">
              <Button variant="outline" className="w-full h-auto min-h-[64px] flex-col gap-1.5 py-3 px-2 border-primary/30" data-testid="button-add-lead">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-[11px] sm:text-xs font-medium">{language === "es" ? "+ Lead" : "+ Lead"}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Grid de secciones con mejor espaciado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <Card>
          <CardHeader className="pb-3 px-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg font-semibold" data-testid="heading-upcoming-showings">
                  {language === "es" ? "Próximas Visitas" : "Upcoming Showings"}
                </CardTitle>
                <CardDescription className="text-sm">
                  {language === "es" ? "Citas programadas" : "Scheduled appointments"}
                </CardDescription>
              </div>
              <Link href="/external/calendar">
                <Button variant="outline" size="sm" className="min-h-[40px] gap-1.5" data-testid="button-view-calendar">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">{language === "es" ? "Ver todo" : "View all"}</span>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {!summary?.upcomingShowings?.length ? (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{language === "es" ? "No hay visitas programadas" : "No scheduled showings"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.upcomingShowings.slice(0, 5).map((showing) => {
                  const showingDate = new Date(showing.scheduledAt);
                  const dateLabel = isToday(showingDate) 
                    ? (language === "es" ? "Hoy" : "Today")
                    : isTomorrow(showingDate)
                    ? (language === "es" ? "Mañana" : "Tomorrow")
                    : format(showingDate, "EEE d", { locale });
                  
                  return (
                    <div
                      key={showing.id}
                      className="flex items-center justify-between gap-3 p-3 border rounded-lg hover-elevate"
                      data-testid={`showing-${showing.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{showing.leadName}</p>
                        <p className="text-xs text-muted-foreground truncate">{showing.propertyName}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={isToday(showingDate) ? "default" : "secondary"} className="text-xs">
                          {dateLabel}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(showingDate, "HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 px-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <CardTitle className="text-base sm:text-lg font-semibold" data-testid="heading-recent-activities">
                  {language === "es" ? "Actividades Recientes" : "Recent Activities"}
                </CardTitle>
                <CardDescription className="text-sm">
                  {language === "es" ? "Interacciones con leads" : "Lead interactions"}
                </CardDescription>
              </div>
              <Link href="/external/reports">
                <Button variant="outline" size="sm" className="min-h-[40px] gap-1.5" data-testid="button-view-activities">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">{language === "es" ? "Ver todo" : "View all"}</span>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {!summary?.recentActivities?.length ? (
              <div className="text-center py-6 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{language === "es" ? "No hay actividades recientes" : "No recent activities"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.recentActivities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className="mt-0.5 text-muted-foreground">
                      {getActivityIcon(activity.activityType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.leadName}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(activity.createdAt), "d MMM, HH:mm", { locale })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {summary?.leadsByStatus && Object.keys(summary.leadsByStatus).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">
              {language === "es" ? "Leads por Estado" : "Leads by Status"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.leadsByStatus).map(([status, count]) => (
                <Badge key={status} variant="secondary" className="text-sm py-1 px-3">
                  {getStatusLabel(status)}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
