import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle2, AlertCircle, Home, Building2 } from "lucide-react";
import { getPropertyTitle } from "@/lib/propertyHelpers";
import { LanguageToggle } from "@/components/LanguageToggle";

const rentalFormSchema = z.object({
  fullName: z.string().min(2, "Nombre completo es requerido"),
  address: z.string().optional(),
  nationality: z.string().optional(),
  age: z.preprocess((val) => {
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().min(18, "Debe ser mayor de 18 años").optional()),
  timeInTulum: z.string().optional(),
  jobPosition: z.string().optional(),
  companyName: z.string().optional(),
  workplaceAddress: z.string().optional(),
  monthlyIncome: z.string().optional(),
  companyTenure: z.string().optional(),
  maritalStatus: z.string().optional(),
  whatsappNumber: z.string().min(10, "Número de WhatsApp requerido"),
  cellphone: z.string().optional(),
  email: z.string().email("Email inválido"),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  checkInDate: z.string().optional(),
  numberOfTenants: z.preprocess((val) => {
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().min(1).optional()),
  paymentMethod: z.string().optional(),
  hasPets: z.boolean().default(false),
  petDetails: z.string().optional(),
  desiredProperty: z.string().optional(),
  desiredCondoUnit: z.string().optional(),
  acceptedTerms: z.boolean().refine(val => val === true, "Debes aceptar los términos y condiciones"),
});

type RentalFormValues = z.infer<typeof rentalFormSchema>;

export default function PublicRentalForm() {
  const { token } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const totalSteps = 4;

  const { data: tokenData, isLoading: isValidating, error: validationError } = useQuery({
    queryKey: [`/api/rental-form-tokens/${token}/validate`],
    enabled: !!token,
  });

  const form = useForm<RentalFormValues>({
    resolver: zodResolver(rentalFormSchema),
    defaultValues: {
      fullName: "",
      whatsappNumber: "",
      email: "",
      hasPets: false,
      acceptedTerms: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: RentalFormValues) => {
      const response = await apiRequest("POST", `/api/rental-form-tokens/${token}/submit`, data);
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Formulario enviado exitosamente",
        description: "Revisaremos tu solicitud en las próximas 48-72 horas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al enviar formulario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    submitMutation.mutate(data);
  });

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Validando enlace...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validationError || !tokenData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Enlace Inválido</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {(validationError as any)?.message || "Este enlace ha expirado o no es válido."}
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Ir al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
              <CheckCircle2 className="h-6 w-6" />
              <CardTitle>¡Formulario Enviado!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Tu solicitud de renta ha sido enviada exitosamente. Revisaremos tu información y nos pondremos en contacto contigo en las próximas 48-72 horas.
            </p>
            <p className="text-sm text-muted-foreground">
              Te enviaremos una notificación por email y WhatsApp cuando tengamos una respuesta.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Ir al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const property = tokenData?.property;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Property Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">Formato de Renta de Inquilino</CardTitle>
                <CardDescription>
                  {property && getPropertyTitle(property)}
                </CardDescription>
              </div>
              <LanguageToggle />
            </div>
          </CardHeader>
          {property && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Renta Mensual</p>
                  <p className="font-semibold text-lg">${property.price} {property.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recámaras / Baños</p>
                  <p className="font-semibold">{property.bedrooms} / {property.bathrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ubicación</p>
                  <p className="font-semibold text-sm">{property.location}</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Paso {currentStep} de {totalSteps}</span>
            <span>{Math.round(progress)}% completo</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Steps */}
        <form onSubmit={onSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && "Datos Personales"}
                {currentStep === 2 && "Información Laboral"}
                {currentStep === 3 && "Detalles de Renta"}
                {currentStep === 4 && "Términos y Condiciones"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Personal Data */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nombre Completo *</Label>
                      <Input
                        id="fullName"
                        {...form.register("fullName")}
                        placeholder="Juan Pérez García"
                        data-testid="input-full-name"
                      />
                      {form.formState.errors.fullName && (
                        <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register("email")}
                        placeholder="juan@ejemplo.com"
                        data-testid="input-email"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsappNumber">WhatsApp *</Label>
                      <Input
                        id="whatsappNumber"
                        {...form.register("whatsappNumber")}
                        placeholder="+52 123 456 7890"
                        data-testid="input-whatsapp"
                      />
                      {form.formState.errors.whatsappNumber && (
                        <p className="text-sm text-destructive">{form.formState.errors.whatsappNumber.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cellphone">Celular Alternativo</Label>
                      <Input
                        id="cellphone"
                        {...form.register("cellphone")}
                        placeholder="+52 123 456 7890"
                        data-testid="input-cellphone"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nacionalidad</Label>
                      <Input
                        id="nationality"
                        {...form.register("nationality")}
                        placeholder="Mexicana"
                        data-testid="input-nationality"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age">Edad</Label>
                      <Input
                        id="age"
                        type="number"
                        {...form.register("age", { valueAsNumber: true })}
                        placeholder="30"
                        data-testid="input-age"
                      />
                      {form.formState.errors.age && (
                        <p className="text-sm text-destructive">{form.formState.errors.age.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maritalStatus">Estado Civil</Label>
                      <Select onValueChange={(value) => form.setValue("maritalStatus", value)}>
                        <SelectTrigger id="maritalStatus" data-testid="select-marital-status">
                          <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soltero">Soltero/a</SelectItem>
                          <SelectItem value="casado">Casado/a</SelectItem>
                          <SelectItem value="divorciado">Divorciado/a</SelectItem>
                          <SelectItem value="viudo">Viudo/a</SelectItem>
                          <SelectItem value="union_libre">Unión Libre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeInTulum">Tiempo en Tulum</Label>
                      <Input
                        id="timeInTulum"
                        {...form.register("timeInTulum")}
                        placeholder="6 meses"
                        data-testid="input-time-in-tulum"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección Actual</Label>
                    <Textarea
                      id="address"
                      {...form.register("address")}
                      placeholder="Calle, colonia, ciudad, estado, CP"
                      rows={2}
                      data-testid="textarea-address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="idType">Tipo de Identificación</Label>
                      <Select onValueChange={(value) => form.setValue("idType", value)}>
                        <SelectTrigger id="idType" data-testid="select-id-type">
                          <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ine">INE</SelectItem>
                          <SelectItem value="pasaporte">Pasaporte</SelectItem>
                          <SelectItem value="licencia">Licencia de Conducir</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idNumber">Número de Identificación</Label>
                      <Input
                        id="idNumber"
                        {...form.register("idNumber")}
                        placeholder="1234567890123"
                        data-testid="input-id-number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Employment Info */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobPosition">Puesto Laboral</Label>
                      <Input
                        id="jobPosition"
                        {...form.register("jobPosition")}
                        placeholder="Gerente de Ventas"
                        data-testid="input-job-position"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName">Empresa</Label>
                      <Input
                        id="companyName"
                        {...form.register("companyName")}
                        placeholder="Empresa S.A. de C.V."
                        data-testid="input-company-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthlyIncome">Ingreso Mensual</Label>
                      <Input
                        id="monthlyIncome"
                        {...form.register("monthlyIncome")}
                        placeholder="$20,000 MXN"
                        data-testid="input-monthly-income"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyTenure">Antigüedad en la Empresa</Label>
                      <Input
                        id="companyTenure"
                        {...form.register("companyTenure")}
                        placeholder="2 años"
                        data-testid="input-company-tenure"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workplaceAddress">Dirección del Trabajo</Label>
                    <Textarea
                      id="workplaceAddress"
                      {...form.register("workplaceAddress")}
                      placeholder="Dirección completa del lugar de trabajo"
                      rows={2}
                      data-testid="textarea-workplace-address"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Rental Details */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkInDate">Fecha de Entrada Deseada</Label>
                      <Input
                        id="checkInDate"
                        type="date"
                        {...form.register("checkInDate")}
                        data-testid="input-check-in-date"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numberOfTenants">Número de Inquilinos</Label>
                      <Input
                        id="numberOfTenants"
                        type="number"
                        {...form.register("numberOfTenants", { valueAsNumber: true })}
                        placeholder="1"
                        data-testid="input-number-of-tenants"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Método de Pago Preferido</Label>
                      <Select onValueChange={(value) => form.setValue("paymentMethod", value)}>
                        <SelectTrigger id="paymentMethod" data-testid="select-payment-method">
                          <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasPets"
                        checked={form.watch("hasPets")}
                        onCheckedChange={(checked) => form.setValue("hasPets", checked as boolean)}
                        data-testid="checkbox-has-pets"
                      />
                      <Label htmlFor="hasPets" className="cursor-pointer">
                        Tengo mascotas
                      </Label>
                    </div>

                    {form.watch("hasPets") && (
                      <div className="space-y-2">
                        <Label htmlFor="petDetails">Detalles de las Mascotas</Label>
                        <Textarea
                          id="petDetails"
                          {...form.register("petDetails")}
                          placeholder="Tipo, raza, tamaño, cantidad, edad, etc."
                          rows={3}
                          data-testid="textarea-pet-details"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Terms and Conditions */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="p-6 border rounded-lg bg-muted/30 max-h-96 overflow-y-auto">
                    <h3 className="font-semibold text-lg mb-4">Términos y Condiciones</h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        Al enviar este formulario, declaro que toda la información proporcionada es verdadera y correcta.
                      </p>
                      <p>
                        Autorizo a HomesApp y al propietario de la propiedad a verificar la información proporcionada,
                        incluyendo referencias laborales, personales y antecedentes crediticios.
                      </p>
                      <p>
                        Entiendo que la aprobación de mi solicitud está sujeta a la revisión y aprobación del propietario
                        y/o administrador de la propiedad.
                      </p>
                      <p>
                        Me comprometo a cumplir con todas las reglas y regulaciones del condominio/comunidad, así como
                        con los términos del contrato de arrendamiento.
                      </p>
                      <p>
                        Acepto que el tiempo de respuesta para la revisión de mi solicitud es de 48-72 horas hábiles.
                      </p>
                      <p>
                        Entiendo que proporcionar información falsa o incompleta puede resultar en el rechazo automático
                        de mi solicitud.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptedTerms"
                      checked={form.watch("acceptedTerms")}
                      onCheckedChange={(checked) => form.setValue("acceptedTerms", checked as boolean)}
                      data-testid="checkbox-terms-accepted"
                    />
                    <Label htmlFor="acceptedTerms" className="cursor-pointer text-sm leading-relaxed">
                      Acepto los términos y condiciones anteriores y confirmo que toda la información proporcionada
                      es verdadera y correcta. *
                    </Label>
                  </div>
                  {form.formState.errors.acceptedTerms && (
                    <p className="text-sm text-destructive">{form.formState.errors.acceptedTerms.message}</p>
                  )}
                </div>
              )}
            </CardContent>

            {/* Navigation Buttons */}
            <CardContent className="flex justify-between gap-4 border-t pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                data-testid="button-prev"
              >
                Anterior
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  data-testid="button-next"
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitMutation.isPending || !form.watch("acceptedTerms")}
                  data-testid="button-submit"
                >
                  {submitMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enviar Formulario
                </Button>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
