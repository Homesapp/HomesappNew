import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Eye,
  Share2,
  Users,
  Calendar,
  PawPrint,
  Home,
  Image as ImageIcon,
  Video,
  Heart,
  MessageCircle,
  FileText,
  Send,
  ExternalLink,
  Clock,
  Target,
  CheckCircle2,
  Star,
  Droplet,
  Zap,
  Wifi,
  Building,
  Sofa,
  Car,
  Snowflake
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

export type PropertyStatus = 
  | "available" 
  | "occupied" 
  | "reserved" 
  | "under_offer" 
  | "sold" 
  | "rented"
  | "pending"
  | "inactive";

export type CardContext = "seller" | "public" | "owner" | "tenant" | "admin";

export type PropertyMetrics = {
  leads?: number;
  appointments?: number;
  views?: number;
  lastUpdated?: string;
  occupancyRate?: number;
  lastPayment?: string;
  contractStatus?: string;
  nextPaymentDate?: string;
  pendingTickets?: number;
};

export type MatchInfo = {
  score: number;
  reasons: string[];
};

export type CardVariant = "default" | "landing" | "featured";

export interface UnifiedPropertyCardProps {
  id: string;
  title: string;
  unitNumber?: string | null;
  location: string;
  zone?: string | null;
  condominiumName?: string | null;
  variant?: CardVariant;
  
  rentPrice?: number | null;
  salePrice?: number | null;
  currency?: string;
  
  bedrooms: number;
  bathrooms: number;
  area?: number | null;
  
  status: PropertyStatus;
  images?: string[] | null;
  
  propertyType?: string | null;
  petFriendly?: boolean;
  furnished?: boolean;
  hasParking?: boolean;
  hasAC?: boolean;
  hasVirtualTour?: boolean;
  
  includedServices?: {
    water?: boolean;
    electricity?: boolean;
    internet?: boolean;
    hoa?: boolean;
  };
  
  isReferral?: boolean;
  referrerName?: string | null;
  commissionRate?: string | null;
  
  context?: CardContext;
  metrics?: PropertyMetrics;
  matchInfo?: MatchInfo | null;
  isShared?: boolean;
  isFavorite?: boolean;
  
  onView?: () => void;
  onShare?: () => void;
  onFindLeads?: () => void;
  onSchedule?: () => void;
  onContact?: () => void;
  onFavorite?: () => void;
  onViewPortal?: () => void;
  onViewDocuments?: () => void;
  onWhatsApp?: () => void;
  onClick?: () => void;
  
  onViewContract?: () => void;
  onReportIssue?: () => void;
  onContactSupport?: () => void;
  
  onEdit?: () => void;
  onViewLeads?: () => void;
  onManage?: () => void;
  
  selectedLeadName?: string | null;
  onSendToLead?: () => void;
  isFavoriteLoading?: boolean;
  
  amenities?: string[] | null;
  
  className?: string;
}

// Helper component for compact amenities icons aligned right
interface AmenitiesIconsProps {
  includedServices?: {
    water?: boolean;
    electricity?: boolean;
    internet?: boolean;
    hoa?: boolean;
  };
  petFriendly?: boolean;
  furnished?: boolean;
  hasParking?: boolean;
  hasAC?: boolean;
  amenities?: string[] | null;
}

