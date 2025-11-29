import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Home, CheckCircle2, AlertCircle, Upload, X } from "lucide-react";
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

// Translation object
const t = {
  es: {
    // Header
    tradeMark: "Tulum Rental Homes ™",
    
    // Titles and headings
    rentalOfferTitle: "Oferta de Renta",
    completeYourOffer: "Completa tu oferta",
    completeYourOfferDesc: "Por favor proporciona la siguiente información para formalizar tu interés en la propiedad.",
    personalInfoSection: "Información Personal",
    offerDetailsSection: "Detalles de la Oferta",
    servicesSection: "Servicios",
    additionalInfoSection: "Información Adicional",
    digitalSignatureSection: "Firma Digital",
    
    // Property details
    propertyPhotos: "Fotos de la Propiedad",
    propertyPhoto: "Propiedad",
    address: "Dirección",
    notAvailable: "No disponible",
    monthlyRentRequested: "Renta Mensual Solicitada por el Propietario",
    perMonth: "/mes",
    servicesRequiredByOwner: "Servicios que el Propietario Requiere que Pagues",
    
    // Form labels
    fullName: "Nombre Completo",
    email: "Email",
    phone: "Teléfono",
    nationality: "Nacionalidad",
    occupation: "Ocupación",
    usageType: "Tipo de Uso",
    monthlyRentOffered: "Renta Mensual Ofertada",
    currency: "Moneda",
    contractDuration: "Duración del Contrato",
    moveInDate: "Fecha de Ingreso",
    moveOutDate: "Fecha de Salida",
    numberOfOccupants: "Número de Ocupantes",
    hasPets: "¿Tiene mascotas?",
    petDetails: "Detalles de Mascotas",
    petPhotos: "Fotos de Mascotas (máximo 3)",
    servicesOfferedToPay: "Servicios que ofreces pagar",
    additionalComments: "Comentarios Adicionales (Opcional)",
    signatureLabel: "Firma aquí (Opcional)",
    
    // Placeholders
    placeholderFullName: "Juan Pérez",
    placeholderEmail: "juan@ejemplo.com",
    placeholderPhone: "+52 123 456 7890",
    placeholderNationality: "Mexicana",
    placeholderOccupation: "Ingeniero de Software",
    placeholderMonthlyRent: "15000",
    placeholderSelectCurrency: "Selecciona moneda",
    placeholderSelectDuration: "Selecciona duración",
    placeholderSelectNumber: "Selecciona número",
    placeholderPetDetails: "Tipo, raza, tamaño, etc.",
    placeholderAdditionalComments: "Cualquier información adicional que desees compartir...",
    placeholderSelectUsage: "Selecciona el tipo de uso",
    placeholderSelectOption: "Selecciona una opción",
    
    // Select options
    usageTypeLiving: "Para vivir (Costo contrato: $2,500 MXN, Depósito: 1 mes)",
    usageTypeSublet: "Para subarrendar (Costo contrato: $3,800 MXN, Depósito: 2 meses)",
    contractDuration6: "6 meses",
    contractDuration12: "12 meses",
    contractDuration18: "18 meses",
    contractDuration24: "24 meses",
    contractDurationCustom: "Personalizado (especificar fechas)",
    occupants1: "1 persona",
    occupants2: "2 personas",
    occupants3: "3 personas",
    occupants4: "4 personas",
    occupants5plus: "5+ personas",
    petsNo: "No",
    petsYes: "Sí",
    
    // Service labels
    serviceWater: "Agua",
    serviceElectricity: "Luz/Electricidad",
    serviceInternet: "Internet",
    serviceGas: "Gas",
    serviceCleaning: "Servicio de limpieza",
    serviceGardening: "Jardinería",
    serviceMaintenance: "Mantenimiento",
    
    // Descriptions and help text
    usageDescriptionLiving: "Costo de contrato: $2,500 MXN + depósito de seguridad de 1 mes de renta",
    usageDescriptionSublet: "Costo de contrato: $3,800 MXN + depósito de seguridad de 2 meses de renta",
    totalCosts: "Costos totales:",
    contractCost: "Costo de contrato:",
    securityDeposit: "Depósito de seguridad:",
    firstMonthRent: "Primer mes de renta:",
    totalToPay: "TOTAL A PAGAR:",
    month: "mes",
    months: "meses",
    customContractDesc: "Especifica la fecha de salida para contrato personalizado",
    servicesDesc: "Selecciona los servicios que estás dispuesto a cubrir",
    uploadPetPhotos: "Sube fotos claras de tu(s) mascota(s)",
    signatureDesc: "Dibuja tu firma en el espacio de arriba (opcional - puedes enviar sin firmar)",
    confidentialInfo: "Tu información será tratada de forma confidencial",
    
    // Buttons
    submitOffer: "Enviar Oferta",
    clearSignature: "Limpiar firma",
    signatureCaptured: "Firma capturada",
    
    // Loading and validation states
    validatingLink: "Validando enlace...",
    submitting: "Enviando...",
    
    // Success/Error messages
    invalidLinkTitle: "Enlace no válido",
    invalidLinkMessage: "Este enlace ha expirado o ya fue utilizado. Por favor, contacta a tu agente para obtener un nuevo enlace.",
    offerSubmittedTitle: "¡Oferta enviada!",
    offerSubmittedMessage: "Tu oferta ha sido recibida exitosamente. Nuestro equipo la revisará y te contactará en las próximas 24-48 horas.",
    nextStepsTitle: "Próximos pasos:",
    nextStep1: "1. Verificaremos tu información",
    nextStep2: "2. Contactaremos al propietario",
    nextStep3: "3. Te notificaremos la decisión",
    successToastTitle: "¡Oferta enviada exitosamente!",
    successToastDesc: "Nuestro equipo revisará tu oferta y te contactará pronto.",
    errorToastTitle: "Error al enviar oferta",
    photosUploadedTitle: "Fotos subidas exitosamente",
    photosUploadedDesc: "foto(s) subida(s)",
    errorUploadingPhotos: "Error al subir fotos",
    limitExceeded: "Límite excedido",
    maxPhotosMessage: "Máximo 3 fotos de mascotas",
    
    // Validation messages
    validationFullName: "Nombre completo es requerido",
    validationEmail: "Email inválido",
    validationPhone: "Teléfono es requerido",
    validationNationality: "Nacionalidad es requerida",
    validationOccupation: "Ocupación es requerida",
    validationUsageType: "Selecciona el tipo de uso",
    validationMonthlyRent: "Renta mensual es requerida",
    validationCurrency: "Moneda es requerida",
    validationContractDuration: "Duración del contrato es requerida",
    validationMoveInDate: "Fecha de ingreso es requerida",
    validationNumberOfOccupants: "Número de ocupantes es requerido",
    validationPets: "Información sobre mascotas es requerida",
    
    // Footer
    footerHomesApp: "HomesApp - Tulum Rental Homes ™",
  },
  en: {
    // Header
    tradeMark: "Tulum Rental Homes ™",
    
    // Titles and headings
    rentalOfferTitle: "Rental Offer",
    completeYourOffer: "Complete your offer",
    completeYourOfferDesc: "Please provide the following information to formalize your interest in the property.",
    personalInfoSection: "Personal Information",
    offerDetailsSection: "Offer Details",
    servicesSection: "Services",
    additionalInfoSection: "Additional Information",
    digitalSignatureSection: "Digital Signature",
    
    // Property details
    propertyPhotos: "Property Photos",
    propertyPhoto: "Property",
    address: "Address",
    notAvailable: "Not available",
    monthlyRentRequested: "Monthly Rent Requested by Owner",
    perMonth: "/month",
    servicesRequiredByOwner: "Services Owner Requires You to Pay",
    
    // Form labels
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    nationality: "Nationality",
    occupation: "Occupation",
    usageType: "Usage Type",
    monthlyRentOffered: "Monthly Rent Offered",
    currency: "Currency",
    contractDuration: "Contract Duration",
    moveInDate: "Move-in Date",
    moveOutDate: "Move-out Date",
    numberOfOccupants: "Number of Occupants",
    hasPets: "Do you have pets?",
    petDetails: "Pet Details",
    petPhotos: "Pet Photos (max 3)",
    servicesOfferedToPay: "Services you offer to pay",
    additionalComments: "Additional Comments (Optional)",
    signatureLabel: "Sign here (Optional)",
    
    // Placeholders
    placeholderFullName: "John Smith",
    placeholderEmail: "john@example.com",
    placeholderPhone: "+52 123 456 7890",
    placeholderNationality: "American",
    placeholderOccupation: "Software Engineer",
    placeholderMonthlyRent: "15000",
    placeholderSelectCurrency: "Select currency",
    placeholderSelectDuration: "Select duration",
    placeholderSelectNumber: "Select number",
    placeholderPetDetails: "Type, breed, size, etc.",
    placeholderAdditionalComments: "Any additional information you would like to share...",
    placeholderSelectUsage: "Select usage type",
    placeholderSelectOption: "Select an option",
    
    // Select options
    usageTypeLiving: "For living (Contract cost: $2,500 MXN, Deposit: 1 month)",
    usageTypeSublet: "For sublease (Contract cost: $3,800 MXN, Deposit: 2 months)",
    contractDuration6: "6 months",
    contractDuration12: "12 months",
    contractDuration18: "18 months",
    contractDuration24: "24 months",
    contractDurationCustom: "Custom (specify dates)",
    occupants1: "1 person",
    occupants2: "2 people",
    occupants3: "3 people",
    occupants4: "4 people",
    occupants5plus: "5+ people",
    petsNo: "No",
    petsYes: "Yes",
    
    // Service labels
    serviceWater: "Water",
    serviceElectricity: "Electricity",
    serviceInternet: "Internet",
    serviceGas: "Gas",
    serviceCleaning: "Cleaning service",
    serviceGardening: "Gardening",
    serviceMaintenance: "Maintenance",
    
    // Descriptions and help text
    usageDescriptionLiving: "Contract cost: $2,500 MXN + security deposit of 1 month rent",
    usageDescriptionSublet: "Contract cost: $3,800 MXN + security deposit of 2 months rent",
    totalCosts: "Total costs:",
    contractCost: "Contract cost:",
    securityDeposit: "Security deposit:",
    firstMonthRent: "First month rent:",
    totalToPay: "TOTAL TO PAY:",
    month: "month",
    months: "months",
    customContractDesc: "Specify move-out date for custom contract",
    servicesDesc: "Select the services you are willing to cover",
    uploadPetPhotos: "Upload clear photos of your pet(s)",
    signatureDesc: "Draw your signature in the space above (optional - you can submit without signing)",
    confidentialInfo: "Your information will be treated confidentially",
    
    // Buttons
    submitOffer: "Submit Offer",
    clearSignature: "Clear signature",
    signatureCaptured: "Signature captured",
    
    // Loading and validation states
    validatingLink: "Validating link...",
    submitting: "Submitting...",
    
    // Success/Error messages
    invalidLinkTitle: "Invalid Link",
    invalidLinkMessage: "This link has expired or has already been used. Please contact your agent to get a new link.",
    offerSubmittedTitle: "Offer submitted!",
    offerSubmittedMessage: "Your offer has been successfully received. Our team will review it and contact you within the next 24-48 hours.",
    nextStepsTitle: "Next steps:",
    nextStep1: "1. We will verify your information",
    nextStep2: "2. We will contact the owner",
    nextStep3: "3. We will notify you of the decision",
    successToastTitle: "Offer submitted successfully!",
    successToastDesc: "Our team will review your offer and contact you soon.",
    errorToastTitle: "Error submitting offer",
    photosUploadedTitle: "Photos uploaded successfully",
    photosUploadedDesc: "photo(s) uploaded",
    errorUploadingPhotos: "Error uploading photos",
    limitExceeded: "Limit exceeded",
    maxPhotosMessage: "Maximum 3 pet photos",
    
    // Validation messages
    validationFullName: "Full name is required",
    validationEmail: "Invalid email",
    validationPhone: "Phone is required",
    validationNationality: "Nationality is required",
    validationOccupation: "Occupation is required",
    validationUsageType: "Select usage type",
    validationMonthlyRent: "Monthly rent is required",
    validationCurrency: "Currency is required",
    validationContractDuration: "Contract duration is required",
    validationMoveInDate: "Move-in date is required",
    validationNumberOfOccupants: "Number of occupants is required",
    validationPets: "Pet information is required",
    
    // Footer
    footerHomesApp: "HomesApp - Tulum Rental Homes ™",
  }
};

