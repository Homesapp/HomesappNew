import { useState, type DragEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Home, User, DollarSign, Calendar, FileText } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const RENTAL_STATUSES = [
  { value: "solicitud_enviada", label: "Solicitud Enviada", color: "bg-blue-500" },
  { value: "revision_documentos", label: "Revisión de Documentos", color: "bg-purple-500" },
  { value: "verificacion_credito", label: "Verificación de Crédito", color: "bg-cyan-500" },
  { value: "aprobado", label: "Aprobado", color: "bg-green-500" },
  { value: "contrato_enviado", label: "Contrato Enviado", color: "bg-yellow-500" },
  { value: "contrato_firmado", label: "Contrato Firmado", color: "bg-orange-500" },
  { value: "pago_deposito", label: "Pago de Depósito", color: "bg-indigo-500" },
  { value: "activo", label: "Activo", color: "bg-emerald-500" },
  { value: "rechazado", label: "Rechazado", color: "bg-red-500" },
];

const rentalFormSchema = insertRentalApplicationSchema.extend({
  monthlyIncome: z.string().optional(),
  depositAmount: z.string().optional(),
  leaseDuration: z.string().optional(),
});

export default function RentalsKanban() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  
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

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
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
      toast({ title: "Solicitud de renta creada exitosamente" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error al crear solicitud", variant: "destructive" });
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

  const getPropertyTitle = (propertyId: string) => {
    const property = properties.find((p: any) => p.id === propertyId);
    return property?.title || "Propiedad";
  };

  const getApplicantName = (applicantId: string) => {
    const applicant = users.find((u: any) => u.id === applicantId);
    return applicant ? `${applicant.firstName} ${applicant.lastName}` : "Solicitante";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Kanban - Proceso de Rentas</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(9)].map((_, i) => (
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
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kanban - Proceso de Rentas</h1>
          <p className="text-muted-foreground">
            {applications.length} {applications.length === 1 ? "solicitud" : "solicitudes"} en proceso
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-rental-application">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Solicitud de Renta</DialogTitle>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-applicant">
                              <SelectValue placeholder="Seleccionar solicitante" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user: any) => (
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

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
        {RENTAL_STATUSES.map((status) => {
          const statusApplications = getApplicationsByStatus(status.value);
          return (
            <Card
              key={status.value}
              className="min-w-[280px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status.value)}
            >
              <CardHeader className={`${status.color} text-white`}>
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{status.label}</span>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {statusApplications.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2 min-h-[200px]">
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
                            {getPropertyTitle(application.propertyId)}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {getApplicantName(application.applicantId)}
                          </p>
                        </div>
                      </div>

                      {application.monthlyIncome && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span>Ingreso: {formatCurrency(application.monthlyIncome)}</span>
                        </div>
                      )}

                      {application.leaseDuration && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{application.leaseDuration} meses</span>
                        </div>
                      )}

                      {application.depositAmount && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>Depósito: {formatCurrency(application.depositAmount)}</span>
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
