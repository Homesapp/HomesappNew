import { useState, useMemo } from "react";
import { AppointmentCard } from "@/components/AppointmentCard";
import { AppointmentFormDialog } from "@/components/AppointmentFormDialog";
import { ConciergeReportDialog } from "@/components/ConciergeReportDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAppointments, useUpdateAppointment, useUpdateAppointmentReport } from "@/hooks/useAppointments";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { Plus } from "lucide-react";
import { format } from "date-fns";

export default function Appointments() {
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();
  
  // For cliente role, filter appointments by clientId
  const baseFilters = activeTab === "all" || activeTab === "needs-report" ? {} : { status: activeTab };
  const filters = user?.role === "cliente" 
    ? { ...baseFilters, clientId: user.id }
    : baseFilters;
  const { data: appointments, isLoading, error } = useAppointments(filters);
  const { data: properties } = useProperties();
  const updateAppointment = useUpdateAppointment();
  const updateAppointmentReport = useUpdateAppointmentReport();

  const appointmentsWithDetails = useMemo(() => {
    if (!appointments || !properties) return [];
    
    return appointments.map(appointment => {
      const property = properties.find(p => p.id === appointment.propertyId);
      
      // Build property title with condominium and unit info
      let propertyTitle = property?.title || "Propiedad";
      if (property?.condoName && property?.unitNumber) {
        propertyTitle = `${property.condoName} - Unidad ${property.unitNumber}`;
      } else if (property?.condoName) {
        propertyTitle = property.condoName;
      } else if (property?.unitNumber) {
        propertyTitle = `${property.title} - Unidad ${property.unitNumber}`;
      }
      
      return {
        id: appointment.id,
        propertyTitle,
        clientName: "Cliente",
        date: format(new Date(appointment.date), "dd MMM yyyy"),
        time: format(new Date(appointment.date), "h:mm a"),
        type: appointment.type,
        status: appointment.status,
        meetLink: appointment.meetLink || undefined,
        conciergeReport: appointment.conciergeReport,
        accessIssues: appointment.accessIssues,
        conciergeId: appointment.conciergeId,
        userRole: user?.role,
        userId: user?.id,
      };
    });
  }, [appointments, properties, user]);

  const handleConfirm = async (id: string) => {
    try {
      await updateAppointment.mutateAsync({
        id,
        data: { status: "confirmed" },
      });
      toast({
        title: "Cita confirmada",
        description: "La cita ha sido confirmada exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo confirmar la cita",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await updateAppointment.mutateAsync({
        id,
        data: { status: "cancelled" },
      });
      toast({
        title: "Cita cancelada",
        description: "La cita ha sido cancelada",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la cita",
        variant: "destructive",
      });
    }
  };

  const handleReportResult = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setReportDialogOpen(true);
  };

  const handleSubmitReport = async (data: { conciergeReport: string; accessIssues?: string }) => {
    await updateAppointmentReport.mutateAsync({
      id: selectedAppointmentId,
      conciergeReport: data.conciergeReport,
      accessIssues: data.accessIssues,
    });
  };

  const allAppointments = appointments || [];
  const pendingCount = allAppointments.filter(a => a.status === "pending").length;
  const confirmedCount = allAppointments.filter(a => a.status === "confirmed").length;
  const completedCount = allAppointments.filter(a => a.status === "completed").length;
  const needsReportCount = allAppointments.filter(
    a => a.status === "completed" && !a.conciergeReport && a.conciergeId === user?.id
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Citas</h1>
          <p className="text-muted-foreground">Gestiona todas tus citas y visitas</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-new-appointment">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {error && (
        <div className="text-center py-8 text-destructive" data-testid="error-message">
          Error al cargar las citas. Por favor, intenta de nuevo.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-appointments">
            Todas ({allAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="confirmed" data-testid="tab-confirmed">
            Confirmadas ({confirmedCount})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completadas ({completedCount})
          </TabsTrigger>
          {user?.role === "concierge" && needsReportCount > 0 && (
            <TabsTrigger value="needs-report" data-testid="tab-needs-report">
              Necesitan Reporte ({needsReportCount})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full" />
                </div>
              ))}
            </div>
          ) : (() => {
            const filteredAppointments = activeTab === "needs-report" 
              ? appointmentsWithDetails.filter(a => 
                  a.status === "completed" && !a.conciergeReport && a.conciergeId === user?.id
                )
              : appointmentsWithDetails;

            return filteredAppointments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    {...appointment}
                    onConfirm={() => handleConfirm(appointment.id)}
                    onCancel={() => handleCancel(appointment.id)}
                    onReportResult={() => handleReportResult(appointment.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground" data-testid="no-appointments">
                No hay citas {activeTab !== "all" ? activeTab : ""} en este momento
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode="create"
      />

      <ConciergeReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        appointmentId={selectedAppointmentId}
        onSubmit={handleSubmitReport}
      />
    </div>
  );
}
