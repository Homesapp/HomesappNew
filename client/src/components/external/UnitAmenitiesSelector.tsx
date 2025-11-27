import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Check } from "lucide-react";

const COMMON_AMENITIES = {
  es: [
    "Aire Acondicionado",
    "WiFi",
    "Cocina Equipada",
    "Lavadora",
    "Secadora",
    "Estacionamiento",
    "Piscina",
    "Gimnasio",
    "Terraza",
    "Balcón",
    "Jacuzzi",
    "Parrilla/BBQ",
    "Seguridad 24/7",
    "Elevador",
    "Área de Playa",
    "Vista al Mar",
    "Jardín",
    "TV Cable",
    "Netflix",
    "Acceso a Cenotes",
    "Bicicletas",
    "Kayak",
    "Rooftop",
    "Coworking",
    "Pet Friendly",
    "Área de Niños",
  ],
  en: [
    "Air Conditioning",
    "WiFi",
    "Equipped Kitchen",
    "Washer",
    "Dryer",
    "Parking",
    "Pool",
    "Gym",
    "Terrace",
    "Balcony",
    "Jacuzzi",
    "Grill/BBQ",
    "24/7 Security",
    "Elevator",
    "Beach Access",
    "Ocean View",
    "Garden",
    "Cable TV",
    "Netflix",
    "Cenotes Access",
    "Bicycles",
    "Kayak",
    "Rooftop",
    "Coworking",
    "Pet Friendly",
    "Kids Area",
  ],
};

interface UnitAmenitiesSelectorProps {
  amenities: string[];
  onChange: (amenities: string[]) => void;
  language?: "es" | "en";
  readOnly?: boolean;
}

export function UnitAmenitiesSelector({
  amenities = [],
  onChange,
  language = "es",
  readOnly = false,
}: UnitAmenitiesSelectorProps) {
  const [customAmenity, setCustomAmenity] = useState("");
  const [showAll, setShowAll] = useState(false);

  const commonAmenities = COMMON_AMENITIES[language];
  const displayedAmenities = showAll ? commonAmenities : commonAmenities.slice(0, 12);

  const toggleAmenity = (amenity: string) => {
    if (readOnly) return;
    
    if (amenities.includes(amenity)) {
      onChange(amenities.filter((a) => a !== amenity));
    } else {
      onChange([...amenities, amenity]);
    }
  };

  const addCustomAmenity = () => {
    if (readOnly || !customAmenity.trim()) return;
    if (!amenities.includes(customAmenity.trim())) {
      onChange([...amenities, customAmenity.trim()]);
    }
    setCustomAmenity("");
  };

  const removeAmenity = (amenity: string) => {
    if (readOnly) return;
    onChange(amenities.filter((a) => a !== amenity));
  };

  if (readOnly) {
    return (
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {language === "es" ? "Amenidades" : "Amenities"}
        </Label>
        {amenities.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-no-amenities">
            {language === "es" ? "Sin amenidades registradas" : "No amenities registered"}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {amenities.map((amenity, index) => (
              <Badge key={index} variant="secondary" data-testid={`badge-amenity-${index}`}>
                {amenity}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground">
        {language === "es" ? "Amenidades" : "Amenities"}
      </Label>
      
      {amenities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {amenities.map((amenity, index) => (
            <Badge
              key={index}
              variant="default"
              className="pr-1 gap-1 cursor-pointer"
              onClick={() => removeAmenity(amenity)}
              data-testid={`badge-selected-amenity-${index}`}
            >
              {amenity}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {displayedAmenities.map((amenity, index) => {
          const isSelected = amenities.includes(amenity);
          return (
            <Badge
              key={index}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleAmenity(amenity)}
              data-testid={`badge-common-amenity-${index}`}
            >
              {isSelected && <Check className="h-3 w-3 mr-0.5" />}
              {amenity}
            </Badge>
          );
        })}
      </div>

      {commonAmenities.length > 12 && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={() => setShowAll(!showAll)}
          data-testid="button-toggle-amenities"
        >
          {showAll
            ? (language === "es" ? "Ver menos" : "Show less")
            : (language === "es" ? `Ver todas (${commonAmenities.length})` : `Show all (${commonAmenities.length})`)}
        </Button>
      )}

      <div className="flex gap-2 mt-2">
        <Input
          value={customAmenity}
          onChange={(e) => setCustomAmenity(e.target.value)}
          placeholder={language === "es" ? "Amenidad personalizada..." : "Custom amenity..."}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomAmenity();
            }
          }}
          data-testid="input-custom-amenity"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addCustomAmenity}
          disabled={!customAmenity.trim()}
          data-testid="button-add-custom-amenity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
