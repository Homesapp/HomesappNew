import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, FileText } from "lucide-react";
import { logError, getErrorMessage } from "@/lib/errorHandling";

const makeOfferSchema = z.object({
  offerAmount: z.string().min(1, "El monto es requerido"),
  notes: z.string().optional(),
});

type MakeOfferFormData = z.infer<typeof makeOfferSchema>;

interface MakeOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sorId: string;
  propertyPrice: string;
  propertyTitle: string;
}

export function MakeOfferDialog({
  open,
  onOpenChange,
  sorId,
  propertyPrice,
  propertyTitle,
}: MakeOfferDialogProps) {
  const { toast } = useToast();

  const form = useForm<MakeOfferFormData>({
    resolver: zodResolver(makeOfferSchema),
    defaultValues: {
      offerAmount: propertyPrice,
      notes: "",
    },
  });

  const makeOfferMutation = useMutation({
    mutationFn: async (data: MakeOfferFormData) => {
      return await apiRequest("POST", `/api/rental-opportunity-requests/${sorId}/submit-offer`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-rental-opportunities"], exact: false });
      
      toast({
        title: "¡Oferta enviada!",
        description: "Tu oferta ha sido enviada exitosamente. El propietario la revisará pronto.",
      });
      
      onOpenChange(false);
      form.reset();
    },
    onError: (error: unknown) => {
      logError("MakeOfferDialog.makeOfferMutation", error);
      toast({
        title: "Error al enviar oferta",
        description: getErrorMessage(error, "es"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MakeOfferFormData) => {
    makeOfferMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hacer Oferta</DialogTitle>
          <DialogDescription>
            Envía tu oferta para {propertyTitle}. Precio publicado: ${parseFloat(propertyPrice).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="offerAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto de la Oferta (MXN)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-9"
                        placeholder="0.00"
                        data-testid="input-offer-amount"
                      />
                    </div>
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
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        {...field}
                        className="pl-9 min-h-[100px]"
                        placeholder="Incluye cualquier comentario o condición de tu oferta..."
                        data-testid="textarea-offer-notes"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-offer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={makeOfferMutation.isPending}
                data-testid="button-submit-offer"
              >
                {makeOfferMutation.isPending ? "Enviando..." : "Enviar Oferta"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
