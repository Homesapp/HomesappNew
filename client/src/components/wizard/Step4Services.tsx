import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Droplet, Zap, Wifi, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";

const servicesSchema = z.object({
  // Basic services
  waterIncluded: z.boolean(),
  waterProvider: z.string().optional(),
  waterCost: z.string().optional(),
  
  electricityIncluded: z.boolean(),
  electricityProvider: z.string().optional(),
  electricityCost: z.string().optional(),
  electricityBillingCycle: z.enum(["monthly", "bimonthly"]).optional(),
  
  internetIncluded: z.boolean(),
  internetProvider: z.string().optional(),
  internetCost: z.string().optional(),
  
  // Accepted lease durations
  acceptedLeaseDurations: z.array(z.string()).min(1, "Selecciona al menos una duración"),
}).superRefine((data, ctx) => {
  // Validate water service
  if (!data.waterIncluded) {
    if (!data.waterProvider || data.waterProvider.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El proveedor es requerido si el agua no está incluida",
        path: ["waterProvider"],
      });
    }
    if (!data.waterCost || data.waterCost.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El costo es requerido si el agua no está incluida",
        path: ["waterCost"],
      });
    }
  }
  
  // Validate electricity service
  if (!data.electricityIncluded) {
    if (!data.electricityProvider || data.electricityProvider.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El proveedor es requerido si la electricidad no está incluida",
        path: ["electricityProvider"],
      });
    }
    if (!data.electricityCost || data.electricityCost.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El costo es requerido si la electricidad no está incluida",
        path: ["electricityCost"],
      });
    }
    if (!data.electricityBillingCycle) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La periodicidad de pago es requerida",
        path: ["electricityBillingCycle"],
      });
    }
  }
  
  // Validate internet service
  if (!data.internetIncluded) {
    if (!data.internetProvider || data.internetProvider.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El proveedor es requerido si el internet no está incluido",
        path: ["internetProvider"],
      });
    }
    if (!data.internetCost || data.internetCost.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El costo es requerido si el internet no está incluido",
        path: ["internetCost"],
      });
    }
  }
});

type ServicesForm = z.infer<typeof servicesSchema>;

type AdditionalService = {
  id: string;
  type: "pool_cleaning" | "garden" | "gas" | "custom";
  customName?: string;
  provider?: string;
  cost?: string;
};

type Step4Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (data: any) => void;
  onPrevious: () => void;
};

const serviceLabels = {
  pool_cleaning: "Limpieza de Alberca",
  garden: "Jardín",
  gas: "Gas",
};

