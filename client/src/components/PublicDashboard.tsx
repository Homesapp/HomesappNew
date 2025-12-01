import { useState } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Home, Heart, SlidersHorizontal, Building2, Users, Star, Clock, ChevronRight, MessageCircle, Bed, Bath, Square, Calendar, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { type Property, type Colony, type Condominium } from "@shared/schema";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPropertyTitle } from "@/lib/propertyHelpers";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";
import { FloatingChat } from "@/components/FloatingChat";

export default function PublicDashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [propertyType, setPropertyType] = useState("");
  const [colonyName, setColonyName] = useState("");
  const [condoName, setCondoName] = useState("");
  const [allowsSubleasing, setAllowsSubleasing] = useState(false);
  const { t } = useLanguage();

  // Load external approved properties for homepage
  const { data: externalPropertiesResponse } = useQuery<{ data: any[]; totalCount: number }>({
    queryKey: ["/api/public/external-properties?limit=12"],
  });
  const externalProperties = externalPropertiesResponse?.data || [];

  const { data: colonies = [] } = useQuery<Colony[]>({
    queryKey: ["/api/colonies/approved"],
    enabled: showFilters,
  });

  const { data: condominiums = [] } = useQuery<Condominium[]>({
    queryKey: ["/api/condominiums/approved"],
    enabled: showFilters,
  });

  const featuredProperties = externalProperties.slice(0, 4);
  const popularProperties = externalProperties.slice(0, 9);

  const getPropertyTypeLabel = (type: string | null) => {
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
    return types[type?.toLowerCase() || ''] || type || "Propiedad";
  };

  const getFormattedTitle = (property: any) => {
    const typeLabel = getPropertyTypeLabel(property.propertyType);
    const condoName = property.condominiumName || '';
    const unitNum = property.unitNumber || '';
    
    if (condoName && unitNum) {
      return `${typeLabel} en ${condoName} #${unitNum}`;
    } else if (condoName) {
      return `${typeLabel} en ${condoName}`;
    } else if (unitNum) {
      return `${typeLabel} #${unitNum}`;
    }
    return property.title || typeLabel;
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.append("q", searchQuery);
    }
    if (propertyType && propertyType !== "all") {
      params.append("propertyType", propertyType);
    }
    if (colonyName && colonyName !== "all") {
      params.append("colonyName", colonyName);
    }
    if (condoName && condoName !== "all") {
      params.append("condoName", condoName);
    }
    if (allowsSubleasing) {
      params.append("allowsSubleasing", "true");
    }
    
    const queryString = params.toString();
    setLocation(queryString ? `/buscar-propiedades?${queryString}` : "/buscar-propiedades");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimalist Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <img src={logoIcon} alt="HomesApp" className="h-14 w-auto" data-testid="img-logo-header" />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span 
              className="text-sm text-muted-foreground hidden md:block cursor-pointer hover:text-foreground transition-colors"
              onClick={() => setLocation("/buscar-propiedades")}
            >
              {t("public.searchButton") || "Buscar"}
            </span>
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

      {/* Hero Section - Ultra Clean */}
      <div className="bg-gradient-to-b from-muted/30 to-background py-8 sm:py-12 md:py-14">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            {t("public.hero.title") || "Tu próximo hogar"}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8">
            {t("public.hero.subtitle") || "Propiedades en Tulum, Riviera Maya"}
          </p>
          
          {/* Minimalist Search Bar */}
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

            {/* Advanced Filters - Minimalist */}
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
            
            {/* Quick Filter Buttons - Centered */}
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
        {/* Featured Properties - Clean Cards */}
        {featuredProperties.length > 0 && (
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
              {featuredProperties.map((property) => {
                const propertyUrl = property.isExternal && property.agencySlug && property.unitSlug 
                  ? `/${property.agencySlug}/${property.unitSlug}` 
                  : property.isExternal 
                    ? `/propiedad-externa/${property.id}` 
                    : `/propiedad/${property.id}/completo`;
                return (
                <div
                  key={property.id}
                  className="group rounded-2xl overflow-hidden border bg-card hover-elevate cursor-pointer"
                  onClick={() => setLocation(propertyUrl)}
                  data-testid={`card-property-${property.id}`}
                >
                  <div 
                    className="relative aspect-[4/3] overflow-hidden bg-muted"
                  >
                    {property.primaryImages && property.primaryImages[0] ? (
                      <img
                        src={property.primaryImages[0]}
                        alt={getFormattedTitle(property)}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        data-testid={`img-property-${property.id}`}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-muted">
                        <Building2 className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-foreground text-background text-[10px] rounded-full px-2">
                      {property.status === "rent" ? "Renta" : property.status === "sale" ? "Venta" : "Renta/Venta"}
                    </Badge>
                    <button 
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 
                      className="font-semibold text-sm sm:text-base mb-1 line-clamp-2" 
                      data-testid={`text-title-${property.id}`}
                    >
                      {getFormattedTitle(property)}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 truncate flex items-center gap-1" data-testid={`text-location-${property.id}`}>
                      <MapPin className="h-3 w-3 shrink-0" />
                      {property.location}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
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
                    <div className="flex items-center justify-between mb-3 pt-2 border-t">
                      <p className="font-bold text-base sm:text-lg text-primary" data-testid={`text-price-${property.id}`}>
                        ${(property.price || 0).toLocaleString()} 
                        <span className="font-normal text-xs text-muted-foreground ml-1">
                          MXN{property.status === "rent" ? "/mes" : ""}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        size="sm" 
                        className="flex-1 rounded-full text-xs"
                        onClick={() => setLocation(propertyUrl)}
                        data-testid={`button-consult-${property.id}`}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Consultar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 rounded-full text-xs"
                        onClick={() => setLocation(propertyUrl)}
                        data-testid={`button-contact-${property.id}`}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Contactar
                      </Button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}

        {/* Explora Propiedades - Responsive Grid */}
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
            {popularProperties.map((property) => {
              const propertyUrl = property.isExternal && property.agencySlug && property.unitSlug 
                ? `/${property.agencySlug}/${property.unitSlug}` 
                : property.isExternal 
                  ? `/propiedad-externa/${property.id}` 
                  : `/propiedad/${property.id}/completo`;
              return (
              <div
                key={property.id}
                className="group rounded-xl sm:rounded-2xl overflow-hidden border bg-card hover-elevate cursor-pointer"
                onClick={() => setLocation(propertyUrl)}
                data-testid={`card-all-property-${property.id}`}
              >
                <div 
                  className="relative aspect-[4/3] overflow-hidden bg-muted"
                >
                  {property.primaryImages && property.primaryImages[0] ? (
                    <img
                      src={property.primaryImages[0]}
                      alt={getFormattedTitle(property)}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      data-testid={`img-all-property-${property.id}`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <Building2 className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-foreground text-background text-[9px] sm:text-[10px] rounded-full px-1.5 sm:px-2">
                    {property.status === "rent" ? "Renta" : "Venta"}
                  </Badge>
                  <button 
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="p-2.5 sm:p-4">
                  <h3 
                    className="font-semibold text-xs sm:text-base mb-0.5 sm:mb-1 line-clamp-2" 
                    data-testid={`text-all-title-${property.id}`}
                  >
                    {getFormattedTitle(property)}
                  </h3>
                  <p className="text-[10px] sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 truncate flex items-center gap-0.5 sm:gap-1" data-testid={`text-all-location-${property.id}`}>
                    <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                    {property.location}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
                    {property.bedrooms > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Bed className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {property.bedrooms} Rec
                      </span>
                    )}
                    {property.bathrooms > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Bath className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {property.bathrooms} Baños
                      </span>
                    )}
                    {property.area > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Square className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {property.area} m²
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3 pt-2 border-t">
                    <p className="font-bold text-xs sm:text-base text-primary" data-testid={`text-all-price-${property.id}`}>
                      ${(property.price || 0).toLocaleString()} 
                      <span className="font-normal text-[9px] sm:text-xs text-muted-foreground ml-0.5 sm:ml-1">
                        MXN{property.status === "rent" ? "/mes" : ""}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      size="sm" 
                      className="flex-1 rounded-full text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                      onClick={() => setLocation(propertyUrl)}
                      data-testid={`button-all-consult-${property.id}`}
                    >
                      <Calendar className="h-3 w-3 mr-1 hidden sm:inline" />
                      Consultar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 rounded-full text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                      onClick={() => setLocation(propertyUrl)}
                      data-testid={`button-all-contact-${property.id}`}
                    >
                      <Phone className="h-3 w-3 mr-1 hidden sm:inline" />
                      Contactar
                    </Button>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Stats - Clean and Simple */}
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

        {/* CTA Sections - Clean Cards */}
        <div className="py-10 sm:py-14">
          <div className="grid md:grid-cols-2 gap-6">
            {/* For Renters */}
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

            {/* For Owners */}
            <div className="p-6 sm:p-8 rounded-2xl bg-muted/50 border">
              <div className="h-12 w-12 rounded-full bg-foreground flex items-center justify-center mb-4">
                <Building2 className="h-5 w-5 text-background" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-2">{t("public.ownerBenefits.title") || "¿Tienes una propiedad?"}</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                {t("public.ownerBenefits.subtitle") || "Publica y administra tu propiedad con nosotros"}
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  {t("public.ownerBenefits.benefit1") || "Administración profesional"}
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  {t("public.ownerBenefits.benefit2") || "Inquilinos verificados"}
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  {t("public.ownerBenefits.benefit3") || "Reportes financieros"}
                </li>
              </ul>
              <Button className="rounded-full" onClick={() => setLocation("/register")}>
                Publicar propiedad
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Minimalist Mobile-First */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          {/* Mobile: Stack vertically, Desktop: Grid */}
          <div className="flex flex-col space-y-6 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-8">
            {/* Brand - Full width on mobile */}
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3 cursor-pointer" onClick={() => setLocation("/")}>
                <img src={logoIcon} alt="HomesApp" className="h-12 w-auto" data-testid="img-logo-footer" />
              </div>
              <p className="text-xs text-muted-foreground max-w-[200px] mx-auto sm:mx-0">
                La mejor plataforma inmobiliaria en Tulum, Riviera Maya.
              </p>
            </div>

            {/* Mobile: 3 columns for links, Desktop: individual columns */}
            <div className="grid grid-cols-3 gap-4 sm:contents">
              {/* Links */}
              <div className="text-center sm:text-left">
                <h4 className="font-medium mb-2 sm:mb-3 text-xs sm:text-sm">Explorar</h4>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <button 
                    onClick={() => setLocation("/buscar-propiedades")}
                    className="block w-full text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Propiedades
                  </button>
                  <button 
                    onClick={() => setLocation("/buscar-propiedades?status=rent")}
                    className="block w-full text-muted-foreground hover:text-foreground transition-colors"
                  >
                    En Renta
                  </button>
                  <button 
                    onClick={() => setLocation("/buscar-propiedades?status=sale")}
                    className="block w-full text-muted-foreground hover:text-foreground transition-colors"
                  >
                    En Venta
                  </button>
                </div>
              </div>

              {/* Contact */}
              <div className="text-center sm:text-left">
                <h4 className="font-medium mb-2 sm:mb-3 text-xs sm:text-sm">Contacto</h4>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <p>+52 984 321 3385</p>
                  <p className="break-all text-[10px] sm:text-xs">admin@trh.mx</p>
                </div>
              </div>

              {/* Social */}
              <div className="text-center sm:text-left">
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
          </div>

          {/* Bottom bar */}
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

      <FloatingChat />
    </div>
  );
}
