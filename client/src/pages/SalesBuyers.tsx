import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign,
  MapPin,
  Building2,
  ArrowLeft,
  LayoutGrid,
  List,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Home,
  UserPlus,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BuyerLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  budget: number | null;
  budgetMax: number | null;
  preferredZones: string[] | null;
  preferredPropertyTypes: string[] | null;
  bedrooms: number | null;
  notes: string | null;
  assignedTo: string | null;
  operationType: string | null;
  createdAt: string;
  updatedAt: string;
}

const BUYER_STATUSES = [
  { value: "new", label: { es: "Nuevo", en: "New" }, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "contacted", label: { es: "Contactado", en: "Contacted" }, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "qualified", label: { es: "Calificado", en: "Qualified" }, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "showing", label: { es: "En Visitas", en: "Showing" }, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "negotiating", label: { es: "Negociando", en: "Negotiating" }, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "closed", label: { es: "Cerrado", en: "Closed" }, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  { value: "lost", label: { es: "Perdido", en: "Lost" }, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
];

export default function SalesBuyers() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const locale = language === "es" ? es : enUS;
  const [view, setView] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: buyers, isLoading } = useQuery<BuyerLead[]>({
    queryKey: ["/api/leads", { operationType: "purchase" }],
  });

  const translations: Record<string, Record<string, string>> = {
    es: {
      title: "Mis Compradores",
      subtitle: "Gestión de leads compradores - Homesapp",
      backToDashboard: "Volver al Panel",
      addBuyer: "Agregar Comprador",
      searchPlaceholder: "Buscar compradores...",
      listView: "Lista",
      kanbanView: "Kanban",
      noBuyers: "No hay compradores registrados",
      noBuyersDesc: "Agrega tu primer comprador para comenzar",
      budget: "Presupuesto",
      preferredZones: "Zonas Preferidas",
      bedrooms: "Recámaras",
      source: "Fuente",
      lastContact: "Último Contacto",
      actions: "Acciones",
      view: "Ver",
      edit: "Editar",
      delete: "Eliminar",
      allStatuses: "Todos los Estados",
      filterByStatus: "Filtrar por Estado",
    },
    en: {
      title: "My Buyers",
      subtitle: "Buyer leads management - Homesapp",
      backToDashboard: "Back to Dashboard",
      addBuyer: "Add Buyer",
      searchPlaceholder: "Search buyers...",
      listView: "List",
      kanbanView: "Kanban",
      noBuyers: "No buyers registered",
      noBuyersDesc: "Add your first buyer to get started",
      budget: "Budget",
      preferredZones: "Preferred Zones",
      bedrooms: "Bedrooms",
      source: "Source",
      lastContact: "Last Contact",
      actions: "Actions",
      view: "View",
      edit: "Edit",
      delete: "Delete",
      allStatuses: "All Statuses",
      filterByStatus: "Filter by Status",
    },
  };

  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  const getStatusInfo = (status: string) => {
    const statusInfo = BUYER_STATUSES.find(s => s.value === status);
    return statusInfo || { value: status, label: { es: status, en: status }, color: "bg-gray-100 text-gray-800" };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredBuyers = buyers?.filter(buyer => {
    const matchesSearch = searchQuery === "" || 
      `${buyer.firstName} ${buyer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyer.phone?.includes(searchQuery);
    
    const matchesStatus = !statusFilter || buyer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const groupedByStatus = BUYER_STATUSES.reduce((acc, status) => {
    acc[status.value] = filteredBuyers.filter(b => b.status === status.value);
    return acc;
  }, {} as Record<string, BuyerLead[]>);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="sales-buyers-page">
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
          <Button asChild data-testid="button-add-buyer">
            <Link href="/sales/buyers/new">
              <UserPlus className="h-4 w-4 mr-2" />
              {t("addBuyer")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" data-testid="button-filter">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter(null)} data-testid="filter-all">
                {t("allStatuses")}
              </DropdownMenuItem>
              {BUYER_STATUSES.map(status => (
                <DropdownMenuItem 
                  key={status.value} 
                  onClick={() => setStatusFilter(status.value)}
                  data-testid={`filter-${status.value}`}
                >
                  {status.label[language as "es" | "en"]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as "list" | "kanban")}>
          <TabsList>
            <TabsTrigger value="list" data-testid="tab-list">
              <List className="h-4 w-4 mr-2" />
              {t("listView")}
            </TabsTrigger>
            <TabsTrigger value="kanban" data-testid="tab-kanban">
              <LayoutGrid className="h-4 w-4 mr-2" />
              {t("kanbanView")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredBuyers.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("noBuyers")}</h3>
            <p className="text-muted-foreground mb-4">{t("noBuyersDesc")}</p>
            <Button asChild>
              <Link href="/sales/buyers/new">
                <UserPlus className="h-4 w-4 mr-2" />
                {t("addBuyer")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : view === "list" ? (
        <div className="space-y-4">
          {filteredBuyers.map((buyer) => {
            const statusInfo = getStatusInfo(buyer.status);
            return (
              <Card key={buyer.id} className="hover-elevate" data-testid={`buyer-card-${buyer.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">
                            {buyer.firstName} {buyer.lastName}
                          </h3>
                          <Badge className={statusInfo.color}>
                            {statusInfo.label[language as "es" | "en"]}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          {buyer.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {buyer.email}
                            </span>
                          )}
                          {buyer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {buyer.phone}
                            </span>
                          )}
                          {buyer.budget && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(buyer.budget)}
                              {buyer.budgetMax && ` - ${formatCurrency(buyer.budgetMax)}`}
                            </span>
                          )}
                          {buyer.bedrooms && (
                            <span className="flex items-center gap-1">
                              <Home className="h-3 w-3" />
                              {buyer.bedrooms} {t("bedrooms")}
                            </span>
                          )}
                        </div>
                        {buyer.preferredZones && buyer.preferredZones.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {buyer.preferredZones.slice(0, 3).join(", ")}
                              {buyer.preferredZones.length > 3 && ` +${buyer.preferredZones.length - 3}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild data-testid={`button-view-${buyer.id}`}>
                        <Link href={`/sales/buyers/${buyer.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild data-testid={`button-edit-${buyer.id}`}>
                        <Link href={`/sales/buyers/${buyer.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-more-${buyer.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/sales/buyers/${buyer.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t("view")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/sales/buyers/${buyer.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t("edit")}
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto">
          {BUYER_STATUSES.map((status) => (
            <div key={status.value} className="min-w-[250px]" data-testid={`kanban-column-${status.value}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${status.color.split(' ')[0]}`} />
                  <h3 className="font-medium text-sm">
                    {status.label[language as "es" | "en"]}
                  </h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {groupedByStatus[status.value]?.length || 0}
                </Badge>
              </div>
              <div className="space-y-2">
                {groupedByStatus[status.value]?.map((buyer) => (
                  <Card 
                    key={buyer.id} 
                    className="hover-elevate cursor-pointer"
                    data-testid={`kanban-card-${buyer.id}`}
                  >
                    <CardContent className="p-3">
                      <Link href={`/sales/buyers/${buyer.id}`}>
                        <h4 className="font-medium text-sm truncate">
                          {buyer.firstName} {buyer.lastName}
                        </h4>
                        {buyer.budget && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(buyer.budget)}
                          </p>
                        )}
                        {buyer.preferredZones && buyer.preferredZones.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {buyer.preferredZones[0]}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(buyer.createdAt), "dd MMM yyyy", { locale })}
                        </p>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
