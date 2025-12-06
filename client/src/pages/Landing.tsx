import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Search, 
  Home, 
  Users, 
  Shield, 
  ChevronRight,
  ChevronLeft,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Star,
  FileText,
  Clock,
  Phone,
  Mail,
  ArrowRight,
  Plus,
  Minus
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface LandingProperty {
  id: string;
  name: string;
  condoName: string | null;
  zone: string | null;
  zoneSlug: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  rentPrice: number | null;
  salePrice: number | null;
  currency: string;
  listingType: string;
  image: string | null;
  isFeatured: boolean;
  slug: string | null;
  shortId: string | null;
}

interface ZoneProperties {
  zone: string;
  zoneSlug: string;
  properties: LandingProperty[];
}

function PropertyRailCard({ property }: { property: LandingProperty }) {
  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return null;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency || 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const displayName = property.condoName 
    ? `${property.condoName} - ${property.name}`
    : property.name;

  const propertyUrl = `/propiedades/${property.zoneSlug || 'tulum'}/${property.slug || property.shortId || property.id}`;

  const isRent = property.listingType === 'rent' || property.listingType === 'both';
  const isSale = property.listingType === 'sale' || property.listingType === 'both';

  return (
    <Link href={propertyUrl}>
      <Card 
        className="group cursor-pointer overflow-hidden hover-elevate min-w-[280px] max-w-[320px] flex-shrink-0 snap-start"
        data-testid={`card-property-${property.id}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {property.image ? (
            <img
              src={property.image}
              alt={displayName}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Home className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          <div className="absolute top-3 left-3 flex gap-2">
            {isRent && (
              <Badge variant="default" className="bg-primary text-primary-foreground">
                En renta
              </Badge>
            )}
            {isSale && (
              <Badge variant="secondary">
                En venta
              </Badge>
            )}
          </div>
          
          {property.isFeatured && (
            <Badge 
              variant="outline" 
              className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm border-amber-500 text-amber-600"
            >
              <Star className="h-3 w-3 mr-1 fill-amber-500" />
              Destacada
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
            {displayName}
          </h3>
          
          {property.zone && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{property.zone}</span>
            </div>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {property.bedrooms !== null && (
              <span className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                {property.bedrooms}
              </span>
            )}
            {property.bathrooms !== null && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" />
                {property.bathrooms}
              </span>
            )}
            {property.area !== null && (
              <span className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5" />
                {property.area} m²
              </span>
            )}
          </div>
          
          <div className="pt-2 border-t">
            {property.rentPrice && (
              <p className="font-semibold text-lg text-primary">
                {formatPrice(property.rentPrice, property.currency)}
                <span className="text-sm font-normal text-muted-foreground">/mes</span>
              </p>
            )}
            {property.salePrice && !property.rentPrice && (
              <p className="font-semibold text-lg text-primary">
                {formatPrice(property.salePrice, property.currency)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PropertyRailCardSkeleton() {
  return (
    <Card className="min-w-[280px] max-w-[320px] flex-shrink-0 overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-1/3" />
      </CardContent>
    </Card>
  );
}

function PropertyRail({ 
  title, 
  properties, 
  isLoading,
  viewAllLink,
}: { 
  title: string; 
  properties: LandingProperty[];
  isLoading: boolean;
  viewAllLink?: string;
}) {
  const scrollRef = useState<HTMLDivElement | null>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef[0]) {
      const scrollAmount = 320;
      scrollRef[0].scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            className="hidden md:flex"
            data-testid="button-scroll-left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            className="hidden md:flex"
            data-testid="button-scroll-right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {viewAllLink && (
            <Button variant="ghost" asChild className="gap-1" data-testid="button-view-all">
              <Link href={viewAllLink}>
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      <div 
        ref={(el) => { scrollRef[0] = el; }}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <PropertyRailCardSkeleton key={i} />
          ))
        ) : properties.length > 0 ? (
          properties.map((property) => (
            <PropertyRailCard key={property.id} property={property} />
          ))
        ) : (
          <div className="flex-1 text-center py-12 text-muted-foreground">
            No hay propiedades disponibles en esta zona
          </div>
        )}
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left hover-elevate rounded-md px-2"
        data-testid="button-faq-toggle"
      >
        <span className="font-medium">{question}</span>
        {isOpen ? (
          <Minus className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <Plus className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 px-2 text-muted-foreground text-sm">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: featuredProperties, isLoading: loadingFeatured } = useQuery<LandingProperty[]>({
    queryKey: ['/api/public/landing/featured'],
  });

  const { data: zoneProperties, isLoading: loadingZones } = useQuery<ZoneProperties[]>({
    queryKey: ['/api/public/landing/by-zone'],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/propiedades?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const faqItems = [
    {
      question: "¿Cuánto tiempo tarda el proceso de renta?",
      answer: "El proceso típico toma entre 3-5 días hábiles, desde la visita inicial hasta la firma del contrato. Esto incluye la validación de documentos y el acuerdo de condiciones."
    },
    {
      question: "¿Qué documentos necesito para rentar?",
      answer: "Necesitas identificación oficial (INE o pasaporte), comprobante de ingresos de los últimos 3 meses, y referencias personales o laborales. Para extranjeros, se requiere visa de residencia o permiso de trabajo."
    },
    {
      question: "¿Incluyen los servicios en la renta?",
      answer: "Depende de cada propiedad. Algunas incluyen mantenimiento de HOA, internet y servicios básicos. Cada listado especifica claramente qué servicios están incluidos."
    },
    {
      question: "¿Puedo rentar si soy extranjero?",
      answer: "Sí, trabajamos frecuentemente con inquilinos internacionales. Tenemos procesos especiales para nómadas digitales y residentes temporales."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold hidden sm:inline">Tulum Rental Homes</span>
              <span className="text-xl font-bold sm:hidden">TRH</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden md:inline-flex" data-testid="link-properties">
              <Link href="/propiedades">Propiedades</Link>
            </Button>
            <Button variant="ghost" asChild className="hidden md:inline-flex" data-testid="link-about">
              <Link href="/quienes-somos">Nosotros</Link>
            </Button>
            <Button variant="outline" asChild data-testid="button-login">
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button asChild data-testid="button-contact">
              <Link href="/contacto">Contactar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Encuentra tu hogar ideal en{" "}
                <span className="text-primary">Tulum</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Descubre las mejores propiedades en renta en las zonas más exclusivas de Tulum. 
                Departamentos, casas y villas con atención personalizada.
              </p>
              
              <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mt-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por zona, condominio o características..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                    data-testid="input-search"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12" data-testid="button-search">
                  Buscar
                </Button>
              </form>
              
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                <Badge variant="outline" className="cursor-pointer hover-elevate" asChild>
                  <Link href="/propiedades?zone=aldea-zama">Aldea Zama</Link>
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover-elevate" asChild>
                  <Link href="/propiedades?zone=la-veleta">La Veleta</Link>
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover-elevate" asChild>
                  <Link href="/propiedades?zone=region-15">Región 15</Link>
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover-elevate" asChild>
                  <Link href="/propiedades?zone=centro">Centro</Link>
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Properties */}
        <div className="container mx-auto px-4">
          <PropertyRail
            title="Propiedades Destacadas"
            properties={featuredProperties || []}
            isLoading={loadingFeatured}
            viewAllLink="/propiedades?featured=true"
          />
        </div>

        {/* Zone-based Properties */}
        <div className="container mx-auto px-4">
          {loadingZones ? (
            Array.from({ length: 4 }).map((_, i) => (
              <PropertyRail
                key={i}
                title="Cargando..."
                properties={[]}
                isLoading={true}
              />
            ))
          ) : (
            zoneProperties?.map((zone) => (
              <PropertyRail
                key={zone.zoneSlug}
                title={`Propiedades en ${zone.zone}`}
                properties={zone.properties}
                isLoading={false}
                viewAllLink={`/propiedades?zone=${zone.zoneSlug}`}
              />
            ))
          )}
        </div>

        {/* How it Works - Compact */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">¿Cómo funciona?</h2>
              <p className="text-muted-foreground">Rentar con nosotros es fácil y seguro</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">1. Explora</h3>
                <p className="text-sm text-muted-foreground">
                  Busca entre nuestras propiedades verificadas y agenda una visita
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">2. Aplica</h3>
                <p className="text-sm text-muted-foreground">
                  Envía tu solicitud y documentos. Te respondemos en 24-48 hrs
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Home className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">3. Múdate</h3>
                <p className="text-sm text-muted-foreground">
                  Firma digital, pago seguro y recibe las llaves de tu nuevo hogar
                </p>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Button variant="outline" asChild data-testid="button-how-it-works">
                <Link href="/como-funciona">
                  Conocer más <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* About Us - Compact */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold">¿Por qué elegirnos?</h2>
                <p className="text-muted-foreground">
                  Somos especialistas en el mercado inmobiliario de Tulum con más de 5 años 
                  de experiencia conectando a inquilinos con propiedades excepcionales.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">Propiedades verificadas y contratos seguros</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">Atención bilingüe personalizada 24/7</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">Respuesta rápida y proceso eficiente</span>
                  </li>
                </ul>
                <Button asChild data-testid="button-about-us">
                  <Link href="/quienes-somos">
                    Conoce al equipo <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 text-center">
                  <p className="text-4xl font-bold text-primary">500+</p>
                  <p className="text-sm text-muted-foreground">Propiedades gestionadas</p>
                </Card>
                <Card className="p-6 text-center">
                  <p className="text-4xl font-bold text-primary">1000+</p>
                  <p className="text-sm text-muted-foreground">Clientes satisfechos</p>
                </Card>
                <Card className="p-6 text-center">
                  <p className="text-4xl font-bold text-primary">5+</p>
                  <p className="text-sm text-muted-foreground">Años de experiencia</p>
                </Card>
                <Card className="p-6 text-center">
                  <p className="text-4xl font-bold text-primary">24/7</p>
                  <p className="text-sm text-muted-foreground">Soporte disponible</p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ - Compact */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Preguntas frecuentes</h2>
                <p className="text-muted-foreground">Respuestas a las dudas más comunes</p>
              </div>
              
              <Card>
                <CardContent className="p-6">
                  {faqItems.map((faq, index) => (
                    <FAQItem key={index} question={faq.question} answer={faq.answer} />
                  ))}
                </CardContent>
              </Card>
              
              <div className="text-center mt-6">
                <Button variant="outline" asChild data-testid="button-faq">
                  <Link href="/preguntas-frecuentes">
                    Ver todas las preguntas <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">¿Listo para encontrar tu nuevo hogar?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Contáctanos hoy y te ayudaremos a encontrar la propiedad perfecta para ti
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild data-testid="button-browse-properties">
                <Link href="/propiedades">Ver propiedades</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild data-testid="button-contact-cta">
                <Link href="/contacto">Contactar ahora</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-bold">Tulum Rental Homes</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Tu socio de confianza para encontrar el hogar perfecto en Tulum.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="icon" asChild>
                  <a href="tel:+529841234567" data-testid="link-phone">
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href="mailto:info@tulumrentalhomes.com" data-testid="link-email">
                    <Mail className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Propiedades</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/propiedades?zone=aldea-zama" className="hover:text-foreground">Aldea Zama</Link></li>
                <li><Link href="/propiedades?zone=la-veleta" className="hover:text-foreground">La Veleta</Link></li>
                <li><Link href="/propiedades?zone=region-15" className="hover:text-foreground">Región 15</Link></li>
                <li><Link href="/propiedades?zone=centro" className="hover:text-foreground">Centro</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Información</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/como-funciona" className="hover:text-foreground">Cómo funciona</Link></li>
                <li><Link href="/quienes-somos" className="hover:text-foreground">Quiénes somos</Link></li>
                <li><Link href="/preguntas-frecuentes" className="hover:text-foreground">Preguntas frecuentes</Link></li>
                <li><Link href="/contacto" className="hover:text-foreground">Contacto</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terminos" className="hover:text-foreground">Términos y condiciones</Link></li>
                <li><Link href="/privacidad" className="hover:text-foreground">Aviso de privacidad</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Tulum Rental Homes. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
