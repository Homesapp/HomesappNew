import { useState } from "react";
import { useLocation } from "wouter";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyFormDialog } from "@/components/PropertyFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Search, Plus, SlidersHorizontal, LayoutGrid, List, Share2, Copy, X, ChevronDown } from "lucide-react";
import { useProperties, useSearchProperties, useDeleteProperty } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getPropertyTitle } from "@/lib/propertyHelpers";
import type { Property } from "@shared/schema";

export default function Properties() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedProperty, setSelectedProperty] = useState<Property | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  
  // Advanced filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("all");
  const [bedroomsMin, setBedroomsMin] = useState<string>("");
  const [bathroomsMin, setBathroomsMin] = useState<string>("");
  const [areaMin, setAreaMin] = useState<string>("");
  const [areaMax, setAreaMax] = useState<string>("");

  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { data: properties, isLoading, error } = useProperties({
    status: statusFilter !== "all" ? statusFilter : undefined,
    active: true,
  });
  const { data: searchResults } = useSearchProperties(debouncedSearch);
  const deleteMutation = useDeleteProperty();

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  const canCreateProperty = user && ["owner", "seller", "admin", "admin_jr", "master"].includes(user.role);
  
  const canEditProperty = (property: Property) => {
    if (!user) return false;
    if (["admin", "master"].includes(user.role)) return true;
    return property.ownerId === user.id;
  };

  const handleCreateClick = () => {
    setFormMode("create");
    setSelectedProperty(undefined);
    setFormOpen(true);
  };

  const handleEditClick = (property: Property) => {
    setFormMode("edit");
    setSelectedProperty(property);
    setFormOpen(true);
  };

  const handleDeleteClick = (propertyId: string) => {
    setPropertyToDelete(propertyId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (propertyToDelete) {
      await deleteMutation.mutateAsync(propertyToDelete);
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

  const handleViewProperty = (propertyId: string) => {
    if (user?.role === "owner") {
      setLocation(`/owner/property/${propertyId}`);
    } else {
      setLocation(`/propiedad/${propertyId}/completo`);
    }
  };

  const handleScheduleAppointment = (propertyId: string) => {
    if (user?.role === "seller") {
      setLocation(`/seller/appointments?propertyId=${propertyId}`);
    } else if (user?.role === "owner") {
      setLocation(`/owner/appointments?propertyId=${propertyId}`);
    } else if (["admin", "master", "admin_jr"].includes(user?.role || "")) {
      setLocation(`/admin/appointments?propertyId=${propertyId}`);
    } else {
      setLocation(`/appointments?propertyId=${propertyId}`);
    }
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (displayProperties && selectedProperties.size === displayProperties.length) {
      setSelectedProperties(new Set());
    } else if (displayProperties) {
      setSelectedProperties(new Set(displayProperties.map(p => p.id)));
    }
  };

  const handleShareWhatsApp = () => {
    if (selectedProperties.size === 0) {
      toast({
        variant: "destructive",
        title: "No hay propiedades seleccionadas",
        description: "Selecciona al menos una propiedad para compartir",
      });
      return;
    }

    const baseUrl = window.location.origin;
    const links = Array.from(selectedProperties).map(id => {
      const property = displayProperties?.find(p => p.id === id);
      const title = property ? getPropertyTitle(property) : 'Propiedad';
      return `${title}: ${baseUrl}/propiedad/${id}/completo`;
    }).join('\n\n');

    const message = encodeURIComponent(`¡Hola! Te comparto estas propiedades:\n\n${links}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleCopyLinks = async () => {
    if (selectedProperties.size === 0) {
      toast({
        variant: "destructive",
        title: "No hay propiedades seleccionadas",
        description: "Selecciona al menos una propiedad para copiar",
      });
      return;
    }

    const baseUrl = window.location.origin;
    const links = Array.from(selectedProperties).map(id => {
      const property = displayProperties?.find(p => p.id === id);
      const title = property ? getPropertyTitle(property) : 'Propiedad';
      return `${title}: ${baseUrl}/propiedad/${id}/completo`;
    }).join('\n\n');

    try {
      await navigator.clipboard.writeText(links);
      toast({
        title: "Enlaces copiados",
        description: `Se copiaron ${selectedProperties.size} enlaces al portapapeles`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron copiar los enlaces",
      });
    }
  };

  const handleClearFilters = () => {
    setPriceMin("");
    setPriceMax("");
    setPropertyTypeFilter("all");
    setBedroomsMin("");
    setBathroomsMin("");
    setAreaMin("");
    setAreaMax("");
  };

  const hasActiveFilters = priceMin || priceMax || propertyTypeFilter !== "all" || 
    bedroomsMin || bathroomsMin || areaMin || areaMax;

  const applyAdvancedFilters = (props: Property[]) => {
    return props.filter(property => {
      // Price filter
      if (priceMin && Number(property.price) < Number(priceMin)) return false;
      if (priceMax && Number(property.price) > Number(priceMax)) return false;
      
      // Property type filter
      if (propertyTypeFilter !== "all" && property.propertyType !== propertyTypeFilter) return false;
      
      // Bedrooms filter
      if (bedroomsMin && property.bedrooms < Number(bedroomsMin)) return false;
      
      // Bathrooms filter
      if (bathroomsMin && Number(property.bathrooms) < Number(bathroomsMin)) return false;
      
      // Area filter
      if (areaMin && Number(property.area) < Number(areaMin)) return false;
      if (areaMax && Number(property.area) > Number(areaMax)) return false;
      
      return true;
    });
  };

  const isAdminOrSeller = user && ["admin", "seller", "master"].includes(user.role);
  
  let displayProperties = debouncedSearch.trim() ? searchResults : properties;
  if (displayProperties && hasActiveFilters) {
    displayProperties = applyAdvancedFilters(displayProperties);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Propiedades</h1>
          <p className="text-muted-foreground">
            {displayProperties?.length || 0} propiedades disponibles
          </p>
        </div>
        {canCreateProperty && (
          <Button onClick={handleCreateClick} data-testid="button-add-property">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Propiedad
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ubicación, características..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            data-testid="input-search-properties"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="rent">En Renta</SelectItem>
            <SelectItem value="sale">En Venta</SelectItem>
            <SelectItem value="both">Renta y Venta</SelectItem>
          </SelectContent>
        </Select>
        {isAdminOrSeller && (
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              data-testid="button-view-grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("table")}
              data-testid="button-view-table"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button 
              variant={hasActiveFilters ? "default" : "outline"} 
              className="w-full md:w-auto"
              data-testid="button-advanced-filters"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros Avanzados
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  Activo
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="ml-2"
              data-testid="button-clear-filters-inline"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          )}
        </div>

        <CollapsibleContent className="mt-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="grid gap-6">
              {/* Price Range */}
              <div className="space-y-2">
                <Label>Rango de Precio</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price-min" className="text-sm text-muted-foreground">Mínimo</Label>
                    <Input
                      id="price-min"
                      type="number"
                      placeholder="$0"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      data-testid="input-price-min"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price-max" className="text-sm text-muted-foreground">Máximo</Label>
                    <Input
                      id="price-max"
                      type="number"
                      placeholder="$999,999,999"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      data-testid="input-price-max"
                    />
                  </div>
                </div>
              </div>

              {/* Property Type and Bedrooms/Bathrooms */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="property-type">Tipo de Propiedad</Label>
                  <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                    <SelectTrigger id="property-type" data-testid="select-property-type">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="apartment">Departamento</SelectItem>
                      <SelectItem value="house">Casa</SelectItem>
                      <SelectItem value="commercial">Comercial</SelectItem>
                      <SelectItem value="land">Terreno</SelectItem>
                      <SelectItem value="office">Oficina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms-min">Recámaras (mín)</Label>
                  <Input
                    id="bedrooms-min"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={bedroomsMin}
                    onChange={(e) => setBedroomsMin(e.target.value)}
                    data-testid="input-bedrooms-min"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms-min">Baños (mín)</Label>
                  <Input
                    id="bathrooms-min"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value={bathroomsMin}
                    onChange={(e) => setBathroomsMin(e.target.value)}
                    data-testid="input-bathrooms-min"
                  />
                </div>
              </div>

              {/* Area Range */}
              <div className="space-y-2">
                <Label>Área (m²)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area-min" className="text-sm text-muted-foreground">Mínimo</Label>
                    <Input
                      id="area-min"
                      type="number"
                      placeholder="0"
                      value={areaMin}
                      onChange={(e) => setAreaMin(e.target.value)}
                      data-testid="input-area-min"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area-max" className="text-sm text-muted-foreground">Máximo</Label>
                    <Input
                      id="area-max"
                      type="number"
                      placeholder="999"
                      value={areaMax}
                      onChange={(e) => setAreaMax(e.target.value)}
                      data-testid="input-area-max"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {isAdminOrSeller && selectedProperties.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selectedProperties.size} {selectedProperties.size === 1 ? 'propiedad seleccionada' : 'propiedades seleccionadas'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProperties(new Set())}
              data-testid="button-clear-selection"
            >
              Limpiar selección
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLinks}
              data-testid="button-copy-links"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Enlaces
            </Button>
            <Button
              size="sm"
              onClick={handleShareWhatsApp}
              data-testid="button-share-whatsapp"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartir por WhatsApp
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive" data-testid="error-message">
          <p className="font-medium">Error al cargar propiedades</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayProperties && displayProperties.length > 0 ? (
            displayProperties.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                title={getPropertyTitle(property)}
                price={Number(property.price)}
                salePrice={property.salePrice ? Number(property.salePrice) : undefined}
                currency={property.currency}
                bedrooms={property.bedrooms}
                bathrooms={Number(property.bathrooms)}
                area={Number(property.area)}
                location={property.location}
                colonyName={property.colonyName || undefined}
                status={property.status}
                image={property.primaryImages?.[property.coverImageIndex || 0] || property.images?.[0]}
                petFriendly={property.petFriendly || false}
                furnished={property.furnished || false}
                rentalType={property.rentalType || undefined}
                amenities={property.amenities as string[] | undefined}
                hoaIncluded={property.hoaIncluded || false}
                virtualTourUrl={property.virtualTourUrl || undefined}
                externalAgencyName={property.externalAgencyName}
                externalAgencyLogoUrl={property.externalAgencyLogoUrl}
                onView={() => handleViewProperty(property.id)}
                onEdit={canEditProperty(property) ? () => handleEditClick(property) : undefined}
                onDelete={canEditProperty(property) ? () => handleDeleteClick(property.id) : undefined}
                onSchedule={() => handleScheduleAppointment(property.id)}
                showCompare={true}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12" data-testid="no-properties">
              <p className="text-muted-foreground">No se encontraron propiedades</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdminOrSeller && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={displayProperties && displayProperties.length > 0 && selectedProperties.size === displayProperties.length}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                )}
                <TableHead>Propiedad</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayProperties && displayProperties.length > 0 ? (
                displayProperties.map((property) => (
                  <TableRow key={property.id}>
                    {isAdminOrSeller && (
                      <TableCell>
                        <Checkbox
                          checked={selectedProperties.has(property.id)}
                          onCheckedChange={() => handleSelectProperty(property.id)}
                          data-testid={`checkbox-select-${property.id}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {getPropertyTitle(property)}
                    </TableCell>
                    <TableCell>{property.location}</TableCell>
                    <TableCell>
                      ${new Intl.NumberFormat('es-MX').format(Number(property.price))}
                    </TableCell>
                    <TableCell className="capitalize">{property.propertyType}</TableCell>
                    <TableCell>
                      <Badge variant={property.status === "rent" ? "default" : property.status === "sale" ? "secondary" : "outline"}>
                        {property.status === "rent" ? "Renta" : property.status === "sale" ? "Venta" : "Ambos"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewProperty(property.id)}
                        data-testid={`button-view-${property.id}`}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdminOrSeller ? 7 : 6} className="text-center py-12" data-testid="no-properties">
                    <p className="text-muted-foreground">No se encontraron propiedades</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <PropertyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        property={selectedProperty}
        mode={formMode}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-property">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="dialog-delete-title">
              ¿Eliminar propiedad?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La propiedad será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
