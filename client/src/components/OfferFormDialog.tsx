import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOfferSchema, type InsertOffer } from "@shared/schema";
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
import { useCreateOffer } from "@/hooks/useOffers";
import { useProperties } from "@/hooks/useProperties";
import { useAppointments } from "@/hooks/useAppointments";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface OfferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfferFormDialog({
  open,
  onOpenChange,
}: OfferFormDialogProps) {
  const { user } = useAuth();
  const createMutation = useCreateOffer();
  const { data: properties, isLoading: loadingProperties } = useProperties({ active: true });
  const { data: appointments, isLoading: loadingAppointments } = useAppointments();

  const form = useForm<InsertOffer>({
    resolver: zodResolver(insertOfferSchema),
    defaultValues: {
      propertyId: "",
      clientId: user?.id || "",
      appointmentId: undefined,
      offerAmount: "0",
      status: "pending",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        propertyId: "",
        clientId: user?.id || "",
        appointmentId: undefined,
        offerAmount: "0",
        status: "pending",
        notes: "",
      });
    }
  }, [open, form, user]);

  const onSubmit = async (data: InsertOffer) => {
    try {
      const submitData = {
        ...data,
        clientId: user?.id || data.clientId,
        appointmentId: data.appointmentId || undefined,
      };

      await createMutation.mutateAsync(submitData);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isPending = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-offer-form">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">Nueva Oferta</DialogTitle>
          <DialogDescription>
            Realiza una oferta para una propiedad
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

            <FormField
              control={form.control}
              name="appointmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cita Relacionada (Opcional)</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} value={field.value || "none"} disabled={loadingAppointments}>
                    <FormControl>
                      <SelectTrigger data-testid="select-appointment">
                        <SelectValue placeholder="Seleccionar cita" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin cita relacionada</SelectItem>
                      {appointments?.map((appointment) => {
                        const property = properties?.find(p => p.id === appointment.propertyId);
                        return (
                          <SelectItem key={appointment.id} value={appointment.id}>
                            {property?.title || "Propiedad"} - {format(new Date(appointment.date), "dd/MM/yyyy")}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="offerAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto de la Oferta</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="150000"
                      data-testid="input-offer-amount"
                      {...field}
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
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Información adicional sobre la oferta..."
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
                Crear Oferta
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
