import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Home,
  Search,
  Download,
  Eye,
  Mail,
  Phone,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { 
  ExternalUnitOwner, 
  ExternalUnit, 
  ExternalCondominium,
  ExternalRentalContract,
  ExternalFinancialTransaction,
  ExternalPayment,
} from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface OwnerPortfolio {
  owner: ExternalUnitOwner;
  units: ExternalUnit[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  activeContracts: number;
  occupancyRate: number;
}

export default function ExternalOwnerPortfolio() {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'units' | 'income' | 'balance'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);

  const { data: owners, isLoading: ownersLoading } = useQuery<ExternalUnitOwner[]>({
    queryKey: ['/api/external-unit-owners'],
  });

  const { data: units } = useQuery<ExternalUnit[]>({
    queryKey: ['/api/external-units'],
  });

  const { data: condominiums } = useQuery<ExternalCondominium[]>({
    queryKey: ['/api/external-condominiums'],
  });

  const { data: contracts } = useQuery<ExternalRentalContract[]>({
    queryKey: ['/api/external-rental-contracts'],
  });

  const { data: transactions } = useQuery<ExternalFinancialTransaction[]>({
    queryKey: ['/api/external-financial-transactions'],
  });

  // Build owner portfolios
  const portfolios = useMemo(() => {
    if (!owners || !units || !contracts || !transactions) return [];

    // Group owners by unique owner (same name + email = same person)
    const ownerGroups = new Map<string, ExternalUnitOwner[]>();
    owners.forEach(owner => {
      const key = `${owner.ownerName.toLowerCase()}_${owner.ownerEmail?.toLowerCase() || ''}`;
      if (!ownerGroups.has(key)) {
        ownerGroups.set(key, []);
      }
      ownerGroups.get(key)!.push(owner);
    });

    // Build portfolio for each unique owner
    const result: OwnerPortfolio[] = [];
    ownerGroups.forEach((ownerInstances, key) => {
      // Use the most recent owner instance as the primary one
      const primaryOwner = ownerInstances.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      // Get all unit IDs for this owner
      const ownerUnitIds = ownerInstances.map(o => o.unitId);
      const ownerUnits = units.filter(u => ownerUnitIds.includes(u.id));

      // Calculate financials
      const ownerTransactions = transactions.filter(t => 
        ownerInstances.some(o => o.id === t.ownerId) ||
        ownerUnitIds.includes(t.unitId || '')
      );

      const totalIncome = ownerTransactions
        .filter(t => t.direction === 'inflow' && t.payeeRole === 'owner')
        .reduce((sum, t) => sum + parseFloat(t.grossAmount || '0'), 0);

      const totalExpenses = ownerTransactions
        .filter(t => t.direction === 'outflow' && t.payerRole === 'owner')
        .reduce((sum, t) => sum + parseFloat(t.grossAmount || '0'), 0);

      // Active contracts
      const activeContracts = contracts.filter(c => 
        ownerUnitIds.includes(c.unitId) && c.status === 'active'
      ).length;

      // Occupancy rate
      const occupancyRate = ownerUnits.length > 0 ? (activeContracts / ownerUnits.length) * 100 : 0;

      result.push({
        owner: primaryOwner,
        units: ownerUnits,
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        activeContracts,
        occupancyRate,
      });
    });

    return result;
  }, [owners, units, contracts, transactions]);

  // Filter and sort portfolios
  const filteredPortfolios = useMemo(() => {
    let filtered = portfolios.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      return !searchTerm ||
        p.owner.ownerName.toLowerCase().includes(searchLower) ||
        p.owner.ownerEmail?.toLowerCase().includes(searchLower) ||
        p.owner.ownerPhone?.includes(searchTerm);
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.owner.ownerName.localeCompare(b.owner.ownerName);
          break;
        case 'units':
          comparison = a.units.length - b.units.length;
          break;
        case 'income':
          comparison = a.totalIncome - b.totalIncome;
          break;
        case 'balance':
          comparison = a.balance - b.balance;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [portfolios, searchTerm, sortBy, sortOrder]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalOwners: filteredPortfolios.length,
      totalUnits: filteredPortfolios.reduce((sum, p) => sum + p.units.length, 0),
      totalIncome: filteredPortfolios.reduce((sum, p) => sum + p.totalIncome, 0),
      totalExpenses: filteredPortfolios.reduce((sum, p) => sum + p.totalExpenses, 0),
      totalBalance: filteredPortfolios.reduce((sum, p) => sum + p.balance, 0),
      avgOccupancy: filteredPortfolios.length > 0 
        ? filteredPortfolios.reduce((sum, p) => sum + p.occupancyRate, 0) / filteredPortfolios.length 
        : 0,
    };
  }, [filteredPortfolios]);

  const selectedPortfolio = selectedOwnerId 
    ? filteredPortfolios.find(p => p.owner.id === selectedOwnerId)
    : null;

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
      'Ingresos',
      'Gastos',
      'Balance',
      'Ocupación %',
    ].join(',');

    const rows = filteredPortfolios.map(p => [
      p.owner.ownerName,
      p.owner.ownerEmail || '',
      p.owner.ownerPhone || '',
      p.units.length,
      p.totalIncome.toFixed(2),
      p.totalExpenses.toFixed(2),
      p.balance.toFixed(2),
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
    condominium: 'Condominio',
    status: 'Estado',
    active: 'Activo',
    suspended: 'Suspendido',
    rented: 'Rentado',
    available: 'Disponible',
    close: 'Cerrar',
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
    condominium: 'Condominium',
    status: 'Status',
    active: 'Active',
    suspended: 'Suspended',
    rented: 'Rented',
    available: 'Available',
    close: 'Close',
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" data-testid="button-export">
          <Download className="mr-2 h-4 w-4" />
          {t.export}
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalOwners}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-owners">{totals.totalOwners}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalUnits}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-units">{totals.totalUnits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalIncome}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600" data-testid="text-total-income">
              {formatCurrency(totals.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalExpenses}</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-600" data-testid="text-total-expenses">
              {formatCurrency(totals.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalBalance}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-lg font-bold",
              totals.totalBalance >= 0 ? "text-green-600" : "text-red-600"
            )} data-testid="text-total-balance">
              {formatCurrency(totals.totalBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.avgOccupancy}</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="flex-1" data-testid="select-sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t.name}</SelectItem>
                  <SelectItem value="units">{t.units}</SelectItem>
                  <SelectItem value="income">{t.income}</SelectItem>
                  <SelectItem value="balance">{t.balance}</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                data-testid="button-sort-order"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owners Table */}
      <Card>
        <CardContent className="p-0">
          {ownersLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : filteredPortfolios.length === 0 ? (
            <div className="py-12 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">{t.noOwners}</h3>
              <p className="text-sm text-muted-foreground">{t.noOwnersDesc}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.owner}</TableHead>
                    <TableHead>{t.contact}</TableHead>
                    <TableHead className="text-right">{t.units}</TableHead>
                    <TableHead className="text-right">{t.income}</TableHead>
                    <TableHead className="text-right">{t.expenses}</TableHead>
                    <TableHead className="text-right">{t.balance}</TableHead>
                    <TableHead className="text-right">{t.occupancy}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPortfolios.map(portfolio => (
                    <TableRow 
                      key={portfolio.owner.id} 
                      data-testid={`row-owner-${portfolio.owner.id}`}
                      className="hover-elevate"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{portfolio.owner.ownerName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
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
                      <TableCell className="text-right">
                        <Badge variant="outline">{portfolio.units.length}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(portfolio.totalIncome)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {formatCurrency(portfolio.totalExpenses)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        <span className={cn(
                          portfolio.balance >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(portfolio.balance)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={portfolio.occupancyRate >= 70 ? "default" : "secondary"}>
                          {portfolio.occupancyRate.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOwnerId(portfolio.owner.id)}
                          data-testid={`button-view-${portfolio.owner.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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

              {/* Units List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t.unitDetails}</h3>
                <div className="space-y-2">
                  {selectedPortfolio.units.map(unit => {
                    const isRented = contracts?.some(c => c.unitId === unit.id && c.status === 'active');
                    return (
                      <div
                        key={unit.id}
                        className="p-4 rounded-lg border flex items-center justify-between hover-elevate"
                      >
                        <div className="flex items-center gap-4">
                          <Home className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{unit.unitNumber}</p>
                            <p className="text-sm text-muted-foreground">{getCondoName(unit.id)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={isRented ? "default" : "outline"}>
                            {isRented ? t.rented : t.available}
                          </Badge>
                          <Link href={`/external/units/${unit.id}`}>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
