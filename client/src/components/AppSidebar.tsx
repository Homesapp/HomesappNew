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
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { RoleToggle } from "@/components/RoleToggle";

export type UserRole = "master" | "admin" | "admin_jr" | "seller" | "owner" | "management" | "concierge" | "provider";

export type AppSidebarProps = {
  userRole: UserRole;
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
};

export function AppSidebar({ userRole }: AppSidebarProps) {
  const [location] = useLocation();

  const mainItems = [
    { title: "Inicio", url: "/", icon: Home, roles: ["master", "admin", "admin_jr", "seller", "management", "concierge", "provider", "cliente"] },
    { title: "Dashboard", url: "/owner/dashboard", icon: Home, roles: ["owner"] },
    { title: "Buscar Propiedades", url: "/buscar-propiedades", icon: Search, roles: ["cliente"] },
    { title: "Mis Favoritos", url: "/favoritos", icon: Heart, roles: ["cliente"] },
    { title: "Mis Oportunidades", url: "/mis-oportunidades", icon: Calendar, roles: ["cliente"] },
    { title: "Mis Propiedades", url: "/mis-propiedades", icon: Building2, roles: ["owner"] },
    { title: "Gestión de Visitas", url: "/owner/appointments", icon: CalendarCheck, roles: ["owner"] },
    { title: "Notificaciones", url: "/notificaciones", icon: Bell, roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider", "cliente"] },
    { title: "Mensajes", url: "/chat", icon: MessageCircle, roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider"] },
    { title: "CRM - Leads", url: "/leads", icon: Users, roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { title: "Kanban - Rentas", url: "/rentas", icon: FolderKanban, roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { title: "Propiedades", url: "/properties", icon: Building2, roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { title: "Citas", url: "/appointments", icon: Calendar, roles: ["master", "admin", "admin_jr", "seller", "management", "concierge"] },
    { title: "Calendario", url: "/calendario", icon: Calendar, roles: ["master", "admin", "admin_jr"] },
    { title: "Presupuestos", url: "/presupuestos", icon: FileText, roles: ["master", "admin", "admin_jr", "owner", "management", "provider"] },
    { title: "Tareas", url: "/tareas", icon: ListTodo, roles: ["master", "admin", "admin_jr", "management", "concierge"] },
    { title: "Clientes", url: "/clientes", icon: Users, roles: ["master", "admin", "admin_jr", "seller"] },
    { title: "Tarjetas", url: "/presentation-cards", icon: ClipboardList, roles: ["master", "admin", "admin_jr", "seller"] },
    { title: "Mi Perfil", url: "/perfil", icon: User, roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider", "cliente"] },
  ];

  const adminItems = [
    { title: "Dashboard Admin", url: "/admin/dashboard", icon: Home, roles: ["master", "admin", "admin_jr"] },
    { title: "Backoffice", url: "/backoffice", icon: FolderKanban, roles: ["master", "admin", "admin_jr", "seller", "management", "concierge", "provider"] },
    { title: "Solicitudes de Cambio", url: "/admin/change-requests", icon: FileEdit, roles: ["master", "admin", "admin_jr"] },
    { title: "Reportes de Inspección", url: "/admin/inspection-reports", icon: ClipboardCheck, roles: ["master", "admin", "admin_jr"] },
    { title: "Gestión Usuarios", url: "/users", icon: UserCog, roles: ["master", "admin"] },
    { title: "Permisos", url: "/permissions", icon: Settings, roles: ["master", "admin"] },
  ];

  const serviceItems = [
    { title: "Directorio", url: "/directory", icon: Store, roles: ["master", "admin", "admin_jr", "owner", "management"] },
    { title: "Mis Servicios", url: "/my-services", icon: CreditCard, roles: ["provider"] },
  ];

  const filteredMain = mainItems.filter((item) => item.roles.includes(userRole));
  const filteredAdmin = adminItems.filter((item) => item.roles.includes(userRole));
  const filteredService = serviceItems.filter((item) => item.roles.includes(userRole));

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-2 px-4 py-3">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">HomesApp</span>
          </div>
        </SidebarGroup>
        {filteredMain.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                        <item.icon />
                        <span>{item.title}</span>
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
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdmin.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                        <item.icon />
                        <span>{item.title}</span>
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
            <SidebarGroupLabel>Servicios</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredService.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                        <item.icon />
                        <span>{item.title}</span>
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
        <div className="p-4 border-t">
          <RoleToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
