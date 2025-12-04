import { useLocation } from "wouter";
import { Building2, MapPin, Bed, Bath, Users, CheckCircle2, Clock, AlertCircle, Eye, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PropertyStatus = 
  | "draft"
  | "pending_review"
  | "published"
  | "rented"
  | "maintenance"
  | "inactive";

interface PropertyStatusCardProps {
  id: string;
  title: string;
  image?: string;
  location?: string;
  zone?: string;
  bedrooms?: number;
  bathrooms?: number;
  status: PropertyStatus;
  rentAmount?: number;
  currency?: string;
  hasActiveContract?: boolean;
  contractId?: string;
  tenantName?: string;
  onEdit?: () => void;
  onViewPortal?: () => void;
  compact?: boolean;
}

const statusConfig: Record<PropertyStatus, { 
  label: string; 
  color: string; 
  icon: typeof Clock;
}> = {
  draft: { label: "Borrador", color: "bg-gray-500/10 text-gray-700 dark:text-gray-400", icon: Edit },
  pending_review: { label: "En revisión", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400", icon: Clock },
  published: { label: "Publicada", color: "bg-green-500/10 text-green-700 dark:text-green-400", icon: CheckCircle2 },
  rented: { label: "Rentada", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400", icon: Users },
  maintenance: { label: "En mantenimiento", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400", icon: AlertCircle },
  inactive: { label: "Inactiva", color: "bg-gray-500/10 text-gray-700 dark:text-gray-400", icon: AlertCircle },
};

export function PropertyStatusCard({
  id,
  title,
  image,
  location,
  zone,
  bedrooms,
  bathrooms,
  status,
  rentAmount,
  currency = "USD",
  hasActiveContract,
  contractId,
  tenantName,
  onEdit,
  onViewPortal,
  compact = false,
}: PropertyStatusCardProps) {
  const [, setLocation] = useLocation();
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const handleViewProperty = () => {
    setLocation(`/propiedad/${id}/completo`);
  };

  const handleGoToPortal = () => {
    if (contractId) {
      setLocation(`/portal/owner?contract=${contractId}`);
    } else if (onViewPortal) {
      onViewPortal();
    }
  };

  if (compact) {
    return (
      <Card className="hover-elevate" data-testid={`property-status-card-${id}`}>
        <CardContent className="p-3">
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
              {image ? (
                <img src={image} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-xs line-clamp-1">{title}</h4>
              <Badge className={cn("text-[9px] mt-0.5 h-4", config.color)}>
                {config.label}
              </Badge>
              {rentAmount && status === "rented" && (
                <p className="text-xs font-medium text-primary mt-0.5">
                  ${rentAmount.toLocaleString()} {currency}/mes
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`property-status-card-${id}`}>
      <div className="relative aspect-video bg-muted">
        {image ? (
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover cursor-pointer"
            onClick={handleViewProperty}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={handleViewProperty}>
            <Building2 className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <Badge className={cn("absolute top-2 left-2", config.color)}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h4 className="font-semibold text-sm line-clamp-1">{title}</h4>
          {(location || zone) && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {location || zone}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {bedrooms !== undefined && bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bed className="h-3 w-3" />
              {bedrooms} Rec
            </span>
          )}
          {bathrooms !== undefined && bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bath className="h-3 w-3" />
              {bathrooms} Baño{bathrooms > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {status === "rented" && (
          <div className="p-2 rounded-lg bg-muted/50 space-y-1">
            {rentAmount && (
              <p className="text-sm font-semibold text-primary">
                ${rentAmount.toLocaleString()} {currency}/mes
              </p>
            )}
            {tenantName && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                Inquilino: {tenantName}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {hasActiveContract ? (
            <Button size="sm" className="flex-1" onClick={handleGoToPortal} data-testid="button-view-portal">
              Ver Portal
            </Button>
          ) : status === "draft" || status === "pending_review" ? (
            <Button size="sm" className="flex-1" onClick={onEdit} data-testid="button-complete-info">
              Completar información
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="flex-1" onClick={handleViewProperty} data-testid="button-view-details">
              <Eye className="h-3 w-3 mr-1" />
              Ver detalles
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
