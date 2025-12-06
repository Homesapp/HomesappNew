import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Star, 
  X, 
  GripVertical,
  Plus,
  Loader2,
  AlertCircle,
  Check,
  ArrowUpDown,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PhotoItem {
  id: string;
  unitId: string;
  agencyId: string;
  url: string;
  storageUrl?: string;
  photoSlot: 'primary' | 'secondary';
  position: number;
  qualityVersion?: number;
  migrationStatus?: string;
  isCover: boolean;
  createdAt: string;
}

interface SlotData {
  photos: PhotoItem[];
  count: number;
  maxAllowed: number;
}

interface PhotoSlotManagerProps {
  unitId: string;
  language?: "es" | "en";
  readOnly?: boolean;
  onPhotoChange?: () => void;
}

const LABELS = {
  es: {
    primaryPhotos: "Fotos Principales",
    primaryDescription: "Las mejores fotos de la propiedad (máximo 5)",
    secondaryPhotos: "Fotos Secundarias",
    secondaryDescription: "Fotos adicionales para mostrar más detalles (máximo 20)",
    addPhoto: "Agregar foto",
    noPhotos: "Sin fotos",
    dropHere: "Arrastra fotos aquí o haz clic para subir",
    uploading: "Subiendo...",
    moveToPrimary: "Mover a Principales",
    moveToSecondary: "Mover a Secundarias",
    deletePhoto: "Eliminar foto",
    deleteConfirm: "¿Estás seguro de que deseas eliminar esta foto?",
    deleteAll: "Eliminar todas",
    deleteAllConfirm: "¿Eliminar todas las fotos de esta sección?",
    cancel: "Cancelar",
    confirm: "Confirmar",
    slotFull: "Sección llena",
    dragToReorder: "Arrastra para reordenar",
    photoOf: "de",
    cover: "Portada",
    enhanceWithAI: "Embellecer con IA",
    enhancing: "Embelleciendo...",
    enhanceSuccess: "Fotos embellecidas",
    enhanced: "Embellecida",
    revertToOriginal: "Volver a original",
    enhanceAllTitle: "Embellecer fotos con IA",
    enhanceAllDescription: "Esta acción usará inteligencia artificial para mejorar automáticamente todas las fotos (brillo, contraste, colores). Las fotos originales se guardarán y podrás revertir los cambios en cualquier momento."
  },
  en: {
    primaryPhotos: "Primary Photos",
    primaryDescription: "Best property photos (maximum 5)",
    secondaryPhotos: "Secondary Photos",
    secondaryDescription: "Additional photos showing more details (maximum 20)",
    addPhoto: "Add photo",
    noPhotos: "No photos",
    dropHere: "Drag photos here or click to upload",
    uploading: "Uploading...",
    moveToPrimary: "Move to Primary",
    moveToSecondary: "Move to Secondary",
    deletePhoto: "Delete photo",
    deleteConfirm: "Are you sure you want to delete this photo?",
    deleteAll: "Delete all",
    deleteAllConfirm: "Delete all photos in this section?",
    cancel: "Cancel",
    confirm: "Confirm",
    slotFull: "Section full",
    dragToReorder: "Drag to reorder",
    photoOf: "of",
    cover: "Cover",
    enhanceWithAI: "Enhance with AI",
    enhancing: "Enhancing...",
    enhanceSuccess: "Photos enhanced",
    enhanced: "Enhanced",
    revertToOriginal: "Revert to original",
    enhanceAllTitle: "Enhance photos with AI",
    enhanceAllDescription: "This action will use artificial intelligence to automatically improve all photos (brightness, contrast, colors). Original photos will be saved and you can revert changes at any time."
  }
};

