import { useState, useEffect } from "react";
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
  ChevronRight
} from "lucide-react";
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
  aiCreditBalance: number | null;
  aiCreditsMonthlyReset: boolean;
  monthlyUsed: number;
}

interface TrackingLink {
  id: string;
  token: string;
  targetUrl: string;
  platform: string | null;
  clickCount: number;
  lastClickedAt: string | null;
  createdAt: string;
  unitId: string | null;
  unitNumber: string | null;
  trackingUrl: string;
}

const DEFAULT_TEMPLATES_ES = [
  {
    id: "default-1",
    title: "Nueva Propiedad - WhatsApp",
    platform: "whatsapp" as const,
    content: `🏠 *NUEVA PROPIEDAD EN {{location}}*

✨ {{propertyType}} de {{bedrooms}} recámaras
🛁 {{bathrooms}} baños
📐 {{area}} m²

💰 *Precio: {{price}}*

📍 Ubicación privilegiada en Tulum

¿Te interesa agendar una visita? 
Contáctame para más información.`,
  },
  {
    id: "default-2",
    title: "Promoción Instagram",
    platform: "instagram" as const,
    content: `🌴 Tu paraíso en Tulum te espera

{{propertyType}} de ensueño con:
🛏️ {{bedrooms}} recámaras
🛁 {{bathrooms}} baños  
📐 {{area}} m²

📍 {{location}}
💰 {{price}}

¡Escríbenos para más información!

#TulumRealEstate #PropiedadesEnTulum #VidaEnTulum #InvierteEnTulum #ParaisoMexicano`,
  },
  {
    id: "default-3",
    title: "Casa Abierta - Facebook",
    platform: "facebook" as const,
    content: `🎉 ¡CASA ABIERTA este fin de semana!

Te invitamos a conocer esta increíble propiedad:

🏡 {{propertyType}}
📍 {{location}}
🛏️ {{bedrooms}} recámaras
🛁 {{bathrooms}} baños
📐 {{area}} m²
💰 {{price}}

📅 Sábado y Domingo
🕐 10:00 AM - 4:00 PM

¡No te lo pierdas! Confirma tu asistencia.`,
  },
];

