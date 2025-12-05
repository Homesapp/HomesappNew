import { useLocation } from "wouter";
import { 
  LogOut, 
  UserCircle, 
  FileText, 
  LayoutDashboard, 
  Building2, 
  Users, 
  BookOpen,
  DoorOpen,
  Settings,
  ChevronDown,
  Home,
  Map,
  Globe,
  Heart,
  Key,
  User,
  Menu
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";

interface PublicHeaderProps {
  showPlatformButton?: boolean;
}

export function PublicHeader({ showPlatformButton = true }: PublicHeaderProps) {
  const [location, setLocation] = useLocation();
  const { user, realUser, isAuthenticated, isLoading, isViewingAsOtherRole } = useAuth();
  const { t } = useLanguage();

  const actualUser = realUser || user;
  const isImpersonating = isViewingAsOtherRole;

  const { data: activeContracts } = useQuery<any[]>({
    queryKey: ["/api/external-contracts/my-contracts"],
    enabled: isAuthenticated && 
             !isImpersonating && 
             (actualUser?.role === "cliente" || actualUser?.role === "owner"),
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch("/api/external-contracts/my-contracts", {
          credentials: "include"
        });
        if (response.status === 401 || response.status === 403) {
          return [];
        }
        if (!response.ok) {
          return [];
        }
        return response.json();
      } catch {
        return [];
      }
    },
  });

  const hasActiveContract = !isImpersonating && activeContracts && activeContracts.length > 0;

  const fullName = actualUser?.firstName && actualUser?.lastName 
    ? `${actualUser.firstName} ${actualUser.lastName}`
    : actualUser?.email || "Usuario";

  const shortName = actualUser?.firstName || actualUser?.email?.split("@")[0] || "Usuario";

  const initials = actualUser?.firstName && actualUser?.lastName
    ? `${actualUser.firstName[0]}${actualUser.lastName[0]}`.toUpperCase()
    : actualUser?.email?.[0]?.toUpperCase() || "U";

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { 
        method: "GET",
        credentials: "include"
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/";
    }
  };

  const handleLoginClick = () => {
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath && currentPath !== "/" && currentPath !== "/login") {
      setLocation(`/login?redirect=${encodeURIComponent(currentPath)}`);
    } else {
      setLocation("/login");
    }
  };

  const handleRegisterClick = () => {
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath && currentPath !== "/" && currentPath !== "/register") {
      setLocation(`/register?redirect=${encodeURIComponent(currentPath)}`);
    } else {
      setLocation("/register");
    }
  };

  const getPlatformUrl = () => {
    if (isImpersonating) return "/admin/dashboard";
    if (!actualUser?.role) return "/";
    
    switch (actualUser.role) {
      case "cliente":
        return hasActiveContract ? "/portal/tenant" : "/mis-solicitudes";
      case "owner":
        return hasActiveContract ? "/portal/owner" : "/owner/dashboard";
      case "seller":
        return "/seller/dashboard";
      case "external_agency_admin":
      case "external_agency_accounting":
      case "external_agency_maintenance":
      case "external_agency_staff":
      case "external_agency_seller":
      case "external_agency_seller_assistant":
        return "/external/dashboard";
      case "master":
      case "admin":
      case "admin_jr":
        return "/admin/dashboard";
      default:
        return "/";
    }
  };

  const isInternalPage = () => {
    const internalPaths = ['/admin', '/external', '/seller', '/owner/dashboard', '/portal', '/mis-solicitudes'];
    return internalPaths.some(path => location.startsWith(path));
  };

  const getMenuItems = () => {
    if (isImpersonating) {
      return [
        { label: t("userMenu.dashboard") || "Panel de control", icon: LayoutDashboard, href: "/admin/dashboard" },
      ];
    }
    if (!actualUser?.role) return [];

    const items: Array<{ label: string; icon: any; href: string; separator?: boolean }> = [];

    items.push({ label: t("userMenu.myAccount") || "Mi cuenta", icon: UserCircle, href: "/account" });

    switch (actualUser.role) {
      case "cliente":
        items.push({ label: t("userMenu.myFavorites") || "Mis favoritos", icon: Heart, href: "/favoritos" });
        items.push({ label: t("userMenu.myApplications") || "Mis solicitudes", icon: FileText, href: "/mis-solicitudes" });
        if (hasActiveContract) {
          items.push({ separator: true, label: "", icon: null, href: "" });
          items.push({ label: t("userMenu.tenantPortal") || "Portal Inquilino", icon: DoorOpen, href: "/portal/tenant" });
        }
        break;

      case "owner":
        items.push({ label: t("userMenu.ownerDashboard") || "Dashboard propietario", icon: LayoutDashboard, href: "/owner/dashboard" });
        items.push({ label: t("userMenu.myProperties") || "Mis propiedades", icon: Building2, href: "/mis-propiedades" });
        if (hasActiveContract) {
          items.push({ separator: true, label: "", icon: null, href: "" });
          items.push({ label: t("userMenu.ownerPortal") || "Portal Propietario", icon: Key, href: "/portal/owner" });
        }
        break;

      case "seller":
        items.push({ label: t("userMenu.sellerDashboard") || "Dashboard ventas", icon: LayoutDashboard, href: "/seller/dashboard" });
        items.push({ label: t("userMenu.myLeads") || "Mis leads", icon: Users, href: "/leads" });
        items.push({ label: t("userMenu.propertyCatalog") || "Catálogo de propiedades", icon: BookOpen, href: "/seller-catalog" });
        break;

      case "external_agency_admin":
      case "external_agency_accounting":
      case "external_agency_maintenance":
      case "external_agency_staff":
      case "external_agency_seller":
      case "external_agency_seller_assistant":
        items.push({ label: t("userMenu.agencyDashboard") || "Dashboard agencia", icon: LayoutDashboard, href: "/external/dashboard" });
        items.push({ label: t("userMenu.myLeads") || "Mis leads", icon: Users, href: "/external/leads" });
        items.push({ label: t("userMenu.propertyCatalog") || "Catálogo", icon: BookOpen, href: "/seller-catalog" });
        break;

      case "master":
      case "admin":
      case "admin_jr":
        items.push({ label: t("userMenu.adminDashboard") || "Dashboard admin", icon: LayoutDashboard, href: "/admin/dashboard" });
        items.push({ label: t("userMenu.settings") || "Configuración", icon: Settings, href: "/admin/config" });
        break;

      default:
        items.push({ label: t("userMenu.myFavorites") || "Mis favoritos", icon: Heart, href: "/favoritos" });
    }

    if (isInternalPage()) {
      items.push({ separator: true, label: "", icon: null, href: "" });
      items.push({ label: t("userMenu.viewPublicSite") || "Ver sitio público", icon: Globe, href: "/public" });
    }

    return items;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => setLocation("/")}
          data-testid="link-logo-home"
        >
          <img src={logoIcon} alt="HomesApp" className="h-14 w-auto" data-testid="img-logo-header" />
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setLocation("/mapa-interactivo")}
            data-testid="button-interactive-map"
            title={t("public.interactiveMap") || "Mapa Interactivo"}
          >
            <Map className="h-5 w-5" />
          </Button>
          <LanguageToggle />
          
          {isLoading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          ) : isAuthenticated && user ? (
            <>
              {showPlatformButton && (
                <Button 
                  variant="default"
                  size="sm"
                  className="hidden sm:flex gap-2"
                  onClick={() => setLocation(getPlatformUrl())}
                  data-testid="button-go-to-platform"
                >
                  <Home className="h-4 w-4" />
                  {t("header.goToPlatform") || "Entrar a la plataforma"}
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative gap-2"
                    data-testid="button-user-menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || undefined} alt={fullName} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block text-sm max-w-[120px] truncate">{shortName}</span>
                    <ChevronDown className="h-4 w-4 hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" data-testid="dropdown-user-menu">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {showPlatformButton && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setLocation(getPlatformUrl())}
                        className="sm:hidden"
                        data-testid="menu-item-platform-mobile"
                      >
                        <Home className="mr-2 h-4 w-4" />
                        <span>{t("header.goToPlatform") || "Entrar a la plataforma"}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="sm:hidden" />
                    </>
                  )}
                  
                  {getMenuItems().map((item, index) => {
                    if (item.separator) {
                      return <DropdownMenuSeparator key={`sep-${index}`} />;
                    }
                    return (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => setLocation(item.href)}
                        data-testid={`menu-item-${item.href.replace(/\//g, '-').substring(1) || 'home'}`}
                      >
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    data-testid="menu-item-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("userMenu.logout") || "Cerrar sesión"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLoginClick}
                data-testid="button-login"
              >
                {t("landing.login") || "Iniciar sesión"}
              </Button>
              <Button 
                size="sm"
                onClick={handleRegisterClick}
                data-testid="button-register"
              >
                {t("landing.register") || "Registrarse"}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
