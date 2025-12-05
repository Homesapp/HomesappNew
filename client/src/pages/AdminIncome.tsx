import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, Calendar, Download, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type IncomeReport = {
  category?: string;
  beneficiaryId?: string;
  propertyId?: string;
  date?: string;
  totalAmount: number;
  transactionCount: number;
};

type PayoutBatch = {
  id: string;
  batchNumber: string;
  status: "draft" | "approved" | "rejected" | "paid" | "cancelled";
  totalAmount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
};

type RentalCommissionConfig = {
  id: string;
  propertyId?: string;
  userId?: string;
  commissionPercentage: number;
  notes?: string;
  createdAt: string;
};

const statusLabels: Record<string, { es: string; en: string }> = {
  draft: { es: "Borrador", en: "Draft" },
  approved: { es: "Aprobado", en: "Approved" },
  rejected: { es: "Rechazado", en: "Rejected" },
  paid: { es: "Pagado", en: "Paid" },
  cancelled: { es: "Cancelado", en: "Cancelled" },
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  approved: "bg-blue-500",
  rejected: "bg-red-500",
  paid: "bg-green-500",
  cancelled: "bg-gray-400",
};

type SortOrder = "asc" | "desc";

export default function AdminIncome() {
  const { language } = useLanguage();
  const [reportGroupBy, setReportGroupBy] = useState<string>("category");
  
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPerPage, setReportsPerPage] = useState(10);
  const [reportsSortField, setReportsSortField] = useState<"group" | "count" | "amount">("amount");
  const [reportsSortOrder, setReportsSortOrder] = useState<SortOrder>("desc");
  
  const [batchesPage, setBatchesPage] = useState(1);
  const [batchesPerPage, setBatchesPerPage] = useState(10);
  const [batchesSortField, setBatchesSortField] = useState<"number" | "date" | "amount" | "status">("date");
  const [batchesSortOrder, setBatchesSortOrder] = useState<SortOrder>("desc");
  
  const [configsPage, setConfigsPage] = useState(1);
  const [configsPerPage, setConfigsPerPage] = useState(10);

  const { data: reports, isLoading: reportsLoading } = useQuery<IncomeReport[]>({
    queryKey: ["/api/income/reports", { groupBy: reportGroupBy }],
  });

  useEffect(() => {
    setReportsPage(1);
  }, [reportGroupBy]);

  const { data: batches, isLoading: batchesLoading } = useQuery<PayoutBatch[]>({
    queryKey: ["/api/income/batches"],
  });

  const { data: commissionConfigs, isLoading: configsLoading } = useQuery<RentalCommissionConfig[]>({
    queryKey: ["/api/income/commission-configs"],
  });

  const isLoading = reportsLoading || batchesLoading || configsLoading;

  const totalRevenue = reports?.reduce((sum, r) => sum + r.totalAmount, 0) || 0;
  const totalTransactions = reports?.reduce((sum, r) => sum + r.transactionCount, 0) || 0;
  const pendingApprovals = batches?.filter(b => b.status === "draft").length || 0;

  const sortedReports = useMemo(() => {
    if (!reports) return [];
    return [...reports].sort((a, b) => {
      let comparison = 0;
      switch (reportsSortField) {
        case "group":
          comparison = (a.category || a.beneficiaryId || a.propertyId || a.date || "").localeCompare(
            b.category || b.beneficiaryId || b.propertyId || b.date || ""
          );
          break;
        case "count":
          comparison = a.transactionCount - b.transactionCount;
          break;
        case "amount":
          comparison = a.totalAmount - b.totalAmount;
          break;
      }
      return reportsSortOrder === "asc" ? comparison : -comparison;
    });
  }, [reports, reportsSortField, reportsSortOrder]);

  const reportsTotalPages = Math.max(1, Math.ceil(sortedReports.length / reportsPerPage));
  const safeReportsPage = Math.min(reportsPage, reportsTotalPages);
  const paginatedReports = useMemo(() => {
    const start = (safeReportsPage - 1) * reportsPerPage;
    return sortedReports.slice(start, start + reportsPerPage);
  }, [sortedReports, safeReportsPage, reportsPerPage]);

  useEffect(() => {
    if (reportsPage > reportsTotalPages && reportsTotalPages > 0) {
      setReportsPage(reportsTotalPages);
    }
  }, [reportsTotalPages, reportsPage]);

  const sortedBatches = useMemo(() => {
    if (!batches) return [];
    return [...batches].sort((a, b) => {
      let comparison = 0;
      switch (batchesSortField) {
        case "number":
          comparison = a.batchNumber.localeCompare(b.batchNumber);
          break;
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "amount":
          comparison = a.totalAmount - b.totalAmount;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return batchesSortOrder === "asc" ? comparison : -comparison;
    });
  }, [batches, batchesSortField, batchesSortOrder]);

  const batchesTotalPages = Math.max(1, Math.ceil(sortedBatches.length / batchesPerPage));
  const safeBatchesPage = Math.min(batchesPage, batchesTotalPages);
  const paginatedBatches = useMemo(() => {
    const start = (safeBatchesPage - 1) * batchesPerPage;
    return sortedBatches.slice(start, start + batchesPerPage);
  }, [sortedBatches, safeBatchesPage, batchesPerPage]);

  useEffect(() => {
    if (batchesPage > batchesTotalPages && batchesTotalPages > 0) {
      setBatchesPage(batchesTotalPages);
    }
  }, [batchesTotalPages, batchesPage]);

  const configsTotalPages = Math.max(1, Math.ceil((commissionConfigs?.length || 0) / configsPerPage));
  const safeConfigsPage = Math.min(configsPage, configsTotalPages);

  useEffect(() => {
    if (configsPage > configsTotalPages && configsTotalPages > 0) {
      setConfigsPage(configsTotalPages);
    }
  }, [configsTotalPages, configsPage]);

  const paginatedConfigs = useMemo(() => {
    if (!commissionConfigs) return [];
    const start = (safeConfigsPage - 1) * configsPerPage;
    return commissionConfigs.slice(start, start + configsPerPage);
  }, [commissionConfigs, safeConfigsPage, configsPerPage]);

  const handleReportsSort = (field: "group" | "count" | "amount") => {
    if (reportsSortField === field) {
      setReportsSortOrder(reportsSortOrder === "asc" ? "desc" : "asc");
    } else {
      setReportsSortField(field);
      setReportsSortOrder("asc");
    }
    setReportsPage(1);
  };

  const handleBatchesSort = (field: "number" | "date" | "amount" | "status") => {
    if (batchesSortField === field) {
      setBatchesSortOrder(batchesSortOrder === "asc" ? "desc" : "asc");
    } else {
      setBatchesSortField(field);
      setBatchesSortOrder("asc");
    }
    setBatchesPage(1);
  };

  const ReportsSortIcon = ({ field }: { field: "group" | "count" | "amount" }) => {
    if (reportsSortField !== field) return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return reportsSortOrder === "asc" ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  const BatchesSortIcon = ({ field }: { field: "number" | "date" | "amount" | "status" }) => {
    if (batchesSortField !== field) return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return batchesSortOrder === "asc" ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Dashboard de Ingresos" : "Income Dashboard"}
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            {language === "es"
              ? "Reportes y gestión de pagos"
              : "Reports and payment management"}
          </p>
        </div>
        <Button variant="outline" data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          {language === "es" ? "Exportar" : "Export"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-stat-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Ingresos Totales" : "Total Revenue"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-transactions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Transacciones" : "Transactions"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-transactions">
              {totalTransactions}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-approvals">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Pendientes Aprobación" : "Pending Approval"}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-approvals">
              {pendingApprovals}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-configs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Configuraciones" : "Configurations"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-configs">
              {commissionConfigs?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-4" data-testid="tabs-admin-income">
        <TabsList>
          <TabsTrigger value="reports" data-testid="tab-reports">
            {language === "es" ? "Reportes" : "Reports"}
          </TabsTrigger>
          <TabsTrigger value="batches" data-testid="tab-batches">
            {language === "es" ? "Aprobaciones" : "Approvals"}
          </TabsTrigger>
          <TabsTrigger value="configs" data-testid="tab-configs">
            {language === "es" ? "Configuración" : "Configuration"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <Card data-testid="card-reports">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {language === "es" ? "Reportes de Ingresos" : "Income Reports"}
                </CardTitle>
                <CardDescription>
                  {language === "es"
                    ? "Análisis detallado de ingresos por categoría"
                    : "Detailed income analysis by category"}
                </CardDescription>
              </div>
              <Select value={reportGroupBy} onValueChange={setReportGroupBy}>
                <SelectTrigger className="w-[200px]" data-testid="select-group-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">
                    {language === "es" ? "Por Categoría" : "By Category"}
                  </SelectItem>
                  <SelectItem value="beneficiary">
                    {language === "es" ? "Por Beneficiario" : "By Beneficiary"}
                  </SelectItem>
                  <SelectItem value="property">
                    {language === "es" ? "Por Propiedad" : "By Property"}
                  </SelectItem>
                  <SelectItem value="day">
                    {language === "es" ? "Por Día" : "By Day"}
                  </SelectItem>
                  <SelectItem value="week">
                    {language === "es" ? "Por Semana" : "By Week"}
                  </SelectItem>
                  <SelectItem value="month">
                    {language === "es" ? "Por Mes" : "By Month"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  {language === "es" ? "Cargando reportes..." : "Loading reports..."}
                </div>
              ) : !reports || reports.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {language === "es"
                    ? "No hay datos de reportes disponibles"
                    : "No report data available"}
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer select-none"
                          onClick={() => handleReportsSort("group")}
                          data-testid="th-reports-group"
                        >
                          <div className="flex items-center">
                            {reportGroupBy === "category" && (language === "es" ? "Categoría" : "Category")}
                            {reportGroupBy === "beneficiary" && (language === "es" ? "Beneficiario" : "Beneficiary")}
                            {reportGroupBy === "property" && (language === "es" ? "Propiedad" : "Property")}
                            {["day", "week", "month"].includes(reportGroupBy) && (language === "es" ? "Periodo" : "Period")}
                            <ReportsSortIcon field="group" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none"
                          onClick={() => handleReportsSort("count")}
                          data-testid="th-reports-count"
                        >
                          <div className="flex items-center">
                            {language === "es" ? "Transacciones" : "Transactions"}
                            <ReportsSortIcon field="count" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none"
                          onClick={() => handleReportsSort("amount")}
                          data-testid="th-reports-amount"
                        >
                          <div className="flex items-center">
                            {language === "es" ? "Monto Total" : "Total Amount"}
                            <ReportsSortIcon field="amount" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedReports.map((report, index) => (
                        <TableRow key={index} data-testid={`row-report-${index}`}>
                          <TableCell className="font-medium">
                            {report.category || report.beneficiaryId || report.propertyId || report.date || "-"}
                          </TableCell>
                          <TableCell>{report.transactionCount}</TableCell>
                          <TableCell className="font-bold">
                            ${report.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground" data-testid="text-reports-pagination-info">
                        {language === "es" ? "Mostrando" : "Showing"} {Math.min((safeReportsPage - 1) * reportsPerPage + 1, sortedReports.length)}-{Math.min(safeReportsPage * reportsPerPage, sortedReports.length)} {language === "es" ? "de" : "of"} {sortedReports.length}
                      </span>
                      <Select
                        value={reportsPerPage.toString()}
                        onValueChange={(val) => {
                          setReportsPerPage(Number(val));
                          setReportsPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[80px]" data-testid="select-reports-per-page">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReportsPage(p => Math.max(1, p - 1))}
                        disabled={safeReportsPage <= 1}
                        data-testid="button-reports-prev-page"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {language === "es" ? "Anterior" : "Previous"}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {safeReportsPage} / {reportsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReportsPage(p => Math.min(reportsTotalPages, p + 1))}
                        disabled={safeReportsPage >= reportsTotalPages}
                        data-testid="button-reports-next-page"
                      >
                        {language === "es" ? "Siguiente" : "Next"}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <Card data-testid="card-batch-approvals">
            <CardHeader>
              <CardTitle>
                {language === "es" ? "Lotes Pendientes de Aprobación" : "Pending Batch Approvals"}
              </CardTitle>
              <CardDescription>
                {language === "es"
                  ? "Revisa y aprueba los lotes de pago"
                  : "Review and approve payout batches"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batchesLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  {language === "es" ? "Cargando..." : "Loading..."}
                </div>
              ) : !batches || batches.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {language === "es"
                    ? "No hay lotes de pago registrados"
                    : "No payout batches registered"}
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer select-none"
                          onClick={() => handleBatchesSort("number")}
                          data-testid="th-batches-number"
                        >
                          <div className="flex items-center">
                            {language === "es" ? "Número" : "Number"}
                            <BatchesSortIcon field="number" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none"
                          onClick={() => handleBatchesSort("date")}
                          data-testid="th-batches-date"
                        >
                          <div className="flex items-center">
                            {language === "es" ? "Fecha" : "Date"}
                            <BatchesSortIcon field="date" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none"
                          onClick={() => handleBatchesSort("amount")}
                          data-testid="th-batches-amount"
                        >
                          <div className="flex items-center">
                            {language === "es" ? "Monto Total" : "Total Amount"}
                            <BatchesSortIcon field="amount" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none"
                          onClick={() => handleBatchesSort("status")}
                          data-testid="th-batches-status"
                        >
                          <div className="flex items-center">
                            {language === "es" ? "Estado" : "Status"}
                            <BatchesSortIcon field="status" />
                          </div>
                        </TableHead>
                        <TableHead>{language === "es" ? "Acciones" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedBatches.map((batch) => (
                        <TableRow key={batch.id} data-testid={`row-batch-${batch.id}`}>
                          <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                          <TableCell>
                            {format(new Date(batch.createdAt), "PP", {
                              locale: language === "es" ? es : undefined,
                            })}
                          </TableCell>
                          <TableCell className="font-bold">
                            ${batch.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[batch.status]} data-testid={`badge-status-${batch.id}`}>
                              {statusLabels[batch.status]?.[language] || batch.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {batch.status === "draft" && (
                              <div className="flex gap-2">
                                <Button size="sm" data-testid={`button-approve-${batch.id}`}>
                                  {language === "es" ? "Aprobar" : "Approve"}
                                </Button>
                                <Button size="sm" variant="destructive" data-testid={`button-reject-${batch.id}`}>
                                  {language === "es" ? "Rechazar" : "Reject"}
                                </Button>
                              </div>
                            )}
                            {batch.status === "approved" && (
                              <Button size="sm" variant="outline" data-testid={`button-mark-paid-${batch.id}`}>
                                {language === "es" ? "Marcar Pagado" : "Mark Paid"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground" data-testid="text-batches-pagination-info">
                        {language === "es" ? "Mostrando" : "Showing"} {Math.min((safeBatchesPage - 1) * batchesPerPage + 1, sortedBatches.length)}-{Math.min(safeBatchesPage * batchesPerPage, sortedBatches.length)} {language === "es" ? "de" : "of"} {sortedBatches.length}
                      </span>
                      <Select
                        value={batchesPerPage.toString()}
                        onValueChange={(val) => {
                          setBatchesPerPage(Number(val));
                          setBatchesPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[80px]" data-testid="select-batches-per-page">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBatchesPage(p => Math.max(1, p - 1))}
                        disabled={safeBatchesPage <= 1}
                        data-testid="button-batches-prev-page"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {language === "es" ? "Anterior" : "Previous"}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {safeBatchesPage} / {batchesTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBatchesPage(p => Math.min(batchesTotalPages, p + 1))}
                        disabled={safeBatchesPage >= batchesTotalPages}
                        data-testid="button-batches-next-page"
                      >
                        {language === "es" ? "Siguiente" : "Next"}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configs" className="space-y-4">
          <Card data-testid="card-commission-configs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {language === "es" ? "Configuración de Comisiones" : "Commission Configuration"}
                </CardTitle>
                <CardDescription>
                  {language === "es"
                    ? "Gestiona porcentajes de comisión por propiedad/usuario"
                    : "Manage commission percentages by property/user"}
                </CardDescription>
              </div>
              <Button data-testid="button-new-config">
                {language === "es" ? "Nueva Configuración" : "New Configuration"}
              </Button>
            </CardHeader>
            <CardContent>
              {configsLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  {language === "es" ? "Cargando..." : "Loading..."}
                </div>
              ) : !commissionConfigs || commissionConfigs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {language === "es"
                    ? "No hay configuraciones de comisión"
                    : "No commission configurations"}
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "es" ? "Tipo" : "Type"}</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>{language === "es" ? "Porcentaje" : "Percentage"}</TableHead>
                        <TableHead>{language === "es" ? "Notas" : "Notes"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedConfigs.map((config) => (
                        <TableRow key={config.id} data-testid={`row-config-${config.id}`}>
                          <TableCell>
                            <Badge variant="outline">
                              {config.propertyId ? (language === "es" ? "Propiedad" : "Property") : (language === "es" ? "Usuario" : "User")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {config.propertyId || config.userId}
                          </TableCell>
                          <TableCell className="font-bold">
                            {config.commissionPercentage}%
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {config.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground" data-testid="text-configs-pagination-info">
                        {language === "es" ? "Mostrando" : "Showing"} {Math.min((safeConfigsPage - 1) * configsPerPage + 1, commissionConfigs.length)}-{Math.min(safeConfigsPage * configsPerPage, commissionConfigs.length)} {language === "es" ? "de" : "of"} {commissionConfigs.length}
                      </span>
                      <Select
                        value={configsPerPage.toString()}
                        onValueChange={(val) => {
                          setConfigsPerPage(Number(val));
                          setConfigsPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[80px]" data-testid="select-configs-per-page">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfigsPage(p => Math.max(1, p - 1))}
                        disabled={safeConfigsPage <= 1}
                        data-testid="button-configs-prev-page"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {language === "es" ? "Anterior" : "Previous"}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {safeConfigsPage} / {configsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfigsPage(p => Math.min(configsTotalPages, p + 1))}
                        disabled={safeConfigsPage >= configsTotalPages}
                        data-testid="button-configs-next-page"
                      >
                        {language === "es" ? "Siguiente" : "Next"}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
