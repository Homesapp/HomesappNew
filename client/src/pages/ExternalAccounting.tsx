import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import ExternalPayments from "./ExternalPayments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Pencil,
  X,
  Filter,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Eye,
  XCircle,
  Download,
  Calendar,
  Home,
  Receipt,
  Zap,
  Droplet,
  Wifi,
  Flame,
  Wrench,
  Building2,
  FileText,
} from "lucide-react";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalFinancialTransaction, ExternalCondominium, ExternalUnit } from "@shared/schema";
import { insertExternalFinancialTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfDay, endOfDay, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type TransactionFormData = z.infer<typeof insertExternalFinancialTransactionSchema>;

export default function ExternalAccounting() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [condominiumFilter, setCondominiumFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ExternalFinancialTransaction | null>(null);
  
  // View Mode & Date Filters
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const isMobile = useMobile();
  const [manualViewModeOverride, setManualViewModeOverride] = useState(false);
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Tab control
  const [activeTab, setActiveTab] = useState("transactions");
  
  // Form state for condominium selection
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string>("");
  
  // Auto-fee calculation toggle (15% administrative fee)
  const [applyAutoFee, setApplyAutoFee] = useState(true);

  // Calculate date range based on dateFilter
  const getDateRange = () => {
    if (dateFilter === "all") return { startDate: undefined, endDate: undefined };
    
    const now = new Date();
    let start: Date | undefined = undefined;
    let end: Date | undefined = undefined;

    switch (dateFilter) {
      case "today":
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case "this_month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "last_3_months":
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case "last_6_months":
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        break;
      case "this_year":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case "custom":
        if (customStartDate) start = new Date(customStartDate);
        if (customEndDate) end = new Date(customEndDate);
        break;
    }

    return { startDate: start, endDate: end };
  };

  // Backend-paginated transactions data (for table display)
  const { data: transactionsResponse, isLoading: transactionsLoading } = useQuery<{
    data: ExternalFinancialTransaction[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }>({
    queryKey: [
      '/api/external/accounting/transactions', 
      directionFilter, 
      categoryFilter, 
      statusFilter, 
      condominiumFilter, 
      unitFilter,
      searchTerm,
      dateFilter,
      customStartDate,
      customEndDate,
      sortColumn,
      sortDirection,
      itemsPerPage,
      currentPage
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (directionFilter !== "all") params.append("direction", directionFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (condominiumFilter !== "all") params.append("condominiumId", condominiumFilter);
      if (unitFilter !== "all") params.append("unitId", unitFilter);
      if (searchTerm) params.append("search", searchTerm);
      
      const { startDate, endDate } = getDateRange();
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());
      
      if (sortColumn) params.append("sortField", sortColumn);
      if (sortDirection) params.append("sortOrder", sortDirection);
      
      params.append("limit", itemsPerPage.toString());
      params.append("offset", ((currentPage - 1) * itemsPerPage).toString());
      
      const response = await fetch(`/api/external/accounting/transactions?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - transactions change frequently
    cacheTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    keepPreviousData: true, // Keep previous data while fetching new data for smooth UX
  });

  // Full dataset for analytics and receivables (without pagination)
  const { data: allTransactionsRaw, isLoading: allTransactionsLoading } = useQuery<ExternalFinancialTransaction[] | {data: ExternalFinancialTransaction[]}>({
    queryKey: [
      '/api/external/accounting/transactions-all',
      directionFilter,
      categoryFilter,
      statusFilter,
      condominiumFilter,
      unitFilter,
      searchTerm,
      dateFilter,
      customStartDate,
      customEndDate,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (directionFilter !== "all") params.append("direction", directionFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (condominiumFilter !== "all") params.append("condominiumId", condominiumFilter);
      if (unitFilter !== "all") params.append("unitId", unitFilter);
      if (searchTerm) params.append("search", searchTerm);
      
      const { startDate, endDate } = getDateRange();
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());
      
      // Don't include limit/offset to get all data (legacy mode)
      
      const response = await fetch(`/api/external/accounting/transactions?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch all transactions');
      }
      
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 15 * 60 * 1000,
  });

  // Guard: handle both array (legacy) and envelope formats
  const allTransactions = allTransactionsRaw
    ? (Array.isArray(allTransactionsRaw) ? allTransactionsRaw : allTransactionsRaw.data || [])
    : [];

  // Analytics data - aggregated calculations from backend (much faster than downloading full dataset)
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<{
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    receivables: {
      today: { count: number; total: number };
      overdue: { count: number; total: number };
      upcoming: { count: number; total: number };
    };
  }>({
    queryKey: [
      '/api/external/accounting/analytics',
      directionFilter,
      categoryFilter,
      statusFilter,
      condominiumFilter,
      unitFilter,
      searchTerm,
      dateFilter,
      customStartDate,
      customEndDate,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (directionFilter !== "all") params.append("direction", directionFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (condominiumFilter !== "all") params.append("condominiumId", condominiumFilter);
      if (unitFilter !== "all") params.append("unitId", unitFilter);
      if (searchTerm) params.append("search", searchTerm);
      
      const { startDate, endDate } = getDateRange();
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());
      
      const response = await fetch(`/api/external/accounting/analytics?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 15 * 60 * 1000,
  });

  // Extract transactions and pagination metadata from backend response
  const transactions = transactionsResponse?.data || [];
  const totalPages = Math.max(1, Math.ceil((transactionsResponse?.total || 0) / itemsPerPage));
  
  // Lightweight condominiums for dropdowns (only id+name)
  const { data: condominiums } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['/api/external-condominiums-for-filters'],
    staleTime: 15 * 60 * 1000, // 15 minutes (rarely changes)
  });

  // Lightweight units for dropdowns
  const { data: units } = useQuery<{ id: string; unitNumber: string; condominiumId: string }[]>({
    queryKey: ['/api/external-units-for-filters'],
    staleTime: 15 * 60 * 1000, // 15 minutes (rarely changes)
  });

  // Maintenance tickets for linking (only closed/resolved tickets)
  const { data: maintenanceTickets } = useQuery<{ id: string; title: string; status: string; unitId: string }[]>({
    queryKey: ['/api/external-tickets-for-accounting'],
    queryFn: async () => {
      const response = await fetch('/api/external-tickets?status=closed&status=resolved&limit=100', {
        credentials: 'include',
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        unitId: t.unitId,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter units by selected condominium for the create form
  const filteredUnitsForForm = useMemo(() => {
    if (!units || !selectedCondominiumId) return [];
    return units.filter(unit => unit.condominiumId === selectedCondominiumId);
  }, [units, selectedCondominiumId]);

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
  
  // Reset to page 1 when switching view modes (preserve itemsPerPage selection)
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Reset to page 1 when filters or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, directionFilter, categoryFilter, statusFilter, condominiumFilter, unitFilter, dateFilter, customStartDate, customEndDate, itemsPerPage]);
  
  // Clamp currentPage to valid range when total count changes
  useEffect(() => {
    const total = transactionsResponse?.total || 0;
    if (total === 0) {
      setCurrentPage(1);
      return;
    }
    const maxPage = Math.ceil(total / itemsPerPage) || 1;
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [transactionsResponse?.total, itemsPerPage, currentPage]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const createForm = useForm<TransactionFormData>({
    resolver: zodResolver(insertExternalFinancialTransactionSchema),
    defaultValues: {
      direction: "inflow",
      category: "rent_income",
      status: "pending",
      payerRole: "tenant",
      payeeRole: "agency",
      currency: "MXN",
      grossAmount: "0",
      fees: "0",
      netAmount: "0",
      description: "",
      dueDate: format(new Date(), 'yyyy-MM-dd') as any,
    },
  });

  const editForm = useForm<Partial<TransactionFormData>>({
    resolver: zodResolver(insertExternalFinancialTransactionSchema.partial()),
  });

  const grossAmount = createForm.watch("grossAmount");
  const fees = createForm.watch("fees");
  
  // Auto-calculate 15% fee when toggle is enabled and gross amount changes
  useEffect(() => {
    if (applyAutoFee) {
      const gross = parseFloat(grossAmount || "0") || 0;
      const autoFee = (gross * 0.15).toFixed(2);
      createForm.setValue("fees", autoFee);
    }
  }, [grossAmount, applyAutoFee, createForm]);
  
  // Calculate net amount whenever gross or fees change
  // Net = Gross + Fees (the total amount including administrative fee)
  useEffect(() => {
    const gross = parseFloat(grossAmount || "0") || 0;
    const fee = parseFloat(fees || "0") || 0;
    const net = (gross + fee).toFixed(2);
    createForm.setValue("netAmount", net);
  }, [grossAmount, fees, createForm]);

  const createMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const payload = {
        ...data,
        condominiumId: selectedCondominiumId || undefined,
      };
      return await apiRequest('POST', '/api/external/accounting/transactions', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/transactions-all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/summary'] });
      setShowCreateDialog(false);
      createForm.reset();
      toast({
        title: t.transactionCreated,
        description: t.transactionCreatedDesc,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionFormData> }) => {
      return await apiRequest('PATCH', `/api/external/accounting/transactions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/transactions-all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/summary'] });
      setShowEditDialog(false);
      setSelectedTransaction(null);
      toast({
        title: t.transactionUpdated,
        description: t.transactionUpdatedDesc,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('PATCH', `/api/external/accounting/transactions/${id}`, { status: 'cancelled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/transactions-all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/summary'] });
      setShowCancelDialog(false);
      setSelectedTransaction(null);
      toast({
        title: t.transactionCancelled,
        description: t.transactionCancelledDesc,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!Number.isFinite(numAmount)) return 'N/A';
    return new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(numAmount);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd MMM yyyy', { locale: language === 'es' ? es : undefined });
  };

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: language === 'es' ? es : undefined });
  };

  const t = language === 'es' ? {
    title: 'Contabilidad Financiera',
    subtitle: 'Gestión financiera y reportes',
    transactionsTab: 'Transacciones',
    receivablesTab: 'Cuentas por Cobrar',
    paymentsTab: 'Cobros',
    reportsTab: 'Reportes',
    netBalance: 'Balance Neto',
    totalIncome: 'Ingresos Totales',
    totalExpenses: 'Egresos Totales',
    pendingIncome: 'Ingresos Pendientes',
    pendingExpenses: 'Egresos Pendientes',
    reconciledIncome: 'Ingresos Conciliados',
    reconciledExpenses: 'Egresos Conciliados',
    noData: 'Sin datos disponibles',
    income: 'Ingresos',
    expenses: 'Egresos',
    pending: 'Pendiente',
    reconciled: 'Conciliado',
    posted: 'Contabilizado',
    cancelled: 'Cancelado',
    filters: 'Filtros',
    direction: 'Dirección',
    category: 'Categoría',
    status: 'Estado',
    condominium: 'Condominio',
    unit: 'Unidad',
    assignment: 'Asignación',
    all: 'Todos',
    inflow: 'Ingresos',
    outflow: 'Egresos',
    clearFilters: 'Limpiar Filtros',
    createTransaction: 'Nueva Transacción',
    editTransaction: 'Editar Transacción',
    cancelTransaction: 'Cancelar Transacción',
    viewDetails: 'Ver Detalles',
    actions: 'Acciones',
    description: 'Descripción',
    amount: 'Monto',
    dueDate: 'Fecha de Vencimiento',
    performedDate: 'Fecha Realizada',
    grossAmount: 'Monto Bruto',
    fees: 'Comisiones',
    applyAutoFee: 'Aplicar 15% automático',
    autoFeeDescription: 'Cargo administrativo del 15%',
    netAmount: 'Monto Neto',
    payerRole: 'Pagador',
    payeeRole: 'Beneficiario',
    notes: 'Notas',
    paymentMethod: 'Método de Pago',
    paymentReference: 'Referencia de Pago',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirmCancel: '¿Estás seguro de que deseas cancelar esta transacción?',
    confirmCancelDesc: 'La transacción se marcará como cancelada pero se mantendrá en los registros.',
    transactionCreated: 'Transacción creada',
    transactionCreatedDesc: 'La transacción se creó exitosamente',
    transactionUpdated: 'Transacción actualizada',
    transactionUpdatedDesc: 'La transacción se actualizó exitosamente',
    transactionCancelled: 'Transacción cancelada',
    transactionCancelledDesc: 'La transacción se canceló exitosamente',
    error: 'Error',
    tenant: 'Inquilino',
    owner: 'Propietario',
    agency: 'Agencia',
    rent_income: 'Ingreso por Renta',
    rent_payout: 'Pago de Renta',
    hoa_fee: 'Cuota HOA',
    maintenance_charge: 'Cargo por Mantenimiento',
    service_electricity: 'Electricidad',
    service_water: 'Agua',
    service_internet: 'Internet',
    service_gas: 'Gas',
    service_other: 'Otro Servicio',
    adjustment: 'Ajuste',
    tenantName: 'Nombre del Inquilino',
    viewCards: 'Vista de Tarjetas',
    viewTable: 'Vista de Tabla',
    dateRange: 'Rango de Fechas',
    today: 'Hoy',
    thisMonth: 'Este Mes',
    last3Months: 'Últimos 3 Meses',
    last6Months: 'Últimos 6 Meses',
    thisYear: 'Este Año',
    customRange: 'Rango Personalizado',
    startDate: 'Fecha Inicio',
    endDate: 'Fecha Fin',
    exportExcel: 'Exportar Excel',
    transactionDetails: 'Detalles de la Transacción',
    auditTrail: 'Registro de Auditoría',
    createdBy: 'Creado por',
    createdAt: 'Fecha de creación',
    updatedAt: 'Última actualización',
    basicInfo: 'Información Básica',
    financialInfo: 'Información Financiera',
    additionalInfo: 'Información Adicional',
    // Receivables tab
    todaySection: 'HOY',
    todayTransactions: 'Transacciones de Hoy',
    upcomingPayments: 'Próximos Pagos',
    overduePayments: 'Pagos Vencidos',
    totalReceivables: 'Total por Cobrar',
    daysOverdue: 'Días Vencido',
    paymentDue: 'Vencimiento',
    noUpcomingPayments: 'No hay pagos próximos',
    noOverduePayments: 'No hay pagos vencidos',
    noTodayTransactions: 'No hay transacciones para hoy',
    toCollect: 'Por Cobrar',
    toPay: 'Por Pagar',
    // Reports tab
    monthlyTrends: 'Tendencias Mensuales',
    categoryBreakdown: 'Desglose por Categoría',
    incomeVsExpenses: 'Ingresos vs Egresos',
    last12Months: 'Últimos 12 Meses',
    topCategories: 'Principales Categorías',
  } : {
    title: 'Financial Accounting',
    subtitle: 'Financial management and reports',
    transactionsTab: 'Transactions',
    receivablesTab: 'Receivables',
    paymentsTab: 'Payments',
    reportsTab: 'Reports',
    netBalance: 'Net Balance',
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    pendingIncome: 'Pending Income',
    pendingExpenses: 'Pending Expenses',
    reconciledIncome: 'Reconciled Income',
    reconciledExpenses: 'Reconciled Expenses',
    noData: 'No data available',
    income: 'Income',
    expenses: 'Expenses',
    pending: 'Pending',
    reconciled: 'Reconciled',
    posted: 'Posted',
    cancelled: 'Cancelled',
    filters: 'Filters',
    direction: 'Direction',
    category: 'Category',
    status: 'Status',
    condominium: 'Condominium',
    unit: 'Unit',
    assignment: 'Assignment',
    all: 'All',
    inflow: 'Income',
    outflow: 'Expenses',
    clearFilters: 'Clear Filters',
    createTransaction: 'New Transaction',
    editTransaction: 'Edit Transaction',
    cancelTransaction: 'Cancel Transaction',
    viewDetails: 'View Details',
    actions: 'Actions',
    description: 'Description',
    amount: 'Amount',
    dueDate: 'Due Date',
    performedDate: 'Performed Date',
    grossAmount: 'Gross Amount',
    fees: 'Fees',
    applyAutoFee: 'Apply 15% automatically',
    autoFeeDescription: '15% administrative fee',
    netAmount: 'Net Amount',
    payerRole: 'Payer',
    payeeRole: 'Payee',
    notes: 'Notes',
    paymentMethod: 'Payment Method',
    paymentReference: 'Payment Reference',
    save: 'Save',
    cancel: 'Cancel',
    confirmCancel: 'Are you sure you want to cancel this transaction?',
    confirmCancelDesc: 'The transaction will be marked as cancelled but will remain in the records.',
    transactionCreated: 'Transaction created',
    transactionCreatedDesc: 'The transaction was created successfully',
    transactionUpdated: 'Transaction updated',
    transactionUpdatedDesc: 'The transaction was updated successfully',
    transactionCancelled: 'Transaction cancelled',
    transactionCancelledDesc: 'The transaction was cancelled successfully',
    error: 'Error',
    tenant: 'Tenant',
    owner: 'Owner',
    agency: 'Agency',
    rent_income: 'Rent Income',
    rent_payout: 'Rent Payout',
    hoa_fee: 'HOA Fee',
    maintenance_charge: 'Maintenance Charge',
    service_electricity: 'Electricity',
    service_water: 'Water',
    service_internet: 'Internet',
    service_gas: 'Gas',
    service_other: 'Other Service',
    adjustment: 'Adjustment',
    tenantName: 'Tenant Name',
    viewCards: 'Card View',
    viewTable: 'Table View',
    dateRange: 'Date Range',
    today: 'Today',
    thisMonth: 'This Month',
    last3Months: 'Last 3 Months',
    last6Months: 'Last 6 Months',
    thisYear: 'This Year',
    customRange: 'Custom Range',
    startDate: 'Start Date',
    endDate: 'End Date',
    exportExcel: 'Export Excel',
    transactionDetails: 'Transaction Details',
    auditTrail: 'Audit Trail',
    createdBy: 'Created by',
    createdAt: 'Created at',
    updatedAt: 'Last updated',
    basicInfo: 'Basic Information',
    financialInfo: 'Financial Information',
    additionalInfo: 'Additional Information',
    // Receivables tab
    todaySection: 'TODAY',
    todayTransactions: 'Today\'s Transactions',
    upcomingPayments: 'Upcoming Payments',
    overduePayments: 'Overdue Payments',
    totalReceivables: 'Total Receivables',
    daysOverdue: 'Days Overdue',
    paymentDue: 'Due Date',
    noUpcomingPayments: 'No upcoming payments',
    noOverduePayments: 'No overdue payments',
    noTodayTransactions: 'No transactions for today',
    toCollect: 'To Collect',
    toPay: 'To Pay',
    // Reports tab
    monthlyTrends: 'Monthly Trends',
    categoryBreakdown: 'Category Breakdown',
    incomeVsExpenses: 'Income vs Expenses',
    last12Months: 'Last 12 Months',
    topCategories: 'Top Categories',
  };

  const getCategoryLabel = (category: string) => {
    return t[category as keyof typeof t] || category;
  };

  const getRoleLabel = (role: string) => {
    return t[role as keyof typeof t] || role;
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      rent_income: Home,
      rent_payout: Home,
      hoa_fee: Building2,
      maintenance_charge: Wrench,
      service_electricity: Zap,
      service_water: Droplet,
      service_internet: Wifi,
      service_gas: Flame,
      service_other: Receipt,
      adjustment: Receipt,
    };
    const IconComponent = iconMap[category] || Receipt;
    return <IconComponent className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
      posted: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      reconciled: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || ""}>
        {t[status as keyof typeof t] || status}
      </Badge>
    );
  };

  const getDirectionBadge = (direction: string) => {
    if (direction === "inflow") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          {t.inflow}
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
        <ArrowDownRight className="h-3 w-3 mr-1" />
        {t.outflow}
      </Badge>
    );
  };

  const handleEdit = (transaction: ExternalFinancialTransaction) => {
    setSelectedTransaction(transaction);
    editForm.reset({
      status: transaction.status,
      notes: transaction.notes || "",
      // Extract date part directly from ISO string to avoid timezone shift
      performedDate: transaction.performedDate ? transaction.performedDate.split('T')[0] : "",
      paymentMethod: transaction.paymentMethod || "",
      paymentReference: transaction.paymentReference || "",
    });
    setShowEditDialog(true);
  };

  const handleCancel = (transaction: ExternalFinancialTransaction) => {
    setSelectedTransaction(transaction);
    setShowCancelDialog(true);
  };

  const handleViewDetails = (transaction: ExternalFinancialTransaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsDialog(true);
  };

  const handleClearFilters = () => {
    setDirectionFilter("all");
    setCategoryFilter("all");
    setStatusFilter("all");
    setCondominiumFilter("all");
    setUnitFilter("all");
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const handleExportExcel = () => {
    if (!allTransactions || allTransactions.length === 0) {
      toast({
        title: t.error,
        description: t.noData,
        variant: "destructive",
      });
      return;
    }

    try {
      // Use allTransactions which already has all filtered data
      const exportData = allTransactions.map(tx => ({
        "Due Date": formatDate(tx.dueDate),
        "Direction": tx.direction === 'inflow' ? t.inflow : t.outflow,
        "Category": getCategoryLabel(tx.category),
        "Description": tx.description,
        "Payer Role": getRoleLabel(tx.payerRole),
        "Payee Role": getRoleLabel(tx.payeeRole),
        "Gross Amount": parseFloat(tx.grossAmount),
        "Fees": parseFloat(tx.fees || '0'),
        "Net Amount": parseFloat(tx.netAmount),
        "Status": tx.status === 'pending' ? t.pending : tx.status === 'posted' ? t.posted : tx.status === 'reconciled' ? t.reconciled : tx.status === 'cancelled' ? t.cancelled : tx.status,
        "Payment Method": tx.paymentMethod || 'N/A',
        "Payment Reference": tx.paymentReference || 'N/A',
        "Performed Date": formatDate(tx.performedDate),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const wscols = [
        { wch: 12 }, // Date
        { wch: 10 }, // Direction
        { wch: 20 }, // Category
        { wch: 30 }, // Description
        { wch: 12 }, // Payer
        { wch: 12 }, // Payee
        { wch: 12 }, // Gross
        { wch: 10 }, // Fees
        { wch: 12 }, // Net
        { wch: 12 }, // Status
        { wch: 15 }, // Method
        { wch: 15 }, // Reference
        { wch: 12 }, // Performed
      ];
      ws['!cols'] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, language === 'es' ? 'Transacciones' : 'Transactions');
      
      const fileName = `transacciones_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: language === 'es' ? 'Exportación exitosa' : 'Export successful',
        description: language === 'es' ? `Se exportaron ${allTransactions.length} transacciones` : `Exported ${allTransactions.length} transactions`,
      });
    } catch (error) {
      toast({
        title: t.error,
        description: language === 'es' ? 'Error al exportar transacciones' : 'Error exporting transactions',
        variant: "destructive",
      });
    }
  };

  const activeFilters = [directionFilter, categoryFilter, statusFilter, condominiumFilter, unitFilter].filter(f => f !== "all").length + (dateFilter !== "all" ? 1 : 0);

  // Calculate receivables data using full dataset
  const receivablesData = useMemo(() => {
    if (!allTransactions) return { today: [], upcoming: [], overdue: [], totalAmount: 0 };
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    // Today: all pending transactions (inflow and outflow) due today
    const today = allTransactions.filter(t => {
      if (t.status === 'cancelled') return false;
      const dueDate = t.dueDate ? new Date(t.dueDate) : null;
      return dueDate && dueDate >= todayStart && dueDate <= todayEnd && t.status === 'pending';
    }).sort((a, b) => {
      // Sort by direction (inflow first), then by amount
      if (a.direction !== b.direction) {
        return a.direction === 'inflow' ? -1 : 1;
      }
      return parseFloat(b.netAmount || '0') - parseFloat(a.netAmount || '0');
    });
    
    const pending = allTransactions.filter(t => t.status === 'pending' && t.direction === 'inflow');
    
    const upcoming = pending.filter(t => {
      const dueDate = t.dueDate ? new Date(t.dueDate) : null;
      return dueDate && dueDate > todayEnd;
    }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    
    const overdue = pending.filter(t => {
      const dueDate = t.dueDate ? new Date(t.dueDate) : null;
      return dueDate && dueDate < todayStart;
    }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    
    const totalAmount = pending.reduce((sum, t) => sum + parseFloat(t.netAmount || '0'), 0);
    
    return { today, upcoming, overdue, totalAmount };
  }, [allTransactions]);

  // Calculate report data using full dataset
  const reportData = useMemo(() => {
    if (!allTransactions) return { monthly: [], categories: [] };
    
    // Last 12 months data
    const monthlyMap = new Map<string, { inflow: number, outflow: number, month: string }>();
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const key = format(date, 'yyyy-MM');
      const monthName = format(date, 'MMM yyyy', { locale: language === 'es' ? es : undefined });
      monthlyMap.set(key, { inflow: 0, outflow: 0, month: monthName });
    }
    
    allTransactions.forEach(t => {
      const date = t.dueDate ? new Date(t.dueDate) : null;
      if (!date) return;
      
      const key = format(date, 'yyyy-MM');
      const entry = monthlyMap.get(key);
      if (!entry) return;
      
      const amount = parseFloat(t.netAmount || '0');
      if (t.direction === 'inflow') {
        entry.inflow += amount;
      } else {
        entry.outflow += amount;
      }
    });
    
    const monthly = Array.from(monthlyMap.values());
    
    // Category breakdown
    const categoryMap = new Map<string, number>();
    allTransactions.forEach(t => {
      if (t.status === 'cancelled') return;
      const amount = parseFloat(t.netAmount || '0');
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + Math.abs(amount));
    });
    
    const categories = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name: getCategoryLabel(name), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    return { monthly, categories };
  }, [allTransactions, language]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-financial-title">{t.title}</h1>
          <p className="text-muted-foreground mt-2">{t.subtitle}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowCreateDialog(true)}
            data-testid="button-create-transaction"
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t.createTransaction}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={!allTransactions || allTransactions.length === 0}
            data-testid="button-export-excel"
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-1" />
            {t.exportExcel}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <TabsList>
            <TabsTrigger value="transactions" data-testid="tab-transactions">{t.transactionsTab}</TabsTrigger>
            <TabsTrigger value="receivables" data-testid="tab-receivables">{t.receivablesTab}</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">{t.paymentsTab}</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">{t.reportsTab}</TabsTrigger>
          </TabsList>
        </div>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Search and Filters Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'es' ? 'Buscar transacciones...' : 'Search transactions...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>

                {/* Filter Button with Popover */}
                <Popover open={filtersExpanded} onOpenChange={setFiltersExpanded}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="relative flex-shrink-0"
                      data-testid="button-toggle-filters"
                    >
                      <Filter className="h-4 w-4" />
                      {activeFilters > 0 && (
                        <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                          {activeFilters}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
              <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.direction}</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={directionFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDirectionFilter("all")}
                    data-testid="button-filter-direction-all"
                  >
                    {t.all}
                  </Button>
                  <Button
                    variant={directionFilter === "inflow" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDirectionFilter("inflow")}
                    data-testid="button-filter-direction-inflow"
                  >
                    {t.inflow}
                  </Button>
                  <Button
                    variant={directionFilter === "outflow" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDirectionFilter("outflow")}
                    data-testid="button-filter-direction-outflow"
                  >
                    {t.outflow}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t.category}</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={categoryFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter("all")}
                    data-testid="button-filter-category-all"
                  >
                    {t.all}
                  </Button>
                  <Button
                    variant={categoryFilter === "rent_income" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter("rent_income")}
                    data-testid="button-filter-category-rent-income"
                  >
                    {t.rent_income}
                  </Button>
                  <Button
                    variant={categoryFilter === "rent_payout" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter("rent_payout")}
                    data-testid="button-filter-category-rent-payout"
                  >
                    {t.rent_payout}
                  </Button>
                  <Button
                    variant={categoryFilter === "hoa_fee" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter("hoa_fee")}
                    data-testid="button-filter-category-hoa-fee"
                  >
                    {t.hoa_fee}
                  </Button>
                  <Button
                    variant={categoryFilter === "maintenance_charge" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter("maintenance_charge")}
                    data-testid="button-filter-category-maintenance"
                  >
                    {t.maintenance_charge}
                  </Button>
                  <Button
                    variant={categoryFilter === "service_electricity" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter("service_electricity")}
                    data-testid="button-filter-category-electricity"
                  >
                    {t.service_electricity}
                  </Button>
                  <Button
                    variant={categoryFilter === "service_water" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter("service_water")}
                    data-testid="button-filter-category-water"
                  >
                    {t.service_water}
                  </Button>
                  <Button
                    variant={categoryFilter === "service_internet" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter("service_internet")}
                    data-testid="button-filter-category-internet"
                  >
                    {t.service_internet}
                  </Button>
                  <Button
                    variant={categoryFilter === "service_gas" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter("service_gas")}
                    data-testid="button-filter-category-gas"
                  >
                    {t.service_gas}
                  </Button>
                  <Button
                    variant={categoryFilter === "service_other" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter("service_other")}
                    data-testid="button-filter-category-service-other"
                  >
                    {t.service_other}
                  </Button>
                  <Button
                    variant={categoryFilter === "adjustment" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter("adjustment")}
                    data-testid="button-filter-category-adjustment"
                  >
                    {t.adjustment}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t.status}</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                    data-testid="button-filter-status-all"
                  >
                    {t.all}
                  </Button>
                  <Button
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("pending")}
                    data-testid="button-filter-status-pending"
                  >
                    {t.pending}
                  </Button>
                  <Button
                    variant={statusFilter === "posted" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("posted")}
                    data-testid="button-filter-status-posted"
                  >
                    {t.posted}
                  </Button>
                  <Button
                    variant={statusFilter === "reconciled" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("reconciled")}
                    data-testid="button-filter-status-reconciled"
                  >
                    {t.reconciled}
                  </Button>
                  <Button
                    variant={statusFilter === "cancelled" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("cancelled")}
                    data-testid="button-filter-status-cancelled"
                  >
                    {t.cancelled}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t.condominium}</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={condominiumFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCondominiumFilter("all")}
                    data-testid="button-filter-condo-all"
                  >
                    {t.all}
                  </Button>
                  {condominiums?.map((condo) => (
                    <Button
                      key={condo.id}
                      variant={condominiumFilter === condo.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCondominiumFilter(condo.id)}
                      data-testid={`button-filter-condo-${condo.id}`}
                    >
                      {condo.name}
                    </Button>
                  ))}
                </div>
              </div>

              {condominiumFilter !== "all" && units && units.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.unit}</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={unitFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUnitFilter("all")}
                      data-testid="button-filter-unit-all"
                    >
                      {t.all}
                    </Button>
                    {units?.map((unit) => (
                      <Button
                        key={unit.id}
                        variant={unitFilter === unit.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUnitFilter(unit.id)}
                        data-testid={`button-filter-unit-${unit.id}`}
                      >
                        {unit.unitNumber}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">{t.dateRange}</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={dateFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("all")}
                    data-testid="button-filter-date-all"
                  >
                    {t.all}
                  </Button>
                  <Button
                    variant={dateFilter === "today" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter(dateFilter === "today" ? "all" : "today")}
                    data-testid="button-filter-date-today"
                  >
                    {t.today}
                  </Button>
                  <Button
                    variant={dateFilter === "this_month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("this_month")}
                    data-testid="button-filter-date-month"
                  >
                    {t.thisMonth}
                  </Button>
                  <Button
                    variant={dateFilter === "last_3_months" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("last_3_months")}
                    data-testid="button-filter-date-3months"
                  >
                    {t.last3Months}
                  </Button>
                  <Button
                    variant={dateFilter === "last_6_months" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("last_6_months")}
                    data-testid="button-filter-date-6months"
                  >
                    {t.last6Months}
                  </Button>
                  <Button
                    variant={dateFilter === "this_year" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("this_year")}
                    data-testid="button-filter-date-year"
                  >
                    {t.thisYear}
                  </Button>
                  <Button
                    variant={dateFilter === "custom" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("custom")}
                    data-testid="button-filter-date-custom"
                  >
                    {t.customRange}
                  </Button>
                </div>
              </div>

              {dateFilter === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.startDate}</label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      data-testid="input-custom-start-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.endDate}</label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      data-testid="input-custom-end-date"
                    />
                  </div>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleClearFilters}
                data-testid="button-clear-all-filters"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {language === 'es' ? 'Limpiar Filtros' : 'Clear Filters'}
              </Button>
            </div>
                </PopoverContent>
              </Popover>
              
              {/* HOY Button - Filter Today's Transactions */}
              <Button
                variant={dateFilter === "today" ? "default" : "outline"}
                className="flex-shrink-0"
                onClick={() => {
                  setDateFilter(dateFilter === "today" ? "all" : "today");
                  setCurrentPage(1);
                }}
                data-testid="button-today"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t.today}
              </Button>
              
              {/* View Mode Toggles - Desktop Only */}
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
                    data-testid="button-view-cards"
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
                    data-testid="button-view-table"
                  >
                    <TableIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          {transactionsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t.noData}</p>
              </CardContent>
            </Card>
          ) : viewMode === "cards" ? (
            <>
              <ExternalPaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                language={language}
                testIdPrefix="accounting-cards"
              />

              <div className="grid gap-4 md:grid-cols-2">
                {transactions.map((transaction) => (
                  <Card key={transaction.id} className="hover-elevate" data-testid={`card-transaction-${transaction.id}`}>
                    <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(transaction.category)}
                        <span className="text-sm">{getCategoryLabel(transaction.category)}</span>
                      </div>
                      {getDirectionBadge(transaction.direction)}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(transaction.netAmount)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {transaction.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(transaction.dueDate)}
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>

                      <Separator />

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewDetails(transaction)}
                          data-testid={`button-view-details-${transaction.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t.viewDetails}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(transaction)}
                          data-testid={`button-edit-${transaction.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {transaction.status !== 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(transaction)}
                            data-testid={`button-cancel-${transaction.id}`}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <>
              <ExternalPaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                language={language}
                testIdPrefix="accounting-table"
              />

              <Card className="border">
                <Table>
                  <TableHeader>
                    <TableRow className="h-10">
                      <TableHead className="cursor-pointer hover:bg-muted text-sm" onClick={() => handleSort('dueDate')}>
                        {t.dueDate} {getSortIcon('dueDate')}
                      </TableHead>
                      <TableHead className="text-sm">
                        {t.direction}
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted text-sm" onClick={() => handleSort('category')}>
                        {t.category} {getSortIcon('category')}
                      </TableHead>
                      <TableHead className="text-sm">
                        {t.description}
                      </TableHead>
                      <TableHead className="text-sm">
                        {t.assignment}
                      </TableHead>
                      <TableHead className="text-sm">
                        {t.payerRole}
                      </TableHead>
                      <TableHead className="text-sm">
                        {t.payeeRole}
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted text-sm" onClick={() => handleSort('grossAmount')}>
                        {t.amount} {getSortIcon('grossAmount')}
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted text-sm" onClick={() => handleSort('status')}>
                        {t.status} {getSortIcon('status')}
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted text-sm" onClick={() => handleSort('performedDate')}>
                        {t.performedDate} {getSortIcon('performedDate')}
                      </TableHead>
                      <TableHead className="text-right text-sm">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                        <TableCell className="text-sm px-3 py-3">{formatDate(transaction.dueDate)}</TableCell>
                        <TableCell className="text-sm px-3 py-3">{getDirectionBadge(transaction.direction)}</TableCell>
                        <TableCell className="text-sm px-3 py-3">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(transaction.category)}
                            <Badge variant="outline">{getCategoryLabel(transaction.category)}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm px-3 py-3">{transaction.description}</TableCell>
                        <TableCell className="text-sm px-3 py-3">
                          {transaction.condominiumId || transaction.unitId ? (
                            <div className="flex flex-col gap-1">
                              {transaction.condominiumId && condominiums && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs justify-start font-normal"
                                  onClick={() => setLocation(`/external/condominios/${transaction.condominiumId}`)}
                                  data-testid={`link-condo-${transaction.id}`}
                                >
                                  <Building2 className="h-3 w-3 mr-1 shrink-0" />
                                  <span className="truncate">{condominiums.find(c => c.id === transaction.condominiumId)?.name || '-'}</span>
                                </Button>
                              )}
                              {transaction.unitId && units && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs justify-start font-normal"
                                  onClick={() => setLocation(`/external/unidades/${transaction.unitId}`)}
                                  data-testid={`link-unit-${transaction.id}`}
                                >
                                  <Home className="h-3 w-3 mr-1 shrink-0" />
                                  <span>{units.find(u => u.id === transaction.unitId)?.unitNumber || '-'}</span>
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm px-3 py-3"><Badge variant="outline">{getRoleLabel(transaction.payerRole)}</Badge></TableCell>
                        <TableCell className="text-sm px-3 py-3"><Badge variant="outline">{getRoleLabel(transaction.payeeRole)}</Badge></TableCell>
                        <TableCell className="text-sm px-3 py-3">
                          {formatCurrency(transaction.netAmount)}
                        </TableCell>
                        <TableCell className="text-sm px-3 py-3">{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="text-sm px-3 py-3">{formatDate(transaction.performedDate)}</TableCell>
                        <TableCell className="text-right text-sm px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(transaction)}
                              data-testid={`button-view-details-${transaction.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(transaction)}
                              data-testid={`button-edit-${transaction.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {transaction.status !== 'cancelled' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancel(transaction)}
                                data-testid={`button-cancel-${transaction.id}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Receivables Tab */}
        <TabsContent value="receivables" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.totalReceivables}</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-500" data-testid="text-total-receivables">
                  {formatCurrency(receivablesData.totalAmount)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {receivablesData.upcoming.length + receivablesData.overdue.length} {language === 'es' ? 'pagos pendientes' : 'pending payments'}
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.upcomingPayments}</CardTitle>
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-upcoming-count">
                  {receivablesData.upcoming.length}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatCurrency(receivablesData.upcoming.reduce((sum, t) => sum + parseFloat(t.netAmount || '0'), 0))}
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.overduePayments}</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-500" data-testid="text-overdue-count">
                  {receivablesData.overdue.length}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatCurrency(receivablesData.overdue.reduce((sum, t) => sum + parseFloat(t.netAmount || '0'), 0))}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* TODAY Section */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Calendar className="h-6 w-6 text-primary" />
                {t.todaySection}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{t.todayTransactions}</p>
            </CardHeader>
            <CardContent>
              {receivablesData.today.length > 0 ? (
                <div className="space-y-3">
                  {receivablesData.today.map((transaction) => {
                    const isInflow = transaction.direction === 'inflow';
                    return (
                      <Card 
                        key={transaction.id} 
                        className={`hover-elevate ${isInflow ? 'border-green-200 dark:border-green-900' : 'border-orange-200 dark:border-orange-900'}`}
                        data-testid={`card-today-${transaction.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getCategoryIcon(transaction.category)}
                                <span className="font-semibold">{getCategoryLabel(transaction.category)}</span>
                                <Badge className={isInflow 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                                }>
                                  {isInflow ? t.toCollect : t.toPay}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{transaction.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  {transaction.payerRole && <span>{getRoleLabel(transaction.payerRole)} → {getRoleLabel(transaction.payeeRole)}</span>}
                                </span>
                                {transaction.unitId && units && (
                                  <span className="flex items-center gap-1">
                                    <Home className="h-3 w-3" />
                                    {units.find(u => u.id === transaction.unitId)?.unitNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${isInflow ? 'text-green-600 dark:text-green-500' : 'text-orange-600 dark:text-orange-500'}`}>
                                {formatCurrency(transaction.netAmount)}
                              </div>
                              <div className="flex gap-1 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(transaction)}
                                  data-testid={`button-view-today-${transaction.id}`}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  {t.viewDetails}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(transaction)}
                                  data-testid={`button-edit-today-${transaction.id}`}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {/* Summary totals for today */}
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">{t.toCollect}</div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-500">
                        {formatCurrency(receivablesData.today
                          .filter(t => t.direction === 'inflow')
                          .reduce((sum, t) => sum + parseFloat(t.netAmount || '0'), 0)
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {receivablesData.today.filter(t => t.direction === 'inflow').length} {language === 'es' ? 'transacciones' : 'transactions'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-md">
                      <div className="text-sm text-muted-foreground mb-1">{t.toPay}</div>
                      <div className="text-xl font-bold text-orange-600 dark:text-orange-500">
                        {formatCurrency(receivablesData.today
                          .filter(t => t.direction === 'outflow')
                          .reduce((sum, t) => sum + parseFloat(t.netAmount || '0'), 0)
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {receivablesData.today.filter(t => t.direction === 'outflow').length} {language === 'es' ? 'transacciones' : 'transactions'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t.noTodayTransactions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {receivablesData.overdue.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
                  <AlertCircle className="h-5 w-5" />
                  {t.overduePayments}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {receivablesData.overdue.map((transaction) => {
                    const daysOverdue = transaction.dueDate ? differenceInDays(new Date(), new Date(transaction.dueDate)) : 0;
                    return (
                      <Card key={transaction.id} className="hover-elevate border-red-200 dark:border-red-900" data-testid={`card-overdue-${transaction.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getCategoryIcon(transaction.category)}
                                <span className="font-semibold">{getCategoryLabel(transaction.category)}</span>
                                <Badge variant="destructive" className="text-xs">
                                  {daysOverdue} {t.daysOverdue}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{transaction.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(transaction.dueDate)}
                                </span>
                                {transaction.unitId && units && (
                                  <span>{units.find(u => u.id === transaction.unitId)?.unitNumber}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-red-600 dark:text-red-500">
                                {formatCurrency(transaction.netAmount)}
                              </div>
                              <div className="flex gap-1 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(transaction)}
                                  data-testid={`button-view-overdue-${transaction.id}`}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  {t.viewDetails}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {receivablesData.overdue.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600 dark:text-green-500" />
                <p className="text-muted-foreground">{t.noOverduePayments}</p>
              </CardContent>
            </Card>
          )}

          {receivablesData.upcoming.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t.upcomingPayments}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {receivablesData.upcoming.slice(0, 10).map((transaction) => (
                    <Card key={transaction.id} className="hover-elevate" data-testid={`card-upcoming-${transaction.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getCategoryIcon(transaction.category)}
                              <span className="font-semibold">{getCategoryLabel(transaction.category)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{transaction.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(transaction.dueDate)}
                              </span>
                              {transaction.unitId && units && (
                                <span>{units.find(u => u.id === transaction.unitId)?.unitNumber}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">
                              {formatCurrency(transaction.netAmount)}
                            </div>
                            <div className="flex gap-1 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(transaction)}
                                data-testid={`button-view-upcoming-${transaction.id}`}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                {t.viewDetails}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {receivablesData.upcoming.length === 0 && receivablesData.overdue.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t.noUpcomingPayments}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t.incomeVsExpenses} - {t.last12Months}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="inflow" 
                      fill="hsl(142, 76%, 36%)" 
                      name={language === 'es' ? 'Ingresos' : 'Income'}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="outflow" 
                      fill="hsl(0, 84%, 60%)" 
                      name={language === 'es' ? 'Egresos' : 'Expenses'}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                {t.topCategories}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.categories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData.categories.map((_, index) => {
                          const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {reportData.categories.map((cat, index) => {
                    const colors = [
                      'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
                      'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
                      'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
                      'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
                      'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
                    ];
                    const total = reportData.categories.reduce((sum, c) => sum + c.value, 0);
                    const percent = (cat.value / total) * 100;
                    
                    return (
                      <Card key={index} className="hover-elevate">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="font-semibold text-sm mb-1">{cat.name}</div>
                              <Badge className={colors[index % colors.length]}>
                                {percent.toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">
                                {formatCurrency(cat.value)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <ExternalPayments showHeader={false} />
        </TabsContent>
      </Tabs>

      {/* Create Transaction Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.createTransaction}</DialogTitle>
            <DialogDescription>
              {t.subtitle}
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(
              (data) => {
                console.log("Form data submitted:", data);
                createMutation.mutate(data);
              },
              (errors) => {
                console.error("Form validation errors:", errors);
                toast({
                  title: language === 'es' ? 'Error de validación' : 'Validation Error',
                  description: language === 'es' 
                    ? 'Por favor revisa todos los campos obligatorios' 
                    : 'Please check all required fields',
                  variant: "destructive",
                });
              }
            )} className="space-y-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">
                    {language === 'es' ? 'Información Básica' : 'Basic Information'}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="direction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.direction}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="input-create-direction">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="inflow">{t.inflow}</SelectItem>
                            <SelectItem value="outflow">{t.outflow}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.category}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="input-create-category">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rent_income">{t.rent_income}</SelectItem>
                            <SelectItem value="rent_payout">{t.rent_payout}</SelectItem>
                            <SelectItem value="hoa_fee">{t.hoa_fee}</SelectItem>
                            <SelectItem value="maintenance_charge">{t.maintenance_charge}</SelectItem>
                            <SelectItem value="service_electricity">{t.service_electricity}</SelectItem>
                            <SelectItem value="service_water">{t.service_water}</SelectItem>
                            <SelectItem value="service_internet">{t.service_internet}</SelectItem>
                            <SelectItem value="service_gas">{t.service_gas}</SelectItem>
                            <SelectItem value="service_other">{t.service_other}</SelectItem>
                            <SelectItem value="adjustment">{t.adjustment}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="payerRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.payerRole}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="input-create-payer">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tenant">{t.tenant}</SelectItem>
                            <SelectItem value="owner">{t.owner}</SelectItem>
                            <SelectItem value="agency">{t.agency}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="payeeRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.payeeRole}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="input-create-payee">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tenant">{t.tenant}</SelectItem>
                            <SelectItem value="owner">{t.owner}</SelectItem>
                            <SelectItem value="agency">{t.agency}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.dueDate}</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Store as YYYY-MM-DD string, default to today if cleared
                            field.onChange(value || format(new Date(), 'yyyy-MM-dd'));
                          }}
                          data-testid="input-create-due-date" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.description}</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-create-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Referencia de Propiedad */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">
                    {language === 'es' ? 'Referencia de Propiedad' : 'Property Reference'}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === 'es' ? 'Condominio' : 'Condominium'}
                    </label>
                    <Select 
                      value={selectedCondominiumId} 
                      onValueChange={(value) => {
                        setSelectedCondominiumId(value);
                        // Reset unit selection when condominium changes
                        createForm.setValue('unitId', undefined);
                      }}
                    >
                      <SelectTrigger data-testid="input-create-condominium">
                        <SelectValue placeholder={language === 'es' ? 'Selecciona un condominio' : 'Select a condominium'} />
                      </SelectTrigger>
                      <SelectContent>
                        {condominiums?.map(condo => (
                          <SelectItem key={condo.id} value={condo.id}>
                            {condo.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <FormField
                    control={createForm.control}
                    name="unitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.unit}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                          disabled={!selectedCondominiumId}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="input-create-unit">
                              <SelectValue 
                                placeholder={
                                  !selectedCondominiumId 
                                    ? (language === 'es' ? 'Primero selecciona un condominio' : 'Select a condominium first')
                                    : (language === 'es' ? 'Selecciona una unidad' : 'Select a unit')
                                } 
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredUnitsForForm.length === 0 && selectedCondominiumId && (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                {language === 'es' ? 'No hay unidades disponibles' : 'No units available'}
                              </div>
                            )}
                            {filteredUnitsForForm.map(unit => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.unitNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Maintenance Ticket Selector - only show when category is maintenance_charge */}
                {createForm.watch('category') === 'maintenance_charge' && (
                  <FormField
                    control={createForm.control}
                    name="maintenanceTicketId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === 'es' ? 'Ticket de Mantenimiento (Opcional)' : 'Maintenance Ticket (Optional)'}
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="input-create-maintenance-ticket">
                              <SelectValue 
                                placeholder={language === 'es' ? 'Vincular a un ticket...' : 'Link to a ticket...'} 
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">
                              {language === 'es' ? '-- Sin vincular --' : '-- No link --'}
                            </SelectItem>
                            {maintenanceTickets?.map(ticket => (
                              <SelectItem key={ticket.id} value={ticket.id}>
                                {ticket.title} ({ticket.status === 'closed' 
                                  ? (language === 'es' ? 'Cerrado' : 'Closed')
                                  : (language === 'es' ? 'Resuelto' : 'Resolved')})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator />

              {/* Información Financiera */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                      {language === 'es' ? 'Información Financiera' : 'Financial Information'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="apply-auto-fee"
                      checked={applyAutoFee}
                      onCheckedChange={setApplyAutoFee}
                      data-testid="switch-auto-fee"
                    />
                    <Label htmlFor="apply-auto-fee" className="text-sm cursor-pointer">
                      {t.applyAutoFee}
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={createForm.control}
                    name="grossAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.grossAmount}</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-create-gross-amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="fees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          {t.fees}
                          {applyAutoFee && (
                            <span className="text-xs text-muted-foreground">(15%)</span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            disabled={applyAutoFee}
                            className={applyAutoFee ? "bg-muted" : ""}
                            data-testid="input-create-fees" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="netAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.netAmount}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            readOnly
                            className="bg-muted"
                            data-testid="input-create-net-amount" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Notas Adicionales */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {language === 'es' ? 'Notas Adicionales' : 'Additional Notes'}
                </h3>
                <FormField
                  control={createForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.notes}</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} data-testid="input-create-notes" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateDialog(false);
                    setSelectedCondominiumId("");
                  }}
                >
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-transaction">
                  {t.save}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.editTransaction}</DialogTitle>
            <DialogDescription>
              {language === 'es' 
                ? 'Actualiza el estado, fechas y notas de la transacción' 
                : 'Update transaction status, dates and notes'}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => updateMutation.mutate({ id: selectedTransaction!.id, data }))} className="space-y-4">
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.status}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="input-edit-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">{t.pending}</SelectItem>
                        <SelectItem value="posted">{t.posted}</SelectItem>
                        <SelectItem value="reconciled">{t.reconciled}</SelectItem>
                        <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="performedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.performedDate}</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={field.value || ""} 
                        onChange={(e) => {
                          const value = e.target.value;
                          // Store as YYYY-MM-DD string or empty, let Zod coerce to Date
                          field.onChange(value || null);
                        }}
                        data-testid="input-edit-performed-date" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.paymentMethod}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-edit-payment-method" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="paymentReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.paymentReference}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-edit-payment-reference" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.notes}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="input-edit-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-update-transaction">
                  {t.save}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Cancel Transaction Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.cancelTransaction}</DialogTitle>
            <DialogDescription>{t.confirmCancel}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t.confirmCancelDesc}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate(selectedTransaction!.id)}
              disabled={cancelMutation.isPending}
              data-testid="button-confirm-cancel"
            >
              {language === 'es' ? 'Cancelar Transacción' : 'Cancel Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.transactionDetails}</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">{t.basicInfo}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.direction}</p>
                    <div className="mt-1">{getDirectionBadge(selectedTransaction.direction)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.status}</p>
                    <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.category}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {getCategoryIcon(selectedTransaction.category)}
                      <span className="font-medium">{getCategoryLabel(selectedTransaction.category)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.dueDate}</p>
                    <p className="font-medium">{formatDate(selectedTransaction.dueDate)}</p>
                  </div>
                  {selectedTransaction.performedDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t.performedDate}</p>
                      <p className="font-medium">{formatDate(selectedTransaction.performedDate)}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">{t.financialInfo}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.grossAmount}</p>
                    <p className="font-medium text-lg">{formatCurrency(selectedTransaction.grossAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.fees}</p>
                    <p className="font-medium text-lg">{formatCurrency(selectedTransaction.fees || '0')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.netAmount}</p>
                    <p className="font-medium text-lg">{formatCurrency(selectedTransaction.netAmount)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.payerRole}</p>
                    <Badge variant="outline">{getRoleLabel(selectedTransaction.payerRole)}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.payeeRole}</p>
                    <Badge variant="outline">{getRoleLabel(selectedTransaction.payeeRole)}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">{t.additionalInfo}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                    <p className="font-medium">{selectedTransaction.description}</p>
                  </div>
                  {selectedTransaction.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t.notes}</p>
                      <p className="font-medium">{selectedTransaction.notes}</p>
                    </div>
                  )}
                  {selectedTransaction.paymentMethod && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t.paymentMethod}</p>
                      <p className="font-medium">{selectedTransaction.paymentMethod}</p>
                    </div>
                  )}
                  {selectedTransaction.paymentReference && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t.paymentReference}</p>
                      <p className="font-medium">{selectedTransaction.paymentReference}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">{t.auditTrail}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedTransaction.createdAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t.createdAt}</p>
                      <p className="font-medium">{formatDateTime(selectedTransaction.createdAt)}</p>
                    </div>
                  )}
                  {selectedTransaction.updatedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t.updatedAt}</p>
                      <p className="font-medium">{formatDateTime(selectedTransaction.updatedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              {language === 'es' ? 'Cerrar' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
