import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CalendarIcon, 
  Heart, 
  Home, 
  FileText,
  ChevronRight,
  Building2,
  Key,
  ClipboardList
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SearchHero } from "@/components/shared/SearchHero";
import { ApplicationCard, type ApplicationStatus } from "@/components/shared/ApplicationCard";
import { PortalSummaryCard, PortalSummaryGrid } from "@/components/shared/PortalSummaryCard";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Appointment, Property, Lead, RentalContract } from "@shared/schema";

type AppointmentWithRelations = Appointment & {
  property?: Property;
};

function mapLeadStatusToApplicationStatus(leadStatus: string): ApplicationStatus {
  const statusMap: Record<string, ApplicationStatus> = {
    new: "contact_received",
    contacted: "contact_received",
    qualified: "appointment_scheduled",
    showing_scheduled: "appointment_scheduled",
    showing_completed: "appointment_completed",
    application_sent: "documents_pending",
    documents_requested: "documents_pending",
    documents_received: "under_review",
    under_review: "under_review",
    approved: "approved",
    lease_signed: "contract_active",
    closed_won: "contract_active",
    closed_lost: "rejected",
  };
  return statusMap[leadStatus] || "contact_received";
}

function getNextSteps(status: ApplicationStatus): string {
  const stepsMap: Record<ApplicationStatus, string> = {
    contact_received: "Espera a que te contactemos para agendar una visita",
    appointment_scheduled: "Prepárate para tu visita a la propiedad",
    appointment_completed: "Envía tu solicitud y documentos",
    documents_pending: "Sube los documentos solicitados",
    under_review: "Tu aplicación está siendo evaluada",
    approved: "¡Felicidades! Procede con la firma del contrato",
    contract_active: "Accede a tu portal de inquilino",
    rejected: "Contacta a un asesor para más información",
  };
  return stepsMap[status];
}

export default function ClientHomeDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<AppointmentWithRelations[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<Property[]>({
    queryKey: ["/api/favorites"],
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: activeRentals = [], isLoading: activeRentalsLoading } = useQuery<RentalContract[]>({
    queryKey: ["/api/client/active-rentals"],
  });

  const isLoading = appointmentsLoading || favoritesLoading || leadsLoading || activeRentalsLoading;

  const myAppointments = appointments.filter(apt => apt.clientId === user?.id);
  const upcomingAppointments = myAppointments
    .filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= new Date() && (apt.status === "pending" || apt.status === "confirmed");
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const activeLeads = leads.filter(lead => 
    lead.clientId === user?.id && 
    lead.status !== "closed_lost" && 
    lead.status !== "closed_won"
  );

  const hasActiveContract = activeRentals.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-welcome-title">
          ¡Hola, {user?.firstName || "Cliente"}!
        </h1>
        <p className="text-muted-foreground">
          Encuentra tu próximo hogar en Tulum
        </p>
      </div>

      <SearchHero />

      {hasActiveContract && (
        <Card className="border-primary/20 bg-primary/5" data-testid="card-active-contract">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Key className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Tienes un contrato activo</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeRentals[0]?.propertyTitle || "Tu propiedad rentada"}
                  </p>
                </div>
              </div>
              <Button onClick={() => setLocation("/portal/tenant")} data-testid="button-go-tenant-portal">
                Ir al Portal
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeLeads.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Continúa tu proceso de renta</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/mis-solicitudes")}
              data-testid="button-view-all-applications"
            >
              Ver todas
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {activeLeads.slice(0, 3).map((lead) => (
              <ApplicationCard
                key={lead.id}
                id={lead.id}
                propertyId={lead.propertyId || ""}
                propertyTitle={lead.propertyTitle || "Propiedad"}
                propertyImage={lead.propertyImage}
                propertyLocation={lead.propertyLocation}
                status={mapLeadStatusToApplicationStatus(lead.status)}
                nextSteps={getNextSteps(mapLeadStatusToApplicationStatus(lead.status))}
                onViewDetails={() => setLocation(`/mis-solicitudes?lead=${lead.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      <PortalSummaryGrid columns={3}>
        <PortalSummaryCard
          title="Citas Próximas"
          icon={CalendarIcon}
          value={upcomingAppointments.length}
          subtitle={upcomingAppointments.length > 0 
            ? `Próxima: ${format(new Date(upcomingAppointments[0].date), "dd MMM", { locale: es })}` 
            : "Sin citas programadas"}
          loading={isLoading}
          action={{
            label: "Ver calendario",
            onClick: () => setLocation("/citas"),
          }}
        />
        <PortalSummaryCard
          title="Favoritos"
          icon={Heart}
          value={favorites.length}
          subtitle="Propiedades guardadas"
          loading={isLoading}
          action={{
            label: "Ver favoritos",
            onClick: () => setLocation("/favoritos"),
          }}
        />
        <PortalSummaryCard
          title="Mis Solicitudes"
          icon={ClipboardList}
          value={activeLeads.length}
          subtitle="Procesos activos"
          loading={isLoading}
          variant={activeLeads.length > 0 ? "default" : "default"}
          action={{
            label: "Ver solicitudes",
            onClick: () => setLocation("/mis-solicitudes"),
          }}
        />
      </PortalSummaryGrid>

      {upcomingAppointments.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Próximas visitas</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/citas")}
              data-testid="button-view-all-appointments"
            >
              Ver todas
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingAppointments.map((apt) => (
              <Card key={apt.id} className="hover-elevate cursor-pointer" onClick={() => setLocation("/citas")} data-testid={`card-appointment-${apt.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {apt.property?.title || "Visita a propiedad"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apt.date), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                      </p>
                      <Badge 
                        className="mt-1 text-[10px]"
                        variant={apt.status === "confirmed" ? "default" : "secondary"}
                      >
                        {apt.status === "confirmed" ? "Confirmada" : "Pendiente"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {favorites.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Tus favoritos</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/favoritos")}
              data-testid="button-view-all-favorites"
            >
              Ver todos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.slice(0, 4).map((property: any) => (
              <Card 
                key={property.id} 
                className="overflow-hidden hover-elevate cursor-pointer"
                onClick={() => setLocation(`/propiedad/${property.id}/completo`)}
                data-testid={`card-favorite-${property.id}`}
              >
                <div className="aspect-video bg-muted relative">
                  {property.images?.[0] ? (
                    <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm line-clamp-1">{property.title}</p>
                  <p className="text-xs text-muted-foreground">{property.location}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {!isLoading && activeLeads.length === 0 && upcomingAppointments.length === 0 && favorites.length === 0 && !hasActiveContract && (
        <Card className="text-center p-8" data-testid="card-empty-state">
          <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Comienza tu búsqueda</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Explora propiedades en renta y venta en Tulum
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setLocation("/propiedades")} data-testid="button-browse-properties">
              Ver propiedades
            </Button>
            <Button variant="outline" onClick={() => setLocation("/mapa-interactivo")} data-testid="button-open-map-empty">
              Abrir mapa
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
