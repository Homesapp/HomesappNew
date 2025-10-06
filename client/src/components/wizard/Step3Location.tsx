import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronLeft, ChevronRight, Plus, Check, ChevronsUpDown } from "lucide-react";
import { SuggestColonyDialog } from "@/components/SuggestColonyDialog";
import { SuggestCondominiumDialog } from "@/components/SuggestCondominiumDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
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
  const { toast } = useToast();
  const [showColonyDialog, setShowColonyDialog] = useState(false);
  const [showCondoDialog, setShowCondoDialog] = useState(false);
  const [openCondoCombobox, setOpenCondoCombobox] = useState(false);
  const [condoSearchValue, setCondoSearchValue] = useState("");

  // Fetch approved colonies
  const { data: colonies = [] } = useQuery<Colony[]>({
    queryKey: ["/api/colonies/approved"],
  });

  // Fetch approved condominiums
  const { data: condominiums = [] } = useQuery<Condominium[]>({
    queryKey: ["/api/condominiums/approved"],
  });

  // Mutation para crear sugerencia de condominio automáticamente
  const createCondoSuggestion = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/condominiums", { name });
    },
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

  const onSubmit = async (formData: LocationForm) => {
    let pendingCondoName: string | undefined = undefined;
    
    // Si hay un condominiumId, verificar si es un ID existente o un nombre nuevo
    if (formData.condominiumId && formData.condominiumId.trim() !== "") {
      const existingCondo = condominiums.find(c => c.id === formData.condominiumId);
      
      // Si no es un ID existente, significa que el usuario escribió un nombre nuevo
      if (!existingCondo) {
        const newCondoName = formData.condominiumId;
        pendingCondoName = newCondoName;
        
        try {
          // Crear sugerencia automáticamente sin bloquear el flujo
          await createCondoSuggestion.mutateAsync(newCondoName);
          toast({
            title: "Sugerencia enviada",
            description: `El condominio "${newCondoName}" ha sido enviado para aprobación del administrador. Se guardará tu selección.`,
          });
          // Mantener el nombre para que el usuario lo vea en revisión
          // Se limpiará cuando la propiedad se cree (ya que aún no está aprobado)
        } catch (error: any) {
          // Si falla, mostrar error informativo pero permitir continuar
          console.error("Error creating condo suggestion:", error);
          const errorMsg = error?.message || "Error desconocido";
          toast({
            title: "No se pudo enviar la sugerencia",
            description: `El condominio "${newCondoName}" no pudo ser sugerido (${errorMsg}). Puedes continuar y el condominio quedará como texto.`,
            variant: "destructive",
          });
        }
      }
    }

    // Transform empty strings to undefined for optional fields
    const cleanedData = {
      ...formData,
      colonyId: formData.colonyId && formData.colonyId.trim() !== "" ? formData.colonyId : undefined,
      condominiumId: formData.condominiumId && formData.condominiumId.trim() !== "" ? formData.condominiumId : undefined,
      unitNumber: formData.unitNumber && formData.unitNumber.trim() !== "" ? formData.unitNumber : undefined,
      googleMapsUrl: formData.googleMapsUrl && formData.googleMapsUrl.trim() !== "" ? formData.googleMapsUrl : undefined,
      latitude: formData.latitude && formData.latitude.trim() !== "" ? formData.latitude : undefined,
      longitude: formData.longitude && formData.longitude.trim() !== "" ? formData.longitude : undefined,
      pendingCondoName, // Guardar el nombre del condominio pendiente
    };
    onNext({ locationInfo: cleanedData });
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
              <FormItem className="flex flex-col">
                <FormLabel>{t("public.filterCondo")} (Opcional)</FormLabel>
                <Popover open={openCondoCombobox} onOpenChange={setOpenCondoCombobox}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCondoCombobox}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="select-condominium"
                      >
                        {field.value
                          ? condominiums.find((condo) => condo.id === field.value)?.name || field.value
                          : t("public.filterCondoPlaceholder")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar o escribir condominio..." 
                        value={condoSearchValue}
                        onValueChange={setCondoSearchValue}
                        data-testid="input-search-condominium"
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="py-2 text-center text-sm">
                            <p className="text-muted-foreground mb-2">No se encontró el condominio</p>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                if (condoSearchValue.trim()) {
                                  field.onChange(condoSearchValue.trim());
                                  setOpenCondoCombobox(false);
                                  setCondoSearchValue("");
                                }
                              }}
                              data-testid="button-use-new-condo"
                            >
                              Usar "{condoSearchValue}"
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              field.onChange("");
                              setOpenCondoCombobox(false);
                              setCondoSearchValue("");
                            }}
                            data-testid="option-no-condo"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !field.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {t("public.filterAllCondos")}
                          </CommandItem>
                          {condominiums.map((condo) => (
                            <CommandItem
                              key={condo.id}
                              value={condo.name}
                              onSelect={() => {
                                field.onChange(condo.id);
                                setOpenCondoCombobox(false);
                                setCondoSearchValue("");
                              }}
                              data-testid={`option-condo-${condo.id}`}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === condo.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {condo.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Selecciona un condominio existente o escribe uno nuevo. Los nuevos condominios serán enviados para aprobación.
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
