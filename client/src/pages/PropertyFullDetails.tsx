import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
  Waves, UtensilsCrossed, Dog, Wind, Snowflake, TrendingUp, StickyNote, Trash2
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
  const [, params] = useRoute("/propiedad/:id/completo");
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

  const user = authUser || adminUser;
  const isAdminOrSeller = user?.role === "admin" || user?.role === "seller" || user?.role === "master";

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ["/api/properties", params?.id],
    enabled: !!params?.id,
  });

  const { data: notes = [], isLoading: notesLoading } = useQuery<PropertyNote[]>({
    queryKey: ["/api/property-notes", params?.id],
    enabled: !!params?.id && isAdminOrSeller,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest(`/api/property-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: params?.id,
          content,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-notes", params?.id] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/property-notes", params?.id] });
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

  if (isLoading || !property) {
    return (
      <div className="container mx-auto py-6">
        <Card className="animate-pulse">
          <div className="h-96 bg-muted" />
          <CardContent className="py-6">
            <div className="h-8 bg-muted rounded w-3/4 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }


  const allImages = property.primaryImages || [];
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/buscar-propiedades')}
            data-testid="button-back-to-search"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a búsqueda
          </Button>
        </div>
      </div>

      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <Card>
              <div className="relative">
                {allImages.length > 0 ? (
                  <div className="space-y-4">
                    <div 
                      className="h-[500px] bg-muted relative overflow-hidden rounded-t-lg"
                      data-testid="div-main-image"
                    >
                      <img
                        src={allImages[mainImageIndex]}
                        alt={getPropertyTitle(property)}
                        className="w-full h-full object-cover"
                        data-testid="img-main-property"
                      />
                      {property.featured && (
                        <Badge className="absolute top-4 right-4 bg-primary">Destacada</Badge>
                      )}
                    </div>
                    {allImages.length > 1 && (
                      <div className="px-6 pb-6">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrevThumbnails}
                            disabled={thumbnailStartIndex === 0}
                            className="flex-shrink-0"
                            data-testid="button-prev-thumbnails"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="grid grid-cols-4 gap-3 flex-1">
                            {allImages.slice(thumbnailStartIndex, thumbnailStartIndex + VISIBLE_THUMBNAILS).map((img, idx) => {
                              const actualIndex = thumbnailStartIndex + idx;
                              return (
                                <div 
                                  key={actualIndex} 
                                  className={`h-28 bg-muted rounded-lg overflow-hidden cursor-pointer transition-all ${
                                    actualIndex === mainImageIndex 
                                      ? 'ring-2 ring-primary ring-offset-2' 
                                      : 'hover-elevate active-elevate-2'
                                  }`}
                                  onClick={() => handleThumbnailClick(actualIndex)}
                                  data-testid={`div-gallery-thumb-${actualIndex}`}
                                >
                                  <img 
                                    src={img} 
                                    alt={`Vista ${actualIndex + 1}`} 
                                    className="w-full h-full object-cover" 
                                    data-testid={`img-gallery-${actualIndex}`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNextThumbnails}
                            disabled={thumbnailStartIndex >= allImages.length - VISIBLE_THUMBNAILS}
                            className="flex-shrink-0"
                            data-testid="button-next-thumbnails"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[500px] bg-muted flex items-center justify-center rounded-t-lg">
                    <MapPin className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Media Options Buttons */}
              <div className="grid grid-cols-4 gap-3 px-6 py-4 border-b">
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-3"
                  onClick={() => allImages.length > 0 && setShowAllPhotosDialog(true)}
                  disabled={allImages.length === 0}
                  data-testid="button-view-images"
                >
                  <Image className="h-5 w-5" />
                  <span className="text-xs">Imágenes ({allImages.length})</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-3"
                  disabled={!property.videos || property.videos.length === 0}
                  data-testid="button-view-video"
                >
                  <Video className="h-5 w-5" />
                  <span className="text-xs">Video</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-3"
                  disabled={!property.googleMapsUrl}
                  onClick={() => property.googleMapsUrl && window.open(property.googleMapsUrl, '_blank')}
                  data-testid="button-view-location"
                >
                  <Map className="h-5 w-5" />
                  <span className="text-xs">Ubicación</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-3"
                  disabled={!property.virtualTourUrl}
                  data-testid="button-view-tour360"
                >
                  <Scan className="h-5 w-5" />
                  <span className="text-xs">Tour 360</span>
                </Button>
              </div>

              <CardContent className="py-6">
                <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-property-title">
                  {getPropertyTitle(property)}
                </h1>
                
                {/* Price and Location Info */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {property.price && (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary" data-testid="text-property-price">
                        {formatPrice(property.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {property.status === "rent" ? "/mes" : property.status === "sale" ? "" : "/mes o venta"}
                      </span>
                    </div>
                  )}
                  {property.condoName && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm" data-testid="text-condo-info">
                        {property.condoName}
                        {property.unitNumber && ` - Unidad ${property.unitNumber}`}
                      </span>
                    </div>
                  )}
                  {!property.condoName && getPropertyTitle(property) && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm" data-testid="text-house-name">Casa</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                  <MapPin className="h-5 w-5" />
                  <span className="text-lg" data-testid="text-property-location">{property.location}</span>
                </div>

                {property.description && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h2 className="text-xl font-semibold mb-3">Descripción</h2>
                      <p className="text-muted-foreground leading-relaxed" data-testid="text-property-description">
                        {property.description}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Características y Detalles */}
            <Card>
              <CardHeader>
                <CardTitle>Características y Detalles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Bed className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Recámaras</div>
                      <div className="text-lg font-semibold" data-testid="text-bedrooms">{property.bedrooms}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Bath className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Baños</div>
                      <div className="text-lg font-semibold" data-testid="text-bathrooms">{property.bathrooms}</div>
                    </div>
                  </div>
                  {property.area && (
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Square className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Área</div>
                        <div className="text-lg font-semibold" data-testid="text-area">{property.area} m²</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Building className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tipo</div>
                      <div className="text-lg font-semibold capitalize" data-testid="text-property-type">{property.propertyType}</div>
                    </div>
                  </div>
                  {property.petFriendly && (
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Home className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Mascotas</div>
                        <div className="text-lg font-semibold">Permitidas</div>
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
              </CardContent>
            </Card>

            {/* Amenidades del Condominio */}
            {property.amenities && property.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Amenidades del Condominio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, index) => {
                      const AmenityIcon = getAmenityIcon(amenity);
                      return (
                        <div 
                          key={index} 
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover-elevate"
                          data-testid={`amenity-${index}`}
                        >
                          <AmenityIcon className="h-5 w-5 text-primary" />
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ubicación en Mapa */}
            {(property.latitude && property.longitude) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Ubicación Aproximada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
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
                  <p className="text-sm text-muted-foreground mt-3">
                    La ubicación exacta se compartirá después de confirmar la cita
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Price and CTA */}
              <Card>
              <CardHeader>
                <CardTitle>Información del precio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-bold text-primary" data-testid="text-property-price">
                  {formatPrice(property.price)}
                  {(property.status === "rent" || property.status === "both") && (
                    <span className="text-lg font-normal text-muted-foreground">/mes</span>
                  )}
                </div>
                
                {property.rating && parseFloat(property.rating) > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-medium">{property.rating}</span>
                    {property.reviewCount && (
                      <span className="text-sm text-muted-foreground">
                        ({property.reviewCount} reseñas)
                      </span>
                    )}
                  </div>
                )}

                <Separator />

                <Button 
                  className="w-full" 
                  size="lg" 
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
                  Coordinar cita
                </Button>

                <Button variant="outline" className="w-full" data-testid="button-add-to-favorites">
                  <Heart className="h-4 w-4 mr-2" />
                  Guardar en favoritos
                </Button>
              </CardContent>
            </Card>

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

            {/* Referral Information - Admin Only */}
            {adminUser && (property.referredByName || property.referredByLastName || property.referredByPhone || property.referredByEmail || property.referralPercent) && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Referido (Solo Admin)
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
            <DialogTitle>Todas las Imágenes ({allImages.length})</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {allImages.map((img, index) => (
                <div
                  key={index}
                  className={`relative cursor-pointer transition-all ${
                    expandedImageIndex === index 
                      ? 'col-span-2 row-span-2' 
                      : 'aspect-square'
                  }`}
                  onClick={() => toggleImageExpansion(index)}
                  data-testid={`photo-grid-item-${index}`}
                >
                  <img
                    src={img}
                    alt={`Imagen ${index + 1}`}
                    className={`w-full h-full object-cover rounded-lg ${
                      expandedImageIndex === index 
                        ? 'ring-2 ring-primary' 
                        : 'hover-elevate'
                    }`}
                  />
                  {expandedImageIndex === index && (
                    <div className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
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
