import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
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

const termsSchema = z.object({
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones",
  }),
  confirmAccuracy: z.boolean().refine((val) => val === true, {
    message: "Debes confirmar que la información es correcta",
  }),
  acceptCommission: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar el esquema de comisiones",
  }),
});

type TermsForm = z.infer<typeof termsSchema>;

type Step5Props = {
  data: any;
  draftId: string | null;
  onUpdate: (data: any) => void;
  onPrevious: () => void;
  invitationToken?: string;
};

export default function Step5TermsReview({ data, draftId, onUpdate, onPrevious, invitationToken }: Step5Props) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TermsForm>({
    resolver: zodResolver(termsSchema),
    defaultValues: {
      acceptTerms: false,
      confirmAccuracy: false,
      acceptCommission: false,
    },
  });

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
          title: "Propiedad enviada para revisión",
          description: "Tu propiedad ha sido enviada y aparecerá en Mis Propiedades con estado 'Pendiente' hasta que sea aprobada por un administrador.",
        });
        setLocation("/my-properties");
      }
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
    setIsSubmitting(true);
    await submitMutation.mutateAsync(formData);
  };

  const isComplete = data.basicInfo && data.locationInfo && data.details && data.media;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step5-title">
          Términos y Revisión Final
        </h2>
        <p className="text-muted-foreground" data-testid="text-step5-description">
          Revisa la información y acepta los términos y condiciones
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs defaultValue="review" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="review" data-testid="tab-review">
                Revisión Completa
              </TabsTrigger>
              <TabsTrigger value="terms" data-testid="tab-terms">
                Términos y Condiciones
              </TabsTrigger>
            </TabsList>

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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Colonia:</span>
                        <p className="text-base" data-testid="text-review-colony">{data.locationInfo.colony || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Condominio:</span>
                        <p className="text-base" data-testid="text-review-condominium">{data.locationInfo.condominium || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Características */}
              {data.details && (
                <Card data-testid="card-review-details">
                  <CardHeader>
                    <CardTitle>Detalles Físicos</CardTitle>
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
                      {data.details.area && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Área:</span>
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
                    <CardTitle>Servicios</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.servicesInfo.basicServices && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Servicios Incluidos:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {data.servicesInfo.basicServices.water?.included && (
                            <Badge variant="secondary">Agua</Badge>
                          )}
                          {data.servicesInfo.basicServices.electricity?.included && (
                            <Badge variant="secondary">Electricidad</Badge>
                          )}
                          {data.servicesInfo.basicServices.internet?.included && (
                            <Badge variant="secondary">Internet</Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {data.servicesInfo.acceptedLeaseDurations && data.servicesInfo.acceptedLeaseDurations.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Duraciones Aceptadas:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {data.servicesInfo.acceptedLeaseDurations.map((duration: string) => (
                            <Badge key={duration} variant="outline">{duration}</Badge>
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
            </TabsContent>

            <TabsContent value="terms" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <CardTitle>Términos y Condiciones para Propietarios</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                    <div className="space-y-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">1. ACEPTACIÓN DEL PAGO DE COMISIÓN</h4>
                        <p className="text-muted-foreground">
                          Por medio de la presente, el Propietario acepta pagar a HomesApp una comisión correspondiente a:
                        </p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                          <li>3 meses de renta en caso de firmarse contrato de 5 años</li>
                          <li>2.5 meses de renta en caso de firmarse un contrato de 4 años</li>
                          <li>2 meses de renta en caso de firmarse un contrato de 3 años</li>
                          <li>1.5 meses de renta en caso de firmarse un contrato de 2 años</li>
                          <li>1 mes completo de renta en caso de firmarse un contrato de 1 año</li>
                          <li>1/2 mes de renta en caso de firmarse un contrato de 6 meses</li>
                          <li>En caso de que el contrato sea por un periodo menor a 6 meses, se aplicará la modalidad vacacional, con una comisión del 15% sobre el monto total de la reserva</li>
                        </ul>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">2. ENTREGA DE LA PROPIEDAD AL INQUILINO</h4>
                        <p className="text-muted-foreground">
                          El Propietario se compromete a realizar las reparaciones necesarias en la propiedad, garantizando que ésta 
                          se encuentre en condiciones habitables y adecuadas para el inquilino al momento del check-in. En caso de no 
                          cumplir con dichas reparaciones antes de la fecha de ingreso, el Propietario acepta realizarlas dentro de un 
                          plazo máximo de 30 días naturales posteriores a la entrega.
                        </p>
                        <p className="text-muted-foreground mt-2">
                          HomesApp NO se hace responsable de la devolución de la comisión en caso de que el inquilino alegue problemas 
                          de mantenimiento en la propiedad, ya sea desde el día del check-in o en cualquier momento durante el periodo 
                          de arrendamiento.
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">3. ENTREGA DE ADMINISTRACIÓN Y RECONOCIMIENTO DE GESTIÓN</h4>
                        <p className="text-muted-foreground">
                          El Propietario declara que HomesApp ha actuado en todo momento con buena fe y que ha colaborado 
                          efectivamente en la localización del inquilino. Asimismo, manifiesta que no ha existido dolo, fraude o mala 
                          práctica por parte de la plataforma.
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">4. ACEPTACIÓN DE PROMOCIÓN Y USO DE MATERIALES</h4>
                        <p className="text-muted-foreground">
                          El Propietario autoriza el uso del material promocional (fotografías, videos, tours 360, descripciones, etc.) 
                          generado por HomesApp para la promoción, renta y/o venta de su propiedad. Este material será de libre uso 
                          por parte de la plataforma en sus canales digitales y/o físicos.
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">5. ACEPTACIÓN EN CASO DE CANCELACIÓN</h4>
                        <p className="text-muted-foreground">
                          El Propietario acepta que, en caso de haber aceptado formalmente una oferta y posteriormente decida retractarse 
                          antes de la firma del contrato, deberá reembolsar directamente al inquilino la cantidad entregada como anticipo 
                          o apartado de la propiedad.
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">6. RESPONSABILIDAD DE LA PLATAFORMA Y APOYO EN LA MEDIACIÓN</h4>
                        <p className="text-muted-foreground">
                          HomesApp declara que su responsabilidad se limita a la intermediación entre arrendador y arrendatario durante 
                          el proceso de renta. Una vez firmado el contrato de arrendamiento, la plataforma no se hace responsable por 
                          daños materiales, incumplimientos contractuales o conflictos entre las partes.
                        </p>
                        <p className="text-muted-foreground mt-2">
                          Sin embargo, se compromete, dentro de sus posibilidades y en un marco de buena fe, a interceder y apoyar en 
                          la mediación de conflictos domésticos que puedan surgir durante el tiempo que el inquilino habite el inmueble, 
                          con el objetivo de mantener una relación armónica entre ambas partes.
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">7. EXCLUSIÓN DE RESPONSABILIDAD POR MANTENIMIENTO Y GASTOS OPERATIVOS</h4>
                        <p className="text-muted-foreground">
                          HomesApp NO se hace responsable por el mantenimiento físico o técnico del inmueble (salvo acuerdo expreso). 
                          Toda gestión, reparación o gasto relacionado con servicios básicos, mobiliario, electrodomésticos u otros 
                          elementos del inmueble será responsabilidad exclusiva del Propietario, a menos que se contrate a HomesApp 
                          para un servicio de administración integral o eventual.
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">8. AUTORIZACIÓN PARA FIRMAR PREACUERDOS</h4>
                        <p className="text-muted-foreground">
                          El Propietario autoriza a HomesApp a presentar ofertas, recibir depósitos de apartado y gestionar preacuerdos 
                          de renta en su representación, en función de las condiciones previamente establecidas. La plataforma se 
                          compromete a mantener comunicación oportuna sobre cada oferta recibida. El Propietario no podrá retractarse 
                          sin causa justificada una vez aceptada una oferta formal.
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">9. SERVICIOS ADICIONALES DE MANTENIMIENTO</h4>
                        <p className="text-muted-foreground">
                          Todos los servicios de HomesApp que el Propietario contrate, ya sea mantenimiento, limpieza, conserjería, 
                          contaduría o abogacía, se le sumará un 15% adicional por gastos administrativos, al valor de la cotización.
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">10. PROTECCIÓN DE DATOS Y USO DE INFORMACIÓN</h4>
                        <p className="text-muted-foreground">
                          El Propietario autoriza el uso de su información únicamente para fines relacionados con la promoción, renta 
                          y gestión del inmueble, respetando la Ley Federal de Protección de Datos Personales en Posesión de los 
                          Particulares. La plataforma no compartirá estos datos con terceros ajenos al proceso sin autorización expresa.
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">11. CLÁUSULA DE FIRMA DIGITAL O ELECTRÓNICA</h4>
                        <p className="text-muted-foreground">
                          Las partes acuerdan que este proceso de publicación podrá ser completado mediante aceptación digital, en 
                          términos de lo dispuesto por el Código de Comercio y la legislación aplicable en los Estados Unidos Mexicanos. 
                          Dicha aceptación tendrá la misma validez y efectos jurídicos que una firma autógrafa.
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">12. COSTOS ADMINISTRATIVOS</h4>
                        <p className="text-muted-foreground">
                          Por la elaboración del contrato de arrendamiento, los honorarios a cobrar serán de $2,500 MXN para contratos 
                          de uso de propiedad para vivienda personal, ó $3,800 MXN para contratos de renta para subarrendamiento. La 
                          cantidad correspondiente deberá ser abonada junto con el depósito del apartado de la unidad.
                        </p>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Confirmaciones Requeridas */}
          <Separator />
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Confirmación Final</h3>
              <p className="text-sm text-muted-foreground">
                Por favor confirma que has revisado toda la información y aceptas los términos
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
                      Confirmo que toda la información proporcionada es correcta y veraz
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Declaro bajo protesta de decir verdad que los datos aquí proporcionados son fidedignos
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
                      Acepto el esquema de comisiones de HomesApp
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Entiendo y acepto que se cobrará una comisión según la duración del contrato firmado
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
                      Acepto los términos y condiciones de HomesApp
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      He leído y acepto todos los términos y condiciones descritos arriba para la publicación de mi propiedad
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
              Anterior
            </Button>
            <Button
              type="submit"
              disabled={!isComplete || isSubmitting}
              className="w-full sm:w-auto"
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
