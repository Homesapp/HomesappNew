import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Heart,
  Star,
  Droplet,
  Zap,
  Wifi,
  Car,
  Snowflake,
  PawPrint,
  Sofa,
  Building
} from "lucide-react";

export interface PublicPropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: number;
  salePrice?: number;
  currency?: string;
  priceType?: "rent" | "sale" | "both";
  bedrooms: number;
  bathrooms: number;
  area?: number | null;
  images?: string[] | null;
  rating?: number;
  isFavorite?: boolean;
  petFriendly?: boolean;
  furnished?: boolean;
  hasParking?: boolean;
  hasAC?: boolean;
  includedServices?: {
    water?: boolean;
    electricity?: boolean;
    internet?: boolean;
    hoa?: boolean;
  };
  onClick?: () => void;
  onFavorite?: () => void;
}

function RatingStars({ rating = 0 }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-3 w-3 fill-amber-400 text-amber-400" />
      ))}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-3 w-3 text-muted-foreground/40" />
      ))}
    </div>
  );
}

function AmenityIconsRow({ 
  includedServices, 
  petFriendly, 
  furnished, 
  hasParking, 
  hasAC 
}: {
  includedServices?: PublicPropertyCardProps["includedServices"];
  petFriendly?: boolean;
  furnished?: boolean;
  hasParking?: boolean;
  hasAC?: boolean;
}) {
  const icons: { icon: JSX.Element; active: boolean }[] = [];
  
  icons.push({ 
    icon: <Zap className="h-3.5 w-3.5" />, 
    active: includedServices?.electricity ?? false 
  });
  icons.push({ 
    icon: <Wifi className="h-3.5 w-3.5" />, 
    active: includedServices?.internet ?? false 
  });
  icons.push({ 
    icon: <Snowflake className="h-3.5 w-3.5" />, 
    active: hasAC ?? false 
  });
  icons.push({ 
    icon: <Car className="h-3.5 w-3.5" />, 
    active: hasParking ?? false 
  });
  icons.push({ 
    icon: <PawPrint className="h-3.5 w-3.5" />, 
    active: petFriendly ?? false 
  });
  icons.push({ 
    icon: <Sofa className="h-3.5 w-3.5" />, 
    active: furnished ?? false 
  });
  icons.push({ 
    icon: <Droplet className="h-3.5 w-3.5" />, 
    active: includedServices?.water ?? false 
  });
  icons.push({ 
    icon: <Building className="h-3.5 w-3.5" />, 
    active: includedServices?.hoa ?? false 
  });
  
  return (
    <div className="flex items-center gap-1.5">
      {icons.map((item, i) => (
        <span 
          key={i} 
          className={item.active ? "text-primary" : "text-muted-foreground/40"}
        >
          {item.icon}
        </span>
      ))}
    </div>
  );
}

export function PublicPropertyCard({
  id,
  title,
  location,
  price,
  salePrice,
  currency = "MXN",
  priceType = "rent",
  bedrooms,
  bathrooms,
  area,
  images,
  rating = 0,
  isFavorite = false,
  petFriendly,
  furnished,
  hasParking,
  hasAC,
  includedServices,
  onClick,
  onFavorite,
}: PublicPropertyCardProps) {
  const hasImage = images && images.length > 0;
  
  return (
    <Card 
      className="group overflow-hidden hover-elevate cursor-pointer"
      onClick={onClick}
      data-testid={`card-property-${id}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {hasImage ? (
          <img
            src={images[0]}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            data-testid={`img-property-${id}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <Building className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        <button
          className={`absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
            isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white/90 text-muted-foreground hover:bg-white'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onFavorite?.();
          }}
          data-testid={`button-favorite-${id}`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <CardContent className="p-3 space-y-2">
        <h3 
          className="font-semibold text-sm line-clamp-1" 
          data-testid={`text-title-${id}`}
        >
          {title}
        </h3>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{location}</span>
        </div>
        
        <RatingStars rating={rating} />
        
        <AmenityIconsRow
          includedServices={includedServices}
          petFriendly={petFriendly}
          furnished={furnished}
          hasParking={hasParking}
          hasAC={hasAC}
        />
        
        <div className="pt-1">
          {priceType === "both" && salePrice ? (
            <div className="flex flex-col gap-0.5">
              <div>
                <span className="text-lg font-bold text-primary">
                  ${salePrice.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground ml-1">{currency}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  ${price.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground ml-1">{currency}/mes</span>
              </div>
            </div>
          ) : (
            <>
              <span className="text-lg font-bold text-primary">
                ${price.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                {currency}{priceType === "rent" ? "/mes" : ""}
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t">
          <span className="flex items-center gap-1">
            <Bed className="h-3 w-3" />
            x{bedrooms}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3 w-3" />
            {bathrooms}
          </span>
          {area && area > 0 && (
            <span className="flex items-center gap-1">
              <Square className="h-3 w-3" />
              {area}m²
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
