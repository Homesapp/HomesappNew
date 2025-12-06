import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Users,
  Kanban,
  Link2,
  LayoutGrid,
  Bell,
  FileText,
  Target,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Loader2,
  Save,
  RefreshCw,
  Mail,
  Phone,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  MapPin,
  Percent,
  DollarSign,
  Settings,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Send,
  X,
  GripVertical,
  Palette,
} from "lucide-react";
import type { ExternalAgency, ExternalAgencySettings, ExternalAgencyMessageTemplate, ExternalAgencyDocument, ExternalAgencyInvitation } from "@shared/schema";
import { FeedbackList } from "@/components/FeedbackList";
import { PhotoMigrationWidget } from "@/components/PhotoMigrationWidget";

interface SettingsSection {
  id: string;
  title: string;
  titleEn: string;
  icon: typeof Building2;
  description: string;
  descriptionEn: string;
}

const sections: SettingsSection[] = [
  {
    id: "profile",
    title: "Perfil de Agencia",
    titleEn: "Agency Profile",
    icon: Building2,
    description: "Nombre, logo, contacto y datos fiscales",
    descriptionEn: "Name, logo, contact and fiscal data",
  },
  {
    id: "team",
    title: "Equipo",
    titleEn: "Team",
    icon: Users,
    description: "Gestión de agentes e invitaciones",
    descriptionEn: "Agent management and invitations",
  },
  {
    id: "pipeline",
    title: "Leads y Pipeline",
    titleEn: "Leads & Pipeline",
    icon: Kanban,
    description: "Columnas del Kanban y asignación",
    descriptionEn: "Kanban columns and assignment",
  },
  {
    id: "links",
    title: "Links Públicos",
    titleEn: "Public Links",
    icon: Link2,
    description: "Links de captura y formularios",
    descriptionEn: "Capture links and forms",
  },
  {
    id: "catalog",
    title: "Catálogo y Zonas",
    titleEn: "Catalog & Zones",
    icon: LayoutGrid,
    description: "Preferencias de visualización",
    descriptionEn: "Display preferences",
  },
  {
    id: "notifications",
    title: "Notificaciones",
    titleEn: "Notifications",
    icon: Bell,
    description: "Email y WhatsApp",
    descriptionEn: "Email and WhatsApp",
  },
  {
    id: "templates",
    title: "Plantillas",
    titleEn: "Templates",
    icon: FileText,
    description: "Mensajes y documentos",
    descriptionEn: "Messages and documents",
  },
  {
    id: "commissions",
    title: "Comisiones",
    titleEn: "Commissions",
    icon: Target,
    description: "Tasas y objetivos mensuales",
    descriptionEn: "Rates and monthly targets",
  },
  {
    id: "feedback",
    title: "Feedback de Usuarios",
    titleEn: "User Feedback",
    icon: Mail,
    description: "Ver comentarios y sugerencias de usuarios",
    descriptionEn: "View user comments and suggestions",
  },
  {
    id: "migration",
    title: "Migración de Fotos HD",
    titleEn: "HD Photo Migration",
    icon: RefreshCw,
    description: "Progreso de migración de fotos de alta resolución",
    descriptionEn: "HD photo migration progress",
  },
];

const profileSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  slug: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  operationType: z.enum(["rent", "sale", "both"]).default("both"),
  fiscalRazonSocial: z.string().optional(),
  fiscalRfc: z.string().optional(),
  fiscalDireccion: z.string().optional(),
  fiscalRegimen: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const pipelineSchema = z.object({
  leadAssignmentMode: z.enum(["admin_only", "round_robin", "by_link_owner", "manual"]).default("admin_only"),
  defaultLeadView: z.enum(["my_leads", "all_leads"]).default("my_leads"),
});

type PipelineFormValues = z.infer<typeof pipelineSchema>;

const catalogSchema = z.object({
  catalogDefaultView: z.enum(["grid", "list"]).default("grid"),
  catalogDefaultSort: z.enum(["date_desc", "date_asc", "price_asc", "price_desc"]).default("date_desc"),
});

type CatalogFormValues = z.infer<typeof catalogSchema>;

const notificationsSchema = z.object({
  notificationEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  notificationWhatsapp: z.string().optional(),
  newLead: z.boolean().default(true),
  leadReassigned: z.boolean().default(true),
  appointmentConfirmed: z.boolean().default(true),
  appointmentCancelled: z.boolean().default(true),
  offerAccepted: z.boolean().default(true),
  offerRejected: z.boolean().default(false),
  contractSigned: z.boolean().default(true),
  paymentReceived: z.boolean().default(true),
});

