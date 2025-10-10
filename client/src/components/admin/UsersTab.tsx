import { useState } from "react";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApprovedUsers } from "@/hooks/useUsers";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

const roleLabels: Record<string, string> = {
  cliente: "Cliente",
  master: "Master",
  admin: "Administrador",
  admin_jr: "Administrador Jr",
  seller: "Vendedor",
  owner: "Propietario",
  management: "Management",
  concierge: "Conserje",
  provider: "Proveedor",
};

export function UsersTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [userToUpdateRole, setUserToUpdateRole] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedAdditionalRole, setSelectedAdditionalRole] = useState<string>("");

  const { data: approvedUsers = [], isLoading: isLoadingApproved, error: errorApproved } = useApprovedUsers();
  const { toast } = useToast();

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role, additionalRole }: { userId: string; role: string; additionalRole?: string | null }) => {
      return await apiRequest(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role, additionalRole }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/approved'] });
      toast({
        title: "Rol actualizado",
        description: "El rol del usuario se actualizó exitosamente",
      });
      setIsRoleDialogOpen(false);
      setUserToUpdateRole(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el rol",
        variant: "destructive",
      });
    },
  });

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setIsProfileOpen(true);
  };

  const handleChangeRole = (user: User) => {
    setUserToUpdateRole(user);
    setSelectedRole(user.role);
    setSelectedAdditionalRole(user.additionalRole || "");
    setIsRoleDialogOpen(true);
  };

  const handleSubmitRoleChange = () => {
    if (!userToUpdateRole || !selectedRole) return;
    
    updateRoleMutation.mutate({
      userId: userToUpdateRole.id,
      role: selectedRole,
      additionalRole: selectedAdditionalRole || null,
    });
  };

  const filterUsers = (users: typeof approvedUsers) => {
    if (!searchQuery) return users;
    return users.filter(
      (user) => {
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
        const email = (user.email || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || email.includes(query);
      }
    );
  };

  if (errorApproved) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-destructive">Error al cargar los usuarios: {errorApproved.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Usuarios del Sistema</h2>
          <p className="text-muted-foreground">
            Ver información de usuarios y sus tarjetas de presentación
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-users"
        />
      </div>

      <div className="mt-6">
        {isLoadingApproved ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-32 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterUsers(approvedUsers).map((user) => {
                const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuario";
                const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
                const roleLabel = roleLabels[user.role] || user.role;
                
                return (
                  <Card 
                    key={user.id} 
                    className="hover-elevate" 
                    data-testid={`card-user-${user.id}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 cursor-pointer" onClick={() => handleViewProfile(user)}>
                          <AvatarImage src={user.profileImageUrl || undefined} alt={fullName} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 
                            className="font-semibold truncate cursor-pointer" 
                            data-testid={`text-user-name-${user.id}`}
                            onClick={() => handleViewProfile(user)}
                          >
                            {fullName}
                          </h3>
                          <p 
                            className="text-sm text-muted-foreground truncate cursor-pointer" 
                            data-testid={`text-user-email-${user.id}`}
                            onClick={() => handleViewProfile(user)}
                          >
                            {user.email}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" data-testid={`badge-user-role-${user.id}`}>
                              {roleLabel}
                            </Badge>
                            {user.additionalRole && (
                              <Badge variant="outline" data-testid={`badge-user-additional-role-${user.id}`}>
                                {roleLabels[user.additionalRole] || user.additionalRole}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChangeRole(user);
                          }}
                          data-testid={`button-change-role-${user.id}`}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {filterUsers(approvedUsers).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery
                  ? "No se encontraron usuarios que coincidan con la búsqueda"
                  : "No hay usuarios aprobados"}
              </div>
            )}
          </>
        )}
      </div>

      <UserProfileDialog 
        user={selectedUser}
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent data-testid="dialog-change-role">
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Actualiza el rol principal y/o adicional de {userToUpdateRole?.firstName} {userToUpdateRole?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol Principal</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger data-testid="select-main-role">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="seller">Vendedor</SelectItem>
                  <SelectItem value="owner">Propietario</SelectItem>
                  <SelectItem value="concierge">Conserje</SelectItem>
                  <SelectItem value="provider">Proveedor</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="admin_jr">Administrador Jr</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rol Adicional (Opcional)</label>
              <Select value={selectedAdditionalRole} onValueChange={setSelectedAdditionalRole}>
                <SelectTrigger data-testid="select-additional-role">
                  <SelectValue placeholder="Ninguno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="seller">Vendedor</SelectItem>
                  <SelectItem value="owner">Propietario</SelectItem>
                  <SelectItem value="concierge">Conserje</SelectItem>
                  <SelectItem value="provider">Proveedor</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="admin_jr">Administrador Jr</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
              data-testid="button-cancel-role-change"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitRoleChange}
              disabled={!selectedRole || updateRoleMutation.isPending}
              data-testid="button-confirm-role-change"
            >
              {updateRoleMutation.isPending ? "Guardando..." : "Actualizar Rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
