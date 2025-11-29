import { useState } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Home, Heart, SlidersHorizontal, Building2, Users, Star, Clock, ChevronRight, MessageCircle } from "lucide-react";
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
  const { data: externalProperties = [] } = useQuery<any[]>({
    queryKey: ["/api/public/external-properties?limit=12"],
  });

  const { data: colonies = [] } = useQuery<Colony[]>({
    queryKey: ["/api/colonies/approved"],
    enabled: showFilters,
  });

  const { data: condominiums = [] } = useQuery<Condominium[]>({
    queryKey: ["/api/condominiums/approved"],
    enabled: showFilters,
  });

  const featuredProperties = externalProperties.slice(0, 4);
  const popularProperties = externalProperties.slice(0, 8);

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

  const popularZones = [
    { name: "Aldea Zamá", query: "Aldea Zamá" },
    { name: "La Veleta", query: "La Veleta" },
    { name: "Holistika", query: "Holistika" },
    { name: "Centro", query: "Centro" },
    { name: "Región 15", query: "Región 15" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Minimalist Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <img src={logoIcon} alt="HomesApp" className="h-8 w-auto" data-testid="img-logo-header" />
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
      <div className="bg-gradient-to-b from-muted/30 to-background py-12 sm:py-16 md:py-20">
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
            
            {/* Popular Zones - Compact Pills */}
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {popularZones.map((zone) => (
                <Badge
                  key={zone.name}
                  variant="secondary"
                  className="rounded-full px-2.5 py-1 text-[11px] cursor-pointer hover-elevate"
                  onClick={() => setLocation(`/buscar-propiedades?location=${encodeURIComponent(zone.query)}`)}
                >
                  {zone.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
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
              {featuredProperties.map((property) => (
                <div
                  key={property.id}
                  className="group cursor-pointer rounded-2xl overflow-hidden border bg-card hover-elevate"
                  onClick={() => setLocation(property.isExternal ? `/propiedad-externa/${property.id}` : `/propiedad/${property.id}/completo`)}
                  data-testid={`card-property-${property.id}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {property.primaryImages && property.primaryImages[0] ? (
                      <img
                        src={property.primaryImages[0]}
                        alt={property.title || "Propiedad"}
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
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-medium text-sm sm:text-base truncate" data-testid={`text-title-${property.id}`}>
                        {property.title || "Propiedad"}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 truncate flex items-center gap-1" data-testid={`text-location-${property.id}`}>
                      <MapPin className="h-3 w-3 shrink-0" />
                      {property.location}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm sm:text-base" data-testid={`text-price-${property.id}`}>
                        ${(property.price || 0).toLocaleString()} 
                        <span className="font-normal text-xs text-muted-foreground ml-1">
                          USD{property.status === "rent" ? "/mes" : ""}
                        </span>
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {property.bedrooms || 0} rec · {property.bathrooms || 0} baños
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Now - Grid */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold">{t("public.explore.title") || "Propiedades Destacadas"}</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1"
              onClick={() => setLocation("/buscar-propiedades")}
              data-testid="button-view-all-properties"
            >
              Ver todas <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {popularProperties.map((property) => (
              <div
                key={property.id}
                className="group cursor-pointer rounded-2xl overflow-hidden border bg-card hover-elevate"
                onClick={() => setLocation(property.isExternal ? `/propiedad-externa/${property.id}` : `/propiedad/${property.id}/completo`)}
                data-testid={`card-all-property-${property.id}`}
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {property.primaryImages && property.primaryImages[0] ? (
                    <img
                      src={property.primaryImages[0]}
                      alt={property.title || "Propiedad"}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      data-testid={`img-all-property-${property.id}`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className="absolute top-3 left-3 bg-foreground text-background text-[10px] rounded-full px-2">
                    {property.status === "rent" ? "Renta" : "Venta"}
                  </Badge>
                  <button 
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium truncate" data-testid={`text-all-title-${property.id}`}>
                      {property.title || "Propiedad"}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 truncate flex items-center gap-1" data-testid={`text-all-location-${property.id}`}>
                    <MapPin className="h-3 w-3 shrink-0" />
                    {property.location}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <p className="font-bold" data-testid={`text-all-price-${property.id}`}>
                      ${(property.price || 0).toLocaleString()} 
                      <span className="font-normal text-sm text-muted-foreground ml-1">
                        USD{property.status === "rent" ? "/mes" : ""}
                      </span>
                    </p>
                    <div className="text-sm text-muted-foreground">
                      {property.bedrooms || 0} rec · {property.bathrooms || 0} baños
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats - Clean and Simple */}
        <div className="py-8 sm:py-12 border-t border-b">
          <div className="flex items-center justify-center gap-8 sm:gap-16 flex-wrap">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold">200+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Propiedades</p>
            </div>
            <div className="w-px h-10 bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-1">
                4.9 <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-foreground" />
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Calificación</p>
            </div>
            <div className="w-px h-10 bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold">24h</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Respuesta</p>
            </div>
            <div className="w-px h-10 bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold">50+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Agentes</p>
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

      {/* Footer - Minimalist */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-10 sm:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => setLocation("/")}>
                <img src={logoIcon} alt="HomesApp" className="h-8 w-auto" data-testid="img-logo-footer" />
              </div>
              <p className="text-sm text-muted-foreground">
                La mejor plataforma inmobiliaria en Tulum, Riviera Maya.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-medium mb-4 text-sm">Explorar</h4>
              <div className="space-y-2 text-sm">
                <button 
                  onClick={() => setLocation("/buscar-propiedades")}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Propiedades
                </button>
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

            {/* Contact */}
            <div>
              <h4 className="font-medium mb-4 text-sm">Contacto</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>+52 984 321 3385</p>
                <p className="text-xs">administracion@tulumrentalhomes.com.mx</p>
              </div>
            </div>

            {/* Social & Legal */}
            <div>
              <h4 className="font-medium mb-4 text-sm">Síguenos</h4>
              <div className="space-y-2 text-sm">
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

          <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Tulum Rental Homes. Todos los derechos reservados.
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
    </div>
  );
}
