import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Home, 
  TrendingUp, 
  ArrowRight, 
  DollarSign,
  FileText,
  Building2,
  Target,
  Handshake,
  Gavel,
  AlertCircle,
  CalendarDays,
  Plus,
  Activity,
  Calculator,
  UserPlus,
  BarChart3,
  ListChecks,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, differenceInDays } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface SalesAgentStats {
  offers: {
    total: number;
    pending: number;
    negotiating: number;
    accepted: number;
    rejected: number;
    expired: number;
  };
  contracts: {
    total: number;
    draft: number;
    pending_signature: number;
    active: number;
    in_escrow: number;
    closed: number;
    cancelled: number;
  };
  revenue: {
    totalCommissions: number;
    pendingCommissions: number;
    thisMonthSales: number;
    averageDealSize: number;
  };
  pipeline: {
    totalValue: number;
    expectedClose: number;
  };
}

interface SaleOffer {
  id: string;
  propertyId: string;
  offerPrice: number;
  status: string;
  createdAt: string;
  expirationDate?: string;
  property?: {
    title: string;
    address: string;
    salePrice?: number;
  };
  buyer?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface SaleContract {
  id: string;
  propertyId: string;
  salePrice: number;
  status: string;
  signingDate?: string;
  closingDate?: string;
  property?: {
    title: string;
    address: string;
  };
  buyer?: {
    firstName: string;
    lastName: string;
  };
  seller?: {
    firstName: string;
    lastName: string;
  };
}

export default function SalesAgentDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const locale = language === "es" ? es : enUS;
  
  const { data: stats, isLoading: loadingStats } = useQuery<SalesAgentStats>({
    queryKey: ["/api/sales-agent/stats"],
  });

  const { data: recentOffers, isLoading: loadingOffers } = useQuery<SaleOffer[]>({
    queryKey: ["/api/sale-offers"],
  });

  const { data: activeContracts, isLoading: loadingContracts } = useQuery<SaleContract[]>({
    queryKey: ["/api/sale-contracts", { status: "active" }],
  });

