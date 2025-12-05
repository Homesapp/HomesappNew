import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Rocket,
  Search,
  Heart,
  Calendar,
  FileText,
  CreditCard,
  Wrench,
  Upload,
  Users,
  Building,
  BarChart3,
  Settings,
  Share2,
  CheckCircle2,
  HelpCircle,
  Home,
  MessageSquare,
  ClipboardList,
  Image,
  Link2,
  UserPlus,
  PieChart,
  Shield,
  Briefcase,
  TrendingUp,
  Target,
  Star,
  DollarSign,
  Check,
  ExternalLink,
  FolderOpen,
  Package,
} from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const ONBOARDING_VERSION = "2.0";

interface OnboardingStep {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  icon: ReactNode;
  target?: string;
  action?: string;
  actionEn?: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  icon: ReactNode;
  actionLabel: string;
  actionLabelEn?: string;
  actionPath?: string;
  isCompleted?: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  icon: ReactNode;
  path: string;
  variant?: "default" | "outline" | "secondary";
}

interface RoleOnboarding {
  welcomeTitle: string;
  welcomeTitleEn?: string;
  welcomeSubtitle: string;
  welcomeSubtitleEn?: string;
  tourSteps: OnboardingStep[];
  checklist: ChecklistItem[];
  quickActions: QuickAction[];
}

