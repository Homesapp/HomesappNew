import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ChevronLeft, ChevronRight, User, Briefcase, FileText, DollarSign, Calendar, Users } from "lucide-react";
import ChangeReviewStep from "./ChangeReviewStep";

interface ExternalEditOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerToken: any;
}

const offerEditSchema = z.object({
  nombreCompleto: z.string().min(2, "Nombre completo es requerido"),
  nacionalidad: z.string().min(2, "Nacionalidad es requerida"),
  edad: z.coerce.number().min(18, "Edad mínima 18 años").optional().nullable(),
  tiempoResidenciaTulum: z.string().optional(),
  trabajoPosicion: z.string().min(2, "Posición es requerida"),
  companiaTrabaja: z.string().min(2, "Compañía es requerida"),
  tieneMascotas: z.string().min(1, "Campo requerido"),
  ingresoMensualPromedio: z.string().min(1, "Ingreso es requerido"),
  numeroInquilinos: z.coerce.number().min(1, "Número de inquilinos requerido").optional().nullable(),
  tieneGarante: z.string().optional(),
  usoInmueble: z.enum(["vivienda", "subarrendamiento"]),
  rentaOfertada: z.coerce.number().min(0, "Renta ofertada requerida").optional().nullable(),
  rentasAdelantadas: z.coerce.number().min(0).optional().nullable(),
  fechaIngreso: z.string().optional(),
  fechaSalida: z.string().optional(),
  duracionContrato: z.string().optional(),
  contractCost: z.coerce.number().optional().nullable(),
  clientEmail: z.string().email("Email inválido").optional(),
  clientPhone: z.string().optional(),
});

type OfferEditValues = z.infer<typeof offerEditSchema>;