function SortablePhoto({ 
  photo, 
  slot,
  disabled,
  language,
  onDelete,
  onMove
}: { 
  photo: PhotoItem;
  slot: 'primary' | 'secondary';
  disabled: boolean;
  language: "es" | "en";
  onDelete: () => void;
  onMove: (newSlot: 'primary' | 'secondary') => void;
}) {
  const t = LABELS[language];
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const otherSlot = slot === 'primary' ? 'secondary' : 'primary';
  const moveLabel = slot === 'primary' ? t.moveToSecondary : t.moveToPrimary;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square rounded-lg overflow-hidden border bg-muted shrink-0 w-[120px] h-[120px]"
      data-testid={`photo-${photo.id}`}
    >
      <img
        src={photo.storageUrl || photo.url}
        alt={`Photo ${photo.position}`}
        className="w-full h-full object-cover"
      />
      
      {photo.position === 1 && slot === 'primary' && (
        <Badge className="absolute top-1 left-1 text-xs px-1.5 py-0.5" variant="secondary">
          <Star className="h-3 w-3 mr-0.5 fill-yellow-500 text-yellow-500" />
          {t.cover}
        </Badge>
      )}

      {photo.qualityVersion === 2 && (
        <div className="absolute top-1 right-1">
          <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-green-500/80 text-white">
            HD
          </Badge>
        </div>
      )}

      {!disabled && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="p-2 bg-white/20 rounded-full cursor-grab hover:bg-white/30"
            title={t.dragToReorder}
          >
            <GripVertical className="h-4 w-4 text-white" />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 bg-white/20 hover:bg-white/30 rounded-full"
                data-testid={`menu-photo-${photo.id}`}
              >
                <MoreVertical className="h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onMove(otherSlot)}>
                {slot === 'primary' ? <ArrowDown className="h-4 w-4 mr-2" /> : <ArrowUp className="h-4 w-4 mr-2" />}
                {moveLabel}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t.deletePhoto}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

function PhotoSlotSection({
  slot,
  data,
  unitId,
  language,
  readOnly,
  onUpload,
  onReorder,
  onMove,
  onDelete,
  onDeleteAll,
  uploading
}: {
  slot: 'primary' | 'secondary';
  data: SlotData;
  unitId: string;
  language: "es" | "en";
  readOnly: boolean;
  onUpload: (slot: 'primary' | 'secondary', files: FileList) => void;
  onReorder: (slot: 'primary' | 'secondary', photoIds: string[]) => void;
  onMove: (photoId: string, newSlot: 'primary' | 'secondary') => void;
  onDelete: (photoId: string) => void;
  onDeleteAll: (slot: 'primary' | 'secondary') => void;
  uploading: boolean;
}) {
  const t = LABELS[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const title = slot === 'primary' ? t.primaryPhotos : t.secondaryPhotos;
  const description = slot === 'primary' ? t.primaryDescription : t.secondaryDescription;
  const isFull = data.count >= data.maxAllowed;
  const progress = (data.count / data.maxAllowed) * 100;
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = data.photos.findIndex(p => p.id === active.id);
    const newIndex = data.photos.findIndex(p => p.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(data.photos, oldIndex, newIndex).map(p => p.id);
      onReorder(slot, newOrder);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(slot, e.target.files);
    }
  };

  return (
    <Card className={slot === 'primary' ? 'border-primary/30 bg-primary/5' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {slot === 'primary' && <Star className="h-4 w-4 text-yellow-500" />}
              {title}
              <Badge variant={isFull ? "destructive" : "outline"} className="ml-2">
                {data.count} {t.photoOf} {data.maxAllowed}
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm mt-1">{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && data.count > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDeleteAll(slot)}
                data-testid={`delete-all-${slot}`}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t.deleteAll}
              </Button>
            )}
            {!readOnly && !isFull && (
              <Button
                size="sm"
                variant={slot === 'primary' ? 'default' : 'outline'}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || isFull}
                data-testid={`upload-${slot}`}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                {t.addPhoto}
              </Button>
            )}
          </div>
        </div>
        <Progress value={progress} className={`h-1.5 mt-2 ${isFull ? 'bg-destructive/20' : ''}`} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardHeader>
      <CardContent>
        {data.photos.length === 0 ? (
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            onClick={() => !readOnly && !isFull && fileInputRef.current?.click()}
          >
            <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{readOnly ? t.noPhotos : t.dropHere}</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={data.photos.map(p => p.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-3 overflow-x-auto pb-2">
                {data.photos.map((photo) => (
                  <SortablePhoto
                    key={photo.id}
                    photo={photo}
                    slot={slot}
                    disabled={readOnly}
                    language={language}
                    onDelete={() => onDelete(photo.id)}
                    onMove={(newSlot) => onMove(photo.id, newSlot)}
                  />
                ))}
                {!readOnly && !isFull && (
                  <div 
                    className="shrink-0 w-[120px] h-[120px] border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}

export function PhotoSlotManager({ unitId, language = "es", readOnly = false, onPhotoChange }: PhotoSlotManagerProps) {
  const { toast } = useToast();
  const t = LABELS[language];
  const [uploadingSlot, setUploadingSlot] = useState<'primary' | 'secondary' | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [slotToDeleteAll, setSlotToDeleteAll] = useState<'primary' | 'secondary' | null>(null);
  const [enhanceDialogOpen, setEnhanceDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery<{ primary: SlotData; secondary: SlotData }>({
    queryKey: ['/api/external-units', unitId, 'photos', 'slots'],
    enabled: !!unitId
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ slot, file }: { slot: 'primary' | 'secondary'; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`/api/external-units/${unitId}/photos/slots/${slot}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetch();
      onPhotoChange?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ slot, photoIds }: { slot: 'primary' | 'secondary'; photoIds: string[] }) => {
      return apiRequest('POST', `/api/external-units/${unitId}/photos/slots/${slot}/reorder`, { photoIds });
    },
    onSuccess: () => {
      refetch();
      onPhotoChange?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const moveMutation = useMutation({
    mutationFn: async ({ photoId, newSlot }: { photoId: string; newSlot: 'primary' | 'secondary' }) => {
      return apiRequest('PATCH', `/api/external-units/${unitId}/photos/${photoId}/slot`, { newSlot });
    },
    onSuccess: () => {
      refetch();
      onPhotoChange?.();
      toast({
        title: language === 'es' ? "Foto movida" : "Photo moved",
        description: language === 'es' ? "La foto fue movida correctamente" : "Photo moved successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (photoId: string) => {
      return apiRequest('DELETE', `/api/external-units/${unitId}/photos/${photoId}`);
    },
    onSuccess: () => {
      refetch();
      onPhotoChange?.();
      setDeleteDialogOpen(false);
      setPhotoToDelete(null);
      toast({
        title: language === 'es' ? "Foto eliminada" : "Photo deleted",
        description: language === 'es' ? "La foto fue eliminada correctamente" : "Photo deleted successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: async (slot: 'primary' | 'secondary') => {
      return apiRequest('DELETE', `/api/external-units/${unitId}/photos/slots/${slot}`);
    },
    onSuccess: (_, slot) => {
      refetch();
      onPhotoChange?.();
      setDeleteAllDialogOpen(false);
      setSlotToDeleteAll(null);
      toast({
        title: language === 'es' ? "Fotos eliminadas" : "Photos deleted",
        description: language === 'es' 
          ? `Todas las fotos ${slot === 'primary' ? 'principales' : 'secundarias'} fueron eliminadas`
          : `All ${slot} photos have been deleted`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const enhanceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/external-units/${unitId}/photos/enhance`, {});
    },
    onSuccess: (result: any) => {
      refetch();
      onPhotoChange?.();
      setEnhanceDialogOpen(false);
      toast({
        title: t.enhanceSuccess,
        description: language === 'es' 
          ? `${result.enhanced} fotos embellecidas, ${result.failed} fallidas`
          : `${result.enhanced} photos enhanced, ${result.failed} failed`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleUpload = useCallback(async (slot: 'primary' | 'secondary', files: FileList) => {
    setUploadingSlot(slot);
    
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Error",
            description: `${file.name} is too large (max 10MB)`,
            variant: "destructive"
          });
          continue;
        }
        await uploadMutation.mutateAsync({ slot, file });
      }
    } finally {
      setUploadingSlot(null);
    }
  }, [uploadMutation, toast]);

  const handleReorder = useCallback((slot: 'primary' | 'secondary', photoIds: string[]) => {
    reorderMutation.mutate({ slot, photoIds });
  }, [reorderMutation]);

  const handleMove = useCallback((photoId: string, newSlot: 'primary' | 'secondary') => {
    moveMutation.mutate({ photoId, newSlot });
  }, [moveMutation]);

  const handleDeleteClick = useCallback((photoId: string) => {
    setPhotoToDelete(photoId);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (photoToDelete) {
      deleteMutation.mutate(photoToDelete);
    }
  }, [photoToDelete, deleteMutation]);

  const handleDeleteAllClick = useCallback((slot: 'primary' | 'secondary') => {
    setSlotToDeleteAll(slot);
    setDeleteAllDialogOpen(true);
  }, []);

  const handleDeleteAllConfirm = useCallback(() => {
    if (slotToDeleteAll) {
      deleteAllMutation.mutate(slotToDeleteAll);
    }
  }, [slotToDeleteAll, deleteAllMutation]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-[120px] h-[120px] rounded-lg shrink-0" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="w-[120px] h-[120px] rounded-lg shrink-0" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          {language === 'es' ? 'No se pudieron cargar las fotos' : 'Could not load photos'}
        </p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          {language === 'es' ? 'Reintentar' : 'Retry'}
        </Button>
      </Card>
    );
  }

  const totalPhotos = (data?.primary?.count || 0) + (data?.secondary?.count || 0);

  return (
    <div className="space-y-4">
      {/* Header with AI Enhancement Button */}
      {!readOnly && totalPhotos > 0 && (
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            onClick={() => setEnhanceDialogOpen(true)}
            disabled={enhanceMutation.isPending}
            className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-300 dark:border-purple-700 hover:from-purple-500/20 hover:to-pink-500/20"
            data-testid="button-enhance-all"
          >
            {enhanceMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
            )}
            {enhanceMutation.isPending ? t.enhancing : t.enhanceWithAI}
          </Button>
        </div>
      )}

      <PhotoSlotSection
        slot="primary"
        data={data.primary}
        unitId={unitId}
        language={language}
        readOnly={readOnly}
        onUpload={handleUpload}
        onReorder={handleReorder}
        onMove={handleMove}
        onDelete={handleDeleteClick}
        onDeleteAll={handleDeleteAllClick}
        uploading={uploadingSlot === 'primary'}
      />
      
      <PhotoSlotSection
        slot="secondary"
        data={data.secondary}
        unitId={unitId}
        language={language}
        readOnly={readOnly}
        onUpload={handleUpload}
        onReorder={handleReorder}
        onMove={handleMove}
        onDelete={handleDeleteClick}
        onDeleteAll={handleDeleteAllClick}
        uploading={uploadingSlot === 'secondary'}
      />

      {/* Delete Single Photo Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deletePhoto}</DialogTitle>
            <DialogDescription>{t.deleteConfirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Photos in Slot Dialog */}
      <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'es' 
                ? `Eliminar todas las fotos ${slotToDeleteAll === 'primary' ? 'principales' : 'secundarias'}`
                : `Delete all ${slotToDeleteAll} photos`}
            </DialogTitle>
            <DialogDescription>
              {language === 'es'
                ? `¿Estás seguro de que quieres eliminar todas las fotos ${slotToDeleteAll === 'primary' ? 'principales' : 'secundarias'} de esta unidad? Esta acción no se puede deshacer.`
                : `Are you sure you want to delete all ${slotToDeleteAll} photos from this unit? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAllDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAllConfirm}
              disabled={deleteAllMutation.isPending}
            >
              {deleteAllMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {language === 'es' ? 'Eliminar todas' : 'Delete all'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Enhancement Dialog */}
      <Dialog open={enhanceDialogOpen} onOpenChange={setEnhanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              {t.enhanceAllTitle}
            </DialogTitle>
            <DialogDescription>
              {t.enhanceAllDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">{totalPhotos} {language === 'es' ? 'fotos' : 'photos'}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'es' 
                    ? 'Se procesarán todas las fotos de esta unidad' 
                    : 'All photos from this unit will be processed'}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnhanceDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button 
              onClick={() => enhanceMutation.mutate()}
              disabled={enhanceMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {enhanceMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {enhanceMutation.isPending ? t.enhancing : t.enhanceWithAI}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PhotoSlotManager;
