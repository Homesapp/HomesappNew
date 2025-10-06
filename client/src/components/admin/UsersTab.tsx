import { useState } from "react";
import { UserApprovalCard } from "@/components/UserApprovalCard";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePendingUsers, useApprovedUsers, useApproveUser, useRejectUser, useApproveAllUsers } from "@/hooks/useUsers";
import { format } from "date-fns";
import type { User } from "@shared/schema";

const roleLabels: Record<string, string> = {
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
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { user: currentUser } = useAuth();
  const { data: pendingUsers = [], isLoading: isLoadingPending, error: errorPending } = usePendingUsers();
  const { data: approvedUsers = [], isLoading: isLoadingApproved, error: errorApproved } = useApprovedUsers();
  const { toast } = useToast();
  
  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();
  const approveAllUsers = useApproveAllUsers();

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setIsProfileOpen(true);
  };

  const handleApprove = async (userId: string, userName: string) => {
    try {
      await approveUser.mutateAsync(userId);
      toast({
        title: "Usuario aprobado",
        description: `${userName} ha sido aprobado exitosamente.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    try {
      await rejectUser.mutateAsync(userId);
      toast({
        title: "Usuario rechazado",
        description: `${userName} ha sido rechazado.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleApproveAll = async () => {
    try {
      const result = await approveAllUsers.mutateAsync();
      toast({
        title: "Usuarios aprobados",
        description: `Se aprobaron ${result.count} usuarios exitosamente.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron aprobar todos los usuarios",
        variant: "destructive",
      });
    }
  };

  const filterUsers = (users: typeof pendingUsers) => {
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

  const formatUserForCard = (user: typeof pendingUsers[0]) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuario";
    const roleLabel = roleLabels[user.role] || user.role;
    const requestDate = format(new Date(user.createdAt), "dd MMM yyyy");

    return {
      id: user.id,
      name: fullName,
      email: user.email || "",
      role: roleLabel,
      requestDate,
      avatar: user.profileImageUrl || undefined,
    };
  };

  const canApproveUsers = currentUser && ["master", "admin"].includes(currentUser.role);

  const error = activeTab === "pending" ? errorPending : errorApproved;
  const isLoading = activeTab === "pending" ? isLoadingPending : isLoadingApproved;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-destructive">Error al cargar los usuarios: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Aprueba usuarios y gestiona permisos
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canApproveUsers && pendingUsers.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  data-testid="button-approve-all"
                  disabled={approveAllUsers.isPending}
                >
                  {approveAllUsers.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Aprobar Todos ({pendingUsers.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Aprobar todos los usuarios?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Estás a punto de aprobar {pendingUsers.length} usuarios pendientes.
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApproveAll}>
                    Aprobar Todos
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending-users">
            Pendientes ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved-users">
            Aprobados ({approvedUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterUsers(pendingUsers).map((user) => {
                  const cardData = formatUserForCard(user);
                  return (
                    <UserApprovalCard
                      key={user.id}
                      {...cardData}
                      onApprove={
                        canApproveUsers
                          ? () => handleApprove(user.id, cardData.name)
                          : undefined
                      }
                      onReject={
                        canApproveUsers
                          ? () => handleReject(user.id, cardData.name)
                          : undefined
                      }
                    />
                  );
                })}
              </div>
              {filterUsers(pendingUsers).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery
                    ? "No se encontraron usuarios que coincidan con la búsqueda"
                    : "No hay usuarios pendientes de aprobación"}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {isLoading ? (
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
                      className="hover-elevate cursor-pointer" 
                      onClick={() => handleViewProfile(user)}
                      data-testid={`card-user-${user.id}`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.profileImageUrl || undefined} alt={fullName} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 space-y-1">
                            <h3 className="font-semibold truncate" data-testid={`text-user-name-${user.id}`}>
                              {fullName}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate" data-testid={`text-user-email-${user.id}`}>
                              {user.email}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" data-testid={`badge-user-role-${user.id}`}>
                                {roleLabel}
                              </Badge>
                            </div>
                          </div>
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
        </TabsContent>
      </Tabs>

      <UserProfileDialog 
        user={selectedUser}
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </div>
  );
}
