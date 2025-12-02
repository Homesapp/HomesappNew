import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Plus, Trash2, ChevronLeft, ChevronRight, X, Star, Video, Camera, Upload, Link, Globe, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaItem {
  id: string;
  thumbnailUrl: string;
  driveWebViewUrl?: string;
  driveFileId?: string;
  aiPrimaryLabel?: string;
}

interface UnitImageGalleryProps {
  unitId?: string;
  primaryImages: string[];
  secondaryImages?: string[];
  videos?: string[];
  virtualTourUrl?: string | null;
  onUpdate?: (data: { primaryImages: string[]; secondaryImages: string[]; videos: string[]; virtualTourUrl?: string | null }) => void;
  language?: "es" | "en";
  readOnly?: boolean;
  title?: string;
}

function getFullSizeGoogleDriveUrl(driveFileId: string): string {
  return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1600`;
}

const ACCEPTED_FORMATS = ".jpg,.jpeg,.png,.webp,.heic,.heif,.avif,.gif,.tiff,.bmp";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function UnitImageGallery({
  unitId,
  primaryImages = [],
  secondaryImages = [],
  videos = [],
  virtualTourUrl = null,
  onUpdate,
  language = "es",
  readOnly = false,
  title,
}: UnitImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addType, setAddType] = useState<"primary" | "secondary" | "video" | "tour">("primary");
  const [newUrl, setNewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [fullSizeUrlMap, setFullSizeUrlMap] = useState<Map<string, string>>(new Map());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const allImages = [...primaryImages, ...secondaryImages];
  
  const fetchMediaDetails = useCallback(async () => {
    if (!unitId || mediaItems.length > 0) return;
    
    setIsLoadingMedia(true);
    try {
      const response = await fetch(`/api/external-units/${unitId}/media`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const photos: MediaItem[] = data.photos || [];
        setMediaItems(photos);
        
        const urlMap = new Map<string, string>();
        photos.forEach((item: MediaItem) => {
          if (item.thumbnailUrl && item.driveFileId) {
            urlMap.set(item.thumbnailUrl, getFullSizeGoogleDriveUrl(item.driveFileId));
          }
        });
        setFullSizeUrlMap(urlMap);
      }
    } catch (err) {
      console.warn('Failed to fetch media details:', err);
    } finally {
      setIsLoadingMedia(false);
    }
  }, [unitId, mediaItems.length]);
  
  useEffect(() => {
    if (lightboxOpen && unitId && mediaItems.length === 0) {
      fetchMediaDetails();
    }
  }, [lightboxOpen, unitId, fetchMediaDetails, mediaItems.length]);
  
  const getFullSizeUrl = (thumbnailUrl: string): string => {
    return fullSizeUrlMap.get(thumbnailUrl) || thumbnailUrl;
  };
  const hasPrimaryImages = primaryImages.length > 0;
  const hasSecondaryImages = secondaryImages.length > 0;
  const hasVideos = videos.length > 0;
  const hasAnyMedia = hasPrimaryImages || hasSecondaryImages || hasVideos;

  const texts = {
    es: {
      gallery: "Galería de Fotos",
      primaryImages: "Imágenes Principales",
      secondaryImages: "Imágenes Secundarias",
      videos: "Videos",
      tour: "Tour 360°",
      noImages: "No hay imágenes",
      addImage: "Agregar Imagen",
      addPrimary: "Principal",
      addSecondary: "Secundaria",
      addVideo: "Video",
      addTour: "Tour 360°",
      uploadTab: "Subir Archivo",
      urlTab: "Desde URL",
      uploading: "Subiendo y optimizando...",
      dragDrop: "Arrastra imágenes aquí o haz clic",
      formats: "JPEG, PNG, WebP, HEIC, AVIF (máx. 10MB)",
      maxPrimary: "Máximo 5 imágenes principales",
      maxSecondary: "Máximo 20 imágenes secundarias",
      videoUrl: "URL del Video",
      tourUrl: "URL del Tour 360° (kuula.co, etc.)",
      imageUrl: "URL de la Imagen",
      cancel: "Cancelar",
      add: "Agregar",
      cover: "Portada",
      uploadSuccess: "Imagen(es) subida(s) correctamente",
      uploadError: "Error al subir imagen(es)",
      deleteSuccess: "Imagen eliminada",
      setCover: "Poner de portada",
      coverSet: "Portada cambiada",
    },
    en: {
      gallery: "Photo Gallery",
      primaryImages: "Primary Images",
      secondaryImages: "Secondary Images",
      videos: "Videos",
      tour: "360° Tour",
      noImages: "No images",
      addImage: "Add Image",
      addPrimary: "Primary",
      addSecondary: "Secondary",
      addVideo: "Video",
      addTour: "360° Tour",
      uploadTab: "Upload File",
      urlTab: "From URL",
      uploading: "Uploading and optimizing...",
      dragDrop: "Drag images here or click",
      formats: "JPEG, PNG, WebP, HEIC, AVIF (max. 10MB)",
      maxPrimary: "Maximum 5 primary images",
      maxSecondary: "Maximum 20 secondary images",
      videoUrl: "Video URL",
      tourUrl: "360° Tour URL (kuula.co, etc.)",
      imageUrl: "Image URL",
      cancel: "Cancel",
      add: "Add",
      cover: "Cover",
      uploadSuccess: "Image(s) uploaded successfully",
      uploadError: "Error uploading image(s)",
      deleteSuccess: "Image deleted",
      setCover: "Set as cover",
      coverSet: "Cover image changed",
    },
  };

  const t = texts[language];

  const handleSetCover = (index: number) => {
    if (!onUpdate || index === 0) return;
    const newPrimaryImages = [...primaryImages];
    const [coverImage] = newPrimaryImages.splice(index, 1);
    newPrimaryImages.unshift(coverImage);
    onUpdate({
      primaryImages: newPrimaryImages,
      secondaryImages,
      videos,
      virtualTourUrl,
    });
    toast({ title: language === "es" ? "Portada cambiada" : "Cover image changed" });
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !unitId || !onUpdate) return;
    
    const imageType = addType === "primary" ? "primary" : "secondary";
    const maxImages = imageType === "primary" ? 5 : 20;
    const currentImages = imageType === "primary" ? primaryImages : secondaryImages;
    const remainingSlots = maxImages - currentImages.length;
    
    if (remainingSlots <= 0) {
      setUploadError(imageType === "primary" ? t.maxPrimary : t.maxSecondary);
      return;
    }
    
    const filesToUpload = Array.from(files).slice(0, remainingSlots).filter(file => {
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
    
    if (filesToUpload.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      filesToUpload.forEach(file => formData.append('images', file));
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
        const newUrls = result.uploaded.map((img: any) => img.publicUrl);
        
        if (imageType === "primary") {
          onUpdate({
            primaryImages: [...primaryImages, ...newUrls],
            secondaryImages,
            videos,
            virtualTourUrl,
          });
        } else {
          onUpdate({
            primaryImages,
            secondaryImages: [...secondaryImages, ...newUrls],
            videos,
            virtualTourUrl,
          });
        }
        
        toast({ title: t.uploadSuccess });
        setShowAddDialog(false);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message);
      toast({
        title: t.uploadError,
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddMedia = () => {
    if (!newUrl.trim() || !onUpdate) return;
    
    if (addType === "primary") {
      if (primaryImages.length >= 5) return;
      onUpdate({
        primaryImages: [...primaryImages, newUrl.trim()],
        secondaryImages,
        videos,
        virtualTourUrl,
      });
    } else if (addType === "secondary") {
      if (secondaryImages.length >= 20) return;
      onUpdate({
        primaryImages,
        secondaryImages: [...secondaryImages, newUrl.trim()],
        videos,
        virtualTourUrl,
      });
    } else if (addType === "video") {
      onUpdate({
        primaryImages,
        secondaryImages,
        videos: [...videos, newUrl.trim()],
        virtualTourUrl,
      });
    } else if (addType === "tour") {
      onUpdate({
        primaryImages,
        secondaryImages,
        videos,
        virtualTourUrl: newUrl.trim(),
      });
    }
    
    setNewUrl("");
    setShowAddDialog(false);
  };

  const handleRemoveMedia = async (type: "primary" | "secondary" | "video" | "tour", index: number) => {
    if (!onUpdate) return;
    
    if (type === "primary") {
      const imageUrl = primaryImages[index];
      const updated = [...primaryImages];
      updated.splice(index, 1);
      onUpdate({ primaryImages: updated, secondaryImages, videos, virtualTourUrl });
      
      if (unitId && imageUrl) {
        try {
          await fetch(`/api/external-units/${unitId}/images`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ imageUrl, imageType: 'primary' }),
          });
        } catch (err) {
          console.warn('Failed to delete from storage:', err);
        }
      }
    } else if (type === "secondary") {
      const imageUrl = secondaryImages[index];
      const updated = [...secondaryImages];
      updated.splice(index, 1);
      onUpdate({ primaryImages, secondaryImages: updated, videos, virtualTourUrl });
      
      if (unitId && imageUrl) {
        try {
          await fetch(`/api/external-units/${unitId}/images`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ imageUrl, imageType: 'secondary' }),
          });
        } catch (err) {
          console.warn('Failed to delete from storage:', err);
        }
      }
    } else if (type === "video") {
      const updated = [...videos];
      updated.splice(index, 1);
      onUpdate({ primaryImages, secondaryImages, videos: updated, virtualTourUrl });
    } else if (type === "tour") {
      onUpdate({ primaryImages, secondaryImages, videos, virtualTourUrl: null });
    }
    
    toast({ title: t.deleteSuccess });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    
    const files = e.dataTransfer.files;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      const dt = new DataTransfer();
      imageFiles.forEach(f => dt.items.add(f));
      handleFileUpload(dt.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const openAddDialog = (type: "primary" | "secondary" | "video" | "tour") => {
    setAddType(type);
    setNewUrl("");
    setUploadError(null);
    setActiveTab(type === "video" || type === "tour" ? "url" : "upload");
    setShowAddDialog(true);
  };

  return (
    <>
      <Card data-testid="card-image-gallery">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4" />
              {title || t.gallery}
            </CardTitle>
            {!readOnly && onUpdate && (
              <div className="flex flex-wrap gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAddDialog("primary")}
                  disabled={primaryImages.length >= 5}
                  data-testid="button-add-primary-image"
                >
                  <Star className="h-3 w-3 mr-1" />
                  {t.addPrimary}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAddDialog("secondary")}
                  disabled={secondaryImages.length >= 20}
                  data-testid="button-add-secondary-image"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t.addSecondary}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAddDialog("video")}
                  data-testid="button-add-video"
                >
                  <Video className="h-3 w-3 mr-1" />
                  {t.addVideo}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAddDialog("tour")}
                  data-testid="button-add-tour"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  {t.addTour}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasAnyMedia && !virtualTourUrl ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground" data-testid="text-no-images">
              <Image className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">{t.noImages}</p>
              {!readOnly && onUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => openAddDialog("primary")}
                  data-testid="button-add-first-image"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {t.addImage}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {hasPrimaryImages && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {t.primaryImages} ({primaryImages.length}/5)
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {primaryImages.map((url, index) => (
                      <div
                        key={`primary-${index}`}
                        className="relative group aspect-video rounded-md overflow-hidden cursor-pointer border"
                        onClick={() => openLightbox(index)}
                        data-testid={`image-primary-${index}`}
                      >
                        <img
                          src={url}
                          alt={`Primary ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=Error";
                          }}
                        />
                        {index === 0 && (
                          <Badge variant="default" className="absolute top-1 left-1 text-xs py-0.5 px-1">
                            <Star className="h-2.5 w-2.5 mr-0.5" />
                            {t.cover}
                          </Badge>
                        )}
                        {!readOnly && onUpdate && (
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {index !== 0 && (
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetCover(index);
                                }}
                                title={t.setCover}
                                data-testid={`button-set-cover-${index}`}
                              >
                                <Star className="h-2.5 w-2.5" />
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-5 w-5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveMedia("primary", index);
                              }}
                              data-testid={`button-remove-primary-${index}`}
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasSecondaryImages && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {t.secondaryImages} ({secondaryImages.length}/20)
                  </p>
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
                    {secondaryImages.map((url, index) => (
                      <div
                        key={`secondary-${index}`}
                        className="relative group aspect-square rounded overflow-hidden cursor-pointer border"
                        onClick={() => openLightbox(primaryImages.length + index)}
                        data-testid={`image-secondary-${index}`}
                      >
                        <img
                          src={url}
                          alt={`Secondary ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/200x200?text=Error";
                          }}
                        />
                        {!readOnly && onUpdate && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-0.5 right-0.5 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMedia("secondary", index);
                            }}
                            data-testid={`button-remove-secondary-${index}`}
                          >
                            <Trash2 className="h-2 w-2" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {virtualTourUrl && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {t.tour}
                  </p>
                  <div className="flex items-center gap-2 p-3 rounded-md border bg-muted/30 group">
                    <Globe className="h-5 w-5 text-primary shrink-0" />
                    <a
                      href={virtualTourUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex-1 truncate"
                    >
                      {virtualTourUrl}
                    </a>
                    {!readOnly && onUpdate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleRemoveMedia("tour", 0)}
                        data-testid="button-remove-tour"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {hasVideos && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {t.videos} ({videos.length})
                  </p>
                  <div className="space-y-2">
                    {videos.map((url, index) => (
                      <div
                        key={`video-${index}`}
                        className="flex items-center gap-2 p-2 rounded-md border group"
                        data-testid={`video-${index}`}
                      >
                        <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex-1 truncate"
                        >
                          {url}
                        </a>
                        {!readOnly && onUpdate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => handleRemoveMedia("video", index)}
                            data-testid={`button-remove-video-${index}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent hideCloseButton className="max-w-5xl p-0 bg-black/95 border-none">
          <div className="relative" onContextMenu={(e) => e.preventDefault()}>
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              {allImages[lightboxIndex] && fullSizeUrlMap.size > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => {
                    const currentUrl = allImages[lightboxIndex];
                    const mediaItem = mediaItems.find(m => m.thumbnailUrl === currentUrl);
                    if (mediaItem?.driveWebViewUrl) {
                      window.open(mediaItem.driveWebViewUrl, '_blank');
                    }
                  }}
                  title={language === "es" ? "Abrir en Google Drive" : "Open in Google Drive"}
                  data-testid="button-open-drive"
                >
                  <ExternalLink className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setLightboxOpen(false)}
                data-testid="button-close-lightbox"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center justify-center min-h-[70vh] p-4 select-none">
              {isLoadingMedia ? (
                <div className="flex flex-col items-center gap-3 text-white">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm">{language === "es" ? "Cargando imagen..." : "Loading image..."}</span>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={getFullSizeUrl(allImages[lightboxIndex] || "")}
                    alt={`Image ${lightboxIndex + 1}`}
                    className="max-h-[85vh] max-w-full object-contain rounded select-none"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ 
                      WebkitUserSelect: 'none',
                      WebkitUserDrag: 'none',
                      WebkitTouchCallout: 'none',
                    } as React.CSSProperties}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img.src !== allImages[lightboxIndex]) {
                        img.src = allImages[lightboxIndex] || "https://placehold.co/800x600?text=Error";
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-transparent" />
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  onClick={prevImage}
                  data-testid="button-prev-image"
                >
                  <ChevronLeft className="h-10 w-10" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  onClick={nextImage}
                  data-testid="button-next-image"
                >
                  <ChevronRight className="h-10 w-10" />
                </Button>
              </>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent data-testid="dialog-add-media" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {addType === "primary"
                ? (language === "es" ? "Agregar Imagen Principal" : "Add Primary Image")
                : addType === "secondary"
                ? (language === "es" ? "Agregar Imagen Secundaria" : "Add Secondary Image")
                : addType === "tour"
                ? (language === "es" ? "Agregar Tour 360°" : "Add 360° Tour")
                : (language === "es" ? "Agregar Video" : "Add Video")}
            </DialogTitle>
          </DialogHeader>
          
          {(addType === "primary" || addType === "secondary") ? (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "url")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="gap-1">
                  <Upload className="h-3 w-3" />
                  {t.uploadTab}
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-1">
                  <Link className="h-3 w-3" />
                  {t.urlTab}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isUploading ? 'bg-muted cursor-not-allowed' : 'hover:border-primary cursor-pointer'
                  }`}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  data-testid="dropzone-images"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_FORMATS}
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    disabled={isUploading}
                    data-testid="input-upload-images"
                  />
                  
                  {isUploading ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Upload className="h-5 w-5 animate-pulse" />
                        <span>{t.uploading}</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{t.dragDrop}</p>
                      <p className="text-xs text-muted-foreground">{t.formats}</p>
                    </div>
                  )}
                </div>
                
                {uploadError && (
                  <div className="flex items-center gap-2 text-destructive text-sm mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <span>{uploadError}</span>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-3">
                  {addType === "primary" ? t.maxPrimary : t.maxSecondary}
                </p>
              </TabsContent>
              
              <TabsContent value="url" className="mt-4 space-y-4">
                <div>
                  <Label>{t.imageUrl}</Label>
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://..."
                    data-testid="input-media-url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {addType === "primary" ? t.maxPrimary : t.maxSecondary}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    data-testid="button-cancel-add-media"
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    onClick={handleAddMedia}
                    disabled={!newUrl.trim()}
                    data-testid="button-save-media"
                  >
                    {t.add}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>
                  {addType === "video" ? t.videoUrl : t.tourUrl}
                </Label>
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder={addType === "tour" ? "https://kuula.co/..." : "https://youtube.com/..."}
                  data-testid="input-media-url"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {addType === "video"
                    ? (language === "es" ? "Enlace a YouTube, Vimeo, etc." : "Link to YouTube, Vimeo, etc.")
                    : (language === "es" ? "Enlace a kuula.co o similar para tour virtual" : "Link to kuula.co or similar for virtual tour")}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  data-testid="button-cancel-add-media"
                >
                  {t.cancel}
                </Button>
                <Button
                  onClick={handleAddMedia}
                  disabled={!newUrl.trim()}
                  data-testid="button-save-media"
                >
                  {t.add}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
