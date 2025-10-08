import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { User } from "@shared/schema";
import { useUserAuditHistory, useUpdateUserRole } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  UserIcon, 
  Mail, 
  Briefcase, 
  Calendar, 
  Clock,
  Activity,
  FileText,
  Edit,
  Trash2,
  Plus,
  Eye,
  Shield,
  KeyRound,
  Ban,
  CheckCircle,
  Home,
  CreditCard,
  AlertTriangle
} from "lucide-react";

const roleLabels: Record<string, string> = {
  master: "Master",
  admin: "Administrador",
  admin_jr: "Administrador Jr",
  seller: "Vendedor",
  owner: "Propietario",
  cliente: "Cliente",
  management: "Management",
  concierge: "Conserje",
  provider: "Proveedor",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const actionLabels: Record<string, string> = {
  create: "Crear",
  update: "Actualizar",
  delete: "Eliminar",
  view: "Ver",
  approve: "Aprobar",
  reject: "Rechazar",
  assign: "Asignar",
};

const actionIcons: Record<string, typeof Plus> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  view: Eye,
  approve: Plus,
  reject: Trash2,
  assign: UserIcon,
};

interface UserProfileDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ user, open, onOpenChange }: UserProfileDialogProps) {
  const [newRole, setNewRole] = useState<string>("");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspensionType, setSuspensionType] = useState<"temporary" | "permanent">("temporary");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionEndDate, setSuspensionEndDate] = useState("");
  
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: auditHistory, isLoading: isLoadingHistory } = useUserAuditHistory(
    user?.id || null,
    100
  );
  const updateUserRole = useUpdateUserRole();
  const { toast } = useToast();
  
  const { data: presentationCards, isLoading: isLoadingCards } = useQuery({
    queryKey: [`/api/users/${user?.id}/presentation-cards`],
    enabled: !!user?.id && user?.role === 'cliente',
  });

  const { data: properties, isLoading: isLoadingProperties } = useQuery({
    queryKey: [`/api/users/${user?.id}/properties`],
    enabled: !!user?.id && user?.role === 'owner',
  });
  
  const sendResetLink = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/admin/users/${userId}/send-reset-link`);
    },
    onSuccess: () => {
      toast({
        title: "Enlace enviado",
        description: "El enlace de restablecimiento ha sido enviado al usuario",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el enlace de restablecimiento",
        variant: "destructive",
      });
    },
  });
  
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/approved'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    },
  });

  const suspendUser = useMutation({
    mutationFn: async (data: { userId: string; suspensionType: string; reason: string; endDate?: string }) => {
      return await apiRequest('POST', `/api/admin/users/${data.userId}/suspend`, {
        suspensionType: data.suspensionType,
        reason: data.reason,
        endDate: data.endDate,
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Usuario suspendido",
        description: "La cuenta del usuario ha sido suspendida",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/approved'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${variables.userId}/presentation-cards`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${variables.userId}/properties`] });
      setShowSuspendDialog(false);
      setSuspensionReason("");
      setSuspensionEndDate("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo suspender el usuario",
        variant: "destructive",
      });
    },
  });

  const unsuspendUser = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/admin/users/${userId}/unsuspend`);
    },
    onSuccess: (_, userId) => {
      toast({
        title: "Usuario reactivado",
        description: "La cuenta del usuario ha sido reactivada",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/approved'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/presentation-cards`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/properties`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo reactivar el usuario",
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuario";
  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";

  const isAdmin = currentUser?.role === "master" || currentUser?.role === "admin" || currentUser?.additionalRole === "admin";
  const canChangeRole = currentUser?.role === "master";

  const availableRoles = [
    { value: "admin", label: "Administrador" },
    { value: "admin_jr", label: "Administrador Jr" },
    { value: "seller", label: "Vendedor" },
    { value: "owner", label: "Propietario" },
    { value: "cliente", label: "Cliente" },
    { value: "management", label: "Management" },
    { value: "concierge", label: "Conserje" },
    { value: "provider", label: "Proveedor" },
  ];

  const handleChangeRole = () => {
    if (!newRole || newRole === user.role) {
      toast({
        title: "Error",
        description: "Selecciona un rol diferente al actual",
        variant: "destructive",
      });
      return;
    }
    setShowRoleDialog(true);
  };

  const handleConfirmChangeRole = async () => {
    if (!user || !newRole) return;

    try {
      await updateUserRole.mutateAsync({
        userId: user.id,
        role: newRole,
      });
      
      toast({
        title: "Rol actualizado",
        description: `El rol de ${fullName} ha sido cambiado a ${roleLabels[newRole] || newRole}`,
      });
      
      setShowRoleDialog(false);
      setNewRole("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el rol del usuario",
        variant: "destructive",
      });
    }
  };

  const handleSuspendUser = () => {
    if (!suspensionReason.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar una razón para la suspensión",
        variant: "destructive",
      });
      return;
    }

    if (suspensionType === "temporary" && !suspensionEndDate) {
      toast({
        title: "Error",
        description: "Debes seleccionar una fecha de finalización para suspensión temporal",
        variant: "destructive",
      });
      return;
    }

    suspendUser.mutate({
      userId: user.id,
      suspensionType,
      reason: suspensionReason,
      endDate: suspensionType === "temporary" ? suspensionEndDate : undefined,
    });
  };

  const formatDetails = (details: unknown): string => {
    if (!details) return "";
    if (typeof details === "string") return details;
    try {
      return JSON.stringify(details);
    } catch {
      return String(details);
    }
  };

  const isSuspended = user.isSuspended;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-user-profile">
        <DialogHeader>
          <DialogTitle>Perfil de Usuario</DialogTitle>
          <DialogDescription>
            Información detallada del usuario
          </DialogDescription>
        </DialogHeader>

        {/* User Header */}
        <div className="flex items-start gap-4 pb-4 border-b">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.profileImageUrl || undefined} alt={fullName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-semibold" data-testid="text-user-name">
                {fullName}
              </h3>
              <Badge variant="secondary" data-testid="badge-user-role">
                {roleLabels[user.role] || user.role}
              </Badge>
              <Badge 
                variant={user.status === "approved" ? "default" : user.status === "pending" ? "secondary" : "destructive"}
                data-testid="badge-user-status"
              >
                {statusLabels[user.status] || user.status}
              </Badge>
              {isSuspended && (
                <Badge variant="destructive" data-testid="badge-suspended">
                  <Ban className="h-3 w-3 mr-1" />
                  Suspendido
                </Badge>
              )}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span data-testid="text-user-email">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Registrado: {format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(90vh-240px)] pr-4">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal" data-testid="tab-personal">
                <UserIcon className="h-4 w-4 mr-2" />
                Personal
              </TabsTrigger>
              {user.role === 'cliente' && (
                <TabsTrigger value="cards" data-testid="tab-cards">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Tarjetas
                </TabsTrigger>
              )}
              {user.role === 'owner' && (
                <TabsTrigger value="properties" data-testid="tab-properties">
                  <Home className="h-4 w-4 mr-2" />
                  Propiedades
                </TabsTrigger>
              )}
              <TabsTrigger value="activity" data-testid="tab-activity">
                <Activity className="h-4 w-4 mr-2" />
                Actividad
              </TabsTrigger>
              <TabsTrigger value="admin" data-testid="tab-admin">
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Nombre</Label>
                      <p className="text-sm font-medium" data-testid="text-first-name">{user.firstName || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Apellido</Label>
                      <p className="text-sm font-medium" data-testid="text-last-name">{user.lastName || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm font-medium" data-testid="text-email">{user.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Teléfono</Label>
                      <p className="text-sm font-medium" data-testid="text-phone">{user.phone || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Biografía</Label>
                      <p className="text-sm" data-testid="text-bio">{user.bio || "Sin biografía"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isSuspended && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Información de Suspensión
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <p className="text-sm font-medium">
                        {user.suspensionType === "temporary" ? "Temporal" : "Permanente"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Razón</Label>
                      <p className="text-sm" data-testid="text-suspension-reason">{user.suspensionReason || "-"}</p>
                    </div>
                    {user.suspensionType === "temporary" && user.suspensionEndDate && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Fecha de finalización</Label>
                        <p className="text-sm">
                          {format(new Date(user.suspensionEndDate), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-muted-foreground">Suspendido el</Label>
                      <p className="text-sm">
                        {user.suspendedAt ? format(new Date(user.suspendedAt), "dd/MM/yyyy HH:mm", { locale: es }) : "-"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Presentation Cards Tab */}
            {user.role === 'cliente' && (
              <TabsContent value="cards" className="space-y-4 mt-4">
                {isLoadingCards ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : !presentationCards || presentationCards.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tiene tarjetas de presentación creadas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {presentationCards.map((card: any) => (
                      <Card key={card.id} data-testid={`card-presentation-${card.id}`}>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{card.name || "Tarjeta sin nombre"}</h4>
                              <Badge variant={card.isActive ? "default" : "secondary"}>
                                {card.isActive ? "Activa" : "Inactiva"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Tipo: </span>
                                <span>{card.propertyType}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Presupuesto: </span>
                                <span>${card.minPrice} - ${card.maxPrice}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Ubicación: </span>
                                <span>{card.location}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Ocupantes: </span>
                                <span>{card.numberOfOccupants || "-"}</span>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Usada {card.timesUsed || 0} veces
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* Properties Tab */}
            {user.role === 'owner' && (
              <TabsContent value="properties" className="space-y-4 mt-4">
                {isLoadingProperties ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : !properties || properties.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tiene propiedades registradas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {properties.map((property: any) => (
                      <Card key={property.id} data-testid={`card-property-${property.id}`}>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{property.title}</h4>
                              <Badge variant={property.published ? "default" : "secondary"}>
                                {property.published ? "Publicada" : "No publicada"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {property.description}
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Precio: </span>
                                <span>${property.price} {property.currency}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Tipo: </span>
                                <span>{property.propertyType}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Estado: </span>
                                <span>{property.status}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4 mt-4">
              {isLoadingHistory ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : !auditHistory || auditHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay actividad registrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditHistory.map((log) => {
                    const ActionIcon = actionIcons[log.action] || Activity;
                    return (
                      <Card key={log.id} className="hover-elevate">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-full bg-primary/10 p-2">
                              <ActionIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">
                                  {actionLabels[log.action] || log.action}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground">
                                  {log.entityType}
                                </span>
                                {log.entityId && (
                                  <>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-xs text-muted-foreground font-mono">
                                      ID: {log.entityId.slice(0, 8)}...
                                    </span>
                                  </>
                                )}
                              </div>
                              {log.details && (
                                <p className="text-sm text-muted-foreground">
                                  {formatDetails(log.details)}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {format(new Date(log.createdAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Admin Actions Tab */}
            <TabsContent value="admin" className="space-y-4 mt-4">
              {canChangeRole && user.status === "approved" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Gestión de Roles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-role">Cambiar Rol de Usuario</Label>
                      <div className="flex gap-2">
                        <Select value={newRole} onValueChange={setNewRole}>
                          <SelectTrigger id="new-role" data-testid="select-new-role">
                            <SelectValue placeholder="Seleccionar nuevo rol" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map((role) => (
                              <SelectItem 
                                key={role.value} 
                                value={role.value}
                                disabled={role.value === user.role}
                              >
                                {role.label}
                                {role.value === user.role && " (Actual)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleChangeRole} 
                          disabled={!newRole || newRole === user.role || updateUserRole.isPending}
                          data-testid="button-change-role"
                        >
                          Cambiar
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        El rol actual es: <span className="font-semibold">{roleLabels[user.role] || user.role}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Acciones Administrativas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Gestionar contraseña y cuenta del usuario</p>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendResetLink.mutate(user.id)}
                          disabled={sendResetLink.isPending || !user.passwordHash}
                          data-testid="button-send-reset-link"
                        >
                          <KeyRound className="h-4 w-4 mr-2" />
                          {sendResetLink.isPending ? "Enviando..." : "Enviar Link Reset"}
                        </Button>
                        
                        {isSuspended ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => unsuspendUser.mutate(user.id)}
                            disabled={unsuspendUser.isPending}
                            data-testid="button-unsuspend"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Reactivar Cuenta
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSuspendDialog(true)}
                            disabled={user.id === currentUser?.id}
                            data-testid="button-suspend"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Suspender Cuenta
                          </Button>
                        )}

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setShowDeleteDialog(true)}
                          disabled={deleteUser.isPending || user.id === currentUser?.id}
                          data-testid="button-delete-user"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar Usuario
                        </Button>
                      </div>
                      {!user.passwordHash && (
                        <p className="text-xs text-muted-foreground">
                          Este usuario usa autenticación de terceros. No se puede enviar enlace de restablecimiento.
                        </p>
                      )}
                      {user.id === currentUser?.id && (
                        <p className="text-xs text-muted-foreground">
                          No puedes suspender o eliminar tu propia cuenta desde aquí.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Role Change Confirmation Dialog */}
        <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <AlertDialogContent data-testid="dialog-confirm-role-change">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar cambio de rol</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de cambiar el rol de {fullName} a {roleLabels[newRole] || newRole}?
                Esta acción se registrará en el historial de auditoría.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-role-change">Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmChangeRole}
                disabled={updateUserRole.isPending}
                data-testid="button-confirm-role-change"
              >
                {updateUserRole.isPending ? "Cambiando..." : "Confirmar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete User Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent data-testid="dialog-confirm-delete">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de eliminar a {fullName}? Esta acción no se puede deshacer y eliminará todos los datos asociados al usuario.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteUser.mutate(user.id)}
                disabled={deleteUser.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {deleteUser.isPending ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Suspend User Dialog */}
        <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
          <AlertDialogContent data-testid="dialog-suspend-user">
            <AlertDialogHeader>
              <AlertDialogTitle>Suspender cuenta de usuario</AlertDialogTitle>
              <AlertDialogDescription>
                Suspende la cuenta de {fullName}. El usuario no podrá acceder al sistema hasta que sea reactivado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="suspension-type">Tipo de suspensión</Label>
                <Select value={suspensionType} onValueChange={(value: "temporary" | "permanent") => setSuspensionType(value)}>
                  <SelectTrigger id="suspension-type" data-testid="select-suspension-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temporary">Temporal</SelectItem>
                    <SelectItem value="permanent">Permanente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {suspensionType === "temporary" && (
                <div className="space-y-2">
                  <Label htmlFor="suspension-end-date">Fecha de finalización</Label>
                  <Input
                    id="suspension-end-date"
                    type="datetime-local"
                    value={suspensionEndDate}
                    onChange={(e) => setSuspensionEndDate(e.target.value)}
                    data-testid="input-suspension-end-date"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="suspension-reason">Razón de la suspensión</Label>
                <Textarea
                  id="suspension-reason"
                  placeholder="Describe la razón de la suspensión..."
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  data-testid="textarea-suspension-reason"
                  rows={4}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-suspend">Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleSuspendUser}
                disabled={suspendUser.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-suspend"
              >
                {suspendUser.isPending ? "Suspendiendo..." : "Suspender"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
