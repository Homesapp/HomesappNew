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
  Star,
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
  
  // Colony state
  const [showCreateColonyDialog, setShowCreateColonyDialog] = useState(false);
  const [showEditColonyDialog, setShowEditColonyDialog] = useState(false);
  const [selectedColony, setSelectedColony] = useState<Colony | null>(null);
  const [colonyFormData, setColonyFormData] = useState({ name: "" });
  
  // Amenity state
  const [showCreateAmenityDialog, setShowCreateAmenityDialog] = useState(false);
  const [showEditAmenityDialog, setShowEditAmenityDialog] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [amenityFormData, setAmenityFormData] = useState({ name: "", category: "property" as "property" | "condominium" });
  
  // Property Features state
  const [showCreateFeatureDialog, setShowCreateFeatureDialog] = useState(false);
  const [showEditFeatureDialog, setShowEditFeatureDialog] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [featureFormData, setFeatureFormData] = useState({ name: "", icon: "", active: true });

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

  const { data: propertyFeatures = [], isLoading: loadingFeatures } = useQuery<any[]>({
    queryKey: ["/api/property-features"],
  });

  const pendingColonies = colonies.filter((c) => c.approvalStatus === "pending_review");
  const pendingCondos = allCondominiums.filter((c) => c.approvalStatus === "pending_review");
  const pendingAmenities = amenities.filter((a) => a.approvalStatus === "pending_review");

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

  // Admin Colony CRUD mutations
  const createColonyMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return await apiRequest("POST", "/api/colonies", data);
    },
    onSuccess: () => {
      toast({ title: "Colonia creada", description: "La colonia ha sido creada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/colonies"] });
      setShowCreateColonyDialog(false);
      setColonyFormData({ name: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo crear la colonia", variant: "destructive" });
    },
  });

  const editColonyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/admin/colonies/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Colonia actualizada", description: "La colonia ha sido actualizada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/colonies"] });
      setShowEditColonyDialog(false);
      setSelectedColony(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo actualizar la colonia", variant: "destructive" });
    },
  });

  const deleteColonyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/colonies/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Colonia eliminada", description: "La colonia ha sido eliminada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/colonies"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo eliminar la colonia", variant: "destructive" });
    },
  });

  const toggleColonyActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return await apiRequest("PUT", `/api/admin/colonies/${id}`, { active });
    },
    onSuccess: (_, { active }) => {
      toast({ title: active ? "Colonia activada" : "Colonia suspendida" });
      queryClient.invalidateQueries({ queryKey: ["/api/colonies"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo cambiar el estado", variant: "destructive" });
    },
  });

  // Admin Amenity CRUD mutations
  const createAmenityMutation = useMutation({
    mutationFn: async (data: { name: string; category: "property" | "condominium" }) => {
      return await apiRequest("POST", "/api/amenities", data);
    },
    onSuccess: () => {
      toast({ title: "Amenidad creada", description: "La amenidad ha sido creada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
      setShowCreateAmenityDialog(false);
      setAmenityFormData({ name: "", category: "property" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo crear la amenidad", variant: "destructive" });
    },
  });

  const editAmenityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/admin/amenities/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Amenidad actualizada", description: "La amenidad ha sido actualizada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
      setShowEditAmenityDialog(false);
      setSelectedAmenity(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo actualizar la amenidad", variant: "destructive" });
    },
  });

  const deleteAmenityMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/amenities/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Amenidad eliminada", description: "La amenidad ha sido eliminada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo eliminar la amenidad", variant: "destructive" });
    },
  });

  const toggleAmenityActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return await apiRequest("PUT", `/api/admin/amenities/${id}`, { active });
    },
    onSuccess: (_, { active }) => {
      toast({ title: active ? "Amenidad activada" : "Amenidad suspendida" });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo cambiar el estado", variant: "destructive" });
    },
  });

  // Property Features CRUD mutations
  const createFeatureMutation = useMutation({
    mutationFn: async (data: { name: string; icon?: string; active: boolean }) => {
      return await apiRequest("POST", "/api/property-features", data);
    },
    onSuccess: () => {
      toast({ title: "Característica creada", description: "La característica ha sido creada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/property-features"] });
      setShowCreateFeatureDialog(false);
      setFeatureFormData({ name: "", icon: "", active: true });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo crear la característica", variant: "destructive" });
    },
  });

  const editFeatureMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/property-features/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Característica actualizada", description: "La característica ha sido actualizada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/property-features"] });
      setShowEditFeatureDialog(false);
      setSelectedFeature(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo actualizar la característica", variant: "destructive" });
    },
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/property-features/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Característica eliminada", description: "La característica ha sido eliminada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/property-features"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo eliminar la característica", variant: "destructive" });
    },
  });

  const toggleFeatureActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return await apiRequest("PUT", `/api/property-features/${id}`, { active });
    },
    onSuccess: (_, { active }) => {
      toast({ title: active ? "Característica activada" : "Característica suspendida" });
      queryClient.invalidateQueries({ queryKey: ["/api/property-features"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo cambiar el estado", variant: "destructive" });
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colonies" data-testid="tab-colonies">
            <MapPin className="w-4 h-4 mr-2" />
            {t("admin.suggestions.coloniesTab")} ({colonies.length})
          </TabsTrigger>
          <TabsTrigger value="condominiums" data-testid="tab-condominiums-main">
            <Building2 className="w-4 h-4 mr-2" />
            {t("admin.suggestions.condominiumsTab")} ({filteredCondominiums.length})
          </TabsTrigger>
          <TabsTrigger value="amenities" data-testid="tab-amenities">
            <Sparkles className="w-4 h-4 mr-2" />
            Amenidades ({amenities.length})
          </TabsTrigger>
          <TabsTrigger value="features" data-testid="tab-features">
            <Star className="w-4 h-4 mr-2" />
            Características ({propertyFeatures.length})
          </TabsTrigger>
        </TabsList>

        {/* Colonies Tab */}
        <TabsContent value="colonies" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowCreateColonyDialog(true)} data-testid="button-create-colony">
              <Plus className="w-4 h-4 mr-2" />
              Crear Colonia
            </Button>
          </div>
          
          {loadingColonies ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">{t("common.loading")}</p>
              </CardContent>
            </Card>
          ) : colonies.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center" data-testid="text-no-colonies">
                  No hay colonias registradas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {colonies.map((colony) => (
                <Card key={colony.id} className="hover-elevate" data-testid={`card-colony-${colony.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate" data-testid={`text-colony-name-${colony.id}`}>
                            {colony.name}
                          </CardTitle>
                          {!colony.active && (
                            <Badge variant="destructive" className="mt-1">Suspendida</Badge>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(colony.approvalStatus)}
                    </div>
                    <CardDescription>
                      <div data-testid={`text-colony-date-${colony.id}`} className="text-xs">
                        Creado: {format(new Date(colony.createdAt), "dd/MM/yyyy HH:mm")}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {colony.approvalStatus === "pending_review" && (
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            if (!editedNames[colony.id]) {
                              setEditedNames((prev) => ({ ...prev, [colony.id]: colony.name }));
                            }
                            approveColonyMutation.mutate(colony.id);
                          }}
                          className="flex-1"
                          data-testid={`button-approve-pending-${colony.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => rejectColonyMutation.mutate(colony.id)}
                          className="flex-1"
                          data-testid={`button-reject-pending-${colony.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedColony(colony);
                          setColonyFormData({ name: colony.name });
                          setShowEditColonyDialog(true);
                        }}
                        data-testid={`button-edit-colony-${colony.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`¿Estás seguro de que deseas ${colony.active ? 'suspender' : 'activar'} la colonia "${colony.name}"?`)) {
                            toggleColonyActiveMutation.mutate({ id: colony.id, active: !colony.active });
                          }
                        }}
                        disabled={toggleColonyActiveMutation.isPending}
                        data-testid={`button-toggle-colony-${colony.id}`}
                      >
                        {colony.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`¿Estás seguro de que deseas eliminar la colonia "${colony.name}"? Esta acción no se puede deshacer.`)) {
                            deleteColonyMutation.mutate(colony.id);
                          }
                        }}
                        disabled={deleteColonyMutation.isPending}
                        data-testid={`button-delete-colony-${colony.id}`}
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
              <TabsTrigger value="pending_review" data-testid="tab-pending">
                Pendientes ({allCondominiums.filter(c => c.approvalStatus === "pending_review").length})
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
                        {condominium.approvalStatus === "pending_review" && (
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
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowCreateAmenityDialog(true)} data-testid="button-create-amenity">
              <Plus className="w-4 h-4 mr-2" />
              Crear Amenidad
            </Button>
          </div>
          
          {loadingAmenities ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">{t("common.loading")}</p>
              </CardContent>
            </Card>
          ) : amenities.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center" data-testid="text-no-amenities">
                  No hay amenidades registradas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {amenities.map((amenity) => (
                <Card key={amenity.id} className="hover-elevate" data-testid={`card-amenity-${amenity.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate" data-testid={`text-amenity-name-${amenity.id}`}>
                            {amenity.name}
                          </CardTitle>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!amenity.active && (
                          <Badge variant="destructive">Suspendida</Badge>
                        )}
                        {getStatusBadge(amenity.approvalStatus)}
                      </div>
                    </div>
                    <CardDescription>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {amenity.category === "property" ? "Propiedad" : "Condominio"}
                        </Badge>
                      </div>
                      <div data-testid={`text-amenity-date-${amenity.id}`} className="text-xs mt-1">
                        Creado: {format(new Date(amenity.createdAt), "dd/MM/yyyy HH:mm")}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {amenity.approvalStatus === "pending_review" && (
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            if (!editedNames[amenity.id]) {
                              setEditedNames((prev) => ({ ...prev, [amenity.id]: amenity.name }));
                            }
                            approveAmenityMutation.mutate(amenity.id);
                          }}
                          className="flex-1"
                          data-testid={`button-approve-pending-${amenity.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => rejectAmenityMutation.mutate(amenity.id)}
                          className="flex-1"
                          data-testid={`button-reject-pending-${amenity.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAmenity(amenity);
                          setAmenityFormData({ name: amenity.name, category: amenity.category });
                          setShowEditAmenityDialog(true);
                        }}
                        data-testid={`button-edit-amenity-${amenity.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`¿Estás seguro de que deseas ${amenity.active ? 'suspender' : 'activar'} la amenidad "${amenity.name}"?`)) {
                            toggleAmenityActiveMutation.mutate({ id: amenity.id, active: !amenity.active });
                          }
                        }}
                        disabled={toggleAmenityActiveMutation.isPending}
                        data-testid={`button-toggle-amenity-${amenity.id}`}
                      >
                        {amenity.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`¿Estás seguro de que deseas eliminar la amenidad "${amenity.name}"? Esta acción no se puede deshacer.`)) {
                            deleteAmenityMutation.mutate(amenity.id);
                          }
                        }}
                        disabled={deleteAmenityMutation.isPending}
                        data-testid={`button-delete-amenity-${amenity.id}`}
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

        {/* Property Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowCreateFeatureDialog(true)} data-testid="button-create-feature">
              <Plus className="w-4 h-4 mr-2" />
              Crear Característica
            </Button>
          </div>
          
          {loadingFeatures ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">{t("common.loading")}</p>
              </CardContent>
            </Card>
          ) : propertyFeatures.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center" data-testid="text-no-features">
                  No hay características registradas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {propertyFeatures.map((feature) => (
                <Card key={feature.id} className="hover-elevate" data-testid={`card-feature-${feature.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Star className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate" data-testid={`text-feature-name-${feature.id}`}>
                            {feature.name}
                          </CardTitle>
                          {!feature.active && (
                            <Badge variant="destructive" className="mt-1">Suspendida</Badge>
                          )}
                        </div>
                      </div>
                      {feature.active ? (
                        <Badge variant="default">Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {feature.icon && (
                        <div className="text-xs">
                          Icono: {feature.icon}
                        </div>
                      )}
                      <div data-testid={`text-feature-date-${feature.id}`} className="text-xs mt-1">
                        Creado: {format(new Date(feature.createdAt), "dd/MM/yyyy HH:mm")}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFeature(feature);
                          setFeatureFormData({ name: feature.name, icon: feature.icon || "", active: feature.active });
                          setShowEditFeatureDialog(true);
                        }}
                        data-testid={`button-edit-feature-${feature.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`¿Estás seguro de que deseas ${feature.active ? 'suspender' : 'activar'} la característica "${feature.name}"?`)) {
                            toggleFeatureActiveMutation.mutate({ id: feature.id, active: !feature.active });
                          }
                        }}
                        disabled={toggleFeatureActiveMutation.isPending}
                        data-testid={`button-toggle-feature-${feature.id}`}
                      >
                        {feature.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`¿Estás seguro de que deseas eliminar la característica "${feature.name}"? Esta acción no se puede deshacer.`)) {
                            deleteFeatureMutation.mutate(feature.id);
                          }
                        }}
                        disabled={deleteFeatureMutation.isPending}
                        data-testid={`button-delete-feature-${feature.id}`}
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

      {/* Colony Create Dialog */}
      <Dialog open={showCreateColonyDialog} onOpenChange={setShowCreateColonyDialog}>
        <DialogContent data-testid="dialog-create-colony">
          <DialogHeader>
            <DialogTitle>Crear Nueva Colonia</DialogTitle>
            <DialogDescription>
              Crea una nueva colonia que estará aprobada automáticamente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="colony-name">Nombre *</Label>
              <Input
                id="colony-name"
                value={colonyFormData.name}
                onChange={(e) => setColonyFormData({ ...colonyFormData, name: e.target.value })}
                placeholder="Nombre de la colonia"
                data-testid="input-new-colony-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateColonyDialog(false)} data-testid="button-cancel-create-colony">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!colonyFormData.name.trim()) {
                  toast({ title: "Error", description: "El nombre de la colonia es requerido", variant: "destructive" });
                  return;
                }
                createColonyMutation.mutate({ name: colonyFormData.name });
              }}
              disabled={createColonyMutation.isPending}
              data-testid="button-submit-create-colony"
            >
              Crear Colonia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Colony Edit Dialog */}
      <Dialog open={showEditColonyDialog} onOpenChange={setShowEditColonyDialog}>
        <DialogContent data-testid="dialog-edit-colony">
          <DialogHeader>
            <DialogTitle>Editar Colonia</DialogTitle>
            <DialogDescription>
              Modifica los datos de la colonia
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-colony-name">Nombre *</Label>
              <Input
                id="edit-colony-name"
                value={colonyFormData.name}
                onChange={(e) => setColonyFormData({ ...colonyFormData, name: e.target.value })}
                placeholder="Nombre de la colonia"
                data-testid="input-edit-colony-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditColonyDialog(false)} data-testid="button-cancel-edit-colony">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!selectedColony || !colonyFormData.name.trim()) {
                  toast({ title: "Error", description: "El nombre de la colonia es requerido", variant: "destructive" });
                  return;
                }
                editColonyMutation.mutate({ id: selectedColony.id, data: { name: colonyFormData.name } });
              }}
              disabled={editColonyMutation.isPending}
              data-testid="button-submit-edit-colony"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Amenity Create Dialog */}
      <Dialog open={showCreateAmenityDialog} onOpenChange={setShowCreateAmenityDialog}>
        <DialogContent data-testid="dialog-create-amenity">
          <DialogHeader>
            <DialogTitle>Crear Nueva Amenidad</DialogTitle>
            <DialogDescription>
              Crea una nueva amenidad que estará aprobada automáticamente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amenity-name">Nombre *</Label>
              <Input
                id="amenity-name"
                value={amenityFormData.name}
                onChange={(e) => setAmenityFormData({ ...amenityFormData, name: e.target.value })}
                placeholder="Nombre de la amenidad"
                data-testid="input-new-amenity-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amenity-category">Categoría *</Label>
              <Select
                value={amenityFormData.category}
                onValueChange={(value: "property" | "condominium") => setAmenityFormData({ ...amenityFormData, category: value })}
              >
                <SelectTrigger id="amenity-category" data-testid="select-new-amenity-category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property">Propiedad</SelectItem>
                  <SelectItem value="condominium">Condominio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateAmenityDialog(false)} data-testid="button-cancel-create-amenity">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!amenityFormData.name.trim()) {
                  toast({ title: "Error", description: "El nombre de la amenidad es requerido", variant: "destructive" });
                  return;
                }
                createAmenityMutation.mutate({ name: amenityFormData.name, category: amenityFormData.category });
              }}
              disabled={createAmenityMutation.isPending}
              data-testid="button-submit-create-amenity"
            >
              Crear Amenidad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Amenity Edit Dialog */}
      <Dialog open={showEditAmenityDialog} onOpenChange={setShowEditAmenityDialog}>
        <DialogContent data-testid="dialog-edit-amenity">
          <DialogHeader>
            <DialogTitle>Editar Amenidad</DialogTitle>
            <DialogDescription>
              Modifica los datos de la amenidad
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amenity-name">Nombre *</Label>
              <Input
                id="edit-amenity-name"
                value={amenityFormData.name}
                onChange={(e) => setAmenityFormData({ ...amenityFormData, name: e.target.value })}
                placeholder="Nombre de la amenidad"
                data-testid="input-edit-amenity-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amenity-category">Categoría *</Label>
              <Select
                value={amenityFormData.category}
                onValueChange={(value: "property" | "condominium") => setAmenityFormData({ ...amenityFormData, category: value })}
              >
                <SelectTrigger id="edit-amenity-category" data-testid="select-edit-amenity-category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property">Propiedad</SelectItem>
                  <SelectItem value="condominium">Condominio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditAmenityDialog(false)} data-testid="button-cancel-edit-amenity">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!selectedAmenity || !amenityFormData.name.trim()) {
                  toast({ title: "Error", description: "El nombre de la amenidad es requerido", variant: "destructive" });
                  return;
                }
                editAmenityMutation.mutate({ id: selectedAmenity.id, data: { name: amenityFormData.name, category: amenityFormData.category } });
              }}
              disabled={editAmenityMutation.isPending}
              data-testid="button-submit-edit-amenity"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature Create Dialog */}
      <Dialog open={showCreateFeatureDialog} onOpenChange={setShowCreateFeatureDialog}>
        <DialogContent data-testid="dialog-create-feature">
          <DialogHeader>
            <DialogTitle>Crear Nueva Característica</DialogTitle>
            <DialogDescription>
              Crea una nueva característica de propiedad
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feature-name">Nombre *</Label>
              <Input
                id="feature-name"
                value={featureFormData.name}
                onChange={(e) => setFeatureFormData({ ...featureFormData, name: e.target.value })}
                placeholder="Nombre de la característica"
                data-testid="input-new-feature-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-icon">Icono (opcional)</Label>
              <Input
                id="feature-icon"
                value={featureFormData.icon}
                onChange={(e) => setFeatureFormData({ ...featureFormData, icon: e.target.value })}
                placeholder="Nombre del icono de lucide-react (ej: Home)"
                data-testid="input-new-feature-icon"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFeatureDialog(false)} data-testid="button-cancel-create-feature">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!featureFormData.name.trim()) {
                  toast({ title: "Error", description: "El nombre de la característica es requerido", variant: "destructive" });
                  return;
                }
                createFeatureMutation.mutate({ 
                  name: featureFormData.name, 
                  icon: featureFormData.icon || undefined, 
                  active: true 
                });
              }}
              disabled={createFeatureMutation.isPending}
              data-testid="button-submit-create-feature"
            >
              Crear Característica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature Edit Dialog */}
      <Dialog open={showEditFeatureDialog} onOpenChange={setShowEditFeatureDialog}>
        <DialogContent data-testid="dialog-edit-feature">
          <DialogHeader>
            <DialogTitle>Editar Característica</DialogTitle>
            <DialogDescription>
              Modifica los datos de la característica
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-feature-name">Nombre *</Label>
              <Input
                id="edit-feature-name"
                value={featureFormData.name}
                onChange={(e) => setFeatureFormData({ ...featureFormData, name: e.target.value })}
                placeholder="Nombre de la característica"
                data-testid="input-edit-feature-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-feature-icon">Icono (opcional)</Label>
              <Input
                id="edit-feature-icon"
                value={featureFormData.icon}
                onChange={(e) => setFeatureFormData({ ...featureFormData, icon: e.target.value })}
                placeholder="Nombre del icono de lucide-react (ej: Home)"
                data-testid="input-edit-feature-icon"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditFeatureDialog(false)} data-testid="button-cancel-edit-feature">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!selectedFeature || !featureFormData.name.trim()) {
                  toast({ title: "Error", description: "El nombre de la característica es requerido", variant: "destructive" });
                  return;
                }
                editFeatureMutation.mutate({ 
                  id: selectedFeature.id, 
                  data: { 
                    name: featureFormData.name, 
                    icon: featureFormData.icon || undefined,
                    active: featureFormData.active
                  } 
                });
              }}
              disabled={editFeatureMutation.isPending}
              data-testid="button-submit-edit-feature"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
