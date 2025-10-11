import { useState, useEffect, type DragEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Plus,
  Mail,
  Phone,
  DollarSign,
  User,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  FileCheck,
  HandshakeIcon,
  Eye,
  Send,
  X,
} from "lucide-react";
import { type Lead, insertLeadSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import GenerateOfferLinkDialog from "@/components/GenerateOfferLinkDialog";
import { MultiSelectWithManual } from "@/components/MultiSelectWithManual";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Cell
} from "recharts";

const LEAD_STATUSES = [
  { 
    value: "nuevo", 
    label: "Nuevo", 
    color: "bg-blue-500",
    icon: User,
    description: "Leads recién registrados"
  },
  { 
    value: "contactado", 
    label: "Contactado", 
    color: "bg-purple-500",
    icon: Mail,
    description: "Primer contacto realizado"
  },
  { 
    value: "calificado", 
    label: "Calificado", 
    color: "bg-cyan-500",
    icon: CheckCircle2,
    description: "Lead validado y calificado"
  },
  { 
    value: "cita_agendada", 
    label: "Cita Agendada", 
    color: "bg-yellow-500",
    icon: CalendarCheck,
    description: "Cita programada con el lead"
  },
  { 
    value: "visita_completada", 
    label: "Visita Completada", 
    color: "bg-orange-500",
    icon: CheckCircle2,
    description: "Visita realizada exitosamente"
  },
  { 
    value: "oferta_enviada", 
    label: "Oferta Enviada", 
    color: "bg-amber-500",
    icon: Send,
    description: "Oferta de renta enviada"
  },
  { 
    value: "en_negociacion", 
    label: "En Negociación", 
    color: "bg-indigo-500",
    icon: HandshakeIcon,
    description: "Negociando términos"
  },
  { 
    value: "contrato_firmado", 
    label: "Contrato Firmado", 
    color: "bg-teal-500",
    icon: FileCheck,
    description: "Contrato de renta firmado"
  },
  { 
    value: "ganado", 
    label: "Ganado", 
    color: "bg-green-500",
    icon: CheckCircle2,
    description: "Cliente activo rentando"
  },
  { 
    value: "perdido", 
    label: "Perdido", 
    color: "bg-red-500",
    icon: XCircle,
    description: "Oportunidad perdida"
  },
];

const leadFormSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  email: z.string().optional(),
  phone: z.string().min(10, "El teléfono con lada es obligatorio"),
  budget: z.string().min(1, "El presupuesto es obligatorio"),
  source: z.array(z.string()).default([]),
  contractDuration: z.array(z.string()).default([]),
  moveInDate: z.array(z.string()).default([]),
  bedrooms: z.array(z.string()).default([]),
  zoneOfInterest: z.array(z.string()).default([]),
  unitType: z.array(z.string()).default([]),
  propertyInterests: z.array(z.string()).default([]),
  pets: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("nuevo"),
  registeredById: z.string().optional(),
  validUntil: z.date().optional(),
});

// Opciones predefinidas para los multi-select
const SOURCE_OPTIONS = ["Web", "Referido", "Llamada", "Evento", "Redes Sociales", "WhatsApp"];
const CONTRACT_DURATION_OPTIONS = ["6 meses", "1 año", "2 años", "3 años o más"];
const MOVE_IN_DATE_OPTIONS = ["Inmediato", "Próximo mes", "En 2-3 meses", "Más de 3 meses"];
const BEDROOMS_OPTIONS = ["Studio", "1", "2", "3", "4+"];
const ZONE_OPTIONS = ["Veleta", "Aldea Zama", "Centro", "Región 15", "Región 8", "Playa"];
const UNIT_TYPE_OPTIONS = ["Departamento", "Casa", "Estudio", "PH", "Villa"];

