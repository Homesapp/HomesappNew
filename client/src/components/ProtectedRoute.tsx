import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useEffect } from "react";

type UserRole = 
  | "admin" 
  | "master" 
  | "admin_jr"
  | "seller" 
  | "owner" 
  | "cliente" 
  | "management"
  | "concierge"
  | "provider"
  | "accountant"
  | "lawyer"
  | "external_agency_admin"
  | "external_agency_accounting"
  | "external_agency_maintenance"
  | "external_agency_staff"
  | "external_agency_seller"
  | "external_agency_seller_assistant"
  | "external_agency_concierge"
  | "external_agency_lawyer";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ children, allowedRoles, redirectTo }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { adminUser, isAdminAuthenticated, isLoading: isAdminLoading } = useAdminAuth();

  const currentUser = isAdminAuthenticated ? adminUser : user;
  const currentRole = isAdminAuthenticated 
    ? (currentUser?.role || "admin") 
    : currentUser?.role;

  useEffect(() => {
    if (!isLoading && !isAdminLoading && currentRole) {
      const hasAccess = allowedRoles.includes(currentRole as UserRole);
      
      if (!hasAccess) {
        const fallbackRoute = getFallbackRoute(currentRole as UserRole);
        setLocation(redirectTo || fallbackRoute);
      }
    }
  }, [isLoading, isAdminLoading, currentRole, allowedRoles, redirectTo, setLocation]);

  if (isLoading || isAdminLoading) {
    return <LoadingScreen className="h-full" />;
  }

  if (!currentRole) {
    return <LoadingScreen className="h-full" />;
  }

  const hasAccess = allowedRoles.includes(currentRole as UserRole);

  if (!hasAccess) {
    return <LoadingScreen className="h-full" />;
  }

  return <>{children}</>;
}

function getFallbackRoute(role: UserRole): string {
  switch (role) {
    case "admin":
    case "master":
    case "admin_jr":
      return "/admin/dashboard";
    case "external_agency_admin":
    case "external_agency_accounting":
    case "external_agency_maintenance":
    case "external_agency_staff":
      return "/external/dashboard";
    case "external_agency_seller":
    case "external_agency_seller_assistant":
      return "/seller/dashboard";
    case "owner":
      return "/owner/dashboard";
    case "seller":
      return "/seller/dashboard";
    case "cliente":
      return "/";
    default:
      return "/";
  }
}

export const ROLE_GROUPS = {
  mainAdmins: ["admin", "master", "admin_jr"] as UserRole[],
  externalAdmins: ["external_agency_admin"] as UserRole[],
  externalStaff: [
    "external_agency_admin", 
    "external_agency_accounting", 
    "external_agency_maintenance", 
    "external_agency_staff"
  ] as UserRole[],
  externalSellers: [
    "external_agency_seller", 
    "external_agency_seller_assistant"
  ] as UserRole[],
  externalAll: [
    "external_agency_admin", 
    "external_agency_accounting", 
    "external_agency_maintenance", 
    "external_agency_staff",
    "external_agency_seller", 
    "external_agency_seller_assistant",
    "external_agency_concierge",
    "external_agency_lawyer"
  ] as UserRole[],
  owners: ["owner"] as UserRole[],
  sellers: ["seller"] as UserRole[],
  accountants: ["accountant"] as UserRole[],
  lawyers: ["lawyer", "external_agency_lawyer"] as UserRole[],
};
