import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, Bed, Bath, DollarSign, MapPin, Share2, Save, Power, PowerOff, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export type ClientPresentationCardProps = {
  id: string;
  clientName: string;
  propertyType: string;
  modality: "rent" | "sale" | "both";
  minPrice: number;
  maxPrice: number;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  matchCount?: number;
  isActive?: boolean;
  onSave?: () => void;
  onShare?: () => void;
  onViewMatches?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
};

export function ClientPresentationCard({
  id,
  clientName,
  propertyType,
  modality,
  minPrice,
  maxPrice,
  location,
  bedrooms,
  bathrooms,
  amenities,
  matchCount,
  isActive = false,
  onSave,
  onShare,
  onViewMatches,
  onToggleActive,
  onDelete,
}: ClientPresentationCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { t } = useLanguage();
  
  const modalityLabels = {
    rent: t("presentationCard.rent"),
    sale: t("presentationCard.sale"),
    both: t("presentationCard.rentOrSale"),
  };

  return (
    <>
      <Card className={`hover-elevate ${isActive ? "border-primary border-2" : ""}`} data-testid={`card-presentation-${id}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-3">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">{clientName}</h3>
              {isActive && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Power className="h-3 w-3" />
                  {t("presentationCard.active")}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{t("presentationCard.title")}</p>
          </div>
          {matchCount !== undefined && (
            <Badge variant="secondary">
              {matchCount} {matchCount === 1 ? t("presentationCard.match") : t("presentationCard.matches")}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{propertyType}</span>
              <span className="text-muted-foreground">•</span>
              <span>{modalityLabels[modality]}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>
                ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} MXN
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{location}</span>
            </div>

            {(bedrooms || bathrooms) && (
              <div className="flex items-center gap-4 text-sm">
                {bedrooms && (
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4 text-muted-foreground" />
                    <span>{bedrooms}+ {t("presentationCard.bedrooms")}</span>
                  </div>
                )}
                {bathrooms && (
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4 text-muted-foreground" />
                    <span>{bathrooms}+ {t("presentationCard.bathrooms")}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {amenities && amenities.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("presentationCard.amenities")}</p>
              <div className="flex flex-wrap gap-1">
                {amenities.map((amenity, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2 flex-wrap">
          {onToggleActive && (
            <Button 
              variant={isActive ? "secondary" : "default"}
              size="sm"
              onClick={onToggleActive}
              data-testid={`button-toggle-active-${id}`}
            >
              {isActive ? (
                <>
                  <PowerOff className="h-4 w-4 mr-1" />
                  {t("presentationCard.deactivate")}
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-1" />
                  {t("presentationCard.activate")}
                </>
              )}
            </Button>
          )}
          {onSave && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSave}
              data-testid={`button-edit-${id}`}
            >
              <Save className="h-4 w-4 mr-1" />
              {t("presentationCard.edit")}
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              data-testid={`button-delete-${id}`}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t("presentationCard.delete")}
            </Button>
          )}
          {onViewMatches && matchCount !== undefined && matchCount > 0 && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={onViewMatches}
              data-testid={`button-view-matches-${id}`}
            >
              {t("presentationCard.viewMatches")}
            </Button>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarjeta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarjeta de presentación será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
