import { useState, lazy, Suspense, memo } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Map, Heart, SlidersHorizontal, Building2, Star, ChevronRight, Bed, Bath, Square, Calendar, Phone, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { type Colony, type Condominium } from "@shared/schema";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";

const FloatingChat = lazy(() => import("@/components/FloatingChat").then(m => ({ default: m.FloatingChat })));

const PropertyCardSkeleton = memo(function PropertyCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border bg-card">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>
    </div>
  );
});

const PropertyCard = memo(function PropertyCard({ 
  property, 
  compact = false,
  onNavigate 
}: { 
  property: any; 
  compact?: boolean;
  onNavigate: (url: string) => void;
}) {
  const propertyUrl = property.isExternal && property.agencySlug && property.unitSlug 
    ? `/${property.agencySlug}/${property.unitSlug}` 
    : property.isExternal 
      ? `/propiedad-externa/${property.id}` 
      : `/propiedad/${property.id}/completo`;

  const getFormattedTitle = () => {
    const types: Record<string, string> = {
      departamento: "Departamento",
      apartment: "Departamento",
      casa: "Casa",
      house: "Casa",
      estudio: "Estudio",
      studio: "Estudio",
      penthouse: "Penthouse",
      villa: "Villa",
    };
    const typeLabel = types[property.propertyType?.toLowerCase() || ''] || property.propertyType || "Propiedad";
    const condoName = property.condominiumName || '';
    const unitNum = property.unitNumber || '';
    
    if (condoName && unitNum) return `${typeLabel} en ${condoName} #${unitNum}`;
    if (condoName) return `${typeLabel} en ${condoName}`;
    if (unitNum) return `${typeLabel} #${unitNum}`;
    return property.title || typeLabel;
  };

  return (
    <div
      className={`group ${compact ? 'rounded-xl sm:rounded-2xl' : 'rounded-2xl'} overflow-hidden border bg-card hover-elevate cursor-pointer`}
      onClick={() => onNavigate(propertyUrl)}
      data-testid={`card-property-${property.id}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {property.primaryImages?.[0] ? (
          <img
            src={property.primaryImages[0]}
            alt={getFormattedTitle()}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            data-testid={`img-property-${property.id}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <Building2 className={`${compact ? 'h-8 w-8 sm:h-12 sm:w-12' : 'h-10 w-10'} text-muted-foreground`} />
          </div>
        )}
        <Badge className={`absolute ${compact ? 'top-2 left-2 sm:top-3 sm:left-3 text-[9px] sm:text-[10px] px-1.5 sm:px-2' : 'top-3 left-3 text-[10px] px-2'} bg-foreground text-background rounded-full`}>
          {property.status === "rent" ? "Renta" : property.status === "sale" ? "Venta" : "Renta/Venta"}
        </Badge>
        {!compact && (
          <button 
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Heart className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      <div className={compact ? 'p-2.5 sm:p-4' : 'p-3 sm:p-4'}>
        <h3 
          className={`font-semibold ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} mb-1 line-clamp-2`}
          data-testid={`text-title-${property.id}`}
        >
          {getFormattedTitle()}
        </h3>
        <p className={`${compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'} text-muted-foreground mb-2 truncate flex items-center gap-1`}>
          <MapPin className={`${compact ? 'h-2.5 w-2.5 sm:h-3 sm:w-3' : 'h-3 w-3'} shrink-0`} />
          {property.location}
        </p>
        <div className={`flex flex-wrap items-center gap-2 ${compact ? 'text-[10px] sm:text-xs' : 'text-xs'} text-muted-foreground mb-3`}>
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bed className="h-3 w-3" />
              {property.bedrooms} Rec
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bath className="h-3 w-3" />
              {property.bathrooms} Baños
            </span>
          )}
          {property.area > 0 && (
            <span className="flex items-center gap-1">
              <Square className="h-3 w-3" />
              {property.area} m²
            </span>
          )}
        </div>
        <div className={`flex items-center justify-between ${compact ? 'mb-2 sm:mb-3' : 'mb-3'} pt-2 border-t`}>
          <p className={`font-bold ${compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} text-primary`}>
            ${(property.price || 0).toLocaleString()} 
            <span className={`font-normal ${compact ? 'text-[9px] sm:text-[10px]' : 'text-xs'} text-muted-foreground ml-1`}>
              MXN{property.status === "rent" ? "/mes" : ""}
            </span>
          </p>
        </div>
        <div className="flex gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
          <Button 
            size="sm" 
            className={`flex-1 rounded-full ${compact ? 'text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3' : 'text-xs'}`}
            onClick={() => onNavigate(propertyUrl)}
          >
            <Calendar className="h-3 w-3 mr-1 hidden sm:inline" />
            Consultar
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className={`flex-1 rounded-full ${compact ? 'text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3' : 'text-xs'}`}
            onClick={() => onNavigate(propertyUrl)}
          >
            <Phone className="h-3 w-3 mr-1 hidden sm:inline" />
            Contactar
          </Button>
        </div>
      </div>
    </div>
  );
});

