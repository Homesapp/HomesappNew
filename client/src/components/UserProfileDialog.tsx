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
import type { User } from "@shared/schema";
import { useUserAuditHistory } from "@/hooks/useUsers";
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
  Eye
} from "lucide-react";

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
  const { data: auditHistory, isLoading: isLoadingHistory } = useUserAuditHistory(
    user?.id || null,
    100
  );

  if (!user) return null;

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuario";
  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";

  const formatDetails = (details: unknown): string => {
    if (!details) return "";
    if (typeof details === "string") return details;
    try {
      return JSON.stringify(details);
    } catch {
      return String(details);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]" data-testid="dialog-user-profile">
        <DialogHeader>
          <DialogTitle>Perfil de Usuario</DialogTitle>
          <DialogDescription>
            Información detallada y historial de actividad
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="pr-4">
          <div className="space-y-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
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
              </CardHeader>
            </Card>

            {/* Activity Tabs */}
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity" data-testid="tab-activity">
                  <Activity className="h-4 w-4 mr-2" />
                  Actividad Reciente
                </TabsTrigger>
                <TabsTrigger value="details" data-testid="tab-details">
                  <FileText className="h-4 w-4 mr-2" />
                  Detalles
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="space-y-4">
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

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Información Personal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                        <p className="text-sm">{user.firstName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Apellido</p>
                        <p className="text-sm">{user.lastName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-sm">{user.email || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Rol</p>
                        <p className="text-sm">{roleLabels[user.role] || user.role}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Estado</p>
                        <p className="text-sm">{statusLabels[user.status] || user.status}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">ID</p>
                        <p className="text-xs font-mono">{user.id}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Fechas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha de Registro</p>
                      <p className="text-sm">
                        {format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
                      <p className="text-sm">
                        {format(new Date(user.updatedAt), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
