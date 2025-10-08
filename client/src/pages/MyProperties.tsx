import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, MapPin, Bed, Bath, Square, Clock, CheckCircle, XCircle, AlertCircle, Plus, MoreVertical, Edit, Eye, Calendar, PawPrint, Pause, Home, Lock, FileText, TrendingUp, HelpCircle, FileEdit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PropertyLimitRequestDialog } from "@/components/PropertyLimitRequestDialog";
import type { Property } from "@shared/schema";

// Badge configuration (colors and icons only - labels come from translations)
const approvalStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  pending: "outline",
  pending_review: "outline",
  approved: "default",
  published: "default",
  rejected: "destructive",
  changes_requested: "outline",
};

const approvalStatusIcons: Record<string, typeof Clock> = {
  draft: AlertCircle,
  pending: Clock,
  pending_review: Clock,
  approved: CheckCircle,
  published: CheckCircle,
  rejected: XCircle,
  changes_requested: FileEdit,
};

const ownerStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  suspended: "secondary",
  rented: "outline",
};

const ownerStatusIcons: Record<string, typeof Home> = {
  active: Home,
  suspended: Pause,
  rented: Lock,
};

// Translation key mapping for status labels
const approvalStatusTranslationKeys: Record<string, string> = {
  draft: "propertyStatus.draft",
  pending: "propertyStatus.pending",
  pending_review: "propertyStatus.pendingReview",
  approved: "propertyStatus.approved",
  published: "propertyStatus.published",
  rejected: "propertyStatus.rejected",
  changes_requested: "propertyStatus.changesRequested",
};

const ownerStatusTranslationKeys: Record<string, string> = {
  active: "propertyStatus.active",
  suspended: "propertyStatus.suspended",
  rented: "propertyStatus.rented",
};

// Priority-based badge determination
// Priority order: suspended/rented (highest) > changes_requested > rejected > pending_review > pending > draft > approved > published (lowest)
function getPrimaryBadge(property: Property, t: (key: string) => string) {
  // Priority 1: ownerStatus (suspended/rented) - highest priority
  if (property.ownerStatus === "suspended") {
    return {
      type: "owner" as const,
      label: t(ownerStatusTranslationKeys.suspended),
      color: ownerStatusColors.suspended,
      icon: ownerStatusIcons.suspended,
    };
  }
  if (property.ownerStatus === "rented") {
    return {
      type: "owner" as const,
      label: t(ownerStatusTranslationKeys.rented),
      color: ownerStatusColors.rented,
      icon: ownerStatusIcons.rented,
    };
  }

  // Priority 2-8: approvalStatus based on explicit priority order
  // Lower index = higher priority (more important to show)
  const approvalPriorityOrder: Array<string> = [
    "changes_requested",  // Requires owner action
    "rejected",           // Terminal negative state
    "pending_review",     // Waiting for admin
    "pending",            // Waiting for first review
    "draft",              // Not submitted yet
    "approved",           // Approved but not visible yet
    "published"           // Everything OK
  ];

  const currentStatus = property.approvalStatus || "draft";
  const translationKey = approvalStatusTranslationKeys[currentStatus] || "propertyStatus.draft";
  const Icon = approvalStatusIcons[currentStatus] || AlertCircle;
  
  return {
    type: "approval" as const,
    label: t(translationKey),
    color: approvalStatusColors[currentStatus] || "secondary",
    icon: Icon,
  };
}

