import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Bed, 
  Bath, 
  Maximize, 
  MapPin, 
  Home,
  Car,
  PawPrint,
  Sofa,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Calendar,
  Bell,
  MessageCircle,
  Shield,
  Star,
  Check,
  Heart,
  Share2,
  Grid3X3,
  User,
  Wifi,
  Flame,
  Droplets,
  Zap,
  Image as ImageIcon,
  Video,
  Map,
  Globe
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ExternalUnit } from "@shared/schema";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";

export default function PublicUnitDetail() {
  const [matchUnidad, paramsUnidad] = useRoute("/unidad/:id");
  const [matchPropiedad, paramsPropiedad] = useRoute("/propiedad-externa/:id");
  const [matchFriendly, paramsFriendly] = useRoute("/:agencySlug/:unitSlug");
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [showAllPhotosDialog, setShowAllPhotosDialog] = useState(false);
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);
  const [showBenefitsDialog, setShowBenefitsDialog] = useState(false);

  const directUnitId = paramsUnidad?.id || paramsPropiedad?.id;
  const agencySlug = paramsFriendly?.agencySlug;
  const unitSlug = paramsFriendly?.unitSlug;
  const hasFriendlyUrl = !!(agencySlug && unitSlug && !directUnitId);

  const { data: resolvedData, isLoading: isResolvingUrl, isFetched: urlResolved } = useQuery<{ unitId: string }>({
    queryKey: ["/api/public/property", agencySlug, unitSlug],
    enabled: hasFriendlyUrl,
  });

  const unitId = directUnitId || resolvedData?.unitId;

  const { data: unit, isLoading: isLoadingUnit, error } = useQuery<ExternalUnit>({
    queryKey: ["/api/public/external-units", unitId],
    enabled: !!unitId,
  });

  const isLoading = isResolvingUrl || isLoadingUnit || (hasFriendlyUrl && !urlResolved);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Skeleton className="h-10 w-32 mb-6" />
          <Skeleton className="h-[50vh] rounded-2xl mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Home className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">
              {language === "es" ? "Propiedad no encontrada" : "Property not found"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {language === "es" 
                ? "La propiedad que buscas no está disponible o ha sido removida."
                : "The property you're looking for is not available or has been removed."}
            </p>
            <Button size="lg" className="min-h-[44px]" onClick={() => setLocation("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === "es" ? "Volver al inicio" : "Back to home"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = unit.images || unit.primaryImages || [];
  const currentImage = images[mainImageIndex] || "/placeholder-property.jpg";

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return language === "es" ? "Consultar" : "Contact for price";
    return `$${price.toLocaleString()}`;
  };

  const nextImage = () => setMainImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setMainImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const propertyTitle = unit.title || unit.name || unit.unitNumber || (language === "es" ? "Propiedad en Tulum" : "Property in Tulum");
  const propertyLocation = unit.zone || unit.condominiumName || "Tulum, Quintana Roo";

  const benefits = [
    { icon: Calendar, title: language === "es" ? "Agenda visitas" : "Schedule visits", desc: language === "es" ? "Coordina directamente con el agente" : "Coordinate directly with the agent" },
    { icon: Bell, title: language === "es" ? "Alertas personalizadas" : "Custom alerts", desc: language === "es" ? "Recibe nuevas propiedades similares" : "Get similar new properties" },
    { icon: MessageCircle, title: language === "es" ? "Chat directo" : "Direct chat", desc: language === "es" ? "Comunícate con tu asesor" : "Communicate with your advisor" },
    { icon: Shield, title: language === "es" ? "Propiedades verificadas" : "Verified properties", desc: language === "es" ? "Todas nuestras propiedades son validadas" : "All our properties are validated" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            className="min-h-[44px] gap-2"
            onClick={() => setLocation("/")}
            data-testid="button-back-home"
          >
            <img src={logoIcon} alt="HomesApp" className="h-14 w-auto" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              data-testid="button-share"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              data-testid="button-favorite"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Image Gallery */}
      <div className="relative bg-muted">
        <div className="max-w-7xl mx-auto">
          {images.length > 0 ? (
            <div className="relative">
              {/* Mobile: Full width carousel */}
              <div className="lg:hidden relative aspect-[4/3]">
                <img
                  src={currentImage}
                  alt={propertyTitle}
                  className="w-full h-full object-cover"
                  onClick={() => setShowAllPhotosDialog(true)}
                />
                {images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] rounded-full bg-white/90 shadow-lg"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] rounded-full bg-white/90 shadow-lg"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                      {mainImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Desktop: Grid layout */}
              <div className="hidden lg:grid grid-cols-4 grid-rows-2 gap-2 p-4 h-[60vh] max-h-[500px]">
                <div 
                  className="col-span-2 row-span-2 relative rounded-l-2xl overflow-hidden cursor-pointer"
                  onClick={() => setShowAllPhotosDialog(true)}
                >
                  <img src={images[0]} alt={propertyTitle} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
                {images.slice(1, 5).map((img, idx) => (
                  <div 
                    key={idx} 
                    className={`relative overflow-hidden cursor-pointer ${idx === 1 ? 'rounded-tr-2xl' : ''} ${idx === 3 ? 'rounded-br-2xl' : ''}`}
                    onClick={() => { setMainImageIndex(idx + 1); setShowAllPhotosDialog(true); }}
                  >
                    <img src={img} alt={`${propertyTitle} ${idx + 2}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    {idx === 3 && images.length > 5 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-lg font-semibold">+{images.length - 5} fotos</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[40vh] flex items-center justify-center">
              <div className="text-center">
                <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{language === "es" ? "Sin fotos disponibles" : "No photos available"}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-2 px-4 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
              onClick={() => setShowAllPhotosDialog(true)}
              disabled={images.length === 0}
              data-testid="button-action-images"
            >
              <ImageIcon className="h-5 w-5" />
              <span className="text-xs">{language === "es" ? "Imágenes" : "Images"}</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
              disabled={!unit.videos || unit.videos.length === 0}
              data-testid="button-action-video"
            >
              <Video className="h-5 w-5" />
              <span className="text-xs">{language === "es" ? "Video" : "Video"}</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
              disabled={!unit.googleMapsUrl}
              onClick={() => unit.googleMapsUrl && window.open(unit.googleMapsUrl, '_blank')}
              data-testid="button-action-location"
            >
              <Map className="h-5 w-5" />
              <span className="text-xs">{language === "es" ? "Ubicación" : "Location"}</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
              disabled={!unit.virtualTourUrl}
              onClick={() => unit.virtualTourUrl && window.open(unit.virtualTourUrl, '_blank')}
              data-testid="button-action-tour360"
            >
              <Globe className="h-5 w-5" />
              <span className="text-xs">{language === "es" ? "Tour 360°" : "360° Tour"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title Section */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl sm:text-3xl font-semibold" data-testid="text-property-title">
                  {propertyTitle}
                </h1>
                <Badge 
                  variant={unit.status === "active" || unit.status === "available" ? "default" : "secondary"} 
                  className="shrink-0 text-sm px-3 py-1"
                >
                  {unit.status === "active" || unit.status === "available"
                    ? (language === "es" ? "Disponible" : "Available")
                    : (language === "es" ? "No disponible" : "Not available")}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2 text-lg" data-testid="text-property-location">
                <MapPin className="h-5 w-5 shrink-0" />
                {propertyLocation}
              </p>
              {unit.condominiumName && unit.zone && (
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 shrink-0" />
                  {unit.condominiumName}
                </p>
              )}
            </div>

            <Separator />

            {/* Key Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {unit.bedrooms !== null && unit.bedrooms !== undefined && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bed className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{unit.bedrooms}</p>
                    <p className="text-sm text-muted-foreground">{language === "es" ? "Recámaras" : "Bedrooms"}</p>
                  </div>
                </div>
              )}
              {unit.bathrooms !== null && unit.bathrooms !== undefined && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bath className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{unit.bathrooms}</p>
                    <p className="text-sm text-muted-foreground">{language === "es" ? "Baños" : "Bathrooms"}</p>
                  </div>
                </div>
              )}
              {(unit.squareMeters || unit.area) && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Maximize className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{unit.squareMeters || unit.area}</p>
                    <p className="text-sm text-muted-foreground">m²</p>
                  </div>
                </div>
              )}
              {unit.unitType && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold capitalize truncate">{unit.unitType}</p>
                    <p className="text-sm text-muted-foreground">{language === "es" ? "Tipo" : "Type"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Info Badges */}
            <div className="flex flex-wrap gap-3">
              {unit.hasFurniture !== null && unit.hasFurniture !== undefined && (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full min-h-[44px] ${unit.hasFurniture ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-muted text-muted-foreground'}`}>
                  <Sofa className="h-5 w-5" />
                  <span className="font-medium">{unit.hasFurniture ? (language === "es" ? "Amueblado" : "Furnished") : (language === "es" ? "Sin amueblar" : "Unfurnished")}</span>
                </div>
              )}
              {unit.hasParking !== null && unit.hasParking !== undefined && (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full min-h-[44px] ${unit.hasParking ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-muted text-muted-foreground'}`}>
                  <Car className="h-5 w-5" />
                  <span className="font-medium">{unit.hasParking ? (language === "es" ? "Con estacionamiento" : "Parking included") : (language === "es" ? "Sin estacionamiento" : "No parking")}</span>
                </div>
              )}
              {unit.petsAllowed !== null && unit.petsAllowed !== undefined && (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full min-h-[44px] ${unit.petsAllowed ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-muted text-muted-foreground'}`}>
                  <PawPrint className="h-5 w-5" />
                  <span className="font-medium">{unit.petsAllowed ? (language === "es" ? "Acepta mascotas" : "Pets allowed") : (language === "es" ? "No mascotas" : "No pets")}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            {unit.description && (
              <div>
                <h2 className="text-xl font-semibold mb-4">{language === "es" ? "Acerca de esta propiedad" : "About this property"}</h2>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{unit.description}</p>
              </div>
            )}

            {/* Included Services */}
            {unit.includedServices && Object.values(unit.includedServices).some(v => v) && (
              <div>
                <h2 className="text-xl font-semibold mb-4">{language === "es" ? "Servicios Incluidos" : "Included Services"}</h2>
                <div className="flex flex-wrap gap-3">
                  {unit.includedServices.internet && (
                    <Badge variant="secondary" className="gap-2 px-4 py-2.5 text-sm">
                      <Wifi className="h-4 w-4" />
                      {language === "es" ? "Internet" : "Internet"}
                    </Badge>
                  )}
                  {unit.includedServices.water && (
                    <Badge variant="secondary" className="gap-2 px-4 py-2.5 text-sm">
                      <Droplets className="h-4 w-4" />
                      {language === "es" ? "Agua" : "Water"}
                    </Badge>
                  )}
                  {unit.includedServices.electricity && (
                    <Badge variant="secondary" className="gap-2 px-4 py-2.5 text-sm">
                      <Zap className="h-4 w-4" />
                      {language === "es" ? "Electricidad" : "Electricity"}
                    </Badge>
                  )}
                  {unit.includedServices.gas && (
                    <Badge variant="secondary" className="gap-2 px-4 py-2.5 text-sm">
                      <Flame className="h-4 w-4" />
                      {language === "es" ? "Gas" : "Gas"}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Amenities */}
            {unit.amenities && unit.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">{language === "es" ? "Amenidades" : "Amenities"}</h2>
                <div className="flex flex-wrap gap-2">
                  {unit.amenities.map((amenity, idx) => (
                    <Badge key={idx} variant="outline" className="gap-1 px-3 py-1.5">
                      <Check className="h-3 w-3" />
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Sticky CTA Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-xl border-2">
                <CardContent className="p-6 space-y-6">
                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl font-bold">
                        {formatPrice(unit.monthlyRent || unit.price, unit.currency)}
                      </span>
                      <span className="text-lg text-muted-foreground">
                        {unit.currency || "MXN"} / {language === "es" ? "mes" : "month"}
                      </span>
                    </div>
                    {unit.securityDeposit && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {language === "es" ? "Depósito:" : "Deposit:"} ${unit.securityDeposit.toLocaleString()} {unit.currency || "MXN"}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* CTA Section */}
                  <div className="space-y-3">
                    <p className="font-medium text-center">
                      {language === "es" ? "¿Te interesa esta propiedad?" : "Interested in this property?"}
                    </p>
                    
                    <Button 
                      size="lg" 
                      className="w-full min-h-[52px] text-base font-semibold"
                      onClick={() => setShowBenefitsDialog(true)}
                      data-testid="button-schedule-visit"
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      {language === "es" ? "Agendar visita" : "Schedule visit"}
                    </Button>

                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full min-h-[52px] text-base"
                      onClick={() => setShowBenefitsDialog(true)}
                      data-testid="button-contact-agent"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      {language === "es" ? "Contactar asesor" : "Contact agent"}
                    </Button>
                  </div>

                  <Separator />

                  {/* Trust Indicators */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Shield className="h-5 w-5 text-green-600 shrink-0" />
                      <span className="text-muted-foreground">{language === "es" ? "Propiedad verificada por HomesApp" : "Property verified by HomesApp"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Star className="h-5 w-5 text-yellow-500 shrink-0" />
                      <span className="text-muted-foreground">{language === "es" ? "Respuesta en menos de 24h" : "Response within 24h"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile sticky CTA */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg lg:hidden z-40">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold">{formatPrice(unit.monthlyRent || unit.price, unit.currency)}</p>
                    <p className="text-sm text-muted-foreground">/ {language === "es" ? "mes" : "month"}</p>
                  </div>
                  <Button 
                    size="lg" 
                    className="min-h-[52px] px-8 text-base font-semibold"
                    onClick={() => setShowBenefitsDialog(true)}
                    data-testid="button-mobile-cta"
                  >
                    {language === "es" ? "Agendar visita" : "Schedule visit"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Dialog */}
      <Dialog open={showBenefitsDialog} onOpenChange={setShowBenefitsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto mb-4">
              <img src={logoIcon} alt="HomesApp" className="h-12 w-auto mx-auto" />
            </div>
            <DialogTitle className="text-2xl">
              {language === "es" ? "Crea tu cuenta gratis" : "Create your free account"}
            </DialogTitle>
            <DialogDescription className="text-base">
              {language === "es" 
                ? "Para agendar una visita y acceder a todos los beneficios de HomesApp"
                : "To schedule a visit and access all HomesApp benefits"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{benefit.title}</p>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <Button 
              size="lg" 
              className="w-full min-h-[52px] text-base font-semibold"
              onClick={() => setLocation("/register")}
              data-testid="button-create-account"
            >
              <User className="h-5 w-5 mr-2" />
              {language === "es" ? "Crear cuenta gratis" : "Create free account"}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full min-h-[52px] text-base"
              onClick={() => setLocation("/login")}
              data-testid="button-login-existing"
            >
              {language === "es" ? "Ya tengo una cuenta" : "I already have an account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Photos Dialog */}
      <Dialog open={showAllPhotosDialog} onOpenChange={setShowAllPhotosDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-4 sticky top-0 bg-background z-10 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{language === "es" ? "Todas las fotos" : "All photos"}</DialogTitle>
              <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => setShowAllPhotosDialog(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-6 pt-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                className="aspect-[4/3] rounded-xl overflow-hidden"
                onClick={() => setExpandedImageIndex(idx)}
              >
                <img
                  src={img}
                  alt={`${propertyTitle} - ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Image Dialog */}
      <Dialog open={expandedImageIndex !== null} onOpenChange={() => setExpandedImageIndex(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-10 text-white hover:bg-white/20 min-h-[44px] min-w-[44px]"
            onClick={() => setExpandedImageIndex(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          {expandedImageIndex !== null && (
            <div className="relative flex items-center justify-center min-h-[70vh]">
              <img
                src={images[expandedImageIndex]}
                alt={`${propertyTitle} - ${expandedImageIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain"
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 text-white hover:bg-white/20 min-h-[52px] min-w-[52px]"
                    onClick={() => setExpandedImageIndex((prev) => (prev! - 1 + images.length) % images.length)}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 text-white hover:bg-white/20 min-h-[52px] min-w-[52px]"
                    onClick={() => setExpandedImageIndex((prev) => (prev! + 1) % images.length)}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full">
                    {expandedImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Spacer for mobile sticky CTA */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}
