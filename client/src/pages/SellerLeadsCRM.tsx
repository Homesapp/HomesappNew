import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  List,
  LayoutGrid,
  Phone,
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
  Mail,
  MapPin,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ExternalLeadWithActiveCard } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import LeadKanbanView from "@/components/external/LeadKanbanView";

type LeadStatus = 
  | "nuevo_lead"
  | "cita_coordinada"
  | "interesado"
  | "oferta_enviada"
  | "oferta_completada"
  | "formato_enviado"
  | "formato_completado"
  | "proceso_renta"
  | "renta_concretada"
  | "perdido"
  | "muerto";

interface StatusConfig {
  label: string;
  labelEn: string;
  color: string;
  icon: typeof CheckCircle2;
}

const STATUS_CONFIG: Record<LeadStatus, StatusConfig> = {
  nuevo_lead: { label: "Nuevo", labelEn: "New", color: "bg-blue-500", icon: User },
  cita_coordinada: { label: "Cita Coordinada", labelEn: "Appointment", color: "bg-purple-500", icon: Calendar },
  interesado: { label: "Interesado", labelEn: "Interested", color: "bg-cyan-500", icon: TrendingUp },
  oferta_enviada: { label: "Oferta Enviada", labelEn: "Offer Sent", color: "bg-yellow-500", icon: Send },
  oferta_completada: { label: "Oferta Completada", labelEn: "Offer Done", color: "bg-orange-500", icon: FileText },
  formato_enviado: { label: "Formato Enviado", labelEn: "Form Sent", color: "bg-amber-500", icon: FileText },
  formato_completado: { label: "Formato OK", labelEn: "Form OK", color: "bg-teal-500", icon: CheckCircle2 },
  proceso_renta: { label: "En Proceso", labelEn: "In Process", color: "bg-indigo-500", icon: Building2 },
  renta_concretada: { label: "Concretada", labelEn: "Completed", color: "bg-green-500", icon: CheckCircle2 },
  perdido: { label: "Perdido", labelEn: "Lost", color: "bg-red-500", icon: XCircle },
  muerto: { label: "Muerto", labelEn: "Dead", color: "bg-gray-500", icon: XCircle },
};