const roleOnboardingConfig: Record<string, RoleOnboarding> = {
  cliente: {
    welcomeTitle: "¡Bienvenido a HomesApp!",
    welcomeTitleEn: "Welcome to HomesApp!",
    welcomeSubtitle: "Tu próximo hogar en Tulum te espera. Te ayudamos a encontrarlo.",
    welcomeSubtitleEn: "Your next home in Tulum awaits. Let us help you find it.",
    tourSteps: [
      {
        id: "search",
        title: "Busca tu hogar ideal",
        titleEn: "Find your ideal home",
        description: "Explora propiedades verificadas en Tulum. Filtra por precio, zona, número de recámaras y más.",
        descriptionEn: "Explore verified properties in Tulum. Filter by price, area, bedrooms and more.",
        icon: <Search className="h-8 w-8 text-primary" />,
      },
      {
        id: "favorites",
        title: "Guarda tus favoritos",
        titleEn: "Save your favorites",
        description: "Haz clic en el corazón para guardar propiedades que te interesan. Podrás compararlas después.",
        descriptionEn: "Click the heart to save properties you like. You can compare them later.",
        icon: <Heart className="h-8 w-8 text-red-500" />,
      },
      {
        id: "schedule",
        title: "Agenda una visita",
        titleEn: "Schedule a visit",
        description: "¿Encontraste algo que te gusta? Agenda una visita directamente desde la app. Es gratis.",
        descriptionEn: "Found something you like? Schedule a visit directly from the app. It's free.",
        icon: <Calendar className="h-8 w-8 text-blue-500" />,
      },
    ],
    checklist: [],
    quickActions: [
      {
        id: "search",
        title: "Buscar propiedades",
        titleEn: "Search properties",
        description: "Explora el catálogo completo",
        descriptionEn: "Explore the full catalog",
        icon: <Search className="h-5 w-5" />,
        path: "/",
        variant: "default",
      },
      {
        id: "favorites",
        title: "Mis favoritos",
        titleEn: "My favorites",
        description: "Ver propiedades guardadas",
        descriptionEn: "View saved properties",
        icon: <Heart className="h-5 w-5" />,
        path: "/favorites",
        variant: "outline",
      },
      {
        id: "appointments",
        title: "Mis citas",
        titleEn: "My appointments",
        description: "Ver visitas agendadas",
        descriptionEn: "View scheduled visits",
        icon: <Calendar className="h-5 w-5" />,
        path: "/appointments",
        variant: "outline",
      },
    ],
  },
  tenant: {
    welcomeTitle: "¡Bienvenido a tu Portal de Inquilino!",
    welcomeTitleEn: "Welcome to your Tenant Portal!",
    welcomeSubtitle: "Aquí puedes gestionar todo sobre tu renta: pagos, documentos y mantenimiento.",
    welcomeSubtitleEn: "Here you can manage everything about your rental: payments, documents and maintenance.",
    tourSteps: [
      {
        id: "payment",
        title: "Tu próximo pago",
        titleEn: "Your next payment",
        description: "En el dashboard verás siempre cuánto y cuándo debes pagar. Mantente al día fácilmente.",
        descriptionEn: "On the dashboard you'll always see how much and when to pay. Stay on track easily.",
        icon: <CreditCard className="h-8 w-8 text-green-500" />,
      },
      {
        id: "register-payment",
        title: "Registra tus pagos",
        titleEn: "Register your payments",
        description: "Después de pagar, sube tu comprobante. Tu administrador lo verificará rápidamente.",
        descriptionEn: "After paying, upload your receipt. Your manager will verify it quickly.",
        icon: <Upload className="h-8 w-8 text-blue-500" />,
      },
      {
        id: "maintenance",
        title: "Reporta problemas",
        titleEn: "Report issues",
        description: "¿Algo no funciona? Crea un ticket de mantenimiento y da seguimiento a la solución.",
        descriptionEn: "Something not working? Create a maintenance ticket and track the solution.",
        icon: <Wrench className="h-8 w-8 text-orange-500" />,
      },
    ],
    checklist: [
      {
        id: "view-contract",
        title: "Ver mi contrato",
        titleEn: "View my contract",
        description: "Revisa los términos y fechas de tu contrato de renta",
        descriptionEn: "Review the terms and dates of your rental contract",
        icon: <FileText className="h-5 w-5" />,
        actionLabel: "Ver contrato",
        actionLabelEn: "View contract",
        actionPath: "/portal/tenant?tab=contract",
      },
      {
        id: "first-payment",
        title: "Registrar mi primer pago",
        titleEn: "Register my first payment",
        description: "Cuando hagas un pago, regístralo para mantener tu historial actualizado",
        descriptionEn: "When you make a payment, register it to keep your history updated",
        icon: <CreditCard className="h-5 w-5" />,
        actionLabel: "Ir a pagos",
        actionLabelEn: "Go to payments",
        actionPath: "/portal/tenant?tab=payments",
      },
      {
        id: "explore-documents",
        title: "Explorar mis documentos",
        titleEn: "Explore my documents",
        description: "Accede a contratos, recibos y otros documentos importantes",
        descriptionEn: "Access contracts, receipts and other important documents",
        icon: <FileText className="h-5 w-5" />,
        actionLabel: "Ver documentos",
        actionLabelEn: "View documents",
        actionPath: "/portal/tenant?tab=documents",
      },
    ],
    quickActions: [
      {
        id: "register-payment",
        title: "Registrar pago",
        titleEn: "Register payment",
        description: "Subir comprobante",
        descriptionEn: "Upload receipt",
        icon: <Upload className="h-5 w-5" />,
        path: "/portal/tenant?tab=payments",
        variant: "default",
      },
      {
        id: "maintenance",
        title: "Nuevo ticket",
        titleEn: "New ticket",
        description: "Reportar problema",
        descriptionEn: "Report issue",
        icon: <Wrench className="h-5 w-5" />,
        path: "/portal/tenant?tab=maintenance",
        variant: "outline",
      },
      {
        id: "chat",
        title: "Soporte",
        titleEn: "Support",
        description: "Hablar con asistente",
        descriptionEn: "Talk to assistant",
        icon: <MessageSquare className="h-5 w-5" />,
        path: "/portal/tenant?tab=support",
        variant: "outline",
      },
    ],
  },
  owner: {
    welcomeTitle: "¡Bienvenido a tu Portal de Propietario!",
    welcomeTitleEn: "Welcome to your Owner Portal!",
    welcomeSubtitle: "Administra tus propiedades, revisa ingresos y mantente informado sobre tus inquilinos.",
    welcomeSubtitleEn: "Manage your properties, review income and stay informed about your tenants.",
    tourSteps: [
      {
        id: "income",
        title: "Resumen de ingresos",
        titleEn: "Income summary",
        description: "Ve cuánto has recibido este mes, pagos pendientes y el estado de tu propiedad.",
        descriptionEn: "See how much you've received this month, pending payments and your property status.",
        icon: <DollarSign className="h-8 w-8 text-green-500" />,
      },
      {
        id: "payments",
        title: "Pagos por verificar",
        titleEn: "Payments to verify",
        description: "Cuando tu inquilino registra un pago, lo verás aquí para confirmar que se recibió.",
        descriptionEn: "When your tenant registers a payment, you'll see it here to confirm it was received.",
        icon: <CheckCircle2 className="h-8 w-8 text-blue-500" />,
      },
      {
        id: "maintenance",
        title: "Mantenimiento activo",
        titleEn: "Active maintenance",
        description: "Revisa tickets de mantenimiento reportados y aprueba trabajos cuando sea necesario.",
        descriptionEn: "Review reported maintenance tickets and approve work when necessary.",
        icon: <Wrench className="h-8 w-8 text-orange-500" />,
      },
      {
        id: "documents",
        title: "Documentos importantes",
        titleEn: "Important documents",
        description: "Accede a contratos, reportes financieros y documentos de tu propiedad.",
        descriptionEn: "Access contracts, financial reports and property documents.",
        icon: <FileText className="h-8 w-8 text-purple-500" />,
      },
    ],
    checklist: [
      {
        id: "review-property",
        title: "Revisar datos de mi propiedad",
        titleEn: "Review my property data",
        description: "Verifica que la información de tu propiedad esté correcta",
        descriptionEn: "Verify that your property information is correct",
        icon: <Building className="h-5 w-5" />,
        actionLabel: "Ver propiedad",
        actionLabelEn: "View property",
        actionPath: "/portal/owner?tab=dashboard",
      },
      {
        id: "understand-payments",
        title: "Entender estados de pago",
        titleEn: "Understand payment statuses",
        description: "Aprende qué significa pendiente, pagado y verificado",
        descriptionEn: "Learn what pending, paid and verified mean",
        icon: <CreditCard className="h-5 w-5" />,
        actionLabel: "Ver pagos",
        actionLabelEn: "View payments",
        actionPath: "/portal/owner?tab=payments",
      },
      {
        id: "upload-documents",
        title: "Subir documentos importantes",
        titleEn: "Upload important documents",
        description: "Sube escrituras, contratos firmados u otros documentos",
        descriptionEn: "Upload deeds, signed contracts or other documents",
        icon: <Upload className="h-5 w-5" />,
        actionLabel: "Subir documento",
        actionLabelEn: "Upload document",
        actionPath: "/portal/owner?tab=documents",
      },
    ],
    quickActions: [
      {
        id: "payments",
        title: "Ver pagos",
        titleEn: "View payments",
        description: "Historial completo",
        descriptionEn: "Complete history",
        icon: <CreditCard className="h-5 w-5" />,
        path: "/portal/owner?tab=payments",
        variant: "default",
      },
      {
        id: "maintenance",
        title: "Mantenimiento",
        titleEn: "Maintenance",
        description: "Tickets activos",
        descriptionEn: "Active tickets",
        icon: <Wrench className="h-5 w-5" />,
        path: "/portal/owner?tab=maintenance",
        variant: "outline",
      },
      {
        id: "documents",
        title: "Documentos",
        titleEn: "Documents",
        description: "Contratos y más",
        descriptionEn: "Contracts and more",
        icon: <FileText className="h-5 w-5" />,
        path: "/portal/owner?tab=documents",
        variant: "outline",
      },
    ],
  },
  seller: {
    welcomeTitle: "¡Bienvenido Vendedor!",
    welcomeTitleEn: "Welcome Seller!",
    welcomeSubtitle: "Tu éxito es nuestro éxito. Aquí tienes las herramientas para cerrar más rentas.",
    welcomeSubtitleEn: "Your success is our success. Here are the tools to close more rentals.",
    tourSteps: [
      {
        id: "profile",
        title: "Completa tu perfil",
        titleEn: "Complete your profile",
        description: "Un perfil completo genera más confianza. Agrega tu foto y datos de contacto.",
        descriptionEn: "A complete profile builds more trust. Add your photo and contact information.",
        icon: <Users className="h-8 w-8 text-blue-500" />,
      },
      {
        id: "catalog",
        title: "Conoce el catálogo",
        titleEn: "Know the catalog",
        description: "Explora las propiedades disponibles. Conoce precios, características y comisiones.",
        descriptionEn: "Explore available properties. Know prices, features and commissions.",
        icon: <Building className="h-8 w-8 text-green-500" />,
      },
      {
        id: "share",
        title: "Comparte y genera leads",
        titleEn: "Share and generate leads",
        description: "Usa tu link personal o comparte propiedades. Cada lead cuenta para tu comisión.",
        descriptionEn: "Use your personal link or share properties. Each lead counts towards your commission.",
        icon: <Share2 className="h-8 w-8 text-purple-500" />,
      },
      {
        id: "leads",
        title: "Gestiona tus leads",
        titleEn: "Manage your leads",
        description: "Usa el Kanban para mover leads por el embudo. Actualiza estados y cierra ventas.",
        descriptionEn: "Use Kanban to move leads through the funnel. Update statuses and close sales.",
        icon: <Target className="h-8 w-8 text-orange-500" />,
      },
    ],
    checklist: [
      {
        id: "complete-profile",
        title: "Completar mi perfil",
        titleEn: "Complete my profile",
        description: "Nombre, foto y datos de contacto",
        descriptionEn: "Name, photo and contact info",
        icon: <Users className="h-5 w-5" />,
        actionLabel: "Editar perfil",
        actionLabelEn: "Edit profile",
        actionPath: "/perfil",
      },
      {
        id: "explore-catalog",
        title: "Revisar catálogo de propiedades",
        titleEn: "Review property catalog",
        description: "Conoce las propiedades que puedes ofrecer",
        descriptionEn: "Know the properties you can offer",
        icon: <Building className="h-5 w-5" />,
        actionLabel: "Ver catálogo",
        actionLabelEn: "View catalog",
        actionPath: "/external/seller-catalog",
      },
      {
        id: "share-link",
        title: "Compartir mi link de vendedor",
        titleEn: "Share my seller link",
        description: "Genera leads con tu link personal",
        descriptionEn: "Generate leads with your personal link",
        icon: <Link2 className="h-5 w-5" />,
        actionLabel: "Copiar link",
        actionLabelEn: "Copy link",
        actionPath: "/external/clients",
      },
      {
        id: "check-leads",
        title: "Revisar mis leads",
        titleEn: "Review my leads",
        description: "Actualiza el estado de tus prospectos",
        descriptionEn: "Update your prospects' status",
        icon: <ClipboardList className="h-5 w-5" />,
        actionLabel: "Ver leads",
        actionLabelEn: "View leads",
        actionPath: "/external/clients",
      },
    ],
    quickActions: [
      {
        id: "catalog",
        title: "Ver catálogo",
        titleEn: "View catalog",
        description: "Propiedades disponibles",
        descriptionEn: "Available properties",
        icon: <Building className="h-5 w-5" />,
        path: "/external/seller-catalog",
        variant: "default",
      },
      {
        id: "leads",
        title: "Mis leads",
        titleEn: "My leads",
        description: "Gestionar prospectos",
        descriptionEn: "Manage prospects",
        icon: <Target className="h-5 w-5" />,
        path: "/external/clients",
        variant: "outline",
      },
      {
        id: "social",
        title: "Redes sociales",
        titleEn: "Social media",
        description: "Plantillas y editor",
        descriptionEn: "Templates and editor",
        icon: <Image className="h-5 w-5" />,
        path: "/external/seller-social-media",
        variant: "outline",
      },
    ],
  },
  external_admin: {
    welcomeTitle: "¡Bienvenido Administrador de Agencia!",
    welcomeTitleEn: "Welcome Agency Admin!",
    welcomeSubtitle: "Configura tu agencia y empieza a gestionar tu equipo de vendedores.",
    welcomeSubtitleEn: "Configure your agency and start managing your sales team.",
    tourSteps: [
      {
        id: "agency-setup",
        title: "Configura tu agencia",
        titleEn: "Set up your agency",
        description: "Sube el logo, nombre comercial y datos de contacto de tu agencia.",
        descriptionEn: "Upload your agency's logo, business name and contact information.",
        icon: <Building className="h-8 w-8 text-blue-500" />,
      },
      {
        id: "invite-agents",
        title: "Invita a tu equipo",
        titleEn: "Invite your team",
        description: "Agrega vendedores externos a tu agencia. Ellos podrán ver el catálogo y generar leads.",
        descriptionEn: "Add external sellers to your agency. They can view the catalog and generate leads.",
        icon: <UserPlus className="h-8 w-8 text-green-500" />,
      },
      {
        id: "catalog",
        title: "Revisa el catálogo",
        titleEn: "Review the catalog",
        description: "Explora las propiedades disponibles para tu agencia y configura preferencias.",
        descriptionEn: "Explore properties available for your agency and configure preferences.",
        icon: <Building className="h-8 w-8 text-purple-500" />,
      },
      {
        id: "commissions",
        title: "Configura comisiones",
        titleEn: "Set up commissions",
        description: "Define las comisiones para tu equipo y revisa reportes de desempeño.",
        descriptionEn: "Define commissions for your team and review performance reports.",
        icon: <PieChart className="h-8 w-8 text-orange-500" />,
      },
    ],
    checklist: [
      {
        id: "upload-logo",
        title: "Subir logo de la agencia",
        titleEn: "Upload agency logo",
        description: "Personaliza tu marca en la plataforma",
        descriptionEn: "Customize your brand on the platform",
        icon: <Image className="h-5 w-5" />,
        actionLabel: "Subir logo",
        actionLabelEn: "Upload logo",
        actionPath: "/external/agency",
      },
      {
        id: "invite-agent",
        title: "Invitar primer agente",
        titleEn: "Invite first agent",
        description: "Agrega a tu primer vendedor externo",
        descriptionEn: "Add your first external seller",
        icon: <UserPlus className="h-5 w-5" />,
        actionLabel: "Invitar agente",
        actionLabelEn: "Invite agent",
        actionPath: "/external/sellers-management",
      },
      {
        id: "review-catalog",
        title: "Revisar catálogo asociado",
        titleEn: "Review associated catalog",
        description: "Ver propiedades disponibles para tu agencia",
        descriptionEn: "View properties available for your agency",
        icon: <Building className="h-5 w-5" />,
        actionLabel: "Ver catálogo",
        actionLabelEn: "View catalog",
        actionPath: "/external/properties",
      },
      {
        id: "setup-commissions",
        title: "Configurar comisiones",
        titleEn: "Set up commissions",
        description: "Define estructura de comisiones del equipo",
        descriptionEn: "Define team commission structure",
        icon: <PieChart className="h-5 w-5" />,
        actionLabel: "Configurar",
        actionLabelEn: "Configure",
        actionPath: "/external/agency",
      },
    ],
    quickActions: [
      {
        id: "team",
        title: "Mi equipo",
        titleEn: "My team",
        description: "Gestionar agentes",
        descriptionEn: "Manage agents",
        icon: <Users className="h-5 w-5" />,
        path: "/external/sellers-management",
        variant: "default",
      },
      {
        id: "reports",
        title: "Reportes",
        titleEn: "Reports",
        description: "Métricas y desempeño",
        descriptionEn: "Metrics and performance",
        icon: <BarChart3 className="h-5 w-5" />,
        path: "/external/accounting",
        variant: "outline",
      },
      {
        id: "settings",
        title: "Configuración",
        titleEn: "Settings",
        description: "Ajustes de agencia",
        descriptionEn: "Agency settings",
        icon: <Settings className="h-5 w-5" />,
        path: "/external/agency",
        variant: "outline",
      },
    ],
  },
  admin: {
    welcomeTitle: "¡Bienvenido Administrador!",
    welcomeTitleEn: "Welcome Administrator!",
    welcomeSubtitle: "Tienes acceso completo al panel de control de HomesApp.",
    welcomeSubtitleEn: "You have full access to the HomesApp control panel.",
    tourSteps: [
      {
        id: "properties",
        title: "Gestión de propiedades",
        titleEn: "Property management",
        description: "Aprueba, edita y gestiona todas las propiedades de la plataforma.",
        descriptionEn: "Approve, edit and manage all properties on the platform.",
        icon: <Building className="h-8 w-8 text-blue-500" />,
      },
      {
        id: "contracts",
        title: "Contratos activos",
        titleEn: "Active contracts",
        description: "Supervisa contratos de renta, pagos y comisiones en un solo lugar.",
        descriptionEn: "Monitor rental contracts, payments and commissions in one place.",
        icon: <FileText className="h-8 w-8 text-green-500" />,
      },
      {
        id: "agencies",
        title: "Agencias externas",
        titleEn: "External agencies",
        description: "Gestiona agencias asociadas, sus equipos y configuraciones.",
        descriptionEn: "Manage partner agencies, their teams and settings.",
        icon: <Briefcase className="h-8 w-8 text-purple-500" />,
      },
      {
        id: "analytics",
        title: "Métricas del negocio",
        titleEn: "Business metrics",
        description: "Analiza ingresos, conversiones y desempeño general de la plataforma.",
        descriptionEn: "Analyze revenue, conversions and overall platform performance.",
        icon: <TrendingUp className="h-8 w-8 text-orange-500" />,
      },
    ],
    checklist: [],
    quickActions: [
      {
        id: "properties",
        title: "Propiedades",
        titleEn: "Properties",
        description: "Gestión completa",
        descriptionEn: "Full management",
        icon: <Building className="h-5 w-5" />,
        path: "/admin/properties",
        variant: "default",
      },
      {
        id: "contracts",
        title: "Contratos",
        titleEn: "Contracts",
        description: "Rentas activas",
        descriptionEn: "Active rentals",
        icon: <FileText className="h-5 w-5" />,
        path: "/admin/contracts",
        variant: "outline",
      },
      {
        id: "income",
        title: "Ingresos",
        titleEn: "Income",
        description: "Reportes financieros",
        descriptionEn: "Financial reports",
        icon: <DollarSign className="h-5 w-5" />,
        path: "/admin/income",
        variant: "outline",
      },
    ],
  },
  master: {
    welcomeTitle: "¡Bienvenido Master Admin!",
    welcomeTitleEn: "Welcome Master Admin!",
    welcomeSubtitle: "Control total sobre todas las funcionalidades del sistema.",
    welcomeSubtitleEn: "Full control over all system functionalities.",
    tourSteps: [],
    checklist: [],
    quickActions: [
      {
        id: "analytics",
        title: "Analytics",
        titleEn: "Analytics",
        description: "Métricas globales",
        descriptionEn: "Global metrics",
        icon: <BarChart3 className="h-5 w-5" />,
        path: "/admin/analytics",
        variant: "default",
      },
      {
        id: "agencies",
        title: "Agencias",
        titleEn: "Agencies",
        description: "Gestión externa",
        descriptionEn: "External management",
        icon: <Briefcase className="h-5 w-5" />,
        path: "/admin/agencies",
        variant: "outline",
      },
      {
        id: "settings",
        title: "Sistema",
        titleEn: "System",
        description: "Configuración global",
        descriptionEn: "Global settings",
        icon: <Settings className="h-5 w-5" />,
        path: "/admin/settings",
        variant: "outline",
      },
    ],
  },
};

