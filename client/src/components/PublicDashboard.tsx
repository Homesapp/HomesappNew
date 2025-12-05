import { useState, lazy, Suspense, memo } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Map, SlidersHorizontal, Building2, Star, ChevronRight, Home, Calendar, Laptop, Award, Users, CheckCircle2, ChevronDown, Quote, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { type Colony, type Condominium } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicHeader } from "@/components/PublicHeader";
import { UnifiedPropertyCard, type PropertyStatus } from "@/components/UnifiedPropertyCard";
import { homepageContent } from "@/lib/homepageContent";
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

export default function PublicDashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [propertyType, setPropertyType] = useState("");
  const [colonyName, setColonyName] = useState("");
  const [condoName, setCondoName] = useState("");
  const [allowsSubleasing, setAllowsSubleasing] = useState(false);
  const { t, language } = useLanguage();
  
  const content = homepageContent[language as keyof typeof homepageContent] || homepageContent.es;

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

  const getPropertyUrl = (property: any) => {
    if (property.isExternal && property.agencySlug && property.unitSlug) {
      return `/${property.agencySlug}/${property.unitSlug}`;
    }
    if (property.isExternal) {
      return `/propiedad-externa/${property.id}`;
    }
    return `/propiedad/${property.id}/completo`;
  };

  const getPropertyStatus = (property: any): PropertyStatus => {
    const s = (property.status || '').toLowerCase();
    if (s === 'available' || s === 'rent' || s.includes('rent')) return 'available';
    if (s === 'occupied') return 'occupied';
    if (s === 'reserved') return 'reserved';
    if (s === 'sold') return 'sold';
    if (s === 'rented') return 'rented';
    return 'available';
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* 1. Hero + Buscador */}
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
            
            <div className="mt-4 flex justify-center gap-3 flex-wrap">
              <Button
                variant="outline"
                className="rounded-full px-6 min-h-[44px]"
                onClick={() => setLocation("/buscar-propiedades?status=rent")}
                data-testid="button-filter-rent"
              >
                {language === 'en' ? 'Rent' : 'Renta'}
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-6 min-h-[44px]"
                onClick={() => setLocation("/buscar-propiedades?status=sale")}
                data-testid="button-filter-sale"
              >
                {language === 'en' ? 'Sale' : 'Venta'}
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-6 min-h-[44px]"
                onClick={() => setLocation("/buscar-propiedades?petFriendly=true")}
                data-testid="button-filter-pet-friendly"
              >
                Pet-friendly
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* 2. Propiedades Destacadas */}
        <div className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold">
              {language === 'en' ? 'Featured Properties' : 'Propiedades Destacadas'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1"
              onClick={() => setLocation("/buscar-propiedades")}
              data-testid="button-view-all-properties"
            >
              {language === 'en' ? 'View all' : 'Ver todas las propiedades'} <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {propertiesLoading ? (
              <>
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
              </>
            ) : featuredProperties.length > 0 ? (
              featuredProperties.map((property: any) => {
                const propertyUrl = getPropertyUrl(property);
                return (
                  <UnifiedPropertyCard
                    key={property.id}
                    id={property.id}
                    title={property.title || "Propiedad"}
                    unitNumber={property.unitNumber}
                    location={property.location}
                    zone={property.zone}
                    condominiumName={property.condominiumName || property.condoName}
                    rentPrice={property.rentPrice || property.price}
                    salePrice={property.salePrice}
                    currency={property.currency || "MXN"}
                    bedrooms={property.bedrooms}
                    bathrooms={property.bathrooms}
                    area={property.area}
                    status={getPropertyStatus(property)}
                    images={property.primaryImages || []}
                    petFriendly={property.petsAllowed}
                    furnished={property.hasFurniture}
                    hasParking={property.hasParking}
                    hasAC={property.hasAC}
                    includedServices={property.includedServices}
                    context="public"
                    onClick={() => setLocation(propertyUrl)}
                    onView={() => setLocation(propertyUrl)}
                    onContact={() => setLocation(propertyUrl + "?contact=true")}
                    onSchedule={() => setLocation(propertyUrl + "?schedule=true")}
                  />
                );
              })
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {language === 'en' ? 'No featured properties available' : 'No hay propiedades destacadas disponibles'}
              </div>
            )}
          </div>
        </div>

        {/* 3. Sección para tipos de usuario - 3 tarjetas */}
        <div className="mb-10 sm:mb-14">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card: Quiero rentar */}
            <div className="p-6 sm:p-8 rounded-2xl bg-muted/50 border hover-elevate">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {language === 'en' ? 'I want to rent' : 'Quiero rentar'}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {language === 'en' 
                  ? 'Find your ideal home in Tulum with personalized advice' 
                  : 'Encuentra tu hogar ideal en Tulum con asesoría personalizada'}
              </p>
              <Button 
                className="rounded-full w-full" 
                onClick={() => setLocation("/buscar-propiedades")}
                data-testid="button-user-renter"
              >
                {language === 'en' ? 'Search properties' : 'Buscar propiedades'}
              </Button>
            </div>

            {/* Card: Soy propietario */}
            <div className="p-6 sm:p-8 rounded-2xl bg-muted/50 border hover-elevate">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {language === 'en' ? "I'm an owner" : 'Soy propietario'}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {language === 'en' 
                  ? 'List your property and let us manage the rental process' 
                  : 'Enlista tu propiedad y déjanos gestionar el proceso de renta'}
              </p>
              <Button 
                className="rounded-full w-full" 
                onClick={() => setLocation("/enlistar-propiedad")}
                data-testid="button-user-owner"
              >
                {language === 'en' ? 'List my property' : 'Enlistar mi propiedad'}
              </Button>
            </div>

            {/* Card: Soy agente */}
            <div className="p-6 sm:p-8 rounded-2xl bg-muted/50 border hover-elevate">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {language === 'en' ? "I'm an agent" : 'Soy agente'}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {language === 'en' 
                  ? 'Join our team and access verified properties and leads' 
                  : 'Únete a nuestro equipo y accede a propiedades y leads verificados'}
              </p>
              <Button 
                variant="outline"
                className="rounded-full w-full" 
                onClick={() => setLocation("/aplicar")}
                data-testid="button-user-agent"
              >
                {language === 'en' ? 'Work with HomesApp' : 'Trabajar con HomesApp'}
              </Button>
            </div>
          </div>
        </div>

        {/* 4. Cómo funciona HomesApp */}
        <div className="py-12 sm:py-16 border-t border-b" id="como-funciona">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{content.howItWorks.title}</h2>
            <p className="text-muted-foreground">{content.howItWorks.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {content.howItWorks.steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-5 left-[calc(100%-2rem)] w-8 border-t border-dashed border-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Button className="rounded-full" onClick={() => setLocation("/buscar-propiedades")} data-testid="button-how-properties">
              {content.howItWorks.cta.properties}
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setLocation("/login")} data-testid="button-how-portal">
              {language === 'en' ? 'Enter portal' : 'Entrar al portal'}
            </Button>
          </div>
        </div>

        {/* 5. Explorar en el mapa - Banner */}
        <div className="py-10 sm:py-14">
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
                    {language === 'en' ? 'Explore on the map' : 'Explora en el mapa'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Find properties by location in Tulum' : 'Encuentra propiedades por ubicación en Tulum'}
                  </p>
                </div>
              </div>
              <Button
                variant="default"
                size="sm"
                className="rounded-full gap-1 hidden sm:flex"
                data-testid="button-view-map"
              >
                {language === 'en' ? 'View Map' : 'Ver Mapa'} <ChevronRight className="h-4 w-4" />
              </Button>
              <ChevronRight className="h-5 w-5 text-muted-foreground sm:hidden" />
            </div>
          </div>
        </div>

        {/* 6. Quiénes somos + Confían en nosotros */}
        <div className="py-12 sm:py-16 border-t" id="quienes-somos">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{content.aboutUs.title}</h2>
            <p className="text-lg text-primary font-medium mb-4">{content.aboutUs.subtitle}</p>
            <p className="text-muted-foreground max-w-3xl mx-auto text-sm sm:text-base">
              {content.aboutUs.description}
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            <div className="text-center p-6 rounded-2xl bg-muted/30 border">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{language === 'en' ? '+10 years in Tulum' : '+10 años en Tulum'}</h3>
              <p className="text-sm text-muted-foreground">{language === 'en' ? 'Proven local experience' : 'Experiencia local comprobada'}</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-muted/30 border">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Laptop className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{language === 'en' ? 'Digital processes' : 'Procesos digitales'}</h3>
              <p className="text-sm text-muted-foreground">{language === 'en' ? 'Everything from your device' : 'Todo desde tu dispositivo'}</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-muted/30 border">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Award className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{language === 'en' ? 'Certified team' : 'Equipo certificado'}</h3>
              <p className="text-sm text-muted-foreground">{language === 'en' ? 'Professional advisors' : 'Asesores profesionales'}</p>
            </div>
          </div>

          {/* Testimonios integrados (parte de la sección Quiénes somos) */}
          <div className="mt-4">
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">{content.testimonials.title}</h3>
              <p className="text-muted-foreground text-sm">{content.testimonials.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {content.testimonials.items.map((testimonial, i) => (
                <div key={i} className="p-6 rounded-2xl bg-muted/30 border">
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  <p className="text-sm mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4 sm:gap-8 text-sm text-muted-foreground">
              {content.testimonials.trust.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 7. Preguntas frecuentes */}
        <div className="py-12 sm:py-16 border-t" id="faq">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{content.faq.title}</h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2">
              {content.faq.items.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-4">
                  <AccordionTrigger className="text-left text-sm sm:text-base font-medium py-4 hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      {/* 8. Footer - Mapa del sitio con 4 columnas */}
      <footer className="border-t bg-muted/30 py-10 sm:py-14">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
            {/* Columna 1: Logo + Frase */}
            <div className="col-span-2 md:col-span-1">
              <img src={logoIcon} alt="HomesApp" className="h-10 w-auto mb-4" loading="lazy" />
              <p className="text-sm text-muted-foreground mb-4">
                {language === 'en' ? 'Your real estate partner in Tulum' : 'Tu socio inmobiliario en Tulum'}
              </p>
              <div className="flex gap-3">
                <a 
                  href="https://www.facebook.com/share/1B5kd6EAnQ/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a 
                  href="https://www.instagram.com/tulum.rental.homes" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              </div>
            </div>

            {/* Columna 2: Propiedades */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">
                {language === 'en' ? 'Properties' : 'Propiedades'}
              </h4>
              <div className="space-y-3 text-sm">
                <button 
                  onClick={() => setLocation("/buscar-propiedades")}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-search"
                >
                  {language === 'en' ? 'Search properties' : 'Buscar propiedades'}
                </button>
                <button 
                  onClick={() => setLocation("/mapa-interactivo")}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-map"
                >
                  {language === 'en' ? 'Interactive map' : 'Mapa interactivo'}
                </button>
                <button 
                  onClick={() => setLocation("/buscar-propiedades?status=rent")}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-rent"
                >
                  {language === 'en' ? 'For rent' : 'En renta'}
                </button>
                <button 
                  onClick={() => setLocation("/buscar-propiedades?status=sale")}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-sale"
                >
                  {language === 'en' ? 'For sale' : 'En venta'}
                </button>
              </div>
            </div>

            {/* Columna 3: Portales / Usuarios */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">
                {language === 'en' ? 'Portals' : 'Portales'}
              </h4>
              <div className="space-y-3 text-sm">
                <button 
                  onClick={() => setLocation("/portal/tenant")}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-tenant-portal"
                >
                  {language === 'en' ? 'Tenant portal' : 'Portal Inquilinos'}
                </button>
                <button 
                  onClick={() => setLocation("/portal/owner")}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-owner-portal"
                >
                  {language === 'en' ? 'Owner portal' : 'Portal Propietarios'}
                </button>
                <button 
                  onClick={() => setLocation("/enlistar-propiedad")}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-list-property"
                >
                  {language === 'en' ? 'List my property' : 'Enlistar mi propiedad'}
                </button>
                <button 
                  onClick={() => setLocation("/aplicar")}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-work-with-us"
                >
                  {language === 'en' ? 'Work with us' : 'Trabaja con nosotros'}
                </button>
              </div>
            </div>

            {/* Columna 4: Empresa / Información */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">
                {language === 'en' ? 'Company' : 'Empresa'}
              </h4>
              <div className="space-y-3 text-sm">
                <button 
                  onClick={() => scrollToSection('quienes-somos')}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-about"
                >
                  {language === 'en' ? 'About us' : 'Quiénes somos'}
                </button>
                <button 
                  onClick={() => scrollToSection('como-funciona')}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-how-it-works"
                >
                  {language === 'en' ? 'How it works' : 'Cómo funciona'}
                </button>
                <button 
                  onClick={() => scrollToSection('faq')}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-faq"
                >
                  {language === 'en' ? 'FAQ' : 'Preguntas frecuentes'}
                </button>
                <button 
                  onClick={() => setLocation("/login")}
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-login"
                >
                  {language === 'en' ? 'Log in' : 'Iniciar sesión'}
                </button>
              </div>
            </div>
          </div>

          {/* Barra inferior */}
          <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Tulum Rental Homes. {language === 'en' ? 'All rights reserved.' : 'Todos los derechos reservados.'}
            </p>
            <div className="flex items-center gap-6 text-xs">
              <button 
                onClick={() => setLocation("/terminos")}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="footer-link-terms"
              >
                {language === 'en' ? 'Terms' : 'Términos'}
              </button>
              <button 
                onClick={() => setLocation("/privacidad")}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="footer-link-privacy"
              >
                {language === 'en' ? 'Privacy' : 'Privacidad'}
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
