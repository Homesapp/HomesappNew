import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ClipboardList, 
  ChevronRight, 
  Building2, 
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Home,
  MapPin,
  Phone,
  Mail,
  Key
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PipelineStepper, type PipelineStep } from "@/components/shared/PipelineStepper";
import { ApplicationCard, type ApplicationStatus } from "@/components/shared/ApplicationCard";
import type { Lead, Appointment, RentalContract } from "@shared/schema";

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

function getStatusPriority(status: ApplicationStatus): number {
  const priorities: Record<ApplicationStatus, number> = {
    documents_pending: 1,
    appointment_scheduled: 2,
    approved: 3,
    under_review: 4,
    appointment_completed: 5,
    contact_received: 6,
    contract_active: 7,
    rejected: 8,
  };
  return priorities[status] || 10;
}

interface ApplicationDetailProps {
  lead: Lead;
  appointments: Appointment[];
  contracts: RentalContract[];
  onClose: () => void;
}

function ApplicationDetail({ lead, appointments, contracts, onClose }: ApplicationDetailProps) {
  const [, setLocation] = useLocation();
  const status = mapLeadStatusToApplicationStatus(lead.status);
  
  const relatedAppointments = appointments.filter(apt => 
    apt.propertyId === lead.propertyId && apt.clientId === lead.clientId
  );
  
  const relatedContract = contracts.find(c => 
    c.propertyId === lead.propertyId && c.tenantId === lead.clientId
  );

  const pipelineSteps: PipelineStep[] = [
    { 
      id: "contact", 
      label: "Contacto inicial", 
      status: status === "contact_received" ? "current" : "completed",
      date: lead.createdAt ? format(new Date(lead.createdAt), "d MMM yyyy", { locale: es }) : undefined,
    },
    { 
      id: "appointment", 
      label: "Visita programada", 
      status: ["appointment_scheduled", "appointment_completed"].includes(status) ? "current" : 
              getStatusPriority(status) > getStatusPriority("appointment_scheduled") ? "pending" : "completed",
      date: relatedAppointments[0]?.date 
        ? format(new Date(relatedAppointments[0].date), "d MMM yyyy HH:mm", { locale: es }) 
        : undefined,
    },
    { 
      id: "documents", 
      label: "Documentos", 
      status: status === "documents_pending" ? "current" : 
              status === "under_review" || status === "approved" || status === "contract_active" ? "completed" : "pending",
    },
    { 
      id: "review", 
      label: "En revisión", 
      status: status === "under_review" ? "current" : 
              status === "approved" || status === "contract_active" ? "completed" : "pending",
    },
    { 
      id: "approved", 
      label: "Aprobado", 
      status: status === "approved" ? "current" : 
              status === "contract_active" ? "completed" : "pending",
    },
    { 
      id: "contract", 
      label: "Contrato activo", 
      status: status === "contract_active" ? "current" : "pending",
    },
  ];

  return (
    <Card className="mb-6" data-testid="application-detail">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Detalle de solicitud</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {lead.propertyTitle || "Propiedad"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-muted/50">
          <h4 className="text-sm font-medium mb-4">Progreso de tu solicitud</h4>
          <PipelineStepper steps={pipelineSteps} orientation="vertical" />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Próximos pasos</h4>
          <div className="p-3 rounded-lg border bg-primary/5 border-primary/20">
            <p className="text-sm">{getNextSteps(status)}</p>
          </div>
        </div>

        {relatedAppointments.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Citas programadas</h4>
            {relatedAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {format(new Date(apt.date), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                  </p>
                  <Badge 
                    className="mt-1 text-[10px]"
                    variant={apt.status === "confirmed" ? "default" : "secondary"}
                  >
                    {apt.status === "confirmed" ? "Confirmada" : apt.status === "completed" ? "Completada" : "Pendiente"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {relatedContract && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Contrato</h4>
            <div className="p-4 rounded-lg border bg-green-500/5 border-green-500/20">
              <div className="flex items-center gap-3">
                <Key className="h-6 w-6 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium">Contrato activo</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(relatedContract.startDate), "d MMM yyyy", { locale: es })} - 
                    {format(new Date(relatedContract.endDate), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
                <Button size="sm" onClick={() => setLocation("/portal/tenant")}>
                  Ir al Portal
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {lead.propertyId && (
            <Button 
              variant="outline" 
              onClick={() => setLocation(`/propiedad/${lead.propertyId}/completo`)}
              data-testid="button-view-property-detail"
            >
              Ver propiedad
            </Button>
          )}
          {status === "contract_active" && (
            <Button onClick={() => setLocation("/portal/tenant")} data-testid="button-go-portal-detail">
              Ir al Portal
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyApplications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: activeRentals = [], isLoading: rentalsLoading } = useQuery<RentalContract[]>({
    queryKey: ["/api/client/active-rentals"],
  });

  const isLoading = leadsLoading || appointmentsLoading || rentalsLoading;

  const myLeads = leads.filter(lead => lead.clientId === user?.id);
  
  const activeLeads = myLeads.filter(lead => 
    lead.status !== "closed_lost" && lead.status !== "closed_won"
  );
  
  const completedLeads = myLeads.filter(lead => 
    lead.status === "closed_won" || lead.status === "lease_signed"
  );
  
  const rejectedLeads = myLeads.filter(lead => lead.status === "closed_lost");

  const sortedActiveLeads = [...activeLeads].sort((a, b) => {
    const statusA = mapLeadStatusToApplicationStatus(a.status);
    const statusB = mapLeadStatusToApplicationStatus(b.status);
    return getStatusPriority(statusA) - getStatusPriority(statusB);
  });

  const selectedLeadData = selectedLead ? myLeads.find(l => l.id === selectedLead) : null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-my-applications-title">
          Mis Solicitudes
        </h1>
        <p className="text-muted-foreground">
          Sigue el progreso de tus aplicaciones de renta
        </p>
      </div>

      {selectedLeadData && (
        <ApplicationDetail 
          lead={selectedLeadData}
          appointments={appointments}
          contracts={activeRentals}
          onClose={() => setSelectedLead(null)}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" data-testid="tab-all">
            Activas ({activeLeads.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completadas ({completedLeads.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rechazadas ({rejectedLeads.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {sortedActiveLeads.length === 0 ? (
            <Card className="text-center p-8" data-testid="empty-active-applications">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No tienes solicitudes activas</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Explora propiedades y aplica para comenzar tu proceso de renta
              </p>
              <Button onClick={() => setLocation("/propiedades")} data-testid="button-browse-empty">
                Ver propiedades
              </Button>
            </Card>
          ) : (
            sortedActiveLeads.map((lead) => (
              <ApplicationCard
                key={lead.id}
                id={lead.id}
                propertyId={lead.propertyId || ""}
                propertyTitle={lead.propertyTitle || "Propiedad"}
                propertyImage={lead.propertyImage}
                propertyLocation={lead.propertyLocation}
                status={mapLeadStatusToApplicationStatus(lead.status)}
                nextSteps={getNextSteps(mapLeadStatusToApplicationStatus(lead.status))}
                hasActiveContract={lead.status === "lease_signed" || lead.status === "closed_won"}
                onViewDetails={() => setSelectedLead(lead.id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-4">
          {completedLeads.length === 0 ? (
            <Card className="text-center p-8" data-testid="empty-completed-applications">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No tienes solicitudes completadas</h3>
              <p className="text-muted-foreground text-sm">
                Aquí aparecerán tus solicitudes que resultaron en un contrato
              </p>
            </Card>
          ) : (
            completedLeads.map((lead) => (
              <ApplicationCard
                key={lead.id}
                id={lead.id}
                propertyId={lead.propertyId || ""}
                propertyTitle={lead.propertyTitle || "Propiedad"}
                propertyImage={lead.propertyImage}
                propertyLocation={lead.propertyLocation}
                status="contract_active"
                hasActiveContract={true}
                onViewDetails={() => setSelectedLead(lead.id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-3 mt-4">
          {rejectedLeads.length === 0 ? (
            <Card className="text-center p-8" data-testid="empty-rejected-applications">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No tienes solicitudes rechazadas</h3>
              <p className="text-muted-foreground text-sm">
                Las solicitudes que no fueron aprobadas aparecerán aquí
              </p>
            </Card>
          ) : (
            rejectedLeads.map((lead) => (
              <ApplicationCard
                key={lead.id}
                id={lead.id}
                propertyId={lead.propertyId || ""}
                propertyTitle={lead.propertyTitle || "Propiedad"}
                propertyImage={lead.propertyImage}
                propertyLocation={lead.propertyLocation}
                status="rejected"
                onViewDetails={() => setSelectedLead(lead.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
