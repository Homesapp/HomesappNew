import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarIcon, 
  MapPin, 
  Clock, 
  Video, 
  Home, 
  Heart, 
  Search, 
  Zap,
  TrendingUp,
  Building2,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import type { Appointment, Property, User as UserType, Lead } from "@shared/schema";
import { WelcomeModal } from "@/components/WelcomeModal";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useLanguage } from "@/contexts/LanguageContext";

type AppointmentWithRelations = Appointment & {
  property?: Property;
  client?: UserType;
  concierge?: UserType;
};

type PropertyWithFavorite = Property & {
  favoriteId?: string;
};

const STATUS_COLORS = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export default function ClientDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  
  const dateLocale = language === 'es' ? es : enUS;
  const dateFormat = language === 'es' 
    ? "dd 'de' MMMM 'de' yyyy 'a las' HH:mm"
    : "MMMM dd, yyyy 'at' HH:mm";
  
  const STATUS_LABELS = {
    pending: t("clientDashboard.pending"),
    confirmed: t("clientDashboard.confirmed"),
    completed: t("clientDashboard.completed"),
    cancelled: t("clientDashboard.cancelled"),
  };

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<AppointmentWithRelations[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<PropertyWithFavorite[]>({
    queryKey: ["/api/favorites"],
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const myAppointments = appointments.filter(apt => apt.clientId === user?.id);
  const upcomingAppointments = myAppointments
    .filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= new Date() && (apt.status === "pending" || apt.status === "confirmed");
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const myLeads = leads.filter(lead => 
    lead.clientId === user?.id && 
    lead.status !== "closed_lost" && 
    lead.status !== "closed_won"
  );

  const isLoading = appointmentsLoading || favoritesLoading || leadsLoading;

  if (isLoading) {
    return <LoadingScreen className="h-full" />;
  }

  return (
    <>
      {!isAuthLoading && user && (
        <WelcomeModal 
          userRole="cliente" 
          hasSeenWelcome={user.hasSeenWelcome || false}
          lastWelcomeShown={user.lastWelcomeShown}
        />
      )}
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
            {t("clientDashboard.welcome")} {user?.firstName || t("clientDashboard.clientFallback")}
          </h1>
          <p className="text-muted-foreground">
            {t("clientDashboard.subtitle")}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-stat-appointments">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("clientDashboard.upcomingAppointments")}</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                {upcomingAppointments.length === 1 ? t("clientDashboard.appointmentScheduled") : t("clientDashboard.appointmentsScheduled")}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-favorites">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("clientDashboard.favorites")}</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{favorites.length}</div>
              <p className="text-xs text-muted-foreground">
                {favorites.length === 1 ? t("clientDashboard.propertySaved") : t("clientDashboard.propertiesSaved")}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-opportunities">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("clientDashboard.opportunities")}</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myLeads.length}</div>
              <p className="text-xs text-muted-foreground">
                {myLeads.length === 1 ? t("clientDashboard.activeOpportunity") : t("clientDashboard.activeOpportunities")}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-properties">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("clientDashboard.propertiesViewed")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                {t("clientDashboard.visitsCompleted")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card data-testid="card-quick-actions">
          <CardHeader>
            <CardTitle>{t("clientDashboard.quickActions")}</CardTitle>
            <CardDescription>{t("clientDashboard.quickActionsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button 
              onClick={() => setLocation("/buscar-propiedades")}
              data-testid="button-search-properties"
            >
              <Search className="h-4 w-4 mr-2" />
              {t("clientDashboard.searchProperties")}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation("/favoritos")}
              data-testid="button-view-favorites"
            >
              <Heart className="h-4 w-4 mr-2" />
              {t("clientDashboard.viewFavorites")}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation("/mis-citas")}
              data-testid="button-manage-appointments"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {t("clientDashboard.manageAppointments")}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation("/mis-oportunidades")}
              data-testid="button-view-opportunities"
            >
              <Zap className="h-4 w-4 mr-2" />
              {t("clientDashboard.myOpportunities")}
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <Card data-testid="card-upcoming-appointments">
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0">
              <div>
                <CardTitle>{t("clientDashboard.upcomingAppointments")}</CardTitle>
                <CardDescription>{t("clientDashboard.scheduledVisits")}</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/mis-citas")}
                data-testid="button-view-all-appointments"
              >
                {t("clientDashboard.viewAll")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="hover-elevate" data-testid={`card-appointment-${appointment.id}`}>
                  <CardHeader className="space-y-0 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-medium line-clamp-1">
                          {appointment.property?.title || t("clientDashboard.property")}
                        </CardTitle>
                        <CardDescription className="line-clamp-1">
                          {appointment.property?.location}
                        </CardDescription>
                      </div>
                      <Badge className={STATUS_COLORS[appointment.status]}>
                        {STATUS_LABELS[appointment.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(appointment.date), dateFormat, { locale: dateLocale })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {appointment.type === "video" ? (
                        <>
                          <Video className="h-4 w-4" />
                          <span>{t("clientDashboard.videoCall")}</span>
                        </>
                      ) : (
                        <>
                          <Home className="h-4 w-4" />
                          <span>{t("clientDashboard.inPerson")}</span>
                        </>
                      )}
                    </div>
                    {appointment.concierge && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{t("clientDashboard.conciergeAssigned")}</span>
                      </div>
                    )}
                    {appointment.meetLink && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => window.open(appointment.meetLink!, "_blank")}
                        data-testid={`button-join-meet-${appointment.id}`}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        {t("clientDashboard.joinVideoCall")}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Favorite Properties */}
        {favorites.length > 0 && (
          <Card data-testid="card-favorite-properties">
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0">
              <div>
                <CardTitle>{t("clientDashboard.favoriteProperties")}</CardTitle>
                <CardDescription>{t("clientDashboard.savedProperties")}</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/favoritos")}
                data-testid="button-view-all-favorites"
              >
                {t("clientDashboard.viewAll")}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {favorites.slice(0, 6).map((property) => (
                  <Card 
                    key={property.id} 
                    className="hover-elevate cursor-pointer" 
                    onClick={() => setLocation(`/propiedad/${property.id}/completo`)}
                    data-testid={`card-favorite-${property.id}`}
                  >
                    <CardHeader className="space-y-0 pb-2">
                      <CardTitle className="text-base font-medium line-clamp-1">
                        {property.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{property.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{property.propertyType}</span>
                      </div>
                      {property.rentalPrice && (
                        <div className="text-lg font-bold text-primary">
                          ${property.rentalPrice.toLocaleString()} MXN/mes
                        </div>
                      )}
                      {property.salePrice && (
                        <div className="text-lg font-bold text-primary">
                          ${property.salePrice.toLocaleString()} MXN
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Opportunities */}
        {myLeads.length > 0 && (
          <Card data-testid="card-active-opportunities">
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0">
              <div>
                <CardTitle>{t("clientDashboard.activeOpportunitiesTitle")}</CardTitle>
                <CardDescription>{t("clientDashboard.requestsInProcess")}</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/mis-oportunidades")}
                data-testid="button-view-all-opportunities"
              >
                {t("clientDashboard.viewAll")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {myLeads.slice(0, 5).map((lead) => (
                <div 
                  key={lead.id} 
                  className="flex items-center justify-between p-3 rounded-md border hover-elevate cursor-pointer"
                  onClick={() => setLocation("/mis-oportunidades")}
                  data-testid={`item-opportunity-${lead.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">{lead.propertyTitle || t("clientDashboard.property")}</p>
                    <p className="text-sm text-muted-foreground">{lead.location}</p>
                  </div>
                  <Badge variant="secondary">
                    {lead.status === "new" && t("clientDashboard.leadNew")}
                    {lead.status === "contacted" && t("clientDashboard.leadContacted")}
                    {lead.status === "qualified" && t("clientDashboard.leadQualified")}
                    {lead.status === "proposal" && t("clientDashboard.leadProposal")}
                    {lead.status === "negotiation" && t("clientDashboard.leadNegotiation")}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Empty State - No Activity */}
        {upcomingAppointments.length === 0 && favorites.length === 0 && myLeads.length === 0 && (
          <Card data-testid="card-empty-state">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("clientDashboard.emptyStateTitle")}</h3>
              <p className="text-muted-foreground text-center mb-6">
                {t("clientDashboard.emptyStateDesc")}
              </p>
              <Button 
                onClick={() => setLocation("/buscar-propiedades")}
                data-testid="button-start-search"
              >
                <Search className="h-4 w-4 mr-2" />
                {t("clientDashboard.exploreProperties")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
