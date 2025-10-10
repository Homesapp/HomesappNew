import { useState, type DragEvent } from "react";
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
} from "lucide-react";
import { type Lead, insertLeadSchema } from "@shared/schema";
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

const leadFormSchema = insertLeadSchema.extend({
  budget: z.string().optional(),
  email: z.string().optional(), // Email es opcional
  phone: z.string().min(10, "Teléfono es obligatorio"), // WhatsApp obligatorio
});

export default function LeadsKanban() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  
  const form = useForm({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      source: "",
      budget: "",
      notes: "",
      contractDuration: "",
      moveInDate: "",
      pets: "",
      bedrooms: "",
      areaOfInterest: "",
      unitType: undefined,
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

  const handleSubmit = (data: any) => {
    const leadData = {
      ...data,
      budget: data.budget ? data.budget.toString() : null,
      propertyInterests: selectedProperties,
    };
    createLeadMutation.mutate(leadData);
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuente</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="web, referido, etc." data-testid="input-source" />
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
                        <FormLabel>Presupuesto</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-budget" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contractDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración de Contrato</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="6 meses, 1 año" data-testid="input-contract-duration" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="moveInDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Ingreso</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Noviembre, finales de octubre" data-testid="input-move-in-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mascotas</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="un perro, No, Si" data-testid="input-pets" />
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
                          <Input {...field} placeholder="1/2, 2, 3" data-testid="input-bedrooms" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="areaOfInterest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lugar de Interés</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="veleta, aldea Zama" data-testid="input-area-interest" />
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
                          <select 
                            {...field} 
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            data-testid="select-unit-type"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="departamento">Departamento</option>
                            <option value="casa">Casa</option>
                            <option value="estudio">Estudio</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                        {selectedProperties.length > 0
                          ? `${selectedProperties.length} propiedad${selectedProperties.length > 1 ? 'es' : ''} seleccionada${selectedProperties.length > 1 ? 's' : ''}`
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
                                setSelectedProperties((prev) =>
                                  prev.includes(property.id)
                                    ? prev.filter((id) => id !== property.id)
                                    : [...prev, property.id]
                                );
                              }}
                              data-testid={`property-option-${property.id}`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`h-4 w-4 rounded border ${selectedProperties.includes(property.id) ? 'bg-primary border-primary' : 'border-input'}`}>
                                  {selectedProperties.includes(property.id) && (
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
                  {selectedProperties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedProperties.map((propId) => {
                        const property = properties.find((p: any) => p.id === propId);
                        return (
                          <Badge key={propId} variant="secondary" className="text-xs">
                            {property?.title}
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
                  <Button type="submit" disabled={createLeadMutation.isPending} data-testid="button-submit-lead">
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
                                toast({
                                  title: "Función en desarrollo",
                                  description: "La creación de ofertas estará disponible próximamente",
                                });
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
    </div>
  );
}
