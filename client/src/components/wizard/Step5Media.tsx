import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Upload, X, Star, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getTranslation, Language } from "@/lib/wizardTranslations";

const getMediaSchema = (language: Language) => {
  const t = getTranslation(language);
  return z.object({
    primaryImages: z.array(z.string()).min(1, t.errors.primaryImagesMin).max(5, t.errors.primaryImagesMax),
    coverImageIndex: z.number().min(0).default(0),
    secondaryImages: z.array(z.string()).max(20, t.errors.secondaryImagesMax).optional(),
    videos: z.array(z.string()).optional(),
    virtualTourUrl: z.string().url(t.errors.invalidUrl).optional().or(z.literal("")),
  });
};

type Step5Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  onPrevious: () => void;
  language?: Language;
};

export default function Step5Media({ data, onUpdate, onNext, onPrevious, language = "es" }: Step5Props) {
  const t = getTranslation(language);
  const mediaSchema = getMediaSchema(language);
  type MediaForm = z.infer<typeof mediaSchema>;
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
  
  const primaryFileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
    onNext({ media: mediaData });
  };

  const handleAddPrimaryImage = () => {
    primaryFileInputRef.current?.click();
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

  // Drag and drop handlers for primary images
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/html"));
    
    if (dragIndex === dropIndex) return;

    const newImages = [...primaryImages];
    const draggedImage = newImages[dragIndex];
    newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    setPrimaryImages(newImages);
    form.setValue("primaryImages", newImages);

    // Update cover index if needed
    if (coverImageIndex === dragIndex) {
      setCoverImageIndex(dropIndex);
      form.setValue("coverImageIndex", dropIndex);
    } else if (dragIndex < coverImageIndex && dropIndex >= coverImageIndex) {
      const newCoverIndex = coverImageIndex - 1;
      setCoverImageIndex(newCoverIndex);
      form.setValue("coverImageIndex", newCoverIndex);
    } else if (dragIndex > coverImageIndex && dropIndex <= coverImageIndex) {
      const newCoverIndex = coverImageIndex + 1;
      setCoverImageIndex(newCoverIndex);
      form.setValue("coverImageIndex", newCoverIndex);
    }
  };

  // Drag and drop handlers for secondary images
  const handleSecondaryDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index.toString());
  };

  const handleSecondaryDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/html"));
    
    if (dragIndex === dropIndex) return;

    const newImages = [...secondaryImages];
    const draggedImage = newImages[dragIndex];
    newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    setSecondaryImages(newImages);
    form.setValue("secondaryImages", newImages);
  };

  const handleAddSecondaryImage = () => {
    secondaryFileInputRef.current?.click();
  };

  const handleRemoveSecondaryImage = (index: number) => {
    const newImages = secondaryImages.filter((_, i) => i !== index);
    setSecondaryImages(newImages);
    form.setValue("secondaryImages", newImages);
  };

  const handlePrimaryFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const filesArray = Array.from(files);

    // Validate files first
    filesArray.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: t.errors.error,
          description: `${file.name}: ${t.step3.onlyImageFiles}`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t.errors.error,
          description: `${file.name} ${t.step3.exceeds5MB}`,
          variant: "destructive",
        });
        return;
      }

      if (primaryImages.length + validFiles.length >= 5) {
        return;
      }

      validFiles.push(file);
    });

    // Process valid files
    if (validFiles.length > 0) {
      const readFilePromises = validFiles.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      const base64Images = await Promise.all(readFilePromises);
      setPrimaryImages((prev) => {
        const available = 5 - prev.length;
        const imagesToAdd = base64Images.slice(0, available);
        const updatedImages = [...prev, ...imagesToAdd];
        form.setValue("primaryImages", updatedImages);
        return updatedImages;
      });
    }

    if (primaryFileInputRef.current) {
      primaryFileInputRef.current.value = "";
    }
  };

  const handleSecondaryFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const filesArray = Array.from(files);

    // Validate files first
    filesArray.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: t.errors.error,
          description: `${file.name}: ${t.step3.onlyImageFiles}`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t.errors.error,
          description: `${file.name} ${t.step3.exceeds5MB}`,
          variant: "destructive",
        });
        return;
      }

      if (secondaryImages.length + validFiles.length >= 20) {
        return;
      }

      validFiles.push(file);
    });

    // Process valid files
    if (validFiles.length > 0) {
      const readFilePromises = validFiles.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      const base64Images = await Promise.all(readFilePromises);
      setSecondaryImages((prev) => {
        const available = 20 - prev.length;
        const imagesToAdd = base64Images.slice(0, available);
        const updatedImages = [...prev, ...imagesToAdd];
        form.setValue("secondaryImages", updatedImages);
        return updatedImages;
      });
    }

    if (secondaryFileInputRef.current) {
      secondaryFileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step5-title">
          {t.step3.title}
        </h2>
        <p className="text-muted-foreground" data-testid="text-step5-description">
          {t.step3.subtitle}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {t.step3.primaryImages}
                <Badge variant="secondary">{primaryImages.length}/5</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t.step3.primaryImagesDescription}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={primaryFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                multiple
                onChange={handlePrimaryFileUpload}
                className="hidden"
                data-testid="input-primary-file"
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={handleAddPrimaryImage}
                disabled={primaryImages.length >= 5}
                data-testid="button-add-primary-image"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t.step3.addImages}
              </Button>

              {form.formState.errors.primaryImages && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.primaryImages.message}
                </p>
              )}

              {primaryImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {primaryImages.map((url, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className="cursor-move"
                      data-testid={`card-primary-image-${index}`}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
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
                              className="absolute top-1 right-1 h-7 w-7 flex items-center justify-center"
                              onClick={() => handleRemovePrimaryImage(index)}
                              data-testid={`button-remove-primary-image-${index}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={coverImageIndex === index ? "default" : "secondary"}
                              size="icon"
                              className="absolute bottom-1 right-1 h-7 w-7 flex items-center justify-center"
                              onClick={() => handleSetCoverImage(index)}
                              data-testid={`button-set-cover-${index}`}
                            >
                              <Star className={`w-4 h-4 ${coverImageIndex === index ? 'fill-current' : ''}`} />
                            </Button>
                            {coverImageIndex === index && (
                              <Badge className="absolute top-1 left-1" data-testid={`badge-cover-${index}`}>
                                {t.step3.cover}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {t.step3.secondaryImages}
                <Badge variant="secondary">{secondaryImages.length}/20</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t.step3.secondaryImagesDescription}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={secondaryFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                multiple
                onChange={handleSecondaryFileUpload}
                className="hidden"
                data-testid="input-secondary-file"
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSecondaryImage}
                disabled={secondaryImages.length >= 20}
                data-testid="button-add-secondary-image"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t.step3.addImages}
              </Button>

              {secondaryImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {secondaryImages.map((url, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleSecondaryDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleSecondaryDrop(e, index)}
                      className="cursor-move"
                      data-testid={`card-secondary-image-${index}`}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
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
                              className="absolute top-1 right-1 h-7 w-7 flex items-center justify-center"
                              onClick={() => handleRemoveSecondaryImage(index)}
                              data-testid={`button-remove-secondary-image-${index}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
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
                <FormLabel>{t.step3.virtualTour}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.step3.virtualTourPlaceholder}
                    {...field}
                    data-testid="input-virtual-tour"
                  />
                </FormControl>
                <FormDescription data-testid="text-tour-description">
                  {t.step3.virtualTourDescription}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="w-full sm:w-auto"
              data-testid="button-previous-step5"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t.previous}
            </Button>
            <Button type="submit" className="w-full sm:w-auto" data-testid="button-next-step5">
              {t.next}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
