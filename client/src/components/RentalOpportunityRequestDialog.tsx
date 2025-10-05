import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertRentalOpportunityRequestSchema, type Property } from "@shared/schema";

const formSchema = insertRentalOpportunityRequestSchema.extend({
  desiredMoveInDate: z.string().optional(),
  preferredContactMethod: z.enum(["email", "phone", "whatsapp"]).default("email"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RentalOpportunityRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
}

export function RentalOpportunityRequestDialog({
  open,
  onOpenChange,
  property,
}: RentalOpportunityRequestDialogProps) {
  const { toast } = useToast();

  // Verificar si ya existe una SOR activa para esta propiedad
  const { data: existingSOR } = useQuery({
    queryKey: ["/api/rental-opportunity-requests/by-property", property.id],
    enabled: open,
  });

  // Verificar el conteo de SORs activas
  const { data: activeCount } = useQuery<{ count: number }>({
    queryKey: ["/api/rental-opportunity-requests/active-count"],
    enabled: open,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: property.id,
      preferredContactMethod: "email",
      notes: "",
    },
  });

  const createSORMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const submitData = {
        ...data,
        desiredMoveInDate: data.desiredMoveInDate || null,
      };
      return await apiRequest("POST", "/api/rental-opportunity-requests", submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-opportunity-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rental-opportunity-requests/active-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rental-opportunity-requests/by-property", property.id] });
      toast({
        title: "¡Solicitud enviada!",
        description: "Tu solicitud de oportunidad de renta ha sido enviada exitosamente.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error al enviar solicitud",
        description: error.message || "Ocurrió un error al procesar tu solicitud",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createSORMutation.mutate(data);
  };

  // Verificar si ya se alcanzó el límite
  const hasReachedLimit = activeCount && activeCount.count >= 3;
  const hasExistingSOR = existingSOR !== null && existingSOR !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar Oportunidad de Renta</DialogTitle>
          <DialogDescription>
            {property.title} - {property.location}
          </DialogDescription>
        </DialogHeader>

        {hasExistingSOR ? (
          <div className="py-6">
            <p className="text-muted-foreground text-center">
              Ya tienes una solicitud activa para esta propiedad.
            </p>
          </div>
        ) : hasReachedLimit ? (
          <div className="py-6">
            <p className="text-muted-foreground text-center">
              Has alcanzado el límite de 3 solicitudes activas. Espera a que se procesen antes de crear una nueva.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="desiredMoveInDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha deseada de mudanza (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-move-in-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredContactMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de contacto preferido</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-contact-method">
                          <SelectValue placeholder="Selecciona un método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Teléfono</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
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
                    <FormLabel>Notas adicionales (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Cuéntanos más sobre tus necesidades..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createSORMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-sor"
                >
                  {createSORMutation.isPending ? "Enviando..." : "Enviar solicitud"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
