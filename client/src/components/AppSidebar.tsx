import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { DraggableSidebarSection, SortableMenuItem, SortableMenuSubItem } from "@/components/DraggableSidebarSection";
import {
  Home,
  Building2,
  Calendar,
  Clock,
  Users,
  ClipboardList,
  FolderKanban,
  Settings,
  Settings2,
  UserCog,
  Store,
  CreditCard,
  FileText,
  ListTodo,
  Search,
  Heart,
  FileEdit,
  ClipboardCheck,
  CalendarCheck,
  Bell,
  MessageCircle,
  User,
  HelpCircle,
  Plus,
  Zap,
  Bot,
  Share2,
  MessageSquare,
  DollarSign,
  MapPin,
  BookOpen,
  ChevronDown,
  Building,
  Cog,
  MessagesSquare,
  Plug,
  TrendingUp,
  Upload,
  Link2,
  Wrench,
  Key,
  HardHat,
  UserCircle2,
  ScrollText,
  FileCheck,
  KeyRound,
  BarChart3,
  Target,
  UserCheck,
  Star,
} from "lucide-react";
import logoUrl from "@assets/H mes (500 x 300 px)_1759672952263.png";
import logoIconUrl from "@assets/Sin título (6 x 6 cm)_1759706217639.png";
import { Link, useLocation } from "wouter";
import { RoleToggle } from "@/components/RoleToggle";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export type UserRole = "master" | "admin" | "admin_jr" | "seller" | "owner" | "management" | "concierge" | "provider" | "cliente" | "abogado" | "contador" | "agente_servicios_especiales" | "hoa_manager" | "external_agency_admin" | "external_agency_accounting" | "external_agency_maintenance" | "external_agency_staff" | "external_agency_concierge" | "external_agency_lawyer" | "external_agency_seller" | "sales_agent" | "tenant";

export type AppSidebarProps = {
  userRole: UserRole | undefined;
  userId?: string;
};

const roleLabels: Record<UserRole, string> = {
  master: "Master",
  admin: "Administrador",
  admin_jr: "Admin Jr",
  seller: "Vendedor",
  owner: "Propietario",
  management: "Management",
  concierge: "Conserje",
  provider: "Proveedor",
  cliente: "Cliente",
  abogado: "Abogado",
  contador: "Contador",
  agente_servicios_especiales: "Agente de Servicios Especiales",
  hoa_manager: "Administrador HOA",
  external_agency_admin: "Admin Agencia Externa",
  external_agency_accounting: "Contabilidad Externa",
  external_agency_maintenance: "Mantenimiento Externo",
  external_agency_staff: "Staff Agencia Externa",
  external_agency_concierge: "Conserje Externo",
  external_agency_lawyer: "Abogado Externo",
  external_agency_seller: "Vendedor Externo",
  sales_agent: "Agente de Ventas",
  tenant: "Inquilino",
};

