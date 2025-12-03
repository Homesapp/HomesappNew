import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Building2, Home, Loader2, ChevronLeft, ChevronRight, ChevronDown, User, Search, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png";

interface PropertyInterest {
  condominiumId: string;
  condominiumName: string;
  unitIds: string[];
}

const COUNTRY_CODES = [
  { code: "+52", country: "MX", flag: "MX" },
  { code: "+1", country: "US/CA", flag: "US" },
  { code: "+57", country: "CO", flag: "CO" },
  { code: "+54", country: "AR", flag: "AR" },
  { code: "+56", country: "CL", flag: "CL" },
  { code: "+34", country: "ES", flag: "ES" },
  { code: "+55", country: "BR", flag: "BR" },
  { code: "+51", country: "PE", flag: "PE" },
];

const UNIT_TYPES = [
  "Departamento",
  "Casa",
  "Estudio",
  "PH / Penthouse",
  "Villa",
  "Loft",
];

const NEIGHBORHOODS = [
  "Aldea Zama",
  "Centro",
  "La Veleta",
  "Region 15",
  "Region 8",
  "Holistika",
  "Selva Zama",
  "Otro",
];

const STEPS = [
  { id: 1, title: "Información del Cliente", description: "Datos de contacto", icon: User },
  { id: 2, title: "Detalles de Búsqueda", description: "Preferencias de propiedad", icon: Search },
];

const brokerFormSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  email: z.string().email("Correo electrónico válido").optional().or(z.literal("")),
  countryCode: z.string().min(1, "Código de país requerido"),
  phoneLast4: z.string().length(4, "Últimos 4 dígitos del teléfono del cliente"),
  contractDuration: z.string().min(1, "Tiempo de contrato requerido"),
  checkInDate: z.string().min(1, "Fecha de check-in requerida"),
  hasPets: z.string().min(1, "Información sobre mascotas requerida"),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  bedrooms: z.string().min(1, "Número de recámaras requerido"),
  desiredUnitTypes: z.array(z.string()).optional(),
  desiredNeighborhoods: z.array(z.string()).optional(),
  interestedCondominiumId: z.string().optional(),
  interestedUnitIds: z.array(z.string()).optional(),
  sellerName: z.string().min(1, "Nombre del broker requerido"),
  source: z.string().optional(),
  notes: z.string().optional(),
});

type BrokerFormData = z.infer<typeof brokerFormSchema>;

