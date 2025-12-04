import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Heart, MapPin, Bed, Bath, Square, Star, ArrowLeft, Calendar, 
  User, Phone, Mail, Building, Image, Video, Map, Scan,
  CheckCircle2, XCircle, Home, Wifi, Droplets, Zap, Flame, Wrench,
  ChevronLeft, ChevronRight, X, Dumbbell, Trees, Car, Shield,
  Waves, UtensilsCrossed, Dog, Wind, Snowflake, TrendingUp, StickyNote, Trash2,
  Download, Copy, Archive, Share2, MessageCircle, AlertCircle, Loader2
} from "lucide-react";
import { type Property } from "@shared/schema";
import { AppointmentSchedulingDialog } from "@/components/AppointmentSchedulingDialog";
import { AuthRequiredDialog } from "@/components/AuthRequiredDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getPropertyTitle } from "@/lib/propertyHelpers";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import JSZip from "jszip";
import { LanguageToggle } from "@/components/LanguageToggle";

interface PropertyNote {
  id: string;
  propertyId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    profileImageUrl: string | null;
  };
}

export default function PropertyFullDetails() {
  const [matchId, paramsId] = useRoute("/propiedad/:id/completo");
  const [matchSlug, paramsSlug] = useRoute("/p/:slug");
  const [, setLocation] = useLocation();
  const { isAuthenticated, user: authUser, adminUser } = useAuth();
  const { toast } = useToast();
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showAllPhotosDialog, setShowAllPhotosDialog] = useState(false);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState("");

  const isSlugRoute = matchSlug && paramsSlug?.slug;
  const propertyIdentifier = isSlugRoute ? paramsSlug?.slug : paramsId?.id;
  
  const user = authUser || adminUser;
  const isAdminOrSeller = user?.role === "admin" || user?.role === "seller" || user?.role === "master";

  const { data: property, isLoading, error: propertyError } = useQuery<Property>({
    queryKey: isSlugRoute ? ["/api/properties/by-slug", propertyIdentifier] : ["/api/properties", propertyIdentifier],
    enabled: !!propertyIdentifier,
    retry: false,
  });

  const { data: notes = [], isLoading: notesLoading } = useQuery<PropertyNote[]>({
    queryKey: ["/api/property-notes", property?.id],
    enabled: !!property?.id && isAdminOrSeller,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest(`/api/property-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property?.id,
          content,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-notes", property?.id] });
      setNoteContent("");
      toast({
        title: "Nota agregada",
        description: "La nota interna ha sido agregada exitosamente",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar la nota",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return await apiRequest(`/api/property-notes/${noteId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-notes", property?.id] });
      toast({
        title: "Nota eliminada",
        description: "La nota interna ha sido eliminada",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la nota",
      });
    },
  });

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  // Parse included services from jsonb
  const getServiceLabel = (key: string) => {
    const labels: Record<string, string> = {
      water: "Agua",
      internet: "Internet",
      maintenance: "Mantenimiento",
      electricity: "Luz",
      gas: "Gas",
      parking: "Estacionamiento",
      security: "Seguridad 24/7",
      cleaning: "Limpieza",
      cable: "TV por cable"
    };
    return labels[key] || key;
  };

  const getServiceIcon = (key: string) => {
    const icons: Record<string, any> = {
      water: Droplets,
      internet: Wifi,
      maintenance: Wrench,
      electricity: Zap,
      gas: Flame,
      parking: Home,
      security: Home,
      cleaning: Home,
      cable: Home
    };
    const Icon = icons[key] || Home;
    return <Icon className="h-4 w-4" />;
  };

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    const icons: Record<string, any> = {
      gimnasio: Dumbbell,
      gym: Dumbbell,
      piscina: Waves,
      alberca: Waves,
      pool: Waves,
      estacionamiento: Car,
      parking: Car,
      seguridad: Shield,
      security: Shield,
      'seguridad 24/7': Shield,
      jardin: Trees,
      jardín: Trees,
      garden: Trees,
      área_verde: Trees,
      asador: Flame,
      parrilla: Flame,
      bbq: Flame,
      grill: Flame,
      terraza: Home,
      roof: Home,
      rooftop: Home,
      mascotas: Dog,
      pets: Dog,
      aire_acondicionado: Snowflake,
      'aire acondicionado': Snowflake,
      ac: Snowflake,
      ventilador: Wind,
      fan: Wind,
      comedor: UtensilsCrossed,
      cocina: UtensilsCrossed,
      kitchen: UtensilsCrossed,
    };
    
    for (const [key, Icon] of Object.entries(icons)) {
      if (amenityLower.includes(key)) {
        return Icon;
      }
    }
    return Star;
  };

  // Loading state - using skeleton layout for property details page
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" data-testid="container-loading-property">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
              <div className="h-9 w-9 rounded-full bg-foreground flex items-center justify-center">
                <Home className="h-4 w-4 text-background" />
              </div>
              <span className="font-semibold text-lg hidden sm:block">homes</span>
            </div>
          </div>
        </header>
        <div className="container mx-auto py-6 px-4">
          <div className="flex items-center gap-2 mb-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" data-testid="spinner-loading-property" />
            <span className="text-muted-foreground" data-testid="text-loading-message">Cargando propiedad...</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="aspect-[16/10] rounded-2xl" data-testid="skeleton-main-image" />
              <div className="flex gap-2">
                <Skeleton className="h-20 flex-1 rounded-xl" />
                <Skeleton className="h-20 flex-1 rounded-xl" />
                <Skeleton className="h-20 flex-1 rounded-xl" />
                <Skeleton className="h-20 flex-1 rounded-xl" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 rounded-2xl" data-testid="skeleton-info-card" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - property not found
  if (propertyError || !property) {
    return (
      <div className="min-h-screen bg-background" data-testid="container-error-property">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
              <div className="h-9 w-9 rounded-full bg-foreground flex items-center justify-center">
                <Home className="h-4 w-4 text-background" />
              </div>
              <span className="font-semibold text-lg hidden sm:block">homes</span>
            </div>
          </div>
        </header>
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full" data-testid="card-error-property">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive" data-testid="icon-error" />
                <h2 className="text-xl font-semibold text-center" data-testid="text-error-title">Propiedad no encontrada</h2>
                <p className="text-muted-foreground text-center" data-testid="text-error-description">
                  {(propertyError as any)?.message || 
                    "Esta propiedad no existe o ya no está disponible."}
                </p>
                <Button onClick={() => setLocation("/")} data-testid="button-go-home">
                  Ver todas las propiedades
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  // Consolidate ALL images from all arrays
  const allImages = [
    ...(property.primaryImages || []),
    ...(property.secondaryImages || []),
    ...(property.images || [])
  ].filter((img, index, self) => img && self.indexOf(img) === index); // Remove duplicates and empty strings
  
  const VISIBLE_THUMBNAILS = 4;

  const handleThumbnailClick = (index: number) => {
    setMainImageIndex(index);
  };

  const handlePrevThumbnails = () => {
    if (thumbnailStartIndex > 0) {
      setThumbnailStartIndex(thumbnailStartIndex - 1);
    }
  };

  const handleNextThumbnails = () => {
    if (thumbnailStartIndex < allImages.length - VISIBLE_THUMBNAILS) {
      setThumbnailStartIndex(thumbnailStartIndex + 1);
    }
  };

  const toggleImageExpansion = (index: number) => {
    setExpandedImageIndex(expandedImageIndex === index ? null : index);
  };

  // Download single image
  const handleDownloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${getPropertyTitle(property)}-foto-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Foto descargada",
        description: `Foto ${index + 1} descargada exitosamente`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo descargar la foto",
      });
    }
  };

  // Copy image URL to clipboard
  const handleCopyImageUrl = async (imageUrl: string, index: number) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      toast({
        title: "URL copiada",
        description: `URL de la foto ${index + 1} copiada al portapapeles`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo copiar la URL al portapapeles",
      });
    }
  };

  // Download all images as ZIP
  const handleDownloadAllImages = async () => {
    try {
      toast({
        title: "Preparando descarga",
        description: "Empaquetando todas las fotos...",
      });

      const zip = new JSZip();
      const imageFolder = zip.folder("fotos");

      // Download all images
      for (let i = 0; i < allImages.length; i++) {
        const response = await fetch(allImages[i]);
        const blob = await response.blob();
        imageFolder?.file(`foto-${i + 1}.jpg`, blob);
      }

      // Generate ZIP file
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${getPropertyTitle(property)}-fotos.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Descarga completa",
        description: `${allImages.length} fotos descargadas en ZIP`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron descargar las fotos",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimalist Header */}
      {!isAuthenticated && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => setLocation("/")}
            >
              <div className="h-9 w-9 rounded-full bg-foreground flex items-center justify-center">
                <Home className="h-4 w-4 text-background" />
              </div>
              <span className="font-semibold text-lg hidden sm:block">homes</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <LanguageToggle />
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs sm:text-sm"
                onClick={() => setLocation("/login")}
                data-testid="button-login"
              >
                Entrar
              </Button>
              <Button
                size="sm"
                className="rounded-full text-xs sm:text-sm"
                onClick={() => setLocation("/register")}
                data-testid="button-register"
              >
                Registro
              </Button>
            </div>
          </div>
        </header>
      )}

      <div className="container mx-auto py-4 sm:py-6 px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => setLocation('/buscar-propiedades')}
          data-testid="button-back-to-search"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery - Minimalist */}
            <div className="rounded-2xl overflow-hidden border bg-card">
              <div className="relative">
                {allImages.length > 0 ? (
                  <div>
                    <div 
                      className="aspect-[16/10] bg-muted relative overflow-hidden"
                      data-testid="div-main-image"
                    >
                      <img
                        src={allImages[mainImageIndex]}
                        alt={getPropertyTitle(property)}
                        className="w-full h-full object-cover"
                        data-testid="img-main-property"
                      />
                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className="bg-foreground text-background rounded-full text-xs px-3">
                          {property.status === "rent" ? "Renta" : property.status === "sale" ? "Venta" : "Renta/Venta"}
                        </Badge>
                        {property.featured && (
                          <Badge className="bg-primary rounded-full text-xs px-3">Destacada</Badge>
                        )}
                      </div>
                      {/* Favorite & Share Buttons */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          className="min-h-[44px] min-w-[44px] rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                          onClick={() => {
                            navigator.share?.({
                              title: getPropertyTitle(property),
                              url: window.location.href,
                            }).catch(() => {
                              navigator.clipboard.writeText(window.location.href);
                              toast({ title: "Enlace copiado" });
                            });
                          }}
                          data-testid="button-share"
                        >
                          <Share2 className="h-5 w-5" />
                        </button>
                        <button
                          className="min-h-[44px] min-w-[44px] rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                          data-testid="button-favorite"
                        >
                          <Heart className="h-5 w-5" />
                        </button>
                      </div>
                      {/* Photo Count Badge */}
                      <button 
                        className="absolute bottom-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur rounded-full px-4 min-h-[44px] text-sm font-medium hover:bg-background transition-colors"
                        onClick={() => setShowAllPhotosDialog(true)}
                        data-testid="button-view-all-photos"
                      >
                        <Image className="h-4 w-4" />
                        Ver {allImages.length} fotos
                      </button>
                      {/* Navigation Arrows */}
                      {allImages.length > 1 && (
                        <>
                          <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                            onClick={() => setMainImageIndex(mainImageIndex === 0 ? allImages.length - 1 : mainImageIndex - 1)}
                            data-testid="button-prev-image"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                            onClick={() => setMainImageIndex(mainImageIndex === allImages.length - 1 ? 0 : mainImageIndex + 1)}
                            data-testid="button-next-image"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                    {/* Thumbnail Strip */}
                    {allImages.length > 1 && (
                      <div className="p-3 sm:p-4 border-t">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {allImages.slice(0, 6).map((img, idx) => (
                            <div 
                              key={idx} 
                              className={`h-16 w-20 sm:h-20 sm:w-24 shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all ${
                                idx === mainImageIndex 
                                  ? 'ring-2 ring-foreground ring-offset-2' 
                                  : 'opacity-70 hover:opacity-100'
                              }`}
                              onClick={() => handleThumbnailClick(idx)}
                              data-testid={`div-gallery-thumb-${idx}`}
                            >
                              <img 
                                src={img} 
                                alt={`Vista ${idx + 1}`} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                          ))}
                          {allImages.length > 6 && (
                            <button
                              className="h-16 w-20 sm:h-20 sm:w-24 shrink-0 rounded-xl bg-muted flex items-center justify-center text-sm font-medium hover:bg-muted/80 transition-colors"
                              onClick={() => setShowAllPhotosDialog(true)}
                            >
                              +{allImages.length - 6}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-muted flex items-center justify-center">
                    <Building className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Quick Action Buttons - Minimalist */}
              <div className="flex flex-wrap gap-2 p-3 sm:p-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs gap-1.5"
                  onClick={() => allImages.length > 0 && setShowAllPhotosDialog(true)}
                  disabled={allImages.length === 0}
                  data-testid="button-view-images"
                >
                  <Image className="h-3.5 w-3.5" />
                  Fotos
                </Button>
                {property.videos && property.videos.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs gap-1.5"
                    data-testid="button-view-video"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Video
                  </Button>
                )}
                {property.googleMapsUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs gap-1.5"
                    onClick={() => window.open(property.googleMapsUrl!, '_blank')}
                    data-testid="button-view-location"
                  >
                    <Map className="h-3.5 w-3.5" />
                    Mapa
                  </Button>
                )}
                {property.virtualTourUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs gap-1.5"
                    onClick={() => window.open(property.virtualTourUrl!, '_blank')}
                    data-testid="button-view-tour360"
                  >
                    <Scan className="h-3.5 w-3.5" />
                    Tour 360
                  </Button>
                )}
                {isAdminOrSeller && allImages.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs gap-1.5"
                    onClick={handleDownloadAllImages}
                    data-testid="button-download-all"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    ZIP
                  </Button>
                )}
              </div>

              {/* Property Info - Minimalist */}
              <div className="p-4 sm:p-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2" data-testid="text-property-title">
                  {getPropertyTitle(property)}
                </h1>
                
                <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="text-sm sm:text-base" data-testid="text-property-location">{property.location}</span>
                </div>

                {/* Price */}
                {property.price && (
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl sm:text-3xl font-bold" data-testid="text-property-price">
                      ${parseFloat(property.price).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      USD {property.status === "rent" ? "/mes" : ""}
                    </span>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4 sm:gap-6 py-4 border-t border-b">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium" data-testid="text-bedrooms">{property.bedrooms}</span>
                    <span className="text-sm text-muted-foreground">Recámaras</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium" data-testid="text-bathrooms">{property.bathrooms}</span>
                    <span className="text-sm text-muted-foreground">Baños</span>
                  </div>
                  {property.area && (
                    <div className="flex items-center gap-2">
                      <Square className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium" data-testid="text-area">{property.area}</span>
                      <span className="text-sm text-muted-foreground">m²</span>
                    </div>
                  )}
                  {property.rating && (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-5 w-5 fill-foreground" />
                      <span className="font-medium">{property.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {property.description && (
                  <div className="pt-4">
                    <h2 className="text-lg font-semibold mb-2">Acerca de esta propiedad</h2>
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed" data-testid="text-property-description">
                      {property.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Características y Detalles - Minimalist */}
            <div className="rounded-2xl border bg-card p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Detalles de la propiedad</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Bed className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{property.bedrooms}</div>
                    <div className="text-xs text-muted-foreground">Recámaras</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Bath className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{property.bathrooms}</div>
                    <div className="text-xs text-muted-foreground">Baños</div>
                  </div>
                </div>
                {property.area && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Square className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{property.area} m²</div>
                      <div className="text-xs text-muted-foreground">Área</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium capitalize">{property.propertyType}</div>
                    <div className="text-xs text-muted-foreground">Tipo</div>
                  </div>
                </div>
                {property.petFriendly && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Dog className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Permitidas</div>
                      <div className="text-xs text-muted-foreground">Mascotas</div>
                    </div>
                  </div>
                )}
              </div>

                {(property.availableFrom || property.availableTo) && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Disponibilidad
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {property.availableFrom && (
                          <div>
                            <span className="text-sm text-muted-foreground">Desde:</span>
                            <div className="font-medium" data-testid="text-available-from">
                              {new Date(property.availableFrom).toLocaleDateString("es-MX", {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        )}
                        {property.availableTo && (
                          <div>
                            <span className="text-sm text-muted-foreground">Hasta:</span>
                            <div className="font-medium" data-testid="text-available-to">
                              {new Date(property.availableTo).toLocaleDateString("es-MX", {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
            </div>

            {/* Amenidades - Minimalist */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="rounded-2xl border bg-card p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-4">Amenidades</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => {
                    const AmenityIcon = getAmenityIcon(amenity);
                    return (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="rounded-full px-3 py-1.5 text-xs gap-1.5"
                        data-testid={`amenity-${index}`}
                      >
                        <AmenityIcon className="h-3.5 w-3.5" />
                        {amenity}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ubicación - Minimalist */}
            {(property.latitude && property.longitude) && (
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="aspect-video bg-muted">
                  <iframe
                    src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&hl=es&z=14&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    data-testid="iframe-map"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">
                    La ubicación exacta se compartirá después de confirmar la cita
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Minimalist */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Contact Card */}
              <div className="rounded-2xl border bg-card p-5 space-y-4">
                {/* Price */}
                <div>
                  <div className="text-2xl sm:text-3xl font-bold" data-testid="text-sidebar-price">
                    ${parseFloat(property.price).toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      USD{(property.status === "rent" || property.status === "both") ? "/mes" : ""}
                    </span>
                  </div>
                  {property.rating && parseFloat(property.rating) > 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Star className="h-4 w-4 fill-foreground" />
                      <span className="text-sm font-medium">{property.rating}</span>
                      {property.reviewCount && (
                        <span className="text-xs text-muted-foreground">
                          ({property.reviewCount} reseñas)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* CTA Buttons */}
                <Button 
                  className="w-full rounded-xl h-12" 
                  onClick={() => {
                    if (!isAuthenticated) {
                      setShowAuthDialog(true);
                      return;
                    }
                    setShowAppointmentDialog(true);
                  }}
                  data-testid="button-request-opportunity"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar visita
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full rounded-xl h-12" 
                  onClick={() => {
                    const message = `Hola, me interesa la propiedad ${getPropertyTitle(property)} en ${property.location}. ¿Podrían darme más información?`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  data-testid="button-whatsapp"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Consultar por WhatsApp
                </Button>

                <Button 
                  variant="ghost" 
                  className="w-full rounded-xl" 
                  data-testid="button-add-to-favorites"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>

            {/* Services Section */}
            <Card>
              <CardHeader>
                <CardTitle>Servicios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Included Services */}
                {property.includedServices?.basicServices && (
                  Object.entries(property.includedServices.basicServices).some(
                    ([_, service]: [string, any]) => service?.included
                  ) && (
                    <div>
                      <h4 className="font-semibold text-sm mb-3 text-green-600 dark:text-green-400">
                        Incluidos en la renta
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(property.includedServices.basicServices).map(([key, service]: [string, any]) => {
                          if (!service?.included) return null;
                          const Icon = key === 'water' ? Droplets : key === 'electricity' ? Zap : key === 'internet' ? Wifi : Home;
                          return (
                            <div key={key} className="flex items-center gap-2 text-sm">
                              <Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span>{getServiceLabel(key)}</span>
                              {key === 'internet' && service.speed && (
                                <span className="text-xs text-muted-foreground">({service.speed})</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}

                {/* Not Included Services */}
                {property.includedServices?.basicServices && (
                  Object.entries(property.includedServices.basicServices).some(
                    ([_, service]: [string, any]) => service && !service.included
                  ) && (
                    <div>
                      <h4 className="font-semibold text-sm mb-3 text-orange-600 dark:text-orange-400">
                        No incluidos (pago directo)
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(property.includedServices.basicServices).map(([key, service]: [string, any]) => {
                          if (!service || service.included) return null;
                          const Icon = key === 'water' ? Droplets : key === 'electricity' ? Zap : key === 'internet' ? Wifi : Home;
                          return (
                            <div key={key} className="flex items-start gap-2 text-sm">
                              <Icon className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                              <div className="flex-1">
                                <div className="font-medium">{getServiceLabel(key)}</div>
                                {key === 'internet' && service.speed && (
                                  <div className="text-xs text-muted-foreground">Velocidad: {service.speed}</div>
                                )}
                                {service.provider && (
                                  <div className="text-xs text-muted-foreground">Proveedor: {service.provider}</div>
                                )}
                                {service.cost && (
                                  <div className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                                    Estimado: ${service.cost} MXN/mes
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}

                {/* Additional Services */}
                {property.includedServices?.additionalServices && property.includedServices.additionalServices.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-blue-600 dark:text-blue-400">
                      Servicios adicionales
                    </h4>
                    <div className="space-y-2">
                      {property.includedServices.additionalServices.map((service: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Wrench className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium capitalize">{service.type.replace('_', ' ')}</div>
                            {service.provider && (
                              <div className="text-xs text-muted-foreground">Proveedor: {service.provider}</div>
                            )}
                            {service.cost && (
                              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                ${service.cost} MXN/mes
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner Information - Admin/Seller Only */}
            {isAdminOrSeller && (property.ownerFirstName || property.ownerLastName || property.ownerPhone || property.ownerEmail) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Propietario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {(property.ownerFirstName || property.ownerLastName) && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground mb-1">Nombre Completo</div>
                          <div className="font-medium">
                            {[property.ownerFirstName, property.ownerLastName].filter(Boolean).join(' ')}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText([property.ownerFirstName, property.ownerLastName].filter(Boolean).join(' '));
                            toast({ title: "Copiado", description: "Nombre copiado al portapapeles" });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {property.ownerPhone && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground mb-1">Teléfono WhatsApp</div>
                          <div className="font-medium flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {property.ownerPhone}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(property.ownerPhone!);
                              toast({ title: "Copiado", description: "Teléfono copiado al portapapeles" });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => window.open(`https://wa.me/${property.ownerPhone?.replace(/\D/g, '')}`, '_blank')}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {property.ownerEmail && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground mb-1">Email</div>
                          <div className="font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {property.ownerEmail}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(property.ownerEmail!);
                              toast({ title: "Copiado", description: "Email copiado al portapapeles" });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => window.open(`mailto:${property.ownerEmail}`, '_blank')}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Details - Admin/Seller Only */}
            {isAdminOrSeller && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Detalles Completos de la Propiedad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">ID de Propiedad</div>
                      <div className="font-mono text-sm">{property.id}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Estado de Aprobación</div>
                      <Badge variant={property.approvalStatus === 'approved' ? 'default' : 'secondary'}>
                        {property.approvalStatus}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Tipo de Unidad</div>
                      <div className="font-medium capitalize">{property.unitType}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Moneda</div>
                      <div className="font-medium">{property.currency}</div>
                    </div>
                    {property.salePrice && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Precio de Venta</div>
                        <div className="font-medium">{formatPrice(property.salePrice)}</div>
                      </div>
                    )}
                    {property.acceptedLeaseDurations && property.acceptedLeaseDurations.length > 0 && (
                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground mb-2">Duraciones de Contrato Aceptadas</div>
                        <div className="flex flex-wrap gap-2">
                          {property.acceptedLeaseDurations.map((duration, idx) => (
                            <Badge key={idx} variant="outline">{duration}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {property.accessInfo && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h4 className="font-semibold mb-3 text-sm">Información de Acceso</h4>
                        <div className="space-y-2 text-sm">
                          {(property.accessInfo as any).lockboxCode && (
                            <div className="flex items-center justify-between p-2 rounded bg-muted">
                              <span>Código de Lockbox:</span>
                              <div className="flex items-center gap-2">
                                <code className="font-mono">{(property.accessInfo as any).lockboxCode}</code>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    navigator.clipboard.writeText((property.accessInfo as any).lockboxCode);
                                    toast({ title: "Copiado", description: "Código copiado" });
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          {(property.accessInfo as any).contactPerson && (
                            <div className="flex items-center justify-between p-2 rounded bg-muted">
                              <span>Persona de Contacto:</span>
                              <span className="font-medium">{(property.accessInfo as any).contactPerson}</span>
                            </div>
                          )}
                          {(property.accessInfo as any).contactPhone && (
                            <div className="flex items-center justify-between p-2 rounded bg-muted">
                              <span>Teléfono de Contacto:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{(property.accessInfo as any).contactPhone}</span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    navigator.clipboard.writeText((property.accessInfo as any).contactPhone);
                                    toast({ title: "Copiado", description: "Teléfono copiado" });
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {property.specifications && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h4 className="font-semibold mb-3 text-sm">Especificaciones Técnicas</h4>
                        <div className="text-sm bg-muted p-3 rounded font-mono whitespace-pre-wrap">
                          {JSON.stringify(property.specifications, null, 2)}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Referral Information - Admin Only */}
            {adminUser && (property.referredByName || property.referredByLastName || property.referredByPhone || property.referredByEmail || property.referralPercent) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Información del Referido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(property.referredByName || property.referredByLastName) && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Nombre Completo</div>
                        <div className="font-medium">
                          {[property.referredByName, property.referredByLastName].filter(Boolean).join(' ')}
                        </div>
                      </div>
                    )}
                    {property.referredByPhone && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Teléfono</div>
                        <div className="font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {property.referredByPhone}
                        </div>
                      </div>
                    )}
                    {property.referredByEmail && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Email</div>
                        <div className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {property.referredByEmail}
                        </div>
                      </div>
                    )}
                    {property.referralPercent && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Porcentaje de Comisión</div>
                        <div className="font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          {property.referralPercent}%
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Internal Notes - Admin/Seller Only */}
            {isAdminOrSeller && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StickyNote className="h-5 w-5" />
                    Anotaciones Internas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Agregar nota interna..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="min-h-[100px]"
                      data-testid="input-note-content"
                    />
                    <Button
                      onClick={() => createNoteMutation.mutate(noteContent)}
                      disabled={!noteContent.trim() || createNoteMutation.isPending}
                      data-testid="button-add-note"
                    >
                      Agregar Nota
                    </Button>
                  </div>

                  {notesLoading ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Cargando notas...
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay anotaciones internas para esta propiedad
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <Card key={note.id} className="bg-muted/50">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {note.author?.firstName && note.author?.lastName
                                      ? `${note.author.firstName} ${note.author.lastName}`
                                      : note.author?.email || "Usuario desconocido"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(note.createdAt), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteNoteMutation.mutate(note.id)}
                                disabled={deleteNoteMutation.isPending}
                                data-testid={`button-delete-note-${note.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* All Photos Dialog (Grid View) */}
      <Dialog open={showAllPhotosDialog} onOpenChange={setShowAllPhotosDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="dialog-all-photos">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Todas las Imágenes ({allImages.length})</span>
              {isAdminOrSeller && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAllImages}
                  className="gap-2"
                  data-testid="button-download-all-zip"
                >
                  <Archive className="h-4 w-4" />
                  Descargar Todo (ZIP)
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {allImages.map((img, index) => (
                <div
                  key={index}
                  className={`relative group transition-all ${
                    expandedImageIndex === index 
                      ? 'col-span-2 row-span-2' 
                      : 'aspect-square'
                  }`}
                  data-testid={`photo-grid-item-${index}`}
                >
                  <img
                    src={img}
                    alt={`Imagen ${index + 1}`}
                    className={`w-full h-full object-cover rounded-lg ${
                      expandedImageIndex === index 
                        ? 'ring-2 ring-primary' 
                        : 'hover-elevate cursor-pointer'
                    }`}
                    onClick={() => toggleImageExpansion(index)}
                  />
                  
                  {/* Action Buttons for Admin/Seller */}
                  {isAdminOrSeller && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadImage(img, index);
                        }}
                        data-testid={`button-download-image-${index}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyImageUrl(img, index);
                        }}
                        data-testid={`button-copy-url-${index}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Image Number Badge */}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Foto {index + 1}
                  </div>
                  
                  {expandedImageIndex === index && (
                    <div 
                      className="absolute top-2 left-2 bg-black/50 text-white rounded-full p-1 cursor-pointer"
                      onClick={() => toggleImageExpansion(index)}
                    >
                      <X className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {property && (
        <AppointmentSchedulingDialog
          open={showAppointmentDialog}
          onOpenChange={setShowAppointmentDialog}
          property={property}
        />
      )}

      <AuthRequiredDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
    </div>
  );
}
