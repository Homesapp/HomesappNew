import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Calendar, User, Building2 } from "lucide-react";
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

type IncomeTransaction = {
  id: string;
  beneficiaryId: string;
  category: "referral_client" | "referral_owner" | "rental_commission" | "other_income";
  amount: number;
  description?: string;
  propertyId?: string;
  status: string;
  transactionDate: string;
  payoutBatchId?: string;
  createdAt: string;
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

type AccountantAssignment = {
  id: string;
  assignmentType: "property" | "user";
  propertyId?: string;
  userId?: string;
  createdAt: string;
};

const categoryLabels: Record<string, { es: string; en: string }> = {
  referral_client: { es: "Referido Cliente", en: "Client Referral" },
  referral_owner: { es: "Referido Propietario", en: "Owner Referral" },
  rental_commission: { es: "Comisión Renta", en: "Rental Commission" },
  other_income: { es: "Otro Ingreso", en: "Other Income" },
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

export default function AccountantIncome() {
  const { language } = useLanguage();

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<AccountantAssignment[]>({
    queryKey: ["/api/income/my-assignments"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<IncomeTransaction[]>({
    queryKey: ["/api/income/transactions"],
  });

  const { data: batches, isLoading: batchesLoading } = useQuery<PayoutBatch[]>({
    queryKey: ["/api/income/batches"],
  });

  const isLoading = assignmentsLoading || transactionsLoading || batchesLoading;

  const totalTransactions = transactions?.length || 0;
  const totalAmount = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const draftBatches = batches?.filter(b => b.status === "draft").length || 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Gestión de Ingresos" : "Income Management"}
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            {language === "es" 
              ? "Administra transacciones y lotes de pago"
              : "Manage transactions and payout batches"}
          </p>
        </div>
        <Button data-testid="button-new-transaction">
          <Plus className="h-4 w-4 mr-2" />
          {language === "es" ? "Nueva Transacción" : "New Transaction"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-stat-transactions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Transacciones" : "Transactions"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-transactions">
              {totalTransactions}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-amount">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Monto Total" : "Total Amount"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-amount">
              ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-drafts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Lotes en Borrador" : "Draft Batches"}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-draft-batches">
              {draftBatches}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4" data-testid="tabs-income">
        <TabsList>
          <TabsTrigger value="transactions" data-testid="tab-transactions">
            {language === "es" ? "Transacciones" : "Transactions"}
          </TabsTrigger>
          <TabsTrigger value="batches" data-testid="tab-batches">
            {language === "es" ? "Lotes de Pago" : "Payout Batches"}
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            {language === "es" ? "Mis Asignaciones" : "My Assignments"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card data-testid="card-transactions-list">
            <CardHeader>
              <CardTitle>
                {language === "es" ? "Transacciones de Ingreso" : "Income Transactions"}
              </CardTitle>
              <CardDescription>
                {language === "es"
                  ? "Listado de todas las transacciones creadas"
                  : "List of all created transactions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  {language === "es" ? "Cargando..." : "Loading..."}
                </div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {language === "es"
                    ? "No hay transacciones registradas"
                    : "No transactions registered"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "es" ? "Fecha" : "Date"}</TableHead>
                      <TableHead>{language === "es" ? "Categoría" : "Category"}</TableHead>
                      <TableHead>{language === "es" ? "Beneficiario" : "Beneficiary"}</TableHead>
                      <TableHead>{language === "es" ? "Monto" : "Amount"}</TableHead>
                      <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                        <TableCell>
                          {format(new Date(transaction.transactionDate), "PP", {
                            locale: language === "es" ? es : undefined,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-category-${transaction.id}`}>
                            {categoryLabels[transaction.category]?.[language] || transaction.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.beneficiaryId}
                        </TableCell>
                        <TableCell className="font-bold">
                          ${transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[transaction.status]}>
                            {statusLabels[transaction.status]?.[language] || transaction.status}
                          </Badge>
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
          <Card data-testid="card-batches-list">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {language === "es" ? "Lotes de Pago" : "Payout Batches"}
                </CardTitle>
                <CardDescription>
                  {language === "es"
                    ? "Gestiona los lotes de pago agrupados"
                    : "Manage grouped payout batches"}
                </CardDescription>
              </div>
              <Button variant="outline" data-testid="button-new-batch">
                <Plus className="h-4 w-4 mr-2" />
                {language === "es" ? "Nuevo Lote" : "New Batch"}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card data-testid="card-assignments-list">
            <CardHeader>
              <CardTitle>
                {language === "es" ? "Mis Asignaciones" : "My Assignments"}
              </CardTitle>
              <CardDescription>
                {language === "es"
                  ? "Propiedades y usuarios asignados a ti"
                  : "Properties and users assigned to you"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  {language === "es" ? "Cargando..." : "Loading..."}
                </div>
              ) : !assignments || assignments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {language === "es"
                    ? "No tienes asignaciones activas"
                    : "You have no active assignments"}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id} data-testid={`card-assignment-${assignment.id}`}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          {assignment.assignmentType === "property" ? (
                            <>
                              <Building2 className="h-4 w-4" />
                              {language === "es" ? "Propiedad" : "Property"}
                            </>
                          ) : (
                            <>
                              <User className="h-4 w-4" />
                              {language === "es" ? "Usuario" : "User"}
                            </>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          {assignment.assignmentType === "property" ? (
                            <span>ID: {assignment.propertyId}</span>
                          ) : (
                            <span>ID: {assignment.userId}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {language === "es" ? "Asignado el" : "Assigned on"}{" "}
                          {format(new Date(assignment.createdAt), "PP", {
                            locale: language === "es" ? es : undefined,
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