export default function PublicDashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [propertyType, setPropertyType] = useState("");
  const [colonyName, setColonyName] = useState("");
  const [condoName, setCondoName] = useState("");
  const [allowsSubleasing, setAllowsSubleasing] = useState(false);
  const { t } = useLanguage();

  const { data: externalPropertiesResponse, isLoading: propertiesLoading } = useQuery<{ data: any[]; totalCount: number }>({
    queryKey: ["/api/public/external-properties?limit=12"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const externalProperties = externalPropertiesResponse?.data || [];

  const { data: colonies = [] } = useQuery<Colony[]>({
    queryKey: ["/api/colonies/approved"],
    enabled: showFilters,
    staleTime: 10 * 60 * 1000,
  });

  const { data: condominiums = [] } = useQuery<Condominium[]>({
    queryKey: ["/api/condominiums/approved"],
    enabled: showFilters,
    staleTime: 10 * 60 * 1000,
  });

  const featuredProperties = externalProperties.slice(0, 4);
  const popularProperties = externalProperties.slice(0, 9);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append("q", searchQuery);
    if (propertyType && propertyType !== "all") params.append("propertyType", propertyType);
    if (colonyName && colonyName !== "all") params.append("colonyName", colonyName);
    if (condoName && condoName !== "all") params.append("condoName", condoName);
    if (allowsSubleasing) params.append("allowsSubleasing", "true");
    
    const queryString = params.toString();
    setLocation(queryString ? `/buscar-propiedades?${queryString}` : "/buscar-propiedades");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <img src={logoIcon} alt="HomesApp" className="h-14 w-auto" data-testid="img-logo-header" />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setLocation("/mapa-interactivo")}
              data-testid="button-interactive-map"
              title={t("public.interactiveMap") || "Mapa Interactivo"}
            >
              <Map className="h-5 w-5" />
            </Button>
            <LanguageToggle />
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs sm:text-sm"
              onClick={() => setLocation("/login")}
              data-testid="button-login"
            >
              {t("public.login") || "Entrar"}
            </Button>
            <Button
              size="sm"
              className="rounded-full text-xs sm:text-sm"
              onClick={() => setLocation("/register")}
              data-testid="button-register"
            >
              {t("public.register") || "Registro"}
            </Button>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-b from-muted/30 to-background py-8 sm:py-12 md:py-14">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            {t("public.hero.title") || "Tu próximo hogar"}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8">
            {t("public.hero.subtitle") || "Propiedades en Tulum, Riviera Maya"}
          </p>
          
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-2 p-2 sm:p-3 bg-background rounded-full border shadow-sm">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground ml-2 sm:ml-3" />
              <Input
                placeholder={t("public.searchPlaceholder") || "¿Dónde quieres vivir?"}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-sm sm:text-base h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                data-testid="input-search"
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
              <Button
                size="sm"
                className="rounded-full px-4 sm:px-6 h-9"
                onClick={handleSearch}
                data-testid="button-search"
              >
                {t("public.searchButton") || "Buscar"}
              </Button>
            </div>

            {showFilters && (
              <div className="mt-4 p-4 sm:p-6 bg-background border rounded-2xl shadow-sm text-left">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("public.filterPropertyType") || "Tipo"}
                    </label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger className="rounded-xl" data-testid="select-property-type">
                        <SelectValue placeholder={t("public.filterAllTypes") || "Todos"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("public.filterAllTypes") || "Todos"}</SelectItem>
                        <SelectItem value="house">{t("public.propertyType.house") || "Casa"}</SelectItem>
                        <SelectItem value="apartment">{t("public.propertyType.apartment") || "Departamento"}</SelectItem>
                        <SelectItem value="villa">{t("public.propertyType.villa") || "Villa"}</SelectItem>
                        <SelectItem value="condo">{t("public.propertyType.condo") || "Condominio"}</SelectItem>
                        <SelectItem value="penthouse">{t("public.propertyType.penthouse") || "Penthouse"}</SelectItem>
                        <SelectItem value="studio">{t("public.propertyType.studio") || "Estudio"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("public.filterColony") || "Zona"}
                    </label>
                    <Select value={colonyName} onValueChange={setColonyName}>
                      <SelectTrigger className="rounded-xl" data-testid="select-colony">
                        <SelectValue placeholder={t("public.filterColonyPlaceholder") || "Seleccionar"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("public.filterAllColonies") || "Todas"}</SelectItem>
                        {colonies.map((colony) => (
                          <SelectItem key={colony.id} value={colony.name}>
                            {colony.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("public.filterCondo") || "Condominio"}
                    </label>
                    <Select value={condoName} onValueChange={setCondoName}>
                      <SelectTrigger className="rounded-xl" data-testid="select-condo">
                        <SelectValue placeholder={t("public.filterCondoPlaceholder") || "Seleccionar"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("public.filterAllCondos") || "Todos"}</SelectItem>
                        {condominiums.map((condo) => (
                          <SelectItem key={condo.id} value={condo.name}>
                            {condo.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="allows-subleasing"
                      checked={allowsSubleasing}
                      onCheckedChange={(checked) => setAllowsSubleasing(checked === true)}
                      data-testid="checkbox-subleasing"
                    />
                    <label htmlFor="allows-subleasing" className="text-sm cursor-pointer">
                      {t("public.filterAllowsSubleasing") || "Permite subarrendamiento"}
                    </label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPropertyType("");
                      setColonyName("");
                      setCondoName("");
                      setSearchQuery("");
                      setAllowsSubleasing(false);
                    }}
                    data-testid="button-clear-filters"
                  >
                    {t("public.clearFilters") || "Limpiar"}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex justify-center gap-3">
              <Button
                variant="outline"
                className="rounded-full px-6 min-h-[44px]"
                onClick={() => setLocation("/buscar-propiedades?status=rent")}
                data-testid="button-filter-rent"
              >
                Renta
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-6 min-h-[44px]"
                onClick={() => setLocation("/buscar-propiedades?status=sale")}
                data-testid="button-filter-sale"
              >
                Venta
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-6 min-h-[44px]"
                onClick={() => setLocation("/buscar-propiedades?featured=true")}
                data-testid="button-filter-featured"
              >
                Destacados
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold">{t("public.featured.title") || "Destacadas"}</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1"
              onClick={() => setLocation("/buscar-propiedades?featured=true")}
              data-testid="button-view-all-featured"
            >
              Ver más <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {propertiesLoading ? (
              <>
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
              </>
            ) : featuredProperties.length > 0 ? (
              featuredProperties.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  onNavigate={setLocation}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No hay propiedades destacadas disponibles
              </div>
            )}
          </div>
        </div>

        <div className="mb-10 sm:mb-14">
          <div 
            className="relative rounded-2xl overflow-hidden border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent cursor-pointer hover-elevate"
            onClick={() => setLocation("/mapa-interactivo")}
            data-testid="banner-interactive-map"
          >
            <div className="flex items-center justify-between p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Map className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-1">
                    {t("public.map.title") || "Explora en el mapa"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("public.map.subtitle") || "Encuentra propiedades por ubicación"}
                  </p>
                </div>
              </div>
              <Button
                variant="default"
                size="sm"
                className="rounded-full gap-1 hidden sm:flex"
                data-testid="button-view-map"
              >
                Ver Mapa <ChevronRight className="h-4 w-4" />
              </Button>
              <ChevronRight className="h-5 w-5 text-muted-foreground sm:hidden" />
            </div>
          </div>
        </div>

        <div className="mb-6 sm:mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-2xl font-semibold">{t("public.explore.title") || "Explora Propiedades"}</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1 text-xs sm:text-sm"
              onClick={() => setLocation("/buscar-propiedades")}
              data-testid="button-view-all-properties"
            >
              Ver todas <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          <div className="grid gap-3 sm:gap-5 grid-cols-2 lg:grid-cols-3">
            {propertiesLoading ? (
              <>
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
              </>
            ) : popularProperties.length > 0 ? (
              popularProperties.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property}
                  compact
                  onNavigate={setLocation}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No hay propiedades disponibles
              </div>
            )}
          </div>
        </div>

        <div className="py-6 sm:py-10 border-t border-b">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 text-center">
            <div>
              <p className="text-xl sm:text-2xl font-bold">1000+</p>
              <p className="text-xs text-muted-foreground">Propiedades</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-1">
                4.9 <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-foreground" />
              </p>
              <p className="text-xs text-muted-foreground">Calificación</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">24h</p>
              <p className="text-xs text-muted-foreground">Respuesta</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">10+</p>
              <p className="text-xs text-muted-foreground">Agentes</p>
            </div>
          </div>
        </div>

        <div className="py-10 sm:py-14">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-muted/50 border">
              <div className="h-12 w-12 rounded-full bg-foreground flex items-center justify-center mb-4">
                <Home className="h-5 w-5 text-background" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-2">{t("public.clientBenefits.title") || "¿Buscas rentar?"}</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                {t("public.clientBenefits.subtitle") || "Encuentra la propiedad perfecta para ti en Tulum"}
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  {t("public.clientBenefits.benefit1") || "Propiedades verificadas"}
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  {t("public.clientBenefits.benefit2") || "Tours virtuales disponibles"}
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  {t("public.clientBenefits.benefit3") || "Soporte 24/7"}
                </li>
              </ul>
              <Button className="rounded-full" onClick={() => setLocation("/buscar-propiedades")}>
                Explorar propiedades
              </Button>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-muted/50 border">
              <div className="h-12 w-12 rounded-full bg-foreground flex items-center justify-center mb-4">
                <Building2 className="h-5 w-5 text-background" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-2">{t("public.ownerBenefits.title") || "¿Tienes una propiedad?"}</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                {t("public.ownerBenefits.subtitle") || "Renta tu propiedad con nosotros"}
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  {t("public.ownerBenefits.benefit1") || "Máxima exposición"}
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  {t("public.ownerBenefits.benefit2") || "Gestión profesional"}
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  {t("public.ownerBenefits.benefit3") || "Contratos seguros"}
                </li>
              </ul>
              <Button variant="outline" className="rounded-full" onClick={() => setLocation("/register")}>
                Registrar propiedad
              </Button>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t bg-muted/30 py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-2 sm:col-span-1">
              <img src={logoIcon} alt="HomesApp" className="h-10 w-auto mb-3 sm:mb-4" loading="lazy" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Tu socio inmobiliario en Tulum
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2 sm:mb-3 text-xs sm:text-sm">Propiedades</h4>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <button 
                  onClick={() => setLocation("/buscar-propiedades?status=rent")}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  En Renta
                </button>
                <button 
                  onClick={() => setLocation("/buscar-propiedades?status=sale")}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  En Venta
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 sm:mb-3 text-xs sm:text-sm">Empresa</h4>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <button 
                  onClick={() => setLocation("/login")}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Iniciar sesión
                </button>
                <button 
                  onClick={() => setLocation("/aplicar")}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Trabaja con nosotros
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 sm:mb-3 text-xs sm:text-sm">Síguenos</h4>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <a 
                  href="https://www.facebook.com/share/1B5kd6EAnQ/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Facebook
                </a>
                <a 
                  href="https://www.instagram.com/tulum.rental.homes" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
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

      <Suspense fallback={null}>
        <FloatingChat />
      </Suspense>
    </div>
  );
}
