import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MapPin, Bed, Bath, Square, Star, ArrowLeft, ExternalLink, Image, Video, Map, Scan } from "lucide-react";
import { type Property } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function PropertyDetails() {
  const [, params] = useRoute("/propiedad/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ["/api/properties", params?.id],
    enabled: !!params?.id,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!property) return;
      const { data: isFavorite } = await fetch(`/api/favorites/check/${property.id}`).then(r => r.json());
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${property.id}`);
      } else {
        await apiRequest("POST", "/api/favorites", { propertyId: property.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
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
        <LoadingScreen className="min-h-[500px]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setLocation("/buscar-propiedades")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a búsqueda
        </Button>
        <div className="flex gap-2">
          {isAuthenticated && (
            <Button
              variant="outline"
              onClick={() => toggleFavoriteMutation.mutate()}
              disabled={toggleFavoriteMutation.isPending}
              data-testid="button-toggle-favorite"
            >
              <Heart className="h-4 w-4 mr-2" />
              Guardar en favoritos
            </Button>
          )}
          <Button
            onClick={() => setLocation(`/propiedad/${property.id}/completo`)}
            data-testid="button-view-full-details"
          >
            Ver detalles completos
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <Card>
        <div className="relative">
          {property.images && property.images.length > 0 ? (
            <div className="h-96 bg-muted relative overflow-hidden">
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              {property.featured && (
                <Badge className="absolute top-4 right-4">
                  Destacada
                </Badge>
              )}
            </div>
          ) : (
            <div className="h-96 bg-muted flex items-center justify-center">
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
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span className="text-lg">{property.location}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary mb-1">
                {formatPrice(property.price)}
              </div>
              {property.rating && parseFloat(property.rating) > 0 && (
                <div className="flex items-center gap-1 justify-end">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-medium">{property.rating}</span>
                  {property.reviewCount && (
                    <span className="text-sm text-muted-foreground">
                      ({property.reviewCount} reseñas)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <Bed className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-semibold">{property.bedrooms}</div>
              <div className="text-sm text-muted-foreground">Recámaras</div>
            </div>
            <div className="text-center">
              <Bath className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-semibold">{property.bathrooms}</div>
              <div className="text-sm text-muted-foreground">Baños</div>
            </div>
            <div className="text-center">
              <Square className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-semibold">{property.area}</div>
              <div className="text-sm text-muted-foreground">m²</div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Descripción</h2>
            <p className="text-muted-foreground leading-relaxed">
              {property.description || "Sin descripción disponible"}
            </p>
          </div>

          {property.amenities && property.amenities.length > 0 && (
            <>
              <Separator className="my-6" />
              <div>
                <h2 className="text-xl font-semibold mb-3">Amenidades</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {(property.availableFrom || property.availableTo) && (
            <>
              <Separator className="my-6" />
              <div>
                <h2 className="text-xl font-semibold mb-3">Disponibilidad</h2>
                <div className="grid grid-cols-2 gap-4">
                  {property.availableFrom && (
                    <div>
                      <span className="text-sm text-muted-foreground">Desde:</span>
                      <div className="font-medium">
                        {new Date(property.availableFrom).toLocaleDateString("es-MX")}
                      </div>
                    </div>
                  )}
                  {property.availableTo && (
                    <div>
                      <span className="text-sm text-muted-foreground">Hasta:</span>
                      <div className="font-medium">
                        {new Date(property.availableTo).toLocaleDateString("es-MX")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
