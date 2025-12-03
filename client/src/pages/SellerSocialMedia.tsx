import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
  Calendar,
  Bell,
  FileText,
  Hash,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Eye,
  Send,
  Download,
  Home,
  Building2,
  MapPin,
  Coins,
  Link,
  ExternalLink,
  Zap,
  Search,
  ChevronDown,
  ChevronRight,
  Image,
  Wand2,
  RotateCcw,
  X
} from "lucide-react";
import PhotoEditor from "@/components/PhotoEditor";
import { SiFacebook, SiInstagram, SiWhatsapp } from "react-icons/si";
import { format, isToday, isTomorrow, isPast } from "date-fns";
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

interface SocialReminder {
  id: string;
  title: string;
  platform: "facebook" | "instagram" | "whatsapp";
  notes: string | null;
  scheduledAt: string;
  isCompleted: boolean;
  completedAt: string | null;
  unit?: {
    id: string;
    unitNumber: string;
    slug: string;
  } | null;
}

interface Unit {
  id: string;
  unitNumber: string;
  slug: string;
  price?: number;
  location?: string;
  bedrooms?: number;
  bathrooms?: number;
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
  petFriendly: boolean;
  includedServices: string[] | null;
  condominiumId: string | null;
  condominiumName: string | null;
  slug: string | null;
}

interface Condominium {
  id: string;
  name: string;
  zone: string | null;
  address: string | null;
  propertyCategory: string | null;
}

interface AgencyConfig {
  aiCreditsEnabled: boolean;
  aiCreditBalance: number;
  aiCreditUsed: number;
  aiCreditTotalAssigned: number;
  monthlyUsed: number;
}

const DEFAULT_TEMPLATES_ES = [
  {
    id: "default-1",
    title: "Listado Completo - Facebook/WhatsApp",
    platform: "facebook" as const,
    content: `🌴{{condominiumName}}{{unitNumber}}🌴

📍{{location}}

💫Características destacadas💫
✅{{bedrooms}} Recámaras con closet
✅{{bathrooms}} Baños completos
✅Cocina equipada con barra/comedor
✅Amplia sala
✅Comedor
✅Ventiladores de techo & A/C
✅{{floor}}
{{amenitiesList}}

💫Amenidades💫
{{condoAmenities}}

💰Precio: {{price}} mensuales + depósito + servicios{{contractFee}}

🚰Incluye mantenimiento (HOA){{includedServices}}

{{locationLink}}

{{driveLink}}

{{trhId}}`,
  },
  {
    id: "default-2",
    title: "Listado Compacto - Sin Links",
    platform: "facebook" as const,
    content: `🌴{{condominiumName}}{{unitNumber}}🌴

📍{{location}}

💫Características💫
✅{{bedrooms}} Recámaras
✅{{bathrooms}} Baños
✅{{area}} m²
✅{{floor}}

💰{{price}} mensuales

{{trhId}}`,
  },
  {
    id: "default-3",
    title: "WhatsApp Directo",
    platform: "whatsapp" as const,
    content: `*{{condominiumName}}{{unitNumber}}*

📍 {{location}}

*Detalles:*
• {{bedrooms}} Recámaras
• {{bathrooms}} Baños
• {{area}} m²

*Precio:* {{price}} MXN mensuales

¿Te interesa? Contáctame para agendar una visita.

{{locationLink}}`,
  },
  {
    id: "default-4",
    title: "Promoción Instagram",
    platform: "instagram" as const,
    content: `🌴 Tu paraíso en Tulum te espera

{{propertyType}} de ensueño en {{condominiumName}}:
🛏️ {{bedrooms}} recámaras
🛁 {{bathrooms}} baños  
📐 {{area}} m²

📍 {{location}}
💰 {{price}}

¡Escríbenos para más información!

#TulumRealEstate #PropiedadesEnTulum #VidaEnTulum #InvierteEnTulum #{{condominiumName}}`,
  },
  {
    id: "default-5",
    title: "Formato Plano - Sin Iconos",
    platform: "facebook" as const,
    content: `{{condominiumName}}{{unitNumber}}

Ubicación: {{location}}

CARACTERÍSTICAS:
- {{bedrooms}} Recámaras con closet
- {{bathrooms}} Baños completos
- Cocina equipada
- Sala y comedor
- A/C incluido
- {{floor}}

AMENIDADES:
{{condoAmenitiesPlain}}

PRECIO: {{price}} mensuales + depósito + servicios

Incluye: Mantenimiento (HOA){{includedServicesPlain}}

{{trhId}}`,
  },
];

const DEFAULT_TEMPLATES_EN = [
  {
    id: "default-1",
    title: "Complete Listing - Facebook/WhatsApp",
    platform: "facebook" as const,
    content: `🌴{{condominiumName}}{{unitNumber}}🌴

📍{{location}}

💫Key Features💫
✅{{bedrooms}} Bedrooms with closet
✅{{bathrooms}} Full bathrooms
✅Equipped kitchen with bar/dining
✅Spacious living room
✅Dining area
✅Ceiling fans & A/C
✅{{floor}}
{{amenitiesList}}

💫Amenities💫
{{condoAmenities}}

💰Price: {{price}} monthly + deposit + utilities{{contractFee}}

🚰Includes HOA{{includedServices}}

{{locationLink}}

{{driveLink}}

{{trhId}}`,
  },
  {
    id: "default-2",
    title: "Compact Listing - No Links",
    platform: "facebook" as const,
    content: `🌴{{condominiumName}}{{unitNumber}}🌴

📍{{location}}

💫Features💫
✅{{bedrooms}} Bedrooms
✅{{bathrooms}} Bathrooms
✅{{area}} sqft
✅{{floor}}

💰{{price}} monthly

{{trhId}}`,
  },
  {
    id: "default-3",
    title: "WhatsApp Direct",
    platform: "whatsapp" as const,
    content: `*{{condominiumName}}{{unitNumber}}*

📍 {{location}}

*Details:*
• {{bedrooms}} Bedrooms
• {{bathrooms}} Bathrooms
• {{area}} sqft

*Price:* {{price}} monthly

Interested? Contact me to schedule a visit.

{{locationLink}}`,
  },
  {
    id: "default-4", 
    title: "Instagram Promotion",
    platform: "instagram" as const,
    content: `🌴 Your paradise in Tulum awaits

Dream {{propertyType}} at {{condominiumName}}:
🛏️ {{bedrooms}} bedrooms
🛁 {{bathrooms}} bathrooms
📐 {{area}} sqft

📍 {{location}}
💰 {{price}}

DM us for more information!

#TulumRealEstate #TulumProperties #TulumLife #InvestInTulum #{{condominiumName}}`,
  },
  {
    id: "default-5",
    title: "Plain Format - No Icons",
    platform: "facebook" as const,
    content: `{{condominiumName}}{{unitNumber}}

Location: {{location}}

FEATURES:
- {{bedrooms}} Bedrooms with closet
- {{bathrooms}} Full bathrooms
- Equipped kitchen
- Living & dining area
- A/C included
- {{floor}}

AMENITIES:
{{condoAmenitiesPlain}}

PRICE: {{price}} monthly + deposit + utilities

Includes: HOA{{includedServicesPlain}}

{{trhId}}`,
  },
];

const PLATFORMS = [
  { value: "facebook", label: "Facebook", icon: SiFacebook, color: "text-blue-600" },
  { value: "instagram", label: "Instagram", icon: SiInstagram, color: "text-pink-500" },
  { value: "whatsapp", label: "WhatsApp", icon: SiWhatsapp, color: "text-green-500" },
];

const CATEGORIES = {
  es: {
    new_listing: "Nueva Propiedad",
    price_update: "Actualización de Precio",
    open_house: "Casa Abierta",
    featured: "Destacada",
    promotion: "Promoción",
    general: "General",
  },
  en: {
    new_listing: "New Listing",
    price_update: "Price Update",
    open_house: "Open House",
    featured: "Featured",
    promotion: "Promotion",
    general: "General",
  },
};

