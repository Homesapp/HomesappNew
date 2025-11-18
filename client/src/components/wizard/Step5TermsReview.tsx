import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Check, AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTranslation, Language } from "@/lib/wizardTranslations";
import type { Colony, Condominium } from "@shared/schema";

const getTermsSchema = (language: Language) => {
  const t = getTranslation(language);
  return z.object({
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: t.step7.mustAcceptTerms,
    }),
    confirmAccuracy: z.boolean().refine((val) => val === true, {
      message: t.step7.mustConfirmAccuracy,
    }),
    acceptCommission: z.boolean().refine((val) => val === true, {
      message: t.step7.mustAcceptCommission,
    }),
  });
};

type TermsForm = z.infer<ReturnType<typeof getTermsSchema>>;

type Step5Props = {
  data: any;
  draftId: string | null;
  onUpdate: (data: any) => void;
  onPrevious: () => void;
  invitationToken?: string;
  language?: Language;
};

export default function Step5TermsReview({ data, draftId, onUpdate, onPrevious, invitationToken, language = "es" }: Step5Props) {
  const t = getTranslation(language);
  const termsSchema = getTermsSchema(language);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch colonies and condominiums to display names
  const { data: colonies = [] } = useQuery<Colony[]>({
    queryKey: ["/api/colonies/approved"],
  });

  const { data: condominiums = [] } = useQuery<Condominium[]>({
    queryKey: ["/api/condominiums/approved"],
  });

  // Helper functions to get names from IDs
  const getColonyName = (colonyId: string | undefined) => {
    if (!colonyId) return "N/A";
    const colony = colonies.find(c => c.id === colonyId);
    return colony?.name || "N/A";
  };

  const getCondominiumName = (condominiumId: string | undefined) => {
    if (!condominiumId) return "N/A";
    const condo = condominiums.find(c => c.id === condominiumId);
    return condo?.name || "N/A";
  };

  const form = useForm<TermsForm>({
    resolver: zodResolver(termsSchema),
    defaultValues: {
      acceptTerms: false,
      confirmAccuracy: false,
      acceptCommission: false,
    },
  });

  const formatDuration = (duration: string) => {
    const durationMap: Record<string, { es: string; en: string }> = {
      '1_month': { es: '1 mes', en: '1 month' },
      '3_months': { es: '3 meses', en: '3 months' },
      '6_months': { es: '6 meses', en: '6 months' },
      '1_year': { es: '1 año', en: '1 year' },
      '2_years': { es: '2 años', en: '2 years' },
      '3_years': { es: '3 años', en: '3 years' },
      '4_years': { es: '4 años', en: '4 years' },
      '5_years': { es: '5 años', en: '5 years' },
    };
    return durationMap[duration]?.[language] || duration;
  };

  const submitMutation = useMutation({
    mutationFn: async (termsData: TermsForm) => {
      if (!draftId) {
        throw new Error("No hay borrador para enviar");
      }
      
      if (invitationToken) {
        // Use public endpoint for token-based submissions
        // First save the acceptance flags
        await apiRequest("PATCH", `/api/public/property-submission-drafts/${draftId}`, {
          invitationToken,
          termsAcceptance: {
            acceptedTerms: termsData.acceptTerms,
            confirmedAccuracy: termsData.confirmAccuracy,
            acceptedCommission: termsData.acceptCommission,
            acceptedAt: new Date().toISOString(),
          },
        });
        
        // Then mark as submitted (this will also mark the token as used)
        return await apiRequest("PATCH", `/api/public/property-submission-drafts/${draftId}`, {
          invitationToken,
          status: "submitted",
        });
      } else {
        // Use authenticated endpoint for regular submissions
        // First save the acceptance flags
        await apiRequest("PATCH", `/api/property-submission-drafts/${draftId}`, {
          termsAcceptance: {
            acceptedTerms: termsData.acceptTerms,
            confirmedAccuracy: termsData.confirmAccuracy,
            acceptedCommission: termsData.acceptCommission,
            acceptedAt: new Date().toISOString(),
          },
        });
        
        // Then mark as submitted
        return await apiRequest("PATCH", `/api/property-submission-drafts/${draftId}`, {
          status: "submitted",
        });
      }
    },
    onSuccess: () => {
      if (invitationToken) {
        // Redirect to success page for token-based submissions
        setLocation("/property-submission-success");
      } else {
        // Redirect to my properties for authenticated users
        toast({
          title: t.step7.propertySubmittedTitle,
          description: t.step7.propertySubmittedDesc,
        });
        setLocation("/my-properties");
      }
    },
    onError: (error: any) => {
      toast({
        title: t.step7.error,
        description: error.message || t.step7.submissionError,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (formData: TermsForm) => {
    setIsSubmitting(true);
    await submitMutation.mutateAsync(formData);
  };

  const isComplete = data.basicInfo && data.locationInfo && data.details && data.media;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step5-title">
          {t.step7.title}
        </h2>
        <p className="text-muted-foreground" data-testid="text-step5-description">
          {t.step7.subtitle}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <Tabs defaultValue="review" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="review" data-testid="tab-review">
                {t.step7.reviewTab}
              </TabsTrigger>
              <TabsTrigger value="terms" data-testid="tab-terms">
                {t.step7.termsTab}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="review" className="space-y-4 mt-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.step7.reviewSummary}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.step7.reviewBeforeSubmitting}
                </p>
              </div>

              {!isComplete && (
                <Alert variant="destructive" data-testid="alert-incomplete">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle data-testid="text-alert-title">{t.step7.incompleteTitle}</AlertTitle>
                  <AlertDescription data-testid="text-alert-description">
                    {t.step7.incompleteDesc}
                  </AlertDescription>
                </Alert>
              )}

              {/* Tipo de Operación */}
              <Card data-testid="card-review-type">
                <CardHeader>
                  <CardTitle>{t.step7.operationType}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-2">
                    {data.isForRent && <Badge data-testid="badge-rent">{t.step7.rent}</Badge>}
                    {data.isForSale && <Badge data-testid="badge-sale">{t.step7.sale}</Badge>}
                  </div>
                </CardContent>
              </Card>

              {/* Información Básica */}
              {data.basicInfo && (
                <Card data-testid="card-review-basic">
                  <CardHeader>
                    <CardTitle>{t.step7.basicInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">{t.step7.titleLabel}:</span>
                      <p className="text-base" data-testid="text-review-title">{data.basicInfo.title}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">{t.step7.descriptionLabel}:</span>
                      <p className="text-base" data-testid="text-review-description">{data.basicInfo.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">{t.step7.typeLabel}:</span>
                        <p className="text-base" data-testid="text-review-property-type">{data.basicInfo.propertyType}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">{t.step7.priceLabel}:</span>
                        <p className="text-base" data-testid="text-review-price">
                          ${Number(data.basicInfo.price).toLocaleString()} MXN
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ubicación */}
              {data.locationInfo && (
                <Card data-testid="card-review-location">
                  <CardHeader>
                    <CardTitle>{t.step7.location}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">{t.step7.addressLabel}:</span>
                      <p className="text-base" data-testid="text-review-address">{data.locationInfo.address}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">{t.step7.colonyLabel}:</span>
                        <p className="text-base" data-testid="text-review-colony">{getColonyName(data.locationInfo.colonyId)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">{t.step7.condominiumLabel}:</span>
                        <p className="text-base" data-testid="text-review-condominium">{getCondominiumName(data.locationInfo.condominiumId)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Características */}
              {data.details && (
                <Card data-testid="card-review-details">
                  <CardHeader>
                    <CardTitle>{t.step7.physicalDetails}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">{t.step7.bedroomsLabel}:</span>
                        <p className="text-base" data-testid="text-review-bedrooms">{data.details.bedrooms}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">{t.step7.bathroomsLabel}:</span>
                        <p className="text-base" data-testid="text-review-bathrooms">{data.details.bathrooms}</p>
                      </div>
                      {data.details.area && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">{t.step7.areaLabel}:</span>
                          <p className="text-base" data-testid="text-review-area">{data.details.area} m²</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Servicios y Utilidades */}
              {data.servicesInfo && (
                <Card data-testid="card-review-services">
                  <CardHeader>
                    <CardTitle>{t.step7.services}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.servicesInfo.basicServices && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">{t.step7.servicesIncluded}</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {data.servicesInfo.basicServices.water?.included && (
                            <Badge variant="secondary">{t.step7.water}</Badge>
                          )}
                          {data.servicesInfo.basicServices.electricity?.included && (
                            <Badge variant="secondary">{t.step7.electricity}</Badge>
                          )}
                          {data.servicesInfo.basicServices.internet?.included && (
                            <Badge variant="secondary">{t.step7.internet}</Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {data.servicesInfo.acceptedLeaseDurations && data.servicesInfo.acceptedLeaseDurations.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">{t.step7.acceptedDurations}:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {data.servicesInfo.acceptedLeaseDurations.map((duration: string) => (
                            <Badge key={duration} variant="outline">{formatDuration(duration)}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Multimedia */}
              {data.media && (data.media.primaryImages?.length > 0 || data.media.secondaryImages?.length > 0 || data.media.images?.length > 0 || data.media.virtualTourUrl) && (
                <Card data-testid="card-review-media">
                  <CardHeader>
                    <CardTitle>{t.step7.multimedia}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.media.primaryImages && data.media.primaryImages.length > 0 ? (
                      <>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">{t.step7.primaryImages}</span>
                          <p className="text-base" data-testid="text-review-primary-images-count">
                            {data.media.primaryImages.length} {t.step7.images} {data.media.coverImageIndex !== undefined && `(${t.step7.coverImage}: #${data.media.coverImageIndex + 1})`}
                          </p>
                        </div>
                        {data.media.secondaryImages && data.media.secondaryImages.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">{t.step7.secondaryImages}</span>
                            <p className="text-base" data-testid="text-review-secondary-images-count">
                              {data.media.secondaryImages.length} {t.step7.images}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      data.media.images && data.media.images.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">{t.step7.imagesLabel}</span>
                          <p className="text-base" data-testid="text-review-images-count">
                            {data.media.images.length} {t.step7.images}
                          </p>
                        </div>
                      )
                    )}
                    {data.media.virtualTourUrl && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">{t.step7.tourLabel}</span>
                        <p className="text-base" data-testid="text-review-tour">{t.step7.tourAvailable}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="terms" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 flex-shrink-0" />
                    <CardTitle>{t.step7.termsTitle}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                    <div className="space-y-4 text-sm" dangerouslySetInnerHTML={{ __html: t.step7.termsContent }} />
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Confirmaciones Requeridas */}
          <Separator />
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.step7.finalConfirmation}</h3>
              <p className="text-sm text-muted-foreground">
                {t.step7.confirmReviewAccept}
              </p>
            </div>

            <FormField
              control={form.control}
              name="confirmAccuracy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-confirm-accuracy"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none flex-1">
                    <FormLabel className="text-base cursor-pointer font-medium">
                      {t.step7.confirmAccuracyLabel}
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {t.step7.confirmAccuracyDesc}
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptCommission"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-accept-commission"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none flex-1">
                    <FormLabel className="text-base cursor-pointer font-medium">
                      {t.step7.acceptCommissionLabel}
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {t.step7.acceptCommissionDesc}
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-accept-terms"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none flex-1">
                    <FormLabel className="text-base cursor-pointer font-medium">
                      {t.step7.acceptTermsLabel}
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {t.step7.acceptTermsDesc}
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
              data-testid="button-previous-step5"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t.previous}
            </Button>
            <Button
              type="submit"
              disabled={!isComplete || isSubmitting}
              className="w-full sm:w-auto"
              data-testid="button-submit-property"
            >
              {isSubmitting ? (
                t.step7.submitting
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t.step7.submitProperty}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