function AmenitiesIcons({ 
  includedServices, 
  petFriendly, 
  furnished, 
  hasParking, 
  hasAC,
  amenities 
}: AmenitiesIconsProps) {
  // Build list of all amenity icons to display
  const allIcons: { icon: JSX.Element; tooltip: string; key: string }[] = [];
  
  // Priority order: internet, AC, parking, pet-friendly, furnished, water, electricity, HOA
  if (includedServices?.internet) {
    allIcons.push({ 
      icon: <Wifi className="h-3.5 w-3.5 text-purple-500" />, 
      tooltip: "Internet incluido", 
      key: "wifi" 
    });
  }
  if (hasAC) {
    allIcons.push({ 
      icon: <Snowflake className="h-3.5 w-3.5 text-cyan-500" />, 
      tooltip: "Aire acondicionado", 
      key: "ac" 
    });
  }
  if (hasParking) {
    allIcons.push({ 
      icon: <Car className="h-3.5 w-3.5 text-muted-foreground" />, 
      tooltip: "Estacionamiento", 
      key: "parking" 
    });
  }
  if (petFriendly) {
    allIcons.push({ 
      icon: <PawPrint className="h-3.5 w-3.5 text-green-600" />, 
      tooltip: "Acepta mascotas", 
      key: "pet" 
    });
  }
  if (furnished) {
    allIcons.push({ 
      icon: <Sofa className="h-3.5 w-3.5 text-amber-600" />, 
      tooltip: "Amueblado", 
      key: "furnished" 
    });
  }
  if (includedServices?.water) {
    allIcons.push({ 
      icon: <Droplet className="h-3.5 w-3.5 text-blue-500" />, 
      tooltip: "Agua incluida", 
      key: "water" 
    });
  }
  if (includedServices?.electricity) {
    allIcons.push({ 
      icon: <Zap className="h-3.5 w-3.5 text-yellow-500" />, 
      tooltip: "Luz incluida", 
      key: "electricity" 
    });
  }
  if (includedServices?.hoa) {
    allIcons.push({ 
      icon: <Building className="h-3.5 w-3.5 text-green-600" />, 
      tooltip: "HOA incluido", 
      key: "hoa" 
    });
  }
  
  // Calculate total count of all amenities (icons + text amenities)
  const totalAmenities = allIcons.length + (amenities?.length || 0);
  
  // If no amenities to show, return null
  if (totalAmenities === 0) {
    return null;
  }
  
  // Show max 5 icons, then +N for the rest
  const maxIcons = 5;
  const visibleIcons = allIcons.slice(0, maxIcons);
  const hiddenIconsCount = Math.max(0, allIcons.length - maxIcons);
  const remainingCount = hiddenIconsCount + (amenities?.length || 0);
  
  return (
    <div className="flex items-center gap-1.5 ml-auto">
      {visibleIcons.map((item) => (
        <Tooltip key={item.key}>
          <TooltipTrigger asChild>
            <span className="cursor-help">{item.icon}</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {item.tooltip}
          </TooltipContent>
        </Tooltip>
      ))}
      {remainingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground font-medium cursor-help">
              +{remainingCount}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[200px]">
            <div className="space-y-1">
              {allIcons.slice(maxIcons).map((item) => (
                <div key={item.key} className="flex items-center gap-1.5">
                  {item.icon}
                  <span>{item.tooltip}</span>
                </div>
              ))}
              {amenities && amenities.slice(0, 5).map((amenity, idx) => (
                <div key={`amenity-${idx}`} className="text-muted-foreground">
                  {amenity}
                </div>
              ))}
              {amenities && amenities.length > 5 && (
                <div className="text-muted-foreground">
                  +{amenities.length - 5} más
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

const statusConfig: Record<PropertyStatus, { label: string; labelEn: string; className: string }> = {
  available: { 
    label: "Disponible", 
    labelEn: "Available",
    className: "bg-green-600 hover:bg-green-700 text-white border-0" 
  },
  occupied: { 
    label: "Ocupado", 
    labelEn: "Occupied",
    className: "bg-blue-600 hover:bg-blue-700 text-white border-0" 
  },
  reserved: { 
    label: "Reservado", 
    labelEn: "Reserved",
    className: "bg-amber-500 hover:bg-amber-600 text-white border-0" 
  },
  under_offer: { 
    label: "Bajo oferta", 
    labelEn: "Under Offer",
    className: "bg-purple-600 hover:bg-purple-700 text-white border-0" 
  },
  sold: { 
    label: "Vendido", 
    labelEn: "Sold",
    className: "bg-red-600 hover:bg-red-700 text-white border-0" 
  },
  rented: { 
    label: "Rentada", 
    labelEn: "Rented",
    className: "bg-red-600 hover:bg-red-700 text-white border-0" 
  },
  pending: { 
    label: "Pendiente", 
    labelEn: "Pending",
    className: "bg-orange-500 hover:bg-orange-600 text-white border-0" 
  },
  inactive: { 
    label: "Inactivo", 
    labelEn: "Inactive",
    className: "bg-gray-500 hover:bg-gray-600 text-white border-0" 
  },
};

export function UnifiedPropertyCard({
  id,
  title,
  unitNumber,
  location,
  zone,
  condominiumName,
  variant = "default",
  rentPrice,
  salePrice,
  currency = "MXN",
  bedrooms,
  bathrooms,
  area,
  status,
  images,
  propertyType,
  petFriendly,
  furnished,
  hasParking,
  hasAC,
  hasVirtualTour,
  includedServices,
  isReferral,
  referrerName,
  commissionRate,
  context = "seller",
  metrics,
  matchInfo,
  isShared,
  isFavorite,
  onView,
  onShare,
  onFindLeads,
  onSchedule,
  onContact,
  onFavorite,
  onViewPortal,
  onViewDocuments,
  onWhatsApp,
  onClick,
  onViewContract,
  onReportIssue,
  onContactSupport,
  onEdit,
  onViewLeads,
  onManage,
  selectedLeadName,
  onSendToLead,
  isFavoriteLoading,
  amenities,
  className = "",
}: UnifiedPropertyCardProps) {
  const isLanding = variant === "landing";
  const isFeatured = variant === "featured";
  const isCompact = isLanding || isFeatured;
  const statusInfo = statusConfig[status] || statusConfig.available;
  const imageCount = images?.length || 0;
  const primaryImage = images?.[0];
  
  const displayTitle = condominiumName || title;
  const displayLocation = zone ? `${zone}, Tulum` : location;

  return (
    <Card 
      className={`group overflow-hidden flex flex-col bg-card hover-elevate transition-all duration-200 ${className}`}
      data-testid={`card-property-${id}`}
    >
      <div 
        className="relative aspect-[4/3] bg-muted overflow-hidden cursor-pointer"
        onClick={onClick}
        data-testid={`button-image-${id}`}
      >
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
            <Home className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute top-2 left-2 z-10">
          <Badge className={`text-xs px-2 py-0.5 ${statusInfo.className}`}>
            {statusInfo.label}
          </Badge>
        </div>
        
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          {imageCount > 1 && (
            <div className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
              <ImageIcon className="h-3 w-3" />
              {imageCount}
            </div>
          )}
          {hasVirtualTour && (
            <div className="flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
              <Video className="h-3 w-3" />
              VR
            </div>
          )}
        </div>
        
        {matchInfo && matchInfo.score > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={`absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-white cursor-help ${
                  matchInfo.score >= 70 ? "bg-green-600" : 
                  matchInfo.score >= 40 ? "bg-amber-500" : 
                  "bg-orange-500"
                }`}
                data-testid={`badge-match-${id}`}
              >
                <Target className="h-3 w-3" />
                {matchInfo.score}%
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold mb-1">Match Score</p>
              {matchInfo.reasons.length > 0 ? (
                <ul className="text-xs space-y-0.5">
                  {matchInfo.reasons.map((reason, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Based on general criteria</p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
        
        {isShared && (
          <Badge 
            className="absolute bottom-2 right-2 z-10 bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs"
            data-testid={`badge-shared-${id}`}
          >
            <Send className="h-3 w-3 mr-1" />
            Enviada
          </Badge>
        )}
        
        {context === "public" && onFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className={`absolute bottom-2 right-2 z-10 h-8 w-8 rounded-full bg-white/90 hover:bg-white ${isFavorite ? 'text-red-500' : 'text-muted-foreground'}`}
            onClick={(e) => {
              e.stopPropagation();
              onFavorite();
            }}
            data-testid={`button-favorite-${id}`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        )}
      </div>

      <CardContent className="p-3 flex-1 flex flex-col gap-2">
        {isReferral && referrerName && (
          <div className="flex items-center gap-1.5">
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-[10px] px-1.5 py-0.5">
              <Star className="h-3 w-3 mr-0.5 fill-current" />
              Referido
            </Badge>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              {commissionRate || "40-50%"} comisión
            </span>
          </div>
        )}
        
        <div className="flex items-start justify-between gap-2 min-h-[44px]">
          <div className="min-w-0 flex-1">
            <h3 
              className="font-semibold text-base line-clamp-1" 
              title={displayTitle}
              data-testid={`text-title-${id}`}
            >
              {displayTitle}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {unitNumber && (
                <span className="font-medium text-foreground">#{unitNumber}</span>
              )}
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{displayLocation}</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Price section - hidden in landing and featured variants */}
        {!isCompact && (
          <div className="space-y-1">
            {rentPrice && rentPrice > 0 && (
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-primary">
                  ${rentPrice.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  {currency}/mes
                </span>
              </div>
            )}
            {salePrice && salePrice > 0 && (
              <div className="flex items-baseline gap-1">
                <span className={`font-bold ${rentPrice ? 'text-base text-muted-foreground' : 'text-xl text-primary'}`}>
                  ${salePrice.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  {currency}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Compact variants (landing/featured): Subtle divider and continuous specs */}
        {isCompact ? (
          <div className="flex flex-col gap-2">
            <Separator className="opacity-50" />
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{bedrooms} rec</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{bathrooms} baños</span>
              </div>
              {area && area > 0 && (
                <div className="flex items-center gap-1">
                  <Square className="h-4 w-4" />
                  <span>{area} m²</span>
                </div>
              )}
              {petFriendly && (
                <div className="flex items-center gap-1">
                  <PawPrint className="h-4 w-4 text-foreground" />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Default variant: Specs row with amenities aligned right */
          <div className="flex flex-col gap-1.5">
            {/* Desktop: specs left, amenities right on same row */}
            {/* Mobile: specs on first line, amenities on second line right-aligned */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Left: Specs */}
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{bedrooms}</span>
                  <span className="text-muted-foreground text-xs">rec</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{bathrooms}</span>
                  <span className="text-muted-foreground text-xs">baños</span>
                </div>
                {area && area > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1">
                      <Square className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{area}</span>
                      <span className="text-muted-foreground text-xs">m²</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Right: Compact amenities icons */}
              <AmenitiesIcons 
                includedServices={includedServices}
                petFriendly={petFriendly}
                furnished={furnished}
                hasParking={hasParking}
                hasAC={hasAC}
                amenities={amenities}
              />
            </div>
            
            {/* Property type badge if applicable */}
            {propertyType && (
              <div className="flex items-center">
                <Badge variant="secondary" className="text-xs">
                  {propertyType}
                </Badge>
              </div>
            )}
          </div>
        )}
        
        {context === "seller" && metrics && (
          <div className="flex items-center gap-3 pt-2 border-t text-xs text-muted-foreground">
            {metrics.leads !== undefined && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>Leads: <strong className="text-foreground">{metrics.leads}</strong></span>
              </div>
            )}
            {metrics.appointments !== undefined && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Citas: <strong className="text-foreground">{metrics.appointments}</strong></span>
              </div>
            )}
            {metrics.lastUpdated && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{metrics.lastUpdated}</span>
              </div>
            )}
          </div>
        )}
        
        {context === "owner" && metrics && (
          <div className="flex items-center gap-3 pt-2 border-t text-xs text-muted-foreground">
            {metrics.occupancyRate !== undefined && (
              <div className="flex items-center gap-1">
                <span>Ocupación: <strong className="text-foreground">{metrics.occupancyRate}%</strong></span>
              </div>
            )}
            {metrics.lastPayment && (
              <div className="flex items-center gap-1">
                <span>Último pago: <strong className="text-foreground">{metrics.lastPayment}</strong></span>
              </div>
            )}
          </div>
        )}
        
        {context === "tenant" && metrics && (
          <div className="flex items-center gap-3 pt-2 border-t text-xs text-muted-foreground">
            {metrics.contractStatus && (
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>Contrato: <strong className="text-foreground">{metrics.contractStatus}</strong></span>
              </div>
            )}
            {metrics.nextPaymentDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Próximo pago: <strong className="text-foreground">{metrics.nextPaymentDate}</strong></span>
              </div>
            )}
          </div>
        )}
        
        {context === "admin" && metrics && (
          <div className="flex items-center gap-3 pt-2 border-t text-xs text-muted-foreground">
            {metrics.leads !== undefined && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>Leads: <strong className="text-foreground">{metrics.leads}</strong></span>
              </div>
            )}
            {metrics.views !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>Vistas: <strong className="text-foreground">{metrics.views}</strong></span>
              </div>
            )}
            {metrics.pendingTickets !== undefined && metrics.pendingTickets > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-amber-600">Tickets: <strong>{metrics.pendingTickets}</strong></span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Hide footer only in landing variant (featured shows buttons) */}
      {!isLanding && (
      <CardFooter className="p-3 pt-0 flex gap-2 flex-wrap mt-auto">
        {context === "seller" && (
          <>
            {selectedLeadName ? (
              <>
                {onFavorite && (
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-9 w-9 flex-shrink-0 ${
                      isFavorite 
                        ? 'text-red-500 border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50' 
                        : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFavorite();
                    }}
                    disabled={isFavoriteLoading}
                    data-testid={`button-favorite-${id}`}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                )}
                {onSendToLead && (
                  <Button
                    className="flex-1 h-9 gap-2 text-sm font-medium"
                    onClick={onSendToLead}
                    data-testid={`button-send-to-lead-${id}`}
                  >
                    <SiWhatsapp className="h-4 w-4" />
                    Enviar a {selectedLeadName}
                  </Button>
                )}
              </>
            ) : (
              <>
                {onFindLeads && (
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="flex-1 h-9 gap-1.5"
                    onClick={onFindLeads}
                    data-testid={`button-find-leads-${id}`}
                  >
                    <Users className="h-4 w-4" />
                    Buscar Leads
                  </Button>
                )}
                {onShare && (
                  <Button 
                    size="sm"
                    className="flex-1 h-9 gap-1.5"
                    onClick={onShare}
                    data-testid={`button-share-${id}`}
                  >
                    <SiWhatsapp className="h-4 w-4" />
                    Compartir
                  </Button>
                )}
              </>
            )}
          </>
        )}
        
        {context === "public" && (
          <>
            {onContact && (
              <Button 
                size="sm" 
                className="flex-1 gap-1.5"
                onClick={onContact}
                data-testid={`button-contact-${id}`}
              >
                <MessageCircle className="h-4 w-4" />
                Consultar
              </Button>
            )}
            {onSchedule && (
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 gap-1.5"
                onClick={onSchedule}
                data-testid={`button-schedule-${id}`}
              >
                <Calendar className="h-4 w-4" />
                Agendar visita
              </Button>
            )}
            {onView && !isFeatured && (
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-1.5"
                onClick={onView}
                data-testid={`button-details-${id}`}
              >
                <ExternalLink className="h-4 w-4" />
                Ver detalles
              </Button>
            )}
          </>
        )}
        
        {context === "owner" && (
          <>
            {onViewPortal && (
              <Button 
                size="sm" 
                className="flex-1 gap-1.5"
                onClick={onViewPortal}
                data-testid={`button-portal-${id}`}
              >
                <ExternalLink className="h-4 w-4" />
                Ver portal
              </Button>
            )}
            {onViewDocuments && (
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 gap-1.5"
                onClick={onViewDocuments}
                data-testid={`button-documents-${id}`}
              >
                <FileText className="h-4 w-4" />
                Documentos
              </Button>
            )}
          </>
        )}
        
        {context === "tenant" && (
          <>
            {onViewContract && (
              <Button 
                size="sm" 
                className="flex-1 gap-1.5"
                onClick={onViewContract}
                data-testid={`button-contract-${id}`}
              >
                <FileText className="h-4 w-4" />
                Ver contrato
              </Button>
            )}
            {onReportIssue && (
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 gap-1.5"
                onClick={onReportIssue}
                data-testid={`button-report-${id}`}
              >
                <MessageCircle className="h-4 w-4" />
                Reportar problema
              </Button>
            )}
            {onContactSupport && (
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-1.5"
                onClick={onContactSupport}
                data-testid={`button-support-${id}`}
              >
                <MessageCircle className="h-4 w-4" />
                Soporte
              </Button>
            )}
          </>
        )}
        
        {context === "admin" && (
          <>
            {onEdit && (
              <Button 
                size="sm" 
                className="flex-1 gap-1.5"
                onClick={onEdit}
                data-testid={`button-edit-${id}`}
              >
                <Eye className="h-4 w-4" />
                Editar
              </Button>
            )}
            {onViewLeads && (
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 gap-1.5"
                onClick={onViewLeads}
                data-testid={`button-view-leads-${id}`}
              >
                <Users className="h-4 w-4" />
                Ver leads
              </Button>
            )}
            {onViewPortal && (
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-1.5"
                onClick={onViewPortal}
                data-testid={`button-admin-portal-${id}`}
              >
                <ExternalLink className="h-4 w-4" />
                Portal
              </Button>
            )}
          </>
        )}
      </CardFooter>
      )}
    </Card>
  );
}
