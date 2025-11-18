import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Upload, X, Star, Image as ImageIcon, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getTranslation, Language } from "@/lib/wizardTranslations";
import { compressImage, formatFileSize } from "@/lib/imageCompression";

const getMediaSchema = (language: Language) => {
  const t = getTranslation(language);
  return z.object({
    primaryImages: z.array(z.string()).min(1, t.errors.primaryImagesMin).max(5, t.errors.primaryImagesMax),
    coverImageIndex: z.number().min(0).default(0),
    secondaryImages: z.array(z.string()).max(20, t.errors.secondaryImagesMax).optional(),
    videos: z.array(z.string()).optional(),
    virtualTourUrl: z.string().url(t.errors.invalidUrl).optional().or(z.literal("")),
    requestVirtualTour: z.boolean().default(false).optional(),
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
  const [uploadingPrimary, setUploadingPrimary] = useState<Map<string, number>>(new Map());
  const [uploadingSecondary, setUploadingSecondary] = useState<Map<string, number>>(new Map());
  
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
      requestVirtualTour: data.media?.requestVirtualTour || false,
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

      // Remove size limit check - we'll compress instead
      if (primaryImages.length + validFiles.length >= 5) {
        return;
      }

      validFiles.push(file);
    });

    // Process valid files with compression and progress tracking
    if (validFiles.length > 0) {
      const compressedImages: string[] = [];
      
      for (const file of validFiles) {
        const fileId = `${file.name}_${Date.now()}_${Math.random()}`;
        
        try {
          // Update progress state
          setUploadingPrimary(prev => new Map(prev).set(fileId, 0));
          console.log('[Primary] Starting compression for:', file.name);
          
          // Compress image with progress callback
          const result = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85,
            onProgress: (progress) => {
              console.log('[Primary] Compression progress:', progress);
              setUploadingPrimary(prev => new Map(prev).set(fileId, progress));
            },
          });
          console.log('[Primary] Compression complete for:', file.name);
          
          compressedImages.push(result.base64);
          
          // Show compression stats
          if (result.compressionRatio > 10) {
            toast({
              title: "Imagen comprimida",
              description: `${file.name}: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (${Math.round(result.compressionRatio)}% reducción)`,
              duration: 3000,
            });
          }
          
          // Remove from uploading state
          setUploadingPrimary(prev => {
            const next = new Map(prev);
            next.delete(fileId);
            return next;
          });
        } catch (error) {
          console.error('Error compressing image:', error);
          toast({
            title: t.errors.error,
            description: `${file.name}: Error al procesar imagen`,
            variant: "destructive",
          });
          
          // Remove from uploading state
          setUploadingPrimary(prev => {
            const next = new Map(prev);
            next.delete(fileId);
            return next;
          });
        }
      }

      if (compressedImages.length > 0) {
        setPrimaryImages((prev) => {
          const available = 5 - prev.length;
          const imagesToAdd = compressedImages.slice(0, available);
          const updatedImages = [...prev, ...imagesToAdd];
          form.setValue("primaryImages", updatedImages);
          return updatedImages;
        });
      }
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

      // Remove size limit check - we'll compress instead
      if (secondaryImages.length + validFiles.length >= 20) {
        return;
      }

      validFiles.push(file);
    });

    // Process valid files with compression and progress tracking
    if (validFiles.length > 0) {
      const compressedImages: string[] = [];
      
      for (const file of validFiles) {
        const fileId = `${file.name}_${Date.now()}_${Math.random()}`;
        
        try {
          // Update progress state
          setUploadingSecondary(prev => new Map(prev).set(fileId, 0));
          console.log('[Secondary] Starting compression for:', file.name);
          
          // Compress image with progress callback
          const result = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85,
            onProgress: (progress) => {
              console.log('[Secondary] Compression progress:', progress);
              setUploadingSecondary(prev => new Map(prev).set(fileId, progress));
            },
          });
          console.log('[Secondary] Compression complete for:', file.name);
          
          compressedImages.push(result.base64);
          
          // Show compression stats
          if (result.compressionRatio > 10) {
            toast({
              title: "Imagen comprimida",
              description: `${file.name}: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (${Math.round(result.compressionRatio)}% reducción)`,
              duration: 3000,
            });
          }
          
          // Remove from uploading state
          setUploadingSecondary(prev => {
            const next = new Map(prev);
            next.delete(fileId);
            return next;
          });
        } catch (error) {
          console.error('Error compressing image:', error);
          toast({
            title: t.errors.error,
            description: `${file.name}: Error al procesar imagen`,
            variant: "destructive",
          });
          
          // Remove from uploading state
          setUploadingSecondary(prev => {
            const next = new Map(prev);
            next.delete(fileId);
            return next;
          });
        }
      }

      if (compressedImages.length > 0) {
        setSecondaryImages((prev) => {
          const available = 20 - prev.length;
          const imagesToAdd = compressedImages.slice(0, available);
          const updatedImages = [...prev, ...imagesToAdd];
          form.setValue("secondaryImages", updatedImages);
          return updatedImages;
        });
      }
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
                disabled={primaryImages.length >= 5 || uploadingPrimary.size > 0}
                data-testid="button-add-primary-image"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t.step3.addImages}
              </Button>

              {uploadingPrimary.size > 0 && (
                <div className="space-y-2">
                  {Array.from(uploadingPrimary.entries()).map(([fileId, progress]) => (
                    <div key={fileId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Comprimiendo imagen...</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  ))}
                </div>
              )}

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
                disabled={secondaryImages.length >= 20 || uploadingSecondary.size > 0}
                data-testid="button-add-secondary-image"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t.step3.addImages}
              </Button>

              {uploadingSecondary.size > 0 && (
                <div className="space-y-2">
                  {Array.from(uploadingSecondary.entries()).map(([fileId, progress]) => (
                    <div key={fileId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Comprimiendo imagen...</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  ))}
                </div>
              )}

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

          {/* Virtual Tour Benefits Alert */}
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertTitle>{t.step3.tourBenefitsTitle}</AlertTitle>
            <AlertDescription>
              {t.step3.tourBenefits}
            </AlertDescription>
          </Alert>

          <FormField
            control={form.control}
            name="virtualTourUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.step3.virtualTourUrl}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.step3.virtualTourPlaceholder}
                    {...field}
                    data-testid="input-virtual-tour"
                  />
                </FormControl>
                <FormDescription data-testid="text-tour-description">
                  {t.step3.virtualTourDesc}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Request Virtual Tour Checkbox */}
          <FormField
            control={form.control}
            name="requestVirtualTour"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-request-tour"
                  />
                </FormControl>
                <div className="space-y-1 leading-none flex-1">
                  <FormLabel className="text-base cursor-pointer font-medium">
                    {t.step3.requestTour}
                  </FormLabel>
                  <FormMessage />
                </div>
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
