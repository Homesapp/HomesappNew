import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, UserCircle, CheckCircle, XCircle, Mail, Phone, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { usePendingRoleRequests, useApproveRoleRequest, useRejectRoleRequest } from "@/hooks/useRoleRequests";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { User, RoleRequest } from "@shared/schema";

const roleLabels: Record<string, string> = {
  cliente: "Cliente",
  owner: "Propietario",
  seller: "Vendedor",
  management: "Management",
  concierge: "Conserje",
  provider: "Proveedor",
  hoa_manager: "HOA Manager",
};

const roleColors: Record<string, string> = {
  cliente: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  owner: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  seller: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  management: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  concierge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  provider: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  hoa_manager: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
};

const requestStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const requestStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("clients");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RoleRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");

  const { toast } = useToast();

  // Fetch clients (users with role "cliente")
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<User[]>({
    queryKey: ["/api/users/role/cliente"],
  });

  // Fetch pending role requests
  const { data: roleRequests = [], isLoading: isLoadingRequests } = usePendingRoleRequests();

  const approveRequest = useApproveRoleRequest();
  const rejectRequest = useRejectRoleRequest();

  const handleOpenReviewDialog = (request: RoleRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes("");
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedRequest) return;

    try {
      if (reviewAction === "approve") {
        await approveRequest.mutateAsync({
          id: selectedRequest.id,
          reviewNotes,
        });
        toast({
          title: "Solicitud aprobada",
          description: `Se ha aprobado la solicitud de ${roleLabels[selectedRequest.requestedRole]}.`,
        });
      } else {
        await rejectRequest.mutateAsync({
          id: selectedRequest.id,
          reviewNotes,
        });
        toast({
          title: "Solicitud rechazada",
          description: `Se ha rechazado la solicitud de ${roleLabels[selectedRequest.requestedRole]}.`,
        });
      }
      setReviewDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la solicitud",
        variant: "destructive",
      });
    }
  };

  const filterClients = (users: User[]) => {
    if (!searchQuery) return users;
    return users.filter((user) => {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
      const email = (user.email || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  };

  const filterRequests = (requests: RoleRequest[]) => {
    if (!searchQuery) return requests;
    return requests.filter((request) => {
      const role = roleLabels[request.requestedRole]?.toLowerCase() || request.requestedRole.toLowerCase();
      const reason = (request.reason || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      return role.includes(query) || reason.includes(query);
    });
  };

  const filteredClients = filterClients(clients);
  const filteredRequests = filterRequests(roleRequests);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona los clientes y sus solicitudes de roles adicionales
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="clients" data-testid="tab-clients">
            Clientes
            {!isLoadingClients && (
              <Badge variant="secondary" className="ml-2">
                {clients.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">
            Solicitudes
            {!isLoadingRequests && roleRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                {roleRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          {isLoadingClients ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-12 w-12 rounded-full mb-3" />
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No se encontraron clientes" : "No hay clientes registrados"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => {
                const fullName = `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Usuario";
                const initials = `${client.firstName?.[0] || ""}${client.lastName?.[0] || ""}`.toUpperCase();

                return (
                  <Card key={client.id} data-testid={`card-client-${client.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={client.profileImageUrl || undefined} alt={fullName} />
                          <AvatarFallback>{initials || "??"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{fullName}</h3>
                          <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{client.email}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(client.createdAt), "dd MMM yyyy", { locale: es })}</span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Badge className={roleColors.cliente}>
                              {roleLabels.cliente}
                            </Badge>
                            {client.additionalRole && (
                              <Badge className={roleColors[client.additionalRole] || "bg-gray-100 text-gray-800"}>
                                {roleLabels[client.additionalRole] || client.additionalRole}
                              </Badge>
                            )}
                            {client.emailVerified && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verificado
                              </Badge>
                            )}
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

        <TabsContent value="requests" className="space-y-4">
          {isLoadingRequests ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-5 w-1/4 mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-3" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No se encontraron solicitudes" : "No hay solicitudes pendientes"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} data-testid={`card-request-${request.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          Solicitud de rol: {roleLabels[request.requestedRole] || request.requestedRole}
                          <Badge className={requestStatusColors[request.status]}>
                            {requestStatusLabels[request.status]}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Solicitado el {format(new Date(request.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {request.reason && (
                      <div>
                        <p className="text-sm font-medium mb-1">Motivo:</p>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleOpenReviewDialog(request, "approve")}
                        disabled={approveRequest.isPending || rejectRequest.isPending}
                        className="flex-1"
                        data-testid={`button-approve-${request.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprobar
                      </Button>
                      <Button
                        onClick={() => handleOpenReviewDialog(request, "reject")}
                        disabled={approveRequest.isPending || rejectRequest.isPending}
                        variant="outline"
                        className="flex-1"
                        data-testid={`button-reject-${request.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent data-testid="dialog-review">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Aprobar Solicitud" : "Rechazar Solicitud"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "¿Estás seguro de que deseas aprobar esta solicitud? El usuario recibirá el rol solicitado."
                : "¿Estás seguro de que deseas rechazar esta solicitud? El usuario será notificado."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reviewNotes">Notas de revisión (opcional)</Label>
              <Textarea
                id="reviewNotes"
                placeholder="Agrega comentarios o notas sobre esta decisión..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                data-testid="textarea-reviewNotes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              data-testid="button-cancel-review"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={approveRequest.isPending || rejectRequest.isPending}
              variant={reviewAction === "reject" ? "destructive" : "default"}
              data-testid="button-confirm-review"
            >
              {approveRequest.isPending || rejectRequest.isPending
                ? "Procesando..."
                : reviewAction === "approve"
                ? "Aprobar"
                : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
