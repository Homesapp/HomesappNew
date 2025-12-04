import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Copy,
  Check,
  Loader2,
  Sparkles,
  FileText,
  Hash,
  Clock,
  Home,
  Building2,
  Coins,
  Image,
  Wand2,
  X,
  Star,
  History,
  Send,
  ChevronRight,
  Globe,
  MessageSquare
} from "lucide-react";
import PhotoEditor from "@/components/PhotoEditor";
import { BulkPhotoEditor, BulkPhoto } from "@/components/BulkPhotoEditor";
import { SiFacebook, SiInstagram, SiWhatsapp } from "react-icons/si";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface SocialTemplate {
  id: string;
  title: string;
  platform: "facebook" | "instagram" | "whatsapp";
  category: string;
  content: string;
  hashtags: string | null;
  isAiGenerated: boolean;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

interface QuickTemplate {
  id: string;
  platform: "instagram" | "facebook" | "whatsapp";
  subtype?: "post" | "story" | "reel";
  title: string;
  content: string;
  hashtags?: string;
  category: string;
  tone: string;
}

interface PropertyCatalogItem {
  id: string;
  unitNumber: string;
  title: string | null;
  description: string | null;
  propertyType: string | null;
  zone: string | null;
  city: string | null;
  address: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  area: string | null;
  price: string | null;
  salePrice: string | null;
  currency: string;
  listingType: string | null;
  amenities: string[] | null;
  condominiumId: string | null;
  condominiumName: string | null;
  slug: string | null;
}

interface Condominium {
  id: string;
  name: string;
  zone: string | null;
}

interface Publication {
  id: string;
  platform: "facebook" | "instagram" | "whatsapp";
  content: string;
  hashtags: string | null;
  propertyTitle: string | null;
  propertyZone: string | null;
  createdAt: string;
}

interface AgencyConfig {
  aiCreditsEnabled: boolean;
  aiCreditBalance: number;
  aiCreditUsed: number;
  aiCreditTotalAssigned: number;
}

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: SiInstagram, color: "text-pink-500" },
  { value: "facebook", label: "Facebook", icon: SiFacebook, color: "text-blue-600" },
  { value: "whatsapp", label: "WhatsApp", icon: SiWhatsapp, color: "text-green-500" },
];

const TONES = {
  es: [
    { value: "neutral", label: "Neutral / Profesional" },
    { value: "premium", label: "Premium / Lujo" },
    { value: "casual", label: "Casual / Amigable" },
  ],
  en: [
    { value: "neutral", label: "Neutral / Professional" },
    { value: "premium", label: "Premium / Luxury" },
    { value: "casual", label: "Casual / Friendly" },
  ],
};

const CATEGORIES = {
  es: {
    new_listing: "Nueva Propiedad",
    rental: "Renta",
    price_update: "Actualización de Precio",
    open_house: "Open House",
    featured: "Destacada",
    general: "General",
  },
  en: {
    new_listing: "New Listing",
    rental: "Rental",
    price_update: "Price Update",
    open_house: "Open House",
    featured: "Featured",
    general: "General",
  },
};

const TEMPLATE_VARIABLES = [
  { key: "{{property.name}}", desc: { es: "Nombre propiedad", en: "Property name" } },
  { key: "{{property.location}}", desc: { es: "Ubicación", en: "Location" } },
  { key: "{{property.bedrooms}}", desc: { es: "Recámaras", en: "Bedrooms" } },
  { key: "{{property.bathrooms}}", desc: { es: "Baños", en: "Bathrooms" } },
  { key: "{{property.price}}", desc: { es: "Precio", en: "Price" } },
  { key: "{{property.area}}", desc: { es: "Área", en: "Area" } },
  { key: "{{date}}", desc: { es: "Fecha", en: "Date" } },
  { key: "{{time}}", desc: { es: "Hora", en: "Time" } },
];