export function AppSidebar({ userRole, userId }: AppSidebarProps) {
  const [location] = useLocation();
  const { t, language } = useLanguage();
  const { state } = useSidebar();

  // Determine if user is from external agency
  const isExternalUser = userRole?.startsWith('external_agency_') || false;

  // Fetch sidebar visibility configurations for the current role
  const { data: roleVisibilityConfig } = useQuery<
    Array<{menuItemKey: string, visible: boolean}>,
    Error,
    Record<string, boolean>,
    any[]
  >({
    queryKey: ['/api/admin/sidebar-config', userRole],
    enabled: !!userRole && userRole !== "master" && userRole !== "admin",
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    select: (data) => {
      const config: Record<string, boolean> = {};
      data?.forEach((item) => {
        config[item.menuItemKey] = item.visible;
      });
      return config;
    },
  });

  // Fetch sidebar visibility configurations for the current user (overrides role config)
  const { data: userVisibilityConfig } = useQuery<
    Array<{menuItemKey: string, visible: boolean}>,
    Error,
    Record<string, boolean>,
    any[]
  >({
    queryKey: ['/api/admin/sidebar-config-user', userId],
    enabled: !!userId && !!userRole && userRole !== "master" && userRole !== "admin",
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    select: (data) => {
      const config: Record<string, boolean> = {};
      data?.forEach((item) => {
        config[item.menuItemKey] = item.visible;
      });
      return config;
    },
  });

  // Helper function to check if a menu item should be visible
  const isMenuItemVisible = (menuItemKey: string): boolean => {
    // Master and admin users see everything
    if (userRole === "master" || userRole === "admin") {
      return true;
    }
    
    // User-specific config takes priority over role config
    if (userVisibilityConfig && menuItemKey in userVisibilityConfig) {
      return userVisibilityConfig[menuItemKey];
    }
    
    // Fall back to role config
    if (roleVisibilityConfig && menuItemKey in roleVisibilityConfig) {
      return roleVisibilityConfig[menuItemKey];
    }
    
    // Default to visible if no config found
    return true;
  };

  const [openGroups, setOpenGroups] = useState({
    processManagement: false,
    usersAndRoles: false,
    properties: false,
    config: false,
    community: false,
    externalManagement: false,
    clientProperties: false,
    clientActivity: false,
    clientFinance: false,
    ownerProperties: false,
    ownerActivity: false,
    ownerFinance: false,
    sellerFinance: false,
    // New admin sections
    adminInicio: false,
    adminRentas: false,
    adminPropiedades: false,
    adminPersonas: false,
    adminFinanzas: false,
    adminConfig: false,
  });

  const mainItems = [
    { titleKey: "sidebar.home", url: "/", icon: Home, roles: ["master", "admin", "admin_jr", "seller", "management", "concierge", "provider", "cliente"] },
    { titleKey: "sidebar.dashboard", url: "/owner/dashboard", icon: Home, roles: ["owner"] },
    { titleKey: "sidebar.notifications", url: "/notificaciones", icon: Bell, roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider", "cliente"] },
    { titleKey: "sidebar.messages", url: "/chat", icon: MessageCircle, roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider", "cliente"] },
    { titleKey: "sidebar.leads", url: "/leads", icon: Users, roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { titleKey: "sidebar.kanbanRentals", url: "/rentas", icon: FolderKanban, roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { titleKey: "sidebar.properties", url: "/properties", icon: Building2, roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { titleKey: "sidebar.appointments", url: "/appointments", icon: Calendar, roles: ["master", "admin", "admin_jr", "seller", "management", "concierge"] },
    { titleKey: "sidebar.sellerAppointments", url: "/seller/appointments", icon: CalendarCheck, roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { titleKey: "sidebar.conciergeSchedule", url: "/concierge/horarios", icon: Clock, roles: ["concierge"] },
    { titleKey: "sidebar.clients", url: "/clientes", icon: Users, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.incomeManagement", url: "/accountant/income", icon: DollarSign, roles: ["contador"] },
  ];

  // Client-specific groups
  const clientPropertiesGroup = [
    { titleKey: "sidebar.searchProperties", url: "/buscar-propiedades", icon: Search, roles: ["cliente"] },
    { titleKey: "sidebar.favorites", url: "/favoritos", icon: Heart, roles: ["cliente"] },
    { titleKey: "sidebar.cards", url: "/cards", icon: CreditCard, roles: ["cliente"] },
  ];

  const clientActivityGroup = [
    { titleKey: "sidebar.myAppointments", url: "/mis-citas", icon: Calendar, roles: ["cliente"] },
    { titleKey: "sidebar.myApplications", url: "/mis-solicitudes", icon: ClipboardList, roles: ["cliente"] },
    { titleKey: "sidebar.externalAppointments", url: "/external-appointments", icon: Building2, roles: ["cliente", "owner"] },
    { titleKey: "sidebar.myOpportunities", url: "/mis-oportunidades", icon: Zap, roles: ["cliente"] },
    { titleKey: "sidebar.activeRentals", url: "/rentas-activas", icon: Home, roles: ["cliente"] },
  ];

  const clientFinanceGroup = [
    { titleKey: "sidebar.referrals", url: "/referidos", icon: Share2, roles: ["cliente"] },
    { titleKey: "sidebar.myIncome", url: "/mis-ingresos", icon: DollarSign, roles: ["cliente"] },
  ];

  // Owner-specific groups
  const ownerPropertiesGroup = [
    { titleKey: "sidebar.myProperties", url: "/mis-propiedades", icon: Building2, roles: ["owner"] },
  ];

  const ownerActivityGroup = [
    { titleKey: "sidebar.ownerVisits", url: "/owner/appointments", icon: Calendar, roles: ["owner"] },
    { titleKey: "sidebar.ownerActiveRentals", url: "/rentas-activas", icon: Home, roles: ["owner"] },
    { titleKey: "sidebar.ownerHoa", url: "/owner/hoa", icon: Building, roles: ["owner"] },
  ];

  const ownerFinanceGroup = [
    { titleKey: "sidebar.financialReport", url: "/owner/financial-report", icon: FileText, roles: ["owner"] },
    { titleKey: "sidebar.referrals", url: "/referidos", icon: Share2, roles: ["owner"] },
    { titleKey: "sidebar.myIncome", url: "/mis-ingresos", icon: DollarSign, roles: ["owner"] },
  ];

  // Sales Agent items (Homesapp sales)
  const salesAgentItems = [
    { titleKey: "sidebar.salesDashboard", url: "/sales/dashboard", icon: Home, roles: ["sales_agent", "master", "admin"] },
    { titleKey: "sidebar.salesBuyers", url: "/sales/buyers", icon: Users, roles: ["sales_agent", "master", "admin"] },
    { titleKey: "sidebar.salesProperties", url: "/sales/properties", icon: Building2, roles: ["sales_agent", "master", "admin"] },
    { titleKey: "sidebar.salesValuations", url: "/sales/valuations", icon: BarChart3, roles: ["sales_agent", "master", "admin"] },
    { titleKey: "sidebar.salesOffers", url: "/sales/offers", icon: FileText, roles: ["sales_agent", "master", "admin"] },
    { titleKey: "sidebar.salesContracts", url: "/sales/contracts", icon: ScrollText, roles: ["sales_agent", "master", "admin"] },
  ];

  // Seller finance group
  const sellerFinanceGroup = [
    { titleKey: "sidebar.referrals", url: "/referidos", icon: Share2, roles: ["seller", "master", "admin", "admin_jr"] },
    { titleKey: "sidebar.myIncome", url: "/mis-ingresos", icon: DollarSign, roles: ["seller"] },
  ];

  // ===== NEW ADMIN/MASTER SIDEBAR STRUCTURE =====
  // Section 1: Inicio (Home)
  const adminInicioGroup = [
    { titleKey: "sidebar.adminDashboard", url: "/admin/dashboard", icon: Home, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.incomeDashboard", url: "/admin/income", icon: DollarSign, roles: ["master", "admin"] },
  ];

  // Section 2: Operación de Rentas (Rental Operations)
  const adminRentasGroup = [
    { titleKey: "sidebar.leads", url: "/leads", icon: Users, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.kanbanRentals", url: "/rentas", icon: FolderKanban, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.adminAppointments", url: "/admin/appointments", icon: CalendarCheck, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.adminCalendar", url: "/admin/calendario", icon: Calendar, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.adminContracts", url: "/admin/contracts", icon: FileText, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.adminOffers", url: "/admin/offers", icon: FileText, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.adminTasks", url: "/admin/tasks", icon: ClipboardCheck, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.backoffice", url: "/backoffice", icon: ListTodo, roles: ["master", "admin", "admin_jr"] },
  ];

  // Section 3: Propiedades (Properties)
  const adminPropertiesGroup = [
    { titleKey: "sidebar.adminProperties", url: "/admin/properties", icon: Building2, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.condominiums", url: "/admin/condominiums", icon: Building2, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.hoaManagement", url: "/admin/hoa", icon: Building, roles: ["master", "admin"] },
    { titleKey: "sidebar.propertyInvitations", url: "/admin/property-invitations", icon: Link2, roles: ["master", "admin"] },
    { titleKey: "sidebar.importContacts", url: "/admin/import-contacts", icon: Upload, roles: ["master", "admin"] },
    { titleKey: "sidebar.changeRequests", url: "/admin/change-requests", icon: FileEdit, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.featuredProperties", url: "/admin/featured-properties", icon: Star, roles: ["master", "admin"] },
  ];

  // Section 4: Personas & Agencias (People & Agencies)
  const adminPersonasGroup = [
    { titleKey: "sidebar.adminSellers", url: "/admin/sellers", icon: Users, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.clients", url: "/clientes", icon: UserCircle2, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.externalAgenciesAdmin", url: "/admin/external-agencies", icon: Building, roles: ["master", "admin"] },
    { titleKey: "sidebar.userManagement", url: "/admin/users", icon: UserCog, roles: ["master", "admin"] },
  ];

  // Section 5: Finanzas (Finance)
  const adminFinanzasGroup = [
    { titleKey: "sidebar.incomeDashboard", url: "/admin/income", icon: DollarSign, roles: ["master", "admin"] },
    { titleKey: "sidebar.adminReferrals", url: "/admin/referidos", icon: Share2, roles: ["master", "admin", "admin_jr"] },
  ];

  // Section 6: Configuración & Sistema (Configuration & System)
  const adminConfigGroup = [
    { titleKey: "sidebar.businessHours", url: "/admin/horarios", icon: Clock, roles: ["master", "admin"] },
    { titleKey: "sidebar.integrations", url: "/admin/integrations", icon: Plug, roles: ["master", "admin"] },
    { titleKey: "sidebar.permissions", url: "/permissions", icon: Settings, roles: ["master", "admin"] },
    { titleKey: "sidebar.sidebarConfig", url: "/admin/sidebar-config", icon: Settings2, roles: ["master", "admin"] },
    { titleKey: "sidebar.agreementTemplates", url: "/admin/agreement-templates", icon: FileText, roles: ["master", "admin"] },
    { titleKey: "sidebar.feedbackManagement", url: "/admin/feedback", icon: MessageSquare, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.changelog", url: "/admin/changelog", icon: BookOpen, roles: ["master", "admin"] },
  ];

  // Legacy items for backward compatibility and other roles
  const adminSingleItems = [
    { titleKey: "sidebar.backoffice", url: "/backoffice", icon: FolderKanban, roles: ["management", "concierge", "provider"] },
  ];

  const processManagementGroup = [
    { titleKey: "sidebar.adminAppointments", url: "/admin/appointments", icon: CalendarCheck, roles: [] },
    { titleKey: "sidebar.adminSellers", url: "/admin/sellers", icon: Users, roles: [] },
    { titleKey: "sidebar.adminTasks", url: "/admin/tasks", icon: ClipboardCheck, roles: [] },
    { titleKey: "sidebar.adminContracts", url: "/admin/contracts", icon: FileText, roles: [] },
    { titleKey: "sidebar.adminOffers", url: "/admin/offers", icon: FileText, roles: [] },
    { titleKey: "sidebar.adminCalendar", url: "/admin/calendario", icon: Calendar, roles: [] },
    { titleKey: "sidebar.businessHours", url: "/admin/horarios", icon: Clock, roles: [] },
    { titleKey: "sidebar.assignProperties", url: "/admin/asignar-propiedades", icon: Building2, roles: [] },
  ];

  const usersAndRolesGroup = [
    { titleKey: "sidebar.userManagement", url: "/admin/users", icon: UserCog, roles: [] },
    { titleKey: "sidebar.externalAgenciesAdmin", url: "/admin/external-agencies", icon: Building, roles: [] },
    { titleKey: "sidebar.externalPublicationRequests", url: "/admin/external-publication-requests", icon: FileCheck, roles: [] },
    { titleKey: "sidebar.featuredProperties", url: "/admin/featured-properties", icon: Star, roles: [] },
    { titleKey: "sidebar.permissions", url: "/permissions", icon: Settings, roles: [] },
  ];

  const propertiesGroup = [
    { titleKey: "sidebar.adminProperties", url: "/admin/properties", icon: Building2, roles: [] },
    { titleKey: "sidebar.propertyInvitations", url: "/admin/property-invitations", icon: Link2, roles: [] },
    { titleKey: "sidebar.importContacts", url: "/admin/import-contacts", icon: Upload, roles: [] },
    { titleKey: "sidebar.changeRequests", url: "/admin/change-requests", icon: FileEdit, roles: [] },
    { titleKey: "sidebar.propertyLimitRequests", url: "/admin/property-limit-requests", icon: TrendingUp, roles: [] },
    { titleKey: "sidebar.inspectionReports", url: "/admin/inspection-reports", icon: ClipboardCheck, roles: [] },
    { titleKey: "sidebar.condominiums", url: "/admin/condominiums", icon: Building2, roles: [] },
    { titleKey: "sidebar.hoaManagement", url: "/admin/hoa", icon: Building, roles: ["management"] },
  ];

  const configGroup = [
    { titleKey: "sidebar.agreementTemplates", url: "/admin/agreement-templates", icon: FileText, roles: [] },
    { titleKey: "sidebar.propertyOwnerTerms", url: "/admin/property-owner-terms", icon: FileText, roles: [] },
    { titleKey: "sidebar.chatbotConfig", url: "/admin/chatbot-config", icon: Bot, roles: [] },
    { titleKey: "sidebar.sidebarConfig", url: "/admin/sidebar-config", icon: Settings2, roles: [] },
    { titleKey: "sidebar.integrations", url: "/admin/integrations", icon: Plug, roles: [] },
    { titleKey: "sidebar.changelog", url: "/admin/changelog", icon: BookOpen, roles: [] },
  ];

  const communityGroup = [
    { titleKey: "sidebar.feedbackManagement", url: "/admin/feedback", icon: MessageSquare, roles: [] },
    { titleKey: "sidebar.adminReferrals", url: "/admin/referidos", icon: Share2, roles: [] },
  ];

  const externalManagementGroup = [
    { titleKey: "sidebar.externalDashboard", url: "/external/dashboard", icon: Home, roles: ["master", "admin", "external_agency_admin", "external_agency_accounting", "external_agency_maintenance", "external_agency_staff", "external_agency_concierge", "external_agency_lawyer", "external_agency_seller"] },
    { titleKey: "sidebar.externalLeadsGlobal", url: "/external/admin-leads", icon: FolderKanban, roles: ["master", "admin", "external_agency_admin"] },
    { titleKey: "sidebar.externalAccounts", url: "/external/accounts", icon: Users, roles: ["master", "admin", "external_agency_admin"] },
    { titleKey: "sidebar.externalSellersManagement", url: "/external/sellers-management", icon: UserCheck, roles: ["master", "admin", "external_agency_admin"] },
    { titleKey: "sidebar.externalAccesses", url: "/external/accesses", icon: Key, roles: ["master", "admin", "external_agency_admin", "external_agency_maintenance", "external_agency_staff"] },
    { titleKey: "sidebar.externalCondominiums", url: "/external/condominiums", icon: Building2, roles: ["master", "admin", "external_agency_admin", "external_agency_maintenance", "external_agency_staff"] },
    { titleKey: "sidebar.externalReferralNetwork", url: "/external/referral-network", icon: Share2, roles: ["master", "admin", "external_agency_admin"] },
    { titleKey: "sidebar.externalRecruitment", url: "/external/recruitment", icon: Target, roles: ["external_agency_seller"] },
    { titleKey: "sidebar.externalContracts", url: "/external/contracts", icon: ScrollText, roles: ["master", "admin", "external_agency_admin", "external_agency_staff", "external_agency_lawyer"] },
    { titleKey: "sidebar.externalRentals", url: "/external/rentals", icon: FileText, roles: ["master", "admin", "external_agency_admin", "external_agency_accounting"] },
    { titleKey: "sidebar.externalAccounting", url: "/external/accounting", icon: DollarSign, roles: ["master", "admin", "external_agency_admin", "external_agency_accounting"] },
    { titleKey: "sidebar.externalMaintenance", url: "/external/maintenance", icon: Wrench, roles: ["master", "admin", "external_agency_admin", "external_agency_maintenance"] },
    { titleKey: "sidebar.externalCalendar", url: "/external/calendar", icon: Calendar, roles: ["master", "admin", "external_agency_admin", "external_agency_accounting", "external_agency_maintenance", "external_agency_concierge"] },
    { titleKey: "sidebar.externalAppointments", url: "/external-appointments", icon: CalendarCheck, roles: ["master", "admin", "external_agency_admin", "external_agency_staff", "external_agency_concierge", "external_agency_lawyer"] },
    { titleKey: "sidebar.externalOwners", url: "/external/owners/portfolio", icon: Users, roles: ["master", "admin", "external_agency_admin", "external_agency_accounting"] },
    { titleKey: "sidebar.externalClients", url: "/external/clients", icon: UserCircle2, roles: ["master", "admin", "external_agency_admin", "external_agency_staff", "external_agency_concierge"] },
    { titleKey: "sidebar.externalMessages", url: "/external/messages", icon: MessagesSquare, roles: ["master", "admin", "external_agency_admin", "external_agency_accounting", "external_agency_maintenance", "external_agency_staff", "external_agency_concierge", "external_agency_lawyer", "external_agency_seller"] },
    { titleKey: "sidebar.sellerLeads", url: "/external/clients", icon: Users, roles: ["external_agency_seller"] },
    { titleKey: "sidebar.sellerCalendar", url: "/external/seller-calendar", icon: Calendar, roles: ["external_agency_seller"] },
    { titleKey: "sidebar.sellerCatalog", url: "/external/seller-catalog", icon: Home, roles: ["external_agency_seller"] },
    { titleKey: "sidebar.sellerSocialMedia", url: "/external/seller-social-media", icon: Share2, roles: ["external_agency_seller"] },
    { titleKey: "sidebar.sellerReports", url: "/external/seller-reports", icon: BarChart3, roles: ["external_agency_seller"] },
    { titleKey: "sidebar.sellerCommissions", url: "/external/seller-commissions", icon: DollarSign, roles: ["external_agency_seller"] },
    { titleKey: "sidebar.sellerGoals", url: "/external/seller-goals", icon: Target, roles: ["external_agency_seller"] },
  ];

  const serviceItems = [
    { titleKey: "sidebar.directory", url: "/directory", icon: Store, roles: ["master", "admin", "admin_jr", "owner", "management"] },
    { titleKey: "sidebar.myServices", url: "/my-services", icon: CreditCard, roles: ["provider"] },
  ];

  const basicItems = [
    { titleKey: "sidebar.home", url: "/", icon: Home },
    { titleKey: "sidebar.notifications", url: "/notificaciones", icon: Bell },
    { titleKey: "sidebar.messages", url: "/chat", icon: MessageCircle },
    { titleKey: "sidebar.feedback", url: "/feedback", icon: MessageSquare },
    { titleKey: "sidebar.profile", url: "/perfil", icon: User },
  ];

  // Check if user is ONLY an external agency user (not admin/master)
  const isExternalAgencyUser = userRole && 
    ["external_agency_admin", "external_agency_accounting", "external_agency_maintenance", "external_agency_staff", "external_agency_concierge", "external_agency_lawyer", "external_agency_seller"].includes(userRole);
  
  // Check if user is a sales agent
  const isSalesAgent = userRole === "sales_agent";

  const filteredMain = userRole 
    ? (isExternalAgencyUser || isSalesAgent
        ? [] // External agency users and sales agents don't see main items - they have their own section
        : mainItems.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
      )
    : basicItems;
  
  // Sales agent items
  const filteredSalesAgent = userRole 
    ? salesAgentItems.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];
  
  const filteredAdminSingle = userRole 
    ? adminSingleItems.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const filteredProcessManagement = userRole 
    ? processManagementGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const filteredUsersAndRoles = userRole 
    ? usersAndRolesGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const filteredProperties = userRole 
    ? propertiesGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const filteredConfig = userRole 
    ? configGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const filteredCommunity = userRole 
    ? communityGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const filteredExternalManagement = userRole 
    ? externalManagementGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const filteredService = userRole 
    ? serviceItems.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const filteredClientProperties = userRole 
    ? clientPropertiesGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const filteredClientActivity = userRole 
    ? clientActivityGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const filteredClientFinance = userRole 
    ? clientFinanceGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const filteredOwnerProperties = userRole 
    ? ownerPropertiesGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const filteredOwnerActivity = userRole 
    ? ownerActivityGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const filteredOwnerFinance = userRole 
    ? ownerFinanceGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const filteredSellerFinance = userRole 
    ? sellerFinanceGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  // Check if user is admin/master for new sidebar structure
  const isAdminMaster = userRole === "master" || userRole === "admin";
  const isAdminJr = userRole === "admin_jr";

  // New admin sections (for master/admin roles)
  const filteredAdminInicio = userRole 
    ? adminInicioGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];
  
  const filteredAdminRentas = userRole 
    ? adminRentasGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];
  
  const filteredAdminPropiedades = userRole 
    ? adminPropertiesGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];
  
  const filteredAdminPersonas = userRole 
    ? adminPersonasGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];
  
  const filteredAdminFinanzas = userRole 
    ? adminFinanzasGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];
  
  const filteredAdminConfig = userRole 
    ? adminConfigGroup.filter((item) => item.roles.includes(userRole) && isMenuItemVisible(item.titleKey))
    : [];

  const hasNewAdminSidebar = isAdminMaster || isAdminJr;

  const hasAdminItems = filteredAdminSingle.length > 0 || 
                        filteredProcessManagement.length > 0 ||
                        filteredUsersAndRoles.length > 0 || 
                        filteredProperties.length > 0 || 
                        filteredConfig.length > 0 || 
                        filteredCommunity.length > 0 ||
                        (filteredExternalManagement.length > 0 && !isExternalAgencyUser);

  const hasClientGroups = filteredClientProperties.length > 0 || 
                          filteredClientActivity.length > 0 || 
                          filteredClientFinance.length > 0;

  const hasOwnerGroups = filteredOwnerProperties.length > 0 || 
                         filteredOwnerActivity.length > 0 || 
                         filteredOwnerFinance.length > 0;

  const isGroupActive = (items: typeof usersAndRolesGroup) => {
    return items.some(item => location === item.url || location.startsWith(item.url + '/'));
  };

  useEffect(() => {
    setOpenGroups({
      processManagement: isGroupActive(processManagementGroup),
      usersAndRoles: isGroupActive(usersAndRolesGroup),
      properties: isGroupActive(propertiesGroup),
      config: isGroupActive(configGroup),
      community: isGroupActive(communityGroup),
      externalManagement: isGroupActive(externalManagementGroup),
      clientProperties: isGroupActive(clientPropertiesGroup),
      clientActivity: isGroupActive(clientActivityGroup),
      clientFinance: isGroupActive(clientFinanceGroup),
      ownerProperties: isGroupActive(ownerPropertiesGroup),
      ownerActivity: isGroupActive(ownerActivityGroup),
      ownerFinance: isGroupActive(ownerFinanceGroup),
      sellerFinance: isGroupActive(sellerFinanceGroup),
      // New admin sections
      adminInicio: isGroupActive(adminInicioGroup),
      adminRentas: isGroupActive(adminRentasGroup),
      adminPropiedades: isGroupActive(adminPropertiesGroup),
      adminPersonas: isGroupActive(adminPersonasGroup),
      adminFinanzas: isGroupActive(adminFinanzasGroup),
      adminConfig: isGroupActive(adminConfigGroup),
    });
  }, [location]);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <Link href="/" data-testid="link-logo-home" className="block">
            <div className={state === "expanded" ? "flex flex-col items-center justify-center px-4 py-3 hover-elevate rounded-lg cursor-pointer" : "flex flex-col items-center justify-center p-2 hover-elevate rounded-lg cursor-pointer"}>
              {state === "expanded" ? (
                <>
                  <img 
                    src={logoUrl} 
                    alt="HomesApp Logo" 
                    className="h-16 w-auto object-contain"
                    data-testid="img-sidebar-logo"
                  />
                  <span className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">Smart Real Estate</span>
                </>
              ) : (
                <img 
                  src={logoIconUrl} 
                  alt="HomesApp" 
                  className="h-10 w-10 object-contain"
                  data-testid="img-sidebar-logo-icon"
                />
              )}
            </div>
          </Link>
        </SidebarGroup>
        {filteredMain.length > 0 && (
          <SidebarGroup>
            {!hasClientGroups && <SidebarGroupLabel>{t("sidebar.main")}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMain.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                        <item.icon />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                
                {/* Client items - flat structure without collapsibles */}
                {[...filteredClientProperties, ...filteredClientActivity, ...filteredClientFinance].map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                        <item.icon />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Sales Agent Users - Homesapp Sales */}
        {isSalesAgent && filteredSalesAgent.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{language === "es" ? "Ventas Homesapp" : "Homesapp Sales"}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSalesAgent.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                        <item.icon />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* External Agency Users - Flat structure with drag & drop */}
        {isExternalAgencyUser && filteredExternalManagement.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <DraggableSidebarSection items={filteredExternalManagement} userRole={userRole}>
                  {(orderedItems) =>
                    orderedItems.map((item) => (
                      <SortableMenuItem key={item.titleKey} item={item}>
                        <SidebarMenuButton asChild isActive={location === item.url}>
                          <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                            <item.icon />
                            <span>{t(item.titleKey)}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SortableMenuItem>
                    ))
                  }
                </DraggableSidebarSection>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ===== NEW ADMIN/MASTER SIDEBAR STRUCTURE ===== */}
        {hasNewAdminSidebar && (
          <>
            {/* Section 1: Inicio */}
            {filteredAdminInicio.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>{language === "es" ? "Inicio" : "Home"}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredAdminInicio.map((item) => (
                      <SidebarMenuItem key={item.titleKey}>
                        <SidebarMenuButton asChild isActive={location === item.url}>
                          <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                            <item.icon />
                            <span>{t(item.titleKey)}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Section 2: Operación de Rentas */}
            {filteredAdminRentas.length > 0 && (
              <SidebarGroup>
                <Collapsible 
                  open={openGroups.adminRentas}
                  onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, adminRentas: open }))}
                  className="group/collapsible">
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex w-full items-center justify-between cursor-pointer hover-elevate rounded px-2 py-1" data-testid="collapsible-admin-rentas">
                      <span>{language === "es" ? "Operación de Rentas" : "Rental Operations"}</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {filteredAdminRentas.map((item) => (
                          <SidebarMenuItem key={item.titleKey}>
                            <SidebarMenuButton asChild isActive={location === item.url}>
                              <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                                <item.icon />
                                <span>{t(item.titleKey)}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}

            {/* Section 3: Propiedades */}
            {filteredAdminPropiedades.length > 0 && (
              <SidebarGroup>
                <Collapsible 
                  open={openGroups.adminPropiedades}
                  onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, adminPropiedades: open }))}
                  className="group/collapsible">
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex w-full items-center justify-between cursor-pointer hover-elevate rounded px-2 py-1" data-testid="collapsible-admin-propiedades">
                      <span>{language === "es" ? "Propiedades" : "Properties"}</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {filteredAdminPropiedades.map((item) => (
                          <SidebarMenuItem key={item.titleKey}>
                            <SidebarMenuButton asChild isActive={location === item.url}>
                              <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                                <item.icon />
                                <span>{t(item.titleKey)}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}

            {/* Section 4: Personas & Agencias */}
            {filteredAdminPersonas.length > 0 && (
              <SidebarGroup>
                <Collapsible 
                  open={openGroups.adminPersonas}
                  onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, adminPersonas: open }))}
                  className="group/collapsible">
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex w-full items-center justify-between cursor-pointer hover-elevate rounded px-2 py-1" data-testid="collapsible-admin-personas">
                      <span>{language === "es" ? "Personas & Agencias" : "People & Agencies"}</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {filteredAdminPersonas.map((item) => (
                          <SidebarMenuItem key={item.titleKey}>
                            <SidebarMenuButton asChild isActive={location === item.url}>
                              <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                                <item.icon />
                                <span>{t(item.titleKey)}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}

            {/* Section 5: Finanzas */}
            {filteredAdminFinanzas.length > 0 && (
              <SidebarGroup>
                <Collapsible 
                  open={openGroups.adminFinanzas}
                  onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, adminFinanzas: open }))}
                  className="group/collapsible">
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex w-full items-center justify-between cursor-pointer hover-elevate rounded px-2 py-1" data-testid="collapsible-admin-finanzas">
                      <span>{language === "es" ? "Finanzas" : "Finance"}</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {filteredAdminFinanzas.map((item) => (
                          <SidebarMenuItem key={item.titleKey}>
                            <SidebarMenuButton asChild isActive={location === item.url}>
                              <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                                <item.icon />
                                <span>{t(item.titleKey)}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}

            {/* Section 6: Configuración & Sistema */}
            {filteredAdminConfig.length > 0 && (
              <SidebarGroup>
                <Collapsible 
                  open={openGroups.adminConfig}
                  onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, adminConfig: open }))}
                  className="group/collapsible">
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex w-full items-center justify-between cursor-pointer hover-elevate rounded px-2 py-1" data-testid="collapsible-admin-config">
                      <span>{language === "es" ? "Configuración & Sistema" : "Settings & System"}</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {filteredAdminConfig.map((item) => (
                          <SidebarMenuItem key={item.titleKey}>
                            <SidebarMenuButton asChild isActive={location === item.url}>
                              <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                                <item.icon />
                                <span>{t(item.titleKey)}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}

            {/* External Management for admin/master only */}
            {filteredExternalManagement.length > 0 && (
              <SidebarGroup>
                <Collapsible 
                  open={openGroups.externalManagement}
                  onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, externalManagement: open }))}
                  className="group/collapsible">
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex w-full items-center justify-between cursor-pointer hover-elevate rounded px-2 py-1" data-testid="collapsible-external-management-new">
                      <span>{language === "es" ? "Gestión Externa (TRH)" : "External Management (TRH)"}</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {filteredExternalManagement.map((item) => (
                          <SidebarMenuItem key={item.titleKey}>
                            <SidebarMenuButton asChild isActive={location === item.url}>
                              <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                                <item.icon />
                                <span>{t(item.titleKey)}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}
          </>
        )}

        {/* Legacy Admin Section - only for non-admin/master roles with admin access */}
        {hasAdminItems && !hasNewAdminSidebar && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.administration")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminSingle.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                        <item.icon />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {filteredProcessManagement.length > 0 && (
                  <Collapsible 
                    open={openGroups.processManagement}
                    onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, processManagement: open }))}
                    className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton data-testid="collapsible-process-management">
                          <ClipboardList />
                          <span>Gestión de Procesos</span>
                          <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {filteredProcessManagement.map((item) => (
                            <SidebarMenuSubItem key={item.titleKey}>
                              <SidebarMenuSubButton asChild isActive={location === item.url}>
                                <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                                  <item.icon />
                                  <span>{t(item.titleKey)}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}

                {filteredUsersAndRoles.length > 0 && (
                  <Collapsible 
                    open={openGroups.usersAndRoles}
                    onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, usersAndRoles: open }))}
                    className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton data-testid="collapsible-users-roles">
                          <UserCog />
                          <span>Usuarios y Roles</span>
                          <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {filteredUsersAndRoles.map((item) => (
                            <SidebarMenuSubItem key={item.titleKey}>
                              <SidebarMenuSubButton asChild isActive={location === item.url}>
                                <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                                  <item.icon />
                                  <span>{t(item.titleKey)}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}

                {filteredProperties.length > 0 && (
                  <Collapsible 
                    open={openGroups.properties}
                    onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, properties: open }))}
                    className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton data-testid="collapsible-properties">
                          <Building />
                          <span>Propiedades</span>
                          <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {filteredProperties.map((item) => (
                            <SidebarMenuSubItem key={item.titleKey}>
                              <SidebarMenuSubButton asChild isActive={location === item.url}>
                                <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                                  <item.icon />
                                  <span>{t(item.titleKey)}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}

                {filteredConfig.length > 0 && (
                  <Collapsible 
                    open={openGroups.config}
                    onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, config: open }))}
                    className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton data-testid="collapsible-config">
                          <Cog />
                          <span>Configuración</span>
                          <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {filteredConfig.map((item) => (
                            <SidebarMenuSubItem key={item.titleKey}>
                              <SidebarMenuSubButton asChild isActive={location === item.url}>
                                <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                                  <item.icon />
                                  <span>{t(item.titleKey)}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}

                {filteredCommunity.length > 0 && (
                  <Collapsible 
                    open={openGroups.community}
                    onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, community: open }))}
                    className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton data-testid="collapsible-community">
                          <MessagesSquare />
                          <span>Comunidad</span>
                          <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {filteredCommunity.map((item) => (
                            <SidebarMenuSubItem key={item.titleKey}>
                              <SidebarMenuSubButton asChild isActive={location === item.url}>
                                <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                                  <item.icon />
                                  <span>{t(item.titleKey)}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}

                {filteredExternalManagement.length > 0 && (
                  <Collapsible 
                    open={openGroups.externalManagement}
                    onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, externalManagement: open }))}
                    className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton data-testid="collapsible-external-management">
                          <Building />
                          <span>{language === "es" ? "Gestión Externa" : "External Management"}</span>
                          <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <DraggableSidebarSection items={filteredExternalManagement} userRole={userRole}>
                            {(orderedItems) =>
                              orderedItems.map((item) => (
                                <SortableMenuSubItem key={item.titleKey} item={item}>
                                  <SidebarMenuSubButton asChild isActive={location === item.url}>
                                    <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                                      <item.icon />
                                      <span>{t(item.titleKey)}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SortableMenuSubItem>
                              ))
                            }
                          </DraggableSidebarSection>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Owner Items - flat structure without collapsibles */}
        {hasOwnerGroups && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {[...filteredOwnerProperties, ...filteredOwnerActivity, ...filteredOwnerFinance].map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                        <item.icon />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Seller Finance Group */}
        {filteredSellerFinance.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible 
                  open={openGroups.sellerFinance}
                  onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, sellerFinance: open }))}
                  className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton data-testid="collapsible-seller-finance">
                        <DollarSign />
                        <span>{language === "es" ? "Finanzas" : "Finance"}</span>
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {filteredSellerFinance.map((item) => (
                          <SidebarMenuSubItem key={item.titleKey}>
                            <SidebarMenuSubButton asChild isActive={location === item.url}>
                              <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                                <item.icon />
                                <span>{t(item.titleKey)}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredService.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.services")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredService.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`link-${item.titleKey.toLowerCase()}`}>
                        <item.icon />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className={state === "collapsed" ? "flex flex-col items-center gap-1 p-2 border-t" : "p-2 border-t space-y-1"}>
          <RoleToggle />
          {isExternalUser && userRole !== "external_agency_seller" ? (
            <Link href="/external/agency/settings" data-testid="link-configuration">
              <Button
                variant={state === "collapsed" ? "ghost" : "outline"}
                size={state === "expanded" ? "default" : "icon"}
                className={state === "collapsed" ? "border-0" : "w-full justify-start gap-2"}
                data-testid="button-configuration"
              >
                <Settings className="h-4 w-4" />
                {state === "expanded" && <span>{t("sidebar.configuration")}</span>}
              </Button>
            </Link>
          ) : (
            <Link href={userRole === "external_agency_seller" ? "/external/seller-help" : "/ayuda"} data-testid="link-help">
              <Button
                variant={state === "collapsed" ? "ghost" : "outline"}
                size={state === "expanded" ? "default" : "icon"}
                className={state === "collapsed" ? "border-0" : "w-full justify-start gap-2"}
                data-testid="button-help"
              >
                <HelpCircle className="h-4 w-4" />
                {state === "expanded" && <span>{t("help.title")}</span>}
              </Button>
            </Link>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
