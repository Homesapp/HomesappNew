import { useState } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Home, Sparkles, TrendingUp, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export default function PublicDashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties/search"],
  });

  const featuredProperties = properties.filter(p => p.featured);
  const allProperties = properties.slice(0, 12);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/buscar-propiedades?query=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation("/buscar-propiedades");
    }
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
          <div className="mx-auto max-w-3xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("public.search.placeholder")}
                  className="h-14 pl-11 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  data-testid="input-search"
                />
              </div>
              <Button
                size="lg"
                className="h-14 px-8"
                onClick={handleSearch}
                data-testid="button-search"
              >
                {t("public.search.button")}
              </Button>
            </div>
            
            {/* Quick Filters */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                size="lg"
                className="px-6 hover-elevate active-elevate-2"
                onClick={() => setLocation("/buscar-propiedades?availability=rent")}
                data-testid="badge-rent"
              >
                <Home className="mr-2 h-5 w-5" />
                {t("public.filter.rent")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-6 hover-elevate active-elevate-2"
                onClick={() => setLocation("/buscar-propiedades?availability=sale")}
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
                      onClick={() => setLocation(`/propiedad/${property.id}`)}
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
                          <span data-testid={`text-bedrooms-${property.id}`}>{property.bedrooms} hab</span>
                          <span data-testid={`text-bathrooms-${property.id}`}>{property.bathrooms} baños</span>
                          <span data-testid={`text-area-${property.id}`}>{property.area} m²</span>
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
                onClick={() => setLocation(`/propiedad/${property.id}`)}
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
                    <span data-testid={`text-all-bedrooms-${property.id}`}>{property.bedrooms} hab</span>
                    <span data-testid={`text-all-bathrooms-${property.id}`}>{property.bathrooms} baños</span>
                    <span data-testid={`text-all-area-${property.id}`}>{property.area} m²</span>
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