export default function Step4Services({ data, onUpdate, onNext, onPrevious }: Step4Props) {
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>(
    data.servicesInfo?.additionalServices?.map((s: any, idx: number) => ({ 
      id: `${s.type}-${idx}`, 
      ...s 
    })) || []
  );

  const form = useForm<ServicesForm>({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      waterIncluded: data.servicesInfo?.basicServices?.water?.included || false,
      waterProvider: data.servicesInfo?.basicServices?.water?.provider || "",
      waterCost: data.servicesInfo?.basicServices?.water?.cost || "",
      
      electricityIncluded: data.servicesInfo?.basicServices?.electricity?.included || false,
      electricityProvider: data.servicesInfo?.basicServices?.electricity?.provider || "CFE",
      electricityCost: data.servicesInfo?.basicServices?.electricity?.cost || "",
      electricityBillingCycle: data.servicesInfo?.basicServices?.electricity?.billingCycle || "bimonthly",
      
      internetIncluded: data.servicesInfo?.basicServices?.internet?.included || false,
      internetProvider: data.servicesInfo?.basicServices?.internet?.provider || "",
      internetCost: data.servicesInfo?.basicServices?.internet?.cost || "",
      
      acceptedLeaseDurations: data.servicesInfo?.acceptedLeaseDurations || [],
    },
  });

  const waterIncluded = form.watch("waterIncluded");
  const electricityIncluded = form.watch("electricityIncluded");
  const internetIncluded = form.watch("internetIncluded");

  // Set CFE as default when electricity is not included
  useEffect(() => {
    if (!electricityIncluded && !form.getValues("electricityProvider")) {
      form.setValue("electricityProvider", "CFE");
    }
  }, [electricityIncluded, form]);

  const handleAddAdditionalService = (type: "pool_cleaning" | "garden" | "gas" | "custom") => {
    const newService: AdditionalService = {
      id: `${type}-${Date.now()}`,
      type,
      customName: type === "custom" ? "" : undefined,
      provider: "",
      cost: "",
    };
    setAdditionalServices([...additionalServices, newService]);
  };

  const handleRemoveAdditionalService = (id: string) => {
    setAdditionalServices(additionalServices.filter(s => s.id !== id));
  };

  const handleUpdateAdditionalService = (id: string, field: "provider" | "cost" | "customName", value: string) => {
    setAdditionalServices(additionalServices.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const toggleDuration = (duration: string) => {
    const current = form.getValues("acceptedLeaseDurations");
    if (current.includes(duration)) {
      form.setValue("acceptedLeaseDurations", current.filter(d => d !== duration));
    } else {
      form.setValue("acceptedLeaseDurations", [...current, duration]);
    }
  };

  const handleSubmit = (formData: ServicesForm) => {
    const servicesInfo = {
      basicServices: {
        water: formData.waterIncluded 
          ? { included: true }
          : { included: false, provider: formData.waterProvider, cost: formData.waterCost },
        electricity: formData.electricityIncluded
          ? { included: true }
          : { 
              included: false, 
              provider: formData.electricityProvider, 
              cost: formData.electricityCost,
              billingCycle: formData.electricityBillingCycle
            },
        internet: formData.internetIncluded
          ? { included: true }
          : { included: false, provider: formData.internetProvider, cost: formData.internetCost },
      },
      additionalServices: additionalServices.map(({ id, ...service }) => service),
      acceptedLeaseDurations: formData.acceptedLeaseDurations,
    };

    onNext({ servicesInfo });
  };

  const selectedDurations = form.watch("acceptedLeaseDurations");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step4-title">
          Servicios y Utilidades
        </h2>
        <p className="text-muted-foreground" data-testid="text-step4-description">
          Configura los servicios básicos y adicionales de la propiedad
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Services */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios Básicos</CardTitle>
              <CardDescription>
                Los servicios incluidos no requieren información adicional. Los no incluidos necesitan proveedor y costo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Water */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplet className="h-5 w-5 text-blue-500" />
                    <div>
                      <FormLabel>Agua</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {waterIncluded ? "Incluido en la renta" : "No incluido"}
                      </p>
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="waterIncluded"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-water-included"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {!waterIncluded && (
                  <div className="grid grid-cols-2 gap-4 pl-7">
                    <FormField
                      control={form.control}
                      name="waterProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proveedor *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="CAPA, Pozo, etc" data-testid="input-water-provider" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="waterCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo Estimado *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="$500 MXN/mes" data-testid="input-water-cost" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Electricity */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <div>
                      <FormLabel>Electricidad</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {electricityIncluded ? "Incluido en la renta" : "No incluido"}
                      </p>
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="electricityIncluded"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-electricity-included"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {!electricityIncluded && (
                  <div className="space-y-4 pl-7">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="electricityProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proveedor *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="CFE, Solar, etc" data-testid="input-electricity-provider" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="electricityBillingCycle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Periodicidad de Pago *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-billing-cycle">
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="monthly">Mensual</SelectItem>
                                <SelectItem value="bimonthly">Bimestral</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="electricityCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo Estimado *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="$800 MXN" data-testid="input-electricity-cost" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Internet */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-purple-500" />
                    <div>
                      <FormLabel>Internet</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {internetIncluded ? "Incluido en la renta" : "No incluido"}
                      </p>
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="internetIncluded"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-internet-included"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {!internetIncluded && (
                  <div className="grid grid-cols-2 gap-4 pl-7">
                    <FormField
                      control={form.control}
                      name="internetProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proveedor *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Telmex, Abix, etc" data-testid="input-internet-provider" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="internetCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo Estimado *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="$600 MXN/mes" data-testid="input-internet-cost" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Services */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios Adicionales (Opcional)</CardTitle>
              <CardDescription>
                Agrega servicios como limpieza de alberca, jardín o gas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {additionalServices.map(service => (
                <div key={service.id} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {service.type === "custom" ? "Servicio Personalizado" : serviceLabels[service.type as keyof typeof serviceLabels]}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAdditionalService(service.id)}
                      data-testid={`button-remove-${service.type}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {service.type === "custom" && (
                    <div>
                      <FormLabel>Nombre del Servicio</FormLabel>
                      <Input
                        value={service.customName || ""}
                        onChange={(e) => handleUpdateAdditionalService(service.id, "customName", e.target.value)}
                        placeholder="Ej: Seguridad, Mantenimiento..."
                        data-testid={`input-${service.id}-custom-name`}
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FormLabel>Proveedor</FormLabel>
                      <Input
                        value={service.provider || ""}
                        onChange={(e) => handleUpdateAdditionalService(service.id, "provider", e.target.value)}
                        placeholder="Nombre del proveedor"
                        data-testid={`input-${service.type}-provider`}
                      />
                    </div>
                    <div>
                      <FormLabel>Costo Estimado</FormLabel>
                      <Input
                        value={service.cost || ""}
                        onChange={(e) => handleUpdateAdditionalService(service.id, "cost", e.target.value)}
                        placeholder="$1000 MXN/mes"
                        data-testid={`input-${service.type}-cost`}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add service buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {!additionalServices.find(s => s.type === "pool_cleaning") && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddAdditionalService("pool_cleaning")}
                    className="w-full"
                    data-testid="button-add-pool-cleaning"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Alberca
                  </Button>
                )}
                {!additionalServices.find(s => s.type === "garden") && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddAdditionalService("garden")}
                    className="w-full"
                    data-testid="button-add-garden"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Jardín
                  </Button>
                )}
                {!additionalServices.find(s => s.type === "gas") && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddAdditionalService("gas")}
                    className="w-full"
                    data-testid="button-add-gas"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Gas
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddAdditionalService("custom")}
                  className="w-full"
                  data-testid="button-add-custom-service"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Otro
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lease Durations */}
          {data.isForRent && (
            <Card>
              <CardHeader>
                <CardTitle>Duraciones de Contrato Aceptadas</CardTitle>
                <CardDescription>
                  Selecciona las duraciones de arrendamiento que aceptas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="acceptedLeaseDurations"
                  render={() => (
                    <FormItem>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={selectedDurations.includes("6_months") ? "default" : "outline"}
                          onClick={() => toggleDuration("6_months")}
                          data-testid="button-duration-6months"
                        >
                          6 meses
                        </Button>
                        <Button
                          type="button"
                          variant={selectedDurations.includes("1_year") ? "default" : "outline"}
                          onClick={() => toggleDuration("1_year")}
                          data-testid="button-duration-1year"
                        >
                          1 año
                        </Button>
                        <Button
                          type="button"
                          variant={selectedDurations.includes("more") ? "default" : "outline"}
                          onClick={() => toggleDuration("more")}
                          data-testid="button-duration-more"
                        >
                          Más de 1 año
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="w-full sm:w-auto"
              data-testid="button-previous-step4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto"
              data-testid="button-next-step4"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
