import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
import { PropertyMap } from "@/components/external/PropertyMap";

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
  const [showFavoriteDialog, setShowFavoriteDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: ""
  });
  const { toast } = useToast();

  // Contact form submission mutation
  const contactMutation = useMutation({
    mutationFn: async (data: typeof contactForm & { agencyId: string; unitId: string }) => {
      return await apiRequest("/api/public/leads", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "Solicitud enviada" : "Request sent",
        description: language === "es" 
          ? "Un asesor te contactará pronto." 
          : "An advisor will contact you soon.",
      });
      setShowContactDialog(false);
      setContactForm({ firstName: "", lastName: "", email: "", phone: "", message: "" });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo enviar la solicitud" : "Could not send request"),
        variant: "destructive",
      });
    },
  });

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

  // Fetch section-based media if available
  interface MediaSection {
    key: string;
    section: string;
    sectionIndex: number;
    label: { es: string; en: string };
    images: Array<{ id: string; url: string; fullSizeUrl: string | null; caption: string | null; isCover: boolean }>;
  }
  
  const { data: sectionMediaData } = useQuery<{ hasMedia: boolean; count: number; sections: MediaSection[] }>({
    queryKey: ["/api/public/external-units", unitId, "media"],
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

  // Combine primary and secondary images for full gallery (legacy system)
  const primaryImages = unit.primaryImages || unit.images || [];
  const secondaryImages = unit.secondaryImages || [];
  const allImages = [...primaryImages, ...secondaryImages];
  const legacyImages = allImages.length > 0 ? allImages : [];
  
  // Build flat array of all images with fullSizeUrl info (combining section-based and legacy)
  interface ImageWithFullSize { url: string; fullSizeUrl: string | null; }
  const sectionFlatImagesWithFullSize: ImageWithFullSize[] = sectionMediaData?.hasMedia 
    ? sectionMediaData.sections.flatMap(s => s.images.map(img => ({ url: img.url, fullSizeUrl: img.fullSizeUrl })))
    : [];
  const legacyImagesWithFullSize: ImageWithFullSize[] = allImages.map(url => ({ url, fullSizeUrl: null }));
  const imagesWithFullSize = sectionFlatImagesWithFullSize.length > 0 ? sectionFlatImagesWithFullSize : legacyImagesWithFullSize;
  const images = imagesWithFullSize.map(img => img.url);
  const getFullSizeUrl = (index: number): string => {
    const imgData = imagesWithFullSize[index];
    return imgData?.fullSizeUrl || imgData?.url || images[index] || "";
  };
  const currentImage = images[mainImageIndex] || "/placeholder-property.jpg";

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return language === "es" ? "Consultar" : "Contact for price";
    return `$${price.toLocaleString()}`;
  };

  const nextImage = () => setMainImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setMainImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const getPropertyTitle = () => {
    if (unit.title) return unit.title;
    const typeMap: Record<string, string> = language === "es" 
      ? { departamento: "Departamento", casa: "Casa", estudio: "Estudio", penthouse: "Penthouse", villa: "Villa" }
      : { departamento: "Apartment", casa: "House", estudio: "Studio", penthouse: "Penthouse", villa: "Villa" };
    const rawType = (unit.unitType || unit.propertyType || 'departamento')?.toLowerCase() || 'departamento';
    const type = typeMap[rawType] || (language === "es" ? "Departamento" : "Apartment");
    const condoName = unit.condominiumName || '';
    const unitNum = unit.unitNumber || unit.name || '';
    const cleanUnitNum = unitNum.replace(/^#/, '');
    if (condoName && cleanUnitNum) {
      return `${type} en ${condoName} #${cleanUnitNum}`;
    } else if (condoName) {
      return `${type} en ${condoName}`;
    } else if (cleanUnitNum) {
      return `${type} #${cleanUnitNum}`;
    }
    return type;
  };
  const propertyTitle = getPropertyTitle();
  const propertyLocation = [unit.condominiumName, unit.zone].filter(Boolean).join(', ') || "Tulum, Quintana Roo";

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
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({
                  title: language === "es" ? "Link copiado" : "Link copied",
                  description: language === "es" ? "El link ha sido copiado al portapapeles" : "The link has been copied to clipboard",
                });
              }}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              data-testid="button-favorite"
              onClick={() => setShowFavoriteDialog(true)}
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
              <div className="hidden lg:grid grid-cols-4 grid-rows-2 gap-1.5 p-3 h-[45vh] max-h-[360px]">
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
          <div className="grid grid-cols-4 gap-1.5 px-3 py-3 sm:gap-2 sm:px-4 sm:py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center gap-1 h-auto py-2.5 sm:py-3"
              onClick={() => setShowAllPhotosDialog(true)}
              disabled={images.length === 0}
              data-testid="button-action-images"
            >
              <ImageIcon className="h-5 w-5" />
              <span className="text-[10px] sm:text-xs font-medium">{language === "es" ? "Imágenes" : "Images"}</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center gap-1 h-auto py-2.5 sm:py-3"
              disabled={!unit.videos || unit.videos.length === 0}
              data-testid="button-action-video"
            >
              <Video className="h-5 w-5" />
              <span className="text-[10px] sm:text-xs font-medium">{language === "es" ? "Video" : "Video"}</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center gap-1 h-auto py-2.5 sm:py-3"
              disabled={!unit.latitude || !unit.longitude}
              onClick={() => setShowLocationDialog(true)}
              data-testid="button-action-location"
            >
              <Map className="h-5 w-5" />
              <span className="text-[10px] sm:text-xs font-medium">{language === "es" ? "Ubicación" : "Location"}</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center gap-1 h-auto py-2.5 sm:py-3"
              disabled={!unit.virtualTourUrl}
              onClick={() => unit.virtualTourUrl && window.open(unit.virtualTourUrl, '_blank')}
              data-testid="button-action-tour360"
            >
              <Globe className="h-5 w-5" />
              <span className="text-[10px] sm:text-xs font-medium">{language === "es" ? "Tour 360°" : "360° Tour"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title Section - Matching Preview Dialog Format */}
            <div>
              <h1 className="text-2xl font-bold mb-2" data-testid="text-property-title">
                {propertyTitle}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground" data-testid="text-property-location">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{propertyLocation}</span>
              </div>
            </div>

            {/* Key Features Row - Matching Preview Dialog Format */}
            <div className="flex flex-wrap gap-4 py-3 px-4 bg-muted/50 rounded-lg">
              {unit.bedrooms !== null && unit.bedrooms !== undefined && Number(unit.bedrooms) > 0 && (
                <div className="flex items-center gap-2">
                  <Bed className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{unit.bedrooms}</span>
                  <span className="text-sm text-muted-foreground">{language === "es" ? "Recámaras" : "Bedrooms"}</span>
                </div>
              )}
              {unit.bathrooms !== null && unit.bathrooms !== undefined && (
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{unit.bathrooms}</span>
                  <span className="text-sm text-muted-foreground">{language === "es" ? "Baños" : "Bathrooms"}</span>
                </div>
              )}
              {(unit.squareMeters || unit.area) && (
                <div className="flex items-center gap-2">
                  <Maximize className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{unit.squareMeters || unit.area} m²</span>
                  <span className="text-sm text-muted-foreground">{language === "es" ? "Área" : "Area"}</span>
                </div>
              )}
              {unit.petsAllowed && (
                <div className="flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{language === "es" ? "Acepta Mascotas" : "Pet Friendly"}</span>
                </div>
              )}
            </div>

            {/* Amenities Section - Matching Preview Dialog Format */}
            {unit.amenities && unit.amenities.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">{language === "es" ? "Amenidades" : "Amenities"}</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {unit.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

          </div>

          {/* Sidebar - Sticky CTA Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-xl border-2">
                <CardContent className="p-6 space-y-6">
                  {/* Prices */}
                  <div className="space-y-4">
                    {/* Rent Price */}
                    {(unit.monthlyRent || unit.price) && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          {language === "es" ? "Renta Mensual" : "Monthly Rent"}
                        </p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
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
                    )}

                    {/* Sale Price */}
                    {(unit as any).salePrice && Number((unit as any).salePrice) > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          {language === "es" ? "Precio de Venta" : "Sale Price"}
                        </p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                            ${Number((unit as any).salePrice).toLocaleString()}
                          </span>
                          <span className="text-lg text-muted-foreground">
                            {(unit as any).saleCurrency || unit.currency || "MXN"}
                          </span>
                        </div>
                      </div>
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
                      onClick={() => setShowContactDialog(true)}
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

      {/* Favorite Dialog - Prompt to Create Account */}
      <Dialog open={showFavoriteDialog} onOpenChange={setShowFavoriteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center">
              <Heart className="h-8 w-8 text-red-500" />
            </div>
            <DialogTitle className="text-xl">
              {language === "es" ? "Guarda esta propiedad" : "Save this property"}
            </DialogTitle>
            <DialogDescription className="text-base">
              {language === "es" 
                ? "Crea una cuenta gratuita para guardar tus propiedades favoritas y recibir alertas cuando haya cambios."
                : "Create a free account to save your favorite properties and get alerts when there are changes."}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex flex-col gap-3 pt-4">
            <Button 
              size="lg" 
              className="w-full min-h-[52px] text-base font-semibold"
              onClick={() => {
                setShowFavoriteDialog(false);
                setLocation("/register");
              }}
              data-testid="button-register-favorite"
            >
              <User className="h-5 w-5 mr-2" />
              {language === "es" ? "Crear cuenta gratis" : "Create free account"}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full min-h-[52px] text-base"
              onClick={() => {
                setShowFavoriteDialog(false);
                setLocation("/login");
              }}
              data-testid="button-login-favorite"
            >
              {language === "es" ? "Ya tengo una cuenta" : "I already have an account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* All Photos Dialog - Professional Gallery */}
      <Dialog open={showAllPhotosDialog} onOpenChange={setShowAllPhotosDialog}>
        <DialogContent hideCloseButton className="max-w-6xl max-h-[95vh] overflow-hidden p-0 bg-background border shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-4">
              <h2 className="font-semibold text-lg">
                {propertyTitle}
              </h2>
              <Badge variant="secondary">
                {sectionMediaData?.hasMedia ? sectionMediaData.count : images.length} {language === "es" ? "fotos" : "photos"}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="min-h-[44px] min-w-[44px]" 
              onClick={() => setShowAllPhotosDialog(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Gallery Grid */}
          <div className="overflow-y-auto max-h-[calc(95vh-80px)] p-4 bg-muted/30">
            {/* Section-based images (new system) */}
            {sectionMediaData?.hasMedia && sectionMediaData.sections.length > 0 ? (
              <div className="space-y-6">
                {sectionMediaData.sections.map((section, sectionIdx) => (
                  <div key={section.key} className="mb-6">
                    <p className="text-muted-foreground text-sm mb-3 px-2 font-medium flex items-center gap-2">
                      {section.label[language]} ({section.images.length})
                      {section.images.some(img => img.isCover) && (
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      )}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {section.images.map((img, imgIdx) => {
                        const flatIndex = sectionMediaData.sections
                          .slice(0, sectionIdx)
                          .reduce((acc, s) => acc + s.images.length, 0) + imgIdx;
                        return (
                          <button
                            key={img.id}
                            className="aspect-[4/3] rounded-xl overflow-hidden relative group shadow-sm border"
                            onClick={() => setExpandedImageIndex(flatIndex)}
                            onContextMenu={(e) => e.preventDefault()}
                          >
                            <img
                              src={img.url}
                              alt={img.caption || `${propertyTitle} - ${section.label[language]}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                            {img.isCover && (
                              <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                                <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                                {language === "es" ? "Portada" : "Cover"}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Legacy: Primary Images Section */}
                {primaryImages.length > 0 && (
                  <div className="mb-6">
                    <p className="text-muted-foreground text-sm mb-3 px-2 font-medium">
                      {language === "es" ? "Fotos principales" : "Main photos"} ({primaryImages.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {primaryImages.map((img, idx) => (
                        <button
                          key={`primary-${idx}`}
                          className="aspect-[4/3] rounded-xl overflow-hidden relative group shadow-sm border"
                          onClick={() => setExpandedImageIndex(idx)}
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          <img
                            src={img}
                            alt={`${propertyTitle} - ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Legacy: Secondary Images Section */}
                {secondaryImages.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-3 px-2 font-medium">
                      {language === "es" ? "Más fotos" : "More photos"} ({secondaryImages.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {secondaryImages.map((img, idx) => (
                        <button
                          key={`secondary-${idx}`}
                          className="aspect-[4/3] rounded-xl overflow-hidden relative group shadow-sm border"
                          onClick={() => setExpandedImageIndex(primaryImages.length + idx)}
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          <img
                            src={img}
                            alt={`${propertyTitle} - ${primaryImages.length + idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Fallback if no categorized images */}
                {primaryImages.length === 0 && secondaryImages.length === 0 && images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        className="aspect-[4/3] rounded-xl overflow-hidden relative group shadow-sm border"
                        onClick={() => setExpandedImageIndex(idx)}
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        <img
                          src={img}
                          alt={`${propertyTitle} - ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Image Dialog */}
      <Dialog open={expandedImageIndex !== null} onOpenChange={() => setExpandedImageIndex(null)}>
        <DialogContent hideCloseButton className="max-w-[95vw] max-h-[95vh] p-0 bg-background border shadow-xl overflow-hidden">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-20 min-h-[44px] min-w-[44px] bg-background/80 hover:bg-muted rounded-full"
            onClick={() => setExpandedImageIndex(null)}
          >
            <X className="h-5 w-5" />
          </Button>
          
          {expandedImageIndex !== null && (
            <div 
              className="flex items-center justify-center h-[90vh] py-8 px-20 relative select-none"
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Image with protection overlay */}
              <div className="relative">
                <img
                  src={getFullSizeUrl(expandedImageIndex)}
                  alt={`${propertyTitle} - ${expandedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg select-none"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ 
                    WebkitUserSelect: 'none',
                    WebkitUserDrag: 'none',
                    WebkitTouchCallout: 'none',
                  } as React.CSSProperties}
                />
                {/* Transparent overlay to prevent direct image interaction */}
                <div className="absolute inset-0 bg-transparent" />
              </div>
            </div>
          )}
          
          {/* Left navigation button - positioned outside image area */}
          {expandedImageIndex !== null && images.length > 1 && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 min-h-[52px] min-w-[52px] rounded-full shadow-lg border"
              onClick={() => setExpandedImageIndex((prev) => (prev! - 1 + images.length) % images.length)}
            >
              <ChevronLeft className="h-7 w-7" />
            </Button>
          )}
          
          {/* Right navigation button - positioned outside image area */}
          {expandedImageIndex !== null && images.length > 1 && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 min-h-[52px] min-w-[52px] rounded-full shadow-lg border"
              onClick={() => setExpandedImageIndex((prev) => (prev! + 1) % images.length)}
            >
              <ChevronRight className="h-7 w-7" />
            </Button>
          )}
          
          {/* Image counter */}
          {expandedImageIndex !== null && images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-foreground/90 text-background px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              {expandedImageIndex + 1} / {images.length}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Form Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto mb-4">
              <img src={logoIcon} alt="HomesApp" className="h-12 w-auto mx-auto" />
            </div>
            <DialogTitle className="text-2xl">
              {language === "es" ? "Solicitar información" : "Request information"}
            </DialogTitle>
            <DialogDescription className="text-base">
              {language === "es" 
                ? "Completa el formulario y un asesor te contactará" 
                : "Fill out the form and an advisor will contact you"}
            </DialogDescription>
          </DialogHeader>
          
          <form 
            className="space-y-4 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!unit) return;
              contactMutation.mutate({
                ...contactForm,
                agencyId: (unit as any).agencyId,
                unitId: unit.id,
              });
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {language === "es" ? "Nombre *" : "First name *"}
                </Label>
                <Input
                  id="firstName"
                  value={contactForm.firstName}
                  onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                  placeholder={language === "es" ? "Tu nombre" : "Your name"}
                  required
                  data-testid="input-contact-firstname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {language === "es" ? "Apellido *" : "Last name *"}
                </Label>
                <Input
                  id="lastName"
                  value={contactForm.lastName}
                  onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                  placeholder={language === "es" ? "Tu apellido" : "Your last name"}
                  required
                  data-testid="input-contact-lastname"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                {language === "es" ? "Correo electrónico" : "Email"}
              </Label>
              <Input
                id="email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder={language === "es" ? "tu@email.com" : "you@email.com"}
                data-testid="input-contact-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                {language === "es" ? "Teléfono" : "Phone"}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="+52 999 123 4567"
                data-testid="input-contact-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                {language === "es" ? "Mensaje (opcional)" : "Message (optional)"}
              </Label>
              <Textarea
                id="message"
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                placeholder={language === "es" 
                  ? "¿En qué podemos ayudarte?" 
                  : "How can we help you?"}
                rows={3}
                data-testid="input-contact-message"
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {language === "es" 
                ? "Se requiere al menos un método de contacto (email o teléfono)" 
                : "At least one contact method is required (email or phone)"}
            </p>

            <DialogFooter className="pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full min-h-[52px]"
                disabled={contactMutation.isPending || !contactForm.firstName || !contactForm.lastName || (!contactForm.email && !contactForm.phone)}
                data-testid="button-submit-contact"
              >
                {contactMutation.isPending 
                  ? (language === "es" ? "Enviando..." : "Sending...") 
                  : (language === "es" ? "Enviar solicitud" : "Send request")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Location Map Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="max-w-4xl w-[95vw] h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-4 py-3 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {language === "es" ? "Ubicación de la propiedad" : "Property Location"}
            </DialogTitle>
            <DialogDescription>
              {propertyLocation}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {unit.latitude && unit.longitude ? (
              import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                <PropertyMap
                  properties={[{
                    id: unit.id || 'current-property',
                    title: propertyTitle,
                    unitNumber: unit.unitNumber || unit.id || 'N/A',
                    condominiumName: (unit as any).condominiumName || propertyLocation,
                    latitude: Number(unit.latitude),
                    longitude: Number(unit.longitude),
                    price: unit.price || undefined,
                    currency: unit.currency || 'MXN',
                    bedrooms: unit.bedrooms || undefined,
                    bathrooms: unit.bathrooms || undefined,
                    area: (unit as any).squareMeters || unit.area || undefined,
                    propertyType: (unit as any).unitType || unit.propertyType || '',
                    zone: unit.zone || '',
                    primaryImages: images.slice(0, 1),
                  }]}
                  center={{ lat: Number(unit.latitude), lng: Number(unit.longitude) }}
                  zoom={16}
                  height="100%"
                  language={language}
                  showInfoWindow={true}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
                  <MapPin className="h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground text-center">
                    {language === "es" ? "El mapa no está disponible" : "Map is not available"}
                  </p>
                  {unit.googleMapsUrl && (
                    <Button onClick={() => window.open(unit.googleMapsUrl!, '_blank')}>
                      {language === "es" ? "Abrir en Google Maps" : "Open in Google Maps"}
                    </Button>
                  )}
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  {language === "es" ? "Ubicación no disponible" : "Location not available"}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Spacer for mobile sticky CTA */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}
