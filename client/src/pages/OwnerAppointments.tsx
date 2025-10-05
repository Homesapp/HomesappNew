import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Clock, Calendar as CalendarIcon, MapPin, User, Settings } from "lucide-react";
import type { Appointment, Property, OwnerSettings } from "@shared/schema";

type OwnerApprovalStatus = "pending" | "approved" | "rejected";

interface AppointmentWithDetails extends Appointment {
  property?: Property;
  client?: { email: string; firstName?: string; lastName?: string };
}

export default function OwnerAppointments() {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<OwnerApprovalStatus | "all">("pending");
  const { toast } = useToast();

  const { data: allAppointments = [], isLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: ownerSettings, isLoading: isLoadingSettings } = useQuery<OwnerSettings>({
    queryKey: ["/api/owner/settings"],
  });

  // Filter by ownerApprovalStatus
  const filteredAppointments = statusFilter === "all"
    ? allAppointments
    : allAppointments.filter(apt => apt.ownerApprovalStatus === statusFilter);

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return apiRequest("PATCH", `/api/owner/appointments/${id}/approve`, { notes });
    },
    onSuccess: () => {
      toast({
        title: "Visita aprobada",
        description: "La visita ha sido aprobada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/appointments/pending"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar la visita",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return apiRequest("PATCH", `/api/owner/appointments/${id}/reject`, { notes });
    },
    onSuccess: () => {
      toast({
        title: "Visita rechazada",
        description: "La visita ha sido rechazada",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/appointments/pending"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar la visita",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { autoApproveAppointments: boolean }) => {
      return apiRequest("POST", "/api/owner/settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Configuración actualizada",
        description: "Tus preferencias han sido guardadas exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    },
  });

  const handleToggleAutoApprove = (enabled: boolean) => {
    updateSettingsMutation.mutate({ autoApproveAppointments: enabled });
  };

  const handleOpenReview = (appointment: AppointmentWithDetails, action: "approve" | "reject") => {
    setSelectedAppointment(appointment);
    setReviewAction(action);
    setReviewNotes(appointment.notes || "");
  };

  const handleCloseDialog = () => {
    setSelectedAppointment(null);
    setReviewAction(null);
    setReviewNotes("");
  };

  const handleSubmitReview = () => {
    if (!selectedAppointment) return;

    if (reviewAction === "approve") {
      approveMutation.mutate({ id: selectedAppointment.id, notes: reviewNotes });
    } else if (reviewAction === "reject") {
      rejectMutation.mutate({ id: selectedAppointment.id, notes: reviewNotes });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "default", icon: Clock, label: "Pendiente" },
      approved: { variant: "default", icon: CheckCircle2, label: "Aprobada" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rechazada" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1" data-testid={`badge-status-${status}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatAppointmentType = (type: string): string => {
    const types: Record<string, string> = {
      viewing: "Visita presencial",
      virtual: "Visita virtual",
      inspection: "Inspección",
      meeting: "Reunión",
    };
    return types[type] || type;
  };

  const getClientName = (client?: { firstName?: string; lastName?: string; email: string }): string => {
    if (client?.firstName && client?.lastName) {
      return `${client.firstName} ${client.lastName}`;
    }
    return client?.email || "Cliente desconocido";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando visitas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-owner-appointments">Gestión de Visitas</h1>
        <p className="text-muted-foreground">
          Administra las solicitudes de visita a tus propiedades
        </p>
      </div>

      <Card data-testid="card-settings">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <CardTitle>Configuración de Visitas</CardTitle>
          </div>
          <CardDescription>
            Configura cómo se gestionan las solicitudes de visita a tus propiedades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="auto-approve" className="text-base font-medium">
                Aprobación automática de visitas
              </Label>
              <p className="text-sm text-muted-foreground">
                Las solicitudes de visita serán aprobadas automáticamente sin requerir tu intervención
              </p>
            </div>
            <Switch
              id="auto-approve"
              checked={ownerSettings?.autoApproveAppointments ?? false}
              onCheckedChange={handleToggleAutoApprove}
              disabled={isLoadingSettings || updateSettingsMutation.isPending || !ownerSettings}
              aria-label="Activar o desactivar aprobación automática de visitas"
              data-testid="switch-auto-approve"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes ({allAppointments.filter(a => a.ownerApprovalStatus === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Aprobadas ({allAppointments.filter(a => a.ownerApprovalStatus === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rechazadas ({allAppointments.filter(a => a.ownerApprovalStatus === "rejected").length})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            Todas ({allAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4 mt-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No hay visitas en este estado
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} data-testid={`card-appointment-${appointment.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {appointment.property?.title || "Propiedad"}
                        </CardTitle>
                        {getStatusBadge(appointment.ownerApprovalStatus)}
                      </div>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          {new Date(appointment.date).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {getClientName(appointment.client)}
                        </div>
                        {appointment.property?.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {appointment.property.location}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    {appointment.ownerApprovalStatus === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleOpenReview(appointment, "approve")}
                          data-testid={`button-approve-${appointment.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleOpenReview(appointment, "reject")}
                          data-testid={`button-reject-${appointment.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipo: </span>
                      <span className="font-medium">{formatAppointmentType(appointment.type)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estado: </span>
                      <span className="font-medium capitalize">{appointment.status}</span>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Notas del cliente:</h4>
                      <p className="text-sm text-muted-foreground" data-testid="text-client-notes">
                        {appointment.notes}
                      </p>
                    </div>
                  )}

                  {appointment.meetLink && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Link de reunión:</h4>
                      <a
                        href={appointment.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                        data-testid="link-meet"
                      >
                        {appointment.meetLink}
                      </a>
                    </div>
                  )}

                  {appointment.ownerApprovedAt && (
                    <div className="text-sm text-muted-foreground">
                      {appointment.ownerApprovalStatus === "approved" ? "Aprobada" : "Procesada"} el{" "}
                      {new Date(appointment.ownerApprovedAt).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!reviewAction} onOpenChange={() => handleCloseDialog()}>
        <DialogContent data-testid="dialog-review">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Aprobar visita" : "Rechazar visita"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "El cliente será notificado de que su visita ha sido aprobada."
                : "El cliente será notificado de que su visita ha sido rechazada."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedAppointment && (
              <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                <div>
                  <span className="font-medium">Propiedad:</span>{" "}
                  {selectedAppointment.property?.title}
                </div>
                <div>
                  <span className="font-medium">Cliente:</span>{" "}
                  {getClientName(selectedAppointment.client)}
                </div>
                <div>
                  <span className="font-medium">Fecha:</span>{" "}
                  {new Date(selectedAppointment.date).toLocaleString()}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="reviewNotes">Notas adicionales (opcional)</Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Agrega notas sobre tu decisión..."
                rows={3}
                data-testid="input-review-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              data-testid="button-cancel-review"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              variant={reviewAction === "reject" ? "destructive" : "default"}
              data-testid="button-confirm-review"
            >
              {approveMutation.isPending || rejectMutation.isPending
                ? "Procesando..."
                : reviewAction === "approve"
                ? "Aprobar"
                : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
