import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Sun, Contrast, Droplets, Thermometer, Sparkles, RotateCcw,
  Download, Save, Image as ImageIcon, Type, Upload, X, Check,
  ZoomIn, ZoomOut, RefreshCw, Palette, Stamp, Move, 
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter
} from "lucide-react";

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  exposure: number;
  highlights: number;
  shadows: number;
  sharpness: number;
}

export interface WatermarkConfig {
  enabled: boolean;
  type: "text" | "image";
  text?: string;
  imageUrl?: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  opacity: number;
  size: number;
  padding: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  nameEs: string;
  adjustments: Partial<ImageAdjustments>;
  thumbnail?: string;
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

export const realEstateFilters: FilterPreset[] = [
  {
    id: "original",
    name: "Original",
    nameEs: "Original",
    adjustments: {},
  },
  {
    id: "luxury",
    name: "Luxury",
    nameEs: "Lujo",
    adjustments: {
      brightness: 105,
      contrast: 110,
      saturation: 90,
      warmth: 5,
      highlights: 10,
    },
  },
  {
    id: "warm-home",
    name: "Warm Home",
    nameEs: "Hogar Cálido",
    adjustments: {
      brightness: 102,
      contrast: 98,
      saturation: 105,
      warmth: 15,
      shadows: 5,
    },
  },
  {
    id: "modern",
    name: "Modern",
    nameEs: "Moderno",
    adjustments: {
      brightness: 105,
      contrast: 115,
      saturation: 85,
      warmth: -5,
      sharpness: 10,
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    nameEs: "Atardecer",
    adjustments: {
      brightness: 100,
      contrast: 105,
      saturation: 115,
      warmth: 25,
      highlights: 15,
    },
  },
  {
    id: "bright-airy",
    name: "Bright & Airy",
    nameEs: "Luminoso",
    adjustments: {
      brightness: 115,
      contrast: 95,
      saturation: 95,
      exposure: 10,
      highlights: 20,
      shadows: 10,
    },
  },
  {
    id: "dramatic",
    name: "Dramatic",
    nameEs: "Dramático",
    adjustments: {
      brightness: 95,
      contrast: 125,
      saturation: 110,
      shadows: -10,
      highlights: -5,
    },
  },
  {
    id: "natural",
    name: "Natural",
    nameEs: "Natural",
    adjustments: {
      brightness: 100,
      contrast: 102,
      saturation: 98,
      warmth: 3,
    },
  },
  {
    id: "coastal",
    name: "Coastal",
    nameEs: "Costero",
    adjustments: {
      brightness: 108,
      contrast: 100,
      saturation: 105,
      warmth: -8,
      highlights: 10,
    },
  },
  {
    id: "vintage",
    name: "Vintage",
    nameEs: "Vintage",
    adjustments: {
      brightness: 98,
      contrast: 95,
      saturation: 80,
      warmth: 20,
      shadows: 10,
    },
  },
];

interface PhotoEditorProps {
  imageUrl: string;
  onSave?: (editedImageBlob: Blob, adjustments: ImageAdjustments, watermark?: WatermarkConfig) => void;
  onClose?: () => void;
  language?: "es" | "en";
  agencyLogo?: string;
  agencyName?: string;
  showWatermark?: boolean;
  initialAdjustments?: Partial<ImageAdjustments>;
  initialWatermark?: Partial<WatermarkConfig>;
}

export function PhotoEditor({
  imageUrl,
  onSave,
  onClose,
  language = "es",
  agencyLogo,
  agencyName,
  showWatermark = true,
  initialAdjustments,
  initialWatermark,
}: PhotoEditorProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const watermarkImageRef = useRef<HTMLImageElement | null>(null);
  
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    ...defaultAdjustments,
    ...initialAdjustments,
  });
  const [watermark, setWatermark] = useState<WatermarkConfig>({
    ...defaultWatermark,
    text: agencyName || "",
    ...initialWatermark,
  });
  const [selectedFilter, setSelectedFilter] = useState<string>("original");
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [isSaving, setIsSaving] = useState(false);

