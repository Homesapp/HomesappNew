import { useState, useMemo, useEffect } from "react";
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
  Phone,
  Search,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { format, isValid } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { ExternalUnit, ExternalCondominium, ExternalClient, PaginatedResponse } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Helper function to safely format dates
const safeFormatDate = (date: any, formatStr: string, options?: any): string => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (!isValid(dateObj)) return '';
  try {
    return format(dateObj, formatStr, options);
  } catch {
    return '';
  }
};

// Helper function to add months to a date
const addMonths = (dateString: string, months: number): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (!isValid(date)) return '';
  date.setMonth(date.getMonth() + months);
  return format(date, 'yyyy-MM-dd');
};

// Helper function to calculate days between dates
const calculateDaysBetween = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (!isValid(start) || !isValid(end)) return 0;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const rentalFormSchema = z.object({
  tenantName: z.string().optional(),
  tenantEmail: z.string().optional(),
  tenantPhone: z.string().optional(),
  tenantIdPhotoUrl: z.string().optional(),
  startDate: z.string().min(1, "Fecha de inicio requerida"),
  endDate: z.string().min(1, "Fecha de fin requerida"),
  monthlyRent: z.string().min(1, "Renta mensual requerida"),
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
  const [dateMode, setDateMode] = useState<"duration" | "specific">("duration");
  const [contractDuration, setContractDuration] = useState<number>(12);
  // Owner state
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [isCreatingNewOwner, setIsCreatingNewOwner] = useState(false);
  const [newOwnerData, setNewOwnerData] = useState({
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
  });
  const [additionalServices, setAdditionalServices] = useState<Array<{
    serviceType: string;
    amount: string;
    dayOfMonth: number;
    paymentFrequency: "monthly" | "bimonthly";
    chargeType: "fixed" | "variable";
  }>>([]);
  const [additionalTenants, setAdditionalTenants] = useState<Array<{
    fullName: string;
    email: string;
    phone: string;
    idPhotoUrl: string;
  }>>([]);
  const [condominiumSearch, setCondominiumSearch] = useState("");

  const { data: condominiums, isLoading: condominiumsLoading } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/external-condominiums-for-filters"],
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Filter condominiums based on search
  const filteredCondominiums = useMemo(() => {
    if (!condominiums) return [];
    if (!condominiumSearch.trim()) return condominiums;
    const searchLower = condominiumSearch.toLowerCase().trim();
    return condominiums.filter(c => c.name.toLowerCase().includes(searchLower));
  }, [condominiums, condominiumSearch]);

  // Load units for the selected condominium (uses endpoint that returns ALL units without pagination limit)
  const { data: availableUnits, isLoading: unitsLoading } = useQuery<UnitWithDetails[]>({
    queryKey: ["/api/external-units/by-condominium", selectedCondominiumId],
    queryFn: async () => {
      const response = await fetch(`/api/external-units/by-condominium/${selectedCondominiumId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch units");
      return response.json();
    },
    enabled: !!selectedCondominiumId, // Only fetch when a condominium is selected
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Query for active owner when unit is selected
  const { data: unitOwner, isLoading: ownerLoading } = useQuery<{ id: string; ownerName: string; ownerEmail: string; ownerPhone: string; isActive: boolean } | null>({
    queryKey: ["/api/external-unit-owners/active", selectedUnitId],
    queryFn: async () => {
      const response = await fetch(`/api/external-unit-owners/active/${selectedUnitId}`, { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch owner');
      }
      return response.json();
    },
    enabled: !!selectedUnitId,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select owner when unit changes
  useEffect(() => {
    if (unitOwner?.id) {
      setSelectedOwnerId(unitOwner.id);
      setIsCreatingNewOwner(false);
    } else if (selectedUnitId && !ownerLoading) {
      setSelectedOwnerId("");
      setIsCreatingNewOwner(true); // No owner, need to create one
    }
  }, [unitOwner, selectedUnitId, ownerLoading]);

  const { data: clientsResponse, isLoading: clientsLoading } = useQuery<PaginatedResponse<ExternalClient>>({
    queryKey: ["/api/external-clients", { limit: 10000 }], // Get all clients for selection
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("limit", "10000"); // High limit to get all clients
      params.append("offset", "0");
      const response = await fetch(`/api/external-clients?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
    enabled: step === 4, // Only load when on step 4 (tenant step, now shifted)
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
  
  const clients = clientsResponse?.data || [];

  const form = useForm<RentalFormData>({
    resolver: zodResolver(rentalFormSchema),
    defaultValues: {
      tenantName: "",
      tenantEmail: "",
      tenantPhone: "",
      monthlyRent: "",
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
      const response = await apiRequest("POST", "/api/external-rental-contracts", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/rentals/overview"] });
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
    setCondominiumSearch("");
    setSelectedOwnerId("");
    setIsCreatingNewOwner(false);
    setNewOwnerData({ ownerName: "", ownerEmail: "", ownerPhone: "" });
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
      // Validate owner selection
      if (!selectedOwnerId && !isCreatingNewOwner) {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: language === "es" ? "Por favor selecciona o crea un propietario" : "Please select or create an owner",
          variant: "destructive",
        });
        return;
      }
      // If creating new owner, validate required fields
      if (isCreatingNewOwner) {
        if (!newOwnerData.ownerName.trim()) {
          toast({
            title: language === "es" ? "Error" : "Error",
            description: language === "es" ? "El nombre del propietario es requerido" : "Owner name is required",
            variant: "destructive",
          });
          return;
        }
      }
    }
    if (step === 4) {
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

    // Get agencyId from selected unit
    if (!selectedUnit?.agencyId) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "Error al obtener información de la agencia" : "Failed to get agency information",
        variant: "destructive",
      });
      return;
    }

    // Create owner if needed
    let finalOwnerId = selectedOwnerId;
    if (isCreatingNewOwner && newOwnerData.ownerName.trim()) {
      try {
        const ownerResponse = await apiRequest("POST", "/api/external-unit-owners", {
          unitId: selectedUnitId,
          ownerName: newOwnerData.ownerName.trim(),
          ownerEmail: newOwnerData.ownerEmail.trim() || undefined,
          ownerPhone: newOwnerData.ownerPhone.trim() || undefined,
          isActive: true,
        });
        const newOwner = await ownerResponse.json();
        finalOwnerId = newOwner.id;
        queryClient.invalidateQueries({ queryKey: ["/api/external-unit-owners/active", selectedUnitId] });
      } catch (error: any) {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: error.message || (language === "es" ? "No se pudo crear el propietario" : "Failed to create owner"),
          variant: "destructive",
        });
        return;
      }
    }

    // Build contract data
    const contract = {
      agencyId: selectedUnit.agencyId,
      unitId: selectedUnitId,
      ownerId: finalOwnerId || undefined,
      tenantName: tenantInfo.tenantName,
      tenantEmail: tenantInfo.tenantEmail,
      tenantPhone: tenantInfo.tenantPhone,
      clientId: tenantInfo.clientId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      monthlyRent: data.monthlyRent,
      securityDeposit: data.securityDeposit || "0",
      leaseDurationMonths: data.leaseDurationMonths,
      currency: "MXN",
      rentalPurpose: "living" as const,
      // Pet fields
      hasPet: data.hasPet,
      petName: data.hasPet ? data.petName : undefined,
      petPhotoUrl: data.hasPet ? data.petPhotoUrl : undefined,
      petDescription: data.hasPet ? data.petDescription : undefined,
    };

    // Build services array with rent + additional services
    // Calculate rent day of month from start date (using string split to avoid timezone issues)
    const rentDayOfMonth = parseInt(data.startDate.split('-')[2]);
    
    const services = [
      {
        serviceType: "rent",
        amount: parseFloat(data.monthlyRent), // Convert to number
        dayOfMonth: rentDayOfMonth,
        currency: "MXN",
        paymentFrequency: "monthly" as const,
      },
      ...additionalServices.map(s => ({
        serviceType: s.serviceType,
        amount: parseFloat(s.amount), // Convert to number
        dayOfMonth: s.dayOfMonth,
        currency: "MXN",
        paymentFrequency: s.paymentFrequency,
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
            await apiRequest("POST", "/api/external-rental-tenants", {
              contractId,
              fullName: tenant.fullName,
              email: tenant.email || undefined,
              phone: tenant.phone || undefined,
              idPhotoUrl: tenant.idPhotoUrl || undefined,
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
      { serviceType: "water", amount: "", dayOfMonth: 1, paymentFrequency: "monthly", chargeType: "fixed" },
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
  // Filter units: only show active units without an existing contract
  const filteredUnits = availableUnits?.filter(u => 
    u.isActive && 
    !u.currentContractId
  ) || [];

  const steps = [
    { number: 1, title: language === "es" ? "Condominio" : "Condominium", icon: Building2 },
    { number: 2, title: language === "es" ? "Unidad" : "Unit", icon: Home },
    { number: 3, title: language === "es" ? "Propietario" : "Owner", icon: UserCheck },
    { number: 4, title: language === "es" ? "Inquilino" : "Tenant", icon: User },
    { number: 5, title: language === "es" ? "Términos" : "Terms", icon: DollarSign },
    { number: 6, title: language === "es" ? "Confirmar" : "Confirm", icon: Check },
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {language === "es" ? "Selecciona el Condominio" : "Select Condominium"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === "es" 
                        ? "Elige el condominio donde se encuentra la unidad" 
                        : "Choose the condominium where the unit is located"}
                    </p>
                  </div>
                  {condominiums && condominiums.length > 0 && (
                    <Badge variant="secondary" className="self-start">
                      {filteredCondominiums.length} / {condominiums.length}
                    </Badge>
                  )}
                </div>

                {/* Search Input */}
                {condominiums && condominiums.length > 10 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={language === "es" ? "Buscar condominio..." : "Search condominium..."}
                      value={condominiumSearch}
                      onChange={(e) => setCondominiumSearch(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-condominium"
                    />
                  </div>
                )}

                {condominiumsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {language === "es" ? "Cargando condominios..." : "Loading condominiums..."}
                  </p>
                ) : !condominiums || condominiums.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {language === "es" ? "No hay condominios disponibles" : "No condominiums available"}
                  </p>
                ) : filteredCondominiums.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {language === "es" ? "No se encontraron condominios" : "No condominiums found"}
                  </p>
                ) : (
                  <div className="max-h-[350px] overflow-y-auto pr-1">
                    <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                      {filteredCondominiums.map((condo) => (
                        <Card
                          key={condo.id}
                          className={`cursor-pointer hover-elevate ${
                            selectedCondominiumId === condo.id ? "border-primary border-2" : ""
                          }`}
                          onClick={() => setSelectedCondominiumId(condo.id)}
                          data-testid={`condo-option-${condo.id}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <p className="font-medium truncate text-sm">{condo.name}</p>
                              </div>
                              {selectedCondominiumId === condo.id && (
                                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
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

            {/* Step 3: Owner Info */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {language === "es" ? "Propietario de la Unidad" : "Unit Owner"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" 
                      ? "Confirma o agrega la información del propietario" 
                      : "Confirm or add owner information"}
                  </p>
                </div>

                {ownerLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-muted-foreground">
                      {language === "es" ? "Cargando propietario..." : "Loading owner..."}
                    </p>
                  </div>
                ) : unitOwner ? (
                  <Card className="border-primary border-2 bg-primary/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">
                          {language === "es" ? "Propietario Actual" : "Current Owner"}
                        </CardTitle>
                        <Badge variant="default" className="ml-auto">
                          {language === "es" ? "Activo" : "Active"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{unitOwner.ownerName}</span>
                      </div>
                      {unitOwner.ownerEmail && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{unitOwner.ownerEmail}</span>
                        </div>
                      )}
                      {unitOwner.ownerPhone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{unitOwner.ownerPhone}</span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          setIsCreatingNewOwner(true);
                          setSelectedOwnerId("");
                        }}
                        data-testid="button-change-owner"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {language === "es" ? "Cambiar propietario" : "Change owner"}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-yellow-500/50 bg-yellow-500/10">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <p className="font-medium text-yellow-700 dark:text-yellow-400">
                          {language === "es" ? "Esta unidad no tiene propietario registrado" : "This unit has no registered owner"}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {language === "es" 
                          ? "Debes agregar un propietario para continuar con el contrato de renta." 
                          : "You must add an owner to continue with the rental contract."}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* New Owner Form */}
                {(isCreatingNewOwner || !unitOwner) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {language === "es" ? "Nuevo Propietario" : "New Owner"}
                      </CardTitle>
                      <CardDescription>
                        {language === "es" 
                          ? "Ingresa los datos del propietario de esta unidad" 
                          : "Enter the owner details for this unit"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="ownerName">
                          {language === "es" ? "Nombre completo" : "Full name"} *
                        </Label>
                        <Input
                          id="ownerName"
                          value={newOwnerData.ownerName}
                          onChange={(e) => setNewOwnerData({ ...newOwnerData, ownerName: e.target.value })}
                          placeholder={language === "es" ? "Juan Pérez García" : "John Doe"}
                          data-testid="input-owner-name"
                          className="mt-1.5"
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="ownerEmail">
                            {language === "es" ? "Email" : "Email"}
                          </Label>
                          <Input
                            id="ownerEmail"
                            type="email"
                            value={newOwnerData.ownerEmail}
                            onChange={(e) => setNewOwnerData({ ...newOwnerData, ownerEmail: e.target.value })}
                            placeholder="propietario@email.com"
                            data-testid="input-owner-email"
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ownerPhone">
                            {language === "es" ? "Teléfono / WhatsApp" : "Phone / WhatsApp"}
                          </Label>
                          <Input
                            id="ownerPhone"
                            type="tel"
                            value={newOwnerData.ownerPhone}
                            onChange={(e) => setNewOwnerData({ ...newOwnerData, ownerPhone: e.target.value })}
                            placeholder="+52 1 998 123 4567"
                            data-testid="input-owner-phone"
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                      {unitOwner && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsCreatingNewOwner(false);
                            setSelectedOwnerId(unitOwner.id);
                            setNewOwnerData({ ownerName: "", ownerEmail: "", ownerPhone: "" });
                          }}
                          data-testid="button-cancel-new-owner"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          {language === "es" ? "Usar propietario actual" : "Use current owner"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 4: Tenant Info */}
            {step === 4 && (
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
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
                  <Button
                    type="button"
                    variant={!useExistingClient ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setUseExistingClient(false);
                      setSelectedClientId("");
                    }}
                    data-testid="button-new-client"
                    className="flex-1"
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
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {language === "es" ? "Cliente Existente" : "Existing Client"}
                  </Button>
                </div>

                {/* Existing Client Selection */}
                {useExistingClient && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {language === "es" ? "Seleccionar Cliente" : "Select Client"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>{language === "es" ? "Cliente" : "Client"}</Label>
                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                          <SelectTrigger data-testid="select-existing-client" className="mt-2">
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
                    </CardContent>
                  </Card>
                )}

                {/* New Client Form */}
                {!useExistingClient && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {language === "es" ? "Inquilino Principal" : "Primary Tenant"}
                      </CardTitle>
                      <CardDescription>
                        {language === "es" ? "Información básica del inquilino" : "Basic tenant information"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tenantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Nombre completo" : "Full name"}</FormLabel>
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
                            <FormLabel>{language === "es" ? "Correo electrónico" : "Email"}</FormLabel>
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
                            <FormLabel>{language === "es" ? "Teléfono" : "Phone"}</FormLabel>
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
                          <FormLabel>{language === "es" ? "Identificación oficial (opcional)" : "Official ID (optional)"}</FormLabel>
                          <FormControl>
                            <Input 
                              type="file" 
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  field.onChange(file.name);
                                }
                              }}
                              data-testid="input-tenant-id-photo"
                              className="h-10 flex items-center file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-accent/80 hover:file:bg-accent"
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

                {/* Pet Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <FormField
                        control={form.control}
                        name="hasPet"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-has-pet"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0 cursor-pointer flex items-center gap-2 font-semibold">
                              <PawPrint className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                              {language === "es" ? "Mascota" : "Pet"}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      {form.watch("hasPet") && (
                        <Badge variant="secondary" className="gap-1">
                          <PawPrint className="h-3 w-3" />
                          {language === "es" ? "Con mascota" : "With pet"}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  {form.watch("hasPet") && (
                    <CardContent className="space-y-4 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  className="h-10 flex items-center file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-accent/80 hover:file:bg-accent"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="petDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "es" ? "Descripción (raza, tamaño, etc.)" : "Description (breed, size, etc.)"}</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder={language === "es" ? "Pastor Alemán, tamaño grande" : "German Shepherd, large size"} data-testid="textarea-pet-description" rows={2} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  )}
                </Card>

                {/* Additional Tenants */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{language === "es" ? "Inquilinos Adicionales" : "Additional Tenants"}</CardTitle>
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
                      <CardDescription className="mt-2">
                        {language === "es" 
                          ? `${additionalTenants.length} inquilino(s) adicional(es)` 
                          : `${additionalTenants.length} additional tenant(s)`}
                      </CardDescription>
                    )}
                  </CardHeader>

                  {additionalTenants.length > 0 && (
                    <CardContent className="space-y-3 pt-0">
                      {additionalTenants.map((tenant, index) => (
                        <div key={index} className="p-4 bg-muted/40 rounded-lg border space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {language === "es" ? `Inquilino ${index + 2}` : `Tenant ${index + 2}`}
                              </Badge>
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
                          
                          <div>
                            <Label htmlFor={`tenant-name-${index}`} className="text-xs">
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

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`tenant-email-${index}`} className="text-xs">
                                {language === "es" ? "Email" : "Email"}
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
                              <Label htmlFor={`tenant-phone-${index}`} className="text-xs">
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
                            <Label htmlFor={`tenant-id-url-${index}`} className="text-xs">
                              {language === "es" ? "ID oficial (opcional)" : "Official ID (optional)"}
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
                              className="mt-1.5 h-10 flex items-center file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-accent/80 hover:file:bg-accent"
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              </div>
            )}

            {/* Step 5: Terms */}
            {step === 5 && (
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

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <Label className="text-sm font-medium">
                      {language === "es" ? "Configurar fechas:" : "Configure dates:"}
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={dateMode === "duration" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDateMode("duration")}
                        data-testid="button-date-mode-duration"
                      >
                        {language === "es" ? "Por duración" : "By duration"}
                      </Button>
                      <Button
                        type="button"
                        variant={dateMode === "specific" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDateMode("specific")}
                        data-testid="button-date-mode-specific"
                      >
                        {language === "es" ? "Fechas específicas" : "Specific dates"}
                      </Button>
                    </div>
                  </div>

                  {dateMode === "duration" ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "es" ? "Fecha de inicio" : "Start date"}</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  // Auto-calculate end date
                                  const endDate = addMonths(e.target.value, contractDuration);
                                  form.setValue("endDate", endDate);
                                }}
                                data-testid="input-start-date" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <Label>{language === "es" ? "Duración del contrato" : "Contract duration"}</Label>
                        <Select 
                          value={contractDuration.toString()} 
                          onValueChange={(val) => {
                            const months = parseInt(val);
                            setContractDuration(months);
                            form.setValue("leaseDurationMonths", months);
                            // Auto-calculate end date
                            const startDate = form.getValues("startDate");
                            if (startDate) {
                              const endDate = addMonths(startDate, months);
                              form.setValue("endDate", endDate);
                            }
                          }}
                        >
                          <SelectTrigger className="mt-2" data-testid="select-contract-duration">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6">{language === "es" ? "6 meses" : "6 months"}</SelectItem>
                            <SelectItem value="12">{language === "es" ? "12 meses" : "12 months"}</SelectItem>
                            <SelectItem value="24">{language === "es" ? "24 meses" : "24 months"}</SelectItem>
                            <SelectItem value="36">{language === "es" ? "36 meses" : "36 months"}</SelectItem>
                            <SelectItem value="48">{language === "es" ? "48 meses" : "48 months"}</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.watch("endDate") && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {language === "es" ? "Fecha de fin:" : "End date:"} {safeFormatDate(new Date(form.watch("endDate")), 'dd/MM/yyyy', { locale: language === "es" ? es : enUS })}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "es" ? "Fecha de inicio" : "Start date"}</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value)}
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
                                type="date"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value)}
                                data-testid="input-end-date" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {form.watch("startDate") && form.watch("endDate") && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {language === "es" ? "Duración total:" : "Total duration:"}
                          </span>
                          <Badge variant="secondary">
                            {calculateDaysBetween(form.watch("startDate"), form.watch("endDate"))} {language === "es" ? "días" : "days"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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

                  <div>
                    <Label className="text-sm font-medium">
                      {language === "es" ? "Día de pago" : "Payment day"}
                    </Label>
                    <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {form.watch("startDate") 
                            ? `${language === "es" ? "Día" : "Day"} ${parseInt(form.watch("startDate").split('-')[2])}`
                            : language === "es" ? "Según fecha de inicio" : "Based on start date"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "es" 
                          ? "El día de pago será el mismo que la fecha de inicio" 
                          : "Payment day will match the start date"}
                      </p>
                    </div>
                  </div>
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
                    <Card key={idx} className="p-3 mb-2">
                      <div className="grid grid-cols-12 items-end gap-2 mb-2">
                        <div className="col-span-3">
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
                        <div className="col-span-2">
                          <Label className="text-xs">{language === "es" ? "Tipo" : "Type"}</Label>
                          <Select 
                            value={service.chargeType} 
                            onValueChange={(val: "fixed" | "variable") => {
                              updateService(idx, "chargeType", val);
                              // Clear amount if switching to variable
                              if (val === "variable") {
                                updateService(idx, "amount", "0");
                              }
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">{language === "es" ? "Fijo" : "Fixed"}</SelectItem>
                              <SelectItem value="variable">{language === "es" ? "Variable" : "Variable"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">{language === "es" ? "Monto" : "Amount"}</Label>
                          {service.chargeType === "fixed" ? (
                            <Input 
                              type="number"
                              value={service.amount}
                              onChange={(e) => updateService(idx, "amount", e.target.value)}
                              placeholder="0"
                              className="h-9"
                            />
                          ) : (
                            <div className="h-9 flex items-center px-3 bg-muted/50 rounded-md border">
                              <span className="text-xs text-muted-foreground">
                                {language === "es" ? "Variable" : "Variable"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">{language === "es" ? "Frecuencia" : "Frequency"}</Label>
                          <Select 
                            value={service.paymentFrequency} 
                            onValueChange={(val: "monthly" | "bimonthly") => updateService(idx, "paymentFrequency", val)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">{language === "es" ? "Mensual" : "Monthly"}</SelectItem>
                              <SelectItem value="bimonthly">{language === "es" ? "Bimestral" : "Bimonthly"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
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
                        <div className="col-span-1 flex justify-end">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeService(idx)}
                            className="h-9"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {service.chargeType === "variable" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === "es" 
                            ? "El monto se registrará en la fecha de corte" 
                            : "Amount will be recorded on the cut-off date"}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Confirm */}
            {step === 6 && (
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
                    <CardTitle className="text-base">{language === "es" ? "Propiedad" : "Property"}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === "es" ? "Condominio:" : "Condominium:"}</span>
                      <strong>{selectedUnit?.condominium?.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === "es" ? "Unidad:" : "Unit:"}</span>
                      <strong>{selectedUnit?.unitNumber}</strong>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      {language === "es" ? "Propietario" : "Owner"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    {isCreatingNewOwner && newOwnerData.ownerName ? (
                      <>
                        <p><strong>{newOwnerData.ownerName}</strong></p>
                        <p className="text-muted-foreground">{newOwnerData.ownerEmail || "-"}</p>
                        <p className="text-muted-foreground">{newOwnerData.ownerPhone || "-"}</p>
                        <Badge variant="secondary" className="mt-1">
                          {language === "es" ? "Nuevo propietario" : "New owner"}
                        </Badge>
                      </>
                    ) : unitOwner ? (
                      <>
                        <p><strong>{unitOwner.ownerName}</strong></p>
                        <p className="text-muted-foreground">{unitOwner.ownerEmail || "-"}</p>
                        <p className="text-muted-foreground">{unitOwner.ownerPhone || "-"}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground italic">
                        {language === "es" ? "Sin propietario" : "No owner"}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{language === "es" ? "Inquilino Principal" : "Primary Tenant"}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    {useExistingClient && selectedClientId && clients ? (
                      (() => {
                        const selectedClient = clients.find((c: any) => c.id === selectedClientId);
                        return selectedClient ? (
                          <>
                            <p><strong>{selectedClient.firstName} {selectedClient.lastName}</strong></p>
                            <p className="text-muted-foreground">{selectedClient.email || "-"}</p>
                            <p className="text-muted-foreground">{selectedClient.phone || "-"}</p>
                          </>
                        ) : null;
                      })()
                    ) : (
                      <>
                        <p><strong>{form.watch("tenantName") || "-"}</strong></p>
                        <p className="text-muted-foreground">{form.watch("tenantEmail") || "-"}</p>
                        <p className="text-muted-foreground">{form.watch("tenantPhone") || "-"}</p>
                      </>
                    )}
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
                      <span className="text-muted-foreground">{language === "es" ? "Día de pago" : "Payment day"}:</span>
                      <strong>
                        {form.watch("startDate") 
                          ? `${language === "es" ? "Día" : "Day"} ${parseInt(form.watch("startDate").split('-')[2])}`
                          : "-"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === "es" ? "Depósito" : "Deposit"}:</span>
                      <strong>${form.watch("securityDeposit") || "0"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === "es" ? "Duración" : "Duration"}:</span>
                      <strong>
                        {form.watch("leaseDurationMonths")} {language === "es" ? "meses" : "months"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === "es" ? "Período" : "Period"}:</span>
                      <strong>
                        {form.watch("startDate") && safeFormatDate(new Date(form.watch("startDate")), 'dd/MM/yyyy', { locale: language === "es" ? es : enUS })}
                        {form.watch("startDate") && form.watch("endDate") && " - "}
                        {form.watch("endDate") && safeFormatDate(new Date(form.watch("endDate")), 'dd/MM/yyyy', { locale: language === "es" ? es : enUS })}
                      </strong>
                    </div>
                    
                    {form.watch("hasPet") && (
                      <>
                        <Separator className="my-2" />
                        <div className="flex items-center gap-2 text-xs">
                          <PawPrint className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {language === "es" ? "Mascota:" : "Pet:"}{" "}
                            <strong className="text-foreground">{form.watch("petName") || (language === "es" ? "Sí" : "Yes")}</strong>
                          </span>
                        </div>
                        {form.watch("petDescription") && (
                          <p className="text-xs text-muted-foreground pl-6">{form.watch("petDescription")}</p>
                        )}
                      </>
                    )}

                    {additionalTenants.length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <p className="text-muted-foreground text-xs font-medium">
                          {language === "es" ? "Inquilinos adicionales:" : "Additional tenants:"}
                        </p>
                        {additionalTenants.map((tenant, idx) => (
                          tenant.fullName && (
                            <div key={idx} className="text-xs text-muted-foreground pl-2">
                              • {tenant.fullName}
                            </div>
                          )
                        ))}
                      </>
                    )}
                    
                    {additionalServices.length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <p className="text-muted-foreground text-xs font-medium">
                          {language === "es" ? "Servicios adicionales:" : "Additional services:"}
                        </p>
                        {additionalServices.map((service, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs gap-2">
                            <span className="text-muted-foreground capitalize flex-1">
                              {service.serviceType} 
                              <span className="text-muted-foreground/60 ml-1">
                                ({service.paymentFrequency === "monthly" 
                                  ? (language === "es" ? "mensual" : "monthly") 
                                  : (language === "es" ? "bimestral" : "bimonthly")})
                              </span>
                            </span>
                            {service.chargeType === "fixed" ? (
                              <span className="font-medium">${service.amount}</span>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {language === "es" ? "Variable" : "Variable"}
                              </Badge>
                            )}
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

              {step < 6 ? (
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
                  type="button"
                  onClick={() => form.handleSubmit(handleSubmit)()}
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
