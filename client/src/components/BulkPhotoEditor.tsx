import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PhotoEditor, ImageAdjustments, WatermarkConfig, realEstateFilters, FilterPreset } from "./PhotoEditor";
import {
  Images, CheckCircle2, XCircle, RefreshCw, Wand2, Stamp,
  Sun, Contrast, Droplets, Thermometer, Sparkles, Check, X,
  Download, Save, RotateCcw, Play, Pause, AlertTriangle, Type, ImageIcon, Move
} from "lucide-react";

export interface BulkPhoto {
  id: string;
  url: string;
  name?: string;
  originalUrl?: string;
  isProcessed?: boolean;
  error?: string;
}

interface BulkPhotoEditorProps {
  photos: BulkPhoto[];
  onSave?: (processedPhotos: Array<{ id: string; blob: Blob; adjustments: ImageAdjustments; watermark?: WatermarkConfig }>) => Promise<void>;
  onClose?: () => void;
  language?: "es" | "en";
  agencyLogo?: string;
  agencyName?: string;
}

const defaultAdjustments: ImageAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  sharpness: 0,
};

const defaultWatermark: WatermarkConfig = {
  enabled: false,
  type: "text",
  text: "",
  position: "bottom-right",
  opacity: 70,
  size: 24,
  padding: 20,
};