export default function LeadRegistrationBroker() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string>("");
  const [selectedUnitTypes, setSelectedUnitTypes] = useState<string[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [propertyInterests, setPropertyInterests] = useState<PropertyInterest[]>([]);
  const [unitTypeOpen, setUnitTypeOpen] = useState(false);
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);
  
  // Extract seller name from URL parameter for personalized links
  // Links format: /leads/broker?seller=NombreVendedor
  const urlParams = new URLSearchParams(window.location.search);
  const sellerFromUrl = urlParams.get("seller") || "";
  const isPersonalizedLink = !!sellerFromUrl;

  // Fetch agency info for logo
  const { data: agencyData } = useQuery<{ id: string; name: string; logoUrl: string }>({
    queryKey: ["/api/public/agency"],
    queryFn: async () => {
      const response = await fetch("/api/public/agency");
      if (!response.ok) return { id: "", name: "", logoUrl: "" };
      return response.json();
    },
    staleTime: 30 * 60 * 1000,
  });

  // Fetch condominiums for property interest selection
  const { data: condominiumsData, isLoading: isLoadingCondos } = useQuery<{ id: string; name: string; neighborhood?: string }[]>({
    queryKey: ["/api/public/condominiums"],
    queryFn: async () => {
      const response = await fetch("/api/public/condominiums");
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });
  const condominiums = condominiumsData || [];

  // Fetch units for selected condominium
  const { data: unitsData, isLoading: isLoadingUnits } = useQuery<{ id: string; unitNumber: string; type?: string }[]>({
    queryKey: ["/api/public/condominiums", selectedCondominiumId, "units"],
    queryFn: async () => {
      const response = await fetch(`/api/public/condominiums/${selectedCondominiumId}/units`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedCondominiumId,
    staleTime: 5 * 60 * 1000,
  });
  const units = unitsData || [];

  const form = useForm<BrokerFormData>({
    resolver: zodResolver(brokerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+52",
      phoneLast4: "",
      contractDuration: "",
      checkInDate: "",
      hasPets: "",
      budgetMin: undefined,
      budgetMax: undefined,
      bedrooms: "",
      desiredUnitTypes: [],
      desiredNeighborhoods: [],
      interestedCondominiumId: "",
      interestedUnitIds: [],
      sellerName: sellerFromUrl, // Pre-fill from URL parameter if available
      source: "",
      notes: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: BrokerFormData) => {
      // Helper: parse bedrooms text to extract numeric value
      const parseBedroomsText = (text?: string): number | undefined => {
        if (!text) return undefined;
        const match = text.match(/(\d+)/);
        return match ? parseInt(match[1]) : undefined;
      };
      
      // Prepare property interests with full structure for backend
      const propertyInterestsPayload = propertyInterests.map(p => ({
        condominiumId: p.condominiumId,
        condominiumName: p.condominiumName,
        unitIds: p.unitIds,
      }));
      
      // Also provide legacy comma-separated format for backward compatibility
      const allCondominiumIds = propertyInterests.map(p => p.condominiumId).join(",");
      const allUnitIds = propertyInterests.flatMap(p => p.unitIds).join(",");
      
      // Parse numeric values from text fields
      const numericBedrooms = parseBedroomsText(data.bedrooms);
      
      const response = await fetch("/api/public/leads/broker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          desiredUnitType: data.desiredUnitTypes?.join(", ") || "",
          desiredNeighborhood: data.desiredNeighborhoods?.join(", ") || "",
          // Budget range fields (numeric)
          budgetMin: data.budgetMin,
          budgetMax: data.budgetMax,
          // Text fields for display
          bedroomsText: data.bedrooms,
          // Numeric fields for filtering
          bedrooms: numericBedrooms,
          // Full structured property interests
          propertyInterests: propertyInterestsPayload,
          // Legacy fields for backward compatibility
          interestedCondominiumId: allCondominiumIds || "",
          interestedUnitId: allUnitIds || "",
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Error al enviar" }));
        throw new Error(error.message || error.detail);
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "¡Registro Exitoso!",
        description: "Gracias por compartir este lead. Lo revisaremos pronto.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al enviar tu registro",
        variant: "destructive",
      });
    },
  });

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate step 1 fields
      const fieldsToValidate: (keyof BrokerFormData)[] = ["firstName", "lastName", "phoneLast4", "countryCode"];
      const isValid = await form.trigger(fieldsToValidate);
      
      const values = form.getValues();
      const hasRequiredValues = 
        values.firstName?.trim() && 
        values.lastName?.trim() && 
        values.phoneLast4?.trim() && 
        values.phoneLast4.length === 4;
      
      if (!isValid || !hasRequiredValues) {
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = (data: BrokerFormData) => {
    if (currentStep !== STEPS.length) {
      return;
    }
    submitMutation.mutate({
      ...data,
      desiredUnitTypes: selectedUnitTypes,
      desiredNeighborhoods: selectedNeighborhoods,
      interestedUnitIds: selectedUnitIds,
    });
  };

  // Add property interest
  const addPropertyInterest = () => {
    if (!selectedCondominiumId) return;
    
    const condo = condominiums.find(c => c.id === selectedCondominiumId);
    if (!condo) return;
    
    // Check if already exists
    const exists = propertyInterests.some(p => p.condominiumId === selectedCondominiumId);
    if (exists) {
      // Update existing entry
      setPropertyInterests(prev => prev.map(p => 
        p.condominiumId === selectedCondominiumId 
          ? { ...p, unitIds: selectedUnitIds }
          : p
      ));
    } else {
      // Add new entry
      setPropertyInterests(prev => [...prev, {
        condominiumId: selectedCondominiumId,
        condominiumName: condo.name,
        unitIds: selectedUnitIds,
      }]);
    }
    
    // Reset selections
    setSelectedCondominiumId("");
    setSelectedUnitIds([]);
  };

  // Remove property interest
  const removePropertyInterest = (condominiumId: string) => {
    setPropertyInterests(prev => prev.filter(p => p.condominiumId !== condominiumId));
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">¡Registro Completado!</CardTitle>
            <CardDescription className="text-base">
              Gracias por compartir este lead. Lo revisaremos y te contactaremos si hay coincidencias.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-6 mb-4">
            <div className="flex flex-col items-center">
              <img 
                src={logoPath} 
                alt="HomesApp Logo" 
                className="h-14 w-auto"
              />
              <span className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">Smart Real Estate</span>
            </div>
            {agencyData?.logoUrl && (
              <>
                <span className="text-muted-foreground text-xl">×</span>
                <img 
                  src={agencyData.logoUrl} 
                  alt={`${agencyData.name} Logo`} 
                  className="h-14 w-auto object-contain"
                />
              </>
            )}
          </div>
          <CardTitle className="text-3xl">Registro de Lead para Brokers</CardTitle>
          <CardDescription className="text-base">
            Comparte información básica de tu cliente para verificar disponibilidad
            {agencyData?.name && <span className="block mt-1 font-medium">{agencyData.name}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Personalized Link Banner */}
          {isPersonalizedLink && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-primary">Link de {sellerFromUrl}</p>
                  <p className="text-sm text-muted-foreground">
                    Los leads registrados aquí serán asignados a {sellerFromUrl} con derecho al 10% de comisión
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex-1 text-center transition-all ${
                    step.id < currentStep
                      ? "text-primary"
                      : step.id === currentStep
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      step.id < currentStep
                        ? "bg-primary text-primary-foreground"
                        : step.id === currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {step.id < currentStep ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                    </div>
                  </div>
                  <div className="text-xs">{step.description}</div>
                  <div className="text-sm hidden sm:block">{step.title}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    step.id <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Client Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Cliente *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Juan" data-testid="input-first-name" />
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
                          <FormLabel>Apellido del Cliente *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Pérez" data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="ejemplo@email.com (opcional)" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <FormLabel>Últimos 4 dígitos del teléfono *</FormLabel>
                      <div className="flex gap-2">
                        <FormField
                          control={form.control}
                          name="countryCode"
                          render={({ field }) => (
                            <FormItem className="w-28">
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-country-code">
                                    <SelectValue placeholder="Lada" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {COUNTRY_CODES.map((cc) => (
                                    <SelectItem key={cc.code} value={cc.code}>
                                      {cc.code} {cc.country}
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
                          name="phoneLast4"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="tel" 
                                  placeholder="4567" 
                                  maxLength={4}
                                  data-testid="input-phone-last4" 
                                />
                              </FormControl>
                              <FormDescription>
                                Solo los últimos 4 dígitos del teléfono del cliente
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Search Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contractDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiempo de Contrato *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contract-duration">
                                <SelectValue placeholder="Seleccionar duración" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="6 meses">6 meses</SelectItem>
                              <SelectItem value="1 año">1 año</SelectItem>
                              <SelectItem value="2 años">2 años</SelectItem>
                              <SelectItem value="3+ años">3+ años</SelectItem>
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
                          <FormLabel>Fecha de Check-in *</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" data-testid="input-check-in-date" />
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
                          <FormLabel>Mascotas *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-has-pets">
                                <SelectValue placeholder="¿Tiene mascotas?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="No">No</SelectItem>
                              <SelectItem value="1 Perro">1 Perro</SelectItem>
                              <SelectItem value="2 Perros">2 Perros</SelectItem>
                              <SelectItem value="1 Gato">1 Gato</SelectItem>
                              <SelectItem value="2 Gatos">2 Gatos</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <FormLabel>Presupuesto de Renta (MXN)</FormLabel>
                      <div className="flex gap-2 items-center">
                        <FormField
                          control={form.control}
                          name="budgetMin"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Mín"
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  data-testid="input-budget-min"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span className="text-muted-foreground">-</span>
                        <FormField
                          control={form.control}
                          name="budgetMax"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Máx"
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  data-testid="input-budget-max"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recámaras *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: 1-2, 2+, 3" data-testid="input-bedrooms" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <FormLabel>Tipo de Unidad (opcional, múltiple)</FormLabel>
                      <Popover open={unitTypeOpen} onOpenChange={setUnitTypeOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal"
                            data-testid="button-unit-type"
                          >
                            {selectedUnitTypes.length > 0
                              ? `${selectedUnitTypes.length} seleccionado(s)`
                              : "Seleccionar tipos de unidad..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-2">
                          <div className="space-y-2">
                            {UNIT_TYPES.map((type) => (
                              <div key={type} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`unit-type-${type}`}
                                  checked={selectedUnitTypes.includes(type)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedUnitTypes([...selectedUnitTypes, type]);
                                    } else {
                                      setSelectedUnitTypes(selectedUnitTypes.filter(t => t !== type));
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`unit-type-${type}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {type}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormLabel>Zona Deseada (opcional, múltiple)</FormLabel>
                    <Popover open={neighborhoodOpen} onOpenChange={setNeighborhoodOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-normal"
                          data-testid="button-neighborhood"
                        >
                          {selectedNeighborhoods.length > 0
                            ? `${selectedNeighborhoods.length} zona(s) seleccionada(s)`
                            : "Seleccionar zonas..."}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2">
                        <div className="space-y-2">
                          {NEIGHBORHOODS.map((zone) => (
                            <div key={zone} className="flex items-center space-x-2">
                              <Checkbox
                                id={`neighborhood-${zone}`}
                                checked={selectedNeighborhoods.includes(zone)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedNeighborhoods([...selectedNeighborhoods, zone]);
                                  } else {
                                    setSelectedNeighborhoods(selectedNeighborhoods.filter(z => z !== zone));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`neighborhood-${zone}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {zone}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Property Interests Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <FormLabel className="text-base">Propiedades de Interés (Opcional)</FormLabel>
                    </div>
                    <FormDescription>
                      Puedes agregar múltiples propiedades de diferentes condominios que le interesen al cliente.
                    </FormDescription>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <FormLabel>Condominio</FormLabel>
                        <Select
                          value={selectedCondominiumId}
                          onValueChange={(value) => {
                            setSelectedCondominiumId(value);
                            setSelectedUnitIds([]);
                          }}
                        >
                          <SelectTrigger data-testid="select-condominium">
                            <SelectValue placeholder="Seleccionar condominio" />
                          </SelectTrigger>
                          <SelectContent>
                            {condominiums.map((condo) => (
                              <SelectItem key={condo.id} value={condo.id}>
                                {condo.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <FormLabel>Unidades de Interés</FormLabel>
                        <Select
                          disabled={!selectedCondominiumId}
                          value=""
                          onValueChange={(value) => {
                            if (!selectedUnitIds.includes(value)) {
                              setSelectedUnitIds([...selectedUnitIds, value]);
                            }
                          }}
                        >
                          <SelectTrigger data-testid="select-units">
                            <SelectValue placeholder={selectedCondominiumId ? "Agregar unidad" : "Primero seleccione un condominio"} />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.unitNumber} {unit.type && `(${unit.type})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedUnitIds.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedUnitIds.map((unitId) => {
                              const unit = units.find(u => u.id === unitId);
                              return (
                                <span
                                  key={unitId}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md"
                                >
                                  {unit?.unitNumber || unitId}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedUnitIds(selectedUnitIds.filter(id => id !== unitId))}
                                    className="hover:text-destructive"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {selectedCondominiumId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPropertyInterest}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar Propiedad de Interés
                      </Button>
                    )}

                    {/* List of added property interests */}
                    {propertyInterests.length > 0 && (
                      <div className="space-y-2">
                        {propertyInterests.map((interest) => (
                          <div
                            key={interest.condominiumId}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{interest.condominiumName}</span>
                              {interest.unitIds.length > 0 && (
                                <span className="text-sm text-muted-foreground">
                                  ({interest.unitIds.length} unidad(es))
                                </span>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePropertyInterest(interest.condominiumId)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Broker Information */}
                  <div className="space-y-4 pt-4 border-t">
                    <FormLabel className="text-base">Información del Broker</FormLabel>
                    <FormField
                      control={form.control}
                      name="sellerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {isPersonalizedLink ? "Vendedor Asignado" : "Tu Nombre (Broker)"} *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Tu nombre completo" 
                              data-testid="input-seller-name"
                              readOnly={isPersonalizedLink}
                              className={isPersonalizedLink ? "bg-muted cursor-not-allowed" : ""}
                            />
                          </FormControl>
                          <FormDescription>
                            {isPersonalizedLink 
                              ? `Este lead será asignado a ${sellerFromUrl}. Si el cliente renta, ${sellerFromUrl} recibirá el 10% de comisión.`
                              : "Escribe tu nombre completo para identificar quién registró este lead."
                            }
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas Adicionales</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Cualquier información adicional sobre el cliente..."
                              rows={3}
                              data-testid="input-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    className="gap-2"
                    data-testid="button-previous"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-2"
                    data-testid="button-next"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="gap-2"
                    data-testid="button-submit"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Registrar Lead
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
  );
}
