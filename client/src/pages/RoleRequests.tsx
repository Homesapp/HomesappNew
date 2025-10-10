import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApproveRoleRequest, useRejectRoleRequest } from "@/hooks/useRoleRequests";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { RoleRequest } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const roleLabels: Record<string, string> = {
  owner: "Propietario",
  cliente: "Cliente",
  abogado: "Abogado",
  contador: "Contador",
  seller: "Vendedor",
  management: "Gestión",
  provider: "Proveedor",
  concierge: "Conserje",
  agente_servicios_especiales: "Agente de Servicios Especiales",
  hoa_manager: "HOA Manager",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePictureUrl?: string;
};

type RoleRequestWithUser = RoleRequest & {
  user?: User;
};

export default function RoleRequests() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState<RoleRequestWithUser | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const { toast } = useToast();

  const { data: requests = [], isLoading } = useQuery<RoleRequestWithUser[]>({
    queryKey: ["/api/role-requests"],
  });

  const approveRequest = useApproveRoleRequest();
  const rejectRequest = useRejectRoleRequest();

  const handleOpenDialog = (request: RoleRequestWithUser, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setReviewNotes("");
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setReviewNotes("");
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      if (actionType === "approve") {
        await approveRequest.mutateAsync({
          id: selectedRequest.id,
          reviewNotes: reviewNotes || undefined,
        });
        toast({
          title: "Solicitud aprobada",
          description: `Se aprobó el rol de ${roleLabels[selectedRequest.requestedRole]} para el usuario.`,
        });
      } else {
        await rejectRequest.mutateAsync({
          id: selectedRequest.id,
          reviewNotes: reviewNotes || undefined,
        });
        toast({
          title: "Solicitud rechazada",
          description: "La solicitud de rol ha sido rechazada.",
        });
      }
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la solicitud",
        variant: "destructive",
      });
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (activeTab === "all") return true;
    return req.status === activeTab;
  });

  const getUserName = (request: RoleRequestWithUser) => {
    if (request.user?.firstName && request.user?.lastName) {
      return `${request.user.firstName} ${request.user.lastName}`;
    }
    return request.user?.email || "Usuario desconocido";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-role-requests">
          Solicitudes de Roles
        </h1>
        <p className="text-muted-foreground">
          Gestiona las solicitudes de roles adicionales de los usuarios
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            <Clock className="h-4 w-4 mr-2" />
            Pendientes
            {requests.filter(r => r.status === "pending").length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {requests.filter(r => r.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprobadas
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            <XCircle className="h-4 w-4 mr-2" />
            Rechazadas
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            Todas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">
                  No hay solicitudes {activeTab !== "all" && statusLabels[activeTab].toLowerCase()}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} data-testid={`card-request-${request.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={request.user?.profilePictureUrl} />
                        <AvatarFallback>
                          <UserIcon className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {getUserName(request)}
                        </CardTitle>
                        <CardDescription>
                          Solicita: <span className="font-semibold">{roleLabels[request.requestedRole]}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={statusColors[request.status]} data-testid={`badge-status-${request.id}`}>
                      {statusLabels[request.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-3 rounded-md space-y-2">
                    <Label className="text-sm font-semibold">Información de contacto:</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Email:</p>
                        <p className="text-sm font-medium" data-testid={`text-email-${request.id}`}>
                          {request.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">WhatsApp:</p>
                        <p className="text-sm font-medium" data-testid={`text-whatsapp-${request.id}`}>
                          {request.whatsapp}
                        </p>
                      </div>
                    </div>
                  </div>

                  {request.reason && (
                    <div>
                      <Label className="text-sm font-semibold">Razón:</Label>
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-reason-${request.id}`}>
                        {request.reason}
                      </p>
                    </div>
                  )}

                  {request.yearsOfExperience !== undefined && request.yearsOfExperience !== null && (
                    <div>
                      <Label className="text-sm font-semibold">Años de experiencia:</Label>
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-years-${request.id}`}>
                        {request.yearsOfExperience} {request.yearsOfExperience === 1 ? 'año' : 'años'}
                      </p>
                    </div>
                  )}

                  {request.experience && (
                    <div>
                      <Label className="text-sm font-semibold">Descripción de experiencia:</Label>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap" data-testid={`text-experience-${request.id}`}>
                        {request.experience}
                      </p>
                    </div>
                  )}

                  {request.additionalInfo && (
                    <div>
                      <Label className="text-sm font-semibold">Información adicional:</Label>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap" data-testid={`text-additional-${request.id}`}>
                        {request.additionalInfo}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      Solicitado: {format(new Date(request.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
                    </span>
                    {request.reviewedAt && (
                      <span>
                        Revisado: {format(new Date(request.reviewedAt), "dd 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    )}
                  </div>

                  {request.reviewNotes && (
                    <div>
                      <Label className="text-sm font-semibold">Notas de revisión:</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.reviewNotes}
                      </p>
                    </div>
                  )}

                  {request.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleOpenDialog(request, "approve")}
                        data-testid={`button-approve-${request.id}`}
                        disabled={approveRequest.isPending || rejectRequest.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprobar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleOpenDialog(request, "reject")}
                        data-testid={`button-reject-${request.id}`}
                        disabled={approveRequest.isPending || rejectRequest.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent data-testid="dialog-review-request">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Aprobar" : "Rechazar"} Solicitud de Rol
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" 
                ? `¿Deseas aprobar la solicitud de ${selectedRequest ? roleLabels[selectedRequest.requestedRole] : ""} para ${selectedRequest ? getUserName(selectedRequest) : ""}?`
                : `¿Deseas rechazar la solicitud de ${selectedRequest ? roleLabels[selectedRequest.requestedRole] : ""} para ${selectedRequest ? getUserName(selectedRequest) : ""}?`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="review-notes">Notas de revisión (opcional)</Label>
            <Textarea
              id="review-notes"
              placeholder="Agrega comentarios sobre esta decisión..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              data-testid="textarea-review-notes"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel-review">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={approveRequest.isPending || rejectRequest.isPending}
              data-testid="button-confirm-review"
            >
              {approveRequest.isPending || rejectRequest.isPending ? (
                "Procesando..."
              ) : (
                actionType === "approve" ? "Aprobar" : "Rechazar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
