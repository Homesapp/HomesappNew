import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Upload, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImageUploaderProps {
  unitId: string;
  imageType: 'primary' | 'secondary';
  currentImages: string[];
  onImagesUpdated: (images: string[]) => void;
  maxImages?: number;
  language?: 'es' | 'en';
  disabled?: boolean;
}

interface UploadedImage {
  objectPath: string;
  publicUrl: string;
  width: number;
  height: number;
}

const ACCEPTED_FORMATS = ".jpg,.jpeg,.png,.webp,.heic,.heif,.avif,.gif,.tiff,.bmp";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function ImageUploader({
  unitId,
  imageType,
  currentImages,
  onImagesUpdated,
  maxImages = 20,
  language = 'es',
  disabled = false,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const texts = {
    es: {
      uploadButton: "Subir Imágenes",
      uploading: "Subiendo...",
      dragDrop: "Arrastra imágenes aquí o haz clic para seleccionar",
      formats: "JPEG, PNG, WebP, HEIC, AVIF soportados (máx. 10MB)",
      maxReached: `Máximo ${maxImages} imágenes`,
      removeImage: "Eliminar imagen",
      uploadSuccess: "Imágenes subidas correctamente",
      uploadError: "Error al subir imágenes",
      deleteSuccess: "Imagen eliminada",
      deleteError: "Error al eliminar imagen",
      converting: "Convirtiendo y optimizando...",
    },
    en: {
      uploadButton: "Upload Images",
      uploading: "Uploading...",
      dragDrop: "Drag images here or click to select",
      formats: "JPEG, PNG, WebP, HEIC, AVIF supported (max. 10MB)",
      maxReached: `Maximum ${maxImages} images`,
      removeImage: "Remove image",
      uploadSuccess: "Images uploaded successfully",
      uploadError: "Error uploading images",
      deleteSuccess: "Image deleted",
      deleteError: "Error deleting image",
      converting: "Converting and optimizing...",
    },
  };

  const t = texts[language];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - currentImages.length;
    if (remainingSlots <= 0) {
      setError(t.maxReached);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    const validFiles = filesToUpload.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: t.uploadError,
          description: `${file.name}: File too large (max 10MB)`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    await uploadFiles(validFiles);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      formData.append('imageType', imageType);

      setUploadProgress(30);

      const response = await fetch(`/api/external-units/${unitId}/upload-images`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      setUploadProgress(80);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      setUploadProgress(100);

      if (result.uploaded && result.uploaded.length > 0) {
        const newUrls = result.uploaded.map((img: UploadedImage) => img.publicUrl);
        onImagesUpdated([...currentImages, ...newUrls]);
        
        toast({
          title: t.uploadSuccess,
          description: result.message,
        });
      }

      if (result.errors && result.errors.length > 0) {
        console.warn('Some images failed:', result.errors);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message);
      toast({
        title: t.uploadError,
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      await apiRequest('DELETE', `/api/external-units/${unitId}/images`, {
        imageUrl,
        imageType,
      });

      const updatedImages = currentImages.filter(url => url !== imageUrl);
      onImagesUpdated(updatedImages);

      toast({
        title: t.deleteSuccess,
      });
    } catch (err: any) {
      console.error('Delete error:', err);
      toast({
        title: t.deleteError,
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      const remainingSlots = maxImages - currentImages.length;
      const filesToUpload = files.slice(0, remainingSlots);
      await uploadFiles(filesToUpload);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          disabled || isUploading
            ? 'bg-muted cursor-not-allowed'
            : 'hover:border-primary cursor-pointer hover-elevate'
        }`}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        data-testid={`dropzone-${imageType}-images`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FORMATS}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
          data-testid={`input-${imageType}-images`}
        />
        
        {isUploading ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Upload className="h-5 w-5 animate-pulse" />
              <span>{t.converting}</span>
            </div>
            <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t.dragDrop}</p>
            <p className="text-xs text-muted-foreground">{t.formats}</p>
            {currentImages.length >= maxImages && (
              <p className="text-xs text-destructive">{t.maxReached}</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {currentImages.map((imageUrl, index) => (
            <div
              key={`${imageUrl}-${index}`}
              className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={imageUrl}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {!disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(imageUrl);
                  }}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title={t.removeImage}
                  data-testid={`button-remove-image-${index}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>{currentImages.length} / {maxImages}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading || currentImages.length >= maxImages}
          data-testid={`button-upload-${imageType}-images`}
        >
          <Upload className="h-4 w-4 mr-2" />
          {t.uploadButton}
        </Button>
      </div>
    </div>
  );
}