// Función para capitalizar primera letra
const capitalizeFirstLetter = (str: string) => {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function LeadsKanban() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedLeadForOffer, setSelectedLeadForOffer] = useState<Lead | null>(null);
  const [phoneValidation, setPhoneValidation] = useState<{
    isDuplicate: boolean;
    message?: string;
    lead?: any;
    originalSeller?: any;
  } | null>(null);
  const [validatingPhone, setValidatingPhone] = useState(false);
  
  useEffect(() => {
    if (!dialogOpen) {
      form.reset();
    }
  }, [dialogOpen]);
  
  const form = useForm({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      source: [],
      budget: "",
      notes: "",
      contractDuration: [],
      moveInDate: [],
      pets: "",
      bedrooms: [],
      zoneOfInterest: [],
      unitType: [],
      propertyInterests: [],
      status: "nuevo",
    },
  });

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: appointments = [] } = useQuery<any[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: offers = [] } = useQuery<any[]>({
    queryKey: ["/api/offers"],
  });

  const { data: properties = [] } = useQuery<any[]>({
    queryKey: ["/api/properties/search"],
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/leads", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Lead creado exitosamente" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      const errorData = error?.response?.data || error;
      if (errorData.isDuplicate) {
        // Lead duplicado - mostrar mensaje detallado
        toast({
          title: "Lead duplicado",
          description: errorData.message,
          variant: "destructive",
        });
      } else {
        toast({ 
          title: "Error al crear lead", 
          description: errorData.message || "Inténtalo de nuevo",
          variant: "destructive" 
        });
      }
    },
  });

  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/leads/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Estado actualizado" });
    },
    onError: () => {
      toast({ title: "Error al actualizar estado", variant: "destructive" });
    },
  });

  const handleDragStart = (e: DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    updateLeadStatusMutation.mutate({ id: leadId, status: newStatus });
  };

  // Validar teléfono en tiempo real
  const validatePhone = async (phone: string) => {
    if (!phone || phone.length < 10) {
      setPhoneValidation(null);
      return;
    }

    setValidatingPhone(true);
    try {
      const response = await fetch(`/api/leads/validate-phone/${encodeURIComponent(phone)}`);
      const data = await response.json();
      
      if (data.isDuplicate) {
        setPhoneValidation(data);
      } else {
        setPhoneValidation(null);
      }
    } catch (error) {
      console.error("Error validating phone:", error);
      setPhoneValidation(null);
    } finally {
      setValidatingPhone(false);
    }
  };

  const handleSubmit = (data: any) => {
    // Auto-formateo
    const formattedData = {
      ...data,
      firstName: capitalizeFirstLetter(data.firstName.trim()),
      lastName: capitalizeFirstLetter(data.lastName.trim()),
      email: data.email ? data.email.toLowerCase().trim() : undefined,
      budget: data.budget ? data.budget.toString() : null,
    };
    createLeadMutation.mutate(formattedData);
  };

  const formatCurrency = (value: string) => {
    if (!value) return "Sin presupuesto";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter((lead) => lead.status === status);
  };

  const getLeadAppointments = (leadId: string) => {
    return appointments.filter((apt: any) => apt.clientId === leadId);
  };

  const getLeadOffers = (leadId: string) => {
    return offers.filter((offer: any) => offer.clientId === leadId);
  };

  // Calculate funnel metrics
  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 
    ? ((getLeadsByStatus("ganado").length / totalLeads) * 100).toFixed(1)
    : "0.0";
  
  const activeLeads = leads.filter(l => 
    !["ganado", "perdido"].includes(l.status)
  ).length;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with metrics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">CRM - Pipeline de Leads</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu flujo de prospectos y rentas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-lead" size="default">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Lead</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Campos obligatorios */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-first-name" placeholder="Nombre" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-last-name" placeholder="Apellido" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono con lada *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            data-testid="input-phone" 
                            placeholder="+52 984 123 4567"
                            onChange={(e) => {
                              field.onChange(e);
                              validatePhone(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presupuesto *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-budget" placeholder="15000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Alerta de duplicado */}
                {phoneValidation?.isDuplicate && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="space-y-2">
                      <p className="font-semibold">{phoneValidation.message}</p>
                      {phoneValidation.lead && (
                        <div className="text-sm space-y-1">
                          <p><strong>Nombre:</strong> {phoneValidation.lead.firstName} {phoneValidation.lead.lastName}</p>
                          <p><strong>Email:</strong> {phoneValidation.lead.email || "No registrado"}</p>
                          <p><strong>Presupuesto:</strong> ${phoneValidation.lead.budget}</p>
                          <p><strong>Registrado:</strong> {new Date(phoneValidation.lead.registeredAt).toLocaleDateString('es-MX')}</p>
                        </div>
                      )}
                      {phoneValidation.originalSeller && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (phoneValidation.originalSeller?.email) {
                                window.location.href = `mailto:${phoneValidation.originalSeller.email}`;
                              }
                            }}
                            data-testid="button-contact-seller"
                          >
                            Contactar a {phoneValidation.originalSeller.firstName}
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Campos opcionales */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (opcional)</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email" placeholder="ejemplo@email.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Multi-select fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuente</FormLabel>
                        <FormControl>
                          <MultiSelectWithManual
                            options={SOURCE_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Seleccionar fuente..."
                            data-testid="select-source"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración de Contrato</FormLabel>
                        <FormControl>
                          <MultiSelectWithManual
                            options={CONTRACT_DURATION_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Seleccionar duración..."
                            data-testid="select-contract-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="moveInDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Ingreso</FormLabel>
                        <FormControl>
                          <MultiSelectWithManual
                            options={MOVE_IN_DATE_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Seleccionar fecha..."
                            data-testid="select-move-in-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recámaras</FormLabel>
                        <FormControl>
                          <MultiSelectWithManual
                            options={BEDROOMS_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Seleccionar recámaras..."
                            data-testid="select-bedrooms"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="zoneOfInterest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zona de Interés</FormLabel>
                        <FormControl>
                          <MultiSelectWithManual
                            options={ZONE_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Seleccionar zona..."
                            data-testid="select-zone-interest"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Unidad</FormLabel>
                        <FormControl>
                          <MultiSelectWithManual
                            options={UNIT_TYPE_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Seleccionar tipo..."
                            data-testid="select-unit-type"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="pets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mascotas (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="un perro, No, Sí" data-testid="input-pets" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <FormLabel>Propiedades de Interés</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                        data-testid="button-select-properties"
                      >
                        {form.watch("propertyInterests")?.length > 0
                          ? `${form.watch("propertyInterests").length} propiedad${form.watch("propertyInterests").length > 1 ? 'es' : ''} seleccionada${form.watch("propertyInterests").length > 1 ? 's' : ''}`
                          : "Seleccionar propiedades..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar propiedad..." />
                        <CommandEmpty>No se encontraron propiedades.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {properties.map((property: any) => (
                            <CommandItem
                              key={property.id}
                              onSelect={() => {
                                const currentValues = form.getValues("propertyInterests") || [];
                                const isSelected = currentValues.includes(property.id);
                                form.setValue(
                                  "propertyInterests",
                                  isSelected
                                    ? currentValues.filter((id: string) => id !== property.id)
                                    : [...currentValues, property.id]
                                );
                              }}
                              data-testid={`property-option-${property.id}`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`h-4 w-4 rounded border ${(form.watch("propertyInterests") || []).includes(property.id) ? 'bg-primary border-primary' : 'border-input'}`}>
                                  {(form.watch("propertyInterests") || []).includes(property.id) && (
                                    <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                                  )}
                                </div>
                                <span>{property.title}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {(form.watch("propertyInterests")?.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {form.watch("propertyInterests").map((propId: string) => {
                        const property = properties.find((p: any) => p.id === propId);
                        return (
                          <Badge 
                            key={propId} 
                            variant="secondary" 
                            className="text-xs gap-1"
                            data-testid={`badge-property-${propId}`}
                          >
                            {property?.title || propId}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => {
                                const currentValues = form.getValues("propertyInterests") || [];
                                form.setValue("propertyInterests", currentValues.filter((id: string) => id !== propId));
                              }}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createLeadMutation.isPending || phoneValidation?.isDuplicate} 
                    data-testid="button-submit-lead"
                  >
                    {createLeadMutation.isPending ? "Creando..." : "Crear Lead"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="metric-total-leads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-total-leads">{totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Todos los prospectos
            </p>
          </CardContent>
        </Card>

        <Card data-testid="metric-active-leads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-active-leads">{activeLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              En proceso
            </p>
          </CardContent>
        </Card>

        <Card data-testid="metric-won-leads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="value-won-leads">
              {getLeadsByStatus("ganado").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Contratos cerrados
            </p>
          </CardContent>
        </Card>

        <Card data-testid="metric-conversion-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-conversion-rate">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Leads a contratos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Funnel Visualization */}
      <Card data-testid="sales-funnel-chart">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Embudo de Ventas - Distribución por Etapa
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Visualización del flujo de leads a través del pipeline
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              leads: {
                label: "Leads",
              },
            }}
            className="h-[300px] w-full"
          >
            <BarChart
              data={LEAD_STATUSES.map((status) => ({
                name: status.label,
                value: getLeadsByStatus(status.value).length,
                color: status.color.replace('bg-', ''),
              }))}
              layout="horizontal"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category"
                width={120}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {LEAD_STATUSES.map((status, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          
          {/* Funnel Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="space-y-1" data-testid="funnel-stat-calificado-to-cita">
              <p className="text-xs text-muted-foreground">Calificado → Cita</p>
              <p className="text-lg font-semibold">
                {getLeadsByStatus("calificado").length > 0
                  ? ((getLeadsByStatus("cita_agendada").length / getLeadsByStatus("calificado").length) * 100).toFixed(0)
                  : "0"}%
              </p>
            </div>
            <div className="space-y-1" data-testid="funnel-stat-cita-to-visita">
              <p className="text-xs text-muted-foreground">Cita → Visita Completada</p>
              <p className="text-lg font-semibold">
                {getLeadsByStatus("cita_agendada").length > 0
                  ? ((getLeadsByStatus("visita_completada").length / getLeadsByStatus("cita_agendada").length) * 100).toFixed(0)
                  : "0"}%
              </p>
            </div>
            <div className="space-y-1" data-testid="funnel-stat-visita-to-oferta">
              <p className="text-xs text-muted-foreground">Visita → Oferta</p>
              <p className="text-lg font-semibold">
                {getLeadsByStatus("visita_completada").length > 0
                  ? ((getLeadsByStatus("oferta_enviada").length / getLeadsByStatus("visita_completada").length) * 100).toFixed(0)
                  : "0"}%
              </p>
            </div>
            <div className="space-y-1" data-testid="funnel-stat-contrato-to-ganado">
              <p className="text-xs text-muted-foreground">Contrato → Ganado</p>
              <p className="text-lg font-semibold text-green-600">
                {getLeadsByStatus("contrato_firmado").length > 0
                  ? ((getLeadsByStatus("ganado").length / getLeadsByStatus("contrato_firmado").length) * 100).toFixed(0)
                  : "0"}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {LEAD_STATUSES.map((status) => {
          const StatusIcon = status.icon;
          const leadsInStatus = getLeadsByStatus(status.value);
          
          return (
            <div
              key={status.value}
              className="flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status.value)}
              data-testid={`column-${status.value}`}
            >
              <Card className="flex-1">
                <CardHeader 
                  className={`${status.color} text-white rounded-t-lg`} 
                  data-testid={`header-${status.value}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      <CardTitle className="text-sm font-medium" data-testid={`text-status-${status.value}`}>
                        {status.label}
                      </CardTitle>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-white/20 text-white border-0" 
                      data-testid={`badge-count-${status.value}`}
                    >
                      {leadsInStatus.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/80 mt-1">{status.description}</p>
                </CardHeader>
                <CardContent className="p-3 space-y-3 min-h-[500px]" data-testid={`content-${status.value}`}>
                  {leadsInStatus.map((lead) => {
                    const leadAppointments = getLeadAppointments(lead.id);
                    const leadOffers = getLeadOffers(lead.id);
                    const nextAppointment = leadAppointments
                      .filter((apt: any) => new Date(apt.date) > new Date())
                      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

                    return (
                      <Card
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="cursor-move hover-elevate active-elevate-2"
                        data-testid={`card-lead-${lead.id}`}
                      >
                        <CardContent className="p-4 space-y-3">
                          {/* Lead Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm" data-testid={`text-lead-name-${lead.id}`}>
                                {lead.firstName} {lead.lastName}
                              </div>
                              {lead.emailVerified && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  Verificado
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                            {lead.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                            {lead.budget && (
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="h-3 w-3 flex-shrink-0" />
                                <span className="font-medium">{formatCurrency(lead.budget)}</span>
                              </div>
                            )}
                          </div>

                          {/* Activity Indicators */}
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                            {leadAppointments.length > 0 && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Calendar className="h-3 w-3" />
                                {leadAppointments.length} {leadAppointments.length === 1 ? 'cita' : 'citas'}
                              </Badge>
                            )}
                            {leadOffers.length > 0 && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <FileText className="h-3 w-3" />
                                {leadOffers.length} {leadOffers.length === 1 ? 'oferta' : 'ofertas'}
                              </Badge>
                            )}
                          </div>

                          {/* Next Appointment */}
                          {nextAppointment && (
                            <div className="pt-2 border-t">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  Próxima cita: {format(new Date(nextAppointment.date), "d MMM, HH:mm", { locale: es })}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Notes Preview */}
                          {lead.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t">
                              {lead.notes}
                            </p>
                          )}

                          {/* Source */}
                          {lead.source && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                              <User className="h-3 w-3" />
                              <span className="capitalize">Fuente: {lead.source}</span>
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="flex flex-wrap gap-2 pt-3 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/seller/appointments?leadId=${lead.id}&leadName=${encodeURIComponent(`${lead.firstName} ${lead.lastName}`)}`);
                              }}
                              data-testid={`button-schedule-appointment-${lead.id}`}
                            >
                              <CalendarCheck className="h-3 w-3" />
                              Agendar Cita
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLeadForOffer(lead);
                                setOfferDialogOpen(true);
                              }}
                              data-testid={`button-create-offer-${lead.id}`}
                            >
                              <Send className="h-3 w-3" />
                              Crear Oferta
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({
                                  title: "Función en desarrollo",
                                  description: "La vista detallada del lead estará disponible próximamente",
                                });
                              }}
                              data-testid={`button-view-details-${lead.id}`}
                            >
                              <Eye className="h-3 w-3" />
                              Ver Detalles
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Generate Offer Link Dialog */}
      {selectedLeadForOffer && (
        <GenerateOfferLinkDialog
          open={offerDialogOpen}
          onOpenChange={setOfferDialogOpen}
          leadInfo={{
            name: `${selectedLeadForOffer.firstName} ${selectedLeadForOffer.lastName}`,
            email: selectedLeadForOffer.email || "",
            phone: selectedLeadForOffer.phone || "",
          }}
        />
      )}
    </div>
  );
}
