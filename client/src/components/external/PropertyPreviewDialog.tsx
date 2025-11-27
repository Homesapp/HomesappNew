import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, Bed, Bath, Square, Image as ImageIcon, Video, 
  Map, Scan, ChevronLeft, ChevronRight, X, ExternalLink,
  Check, Wifi, Flame, Droplets, Zap, Dog, Globe
} from "lucide-react";
import { useState } from "react";

interface PropertyPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: {
    unitNumber: string;
    title?: string | null;
    description?: string | null;
    price?: string | null;
    propertyType?: string | null;
    bedrooms?: number | null;
    bathrooms?: string | null;
    area?: string | null;
    zone?: string | null;
    city?: string | null;
    address?: string | null;
    primaryImages?: string[];
    secondaryImages?: string[];
    videos?: string[];
    virtualTourUrl?: string | null;
    googleMapsUrl?: string | null;
    amenities?: string[];
    includedServices?: {
      water?: boolean;
      electricity?: boolean;
      internet?: boolean;
      gas?: boolean;
    } | null;
    petFriendly?: boolean;
  };
  condominiumName?: string;
  language?: 'es' | 'en';
}

export function PropertyPreviewDialog({
  open,
  onOpenChange,
  unit,
  condominiumName,
  language = 'es',
}: PropertyPreviewDialogProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const allImages = [...(unit.primaryImages || []), ...(unit.secondaryImages || [])];

  const texts = {
    es: {
      preview: "Vista Previa de Publicación",
      previewDesc: "Así se verá tu propiedad en el sitio principal de HomesApp",
      perMonth: "/mes",
      bedrooms: "Recámaras",
      bathrooms: "Baños",
      area: "Área",
      description: "Descripción",
      amenities: "Amenidades",
      includedServices: "Servicios Incluidos",
      water: "Agua",
      electricity: "Electricidad",
      internet: "Internet",
      gas: "Gas",
      petFriendly: "Acepta Mascotas",
      images: "Imágenes",
      video: "Video",
      location: "Ubicación",
      tour360: "Tour 360°",
      noImages: "Sin imágenes",
      close: "Cerrar",
      types: {
        departamento: "Departamento",
        casa: "Casa",
        estudio: "Estudio",
        penthouse: "Penthouse",
        villa: "Villa",
      } as Record<string, string>,
    },
    en: {
      preview: "Publication Preview",
      previewDesc: "This is how your property will look on the main HomesApp site",
      perMonth: "/month",
      bedrooms: "Bedrooms",
      bathrooms: "Bathrooms",
      area: "Area",
      description: "Description",
      amenities: "Amenities",
      includedServices: "Included Services",
      water: "Water",
      electricity: "Electricity",
      internet: "Internet",
      gas: "Gas",
      petFriendly: "Pet Friendly",
      images: "Images",
      video: "Video",
      location: "Location",
      tour360: "360° Tour",
      noImages: "No images",
      close: "Close",
      types: {
        departamento: "Apartment",
        casa: "House",
        estudio: "Studio",
        penthouse: "Penthouse",
        villa: "Villa",
      } as Record<string, string>,
    },
  };

  const t = texts[language];

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  const getPropertyTitle = () => {
    if (unit.title) return unit.title;
    const type = t.types[unit.propertyType || 'departamento'] || unit.propertyType;
    const location = condominiumName || unit.zone || '';
    return `${type}${location ? ` en ${location}` : ''}`;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            {t.preview}
          </DialogTitle>
          <DialogDescription>
            {t.previewDesc}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="pb-6">
            <div className="relative bg-muted">
              {allImages.length > 0 ? (
                <div className="relative h-72 md:h-96 overflow-hidden">
                  <img
                    src={allImages[currentImageIndex]}
                    alt={getPropertyTitle()}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {allImages.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                        onClick={prevImage}
                        data-testid="button-prev-preview-image"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                        onClick={nextImage}
                        data-testid="button-next-preview-image"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {allImages.length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-16 w-16 mx-auto mb-2 opacity-50" />
                    <p>{t.noImages}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 px-4 py-4 border-b">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-2"
                disabled={allImages.length === 0}
                data-testid="button-preview-images"
              >
                <ImageIcon className="h-4 w-4" />
                <span className="text-xs">{t.images}</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-2"
                disabled={!unit.videos || unit.videos.length === 0}
                data-testid="button-preview-video"
              >
                <Video className="h-4 w-4" />
                <span className="text-xs">{t.video}</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-2"
                disabled={!unit.googleMapsUrl}
                data-testid="button-preview-location"
              >
                <Map className="h-4 w-4" />
                <span className="text-xs">{t.location}</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-2"
                disabled={!unit.virtualTourUrl}
                data-testid="button-preview-tour360"
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs">{t.tour360}</span>
              </Button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{getPropertyTitle()}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="text-sm">
                      {[condominiumName, unit.zone, unit.city].filter(Boolean).join(', ') || 'Tulum'}
                    </span>
                  </div>
                </div>
                {unit.price && (
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(unit.price)}
                    </p>
                    <p className="text-sm text-muted-foreground">{t.perMonth}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 py-3 px-4 bg-muted/50 rounded-lg">
                {unit.bedrooms != null && unit.bedrooms > 0 && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{unit.bedrooms}</span>
                    <span className="text-sm text-muted-foreground">{t.bedrooms}</span>
                  </div>
                )}
                {unit.bathrooms && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{unit.bathrooms}</span>
                    <span className="text-sm text-muted-foreground">{t.bathrooms}</span>
                  </div>
                )}
                {unit.area && (
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{unit.area} m²</span>
                    <span className="text-sm text-muted-foreground">{t.area}</span>
                  </div>
                )}
                {unit.petFriendly && (
                  <div className="flex items-center gap-2">
                    <Dog className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t.petFriendly}</span>
                  </div>
                )}
              </div>

              {unit.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{t.description}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{unit.description}</p>
                </div>
              )}

              {unit.includedServices && Object.values(unit.includedServices).some(v => v) && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{t.includedServices}</h3>
                  <div className="flex flex-wrap gap-2">
                    {unit.includedServices.water && (
                      <Badge variant="secondary" className="gap-1">
                        <Droplets className="h-3 w-3" />
                        {t.water}
                      </Badge>
                    )}
                    {unit.includedServices.electricity && (
                      <Badge variant="secondary" className="gap-1">
                        <Zap className="h-3 w-3" />
                        {t.electricity}
                      </Badge>
                    )}
                    {unit.includedServices.internet && (
                      <Badge variant="secondary" className="gap-1">
                        <Wifi className="h-3 w-3" />
                        {t.internet}
                      </Badge>
                    )}
                    {unit.includedServices.gas && (
                      <Badge variant="secondary" className="gap-1">
                        <Flame className="h-3 w-3" />
                        {t.gas}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {unit.amenities && unit.amenities.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{t.amenities}</h3>
                  <div className="flex flex-wrap gap-2">
                    {unit.amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline" className="gap-1">
                        <Check className="h-3 w-3" />
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        
        <div className="border-t px-6 py-4 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-preview">
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