export default function PublicOfferForm() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [petPhotoUrls, setPetPhotoUrls] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const text = language === "es" ? t.es : t.en;

  const offerFormSchema = z.object({
    fullName: z.string().min(2, text.validationFullName),
    email: z.string().email(text.validationEmail),
    phone: z.string().min(10, text.validationPhone),
    nationality: z.string().min(2, text.validationNationality),
    occupation: z.string().min(2, text.validationOccupation),
    usageType: z.enum(["vivienda", "subarrendamiento"], { required_error: text.validationUsageType }),
    monthlyRent: z.string().min(1, text.validationMonthlyRent),
    currency: z.string().min(1, text.validationCurrency),
    contractDuration: z.string().min(1, text.validationContractDuration),
    moveInDate: z.string().min(1, text.validationMoveInDate),
    moveOutDate: z.string().optional(),
    customContractDates: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    contractCost: z.number().optional(),
    securityDeposit: z.number().optional(),
    numberOfOccupants: z.string().min(1, text.validationNumberOfOccupants),
    pets: z.string().min(1, text.validationPets),
    petDetails: z.string().optional(),
    petPhotos: z.array(z.string()).optional(),
    offeredServices: z.array(z.string()).optional(),
    propertyRequiredServices: z.array(z.string()).optional(),
    additionalComments: z.string().optional(),
    signature: z.string().optional(),
  });

  type OfferFormValues = z.infer<typeof offerFormSchema>;

  const { data: validationData, isLoading: isValidating, error: validationError } = useQuery({
    queryKey: ["/api/offer-tokens", token, "validate"],
    queryFn: async () => {
            const res = await fetch(`/api/offer-tokens/${token}/validate`, {
        credentials: "include"
      });
            
      if (!res.ok) {
        const error = await res.json();
                throw new Error(error.message || text.invalidLinkMessage);
      }
      
      const data = await res.json();
            return data;
    },
    enabled: !!token,
    retry: false,
  });
  
  // Log validation state for debugging
  useEffect(() => {
    console.log("[PublicOfferForm] Validation state:", {
      isValidating,
      hasData: !!validationData,
      isValid: validationData?.valid,
      hasError: !!validationError,
      error: validationError?.message
    });
  }, [isValidating, validationData, validationError]);

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      nationality: "",
      occupation: "",
      usageType: "vivienda",
      monthlyRent: "",
      currency: "MXN",
      contractDuration: "12 meses",
      moveInDate: "",
      moveOutDate: "",
      customContractDates: undefined,
      contractCost: 2500,
      securityDeposit: 0,
      numberOfOccupants: "1",
      pets: "no",
      petDetails: "",
      petPhotos: [],
      offeredServices: ["luz"],
      propertyRequiredServices: [],
      additionalComments: "",
      signature: "",
    },
  });

  const property = validationData?.property;
  const lead = validationData?.lead;
  const isCompleted = validationData?.isCompleted;
  const submittedOffer = validationData?.submittedOffer;
  
  // Use creator's profile picture as agency logo
  const agencyLogo = validationData?.creatorUser?.profilePictureUrl;
  const agencyName = validationData?.creatorUser?.firstName && validationData?.creatorUser?.lastName
    ? `${validationData.creatorUser.firstName} ${validationData.creatorUser.lastName}`
    : validationData?.externalAgency?.name;

  const usageType = form.watch("usageType");
  const contractDuration = form.watch("contractDuration");
  const monthlyRent = parseFloat(form.watch("monthlyRent") || "0");
  const moveInDate = form.watch("moveInDate");
  const moveOutDate = form.watch("moveOutDate");

  const contractCost = usageType === "vivienda" ? 2500 : 3800;
  const securityDepositMonths = usageType === "vivienda" ? 1 : 2;
  const securityDeposit = monthlyRent * securityDepositMonths;

  useEffect(() => {
    form.setValue("contractCost", contractCost);
  }, [contractCost, form]);

  useEffect(() => {
    form.setValue("securityDeposit", securityDeposit);
  }, [securityDeposit, form]);

  useEffect(() => {
    if (contractDuration === "personalizado" && moveInDate && moveOutDate) {
      form.setValue("customContractDates", {
        start: moveInDate,
        end: moveOutDate,
      });
    } else {
      form.setValue("customContractDates", undefined);
    }
  }, [contractDuration, moveInDate, moveOutDate, form]);

  useEffect(() => {
    if (property?.includedServices) {
      form.setValue("propertyRequiredServices", property.includedServices);
    }
  }, [property, form]);

  useEffect(() => {
    if (lead) {
      if (lead.firstName && lead.lastName) {
        form.setValue("fullName", `${lead.firstName} ${lead.lastName}`);
      }
      if (lead.email) {
        form.setValue("email", lead.email);
      }
      if (lead.phone) {
        form.setValue("phone", lead.phone);
      }
      if (lead.contractDuration && lead.contractDuration.length > 0) {
        form.setValue("contractDuration", lead.contractDuration[0]);
      }
      if (lead.moveInDate && lead.moveInDate.length > 0) {
        form.setValue("moveInDate", lead.moveInDate[0]);
      }
      if (lead.pets) {
        form.setValue("pets", lead.pets.toLowerCase().includes("no") ? "no" : "si");
        if (!lead.pets.toLowerCase().includes("no")) {
          form.setValue("petDetails", lead.pets);
        }
      }
    }
  }, [lead, form]);

  const uploadPetPhotosMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('petPhotos', file);
      });

      const response = await fetch(`/api/offer-tokens/${token}/upload-pet-photos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || text.errorUploadingPhotos);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setPetPhotoUrls([...petPhotoUrls, ...data.urls]);
      form.setValue("petPhotos", [...petPhotoUrls, ...data.urls]);
      toast({
        title: text.photosUploadedTitle,
        description: `${data.urls.length} ${text.photosUploadedDesc}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: text.errorUploadingPhotos,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePetPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (petPhotoUrls.length + e.target.files.length > 3) {
      toast({
        title: text.limitExceeded,
        description: text.maxPhotosMessage,
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPhotos(true);
    await uploadPetPhotosMutation.mutateAsync(e.target.files);
    setIsUploadingPhotos(false);
  };

  const removePetPhoto = (index: number) => {
    const newUrls = petPhotoUrls.filter((_, i) => i !== index);
    setPetPhotoUrls(newUrls);
    form.setValue("petPhotos", newUrls);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current && hasSignature) {
      const signatureData = canvasRef.current.toDataURL();
      form.setValue("signature", signatureData);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    form.setValue("signature", "");
  };

  const submitOfferMutation = useMutation({
    mutationFn: async (data: OfferFormValues) => {
      const submissionData = {
        ...data,
        petPhotos: petPhotoUrls,
        contractCost: data.contractCost || contractCost,
        securityDeposit: data.securityDeposit || securityDeposit,
        customContractDates: data.customContractDates,
        propertyRequiredServices: data.propertyRequiredServices,
      };
      
      const response = await apiRequest("POST", `/api/offer-tokens/${token}/submit`, submissionData);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: text.successToastTitle,
        description: text.successToastDesc,
      });
    },
    onError: (error: Error) => {
      toast({
        title: text.errorToastTitle,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OfferFormValues) => {
    console.log("Form submitted with data:", data);
    submitOfferMutation.mutate(data);
  };

  useEffect(() => {
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      console.log("Form validation errors:", errors);
    }
  }, [form.formState.errors]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="icon-loading" />
              <p className="text-muted-foreground">{text.validatingLink}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validationData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>{text.invalidLinkTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {text.invalidLinkMessage}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show completed offer view if already submitted
  if (isCompleted) {
    // Edge case: token is used but has no data
    if (!submittedOffer) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-semibold text-center">{text.invalidLinkTitle}</h2>
                <p className="text-muted-foreground text-center">
                  {language === "es"
                    ? "Este enlace fue utilizado pero no contiene datos. Por favor contacta a tu agente."
                    : "This link was used but contains no data. Please contact your agent."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Show read-only view of submitted offer
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with logos */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-shrink-0">
                <img 
                  src={logoPath} 
                  alt="HomesApp Logo"
                  className="h-16 md:h-20"
                  data-testid="img-homesapp-logo"
                />
                <p className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">Smart Real Estate</p>
              </div>
              {agencyLogo && (
                <div className="flex-shrink-0 text-right">
                  <img 
                    src={agencyLogo} 
                    alt={`${agencyName} Logo`}
                    className="h-16 md:h-20 w-16 md:w-20 rounded-full object-cover border-2 border-primary/20 ml-auto"
                    data-testid="img-agency-logo"
                  />
                  {agencyName && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{agencyName}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" data-testid="icon-success" />
                <div>
                  <CardTitle className="text-2xl">{text.offerSubmittedTitle}</CardTitle>
                  <CardDescription>{property?.title || text.propertyPhoto}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-900 dark:text-green-100">
                  {language === "es" 
                    ? "Esta oferta ya fue enviada. A continuación puedes ver los detalles que enviaste."
                    : "This offer has already been submitted. Below you can see the details you submitted."}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">{text.personalInfoSection}</h3>
                  <div><strong>{text.fullName}:</strong> {submittedOffer.nombreCompleto || "N/A"}</div>
                  <div><strong>{text.email}:</strong> {submittedOffer.clientEmail || "N/A"}</div>
                  <div><strong>{text.phone}:</strong> {submittedOffer.clientPhone || "N/A"}</div>
                  <div><strong>{text.nationality}:</strong> {submittedOffer.nacionalidad || "N/A"}</div>
                  <div><strong>{text.occupation}:</strong> {submittedOffer.trabajoPosicion || "N/A"}</div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">{text.offerDetailsSection}</h3>
                  <div><strong>{text.monthlyRentOffered}:</strong> ${submittedOffer.rentaOfertada?.toLocaleString() || "N/A"}</div>
                  <div><strong>{text.contractDuration}:</strong> {submittedOffer.duracionContrato || "N/A"}</div>
                  <div><strong>{text.moveInDate}:</strong> {submittedOffer.fechaIngreso ? new Date(submittedOffer.fechaIngreso).toLocaleDateString() : "N/A"}</div>
                  <div><strong>{text.numberOfOccupants}:</strong> {submittedOffer.numeroInquilinos || "N/A"}</div>
                  <div><strong>{text.hasPets}:</strong> {submittedOffer.tieneMascotas === "si" ? text.petsYes : text.petsNo}</div>
                  {submittedOffer.tieneMascotas === "si" && submittedOffer.petPhotos && submittedOffer.petPhotos.length > 0 && (
                    <div>
                      <strong>{text.petPhotos}:</strong>
                      <div className="flex gap-2 mt-2">
                        {submittedOffer.petPhotos.map((url: string, idx: number) => (
                          <img key={idx} src={url} alt={`Pet ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border-2 border-slate-200 dark:border-slate-700" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {submittedOffer.pedidoEspecial && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">{text.additionalComments}</h3>
                  <p className="text-muted-foreground">{submittedOffer.pedidoEspecial}</p>
                </div>
              )}

              {submittedOffer.signature && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">{text.digitalSignatureSection}</h3>
                  <img src={submittedOffer.signature} alt="Signature" className="border border-slate-300 dark:border-slate-700 rounded-lg max-w-xs" />
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>{text.nextStepsTitle}</strong>
                  <br />
                  {text.nextStep1}
                  <br />
                  {text.nextStep2}
                  <br />
                  {text.nextStep3}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" data-testid="icon-success" />
              <CardTitle>{text.offerSubmittedTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {text.offerSubmittedMessage}
            </p>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>{text.nextStepsTitle}</strong>
                <br />
                {text.nextStep1}
                <br />
                {text.nextStep2}
                <br />
                {text.nextStep3}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const propertyRequiredServices = property?.includedServices || [];
  const availableServices = [
    { id: "agua", label: text.serviceWater },
    { id: "luz", label: text.serviceElectricity },
    { id: "internet", label: text.serviceInternet },
    { id: "gas", label: text.serviceGas },
    { id: "limpieza", label: text.serviceCleaning },
    { id: "jardineria", label: text.serviceGardening },
    { id: "mantenimiento", label: text.serviceMaintenance },
  ];

  const propertyPhotos = property?.photos || [];
  const displayPhotos = propertyPhotos.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with logos */}
        <div className="mb-8">
          {/* Logo container - HomesApp left, Agency right */}
          <div className="flex items-center justify-between gap-4">
            {/* HomesApp Logo - Left */}
            <div className="flex-shrink-0">
              <img 
                src={logoPath} 
                alt="HomesApp Logo"
                className="h-16 md:h-20"
                data-testid="img-homesapp-logo"
              />
              <p className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">Smart Real Estate</p>
            </div>
            
            {/* Agency Logo - Right */}
            {agencyLogo && (
              <div className="flex-shrink-0 text-right">
                <img 
                  src={agencyLogo} 
                  alt={`${agencyName} Logo`}
                  className="h-16 md:h-20 w-16 md:w-20 rounded-full object-cover border-2 border-primary/20 ml-auto"
                  data-testid="img-agency-logo"
                />
                {agencyName && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{agencyName}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Home className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">{text.rentalOfferTitle}</CardTitle>
              </div>
              <LanguageToggle />
            </div>
            <CardDescription className="text-lg">{property?.title || text.propertyPhoto}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {displayPhotos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">{text.propertyPhotos}</h3>
                <div className="flex gap-2 overflow-x-auto pb-2" data-testid="gallery-property-photos">
                  {displayPhotos.map((photo: string, index: number) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700"
                    >
                      <img
                        src={photo}
                        alt={`${text.propertyPhoto} ${index + 1}`}
                        className="w-full h-full object-cover"
                        data-testid={`img-property-${index}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{text.address}</p>
                  <p className="text-base font-semibold text-foreground">{property?.address || text.notAvailable}</p>
                </div>
                
                {property?.monthlyRentPrice && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{text.monthlyRentRequested}</p>
                    <p className="text-3xl font-bold text-primary">
                      ${property.monthlyRentPrice.toLocaleString()} {property.currency || "USD"}
                      <span className="text-base font-normal text-muted-foreground">{text.perMonth}</span>
                    </p>
                  </div>
                )}

                {propertyRequiredServices.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{text.servicesRequiredByOwner}</p>
                    <div className="flex flex-wrap gap-2">
                      {propertyRequiredServices.map((service: string) => (
                        <span
                          key={service}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary border border-primary/30"
                          data-testid={`badge-required-service-${service}`}
                        >
                          {availableServices.find(s => s.id === service)?.label || service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{text.completeYourOffer}</CardTitle>
            <CardDescription>
              {text.completeYourOfferDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{text.personalInfoSection}</h3>
                  
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{text.fullName} *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={text.placeholderFullName} data-testid="input-fullName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{text.email} *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder={text.placeholderEmail} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{text.phone} *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={text.placeholderPhone} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{text.nationality} *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={text.placeholderNationality} data-testid="input-nationality" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{text.occupation} *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={text.placeholderOccupation} data-testid="input-occupation" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{text.offerDetailsSection}</h3>

                  <FormField
                    control={form.control}
                    name="usageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{text.usageType} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-usageType">
                              <SelectValue placeholder={text.placeholderSelectUsage} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vivienda">{text.usageTypeLiving}</SelectItem>
                            <SelectItem value="subarrendamiento">{text.usageTypeSublet}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {usageType === "vivienda" 
                            ? text.usageDescriptionLiving
                            : text.usageDescriptionSublet
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="monthlyRent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{text.monthlyRentOffered} *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder={text.placeholderMonthlyRent} data-testid="input-monthlyRent" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{text.currency} *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-currency">
                                <SelectValue placeholder={text.placeholderSelectCurrency} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MXN">MXN</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {monthlyRent > 0 && (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <p className="text-sm text-green-900 dark:text-green-100">
                        <strong>{text.totalCosts}</strong>
                        <br />
                        • {text.contractCost} ${contractCost.toLocaleString()} MXN
                        <br />
                        • {text.securityDeposit} ${securityDeposit.toLocaleString()} {form.watch("currency")} ({securityDepositMonths} {securityDepositMonths === 1 ? text.month : text.months})
                        <br />
                        • {text.firstMonthRent} ${monthlyRent.toLocaleString()} {form.watch("currency")}
                        <br />
                        <br />
                        <strong className="text-base">{text.totalToPay} ${(contractCost + securityDeposit + monthlyRent).toLocaleString()} {form.watch("currency")}</strong>
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contractDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{text.contractDuration} *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contractDuration">
                                <SelectValue placeholder={text.placeholderSelectDuration} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="6 meses">{text.contractDuration6}</SelectItem>
                              <SelectItem value="12 meses">{text.contractDuration12}</SelectItem>
                              <SelectItem value="18 meses">{text.contractDuration18}</SelectItem>
                              <SelectItem value="24 meses">{text.contractDuration24}</SelectItem>
                              <SelectItem value="personalizado">{text.contractDurationCustom}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="moveInDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{text.moveInDate} *</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" data-testid="input-moveInDate" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {contractDuration === "personalizado" && (
                    <FormField
                      control={form.control}
                      name="moveOutDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{text.moveOutDate} *</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" data-testid="input-moveOutDate" />
                          </FormControl>
                          <FormDescription>{text.customContractDesc}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="numberOfOccupants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{text.numberOfOccupants} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-numberOfOccupants">
                              <SelectValue placeholder={text.placeholderSelectNumber} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">{text.occupants1}</SelectItem>
                            <SelectItem value="2">{text.occupants2}</SelectItem>
                            <SelectItem value="3">{text.occupants3}</SelectItem>
                            <SelectItem value="4">{text.occupants4}</SelectItem>
                            <SelectItem value="5+">{text.occupants5plus}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{text.servicesSection}</h3>

                  {propertyRequiredServices && propertyRequiredServices.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                        {text.servicesRequiredByOwner}:
                      </p>
                      <ul className="list-disc list-inside text-sm text-amber-900 dark:text-amber-100">
                        {propertyRequiredServices.map((service: string, index: number) => (
                          <li key={index}>{service}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="offeredServices"
                    render={() => (
                      <FormItem>
                        <FormLabel>{text.servicesOfferedToPay}</FormLabel>
                        <FormDescription>{text.servicesDesc}</FormDescription>
                        <div className="space-y-2">
                          {availableServices.map((service) => (
                            <FormField
                              key={service.id}
                              control={form.control}
                              name="offeredServices"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={service.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(service.label)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), service.label])
                                            : field.onChange(
                                                field.value?.filter((value) => value !== service.label)
                                              );
                                        }}
                                        data-testid={`checkbox-service-${service.id}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{service.label}</FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{text.additionalInfoSection}</h3>

                  <FormField
                    control={form.control}
                    name="pets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{text.hasPets} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-pets">
                              <SelectValue placeholder={text.placeholderSelectOption} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no">{text.petsNo}</SelectItem>
                            <SelectItem value="yes">{text.petsYes}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("pets") === "yes" && (
                    <>
                      <FormField
                        control={form.control}
                        name="petDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{text.petDetails}</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder={text.placeholderPetDetails}
                                data-testid="input-petDetails"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <FormLabel>{text.petPhotos}</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {petPhotoUrls.map((url, index) => (
                            <div key={index} className="relative">
                              <img src={url} alt={`${text.petDetails} ${index + 1}`} className="w-24 h-24 object-cover rounded-lg" />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6"
                                onClick={() => removePetPhoto(index)}
                                data-testid={`button-remove-photo-${index}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {petPhotoUrls.length < 3 && (
                            <label className="w-24 h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center cursor-pointer hover-elevate">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handlePetPhotoUpload}
                                disabled={isUploadingPhotos}
                                data-testid="input-pet-photos"
                              />
                              {isUploadingPhotos ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                              ) : (
                                <Upload className="h-6 w-6 text-slate-400" />
                              )}
                            </label>
                          )}
                        </div>
                        <FormDescription>{text.uploadPetPhotos}</FormDescription>
                      </div>
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="additionalComments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{text.additionalComments}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={text.placeholderAdditionalComments}
                            data-testid="input-additionalComments"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{text.digitalSignatureSection}</h3>
                  <div className="space-y-2">
                    <FormLabel>{text.signatureLabel}</FormLabel>
                    <div className="border-2 border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        className="w-full touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        data-testid="canvas-signature"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearSignature}
                        data-testid="button-clear-signature"
                      >
                        <X className="h-4 w-4 mr-2" />
                        {text.clearSignature}
                      </Button>
                      {hasSignature && (
                        <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {text.signatureCaptured}
                        </p>
                      )}
                    </div>
                    <FormDescription>{text.signatureDesc}</FormDescription>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitOfferMutation.isPending}
                  data-testid="button-submit-offer"
                >
                  {submitOfferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {text.submitOffer}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          <p>{agencyName || text.footerHomesApp}</p>
          <p className="mt-1">{text.confidentialInfo}</p>
        </div>
      </div>
    </div>
  );
}
