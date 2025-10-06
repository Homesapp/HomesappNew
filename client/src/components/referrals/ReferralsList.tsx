import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Mail, Phone, User, Home, MapPin, Globe, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import type { ClientReferral, OwnerReferral } from "@shared/schema";
import { format } from "date-fns";

interface ReferralsListProps {
  type: "client" | "owner";
  referrals: ClientReferral[] | OwnerReferral[];
}

const statusLabels: Record<string, { es: string; en: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendiente_confirmacion: { es: "Pendiente Confirmación", en: "Pending Confirmation", variant: "secondary" },
  confirmado: { es: "Confirmado", en: "Confirmed", variant: "default" },
  en_revision: { es: "En Revisión", en: "Under Review", variant: "default" },
  seleccion_propiedad: { es: "Selección de Propiedad", en: "Property Selection", variant: "default" },
  proceso_renta: { es: "Proceso de Renta", en: "Rental Process", variant: "default" },
  contactado: { es: "Contactado", en: "Contacted", variant: "default" },
  propiedad_agregada: { es: "Propiedad Agregada", en: "Property Added", variant: "default" },
  propiedad_enlistada: { es: "Propiedad Enlistada", en: "Property Listed", variant: "default" },
  pendiente_aprobacion_admin: { es: "Pendiente Aprobación Admin", en: "Pending Admin Approval", variant: "secondary" },
  aprobado: { es: "Aprobado", en: "Approved", variant: "default" },
  rechazado: { es: "Rechazado", en: "Rejected", variant: "destructive" },
  pagado: { es: "Pagado", en: "Paid", variant: "default" },
  completado: { es: "Completado", en: "Completed", variant: "default" },
  cancelado: { es: "Cancelado", en: "Cancelled", variant: "destructive" },
};

