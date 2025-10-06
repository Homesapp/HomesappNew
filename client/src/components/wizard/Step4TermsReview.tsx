import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const termsSchema = z.object({
  leaseDuration: z.string().optional(),
  securityDeposit: z.string().optional(),
  maintenanceIncluded: z.string().optional(),
  additionalTerms: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones",
  }),
  confirmAccuracy: z.boolean().refine((val) => val === true, {
    message: "Debes confirmar que la información es correcta",
  }),
});

type TermsForm = z.infer<typeof termsSchema>;

type Step4Props = {
  data: any;
  draftId: string | null;
  onUpdate: (data: any) => void;
  onPrevious: () => void;
};

export default function Step4TermsReview({ data, draftId, onUpdate, onPrevious }: Step4Props) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TermsForm>({
    resolver: zodResolver(termsSchema),
    defaultValues: {
      leaseDuration: data.commercialTerms?.leaseDuration || "",
      securityDeposit: data.commercialTerms?.securityDeposit || "",
      maintenanceIncluded: data.commercialTerms?.maintenanceIncluded || "",
      additionalTerms: data.commercialTerms?.additionalTerms || "",
      acceptTerms: false,
      confirmAccuracy: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (termsData: TermsForm) => {
      if (!draftId) {
        throw new Error("No hay borrador para enviar");
      }
      
      // Extract commercial terms (exclude acceptance checkboxes)
      const { acceptTerms, confirmAccuracy, ...commercialTerms } = termsData;
      
      // First update with terms data
      await apiRequest("PATCH", `/api/property-submission-drafts/${draftId}`, {
        commercialTerms,
      });
      
      // Then submit
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

  const handleSubmit = async (formData: TermsForm) => {
    // Update wizard data with current commercial terms (excluding checkboxes)
    const { acceptTerms, confirmAccuracy, ...commercialTerms } = formData;
    onUpdate({ commercialTerms });
    
    setIsSubmitting(true);
    await submitMutation.mutateAsync(formData);
  };

  const isComplete = data.basicInfo && data.locationInfo && data.details && data.media;
  
  // Get current form values for live review
  const currentFormValues = form.watch();

  // Update wizard data whenever commercial terms change
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      // Only update when commercial terms fields change (not checkboxes)
      if (name && ['leaseDuration', 'securityDeposit', 'maintenanceIncluded', 'additionalTerms'].includes(name)) {
        const { acceptTerms, confirmAccuracy, ...commercialTerms } = values as TermsForm;
        onUpdate({ commercialTerms });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onUpdate]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step4-title">
          Términos y Revisión Final
        </h2>
        <p className="text-muted-foreground" data-testid="text-step4-description">
          Define los términos comerciales y revisa la información
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs defaultValue="terms" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="terms" data-testid="tab-terms">
                Términos Comerciales
              </TabsTrigger>
              <TabsTrigger value="review" data-testid="tab-review">
                Revisión Completa
              </TabsTrigger>
            </TabsList>

            <TabsContent value="terms" className="space-y-4 mt-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Términos Comerciales (Opcional)</h3>
                <p className="text-sm text-muted-foreground">
                  Define las condiciones de la operación
                </p>
              </div>

            {data.isForRent && (
              <>
                <FormField
                  control={form.control}
                  name="leaseDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración del Contrato</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: 12 meses"
                          {...field}
                          data-testid="input-lease-duration"
                        />
                      </FormControl>
                      <FormDescription data-testid="text-lease-description">
                        Tiempo mínimo o preferido de arrendamiento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="securityDeposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Depósito de Garantía</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: 1 mes de renta"
                          {...field}
                          data-testid="input-security-deposit"
                        />
                      </FormControl>
                      <FormDescription data-testid="text-deposit-description">
                        Monto del depósito requerido
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maintenanceIncluded"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mantenimiento Incluido</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ej: Mantenimiento de áreas comunes, jardinería..."
                          rows={2}
                          {...field}
                          data-testid="textarea-maintenance"
                        />
                      </FormControl>
                      <FormDescription data-testid="text-maintenance-description">
                        Servicios de mantenimiento incluidos en la renta
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="additionalTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Términos Adicionales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cualquier término o condición adicional..."
                      rows={3}
                      {...field}
                      data-testid="textarea-additional-terms"
                    />
                  </FormControl>
                  <FormDescription data-testid="text-additional-description">
                    Otros términos importantes para la operación
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="review" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Resumen de la Propiedad</h3>
              <p className="text-sm text-muted-foreground">
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

            {/* Tipo de Operación */}
            <Card data-testid="card-review-type">
              <CardHeader>
                <CardTitle>Tipo de Operación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  {data.isForRent && <Badge data-testid="badge-rent">Renta</Badge>}
                  {data.isForSale && <Badge data-testid="badge-sale">Venta</Badge>}
                </div>
              </CardContent>
            </Card>

            {/* Información Básica */}
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

            {/* Ubicación */}
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

            {/* Características */}
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

            {/* Multimedia */}
            {data.media && (data.media.primaryImages?.length > 0 || data.media.secondaryImages?.length > 0 || data.media.images?.length > 0 || data.media.virtualTourUrl) && (
              <Card data-testid="card-review-media">
                <CardHeader>
                  <CardTitle>Multimedia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.media.primaryImages && data.media.primaryImages.length > 0 ? (
                    <>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Imágenes Principales:</span>
                        <p className="text-base" data-testid="text-review-primary-images-count">
                          {data.media.primaryImages.length} imagen(es) {data.media.coverImageIndex !== undefined && `(portada: #${data.media.coverImageIndex + 1})`}
                        </p>
                      </div>
                      {data.media.secondaryImages && data.media.secondaryImages.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Imágenes Secundarias:</span>
                          <p className="text-base" data-testid="text-review-secondary-images-count">
                            {data.media.secondaryImages.length} imagen(es)
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    data.media.images && data.media.images.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Imágenes:</span>
                        <p className="text-base" data-testid="text-review-images-count">
                          {data.media.images.length} imagen(es)
                        </p>
                      </div>
                    )
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

            {/* Commercial Terms Review */}
            {(currentFormValues.leaseDuration || currentFormValues.securityDeposit || currentFormValues.maintenanceIncluded || currentFormValues.additionalTerms) && (
              <Card data-testid="card-review-terms">
                <CardHeader>
                  <CardTitle>Términos Comerciales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {currentFormValues.leaseDuration && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Duración:</span>
                      <p className="text-base" data-testid="text-review-lease">{currentFormValues.leaseDuration}</p>
                    </div>
                  )}
                  {currentFormValues.securityDeposit && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Depósito:</span>
                      <p className="text-base" data-testid="text-review-deposit">{currentFormValues.securityDeposit}</p>
                    </div>
                  )}
                  {currentFormValues.maintenanceIncluded && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Mantenimiento:</span>
                      <p className="text-base" data-testid="text-review-maintenance">{currentFormValues.maintenanceIncluded}</p>
                    </div>
                  )}
                  {currentFormValues.additionalTerms && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Términos Adicionales:</span>
                      <p className="text-base" data-testid="text-review-additional">{currentFormValues.additionalTerms}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Confirmaciones Requeridas */}
        <Separator />
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Confirmación Final</h3>
            <p className="text-sm text-muted-foreground">
              Por favor confirma que has revisado toda la información
            </p>
          </div>

          <FormField
            control={form.control}
            name="confirmAccuracy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-confirm-accuracy"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-base cursor-pointer">
                    Confirmo que toda la información proporcionada es correcta y veraz
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-accept-terms"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-base cursor-pointer">
                    Acepto los términos y condiciones de HomesApp para la publicación de propiedades
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isSubmitting}
            data-testid="button-previous-step4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button
            type="submit"
            disabled={!isComplete || isSubmitting}
            data-testid="button-submit-property"
          >
            {isSubmitting ? (
              "Enviando..."
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Enviar Propiedad
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
    </div>
  );
}
