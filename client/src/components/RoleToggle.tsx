import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Building2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { User as UserType } from "@shared/schema";

export function RoleToggle() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/auth/user"],
  });

  const switchRoleMutation = useMutation({
    mutationFn: async (newRole: "owner" | "cliente") => {
      return apiRequest("PATCH", "/api/users/switch-role", { role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Rol actualizado",
        description: "Tu rol ha sido cambiado exitosamente",
      });
      setIsOpen(false);
      // Reload page to update UI based on new role
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el rol",
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  // Only show for users who can switch between owner and cliente
  const canSwitch = user.role === "owner" || user.role === "cliente";
  if (!canSwitch) return null;

  const isOwner = user.role === "owner";
  const isClient = user.role === "cliente";

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 w-full justify-start" data-testid="button-role-toggle">
          {isOwner ? (
            <>
              <Building2 className="h-4 w-4" />
              <span>Propietario</span>
            </>
          ) : (
            <>
              <User className="h-4 w-4" />
              <span>Cliente</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Cambiar modo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => switchRoleMutation.mutate("owner")}
          disabled={isOwner || switchRoleMutation.isPending}
          data-testid="option-switch-to-owner"
          className="gap-2"
        >
          <Building2 className="h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">{t("header.switchToOwner")}</span>
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
            <span className="font-medium">{t("header.switchToClient")}</span>
            <span className="text-xs text-muted-foreground">
              Busca y renta propiedades
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
