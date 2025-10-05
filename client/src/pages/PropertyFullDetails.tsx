import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, MapPin, Bed, Bath, Square, Star, ArrowLeft, Calendar, 
  User, Phone, Mail, Building, Image, Video, Map, Scan
} from "lucide-react";
import { type Property } from "@shared/schema";
import { RentalOpportunityRequestDialog } from "@/components/RentalOpportunityRequestDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function PropertyFullDetails() {
  const [, params] = useRoute("/propiedad/:id/completo");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showSORDialog, setShowSORDialog] = useState(false);

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
    <div className="container mx-auto py-6">
      <Button
        variant="ghost"
        onClick={() => setLocation(`/propiedad/${property.id}`)}
        className="mb-4"
        data-testid="button-back-to-details"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a vista general
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <div className="relative">
              {property.images && property.images.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-96 bg-muted relative overflow-hidden rounded-t-lg">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    {property.featured && (
                      <Badge className="absolute top-4 right-4">Destacada</Badge>
                    )}
                  </div>
                  {property.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2 px-4 pb-4">
                      {property.images.slice(1, 5).map((img, idx) => (
                        <div key={idx} className="h-24 bg-muted rounded-md overflow-hidden">
                          <img src={img} alt={`Vista ${idx + 2}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-96 bg-muted flex items-center justify-center rounded-t-lg">
                  <MapPin className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Media Options Buttons */}
            <div className="grid grid-cols-4 gap-2 px-4 py-4 border-b">
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
              <div className="mb-6">
                <h1 className="text-4xl font-bold mb-2">{property.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span className="text-lg">{property.location}</span>
                </div>
              </div>

              <Tabs defaultValue="description" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="description" className="flex-1">Descripción</TabsTrigger>
                  <TabsTrigger value="details" className="flex-1">Detalles</TabsTrigger>
                  <TabsTrigger value="amenities" className="flex-1">Amenidades</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="mt-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {property.description || "Sin descripción disponible"}
                  </p>
                </TabsContent>

                <TabsContent value="details" className="mt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Bed className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-sm text-muted-foreground">Recámaras</div>
                          <div className="font-semibold">{property.bedrooms}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Bath className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-sm text-muted-foreground">Baños</div>
                          <div className="font-semibold">{property.bathrooms}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Square className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-sm text-muted-foreground">Área</div>
                          <div className="font-semibold">{property.area} m²</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-sm text-muted-foreground">Estado</div>
                          <div className="font-semibold capitalize">{property.status}</div>
                        </div>
                      </div>
                    </div>

                    {(property.availableFrom || property.availableTo) && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Disponibilidad
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            {property.availableFrom && (
                              <div>
                                <span className="text-sm text-muted-foreground">Desde:</span>
                                <div className="font-medium">
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
                                <div className="font-medium">
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
                </TabsContent>

                <TabsContent value="amenities" className="mt-6">
                  {property.amenities && property.amenities.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {property.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 rounded-lg border">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No hay amenidades registradas</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del precio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-4">
                {formatPrice(property.price)}
              </div>
              {property.rating && parseFloat(property.rating) > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-medium">{property.rating}</span>
                  {property.reviewCount && (
                    <span className="text-sm text-muted-foreground">
                      ({property.reviewCount} reseñas)
                    </span>
                  )}
                </div>
              )}
              {property.status === "rent" || property.status === "both" ? (
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast({
                        title: "Inicia sesión para solicitar",
                        description: "Debes iniciar sesión para solicitar una oportunidad de renta",
                        variant: "destructive",
                      });
                      return;
                    }
                    setShowSORDialog(true);
                  }}
                  data-testid="button-request-opportunity"
                >
                  Solicitar Oportunidad de Renta
                </Button>
              ) : (
                <Button className="w-full" size="lg" data-testid="button-contact">
                  Contactar
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Características destacadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Bed className="h-5 w-5 text-primary" />
                <span>{property.bedrooms} recámaras</span>
              </div>
              <div className="flex items-center gap-3">
                <Bath className="h-5 w-5 text-primary" />
                <span>{property.bathrooms} baños</span>
              </div>
              <div className="flex items-center gap-3">
                <Square className="h-5 w-5 text-primary" />
                <span>{property.area} m²</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="line-clamp-2">{property.location}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {property && (
        <RentalOpportunityRequestDialog
          open={showSORDialog}
          onOpenChange={setShowSORDialog}
          property={property}
        />
      )}
    </div>
  );
}
