import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  Users,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Clock,
  Send,
  Eye,
  MoreVertical,
  CheckCircle2,
  XCircle,
  User,
  Building2,
  BedDouble,
  TrendingUp,
  FileText,
  ArrowRight,
  MapPin,
  UserPlus,
  Inbox,
  BarChart3,
  Download,
  RefreshCw,
  AlertCircle,
  UserCheck,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { ExternalLeadWithActiveCard, User as UserType } from "@shared/schema";
import { format, formatDistanceToNow, subDays, startOfWeek, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type LeadStatus = 
  | "nuevo_lead"
  | "opciones_enviadas"
  | "cita_coordinada"
  | "cita_concretada"
  | "cita_cancelada"
  | "reprogramar_cita"
  | "interesado"
  | "oferta_enviada"
  | "formato_renta_enviado"
  | "proceso_renta"
  | "renta_concretada"
  | "no_responde"
  | "muerto"
  | "no_dar_servicio";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

const STATUS_CONFIG: Record<LeadStatus, StatusConfig> = {
  nuevo_lead: { label: "Nuevo Lead", color: "bg-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  opciones_enviadas: { label: "Opciones Enviadas", color: "bg-sky-500", bgColor: "bg-sky-100 dark:bg-sky-900/30" },
  cita_coordinada: { label: "Cita Coordinada", color: "bg-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  cita_concretada: { label: "Cita Concretada", color: "bg-violet-500", bgColor: "bg-violet-100 dark:bg-violet-900/30" },
  cita_cancelada: { label: "Cita Cancelada", color: "bg-rose-500", bgColor: "bg-rose-100 dark:bg-rose-900/30" },
  reprogramar_cita: { label: "Reprogramar", color: "bg-amber-500", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  interesado: { label: "Interesado", color: "bg-cyan-500", bgColor: "bg-cyan-100 dark:bg-cyan-900/30" },
  oferta_enviada: { label: "Oferta Enviada", color: "bg-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  formato_renta_enviado: { label: "Formato Renta", color: "bg-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  proceso_renta: { label: "En Proceso", color: "bg-indigo-500", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
  renta_concretada: { label: "Concretada", color: "bg-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" },
  no_responde: { label: "No Responde", color: "bg-slate-500", bgColor: "bg-slate-100 dark:bg-slate-900/30" },
  muerto: { label: "Muerto", color: "bg-gray-500", bgColor: "bg-gray-100 dark:bg-gray-800" },
  no_dar_servicio: { label: "No Dar Servicio", color: "bg-red-500", bgColor: "bg-red-100 dark:bg-red-900/30" },
};

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  trendUp,
  colorClass = "text-primary bg-primary/10",
}: { 
  title: string; 
  value: number | string; 
  icon: typeof TrendingUp; 
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
}) {
  return (
    <Card className="hover-elevate" data-testid={`metric-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <p className={cn(
                "text-xs mt-1",
                trendUp ? "text-green-600" : "text-muted-foreground"
              )}>
                {trend}
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-lg shrink-0", colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusPipeline({ leads }: { leads: ExternalLeadWithActiveCard[] }) {
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(lead => {
      counts[lead.status] = (counts[lead.status] || 0) + 1;
    });
    return counts;
  }, [leads]);

  const pipelineStatuses: LeadStatus[] = [
    "nuevo_lead",
    "opciones_enviadas",
    "cita_coordinada",
    "cita_concretada",
    "cita_cancelada",
    "reprogramar_cita",
    "interesado",
    "oferta_enviada",
    "formato_renta_enviado",
    "proceso_renta",
    "renta_concretada",
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Pipeline de Ventas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {pipelineStatuses.map((status, index) => {
            const config = STATUS_CONFIG[status];
            const count = statusCounts[status] || 0;
            return (
              <div 
                key={status} 
                className="flex flex-col items-center min-w-[80px]"
                data-testid={`pipeline-stage-${status}`}
              >
                <div 
                  className={cn(
                    "w-full h-12 rounded-lg flex items-center justify-center",
                    config.bgColor
                  )}
                >
                  <span className="text-lg font-bold">{count}</span>
                </div>
                <span className="text-xs text-muted-foreground mt-1 text-center truncate w-full">
                  {config.label}
                </span>
                {index < pipelineStatuses.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground/50 absolute right-0" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AssignLeadDialog({ 
  lead, 
  open, 
  onOpenChange,
  sellers,
  onAssign,
}: { 
  lead: ExternalLeadWithActiveCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellers: UserType[];
  onAssign: (leadId: string, sellerId: string) => void;
}) {
  const [selectedSeller, setSelectedSeller] = useState("");

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Asignar Lead
          </DialogTitle>
          <DialogDescription>
            Asigna a {lead.firstName} {lead.lastName} a un vendedor
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Select value={selectedSeller} onValueChange={setSelectedSeller}>
            <SelectTrigger data-testid="select-assign-seller">
              <SelectValue placeholder="Seleccionar vendedor" />
            </SelectTrigger>
            <SelectContent>
              {sellers.map(seller => (
                <SelectItem key={seller.id} value={seller.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {seller.firstName?.[0]}{seller.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {seller.firstName} {seller.lastName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-assign"
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              if (selectedSeller) {
                onAssign(lead.id, selectedSeller);
                onOpenChange(false);
              }
            }}
            disabled={!selectedSeller}
            data-testid="button-confirm-assign"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type SortField = "name" | "status" | "seller" | "budget" | "createdAt";
type SortOrder = "asc" | "desc";

export default function AdminLeadsGlobal() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("inbox");
  const [assignDialogLead, setAssignDialogLead] = useState<ExternalLeadWithActiveCard | null>(null);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const isAdminOrMaster = user?.role === 'master' || user?.role === 'admin';

  const { data: agencies } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['/api/external-agencies'],
    enabled: isAdminOrMaster,
  });

  useEffect(() => {
    if (isAdminOrMaster && agencies && agencies.length > 0 && !selectedAgencyId) {
      setSelectedAgencyId(agencies[0].id);
    }
  }, [agencies, isAdminOrMaster, selectedAgencyId]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-40" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1" />
    );
  };

  const { data: leadsResponse, isLoading } = useQuery<{ data: ExternalLeadWithActiveCard[], total: number, requiresAgencySelection?: boolean }>({
    queryKey: ["/api/external-leads", selectedAgencyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedAgencyId) params.append("agencyId", selectedAgencyId);
      const res = await fetch(`/api/external-leads?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
    enabled: !isAdminOrMaster || !!selectedAgencyId,
  });
  const leads = leadsResponse?.data || [];
  const requiresAgencySelection = leadsResponse?.requiresAgencySelection;

  const { data: sellers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/external/sellers"],
    queryFn: async () => {
      const res = await fetch("/api/external/sellers", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ leadId, sellerId }: { leadId: string; sellerId: string }) => {
      return apiRequest(`/api/external-leads/${leadId}/reassign`, {
        method: "POST",
        body: JSON.stringify({ sellerId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads", selectedAgencyId] });
      toast({ title: "Lead asignado", description: "El lead fue asignado correctamente" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo asignar el lead", variant: "destructive" });
    },
  });

  const filteredAndSortedLeads = useMemo(() => {
    const now = new Date();
    
    const filtered = leads.filter((lead) => {
      const matchesSearch = !searchQuery || 
        `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.includes(searchQuery);
      
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesSeller = sellerFilter === "all" || lead.sellerId === sellerFilter || 
        (sellerFilter === "unassigned" && !lead.sellerId);

      let matchesDate = true;
      if (dateFilter !== "all") {
        const createdAt = new Date(lead.createdAt);
        switch (dateFilter) {
          case "today":
            matchesDate = createdAt >= subDays(now, 1);
            break;
          case "week":
            matchesDate = createdAt >= startOfWeek(now, { locale: es });
            break;
          case "month":
            matchesDate = createdAt >= startOfMonth(now);
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesSeller && matchesDate;
    });

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case "status":
          comparison = (a.status || "").localeCompare(b.status || "");
          break;
        case "seller":
          const sellerA = sellers.find(s => s.id === a.sellerId);
          const sellerB = sellers.find(s => s.id === b.sellerId);
          const nameA = sellerA?.firstName || "";
          const nameB = sellerB?.firstName || "";
          if (!nameA && !nameB) comparison = 0;
          else if (!nameA) comparison = 1;
          else if (!nameB) comparison = -1;
          else comparison = nameA.localeCompare(nameB);
          break;
        case "budget":
          const budgetA = Number(a.activeCard?.budget || a.budget || 0);
          const budgetB = Number(b.activeCard?.budget || b.budget || 0);
          comparison = budgetA - budgetB;
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [leads, searchQuery, statusFilter, sellerFilter, dateFilter, sortField, sortOrder, sellers]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedLeads.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedLeads = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredAndSortedLeads.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedLeads, safeCurrentPage, itemsPerPage]);

  const totalLeadsCount = filteredAndSortedLeads.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sellerFilter, dateFilter]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const unassignedLeads = useMemo(() => 
    leads.filter(l => !l.sellerId && l.status === "nuevo_lead"),
    [leads]
  );

  const metrics = useMemo(() => {
    const total = leads.length;
    const unassigned = leads.filter(l => !l.sellerId).length;
    const newToday = leads.filter(l => {
      const createdAt = new Date(l.createdAt);
      return createdAt >= subDays(new Date(), 1);
    }).length;
    const completed = leads.filter(l => l.status === "renta_concretada").length;
    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, unassigned, newToday, completed, conversionRate };
  }, [leads]);

  const handleAssign = (leadId: string, sellerId: string) => {
    assignMutation.mutate({ leadId, sellerId });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-4 md:p-6 border-b bg-background">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">
              Inbox Global de Leads
            </h1>
            <p className="text-sm text-muted-foreground">
              Vista general de todos los leads de la agencia
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isAdminOrMaster && agencies && agencies.length > 0 && (
              <Select
                value={selectedAgencyId}
                onValueChange={setSelectedAgencyId}
              >
                <SelectTrigger className="w-[200px]" data-testid="select-agency">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Seleccionar agencia" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button 
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/external-leads", selectedAgencyId] })}
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button 
              onClick={() => navigate("/external/leads/new")}
              data-testid="button-create-lead"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Lead
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <MetricCard 
            title="Total Leads" 
            value={metrics.total} 
            icon={Users}
            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
          />
          <MetricCard 
            title="Sin Asignar" 
            value={metrics.unassigned} 
            icon={AlertCircle}
            colorClass="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
          />
          <MetricCard 
            title="Hoy" 
            value={metrics.newToday} 
            icon={Calendar}
            colorClass="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
          />
          <MetricCard 
            title="Cerradas" 
            value={metrics.completed} 
            icon={CheckCircle2}
            colorClass="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
          />
          <MetricCard 
            title="Conversión" 
            value={`${metrics.conversionRate}%`} 
            icon={TrendingUp}
            colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
          />
        </div>

        <div className="mt-4">
          <StatusPipeline leads={leads} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b px-4 md:px-6">
            <TabsList className="h-12">
              <TabsTrigger value="inbox" className="flex items-center gap-2" data-testid="tab-inbox">
                <Inbox className="h-4 w-4" />
                Inbox
                {unassignedLeads.length > 0 && (
                  <Badge variant="destructive" className="ml-1" data-testid="badge-unassigned-count">
                    {unassignedLeads.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2" data-testid="tab-all">
                <Users className="h-4 w-4" />
                Todos
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 md:px-6 border-b">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <Separator className="my-1" />
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", config.color)} />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sellerFilter} onValueChange={setSellerFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-seller-filter">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los vendedores</SelectItem>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                <Separator className="my-1" />
                {sellers.map(seller => (
                  <SelectItem key={seller.id} value={seller.id}>
                    {seller.firstName} {seller.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-32" data-testid="select-date-filter">
                <SelectValue placeholder="Fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="inbox" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 md:p-6">
                {unassignedLeads.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium">Inbox vacío</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      No hay leads nuevos sin asignar
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {unassignedLeads.map(lead => {
                      const status = STATUS_CONFIG[lead.status as LeadStatus] || STATUS_CONFIG.nuevo_lead;
                      const budget = lead.activeCard?.budget || lead.budget;
                      
                      return (
                        <Card 
                          key={lead.id} 
                          className="hover-elevate"
                          data-testid={`inbox-lead-card-${lead.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                                    {lead.firstName?.[0]}{lead.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium truncate">
                                      {lead.firstName} {lead.lastName}
                                    </span>
                                    <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950/30">
                                      Sin asignar
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    {budget && (
                                      <span className="flex items-center gap-1">
                                        <DollarSign className="h-3 w-3" />
                                        ${Number(budget).toLocaleString()}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => setAssignDialogLead(lead)}
                                  data-testid={`button-assign-${lead.id}`}
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Asignar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/external/leads/${lead.id}`)}
                                  data-testid={`button-view-${lead.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 md:p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filteredAndSortedLeads.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium">No hay leads</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      No se encontraron leads con los filtros aplicados
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead 
                              className="cursor-pointer select-none"
                              onClick={() => handleSort("name")}
                              data-testid="th-lead"
                            >
                              <div className="flex items-center">
                                Lead
                                <SortIcon field="name" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer select-none"
                              onClick={() => handleSort("status")}
                              data-testid="th-status"
                            >
                              <div className="flex items-center">
                                Estado
                                <SortIcon field="status" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer select-none"
                              onClick={() => handleSort("seller")}
                              data-testid="th-seller"
                            >
                              <div className="flex items-center">
                                Vendedor
                                <SortIcon field="seller" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer select-none"
                              onClick={() => handleSort("budget")}
                              data-testid="th-budget"
                            >
                              <div className="flex items-center">
                                Presupuesto
                                <SortIcon field="budget" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer select-none"
                              onClick={() => handleSort("createdAt")}
                              data-testid="th-date"
                            >
                              <div className="flex items-center">
                                Fecha
                                <SortIcon field="createdAt" />
                              </div>
                            </TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedLeads.map(lead => {
                          const status = STATUS_CONFIG[lead.status as LeadStatus] || STATUS_CONFIG.nuevo_lead;
                          const budget = lead.activeCard?.budget || lead.budget;
                          const seller = sellers.find(s => s.id === lead.sellerId);

                          return (
                            <TableRow 
                              key={lead.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => navigate(`/external/leads/${lead.id}`)}
                              data-testid={`table-row-${lead.id}`}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {lead.firstName?.[0]}{lead.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {lead.firstName} {lead.lastName}
                                    </div>
                                    {lead.phone && (
                                      <div className="text-xs text-muted-foreground">
                                        {lead.phone}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn("text-xs text-white", status.color)}>
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {seller ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {seller.firstName?.[0]}{seller.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{seller.firstName}</span>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950/30">
                                    Sin asignar
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {budget ? `$${Number(budget).toLocaleString()}` : "-"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(lead.createdAt), "d MMM", { locale: es })}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => e.stopPropagation()}
                                      data-testid={`button-actions-${lead.id}`}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      onClick={(e) => { e.stopPropagation(); navigate(`/external/leads/${lead.id}`); }}
                                      data-testid={`menu-view-${lead.id}`}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver Detalle
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={(e) => { e.stopPropagation(); setAssignDialogLead(lead); }}
                                      data-testid={`menu-assign-${lead.id}`}
                                    >
                                      <UserPlus className="mr-2 h-4 w-4" />
                                      {seller ? "Reasignar" : "Asignar"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {lead.phone && (
                                      <DropdownMenuItem 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '')}`, '_blank');
                                        }}
                                        data-testid={`menu-whatsapp-${lead.id}`}
                                      >
                                        <SiWhatsapp className="mr-2 h-4 w-4 text-green-600" />
                                        WhatsApp
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground" data-testid="text-leads-pagination-info">
                        Mostrando {Math.min((safeCurrentPage - 1) * itemsPerPage + 1, totalLeadsCount)}-{Math.min(safeCurrentPage * itemsPerPage, totalLeadsCount)} de {totalLeadsCount} leads
                      </span>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(val) => {
                          setItemsPerPage(Number(val));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[80px]" data-testid="select-leads-per-page">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">por página</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={safeCurrentPage <= 1}
                        data-testid="button-leads-prev-page"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {safeCurrentPage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={safeCurrentPage >= totalPages}
                        data-testid="button-leads-next-page"
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <AssignLeadDialog
        lead={assignDialogLead}
        open={!!assignDialogLead}
        onOpenChange={(open) => !open && setAssignDialogLead(null)}
        sellers={sellers}
        onAssign={handleAssign}
      />
    </div>
  );
}
