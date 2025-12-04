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
  Briefcase, 
  FileText, 
  CheckCircle2,
  Building2,
  MapPin,
  Award,
  Upload,
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

const SPECIALIZATIONS = [
  { value: "rentals", label: "Rentas" },
  { value: "sales", label: "Ventas" },
  { value: "luxury", label: "Propiedades de Lujo" },
  { value: "vacation", label: "Vacacional" },
  { value: "investment", label: "Inversiones" },
  { value: "land", label: "Terrenos" },
];

const HOW_DID_YOU_HEAR = [
  { value: "social_media", label: "Redes Sociales" },
  { value: "referral", label: "Referido por alguien" },
  { value: "google", label: "Google" },
  { value: "website", label: "Sitio Web" },
  { value: "event", label: "Evento" },
  { value: "other", label: "Otro" },
];

const sellerApplicationFormSchema = z.object({
  firstName: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "Apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phoneCountryCode: z.string().default("+52"),
  phone: z.string().min(10, "Teléfono debe tener al menos 10 dígitos"),
  yearsOfExperience: z.coerce.number().min(0).optional(),
  currentCompany: z.string().optional(),
  hasRealEstateLicense: z.boolean().default(false),
  licenseNumber: z.string().optional(),
  specializations: z.array(z.string()).default([]),
  zonesOfInterest: z.array(z.string()).default([]),
  motivation: z.string().optional(),
  howDidYouHear: z.string().optional(),
  referredBy: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, "Debes aceptar los términos"),
  privacyAccepted: z.boolean().refine(val => val === true, "Debes aceptar la política de privacidad"),
});

type SellerApplicationFormData = z.infer<typeof sellerApplicationFormSchema>;

const STEPS = [
  { id: "personal", label: "Datos Personales", icon: User },
  { id: "professional", label: "Experiencia", icon: Briefcase },
  { id: "interests", label: "Intereses", icon: MapPin },
  { id: "confirm", label: "Confirmar", icon: CheckCircle2 },
];

export default function SellerApplicationPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<SellerApplicationFormData>({
    resolver: zodResolver(sellerApplicationFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneCountryCode: "+52",
      phone: "",
      yearsOfExperience: 0,
      currentCompany: "",
      hasRealEstateLicense: false,
      licenseNumber: "",
      specializations: [],
      zonesOfInterest: [],
      motivation: "",
      howDidYouHear: "",
      referredBy: "",
      termsAccepted: false,
      privacyAccepted: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SellerApplicationFormData) => {
      return apiRequest("/api/public/seller-applications", {
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

  const getFieldsForStep = (step: number): (keyof SellerApplicationFormData)[] => {
    switch (step) {
      case 0: return ["firstName", "lastName", "email", "phone"];
      case 1: return ["yearsOfExperience", "hasRealEstateLicense"];
      case 2: return ["specializations", "zonesOfInterest"];
      case 3: return ["termsAccepted", "privacyAccepted"];
      default: return [];
    }
  };

  const onSubmit = (data: SellerApplicationFormData) => {
    submitMutation.mutate(data);
  };

  const toggleSpecialization = (value: string) => {
    const current = form.getValues("specializations") || [];
    if (current.includes(value)) {
      form.setValue("specializations", current.filter(s => s !== value));
    } else {
      form.setValue("specializations", [...current, value]);
    }
  };

  const toggleZone = (value: string) => {
    const current = form.getValues("zonesOfInterest") || [];
    if (current.includes(value)) {
      form.setValue("zonesOfInterest", current.filter(z => z !== value));
    } else {
      form.setValue("zonesOfInterest", [...current, value]);
    }
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
              Gracias por tu interés en unirte a nuestro equipo. Hemos recibido tu solicitud y la revisaremos pronto.
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
          <Building2 className="w-12 h-12 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Únete a Nuestro Equipo</h1>
          <p className="text-muted-foreground">
            Completa el formulario para aplicar como agente de bienes raíces en Tulum
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
              {currentStep === 1 && "Tu experiencia profesional"}
              {currentStep === 2 && "Áreas de interés y especialización"}
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
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="yearsOfExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Años de experiencia en bienes raíces</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="number" 
                                min={0}
                                className="pl-10"
                                {...field} 
                                data-testid="input-experience" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currentCompany"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Empresa actual (opcional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="Nombre de la empresa" 
                                className="pl-10"
                                {...field} 
                                data-testid="input-company" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hasRealEstateLicense"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-license"
                            />
                          </FormControl>
                          <div className="flex-1">
                            <FormLabel className="cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4" />
                                Tengo licencia de bienes raíces
                              </div>
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    {form.watch("hasRealEstateLicense") && (
                      <FormField
                        control={form.control}
                        name="licenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de licencia</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ABC-12345" 
                                {...field} 
                                data-testid="input-license-number" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {form.watch("howDidYouHear") === "referral" && (
                      <FormField
                        control={form.control}
                        name="referredBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>¿Quién te refirió?</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nombre del referidor" 
                                {...field} 
                                data-testid="input-referred-by" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="mb-3 block">Especialización (selecciona todas las que apliquen)</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {SPECIALIZATIONS.map(spec => {
                          const selected = (form.watch("specializations") || []).includes(spec.value);
                          return (
                            <button
                              key={spec.value}
                              type="button"
                              onClick={() => toggleSpecialization(spec.value)}
                              className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                                selected
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                              data-testid={`button-specialization-${spec.value}`}
                            >
                              <div className="flex items-center gap-2">
                                {selected && <Check className="h-4 w-4 text-primary" />}
                                {spec.label}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <Label className="mb-3 block">Zonas de interés en Tulum</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {TULUM_ZONES.map(zone => {
                          const selected = (form.watch("zonesOfInterest") || []).includes(zone);
                          return (
                            <button
                              key={zone}
                              type="button"
                              onClick={() => toggleZone(zone)}
                              className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                                selected
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                              data-testid={`button-zone-${zone.toLowerCase().replace(/\s/g, "-")}`}
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className={`h-4 w-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                                {zone}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="motivation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>¿Por qué quieres unirte a nuestro equipo? (opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Cuéntanos sobre tu motivación..."
                              rows={4}
                              {...field} 
                              data-testid="textarea-motivation" 
                            />
                          </FormControl>
                          <FormMessage />
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
                          <span className="text-muted-foreground">Nombre:</span>
                          <p className="font-medium">{form.watch("firstName")} {form.watch("lastName")}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p className="font-medium">{form.watch("email")}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Teléfono:</span>
                          <p className="font-medium">{form.watch("phoneCountryCode")} {form.watch("phone")}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Experiencia:</span>
                          <p className="font-medium">{form.watch("yearsOfExperience") || 0} años</p>
                        </div>
                      </div>
                      {(form.watch("specializations") || []).length > 0 && (
                        <div>
                          <span className="text-muted-foreground text-sm">Especializaciones:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(form.watch("specializations") || []).map(s => (
                              <Badge key={s} variant="secondary" className="text-xs">
                                {SPECIALIZATIONS.find(sp => sp.value === s)?.label || s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {(form.watch("zonesOfInterest") || []).length > 0 && (
                        <div>
                          <span className="text-muted-foreground text-sm">Zonas:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(form.watch("zonesOfInterest") || []).map(z => (
                              <Badge key={z} variant="outline" className="text-xs">
                                {z}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
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
