import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, SlidersHorizontal, MapPin, Bed, Bath, Square, Star, X, Heart, PawPrint } from "lucide-react";
import { type Property } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";

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

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Public Header - Only show when not authenticated */}
      {!isAuthenticated && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-2">
            <div className="flex items-center cursor-pointer" onClick={() => setLocation("/")}>
              <img src={logoIcon} alt="HomesApp" className="h-8 sm:h-10 md:h-12 w-auto" />
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/login")}
                data-testid="button-login"
                className="hidden sm:flex"
              >
                Iniciar Sesión
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/login")}
                data-testid="button-login-mobile"
                className="sm:hidden"
              >
                Entrar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setLocation("/register")}
                data-testid="button-register"
                className="hidden sm:flex"
              >
                Registrarse
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setLocation("/register")}
                data-testid="button-register-mobile"
                className="sm:hidden"
              >
                Registro
              </Button>
            </div>
          </div>
        </header>
      )}
      
      <div className="container mx-auto py-4 md:py-6 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Buscar Propiedades en Tulum</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Propiedades exclusivas en Tulum, Quintana Roo</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
            className="w-full sm:w-auto"
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
                    <Label htmlFor="property-type">Tipo de Propiedad</Label>
                    <Select
                      value={filters.propertyType || "all"}
                      onValueChange={(value) => setFilters({ ...filters, propertyType: value === "all" ? undefined : value })}
                    >
                      <SelectTrigger id="property-type" data-testid="select-property-type">
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colony">Colonia</Label>
                    <Select
                      value={filters.colonyName || "all"}
                      onValueChange={(value) => setFilters({ ...filters, colonyName: value === "all" ? undefined : value })}
                    >
                      <SelectTrigger id="colony" data-testid="select-colony">
                        <SelectValue placeholder="Todas las colonias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las colonias</SelectItem>
                        {COLONIES.map((colony) => (
                          <SelectItem key={colony} value={colony}>
                            {colony}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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

                  <Separator />

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pet-friendly"
                      checked={filters.petFriendly || false}
                      onCheckedChange={(checked) => setFilters({ ...filters, petFriendly: checked as boolean })}
                      data-testid="checkbox-pet-friendly"
                    />
                    <Label htmlFor="pet-friendly" className="flex items-center gap-2 cursor-pointer">
                      <PawPrint className="h-4 w-4" />
                      <span>Pet-friendly</span>
                    </Label>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {properties.map((property) => (
                    <Card 
                      key={property.id} 
                      className="overflow-hidden hover-elevate cursor-pointer" 
                      onClick={() => setLocation(`/propiedad/${property.id}/completo`)}
                      data-testid={`card-property-${property.id}`}
                    >
                      {property.primaryImages && property.primaryImages.length > 0 ? (
                        <div className="h-36 bg-muted relative overflow-hidden">
                          <img
                            src={property.primaryImages[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
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
                          {property.featured && (
                            <Badge className="absolute top-2 right-2">
                              Destacada
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="h-36 bg-muted flex items-center justify-center relative">
                          <MapPin className="h-12 w-12 text-muted-foreground" />
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
                        </div>
                      )}
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="line-clamp-1 text-base">{property.title}</CardTitle>
                        <CardDescription className="line-clamp-1 text-xs">
                          {property.description || "Sin descripción"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-1.5 pt-0 pb-3">
                        {/* Mostrar tipo de operación */}
                        <div className="text-xs font-medium text-muted-foreground" data-testid={`text-type-${property.id}`}>
                          {property.status === "rent" && "En Renta"}
                          {property.status === "sale" && "En Venta"}
                          {property.status === "both" && "Renta o Venta"}
                        </div>
                        
                        {/* Precio(s) */}
                        {property.status === "both" ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-semibold text-primary">{formatPrice(property.price)}</span>
                              <span className="text-xs text-muted-foreground">/mes</span>
                            </div>
                            {property.salePrice && (
                              <div className="flex items-baseline gap-1">
                                <span className="text-sm font-semibold text-primary">{formatPrice(property.salePrice)}</span>
                                <span className="text-xs text-muted-foreground">venta</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(property.status === "sale" && property.salePrice ? property.salePrice : property.price)}
                              </span>
                              {property.status === "rent" && (
                                <span className="text-xs text-muted-foreground">/mes</span>
                              )}
                            </div>
                            {property.rating && parseFloat(property.rating) > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium">{property.rating}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Bed className="h-3 w-3" />
                            <span>{property.bedrooms}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bath className="h-3 w-3" />
                            <span>{property.bathrooms}</span>
                          </div>
                          {property.area && (
                            <div className="flex items-center gap-1">
                              <Square className="h-3 w-3" />
                              <span>{property.area}m²</span>
                            </div>
                          )}
                          {(property.amenities?.includes("Mascotas permitidas") || property.amenities?.includes("Pet Friendly")) && (
                            <div className="flex items-center gap-1" title="Pet-friendly">
                              <PawPrint className="h-3 w-3 text-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{property.location}</span>
                        </div>
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
