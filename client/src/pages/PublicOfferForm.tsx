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
import { Loader2, Home, CheckCircle2, AlertCircle, Upload, X, Pen, ChevronLeft, ChevronRight } from "lucide-react";
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png";
import { LanguageToggle } from "@/components/LanguageToggle";

const offerFormSchema = z.object({
  fullName: z.string().min(2, "Nombre completo es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Teléfono es requerido"),
  nationality: z.string().min(2, "Nacionalidad es requerida"),
  occupation: z.string().min(2, "Ocupación es requerida"),
  usageType: z.enum(["vivienda", "subarrendamiento"], { required_error: "Selecciona el tipo de uso" }),
  monthlyRent: z.string().min(1, "Renta mensual es requerida"),
  currency: z.string().min(1, "Moneda es requerida"),
  contractDuration: z.string().min(1, "Duración del contrato es requerida"),
  moveInDate: z.string().min(1, "Fecha de ingreso es requerida"),
  moveOutDate: z.string().optional(),
  customContractDates: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  contractCost: z.number().optional(),
  securityDeposit: z.number().optional(),
  numberOfOccupants: z.string().min(1, "Número de ocupantes es requerido"),
  pets: z.string().min(1, "Información sobre mascotas es requerida"),
  petDetails: z.string().optional(),
  petPhotos: z.array(z.string()).optional(),
  offeredServices: z.array(z.string()).optional(),
  propertyRequiredServices: z.array(z.string()).optional(),
  additionalComments: z.string().optional(),
  signature: z.string().optional(),
});

type OfferFormValues = z.infer<typeof offerFormSchema>;

