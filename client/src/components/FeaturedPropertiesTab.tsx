import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Plus, Trash2, GripVertical, Search, AlertCircle, ArrowUp, ArrowDown, Building2, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalUnit } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";

const MAX_FEATURED = 30;

interface FeaturedProperty {
  id: string;
  unitId: string;
  sortOrder: number;
  addedBy: string | null;
  createdAt: string;
  unit?: ExternalUnit & {
    condominiumName?: string;
  };
}

interface AvailableUnit extends ExternalUnit {
  condominiumName?: string;
}

interface FeaturedPropertiesTabProps {
  language: "es" | "en";
}

export function FeaturedPropertiesTab({ language }: FeaturedPropertiesTabProps) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);

  const t = {
    es: {
      title: "Propiedades Destacadas",
      subtitle: `Selecciona hasta ${MAX_FEATURED} propiedades para mostrar en la página principal`,
      addProperty: "Agregar Propiedad",
      property: "Propiedad",
      condominium: "Condominio",
      order: "Orden",
      actions: "Acciones",
      remove: "Quitar",
      moveUp: "Subir",
      moveDown: "Bajar",
      empty: "No hay propiedades destacadas",
      emptyDescription: "Agrega propiedades para mostrarlas en la página principal",
      selectProperty: "Seleccionar Propiedad",
      search: "Buscar propiedades...",
      cancel: "Cancelar",
      add: "Agregar",
      noAvailable: "No hay propiedades disponibles para agregar",
      limitReached: `Has alcanzado el límite de ${MAX_FEATURED} propiedades destacadas`,
      added: "Propiedad agregada a destacados",
      removed: "Propiedad eliminada de destacados",
      reordered: "Orden actualizado",
      bedrooms: "Recámaras",
      bathrooms: "Baños",
      zone: "Zona",
      current: "actual",
      max: "máximo",
    },
    en: {
      title: "Featured Properties",
      subtitle: `Select up to ${MAX_FEATURED} properties to display on the homepage`,
      addProperty: "Add Property",
      property: "Property",
      condominium: "Condominium",
      order: "Order",
      actions: "Actions",
      remove: "Remove",
      moveUp: "Move Up",
      moveDown: "Move Down",
      empty: "No featured properties",
      emptyDescription: "Add properties to display them on the homepage",
      selectProperty: "Select Property",
      search: "Search properties...",
      cancel: "Cancel",
      add: "Add",
      noAvailable: "No properties available to add",
      limitReached: `You have reached the limit of ${MAX_FEATURED} featured properties`,
      added: "Property added to featured",
      removed: "Property removed from featured",
      reordered: "Order updated",
      bedrooms: "Bedrooms",
      bathrooms: "Bathrooms",
      zone: "Zone",
      current: "current",
      max: "max",
    },
  }[language];

  const { data: featuredProperties, isLoading } = useQuery<FeaturedProperty[]>({
    queryKey: ['/api/featured-properties'],
  });

  const { data: availableUnits, isLoading: unitsLoading } = useQuery<AvailableUnit[]>({
    queryKey: ['/api/featured-properties/available-units', debouncedSearch],
    enabled: showAddDialog,
  });

  const addMutation = useMutation({
    mutationFn: (unitId: string) => 
      apiRequest('/api/featured-properties', { 
        method: 'POST', 
        body: JSON.stringify({ unitId }) 
      }),
    onSuccess: () => {
      toast({ title: t.added });
      queryClient.invalidateQueries({ queryKey: ['/api/featured-properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/featured-properties/available-units'] });
      setShowAddDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/featured-properties/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({ title: t.removed });
      queryClient.invalidateQueries({ queryKey: ['/api/featured-properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/featured-properties/available-units'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, newOrder }: { id: string; newOrder: number }) => 
      apiRequest(`/api/featured-properties/${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ sortOrder: newOrder }) 
      }),
    onSuccess: () => {
      toast({ title: t.reordered });
      queryClient.invalidateQueries({ queryKey: ['/api/featured-properties'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleMoveUp = (item: FeaturedProperty) => {
    if (item.sortOrder <= 1) return;
    reorderMutation.mutate({ id: item.id, newOrder: item.sortOrder - 1 });
  };

  const handleMoveDown = (item: FeaturedProperty, maxOrder: number) => {
    if (item.sortOrder >= maxOrder) return;
    reorderMutation.mutate({ id: item.id, newOrder: item.sortOrder + 1 });
  };

  const currentCount = featuredProperties?.length || 0;
  const canAddMore = currentCount < MAX_FEATURED;

  const filteredUnits = availableUnits?.filter(unit => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    return (
      unit.unitNumber?.toLowerCase().includes(searchLower) ||
      unit.condominiumName?.toLowerCase().includes(searchLower) ||
      unit.zone?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                {t.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {t.subtitle}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {currentCount} {t.current} / {MAX_FEATURED} {t.max}
              </Badge>
              <Button
                onClick={() => setShowAddDialog(true)}
                disabled={!canAddMore}
                data-testid="button-add-featured"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t.addProperty}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!featuredProperties || featuredProperties.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-featured">
                {t.empty}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t.emptyDescription}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{t.order}</TableHead>
                  <TableHead>{t.property}</TableHead>
                  <TableHead>{t.condominium}</TableHead>
                  <TableHead>{t.zone}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featuredProperties.map((item, index) => (
                  <TableRow key={item.id} data-testid={`row-featured-${item.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{item.sortOrder}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {item.unit?.unitNumber || item.unitId.slice(0, 8)}
                        </span>
                        {item.unit?.bedrooms && (
                          <Badge variant="secondary" className="text-xs">
                            {item.unit.bedrooms} {t.bedrooms}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {item.unit?.condominiumName || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.unit?.zone || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveUp(item)}
                          disabled={index === 0 || reorderMutation.isPending}
                          title={t.moveUp}
                          data-testid={`button-move-up-${item.id}`}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveDown(item, featuredProperties.length)}
                          disabled={index === featuredProperties.length - 1 || reorderMutation.isPending}
                          title={t.moveDown}
                          data-testid={`button-move-down-${item.id}`}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMutation.mutate(item.id)}
                          disabled={removeMutation.isPending}
                          title={t.remove}
                          data-testid={`button-remove-featured-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              {t.selectProperty}
            </DialogTitle>
            <DialogDescription>
              {canAddMore ? t.subtitle : t.limitReached}
            </DialogDescription>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
              data-testid="input-search-available-units"
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {unitsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !filteredUnits || filteredUnits.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t.noAvailable}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUnits.slice(0, 50).map((unit) => (
                  <Card 
                    key={unit.id} 
                    className="cursor-pointer hover-elevate"
                    onClick={() => addMutation.mutate(unit.id)}
                    data-testid={`card-available-unit-${unit.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Home className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {unit.unitNumber || unit.id.slice(0, 8)}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {unit.condominiumName || "-"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {unit.zone && (
                            <Badge variant="outline">{unit.zone}</Badge>
                          )}
                          {unit.bedrooms && (
                            <Badge variant="secondary">
                              {unit.bedrooms} {t.bedrooms}
                            </Badge>
                          )}
                          <Button 
                            size="sm" 
                            disabled={addMutation.isPending}
                            data-testid={`button-add-unit-${unit.id}`}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {t.add}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
