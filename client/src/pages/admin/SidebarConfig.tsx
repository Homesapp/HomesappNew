import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings2, Save, RotateCcw, Loader2, Users, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAdminTranslation } from "@/lib/adminTranslations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Definición de todos los menu items del sidebar
const ALL_MENU_ITEMS = {
  main: [
    { key: "sidebar.home", label: "Inicio", roles: ["master", "admin", "admin_jr", "seller", "management", "concierge", "provider", "cliente"] },
    { key: "sidebar.dashboard", label: "Dashboard Propietario", roles: ["owner"] },
    { key: "sidebar.notifications", label: "Notificaciones", roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider", "cliente"] },
    { key: "sidebar.messages", label: "Mensajes", roles: ["master", "admin", "admin_jr", "seller", "owner", "management", "concierge", "provider", "cliente"] },
    { key: "sidebar.leads", label: "Leads", roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { key: "sidebar.kanbanRentals", label: "Kanban Rentas", roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { key: "sidebar.properties", label: "Propiedades", roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { key: "sidebar.appointments", label: "Citas", roles: ["master", "admin", "admin_jr", "seller", "management", "concierge"] },
    { key: "sidebar.sellerAppointments", label: "Citas Vendedor", roles: ["master", "admin", "admin_jr", "seller", "management"] },
    { key: "sidebar.conciergeSchedule", label: "Horario Concierge", roles: ["concierge"] },
    { key: "sidebar.clients", label: "Clientes", roles: ["master", "admin", "admin_jr"] },
    { key: "sidebar.incomeManagement", label: "Gestión de Ingresos", roles: ["contador"] },
  ],
  clientProperties: [
    { key: "sidebar.searchProperties", label: "Buscar Propiedades", roles: ["cliente"] },
    { key: "sidebar.favorites", label: "Favoritos", roles: ["cliente"] },
    { key: "sidebar.cards", label: "Tarjetas de Presentación", roles: ["cliente"] },
  ],
  clientActivity: [
    { key: "sidebar.myAppointments", label: "Mis Citas", roles: ["cliente"] },
    { key: "sidebar.myOpportunities", label: "Mis Oportunidades", roles: ["cliente"] },
    { key: "sidebar.activeRentals", label: "Rentas Activas Cliente", roles: ["cliente"] },
  ],
  clientFinance: [
    { key: "sidebar.referrals", label: "Referidos Cliente", roles: ["cliente"] },
    { key: "sidebar.myIncome", label: "Mis Ingresos Cliente", roles: ["cliente"] },
  ],
  ownerProperties: [
    { key: "sidebar.myProperties", label: "Mis Propiedades", roles: ["owner"] },
  ],
  ownerActivity: [
    { key: "sidebar.ownerVisits", label: "Visitas Propietario", roles: ["owner"] },
    { key: "sidebar.ownerActiveRentals", label: "Rentas Activas Propietario", roles: ["owner"] },
    { key: "sidebar.ownerHoa", label: "HOA Propietario", roles: ["owner"] },
  ],
  ownerFinance: [
    { key: "sidebar.financialReport", label: "Reporte Financiero", roles: ["owner"] },
    { key: "sidebar.referrals", label: "Referidos Propietario", roles: ["owner"] },
    { key: "sidebar.myIncome", label: "Mis Ingresos Propietario", roles: ["owner"] },
  ],
  sellerFinance: [
    { key: "sidebar.referrals", label: "Referidos Vendedor", roles: ["seller", "master", "admin", "admin_jr"] },
    { key: "sidebar.myIncome", label: "Mis Ingresos Vendedor", roles: ["seller"] },
  ],
  adminSingle: [
    { key: "sidebar.adminDashboard", label: "Dashboard Admin", roles: ["master", "admin", "admin_jr"] },
    { key: "sidebar.incomeDashboard", label: "Dashboard Ingresos", roles: ["master", "admin"] },
    { key: "sidebar.backoffice", label: "Backoffice", roles: ["master", "admin", "admin_jr", "management", "concierge", "provider"] },
  ],
  processManagement: [
    { key: "sidebar.adminAppointments", label: "Citas Admin", roles: ["master", "admin", "admin_jr"] },
    { key: "sidebar.adminSellers", label: "Vendedores", roles: ["master", "admin", "admin_jr"] },
    { key: "sidebar.adminTasks", label: "Tareas", roles: ["master", "admin", "admin_jr"] },
    { key: "sidebar.adminContracts", label: "Contratos", roles: ["master", "admin", "admin_jr"] },
    { key: "sidebar.adminOffers", label: "Ofertas", roles: ["master", "admin", "admin_jr"] },
    { key: "sidebar.adminCalendar", label: "Calendario", roles: ["master", "admin", "admin_jr"] },
    { key: "sidebar.businessHours", label: "Horarios", roles: ["master", "admin"] },
    { key: "sidebar.assignProperties", label: "Asignar Propiedades", roles: ["master", "admin"] },
  ],
  usersAndRoles: [
    { key: "sidebar.userManagement", label: "Gestión de Usuarios", roles: ["master", "admin"] },
    { key: "sidebar.permissions", label: "Permisos", roles: ["master", "admin"] },
  ],
  properties: [
    { key: "sidebar.adminProperties", label: "Propiedades Admin", roles: ["master", "admin", "admin_jr"] },
    { key: "sidebar.importContacts", label: "Importar Contactos", roles: ["master", "admin"] },
    { key: "sidebar.changeRequests", label: "Solicitudes de Cambio", roles: ["master", "admin", "admin_jr"] },
    { key: "sidebar.propertyLimitRequests", label: "Solicitudes de Límite", roles: ["master", "admin", "admin_jr"] },
    { key: "sidebar.inspectionReports", label: "Reportes de Inspección", roles: ["master", "admin", "admin_jr"] },
    { key: "sidebar.condominiums", label: "Condominios", roles: ["master", "admin", "admin_jr"] },
    { key: "sidebar.hoaManagement", label: "Gestión HOA", roles: ["master", "admin", "management"] },
  ],
  config: [
    { key: "sidebar.agreementTemplates", label: "Plantillas de Acuerdo", roles: ["master", "admin"] },
    { key: "sidebar.chatbotConfig", label: "Configuración Chatbot", roles: ["master", "admin"] },
    { key: "sidebar.integrations", label: "Integraciones", roles: ["master", "admin"] },
    { key: "sidebar.changelog", label: "Changelog", roles: ["master", "admin"] },
  ],
  community: [
    { key: "sidebar.feedbackManagement", label: "Gestión de Feedback", roles: ["master", "admin", "admin_jr"] },
    { key: "sidebar.adminReferrals", label: "Referidos Admin", roles: ["master", "admin", "admin_jr"] },
  ],
  service: [
    { key: "sidebar.directory", label: "Directorio", roles: ["master", "admin", "admin_jr", "owner", "management"] },
    { key: "sidebar.myServices", label: "Mis Servicios", roles: ["provider"] },
  ],
};

const ROLE_OPTIONS = [
  { value: "cliente", label: "Cliente" },
  { value: "owner", label: "Propietario" },
  { value: "seller", label: "Vendedor" },
  { value: "concierge", label: "Concierge" },
  { value: "abogado", label: "Abogado" },
  { value: "contador", label: "Contador" },
  { value: "admin_jr", label: "Admin Jr" },
];

interface MenuItemVisibility {
  [key: string]: boolean;
}

export default function SidebarConfig() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = getAdminTranslation(language);
  const [configMode, setConfigMode] = useState<"role" | "user">("role");
  const [selectedRole, setSelectedRole] = useState<string>("cliente");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [menuVisibility, setMenuVisibility] = useState<MenuItemVisibility>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch users by role (for user mode)
  const { data: users } = useQuery({
    queryKey: ["/api/admin/users-by-role", selectedRole],
    enabled: configMode === "user" && !!selectedRole,
  });

  // Fetch current configuration for selected role
  const { data: roleConfig, isLoading: isLoadingRole } = useQuery({
    queryKey: ["/api/admin/sidebar-config", selectedRole],
    enabled: configMode === "role" && !!selectedRole,
  });

  // Fetch current configuration for selected user
  const { data: userConfig, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/admin/sidebar-config-user", selectedUserId],
    enabled: configMode === "user" && !!selectedUserId,
  });

  const config = configMode === "role" ? roleConfig : userConfig;
  const isLoading = configMode === "role" ? isLoadingRole : isLoadingUser;

  // Reset selected user when changing mode or role
  useEffect(() => {
    setSelectedUserId("");
    setMenuVisibility({});
    setHasChanges(false);
  }, [configMode, selectedRole]);

  // Load configuration when data changes
  useEffect(() => {
    if (config) {
      const visibilityMap: MenuItemVisibility = {};
      config.forEach((item: any) => {
        visibilityMap[item.menuItemKey] = item.visible;
      });
      setMenuVisibility(visibilityMap);
      setHasChanges(false);
    }
  }, [config]);

  // Save configuration mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const configurations = Object.entries(menuVisibility).map(([menuItemKey, visible]) => ({
        role: selectedRole,
        menuItemKey,
        visible,
      }));

      if (configMode === "role") {
        return await apiRequest("POST", "/api/admin/sidebar-config", { configurations });
      } else {
        return await apiRequest("POST", `/api/admin/sidebar-config-user/${selectedUserId}`, { configurations });
      }
    },
    onSuccess: () => {
      if (configMode === "role") {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/sidebar-config", selectedRole] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/sidebar-config-user", selectedUserId] });
      }
      setHasChanges(false);
      toast({
        title: t.sidebarConfig.savedSuccess,
        description: t.sidebarConfig.savedDescription,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.common.error,
        description: error.message || "No se pudo guardar la configuración",
        variant: "destructive",
      });
    },
  });

  // Reset configuration mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      if (configMode === "role") {
        return await apiRequest("DELETE", `/api/admin/sidebar-config/${selectedRole}`, {});
      } else {
        return await apiRequest("DELETE", `/api/admin/sidebar-config-user/${selectedUserId}`, {});
      }
    },
    onSuccess: () => {
      if (configMode === "role") {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/sidebar-config", selectedRole] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/sidebar-config-user", selectedUserId] });
      }
      setMenuVisibility({});
      setHasChanges(false);
      toast({
        title: t.sidebarConfig.resetSuccess,
        description: t.sidebarConfig.resetDescription,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.common.error,
        description: error.message || "No se pudo resetear la configuración",
        variant: "destructive",
      });
    },
  });

  const toggleMenuItem = (key: string) => {
    setMenuVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
  };

  const getItemVisibility = (key: string): boolean => {
    // Si no hay configuración específica, está visible por defecto
    return menuVisibility[key] !== undefined ? menuVisibility[key] : true;
  };

  const renderMenuGroup = (title: string, items: typeof ALL_MENU_ITEMS.main) => {
    // Filtrar solo los items que aplican al rol seleccionado
    const relevantItems = items.filter(item => item.roles.includes(selectedRole));
    
    if (relevantItems.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground">{title}</h3>
        <div className="space-y-2">
          {relevantItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
              data-testid={`menu-item-${item.key}`}
            >
              <div className="flex-1">
                <Label htmlFor={item.key} className="cursor-pointer">
                  {item.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">{item.key}</p>
              </div>
              <Switch
                id={item.key}
                checked={getItemVisibility(item.key)}
                onCheckedChange={() => toggleMenuItem(item.key)}
                data-testid={`switch-${item.key}`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="w-6 h-6" />
          <h1 className="text-3xl font-bold">{t.sidebarConfig.title}</h1>
        </div>
        <p className="text-muted-foreground">
          {t.sidebarConfig.description}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t.sidebarConfig.modeConfig}</CardTitle>
          <CardDescription>
            {t.sidebarConfig.modeDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={configMode} onValueChange={(value) => setConfigMode(value as "role" | "user")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="role" className="gap-2" data-testid="tab-role">
                <Users className="w-4 h-4" />
                {t.sidebarConfig.byRole}
              </TabsTrigger>
              <TabsTrigger value="user" className="gap-2" data-testid="tab-user">
                <User className="w-4 h-4" />
                {t.sidebarConfig.byUser}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {configMode === "role" ? "Seleccionar Rol" : "Seleccionar Usuario"}
          </CardTitle>
          <CardDescription>
            {configMode === "role" 
              ? "Elige el rol para configurar su menú lateral" 
              : "Primero elige el rol, luego selecciona el usuario específico"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-64" data-testid="select-role">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value} data-testid={`role-option-${role.value}`}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasChanges && (
                <Badge variant="secondary" className="gap-1">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  Cambios sin guardar
                </Badge>
              )}
            </div>

            {configMode === "user" && (
              <div>
                <Select 
                  value={selectedUserId} 
                  onValueChange={setSelectedUserId}
                  disabled={!users || users.length === 0}
                >
                  <SelectTrigger className="w-full" data-testid="select-user">
                    <SelectValue placeholder={
                      !users || users.length === 0 
                        ? "No hay usuarios con este rol" 
                        : "Seleccionar usuario específico"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {users && users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id} data-testid={`user-option-${user.id}`}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedUserId && users && users.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    La configuración por usuario se superpone a la configuración del rol
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {configMode === "user" && !selectedUserId ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Selecciona un usuario para configurar su menú lateral</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Opciones del Menú - {ROLE_OPTIONS.find(r => r.value === selectedRole)?.label}
                {configMode === "user" && selectedUserId && users && (
                  <span className="text-base font-normal text-muted-foreground ml-2">
                    ({users.find((u: any) => u.id === selectedUserId)?.firstName} {users.find((u: any) => u.id === selectedUserId)?.lastName})
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {configMode === "role" 
                  ? "Activa o desactiva las opciones que verá este rol en su menú lateral"
                  : "Configuración personalizada para este usuario (se superpone a la configuración del rol)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderMenuGroup("Menú Principal", ALL_MENU_ITEMS.main)}
              <Separator />
              {renderMenuGroup("Propiedades Cliente", ALL_MENU_ITEMS.clientProperties)}
              {renderMenuGroup("Actividad Cliente", ALL_MENU_ITEMS.clientActivity)}
              {renderMenuGroup("Finanzas Cliente", ALL_MENU_ITEMS.clientFinance)}
              {renderMenuGroup("Propiedades Propietario", ALL_MENU_ITEMS.ownerProperties)}
              {renderMenuGroup("Actividad Propietario", ALL_MENU_ITEMS.ownerActivity)}
              {renderMenuGroup("Finanzas Propietario", ALL_MENU_ITEMS.ownerFinance)}
              {renderMenuGroup("Finanzas Vendedor", ALL_MENU_ITEMS.sellerFinance)}
              {renderMenuGroup("Admin Individual", ALL_MENU_ITEMS.adminSingle)}
              {renderMenuGroup("Gestión de Procesos", ALL_MENU_ITEMS.processManagement)}
              {renderMenuGroup("Usuarios y Roles", ALL_MENU_ITEMS.usersAndRoles)}
              {renderMenuGroup("Propiedades", ALL_MENU_ITEMS.properties)}
              {renderMenuGroup("Configuración", ALL_MENU_ITEMS.config)}
              {renderMenuGroup("Comunidad", ALL_MENU_ITEMS.community)}
              {renderMenuGroup("Servicios", ALL_MENU_ITEMS.service)}
            </CardContent>
          </Card>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!hasChanges || saveMutation.isPending}
              className="flex-1 gap-2"
              data-testid="button-save"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
            <Button
              variant="outline"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="gap-2"
              data-testid="button-reset"
            >
              <RotateCcw className="w-4 h-4" />
              {resetMutation.isPending ? "Reseteando..." : "Resetear"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
