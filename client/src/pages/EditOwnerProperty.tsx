import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Save, 
  Home, 
  MapPin, 
  Wrench, 
  Key, 
  CheckCircle2,
  Droplet,
  Zap,
  Wifi,
  Plus,
  X,
  User,
  Lock,
  Shield,
  Image as ImageIcon,
  AlertCircle,
  Trash2,
  Star,
  MoveUp,
  MoveDown
} from "lucide-react";
import type { Property, Colony, Condominium } from "@shared/schema";

const editPropertySchema = z.object({
  // Tipo de operación
  isForRent: z.boolean(),
  isForSale: z.boolean(),
  
  // Información básica
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres").optional(),
  propertyType: z.string().min(1, "Selecciona un tipo de propiedad"),
  price: z.string().min(1, "El precio es requerido"),
  salePrice: z.string().optional(),
  
  // Ubicación
  location: z.string().min(5, "La ubicación debe tener al menos 5 caracteres"),
  colonyId: z.string().optional(),
  condominiumId: z.string().optional(),
  unitNumber: z.string().optional(),
  googleMapsUrl: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  
  // Detalles
  bedrooms: z.coerce.number().int().min(0, "Las habitaciones deben ser un número positivo"),
  bathrooms: z.string().min(1, "Los baños son requeridos"),
  area: z.string().min(1, "El área es requerida"),
  petFriendly: z.boolean().optional(),
  
  // Amenidades
  amenities: z.array(z.string()).optional(),
  
  // Servicios
  waterIncluded: z.boolean(),
  waterProvider: z.string().optional(),
  waterCost: z.string().optional(),
  electricityIncluded: z.boolean(),
  electricityProvider: z.string().optional(),
  electricityCost: z.string().optional(),
  electricityBillingCycle: z.enum(["monthly", "bimonthly"]).optional(),
  internetIncluded: z.boolean(),
  internetProvider: z.string().optional(),
  internetCost: z.string().optional(),
  acceptedLeaseDurations: z.array(z.string()).optional(),
  
  // Información de acceso
  accessType: z.enum(["unattended", "attended"]).optional(),
  accessMethod: z.enum(["lockbox", "smart_lock"]).optional(),
  lockboxCode: z.string().optional(),
  lockboxLocation: z.string().optional(),
  smartLockCode: z.string().optional(),
  smartLockInstructions: z.string().optional(),
  smartLockProvider: z.string().optional(),
  smartLockExpirationDuration: z.enum(["same_day", "ongoing"]).optional(),
  smartLockExpirationNotes: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactNotes: z.string().optional(),
}).refine((data) => data.isForRent || data.isForSale, {
  message: "Debes seleccionar al menos una opción (Renta o Venta)",
  path: ["isForRent"],
});

type EditPropertyForm = z.infer<typeof editPropertySchema>;

type AdditionalService = {
  id: string;
  type: "pool_cleaning" | "garden" | "gas" | "custom";
  customName?: string;
  provider?: string;
  cost?: string;
};

const serviceLabels = {
  pool_cleaning: "Limpieza de Alberca",
  garden: "Jardín",
  gas: "Gas",
};

const leaseDurations = [
  { value: "1-3_months", label: "1-3 meses" },
  { value: "3-6_months", label: "3-6 meses" },
  { value: "6-12_months", label: "6-12 meses" },
  { value: "12+_months", label: "12+ meses" },
];

