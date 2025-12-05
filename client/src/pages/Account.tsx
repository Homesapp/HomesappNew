import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useLocation, Redirect } from "wouter";
import { 
  Heart, FileText, DoorOpen, Key, Building2, ChevronRight, User, 
  LayoutDashboard, Users, BookOpen
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Profile from "./Profile";

const roleLabels: Record<string, { es: string; en: string }> = {
  cliente: { es: "Cliente", en: "Client" },
  owner: { es: "Propietario", en: "Owner" },
  seller: { es: "Vendedor", en: "Seller" },
  external_agency_admin: { es: "Admin de Agencia", en: "Agency Admin" },
  external_agency_seller: { es: "Vendedor de Agencia", en: "Agency Seller" },
  external_agency_staff: { es: "Staff de Agencia", en: "Agency Staff" },
  external_agency_accounting: { es: "Contabilidad de Agencia", en: "Agency Accounting" },
  external_agency_maintenance: { es: "Mantenimiento de Agencia", en: "Agency Maintenance" },
  external_agency_seller_assistant: { es: "Asistente de Vendedor", en: "Seller Assistant" },
  admin: { es: "Administrador", en: "Administrator" },
  master: { es: "Super Admin", en: "Super Admin" },
  admin_jr: { es: "Admin Jr", en: "Junior Admin" },
};

export default function Account() {
  const { user, isLoading } = useAuth();
  const { language, t } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: activeContracts } = useQuery<any[]>({
    queryKey: ["/api/external-contracts/my-contracts"],
    enabled: !!user && (user.role === "cliente" || user.role === "owner"),
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch("/api/external-contracts/my-contracts", {
          credentials: "include"
        });
        if (!response.ok) return [];
        return response.json();
      } catch {
        return [];
      }
    },
  });

  const hasActiveContract = activeContracts && activeContracts.length > 0;

  const getRoleLabel = (role: string) => {
    const label = roleLabels[role];
    return label ? (language === "es" ? label.es : label.en) : role;
  };

  const getQuickActions = () => {
    if (!user?.role) return [];

    const actions = [];

    switch (user.role) {
      case "cliente":
        actions.push({
          id: "favorites",
          label: t("userMenu.myFavorites") || (language === "es" ? "Mis favoritos" : "My favorites"),
          description: language === "es" ? "Ver propiedades guardadas" : "View saved properties",
          icon: Heart,
          href: "/favoritos",
        });
        actions.push({
          id: "applications",
          label: t("userMenu.myApplications") || (language === "es" ? "Mis solicitudes" : "My applications"),
          description: language === "es" ? "Ver estado de solicitudes" : "View application status",
          icon: FileText,
          href: "/mis-solicitudes",
        });
        if (hasActiveContract) {
          actions.push({
            id: "tenant-portal",
            label: t("userMenu.tenantPortal") || (language === "es" ? "Portal Inquilino" : "Tenant Portal"),
            description: language === "es" ? "Pagos, documentos y mantenimiento" : "Payments, documents and maintenance",
            icon: DoorOpen,
            href: "/portal/tenant",
          });
        }
        break;

      case "owner":
        actions.push({
          id: "favorites",
          label: t("userMenu.myFavorites") || (language === "es" ? "Mis favoritos" : "My favorites"),
          description: language === "es" ? "Ver propiedades guardadas" : "View saved properties",
          icon: Heart,
          href: "/favoritos",
        });
        actions.push({
          id: "properties",
          label: t("userMenu.myProperties") || (language === "es" ? "Mis propiedades" : "My properties"),
          description: language === "es" ? "Ver propiedades listadas" : "View listed properties",
          icon: Building2,
          href: "/mis-propiedades",
        });
        actions.push({
          id: "owner-dashboard",
          label: t("userMenu.ownerDashboard") || (language === "es" ? "Dashboard propietario" : "Owner Dashboard"),
          description: language === "es" ? "Ver resumen de tus propiedades" : "View properties summary",
          icon: LayoutDashboard,
          href: "/owner/dashboard",
        });
        if (hasActiveContract) {
          actions.push({
            id: "owner-portal",
            label: t("userMenu.ownerPortal") || (language === "es" ? "Portal Propietario" : "Owner Portal"),
            description: language === "es" ? "Gestionar tus propiedades rentadas" : "Manage your rented properties",
            icon: Key,
            href: "/portal/owner",
          });
        }
        break;

      case "seller":
        actions.push({
          id: "seller-dashboard",
          label: t("userMenu.sellerDashboard") || (language === "es" ? "Dashboard ventas" : "Sales Dashboard"),
          description: language === "es" ? "Ver tu resumen de ventas" : "View your sales summary",
          icon: LayoutDashboard,
          href: "/seller/dashboard",
        });
        actions.push({
          id: "leads",
          label: t("userMenu.myLeads") || (language === "es" ? "Mis leads" : "My leads"),
          description: language === "es" ? "Gestionar tus prospectos" : "Manage your prospects",
          icon: Users,
          href: "/leads",
        });
        actions.push({
          id: "catalog",
          label: t("userMenu.propertyCatalog") || (language === "es" ? "Catálogo de propiedades" : "Property Catalog"),
          description: language === "es" ? "Ver propiedades disponibles" : "View available properties",
          icon: BookOpen,
          href: "/seller-catalog",
        });
        break;

      case "external_agency_admin":
      case "external_agency_accounting":
      case "external_agency_maintenance":
      case "external_agency_staff":
      case "external_agency_seller":
      case "external_agency_seller_assistant":
        actions.push({
          id: "agency-dashboard",
          label: t("userMenu.agencyDashboard") || (language === "es" ? "Dashboard agencia" : "Agency Dashboard"),
          description: language === "es" ? "Ver resumen de agencia" : "View agency summary",
          icon: LayoutDashboard,
          href: "/external/dashboard",
        });
        actions.push({
          id: "external-leads",
          label: t("userMenu.myLeads") || (language === "es" ? "Mis leads" : "My leads"),
          description: language === "es" ? "Gestionar prospectos" : "Manage prospects",
          icon: Users,
          href: "/external/leads",
        });
        actions.push({
          id: "external-catalog",
          label: t("userMenu.propertyCatalog") || (language === "es" ? "Catálogo" : "Catalog"),
          description: language === "es" ? "Ver propiedades" : "View properties",
          icon: BookOpen,
          href: "/seller-catalog",
        });
        break;

      case "master":
      case "admin":
      case "admin_jr":
        actions.push({
          id: "admin-dashboard",
          label: t("userMenu.adminDashboard") || (language === "es" ? "Dashboard admin" : "Admin Dashboard"),
          description: language === "es" ? "Panel de administración" : "Administration panel",
          icon: LayoutDashboard,
          href: "/admin/dashboard",
        });
        break;
    }

    return actions;
  };

  const quickActions = getQuickActions();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" data-testid="loading-account" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="heading-account">
          {t("account.title") || (language === "es" ? "Mi Cuenta" : "My Account")}
        </h1>
        <p className="text-muted-foreground text-sm" data-testid="text-account-subtitle">
          {t("account.subtitle") || (language === "es" ? "Gestiona tu perfil y preferencias" : "Manage your profile and preferences")}
        </p>
      </div>

      {user?.role && (
        <div className="mb-6" data-testid="container-user-role">
          <Badge variant="secondary" data-testid="badge-user-role">
            <User className="h-3 w-3 mr-1" />
            {getRoleLabel(user.role)}
          </Badge>
        </div>
      )}

      {quickActions.length > 0 && (
        <Card className="mb-6" data-testid="card-quick-shortcuts">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="title-quick-shortcuts">
              <ChevronRight className="h-5 w-5" />
              {t("account.quickShortcuts") || (language === "es" ? "Accesos Rápidos" : "Quick Shortcuts")}
            </CardTitle>
            <CardDescription data-testid="desc-quick-shortcuts">
              {t("account.quickShortcutsDesc") || (language === "es" ? "Navega rápidamente a tus secciones" : "Quickly navigate to your sections")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto py-3 justify-start"
                  onClick={() => setLocation(action.href)}
                  data-testid={`button-shortcut-${action.id}`}
                >
                  <action.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-sm" data-testid={`text-shortcut-label-${action.id}`}>{action.label}</p>
                    <p className="text-xs text-muted-foreground" data-testid={`text-shortcut-desc-${action.id}`}>{action.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />

      <Profile />
    </div>
  );
}