export function BulkPhotoEditor({
  photos,
  onSave,
  onClose,
  language = "es",
  agencyLogo,
  agencyName,
}: BulkPhotoEditorProps) {
  const { toast } = useToast();
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(
    new Set(photos.map(p => p.id))
  );
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(defaultAdjustments);
  const [watermark, setWatermark] = useState<WatermarkConfig>({
    ...defaultWatermark,
    text: agencyName || "",
  });
  const [selectedFilter, setSelectedFilter] = useState<string>("original");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [processingErrors, setProcessingErrors] = useState<string[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<BulkPhoto | null>(null);

  const t = {
    es: {
      title: "Editor de Fotos en Lote",
      selectAll: "Seleccionar todo",
      deselectAll: "Deseleccionar todo",
      selected: "seleccionadas",
      adjustments: "Ajustes",
      filters: "Filtros",
      watermark: "Marca de Agua",
      brightness: "Brillo",
      contrast: "Contraste",
      saturation: "Saturación",
      warmth: "Calidez",
      exposure: "Exposición",
      highlights: "Luces",
      shadows: "Sombras",
      apply: "Aplicar a seleccionadas",
      processing: "Procesando...",
      cancel: "Cancelar",
      close: "Cerrar",
      reset: "Restablecer",
      preview: "Vista previa",
      processed: "procesadas",
      errors: "errores",
      success: "Fotos procesadas",
      successDesc: "Se aplicaron los cambios correctamente",
      errorTitle: "Error al procesar",
      errorDesc: "Algunas fotos no pudieron ser procesadas",
      enableWatermark: "Activar marca de agua",
      text: "Texto",
      image: "Imagen",
      position: "Posición",
      opacity: "Opacidad",
      size: "Tamaño",
      padding: "Margen",
      topLeft: "Arriba izq.",
      topRight: "Arriba der.",
      bottomLeft: "Abajo izq.",
      bottomRight: "Abajo der.",
      center: "Centro",
      uploadLogo: "Subir logo",
      clickToPreview: "Clic para vista previa",
    },
    en: {
      title: "Bulk Photo Editor",
      selectAll: "Select all",
      deselectAll: "Deselect all",
      selected: "selected",
      adjustments: "Adjustments",
      filters: "Filters",
      watermark: "Watermark",
      brightness: "Brightness",
      contrast: "Contrast",
      saturation: "Saturation",
      warmth: "Warmth",
      exposure: "Exposure",
      highlights: "Highlights",
      shadows: "Shadows",
      apply: "Apply to selected",
      processing: "Processing...",
      cancel: "Cancel",
      close: "Close",
      reset: "Reset",
      preview: "Preview",
      processed: "processed",
      errors: "errors",
      success: "Photos processed",
      successDesc: "Changes applied successfully",
      errorTitle: "Processing error",
      errorDesc: "Some photos could not be processed",
      enableWatermark: "Enable watermark",
      text: "Text",
      image: "Image",
      position: "Position",
      opacity: "Opacity",
      size: "Size",
      padding: "Padding",
      topLeft: "Top Left",
      topRight: "Top Right",
      bottomLeft: "Bottom Left",
      bottomRight: "Bottom Right",
      center: "Center",
      uploadLogo: "Upload logo",
      clickToPreview: "Click to preview",
    },
  }[language];

  const togglePhoto = (id: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPhotos(newSelected);
  };

  const selectAll = () => {
    setSelectedPhotos(new Set(photos.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedPhotos(new Set());
  };

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
    const filter = realEstateFilters.find(f => f.id === filterId);
    if (filter) {
      setAdjustments({
        ...defaultAdjustments,
        ...filter.adjustments,
      });
    }
  };

  const handleReset = () => {
    setAdjustments(defaultAdjustments);
    setSelectedFilter("original");
    setWatermark({
      ...defaultWatermark,
      text: agencyName || "",
    });
  };

  const processImage = async (photo: BulkPhoto): Promise<{ id: string; blob: Blob; adjustments: ImageAdjustments; watermark?: WatermarkConfig }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Skip pixel manipulation if all values are at default
        const isDefault = 
          adjustments.brightness === 100 &&
          adjustments.contrast === 100 &&
          adjustments.saturation === 100 &&
          adjustments.warmth === 0 &&
          adjustments.exposure === 0 &&
          adjustments.highlights === 0 &&
          adjustments.shadows === 0;

        if (!isDefault) {
          const brightness = adjustments.brightness / 100;
          const saturation = adjustments.saturation / 100;
          const warmthVal = adjustments.warmth / 100;
          const exposure = 1 + (adjustments.exposure / 100);
          const highlights = adjustments.highlights / 100;
          const shadows = adjustments.shadows / 100;

          for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Apply brightness and exposure
            r = r * brightness * exposure;
            g = g * brightness * exposure;
            b = b * brightness * exposure;

            // Apply contrast only if different from default
            if (adjustments.contrast !== 100) {
              const contrastLevel = ((adjustments.contrast - 100) / 100) * 255;
              const factor = (259 * (contrastLevel + 255)) / (255 * (259 - contrastLevel));
              r = factor * (r - 128) + 128;
              g = factor * (g - 128) + 128;
              b = factor * (b - 128) + 128;
            }

            // Apply saturation only if different from default
            if (adjustments.saturation !== 100) {
              const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
              r = gray + saturation * (r - gray);
              g = gray + saturation * (g - gray);
              b = gray + saturation * (b - gray);
            }

            // Apply warmth only if different from default
            if (adjustments.warmth !== 0) {
              r = r + warmthVal * 30;
              b = b - warmthVal * 30;
            }

            // Apply highlights and shadows only if different from default
            if (adjustments.highlights !== 0 || adjustments.shadows !== 0) {
              const luminance = (r + g + b) / 3;
              if (luminance > 128 && adjustments.highlights !== 0) {
                const highlightFactor = ((luminance - 128) / 127) * highlights * 30;
                r = r + highlightFactor;
                g = g + highlightFactor;
                b = b + highlightFactor;
              } else if (luminance <= 128 && adjustments.shadows !== 0) {
                const shadowFactor = ((128 - luminance) / 128) * shadows * 30;
                r = r + shadowFactor;
                g = g + shadowFactor;
                b = b + shadowFactor;
              }
            }

            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
          }

          ctx.putImageData(imageData, 0, 0);
        }

        if (watermark.enabled && watermark.type === "text" && watermark.text) {
          ctx.globalAlpha = watermark.opacity / 100;
          ctx.font = `bold ${watermark.size}px Arial`;
          ctx.fillStyle = "white";
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = 2;

          const textMetrics = ctx.measureText(watermark.text);
          const textWidth = textMetrics.width;
          const textHeight = watermark.size;
          const padding = watermark.padding;

          let x = 0;
          let y = 0;

          switch (watermark.position) {
            case "top-left":
              x = padding;
              y = padding + textHeight;
              break;
            case "top-right":
              x = canvas.width - textWidth - padding;
              y = padding + textHeight;
              break;
            case "bottom-left":
              x = padding;
              y = canvas.height - padding;
              break;
            case "bottom-right":
              x = canvas.width - textWidth - padding;
              y = canvas.height - padding;
              break;
            case "center":
              x = (canvas.width - textWidth) / 2;
              y = canvas.height / 2 + textHeight / 2;
              break;
          }

          ctx.strokeText(watermark.text, x, y);
          ctx.fillText(watermark.text, x, y);
          ctx.globalAlpha = 1;
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ id: photo.id, blob, adjustments, watermark: watermark.enabled ? watermark : undefined });
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          "image/jpeg",
          0.92
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = photo.url;
    });
  };

  const handleApply = async () => {
    if (selectedPhotos.size === 0) {
      toast({
        variant: "destructive",
        title: language === "es" ? "Sin selección" : "No selection",
        description: language === "es" 
          ? "Selecciona al menos una foto" 
          : "Select at least one photo",
      });
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);
    setProcessingErrors([]);

    const selectedPhotosList = photos.filter(p => selectedPhotos.has(p.id));
    const results: Array<{ id: string; blob: Blob; adjustments: ImageAdjustments; watermark?: WatermarkConfig }> = [];
    const errors: string[] = [];

    for (const photo of selectedPhotosList) {
      try {
        const result = await processImage(photo);
        results.push(result);
        setProcessedCount(prev => prev + 1);
      } catch (error: any) {
        errors.push(`${photo.name || photo.id}: ${error.message}`);
        setProcessedCount(prev => prev + 1);
      }
    }

    setProcessingErrors(errors);

    if (onSave && results.length > 0) {
      try {
        await onSave(results);
        toast({
          title: t.success,
          description: `${results.length} ${t.processed}`,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: t.errorTitle,
          description: error.message,
        });
      }
    }

    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: t.errorTitle,
        description: `${errors.length} ${t.errors}`,
      });
    }

    setIsProcessing(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setWatermark(prev => ({
          ...prev,
          type: "image",
          imageUrl: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const AdjustmentSlider = ({ 
    label, 
    value, 
    min, 
    max, 
    onChange,
    icon: Icon,
  }: { 
    label: string; 
    value: number; 
    min: number; 
    max: number; 
    onChange: (v: number) => void;
    icon: any;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </Label>
        <span className="text-xs text-muted-foreground font-mono w-12 text-right">
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={([v]) => onChange(v)}
        className="cursor-pointer"
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Images className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <Badge variant="secondary">
            {selectedPhotos.size} / {photos.length} {t.selected}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={selectAll} data-testid="button-select-all">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {t.selectAll}
          </Button>
          <Button size="sm" variant="outline" onClick={deselectAll} data-testid="button-deselect-all">
            <XCircle className="h-4 w-4 mr-1" />
            {t.deselectAll}
          </Button>
          {onClose && (
            <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-bulk">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r overflow-hidden flex flex-col bg-muted/30">
          <div className="p-2 border-b text-sm font-medium text-muted-foreground">
            {t.clickToPreview}
          </div>
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-2 p-2">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedPhotos.has(photo.id)
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                  onClick={() => setPreviewPhoto(photo)}
                  data-testid={`photo-thumbnail-${photo.id}`}
                >
                  <div className="aspect-video bg-muted">
                    <img
                      src={photo.url}
                      alt={photo.name || photo.id}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    className="absolute top-1 left-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePhoto(photo.id);
                    }}
                  >
                    <Checkbox
                      checked={selectedPhotos.has(photo.id)}
                      className="bg-white/80"
                      data-testid={`checkbox-photo-${photo.id}`}
                    />
                  </div>
                  {photo.isProcessed && (
                    <div className="absolute top-1 right-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                  {photo.error && (
                    <div className="absolute top-1 right-1">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="adjustments" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b h-auto p-0 mx-4">
              <TabsTrigger 
                value="adjustments" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                data-testid="bulk-tab-adjustments"
              >
                <Sun className="h-4 w-4 mr-1" />
                {t.adjustments}
              </TabsTrigger>
              <TabsTrigger 
                value="filters"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                data-testid="bulk-tab-filters"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {t.filters}
              </TabsTrigger>
              <TabsTrigger 
                value="watermark"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                data-testid="bulk-tab-watermark"
              >
                <Stamp className="h-4 w-4 mr-1" />
                {t.watermark}
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="adjustments" className="p-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <AdjustmentSlider
                      label={t.brightness}
                      value={adjustments.brightness}
                      min={50}
                      max={150}
                      onChange={(v) => setAdjustments(prev => ({ ...prev, brightness: v }))}
                      icon={Sun}
                    />
                    <AdjustmentSlider
                      label={t.contrast}
                      value={adjustments.contrast}
                      min={50}
                      max={150}
                      onChange={(v) => setAdjustments(prev => ({ ...prev, contrast: v }))}
                      icon={Contrast}
                    />
                    <AdjustmentSlider
                      label={t.saturation}
                      value={adjustments.saturation}
                      min={0}
                      max={200}
                      onChange={(v) => setAdjustments(prev => ({ ...prev, saturation: v }))}
                      icon={Droplets}
                    />
                    <AdjustmentSlider
                      label={t.warmth}
                      value={adjustments.warmth}
                      min={-50}
                      max={50}
                      onChange={(v) => setAdjustments(prev => ({ ...prev, warmth: v }))}
                      icon={Thermometer}
                    />
                  </div>
                  <div className="space-y-4">
                    <AdjustmentSlider
                      label={t.exposure}
                      value={adjustments.exposure}
                      min={-50}
                      max={50}
                      onChange={(v) => setAdjustments(prev => ({ ...prev, exposure: v }))}
                      icon={Sun}
                    />
                    <AdjustmentSlider
                      label={t.highlights}
                      value={adjustments.highlights}
                      min={-50}
                      max={50}
                      onChange={(v) => setAdjustments(prev => ({ ...prev, highlights: v }))}
                      icon={Sun}
                    />
                    <AdjustmentSlider
                      label={t.shadows}
                      value={adjustments.shadows}
                      min={-50}
                      max={50}
                      onChange={(v) => setAdjustments(prev => ({ ...prev, shadows: v }))}
                      icon={Contrast}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="filters" className="p-4 mt-0">
                <div className="grid grid-cols-5 gap-3">
                  {realEstateFilters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => handleFilterSelect(filter.id)}
                      className={`relative p-2 rounded-lg border-2 transition-all ${
                        selectedFilter === filter.id
                          ? "border-primary bg-primary/10"
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      }`}
                      data-testid={`bulk-filter-${filter.id}`}
                    >
                      <div className="aspect-video bg-gradient-to-br from-muted to-muted-foreground/20 rounded mb-1 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                      <span className="text-xs font-medium">
                        {language === "es" ? filter.nameEs : filter.name}
                      </span>
                      {selectedFilter === filter.id && (
                        <div className="absolute top-1 right-1">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="watermark" className="p-4 space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>{t.enableWatermark}</Label>
                      <Button
                        size="sm"
                        variant={watermark.enabled ? "default" : "outline"}
                        onClick={() => setWatermark(prev => ({ ...prev, enabled: !prev.enabled }))}
                        data-testid="bulk-button-toggle-watermark"
                      >
                        {watermark.enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </Button>
                    </div>

                    {watermark.enabled && (
                      <>
                        <div className="space-y-2">
                          <Label>{t.text} / {t.image}</Label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={watermark.type === "text" ? "default" : "outline"}
                              onClick={() => setWatermark(prev => ({ ...prev, type: "text" }))}
                              className="flex-1"
                            >
                              <Type className="h-4 w-4 mr-1" />
                              {t.text}
                            </Button>
                            <Button
                              size="sm"
                              variant={watermark.type === "image" ? "default" : "outline"}
                              onClick={() => setWatermark(prev => ({ ...prev, type: "image" }))}
                              className="flex-1"
                            >
                              <ImageIcon className="h-4 w-4 mr-1" />
                              {t.image}
                            </Button>
                          </div>
                        </div>

                        {watermark.type === "text" ? (
                          <div className="space-y-2">
                            <Label>{t.text}</Label>
                            <Input
                              value={watermark.text || ""}
                              onChange={(e) => setWatermark(prev => ({ ...prev, text: e.target.value }))}
                              placeholder={agencyName || "Agency Name"}
                              data-testid="bulk-input-watermark-text"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label>{t.uploadLogo}</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              data-testid="bulk-input-watermark-logo"
                            />
                            {(watermark.imageUrl || agencyLogo) && (
                              <div className="p-2 bg-muted rounded flex items-center justify-center">
                                <img 
                                  src={watermark.imageUrl || agencyLogo} 
                                  alt="Logo" 
                                  className="max-h-12 object-contain"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {watermark.enabled && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t.position}</Label>
                        <Select
                          value={watermark.position}
                          onValueChange={(v) => setWatermark(prev => ({ 
                            ...prev, 
                            position: v as WatermarkConfig["position"] 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top-left">{t.topLeft}</SelectItem>
                            <SelectItem value="top-right">{t.topRight}</SelectItem>
                            <SelectItem value="bottom-left">{t.bottomLeft}</SelectItem>
                            <SelectItem value="bottom-right">{t.bottomRight}</SelectItem>
                            <SelectItem value="center">{t.center}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <AdjustmentSlider
                        label={t.opacity}
                        value={watermark.opacity}
                        min={10}
                        max={100}
                        onChange={(v) => setWatermark(prev => ({ ...prev, opacity: v }))}
                        icon={Droplets}
                      />

                      <AdjustmentSlider
                        label={t.size}
                        value={watermark.size}
                        min={12}
                        max={72}
                        onChange={(v) => setWatermark(prev => ({ ...prev, size: v }))}
                        icon={Type}
                      />

                      <AdjustmentSlider
                        label={t.padding}
                        value={watermark.padding}
                        min={5}
                        max={100}
                        onChange={(v) => setWatermark(prev => ({ ...prev, padding: v }))}
                        icon={Move}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>

      {isProcessing && (
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">{t.processing}</span>
            <span className="text-sm text-muted-foreground">
              {processedCount} / {selectedPhotos.size}
            </span>
          </div>
          <Progress value={(processedCount / selectedPhotos.size) * 100} />
        </div>
      )}

      <div className="flex items-center justify-between p-4 border-t">
        <Button variant="outline" onClick={handleReset} disabled={isProcessing} data-testid="button-bulk-reset">
          <RotateCcw className="h-4 w-4 mr-2" />
          {t.reset}
        </Button>
        <div className="flex gap-2">
          {onClose && (
            <Button variant="outline" onClick={onClose} disabled={isProcessing} data-testid="button-bulk-cancel">
              {t.cancel}
            </Button>
          )}
          <Button 
            onClick={handleApply} 
            disabled={isProcessing || selectedPhotos.size === 0}
            data-testid="button-bulk-apply"
          >
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            {isProcessing ? t.processing : t.apply} ({selectedPhotos.size})
          </Button>
        </div>
      </div>

      {previewPhoto && (
        <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
          <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden">
            <PhotoEditor
              imageUrl={previewPhoto.url}
              language={language}
              agencyLogo={agencyLogo}
              agencyName={agencyName}
              initialAdjustments={adjustments}
              initialWatermark={watermark}
              onClose={() => setPreviewPhoto(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface BulkPhotoEditorDialogProps extends Omit<BulkPhotoEditorProps, "onClose"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkPhotoEditorDialog({
  open,
  onOpenChange,
  ...props
}: BulkPhotoEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        <BulkPhotoEditor {...props} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

export default BulkPhotoEditor;
