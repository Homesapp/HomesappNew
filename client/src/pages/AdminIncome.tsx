import { useQuery } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, Calendar, Download } from "lucide-react";
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
import { useState } from "react";

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

export default function AdminIncome() {
  const { language } = useLanguage();
  const [reportGroupBy, setReportGroupBy] = useState<string>("category");

  const { data: reports, isLoading: reportsLoading } = useQuery<IncomeReport[]>({
    queryKey: ["/api/income/reports", { groupBy: reportGroupBy }],
  });

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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {reportGroupBy === "category" && (language === "es" ? "Categoría" : "Category")}
                        {reportGroupBy === "beneficiary" && (language === "es" ? "Beneficiario" : "Beneficiary")}
                        {reportGroupBy === "property" && (language === "es" ? "Propiedad" : "Property")}
                        {["day", "week", "month"].includes(reportGroupBy) && (language === "es" ? "Periodo" : "Period")}
                      </TableHead>
                      <TableHead>{language === "es" ? "Transacciones" : "Transactions"}</TableHead>
                      <TableHead>{language === "es" ? "Monto Total" : "Total Amount"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report, index) => (
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "es" ? "Número" : "Number"}</TableHead>
                      <TableHead>{language === "es" ? "Fecha" : "Date"}</TableHead>
                      <TableHead>{language === "es" ? "Monto Total" : "Total Amount"}</TableHead>
                      <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                      <TableHead>{language === "es" ? "Acciones" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
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
                    {commissionConfigs.map((config) => (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
