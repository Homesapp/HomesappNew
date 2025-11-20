import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
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
  Building2
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalFinancialTransaction, ExternalCondominium, ExternalUnit } from "@shared/schema";
import { insertExternalFinancialTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from 'xlsx';

type AccountingSummary = {
  totalInflow: number;
  totalOutflow: number;
  netBalance: number;
  pendingInflow: number;
  pendingOutflow: number;
  reconciledInflow: number;
  reconciledOutflow: number;
};

type TransactionFormData = z.infer<typeof insertExternalFinancialTransactionSchema>;

export default function ExternalAccounting() {
  const { language } = useLanguage();
  const { toast } = useToast();

  // Filters
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
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { data: summary, isLoading: summaryLoading } = useQuery<AccountingSummary>({
    queryKey: ['/api/external/accounting/summary'],
  });

  const buildTransactionsQueryKey = () => {
    const params = new URLSearchParams();
    if (directionFilter !== "all") params.append("direction", directionFilter);
    if (categoryFilter !== "all") params.append("category", categoryFilter);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (condominiumFilter !== "all") params.append("condominiumId", condominiumFilter);
    if (unitFilter !== "all") params.append("unitId", unitFilter);
    const queryString = params.toString();
    return queryString ? `/api/external/accounting/transactions?${queryString}` : '/api/external/accounting/transactions';
  };

  const { data: transactions, isLoading: transactionsLoading } = useQuery<ExternalFinancialTransaction[]>({
    queryKey: ['/api/external/accounting/transactions', directionFilter, categoryFilter, statusFilter, condominiumFilter, unitFilter],
    queryFn: async () => {
      const url = buildTransactionsQueryKey();
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  const { data: condominiums } = useQuery<ExternalCondominium[]>({
    queryKey: ['/api/external-condominiums'],
  });

  const { data: units } = useQuery<ExternalUnit[]>({
    queryKey: ['/api/external-units'],
  });

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    if (dateFilter === "all") return transactions;
    
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (dateFilter) {
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

    return transactions.filter(t => {
      const transactionDate = t.dueDate ? new Date(t.dueDate) : null;
      if (!transactionDate) return false;
      
      if (start && transactionDate < start) return false;
      if (end && transactionDate > end) return false;
      
      return true;
    });
  }, [transactions, dateFilter, customStartDate, customEndDate]);

  // Sort transactions
  const sortedAndFilteredTransactions = useMemo(() => {
    if (!filteredTransactions) return [];
    if (!sortColumn) return filteredTransactions;

    const sorted = [...filteredTransactions].sort((a, b) => {
      let aVal: any = (a as any)[sortColumn];
      let bVal: any = (b as any)[sortColumn];

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as any)?.toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredTransactions, sortColumn, sortDirection]);

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
    },
  });

  const editForm = useForm<Partial<TransactionFormData>>({
    resolver: zodResolver(insertExternalFinancialTransactionSchema.partial()),
  });

  const createMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      return await apiRequest('/api/external/accounting/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/transactions'] });
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
      return await apiRequest(`/api/external/accounting/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/transactions'] });
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
      return await apiRequest(`/api/external/accounting/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/transactions'] });
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
    subtitle: 'Resumen financiero de operaciones',
    summaryTab: 'Resumen',
    transactionsTab: 'Transacciones',
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
  } : {
    title: 'Financial Accounting',
    subtitle: 'Financial summary of operations',
    summaryTab: 'Summary',
    transactionsTab: 'Transactions',
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
      performedDate: transaction.performedDate ? format(new Date(transaction.performedDate), 'yyyy-MM-dd') : "",
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
    if (!sortedAndFilteredTransactions || sortedAndFilteredTransactions.length === 0) {
      toast({
        title: t.error,
        description: t.noData,
        variant: "destructive",
      });
      return;
    }

    const exportData = sortedAndFilteredTransactions.map(t => ({
      [t.dueDate]: formatDate(t.dueDate),
      [t.direction]: t.direction === 'inflow' ? t.inflow : t.outflow,
      [t.category]: getCategoryLabel(t.category),
      [t.description]: t.description,
      [t.payerRole]: getRoleLabel(t.payerRole),
      [t.payeeRole]: getRoleLabel(t.payeeRole),
      [t.grossAmount]: parseFloat(t.grossAmount),
      [t.fees]: parseFloat(t.fees || '0'),
      [t.netAmount]: parseFloat(t.netAmount),
      [t.status]: t[t.status as keyof typeof t] || t.status,
      [t.paymentMethod]: t.paymentMethod || 'N/A',
      [t.paymentReference]: t.paymentReference || 'N/A',
      [t.performedDate]: formatDate(t.performedDate),
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
      description: language === 'es' ? `Se exportaron ${sortedAndFilteredTransactions.length} transacciones` : `Exported ${sortedAndFilteredTransactions.length} transactions`,
    });
  };

  const isPositiveBalance = summary ? summary.netBalance >= 0 : true;

  const activeFilters = [directionFilter, categoryFilter, statusFilter, condominiumFilter, unitFilter].filter(f => f !== "all").length + (dateFilter !== "all" ? 1 : 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-financial-title">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList>
          <TabsTrigger value="summary" data-testid="tab-summary">{t.summaryTab}</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">{t.transactionsTab}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {summaryLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !summary ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t.noData}</p>
            </div>
          ) : (
            <>
              <Card className="hover-elevate border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6" />
                    {t.netBalance}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-5xl font-bold ${isPositiveBalance ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`} data-testid="text-net-balance">
                      {formatCurrency(summary.netBalance)}
                    </p>
                    {isPositiveBalance ? (
                      <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-500" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {formatCurrency(summary.totalInflow)} {t.income} - {formatCurrency(summary.totalOutflow)} {t.expenses}
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.totalIncome}</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-500" data-testid="text-total-income">
                      {formatCurrency(summary.totalInflow)}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3" />
                      {t.reconciled}: {formatCurrency(summary.reconciledInflow)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.totalExpenses}</CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-500" data-testid="text-total-expenses">
                      {formatCurrency(summary.totalOutflow)}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3" />
                      {t.reconciled}: {formatCurrency(summary.reconciledOutflow)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.pendingIncome}</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-pending-income">
                      {formatCurrency(summary.pendingInflow)}
                    </div>
                    <Badge variant="outline" className="mt-2">
                      {t.pending}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.pendingExpenses}</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-pending-expenses">
                      {formatCurrency(summary.pendingOutflow)}
                    </div>
                    <Badge variant="outline" className="mt-2">
                      {t.pending}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.reconciledIncome}</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-500" data-testid="text-reconciled-income">
                      {formatCurrency(summary.reconciledInflow)}
                    </div>
                    <Badge variant="default" className="mt-2">
                      {t.reconciled}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t.reconciledExpenses}</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-reconciled-expenses">
                      {formatCurrency(summary.reconciledOutflow)}
                    </div>
                    <Badge variant="default" className="mt-2">
                      {t.reconciled}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setShowCreateDialog(true)}
                data-testid="button-create-transaction"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t.createTransaction}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={!sortedAndFilteredTransactions || sortedAndFilteredTransactions.length === 0}
                data-testid="button-export-excel"
              >
                <Download className="h-4 w-4 mr-1" />
                {t.exportExcel}
              </Button>
            </div>
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                data-testid="button-view-cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                data-testid="button-view-table"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4" />
                  {t.filters}
                  {activeFilters > 0 && (
                    <Badge variant="secondary">{activeFilters}</Badge>
                  )}
                </CardTitle>
                {activeFilters > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t.clearFilters}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Select value={directionFilter} onValueChange={setDirectionFilter}>
                  <SelectTrigger data-testid="select-direction-filter">
                    <SelectValue placeholder={t.direction} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    <SelectItem value="inflow">{t.inflow}</SelectItem>
                    <SelectItem value="outflow">{t.outflow}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category-filter">
                    <SelectValue placeholder={t.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder={t.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    <SelectItem value="pending">{t.pending}</SelectItem>
                    <SelectItem value="posted">{t.posted}</SelectItem>
                    <SelectItem value="reconciled">{t.reconciled}</SelectItem>
                    <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={condominiumFilter} onValueChange={setCondominiumFilter}>
                  <SelectTrigger data-testid="select-condominium-filter">
                    <SelectValue placeholder={t.condominium} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    {condominiums?.map(condo => (
                      <SelectItem key={condo.id} value={condo.id}>
                        {condo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={unitFilter} onValueChange={setUnitFilter}>
                  <SelectTrigger data-testid="select-unit-filter">
                    <SelectValue placeholder={t.unit} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    {units?.filter(u => condominiumFilter === "all" || u.condominiumId === condominiumFilter).map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unitNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger data-testid="select-date-filter">
                    <SelectValue placeholder={t.dateRange} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    <SelectItem value="this_month">{t.thisMonth}</SelectItem>
                    <SelectItem value="last_3_months">{t.last3Months}</SelectItem>
                    <SelectItem value="last_6_months">{t.last6Months}</SelectItem>
                    <SelectItem value="this_year">{t.thisYear}</SelectItem>
                    <SelectItem value="custom">{t.customRange}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateFilter === "custom" && (
                <div className="grid grid-cols-2 gap-4 mt-4">
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
            </CardContent>
          </Card>

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
          ) : !sortedAndFilteredTransactions || sortedAndFilteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t.noData}</p>
              </CardContent>
            </Card>
          ) : viewMode === "cards" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedAndFilteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="hover-elevate" data-testid={`card-transaction-${transaction.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(transaction.category)}
                      <span className="font-semibold text-sm">{getCategoryLabel(transaction.category)}</span>
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
                        <Calendar className="h-3 w-3" />
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
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('dueDate')}>
                          {t.dueDate} {getSortIcon('dueDate')}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('direction')}>
                          {t.direction} {getSortIcon('direction')}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('category')}>
                          {t.category} {getSortIcon('category')}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('description')}>
                          {t.description} {getSortIcon('description')}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('payerRole')}>
                          {t.payerRole} {getSortIcon('payerRole')}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('payeeRole')}>
                          {t.payeeRole} {getSortIcon('payeeRole')}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('netAmount')}>
                          {t.amount} {getSortIcon('netAmount')}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('status')}>
                          {t.status} {getSortIcon('status')}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('paymentMethod')}>
                          {t.paymentMethod} {getSortIcon('paymentMethod')}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('paymentReference')}>
                          {t.paymentReference} {getSortIcon('paymentReference')}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('performedDate')}>
                          {t.performedDate} {getSortIcon('performedDate')}
                        </TableHead>
                        <TableHead className="text-right">{t.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAndFilteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                          <TableCell>{formatDate(transaction.dueDate)}</TableCell>
                          <TableCell>{getDirectionBadge(transaction.direction)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(transaction.category)}
                              <Badge variant="outline">{getCategoryLabel(transaction.category)}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                          <TableCell><Badge variant="outline">{getRoleLabel(transaction.payerRole)}</Badge></TableCell>
                          <TableCell><Badge variant="outline">{getRoleLabel(transaction.payeeRole)}</Badge></TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(transaction.netAmount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell>{transaction.paymentMethod || 'N/A'}</TableCell>
                          <TableCell>{transaction.paymentReference || 'N/A'}</TableCell>
                          <TableCell>{formatDate(transaction.performedDate)}</TableCell>
                          <TableCell className="text-right">
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
                </div>
              </CardContent>
            </Card>
          )}
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
            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
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
                      <FormLabel>{t.fees}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} data-testid="input-create-fees" />
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
                        <Input type="number" step="0.01" {...field} data-testid="input-create-net-amount" />
                      </FormControl>
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
                      <Input type="date" {...field} data-testid="input-create-due-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.unit}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="input-create-unit">
                          <SelectValue placeholder={t.unit} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units?.map(unit => (
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

              <FormField
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.notes}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="input-create-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
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
                      <Input type="date" {...field} value={field.value || ""} data-testid="input-edit-performed-date" />
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
