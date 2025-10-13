import { useState, type DragEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Home, User, DollarSign, Calendar, FileText, LayoutGrid, List, LayoutList } from "lucide-react";
import { type RentalApplication, insertRentalApplicationSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getPropertyTitle } from "@/lib/propertyHelpers";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ViewMode = "kanban" | "list" | "compact";

const RENTAL_STATUSES = [
  { value: "solicitud_enviada", label: "Solicitud Enviada", color: "bg-blue-500", group: "inicio" },
  { value: "revision_documentos", label: "Revisión de Documentos", color: "bg-purple-500", group: "revision" },
  { value: "verificacion_credito", label: "Verificación de Crédito", color: "bg-cyan-500", group: "revision" },
  { value: "aprobado", label: "Aprobado", color: "bg-green-500", group: "aprobacion" },
  { value: "contrato_enviado", label: "Contrato Enviado", color: "bg-yellow-500", group: "contrato" },
  { value: "contrato_firmado", label: "Contrato Firmado", color: "bg-orange-500", group: "contrato" },
  { value: "pago_deposito", label: "Pago de Depósito", color: "bg-indigo-500", group: "finalizacion" },
  { value: "activo", label: "Activo", color: "bg-emerald-500", group: "finalizacion" },
  { value: "rechazado", label: "Rechazado", color: "bg-red-500", group: "rechazado" },
];

const COMPACT_GROUPS = [
  { id: "inicio", label: "Inicio", statuses: ["solicitud_enviada"], color: "bg-blue-500" },
  { id: "revision", label: "En Revisión", statuses: ["revision_documentos", "verificacion_credito"], color: "bg-purple-500" },
  { id: "aprobacion", label: "Aprobado", statuses: ["aprobado"], color: "bg-green-500" },
  { id: "contrato", label: "Contratación", statuses: ["contrato_enviado", "contrato_firmado"], color: "bg-yellow-500" },
  { id: "finalizacion", label: "Finalización", statuses: ["pago_deposito", "activo"], color: "bg-emerald-500" },
  { id: "rechazado", label: "Rechazado", statuses: ["rechazado"], color: "bg-red-500" },
];

const rentalFormSchema = insertRentalApplicationSchema.extend({
  monthlyIncome: z.string().optional(),
  depositAmount: z.string().optional(),
  leaseDuration: z.string().optional(),
});

