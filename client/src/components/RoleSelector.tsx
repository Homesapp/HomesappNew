import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  master: "Master",
  admin: "Administrador",
  admin_jr: "Admin Jr",
  cliente: "Cliente",
  seller: "Vendedor",
  owner: "Propietario",
  management: "Gestión",
  concierge: "Conserje",
  provider: "Proveedor",
  abogado: "Abogado",
  contador: "Contador",
  agente_servicios_especiales: "Agente de Servicios Especiales",
};

const ALL_ROLES = [
  "master",
  "admin",
  "admin_jr",
  "cliente",
  "seller",
  "owner",
  "management",
  "concierge",
  "provider",
  "abogado",
  "contador",
  "agente_servicios_especiales",
];

export function RoleSelector() {
  const { realUser, viewAsRole, setViewAsRole, clearViewAsRole, isViewingAsOtherRole, canChangeRole } = useAuth();
  const [, setLocation] = useLocation();

  if (!canChangeRole) {
    return null;
  }

  const currentRole = viewAsRole || realUser?.role || "";

  const handleRoleChange = (value: string) => {
    if (!value) return;
    
    if (value === realUser?.role) {
      clearViewAsRole();
      
      if (realUser.role === "owner") {
        setLocation("/owner/dashboard");
      } else if (realUser.role === "admin" || realUser.role === "master" || realUser.role === "admin_jr") {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/");
      }
    } else {
      setViewAsRole(value);
      
      if (value === "owner") {
        setLocation("/owner/dashboard");
      } else if (value === "admin" || value === "master" || value === "admin_jr") {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/");
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isViewingAsOtherRole && (
        <Badge variant="secondary" className="gap-1" data-testid="badge-viewing-as">
          <Eye className="h-3 w-3" />
          Vista como
        </Badge>
      )}
      
      <Select
        value={currentRole}
        onValueChange={handleRoleChange}
      >
        <SelectTrigger 
          className="w-[160px]" 
          data-testid="select-role-trigger"
        >
          <SelectValue placeholder="Seleccionar rol" />
        </SelectTrigger>
        <SelectContent>
          {ALL_ROLES.map((role) => (
            <SelectItem 
              key={role} 
              value={role}
              data-testid={`select-role-${role}`}
            >
              {ROLE_LABELS[role] || role}
              {role === realUser?.role && " (Tu rol)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isViewingAsOtherRole && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleRoleChange(realUser?.role || "")}
          title="Volver a tu rol"
          data-testid="button-clear-role"
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