const TRANSLATIONS = {
  es: {
    pageTitle: "Redes Sociales",
    pageDescription: "Crea y publica contenido para promocionar propiedades",
    tabQuick: "Plantillas Rápidas",
    tabMyTemplates: "Mis Plantillas",
    tabPhotos: "Imágenes",
    tabHistory: "Historial",
    selectTone: "Seleccionar tono",
    selectLanguage: "Idioma",
    spanish: "Español",
    english: "Inglés",
    selectProperty: "Seleccionar propiedad",
    selectPropertyFirst: "Selecciona una propiedad primero",
    copyContent: "Copiar contenido",
    copied: "Copiado",
    markAsPublished: "Marcar como publicado",
    publishedSuccess: "Publicación registrada",
    instagramPost: "Instagram Post",
    instagramStory: "Instagram Story",
    facebookPost: "Facebook",
    whatsappMessage: "WhatsApp",
    noTemplates: "No tienes plantillas personalizadas",
    createFirst: "Crea tu primera plantilla",
    createTemplate: "Nueva Plantilla",
    editTemplate: "Editar Plantilla",
    deleteTemplate: "Eliminar Plantilla",
    templateTitle: "Título",
    platform: "Plataforma",
    category: "Categoría",
    content: "Contenido",
    hashtags: "Hashtags",
    insertVariable: "Insertar variable",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    deleteConfirm: "¿Estás seguro de que deseas eliminar esto?",
    addToFavorites: "Añadir a favoritos",
    removeFromFavorites: "Quitar de favoritos",
    duplicateTemplate: "Duplicar plantilla",
    uses: "usos",
    photosTitle: "Editor de Fotos",
    photosDescription: "Edita fotos de propiedades para redes sociales",
    selectPropertyPhotos: "Selecciona una propiedad para ver sus fotos",
    noPhotosAvailable: "Esta propiedad no tiene fotos",
    editPhoto: "Editar Foto",
    selectPhotos: "Seleccionar",
    editSelected: "Editar selección",
    historyTitle: "Historial de Publicaciones",
    historyDescription: "Registro de contenido publicado",
    noHistory: "No hay publicaciones registradas",
    published: "publicado",
    suggestedHashtags: "Hashtags sugeridos",
    optionalCTA: "CTA (opcional)",
    ctaPlaceholder: "Ej: ¡Contáctanos hoy!",
    propertyType: "Tipo",
    condo: "Condominio",
    house: "Casa",
    previewContent: "Vista previa del contenido",
    aiCredits: "Créditos IA",
    generateWithAI: "Generar con IA",
  },
  en: {
    pageTitle: "Social Media",
    pageDescription: "Create and publish content to promote properties",
    tabQuick: "Quick Templates",
    tabMyTemplates: "My Templates",
    tabPhotos: "Images",
    tabHistory: "History",
    selectTone: "Select tone",
    selectLanguage: "Language",
    spanish: "Spanish",
    english: "English",
    selectProperty: "Select property",
    selectPropertyFirst: "Select a property first",
    copyContent: "Copy content",
    copied: "Copied",
    markAsPublished: "Mark as published",
    publishedSuccess: "Publication recorded",
    instagramPost: "Instagram Post",
    instagramStory: "Instagram Story",
    facebookPost: "Facebook",
    whatsappMessage: "WhatsApp",
    noTemplates: "You have no custom templates",
    createFirst: "Create your first template",
    createTemplate: "New Template",
    editTemplate: "Edit Template",
    deleteTemplate: "Delete Template",
    templateTitle: "Title",
    platform: "Platform",
    category: "Category",
    content: "Content",
    hashtags: "Hashtags",
    insertVariable: "Insert variable",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    deleteConfirm: "Are you sure you want to delete this?",
    addToFavorites: "Add to favorites",
    removeFromFavorites: "Remove from favorites",
    duplicateTemplate: "Duplicate template",
    uses: "uses",
    photosTitle: "Photo Editor",
    photosDescription: "Edit property photos for social media",
    selectPropertyPhotos: "Select a property to view its photos",
    noPhotosAvailable: "This property has no photos",
    editPhoto: "Edit Photo",
    selectPhotos: "Select",
    editSelected: "Edit selected",
    historyTitle: "Publication History",
    historyDescription: "Record of published content",
    noHistory: "No publications recorded",
    published: "published",
    suggestedHashtags: "Suggested hashtags",
    optionalCTA: "CTA (optional)",
    ctaPlaceholder: "E.g.: Contact us today!",
    propertyType: "Type",
    condo: "Condo",
    house: "House",
    previewContent: "Content preview",
    aiCredits: "AI Credits",
    generateWithAI: "Generate with AI",
  },
};

