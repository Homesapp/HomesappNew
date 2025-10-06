import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Home,
  Building2,
  Calendar,
  Users,
  ClipboardList,
  FolderKanban,
  Settings,
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
  UserPlus,
  Zap,
  Bot,
  Share2,
  MessageSquare,
  DollarSign,
  MapPin,
  BookOpen,
} from "lucide-react";
import logoUrl from "@assets/H mes (500 x 300 px)_1759672952263.png";
import logoIconUrl from "@assets/Sin título (6 x 6 cm)_1759706217639.png";
import { Link, useLocation } from "wouter";
import { RoleToggle } from "@/components/RoleToggle";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

export type UserRole = "master" | "admin" | "admin_jr" | "seller" | "owner" | "management" | "concierge" | "provider" | "cliente" | "abogado" | "contador" | "agente_servicios_especiales";

export type AppSidebarProps = {
  userRole: UserRole | undefined;
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
};

export function AppSidebar({ userRole }: AppSidebarProps) {
  const [location] = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const { t } = useLanguage();
  const { state } = useSidebar();

  const mainItems = [
    { titleKey: "sidebar.home", url: "/", icon: Home, roles: ["master", "admin", "admin_jr", "seller", "management", "concierge", "provider", "cliente"] },
    { titleKey: "sidebar.dashboard", url: "/owner/dashboard", icon: Home, roles: ["owner"] },
    { titleKey: "sidebar.searchProperties", url: "/buscar-propiedades", icon: Search, roles: ["cliente"] },
    { titleKey: "sidebar.appointments", url: "/mis-citas", icon: CalendarCheck, roles: ["cliente"] },
    { titleKey: "sidebar.favorites", url: "/favoritos", icon: Heart, roles: ["cliente"] },
    { titleKey: "sidebar.opportunities", url: "/mis-oportunidades", icon: Zap, roles: ["cliente"] },
    { titleKey: "sidebar.referrals", url: "/referidos", icon: Share2, roles: ["cliente", "owner", "master", "admin", "admin_jr", "seller"] },
    { titleKey: "sidebar.myIncome", url: "/mis-ingresos", icon: DollarSign, roles: ["cliente", "owner", "seller"] },
    { titleKey: "sidebar.myProperties", url: "/mis-propiedades", icon: Building2, roles: ["owner"] },
    { titleKey: "sidebar.uploadProperty", url: "/owner/property/new", icon: Plus, roles: ["owner"] },
    { titleKey: "sidebar.appointmentManagement", url: "/owner/appointments", icon: CalendarCheck, roles: ["owner"] },
    { titleKey: "sidebar.notifications", url: "/notificaciones", icon: Bell, roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider", "cliente"] },
    { titleKey: "sidebar.messages", url: "/chat", icon: MessageCircle, roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider", "cliente"] },
    { titleKey: "sidebar.feedback", url: "/feedback", icon: MessageSquare, roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider", "cliente"] },
    { titleKey: "sidebar.leads", url: "/leads", icon: Users, roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { titleKey: "sidebar.kanbanRentals", url: "/rentas", icon: FolderKanban, roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { titleKey: "sidebar.properties", url: "/properties", icon: Building2, roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { titleKey: "sidebar.appointments", url: "/appointments", icon: Calendar, roles: ["master", "admin", "admin_jr", "seller", "management", "concierge"] },
    { titleKey: "sidebar.calendar", url: "/calendario", icon: Calendar, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.budgets", url: "/presupuestos", icon: FileText, roles: ["master", "admin", "admin_jr", "owner", "management", "provider"] },
    { titleKey: "sidebar.tasks", url: "/tareas", icon: ListTodo, roles: ["master", "admin", "admin_jr", "management", "concierge"] },
    { titleKey: "sidebar.clients", url: "/clientes", icon: Users, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.cards", url: "/presentation-cards", icon: ClipboardList, roles: ["master", "admin", "admin_jr", "cliente"] },
    { titleKey: "sidebar.incomeManagement", url: "/accountant/income", icon: DollarSign, roles: ["contador"] },
    { titleKey: "sidebar.contracts", url: "/contratos", icon: FileText, roles: ["cliente", "owner", "abogado"] },
  ];

  const adminItems = [
    { titleKey: "sidebar.adminDashboard", url: "/admin/dashboard", icon: Home, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.adminCalendar", url: "/admin/calendario", icon: Calendar, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.backoffice", url: "/backoffice", icon: FolderKanban, roles: ["master", "admin", "admin_jr", "management", "concierge", "provider"] },
    { titleKey: "sidebar.changeRequests", url: "/admin/change-requests", icon: FileEdit, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.inspectionReports", url: "/admin/inspection-reports", icon: ClipboardCheck, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.agreementTemplates", url: "/admin/agreement-templates", icon: FileText, roles: ["master", "admin"] },
    { titleKey: "sidebar.condominiums", url: "/admin/condominiums", icon: Building2, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.suggestions", url: "/admin/suggestions", icon: MapPin, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.adminReferrals", url: "/admin/referidos", icon: Share2, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.chatbotConfig", url: "/admin/chatbot-config", icon: Bot, roles: ["master", "admin"] },
    { titleKey: "sidebar.feedbackManagement", url: "/admin/feedback", icon: MessageSquare, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.roleRequests", url: "/admin/role-requests", icon: UserCog, roles: ["master", "admin"] },
    { titleKey: "sidebar.createUser", url: "/admin/create-user", icon: UserPlus, roles: ["master", "admin"] },
    { titleKey: "sidebar.userManagement", url: "/users", icon: UserCog, roles: ["master", "admin"] },
    { titleKey: "sidebar.permissions", url: "/permissions", icon: Settings, roles: ["master", "admin"] },
    { titleKey: "sidebar.incomeDashboard", url: "/admin/income", icon: DollarSign, roles: ["master", "admin"] },
    { titleKey: "sidebar.changelog", url: "/admin/changelog", icon: BookOpen, roles: ["master", "admin"] },
  ];

  const serviceItems = [
    { titleKey: "sidebar.directory", url: "/directory", icon: Store, roles: ["master", "admin", "admin_jr", "owner", "management"] },
    { titleKey: "sidebar.myServices", url: "/my-services", icon: CreditCard, roles: ["provider"] },
  ];

  // For users without a role, show only basic navigation items (no privileged routes)
  const basicItems = [
    { titleKey: "sidebar.home", url: "/", icon: Home },
    { titleKey: "sidebar.notifications", url: "/notificaciones", icon: Bell },
    { titleKey: "sidebar.messages", url: "/chat", icon: MessageCircle },
    { titleKey: "sidebar.feedback", url: "/feedback", icon: MessageSquare },
    { titleKey: "sidebar.profile", url: "/perfil", icon: User },
  ];

  const filteredMain = userRole 
    ? mainItems.filter((item) => item.roles.includes(userRole))
    : basicItems;
  const filteredAdmin = userRole 
    ? adminItems.filter((item) => item.roles.includes(userRole))
    : [];
  const filteredService = userRole 
    ? serviceItems.filter((item) => item.roles.includes(userRole))
    : [];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-center px-4 py-3">
            {state === "expanded" ? (
              <img 
                src={logoUrl} 
                alt="HomesApp Logo" 
                className="h-16 w-auto object-contain"
                data-testid="img-sidebar-logo"
              />
            ) : (
              <img 
                src={logoIconUrl} 
                alt="HomesApp" 
                className="h-8 w-8 object-contain"
                data-testid="img-sidebar-logo-icon"
              />
            )}
          </div>
        </SidebarGroup>
        {filteredMain.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.main")}</SidebarGroupLabel>
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredAdmin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.administration")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdmin.map((item) => (
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
        <div className="p-4 border-t space-y-2">
          <RoleToggle />
          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size={state === "expanded" ? "default" : "icon"}
                className={state === "expanded" ? "w-full justify-start gap-2" : ""}
                data-testid="button-help"
              >
                <HelpCircle className="h-4 w-4" />
                {state === "expanded" && <span>{t("help.title")}</span>}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("help.dialog.title")}</DialogTitle>
                <DialogDescription>
                  {t("help.dialog.subtitle")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <section>
                  <h3 className="font-semibold text-lg mb-3 text-primary">{t("help.about.title")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("help.about.desc")}
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3 text-primary">{t("help.tutorials.title")}</h3>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        {t("help.tutorials.search.title")}
                      </h4>
                      <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>{t("help.tutorials.search.step1")}</li>
                        <li>{t("help.tutorials.search.step2")}</li>
                        <li>{t("help.tutorials.search.step3")}</li>
                        <li>{t("help.tutorials.search.step4")}</li>
                      </ol>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t("help.tutorials.appointments.title")}
                      </h4>
                      <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>{t("help.tutorials.appointments.step1")}</li>
                        <li>{t("help.tutorials.appointments.step2")}</li>
                        <li>{t("help.tutorials.appointments.step3")}</li>
                        <li>{t("help.tutorials.appointments.step4")}</li>
                      </ol>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        {t("help.tutorials.favorites.title")}
                      </h4>
                      <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>{t("help.tutorials.favorites.step1")}</li>
                        <li>{t("help.tutorials.favorites.step2")}</li>
                        <li>{t("help.tutorials.favorites.step3")}</li>
                      </ol>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        {t("help.tutorials.cards.title")}
                      </h4>
                      <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>{t("help.tutorials.cards.step1")}</li>
                        <li>{t("help.tutorials.cards.step2")}</li>
                        <li>{t("help.tutorials.cards.step3")}</li>
                        <li>{t("help.tutorials.cards.step4")}</li>
                      </ol>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        {t("help.tutorials.chat.title")}
                      </h4>
                      <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>{t("help.tutorials.chat.step1")}</li>
                        <li>{t("help.tutorials.chat.step2")}</li>
                        <li>{t("help.tutorials.chat.step3")}</li>
                      </ol>
                    </div>

                    {userRole === "owner" && (
                      <div className="border rounded-lg p-4 bg-accent/5">
                        <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {t("help.tutorials.owner.title")}
                        </h4>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                          <li>{t("help.tutorials.owner.step1")}</li>
                          <li>{t("help.tutorials.owner.step2")}</li>
                          <li>{t("help.tutorials.owner.step3")}</li>
                          <li>{t("help.tutorials.owner.step4")}</li>
                        </ol>
                      </div>
                    )}

                    {(userRole === "master" || userRole === "admin" || userRole === "admin_jr") && (
                      <div className="border rounded-lg p-4 bg-accent/5">
                        <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                          <UserCog className="h-4 w-4" />
                          {t("help.tutorials.admin.title")}
                        </h4>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                          <li>{t("help.tutorials.admin.step1")}</li>
                          <li>{t("help.tutorials.admin.step2")}</li>
                          <li>{t("help.tutorials.admin.step3")}</li>
                          <li>{t("help.tutorials.admin.step4")}</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3 text-primary">{t("help.features.title")}</h3>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>{t("help.features.item1")}</li>
                    <li>{t("help.features.item2")}</li>
                    <li>{t("help.features.item3")}</li>
                    <li>{t("help.features.item4")}</li>
                    <li>{t("help.features.item5")}</li>
                    <li>{t("help.features.item6")}</li>
                    <li>{t("help.features.item7")}</li>
                  </ul>
                </section>

                <section className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-2">{t("help.support.title")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("help.support.desc")}
                  </p>
                </section>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
