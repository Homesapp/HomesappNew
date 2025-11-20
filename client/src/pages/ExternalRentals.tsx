import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import RentalWizard from "@/components/RentalWizard";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
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
  LayoutGrid,
  Table as TableIcon,
  XCircle,
  Check,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  PawPrint,
  Zap,
  Droplet,
  Wifi,
  Flame,
  Wrench
} from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { ExternalRentalContract, ExternalUnit, ExternalCondominium } from "@shared/schema";

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

export default function ExternalRentals() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [condominiumFilter, setCondominiumFilter] = useState<string>("");
  const [unitFilter, setUnitFilter] = useState<string>("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [contractToCancel, setContractToCancel] = useState<string | null>(null);
  const [condoComboOpen, setCondoComboOpen] = useState(false);
  const [unitComboOpen, setUnitComboOpen] = useState(false);
  const [selectUnitDialogOpen, setSelectUnitDialogOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [serviceIndices, setServiceIndices] = useState<Record<string, number>>({});

  const { data: rentals, isLoading, isError, error, refetch } = useQuery<RentalWithDetails[]>({
    queryKey: statusFilter 
      ? [`/api/external-rental-contracts?status=${statusFilter}`]
      : ["/api/external-rental-contracts"],
  });

  // Get condominiums for filter dropdown
  const { data: condominiums } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/external-condominiums-for-filters"],
  });

  // Get units for filter dropdown (optionally filtered by condominium)
  const { data: units } = useQuery<Array<{ id: string; unitNumber: string; condominiumId: string }>>({
    queryKey: ["/api/external-units-for-filters", condominiumFilter],
    queryFn: async () => {
      const url = condominiumFilter 
        ? `/api/external-units-for-filters?condominiumId=${condominiumFilter}`
        : "/api/external-units-for-filters";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch units");
      return response.json();
    },
  });

  // Get available units (without active contracts) for rental creation
  const { data: availableUnits } = useQuery<ExternalUnit[]>({
    queryKey: ["/api/external-units", "available"],
    queryFn: async () => {
      const response = await fetch("/api/external-units?status=available", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch available units");
      return response.json();
    },
    enabled: selectUnitDialogOpen, // Only fetch when dialog is open
  });

  // Fetch all payments to show status indicators
  const { data: payments = [] } = useQuery<Array<{
    id: string;
    contractId: string;
    serviceType: string;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    dueDate: string;
    amount: string;
  }>>({
    queryKey: ["/api/external-payments"],
  });

  // Reset unit filter when units change and selected unit is no longer available
  useEffect(() => {
    if (unitFilter && units) {
      const unitExists = units.some(unit => unit.id === unitFilter);
      if (!unitExists) {
        setUnitFilter("");
      }
    }
  }, [units, unitFilter]);

  // Cancel rental contract mutation
  const cancelMutation = useMutation({
    mutationFn: async (contractId: string) => {
      return await apiRequest("PATCH", `/api/external-rental-contracts/${contractId}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-rental-contracts"] });
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

  // Filter rentals
  const filteredRentals = rentals?.filter((rental) => {
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
  });

  // Helper to get current month payment status for a service
  const getNextPaymentStatus = (contractId: string, serviceType: string, dayOfMonth: number): 'paid' | 'pending' | 'overdue' | null => {
    if (!payments || payments.length === 0) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Find all payments for this contract and service
    const servicePayments = payments.filter(p => 
      p.contractId === contractId && p.serviceType === serviceType
    );
    
    if (servicePayments.length === 0) {
      // No payments exist - check if we're past this month's due date
      const thisDueDate = new Date(currentYear, currentMonth, dayOfMonth);
      thisDueDate.setHours(0, 0, 0, 0);
      return today > thisDueDate ? 'overdue' : 'pending';
    }
    
    // Look for current month's payment first
    const currentMonthPayment = servicePayments.find(p => {
      const dueDate = new Date(p.dueDate);
      return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
    });
    
    if (currentMonthPayment) {
      // Found current month's payment - return its status
      return currentMonthPayment.status === 'cancelled' ? 'overdue' : currentMonthPayment.status;
    }
    
    // No current month payment - check if we should have one by now
    const thisDueDate = new Date(currentYear, currentMonth, dayOfMonth);
    thisDueDate.setHours(0, 0, 0, 0);
    
    if (today > thisDueDate) {
      // We're past the due date and no payment exists
      return 'overdue';
    }
    
    // Check if there's a future payment (next month)
    const futurePayment = servicePayments.find(p => {
      const dueDate = new Date(p.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate > today;
    });
    
    return futurePayment?.status === 'paid' ? 'paid' : 'pending';
  };

  const getServiceLabel = (serviceType: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      rent: { es: "Renta", en: "Rent" },
      electricity: { es: "Electricidad", en: "Electricity" },
      water: { es: "Agua", en: "Water" },
      internet: { es: "Internet", en: "Internet" },
      gas: { es: "Gas", en: "Gas" },
      maintenance: { es: "Mantenimiento", en: "Maintenance" },
      other: { es: "Otro", en: "Other" },
    };
    return labels[serviceType]?.[language] || serviceType;
  };

  const getServiceIcon = (serviceType: string) => {
    const iconClass = "h-4 w-4";
    switch (serviceType) {
      case "rent": return <Home className={iconClass} />;
      case "electricity": return <Zap className={iconClass} />;
      case "water": return <Droplet className={iconClass} />;
      case "internet": return <Wifi className={iconClass} />;
      case "gas": return <Flame className={iconClass} />;
      case "maintenance": return <Wrench className={iconClass} />;
      default: return <DollarSign className={iconClass} />;
    }
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

  // Calculate statistics
  const stats = rentals ? {
    total: rentals.length,
    active: rentals.filter(r => r.contract.status === "active").length,
    completed: rentals.filter(r => r.contract.status === "completed").length,
    suspended: rentals.filter(r => r.contract.status === "suspended").length,
  } : { total: 0, active: 0, completed: 0, suspended: 0 };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            {language === "es" ? "Rentas Activas" : "Active Rentals"}
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            {language === "es" 
              ? "Administra todos los contratos de renta y sus pagos" 
              : "Manage all rental contracts and payments"}
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)} data-testid="button-create-rental">
          <Home className="h-4 w-4 mr-2" />
          {language === "es" ? "Nueva Renta" : "New Rental"}
        </Button>
      </div>

      <Separator />

      {/* Statistics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* View Toggle and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
              data-testid="button-view-cards"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              {language === "es" ? "Cards" : "Cards"}
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              data-testid="button-view-table"
            >
              <TableIcon className="h-4 w-4 mr-2" />
              {language === "es" ? "Tabla" : "Table"}
            </Button>
          </div>

          {/* Status Filters */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(null)}
              data-testid="button-filter-all"
            >
              {language === "es" ? "Todos" : "All"}
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
              data-testid="button-filter-active"
            >
              {language === "es" ? "Activos" : "Active"}
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("completed")}
              data-testid="button-filter-completed"
            >
              {language === "es" ? "Completados" : "Completed"}
            </Button>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Popover open={condoComboOpen} onOpenChange={setCondoComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={condoComboOpen}
                  className="w-full justify-between"
                  data-testid="button-filter-condominium"
                >
                  {condominiumFilter
                    ? condominiums?.find((c) => c.id === condominiumFilter)?.name
                    : (language === "es" ? "Todos los condominios" : "All condominiums")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder={language === "es" ? "Buscar condominio..." : "Search condominium..."} />
                  <CommandEmpty>{language === "es" ? "No se encontró" : "Not found"}</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setCondominiumFilter("");
                        setUnitFilter("");
                        setCondoComboOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          condominiumFilter === "" ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {language === "es" ? "Todos los condominios" : "All condominiums"}
                    </CommandItem>
                    {condominiums?.map((condo) => (
                      <CommandItem
                        key={condo.id}
                        value={condo.name}
                        onSelect={() => {
                          setCondominiumFilter(condo.id);
                          setUnitFilter("");
                          setCondoComboOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            condominiumFilter === condo.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {condo.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Popover open={unitComboOpen} onOpenChange={setUnitComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={unitComboOpen}
                  className="w-full justify-between"
                  data-testid="button-filter-unit"
                >
                  {unitFilter
                    ? units?.find((u) => u.id === unitFilter)?.unitNumber
                    : (language === "es" ? "Todas las unidades" : "All units")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder={language === "es" ? "Buscar unidad..." : "Search unit..."} />
                  <CommandEmpty>{language === "es" ? "No se encontró" : "Not found"}</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setUnitFilter("");
                        setUnitComboOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          unitFilter === "" ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {language === "es" ? "Todas las unidades" : "All units"}
                    </CommandItem>
                    {units?.map((unit) => (
                      <CommandItem
                        key={unit.id}
                        value={unit.unitNumber}
                        onSelect={() => {
                          setUnitFilter(unit.id);
                          setUnitComboOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            unitFilter === unit.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {unit.unitNumber}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

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
        viewMode === "cards" ? (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {filteredRentals.map(({ contract, unit, condominium, activeServices, nextPaymentDue, nextPaymentAmount, nextPaymentService }) => {
              // Sort services so rent always appears first
              const sortedServices = activeServices ? [...activeServices].sort((a, b) => {
                if (a.serviceType === 'rent') return -1;
                if (b.serviceType === 'rent') return 1;
                if (a.serviceType === 'electricity' && b.serviceType !== 'rent') return -1;
                if (b.serviceType === 'electricity' && a.serviceType !== 'rent') return 1;
                return 0;
              }) : [];
              
              // Pagination for services
              const serviceStartIndex = serviceIndices[contract.id] || 0;
              const servicesPerPage = 3;
              const totalServices = sortedServices.length;
              const displayedServices = sortedServices.slice(serviceStartIndex, serviceStartIndex + servicesPerPage);
              const canScrollLeft = serviceStartIndex > 0;
              const canScrollRight = serviceStartIndex + servicesPerPage < totalServices;
              
              const handleScrollLeft = () => {
                setServiceIndices(prev => ({
                  ...prev,
                  [contract.id]: Math.max(0, serviceStartIndex - 1)
                }));
              };
              
              const handleScrollRight = () => {
                setServiceIndices(prev => ({
                  ...prev,
                  [contract.id]: Math.min(totalServices - servicesPerPage, serviceStartIndex + 1)
                }));
              };
              
              return (
              <Card key={contract.id} className="hover-elevate" data-testid={`card-rental-${contract.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Home className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
                          <PawPrint 
                            className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" 
                            data-testid={`icon-pet-${contract.id}`}
                            title={contract.petName || (language === "es" ? "Tiene mascota" : "Has pet")}
                          />
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

                  {/* Services with Payment Dates */}
                  {sortedServices && sortedServices.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {language === "es" ? "Servicios y próximas fechas de pago:" : "Services and next payment dates:"}
                          </p>
                          {totalServices > servicesPerPage && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={handleScrollLeft}
                                disabled={!canScrollLeft}
                                data-testid={`button-services-left-${contract.id}`}
                              >
                                <ChevronUp className="h-3 w-3 rotate-[-90deg]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={handleScrollRight}
                                disabled={!canScrollRight}
                                data-testid={`button-services-right-${contract.id}`}
                              >
                                <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 overflow-hidden">
                          {displayedServices.map((service, idx) => {
                            const parsedAmount = service.amount ? parseFloat(service.amount) : NaN;
                            const hasValidAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
                            const paymentStatus = getNextPaymentStatus(contract.id, service.serviceType, service.dayOfMonth);
                            
                            // Determine background colors based on payment status
                            // Paid = green, Pending/Overdue = red (unpaid obligations)
                            const statusColors = paymentStatus === 'paid' 
                              ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300'
                              : (paymentStatus === 'pending' || paymentStatus === 'overdue')
                              ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300'
                              : 'bg-muted border-muted-foreground/20 text-muted-foreground';
                            
                            return (
                              <div 
                                key={serviceStartIndex + idx}
                                className={cn(
                                  "flex flex-col items-center justify-center gap-1 p-2 border rounded-md flex-1 min-w-[90px] transition-colors",
                                  statusColors
                                )}
                                data-testid={`service-item-${contract.id}-${serviceStartIndex + idx}`}
                              >
                                <div className="flex items-center gap-1">
                                  {getServiceIcon(service.serviceType)}
                                  <span className="text-xs font-medium">
                                    {getServiceLabel(service.serviceType)}
                                  </span>
                                </div>
                                {hasValidAmount && (
                                  <span className="text-xs font-bold">
                                    ${parsedAmount.toLocaleString()}
                                  </span>
                                )}
                                <span className="text-xs opacity-70">
                                  {language === "es" ? "Día" : "Day"} {service.dayOfMonth}
                                </span>
                              </div>
                            );
                          })}
                        </div>
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
              );
            })}
          </div>
        ) : (
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
                    {filteredRentals.map(({ contract, unit, condominium, activeServices, nextPaymentDue, nextPaymentAmount, nextPaymentService }) => (
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
        )
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

      {/* Rental Wizard */}
      <RentalWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
