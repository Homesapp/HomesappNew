import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Home, 
  User, 
  Calendar, 
  DollarSign, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Building2,
  Plus,
  Trash2,
  PawPrint,
  Users,
  Upload,
  FileText,
  Mail,
  Phone
} from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { ExternalUnit, ExternalCondominium } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const rentalFormSchema = z.object({
  tenantName: z.string().optional(),
  tenantEmail: z.string().optional(),
  tenantPhone: z.string().optional(),
  tenantIdPhotoUrl: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  monthlyRent: z.string().min(1, "Renta mensual requerida"),
  rentDayOfMonth: z.number().min(1).max(31),
  securityDeposit: z.string().optional(),
  leaseDurationMonths: z.number().min(1),
  // Pet fields
  hasPet: z.boolean().default(false),
  petName: z.string().optional(),
  petPhotoUrl: z.string().optional(),
  petDescription: z.string().optional(),
});

type RentalFormData = z.infer<typeof rentalFormSchema>;

interface UnitWithDetails extends ExternalUnit {
  condominium?: ExternalCondominium;
}

interface RentalWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RentalWizard({ open, onOpenChange }: RentalWizardProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [useExistingClient, setUseExistingClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [additionalServices, setAdditionalServices] = useState<Array<{
    serviceType: string;
    amount: string;
    dayOfMonth: number;
  }>>([]);
  const [additionalTenants, setAdditionalTenants] = useState<Array<{
    fullName: string;
    email: string;
    phone: string;
    idPhotoUrl: string;
  }>>([]);

  const { data: condominiums, isLoading: condominiumsLoading } = useQuery<ExternalCondominium[]>({
    queryKey: ["/api/external-condominiums"],
    queryFn: async () => {
      const response = await fetch("/api/external-condominiums");
      if (!response.ok) throw new Error("Failed to fetch condominiums");
      return response.json();
    },
    enabled: open,
  });

  const { data: availableUnits, isLoading: unitsLoading } = useQuery<UnitWithDetails[]>({
    queryKey: ["/api/external-units"],
    queryFn: async () => {
      const response = await fetch("/api/external-units");
      if (!response.ok) throw new Error("Failed to fetch units");
      return response.json();
    },
    enabled: open,
  });

  const { data: clients, isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ["/api/external-clients"],
    enabled: open && step === 3,
  });

  const form = useForm<RentalFormData>({
    resolver: zodResolver(rentalFormSchema),
    defaultValues: {
      tenantName: "",
      tenantEmail: "",
      tenantPhone: "",
      monthlyRent: "",
      rentDayOfMonth: 1,
      securityDeposit: "",
      leaseDurationMonths: 12,
      hasPet: false,
      petName: "",
      petPhotoUrl: "",
      petDescription: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { contract: any; additionalServices: any[] }) => {
      const response = await apiRequest("/api/external-rental-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-rental-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-units"] });
      toast({
        title: language === "es" ? "Renta creada" : "Rental created",
        description: language === "es" 
          ? "El contrato de renta ha sido creado exitosamente" 
          : "The rental contract has been created successfully",
      });
      onOpenChange(false);
      resetWizard();
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo crear la renta" : "Failed to create rental"),
        variant: "destructive",
      });
    },
  });

  const resetWizard = () => {
    setStep(1);
    setSelectedCondominiumId("");
    setSelectedUnitId("");
    setUseExistingClient(false);
    setSelectedClientId("");
    setAdditionalServices([]);
    setAdditionalTenants([]);
    form.reset();
  };

  const handleNext = () => {
    if (step === 1 && !selectedCondominiumId) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "Por favor selecciona un condominio" : "Please select a condominium",
        variant: "destructive",
      });
      return;
    }
    if (step === 2 && !selectedUnitId) {
      toast({
        title: language === "es" ? "Selecciona una unidad" : "Select a unit",
        description: language === "es" ? "Debes seleccionar una unidad para continuar" : "You must select a unit to continue",
        variant: "destructive",
      });
      return;
    }
    if (step === 3) {
      // Validate tenant selection
      if (useExistingClient && !selectedClientId) {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: language === "es" ? "Por favor selecciona un cliente" : "Please select a client",
          variant: "destructive",
        });
        return;
      }
      // If creating new client, validate the required fields
      if (!useExistingClient) {
        const tenantName = form.getValues("tenantName");
        const tenantEmail = form.getValues("tenantEmail");
        const tenantPhone = form.getValues("tenantPhone");
        
        if (!tenantName || !tenantEmail || !tenantPhone) {
          toast({
            title: language === "es" ? "Error" : "Error",
            description: language === "es" ? "Por favor completa todos los campos del inquilino" : "Please complete all tenant fields",
            variant: "destructive",
          });
          return;
        }
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (data: RentalFormData) => {
    // If using existing client, get their info
    let tenantInfo = {
      tenantName: data.tenantName,
      tenantEmail: data.tenantEmail,
      tenantPhone: data.tenantPhone,
      clientId: undefined as string | undefined,
    };

    if (useExistingClient && selectedClientId && clients) {
      const selectedClient = clients.find((c: any) => c.id === selectedClientId);
      if (selectedClient) {
        tenantInfo = {
          tenantName: `${selectedClient.firstName} ${selectedClient.lastName}`,
          tenantEmail: selectedClient.email || "",
          tenantPhone: selectedClient.phone || "",
          clientId: selectedClient.id,
        };
      }
    }

    // Build contract data
    const contract = {
      unitId: selectedUnitId,
      tenantName: tenantInfo.tenantName,
      tenantEmail: tenantInfo.tenantEmail,
      tenantPhone: tenantInfo.tenantPhone,
      clientId: tenantInfo.clientId,
      startDate: data.startDate,
      endDate: data.endDate,
      monthlyRent: data.monthlyRent,
      securityDeposit: data.securityDeposit || "0",
      leaseDurationMonths: data.leaseDurationMonths,
      currency: "MXN",
      rentalPurpose: "living",
      // Pet fields
      hasPet: data.hasPet,
      petName: data.hasPet ? data.petName : undefined,
      petPhotoUrl: data.hasPet ? data.petPhotoUrl : undefined,
      petDescription: data.hasPet ? data.petDescription : undefined,
    };

    // Build services array with rent + additional services
    const services = [
      {
        serviceType: "rent",
        amount: parseFloat(data.monthlyRent), // Convert to number
        dayOfMonth: data.rentDayOfMonth,
        currency: "MXN",
      },
      ...additionalServices.map(s => ({
        serviceType: s.serviceType,
        amount: parseFloat(s.amount), // Convert to number
        dayOfMonth: s.dayOfMonth,
        currency: "MXN",
      })),
    ];

    const createdContract = await createMutation.mutateAsync({
      contract,
      additionalServices: services,
    });

    // Create additional tenants if any
    if (additionalTenants.length > 0 && createdContract) {
      const contractId = createdContract.id;
      for (const tenant of additionalTenants) {
        if (tenant.fullName.trim()) { // Only create if name is provided
          try {
            await apiRequest("/api/external-rental-tenants", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contractId,
                fullName: tenant.fullName,
                email: tenant.email || undefined,
                phone: tenant.phone || undefined,
                idPhotoUrl: tenant.idPhotoUrl || undefined,
              }),
            });
          } catch (error) {
            console.error("Error creating additional tenant:", error);
          }
        }
      }
    }
  };

  const addService = () => {
    setAdditionalServices([
      ...additionalServices,
      { serviceType: "water", amount: "", dayOfMonth: 1 },
    ]);
  };

  const removeService = (index: number) => {
    setAdditionalServices(additionalServices.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: string, value: any) => {
    const updated = [...additionalServices];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalServices(updated);
  };

  const selectedUnit = availableUnits?.find(u => u.id === selectedUnitId);
  const filteredUnits = availableUnits?.filter(u => 
    u.status === 'active' && 
    !u.currentContractId &&
    (!selectedCondominiumId || u.condominiumId === selectedCondominiumId)
  ) || [];

  const steps = [
    { number: 1, title: language === "es" ? "Condominio" : "Condominium", icon: Building2 },
    { number: 2, title: language === "es" ? "Unidad" : "Unit", icon: Home },
    { number: 3, title: language === "es" ? "Inquilino" : "Tenant", icon: User },
    { number: 4, title: language === "es" ? "Términos" : "Terms", icon: DollarSign },
    { number: 5, title: language === "es" ? "Confirmar" : "Confirm", icon: Check },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetWizard();
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-wizard-title">
            {language === "es" ? "Nueva Renta" : "New Rental"}
          </DialogTitle>
          <DialogDescription>
            {language === "es" 
              ? "Crea un nuevo contrato de renta en 5 pasos simples" 
              : "Create a new rental contract in 5 simple steps"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between py-4">
          {steps.map((s, idx) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${
                    step >= s.number
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                  data-testid={`wizard-step-${s.number}`}
                >
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="text-xs mt-1.5 font-medium">{s.title}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 flex-1 ${step > s.number ? "bg-primary" : "bg-muted-foreground/20"}`} />
              )}
            </div>
          ))}
        </div>

        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Step 1: Select Condominium */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {language === "es" ? "Selecciona el Condominio" : "Select Condominium"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" 
                      ? "Elige el condominio donde se encuentra la unidad" 
                      : "Choose the condominium where the unit is located"}
                  </p>
                </div>

                {condominiumsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {language === "es" ? "Cargando condominios..." : "Loading condominiums..."}
                  </p>
                ) : !condominiums || condominiums.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {language === "es" ? "No hay condominios disponibles" : "No condominiums available"}
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {condominiums.map((condo) => (
                      <Card
                        key={condo.id}
                        className={`cursor-pointer hover-elevate ${
                          selectedCondominiumId === condo.id ? "border-primary border-2" : ""
                        }`}
                        onClick={() => setSelectedCondominiumId(condo.id)}
                        data-testid={`condo-option-${condo.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <p className="font-semibold">{condo.name}</p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {condo.address}
                              </p>
                            </div>
                            {selectedCondominiumId === condo.id && (
                              <Check className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Unit */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {language === "es" ? "Selecciona la Unidad" : "Select Unit"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" 
                      ? "Elige la unidad que deseas rentar" 
                      : "Choose the unit you want to rent"}
                  </p>
                </div>

                {unitsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {language === "es" ? "Cargando unidades..." : "Loading units..."}
                  </p>
                ) : filteredUnits.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {language === "es" ? "No hay unidades disponibles" : "No units available"}
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredUnits.map((unit) => (
                      <Card
                        key={unit.id}
                        className={`cursor-pointer hover-elevate ${
                          selectedUnitId === unit.id ? "border-primary border-2" : ""
                        }`}
                        onClick={() => setSelectedUnitId(unit.id)}
                        data-testid={`unit-option-${unit.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <p className="font-semibold">{unit.unitNumber}</p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {unit.condominium?.name || ""}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {unit.bedrooms || 0} {language === "es" ? "rec" : "bed"} • {unit.bathrooms || 0} {language === "es" ? "baños" : "bath"}
                              </p>
                            </div>
                            {selectedUnitId === unit.id && (
                              <Check className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Tenant Info */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {language === "es" ? "Datos del Inquilino" : "Tenant Information"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" 
                      ? "Selecciona un cliente existente o agrega uno nuevo" 
                      : "Select an existing client or add a new one"}
                  </p>
                </div>

                {/* Toggle: Existing Client vs New Client */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant={!useExistingClient ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUseExistingClient(false);
                          setSelectedClientId("");
                        }}
                        data-testid="button-new-client"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {language === "es" ? "Nuevo Cliente" : "New Client"}
                      </Button>
                      <Button
                        type="button"
                        variant={useExistingClient ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUseExistingClient(true)}
                        data-testid="button-existing-client"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {language === "es" ? "Cliente Existente" : "Existing Client"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Existing Client Selection */}
                {useExistingClient && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">
                          {language === "es" ? "Seleccionar Cliente" : "Select Client"}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label>{language === "es" ? "Cliente" : "Client"}</Label>
                          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                            <SelectTrigger data-testid="select-existing-client">
                              <SelectValue placeholder={language === "es" ? "Selecciona un cliente..." : "Select a client..."} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {clientsLoading ? (
                                <SelectItem value="loading" disabled>
                                  {language === "es" ? "Cargando..." : "Loading..."}
                                </SelectItem>
                              ) : !clients || clients.length === 0 ? (
                                <SelectItem value="no-clients" disabled>
                                  {language === "es" ? "No hay clientes disponibles" : "No clients available"}
                                </SelectItem>
                              ) : (
                                clients.map((client: any) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    {client.firstName} {client.lastName} - {client.email || client.phone}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedClientId && clients && (
                          <div className="p-4 bg-muted rounded-md text-sm space-y-2">
                            {(() => {
                              const selectedClient = clients.find((c: any) => c.id === selectedClientId);
                              if (!selectedClient) return null;
                              return (
                                <>
                                  <div><strong>{language === "es" ? "Nombre:" : "Name:"}</strong> {selectedClient.firstName} {selectedClient.lastName}</div>
                                  {selectedClient.email && <div><strong>{language === "es" ? "Email:" : "Email:"}</strong> {selectedClient.email}</div>}
                                  {selectedClient.phone && <div><strong>{language === "es" ? "Teléfono:" : "Phone:"}</strong> {selectedClient.phone}</div>}
                                  {selectedClient.city && <div><strong>{language === "es" ? "Ciudad:" : "City:"}</strong> {selectedClient.city}</div>}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* New Client Form */}
                {!useExistingClient && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">
                          {language === "es" ? "Inquilino Principal" : "Primary Tenant"}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tenantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {language === "es" ? "Nombre completo" : "Full name"}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Juan Pérez" data-testid="input-tenant-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tenantEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {language === "es" ? "Correo electrónico" : "Email"}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="juan@example.com" data-testid="input-tenant-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tenantPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {language === "es" ? "Teléfono" : "Phone"}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+52 984 123 4567" data-testid="input-tenant-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="tenantIdPhotoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {language === "es" ? "Identificación oficial (opcional)" : "Official ID (optional)"}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="file" 
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // For now, just store the file name
                                  // In production, upload to cloud storage and get URL
                                  field.onChange(file.name);
                                }
                              }}
                              data-testid="input-tenant-id-photo"
                              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium hover:file:bg-accent"
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">
                            {language === "es" 
                              ? "Sube una foto o PDF de la identificación oficial" 
                              : "Upload a photo or PDF of official ID"}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                )}

                <Separator className="my-4" />

                {/* Pet Information */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="hasPet"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-has-pet"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0 cursor-pointer flex items-center gap-2">
                              <PawPrint className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                              {language === "es" ? "¿El inquilino tiene mascota?" : "Does the tenant have a pet?"}
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      {form.watch("hasPet") && (
                        <div className="space-y-4 mt-4 pl-6 border-l-2 border-amber-600/20">
                          <FormField
                            control={form.control}
                            name="petName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === "es" ? "Nombre de la mascota" : "Pet name"}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Max" data-testid="input-pet-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="petPhotoUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === "es" ? "Foto de mascota" : "Pet photo"}</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) field.onChange(file.name);
                                    }}
                                    data-testid="input-pet-photo-url"
                                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium hover:file:bg-accent"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="petDescription"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{language === "es" ? "Descripción (raza, tamaño, etc.)" : "Description (breed, size, etc.)"}</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder={language === "es" ? "Pastor Alemán, tamaño grande" : "German Shepherd, large size"} data-testid="textarea-pet-description" rows={3} />
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

                {/* Additional Tenants */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">{language === "es" ? "Inquilinos Adicionales" : "Additional Tenants"}</h4>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setAdditionalTenants([...additionalTenants, { fullName: "", email: "", phone: "", idPhotoUrl: "" }])}
                      data-testid="button-add-tenant"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {language === "es" ? "Agregar" : "Add"}
                    </Button>
                  </div>

                  {additionalTenants.length > 0 && (
                    <div className="space-y-4">
                      {additionalTenants.map((tenant, index) => (
                        <Card key={index}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <CardTitle className="text-sm">
                                  {language === "es" ? `Inquilino ${index + 2}` : `Tenant ${index + 2}`}
                                </CardTitle>
                              </div>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  const newTenants = [...additionalTenants];
                                  newTenants.splice(index, 1);
                                  setAdditionalTenants(newTenants);
                                }}
                                data-testid={`button-remove-tenant-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor={`tenant-name-${index}`} className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5" />
                                {language === "es" ? "Nombre completo" : "Full name"}
                              </Label>
                              <Input
                                id={`tenant-name-${index}`}
                                value={tenant.fullName}
                                onChange={(e) => {
                                  const newTenants = [...additionalTenants];
                                  newTenants[index].fullName = e.target.value;
                                  setAdditionalTenants(newTenants);
                                }}
                                placeholder={language === "es" ? "Nombre completo" : "Full name"}
                                data-testid={`input-additional-tenant-name-${index}`}
                                className="mt-1.5"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`tenant-email-${index}`} className="flex items-center gap-2">
                                  <Mail className="h-3.5 w-3.5" />
                                  {language === "es" ? "Correo electrónico" : "Email"}
                                </Label>
                                <Input
                                  id={`tenant-email-${index}`}
                                  type="email"
                                  value={tenant.email}
                                  onChange={(e) => {
                                    const newTenants = [...additionalTenants];
                                    newTenants[index].email = e.target.value;
                                    setAdditionalTenants(newTenants);
                                  }}
                                  placeholder="email@example.com"
                                  data-testid={`input-additional-tenant-email-${index}`}
                                  className="mt-1.5"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`tenant-phone-${index}`} className="flex items-center gap-2">
                                  <Phone className="h-3.5 w-3.5" />
                                  {language === "es" ? "Teléfono" : "Phone"}
                                </Label>
                                <Input
                                  id={`tenant-phone-${index}`}
                                  value={tenant.phone}
                                  onChange={(e) => {
                                    const newTenants = [...additionalTenants];
                                    newTenants[index].phone = e.target.value;
                                    setAdditionalTenants(newTenants);
                                  }}
                                  placeholder="+52 984 123 4567"
                                  data-testid={`input-additional-tenant-phone-${index}`}
                                  className="mt-1.5"
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor={`tenant-id-url-${index}`} className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5" />
                                {language === "es" ? "Identificación oficial (opcional)" : "Official ID (optional)"}
                              </Label>
                              <Input
                                type="file"
                                accept="image/*,.pdf"
                                id={`tenant-id-url-${index}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const newTenants = [...additionalTenants];
                                    newTenants[index].idPhotoUrl = file.name;
                                    setAdditionalTenants(newTenants);
                                  }
                                }}
                                data-testid={`input-additional-tenant-id-${index}`}
                                className="mt-1.5 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium hover:file:bg-accent"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                {language === "es" 
                                  ? "Sube una foto o PDF de la identificación oficial" 
                                  : "Upload a photo or PDF of official ID"}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Terms */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {language === "es" ? "Términos de Renta" : "Rental Terms"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" 
                      ? "Define las condiciones del contrato" 
                      : "Define contract conditions"}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Fecha de inicio" : "Start date"}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="date" 
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-start-date" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Fecha de fin" : "End date"}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="date"
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-end-date" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="monthlyRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Renta mensual" : "Monthly rent"}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="12000" data-testid="input-monthly-rent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rentDayOfMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Día de pago" : "Payment day"}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1" 
                            max="31" 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-rent-day" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="securityDeposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Depósito de garantía" : "Security deposit"}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0" data-testid="input-security-deposit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">
                      {language === "es" ? "Servicios adicionales" : "Additional services"}
                    </Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addService}
                      data-testid="button-add-service"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {language === "es" ? "Agregar" : "Add"}
                    </Button>
                  </div>

                  {additionalServices.map((service, idx) => (
                    <div key={idx} className="flex items-end gap-2 mb-2">
                      <div className="flex-1">
                        <Label className="text-xs">{language === "es" ? "Servicio" : "Service"}</Label>
                        <Select 
                          value={service.serviceType} 
                          onValueChange={(val) => updateService(idx, "serviceType", val)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="water">{language === "es" ? "Agua" : "Water"}</SelectItem>
                            <SelectItem value="electricity">{language === "es" ? "Electricidad" : "Electricity"}</SelectItem>
                            <SelectItem value="internet">{language === "es" ? "Internet" : "Internet"}</SelectItem>
                            <SelectItem value="gas">{language === "es" ? "Gas" : "Gas"}</SelectItem>
                            <SelectItem value="maintenance">{language === "es" ? "Mantenimiento" : "Maintenance"}</SelectItem>
                            <SelectItem value="other">{language === "es" ? "Otro" : "Other"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">{language === "es" ? "Monto" : "Amount"}</Label>
                        <Input 
                          type="number"
                          value={service.amount}
                          onChange={(e) => updateService(idx, "amount", e.target.value)}
                          placeholder="0"
                          className="h-9"
                        />
                      </div>
                      <div className="w-20">
                        <Label className="text-xs">{language === "es" ? "Día" : "Day"}</Label>
                        <Input 
                          type="number"
                          value={service.dayOfMonth}
                          onChange={(e) => updateService(idx, "dayOfMonth", parseInt(e.target.value))}
                          min="1"
                          max="31"
                          className="h-9"
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeService(idx)}
                        className="flex-shrink-0 h-9"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Confirm */}
            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {language === "es" ? "Confirmar Detalles" : "Confirm Details"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" 
                      ? "Revisa la información antes de crear el contrato" 
                      : "Review information before creating the contract"}
                  </p>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{language === "es" ? "Unidad" : "Unit"}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><strong>{selectedUnit?.unitNumber}</strong></p>
                    <p className="text-muted-foreground">{selectedUnit?.condominium?.name}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{language === "es" ? "Inquilino" : "Tenant"}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><strong>{form.watch("tenantName")}</strong></p>
                    <p className="text-muted-foreground">{form.watch("tenantEmail")}</p>
                    <p className="text-muted-foreground">{form.watch("tenantPhone")}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{language === "es" ? "Términos" : "Terms"}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === "es" ? "Renta mensual" : "Monthly rent"}:</span>
                      <strong>${form.watch("monthlyRent")}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === "es" ? "Depósito" : "Deposit"}:</span>
                      <strong>${form.watch("securityDeposit") || "0"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === "es" ? "Período" : "Period"}:</span>
                      <strong>
                        {form.watch("startDate") && format(form.watch("startDate"), 'dd/MM/yyyy', { locale: language === "es" ? es : enUS })}
                        {" - "}
                        {form.watch("endDate") && format(form.watch("endDate"), 'dd/MM/yyyy', { locale: language === "es" ? es : enUS })}
                      </strong>
                    </div>
                    {additionalServices.length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <p className="text-muted-foreground text-xs font-medium">
                          {language === "es" ? "Servicios adicionales:" : "Additional services:"}
                        </p>
                        {additionalServices.map((service, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-muted-foreground capitalize">{service.serviceType}:</span>
                            <span>${service.amount}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                data-testid="button-wizard-back"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {language === "es" ? "Atrás" : "Back"}
              </Button>

              {step < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  data-testid="button-wizard-next"
                >
                  {language === "es" ? "Siguiente" : "Next"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-wizard-submit"
                >
                  {createMutation.isPending 
                    ? (language === "es" ? "Creando..." : "Creating...") 
                    : (language === "es" ? "Crear Renta" : "Create Rental")}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
