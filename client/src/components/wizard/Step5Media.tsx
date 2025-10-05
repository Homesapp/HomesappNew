import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const mediaSchema = z.object({
  images: z.array(z.string()).optional(),
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
  const [imageUrls, setImageUrls] = useState<string[]>(data.media?.images || []);
  const [currentImageUrl, setCurrentImageUrl] = useState("");

  const form = useForm<MediaForm>({
    resolver: zodResolver(mediaSchema),
    defaultValues: {
      images: data.media?.images || [],
      videos: data.media?.videos || [],
      virtualTourUrl: data.media?.virtualTourUrl || "",
    },
  });

  const onSubmit = (formData: MediaForm) => {
    const mediaData = {
      ...formData,
      images: imageUrls,
    };
    onUpdate({ media: mediaData });
    onNext();
  };

  const handleAddImage = () => {
    if (currentImageUrl && currentImageUrl.trim()) {
      const newImages = [...imageUrls, currentImageUrl.trim()];
      setImageUrls(newImages);
      form.setValue("images", newImages);
      setCurrentImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImages);
    form.setValue("images", newImages);
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <FormItem>
              <FormLabel>Imágenes</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="URL de la imagen"
                  value={currentImageUrl}
                  onChange={(e) => setCurrentImageUrl(e.target.value)}
                  data-testid="input-image-url"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddImage}
                  data-testid="button-add-image"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
              <FormDescription data-testid="text-images-description">
                Agrega URLs de imágenes de la propiedad
              </FormDescription>
            </FormItem>

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imageUrls.map((url, index) => (
                  <Card key={index} data-testid={`card-image-${index}`}>
                    <CardContent className="p-2">
                      <div className="relative">
                        <img
                          src={url}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                          data-testid={`img-preview-${index}`}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => handleRemoveImage(index)}
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

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
