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
import { useLanguage } from "@/contexts/LanguageContext";

const rentalFormSchema = z.object({
  // Datos Personales
  fullName: z.string().min(2, "Nombre completo es requerido"),
  address: z.string().optional(),
  nationality: z.string().optional(),
  age: z.preprocess((val) => {
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().min(18, "Debe ser mayor de 18 años").max(150, "Edad máxima: 150 años").optional()),
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
  }, z.number().min(1, "Mínimo 1 inquilino").max(20, "Máximo 20 inquilinos").optional()),
  paymentMethod: z.string().optional(),
  hasPets: z.boolean().default(false),
  petDetails: z.string().optional(),
  desiredProperty: z.string().optional(),
  desiredCondoUnit: z.string().optional(),
  
  // Referencias del Arrendamiento Anterior
  previousLandlordName: z.string().optional(),
  previousLandlordPhone: z.string().optional(),
  previousAddress: z.string().optional(),
  previousTenancy: z.string().optional(),
  
  // Referencias Laborales
  directSupervisorName: z.string().optional(),
  companyNameAddress: z.string().optional(),
  companyLandline: z.string().optional(),
  supervisorCellphone: z.string().optional(),
  
  // Referencias Personales
  reference1Name: z.string().optional(),
  reference1Address: z.string().optional(),
  reference1Landline: z.string().optional(),
  reference1Cellphone: z.string().optional(),
  
  // Datos del Garante
  hasGuarantor: z.boolean().default(false),
  guarantorFullName: z.string().optional(),
  guarantorAddress: z.string().optional(),
  guarantorBirthDatePlace: z.string().optional(),
  guarantorNationality: z.string().optional(),
  guarantorAge: z.preprocess((val) => {
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().min(18, "Debe ser mayor de 18 años").max(150, "Edad máxima: 150 años").optional()),
  guarantorTimeInTulum: z.string().optional(),
  guarantorJobPosition: z.string().optional(),
  guarantorCompanyName: z.string().optional(),
  guarantorWorkAddress: z.string().optional(),
  guarantorWorkPhone: z.string().optional(),
  guarantorMaritalStatus: z.string().optional(),
  guarantorLandline: z.string().optional(),
  guarantorCellphone: z.string().optional(),
  guarantorEmail: z.string().optional(),
  guarantorIdNumber: z.string().optional(),
  
  acceptedTerms: z.boolean().refine(val => val === true, "Debes aceptar los términos y condiciones"),
});

type RentalFormValues = z.infer<typeof rentalFormSchema>;

