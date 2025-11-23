import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useEffect } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExternalEditRentalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rentalFormToken: any;
}

const rentalFormEditSchema = z.object({
  fullName: z.string().min(2, "Nombre completo es requerido"),
  email: z.string().email("Email inválido").optional(),
  whatsapp: z.string().optional(),
  nationality: z.string().min(2, "Nacionalidad es requerida"),
  age: z.coerce.number().min(18, "Edad mínima 18 años").optional().nullable(),
  maritalStatus: z.string().optional(),
  timeInTulum: z.string().optional(),
  address: z.string().optional(),
  birthDatePlace: z.string().optional(),
  
  // Employment info
  jobPosition: z.string().optional(),
  companyName: z.string().optional(),
  workAddress: z.string().optional(),
  workPhone: z.string().optional(),
  monthlyIncome: z.string().optional(),
  
  // Rental details
  desiredMoveInDate: z.string().optional(),
  desiredMoveOutDate: z.string().optional(),
  numberOfOccupants: z.coerce.number().min(1).optional().nullable(),
  hasPets: z.string().optional(),
  hasVehicle: z.string().optional(),
});

type RentalFormEditValues = z.infer<typeof rentalFormEditSchema>;

export default function ExternalEditRentalFormDialog({ open, onOpenChange, rentalFormToken }: ExternalEditRentalFormDialogProps) {
  const { toast } = useToast();
  const { language } = useLanguage();

  const form = useForm<RentalFormEditValues>({
    resolver: zodResolver(rentalFormEditSchema),
    defaultValues: {
      fullName: "",
      email: "",
      whatsapp: "",
      nationality: "",
      age: undefined,
      maritalStatus: "",
      timeInTulum: "",
      address: "",
      birthDatePlace: "",
      jobPosition: "",
      companyName: "",
      workAddress: "",
      workPhone: "",
      monthlyIncome: "",
      desiredMoveInDate: "",
      desiredMoveOutDate: "",
      numberOfOccupants: undefined,
      hasPets: "",
      hasVehicle: "",
    },
  });

  // Pre-fill form when dialog opens with data
  useEffect(() => {
    if (open && rentalFormToken?.tenantData) {
      const data = rentalFormToken.tenantData;
      form.reset({
        fullName: data.fullName || "",
        email: data.email || "",
        whatsapp: data.whatsapp || "",
        nationality: data.nationality || "",
        age: data.age || undefined,
        maritalStatus: data.maritalStatus || "",
        timeInTulum: data.timeInTulum || "",
        address: data.address || "",
        birthDatePlace: data.birthDatePlace || "",
        jobPosition: data.jobPosition || "",
        companyName: data.companyName || "",
        workAddress: data.workAddress || "",
        workPhone: data.workPhone || "",
        monthlyIncome: data.monthlyIncome || "",
        desiredMoveInDate: data.desiredMoveInDate || "",
        desiredMoveOutDate: data.desiredMoveOutDate || "",
        numberOfOccupants: data.numberOfOccupants || undefined,
        hasPets: data.hasPets || "",
        hasVehicle: data.hasVehicle || "",
      });
    }
  }, [open, rentalFormToken, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: RentalFormEditValues) => {
      const response = await apiRequest("PATCH", `/api/external/rental-forms/${rentalFormToken.id}`, {
        formData: data, // Backend will merge with existing data
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/rental-form-tokens"] });
      toast({
        title: language === "es" ? "Formulario actualizado" : "Form updated",
        description: language === "es" 
          ? "El formulario de renta ha sido actualizado correctamente" 
          : "The rental form has been updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo actualizar el formulario" : "Could not update form"),
      });
    },
  });

  const onSubmit = (data: RentalFormEditValues) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "es" ? "Editar Formulario de Renta" : "Edit Rental Form"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {language === "es" ? "Información Personal" : "Personal Information"}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <FormLabel>Email</FormLabel>
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
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          data-testid="input-age" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Estado Civil" : "Marital Status"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-maritalStatus" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeInTulum"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Tiempo en Tulum" : "Time in Tulum"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-timeInTulum" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Dirección Actual" : "Current Address"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {language === "es" ? "Información Laboral" : "Employment Information"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="jobPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Puesto/Giro" : "Position"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-jobPosition" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Empresa donde trabaja" : "Company Name"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-companyName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Domicilio de trabajo" : "Work Address"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-workAddress" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Teléfono de trabajo" : "Work Phone"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-workPhone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Ingreso mensual" : "Monthly Income"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-monthlyIncome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Rental Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {language === "es" ? "Detalles de Renta" : "Rental Details"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="desiredMoveInDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Fecha de ingreso" : "Move-in Date"}</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-desiredMoveInDate" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="desiredMoveOutDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Fecha de salida" : "Move-out Date"}</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-desiredMoveOutDate" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfOccupants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Número de ocupantes" : "Number of Occupants"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          value={field.value || ""} 
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          data-testid="input-numberOfOccupants" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasPets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "¿Tiene mascotas?" : "Has Pets?"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-hasPets">
                            <SelectValue placeholder={language === "es" ? "Seleccionar" : "Select"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">{language === "es" ? "Sí" : "Yes"}</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasVehicle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "¿Tiene vehículo?" : "Has Vehicle?"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-hasVehicle">
                            <SelectValue placeholder={language === "es" ? "Seleccionar" : "Select"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">{language === "es" ? "Sí" : "Yes"}</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                {language === "es" ? "Cancelar" : "Cancel"}
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                data-testid="button-submit"
              >
                {updateMutation.isPending 
                  ? (language === "es" ? "Guardando..." : "Saving...") 
                  : (language === "es" ? "Guardar Cambios" : "Save Changes")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
