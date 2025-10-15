import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Home, Sparkles, TrendingUp, Heart, Calendar, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { type Property } from "@shared/schema";
import { useAppointments, useUpdateAppointment } from "@/hooks/useAppointments";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { AppointmentCard } from "@/components/AppointmentCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getPropertyTitle } from "@/lib/propertyHelpers";
import { format } from "date-fns";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { isAdminAuthenticated } = useAdminAuth();

  const isUserAuthenticated = isAuthenticated || isAdminAuthenticated;

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties/search"],
  });

  const { data: appointments, isLoading: appointmentsLoading } = useAppointments(undefined, {
    enabled: isUserAuthenticated,
  });
  const updateAppointment = useUpdateAppointment();

  const featuredProperties = properties.filter(p => p.featured).slice(0, 6);
  const allProperties = properties.slice(0, 12);

  const upcomingAppointments = useMemo(() => {
    if (!appointments || !properties || !isUserAuthenticated) return [];

    const now = new Date();
    const upcoming = appointments
      .filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= now && (apt.status === "pending" || apt.status === "confirmed");
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);

    return upcoming.map(appointment => {
      const property = properties.find(p => p.id === appointment.propertyId);
      
      return {
        id: appointment.id,
        propertyTitle: property?.title || "Propiedad",
        clientName: "Cliente",
        date: format(new Date(appointment.date), "dd MMM yyyy"),
        time: format(new Date(appointment.date), "h:mm a"),
        type: appointment.type,
        status: appointment.status,
        meetLink: appointment.meetLink || undefined,
      };
    });
  }, [appointments, properties, isUserAuthenticated]);

  const handleConfirm = async (id: string) => {
    try {
      await updateAppointment.mutateAsync({
        id,
        data: { status: "confirmed" },
      });
      toast({
        title: "Cita confirmada",
        description: "La cita ha sido confirmada exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo confirmar la cita",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await updateAppointment.mutateAsync({
        id,
        data: { status: "cancelled" },
      });
      toast({
        title: "Cita cancelada",
        description: "La cita ha sido cancelada",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la cita",
        variant: "destructive",
      });
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/buscar-propiedades?query=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation("/buscar-propiedades");
    }
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
      {/* Public Header - Only shown when not authenticated */}
      {!isUserAuthenticated && (
        <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoIcon} alt="HomesApp" className="h-12 md:h-16 w-auto" data-testid="img-header-logo" />
              <h1 className="text-xl font-bold">HomesApp</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <Button variant="ghost" onClick={() => setLocation("/login")} data-testid="button-header-login">
                <UserCircle className="h-4 w-4 mr-2" />
                Iniciar Sesión
              </Button>
              <Button onClick={() => setLocation("/register")} data-testid="button-header-register">
                Registrarse
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Hero Section - More Compact */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Q0RCNEEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bS0yIDJ2LTJoLTJ2Mmgyem0wLTR2LTJoLTJ2Mmgyem0yLTJ2LTJoLTJ2Mmgyem0wLTRoMnYyaC0ydi0yem0tNiA0djJoMnYtMmgtMnptMi00djJoMnYtMmgtMnptMiAydjJoMnYtMmgtMnptMC00djJoMnYtMmgtMnptMi00djJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
        
        <div className="relative container mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-3" data-testid="text-hero-title">
              Encuentra tu hogar ideal
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-subtitle">
              Descubre propiedades únicas en las mejores ubicaciones
            </p>
          </div>

          {/* Search Bar */}
          <Card className="max-w-4xl mx-auto p-2 shadow-lg">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="¿Dónde quieres vivir?"
                  className="pl-11 h-12 border-0 focus-visible:ring-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  data-testid="input-hero-search"
                />
              </div>
              <Button 
                className="h-12 px-6"
                onClick={handleSearch}
                data-testid="button-hero-search"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </Card>

          {/* Quick Categories - Mobile optimized */}
          <div className="mt-6 grid grid-cols-3 gap-2 max-w-2xl mx-auto">
            <Button 
              variant="outline" 
              size="sm"
              className="rounded-full"
              onClick={() => setLocation("/buscar-propiedades?status=rent")}
              data-testid="button-category-rent"
            >
              <Home className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">En Renta</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="rounded-full"
              onClick={() => setLocation("/buscar-propiedades?status=sale")}
              data-testid="button-category-sale"
            >
              <TrendingUp className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">En Venta</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="rounded-full"
              onClick={() => setLocation("/buscar-propiedades?featured=true")}
              data-testid="button-category-featured"
            >
              <Sparkles className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Destacadas</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Upcoming Appointments Section - Only for authenticated users */}
        {isUserAuthenticated && upcomingAppointments.length > 0 && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>Próximas Citas</CardTitle>
                      <p className="text-sm text-muted-foreground">Citas pendientes de confirmar o confirmadas</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost"
                    onClick={() => setLocation("/calendario")}
                    data-testid="button-view-all-appointments"
                  >
                    Ver todas
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      {...appointment}
                      onConfirm={() => handleConfirm(appointment.id)}
                      onCancel={() => handleCancel(appointment.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Featured Properties Section */}
        {featuredProperties.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1" data-testid="text-featured-title">Propiedades Destacadas</h2>
                <p className="text-sm text-muted-foreground">Las mejores opciones seleccionadas para ti</p>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/buscar-propiedades?featured=true")}
                data-testid="button-view-all-featured"
              >
                Ver todas
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredProperties.map((property) => (
                <Card
                  key={property.id}
                  className="group overflow-hidden hover-elevate cursor-pointer transition-all"
                  onClick={() => setLocation(`/propiedad/${property.id}/completo`)}
                  data-testid={`card-featured-${property.id}`}
                >
                  <div className="relative h-56 overflow-hidden">
                    {property.primaryImages && property.primaryImages.length > 0 ? (
                      <img
                        src={property.primaryImages[0]}
                        alt={getPropertyTitle(property)}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        data-testid={`img-featured-property-${property.id}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Home className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs">
                      Destacada
                    </Badge>
                    {isUserAuthenticated && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-3 left-3 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        data-testid={`button-featured-favorite-${property.id}`}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2 min-h-[2.75rem]" data-testid={`text-title-featured-${property.id}`}>
                      {getPropertyTitle(property)}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-1" data-testid={`text-location-featured-${property.id}`}>
                        {property.location}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mb-3">
                      <span data-testid={`text-bedrooms-featured-${property.id}`}>{property.bedrooms} rec</span>
                      <span>•</span>
                      <span data-testid={`text-bathrooms-featured-${property.id}`}>{property.bathrooms} ba</span>
                      <span>•</span>
                      <span data-testid={`text-area-featured-${property.id}`}>{property.area} m²</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-lg font-bold text-primary" data-testid={`text-price-featured-${property.id}`}>
                        {formatPrice(property.price)}
                      </span>
                      <Badge variant="outline" className="capitalize text-xs" data-testid={`badge-status-featured-${property.id}`}>
                        {property.status === "rent" ? "Renta" : "Venta"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Properties Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1" data-testid="text-all-properties-title">Explora Propiedades</h2>
              <p className="text-sm text-muted-foreground">Descubre todas nuestras opciones disponibles</p>
            </div>
            <Button 
              variant="ghost"
              onClick={() => setLocation("/buscar-propiedades")}
              data-testid="button-view-all-properties"
            >
              Ver todas
            </Button>
          </div>
          
          {allProperties.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay propiedades disponibles</h3>
                <p className="text-muted-foreground mb-6">
                  Actualmente no tenemos propiedades para mostrar. Por favor, vuelve más tarde.
                </p>
                {!isUserAuthenticated && (
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setLocation("/register")} data-testid="button-empty-register">
                      Registrarse para más información
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allProperties.map((property) => (
                <Card
                  key={property.id}
                  className="group overflow-hidden hover-elevate cursor-pointer transition-all"
                  onClick={() => setLocation(`/propiedad/${property.id}/completo`)}
                  data-testid={`card-all-${property.id}`}
                >
                  <div className="relative h-48 overflow-hidden">
                    {property.primaryImages && property.primaryImages.length > 0 ? (
                      <img
                        src={property.primaryImages[0]}
                        alt={getPropertyTitle(property)}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        data-testid={`img-all-property-${property.id}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Home className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    {property.featured && (
                      <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5">
                        Destacada
                      </Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold line-clamp-2 mb-2 min-h-[2.5rem] text-sm" data-testid={`text-title-all-${property.id}`}>
                      {getPropertyTitle(property)}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-1" data-testid={`text-location-all-${property.id}`}>
                        {property.location}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mb-2">
                      <span data-testid={`text-bedrooms-all-${property.id}`}>{property.bedrooms} rec</span>
                      <span>•</span>
                      <span data-testid={`text-bathrooms-all-${property.id}`}>{property.bathrooms} ba</span>
                      <span>•</span>
                      <span data-testid={`text-area-all-${property.id}`}>{property.area} m²</span>
                    </div>
                    <div className="font-bold text-primary text-sm" data-testid={`text-price-all-${property.id}`}>
                      {formatPrice(property.price)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-8">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-3">¿No encuentras lo que buscas?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                {isUserAuthenticated 
                  ? "Nuestro equipo de expertos está listo para ayudarte a encontrar la propiedad perfecta"
                  : "Regístrate para acceder a todas nuestras propiedades y recibir asesoría personalizada"
                }
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={() => setLocation("/buscar-propiedades")} data-testid="button-cta-search">
                  <Search className="h-4 w-4 mr-2" />
                  Búsqueda Avanzada
                </Button>
                {!isUserAuthenticated ? (
                  <Button onClick={() => setLocation("/register")} data-testid="button-cta-register">
                    Registrarse Gratis
                  </Button>
                ) : (
                  <Button variant="outline" data-testid="button-cta-contact">
                    Contactar Asesor
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
