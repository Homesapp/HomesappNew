import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPresentationCardSchema, type InsertPresentationCard, type PresentationCard } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreatePresentationCard, useUpdatePresentationCard } from "@/hooks/usePresentationCards";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PresentationCardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: PresentationCard;
  mode: "create" | "edit";
}

export function PresentationCardFormDialog({
  open,
  onOpenChange,
  card,
  mode,
}: PresentationCardFormDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createMutation = useCreatePresentationCard();
  const updateMutation = useUpdatePresentationCard();
  const [petPhotoPreview, setPetPhotoPreview] = useState<string | null>(null);

  const form = useForm<InsertPresentationCard>({
    resolver: zodResolver(insertPresentationCardSchema),
    defaultValues: {
      clientId: user?.id || "",
      propertyType: "",
      modality: "rent",
      minPrice: "0",
      maxPrice: "0",
      location: "",
      bedrooms: undefined,
      bathrooms: undefined,
      amenities: [],
      additionalRequirements: "",
      moveInDate: undefined,
      contractDuration: undefined,
      hasPets: false,
      petPhotoUrl: undefined,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    
    if (card && mode === "edit") {
      form.reset({
        clientId: card.clientId,
        propertyType: card.propertyType,
        modality: card.modality,
        minPrice: card.minPrice,
        maxPrice: card.maxPrice,
        location: card.location,
        bedrooms: card.bedrooms || undefined,
        bathrooms: card.bathrooms || undefined,
        amenities: card.amenities || [],
        additionalRequirements: card.additionalRequirements || "",
        moveInDate: card.moveInDate || undefined,
        contractDuration: card.contractDuration || undefined,
        hasPets: card.hasPets || false,
        petPhotoUrl: card.petPhotoUrl || undefined,
      });
      setPetPhotoPreview(card.petPhotoUrl || null);
    } else if (mode === "create") {
      form.reset({
        clientId: user?.id || "",
        propertyType: "",
        modality: "rent",
        minPrice: "0",
        maxPrice: "0",
        location: "",
        bedrooms: undefined,
        bathrooms: undefined,
        amenities: [],
        additionalRequirements: "",
        moveInDate: undefined,
        contractDuration: undefined,
        hasPets: false,
        petPhotoUrl: undefined,
      });
      setPetPhotoPreview(null);
    }
  }, [card, mode, form, user, open]);

  const handlePetPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe superar 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPetPhotoPreview(base64String);
      form.setValue("petPhotoUrl", base64String);
    };
    reader.readAsDataURL(file);
  };

  const removePetPhoto = () => {
    setPetPhotoPreview(null);
    form.setValue("petPhotoUrl", undefined);
  };

  const onSubmit = async (data: InsertPresentationCard) => {
    try {
      const submitData = {
        ...data,
        clientId: user?.id || data.clientId,
      };

      if (mode === "edit" && card) {
        await updateMutation.mutateAsync({ id: card.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      setPetPhotoPreview(null);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-presentation-card-form">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {mode === "create" ? "Nueva Tarjeta de Presentación" : "Editar Tarjeta"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Crea un perfil de búsqueda para encontrar propiedades que se ajusten a tus necesidades"
              : "Actualiza tu perfil de búsqueda"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Propiedad</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Casa, Departamento, Local Comercial..."
                      data-testid="input-property-type"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalidad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-modality">
                        <SelectValue placeholder="Seleccionar modalidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="rent">Renta</SelectItem>
                      <SelectItem value="sale">Venta</SelectItem>
                      <SelectItem value="both">Renta y Venta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Mínimo</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="0"
                        data-testid="input-min-price"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Máximo</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="0"
                        data-testid="input-max-price"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación Preferida</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Col. Centro, Ciudad de México"
                      data-testid="input-location"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recámaras (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        data-testid="input-bedrooms"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                    <FormLabel>Baños (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        data-testid="input-bathrooms"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                  <FormLabel>Amenidades (separadas por comas)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Estacionamiento, Gimnasio, Alberca"
                      data-testid="input-amenities"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => {
                        const amenities = e.target.value
                          .split(",")
                          .map((a) => a.trim())
                          .filter((a) => a.length > 0);
                        field.onChange(amenities);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requisitos Adicionales (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Especifica cualquier otro requisito o preferencia..."
                      data-testid="input-additional-requirements"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="moveInDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Ingreso (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        data-testid="input-move-in-date"
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo de Contrato (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-contract-duration">
                          <SelectValue placeholder="Seleccionar duración" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="6 meses">6 meses</SelectItem>
                        <SelectItem value="1 año">1 año</SelectItem>
                        <SelectItem value="2 años">2 años</SelectItem>
                        <SelectItem value="3 años">3 años</SelectItem>
                        <SelectItem value="4 años">4 años</SelectItem>
                        <SelectItem value="5 años">5 años</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="hasPets"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-has-pets"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>¿Tienes mascotas?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("hasPets") && (
              <div className="space-y-2">
                <FormLabel>Foto de Mascota</FormLabel>
                {petPhotoPreview ? (
                  <div className="relative">
                    <img
                      src={petPhotoPreview}
                      alt="Vista previa mascota"
                      className="w-full max-w-xs h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removePetPhoto}
                      data-testid="button-remove-pet-photo"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePetPhotoUpload}
                      data-testid="input-pet-photo"
                    />
                    <Upload className="h-5 w-5 text-secondary-foreground" />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPetPhotoPreview(null);
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === "create" ? "Crear Tarjeta" : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
