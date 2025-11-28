import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Bed, 
  Bath, 
  Square, 
  MapPin, 
  Home,
  Car,
  Dog,
  Sofa,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ExternalUnit } from "@shared/schema";

export default function PublicUnitDetail() {
  const [matchId, params] = useRoute("/unidad/:id");
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [showAllPhotosDialog, setShowAllPhotosDialog] = useState(false);
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);

  const unitId = params?.id;

  const { data: unit, isLoading, error } = useQuery<ExternalUnit>({
    queryKey: ["/api/public/external-units", unitId],
    enabled: !!unitId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {language === "es" ? "Propiedad no encontrada" : "Property not found"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === "es" 
                ? "La propiedad que buscas no está disponible o ha sido removida."
                : "The property you're looking for is not available or has been removed."}
            </p>
            <Button onClick={() => setLocation("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === "es" ? "Volver al inicio" : "Back to home"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = unit.images || [];
  const currentImage = images[mainImageIndex] || "/placeholder-property.jpg";

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return language === "es" ? "Consultar" : "Contact for price";
    return `$${price.toLocaleString()} ${currency || "MXN"}`;
  };

  const nextImage = () => {
    setMainImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setMainImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Button
          variant="ghost"
          className="mb-4 h-11"
          onClick={() => window.history.back()}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === "es" ? "Volver" : "Back"}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
              {images.length > 0 ? (
                <>
                  <img
                    src={currentImage}
                    alt={unit.name || "Property"}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setShowAllPhotosDialog(true)}
                  />
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                        {mainImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.slice(0, 6).map((img, idx) => (
                  <button
                    key={idx}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === mainImageIndex ? "border-primary" : "border-transparent"
                    }`}
                    onClick={() => setMainImageIndex(idx)}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {images.length > 6 && (
                  <button
                    className="flex-shrink-0 w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-sm font-medium"
                    onClick={() => setShowAllPhotosDialog(true)}
                  >
                    +{images.length - 6}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-unit-name">
                    {unit.name || unit.unitNumber || (language === "es" ? "Propiedad" : "Property")}
                  </h1>
                  {unit.condominiumName && (
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <Building2 className="h-4 w-4" />
                      {unit.condominiumName}
                    </p>
                  )}
                </div>
                <Badge variant={unit.status === "active" || unit.status === "available" ? "default" : "secondary"} className="text-sm">
                  {unit.status === "active" || unit.status === "available"
                    ? (language === "es" ? "Disponible" : "Available")
                    : (language === "es" ? "No disponible" : "Not available")}
                </Badge>
              </div>

              {unit.zone && (
                <p className="text-muted-foreground flex items-center gap-1 mt-2">
                  <MapPin className="h-4 w-4" />
                  {unit.zone}
                </p>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                {formatPrice(unit.monthlyRent, unit.currency)}
              </span>
              <span className="text-muted-foreground">/ {language === "es" ? "mes" : "month"}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {unit.bedrooms !== null && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Bed className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "es" ? "Recámaras" : "Bedrooms"}</p>
                    <p className="font-semibold">{unit.bedrooms}</p>
                  </div>
                </div>
              )}
              {unit.bathrooms !== null && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Bath className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "es" ? "Baños" : "Bathrooms"}</p>
                    <p className="font-semibold">{unit.bathrooms}</p>
                  </div>
                </div>
              )}
              {unit.squareMeters !== null && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Square className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">m²</p>
                    <p className="font-semibold">{unit.squareMeters}</p>
                  </div>
                </div>
              )}
              {unit.unitType && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Home className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "es" ? "Tipo" : "Type"}</p>
                    <p className="font-semibold capitalize">{unit.unitType}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {unit.hasFurniture !== null && (
                <Badge variant="outline" className="gap-1.5 py-1.5">
                  {unit.hasFurniture ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                  <Sofa className="h-3.5 w-3.5" />
                  {language === "es" ? "Amueblado" : "Furnished"}
                </Badge>
              )}
              {unit.hasParking !== null && (
                <Badge variant="outline" className="gap-1.5 py-1.5">
                  {unit.hasParking ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                  <Car className="h-3.5 w-3.5" />
                  {language === "es" ? "Estacionamiento" : "Parking"}
                </Badge>
              )}
              {unit.petsAllowed !== null && (
                <Badge variant="outline" className="gap-1.5 py-1.5">
                  {unit.petsAllowed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                  <Dog className="h-3.5 w-3.5" />
                  {language === "es" ? "Mascotas" : "Pets"}
                </Badge>
              )}
            </div>

            {unit.description && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{language === "es" ? "Descripción" : "Description"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{unit.description}</p>
                </CardContent>
              </Card>
            )}

            {unit.amenities && unit.amenities.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{language === "es" ? "Amenidades" : "Amenities"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {unit.amenities.map((amenity, idx) => (
                      <Badge key={idx} variant="secondary">{amenity}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">{language === "es" ? "¿Te interesa esta propiedad?" : "Interested in this property?"}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === "es" 
                    ? "Contacta a tu agente para agendar una visita o solicitar más información."
                    : "Contact your agent to schedule a visit or request more information."}
                </p>
                <Button className="w-full h-11 bg-green-600 hover:bg-green-700" asChild>
                  <a href={`https://wa.me/?text=${encodeURIComponent(
                    language === "es"
                      ? `Hola! Me interesa la propiedad: ${unit.name || unit.unitNumber || 'Propiedad'} en ${unit.zone || 'Tulum'}. ¿Podemos agendar una visita?`
                      : `Hi! I'm interested in the property: ${unit.name || unit.unitNumber || 'Property'} in ${unit.zone || 'Tulum'}. Can we schedule a visit?`
                  )}`} target="_blank" rel="noopener noreferrer">
                    <SiWhatsapp className="h-5 w-5 mr-2" />
                    {language === "es" ? "Enviar por WhatsApp" : "Send via WhatsApp"}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showAllPhotosDialog} onOpenChange={setShowAllPhotosDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "es" ? "Todas las fotos" : "All photos"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img, idx) => (
              <button
                key={idx}
                className="aspect-square rounded-lg overflow-hidden"
                onClick={() => setExpandedImageIndex(idx)}
              >
                <img
                  src={img}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={expandedImageIndex !== null} onOpenChange={() => setExpandedImageIndex(null)}>
        <DialogContent className="max-w-6xl p-0 bg-black/95">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 text-white hover:bg-white/20"
            onClick={() => setExpandedImageIndex(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          {expandedImageIndex !== null && (
            <div className="relative flex items-center justify-center min-h-[60vh]">
              <img
                src={images[expandedImageIndex]}
                alt={`Full size ${expandedImageIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain"
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 text-white hover:bg-white/20 h-12 w-12"
                    onClick={() => setExpandedImageIndex((prev) => (prev! - 1 + images.length) % images.length)}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 text-white hover:bg-white/20 h-12 w-12"
                    onClick={() => setExpandedImageIndex((prev) => (prev! + 1) % images.length)}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
