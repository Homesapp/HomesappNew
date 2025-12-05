import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calculator, 
  Search, 
  ArrowLeft,
  Plus,
  Eye,
  Edit,
  Building2,
  DollarSign,
  Calendar,
  FileText,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface Valuation {
  id: string;
  propertyId: string;
  type: string;
  status: string;
  priceMin: string | null;
  priceTarget: string | null;
  priceMax: string | null;
  pricePerSquareMeter: string | null;
  currency: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
  property?: {
    title: string;
    address: string;
    zone: string | null;
    city: string;
    mainImageUrl: string | null;
  };
}

const VALUATION_STATUSES: Record<string, { es: string; en: string; color: string; icon: any }> = {
  draft: { 
    es: "Borrador", 
    en: "Draft", 
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    icon: Clock
  },
  pending_review: { 
    es: "En Revisión", 
    en: "Pending Review", 
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    icon: AlertCircle
  },
  completed: { 
    es: "Completado", 
    en: "Completed", 
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: CheckCircle
  },
  expired: { 
    es: "Expirado", 
    en: "Expired", 
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: XCircle
  },
};

const VALUATION_TYPES: Record<string, { es: string; en: string }> = {
  sale: { es: "Venta", en: "Sale" },
  rent_long: { es: "Renta Larga", en: "Long-term Rent" },
  rent_short: { es: "Renta Corta", en: "Short-term Rent" },
};

export default function SalesValuations() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const locale = language === "es" ? es : enUS;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: valuations, isLoading } = useQuery<Valuation[]>({
    queryKey: ["/api/valuations"],
  });

  const translations: Record<string, Record<string, string>> = {
    es: {
      title: "Mis Avalúos",
      subtitle: "Gestión de avalúos CMA - Homesapp",
      backToDashboard: "Volver al Panel",
      newValuation: "Nuevo Avalúo",
      searchPlaceholder: "Buscar avalúos...",
      noValuations: "No hay avalúos registrados",
      noValuationsDesc: "Crea tu primer avalúo para comenzar",
      viewValuation: "Ver Avalúo",
      editValuation: "Editar Avalúo",
      allStatuses: "Todos los Estados",
      allTypes: "Todos los Tipos",
      filterByStatus: "Estado",
      filterByType: "Tipo",
      priceRange: "Rango de Precio",
      targetPrice: "Precio Objetivo",
      validUntil: "Válido Hasta",
      createdAt: "Creado",
      property: "Propiedad",
      comparables: "Comparables",
    },
    en: {
      title: "My Valuations",
      subtitle: "CMA valuations management - Homesapp",
      backToDashboard: "Back to Dashboard",
      newValuation: "New Valuation",
      searchPlaceholder: "Search valuations...",
      noValuations: "No valuations registered",
      noValuationsDesc: "Create your first valuation to get started",
      viewValuation: "View Valuation",
      editValuation: "Edit Valuation",
      allStatuses: "All Statuses",
      allTypes: "All Types",
      filterByStatus: "Status",
      filterByType: "Type",
      priceRange: "Price Range",
      targetPrice: "Target Price",
      validUntil: "Valid Until",
      createdAt: "Created",
      property: "Property",
      comparables: "Comparables",
    },
  };

  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusInfo = (status: string) => {
    return VALUATION_STATUSES[status] || VALUATION_STATUSES.draft;
  };

  const getTypeLabel = (type: string) => {
    const typeInfo = VALUATION_TYPES[type];
    return typeInfo ? typeInfo[language as "es" | "en"] : type;
  };

  const filteredValuations = valuations?.filter(valuation => {
    const matchesSearch = searchQuery === "" || 
      valuation.property?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      valuation.property?.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || valuation.status === statusFilter;
    const matchesType = typeFilter === "all" || valuation.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="sales-valuations-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/sales/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild data-testid="button-new-valuation">
            <Link href="/sales/valuations/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("newValuation")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-status">
              <SelectValue placeholder={t("filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              {Object.entries(VALUATION_STATUSES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value[language as "es" | "en"]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-type">
              <SelectValue placeholder={t("filterByType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allTypes")}</SelectItem>
              {Object.entries(VALUATION_TYPES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value[language as "es" | "en"]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredValuations.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Calculator className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("noValuations")}</h3>
            <p className="text-muted-foreground mb-4">{t("noValuationsDesc")}</p>
            <Button asChild>
              <Link href="/sales/valuations/new">
                <Plus className="h-4 w-4 mr-2" />
                {t("newValuation")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredValuations.map((valuation) => {
            const statusInfo = getStatusInfo(valuation.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={valuation.id} className="overflow-hidden hover-elevate" data-testid={`valuation-card-${valuation.id}`}>
                <div className="relative aspect-video bg-muted">
                  {valuation.property?.mainImageUrl ? (
                    <img
                      src={valuation.property.mainImageUrl}
                      alt={valuation.property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo[language as "es" | "en"]}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary">
                      {getTypeLabel(valuation.type)}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold line-clamp-1">
                        {valuation.property?.title || `Propiedad ${valuation.propertyId}`}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {valuation.property?.zone || valuation.property?.city}
                      </p>
                    </div>

                    {valuation.priceTarget ? (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{t("targetPrice")}</p>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(valuation.priceTarget)}
                        </p>
                        {valuation.priceMin && valuation.priceMax && (
                          <p className="text-xs text-muted-foreground">
                            {t("priceRange")}: {formatCurrency(valuation.priceMin)} - {formatCurrency(valuation.priceMax)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="py-2">
                        <p className="text-sm text-muted-foreground italic">
                          {language === "es" ? "Pendiente de valoración" : "Pending valuation"}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(valuation.createdAt), "dd MMM yyyy", { locale })}
                      </span>
                      {valuation.validUntil && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(valuation.validUntil), "dd MMM", { locale })}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/sales/valuations/${valuation.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          {t("viewValuation")}
                        </Link>
                      </Button>
                      {valuation.status === "draft" && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/sales/valuations/${valuation.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
