import { useState, useEffect, type DragEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { type Lead, insertLeadSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUsersByRole } from "@/hooks/useUsers";
import GenerateOfferLinkDialog from "@/components/GenerateOfferLinkDialog";
import { MultiSelectWithManual } from "@/components/MultiSelectWithManual";
import MultiStepLeadForm from "@/components/MultiStepLeadForm";
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
  const [showMetrics, setShowMetrics] = useState(true);
  const [showFunnel, setShowFunnel] = useState(true);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<Lead | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
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

  const { data: sellers = [] } = useUsersByRole("seller");

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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Lead</DialogTitle>
            </DialogHeader>
            <MultiStepLeadForm
              onSubmit={handleSubmit}
              isPending={createLeadMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Métricas Generales</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowMetrics(!showMetrics)}
          data-testid="button-toggle-metrics"
        >
          {showMetrics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      {showMetrics && (
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
      )}

      {/* Sales Funnel Visualization */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Embudo de Ventas</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowFunnel(!showFunnel)}
          data-testid="button-toggle-funnel"
        >
          {showFunnel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      {showFunnel && (
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
      )}

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
                <CardContent className="p-3 space-y-3 max-h-[600px] overflow-y-auto" data-testid={`content-${status.value}`}>
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
                                setSelectedLeadDetails(lead);
                                setDetailsDialogOpen(true);
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

      {/* Lead Details Dialog */}
      {selectedLeadDetails && (
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-lead-details">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Detalles del Lead: {selectedLeadDetails.firstName} {selectedLeadDetails.lastName}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
              <div className="space-y-6">
                {/* Información General */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información General
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                      <p className="font-medium" data-testid="text-created-at">
                        {format(new Date(selectedLeadDetails.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedLeadDetails.email || "No proporcionado"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{selectedLeadDetails.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Presupuesto</p>
                      <p className="font-medium">{formatCurrency(selectedLeadDetails.budget)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Válido Hasta</p>
                      <p className="font-medium">
                        {format(new Date(selectedLeadDetails.validUntil), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tiempo para Liberación</p>
                      <p className="font-medium">
                        {Math.max(0, Math.ceil((new Date(selectedLeadDetails.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} días
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Vendedor Asignado */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Vendedor Asignado
                  </h3>
                  <div>
                    <p className="text-sm text-muted-foreground">Registrado por:</p>
                    <p className="font-medium">
                      {sellers?.find((s: any) => s.id === selectedLeadDetails.registeredById)?.fullName || "No asignado"}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Estado Actual */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Estado Actual</h3>
                  <div className="flex items-center gap-4">
                    <Select
                      value={selectedLeadDetails.status}
                      onValueChange={(newStatus) => {
                        updateLeadStatusMutation.mutate({ 
                          id: selectedLeadDetails.id, 
                          status: newStatus 
                        });
                        setSelectedLeadDetails({ ...selectedLeadDetails, status: newStatus as any });
                      }}
                    >
                      <SelectTrigger className="w-[280px]" data-testid="select-lead-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Preferencias del Lead */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Preferencias</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedLeadDetails.bedrooms && selectedLeadDetails.bedrooms.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Recámaras</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedLeadDetails.bedrooms.map((bed, i) => (
                            <Badge key={i} variant="secondary">{bed}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedLeadDetails.zoneOfInterest && selectedLeadDetails.zoneOfInterest.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Zonas de Interés</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedLeadDetails.zoneOfInterest.map((zone, i) => (
                            <Badge key={i} variant="secondary">{zone}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedLeadDetails.contractDuration && selectedLeadDetails.contractDuration.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Duración del Contrato</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedLeadDetails.contractDuration.map((dur, i) => (
                            <Badge key={i} variant="secondary">{dur}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedLeadDetails.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notas</p>
                      <p className="mt-1 p-3 bg-muted rounded-md">{selectedLeadDetails.notes}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Citas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Citas ({getLeadAppointments(selectedLeadDetails.id).length})
                  </h3>
                  {getLeadAppointments(selectedLeadDetails.id).length > 0 ? (
                    <div className="space-y-2">
                      {getLeadAppointments(selectedLeadDetails.id).map((apt: any) => (
                        <Card key={apt.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <p className="font-medium">{format(new Date(apt.date), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</p>
                                <p className="text-sm text-muted-foreground">
                                  Tipo: {apt.type === "rental_showing" ? "Visita de Renta" : "Otra"}
                                </p>
                                {apt.propertyId && (
                                  <p className="text-sm text-muted-foreground">
                                    Propiedad: {getPropertyTitle(properties.find((p: any) => p.id === apt.propertyId)) || "N/A"}
                                  </p>
                                )}
                              </div>
                              <Badge variant={new Date(apt.date) > new Date() ? "default" : "secondary"}>
                                {new Date(apt.date) > new Date() ? "Próxima" : "Completada"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay citas registradas</p>
                  )}
                </div>

                <Separator />

                {/* Ofertas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Ofertas ({getLeadOffers(selectedLeadDetails.id).length})
                  </h3>
                  {getLeadOffers(selectedLeadDetails.id).length > 0 ? (
                    <div className="space-y-2">
                      {getLeadOffers(selectedLeadDetails.id).map((offer: any) => (
                        <Card key={offer.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {format(new Date(offer.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Estado: {offer.status}
                                </p>
                              </div>
                              <Badge>{offer.status}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay ofertas enviadas</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