const TEMPLATE_VARIABLES = {
  es: [
    { key: "{{location}}", desc: "Ubicación" },
    { key: "{{propertyType}}", desc: "Tipo de propiedad" },
    { key: "{{bedrooms}}", desc: "Recámaras" },
    { key: "{{bathrooms}}", desc: "Baños" },
    { key: "{{price}}", desc: "Precio" },
    { key: "{{address}}", desc: "Dirección" },
    { key: "{{area}}", desc: "Área m²" },
    { key: "{{date}}", desc: "Fecha" },
    { key: "{{time}}", desc: "Hora" },
    { key: "{{clientName}}", desc: "Nombre del cliente" },
    { key: "{{hashtags}}", desc: "Hashtags" },
  ],
  en: [
    { key: "{{location}}", desc: "Location" },
    { key: "{{propertyType}}", desc: "Property Type" },
    { key: "{{bedrooms}}", desc: "Bedrooms" },
    { key: "{{bathrooms}}", desc: "Bathrooms" },
    { key: "{{price}}", desc: "Price" },
    { key: "{{address}}", desc: "Address" },
    { key: "{{area}}", desc: "Area sqft" },
    { key: "{{date}}", desc: "Date" },
    { key: "{{time}}", desc: "Time" },
    { key: "{{clientName}}", desc: "Client Name" },
    { key: "{{hashtags}}", desc: "Hashtags" },
  ],
};

const TRANSLATIONS = {
  es: {
    pageTitle: "Marketing en Redes Sociales",
    pageDescription: "Crea y programa contenido para promocionar propiedades",
    tabTemplates: "Plantillas",
    tabGenerator: "Generador IA",
    tabReminders: "Recordatorios",
    tabPhotos: "Fotos",
    photosTitle: "Editor de Fotos",
    photosDescription: "Edita y mejora las fotos de tus propiedades para redes sociales",
    selectPropertyFirst: "Selecciona una propiedad para ver sus fotos",
    noPhotosAvailable: "Esta propiedad no tiene fotos disponibles",
    editPhoto: "Editar Foto",
    downloadPhoto: "Descargar Foto",
    photoEditSuccess: "Foto editada guardada exitosamente",
    photoEditError: "Error al guardar la foto editada",
    createTemplate: "Crear Plantilla",
    editTemplate: "Editar Plantilla",
    deleteTemplate: "Eliminar Plantilla",
    templateTitle: "Título de la Plantilla",
    platform: "Plataforma",
    category: "Categoría",
    content: "Contenido",
    hashtags: "Hashtags",
    isShared: "Compartir con equipo",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    copied: "Copiado",
    copyTemplate: "Copiar plantilla",
    noTemplates: "No hay plantillas",
    createFirst: "Crea tu primera plantilla o carga las predeterminadas",
    loadDefaults: "Cargar Plantillas Predeterminadas",
    usageCount: "usos",
    aiGenerated: "Generado por IA",
    generateContent: "Generar Contenido",
    generating: "Generando...",
    propertyDetails: "Detalles de la Propiedad",
    selectProperty: "Seleccionar Propiedad",
    tone: "Tono",
    tones: {
      professional: "Profesional",
      friendly: "Amigable",
      luxury: "Lujo",
      urgent: "Urgente",
    },
    generatedContent: "Contenido Generado",
    saveAsTemplate: "Guardar como Plantilla",
    copyToClipboard: "Copiar al Portapapeles",
    noReminders: "No hay recordatorios",
    createReminder: "Crear Recordatorio",
    editReminder: "Editar Recordatorio",
    reminderTitle: "Título",
    scheduledFor: "Programado para",
    notes: "Notas",
    markComplete: "Marcar Completado",
    overdue: "Vencido",
    today: "Hoy",
    tomorrow: "Mañana",
    upcoming: "Próximos",
    completed: "Completados",
    showCompleted: "Mostrar completados",
    deleteConfirm: "¿Estás seguro de que deseas eliminar esto?",
    deleteAction: "Esta acción no se puede deshacer",
    variables: "Variables",
    insertVariable: "Insertar variable",
    propertyName: "Nombre propiedad",
    propertyLocation: "Ubicación",
    propertyPrice: "Precio",
    propertyBedrooms: "Recámaras",
    propertyBathrooms: "Baños",
    enterManually: "Ingresar manualmente",
    selectUnit: "Seleccionar unidad",
    optional: "opcional",
  },
  en: {
    pageTitle: "Social Media Marketing",
    pageDescription: "Create and schedule content to promote properties",
    tabTemplates: "Templates",
    tabGenerator: "AI Generator",
    tabReminders: "Reminders",
    tabPhotos: "Photos",
    photosTitle: "Photo Editor",
    photosDescription: "Edit and enhance property photos for social media",
    selectPropertyFirst: "Select a property to view its photos",
    noPhotosAvailable: "This property has no photos available",
    editPhoto: "Edit Photo",
    downloadPhoto: "Download Photo",
    photoEditSuccess: "Edited photo saved successfully",
    photoEditError: "Error saving edited photo",
    createTemplate: "Create Template",
    editTemplate: "Edit Template",
    deleteTemplate: "Delete Template",
    templateTitle: "Template Title",
    platform: "Platform",
    category: "Category",
    content: "Content",
    hashtags: "Hashtags",
    isShared: "Share with team",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    copied: "Copied",
    copyTemplate: "Copy template",
    noTemplates: "No templates",
    createFirst: "Create your first template or load defaults",
    loadDefaults: "Load Default Templates",
    usageCount: "uses",
    aiGenerated: "AI Generated",
    generateContent: "Generate Content",
    generating: "Generating...",
    propertyDetails: "Property Details",
    selectProperty: "Select Property",
    tone: "Tone",
    tones: {
      professional: "Professional",
      friendly: "Friendly",
      luxury: "Luxury",
      urgent: "Urgent",
    },
    generatedContent: "Generated Content",
    saveAsTemplate: "Save as Template",
    copyToClipboard: "Copy to Clipboard",
    noReminders: "No reminders",
    createReminder: "Create Reminder",
    editReminder: "Edit Reminder",
    reminderTitle: "Title",
    scheduledFor: "Scheduled for",
    notes: "Notes",
    markComplete: "Mark Complete",
    overdue: "Overdue",
    today: "Today",
    tomorrow: "Tomorrow",
    upcoming: "Upcoming",
    completed: "Completed",
    showCompleted: "Show completed",
    deleteConfirm: "Are you sure you want to delete this?",
    deleteAction: "This action cannot be undone",
    variables: "Variables",
    insertVariable: "Insert variable",
    propertyName: "Property name",
    propertyLocation: "Location",
    propertyPrice: "Price",
    propertyBedrooms: "Bedrooms",
    propertyBathrooms: "Bathrooms",
    enterManually: "Enter manually",
    selectUnit: "Select unit",
    optional: "optional",
  },
};

