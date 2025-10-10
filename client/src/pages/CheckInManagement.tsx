import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  Clock,
  CheckCircle2,
  Upload,
  FileText,
  MapPin,
  User,
  Home,
  XCircle,
  Download,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface RentalContract {
  id: string;
  propertyId: string;
  tenantId: string;
  status: string;
  monthlyRent: string;
  property?: { title: string; address: string };
  tenant?: { fullName: string; email: string };
  owner?: { fullName: string; email: string };
}

interface CheckInAppointment {
  id: string;
  rentalContractId: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  scheduledDate: string;
  duration: number;
  location: string;
  assignedAdminId: string | null;
  status: "scheduled" | "completed" | "cancelled";
  completedAt: string | null;
  cancellationReason: string | null;
  notes: string | null;
  contract?: RentalContract;
}

interface SignedDocument {
  id: string;
  rentalContractId: string;
  checkInAppointmentId: string;
  documentUrl: string;
  documentType: string;
  signedBy: string;
  uploadedAt: string;
}

export default function CheckInManagement() {
  const { toast } = useToast();
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<CheckInAppointment | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  // Schedule form
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  
  // Upload form
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("tenant_signed");

  // Fetch approved contracts ready for check-in
  const { data: approvedContracts, isLoading: isLoadingContracts } = useQuery<RentalContract[]>({
    queryKey: ["/api/admin/rental-contracts"],
  });

  // Fetch all check-in appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<CheckInAppointment[]>({
    queryKey: ["/api/check-in/appointments"],
  });

  // Fetch signed documents for selected appointment
  const { data: signedDocuments } = useQuery<SignedDocument[]>({
    queryKey: ["/api/check-in", selectedAppointment?.id, "signed-documents"],
    enabled: !!selectedAppointment,
  });

  // Schedule mutation
  const scheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/contracts/${selectedContract?.id}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/check-in/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rental-contracts"] });
      toast({
        title: "Cita programada",
        description: "La cita de check-in ha sido programada exitosamente",
      });
      setIsScheduleDialogOpen(false);
      resetScheduleForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo programar la cita",
        variant: "destructive",
      });
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      return await apiRequest(`/api/check-in/${appointmentId}/complete`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/check-in/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rental-contracts"] });
      toast({
        title: "Check-in completado",
        description: "El check-in ha sido marcado como completado",
      });
      setIsCompleteDialogOpen(false);
      setSelectedAppointment(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo completar el check-in",
        variant: "destructive",
      });
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest(`/api/check-in/${selectedAppointment?.id}/signed-documents`, {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/check-in", selectedAppointment?.id, "signed-documents"] });
      toast({
        title: "Documento subido",
        description: "El contrato firmado ha sido subido exitosamente",
      });
      setIsUploadDialogOpen(false);
      setDocumentFile(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo subir el documento",
        variant: "destructive",
      });
    },
  });

  const resetScheduleForm = () => {
    setScheduledDate("");
    setScheduledTime("");
    setDuration("60");
    setLocation("");
    setNotes("");
    setSelectedContract(null);
  };

  const handleScheduleSubmit = () => {
    if (!scheduledDate || !scheduledTime || !location) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    
    scheduleMutation.mutate({
      scheduledDate: scheduledDateTime.toISOString(),
      duration: parseInt(duration),
      location,
      notes: notes || undefined,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast({
          title: "Error",
          description: "Solo se permiten archivos PDF",
          variant: "destructive",
        });
        return;
      }
      setDocumentFile(file);
    }
  };

  const handleUploadSubmit = () => {
    if (!documentFile) return;

    const formData = new FormData();
    formData.append("document", documentFile);
    formData.append("documentType", documentType);

    uploadMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { icon: Clock, label: "Programado", className: "bg-blue-100 dark:bg-blue-950" },
      completed: { icon: CheckCircle2, label: "Completado", className: "bg-green-100 dark:bg-green-950" },
      cancelled: { icon: XCircle, label: "Cancelado", className: "bg-red-100 dark:bg-red-950" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (isLoadingContracts || isLoadingAppointments) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const readyContracts = approvedContracts?.filter(c => 
    c.status === "firmado" || c.status === "check_in"
  ) || [];

  const scheduledAppointments = appointments?.filter(a => a.status === "scheduled") || [];
  const completedAppointments = appointments?.filter(a => a.status === "completed") || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-checkin-title">
            Gestión de Check-In
          </h1>
          <p className="text-muted-foreground" data-testid="text-checkin-subtitle">
            Programa y gestiona citas de check-in
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2" data-testid="badge-ready-count">
            <Calendar className="w-5 h-5 mr-2" />
            {readyContracts.length} Listos
          </Badge>
          <Badge variant="outline" className="text-lg px-4 py-2" data-testid="badge-scheduled-count">
            <Clock className="w-5 h-5 mr-2" />
            {scheduledAppointments.length} Programados
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="ready" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ready" data-testid="tab-ready">
            Listos para Check-in ({readyContracts.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled" data-testid="tab-scheduled">
            Programados ({scheduledAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completados ({completedAppointments.length})
          </TabsTrigger>
        </TabsList>

        {/* Ready Contracts Tab */}
        <TabsContent value="ready">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-ready-title">Contratos Listos</CardTitle>
              <CardDescription data-testid="text-ready-description">
                Contratos aprobados esperando programación de check-in
              </CardDescription>
            </CardHeader>
            <CardContent>
              {readyContracts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead data-testid="table-head-property">Propiedad</TableHead>
                      <TableHead data-testid="table-head-tenant">Inquilino</TableHead>
                      <TableHead data-testid="table-head-rent">Renta</TableHead>
                      <TableHead data-testid="table-head-actions">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readyContracts.map((contract) => (
                      <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                        <TableCell data-testid={`cell-property-${contract.id}`}>
                          <div className="font-medium">{contract.property?.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {contract.property?.address}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`cell-tenant-${contract.id}`}>
                          <div className="font-medium">{contract.tenant?.fullName}</div>
                        </TableCell>
                        <TableCell data-testid={`cell-rent-${contract.id}`}>
                          {formatCurrency(parseFloat(contract.monthlyRent))}
                        </TableCell>
                        <TableCell data-testid={`cell-actions-${contract.id}`}>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedContract(contract);
                              setIsScheduleDialogOpen(true);
                            }}
                            data-testid={`button-schedule-${contract.id}`}
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            Programar Check-in
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12" data-testid="empty-state-no-ready">
                  <Home className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay contratos listos para check-in
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Appointments Tab */}
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-scheduled-title">Citas Programadas</CardTitle>
              <CardDescription data-testid="text-scheduled-description">
                Check-ins programados pendientes de completar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledAppointments.length > 0 ? (
                <div className="space-y-4">
                  {scheduledAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-4 border rounded-lg"
                      data-testid={`appointment-${appointment.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold" data-testid={`appointment-property-${appointment.id}`}>
                              {appointment.contract?.property?.title}
                            </h3>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span data-testid={`appointment-date-${appointment.id}`}>
                                {format(new Date(appointment.scheduledDate), "PPP", { locale: es })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span data-testid={`appointment-time-${appointment.id}`}>
                                {format(new Date(appointment.scheduledDate), "p", { locale: es })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span data-testid={`appointment-location-${appointment.id}`}>
                                {appointment.location}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span data-testid={`appointment-tenant-${appointment.id}`}>
                                {appointment.contract?.tenant?.fullName}
                              </span>
                            </div>
                          </div>
                          {appointment.notes && (
                            <p className="text-sm text-muted-foreground mt-2" data-testid={`appointment-notes-${appointment.id}`}>
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsUploadDialogOpen(true);
                            }}
                            data-testid={`button-upload-docs-${appointment.id}`}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Subir Docs
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsCompleteDialogOpen(true);
                            }}
                            data-testid={`button-complete-${appointment.id}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" data-testid="empty-state-no-scheduled">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay citas programadas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Appointments Tab */}
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-completed-title">Check-ins Completados</CardTitle>
              <CardDescription data-testid="text-completed-description">
                Historial de check-ins finalizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedAppointments.length > 0 ? (
                <div className="space-y-4">
                  {completedAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-4 border rounded-lg"
                      data-testid={`completed-${appointment.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold" data-testid={`completed-property-${appointment.id}`}>
                          {appointment.contract?.property?.title}
                        </h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Completado: {appointment.completedAt && format(new Date(appointment.completedAt), "PPP", { locale: es })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" data-testid="empty-state-no-completed">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay check-ins completados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-schedule">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-schedule">
              Programar Check-in
            </DialogTitle>
            <DialogDescription data-testid="dialog-description-schedule">
              {selectedContract?.property?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  data-testid="input-date"
                />
              </div>
              <div>
                <Label htmlFor="time">Hora *</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  data-testid="input-time"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duración (minutos) *</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration" data-testid="select-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1.5 horas</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Ubicación *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Dirección de la propiedad"
                  data-testid="input-location"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instrucciones adicionales..."
                rows={3}
                data-testid="textarea-notes"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsScheduleDialogOpen(false);
                  resetScheduleForm();
                }}
                data-testid="button-cancel-schedule"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleScheduleSubmit}
                disabled={scheduleMutation.isPending}
                data-testid="button-confirm-schedule"
              >
                {scheduleMutation.isPending ? "Programando..." : "Programar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent data-testid="dialog-complete">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-complete">
              Completar Check-in
            </DialogTitle>
            <DialogDescription data-testid="dialog-description-complete">
              ¿Estás seguro de marcar este check-in como completado?
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCompleteDialogOpen(false)}
              data-testid="button-cancel-complete"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => selectedAppointment && completeMutation.mutate(selectedAppointment.id)}
              disabled={completeMutation.isPending}
              data-testid="button-confirm-complete"
            >
              {completeMutation.isPending ? "Completando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Signed Documents Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent data-testid="dialog-upload">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-upload">
              Subir Contratos Firmados
            </DialogTitle>
            <DialogDescription data-testid="dialog-description-upload">
              Sube los contratos escaneados con las firmas de las partes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="doc-type">Tipo de Documento *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="doc-type" data-testid="select-doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant_signed">Firmado por Inquilino</SelectItem>
                  <SelectItem value="owner_signed">Firmado por Propietario</SelectItem>
                  <SelectItem value="both_signed">Firmado por Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="doc-file">Archivo PDF *</Label>
              <Input
                id="doc-file"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                data-testid="input-doc-file"
              />
              {documentFile && (
                <p className="text-sm text-muted-foreground mt-2" data-testid="text-selected-doc-file">
                  {documentFile.name}
                </p>
              )}
            </div>

            {/* Show uploaded documents */}
            {signedDocuments && signedDocuments.length > 0 && (
              <div className="border rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">Documentos subidos:</h4>
                <div className="space-y-2">
                  {signedDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{doc.documentType}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(doc.documentUrl, "_blank")}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setDocumentFile(null);
                }}
                data-testid="button-cancel-upload"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadSubmit}
                disabled={!documentFile || uploadMutation.isPending}
                data-testid="button-confirm-upload"
              >
                {uploadMutation.isPending ? "Subiendo..." : "Subir"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
