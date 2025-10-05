import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Step7Props = {
  data: any;
  draftId: string | null;
  onPrevious: () => void;
};

export default function Step7Review({ data, draftId, onPrevious }: Step7Props) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!draftId) {
        throw new Error("No hay borrador para enviar");
      }
      return await apiRequest("PATCH", `/api/property-submission-drafts/${draftId}`, {
        status: "submitted",
      });
    },
    onSuccess: () => {
      toast({
        title: "Propiedad enviada",
        description: "Tu propiedad ha sido enviada para revisión",
      });
      setLocation("/mis-propiedades");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la propiedad",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitMutation.mutateAsync();
  };

  const isComplete = data.basicInfo && data.locationInfo && data.details;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step7-title">
          Revisión Final
        </h2>
        <p className="text-muted-foreground" data-testid="text-step7-description">
          Revisa toda la información antes de enviar
        </p>
      </div>

      {!isComplete && (
        <Alert variant="destructive" data-testid="alert-incomplete">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle data-testid="text-alert-title">Información Incompleta</AlertTitle>
          <AlertDescription data-testid="text-alert-description">
            Por favor completa todos los pasos requeridos antes de enviar
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Property Type */}
        <Card data-testid="card-review-type">
          <CardHeader>
            <CardTitle>Tipo de Operación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              {data.isForRent && (
                <Badge data-testid="badge-rent">Renta</Badge>
              )}
              {data.isForSale && (
                <Badge data-testid="badge-sale">Venta</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        {data.basicInfo && (
          <Card data-testid="card-review-basic">
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Título:</span>
                <p className="text-base" data-testid="text-review-title">{data.basicInfo.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Descripción:</span>
                <p className="text-base" data-testid="text-review-description">{data.basicInfo.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Tipo:</span>
                  <p className="text-base" data-testid="text-review-property-type">{data.basicInfo.propertyType}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Precio:</span>
                  <p className="text-base" data-testid="text-review-price">
                    ${Number(data.basicInfo.price).toLocaleString()} MXN
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location */}
        {data.locationInfo && (
          <Card data-testid="card-review-location">
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Dirección:</span>
                <p className="text-base" data-testid="text-review-address">{data.locationInfo.address}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Ciudad:</span>
                  <p className="text-base" data-testid="text-review-city">{data.locationInfo.city}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Estado:</span>
                  <p className="text-base" data-testid="text-review-state">{data.locationInfo.state}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">C.P.:</span>
                  <p className="text-base" data-testid="text-review-zipcode">{data.locationInfo.zipCode}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details */}
        {data.details && (
          <Card data-testid="card-review-details">
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Habitaciones:</span>
                  <p className="text-base" data-testid="text-review-bedrooms">{data.details.bedrooms}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Baños:</span>
                  <p className="text-base" data-testid="text-review-bathrooms">{data.details.bathrooms}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Área:</span>
                  <p className="text-base" data-testid="text-review-area">{data.details.area} m²</p>
                </div>
              </div>
              {data.details.amenities && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Amenidades:</span>
                  <p className="text-base" data-testid="text-review-amenities">{data.details.amenities}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Media */}
        {data.media && (data.media.images?.length > 0 || data.media.virtualTourUrl) && (
          <Card data-testid="card-review-media">
            <CardHeader>
              <CardTitle>Multimedia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.media.images && data.media.images.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Imágenes:</span>
                  <p className="text-base" data-testid="text-review-images-count">
                    {data.media.images.length} imagen(es)
                  </p>
                </div>
              )}
              {data.media.virtualTourUrl && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Tour Virtual:</span>
                  <p className="text-base" data-testid="text-review-tour">Disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Commercial Terms */}
        {data.commercialTerms && Object.keys(data.commercialTerms).some(key => data.commercialTerms[key]) && (
          <Card data-testid="card-review-terms">
            <CardHeader>
              <CardTitle>Términos Comerciales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.commercialTerms.leaseDuration && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Duración:</span>
                  <p className="text-base" data-testid="text-review-lease">{data.commercialTerms.leaseDuration}</p>
                </div>
              )}
              {data.commercialTerms.securityDeposit && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Depósito:</span>
                  <p className="text-base" data-testid="text-review-deposit">{data.commercialTerms.securityDeposit}</p>
                </div>
              )}
              {data.commercialTerms.additionalTerms && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Términos Adicionales:</span>
                  <p className="text-base" data-testid="text-review-additional">{data.commercialTerms.additionalTerms}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isSubmitting}
          data-testid="button-previous-step7"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitting}
          data-testid="button-submit-property"
        >
          <Check className="w-4 h-4 mr-2" />
          {isSubmitting ? "Enviando..." : "Enviar Propiedad"}
        </Button>
      </div>
    </div>
  );
}
