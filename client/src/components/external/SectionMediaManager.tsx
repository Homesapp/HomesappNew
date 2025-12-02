import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  GripVertical,
  Bed,
  Bath,
  Home,
  ChefHat,
  Sofa,
  Utensils,
  Trees,
  Waves,
  Building,
  Eye,
  MapPin,
  FileImage,
  Camera,
  Plus,
  Loader2,
  AlertCircle,
  Check,
  MoveRight,
  MoreVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MediaSection {
  key: string;
  section: string;
  sectionIndex: number;
  label: { es: string; en: string };
}

interface MediaItem {
  id: string;
  unitId: string;
  agencyId: string;
  section: string;
  sectionIndex: number;
  url: string;
  caption: string | null;
  sortOrder: number;
  isCover: boolean;
  createdAt: string;
}

interface SectionMediaManagerProps {
  unitId: string;
  language?: "es" | "en";
  readOnly?: boolean;
  onMediaChange?: () => void;
}

const SECTION_ICONS: Record<string, any> = {
  cover: Star,
  bedroom: Bed,
  bathroom: Bath,
  half_bath: Bath,
  kitchen: ChefHat,
  living_room: Sofa,
  dining_room: Utensils,
  garden: Trees,
  terrace: Building,
  pool: Waves,
  balcony: Building,
  rooftop: Building,
  parking: MapPin,
  amenities: Home,
  common_areas: Building,
  exterior: Home,
  view: Eye,
  floor_plan: FileImage,
  other: Camera,
};

