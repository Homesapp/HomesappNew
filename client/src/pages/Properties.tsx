import { useState } from "react";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyFormDialog } from "@/components/PropertyFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Search, Plus, SlidersHorizontal } from "lucide-react";
import { useProperties, useSearchProperties, useDeleteProperty } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
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

  const { user } = useAuth();
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

  const displayProperties = debouncedSearch.trim() ? searchResults : properties;

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
        <Button variant="outline" data-testid="button-advanced-filters">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filtros Avanzados
        </Button>
      </div>

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
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayProperties && displayProperties.length > 0 ? (
            displayProperties.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                title={getPropertyTitle(property)}
                price={Number(property.price)}
                bedrooms={property.bedrooms}
                bathrooms={Number(property.bathrooms)}
                area={Number(property.area)}
                location={property.location}
                status={property.status}
                image={property.primaryImages?.[property.coverImageIndex || 0] || property.images?.[0]}
                onView={() => console.log("Ver propiedad", property.id)}
                onEdit={canEditProperty(property) ? () => handleEditClick(property) : undefined}
                onDelete={canEditProperty(property) ? () => handleDeleteClick(property.id) : undefined}
                onSchedule={() => console.log("Agendar cita", property.id)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12" data-testid="no-properties">
              <p className="text-muted-foreground">No se encontraron propiedades</p>
            </div>
          )}
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
