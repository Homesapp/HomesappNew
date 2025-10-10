import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, User, Home, Calendar, Loader2, Gift } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { RentalOpportunityRequest, Property, User as UserType, Appointment } from "@shared/schema";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

type RequestWithDetails = RentalOpportunityRequest & {
  client: UserType;
  property: Property;
  appointment: Appointment;
};

export default function AdminRentalOpportunityRequests() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDetails | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Grant opportunity states
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [grantNotes, setGrantNotes] = useState("");

  const { data: requests = [], isLoading } = useQuery<RequestWithDetails[]>({
    queryKey: ["/api/admin/rental-opportunity-requests"],
  });

  // Fetch clients for grant dialog
  const { data: clients = [] } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users?role=cliente"],
    enabled: showGrantDialog,
  });

  // Fetch properties for grant dialog
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    enabled: showGrantDialog,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/admin/rental-opportunity-requests/${id}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Solicitud aprobada",
        description: "El cliente ahora puede crear su oferta de renta",
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey.some(key => 
            typeof key === 'string' && key.includes('/api/admin/rental-opportunity-requests')
          )
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar la solicitud",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiRequest("PATCH", `/api/admin/rental-opportunity-requests/${id}/reject`, {
        rejectionReason: reason,
      });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada",
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey.some(key => 
            typeof key === 'string' && key.includes('/api/admin/rental-opportunity-requests')
          )
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar la solicitud",
        variant: "destructive",
      });
    },
  });

  const grantOpportunityMutation = useMutation({
    mutationFn: async (data: { userId: string; propertyId: string; notes?: string }) => {
      return await apiRequest("POST", "/api/admin/rental-opportunity-requests/grant", data);
    },
    onSuccess: () => {
      toast({
        title: "Oportunidad otorgada",
        description: "El cliente ha sido notificado y puede crear su oferta de renta",
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey.some(key => 
            typeof key === 'string' && key.includes('/api/admin/rental-opportunity-requests')
          )
      });
      handleCloseGrantDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo otorgar la oportunidad",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (request: RequestWithDetails, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setRejectionReason("");
  };

  const handleCloseGrantDialog = () => {
    setShowGrantDialog(false);
    setSelectedClientId("");
    setSelectedPropertyId("");
    setGrantNotes("");
  };

  const handleConfirmAction = () => {
    if (!selectedRequest) return;

    if (actionType === "approve") {
      approveMutation.mutate(selectedRequest.id);
    } else if (actionType === "reject") {
      if (!rejectionReason.trim()) {
        toast({
          title: "Razón requerida",
          description: "Por favor proporciona una razón para rechazar la solicitud",
          variant: "destructive",
        });
        return;
      }
      rejectMutation.mutate({ id: selectedRequest.id, reason: rejectionReason });
    }
  };

  const handleGrantOpportunity = () => {
    if (!selectedClientId || !selectedPropertyId) {
      toast({
        title: "Campos requeridos",
        description: "Por favor selecciona un cliente y una propiedad",
        variant: "destructive",
      });
      return;
    }

    grantOpportunityMutation.mutate({
      userId: selectedClientId,
      propertyId: selectedPropertyId,
      notes: grantNotes || undefined,
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");
  const rejectedRequests = requests.filter(r => r.status === "rejected");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pendiente</Badge>;
      case "approved":
        return <Badge className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Aprobada</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const RequestCard = ({ request }: { request: RequestWithDetails }) => (
    <Card className="hover-elevate">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              {request.property.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {request.client.name} ({request.client.email})
            </CardDescription>
          </div>
          <div>{getStatusBadge(request.status)}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          {request.appointment ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Cita: {format(new Date(request.appointment.appointmentDate), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gift className="h-4 w-4" />
              <span>Oportunidad otorgada directamente (sin cita)</span>
            </div>
          )}
          <div className="text-muted-foreground">
            Solicitado: {format(new Date(request.createdAt!), "dd/MM/yyyy HH:mm", { locale: es })}
          </div>
          {request.status === "approved" && request.approvedAt && (
            <div className="text-green-600">
              Aprobado: {format(new Date(request.approvedAt), "dd/MM/yyyy HH:mm", { locale: es })}
            </div>
          )}
          {request.status === "rejected" && request.rejectionReason && (
            <div className="text-destructive">
              Razón de rechazo: {request.rejectionReason}
            </div>
          )}
          {request.notes && (
            <div className="text-muted-foreground">
              <span className="font-medium">Notas:</span> {request.notes}
            </div>
          )}
        </div>

        {request.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleOpenDialog(request, "approve")}
              className="flex-1"
              data-testid={`button-approve-${request.id}`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleOpenDialog(request, "reject")}
              className="flex-1"
              data-testid={`button-reject-${request.id}`}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold" data-testid="title-opportunity-requests">
            Solicitudes de Oportunidades de Renta
          </h1>
          <Button 
            onClick={() => setShowGrantDialog(true)}
            data-testid="button-grant-opportunity"
          >
            <Gift className="h-4 w-4 mr-2" />
            Otorgar Oportunidad
          </Button>
        </div>
        <p className="text-muted-foreground">
          Gestiona las solicitudes de clientes para crear ofertas de renta u otorga oportunidades directamente
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pending">
              {pendingRequests.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-approved">
              {approvedRequests.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-rejected">
              {rejectedRequests.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Solicitudes Pendientes</h2>
          <div className="grid gap-4">
            {pendingRequests.map(request => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      )}

      {/* Approved Requests */}
      {approvedRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Solicitudes Aprobadas</h2>
          <div className="grid gap-4">
            {approvedRequests.map(request => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Solicitudes Rechazadas</h2>
          <div className="grid gap-4">
            {rejectedRequests.map(request => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay solicitudes de oportunidades</p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!actionType} onOpenChange={handleCloseDialog}>
        <DialogContent data-testid="dialog-confirm-action">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Aprobar Solicitud" : "Rechazar Solicitud"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Al aprobar esta solicitud, el cliente podrá crear una oferta de renta formal."
                : "Al rechazar esta solicitud, el cliente será notificado y no podrá crear una oferta."}
            </DialogDescription>
          </DialogHeader>

          {actionType === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Razón del rechazo *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explica por qué se rechaza la solicitud..."
                data-testid="textarea-rejection-reason"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel-action">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              variant={actionType === "approve" ? "default" : "destructive"}
              data-testid="button-confirm-action"
            >
              {(approveMutation.isPending || rejectMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {actionType === "approve" ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Opportunity Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent data-testid="dialog-grant-opportunity">
          <DialogHeader>
            <DialogTitle>Otorgar Oportunidad de Renta</DialogTitle>
            <DialogDescription>
              Otorga una oportunidad de renta directamente a un cliente sin necesidad de una cita previa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-select">Cliente *</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger id="client-select" data-testid="select-client">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property-select">Propiedad *</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger id="property-select" data-testid="select-property">
                  <SelectValue placeholder="Selecciona una propiedad" />
                </SelectTrigger>
                <SelectContent>
                  {properties
                    .filter(p => p.status === 'available')
                    .map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title} - {property.location}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grant-notes">Notas (opcional)</Label>
              <Textarea
                id="grant-notes"
                value={grantNotes}
                onChange={(e) => setGrantNotes(e.target.value)}
                placeholder="Notas adicionales sobre esta oportunidad..."
                data-testid="textarea-grant-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseGrantDialog} 
              data-testid="button-cancel-grant"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGrantOpportunity}
              disabled={grantOpportunityMutation.isPending}
              data-testid="button-confirm-grant"
            >
              {grantOpportunityMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Otorgar Oportunidad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
