import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Clock, FileText, Search, Filter, Home, Building2, MapPin, Bed, Bath, DollarSign, Eye, CheckSquare, XSquare, MoreVertical, Key, User, Lock, Copy, Shield, Star, Trash2, Edit, Calendar, Link2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PropertyInviteDialog } from "@/components/PropertyInviteDialog";
import PropertyEditWizard from "@/components/PropertyEditWizard";
import { useLocation } from "wouter";
import { getPropertyTitle } from "@/lib/propertyHelpers";
import type { Property } from "@shared/schema";

type AccessInfo = 
  | {
      accessType: "unattended";
      method: "lockbox" | "smart_lock";
      lockboxCode?: string;
      lockboxLocation?: string;
      smartLockInstructions?: string;
      smartLockProvider?: string;
    }
  | {
      accessType: "attended";
      contactPerson: string;
      contactPhone: string;
      contactNotes?: string;
    };

type PropertyStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
  inspectionScheduled: number;
  inspectionCompleted: number;
  published: number;
  featured: number;
};

export default function AdminPropertyManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [detailProperty, setDetailProperty] = useState<Property | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);

  // Fetch appointments for selected property
  const { data: propertyAppointments = [] } = useQuery({
    queryKey: ["/api/appointments", detailProperty?.id],
    queryFn: async () => {
      if (!detailProperty?.id) return [];
      const response = await fetch(`/api/appointments?propertyId=${detailProperty.id}`);
      return response.json();
    },
    enabled: !!detailProperty?.id,
  });

  // Filter confirmed appointments with concierges
  const authorizedConcierges = propertyAppointments
    .filter((apt: any) => apt.status === "confirmed" && apt.concierge)
    .map((apt: any) => apt.concierge)
    .filter((concierge: any, index: number, self: any[]) => 
      // Remove duplicates
      self.findIndex((c: any) => c.id === concierge.id) === index
    );

  // Fetch all providers (maintenance/service personnel with general access)
  const { data: allProviders = [] } = useQuery<any[]>({
    queryKey: ["/api", "users", "role", "provider"],
    enabled: !!detailProperty?.id,
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<PropertyStats>({
    queryKey: ["/api/admin/properties/stats"],
  });

  // Fetch properties
  const { data: properties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/admin/properties", selectedStatus, selectedType, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("approvalStatus", selectedStatus);
      if (selectedType !== "all") params.append("propertyType", selectedType);
      if (searchQuery) params.append("q", searchQuery);
      const response = await fetch(`/api/admin/properties?${params}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      // Defensive check: ensure we always return an array
      return Array.isArray(data) ? data : [];
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (propertyId: string) =>
      apiRequest("PATCH", `/api/admin/properties/${propertyId}/approve`, { publish: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      toast({ title: "Propiedad aprobada", description: "La propiedad ha sido aprobada y publicada" });
    },
    onError: (error: any) => {
      console.error("Error approving property:", error);
      const errorMessage = error?.message || error?.toString() || "No se pudo aprobar la propiedad";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  // Publish mutation (for already approved properties)
  const publishMutation = useMutation({
    mutationFn: (propertyId: string) =>
      apiRequest("PATCH", `/api/admin/properties/${propertyId}/publish`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      toast({ title: "Propiedad publicada", description: "La propiedad ahora es visible en el home público" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo publicar la propiedad", variant: "destructive" });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (propertyId: string) =>
      apiRequest("PATCH", `/api/admin/properties/${propertyId}/reject`, { notes: "Rechazada desde panel de administración" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      toast({ title: "Propiedad rechazada", description: "La propiedad ha sido rechazada" });
    },
    onError: (error: any) => {
      console.error("Error rejecting property:", error);
      const errorMessage = error?.message || error?.toString() || "No se pudo rechazar la propiedad";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: (propertyIds: string[]) =>
      apiRequest("PATCH", "/api/admin/properties/bulk-approve", { propertyIds, publish: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      setSelectedProperties([]);
      toast({ title: "Propiedades aprobadas", description: `${selectedProperties.length} propiedades aprobadas` });
    },
    onError: (error: any) => {
      console.error("Error bulk approving properties:", error);
      const errorMessage = error?.message || error?.toString() || "Error al aprobar propiedades en masa";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  // Bulk reject mutation
  const bulkRejectMutation = useMutation({
    mutationFn: (propertyIds: string[]) =>
      apiRequest("PATCH", "/api/admin/properties/bulk-reject", { propertyIds, notes: "Rechazadas desde panel de administración" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      setSelectedProperties([]);
      toast({ title: "Propiedades rechazadas", description: `${selectedProperties.length} propiedades rechazadas` });
    },
    onError: () => {
      toast({ title: "Error", description: "Error al rechazar propiedades en masa", variant: "destructive" });
    },
  });

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ propertyId, featured }: { propertyId: string; featured: boolean }) =>
      apiRequest("PATCH", `/api/admin/properties/${propertyId}/featured`, { featured }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      toast({ 
        title: variables.featured ? "Propiedad destacada" : "Propiedad no destacada", 
        description: variables.featured ? "La propiedad se muestra como destacada" : "La propiedad ya no es destacada" 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el estado destacado", variant: "destructive" });
    },
  });

  // Delete property mutation
  const deleteMutation = useMutation({
    mutationFn: (propertyId: string) =>
      apiRequest("DELETE", `/api/properties/${propertyId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      toast({ title: "Propiedad eliminada", description: "La propiedad ha sido eliminada permanentemente" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo eliminar la propiedad", variant: "destructive" });
    },
  });

  const handleSelectAll = () => {
    if (selectedProperties.length === properties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(properties.map(p => p.id));
    }
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; variant: any; label: string }> = {
      pending: { icon: Clock, variant: "outline", label: "Pendiente" },
      approved: { icon: CheckCircle2, variant: "default", label: "Aprobada" },
      rejected: { icon: XCircle, variant: "destructive", label: "Rechazada" },
      draft: { icon: FileText, variant: "secondary", label: "Borrador" },
      inspection_scheduled: { icon: Clock, variant: "outline", label: "Inspección Programada" },
      inspection_completed: { icon: CheckCircle2, variant: "outline", label: "Inspección Completa" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPropertyTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      house: Home,
      apartment: Building2,
      land: MapPin,
    };
    return icons[type] || Home;
  };

  const [showInviteDialog, setShowInviteDialog] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Propiedades</h1>
          <p className="text-muted-foreground">Administra y aprueba propiedades del sistema</p>
        </div>
        <Button 
          onClick={() => setShowInviteDialog(true)}
          className="gap-2"
          data-testid="button-generate-invitation-link"
        >
          <Link2 className="w-4 h-4" />
          Generar Link de Invitación
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{stats?.pending || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats?.approved || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Publicadas</CardTitle>
                <Eye className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{stats?.published || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Destacadas</CardTitle>
                <Star className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{stats?.featured || 0}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-properties"
                  placeholder="Título, ubicación..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado de Aprobación</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger data-testid="select-approval-status">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending_review">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobada</SelectItem>
                  <SelectItem value="rejected">Rechazada</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="inspection_scheduled">Inspección Programada</SelectItem>
                  <SelectItem value="inspection_completed">Inspección Completa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Propiedad</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger data-testid="select-property-type">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="house">Casa</SelectItem>
                  <SelectItem value="apartment">Departamento</SelectItem>
                  <SelectItem value="land">Terreno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProperties.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  data-testid="checkbox-select-all"
                  checked={selectedProperties.length === properties.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="font-medium">{selectedProperties.length} propiedades seleccionadas</span>
              </div>
              <div className="flex gap-2">
                <Button
                  data-testid="button-bulk-approve"
                  size="sm"
                  onClick={() => bulkApproveMutation.mutate(selectedProperties)}
                  disabled={bulkApproveMutation.isPending}
                  className="gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Aprobar Seleccionadas
                </Button>
                <Button
                  data-testid="button-bulk-reject"
                  size="sm"
                  variant="destructive"
                  onClick={() => bulkRejectMutation.mutate(selectedProperties)}
                  disabled={bulkRejectMutation.isPending}
                  className="gap-2"
                >
                  <XSquare className="w-4 h-4" />
                  Rechazar Seleccionadas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle>Propiedades ({properties.length})</CardTitle>
          <CardDescription>Lista de todas las propiedades en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {propertiesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-lg">
                  <Skeleton className="w-32 h-24 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No hay propiedades</h3>
              <p className="text-muted-foreground">No se encontraron propiedades con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map((property) => {
                const TypeIcon = getPropertyTypeIcon(property.propertyType);
                const coverImage = property.primaryImages?.[0] || property.images?.[0];

                return (
                  <div
                    key={property.id}
                    className="flex gap-4 p-4 border rounded-lg hover-elevate transition-all"
                    data-testid={`property-card-${property.id}`}
                  >
                    <Checkbox
                      data-testid={`checkbox-property-${property.id}`}
                      checked={selectedProperties.includes(property.id)}
                      onCheckedChange={() => handleSelectProperty(property.id)}
                    />

                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={getPropertyTitle(property)}
                        className="w-40 h-28 object-cover rounded-md border"
                        data-testid={`img-property-${property.id}`}
                      />
                    ) : (
                      <div className="w-40 h-28 bg-muted rounded-md flex items-center justify-center border">
                        <TypeIcon className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate" data-testid={`text-property-title-${property.id}`}>
                            {getPropertyTitle(property)}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{property.description}</p>
                        </div>
                        <div className="flex gap-2 items-start">
                          {getStatusBadge(property.approvalStatus)}
                          {property.published && (
                            <Badge variant="outline" className="gap-1">
                              <Eye className="w-3 h-3" />
                              Publicada
                            </Badge>
                          )}
                          {property.featured && (
                            <Badge variant="default">Destacada</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <TypeIcon className="w-4 h-4" />
                          <span className="capitalize">{property.propertyType}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{property.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          <span>{property.bedrooms} hab.</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="w-4 h-4" />
                          <span>{property.bathrooms} baños</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>${parseFloat(property.price).toLocaleString()} MXN</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              data-testid={`button-view-details-${property.id}`}
                              size="sm"
                              variant="outline"
                              onClick={() => setDetailProperty(property)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-2xl">{detailProperty?.title}</DialogTitle>
                              <DialogDescription className="text-base">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {detailProperty?.location}
                                </div>
                              </DialogDescription>
                            </DialogHeader>
                            {detailProperty && (
                              <div className="space-y-6">
                                {/* Image Gallery */}
                                {detailProperty.primaryImages && detailProperty.primaryImages.length > 0 && (
                                  <div className="space-y-3">
                                    <img
                                      src={detailProperty.primaryImages[0]}
                                      alt={detailProperty.title}
                                      className="w-full h-80 object-cover rounded-lg border"
                                    />
                                    {detailProperty.primaryImages.length > 1 && (
                                      <div className="grid grid-cols-5 gap-2">
                                        {detailProperty.primaryImages.slice(1).map((img, idx) => (
                                          <img
                                            key={idx}
                                            src={img}
                                            alt={`${detailProperty.title} - ${idx + 2}`}
                                            className="w-full h-20 object-cover rounded-md border"
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Status Badges */}
                                <div className="flex flex-wrap gap-2">
                                  {getStatusBadge(detailProperty.approvalStatus)}
                                  {detailProperty.published && (
                                    <Badge variant="outline" className="gap-1">
                                      <Eye className="w-3 h-3" />
                                      Publicada
                                    </Badge>
                                  )}
                                  {detailProperty.featured && (
                                    <Badge variant="default">Destacada</Badge>
                                  )}
                                  {detailProperty.petFriendly && (
                                    <Badge variant="secondary">Pet Friendly</Badge>
                                  )}
                                  {detailProperty.allowsSubleasing && (
                                    <Badge variant="secondary">Permite Subarriendo</Badge>
                                  )}
                                </div>

                                {/* Property Info Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-2 mb-1">
                                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                                        <label className="text-xs font-medium text-muted-foreground">Precio Renta</label>
                                      </div>
                                      <p className="text-lg font-bold">${parseFloat(detailProperty.price).toLocaleString()} MXN/mes</p>
                                    </CardContent>
                                  </Card>
                                  {detailProperty.salePrice && (
                                    <Card>
                                      <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                                          <label className="text-xs font-medium text-muted-foreground">Precio Venta</label>
                                        </div>
                                        <p className="text-lg font-bold">${parseFloat(detailProperty.salePrice).toLocaleString()} MXN</p>
                                      </CardContent>
                                    </Card>
                                  )}
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-2 mb-1">
                                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                                        <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                                      </div>
                                      <p className="text-base font-semibold capitalize">{detailProperty.propertyType}</p>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Home className="w-4 h-4 text-muted-foreground" />
                                        <label className="text-xs font-medium text-muted-foreground">Modalidad</label>
                                      </div>
                                      <p className="text-base font-semibold capitalize">
                                        {detailProperty.status === 'rent' ? 'Renta' : detailProperty.status === 'sale' ? 'Venta' : 'Renta/Venta'}
                                      </p>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Property Features */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Características</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div className="flex items-center gap-2">
                                        <Bed className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                          <p className="text-xs text-muted-foreground">Recámaras</p>
                                          <p className="font-semibold">{detailProperty.bedrooms}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Bath className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                          <p className="text-xs text-muted-foreground">Baños</p>
                                          <p className="font-semibold">{detailProperty.bathrooms}</p>
                                        </div>
                                      </div>
                                      {detailProperty.area && (
                                        <div className="flex items-center gap-2">
                                          <Home className="w-5 h-5 text-muted-foreground" />
                                          <div>
                                            <p className="text-xs text-muted-foreground">Área</p>
                                            <p className="font-semibold">{detailProperty.area} m²</p>
                                          </div>
                                        </div>
                                      )}
                                      {detailProperty.condoName && (
                                        <div className="flex items-center gap-2">
                                          <Building className="w-5 h-5 text-muted-foreground" />
                                          <div>
                                            <p className="text-xs text-muted-foreground">Condominio</p>
                                            <p className="font-semibold text-xs">{detailProperty.condoName}</p>
                                            {detailProperty.unitNumber && (
                                              <p className="text-xs text-muted-foreground">Unidad {detailProperty.unitNumber}</p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                {detailProperty.description && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base">Descripción</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="whitespace-pre-wrap text-sm">{detailProperty.description}</p>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Amenities */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Amenidades</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {detailProperty.amenities && detailProperty.amenities.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {detailProperty.amenities.map((amenity, idx) => (
                                          <Badge key={idx} variant="outline" className="gap-1">
                                            <Star className="w-3 h-3" />
                                            {amenity}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No registrado</p>
                                    )}
                                  </CardContent>
                                </Card>

                                {/* Included Services */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Servicios Incluidos</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {detailProperty.includedServices && Object.keys(detailProperty.includedServices).length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {Object.entries(detailProperty.includedServices).map(([key, included]) => 
                                          included ? (
                                            <Badge key={key} variant="secondary" className="gap-1">
                                              <CheckCircle2 className="w-3 h-3" />
                                              {key === 'water' ? 'Agua' :
                                               key === 'electricity' ? 'Luz' :
                                               key === 'internet' ? 'Internet' :
                                               key === 'gas' ? 'Gas' :
                                               key === 'maintenance' ? 'Mantenimiento' :
                                               key === 'security' ? 'Seguridad' :
                                               key === 'cleaning' ? 'Limpieza' :
                                               key === 'parking' ? 'Estacionamiento' : key}
                                            </Badge>
                                          ) : null
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No registrado</p>
                                    )}
                                  </CardContent>
                                </Card>

                                {/* Lease Durations */}
                                {detailProperty.acceptedLeaseDurations && detailProperty.acceptedLeaseDurations.length > 0 && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base">Duraciones de Contrato Aceptadas</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="flex flex-wrap gap-2">
                                        {detailProperty.acceptedLeaseDurations.map((duration, idx) => (
                                          <Badge key={idx} variant="outline">{duration}</Badge>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Availability */}
                                {(detailProperty.availableFrom || detailProperty.availableTo) && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base">Disponibilidad</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-2 gap-4">
                                        {detailProperty.availableFrom && (
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">Disponible desde</p>
                                            <p className="font-medium">{new Date(detailProperty.availableFrom).toLocaleDateString('es-MX')}</p>
                                          </div>
                                        )}
                                        {detailProperty.availableTo && (
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">Disponible hasta</p>
                                            <p className="font-medium">{new Date(detailProperty.availableTo).toLocaleDateString('es-MX')}</p>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Multimedia Links */}
                                {(detailProperty.videos?.length || detailProperty.virtualTourUrl || detailProperty.googleMapsUrl) && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base">Multimedia y Ubicación</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      {detailProperty.videos && detailProperty.videos.length > 0 && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Videos</p>
                                          {detailProperty.videos.map((video, idx) => (
                                            <a key={idx} href={video} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block">
                                              Video {idx + 1}
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                      {detailProperty.virtualTourUrl && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Tour Virtual 360°</p>
                                          <a href={detailProperty.virtualTourUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                            Ver tour virtual
                                          </a>
                                        </div>
                                      )}
                                      {detailProperty.googleMapsUrl && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Ubicación en Google Maps</p>
                                          <a href={detailProperty.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                            Ver en Google Maps
                                          </a>
                                        </div>
                                      )}
                                      {(detailProperty.latitude && detailProperty.longitude) && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Coordenadas GPS</p>
                                          <p className="text-sm font-mono">{detailProperty.latitude}, {detailProperty.longitude}</p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Owner Information */}
                                {(detailProperty.ownerFirstName || detailProperty.ownerLastName || detailProperty.ownerPhone || detailProperty.ownerEmail) && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Información del Propietario
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(detailProperty.ownerFirstName || detailProperty.ownerLastName) && (
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">Nombre</p>
                                            <p className="font-medium">
                                              {[detailProperty.ownerFirstName, detailProperty.ownerLastName].filter(Boolean).join(' ')}
                                            </p>
                                          </div>
                                        )}
                                        {detailProperty.ownerPhone && (
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">Teléfono</p>
                                            <div className="flex items-center gap-2">
                                              <p className="font-medium">{detailProperty.ownerPhone}</p>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(detailProperty.ownerPhone!);
                                                  toast({ title: "Copiado", description: "Teléfono copiado" });
                                                }}
                                              >
                                                <Copy className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                        {detailProperty.ownerEmail && (
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">Email</p>
                                            <div className="flex items-center gap-2">
                                              <p className="font-medium text-sm">{detailProperty.ownerEmail}</p>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(detailProperty.ownerEmail!);
                                                  toast({ title: "Copiado", description: "Email copiado" });
                                                }}
                                              >
                                                <Copy className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Additional Information */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Información Adicional</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                      {detailProperty.colonyName && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Colonia</p>
                                          <p className="font-medium">{detailProperty.colonyName}</p>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Tipo de Unidad</p>
                                        <p className="font-medium capitalize">{detailProperty.unitType || 'Private'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Estado del Propietario</p>
                                        <p className="font-medium capitalize">{detailProperty.ownerStatus || 'active'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Modo de Wizard</p>
                                        <p className="font-medium capitalize">{detailProperty.wizardMode || 'simple'}</p>
                                      </div>
                                      {typeof detailProperty.rating !== 'undefined' && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Calificación</p>
                                          <p className="font-medium">{Number(detailProperty.rating).toFixed(2)} ⭐</p>
                                        </div>
                                      )}
                                      {typeof detailProperty.reviewCount !== 'undefined' && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Total Reseñas</p>
                                          <p className="font-medium">{detailProperty.reviewCount}</p>
                                        </div>
                                      )}
                                      {detailProperty.createdAt && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Fecha de Creación</p>
                                          <p className="font-medium text-xs">{new Date(detailProperty.createdAt).toLocaleString('es-MX')}</p>
                                        </div>
                                      )}
                                      {detailProperty.updatedAt && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Última Actualización</p>
                                          <p className="font-medium text-xs">{new Date(detailProperty.updatedAt).toLocaleString('es-MX')}</p>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Referral Information (if exists) */}
                                {(detailProperty.referredByName || detailProperty.referredByLastName || detailProperty.referredByPhone || detailProperty.referredByEmail) && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base">Información del Referido</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(detailProperty.referredByName || detailProperty.referredByLastName) && (
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">Nombre</p>
                                            <p className="font-medium">
                                              {[detailProperty.referredByName, detailProperty.referredByLastName].filter(Boolean).join(' ')}
                                            </p>
                                          </div>
                                        )}
                                        {detailProperty.referredByPhone && (
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">Teléfono</p>
                                            <div className="flex items-center gap-2">
                                              <p className="font-medium">{detailProperty.referredByPhone}</p>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(detailProperty.referredByPhone!);
                                                  toast({ title: "Copiado", description: "Teléfono copiado" });
                                                }}
                                              >
                                                <Copy className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                        {detailProperty.referredByEmail && (
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">Email</p>
                                            <div className="flex items-center gap-2">
                                              <p className="font-medium text-sm">{detailProperty.referredByEmail}</p>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(detailProperty.referredByEmail!);
                                                  toast({ title: "Copiado", description: "Email copiado" });
                                                }}
                                              >
                                                <Copy className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                        {detailProperty.referralPercent && (
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-1">Porcentaje de Comisión</p>
                                            <p className="font-medium">{detailProperty.referralPercent}%</p>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Specifications */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Especificaciones Técnicas</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {detailProperty.specifications && Object.keys(detailProperty.specifications).length > 0 ? (
                                      <pre className="bg-muted p-3 rounded text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                                        {JSON.stringify(detailProperty.specifications, null, 2)}
                                      </pre>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No registrado</p>
                                    )}
                                  </CardContent>
                                </Card>

                                {/* Access Information Section */}
                                {detailProperty.accessInfo && (
                                  <Card className="border-primary/20">
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2 text-base">
                                        <Shield className="w-4 h-4" />
                                        Información de Acceso (Confidencial)
                                      </CardTitle>
                                      <CardDescription className="text-xs">
                                        Esta información es privada y solo debe compartirse con personal autorizado para citas confirmadas
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      {detailProperty.accessInfo.accessType === "unattended" ? (
                                        <>
                                          <div className="flex items-start gap-2">
                                            <Key className="w-4 h-4 mt-1 text-primary" />
                                            <div className="flex-1">
                                              <div className="text-sm font-medium">Acceso Desatendido</div>
                                              <div className="text-sm text-muted-foreground capitalize">
                                                {detailProperty.accessInfo.method === "lockbox" ? "Lockbox con clave única" : "Cerradura inteligente con clave variable"}
                                              </div>
                                            </div>
                                          </div>

                                          {detailProperty.accessInfo.method === "lockbox" && (
                                            <>
                                              {detailProperty.accessInfo.lockboxCode && (
                                                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                                                  <div>
                                                    <div className="text-xs text-muted-foreground">Código de Lockbox</div>
                                                    <div className="font-mono text-sm font-semibold">{detailProperty.accessInfo.lockboxCode}</div>
                                                  </div>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                      navigator.clipboard.writeText(detailProperty.accessInfo!.accessType === "unattended" ? detailProperty.accessInfo!.lockboxCode || "" : "");
                                                      toast({ title: "Copiado", description: "Código copiado al portapapeles" });
                                                    }}
                                                    data-testid="button-copy-lockbox-code"
                                                  >
                                                    <Copy className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                              )}
                                              {detailProperty.accessInfo.lockboxLocation && (
                                                <div className="text-sm">
                                                  <span className="text-muted-foreground">Ubicación: </span>
                                                  {detailProperty.accessInfo.lockboxLocation}
                                                </div>
                                              )}
                                            </>
                                          )}

                                          {detailProperty.accessInfo.method === "smart_lock" && (
                                            <>
                                              {detailProperty.accessInfo.smartLockProvider && (
                                                <div className="text-sm">
                                                  <span className="text-muted-foreground">Proveedor: </span>
                                                  {detailProperty.accessInfo.smartLockProvider}
                                                </div>
                                              )}
                                              {detailProperty.accessInfo.smartLockInstructions && (
                                                <div className="p-2 bg-muted rounded-md">
                                                  <div className="text-xs text-muted-foreground mb-1">Instrucciones para generar clave:</div>
                                                  <div className="text-sm whitespace-pre-wrap">{detailProperty.accessInfo.smartLockInstructions}</div>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          <div className="flex items-start gap-2">
                                            <User className="w-4 h-4 mt-1 text-primary" />
                                            <div className="flex-1">
                                              <div className="text-sm font-medium">Acceso Asistido</div>
                                              <div className="text-sm text-muted-foreground">Alguien abrirá la propiedad</div>
                                            </div>
                                          </div>

                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                                              <div>
                                                <div className="text-xs text-muted-foreground">Contacto</div>
                                                <div className="text-sm font-semibold">{detailProperty.accessInfo.contactPerson}</div>
                                              </div>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(detailProperty.accessInfo!.accessType === "attended" ? detailProperty.accessInfo!.contactPerson : "");
                                                  toast({ title: "Copiado", description: "Nombre copiado al portapapeles" });
                                                }}
                                                data-testid="button-copy-contact-person"
                                              >
                                                <Copy className="w-4 h-4" />
                                              </Button>
                                            </div>

                                            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                                              <div>
                                                <div className="text-xs text-muted-foreground">Teléfono</div>
                                                <div className="text-sm font-semibold">{detailProperty.accessInfo.contactPhone}</div>
                                              </div>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(detailProperty.accessInfo!.accessType === "attended" ? detailProperty.accessInfo!.contactPhone : "");
                                                  toast({ title: "Copiado", description: "Teléfono copiado al portapapeles" });
                                                }}
                                                data-testid="button-copy-contact-phone"
                                              >
                                                <Copy className="w-4 h-4" />
                                              </Button>
                                            </div>

                                            {detailProperty.accessInfo.contactNotes && (
                                              <div className="p-2 bg-muted rounded-md">
                                                <div className="text-xs text-muted-foreground mb-1">Notas adicionales:</div>
                                                <div className="text-sm whitespace-pre-wrap">{detailProperty.accessInfo.contactNotes}</div>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Authorized Personnel Section */}
                                {detailProperty.accessInfo && (authorizedConcierges.length > 0 || allProviders.length > 0) && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2 text-base">
                                        <User className="w-4 h-4" />
                                        Personal Autorizado con Acceso
                                      </CardTitle>
                                      <CardDescription className="text-xs">
                                        Personal que puede acceder a las credenciales de la propiedad
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      {/* Concierges Section */}
                                      {authorizedConcierges.length > 0 && (
                                        <div>
                                          <h4 className="text-sm font-semibold mb-2">Conserjes (con citas confirmadas)</h4>
                                          <div className="space-y-2">
                                            {authorizedConcierges.map((concierge: any) => (
                                              <div key={concierge.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                                <div>
                                                  <div className="text-sm font-semibold">
                                                    {concierge.firstName} {concierge.lastName}
                                                  </div>
                                                  <div className="text-xs text-muted-foreground">{concierge.email}</div>
                                                </div>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(concierge.email);
                                                    toast({ title: "Copiado", description: "Email copiado al portapapeles" });
                                                  }}
                                                  data-testid={`button-copy-concierge-${concierge.id}`}
                                                >
                                                  <Copy className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Providers Section */}
                                      {allProviders.length > 0 && (
                                        <div>
                                          <h4 className="text-sm font-semibold mb-2">Personal de Servicio / Mantenimiento (acceso general)</h4>
                                          <div className="space-y-2">
                                            {allProviders.map((provider: any) => (
                                              <div key={provider.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                                <div>
                                                  <div className="text-sm font-semibold">
                                                    {provider.firstName} {provider.lastName}
                                                  </div>
                                                  <div className="text-xs text-muted-foreground">{provider.email}</div>
                                                </div>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(provider.email);
                                                    toast({ title: "Copiado", description: "Email copiado al portapapeles" });
                                                  }}
                                                  data-testid={`button-copy-provider-${provider.id}`}
                                                >
                                                  <Copy className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          data-testid={`button-edit-${property.id}`}
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPropertyToEdit(property);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>

                        <Button
                          data-testid={`button-schedule-${property.id}`}
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/admin/appointments/new?propertyId=${property.id}`)}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Agendar
                        </Button>

                        <Button
                          data-testid={`button-delete-${property.id}`}
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setPropertyToDelete(property);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>

                        {property.approvalStatus === "pending_review" && (
                          <>
                            <Button
                              data-testid={`button-approve-${property.id}`}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                approveMutation.mutate(property.id);
                              }}
                              disabled={approveMutation.isPending}
                              className="gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Aprobar
                            </Button>
                            <Button
                              data-testid={`button-reject-${property.id}`}
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                rejectMutation.mutate(property.id);
                              }}
                              disabled={rejectMutation.isPending}
                              className="gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Rechazar
                            </Button>
                          </>
                        )}
                        {property.approvalStatus === "approved" && !property.published && (
                          <Button
                            data-testid={`button-publish-${property.id}`}
                            size="sm"
                            onClick={() => publishMutation.mutate(property.id)}
                            disabled={publishMutation.isPending}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Publicar
                          </Button>
                        )}
                        {(property.approvalStatus === "approved" || property.published) && (
                          <Button
                            data-testid={`button-featured-${property.id}`}
                            size="sm"
                            variant={property.featured ? "default" : "outline"}
                            onClick={() => toggleFeaturedMutation.mutate({ 
                              propertyId: property.id, 
                              featured: !property.featured 
                            })}
                            disabled={toggleFeaturedMutation.isPending}
                            className="gap-2"
                          >
                            <Star className={`w-4 h-4 ${property.featured ? "fill-current" : ""}`} />
                            {property.featured ? "Destacada" : "Destacar"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-property">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="dialog-delete-title">
              ¿Eliminar propiedad?
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="dialog-delete-description">
              Esta acción no se puede deshacer. Se eliminará permanentemente la propiedad "{propertyToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={() => {
                if (propertyToDelete) {
                  deleteMutation.mutate(propertyToDelete.id);
                  setDeleteDialogOpen(false);
                  setPropertyToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Property Wizard */}
      {propertyToEdit && (
        <PropertyEditWizard
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          property={propertyToEdit}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
            // Clear after successful save and queries invalidated
            setPropertyToEdit(null);
          }}
        />
      )}

      {/* Property Invite Dialog */}
      <PropertyInviteDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />
    </div>
  );
}
