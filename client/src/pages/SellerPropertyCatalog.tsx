import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search, 
  Filter, 
  Home, 
  Bed, 
  Bath, 
  DollarSign, 
  MapPin, 
  Share2, 
  MessageCircle,
  Users,
  Check,
  Copy,
  ExternalLink,
  Building2,
  SlidersHorizontal,
  X,
  User,
  Wallet,
  Target,
  Calendar,
  PawPrint,
  ChevronRight,
  CheckCircle2,
  Phone,
  LayoutGrid,
  LayoutList,
  FileText,
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

interface Unit {
  id: string;
  name: string;
  unitNumber: string | null;
  zone: string | null;
  unitType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  monthlyRent: number | null;
  currency: string | null;
  status: string | null;
  images: string[] | null;
  amenities: string[] | null;
  condominiumId: string | null;
  condominiumName: string | null;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  status: string;
  estimatedRentCost: number | null;
  estimatedRentCostText: string | null;
  bedrooms: number | null;
  bedroomsText: string | null;
  desiredUnitType: string | null;
  desiredNeighborhood: string | null;
  contractDuration: string | null;
  hasPets: string | null;
  createdAt?: string;
}

interface MatchingLead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  matchScore: number;
  matchReasons: string[];
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
}

const singlePropertyTemplates: MessageTemplate[] = [
  {
    id: "single-1",
    name: "Presentacion inicial",
    content: `Hola {nombre}! Te comparto esta propiedad que puede interesarte:

Propiedad: {propiedad}
Ubicacion: {zona}
Recamaras: {recamaras}, Banos: {banos}
Precio: ${"{precio}"} {moneda}/mes

Te gustaria agendar una visita?`,
    isDefault: true
  },
  {
    id: "single-2",
    name: "Seguimiento",
    content: `Hola {nombre}! Que tal? Te comparto otra opcion que acaba de entrar disponible:

Propiedad: {propiedad}
Ubicacion: {zona}
Recamaras: {recamaras}
Precio: ${"{precio}"} {moneda}/mes

Esta propiedad cumple con lo que buscas. Te interesa verla?`,
    isDefault: true
  },
  {
    id: "single-3",
    name: "Oferta especial",
    content: `Hola {nombre}! Tengo excelentes noticias.

Esta propiedad tiene una promocion especial disponible:

Propiedad: {propiedad}
Ubicacion: {zona}
Precio: ${"{precio}"} {moneda}/mes

Te gustaria aprovechar esta oportunidad?`,
    isDefault: true
  }
];

const multiPropertyTemplates: MessageTemplate[] = [
  {
    id: "multi-1", 
    name: "Listado de propiedades",
    content: `Hola {nombre}! Encontre estas propiedades perfectas para ti:

{propiedades_lista}

Cual te gustaria visitar primero?`,
    isDefault: true
  },
  {
    id: "multi-2",
    name: "Opciones destacadas",
    content: `Hola {nombre}! Te comparto varias opciones que se ajustan a lo que buscas:

{propiedades_lista}

Cualquier pregunta estoy a tus ordenes.`,
    isDefault: true
  }
];

