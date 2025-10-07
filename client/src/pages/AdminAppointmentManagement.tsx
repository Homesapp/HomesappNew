import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User, MapPin, X, Edit, Pause, Play, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Appointment = {
  id: string;
  propertyId: string;
  clientId: string;
  conciergeId: string | null;
  date: string;
  type: string;
  mode: string;
  status: string;
  ownerApprovalStatus: string;
  notes: string | null;
  conciergeReport: string | null;
  createdAt: string;
  property?: {
    id: string;
    title: string;
    location: string;
  };
  client?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profileImageUrl: string | null;
  };
  concierge?: {
    id: string;
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

const typeLabels: Record<string, string> = {
  "in-person": "Presencial",
  video: "Virtual",
};

const modeLabels: Record<string, string> = {
  individual: "Individual (1 hora)",
  tour: "Tour (30 min)",
};

export default function AdminAppointmentManagement() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionType, setActionType] = useState<"edit" | "cancel" | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const { toast } = useToast();

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/admin/appointments/all"],
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/appointments/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/appointments/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Cita actualizada",
        description: "Los cambios se han guardado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la cita",
        variant: "destructive",
      });
    },
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/appointments/${id}/cancel`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/appointments/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Cita cancelada",
        description: "La cita ha sido cancelada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la cita",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (appointment: Appointment, action: "edit" | "cancel") => {
    setSelectedAppointment(appointment);
    setActionType(action);
    setEditNotes(appointment.notes || "");
    setNewStatus(appointment.status);
  };

  const handleCloseDialog = () => {
    setSelectedAppointment(null);
    setActionType(null);
    setEditNotes("");
    setNewStatus("");
  };

  const handleConfirmEdit = async () => {
    if (!selectedAppointment) return;

    await updateAppointmentMutation.mutateAsync({
      id: selectedAppointment.id,
      data: {
        status: newStatus,
        notes: editNotes,
      },
    });
    handleCloseDialog();
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment) return;

    await cancelAppointmentMutation.mutateAsync(selectedAppointment.id);
    handleCloseDialog();
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab !== "all" && apt.status !== activeTab) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const clientName = `${apt.client?.firstName || ""} ${apt.client?.lastName || ""}`.toLowerCase();
      const propertyTitle = apt.property?.title.toLowerCase() || "";
      const location = apt.property?.location.toLowerCase() || "";
      
      return clientName.includes(query) || 
             propertyTitle.includes(query) || 
             location.includes(query);
    }
    
    return true;
  });

  const getClientName = (apt: Appointment) => {
    if (apt.client?.firstName && apt.client?.lastName) {
      return `${apt.client.firstName} ${apt.client.lastName}`;
    }
    return apt.client?.email || "Cliente desconocido";
  };

  const getConciergeName = (apt: Appointment) => {
    if (!apt.concierge) return "Sin asignar";
    if (apt.concierge?.firstName && apt.concierge?.lastName) {
      return `${apt.concierge.firstName} ${apt.concierge.lastName}`;
    }
    return apt.concierge?.email || "Conserje";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-admin-appointments">
          Gestión de Citas
        </h1>
        <p className="text-muted-foreground">
          Supervisa, modifica y gestiona todas las citas del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, propiedad o ubicación..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-appointments"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" data-testid="tab-all">
            Todas ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes ({appointments.filter((a) => a.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" data-testid="tab-confirmed">
            Confirmadas ({appointments.filter((a) => a.status === "confirmed").length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completadas ({appointments.filter((a) => a.status === "completed").length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" data-testid="tab-cancelled">
            Canceladas ({appointments.filter((a) => a.status === "cancelled").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery ? "No se encontraron citas que coincidan con la búsqueda" : "No hay citas en este estado"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((apt) => (
              <Card key={apt.id} data-testid={`card-appointment-${apt.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {apt.property?.title || "Propiedad"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {apt.property?.location || "Ubicación"}
                      </CardDescription>
                    </div>
                    <Badge variant={statusColors[apt.status]} data-testid={`badge-status-${apt.id}`}>
                      {statusLabels[apt.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={apt.client?.profileImageUrl || undefined} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Cliente</p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-client-${apt.id}`}>
                          {getClientName(apt)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Conserje</p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-concierge-${apt.id}`}>
                        {getConciergeName(apt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Fecha y Hora</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {format(new Date(apt.date), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Tipo y Modo</p>
                      <p className="text-sm text-muted-foreground">
                        {typeLabels[apt.type]} • {modeLabels[apt.mode]}
                      </p>
                    </div>
                  </div>

                  {apt.notes && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm font-medium mb-1">Notas</p>
                      <p className="text-sm text-muted-foreground">{apt.notes}</p>
                    </div>
                  )}

                  {apt.conciergeReport && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm font-medium mb-1">Reporte del Conserje</p>
                      <p className="text-sm text-muted-foreground">{apt.conciergeReport}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(apt, "edit")}
                      data-testid={`button-edit-${apt.id}`}
                      disabled={apt.status === "cancelled"}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modificar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(apt, "cancel")}
                      data-testid={`button-cancel-${apt.id}`}
                      disabled={apt.status === "cancelled" || apt.status === "completed"}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={actionType === "edit"} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent data-testid="dialog-edit-appointment">
          <DialogHeader>
            <DialogTitle>Modificar Cita</DialogTitle>
            <DialogDescription>
              Actualiza el estado y las notas de la cita
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado de la Cita</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas Administrativas</Label>
              <Textarea
                id="notes"
                placeholder="Agregar notas sobre esta cita..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                data-testid="textarea-notes"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel-edit">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmEdit}
              disabled={updateAppointmentMutation.isPending}
              data-testid="button-confirm-edit"
            >
              {updateAppointmentMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={actionType === "cancel"} onOpenChange={(open) => !open && handleCloseDialog()}>
        <AlertDialogContent data-testid="dialog-cancel-appointment">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar Cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la cita con {selectedAppointment ? getClientName(selectedAppointment) : ""}.
              Los usuarios involucrados serán notificados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-action">
              No, mantener cita
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={cancelAppointmentMutation.isPending}
              data-testid="button-confirm-cancel"
            >
              {cancelAppointmentMutation.isPending ? "Cancelando..." : "Sí, cancelar cita"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