function LeadQuickView({ 
  lead, 
  open, 
  onOpenChange,
  onGoToDetail,
}: { 
  lead: ExternalLeadWithActiveCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToDetail: () => void;
}) {
  if (!lead) return null;
  
  const status = STATUS_CONFIG[lead.status as LeadStatus] || STATUS_CONFIG.nuevo_lead;
  const budget = lead.activeCard?.budget || lead.budget;
  const bedrooms = lead.activeCard?.bedrooms || lead.bedrooms;
  const moveDate = lead.activeCard?.moveDate || lead.moveInDate;
  const zone = lead.activeCard?.zone || lead.desiredNeighborhood;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {lead.firstName?.[0]}{lead.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{lead.firstName} {lead.lastName}</div>
              <Badge className={cn("text-xs mt-1", status.color, "text-white")}>
                {status.label}
              </Badge>
            </div>
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Contacto</h4>
            <div className="space-y-2">
              {lead.phone && (
                <a 
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                  data-testid={`link-call-${lead.id}`}
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" data-testid={`text-phone-${lead.id}`}>{lead.phone}</span>
                </a>
              )}
              {lead.email && (
                <a 
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                  data-testid={`link-email-${lead.id}`}
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" data-testid={`text-email-${lead.id}`}>{lead.email}</span>
                </a>
              )}
              {lead.phone && (
                <a 
                  href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 hover-elevate"
                  data-testid={`link-whatsapp-${lead.id}`}
                >
                  <SiWhatsapp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400">WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Requisitos</h4>
            <div className="grid grid-cols-2 gap-3">
              {budget && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <DollarSign className="h-3 w-3" />
                    Presupuesto
                  </div>
                  <div className="font-medium">${Number(budget).toLocaleString()}</div>
                </div>
              )}
              {bedrooms && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <BedDouble className="h-3 w-3" />
                    Recámaras
                  </div>
                  <div className="font-medium">{bedrooms}</div>
                </div>
              )}
              {moveDate && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    Mudanza
                  </div>
                  <div className="font-medium">{format(new Date(moveDate), "d MMM yyyy", { locale: es })}</div>
                </div>
              )}
              {zone && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <MapPin className="h-3 w-3" />
                    Zona
                  </div>
                  <div className="font-medium truncate">{zone}</div>
                </div>
              )}
            </div>
          </div>

          {lead.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Notas</h4>
                <p className="text-sm">{lead.notes}</p>
              </div>
            </>
          )}

          <div className="pt-4">
            <Button 
              className="w-full" 
              onClick={onGoToDetail}
              data-testid="button-go-to-detail"
            >
              Ver Perfil Completo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LeadCardCompact({ 
  lead, 
  onView, 
  onGoToDetail,
}: { 
  lead: ExternalLeadWithActiveCard; 
  onView: () => void;
  onGoToDetail: () => void;
}) {
  const status = STATUS_CONFIG[lead.status as LeadStatus] || STATUS_CONFIG.nuevo_lead;
  
  const budget = lead.activeCard?.budget || lead.budget;
  const bedrooms = lead.activeCard?.bedrooms || lead.bedrooms;
  const moveDate = lead.activeCard?.moveDate || lead.moveInDate;
  
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.phone) {
      window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank');
    }
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.phone) {
      window.open(`tel:${lead.phone}`, '_blank');
    }
  };

  return (
    <Card 
      className="hover-elevate cursor-pointer transition-all"
      onClick={onView}
      data-testid={`seller-lead-card-${lead.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {lead.firstName?.[0]}{lead.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">
                  {lead.firstName} {lead.lastName}
                </span>
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs shrink-0", status.color, "text-white")}
                >
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                {budget && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${Number(budget).toLocaleString()}
                  </span>
                )}
                {bedrooms && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-3 w-3" />
                    {bedrooms} rec
                  </span>
                )}
                {moveDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(moveDate), "d MMM", { locale: es })}
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 inline mr-1" />
                {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleWhatsApp}
              data-testid={`button-whatsapp-${lead.id}`}
            >
              <SiWhatsapp className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCall}
              data-testid={`button-call-${lead.id}`}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`button-more-${lead.id}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onView(); }} 
                  data-testid={`button-quick-view-${lead.id}`}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Vista Rápida
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onGoToDetail(); }} 
                  data-testid={`button-full-detail-${lead.id}`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Perfil Completo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleWhatsApp} data-testid={`menu-whatsapp-${lead.id}`}>
                  <SiWhatsapp className="mr-2 h-4 w-4 text-green-600" />
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCall} data-testid={`menu-call-${lead.id}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Llamar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  colorClass = "text-primary bg-primary/10",
}: { 
  title: string; 
  value: number | string; 
  icon: typeof TrendingUp; 
  trend?: string;
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
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
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

export default function SellerLeadsCRM() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<ExternalLeadWithActiveCard | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);

  const { data: leads = [], isLoading } = useQuery<ExternalLeadWithActiveCard[]>({
    queryKey: ["/api/external-leads"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      return apiRequest(`/api/external-leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads"] });
      toast({ title: "Estado actualizado", description: "El lead fue actualizado correctamente" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el lead", variant: "destructive" });
    },
  });

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = !searchQuery || 
        `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.includes(searchQuery);
      
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  const metrics = useMemo(() => {
    const total = leads.length;
    const active = leads.filter(l => !["perdido", "muerto", "renta_concretada"].includes(l.status)).length;
    const newThisWeek = leads.filter(l => {
      const createdAt = new Date(l.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdAt >= weekAgo;
    }).length;
    const completed = leads.filter(l => l.status === "renta_concretada").length;
    
    return { total, active, newThisWeek, completed };
  }, [leads]);

  const handleViewLead = (lead: ExternalLeadWithActiveCard) => {
    setSelectedLead(lead);
    setShowQuickView(true);
  };

  const handleGoToDetail = (leadId: string) => {
    navigate(`/external/leads/${leadId}`);
  };

  const handleUpdateStatus = (leadId: string, newStatus: LeadStatus) => {
    updateStatusMutation.mutate({ leadId, status: newStatus });
  };

  const handleEditLead = (lead: ExternalLeadWithActiveCard) => {
    navigate(`/external/leads/${lead.id}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-4 md:p-6 border-b bg-background">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Mis Leads</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tus prospectos y lleva seguimiento de cada oportunidad
            </p>
          </div>
          <Button 
            onClick={() => navigate("/external/leads/new")}
            data-testid="button-create-lead"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Lead
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <MetricCard 
            title="Total Leads" 
            value={metrics.total} 
            icon={User}
            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
          />
          <MetricCard 
            title="Activos" 
            value={metrics.active} 
            icon={TrendingUp}
            colorClass="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
          />
          <MetricCard 
            title="Esta Semana" 
            value={metrics.newThisWeek} 
            icon={Calendar}
            colorClass="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
          />
          <MetricCard 
            title="Rentas Cerradas" 
            value={metrics.completed} 
            icon={CheckCircle2}
            colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
          />
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mt-4">
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
            <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
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
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none"
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="rounded-none"
              data-testid="button-view-kanban"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : viewMode === "list" ? (
          <ScrollArea className="h-full">
            <div className="p-4 md:p-6 space-y-3">
              {filteredLeads.length === 0 ? (
                <Card className="p-8 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium">No hay leads</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery || statusFilter !== "all" 
                      ? "No se encontraron leads con los filtros aplicados" 
                      : "Crea tu primer lead para comenzar"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button 
                      className="mt-4" 
                      onClick={() => navigate("/external/leads/new")}
                      data-testid="button-create-lead-empty"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Lead
                    </Button>
                  )}
                </Card>
              ) : (
                filteredLeads.map((lead) => (
                  <LeadCardCompact
                    key={lead.id}
                    lead={lead}
                    onView={() => handleViewLead(lead)}
                    onGoToDetail={() => handleGoToDetail(lead.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-full overflow-x-auto">
            <LeadKanbanView
              leads={filteredLeads}
              onUpdateStatus={handleUpdateStatus}
              onEdit={handleEditLead}
              onDelete={() => {}}
              onViewDetail={handleViewLead}
              canDelete={false}
            />
          </div>
        )}
      </div>

      <LeadQuickView
        lead={selectedLead}
        open={showQuickView}
        onOpenChange={setShowQuickView}
        onGoToDetail={() => {
          if (selectedLead) {
            setShowQuickView(false);
            handleGoToDetail(selectedLead.id);
          }
        }}
      />
    </div>
  );
}
