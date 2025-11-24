import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ExternalQuotation } from "@shared/schema";
import { FileText, Plus, Send, Check, X, Ban, Link2, Trash2, Eye, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Service line item schema
const serviceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nombre del servicio requerido"),
  description: z.string().optional(),
  quantity: z.coerce.number().positive("Cantidad debe ser mayor a 0"),
  unitPrice: z.coerce.number().positive("Precio unitario debe ser mayor a 0"),
  subtotal: z.coerce.number(),
});

type ServiceLine = z.infer<typeof serviceSchema>;

// Quotation form schema
const quotationFormSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional(),
  clientId: z.string().optional(),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  services: z.array(serviceSchema).min(1, "Debe agregar al menos un servicio"),
  adminFeePercentage: z.coerce.number().min(0).max(100).default(15),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().default("MXN"),
  status: z.enum(["draft", "sent", "accepted", "rejected", "cancelled"]).default("draft"),
});

type QuotationFormData = z.infer<typeof quotationFormSchema>;

const statusConfig = {
  draft: { label: "Borrador", color: "bg-gray-500", icon: FileText },
  sent: { label: "Enviada", color: "bg-blue-500", icon: Send },
  accepted: { label: "Aceptada", color: "bg-green-500", icon: Check },
  rejected: { label: "Rechazada", color: "bg-red-500", icon: X },
  cancelled: { label: "Cancelada", color: "bg-gray-600", icon: Ban },
};

