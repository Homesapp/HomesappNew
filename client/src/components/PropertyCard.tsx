import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bed, Bath, Square, MapPin, Eye, Edit, Calendar, Trash2, Droplet, Zap, Wifi } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type IncludedServices = {
  basicServices?: {
    water?: {
      included: boolean;
      provider?: string;
      cost?: string;
    };
    electricity?: {
      included: boolean;
      provider?: string;
      cost?: string;
    };
    internet?: {
      included: boolean;
      provider?: string;
      cost?: string;
    };
  };
  additionalServices?: Array<{
    type: "pool_cleaning" | "garden" | "gas";
    provider?: string;
    cost?: string;
  }>;
};

export type PropertyCardProps = {
  id: string;
  title: string;
  customListingTitle?: string;
  price: number;
  salePrice?: number;
  currency?: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  location: string;
  colonyName?: string;
  condoName?: string;
  unitNumber?: string;
  showCondoInListing?: boolean;
  showUnitNumberInListing?: boolean;
  status: "rent" | "sale" | "both";
  image?: string;
  includedServices?: IncludedServices;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSchedule?: () => void;
  showActions?: boolean;
};

export function PropertyCard({
  title,
  customListingTitle,
  price,
  salePrice,
  currency = "MXN",
  bedrooms,
  bathrooms,
  area,
  location,
  colonyName,
  condoName,
  unitNumber,
  showCondoInListing = true,
  showUnitNumberInListing = true,
  status,
  image,
  includedServices,
  onView,
  onEdit,
  onDelete,
  onSchedule,
  showActions = true,
}: PropertyCardProps) {
  const { t } = useLanguage();
  
  const statusLabels = {
    rent: t("property.status.rent"),
    sale: t("property.status.sale"),
    both: t("property.status.both"),
  };

  const statusVariants = {
    rent: "default" as const,
    sale: "secondary" as const,
    both: "outline" as const,
  };

  // Construct display title
  const displayTitle = customListingTitle || title;

  // Construct display location: "Colony, Tulum" or fallback to location
  const displayLocation = colonyName ? `${colonyName}, Tulum` : location;

  // Construct condo/unit display
  const condoUnitParts: string[] = [];
  if (showCondoInListing && condoName) {
    condoUnitParts.push(condoName);
  }
  if (showUnitNumberInListing && unitNumber) {
    condoUnitParts.push(`#${unitNumber}`);
  }
  const condoUnitDisplay = condoUnitParts.length > 0 ? condoUnitParts.join(" ") : null;

  return (
    <Card className="overflow-hidden hover-elevate">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Square className="h-12 w-12" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
        </div>
      </div>
      
      <CardHeader className="gap-1 space-y-0 pb-2">
        <h3 className="font-semibold text-lg line-clamp-2" title={displayTitle}>{displayTitle}</h3>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span>{displayLocation}</span>
          </div>
          {condoUnitDisplay && (
            <div className="text-xs text-muted-foreground pl-4">
              {condoUnitDisplay}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {status === "both" && salePrice ? (
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">
              ${price.toLocaleString()} {currency}
              <span className="text-sm font-normal text-muted-foreground">{t("property.perMonth")}</span>
            </div>
            <div className="text-base font-semibold text-muted-foreground">
              {t("property.saleLabel")} ${salePrice.toLocaleString()} {currency}
            </div>
          </div>
        ) : (
          <div className="text-2xl font-bold text-primary">
            ${price.toLocaleString()} {currency}
            {status === "rent" && <span className="text-sm font-normal text-muted-foreground">{t("property.perMonth")}</span>}
          </div>
        )}
        
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <span>{bedrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4 text-muted-foreground" />
            <span>{bathrooms}</span>
          </div>
          {area > 0 && (
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4 text-muted-foreground" />
              <span>{area} m²</span>
            </div>
          )}
        </div>

        {/* Servicios Incluidos - Solo mostrar servicios incluidos (no los no incluidos) */}
        {includedServices?.basicServices && (includedServices.basicServices.water?.included || includedServices.basicServices.electricity?.included || includedServices.basicServices.internet?.included) && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {includedServices.basicServices.water?.included && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="service-water">
                <Droplet className="h-3 w-3 text-blue-500" />
                <span>Agua</span>
              </div>
            )}
            {includedServices.basicServices.electricity?.included && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="service-electricity">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span>Luz</span>
              </div>
            )}
            {includedServices.basicServices.internet?.included && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="service-internet">
                <Wifi className="h-3 w-3 text-purple-500" />
                <span>Internet</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onView}
            data-testid="button-view-property"
          >
            <Eye className="h-4 w-4 mr-1" />
            {t("property.viewButton")}
          </Button>
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onEdit}
              data-testid="button-edit-property"
            >
              <Edit className="h-4 w-4 mr-1" />
              {t("property.editButton")}
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDelete}
              data-testid="button-delete-property"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t("property.deleteButton")}
            </Button>
          )}
          {onSchedule && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={onSchedule}
              data-testid="button-schedule-appointment"
            >
              <Calendar className="h-4 w-4 mr-1" />
              {t("property.scheduleButton")}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
