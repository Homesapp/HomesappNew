import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Key, Home, DollarSign, Info } from "lucide-react";

interface CommissionRate {
  rate: number;
  source: 'lead_override' | 'user_override' | 'role_override' | 'agency_default';
  sourceId?: string;
  notes?: string;
}

interface MyRates {
  rental: CommissionRate;
  listedProperty: CommissionRate;
  recruitedProperty: CommissionRate;
}

type CommissionConcept = 'rental' | 'listedProperty' | 'recruitedProperty';

interface CommissionRatesDisplayProps {
  compact?: boolean;
  showLabels?: boolean;
  className?: string;
  /** Filter to only show specific commission concepts. If not provided, shows all. */
  filterConcepts?: CommissionConcept[];
}

const SOURCE_LABELS: Record<string, { es: string; en: string }> = {
  lead_override: { es: "Lead específico", en: "Specific lead" },
  user_override: { es: "Usuario específico", en: "Specific user" },
  role_override: { es: "Por rol", en: "By role" },
  agency_default: { es: "Predeterminado", en: "Default" },
};

export default function CommissionRatesDisplay({ 
  compact = false, 
  showLabels = true,
  className = "",
  filterConcepts
}: CommissionRatesDisplayProps) {
  // Helper to check if a concept should be shown
  const shouldShowConcept = (concept: CommissionConcept) => {
    if (!filterConcepts || filterConcepts.length === 0) return true;
    return filterConcepts.includes(concept);
  };
  const { language } = useLanguage();

  const { data: rates, isLoading } = useQuery<MyRates>({
    queryKey: ['/api/external/commissions/my-rates'],
  });

  if (isLoading) {
    // Determine how many skeletons to show based on filterConcepts
    const conceptsToShow = filterConcepts?.length || 3;
    return (
      <div className={`flex gap-2 ${className}`}>
        {Array.from({ length: conceptsToShow }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-16" />
        ))}
      </div>
    );
  }

  if (!rates) {
    return null;
  }

  const getSourceLabel = (source: string) => {
    return SOURCE_LABELS[source]?.[language] || source;
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'lead_override': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'user_override': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'role_override': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-3 text-sm ${className}`}>
        {shouldShowConcept('rental') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-help">
                <Key className="h-3.5 w-3.5 text-green-600" />
                <span className="font-medium">{rates.rental.rate}%</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{language === "es" ? "Comisión por renta" : "Rental commission"}</p>
              <p className="text-xs text-muted-foreground">{getSourceLabel(rates.rental.source)}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {shouldShowConcept('listedProperty') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-help">
                <Home className="h-3.5 w-3.5 text-blue-600" />
                <span className="font-medium">{rates.listedProperty.rate}%</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{language === "es" ? "Comisión por propiedad listada" : "Listed property commission"}</p>
              <p className="text-xs text-muted-foreground">{getSourceLabel(rates.listedProperty.source)}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {shouldShowConcept('recruitedProperty') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-help">
                <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                <span className="font-medium">{rates.recruitedProperty.rate}%</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{language === "es" ? "Comisión por reclutamiento" : "Recruitment commission"}</p>
              <p className="text-xs text-muted-foreground">{getSourceLabel(rates.recruitedProperty.source)}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabels && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Info className="h-4 w-4" />
          <span>{language === "es" ? "Tus comisiones actuales" : "Your current commissions"}</span>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {shouldShowConcept('rental') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`cursor-help ${getSourceColor(rates.rental.source)}`}
                data-testid="badge-rental-rate"
              >
                <Key className="h-3 w-3 mr-1" />
                {language === "es" ? "Renta" : "Rental"}: {rates.rental.rate}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getSourceLabel(rates.rental.source)}</p>
              {rates.rental.notes && <p className="text-xs">{rates.rental.notes}</p>}
            </TooltipContent>
          </Tooltip>
        )}

        {shouldShowConcept('listedProperty') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`cursor-help ${getSourceColor(rates.listedProperty.source)}`}
                data-testid="badge-listed-rate"
              >
                <Home className="h-3 w-3 mr-1" />
                {language === "es" ? "Listada" : "Listed"}: {rates.listedProperty.rate}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getSourceLabel(rates.listedProperty.source)}</p>
              {rates.listedProperty.notes && <p className="text-xs">{rates.listedProperty.notes}</p>}
            </TooltipContent>
          </Tooltip>
        )}

        {shouldShowConcept('recruitedProperty') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`cursor-help ${getSourceColor(rates.recruitedProperty.source)}`}
                data-testid="badge-recruited-rate"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                {language === "es" ? "Reclut." : "Recruit."}: {rates.recruitedProperty.rate}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getSourceLabel(rates.recruitedProperty.source)}</p>
              {rates.recruitedProperty.notes && <p className="text-xs">{rates.recruitedProperty.notes}</p>}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