export default function PublicOfferForm() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [petPhotoUrls, setPetPhotoUrls] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const { data: validationData, isLoading: isValidating } = useQuery({
    queryKey: ["/api/offer-tokens", token, "validate"],
    queryFn: async () => {
      const res = await fetch(`/api/offer-tokens/${token}/validate`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Token inválido");
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

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
      offeredServices: [],
      propertyRequiredServices: [],
      additionalComments: "",
      signature: "",
    },
  });

  const property = validationData?.property;
  const lead = validationData?.lead;

  const usageType = form.watch("usageType");
  const contractDuration = form.watch("contractDuration");
  const monthlyRent = parseFloat(form.watch("monthlyRent") || "0");
  const moveInDate = form.watch("moveInDate");
  const moveOutDate = form.watch("moveOutDate");

  // Calculate contract costs based on usage type
  const contractCost = usageType === "vivienda" ? 2500 : 3800;
  const securityDepositMonths = usageType === "vivienda" ? 1 : 2;
  const securityDeposit = monthlyRent * securityDepositMonths;

  // Update form values when costs change
  useEffect(() => {
    form.setValue("contractCost", contractCost);
  }, [contractCost, form]);

  useEffect(() => {
    form.setValue("securityDeposit", securityDeposit);
  }, [securityDeposit, form]);

  // Update customContractDates when duration is personalizado
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

  // Set property required services when property data loads
  useEffect(() => {
    if (property?.includedServices) {
      form.setValue("propertyRequiredServices", property.includedServices);
    }
  }, [property, form]);

  // Pre-fill form with lead data when available
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
      // Pre-fill contract duration if available (take first option from array)
      if (lead.contractDuration && lead.contractDuration.length > 0) {
        form.setValue("contractDuration", lead.contractDuration[0]);
      }
      // Pre-fill move in date if available (take first option from array)
      if (lead.moveInDate && lead.moveInDate.length > 0) {
        form.setValue("moveInDate", lead.moveInDate[0]);
      }
      // Pre-fill pets information if available
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
        throw new Error(error.message || "Error al subir fotos");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setPetPhotoUrls([...petPhotoUrls, ...data.urls]);
      form.setValue("petPhotos", [...petPhotoUrls, ...data.urls]);
      toast({
        title: "Fotos subidas exitosamente",
        description: `${data.urls.length} foto(s) subida(s)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al subir fotos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePetPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (petPhotoUrls.length + e.target.files.length > 3) {
      toast({
        title: "Límite excedido",
        description: "Máximo 3 fotos de mascotas",
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

  // Signature canvas handlers
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
      // Ensure all calculated values are included
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
        title: "¡Oferta enviada exitosamente!",
        description: "Nuestro equipo revisará tu oferta y te contactará pronto.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al enviar oferta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OfferFormValues) => {
    console.log("Form submitted with data:", data);
    submitOfferMutation.mutate(data);
  };

  // Debug form errors
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
              <p className="text-muted-foreground">Validando enlace...</p>
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
              <CardTitle>Enlace no válido</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Este enlace ha expirado o ya fue utilizado. Por favor, contacta a tu agente para obtener un nuevo enlace.
            </p>
          </CardContent>
        </Card>
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
              <CardTitle>¡Oferta enviada!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Tu oferta ha sido recibida exitosamente. Nuestro equipo la revisará y te contactará en las próximas 24-48 horas.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Próximos pasos:</strong>
                <br />
                1. Verificaremos tu información
                <br />
                2. Contactaremos al propietario
                <br />
                3. Te notificaremos la decisión
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const propertyRequiredServices = property?.includedServices || [];
  const availableServices = [
    { id: "agua", label: "Agua" },
    { id: "luz", label: "Luz/Electricidad" },
    { id: "internet", label: "Internet" },
    { id: "gas", label: "Gas" },
    { id: "limpieza", label: "Servicio de limpieza" },
    { id: "jardineria", label: "Jardinería" },
    { id: "mantenimiento", label: "Mantenimiento" },
  ];

  const propertyPhotos = property?.photos || [];
  const displayPhotos = propertyPhotos.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logo */}
        <div className="relative text-center mb-8">
          <div className="absolute top-0 right-0">
            <LanguageToggle />
          </div>
          <img 
            src={logoPath} 
            alt="HomesApp Logo" 
            className="h-20 mx-auto mb-4"
            data-testid="img-homesapp-logo"
          />
          <p className="text-sm text-slate-600 dark:text-slate-400">Tulum Rental Homes ™</p>
        </div>

        {/* Property Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Home className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Oferta de Renta</CardTitle>
            </div>
            <CardDescription className="text-lg">{property?.title || "Propiedad"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo Gallery */}
            {displayPhotos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Fotos de la Propiedad</h3>
                <div className="flex gap-2 overflow-x-auto pb-2" data-testid="gallery-property-photos">
                  {displayPhotos.map((photo: string, index: number) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700"
                    >
                      <img
                        src={photo}
                        alt={`Propiedad ${index + 1}`}
                        className="w-full h-full object-cover"
                        data-testid={`img-property-${index}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Property Details - Prominent Display */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Dirección</p>
                  <p className="text-base font-semibold text-foreground">{property?.address || "No disponible"}</p>
                </div>
                
                {property?.monthlyRentPrice && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Renta Mensual Solicitada por el Propietario</p>
                    <p className="text-3xl font-bold text-primary">
                      ${property.monthlyRentPrice.toLocaleString()} {property.currency || "USD"}
                      <span className="text-base font-normal text-muted-foreground">/mes</span>
                    </p>
                  </div>
                )}

                {propertyRequiredServices.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Servicios que el Propietario Requiere que Pagues</p>
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
            <CardTitle>Completa tu oferta</CardTitle>
            <CardDescription>
              Por favor proporciona la siguiente información para formalizar tu interés en la propiedad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Información Personal</h3>
                  
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Juan Pérez" data-testid="input-fullName" />
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
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="juan@ejemplo.com" data-testid="input-email" />
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
                          <FormLabel>Teléfono *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+52 123 456 7890" data-testid="input-phone" />
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
                          <FormLabel>Nacionalidad *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Mexicana" data-testid="input-nationality" />
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
                          <FormLabel>Ocupación *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ingeniero de Software" data-testid="input-occupation" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Detalles de la Oferta</h3>

                  <FormField
                    control={form.control}
                    name="usageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Uso *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-usageType">
                              <SelectValue placeholder="Selecciona el tipo de uso" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vivienda">Para vivir (Costo contrato: $2,500 MXN, Depósito: 1 mes)</SelectItem>
                            <SelectItem value="subarrendamiento">Para subarrendar (Costo contrato: $3,800 MXN, Depósito: 2 meses)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {usageType === "vivienda" 
                            ? "Costo de contrato: $2,500 MXN + depósito de seguridad de 1 mes de renta"
                            : "Costo de contrato: $3,800 MXN + depósito de seguridad de 2 meses de renta"
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
                          <FormLabel>Renta Mensual Ofertada *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="15000" data-testid="input-monthlyRent" />
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
                          <FormLabel>Moneda *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-currency">
                                <SelectValue placeholder="Selecciona moneda" />
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
                        <strong>Costos totales:</strong>
                        <br />
                        • Costo de contrato: ${contractCost.toLocaleString()} MXN
                        <br />
                        • Depósito de seguridad: ${securityDeposit.toLocaleString()} {form.watch("currency")} ({securityDepositMonths} {securityDepositMonths === 1 ? "mes" : "meses"})
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contractDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duración del Contrato *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contractDuration">
                                <SelectValue placeholder="Selecciona duración" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="6 meses">6 meses</SelectItem>
                              <SelectItem value="12 meses">12 meses</SelectItem>
                              <SelectItem value="18 meses">18 meses</SelectItem>
                              <SelectItem value="24 meses">24 meses</SelectItem>
                              <SelectItem value="personalizado">Personalizado (especificar fechas)</SelectItem>
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
                          <FormLabel>Fecha de Ingreso *</FormLabel>
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
                          <FormLabel>Fecha de Salida *</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" data-testid="input-moveOutDate" />
                          </FormControl>
                          <FormDescription>Especifica la fecha de salida para contrato personalizado</FormDescription>
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
                        <FormLabel>Número de Ocupantes *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-numberOfOccupants">
                              <SelectValue placeholder="Selecciona número" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 persona</SelectItem>
                            <SelectItem value="2">2 personas</SelectItem>
                            <SelectItem value="3">3 personas</SelectItem>
                            <SelectItem value="4">4 personas</SelectItem>
                            <SelectItem value="5+">5+ personas</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Servicios</h3>

                  {propertyRequiredServices && propertyRequiredServices.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                        Servicios requeridos por el propietario:
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
                        <FormLabel>Servicios que ofreces pagar</FormLabel>
                        <FormDescription>Selecciona los servicios que estás dispuesto a cubrir</FormDescription>
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
                  <h3 className="text-lg font-semibold">Información Adicional</h3>

                  <FormField
                    control={form.control}
                    name="pets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>¿Tiene mascotas? *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-pets">
                              <SelectValue placeholder="Selecciona una opción" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="yes">Sí</SelectItem>
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
                            <FormLabel>Detalles de Mascotas</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Tipo, raza, tamaño, etc."
                                data-testid="input-petDetails"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <FormLabel>Fotos de Mascotas (máximo 3)</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {petPhotoUrls.map((url, index) => (
                            <div key={index} className="relative">
                              <img src={url} alt={`Mascota ${index + 1}`} className="w-24 h-24 object-cover rounded-lg" />
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
                        <FormDescription>Sube fotos claras de tu(s) mascota(s)</FormDescription>
                      </div>
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="additionalComments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comentarios Adicionales (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Cualquier información adicional que desees compartir..."
                            data-testid="input-additionalComments"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Firma Digital</h3>
                  <div className="space-y-2">
                    <FormLabel>Firma aquí (Opcional)</FormLabel>
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
                        Limpiar firma
                      </Button>
                      {hasSignature && (
                        <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Firma capturada
                        </p>
                      )}
                    </div>
                    <FormDescription>Dibuja tu firma en el espacio de arriba (opcional - puedes enviar sin firmar)</FormDescription>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitOfferMutation.isPending}
                  data-testid="button-submit-offer"
                >
                  {submitOfferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Oferta
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          <p>HomesApp - Tulum Rental Homes ™</p>
          <p className="mt-1">Tu información será tratada de forma confidencial</p>
        </div>
      </div>
    </div>
  );
}
