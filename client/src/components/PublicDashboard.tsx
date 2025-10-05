import { useState } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Home, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { type Property } from "@shared/schema";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoIcon from "@assets/Sin título (6 x 6 cm) (1024 x 1024 px) (2)_1759620872379.png";

export default function PublicDashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties/search"],
  });

  const featuredProperties = properties.filter(p => p.featured).slice(0, 6);
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
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="HomesApp" className="h-10 w-10" />
            <span className="text-xl font-bold">HomesApp</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={() => setLocation("/login")}
              data-testid="button-login"
            >
              Iniciar Sesión
            </Button>
            <Button
              variant="default"
              onClick={() => setLocation("/register")}
              data-testid="button-register"
            >
              Registrarse
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            Encuentra tu hogar ideal
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Miles de propiedades esperando por ti
          </p>
          
          {/* Search Bar */}
          <div className="mx-auto max-w-3xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Busca por ubicación, tipo de propiedad..."
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
                Buscar
              </Button>
            </div>
            
            {/* Quick Filters */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Badge
                variant="outline"
                className="cursor-pointer px-4 py-2 hover-elevate active-elevate-2"
                onClick={() => setLocation("/buscar-propiedades?availability=rent")}
                data-testid="badge-rent"
              >
                <Home className="mr-2 h-4 w-4" />
                En Renta
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer px-4 py-2 hover-elevate active-elevate-2"
                onClick={() => setLocation("/buscar-propiedades?availability=sale")}
                data-testid="badge-sale"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                En Venta
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer px-4 py-2 hover-elevate active-elevate-2"
                onClick={() => setLocation("/buscar-propiedades?featured=true")}
                data-testid="badge-featured"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Destacadas
              </Badge>
            </div>
          </div>
        </div>

        {/* Featured Properties */}
        {featuredProperties.length > 0 && (
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold">Propiedades Destacadas</h2>
              <Button
                variant="outline"
                onClick={() => setLocation("/buscar-propiedades?featured=true")}
                data-testid="button-view-all-featured"
              >
                Ver todas
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProperties.map((property) => (
                <div
                  key={property.id}
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Properties */}
        <div>
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Explora Propiedades</h2>
            <Button
              variant="outline"
              onClick={() => setLocation("/buscar-propiedades")}
              data-testid="button-view-all-properties"
            >
              Ver todas
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 rounded-lg bg-primary p-12 text-center text-primary-foreground">
          <h2 className="mb-4 text-3xl font-bold">¿Listo para encontrar tu hogar?</h2>
          <p className="mb-8 text-lg opacity-90">
            Regístrate hoy y accede a miles de propiedades exclusivas
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setLocation("/register")}
            data-testid="button-cta-register"
          >
            Comenzar Ahora
          </Button>
        </div>
      </div>
    </div>
  );
}
