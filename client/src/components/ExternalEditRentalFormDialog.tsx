import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import ChangeReviewStep from "./ChangeReviewStep";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ExternalEditRentalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rentalFormToken: any;
}

// Schema for tenant forms
const tenantFormEditSchema = z.object({
  fullName: z.string().min(2, "Nombre completo es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  nationality: z.string().min(2, "Nacionalidad es requerida"),
  age: z.coerce.number().min(18, "Edad mínima 18 años").optional(),
  maritalStatus: z.string().optional(),
  timeInTulum: z.string().optional(),
  address: z.string().optional(),
  // Employment info
  jobPosition: z.string().optional(),
  companyName: z.string().optional(),
  workAddress: z.string().optional(),
  workPhone: z.string().optional(),
  monthlyIncome: z.coerce.number().optional(),
  // Rental details
  desiredMoveInDate: z.string().optional(),
  desiredMoveOutDate: z.string().optional(),
  numberOfOccupants: z.coerce.number().min(1).optional(),
  hasPets: z.boolean().optional(),
  hasVehicle: z.boolean().optional(),
});

// Schema for owner forms
const ownerFormEditSchema = z.object({
  fullName: z.string().min(2, "Nombre completo es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  nationality: z.string().min(2, "Nacionalidad es requerida"),
  age: z.coerce.number().min(18, "Edad mínima 18 años").optional(),
  address: z.string().optional(),
  // Owner-specific fields
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  clabe: z.string().optional(),
  paymentPreference: z.string().optional(),
  minimumRentalPeriod: z.string().optional(),
  maximumOccupants: z.coerce.number().optional(),
  petsAllowed: z.boolean().optional(),
});

type TenantFormEditValues = z.infer<typeof tenantFormEditSchema>;
type OwnerFormEditValues = z.infer<typeof ownerFormEditSchema>;

export default function ExternalEditRentalFormDialog({ open, onOpenChange, rentalFormToken }: ExternalEditRentalFormDialogProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const isOwnerForm = rentalFormToken?.recipientType === 'owner';
  const [step, setStep] = useState<1 | 2>(1); // 1 = edit form, 2 = review changes
  const [originalData, setOriginalData] = useState<TenantFormEditValues | OwnerFormEditValues | null>(null);

  // Use appropriate schema based on form type
  const tenantForm = useForm<TenantFormEditValues>({
    resolver: zodResolver(tenantFormEditSchema),
    defaultValues: {},
  });

  const ownerForm = useForm<OwnerFormEditValues>({
    resolver: zodResolver(ownerFormEditSchema),
    defaultValues: {},
  });

  const form = isOwnerForm ? ownerForm : tenantForm;

  // Pre-fill form when dialog opens with data
  useEffect(() => {
    if (open && rentalFormToken) {
      // CRITICAL: Owner forms read from ownerData, tenant forms read from tenantData
      const sourceData = isOwnerForm ? rentalFormToken.ownerData : rentalFormToken.tenantData;
      
      if (!sourceData) return; // No data to pre-fill
      
      if (isOwnerForm) {
        const initialValues = {
          fullName: sourceData.fullName || "",
          email: sourceData.email || "",
          whatsapp: sourceData.whatsapp || "",
          nationality: sourceData.nationality || "",
          age: sourceData.age || undefined,
          address: sourceData.address || "",
          bankName: sourceData.bankName || "",
          accountNumber: sourceData.accountNumber || "",
          clabe: sourceData.clabe || "",
          paymentPreference: sourceData.paymentPreference || "",
          minimumRentalPeriod: sourceData.minimumRentalPeriod || "",
          maximumOccupants: sourceData.maximumOccupants || undefined,
          petsAllowed: Boolean(sourceData.petsAllowed), // Normalize to strict boolean
        };
        ownerForm.reset(initialValues);
        setOriginalData(initialValues);
      } else {
        const initialValues = {
          fullName: sourceData.fullName || "",
          email: sourceData.email || "",
          whatsapp: sourceData.whatsapp || "",
          nationality: sourceData.nationality || "",
          age: sourceData.age || undefined,
          maritalStatus: sourceData.maritalStatus || "",
          timeInTulum: sourceData.timeInTulum || "",
          address: sourceData.address || "",
          jobPosition: sourceData.jobPosition || "",
          companyName: sourceData.companyName || "",
          workAddress: sourceData.workAddress || "",
          workPhone: sourceData.workPhone || "",
          monthlyIncome: sourceData.monthlyIncome || undefined,
          desiredMoveInDate: sourceData.desiredMoveInDate || "",
          desiredMoveOutDate: sourceData.desiredMoveOutDate || "",
          numberOfOccupants: sourceData.numberOfOccupants || undefined,
          hasPets: Boolean(sourceData.hasPets), // Normalize to strict boolean
          hasVehicle: Boolean(sourceData.hasVehicle), // Normalize to strict boolean
        };
        tenantForm.reset(initialValues);
        setOriginalData(initialValues);
      }
      setStep(1); // Reset to step 1 when opening
    }
  }, [open, rentalFormToken, isOwnerForm, tenantForm, ownerForm]);

  const updateMutation = useMutation({
    mutationFn: async (data: TenantFormEditValues | OwnerFormEditValues) => {
      const response = await apiRequest("PATCH", `/api/external/rental-forms/${rentalFormToken.id}`, {
        formData: data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/rental-form-tokens"] });
      toast({
        title: language === "es" ? "Formulario actualizado" : "Form updated",
        description: language === "es" ? "Los cambios han sido guardados" : "Changes have been saved",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo actualizar" : "Could not update"),
        variant: "destructive",
      });
    },
  });

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const onSubmit = (data: TenantFormEditValues | OwnerFormEditValues) => {
    // Normalize boolean values to ensure strict boolean types
    const normalizedData = { ...data };
    if ('hasPets' in normalizedData) {
      normalizedData.hasPets = Boolean(normalizedData.hasPets);
    }
    if ('hasVehicle' in normalizedData) {
      normalizedData.hasVehicle = Boolean(normalizedData.hasVehicle);
    }
    if ('petsAllowed' in normalizedData) {
      normalizedData.petsAllowed = Boolean(normalizedData.petsAllowed);
    }
    updateMutation.mutate(normalizedData);
  };

  const tenantFieldLabels: Record<string, string> = {
    fullName: language === "es" ? "Nombre Completo" : "Full Name",
    email: "Email",
    whatsapp: "WhatsApp",
    nationality: language === "es" ? "Nacionalidad" : "Nationality",
    age: language === "es" ? "Edad" : "Age",
    maritalStatus: language === "es" ? "Estado Civil" : "Marital Status",
    timeInTulum: language === "es" ? "Tiempo en Tulum" : "Time in Tulum",
    address: language === "es" ? "Dirección" : "Address",
    jobPosition: language === "es" ? "Posición" : "Job Position",
    companyName: language === "es" ? "Nombre de la Empresa" : "Company Name",
    workAddress: language === "es" ? "Dirección del Trabajo" : "Work Address",
    workPhone: language === "es" ? "Teléfono del Trabajo" : "Work Phone",
    monthlyIncome: language === "es" ? "Ingreso Mensual" : "Monthly Income",
    desiredMoveInDate: language === "es" ? "Fecha de Entrada" : "Move-in Date",
    desiredMoveOutDate: language === "es" ? "Fecha de Salida" : "Move-out Date",
    numberOfOccupants: language === "es" ? "Número de Ocupantes" : "Number of Occupants",
    hasPets: language === "es" ? "Tiene Mascotas" : "Has Pets",
    hasVehicle: language === "es" ? "Tiene Vehículo" : "Has Vehicle",
  };

  const ownerFieldLabels: Record<string, string> = {
    fullName: language === "es" ? "Nombre Completo" : "Full Name",
    email: "Email",
    whatsapp: "WhatsApp",
    nationality: language === "es" ? "Nacionalidad" : "Nationality",
    age: language === "es" ? "Edad" : "Age",
    address: language === "es" ? "Dirección" : "Address",
    bankName: language === "es" ? "Nombre del Banco" : "Bank Name",
    accountNumber: language === "es" ? "Número de Cuenta" : "Account Number",
    clabe: "CLABE",
    paymentPreference: language === "es" ? "Preferencia de Pago" : "Payment Preference",
    minimumRentalPeriod: language === "es" ? "Período Mínimo de Renta" : "Minimum Rental Period",
    maximumOccupants: language === "es" ? "Ocupantes Máximos" : "Maximum Occupants",
    petsAllowed: language === "es" ? "Mascotas Permitidas" : "Pets Allowed",
  };

  const fieldLabels = isOwnerForm ? ownerFieldLabels : tenantFieldLabels;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "es" 
              ? `Editar Formulario de ${isOwnerForm ? 'Propietario' : 'Inquilino'}`
              : `Edit ${isOwnerForm ? 'Owner' : 'Tenant'} Form`
            }
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: Edit Form */}
            {step === 1 && (
              <div className="space-y-4">
            {/* Common fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Nombre Completo" : "Full Name"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-fullName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Email" : "Email"}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-whatsapp" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Nacionalidad" : "Nationality"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-nationality" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Edad" : "Age"}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        value={field.value || ""} 
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                        data-testid="input-age" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{language === "es" ? "Dirección" : "Address"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tenant-specific fields */}
            {!isOwnerForm && (
              <>
                <h3 className="text-sm font-medium mt-4">
                  {language === "es" ? "Información de Empleo" : "Employment Information"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={tenantForm.control}
                    name="jobPosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Puesto" : "Position"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-jobPosition" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={tenantForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Empresa" : "Company"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-companyName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={tenantForm.control}
                    name="monthlyIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Ingreso Mensual" : "Monthly Income"}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            value={field.value || ""} 
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                            data-testid="input-monthlyIncome" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="text-sm font-medium mt-4">
                  {language === "es" ? "Detalles de Renta" : "Rental Details"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={tenantForm.control}
                    name="desiredMoveInDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Fecha de Entrada" : "Move-in Date"}</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-desiredMoveInDate" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={tenantForm.control}
                    name="desiredMoveOutDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Fecha de Salida" : "Move-out Date"}</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-desiredMoveOutDate" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={tenantForm.control}
                    name="numberOfOccupants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "# Ocupantes" : "# Occupants"}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            value={field.value || ""} 
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                            data-testid="input-numberOfOccupants" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={tenantForm.control}
                    name="hasPets"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-hasPets"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {language === "es" ? "Tiene Mascotas" : "Has Pets"}
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={tenantForm.control}
                    name="hasVehicle"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-hasVehicle"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {language === "es" ? "Tiene Vehículo" : "Has Vehicle"}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {/* Owner-specific fields */}
            {isOwnerForm && (
              <>
                <h3 className="text-sm font-medium mt-4">
                  {language === "es" ? "Información Bancaria" : "Banking Information"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={ownerForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Banco" : "Bank"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-bankName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ownerForm.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Número de Cuenta" : "Account Number"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-accountNumber" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ownerForm.control}
                    name="clabe"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>CLABE</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-clabe" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ownerForm.control}
                    name="paymentPreference"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>{language === "es" ? "Preferencia de Pago" : "Payment Preference"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-paymentPreference" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="text-sm font-medium mt-4">
                  {language === "es" ? "Preferencias de Propiedad" : "Property Preferences"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={ownerForm.control}
                    name="minimumRentalPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Periodo Mínimo" : "Minimum Period"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-minimumRentalPeriod" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ownerForm.control}
                    name="maximumOccupants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Máximo Ocupantes" : "Maximum Occupants"}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            value={field.value || ""} 
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                            data-testid="input-maximumOccupants" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ownerForm.control}
                    name="petsAllowed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 col-span-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-petsAllowed"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {language === "es" ? "Mascotas Permitidas" : "Pets Allowed"}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
              </div>
            )}

            {/* Step 2: Review Changes */}
            {step === 2 && originalData && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {language === "es" ? "Revisar Cambios" : "Review Changes"}
                </h3>
                <ChangeReviewStep
                  originalData={originalData}
                  newData={form.getValues()}
                  fieldLabels={fieldLabels}
                  language={language}
                />
              </div>
            )}

            <DialogFooter className="gap-2">
              {step === 1 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={updateMutation.isPending}
                    data-testid="button-cancel"
                  >
                    {language === "es" ? "Cancelar" : "Cancel"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    data-testid="button-next"
                  >
                    {language === "es" ? "Siguiente" : "Next"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
              
              {step === 2 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={updateMutation.isPending}
                    data-testid="button-back"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {language === "es" ? "Atrás" : "Back"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-save"
                  >
                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {language === "es" ? "Guardar Cambios" : "Save Changes"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
