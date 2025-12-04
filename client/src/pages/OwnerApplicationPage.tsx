import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation } from "wouter";
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  User, 
  Home, 
  DollarSign, 
  CheckCircle2,
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Loader2,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";

const TULUM_ZONES = [
  "Tulum Centro",
  "Aldea Zama",
  "La Veleta",
  "Region 15",
  "Holistika",
  "Selva Zama",
  "Tumben Kah",
  "Artia",
  "Tankah Bay",
  "Sian Ka'an",
];

const PROPERTY_TYPES = [
  { value: "condo", label: "Condominio" },
  { value: "house", label: "Casa" },
  { value: "studio", label: "Estudio" },
  { value: "penthouse", label: "Penthouse" },
  { value: "land", label: "Terreno" },
  { value: "commercial", label: "Local Comercial" },
];

const RENTAL_GOALS = [
  { value: "long_term", label: "Renta de largo plazo (6+ meses)" },
  { value: "short_term", label: "Renta vacacional (corto plazo)" },
  { value: "both", label: "Ambas opciones" },
];

const HOW_DID_YOU_HEAR = [
  { value: "social_media", label: "Redes Sociales" },
  { value: "referral", label: "Referido por alguien" },
  { value: "google", label: "Google" },
  { value: "website", label: "Sitio Web" },
  { value: "event", label: "Evento" },
  { value: "other", label: "Otro" },
];

const ownerApplicationFormSchema = z.object({
  firstName: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "Apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phoneCountryCode: z.string().default("+52"),
  phone: z.string().min(10, "Teléfono debe tener al menos 10 dígitos"),
  preferredLanguage: z.string().default("es"),
  propertyType: z.string().optional(),
  propertyAddress: z.string().optional(),
  propertyZone: z.string().optional(),
  condominiumName: z.string().optional(),
  numberOfBedrooms: z.coerce.number().min(0).optional(),
  numberOfBathrooms: z.coerce.number().min(0).optional(),
  squareMeters: z.coerce.number().min(0).optional(),
  rentalGoal: z.string().optional(),
  expectedMonthlyRent: z.coerce.number().min(0).optional(),
  isCurrentlyRented: z.boolean().default(false),
  additionalNotes: z.string().optional(),
  howDidYouHear: z.string().optional(),
  referredBy: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, "Debes aceptar los términos"),
  privacyAccepted: z.boolean().refine(val => val === true, "Debes aceptar la política de privacidad"),
});

type OwnerApplicationFormData = z.infer<typeof ownerApplicationFormSchema>;

const STEPS = [
  { id: "personal", label: "Datos Personales", icon: User },
  { id: "property", label: "Propiedad", icon: Home },
  { id: "goals", label: "Objetivos", icon: DollarSign },
  { id: "confirm", label: "Confirmar", icon: CheckCircle2 },
];

