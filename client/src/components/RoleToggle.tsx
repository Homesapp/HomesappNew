import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Building2, User, Plus, FileText, Briefcase, Scale, Calculator, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { User as UserType } from "@shared/schema";

const ROLE_ICONS: Record<string, any> = {
  owner: Building2,
  cliente: User,
  abogado: Scale,
  contador: Calculator,
  seller: Briefcase,
  management: Star,
  provider: FileText,
};

const ROLE_NAMES: Record<string, string> = {
  owner: "Propietario",
  cliente: "Cliente", 
  abogado: "Abogado",
  contador: "Contador",
  seller: "Vendedor",
  management: "Gestión",
  provider: "Proveedor",
  concierge: "Conserje",
  agente_servicios_especiales: "Agente de Servicios Especiales",
};

export function RoleToggle() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { state } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [reason, setReason] = useState("");

  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/auth/user"],
  });

  const switchRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      return apiRequest("PATCH", "/api/users/switch-role", { role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: t("role.updated"),
        description: t("role.updatedDesc"),
      });
      setIsOpen(false);
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("role.updateError"),
        variant: "destructive",
      });
    },
  });

  const applyRoleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/role-requests", {
        userId: user?.id,
        requestedRole: selectedRole,
        reason,
      });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de rol ha sido enviada. Un administrador la revisará pronto.",
      });
      setShowApplicationDialog(false);
      setSelectedRole("");
      setReason("");
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || "Error al enviar solicitud",
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  // Show for users who have owner/cliente roles or an additional approved role
  const hasOwnerClienteRole = user.role === "owner" || user.role === "cliente";
  const hasAdditionalRole = !!user.additionalRole;
  
  if (!hasOwnerClienteRole && !hasAdditionalRole) return null;

  const isOwner = user.role === "owner";
  const isClient = user.role === "cliente";
  const isCollapsed = state === "collapsed";
  const hasAdditionalRole = !!user.additionalRole;
  
  const CurrentIcon = ROLE_ICONS[user.role] || User;
  const currentRoleName = ROLE_NAMES[user.role] || user.role;

  // Available roles to apply for
  const availableRoles = ["abogado", "contador", "seller", "management", "provider", "concierge"];

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size={isCollapsed ? "icon" : "default"}
            className={isCollapsed ? "" : "gap-2 w-full justify-start"} 
            data-testid="button-role-toggle"
          >
            <CurrentIcon className="h-4 w-4" />
            {!isCollapsed && <span>{currentRoleName}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Cambiar Rol</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => switchRoleMutation.mutate("owner")}
            disabled={isOwner || switchRoleMutation.isPending}
            data-testid="option-switch-to-owner"
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">Propietario</span>
              <span className="text-xs text-muted-foreground">
                Gestiona tus propiedades
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => switchRoleMutation.mutate("cliente")}
            disabled={isClient || switchRoleMutation.isPending}
            data-testid="option-switch-to-client"
            className="gap-2"
          >
            <User className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">Cliente</span>
              <span className="text-xs text-muted-foreground">
                Busca propiedades
              </span>
            </div>
          </DropdownMenuItem>

          {hasAdditionalRole && user.additionalRole && (
            <DropdownMenuItem
              onClick={() => switchRoleMutation.mutate(user.additionalRole as any)}
              disabled={user.role === user.additionalRole || switchRoleMutation.isPending}
              data-testid={`option-switch-to-${user.additionalRole}`}
              className="gap-2"
            >
              {ROLE_ICONS[user.additionalRole] && 
                (() => {
                  const Icon = ROLE_ICONS[user.additionalRole];
                  return <Icon className="h-4 w-4" />;
                })()
              }
              <div className="flex flex-col">
                <span className="font-medium">{ROLE_NAMES[user.additionalRole]}</span>
                <span className="text-xs text-muted-foreground">
                  Rol adicional aprobado
                </span>
              </div>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => {
              setShowApplicationDialog(true);
              setIsOpen(false);
            }}
            data-testid="button-apply-role"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Solicitar otro rol</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent data-testid="dialog-role-application">
          <DialogHeader>
            <DialogTitle>Solicitar Rol Adicional</DialogTitle>
            <DialogDescription>
              Solicita acceso a un rol adicional. Un administrador revisará tu solicitud.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Rol a solicitar</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role" data-testid="select-role">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_NAMES[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Razón de la solicitud</Label>
              <Textarea
                id="reason"
                placeholder="Explica por qué necesitas este rol..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                data-testid="input-reason"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApplicationDialog(false)}
              data-testid="button-cancel-application"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => applyRoleMutation.mutate()}
              disabled={!selectedRole || applyRoleMutation.isPending}
              data-testid="button-submit-application"
            >
              {applyRoleMutation.isPending ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
