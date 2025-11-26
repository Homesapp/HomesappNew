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
import { FileText, Plus, Send, Check, X, Ban, Link2, Trash2, Eye, Pencil, Search, Filter, LayoutGrid, Table as TableIcon, Download, Ticket, FileCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
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
  solutionDescription: z.string().optional(),
  clientId: z.string().optional(),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  services: z.array(serviceSchema).min(1, "Debe agregar al menos un servicio"),
  adminFeePercentage: z.coerce.number().min(0).max(100).default(15),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().default("MXN"),
  status: z.enum(["draft", "sent", "approved", "rejected", "converted_to_ticket"]).default("draft"),
});

type QuotationFormData = z.infer<typeof quotationFormSchema>;

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Borrador", color: "bg-gray-500", icon: FileText },
  sent: { label: "Enviada", color: "bg-blue-500", icon: Send },
  approved: { label: "Aprobada", color: "bg-green-500", icon: Check },
  rejected: { label: "Rechazada", color: "bg-red-500", icon: X },
  converted_to_ticket: { label: "Convertida a Ticket", color: "bg-purple-500", icon: FileCheck },
  cancelled: { label: "Cancelada", color: "bg-gray-600", icon: Ban },
};

export default function ExternalQuotations() {
  const { toast } = useToast();
  const isMobile = useMobile();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<ExternalQuotation | null>(null);
  const [viewQuotation, setViewQuotation] = useState<ExternalQuotation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const agencyId = user?.externalAgencyId;
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string>("");
  const [usePublicGeneral, setUsePublicGeneral] = useState(false);
  const [previousClientId, setPreviousClientId] = useState<string>("");

  // Fetch quotations
  const { data: quotations = [], isLoading } = useQuery<ExternalQuotation[]>({
    queryKey: ["/api/external/quotations"],
  });

  // Fetch clients for dropdown
  const { data: clientsResponse } = useQuery<{data: any[]}>({
    queryKey: ["/api/external-clients"],
  });
  
  const clients = clientsResponse?.data || [];

  // Fetch condominiums for dropdown
  const { data: condominiumsResponse } = useQuery<{ data: any[], total: number }>({
    queryKey: ["/api/external-condominiums", "for-quotations-dialog"],
    queryFn: async () => {
      const response = await fetch('/api/external-condominiums?limit=500', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch condominiums');
      return response.json();
    },
  });
  
  const condominiums = condominiumsResponse?.data || [];

  // Fetch units for dropdown
  const { data: unitsResponse } = useQuery<{ data: any[], total: number }>({
    queryKey: ["/api/external-units", "for-quotations-dialog"],
    queryFn: async () => {
      const response = await fetch('/api/external-units?limit=1000', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch units');
      return response.json();
    },
  });
  
  const allUnits = unitsResponse?.data || [];
  
  // Filter units by selected condominium
  const units = selectedCondominiumId 
    ? allUnits.filter((unit: any) => unit.condominiumId === selectedCondominiumId)
    : allUnits;

  // Create quotation mutation
  const createMutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      const { services, adminFeePercentage, ...rest } = data;
      
      // Calculate financials
      const subtotal = services.reduce((sum, s) => sum + s.subtotal, 0);
      const adminFee = subtotal * (adminFeePercentage / 100);
      const total = subtotal + adminFee;

      return apiRequest("POST", "/api/external/quotations", {
        ...rest,
        services,
        subtotal,
        adminFee,
        adminFeePercentage,
        total,
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

      return apiRequest("PATCH", `/api/external/quotations/${id}`, {
        ...rest,
        services,
        subtotal,
        adminFee,
        adminFeePercentage,
        total,
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
      return apiRequest("DELETE", `/api/external/quotations/${id}`);
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
      return apiRequest("PATCH", `/api/external/quotations/${id}/status`, { status });
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
      return apiRequest("POST", `/api/external/quotations/${id}/share`, { expiresInDays });
    },
    onSuccess: (data: any) => {
      const fullUrl = `${window.location.origin}${data.publicUrl}`;
      navigator.clipboard.writeText(fullUrl);
      
      let description = "El enlace ha sido copiado";
      if (data.expiresAt) {
        try {
          const dateValue = typeof data.expiresAt === 'string' ? data.expiresAt : String(data.expiresAt);
          const expiresDate = new Date(dateValue);
          if (!isNaN(expiresDate.getTime())) {
            description = `El enlace expira el ${format(expiresDate, "dd/MM/yyyy", { locale: es })}`;
          }
        } catch {
          // Keep default description
        }
      } else {
        description = "El enlace ha sido copiado (sin expiracion)";
      }
      
      toast({
        title: "Enlace copiado al portapapeles",
        description,
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

  // Download PDF mutation
  const downloadPdfMutation = useMutation({
    mutationFn: async ({ quotationId, quotationTitle }: { quotationId: string; quotationTitle: string }) => {
      const response = await fetch(`/api/external/quotations/${quotationId}/pdf`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al generar PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Normalize and sanitize filename preserving Unicode characters
      const safeName = quotationTitle
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^\w\s-]/g, '') // Remove special chars except word chars, spaces, hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .toLowerCase()
        .slice(0, 50); // Limit length
      a.download = `cotizacion-${safeName || quotationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: "PDF descargado exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al descargar PDF",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const convertToTicketMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      const response = await apiRequest(`/api/external/quotations/${quotationId}/convert-to-ticket`, {
        method: 'POST',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external-tickets'] });
      toast({ title: "Cotización convertida a ticket exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al convertir a ticket",
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
      solutionDescription: "",
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
    
    // Reset condominium and public general states
    const hasClient = !!quotation.clientId;
    setUsePublicGeneral(!hasClient);
    setPreviousClientId(quotation.clientId || "");
    
    // Try to find the unit's condominium to pre-select it
    const unitData = allUnits.find((u: any) => u.id === quotation.unitId);
    setSelectedCondominiumId(unitData?.condominiumId || quotation.propertyId || "");
    
    // Parse services from JSON
    const parsedServices = typeof quotation.services === 'string' 
      ? JSON.parse(quotation.services) 
      : quotation.services;

    form.reset({
      title: quotation.title,
      description: quotation.description || "",
      solutionDescription: (quotation as any).solutionDescription || "",
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
  
  const handleNewQuotation = () => {
    setEditingQuotation(null);
    setUsePublicGeneral(false);
    setSelectedCondominiumId("");
    setPreviousClientId("");
    form.reset({
      title: "",
      description: "",
      solutionDescription: "",
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
  const filteredQuotations = quotations.filter(q => {
    const matchesStatus = filterStatus === "all" || q.status === filterStatus;
    const matchesSearch = searchTerm === "" || 
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.quotationNumber?.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header with Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Cotizaciones</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona cotizaciones para servicios de mantenimiento
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid="button-create-quotation"
              onClick={handleNewQuotation}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cotización
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-2xl">
                {editingQuotation ? "Editar Cotización" : "Nueva Cotización"}
              </DialogTitle>
              <DialogDescription>
                Complete los detalles de la cotización y agregue los servicios requeridos
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
                {/* Información General */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Información General</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2">
                          <FormLabel>Título de la Cotización</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-title" placeholder="Ej: Reparación de plomería" className="text-base" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Row: Cliente + Public General Toggle */}
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <FormLabel className="mb-0">Cliente</FormLabel>
                            <Button
                              type="button"
                              variant={usePublicGeneral ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (!usePublicGeneral) {
                                  setPreviousClientId(field.value || "");
                                  field.onChange("");
                                } else {
                                  field.onChange(previousClientId);
                                }
                                setUsePublicGeneral(!usePublicGeneral);
                              }}
                              data-testid="button-public-general"
                            >
                              {usePublicGeneral ? "Publico en General" : "Publico en General"}
                            </Button>
                          </div>
                          {!usePublicGeneral && (
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                              <FormControl>
                                <SelectTrigger data-testid="select-client">
                                  <SelectValue placeholder="Seleccionar cliente..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {clients.map((client: any) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    {client.firstName} {client.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {usePublicGeneral && (
                            <div className="p-2 bg-primary/10 border border-primary/20 rounded-md text-sm">
                              Cotizacion para publico en general
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Row: Condominio + Unidad */}
                    <FormField
                      control={form.control}
                      name="propertyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condominio</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              const condoId = value === "none" ? "" : value;
                              setSelectedCondominiumId(condoId);
                              field.onChange(condoId);
                              form.setValue("unitId", "");
                            }} 
                            value={selectedCondominiumId || "none"}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-condominium">
                                <SelectValue placeholder="Seleccionar condominio..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Todos los condominios</SelectItem>
                              {condominiums.map((condo: any) => (
                                <SelectItem key={condo.id} value={condo.id}>
                                  {condo.name}
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
                      name="unitId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-unit">
                                <SelectValue placeholder="Seleccionar unidad..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {units.length === 0 && selectedCondominiumId && (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  No hay unidades en este condominio
                                </div>
                              )}
                              {units.map((unit: any) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.unitNumber} {unit.condominium?.name ? `- ${unit.condominium.name}` : ''}
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
                        <FormItem>
                          <FormLabel>Descripción del Trabajo</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="input-description" placeholder="Describa los trabajos a realizar..." rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="solutionDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción de la Solución</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="input-solution-description" placeholder="Describa la solución propuesta..." rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Services Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Servicios</h3>
                      <Badge variant="secondary">{services.length}</Badge>
                    </div>
                    <Button type="button" onClick={addService} data-testid="button-add-service" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Servicio
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {services.map((service, index) => (
                      <Card key={service.id} className="border-l-4 border-l-primary/30">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-sm font-medium text-muted-foreground">Servicio #{index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeService(index)}
                              data-testid={`button-remove-service-${index}`}
                              disabled={services.length === 1}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          
                          <div className="space-y-3">
                            <FormField
                              control={form.control}
                              name={`services.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nombre del Servicio</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid={`input-service-name-${index}`} placeholder="Ej: Instalación de tubería" className="text-base" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`services.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Descripción (Opcional)</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} data-testid={`input-service-description-${index}`} placeholder="Detalles adicionales..." rows={2} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-3 gap-3">
                              <FormField
                                control={form.control}
                                name={`services.${index}.quantity`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Cantidad</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="number"
                                        min="1"
                                        data-testid={`input-quantity-${index}`}
                                        className="text-base"
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
                                  <FormItem>
                                    <FormLabel>Precio Unitario</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        data-testid={`input-unit-price-${index}`}
                                        className="text-base"
                                        placeholder="0.00"
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

                              <div className="flex flex-col justify-between">
                                <FormLabel>Subtotal</FormLabel>
                                <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
                                  <span className="text-base font-semibold">${service.subtotal.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Financials Summary */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Resumen Financiero</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="text-lg font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Tarifa Administrativa:</span>
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
                              className="w-16 h-8 text-center"
                              data-testid="input-admin-fee-percentage"
                            />
                          )}
                        />
                        <span className="text-sm">%</span>
                      </div>
                      <span className="text-lg font-semibold">${adminFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-t-2 border-primary/20">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-2xl font-bold text-primary">${total.toFixed(2)} MXN</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Information */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas Internas</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="input-notes" placeholder="Notas privadas para referencia interna..." rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Términos y Condiciones</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="input-terms" placeholder="Términos específicos de esta cotización..." rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingQuotation(null);
                    }}
                    data-testid="button-cancel"
                    size="lg"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    data-testid="button-submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    size="lg"
                  >
                    {editingQuotation ? "Actualizar" : "Crear"} Cotización
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descripción o número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-quotations"
              />
            </div>

            {/* Filter Button with Popover */}
            <Popover open={filtersExpanded} onOpenChange={setFiltersExpanded}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="flex-shrink-0 relative"
                  data-testid="button-toggle-filters-quotations"
                >
                  <Filter className="h-4 w-4" />
                  {filterStatus !== "all" && (
                    <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      1
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estado</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={filterStatus === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterStatus("all")}
                        data-testid="filter-all"
                      >
                        Todas
                      </Button>
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <Button
                          key={status}
                          variant={filterStatus === status ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterStatus(status)}
                          data-testid={`filter-${status}`}
                        >
                          {config.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* View Mode Toggles */}
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="icon"
              className="flex-shrink-0"
              onClick={() => setViewMode("cards")}
              data-testid="button-view-cards-quotations"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              className="flex-shrink-0"
              onClick={() => setViewMode("table")}
              data-testid="button-view-table-quotations"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quotations Content */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotizaciones</CardTitle>
          <CardDescription>
            {filteredQuotations.length} cotización(es) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          )}
          
          {!isLoading && filteredQuotations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay cotizaciones {filterStatus !== "all" && `con estado "${statusConfig[filterStatus as keyof typeof statusConfig]?.label}"`}
            </div>
          )}
          
          {!isLoading && filteredQuotations.length > 0 && viewMode === "table" && (
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
                              onClick={() => updateStatusMutation.mutate({ id: quotation.id, status: "approved" })}
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
                          onClick={() => downloadPdfMutation.mutate({ quotationId: quotation.id, quotationTitle: quotation.title })}
                          data-testid={`button-download-${quotation.id}`}
                          title="Descargar PDF"
                          disabled={downloadPdfMutation.isPending}
                        >
                          <Download className={`h-4 w-4 ${downloadPdfMutation.isPending ? 'animate-pulse' : ''}`} />
                        </Button>
                        {quotation.status === "approved" && !quotation.convertedTicketId && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => convertToTicketMutation.mutate(quotation.id)}
                            data-testid={`button-convert-ticket-${quotation.id}`}
                            title="Convertir a Ticket"
                            disabled={convertToTicketMutation.isPending}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            <Ticket className={`h-4 w-4 mr-1 ${convertToTicketMutation.isPending ? 'animate-pulse' : ''}`} />
                            Crear Ticket
                          </Button>
                        )}
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
          
          {!isLoading && filteredQuotations.length > 0 && viewMode === "cards" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredQuotations.map((quotation) => {
                const StatusIcon = statusConfig[quotation.status].icon;
                return (
                  <Card key={quotation.id} data-testid={`card-quotation-${quotation.id}`} className="hover-elevate">
                    <CardHeader className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base line-clamp-2">{quotation.title}</CardTitle>
                        <Badge className={statusConfig[quotation.status].color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig[quotation.status].label}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {quotation.description || "Sin descripción"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Cliente:</span>
                          <p className="font-medium truncate">
                            {clients.find((c: any) => c.id === quotation.clientId)?.name || "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <p className="font-bold text-lg">${parseFloat(quotation.total).toFixed(2)}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Fecha:</span>
                          <p className="font-medium">
                            {format(new Date(quotation.createdAt), "dd/MM/yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewQuotation(quotation)}
                          data-testid={`button-view-${quotation.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(quotation)}
                          data-testid={`button-edit-${quotation.id}`}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        {quotation.status === "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: quotation.id, status: "sent" })}
                            data-testid={`button-send-${quotation.id}`}
                          >
                            <Send className="h-3 w-3 mr-1 text-blue-500" />
                            Enviar
                          </Button>
                        )}
                        {quotation.status === "sent" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: quotation.id, status: "approved" })}
                              data-testid={`button-accept-${quotation.id}`}
                            >
                              <Check className="h-3 w-3 mr-1 text-green-500" />
                              Aceptar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: quotation.id, status: "rejected" })}
                              data-testid={`button-reject-${quotation.id}`}
                            >
                              <X className="h-3 w-3 mr-1 text-red-500" />
                              Rechazar
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareMutation.mutate({ id: quotation.id, expiresInDays: 30 })}
                          data-testid={`button-share-${quotation.id}`}
                        >
                          <Link2 className="h-3 w-3 mr-1" />
                          Compartir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPdfMutation.mutate({ quotationId: quotation.id, quotationTitle: quotation.title })}
                          data-testid={`button-download-card-${quotation.id}`}
                          disabled={downloadPdfMutation.isPending}
                        >
                          <Download className={`h-3 w-3 mr-1 ${downloadPdfMutation.isPending ? 'animate-pulse' : ''}`} />
                          {downloadPdfMutation.isPending ? 'Generando...' : 'PDF'}
                        </Button>
                        {quotation.status === "approved" && !quotation.convertedTicketId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => convertToTicketMutation.mutate(quotation.id)}
                            data-testid={`button-convert-ticket-card-${quotation.id}`}
                            disabled={convertToTicketMutation.isPending}
                          >
                            <Ticket className={`h-3 w-3 mr-1 text-orange-500 ${convertToTicketMutation.isPending ? 'animate-pulse' : ''}`} />
                            {convertToTicketMutation.isPending ? 'Convirtiendo...' : 'A Ticket'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(quotation.id)}
                          data-testid={`button-delete-${quotation.id}`}
                        >
                          <Trash2 className="h-3 w-3 mr-1 text-destructive" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
