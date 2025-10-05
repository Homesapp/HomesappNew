import { useState } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Home, Sparkles, TrendingUp, PawPrint, SlidersHorizontal, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { type Property } from "@shared/schema";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";
import tulumProperty1 from "@assets/stock_images/tulum_mexico_luxury__2d50d3ea.jpg";
import tulumBeach from "@assets/stock_images/tulum_mexico_beach_t_21c511ca.jpg";
import serviceProvider from "@assets/stock_images/professional_service_ac32cdb7.jpg";
import affiliateImage from "@assets/stock_images/professional_service_dabc3389.jpg";

export default function PublicDashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [propertyType, setPropertyType] = useState("");
  const [colonyName, setColonyName] = useState("");
  const [condoName, setCondoName] = useState("");
  const { t } = useLanguage();

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties/search"],
  });

  const featuredProperties = properties.filter(p => p.featured);
  const allProperties = properties.slice(0, 12);

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.append("q", searchQuery);
    }
    if (propertyType && propertyType !== "all") {
      params.append("propertyType", propertyType);
    }
    if (colonyName.trim()) {
      params.append("colonyName", colonyName);
    }
    if (condoName.trim()) {
      params.append("condoName", condoName);
    }
    
    const queryString = params.toString();
    setLocation(queryString ? `/buscar-propiedades?${queryString}` : "/buscar-propiedades");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Public Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <div className="flex items-center">
            <img src={logoIcon} alt="HomesApp" className="h-16 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={() => setLocation("/login")}
              data-testid="button-login"
            >
              {t("public.login")}
            </Button>
            <Button
              variant="default"
              onClick={() => setLocation("/register")}
              data-testid="button-register"
            >
              {t("public.register")}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            {t("public.hero.title")}
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            {t("public.hero.subtitle")}
          </p>
          
          {/* Search Bar */}
          <div className="mx-auto max-w-4xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("public.searchPlaceholder")}
                  className="h-14 pl-11 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  data-testid="input-search"
                />
              </div>
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-4"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-toggle-filters"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                className="h-14 px-8"
                onClick={handleSearch}
                data-testid="button-search"
              >
                {t("public.searchButton")}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 p-6 bg-card border rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("public.filterPropertyType")}</label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger data-testid="select-property-type">
                        <SelectValue placeholder={t("public.filterAllTypes")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("public.filterAllTypes")}</SelectItem>
                        <SelectItem value="house">{t("public.propertyType.house")}</SelectItem>
                        <SelectItem value="apartment">{t("public.propertyType.apartment")}</SelectItem>
                        <SelectItem value="villa">{t("public.propertyType.villa")}</SelectItem>
                        <SelectItem value="condo">{t("public.propertyType.condo")}</SelectItem>
                        <SelectItem value="penthouse">{t("public.propertyType.penthouse")}</SelectItem>
                        <SelectItem value="studio">{t("public.propertyType.studio")}</SelectItem>
                        <SelectItem value="loft">{t("public.propertyType.loft")}</SelectItem>
                        <SelectItem value="townhouse">{t("public.propertyType.townhouse")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("public.filterColony")}</label>
                    <Input
                      placeholder={t("public.filterColonyPlaceholder")}
                      value={colonyName}
                      onChange={(e) => setColonyName(e.target.value)}
                      data-testid="input-colony"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("public.filterCondo")}</label>
                    <Input
                      placeholder={t("public.filterCondoPlaceholder")}
                      value={condoName}
                      onChange={(e) => setCondoName(e.target.value)}
                      data-testid="input-condo"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setPropertyType("");
                      setColonyName("");
                      setCondoName("");
                      setSearchQuery("");
                    }}
                    data-testid="button-clear-filters"
                  >
                    {t("public.clearFilters")}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Quick Filters */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                size="lg"
                className="px-6 hover-elevate active-elevate-2"
                onClick={() => setLocation("/buscar-propiedades?status=rent")}
                data-testid="badge-rent"
              >
                <Home className="mr-2 h-5 w-5" />
                {t("public.filter.rent")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-6 hover-elevate active-elevate-2"
                onClick={() => setLocation("/buscar-propiedades?status=sale")}
                data-testid="badge-sale"
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                {t("public.filter.sale")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-6 hover-elevate active-elevate-2"
                onClick={() => setLocation("/buscar-propiedades?featured=true")}
                data-testid="badge-featured"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {t("public.filter.featured")}
              </Button>
            </div>
          </div>
        </div>

        {/* Promotional Banners Carousel */}
        <div className="mb-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent>
              {/* Owner Banner Slide */}
              <CarouselItem>
                <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative h-64 md:h-80">
                      <img
                        src={tulumProperty1}
                        alt={t("public.ownerBanner.imgAlt")}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                    </div>
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                      <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("public.ownerBanner.title")}</h2>
                      <p className="text-base text-muted-foreground mb-6">
                        {t("public.ownerBanner.subtitle")}
                      </p>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-sm">{t("public.ownerBanner.benefit1")}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-sm">{t("public.ownerBanner.benefit2")}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-sm">{t("public.ownerBanner.benefit3")}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => setLocation("/register")}
                        size="lg"
                        className="w-fit"
                        data-testid="button-list-property"
                      >
                        {t("public.ownerBanner.button")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>

              {/* Service Provider Banner Slide */}
              <CarouselItem>
                <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                      <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("public.serviceBanner.title")}</h2>
                      <p className="text-base text-muted-foreground mb-6">
                        {t("public.serviceBanner.subtitle")}
                      </p>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-sm">{t("public.serviceBanner.benefit1")}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-sm">{t("public.serviceBanner.benefit2")}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-sm">{t("public.serviceBanner.benefit3")}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => setLocation("/solicitud-proveedor")}
                        size="lg"
                        className="w-fit"
                        data-testid="button-provider-apply"
                      >
                        {t("public.serviceBanner.button")}
                      </Button>
                    </div>
                    <div className="relative h-64 md:h-80">
                      <img
                        src={serviceProvider}
                        alt={t("public.serviceBanner.imgAlt")}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-l from-black/40 to-transparent" />
                    </div>
                  </div>
                </div>
              </CarouselItem>

              {/* Affiliate Banner Slide */}
              <CarouselItem>
                <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative h-64 md:h-80">
                      <img
                        src={affiliateImage}
                        alt={t("public.affiliateBanner.imgAlt")}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                    </div>
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                      <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("public.affiliateBanner.title")}</h2>
                      <p className="text-base text-muted-foreground mb-6">
                        {t("public.affiliateBanner.subtitle")}
                      </p>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-sm">{t("public.affiliateBanner.benefit1")}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-sm">{t("public.affiliateBanner.benefit2")}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-sm">{t("public.affiliateBanner.benefit3")}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-sm">{t("public.affiliateBanner.benefit4")}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => setLocation("/register")}
                        size="lg"
                        className="w-fit"
                        data-testid="button-affiliate-join"
                      >
                        {t("public.affiliateBanner.button")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
            <div className="mt-6 flex justify-center gap-4">
              <CarouselPrevious className="static translate-y-0" data-testid="button-banner-carousel-prev" />
              <CarouselNext className="static translate-y-0" data-testid="button-banner-carousel-next" />
            </div>
          </Carousel>
        </div>

        {/* Featured Properties */}
        {featuredProperties.length > 0 && (
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold">{t("public.featured.title")}</h2>
              <Button
                variant="outline"
                onClick={() => setLocation("/buscar-propiedades?featured=true")}
                data-testid="button-view-all-featured"
              >
                {t("public.featured.viewAll")}
              </Button>
            </div>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 3000,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {featuredProperties.map((property) => (
                  <CarouselItem key={property.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <div
                      className="group cursor-pointer overflow-hidden rounded-lg border bg-card hover-elevate active-elevate-2"
                      onClick={() => setLocation(`/propiedad/${property.id}/completo`)}
                      data-testid={`card-property-${property.id}`}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        {property.images && property.images[0] ? (
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            data-testid={`img-property-${property.id}`}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-muted">
                            <Home className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                        <Badge className="absolute right-3 top-3 bg-primary text-primary-foreground" data-testid={`badge-price-${property.id}`}>
                          ${property.price.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="p-4">
                        <h3 className="mb-2 text-lg font-semibold" data-testid={`text-title-${property.id}`}>
                          {property.title}
                        </h3>
                        <p className="mb-3 flex items-center text-sm text-muted-foreground" data-testid={`text-location-${property.id}`}>
                          <MapPin className="mr-1 h-4 w-4" />
                          {property.location}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span data-testid={`text-bedrooms-${property.id}`}>{property.bedrooms} {t("property.bedrooms")}</span>
                          <span data-testid={`text-bathrooms-${property.id}`}>{property.bathrooms} {t("property.bathrooms")}</span>
                          <span data-testid={`text-area-${property.id}`}>{property.area} {t("property.area")}</span>
                          {(property.amenities?.includes("Mascotas permitidas") || property.amenities?.includes("Pet Friendly")) && (
                            <span title="Pet-friendly">
                              <PawPrint className="h-4 w-4 text-foreground" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="mt-6 flex justify-center gap-4">
                <CarouselPrevious className="static translate-y-0" data-testid="button-carousel-prev" />
                <CarouselNext className="static translate-y-0" data-testid="button-carousel-next" />
              </div>
            </Carousel>
          </div>
        )}

        {/* Benefits Section */}
        <div className="mb-16 grid md:grid-cols-2 gap-8">
          {/* Client Benefits */}
          <div className="p-8 rounded-lg border bg-card">
            <div className="mb-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t("public.clientBenefits.title")}</h3>
              <p className="text-muted-foreground">{t("public.clientBenefits.subtitle")}</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">✓</span>
                </div>
                <span>{t("public.clientBenefits.benefit1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">✓</span>
                </div>
                <span>{t("public.clientBenefits.benefit2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">✓</span>
                </div>
                <span>{t("public.clientBenefits.benefit3")}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">✓</span>
                </div>
                <span>{t("public.clientBenefits.benefit4")}</span>
              </li>
            </ul>
          </div>

          {/* Owner Benefits */}
          <div className="p-8 rounded-lg border bg-card">
            <div className="mb-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t("public.ownerBenefits.title")}</h3>
              <p className="text-muted-foreground">{t("public.ownerBenefits.subtitle")}</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">✓</span>
                </div>
                <span>{t("public.ownerBenefits.benefit1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">✓</span>
                </div>
                <span>{t("public.ownerBenefits.benefit2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">✓</span>
                </div>
                <span>{t("public.ownerBenefits.benefit3")}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">✓</span>
                </div>
                <span>{t("public.ownerBenefits.benefit4")}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* All Properties */}
        <div>
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">{t("public.explore.title")}</h2>
            <Button
              variant="outline"
              onClick={() => setLocation("/buscar-propiedades")}
              data-testid="button-view-all-properties"
            >
              {t("public.featured.viewAll")}
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allProperties.map((property) => (
              <div
                key={property.id}
                className="group cursor-pointer overflow-hidden rounded-lg border bg-card hover-elevate active-elevate-2"
                onClick={() => setLocation(`/propiedad/${property.id}/completo`)}
                data-testid={`card-all-property-${property.id}`}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {property.images && property.images[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      data-testid={`img-all-property-${property.id}`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <Home className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className="absolute right-2 top-2" data-testid={`badge-all-price-${property.id}`}>
                    ${property.price.toLocaleString()}
                  </Badge>
                </div>
                <div className="p-3">
                  <h3 className="mb-1 truncate font-semibold" data-testid={`text-all-title-${property.id}`}>
                    {property.title}
                  </h3>
                  <p className="mb-2 flex items-center truncate text-sm text-muted-foreground" data-testid={`text-all-location-${property.id}`}>
                    <MapPin className="mr-1 h-3 w-3" />
                    {property.location}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span data-testid={`text-all-bedrooms-${property.id}`}>{property.bedrooms} {t("property.bedrooms")}</span>
                    <span data-testid={`text-all-bathrooms-${property.id}`}>{property.bathrooms} {t("property.bathrooms")}</span>
                    <span data-testid={`text-all-area-${property.id}`}>{property.area} {t("property.area")}</span>
                    {(property.amenities?.includes("Mascotas permitidas") || property.amenities?.includes("Pet Friendly")) && (
                      <span title="Pet-friendly">
                        <PawPrint className="h-3 w-3 text-foreground" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 rounded-lg bg-primary p-12 text-center text-primary-foreground">
          <h2 className="mb-4 text-3xl font-bold">{t("public.cta.title")}</h2>
          <p className="mb-8 text-lg opacity-90">
            {t("public.cta.subtitle")}
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setLocation("/register")}
            data-testid="button-cta-register"
          >
            {t("public.cta.button")}
          </Button>
        </div>
      </div>
    </div>
  );
}
