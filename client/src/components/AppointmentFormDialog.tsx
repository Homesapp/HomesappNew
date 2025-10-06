import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAppointmentSchema, type InsertAppointment, type Appointment } from "@shared/schema";
import { format } from "date-fns";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useCreateAppointment, useUpdateAppointment } from "@/hooks/useAppointments";
import { useProperties } from "@/hooks/useProperties";
import { useUsersByRole } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Loader2, Link as LinkIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment;
  mode: "create" | "edit";
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  mode,
}: AppointmentFormDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const { data: properties, isLoading: loadingProperties } = useProperties({ active: true });
  const { data: concierges } = useUsersByRole("concierge");
  
  const [time, setTime] = useState("10:00");
  const [appointmentMode, setAppointmentMode] = useState<"individual" | "tour">("individual");
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  const form = useForm<InsertAppointment>({
    resolver: zodResolver(insertAppointmentSchema),
    defaultValues: {
      propertyId: "",
      clientId: user?.id || "",
      conciergeId: undefined,
      date: new Date(),
      type: "in-person",
      mode: "individual",
      status: "pending",
      notes: "",
      meetLink: undefined,
      googleEventId: undefined,
    },
  });

  useEffect(() => {
    if (appointment && mode === "edit") {
      const appointmentDate = new Date(appointment.date);
      form.reset({
        propertyId: appointment.propertyId,
        clientId: appointment.clientId,
        conciergeId: appointment.conciergeId || undefined,
        date: appointmentDate,
        type: appointment.type,
        mode: appointment.mode || "individual",
        status: appointment.status,
        notes: appointment.notes || "",
        meetLink: appointment.meetLink || undefined,
        googleEventId: appointment.googleEventId || undefined,
      });
      setAppointmentMode(appointment.mode || "individual");
      setSelectedProperties([appointment.propertyId]);
      setTime(format(appointmentDate, "HH:mm"));
    } else if (mode === "create") {
      form.reset({
        propertyId: "",
        clientId: user?.id || "",
        conciergeId: undefined,
        date: new Date(),
        type: "in-person",
        mode: "individual",
        status: "pending",
        notes: "",
        meetLink: undefined,
        googleEventId: undefined,
      });
      setAppointmentMode("individual");
      setSelectedProperties([]);
      setTime("10:00");
    }
  }, [appointment, mode, form, user]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar selección de propiedades según el modo
    if (appointmentMode === "individual" && selectedProperties.length !== 1) {
      toast({
        title: "Error de validación",
        description: "Debes seleccionar exactamente una propiedad para cita individual",
        variant: "destructive",
      });
      return;
    }

    if (appointmentMode === "tour") {
      if (selectedProperties.length === 0) {
        toast({
          title: "Error de validación",
          description: "Debes seleccionar al menos una propiedad para el tour",
          variant: "destructive",
        });
        return;
      }
      if (selectedProperties.length > 4) {
        toast({
          title: "Error de validación",
          description: "Máximo 4 propiedades por tour",
          variant: "destructive",
        });
        return;
      }
      // Establecer propertyId para pasar la validación del schema (usaremos la primera propiedad)
      form.setValue("propertyId", selectedProperties[0]);
    }
    
    // Ejecutar la validación y submit del form
    await form.handleSubmit(onSubmit)();
  };

  const onSubmit = async (data: InsertAppointment) => {
    try {

      const [hours, minutes] = time.split(":").map(Number);
      const appointmentDate = new Date(data.date);
      appointmentDate.setHours(hours, minutes, 0, 0);

      if (mode === "edit" && appointment) {
        // Edit mode: solo actualizar la cita existente
        const appointmentData = {
          ...data,
          propertyId: selectedProperties[0],
          date: appointmentDate,
          mode: appointmentMode,
          clientId: user?.id || data.clientId,
        };
        
        await updateMutation.mutateAsync({ id: appointment.id, data: appointmentData });
        toast({
          title: "Cita actualizada",
          description: "La cita ha sido actualizada exitosamente",
        });
      } else {
        // Create mode: crear una o múltiples citas según el modo
        if (appointmentMode === "individual") {
          // Crear una sola cita
          const appointmentData = {
            ...data,
            propertyId: selectedProperties[0],
            date: appointmentDate,
            mode: "individual" as const,
            clientId: user?.id || data.clientId,
          };
          
          const result = await createMutation.mutateAsync(appointmentData);
          
          if (result.meetLink && data.type === "video") {
            toast({
              title: "Cita creada con videollamada",
              description: (
                <div className="space-y-2">
                  <p>La cita ha sido creada exitosamente</p>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <LinkIcon className="h-4 w-4" />
                    <a 
                      href={result.meetLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {result.meetLink}
                    </a>
                  </div>
                </div>
              ),
            });
          } else {
            toast({
              title: "Cita creada",
              description: "La cita ha sido creada exitosamente",
            });
          }
        } else {
          // Crear tour: múltiples citas con el mismo tourGroupId
          const tourGroupId = nanoid();
          let currentTime = new Date(appointmentDate);
          
          for (let i = 0; i < selectedProperties.length; i++) {
            const appointmentData = {
              ...data,
              propertyId: selectedProperties[i],
              date: new Date(currentTime),
              mode: "tour" as const,
              tourGroupId,
              clientId: user?.id || data.clientId,
            };
            
            await createMutation.mutateAsync(appointmentData);
            // Añadir 30 minutos para la siguiente propiedad
            currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
          }
          
          const totalMinutes = selectedProperties.length * 30;
          toast({
            title: "Tour creado",
            description: `Se han creado ${selectedProperties.length} citas para el tour (${totalMinutes} minutos total)`,
          });
        }
      }
      
      onOpenChange(false);
      form.reset();
      setSelectedProperties([]);
      setAppointmentMode("individual");
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la cita",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-appointment-form">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {mode === "create" ? "Nueva Cita" : "Editar Cita"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Agenda una nueva cita para ver la propiedad"
              : "Actualiza los detalles de la cita"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Selector de modo de cita - solo en create mode */}
            {mode === "create" && (
              <FormItem className="space-y-3">
                <FormLabel>Modo de Cita *</FormLabel>
                <RadioGroup
                  onValueChange={(value) => {
                    setAppointmentMode(value as "individual" | "tour");
                    setSelectedProperties([]);
                    form.setValue("mode", value as "individual" | "tour");
                    form.setValue("propertyId", "");
                  }}
                  value={appointmentMode}
                  className="flex gap-4"
                  data-testid="radio-appointment-mode"
                >
                  <div className="flex items-center space-x-2 space-y-0">
                    <RadioGroupItem value="individual" data-testid="radio-mode-individual" />
                    <label className="font-normal cursor-pointer">
                      Individual (1 hora)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 space-y-0">
                    <RadioGroupItem value="tour" data-testid="radio-mode-tour" />
                    <label className="font-normal cursor-pointer">
                      Tour (30 min por propiedad)
                    </label>
                  </div>
                </RadioGroup>
              </FormItem>
            )}

            {/* Selector de propiedades */}
            {appointmentMode === "individual" ? (
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Propiedad *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedProperties([value]);
                      }} 
                      value={selectedProperties[0] || ""} 
                      disabled={loadingProperties}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-property">
                          <SelectValue placeholder="Seleccionar propiedad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties?.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.title} - {property.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormItem>
                <FormLabel>Propiedades del Tour * (Máximo 4)</FormLabel>
                <div className="space-y-2">
                  {selectedProperties.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                      {selectedProperties.map((propId, index) => {
                        const property = properties?.find(p => p.id === propId);
                        return (
                          <Badge key={propId} variant="secondary" className="gap-2" data-testid={`badge-tour-property-${index}`}>
                            {index + 1}. {property?.title}
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-destructive"
                              onClick={() => setSelectedProperties(prev => prev.filter(id => id !== propId))}
                              data-testid={`button-remove-property-${index}`}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <Select 
                    onValueChange={(value) => {
                      if (!selectedProperties.includes(value) && selectedProperties.length < 4) {
                        setSelectedProperties(prev => [...prev, value]);
                      }
                    }}
                    value=""
                    disabled={loadingProperties || selectedProperties.length >= 4}
                  >
                    <SelectTrigger data-testid="select-tour-properties">
                      <SelectValue placeholder={
                        selectedProperties.length >= 4 
                          ? "Máximo 4 propiedades alcanzado"
                          : `Agregar propiedad (${selectedProperties.length}/4)`
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {properties?.filter(p => !selectedProperties.includes(p.id)).map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title} - {property.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProperties.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Duración total del tour: {selectedProperties.length * 30} minutos
                    </p>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-date-picker"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Hora *</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    data-testid="input-time"
                  />
                </FormControl>
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Cita *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                      data-testid="radio-appointment-type"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="in-person" data-testid="radio-in-person" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Presencial
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="video" data-testid="radio-video" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Videollamada
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conciergeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concierge (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger data-testid="select-concierge">
                        <SelectValue placeholder="Seleccionar concierge" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {concierges?.map((concierge) => (
                        <SelectItem key={concierge.id} value={concierge.id}>
                          {concierge.firstName} {concierge.lastName}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Añade cualquier comentario o nota adicional..."
                      data-testid="input-notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === "create" ? "Crear Cita" : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