export default function MyProperties() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showLimitRequestDialog, setShowLimitRequestDialog] = useState(false);

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/owner/properties"],
  });

  const propertyLimit = user?.propertyLimit || 3;
  const propertyCount = properties.length;
  const isAtLimit = propertyCount >= propertyLimit;
  const isNearLimit = propertyCount >= propertyLimit - 1;

  const changeStatusMutation = useMutation({
    mutationFn: async ({ propertyId, newStatus }: { propertyId: string; newStatus: string }) => {
      return await apiRequest(
        "PATCH",
        `/api/properties/${propertyId}/owner-status`,
        { ownerStatus: newStatus }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/properties"] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la propiedad ha sido actualizado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el estado de la propiedad",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Mis Propiedades</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y administra tus propiedades ({propertyCount}/{propertyLimit})
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                data-testid="button-help-states"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Ayuda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("propertyStates.helpTitle")}</DialogTitle>
                <DialogDescription>
                  {t("propertyStates.helpDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="space-y-4">
                  <h4 className="font-semibold text-base border-b pb-2">{t("propertyStates.availabilityTitle")}</h4>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                      <Badge variant="secondary" className="gap-1 justify-start">
                        <Pause className="h-3 w-3" />
                        {t("propertyStates.suspendedLabel")}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {t("propertyStates.suspendedDesc")}
                      </p>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                      <Badge variant="outline" className="gap-1 justify-start">
                        <Lock className="h-3 w-3" />
                        {t("propertyStates.rentedLabel")}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {t("propertyStates.rentedDesc")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-base border-b pb-2">{t("propertyStates.approvalTitle")}</h4>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                      <Badge variant="outline" className="gap-1 justify-start">
                        <FileEdit className="h-3 w-3" />
                        {t("propertyStates.changesRequestedLabel")}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {t("propertyStates.changesRequestedDesc")}
                      </p>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                      <Badge variant="destructive" className="gap-1 justify-start">
                        <XCircle className="h-3 w-3" />
                        {t("propertyStates.rejectedLabel")}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {t("propertyStates.rejectedDesc")}
                      </p>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                      <Badge variant="outline" className="gap-1 justify-start">
                        <Clock className="h-3 w-3" />
                        {t("propertyStates.pendingReviewLabel")}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {t("propertyStates.pendingReviewDesc")}
                      </p>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                      <Badge variant="outline" className="gap-1 justify-start">
                        <Clock className="h-3 w-3" />
                        {t("propertyStates.pendingLabel")}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {t("propertyStates.pendingDesc")}
                      </p>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                      <Badge variant="secondary" className="gap-1 justify-start">
                        <AlertCircle className="h-3 w-3" />
                        {t("propertyStates.draftLabel")}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {t("propertyStates.draftDesc")}
                      </p>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                      <Badge variant="default" className="gap-1 justify-start">
                        <CheckCircle className="h-3 w-3" />
                        {t("propertyStates.approvedLabel")}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {t("propertyStates.approvedDesc")}
                      </p>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                      <Badge variant="default" className="gap-1 justify-start">
                        <CheckCircle className="h-3 w-3" />
                        {t("propertyStates.publishedLabel")}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {t("propertyStates.publishedDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {isAtLimit ? (
            <Button 
              onClick={() => setShowLimitRequestDialog(true)}
              variant="outline"
              data-testid="button-request-limit-increase"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Solicitar Más Cupo
            </Button>
          ) : (
            <Button 
              onClick={() => setLocation("/owner/property/new")}
              data-testid="button-add-property"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Propiedad
            </Button>
          )}
        </div>
      </div>

      {isAtLimit && (
        <Alert variant="destructive" data-testid="alert-property-limit">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Límite de Propiedades Alcanzado</AlertTitle>
          <AlertDescription>
            Has alcanzado tu límite de {propertyLimit} propiedades. Solicita un aumento de límite para agregar más propiedades.
          </AlertDescription>
        </Alert>
      )}

      {!isAtLimit && isNearLimit && (
        <Alert data-testid="alert-near-limit">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cerca del Límite</AlertTitle>
          <AlertDescription>
            Tienes {propertyCount} de {propertyLimit} propiedades. Puedes solicitar un aumento de límite si necesitas agregar más.
          </AlertDescription>
        </Alert>
      )}

      {properties.length === 0 ? (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes propiedades</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza agregando tu primera propiedad para gestionar y administrar.
            </p>
            <Button onClick={() => setLocation("/owner/property/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primera Propiedad
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => {
            const primaryBadge = getPrimaryBadge(property, t);
            const BadgeIcon = primaryBadge.icon;
            
            return (
              <Card
                key={property.id}
                className="hover-elevate overflow-hidden"
                data-testid={`card-property-${property.id}`}
              >
                <div className="flex gap-4 p-4">
                  {/* Imagen de la propiedad */}
                  <div 
                    className={`w-28 h-28 relative overflow-hidden bg-muted rounded-lg flex-shrink-0 ${(property as any).isDraft ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    onClick={() => {
                      if (!(property as any).isDraft) {
                        setLocation(`/owner/property/${property.id}`);
                      }
                    }}
                  >
                    {(() => {
                      const hasPrimary = property.primaryImages && property.primaryImages.length > 0;
                      const hasLegacy = property.images && property.images.length > 0;
                      const coverIndex = property.coverImageIndex || 0;
                      const coverImage = hasPrimary && coverIndex < property.primaryImages.length
                        ? property.primaryImages[coverIndex]
                        : hasPrimary
                        ? property.primaryImages[0]
                        : hasLegacy
                        ? property.images[0]
                        : null;

                      return coverImage ? (
                        <img
                          src={coverImage}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-10 w-10 text-muted-foreground" />
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Contenido de la propiedad */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Header con título y acciones */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className={`font-semibold line-clamp-1 text-base ${(property as any).isDraft ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:text-primary'}`}
                          onClick={() => {
                            if (!(property as any).isDraft) {
                              setLocation(`/owner/property/${property.id}`);
                            }
                          }}
                          data-testid={`text-property-title-${property.id}`}
                        >
                          {property.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="line-clamp-1">{property.location}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={primaryBadge.color}
                          className="gap-1.5"
                          data-testid={`badge-status-${property.id}`}
                        >
                          <BadgeIcon className="h-3 w-3" />
                          {primaryBadge.label}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-menu-${property.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setLocation(`/owner/property/${property.id}`)}
                              data-testid={`menu-view-${property.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setLocation(`/owner/property/${property.id}/edit`)}
                              data-testid={`menu-edit-${property.id}`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setLocation(`/owner/appointments`)}
                              data-testid={`menu-appointments-${property.id}`}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Ver Citas
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setLocation(`/owner/property/${property.id}/documents`)}
                              data-testid={`menu-documents-${property.id}`}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Gestionar Documentos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {property.ownerStatus === "active" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => changeStatusMutation.mutate({ propertyId: property.id, newStatus: "suspended" })}
                                  data-testid={`menu-suspend-${property.id}`}
                                  disabled={changeStatusMutation.isPending}
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Suspender
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => changeStatusMutation.mutate({ propertyId: property.id, newStatus: "rented" })}
                                  data-testid={`menu-rent-${property.id}`}
                                  disabled={changeStatusMutation.isPending}
                                >
                                  <Lock className="h-4 w-4 mr-2" />
                                  Marcar como Rentada
                                </DropdownMenuItem>
                              </>
                            )}
                            {(property.ownerStatus === "suspended" || property.ownerStatus === "rented") && (
                              <DropdownMenuItem
                                onClick={() => changeStatusMutation.mutate({ propertyId: property.id, newStatus: "active" })}
                                data-testid={`menu-activate-${property.id}`}
                                disabled={changeStatusMutation.isPending}
                              >
                                <Home className="h-4 w-4 mr-2" />
                                Activar (requiere aprobación)
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Especificaciones y precio */}
                    <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Bed className="h-4 w-4" />
                          <span className="font-medium">{property.bedrooms}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Bath className="h-4 w-4" />
                          <span className="font-medium">{property.bathrooms}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Square className="h-4 w-4" />
                          <span className="font-medium">{property.area}m²</span>
                        </span>
                        {property.petFriendly && (
                          <PawPrint className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {property.price && (
                          <div className="px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                            <div className="text-xs font-medium text-primary mb-0.5">Renta</div>
                            <div className="text-base font-bold" data-testid={`text-property-price-rental-${property.id}`}>
                              ${Number(property.price).toLocaleString()}
                            </div>
                          </div>
                        )}
                        {property.salePrice && (
                          <div className="px-3 py-2 bg-secondary border border-border rounded-lg">
                            <div className="text-xs font-medium text-secondary-foreground mb-0.5">Venta</div>
                            <div className="text-base font-bold" data-testid={`text-property-price-sale-${property.id}`}>
                              ${Number(property.salePrice).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <PropertyLimitRequestDialog
        open={showLimitRequestDialog}
        onOpenChange={setShowLimitRequestDialog}
        currentLimit={propertyLimit}
        currentCount={propertyCount}
      />
    </div>
  );
}
