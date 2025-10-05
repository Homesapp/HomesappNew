import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAppointmentSchema, type InsertAppointment, type Appointment } from "@shared/schema";
import { format } from "date-fns";
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
import { useCreateAppointment, useUpdateAppointment } from "@/hooks/useAppointments";
import { useProperties } from "@/hooks/useProperties";
import { useUsersByRole } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Loader2, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const form = useForm<InsertAppointment>({
    resolver: zodResolver(insertAppointmentSchema),
    defaultValues: {
      propertyId: "",
      clientId: user?.id || "",
      conciergeId: undefined,
      date: new Date(),
      type: "in-person",
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
        status: appointment.status,
        notes: appointment.notes || "",
        meetLink: appointment.meetLink || undefined,
        googleEventId: appointment.googleEventId || undefined,
      });
      setTime(format(appointmentDate, "HH:mm"));
    } else if (mode === "create") {
      form.reset({
        propertyId: "",
        clientId: user?.id || "",
        conciergeId: undefined,
        date: new Date(),
        type: "in-person",
        status: "pending",
        notes: "",
        meetLink: undefined,
        googleEventId: undefined,
      });
      setTime("10:00");
    }
  }, [appointment, mode, form, user]);

  const onSubmit = async (data: InsertAppointment) => {
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const appointmentDate = new Date(data.date);
      appointmentDate.setHours(hours, minutes, 0, 0);

      const appointmentData = {
        ...data,
        date: appointmentDate,
        clientId: user?.id || data.clientId,
      };

      if (mode === "edit" && appointment) {
        await updateMutation.mutateAsync({ id: appointment.id, data: appointmentData });
        toast({
          title: "Cita actualizada",
          description: "La cita ha sido actualizada exitosamente",
        });
      } else {
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
      }
      
      onOpenChange(false);
      form.reset();
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propiedad *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={loadingProperties}>
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
                  <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} value={field.value || "none"}>
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
