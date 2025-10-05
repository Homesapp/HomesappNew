import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const basicInfoSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres"),
  propertyType: z.string().min(1, "Selecciona un tipo de propiedad"),
  price: z.string().min(1, "El precio es requerido"),
});

type BasicInfoForm = z.infer<typeof basicInfoSchema>;

type Step2Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
};

export default function Step2BasicInfo({ data, onUpdate, onNext, onPrevious }: Step2Props) {
  const form = useForm<BasicInfoForm>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      title: data.basicInfo?.title || "",
      description: data.basicInfo?.description || "",
      propertyType: data.basicInfo?.propertyType || "house",
      price: data.basicInfo?.price || "",
    },
  });

  const onSubmit = (formData: BasicInfoForm) => {
    onUpdate({ basicInfo: formData });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step2-title">
          Información Básica
        </h2>
        <p className="text-muted-foreground" data-testid="text-step2-description">
          Proporciona los detalles principales de la propiedad
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Casa moderna en zona céntrica"
                    {...field}
                    data-testid="input-title"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe la propiedad en detalle..."
                    rows={4}
                    {...field}
                    data-testid="textarea-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="propertyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Propiedad</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-property-type">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="house" data-testid="option-property-house">Casa</SelectItem>
                    <SelectItem value="apartment" data-testid="option-property-apartment">Apartamento</SelectItem>
                    <SelectItem value="condo" data-testid="option-property-condo">Condominio</SelectItem>
                    <SelectItem value="land" data-testid="option-property-land">Terreno</SelectItem>
                    <SelectItem value="commercial" data-testid="option-property-commercial">Comercial</SelectItem>
                    <SelectItem value="office" data-testid="option-property-office">Oficina</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (MXN)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ej: 5000000"
                    {...field}
                    data-testid="input-price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              data-testid="button-previous-step2"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button type="submit" data-testid="button-next-step2">
              Continuar
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
