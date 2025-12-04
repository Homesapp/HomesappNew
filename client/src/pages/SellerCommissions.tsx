import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Calendar, CheckCircle2, Clock, Home, Percent, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Commission {
  id: string;
  amount: number;
  propertyName: string;
  clientName: string;
  status: 'pending' | 'approved' | 'paid';
  rentalDate: string;
  paidAt?: string;
}

interface CommissionRateItem {
  rate: number;
  source: string;
  sourceId?: string;
}

interface CommissionRatesResponse {
  rentalNoReferral: CommissionRateItem;
  rentalWithReferral: CommissionRateItem;
  propertyRecruitment: CommissionRateItem;
  brokerReferral: CommissionRateItem;
}

const conceptLabels: Record<string, { es: string; en: string; descEs: string; descEn: string }> = {
  rental_no_referral: { 
    es: "Renta sin referido", 
    en: "Rental without referral",
    descEs: "Comisión cuando cierras una renta sin referido externo",
    descEn: "Commission when you close a rental without external referral"
  },
  rental_with_referral: { 
    es: "Renta con referido", 
    en: "Rental with referral",
    descEs: "Comisión cuando cierras una renta que fue referida",
    descEn: "Commission when you close a rental that was referred"
  },
  property_recruitment: { 
    es: "Reclutamiento de propiedad", 
    en: "Property recruitment",
    descEs: "Comisión por captar una nueva propiedad para el portafolio",
    descEn: "Commission for recruiting a new property to the portfolio"
  },
  broker_referral: { 
    es: "Referido de broker", 
    en: "Broker referral",
    descEs: "Comisión por referir un negocio a otro agente",
    descEn: "Commission for referring business to another agent"
  },
};

const sourceLabels: Record<string, { es: string; en: string }> = {
  default: { es: "Por defecto", en: "Default" },
  role: { es: "Por rol", en: "By role" },
  user: { es: "Personalizado", en: "Customized" }
};

export default function SellerCommissions() {
  const { t, language } = useLanguage();

  const { data: commissions = [], isLoading } = useQuery<Commission[]>({
    queryKey: ["/api/external-seller/commissions"],
  });

  const { data: commissionRates, isLoading: isLoadingRates } = useQuery<CommissionRatesResponse>({
    queryKey: ["/api/external/seller-commission-rates/my-rates"],
  });

  const ratesList = commissionRates ? [
    { concept: 'rental_no_referral', ...commissionRates.rentalNoReferral },
    { concept: 'rental_with_referral', ...commissionRates.rentalWithReferral },
    { concept: 'property_recruitment', ...commissionRates.propertyRecruitment },
    { concept: 'broker_referral', ...commissionRates.brokerReferral },
  ] : [];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobada",
    paid: "Pagada"
  };

  const totalEarned = commissions.reduce((sum, c) => 
    c.status === "paid" ? sum + Number(c.amount) : sum, 0
  );

  const pendingAmount = commissions.reduce((sum, c) => 
    c.status === "pending" || c.status === "approved" ? sum + Number(c.amount) : sum, 0
  );

  const totalCommissions = commissions.length;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
      {/* Header con mejor jerarquía tipográfica */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Mis Comisiones</h1>
          <p className="text-sm text-muted-foreground">
            Ingresos por rentas realizadas
          </p>
        </div>
      </div>

      {/* Stats Cards con mejor diseño */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="hover-elevate">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Total Ganado</span>
              <div className="h-9 w-9 rounded-full bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 tracking-tight" data-testid="text-total-earned">
              {formatCurrency(totalEarned)}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Comisiones pagadas
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Por Cobrar</span>
              <div className="h-9 w-9 rounded-full bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 tracking-tight" data-testid="text-pending-amount">
              {formatCurrency(pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Pendientes de pago
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Operaciones</span>
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-total-operations">
              {totalCommissions}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Rentas realizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            {language === "es" ? "Mis Porcentajes de Comisión" : "My Commission Rates"}
          </CardTitle>
          <CardDescription>
            {language === "es" 
              ? "Estos son tus porcentajes de comisión según tu rol y configuración"
              : "These are your commission rates based on your role and settings"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRates ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : ratesList.length === 0 ? (
            <div className="text-center py-8">
              <Percent className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm">
                {language === "es" 
                  ? "Los porcentajes de comisión aún no han sido configurados"
                  : "Commission rates have not been configured yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ratesList.map((rate) => {
                const label = conceptLabels[rate.concept];
                const conceptName = label ? (language === "es" ? label.es : label.en) : rate.concept;
                const conceptDesc = label ? (language === "es" ? label.descEs : label.descEn) : 
                  (language === "es" ? "Porcentaje de comisión" : "Commission rate");
                const sourceLabel = sourceLabels[rate.source] || sourceLabels.default;
                const sourceText = language === "es" ? sourceLabel.es : sourceLabel.en;
                
                return (
                  <div
                    key={rate.concept}
                    className="flex items-start gap-3 p-3 sm:p-4 border rounded-lg"
                    data-testid={`rate-${rate.concept}`}
                  >
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-base sm:text-lg font-bold text-primary">
                        {rate.rate}%
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm sm:text-base">
                          {conceptName}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            {conceptDesc}
                          </TooltipContent>
                        </Tooltip>
                        {rate.source !== 'default' && (
                          <Badge variant="secondary" className="text-xs">
                            {sourceText}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                        {conceptDesc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Comisiones</CardTitle>
          <CardDescription>Revisa el estado de tus comisiones por rentas</CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Aún no tienes comisiones registradas
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tus comisiones aparecerán aquí cuando cierres una renta
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {commissions.map((commission) => (
                <div
                  key={commission.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover-elevate gap-3"
                  data-testid={`commission-${commission.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-lg">
                        {formatCurrency(commission.amount)}
                      </span>
                      <Badge className={statusColors[commission.status]}>
                        {statusLabels[commission.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Home className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{commission.propertyName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Cliente: {commission.clientName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{new Date(commission.rentalDate).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}</span>
                    {commission.status === 'paid' && commission.paidAt && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 ml-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
