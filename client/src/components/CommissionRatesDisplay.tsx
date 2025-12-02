import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Key, Home, Handshake, Info } from "lucide-react";

interface CommissionRate {
  rate: number;
  source: 'lead_override' | 'user_override' | 'role_override' | 'agency_default';
  sourceId?: string;
  notes?: string;
}

interface MyRates {
  rentalNoReferral: CommissionRate;
  rentalWithReferral: CommissionRate;
  propertyRecruitment: CommissionRate;
  brokerReferral: CommissionRate;
}

type CommissionConcept = 'rentalNoReferral' | 'rentalWithReferral' | 'propertyRecruitment' | 'brokerReferral';

interface CommissionRatesDisplayProps {
  compact?: boolean;
  showLabels?: boolean;
  className?: string;
  filterConcepts?: CommissionConcept[];
}

const SOURCE_LABELS: Record<string, { es: string; en: string }> = {
  lead_override: { es: "Lead específico", en: "Specific lead" },
  user_override: { es: "Usuario específico", en: "Specific user" },
  role_override: { es: "Por rol", en: "By role" },
  agency_default: { es: "Predeterminado", en: "Default" },
};

const CONCEPT_LABELS: Record<CommissionConcept, { es: string; en: string }> = {
  rentalNoReferral: { 
    es: "Cliente cerrado para renta sin referido", 
    en: "Closed rental (no referral)"
  },
  rentalWithReferral: { 
    es: "Cliente cerrado para renta con referido", 
    en: "Closed rental (with referral)"
  },
  propertyRecruitment: { 
    es: "Reclutar nueva propiedad", 
    en: "Recruit new property"
  },
  brokerReferral: { 
    es: "Referir a un broker con cliente", 
    en: "Refer broker with client"
  },
};

const CONCEPT_ICONS: Record<CommissionConcept, typeof Key> = {
  rentalNoReferral: Key,
  rentalWithReferral: Key,
  propertyRecruitment: Home,
  brokerReferral: Handshake,
};

const CONCEPT_COLORS: Record<CommissionConcept, string> = {
  rentalNoReferral: "text-green-600",
  rentalWithReferral: "text-emerald-600",
  propertyRecruitment: "text-blue-600",
  brokerReferral: "text-amber-600",
};

export default function CommissionRatesDisplay({ 
  compact = false, 
  showLabels = true,
  className = "",
  filterConcepts
}: CommissionRatesDisplayProps) {
  const { language } = useLanguage();
  
  const shouldShowConcept = (concept: CommissionConcept) => {
    if (!filterConcepts || filterConcepts.length === 0) return true;
    return filterConcepts.includes(concept);
  };

  const { data: rates, isLoading } = useQuery<MyRates>({
    queryKey: ['/api/external/seller-commission-rates/my-rates'],
  });

  if (isLoading) {
    const conceptsToShow = filterConcepts?.length || 4;
    return (
      <div className={`flex gap-2 flex-wrap ${className}`}>
        {Array.from({ length: conceptsToShow }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-20" />
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

  const concepts: CommissionConcept[] = ['rentalNoReferral', 'rentalWithReferral', 'propertyRecruitment', 'brokerReferral'];

  if (compact) {
    return (
      <div className={`flex items-center gap-3 text-sm flex-wrap ${className}`}>
        {concepts.filter(shouldShowConcept).map((concept) => {
          const rate = rates[concept];
          const Icon = CONCEPT_ICONS[concept];
          const labels = CONCEPT_LABELS[concept];
          const color = CONCEPT_COLORS[concept];
          
          return (
            <Tooltip key={concept}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                  <span className="font-medium">{rate.rate}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{language === "es" ? labels.es : labels.en}</p>
                <p className="text-xs text-muted-foreground">{getSourceLabel(rate.source)}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
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
        {concepts.filter(shouldShowConcept).map((concept) => {
          const rate = rates[concept];
          const Icon = CONCEPT_ICONS[concept];
          const labels = CONCEPT_LABELS[concept];
          
          return (
            <Tooltip key={concept}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`cursor-help ${getSourceColor(rate.source)}`}
                  data-testid={`badge-${concept}-rate`}
                >
                  <Icon className="h-3 w-3 mr-1.5 shrink-0" />
                  <span className="truncate">{language === "es" ? labels.es : labels.en}</span>
                  <span className="ml-1 font-semibold shrink-0">{rate.rate}%</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs text-muted-foreground">{getSourceLabel(rate.source)}</p>
                {rate.notes && <p className="text-xs mt-1">{rate.notes}</p>}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
