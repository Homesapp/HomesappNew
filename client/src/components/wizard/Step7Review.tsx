import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Check, AlertCircle, FileText, Home } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getTranslation, Language } from "@/lib/wizardTranslations";
import type { PropertyOwnerTerms } from "@shared/schema";

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

  // Load terms from database
  const { data: ownerTerms = [], isLoading: termsLoading } = useQuery<PropertyOwnerTerms[]>({
    queryKey: ["/api/property-owner-terms/active"],
  });

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
            {termsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {language === "es" ? "Cargando términos..." : "Loading terms..."}
                </p>
              </div>
            ) : ownerTerms.length > 0 ? (
              ownerTerms.map((term, index) => (
                <section key={term.id}>
                  <h3 className="font-semibold text-base">
                    {index + 1}. {language === "es" ? term.title : term.titleEn}
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {language === "es" ? term.content : term.contentEn}
                  </p>
                </section>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {language === "es" 
                    ? "No hay términos y condiciones configurados" 
                    : "No terms and conditions configured"}
                </p>
              </div>
            )}
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
