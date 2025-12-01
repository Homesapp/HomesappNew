import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { 
  Plus, 
  Trash2,
  GripVertical,
  Search,
  Star,
  Home,
  BedDouble,
  Bath,
  MapPin,
  DollarSign,
  Building2,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from "lucide-react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FeaturedProperty {
  id: string;
  unitId: string;
  sortOrder: number;
  addedBy: number | null;
  createdAt: string;
  unitNumber: string | null;
  title: string | null;
  propertyType: string | null;
  zone: string | null;
  price: number | null;
  salePrice: number | null;
  listingType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  condominiumId: string | null;
  images: string[] | null;
  agencyId: string | null;
  publishStatus: string | null;
  condominiumName: string | null;
}

interface FeaturedPropertiesResponse {
  data: FeaturedProperty[];
  count: number;
  maxLimit: number;
  remainingSlots: number;
}

interface AvailableUnit {
  id: string;
  unitNumber: string;
  title: string | null;
  propertyType: string;
  zone: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  condominiumName: string | null;
  agencyName: string | null;
}

interface AvailableUnitsResponse {
  data: AvailableUnit[];
  count: number;
}

function SortableRow({ item, onRemove, language }: { 
  item: FeaturedProperty; 
  onRemove: (id: string) => void;
  language: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "-";
    return new Intl.NumberFormat(language === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <TableRow ref={setNodeRef} style={style} data-testid={`row-featured-${item.id}`}>
      <TableCell className="w-8">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1"
          data-testid={`button-drag-${item.id}`}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="font-medium" data-testid={`text-order-${item.id}`}>
        {item.sortOrder}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {item.images && item.images.length > 0 ? (
            <img
              src={item.images[0]}
              alt={item.title || item.unitNumber || "Property"}
              className="w-12 h-12 object-cover rounded-md"
            />
          ) : (
            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
              <Home className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <div className="font-medium" data-testid={`text-title-${item.id}`}>
              {item.title || item.unitNumber || "-"}
            </div>
            <div className="text-sm text-muted-foreground">
              {item.condominiumName || item.zone || "-"}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{item.propertyType || "-"}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {item.bedrooms !== null && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" />
              {item.bedrooms}
            </span>
          )}
          {item.bathrooms !== null && (
            <span className="flex items-center gap-1">
              <Bath className="h-3 w-3" />
              {item.bathrooms}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell data-testid={`text-price-${item.id}`}>
        {formatPrice(item.price)}
      </TableCell>
      <TableCell>
        <Badge 
          variant={item.publishStatus === "approved" ? "default" : "secondary"}
        >
          {item.publishStatus || "unknown"}
        </Badge>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          data-testid={`button-remove-${item.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function AdminFeaturedProperties() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const locale = language === "es" ? es : enUS;
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedRemoveId, setSelectedRemoveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { 
    data: featuredData, 
    isLoading: isLoadingFeatured,
    refetch: refetchFeatured 
  } = useQuery<FeaturedPropertiesResponse>({
    queryKey: ["/api/featured-properties"],
  });

  const { 
    data: availableData, 
    isLoading: isLoadingAvailable 
  } = useQuery<AvailableUnitsResponse>({
    queryKey: ["/api/featured-properties/available-units", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/featured-properties/available-units?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch available units");
      return res.json();
    },
    enabled: isAddDialogOpen,
  });

  const addMutation = useMutation({
    mutationFn: async (unitId: string) => {
      return apiRequest("/api/featured-properties", "POST", { unitId });
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "Propiedad destacada" : "Property featured",
        description: language === "es" 
          ? "La propiedad ha sido agregada a destacadas"
          : "The property has been added to featured",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-properties"] });
      setIsAddDialogOpen(false);
      setSelectedUnitId(null);
      setSearchQuery("");
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo agregar la propiedad"
          : "Failed to add the property"),
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/featured-properties/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "Propiedad removida" : "Property removed",
        description: language === "es" 
          ? "La propiedad ha sido removida de destacadas"
          : "The property has been removed from featured",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-properties"] });
      setIsRemoveDialogOpen(false);
      setSelectedRemoveId(null);
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo remover la propiedad"
          : "Failed to remove the property"),
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newSortOrder }: { id: string; newSortOrder: number }) => {
      return apiRequest(`/api/featured-properties/${id}`, "PATCH", { sortOrder: newSortOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/featured-properties"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo reordenar"
          : "Failed to reorder"),
        variant: "destructive",
      });
      refetchFeatured();
    },
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !featuredData?.data) return;
    
    const oldIndex = featuredData.data.findIndex(item => item.id === active.id);
    const newIndex = featuredData.data.findIndex(item => item.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newOrder = arrayMove(featuredData.data, oldIndex, newIndex);
    
    queryClient.setQueryData(["/api/featured-properties"], {
      ...featuredData,
      data: newOrder.map((item, index) => ({ ...item, sortOrder: index + 1 })),
    });
    
    reorderMutation.mutate({ 
      id: active.id as string, 
      newSortOrder: newIndex + 1 
    });
  }, [featuredData, reorderMutation]);

  const handleRemoveClick = (id: string) => {
    setSelectedRemoveId(id);
    setIsRemoveDialogOpen(true);
  };

  const handleAddProperty = () => {
    if (selectedUnitId) {
      addMutation.mutate(selectedUnitId);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "-";
    return new Intl.NumberFormat(language === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const featured = featuredData?.data || [];
  const remainingSlots = featuredData?.remainingSlots || 30;
  const canAddMore = remainingSlots > 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            {language === "es" ? "Propiedades Destacadas" : "Featured Properties"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "es" 
              ? "Administra las propiedades que aparecen en la sección destacada del portal público"
              : "Manage properties that appear in the featured section of the public portal"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchFeatured()}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {language === "es" ? "Actualizar" : "Refresh"}
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            disabled={!canAddMore}
            data-testid="button-add-featured"
          >
            <Plus className="h-4 w-4 mr-2" />
            {language === "es" ? "Agregar Propiedad" : "Add Property"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                {language === "es" ? "Lista de Propiedades Destacadas" : "Featured Properties List"}
              </CardTitle>
              <CardDescription className="mt-1">
                {language === "es" 
                  ? "Arrastra las filas para cambiar el orden de visualización"
                  : "Drag rows to change display order"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm" data-testid="badge-count">
                {featured.length} / 30
              </Badge>
              {remainingSlots > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {remainingSlots} {language === "es" ? "disponibles" : "available"}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingFeatured ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>
                {language === "es" 
                  ? "No hay propiedades destacadas aún"
                  : "No featured properties yet"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
                data-testid="button-add-first"
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === "es" ? "Agregar primera propiedad" : "Add first property"}
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>{language === "es" ? "Propiedad" : "Property"}</TableHead>
                    <TableHead>{language === "es" ? "Tipo" : "Type"}</TableHead>
                    <TableHead>{language === "es" ? "Características" : "Features"}</TableHead>
                    <TableHead>{language === "es" ? "Precio" : "Price"}</TableHead>
                    <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={featured.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {featured.map((item) => (
                      <SortableRow
                        key={item.id}
                        item={item}
                        onRemove={handleRemoveClick}
                        language={language}
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Agregar Propiedad Destacada" : "Add Featured Property"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Busca y selecciona una propiedad aprobada para destacar en el portal público"
                : "Search and select an approved property to feature on the public portal"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "es" 
                  ? "Buscar por nombre, zona o condominio..."
                  : "Search by name, zone or condominium..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-units"
              />
            </div>

            <ScrollArea className="h-[300px] border rounded-md">
              {isLoadingAvailable ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !availableData?.data?.length ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>
                    {language === "es" 
                      ? "No se encontraron propiedades disponibles"
                      : "No available properties found"}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {availableData.data.map((unit) => (
                    <div
                      key={unit.id}
                      onClick={() => setSelectedUnitId(unit.id)}
                      className={`p-3 rounded-md cursor-pointer border transition-colors ${
                        selectedUnitId === unit.id
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:bg-muted"
                      }`}
                      data-testid={`unit-option-${unit.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {unit.title || unit.unitNumber}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            {unit.condominiumName && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {unit.condominiumName}
                              </span>
                            )}
                            {unit.zone && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {unit.zone}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {unit.propertyType}
                          </Badge>
                          <div className="text-sm font-medium">
                            {formatPrice(unit.price)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {unit.bedrooms !== null && (
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-3 w-3" />
                            {unit.bedrooms} {language === "es" ? "rec" : "bed"}
                          </span>
                        )}
                        {unit.bathrooms !== null && (
                          <span className="flex items-center gap-1">
                            <Bath className="h-3 w-3" />
                            {unit.bathrooms} {language === "es" ? "baño" : "bath"}
                          </span>
                        )}
                        {unit.agencyName && (
                          <span className="text-xs text-muted-foreground/60">
                            {unit.agencyName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false);
                setSelectedUnitId(null);
                setSearchQuery("");
              }}
              data-testid="button-cancel-add"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={handleAddProperty}
              disabled={!selectedUnitId || addMutation.isPending}
              data-testid="button-confirm-add"
            >
              {addMutation.isPending 
                ? (language === "es" ? "Agregando..." : "Adding...")
                : (language === "es" ? "Agregar" : "Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "es" 
                ? "¿Remover de destacadas?"
                : "Remove from featured?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es"
                ? "Esta propiedad dejará de aparecer en la sección de propiedades destacadas del portal público."
                : "This property will no longer appear in the featured properties section of the public portal."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-remove">
              {language === "es" ? "Cancelar" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRemoveId && removeMutation.mutate(selectedRemoveId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-remove"
            >
              {removeMutation.isPending
                ? (language === "es" ? "Removiendo..." : "Removing...")
                : (language === "es" ? "Remover" : "Remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
