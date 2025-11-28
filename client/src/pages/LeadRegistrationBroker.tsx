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
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Building2, Home, Loader2 } from "lucide-react";
import { useState } from "react";
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png";

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
  sellerName: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

type BrokerFormData = z.infer<typeof brokerFormSchema>;

export default function LeadRegistrationBroker() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string>("");
  const [selectedUnitTypes, setSelectedUnitTypes] = useState<string[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

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
      sellerName: "",
      source: "",
      notes: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: BrokerFormData) => {
      const response = await fetch("/api/public/leads/broker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          desiredUnitType: data.desiredUnitTypes?.join(", ") || "",
          desiredNeighborhood: data.desiredNeighborhoods?.join(", ") || "",
          interestedUnitId: data.interestedUnitIds?.join(",") || "",
          budgetMin: data.budgetMin,
          budgetMax: data.budgetMax,
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
        description: "Gracias por tu interés. Te contactaremos pronto.",
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

  const onSubmit = (data: BrokerFormData) => {
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
              Hemos recibido tu información. Nuestro equipo se pondrá en contacto contigo pronto.
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
          <CardTitle className="text-3xl">Registro de Lead para Brokers</CardTitle>
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
                          <Input {...field} type="email" placeholder="cliente@ejemplo.com (opcional)" data-testid="input-email" />
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
                              <Input {...field} type="text" maxLength={4} placeholder="1234" data-testid="input-phone-last4" />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Solo los últimos 4 dígitos para identificación
                            </FormDescription>
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
                  <div className="space-y-2">
                    <FormLabel>Presupuesto de Renta (MXN)</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name="budgetMin"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                value={field.value || ""} 
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Mín"
                                data-testid="input-budget-min" 
                              />
                            </FormControl>
                            <FormMessage />
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
                                {...field} 
                                type="number"
                                value={field.value || ""} 
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Máx"
                                data-testid="input-budget-max" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recámaras *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-bedrooms">
                              <SelectValue placeholder="Cantidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Studio</SelectItem>
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
                  <FormItem className="col-span-2">
                    <FormLabel>Tipo de Unidad (opcional, múltiple)</FormLabel>
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                      {UNIT_TYPES.map((type) => (
                        <label
                          key={type}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm cursor-pointer transition-colors ${
                            selectedUnitTypes.includes(type)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={selectedUnitTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUnitTypes([...selectedUnitTypes, type]);
                              } else {
                                setSelectedUnitTypes(selectedUnitTypes.filter(t => t !== type));
                              }
                            }}
                            data-testid={`checkbox-unit-type-${type.toLowerCase().replace(/[^a-z]/g, '-')}`}
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </FormItem>
                </div>
                <FormItem>
                  <FormLabel>Zona Deseada (opcional, múltiple)</FormLabel>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                    {NEIGHBORHOODS.map((zone) => (
                      <label
                        key={zone}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm cursor-pointer transition-colors ${
                          selectedNeighborhoods.includes(zone)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selectedNeighborhoods.includes(zone)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNeighborhoods([...selectedNeighborhoods, zone]);
                            } else {
                              setSelectedNeighborhoods(selectedNeighborhoods.filter(z => z !== zone));
                            }
                          }}
                          data-testid={`checkbox-neighborhood-${zone.toLowerCase().replace(/[^a-z]/g, '-')}`}
                        />
                        {zone}
                      </label>
                    ))}
                  </div>
                </FormItem>
              </div>

              {/* Property Interest Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Propiedad de Interés (Opcional)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Si el cliente está interesado en propiedades específicas de nuestro portafolio, selecciónalas aquí.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="interestedCondominiumId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condominio</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCondominiumId(value);
                            setSelectedUnitIds([]);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-condominium">
                              <SelectValue placeholder={isLoadingCondos ? "Cargando..." : "Seleccionar condominio"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {condominiums.map((condo) => (
                              <SelectItem key={condo.id} value={condo.id}>
                                {condo.name} {condo.neighborhood ? `(${condo.neighborhood})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Unidades de Interés (múltiple)</FormLabel>
                    {!selectedCondominiumId ? (
                      <p className="text-xs text-muted-foreground p-2 border rounded-md">
                        Primero seleccione un condominio
                      </p>
                    ) : isLoadingUnits ? (
                      <div className="flex items-center gap-2 p-2 border rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Cargando unidades...</span>
                      </div>
                    ) : units.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-2 border rounded-md">
                        Sin unidades disponibles
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md max-h-32 overflow-y-auto">
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
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">Información Adicional</h3>
                <FormField
                  control={form.control}
                  name="sellerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tu Nombre (Broker)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Tu nombre completo" data-testid="input-seller-name" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Para identificar quién registró este lead
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
                  "Registrar Cliente"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