export function ReferralsList({ type, referrals }: ReferralsListProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<OwnerReferral | null>(null);
  const [commissionAmount, setCommissionAmount] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  
  const isAdmin = user?.role === "admin" || user?.role === "master";
  
  const approveMutation = useMutation({
    mutationFn: async ({ id, commission }: { id: string; commission?: string }) => {
      return await apiRequest("PATCH", `/api/owner-referrals/${id}/approve`, {
        commissionAmount: commission
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner-referrals"] });
      toast({
        title: t("referrals.approved", "Referido aprobado"),
        description: t("referrals.approvedDesc", "El referido ha sido aprobado exitosamente"),
      });
      setShowApproveDialog(false);
      setSelectedReferral(null);
      setCommissionAmount("");
    },
    onError: (error: any) => {
      toast({
        title: t("common.error", "Error"),
        description: error.message || t("referrals.approveError", "No se pudo aprobar el referido"),
        variant: "destructive",
      });
    },
  });
  
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiRequest("PATCH", `/api/owner-referrals/${id}/reject`, {
        rejectionReason: reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner-referrals"] });
      toast({
        title: t("referrals.rejected", "Referido rechazado"),
        description: t("referrals.rejectedDesc", "El referido ha sido rechazado"),
      });
      setShowRejectDialog(false);
      setSelectedReferral(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({
        title: t("common.error", "Error"),
        description: error.message || t("referrals.rejectError", "No se pudo rechazar el referido"),
        variant: "destructive",
      });
    },
  });
  
  const handleApprove = (referral: OwnerReferral) => {
    setSelectedReferral(referral);
    // Calculate default 20% commission
    if (referral.estimatedValue) {
      const defaultCommission = (parseFloat(referral.estimatedValue) * 0.20).toFixed(2);
      setCommissionAmount(defaultCommission);
    }
    setShowApproveDialog(true);
  };
  
  const handleReject = (referral: OwnerReferral) => {
    setSelectedReferral(referral);
    setShowRejectDialog(true);
  };
  
  const confirmApprove = () => {
    if (selectedReferral) {
      approveMutation.mutate({ 
        id: selectedReferral.id, 
        commission: commissionAmount 
      });
    }
  };
  
  const confirmReject = () => {
    if (selectedReferral && rejectionReason.trim()) {
      rejectMutation.mutate({ 
        id: selectedReferral.id, 
        reason: rejectionReason 
      });
    }
  };

  if (referrals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-secondary-foreground mb-4" />
          <p className="text-secondary-foreground text-center">
            {type === "client"
              ? t("referrals.noClientReferrals", "No tienes referidos de clientes aún")
              : t("referrals.noOwnerReferrals", "No tienes referidos de propietarios aún")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {referrals.map((referral) => {
        const status = referral.status;
        const statusInfo = statusLabels[status] || { es: status, en: status, variant: "outline" as const };
        const isOwner = type === "owner";

        return (
          <Card key={referral.id} className="hover-elevate" data-testid={`card-referral-${referral.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate" data-testid="text-referral-name">
                    {referral.firstName} {referral.lastName}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t("referrals.createdOn", "Creado el")} {format(new Date(referral.createdAt), "dd/MM/yyyy")}
                  </CardDescription>
                </div>
                <Badge variant={statusInfo.variant} data-testid="badge-status">
                  {language === "es" ? statusInfo.es : statusInfo.en}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-secondary-foreground flex-shrink-0" />
                <span className="truncate" data-testid="text-email">{referral.email}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-secondary-foreground flex-shrink-0" />
                <span data-testid="text-phone">{referral.phone}</span>
              </div>

              {isOwner && (
                <>
                  {"nationality" in referral && referral.nationality && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-secondary-foreground flex-shrink-0" />
                      <span data-testid="text-nationality">{referral.nationality}</span>
                    </div>
                  )}

                  {"whatsappNumber" in referral && referral.whatsappNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-secondary-foreground flex-shrink-0" />
                      <span data-testid="text-whatsapp">{referral.whatsappNumber}</span>
                    </div>
                  )}

                  {"propertyType" in referral && referral.propertyType && (
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="h-4 w-4 text-secondary-foreground flex-shrink-0" />
                      <span data-testid="text-property-type">
                        {t(`propertyTypes.${referral.propertyType}`, referral.propertyType)}
                      </span>
                    </div>
                  )}

                  {(("condominiumName" in referral && referral.condominiumName) || ("condoName" in referral && referral.condoName)) && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-secondary-foreground flex-shrink-0" />
                      <span className="truncate" data-testid="text-condo">
                        {"condominiumName" in referral ? referral.condominiumName : referral.condoName}
                        {referral.unitNumber && ` - ${t("referrals.unit", "Unidad")} ${referral.unitNumber}`}
                      </span>
                    </div>
                  )}

                  {("propertyAddress" in referral && referral.propertyAddress) && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-secondary-foreground flex-shrink-0" />
                      <span className="truncate" data-testid="text-property-address">
                        {referral.propertyAddress}
                      </span>
                    </div>
                  )}
                </>
              )}

              {(("commissionAmount" in referral && referral.commissionAmount && parseFloat(referral.commissionAmount) > 0) || 
                ("commissionEarned" in referral && referral.commissionEarned && parseFloat(referral.commissionEarned) > 0)) && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-secondary-foreground">
                      {t("referrals.commissionEarned", "Comisión ganada")}:
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400" data-testid="text-commission">
                      ${("commissionAmount" in referral && referral.commissionAmount 
                        ? parseFloat(referral.commissionAmount) 
                        : parseFloat(referral.commissionEarned || "0")).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              
              {isOwner && isAdmin && referral.emailVerified && referral.status === "confirmado" && (
                <div className="pt-3 border-t flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(referral as OwnerReferral)}
                    className="flex-1"
                    data-testid={`button-approve-${referral.id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t("referrals.approve", "Aprobar")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(referral as OwnerReferral)}
                    className="flex-1"
                    data-testid={`button-reject-${referral.id}`}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {t("referrals.reject", "Rechazar")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
    
    {/* Approve Dialog */}
    <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("referrals.approveReferral", "Aprobar Referido de Propietario")}</DialogTitle>
          <DialogDescription>
            {t("referrals.approveReferralDesc", "Confirma la comisión a pagar al vendedor (20% por defecto)")}
          </DialogDescription>
        </DialogHeader>
        
        {selectedReferral && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">
                {t("referrals.ownerName", "Propietario")}:
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedReferral.firstName} {selectedReferral.lastName}
              </p>
            </div>
            
            {selectedReferral.propertyAddress && (
              <div>
                <p className="text-sm font-medium mb-1">
                  {t("referrals.propertyAddress", "Dirección")}:
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedReferral.propertyAddress}
                </p>
              </div>
            )}
            
            {selectedReferral.estimatedValue && (
              <div>
                <p className="text-sm font-medium mb-1">
                  {t("referrals.estimatedValue", "Valor Estimado")}:
                </p>
                <p className="text-sm text-muted-foreground">
                  ${parseFloat(selectedReferral.estimatedValue).toFixed(2)}
                </p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">
                {t("referrals.commissionAmount", "Monto de Comisión")}
              </label>
              <Input
                type="number"
                step="0.01"
                value={commissionAmount}
                onChange={(e) => setCommissionAmount(e.target.value)}
                placeholder={t("referrals.commissionAmount", "Monto de comisión")}
                data-testid="input-commission-amount"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("referrals.defaultCommission", "Comisión por defecto: 20% del valor estimado")}
              </p>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowApproveDialog(false)}
            data-testid="button-cancel-approve"
          >
            {t("common.cancel", "Cancelar")}
          </Button>
          <Button
            onClick={confirmApprove}
            disabled={approveMutation.isPending}
            data-testid="button-confirm-approve"
          >
            {approveMutation.isPending
              ? t("common.approving", "Aprobando...")
              : t("common.approve", "Aprobar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Reject Dialog */}
    <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("referrals.rejectReferral", "Rechazar Referido de Propietario")}</DialogTitle>
          <DialogDescription>
            {t("referrals.rejectReferralDesc", "Indica la razón del rechazo")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              {t("referrals.rejectionReason", "Razón de Rechazo")} *
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t("referrals.rejectionReasonPlaceholder", "Explica por qué se rechaza este referido")}
              data-testid="input-rejection-reason"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowRejectDialog(false)}
            data-testid="button-cancel-reject"
          >
            {t("common.cancel", "Cancelar")}
          </Button>
          <Button
            variant="destructive"
            onClick={confirmReject}
            disabled={rejectMutation.isPending || !rejectionReason.trim()}
            data-testid="button-confirm-reject"
          >
            {rejectMutation.isPending
              ? t("common.rejecting", "Rechazando...")
              : t("common.reject", "Rechazar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