export default function ExternalEditOfferDialog({ open, onOpenChange, offerToken }: ExternalEditOfferDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1); // 1 = edit form, 2 = review changes
  const [originalData, setOriginalData] = useState<OfferEditValues | null>(null);

  const form = useForm<OfferEditValues>({
    resolver: zodResolver(offerEditSchema),
    defaultValues: {
      nombreCompleto: "",
      nacionalidad: "",
      edad: null,
      tiempoResidenciaTulum: "",
      trabajoPosicion: "",
      companiaTrabaja: "",
      tieneMascotas: "No",
      ingresoMensualPromedio: "",
      numeroInquilinos: null,
      tieneGarante: "No",
      usoInmueble: "vivienda",
      rentaOfertada: null,
      rentasAdelantadas: null,
      fechaIngreso: "",
      fechaSalida: "",
      duracionContrato: "",
      contractCost: null,
      clientEmail: "",
      clientPhone: "",
    },
  });

  // Pre-fill form when dialog opens and reset step
  useEffect(() => {
    if (open && offerToken?.offerData) {
      const data = offerToken.offerData;
      const initialValues = {
        nombreCompleto: data.nombreCompleto || "",
        nacionalidad: data.nacionalidad || "",
        edad: data.edad || null,
        tiempoResidenciaTulum: data.tiempoResidenciaTulum || "",
        trabajoPosicion: data.trabajoPosicion || "",
        companiaTrabaja: data.companiaTrabaja || "",
        tieneMascotas: data.tieneMascotas || "No",
        ingresoMensualPromedio: data.ingresoMensualPromedio || "",
        numeroInquilinos: data.numeroInquilinos || null,
        tieneGarante: data.tieneGarante || "No",
        usoInmueble: data.usoInmueble || "vivienda",
        rentaOfertada: data.rentaOfertada || null,
        rentasAdelantadas: data.rentasAdelantadas || null,
        fechaIngreso: data.fechaIngreso || "",
        fechaSalida: data.fechaSalida || "",
        duracionContrato: data.duracionContrato || "",
        contractCost: data.contractCost || null,
        clientEmail: data.clientEmail || "",
        clientPhone: data.clientPhone || "",
      };
      form.reset(initialValues);
      setOriginalData(initialValues);
      setStep(1); // Reset to step 1 when opening
    }
  }, [open, offerToken, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: OfferEditValues) => {
      const response = await apiRequest("PATCH", `/api/external/offers/${offerToken.id}`, {
        offerData: values,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/offer-tokens"] });
      toast({
        title: language === "es" ? "Oferta actualizada" : "Offer updated",
        description: language === "es" ? "Los cambios se han guardado exitosamente" : "Changes have been saved successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo actualizar la oferta" : "Could not update offer"),
        variant: "destructive",
      });
    },
  });

  const handleNext = async () => {
    // Validate form before moving to review step
    const isValid = await form.trigger();
    if (isValid) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const onSubmit = (values: OfferEditValues) => {
    updateMutation.mutate(values);
  };

  const fieldLabels: Record<string, string> = {
    nombreCompleto: language === "es" ? "Nombre Completo" : "Full Name",
    nacionalidad: language === "es" ? "Nacionalidad" : "Nationality",
    edad: language === "es" ? "Edad" : "Age",
    tiempoResidenciaTulum: language === "es" ? "Tiempo en Tulum" : "Time in Tulum",
    trabajoPosicion: language === "es" ? "Posición" : "Position",
    companiaTrabaja: language === "es" ? "Compañía" : "Company",
    tieneMascotas: language === "es" ? "Tiene Mascotas" : "Has Pets",
    ingresoMensualPromedio: language === "es" ? "Ingreso Mensual" : "Monthly Income",
    numeroInquilinos: language === "es" ? "Número de Inquilinos" : "Number of Tenants",
    tieneGarante: language === "es" ? "Tiene Garante" : "Has Guarantor",
    usoInmueble: language === "es" ? "Uso del Inmueble" : "Property Use",
    rentaOfertada: language === "es" ? "Renta Ofertada" : "Offered Rent",
    rentasAdelantadas: language === "es" ? "Rentas Adelantadas" : "Advance Rents",
    fechaIngreso: language === "es" ? "Fecha de Ingreso" : "Move-in Date",
    fechaSalida: language === "es" ? "Fecha de Salida" : "Move-out Date",
    duracionContrato: language === "es" ? "Duración del Contrato" : "Contract Duration",
    contractCost: language === "es" ? "Costo del Contrato" : "Contract Cost",
    clientEmail: "Email",
    clientPhone: language === "es" ? "Teléfono" : "Phone",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "es" ? "Editar Oferta" : "Edit Offer"}
          </DialogTitle>
          <DialogDescription>
            {language === "es" 
              ? "Actualiza la información de la oferta según sea necesario"
              : "Update the offer information as needed"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Edit Form */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Summary Banner */}
                {offerToken?.offerData && (
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 flex-1">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{offerToken.offerData.nombreCompleto || (language === "es" ? "Sin nombre" : "No name")}</p>
                        <p className="text-xs text-muted-foreground">{offerToken.offerData.clientEmail || ""}</p>
                      </div>
                    </div>
                    {offerToken.offerData.rentaOfertada && (
                      <Badge variant="secondary" className="gap-1">
                        <DollarSign className="h-3 w-3" />
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(offerToken.offerData.rentaOfertada)}
                      </Badge>
                    )}
                  </div>
                )}

            {/* Personal Information Card */}
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">
                    {language === "es" ? "Información Personal" : "Personal Information"}
                  </CardTitle>
                </div>
                <CardDescription>
                  {language === "es" ? "Datos básicos del solicitante" : "Applicant basic information"}
                </CardDescription>
              </CardHeader>
              <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombreCompleto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nombre Completo" : "Full Name"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-nombre-completo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nacionalidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nacionalidad" : "Nationality"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-nacionalidad" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="edad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Edad" : "Age"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          data-testid="input-edad"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tiempoResidenciaTulum"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Tiempo en Tulum" : "Time in Tulum"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-tiempo-tulum" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Teléfono" : "Phone"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </CardContent>
            </Card>

            {/* Employment Information Card */}
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">
                    {language === "es" ? "Información Laboral" : "Employment Information"}
                  </CardTitle>
                </div>
                <CardDescription>
                  {language === "es" ? "Datos de empleo y capacidad económica" : "Employment and economic capacity"}
                </CardDescription>
              </CardHeader>
              <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="trabajoPosicion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Posición" : "Position"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-posicion" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companiaTrabaja"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Compañía" : "Company"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-compania" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ingresoMensualPromedio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Ingreso Mensual" : "Monthly Income"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-ingreso" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </CardContent>
            </Card>

            {/* Offer Details Card */}
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">
                    {language === "es" ? "Detalles de la Oferta" : "Offer Details"}
                  </CardTitle>
                </div>
                <CardDescription>
                  {language === "es" ? "Condiciones y términos de la oferta de renta" : "Rental offer terms and conditions"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              {/* Rental Terms */}
              <div>
                <p className="text-sm font-medium mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {language === "es" ? "Condiciones Económicas" : "Economic Terms"}
                </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="usoInmueble"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Uso del Inmueble" : "Property Usage"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-uso-inmueble">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vivienda">{language === "es" ? "Vivienda" : "Living"}</SelectItem>
                          <SelectItem value="subarrendamiento">{language === "es" ? "Subarrendamiento" : "Sublet"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rentaOfertada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Renta Ofertada (MXN)" : "Offered Rent (MXN)"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          data-testid="input-renta-ofertada"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rentasAdelantadas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Rentas Adelantadas" : "Advance Rents"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          data-testid="input-rentas-adelantadas"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duracionContrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Duración del Contrato" : "Contract Duration"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-duracion-contrato" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </div>

              <Separator />

              {/* Dates Section */}
              <div>
                <p className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {language === "es" ? "Fechas" : "Dates"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fechaIngreso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Fecha de Ingreso" : "Move-in Date"}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-fecha-ingreso" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fechaSalida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Fecha de Salida (Opcional)" : "Move-out Date (Optional)"}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-fecha-salida" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
              </div>

              <Separator />

              {/* Occupants Section */}
              <div>
                <p className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {language === "es" ? "Ocupantes y Condiciones" : "Occupants and Conditions"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numeroInquilinos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Número de Inquilinos" : "Number of Tenants"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          data-testid="input-numero-inquilinos"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tieneMascotas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "¿Tiene Mascotas?" : "Has Pets?"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tiene-mascotas">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Sí">{language === "es" ? "Sí" : "Yes"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tieneGarante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "¿Tiene Garante?" : "Has Guarantor?"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tiene-garante">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Sí">{language === "es" ? "Sí" : "Yes"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </div>
              </CardContent>
            </Card>
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