export default function PublicRentalForm() {
  const { token } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const totalSteps = 8; // 8 steps without documents (will implement file upload separately)

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
      hasGuarantor: false,
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

  const onSubmit = form.handleSubmit(
    async (data) => {
      submitMutation.mutate(data);
    },
    (errors) => {
      toast({
        title: "Error de validación",
        description: "Por favor revisa los campos del formulario",
        variant: "destructive",
      });
    }
  );

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
                {currentStep === 4 && "Referencias de Arrendamiento Anterior"}
                {currentStep === 5 && "Referencias Laborales"}
                {currentStep === 6 && "Referencias Personales"}
                {currentStep === 7 && "Datos del Garante (Opcional)"}
                {currentStep === 8 && "Términos y Condiciones"}
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
                        min="18"
                        max="150"
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
                        min="1"
                        max="20"
                        {...form.register("numberOfTenants", { valueAsNumber: true })}
                        placeholder="1"
                        data-testid="input-number-of-tenants"
                      />
                      {form.formState.errors.numberOfTenants && (
                        <p className="text-sm text-destructive">{form.formState.errors.numberOfTenants.message}</p>
                      )}
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

              {/* Step 4: Referencias de Arrendamiento Anterior */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Proporciona información sobre tu arrendamiento anterior
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="previousLandlordName">Nombre del Arrendador Anterior</Label>
                      <Input
                        id="previousLandlordName"
                        {...form.register("previousLandlordName")}
                        placeholder="María González"
                        data-testid="input-previous-landlord-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="previousLandlordPhone">N° Teléfono Celular</Label>
                      <Input
                        id="previousLandlordPhone"
                        {...form.register("previousLandlordPhone")}
                        placeholder="+52 123 456 7890"
                        data-testid="input-previous-landlord-phone"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="previousTenancy">Antigüedad como Inquilino</Label>
                      <Input
                        id="previousTenancy"
                        {...form.register("previousTenancy")}
                        placeholder="6 meses"
                        data-testid="input-previous-tenancy"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="previousAddress">Dirección del Arrendamiento Anterior</Label>
                    <Textarea
                      id="previousAddress"
                      {...form.register("previousAddress")}
                      placeholder="Dirección completa del arrendamiento anterior"
                      rows={2}
                      data-testid="textarea-previous-address"
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Referencias Laborales */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Proporciona información de tu supervisor o jefe directo
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="directSupervisorName">Nombre de Jefe Directo</Label>
                      <Input
                        id="directSupervisorName"
                        {...form.register("directSupervisorName")}
                        placeholder="María García López"
                        data-testid="input-supervisor-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyLandline">N° Teléfono Fijo de la Empresa</Label>
                      <Input
                        id="companyLandline"
                        {...form.register("companyLandline")}
                        placeholder="998 123 4567"
                        data-testid="input-company-landline"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supervisorCellphone">N° Celular del Encargado</Label>
                      <Input
                        id="supervisorCellphone"
                        {...form.register("supervisorCellphone")}
                        placeholder="+52 123 456 7890"
                        data-testid="input-supervisor-cellphone"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyNameAddress">Nombre y Dirección de la Empresa</Label>
                    <Textarea
                      id="companyNameAddress"
                      {...form.register("companyNameAddress")}
                      placeholder="Nombre completo de la empresa y su dirección"
                      rows={2}
                      data-testid="textarea-company-name-address"
                    />
                  </div>
                </div>
              )}

              {/* Step 6: Referencias Personales */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Proporciona al menos una referencia personal no laboral
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reference1Name">Nombre</Label>
                      <Input
                        id="reference1Name"
                        {...form.register("reference1Name")}
                        placeholder="Carlos Rodríguez"
                        data-testid="input-reference1-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reference1Landline">N° Teléfono Fijo</Label>
                      <Input
                        id="reference1Landline"
                        {...form.register("reference1Landline")}
                        placeholder="998 123 4567"
                        data-testid="input-reference1-landline"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reference1Cellphone">N° Teléfono Celular</Label>
                      <Input
                        id="reference1Cellphone"
                        {...form.register("reference1Cellphone")}
                        placeholder="+52 123 456 7890"
                        data-testid="input-reference1-cellphone"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference1Address">Dirección</Label>
                    <Textarea
                      id="reference1Address"
                      {...form.register("reference1Address")}
                      placeholder="Dirección completa de la referencia personal"
                      rows={2}
                      data-testid="textarea-reference1-address"
                    />
                  </div>
                </div>
              )}

              {/* Step 7: Datos del Garante */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <div className="flex items-start space-x-2 p-4 border rounded-lg">
                    <Checkbox
                      id="hasGuarantor"
                      checked={form.watch("hasGuarantor")}
                      onCheckedChange={(checked) => form.setValue("hasGuarantor", checked as boolean)}
                      data-testid="checkbox-has-guarantor"
                    />
                    <div>
                      <Label htmlFor="hasGuarantor" className="cursor-pointer font-semibold">
                        Aplicaré con Garante o Co-Signer
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Si cuentas con un garante o co-signer, marca esta casilla y completa la información a continuación
                      </p>
                    </div>
                  </div>

                  {form.watch("hasGuarantor") && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h4 className="font-semibold">Información del Garante</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="guarantorFullName">Nombre Completo</Label>
                          <Input
                            id="guarantorFullName"
                            {...form.register("guarantorFullName")}
                            placeholder="Pedro Sánchez Morales"
                            data-testid="input-guarantor-full-name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="guarantorEmail">Correo Electrónico</Label>
                          <Input
                            id="guarantorEmail"
                            type="email"
                            {...form.register("guarantorEmail")}
                            placeholder="pedro@ejemplo.com"
                            data-testid="input-guarantor-email"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="guarantorBirthDatePlace">Fecha y Lugar de Nacimiento</Label>
                          <Input
                            id="guarantorBirthDatePlace"
                            {...form.register("guarantorBirthDatePlace")}
                            placeholder="01/01/1980 - Ciudad de México"
                            data-testid="input-guarantor-birth-date-place"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="guarantorNationality">Nacionalidad</Label>
                          <Input
                            id="guarantorNationality"
                            {...form.register("guarantorNationality")}
                            placeholder="Mexicana"
                            data-testid="input-guarantor-nationality"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="guarantorAge">Edad</Label>
                          <Input
                            id="guarantorAge"
                            type="number"
                            min="18"
                            max="150"
                            {...form.register("guarantorAge", { valueAsNumber: true })}
                            placeholder="45"
                            data-testid="input-guarantor-age"
                          />
                          {form.formState.errors.guarantorAge && (
                            <p className="text-sm text-destructive">{form.formState.errors.guarantorAge.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="guarantorTimeInTulum">Tiempo Residiendo en Tulum</Label>
                          <Input
                            id="guarantorTimeInTulum"
                            {...form.register("guarantorTimeInTulum")}
                            placeholder="2 años"
                            data-testid="input-guarantor-time-in-tulum"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="guarantorJobPosition">Trabajo / Posición</Label>
                          <Input
                            id="guarantorJobPosition"
                            {...form.register("guarantorJobPosition")}
                            placeholder="Director Comercial"
                            data-testid="input-guarantor-job-position"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="guarantorCompanyName">Empresa para la que Trabaja</Label>
                          <Input
                            id="guarantorCompanyName"
                            {...form.register("guarantorCompanyName")}
                            placeholder="Empresa ABC S.A."
                            data-testid="input-guarantor-company-name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="guarantorWorkPhone">Teléfono del Trabajo</Label>
                          <Input
                            id="guarantorWorkPhone"
                            {...form.register("guarantorWorkPhone")}
                            placeholder="998 123 4567"
                            data-testid="input-guarantor-work-phone"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="guarantorMaritalStatus">Estado Civil</Label>
                          <Select onValueChange={(value) => form.setValue("guarantorMaritalStatus", value)}>
                            <SelectTrigger id="guarantorMaritalStatus" data-testid="select-guarantor-marital-status">
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
                          <Label htmlFor="guarantorLandline">Teléfono Fijo</Label>
                          <Input
                            id="guarantorLandline"
                            {...form.register("guarantorLandline")}
                            placeholder="998 123 4567"
                            data-testid="input-guarantor-landline"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="guarantorCellphone">Teléfono Celular</Label>
                          <Input
                            id="guarantorCellphone"
                            {...form.register("guarantorCellphone")}
                            placeholder="+52 123 456 7890"
                            data-testid="input-guarantor-cellphone"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="guarantorIdNumber">Número de Identificación o Pasaporte</Label>
                          <Input
                            id="guarantorIdNumber"
                            {...form.register("guarantorIdNumber")}
                            placeholder="INE o Pasaporte"
                            data-testid="input-guarantor-id-number"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="guarantorAddress">Dirección</Label>
                        <Textarea
                          id="guarantorAddress"
                          {...form.register("guarantorAddress")}
                          placeholder="Dirección completa del garante"
                          rows={2}
                          data-testid="textarea-guarantor-address"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="guarantorWorkAddress">Dirección del Trabajo</Label>
                        <Textarea
                          id="guarantorWorkAddress"
                          {...form.register("guarantorWorkAddress")}
                          placeholder="Dirección completa del lugar de trabajo"
                          rows={2}
                          data-testid="textarea-guarantor-work-address"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 8: Terms and Conditions */}
              {currentStep === 8 && (
                <div className="space-y-6">
                  <div className="p-6 border rounded-lg bg-muted/30 max-h-96 overflow-y-auto">
                    <h3 className="font-semibold text-lg mb-4">
                      {language === 'es' ? 'TÉRMINOS Y CONDICIONES' : 'TERMS AND CONDITIONS'}
                    </h3>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      {language === 'es' ? (
                        <>
                          <div>
                            <p className="font-semibold text-foreground">1.- TIEMPO DE PAGOS POR PLATAFORMAS:</p>
                            <p>ENTENDEMOS QUE CADA PLATAFORMA TIENE SU TIEMPO DE ESPERA Ó DE TRANSFERENCIA, PERO SÓLO SE CONSIDERA UNA TRANSFERENCIA COMO COMPLETADA, UNA VEZ QUE EL DINERO EFECTIVAMENTE SE VE REFLEJADO EN LA CUENTA DESTINO Y EL DESTINATARIO CONFIRMA LA RECEPCIÓN. PARA BANCOS Y/PLATAFORMAS NACIONALES E INTERNACIONALES, LOS RECIBOS SÓLO SE USAN COMO REFERENCIA PERO NO TIENEN VALIDEZ NI ACEPTACIÓN COMO PRUEBA PARA PRESENTAR ANTES DE LAS FECHAS ACORDADAS. PASANDO 5 DÍAS DE LA FECHA ESTIPULADA, LOS PRESENTES CONTRATOS CADUCARÁN Y SE PERDERÁ EL DEPÓSITO DEL APARTADO. ESTO APLICA PARA TRANSFERENCIAS NACIONALES E INTERNACIONALES DESDE PLATAFORMAS MÓVILES COMO WISE, VENMO, ZELLE, PAYPAL O CUALQUIER TIPO DE APLICACIÓN DE TRANSFERENCIA DE DINERO NACIONAL O INTERNACIONAL.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">2.- PRÓRROGAS DE TIEMPOS DE PAGO:</p>
                            <p>SOLAMENTE ES VÁLIDA UNA PRÓRROGA DE TIEMPO MEDIANTE UN ACUERDO MUTUO ENTRE LAS PARTES Y MODIFICANDO EL PRESENTE CONTRATO, CON AL MENOS 48 HS DE ANTICIPACIÓN A LA FECHA DESIGNADA.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">3.- COSTOS ADMINISTRATIVOS:</p>
                            <p>POR LA ELABORACIÓN DEL CONTRATO DE ARRENDAMIENTO LOS HONORARIOS A COBRAR SERÁN: $2.500 MXN PARA CONTRATOS DE USO DE PROPIEDAD PARA VIVIENDA PERSONAL, Ó $3.800 MXN PARA CONTRATOS DE RENTA PARA SUBARRENDAMIENTO LA CANTIDAD QUE CORRESPONDA DEBERA SER ABONADA EN UNA SOLA EXHIBICIÓN JUNTO CON EL MONTO CORRESPONDIENTE AL DEPOSITO PARA EL APARTADO DE LA UNIDAD.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">4.- RESERVA DE PROPIEDADES:</p>
                            <p>TANTO PARA PODER RESERVAR, BLOQUEAR FECHAS Y DEJAR DE PROMOCIONAR LA UNIDAD CON NUEVOS CLIENTES, ASI COMO PARA SOLICITAR AL ESTUDIO JURÍDICO LA ELABORACIÓN DEL CONTRATO CORRESPONDIENTE, PODRÁ SOLICITARSE DEPÓSITO PARA EL APARTADO DE LA PROPIEDAD ANTES DE LA FECHA DE LA FIRMA DE CONTRATO. POR LO QUE EL PROMITENTE ARRENDATARIO ACEPTA QUE PARA EL CASO DE CANCELACIÓN DE LA RESERVACIÓN POR CAUSA IMPUTABLE A ÉL, DICHO DEPOSITO SE CONSTITUIRÁ COMO LA PENALIZACIÓN DERIVADA DE DICHA CANCELACIÓN, POR LO QUE NO SE HARÁ LA DEVOLUCIÓN DEL DEPÓSITO NI DEL PAGO DEL CONTRATO.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">5.- AVISO DE PRIVACIDAD:</p>
                            <p>TODA LA INFORMACIÓN RECABADA SERÁ DE CARÁCTER CONFIDENCIAL Y DE NO DIVULGACIÓN DE ACUERDO A LOS ARTÍCULOS 15 Y 16 DE LA LEY FEDERAL DE PROTECCIÓN DE DATOS PERSONALES EN POSESIÓN DE PARTICULARES.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">6.- DECLARACIÓN JURADA DE INFORMACIÓN FIDEDIGNA:</p>
                            <p>PROMITENTE ARRENDATARIO Y GARANTE, BAJO PROTESTA DE DECIR VERDAD MANIFIESTAN QUE LA INFORMACIÓN PROPORCIONADA ES VERIDICA, ASUMIENDO ASÍ MISMO TODO TIPO DE RESPONSABILIDAD DERIVADA DE CUALQUIER DECLARACIÓN EN FALSO SOBRE LAS MISMAS, ASEGURANDO QUE EL DINERO CON EL CUAL SERÁ PAGADO DEPÓSITO Y ARRENDAMIENTO, NO PROVIENE DE ACTIVIDADES ILÍCITAS, POR LO QUE AUTORIZAMOS AL PROPIETARIO DEL INMUEBLE MATERIA DE ARRENDAMIENTO, A SUS ASESORES INMOBILIARIOS Y ABOGADO, A REALIZAR LAS INVESTIGACIONES CORRESPONDIENTES PARA CORROBORAR QUE LA INFORMACIÓN ES FIDEDIGNA Y A QUE REALICE LA INVESTIGACIÓN DE INCIDENCIAS LEGALES CORRESPONDIENTE.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">7.- TOLERANCIA AMBIENTAL Y FALLA EN LOS SERVICIOS:</p>
                            <p>EL ARRENDATARIO RECONOCE QUE, DEBIDO A LA UBICACIÓN GEOGRÁFICA Y CARACTERÍSTICAS NATURALES DE LA ZONA, PUEDEN PRESENTARSE FENÓMENOS COMO HUMEDAD EXCESIVA (HONGOS), APARICIÓN DE FAUNA LOCAL (INSECTOS, GECKOS, ETC.) O SARGAZO EN ZONAS CERCANAS ASI COMO LA FALLA DE LOS SERVICIOS BASICOS COMO LUZ, AGUA E INTERNET, Y QUE ESTAS SITUACIONES NO SERÁN CONSIDERADAS CAUSA DE INCUMPLIMIENTO NI PARA SOLICITUD DE COMPENSACIONES NI RESCINCION DEL CONTRATO.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">8.- CANCELACIÓN POR CAUSA DE FUERZA COMERCIAL:</p>
                            <p>EN CASO DE QUE LA PROPIEDAD SEA PUESTA EN VENTA Y SE CONCRETE UNA OFERTA DE COMPRA FORMAL, EL ARRENDADOR PODRÁ CANCELAR EL CONTRATO CON 60 DÍAS DE PREAVISO Y SIN PENALIZACIÓN, REEMBOLSANDO ÍNTEGRAMENTE EL DEPÓSITO Y CUALQUIER RENTA PAGADA POR ADELANTADO.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">9.- USO DE ÁREAS COMUNES:</p>
                            <p>EL ARRENDATARIO SE COMPROMETE A CUMPLIR EL REGLAMENTO DEL CONDOMINIO O INTERNO DEL APARTAMENTO, INCLUYENDO HORARIOS DE USO DE AMENIDADES, NORMAS DE CONVIVENCIA, Y USO RESPONSABLE DE ÁREAS COMO ALBERCA, GIMNASIO O ROOF GARDEN. CUALQUIER MULTA IMPUESTA POR LA ADMINISTRACIÓN Y/O PROPIETARIO SERÁ RESPONSABILIDAD DEL ARRENDATARIO Y POSIBLE RESCINCION DEL CONTRATO EN CASO DE QUE QUE ADQUIERA MULTAS REITERADAS.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">10.- CAMBIO DE MONEDA:</p>
                            <p>EN CONTRATOS CELEBRADOS CON PERSONAS DE NACIONALIDAD EXTRANJERA, LOS MONTOS ESTABLECIDOS SERÁN DEFINIDOS EN PESOS MEXICANOS (MXN) Y DEBERÁN SER PAGADOS EN LA MISMA MONEDA EN LA QUE SE FIRMÓ EL CONTRATO, UTILIZANDO EL TIPO DE CAMBIO VIGENTE AL DÍA DE LA TRANSACCIÓN.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">11.- DECLARACIÓN DE IDIOMA Y ENTENDIMIENTO:</p>
                            <p>EN CONTRATOS CON PERSONAS DE NACIONALIDAD EXTRANJERA O VERSIONES BILINGÜES SE ANEXARA LA SIGUIENTE CLAUSULA: "LAS PARTES DECLARAN QUE HAN ENTENDIDO ÍNTEGRAMENTE EL CONTENIDO DE ESTE CONTRATO EN SU IDIOMA NATIVO O IDIOMA DE PREFERENCIA, Y QUE EN CASO DE DISCREPANCIA ENTRE VERSIONES, PREVALECERÁ LA VERSIÓN EN ESPAÑOL."</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">12.- TOLERANCIA ACÚSTICA URBANA:</p>
                            <p>EL ARRENDATARIO RECONOCE QUE EL INMUEBLE SE UBICA EN UNA ZONA URBANA, TURÍSTICA O EN DESARROLLO, POR LO QUE ACEPTA LA POSIBILIDAD DE RUIDOS OCASIONALES (TRÁFICO, MÚSICA, OBRAS) Y QUE ESTOS NO CONSTITUYEN MOTIVO DE QUEJA, RESCISIÓN NI SOLICITUD DE REEMBOLSO.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">13.- MANTENIMIENTOS Y REPARACIONES:</p>
                            <p>A PARTIR DE LOS 30 DÍAS POSTERIORES AL INICIO DEL CONTRATO DE ARRENDAMIENTO, EL INQUILINO SERÁ RESPONSABLE DE REALIZAR EL MANTENIMIENTO PREVENTIVO DE LOS AIRES ACONDICIONADOS CADA SEIS (6) MESES Y/O AL MOMENTO DE SU SALIDA (CHECK-OUT) DE LA PROPIEDAD. ASIMISMO, SERÁ RESPONSABLE DE CUBRIR CUALQUIER REPARACIÓN DE ARTÍCULOS, ELECTRODOMÉSTICOS O MOBILIARIO QUE PRESENTE DESPERFECTOS NO REPORTADOS DENTRO DE LOS PRIMEROS 30 DÍAS DE VIGENCIA DEL CONTRATO.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="font-semibold text-foreground">1.- PAYMENT TIMING BY PLATFORMS:</p>
                            <p>WE UNDERSTAND THAT EACH PLATFORM HAS ITS WAITING OR TRANSFER TIME, BUT A TRANSFER IS ONLY CONSIDERED COMPLETE ONCE THE MONEY IS ACTUALLY REFLECTED IN THE DESTINATION ACCOUNT AND THE RECIPIENT CONFIRMS RECEIPT. FOR NATIONAL AND INTERNATIONAL BANKS AND/PLATFORMS, RECEIPTS ARE ONLY USED AS A REFERENCE BUT HAVE NO VALIDITY OR ACCEPTANCE AS PROOF TO BE PRESENTED BEFORE THE AGREED DATES. AFTER 5 DAYS FROM THE STIPULATED DATE, THE PRESENT CONTRACTS WILL EXPIRE AND THE RESERVATION DEPOSIT WILL BE FORFEITED. THIS APPLIES TO NATIONAL AND INTERNATIONAL TRANSFERS FROM MOBILE PLATFORMS SUCH AS WISE, VENMO, ZELLE, PAYPAL OR ANY TYPE OF NATIONAL OR INTERNATIONAL MONEY TRANSFER APPLICATION.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">2.- PAYMENT TIME EXTENSIONS:</p>
                            <p>A TIME EXTENSION IS ONLY VALID THROUGH A MUTUAL AGREEMENT BETWEEN THE PARTIES AND BY MODIFYING THIS CONTRACT, WITH AT LEAST 48 HOURS IN ADVANCE OF THE DESIGNATED DATE.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">3.- ADMINISTRATIVE COSTS:</p>
                            <p>FOR THE PREPARATION OF THE LEASE AGREEMENT, THE FEES TO BE CHARGED WILL BE: $2,500 MXN FOR CONTRACTS FOR USE OF PROPERTY FOR PERSONAL HOUSING, OR $3,800 MXN FOR RENTAL CONTRACTS FOR SUBLEASING. THE CORRESPONDING AMOUNT MUST BE PAID IN A SINGLE PAYMENT ALONG WITH THE AMOUNT CORRESPONDING TO THE DEPOSIT FOR THE RESERVATION OF THE UNIT.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">4.- PROPERTY RESERVATION:</p>
                            <p>TO BE ABLE TO RESERVE, BLOCK DATES AND STOP PROMOTING THE UNIT TO NEW CLIENTS, AS WELL AS TO REQUEST THE LEGAL OFFICE TO PREPARE THE CORRESPONDING CONTRACT, A DEPOSIT MAY BE REQUESTED FOR THE RESERVATION OF THE PROPERTY BEFORE THE CONTRACT SIGNING DATE. THEREFORE, THE PROSPECTIVE TENANT ACCEPTS THAT IN THE EVENT OF CANCELLATION OF THE RESERVATION DUE TO A CAUSE ATTRIBUTABLE TO THEM, SAID DEPOSIT WILL CONSTITUTE THE PENALTY DERIVED FROM SAID CANCELLATION, SO THE DEPOSIT AND CONTRACT PAYMENT WILL NOT BE REFUNDED.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">5.- PRIVACY NOTICE:</p>
                            <p>ALL INFORMATION COLLECTED WILL BE CONFIDENTIAL AND NON-DISCLOSURE IN ACCORDANCE WITH ARTICLES 15 AND 16 OF THE FEDERAL LAW ON PROTECTION OF PERSONAL DATA HELD BY PRIVATE PARTIES.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">6.- SWORN STATEMENT OF RELIABLE INFORMATION:</p>
                            <p>PROSPECTIVE TENANT AND GUARANTOR, UNDER OATH TO TELL THE TRUTH, DECLARE THAT THE INFORMATION PROVIDED IS TRUE, ASSUMING ALL RESPONSIBILITY DERIVED FROM ANY FALSE STATEMENT ABOUT THEM, ENSURING THAT THE MONEY WITH WHICH THE DEPOSIT AND RENT WILL BE PAID DOES NOT COME FROM ILLEGAL ACTIVITIES. THEREFORE, WE AUTHORIZE THE OWNER OF THE PROPERTY SUBJECT TO LEASE, THEIR REAL ESTATE ADVISORS AND LAWYER, TO CARRY OUT THE CORRESPONDING INVESTIGATIONS TO VERIFY THAT THE INFORMATION IS RELIABLE AND TO CARRY OUT THE CORRESPONDING LEGAL BACKGROUND INVESTIGATION.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">7.- ENVIRONMENTAL TOLERANCE AND SERVICE FAILURES:</p>
                            <p>THE TENANT ACKNOWLEDGES THAT, DUE TO THE GEOGRAPHICAL LOCATION AND NATURAL CHARACTERISTICS OF THE AREA, PHENOMENA MAY OCCUR SUCH AS EXCESSIVE HUMIDITY (MOLD), APPEARANCE OF LOCAL FAUNA (INSECTS, GECKOS, ETC.) OR SARGASSUM IN NEARBY AREAS AS WELL AS FAILURE OF BASIC SERVICES SUCH AS ELECTRICITY, WATER AND INTERNET, AND THAT THESE SITUATIONS WILL NOT BE CONSIDERED GROUNDS FOR BREACH OR FOR REQUESTING COMPENSATION OR TERMINATION OF THE CONTRACT.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">8.- CANCELLATION DUE TO COMMERCIAL FORCE MAJEURE:</p>
                            <p>IN THE EVENT THAT THE PROPERTY IS PUT UP FOR SALE AND A FORMAL PURCHASE OFFER IS FINALIZED, THE LANDLORD MAY CANCEL THE CONTRACT WITH 60 DAYS' NOTICE AND WITHOUT PENALTY, FULLY REFUNDING THE DEPOSIT AND ANY RENT PAID IN ADVANCE.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">9.- USE OF COMMON AREAS:</p>
                            <p>THE TENANT AGREES TO COMPLY WITH THE CONDOMINIUM OR APARTMENT INTERNAL REGULATIONS, INCLUDING AMENITY USAGE HOURS, COEXISTENCE RULES, AND RESPONSIBLE USE OF AREAS SUCH AS POOL, GYM OR ROOF GARDEN. ANY FINE IMPOSED BY THE ADMINISTRATION AND/OR OWNER WILL BE THE RESPONSIBILITY OF THE TENANT AND POSSIBLE TERMINATION OF THE CONTRACT IN CASE OF REPEATED FINES.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">10.- CURRENCY EXCHANGE:</p>
                            <p>IN CONTRACTS ENTERED INTO WITH PERSONS OF FOREIGN NATIONALITY, THE AMOUNTS ESTABLISHED WILL BE DEFINED IN MEXICAN PESOS (MXN) AND MUST BE PAID IN THE SAME CURRENCY IN WHICH THE CONTRACT WAS SIGNED, USING THE EXCHANGE RATE IN EFFECT ON THE DAY OF THE TRANSACTION.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">11.- LANGUAGE AND UNDERSTANDING DECLARATION:</p>
                            <p>IN CONTRACTS WITH PERSONS OF FOREIGN NATIONALITY OR BILINGUAL VERSIONS, THE FOLLOWING CLAUSE WILL BE ATTACHED: "THE PARTIES DECLARE THAT THEY HAVE FULLY UNDERSTOOD THE CONTENT OF THIS CONTRACT IN THEIR NATIVE LANGUAGE OR LANGUAGE OF PREFERENCE, AND THAT IN CASE OF DISCREPANCY BETWEEN VERSIONS, THE SPANISH VERSION WILL PREVAIL."</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">12.- URBAN ACOUSTIC TOLERANCE:</p>
                            <p>THE TENANT ACKNOWLEDGES THAT THE PROPERTY IS LOCATED IN AN URBAN, TOURIST OR DEVELOPING AREA, SO THEY ACCEPT THE POSSIBILITY OF OCCASIONAL NOISE (TRAFFIC, MUSIC, CONSTRUCTION) AND THAT THESE DO NOT CONSTITUTE GROUNDS FOR COMPLAINT, TERMINATION OR REQUEST FOR REFUND.</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">13.- MAINTENANCE AND REPAIRS:</p>
                            <p>STARTING 30 DAYS AFTER THE START OF THE LEASE AGREEMENT, THE TENANT WILL BE RESPONSIBLE FOR PERFORMING PREVENTIVE MAINTENANCE ON THE AIR CONDITIONERS EVERY SIX (6) MONTHS AND/OR AT THE TIME OF THEIR DEPARTURE (CHECK-OUT) FROM THE PROPERTY. LIKEWISE, THEY WILL BE RESPONSIBLE FOR COVERING ANY REPAIR OF ITEMS, APPLIANCES OR FURNITURE THAT PRESENT DEFECTS NOT REPORTED WITHIN THE FIRST 30 DAYS OF THE CONTRACT'S VALIDITY.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptedTerms"
                      checked={form.watch("acceptedTerms")}
                      onCheckedChange={(checked) => {
                        form.setValue("acceptedTerms", checked === true);
                      }}
                      data-testid="checkbox-terms-accepted"
                    />
                    <Label htmlFor="acceptedTerms" className="cursor-pointer text-sm leading-relaxed">
                      {language === 'es' 
                        ? 'Acepto los términos y condiciones anteriores y confirmo que toda la información proporcionada es verdadera y correcta. *'
                        : 'I accept the above terms and conditions and confirm that all information provided is true and correct. *'}
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
