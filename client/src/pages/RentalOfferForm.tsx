import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation as useWouterLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Property, RentalOpportunityRequest } from "@shared/schema";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const offerSchema = z.object({
  // Client Profile
  clientNationality: z.string().min(2, "La nacionalidad es requerida"),
  clientTimeInTulum: z.string().min(1, "El tiempo en Tulum es requerido"),
  clientOccupation: z.string().min(2, "La ocupación es requerida"),
  clientCompany: z.string().optional(),
  clientHasPets: z.boolean().default(false),
  clientPetDescription: z.string().optional(),
  clientMonthlyIncome: z.string().min(1, "El ingreso mensual es requerido"),
  clientNumTenants: z.coerce.number().int().min(1, "El número de ocupantes es requerido"),
  clientGuarantorName: z.string().optional(),
  clientGuarantorPhone: z.string().optional(),
  clientPropertyUse: z.string().min(1, "El uso de la propiedad es requerido"),
  
  // Offer Details
  monthlyRent: z.string().min(1, "La renta mensual es requerida"),
  firstMonthAdvance: z.boolean().default(false),
  secondMonthAdvance: z.boolean().default(false),
  depositAmount: z.string().min(1, "El depósito es requerido"),
  moveInDate: z.date({
    required_error: "La fecha de mudanza es requerida",
  }),
  contractDurationMonths: z.coerce.number().int().min(1, "La duración del contrato es requerida"),
  
  // Services
  servicesIncluded: z.array(z.string()).optional().default([]),
  servicesExcluded: z.array(z.string()).optional().default([]),
  specialRequests: z.string().optional(),
  
  // Digital Signature
  digitalSignature: z.string().min(1, "La firma digital es requerida"),
});

type OfferFormData = z.infer<typeof offerSchema>;

const AVAILABLE_SERVICES = [
  { id: "water", label: "Agua" },
  { id: "electricity", label: "Electricidad" },
  { id: "gas", label: "Gas" },
  { id: "internet", label: "Internet" },
  { id: "maintenance", label: "Mantenimiento" },
  { id: "cleaning", label: "Limpieza" },
];

