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
import {
  Home,
  Building2,
  Calendar,
  Clock,
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
  const { t, language } = useLanguage();
  const { state } = useSidebar();

  const [openGroups, setOpenGroups] = useState({
    processManagement: false,
    usersAndRoles: false,
    properties: false,
    config: false,
    community: false,
    clientProperties: false,
    clientActivity: false,
    clientFinance: false,
    ownerProperties: false,
    ownerActivity: false,
    ownerFinance: false,
    sellerFinance: false,
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

  // Seller finance group
  const sellerFinanceGroup = [
    { titleKey: "sidebar.referrals", url: "/referidos", icon: Share2, roles: ["seller", "master", "admin", "admin_jr"] },
    { titleKey: "sidebar.myIncome", url: "/mis-ingresos", icon: DollarSign, roles: ["seller"] },
  ];

  const adminSingleItems = [
    { titleKey: "sidebar.adminDashboard", url: "/admin/dashboard", icon: Home, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.incomeDashboard", url: "/admin/income", icon: DollarSign, roles: ["master", "admin"] },
    { titleKey: "sidebar.backoffice", url: "/backoffice", icon: FolderKanban, roles: ["master", "admin", "admin_jr", "management", "concierge", "provider"] },
  ];

  const processManagementGroup = [
    { titleKey: "sidebar.adminAppointments", url: "/admin/appointments", icon: CalendarCheck, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.adminSellers", url: "/admin/sellers", icon: Users, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.adminTasks", url: "/admin/tasks", icon: ClipboardCheck, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.adminContracts", url: "/admin/contracts", icon: FileText, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.adminOffers", url: "/admin/offers", icon: FileText, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.adminCalendar", url: "/admin/calendario", icon: Calendar, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.businessHours", url: "/admin/horarios", icon: Clock, roles: ["master", "admin"] },
    { titleKey: "sidebar.assignProperties", url: "/admin/asignar-propiedades", icon: Building2, roles: ["master", "admin"] },
  ];

  const usersAndRolesGroup = [
    { titleKey: "sidebar.userManagement", url: "/admin/users", icon: UserCog, roles: ["master", "admin"] },
    { titleKey: "sidebar.permissions", url: "/permissions", icon: Settings, roles: ["master", "admin"] },
  ];

  const propertiesGroup = [
    { titleKey: "sidebar.adminProperties", url: "/admin/properties", icon: Building2, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.importContacts", url: "/admin/import-contacts", icon: Upload, roles: ["master", "admin"] },
    { titleKey: "sidebar.changeRequests", url: "/admin/change-requests", icon: FileEdit, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.propertyLimitRequests", url: "/admin/property-limit-requests", icon: TrendingUp, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.inspectionReports", url: "/admin/inspection-reports", icon: ClipboardCheck, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.condominiums", url: "/admin/condominiums", icon: Building2, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.hoaManagement", url: "/admin/hoa", icon: Building, roles: ["master", "admin", "management"] },
  ];

  const configGroup = [
    { titleKey: "sidebar.agreementTemplates", url: "/admin/agreement-templates", icon: FileText, roles: ["master", "admin"] },
    { titleKey: "sidebar.chatbotConfig", url: "/admin/chatbot-config", icon: Bot, roles: ["master", "admin"] },
    { titleKey: "sidebar.sidebarConfig", url: "/admin/sidebar-config", icon: Settings2, roles: ["master", "admin"] },
    { titleKey: "sidebar.integrations", url: "/admin/integrations", icon: Plug, roles: ["master", "admin"] },
    { titleKey: "sidebar.changelog", url: "/admin/changelog", icon: BookOpen, roles: ["master", "admin"] },
  ];

  const communityGroup = [
    { titleKey: "sidebar.feedbackManagement", url: "/admin/feedback", icon: MessageSquare, roles: ["master", "admin", "admin_jr"] },
    { titleKey: "sidebar.adminReferrals", url: "/admin/referidos", icon: Share2, roles: ["master", "admin", "admin_jr"] },
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

  const filteredMain = userRole 
    ? mainItems.filter((item) => item.roles.includes(userRole))
    : basicItems;
  
  const filteredAdminSingle = userRole 
    ? adminSingleItems.filter((item) => item.roles.includes(userRole))
    : [];

  const filteredProcessManagement = userRole 
    ? processManagementGroup.filter((item) => item.roles.includes(userRole))
    : [];

  const filteredUsersAndRoles = userRole 
    ? usersAndRolesGroup.filter((item) => item.roles.includes(userRole))
    : [];

  const filteredProperties = userRole 
    ? propertiesGroup.filter((item) => item.roles.includes(userRole))
    : [];

  const filteredConfig = userRole 
    ? configGroup.filter((item) => item.roles.includes(userRole))
    : [];

  const filteredCommunity = userRole 
    ? communityGroup.filter((item) => item.roles.includes(userRole))
    : [];

  const filteredService = userRole 
    ? serviceItems.filter((item) => item.roles.includes(userRole))
    : [];

  const filteredClientProperties = userRole 
    ? clientPropertiesGroup.filter((item) => item.roles.includes(userRole))
    : [];

  const filteredClientActivity = userRole 
    ? clientActivityGroup.filter((item) => item.roles.includes(userRole))
    : [];

  const filteredClientFinance = userRole 
    ? clientFinanceGroup.filter((item) => item.roles.includes(userRole))
    : [];

  const filteredOwnerProperties = userRole 
    ? ownerPropertiesGroup.filter((item) => item.roles.includes(userRole))
    : [];

  const filteredOwnerActivity = userRole 
    ? ownerActivityGroup.filter((item) => item.roles.includes(userRole))
    : [];

  const filteredOwnerFinance = userRole 
    ? ownerFinanceGroup.filter((item) => item.roles.includes(userRole))
    : [];

  const filteredSellerFinance = userRole 
    ? sellerFinanceGroup.filter((item) => item.roles.includes(userRole))
    : [];

  const hasAdminItems = filteredAdminSingle.length > 0 || 
                        filteredProcessManagement.length > 0 ||
                        filteredUsersAndRoles.length > 0 || 
                        filteredProperties.length > 0 || 
                        filteredConfig.length > 0 || 
                        filteredCommunity.length > 0;

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
      clientProperties: isGroupActive(clientPropertiesGroup),
      clientActivity: isGroupActive(clientActivityGroup),
      clientFinance: isGroupActive(clientFinanceGroup),
      ownerProperties: isGroupActive(ownerPropertiesGroup),
      ownerActivity: isGroupActive(ownerActivityGroup),
      ownerFinance: isGroupActive(ownerFinanceGroup),
      sellerFinance: isGroupActive(sellerFinanceGroup),
    });
  }, [location]);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className={state === "expanded" ? "flex items-center justify-center px-4 py-3" : "flex items-center justify-center p-2"}>
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
                className="h-10 w-10 object-contain"
                data-testid="img-sidebar-logo-icon"
              />
            )}
          </div>
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

        {hasAdminItems && (
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
          <Link href="/ayuda" data-testid="link-help">
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
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
