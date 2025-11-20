import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type AccountingSummary = {
  totalInflow: number;
  totalOutflow: number;
  netBalance: number;
  pendingInflow: number;
  pendingOutflow: number;
  reconciledInflow: number;
  reconciledOutflow: number;
};

export default function ExternalFinancialDashboard() {
  const { language } = useLanguage();

  const { data: summary, isLoading } = useQuery<AccountingSummary>({
    queryKey: ['/api/external/accounting/summary'],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const t = language === 'es' ? {
    title: 'Contabilidad Financiera',
    subtitle: 'Resumen financiero de operaciones',
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
  } : {
    title: 'Financial Accounting',
    subtitle: 'Financial summary of operations',
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
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
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
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t.noData}</p>
        </div>
      </div>
    );
  }

  const isPositiveBalance = summary.netBalance >= 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-financial-title">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      {/* Main Balance Card */}
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

      {/* Income/Expense Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Total Income */}
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

        {/* Total Expenses */}
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

      {/* Pending Transactions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Income */}
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

        {/* Pending Expenses */}
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

      {/* Reconciled Transactions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Reconciled Income */}
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

        {/* Reconciled Expenses */}
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
    </div>
  );
}
