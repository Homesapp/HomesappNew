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
import { Loader2, CheckCircle2, AlertCircle, Building2, Upload, Eye, X, FileText } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png";

const getOwnerFormSchema = (text: any) => z.object({
  // Datos Generales
  fullName: z.string().min(2, text.validationFullNameRequired),
  nationality: z.string().optional(),
  phoneNumber: z.string().optional(),
  whatsappNumber: z.string().min(10, text.validationWhatsappRequired),
  email: z.string().email(text.validationEmailInvalid),
  subleasingAllowed: z.boolean().default(false),
  
  // Datos de la Propiedad
  propertyAddress: z.string().optional(),
  subdivision: z.string().optional(),
  unitNumber: z.string().optional(),
  agreedRent: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num.toString();
      }
      return val;
    },
    z.string().min(1, text.validationRentRequired)
  ),
  agreedDeposit: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num.toString();
      }
      return val;
    },
    z.string().min(1, text.validationDepositRequired)
  ),
  moveInDate: z.string().optional(),
  contractDuration: z.string().optional(),
  servicesIncluded: z.array(z.string()).optional().default([]),
  servicesNotIncluded: z.array(z.string()).optional().default([]),
  petsAllowed: z.boolean().default(false),
  specialNotes: z.string().optional(),
  
  // Datos Bancarios
  bankName: z.string().min(2, text.validationBankRequired),
  interbankCode: z.string().optional(),
  accountOrCardNumber: z.string().min(10, text.validationAccountRequired),
  accountHolderName: z.string().min(2, text.validationAccountHolderRequired),
  swiftCode: z.string().optional(),
  bankAddress: z.string().optional(),
  bankEmail: z.string().email().optional().or(z.literal('')),
  
  // Document URLs (these will be populated by file upload)
  idDocumentUrl: z.string().optional(),
  constitutiveActUrl: z.string().optional(),
  propertyDocumentsUrls: z.array(z.string()).optional().default([]),
  serviceReceiptsUrls: z.array(z.string()).optional().default([]),
  noDebtProofUrls: z.array(z.string()).optional().default([]),
  servicesFormatUrl: z.string().optional(),
  internalRulesUrl: z.string().optional(),
  condoRegulationsUrl: z.string().optional(),
  
  acceptedTerms: z.boolean().refine(val => val === true, text.validationAcceptTerms),
});