export default function SellerSocialMedia() {
  const { locale } = useTranslation();
  const lang = (locale === "es" ? "es" : "en") as "es" | "en";
  const t = TRANSLATIONS[lang];
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("templates");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Template state
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
  
  // AI Generator state
  const [aiPlatform, setAiPlatform] = useState<"facebook" | "instagram" | "whatsapp">("instagram");
  const [aiCategory, setAiCategory] = useState("new_listing");
  const [aiTone, setAiTone] = useState("professional");
  const [aiPropertyInfo, setAiPropertyInfo] = useState({
    propertyType: "",
    location: "",
    bedrooms: "",
    bathrooms: "",
    price: "",
    area: "",
    address: "",
    unitId: "",
  });
  const [generatedContent, setGeneratedContent] = useState<{ content: string; hashtags: string | null } | null>(null);
  
  // Property selector state
  const [propertySourceType, setPropertySourceType] = useState<"condo" | "house" | "manual">("manual");
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string>("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  
  
  // Template toggle options (for pre-designed templates)
  const [templateOptions, setTemplateOptions] = useState({
    includeUnitNumber: true,
    includeLinks: true,
    includeIcons: true,
    locationLink: "",
    driveLink: "",
    contractFee: "$2,500 MXN",
    trhId: "",
  });
  
  // Reminder state
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<SocialReminder | null>(null);
  const [reminderForm, setReminderForm] = useState({
    title: "",
    platform: "whatsapp" as "facebook" | "instagram" | "whatsapp",
    notes: "",
    scheduledAt: "",
    unitId: "",
  });
  const [deleteReminderId, setDeleteReminderId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Photo editor state
  const [photoPropertyId, setPhotoPropertyId] = useState<string>("");
  const [photoSourceType, setPhotoSourceType] = useState<"condo" | "house">("condo");
  const [photoCondominiumId, setPhotoCondominiumId] = useState<string>("");
  const [editingPhotoUrl, setEditingPhotoUrl] = useState<string | null>(null);
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  
  // Queries
  // Fetch agency AI credits status
  const { data: agencyConfig, refetch: refetchAgencyConfig } = useQuery<AgencyConfig>({
    queryKey: ["/api/external-seller/agency-config"],
  });
  
  // Derived AI credits status - disabled if explicitly false or on error
  const aiCreditsDisabled = agencyConfig?.aiCreditsEnabled === false;
  
  const { data: templates, isLoading: templatesLoading } = useQuery<SocialTemplate[]>({
    queryKey: ["/api/external-seller/social-templates"],
  });
  
  const { data: reminders, isLoading: remindersLoading } = useQuery<SocialReminder[]>({
    queryKey: ["/api/external-seller/social-reminders", { showCompleted }],
  });
  
  const { data: upcomingData } = useQuery<{ total: number; overdue: number; today: number; tomorrow: number }>({
    queryKey: ["/api/external-seller/social-reminders/upcoming"],
  });
  
  const { data: units } = useQuery<Unit[]>({
    queryKey: ["/api/external-seller/property-catalog"],
    select: (data: any) => data?.units || [],
  });
  
  // Property catalog queries
  const { data: condominiums } = useQuery<Condominium[]>({
    queryKey: ["/api/external-seller/condominiums"],
  });
  
  // Properties query for AI generator/templates
  const { data: properties, isLoading: propertiesLoading } = useQuery<PropertyCatalogItem[]>({
    queryKey: [
      "/api/external-seller/properties",
      propertySourceType,
      selectedCondominiumId,
      propertySearchQuery,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      const type = propertySourceType === "condo" ? "condo" : propertySourceType === "house" ? "house" : undefined;
      if (type) params.set("type", type);
      if (propertySourceType === "condo" && selectedCondominiumId) params.set("condominiumId", selectedCondominiumId);
      if (propertySearchQuery) params.set("search", propertySearchQuery);
      const queryString = params.toString();
      const url = `/api/external-seller/properties${queryString ? `?${queryString}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch properties");
      return res.json();
    },
    enabled: propertySourceType === "house" || (propertySourceType === "condo" && !!selectedCondominiumId),
  });
  
  // Photo properties query (separate from AI generator properties)
  const { data: photoProperties, isLoading: photoPropertiesLoading } = useQuery<PropertyCatalogItem[]>({
    queryKey: [
      "/api/external-seller/properties-photos",
      photoSourceType,
      photoCondominiumId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      const type = photoSourceType === "condo" ? "condo" : "house";
      params.set("type", type);
      if (photoSourceType === "condo" && photoCondominiumId) params.set("condominiumId", photoCondominiumId);
      const url = `/api/external-seller/properties?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch photo properties");
      return res.json();
    },
    enabled: photoSourceType === "house" || (photoSourceType === "condo" && !!photoCondominiumId),
  });
  
  // Query for property media/photos
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
  
  // Query for watermark configuration
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
  
  // Template mutations
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
    onError: () => {
      toast({ title: lang === "es" ? "Error al crear" : "Error creating", variant: "destructive" });
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
    onError: () => {
      toast({ title: lang === "es" ? "Error al actualizar" : "Error updating", variant: "destructive" });
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
    onError: () => {
      toast({ title: lang === "es" ? "Error al eliminar" : "Error deleting", variant: "destructive" });
    },
  });
  
  const seedDefaultsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/external-seller/social-templates/seed-defaults", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-templates"] });
      toast({
        title: lang === "es" ? "Plantillas cargadas" : "Templates loaded",
        description: `${data.count || 0} ${lang === "es" ? "plantillas creadas" : "templates created"}`,
      });
    },
    onError: () => {
      toast({ title: lang === "es" ? "Error" : "Error", variant: "destructive" });
    },
  });
  
  const useTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/external-seller/social-templates/${id}/use`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-templates"] });
    },
  });
  
  // AI Generation mutation
  
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/external-seller/social-templates/generate", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw { ...errorData, status: res.status };
      }
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      // Refetch credits after successful generation
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/agency-config"] });
      toast({ title: lang === "es" ? "Contenido generado" : "Content generated" });
    },
    onError: (error: any) => {
      if (error?.code === "AI_CREDITS_DISABLED") {
        queryClient.invalidateQueries({ queryKey: ["/api/external-seller/agency-config"] });
        toast({ 
          title: lang === "es" ? "IA desactivada" : "AI disabled",
          description: lang === "es" 
            ? "Las funciones de IA están desactivadas para tu agencia. Contacta a tu administrador para habilitarlas."
            : "AI features are disabled for your agency. Contact your administrator to enable them.",
          variant: "destructive" 
        });
      } else if (error?.code === "AI_CREDITS_EXHAUSTED") {
        queryClient.invalidateQueries({ queryKey: ["/api/external-seller/agency-config"] });
        toast({ 
          title: lang === "es" ? "Sin créditos" : "No credits",
          description: lang === "es" 
            ? "No tienes créditos de IA disponibles. Usa tus plantillas guardadas en la pestaña 'Plantillas'."
            : "You have no AI credits available. Use your saved templates in the 'Templates' tab.",
          variant: "destructive" 
        });
      } else {
        toast({ title: lang === "es" ? "Error al generar" : "Error generating", variant: "destructive" });
      }
    },
  });
  
  // Reminder mutations
  const createReminderMutation = useMutation({
    mutationFn: async (data: typeof reminderForm) => {
      const res = await apiRequest("POST", "/api/external-seller/social-reminders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-reminders/upcoming"] });
      setIsReminderDialogOpen(false);
      resetReminderForm();
      toast({ title: lang === "es" ? "Recordatorio creado" : "Reminder created" });
    },
    onError: () => {
      toast({ title: lang === "es" ? "Error al crear" : "Error creating", variant: "destructive" });
    },
  });
  
  const updateReminderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/external-seller/social-reminders/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-reminders/upcoming"] });
      setIsReminderDialogOpen(false);
      setEditingReminder(null);
      resetReminderForm();
      toast({ title: lang === "es" ? "Recordatorio actualizado" : "Reminder updated" });
    },
    onError: () => {
      toast({ title: lang === "es" ? "Error al actualizar" : "Error updating", variant: "destructive" });
    },
  });
  
  const completeReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/external-seller/social-reminders/${id}/complete`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-reminders/upcoming"] });
      toast({ title: lang === "es" ? "Completado" : "Completed" });
    },
  });
  
  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/external-seller/social-reminders/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/social-reminders/upcoming"] });
      setDeleteReminderId(null);
      toast({ title: lang === "es" ? "Recordatorio eliminado" : "Reminder deleted" });
    },
    onError: () => {
      toast({ title: lang === "es" ? "Error al eliminar" : "Error deleting", variant: "destructive" });
    },
  });
  
  // Helper functions
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
  
  const resetReminderForm = () => {
    setReminderForm({
      title: "",
      platform: "whatsapp",
      notes: "",
      scheduledAt: "",
      unitId: "",
    });
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
  
  const handleEditReminder = (reminder: SocialReminder) => {
    setEditingReminder(reminder);
    setReminderForm({
      title: reminder.title,
      platform: reminder.platform,
      notes: reminder.notes || "",
      scheduledAt: reminder.scheduledAt.slice(0, 16),
      unitId: reminder.unit?.id || "",
    });
    setIsReminderDialogOpen(true);
  };
  
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    useTemplateMutation.mutate(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: t.copied });
  };
  
  const getPlatformIcon = (platform: string) => {
    const p = PLATFORMS.find(pl => pl.value === platform);
    return p ? <p.icon className={`h-4 w-4 ${p.color}`} /> : null;
  };
  
  const getCategoryLabel = (category: string) => {
    return CATEGORIES[lang][category as keyof typeof CATEGORIES["es"]] || category;
  };
  
  const insertVariable = (variable: string) => {
    setTemplateForm(prev => ({
      ...prev,
      content: prev.content + variable,
    }));
  };
  
  // Auto-fill property data when property is selected
  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    const property = properties?.find(p => p.id === propertyId);
    if (property) {
      // Build a descriptive name including unit number and condo if applicable
      let propertyName = property.unitNumber || property.title || property.propertyType || "";
      
      // Only append condominium name if both unit number AND condo name exist
      if (property.unitNumber && property.condominiumName) {
        propertyName = `${property.unitNumber} - ${property.condominiumName}`;
      } else if (property.condominiumName && !property.unitNumber) {
        // If only condo name exists, use title or property type with condo
        propertyName = property.title || property.condominiumName;
      }
      
      setAiPropertyInfo({
        propertyType: propertyName,
        location: property.zone || property.city || "",
        bedrooms: property.bedrooms?.toString() || "",
        bathrooms: property.bathrooms?.toString() || "",
        price: property.price ? `$${Number(property.price).toLocaleString()} ${property.currency || 'MXN'}` : "",
        area: property.area ? `${property.area} m²` : "",
        address: property.address || "",
        unitId: property.id,
      });
    }
  };
  
  // Get selected property details for template
  const getSelectedProperty = () => {
    if (!selectedPropertyId || propertySourceType === "manual") return null;
    return properties?.find(p => p.id === selectedPropertyId);
  };
  
  // Apply template with property data
  const applyTemplateWithProperty = (template: typeof DEFAULT_TEMPLATES_ES[0]) => {
    let content = template.content;
    const property = getSelectedProperty();
    
    // Basic property fields
    content = content.replace(/\{\{propertyType\}\}/g, aiPropertyInfo.propertyType || "_____");
    content = content.replace(/\{\{location\}\}/g, aiPropertyInfo.location || "_____");
    content = content.replace(/\{\{bedrooms\}\}/g, aiPropertyInfo.bedrooms || "_____");
    content = content.replace(/\{\{bathrooms\}\}/g, aiPropertyInfo.bathrooms || "_____");
    content = content.replace(/\{\{price\}\}/g, aiPropertyInfo.price || "_____");
    content = content.replace(/\{\{area\}\}/g, aiPropertyInfo.area || "_____");
    content = content.replace(/\{\{address\}\}/g, aiPropertyInfo.address || "_____");
    
    // Condominium name
    const condoName = property?.condominiumName || aiPropertyInfo.propertyType || "_____";
    content = content.replace(/\{\{condominiumName\}\}/g, condoName);
    
    // Unit number (optional)
    if (templateOptions.includeUnitNumber && property?.unitNumber) {
      content = content.replace(/\{\{unitNumber\}\}/g, ` ${property.unitNumber}`);
    } else {
      content = content.replace(/\{\{unitNumber\}\}/g, "");
    }
    
    // Floor
    const floor = property?.unitNumber?.includes("piso") || property?.unitNumber?.includes("floor") 
      ? property.unitNumber 
      : (lang === "es" ? "Planta baja" : "Ground floor");
    content = content.replace(/\{\{floor\}\}/g, floor);
    
    // Amenities (respect icons toggle)
    const hasAmenities = property?.amenities && property.amenities.length > 0;
    const defaultAmenitiesWithIcons = lang === "es" ? "✅Alberca\n✅Gimnasio" : "✅Pool\n✅Gym";
    const defaultAmenitiesPlain = lang === "es" ? "- Alberca\n- Gimnasio" : "- Pool\n- Gym";
    
    if (templateOptions.includeIcons) {
      const amenitiesWithIcons = hasAmenities ? property.amenities!.map(a => `✅${a}`).join("\n") : defaultAmenitiesWithIcons;
      content = content.replace(/\{\{amenitiesList\}\}/g, amenitiesWithIcons);
      content = content.replace(/\{\{condoAmenities\}\}/g, amenitiesWithIcons);
    } else {
      const amenitiesPlain = hasAmenities ? property.amenities!.map(a => `- ${a}`).join("\n") : defaultAmenitiesPlain;
      content = content.replace(/\{\{amenitiesList\}\}/g, amenitiesPlain);
      content = content.replace(/\{\{condoAmenities\}\}/g, amenitiesPlain);
    }
    content = content.replace(/\{\{condoAmenitiesPlain\}\}/g, hasAmenities ? property.amenities!.map(a => `- ${a}`).join("\n") : defaultAmenitiesPlain);
    
    // Included services (respect icons toggle)
    const hasServices = property?.includedServices && property.includedServices.length > 0;
    if (templateOptions.includeIcons && hasServices) {
      const servicesWithIcons = property.includedServices!.map(s => `✅${s}`).join("\n");
      content = content.replace(/\{\{includedServices\}\}/g, `\n${servicesWithIcons}`);
    } else if (hasServices) {
      const servicesPlain = property.includedServices!.map(s => `- ${s}`).join("\n");
      content = content.replace(/\{\{includedServices\}\}/g, `\n${servicesPlain}`);
    } else {
      content = content.replace(/\{\{includedServices\}\}/g, "");
    }
    content = content.replace(/\{\{includedServicesPlain\}\}/g, hasServices ? property.includedServices!.map(s => `, ${s}`).join("") : "");
    
    // Contract fee
    const contractFeeText = templateOptions.contractFee ? ` + ${templateOptions.contractFee} ${lang === "es" ? "contrato/póliza" : "contract/policy"}` : "";
    content = content.replace(/\{\{contractFee\}\}/g, contractFeeText);
    
    // Links (optional based on toggle - also respect icons toggle)
    if (templateOptions.includeLinks && templateOptions.locationLink) {
      const locationLabel = lang === "es" ? "Ubicación" : "Location";
      const locationIcon = templateOptions.includeIcons ? "📍" : "";
      content = content.replace(/\{\{locationLink\}\}/g, `${locationIcon}${locationLabel}: ${templateOptions.locationLink}`);
    } else {
      content = content.replace(/\{\{locationLink\}\}/g, "");
    }
    
    if (templateOptions.includeLinks && templateOptions.driveLink) {
      const driveIcon = templateOptions.includeIcons ? "🖪 " : "";
      content = content.replace(/\{\{driveLink\}\}/g, `${driveIcon}Drive: ${templateOptions.driveLink}`);
    } else {
      content = content.replace(/\{\{driveLink\}\}/g, "");
    }
    
    // TRH ID
    if (templateOptions.trhId) {
      content = content.replace(/\{\{trhId\}\}/g, `TRH ID ${templateOptions.trhId}`);
    } else {
      content = content.replace(/\{\{trhId\}\}/g, "");
    }
    
    // Remove icons if option is disabled
    if (!templateOptions.includeIcons) {
      content = content.replace(/[🌴📍💫✅💰🚰🖪📅🕐🎉🏡🛏️🛁📐🏠📦🔑🌊🏊‍♂️💪🅿️🔒]/g, "");
    }
    
    // Clean up empty lines
    content = content.replace(/\n{3,}/g, "\n\n").trim();
    
    navigator.clipboard.writeText(content);
    toast({ title: t.copied });
  };
  
  const handleGenerateAI = () => {
    generateMutation.mutate({
      platform: aiPlatform,
      category: aiCategory,
      language: lang,
      tone: aiTone,
      propertyInfo: aiPropertyInfo,
    });
  };
  
  const saveGeneratedAsTemplate = () => {
    if (!generatedContent) return;
    setTemplateForm({
      title: `${lang === "es" ? "Generado" : "Generated"} - ${getCategoryLabel(aiCategory)}`,
      platform: aiPlatform,
      category: aiCategory,
      content: generatedContent.content,
      hashtags: generatedContent.hashtags || "",
      isShared: false,
    });
    setActiveTab("templates");
    setIsTemplateDialogOpen(true);
  };
  
  const handleTemplateSubmit = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateForm });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };
  
  const handleReminderSubmit = () => {
    if (editingReminder) {
      updateReminderMutation.mutate({ id: editingReminder.id, data: reminderForm });
    } else {
      createReminderMutation.mutate(reminderForm);
    }
  };
  
  const filteredTemplates = templates?.filter(t => 
    filterPlatform === "all" || t.platform === filterPlatform
  ) || [];
  
  const getReminderStatus = (reminder: SocialReminder) => {
    const date = new Date(reminder.scheduledAt);
    if (reminder.isCompleted) return "completed";
    if (isPast(date)) return "overdue";
    if (isToday(date)) return "today";
    if (isTomorrow(date)) return "tomorrow";
    return "upcoming";
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <h1 className="text-xl font-bold" data-testid="text-page-title">{t.pageTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.pageDescription}</p>
      </div>
      
      {/* Upcoming reminders badge */}
      {upcomingData && upcomingData.total > 0 && (
        <div className="px-4 py-2 bg-muted/50">
          <div className="flex items-center gap-2 flex-wrap">
            {upcomingData.overdue > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {upcomingData.overdue} {t.overdue}
              </Badge>
            )}
            {upcomingData.today > 0 && (
              <Badge variant="default" className="gap-1">
                <Clock className="h-3 w-3" />
                {upcomingData.today} {t.today}
              </Badge>
            )}
            {upcomingData.tomorrow > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Calendar className="h-3 w-3" />
                {upcomingData.tomorrow} {t.tomorrow}
              </Badge>
            )}
          </div>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile-optimized tabs */}
        <TabsList className="w-full grid grid-cols-4 h-12 rounded-none border-b">
          <TabsTrigger value="templates" className="gap-1 text-xs sm:text-sm" data-testid="tab-templates">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t.tabTemplates}</span>
          </TabsTrigger>
          <TabsTrigger value="generator" className="gap-1 text-xs sm:text-sm" data-testid="tab-generator">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">{t.tabGenerator}</span>
          </TabsTrigger>
          <TabsTrigger value="photos" className="gap-1 text-xs sm:text-sm" data-testid="tab-photos">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">{t.tabPhotos}</span>
          </TabsTrigger>
          <TabsTrigger value="reminders" className="gap-1 text-xs sm:text-sm relative" data-testid="tab-reminders">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">{t.tabReminders}</span>
            {upcomingData && upcomingData.total > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                {upcomingData.total}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Templates Tab */}
        <TabsContent value="templates" className="p-4 space-y-4">
          {/* Filter and actions */}
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
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => seedDefaultsMutation.mutate()}
                disabled={seedDefaultsMutation.isPending}
                data-testid="button-load-defaults"
              >
                {seedDefaultsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline ml-1">{t.loadDefaults}</span>
              </Button>
              <Button 
                onClick={() => {
                  setEditingTemplate(null);
                  resetTemplateForm();
                  setIsTemplateDialogOpen(true);
                }}
                size="sm"
                data-testid="button-create-template"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">{t.createTemplate}</span>
              </Button>
            </div>
          </div>
          
          {/* Templates list */}
          {templatesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t.noTemplates}</p>
                <p className="text-sm text-muted-foreground">{t.createFirst}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map(template => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getPlatformIcon(template.platform)}
                      <h3 className="font-medium truncate">{template.title}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {template.isAiGenerated && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Sparkles className="h-3 w-3" />
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(template.category)}
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
                  <CardFooter className="pt-0 flex justify-between items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {template.usageCount} {t.usageCount}
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
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* AI Generator Tab */}
        <TabsContent value="generator" className="p-4 space-y-4">
          {/* AI Credits Header - Shows seller's personal credits */}
          {!aiCreditsDisabled && (
            <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg p-3 border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/20 rounded-full">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {lang === "es" ? "Mis Créditos de IA" : "My AI Credits"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lang === "es" ? "Disponibles para generar contenido" : "Available to generate content"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${(agencyConfig?.aiCreditBalance ?? 0) > 0 ? "text-primary" : "text-destructive"}`}>
                  {agencyConfig?.aiCreditBalance ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === "es" ? "Usados:" : "Used:"} {agencyConfig?.aiCreditUsed ?? 0} / {agencyConfig?.aiCreditTotalAssigned ?? 10}
                </p>
              </div>
            </div>
          )}
          
          {/* No credits warning */}
          {!aiCreditsDisabled && (agencyConfig?.aiCreditBalance ?? 0) === 0 && (
            <Card className="border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    {lang === "es" ? "Sin créditos de IA" : "No AI credits"}
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    {lang === "es" 
                      ? "Puedes usar tus plantillas guardadas en la pestaña 'Plantillas' para crear publicaciones sin usar créditos."
                      : "You can use your saved templates in the 'Templates' tab to create posts without using credits."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* AI Credits Disabled - Show Templates */}
          {aiCreditsDisabled ? (
            <>
              <Card className="border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950">
                <CardContent className="flex items-center gap-3 p-4">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-orange-800 dark:text-orange-200">
                      {lang === "es" ? "IA desactivada" : "AI disabled"}
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      {lang === "es" 
                        ? "Usa las plantillas prediseñadas a continuación para crear tu contenido."
                        : "Use the pre-designed templates below to create your content."}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Property Selector for Templates */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    {lang === "es" ? "Seleccionar Propiedad" : "Select Property"}
                  </CardTitle>
                  <CardDescription>
                    {lang === "es" 
                      ? "Selecciona una propiedad para rellenar las plantillas automáticamente"
                      : "Select a property to auto-fill templates"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Property Type Selection */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={propertySourceType === "condo" ? "default" : "outline"}
                      className="flex-col h-auto py-3 gap-1"
                      onClick={() => {
                        setPropertySourceType("condo");
                        setSelectedPropertyId("");
                      }}
                      data-testid="button-property-condo"
                    >
                      <Building2 className="h-5 w-5" />
                      <span className="text-xs">{lang === "es" ? "Condominio" : "Condo"}</span>
                    </Button>
                    <Button
                      variant={propertySourceType === "house" ? "default" : "outline"}
                      className="flex-col h-auto py-3 gap-1"
                      onClick={() => {
                        setPropertySourceType("house");
                        setSelectedCondominiumId("");
                        setSelectedPropertyId("");
                      }}
                      data-testid="button-property-house"
                    >
                      <Home className="h-5 w-5" />
                      <span className="text-xs">{lang === "es" ? "Casa" : "House"}</span>
                    </Button>
                    <Button
                      variant={propertySourceType === "manual" ? "default" : "outline"}
                      className="flex-col h-auto py-3 gap-1"
                      onClick={() => setPropertySourceType("manual")}
                      data-testid="button-property-manual"
                    >
                      <Pencil className="h-5 w-5" />
                      <span className="text-xs">{lang === "es" ? "Manual" : "Manual"}</span>
                    </Button>
                  </div>
                  
                  {/* Condo Selection - with search */}
                  {propertySourceType === "condo" && (
                    <SearchableSelect
                      value={selectedCondominiumId}
                      onValueChange={(value) => {
                        setSelectedCondominiumId(value);
                        setSelectedPropertyId("");
                      }}
                      options={(condominiums || []).map(condo => ({
                        value: condo.id,
                        label: condo.name + (condo.zone ? ` - ${condo.zone}` : ""),
                      }))}
                      placeholder={lang === "es" ? "Seleccionar condominio..." : "Select condominium..."}
                      searchPlaceholder={lang === "es" ? "Buscar condominio..." : "Search condominium..."}
                      emptyMessage={lang === "es" ? "No se encontraron condominios" : "No condominiums found"}
                      data-testid="select-condominium"
                    />
                  )}
                  
                  {/* Property Selection */}
                  {propertySourceType !== "manual" && (
                    <Select 
                      value={selectedPropertyId} 
                      onValueChange={handlePropertySelect}
                      disabled={propertySourceType === "condo" && !selectedCondominiumId}
                    >
                      <SelectTrigger data-testid="select-property">
                        <SelectValue placeholder={lang === "es" ? "Seleccionar propiedad..." : "Select property..."} />
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
                                {prop.bedrooms && <span className="text-xs text-muted-foreground">{prop.bedrooms}BR</span>}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* Manual Entry Fields */}
                  {propertySourceType === "manual" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder={t.propertyName}
                        value={aiPropertyInfo.propertyType}
                        onChange={e => setAiPropertyInfo(p => ({ ...p, propertyType: e.target.value }))}
                        data-testid="input-manual-property-type"
                      />
                      <Input
                        placeholder={t.propertyLocation}
                        value={aiPropertyInfo.location}
                        onChange={e => setAiPropertyInfo(p => ({ ...p, location: e.target.value }))}
                        data-testid="input-manual-location"
                      />
                      <Input
                        placeholder={t.propertyBedrooms}
                        value={aiPropertyInfo.bedrooms}
                        onChange={e => setAiPropertyInfo(p => ({ ...p, bedrooms: e.target.value }))}
                        data-testid="input-manual-bedrooms"
                      />
                      <Input
                        placeholder={t.propertyBathrooms}
                        value={aiPropertyInfo.bathrooms}
                        onChange={e => setAiPropertyInfo(p => ({ ...p, bathrooms: e.target.value }))}
                        data-testid="input-manual-bathrooms"
                      />
                      <Input
                        placeholder={t.propertyPrice}
                        value={aiPropertyInfo.price}
                        onChange={e => setAiPropertyInfo(p => ({ ...p, price: e.target.value }))}
                        data-testid="input-manual-price"
                      />
                      <Input
                        placeholder={`${lang === "es" ? "Área m²" : "Area sqft"}`}
                        value={aiPropertyInfo.area}
                        onChange={e => setAiPropertyInfo(p => ({ ...p, area: e.target.value }))}
                        data-testid="input-manual-area"
                      />
                    </div>
                  )}
                  
                  {/* Selected Property Summary */}
                  {selectedPropertyId && propertySourceType !== "manual" && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <p className="font-medium text-sm">
                        {lang === "es" ? "Propiedad seleccionada:" : "Selected property:"}
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{t.propertyName}: <span className="text-foreground">{aiPropertyInfo.propertyType || "-"}</span></span>
                        <span>{t.propertyLocation}: <span className="text-foreground">{aiPropertyInfo.location || "-"}</span></span>
                        <span>{t.propertyBedrooms}: <span className="text-foreground">{aiPropertyInfo.bedrooms || "-"}</span></span>
                        <span>{t.propertyBathrooms}: <span className="text-foreground">{aiPropertyInfo.bathrooms || "-"}</span></span>
                        <span>{t.propertyPrice}: <span className="text-foreground">{aiPropertyInfo.price || "-"}</span></span>
                        <span>{lang === "es" ? "Área" : "Area"}: <span className="text-foreground">{aiPropertyInfo.area || "-"}</span></span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Template Options */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    {lang === "es" ? "Opciones de Publicación" : "Publishing Options"}
                  </CardTitle>
                  <CardDescription>
                    {lang === "es" 
                      ? "Configura qué elementos incluir en tu publicación"
                      : "Configure what to include in your post"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Toggle options */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <Label htmlFor="include-unit" className="text-sm cursor-pointer">
                        {lang === "es" ? "No. Unidad" : "Unit #"}
                      </Label>
                      <Switch 
                        id="include-unit"
                        checked={templateOptions.includeUnitNumber}
                        onCheckedChange={(checked) => setTemplateOptions(p => ({ ...p, includeUnitNumber: checked }))}
                        data-testid="switch-include-unit"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <Label htmlFor="include-links" className="text-sm cursor-pointer">
                        {lang === "es" ? "Links" : "Links"}
                      </Label>
                      <Switch 
                        id="include-links"
                        checked={templateOptions.includeLinks}
                        onCheckedChange={(checked) => setTemplateOptions(p => ({ ...p, includeLinks: checked }))}
                        data-testid="switch-include-links"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <Label htmlFor="include-icons" className="text-sm cursor-pointer">
                        {lang === "es" ? "Iconos" : "Icons"}
                      </Label>
                      <Switch 
                        id="include-icons"
                        checked={templateOptions.includeIcons}
                        onCheckedChange={(checked) => setTemplateOptions(p => ({ ...p, includeIcons: checked }))}
                        data-testid="switch-include-icons"
                      />
                    </div>
                  </div>
                  
                  {/* Links inputs (only shown when links are enabled) */}
                  {templateOptions.includeLinks && (
                    <div className="space-y-2">
                      <Input
                        placeholder={lang === "es" ? "Link de ubicación (Google Maps)" : "Location link (Google Maps)"}
                        value={templateOptions.locationLink}
                        onChange={e => setTemplateOptions(p => ({ ...p, locationLink: e.target.value }))}
                        data-testid="input-location-link"
                      />
                      <Input
                        placeholder={lang === "es" ? "Link de Drive (fotos)" : "Drive link (photos)"}
                        value={templateOptions.driveLink}
                        onChange={e => setTemplateOptions(p => ({ ...p, driveLink: e.target.value }))}
                        data-testid="input-drive-link"
                      />
                    </div>
                  )}
                  
                  {/* Additional info */}
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder={lang === "es" ? "Costo contrato/póliza" : "Contract/policy fee"}
                      value={templateOptions.contractFee}
                      onChange={e => setTemplateOptions(p => ({ ...p, contractFee: e.target.value }))}
                      data-testid="input-contract-fee"
                    />
                    <Input
                      placeholder="TRH ID"
                      value={templateOptions.trhId}
                      onChange={e => setTemplateOptions(p => ({ ...p, trhId: e.target.value }))}
                      data-testid="input-trh-id"
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Pre-designed Templates */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {lang === "es" ? "Plantillas Prediseñadas" : "Pre-designed Templates"}
                  </CardTitle>
                  <CardDescription>
                    {lang === "es" 
                      ? "Toca una plantilla para copiarla con los datos de tu propiedad"
                      : "Tap a template to copy it with your property data"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(lang === "es" ? DEFAULT_TEMPLATES_ES : DEFAULT_TEMPLATES_EN).map(template => (
                    <Card 
                      key={template.id} 
                      className="hover-elevate cursor-pointer transition-all"
                      onClick={() => applyTemplateWithProperty(template)}
                      data-testid={`card-default-template-${template.id}`}
                    >
                      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 space-y-0">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(template.platform)}
                          <span className="font-medium text-sm">{template.title}</span>
                        </div>
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                          {template.content.substring(0, 100)}...
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* AI Generator - Professional Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Panel - Configuration */}
                <div className="space-y-4">
                  {/* Property Selection Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        {lang === "es" ? "Seleccionar Propiedad" : "Select Property"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Property Type Toggle */}
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={propertySourceType === "condo" ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setPropertySourceType("condo");
                            setSelectedPropertyId("");
                          }}
                          data-testid="button-source-condo"
                        >
                          <Building2 className="h-4 w-4 mr-1" />
                          {lang === "es" ? "Condo" : "Condo"}
                        </Button>
                        <Button
                          variant={propertySourceType === "house" ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setPropertySourceType("house");
                            setSelectedCondominiumId("");
                            setSelectedPropertyId("");
                          }}
                          data-testid="button-source-house"
                        >
                          <Home className="h-4 w-4 mr-1" />
                          {lang === "es" ? "Casa" : "House"}
                        </Button>
                        <Button
                          variant={propertySourceType === "manual" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPropertySourceType("manual")}
                          data-testid="button-source-manual"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Manual
                        </Button>
                      </div>
                      
                      {/* Condo Selection - with search */}
                      {propertySourceType === "condo" && (
                        <SearchableSelect
                          value={selectedCondominiumId}
                          onValueChange={(value) => {
                            setSelectedCondominiumId(value);
                            setSelectedPropertyId("");
                          }}
                          options={(condominiums || []).map(condo => ({
                            value: condo.id,
                            label: condo.name + (condo.zone ? ` - ${condo.zone}` : ""),
                          }))}
                          placeholder={lang === "es" ? "Seleccionar condominio..." : "Select condominium..."}
                          searchPlaceholder={lang === "es" ? "Buscar condominio..." : "Search condominium..."}
                          emptyMessage={lang === "es" ? "No se encontraron condominios" : "No condominiums found"}
                          data-testid="select-ai-condominium"
                        />
                      )}
                      
                      {/* Property Selection */}
                      {propertySourceType !== "manual" && (
                        <Select 
                          value={selectedPropertyId} 
                          onValueChange={handlePropertySelect}
                          disabled={propertySourceType === "condo" && !selectedCondominiumId}
                        >
                          <SelectTrigger data-testid="select-ai-property">
                            <SelectValue placeholder={lang === "es" ? "Seleccionar propiedad..." : "Select property..."} />
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
                                    {prop.bedrooms && <span className="text-xs text-muted-foreground">{prop.bedrooms}BR</span>}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Post Configuration Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        {lang === "es" ? "Configuración del Post" : "Post Configuration"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Platform selection */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">{t.platform}</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {PLATFORMS.map(p => (
                            <Button
                              key={p.value}
                              variant={aiPlatform === p.value ? "default" : "outline"}
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => setAiPlatform(p.value as any)}
                              data-testid={`button-ai-platform-${p.value}`}
                            >
                              <p.icon className={`h-4 w-4 ${aiPlatform === p.value ? "text-current" : p.color}`} />
                              <span className="text-xs">{p.label}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Category and tone */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">{t.category}</Label>
                          <Select value={aiCategory} onValueChange={setAiCategory}>
                            <SelectTrigger data-testid="select-ai-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(CATEGORIES[lang]).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">{t.tone}</Label>
                          <Select value={aiTone} onValueChange={setAiTone}>
                            <SelectTrigger data-testid="select-ai-tone">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(t.tones).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Property info (only for manual mode) */}
                      {propertySourceType === "manual" && (
                        <div>
                          <Label className="text-sm">{t.propertyDetails}</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <Input
                              placeholder={t.propertyName}
                              value={aiPropertyInfo.propertyType}
                              onChange={e => setAiPropertyInfo(p => ({ ...p, propertyType: e.target.value }))}
                              data-testid="input-ai-property-type"
                            />
                            <Input
                              placeholder={t.propertyLocation}
                              value={aiPropertyInfo.location}
                              onChange={e => setAiPropertyInfo(p => ({ ...p, location: e.target.value }))}
                              data-testid="input-ai-location"
                            />
                            <Input
                              placeholder={t.propertyBedrooms}
                              value={aiPropertyInfo.bedrooms}
                              onChange={e => setAiPropertyInfo(p => ({ ...p, bedrooms: e.target.value }))}
                              data-testid="input-ai-bedrooms"
                            />
                            <Input
                              placeholder={t.propertyBathrooms}
                              value={aiPropertyInfo.bathrooms}
                              onChange={e => setAiPropertyInfo(p => ({ ...p, bathrooms: e.target.value }))}
                              data-testid="input-ai-bathrooms"
                            />
                            <Input
                              placeholder={t.propertyPrice}
                              value={aiPropertyInfo.price}
                              onChange={e => setAiPropertyInfo(p => ({ ...p, price: e.target.value }))}
                              data-testid="input-ai-price"
                            />
                            <Input
                              placeholder={`${lang === "es" ? "Área m²" : "Area sqft"}`}
                              value={aiPropertyInfo.area}
                              onChange={e => setAiPropertyInfo(p => ({ ...p, area: e.target.value }))}
                              data-testid="input-ai-area"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Selected Property Summary (for condo/house mode) */}
                      {propertySourceType !== "manual" && selectedPropertyId && aiPropertyInfo.propertyType && (
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{aiPropertyInfo.propertyType}</span>
                            <Badge variant="outline" className="text-xs">{aiPropertyInfo.location}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {aiPropertyInfo.bedrooms && <span>{aiPropertyInfo.bedrooms} {lang === "es" ? "Rec" : "BR"}</span>}
                            {aiPropertyInfo.bathrooms && <span>{aiPropertyInfo.bathrooms} {lang === "es" ? "Baños" : "BA"}</span>}
                            {aiPropertyInfo.area && <span>{aiPropertyInfo.area}</span>}
                            {aiPropertyInfo.price && <span className="font-medium text-foreground">{aiPropertyInfo.price}</span>}
                          </div>
                        </div>
                      )}
                      
                      {/* Generate Button */}
                      <Button 
                        onClick={handleGenerateAI}
                        disabled={generateMutation.isPending || !aiPropertyInfo.propertyType || (agencyConfig?.aiCreditBalance ?? 0) <= 0}
                        className="w-full"
                        data-testid="button-generate-ai"
                      >
                        {generateMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {t.generating}
                          </>
                        ) : (agencyConfig?.aiCreditBalance ?? 0) <= 0 ? (
                          <>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            {lang === "es" ? "Sin Créditos" : "No Credits"}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            {t.generateContent}
                            <Badge variant="secondary" className="ml-2 text-xs">
                              -1 {lang === "es" ? "crédito" : "credit"}
                            </Badge>
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Right Panel - Generated Content */}
                <div className="space-y-4">
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {t.generatedContent}
                        </CardTitle>
                        {agencyConfig && (
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {agencyConfig.aiCreditBalance} {lang === "es" ? "créditos" : "credits"}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {lang === "es" 
                          ? "El contenido generado aparecerá aquí. Puedes editarlo antes de copiar o guardar."
                          : "Generated content will appear here. You can edit it before copying or saving."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {generatedContent ? (
                        <>
                          {/* Editable Content Area */}
                          <Textarea
                            className="min-h-[200px] resize-none font-mono text-sm"
                            value={generatedContent.content}
                            onChange={(e) => setGeneratedContent(prev => 
                              prev ? { ...prev, content: e.target.value } : null
                            )}
                            placeholder={lang === "es" ? "Contenido generado..." : "Generated content..."}
                            data-testid="textarea-generated-content"
                          />
                          
                          {/* Hashtags (for Instagram) */}
                          {generatedContent.hashtags && (
                            <div className="space-y-2">
                              <Label className="text-sm flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                Hashtags
                              </Label>
                              <Input
                                value={generatedContent.hashtags}
                                onChange={(e) => setGeneratedContent(prev => 
                                  prev ? { ...prev, hashtags: e.target.value } : null
                                )}
                                placeholder="#tulum #realestate"
                                data-testid="input-hashtags"
                              />
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  generatedContent.content + 
                                  (generatedContent.hashtags ? `\n\n${generatedContent.hashtags}` : "")
                                );
                                toast({ title: t.copied });
                              }}
                              data-testid="button-copy-generated"
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              {t.copyToClipboard}
                            </Button>
                            <Button 
                              size="sm"
                              onClick={saveGeneratedAsTemplate}
                              data-testid="button-save-generated"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              {t.saveAsTemplate}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setGeneratedContent(null)}
                              data-testid="button-clear-generated"
                            >
                              <X className="h-4 w-4 mr-1" />
                              {lang === "es" ? "Limpiar" : "Clear"}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center min-h-[200px] text-center text-muted-foreground">
                          <Sparkles className="h-12 w-12 mb-3 opacity-50" />
                          <p className="text-sm">
                            {lang === "es" 
                              ? "Selecciona una propiedad y configura tu post para generar contenido con IA"
                              : "Select a property and configure your post to generate AI content"}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </TabsContent>
        
        {/* Reminders Tab */}
        <TabsContent value="reminders" className="p-4 space-y-4">
          {/* Actions */}
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
                id="show-completed"
                data-testid="switch-show-completed"
              />
              <Label htmlFor="show-completed" className="text-sm">{t.showCompleted}</Label>
            </div>
            <Button 
              onClick={() => {
                setEditingReminder(null);
                resetReminderForm();
                setIsReminderDialogOpen(true);
              }}
              size="sm"
              data-testid="button-create-reminder"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">{t.createReminder}</span>
            </Button>
          </div>
          
          {/* Reminders list */}
          {remindersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (reminders?.length || 0) === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t.noReminders}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reminders?.map(reminder => {
                const status = getReminderStatus(reminder);
                return (
                  <Card 
                    key={reminder.id} 
                    className={`overflow-hidden ${reminder.isCompleted ? "opacity-60" : ""}`}
                  >
                    <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getPlatformIcon(reminder.platform)}
                        <h3 className={`font-medium truncate ${reminder.isCompleted ? "line-through" : ""}`}>
                          {reminder.title}
                        </h3>
                      </div>
                      <Badge 
                        variant={
                          status === "overdue" ? "destructive" :
                          status === "today" ? "default" :
                          status === "completed" ? "secondary" :
                          "outline"
                        }
                      >
                        {status === "overdue" && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {status === "overdue" ? t.overdue :
                         status === "today" ? t.today :
                         status === "tomorrow" ? t.tomorrow :
                         status === "completed" ? t.completed :
                         t.upcoming}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(reminder.scheduledAt), "PPP p", { locale: lang === "es" ? es : enUS })}
                      </div>
                      {reminder.unit && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Share2 className="h-3 w-3" />
                          {reminder.unit.unitNumber}
                        </div>
                      )}
                      {reminder.notes && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{reminder.notes}</p>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-end gap-1">
                      {!reminder.isCompleted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => completeReminderMutation.mutate(reminder.id)}
                          data-testid={`button-complete-reminder-${reminder.id}`}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {t.markComplete}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditReminder(reminder)}
                        data-testid={`button-edit-reminder-${reminder.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteReminderId(reminder.id)}
                        data-testid={`button-delete-reminder-${reminder.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {lang === "es" ? "Tipo de Propiedad" : "Property Type"}
                </Label>
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
                    {lang === "es" ? "Condominio" : "Condo"}
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
                    {lang === "es" ? "Casa" : "House"}
                  </Button>
                </div>
              </div>
              
              {/* Condominium Selection (only for condo mode) - with search */}
              {photoSourceType === "condo" && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    {lang === "es" ? "Condominio" : "Condominium"}
                  </Label>
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
                    searchPlaceholder={lang === "es" ? "Buscar condominio..." : "Search condominium..."}
                    emptyMessage={lang === "es" ? "No se encontraron condominios" : "No condominiums found"}
                    data-testid="select-photo-condominium"
                  />
                </div>
              )}
              
              {/* Property/Unit Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  {t.selectProperty}
                </Label>
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
                            {prop.bedrooms && <span className="text-xs text-muted-foreground">{prop.bedrooms}BR</span>}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Photo gallery */}
              {!photoPropertyId ? (
                <div className="text-center py-8">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">{t.selectPropertyFirst}</p>
                </div>
              ) : mediaLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
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
                  {/* Album header with count and bulk actions */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Image className="h-4 w-4" />
                      <span>{(propertyMedia || []).filter(m => m.type === "image").length} {lang === "es" ? "fotos" : "photos"}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const images = (propertyMedia || []).filter(m => m.type === "image");
                        if (images.length > 0) {
                          setEditingPhotoUrl(images[0].url);
                          setEditingMediaId(images[0].id);
                        }
                      }}
                      data-testid="button-bulk-edit-photos"
                    >
                      <Wand2 className="h-4 w-4 mr-1" />
                      {lang === "es" ? "Editar fotos" : "Edit photos"}
                    </Button>
                  </div>
                  
                  {/* Compact thumbnail grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                    {(propertyMedia || [])
                      .filter(m => m.type === "image")
                      .map(media => (
                        <div 
                          key={media.id}
                          className="group relative aspect-[4/3] rounded overflow-hidden border bg-muted cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-1 transition-all"
                          onClick={() => {
                            setEditingPhotoUrl(media.url);
                            setEditingMediaId(media.id);
                          }}
                        >
                          <img
                            src={media.url}
                            alt={media.caption || `Photo ${media.order}`}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Wand2 className="h-5 w-5 text-white drop-shadow-lg" />
                            </div>
                          </div>
                          {media.section && (
                            <Badge 
                              variant="secondary" 
                              className="absolute bottom-1 left-1 text-[9px] px-1 py-0"
                            >
                              {media.section}
                            </Badge>
                          )}
                          <span className="absolute top-1 right-1 bg-black/50 text-white text-[9px] px-1 rounded">
                            {media.order + 1}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Photo Editor Dialog - Professional layout */}
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
              {/* Left sidebar - Thumbnail strip for album navigation */}
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
              
              {/* Main editor area */}
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
                    try {
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(editedBlob);
                      link.download = `edited-photo-${Date.now()}.jpg`;
                      link.click();
                      URL.revokeObjectURL(link.href);
                      toast({ title: t.photoEditSuccess });
                    } catch (error) {
                      console.error("Error saving photo:", error);
                      toast({ title: t.photoEditError, variant: "destructive" });
                    }
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
                <span className="text-xs text-muted-foreground">{t.variables}</span>
              </div>
              <Textarea
                value={templateForm.content}
                onChange={e => setTemplateForm(f => ({ ...f, content: e.target.value }))}
                placeholder={lang === "es" ? "Escribe tu plantilla aquí..." : "Write your template here..."}
                rows={6}
                data-testid="textarea-template-content"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {TEMPLATE_VARIABLES[lang].map(v => (
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
                <Label>{t.hashtags} ({t.optional})</Label>
                <Input
                  value={templateForm.hashtags}
                  onChange={e => setTemplateForm(f => ({ ...f, hashtags: e.target.value }))}
                  placeholder="#Tulum #RealEstate #Investment"
                  data-testid="input-template-hashtags"
                />
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Switch
                checked={templateForm.isShared}
                onCheckedChange={v => setTemplateForm(f => ({ ...f, isShared: v }))}
                id="is-shared"
                data-testid="switch-template-shared"
              />
              <Label htmlFor="is-shared">{t.isShared}</Label>
            </div>
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
      
      {/* Reminder Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingReminder ? t.editReminder : t.createReminder}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.reminderTitle}</Label>
              <Input
                value={reminderForm.title}
                onChange={e => setReminderForm(f => ({ ...f, title: e.target.value }))}
                placeholder={lang === "es" ? "Ej: Publicar propiedad en Instagram" : "E.g.: Post property on Instagram"}
                data-testid="input-reminder-title"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.platform}</Label>
                <Select 
                  value={reminderForm.platform} 
                  onValueChange={v => setReminderForm(f => ({ ...f, platform: v as any }))}
                >
                  <SelectTrigger data-testid="select-reminder-platform">
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
                <Label>{t.scheduledFor}</Label>
                <Input
                  type="datetime-local"
                  value={reminderForm.scheduledAt}
                  onChange={e => setReminderForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  data-testid="input-reminder-date"
                />
              </div>
            </div>
            
            {units && units.length > 0 && (
              <div>
                <Label>{t.selectUnit} ({t.optional})</Label>
                <Select 
                  value={reminderForm.unitId} 
                  onValueChange={v => setReminderForm(f => ({ ...f, unitId: v }))}
                >
                  <SelectTrigger data-testid="select-reminder-unit">
                    <SelectValue placeholder={t.selectUnit} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{lang === "es" ? "Ninguna" : "None"}</SelectItem>
                    {units.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.unitNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label>{t.notes} ({t.optional})</Label>
              <Textarea
                value={reminderForm.notes}
                onChange={e => setReminderForm(f => ({ ...f, notes: e.target.value }))}
                placeholder={lang === "es" ? "Notas adicionales..." : "Additional notes..."}
                rows={3}
                data-testid="textarea-reminder-notes"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsReminderDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button 
              onClick={handleReminderSubmit}
              disabled={!reminderForm.title || !reminderForm.scheduledAt || createReminderMutation.isPending || updateReminderMutation.isPending}
              data-testid="button-save-reminder"
            >
              {(createReminderMutation.isPending || updateReminderMutation.isPending) && (
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
      
      {/* Delete Reminder Confirmation */}
      <AlertDialog open={!!deleteReminderId} onOpenChange={() => setDeleteReminderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang === "es" ? "Eliminar Recordatorio" : "Delete Reminder"}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteReminderId && deleteReminderMutation.mutate(deleteReminderId)}
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
