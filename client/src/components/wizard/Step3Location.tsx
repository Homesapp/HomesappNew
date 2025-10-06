import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { SuggestColonyDialog } from "@/components/SuggestColonyDialog";
import { SuggestCondominiumDialog } from "@/components/SuggestCondominiumDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Colony, Condominium } from "@shared/schema";

const locationSchema = z.object({
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  city: z.string().min(2, "La ciudad es requerida"),
  state: z.string().min(2, "El estado es requerido"),
  zipCode: z.string().min(4, "El código postal debe tener al menos 4 caracteres"),
  colonyId: z.string().optional(),
  condominiumId: z.string().optional(),
  unitNumber: z.string().optional(),
  googleMapsUrl: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type LocationForm = z.infer<typeof locationSchema>;

type Step3Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  onPrevious: () => void;
};

export default function Step3Location({ data, onUpdate, onNext, onPrevious }: Step3Props) {
  const { t } = useLanguage();
  const [showColonyDialog, setShowColonyDialog] = useState(false);
  const [showCondoDialog, setShowCondoDialog] = useState(false);

  // Fetch approved colonies
  const { data: colonies = [] } = useQuery<Colony[]>({
    queryKey: ["/api/colonies/approved"],
  });

  // Fetch approved condominiums
  const { data: condominiums = [] } = useQuery<Condominium[]>({
    queryKey: ["/api/condominiums/approved"],
  });

  const form = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      address: data.locationInfo?.address || "",
      city: data.locationInfo?.city || "",
      state: data.locationInfo?.state || "",
      zipCode: data.locationInfo?.zipCode || "",
      colonyId: data.locationInfo?.colonyId || "",
      condominiumId: data.locationInfo?.condominiumId || "",
      unitNumber: data.locationInfo?.unitNumber || "",
      googleMapsUrl: data.locationInfo?.googleMapsUrl || "",
      latitude: data.locationInfo?.latitude || "",
      longitude: data.locationInfo?.longitude || "",
    },
  });

  const onSubmit = (formData: LocationForm) => {
    onNext({ locationInfo: formData });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step3-title">
          Ubicación
        </h2>
        <p className="text-muted-foreground" data-testid="text-step3-description">
          Indica dónde se encuentra la propiedad
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Calle Principal 123"
                    {...field}
                    data-testid="input-address"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Ciudad de México"
                      {...field}
                      data-testid="input-city"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: CDMX"
                      {...field}
                      data-testid="input-state"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código Postal</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: 12345"
                    {...field}
                    data-testid="input-zipcode"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="colonyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("public.filterColony")} (Opcional)</FormLabel>
                <div className="flex gap-2">
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-colony">
                        <SelectValue placeholder={t("public.filterColonyPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="" data-testid="option-no-colony">
                        {t("public.filterAllColonies")}
                      </SelectItem>
                      {colonies.map((colony) => (
                        <SelectItem
                          key={colony.id}
                          value={colony.id}
                          data-testid={`option-colony-${colony.id}`}
                        >
                          {colony.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowColonyDialog(true)}
                    data-testid="button-suggest-colony"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <FormDescription>
                  {t("suggestion.notFound")} {t("suggestion.suggestButton")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="condominiumId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("public.filterCondo")} (Opcional)</FormLabel>
                <div className="flex gap-2">
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-condominium">
                        <SelectValue placeholder={t("public.filterCondoPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="" data-testid="option-no-condo">
                        {t("public.filterAllCondos")}
                      </SelectItem>
                      {condominiums.map((condo) => (
                        <SelectItem
                          key={condo.id}
                          value={condo.id}
                          data-testid={`option-condo-${condo.id}`}
                        >
                          {condo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCondoDialog(true)}
                    data-testid="button-suggest-condominium"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <FormDescription>
                  {t("suggestion.notFound")} {t("suggestion.suggestButton")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Unidad (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: 101, A-5..."
                    {...field}
                    data-testid="input-unit-number"
                  />
                </FormControl>
                <FormDescription>
                  Si la propiedad está en un condominio, especifica el número de unidad
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="googleMapsUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link de Google Maps (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://maps.google.com/..."
                    {...field}
                    data-testid="input-google-maps-url"
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
              data-testid="button-previous-step3"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button type="submit" data-testid="button-next-step3">
              Continuar
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>

      <SuggestColonyDialog
        open={showColonyDialog}
        onOpenChange={setShowColonyDialog}
      />
      <SuggestCondominiumDialog
        open={showCondoDialog}
        onOpenChange={setShowCondoDialog}
      />
    </div>
  );
}