const DEFAULT_TEMPLATES_EN = [
  {
    id: "default-1",
    title: "New Listing - WhatsApp",
    platform: "whatsapp" as const,
    content: `🏠 *NEW LISTING IN {{location}}*

✨ {{propertyType}} with {{bedrooms}} bedrooms
🛁 {{bathrooms}} bathrooms
📐 {{area}} sqft

💰 *Price: {{price}}*

📍 Premium location in Tulum

Interested in scheduling a viewing?
Contact me for more information.`,
  },
  {
    id: "default-2", 
    title: "Instagram Promotion",
    platform: "instagram" as const,
    content: `🌴 Your paradise in Tulum awaits

Dream {{propertyType}} featuring:
🛏️ {{bedrooms}} bedrooms
🛁 {{bathrooms}} bathrooms
📐 {{area}} sqft

📍 {{location}}
💰 {{price}}

DM us for more information!

#TulumRealEstate #TulumProperties #TulumLife #InvestInTulum #MexicanParadise`,
  },
  {
    id: "default-3",
    title: "Open House - Facebook",
    platform: "facebook" as const,
    content: `🎉 OPEN HOUSE this weekend!

Come visit this incredible property:

🏡 {{propertyType}}
📍 {{location}}
🛏️ {{bedrooms}} bedrooms
🛁 {{bathrooms}} bathrooms
📐 {{area}} sqft
💰 {{price}}

📅 Saturday & Sunday
🕐 10:00 AM - 4:00 PM

Don't miss it! RSVP now.`,
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
  
  // Link tracker state
  const [showLinkTracker, setShowLinkTracker] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkPlatform, setNewLinkPlatform] = useState<string>("");
  
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
  
  const { data: properties, isLoading: propertiesLoading } = useQuery<PropertyCatalogItem[]>({
    queryKey: ["/api/external-seller/properties", { 
      type: propertySourceType === "condo" ? "condo" : propertySourceType === "house" ? "house" : undefined,
      condominiumId: propertySourceType === "condo" ? selectedCondominiumId : undefined,
      search: propertySearchQuery,
    }],
    enabled: propertySourceType !== "manual",
  });
  
  // Tracking links query
  const { data: trackingLinks } = useQuery<TrackingLink[]>({
    queryKey: ["/api/external-seller/tracking-links"],
    enabled: showLinkTracker,
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
  // Tracking link mutation
  const createTrackingLinkMutation = useMutation({
    mutationFn: async (data: { targetUrl: string; unitId?: string; platform?: string }) => {
      const res = await apiRequest("POST", "/api/external-seller/tracking-links", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/tracking-links"] });
      navigator.clipboard.writeText(data.trackingUrl);
      toast({ 
        title: lang === "es" ? "Link creado y copiado" : "Link created and copied",
        description: data.trackingUrl,
      });
      setNewLinkUrl("");
    },
    onError: () => {
      toast({ title: lang === "es" ? "Error al crear link" : "Error creating link", variant: "destructive" });
    },
  });
  
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
            ? "No tienes créditos de IA disponibles."
            : "You have no AI credits available.",
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
      setAiPropertyInfo({
        propertyType: property.propertyType || property.title || "",
        location: property.zone || property.city || "",
        bedrooms: property.bedrooms?.toString() || "",
        bathrooms: property.bathrooms?.toString() || "",
        price: property.price ? `$${Number(property.price).toLocaleString()} ${property.currency}` : "",
        area: property.area?.toString() || "",
        address: property.address || "",
        unitId: property.id,
      });
    }
  };
  
  // Apply template with property data
  const applyTemplateWithProperty = (template: typeof DEFAULT_TEMPLATES_ES[0]) => {
    let content = template.content;
    content = content.replace(/\{\{propertyType\}\}/g, aiPropertyInfo.propertyType || "_____");
    content = content.replace(/\{\{location\}\}/g, aiPropertyInfo.location || "_____");
    content = content.replace(/\{\{bedrooms\}\}/g, aiPropertyInfo.bedrooms || "_____");
    content = content.replace(/\{\{bathrooms\}\}/g, aiPropertyInfo.bathrooms || "_____");
    content = content.replace(/\{\{price\}\}/g, aiPropertyInfo.price || "_____");
    content = content.replace(/\{\{area\}\}/g, aiPropertyInfo.area || "_____");
    content = content.replace(/\{\{address\}\}/g, aiPropertyInfo.address || "_____");
    
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
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
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
        <TabsList className="w-full grid grid-cols-3 h-12 rounded-none border-b">
          <TabsTrigger value="templates" className="gap-1 text-xs sm:text-sm" data-testid="tab-templates">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t.tabTemplates}</span>
          </TabsTrigger>
          <TabsTrigger value="generator" className="gap-1 text-xs sm:text-sm" data-testid="tab-generator">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">{t.tabGenerator}</span>
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
          {/* AI Credits Header */}
          {!aiCreditsDisabled && agencyConfig?.aiCreditBalance !== null && (
            <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg p-3 border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/20 rounded-full">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {lang === "es" ? "Créditos de IA" : "AI Credits"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lang === "es" ? "Disponibles" : "Available"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {agencyConfig?.aiCreditBalance ?? 0}
                </p>
                {agencyConfig?.monthlyUsed > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {lang === "es" ? "Usados este mes:" : "Used this month:"} {agencyConfig?.monthlyUsed}
                  </p>
                )}
              </div>
            </div>
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
                  
                  {/* Condo Selection */}
                  {propertySourceType === "condo" && (
                    <Select value={selectedCondominiumId} onValueChange={setSelectedCondominiumId}>
                      <SelectTrigger data-testid="select-condominium">
                        <SelectValue placeholder={lang === "es" ? "Seleccionar condominio..." : "Select condominium..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {condominiums?.map(condo => (
                          <SelectItem key={condo.id} value={condo.id}>
                            {condo.name} {condo.zone && `- ${condo.zone}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              {/* AI Generator Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    {t.tabGenerator}
                  </CardTitle>
                  <CardDescription>
                    {lang === "es" 
                      ? "Genera contenido para redes sociales con inteligencia artificial"
                      : "Generate social media content with artificial intelligence"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Property Source Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      {lang === "es" ? "Fuente de Datos" : "Data Source"}
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={propertySourceType === "condo" ? "default" : "outline"}
                        className="flex-col h-auto py-3 gap-1"
                        onClick={() => {
                          setPropertySourceType("condo");
                          setSelectedPropertyId("");
                        }}
                        data-testid="button-source-condo"
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
                        data-testid="button-source-house"
                      >
                        <Home className="h-5 w-5" />
                        <span className="text-xs">{lang === "es" ? "Casa" : "House"}</span>
                      </Button>
                      <Button
                        variant={propertySourceType === "manual" ? "default" : "outline"}
                        className="flex-col h-auto py-3 gap-1"
                        onClick={() => setPropertySourceType("manual")}
                        data-testid="button-source-manual"
                      >
                        <Pencil className="h-5 w-5" />
                        <span className="text-xs">{lang === "es" ? "Manual" : "Manual"}</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Condo Selection */}
                  {propertySourceType === "condo" && (
                    <Select value={selectedCondominiumId} onValueChange={setSelectedCondominiumId}>
                      <SelectTrigger data-testid="select-ai-condominium">
                        <SelectValue placeholder={lang === "es" ? "Seleccionar condominio..." : "Select condominium..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {condominiums?.map(condo => (
                          <SelectItem key={condo.id} value={condo.id}>
                            {condo.name} {condo.zone && `- ${condo.zone}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  
                  {/* Platform selection */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">{t.platform}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {PLATFORMS.map(p => (
                        <Button
                          key={p.value}
                          variant={aiPlatform === p.value ? "default" : "outline"}
                          className="flex-col h-auto py-3 gap-1"
                          onClick={() => setAiPlatform(p.value as any)}
                          data-testid={`button-ai-platform-${p.value}`}
                        >
                          <p.icon className={`h-5 w-5 ${aiPlatform === p.value ? "text-current" : p.color}`} />
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
                  
                  {/* Property info (manual or editable) */}
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
                  
                  <Button 
                    onClick={handleGenerateAI}
                    disabled={generateMutation.isPending || !aiPropertyInfo.propertyType}
                    className="w-full"
                    data-testid="button-generate-ai"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {t.generating}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t.generateContent}
                        {agencyConfig?.aiCreditBalance !== null && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            -1 {lang === "es" ? "crédito" : "credit"}
                          </Badge>
                        )}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              {/* Generated content */}
              {generatedContent && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{t.generatedContent}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="whitespace-pre-wrap text-sm">{generatedContent.content}</p>
                    </div>
                    {generatedContent.hashtags && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        {generatedContent.hashtags}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="gap-2 flex-col sm:flex-row">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          generatedContent.content + 
                          (generatedContent.hashtags ? `\n\n${generatedContent.hashtags}` : "")
                        );
                        toast({ title: t.copied });
                      }}
                      data-testid="button-copy-generated"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {t.copyToClipboard}
                    </Button>
                    <Button 
                      className="w-full sm:w-auto"
                      onClick={saveGeneratedAsTemplate}
                      data-testid="button-save-generated"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {t.saveAsTemplate}
                    </Button>
                  </CardFooter>
                </Card>
              )}
              
              {/* Link Tracking Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Link className="h-5 w-5" />
                      {lang === "es" ? "Links Rastreables" : "Trackable Links"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLinkTracker(!showLinkTracker)}
                      data-testid="button-toggle-link-tracker"
                    >
                      {showLinkTracker ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </div>
                  <CardDescription>
                    {lang === "es" 
                      ? "Crea links que registran cuando un cliente los visita"
                      : "Create links that track when a client visits them"}
                  </CardDescription>
                </CardHeader>
                {showLinkTracker && (
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder={lang === "es" ? "URL de destino (ej: link de propiedad)" : "Target URL (e.g., property link)"}
                        value={newLinkUrl}
                        onChange={e => setNewLinkUrl(e.target.value)}
                        data-testid="input-new-link-url"
                      />
                      <Button
                        onClick={() => createTrackingLinkMutation.mutate({
                          targetUrl: newLinkUrl,
                          unitId: selectedPropertyId || undefined,
                          platform: newLinkPlatform || undefined,
                        })}
                        disabled={!newLinkUrl || createTrackingLinkMutation.isPending}
                        data-testid="button-create-link"
                      >
                        {createTrackingLinkMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {trackingLinks && trackingLinks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          {lang === "es" ? "Links recientes" : "Recent links"}
                        </p>
                        {trackingLinks.slice(0, 5).map(link => (
                          <div 
                            key={link.id} 
                            className="flex items-center justify-between bg-muted/50 rounded-lg p-2"
                          >
                            <div className="flex-1 min-w-0 mr-2">
                              <p className="text-xs font-mono truncate">{link.trackingUrl}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {link.targetUrl}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {link.clickCount} {lang === "es" ? "clicks" : "clicks"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  navigator.clipboard.writeText(link.trackingUrl);
                                  toast({ title: t.copied });
                                }}
                                data-testid={`button-copy-link-${link.id}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
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
      </Tabs>
      
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
