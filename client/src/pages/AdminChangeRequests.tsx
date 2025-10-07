import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import type { Property, PropertyChangeRequest } from "@shared/schema";

type ChangeRequestStatus = "pending" | "approved" | "rejected";

interface ChangeRequestWithProperty extends PropertyChangeRequest {
  property?: Property;
  requestedBy?: { email: string; name?: string };
}

export default function AdminChangeRequests() {
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequestWithProperty | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<ChangeRequestStatus | "all">("pending");
  const { toast } = useToast();

  const { data: allRequests = [], isLoading } = useQuery<ChangeRequestWithProperty[]>({
    queryKey: ["/api/admin/change-requests"],
  });

  const filteredRequests = statusFilter === "all" 
    ? allRequests 
    : allRequests.filter(req => req.status === statusFilter);

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return apiRequest("PATCH", `/api/admin/change-requests/${id}/approve`, { reviewNotes: notes });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud aprobada",
        description: "Los cambios han sido aplicados a la propiedad",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
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
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return apiRequest("PATCH", `/api/admin/change-requests/${id}/reject`, { reviewNotes: notes });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/change-requests"] });
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

  const handleOpenReview = (request: ChangeRequestWithProperty, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes(request.reviewNotes || "");
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setReviewAction(null);
    setReviewNotes("");
  };

  const handleSubmitReview = () => {
    if (!selectedRequest) return;

    if (reviewAction === "approve") {
      approveMutation.mutate({ id: selectedRequest.id, notes: reviewNotes });
    } else if (reviewAction === "reject") {
      rejectMutation.mutate({ id: selectedRequest.id, notes: reviewNotes });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "default", icon: Clock, label: "Pendiente" },
      approved: { variant: "default", icon: CheckCircle2, label: "Aprobada" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rechazada" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1" data-testid={`badge-status-${status}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatFieldName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      title: "Título",
      description: "Descripción",
      propertyType: "Tipo de propiedad",
      price: "Precio",
      location: "Ubicación",
      bedrooms: "Habitaciones",
      bathrooms: "Baños",
      area: "Área",
      amenities: "Amenidades",
    };
    return fieldNames[field] || field;
  };

  const formatValue = (value: any): string => {
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return String(value || "");
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando solicitudes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-change-requests">Solicitudes de Cambio</h1>
        <p className="text-muted-foreground">
          Gestiona las solicitudes de cambio de propiedades
        </p>
      </div>

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes ({allRequests.filter(r => r.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Aprobadas ({allRequests.filter(r => r.status === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rechazadas ({allRequests.filter(r => r.status === "rejected").length})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            Todas ({allRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4 mt-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No hay solicitudes en este estado
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} data-testid={`card-change-request-${request.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          Propiedad: {request.property?.title || request.propertyId}
                        </CardTitle>
                        {getStatusBadge(request.status)}
                      </div>
                      <CardDescription>
                        Solicitado el {new Date(request.createdAt).toLocaleDateString()} por{" "}
                        {request.requestedBy?.email || "Usuario desconocido"}
                      </CardDescription>
                    </div>
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleOpenReview(request, "approve")}
                          data-testid={`button-approve-${request.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleOpenReview(request, "reject")}
                          data-testid={`button-reject-${request.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Campos modificados:
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(request.changedFields as Record<string, any>).map(([field, changes]) => {
                        if (!changes || typeof changes !== 'object') return null;
                        
                        return (
                          <div
                            key={field}
                            className="bg-muted p-3 rounded-md space-y-1"
                            data-testid={`field-change-${field}`}
                          >
                            <div className="font-medium text-sm">{formatFieldName(field)}</div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Anterior: </span>
                                <span className="line-through">{formatValue(changes.old)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Nuevo: </span>
                                <span className="font-medium">{formatValue(changes.new)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {request.reviewNotes && (
                    <div>
                      <h4 className="font-medium mb-2">Notas de revisión:</h4>
                      <div className="bg-muted p-3 rounded-md text-sm" data-testid="text-review-notes">
                        {request.reviewNotes}
                      </div>
                    </div>
                  )}

                  {request.reviewedAt && (
                    <div className="text-sm text-muted-foreground">
                      Revisado el {new Date(request.reviewedAt).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!reviewAction} onOpenChange={() => handleCloseDialog()}>
        <DialogContent data-testid="dialog-review">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Aprobar solicitud" : "Rechazar solicitud"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "Los cambios se aplicarán inmediatamente a la propiedad."
                : "La solicitud será rechazada y no se aplicarán cambios."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reviewNotes">Notas de revisión (opcional)</Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Agrega comentarios sobre tu decisión..."
                rows={4}
                data-testid="input-review-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              data-testid="button-cancel-review"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              variant={reviewAction === "reject" ? "destructive" : "default"}
              data-testid="button-confirm-review"
            >
              {approveMutation.isPending || rejectMutation.isPending
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
