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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";

export type UserRole = "master" | "admin" | "admin_jr" | "seller" | "owner" | "management" | "concierge" | "provider";

export type AppSidebarProps = {
  userRole: UserRole;
  userName: string;
  userAvatar?: string;
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

export function AppSidebar({ userRole, userName, userAvatar }: AppSidebarProps) {
  const [location] = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const mainItems = [
    { title: "Inicio", url: "/", icon: Home, roles: ["master", "admin", "admin_jr", "seller", "owner", "management"] },
    { title: "Buscar Propiedades", url: "/buscar-propiedades", icon: Search, roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider"] },
    { title: "Mis Favoritos", url: "/favoritos", icon: Heart, roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider"] },
    { title: "Propiedades", url: "/properties", icon: Building2, roles: ["master", "admin", "admin_jr", "seller", "owner", "management"] },
    { title: "Citas", url: "/appointments", icon: Calendar, roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge"] },
    { title: "Calendario", url: "/calendario", icon: Calendar, roles: ["master", "admin", "admin_jr"] },
    { title: "Presupuestos", url: "/presupuestos", icon: FileText, roles: ["master", "admin", "admin_jr", "owner", "management", "provider"] },
    { title: "Tareas", url: "/tareas", icon: ListTodo, roles: ["master", "admin", "admin_jr", "management", "concierge"] },
    { title: "Clientes", url: "/clientes", icon: Users, roles: ["master", "admin", "admin_jr", "seller"] },
    { title: "Tarjetas", url: "/presentation-cards", icon: ClipboardList, roles: ["master", "admin", "admin_jr", "seller"] },
  ];

  const adminItems = [
    { title: "Backoffice", url: "/backoffice", icon: FolderKanban, roles: ["master", "admin", "admin_jr"] },
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
        <div className="flex items-center gap-3 p-4 border-t">
          <Avatar className="h-10 w-10">
            {userAvatar && <AvatarImage src={userAvatar} />}
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{userName}</p>
            <Badge variant="secondary" className="text-xs mt-1">
              {roleLabels[userRole]}
            </Badge>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
