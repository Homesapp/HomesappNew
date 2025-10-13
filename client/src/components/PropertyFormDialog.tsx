import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema, type InsertProperty, type Property } from "@shared/schema";
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
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useCreateProperty, useUpdateProperty } from "@/hooks/useProperties";
import { Loader2, Upload, X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property;
  mode: "create" | "edit";
}

export function PropertyFormDialog({
  open,
  onOpenChange,
  property,
  mode,
}: PropertyFormDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const [imageFiles, setImageFiles] = useState<{ name: string; data: string }[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const form = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      title: "",
      description: "",
      price: "0",
      currency: "MXN",
      bedrooms: 1,
      bathrooms: "1",
      area: "0",
      location: "",
      status: "rent",
      amenities: [],
      images: [],
      ownerId: "",
      managementId: undefined,
      active: true,
      accessInfo: undefined,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    
    // Reset to step 1 when dialog opens
    setCurrentStep(1);
    
    if (property && mode === "edit") {
      const accessInfo = property.accessInfo as { lockboxCode?: string; contactPerson?: string; contactPhone?: string } | null;
      form.reset({
        title: property.title,
        description: property.description || "",
        price: property.price,
        currency: property.currency,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        location: property.location,
        status: property.status,
        amenities: property.amenities || [],
        images: property.images || [],
        ownerId: property.ownerId,
        managementId: property.managementId || undefined,
        active: property.active,
        accessInfo: accessInfo || undefined,
      });
      // Load existing images
      const files = (property.images || []).map((data, index) => ({
        name: `Imagen ${index + 1}`,
        data,
      }));
      setImageFiles(files);
    } else if (mode === "create") {
      form.reset({
        title: "",
        description: "",
        price: "0",
        currency: "MXN",
        bedrooms: 1,
        bathrooms: "1",
        area: "0",
        location: "",
        status: "rent",
        amenities: [],
        images: [],
        ownerId: "",
        managementId: undefined,
        active: true,
        accessInfo: undefined,
      });
      setImageFiles([]);
    }
  }, [property, mode, form, open]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    
    // Process all files in parallel
    const filePromises = filesArray.map(async (file) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: `${file.name}: Solo se permiten imágenes`,
          variant: "destructive",
        });
        return null;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: `${file.name} supera el límite de 10MB`,
          variant: "destructive",
        });
        return null;
      }

      // Convert to base64 (create new FileReader for each file)
      return new Promise<{ name: string; data: string } | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ name: file.name, data: reader.result as string });
        };
        reader.onerror = () => {
          toast({
            title: "Error",
            description: `Error al leer ${file.name}`,
            variant: "destructive",
          });
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.all(filePromises);
    const validFiles = results.filter((f): f is { name: string; data: string } => f !== null);

    if (validFiles.length > 0) {
      const updatedFiles = [...imageFiles, ...validFiles];
      setImageFiles(updatedFiles);
      form.setValue("images", updatedFiles.map(f => f.data));
    }

    // Reset input
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(updatedFiles);
    form.setValue("images", updatedFiles.map(f => f.data));
  };

  const onSubmit = async (data: InsertProperty) => {
    try {
      if (mode === "edit" && property) {
        await updateMutation.mutateAsync({ id: property.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setImageFiles([]);
      form.reset();
      setCurrentStep(1);
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsToValidate: Record<number, (keyof InsertProperty)[]> = {
      1: ["title", "description", "location", "status"],
      2: ["bedrooms", "bathrooms", "area", "price", "currency"],
      3: ["amenities", "ownerId"],
      4: ["images"],
    };

    const fields = fieldsToValidate[step];
    const result = await form.trigger(fields);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const steps = [
    { number: 1, title: "Información Básica" },
    { number: 2, title: "Características" },
    { number: 3, title: "Amenidades y Acceso" },
    { number: 4, title: "Imágenes" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-property-form">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {mode === "create" ? "Agregar Propiedad" : "Editar Propiedad"}
          </DialogTitle>
          <DialogDescription>
            Paso {currentStep} de {totalSteps}: {steps[currentStep - 1].title}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStep > step.number
                    ? "bg-primary border-primary text-primary-foreground"
                    : currentStep === step.number
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
                }`}>
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.number}</span>
                  )}
                </div>
                <span className={`text-xs mt-1 text-center ${
                  currentStep === step.number ? "text-primary font-medium" : "text-muted-foreground"
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${
                  currentStep > step.number ? "bg-primary" : "bg-border"
                }`} />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Step 1: Información Básica */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Casa moderna en zona residencial"
                          data-testid="input-title"
                          {...field}
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
                          placeholder="Descripción detallada de la propiedad..."
                          className="min-h-[100px]"
                          data-testid="input-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación *</FormLabel>
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

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rent">En Renta</SelectItem>
                          <SelectItem value="sale">En Venta</SelectItem>
                          <SelectItem value="both">Renta y Venta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Características */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio *</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="15000"
                            data-testid="input-price"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moneda *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-currency">
                              <SelectValue placeholder="Seleccionar moneda" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MXN">MXN</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recámaras *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            data-testid="input-bedrooms"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                            type="text"
                            placeholder="1.5"
                            data-testid="input-bathrooms"
                            {...field}
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
                            type="text"
                            placeholder="120"
                            data-testid="input-area"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Amenidades y Acceso */}
            {currentStep === 3 && (
              <div className="space-y-4">
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
                  name="ownerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID del Propietario *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ID del usuario propietario"
                          data-testid="input-owner-id"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <FormLabel className="text-base">Información de Acceso (Opcional)</FormLabel>
                  
                  <FormField
                    control={form.control}
                    name="accessInfo.lockboxCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código de Caja Fuerte</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="1234"
                            data-testid="input-lockbox-code"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accessInfo.contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Persona de Contacto</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nombre de la persona que dará acceso"
                            data-testid="input-contact-person"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accessInfo.contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono de Contacto</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+52 55 1234 5678"
                            data-testid="input-contact-phone"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Imágenes */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <FormLabel>Imágenes de la Propiedad</FormLabel>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      data-testid="input-images"
                    />
                    <Upload className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Puedes subir múltiples imágenes. Tamaño máximo: 10MB por imagen.
                  </p>
                </div>

                {imageFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={file.data}
                          alt={file.name}
                          className="w-full h-40 object-cover rounded-md border"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeImage(index)}
                            data-testid={`button-remove-image-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Badge className="absolute top-2 left-2" variant="secondary">
                          {index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {imageFiles.length === 0 && (
                  <div className="border-2 border-dashed rounded-lg p-12 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No hay imágenes cargadas. Sube al menos una imagen de la propiedad.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-3 pt-6 border-t">
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={isPending}
                    data-testid="button-prev"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(1);
                    onOpenChange(false);
                  }}
                  disabled={isPending}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={isPending}
                    data-testid="button-next"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isPending} data-testid="button-submit">
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {mode === "create" ? "Crear Propiedad" : "Guardar Cambios"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
