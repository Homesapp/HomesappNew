import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { insertPropertySchema, type InsertProperty, type Property, type Condominium, type CondominiumUnit, type Amenity, type Colony } from "@shared/schema";
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
import { Loader2, Upload, X, ChevronLeft, ChevronRight, Check, User, Users, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  const totalSteps = 5;
  const [hasReferral, setHasReferral] = useState(false);
  const [documents, setDocuments] = useState<Array<{ type: string; url: string; name: string }>>([]);
  const [selectedCondoId, setSelectedCondoId] = useState<string>("");

  // Fetch approved condominiums
  const { data: condominiums = [] } = useQuery<Condominium[]>({
    queryKey: ["/api/condominiums/approved"],
  });

  // Fetch units for selected condominium
  const { data: units = [] } = useQuery<CondominiumUnit[]>({
    queryKey: ["/api/condominiums", selectedCondoId, "units"],
    enabled: !!selectedCondoId,
  });

  // Fetch approved amenities
  const { data: approvedAmenities = [] } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities/approved"],
  });

  // Fetch approved colonies
  const { data: colonies = [] } = useQuery<Colony[]>({
    queryKey: ["/api/colonies/approved"],
  });

  const form = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      description: "",
      price: "0",
      currency: "MXN",
      bedrooms: 1,
      bathrooms: "1",
      area: "0",
      location: "",
      condominiumId: "",
      unitNumber: "",
      status: "rent",
      amenities: [],
      primaryImages: [],
      ownerId: "",
      managementId: undefined,
      active: true,
      accessInfo: undefined,
      includedServices: undefined,
      referralPercent: "20.00",
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
      
      // Set selected condominium for unit loading
      if (property.condominiumId) {
        setSelectedCondoId(property.condominiumId);
      }
      
      // Check if referral data exists
      const hasExistingReferral = Boolean(
        property.referredByName || 
        property.referredByLastName || 
        property.referredByPhone
      );
      setHasReferral(hasExistingReferral);
      
      form.reset({
        description: property.description || "",
        price: property.price,
        currency: property.currency,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        location: property.location,
        condominiumId: property.condominiumId,
        unitNumber: property.unitNumber,
        status: property.status,
        amenities: property.amenities || [],
        primaryImages: property.primaryImages || [],
        ownerId: property.ownerId,
        managementId: property.managementId || undefined,
        active: property.active,
        accessInfo: accessInfo || undefined,
        includedServices: property.includedServices || undefined,
        // Owner private data
        ownerFirstName: property.ownerFirstName || "",
        ownerLastName: property.ownerLastName || "",
        ownerPhone: property.ownerPhone || "",
        ownerEmail: property.ownerEmail || "",
        // Referral data
        referredByName: property.referredByName || "",
        referredByLastName: property.referredByLastName || "",
        referredByPhone: property.referredByPhone || "",
        referredByEmail: property.referredByEmail || "",
        referralPercent: property.referralPercent || "20.00",
      });
      
      // Load existing images from primaryImages
      const files = (property.primaryImages || []).map((data, index) => ({
        name: `Imagen ${index + 1}`,
        data,
      }));
      setImageFiles(files);
    } else if (mode === "create") {
      setHasReferral(false);
      form.reset({
        description: "",
        price: "0",
        currency: "MXN",
        bedrooms: 1,
        bathrooms: "1",
        area: "0",
        location: "",
        condominiumId: "",
        includedServices: undefined,
        unitNumber: "",
        status: "rent",
        amenities: [],
        primaryImages: [],
        ownerId: "",
        managementId: undefined,
        active: true,
        accessInfo: undefined,
        // Owner private data
        ownerFirstName: "",
        ownerLastName: "",
        ownerPhone: "",
        ownerEmail: "",
        // Referral data
        referredByName: "",
        referredByLastName: "",
        referredByPhone: "",
        referredByEmail: "",
        referralPercent: "20.00",
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
      // Save to primaryImages instead of images (old field)
      form.setValue("primaryImages", updatedFiles.map(f => f.data));
    }

    // Reset input
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(updatedFiles);
    // Save to primaryImages instead of images (old field)
    form.setValue("primaryImages", updatedFiles.map(f => f.data));
  };

  // Handle condominium selection/creation
  const handleCondominiumChange = async (value: string) => {
    try {
      // Check if it's an existing ID or a new name
      const existingCondo = condominiums.find(c => c.id === value);
      
      if (existingCondo) {
        // Existing condominium selected
        form.setValue("condominiumId", value);
        setSelectedCondoId(value);
      } else {
        // New condominium name - create it
        const res = await apiRequest("POST", "/api/condominiums/ensure", { name: value });
        const response = await res.json() as Condominium;
        
        form.setValue("condominiumId", response.id);
        setSelectedCondoId(response.id);
        
        // Invalidate condominiums cache to refresh the list
        await queryClient.invalidateQueries({ 
          queryKey: ["/api/condominiums/approved"] 
        });
        
        toast({
          title: "Condominio agregado",
          description: `"${value}" ha sido agregado correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error handling condominium:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar el condominio.",
        variant: "destructive",
      });
    }
  };

  // Handle unit selection/creation
  const handleUnitChange = async (value: string) => {
    try {
      if (!selectedCondoId) {
        toast({
          title: "Error",
          description: "Primero selecciona un condominio.",
          variant: "destructive",
        });
        return;
      }

      // Check if it's an existing unit or a new number
      const existingUnit = units.find(u => u.unitNumber === value);
      
      if (existingUnit) {
        // Existing unit selected
        form.setValue("unitNumber", value);
      } else {
        // New unit number - create it
        await apiRequest("POST", `/api/condominiums/${selectedCondoId}/units/ensure`, { unitNumber: value });
        
        form.setValue("unitNumber", value);
        
        // Invalidate units cache to refresh the list
        await queryClient.invalidateQueries({ 
          queryKey: ["/api/condominiums", selectedCondoId, "units"] 
        });
        
        toast({
          title: "Unidad agregada",
          description: `Unidad "${value}" ha sido agregada correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error handling unit:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la unidad.",
        variant: "destructive",
      });
    }
  };

  // Handle location (colony) selection/creation
  const handleLocationChange = async (value: string) => {
    try {
      // Check if it's an existing colony name
      const existingColony = colonies.find(c => c.name === value);
      
      if (existingColony) {
        // Existing colony selected
        form.setValue("location", value);
      } else {
        // New colony name - create it
        await apiRequest("POST", "/api/colonies/ensure", { name: value });
        
        form.setValue("location", value);
        
        // Invalidate colonies cache to refresh the list
        await queryClient.invalidateQueries({ 
          queryKey: ["/api/colonies/approved"] 
        });
        
        toast({
          title: "Colonia agregada",
          description: `"${value}" ha sido agregada correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error handling colony:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la colonia.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: InsertProperty) => {
    try {
      if (mode === "edit" && property) {
        await updateMutation.mutateAsync({ id: property.id, data });
        
        // TODO: Upload documents if any (requires proper document type classification)
        // Documents can be uploaded later through the property management interface
        
        toast({
          title: "Propiedad actualizada",
          description: "Los cambios se han guardado correctamente.",
        });
      } else {
        await createMutation.mutateAsync(data);
        
        // TODO: Upload documents if any (requires proper document type classification)
        // Documents can be uploaded later through the property management interface
        
        toast({
          title: "Propiedad creada",
          description: "La propiedad se ha agregado correctamente.",
        });
      }
      setImageFiles([]);
      setDocuments([]);
      form.reset();
      setCurrentStep(1);
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la propiedad. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsToValidate: Record<number, (keyof InsertProperty)[]> = {
      1: ["condominiumId", "unitNumber", "description", "location", "status"],
      2: ["bedrooms", "bathrooms", "area", "price", "currency"],
      3: ["amenities"],
      4: ["images"],
      5: ["ownerFirstName", "ownerLastName", "ownerPhone", "ownerId"], // ownerEmail is optional, ownerId is now in step 5
    };

    const fields = fieldsToValidate[step];
    const result = await form.trigger(fields);
    
    // Additional validation for referral if enabled
    if (step === 5 && hasReferral) {
      const referralFields: (keyof InsertProperty)[] = ["referredByName", "referredByLastName", "referredByPhone", "referralPercent"];
      const referralResult = await form.trigger(referralFields);
      return result && referralResult;
    }
    
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
    { number: 5, title: "Propietario y Referido" },
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
                  name="condominiumId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condominio *</FormLabel>
                      <FormControl>
                        <CreatableCombobox
                          value={field.value || ""}
                          onValueChange={handleCondominiumChange}
                          options={condominiums.map(c => ({ id: c.id, label: c.name }))}
                          placeholder="Seleccionar o escribir condominio..."
                          emptyText="No se encontraron condominios."
                          createText="Crear"
                          searchPlaceholder="Buscar o escribir nuevo..."
                          testId="select-condominium"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Unidad *</FormLabel>
                      <FormControl>
                        <CreatableCombobox
                          value={field.value || ""}
                          onValueChange={handleUnitChange}
                          options={units.map(u => ({ id: u.unitNumber, label: u.unitNumber }))}
                          placeholder={selectedCondoId ? "Seleccionar o escribir unidad..." : "Primero selecciona un condominio"}
                          emptyText="No se encontraron unidades."
                          createText="Crear"
                          searchPlaceholder="Buscar o escribir nueva..."
                          disabled={!selectedCondoId}
                          testId="select-unit-number"
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
                          value={field.value || ""}
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
                      <FormLabel>Colonia/Ubicación *</FormLabel>
                      <FormControl>
                        <CreatableCombobox
                          value={field.value || ""}
                          onValueChange={handleLocationChange}
                          options={colonies.map(c => ({ id: c.name, label: c.name }))}
                          placeholder="Seleccionar o escribir colonia..."
                          emptyText="No se encontraron colonias."
                          createText="Crear"
                          searchPlaceholder="Buscar o escribir nueva..."
                          testId="select-location"
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

            {/* Step 3: Amenidades y Acceso */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="amenities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amenidades</FormLabel>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {approvedAmenities.map((amenity) => (
                          <div key={amenity.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`amenity-${amenity.id}`}
                              checked={field.value?.includes(amenity.name) || false}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, amenity.name]);
                                } else {
                                  field.onChange(current.filter((a) => a !== amenity.name));
                                }
                              }}
                              data-testid={`checkbox-amenity-${amenity.name.toLowerCase().replace(/\s+/g, '-')}`}
                            />
                            <label
                              htmlFor={`amenity-${amenity.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {amenity.name}
                            </label>
                          </div>
                        ))}
                      </div>
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

            {/* Step 5: Datos del Propietario y Referido */}
            {currentStep === 5 && (
              <div className="space-y-6">
                {/* Owner Data Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Datos Privados del Propietario</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Información confidencial del propietario real (solo visible para administradores)
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ownerFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre(s) *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Juan Carlos"
                              data-testid="input-owner-first-name"
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
                      name="ownerLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellidos *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="García López"
                              data-testid="input-owner-last-name"
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
                      name="ownerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono WhatsApp *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+52 998 123 4567"
                              data-testid="input-owner-phone"
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
                      name="ownerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="propietario@email.com"
                              data-testid="input-owner-email"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="ownerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID del Usuario Propietario *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ID del usuario registrado como propietario"
                            data-testid="input-owner-id"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Referral Data Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Datos del Referido</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="has-referral">¿Tiene referido?</Label>
                      <Switch
                        id="has-referral"
                        checked={hasReferral}
                        onCheckedChange={setHasReferral}
                        data-testid="switch-has-referral"
                      />
                    </div>
                  </div>

                  {hasReferral && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="referredByName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre(s) *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="María"
                                data-testid="input-referral-first-name"
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
                        name="referredByLastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellidos *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Rodríguez"
                                data-testid="input-referral-last-name"
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
                        name="referredByPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono WhatsApp *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+52 998 987 6543"
                                data-testid="input-referral-phone"
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
                        name="referredByEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="referido@email.com"
                                data-testid="input-referral-email"
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
                        name="referralPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Porcentaje de Comisión (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="20.00"
                                data-testid="input-referral-percent"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Documents Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Documentos del Propietario (Opcional)</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Documentos necesarios para la elaboración de contratos
                  </p>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Puedes subir:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>Escrituras o contrato de compraventa</li>
                      <li>Identificación oficial (INE/Pasaporte)</li>
                      <li>Recibos (luz, agua, internet)</li>
                      <li>Reglas internas o del condominio</li>
                      <li>Otros documentos relevantes</li>
                    </ul>
                  </div>

                  <div>
                    <input
                      type="file"
                      id="document-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;
                        
                        Array.from(files).forEach((file) => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setDocuments((prev) => [
                              ...prev,
                              {
                                type: file.type,
                                url: reader.result as string,
                                name: file.name,
                              },
                            ]);
                          };
                          reader.readAsDataURL(file);
                        });
                        
                        // Reset input
                        e.target.value = "";
                      }}
                      data-testid="input-document-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("document-upload")?.click()}
                      data-testid="button-upload-documents"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Documentos
                    </Button>
                  </div>

                  {documents.length > 0 && (
                    <div className="space-y-2">
                      {documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{doc.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const updated = documents.filter((_, i) => i !== index);
                              setDocuments(updated);
                            }}
                            data-testid={`button-remove-doc-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    * Los documentos se pueden agregar más tarde. No son obligatorios en esta instancia.
                  </p>
                </div>
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

                {mode === "edit" ? (
                  // En modo edición, mostrar "Siguiente" (si no es último paso) + "Guardar Cambios"
                  <>
                    {currentStep < totalSteps && (
                      <Button
                        type="button"
                        onClick={nextStep}
                        disabled={isPending}
                        data-testid="button-next"
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                    <Button type="submit" disabled={isPending} data-testid="button-submit">
                      {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Guardar Cambios
                    </Button>
                  </>
                ) : currentStep < totalSteps ? (
                  // En modo creación, mostrar "Siguiente" hasta el último paso
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
                  // En modo creación, último paso
                  <Button type="submit" disabled={isPending} data-testid="button-submit">
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Crear Propiedad
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
