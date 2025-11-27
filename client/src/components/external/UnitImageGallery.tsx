import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Image, Plus, Trash2, ChevronLeft, ChevronRight, X, Star, Video, Camera } from "lucide-react";

interface UnitImageGalleryProps {
  primaryImages: string[];
  secondaryImages?: string[];
  videos?: string[];
  onUpdate?: (data: { primaryImages: string[]; secondaryImages: string[]; videos: string[] }) => void;
  language?: "es" | "en";
  readOnly?: boolean;
  title?: string;
}

export function UnitImageGallery({
  primaryImages = [],
  secondaryImages = [],
  videos = [],
  onUpdate,
  language = "es",
  readOnly = false,
  title,
}: UnitImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addType, setAddType] = useState<"primary" | "secondary" | "video">("primary");
  const [newUrl, setNewUrl] = useState("");

  const allImages = [...primaryImages, ...secondaryImages];
  const hasPrimaryImages = primaryImages.length > 0;
  const hasSecondaryImages = secondaryImages.length > 0;
  const hasVideos = videos.length > 0;
  const hasAnyMedia = hasPrimaryImages || hasSecondaryImages || hasVideos;

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

  const handleAddMedia = () => {
    if (!newUrl.trim() || !onUpdate) return;
    
    if (addType === "primary") {
      if (primaryImages.length >= 5) return;
      onUpdate({
        primaryImages: [...primaryImages, newUrl.trim()],
        secondaryImages,
        videos,
      });
    } else if (addType === "secondary") {
      if (secondaryImages.length >= 20) return;
      onUpdate({
        primaryImages,
        secondaryImages: [...secondaryImages, newUrl.trim()],
        videos,
      });
    } else if (addType === "video") {
      onUpdate({
        primaryImages,
        secondaryImages,
        videos: [...videos, newUrl.trim()],
      });
    }
    
    setNewUrl("");
    setShowAddDialog(false);
  };

  const handleRemoveMedia = (type: "primary" | "secondary" | "video", index: number) => {
    if (!onUpdate) return;
    
    if (type === "primary") {
      const updated = [...primaryImages];
      updated.splice(index, 1);
      onUpdate({ primaryImages: updated, secondaryImages, videos });
    } else if (type === "secondary") {
      const updated = [...secondaryImages];
      updated.splice(index, 1);
      onUpdate({ primaryImages, secondaryImages: updated, videos });
    } else if (type === "video") {
      const updated = [...videos];
      updated.splice(index, 1);
      onUpdate({ primaryImages, secondaryImages, videos: updated });
    }
  };

  return (
    <>
      <Card data-testid="card-image-gallery">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4" />
              {title || (language === "es" ? "Galería de Fotos" : "Photo Gallery")}
            </CardTitle>
            {!readOnly && onUpdate && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddType("primary");
                    setShowAddDialog(true);
                  }}
                  disabled={primaryImages.length >= 5}
                  data-testid="button-add-primary-image"
                >
                  <Star className="h-3 w-3 mr-1" />
                  {language === "es" ? "Principal" : "Primary"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddType("secondary");
                    setShowAddDialog(true);
                  }}
                  disabled={secondaryImages.length >= 20}
                  data-testid="button-add-secondary-image"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {language === "es" ? "Secundaria" : "Secondary"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddType("video");
                    setShowAddDialog(true);
                  }}
                  data-testid="button-add-video"
                >
                  <Video className="h-3 w-3 mr-1" />
                  {language === "es" ? "Video" : "Video"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasAnyMedia ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground" data-testid="text-no-images">
              <Image className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">{language === "es" ? "No hay imágenes" : "No images"}</p>
              {!readOnly && onUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setAddType("primary");
                    setShowAddDialog(true);
                  }}
                  data-testid="button-add-first-image"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {language === "es" ? "Agregar Imagen" : "Add Image"}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {hasPrimaryImages && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {language === "es" ? "Imágenes Principales" : "Primary Images"} ({primaryImages.length}/5)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {primaryImages.map((url, index) => (
                      <div
                        key={`primary-${index}`}
                        className="relative group aspect-video rounded-md overflow-hidden cursor-pointer"
                        onClick={() => openLightbox(index)}
                        data-testid={`image-primary-${index}`}
                      >
                        <img
                          src={url}
                          alt={`Primary ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=Error";
                          }}
                        />
                        {index === 0 && (
                          <Badge variant="default" className="absolute top-1 left-1 text-xs">
                            <Star className="h-3 w-3 mr-0.5" />
                            {language === "es" ? "Portada" : "Cover"}
                          </Badge>
                        )}
                        {!readOnly && onUpdate && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMedia("primary", index);
                            }}
                            data-testid={`button-remove-primary-${index}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasSecondaryImages && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {language === "es" ? "Imágenes Secundarias" : "Secondary Images"} ({secondaryImages.length}/20)
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {secondaryImages.map((url, index) => (
                      <div
                        key={`secondary-${index}`}
                        className="relative group aspect-square rounded-md overflow-hidden cursor-pointer"
                        onClick={() => openLightbox(primaryImages.length + index)}
                        data-testid={`image-secondary-${index}`}
                      >
                        <img
                          src={url}
                          alt={`Secondary ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/200x200?text=Error";
                          }}
                        />
                        {!readOnly && onUpdate && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMedia("secondary", index);
                            }}
                            data-testid={`button-remove-secondary-${index}`}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasVideos && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {language === "es" ? "Videos" : "Videos"} ({videos.length})
                  </p>
                  <div className="space-y-2">
                    {videos.map((url, index) => (
                      <div
                        key={`video-${index}`}
                        className="flex items-center gap-2 p-2 rounded-md border group"
                        data-testid={`video-${index}`}
                      >
                        <Video className="h-4 w-4 text-muted-foreground" />
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
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
              data-testid="button-close-lightbox"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex items-center justify-center min-h-[60vh]">
              <img
                src={allImages[lightboxIndex] || ""}
                alt={`Image ${lightboxIndex + 1}`}
                className="max-h-[80vh] max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/800x600?text=Error";
                }}
              />
            </div>
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={prevImage}
                  data-testid="button-prev-image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={nextImage}
                  data-testid="button-next-image"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent data-testid="dialog-add-media">
          <DialogHeader>
            <DialogTitle>
              {addType === "primary"
                ? (language === "es" ? "Agregar Imagen Principal" : "Add Primary Image")
                : addType === "secondary"
                ? (language === "es" ? "Agregar Imagen Secundaria" : "Add Secondary Image")
                : (language === "es" ? "Agregar Video" : "Add Video")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                {addType === "video"
                  ? (language === "es" ? "URL del Video" : "Video URL")
                  : (language === "es" ? "URL de la Imagen" : "Image URL")}
              </Label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
                data-testid="input-media-url"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {addType === "primary"
                  ? (language === "es" ? "Máximo 5 imágenes principales" : "Maximum 5 primary images")
                  : addType === "secondary"
                  ? (language === "es" ? "Máximo 20 imágenes secundarias" : "Maximum 20 secondary images")
                  : (language === "es" ? "Enlace a video de YouTube, Vimeo, etc." : "Link to YouTube, Vimeo video, etc.")}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                data-testid="button-cancel-add-media"
              >
                {language === "es" ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                onClick={handleAddMedia}
                disabled={!newUrl.trim()}
                data-testid="button-save-media"
              >
                {language === "es" ? "Agregar" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
