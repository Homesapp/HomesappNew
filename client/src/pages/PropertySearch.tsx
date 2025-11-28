import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, SlidersHorizontal, MapPin, Bed, Bath, Square, X, Heart, PawPrint, Home, Building2, ChevronRight, Star } from "lucide-react";
import { type Property } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getPropertyTitle } from "@/lib/propertyHelpers";

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
  propertyType?: string;
  colonyName?: string;
  petFriendly?: boolean;
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
  "Amueblado",
];

const PROPERTY_TYPES = [
  { value: "house", label: "Casa" },
  { value: "apartment", label: "Departamento" },
  { value: "condo", label: "Condominio" },
  { value: "land", label: "Terreno" },
  { value: "commercial", label: "Comercial" },
  { value: "office", label: "Oficina" },
];

const COLONIES = [
  "Aldea Zama",
  "La Veleta",
  "Centro",
  "Región 15",
  "Tulum Beach",
  "Holistika",
  "Selvamar",
];

export default function PropertySearch() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState<SearchFilters>({ location: "Tulum" });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

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
    if (filters.propertyType) params.append("propertyType", filters.propertyType);
    if (filters.colonyName) params.append("colonyName", filters.colonyName);
    if (filters.petFriendly) {
      params.append("amenities", "Mascotas permitidas");
    }
    if (selectedAmenities.length > 0) {
      const amenitiesStr = params.get("amenities");
      const allAmenities = amenitiesStr 
        ? [amenitiesStr, ...selectedAmenities].join(",")
        : selectedAmenities.join(",");
      params.set("amenities", allAmenities);
    }
    
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

  return (
    <div className="min-h-screen bg-background">
      {/* Minimalist Header */}
      {!isAuthenticated && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => setLocation("/")}
            >
              <div className="h-9 w-9 rounded-full bg-foreground flex items-center justify-center">
                <Home className="h-4 w-4 text-background" />
              </div>
              <span className="font-semibold text-lg hidden sm:block">homes</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <LanguageToggle />
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs sm:text-sm"
                onClick={() => setLocation("/login")}
                data-testid="button-login"
              >
                Entrar
              </Button>
              <Button
                size="sm"
                className="rounded-full text-xs sm:text-sm"
                onClick={() => setLocation("/register")}
                data-testid="button-register"
              >
                Registro
              </Button>
            </div>
          </div>
        </header>
      )}
      
      <div className="container mx-auto py-6 sm:py-8 px-4">
        {/* Title Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Buscar Propiedades en Tulum</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Propiedades exclusivas en Tulum, Quintana Roo</p>
        </div>

        {/* Search Bar - Minimalist Style */}
        <div className="mb-6">
          <div className="flex items-center gap-2 p-2 sm:p-3 bg-background rounded-full border shadow-sm max-w-2xl">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground ml-2 sm:ml-3" />
            <Input
              placeholder="Buscar por ubicación, nombre..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-sm sm:text-base h-9"
              value={filters.query || ""}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              data-testid="input-search-query"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full shrink-0"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Quick Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge
              variant={filters.status === "rent" ? "default" : "secondary"}
              className="rounded-full px-3 py-1.5 text-xs cursor-pointer"
              onClick={() => setFilters({ ...filters, status: filters.status === "rent" ? undefined : "rent" })}
            >
              En Renta
            </Badge>
            <Badge
              variant={filters.status === "sale" ? "default" : "secondary"}
              className="rounded-full px-3 py-1.5 text-xs cursor-pointer"
              onClick={() => setFilters({ ...filters, status: filters.status === "sale" ? undefined : "sale" })}
            >
              En Venta
            </Badge>
            <Badge
              variant={filters.featured ? "default" : "secondary"}
              className="rounded-full px-3 py-1.5 text-xs cursor-pointer"
              onClick={() => setFilters({ ...filters, featured: !filters.featured })}
            >
              Destacadas
            </Badge>
            <Badge
              variant={filters.petFriendly ? "default" : "secondary"}
              className="rounded-full px-3 py-1.5 text-xs cursor-pointer gap-1"
              onClick={() => setFilters({ ...filters, petFriendly: !filters.petFriendly })}
            >
              <PawPrint className="h-3 w-3" />
              Pet-friendly
            </Badge>
          </div>
        </div>

        {/* Advanced Filters Panel - Minimalist */}
        {showFilters && (
          <div className="mb-6 p-4 sm:p-6 bg-background border rounded-2xl shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Tipo</Label>
                <Select
                  value={filters.propertyType || "all"}
                  onValueChange={(value) => setFilters({ ...filters, propertyType: value === "all" ? undefined : value })}
                >
                  <SelectTrigger className="rounded-xl h-10" data-testid="select-property-type">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Zona</Label>
                <Select
                  value={filters.colonyName || "all"}
                  onValueChange={(value) => setFilters({ ...filters, colonyName: value === "all" ? undefined : value })}
                >
                  <SelectTrigger className="rounded-xl h-10" data-testid="select-colony">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {COLONIES.map((colony) => (
                      <SelectItem key={colony} value={colony}>
                        {colony}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Recámaras</Label>
                <Select
                  value={filters.bedrooms?.toString() || "any"}
                  onValueChange={(value) => setFilters({ ...filters, bedrooms: value === "any" ? undefined : parseInt(value) })}
                >
                  <SelectTrigger className="rounded-xl h-10" data-testid="select-bedrooms">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Todas</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Baños</Label>
                <Select
                  value={filters.bathrooms?.toString() || "any"}
                  onValueChange={(value) => setFilters({ ...filters, bathrooms: value === "any" ? undefined : parseFloat(value) })}
                >
                  <SelectTrigger className="rounded-xl h-10" data-testid="select-bathrooms">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Todos</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Precio Mín</Label>
                <Input
                  type="number"
                  placeholder="$0"
                  className="rounded-xl h-10"
                  value={filters.minPrice || ""}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  data-testid="input-min-price"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Precio Máx</Label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  className="rounded-xl h-10"
                  value={filters.maxPrice || ""}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  data-testid="input-max-price"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_AMENITIES.slice(0, 5).map((amenity) => (
                  <Badge
                    key={amenity}
                    variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                    className="cursor-pointer rounded-full text-xs"
                    onClick={() => toggleAmenity(amenity)}
                    data-testid={`badge-amenity-${amenity.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {amenity}
                    {selectedAmenities.includes(amenity) && <X className="h-3 w-3 ml-1" />}
                  </Badge>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                data-testid="button-clear-filters"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {properties.length} {properties.length === 1 ? "propiedad encontrada" : "propiedades encontradas"}
          </p>
        </div>

        {/* Property Grid - Minimalist Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden border bg-card">
                <Skeleton className="aspect-[4/3]" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium mb-1">No se encontraron propiedades</p>
            <p className="text-sm text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                className="group cursor-pointer rounded-2xl overflow-hidden border bg-card hover-elevate"
                onClick={() => setLocation(property.slug ? `/p/${property.slug}` : `/propiedad/${property.id}/completo`)}
                data-testid={`card-property-${property.id}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {property.primaryImages && property.primaryImages[0] ? (
                    <img
                      src={property.primaryImages[0]}
                      alt={getPropertyTitle(property)}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className="absolute top-3 left-3 bg-foreground text-background text-[10px] rounded-full px-2">
                    {property.status === "rent" ? "Renta" : property.status === "sale" ? "Venta" : "Renta/Venta"}
                  </Badge>
                  {property.featured && (
                    <Badge className="absolute top-3 left-16 bg-primary text-primary-foreground text-[10px] rounded-full px-2">
                      Destacada
                    </Badge>
                  )}
                  <button
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                    onClick={(e) => handleToggleFavorite(e, property.id)}
                    disabled={toggleFavoriteMutation.isPending}
                    data-testid={`button-favorite-${property.id}`}
                  >
                    <Heart className={`h-4 w-4 ${favoriteIds.has(property.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                  </button>
                  {property.rating != null && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-background/80 backdrop-blur rounded-full px-2 py-0.5">
                      <Star className="h-3 w-3 fill-foreground" />
                      <span className="text-xs font-medium">{Number(property.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-medium text-sm sm:text-base truncate mb-1" data-testid={`text-title-${property.id}`}>
                    {getPropertyTitle(property)}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 truncate flex items-center gap-1" data-testid={`text-location-${property.id}`}>
                    <MapPin className="h-3 w-3 shrink-0" />
                    {property.location}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="font-semibold text-sm sm:text-base" data-testid={`text-price-${property.id}`}>
                      ${property.price.toLocaleString()}
                      <span className="font-normal text-xs text-muted-foreground ml-1">
                        USD{property.status === "rent" ? "/mes" : ""}
                      </span>
                    </p>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        <Bed className="h-3 w-3" />
                        {property.bedrooms}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Bath className="h-3 w-3" />
                        {property.bathrooms}
                      </span>
                      {property.area && (
                        <span className="flex items-center gap-0.5">
                          <Square className="h-3 w-3" />
                          {property.area}m²
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Minimalist */}
      {!isAuthenticated && (
        <footer className="border-t bg-muted/30 mt-12">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-foreground flex items-center justify-center">
                  <Home className="h-3.5 w-3.5 text-background" />
                </div>
                <span className="font-medium text-sm">homes</span>
              </div>
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Tulum Rental Homes
              </p>
              <div className="flex items-center gap-4 text-xs">
                <button 
                  onClick={() => setLocation("/terminos")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Términos
                </button>
                <button 
                  onClick={() => setLocation("/privacidad")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacidad
                </button>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
