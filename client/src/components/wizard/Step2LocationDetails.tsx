import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { SuggestColonyDialog } from "@/components/SuggestColonyDialog";
import { SuggestCondoDialog } from "@/components/SuggestCondoDialog";
import { SuggestAmenityDialog } from "@/components/SuggestAmenityDialog";
import { getTranslation, Language } from "@/lib/wizardTranslations";
import type { Colony, Condominium, Amenity } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

const getStep2Schema = (language: Language) => {
  const t = getTranslation(language);
  return z.object({
    // Ubicación
    address: z.string().min(5, t.errors.addressMin),
    city: z.string().min(2, t.errors.cityRequired),
    state: z.string().min(2, t.errors.stateRequired),
    zipCode: z.string().min(4, t.errors.zipCodeMin),
    colonyId: z.string().optional(),
    condominiumId: z.string().optional(),
    unitNumber: z.string().optional(),
    googleMapsUrl: z.string().url(t.errors.invalidUrl).optional().or(z.literal("")),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    // Detalles
    bedrooms: z.coerce.number().int().min(0, t.errors.bedroomsPositive),
    bathrooms: z.coerce.number().min(0, t.errors.bathroomsPositive),
    area: z.string()
      .optional()
      .transform((val) => (val === "" || val === undefined) ? undefined : Number(val))
      .refine((val) => val === undefined || val >= 1, { message: t.errors.areaGreaterThanZero }),
    propertyAmenities: z.array(z.string()).optional().default([]),
    condoAmenities: z.array(z.string()).optional().default([]),
  });
};

type Step2Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  onPrevious: () => void;
  language?: Language;
};

