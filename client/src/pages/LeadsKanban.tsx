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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  Edit,
  Trash2,
  Download,
  MessageCircle,
  MoreVertical,
  Search,
  Filter,
  List,
  LayoutGrid,
} from "lucide-react";
import { type Lead, insertLeadSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUsersByRole } from "@/hooks/useUsers";
import GenerateOfferLinkDialog from "@/components/GenerateOfferLinkDialog";
import GenerateRentalFormLinkDialog from "@/components/GenerateRentalFormLinkDialog";
import { MultiSelectWithManual } from "@/components/MultiSelectWithManual";
import MultiStepLeadForm from "@/components/MultiStepLeadForm";
import { getPropertyTitle } from "@/lib/propertyHelpers";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useMemo } from "react";
import { HelpPanel } from "@/components/OnboardingSystem";

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
const SOURCE_OPTIONS = ["Web", "Referido", "Llamada", "Evento", "Redes Sociales", "WhatsApp", "Tokko Broker", "EasyBroker"];
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
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sellerFilter, setSellerFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [leadToReassign, setLeadToReassign] = useState<Lead | null>(null);
  const [selectedNewSeller, setSelectedNewSeller] = useState<string>("");
  const [showAppointmentsHistory, setShowAppointmentsHistory] = useState(false);
  const [showOfferedProperties, setShowOfferedProperties] = useState(false);
  
  useEffect(() => {
    if (!dialogOpen) {
      form.reset();
      setEditingLead(null);
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

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "master" || currentUser?.role === "admin_jr";

  const getSellerName = (registeredById: string) => {
    const seller = sellers.find((s: any) => s.id === registeredById);
    return seller?.name || "Vendedor desconocido";
  };

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${variables.id}/history`] });
      toast({ title: "Estado actualizado" });
    },
    onError: () => {
      toast({ title: "Error al actualizar estado", variant: "destructive" });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/leads/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Lead actualizado exitosamente" });
      setDialogOpen(false);
      setEditingLead(null);
    },
    onError: (error: any) => {
      const errorData = error?.response?.data || error;
      toast({ 
        title: "Error al actualizar lead", 
        description: errorData.message || "Inténtalo de nuevo",
        variant: "destructive" 
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Lead eliminado exitosamente" });
      setDetailsDialogOpen(false);
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error al eliminar lead", variant: "destructive" });
    },
  });

  const reassignLeadMutation = useMutation({
    mutationFn: async ({ leadId, newSellerId }: { leadId: string; newSellerId: string }) => {
      await apiRequest("PATCH", `/api/leads/${leadId}/reassign`, { newSellerId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${variables.leadId}/appointments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${variables.leadId}/offered-properties`] });
      toast({ title: "Lead reasignado exitosamente" });
      setReassignDialogOpen(false);
      setSelectedNewSeller("");
      setDetailsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al reasignar lead", 
        description: error?.response?.data?.message || "Inténtalo de nuevo",
        variant: "destructive" 
      });
    },
  });

  // Query para obtener historial completo de citas del lead seleccionado
  const { data: leadAppointmentsHistory = [], isLoading: loadingAppointments } = useQuery({
    queryKey: [`/api/leads/${selectedLeadDetails?.id}/appointments`],
    enabled: !!selectedLeadDetails?.id && detailsDialogOpen,
  });

  // Query para obtener propiedades ofrecidas al lead seleccionado
  const { data: leadOfferedProperties = [], isLoading: loadingOfferedProperties } = useQuery({
    queryKey: [`/api/leads/${selectedLeadDetails?.id}/offered-properties`],
    enabled: !!selectedLeadDetails?.id && detailsDialogOpen,
  });

  // Query para obtener el historial de actividades del lead
  const { data: leadHistory = [], isLoading: loadingHistory } = useQuery<any[]>({
    queryKey: [`/api/leads/${selectedLeadDetails?.id}/history`],
    enabled: !!selectedLeadDetails?.id && detailsDialogOpen,
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
    
    if (editingLead) {
      updateLeadMutation.mutate({ id: editingLead.id, data: formattedData });
    } else {
      createLeadMutation.mutate(formattedData);
    }
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

  // Filtered leads based on search and filters
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search filter
      const searchLower = searchText.toLowerCase();
      const matchesSearch = !searchText || 
        lead.firstName.toLowerCase().includes(searchLower) ||
        lead.lastName.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.phone.includes(searchText);

      // Status filter
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(lead.status);

      // Seller filter (only for admin)
      const matchesSeller = !sellerFilter || 
        lead.registeredById === sellerFilter || 
        lead.assignedToId === sellerFilter;

      // Date filter
      const leadDate = new Date(lead.createdAt);
      const today = new Date();
      let matchesDate = true;
      
      if (dateFilter === "today") {
        matchesDate = leadDate.toDateString() === today.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = leadDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = leadDate >= monthAgo;
      }

      return matchesSearch && matchesStatus && matchesSeller && matchesDate;
    });
  }, [leads, searchText, statusFilter, sellerFilter, dateFilter]);

  // Export to CSV function
  const exportToCSV = () => {
    const csvData = filteredLeads.map(lead => ({
      Nombre: `${lead.firstName} ${lead.lastName}`,
      Email: lead.email || '',
      Teléfono: lead.phone,
      Presupuesto: lead.budget,
      Estado: LEAD_STATUSES.find(s => s.value === lead.status)?.label || lead.status,
      Fuente: lead.source?.join(', ') || '',
      'Asignado a': lead.assignedToId ? getSellerName(lead.assignedToId) : 'Sin asignar',
      'Registrado por': getSellerName(lead.registeredById),
      'Fecha de creación': format(new Date(lead.createdAt), 'dd/MM/yyyy', { locale: es }),
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

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
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">CRM - Pipeline de Leads</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tu flujo de prospectos y rentas
            </p>
          </div>
          <HelpPanel helpKey="seller-leads" />
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
              <DialogTitle>{editingLead ? "Editar Lead" : "Crear Nuevo Lead"}</DialogTitle>
            </DialogHeader>
            <MultiStepLeadForm
              onSubmit={handleSubmit}
              isPending={createLeadMutation.isPending || updateLeadMutation.isPending}
              defaultValues={editingLead ? {
                firstName: editingLead.firstName,
                lastName: editingLead.lastName,
                email: editingLead.email || "",
                phone: editingLead.phone,
                budget: editingLead.budget || "",
                source: editingLead.source || [],
                contractDuration: editingLead.contractDuration || [],
                moveInDate: editingLead.moveInDate || [],
                pets: editingLead.pets || "",
                bedrooms: editingLead.bedrooms || [],
                zoneOfInterest: editingLead.zoneOfInterest || [],
                unitType: editingLead.unitType || [],
                propertyInterests: editingLead.propertyInterests || [],
                notes: editingLead.notes || "",
                status: editingLead.status,
              } : undefined}
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

      {/* Quick Actions for Sellers */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-xs sm:text-sm"
              onClick={() => {
                setDialogOpen(true);
              }}
              data-testid="quick-action-new-lead"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Nuevo Lead</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-xs sm:text-sm"
              onClick={() => {
                setDateFilter("today");
                setSearchText("");
                setStatusFilter([]);
                setSellerFilter("");
                setViewMode("table");
              }}
              data-testid="quick-action-today-leads"
            >
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Hoy ({leads.filter(l => {
                const today = new Date();
                const leadDate = new Date(l.createdAt);
                return leadDate.toDateString() === today.toDateString();
              }).length})</span>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-xs sm:text-sm"
              onClick={() => {
                setSearchText("");
                setSellerFilter("");
                setDateFilter("all");
                setStatusFilter(["nuevo", "contactado"]);
                setViewMode("table");
              }}
              data-testid="quick-action-pending-contact"
            >
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Pendientes ({getLeadsByStatus("nuevo").length + getLeadsByStatus("contactado").length})</span>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-xs sm:text-sm"
              onClick={() => {
                setSearchText("");
                setSellerFilter("");
                setDateFilter("all");
                setStatusFilter(["cita_agendada"]);
                setViewMode("table");
              }}
              data-testid="quick-action-upcoming-appointments"
            >
              <CalendarCheck className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Citas ({getLeadsByStatus("cita_agendada").length})</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "kanban" | "table")} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList data-testid="view-mode-tabs">
            <TabsTrigger value="kanban" data-testid="tab-kanban">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="table" data-testid="tab-table">
              <List className="h-4 w-4 mr-2" />
              Tabla
            </TabsTrigger>
          </TabsList>
          
          {viewMode === "table" && (
            <Button onClick={exportToCSV} variant="outline" size="sm" data-testid="button-export-csv">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>

        <TabsContent value="kanban" className="mt-0">
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
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {lead.emailVerified && (
                                  <Badge variant="secondary" className="text-xs">
                                    Verificado
                                  </Badge>
                                )}
                                {isAdmin && (
                                  <Badge variant="outline" className="text-xs gap-1" data-testid={`badge-seller-${lead.id}`}>
                                    <User className="h-3 w-3" />
                                    {getSellerName(lead.registeredById)}
                                  </Badge>
                                )}
                              </div>
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
                            {lead.status === "en_negociacion" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLeadForOffer(lead);
                                  setOfferDialogOpen(true);
                                }}
                                data-testid={`button-send-rental-form-${lead.id}`}
                              >
                                <FileText className="h-3 w-3" />
                                Enviar Formato de Renta
                              </Button>
                            ) : (
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
                            )}
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
      </TabsContent>

      <TabsContent value="table" className="mt-0">
        {/* Filter Section */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-leads"
                  />
                </div>
              </div>
              
              <Select
                value={statusFilter.length > 0 ? statusFilter.join(',') : "all"}
                onValueChange={(value) => setStatusFilter(value === "all" ? [] : value.split(','))}
              >
                <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {LEAD_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isAdmin && (
                <Select value={sellerFilter || "all"} onValueChange={(value) => setSellerFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-full md:w-[200px]" data-testid="select-seller-filter">
                    <SelectValue placeholder="Filtrar por vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los vendedores</SelectItem>
                    {sellers.map((seller: any) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  setSearchText("");
                  setStatusFilter([]);
                  setSellerFilter("");
                  setDateFilter("all");
                }}
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Mostrando {filteredLeads.length} de {leads.length} leads
            </div>
          </CardContent>
        </Card>

        {/* Table View */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Presupuesto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fuente</TableHead>
                  {isAdmin && <TableHead>Asignado a</TableHead>}
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium" data-testid={`text-lead-name-${lead.id}`}>
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(lead.createdAt), 'dd MMM yyyy', { locale: es })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => window.location.href = `tel:${lead.phone}`}
                            data-testid={`button-call-${lead.id}`}
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                          <span className="text-sm">{lead.phone}</span>
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => window.location.href = `mailto:${lead.email}`}
                              data-testid={`button-email-${lead.id}`}
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                            <span className="text-sm">{lead.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank')}
                            data-testid={`button-whatsapp-${lead.id}`}
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                          <span className="text-sm">WhatsApp</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(lead.budget)}</TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(value) => 
                          updateLeadStatusMutation.mutate({ id: lead.id, status: value })
                        }
                      >
                        <SelectTrigger className="w-[180px]" data-testid={`select-status-${lead.id}`}>
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
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{lead.source?.join(', ') || '-'}</div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="text-sm">
                          {lead.assignedToId ? getSellerName(lead.assignedToId) : 'Sin asignar'}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-actions-${lead.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingLead(lead);
                              setDialogOpen(true);
                            }}
                            data-testid={`menu-edit-${lead.id}`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLeadDetails(lead);
                              setDetailsDialogOpen(true);
                            }}
                            data-testid={`menu-details-${lead.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLeadForOffer(lead);
                              setOfferDialogOpen(true);
                            }}
                            data-testid={`menu-send-offer-${lead.id}`}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Enviar Oferta
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setLeadToReassign(lead);
                                  setReassignDialogOpen(true);
                                }}
                                data-testid={`menu-reassign-${lead.id}`}
                              >
                                <User className="h-4 w-4 mr-2" />
                                Reasignar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setLeadToDelete(lead);
                                  setDeleteDialogOpen(true);
                                }}
                                data-testid={`menu-delete-${lead.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>

      {/* Generate Offer Link Dialog or Rental Form Dialog */}
      {selectedLeadForOffer && (
        selectedLeadForOffer.status === "en_negociacion" ? (
          <GenerateRentalFormLinkDialog
            open={offerDialogOpen}
            onOpenChange={setOfferDialogOpen}
            leadId={selectedLeadForOffer.id}
            leadInfo={{
              name: `${selectedLeadForOffer.firstName} ${selectedLeadForOffer.lastName}`,
              email: selectedLeadForOffer.email || "",
              phone: selectedLeadForOffer.phone || "",
            }}
          />
        ) : (
          <GenerateOfferLinkDialog
            open={offerDialogOpen}
            onOpenChange={setOfferDialogOpen}
            leadId={selectedLeadForOffer.id}
            leadInfo={{
              name: `${selectedLeadForOffer.firstName} ${selectedLeadForOffer.lastName}`,
              email: selectedLeadForOffer.email || "",
              phone: selectedLeadForOffer.phone || "",
            }}
          />
        )
      )}

      {/* Lead Details Dialog */}
      {selectedLeadDetails && (
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-lead-details">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <DialogTitle className="text-2xl">
                  Detalles del Lead: {selectedLeadDetails.firstName} {selectedLeadDetails.lastName}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingLead(selectedLeadDetails);
                      setDetailsDialogOpen(false);
                      setDialogOpen(true);
                    }}
                    data-testid="button-edit-lead"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  {isAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setLeadToReassign(selectedLeadDetails);
                          setReassignDialogOpen(true);
                        }}
                        data-testid="button-reassign-lead"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Reasignar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setLeadToDelete(selectedLeadDetails);
                          setDeleteDialogOpen(true);
                        }}
                        data-testid="button-delete-lead"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>
              </div>
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
                      {(() => {
                        const seller = sellers?.find((s: any) => s.id === selectedLeadDetails.registeredById);
                        return seller ? `${seller.firstName} ${seller.lastName}` : "No asignado";
                      })()}
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

                {/* Propiedades de Interés */}
                {selectedLeadDetails.propertyInterests && selectedLeadDetails.propertyInterests.length > 0 && (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Propiedades de Interés ({selectedLeadDetails.propertyInterests.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedLeadDetails.propertyInterests.map((propId: string) => {
                          const property = properties.find((p: any) => p.id === propId);
                          return property ? (
                            <Card key={propId}>
                              <CardContent className="p-4">
                                <p className="font-medium">{getPropertyTitle(property)}</p>
                                {property.monthlyRent && (
                                  <p className="text-sm text-muted-foreground">
                                    Renta: {formatCurrency(property.monthlyRent)}/mes
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ) : null;
                        })}
                      </div>
                    </div>

                    <Separator />
                  </>
                )}

                {/* Historial de Citas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Historial de Citas {loadingAppointments ? "" : `(${leadAppointmentsHistory.length})`}
                  </h3>
                  {loadingAppointments ? (
                    <p className="text-sm text-muted-foreground">Cargando citas...</p>
                  ) : leadAppointmentsHistory.length > 0 ? (
                    <div className="space-y-2">
                      {leadAppointmentsHistory.map((apt: any) => (
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
                                {apt.status && (
                                  <p className="text-sm text-muted-foreground">
                                    Estado: {apt.status}
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

                <Separator />

                {/* Historial de Actividades */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Historial de Actividades {loadingHistory ? "" : `(${leadHistory.length})`}
                  </h3>
                  {loadingHistory ? (
                    <p className="text-sm text-muted-foreground">Cargando historial...</p>
                  ) : leadHistory.length > 0 ? (
                    <div className="space-y-2">
                      {leadHistory.map((entry: any) => (
                        <Card key={entry.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1 flex-1">
                                <p className="font-medium">{entry.description}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>
                                    {entry.user
                                      ? `${entry.user.firstName} ${entry.user.lastName}`
                                      : "Sistema"}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {format(new Date(entry.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                                  </span>
                                </div>
                                {entry.field && (
                                  <p className="text-sm text-muted-foreground">
                                    {entry.oldValue && entry.newValue && (
                                      <>
                                        <span className="line-through">{entry.oldValue}</span>
                                        {" → "}
                                        <span className="font-medium">{entry.newValue}</span>
                                      </>
                                    )}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline">
                                {entry.action === "status_changed" ? "Cambio de Estado" : 
                                 entry.action === "created" ? "Creación" : 
                                 entry.action === "updated" ? "Actualización" : 
                                 entry.action}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay actividades registradas</p>
                  )}
                </div>

                {isAdmin && (
                  <>
                    <Separator />
                    
                    {/* Propiedades Ofrecidas (Solo Admin) */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Propiedades Ofrecidas {loadingOfferedProperties ? "" : `(${leadOfferedProperties.length})`}
                      </h3>
                      {loadingOfferedProperties ? (
                        <p className="text-sm text-muted-foreground">Cargando propiedades ofrecidas...</p>
                      ) : leadOfferedProperties.length > 0 ? (
                        <div className="space-y-2">
                          {leadOfferedProperties.map((prop: any) => (
                            <Card key={prop.id}>
                              <CardContent className="p-4">
                                <div className="space-y-1">
                                  <p className="font-medium">{getPropertyTitle(prop)}</p>
                                  {prop.monthlyRent && (
                                    <p className="text-sm text-muted-foreground">
                                      Renta: {formatCurrency(prop.monthlyRent)}/mes
                                    </p>
                                  )}
                                  {prop.offeredAt && (
                                    <p className="text-sm text-muted-foreground">
                                      Ofrecida: {format(new Date(prop.offeredAt), "d 'de' MMMM, yyyy", { locale: es })}
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No se han ofrecido propiedades a este lead</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el lead de{" "}
              <strong>{leadToDelete?.firstName} {leadToDelete?.lastName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (leadToDelete) {
                  deleteLeadMutation.mutate(leadToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reassign Lead Dialog */}
      {isAdmin && leadToReassign && (
        <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
          <DialogContent data-testid="dialog-reassign-lead">
            <DialogHeader>
              <DialogTitle>Reasignar Lead</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Reasignar el lead de <strong>{leadToReassign.firstName} {leadToReassign.lastName}</strong> a otro vendedor
              </p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Vendedor actual:</p>
                <p className="font-medium">{getSellerName(leadToReassign.registeredById)}</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="new-seller" className="text-sm font-medium">
                  Nuevo vendedor:
                </label>
                <Select value={selectedNewSeller} onValueChange={setSelectedNewSeller}>
                  <SelectTrigger id="new-seller" data-testid="select-new-seller">
                    <SelectValue placeholder="Selecciona un vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sellers
                      .filter((s: any) => s.id !== leadToReassign.registeredById)
                      .map((seller: any) => (
                        <SelectItem key={seller.id} value={seller.id}>
                          {seller.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setReassignDialogOpen(false);
                  setSelectedNewSeller("");
                }}
                data-testid="button-cancel-reassign"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (selectedNewSeller) {
                    reassignLeadMutation.mutate({
                      leadId: leadToReassign.id,
                      newSellerId: selectedNewSeller,
                    });
                  }
                }}
                disabled={!selectedNewSeller || reassignLeadMutation.isPending}
                data-testid="button-confirm-reassign"
              >
                {reassignLeadMutation.isPending ? "Reasignando..." : "Reasignar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
