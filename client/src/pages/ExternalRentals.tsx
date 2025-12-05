import { useState, useEffect, useLayoutEffect, useMemo, lazy, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const RentalWizard = lazy(() => import("@/components/RentalWizard"));
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Home, 
  User,
  Calendar,
  DollarSign,
  FileText, 
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  PawPrint,
  LayoutGrid,
  Table as TableIcon,
  XCircle,
  Search,
  Filter,
  KeyRound,
  RotateCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ExternalRentalContract, ExternalUnit, ExternalCondominium } from "@shared/schema";

interface PortalToken {
  id: string;
  contractId: string;
  agencyId: string;
  role: 'tenant' | 'owner';
  accessCode: string;
  status: 'active' | 'revoked' | 'expired';
  expiresAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  createdAt: string;
  tenantName: string | null;
  tenantEmail: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  contractStatus: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  propertyId: string | null;
  unitId: string | null;
}

const PORTAL_ROLE_LABELS = {
  es: { tenant: "Inquilino", owner: "Propietario" },
  en: { tenant: "Tenant", owner: "Owner" },
};

const PORTAL_STATUS_LABELS = {
  es: { active: "Activo", revoked: "Revocado", expired: "Expirado" },
  en: { active: "Active", revoked: "Revoked", expired: "Expired" },
};

interface RentalWithDetails {
  contract: ExternalRentalContract;
  unit: ExternalUnit | null;
  condominium: ExternalCondominium | null;
  activeServices?: Array<{
    serviceType: string;
    amount: string;
    currency: string;
    dayOfMonth: number;
  }>;
  nextPaymentDue?: string | null;
  nextPaymentAmount?: string | null;
  nextPaymentService?: string | null;
}

interface RentalsOverviewResponse {
  contracts: RentalWithDetails[];
  filters: {
    condominiums: Array<{ id: string; name: string }>;
    units: Array<{ id: string; unitNumber: string; condominiumId: string }>;
  };
  statistics: {
    total: number;
    active: number;
    completed: number;
    pending: number;
  };
}