export default function PublicOwnerForm() {
  const { token } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const totalSteps = 5;

  const { data: tokenData, isLoading: isValidating, error: validationError } = useQuery({
    queryKey: [`/api/rental-form-tokens/${token}/validate`],
    enabled: !!token,
  });

  // Fetch active terms and conditions
  const { data: activeTerms } = useQuery({
    queryKey: [`/api/public/external/terms-and-conditions/active`, tokenData?.externalAgency?.id],
    queryFn: async () => {
      if (!tokenData?.externalAgency?.id) return null;
      const response = await fetch(`/api/public/external/terms-and-conditions/active?agencyId=${tokenData.externalAgency.id}&type=owner`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!tokenData?.externalAgency?.id,
  });

  // Translation object
  const t = {
    es: {
      title: "Formato de Propietario (Arrendador)",
      stepOf: "Paso",
      of: "de",
      complete: "completo",
      next: "Siguiente",
      previous: "Anterior",
      submit: "Enviar Formulario",
      loading: "Cargando...",
      submitting: "Enviando...",
      
      // Step titles
      step1: "Datos Generales",
      step2: "Datos de la Propiedad",
      step3: "Datos Bancarios",
      step4: "Documentos",
      step5: "Términos y Condiciones",
      
      // Field labels - Step 1
      fullName: "Nombre Completo",
      nationality: "Nacionalidad",
      phoneNumber: "Teléfono",
      whatsappNumber: "WhatsApp",
      email: "Correo Electrónico",
      subleasingAllowed: "¿Permite subarrendamiento?",
      
      // Field labels - Step 2
      propertyAddress: "Dirección de la Propiedad",
      subdivision: "Fraccionamiento/Colonia",
      unitNumber: "Número de Unidad/Departamento",
      agreedRent: "Renta Mensual Acordada (MXN)",
      agreedDeposit: "Depósito de Garantía (MXN)",
      moveInDate: "Fecha de Entrada",
      contractDuration: "Duración del Contrato",
      petsAllowed: "¿Permite mascotas?",
      specialNotes: "Notas Especiales",
      
      // Field labels - Step 3
      bankName: "Nombre del Banco",
      interbankCode: "CLABE Interbancaria",
      accountOrCardNumber: "Número de Cuenta/Tarjeta",
      accountHolderName: "Nombre del Titular",
      swiftCode: "Código SWIFT (internacional)",
      bankAddress: "Dirección del Banco",
      bankEmail: "Correo del Banco",
      
      // Field labels - Step 4
      idDocument: "Identificación Oficial (INE/Pasaporte)",
      constitutiveAct: "Acta Constitutiva (si aplica)",
      servicesFormat: "Formato de Servicios",
      internalRules: "Reglamento Interno",
      condoRegulations: "Reglamento del Condominio",
      uploadFile: "Subir Archivo",
      
      // Field labels - Step 5
      acceptTerms: "Acepto los términos y condiciones",
      termsText: "Al enviar este formulario, confirmo que la información proporcionada es verídica y autorizo su uso para la elaboración del contrato de arrendamiento.",
      
      // Validation messages
      validationFullNameRequired: "El nombre completo es requerido",
      validationWhatsappRequired: "El número de WhatsApp es requerido (mínimo 10 dígitos)",
      validationEmailInvalid: "Correo electrónico inválido",
      validationRentRequired: "La renta mensual es requerida",
      validationDepositRequired: "El depósito de garantía es requerido",
      validationBankRequired: "El nombre del banco es requerido",
      validationAccountRequired: "El número de cuenta es requerido (mínimo 10 dígitos)",
      validationAccountHolderRequired: "El nombre del titular es requerido",
      validationAcceptTerms: "Debes aceptar los términos y condiciones",
      
      // Success/Error messages
      successTitle: "¡Formulario Enviado Exitosamente!",
      successMessage: "Hemos recibido su información. El equipo revisará los datos y se pondrá en contacto pronto.",
      errorTitle: "Error al Enviar",
      errorMessage: "Ocurrió un error al enviar el formulario. Por favor intente nuevamente.",
      tokenExpired: "Este enlace ha expirado",
      tokenUsed: "Este enlace ya ha sido utilizado",
      tokenInvalid: "Enlace inválido",
      
      // Property info
      property: "Propiedad",
      unit: "Unidad",
      validUntil: "Válido hasta",
    },
    en: {
      title: "Property Owner Form (Landlord)",
      stepOf: "Step",
      of: "of",
      complete: "complete",
      next: "Next",
      previous: "Previous",
      submit: "Submit Form",
      loading: "Loading...",
      submitting: "Submitting...",
      
      // Step titles
      step1: "General Information",
      step2: "Property Details",
      step3: "Banking Information",
      step4: "Documents",
      step5: "Terms and Conditions",
      
      // Field labels - Step 1
      fullName: "Full Name",
      nationality: "Nationality",
      phoneNumber: "Phone Number",
      whatsappNumber: "WhatsApp",
      email: "Email Address",
      subleasingAllowed: "Allow Subleasing?",
      
      // Field labels - Step 2
      propertyAddress: "Property Address",
      subdivision: "Subdivision/Neighborhood",
      unitNumber: "Unit/Apartment Number",
      agreedRent: "Monthly Rent (MXN)",
      agreedDeposit: "Security Deposit (MXN)",
      moveInDate: "Move-in Date",
      contractDuration: "Contract Duration",
      petsAllowed: "Pets Allowed?",
      specialNotes: "Special Notes",
      
      // Field labels - Step 3
      bankName: "Bank Name",
      interbankCode: "Interbank Code (CLABE)",
      accountOrCardNumber: "Account/Card Number",
      accountHolderName: "Account Holder Name",
      swiftCode: "SWIFT Code (international)",
      bankAddress: "Bank Address",
      bankEmail: "Bank Email",
      
      // Field labels - Step 4
      idDocument: "Official ID (Passport/ID Card)",
      constitutiveAct: "Articles of Incorporation (if applicable)",
      servicesFormat: "Services Format",
      internalRules: "Internal Rules",
      condoRegulations: "Condominium Regulations",
      uploadFile: "Upload File",
      
      // Field labels - Step 5
      acceptTerms: "I accept the terms and conditions",
      termsText: "By submitting this form, I confirm that the information provided is truthful and authorize its use for the preparation of the lease agreement.",
      
      // Validation messages
      validationFullNameRequired: "Full name is required",
      validationWhatsappRequired: "WhatsApp number is required (minimum 10 digits)",
      validationEmailInvalid: "Invalid email address",
      validationRentRequired: "Monthly rent is required",
      validationDepositRequired: "Security deposit is required",
      validationBankRequired: "Bank name is required",
      validationAccountRequired: "Account number is required (minimum 10 digits)",
      validationAccountHolderRequired: "Account holder name is required",
      validationAcceptTerms: "You must accept the terms and conditions",
      
      // Success/Error messages
      successTitle: "Form Submitted Successfully!",
      successMessage: "We have received your information. Our team will review the data and contact you soon.",
      errorTitle: "Submission Error",
      errorMessage: "An error occurred while submitting the form. Please try again.",
      tokenExpired: "This link has expired",
      tokenUsed: "This link has already been used",
      tokenInvalid: "Invalid link",
      
      // Property info
      property: "Property",
      unit: "Unit",
      validUntil: "Valid until",
    },
  };

  const text = t[language];

  const form = useForm({
    resolver: zodResolver(getOwnerFormSchema(text)),
    defaultValues: {
      fullName: "",
      nationality: "",
      phoneNumber: "",
      whatsappNumber: "",
      email: "",
      subleasingAllowed: false,
      propertyAddress: "",
      subdivision: "",
      unitNumber: "",
      agreedRent: "",
      agreedDeposit: "",
      moveInDate: "",
      contractDuration: "",
      servicesIncluded: [],
      servicesNotIncluded: [],
      petsAllowed: false,
      specialNotes: "",
      bankName: "",
      interbankCode: "",
      accountOrCardNumber: "",
      accountHolderName: "",
      swiftCode: "",
      bankAddress: "",
      bankEmail: "",
      idDocumentUrl: "",
      constitutiveActUrl: "",
      propertyDocumentsUrls: [],
      serviceReceiptsUrls: [],
      noDebtProofUrls: [],
      servicesFormatUrl: "",
      internalRulesUrl: "",
      condoRegulationsUrl: "",
      acceptedTerms: false,
    },
  });

  // Update form values when prefillData is loaded
  useEffect(() => {
    if (tokenData?.prefillData) {
      const prefill = tokenData.prefillData;
      if (prefill.fullName) form.setValue('fullName', prefill.fullName);
      if (prefill.email) form.setValue('email', prefill.email);
      if (prefill.phoneNumber) form.setValue('phoneNumber', prefill.phoneNumber);
      if (prefill.whatsappNumber) form.setValue('whatsappNumber', prefill.whatsappNumber);
    }
  }, [tokenData?.prefillData, form]);

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/owner-rental-form-tokens/${token}/submit`, data);
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: text.successTitle,
        description: text.successMessage,
      });
    },
    onError: (error: Error) => {
      toast({
        title: text.errorTitle,
        description: error.message || text.errorMessage,
        variant: "destructive",
      });
    },
  });

  // Document upload mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ files, documentType }: { files: FileList; documentType: string }) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('documents', file);
      });
      formData.append('documentType', documentType);

      const response = await fetch(`/api/owner-rental-form-tokens/${token}/upload-documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir documentos');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      const { documentType } = variables;
      const { urls } = data;
      
      // Update form values based on document type
      if (documentType === 'idDocument') {
        form.setValue('idDocumentUrl', urls[0]);
      } else if (documentType === 'constitutiveAct') {
        form.setValue('constitutiveActUrl', urls[0]);
      } else if (documentType === 'propertyDocuments') {
        const currentUrls = form.getValues('propertyDocumentsUrls') || [];
        form.setValue('propertyDocumentsUrls', [...currentUrls, ...urls]);
      } else if (documentType === 'serviceReceipts') {
        const currentUrls = form.getValues('serviceReceiptsUrls') || [];
        form.setValue('serviceReceiptsUrls', [...currentUrls, ...urls]);
      } else if (documentType === 'noDebtProof') {
        const currentUrls = form.getValues('noDebtProofUrls') || [];
        form.setValue('noDebtProofUrls', [...currentUrls, ...urls]);
      } else if (documentType === 'servicesFormat') {
        form.setValue('servicesFormatUrl', urls[0]);
      } else if (documentType === 'internalRules') {
        form.setValue('internalRulesUrl', urls[0]);
      } else if (documentType === 'condoRegulations') {
        form.setValue('condoRegulationsUrl', urls[0]);
      }

      toast({
        title: language === "es" ? "Documentos subidos" : "Documents uploaded",
        description: language === "es" ? `${urls.length} documento(s) subido(s) exitosamente` : `${urls.length} document(s) uploaded successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error al subir documentos" : "Error uploading documents",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    uploadDocumentMutation.mutate({ files: e.target.files, documentType });
    // Clear input for next upload
    e.target.value = '';
  };

  const removeDocument = (documentType: string, urlToRemove?: string) => {
    if (documentType === 'idDocument') {
      form.setValue('idDocumentUrl', '');
    } else if (documentType === 'constitutiveAct') {
      form.setValue('constitutiveActUrl', '');
    } else if (documentType === 'servicesFormat') {
      form.setValue('servicesFormatUrl', '');
    } else if (documentType === 'internalRules') {
      form.setValue('internalRulesUrl', '');
    } else if (documentType === 'condoRegulations') {
      form.setValue('condoRegulationsUrl', '');
    } else if (documentType === 'propertyDocuments' && urlToRemove) {
      const currentUrls = form.getValues('propertyDocumentsUrls') || [];
      form.setValue('propertyDocumentsUrls', currentUrls.filter(url => url !== urlToRemove));
    } else if (documentType === 'serviceReceipts' && urlToRemove) {
      const currentUrls = form.getValues('serviceReceiptsUrls') || [];
      form.setValue('serviceReceiptsUrls', currentUrls.filter(url => url !== urlToRemove));
    } else if (documentType === 'noDebtProof' && urlToRemove) {
      const currentUrls = form.getValues('noDebtProofUrls') || [];
      form.setValue('noDebtProofUrls', currentUrls.filter(url => url !== urlToRemove));
    }
  };

  const renderDocumentDisplay = (url: string, onRemove: () => void) => {
    const fileName = url.split('/').pop() || 'documento';
    const cleanFileName = fileName.length > 40 ? fileName.substring(0, 37) + '...' : fileName;
    
    return (
      <div className="flex items-center gap-2 p-2 bg-muted rounded-md" data-testid="document-display">
        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm flex-1 truncate">{cleanFileName}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => window.open(url, '_blank')}
          data-testid="button-view-document"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          onClick={onRemove}
          data-testid="button-remove-document"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Redirect if token validation fails
  useEffect(() => {
    if (validationError) {
      const error = validationError as any;
      toast({
        title: text.tokenInvalid,
        description: error.message,
        variant: "destructive",
      });
    }
  }, [validationError, text, toast]);

  // Verify this is an owner token
  const [recipientTypeMismatch, setRecipientTypeMismatch] = useState(false);
  
  useEffect(() => {
    if (tokenData && tokenData.valid) {
      const recipientType = tokenData.recipientType || 'tenant';
      if (recipientType !== 'owner') {
        setRecipientTypeMismatch(true);
        toast({
          title: text.tokenInvalid,
          description: language === "es" 
            ? `Este enlace es para ${recipientType === 'tenant' ? 'inquilino' : 'otro tipo de formulario'}, no para propietario.`
            : `This link is for ${recipientType === 'tenant' ? 'tenant' : 'other form type'}, not for property owner.`,
          variant: "destructive",
        });
      }
    }
  }, [tokenData, text, toast, language]);

  const onSubmit = (data: any) => {
    submitMutation.mutate(data);
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['fullName', 'whatsappNumber', 'email'];
        break;
      case 2:
        fieldsToValidate = ['agreedRent', 'agreedDeposit'];
        break;
      case 3:
        fieldsToValidate = ['bankName', 'accountOrCardNumber', 'accountHolderName'];
        break;
      case 4:
        // Document upload step - will validate when implementing file uploads
        break;
      case 5:
        fieldsToValidate = ['acceptedTerms'];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate as any);
    
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const progress = (currentStep / totalSteps) * 100;

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">{text.loading}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validationError || !tokenData?.valid || recipientTypeMismatch) {
    const errorMessage = recipientTypeMismatch
      ? (language === "es" 
          ? `Este enlace es para ${tokenData?.recipientType === 'tenant' ? 'inquilino' : 'otro tipo de formulario'}, no para propietario.`
          : `This link is for ${tokenData?.recipientType === 'tenant' ? 'tenant' : 'other form type'}, not for property owner.`)
      : ((validationError as any)?.message || text.errorMessage);
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold text-center">{text.tokenInvalid}</h2>
              <p className="text-muted-foreground text-center">{errorMessage}</p>
              {recipientTypeMismatch && tokenData?.recipientType === 'tenant' && (
                <Button
                  variant="outline"
                  onClick={() => window.location.href = `/public-rental-form/${token}`}
                  data-testid="button-switch-to-tenant-form"
                >
                  {language === "es" ? "Ir al formulario de inquilino" : "Go to tenant form"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <h2 className="text-2xl font-bold">{text.successTitle}</h2>
              <p className="text-muted-foreground">{text.successMessage}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unitInfo = tokenData.isExternal && tokenData.unit 
    ? `${tokenData.condominium?.name || ''} - ${tokenData.unit?.unitNumber || ''}`
    : tokenData.property?.title || '';

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <img
                    src={logoPath}
                    alt="HomesApp Logo"
                    className="h-12 object-contain"
                  />
                  <span className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">Smart Real Estate</span>
                </div>
                {tokenData?.externalAgency?.profileImageUrl && (
                  <img
                    src={tokenData.externalAgency.profileImageUrl}
                    alt="Agency Logo"
                    className="h-12 object-contain"
                  />
                )}
              </div>
              <LanguageToggle />
            </div>
            <CardTitle className="text-2xl">{text.title}</CardTitle>
            <CardDescription>
              {text.unit}: {unitInfo}
            </CardDescription>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {text.stepOf} {currentStep} {text.of} {totalSteps}
                </span>
                <span className="font-medium">{Math.round(progress)}% {text.complete}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Step 1: General Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {text.step1}
                  </h3>
                  
                  <div>
                    <Label htmlFor="fullName">{text.fullName} *</Label>
                    <Input
                      id="fullName"
                      {...form.register("fullName")}
                      data-testid="input-fullName"
                    />
                    {form.formState.errors.fullName && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="nationality">{text.nationality}</Label>
                    <Input
                      id="nationality"
                      {...form.register("nationality")}
                      data-testid="input-nationality"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phoneNumber">{text.phoneNumber}</Label>
                      <Input
                        id="phoneNumber"
                        {...form.register("phoneNumber")}
                        data-testid="input-phoneNumber"
                      />
                    </div>

                    <div>
                      <Label htmlFor="whatsappNumber">{text.whatsappNumber} *</Label>
                      <Input
                        id="whatsappNumber"
                        {...form.register("whatsappNumber")}
                        data-testid="input-whatsappNumber"
                      />
                      {form.formState.errors.whatsappNumber && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.whatsappNumber.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">{text.email} *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      data-testid="input-email"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="subleasingAllowed"
                      checked={form.watch("subleasingAllowed")}
                      onCheckedChange={(checked) => form.setValue("subleasingAllowed", checked as boolean)}
                      data-testid="checkbox-subleasingAllowed"
                    />
                    <Label htmlFor="subleasingAllowed" className="font-normal">
                      {text.subleasingAllowed}
                    </Label>
                  </div>
                </div>
              )}

              {/* Step 2: Property Details */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{text.step2}</h3>
                  
                  <div>
                    <Label htmlFor="propertyAddress">{text.propertyAddress}</Label>
                    <Input
                      id="propertyAddress"
                      {...form.register("propertyAddress")}
                      data-testid="input-propertyAddress"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subdivision">{text.subdivision}</Label>
                      <Input
                        id="subdivision"
                        {...form.register("subdivision")}
                        data-testid="input-subdivision"
                      />
                    </div>

                    <div>
                      <Label htmlFor="unitNumber">{text.unitNumber}</Label>
                      <Input
                        id="unitNumber"
                        {...form.register("unitNumber")}
                        data-testid="input-unitNumber"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="agreedRent">{text.agreedRent} *</Label>
                      <Input
                        id="agreedRent"
                        type="number"
                        step="0.01"
                        {...form.register("agreedRent")}
                        data-testid="input-agreedRent"
                      />
                      {form.formState.errors.agreedRent && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.agreedRent.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="agreedDeposit">{text.agreedDeposit} *</Label>
                      <Input
                        id="agreedDeposit"
                        type="number"
                        step="0.01"
                        {...form.register("agreedDeposit")}
                        data-testid="input-agreedDeposit"
                      />
                      {form.formState.errors.agreedDeposit && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.agreedDeposit.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="moveInDate">{text.moveInDate}</Label>
                      <Input
                        id="moveInDate"
                        type="date"
                        {...form.register("moveInDate")}
                        data-testid="input-moveInDate"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contractDuration">{text.contractDuration}</Label>
                      <Input
                        id="contractDuration"
                        placeholder="12 meses"
                        {...form.register("contractDuration")}
                        data-testid="input-contractDuration"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="petsAllowed"
                      checked={form.watch("petsAllowed")}
                      onCheckedChange={(checked) => form.setValue("petsAllowed", checked as boolean)}
                      data-testid="checkbox-petsAllowed"
                    />
                    <Label htmlFor="petsAllowed" className="font-normal">
                      {text.petsAllowed}
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="specialNotes">{text.specialNotes}</Label>
                    <Textarea
                      id="specialNotes"
                      {...form.register("specialNotes")}
                      rows={4}
                      data-testid="textarea-specialNotes"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Banking Information */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{text.step3}</h3>
                  
                  <div>
                    <Label htmlFor="bankName">{text.bankName} *</Label>
                    <Input
                      id="bankName"
                      {...form.register("bankName")}
                      data-testid="input-bankName"
                    />
                    {form.formState.errors.bankName && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.bankName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="accountHolderName">{text.accountHolderName} *</Label>
                    <Input
                      id="accountHolderName"
                      {...form.register("accountHolderName")}
                      data-testid="input-accountHolderName"
                    />
                    {form.formState.errors.accountHolderName && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.accountHolderName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="accountOrCardNumber">{text.accountOrCardNumber} *</Label>
                    <Input
                      id="accountOrCardNumber"
                      {...form.register("accountOrCardNumber")}
                      data-testid="input-accountOrCardNumber"
                    />
                    {form.formState.errors.accountOrCardNumber && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.accountOrCardNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="interbankCode">{text.interbankCode}</Label>
                    <Input
                      id="interbankCode"
                      placeholder="18 dígitos"
                      {...form.register("interbankCode")}
                      data-testid="input-interbankCode"
                    />
                  </div>

                  <div>
                    <Label htmlFor="swiftCode">{text.swiftCode}</Label>
                    <Input
                      id="swiftCode"
                      {...form.register("swiftCode")}
                      data-testid="input-swiftCode"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bankAddress">{text.bankAddress}</Label>
                    <Textarea
                      id="bankAddress"
                      {...form.register("bankAddress")}
                      rows={2}
                      data-testid="textarea-bankAddress"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bankEmail">{text.bankEmail}</Label>
                    <Input
                      id="bankEmail"
                      type="email"
                      {...form.register("bankEmail")}
                      data-testid="input-bankEmail"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Documents */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    {text.step4}
                  </h3>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {language === "es" 
                        ? "Por favor sube los documentos requeridos. Los campos marcados con * son obligatorios."
                        : "Please upload the required documents. Fields marked with * are mandatory."}
                    </p>

                    {/* ID Document */}
                    <div className="space-y-2">
                      <Label htmlFor="idDocument">{text.idDocument} *</Label>
                      {form.watch('idDocumentUrl') ? (
                        renderDocumentDisplay(
                          form.watch('idDocumentUrl')!, 
                          () => removeDocument('idDocument')
                        )
                      ) : (
                        <Input
                          id="idDocument"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocumentUpload(e, 'idDocument')}
                          disabled={uploadDocumentMutation.isPending}
                          data-testid="input-idDocument"
                        />
                      )}
                    </div>

                    {/* Constitutive Act */}
                    <div className="space-y-2">
                      <Label htmlFor="constitutiveAct">{text.constitutiveAct}</Label>
                      {form.watch('constitutiveActUrl') ? (
                        renderDocumentDisplay(
                          form.watch('constitutiveActUrl')!, 
                          () => removeDocument('constitutiveAct')
                        )
                      ) : (
                        <Input
                          id="constitutiveAct"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocumentUpload(e, 'constitutiveAct')}
                          disabled={uploadDocumentMutation.isPending}
                          data-testid="input-constitutiveAct"
                        />
                      )}
                      <p className="text-xs text-muted-foreground">
                        {language === "es" 
                          ? "Solo para personas morales" 
                          : "Only for legal entities"}
                      </p>
                    </div>

                    {/* Property Documents */}
                    <div className="space-y-2">
                      <Label htmlFor="propertyDocuments">
                        {language === "es" ? "Documentos de la Propiedad" : "Property Documents"}
                      </Label>
                      {form.watch('propertyDocumentsUrls')?.map((url, index) => (
                        <div key={index}>
                          {renderDocumentDisplay(url, () => removeDocument('propertyDocuments', url))}
                        </div>
                      ))}
                      <Input
                        id="propertyDocuments"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        onChange={(e) => handleDocumentUpload(e, 'propertyDocuments')}
                        disabled={uploadDocumentMutation.isPending}
                        data-testid="input-propertyDocuments"
                      />
                    </div>

                    {/* Service Receipts */}
                    <div className="space-y-2">
                      <Label htmlFor="serviceReceipts">
                        {language === "es" ? "Recibos de Servicios" : "Service Receipts"}
                      </Label>
                      {form.watch('serviceReceiptsUrls')?.map((url, index) => (
                        <div key={index}>
                          {renderDocumentDisplay(url, () => removeDocument('serviceReceipts', url))}
                        </div>
                      ))}
                      <Input
                        id="serviceReceipts"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        onChange={(e) => handleDocumentUpload(e, 'serviceReceipts')}
                        disabled={uploadDocumentMutation.isPending}
                        data-testid="input-serviceReceipts"
                      />
                    </div>

                    {/* No Debt Proof */}
                    <div className="space-y-2">
                      <Label htmlFor="noDebtProof">
                        {language === "es" ? "Comprobante de No Adeudo" : "No Debt Proof"}
                      </Label>
                      {form.watch('noDebtProofUrls')?.map((url, index) => (
                        <div key={index}>
                          {renderDocumentDisplay(url, () => removeDocument('noDebtProof', url))}
                        </div>
                      ))}
                      <Input
                        id="noDebtProof"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        onChange={(e) => handleDocumentUpload(e, 'noDebtProof')}
                        disabled={uploadDocumentMutation.isPending}
                        data-testid="input-noDebtProof"
                      />
                    </div>

                    {/* Services Format */}
                    <div className="space-y-2">
                      <Label htmlFor="servicesFormat">{text.servicesFormat}</Label>
                      {form.watch('servicesFormatUrl') ? (
                        renderDocumentDisplay(
                          form.watch('servicesFormatUrl')!, 
                          () => removeDocument('servicesFormat')
                        )
                      ) : (
                        <Input
                          id="servicesFormat"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocumentUpload(e, 'servicesFormat')}
                          disabled={uploadDocumentMutation.isPending}
                          data-testid="input-servicesFormat"
                        />
                      )}
                    </div>

                    {/* Internal Rules */}
                    <div className="space-y-2">
                      <Label htmlFor="internalRules">{text.internalRules}</Label>
                      {form.watch('internalRulesUrl') ? (
                        renderDocumentDisplay(
                          form.watch('internalRulesUrl')!, 
                          () => removeDocument('internalRules')
                        )
                      ) : (
                        <Input
                          id="internalRules"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocumentUpload(e, 'internalRules')}
                          disabled={uploadDocumentMutation.isPending}
                          data-testid="input-internalRules"
                        />
                      )}
                    </div>

                    {/* Condo Regulations */}
                    <div className="space-y-2">
                      <Label htmlFor="condoRegulations">{text.condoRegulations}</Label>
                      {form.watch('condoRegulationsUrl') ? (
                        renderDocumentDisplay(
                          form.watch('condoRegulationsUrl')!, 
                          () => removeDocument('condoRegulations')
                        )
                      ) : (
                        <Input
                          id="condoRegulations"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocumentUpload(e, 'condoRegulations')}
                          disabled={uploadDocumentMutation.isPending}
                          data-testid="input-condoRegulations"
                        />
                      )}
                    </div>

                    {uploadDocumentMutation.isPending && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {language === "es" ? "Subiendo documentos..." : "Uploading documents..."}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Terms and Conditions */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {activeTerms?.title || text.step5}
                  </h3>
                  
                  {activeTerms ? (
                    <div className="p-6 border rounded-lg bg-muted/30 max-h-96 overflow-y-auto">
                      <div className="space-y-4 text-sm whitespace-pre-wrap">
                        {activeTerms.content}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-md bg-muted">
                      <p className="text-sm">{text.termsText}</p>
                    </div>
                  )}

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptedTerms"
                      checked={form.watch("acceptedTerms")}
                      onCheckedChange={(checked) => form.setValue("acceptedTerms", checked as boolean)}
                      data-testid="checkbox-acceptedTerms"
                    />
                    <Label htmlFor="acceptedTerms" className="font-normal leading-relaxed">
                      {text.acceptTerms} *
                    </Label>
                  </div>
                  {form.formState.errors.acceptedTerms && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.acceptedTerms.message}
                    </p>
                  )}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between pt-6">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={previousStep}
                    data-testid="button-previous"
                  >
                    {text.previous}
                  </Button>
                )}
                
                <div className="ml-auto flex gap-2">
                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      data-testid="button-next"
                    >
                      {text.next}
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={submitMutation.isPending}
                      data-testid="button-submit"
                    >
                      {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {text.submit}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