  const isLoading = loadingStats || loadingOffers || loadingContracts;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getOfferStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      under_review: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      counter_offer: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      expired: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      withdrawn: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };
    return colors[status] || colors.draft;
  };

  const getContractStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      pending_signature: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      in_escrow: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      pending_closing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      closed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[status] || colors.draft;
  };

  const translations: Record<string, Record<string, string>> = {
    es: {
      title: "Panel de Agente de Ventas",
      subtitle: "Homesapp - Gestión de Ventas",
      welcome: "Bienvenido",
      totalOffers: "Total Ofertas",
      pendingOffers: "Ofertas Pendientes",
      activeContracts: "Contratos Activos",
      closedDeals: "Ventas Cerradas",
      totalCommissions: "Comisiones Totales",
      pendingCommissions: "Comisiones Pendientes",
      pipelineValue: "Valor Pipeline",
      avgDealSize: "Promedio por Venta",
      recentOffers: "Ofertas Recientes",
      upcomingClosings: "Próximos Cierres",
      offersPipeline: "Pipeline de Ofertas",
      contractsPipeline: "Pipeline de Contratos",
      viewAll: "Ver Todo",
      noOffers: "No hay ofertas pendientes",
      noContracts: "No hay contratos activos",
      daysToClose: "días para cierre",
      newOffer: "Nueva Oferta",
      manageOffers: "Gestionar Ofertas",
      manageContracts: "Gestionar Contratos",
      quickActions: "Acciones Rápidas",
      salesProperties: "Propiedades en Venta",
      buyerLeads: "Leads Compradores",
      statusDraft: "Borrador",
      statusPending: "Pendiente",
      statusUnderReview: "En Revisión",
      statusCounterOffer: "Contraoferta",
      statusAccepted: "Aceptada",
      statusRejected: "Rechazada",
      statusExpired: "Expirada",
      statusWithdrawn: "Retirada",
      contractDraft: "Borrador",
      contractPendingSignature: "Pendiente Firma",
      contractActive: "Activo",
      contractInEscrow: "En Fideicomiso",
      contractPendingClosing: "Pendiente Cierre",
      contractClosed: "Cerrado",
      contractCancelled: "Cancelado",
      from: "de",
      valuations: "Avalúos",
      newValuation: "Nuevo Avalúo",
      myBuyers: "Mis Compradores",
      myProperties: "Mis Propiedades",
      valuationRequests: "Solicitudes de Avalúo",
      createValuation: "Crear Avalúo",
      viewBuyers: "Ver Compradores",
      viewProperties: "Ver Propiedades",
      valuationsPending: "avalúos pendientes",
      buyersActive: "compradores activos",
      propertiesListed: "propiedades listadas",
    },
    en: {
      title: "Sales Agent Dashboard",
      subtitle: "Homesapp - Sales Management",
      welcome: "Welcome",
      totalOffers: "Total Offers",
      pendingOffers: "Pending Offers",
      activeContracts: "Active Contracts",
      closedDeals: "Closed Deals",
      totalCommissions: "Total Commissions",
      pendingCommissions: "Pending Commissions",
      pipelineValue: "Pipeline Value",
      avgDealSize: "Average Deal Size",
      recentOffers: "Recent Offers",
      upcomingClosings: "Upcoming Closings",
      offersPipeline: "Offers Pipeline",
      contractsPipeline: "Contracts Pipeline",
      viewAll: "View All",
      noOffers: "No pending offers",
      noContracts: "No active contracts",
      daysToClose: "days to close",
      newOffer: "New Offer",
      manageOffers: "Manage Offers",
      manageContracts: "Manage Contracts",
      quickActions: "Quick Actions",
      salesProperties: "Properties for Sale",
      buyerLeads: "Buyer Leads",
      statusDraft: "Draft",
      statusPending: "Pending",
      statusUnderReview: "Under Review",
      statusCounterOffer: "Counter Offer",
      statusAccepted: "Accepted",
      statusRejected: "Rejected",
      statusExpired: "Expired",
      statusWithdrawn: "Withdrawn",
      contractDraft: "Draft",
      contractPendingSignature: "Pending Signature",
      contractActive: "Active",
      contractInEscrow: "In Escrow",
      contractPendingClosing: "Pending Closing",
      contractClosed: "Closed",
      contractCancelled: "Cancelled",
      from: "from",
      valuations: "Valuations",
      newValuation: "New Valuation",
      myBuyers: "My Buyers",
      myProperties: "My Properties",
      valuationRequests: "Valuation Requests",
      createValuation: "Create Valuation",
      viewBuyers: "View Buyers",
      viewProperties: "View Properties",
      valuationsPending: "valuations pending",
      buyersActive: "active buyers",
      propertiesListed: "properties listed",
    },
  };

  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  const getOfferStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: t("statusDraft"),
      pending: t("statusPending"),
      under_review: t("statusUnderReview"),
      counter_offer: t("statusCounterOffer"),
      accepted: t("statusAccepted"),
      rejected: t("statusRejected"),
      expired: t("statusExpired"),
      withdrawn: t("statusWithdrawn"),
    };
    return labels[status] || status;
  };

  const getContractStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: t("contractDraft"),
      pending_signature: t("contractPendingSignature"),
      active: t("contractActive"),
      in_escrow: t("contractInEscrow"),
      pending_closing: t("contractPendingClosing"),
      closed: t("contractClosed"),
      cancelled: t("contractCancelled"),
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const totalActiveOffers = (stats?.offers.pending || 0) + (stats?.offers.negotiating || 0);
  const totalActiveContracts = (stats?.contracts.active || 0) + (stats?.contracts.in_escrow || 0) + (stats?.contracts.pending_signature || 0);

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="sales-agent-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">
            {t("subtitle")} - {t("welcome")}, {user?.firstName || user?.username || "Agente"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild data-testid="button-new-offer">
            <Link href="/sales/offers/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("newOffer")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-offers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">{t("totalOffers")}</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-offers">
              {stats?.offers.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalActiveOffers} {t("pendingOffers").toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-contracts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">{t("activeContracts")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-contracts">
              {totalActiveContracts}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.contracts.closed || 0} {t("closedDeals").toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-pipeline-value">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">{t("pipelineValue")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pipeline-value">
              {formatCurrency(stats?.pipeline.totalValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.pipeline.expectedClose || 0)} esperado
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-commissions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">{t("totalCommissions")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-commissions">
              {formatCurrency(stats?.revenue.totalCommissions || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.revenue.pendingCommissions || 0)} {t("pendingCommissions").toLowerCase()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            {t("quickActions")}
          </CardTitle>
          <CardDescription>
            {language === "es" ? "Accede rápidamente a tus herramientas principales" : "Quick access to your main tools"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild data-testid="button-valuations">
              <Link href="/sales/valuations">
                <Calculator className="h-6 w-6 text-primary" />
                <span className="font-medium">{t("valuations")}</span>
                <span className="text-xs text-muted-foreground">{t("createValuation")}</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild data-testid="button-my-buyers">
              <Link href="/sales/buyers">
                <Users className="h-6 w-6 text-primary" />
                <span className="font-medium">{t("myBuyers")}</span>
                <span className="text-xs text-muted-foreground">{t("viewBuyers")}</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild data-testid="button-my-properties">
              <Link href="/sales/properties">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-medium">{t("myProperties")}</span>
                <span className="text-xs text-muted-foreground">{t("viewProperties")}</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild data-testid="button-valuation-requests">
              <Link href="/sales/valuation-requests">
                <BarChart3 className="h-6 w-6 text-primary" />
                <span className="font-medium">{t("valuationRequests")}</span>
                <span className="text-xs text-muted-foreground">{t("valuationsPending")}</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card data-testid="card-offers-pipeline">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              {t("offersPipeline")}
            </CardTitle>
            <CardDescription>
              {t("totalOffers")}: {stats?.offers.total || 0}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  {t("statusPending")}
                </span>
                <span className="font-medium">{stats?.offers.pending || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  {t("statusCounterOffer")}
                </span>
                <span className="font-medium">{stats?.offers.negotiating || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  {t("statusAccepted")}
                </span>
                <span className="font-medium">{stats?.offers.accepted || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  {t("statusRejected")}
                </span>
                <span className="font-medium">{stats?.offers.rejected || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500" />
                  {t("statusExpired")}
                </span>
                <span className="font-medium">{stats?.offers.expired || 0}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" asChild data-testid="button-manage-offers">
              <Link href="/sales/offers">
                {t("manageOffers")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="card-contracts-pipeline">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("contractsPipeline")}
            </CardTitle>
            <CardDescription>
              {t("activeContracts")}: {totalActiveContracts}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-500" />
                  {t("contractDraft")}
                </span>
                <span className="font-medium">{stats?.contracts.draft || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  {t("contractPendingSignature")}
                </span>
                <span className="font-medium">{stats?.contracts.pending_signature || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  {t("contractActive")}
                </span>
                <span className="font-medium">{stats?.contracts.active || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  {t("contractInEscrow")}
                </span>
                <span className="font-medium">{stats?.contracts.in_escrow || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  {t("contractClosed")}
                </span>
                <span className="font-medium">{stats?.contracts.closed || 0}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" asChild data-testid="button-manage-contracts">
              <Link href="/sales/contracts">
                {t("manageContracts")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-recent-offers">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t("recentOffers")}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sales/offers">
                  {t("viewAll")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!recentOffers?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("noOffers")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOffers.slice(0, 5).map((offer) => (
                  <div 
                    key={offer.id} 
                    className="flex items-center justify-between p-3 rounded-lg border hover-elevate cursor-pointer"
                    data-testid={`offer-item-${offer.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {offer.property?.title || `Propiedad ${offer.propertyId}`}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {offer.buyer?.firstName} {offer.buyer?.lastName} - {formatCurrency(offer.offerPrice)}
                      </p>
                    </div>
                    <Badge className={getOfferStatusColor(offer.status)}>
                      {getOfferStatusLabel(offer.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-upcoming-closings">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t("upcomingClosings")}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sales/contracts">
                  {t("viewAll")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!activeContracts?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("noContracts")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeContracts.slice(0, 5).map((contract) => {
                  const daysToClose = contract.closingDate 
                    ? differenceInDays(new Date(contract.closingDate), new Date())
                    : null;
                  
                  return (
                    <div 
                      key={contract.id} 
                      className="flex items-center justify-between p-3 rounded-lg border hover-elevate cursor-pointer"
                      data-testid={`contract-item-${contract.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {contract.property?.title || `Propiedad ${contract.propertyId}`}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {contract.buyer?.firstName} {contract.buyer?.lastName} - {formatCurrency(contract.salePrice)}
                        </p>
                        {daysToClose !== null && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <CalendarDays className="h-3 w-3" />
                            {daysToClose > 0 
                              ? `${daysToClose} ${t("daysToClose")}`
                              : daysToClose === 0 
                                ? "Cierre hoy"
                                : "Vencido"
                            }
                          </p>
                        )}
                      </div>
                      <Badge className={getContractStatusColor(contract.status)}>
                        {getContractStatusLabel(contract.status)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>{t("quickActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild data-testid="button-sales-properties">
              <Link href="/sales/properties">
                <Building2 className="h-6 w-6" />
                <span className="text-sm">{t("salesProperties")}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild data-testid="button-buyer-leads">
              <Link href="/sales/leads">
                <Users className="h-6 w-6" />
                <span className="text-sm">{t("buyerLeads")}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild data-testid="button-offers-link">
              <Link href="/sales/offers">
                <Gavel className="h-6 w-6" />
                <span className="text-sm">{t("manageOffers")}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild data-testid="button-contracts-link">
              <Link href="/sales/contracts">
                <FileText className="h-6 w-6" />
                <span className="text-sm">{t("manageContracts")}</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