const ACCEPTED_FORMATS = ".jpg,.jpeg,.png,.webp,.heic,.heif,.avif,.gif,.tiff,.bmp";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function SortableImage({ 
  item, 
  onDelete, 
  onSetCover, 
  onMoveToSection,
  onClick,
  disabled,
  sections,
  currentSection,
  language = "es"
}: { 
  item: MediaItem; 
  onDelete: () => void; 
  onSetCover: () => void;
  onMoveToSection: (section: string, sectionIndex: number) => void;
  onClick: () => void;
  disabled: boolean;
  sections: MediaSection[];
  currentSection: string;
  language?: "es" | "en";
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const otherSections = sections.filter(s => s.key !== currentSection);
  const moveText = language === "es" ? "Mover a" : "Move to";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
    >
      <img
        src={item.url}
        alt={item.caption || "Property image"}
        className="w-full h-full object-cover cursor-pointer"
        onClick={onClick}
        data-testid={`image-${item.id}`}
      />
      {item.isCover && (
        <Badge className="absolute top-1 left-1 text-xs" variant="secondary">
          <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
          Portada
        </Badge>
      )}
      {!disabled && (
        <>
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              {...attributes}
              {...listeners}
              className="p-1 bg-black/50 rounded cursor-grab"
            >
              <GripVertical className="h-4 w-4 text-white" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 bg-black/50 hover:bg-black/70"
                  data-testid={`menu-${item.id}`}
                >
                  <MoreVertical className="h-4 w-4 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <MoveRight className="h-4 w-4" />
                  {moveText}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {otherSections.map((sec) => (
                  <DropdownMenuItem 
                    key={sec.key}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onMoveToSection(sec.section, sec.sectionIndex); 
                    }}
                    data-testid={`move-to-${sec.key}-${item.id}`}
                  >
                    {sec.label[language]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!item.isCover && (
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs flex-1"
                onClick={(e) => { e.stopPropagation(); onSetCover(); }}
                data-testid={`set-cover-${item.id}`}
              >
                <Star className="h-3 w-3 mr-1" />
                Portada
              </Button>
            )}
            <Button
              size="icon"
              variant="destructive"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              data-testid={`delete-image-${item.id}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function SectionMediaManager({
  unitId,
  language = "es",
  readOnly = false,
  onMediaChange,
}: SectionMediaManagerProps) {
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<string[]>(["cover"]);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<MediaItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const texts = {
    es: {
      mediaManager: "Gestor de Imágenes",
      noImages: "Sin imágenes",
      addImages: "Agregar imágenes",
      uploading: "Subiendo...",
      uploadSuccess: "Imagen(es) subida(s) correctamente",
      uploadError: "Error al subir imagen(es)",
      deleteSuccess: "Imagen eliminada",
      deleteError: "Error al eliminar imagen",
      setCoverSuccess: "Portada actualizada",
      reorderSuccess: "Orden actualizado",
      dragDrop: "Arrastra imágenes o haz clic",
      formats: "JPG, PNG, WebP, HEIC (máx. 10MB)",
      saveFirst: "Guarda la propiedad para habilitar la subida de imágenes",
    },
    en: {
      mediaManager: "Image Manager",
      noImages: "No images",
      addImages: "Add images",
      uploading: "Uploading...",
      uploadSuccess: "Image(s) uploaded successfully",
      uploadError: "Error uploading image(s)",
      deleteSuccess: "Image deleted",
      deleteError: "Error deleting image",
      setCoverSuccess: "Cover updated",
      reorderSuccess: "Order updated",
      dragDrop: "Drag images or click",
      formats: "JPG, PNG, WebP, HEIC (max. 10MB)",
      saveFirst: "Save property to enable image uploads",
    },
  };

  const t = texts[language];

  const { data: sectionsData, isLoading: sectionsLoading } = useQuery<{ data: MediaSection[] }>({
    queryKey: ['/api/external-units', unitId, 'media', 'sections'],
    enabled: !!unitId,
  });

  const { data: mediaData, isLoading: mediaLoading, refetch: refetchMedia } = useQuery<{ data: MediaItem[]; grouped: Record<string, MediaItem[]> }>({
    queryKey: ['/api/external-units', unitId, 'media'],
    enabled: !!unitId,
  });

  const sections = sectionsData?.data || [];
  const mediaItems = mediaData?.data || [];
  const groupedMedia = mediaData?.grouped || {};

  const deleteMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      await apiRequest('DELETE', `/api/external-units/${unitId}/media/${mediaId}`);
    },
    onSuccess: () => {
      refetchMedia();
      onMediaChange?.();
      toast({ title: t.deleteSuccess });
    },
    onError: (error: any) => {
      toast({ title: t.deleteError, description: error.message, variant: "destructive" });
    },
  });

  const setCoverMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      await apiRequest('POST', `/api/external-units/${unitId}/media/${mediaId}/set-cover`);
    },
    onSuccess: () => {
      refetchMedia();
      onMediaChange?.();
      toast({ title: t.setCoverSuccess });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ section, sectionIndex, mediaIds }: { section: string; sectionIndex: number; mediaIds: string[] }) => {
      await apiRequest('POST', `/api/external-units/${unitId}/media/reorder`, { section, sectionIndex, mediaIds });
    },
    onSuccess: () => {
      refetchMedia();
      toast({ title: t.reorderSuccess });
    },
  });

  const moveSectionMutation = useMutation({
    mutationFn: async ({ mediaId, section, sectionIndex }: { mediaId: string; section: string; sectionIndex: number }) => {
      await apiRequest('PATCH', `/api/external-units/${unitId}/media/${mediaId}/move-section`, { section, sectionIndex });
    },
    onSuccess: () => {
      refetchMedia();
      onMediaChange?.();
      toast({ title: language === "es" ? "Imagen movida correctamente" : "Image moved successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: language === "es" ? "Error al mover imagen" : "Error moving image", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleFileSelect = useCallback(async (sectionKey: string, section: string, sectionIndex: number, files: FileList | null) => {
    if (!files || files.length === 0 || !unitId) return;

    const validFiles = Array.from(files).filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: t.uploadError,
          description: `${file.name}: Archivo muy grande (máx 10MB)`,
          variant: "destructive",
        });
        return false;
      }
      return file.type.startsWith('image/');
    });

    if (validFiles.length === 0) return;

    setUploadingSection(sectionKey);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      validFiles.forEach(file => formData.append('images', file));
      formData.append('section', section);
      formData.append('sectionIndex', String(sectionIndex));

      setUploadProgress(30);

      const response = await fetch(`/api/external-units/${unitId}/media`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      setUploadProgress(80);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      setUploadProgress(100);
      toast({ title: t.uploadSuccess });
      refetchMedia();
      onMediaChange?.();
    } catch (err: any) {
      toast({ title: t.uploadError, description: err.message, variant: "destructive" });
    } finally {
      setUploadingSection(null);
      setUploadProgress(0);
      if (fileInputRefs.current[sectionKey]) {
        fileInputRefs.current[sectionKey]!.value = '';
      }
    }
  }, [unitId, t, toast, refetchMedia, onMediaChange]);

  const handleDragEnd = useCallback((sectionKey: string, section: string, sectionIndex: number) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sectionMedia = groupedMedia[sectionKey] || [];
    const oldIndex = sectionMedia.findIndex(m => m.id === active.id);
    const newIndex = sectionMedia.findIndex(m => m.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(sectionMedia, oldIndex, newIndex);
      reorderMutation.mutate({ 
        section, 
        sectionIndex, 
        mediaIds: newOrder.map(m => m.id) 
      });
    }
  }, [groupedMedia, reorderMutation]);

  const openLightbox = (sectionMedia: MediaItem[], index: number) => {
    setLightboxImages(sectionMedia);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const getSectionIcon = (section: string) => {
    const Icon = SECTION_ICONS[section] || Camera;
    return <Icon className="h-4 w-4" />;
  };

  if (!unitId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t.saveFirst}</p>
        </CardContent>
      </Card>
    );
  }

  if (sectionsLoading || mediaLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5" />
            {t.mediaManager}
            <Badge variant="outline" className="ml-auto">
              {mediaItems.length} {language === "es" ? "imágenes" : "images"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <Accordion
              type="multiple"
              value={expandedSections}
              onValueChange={setExpandedSections}
              className="space-y-2"
            >
              {sections.map((sec) => {
                const sectionKey = sec.sectionIndex > 1 ? `${sec.section}_${sec.sectionIndex}` : sec.section;
                const sectionMedia = groupedMedia[sectionKey] || [];
                const isUploading = uploadingSection === sectionKey;

                return (
                  <AccordionItem 
                    key={sectionKey} 
                    value={sectionKey}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 text-left">
                        {getSectionIcon(sec.section)}
                        <span className="font-medium">
                          {sec.label[language]}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {sectionMedia.length}
                        </Badge>
                        {sectionMedia.some(m => m.isCover) && (
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-3">
                        {!readOnly && (
                          <div
                            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                              isUploading ? 'bg-muted' : 'hover:border-primary cursor-pointer'
                            }`}
                            onClick={() => !isUploading && fileInputRefs.current[sectionKey]?.click()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (!isUploading) {
                                handleFileSelect(sectionKey, sec.section, sec.sectionIndex, e.dataTransfer.files);
                              }
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            data-testid={`dropzone-${sectionKey}`}
                          >
                            <input
                              ref={(el) => { fileInputRefs.current[sectionKey] = el; }}
                              type="file"
                              accept={ACCEPTED_FORMATS}
                              multiple
                              className="hidden"
                              onChange={(e) => handleFileSelect(sectionKey, sec.section, sec.sectionIndex, e.target.files)}
                              data-testid={`input-file-${sectionKey}`}
                            />
                            {isUploading ? (
                              <div className="space-y-2">
                                <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                                <Progress value={uploadProgress} className="h-2" />
                                <p className="text-sm text-muted-foreground">{t.uploading}</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <Plus className="h-6 w-6 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">{t.dragDrop}</p>
                                <p className="text-xs text-muted-foreground">{t.formats}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {sectionMedia.length > 0 && (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd(sectionKey, sec.section, sec.sectionIndex)}
                          >
                            <SortableContext
                              items={sectionMedia.map(m => m.id)}
                              strategy={horizontalListSortingStrategy}
                            >
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                {sectionMedia.map((item, idx) => (
                                  <SortableImage
                                    key={item.id}
                                    item={item}
                                    onDelete={() => deleteMutation.mutate(item.id)}
                                    onSetCover={() => setCoverMutation.mutate(item.id)}
                                    onMoveToSection={(newSection, newSectionIndex) => moveSectionMutation.mutate({ mediaId: item.id, section: newSection, sectionIndex: newSectionIndex })}
                                    onClick={() => openLightbox(sectionMedia, idx)}
                                    disabled={readOnly}
                                    sections={sections}
                                    currentSection={sectionKey}
                                    language={language}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        )}

                        {sectionMedia.length === 0 && readOnly && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            {t.noImages}
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95">
          <DialogHeader className="absolute top-4 left-4 right-4 z-10 flex flex-row items-center justify-between">
            <DialogTitle className="text-white">
              {lightboxIndex + 1} / {lightboxImages.length}
            </DialogTitle>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
              data-testid="close-lightbox"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>
          <div className="relative h-[80vh] flex items-center justify-center">
            {lightboxImages.length > 0 && (
              <img
                src={lightboxImages[lightboxIndex]?.url}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            )}
            {lightboxImages.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-4 text-white hover:bg-white/20"
                  onClick={() => setLightboxIndex(prev => (prev > 0 ? prev - 1 : lightboxImages.length - 1))}
                  data-testid="lightbox-prev"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-4 text-white hover:bg-white/20"
                  onClick={() => setLightboxIndex(prev => (prev < lightboxImages.length - 1 ? prev + 1 : 0))}
                  data-testid="lightbox-next"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
