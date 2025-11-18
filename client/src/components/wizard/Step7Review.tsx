import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Check, AlertCircle, FileText, Home } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getTranslation, Language } from "@/lib/wizardTranslations";

type Step7Props = {
  data: any;
  draftId: string | null;
  onPrevious: () => void;
  language?: Language;
};

export default function Step7Review({ data, draftId, onPrevious, language = "es" }: Step7Props) {
  const t = getTranslation(language);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"summary" | "terms">("summary");

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!draftId) {
        throw new Error(t.errors.noDraftToSubmit);
      }
      return await apiRequest("PATCH", `/api/property-submission-drafts/${draftId}`, {
        status: "submitted",
      });
    },
    onSuccess: () => {
      toast({
        title: t.notifications.propertySubmitted,
        description: t.notifications.propertySubmittedDesc,
      });
      setLocation("/mis-propiedades");
    },
    onError: (error: any) => {
      toast({
        title: t.notifications.error,
        description: error.message || t.notifications.submitError,
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
          {t.step7.title}
        </h2>
        <p className="text-muted-foreground" data-testid="text-step7-description">
          {t.step7.subtitle}
        </p>
      </div>

      {/* View Mode Toggle Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant={viewMode === "summary" ? "default" : "outline"}
          onClick={() => setViewMode("summary")}
          data-testid="button-view-summary"
          className="flex-1"
        >
          <Home className="w-4 h-4 mr-2" />
          {language === "es" ? "Resumen de Propiedad" : "Property Summary"}
        </Button>
        <Button
          type="button"
          variant={viewMode === "terms" ? "default" : "outline"}
          onClick={() => setViewMode("terms")}
          data-testid="button-view-terms"
          className="flex-1"
        >
          <FileText className="w-4 h-4 mr-2" />
          {language === "es" ? "Términos y Condiciones" : "Terms and Conditions"}
        </Button>
      </div>

      {!isComplete && (
        <Alert variant="destructive" data-testid="alert-incomplete">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle data-testid="text-alert-title">{t.step7.incompleteInfo}</AlertTitle>
          <AlertDescription data-testid="text-alert-description">
            {t.step7.completeAllSteps}
          </AlertDescription>
        </Alert>
      )}

      {/* Property Summary View */}
      {viewMode === "summary" && (
        <div className="space-y-4">
        {/* Property Type */}
        <Card data-testid="card-review-type">
          <CardHeader>
            <CardTitle>{t.step7.operationType}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              {data.isForRent && (
                <Badge data-testid="badge-rent">{t.step7.rent}</Badge>
              )}
              {data.isForSale && (
                <Badge data-testid="badge-sale">{t.step7.sale}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        {data.basicInfo && (
          <Card data-testid="card-review-basic">
            <CardHeader>
              <CardTitle>{t.step7.basicInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">{t.step7.title}:</span>
                <p className="text-base" data-testid="text-review-title">{data.basicInfo.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">{t.step7.description}:</span>
                <p className="text-base" data-testid="text-review-description">{data.basicInfo.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.propertyType}:</span>
                  <p className="text-base" data-testid="text-review-property-type">{data.basicInfo.propertyType}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.price}:</span>
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
              <CardTitle>{t.step7.location}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">{t.step7.address}:</span>
                <p className="text-base" data-testid="text-review-address">{data.locationInfo.address}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.city}:</span>
                  <p className="text-base" data-testid="text-review-city">{data.locationInfo.city}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.state}:</span>
                  <p className="text-base" data-testid="text-review-state">{data.locationInfo.state}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.zipCode}:</span>
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
              <CardTitle>{t.step7.details}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.bedrooms}:</span>
                  <p className="text-base" data-testid="text-review-bedrooms">{data.details.bedrooms}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.bathrooms}:</span>
                  <p className="text-base" data-testid="text-review-bathrooms">{data.details.bathrooms}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.area}:</span>
                  <p className="text-base" data-testid="text-review-area">{data.details.area} m²</p>
                </div>
              </div>
              {data.details.amenities && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.amenities}:</span>
                  <p className="text-base" data-testid="text-review-amenities">{data.details.amenities}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Media */}
        {data.media && (data.media.primaryImages?.length > 0 || data.media.secondaryImages?.length > 0 || data.media.images?.length > 0 || data.media.virtualTourUrl) && (
          <Card data-testid="card-review-media">
            <CardHeader>
              <CardTitle>{t.step7.media}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.media.primaryImages && data.media.primaryImages.length > 0 ? (
                <>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">{t.step7.primaryImages}:</span>
                    <p className="text-base" data-testid="text-review-primary-images-count">
                      {data.media.primaryImages.length} {t.step7.images} {data.media.coverImageIndex !== undefined && `(${t.step7.coverImage}: #${data.media.coverImageIndex + 1})`}
                    </p>
                  </div>
                  {data.media.secondaryImages && data.media.secondaryImages.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">{t.step7.secondaryImages}:</span>
                      <p className="text-base" data-testid="text-review-secondary-images-count">
                        {data.media.secondaryImages.length} {t.step7.images}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                data.media.images && data.media.images.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">{t.step7.images}:</span>
                    <p className="text-base" data-testid="text-review-images-count">
                      {data.media.images.length} {t.step7.images}
                    </p>
                  </div>
                )
              )}
              {data.media.virtualTourUrl && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.virtualTour}:</span>
                  <p className="text-base" data-testid="text-review-tour">{t.step7.available}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Commercial Terms */}
        {data.commercialTerms && Object.keys(data.commercialTerms).some(key => data.commercialTerms[key]) && (
          <Card data-testid="card-review-terms">
            <CardHeader>
              <CardTitle>{t.step7.commercialTerms}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.commercialTerms.leaseDuration && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.duration}:</span>
                  <p className="text-base" data-testid="text-review-lease">{data.commercialTerms.leaseDuration}</p>
                </div>
              )}
              {data.commercialTerms.securityDeposit && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.deposit}:</span>
                  <p className="text-base" data-testid="text-review-deposit">{data.commercialTerms.securityDeposit}</p>
                </div>
              )}
              {data.commercialTerms.additionalTerms && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.additionalTerms}:</span>
                  <p className="text-base" data-testid="text-review-additional">{data.commercialTerms.additionalTerms}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      )}

      {/* Terms and Conditions View */}
      {viewMode === "terms" && (
        <Card data-testid="card-terms-conditions">
          <CardHeader>
            <CardTitle data-testid="heading-terms-title">
              {language === "es" ? "Términos y Condiciones Completos" : "Complete Terms and Conditions"}
            </CardTitle>
            <CardDescription data-testid="text-terms-description">
              {language === "es" 
                ? "Lee cuidadosamente los términos y condiciones antes de enviar tu propiedad" 
                : "Please read the terms and conditions carefully before submitting your property"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 prose dark:prose-invert max-w-none" data-testid="content-terms">
            <section>
              <h3 className="font-semibold text-base">1. {language === "es" ? "Propiedad y Titularidad" : "Property and Ownership"}</h3>
              <p className="text-sm text-muted-foreground">
                {language === "es" 
                  ? "El Propietario declara bajo protesta de decir verdad que es el legítimo propietario de la propiedad descrita en este documento y que tiene pleno derecho legal para ofrecer la propiedad en renta y/o venta a través de HomesApp."
                  : "The Owner declares under oath that they are the legitimate owner of the property described in this document and have full legal right to offer the property for rent and/or sale through HomesApp."}
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base">2. {language === "es" ? "Información Veraz" : "Truthful Information"}</h3>
              <p className="text-sm text-muted-foreground">
                {language === "es"
                  ? "El Propietario se compromete a proporcionar información veraz, completa y actualizada sobre la propiedad, incluyendo pero no limitado a: características físicas, servicios, amenidades, documentación legal y cualquier gravamen o restricción que pueda afectar la propiedad."
                  : "The Owner commits to providing truthful, complete and updated information about the property, including but not limited to: physical characteristics, services, amenities, legal documentation and any liens or restrictions that may affect the property."}
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base">3. {language === "es" ? "Estado de la Propiedad" : "Property Condition"}</h3>
              <p className="text-sm text-muted-foreground">
                {language === "es"
                  ? "El Propietario declara que la propiedad se encuentra en buen estado de conservación y funcionamiento, cumpliendo con todos los estándares de habitabilidad y seguridad requeridos por las leyes aplicables."
                  : "The Owner declares that the property is in good condition and working order, meeting all habitability and safety standards required by applicable laws."}
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base">4. {language === "es" ? "Cumplimiento Legal" : "Legal Compliance"}</h3>
              <p className="text-sm text-muted-foreground">
                {language === "es"
                  ? "El Propietario certifica que la propiedad cumple con todas las regulaciones locales, estatales y federales aplicables, incluyendo zonificación, permisos de construcción, y regulaciones ambientales."
                  : "The Owner certifies that the property complies with all applicable local, state and federal regulations, including zoning, building permits, and environmental regulations."}
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base">5. {language === "es" ? "Comisiones y Pagos" : "Commissions and Payments"}</h3>
              <p className="text-sm text-muted-foreground">
                {language === "es"
                  ? "El Propietario acepta y autoriza a HomesApp a cobrar las comisiones acordadas por los servicios de intermediación inmobiliaria según lo establecido en el contrato de prestación de servicios."
                  : "The Owner accepts and authorizes HomesApp to collect the agreed commissions for real estate intermediation services as established in the service agreement."}
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base">6. {language === "es" ? "Responsabilidad" : "Liability"}</h3>
              <p className="text-sm text-muted-foreground">
                {language === "es"
                  ? "El Propietario exime a HomesApp de cualquier responsabilidad derivada de información incorrecta o incompleta proporcionada por el Propietario, así como de cualquier defecto oculto o problema legal relacionado con la propiedad."
                  : "The Owner releases HomesApp from any liability arising from incorrect or incomplete information provided by the Owner, as well as from any hidden defects or legal issues related to the property."}
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base">7. {language === "es" ? "Modificaciones" : "Modifications"}</h3>
              <p className="text-sm text-muted-foreground">
                {language === "es"
                  ? "HomesApp se reserva el derecho de modificar estos términos y condiciones en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en la plataforma."
                  : "HomesApp reserves the right to modify these terms and conditions at any time. Changes will take effect immediately after being published on the platform."}
              </p>
            </section>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isSubmitting}
          data-testid="button-previous-step7"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t.previous}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitting}
          data-testid="button-submit-property"
        >
          <Check className="w-4 h-4 mr-2" />
          {isSubmitting ? t.step7.submitting : t.step7.submitProperty}
        </Button>
      </div>
    </div>
  );
}
