import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight } from "lucide-react";

const detailsSchema = z.object({
  bedrooms: z.coerce.number().int().min(0, "Las habitaciones deben ser un número positivo"),
  bathrooms: z.coerce.number().min(0, "Los baños deben ser un número positivo"),
  area: z.coerce.number().min(1, "El área debe ser mayor a 0"),
  amenities: z.string().optional(),
});

type DetailsForm = z.infer<typeof detailsSchema>;

type Step4Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
};

export default function Step4Details({ data, onUpdate, onNext, onPrevious }: Step4Props) {
  const form = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      bedrooms: data.details?.bedrooms || 0,
      bathrooms: data.details?.bathrooms || 0,
      area: data.details?.area || 0,
      amenities: data.details?.amenities || "",
    },
  });

  const onSubmit = (formData: DetailsForm) => {
    onUpdate({ details: formData });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step4-title">
          Detalles de la Propiedad
        </h2>
        <p className="text-muted-foreground" data-testid="text-step4-description">
          Proporciona las características físicas de la propiedad
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habitaciones</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ej: 3"
                      {...field}
                      data-testid="input-bedrooms"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bathrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Baños</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 2"
                      {...field}
                      data-testid="input-bathrooms"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área (m²)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ej: 150"
                      {...field}
                      data-testid="input-area"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="amenities"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amenidades (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ej: Piscina, Gimnasio, Estacionamiento techado, Jardín..."
                    rows={3}
                    {...field}
                    data-testid="textarea-amenities"
                  />
                </FormControl>
                <FormDescription data-testid="text-amenities-description">
                  Separa las amenidades con comas
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
              data-testid="button-previous-step4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button type="submit" data-testid="button-next-step4">
              Continuar
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
