import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { ExternalPublicationRequestWithDetails } from "@shared/schema";
import { 
  Check, 
  X, 
  Clock, 
  FileText, 
  Building2, 
  Eye,
  Home,
  BedDouble,
  Bath,
  DollarSign,
  MapPin,
  RefreshCw
} from "lucide-react";

type RequestStatus = "pending" | "approved" | "rejected" | "withdrawn";

interface PublicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
}

export default function AdminExternalPublicationRequests() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const locale = language === "es" ? es : enUS;
  
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | "all">("pending");
  const [selectedRequest, setSelectedRequest] = useState<ExternalPublicationRequestWithDetails | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState("");

  const { data: stats, isLoading: isLoadingStats } = useQuery<PublicationStats>({
    queryKey: ["/api/external-publication-requests", "stats"],
  });

  const { data: requests = [], isLoading: isLoadingRequests, refetch } = useQuery<ExternalPublicationRequestWithDetails[]>({
    queryKey: ["/api/external-publication-requests", { status: selectedStatus }],
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("PATCH", `/api/external-publication-requests/${requestId}/review`, {
        decision: "approved",
        feedback: adminFeedback,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-publication-requests"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
      setAdminFeedback("");
      toast({
        title: language === "es" ? "Solicitud aprobada" : "Request approved",
        description: language === "es"
          ? "La unidad ha sido publicada en el sitio principal"
          : "The unit has been published to the main site",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo aprobar la solicitud" : "Could not approve request"),
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("PATCH", `/api/external-publication-requests/${requestId}/review`, {
        decision: "rejected",
        feedback: adminFeedback,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-publication-requests"], exact: false });
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      setAdminFeedback("");
      toast({
        title: language === "es" ? "Solicitud rechazada" : "Request rejected",
        description: language === "es"
          ? "Se ha notificado a la agencia"
          : "The agency has been notified",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo rechazar la solicitud" : "Could not reject request"),
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{language === "es" ? "Pendiente" : "Pending"}</Badge>;
      case "approved":
        return <Badge className="bg-green-600"><Check className="w-3 h-3 mr-1" />{language === "es" ? "Aprobada" : "Approved"}</Badge>;
      case "rejected":
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />{language === "es" ? "Rechazada" : "Rejected"}</Badge>;
      case "withdrawn":
        return <Badge variant="secondary">{language === "es" ? "Retirada" : "Withdrawn"}</Badge>;
      default:
        return null;
    }
  };

  const formatPrice = (price: string | number | null | undefined): string => {
    if (!price) return "-";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const handleViewDetails = (request: ExternalPublicationRequestWithDetails) => {
    setSelectedRequest(request);
    setIsReviewDialogOpen(true);
  };

  const handleApprove = () => {
    if (selectedRequest) {
      setIsReviewDialogOpen(false);
      setIsApproveDialogOpen(true);
    }
  };

  const handleReject = () => {
    if (selectedRequest) {
      setIsReviewDialogOpen(false);
      setIsRejectDialogOpen(true);
    }
  };

  const confirmApprove = () => {
    if (selectedRequest) {
      approveMutation.mutate(selectedRequest.id);
    }
  };

  const confirmReject = () => {
    if (selectedRequest) {
      rejectMutation.mutate(selectedRequest.id);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-publication-requests-page">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Solicitudes de Publicación" : "Publication Requests"}
          </h1>
          <p className="text-muted-foreground">
            {language === "es"
              ? "Revisar y aprobar solicitudes de publicación de unidades externas"
              : "Review and approve external unit publication requests"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          data-testid="button-refresh"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {language === "es" ? "Actualizar" : "Refresh"}
        </Button>
      </div>

      {isLoadingStats ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card 
            className={`cursor-pointer transition-all ${selectedStatus === "pending" ? "ring-2 ring-primary" : "hover-elevate"}`}
            onClick={() => setSelectedStatus("pending")}
            data-testid="card-stats-pending"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "es" ? "Pendientes" : "Pending"}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all ${selectedStatus === "approved" ? "ring-2 ring-primary" : "hover-elevate"}`}
            onClick={() => setSelectedStatus("approved")}
            data-testid="card-stats-approved"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "es" ? "Aprobadas" : "Approved"}
              </CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${selectedStatus === "rejected" ? "ring-2 ring-primary" : "hover-elevate"}`}
            onClick={() => setSelectedStatus("rejected")}
            data-testid="card-stats-rejected"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "es" ? "Rechazadas" : "Rejected"}
              </CardTitle>
              <X className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${selectedStatus === "all" ? "ring-2 ring-primary" : "hover-elevate"}`}
            onClick={() => setSelectedStatus("all")}
            data-testid="card-stats-total"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "es" ? "Total" : "Total"}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {language === "es" ? "Solicitudes" : "Requests"}
            {selectedStatus !== "all" && (
              <Badge variant="outline" className="ml-2">
                {selectedStatus === "pending" && (language === "es" ? "Pendientes" : "Pending")}
                {selectedStatus === "approved" && (language === "es" ? "Aprobadas" : "Approved")}
                {selectedStatus === "rejected" && (language === "es" ? "Rechazadas" : "Rejected")}
                {selectedStatus === "withdrawn" && (language === "es" ? "Retiradas" : "Withdrawn")}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {language === "es"
              ? "Haz clic en una tarjeta de estadísticas para filtrar"
              : "Click on a stats card to filter"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRequests ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === "es"
                ? "No hay solicitudes para mostrar"
                : "No requests to display"}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "es" ? "Unidad" : "Unit"}</TableHead>
                    <TableHead>{language === "es" ? "Agencia" : "Agency"}</TableHead>
                    <TableHead>{language === "es" ? "Tipo" : "Type"}</TableHead>
                    <TableHead>{language === "es" ? "Precio" : "Price"}</TableHead>
                    <TableHead>{language === "es" ? "Fecha" : "Date"}</TableHead>
                    <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                    <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{request.unit.unitNumber}</span>
                          <span className="text-xs text-muted-foreground">
                            {request.unit.condominium?.name || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{request.agency?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {request.unit.propertyType || request.unit.rentalPurpose || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPrice(request.unit.salePrice || request.unit.monthlyRent)}</TableCell>
                      <TableCell>
                        {format(new Date(request.requestedAt), "dd MMM yyyy", { locale })}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(request)}
                          data-testid={`button-view-${request.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {language === "es" ? "Ver" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              {language === "es" ? "Detalles de la Solicitud" : "Request Details"}
            </DialogTitle>
            <DialogDescription>
              {language === "es"
                ? "Revisa la información de la unidad antes de aprobar o rechazar"
                : "Review the unit information before approving or rejecting"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">{language === "es" ? "Estado" : "Status"}</span>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">{language === "es" ? "Fecha de Solicitud" : "Request Date"}</span>
                  <div className="font-medium">
                    {format(new Date(selectedRequest.requestedAt), "PPP", { locale })}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {language === "es" ? "Información de la Unidad" : "Unit Information"}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">{language === "es" ? "Número de Unidad" : "Unit Number"}</span>
                    <div className="font-medium">{selectedRequest.unit.unitNumber}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">{language === "es" ? "Condominio" : "Condominium"}</span>
                    <div className="font-medium">{selectedRequest.unit.condominium?.name || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">{language === "es" ? "Tipo de Propiedad" : "Property Type"}</span>
                    <div className="font-medium">{selectedRequest.unit.propertyType || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">{language === "es" ? "Propósito" : "Purpose"}</span>
                    <div className="font-medium">
                      <Badge variant="outline">{selectedRequest.unit.rentalPurpose || "rental"}</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.unit.bedrooms || 0} {language === "es" ? "recámaras" : "beds"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.unit.bathrooms || 0} {language === "es" ? "baños" : "baths"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.unit.zone || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{formatPrice(selectedRequest.unit.salePrice || selectedRequest.unit.monthlyRent)}</span>
                  </div>
                </div>

                {selectedRequest.unit.description && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground">{language === "es" ? "Descripción" : "Description"}</span>
                    <p className="mt-1 text-sm">{selectedRequest.unit.description}</p>
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold">{language === "es" ? "Agencia" : "Agency"}</h3>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">{selectedRequest.agency?.name}</div>
                    {selectedRequest.requestedByUser && (
                      <div className="text-sm text-muted-foreground">
                        {language === "es" ? "Solicitado por" : "Requested by"}: {selectedRequest.requestedByUser.firstName} {selectedRequest.requestedByUser.lastName}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedRequest.adminFeedback && (
                <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
                  <h3 className="font-semibold">{language === "es" ? "Comentarios del Admin" : "Admin Feedback"}</h3>
                  <p className="text-sm">{selectedRequest.adminFeedback}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {selectedRequest?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  data-testid="button-reject-dialog"
                >
                  <X className="h-4 w-4 mr-2" />
                  {language === "es" ? "Rechazar" : "Reject"}
                </Button>
                <Button
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-approve-dialog"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {language === "es" ? "Aprobar" : "Approve"}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              {language === "es" ? "Cerrar" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "es" ? "Aprobar Solicitud" : "Approve Request"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es"
                ? "Esta acción creará una propiedad en el sitio principal con la información de la unidad externa."
                : "This action will create a property on the main site with the external unit information."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">
              {language === "es" ? "Comentarios (opcional)" : "Feedback (optional)"}
            </label>
            <Textarea
              value={adminFeedback}
              onChange={(e) => setAdminFeedback(e.target.value)}
              placeholder={language === "es" ? "Añadir comentarios..." : "Add comments..."}
              className="mt-2"
              data-testid="input-approve-feedback"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminFeedback("")}>
              {language === "es" ? "Cancelar" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprove}
              className="bg-green-600 hover:bg-green-700"
              disabled={approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {language === "es" ? "Confirmar Aprobación" : "Confirm Approval"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "es" ? "Rechazar Solicitud" : "Reject Request"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es"
                ? "Por favor proporciona una razón para el rechazo. La agencia será notificada."
                : "Please provide a reason for rejection. The agency will be notified."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">
              {language === "es" ? "Razón del rechazo *" : "Rejection reason *"}
            </label>
            <Textarea
              value={adminFeedback}
              onChange={(e) => setAdminFeedback(e.target.value)}
              placeholder={language === "es" ? "Explica por qué se rechaza la solicitud..." : "Explain why the request is rejected..."}
              className="mt-2"
              required
              data-testid="input-reject-feedback"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminFeedback("")}>
              {language === "es" ? "Cancelar" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              className="bg-destructive hover:bg-destructive/90"
              disabled={rejectMutation.isPending || !adminFeedback.trim()}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              {language === "es" ? "Confirmar Rechazo" : "Confirm Rejection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
