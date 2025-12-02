import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PropertyMap } from "@/components/external/PropertyMap";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Home, 
  MapPin, 
  Bed, 
  Bath, 
  DollarSign, 
  Filter, 
  X, 
  Building2, 
  ChevronLeft,
  Search,
  SlidersHorizontal,
  RotateCcw
} from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";

interface Filters {
  search: string;
  status: string;
  propertyType: string;
  zone: string;
  condominiumName: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  bathrooms: string;
  petFriendly: boolean;
}

const defaultFilters: Filters = {
  search: "",
  status: "all",
  propertyType: "all",
  zone: "all",
  condominiumName: "all",
  minPrice: 0,
  maxPrice: Infinity,
  bedrooms: "all",
  bathrooms: "all",
  petFriendly: false,
};

export default function InteractiveMap() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: propertiesResponse, isLoading, error } = useQuery<{ data: any[]; pagination: any }>({
    queryKey: ["/api/public/external-properties?limit=500&hasCoordinates=true"],
  });

  const { data: zonesData } = useQuery<{ data: string[] }>({
    queryKey: ["/api/public/zones"],
  });

  const { data: condominiumsData } = useQuery<any>({
    queryKey: ["/api/public/condominiums"],
  });

  const allProperties = propertiesResponse?.data || [];
  const rawZones = zonesData?.data || [];
  const condominiums = Array.isArray(condominiumsData) ? condominiumsData : (condominiumsData?.data || []);

  // Calculate the maximum price from the dataset for dynamic slider
  const datasetMaxPrice = useMemo(() => {
    if (allProperties.length === 0) return 500000;
    const prices = allProperties
      .map((p: any) => p.price || 0)
      .filter((p: number) => p > 0);
    const maxPrice = Math.max(...prices, 500000);
    // Round up to nearest 50,000 for cleaner UI
    return Math.ceil(maxPrice / 50000) * 50000;
  }, [allProperties]);

  const zones = useMemo(() => {
    const normalizedMap = new Map<string, string>();
    rawZones.forEach((zone: string) => {
      const key = zone.toLowerCase().trim();
      if (!normalizedMap.has(key)) {
        normalizedMap.set(key, zone);
      }
    });
    return Array.from(normalizedMap.values()).sort((a, b) => a.localeCompare(b, 'es'));
  }, [rawZones]);

  const filteredProperties = useMemo(() => {
    return allProperties.filter((property: any) => {
      if (!property.latitude || !property.longitude) return false;

      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          property.title?.toLowerCase().includes(searchTerm) ||
          property.location?.toLowerCase().includes(searchTerm) ||
          property.zone?.toLowerCase().includes(searchTerm) ||
          property.condominiumName?.toLowerCase().includes(searchTerm) ||
          property.unitNumber?.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      if (filters.status !== "all") {
        if (filters.status === "rent" && property.listingType !== "rent" && property.listingType !== "both") return false;
        if (filters.status === "sale" && property.listingType !== "sale" && property.listingType !== "both") return false;
      }

      if (filters.propertyType !== "all" && property.propertyType !== filters.propertyType) return false;

      if (filters.zone !== "all") {
        const filterZone = filters.zone.toLowerCase().trim();
        const propertyZone = (property.zone || "").toLowerCase().trim();
        if (filterZone !== propertyZone) return false;
      }

      if (filters.condominiumName !== "all" && property.condominiumName !== filters.condominiumName) return false;

      const price = property.price || 0;
      if (price < filters.minPrice || price > filters.maxPrice) return false;

      if (filters.bedrooms !== "all") {
        const bedroomCount = parseInt(filters.bedrooms);
        if (filters.bedrooms === "4+" && (property.bedrooms || 0) < 4) return false;
        if (filters.bedrooms !== "4+" && (property.bedrooms || 0) !== bedroomCount) return false;
      }

      if (filters.bathrooms !== "all") {
        const bathroomCount = parseFloat(filters.bathrooms);
        const propertyBathrooms = parseFloat(property.bathrooms || "0");
        if (filters.bathrooms === "3+" && propertyBathrooms < 3) return false;
        if (filters.bathrooms !== "3+" && propertyBathrooms !== bathroomCount) return false;
      }

      if (filters.petFriendly) {
        const petsAllowed = property.petsAllowed;
        const isPetFriendly = petsAllowed === true || 
          petsAllowed === "true" || 
          petsAllowed === "Sí" || 
          petsAllowed === "sí" || 
          petsAllowed === "si" ||
          petsAllowed === "yes" ||
          petsAllowed === "Yes";
        if (!isPetFriendly) return false;
      }

      return true;
    });
  }, [allProperties, filters]);

  const mapProperties = filteredProperties.map((p: any) => ({
    id: p.id,
    title: p.title,
    unitNumber: p.unitNumber || "",
    condominiumName: p.condominiumName,
    latitude: parseFloat(p.latitude),
    longitude: parseFloat(p.longitude),
    price: p.price,
    salePrice: p.salePrice,
    currency: p.currency,
    saleCurrency: p.saleCurrency,
    listingType: p.listingType,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: p.area,
    propertyType: p.propertyType,
    zone: p.zone,
    primaryImages: p.primaryImages,
    slug: p.unitSlug,
    agencySlug: p.agencySlug,
  }));

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "search" && value) return true;
    if (key === "status" && value !== "all") return true;
    if (key === "propertyType" && value !== "all") return true;
    if (key === "zone" && value !== "all") return true;
    if (key === "condominiumName" && value !== "all") return true;
    if (key === "minPrice" && value > 0) return true;
    if (key === "maxPrice" && value !== Infinity && value < datasetMaxPrice) return true;
    if (key === "bedrooms" && value !== "all") return true;
    if (key === "bathrooms" && value !== "all") return true;
    if (key === "petFriendly" && value) return true;
    return false;
  }).length;

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const propertyTypes = [
    { value: "all", label: language === "es" ? "Todos" : "All" },
    { value: "Departamento", label: language === "es" ? "Departamento" : "Apartment" },
    { value: "Casa", label: language === "es" ? "Casa" : "House" },
    { value: "Penthouse", label: "Penthouse" },
    { value: "Studio", label: "Studio" },
    { value: "Loft", label: "Loft" },
    { value: "Villa", label: "Villa" },
  ];

  const FiltersContent = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
          {language === "es" ? "Buscar" : "Search"}
        </Label>
        <Input
          placeholder={language === "es" ? "Nombre, ubicación..." : "Name, location..."}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="h-9"
          data-testid="input-map-search"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Home className="h-4 w-4" />
          {language === "es" ? "Tipo de operación" : "Operation Type"}
        </Label>
        <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
          <SelectTrigger className="h-9" data-testid="select-map-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
            <SelectItem value="rent">{language === "es" ? "Renta" : "Rent"}</SelectItem>
            <SelectItem value="sale">{language === "es" ? "Venta" : "Sale"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {language === "es" ? "Tipo de propiedad" : "Property Type"}
        </Label>
        <Select value={filters.propertyType} onValueChange={(value) => setFilters({ ...filters, propertyType: value })}>
          <SelectTrigger className="h-9" data-testid="select-map-property-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {propertyTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {language === "es" ? "Zona / Colonia" : "Zone / Area"}
        </Label>
        <Select value={filters.zone} onValueChange={(value) => setFilters({ ...filters, zone: value })}>
          <SelectTrigger className="h-9" data-testid="select-map-zone">
            <SelectValue placeholder={language === "es" ? "Seleccionar zona" : "Select zone"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "es" ? "Todas las zonas" : "All zones"}</SelectItem>
            {zones.map((zone: string) => (
              <SelectItem key={zone} value={zone}>{zone}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {language === "es" ? "Condominio" : "Condominium"}
        </Label>
        <Select value={filters.condominiumName} onValueChange={(value) => setFilters({ ...filters, condominiumName: value })}>
          <SelectTrigger className="h-9" data-testid="select-map-condominium">
            <SelectValue placeholder={language === "es" ? "Seleccionar condominio" : "Select condominium"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "es" ? "Todos los condominios" : "All condominiums"}</SelectItem>
            {condominiums.map((condo: any) => (
              <SelectItem key={condo.id || condo.name} value={condo.name}>{condo.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          {language === "es" ? "Rango de precio (MXN)" : "Price Range (MXN)"}
        </Label>
        <div className="px-2">
          <Slider
            min={0}
            max={datasetMaxPrice}
            step={Math.max(1000, Math.floor(datasetMaxPrice / 100))}
            value={[filters.minPrice, Math.min(filters.maxPrice === Infinity ? datasetMaxPrice : filters.maxPrice, datasetMaxPrice)]}
            onValueChange={([min, max]) => setFilters({ ...filters, minPrice: min, maxPrice: max >= datasetMaxPrice ? Infinity : max })}
            className="w-full"
            data-testid="slider-map-price"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>${filters.minPrice.toLocaleString()}</span>
            <span>{filters.maxPrice === Infinity ? `$${datasetMaxPrice.toLocaleString()}+` : `$${filters.maxPrice.toLocaleString()}`}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Bed className="h-4 w-4" />
            {language === "es" ? "Recámaras" : "Bedrooms"}
          </Label>
          <Select value={filters.bedrooms} onValueChange={(value) => setFilters({ ...filters, bedrooms: value })}>
            <SelectTrigger className="h-9" data-testid="select-map-bedrooms">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "es" ? "Todas" : "All"}</SelectItem>
              <SelectItem value="0">Studio</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4+">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Bath className="h-4 w-4" />
            {language === "es" ? "Baños" : "Bathrooms"}
          </Label>
          <Select value={filters.bathrooms} onValueChange={(value) => setFilters({ ...filters, bathrooms: value })}>
            <SelectTrigger className="h-9" data-testid="select-map-bathrooms">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="1.5">1.5</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="2.5">2.5</SelectItem>
              <SelectItem value="3+">3+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="petFriendly"
          checked={filters.petFriendly}
          onCheckedChange={(checked) => setFilters({ ...filters, petFriendly: checked as boolean })}
          data-testid="checkbox-map-pet-friendly"
        />
        <Label htmlFor="petFriendly" className="text-sm cursor-pointer">
          {language === "es" ? "Acepta mascotas" : "Pet Friendly"}
        </Label>
      </div>

      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          className="w-full gap-2"
          data-testid="button-reset-filters"
        >
          <RotateCcw className="h-4 w-4" />
          {language === "es" ? "Limpiar filtros" : "Clear filters"}
        </Button>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setLocation("/")}
              data-testid="button-back-home"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
              <img src={logoIcon} alt="HomesApp" className="h-10 w-auto" />
              <span className="font-semibold text-lg hidden sm:block">
                {language === "es" ? "Mapa Interactivo" : "Interactive Map"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              {mapProperties.length} {language === "es" ? "propiedades" : "properties"}
            </Badge>
            
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden gap-2"
                  data-testid="button-mobile-filters"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {language === "es" ? "Filtros" : "Filters"}
                  {activeFiltersCount > 0 && (
                    <Badge variant="default" className="h-5 w-5 p-0 justify-center">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    {language === "es" ? "Filtros de búsqueda" : "Search Filters"}
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] pr-4 mt-4">
                  <FiltersContent />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <LanguageToggle />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden lg:block w-80 border-r bg-card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {language === "es" ? "Filtros de búsqueda" : "Search Filters"}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {activeFiltersCount}
                </Badge>
              )}
            </h2>
          </div>
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-4">
              <FiltersContent />
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="text-center space-y-3">
                <Skeleton className="h-8 w-8 rounded-full mx-auto animate-spin" />
                <p className="text-sm text-muted-foreground">
                  {language === "es" ? "Cargando mapa..." : "Loading map..."}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  {language === "es" ? "Error al cargar el mapa" : "Error loading map"}
                </p>
              </div>
            </div>
          ) : (
            <PropertyMap
              properties={mapProperties}
              height="100%"
              zoom={12}
              language={language}
              linkPrefix="/public-unit"
              showInfoWindow={true}
            />
          )}
          
          {!isLoading && mapProperties.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Card className="max-w-sm mx-4">
                <CardContent className="pt-6 text-center space-y-3">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="font-semibold">
                    {language === "es" ? "Sin resultados" : "No results"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" 
                      ? "No se encontraron propiedades con los filtros seleccionados." 
                      : "No properties found with the selected filters."}
                  </p>
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    {language === "es" ? "Limpiar filtros" : "Clear filters"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