export default function OwnerApplicationPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<OwnerApplicationFormData>({
    resolver: zodResolver(ownerApplicationFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneCountryCode: "+52",
      phone: "",
      preferredLanguage: "es",
      propertyType: "",
      propertyAddress: "",
      propertyZone: "",
      condominiumName: "",
      numberOfBedrooms: 0,
      numberOfBathrooms: 0,
      squareMeters: 0,
      rentalGoal: "",
      expectedMonthlyRent: 0,
      isCurrentlyRented: false,
      additionalNotes: "",
      howDidYouHear: "",
      referredBy: "",
      termsAccepted: false,
      privacyAccepted: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: OwnerApplicationFormData) => {
      return apiRequest("/api/public/owner-applications", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (response: any) => {
      setIsSubmitted(true);
      setApplicationId(response.applicationId);
      toast({
        title: "Aplicación enviada",
        description: "Tu solicitud ha sido recibida. Te contactaremos pronto.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo enviar la aplicación",
        variant: "destructive",
      });
    },
  });

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof OwnerApplicationFormData)[] => {
    switch (step) {
      case 0: return ["firstName", "lastName", "email", "phone"];
      case 1: return ["propertyType", "propertyZone"];
      case 2: return ["rentalGoal"];
      case 3: return ["termsAccepted", "privacyAccepted"];
      default: return [];
    }
  };

  const onSubmit = (data: OwnerApplicationFormData) => {
    submitMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">¡Aplicación Recibida!</h2>
            <p className="text-muted-foreground">
              Gracias por confiar en nosotros para administrar tu propiedad. Nuestro equipo revisará tu solicitud y te contactará pronto.
            </p>
            {applicationId && (
              <Badge variant="secondary" className="text-xs">
                ID de Aplicación: {applicationId.substring(0, 8)}...
              </Badge>
            )}
            <div className="pt-4">
              <Button onClick={() => navigate("/")} data-testid="button-go-home">
                Volver al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <Home className="w-12 h-12 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Registra tu Propiedad</h1>
          <p className="text-muted-foreground">
            Administramos tu propiedad en Tulum con los mejores estándares del mercado
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    index <= currentStep ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      index < currentStep
                        ? "bg-primary text-primary-foreground"
                        : index === currentStep
                        ? "border-2 border-primary bg-background"
                        : "border-2 border-muted bg-background"
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs hidden sm:block">{step.label}</span>
                </div>
              );
            })}
          </div>
          <Progress value={(currentStep / (STEPS.length - 1)) * 100} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep].label}</CardTitle>
            <CardDescription>
              {currentStep === 0 && "Cuéntanos sobre ti"}
              {currentStep === 1 && "Información de tu propiedad"}
              {currentStep === 2 && "Tus objetivos de renta"}
              {currentStep === 3 && "Revisa y confirma tu aplicación"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Tu nombre" {...field} data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellido</FormLabel>
                            <FormControl>
                              <Input placeholder="Tu apellido" {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="email" 
                                placeholder="tu@email.com" 
                                className="pl-10"
                                {...field} 
                                data-testid="input-email" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-4 gap-2">
                      <FormField
                        control={form.control}
                        name="phoneCountryCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>País</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-country-code">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="+52">+52</SelectItem>
                                <SelectItem value="+1">+1</SelectItem>
                                <SelectItem value="+44">+44</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem className="col-span-3">
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="tel" 
                                  placeholder="10 dígitos" 
                                  className="pl-10"
                                  {...field} 
                                  data-testid="input-phone" 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="preferredLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Idioma preferido</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-language">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de propiedad</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-property-type">
                                <SelectValue placeholder="Selecciona el tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROPERTY_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="propertyZone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zona de la propiedad</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-property-zone">
                                <SelectValue placeholder="Selecciona la zona" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TULUM_ZONES.map(zone => (
                                <SelectItem key={zone} value={zone}>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {zone}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="condominiumName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del condominio (si aplica)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="Ej: Aldea Premium" 
                                className="pl-10"
                                {...field} 
                                data-testid="input-condo-name" 
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name="numberOfBedrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recámaras</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="number" 
                                  min={0}
                                  className="pl-10"
                                  {...field} 
                                  data-testid="input-bedrooms" 
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="numberOfBathrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Baños</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="number" 
                                  min={0}
                                  step={0.5}
                                  className="pl-10"
                                  {...field} 
                                  data-testid="input-bathrooms" 
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="squareMeters"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>m² construidos</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Maximize2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="number" 
                                  min={0}
                                  className="pl-10"
                                  {...field} 
                                  data-testid="input-sqm" 
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="propertyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección (opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Dirección completa de la propiedad"
                              rows={2}
                              {...field} 
                              data-testid="input-address" 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="rentalGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Objetivo de renta</FormLabel>
                          <div className="space-y-2">
                            {RENTAL_GOALS.map(goal => (
                              <button
                                key={goal.value}
                                type="button"
                                onClick={() => field.onChange(goal.value)}
                                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                                  field.value === goal.value
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                }`}
                                data-testid={`button-goal-${goal.value}`}
                              >
                                <div className="flex items-center gap-3">
                                  {field.value === goal.value && <Check className="h-5 w-5 text-primary" />}
                                  <span>{goal.label}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expectedMonthlyRent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renta mensual esperada (MXN)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="number" 
                                min={0}
                                placeholder="Ej: 25000"
                                className="pl-10"
                                {...field} 
                                data-testid="input-expected-rent" 
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isCurrentlyRented"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-currently-rented"
                            />
                          </FormControl>
                          <div className="flex-1">
                            <FormLabel className="cursor-pointer">
                              La propiedad está actualmente rentada
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="howDidYouHear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>¿Cómo te enteraste de nosotros?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-how-heard">
                                <SelectValue placeholder="Selecciona una opción" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {HOW_DID_YOU_HEAR.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="additionalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas adicionales (opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="¿Hay algo más que debamos saber sobre tu propiedad?"
                              rows={3}
                              {...field} 
                              data-testid="textarea-notes" 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="rounded-lg border p-4 space-y-3">
                      <h3 className="font-medium">Resumen de tu aplicación</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Propietario:</span>
                          <p className="font-medium">{form.watch("firstName")} {form.watch("lastName")}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p className="font-medium">{form.watch("email")}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tipo:</span>
                          <p className="font-medium">
                            {PROPERTY_TYPES.find(t => t.value === form.watch("propertyType"))?.label || "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Zona:</span>
                          <p className="font-medium">{form.watch("propertyZone") || "-"}</p>
                        </div>
                        {form.watch("condominiumName") && (
                          <div>
                            <span className="text-muted-foreground">Condominio:</span>
                            <p className="font-medium">{form.watch("condominiumName")}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Características:</span>
                          <p className="font-medium">
                            {form.watch("numberOfBedrooms") || 0} rec · {form.watch("numberOfBathrooms") || 0} baños · {form.watch("squareMeters") || 0}m²
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Objetivo:</span>
                          <p className="font-medium">
                            {RENTAL_GOALS.find(g => g.value === form.watch("rentalGoal"))?.label || "-"}
                          </p>
                        </div>
                        {form.watch("expectedMonthlyRent") && Number(form.watch("expectedMonthlyRent")) > 0 && (
                          <div>
                            <span className="text-muted-foreground">Renta esperada:</span>
                            <p className="font-medium">${Number(form.watch("expectedMonthlyRent")).toLocaleString()} MXN/mes</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="termsAccepted"
                        render={({ field }) => (
                          <FormItem className="flex items-start gap-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-terms"
                              />
                            </FormControl>
                            <div className="flex-1">
                              <FormLabel className="cursor-pointer text-sm">
                                Acepto los <a href="/terms" className="text-primary underline" target="_blank">Términos y Condiciones</a>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="privacyAccepted"
                        render={({ field }) => (
                          <FormItem className="flex items-start gap-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-privacy"
                              />
                            </FormControl>
                            <div className="flex-1">
                              <FormLabel className="cursor-pointer text-sm">
                                Acepto la <a href="/privacy" className="text-primary underline" target="_blank">Política de Privacidad</a>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    data-testid="button-prev-step"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>
                  {currentStep < STEPS.length - 1 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      data-testid="button-next-step"
                    >
                      Siguiente
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={submitMutation.isPending}
                      data-testid="button-submit-application"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Enviar Aplicación
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