export default function RentalsKanban() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  
  const form = useForm({
    resolver: zodResolver(rentalFormSchema),
    defaultValues: {
      propertyId: "",
      applicantId: "",
      employmentStatus: "",
      monthlyIncome: "",
      leaseDuration: "",
      depositAmount: "",
      notes: "",
      status: "solicitud_enviada",
    },
  });

  const { data: applications = [], isLoading } = useQuery<RentalApplication[]>({
    queryKey: ["/api/rental-applications"],
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["/api/properties"],
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  const { data: eligibleApplicants = [] } = useQuery({
    queryKey: ["/api/rental-applications/eligible-applicants", selectedPropertyId],
    queryFn: async () => {
      if (!selectedPropertyId) return [];
      const response = await fetch(`/api/rental-applications/eligible-applicants?propertyId=${selectedPropertyId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch eligible applicants");
      }
      return response.json();
    },
    enabled: !!selectedPropertyId,
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        monthlyIncome: data.monthlyIncome ? data.monthlyIncome.toString() : null,
        depositAmount: data.depositAmount ? data.depositAmount.toString() : null,
        leaseDuration: data.leaseDuration ? parseInt(data.leaseDuration) : null,
      };
      await apiRequest("POST", "/api/rental-applications", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-applications"] });
      toast({ title: "Oferta de renta creada exitosamente" });
      setDialogOpen(false);
      setSelectedPropertyId("");
      form.reset();
    },
    onError: () => {
      toast({ title: "Error al crear oferta", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/rental-applications/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-applications"] });
    },
    onError: () => {
      toast({ title: "Error al actualizar estado", variant: "destructive" });
    },
  });

  const handleDragStart = (e: DragEvent, applicationId: string) => {
    e.dataTransfer.setData("applicationId", applicationId);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent, newStatus: string) => {
    e.preventDefault();
    const applicationId = e.dataTransfer.getData("applicationId");
    updateStatusMutation.mutate({ id: applicationId, status: newStatus });
  };

  const handleGroupDrop = (e: DragEvent, groupStatuses: string[]) => {
    e.preventDefault();
    const applicationId = e.dataTransfer.getData("applicationId");
    const application = applications.find((app) => app.id === applicationId);
    
    if (!application) return;

    // If already in this group, keep the current status
    if (groupStatuses.includes(application.status)) {
      return; // Don't change status if already in the same group
    }

    // Otherwise, move to the first status of the new group
    updateStatusMutation.mutate({ id: applicationId, status: groupStatuses[0] });
  };

  const handleSubmit = (data: any) => {
    createApplicationMutation.mutate(data);
  };

  const formatCurrency = (value: string) => {
    if (!value) return "Sin especificar";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const getApplicationsByStatus = (status: string) => {
    return applications.filter((app) => app.status === status);
  };

  const getApplicationsByGroup = (statuses: string[]) => {
    return applications.filter((app) => statuses.includes(app.status));
  };

  const getPropertyTitleById = (propertyId: string) => {
    const property = properties.find((p: any) => p.id === propertyId);
    return getPropertyTitle(property);
  };

  const getApplicantName = (applicantId: string) => {
    const applicant = allUsers.find((u: any) => u.id === applicantId);
    return applicant ? `${applicant.firstName} ${applicant.lastName}` : "Solicitante";
  };

  const getStatusLabel = (status: string) => {
    return RENTAL_STATUSES.find((s) => s.value === status)?.label || status;
  };

  const getStatusColor = (status: string) => {
    return RENTAL_STATUSES.find((s) => s.value === status)?.color || "bg-gray-500";
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Kanban - Proceso de Rentas</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-16 bg-muted" />
              <CardContent className="h-64 bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="container mx-auto py-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Kanban - Proceso de Rentas</h1>
            <p className="text-muted-foreground">
              {applications.length} {applications.length === 1 ? "solicitud" : "solicitudes"} en proceso
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                data-testid="button-view-kanban"
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
              </Button>
              <Button
                variant={viewMode === "compact" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("compact")}
                data-testid="button-view-compact"
                className="gap-2"
              >
                <LayoutList className="h-4 w-4" />
                <span className="hidden sm:inline">Compacta</span>
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
                className="gap-2"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </Button>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setSelectedPropertyId("");
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-rental-application">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Oferta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Oferta de Renta</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="propertyId"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Propiedad</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedPropertyId(value);
                                form.setValue("applicantId", "");
                              }} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-property">
                                  <SelectValue placeholder="Seleccionar propiedad" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {properties.filter((p: any) => p.status === "rent" || p.status === "both").map((property: any) => (
                                  <SelectItem key={property.id} value={property.id}>
                                    {property.title} - {property.location}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="applicantId"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Solicitante</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              disabled={!selectedPropertyId}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-applicant">
                                  <SelectValue placeholder={
                                    !selectedPropertyId 
                                      ? "Primero selecciona una propiedad" 
                                      : eligibleApplicants.length === 0
                                        ? "No hay solicitantes con visitas completadas"
                                        : "Seleccionar solicitante"
                                  } />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {eligibleApplicants.map((user: any) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} - {user.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="employmentStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Situación Laboral</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Empleado, Independiente, etc."
                                data-testid="input-employment-status"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="monthlyIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ingreso Mensual (MXN)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="50000"
                                data-testid="input-monthly-income"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="leaseDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duración del Contrato (meses)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="12"
                                data-testid="input-lease-duration"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="depositAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monto de Depósito (MXN)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="25000"
                                data-testid="input-deposit-amount"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Notas (Opcional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Información adicional sobre la solicitud..."
                                data-testid="input-notes"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        data-testid="button-cancel"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createApplicationMutation.isPending}
                        data-testid="button-submit"
                      >
                        {createApplicationMutation.isPending ? "Creando..." : "Crear Solicitud"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Vista Kanban Completa */}
      {viewMode === "kanban" && (
        <div className="flex-1 overflow-x-auto pb-6">
          <div className="container mx-auto">
            <div className="flex gap-4 min-w-max pb-4">
              {RENTAL_STATUSES.map((status) => {
                const statusApplications = getApplicationsByStatus(status.value);
                return (
                  <Card
                    key={status.value}
                    className="w-80 flex-shrink-0"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status.value)}
                  >
                    <CardHeader className={`${status.color} text-white`}>
                      <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
                        <span className="truncate">{status.label}</span>
                        <Badge variant="secondary" className="bg-white/20 text-white flex-shrink-0">
                          {statusApplications.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
                      {statusApplications.map((application) => (
                        <Card
                          key={application.id}
                          className="cursor-move hover-elevate active-elevate-2"
                          draggable
                          onDragStart={(e) => handleDragStart(e, application.id)}
                          data-testid={`rental-card-${application.id}`}
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate" data-testid="text-property-title">
                                  {getPropertyTitleById(application.propertyId)}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                  <User className="h-3 w-3 flex-shrink-0" />
                                  {getApplicantName(application.applicantId)}
                                </p>
                              </div>
                            </div>

                            {application.monthlyIncome && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <DollarSign className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">Ingreso: {formatCurrency(application.monthlyIncome)}</span>
                              </div>
                            )}

                            {application.leaseDuration && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span>{application.leaseDuration} meses</span>
                              </div>
                            )}

                            {application.depositAmount && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <FileText className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">Depósito: {formatCurrency(application.depositAmount)}</span>
                              </div>
                            )}

                            {application.notes && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {application.notes}
                              </p>
                            )}

                            <div className="text-xs text-muted-foreground pt-1 border-t">
                              {format(new Date(application.createdAt), "dd MMM yyyy", { locale: es })}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {statusApplications.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                          No hay solicitudes
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Vista Compacta */}
      {viewMode === "compact" && (
        <div className="flex-1 overflow-x-auto pb-6">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {COMPACT_GROUPS.map((group) => {
                const groupApplications = getApplicationsByGroup(group.statuses);
                return (
                  <Card
                    key={group.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleGroupDrop(e, group.statuses)}
                  >
                    <CardHeader className={`${group.color} text-white`}>
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span>{group.label}</span>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          {groupApplications.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2 min-h-[200px] max-h-[500px] overflow-y-auto">
                      {groupApplications.map((application) => (
                        <Card
                          key={application.id}
                          className="cursor-move hover-elevate active-elevate-2"
                          draggable
                          onDragStart={(e) => handleDragStart(e, application.id)}
                          data-testid={`rental-card-compact-${application.id}`}
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {getStatusLabel(application.status)}
                              </Badge>
                            </div>
                            
                            <h4 className="font-semibold text-sm truncate">
                              {getPropertyTitle(application.propertyId)}
                            </h4>
                            
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {getApplicantName(application.applicantId)}
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t">
                              {application.monthlyIncome && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  <span className="truncate">{formatCurrency(application.monthlyIncome)}</span>
                                </div>
                              )}
                              {application.leaseDuration && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{application.leaseDuration}m</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {groupApplications.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                          No hay solicitudes
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Vista de Lista */}
      {viewMode === "list" && (
        <div className="flex-1 overflow-auto pb-6">
          <div className="container mx-auto">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Propiedad</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ingreso Mensual</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Depósito</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay solicitudes de renta
                        </TableCell>
                      </TableRow>
                    ) : (
                      applications.map((application) => (
                        <TableRow 
                          key={application.id}
                          data-testid={`rental-row-${application.id}`}
                          className="hover-elevate cursor-pointer"
                        >
                          <TableCell className="font-medium">
                            {getPropertyTitle(application.propertyId)}
                          </TableCell>
                          <TableCell>
                            {getApplicantName(application.applicantId)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(application.status)} text-white`}>
                              {getStatusLabel(application.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {application.monthlyIncome ? formatCurrency(application.monthlyIncome) : "-"}
                          </TableCell>
                          <TableCell>
                            {application.leaseDuration ? `${application.leaseDuration} meses` : "-"}
                          </TableCell>
                          <TableCell>
                            {application.depositAmount ? formatCurrency(application.depositAmount) : "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(application.createdAt), "dd/MM/yyyy", { locale: es })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
