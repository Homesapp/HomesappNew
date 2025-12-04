import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Building2, Loader2, ChevronLeft, ChevronRight, ChevronDown, Home, Calendar, PawPrint, Bed, MapPin, DollarSign } from "lucide-react";
import { useState } from "react";
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

const translations = {
  es: {
    pageTitle: "Registro de Cliente",
    pageDescription: "Complete sus datos y preferencias para que podamos ayudarle a encontrar la propiedad ideal",
    smartRealEstate: "Smart Real Estate",
    step1Title: "Información Personal",
    step1Desc: "Datos de contacto",
    step2Title: "Preferencias de Búsqueda",
    step2Desc: "¿Qué está buscando?",
    firstName: "Nombre",
    lastName: "Apellido",
    email: "Correo Electrónico",
    emailPlaceholder: "ejemplo@email.com",
    phone: "Teléfono",
    phonePlaceholder: "+52 998 123 4567",
    countryCode: "Lada",
    contractDuration: "Duración del Contrato",
    selectDuration: "Seleccionar duración",
    months6: "6 meses",
    year1: "1 año",
    years2: "2 años",
    years3Plus: "3+ años",
    checkInDate: "Fecha de Mudanza Deseada",
    pets: "Mascotas",
    hasPetsQuestion: "¿Tiene mascotas?",
    petNo: "No",
    pet1Dog: "1 Perro",
    pet2Dogs: "2 Perros",
    pet1Cat: "1 Gato",
    pet2Cats: "2 Gatos",
    petOther: "Otro",
    budget: "Presupuesto de Renta (MXN)",
    budgetMin: "Mínimo",
    budgetMax: "Máximo",
    bedrooms: "Recámaras",
    selectBedrooms: "Seleccionar",
    studio: "Estudio",
    bedroomSingular: "recámara",
    bedroomsPlural: "recámaras",
    bedroomsPlus: "o más",
    zone: "Zona Preferida",
    zonePlaceholder: "Ej: Aldea Zama, La Veleta, Centro...",
    notes: "Información Adicional",
    notesPlaceholder: "Cuéntenos más sobre lo que busca, características especiales, etc...",
    previous: "Anterior",
    next: "Siguiente",
    submit: "Enviar Registro",
    submitting: "Enviando...",
    successTitle: "¡Registro Completado!",
    successDescription: "¡Gracias por registrarse! Un agente se pondrá en contacto con usted pronto para ayudarle a encontrar la propiedad ideal.",
    successToastTitle: "¡Registro Exitoso!",
    successToastDesc: "Gracias por completar su registro. Nos comunicaremos pronto.",
    errorTitle: "Error",
    errorDesc: "Hubo un problema al enviar su registro",
    validationFirstName: "Nombre requerido",
    validationLastName: "Apellido requerido",
    validationEmail: "Correo electrónico requerido",
    validationEmailInvalid: "Correo electrónico inválido",
    validationPhone: "Teléfono requerido",
    validationContractDuration: "Duración del contrato requerida",
    validationCheckIn: "Fecha de mudanza requerida",
    validationPets: "Información sobre mascotas requerida",
    validationBedrooms: "Número de recámaras requerido",
  },
  en: {
    pageTitle: "Client Registration",
    pageDescription: "Complete your details and preferences so we can help you find the ideal property",
    smartRealEstate: "Smart Real Estate",
    step1Title: "Personal Information",
    step1Desc: "Contact details",
    step2Title: "Search Preferences",
    step2Desc: "What are you looking for?",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    emailPlaceholder: "example@email.com",
    phone: "Phone",
    phonePlaceholder: "+1 555 123 4567",
    countryCode: "Code",
    contractDuration: "Contract Duration",
    selectDuration: "Select duration",
    months6: "6 months",
    year1: "1 year",
    years2: "2 years",
    years3Plus: "3+ years",
    checkInDate: "Desired Move-in Date",
    pets: "Pets",
    hasPetsQuestion: "Do you have pets?",
    petNo: "No",
    pet1Dog: "1 Dog",
    pet2Dogs: "2 Dogs",
    pet1Cat: "1 Cat",
    pet2Cats: "2 Cats",
    petOther: "Other",
    budget: "Rent Budget (MXN)",
    budgetMin: "Minimum",
    budgetMax: "Maximum",
    bedrooms: "Bedrooms",
    selectBedrooms: "Select",
    studio: "Studio",
    bedroomSingular: "bedroom",
    bedroomsPlural: "bedrooms",
    bedroomsPlus: "or more",
    zone: "Preferred Zone",
    zonePlaceholder: "E.g: Aldea Zama, La Veleta, Centro...",
    notes: "Additional Information",
    notesPlaceholder: "Tell us more about what you're looking for, special features, etc...",
    previous: "Previous",
    next: "Next",
    submit: "Submit Registration",
    submitting: "Submitting...",
    successTitle: "Registration Complete!",
    successDescription: "Thank you for registering! An agent will contact you soon to help you find the ideal property.",
    successToastTitle: "Registration Successful!",
    successToastDesc: "Thank you for completing your registration. We will contact you soon.",
    errorTitle: "Error",
    errorDesc: "There was a problem submitting your registration",
    validationFirstName: "First name required",
    validationLastName: "Last name required",
    validationEmail: "Email required",
    validationEmailInvalid: "Invalid email format",
    validationPhone: "Phone required",
    validationContractDuration: "Contract duration required",
    validationCheckIn: "Move-in date required",
    validationPets: "Pet information required",
    validationBedrooms: "Number of bedrooms required",
  }
};

