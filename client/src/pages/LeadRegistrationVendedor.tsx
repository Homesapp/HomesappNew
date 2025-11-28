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
import { Building2, CheckCircle2, Loader2, Home, ChevronDown, Plus, Trash2 } from "lucide-react";
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

const vendedorFormSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  email: z.string().email("Correo electrónico válido").optional().or(z.literal("")),
  countryCode: z.string().min(1, "Código de país requerido"),
  phone: z.string().min(10, "Teléfono requerido (mínimo 10 dígitos)"),
  contractDuration: z.string().min(1, "Tiempo de contrato requerido"),
  checkInDate: z.string().min(1, "Fecha de check-in requerida"),
  hasPets: z.string().min(1, "Información sobre mascotas requerida"),
  estimatedRentCost: z.string().min(1, "Costo estimado requerido"),
  bedrooms: z.string().min(1, "Número de recámaras requerido"),
  desiredUnitTypes: z.array(z.string()).optional(),
  desiredNeighborhoods: z.array(z.string()).optional(),
  interestedCondominiumId: z.string().optional(),
  interestedUnitIds: z.array(z.string()).optional(),
  sellerId: z.string().optional(),
  sellerName: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

type VendedorFormData = z.infer<typeof vendedorFormSchema>;

export default function LeadRegistrationVendedor() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string>("");
  const [selectedUnitTypes, setSelectedUnitTypes] = useState<string[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [propertyInterests, setPropertyInterests] = useState<PropertyInterest[]>([]);
  const [unitTypeOpen, setUnitTypeOpen] = useState(false);
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);

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

  // Fetch sellers for dropdown
  const { data: sellersData, isLoading: isLoadingSellers } = useQuery<{ id: string; fullName: string }[]>({
    queryKey: ["/api/public/sellers"],
    queryFn: async () => {
      const response = await fetch("/api/public/sellers");
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });
  const sellers = sellersData || [];

  // Fetch condominiums
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

  const form = useForm<VendedorFormData>({
    resolver: zodResolver(vendedorFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+52",
      phone: "",
      contractDuration: "",
      checkInDate: "",
      hasPets: "",
      estimatedRentCost: "",
      bedrooms: "",
      desiredUnitTypes: [],
      desiredNeighborhoods: [],
      interestedCondominiumId: "",
      interestedUnitIds: [],
      sellerId: "",
      source: "",
      notes: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: VendedorFormData) => {
      const fullPhone = `${data.countryCode}${data.phone}`;
      const seller = sellers.find(s => s.id === data.sellerId);
      
      // Helper: parse budget text to extract numeric value (in pesos)
      const parseBudgetText = (text?: string): number | undefined => {
        if (!text) return undefined;
        const cleanText = text.toLowerCase().replace(/,/g, '').replace(/\$/g, '').trim();
        const match = cleanText.match(/(\d+(?:\.\d+)?)/);
        if (!match) return undefined;
        let num = parseFloat(match[1]);
        if (cleanText.includes('mil') || cleanText.includes('k') || num < 100) {
          num = num * 1000;
        }
        return Math.round(num);
      };
      
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
      const numericBudget = parseBudgetText(data.estimatedRentCost);
      const numericBedrooms = parseBedroomsText(data.bedrooms);
      
      const response = await fetch("/api/public/leads/vendedor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          phone: fullPhone,
          desiredUnitType: data.desiredUnitTypes?.join(", ") || "",
          desiredNeighborhood: data.desiredNeighborhoods?.join(", ") || "",
          // Text fields for display
          estimatedRentCostText: data.estimatedRentCost,
          bedroomsText: data.bedrooms,
          // Numeric fields for filtering (parsed from text)
          estimatedRentCost: numericBudget,
          bedrooms: numericBedrooms,
          // Full structured property interests
          propertyInterests: propertyInterestsPayload,
          // Legacy fields for backward compatibility
          interestedCondominiumId: allCondominiumIds || "",
          interestedUnitId: allUnitIds || "",
          sellerName: seller?.fullName || data.sellerName || "",
          sellerId: data.sellerId,
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
        description: "Gracias por registrar este lead. El vendedor será notificado.",
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

  const onSubmit = (data: VendedorFormData) => {
    submitMutation.mutate({
      ...data,
      desiredUnitTypes: selectedUnitTypes,
      desiredNeighborhoods: selectedNeighborhoods,
      interestedUnitIds: selectedUnitIds,
    });
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
              Hemos recibido la información del lead. El vendedor asignado será notificado.
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
          <div className="flex justify-center items-center gap-4 mb-4">
            <img 
              src={logoPath} 
              alt="HomesApp Logo" 
              className="h-12 w-auto"
            />
            {agencyData?.logoUrl && (
              <>
                <span className="text-muted-foreground">x</span>
                <img 
                  src={agencyData.logoUrl} 
                  alt={`${agencyData.name} Logo`} 
                  className="h-12 w-auto max-w-[150px] object-contain"
                />
              </>
            )}
          </div>
          <CardTitle className="text-3xl">Registro de Lead para Vendedores</CardTitle>
          <CardDescription className="text-base">
            Registra los datos del cliente interesado en propiedades de renta
            {agencyData?.name && <span className="block mt-1 font-medium">{agencyData.name}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">Información del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
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
                        <FormLabel>Apellido *</FormLabel>
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
                    <FormLabel>Teléfono *</FormLabel>
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
                        name="phone"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input {...field} type="tel" placeholder="9981234567" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">Detalles de Búsqueda</h3>
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
                            <SelectItem value="Sí - Perro">Sí - Perro</SelectItem>
                            <SelectItem value="Sí - Gato">Sí - Gato</SelectItem>
                            <SelectItem value="Sí - Otro">Sí - Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estimatedRentCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presupuesto de Renta (MXN) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: 18-25 mil" data-testid="input-estimated-rent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recámaras *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: 1-2, 2+" data-testid="input-bedrooms" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem className="col-span-2">
                    <FormLabel>Tipo de Unidad (opcional, múltiple)</FormLabel>
                    <Popover open={unitTypeOpen} onOpenChange={setUnitTypeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={unitTypeOpen}
                          className="w-full justify-between font-normal"
                          data-testid="dropdown-unit-types"
                        >
                          {selectedUnitTypes.length === 0
                            ? "Seleccionar tipos de unidad..."
                            : `${selectedUnitTypes.length} seleccionado(s)`}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2" align="start">
                        <div className="space-y-2 max-h-60 overflow-y-auto">
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
                                data-testid={`checkbox-unit-type-${type.toLowerCase().replace(/[^a-z]/g, '-')}`}
                              />
                              <label
                                htmlFor={`unit-type-${type}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {type}
                              </label>
                            </div>
                          ))}
                        </div>
                        {selectedUnitTypes.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => setSelectedUnitTypes([])}
                            >
                              Limpiar selección
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    {selectedUnitTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedUnitTypes.map((type) => (
                          <span key={type} className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    )}
                  </FormItem>
                </div>
                <FormItem>
                  <FormLabel>Zona Deseada (opcional, múltiple)</FormLabel>
                  <Popover open={neighborhoodOpen} onOpenChange={setNeighborhoodOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={neighborhoodOpen}
                        className="w-full justify-between font-normal"
                        data-testid="dropdown-neighborhoods"
                      >
                        {selectedNeighborhoods.length === 0
                          ? "Seleccionar zonas..."
                          : `${selectedNeighborhoods.length} zona(s) seleccionada(s)`}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2" align="start">
                      <div className="space-y-2 max-h-60 overflow-y-auto">
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
                              data-testid={`checkbox-neighborhood-${zone.toLowerCase().replace(/[^a-z]/g, '-')}`}
                            />
                            <label
                              htmlFor={`neighborhood-${zone}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {zone}
                            </label>
                          </div>
                        ))}
                      </div>
                      {selectedNeighborhoods.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => setSelectedNeighborhoods([])}
                          >
                            Limpiar selección
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                  {selectedNeighborhoods.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedNeighborhoods.map((zone) => (
                        <span key={zone} className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs">
                          {zone}
                        </span>
                      ))}
                    </div>
                  )}
                </FormItem>
              </div>

              {/* Property Interest Section - Multiple Condominiums */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Propiedades de Interés (Opcional)
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Puedes agregar múltiples propiedades de diferentes condominios que le interesen al cliente.
                </p>
                
                {/* Add new property interest */}
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel>Condominio</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          setSelectedCondominiumId(value);
                          setSelectedUnitIds([]);
                        }} 
                        value={selectedCondominiumId}
                      >
                        <SelectTrigger data-testid="select-condominium">
                          <SelectValue placeholder={isLoadingCondos ? "Cargando..." : "Seleccionar condominio"} />
                        </SelectTrigger>
                        <SelectContent>
                          {condominiums.map((condo) => (
                            <SelectItem key={condo.id} value={condo.id}>
                              {condo.name} {condo.neighborhood ? `(${condo.neighborhood})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                    <FormItem>
                      <FormLabel>Unidades de Interés</FormLabel>
                      {!selectedCondominiumId ? (
                        <p className="text-xs text-muted-foreground p-2 border rounded-md bg-background">
                          Primero seleccione un condominio
                        </p>
                      ) : isLoadingUnits ? (
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Cargando unidades...</span>
                        </div>
                      ) : units.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-2 border rounded-md bg-background">
                          Sin unidades disponibles
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2 p-2 border rounded-md max-h-32 overflow-y-auto bg-background">
                          {units.map((unit) => (
                            <label
                              key={unit.id}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm cursor-pointer transition-colors ${
                                selectedUnitIds.includes(unit.id)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={selectedUnitIds.includes(unit.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUnitIds([...selectedUnitIds, unit.id]);
                                  } else {
                                    setSelectedUnitIds(selectedUnitIds.filter(id => id !== unit.id));
                                  }
                                }}
                                data-testid={`checkbox-unit-${unit.id}`}
                              />
                              <Home className="h-3 w-3" />
                              {unit.unitNumber} {unit.type ? `(${unit.type})` : ""}
                            </label>
                          ))}
                        </div>
                      )}
                    </FormItem>
                  </div>
                  {selectedCondominiumId && selectedUnitIds.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const condo = condominiums.find(c => c.id === selectedCondominiumId);
                        if (condo) {
                          const selectedUnits = units.filter(u => selectedUnitIds.includes(u.id));
                          setPropertyInterests([...propertyInterests, {
                            condominiumId: selectedCondominiumId,
                            condominiumName: condo.name,
                            unitIds: selectedUnitIds,
                          }]);
                          setSelectedCondominiumId("");
                          setSelectedUnitIds([]);
                        }
                      }}
                      data-testid="button-add-property-interest"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar a la lista ({selectedUnitIds.length} unidad{selectedUnitIds.length !== 1 ? "es" : ""})
                    </Button>
                  )}
                </div>

                {/* List of added property interests */}
                {propertyInterests.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Propiedades agregadas:</p>
                    {propertyInterests.map((interest, index) => (
                      <div 
                        key={`${interest.condominiumId}-${index}`} 
                        className="flex items-center justify-between p-3 border rounded-md bg-background"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{interest.condominiumName}</p>
                          <p className="text-xs text-muted-foreground">
                            {interest.unitIds.length} unidad{interest.unitIds.length !== 1 ? "es" : ""} seleccionada{interest.unitIds.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPropertyInterests(propertyInterests.filter((_, i) => i !== index));
                          }}
                          data-testid={`button-remove-property-interest-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">Información del Vendedor</h3>
                <FormField
                  control={form.control}
                  name="sellerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendedor que Registra {sellers.length > 0 ? "*" : ""}</FormLabel>
                      {isLoadingSellers ? (
                        <div className="flex items-center gap-2 p-2 border rounded-md">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Cargando vendedores...</span>
                        </div>
                      ) : sellers.length === 0 ? (
                        <div className="p-2 border rounded-md">
                          <Input 
                            placeholder="Tu nombre (vendedor)" 
                            value={form.watch("sellerName") || ""} 
                            onChange={(e) => form.setValue("sellerName", e.target.value)}
                            data-testid="input-seller-name-fallback"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            No hay vendedores registrados. Escribe tu nombre.
                          </p>
                        </div>
                      ) : (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-seller">
                              <SelectValue placeholder="Seleccionar vendedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sellers.map((seller) => (
                              <SelectItem key={seller.id} value={seller.id}>
                                {seller.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormDescription className="text-xs">
                        {sellers.length > 0 ? "Selecciona tu nombre de la lista de vendedores registrados" : ""}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿Cómo conoció el cliente la propiedad?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-source">
                            <SelectValue placeholder="Seleccionar origen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Referencia directa">Referencia directa</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="Airbnb">Airbnb</SelectItem>
                          <SelectItem value="Booking">Booking</SelectItem>
                          <SelectItem value="Google">Google</SelectItem>
                          <SelectItem value="Espectacular">Espectacular / Publicidad física</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Textarea {...field} placeholder="Información adicional sobre el cliente o sus preferencias..." rows={3} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitMutation.isPending} data-testid="button-submit">
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Registrar Lead"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