export default function RentalOfferForm() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [, setLocation] = useWouterLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get requestId from URL params
  const requestId = new URLSearchParams(window.location.search).get("requestId");

  const { data: property, isLoading: propertyLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: !!propertyId,
  });

  const { data: request, isLoading: requestLoading } = useQuery<RentalOpportunityRequest>({
    queryKey: [`/api/rental-opportunity-requests/${requestId}`],
    enabled: !!requestId,
  });

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      clientHasPets: false,
      firstMonthAdvance: false,
      secondMonthAdvance: false,
      servicesIncluded: [],
      servicesExcluded: [],
    },
  });

  const createOfferMutation = useMutation({
    mutationFn: async (data: OfferFormData) => {
      return await apiRequest("POST", "/api/offers", {
        ...data,
        propertyId,
        opportunityRequestId: requestId,
        moveInDate: data.moveInDate.toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Oferta enviada",
        description: "Tu oferta de renta ha sido enviada exitosamente",
      });
      setLocation("/mis-oportunidades");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la oferta",
        variant: "destructive",
      });
    },
  });

  if (isAuthLoading || propertyLoading || requestLoading) {
    return <LoadingScreen />;
  }

  if (!user || user.role !== "cliente") {
    setLocation("/");
    return null;
  }

  if (!property) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Propiedad no encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request || request.status !== "approved") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {!request ? "Solicitud no encontrada" : "Esta solicitud no ha sido aprobada aún"}
            </p>
            <Button className="mt-4" onClick={() => setLocation("/mis-oportunidades")}>
              Volver a Mis Oportunidades
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: OfferFormData) => {
    setIsSubmitting(true);
    await createOfferMutation.mutateAsync(data);
    setIsSubmitting(false);
  };

  const watchServicesIncluded = form.watch("servicesIncluded");
  const watchHasPets = form.watch("clientHasPets");

  return (
    <div className="container mx-auto py-4 sm:py-6 md:py-8 px-4">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="title-offer-form">
          Oferta de Renta
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Completa los detalles de tu oferta para {property.title}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 md:space-y-8">
          {/* Client Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Perfil del Cliente
              </CardTitle>
              <CardDescription>
                Información personal y laboral
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="clientNationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nacionalidad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Mexicana" {...field} data-testid="input-nationality" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientTimeInTulum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo en Tulum</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 2 años" {...field} data-testid="input-time-in-tulum" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientOccupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ocupación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Ingeniero" {...field} data-testid="input-occupation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de la empresa" {...field} data-testid="input-company" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientMonthlyIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingreso Mensual</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 50000" {...field} data-testid="input-monthly-income" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientNumTenants"
                render={({ field}) => (
                  <FormItem>
                    <FormLabel>Número de Ocupantes</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="Ej: 2" {...field} data-testid="input-num-tenants" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientPropertyUse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uso de la Propiedad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-property-use">
                          <SelectValue placeholder="Selecciona el uso" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="residential">Residencial</SelectItem>
                        <SelectItem value="commercial">Comercial</SelectItem>
                        <SelectItem value="vacation">Vacacional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="clientHasPets"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-has-pets"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Tengo mascotas</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {watchHasPets && (
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="clientPetDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción de Mascotas</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe tus mascotas (tipo, tamaño, cantidad)" {...field} data-testid="textarea-pet-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="clientGuarantorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Garante (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre completo" {...field} data-testid="input-guarantor-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientGuarantorPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono del Garante (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+52 998 123 4567" {...field} data-testid="input-guarantor-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Offer Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Oferta</CardTitle>
              <CardDescription>Montos y fechas del contrato</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="monthlyRent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renta Mensual</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 15000" {...field} data-testid="input-monthly-rent" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="depositAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depósito</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 15000" {...field} data-testid="input-deposit" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moveInDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Mudanza</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-move-in-date"
                          >
                            {field.value ? (
                              format(field.value, "dd 'de' MMMM, yyyy", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractDurationMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración del Contrato (Meses)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="Ej: 12" {...field} data-testid="input-contract-duration" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 space-y-4">
                <FormField
                  control={form.control}
                  name="firstMonthAdvance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-first-advance"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Adelanto del primer mes</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondMonthAdvance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-second-advance"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Adelanto del segundo mes</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Services Section */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios</CardTitle>
              <CardDescription>Servicios incluidos y excluidos en la renta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="servicesIncluded"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Servicios Incluidos</FormLabel>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {AVAILABLE_SERVICES.map((service) => (
                        <FormField
                          key={service.id}
                          control={form.control}
                          name="servicesIncluded"
                          render={({ field }) => (
                            <FormItem key={service.id} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value || [], service.id])
                                      : field.onChange(field.value?.filter((value) => value !== service.id));
                                  }}
                                  data-testid={`checkbox-service-included-${service.id}`}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{service.label}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="servicesExcluded"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Servicios NO Incluidos</FormLabel>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {AVAILABLE_SERVICES.filter(s => !watchServicesIncluded?.includes(s.id)).map((service) => (
                        <FormField
                          key={service.id}
                          control={form.control}
                          name="servicesExcluded"
                          render={({ field }) => (
                            <FormItem key={service.id} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value || [], service.id])
                                      : field.onChange(field.value?.filter((value) => value !== service.id));
                                  }}
                                  data-testid={`checkbox-service-excluded-${service.id}`}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{service.label}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peticiones Especiales (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Cualquier petición especial o comentario adicional" 
                        {...field} 
                        data-testid="textarea-special-requests"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Digital Signature Section */}
          <Card>
            <CardHeader>
              <CardTitle>Firma Digital</CardTitle>
              <CardDescription>Firma completa para confirmar la oferta</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="digitalSignature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo (Firma Digital)</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre completo" {...field} data-testid="input-digital-signature" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/mis-oportunidades")}
              className="w-full sm:w-auto"
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
              data-testid="button-submit-offer"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Oferta
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