export default function EditOwnerProperty() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [showAddPhoto, setShowAddPhoto] = useState(false);

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ["/api/owner/properties", id, "detail"],
    queryFn: async () => {
      const response = await fetch(`/api/owner/properties/${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch property");
      }
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch approved colonies
  const { data: colonies = [] } = useQuery<Colony[]>({
    queryKey: ["/api/colonies/approved"],
  });

  // Fetch approved condominiums
  const { data: condominiums = [] } = useQuery<Condominium[]>({
    queryKey: ["/api/condominiums/approved"],
  });

  const form = useForm<EditPropertyForm>({
    resolver: zodResolver(editPropertySchema),
    defaultValues: {
      isForRent: false,
      isForSale: false,
      title: "",
      description: "",
      propertyType: "house",
      price: "",
      salePrice: "",
      location: "",
      colonyId: "",
      condominiumId: "",
      unitNumber: "",
      googleMapsUrl: "",
      bedrooms: 0,
      bathrooms: "",
      area: "",
      petFriendly: false,
      amenities: [],
      waterIncluded: false,
      electricityIncluded: false,
      internetIncluded: false,
      acceptedLeaseDurations: [],
      accessType: "unattended",
      accessMethod: "lockbox",
    },
  });

  // Update form when property data loads
  useEffect(() => {
    if (property && !form.formState.isDirty) {
      const includedServices = property.includedServices as any;
      const accessInfo = property.accessInfo as any;
      
      // Load photos
      const allImages = [
        ...(property.primaryImages || []),
        ...(property.secondaryImages || []),
        ...(property.images || [])
      ].filter((img, index, self) => img && self.indexOf(img) === index);
      setPhotos(allImages);
      setCoverImageIndex(property.coverImageIndex || 0);
      
      // Parse additional services
      if (includedServices?.additionalServices) {
        const services = includedServices.additionalServices.map((s: any, idx: number) => ({
          id: `${s.type}-${idx}`,
          ...s
        }));
        setAdditionalServices(services);
      }

      form.reset({
        isForRent: !!property.price && property.price > 0,
        isForSale: !!property.salePrice && property.salePrice > 0,
        title: property.title,
        description: property.description || "",
        propertyType: property.propertyType,
        price: property.price?.toString() || "",
        salePrice: property.salePrice?.toString() || "",
        location: property.location,
        colonyId: property.colonyId || "",
        condominiumId: property.condominiumId || "",
        unitNumber: property.unitNumber || "",
        googleMapsUrl: property.googleMapsUrl || "",
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms.toString(),
        area: property.area?.toString() || "",
        petFriendly: property.petFriendly || false,
        amenities: property.amenities || [],
        waterIncluded: includedServices?.basicServices?.water?.included || false,
        waterProvider: includedServices?.basicServices?.water?.provider || "",
        waterCost: includedServices?.basicServices?.water?.cost || "",
        electricityIncluded: includedServices?.basicServices?.electricity?.included || false,
        electricityProvider: includedServices?.basicServices?.electricity?.provider || "",
        electricityCost: includedServices?.basicServices?.electricity?.cost || "",
        electricityBillingCycle: includedServices?.basicServices?.electricity?.billingCycle,
        internetIncluded: includedServices?.basicServices?.internet?.included || false,
        internetProvider: includedServices?.basicServices?.internet?.provider || "",
        internetCost: includedServices?.basicServices?.internet?.cost || "",
        acceptedLeaseDurations: property.acceptedLeaseDurations || [],
        accessType: accessInfo?.accessType,
        accessMethod: accessInfo?.method,
        lockboxCode: accessInfo?.lockboxCode || "",
        lockboxLocation: accessInfo?.lockboxLocation || "",
        smartLockCode: accessInfo?.smartLockCode || "",
        smartLockInstructions: accessInfo?.smartLockInstructions || "",
        smartLockProvider: accessInfo?.smartLockProvider || "",
        smartLockExpirationDuration: accessInfo?.smartLockExpirationDuration,
        smartLockExpirationNotes: accessInfo?.smartLockExpirationNotes || "",
        contactPerson: accessInfo?.contactPerson || "",
        contactPhone: accessInfo?.contactPhone || "",
        contactNotes: accessInfo?.contactNotes || "",
      });
    }
  }, [property, form]);

  const waterIncluded = form.watch("waterIncluded");
  const electricityIncluded = form.watch("electricityIncluded");
  const internetIncluded = form.watch("internetIncluded");
  const accessType = form.watch("accessType");
  const accessMethod = form.watch("accessMethod");

  const handleAddAdditionalService = (type: "pool_cleaning" | "garden" | "gas" | "custom") => {
    const newService: AdditionalService = {
      id: `${type}-${Date.now()}`,
      type,
      customName: type === "custom" ? "" : undefined,
      provider: "",
      cost: "",
    };
    setAdditionalServices([...additionalServices, newService]);
  };

  const handleRemoveAdditionalService = (id: string) => {
    setAdditionalServices(additionalServices.filter(s => s.id !== id));
  };

  const handleUpdateAdditionalService = (id: string, field: "provider" | "cost" | "customName", value: string) => {
    setAdditionalServices(additionalServices.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const toggleDuration = (duration: string) => {
    const current = form.getValues("acceptedLeaseDurations") || [];
    if (current.includes(duration)) {
      form.setValue("acceptedLeaseDurations", current.filter(d => d !== duration));
    } else {
      form.setValue("acceptedLeaseDurations", [...current, duration]);
    }
  };

  const toggleAmenity = (amenity: string) => {
    const current = form.getValues("amenities") || [];
    if (current.includes(amenity)) {
      form.setValue("amenities", current.filter(a => a !== amenity));
    } else {
      form.setValue("amenities", [...current, amenity]);
    }
  };

  // Photo management functions
  const handleAddPhoto = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch('/api/upload/property-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la foto');
      }

      const data = await response.json();
      setPhotos([...photos, data.url]);
      setShowAddPhoto(false);
      toast({
        title: "Foto agregada",
        description: "La foto se agregó correctamente",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la foto",
        variant: "destructive",
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    // Adjust cover index if necessary
    if (coverImageIndex >= newPhotos.length) {
      setCoverImageIndex(Math.max(0, newPhotos.length - 1));
    } else if (index < coverImageIndex) {
      setCoverImageIndex(coverImageIndex - 1);
    }
  };

  const handleSetCover = (index: number) => {
    setCoverImageIndex(index);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newPhotos = [...photos];
      [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];
      setPhotos(newPhotos);
      // Adjust cover index
      if (coverImageIndex === index) {
        setCoverImageIndex(index - 1);
      } else if (coverImageIndex === index - 1) {
        setCoverImageIndex(index);
      }
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < photos.length - 1) {
      const newPhotos = [...photos];
      [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];
      setPhotos(newPhotos);
      // Adjust cover index
      if (coverImageIndex === index) {
        setCoverImageIndex(index + 1);
      } else if (coverImageIndex === index + 1) {
        setCoverImageIndex(index);
      }
    }
  };

  // Helper function to normalize objects for comparison
  const normalizeForComparison = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj === "" ? null : obj;
    
    if (Array.isArray(obj)) {
      return obj.length === 0 ? null : obj;
    }
    
    const normalized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const normalizedValue = normalizeForComparison(value);
      if (normalizedValue !== null && normalizedValue !== undefined) {
        normalized[key] = normalizedValue;
      }
    }
    
    return Object.keys(normalized).length === 0 ? null : normalized;
  };

  const submitChangeRequest = useMutation({
    mutationFn: async (data: EditPropertyForm) => {
      const changedFields: Record<string, any> = {};

      // Basic fields
      if (data.title !== property?.title) changedFields.title = { old: property?.title, new: data.title };
      if (data.description !== property?.description) changedFields.description = { old: property?.description, new: data.description };
      if (data.propertyType !== property?.propertyType) changedFields.propertyType = { old: property?.propertyType, new: data.propertyType };
      
      // Operation type
      const newPrice = data.isForRent ? parseFloat(data.price) : 0;
      const newSalePrice = data.isForSale ? parseFloat(data.salePrice || "0") : 0;
      if (newPrice !== (property?.price || 0)) changedFields.price = { old: property?.price, new: newPrice };
      if (newSalePrice !== (property?.salePrice || 0)) changedFields.salePrice = { old: property?.salePrice, new: newSalePrice };
      
      // Location
      if (data.location !== property?.location) changedFields.location = { old: property?.location, new: data.location };
      if (data.colonyId !== property?.colonyId) changedFields.colonyId = { old: property?.colonyId, new: data.colonyId || null };
      if (data.condominiumId !== property?.condominiumId) changedFields.condominiumId = { old: property?.condominiumId, new: data.condominiumId || null };
      if (data.unitNumber !== property?.unitNumber) changedFields.unitNumber = { old: property?.unitNumber, new: data.unitNumber || null };
      if (data.googleMapsUrl !== property?.googleMapsUrl) changedFields.googleMapsUrl = { old: property?.googleMapsUrl, new: data.googleMapsUrl || null };
      
      // Details
      if (data.bedrooms !== property?.bedrooms) changedFields.bedrooms = { old: property?.bedrooms, new: data.bedrooms };
      if (parseFloat(data.bathrooms) !== parseFloat(property?.bathrooms.toString() || "0")) {
        changedFields.bathrooms = { old: property?.bathrooms, new: parseFloat(data.bathrooms) };
      }
      if (parseFloat(data.area) !== parseFloat(property?.area?.toString() || "0")) {
        changedFields.area = { old: property?.area, new: parseFloat(data.area) };
      }
      if (data.petFriendly !== property?.petFriendly) changedFields.petFriendly = { old: property?.petFriendly, new: data.petFriendly };
      
      // Amenities
      const newAmenities = data.amenities || [];
      const oldAmenities = property?.amenities || [];
      if (JSON.stringify(newAmenities.sort()) !== JSON.stringify(oldAmenities.sort())) {
        changedFields.amenities = { old: oldAmenities, new: newAmenities };
      }

      // Services
      const newIncludedServices = {
        basicServices: {
          water: {
            included: data.waterIncluded,
            ...(data.waterProvider && { provider: data.waterProvider }),
            ...(data.waterCost && { cost: data.waterCost }),
          },
          electricity: {
            included: data.electricityIncluded,
            ...(data.electricityProvider && { provider: data.electricityProvider }),
            ...(data.electricityCost && { cost: data.electricityCost }),
            ...(data.electricityBillingCycle && { billingCycle: data.electricityBillingCycle }),
          },
          internet: {
            included: data.internetIncluded,
            ...(data.internetProvider && { provider: data.internetProvider }),
            ...(data.internetCost && { cost: data.internetCost }),
          },
        },
        additionalServices: additionalServices.map(({ id, ...service }) => service),
      };
      
      const oldIncludedServices = property?.includedServices;
      const normalizedNewServices = normalizeForComparison(newIncludedServices);
      const normalizedOldServices = normalizeForComparison(oldIncludedServices);
      if (JSON.stringify(normalizedNewServices) !== JSON.stringify(normalizedOldServices)) {
        changedFields.includedServices = { old: oldIncludedServices, new: newIncludedServices };
      }

      // Accepted lease durations
      const newDurations = data.acceptedLeaseDurations || [];
      const oldDurations = property?.acceptedLeaseDurations || [];
      if (JSON.stringify(newDurations.sort()) !== JSON.stringify(oldDurations.sort())) {
        changedFields.acceptedLeaseDurations = { old: oldDurations, new: newDurations };
      }

      // Access info
      const newAccessInfo = data.accessType === "unattended"
        ? {
            accessType: "unattended" as const,
            method: data.accessMethod,
            lockboxCode: data.accessMethod === "lockbox" ? data.lockboxCode : undefined,
            lockboxLocation: data.accessMethod === "lockbox" ? data.lockboxLocation : undefined,
            smartLockCode: data.accessMethod === "smart_lock" ? data.smartLockCode : undefined,
            smartLockInstructions: data.accessMethod === "smart_lock" ? data.smartLockInstructions : undefined,
            smartLockProvider: data.accessMethod === "smart_lock" ? data.smartLockProvider : undefined,
            smartLockExpirationDuration: data.accessMethod === "smart_lock" ? data.smartLockExpirationDuration : undefined,
            smartLockExpirationNotes: data.accessMethod === "smart_lock" ? data.smartLockExpirationNotes : undefined,
          }
        : data.accessType === "attended"
        ? {
            accessType: "attended" as const,
            contactPerson: data.contactPerson,
            contactPhone: data.contactPhone,
            contactNotes: data.contactNotes,
          }
        : undefined;

      const oldAccessInfo = property?.accessInfo;
      const normalizedNewAccess = normalizeForComparison(newAccessInfo);
      const normalizedOldAccess = normalizeForComparison(oldAccessInfo);
      if (JSON.stringify(normalizedNewAccess) !== JSON.stringify(normalizedOldAccess)) {
        changedFields.accessInfo = { old: oldAccessInfo, new: newAccessInfo };
      }

      // Photos - consolidate all photos into primaryImages and clear secondary/images
      const oldPhotos = [
        ...(property?.primaryImages || []),
        ...(property?.secondaryImages || []),
        ...(property?.images || [])
      ].filter((img, index, self) => img && self.indexOf(img) === index);
      
      if (JSON.stringify(photos) !== JSON.stringify(oldPhotos)) {
        changedFields.primaryImages = { old: property?.primaryImages || [], new: photos };
        // Clear secondary arrays since we're consolidating into primaryImages
        if (property?.secondaryImages && property.secondaryImages.length > 0) {
          changedFields.secondaryImages = { old: property.secondaryImages, new: [] };
        }
        if (property?.images && property.images.length > 0) {
          changedFields.images = { old: property.images, new: [] };
        }
      }
      
      if (coverImageIndex !== (property?.coverImageIndex || 0)) {
        changedFields.coverImageIndex = { old: property?.coverImageIndex || 0, new: coverImageIndex };
      }

      if (Object.keys(changedFields).length === 0) {
        throw new Error("No se detectaron cambios");
      }

      return await apiRequest("POST", "/api/owner/change-requests", {
        propertyId: id,
        changedFields,
      });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de cambio ha sido enviada para aprobación",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/properties", id, "detail"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/change-requests"] });
      setLocation(`/owner/property/${id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!property) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-semibold mb-2">Propiedad no encontrada</h3>
          <Button onClick={() => setLocation("/mis-propiedades")}>
            Volver a Mis Propiedades
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/owner/property/${id}`)}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Editar Propiedad
          </h1>
          <p className="text-muted-foreground mt-1">
            Los cambios serán enviados para aprobación del administrador
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => submitChangeRequest.mutate(data))}
          className="space-y-6"
        >
          {/* Tipo de Operación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Tipo de Operación
              </CardTitle>
              <CardDescription>
                Selecciona si quieres rentar, vender o ambas opciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isForRent"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-rent"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Renta</FormLabel>
                        <FormDescription>Ofrecer en renta</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isForSale"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-sale"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Venta</FormLabel>
                        <FormDescription>Ofrecer en venta</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {form.formState.errors.isForRent && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.isForRent.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Detalles principales de la propiedad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: Casa moderna en zona residencial"
                          data-testid="input-title"
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-property-type">
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="house">Casa</SelectItem>
                          <SelectItem value="apartment">Apartamento</SelectItem>
                          <SelectItem value="condo">Condominio</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="land">Terreno</SelectItem>
                          <SelectItem value="commercial">Comercial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe las características principales de la propiedad..."
                        rows={4}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {form.watch("isForRent") && (
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio de Renta (MXN/mes)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="15000"
                            data-testid="input-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("isForSale") && (
                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio de Venta (MXN)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="3500000"
                            data-testid="input-sale-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ubicación
              </CardTitle>
              <CardDescription>
                Detalles de la ubicación de la propiedad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación General</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: Tulum, Quintana Roo"
                        data-testid="input-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="colonyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colonia (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-colony">
                            <SelectValue placeholder="Selecciona una colonia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colonies.map((colony) => (
                            <SelectItem key={colony.id} value={colony.id}>
                              {colony.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="condominiumId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condominio (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-condominium">
                            <SelectValue placeholder="Selecciona un condominio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {condominiums.map((condo) => (
                            <SelectItem key={condo.id} value={condo.id}>
                              {condo.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="unitNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Unidad (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: 101, A-5"
                          data-testid="input-unit-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="googleMapsUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Maps URL (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://maps.google.com/..."
                          data-testid="input-google-maps"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Detalles y Características */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles y Características</CardTitle>
              <CardDescription>
                Características físicas de la propiedad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Habitaciones</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="3"
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
                          {...field}
                          type="number"
                          step="0.5"
                          min="0"
                          placeholder="2.5"
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
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="120"
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
                name="petFriendly"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Pet Friendly</FormLabel>
                      <FormDescription>
                        ¿Se aceptan mascotas en esta propiedad?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-pet-friendly"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-3">Amenidades</h4>
                <div className="flex flex-wrap gap-2">
                  {["Piscina", "Gimnasio", "Estacionamiento", "Seguridad 24/7", "Aire acondicionado", "WiFi"].map((amenity) => {
                    const isSelected = form.watch("amenities")?.includes(amenity);
                    return (
                      <Badge
                        key={amenity}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer hover-elevate"
                        onClick={() => toggleAmenity(amenity)}
                        data-testid={`badge-amenity-${amenity.toLowerCase().replace(/ /g, '-')}`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {amenity}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Galería de Fotos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Galería de Fotos
              </CardTitle>
              <CardDescription>
                Administra las fotos de tu propiedad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {photos.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No hay fotos agregadas</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddPhoto(true)}
                    data-testid="button-add-first-photo"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primera Foto
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {photos.map((photo, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-md bg-card"
                      >
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{photo.split('/').pop()}</p>
                          {index === coverImageIndex && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              <Star className="w-3 h-3 mr-1" />
                              Foto de Portada
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {index !== coverImageIndex && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSetCover(index)}
                              title="Establecer como portada"
                              data-testid={`button-set-cover-${index}`}
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            title="Mover arriba"
                            data-testid={`button-move-up-${index}`}
                          >
                            <MoveUp className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === photos.length - 1}
                            title="Mover abajo"
                            data-testid={`button-move-down-${index}`}
                          >
                            <MoveDown className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemovePhoto(index)}
                            title="Eliminar"
                            data-testid={`button-remove-photo-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!showAddPhoto && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAddPhoto(true)}
                      data-testid="button-add-photo"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Foto
                    </Button>
                  )}
                </>
              )}

              {showAddPhoto && (
                <div className="space-y-3 p-4 border rounded-md bg-muted/50">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Seleccionar Foto</label>
                    <Input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleAddPhoto(file);
                        }
                      }}
                      data-testid="input-photo-file"
                    />
                    <p className="text-xs text-muted-foreground">
                      Selecciona una imagen (JPG, PNG o WEBP, máximo 10MB)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddPhoto(false)}
                      data-testid="button-cancel-add-photo"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Servicios */}
          {form.watch("isForRent") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Servicios y Utilidades
                </CardTitle>
                <CardDescription>
                  Configura los servicios incluidos en la renta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Agua */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-5 h-5 text-blue-500" />
                      <div>
                        <h4 className="text-sm font-medium">Agua</h4>
                        <p className="text-xs text-muted-foreground">Servicio de agua potable</p>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="waterIncluded"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-water-included"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  {!waterIncluded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                      <FormField
                        control={form.control}
                        name="waterProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proveedor</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: CAPA" data-testid="input-water-provider" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="waterCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Costo aprox. (MXN/mes)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: 300" data-testid="input-water-cost" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Electricidad */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <div>
                        <h4 className="text-sm font-medium">Electricidad</h4>
                        <p className="text-xs text-muted-foreground">Servicio eléctrico</p>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="electricityIncluded"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-electricity-included"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  {!electricityIncluded && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
                      <FormField
                        control={form.control}
                        name="electricityProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proveedor</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: CFE" data-testid="input-electricity-provider" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="electricityCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Costo aprox. (MXN/mes)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: 800" data-testid="input-electricity-cost" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="electricityBillingCycle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Periodicidad</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-electricity-billing">
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="monthly">Mensual</SelectItem>
                                <SelectItem value="bimonthly">Bimestral</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Internet */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-5 h-5 text-purple-500" />
                      <div>
                        <h4 className="text-sm font-medium">Internet</h4>
                        <p className="text-xs text-muted-foreground">Servicio de internet</p>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="internetIncluded"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-internet-included"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  {!internetIncluded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                      <FormField
                        control={form.control}
                        name="internetProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proveedor</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: Telmex" data-testid="input-internet-provider" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="internetCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Costo aprox. (MXN/mes)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: 500" data-testid="input-internet-cost" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Servicios Adicionales */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Servicios Adicionales (opcional)</h4>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddAdditionalService("pool_cleaning")}
                        data-testid="button-add-pool"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Alberca
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddAdditionalService("garden")}
                        data-testid="button-add-garden"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Jardín
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddAdditionalService("gas")}
                        data-testid="button-add-gas"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Gas
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddAdditionalService("custom")}
                        data-testid="button-add-custom"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Otros
                      </Button>
                    </div>
                  </div>

                  {additionalServices.map((service) => (
                    <div key={service.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 border rounded-lg">
                      <div>
                        <Label>Servicio</Label>
                        {service.type === "custom" ? (
                          <Input
                            value={service.customName || ""}
                            onChange={(e) => handleUpdateAdditionalService(service.id, "customName", e.target.value)}
                            placeholder="Nombre del servicio"
                            className="mt-1"
                            data-testid={`input-custom-name-${service.id}`}
                          />
                        ) : (
                          <p className="text-sm mt-1">{serviceLabels[service.type as keyof typeof serviceLabels]}</p>
                        )}
                      </div>
                      <div>
                        <Label>Proveedor</Label>
                        <Input
                          value={service.provider}
                          onChange={(e) => handleUpdateAdditionalService(service.id, "provider", e.target.value)}
                          placeholder="Nombre del proveedor"
                          data-testid={`input-provider-${service.id}`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label>Costo (MXN/mes)</Label>
                          <Input
                            value={service.cost}
                            onChange={(e) => handleUpdateAdditionalService(service.id, "cost", e.target.value)}
                            placeholder="Ej: 500"
                            data-testid={`input-cost-${service.id}`}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAdditionalService(service.id)}
                          className="mt-6"
                          data-testid={`button-remove-${service.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Duraciones de Arrendamiento */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Duraciones de Arrendamiento Aceptadas *</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Selecciona las duraciones que aceptas para el arrendamiento
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {leaseDurations.map((duration) => {
                      const isSelected = form.watch("acceptedLeaseDurations")?.includes(duration.value);
                      return (
                        <Badge
                          key={duration.value}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer hover-elevate"
                          onClick={() => toggleDuration(duration.value)}
                          data-testid={`badge-duration-${duration.value}`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {duration.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información de Acceso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Información de Acceso
              </CardTitle>
              <CardDescription>
                Configura cómo el personal autorizado podrá acceder a tu propiedad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="w-4 h-4" />
                    Privacidad y Seguridad
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Esta información es privada y solo será compartida con personal autorizado cuando tengan citas confirmadas
                  </CardDescription>
                </CardHeader>
              </Card>

              <FormField
                control={form.control}
                name="accessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Acceso *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem
                            value="unattended"
                            id="unattended"
                            className="peer sr-only pointer-events-none"
                          />
                          <Label
                            htmlFor="unattended"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover-elevate peer-data-[state=checked]:border-primary cursor-pointer"
                            data-testid="radio-unattended"
                            onClick={(e) => {
                              e.preventDefault();
                              field.onChange("unattended");
                            }}
                          >
                            <Lock className="mb-3 h-6 w-6" />
                            <div className="text-center">
                              <div className="font-semibold">Desatendido</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Acceso con lockbox o cerradura inteligente
                              </div>
                            </div>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="attended"
                            id="attended"
                            className="peer sr-only pointer-events-none"
                          />
                          <Label
                            htmlFor="attended"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover-elevate peer-data-[state=checked]:border-primary cursor-pointer"
                            data-testid="radio-attended"
                            onClick={(e) => {
                              e.preventDefault();
                              field.onChange("attended");
                            }}
                          >
                            <User className="mb-3 h-6 w-6" />
                            <div className="text-center">
                              <div className="font-semibold">Asistido</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Alguien abrirá la propiedad
                              </div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {accessType === "unattended" && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="accessMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Acceso *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-access-method">
                              <SelectValue placeholder="Selecciona el método" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lockbox">Lockbox con clave única</SelectItem>
                            <SelectItem value="smart_lock">Cerradura inteligente con clave variable</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {accessMethod === "lockbox" && (
                    <>
                      <FormField
                        control={form.control}
                        name="lockboxCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código del Lockbox *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ej: 1234"
                                data-testid="input-lockbox-code"
                              />
                            </FormControl>
                            <FormDescription>
                              El código que el personal usará para abrir el lockbox
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lockboxLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ubicación del Lockbox (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ej: En la puerta principal, lado derecho"
                                data-testid="input-lockbox-location"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {accessMethod === "smart_lock" && (
                    <>
                      <FormField
                        control={form.control}
                        name="smartLockCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código de Cerradura (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ej: 123456"
                                data-testid="input-smart-lock-code"
                              />
                            </FormControl>
                            <FormDescription>
                              El código que el personal usará para abrir la cerradura
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="smartLockProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proveedor de Cerradura (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ej: August, Yale, Schlage"
                                data-testid="input-smart-lock-provider"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="smartLockExpirationDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vigencia del Código</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-smart-lock-expiration">
                                  <SelectValue placeholder="Selecciona vigencia del código" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ongoing">Válido indefinidamente</SelectItem>
                                <SelectItem value="same_day">Vence el día de la cita</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Indica si el código tiene vigencia permanente o vence el día de cada cita
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="smartLockExpirationNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notas sobre Vigencia (opcional)</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Notas adicionales sobre la vigencia del código..."
                                rows={2}
                                data-testid="textarea-smart-lock-expiration-notes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="smartLockInstructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instrucciones de Acceso (opcional)</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Describe cómo generar o usar el código..."
                                rows={3}
                                data-testid="textarea-smart-lock-instructions"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              )}

              {accessType === "attended" && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de Contacto *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Nombre de la persona que abrirá"
                            data-testid="input-contact-person"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono de Contacto *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="+52 998 123 4567"
                            data-testid="input-contact-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas Adicionales (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Cualquier información adicional..."
                            rows={3}
                            data-testid="textarea-contact-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              type="submit"
              disabled={submitChangeRequest.isPending}
              data-testid="button-submit"
            >
              <Save className="h-4 w-4 mr-2" />
              {submitChangeRequest.isPending ? "Enviando..." : "Enviar para Aprobación"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`/owner/property/${id}`)}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
