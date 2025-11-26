import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableLoading } from "@/components/ui/table-loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Building2,
  Home,
  Search,
  Download,
  Mail,
  Phone,
  LayoutGrid,
  Table as TableIcon,
  Plus,
  Edit,
  Filter,
  X,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobile } from "@/hooks/use-mobile";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";
import type { 
  ExternalUnitOwner, 
  ExternalRentalContract,
  ExternalFinancialTransaction,
} from "@shared/schema";
import { format } from "date-fns";

// Lightweight unit type for this component
interface LightweightUnit {
  id: string;
  unitNumber: string;
  condominiumId: string;
  typology?: string | null;
}

interface OwnerPortfolio {
  owner: ExternalUnitOwner;
  units: LightweightUnit[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  activeContracts: number;
  occupancyRate: number;
  typologies: string[];
  condominiums: string[];
  unitNumbers: string[];
}

// Form validation schema
const ownerFormSchema = z.object({
  ownerName: z.string().min(1, "El nombre es requerido"),
  ownerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  ownerPhone: z.string().optional(),
  unitId: z.string().min(1, "Debe seleccionar una unidad"),
});

type OwnerFormValues = z.infer<typeof ownerFormSchema>;

// Helper function to format and translate typology names
function formatTypology(typology: string, lang: 'es' | 'en'): string {
  if (!typology || typology === '-') return '-';
  
  // Format: replace underscores with spaces and capitalize first letter of each word
  const formatted = typology
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Translate to English if needed
  if (lang === 'en') {
    const translations: Record<string, string> = {
      'Estudio': 'Studio',
      '1 Recamara': '1 Bedroom',
      '2 Recamaras': '2 Bedrooms',
      '3 Recamaras': '3 Bedrooms',
      '4 Recamaras': '4 Bedrooms',
      'Penthouse': 'Penthouse',
      'Loft': 'Loft',
    };
    return translations[formatted] || formatted;
  }
  
  return formatted;
}

export default function ExternalOwnerPortfolio() {
  const { language } = useLanguage();
  const isMobile = useMobile();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [manualViewModeOverride, setManualViewModeOverride] = useState(false);
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOwner, setEditingOwner] = useState<ExternalUnitOwner | null>(null);
  const [formCondominiumId, setFormCondominiumId] = useState<string>("");
  const [unitSearchTerm, setUnitSearchTerm] = useState<string>("");
  const [originalGroupingKey, setOriginalGroupingKey] = useState<string | null>(null);
  const [minUnits, setMinUnits] = useState<number>(0);
  const [minOccupancy, setMinOccupancy] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCondominium, setSelectedCondominium] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  
  // Pagination for main owners table
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Pagination and sorting for units detail table
  const [unitsPage, setUnitsPage] = useState(1);
  const [unitsPerPage, setUnitsPerPage] = useState(10);
  const [unitsSortBy, setUnitsSortBy] = useState<'condominium' | 'unitNumber'>('condominium');
  const [unitsSortOrder, setUnitsSortOrder] = useState<'asc' | 'desc'>('asc');

  // Auto-switch view mode on genuine breakpoint transitions (only if no manual override)
  useEffect(() => {
    // Only act on actual breakpoint transitions (not every isMobile change)
    if (isMobile !== prevIsMobile) {
      setPrevIsMobile(isMobile);
      
      if (!manualViewModeOverride) {
        const preferredMode = isMobile ? "cards" : "table";
        setViewMode(preferredMode);
        setItemsPerPage(10);
      }
    }
  }, [isMobile, prevIsMobile, manualViewModeOverride]);

  // Reset itemsPerPage when view mode changes
  useEffect(() => {
    setItemsPerPage(10);
    setPage(1);
  }, [viewMode]);

  // Portfolio summary with server-side aggregation (main data source)
  const {
    data: portfolioResponse,
    isLoading: portfoliosLoading,
    isFetching: portfoliosFetching,
    isError: portfoliosError,
    error: portfoliosErrorDetails,
  } = useQuery<{
    data: OwnerPortfolio[];
    total: number;
    page: number;
    pageSize: number;
  }>({
    queryKey: ['/api/external/portfolio-summary', selectedCondominium, minUnits],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCondominium) params.set('condominiumId', selectedCondominium);
      if (minUnits > 0) params.set('minUnits', String(minUnits));
      params.set('limit', '500');
      const res = await fetch(`/api/external/portfolio-summary?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch portfolios');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Lightweight condominiums for dropdowns
  const { 
    data: condominiums,
    isLoading: condominiumsLoading,
  } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['/api/external-condominiums-for-filters'],
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });

  // Lightweight units for dropdowns (still needed for create owner form)
  const { 
    data: units, 
    isLoading: unitsLoading,
  } = useQuery<LightweightUnit[]>({
    queryKey: ['/api/external-units-for-filters'],
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });


  // Owner form
  const form = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerFormSchema),
    defaultValues: {
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      unitId: "",
    },
  });

  // Create owner mutation
  const createOwnerMutation = useMutation({
    mutationFn: async (data: OwnerFormValues) => {
      return await apiRequest("POST", "/api/external-unit-owners", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/portfolio-summary'] });
      toast({
        title: language === 'es' ? "Propietario creado" : "Owner created",
        description: language === 'es' 
          ? "El propietario se ha creado exitosamente" 
          : "The owner has been created successfully",
      });
      setOpenDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      let errorMessage = language === 'es' 
        ? "No se pudo crear el propietario" 
        : "Could not create owner";
      
      // Try to extract backend error message
      if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: language === 'es' ? "Error" : "Error",
        description: errorMessage,
      });
      console.error("Create owner error:", error);
    },
  });

  // Update owner mutation - updates ALL records with same grouping key
  const updateOwnerMutation = useMutation({
    mutationFn: async (data: OwnerFormValues & { originalKey: string }) => {
      const { originalKey, ...updateData } = data;
      
      // Find the portfolio with the matching grouping key
      const matchingPortfolio = (portfolioResponse?.data || []).find(p => {
        const key = `${p.owner.ownerName.toLowerCase()}_${p.owner.ownerEmail?.toLowerCase() || ''}`;
        return key === originalKey;
      });
      
      if (!matchingPortfolio) {
        throw new Error('Owner not found');
      }
      
      // Update the owner record
      return await apiRequest("PATCH", `/api/external-unit-owners/${matchingPortfolio.owner.id}`, {
        ownerName: updateData.ownerName,
        ownerEmail: updateData.ownerEmail,
        ownerPhone: updateData.ownerPhone,
        unitId: matchingPortfolio.owner.unitId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/portfolio-summary'] });
      toast({
        title: language === 'es' ? "Propietario actualizado" : "Owner updated",
        description: language === 'es' 
          ? "El propietario se ha actualizado exitosamente en todas sus unidades" 
          : "The owner has been updated successfully across all units",
      });
      setOpenDialog(false);
      setEditingOwner(null);
      setOriginalGroupingKey(null);
      form.reset();
    },
    onError: (error: any) => {
      let errorMessage = language === 'es' 
        ? "No se pudo actualizar el propietario" 
        : "Could not update owner";
      
      // Try to extract backend error message
      if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: language === 'es' ? "Error" : "Error",
        description: errorMessage,
      });
      console.error("Update owner error:", error);
    },
  });

  // Handle form submission
  const onSubmit = (data: OwnerFormValues) => {
    // Normalize empty strings to undefined for optional fields
    const normalizedData = {
      ...data,
      ownerEmail: data.ownerEmail?.trim() || undefined,
      ownerPhone: data.ownerPhone?.trim() || undefined,
    };

    if (editingOwner && originalGroupingKey) {
      updateOwnerMutation.mutate({ ...normalizedData, originalKey: originalGroupingKey });
    } else {
      createOwnerMutation.mutate(normalizedData);
    }
  };

  // Handle opening dialog for create or edit
  const handleOpenDialog = (owner?: ExternalUnitOwner) => {
    if (owner) {
      setEditingOwner(owner);
      // Save the original grouping key to update all related records
      const groupingKey = `${owner.ownerName.toLowerCase()}_${owner.ownerEmail?.toLowerCase() || ''}`;
      setOriginalGroupingKey(groupingKey);
      
      form.reset({
        ownerName: owner.ownerName,
        ownerEmail: owner.ownerEmail || "",
        ownerPhone: owner.ownerPhone || "",
        unitId: owner.unitId,
      });
    } else {
      setEditingOwner(null);
      setOriginalGroupingKey(null);
      form.reset({
        ownerName: "",
        ownerEmail: "",
        ownerPhone: "",
        unitId: "",
      });
    }
    setOpenDialog(true);
  };

  // Clear all filters
  const clearFilters = () => {
    setMinUnits(0);
    setMinOccupancy(0);
    setSelectedCondominium(null);
    setSelectedUnit(null);
  };

  // Check if any filters are active
  const hasActiveFilters = minUnits > 0 || minOccupancy > 0 || selectedCondominium !== null || selectedUnit !== null;

  // Build owner portfolios from server-aggregated data
  const portfolios = useMemo(() => {
    return portfolioResponse?.data ?? [];
  }, [portfolioResponse]);


  // Filter and sort portfolios
  const filteredPortfolios = useMemo(() => {
    let filtered = portfolios.filter(p => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        p.owner.ownerName.toLowerCase().includes(searchLower) ||
        p.owner.ownerEmail?.toLowerCase().includes(searchLower) ||
        p.owner.ownerPhone?.includes(searchTerm);
      
      if (!matchesSearch) return false;

      // Units filter
      if (minUnits > 0 && p.units.length < minUnits) return false;

      // Occupancy filter
      if (minOccupancy > 0 && p.occupancyRate < minOccupancy) return false;

      // Condominium filter
      if (selectedCondominium) {
        const hasCondoUnit = p.units.some(u => u.condominiumId === selectedCondominium);
        if (!hasCondoUnit) return false;
      }

      // Unit filter
      if (selectedUnit) {
        const hasUnit = p.units.some(u => u.id === selectedUnit);
        if (!hasUnit) return false;
      }

      return true;
    });

    // Sort by name (alphabetical, ascending)
    filtered.sort((a, b) => a.owner.ownerName.localeCompare(b.owner.ownerName));

    return filtered;
  }, [portfolios, searchTerm, minUnits, minOccupancy, selectedCondominium, selectedUnit]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalOwners: filteredPortfolios.length,
      totalUnits: filteredPortfolios.reduce((sum, p) => sum + p.units.length, 0),
      avgOccupancy: filteredPortfolios.length > 0 
        ? filteredPortfolios.reduce((sum, p) => sum + p.occupancyRate, 0) / filteredPortfolios.length 
        : 0,
    };
  }, [filteredPortfolios]);

  const selectedPortfolio = selectedOwnerId 
    ? filteredPortfolios.find(p => p.owner.id === selectedOwnerId)
    : null;

  // Reset pagination when owner changes
  useEffect(() => {
    setUnitsPage(1);
  }, [selectedOwnerId]);

  // Reset main table page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Clamp main table page when items per page changes or filtered results change
  useEffect(() => {
    const totalPages = Math.ceil(filteredPortfolios.length / itemsPerPage);
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [filteredPortfolios.length, itemsPerPage, page]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCondoName = (unitId: string) => {
    const unit = units?.find(u => u.id === unitId);
    if (!unit) return '-';
    const condo = condominiums?.find(c => c.id === unit.condominiumId);
    return condo?.name || '-';
  };

  const exportToCSV = () => {
    const headers = [
      'Propietario',
      'Email',
      'Teléfono',
      'Unidades',
      'Ocupación %',
    ].join(',');

    const rows = filteredPortfolios.map(p => [
      p.owner.ownerName,
      p.owner.ownerEmail || '',
      p.owner.ownerPhone || '',
      p.units.length,
      p.occupancyRate.toFixed(1),
    ].join(','));

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `propietarios_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const t = language === 'es' ? {
    title: 'Portafolio de Propietarios',
    subtitle: 'Vista consolidada de propietarios y rendimiento de sus unidades',
    search: 'Buscar por nombre, email o teléfono...',
    export: 'Exportar CSV',
    sortBy: 'Ordenar por',
    name: 'Nombre',
    units: 'Unidades',
    income: 'Ingresos',
    balance: 'Balance',
    totalOwners: 'Total Propietarios',
    totalUnits: 'Total Unidades',
    totalIncome: 'Ingresos Totales',
    totalExpenses: 'Gastos Totales',
    totalBalance: 'Balance Total',
    avgOccupancy: 'Ocupación Promedio',
    owner: 'Propietario',
    contact: 'Contacto',
    expenses: 'Gastos',
    occupancy: 'Ocupación',
    actions: 'Acciones',
    viewDetails: 'Ver Detalles',
    noOwners: 'No se encontraron propietarios',
    noOwnersDesc: 'Los propietarios aparecerán aquí cuando se agreguen unidades',
    unitDetails: 'Detalles de Unidades',
    unit: 'Unidad',
    unitNumber: '# de Unidad',
    condominium: 'Condominio',
    status: 'Estado',
    active: 'Activo',
    suspended: 'Suspendido',
    rented: 'Rentado',
    available: 'Disponible',
    close: 'Cerrar',
    itemsPerPage: 'Elementos por página',
    first: 'Primera',
    previous: 'Anterior',
    next: 'Siguiente',
    last: 'Última',
  } : {
    title: 'Owner Portfolio',
    subtitle: 'Consolidated view of owners and their units performance',
    search: 'Search by name, email or phone...',
    export: 'Export CSV',
    sortBy: 'Sort by',
    name: 'Name',
    units: 'Units',
    income: 'Income',
    balance: 'Balance',
    totalOwners: 'Total Owners',
    totalUnits: 'Total Units',
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    totalBalance: 'Total Balance',
    avgOccupancy: 'Avg Occupancy',
    owner: 'Owner',
    contact: 'Contact',
    expenses: 'Expenses',
    occupancy: 'Occupancy',
    actions: 'Actions',
    viewDetails: 'View Details',
    noOwners: 'No owners found',
    noOwnersDesc: 'Owners will appear here when units are added',
    unitDetails: 'Unit Details',
    unit: 'Unit',
    unitNumber: 'Unit #',
    condominium: 'Condominium',
    status: 'Status',
    active: 'Active',
    suspended: 'Suspended',
    rented: 'Rented',
    available: 'Available',
    close: 'Close',
    itemsPerPage: 'Items per page',
    first: 'First',
    previous: 'Previous',
    next: 'Next',
    last: 'Last',
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => handleOpenDialog()} 
            variant="default" 
            data-testid="button-add-owner" 
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            {language === 'es' ? 'Agregar Propietario' : 'Add Owner'}
          </Button>
          <Button onClick={exportToCSV} variant="outline" data-testid="button-export" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            {t.export}
          </Button>
        </div>
      </div>

      {/* Metrics - Always 3 cards in single row */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">{t.totalOwners}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-owners">{totals.totalOwners}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">{t.totalUnits}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-units">{totals.totalUnits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">{t.avgOccupancy}</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-occupancy">
              {totals.avgOccupancy.toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Sort */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input - Always visible */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            {/* Filter Button with Popover - Icon only */}
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="flex-shrink-0 relative"
                  data-testid="button-filters"
                >
                  <Filter className="h-4 w-4" />
                  {hasActiveFilters && (
                    <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {[minUnits > 0, minOccupancy > 0, selectedCondominium !== null, selectedUnit !== null].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">
                      {language === 'es' ? 'Filtrar por' : 'Filter by'}
                    </h4>
                    
                    {/* Min Units Filter */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        {language === 'es' ? 'Unidades mínimas' : 'Minimum units'}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {[0, 1, 2, 3, 5].map((value) => (
                          <Button
                            key={value}
                            variant={minUnits === value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setMinUnits(value)}
                            data-testid={`button-filter-min-units-${value}`}
                          >
                            {value === 0 ? (language === 'es' ? 'Todas' : 'All') : `${value}+`}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Min Occupancy Filter */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        {language === 'es' ? 'Ocupación mínima' : 'Minimum occupancy'}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {[0, 25, 50, 70, 90].map((value) => (
                          <Button
                            key={value}
                            variant={minOccupancy === value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setMinOccupancy(value)}
                            data-testid={`button-filter-min-occupancy-${value}`}
                          >
                            {value === 0 ? (language === 'es' ? 'Todas' : 'All') : `${value}%+`}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Condominium Filter */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        {language === 'es' ? 'Condominio' : 'Condominium'}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={selectedCondominium === null ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCondominium(null)}
                          data-testid="button-filter-condominium-all"
                        >
                          {language === 'es' ? 'Todos' : 'All'}
                        </Button>
                        {condominiums?.map((condo) => (
                          <Button
                            key={condo.id}
                            variant={selectedCondominium === condo.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCondominium(condo.id)}
                            data-testid={`button-filter-condominium-${condo.id}`}
                          >
                            {condo.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Unit Filter */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        {language === 'es' ? 'Unidad' : 'Unit'}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={selectedUnit === null ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedUnit(null)}
                          data-testid="button-filter-unit-all"
                        >
                          {language === 'es' ? 'Todas' : 'All'}
                        </Button>
                        {units
                          ?.filter(u => !selectedCondominium || u.condominiumId === selectedCondominium)
                          ?.map((unit) => (
                          <Button
                            key={unit.id}
                            variant={selectedUnit === unit.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedUnit(unit.id)}
                            data-testid={`button-filter-unit-${unit.id}`}
                          >
                            {unit.unitNumber}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="w-full"
                      data-testid="button-clear-filters"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Limpiar filtros' : 'Clear filters'}
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* View Mode Toggle - Desktop only */}
            {!isMobile && (
              <>
                <Button
                  variant={viewMode === "cards" ? "default" : "outline"}
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => {
                    setViewMode("cards");
                    setManualViewModeOverride(false);
                  }}
                  data-testid="button-owners-view-cards"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => {
                    setViewMode("table");
                    setManualViewModeOverride(true);
                  }}
                  data-testid="button-owners-view-table"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Owners Table */}
      {portfoliosError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-1">
              {language === 'es' ? 'Error al cargar propietarios' : 'Error loading owners'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === 'es' 
                ? 'No se pudieron cargar los datos. Por favor, recargue la página.'
                : 'Could not load data. Please refresh the page.'}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/external/portfolio-summary'] })}
              data-testid="button-retry-owners"
            >
              {language === 'es' ? 'Reintentar' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      ) : portfoliosLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : filteredPortfolios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">{t.noOwners}</h3>
            <p className="text-sm text-muted-foreground">{t.noOwnersDesc}</p>
          </CardContent>
        </Card>
      ) : (() => {
            // Pagination logic
            const totalItems = filteredPortfolios.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
            const paginatedPortfolios = filteredPortfolios.slice(startIndex, endIndex);

            return (
              <>
                {viewMode === "cards" ? (
                  <>
                    {/* Cards View */}
                    <div className="p-6">
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        {paginatedPortfolios.map(portfolio => (
                          <Card 
                            key={portfolio.owner.id} 
                            className="hover-elevate cursor-pointer"
                            onClick={() => setSelectedOwnerId(portfolio.owner.id)}
                            data-testid={`card-owner-${portfolio.owner.id}`}
                          >
                            <CardHeader className="space-y-2">
                              <CardTitle className="text-lg flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <span className="flex-1 min-w-0 break-words">
                                    {portfolio.owner.ownerName}
                                  </span>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDialog(portfolio.owner);
                                  }}
                                  data-testid={`button-edit-card-${portfolio.owner.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {/* Contact Info */}
                              {portfolio.owner.ownerEmail && (
                                <div className="flex items-start gap-2 text-sm">
                                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <span className="flex-1 min-w-0 break-words text-muted-foreground">
                                    {portfolio.owner.ownerEmail}
                                  </span>
                                </div>
                              )}
                              {portfolio.owner.ownerPhone && (
                                <div className="flex items-start gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <span className="flex-1 min-w-0 break-words text-muted-foreground">
                                    {portfolio.owner.ownerPhone}
                                  </span>
                                </div>
                              )}

                              {/* Property Details */}
                              <div className="space-y-2 pt-3 border-t">
                                {/* Typologies */}
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">
                                    {language === 'es' ? 'Tipologías' : 'Typologies'}
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {portfolio.typologies.map((typ, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {formatTypology(typ, language)}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Condominiums */}
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">
                                    {language === 'es' ? 'Condominios' : 'Condominiums'}
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {portfolio.condominiums.map((condo, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {condo}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Units */}
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">
                                    {language === 'es' ? 'Unidades' : 'Units'}
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {portfolio.unitNumbers.map((unit, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {unit}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Metrics */}
                              <div className="space-y-2 pt-3 border-t">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {t.units}
                                  </span>
                                  <Badge variant="outline">{portfolio.units.length}</Badge>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Home className="h-3 w-3" />
                                    {t.occupancy}
                                  </span>
                                  <Badge variant={portfolio.occupancyRate >= 70 ? "default" : "secondary"}>
                                    {portfolio.occupancyRate.toFixed(0)}%
                                  </Badge>
                                </div>
                              </div>

                              {/* View Details Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => setSelectedOwnerId(portfolio.owner.id)}
                                data-testid={`button-view-${portfolio.owner.id}`}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                {t.viewDetails}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Table View */}
                    <ExternalPaginationControls
                      currentPage={page}
                      totalPages={totalPages}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setPage}
                      onItemsPerPageChange={(value) => {
                        setItemsPerPage(value);
                        setPage(1);
                      }}
                      language={language}
                      testIdPrefix="owners"
                    />
                    <Card>
                      <div className="overflow-x-auto">
                        <Table className="text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-10 px-3">{t.owner}</TableHead>
                        <TableHead className="h-10 px-3">{t.contact}</TableHead>
                        <TableHead className="h-10 px-3">{language === 'es' ? 'Tipología' : 'Typology'}</TableHead>
                        <TableHead className="h-10 px-3">{language === 'es' ? 'Condominio' : 'Condominium'}</TableHead>
                        <TableHead className="h-10 px-3">{language === 'es' ? 'Unidad' : 'Unit'}</TableHead>
                        <TableHead className="h-10 px-3 text-right">{t.units}</TableHead>
                        <TableHead className="h-10 px-3 text-right">{t.occupancy}</TableHead>
                        <TableHead className="h-10 px-3 text-right">{t.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfoliosFetching && !portfoliosLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-[300px] p-0">
                            <TableLoading minHeight="300px" />
                          </TableCell>
                        </TableRow>
                      ) : paginatedPortfolios.map(portfolio => (
                    <TableRow 
                      key={portfolio.owner.id} 
                      data-testid={`row-owner-${portfolio.owner.id}`}
                      className="hover-elevate"
                    >
                      <TableCell className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{portfolio.owner.ownerName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          {portfolio.owner.ownerEmail && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">{portfolio.owner.ownerEmail}</span>
                            </div>
                          )}
                          {portfolio.owner.ownerPhone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{portfolio.owner.ownerPhone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {portfolio.typologies.map((typ, idx) => (
                            <Badge key={idx} variant="outline" className="text-sm">
                              {formatTypology(typ, language)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {portfolio.condominiums.map((condo, idx) => (
                            <Badge key={idx} variant="secondary" className="text-sm">
                              {condo}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {portfolio.unitNumbers.map((unit, idx) => (
                            <Badge key={idx} variant="outline" className="text-sm">
                              {unit}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right">
                        <Badge variant="outline" className="text-sm">{portfolio.units.length}</Badge>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right">
                        <Badge variant={portfolio.occupancyRate >= 70 ? "default" : "secondary"} className="text-sm">
                          {portfolio.occupancyRate.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDialog(portfolio.owner)}
                            data-testid={`button-edit-${portfolio.owner.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedOwnerId(portfolio.owner.id)}
                            data-testid={`button-view-${portfolio.owner.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                      </TableBody>
                    </Table>
                      </div>
                    </Card>
                  </>
                )}
              </>
            );
      })()}

      {/* Owner Detail Dialog */}
      {selectedPortfolio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-6 w-6" />
                    {selectedPortfolio.owner.ownerName}
                  </CardTitle>
                  <CardDescription>
                    {selectedPortfolio.owner.ownerEmail || selectedPortfolio.owner.ownerPhone}
                  </CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setSelectedOwnerId(null)}>
                  {t.close}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t.units}</p>
                  <p className="text-2xl font-bold">{selectedPortfolio.units.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t.income}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedPortfolio.totalIncome)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t.expenses}</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(selectedPortfolio.totalExpenses)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t.balance}</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    selectedPortfolio.balance >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(selectedPortfolio.balance)}
                  </p>
                </div>
              </div>

              {/* Units Table with Pagination */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t.unitDetails}</h3>

                {(() => {
                  // Sort units
                  const sortedUnits = [...selectedPortfolio.units].sort((a, b) => {
                    let comparison = 0;
                    if (unitsSortBy === 'condominium') {
                      const condoA = getCondoName(a.id);
                      const condoB = getCondoName(b.id);
                      comparison = condoA.localeCompare(condoB);
                    } else if (unitsSortBy === 'unitNumber') {
                      comparison = a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true });
                    }
                    return unitsSortOrder === 'asc' ? comparison : -comparison;
                  });

                  // Paginate
                  const totalUnits = sortedUnits.length;
                  const totalPages = Math.ceil(totalUnits / unitsPerPage);
                  const startIndex = (unitsPage - 1) * unitsPerPage;
                  const endIndex = Math.min(startIndex + unitsPerPage, totalUnits);
                  const paginatedUnits = sortedUnits.slice(startIndex, endIndex);

                  const handleSort = (column: 'condominium' | 'unitNumber') => {
                    if (unitsSortBy === column) {
                      setUnitsSortOrder(unitsSortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setUnitsSortBy(column);
                      setUnitsSortOrder('asc');
                    }
                  };

                  return (
                    <>
                      <ExternalPaginationControls
                        currentPage={unitsPage}
                        totalPages={totalPages}
                        itemsPerPage={unitsPerPage}
                        onPageChange={setUnitsPage}
                        onItemsPerPageChange={(value) => {
                          setUnitsPerPage(value);
                          setUnitsPage(1);
                        }}
                        language={language}
                        testIdPrefix="units"
                      />
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead 
                                className="cursor-pointer hover-elevate"
                                onClick={() => handleSort('condominium')}
                                data-testid="header-sort-condominium"
                              >
                                <div className="flex items-center gap-2">
                                  {t.condominium}
                                  <ArrowUpDown className="h-4 w-4" />
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover-elevate"
                                onClick={() => handleSort('unitNumber')}
                                data-testid="header-sort-unit-number"
                              >
                                <div className="flex items-center gap-2">
                                  {t.unitNumber}
                                  <ArrowUpDown className="h-4 w-4" />
                                </div>
                              </TableHead>
                              <TableHead>{t.status}</TableHead>
                              <TableHead className="text-right">{t.actions}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedUnits.map(unit => {
                              const isRented = (unit as any).rentalStatus === 'rented' || false;
                              return (
                                <TableRow key={unit.id} data-testid={`row-unit-${unit.id}`}>
                                  <TableCell className="font-medium">
                                    {getCondoName(unit.id)}
                                  </TableCell>
                                  <TableCell>{unit.unitNumber}</TableCell>
                                  <TableCell>
                                    <Badge variant={isRented ? "default" : "outline"}>
                                      {isRented ? t.rented : t.available}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Link href={`/external/units/${unit.id}`}>
                                      <Button size="sm" variant="ghost" data-testid={`button-view-unit-${unit.id}`}>
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Owner Form Dialog */}
      <Dialog open={openDialog} onOpenChange={(open) => {
        setOpenDialog(open);
        if (!open) {
          setEditingOwner(null);
          setOriginalGroupingKey(null);
          setFormCondominiumId("");
          setUnitSearchTerm("");
          form.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingOwner
                ? (language === 'es' ? 'Editar Propietario' : 'Edit Owner')
                : (language === 'es' ? 'Agregar Propietario' : 'Add Owner')
              }
            </DialogTitle>
            <DialogDescription>
              {language === 'es'
                ? 'Complete la información del propietario y seleccione la unidad correspondiente'
                : 'Fill in the owner information and select the corresponding unit'
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'es' ? 'Nombre' : 'Name'} *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={language === 'es' ? 'Nombre del propietario' : 'Owner name'}
                        data-testid="input-owner-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'es' ? 'Email' : 'Email'}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email"
                        placeholder={language === 'es' ? 'email@ejemplo.com' : 'email@example.com'}
                        data-testid="input-owner-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'es' ? 'Teléfono' : 'Phone'}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={language === 'es' ? '+52 123 456 7890' : '+52 123 456 7890'}
                        data-testid="input-owner-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Condominium selector (step 1) - optional for filtering units */}
              {condominiums && condominiums.length > 0 && (
                <FormItem>
                  <FormLabel>{language === 'es' ? 'Condominio' : 'Condominium'}</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      const newCondoId = value === "__all__" ? "" : value;
                      setFormCondominiumId(newCondoId);
                      setUnitSearchTerm("");
                      // Only clear unitId if the currently selected unit doesn't match the new filter
                      const currentUnitId = form.getValues('unitId');
                      if (currentUnitId && newCondoId) {
                        const currentUnit = units?.find(u => u.id === currentUnitId);
                        if (currentUnit && currentUnit.condominiumId !== newCondoId) {
                          form.setValue('unitId', '');
                        }
                      }
                    }}
                    value={formCondominiumId || "__all__"}
                    disabled={!!editingOwner}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-condominium">
                        <SelectValue placeholder={language === 'es' ? 'Filtrar por condominio (opcional)' : 'Filter by condominium (optional)'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__all__">
                        {language === 'es' ? 'Todos los condominios' : 'All condominiums'}
                      </SelectItem>
                      {condominiums?.map(condo => (
                        <SelectItem key={condo.id} value={condo.id}>
                          {condo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}

              {/* Unit selector (step 2) - filtered by condominium */}
              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => {
                  const filteredUnits = units?.filter(u => {
                    const matchesCondo = formCondominiumId && formCondominiumId !== "__all__" ? u.condominiumId === formCondominiumId : true;
                    const matchesSearch = unitSearchTerm 
                      ? u.unitNumber.toLowerCase().includes(unitSearchTerm.toLowerCase()) ||
                        (u.typology?.toLowerCase().includes(unitSearchTerm.toLowerCase()))
                      : true;
                    return matchesCondo && matchesSearch;
                  }) || [];
                  
                  return (
                    <FormItem>
                      <FormLabel>{language === 'es' ? 'Unidad' : 'Unit'} *</FormLabel>
                      {formCondominiumId && filteredUnits.length > 10 && (
                        <Input
                          placeholder={language === 'es' ? 'Buscar unidad...' : 'Search unit...'}
                          value={unitSearchTerm}
                          onChange={(e) => setUnitSearchTerm(e.target.value)}
                          className="mb-2"
                          data-testid="input-unit-search"
                        />
                      )}
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!!editingOwner}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-unit">
                            <SelectValue placeholder={language === 'es' ? 'Seleccionar unidad' : 'Select unit'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-60">
                          {filteredUnits.length === 0 ? (
                            <div className="py-2 px-2 text-sm text-muted-foreground">
                              {language === 'es' ? 'No hay unidades disponibles' : 'No units available'}
                            </div>
                          ) : (
                            filteredUnits.map(unit => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.unitNumber} {unit.typology ? `(${unit.typology})` : ''}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {editingOwner && (
                        <p className="text-xs text-muted-foreground">
                          {language === 'es' 
                            ? 'La unidad no se puede cambiar al editar. Para asignar otra unidad, cree un nuevo registro.' 
                            : 'Unit cannot be changed when editing. To assign another unit, create a new record.'}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpenDialog(false);
                    setEditingOwner(null);
                    setOriginalGroupingKey(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createOwnerMutation.isPending || updateOwnerMutation.isPending}
                  data-testid="button-save-owner"
                >
                  {createOwnerMutation.isPending || updateOwnerMutation.isPending
                    ? (language === 'es' ? 'Guardando...' : 'Saving...')
                    : editingOwner
                      ? (language === 'es' ? 'Actualizar' : 'Update')
                      : (language === 'es' ? 'Crear' : 'Create')
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