export default function SellerPropertyCatalog() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    zone: "",
    propertyType: "",
    status: "active",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [matchingLeadsOpen, setMatchingLeadsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadPanel, setShowLeadPanel] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [bulkShareDialogOpen, setBulkShareDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("single-1");
  const [selectedBulkTemplateId, setSelectedBulkTemplateId] = useState<string>("multi-1");
  const [leadsPanelExpanded, setLeadsPanelExpanded] = useState(true);
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("all");
  const [previousDataLength, setPreviousDataLength] = useState<number>(0);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (filters.minPrice) params.append("minPrice", filters.minPrice);
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
    if (filters.bedrooms) params.append("bedrooms", filters.bedrooms);
    if (filters.zone) params.append("zone", filters.zone);
    if (filters.propertyType) params.append("propertyType", filters.propertyType);
    if (filters.status) params.append("status", filters.status);
    return params.toString();
  };

  const { data: catalogData, isLoading } = useQuery<{ data: Unit[]; total: number }>({
    queryKey: ["/api/external-seller/property-catalog", search, filters],
    queryFn: async () => {
      const qs = buildQueryString();
      const res = await fetch(`/api/external-seller/property-catalog?${qs}`);
      if (!res.ok) throw new Error("Failed to fetch properties");
      return res.json();
    },
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery<{ data: Lead[] }>({
    queryKey: ["/api/external-leads"],
    queryFn: async () => {
      const res = await fetch("/api/external-leads?limit=100");
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
  });

  const { data: matchingLeads, isLoading: matchingLoading } = useQuery<MatchingLead[]>({
    queryKey: ["/api/external-seller/matching-leads", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit) return [];
      const res = await fetch(`/api/external-seller/matching-leads/${selectedUnit.id}`);
      if (!res.ok) throw new Error("Failed to fetch matching leads");
      return res.json();
    },
    enabled: !!selectedUnit && matchingLeadsOpen,
  });

  const { data: zones } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/external/config/zones"],
  });

  const { data: propertyTypes } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/external/config/property-types"],
  });

  const sharePropertyMutation = useMutation({
    mutationFn: async (data: { leadId: string; unitId: string; message?: string }) => {
      const res = await apiRequest("POST", "/api/external-seller/share-property", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }
      toast({
        title: t("sellerCatalog.shareSent", "Propiedad compartida"),
        description: t("sellerCatalog.shareSuccess", "Se abrió WhatsApp para enviar el mensaje"),
      });
      setShareDialogOpen(false);
      setBulkShareDialogOpen(false);
      setSelectedLead(null);
      setCustomMessage("");
      setSelectedUnits(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/metrics"] });
    },
    onError: () => {
      toast({
        title: t("common.error", "Error"),
        description: t("sellerCatalog.shareError", "No se pudo compartir la propiedad"),
        variant: "destructive",
      });
    },
  });

  const units = catalogData?.data || [];
  const allLeads = leadsData?.data || [];
  
  useEffect(() => {
    if (units.length !== previousDataLength) {
      setSelectedUnits(new Set());
      setPreviousDataLength(units.length);
    }
  }, [units.length, previousDataLength]);
  
  const filteredLeads = useMemo(() => {
    let result = [...allLeads];
    
    if (leadSearch) {
      const searchLower = leadSearch.toLowerCase();
      result = result.filter(lead => 
        lead.firstName?.toLowerCase().includes(searchLower) ||
        lead.lastName?.toLowerCase().includes(searchLower) ||
        lead.phone?.includes(leadSearch)
      );
    }
    
    if (leadStatusFilter !== "all") {
      result = result.filter(lead => lead.status === leadStatusFilter);
    }
    
    result.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
    
    return result;
  }, [allLeads, leadSearch, leadStatusFilter]);

  const hasActiveFilters = Object.values(filters).some((v) => v && v !== "active");

  const clearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      zone: "",
      propertyType: "",
      status: "active",
    });
    setSearch("");
    setSelectedLead(null);
  };

  const applyLeadFilters = (lead: Lead) => {
    // Toggle behavior: if same lead is clicked, deselect it
    if (selectedLead?.id === lead.id) {
      clearFilters();
      return;
    }
    setSelectedLead(lead);
    const newFilters = {
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      zone: "",
      propertyType: "",
      status: "active",
    };
    
    if (lead.estimatedRentCost) {
      const variance = Math.round(lead.estimatedRentCost * 0.15);
      newFilters.minPrice = String(lead.estimatedRentCost - variance);
      newFilters.maxPrice = String(lead.estimatedRentCost + variance);
    }
    if (lead.bedrooms) {
      newFilters.bedrooms = String(lead.bedrooms);
    }
    if (lead.desiredNeighborhood) {
      newFilters.zone = lead.desiredNeighborhood;
    }
    if (lead.desiredUnitType) {
      newFilters.propertyType = lead.desiredUnitType;
    }
    setFilters(newFilters);
  };

  const generateMessageFromTemplate = (template: MessageTemplate, unit: Unit, lead?: Lead | null) => {
    let message = template.content;
    message = message.replace(/{nombre}/g, lead?.firstName || "");
    message = message.replace(/{propiedad}/g, unit.name);
    message = message.replace(/{zona}/g, unit.zone || "");
    message = message.replace(/{recamaras}/g, String(unit.bedrooms || 0));
    message = message.replace(/{banos}/g, String(unit.bathrooms || 0));
    message = message.replace(/{precio}/g, unit.monthlyRent?.toLocaleString() || "Consultar");
    message = message.replace(/{moneda}/g, unit.currency || "MXN");
    return message;
  };

  const generateBulkMessage = (template: MessageTemplate, unitsList: Unit[], lead?: Lead | null) => {
    let message = template.content;
    message = message.replace(/{nombre}/g, lead?.firstName || "");
    
    const propertiesList = unitsList.map((unit, i) => 
      `${i + 1}. ${unit.name}\n   Ubicacion: ${unit.zone || "Sin zona"}\n   ${unit.bedrooms || 0} rec. | $${unit.monthlyRent?.toLocaleString() || "—"} ${unit.currency || "MXN"}/mes`
    ).join("\n\n");
    
    message = message.replace(/{propiedades_lista}/g, propertiesList);
    
    return message;
  };

  const handleShareClick = (unit: Unit) => {
    setSelectedUnit(unit);
    const template = singlePropertyTemplates.find(t => t.id === selectedTemplateId) || singlePropertyTemplates[0];
    setCustomMessage(generateMessageFromTemplate(template, unit, selectedLead));
    setShareDialogOpen(true);
  };

  const handleDirectWhatsApp = (unit: Unit, lead: Lead) => {
    if (!lead.phone) {
      toast({
        title: t("common.error", "Error"),
        description: t("sellerCatalog.noPhone", "El lead no tiene teléfono registrado"),
        variant: "destructive",
      });
      return;
    }
    setSelectedUnit(unit);
    setSelectedLead(lead);
    const template = singlePropertyTemplates.find(t => t.id === selectedTemplateId) || singlePropertyTemplates[0];
    setCustomMessage(generateMessageFromTemplate(template, unit, lead));
    setShareDialogOpen(true);
  };

  const handleFindMatches = (unit: Unit) => {
    setSelectedUnit(unit);
    setMatchingLeadsOpen(true);
  };

  const handleShareWithLead = (lead: MatchingLead) => {
    const fullLead = allLeads.find(l => l.id === lead.id);
    if (fullLead) {
      setSelectedLead(fullLead);
    }
    if (selectedUnit) {
      const template = singlePropertyTemplates.find(t => t.id === selectedTemplateId) || singlePropertyTemplates[0];
      setCustomMessage(generateMessageFromTemplate(template, selectedUnit, fullLead));
    }
    setMatchingLeadsOpen(false);
    setShareDialogOpen(true);
  };

  const handleSendShare = () => {
    if (!selectedUnit || !selectedLead) return;
    sharePropertyMutation.mutate({
      leadId: selectedLead.id,
      unitId: selectedUnit.id,
      message: customMessage,
    });
  };

  const handleBulkShare = () => {
    if (selectedUnits.size === 0 || !selectedLead) return;
    
    const phone = selectedLead.phone?.replace(/\D/g, "") || "";
    if (!phone) {
      toast({
        title: "Error",
        description: "El lead no tiene teléfono registrado",
        variant: "destructive",
      });
      return;
    }
    
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(customMessage)}`;
    window.open(whatsappUrl, "_blank");
    
    toast({
      title: "Propiedades compartidas",
      description: `Se abrió WhatsApp con ${selectedUnits.size} propiedades`,
    });
    
    setBulkShareDialogOpen(false);
    setSelectedUnits(new Set());
    setCustomMessage("");
  };

  const handleOpenBulkShare = () => {
    if (selectedUnits.size === 0) {
      toast({
        title: "Selecciona propiedades",
        description: "Primero selecciona las propiedades que quieres compartir",
        variant: "destructive",
      });
      return;
    }
    
    const selectedUnitsList = units.filter(u => selectedUnits.has(u.id));
    const template = multiPropertyTemplates.find(t => t.id === selectedBulkTemplateId) || multiPropertyTemplates[0];
    setCustomMessage(generateBulkMessage(template, selectedUnitsList, selectedLead));
    setBulkShareDialogOpen(true);
  };

  const toggleUnitSelection = (unitId: string) => {
    const newSet = new Set(selectedUnits);
    if (newSet.has(unitId)) {
      newSet.delete(unitId);
    } else {
      newSet.add(unitId);
    }
    setSelectedUnits(newSet);
  };

  const selectAllUnits = () => {
    if (selectedUnits.size === units.length) {
      setSelectedUnits(new Set());
    } else {
      setSelectedUnits(new Set(units.map(u => u.id)));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(customMessage);
    toast({
      title: t("common.copied", "Copiado"),
      description: t("sellerCatalog.messageCopied", "Mensaje copiado al portapapeles"),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "nuevo": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "contactado": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "en_negociacion": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "proceso_renta": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      nuevo: "Nuevo",
      contactado: "Contactado",
      en_negociacion: "En Negociación",
      cita_agendada: "Cita Agendada",
      proceso_renta: "En Proceso",
      perdido: "Perdido",
      descartado: "Descartado"
    };
    return labels[status] || status;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col sm:flex-row gap-0">
      {showLeadPanel && (
        <div className="w-full sm:w-80 flex-shrink-0 border-b sm:border-b-0 sm:border-r bg-muted/30">
          <div className="flex h-12 sm:h-14 items-center justify-between border-b px-3 sm:px-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h2 className="font-semibold text-sm sm:text-base">{t("sellerCatalog.myLeads", "Mis Leads")}</h2>
              <Badge variant="secondary" className="ml-1">{filteredLeads.length}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                className="sm:hidden h-9 w-9"
                onClick={() => setLeadsPanelExpanded(!leadsPanelExpanded)}
                data-testid="button-toggle-leads-mobile"
              >
                {leadsPanelExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setShowLeadPanel(false)}
                data-testid="button-hide-leads"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className={`${leadsPanelExpanded ? 'block' : 'hidden'} sm:block`}>
            <div className="p-2 sm:p-3 space-y-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar lead..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="pl-9 h-10"
                  data-testid="input-lead-search"
                />
              </div>
              <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
                <SelectTrigger className="h-10" data-testid="select-lead-status-filter">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="contactado">Contactado</SelectItem>
                  <SelectItem value="en_negociacion">En Negociación</SelectItem>
                  <SelectItem value="cita_agendada">Cita Agendada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <ScrollArea className="h-[200px] sm:h-[calc(100vh-14rem)]">
              <div className="space-y-2 p-2 sm:p-3">
                {leadsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))
                ) : filteredLeads.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {leadSearch ? "No se encontraron leads" : "No tienes leads asignados"}
                    </p>
                  </div>
                ) : (
                  filteredLeads.map((lead) => (
                    <Card 
                      key={lead.id} 
                      className={`cursor-pointer transition-all hover-elevate ${
                        selectedLead?.id === lead.id 
                          ? "ring-2 ring-primary" 
                          : ""
                      }`}
                      onClick={() => applyLeadFilters(lead)}
                      data-testid={`card-lead-${lead.id}`}
                    >
                      <CardContent className="p-2 sm:p-3">
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium leading-tight text-sm">
                                {lead.firstName} {lead.lastName}
                              </p>
                              {lead.phone && (
                                <p className="text-xs text-muted-foreground">{lead.phone}</p>
                              )}
                            </div>
                          </div>
                          {selectedLead?.id === lead.id && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Wallet className="h-3 w-3" />
                            <span className="font-medium text-foreground truncate">
                              {lead.estimatedRentCost 
                                ? `$${lead.estimatedRentCost.toLocaleString()}` 
                                : "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Bed className="h-3 w-3" />
                            <span className="font-medium text-foreground">
                              {lead.bedrooms || "—"} rec.
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2">
                          <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
                            {getStatusLabel(lead.status)}
                          </Badge>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="h-8 gap-1 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              applyLeadFilters(lead);
                            }}
                          >
                            <Target className="h-3 w-3" />
                            Filtrar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-shrink-0 border-b bg-background p-3 sm:p-4">
          <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              {!showLeadPanel && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowLeadPanel(true)}
                  className="gap-1 h-9"
                  data-testid="button-show-leads"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Leads</span>
                </Button>
              )}
              <div>
                <h1 className="text-lg sm:text-xl font-bold" data-testid="text-page-title">
                  {t("sellerCatalog.title", "Catálogo de Propiedades")}
                </h1>
                {selectedLead && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Propiedades para <span className="font-medium text-primary">{selectedLead.firstName} {selectedLead.lastName}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {catalogData?.total || 0} propiedades
              </Badge>
              <div className="flex border rounded-md overflow-hidden">
                <Button 
                  variant={viewMode === "grid" ? "default" : "ghost"} 
                  size="icon" 
                  className="h-9 w-9 rounded-none"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === "table" ? "default" : "ghost"} 
                  size="icon" 
                  className="h-9 w-9 rounded-none"
                  onClick={() => setViewMode("table")}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-[150px] sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("sellerCatalog.searchPlaceholder", "Buscar propiedad...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10"
                data-testid="input-search"
              />
            </div>

            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 h-10" data-testid="button-filters">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtros</span>
                  {hasActiveFilters && (
                    <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                      {Object.values(filters).filter((v) => v && v !== "active").length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtrar propiedades</h4>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="mr-1 h-3 w-3" />
                        Limpiar
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Precio mín</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={filters.minPrice}
                          onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                          data-testid="input-min-price"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Precio máx</Label>
                        <Input
                          type="number"
                          placeholder="100000"
                          value={filters.maxPrice}
                          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                          data-testid="input-max-price"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Recámaras</Label>
                      <Select
                        value={filters.bedrooms}
                        onValueChange={(v) => setFilters({ ...filters, bedrooms: v })}
                      >
                        <SelectTrigger data-testid="select-bedrooms">
                          <SelectValue placeholder="Cualquiera" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Cualquiera</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Zona</Label>
                      <Select
                        value={filters.zone}
                        onValueChange={(v) => setFilters({ ...filters, zone: v })}
                      >
                        <SelectTrigger data-testid="select-zone">
                          <SelectValue placeholder="Todas las zonas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todas las zonas</SelectItem>
                          {zones?.map((zone) => (
                            <SelectItem key={zone.id} value={zone.name}>
                              {zone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Tipo de propiedad</Label>
                      <Select
                        value={filters.propertyType}
                        onValueChange={(v) => setFilters({ ...filters, propertyType: v })}
                      >
                        <SelectTrigger data-testid="select-property-type">
                          <SelectValue placeholder="Todos los tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos los tipos</SelectItem>
                          {propertyTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Estado</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(v) => setFilters({ ...filters, status: v })}
                      >
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Disponible</SelectItem>
                          <SelectItem value="rented">Rentada</SelectItem>
                          <SelectItem value="">Todas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={() => setFiltersOpen(false)} className="w-full h-10">
                    Aplicar filtros
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {selectedLead && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1 h-10">
                <X className="h-3 w-3" />
                <span className="hidden sm:inline">Quitar filtros de {selectedLead.firstName}</span>
                <span className="sm:hidden">Limpiar</span>
              </Button>
            )}

            {viewMode === "table" && selectedUnits.size > 0 && (
              <Button 
                onClick={handleOpenBulkShare} 
                className="gap-2 h-10"
                data-testid="button-bulk-share"
              >
                <SiWhatsapp className="h-4 w-4" />
                <span className="hidden sm:inline">Enviar {selectedUnits.size} propiedades</span>
                <span className="sm:hidden">{selectedUnits.size}</span>
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-3 sm:p-4">
          {isLoading ? (
            viewMode === "grid" ? (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-36 sm:h-40 w-full rounded-t-lg" />
                    <CardContent className="p-3 sm:p-4">
                      <Skeleton className="mb-2 h-5 w-3/4" />
                      <Skeleton className="mb-4 h-4 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            )
          ) : units.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">
                No se encontraron propiedades
              </h3>
              <p className="text-muted-foreground">
                Intenta ajustar los filtros de búsqueda
              </p>
              {selectedLead && (
                <Button variant="outline" className="mt-4 h-10" onClick={clearFilters}>
                  Quitar filtros de {selectedLead.firstName}
                </Button>
              )}
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {units.map((unit) => (
                <Card key={unit.id} className="group overflow-hidden" data-testid={`card-property-${unit.id}`}>
                  <div className="relative h-36 sm:h-40 bg-muted">
                    {unit.images && unit.images.length > 0 ? (
                      <img
                        src={unit.images[0]}
                        alt={unit.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                        <Home className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <Badge
                      className="absolute left-2 top-2"
                      variant={unit.status === "active" ? "default" : "secondary"}
                    >
                      {unit.status === "active" ? "Disponible" : "Rentada"}
                    </Badge>
                  </div>

                  <CardContent className="p-3">
                    {/* Condominium and Unit Number */}
                    <div className="mb-1 flex items-center gap-1 text-xs font-medium">
                      <Building2 className="h-3 w-3 flex-shrink-0 text-primary" />
                      <span className="line-clamp-1">
                        {unit.condominiumName || "Sin condominio"}
                      </span>
                    </div>
                    <h3 className="mb-1 line-clamp-1 text-sm font-semibold" data-testid={`text-unit-name-${unit.id}`}>
                      {unit.unitNumber ? `Unidad ${unit.unitNumber}` : unit.name}
                    </h3>
                    <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-1">{unit.zone || "Sin zona"}</span>
                    </div>

                    <div className="mb-2 flex flex-wrap gap-1">
                      {unit.unitType && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Home className="h-2.5 w-2.5" />
                          {unit.unitType}
                        </Badge>
                      )}
                      {unit.bedrooms && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Bed className="h-2.5 w-2.5" />
                          {unit.bedrooms}
                        </Badge>
                      )}
                      {unit.bathrooms && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Bath className="h-2.5 w-2.5" />
                          {unit.bathrooms}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-base font-bold text-primary">
                      <span>$</span>
                      <span>
                        {unit.monthlyRent?.toLocaleString() || "—"}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {unit.currency || "MXN"}/mes
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2 border-t p-2">
                    {selectedLead ? (
                      <Button
                        size="sm"
                        className="flex-1 gap-1 h-10"
                        onClick={() => handleDirectWhatsApp(unit, selectedLead)}
                        data-testid={`button-whatsapp-${unit.id}`}
                      >
                        <SiWhatsapp className="h-4 w-4" />
                        <span className="truncate">WhatsApp a {selectedLead.firstName}</span>
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1 h-10"
                          onClick={() => handleFindMatches(unit)}
                          data-testid={`button-find-matches-${unit.id}`}
                        >
                          <Users className="h-3.5 w-3.5" />
                          Leads
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 gap-1 h-10"
                          onClick={() => handleShareClick(unit)}
                          data-testid={`button-share-${unit.id}`}
                        >
                          <SiWhatsapp className="h-3.5 w-3.5" />
                          Compartir
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-lg">
                <Checkbox 
                  checked={selectedUnits.size === units.length && units.length > 0}
                  onCheckedChange={selectAllUnits}
                  data-testid="checkbox-select-all"
                />
                <span className="text-sm font-medium">
                  {selectedUnits.size > 0 
                    ? `${selectedUnits.size} de ${units.length} seleccionadas` 
                    : "Seleccionar todas"}
                </span>
              </div>
              
              {units.map((unit) => (
                <Card 
                  key={unit.id} 
                  className={`overflow-hidden ${selectedUnits.has(unit.id) ? 'ring-2 ring-primary' : ''}`}
                  data-testid={`row-property-${unit.id}`}
                >
                  <div className="flex items-center p-3 gap-3">
                    <Checkbox 
                      checked={selectedUnits.has(unit.id)}
                      onCheckedChange={() => toggleUnitSelection(unit.id)}
                      data-testid={`checkbox-unit-${unit.id}`}
                    />
                    
                    <div className="w-16 h-12 sm:w-20 sm:h-14 flex-shrink-0 rounded overflow-hidden bg-muted">
                      {unit.images && unit.images.length > 0 ? (
                        <img
                          src={unit.images[0]}
                          alt={unit.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Home className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-1">{unit.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {unit.zone || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bed className="h-3 w-3" />
                          {unit.bedrooms || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-3 w-3" />
                          {unit.bathrooms || "—"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 text-right">
                      <p className="font-bold text-primary">
                        ${unit.monthlyRent?.toLocaleString() || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">{unit.currency || "MXN"}/mes</p>
                    </div>
                    
                    <div className="flex-shrink-0 flex gap-1">
                      {selectedLead ? (
                        <Button
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => handleDirectWhatsApp(unit, selectedLead)}
                          data-testid={`button-whatsapp-table-${unit.id}`}
                        >
                          <SiWhatsapp className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => handleFindMatches(unit)}
                            data-testid={`button-find-matches-table-${unit.id}`}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => handleShareClick(unit)}
                            data-testid={`button-share-table-${unit.id}`}
                          >
                            <SiWhatsapp className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <Dialog open={matchingLeadsOpen} onOpenChange={setMatchingLeadsOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leads compatibles
            </DialogTitle>
            <DialogDescription>
              {selectedUnit?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 space-y-2 overflow-y-auto">
            {matchingLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : matchingLeads && matchingLeads.length > 0 ? (
              matchingLeads.map((lead) => (
                <Card
                  key={lead.id}
                  className="cursor-pointer transition-colors hover-elevate"
                  onClick={() => handleShareWithLead(lead)}
                  data-testid={`card-matching-lead-${lead.id}`}
                >
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{lead.phone}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {lead.matchReasons.map((reason, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={lead.matchScore >= 50 ? "default" : "secondary"}>
                        {lead.matchScore}%
                      </Badge>
                      <SiWhatsapp className="h-5 w-5 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-8 text-center">
                <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  No se encontraron leads compatibles
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SiWhatsapp className="h-5 w-5 text-green-600" />
              Compartir por WhatsApp
            </DialogTitle>
            <DialogDescription>
              {selectedUnit?.name}
              {selectedLead && ` → ${selectedLead.firstName} ${selectedLead.lastName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedLead && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Primero selecciona un lead desde el panel izquierdo o desde "Leads compatibles"
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-10"
                  onClick={() => {
                    setShareDialogOpen(false);
                    setMatchingLeadsOpen(true);
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Seleccionar lead
                </Button>
              </div>
            )}

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Plantilla de mensaje
              </Label>
              <Select value={selectedTemplateId} onValueChange={(v) => {
                setSelectedTemplateId(v);
                const template = singlePropertyTemplates.find(t => t.id === v);
                if (template && selectedUnit) {
                  setCustomMessage(generateMessageFromTemplate(template, selectedUnit, selectedLead));
                }
              }}>
                <SelectTrigger data-testid="select-template">
                  <SelectValue placeholder="Selecciona una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {singlePropertyTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mensaje</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={8}
                className="mt-1 font-mono text-sm"
                data-testid="textarea-share-message"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1 h-10">
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              {selectedUnit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const template = singlePropertyTemplates.find(t => t.id === selectedTemplateId) || singlePropertyTemplates[0];
                    setCustomMessage(generateMessageFromTemplate(template, selectedUnit, selectedLead));
                  }}
                  className="gap-1 h-10"
                >
                  Restaurar
                </Button>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShareDialogOpen(false)} className="w-full sm:w-auto h-10">
              Cancelar
            </Button>
            <Button
              onClick={handleSendShare}
              disabled={!selectedLead || sharePropertyMutation.isPending}
              className="gap-2 w-full sm:w-auto h-10"
              data-testid="button-send-share"
            >
              <SiWhatsapp className="h-4 w-4" />
              {sharePropertyMutation.isPending
                ? "Enviando..."
                : "Abrir WhatsApp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkShareDialogOpen} onOpenChange={setBulkShareDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SiWhatsapp className="h-5 w-5 text-green-600" />
              Enviar {selectedUnits.size} propiedades
            </DialogTitle>
            <DialogDescription>
              {selectedLead 
                ? `Enviar a ${selectedLead.firstName} ${selectedLead.lastName}` 
                : "Selecciona un lead para enviar las propiedades"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedLead && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Selecciona un lead desde el panel lateral para poder enviar las propiedades
                </p>
              </div>
            )}

            <div className="max-h-32 overflow-y-auto rounded-lg border p-2">
              {units.filter(u => selectedUnits.has(u.id)).map((unit) => (
                <div key={unit.id} className="flex items-center gap-2 py-1 text-sm">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{unit.name}</span>
                  <span className="text-muted-foreground ml-auto">${unit.monthlyRent?.toLocaleString() || "—"}</span>
                </div>
              ))}
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Plantilla de mensaje
              </Label>
              <Select value={selectedBulkTemplateId} onValueChange={(v) => {
                setSelectedBulkTemplateId(v);
                const template = multiPropertyTemplates.find(t => t.id === v);
                if (template) {
                  const selectedUnitsList = units.filter(u => selectedUnits.has(u.id));
                  setCustomMessage(generateBulkMessage(template, selectedUnitsList, selectedLead));
                }
              }}>
                <SelectTrigger data-testid="select-bulk-template">
                  <SelectValue placeholder="Selecciona una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {multiPropertyTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mensaje</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                data-testid="textarea-bulk-message"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1 h-10">
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setBulkShareDialogOpen(false)} className="w-full sm:w-auto h-10">
              Cancelar
            </Button>
            <Button
              onClick={handleBulkShare}
              disabled={!selectedLead}
              className="gap-2 w-full sm:w-auto h-10"
              data-testid="button-send-bulk-share"
            >
              <SiWhatsapp className="h-4 w-4" />
              Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