interface OnboardingContextType {
  isOnboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  showChecklist: boolean;
  setShowChecklist: (show: boolean) => void;
  completedSteps: string[];
  markStepComplete: (stepId: string) => void;
  roleConfig: RoleOnboarding | null;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
  userRole: string;
  onboardingCompleted: boolean;
  onboardingSteps?: Record<string, boolean>;
}

export function OnboardingProvider({ 
  children, 
  userRole, 
  onboardingCompleted, 
  onboardingSteps 
}: OnboardingProviderProps) {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  const roleConfig = roleOnboardingConfig[userRole] || roleOnboardingConfig.cliente;

  useEffect(() => {
    if (onboardingSteps) {
      const completed = Object.entries(onboardingSteps)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      setCompletedSteps(completed);
    }
  }, [onboardingSteps]);

  useEffect(() => {
    const localVersion = localStorage.getItem(`onboarding_version_${userRole}`);
    if (!onboardingCompleted || localVersion !== ONBOARDING_VERSION) {
      const timer = setTimeout(() => {
        setIsOnboardingOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted, userRole]);

  const markStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingOpen,
        openOnboarding: () => setIsOnboardingOpen(true),
        closeOnboarding: () => setIsOnboardingOpen(false),
        showChecklist,
        setShowChecklist,
        completedSteps,
        markStepComplete,
        roleConfig,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

interface OnboardingTourDialogProps {
  userRole: string;
  onboardingCompleted: boolean;
}

export function OnboardingTourDialog({ userRole, onboardingCompleted }: OnboardingTourDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const roleConfig = roleOnboardingConfig[userRole] || roleOnboardingConfig.cliente;
  const steps = roleConfig.tourSteps;

  useEffect(() => {
    const localVersion = localStorage.getItem(`onboarding_version_${userRole}`);
    if (!onboardingCompleted || localVersion !== ONBOARDING_VERSION) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted, userRole]);

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/user/complete-onboarding");
    },
    onSuccess: () => {
      localStorage.setItem(`onboarding_version_${userRole}`, ONBOARDING_VERSION);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/admin/user"] });
      setIsOpen(false);
    },
  });

  const skipOnboardingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/user/skip-onboarding");
    },
    onSuccess: () => {
      localStorage.setItem(`onboarding_version_${userRole}`, ONBOARDING_VERSION);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/admin/user"] });
      setIsOpen(false);
    },
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboardingMutation.mutate();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    skipOnboardingMutation.mutate();
  };

  if (steps.length === 0) {
    if (isOpen && !onboardingCompleted) {
      completeOnboardingMutation.mutate();
    }
    return null;
  }

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleSkip(); }}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden" data-testid="dialog-onboarding-tour">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 pb-4">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 rounded-full bg-background shadow-lg">
                {step.icon}
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-center">
              {isEn ? step.titleEn || step.title : step.title}
            </DialogTitle>
            <DialogDescription className="text-center pt-2 text-base">
              {isEn ? step.descriptionEn || step.description : step.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {step.action && (
            <div className="bg-muted/50 p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                {isEn ? step.actionEn || step.action : step.action}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span data-testid="text-step-counter">
                {isEn ? `Step ${currentStep + 1} of ${steps.length}` : `Paso ${currentStep + 1} de ${steps.length}`}
              </span>
              <span data-testid="text-progress-percent">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-tour" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={skipOnboardingMutation.isPending}
              data-testid="button-skip-tour"
            >
              {isEn ? "Skip" : "Saltar"}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                data-testid="button-previous-step"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                disabled={completeOnboardingMutation.isPending}
                data-testid="button-next-step"
              >
                {currentStep === steps.length - 1 
                  ? (isEn ? "Get Started" : "Empezar") 
                  : (isEn ? "Next" : "Siguiente")}
                {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FirstStepsChecklistProps {
  userRole: string;
  completedSteps?: string[];
  onStepClick?: (stepId: string, path?: string) => void;
  className?: string;
}

const CHECKLIST_STORAGE_KEY = "homesapp_checklist_completed";
const CHECKLIST_HIDDEN_KEY = "homesapp_checklist_hidden";

function getStoredCompletedSteps(userRole: string): string[] {
  try {
    const stored = localStorage.getItem(`${CHECKLIST_STORAGE_KEY}_${userRole}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCompletedStep(userRole: string, stepId: string): void {
  try {
    const current = getStoredCompletedSteps(userRole);
    if (!current.includes(stepId)) {
      const updated = [...current, stepId];
      localStorage.setItem(`${CHECKLIST_STORAGE_KEY}_${userRole}`, JSON.stringify(updated));
    }
  } catch {
  }
}

function isChecklistHidden(userRole: string): boolean {
  try {
    return localStorage.getItem(`${CHECKLIST_HIDDEN_KEY}_${userRole}`) === "true";
  } catch {
    return false;
  }
}

function hideChecklist(userRole: string): void {
  try {
    localStorage.setItem(`${CHECKLIST_HIDDEN_KEY}_${userRole}`, "true");
  } catch {
  }
}

export function FirstStepsChecklist({ 
  userRole, 
  completedSteps: externalCompletedSteps = [], 
  onStepClick,
  className 
}: FirstStepsChecklistProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  
  const [localCompletedSteps, setLocalCompletedSteps] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isHidden, setIsHidden] = useState(() => isChecklistHidden(userRole));
  const [celebrationStarted, setCelebrationStarted] = useState(false);
  
  useEffect(() => {
    const stored = getStoredCompletedSteps(userRole);
    setLocalCompletedSteps(stored);
    setIsHidden(isChecklistHidden(userRole));
  }, [userRole]);
  
  const roleConfig = roleOnboardingConfig[userRole] || roleOnboardingConfig.cliente;
  const checklist = roleConfig.checklist;

  const allCompletedSteps = [...new Set([...externalCompletedSteps, ...localCompletedSteps])];

  const completedCount = checklist.filter(item => 
    allCompletedSteps.includes(item.id) || item.isCompleted
  ).length;
  const isAllCompleted = completedCount === checklist.length && checklist.length > 0;

  useEffect(() => {
    if (isAllCompleted && !isHidden && !celebrationStarted) {
      setCelebrationStarted(true);
      setShowCelebration(true);
      
      const timer = setTimeout(() => {
        hideChecklist(userRole);
        setShowCelebration(false);
        setIsHidden(true);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [isAllCompleted, isHidden, userRole, celebrationStarted]);

  if (checklist.length === 0 || (isHidden && !showCelebration)) return null;

  const handleStepClick = (stepId: string, path?: string) => {
    saveCompletedStep(userRole, stepId);
    setLocalCompletedSteps(prev => prev.includes(stepId) ? prev : [...prev, stepId]);
    
    onStepClick?.(stepId, path);
  };

  const progress = (completedCount / checklist.length) * 100;

  if (showCelebration) {
    return (
      <Card className={cn("border-green-500/50 bg-green-50 dark:bg-green-950/20", className)} data-testid="card-first-steps-complete">
        <CardContent className="py-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2" data-testid="text-celebration-title">
            {isEn ? "Excellent! All done!" : "¡Excelente! ¡Todo listo!"}
          </h3>
          <p className="text-green-600 dark:text-green-500" data-testid="text-celebration-message">
            {isEn 
              ? "You've completed all the initial steps. You're ready to go!" 
              : "Has completado todos los pasos iniciales. ¡Estás listo para comenzar!"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-primary/20", className)} data-testid="card-first-steps">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg" data-testid="text-first-steps-title">
              {isEn ? "First Steps" : "Primeros Pasos"}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="font-normal" data-testid="badge-checklist-progress">
            {completedCount}/{checklist.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-1.5 mt-2" data-testid="progress-checklist" />
      </CardHeader>
      <CardContent className="space-y-2">
        {checklist.map((item) => {
          const isCompleted = allCompletedSteps.includes(item.id) || item.isCompleted;
          
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                isCompleted 
                  ? "bg-muted/50 border-muted" 
                  : "bg-background hover-elevate cursor-pointer border-border"
              )}
              onClick={() => !isCompleted && handleStepClick(item.id, item.actionPath)}
              data-testid={`checklist-item-${item.id}`}
            >
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                isCompleted 
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600" 
                  : "bg-primary/10 text-primary"
              )}>
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  item.icon
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm",
                  isCompleted && "line-through text-muted-foreground"
                )}>
                  {isEn ? item.titleEn || item.title : item.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {isEn ? item.descriptionEn || item.description : item.description}
                </p>
              </div>
              {!isCompleted && (
                <Button variant="ghost" size="sm" className="flex-shrink-0" data-testid={`button-action-${item.id}`}>
                  {isEn ? item.actionLabelEn || item.actionLabel : item.actionLabel}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface QuickActionsCardProps {
  userRole: string;
  onActionClick?: (path: string) => void;
  className?: string;
  title?: string;
  titleEn?: string;
}

export function QuickActionsCard({ 
  userRole, 
  onActionClick, 
  className,
  title,
  titleEn 
}: QuickActionsCardProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  
  const roleConfig = roleOnboardingConfig[userRole] || roleOnboardingConfig.cliente;
  const actions = roleConfig.quickActions;

  if (actions.length === 0) return null;

  return (
    <Card className={className} data-testid="card-quick-actions">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2" data-testid="text-quick-actions-title">
          <Rocket className="h-5 w-5 text-primary" />
          {title 
            ? (isEn ? titleEn || title : title)
            : (isEn ? "What would you like to do?" : "¿Qué quieres hacer?")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || "outline"}
              className="h-auto py-4 flex-col gap-2"
              onClick={() => onActionClick?.(action.path)}
              data-testid={`action-${action.id}`}
            >
              {action.icon}
              <div className="text-center">
                <p className="font-medium text-sm">
                  {isEn ? action.titleEn || action.title : action.title}
                </p>
                <p className="text-xs text-muted-foreground font-normal">
                  {isEn ? action.descriptionEn || action.description : action.description}
                </p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  actionLabel?: string;
  actionLabelEn?: string;
  actionPath?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  titleEn,
  description,
  descriptionEn,
  actionLabel,
  actionLabelEn,
  actionPath,
  onAction,
  className,
}: EmptyStateProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-8 rounded-lg border border-dashed",
      className
    )} data-testid="empty-state">
      {icon && (
        <div className="p-4 rounded-full bg-muted mb-4" data-testid="icon-empty-state">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-lg mb-2" data-testid="text-empty-title">
        {isEn ? titleEn || title : title}
      </h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-4" data-testid="text-empty-description">
        {isEn ? descriptionEn || description : description}
      </p>
      {actionLabel && (
        <Button onClick={onAction} data-testid="button-empty-action">
          {isEn ? actionLabelEn || actionLabel : actionLabel}
        </Button>
      )}
    </div>
  );
}

interface ContextualHelpProps {
  topic: string;
  className?: string;
}

export function ContextualHelp({ topic, className }: ContextualHelpProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const helpTopics: Record<string, { title: string; titleEn: string; content: string; contentEn: string }> = {
    payments: {
      title: "Estados de pago",
      titleEn: "Payment statuses",
      content: "Pendiente: Falta pagar. Pagado: Subiste comprobante, pendiente verificación. Verificado: Confirmado por el administrador.",
      contentEn: "Pending: Payment due. Paid: Receipt uploaded, pending verification. Verified: Confirmed by administrator.",
    },
    maintenance: {
      title: "Tickets de mantenimiento",
      titleEn: "Maintenance tickets",
      content: "Crea un ticket para reportar problemas. El equipo lo revisará y te notificará cuando se resuelva.",
      contentEn: "Create a ticket to report issues. The team will review it and notify you when resolved.",
    },
    leads: {
      title: "Gestión de leads",
      titleEn: "Lead management",
      content: "Usa el Kanban para mover prospectos por el embudo. Actualiza estados conforme avances en el proceso de venta.",
      contentEn: "Use Kanban to move prospects through the funnel. Update statuses as you progress in the sales process.",
    },
    documents: {
      title: "Documentos",
      titleEn: "Documents",
      content: "Aquí encontrarás contratos, recibos y otros documentos importantes. Puedes descargarlos en cualquier momento.",
      contentEn: "Here you'll find contracts, receipts and other important documents. You can download them at any time.",
    },
  };

  const help = helpTopics[topic];
  if (!help) return null;

  return (
    <div className={cn(
      "flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800",
      className
    )} data-testid={`contextual-help-${topic}`}>
      <HelpCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-sm text-blue-700 dark:text-blue-300" data-testid={`text-help-title-${topic}`}>
          {isEn ? help.titleEn : help.title}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5" data-testid={`text-help-content-${topic}`}>
          {isEn ? help.contentEn : help.content}
        </p>
      </div>
    </div>
  );
}

export { roleOnboardingConfig };

interface HelpPanelContent {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  bullets: Array<{ text: string; textEn: string }>;
  detailLink?: string;
}

const helpPanelContent: Record<string, HelpPanelContent> = {
  "tenant-payments": {
    title: "Ayuda con Pagos",
    titleEn: "Help with Payments",
    description: "En esta sección puedes gestionar tus pagos de renta y servicios.",
    descriptionEn: "In this section you can manage your rent and service payments.",
    bullets: [
      { text: "Ver el historial completo de tus pagos de renta", textEn: "View the complete history of your rent payments" },
      { text: "Subir comprobantes de pago para verificación", textEn: "Upload payment receipts for verification" },
      { text: "Estados: Pendiente (amarillo), Verificado (verde), Rechazado (rojo)", textEn: "Statuses: Pending (yellow), Verified (green), Rejected (red)" },
      { text: "Paso 1: Selecciona un pago pendiente", textEn: "Step 1: Select a pending payment" },
      { text: "Paso 2: Sube el comprobante de pago (imagen o PDF)", textEn: "Step 2: Upload the payment receipt (image or PDF)" },
      { text: "Paso 3: Espera la verificación del propietario o administrador", textEn: "Step 3: Wait for verification from the owner or administrator" },
    ],
    detailLink: "/help/tenant/payments",
  },
  "tenant-maintenance": {
    title: "Ayuda con Mantenimiento",
    titleEn: "Help with Maintenance",
    description: "Reporta y da seguimiento a problemas de mantenimiento en tu propiedad.",
    descriptionEn: "Report and track maintenance issues in your property.",
    bullets: [
      { text: "Crear tickets de mantenimiento para reportar problemas", textEn: "Create maintenance tickets to report problems" },
      { text: "Adjuntar fotos para describir mejor el problema", textEn: "Attach photos to better describe the issue" },
      { text: "Estados: Abierto → En progreso → Resuelto", textEn: "Statuses: Open → In Progress → Resolved" },
      { text: "Paso 1: Haz clic en 'Nuevo ticket'", textEn: "Step 1: Click on 'New ticket'" },
      { text: "Paso 2: Describe el problema y adjunta fotos", textEn: "Step 2: Describe the problem and attach photos" },
      { text: "Paso 3: Recibirás actualizaciones cuando el equipo trabaje en él", textEn: "Step 3: You will receive updates when the team works on it" },
    ],
    detailLink: "/help/tenant/maintenance",
  },
  "tenant-documents": {
    title: "Ayuda con Documentos",
    titleEn: "Help with Documents",
    description: "Accede a todos los documentos relacionados con tu contrato de renta.",
    descriptionEn: "Access all documents related to your rental contract.",
    bullets: [
      { text: "Ver y descargar tu contrato de arrendamiento", textEn: "View and download your lease agreement" },
      { text: "Acceder a recibos de pago y comprobantes", textEn: "Access payment receipts and proofs" },
      { text: "Consultar el reglamento del condominio", textEn: "Check the condominium regulations" },
      { text: "Los documentos están organizados por categoría", textEn: "Documents are organized by category" },
      { text: "Puedes descargar en PDF para guardar una copia", textEn: "You can download as PDF to keep a copy" },
    ],
    detailLink: "/help/tenant/documents",
  },
  "owner-payments": {
    title: "Ayuda con Pagos",
    titleEn: "Help with Payments",
    description: "Revisa y verifica los pagos de tus inquilinos.",
    descriptionEn: "Review and verify your tenants' payments.",
    bullets: [
      { text: "Ver todos los pagos registrados por tus inquilinos", textEn: "View all payments registered by your tenants" },
      { text: "Verificar o rechazar comprobantes de pago", textEn: "Verify or reject payment receipts" },
      { text: "Estados: Pendiente (esperando verificación), Verificado, Rechazado", textEn: "Statuses: Pending (awaiting verification), Verified, Rejected" },
      { text: "Paso 1: Revisa el comprobante adjunto", textEn: "Step 1: Review the attached receipt" },
      { text: "Paso 2: Confirma que el monto y fecha son correctos", textEn: "Step 2: Confirm amount and date are correct" },
      { text: "Paso 3: Marca como verificado o rechazado con motivo", textEn: "Step 3: Mark as verified or rejected with reason" },
    ],
    detailLink: "/help/owner/payments",
  },
  "owner-maintenance": {
    title: "Ayuda con Mantenimiento",
    titleEn: "Help with Maintenance",
    description: "Gestiona los tickets de mantenimiento de tus propiedades.",
    descriptionEn: "Manage maintenance tickets for your properties.",
    bullets: [
      { text: "Ver tickets abiertos por tus inquilinos", textEn: "View tickets opened by your tenants" },
      { text: "Asignar proveedores de servicio a los tickets", textEn: "Assign service providers to tickets" },
      { text: "Aprobar o rechazar solicitudes de mantenimiento", textEn: "Approve or reject maintenance requests" },
      { text: "Estados: Abierto → Asignado → En progreso → Resuelto", textEn: "Statuses: Open → Assigned → In Progress → Resolved" },
      { text: "Puedes agregar comentarios y actualizaciones", textEn: "You can add comments and updates" },
    ],
    detailLink: "/help/owner/maintenance",
  },
  "owner-documents": {
    title: "Ayuda con Documentos",
    titleEn: "Help with Documents",
    description: "Gestiona los documentos de tus contratos y propiedades.",
    descriptionEn: "Manage documents for your contracts and properties.",
    bullets: [
      { text: "Ver contratos activos con tus inquilinos", textEn: "View active contracts with your tenants" },
      { text: "Descargar reportes financieros", textEn: "Download financial reports" },
      { text: "Acceder a documentos legales de la propiedad", textEn: "Access legal documents for the property" },
      { text: "Subir documentos adicionales si es necesario", textEn: "Upload additional documents if needed" },
      { text: "Los documentos se organizan por propiedad y contrato", textEn: "Documents are organized by property and contract" },
    ],
    detailLink: "/help/owner/documents",
  },
  "seller-leads": {
    title: "Ayuda con Leads",
    titleEn: "Help with Leads",
    description: "Gestiona tus prospectos y avanza en el proceso de venta o renta.",
    descriptionEn: "Manage your prospects and advance in the sales or rental process.",
    bullets: [
      { text: "Ver todos tus leads organizados por estado", textEn: "View all your leads organized by status" },
      { text: "Arrastrar leads entre columnas para cambiar su estado", textEn: "Drag leads between columns to change their status" },
      { text: "Estados: Nuevo → Contactado → Calificado → En negociación → Cerrado", textEn: "Statuses: New → Contacted → Qualified → Negotiating → Closed" },
      { text: "Haz clic en un lead para ver detalles y agregar notas", textEn: "Click on a lead to view details and add notes" },
      { text: "Usa filtros para encontrar leads específicos", textEn: "Use filters to find specific leads" },
      { text: "Comparte tu catálogo para generar nuevos leads", textEn: "Share your catalog to generate new leads" },
    ],
    detailLink: "/help/seller/leads",
  },
  "agency-settings": {
    title: "Ayuda con Configuración de Agencia",
    titleEn: "Help with Agency Settings",
    description: "Configura tu agencia y gestiona los accesos de tu equipo.",
    descriptionEn: "Configure your agency and manage team access.",
    bullets: [
      { text: "Personaliza el logo y nombre de tu agencia", textEn: "Customize your agency logo and name" },
      { text: "Invita a nuevos miembros del equipo", textEn: "Invite new team members" },
      { text: "Asigna roles y permisos a cada usuario", textEn: "Assign roles and permissions to each user" },
      { text: "Configura las notificaciones de la agencia", textEn: "Configure agency notifications" },
      { text: "Gestiona las integraciones y conexiones", textEn: "Manage integrations and connections" },
    ],
    detailLink: "/help/agency/settings",
  },
};

interface HelpPanelProps {
  helpKey: string;
  className?: string;
  iconSize?: "sm" | "md" | "lg";
}

export function HelpPanel({ helpKey, className = "", iconSize = "md" }: HelpPanelProps) {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const isEn = language === "en";

  const content = helpPanelContent[helpKey];

  if (!content) {
    return null;
  }

  const iconSizeClass = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }[iconSize];

  const buttonSizeClass = {
    sm: "h-7 w-7",
    md: "h-8 w-8",
    lg: "h-9 w-9",
  }[iconSize];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`${buttonSizeClass} rounded-full hover:bg-primary/10 ${className}`}
          data-testid={`button-help-${helpKey}`}
        >
          <HelpCircle className={`${iconSizeClass} text-muted-foreground hover:text-primary`} />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md"
        data-testid={`sheet-help-${helpKey}`}
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2" data-testid={`title-help-${helpKey}`}>
            <HelpCircle className="h-5 w-5 text-primary" />
            {isEn ? content.titleEn : content.title}
          </SheetTitle>
          <SheetDescription data-testid={`desc-help-${helpKey}`}>
            {isEn ? content.descriptionEn : content.description}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] mt-6 pr-4">
          <div className="space-y-4">
            <ul className="space-y-3">
              {content.bullets.map((bullet, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-3"
                  data-testid={`bullet-help-${helpKey}-${index}`}
                >
                  <ChevronRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {isEn ? bullet.textEn : bullet.text}
                  </span>
                </li>
              ))}
            </ul>

            {content.detailLink && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => {
                    setOpen(false);
                    setLocation(content.detailLink!);
                  }}
                  data-testid={`button-help-detail-${helpKey}`}
                >
                  <span>
                    {isEn ? "View complete guide" : "Ver guía completa"}
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export function SectionHeader({ 
  title, 
  helpKey, 
  children 
}: { 
  title: string; 
  helpKey: string; 
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
      <h2 className="text-xl font-semibold" data-testid={`heading-${helpKey}`}>{title}</h2>
      <div className="flex items-center gap-2">
        {children}
        <HelpPanel helpKey={helpKey} />
      </div>
    </div>
  );
}

interface EmptyStateContent {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  defaultActions: Array<{
    label: string;
    labelEn: string;
    href?: string;
    variant?: "default" | "outline" | "secondary";
  }>;
}

const emptyStateContent: Record<string, EmptyStateContent> = {
  "tenant-payments": {
    title: "Sin pagos registrados",
    titleEn: "No payments registered",
    description: "Aquí verás tu historial de pagos de renta y servicios. En cuanto registremos tu primer pago, aparecerá en esta lista.",
    descriptionEn: "Here you will see your rent and service payment history. As soon as we register your first payment, it will appear in this list.",
    defaultActions: [
      { label: "Ver mi contrato", labelEn: "View my contract", href: "/portal/tenant?tab=contract", variant: "outline" },
    ],
  },
  "tenant-maintenance": {
    title: "Sin tickets de mantenimiento",
    titleEn: "No maintenance tickets",
    description: "¡Todo en orden! No tienes tickets de mantenimiento abiertos. Si algo necesita atención, puedes crear un nuevo ticket.",
    descriptionEn: "All good! You don't have any open maintenance tickets. If something needs attention, you can create a new ticket.",
    defaultActions: [
      { label: "Crear primer ticket", labelEn: "Create first ticket", variant: "default" },
    ],
  },
  "tenant-documents": {
    title: "Sin documentos disponibles",
    titleEn: "No documents available",
    description: "Los documentos de tu contrato aparecerán aquí cuando estén disponibles. Esto incluye tu contrato, recibos y reglamentos.",
    descriptionEn: "Your contract documents will appear here when available. This includes your lease, receipts, and regulations.",
    defaultActions: [],
  },
  "owner-payments": {
    title: "Sin movimientos registrados",
    titleEn: "No movements registered",
    description: "Aquí podrás revisar pagos marcados por tu inquilino y verificarlos. Por ahora no hay movimientos registrados para este contrato.",
    descriptionEn: "Here you can review payments marked by your tenant and verify them. Currently there are no movements registered for this contract.",
    defaultActions: [
      { label: "Ver propiedades", labelEn: "View properties", href: "/mis-propiedades", variant: "outline" },
    ],
  },
  "owner-maintenance": {
    title: "Sin tickets de mantenimiento",
    titleEn: "No maintenance tickets",
    description: "¡Excelente! No hay tickets de mantenimiento pendientes en tus propiedades. Los inquilinos pueden reportar problemas desde su portal.",
    descriptionEn: "Excellent! There are no pending maintenance tickets on your properties. Tenants can report issues from their portal.",
    defaultActions: [
      { label: "Ver propiedades", labelEn: "View properties", href: "/mis-propiedades", variant: "outline" },
    ],
  },
  "owner-documents": {
    title: "Sin documentos disponibles",
    titleEn: "No documents available",
    description: "Los documentos de tus contratos y propiedades aparecerán aquí. Esto incluye contratos, reportes financieros y documentos legales.",
    descriptionEn: "Documents for your contracts and properties will appear here. This includes contracts, financial reports, and legal documents.",
    defaultActions: [],
  },
  "seller-leads": {
    title: "Todavía no tienes leads",
    titleEn: "No leads yet",
    description: "Empieza compartiendo tu catálogo o tu link de captación para recibir interesados. Los leads que generes aparecerán aquí.",
    descriptionEn: "Start sharing your catalog or capture link to receive interested prospects. The leads you generate will appear here.",
    defaultActions: [
      { label: "Ver catálogo de propiedades", labelEn: "View property catalog", href: "/seller-catalog", variant: "default" },
      { label: "Copiar mi link de captación", labelEn: "Copy my capture link", variant: "outline" },
    ],
  },
  "external-leads": {
    title: "Sin leads asignados",
    titleEn: "No assigned leads",
    description: "Todavía no tienes leads asignados. Los leads que captures o te asignen aparecerán aquí para que les des seguimiento.",
    descriptionEn: "You don't have any assigned leads yet. Leads you capture or are assigned will appear here for follow-up.",
    defaultActions: [
      { label: "Ver catálogo", labelEn: "View catalog", href: "/seller-catalog", variant: "default" },
      { label: "Invitar agente", labelEn: "Invite agent", href: "/external/agency/team", variant: "outline" },
    ],
  },
  "agency-team": {
    title: "Sin miembros en el equipo",
    titleEn: "No team members",
    description: "Invita a los miembros de tu agencia para que puedan gestionar propiedades y leads junto contigo.",
    descriptionEn: "Invite your agency members so they can manage properties and leads with you.",
    defaultActions: [
      { label: "Invitar primer miembro", labelEn: "Invite first member", variant: "default" },
    ],
  },
};

interface EnhancedEmptyStateProps {
  stateKey: string;
  icon?: ReactNode;
  className?: string;
  onAction?: (href?: string) => void;
  customActions?: Array<{
    label: string;
    labelEn?: string;
    href?: string;
    onClick?: () => void;
    variant?: "default" | "outline" | "secondary";
  }>;
}

export function EnhancedEmptyState({ 
  stateKey, 
  icon, 
  className = "",
  onAction,
  customActions,
}: EnhancedEmptyStateProps) {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const isEn = language === "en";

  const content = emptyStateContent[stateKey];

  const defaultIcon = (
    <div className="rounded-full bg-muted p-4">
      <FolderOpen className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
    </div>
  );

  if (!content) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          {defaultIcon}
          <p className="text-muted-foreground mt-4">
            {isEn ? "No data available" : "No hay datos disponibles"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const actions = customActions || content.defaultActions;

  return (
    <Card className={cn("border-dashed", className)} data-testid={`empty-state-${stateKey}`}>
      <CardContent className="flex flex-col items-center justify-center py-10 md:py-12 px-4 text-center">
        {icon || defaultIcon}
        
        <h3 
          className="text-lg font-semibold mb-2 mt-4"
          data-testid={`empty-state-title-${stateKey}`}
        >
          {isEn ? content.titleEn : content.title}
        </h3>
        
        <p 
          className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed"
          data-testid={`empty-state-desc-${stateKey}`}
        >
          {isEn ? content.descriptionEn : content.description}
        </p>

        {actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "default"}
                onClick={() => {
                  if ('onClick' in action && action.onClick) {
                    action.onClick();
                  } else if (action.href) {
                    if (onAction) {
                      onAction(action.href);
                    } else {
                      setLocation(action.href);
                    }
                  }
                }}
                className="w-full sm:w-auto"
                data-testid={`empty-state-action-${stateKey}-${index}`}
              >
                {isEn ? (action.labelEn || action.label) : action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
