import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, Plus, CheckCircle, X, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Lead, Property } from "@shared/schema";
import { getPropertyTitle } from "@/lib/propertyHelpers";

type Appointment = {
  id: string;
  propertyId: string;
  clientId: string;
  date: string;
  type: string;
  status: string;
  notes: string | null;
  property?: {
    title: string;
    location: string;
  };
  client?: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  completed: "default",
  cancelled: "destructive",
};

export default function SellerAppointmentManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentType, setAppointmentType] = useState<"in-person" | "video">("in-person");
  const [notes, setNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [propertyInputMode, setPropertyInputMode] = useState<"registered" | "manual">("registered");
  const [manualCondominium, setManualCondominium] = useState("");
  const [manualUnit, setManualUnit] = useState("");

  // Fetch user's leads
  const { data: leads = [], isLoading: loadingLeads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  // Fetch published properties
  const { data: properties = [], isLoading: loadingProperties } = useQuery<Property[]>({
    queryKey: ["/api/properties/search"],
  });

  const publishedProperties = properties.filter(p => p.published);

  // Fetch appointments
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: {
      leadId: string;
      propertyId?: string;
      condominiumName?: string;
      unitNumber?: string;
      date: string;
      type: string;
      notes?: string;
    }) => {
      return await apiRequest("POST", "/api/seller/appointments/create-with-lead", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Cita creada",
        description: "La cita ha sido creada y confirmada automáticamente",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la cita",
        variant: "destructive",
      });
    },
  });

  // Approve appointment mutation
  const approveAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      return await apiRequest("POST", `/api/seller/appointments/${appointmentId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Cita aprobada",
        description: "La cita ha sido aprobada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar la cita",
        variant: "destructive",
      });
    },
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      return await apiRequest("POST", `/api/seller/appointments/${id}/cancel`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Cita cancelada",
        description: "La cita ha sido cancelada",
      });
      setIsCancelDialogOpen(false);
      setSelectedAppointment(null);
      setCancelReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la cita",
        variant: "destructive",
      });
    },
  });

  // Reschedule appointment mutation
  const rescheduleAppointmentMutation = useMutation({
    mutationFn: async ({ id, newDate }: { id: string; newDate: string }) => {
      return await apiRequest("PATCH", `/api/seller/appointments/${id}/reschedule`, { newDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Cita reprogramada",
        description: "La cita ha sido reprogramada",
      });
      setIsRescheduleDialogOpen(false);
      setSelectedAppointment(null);
      setRescheduleDate("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo reprogramar la cita",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedLeadId("");
    setSelectedPropertyId("");
    setAppointmentDate("");
    setAppointmentType("in-person");
    setNotes("");
    setPropertyInputMode("registered");
    setManualCondominium("");
    setManualUnit("");
  };

  const handleCreateAppointment = () => {
    // Validar campos básicos
    if (!selectedLeadId || !appointmentDate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    // Validar según el modo de entrada
    if (propertyInputMode === "registered" && !selectedPropertyId) {
      toast({
        title: "Error",
        description: "Por favor selecciona una propiedad",
        variant: "destructive",
      });
      return;
    }

    if (propertyInputMode === "manual" && (!manualCondominium || !manualUnit)) {
      toast({
        title: "Error",
        description: "Por favor completa el nombre del condominio y número de unidad",
        variant: "destructive",
      });
      return;
    }

    const appointmentData: any = {
      leadId: selectedLeadId,
      date: appointmentDate,
      type: appointmentType,
      notes,
    };

    if (propertyInputMode === "registered") {
      appointmentData.propertyId = selectedPropertyId;
    } else {
      appointmentData.condominiumName = manualCondominium;
      appointmentData.unitNumber = manualUnit;
    }

    console.log("📤 SENDING APPOINTMENT DATA:", appointmentData);
    createAppointmentMutation.mutate(appointmentData);
  };

  const handleApprove = (appointment: Appointment) => {
    approveAppointmentMutation.mutate(appointment.id);
  };

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (selectedAppointment) {
      cancelAppointmentMutation.mutate({
        id: selectedAppointment.id,
        reason: cancelReason,
      });
    }
  };

  const handleRescheduleClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsRescheduleDialogOpen(true);
  };

  const handleConfirmReschedule = () => {
    if (selectedAppointment && rescheduleDate) {
      rescheduleAppointmentMutation.mutate({
        id: selectedAppointment.id,
        newDate: rescheduleDate,
      });
    }
  };

  const isLoading = loadingLeads || loadingProperties || loadingAppointments;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-seller-appointments">
            Gestión de Citas
          </h1>
          <p className="text-muted-foreground">
            Crea y gestiona citas con tus leads
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid="button-create-appointment"
          disabled={leads.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {leads.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              No tienes leads creados. Crea al menos un lead antes de agendar citas.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" data-testid="tab-all-appointments">
            Todas
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending-appointments">
            Pendientes
          </TabsTrigger>
          <TabsTrigger value="confirmed" data-testid="tab-confirmed-appointments">
            Confirmadas
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed-appointments">
            Completadas
          </TabsTrigger>
        </TabsList>

        {["all", "pending", "confirmed", "completed"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {appointments
              .filter((apt) => status === "all" || apt.status === status)
              .map((appointment) => (
                <Card key={appointment.id} data-testid={`card-appointment-${appointment.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate">
                          {appointment.property?.title || "Propiedad"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground truncate">
                          {appointment.client?.firstName} {appointment.client?.lastName}
                        </p>
                      </div>
                      <Badge variant={statusColors[appointment.status]}>
                        {statusLabels[appointment.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(appointment.date), "PPP 'a las' p", { locale: es })}
                      </span>
                    </div>

                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {appointment.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(appointment)}
                          disabled={approveAppointmentMutation.isPending}
                          data-testid={`button-approve-${appointment.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprobar
                        </Button>
                      )}

                      {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRescheduleClick(appointment)}
                            data-testid={`button-reschedule-${appointment.id}`}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Reprogramar
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelClick(appointment)}
                            data-testid={`button-cancel-${appointment.id}`}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

            {appointments.filter((apt) => status === "all" || apt.status === status).length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    No hay citas {status !== "all" ? statusLabels[status].toLowerCase() : ""}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Appointment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-appointment">
          <DialogHeader>
            <DialogTitle>Nueva Cita con Lead</DialogTitle>
            <DialogDescription>
              Crea una cita con uno de tus leads
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lead">Lead *</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger id="lead" data-testid="select-lead">
                  <SelectValue placeholder="Selecciona un lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.firstName} {lead.lastName} ({lead.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Método de Selección de Propiedad *</Label>
              <RadioGroup 
                value={propertyInputMode} 
                onValueChange={(value: "registered" | "manual") => setPropertyInputMode(value)}
                className="flex gap-4"
                data-testid="radio-property-mode"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="registered" id="registered" data-testid="radio-property-registered" />
                  <Label htmlFor="registered" className="cursor-pointer font-normal">Propiedad Registrada</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" data-testid="radio-property-manual" />
                  <Label htmlFor="manual" className="cursor-pointer font-normal">Entrada Manual</Label>
                </div>
              </RadioGroup>
            </div>

            {propertyInputMode === "registered" ? (
              <div className="space-y-2">
                <Label htmlFor="property">Propiedad *</Label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger id="property" data-testid="select-property">
                    <SelectValue placeholder="Selecciona una propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {publishedProperties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {getPropertyTitle(property)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="manual-condominium">Nombre del Condominio *</Label>
                  <Input
                    id="manual-condominium"
                    value={manualCondominium}
                    onChange={(e) => setManualCondominium(e.target.value)}
                    placeholder="Ej: Aldea Zama, Lúum Zama, etc."
                    data-testid="input-manual-condominium"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-unit">Número de Unidad *</Label>
                  <Input
                    id="manual-unit"
                    value={manualUnit}
                    onChange={(e) => setManualUnit(e.target.value)}
                    placeholder="Ej: 101, A-205, Casa 5, etc."
                    data-testid="input-manual-unit"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">Fecha y Hora *</Label>
              <Input
                id="date"
                type="datetime-local"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                data-testid="input-appointment-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select value={appointmentType} onValueChange={(v: any) => setAppointmentType(v)}>
                <SelectTrigger id="type" data-testid="select-appointment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">Presencial</SelectItem>
                  <SelectItem value="video">Videollamada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añade notas sobre la cita..."
                data-testid="textarea-appointment-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
              data-testid="button-cancel-create"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAppointment}
              disabled={createAppointmentMutation.isPending}
              data-testid="button-confirm-create"
            >
              {createAppointmentMutation.isPending ? "Creando..." : "Crear Cita"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent data-testid="dialog-reschedule-appointment">
          <DialogHeader>
            <DialogTitle>Reprogramar Cita</DialogTitle>
            <DialogDescription>
              Selecciona la nueva fecha y hora para la cita
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">Nueva Fecha y Hora</Label>
              <Input
                id="reschedule-date"
                type="datetime-local"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                data-testid="input-reschedule-date"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRescheduleDialogOpen(false);
                setRescheduleDate("");
              }}
              data-testid="button-cancel-reschedule"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmReschedule}
              disabled={!rescheduleDate || rescheduleAppointmentMutation.isPending}
              data-testid="button-confirm-reschedule"
            >
              {rescheduleAppointmentMutation.isPending ? "Reprogramando..." : "Reprogramar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent data-testid="dialog-cancel-appointment">
          <DialogHeader>
            <DialogTitle>Cancelar Cita</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar esta cita?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Motivo (Opcional)</Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Explica por qué se cancela la cita..."
                data-testid="textarea-cancel-reason"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelDialogOpen(false);
                setCancelReason("");
              }}
              data-testid="button-cancel-dialog"
            >
              No Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelAppointmentMutation.isPending}
              data-testid="button-confirm-cancel"
            >
              {cancelAppointmentMutation.isPending ? "Cancelando..." : "Sí, Cancelar Cita"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
