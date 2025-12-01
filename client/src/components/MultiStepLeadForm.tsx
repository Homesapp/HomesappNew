import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertLeadSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  X,
  Mail,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ButtonMultiSelect from "./ButtonMultiSelect";
import { getPropertyTitle } from "@/lib/propertyHelpers";

const leadFormSchema = insertLeadSchema.extend({
  firstName: z.string().min(1, "Nombre es requerido"),
  lastName: z.string().min(1, "Apellido es requerido"),
  phone: z.string().min(10, "Teléfono debe tener al menos 10 dígitos"),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface MultiStepLeadFormProps {
  onSubmit: (data: LeadFormData) => void;
  isPending: boolean;
  defaultValues?: Partial<LeadFormData>;
}

const STEPS = [
  { id: 1, title: "Información Básica", description: "Datos de contacto" },
  { id: 2, title: "Preferencias", description: "Búsqueda de propiedad" },
  { id: 3, title: "Detalles", description: "Información adicional" },
];

const sourceOptions = ["Web", "Referido", "Llamada", "Evento", "Redes Sociales", "WhatsApp", "Tokko Broker", "EasyBroker"];
const contractDurationOptions = ["6 meses", "1 año", "2 años", "3+ años"];
const moveInDateOptions = ["Inmediato", "Próximo mes", "En 2-3 meses", "Más de 3 meses"];
const bedroomsOptions = ["Studio", "1", "2", "3", "4+"];
const zoneOptions = ["Veleta", "Aldea Zama", "Centro", "Región 15", "Región 8", "Playa"];
const unitTypeOptions = ["Departamento", "Casa", "Estudio", "PH", "Villa"];

export default function MultiStepLeadForm({ onSubmit, isPending, defaultValues }: MultiStepLeadFormProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      budget: "",
      source: [],
      contractDuration: [],
      moveInDate: [],
      bedrooms: [],
      zoneOfInterest: [],
      unitType: [],
      propertyInterests: [],
      notes: "",
      ...defaultValues,
    },
  });

  // Validación de duplicados
  const phone = form.watch("phone");
  const { data: duplicateCheck } = useQuery<{
    isDuplicate: boolean;
    expirationDays?: number;
    isExpired?: boolean;
    lead?: {
      firstName: string;
      lastName: string;
      email?: string;
      budget?: number;
      createdAt: string;
      seller?: {
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  }>({
    queryKey: ["/api/leads/validate-phone", phone],
    enabled: phone?.length >= 10,
  });

  const isDuplicate = duplicateCheck?.isDuplicate;

  // Propiedades para selector (usar search endpoint que incluye relaciones)
  const { data: properties = [] } = useQuery<any[]>({
    queryKey: ["/api/properties/search"],
  });

  const handleNext = async () => {
    // Validate required fields for current step
    if (currentStep === 1) {
      const fieldsToValidate: (keyof LeadFormData)[] = ["firstName", "lastName", "phone", "budget"];
      
      // Trigger validation
      const isValid = await form.trigger(fieldsToValidate);
      
      // Check if values are actually filled
      const values = form.getValues();
      const hasRequiredValues = 
        values.firstName?.trim() && 
        values.lastName?.trim() && 
        values.phone?.trim() && 
        values.phone.length >= 10 &&
        values.budget?.trim();
      
      if (!isValid || !hasRequiredValues || isDuplicate) {
        // Don't advance - validation will show errors
        return;
      }
    }
    
    // Advance to next step
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (data: LeadFormData) => {
    // Solo permitir submit si estamos en el último paso
    if (currentStep !== STEPS.length) {
      return;
    }
    
    // Auto-formateo
    const formattedData = {
      ...data,
      firstName: data.firstName.charAt(0).toUpperCase() + data.firstName.slice(1).toLowerCase(),
      lastName: data.lastName.charAt(0).toUpperCase() + data.lastName.slice(1).toLowerCase(),
      email: data.email?.toLowerCase() || undefined,
    };
    onSubmit(formattedData);
  };

  const handleContactSeller = () => {
    if (duplicateCheck?.lead?.seller?.email) {
      window.location.href = `mailto:${duplicateCheck.lead.seller.email}?subject=Consulta sobre lead: ${duplicateCheck.lead.firstName} ${duplicateCheck.lead.lastName}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between">
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
              <div className="text-xs mb-1">{step.description}</div>
              <div className="text-sm">{step.title}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex-1 h-1 rounded-full transition-all ${
                step.id <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <Form {...form}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Never submit via form - only via explicit button click on step 3
          }}
          className="space-y-4"
        >
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Juan" 
                        data-testid="input-firstname"
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      />
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
                      <Input 
                        {...field} 
                        placeholder="Pérez" 
                        data-testid="input-lastname"
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      />
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
                      <Input 
                        {...field} 
                        value={field.value || ""} 
                        type="email" 
                        placeholder="juan@ejemplo.com" 
                        data-testid="input-email"
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      />
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
                    <FormLabel>Teléfono con Lada *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="+52 984 123 4567" 
                        data-testid="input-phone"
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duplicate Lead Modal */}
              <Dialog open={isDuplicate && !!duplicateCheck?.lead} onOpenChange={() => {}}>
                <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <DialogTitle className="text-red-600 dark:text-red-400">
                          Lead Ya Registrado
                        </DialogTitle>
                        <DialogDescription>
                          Este cliente ya está en el sistema
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  
                  {duplicateCheck?.lead && (
                    <div className="space-y-4 py-4">
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Cliente</span>
                            <p className="font-semibold">{duplicateCheck.lead.firstName} {duplicateCheck.lead.lastName}</p>
                          </div>
                          {duplicateCheck.lead.email && (
                            <div>
                              <span className="text-muted-foreground text-xs">Email</span>
                              <p className="font-medium">{duplicateCheck.lead.email}</p>
                            </div>
                          )}
                          {duplicateCheck.lead.budget && (
                            <div>
                              <span className="text-muted-foreground text-xs">Presupuesto</span>
                              <p className="font-medium text-green-600">${duplicateCheck.lead.budget.toLocaleString()}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground text-xs">Registrado</span>
                            <p className="font-medium">{new Date(duplicateCheck.lead.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {duplicateCheck.lead.seller && (
                          <div className="pt-3 border-t border-red-200 dark:border-red-800">
                            <span className="text-muted-foreground text-xs">Vendedor Asignado</span>
                            <p className="font-semibold">{duplicateCheck.lead.seller.firstName} {duplicateCheck.lead.seller.lastName}</p>
                          </div>
                        )}
                        {duplicateCheck.expirationDays !== undefined && (
                          <div className="pt-2">
                            <Badge variant={duplicateCheck.expirationDays <= 7 ? "destructive" : "secondary"}>
                              {duplicateCheck.expirationDays > 0 
                                ? `Expira en ${duplicateCheck.expirationDays} días`
                                : "Lead expirado - puede ser registrado nuevamente"}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground text-center">
                        Por favor contacta al vendedor asignado para más información sobre este cliente.
                      </p>
                    </div>
                  )}
                  
                  <DialogFooter className="gap-2">
                    {duplicateCheck?.lead?.seller?.email && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleContactSeller}
                        data-testid="button-contact-seller-modal"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Contactar a {duplicateCheck.lead.seller.firstName}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => form.setValue("phone", "")}
                      data-testid="button-change-phone"
                    >
                      Usar otro teléfono
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presupuesto *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text" 
                        placeholder="50000" 
                        data-testid="input-budget"
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: Search Preferences */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="zoneOfInterest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona de Interés</FormLabel>
                    <FormControl>
                      <ButtonMultiSelect
                        options={zoneOptions}
                        value={field.value || []}
                        onChange={field.onChange}
                        data-testid="select-zone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Unidad</FormLabel>
                    <FormControl>
                      <ButtonMultiSelect
                        options={unitTypeOptions}
                        value={field.value || []}
                        onChange={field.onChange}
                        data-testid="select-unit-type"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recámaras</FormLabel>
                    <FormControl>
                      <ButtonMultiSelect
                        options={bedroomsOptions}
                        value={field.value || []}
                        onChange={field.onChange}
                        data-testid="select-bedrooms"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Propiedades de Interés</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      data-testid="button-select-properties"
                    >
                      {(form.watch("propertyInterests")?.length ?? 0) > 0
                        ? `${form.watch("propertyInterests")?.length} propiedad${(form.watch("propertyInterests")?.length ?? 0) > 1 ? 'es' : ''} seleccionada${(form.watch("propertyInterests")?.length ?? 0) > 1 ? 's' : ''}`
                        : "Seleccionar propiedades..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar propiedad..." />
                      <CommandEmpty>No se encontraron propiedades.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {properties.map((property: any) => (
                          <CommandItem
                            key={property.id}
                            onSelect={() => {
                              if (!property?.id) return;
                              const currentValues = form.getValues("propertyInterests") || [];
                              const isSelected = currentValues.includes(property.id);
                              form.setValue(
                                "propertyInterests",
                                isSelected
                                  ? currentValues.filter((id: string) => id !== property.id)
                                  : [...currentValues, property.id]
                              );
                            }}
                            data-testid={`property-option-${property.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`h-4 w-4 rounded border ${(form.watch("propertyInterests") || []).includes(property?.id || "") ? 'bg-primary border-primary' : 'border-input'}`}>
                                {(form.watch("propertyInterests") || []).includes(property?.id || "") && (
                                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                                )}
                              </div>
                              <span>{getPropertyTitle(property)}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {((form.watch("propertyInterests")?.length ?? 0) > 0) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.watch("propertyInterests")?.map((propId: string) => {
                      const property = properties.find((p: any) => p.id === propId);
                      return (
                        <Badge 
                          key={propId} 
                          variant="secondary" 
                          className="text-xs gap-1"
                          data-testid={`badge-property-${propId}`}
                        >
                          {property ? getPropertyTitle(property) : propId}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => {
                              const currentValues = form.getValues("propertyInterests") || [];
                              form.setValue("propertyInterests", currentValues.filter((id: string) => id !== propId));
                            }}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Additional Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuente</FormLabel>
                    <FormControl>
                      <ButtonMultiSelect
                        options={sourceOptions}
                        value={field.value || []}
                        onChange={field.onChange}
                        data-testid="select-source"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración de Contrato</FormLabel>
                    <FormControl>
                      <ButtonMultiSelect
                        options={contractDurationOptions}
                        value={field.value || []}
                        onChange={field.onChange}
                        data-testid="select-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moveInDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Ingreso</FormLabel>
                    <FormControl>
                      <ButtonMultiSelect
                        options={moveInDateOptions}
                        value={field.value || []}
                        onChange={field.onChange}
                        data-testid="select-move-in"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Información adicional..."
                        data-testid="input-notes"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              data-testid="button-previous"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isDuplicate}
                data-testid="button-next"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => form.handleSubmit(handleSubmit)()}
                disabled={isPending || isDuplicate}
                data-testid="button-submit-lead"
              >
                {isPending ? "Guardando..." : "Crear Lead"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
