import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { SuggestColonyDialog } from "@/components/SuggestColonyDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Colony, Condominium } from "@shared/schema";

const step2Schema = z.object({
  // Ubicación
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
  // Detalles
  bedrooms: z.coerce.number().int().min(0, "Las habitaciones deben ser un número positivo"),
  bathrooms: z.coerce.number().min(0, "Los baños deben ser un número positivo"),
  area: z.coerce.number().min(1, "El área debe ser mayor a 0"),
  amenities: z.string().optional(),
});

type Step2Form = z.infer<typeof step2Schema>;

type Step2Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  onPrevious: () => void;
};

export default function Step2LocationDetails({ data, onUpdate, onNext, onPrevious }: Step2Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [showColonyDialog, setShowColonyDialog] = useState(false);
  const [showNewCondoInput, setShowNewCondoInput] = useState(false);
  const [newCondoName, setNewCondoName] = useState("");

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

  const form = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      // Ubicación
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
      // Detalles
      bedrooms: data.details?.bedrooms || 0,
      bathrooms: data.details?.bathrooms || 0,
      area: data.details?.area || 0,
      amenities: data.details?.amenities || "",
    },
  });

  const onSubmit = async (formData: Step2Form) => {
    let pendingCondoName: string | undefined = undefined;
    let finalCondoId: string | undefined = formData.condominiumId;
    
    // Si seleccionaron "nuevo" y escribieron un nombre, crear sugerencia
    if (formData.condominiumId === "NEW_CONDO" && newCondoName.trim() !== "") {
      pendingCondoName = newCondoName.trim();
      
      try {
        await createCondoSuggestion.mutateAsync(newCondoName.trim());
        toast({
          title: "Sugerencia enviada",
          description: `El condominio "${newCondoName}" ha sido enviado para aprobación.`,
        });
        finalCondoId = undefined;
      } catch (error: any) {
        console.error("Error creating condo suggestion:", error);
        toast({
          title: "No se pudo enviar la sugerencia",
          description: `El condominio "${newCondoName}" no pudo ser sugerido.`,
          variant: "destructive",
        });
        finalCondoId = undefined;
      }
    } else if (formData.condominiumId === "NEW_CONDO") {
      finalCondoId = undefined;
    }

    // Transform empty strings to undefined for optional fields
    const cleanedData = {
      locationInfo: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        colonyId: formData.colonyId && formData.colonyId.trim() !== "" ? formData.colonyId : undefined,
        condominiumId: finalCondoId && finalCondoId.trim() !== "" && finalCondoId !== "NEW_CONDO" ? finalCondoId : undefined,
        unitNumber: formData.unitNumber && formData.unitNumber.trim() !== "" ? formData.unitNumber : undefined,
        googleMapsUrl: formData.googleMapsUrl && formData.googleMapsUrl.trim() !== "" ? formData.googleMapsUrl : undefined,
        latitude: formData.latitude && formData.latitude.trim() !== "" ? formData.latitude : undefined,
        longitude: formData.longitude && formData.longitude.trim() !== "" ? formData.longitude : undefined,
        pendingCondoName,
      },
      details: {
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        area: formData.area,
        amenities: formData.amenities && formData.amenities.trim() !== "" ? formData.amenities : undefined,
      },
    };
    onNext(cleanedData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step2-title">
          Ubicación y Características
        </h2>
        <p className="text-muted-foreground" data-testid="text-step2-description">
          Detalles de la ubicación y características físicas
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Sección de Ubicación */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Ubicación</h3>
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección *</FormLabel>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Tulum"
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
                    <FormLabel>Estado *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Quintana Roo"
                        {...field}
                        data-testid="input-state"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Postal *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: 77760"
                        {...field}
                        data-testid="input-zipcode"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="colonyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colonia (Opcional)</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-colony">
                          <SelectValue placeholder="Selecciona una colonia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="" data-testid="option-no-colony">
                          Sin colonia
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condominiumId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condominio (Opcional)</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setShowNewCondoInput(value === "NEW_CONDO");
                      if (value !== "NEW_CONDO") {
                        setNewCondoName("");
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-condominium">
                        <SelectValue placeholder="Selecciona un condominio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="" data-testid="option-no-condo">
                        Sin condominio
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
                      <SelectItem value="NEW_CONDO" data-testid="option-new-condo">
                        ✏️ Otro (escribir nombre nuevo)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecciona un condominio existente o escribe uno nuevo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Input condicional para nombre de nuevo condominio */}
            {showNewCondoInput && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Nombre del Nuevo Condominio
                </label>
                <Input
                  value={newCondoName}
                  onChange={(e) => setNewCondoName(e.target.value)}
                  placeholder="Ej: Residencial Las Palmas"
                  data-testid="input-new-condo-name"
                />
                <p className="text-sm text-muted-foreground">
                  Este condominio será enviado para aprobación del administrador
                </p>
              </div>
            )}

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
                    Si la propiedad está en un condominio, especifica el número
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
          </div>

          <Separator />

          {/* Sección de Detalles */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Características</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Habitaciones *</FormLabel>
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
                    <FormLabel>Baños *</FormLabel>
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
                    <FormLabel>Área (m²) *</FormLabel>
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
          </div>

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

      <SuggestColonyDialog
        open={showColonyDialog}
        onOpenChange={setShowColonyDialog}
      />
    </div>
  );
}