export default function Step2LocationDetails({ data, onUpdate, onNext, onPrevious, language = "es" }: Step2Props) {
  const t = getTranslation(language);
  const step2Schema = getStep2Schema(language);
  type Step2Form = z.infer<typeof step2Schema>;
  const [showColonyDialog, setShowColonyDialog] = useState(false);
  const [showCondoDialog, setShowCondoDialog] = useState(false);
  const [showAmenityDialog, setShowAmenityDialog] = useState(false);

  // Determine if property type supports condo amenities
  // Houses and land don't have condo amenities
  const propertyType = (data.propertyType || "").toLowerCase();
  const supportsCondoAmenities = !["house", "land"].includes(propertyType);

  // Fetch approved colonies
  const { data: colonies = [] } = useQuery<Colony[]>({
    queryKey: ["/api/colonies/approved"],
  });

  // Fetch approved condominiums
  const { data: condominiums = [] } = useQuery<Condominium[]>({
    queryKey: ["/api/condominiums/approved"],
  });

  // Fetch approved amenities by category
  const { data: propertyAmenitiesList = [] } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities/approved", "property"],
    queryFn: async () => {
      const response = await fetch("/api/amenities/approved?category=property");
      if (!response.ok) throw new Error("Failed to fetch property amenities");
      return response.json();
    },
  });

  const { data: condoAmenitiesList = [] } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities/approved", "condo"],
    queryFn: async () => {
      const response = await fetch("/api/amenities/approved?category=condo");
      if (!response.ok) throw new Error("Failed to fetch condo amenities");
      return response.json();
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
      bedrooms: data.details?.bedrooms?.toString() || "",
      bathrooms: data.details?.bathrooms?.toString() || "",
      area: data.details?.area?.toString() || "",
      propertyAmenities: data.details?.propertyAmenities || [],
      condoAmenities: data.details?.condoAmenities || [],
    },
  });

  const onSubmit = async (formData: Step2Form) => {
    // Transform empty strings to undefined for optional fields
    const cleanedData = {
      locationInfo: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        colonyId: formData.colonyId && formData.colonyId.trim() !== "" ? formData.colonyId : undefined,
        condominiumId: formData.condominiumId && formData.condominiumId.trim() !== "" ? formData.condominiumId : undefined,
        unitNumber: formData.unitNumber && formData.unitNumber.trim() !== "" ? formData.unitNumber : undefined,
        googleMapsUrl: formData.googleMapsUrl && formData.googleMapsUrl.trim() !== "" ? formData.googleMapsUrl : undefined,
        latitude: formData.latitude && formData.latitude.trim() !== "" ? formData.latitude : undefined,
        longitude: formData.longitude && formData.longitude.trim() !== "" ? formData.longitude : undefined,
      },
      details: {
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        area: formData.area,
        propertyAmenities: formData.propertyAmenities || [],
        condoAmenities: formData.condoAmenities || [],
      },
    };
    onNext(cleanedData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step2-title">
          {t.step2.title}
        </h2>
        <p className="text-muted-foreground" data-testid="text-step2-description">
          {t.step2.subtitle}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Sección de Ubicación */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.step2.location}</h3>
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.step2.address} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.step2.addressPlaceholder}
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
                    <FormLabel>{t.step2.city} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.step2.cityPlaceholder}
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
                    <FormLabel>{t.step2.state} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.step2.statePlaceholder}
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
                    <FormLabel>{t.step2.zipCode} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.step2.zipCodePlaceholder}
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
                  <FormLabel>{t.step2.colony}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.step2.colonyPlaceholder || "Ingrese el nombre de la colonia"}
                      {...field}
                      value={field.value || ""}
                      data-testid="input-colony"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {language === "es" 
                      ? "Ingrese el nombre de la colonia manualmente" 
                      : "Enter the colony name manually"}
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
                  <FormLabel>{t.step2.condominium}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.step2.condominiumPlaceholder || "Ingrese el nombre del condominio"}
                      {...field}
                      value={field.value || ""}
                      data-testid="input-condominium"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {language === "es" 
                      ? "Ingrese el nombre del condominio manualmente" 
                      : "Enter the condominium name manually"}
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
                  <FormLabel>{t.step2.unitNumber}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.step2.unitNumberPlaceholder}
                      {...field}
                      data-testid="input-unit-number"
                    />
                  </FormControl>
                  <FormDescription>
                    {t.step2.unitNumberDescription}
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
                  <FormLabel>{t.step2.googleMapsUrl}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.step2.googleMapsUrlPlaceholder}
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
              <h3 className="text-lg font-semibold mb-2">{t.step2.characteristics}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.step2.bedrooms} *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder={t.step2.bedroomsPlaceholder}
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
                    <FormLabel>{t.step2.bathrooms} *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        placeholder={t.step2.bathroomsPlaceholder}
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
                    <FormLabel>{t.step2.area} *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder={t.step2.areaPlaceholder}
                        {...field}
                        data-testid="input-area"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Características de la Propiedad */}
            <FormField
              control={form.control}
              name="propertyAmenities"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel>{t.step2.propertyAmenities}</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAmenityDialog(true)}
                      data-testid="button-suggest-amenity"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t.step2.suggest}
                    </Button>
                  </div>
                  <FormControl>
                    <div className="flex flex-wrap gap-2" data-testid="container-property-amenities">
                      {propertyAmenitiesList.map((amenity) => {
                        const isSelected = field.value?.includes(amenity.id);
                        return (
                          <Badge
                            key={amenity.id}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer hover-elevate active-elevate-2"
                            onClick={() => {
                              const newValue = isSelected
                                ? field.value?.filter((id) => id !== amenity.id) || []
                                : [...(field.value || []), amenity.id];
                              field.onChange(newValue);
                            }}
                            data-testid={`badge-property-amenity-${amenity.id}`}
                          >
                            {amenity.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amenidades del Condominio - Solo para apartamentos, condos, oficinas, y comerciales */}
            {supportsCondoAmenities && (
              <FormField
                control={form.control}
                name="condoAmenities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.step2.condoAmenities}</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2" data-testid="container-condo-amenities">
                        {condoAmenitiesList.map((amenity) => {
                          const isSelected = field.value?.includes(amenity.id);
                          return (
                            <Badge
                              key={amenity.id}
                              variant={isSelected ? "default" : "outline"}
                              className="cursor-pointer hover-elevate active-elevate-2"
                              onClick={() => {
                                const newValue = isSelected
                                  ? field.value?.filter((id) => id !== amenity.id) || []
                                  : [...(field.value || []), amenity.id];
                                field.onChange(newValue);
                              }}
                              data-testid={`badge-condo-amenity-${amenity.id}`}
                            >
                              {amenity.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="w-full sm:w-auto"
              data-testid="button-previous-step2"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t.previous}
            </Button>
            <Button type="submit" className="w-full sm:w-auto" data-testid="button-next-step2">
              {t.next}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>

      <SuggestColonyDialog
        open={showColonyDialog}
        onOpenChange={setShowColonyDialog}
      />
      
      <SuggestCondoDialog
        open={showCondoDialog}
        onOpenChange={setShowCondoDialog}
      />

      <SuggestAmenityDialog
        open={showAmenityDialog}
        onOpenChange={setShowAmenityDialog}
      />
    </div>
  );
}
