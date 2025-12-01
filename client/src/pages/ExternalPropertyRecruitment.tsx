import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Building2,
  Home,
  MapPin,
  Phone,
  Mail,
  Calendar,
  User,
  Eye,
  MoreVertical,
  List,
  LayoutGrid,
  Kanban,
  Link2,
  Send,
  MessageCircle,
  Clock,
  FileText,
  DollarSign,
  ClipboardCheck,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { type ExternalPropertyProspect, insertExternalPropertyProspectSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import CommissionRatesDisplay from "@/components/CommissionRatesDisplay";

const PROSPECT_STATUSES = [
  { 
    value: "identified", 
    label: "Identificada", 
    labelEn: "Identified",
    color: "bg-blue-500",
    icon: Building2,
    description: "Propiedad identificada para reclutar"
  },
  { 
    value: "contacted", 
    label: "Contactado", 
    labelEn: "Contacted",
    color: "bg-purple-500",
    icon: Phone,
    description: "Propietario contactado"
  },
  { 
    value: "documentation", 
    label: "Documentación", 
    labelEn: "Documentation",
    color: "bg-cyan-500",
    icon: FileText,
    description: "Recopilando documentos"
  },
  { 
    value: "inspection_scheduled", 
    label: "Inspección Agendada", 
    labelEn: "Inspection Scheduled",
    color: "bg-yellow-500",
    icon: Calendar,
    description: "Inspección programada"
  },
  { 
    value: "inspection_completed", 
    label: "Inspección Completada", 
    labelEn: "Inspection Done",
    color: "bg-orange-500",
    icon: ClipboardCheck,
    description: "Inspección realizada"
  },
  { 
    value: "owner_invited", 
    label: "Propietario Invitado", 
    labelEn: "Owner Invited",
    color: "bg-indigo-500",
    icon: Send,
    description: "Invitación enviada"
  },
  { 
    value: "owner_registered", 
    label: "Propietario Registrado", 
    labelEn: "Owner Registered",
    color: "bg-teal-500",
    icon: User,
    description: "Propietario se registró"
  },
  { 
    value: "property_approved", 
    label: "Aprobada", 
    labelEn: "Approved",
    color: "bg-green-500",
    icon: CheckCircle2,
    description: "Propiedad publicada"
  },
  { 
    value: "rejected", 
    label: "Rechazada", 
    labelEn: "Rejected",
    color: "bg-red-500",
    icon: XCircle,
    description: "No procede"
  },
];

const PROPERTY_TYPES = [
  { value: "casa", label: "Casa" },
  { value: "departamento", label: "Departamento" },
  { value: "penthouse", label: "Penthouse" },
  { value: "estudio", label: "Estudio" },
  { value: "villa", label: "Villa" },
  { value: "terreno", label: "Terreno" },
  { value: "local_comercial", label: "Local Comercial" },
  { value: "oficina", label: "Oficina" },
  { value: "otro", label: "Otro" },
];

const newProspectFormSchema = z.object({
  propertyName: z.string().min(1, "El nombre es obligatorio"),
  propertyType: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  estimatedRentPrice: z.string().optional(),
  ownerFirstName: z.string().optional(),
  ownerLastName: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
  listingType: z.string().default("rent"),
});

type NewProspectFormData = z.infer<typeof newProspectFormSchema>;

export default function ExternalPropertyRecruitment() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [viewMode, setViewMode] = useState<"kanban" | "table" | "cards">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewProspectDialog, setShowNewProspectDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<ExternalPropertyProspect | null>(null);
  const [inviteUrl, setInviteUrl] = useState("");

  const { data: prospectsData, isLoading } = useQuery<{ data: ExternalPropertyProspect[]; total: number }>({
    queryKey: ["/api/external/property-prospects", { search: searchTerm, status: statusFilter !== "all" ? statusFilter : undefined }],
  });

  const prospects = prospectsData?.data || [];

  // Fetch configurable property types from catalog
  const { data: propertyTypesConfig = [] } = useQuery<Array<{id: string; name: string; isActive: boolean; sortOrder: number}>>({
    queryKey: ['/api/external/config/property-types'],
    staleTime: 5 * 60 * 1000,
  });
  const activePropertyTypes = propertyTypesConfig.filter(pt => pt.isActive);

  // Fetch configurable zones from catalog
  const { data: zonesConfig = [] } = useQuery<Array<{id: string; name: string; isActive: boolean; sortOrder: number}>>({
    queryKey: ['/api/external/config/zones'],
    staleTime: 5 * 60 * 1000,
  });
  const activeZones = zonesConfig.filter(z => z.isActive);

  const form = useForm<NewProspectFormData>({
    resolver: zodResolver(newProspectFormSchema),
    defaultValues: {
      propertyName: "",
      propertyType: "",
      address: "",
      neighborhood: "",
      city: "Tulum",
      bedrooms: "",
      bathrooms: "",
      estimatedRentPrice: "",
      ownerFirstName: "",
      ownerLastName: "",
      ownerPhone: "",
      ownerEmail: "",
      notes: "",
      listingType: "rent",
    },
  });

  const createProspectMutation = useMutation({
    mutationFn: async (data: NewProspectFormData) => {
      const payload = {
        ...data,
        bedrooms: data.bedrooms ? parseInt(data.bedrooms) : undefined,
        bathrooms: data.bathrooms || undefined,
        estimatedRentPrice: data.estimatedRentPrice || undefined,
      };
      return apiRequest("POST", "/api/external/property-prospects", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/property-prospects"] });
      toast({ title: "Prospecto creado", description: "El prospecto de propiedad ha sido registrado" });
      setShowNewProspectDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo crear el prospecto", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/external/property-prospects/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/property-prospects"] });
      toast({ title: "Estado actualizado" });
    },
  });

  const generateInviteMutation = useMutation({
    mutationFn: async ({ id, sentVia }: { id: string; sentVia: string }) => {
      return apiRequest("POST", `/api/external/property-prospects/${id}/invite`, { sentVia });
    },
    onSuccess: (data: { url: string; token: string }) => {
      const fullUrl = `${window.location.origin}${data.url}`;
      setInviteUrl(fullUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/external/property-prospects"] });
      toast({ title: "Link generado", description: "Link de invitación listo para compartir" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo generar el link", variant: "destructive" });
    },
  });

  const handleDragStart = (e: React.DragEvent, prospectId: string) => {
    e.dataTransfer.setData("prospectId", prospectId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const prospectId = e.dataTransfer.getData("prospectId");
    if (prospectId) {
      updateStatusMutation.mutate({ id: prospectId, status: newStatus });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Link copiado al portapapeles" });
  };

  const openWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = PROSPECT_STATUSES.find(s => s.value === status);
    if (!statusInfo) return <Badge variant="outline">{status}</Badge>;
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getPropertyTypeLabel = (type: string | null | undefined) => {
    if (!type) return "Sin tipo";
    const typeInfo = PROPERTY_TYPES.find(t => t.value === type);
    return typeInfo?.label || type;
  };

  const filteredProspects = useMemo(() => {
    return prospects.filter(prospect => {
      if (statusFilter !== "all" && prospect.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          prospect.propertyName?.toLowerCase().includes(term) ||
          prospect.address?.toLowerCase().includes(term) ||
          prospect.neighborhood?.toLowerCase().includes(term) ||
          prospect.ownerFirstName?.toLowerCase().includes(term) ||
          prospect.ownerLastName?.toLowerCase().includes(term) ||
          prospect.ownerPhone?.includes(term)
        );
      }
      return true;
    });
  }, [prospects, statusFilter, searchTerm]);

  const prospectsByStatus = useMemo(() => {
    const grouped: Record<string, ExternalPropertyProspect[]> = {};
    PROSPECT_STATUSES.forEach(status => {
      grouped[status.value] = filteredProspects.filter(p => p.status === status.value);
    });
    return grouped;
  }, [filteredProspects]);

  const onSubmit = (data: NewProspectFormData) => {
    createProspectMutation.mutate(data);
  };

  const renderKanbanView = () => (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PROSPECT_STATUSES.slice(0, -1).map((status) => (
        <div
          key={status.value}
          className="flex-shrink-0 w-72"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status.value)}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <CardTitle className="text-sm font-medium">{status.label}</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {prospectsByStatus[status.value]?.length || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-2">
                  {prospectsByStatus[status.value]?.map((prospect) => (
                    <Card
                      key={prospect.id}
                      className="p-3 cursor-grab hover-elevate"
                      draggable
                      onDragStart={(e) => handleDragStart(e, prospect.id)}
                    >
                      <div className="space-y-2">
                        <div className="font-medium text-sm truncate">
                          {prospect.propertyName || "Sin nombre"}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Home className="w-3 h-3" />
                          {getPropertyTypeLabel(prospect.propertyType)}
                        </div>
                        {prospect.neighborhood && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {prospect.neighborhood}
                          </div>
                        )}
                        {prospect.ownerFirstName && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            {prospect.ownerFirstName} {prospect.ownerLastName}
                          </div>
                        )}
                        {prospect.estimatedRentPrice && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DollarSign className="w-3 h-3" />
                            ${Number(prospect.estimatedRentPrice).toLocaleString()} MXN
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(prospect.createdAt), { addSuffix: true, locale: es })}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/external/recruitment/${prospect.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedProspect(prospect);
                                  setShowInviteDialog(true);
                                }}
                              >
                                <Link2 className="h-4 w-4 mr-2" />
                                Generar invitación
                              </DropdownMenuItem>
                              {prospect.ownerPhone && (
                                <DropdownMenuItem 
                                  onClick={() => openWhatsApp(
                                    prospect.ownerPhone!,
                                    `Hola ${prospect.ownerFirstName || ''}, le contactamos sobre su propiedad "${prospect.propertyName}".`
                                  )}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  WhatsApp
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {(!prospectsByStatus[status.value] || prospectsByStatus[status.value].length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Sin prospectos
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Propiedad</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Propietario</TableHead>
            <TableHead>Precio Est.</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProspects.map((prospect) => (
            <TableRow key={prospect.id} className="hover-elevate cursor-pointer" onClick={() => navigate(`/external/recruitment/${prospect.id}`)}>
              <TableCell className="font-medium">{prospect.propertyName || "Sin nombre"}</TableCell>
              <TableCell>{getPropertyTypeLabel(prospect.propertyType)}</TableCell>
              <TableCell>
                <div className="text-sm">
                  {prospect.neighborhood || prospect.city || "Sin ubicación"}
                </div>
              </TableCell>
              <TableCell>
                {prospect.ownerFirstName ? (
                  <div className="text-sm">
                    {prospect.ownerFirstName} {prospect.ownerLastName}
                    {prospect.ownerPhone && (
                      <div className="text-xs text-muted-foreground">{prospect.ownerPhone}</div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Sin datos</span>
                )}
              </TableCell>
              <TableCell>
                {prospect.estimatedRentPrice ? (
                  `$${Number(prospect.estimatedRentPrice).toLocaleString()}`
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>{getStatusBadge(prospect.status)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(prospect.createdAt), "dd/MM/yy", { locale: es })}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/external/recruitment/${prospect.id}`); }}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProspect(prospect);
                        setShowInviteDialog(true);
                      }}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Generar invitación
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {filteredProspects.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No se encontraron prospectos
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );

  const renderCardsView = () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredProspects.map((prospect) => (
        <Card key={prospect.id} className="hover-elevate cursor-pointer" onClick={() => navigate(`/external/recruitment/${prospect.id}`)}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base line-clamp-1">
                  {prospect.propertyName || "Sin nombre"}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  {getPropertyTypeLabel(prospect.propertyType)}
                </CardDescription>
              </div>
              {getStatusBadge(prospect.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {prospect.neighborhood && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {prospect.neighborhood}
              </div>
            )}
            {prospect.ownerFirstName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                {prospect.ownerFirstName} {prospect.ownerLastName}
              </div>
            )}
            {prospect.estimatedRentPrice && (
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="w-4 h-4" />
                ${Number(prospect.estimatedRentPrice).toLocaleString()} MXN/mes
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(prospect.createdAt), { addSuffix: true, locale: es })}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/external/recruitment/${prospect.id}`); }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver detalles
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProspect(prospect);
                      setShowInviteDialog(true);
                    }}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Generar invitación
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
      {filteredProspects.length === 0 && (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          No se encontraron prospectos
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">Reclutamiento de Propiedades</h1>
          <p className="text-muted-foreground">Gestiona prospectos de propiedades para reclutamiento</p>
          <CommissionRatesDisplay compact className="mt-2" filterConcepts={['recruitedProperty']} />
        </div>
        <Button onClick={() => setShowNewProspectDialog(true)} data-testid="button-new-prospect">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Propiedad
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, dirección, propietario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {PROSPECT_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("kanban")}
            data-testid="button-view-kanban"
          >
            <Kanban className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("table")}
            data-testid="button-view-table"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "cards" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("cards")}
            data-testid="button-view-cards"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {viewMode === "kanban" && renderKanbanView()}
          {viewMode === "table" && renderTableView()}
          {viewMode === "cards" && renderCardsView()}
        </>
      )}

      <Dialog open={showNewProspectDialog} onOpenChange={setShowNewProspectDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Propiedad Prospecto</DialogTitle>
            <DialogDescription>
              Registra una propiedad para su reclutamiento. Ganarás comisión por referido cuando sea rentada.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="propertyName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Nombre/Referencia de la Propiedad *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Casa Aldea Zamá, Depto Holistika" {...field} data-testid="input-property-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Propiedad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-property-type">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activePropertyTypes.length > 0 ? (
                            activePropertyTypes.map((type) => (
                              <SelectItem key={type.id} value={type.name}>
                                {type.name}
                              </SelectItem>
                            ))
                          ) : (
                            PROPERTY_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="listingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Listado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-listing-type">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rent">Solo Renta</SelectItem>
                          <SelectItem value="sale">Solo Venta</SelectItem>
                          <SelectItem value="both">Renta y Venta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zona/Colonia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-neighborhood">
                            <SelectValue placeholder="Seleccionar zona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeZones.map((zone) => (
                            <SelectItem key={zone.id} value={zone.name}>
                              {zone.name}
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Calle y número" {...field} data-testid="input-address" />
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
                        <Input type="number" placeholder="Ej: 2" {...field} data-testid="input-bedrooms" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Baños</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 1.5" {...field} data-testid="input-bathrooms" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimatedRentPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Renta Estimado (MXN/mes)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ej: 25000" {...field} data-testid="input-rent-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Datos del Propietario (opcional)</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="ownerFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del propietario" {...field} data-testid="input-owner-firstname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ownerLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="Apellido del propietario" {...field} data-testid="input-owner-lastname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ownerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="+52 998 123 4567" {...field} data-testid="input-owner-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ownerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="propietario@email.com" {...field} data-testid="input-owner-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Información adicional sobre la propiedad o el propietario..."
                        rows={3}
                        {...field} 
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowNewProspectDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createProspectMutation.isPending} data-testid="button-submit-prospect">
                  {createProspectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Registrar Prospecto
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar Propietario</DialogTitle>
            <DialogDescription>
              Genera un link de invitación para que el propietario complete su registro.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProspect && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="font-medium">{selectedProspect.propertyName}</div>
                {selectedProspect.ownerFirstName && (
                  <div className="text-sm text-muted-foreground">
                    Propietario: {selectedProspect.ownerFirstName} {selectedProspect.ownerLastName}
                  </div>
                )}
              </div>

              {inviteUrl ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      Link generado exitosamente
                    </div>
                    <div className="flex gap-2">
                      <Input value={inviteUrl} readOnly className="text-xs" />
                      <Button size="icon" variant="outline" onClick={() => copyToClipboard(inviteUrl)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {selectedProspect.ownerPhone && (
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        const message = `Hola ${selectedProspect.ownerFirstName || ''}, le invitamos a registrar su propiedad "${selectedProspect.propertyName}" en nuestro sistema. Haga clic aquí para completar el registro: ${inviteUrl}`;
                        openWhatsApp(selectedProspect.ownerPhone!, message);
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Enviar por WhatsApp
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(inviteUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir link
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => generateInviteMutation.mutate({ id: selectedProspect.id, sentVia: "whatsapp" })}
                    disabled={generateInviteMutation.isPending}
                  >
                    {generateInviteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4 mr-2" />
                    )}
                    WhatsApp
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => generateInviteMutation.mutate({ id: selectedProspect.id, sentVia: "email" })}
                    disabled={generateInviteMutation.isPending}
                  >
                    {generateInviteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Email
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
