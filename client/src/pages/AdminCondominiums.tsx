import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff,
  MapPin,
  Home,
  Eye,
  AlertTriangle,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import type { Condominium, Colony, Amenity } from "@shared/schema";
import { format } from "date-fns";

type CondominiumStatus = "pending" | "approved" | "rejected";

interface CondominiumWithUser extends Omit<Condominium, 'requestedBy'> {
  requestedBy?: { email: string; name?: string } | string | null;
}

interface CondominiumStats extends CondominiumWithUser {
  propertiesCount?: number;
}

export default function AdminCondominiums() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeMainTab, setActiveMainTab] = useState("condominiums");
  const [selectedCondominium, setSelectedCondominium] = useState<CondominiumStats | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [statusFilter, setStatusFilter] = useState<CondominiumStatus | "all">("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newCondominiumName, setNewCondominiumName] = useState("");
  const [newCondominiumZone, setNewCondominiumZone] = useState("");
  const [newCondominiumAddress, setNewCondominiumAddress] = useState("");
  const [editData, setEditData] = useState({ name: "", zone: "", address: "" });
  const [showDuplicatesDialog, setShowDuplicatesDialog] = useState(false);
  const [editedNames, setEditedNames] = useState<Record<string, string>>({});

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/condominiums-stats"],
  });

  const { data: allCondominiums = [], isLoading: loadingCondos } = useQuery<CondominiumStats[]>({
    queryKey: ["/api/condominiums"],
    select: (data) => {
      if (stats?.condominiums) {
        return data.map(condo => {
          const stat = stats.condominiums.find((s: any) => s.id === condo.id);
          return { ...condo, propertiesCount: stat?.propertiesCount || 0 };
        });
      }
      return data;
    },
  });

  const { data: colonies = [], isLoading: loadingColonies } = useQuery<Colony[]>({
    queryKey: ["/api/colonies"],
  });

  const { data: amenities = [], isLoading: loadingAmenities } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities"],
  });

  const pendingColonies = colonies.filter((c) => c.approvalStatus === "pending");
  const pendingCondos = allCondominiums.filter((c) => c.approvalStatus === "pending");
  const pendingAmenities = amenities.filter((a) => a.approvalStatus === "pending");

  const zones = Array.from(new Set(allCondominiums.map(c => c.zone).filter(Boolean))) as string[];

  const filteredCondominiums = allCondominiums.filter(condo => {
    const matchesStatus = statusFilter === "all" || condo.approvalStatus === statusFilter;
    const matchesZone = zoneFilter === "all" || condo.zone === zoneFilter;
    const matchesSearch = !searchQuery || 
      condo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (condo.zone && condo.zone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (condo.address && condo.address.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesZone && matchesSearch;
  });

  // Colony mutations
  const approveColonyMutation = useMutation({
    mutationFn: async (id: string) => {
      const name = editedNames[id];
      return await apiRequest("PATCH", `/api/admin/colonies/${id}/approve`, { name });
    },
    onSuccess: (_, id) => {
      toast({ title: t("admin.suggestions.approveSuccess") });
      setEditedNames((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/colonies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/colonies/approved"] });
    },
    onError: () => {
      toast({ title: t("admin.suggestions.approveError"), variant: "destructive" });
    },
  });

  const rejectColonyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/admin/colonies/${id}/reject`, {});
    },
    onSuccess: () => {
      toast({ title: t("admin.suggestions.rejectSuccess") });
      queryClient.invalidateQueries({ queryKey: ["/api/colonies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/colonies/approved"] });
    },
    onError: () => {
      toast({ title: t("admin.suggestions.rejectError"), variant: "destructive" });
    },
  });

  // Amenity mutations
  const approveAmenityMutation = useMutation({
    mutationFn: async (id: string) => {
      const name = editedNames[id];
      return await apiRequest("PATCH", `/api/admin/amenities/${id}/approve`, { name });
    },
    onSuccess: (_, id) => {
      toast({ title: t("admin.suggestions.approveSuccess") });
      setEditedNames((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities/approved", "property"] });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities/approved", "condo"] });
    },
    onError: () => {
      toast({ title: t("admin.suggestions.approveError"), variant: "destructive" });
    },
  });

  const rejectAmenityMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/admin/amenities/${id}/reject`, {});
    },
    onSuccess: () => {
      toast({ title: t("admin.suggestions.rejectSuccess") });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities/approved", "property"] });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities/approved", "condo"] });
    },
    onError: () => {
      toast({ title: t("admin.suggestions.rejectError"), variant: "destructive" });
    },
  });

  // Condominium mutations
  const approveCondoMutation = useMutation({
    mutationFn: async (id: string) => {
      const name = editedNames[id];
      return apiRequest("PATCH", `/api/admin/condominiums/${id}/approve`, name ? { name } : {});
    },
    onSuccess: (_, id) => {
      toast({
        title: "Condominio aprobado",
        description: "El condominio ha sido aprobado exitosamente",
      });
      setEditedNames((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/condominiums-stats"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar el condominio",
        variant: "destructive",
      });
    },
  });

  const rejectCondoMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/condominiums/${id}/reject`, {});
    },
    onSuccess: () => {
      toast({
        title: "Condominio rechazado",
        description: "El condominio ha sido rechazado",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/condominiums-stats"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar el condominio",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; zone?: string; address?: string }) => {
      return apiRequest("POST", "/api/condominiums", data);
    },
    onSuccess: () => {
      toast({
        title: "Condominio creado",
        description: "El condominio ha sido creado y está pendiente de aprobación",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/condominiums-stats"] });
      setShowCreateDialog(false);
      setNewCondominiumName("");
      setNewCondominiumZone("");
      setNewCondominiumAddress("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el condominio",
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/admin/condominiums/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Condominio actualizado",
        description: "El condominio ha sido actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/condominiums-stats"] });
      setShowEditDialog(false);
      setSelectedCondominium(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el condominio",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return apiRequest("PATCH", `/api/admin/condominiums/${id}/toggle-active`, { active });
    },
    onSuccess: (_, { active }) => {
      toast({
        title: active ? "Condominio activado" : "Condominio suspendido",
        description: `El condominio ha sido ${active ? 'activado' : 'suspendido'} exitosamente`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/condominiums-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el estado del condominio",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/condominiums/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Condominio eliminado",
        description: "El condominio ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/condominiums-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el condominio",
        variant: "destructive",
      });
    },
  });

  const { data: duplicates, refetch: refetchDuplicates } = useQuery({
    queryKey: ["/api/admin/condominiums/duplicates/list"],
    enabled: false,
  });

  const removeDuplicatesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/admin/condominiums/duplicates/remove`, {});
    },
    onSuccess: (data: any) => {
      toast({
        title: "Duplicados eliminados",
        description: `Se eliminaron ${data.deletedCount} condominios duplicados exitosamente`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/condominiums-stats"] });
      setShowDuplicatesDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron eliminar los duplicados",
        variant: "destructive",
      });
    },
  });

  const handleOpenReview = (condominium: CondominiumStats, action: "approve" | "reject") => {
    setSelectedCondominium(condominium);
    setReviewAction(action);
  };

  const handleCloseDialog = () => {
    setSelectedCondominium(null);
    setReviewAction(null);
  };

  const handleSubmitReview = () => {
    if (!selectedCondominium) return;

    if (reviewAction === "approve") {
      approveCondoMutation.mutate(selectedCondominium.id);
    } else if (reviewAction === "reject") {
      rejectCondoMutation.mutate(selectedCondominium.id);
    }
  };

  const handleCreateCondominium = () => {
    if (!newCondominiumName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del condominio es requerido",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({
      name: newCondominiumName,
      zone: newCondominiumZone || undefined,
      address: newCondominiumAddress || undefined,
    });
  };

  const handleOpenEdit = (condominium: CondominiumStats) => {
    setSelectedCondominium(condominium);
    setEditData({
      name: condominium.name,
      zone: condominium.zone || "",
      address: condominium.address || "",
    });
    setShowEditDialog(true);
  };

  const handleSubmitEdit = () => {
    if (!selectedCondominium) return;
    if (!editData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del condominio es requerido",
        variant: "destructive",
      });
      return;
    }
    editMutation.mutate({
      id: selectedCondominium.id,
      data: {
        name: editData.name,
        zone: editData.zone || undefined,
        address: editData.address || undefined,
      },
    });
  };

  const handleToggleActive = (condominium: CondominiumStats) => {
    const newActive = !condominium.active;
    if (confirm(`¿Estás seguro de que deseas ${newActive ? 'activar' : 'suspender'} el condominio "${condominium.name}"?`)) {
      toggleActiveMutation.mutate({ id: condominium.id, active: newActive });
    }
  };

  const handleDelete = (condominium: CondominiumStats) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el condominio "${condominium.name}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(condominium.id);
    }
  };

  const handleCheckDuplicates = async () => {
    await refetchDuplicates();
    setShowDuplicatesDialog(true);
  };

  const handleRemoveDuplicates = () => {
    removeDuplicatesMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "default", icon: Clock, label: "Pendiente" },
      approved: { variant: "default", icon: CheckCircle2, label: "Aprobado" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rechazado" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1" data-testid={`badge-status-${status}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loadingCondos && activeMainTab === "condominiums") {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-condominiums">Gestión de Sugerencias y Condominios</h1>
          <p className="text-muted-foreground">
            Administra colonias, condominios y amenidades del sistema
          </p>
        </div>
        {activeMainTab === "condominiums" && (
          <div className="flex gap-2">
            <Button
              onClick={handleCheckDuplicates}
              variant="outline"
              data-testid="button-check-duplicates"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Verificar Duplicados
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              data-testid="button-create-condominium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Condominio
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colonies" data-testid="tab-colonies">
            <MapPin className="w-4 h-4 mr-2" />
            {t("admin.suggestions.coloniesTab")} ({pendingColonies.length})
          </TabsTrigger>
          <TabsTrigger value="condominiums" data-testid="tab-condominiums-main">
            <Building2 className="w-4 h-4 mr-2" />
            {t("admin.suggestions.condominiumsTab")} ({filteredCondominiums.length})
          </TabsTrigger>
          <TabsTrigger value="amenities" data-testid="tab-amenities">
            <Sparkles className="w-4 h-4 mr-2" />
            Amenidades ({pendingAmenities.length})
          </TabsTrigger>
        </TabsList>

        {/* Colonies Tab */}
        <TabsContent value="colonies" className="space-y-4">
          {loadingColonies ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">{t("common.loading")}</p>
              </CardContent>
            </Card>
          ) : pendingColonies.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center" data-testid="text-no-colonies">
                  {t("admin.suggestions.noColonies")}
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingColonies.map((colony) => (
              <Card key={colony.id} data-testid={`card-colony-${colony.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <Input
                        value={editedNames[colony.id] ?? colony.name}
                        onChange={(e) => setEditedNames((prev) => ({ ...prev, [colony.id]: e.target.value }))}
                        placeholder="Nombre de la colonia"
                        data-testid={`input-colony-name-${colony.id}`}
                      />
                      <CardDescription>
                        <span className="text-sm">
                          {t("admin.suggestions.requestedBy")}{" "}
                          <span className="font-medium">{colony.requestedBy || "N/A"}</span>
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-status-${colony.id}`}>
                      {t("common.pending")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => rejectColonyMutation.mutate(colony.id)}
                      disabled={rejectColonyMutation.isPending}
                      data-testid={`button-reject-colony-${colony.id}`}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t("admin.suggestions.rejectButton")}
                    </Button>
                    <Button
                      onClick={() => approveColonyMutation.mutate(colony.id)}
                      disabled={approveColonyMutation.isPending}
                      data-testid={`button-approve-colony-${colony.id}`}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {t("admin.suggestions.approveButton")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Condominiums Tab */}
        <TabsContent value="condominiums" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Nombre, zona o dirección..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zone-filter">Zona</Label>
                  <Select value={zoneFilter} onValueChange={setZoneFilter}>
                    <SelectTrigger id="zone-filter" data-testid="select-zone-filter">
                      <SelectValue placeholder="Todas las zonas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las zonas</SelectItem>
                      {zones.map((zone) => (
                        <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all">
                Todos ({allCondominiums.length})
              </TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending">
                Pendientes ({allCondominiums.filter(c => c.approvalStatus === "pending").length})
              </TabsTrigger>
              <TabsTrigger value="approved" data-testid="tab-approved">
                Aprobados ({allCondominiums.filter(c => c.approvalStatus === "approved").length})
              </TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected">
                Rechazados ({allCondominiums.filter(c => c.approvalStatus === "rejected").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="mt-6">
              {filteredCondominiums.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground" data-testid="text-no-condominiums">
                      No hay condominios {statusFilter !== "all" ? `en estado "${statusFilter}"` : ""} que coincidan con los filtros
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCondominiums.map((condominium) => (
                    <Card key={condominium.id} className="hover-elevate" data-testid={`card-condominium-${condominium.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate" data-testid={`text-condominium-name-${condominium.id}`}>
                                {condominium.name}
                              </CardTitle>
                              {!condominium.active && (
                                <Badge variant="destructive" className="mt-1">Suspendido</Badge>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(condominium.approvalStatus)}
                        </div>
                        <CardDescription className="space-y-1">
                          {condominium.zone && (
                            <div className="flex items-center gap-1 text-xs">
                              <MapPin className="w-3 h-3" />
                              <span data-testid={`text-zone-${condominium.id}`}>{condominium.zone}</span>
                            </div>
                          )}
                          {condominium.address && (
                            <div className="text-xs truncate" data-testid={`text-address-${condominium.id}`}>
                              {condominium.address}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs">
                            <Home className="w-3 h-3" />
                            <span data-testid={`text-properties-count-${condominium.id}`}>
                              {condominium.propertiesCount || 0} {(condominium.propertiesCount || 0) === 1 ? 'propiedad' : 'propiedades'}
                            </span>
                          </div>
                          <div data-testid={`text-condominium-date-${condominium.id}`} className="text-xs">
                            Creado: {format(new Date(condominium.createdAt), "dd/MM/yyyy HH:mm")}
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {condominium.approvalStatus === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleOpenReview(condominium, "approve")}
                              className="flex-1"
                              data-testid={`button-approve-${condominium.id}`}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleOpenReview(condominium, "reject")}
                              className="flex-1"
                              data-testid={`button-reject-${condominium.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Link href={`/admin/condominiums/${condominium.id}`} asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              data-testid={`button-view-${condominium.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalles
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(condominium)}
                            data-testid={`button-edit-${condominium.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(condominium)}
                            disabled={toggleActiveMutation.isPending}
                            data-testid={`button-toggle-active-${condominium.id}`}
                          >
                            {condominium.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(condominium)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${condominium.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Amenities Tab */}
        <TabsContent value="amenities" className="space-y-4">
          {loadingAmenities ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">{t("common.loading")}</p>
              </CardContent>
            </Card>
          ) : pendingAmenities.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center" data-testid="text-no-amenities">
                  No hay amenidades pendientes
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingAmenities.map((amenity) => (
              <Card key={amenity.id} data-testid={`card-amenity-${amenity.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <Input
                        value={editedNames[amenity.id] ?? amenity.name}
                        onChange={(e) => setEditedNames((prev) => ({ ...prev, [amenity.id]: e.target.value }))}
                        placeholder="Nombre de la amenidad"
                        data-testid={`input-amenity-name-${amenity.id}`}
                      />
                      <CardDescription>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">
                            {t("admin.suggestions.requestedBy")}{" "}
                            <span className="font-medium">{amenity.requestedBy || "N/A"}</span>
                          </span>
                          <Badge variant="outline" className="capitalize">
                            {amenity.category === "property" ? "Propiedad" : "Condominio"}
                          </Badge>
                        </div>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-status-${amenity.id}`}>
                      {t("common.pending")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => rejectAmenityMutation.mutate(amenity.id)}
                      disabled={rejectAmenityMutation.isPending}
                      data-testid={`button-reject-amenity-${amenity.id}`}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t("admin.suggestions.rejectButton")}
                    </Button>
                    <Button
                      onClick={() => approveAmenityMutation.mutate(amenity.id)}
                      disabled={approveAmenityMutation.isPending}
                      data-testid={`button-approve-amenity-${amenity.id}`}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {t("admin.suggestions.approveButton")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!selectedCondominium && !!reviewAction} onOpenChange={handleCloseDialog}>
        <DialogContent data-testid="dialog-review-condominium">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Aprobar Condominio" : "Rechazar Condominio"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve" 
                ? `¿Estás seguro de que deseas aprobar el condominio "${selectedCondominium?.name}"?`
                : `¿Estás seguro de que deseas rechazar el condominio "${selectedCondominium?.name}"?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              data-testid="button-cancel-review"
            >
              Cancelar
            </Button>
            <Button
              variant={reviewAction === "approve" ? "default" : "destructive"}
              onClick={handleSubmitReview}
              disabled={approveCondoMutation.isPending || rejectCondoMutation.isPending}
              data-testid="button-confirm-review"
            >
              {reviewAction === "approve" ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent data-testid="dialog-create-condominium">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Condominio</DialogTitle>
            <DialogDescription>
              Crea un nuevo condominio que estará pendiente de aprobación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nombre *</Label>
              <Input
                id="new-name"
                value={newCondominiumName}
                onChange={(e) => setNewCondominiumName(e.target.value)}
                placeholder="Nombre del condominio"
                data-testid="input-new-condominium-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-zone">Zona</Label>
              <Input
                id="new-zone"
                value={newCondominiumZone}
                onChange={(e) => setNewCondominiumZone(e.target.value)}
                placeholder="Zona del condominio"
                data-testid="input-new-condominium-zone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-address">Dirección</Label>
              <Input
                id="new-address"
                value={newCondominiumAddress}
                onChange={(e) => setNewCondominiumAddress(e.target.value)}
                placeholder="Dirección del condominio"
                data-testid="input-new-condominium-address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              data-testid="button-cancel-create"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCondominium}
              disabled={createMutation.isPending}
              data-testid="button-submit-create"
            >
              Crear Condominio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent data-testid="dialog-edit-condominium">
          <DialogHeader>
            <DialogTitle>Editar Condominio</DialogTitle>
            <DialogDescription>
              Actualiza la información del condominio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre *</Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Nombre del condominio"
                data-testid="input-edit-condominium-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-zone">Zona</Label>
              <Input
                id="edit-zone"
                value={editData.zone}
                onChange={(e) => setEditData({ ...editData, zone: e.target.value })}
                placeholder="Zona del condominio"
                data-testid="input-edit-condominium-zone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Dirección</Label>
              <Input
                id="edit-address"
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                placeholder="Dirección del condominio"
                data-testid="input-edit-condominium-address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              data-testid="button-cancel-edit"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={editMutation.isPending}
              data-testid="button-submit-edit"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicates Dialog */}
      <Dialog open={showDuplicatesDialog} onOpenChange={setShowDuplicatesDialog}>
        <DialogContent data-testid="dialog-duplicates">
          <DialogHeader>
            <DialogTitle>Condominios Duplicados</DialogTitle>
            <DialogDescription>
              {duplicates && duplicates.length > 0
                ? `Se encontraron ${duplicates.length} condominios duplicados`
                : "No se encontraron condominios duplicados"
              }
            </DialogDescription>
          </DialogHeader>
          {duplicates && duplicates.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {duplicates.map((dup: any, index: number) => (
                <div key={index} className="p-2 border rounded text-sm">
                  <div className="font-medium">{dup.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {dup.count} duplicados
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDuplicatesDialog(false)}
              data-testid="button-cancel-duplicates"
            >
              Cancelar
            </Button>
            {duplicates && duplicates.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleRemoveDuplicates}
                disabled={removeDuplicatesMutation.isPending}
                data-testid="button-remove-duplicates"
              >
                Eliminar Duplicados
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
