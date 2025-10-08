import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, MapPin, Bed, Bath, Square, Star, ArrowLeft, Calendar, 
  User, Phone, Mail, Building, Image, Video, Map, Scan,
  CheckCircle2, XCircle, Home, Wifi, Droplets, Zap, Flame, Wrench
} from "lucide-react";
import { type Property } from "@shared/schema";
import { RentalOpportunityRequestDialog } from "@/components/RentalOpportunityRequestDialog";
import { AuthRequiredDialog } from "@/components/AuthRequiredDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function PropertyFullDetails() {
  const [, params] = useRoute("/propiedad/:id/completo");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showSORDialog, setShowSORDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ["/api/properties", params?.id],
    enabled: !!params?.id,
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

  const includedServices = property?.includedServices 
    ? Object.entries(property.includedServices as Record<string, boolean>)
        .filter(([_, value]) => value === true)
        .map(([key]) => key)
    : [];

  const notIncludedServices = property?.includedServices 
    ? Object.entries(property.includedServices as Record<string, boolean>)
        .filter(([_, value]) => value === false)
        .map(([key]) => key)
    : [];

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
                {property.primaryImages && property.primaryImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-[500px] bg-muted relative overflow-hidden rounded-t-lg">
                      <img
                        src={property.primaryImages[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                        data-testid="img-main-property"
                      />
                      {property.featured && (
                        <Badge className="absolute top-4 right-4 bg-primary">Destacada</Badge>
                      )}
                    </div>
                    {property.primaryImages.length > 1 && (
                      <div className="grid grid-cols-4 gap-3 px-6 pb-6">
                        {property.primaryImages.slice(1, 5).map((img, idx) => (
                          <div key={idx} className="h-28 bg-muted rounded-lg overflow-hidden cursor-pointer hover-elevate active-elevate-2">
                            <img 
                              src={img} 
                              alt={`Vista ${idx + 2}`} 
                              className="w-full h-full object-cover" 
                              data-testid={`img-gallery-${idx}`}
                            />
                          </div>
                        ))}
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
                  data-testid="button-view-images"
                >
                  <Image className="h-5 w-5" />
                  <span className="text-xs">Imágenes</span>
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
                  {property.title}
                </h1>
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

            {/* Servicios Incluidos y No Incluidos */}
            {(includedServices.length > 0 || notIncludedServices.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Servicios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {includedServices.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-600 dark:text-green-500">
                        <CheckCircle2 className="h-5 w-5" />
                        Incluidos en la renta
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {includedServices.map((service) => (
                          <div 
                            key={service} 
                            className="flex items-center gap-2 p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                            data-testid={`service-included-${service}`}
                          >
                            {getServiceIcon(service)}
                            <span className="text-sm">{getServiceLabel(service)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {notIncludedServices.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-600 dark:text-red-500">
                        <XCircle className="h-5 w-5" />
                        No incluidos en la renta
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {notIncludedServices.map((service) => (
                          <div 
                            key={service} 
                            className="flex items-center gap-2 p-3 rounded-lg border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                            data-testid={`service-not-included-${service}`}
                          >
                            {getServiceIcon(service)}
                            <span className="text-sm">{getServiceLabel(service)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                    {property.amenities.map((amenity, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover-elevate"
                        data-testid={`amenity-${index}`}
                      >
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span>{amenity}</span>
                      </div>
                    ))}
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
          <div className="space-y-6">
            {/* Price and CTA */}
            <Card className="sticky top-6">
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

                {property.status === "rent" || property.status === "both" ? (
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={() => {
                      if (!isAuthenticated) {
                        setShowAuthDialog(true);
                        return;
                      }
                      setShowSORDialog(true);
                    }}
                    data-testid="button-request-opportunity"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Coordinar cita
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" data-testid="button-contact">
                    <Phone className="h-4 w-4 mr-2" />
                    Contactar
                  </Button>
                )}

                <Button variant="outline" className="w-full" data-testid="button-add-to-favorites">
                  <Heart className="h-4 w-4 mr-2" />
                  Guardar en favoritos
                </Button>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información rápida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Disponibilidad</span>
                  <Badge variant="secondary" data-testid="badge-status">
                    {property.status === "rent" ? "Renta" : property.status === "sale" ? "Venta" : "Renta/Venta"}
                  </Badge>
                </div>
                {property.condoName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Condominio</span>
                    <span className="font-medium text-sm" data-testid="text-condo-name">{property.condoName}</span>
                  </div>
                )}
                {property.colonyName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Colonia</span>
                    <span className="font-medium text-sm" data-testid="text-colony-name">{property.colonyName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ID Propiedad</span>
                  <span className="font-mono text-sm" data-testid="text-property-id">{property.id}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {property && (
        <RentalOpportunityRequestDialog
          open={showSORDialog}
          onOpenChange={setShowSORDialog}
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