export default function ExternalQuotations() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<ExternalQuotation | null>(null);
  const [viewQuotation, setViewQuotation] = useState<ExternalQuotation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Fetch quotations
  const { data: quotations = [], isLoading } = useQuery<ExternalQuotation[]>({
    queryKey: ["/api/external/quotations"],
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/external-clients"],
  });

  // Fetch properties for dropdown
  const { data: properties = [] } = useQuery<any[]>({
    queryKey: ["/api/external-properties"],
  });

  // Create quotation mutation
  const createMutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      const { services, adminFeePercentage, ...rest } = data;
      
      // Calculate financials
      const subtotal = services.reduce((sum, s) => sum + s.subtotal, 0);
      const adminFee = subtotal * (adminFeePercentage / 100);
      const total = subtotal + adminFee;

      return apiRequest("/api/external/quotations", {
        method: "POST",
        body: JSON.stringify({
          ...rest,
          services,
          subtotal,
          adminFee,
          adminFeePercentage,
          total,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/quotations"] });
      toast({ title: "Cotización creada exitosamente" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear cotización",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update quotation mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: QuotationFormData }) => {
      const { services, adminFeePercentage, ...rest } = data;
      
      // Calculate financials
      const subtotal = services.reduce((sum, s) => sum + s.subtotal, 0);
      const adminFee = subtotal * (adminFeePercentage / 100);
      const total = subtotal + adminFee;

      return apiRequest(`/api/external/quotations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...rest,
          services,
          subtotal,
          adminFee,
          adminFeePercentage,
          total,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/quotations"] });
      toast({ title: "Cotización actualizada exitosamente" });
      setDialogOpen(false);
      setEditingQuotation(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar cotización",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete quotation mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/external/quotations/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/quotations"] });
      toast({ title: "Cotización eliminada exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar cotización",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/external/quotations/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/quotations"] });
      toast({ title: "Estado actualizado exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar estado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate share link mutation
  const shareMutation = useMutation({
    mutationFn: async ({ id, expiresInDays }: { id: string; expiresInDays: number }) => {
      return apiRequest(`/api/external/quotations/${id}/share`, {
        method: "POST",
        body: JSON.stringify({ expiresInDays }),
      });
    },
    onSuccess: (data: any) => {
      const fullUrl = `${window.location.origin}${data.publicUrl}`;
      navigator.clipboard.writeText(fullUrl);
      toast({
        title: "Enlace copiado al portapapeles",
        description: `El enlace expira el ${format(new Date(data.expiresAt), "dd/MM/yyyy", { locale: es })}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al generar enlace",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form
  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      title: "",
      description: "",
      clientId: "",
      propertyId: "",
      unitId: "",
      services: [
        {
          id: crypto.randomUUID(),
          name: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          subtotal: 0,
        },
      ],
      adminFeePercentage: 15,
      notes: "",
      terms: "",
      currency: "MXN",
      status: "draft",
    },
  });

  const services = form.watch("services");
  const adminFeePercentage = form.watch("adminFeePercentage");

  // Calculate totals
  const subtotal = services.reduce((sum, s) => sum + (s.subtotal || 0), 0);
  const adminFee = subtotal * (adminFeePercentage / 100);
  const total = subtotal + adminFee;

  const handleSubmit = (data: QuotationFormData) => {
    if (editingQuotation) {
      updateMutation.mutate({ id: editingQuotation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (quotation: ExternalQuotation) => {
    setEditingQuotation(quotation);
    
    // Parse services from JSON
    const parsedServices = typeof quotation.services === 'string' 
      ? JSON.parse(quotation.services) 
      : quotation.services;

    form.reset({
      title: quotation.title,
      description: quotation.description || "",
      clientId: quotation.clientId || "",
      propertyId: quotation.propertyId || "",
      unitId: quotation.unitId || "",
      services: parsedServices,
      adminFeePercentage: parseFloat(quotation.adminFeePercentage),
      notes: quotation.notes || "",
      terms: quotation.terms || "",
      currency: quotation.currency,
      status: quotation.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta cotización?")) {
      deleteMutation.mutate(id);
    }
  };

  const addService = () => {
    const current = form.getValues("services");
    form.setValue("services", [
      ...current,
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        subtotal: 0,
      },
    ]);
  };

  const removeService = (index: number) => {
    const current = form.getValues("services");
    form.setValue(
      "services",
      current.filter((_, i) => i !== index)
    );
  };

  const updateServiceSubtotal = (index: number) => {
    const service = form.getValues(`services.${index}`);
    const subtotal = service.quantity * service.unitPrice;
    form.setValue(`services.${index}.subtotal`, subtotal);
  };

  // Filter quotations
  const filteredQuotations = quotations.filter(q => 
    filterStatus === "all" || q.status === filterStatus
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cotizaciones</h1>
          <p className="text-muted-foreground">
            Gestiona cotizaciones para servicios de mantenimiento
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid="button-create-quotation"
              onClick={() => {
                setEditingQuotation(null);
                form.reset();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cotización
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuotation ? "Editar Cotización" : "Nueva Cotización"}
              </DialogTitle>
              <DialogDescription>
                Complete los detalles de la cotización y agregue los servicios requeridos
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-title" placeholder="Título de la cotización" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-client">
                              <SelectValue placeholder="Seleccionar cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Ninguno</SelectItem>
                            {clients.map((client: any) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
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
                    name="propertyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Propiedad (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-property">
                              <SelectValue placeholder="Seleccionar propiedad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Ninguna</SelectItem>
                            {properties.map((property: any) => (
                              <SelectItem key={property.id} value={property.id}>
                                {property.name}
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
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="input-description" placeholder="Descripción del trabajo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Services Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Servicios</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addService} data-testid="button-add-service">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Servicio
                    </Button>
                  </div>

                  {services.map((service, index) => (
                    <Card key={service.id}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="grid grid-cols-12 gap-3">
                          <FormField
                            control={form.control}
                            name={`services.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="col-span-6">
                                <FormLabel>Nombre del Servicio</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid={`input-service-name-${index}`} placeholder="Nombre" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`services.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>Cantidad</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    min="1"
                                    data-testid={`input-quantity-${index}`}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      setTimeout(() => updateServiceSubtotal(index), 0);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`services.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>Precio Unit.</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    data-testid={`input-unit-price-${index}`}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      setTimeout(() => updateServiceSubtotal(index), 0);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="col-span-1 flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeService(index)}
                              data-testid={`button-remove-service-${index}`}
                              disabled={services.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          <FormField
                            control={form.control}
                            name={`services.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="col-span-11">
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid={`input-service-description-${index}`} placeholder="Descripción del servicio" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="col-span-12 text-right font-semibold">
                            Subtotal: ${service.subtotal.toFixed(2)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Financials Summary */}
                <Card>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Subtotal:</span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>Tarifa Administrativa:</span>
                        <FormField
                          control={form.control}
                          name="adminFeePercentage"
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              className="w-20"
                              data-testid="input-admin-fee-percentage"
                            />
                          )}
                        />
                        <span>%</span>
                      </div>
                      <span className="font-semibold">${adminFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span>${total.toFixed(2)} MXN</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Notas Internas (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="input-notes" placeholder="Notas privadas" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Términos y Condiciones (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="input-terms" placeholder="Términos específicos de esta cotización" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingQuotation(null);
                    }}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    data-testid="button-submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingQuotation ? "Actualizar" : "Crear"} Cotización
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          onClick={() => setFilterStatus("all")}
          data-testid="filter-all"
        >
          Todas
        </Button>
        {Object.entries(statusConfig).map(([status, config]) => (
          <Button
            key={status}
            variant={filterStatus === status ? "default" : "outline"}
            onClick={() => setFilterStatus(status)}
            data-testid={`filter-${status}`}
          >
            {config.label}
          </Button>
        ))}
      </div>

      {/* Quotations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotizaciones</CardTitle>
          <CardDescription>
            {filteredQuotations.length} cotización(es) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : filteredQuotations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay cotizaciones {filterStatus !== "all" && `con estado "${statusConfig[filterStatus as keyof typeof statusConfig]?.label}"`}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation) => {
                  const StatusIcon = statusConfig[quotation.status].icon;
                  return (
                    <TableRow key={quotation.id} data-testid={`row-quotation-${quotation.id}`}>
                      <TableCell className="font-medium">{quotation.title}</TableCell>
                      <TableCell>
                        {clients.find((c: any) => c.id === quotation.clientId)?.name || "-"}
                      </TableCell>
                      <TableCell>${parseFloat(quotation.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={statusConfig[quotation.status].color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig[quotation.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(quotation.createdAt), "dd/MM/yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewQuotation(quotation)}
                          data-testid={`button-view-${quotation.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(quotation)}
                          data-testid={`button-edit-${quotation.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {quotation.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateStatusMutation.mutate({ id: quotation.id, status: "sent" })}
                            data-testid={`button-send-${quotation.id}`}
                          >
                            <Send className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                        {quotation.status === "sent" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateStatusMutation.mutate({ id: quotation.id, status: "accepted" })}
                              data-testid={`button-accept-${quotation.id}`}
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateStatusMutation.mutate({ id: quotation.id, status: "rejected" })}
                              data-testid={`button-reject-${quotation.id}`}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => shareMutation.mutate({ id: quotation.id, expiresInDays: 30 })}
                          data-testid={`button-share-${quotation.id}`}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(quotation.id)}
                          data-testid={`button-delete-${quotation.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Quotation Dialog */}
      <Dialog open={!!viewQuotation} onOpenChange={() => setViewQuotation(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewQuotation?.title}</DialogTitle>
            <DialogDescription>
              Detalles de la cotización
            </DialogDescription>
          </DialogHeader>
          {viewQuotation && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Descripción</h4>
                <p className="text-sm text-muted-foreground">{viewQuotation.description || "Sin descripción"}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Servicios</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unit.</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(typeof viewQuotation.services === 'string' ? JSON.parse(viewQuotation.services) : viewQuotation.services).map((service: ServiceLine) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{service.name}</div>
                            {service.description && (
                              <div className="text-sm text-muted-foreground">{service.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{service.quantity}</TableCell>
                        <TableCell>${service.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>${service.subtotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${parseFloat(viewQuotation.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tarifa Administrativa ({parseFloat(viewQuotation.adminFeePercentage).toFixed(2)}%):</span>
                  <span>${parseFloat(viewQuotation.adminFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${parseFloat(viewQuotation.total).toFixed(2)} {viewQuotation.currency}</span>
                </div>
              </div>

              {viewQuotation.terms && (
                <div>
                  <h4 className="font-semibold mb-2">Términos y Condiciones</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewQuotation.terms}</p>
                </div>
              )}

              {viewQuotation.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notas Internas</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewQuotation.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