type NotificationsFormValues = z.infer<typeof notificationsSchema>;

const commissionsSchema = z.object({
  standardCommissionRate: z.number().min(0).max(100).default(5),
  closingTarget: z.number().min(0).default(0),
  commissionTarget: z.number().min(0).default(0),
});

type CommissionsFormValues = z.infer<typeof commissionsSchema>;

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().optional(),
  role: z.enum(["external_agency_admin", "external_agency_seller"]).default("external_agency_seller"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

const templateSchema = z.object({
  category: z.string().min(1, "Categoría requerida"),
  title: z.string().min(1, "Título requerido"),
  content: z.string().min(1, "Contenido requerido"),
  language: z.enum(["es", "en"]).default("es"),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const documentSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  url: z.string().url("URL inválida"),
  category: z.string().optional(),
  description: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function ExternalAgencySettingsPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("profile");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExternalAgencyMessageTemplate | null>(null);
  const [editingDocument, setEditingDocument] = useState<ExternalAgencyDocument | null>(null);

  const { data: agency, isLoading: agencyLoading } = useQuery<ExternalAgency>({
    queryKey: ["/api/external/agency"],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<ExternalAgencySettings>({
    queryKey: ["/api/external/agency/settings"],
    enabled: !!agency?.id,
  });

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/external/agency/team"],
    enabled: !!agency?.id,
  });

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<ExternalAgencyInvitation[]>({
    queryKey: ["/api/external/agency/invitations"],
    enabled: !!agency?.id,
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery<ExternalAgencyMessageTemplate[]>({
    queryKey: ["/api/external/agency/templates"],
    enabled: !!agency?.id,
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery<ExternalAgencyDocument[]>({
    queryKey: ["/api/external/agency/documents"],
    enabled: !!agency?.id,
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      slug: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      website: "",
      operationType: "both",
      fiscalRazonSocial: "",
      fiscalRfc: "",
      fiscalDireccion: "",
      fiscalRegimen: "",
      facebook: "",
      instagram: "",
      linkedin: "",
    },
  });

  const pipelineForm = useForm<PipelineFormValues>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: {
      leadAssignmentMode: "admin_only",
      defaultLeadView: "my_leads",
    },
  });

  const catalogForm = useForm<CatalogFormValues>({
    resolver: zodResolver(catalogSchema),
    defaultValues: {
      catalogDefaultView: "grid",
      catalogDefaultSort: "date_desc",
    },
  });

  const notificationsForm = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      notificationEmail: "",
      notificationWhatsapp: "",
      newLead: true,
      leadReassigned: true,
      appointmentConfirmed: true,
      appointmentCancelled: true,
      offerAccepted: true,
      offerRejected: false,
      contractSigned: true,
      paymentReceived: true,
    },
  });

  const commissionsForm = useForm<CommissionsFormValues>({
    resolver: zodResolver(commissionsSchema),
    defaultValues: {
      standardCommissionRate: 5,
      closingTarget: 0,
      commissionTarget: 0,
    },
  });

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "external_agency_seller",
    },
  });

  const templateForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      category: "",
      title: "",
      content: "",
      language: "es",
    },
  });

  const documentForm = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: "",
      url: "",
      category: "",
      description: "",
    },
  });

  useEffect(() => {
    if (agency) {
      profileForm.reset({
        name: agency.name || "",
        slug: agency.slug || "",
        contactName: agency.contactName || "",
        contactEmail: agency.contactEmail || "",
        contactPhone: agency.contactPhone || "",
        website: settings?.website || "",
        operationType: (settings?.operationType as "rent" | "sale" | "both") || "both",
        fiscalRazonSocial: settings?.fiscalData?.razonSocial || "",
        fiscalRfc: settings?.fiscalData?.rfc || "",
        fiscalDireccion: settings?.fiscalData?.direccionFiscal || "",
        fiscalRegimen: settings?.fiscalData?.regimenFiscal || "",
        facebook: settings?.socialMedia?.facebook || "",
        instagram: settings?.socialMedia?.instagram || "",
        linkedin: settings?.socialMedia?.linkedin || "",
      });
    }
  }, [agency, settings]);

  useEffect(() => {
    if (settings) {
      pipelineForm.reset({
        leadAssignmentMode: (settings.leadAssignmentMode as PipelineFormValues["leadAssignmentMode"]) || "admin_only",
        defaultLeadView: (settings.defaultLeadView as PipelineFormValues["defaultLeadView"]) || "my_leads",
      });
      catalogForm.reset({
        catalogDefaultView: (settings.catalogDefaultView as CatalogFormValues["catalogDefaultView"]) || "grid",
        catalogDefaultSort: (settings.catalogDefaultSort as CatalogFormValues["catalogDefaultSort"]) || "date_desc",
      });
      notificationsForm.reset({
        notificationEmail: settings.notificationEmail || "",
        notificationWhatsapp: settings.notificationWhatsapp || "",
        newLead: settings.notificationEvents?.newLead ?? true,
        leadReassigned: settings.notificationEvents?.leadReassigned ?? true,
        appointmentConfirmed: settings.notificationEvents?.appointmentConfirmed ?? true,
        appointmentCancelled: settings.notificationEvents?.appointmentCancelled ?? true,
        offerAccepted: settings.notificationEvents?.offerAccepted ?? true,
        offerRejected: settings.notificationEvents?.offerRejected ?? false,
        contractSigned: settings.notificationEvents?.contractSigned ?? true,
        paymentReceived: settings.notificationEvents?.paymentReceived ?? true,
      });
      commissionsForm.reset({
        standardCommissionRate: settings.standardCommissionRate ? settings.standardCommissionRate / 100 : 5,
        closingTarget: settings.monthlyTargets?.closingTarget || 0,
        commissionTarget: settings.monthlyTargets?.commissionTarget || 0,
      });
    }
  }, [settings]);

  const saveProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const agencyData = {
        name: data.name,
        slug: data.slug,
        contactName: data.contactName,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone,
      };
      const settingsData = {
        website: data.website || null,
        operationType: data.operationType,
        fiscalData: {
          razonSocial: data.fiscalRazonSocial,
          rfc: data.fiscalRfc,
          direccionFiscal: data.fiscalDireccion,
          regimenFiscal: data.fiscalRegimen,
        },
        socialMedia: {
          facebook: data.facebook,
          instagram: data.instagram,
          linkedin: data.linkedin,
        },
      };
      await apiRequest("PATCH", "/api/external/agency", agencyData);
      await apiRequest("PATCH", "/api/external/agency/settings", settingsData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/agency"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external/agency/settings"] });
      toast({
        title: language === "es" ? "Perfil actualizado" : "Profile updated",
        description: language === "es" ? "Los cambios se han guardado correctamente" : "Changes have been saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const savePipelineMutation = useMutation({
    mutationFn: async (data: PipelineFormValues) => {
      await apiRequest("PATCH", "/api/external/agency/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/agency/settings"] });
      toast({
        title: language === "es" ? "Pipeline actualizado" : "Pipeline updated",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const saveCatalogMutation = useMutation({
    mutationFn: async (data: CatalogFormValues) => {
      await apiRequest("PATCH", "/api/external/agency/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/agency/settings"] });
      toast({
        title: language === "es" ? "Catálogo actualizado" : "Catalog updated",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const saveNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationsFormValues) => {
      await apiRequest("PATCH", "/api/external/agency/settings", {
        notificationEmail: data.notificationEmail || null,
        notificationWhatsapp: data.notificationWhatsapp || null,
        notificationEvents: {
          newLead: data.newLead,
          leadReassigned: data.leadReassigned,
          appointmentConfirmed: data.appointmentConfirmed,
          appointmentCancelled: data.appointmentCancelled,
          offerAccepted: data.offerAccepted,
          offerRejected: data.offerRejected,
          contractSigned: data.contractSigned,
          paymentReceived: data.paymentReceived,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/agency/settings"] });
      toast({
        title: language === "es" ? "Notificaciones actualizadas" : "Notifications updated",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const saveCommissionsMutation = useMutation({
    mutationFn: async (data: CommissionsFormValues) => {
      await apiRequest("PATCH", "/api/external/agency/settings", {
        standardCommissionRate: Math.round(data.standardCommissionRate * 100),
        monthlyTargets: {
          closingTarget: data.closingTarget,
          commissionTarget: data.commissionTarget,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/agency/settings"] });
      toast({
        title: language === "es" ? "Comisiones actualizadas" : "Commissions updated",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (data: InviteFormValues) => {
      await apiRequest("POST", "/api/external/agency/invitations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/agency/invitations"] });
      setInviteDialogOpen(false);
      inviteForm.reset();
      toast({
        title: language === "es" ? "Invitación enviada" : "Invitation sent",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/external/agency/invitations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/agency/invitations"] });
      toast({
        title: language === "es" ? "Invitación cancelada" : "Invitation cancelled",
      });
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      if (editingTemplate) {
        await apiRequest("PATCH", `/api/external/agency/templates/${editingTemplate.id}`, data);
      } else {
        await apiRequest("POST", "/api/external/agency/templates", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/agency/templates"] });
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      templateForm.reset();
      toast({
        title: language === "es" ? "Plantilla guardada" : "Template saved",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/external/agency/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/agency/templates"] });
      toast({
        title: language === "es" ? "Plantilla eliminada" : "Template deleted",
      });
    },
  });

  const saveDocumentMutation = useMutation({
    mutationFn: async (data: DocumentFormValues) => {
      if (editingDocument) {
        await apiRequest("PATCH", `/api/external/agency/documents/${editingDocument.id}`, data);
      } else {
        await apiRequest("POST", "/api/external/agency/documents", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/agency/documents"] });
      setDocumentDialogOpen(false);
      setEditingDocument(null);
      documentForm.reset();
      toast({
        title: language === "es" ? "Documento guardado" : "Document saved",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/external/agency/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/agency/documents"] });
      toast({
        title: language === "es" ? "Documento eliminado" : "Document deleted",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: language === "es" ? "Copiado" : "Copied",
      description: text,
    });
  };

  if (agencyLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {language === "es" ? "No se encontró la agencia" : "Agency not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderProfileSection = () => (
    <Form {...profileForm}>
      <form onSubmit={profileForm.handleSubmit((data) => saveProfileMutation.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {language === "es" ? "Información General" : "General Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Nombre de la Agencia" : "Agency Name"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-agency-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (URL)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="mi-agencia" data-testid="input-agency-slug" />
                    </FormControl>
                    <FormDescription>
                      {language === "es" ? "Identificador único para URLs públicas" : "Unique identifier for public URLs"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={profileForm.control}
              name="operationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "es" ? "Tipo de Operación" : "Operation Type"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-operation-type">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="rent">{language === "es" ? "Solo Renta" : "Rent Only"}</SelectItem>
                      <SelectItem value="sale">{language === "es" ? "Solo Venta" : "Sale Only"}</SelectItem>
                      <SelectItem value="both">{language === "es" ? "Renta y Venta" : "Rent & Sale"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              {language === "es" ? "Contacto" : "Contact"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={profileForm.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Nombre de Contacto" : "Contact Name"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-contact-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Teléfono" : "Phone"}</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" data-testid="input-contact-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-contact-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Sitio Web" : "Website"}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://" data-testid="input-website" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {language === "es" ? "Redes Sociales" : "Social Media"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={profileForm.control}
                name="facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" /> Facebook
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://facebook.com/..." data-testid="input-facebook" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" /> Instagram
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="@usuario" data-testid="input-instagram" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" /> LinkedIn
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://linkedin.com/..." data-testid="input-linkedin" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {language === "es" ? "Datos Fiscales" : "Fiscal Data"}
            </CardTitle>
            <CardDescription>
              {language === "es" ? "Información para facturación" : "Billing information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={profileForm.control}
                name="fiscalRazonSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Razón Social" : "Legal Name"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-razon-social" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="fiscalRfc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RFC</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-rfc" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="fiscalDireccion"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{language === "es" ? "Dirección Fiscal" : "Fiscal Address"}</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-fiscal-address" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="fiscalRegimen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Régimen Fiscal" : "Tax Regime"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-regimen" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveProfileMutation.isPending} data-testid="button-save-profile">
            {saveProfileMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {language === "es" ? "Guardar Cambios" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderTeamSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === "es" ? "Miembros del Equipo" : "Team Members"}
              </CardTitle>
              <CardDescription>
                {language === "es" ? "Gestiona los agentes de tu agencia" : "Manage your agency agents"}
              </CardDescription>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-invite-agent">
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "es" ? "Invitar Agente" : "Invite Agent"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === "es" ? "Invitar Nuevo Agente" : "Invite New Agent"}</DialogTitle>
                  <DialogDescription>
                    {language === "es" 
                      ? "Envía una invitación por email para unirse a tu agencia" 
                      : "Send an email invitation to join your agency"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...inviteForm}>
                  <form onSubmit={inviteForm.handleSubmit((data) => sendInviteMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={inviteForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" data-testid="input-invite-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={inviteForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Nombre (opcional)" : "Name (optional)"}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-invite-name" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={inviteForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Rol" : "Role"}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-invite-role">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="external_agency_seller">
                                {language === "es" ? "Agente" : "Agent"}
                              </SelectItem>
                              <SelectItem value="external_agency_admin">
                                {language === "es" ? "Administrador" : "Administrator"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={sendInviteMutation.isPending} data-testid="button-send-invite">
                        {sendInviteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        {language === "es" ? "Enviar Invitación" : "Send Invitation"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {teamLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === "es" ? "No hay miembros en el equipo" : "No team members"}
            </div>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`team-member-${member.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {member.firstName?.[0]}{member.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{member.firstName} {member.lastName}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === "external_agency_admin" ? "default" : "secondary"}>
                      {member.role === "external_agency_admin" 
                        ? (language === "es" ? "Admin" : "Admin")
                        : (language === "es" ? "Agente" : "Agent")}
                    </Badge>
                    <Badge variant={member.isActive ? "default" : "outline"}>
                      {member.isActive 
                        ? (language === "es" ? "Activo" : "Active")
                        : (language === "es" ? "Inactivo" : "Inactive")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {language === "es" ? "Invitaciones Pendientes" : "Pending Invitations"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invitationsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : invitations.filter((i) => !i.acceptedAt).length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {language === "es" ? "No hay invitaciones pendientes" : "No pending invitations"}
            </div>
          ) : (
            <div className="space-y-2">
              {invitations
                .filter((i) => !i.acceptedAt)
                .map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`invitation-${invitation.id}`}
                  >
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {invitation.name || (language === "es" ? "Sin nombre" : "No name")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {invitation.role === "external_agency_admin" 
                          ? (language === "es" ? "Admin" : "Admin")
                          : (language === "es" ? "Agente" : "Agent")}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                        data-testid={`button-cancel-invitation-${invitation.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderPipelineSection = () => (
    <Form {...pipelineForm}>
      <form onSubmit={pipelineForm.handleSubmit((data) => savePipelineMutation.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Kanban className="h-5 w-5" />
              {language === "es" ? "Configuración de Pipeline" : "Pipeline Configuration"}
            </CardTitle>
            <CardDescription>
              {language === "es" 
                ? "Define cómo se asignan y visualizan los leads" 
                : "Define how leads are assigned and displayed"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={pipelineForm.control}
              name="leadAssignmentMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "es" ? "Modo de Asignación de Leads" : "Lead Assignment Mode"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-assignment-mode">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin_only">
                        {language === "es" ? "Solo Admin (todos van al admin)" : "Admin Only (all go to admin)"}
                      </SelectItem>
                      <SelectItem value="round_robin">
                        {language === "es" ? "Round Robin (rotación entre agentes)" : "Round Robin (rotate between agents)"}
                      </SelectItem>
                      <SelectItem value="by_link_owner">
                        {language === "es" ? "Por Dueño del Link (al creador del link)" : "By Link Owner (to link creator)"}
                      </SelectItem>
                      <SelectItem value="manual">
                        {language === "es" ? "Manual (asignación manual)" : "Manual (manual assignment)"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {language === "es" 
                      ? "Determina cómo se asignan automáticamente los nuevos leads" 
                      : "Determines how new leads are automatically assigned"}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={pipelineForm.control}
              name="defaultLeadView"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "es" ? "Vista por Defecto" : "Default View"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-default-view">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="my_leads">
                        {language === "es" ? "Mis Leads" : "My Leads"}
                      </SelectItem>
                      <SelectItem value="all_leads">
                        {language === "es" ? "Todos los Leads" : "All Leads"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={savePipelineMutation.isPending} data-testid="button-save-pipeline">
            {savePipelineMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {language === "es" ? "Guardar Cambios" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderLinksSection = () => {
    const baseUrl = window.location.origin;
    const leadCaptureLink = `${baseUrl}/r/${agency.slug || agency.id}`;
    const ownerIntakeLink = `${baseUrl}/owner-intake/${agency.slug || agency.id}`;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              {language === "es" ? "Links de Captura" : "Capture Links"}
            </CardTitle>
            <CardDescription>
              {language === "es" 
                ? "Links públicos para captura de leads y propiedades" 
                : "Public links for lead and property capture"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{language === "es" ? "Link de Registro de Leads" : "Lead Registration Link"}</Label>
              <div className="flex gap-2">
                <Input value={leadCaptureLink} readOnly className="font-mono text-sm" data-testid="input-lead-link" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(leadCaptureLink)}
                  data-testid="button-copy-lead-link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(leadCaptureLink, "_blank")}
                  data-testid="button-open-lead-link"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === "es" 
                  ? "Comparte este link para que los interesados se registren" 
                  : "Share this link for interested parties to register"}
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>{language === "es" ? "Link de Intake de Propietarios" : "Owner Intake Link"}</Label>
              <div className="flex gap-2">
                <Input value={ownerIntakeLink} readOnly className="font-mono text-sm" data-testid="input-owner-link" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(ownerIntakeLink)}
                  data-testid="button-copy-owner-link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(ownerIntakeLink, "_blank")}
                  data-testid="button-open-owner-link"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === "es" 
                  ? "Link para que propietarios envíen información de sus propiedades" 
                  : "Link for owners to submit their property information"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCatalogSection = () => (
    <Form {...catalogForm}>
      <form onSubmit={catalogForm.handleSubmit((data) => saveCatalogMutation.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              {language === "es" ? "Preferencias de Catálogo" : "Catalog Preferences"}
            </CardTitle>
            <CardDescription>
              {language === "es" 
                ? "Configura la visualización por defecto del catálogo" 
                : "Configure default catalog display settings"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={catalogForm.control}
              name="catalogDefaultView"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "es" ? "Vista por Defecto" : "Default View"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-catalog-view">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="grid">
                        {language === "es" ? "Cuadrícula" : "Grid"}
                      </SelectItem>
                      <SelectItem value="list">
                        {language === "es" ? "Lista" : "List"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={catalogForm.control}
              name="catalogDefaultSort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "es" ? "Ordenamiento por Defecto" : "Default Sorting"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-catalog-sort">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="date_desc">
                        {language === "es" ? "Más recientes primero" : "Newest first"}
                      </SelectItem>
                      <SelectItem value="date_asc">
                        {language === "es" ? "Más antiguos primero" : "Oldest first"}
                      </SelectItem>
                      <SelectItem value="price_asc">
                        {language === "es" ? "Precio: menor a mayor" : "Price: low to high"}
                      </SelectItem>
                      <SelectItem value="price_desc">
                        {language === "es" ? "Precio: mayor a menor" : "Price: high to low"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveCatalogMutation.isPending} data-testid="button-save-catalog">
            {saveCatalogMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {language === "es" ? "Guardar Cambios" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderNotificationsSection = () => (
    <Form {...notificationsForm}>
      <form onSubmit={notificationsForm.handleSubmit((data) => saveNotificationsMutation.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {language === "es" ? "Canales de Notificación" : "Notification Channels"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={notificationsForm.control}
                name="notificationEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Email para Notificaciones" : "Notification Email"}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-notification-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={notificationsForm.control}
                name="notificationWhatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+52 1 984 123 4567" data-testid="input-notification-whatsapp" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === "es" ? "Eventos" : "Events"}</CardTitle>
            <CardDescription>
              {language === "es" 
                ? "Selecciona qué eventos quieres recibir" 
                : "Select which events you want to receive"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "newLead", label: language === "es" ? "Nuevo lead" : "New lead" },
              { name: "leadReassigned", label: language === "es" ? "Lead reasignado" : "Lead reassigned" },
              { name: "appointmentConfirmed", label: language === "es" ? "Cita confirmada" : "Appointment confirmed" },
              { name: "appointmentCancelled", label: language === "es" ? "Cita cancelada" : "Appointment cancelled" },
              { name: "offerAccepted", label: language === "es" ? "Oferta aceptada" : "Offer accepted" },
              { name: "offerRejected", label: language === "es" ? "Oferta rechazada" : "Offer rejected" },
              { name: "contractSigned", label: language === "es" ? "Contrato firmado" : "Contract signed" },
              { name: "paymentReceived", label: language === "es" ? "Pago recibido" : "Payment received" },
            ].map((event) => (
              <FormField
                key={event.name}
                control={notificationsForm.control}
                name={event.name as keyof NotificationsFormValues}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">{event.label}</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value as boolean}
                        onCheckedChange={field.onChange}
                        data-testid={`switch-${event.name}`}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveNotificationsMutation.isPending} data-testid="button-save-notifications">
            {saveNotificationsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {language === "es" ? "Guardar Cambios" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderTemplatesSection = () => {
    const templateCategories = [
      { value: "first_contact", label: language === "es" ? "Primer Contacto" : "First Contact" },
      { value: "follow_up", label: language === "es" ? "Seguimiento" : "Follow Up" },
      { value: "appointment", label: language === "es" ? "Cita" : "Appointment" },
      { value: "offer", label: language === "es" ? "Oferta" : "Offer" },
      { value: "closing", label: language === "es" ? "Cierre" : "Closing" },
    ];

    const documentCategories = [
      { value: "checklist", label: "Checklist" },
      { value: "contract", label: language === "es" ? "Contrato" : "Contract" },
      { value: "guide", label: language === "es" ? "Guía" : "Guide" },
      { value: "other", label: language === "es" ? "Otro" : "Other" },
    ];

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {language === "es" ? "Plantillas de Mensajes" : "Message Templates"}
                </CardTitle>
                <CardDescription>
                  {language === "es" 
                    ? "Mensajes predefinidos para comunicación con clientes" 
                    : "Predefined messages for client communication"}
                </CardDescription>
              </div>
              <Dialog open={templateDialogOpen} onOpenChange={(open) => {
                setTemplateDialogOpen(open);
                if (!open) {
                  setEditingTemplate(null);
                  templateForm.reset();
                }
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-template">
                    <Plus className="h-4 w-4 mr-2" />
                    {language === "es" ? "Nueva Plantilla" : "New Template"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTemplate 
                        ? (language === "es" ? "Editar Plantilla" : "Edit Template")
                        : (language === "es" ? "Nueva Plantilla" : "New Template")}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...templateForm}>
                    <form onSubmit={templateForm.handleSubmit((data) => saveTemplateMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={templateForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === "es" ? "Categoría" : "Category"}</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-template-category">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {templateCategories.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={templateForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === "es" ? "Idioma" : "Language"}</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-template-language">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="es">Español</SelectItem>
                                  <SelectItem value="en">English</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={templateForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "es" ? "Título" : "Title"}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-template-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={templateForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "es" ? "Contenido" : "Content"}</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={6} data-testid="input-template-content" />
                            </FormControl>
                            <FormDescription>
                              {language === "es" 
                                ? "Usa {{nombre}}, {{propiedad}}, {{precio}} como variables" 
                                : "Use {{name}}, {{property}}, {{price}} as variables"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={saveTemplateMutation.isPending} data-testid="button-save-template">
                          {saveTemplateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {language === "es" ? "Guardar" : "Save"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {templatesLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === "es" ? "No hay plantillas configuradas" : "No templates configured"}
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`template-${template.id}`}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{template.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{template.content}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{template.category}</Badge>
                      <Badge variant="secondary">{template.language?.toUpperCase()}</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingTemplate(template);
                          templateForm.reset({
                            category: template.category,
                            title: template.title,
                            content: template.content,
                            language: template.language as "es" | "en",
                          });
                          setTemplateDialogOpen(true);
                        }}
                        data-testid={`button-edit-template-${template.id}`}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                        data-testid={`button-delete-template-${template.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  {language === "es" ? "Documentos y Enlaces" : "Documents & Links"}
                </CardTitle>
                <CardDescription>
                  {language === "es" 
                    ? "Links a documentos importantes para el equipo" 
                    : "Links to important documents for the team"}
                </CardDescription>
              </div>
              <Dialog open={documentDialogOpen} onOpenChange={(open) => {
                setDocumentDialogOpen(open);
                if (!open) {
                  setEditingDocument(null);
                  documentForm.reset();
                }
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-document">
                    <Plus className="h-4 w-4 mr-2" />
                    {language === "es" ? "Nuevo Documento" : "New Document"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingDocument 
                        ? (language === "es" ? "Editar Documento" : "Edit Document")
                        : (language === "es" ? "Nuevo Documento" : "New Document")}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...documentForm}>
                    <form onSubmit={documentForm.handleSubmit((data) => saveDocumentMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={documentForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "es" ? "Nombre" : "Name"}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-document-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={documentForm.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://" data-testid="input-document-url" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={documentForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "es" ? "Categoría" : "Category"}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-document-category">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {documentCategories.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={documentForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "es" ? "Descripción" : "Description"}</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={2} data-testid="input-document-description" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={saveDocumentMutation.isPending} data-testid="button-save-document">
                          {saveDocumentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {language === "es" ? "Guardar" : "Save"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === "es" ? "No hay documentos configurados" : "No documents configured"}
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`document-${doc.id}`}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{doc.name}</div>
                      {doc.description && (
                        <div className="text-sm text-muted-foreground">{doc.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.category && <Badge variant="outline">{doc.category}</Badge>}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => window.open(doc.url, "_blank")}
                        data-testid={`button-open-document-${doc.id}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingDocument(doc);
                          documentForm.reset({
                            name: doc.name,
                            url: doc.url,
                            category: doc.category || "",
                            description: doc.description || "",
                          });
                          setDocumentDialogOpen(true);
                        }}
                        data-testid={`button-edit-document-${doc.id}`}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteDocumentMutation.mutate(doc.id)}
                        data-testid={`button-delete-document-${doc.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCommissionsSection = () => (
    <Form {...commissionsForm}>
      <form onSubmit={commissionsForm.handleSubmit((data) => saveCommissionsMutation.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              {language === "es" ? "Tasa de Comisión" : "Commission Rate"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={commissionsForm.control}
              name="standardCommissionRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "es" ? "Comisión Estándar (%)" : "Standard Commission (%)"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      data-testid="input-commission-rate"
                    />
                  </FormControl>
                  <FormDescription>
                    {language === "es" 
                      ? "Porcentaje de comisión por defecto para operaciones" 
                      : "Default commission percentage for operations"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {language === "es" ? "Objetivos Mensuales" : "Monthly Targets"}
            </CardTitle>
            <CardDescription>
              {language === "es" 
                ? "Metas de cierre y comisiones por mes" 
                : "Closing and commission goals per month"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={commissionsForm.control}
                name="closingTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Meta de Cierres" : "Closing Target"}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-closing-target"
                      />
                    </FormControl>
                    <FormDescription>
                      {language === "es" ? "Número de operaciones cerradas" : "Number of closed operations"}
                    </FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={commissionsForm.control}
                name="commissionTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Meta de Comisiones (USD)" : "Commission Target (USD)"}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-commission-target"
                      />
                    </FormControl>
                    <FormDescription>
                      {language === "es" ? "Monto total en comisiones" : "Total commission amount"}
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveCommissionsMutation.isPending} data-testid="button-save-commissions">
            {saveCommissionsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {language === "es" ? "Guardar Cambios" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderFeedbackSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {language === "es" ? "Feedback de Usuarios" : "User Feedback"}
          </CardTitle>
          <CardDescription>
            {language === "es" 
              ? "Comentarios, sugerencias y reportes enviados por usuarios de la plataforma"
              : "Comments, suggestions and reports sent by platform users"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackList language={language} />
        </CardContent>
      </Card>
    </div>
  );

  const renderMigrationSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {language === "es" ? "Migración de Fotos HD" : "HD Photo Migration"}
          </CardTitle>
          <CardDescription>
            {language === "es" 
              ? "Monitorea el progreso de la migración de fotos de alta resolución desde Google Drive"
              : "Monitor the progress of HD photo migration from Google Drive"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhotoMigrationWidget language={language} />
        </CardContent>
      </Card>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return renderProfileSection();
      case "team":
        return renderTeamSection();
      case "pipeline":
        return renderPipelineSection();
      case "links":
        return renderLinksSection();
      case "catalog":
        return renderCatalogSection();
      case "notifications":
        return renderNotificationsSection();
      case "templates":
        return renderTemplatesSection();
      case "commissions":
        return renderCommissionsSection();
      case "feedback":
        return renderFeedbackSection();
      case "migration":
        return renderMigrationSection();
      default:
        return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-64 border-r bg-muted/30">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {language === "es" ? "Configuración" : "Settings"}
          </h1>
          <p className="text-sm text-muted-foreground">{agency.name}</p>
        </div>
        <ScrollArea className="h-[calc(100%-5rem)]">
          <nav className="p-2 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover-elevate"
                  }`}
                  data-testid={`nav-${section.id}`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {language === "es" ? section.title : section.titleEn}
                    </div>
                    <div className={`text-xs truncate ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {language === "es" ? section.description : section.descriptionEn}
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 flex-shrink-0 ${isActive ? "opacity-100" : "opacity-0"}`} />
                </button>
              );
            })}
          </nav>
        </ScrollArea>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 max-w-4xl">
            {renderSection()}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
