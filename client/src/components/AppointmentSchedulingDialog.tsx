import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Property, type BusinessHours, type PresentationCard } from "@shared/schema";
import { Calendar, Clock, MapPin, Plus, X, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { format, addDays, startOfDay, isBefore, isAfter, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { logError, getErrorMessage } from "@/lib/errorHandling";

const formSchema = z.object({
  propertyId: z.string().min(1, "Propiedad es requerida"),
  date: z.date({ required_error: "Fecha es requerida" }),
  timeSlot: z.string().min(1, "Horario es requerido"),
  appointmentMode: z.enum(["individual", "tour"]),
  presentationCardId: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AppointmentSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
}

export function AppointmentSchedulingDialog({
  open,
  onOpenChange,
  property,
}: AppointmentSchedulingDialogProps) {
  const { toast } = useToast();
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([property]);
  const [showPropertySearch, setShowPropertySearch] = useState(false);
  const [step, setStep] = useState(1);

  // Fetch business hours
  const { data: businessHours } = useQuery<BusinessHours[]>({
    queryKey: ["/api/business-hours"],
    enabled: open,
  });

  // Fetch presentation cards
  const { data: presentationCards } = useQuery<PresentationCard[]>({
    queryKey: ["/api/presentation-cards"],
    enabled: open,
  });

  // Fetch available properties for tour (approved/published properties)
  const { data: availableProperties } = useQuery<Property[]>({
    queryKey: ["/api/properties", { status: "approved" }],
    enabled: open && showPropertySearch,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: property.id,
      appointmentMode: "individual",
      notes: "",
    },
  });

  const watchDate = form.watch("date");
  const watchMode = form.watch("appointmentMode");
  const watchTimeSlot = form.watch("timeSlot");

  // Reset step when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1);
      form.reset({
        propertyId: property.id,
        appointmentMode: "individual",
        notes: "",
      });
      setSelectedProperties([property]);
    }
  }, [open, property, form]);

  // Generate available time slots based on business hours
  const getAvailableTimeSlots = (selectedDate: Date) => {
    if (!selectedDate || !businessHours) return [];

    const dayOfWeek = selectedDate.getDay();
    const dayConfig = businessHours.find(h => h.dayOfWeek === dayOfWeek);

    if (!dayConfig || !dayConfig.isOpen) return [];

    const slots: string[] = [];
    const [openHour, openMinute] = dayConfig.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = dayConfig.closeTime.split(':').map(Number);

    let currentTime = setMinutes(setHours(selectedDate, openHour), openMinute);
    const endTime = setMinutes(setHours(selectedDate, closeHour), closeMinute);

    while (isBefore(currentTime, endTime)) {
      const nextHour = new Date(currentTime);
      nextHour.setHours(currentTime.getHours() + 1);
      
      // Only add slot if the end time doesn't exceed business hours close time
      if (isAfter(nextHour, endTime)) {
        break;
      }
      
      const slotStart = format(currentTime, 'HH:mm');
      const slotEnd = format(nextHour, 'HH:mm');
      slots.push(`${slotStart} - ${slotEnd}`);
      currentTime = nextHour;
    }

    return slots;
  };

  const timeSlots = watchDate ? getAvailableTimeSlots(watchDate) : [];

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const [startTime, endTime] = data.timeSlot.split(' - ');
      
      // For tour mode, create multiple appointments with same tourGroupId
      // Each property gets 30 minutes, staggered sequentially
      if (data.appointmentMode === "tour" && selectedProperties.length > 1) {
        // Validate tour fits within time slot
        const tourDurationMinutes = selectedProperties.length * 30;
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        const slotStart = new Date(data.date);
        slotStart.setHours(startHour, startMinute, 0, 0);
        
        const slotEnd = new Date(data.date);
        slotEnd.setHours(endHour, endMinute, 0, 0);
        
        const tourEnd = new Date(slotStart);
        tourEnd.setMinutes(slotStart.getMinutes() + tourDurationMinutes);
        
        // Check if tour exceeds slot end time
        if (isAfter(tourEnd, slotEnd)) {
          throw new Error(`El tour requiere ${tourDurationMinutes} minutos pero el slot solo tiene ${(slotEnd.getTime() - slotStart.getTime()) / 60000} minutos disponibles. Por favor selecciona un horario más temprano.`);
        }
        
        const tourGroupId = crypto.randomUUID();
        
        const tourAppointments = selectedProperties.map((prop, index) => {
          // Each property gets 30 minutes, starting from base time + (index * 30 minutes)
          const appointmentTime = new Date(slotStart);
          appointmentTime.setMinutes(slotStart.getMinutes() + (index * 30));
          
          return {
            propertyId: prop.id,
            date: appointmentTime,
            type: "in-person" as const,
            notes: data.notes,
            presentationCardId: data.presentationCardId && data.presentationCardId !== "none" 
              ? data.presentationCardId 
              : undefined,
            tourGroupId,
            tourOrder: index + 1,
          };
        });
        
        // Create all tour appointments
        const results = await Promise.all(
          tourAppointments.map(apt => apiRequest("POST", "/api/appointments", apt))
        );
        
        return results;
      } else {
        // Single appointment (individual mode or tour with only 1 property)
        const [hour, minute] = startTime.split(':').map(Number);
        const appointmentDate = new Date(data.date);
        appointmentDate.setHours(hour, minute, 0, 0);
        
        return await apiRequest("POST", "/api/appointments", {
          propertyId: data.propertyId,
          date: appointmentDate,
          type: "in-person" as const,
          notes: data.notes,
          presentationCardId: data.presentationCardId && data.presentationCardId !== "none" 
            ? data.presentationCardId 
            : undefined,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "¡Cita agendada!",
        description: "Tu cita ha sido confirmada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      logError("AppointmentSchedulingDialog.createAppointmentMutation", error);
      toast({
        title: "Error al agendar cita",
        description: getErrorMessage(error, "es"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createAppointmentMutation.mutate(data);
  };

  const addPropertyToTour = (prop: Property) => {
    if (!selectedProperties.find(p => p.id === prop.id)) {
      setSelectedProperties([...selectedProperties, prop]);
    }
  };

  const removePropertyFromTour = (propId: string) => {
    if (selectedProperties.length > 1) {
      setSelectedProperties(selectedProperties.filter(p => p.id !== propId));
    }
  };

  // Get days that are open based on business hours
  const getDisabledDays = () => {
    if (!businessHours) return [];
    
    const closedDays = businessHours
      .filter(h => !h.isOpen)
      .map(h => h.dayOfWeek);
    
    return (date: Date) => {
      return closedDays.includes(date.getDay());
    };
  };

  const canGoToStep2 = watchMode !== undefined;
  const canGoToStep3 = watchDate !== undefined;
  const canGoToStep4 = watchTimeSlot !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="dialog-appointment-scheduling">
        <DialogHeader>
          <DialogTitle className="text-2xl">Coordinar cita</DialogTitle>
          <DialogDescription>
            Sigue estos pasos para agendar tu visita
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  step >= s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground text-muted-foreground"
                )}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-1",
                    step > s ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          <Form {...form}>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
              }} 
              onKeyDown={(e) => {
                // Prevent form submission on Enter key, but allow Enter in textareas for multi-line input
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                  e.preventDefault();
                }
              }}
              className="space-y-6"
            >
              {/* Step 1: Tipo de visita */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in-0 duration-300">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Tipo de visita</h3>
                    <p className="text-sm text-muted-foreground">¿Qué tipo de visita deseas agendar?</p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="appointmentMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            <div>
                              <RadioGroupItem
                                value="individual"
                                id="individual"
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor="individual"
                                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-8 hover-elevate peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                                data-testid="radio-individual"
                              >
                                <Calendar className="mb-4 h-12 w-12 text-primary" />
                                <div className="text-center space-y-1">
                                  <div className="text-lg font-semibold">Visita Individual</div>
                                  <div className="text-sm text-muted-foreground">Visita una propiedad específica</div>
                                </div>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem
                                value="tour"
                                id="tour"
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor="tour"
                                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card p-8 hover-elevate peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                                data-testid="radio-tour"
                              >
                                <MapPin className="mb-4 h-12 w-12 text-primary" />
                                <div className="text-center space-y-1">
                                  <div className="text-lg font-semibold">Tour de Propiedades</div>
                                  <div className="text-sm text-muted-foreground">Visita múltiples propiedades</div>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tour Properties Selection */}
                  {watchMode === "tour" && (
                    <div className="space-y-4 animate-in fade-in-0 duration-300">
                      <div>
                        <Label className="text-base">Propiedades del tour ({selectedProperties.length})</Label>
                        <p className="text-sm text-muted-foreground mt-1">Selecciona las propiedades que deseas visitar</p>
                      </div>
                      <div className="space-y-2">
                        {selectedProperties.map((prop) => (
                          <Card key={prop.id} data-testid={`tour-property-${prop.id}`}>
                            <CardContent className="flex items-center justify-between p-4">
                              <div className="flex-1">
                                <div className="font-medium">{prop.title}</div>
                                <div className="text-sm text-muted-foreground">{prop.location}</div>
                              </div>
                              {selectedProperties.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removePropertyFromTour(prop.id)}
                                  data-testid={`button-remove-property-${prop.id}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowPropertySearch(!showPropertySearch)}
                        data-testid="button-add-property-tour"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar propiedad al tour
                      </Button>

                      {showPropertySearch && availableProperties && (
                        <Card className="border-primary/20">
                          <CardContent className="p-4 max-h-60 overflow-y-auto space-y-2">
                            {availableProperties
                              .filter(p => !selectedProperties.find(sp => sp.id === p.id))
                              .map((prop) => (
                                <button
                                  key={prop.id}
                                  type="button"
                                  onClick={() => {
                                    addPropertyToTour(prop);
                                    setShowPropertySearch(false);
                                  }}
                                  className="w-full text-left p-3 rounded-lg hover-elevate border"
                                  data-testid={`button-add-${prop.id}`}
                                >
                                  <div className="font-medium">{prop.title}</div>
                                  <div className="text-sm text-muted-foreground">{prop.location}</div>
                                </button>
                              ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Presentation Card Selection */}
                  {presentationCards && presentationCards.length > 0 && (
                    <FormField
                      control={form.control}
                      name="presentationCardId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tarjeta de presentación (opcional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-presentation-card">
                                <SelectValue placeholder="Selecciona una tarjeta" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin tarjeta</SelectItem>
                              {presentationCards.map((card) => (
                                <SelectItem key={card.id} value={card.id}>
                                  {card.name || `${card.propertyType} - ${card.location}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {/* Step 2: Fecha */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in-0 duration-300">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Selecciona una fecha</h3>
                    <p className="text-sm text-muted-foreground">Elige el día que prefieres para tu visita</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <div className="flex justify-center">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={getDisabledDays()}
                            initialFocus
                            fromDate={startOfDay(new Date())}
                            className="rounded-md border"
                          />
                        </div>
                        {field.value && (
                          <div className="text-center mt-4">
                            <Badge variant="secondary" className="text-base px-4 py-2">
                              <Calendar className="w-4 h-4 mr-2" />
                              {format(field.value, "PPPP", { locale: es })}
                            </Badge>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: Horario */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in-0 duration-300">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Selecciona un horario</h3>
                    <p className="text-sm text-muted-foreground">Elige la hora que mejor te convenga</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="timeSlot"
                    render={({ field }) => (
                      <FormItem>
                        {timeSlots.length === 0 ? (
                          <Card className="border-destructive/50 bg-destructive/5">
                            <CardContent className="p-6 text-center">
                              <Clock className="w-12 h-12 mx-auto mb-3 text-destructive" />
                              <p className="font-medium text-destructive">No hay horarios disponibles</p>
                              <p className="text-sm text-muted-foreground mt-1">Por favor selecciona otra fecha</p>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {timeSlots.map((slot) => {
                              const isSelected = field.value === slot;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => field.onChange(slot)}
                                  className={cn(
                                    "p-4 rounded-lg border-2 transition-all hover-elevate text-center",
                                    isSelected
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-muted hover:border-primary/50"
                                  )}
                                  data-testid={`button-slot-${slot.replace(/\s/g, '-')}`}
                                >
                                  <Clock className={cn("w-5 h-5 mx-auto mb-2", isSelected ? "text-primary-foreground" : "text-primary")} />
                                  <div className="font-medium">{slot}</div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 4: Confirmación */}
              {step === 4 && (
                <div className="space-y-6 animate-in fade-in-0 duration-300">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Confirmar detalles</h3>
                    <p className="text-sm text-muted-foreground">Revisa la información de tu cita</p>
                  </div>

                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {watchMode === "individual" ? (
                            <Calendar className="w-5 h-5 text-primary" />
                          ) : (
                            <MapPin className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {watchMode === "individual" ? "Visita Individual" : `Tour de ${selectedProperties.length} propiedades`}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {watchMode === "individual" 
                              ? property.title 
                              : selectedProperties.map(p => p.title).join(", ")}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Fecha</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {watchDate && format(watchDate, "PPPP", { locale: es })}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Horario</div>
                          <div className="text-sm text-muted-foreground mt-1">{watchTimeSlot}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas adicionales (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Agrega cualquier información adicional..."
                            className="resize-none"
                            rows={4}
                            {...field}
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(Math.max(1, step - 1))}
                  disabled={step === 1}
                  data-testid="button-back"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>

                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    disabled={
                      (step === 1 && !canGoToStep2) ||
                      (step === 2 && !canGoToStep3) ||
                      (step === 3 && !canGoToStep4)
                    }
                    data-testid="button-next"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => form.handleSubmit(onSubmit)()}
                    disabled={createAppointmentMutation.isPending}
                    data-testid="button-confirm"
                  >
                    {createAppointmentMutation.isPending ? "Confirmando..." : "Confirmar cita"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
