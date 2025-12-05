import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, 
  Search, 
  ArrowLeft,
  MapPin,
  DollarSign,
  Home,
  Bed,
  Bath,
  Square,
  Eye,
  Calculator,
  Plus,
  Filter,
  Grid,
  List,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  zone: string | null;
  propertyType: string;
  salePrice: number | null;
  rentLongPrice: number | null;
  rentShortPrice: number | null;
  bedrooms: number | null;
  bathrooms: string | null;
  squareMeters: string | null;
  status: string;
  listingType: string | null;
  brand: string | null;
  mainImageUrl: string | null;
  verificationStatus: string | null;
  createdAt: string;
}

const PROPERTY_TYPES: Record<string, { es: string; en: string }> = {
  apartment: { es: "Departamento", en: "Apartment" },
  house: { es: "Casa", en: "House" },
  condo: { es: "Condominio", en: "Condo" },
  villa: { es: "Villa", en: "Villa" },
  land: { es: "Terreno", en: "Land" },
  commercial: { es: "Comercial", en: "Commercial" },
  penthouse: { es: "Penthouse", en: "Penthouse" },
};

const LISTING_STATUSES: Record<string, { es: string; en: string; color: string }> = {
  available: { es: "Disponible", en: "Available", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  pending: { es: "En Proceso", en: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  sold: { es: "Vendida", en: "Sold", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  reserved: { es: "Reservada", en: "Reserved", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  off_market: { es: "Fuera del Mercado", en: "Off Market", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
};

export default function SalesProperties() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const locale = language === "es" ? es : enUS;
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const translations: Record<string, Record<string, string>> = {
    es: {
      title: "Propiedades en Venta",
      subtitle: "Gestión de propiedades para venta - Homesapp",
      backToDashboard: "Volver al Panel",
      searchPlaceholder: "Buscar propiedades...",
      gridView: "Cuadrícula",
      listView: "Lista",
      noProperties: "No hay propiedades disponibles",
      noPropertiesDesc: "Las propiedades asignadas aparecerán aquí",
      viewProperty: "Ver Propiedad",
      createValuation: "Crear Avalúo",
      allStatuses: "Todos los Estados",
      allTypes: "Todos los Tipos",
      filterByStatus: "Estado",
      filterByType: "Tipo",
      bedrooms: "Recámaras",
      bathrooms: "Baños",
      sqm: "m²",
      priceFrom: "Desde",
      verified: "Verificada",
      pending_review: "En Revisión",
      unverified: "Sin Verificar",
    },
    en: {
      title: "Properties for Sale",
      subtitle: "Sales property management - Homesapp",
      backToDashboard: "Back to Dashboard",
      searchPlaceholder: "Search properties...",
      gridView: "Grid",
      listView: "List",
      noProperties: "No properties available",
      noPropertiesDesc: "Assigned properties will appear here",
      viewProperty: "View Property",
      createValuation: "Create Valuation",
      allStatuses: "All Statuses",
      allTypes: "All Types",
      filterByStatus: "Status",
      filterByType: "Type",
      bedrooms: "Bedrooms",
      bathrooms: "Bathrooms",
      sqm: "sqm",
      priceFrom: "From",
      verified: "Verified",
      pending_review: "Pending Review",
      unverified: "Unverified",
    },
  };

  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPropertyTypeLabel = (type: string) => {
    const typeInfo = PROPERTY_TYPES[type];
    return typeInfo ? typeInfo[language as "es" | "en"] : type;
  };

  const getStatusInfo = (status: string) => {
    return LISTING_STATUSES[status] || LISTING_STATUSES.available;
  };

  const getVerificationBadge = (status: string | null) => {
    if (status === "verified") {
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{t("verified")}</Badge>;
    }
    if (status === "pending_review") {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{t("pending_review")}</Badge>;
    }
    return <Badge variant="outline">{t("unverified")}</Badge>;
  };

  const filteredProperties = properties?.filter(property => {
    const matchesSearch = searchQuery === "" || 
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.zone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    const matchesType = typeFilter === "all" || property.propertyType === typeFilter;
    
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
    <div className="container mx-auto p-6 space-y-6" data-testid="sales-properties-page">
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
              {Object.entries(LISTING_STATUSES).map(([key, value]) => (
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
              {Object.entries(PROPERTY_TYPES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value[language as "es" | "en"]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("grid")}
            data-testid="button-grid-view"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("list")}
            data-testid="button-list-view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("noProperties")}</h3>
            <p className="text-muted-foreground">{t("noPropertiesDesc")}</p>
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProperties.map((property) => {
            const statusInfo = getStatusInfo(property.status);
            return (
              <Card key={property.id} className="overflow-hidden hover-elevate" data-testid={`property-card-${property.id}`}>
                <div className="relative aspect-video bg-muted">
                  {property.mainImageUrl ? (
                    <img
                      src={property.mainImageUrl}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge className={statusInfo.color}>
                      {statusInfo[language as "es" | "en"]}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    {getVerificationBadge(property.verificationStatus)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-1">{property.title}</h3>
                      <Badge variant="outline" className="shrink-0">
                        {getPropertyTypeLabel(property.propertyType)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{property.zone || property.city}</span>
                    </p>
                    {property.salePrice && (
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(property.salePrice)}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {property.bedrooms && (
                        <span className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          {property.bedrooms}
                        </span>
                      )}
                      {property.bathrooms && (
                        <span className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          {property.bathrooms}
                        </span>
                      )}
                      {property.squareMeters && (
                        <span className="flex items-center gap-1">
                          <Square className="h-4 w-4" />
                          {property.squareMeters} {t("sqm")}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/properties/${property.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          {t("viewProperty")}
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/sales/valuations/new?propertyId=${property.id}`}>
                          <Calculator className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProperties.map((property) => {
            const statusInfo = getStatusInfo(property.status);
            return (
              <Card key={property.id} className="hover-elevate" data-testid={`property-row-${property.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {property.mainImageUrl ? (
                        <img
                          src={property.mainImageUrl}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{property.title}</h3>
                        <Badge className={statusInfo.color}>
                          {statusInfo[language as "es" | "en"]}
                        </Badge>
                        {getVerificationBadge(property.verificationStatus)}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {property.zone || property.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Home className="h-3 w-3" />
                          {getPropertyTypeLabel(property.propertyType)}
                        </span>
                        {property.bedrooms && (
                          <span className="flex items-center gap-1">
                            <Bed className="h-3 w-3" />
                            {property.bedrooms}
                          </span>
                        )}
                        {property.squareMeters && (
                          <span className="flex items-center gap-1">
                            <Square className="h-3 w-3" />
                            {property.squareMeters} {t("sqm")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {property.salePrice && (
                        <p className="text-lg font-bold text-primary whitespace-nowrap">
                          {formatCurrency(property.salePrice)}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/properties/${property.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/sales/valuations/new?propertyId=${property.id}`}>
                            <Calculator className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
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