  const t = {
    es: {
      title: "Editor de Fotos",
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
      sharpness: "Nitidez",
      reset: "Restablecer",
      save: "Guardar",
      cancel: "Cancelar",
      download: "Descargar",
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
      zoom: "Zoom",
      saving: "Guardando...",
      saved: "Foto guardada",
      savedDesc: "Los cambios se han aplicado correctamente",
      loading: "Cargando imagen...",
    },
    en: {
      title: "Photo Editor",
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
      sharpness: "Sharpness",
      reset: "Reset",
      save: "Save",
      cancel: "Cancel",
      download: "Download",
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
      zoom: "Zoom",
      saving: "Saving...",
      saved: "Photo saved",
      savedDesc: "Changes have been applied successfully",
      loading: "Loading image...",
    },
  }[language];

  const loadImage = useCallback(() => {
    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      originalImageRef.current = img;
      setIsLoading(false);
      renderCanvas();
    };
    img.onerror = () => {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: language === "es" 
          ? "No se pudo cargar la imagen" 
          : "Failed to load image",
      });
    };
    img.src = imageUrl;
  }, [imageUrl, language, toast]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  useEffect(() => {
    if (watermark.type === "image" && watermark.imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        watermarkImageRef.current = img;
        renderCanvas();
      };
      img.src = watermark.imageUrl;
    } else if (agencyLogo && watermark.type === "image") {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        watermarkImageRef.current = img;
        renderCanvas();
      };
      img.src = agencyLogo;
    }
  }, [watermark.imageUrl, watermark.type, agencyLogo]);

  const applyAdjustments = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Skip adjustments if all values are at default - this prevents color distortion
    const isDefault = 
      adjustments.brightness === 100 &&
      adjustments.contrast === 100 &&
      adjustments.saturation === 100 &&
      adjustments.warmth === 0 &&
      adjustments.exposure === 0 &&
      adjustments.highlights === 0 &&
      adjustments.shadows === 0 &&
      adjustments.sharpness === 0;
    
    if (isDefault) {
      return; // Keep original image untouched
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const brightness = adjustments.brightness / 100;
    const contrast = adjustments.contrast / 100;
    const saturation = adjustments.saturation / 100;
    const warmth = adjustments.warmth / 100;
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
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
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
        r = r + warmth * 30;
        b = b - warmth * 30;
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
  }, [adjustments]);

  const applyWatermark = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!watermark.enabled) return;

    ctx.globalAlpha = watermark.opacity / 100;

    const padding = watermark.padding;
    let x = 0;
    let y = 0;

    if (watermark.type === "text" && watermark.text) {
      ctx.font = `bold ${watermark.size}px Arial`;
      ctx.fillStyle = "white";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 2;

      const textMetrics = ctx.measureText(watermark.text);
      const textWidth = textMetrics.width;
      const textHeight = watermark.size;

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
    } else if (watermark.type === "image" && watermarkImageRef.current) {
      const img = watermarkImageRef.current;
      const aspectRatio = img.width / img.height;
      const logoHeight = watermark.size * 2;
      const logoWidth = logoHeight * aspectRatio;

      switch (watermark.position) {
        case "top-left":
          x = padding;
          y = padding;
          break;
        case "top-right":
          x = canvas.width - logoWidth - padding;
          y = padding;
          break;
        case "bottom-left":
          x = padding;
          y = canvas.height - logoHeight - padding;
          break;
        case "bottom-right":
          x = canvas.width - logoWidth - padding;
          y = canvas.height - logoHeight - padding;
          break;
        case "center":
          x = (canvas.width - logoWidth) / 2;
          y = (canvas.height - logoHeight) / 2;
          break;
      }

      ctx.drawImage(img, x, y, logoWidth, logoHeight);
    }

    ctx.globalAlpha = 1;
  }, [watermark]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    applyAdjustments(ctx, canvas);
    applyWatermark(ctx, canvas);
  }, [applyAdjustments, applyWatermark]);

  useEffect(() => {
    if (!isLoading) {
      renderCanvas();
    }
  }, [adjustments, watermark, isLoading, renderCanvas]);

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

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSave) return;

    setIsSaving(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to create blob"));
        }, "image/jpeg", 0.92);
      });

      await onSave(blob, adjustments, watermark);
      toast({
        title: t.saved,
        description: t.savedDesc,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: language === "es" 
          ? "No se pudo guardar la imagen" 
          : "Failed to save image",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `edited-photo-${Date.now()}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.92);
    link.click();
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
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {t.title}
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              data-testid="button-zoom-out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-mono w-10 text-center">{zoom}%</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              data-testid="button-zoom-in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          {onClose && (
            <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-editor">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex items-center justify-center bg-muted/30 overflow-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span>{t.loading}</span>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                transform: `scale(${zoom / 100})`,
                transformOrigin: "center",
                transition: "transform 0.2s ease",
              }}
              className="shadow-lg rounded"
            />
          )}
        </div>

        <div className="w-80 border-l bg-background overflow-hidden flex flex-col">
          <Tabs defaultValue="adjustments" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b h-auto p-0">
              <TabsTrigger 
                value="adjustments" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                data-testid="tab-adjustments"
              >
                <Sun className="h-4 w-4 mr-1" />
                {t.adjustments}
              </TabsTrigger>
              <TabsTrigger 
                value="filters"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                data-testid="tab-filters"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {t.filters}
              </TabsTrigger>
              {showWatermark && (
                <TabsTrigger 
                  value="watermark"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  data-testid="tab-watermark"
                >
                  <Stamp className="h-4 w-4 mr-1" />
                  {t.watermark}
                </TabsTrigger>
              )}
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="adjustments" className="p-4 space-y-4 mt-0">
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
              </TabsContent>

              <TabsContent value="filters" className="p-4 mt-0">
                <div className="grid grid-cols-2 gap-2">
                  {realEstateFilters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => handleFilterSelect(filter.id)}
                      className={`relative p-2 rounded-lg border-2 transition-all ${
                        selectedFilter === filter.id
                          ? "border-primary bg-primary/10"
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      }`}
                      data-testid={`filter-${filter.id}`}
                    >
                      <div className="aspect-video bg-gradient-to-br from-muted to-muted-foreground/20 rounded mb-1 flex items-center justify-center">
                        <Palette className="h-6 w-6 text-muted-foreground/50" />
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

              {showWatermark && (
                <TabsContent value="watermark" className="p-4 space-y-4 mt-0">
                  <div className="flex items-center justify-between">
                    <Label>{t.enableWatermark}</Label>
                    <Button
                      size="sm"
                      variant={watermark.enabled ? "default" : "outline"}
                      onClick={() => setWatermark(prev => ({ ...prev, enabled: !prev.enabled }))}
                      data-testid="button-toggle-watermark"
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
                            data-testid="button-watermark-text"
                          >
                            <Type className="h-4 w-4 mr-1" />
                            {t.text}
                          </Button>
                          <Button
                            size="sm"
                            variant={watermark.type === "image" ? "default" : "outline"}
                            onClick={() => setWatermark(prev => ({ ...prev, type: "image" }))}
                            className="flex-1"
                            data-testid="button-watermark-image"
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
                            data-testid="input-watermark-text"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>{t.uploadLogo}</Label>
                          <div className="flex gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="flex-1"
                              data-testid="input-watermark-logo"
                            />
                          </div>
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

                      <div className="space-y-2">
                        <Label>{t.position}</Label>
                        <Select
                          value={watermark.position}
                          onValueChange={(v) => setWatermark(prev => ({ 
                            ...prev, 
                            position: v as WatermarkConfig["position"] 
                          }))}
                        >
                          <SelectTrigger data-testid="select-watermark-position">
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
                    </>
                  )}
                </TabsContent>
              )}
            </ScrollArea>
          </Tabs>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 border-t">
        <Button variant="outline" onClick={handleReset} data-testid="button-reset">
          <RotateCcw className="h-4 w-4 mr-2" />
          {t.reset}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} data-testid="button-download">
            <Download className="h-4 w-4 mr-2" />
            {t.download}
          </Button>
          {onSave && (
            <Button onClick={handleSave} disabled={isSaving} data-testid="button-save">
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? t.saving : t.save}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface PhotoEditorDialogProps extends Omit<PhotoEditorProps, "onClose"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhotoEditorDialog({
  open,
  onOpenChange,
  ...props
}: PhotoEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        <PhotoEditor {...props} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

export default PhotoEditor;
