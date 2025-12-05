import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { 
  Search, MapPin, Home, Sparkles, TrendingUp, Calendar, UserCircle,
  CalendarDays, Laptop, Award, ArrowRight, CheckCircle2, Building2, Users,
  FileText, Headphones, BarChart3, Share2, Quote, ChevronDown, ChevronUp,
  Shield, Handshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { type Property } from "@shared/schema";
import { useAppointments, useUpdateAppointment } from "@/hooks/useAppointments";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { AppointmentCard } from "@/components/AppointmentCard";
import { UnifiedPropertyCard } from "@/components/UnifiedPropertyCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPropertyTitle } from "@/lib/propertyHelpers";
import { homepageContent } from "@/lib/homepageContent";
import { format } from "date-fns";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { isAdminAuthenticated } = useAdminAuth();
  const { language } = useLanguage();
  
  const content = language === "en" ? homepageContent.en : homepageContent.es;

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
                {content.nav.login}
              </Button>
              <Button onClick={() => setLocation("/register")} data-testid="button-header-register">
                {content.nav.register}
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
              {content.hero.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-subtitle">
              {content.hero.subtitle}
            </p>
          </div>

          {/* Search Bar */}
          <Card className="max-w-4xl mx-auto p-2 shadow-lg">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder={content.hero.searchPlaceholder}
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
                {content.hero.search}
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
              <span className="text-xs sm:text-sm">{content.hero.forRent}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="rounded-full"
              onClick={() => setLocation("/buscar-propiedades?status=sale")}
              data-testid="button-category-sale"
            >
              <TrendingUp className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">{content.hero.forSale}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="rounded-full"
              onClick={() => setLocation("/buscar-propiedades?featured=true")}
              data-testid="button-category-featured"
            >
              <Sparkles className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">{content.hero.featured}</span>
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
                      <CardTitle>{content.sections.appointments}</CardTitle>
                      <p className="text-sm text-muted-foreground">{content.sections.appointmentsDesc}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost"
                    onClick={() => setLocation("/calendario")}
                    data-testid="button-view-all-appointments"
                  >
                    {content.sections.viewAll}
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
                <h2 className="text-2xl font-bold mb-1" data-testid="text-featured-title">{content.sections.featuredProperties}</h2>
                <p className="text-sm text-muted-foreground">{content.sections.featuredDesc}</p>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/buscar-propiedades?featured=true")}
                data-testid="button-view-all-featured"
              >
                {content.sections.viewAll}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredProperties.map((property) => (
                <UnifiedPropertyCard
                  key={property.id}
                  id={property.id.toString()}
                  title={getPropertyTitle(property)}
                  location={property.location || "Tulum"}
                  zone={property.zone}
                  condominiumName={property.condominiumName}
                  rentPrice={property.status === "rent" ? property.price : null}
                  salePrice={property.status === "sale" ? property.price : null}
                  currency={property.currency || "MXN"}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  area={property.area}
                  status="available"
                  images={property.primaryImages}
                  propertyType={property.propertyType}
                  petFriendly={property.petFriendly}
                  furnished={property.furnished}
                  hasParking={property.hasParking}
                  hasAC={property.hasAC}
                  includedServices={{
                    water: property.includesWater,
                    electricity: property.includesElectricity,
                    internet: property.includesInternet,
                    hoa: property.includesHoa,
                  }}
                  context="public"
                  onClick={() => setLocation(`/propiedad/${property.id}/completo`)}
                  onContact={() => setLocation(`/propiedad/${property.id}/completo`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Properties Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1" data-testid="text-all-properties-title">{content.sections.exploreProperties}</h2>
              <p className="text-sm text-muted-foreground">{content.sections.exploreDesc}</p>
            </div>
            <Button 
              variant="ghost"
              onClick={() => setLocation("/buscar-propiedades")}
              data-testid="button-view-all-properties"
            >
              {content.sections.viewAll}
            </Button>
          </div>
          
          {allProperties.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{content.sections.noProperties}</h3>
                <p className="text-muted-foreground mb-6">
                  {content.sections.noPropertiesDesc}
                </p>
                {!isUserAuthenticated && (
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setLocation("/register")} data-testid="button-empty-register">
                      {content.sections.registerForMore}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allProperties.map((property) => (
                <UnifiedPropertyCard
                  key={property.id}
                  id={property.id.toString()}
                  title={getPropertyTitle(property)}
                  location={property.location || "Tulum"}
                  zone={property.zone}
                  condominiumName={property.condominiumName}
                  rentPrice={property.status === "rent" ? property.price : null}
                  salePrice={property.status === "sale" ? property.price : null}
                  currency={property.currency || "MXN"}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  area={property.area}
                  status="available"
                  images={property.primaryImages}
                  propertyType={property.propertyType}
                  petFriendly={property.petFriendly}
                  furnished={property.furnished}
                  hasParking={property.hasParking}
                  hasAC={property.hasAC}
                  includedServices={{
                    water: property.includesWater,
                    electricity: property.includesElectricity,
                    internet: property.includesInternet,
                    hoa: property.includesHoa,
                  }}
                  context="public"
                  onClick={() => setLocation(`/propiedad/${property.id}/completo`)}
                  onContact={() => setLocation(`/propiedad/${property.id}/completo`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-8">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-3">{content.sections.notFound}</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                {isUserAuthenticated 
                  ? content.sections.notFoundDescAuth
                  : content.sections.notFoundDesc
                }
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={() => setLocation("/buscar-propiedades")} data-testid="button-cta-search">
                  <Search className="h-4 w-4 mr-2" />
                  {content.sections.advancedSearch}
                </Button>
                {!isUserAuthenticated ? (
                  <Button onClick={() => setLocation("/register")} data-testid="button-cta-register">
                    {content.sections.registerFree}
                  </Button>
                ) : (
                  <Button variant="outline" data-testid="button-cta-contact">
                    {content.sections.contactAdvisor}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ======== NEW SECTIONS ======== */}
      
      {/* Section 1: Quiénes Somos (Who We Are) */}
      <section className="py-16 bg-muted/30" data-testid="section-about-us">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-about-title">
              {content.aboutUs.title}
            </h2>
            <p className="text-lg text-primary font-medium mb-4" data-testid="text-about-subtitle">
              {content.aboutUs.subtitle}
            </p>
            <p className="text-muted-foreground max-w-3xl mx-auto" data-testid="text-about-description">
              {content.aboutUs.description}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center p-6 hover-elevate" data-testid="card-about-feature-1">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">{content.aboutUs.features[0].title}</h3>
              <p className="text-sm text-muted-foreground">{content.aboutUs.features[0].description}</p>
            </Card>
            <Card className="text-center p-6 hover-elevate" data-testid="card-about-feature-2">
              <Laptop className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">{content.aboutUs.features[1].title}</h3>
              <p className="text-sm text-muted-foreground">{content.aboutUs.features[1].description}</p>
            </Card>
            <Card className="text-center p-6 hover-elevate" data-testid="card-about-feature-3">
              <Award className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">{content.aboutUs.features[2].title}</h3>
              <p className="text-sm text-muted-foreground">{content.aboutUs.features[2].description}</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 2: Cómo Funciona (How It Works) */}
      <section className="py-16 bg-background" data-testid="section-how-it-works">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-how-title">
              {content.howItWorks.title}
            </h2>
            <p className="text-muted-foreground text-lg" data-testid="text-how-subtitle">
              {content.howItWorks.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-10">
            {content.howItWorks.steps.map((step, index) => (
              <div key={index} className="relative" data-testid={`step-${index + 1}`}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-xl mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+3rem)] w-[calc(100%-6rem)]">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/30 mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => setLocation("/buscar-propiedades")} data-testid="button-how-properties">
              {content.howItWorks.cta.properties}
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation("/login")} data-testid="button-how-portal">
              {content.howItWorks.cta.portal}
            </Button>
          </div>
        </div>
      </section>

      {/* Section 3: Para Inquilinos (For Tenants) */}
      <section className="py-16 bg-muted/30" data-testid="section-for-tenants">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 lg:order-1">
              <Badge className="mb-4" variant="secondary">
                <Home className="h-3 w-3 mr-1" />
                {language === "en" ? "Tenants" : "Inquilinos"}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-tenants-title">
                {content.forTenants.title}
              </h2>
              <p className="text-xl text-muted-foreground mb-6" data-testid="text-tenants-subtitle">
                {content.forTenants.subtitle}
              </p>
              <ul className="space-y-4 mb-8">
                {content.forTenants.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3" data-testid={`tenants-feature-${index}`}>
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" onClick={() => setLocation("/leads/client")} data-testid="button-tenants-cta">
                {content.forTenants.cta}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="order-1 lg:order-2">
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center p-8">
                    <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">
                      {language === "en" ? "Interactive Map & Advanced Search" : "Mapa Interactivo y Búsqueda Avanzada"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Para Propietarios (For Owners) - Zigzag Layout */}
      <section className="py-16 bg-background" data-testid="section-for-owners">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="order-1">
              <Card className="p-6 bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center p-8">
                    <Building2 className="h-16 w-16 text-amber-600 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">
                      {language === "en" ? "Owner Portal & Property Management" : "Portal del Propietario y Gestión de Propiedades"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="order-2">
              <Badge className="mb-4 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                <Building2 className="h-3 w-3 mr-1" />
                {language === "en" ? "Owners" : "Propietarios"}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-owners-title">
                {content.forOwners.title}
              </h2>
              <p className="text-xl text-muted-foreground mb-6" data-testid="text-owners-subtitle">
                {content.forOwners.subtitle}
              </p>
              <ul className="space-y-4 mb-8">
                {content.forOwners.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3" data-testid={`owners-feature-${index}`}>
                    <CheckCircle2 className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3 flex-wrap">
                <Button size="lg" onClick={() => setLocation("/register")} data-testid="button-owners-list">
                  {content.forOwners.ctaPrimary}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => setLocation("/leads/client")} data-testid="button-owners-valuation">
                  {content.forOwners.ctaSecondary}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Para Agentes (For Agents) */}
      <section className="py-16 bg-muted/30" data-testid="section-for-agents">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 lg:order-1">
              <Badge className="mb-4 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                <Users className="h-3 w-3 mr-1" />
                {language === "en" ? "Agents & Brokers" : "Agentes y Brokers"}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-agents-title">
                {content.forAgents.title}
              </h2>
              <p className="text-xl text-muted-foreground mb-6" data-testid="text-agents-subtitle">
                {content.forAgents.subtitle}
              </p>
              <ul className="space-y-4 mb-8">
                {content.forAgents.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3" data-testid={`agents-feature-${index}`}>
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" onClick={() => setLocation("/brokers/register")} data-testid="button-agents-cta">
                {content.forAgents.cta}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="order-1 lg:order-2">
              <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center p-8">
                    <BarChart3 className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">
                      {language === "en" ? "Agency Dashboard & Team Metrics" : "Panel de Agencia y Métricas de Equipo"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Testimonials & Trust */}
      <section className="py-16 bg-background" data-testid="section-testimonials">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <img src={logoIcon} alt="HomesApp" className="h-12 w-auto" />
              <Separator orientation="vertical" className="h-8" />
              <div className="flex items-center gap-2">
                <Building2 className="h-8 w-8 text-primary" />
                <span className="font-bold text-lg">Tulum Rental Homes</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-testimonials-title">
              {content.testimonials.title}
            </h2>
            <p className="text-muted-foreground text-lg" data-testid="text-testimonials-subtitle">
              {content.testimonials.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {content.testimonials.items.map((testimonial, index) => (
              <Card key={index} className="p-6 hover-elevate" data-testid={`testimonial-${index}`}>
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                <p className="text-foreground mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {content.testimonials.trust.map((item, index) => (
              <div key={index} className="flex items-center gap-2" data-testid={`trust-${index}`}>
                <Shield className="h-4 w-4 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: FAQ */}
      <section className="py-16 bg-muted/30" data-testid="section-faq">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-faq-title">
              {content.faq.title}
            </h2>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-3">
            {content.faq.items.map((faq, index) => (
              <Collapsible 
                key={index} 
                open={openFaqIndex === index}
                onOpenChange={(open) => setOpenFaqIndex(open ? index : null)}
              >
                <Card className="overflow-hidden" data-testid={`faq-card-${index}`}>
                  <CollapsibleTrigger asChild>
                    <button 
                      className="w-full p-4 flex items-center justify-between text-left hover-elevate"
                      data-testid={`faq-trigger-${index}`}
                    >
                      <span className="font-medium pr-4">{faq.question}</span>
                      {openFaqIndex === index ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-0 text-muted-foreground" data-testid={`faq-answer-${index}`}>
                      {faq.answer}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Footer */}
      <section className="py-16 bg-primary text-primary-foreground" data-testid="section-final-cta">
        <div className="container mx-auto px-4 text-center">
          <Handshake className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {language === "en" ? "Ready to get started?" : "¿Listo para comenzar?"}
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            {language === "en" 
              ? "Join thousands of tenants, owners, and agents who already trust HomesApp to find and manage properties in Tulum."
              : "Únete a miles de inquilinos, propietarios y agentes que ya confían en HomesApp para encontrar y gestionar propiedades en Tulum."
            }
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" variant="secondary" onClick={() => setLocation("/buscar-propiedades")} data-testid="button-final-search">
              <Search className="h-4 w-4 mr-2" />
              {language === "en" ? "Search Properties" : "Buscar Propiedades"}
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setLocation("/register")} data-testid="button-final-register">
              {language === "en" ? "Create Free Account" : "Crear Cuenta Gratis"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
