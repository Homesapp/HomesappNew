import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, FileEdit, CheckCircle2, AlertCircle, Clock, ArrowRight, Users } from "lucide-react";
import type { Property, PropertyChangeRequest, Appointment } from "@shared/schema";
import { WelcomeModal } from "@/components/WelcomeModal";
import { useAuth } from "@/hooks/useAuth";

type InterestedClient = {
  id: string;
  status: string;
  desiredMoveInDate: string | null;
  createdAt: string;
  notes: string | null;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyPrice: string;
  clientId: string;
  clientFirstName: string | null;
  clientLastName: string | null;
  presentationCardId: string | null;
  cardPropertyType: string | null;
  cardModality: string | null;
  cardMinPrice: string | null;
  cardMaxPrice: string | null;
};

export default function OwnerDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: properties = [], isLoading: loadingProperties } = useQuery<Property[]>({
    queryKey: ["/api/owner/properties"],
  });

  const { data: changeRequests = [], isLoading: loadingChangeRequests } = useQuery<PropertyChangeRequest[]>({
    queryKey: ["/api/owner/change-requests"],
  });

  const { data: appointments = [], isLoading: loadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: interestedClients = [], isLoading: loadingInterestedClients } = useQuery<InterestedClient[]>({
    queryKey: ["/api/owner/interested-clients"],
  });

  // Filter owner appointments
  const pendingAppointments = appointments.filter(a => a.ownerApprovalStatus === "pending");
  const upcomingAppointments = appointments
    .filter(a => a.ownerApprovalStatus === "approved" && new Date(a.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const pendingChangeRequests = changeRequests.filter(cr => cr.status === "pending");

  // Property stats
  const publishedProperties = properties.filter(p => p.approvalStatus === "published").length;
  const pendingProperties = properties.filter(p => p.approvalStatus === "pending_review").length;

  const isLoading = loadingProperties || loadingChangeRequests || loadingAppointments || loadingInterestedClients;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isAuthLoading && user && (
        <WelcomeModal 
          userRole="owner" 
          hasSeenWelcome={user.hasSeenWelcome || false}
          lastWelcomeShown={user.lastWelcomeShown}
        />
      )}
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-owner-dashboard">Dashboard Propietario</h1>
        <p className="text-muted-foreground">
          Resumen de tus propiedades y actividades
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <Card data-testid="card-total-properties">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p className="text-xs text-muted-foreground">
              {publishedProperties} publicadas
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-approvals">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              Requieren aprobación
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-change-requests">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cambios Pendientes</CardTitle>
            <FileEdit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingChangeRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              En revisión por admin
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-properties">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingProperties}</div>
            <p className="text-xs text-muted-foreground">
              Propiedades pendientes
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-interested-clients">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Interesados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interestedClients.length}</div>
            <p className="text-xs text-muted-foreground">
              Solicitudes de oportunidad
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Actions */}
      {(pendingAppointments.length > 0 || pendingChangeRequests.length > 0 || pendingProperties > 0) && (
        <Card data-testid="card-pending-actions">
          <CardHeader>
            <CardTitle>Acciones Pendientes</CardTitle>
            <CardDescription>
              Tareas que requieren tu atención
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAppointments.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Visitas pendientes de aprobación</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingAppointments.length} solicitud{pendingAppointments.length > 1 ? "es" : ""} esperando tu respuesta
                    </p>
                  </div>
                </div>
                <Link href="/owner/appointments">
                  <Button size="sm" data-testid="button-view-appointments">
                    Ver visitas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {pendingChangeRequests.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <FileEdit className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Solicitudes de cambio en revisión</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingChangeRequests.length} solicitud{pendingChangeRequests.length > 1 ? "es" : ""} pendiente{pendingChangeRequests.length > 1 ? "s" : ""} de aprobación admin
                    </p>
                  </div>
                </div>
                <Badge variant="default" data-testid="badge-change-requests">
                  {pendingChangeRequests.length}
                </Badge>
              </div>
            )}

            {pendingProperties > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Propiedades en revisión</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingProperties} propiedad{pendingProperties > 1 ? "es" : ""} esperando aprobación
                    </p>
                  </div>
                </div>
                <Link href="/mis-propiedades">
                  <Button size="sm" variant="outline" data-testid="button-view-properties">
                    Ver propiedades
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <Card data-testid="card-upcoming-appointments">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Próximas Visitas</CardTitle>
                <CardDescription>Visitas agendadas aprobadas</CardDescription>
              </div>
              <Link href="/owner/appointments">
                <Button variant="outline" size="sm" data-testid="button-view-all-appointments">
                  Ver todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                  data-testid={`appointment-${appointment.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{new Date(appointment.date).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        Propiedad ID: {appointment.propertyId}
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Aprobada
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interested Clients */}
      {interestedClients.length > 0 && (
        <Card data-testid="card-interested-clients-list">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Clientes Interesados</CardTitle>
                <CardDescription>
                  Clientes que han mostrado interés en tus propiedades (información básica)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interestedClients.slice(0, 5).map((client) => (
                <div
                  key={client.id}
                  className="flex flex-col gap-2 p-4 bg-muted rounded-md"
                  data-testid={`interested-client-${client.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          {client.clientFirstName} {client.clientLastName}
                        </p>
                        <Badge variant={
                          client.status === "pending" ? "secondary" :
                          client.status === "scheduled_visit" ? "default" :
                          client.status === "visit_completed" ? "default" :
                          "secondary"
                        }>
                          {client.status === "pending" && "Pendiente"}
                          {client.status === "scheduled_visit" && "Visita Agendada"}
                          {client.status === "visit_completed" && "Visita Completada"}
                          {client.status === "offer_submitted" && "Oferta Enviada"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Propiedad: {client.propertyTitle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Solicitud: {new Date(client.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {client.presentationCardId && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Perfil del Cliente:
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Tipo: {client.cardPropertyType}</span>
                        <span>Modalidad: {client.cardModality}</span>
                        {client.cardMinPrice && client.cardMaxPrice && (
                          <span>
                            Presupuesto: ${parseFloat(client.cardMinPrice).toLocaleString()} - ${parseFloat(client.cardMaxPrice).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {client.desiredMoveInDate && (
                    <p className="text-xs text-muted-foreground">
                      Fecha deseada de mudanza: {new Date(client.desiredMoveInDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
              
              {interestedClients.length > 5 && (
                <div className="text-center">
                  <Badge variant="secondary">
                    +{interestedClients.length - 5} más
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Acceso rápido a funciones principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/mis-propiedades">
              <Button className="w-full justify-start gap-2" variant="outline" data-testid="button-my-properties">
                <Building2 className="h-4 w-4" />
                Ver mis propiedades
              </Button>
            </Link>
            <Link href="/owner/appointments">
              <Button className="w-full justify-start gap-2" variant="outline" data-testid="button-appointments">
                <Calendar className="h-4 w-4" />
                Gestionar visitas
              </Button>
            </Link>
            <Link href="/buscar-propiedades">
              <Button className="w-full justify-start gap-2" variant="outline" data-testid="button-search">
                <Building2 className="h-4 w-4" />
                Buscar propiedades
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
