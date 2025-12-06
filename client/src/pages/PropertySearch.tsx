import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, SlidersHorizontal, MapPin, Bed, Bath, Square, X, Heart, PawPrint, Home, Building2, ChevronRight, Star, ChevronLeft, Sofa, Map, Grid, LayoutGrid, Droplet, Zap, Wifi, CheckCircle, XCircle, Key, DollarSign } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type Property } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { getPropertyTitle } from "@/lib/propertyHelpers";
import { PropertyMap } from "@/components/external/PropertyMap";
import { PublicHeader } from "@/components/PublicHeader";
import { UnifiedPropertyCard, type PropertyStatus } from "@/components/UnifiedPropertyCard";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const ITEMS_PER_PAGE = 24;

  // Read URL query parameters on mount and apply to filters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialFilters: SearchFilters = { location: "Tulum" };
    
    // Read search query from URL (q parameter)
    const query = urlParams.get("q");
    if (query) {
      initialFilters.query = query;
    }
    
    // Read status filter
    const status = urlParams.get("status");
    if (status) {
      initialFilters.status = status;
    }
    
    // Read property type
    const propertyType = urlParams.get("propertyType");
    if (propertyType) {
      initialFilters.propertyType = propertyType;
    }
    
    // Read featured filter
    const featured = urlParams.get("featured");
    if (featured === "true") {
      initialFilters.featured = true;
    }
    
    // Read pet friendly filter
    const petFriendly = urlParams.get("petFriendly");
    if (petFriendly === "true") {
      initialFilters.petFriendly = true;
    }
    
    // Read colony name
    const colonyName = urlParams.get("colonyName");
    if (colonyName) {
      initialFilters.colonyName = colonyName;
    }
    
    // Read price filters
    const minPrice = urlParams.get("minPrice");
    if (minPrice) {
      initialFilters.minPrice = parseInt(minPrice);
    }
    const maxPrice = urlParams.get("maxPrice");
    if (maxPrice) {
      initialFilters.maxPrice = parseInt(maxPrice);
    }
    
    // Read bedroom/bathroom filters
    const bedrooms = urlParams.get("bedrooms");
    if (bedrooms) {
      initialFilters.bedrooms = parseInt(bedrooms);
    }
    const bathrooms = urlParams.get("bathrooms");
    if (bathrooms) {
      initialFilters.bathrooms = parseInt(bathrooms);
    }
    
    setFilters(initialFilters);
  }, []);

  const { data: favorites = [] } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  const favoriteIds = new Set((favorites as any[]).map((fav: any) => fav.propertyId));

  // Build query params for API filtering
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('limit', ITEMS_PER_PAGE.toString());
    
    // Search query
    if (filters.query && filters.query.trim()) params.set('q', filters.query.trim());
    
    // Status filter (rent/sale)
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    
    // Property type filter
    if (filters.propertyType && filters.propertyType !== 'all') params.set('propertyType', filters.propertyType);
    
    // Price range filters
    if (filters.minPrice && filters.minPrice > 0) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice && filters.maxPrice > 0) params.set('maxPrice', filters.maxPrice.toString());
    
    // Bedroom/bathroom filters
    if (filters.bedrooms && filters.bedrooms > 0) params.set('bedrooms', filters.bedrooms.toString());
    if (filters.bathrooms && filters.bathrooms > 0) params.set('bathrooms', filters.bathrooms.toString());
    
    // Boolean filters - only set when true
    if (filters.petFriendly === true) params.set('petFriendly', 'true');
    if (filters.featured === true) params.set('featured', 'true');
    
    // Location/colony filter
    if (filters.colonyName && filters.colonyName.trim()) params.set('location', filters.colonyName.trim());
    
    return params.toString();
  };

  const { data: apiResponse, isLoading } = useQuery<{ data: any[], pagination: { page: number, limit: number, totalCount: number, totalPages: number } }>({
    queryKey: ["/api/public/external-properties", currentPage, filters.query, filters.status, filters.propertyType, filters.minPrice, filters.maxPrice, filters.bedrooms, filters.bathrooms, filters.petFriendly, filters.featured, filters.colonyName],
    queryFn: async () => {
      const response = await fetch(`/api/public/external-properties?${buildQueryParams()}`);
      if (!response.ok) {
        throw new Error("Error al buscar propiedades");
      }
      return response.json();
    },
  });

  // Use API-filtered data directly - no client-side filtering needed for server-applied filters
  const properties = apiResponse?.data || [];
  const pagination = apiResponse?.pagination || { page: 1, limit: ITEMS_PER_PAGE, totalCount: 0, totalPages: 1 };

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

  // Helper to update filters and reset page to 1
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({ location: "Tulum" });
    setSelectedAmenities([]);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {!isAuthenticated && <PublicHeader showPlatformButton={false} />}
      
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
              onChange={(e) => updateFilters({ query: e.target.value })}
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
              className="rounded-full px-3 py-1.5 text-xs cursor-pointer gap-1"
              onClick={() => updateFilters({ status: filters.status === "rent" ? undefined : "rent" })}
              data-testid="badge-filter-rent"
            >
              <Key className="h-3 w-3" />
              Renta
            </Badge>
            <Badge
              variant={filters.status === "sale" ? "default" : "secondary"}
              className="rounded-full px-3 py-1.5 text-xs cursor-pointer gap-1"
              onClick={() => updateFilters({ status: filters.status === "sale" ? undefined : "sale" })}
              data-testid="badge-filter-sale"
            >
              <DollarSign className="h-3 w-3" />
              Venta
            </Badge>
            <Badge
              variant={filters.petFriendly ? "default" : "secondary"}
              className="rounded-full px-3 py-1.5 text-xs cursor-pointer gap-1"
              onClick={() => updateFilters({ petFriendly: !filters.petFriendly })}
              data-testid="badge-filter-pet"
            >
              <PawPrint className="h-3 w-3" />
              Pet-friendly
            </Badge>
            <Badge
              variant={filters.featured ? "default" : "secondary"}
              className="rounded-full px-3 py-1.5 text-xs cursor-pointer gap-1"
              onClick={() => updateFilters({ featured: !filters.featured })}
              data-testid="badge-filter-featured"
            >
              <Star className="h-3 w-3" />
              Destacados
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
                  onValueChange={(value) => updateFilters({ propertyType: value === "all" ? undefined : value })}
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
                  onValueChange={(value) => updateFilters({ colonyName: value === "all" ? undefined : value })}
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
                  onValueChange={(value) => updateFilters({ bedrooms: value === "any" ? undefined : parseInt(value) })}
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
                  onValueChange={(value) => updateFilters({ bathrooms: value === "any" ? undefined : parseFloat(value) })}
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
                  onChange={(e) => updateFilters({ minPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
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
                  onChange={(e) => updateFilters({ maxPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
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
            {pagination.totalCount} {pagination.totalCount === 1 ? "propiedad encontrada" : "propiedades encontradas"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              data-testid="btn-view-grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("map")}
              data-testid="btn-view-map"
            >
              <Map className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {viewMode === "map" && (
          <div className="mb-6">
            <PropertyMap
              properties={properties.map((p: any) => ({
                id: p.id,
                title: p.title,
                unitNumber: p.unitNumber || "",
                latitude: p.latitude,
                longitude: p.longitude,
                price: p.price,
                salePrice: p.salePrice,
                currency: p.currency,
                saleCurrency: p.saleCurrency,
                listingType: p.listingType,
                bedrooms: p.bedrooms,
                bathrooms: p.bathrooms,
                area: p.area,
                propertyType: p.propertyType,
                zone: p.location,
                primaryImages: p.primaryImages,
                slug: p.unitSlug,
                agencySlug: p.agencySlug,
              }))}
              height="450px"
              language="es"
            />
          </div>
        )}

        {viewMode === "grid" && (
          <>

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
            {properties.map((property: any) => {
              const propertyUrl = property.isExternal && property.agencySlug && property.unitSlug 
                ? `/${property.agencySlug}/${property.unitSlug}` 
                : property.isExternal 
                  ? `/propiedad-externa/${property.id}` 
                  : property.slug 
                    ? `/p/${property.slug}` 
                    : `/propiedad/${property.id}/completo`;
              
              const getPropertyStatus = (): PropertyStatus => {
                const s = (property.status || '').toLowerCase();
                if (s === 'available' || s === 'rent' || s.includes('rent')) return 'available';
                if (s === 'occupied') return 'occupied';
                if (s === 'reserved') return 'reserved';
                if (s === 'sold') return 'sold';
                if (s === 'rented') return 'rented';
                return 'available';
              };
              
              return (
                <UnifiedPropertyCard
                  key={property.id}
                  id={property.id}
                  title={property.title || "Propiedad"}
                  unitNumber={property.unitNumber}
                  location={property.location}
                  zone={property.zone}
                  condominiumName={property.condominiumName || property.condoName}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  area={property.area}
                  status={getPropertyStatus()}
                  images={property.primaryImages || []}
                  petFriendly={property.petsAllowed}
                  variant="landing"
                  context="public"
                  isFavorite={favoriteIds.has(property.id)}
                  onClick={() => setLocation(propertyUrl)}
                  onFavorite={() => {
                    const syntheticEvent = { stopPropagation: () => {} } as React.MouseEvent;
                    handleToggleFavorite(syntheticEvent, property.id);
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 pb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="min-h-[44px] min-w-[44px]"
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={isLoading}
                    className="min-h-[44px] min-w-[44px]"
                    data-testid={`button-page-${pageNum}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages || isLoading}
              className="min-h-[44px] min-w-[44px]"
              data-testid="button-next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-muted-foreground ml-2">
              Página {currentPage} de {pagination.totalPages} ({pagination.totalCount} propiedades)
            </span>
          </div>
        )}
          </>
        )}
      </div>
      {/* Footer - Minimalist */}
      {!isAuthenticated && (
        <footer className="border-t bg-muted/30 mt-12">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                © {new Date().getFullYear()} Tulum Rental Homes
              </p>
              <div className="flex items-center gap-4 text-[10px] sm:text-xs">
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
