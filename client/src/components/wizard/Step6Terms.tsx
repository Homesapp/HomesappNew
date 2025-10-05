import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight } from "lucide-react";

const termsSchema = z.object({
  leaseDuration: z.string().optional(),
  securityDeposit: z.string().optional(),
  maintenanceIncluded: z.string().optional(),
  additionalTerms: z.string().optional(),
});

type TermsForm = z.infer<typeof termsSchema>;

type Step6Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
};

export default function Step6Terms({ data, onUpdate, onNext, onPrevious }: Step6Props) {
  const form = useForm<TermsForm>({
    resolver: zodResolver(termsSchema),
    defaultValues: {
      leaseDuration: data.commercialTerms?.leaseDuration || "",
      securityDeposit: data.commercialTerms?.securityDeposit || "",
      maintenanceIncluded: data.commercialTerms?.maintenanceIncluded || "",
      additionalTerms: data.commercialTerms?.additionalTerms || "",
    },
  });

  const onSubmit = (formData: TermsForm) => {
    onUpdate({ commercialTerms: formData });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step6-title">
          Términos Comerciales
        </h2>
        <p className="text-muted-foreground" data-testid="text-step6-description">
          Define los términos y condiciones de la operación
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {data.isForRent && (
            <>
              <FormField
                control={form.control}
                name="leaseDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración del Contrato (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: 12 meses"
                        {...field}
                        data-testid="input-lease-duration"
                      />
                    </FormControl>
                    <FormDescription data-testid="text-lease-description">
                      Duración mínima o sugerida del contrato de renta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="securityDeposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depósito de Garantía (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: 1 mes de renta"
                        {...field}
                        data-testid="input-security-deposit"
                      />
                    </FormControl>
                    <FormDescription data-testid="text-deposit-description">
                      Monto del depósito requerido
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maintenanceIncluded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mantenimiento Incluido (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Agua, Gas, Mantenimiento de áreas comunes"
                        {...field}
                        data-testid="input-maintenance"
                      />
                    </FormControl>
                    <FormDescription data-testid="text-maintenance-description">
                      Servicios de mantenimiento incluidos en la renta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={form.control}
            name="additionalTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Términos Adicionales (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe cualquier término adicional importante..."
                    rows={4}
                    {...field}
                    data-testid="textarea-additional-terms"
                  />
                </FormControl>
                <FormDescription data-testid="text-terms-description">
                  Cualquier información adicional relevante
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              data-testid="button-previous-step6"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button type="submit" data-testid="button-next-step6">
              Continuar
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