export default function SellerSocialMedia() {
  const { locale } = useTranslation();
  const lang = (locale === "es" ? "es" : "en") as "es" | "en";
  const t = TRANSLATIONS[lang];
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("quick");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Quick templates state
  const [selectedTone, setSelectedTone] = useState("neutral");
  const [templateLang, setTemplateLang] = useState<"es" | "en">("es");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [customCTA, setCustomCTA] = useState("");
  
  // Property selector state
  const [propertySourceType, setPropertySourceType] = useState<"condo" | "house">("condo");
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string>("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<PropertyCatalogItem | null>(null);
  
  // My templates state
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SocialTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    title: "",
    platform: "whatsapp" as "facebook" | "instagram" | "whatsapp",
    category: "general",
    content: "",
    hashtags: "",
    isShared: false,
  });
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  
  // Photo editor state
  const [photoPropertyId, setPhotoPropertyId] = useState<string>("");
  const [photoSourceType, setPhotoSourceType] = useState<"condo" | "house">("condo");
  const [photoCondominiumId, setPhotoCondominiumId] = useState<string>("");
  const [editingPhotoUrl, setEditingPhotoUrl] = useState<string | null>(null);
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isBulkEditorOpen, setIsBulkEditorOpen] = useState(false);
  
  // Queries
  const { data: agencyConfig } = useQuery<AgencyConfig>({
    queryKey: ["/api/external-seller/agency-config"],
  });
  
  const { data: quickTemplates, isLoading: quickTemplatesLoading } = useQuery<QuickTemplate[]>({
    queryKey: ["/api/external-seller/quick-templates", selectedTone, templateLang],
    queryFn: async () => {
      const res = await fetch(`/api/external-seller/quick-templates?tone=${selectedTone}&language=${templateLang}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch quick templates");
      return res.json();
    },
  });
  
  const { data: templates, isLoading: templatesLoading } = useQuery<SocialTemplate[]>({
    queryKey: ["/api/external-seller/social-templates"],
  });
  
  const { data: favorites } = useQuery<string[]>({
    queryKey: ["/api/external-seller/social-favorites"],
    queryFn: async () => {
      const res = await fetch("/api/external-seller/social-favorites", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
  
  const { data: condominiums } = useQuery<Condominium[]>({
    queryKey: ["/api/external-seller/condominiums"],
  });
  
  const { data: properties, isLoading: propertiesLoading } = useQuery<PropertyCatalogItem[]>({
    queryKey: ["/api/external-seller/properties", propertySourceType, selectedCondominiumId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("type", propertySourceType);
      if (propertySourceType === "condo" && selectedCondominiumId) {
        params.set("condominiumId", selectedCondominiumId);
      }
      const res = await fetch(`/api/external-seller/properties?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch properties");
      return res.json();
    },
    enabled: propertySourceType === "house" || (propertySourceType === "condo" && !!selectedCondominiumId),
  });
  
  const { data: hashtagSuggestions } = useQuery<string[]>({
    queryKey: ["/api/external-seller/hashtag-suggestions", selectedProperty?.zone, templateLang],
    queryFn: async () => {
      if (!selectedProperty?.zone) return [];
      const res = await fetch(
        `/api/external-seller/hashtag-suggestions?zone=${encodeURIComponent(selectedProperty.zone)}&language=${templateLang}`,
        { credentials: "include" }
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedProperty?.zone,
  });
  
  const { data: publications, isLoading: publicationsLoading } = useQuery<{ data: Publication[] }>({
    queryKey: ["/api/external-seller/social-publications"],
    queryFn: async () => {
      const res = await fetch("/api/external-seller/social-publications", { credentials: "include" });
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });
  
  // Photo queries
  const { data: photoProperties, isLoading: photoPropertiesLoading } = useQuery<PropertyCatalogItem[]>({
    queryKey: ["/api/external-seller/properties-photos", photoSourceType, photoCondominiumId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("type", photoSourceType);
      if (photoSourceType === "condo" && photoCondominiumId) {
        params.set("condominiumId", photoCondominiumId);
      }
      const res = await fetch(`/api/external-seller/properties?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch photo properties");
      return res.json();
    },
    enabled: photoSourceType === "house" || (photoSourceType === "condo" && !!photoCondominiumId),
  });
  
  interface UnitMedia {
    id: string;
    url: string;
    type: string;
    order: number;
    section?: string;
    caption?: string;
  }
  
  const { data: propertyMedia, isLoading: mediaLoading } = useQuery<UnitMedia[]>({
    queryKey: ["/api/external-seller/unit-media", photoPropertyId],
    enabled: !!photoPropertyId,
  });
  
  interface WatermarkConfig {
    watermarkEnabled: boolean;
    watermarkImageUrl?: string;
    watermarkPosition: string;
    watermarkOpacity: number;
    watermarkScale: number;
    watermarkText?: string;
    agencyLogoUrl?: string;
  }
  
  const { data: watermarkConfig } = useQuery<WatermarkConfig>({
    queryKey: ["/api/external-seller/watermark-config"],
  });
  
  // Mutations
  const recordPublicationMutation = useMutation({
    mutationFn: async (data: { platform: string; content: string; hashtags?: string; unitId?: string; propertyTitle?: string; propertyZone?: string }) => {
      const res = await apiRequest("POST", "/api/external-seller/social-publications", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-publications"] });
      toast({ title: t.publishedSuccess });
    },
  });
  
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ templateId, isFavorite }: { templateId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/external-seller/social-favorites/${templateId}`);
      } else {
        await apiRequest("POST", `/api/external-seller/social-favorites/${templateId}`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-favorites"] });
    },
  });
  
  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof templateForm) => {
      const res = await apiRequest("POST", "/api/external-seller/social-templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-templates"] });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
      toast({ title: lang === "es" ? "Plantilla creada" : "Template created" });
    },
  });
  
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof templateForm> }) => {
      const res = await apiRequest("PATCH", `/api/external-seller/social-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-templates"] });
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      resetTemplateForm();
      toast({ title: lang === "es" ? "Plantilla actualizada" : "Template updated" });
    },
  });
  
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/external-seller/social-templates/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-templates"] });
      setDeleteTemplateId(null);
      toast({ title: lang === "es" ? "Plantilla eliminada" : "Template deleted" });
    },
  });
  
  // Helpers
  const resetTemplateForm = () => {
    setTemplateForm({
      title: "",
      platform: "whatsapp",
      category: "general",
      content: "",
      hashtags: "",
      isShared: false,
    });
  };
  
  const handlePropertySelect = (propId: string) => {
    setSelectedPropertyId(propId);
    const prop = properties?.find(p => p.id === propId);
    setSelectedProperty(prop || null);
  };
  
  const replaceTokens = (content: string) => {
    if (!selectedProperty) return content;
    
    return content
      .replace(/\{\{property\.name\}\}/g, selectedProperty.unitNumber || "")
      .replace(/\{\{property\.location\}\}/g, selectedProperty.zone || selectedProperty.city || "")
      .replace(/\{\{property\.bedrooms\}\}/g, String(selectedProperty.bedrooms || ""))
      .replace(/\{\{property\.bathrooms\}\}/g, selectedProperty.bathrooms || "")
      .replace(/\{\{property\.price\}\}/g, selectedProperty.price || selectedProperty.salePrice || "")
      .replace(/\{\{property\.area\}\}/g, selectedProperty.area || "")
      .replace(/\{\{date\}\}/g, format(new Date(), "PPP", { locale: lang === "es" ? es : enUS }))
      .replace(/\{\{time\}\}/g, format(new Date(), "p"));
  };
  
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast({ title: t.copied });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };
  
  const getPlatformIcon = (platform: string) => {
    const p = PLATFORMS.find(pl => pl.value === platform);
    if (!p) return null;
    return <p.icon className={`h-4 w-4 ${p.color}`} />;
  };
  
  const handleEditTemplate = (template: SocialTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      title: template.title,
      platform: template.platform,
      category: template.category,
      content: template.content,
      hashtags: template.hashtags || "",
      isShared: false,
    });
    setIsTemplateDialogOpen(true);
  };
  
  const handleDuplicateTemplate = (template: SocialTemplate) => {
    setEditingTemplate(null);
    setTemplateForm({
      title: `${template.title} (${lang === "es" ? "copia" : "copy"})`,
      platform: template.platform,
      category: template.category,
      content: template.content,
      hashtags: template.hashtags || "",
      isShared: false,
    });
    setIsTemplateDialogOpen(true);
  };
  
  const handleTemplateSubmit = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateForm });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };
  
  const insertVariable = (variable: string) => {
    setTemplateForm(f => ({
      ...f,
      content: f.content + variable,
    }));
  };
  
  // Filtered templates
  const filteredQuickTemplates = useMemo(() => {
    if (!quickTemplates) return [];
    if (selectedPlatform === "all") return quickTemplates;
    return quickTemplates.filter(t => t.platform === selectedPlatform);
  }, [quickTemplates, selectedPlatform]);
  
  const filteredMyTemplates = useMemo(() => {
    if (!templates) return [];
    if (filterPlatform === "all") return templates;
    return templates.filter(t => t.platform === filterPlatform);
  }, [templates, filterPlatform]);
  
  // Group quick templates by channel
  const groupedQuickTemplates = useMemo(() => {
    const groups: Record<string, QuickTemplate[]> = {
      "instagram-post": [],
      "instagram-story": [],
      "facebook": [],
      "whatsapp": [],
    };
    
    filteredQuickTemplates.forEach(t => {
      if (t.platform === "instagram") {
        if (t.subtype === "story") {
          groups["instagram-story"].push(t);
        } else {
          groups["instagram-post"].push(t);
        }
      } else {
        groups[t.platform].push(t);
      }
    });
    
    return groups;
  }, [filteredQuickTemplates]);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold" data-testid="text-page-title">{t.pageTitle}</h1>
            <p className="text-sm text-muted-foreground">{t.pageDescription}</p>
          </div>
          {agencyConfig && agencyConfig.aiCreditBalance > 0 && (
            <Badge variant="outline" className="gap-1 shrink-0">
              <Coins className="h-3 w-3" />
              {agencyConfig.aiCreditBalance}
            </Badge>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile-optimized tabs */}
        <TabsList className="w-full grid grid-cols-4 h-12 rounded-none border-b bg-background">
          <TabsTrigger value="quick" className="gap-1 text-xs sm:text-sm data-[state=active]:bg-muted" data-testid="tab-quick">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">{t.tabQuick}</span>
          </TabsTrigger>
          <TabsTrigger value="mytemplates" className="gap-1 text-xs sm:text-sm data-[state=active]:bg-muted" data-testid="tab-mytemplates">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t.tabMyTemplates}</span>
          </TabsTrigger>
          <TabsTrigger value="photos" className="gap-1 text-xs sm:text-sm data-[state=active]:bg-muted" data-testid="tab-photos">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">{t.tabPhotos}</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1 text-xs sm:text-sm data-[state=active]:bg-muted" data-testid="tab-history">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{t.tabHistory}</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Quick Templates Tab */}
        <TabsContent value="quick" className="p-4 space-y-4">
          {/* Tone and Language selectors */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedTone} onValueChange={setSelectedTone}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-tone">
                <SelectValue placeholder={t.selectTone} />
              </SelectTrigger>
              <SelectContent>
                {TONES[lang].map(tone => (
                  <SelectItem key={tone.value} value={tone.value}>{tone.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={templateLang} onValueChange={(v) => setTemplateLang(v as "es" | "en")}>
              <SelectTrigger className="w-full sm:w-[150px]" data-testid="select-language">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">{t.spanish}</SelectItem>
                <SelectItem value="en">{t.english}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-platform-filter">
                <SelectValue placeholder={t.platform} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "es" ? "Todas las plataformas" : "All platforms"}</SelectItem>
                {PLATFORMS.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex items-center gap-2">
                      <p.icon className={`h-4 w-4 ${p.color}`} />
                      {p.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Property Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Home className="h-4 w-4" />
                {t.selectProperty}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={propertySourceType === "condo" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPropertySourceType("condo");
                    setSelectedPropertyId("");
                    setSelectedProperty(null);
                  }}
                  data-testid="button-property-condo"
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  {t.condo}
                </Button>
                <Button
                  variant={propertySourceType === "house" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPropertySourceType("house");
                    setSelectedCondominiumId("");
                    setSelectedPropertyId("");
                    setSelectedProperty(null);
                  }}
                  data-testid="button-property-house"
                >
                  <Home className="h-4 w-4 mr-1" />
                  {t.house}
                </Button>
              </div>
              
              {propertySourceType === "condo" && (
                <SearchableSelect
                  value={selectedCondominiumId}
                  onValueChange={(value) => {
                    setSelectedCondominiumId(value);
                    setSelectedPropertyId("");
                    setSelectedProperty(null);
                  }}
                  options={(condominiums || []).map(condo => ({
                    value: condo.id,
                    label: condo.name + (condo.zone ? ` - ${condo.zone}` : ""),
                  }))}
                  placeholder={lang === "es" ? "Seleccionar condominio..." : "Select condominium..."}
                  searchPlaceholder={lang === "es" ? "Buscar..." : "Search..."}
                  emptyMessage={lang === "es" ? "No encontrado" : "Not found"}
                  data-testid="select-condominium"
                />
              )}
              
              <Select
                value={selectedPropertyId}
                onValueChange={handlePropertySelect}
                disabled={propertySourceType === "condo" && !selectedCondominiumId}
              >
                <SelectTrigger data-testid="select-property">
                  <SelectValue placeholder={t.selectPropertyFirst} />
                </SelectTrigger>
                <SelectContent>
                  {propertiesLoading ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : properties?.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      {lang === "es" ? "No hay propiedades" : "No properties"}
                    </div>
                  ) : (
                    properties?.map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prop.unitNumber}</span>
                          {prop.zone && <span className="text-muted-foreground">- {prop.zone}</span>}
                          {prop.bedrooms && <Badge variant="secondary" className="text-xs">{prop.bedrooms}BR</Badge>}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              {/* Selected property summary */}
              {selectedProperty && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <div className="font-medium">{selectedProperty.unitNumber}</div>
                  <div className="text-muted-foreground">
                    {selectedProperty.zone} • {selectedProperty.bedrooms}BR • {selectedProperty.price || selectedProperty.salePrice}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Hashtag suggestions */}
          {hashtagSuggestions && hashtagSuggestions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {t.suggestedHashtags}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {hashtagSuggestions.slice(0, 10).map((tag, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="cursor-pointer hover-elevate text-xs"
                      onClick={() => copyToClipboard(tag, `hashtag-${idx}`)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Optional CTA */}
          <div>
            <Label className="text-sm">{t.optionalCTA}</Label>
            <Input
              value={customCTA}
              onChange={(e) => setCustomCTA(e.target.value)}
              placeholder={t.ctaPlaceholder}
              className="mt-1"
              data-testid="input-custom-cta"
            />
          </div>
          
          {/* Quick templates grouped by channel */}
          {quickTemplatesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Instagram Posts */}
              {(selectedPlatform === "all" || selectedPlatform === "instagram") && groupedQuickTemplates["instagram-post"].length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <SiInstagram className="h-4 w-4 text-pink-500" />
                    {t.instagramPost}
                  </h3>
                  <div className="grid gap-3">
                    {groupedQuickTemplates["instagram-post"].map(template => (
                      <QuickTemplateCard
                        key={template.id}
                        template={template}
                        selectedProperty={selectedProperty}
                        customCTA={customCTA}
                        onCopy={copyToClipboard}
                        onPublish={(content, hashtags) => {
                          recordPublicationMutation.mutate({
                            platform: template.platform,
                            content,
                            hashtags,
                            unitId: selectedProperty?.id,
                            propertyTitle: selectedProperty?.unitNumber,
                            propertyZone: selectedProperty?.zone || undefined,
                          });
                        }}
                        copiedId={copiedId}
                        replaceTokens={replaceTokens}
                        lang={lang}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Instagram Stories */}
              {(selectedPlatform === "all" || selectedPlatform === "instagram") && groupedQuickTemplates["instagram-story"].length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <SiInstagram className="h-4 w-4 text-pink-500" />
                    {t.instagramStory}
                  </h3>
                  <div className="grid gap-3">
                    {groupedQuickTemplates["instagram-story"].map(template => (
                      <QuickTemplateCard
                        key={template.id}
                        template={template}
                        selectedProperty={selectedProperty}
                        customCTA={customCTA}
                        onCopy={copyToClipboard}
                        onPublish={(content, hashtags) => {
                          recordPublicationMutation.mutate({
                            platform: template.platform,
                            content,
                            hashtags,
                            unitId: selectedProperty?.id,
                            propertyTitle: selectedProperty?.unitNumber,
                            propertyZone: selectedProperty?.zone || undefined,
                          });
                        }}
                        copiedId={copiedId}
                        replaceTokens={replaceTokens}
                        lang={lang}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Facebook */}
              {(selectedPlatform === "all" || selectedPlatform === "facebook") && groupedQuickTemplates["facebook"].length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <SiFacebook className="h-4 w-4 text-blue-600" />
                    {t.facebookPost}
                  </h3>
                  <div className="grid gap-3">
                    {groupedQuickTemplates["facebook"].map(template => (
                      <QuickTemplateCard
                        key={template.id}
                        template={template}
                        selectedProperty={selectedProperty}
                        customCTA={customCTA}
                        onCopy={copyToClipboard}
                        onPublish={(content, hashtags) => {
                          recordPublicationMutation.mutate({
                            platform: template.platform,
                            content,
                            hashtags,
                            unitId: selectedProperty?.id,
                            propertyTitle: selectedProperty?.unitNumber,
                            propertyZone: selectedProperty?.zone || undefined,
                          });
                        }}
                        copiedId={copiedId}
                        replaceTokens={replaceTokens}
                        lang={lang}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* WhatsApp */}
              {(selectedPlatform === "all" || selectedPlatform === "whatsapp") && groupedQuickTemplates["whatsapp"].length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <SiWhatsapp className="h-4 w-4 text-green-500" />
                    {t.whatsappMessage}
                  </h3>
                  <div className="grid gap-3">
                    {groupedQuickTemplates["whatsapp"].map(template => (
                      <QuickTemplateCard
                        key={template.id}
                        template={template}
                        selectedProperty={selectedProperty}
                        customCTA={customCTA}
                        onCopy={copyToClipboard}
                        onPublish={(content, hashtags) => {
                          recordPublicationMutation.mutate({
                            platform: template.platform,
                            content,
                            hashtags,
                            unitId: selectedProperty?.id,
                            propertyTitle: selectedProperty?.unitNumber,
                            propertyZone: selectedProperty?.zone || undefined,
                          });
                        }}
                        copiedId={copiedId}
                        replaceTokens={replaceTokens}
                        lang={lang}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* My Templates Tab */}
        <TabsContent value="mytemplates" className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-filter-platform">
                <SelectValue placeholder={t.platform} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "es" ? "Todas" : "All"}</SelectItem>
                {PLATFORMS.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex items-center gap-2">
                      <p.icon className={`h-4 w-4 ${p.color}`} />
                      {p.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => {
                setEditingTemplate(null);
                resetTemplateForm();
                setIsTemplateDialogOpen(true);
              }}
              size="sm"
              data-testid="button-create-template"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t.createTemplate}
            </Button>
          </div>
          
          {templatesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredMyTemplates.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t.noTemplates}</p>
                <p className="text-sm text-muted-foreground">{t.createFirst}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredMyTemplates.map(template => {
                const isFavorite = favorites?.includes(template.id);
                return (
                  <Card key={template.id} className="overflow-hidden">
                    <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getPlatformIcon(template.platform)}
                        <h3 className="font-medium truncate">{template.title}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavoriteMutation.mutate({ templateId: template.id, isFavorite: !!isFavorite })}
                          data-testid={`button-favorite-${template.id}`}
                        >
                          <Star className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                        </Button>
                        {template.isAiGenerated && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Sparkles className="h-3 w-3" />
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {CATEGORIES[lang][template.category as keyof typeof CATEGORIES["es"]] || template.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2">
                      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {template.content}
                      </p>
                      {template.hashtags && (
                        <div className="mt-2 flex items-center gap-1">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground truncate">{template.hashtags}</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {template.usageCount} {t.uses}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(template.content + (template.hashtags ? `\n\n${template.hashtags}` : ""), template.id)}
                          data-testid={`button-copy-template-${template.id}`}
                        >
                          {copiedId === template.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicateTemplate(template)}
                          data-testid={`button-duplicate-template-${template.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTemplate(template)}
                          data-testid={`button-edit-template-${template.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTemplateId(template.id)}
                          data-testid={`button-delete-template-${template.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        {/* Photos Tab */}
        <TabsContent value="photos" className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="h-5 w-5" />
                {t.photosTitle}
              </CardTitle>
              <CardDescription>{t.photosDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Property Type Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={photoSourceType === "condo" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPhotoSourceType("condo");
                    setPhotoPropertyId("");
                  }}
                  data-testid="button-photo-source-condo"
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  {t.condo}
                </Button>
                <Button
                  variant={photoSourceType === "house" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPhotoSourceType("house");
                    setPhotoCondominiumId("");
                    setPhotoPropertyId("");
                  }}
                  data-testid="button-photo-source-house"
                >
                  <Home className="h-4 w-4 mr-1" />
                  {t.house}
                </Button>
              </div>
              
              {/* Condominium Selection */}
              {photoSourceType === "condo" && (
                <SearchableSelect
                  value={photoCondominiumId}
                  onValueChange={(value) => {
                    setPhotoCondominiumId(value);
                    setPhotoPropertyId("");
                  }}
                  options={(condominiums || []).map(condo => ({
                    value: condo.id,
                    label: condo.name + (condo.zone ? ` - ${condo.zone}` : ""),
                  }))}
                  placeholder={lang === "es" ? "Seleccionar condominio..." : "Select condominium..."}
                  searchPlaceholder={lang === "es" ? "Buscar..." : "Search..."}
                  emptyMessage={lang === "es" ? "No encontrado" : "Not found"}
                  data-testid="select-photo-condominium"
                />
              )}
              
              {/* Property Selection */}
              <Select
                value={photoPropertyId}
                onValueChange={setPhotoPropertyId}
                disabled={photoSourceType === "condo" && !photoCondominiumId}
              >
                <SelectTrigger data-testid="select-photo-property">
                  <SelectValue placeholder={lang === "es" ? "Seleccionar propiedad..." : "Select property..."} />
                </SelectTrigger>
                <SelectContent>
                  {photoPropertiesLoading ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : !photoProperties || photoProperties.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      {lang === "es" ? "No hay propiedades" : "No properties"}
                    </div>
                  ) : (
                    photoProperties.map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prop.unitNumber}</span>
                          {prop.zone && <span className="text-muted-foreground">- {prop.zone}</span>}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              {/* Photo gallery */}
              {!photoPropertyId ? (
                <div className="text-center py-8">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">{t.selectPropertyPhotos}</p>
                </div>
              ) : mediaLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="aspect-[4/3] w-full rounded" />
                  ))}
                </div>
              ) : !propertyMedia || propertyMedia.length === 0 ? (
                <div className="text-center py-8">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">{t.noPhotosAvailable}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Album header with bulk actions */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Image className="h-4 w-4" />
                      <span>{propertyMedia.filter(m => m.type === "image").length} {lang === "es" ? "fotos" : "photos"}</span>
                      {bulkSelectionMode && selectedPhotoIds.size > 0 && (
                        <Badge variant="secondary">{selectedPhotoIds.size} {lang === "es" ? "seleccionadas" : "selected"}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {bulkSelectionMode ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const images = propertyMedia.filter(m => m.type === "image");
                              if (selectedPhotoIds.size === images.length) {
                                setSelectedPhotoIds(new Set());
                              } else {
                                setSelectedPhotoIds(new Set(images.map(m => m.id)));
                              }
                            }}
                            data-testid="button-select-all-photos"
                          >
                            {selectedPhotoIds.size === propertyMedia.filter(m => m.type === "image").length
                              ? (lang === "es" ? "Deseleccionar" : "Deselect all")
                              : (lang === "es" ? "Seleccionar todo" : "Select all")}
                          </Button>
                          <Button
                            size="sm"
                            disabled={selectedPhotoIds.size === 0}
                            onClick={() => setIsBulkEditorOpen(true)}
                            data-testid="button-edit-selected-photos"
                          >
                            <Wand2 className="h-4 w-4 mr-1" />
                            {t.editSelected} ({selectedPhotoIds.size})
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setBulkSelectionMode(false);
                              setSelectedPhotoIds(new Set());
                            }}
                            data-testid="button-cancel-bulk-selection"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBulkSelectionMode(true)}
                            data-testid="button-start-bulk-selection"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {t.selectPhotos}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const images = propertyMedia.filter(m => m.type === "image");
                              if (images.length > 0) {
                                setEditingPhotoUrl(images[0].url);
                                setEditingMediaId(images[0].id);
                              }
                            }}
                            data-testid="button-edit-photos"
                          >
                            <Wand2 className="h-4 w-4 mr-1" />
                            {t.editPhoto}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Thumbnail grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                    {propertyMedia
                      .filter(m => m.type === "image")
                      .map(media => {
                        const isSelected = selectedPhotoIds.has(media.id);
                        return (
                          <div
                            key={media.id}
                            className={`group relative aspect-[4/3] rounded overflow-hidden border bg-muted cursor-pointer transition-all ${
                              bulkSelectionMode && isSelected
                                ? "ring-2 ring-primary ring-offset-1"
                                : "hover:ring-2 hover:ring-primary hover:ring-offset-1"
                            }`}
                            onClick={() => {
                              if (bulkSelectionMode) {
                                const newSet = new Set(selectedPhotoIds);
                                if (isSelected) {
                                  newSet.delete(media.id);
                                } else {
                                  newSet.add(media.id);
                                }
                                setSelectedPhotoIds(newSet);
                              } else {
                                setEditingPhotoUrl(media.url);
                                setEditingMediaId(media.id);
                              }
                            }}
                          >
                            <img
                              src={media.url}
                              alt={media.caption || `Photo ${media.order}`}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                            {bulkSelectionMode ? (
                              <div className={`absolute inset-0 transition-colors flex items-center justify-center ${
                                isSelected ? "bg-primary/20" : "bg-black/0 group-hover:bg-black/20"
                              }`}>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-primary border-primary"
                                    : "bg-white/80 border-white/80 group-hover:border-primary"
                                }`}>
                                  {isSelected && <Check className="h-4 w-4 text-white" />}
                                </div>
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Wand2 className="h-5 w-5 text-white drop-shadow-lg" />
                                </div>
                              </div>
                            )}
                            {media.section && (
                              <Badge variant="secondary" className="absolute bottom-1 left-1 text-[9px] px-1 py-0">
                                {media.section}
                              </Badge>
                            )}
                            <span className="absolute top-1 right-1 bg-black/50 text-white text-[9px] px-1 rounded">
                              {media.order + 1}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history" className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                {t.historyTitle}
              </CardTitle>
              <CardDescription>{t.historyDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {publicationsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : !publications?.data || publications.data.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">{t.noHistory}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {publications.data.map(pub => (
                    <div key={pub.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(pub.platform)}
                          <span className="font-medium">{pub.propertyTitle || (lang === "es" ? "Publicación" : "Publication")}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(pub.createdAt), "PPp", { locale: lang === "es" ? es : enUS })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{pub.content}</p>
                      {pub.propertyZone && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {pub.propertyZone}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Photo Editor Dialog */}
      <Dialog
        open={!!editingPhotoUrl}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPhotoUrl(null);
            setEditingMediaId(null);
          }
        }}
      >
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{t.editPhoto}</DialogTitle>
          </DialogHeader>
          {editingPhotoUrl && (
            <div className="flex h-[85vh]">
              {/* Thumbnail strip */}
              {propertyMedia && propertyMedia.filter(m => m.type === "image").length > 1 && (
                <div className="w-20 bg-muted/50 border-r flex flex-col">
                  <div className="p-2 border-b text-xs font-medium text-center text-muted-foreground">
                    {lang === "es" ? "Álbum" : "Album"}
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-1.5 space-y-1.5">
                      {propertyMedia
                        .filter(m => m.type === "image")
                        .map((media, idx) => (
                          <div
                            key={media.id}
                            className={`relative aspect-[4/3] rounded overflow-hidden cursor-pointer transition-all ${
                              editingPhotoUrl === media.url
                                ? "ring-2 ring-primary ring-offset-1"
                                : "opacity-70 hover:opacity-100"
                            }`}
                            onClick={() => {
                              setEditingPhotoUrl(media.url);
                              setEditingMediaId(media.id);
                            }}
                          >
                            <img
                              src={media.url}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                            <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[8px] px-1 rounded">
                              {idx + 1}
                            </span>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              {/* Main editor */}
              <div className="flex-1 overflow-hidden">
                <PhotoEditor
                  imageUrl={editingPhotoUrl}
                  agencyLogo={watermarkConfig?.watermarkImageUrl || watermarkConfig?.agencyLogoUrl}
                  agencyName={watermarkConfig?.watermarkText}
                  showWatermark={watermarkConfig?.watermarkEnabled}
                  language={lang}
                  initialWatermark={watermarkConfig ? {
                    enabled: watermarkConfig.watermarkEnabled,
                    type: (watermarkConfig.watermarkImageUrl || watermarkConfig.agencyLogoUrl) ? "image" : "text",
                    imageUrl: watermarkConfig.watermarkImageUrl || watermarkConfig.agencyLogoUrl,
                    position: watermarkConfig.watermarkPosition as "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center",
                    opacity: watermarkConfig.watermarkOpacity,
                    size: watermarkConfig.watermarkScale,
                    padding: 20,
                    text: watermarkConfig.watermarkText,
                  } : undefined}
                  onSave={async (editedBlob: Blob) => {
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(editedBlob);
                    link.download = `edited-photo-${Date.now()}.jpg`;
                    link.click();
                    URL.revokeObjectURL(link.href);
                    toast({ title: lang === "es" ? "Foto descargada" : "Photo downloaded" });
                  }}
                  onClose={() => {
                    setEditingPhotoUrl(null);
                    setEditingMediaId(null);
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Bulk Photo Editor Dialog */}
      <Dialog open={isBulkEditorOpen} onOpenChange={(open) => {
        if (!open) {
          setIsBulkEditorOpen(false);
          setBulkSelectionMode(false);
          setSelectedPhotoIds(new Set());
        }
      }}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{lang === "es" ? "Editor de Fotos" : "Bulk Photo Editor"}</DialogTitle>
          </DialogHeader>
          {isBulkEditorOpen && propertyMedia && (
            <BulkPhotoEditor
              photos={propertyMedia
                .filter(m => m.type === "image" && selectedPhotoIds.has(m.id))
                .map(m => ({ id: m.id, url: m.url }))
              }
              agencyLogo={watermarkConfig?.watermarkImageUrl || watermarkConfig?.agencyLogoUrl}
              agencyName={watermarkConfig?.watermarkText}
              language={lang}
              initialWatermark={watermarkConfig ? {
                enabled: watermarkConfig.watermarkEnabled,
                type: (watermarkConfig.watermarkImageUrl || watermarkConfig.agencyLogoUrl) ? "image" : "text",
                imageUrl: watermarkConfig.watermarkImageUrl || watermarkConfig.agencyLogoUrl,
                position: watermarkConfig.watermarkPosition as "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center",
                opacity: watermarkConfig.watermarkOpacity,
                size: watermarkConfig.watermarkScale,
                padding: 20,
                text: watermarkConfig.watermarkText,
              } : undefined}
              onSave={async (processedPhotos: BulkPhoto[]) => {
                for (const photo of processedPhotos) {
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(photo.blob);
                  link.download = `edited-${photo.id}-${Date.now()}.jpg`;
                  link.click();
                  URL.revokeObjectURL(link.href);
                }
                toast({
                  title: lang === "es" ? "Fotos descargadas" : "Photos downloaded",
                  description: `${processedPhotos.length} ${lang === "es" ? "fotos editadas" : "edited photos"}`,
                });
              }}
              onClose={() => {
                setIsBulkEditorOpen(false);
                setBulkSelectionMode(false);
                setSelectedPhotoIds(new Set());
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? t.editTemplate : t.createTemplate}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.templateTitle}</Label>
              <Input
                value={templateForm.title}
                onChange={e => setTemplateForm(f => ({ ...f, title: e.target.value }))}
                placeholder={lang === "es" ? "Ej: Nueva propiedad en Tulum" : "E.g.: New property in Tulum"}
                data-testid="input-template-title"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.platform}</Label>
                <Select
                  value={templateForm.platform}
                  onValueChange={v => setTemplateForm(f => ({ ...f, platform: v as any }))}
                >
                  <SelectTrigger data-testid="select-template-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <p.icon className={`h-4 w-4 ${p.color}`} />
                          {p.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t.category}</Label>
                <Select
                  value={templateForm.category}
                  onValueChange={v => setTemplateForm(f => ({ ...f, category: v }))}
                >
                  <SelectTrigger data-testid="select-template-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES[lang]).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label>{t.content}</Label>
                <span className="text-xs text-muted-foreground">{t.insertVariable}</span>
              </div>
              <Textarea
                value={templateForm.content}
                onChange={e => setTemplateForm(f => ({ ...f, content: e.target.value }))}
                placeholder={lang === "es" ? "Escribe tu plantilla aquí..." : "Write your template here..."}
                rows={6}
                data-testid="textarea-template-content"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {TEMPLATE_VARIABLES.map(v => (
                  <Button
                    key={v.key}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => insertVariable(v.key)}
                    data-testid={`button-insert-variable-${v.key}`}
                  >
                    {v.key}
                  </Button>
                ))}
              </div>
            </div>
            
            {templateForm.platform === "instagram" && (
              <div>
                <Label>{t.hashtags}</Label>
                <Input
                  value={templateForm.hashtags}
                  onChange={e => setTemplateForm(f => ({ ...f, hashtags: e.target.value }))}
                  placeholder="#Tulum #RealEstate #Investment"
                  data-testid="input-template-hashtags"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              onClick={handleTemplateSubmit}
              disabled={!templateForm.title || !templateForm.content || createTemplateMutation.isPending || updateTemplateMutation.isPending}
              data-testid="button-save-template"
            >
              {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Template Confirmation */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteTemplate}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTemplateId && deleteTemplateMutation.mutate(deleteTemplateId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Quick Template Card Component
interface QuickTemplateCardProps {
  template: QuickTemplate;
  selectedProperty: PropertyCatalogItem | null;
  customCTA: string;
  onCopy: (text: string, id: string) => void;
  onPublish: (content: string, hashtags?: string) => void;
  copiedId: string | null;
  replaceTokens: (content: string) => string;
  lang: "es" | "en";
  t: typeof TRANSLATIONS["es"];
}

function QuickTemplateCard({
  template,
  selectedProperty,
  customCTA,
  onCopy,
  onPublish,
  copiedId,
  replaceTokens,
  lang,
  t,
}: QuickTemplateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const processedContent = useMemo(() => {
    let content = replaceTokens(template.content);
    if (customCTA) {
      content = content + "\n\n" + customCTA;
    }
    return content;
  }, [template.content, replaceTokens, customCTA]);
  
  const fullContent = processedContent + (template.hashtags ? `\n\n${template.hashtags}` : "");
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 space-y-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {CATEGORIES[lang][template.category as keyof typeof CATEGORIES["es"]] || template.category}
          </Badge>
          <h4 className="font-medium text-sm">{template.title}</h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid={`button-expand-${template.id}`}
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
        </Button>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 pb-3 space-y-3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{processedContent}</p>
            {template.hashtags && (
              <p className="text-sm text-muted-foreground mt-2">{template.hashtags}</p>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopy(fullContent, template.id)}
              data-testid={`button-copy-quick-${template.id}`}
            >
              {copiedId === template.id ? (
                <Check className="h-4 w-4 mr-1 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              {t.copyContent}
            </Button>
            <Button
              size="sm"
              onClick={() => onPublish(processedContent, template.hashtags)}
              disabled={!selectedProperty}
              data-testid={`button-publish-${template.id}`}
            >
              <Send className="h-4 w-4 mr-1" />
              {t.markAsPublished}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
