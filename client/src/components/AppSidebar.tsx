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
} from "lucide-react";
import logoUrl from "@assets/H mes (500 x 300 px)_1759672952263.png";
import { Link, useLocation } from "wouter";
import { RoleToggle } from "@/components/RoleToggle";
import { Button } from "@/components/ui/button";
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

  const mainItems = [
    { title: "Inicio", url: "/", icon: Home, roles: ["master", "admin", "admin_jr", "seller", "management", "concierge", "provider", "cliente"] },
    { title: "Dashboard", url: "/owner/dashboard", icon: Home, roles: ["owner"] },
    { title: "Buscar Propiedades", url: "/buscar-propiedades", icon: Search, roles: ["cliente"] },
    { title: "Mis Citas", url: "/mis-citas", icon: CalendarCheck, roles: ["cliente"] },
    { title: "Mis Favoritos", url: "/favoritos", icon: Heart, roles: ["cliente"] },
    { title: "Mis Oportunidades", url: "/mis-oportunidades", icon: Zap, roles: ["cliente"] },
    { title: "Red de Referidos", url: "/referidos", icon: Share2, roles: ["cliente", "owner", "master", "admin", "admin_jr", "seller"] },
    { title: "Mis Propiedades", url: "/mis-propiedades", icon: Building2, roles: ["owner"] },
    { title: "Cargar Propiedad", url: "/owner/property/new", icon: Plus, roles: ["owner"] },
    { title: "Gestión de Visitas", url: "/owner/appointments", icon: CalendarCheck, roles: ["owner"] },
    { title: "Notificaciones", url: "/notificaciones", icon: Bell, roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider", "cliente"] },
    { title: "Mensajes", url: "/chat", icon: MessageCircle, roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider", "cliente"] },
    { title: "Feedback", url: "/feedback", icon: MessageSquare, roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider", "cliente"] },
    { title: "CRM - Leads", url: "/leads", icon: Users, roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { title: "Kanban - Rentas", url: "/rentas", icon: FolderKanban, roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { title: "Propiedades", url: "/properties", icon: Building2, roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { title: "Citas", url: "/appointments", icon: Calendar, roles: ["master", "admin", "admin_jr", "seller", "management", "concierge"] },
    { title: "Calendario", url: "/calendario", icon: Calendar, roles: ["master", "admin", "admin_jr"] },
    { title: "Presupuestos", url: "/presupuestos", icon: FileText, roles: ["master", "admin", "admin_jr", "owner", "management", "provider"] },
    { title: "Tareas", url: "/tareas", icon: ListTodo, roles: ["master", "admin", "admin_jr", "management", "concierge"] },
    { title: "Clientes", url: "/clientes", icon: Users, roles: ["master", "admin", "admin_jr", "seller"] },
    { title: "Tarjetas", url: "/presentation-cards", icon: ClipboardList, roles: ["master", "admin", "admin_jr", "seller", "cliente"] },
  ];

  const adminItems = [
    { title: "Dashboard Admin", url: "/admin/dashboard", icon: Home, roles: ["master", "admin", "admin_jr"] },
    { title: "Backoffice", url: "/backoffice", icon: FolderKanban, roles: ["master", "admin", "admin_jr", "seller", "management", "concierge", "provider"] },
    { title: "Solicitudes de Cambio", url: "/admin/change-requests", icon: FileEdit, roles: ["master", "admin", "admin_jr"] },
    { title: "Reportes de Inspección", url: "/admin/inspection-reports", icon: ClipboardCheck, roles: ["master", "admin", "admin_jr"] },
    { title: "Plantillas de Acuerdos", url: "/admin/agreement-templates", icon: FileText, roles: ["master", "admin"] },
    { title: "Condominios", url: "/admin/condominiums", icon: Building2, roles: ["master", "admin", "admin_jr"] },
    { title: "Configuración Chatbot", url: "/admin/chatbot-config", icon: Bot, roles: ["master", "admin"] },
    { title: "Gestión de Feedback", url: "/admin/feedback", icon: MessageSquare, roles: ["master", "admin", "admin_jr"] },
    { title: "Crear Usuario", url: "/admin/create-user", icon: UserPlus, roles: ["master", "admin"] },
    { title: "Gestión Usuarios", url: "/users", icon: UserCog, roles: ["master", "admin"] },
    { title: "Permisos", url: "/permissions", icon: Settings, roles: ["master", "admin"] },
  ];

  const serviceItems = [
    { title: "Directorio", url: "/directory", icon: Store, roles: ["master", "admin", "admin_jr", "owner", "management"] },
    { title: "Mis Servicios", url: "/my-services", icon: CreditCard, roles: ["provider"] },
  ];

  // For users without a role, show only basic navigation items (no privileged routes)
  const basicItems = [
    { title: "Inicio", url: "/", icon: Home },
    { title: "Notificaciones", url: "/notificaciones", icon: Bell },
    { title: "Mensajes", url: "/chat", icon: MessageCircle },
    { title: "Feedback", url: "/feedback", icon: MessageSquare },
    { title: "Perfil", url: "/perfil", icon: User },
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
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-center px-4 py-3">
            <img 
              src={logoUrl} 
              alt="HomesApp Logo" 
              className="h-16 w-auto object-contain"
              data-testid="img-sidebar-logo"
            />
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
        <div className="p-4 border-t space-y-2">
          <RoleToggle />
          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                data-testid="button-help"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Ayuda y Guías</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>HomesApp - Ayuda y Guías</DialogTitle>
                <DialogDescription>
                  Información sobre la aplicación y guías de uso
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <section>
                  <h3 className="font-semibold text-lg mb-2">Acerca de HomesApp</h3>
                  <p className="text-sm text-muted-foreground">
                    HomesApp es una plataforma integral de gestión inmobiliaria diseñada para
                    facilitar la administración de propiedades, citas, ofertas y comunicación entre
                    propietarios, clientes y personal de la agencia.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">Guías Rápidas</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Para Clientes:</h4>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Busca propiedades desde "Buscar Propiedades"</li>
                        <li>Guarda tus favoritos para revisarlos más tarde</li>
                        <li>Solicita oportunidades de renta desde los detalles de la propiedad</li>
                        <li>Crea tu tarjeta de presentación en "Tarjetas"</li>
                        <li>Revisa tus oportunidades en "Mis Oportunidades"</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">Para Propietarios:</h4>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Gestiona tus propiedades desde "Mis Propiedades"</li>
                        <li>Revisa y aprueba citas en "Gestión de Visitas"</li>
                        <li>Actualiza tu configuración de notificaciones</li>
                        <li>Solicita cambios a tus propiedades (sujeto a aprobación)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">Para Administradores:</h4>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Gestiona usuarios desde "Gestión Usuarios"</li>
                        <li>Revisa solicitudes de cambio en propiedades</li>
                        <li>Administra reportes de inspección</li>
                        <li>Accede al backoffice para operaciones administrativas</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">Características Principales</h3>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Sistema de roles con permisos personalizados</li>
                    <li>Chat en tiempo real entre usuarios</li>
                    <li>Gestión de citas con integración de Google Calendar</li>
                    <li>Sistema de ofertas y contrafertas</li>
                    <li>Kanban para leads y rentas</li>
                    <li>Presupuestos y gestión de servicios</li>
                    <li>Sistema de notificaciones personalizable</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">Soporte</h3>
                  <p className="text-sm text-muted-foreground">
                    ¿Necesitas ayuda adicional? Contacta al equipo de soporte a través del sistema
                    de mensajes o comunícate con tu administrador.
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
