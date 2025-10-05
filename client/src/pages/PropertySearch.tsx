import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, SlidersHorizontal, MapPin, Bed, Bath, Square, Star, X, Heart, PawPrint } from "lucide-react";
import { type Property } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface SearchFilters {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  location?: string;
  amenities?: string[];
  status?: string;
  minRating?: number;
  featured?: boolean;
  availableFrom?: string;
  availableTo?: string;
}

const AVAILABLE_AMENITIES = [
  "Estacionamiento",
  "Alberca",
  "Gimnasio",
  "Jardín",
  "Seguridad 24/7",
  "Elevador",
  "Terraza",
  "Balcón",
  "Mascotas permitidas",
  "Amueblado",
];

export default function PropertySearch() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState<SearchFilters>({ location: "Tulum" });
  const [showFilters, setShowFilters] = useState(true);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Cargar favoritos del usuario
  const { data: favorites = [] } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  const favoriteIds = new Set((favorites as any[]).map((fav: any) => fav.propertyId));

  const buildQueryString = (filters: SearchFilters) => {
    const params = new URLSearchParams();
    
    if (filters.query) params.append("q", filters.query);
    if (filters.minPrice !== undefined) params.append("minPrice", filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.append("maxPrice", filters.maxPrice.toString());
    if (filters.bedrooms !== undefined) params.append("bedrooms", filters.bedrooms.toString());
    if (filters.bathrooms !== undefined) params.append("bathrooms", filters.bathrooms.toString());
    if (filters.minArea !== undefined) params.append("minArea", filters.minArea.toString());
    if (filters.maxArea !== undefined) params.append("maxArea", filters.maxArea.toString());
    if (filters.location) params.append("location", filters.location);
    if (filters.status) params.append("status", filters.status);
    if (filters.minRating !== undefined) params.append("minRating", filters.minRating.toString());
    if (filters.featured !== undefined) params.append("featured", filters.featured.toString());
    if (filters.availableFrom) params.append("availableFrom", filters.availableFrom);
    if (filters.availableTo) params.append("availableTo", filters.availableTo);
    if (selectedAmenities.length > 0) params.append("amenities", selectedAmenities.join(","));
    
    return params.toString();
  };

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties/search", filters, selectedAmenities],
    queryFn: async () => {
      const queryString = buildQueryString(filters);
      const response = await fetch(`/api/properties/search?${queryString}`);
      if (!response.ok) {
        throw new Error("Error al buscar propiedades");
      }
      return response.json();
    },
  });

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const isFavorite = favoriteIds.has(propertyId);
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${propertyId}`, null);
      } else {
        await apiRequest("POST", "/api/favorites", { propertyId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: () => {
      toast({
        title: "Error al actualizar favoritos",
        variant: "destructive",
      });
    },
  });

  const handleToggleFavorite = (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión para guardar favoritos",
        variant: "destructive",
      });
      return;
    }
    toggleFavoriteMutation.mutate(propertyId);
  };

  const clearFilters = () => {
    setFilters({ location: "Tulum" });
    setSelectedAmenities([]);
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Buscar Propiedades en Tulum</h1>
            <p className="text-muted-foreground">Propiedades exclusivas en Tulum, Quintana Roo</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {showFilters ? "Ocultar" : "Mostrar"} Filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {showFilters && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Filtros de Búsqueda</CardTitle>
                  <CardDescription>Refina tu búsqueda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="search-query">Búsqueda</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-query"
                        placeholder="Ubicación, título..."
                        className="pl-10"
                        value={filters.query || ""}
                        onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                        data-testid="input-search-query"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Rango de Precio (MXN)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Mínimo"
                        value={filters.minPrice || ""}
                        onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                        data-testid="input-min-price"
                      />
                      <Input
                        type="number"
                        placeholder="Máximo"
                        value={filters.maxPrice || ""}
                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                        data-testid="input-max-price"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Recámaras</Label>
                    <Select
                      value={filters.bedrooms?.toString() || "any"}
                      onValueChange={(value) => setFilters({ ...filters, bedrooms: value === "any" ? undefined : parseInt(value) })}
                    >
                      <SelectTrigger id="bedrooms" data-testid="select-bedrooms">
                        <SelectValue placeholder="Cualquiera" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Cualquiera</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Baños</Label>
                    <Select
                      value={filters.bathrooms?.toString() || "any"}
                      onValueChange={(value) => setFilters({ ...filters, bathrooms: value === "any" ? undefined : parseFloat(value) })}
                    >
                      <SelectTrigger id="bathrooms" data-testid="select-bathrooms">
                        <SelectValue placeholder="Cualquiera" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Cualquiera</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="1.5">1.5+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="2.5">2.5+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Área (m²)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Mínima"
                        value={filters.minArea || ""}
                        onChange={(e) => setFilters({ ...filters, minArea: e.target.value ? parseFloat(e.target.value) : undefined })}
                        data-testid="input-min-area"
                      />
                      <Input
                        type="number"
                        placeholder="Máxima"
                        value={filters.maxArea || ""}
                        onChange={(e) => setFilters({ ...filters, maxArea: e.target.value ? parseFloat(e.target.value) : undefined })}
                        data-testid="input-max-area"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Tipo</Label>
                    <Select
                      value={filters.status || "all"}
                      onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? undefined : value })}
                    >
                      <SelectTrigger id="status" data-testid="select-status">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="rent">Renta</SelectItem>
                        <SelectItem value="sale">Venta</SelectItem>
                        <SelectItem value="both">Renta o Venta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Disponible Desde</Label>
                    <Input
                      type="date"
                      value={filters.availableFrom || ""}
                      onChange={(e) => setFilters({ ...filters, availableFrom: e.target.value || undefined })}
                      data-testid="input-available-from"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Disponible Hasta</Label>
                    <Input
                      type="date"
                      value={filters.availableTo || ""}
                      onChange={(e) => setFilters({ ...filters, availableTo: e.target.value || undefined })}
                      data-testid="input-available-to"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Amenidades</Label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_AMENITIES.map((amenity) => (
                        <Badge
                          key={amenity}
                          variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleAmenity(amenity)}
                          data-testid={`badge-amenity-${amenity.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {amenity}
                          {selectedAmenities.includes(amenity) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearFilters}
                    data-testid="button-clear-filters"
                  >
                    Limpiar Filtros
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            {isLoading ? (
              <LoadingScreen className="min-h-[400px]" />
            ) : properties.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No se encontraron propiedades con los filtros seleccionados.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  {properties.length} {properties.length === 1 ? "propiedad encontrada" : "propiedades encontradas"}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <Card 
                      key={property.id} 
                      className="relative hover-elevate cursor-pointer" 
                      onClick={() => setLocation(`/propiedad/${property.id}`)}
                      data-testid={`card-property-${property.id}`}
                    >
                      {isAuthenticated && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur-sm"
                          onClick={(e) => handleToggleFavorite(e, property.id)}
                          disabled={toggleFavoriteMutation.isPending}
                          data-testid={`button-favorite-${property.id}`}
                        >
                          <Heart 
                            className={`h-4 w-4 ${favoriteIds.has(property.id) ? "fill-red-500 text-red-500" : ""}`} 
                          />
                        </Button>
                      )}
                      {property.images && property.images.length > 0 ? (
                        <div className="h-48 bg-muted relative overflow-hidden">
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                          {property.featured && (
                            <Badge className="absolute top-2 right-2">
                              Destacada
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="h-48 bg-muted flex items-center justify-center">
                          <MapPin className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="line-clamp-1">{property.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {property.description || "Sin descripción"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-primary">
                            {formatPrice(property.price)}
                          </span>
                          {property.rating && parseFloat(property.rating) > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{property.rating}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{property.bedrooms}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            <span>{property.bathrooms}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Square className="h-4 w-4" />
                            <span>{property.area} m²</span>
                          </div>
                          {property.amenities?.includes("Mascotas permitidas") && (
                            <div className="flex items-center gap-1" title="Pet-friendly">
                              <PawPrint className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{property.location}</span>
                        </div>

                        {property.amenities && property.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {property.amenities.slice(0, 3).map((amenity, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                            {property.amenities.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{property.amenities.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