export default function ExternalRentals() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState<string>(() => {
    return location.includes('/external/rentals?tab=portal') ? 'portal' : 'rentals';
  });
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [manualViewModeOverride, setManualViewModeOverride] = useState(false);
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  const [condominiumFilter, setCondominiumFilter] = useState<string>("");
  const [unitFilter, setUnitFilter] = useState<string>("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [contractToCancel, setContractToCancel] = useState<string | null>(null);
  const [selectUnitDialogOpen, setSelectUnitDialogOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Agency selector for admin/master users (Portal tab)
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");

  // Portal tab states
  const [portalSearchQuery, setPortalSearchQuery] = useState("");
  const [portalRoleFilter, setPortalRoleFilter] = useState<string>("all");
  const [portalStatusFilter, setPortalStatusFilter] = useState<string>("all");
  const [showPortalFilters, setShowPortalFilters] = useState(false);
  const [copiedPortalCode, setCopiedPortalCode] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<PortalToken | null>(null);
  const [newCredentials, setNewCredentials] = useState<{ accessCode: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const dateLocale = language === "es" ? es : enUS;
  
  // Fetch current user to check role
  const { data: currentUser } = useQuery<{ id: string; role: string; externalAgencyId?: string }>({
    queryKey: ['/api/user'],
  });
  
  // Check if user is admin/master
  const isAdminOrMaster = currentUser?.role === 'admin' || currentUser?.role === 'master';
  
  // Fetch all agencies for admin/master users
  const { data: agencies } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['/api/external-agencies'],
    enabled: isAdminOrMaster && activeTab === 'portal',
  });
  
  // Auto-select first agency when agencies load
  useEffect(() => {
    if (isAdminOrMaster && agencies && agencies.length > 0 && !selectedAgencyId) {
      setSelectedAgencyId(agencies[0].id);
    }
  }, [agencies, isAdminOrMaster, selectedAgencyId]);

  // OPTIMIZED: Single consolidated query for all rentals data (contracts, filters, stats)
  const { data: overviewData, isLoading, isError, error, refetch } = useQuery<RentalsOverviewResponse>({
    queryKey: ["/api/external/rentals/overview", statusFilter],
    queryFn: async () => {
      const url = statusFilter 
        ? `/api/external/rentals/overview?status=${statusFilter}`
        : "/api/external/rentals/overview";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch rentals overview");
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds cache
  });

  // Extract data from consolidated response
  const rentals = overviewData?.contracts || [];
  const condominiums = overviewData?.filters.condominiums || [];
  const stats = overviewData?.statistics || { total: 0, active: 0, completed: 0, pending: 0 };
  
  // Filter units by selected condominium
  const units = useMemo(() => {
    const allUnits = overviewData?.filters.units || [];
    if (!condominiumFilter) return allUnits;
    return allUnits.filter(u => u.condominiumId === condominiumFilter);
  }, [overviewData?.filters.units, condominiumFilter]);

  // Get available units - fresh data for selection, only when dialog open
  const { data: availableUnitsResponse } = useQuery<{ data: ExternalUnit[], total: number }>({
    queryKey: ["/api/external-units", "available-for-dialog"],
    queryFn: async () => {
      const response = await fetch("/api/external-units?status=available&limit=1000", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch available units");
      return response.json();
    },
    enabled: selectUnitDialogOpen,
    staleTime: 0,
  });
  const availableUnits = availableUnitsResponse?.data;

  // Auto-switch view mode on genuine breakpoint transitions (only if no manual override)
  useEffect(() => {
    // Only act on actual breakpoint transitions (not every isMobile change)
    if (isMobile !== prevIsMobile) {
      setPrevIsMobile(isMobile);
      
      if (!manualViewModeOverride) {
        const preferredMode = isMobile ? "cards" : "table";
        setViewMode(preferredMode);
      }
    }
  }, [isMobile, prevIsMobile, manualViewModeOverride]);
  
  // Reset to first page when switching view modes
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);


  // Reset unit filter when units change and selected unit is no longer available
  useEffect(() => {
    if (unitFilter && units) {
      const unitExists = units.some(unit => unit.id === unitFilter);
      if (!unitExists) {
        setUnitFilter("");
      }
    }
  }, [units, unitFilter]);

  // Reset page to 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Cancel rental contract mutation
  const cancelMutation = useMutation({
    mutationFn: async (contractId: string) => {
      return await apiRequest("PATCH", `/api/external-rental-contracts/${contractId}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/rentals/overview"] });
      setCancelDialogOpen(false);
      setContractToCancel(null);
      toast({
        title: language === "es" ? "Renta cancelada" : "Rental cancelled",
        description: language === "es" 
          ? "El contrato ha sido cancelado y movido a completados" 
          : "Contract has been cancelled and moved to completed",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "Error al cancelar la renta" : "Error cancelling rental"),
        variant: "destructive",
      });
    },
  });

  // Portal tokens query - includes agencyId for admin/master users
  const { data: portalTokens = [], isLoading: isLoadingPortalTokens } = useQuery<PortalToken[]>({
    queryKey: ["/api/external/portal-tokens", portalRoleFilter, portalStatusFilter, selectedAgencyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (portalRoleFilter !== "all") params.append("role", portalRoleFilter);
      if (portalStatusFilter !== "all") params.append("status", portalStatusFilter);
      if (selectedAgencyId) params.append("agencyId", selectedAgencyId);
      const response = await fetch(`/api/external/portal-tokens?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch tokens");
      return response.json();
    },
    enabled: activeTab === 'portal' && (!isAdminOrMaster || !!selectedAgencyId),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const response = await apiRequest("POST", `/api/external/portal-tokens/${tokenId}/reset-password`);
      return response.json();
    },
    onSuccess: (data) => {
      setNewCredentials({ accessCode: data.accessCode, password: data.password });
      toast({
        title: language === "es" ? "Contraseña restablecida" : "Password reset",
        description: language === "es" ? "La nueva contraseña se muestra a continuación" : "The new password is shown below",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/external/portal-tokens"] });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "No se pudo restablecer la contraseña" : "Could not reset password",
        variant: "destructive",
      });
    },
  });

  const revokeTokenMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      await apiRequest("DELETE", `/api/external/portal-tokens/${tokenId}`);
    },
    onSuccess: () => {
      setRevokeDialogOpen(false);
      setSelectedToken(null);
      toast({
        title: language === "es" ? "Acceso revocado" : "Access revoked",
        description: language === "es" ? "El token de acceso ha sido desactivado" : "The access token has been deactivated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/external/portal-tokens"] });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "No se pudo revocar el acceso" : "Could not revoke access",
        variant: "destructive",
      });
    },
  });

  const filteredPortalTokens = useMemo(() => {
    if (!portalSearchQuery) return portalTokens;
    const query = portalSearchQuery.toLowerCase();
    return portalTokens.filter(token => 
      token.accessCode.toLowerCase().includes(query) ||
      token.tenantName?.toLowerCase().includes(query) ||
      token.ownerName?.toLowerCase().includes(query) ||
      token.tenantEmail?.toLowerCase().includes(query) ||
      token.ownerEmail?.toLowerCase().includes(query)
    );
  }, [portalTokens, portalSearchQuery]);

  const handleCopyPortalCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPortalCode(code);
    setTimeout(() => setCopiedPortalCode(null), 2000);
  };

  const handleCopyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    setCopiedPassword(password);
    setTimeout(() => setCopiedPassword(null), 2000);
  };

  const handleResetPassword = (token: PortalToken) => {
    setSelectedToken(token);
    setNewCredentials(null);
    setShowPassword(false);
    setResetDialogOpen(true);
  };

  const handleRevokeAccess = (token: PortalToken) => {
    setSelectedToken(token);
    setRevokeDialogOpen(true);
  };

  const confirmResetPassword = () => {
    if (selectedToken) {
      resetPasswordMutation.mutate(selectedToken.id);
    }
  };

  const confirmRevokeAccess = () => {
    if (selectedToken) {
      revokeTokenMutation.mutate(selectedToken.id);
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'revoked': return 'destructive';
      case 'expired': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleBadgeVariant = (role: string): "outline" | "secondary" => {
    return role === 'tenant' ? 'outline' : 'secondary';
  };

  const formatPortalDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd MMM yyyy", { locale: dateLocale });
  };

  const portalActiveFiltersCount = [portalRoleFilter !== "all", portalStatusFilter !== "all"].filter(Boolean).length;

  // Filter rentals
  const filteredRentals = rentals?.filter((rental) => {
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const condoName = rental.condominium?.name?.toLowerCase() || "";
      const unitNumber = rental.unit?.unitNumber?.toLowerCase() || "";
      const tenantName = rental.contract.tenantName?.toLowerCase() || "";
      
      if (!condoName.includes(searchLower) && 
          !unitNumber.includes(searchLower) && 
          !tenantName.includes(searchLower)) {
        return false;
      }
    }
    
    // Filter by condominium ID
    if (condominiumFilter && rental.condominium?.id !== condominiumFilter) {
      return false;
    }
    // Filter by unit ID
    if (unitFilter && rental.unit?.id !== unitFilter) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    // When viewing "all", put completed rentals at the end
    if (statusFilter === "all") {
      const aCompleted = a.contract.status === "completed";
      const bCompleted = b.contract.status === "completed";
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
    }
    return 0;
  }) || [];

  // Paginate rentals (3 rows x 3 cols = 9 cards per page)
  const totalPages = Math.max(1, Math.ceil(filteredRentals.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRentals = filteredRentals.slice(startIndex, endIndex);

  // Pre-render page clamping using useLayoutEffect
  useLayoutEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Clamp page when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredRentals.length, itemsPerPage]);

  // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, condominiumFilter, unitFilter, searchTerm]);
  
  // Clear all filters function
  const clearFilters = () => {
    setStatusFilter(null);
    setCondominiumFilter("");
    setUnitFilter("");
    setSearchTerm("");
    setIsFiltersOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "completed": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "cancelled": return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "pending": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle2 className="h-3 w-3" />;
      case "completed": return <CheckCircle2 className="h-3 w-3" />;
      case "cancelled": return <Ban className="h-3 w-3" />;
      case "pending": return <Clock className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      active: { es: "Activo", en: "Active" },
      completed: { es: "Completado", en: "Completed" },
      cancelled: { es: "Cancelado", en: "Cancelled" },
      pending: { es: "Pendiente", en: "Pending" },
    };
    return labels[status]?.[language] || status;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            {language === "es" ? "Rentas" : "Rentals"}
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            {language === "es" 
              ? "Gestiona contratos de renta y credenciales del portal" 
              : "Manage rental contracts and portal credentials"}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 max-w-md">
            <TabsTrigger value="rentals" className="gap-2" data-testid="tab-rentals">
              <FileText className="h-4 w-4" />
              {language === "es" ? "Rentas" : "Rentals"}
            </TabsTrigger>
            <TabsTrigger value="portal" className="gap-2" data-testid="tab-portal">
              <KeyRound className="h-4 w-4" />
              {language === "es" ? "Portal" : "Portal"}
            </TabsTrigger>
          </TabsList>
          {activeTab === 'rentals' && (
            <Button onClick={() => setWizardOpen(true)} data-testid="button-create-rental" className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              {language === "es" ? "Nueva Renta" : "New Rental"}
            </Button>
          )}
        </div>

        <TabsContent value="rentals" className="mt-6 space-y-6">
          <Separator />

      {/* Statistics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card data-testid="card-stats-total">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Total Rentas" : "Total Rentals"}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stats-total">{stats.total}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-active">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Activos" : "Active"}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-stats-active">
              {stats.active}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-completed">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Completados" : "Completed"}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-stats-completed">
              {stats.completed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "es" ? "Buscar rentas..." : "Search rentals..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            {/* Filter Button with Popover */}
            <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="relative flex-shrink-0"
                  data-testid="button-toggle-filters"
                >
                  <Filter className="h-4 w-4" />
                  {(statusFilter !== null || condominiumFilter || unitFilter) && (
                    <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {[statusFilter !== null, condominiumFilter, unitFilter].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="end">
            <div className="space-y-4">
              <Button variant="outline" className="w-full" onClick={clearFilters}>
                <XCircle className="mr-2 h-4 w-4" />
                {language === "es" ? "Limpiar Filtros" : "Clear Filters"}
              </Button>

              {/* Status Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "es" ? "Estado" : "Status"}
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={statusFilter === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(null)}
                    data-testid="button-filter-all"
                    className="flex-shrink-0"
                  >
                    {language === "es" ? "Todos" : "All"}
                  </Button>
                  <Button
                    variant={statusFilter === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("active")}
                    data-testid="button-filter-active"
                    className="flex-shrink-0"
                  >
                    {language === "es" ? "Activos" : "Active"}
                  </Button>
                  <Button
                    variant={statusFilter === "completed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("completed")}
                    data-testid="button-filter-completed"
                    className="flex-shrink-0"
                  >
                    {language === "es" ? "Completados" : "Completed"}
                  </Button>
                </div>
              </div>

              {/* Condominium Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "es" ? "Condominio" : "Condominium"}
                </label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={condominiumFilter === "" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCondominiumFilter("");
                      setUnitFilter("");
                    }}
                    data-testid="button-filter-condo-all"
                    className="flex-shrink-0"
                  >
                    {language === "es" ? "Todos" : "All"}
                  </Button>
                  {condominiums?.map((condo) => (
                    <Button
                      key={condo.id}
                      variant={condominiumFilter === condo.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCondominiumFilter(condo.id);
                        setUnitFilter("");
                      }}
                      data-testid={`button-filter-condo-${condo.id}`}
                      className="flex-shrink-0"
                    >
                      {condo.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Unit Filter */}
              {condominiumFilter && units && units.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === "es" ? "Unidad" : "Unit"}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={unitFilter === "" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUnitFilter("")}
                      data-testid="button-filter-unit-all"
                      className="flex-shrink-0"
                    >
                      {language === "es" ? "Todas" : "All"}
                    </Button>
                    {units?.map((unit) => (
                      <Button
                        key={unit.id}
                        variant={unitFilter === unit.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUnitFilter(unit.id)}
                        data-testid={`button-filter-unit-${unit.id}`}
                        className="flex-shrink-0"
                      >
                        {unit.unitNumber}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

            {/* View Toggle Buttons - Desktop Only */}
            {!isMobile && (
              <>
                <Button
                  variant={viewMode === "cards" ? "default" : "outline"}
                  size="icon"
                  onClick={() => {
                    setViewMode("cards");
                    setManualViewModeOverride(false);
                  }}
                  className="flex-shrink-0"
                  data-testid="button-view-cards"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={() => {
                    setViewMode("table");
                    setManualViewModeOverride(true);
                  }}
                  className="flex-shrink-0"
                  data-testid="button-view-table"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rentals List */}
      {isLoading ? (
        viewMode === "cards" ? (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive" data-testid="text-error">
              {language === "es" ? "Error al cargar las rentas" : "Error loading rentals"}
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {error instanceof Error && error.message 
                ? error.message 
                : (language === "es" 
                    ? "No se pudieron cargar las rentas. Por favor intenta de nuevo." 
                    : "Could not load rentals. Please try again.")}
            </p>
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={() => refetch()}
                data-testid="button-retry"
              >
                {language === "es" ? "Reintentar" : "Retry"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              {language === "es" 
                ? "Si el problema persiste, contacta a soporte" 
                : "If the problem persists, contact support"}
            </p>
          </CardContent>
        </Card>
      ) : filteredRentals && filteredRentals.length > 0 ? (
        <div className="space-y-4">
          {viewMode === "cards" ? (
            <>
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {paginatedRentals.map(({ contract, unit, condominium, nextPaymentDue, nextPaymentAmount }) => (
              <Card key={contract.id} className="hover-elevate" data-testid={`card-rental-${contract.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate" data-testid={`text-rental-unit-${contract.id}`}>
                          {condominium?.name} - {unit?.unitNumber}
                        </span>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate" data-testid={`text-rental-tenant-${contract.id}`}>
                          {contract.tenantName}
                        </span>
                        {contract.hasPet && (
                          <PawPrint className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" data-testid={`icon-pet-${contract.id}`} />
                        )}
                      </CardDescription>
                    </div>
                    <Badge 
                      className={`flex items-center gap-1 ${getStatusColor(contract.status)}`}
                      data-testid={`badge-rental-status-${contract.id}`}
                    >
                      {getStatusIcon(contract.status)}
                      {getStatusLabel(contract.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {language === "es" ? "Renta Mensual" : "Monthly Rent"}
                        </p>
                        <p className="font-semibold" data-testid={`text-rental-rent-${contract.id}`}>
                          ${parseFloat(contract.monthlyRent).toLocaleString()} {contract.currency}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {language === "es" ? "Duración" : "Duration"}
                        </p>
                        <p className="font-semibold" data-testid={`text-rental-duration-${contract.id}`}>
                          {contract.leaseDurationMonths} {language === "es" ? "meses" : "months"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {language === "es" ? "Inicio" : "Start Date"}
                        </p>
                        <p className="font-semibold text-xs" data-testid={`text-rental-start-${contract.id}`}>
                          {format(new Date(contract.startDate), "dd MMM yyyy", { locale: language === "es" ? es : enUS })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {language === "es" ? "Fin" : "End Date"}
                        </p>
                        <p className="font-semibold text-xs" data-testid={`text-rental-end-${contract.id}`}>
                          {format(new Date(contract.endDate), "dd MMM yyyy", { locale: language === "es" ? es : enUS })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Next Payment Info (from backend) */}
                  {nextPaymentDue && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {language === "es" ? "Próximo pago:" : "Next payment:"}
                        </span>
                        <span className="font-semibold">
                          ${nextPaymentAmount ? parseFloat(nextPaymentAmount).toLocaleString() : '0'} - {format(new Date(nextPaymentDue), "dd/MM/yyyy")}
                        </span>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex flex-wrap gap-2">
                    <Button 
                      asChild 
                      size="sm" 
                      className="flex-1 min-w-[120px]"
                      data-testid={`button-view-rental-${contract.id}`}
                    >
                      <Link href={`/external/contracts/${contract.id}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        {language === "es" ? "Ver Detalles" : "View Details"}
                      </Link>
                    </Button>
                    {unit && (
                      <Button 
                        asChild 
                        variant="outline" 
                        size="sm"
                        className="flex-shrink-0"
                        data-testid={`button-view-unit-${contract.id}`}
                      >
                        <Link href={`/external/units/${unit.id}`}>
                          <Building2 className="h-4 w-4 mr-2" />
                          {language === "es" ? "Unidad" : "Unit"}
                        </Link>
                      </Button>
                    )}
                    {contract.status === 'active' && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="flex-shrink-0"
                        onClick={() => {
                          setContractToCancel(contract.id);
                          setCancelDialogOpen(true);
                        }}
                        data-testid={`button-cancel-rental-${contract.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">{language === "es" ? "Cancelar" : "Cancel"}</span>
                        <span className="sm:hidden">{language === "es" ? "Cancelar" : "Cancel"}</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
            
            {filteredRentals.length > 0 && (
              <ExternalPaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value) => {
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
                language={language}
                testIdPrefix="cards-"
              />
            )}
            </>
          ) : (
            <>
            {filteredRentals.length > 0 && (
              <ExternalPaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value) => {
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
                language={language}
                testIdPrefix=""
              />
            )}

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "es" ? "Condominio" : "Condominium"}</TableHead>
                        <TableHead>{language === "es" ? "Unidad" : "Unit"}</TableHead>
                        <TableHead>{language === "es" ? "Inquilino" : "Tenant"}</TableHead>
                        <TableHead>{language === "es" ? "Renta Mensual" : "Monthly Rent"}</TableHead>
                        <TableHead>{language === "es" ? "Inicio" : "Start Date"}</TableHead>
                        <TableHead>{language === "es" ? "Fin" : "End Date"}</TableHead>
                        <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                        <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRentals.map(({ contract, unit, condominium, activeServices, nextPaymentDue, nextPaymentAmount, nextPaymentService }) => (
                      <TableRow key={contract.id} data-testid={`row-rental-${contract.id}`}>
                        <TableCell data-testid={`cell-condominium-${contract.id}`}>
                          {condominium?.name || "-"}
                        </TableCell>
                        <TableCell data-testid={`cell-unit-${contract.id}`}>
                          {unit?.unitNumber || "-"}
                        </TableCell>
                        <TableCell data-testid={`cell-tenant-${contract.id}`}>
                          {contract.tenantName}
                        </TableCell>
                        <TableCell data-testid={`cell-rent-${contract.id}`}>
                          ${parseFloat(contract.monthlyRent).toLocaleString()} {contract.currency}
                        </TableCell>
                        <TableCell data-testid={`cell-start-${contract.id}`}>
                          {format(new Date(contract.startDate), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell data-testid={`cell-end-${contract.id}`}>
                          {format(new Date(contract.endDate), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`flex items-center gap-1 w-fit ${getStatusColor(contract.status)}`}
                            data-testid={`badge-status-${contract.id}`}
                          >
                            {getStatusIcon(contract.status)}
                            {getStatusLabel(contract.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              asChild 
                              size="sm" 
                              variant="ghost"
                              data-testid={`button-view-details-${contract.id}`}
                            >
                              <Link href={`/external/contracts/${contract.id}`}>
                                <FileText className="h-4 w-4" />
                              </Link>
                            </Button>
                            {contract.status === 'active' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setContractToCancel(contract.id);
                                  setCancelDialogOpen(true);
                                }}
                                data-testid={`button-cancel-${contract.id}`}
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            </>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium" data-testid="text-no-rentals">
              {language === "es" ? "No hay rentas que coincidan con los filtros" : "No rentals match the filters"}
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {language === "es" 
                ? "Intenta ajustar los filtros o crea una nueva renta desde las unidades" 
                : "Try adjusting the filters or create a new rental from units"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent data-testid="dialog-cancel-rental">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Cancelar Renta" : "Cancel Rental"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "¿Estás seguro de que deseas cancelar esta renta? Esta acción cambiará el estado a completado y eliminará todos los pagos futuros pendientes." 
                : "Are you sure you want to cancel this rental? This action will change the status to completed and delete all pending future payments."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCancelDialogOpen(false)}
              data-testid="button-cancel-dialog-no"
            >
              {language === "es" ? "No, Mantener" : "No, Keep"}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (contractToCancel) {
                  cancelMutation.mutate(contractToCancel);
                }
              }}
              disabled={cancelMutation.isPending}
              data-testid="button-cancel-dialog-yes"
            >
              {cancelMutation.isPending 
                ? (language === "es" ? "Cancelando..." : "Cancelling...") 
                : (language === "es" ? "Sí, Cancelar Renta" : "Yes, Cancel Rental")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="portal" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2" data-testid="text-portal-title">
                    <KeyRound className="h-5 w-5" />
                    {language === "es" ? "Credenciales del Portal" : "Portal Credentials"}
                  </CardTitle>
                  <CardDescription data-testid="text-portal-description">
                    {language === "es" 
                      ? "Gestiona las credenciales de acceso al portal de inquilinos y propietarios" 
                      : "Manage access credentials for tenant and owner portals"}
                  </CardDescription>
                </div>
                {isAdminOrMaster && agencies && agencies.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground whitespace-nowrap">
                      {language === "es" ? "Agencia:" : "Agency:"}
                    </label>
                    <Select
                      value={selectedAgencyId}
                      onValueChange={setSelectedAgencyId}
                    >
                      <SelectTrigger className="w-[200px]" data-testid="select-portal-agency">
                        <SelectValue placeholder={language === "es" ? "Seleccionar agencia" : "Select agency"} />
                      </SelectTrigger>
                      <SelectContent>
                        {agencies.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id}>
                            {agency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === "es" ? "Buscar por código, nombre o email..." : "Search by code, name or email..."}
                    value={portalSearchQuery}
                    onChange={(e) => setPortalSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-portal-search"
                  />
                </div>
                <Popover open={showPortalFilters} onOpenChange={setShowPortalFilters}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2" data-testid="button-portal-filters">
                      <Filter className="h-4 w-4" />
                      {language === "es" ? "Filtros" : "Filters"}
                      {portalActiveFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-1">{portalActiveFiltersCount}</Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {language === "es" ? "Rol" : "Role"}
                        </label>
                        <Select value={portalRoleFilter} onValueChange={setPortalRoleFilter}>
                          <SelectTrigger data-testid="select-portal-role-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                            <SelectItem value="tenant">{language === "es" ? "Inquilino" : "Tenant"}</SelectItem>
                            <SelectItem value="owner">{language === "es" ? "Propietario" : "Owner"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {language === "es" ? "Estado" : "Status"}
                        </label>
                        <Select value={portalStatusFilter} onValueChange={setPortalStatusFilter}>
                          <SelectTrigger data-testid="select-portal-status-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                            <SelectItem value="active">{language === "es" ? "Activo" : "Active"}</SelectItem>
                            <SelectItem value="revoked">{language === "es" ? "Revocado" : "Revoked"}</SelectItem>
                            <SelectItem value="expired">{language === "es" ? "Expirado" : "Expired"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {portalActiveFiltersCount > 0 && (
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            setPortalRoleFilter("all");
                            setPortalStatusFilter("all");
                          }}
                          data-testid="button-clear-portal-filters"
                        >
                          {language === "es" ? "Limpiar filtros" : "Clear filters"}
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {isLoadingPortalTokens ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredPortalTokens.length === 0 ? (
                <div className="text-center py-12">
                  <KeyRound className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2" data-testid="text-portal-empty-state">
                    {language === "es" ? "No hay credenciales" : "No credentials"}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === "es" 
                      ? "Las credenciales se crean automáticamente cuando generas acceso al portal desde un contrato de renta activo."
                      : "Credentials are created automatically when you generate portal access from an active rental contract."}
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "es" ? "Código de Acceso" : "Access Code"}</TableHead>
                        <TableHead>{language === "es" ? "Rol" : "Role"}</TableHead>
                        <TableHead>{language === "es" ? "Usuario" : "User"}</TableHead>
                        <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                        <TableHead>{language === "es" ? "Último Uso" : "Last Used"}</TableHead>
                        <TableHead>{language === "es" ? "Vence" : "Expires"}</TableHead>
                        <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPortalTokens.map((token) => (
                        <TableRow key={token.id} data-testid={`row-portal-token-${token.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="bg-muted px-2 py-1 rounded text-sm font-mono" data-testid={`text-portal-access-code-${token.id}`}>
                                {token.accessCode}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleCopyPortalCode(token.accessCode)}
                                data-testid={`button-copy-portal-code-${token.id}`}
                              >
                                {copiedPortalCode === token.accessCode ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(token.role)} data-testid={`badge-portal-role-${token.id}`}>
                              {PORTAL_ROLE_LABELS[language][token.role]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium" data-testid={`text-portal-user-name-${token.id}`}>
                                {token.role === 'tenant' ? token.tenantName : token.ownerName}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {token.role === 'tenant' ? token.tenantEmail : token.ownerEmail}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(token.status)} data-testid={`badge-portal-status-${token.id}`}>
                              {PORTAL_STATUS_LABELS[language][token.status]}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-portal-last-used-${token.id}`}>
                            {token.lastUsedAt ? formatPortalDate(token.lastUsedAt) : "-"}
                            {token.usageCount > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({token.usageCount}x)
                              </span>
                            )}
                          </TableCell>
                          <TableCell data-testid={`text-portal-expires-${token.id}`}>
                            {formatPortalDate(token.expiresAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {token.status === 'active' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleResetPassword(token)}
                                    title={language === "es" ? "Restablecer contraseña" : "Reset password"}
                                    data-testid={`button-reset-password-${token.id}`}
                                  >
                                    <RotateCw className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRevokeAccess(token)}
                                    title={language === "es" ? "Revocar acceso" : "Revoke access"}
                                    data-testid={`button-revoke-portal-${token.id}`}
                                  >
                                    <Ban className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Select Unit Dialog for New Rental */}
      <Dialog open={selectUnitDialogOpen} onOpenChange={setSelectUnitDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-select-unit">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              {language === "es" ? "Seleccionar Unidad" : "Select Unit"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Selecciona una unidad disponible para generar una nueva renta activa" 
                : "Select an available unit to generate a new active rental"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!availableUnits ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : availableUnits.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {language === "es" 
                      ? "No hay unidades disponibles en este momento" 
                      : "No units available at this time"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableUnits.map(unit => {
                  const condo = condominiums?.find(c => c.id === unit.condominiumId);
                  return (
                    <Card 
                      key={unit.id} 
                      className="hover-elevate cursor-pointer transition-all"
                      onClick={() => {
                        setSelectUnitDialogOpen(false);
                        setLocation(`/external/units/${unit.id}`);
                      }}
                      data-testid={`unit-option-${unit.id}`}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <CardTitle className="text-base">{unit.unitNumber}</CardTitle>
                            <CardDescription className="text-sm">
                              {condo?.name || unit.condominiumId}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                          {language === "es" ? "Disponible" : "Available"}
                        </Badge>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectUnitDialogOpen(false)}
              data-testid="button-close-select-unit"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rental Wizard - Lazy loaded */}
      {wizardOpen && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>}>
          <RentalWizard open={wizardOpen} onOpenChange={setWizardOpen} />
        </Suspense>
      )}

      {/* Portal Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setResetDialogOpen(false);
          setNewCredentials(null);
          setSelectedToken(null);
          setShowPassword(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Restablecer Contraseña" : "Reset Password"}
            </DialogTitle>
            <DialogDescription>
              {newCredentials 
                ? (language === "es" 
                    ? "La contraseña ha sido restablecida. Copia las nuevas credenciales:" 
                    : "The password has been reset. Copy the new credentials:")
                : (language === "es" 
                    ? "¿Estás seguro de que deseas restablecer la contraseña para este acceso?" 
                    : "Are you sure you want to reset the password for this access?")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedToken && !newCredentials && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {selectedToken.role === 'tenant' ? selectedToken.tenantName : selectedToken.ownerName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {PORTAL_ROLE_LABELS[language][selectedToken.role]} - {selectedToken.accessCode}
                  </p>
                </div>
              </div>
            </div>
          )}

          {newCredentials && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "es" ? "Código de Acceso" : "Access Code"}
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-sm">
                    {newCredentials.accessCode}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyPortalCode(newCredentials.accessCode)}
                  >
                    {copiedPortalCode === newCredentials.accessCode ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "es" ? "Nueva Contraseña" : "New Password"}
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-sm">
                    {showPassword ? newCredentials.password : "••••••••••••"}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyPassword(newCredentials.password)}
                  >
                    {copiedPassword === newCredentials.password ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {language === "es" 
                  ? "Guarda estas credenciales. No podrás ver la contraseña nuevamente."
                  : "Save these credentials. You won't be able to see the password again."}
              </p>
            </div>
          )}

          <DialogFooter>
            {!newCredentials ? (
              <>
                <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button 
                  onClick={confirmResetPassword}
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {language === "es" ? "Restablecer" : "Reset"}
                </Button>
              </>
            ) : (
              <Button onClick={() => {
                setResetDialogOpen(false);
                setNewCredentials(null);
                setSelectedToken(null);
                setShowPassword(false);
              }}>
                {language === "es" ? "Cerrar" : "Close"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Portal Revoke Access Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "es" ? "Revocar Acceso" : "Revoke Access"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es" 
                ? "¿Estás seguro de que deseas revocar este acceso al portal? El usuario ya no podrá iniciar sesión."
                : "Are you sure you want to revoke this portal access? The user will no longer be able to log in."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedToken && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {selectedToken.role === 'tenant' ? selectedToken.tenantName : selectedToken.ownerName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {PORTAL_ROLE_LABELS[language][selectedToken.role]} - {selectedToken.accessCode}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "es" ? "Cancelar" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevokeAccess}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={revokeTokenMutation.isPending}
            >
              {revokeTokenMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "es" ? "Revocar" : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
