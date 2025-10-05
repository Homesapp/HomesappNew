import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Upload, X, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const mediaSchema = z.object({
  primaryImages: z.array(z.string()).min(1, "Debes agregar al menos 1 imagen principal").max(5, "Máximo 5 imágenes principales"),
  coverImageIndex: z.number().min(0).default(0),
  secondaryImages: z.array(z.string()).max(20, "Máximo 20 imágenes secundarias").optional(),
  videos: z.array(z.string()).optional(),
  virtualTourUrl: z.string().url().optional().or(z.literal("")),
});

type MediaForm = z.infer<typeof mediaSchema>;

type Step5Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
};

export default function Step5Media({ data, onUpdate, onNext, onPrevious }: Step5Props) {
  // Migrate legacy data if needed
  const initializePrimaryImages = () => {
    if (data.media?.primaryImages && data.media.primaryImages.length > 0) {
      return data.media.primaryImages;
    }
    // Migrate from legacy images array
    if (data.media?.images && data.media.images.length > 0) {
      return data.media.images.slice(0, 5);
    }
    return [];
  };

  const initializeSecondaryImages = () => {
    if (data.media?.secondaryImages && data.media.secondaryImages.length > 0) {
      return data.media.secondaryImages;
    }
    // Migrate from legacy images array
    if (data.media?.images && data.media.images.length > 5) {
      return data.media.images.slice(5, 25); // Max 20 secondary
    }
    return [];
  };

  const initializeCoverIndex = () => {
    if (data.media?.coverImageIndex !== undefined) {
      return data.media.coverImageIndex;
    }
    return 0; // Default to first image
  };

  const [primaryImages, setPrimaryImages] = useState<string[]>(initializePrimaryImages());
  const [secondaryImages, setSecondaryImages] = useState<string[]>(initializeSecondaryImages());
  const [coverImageIndex, setCoverImageIndex] = useState<number>(initializeCoverIndex());
  const [currentPrimaryUrl, setCurrentPrimaryUrl] = useState("");
  const [currentSecondaryUrl, setCurrentSecondaryUrl] = useState("");

  const form = useForm<MediaForm>({
    resolver: zodResolver(mediaSchema),
    defaultValues: {
      primaryImages: initializePrimaryImages(),
      coverImageIndex: initializeCoverIndex(),
      secondaryImages: initializeSecondaryImages(),
      videos: data.media?.videos || [],
      virtualTourUrl: data.media?.virtualTourUrl || "",
    },
  });

  const onSubmit = (formData: MediaForm) => {
    const allImages = [...primaryImages, ...secondaryImages];
    const mediaData = {
      ...formData,
      primaryImages,
      secondaryImages,
      coverImageIndex,
      images: allImages, // Backward compatibility
    };
    onUpdate({ media: mediaData });
    onNext();
  };

  const handleAddPrimaryImage = () => {
    if (currentPrimaryUrl && currentPrimaryUrl.trim() && primaryImages.length < 5) {
      const newImages = [...primaryImages, currentPrimaryUrl.trim()];
      setPrimaryImages(newImages);
      form.setValue("primaryImages", newImages);
      setCurrentPrimaryUrl("");
    }
  };

  const handleRemovePrimaryImage = (index: number) => {
    const newImages = primaryImages.filter((_, i) => i !== index);
    setPrimaryImages(newImages);
    form.setValue("primaryImages", newImages);
    
    if (coverImageIndex === index) {
      setCoverImageIndex(0);
      form.setValue("coverImageIndex", 0);
    } else if (coverImageIndex > index) {
      const newIndex = coverImageIndex - 1;
      setCoverImageIndex(newIndex);
      form.setValue("coverImageIndex", newIndex);
    }
  };

  const handleSetCoverImage = (index: number) => {
    setCoverImageIndex(index);
    form.setValue("coverImageIndex", index);
  };

  const handleAddSecondaryImage = () => {
    if (currentSecondaryUrl && currentSecondaryUrl.trim() && secondaryImages.length < 20) {
      const newImages = [...secondaryImages, currentSecondaryUrl.trim()];
      setSecondaryImages(newImages);
      form.setValue("secondaryImages", newImages);
      setCurrentSecondaryUrl("");
    }
  };

  const handleRemoveSecondaryImage = (index: number) => {
    const newImages = secondaryImages.filter((_, i) => i !== index);
    setSecondaryImages(newImages);
    form.setValue("secondaryImages", newImages);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step5-title">
          Fotos y Videos
        </h2>
        <p className="text-muted-foreground" data-testid="text-step5-description">
          Agrega imágenes y videos de la propiedad
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Imágenes Principales
                <Badge variant="secondary">{primaryImages.length}/5</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Agrega de 1 a 5 imágenes principales. Selecciona una como portada.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="URL de la imagen principal"
                  value={currentPrimaryUrl}
                  onChange={(e) => setCurrentPrimaryUrl(e.target.value)}
                  disabled={primaryImages.length >= 5}
                  data-testid="input-primary-image-url"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddPrimaryImage}
                  disabled={primaryImages.length >= 5 || !currentPrimaryUrl.trim()}
                  data-testid="button-add-primary-image"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>

              {form.formState.errors.primaryImages && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.primaryImages.message}
                </p>
              )}

              {primaryImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {primaryImages.map((url, index) => (
                    <Card key={index} data-testid={`card-primary-image-${index}`}>
                      <CardContent className="p-2">
                        <div className="relative">
                          <img
                            src={url}
                            alt={`Imagen principal ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                            data-testid={`img-primary-preview-${index}`}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => handleRemovePrimaryImage(index)}
                            data-testid={`button-remove-primary-image-${index}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            variant={coverImageIndex === index ? "default" : "secondary"}
                            size="icon"
                            className="absolute bottom-1 right-1 h-6 w-6"
                            onClick={() => handleSetCoverImage(index)}
                            data-testid={`button-set-cover-${index}`}
                          >
                            <Star className={`w-3 h-3 ${coverImageIndex === index ? 'fill-current' : ''}`} />
                          </Button>
                          {coverImageIndex === index && (
                            <Badge className="absolute top-1 left-1" data-testid={`badge-cover-${index}`}>
                              Portada
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Imágenes Secundarias (Opcional)
                <Badge variant="secondary">{secondaryImages.length}/20</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Agrega hasta 20 imágenes adicionales de la propiedad
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="URL de la imagen secundaria"
                  value={currentSecondaryUrl}
                  onChange={(e) => setCurrentSecondaryUrl(e.target.value)}
                  disabled={secondaryImages.length >= 20}
                  data-testid="input-secondary-image-url"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSecondaryImage}
                  disabled={secondaryImages.length >= 20 || !currentSecondaryUrl.trim()}
                  data-testid="button-add-secondary-image"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>

              {secondaryImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {secondaryImages.map((url, index) => (
                    <Card key={index} data-testid={`card-secondary-image-${index}`}>
                      <CardContent className="p-2">
                        <div className="relative">
                          <img
                            src={url}
                            alt={`Imagen secundaria ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                            data-testid={`img-secondary-preview-${index}`}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => handleRemoveSecondaryImage(index)}
                            data-testid={`button-remove-secondary-image-${index}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <FormField
            control={form.control}
            name="virtualTourUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tour Virtual (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://ejemplo.com/tour-virtual"
                    {...field}
                    data-testid="input-virtual-tour"
                  />
                </FormControl>
                <FormDescription data-testid="text-tour-description">
                  URL del recorrido virtual de la propiedad
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
              data-testid="button-previous-step5"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button type="submit" data-testid="button-next-step5">
              Continuar
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
