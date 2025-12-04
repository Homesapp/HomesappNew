import { useState, useEffect } from "react";
import { useParams, useSearch } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  CheckCircle2, 
  AlertCircle, 
  User, 
  FileText, 
  UserPlus,
  Building2,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Home
} from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png";

const translations = {
  es: {
    smartRealEstate: "Bienes Raíces Inteligente",
    pageTitle: "Registro de Broker",
    pageDescription: "Complete el registro para poder compartir leads con Tulum Rental Homes",
    
    step1Title: "Datos Personales",
    step1Desc: "Su información de contacto",
    step2Title: "Términos y Condiciones",
    step2Desc: "Aceptación de comisiones",
    step3Title: "Registrar Lead",
    step3Desc: "Datos del cliente",
    
    firstName: "Nombre",
    lastName: "Apellido",
    email: "Correo Electrónico",
    emailPlaceholder: "broker@ejemplo.com",
    phone: "Teléfono",
    phonePlaceholder: "Ej: 9981234567",
    company: "Nombre de la Inmobiliaria",
    companyPlaceholder: "Mi Inmobiliaria S.A.",
    isFreelancer: "Soy broker independiente (freelancer)",
    
    termsTitle: "Términos y Condiciones del Programa de Brokers",
    termsAcceptLabel: "Acepto los términos y condiciones del programa de comisiones de Tulum Rental Homes",
    termsRequired: "Debe aceptar los términos para continuar",
    noTermsAvailable: "Los términos y condiciones no están disponibles en este momento. Contacte al administrador.",
    
    leadTitle: "Datos del Cliente (Lead)",
    leadDescription: "Registre los datos del cliente que desea referir",
    clientFirstName: "Nombre del Cliente",
    clientLastName: "Apellido del Cliente",
    phoneLast4: "Últimos 4 dígitos del Teléfono",
    phoneLast4Placeholder: "1234",
    phoneLast4Help: "Por privacidad, solo necesitamos los últimos 4 dígitos",
    contractDuration: "Duración del Contrato",
    checkInDate: "Fecha de Check-in Deseada",
    hasPets: "¿Tiene Mascotas?",
    budgetMin: "Presupuesto Mínimo (MXN)",
    budgetMax: "Presupuesto Máximo (MXN)",
    bedrooms: "Recámaras",
    zone: "Zona Preferida",
    notes: "Notas Adicionales",
    notesPlaceholder: "Información adicional sobre el cliente...",
    
    selectDuration: "Seleccionar duración...",
    months6: "6 meses",
    year1: "1 año",
    years2: "2 años",
    years3Plus: "3+ años",
    
    selectOption: "Seleccionar...",
    petNo: "No tiene mascotas",
    petYes1: "Sí - 1 mascota",
    petYes2: "Sí - 2 mascotas",
    petYesMore: "Sí - 3+ mascotas",
    
    next: "Siguiente",
    previous: "Anterior",
    submit: "Registrar Lead",
    submitting: "Registrando...",
    
    successTitle: "¡Registro Exitoso!",
    successDescription: "El lead ha sido registrado correctamente. Recibirá notificaciones sobre el progreso.",
    registerAnother: "Registrar Otro Lead",
    
    errFirstName: "El nombre es requerido",
    errLastName: "El apellido es requerido",
    errContactRequired: "Se requiere email o teléfono",
    errPhoneLast4Required: "Los últimos 4 dígitos son requeridos",
    errPhoneLast4Format: "Deben ser exactamente 4 dígitos",
    
    errorTitle: "Error",
    errorDesc: "Ocurrió un error al procesar su solicitud",
    duplicateError: "Este lead ya está registrado",
  },
  en: {
    smartRealEstate: "Smart Real Estate",
    pageTitle: "Broker Registration",
    pageDescription: "Complete the registration to share leads with Tulum Rental Homes",
    
    step1Title: "Personal Info",
    step1Desc: "Your contact information",
    step2Title: "Terms & Conditions",
    step2Desc: "Commission acceptance",
    step3Title: "Register Lead",
    step3Desc: "Client details",
    
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    emailPlaceholder: "broker@example.com",
    phone: "Phone",
    phonePlaceholder: "E.g.: 9981234567",
    company: "Real Estate Company Name",
    companyPlaceholder: "My Real Estate Co.",
    isFreelancer: "I am an independent broker (freelancer)",
    
    termsTitle: "Broker Program Terms and Conditions",
    termsAcceptLabel: "I accept the terms and conditions of the Tulum Rental Homes commission program",
    termsRequired: "You must accept the terms to continue",
    noTermsAvailable: "Terms and conditions are not available at this time. Please contact the administrator.",
    
    leadTitle: "Client Details (Lead)",
    leadDescription: "Register the client information you want to refer",
    clientFirstName: "Client First Name",
    clientLastName: "Client Last Name",
    phoneLast4: "Last 4 Digits of Phone",
    phoneLast4Placeholder: "1234",
    phoneLast4Help: "For privacy, we only need the last 4 digits",
    contractDuration: "Contract Duration",
    checkInDate: "Desired Check-in Date",
    hasPets: "Has Pets?",
    budgetMin: "Minimum Budget (MXN)",
    budgetMax: "Maximum Budget (MXN)",
    bedrooms: "Bedrooms",
    zone: "Preferred Zone",
    notes: "Additional Notes",
    notesPlaceholder: "Additional information about the client...",
    
    selectDuration: "Select duration...",
    months6: "6 months",
    year1: "1 year",
    years2: "2 years",
    years3Plus: "3+ years",
    
    selectOption: "Select...",
    petNo: "No pets",
    petYes1: "Yes - 1 pet",
    petYes2: "Yes - 2 pets",
    petYesMore: "Yes - 3+ pets",
    
    next: "Next",
    previous: "Previous",
    submit: "Register Lead",
    submitting: "Registering...",
    
    successTitle: "Registration Successful!",
    successDescription: "The lead has been registered successfully. You will receive updates on progress.",
    registerAnother: "Register Another Lead",
    
    errFirstName: "First name is required",
    errLastName: "Last name is required",
    errContactRequired: "Email or phone is required",
    errPhoneLast4Required: "Last 4 digits are required",
    errPhoneLast4Format: "Must be exactly 4 digits",
    
    errorTitle: "Error",
    errorDesc: "An error occurred while processing your request",
    duplicateError: "This lead is already registered",
  }
};

const brokerProfileSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email().optional().or(z.literal("")),
  countryCode: z.string().default("+52"),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  isFreelancer: z.boolean().default(false),
}).refine((data) => data.email || data.phone, {
  message: "Email or phone is required",
  path: ["email"],
});

const leadSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phoneLast4: z.string().length(4, "Must be 4 digits").regex(/^\d{4}$/, "Must be 4 digits"),
  contractDuration: z.string().optional(),
  checkInDate: z.string().optional(),
  hasPets: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  bedrooms: z.string().optional(),
  zone: z.string().optional(),
  notes: z.string().optional(),
});

type BrokerProfileData = z.infer<typeof brokerProfileSchema>;
type LeadData = z.infer<typeof leadSchema>;

interface TermsData {
  id: string;
  version: string;
  title: string;
  content: string;
}

interface AgencyData {
  id: string;
  name: string;
  logoUrl: string;
}

export default function PublicBrokerRegistration() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const t = translations[language as keyof typeof translations] || translations.es;
  
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const referredBySellerId = urlParams.get('sellerId');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [termsData, setTermsData] = useState<TermsData | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const STEPS = [
    { id: 1, title: t.step1Title, description: t.step1Desc, icon: User },
    { id: 2, title: t.step2Title, description: t.step2Desc, icon: FileText },
    { id: 3, title: t.step3Title, description: t.step3Desc, icon: UserPlus },
  ];
  
  const { data: agencyData } = useQuery<AgencyData>({
    queryKey: ['/api/public/agency'],
  });
  
  const profileForm = useForm<BrokerProfileData>({
    resolver: zodResolver(brokerProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+52",
      phone: "",
      company: "",
      isFreelancer: false,
    },
  });
  
  const leadForm = useForm<LeadData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneLast4: "",
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
  
  const registerBrokerMutation = useMutation({
    mutationFn: async (data: BrokerProfileData) => {
      const response = await fetch("/api/public/brokers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          referredBySellerId: referredBySellerId || null,
          registrationSource: referredBySellerId ? "seller_invite" : "public_link",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t.errorDesc);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setBrokerId(data.brokerId);
      if (data.terms) {
        setTermsData(data.terms);
      }
      setCurrentStep(2);
    },
    onError: (error: Error) => {
      toast({
        title: t.errorTitle,
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const acceptTermsMutation = useMutation({
    mutationFn: async () => {
      if (!brokerId || !termsData) return;
      
      const response = await fetch(`/api/public/brokers/${brokerId}/accept-terms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termsId: termsData.id,
          termsVersion: termsData.version,
          ipAddress: "", 
          userAgent: navigator.userAgent,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t.errorDesc);
      }
      return response.json();
    },
    onSuccess: () => {
      setCurrentStep(3);
    },
    onError: (error: Error) => {
      toast({
        title: t.errorTitle,
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const registerLeadMutation = useMutation({
    mutationFn: async (data: LeadData) => {
      if (!brokerId) throw new Error("Broker ID not found");
      
      const response = await fetch(`/api/public/brokers/${brokerId}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t.errorDesc);
      }
      return response.json();
    },
    onSuccess: () => {
      setCompleted(true);
      toast({
        title: t.successTitle,
        description: t.successDescription,
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
  
  const handleProfileSubmit = (data: BrokerProfileData) => {
    registerBrokerMutation.mutate(data);
  };
  
  const handleTermsAccept = () => {
    if (!termsAccepted) {
      toast({
        title: t.errorTitle,
        description: t.termsRequired,
        variant: "destructive",
      });
      return;
    }
    acceptTermsMutation.mutate();
  };
  
  const handleLeadSubmit = (data: LeadData) => {
    registerLeadMutation.mutate(data);
  };
  
  const handleRegisterAnother = () => {
    leadForm.reset();
    setCompleted(false);
  };
  
  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl" data-testid="text-success-title">{t.successTitle}</CardTitle>
            <CardDescription className="text-base mt-2">
              {t.successDescription}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={handleRegisterAnother} data-testid="button-register-another">
              {t.registerAnother}
            </Button>
          </CardFooter>
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
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                    ${currentStep >= step.id 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground/30 text-muted-foreground'}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 md:w-16 h-0.5 mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>
          
          <CardContent>
            {currentStep === 1 && (
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.firstName} *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-broker-firstname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.lastName} *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-broker-lastname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.email}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="email" 
                              placeholder={t.emailPlaceholder} 
                              className="pl-10"
                              {...field} 
                              data-testid="input-broker-email" 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-4 gap-2">
                    <FormField
                      control={profileForm.control}
                      name="countryCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código</FormLabel>
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
                              <SelectItem value="+34">+34</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormLabel>{t.phone}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder={t.phonePlaceholder}
                                className="pl-10" 
                                {...field} 
                                data-testid="input-broker-phone" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="isFreelancer"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-freelancer"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t.isFreelancer}</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {!profileForm.watch("isFreelancer") && (
                    <FormField
                      control={profileForm.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.company}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder={t.companyPlaceholder}
                                className="pl-10" 
                                {...field} 
                                data-testid="input-broker-company" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={registerBrokerMutation.isPending}
                      data-testid="button-next-step1"
                    >
                      {registerBrokerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t.submitting}
                        </>
                      ) : (
                        <>
                          {t.next}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t.termsTitle}</h3>
                  {termsData ? (
                    <>
                      <ScrollArea className="h-64 border rounded-md p-4 bg-muted/30">
                        <div 
                          className="prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: termsData.content }}
                        />
                      </ScrollArea>
                      <p className="text-xs text-muted-foreground mt-2">
                        Versión: {termsData.version}
                      </p>
                    </>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{t.noTermsAvailable}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                {termsData && (
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms-accept"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                      data-testid="checkbox-accept-terms"
                    />
                    <label 
                      htmlFor="terms-accept" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t.termsAcceptLabel}
                    </label>
                  </div>
                )}
                
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    data-testid="button-prev-step2"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t.previous}
                  </Button>
                  <Button 
                    onClick={handleTermsAccept}
                    disabled={!termsAccepted || !termsData || acceptTermsMutation.isPending}
                    data-testid="button-next-step2"
                  >
                    {acceptTermsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.submitting}
                      </>
                    ) : (
                      <>
                        {t.next}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {currentStep === 3 && (
              <Form {...leadForm}>
                <form onSubmit={leadForm.handleSubmit(handleLeadSubmit)} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">{t.leadTitle}</h3>
                    <p className="text-sm text-muted-foreground">{t.leadDescription}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={leadForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.clientFirstName} *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-lead-firstname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={leadForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.clientLastName} *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-lead-lastname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={leadForm.control}
                    name="phoneLast4"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.phoneLast4} *</FormLabel>
                        <FormControl>
                          <Input 
                            maxLength={4}
                            placeholder={t.phoneLast4Placeholder} 
                            {...field} 
                            data-testid="input-lead-phone-last4" 
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">{t.phoneLast4Help}</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={leadForm.control}
                      name="contractDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.contractDuration}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contract-duration">
                                <SelectValue placeholder={t.selectDuration} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="6_months">{t.months6}</SelectItem>
                              <SelectItem value="1_year">{t.year1}</SelectItem>
                              <SelectItem value="2_years">{t.years2}</SelectItem>
                              <SelectItem value="3_years_plus">{t.years3Plus}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={leadForm.control}
                      name="checkInDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.checkInDate}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-checkin-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={leadForm.control}
                    name="hasPets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.hasPets}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-has-pets">
                              <SelectValue placeholder={t.selectOption} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no">{t.petNo}</SelectItem>
                            <SelectItem value="1">{t.petYes1}</SelectItem>
                            <SelectItem value="2">{t.petYes2}</SelectItem>
                            <SelectItem value="3+">{t.petYesMore}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={leadForm.control}
                      name="budgetMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.budgetMin}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="15000"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              value={field.value || ""}
                              data-testid="input-budget-min" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={leadForm.control}
                      name="budgetMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.budgetMax}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="25000"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              value={field.value || ""}
                              data-testid="input-budget-max" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={leadForm.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.bedrooms}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-bedrooms">
                                <SelectValue placeholder={t.selectOption} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4+">4+</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={leadForm.control}
                      name="zone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.zone}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Aldea Zama, La Veleta..." 
                              {...field} 
                              data-testid="input-zone" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={leadForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.notes}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t.notesPlaceholder}
                            className="min-h-[80px]"
                            {...field} 
                            data-testid="textarea-notes" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      data-testid="button-prev-step3"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      {t.previous}
                    </Button>
                    <Button 
                      type="submit"
                      disabled={registerLeadMutation.isPending}
                      data-testid="button-submit-lead"
                    >
                      {registerLeadMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t.submitting}
                        </>
                      ) : (
                        <>
                          {t.submit}
                          <CheckCircle2 className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