const getClientFormSchema = (t: typeof translations.es) => z.object({
  firstName: z.string().min(1, t.validationFirstName),
  lastName: z.string().min(1, t.validationLastName),
  email: z.string().min(1, t.validationEmail).email(t.validationEmailInvalid),
  countryCode: z.string().default("+52"),
  phone: z.string().min(1, t.validationPhone),
  contractDuration: z.string().min(1, t.validationContractDuration),
  checkInDate: z.string().min(1, t.validationCheckIn),
  hasPets: z.string().min(1, t.validationPets),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  bedrooms: z.string().min(1, t.validationBedrooms),
  zone: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<ReturnType<typeof getClientFormSchema>>;

const getSteps = (t: typeof translations.es) => [
  { id: 1, title: t.step1Title, description: t.step1Desc },
  { id: 2, title: t.step2Title, description: t.step2Desc },
];

export default function LeadRegistrationClient() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const STEPS = getSteps(t);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const { data: agencyData } = useQuery<{ id: string; name: string; logoUrl: string }>({
    queryKey: ["/api/public/agency"],
    queryFn: async () => {
      const response = await fetch("/api/public/agency");
      if (!response.ok) return { id: "", name: "", logoUrl: "" };
      return response.json();
    },
    staleTime: 30 * 60 * 1000,
  });

  const form = useForm<ClientFormData>({
    resolver: zodResolver(getClientFormSchema(t)),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+52",
      phone: "",
      contractDuration: "",
      checkInDate: "",
      hasPets: "",
      budgetMin: undefined,
      budgetMax: undefined,
      bedrooms: "",
      zone: "",
      notes: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const response = await fetch("/api/public/leads/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          phone: `${data.countryCode} ${data.phone}`,
          registrationType: "client",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t.errorDesc);
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: t.successToastTitle,
        description: t.successToastDesc,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.errorTitle,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    submitMutation.mutate(data);
  };

  const nextStep = async () => {
    const fields = currentStep === 1 
      ? ["firstName", "lastName", "email", "phone"] as const
      : ["contractDuration", "checkInDate", "hasPets", "bedrooms"] as const;
    
    const isValid = await form.trigger(fields);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">{t.successTitle}</CardTitle>
            <CardDescription className="text-base mt-2">
              {t.successDescription}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-shrink-0">
              <img 
                src={logoPath} 
                alt="HomesApp Logo"
                className="h-16 md:h-20"
                data-testid="img-homesapp-logo"
              />
              <p className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">{t.smartRealEstate}</p>
            </div>
            {agencyData?.logoUrl && (
              <div className="flex-shrink-0 text-right">
                <img 
                  src={agencyData.logoUrl} 
                  alt={`${agencyData.name} Logo`}
                  className="h-16 md:h-20 w-16 md:w-20 rounded-full object-cover border-2 border-primary/20 ml-auto"
                  data-testid="img-agency-logo"
                />
                {agencyData.name && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{agencyData.name}</p>
                )}
              </div>
            )}
            <LanguageToggle />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Home className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-2xl">{t.pageTitle}</CardTitle>
                <CardDescription>{t.pageDescription}</CardDescription>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 
                    ${currentStep >= step.id 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground/30 text-muted-foreground'}`}>
                    {step.id}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.firstName} *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-firstname" />
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
                            <FormLabel>{t.lastName} *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-lastname" />
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
                          <FormLabel>{t.email} *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={t.emailPlaceholder} {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name="countryCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.countryCode}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-country-code">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="+52">+52 (MX)</SelectItem>
                                <SelectItem value="+1">+1 (US/CA)</SelectItem>
                                <SelectItem value="+44">+44 (UK)</SelectItem>
                                <SelectItem value="+34">+34 (ES)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.phone} *</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder={t.phonePlaceholder} {...field} data-testid="input-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contractDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {t.contractDuration} *
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-duration">
                                  <SelectValue placeholder={t.selectDuration} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="6_months">{t.months6}</SelectItem>
                                <SelectItem value="1_year">{t.year1}</SelectItem>
                                <SelectItem value="2_years">{t.years2}</SelectItem>
                                <SelectItem value="3+_years">{t.years3Plus}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="checkInDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.checkInDate} *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-checkin" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="hasPets"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <PawPrint className="h-4 w-4" />
                              {t.hasPetsQuestion} *
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-pets">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="no">{t.petNo}</SelectItem>
                                <SelectItem value="1_dog">{t.pet1Dog}</SelectItem>
                                <SelectItem value="2_dogs">{t.pet2Dogs}</SelectItem>
                                <SelectItem value="1_cat">{t.pet1Cat}</SelectItem>
                                <SelectItem value="2_cats">{t.pet2Cats}</SelectItem>
                                <SelectItem value="other">{t.petOther}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bedrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Bed className="h-4 w-4" />
                              {t.bedrooms} *
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-bedrooms">
                                  <SelectValue placeholder={t.selectBedrooms} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="studio">{t.studio}</SelectItem>
                                <SelectItem value="1">1 {t.bedroomSingular}</SelectItem>
                                <SelectItem value="2">2 {t.bedroomsPlural}</SelectItem>
                                <SelectItem value="3">3 {t.bedroomsPlural}</SelectItem>
                                <SelectItem value="4+">4+ {t.bedroomsPlural}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="budgetMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              {t.budgetMin}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="15000"
                                {...field}
                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                data-testid="input-budget-min"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="budgetMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.budgetMax}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="30000"
                                {...field}
                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                data-testid="input-budget-max"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="zone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {t.zone}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder={t.zonePlaceholder} {...field} data-testid="input-zone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.notes}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t.notesPlaceholder} 
                              className="min-h-[100px]"
                              {...field} 
                              data-testid="textarea-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  {currentStep > 1 ? (
                    <Button type="button" variant="outline" onClick={prevStep} data-testid="button-previous">
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      {t.previous}
                    </Button>
                  ) : (
                    <div />
                  )}

                  {currentStep < STEPS.length ? (
                    <Button type="button" onClick={nextStep} data-testid="button-next">
                      {t.next}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={submitMutation.isPending} data-testid="button-submit">
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t.submitting}
                        </>
                      ) : (
                        t.submit
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
