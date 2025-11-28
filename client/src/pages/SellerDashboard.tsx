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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24" />
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
    <div className="space-y-4 sm:space-y-6 p-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="heading-seller-dashboard">
          {language === "es" ? "Mi Dashboard de Ventas" : "My Sales Dashboard"}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {language === "es" ? "Resumen de tus leads, visitas y actividades" : "Summary of your leads, visits and activities"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {language === "es" ? "Leads Asignados" : "Assigned Leads"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold" data-testid="text-total-leads">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.thisMonthLeads || 0} {language === "es" ? "este mes" : "this month"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {language === "es" ? "Tasa de Conversión" : "Conversion Rate"}
            </CardTitle>
            <Percent className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold" data-testid="text-conversion-rate">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {summary?.convertedLeads || 0} {language === "es" ? "convertidos" : "converted"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {language === "es" ? "Visitas Hoy" : "Today's Visits"}
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold" data-testid="text-today-showings">{todayShowings}</div>
            <p className="text-xs text-muted-foreground">
              {language === "es" ? "Programadas para hoy" : "Scheduled for today"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {language === "es" ? "Propiedades Enviadas" : "Properties Sent"}
            </CardTitle>
            <Send className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold" data-testid="text-properties-sent">{propertiesSent}</div>
            <p className="text-xs text-muted-foreground">
              {language === "es" ? "Este mes" : "This month"}
            </p>
          </CardContent>
        </Card>

        <Card className={followUpCount > 0 ? "border-amber-300 dark:border-amber-700" : ""}>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {language === "es" ? "Seguimientos" : "Follow-ups"}
            </CardTitle>
            <Bell className={`h-4 w-4 ${followUpCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold" data-testid="text-follow-ups">{followUpCount}</div>
            <p className="text-xs text-muted-foreground">
              {followUps?.overdueCount || 0} {language === "es" ? "pendientes de contactar" : "pending contact"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">
            {language === "es" ? "Acceso Rápido" : "Quick Access"}
          </CardTitle>
          <CardDescription>
            {language === "es" ? "Gestiona tus leads y actividades" : "Manage your leads and activities"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link href="/external/leads">
              <Button variant="outline" className="w-full h-auto min-h-[56px] flex-col gap-1 py-3" data-testid="button-my-leads">
                <Users className="h-5 w-5" />
                <span className="text-xs">{language === "es" ? "Mis Leads" : "My Leads"}</span>
              </Button>
            </Link>
            <Link href="/external/catalog">
              <Button variant="outline" className="w-full h-auto min-h-[56px] flex-col gap-1 py-3" data-testid="button-catalog">
                <Building2 className="h-5 w-5" />
                <span className="text-xs">{language === "es" ? "Catálogo" : "Catalog"}</span>
              </Button>
            </Link>
            <Link href="/external/calendar">
              <Button variant="outline" className="w-full h-auto min-h-[56px] flex-col gap-1 py-3" data-testid="button-calendar">
                <Calendar className="h-5 w-5" />
                <span className="text-xs">{language === "es" ? "Mi Calendario" : "My Calendar"}</span>
              </Button>
            </Link>
            <Link href="/external/templates">
              <Button variant="outline" className="w-full h-auto min-h-[56px] flex-col gap-1 py-3" data-testid="button-templates">
                <FileText className="h-5 w-5" />
                <span className="text-xs">{language === "es" ? "Plantillas" : "Templates"}</span>
              </Button>
            </Link>
            <Link href="/external/reports">
              <Button variant="outline" className="w-full h-auto min-h-[56px] flex-col gap-1 py-3" data-testid="button-reports">
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs">{language === "es" ? "Mis Reportes" : "My Reports"}</span>
              </Button>
            </Link>
            <Link href="/external/commissions">
              <Button variant="outline" className="w-full h-auto min-h-[56px] flex-col gap-1 py-3" data-testid="button-commissions">
                <DollarSign className="h-5 w-5" />
                <span className="text-xs">{language === "es" ? "Mis Comisiones" : "My Commissions"}</span>
              </Button>
            </Link>
            <Link href="/external/goals">
              <Button variant="outline" className="w-full h-auto min-h-[56px] flex-col gap-1 py-3" data-testid="button-goals">
                <Target className="h-5 w-5" />
                <span className="text-xs">{language === "es" ? "Mis Metas" : "My Goals"}</span>
              </Button>
            </Link>
            <Link href="/external/leads">
              <Button variant="outline" className="w-full h-auto min-h-[56px] flex-col gap-1 py-3 border-green-200 dark:border-green-800" data-testid="button-whatsapp-send">
                <SiWhatsapp className="h-5 w-5 text-green-500" />
                <span className="text-xs">{language === "es" ? "Enviar WhatsApp" : "Send WhatsApp"}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg" data-testid="heading-upcoming-showings">
                  {language === "es" ? "Próximas Visitas" : "Upcoming Showings"}
                </CardTitle>
                <CardDescription>
                  {language === "es" ? "Tus próximas citas programadas" : "Your upcoming scheduled appointments"}
                </CardDescription>
              </div>
              <Link href="/external/calendar">
                <Button variant="ghost" size="sm" className="min-h-[44px]" data-testid="button-view-calendar">
                  <Calendar className="h-4 w-4 mr-1" />
                  {language === "es" ? "Ver" : "View"}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
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
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg" data-testid="heading-recent-activities">
                  {language === "es" ? "Actividades Recientes" : "Recent Activities"}
                </CardTitle>
                <CardDescription>
                  {language === "es" ? "Tus últimas interacciones con leads" : "Your latest interactions with leads"}
                </CardDescription>
              </div>
              <Link href="/external/reports">
                <Button variant="ghost" size="sm" className="min-h-[44px]" data-testid="button-view-activities">
                  <Activity className="h-4 w-4 mr-1" />
                  {language === "es" ? "Ver" : "View"}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
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
