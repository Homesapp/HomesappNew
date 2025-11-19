import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Plus, AlertCircle, AlertTriangle, Filter, Calendar as CalendarIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalPayment, ExternalCondominium, ExternalUnit } from "@shared/schema";
import { insertExternalPaymentSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type PaymentFormData = z.infer<typeof insertExternalPaymentSchema>;

const paymentTypeColors: Record<string, { bg: string; text: string; label: { es: string; en: string } }> = {
  rent: {
    bg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    text: "text-blue-800 dark:text-blue-300",
    label: { es: "Renta", en: "Rent" }
  },
  electricity: {
    bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    text: "text-yellow-800 dark:text-yellow-300",
    label: { es: "Luz", en: "Electricity" }
  },
  water: {
    bg: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
    text: "text-cyan-800 dark:text-cyan-300",
    label: { es: "Agua", en: "Water" }
  },
  internet: {
    bg: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    text: "text-purple-800 dark:text-purple-300",
    label: { es: "Internet", en: "Internet" }
  },
  hoa_fee: {
    bg: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    text: "text-green-800 dark:text-green-300",
    label: { es: "Cuota HOA", en: "HOA Fee" }
  },
  special: {
    bg: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    text: "text-orange-800 dark:text-orange-300",
    label: { es: "Pago Especial", en: "Special Payment" }
  },
};

const statusColors: Record<string, { bg: string; label: { es: string; en: string } }> = {
  pending: {
    bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    label: { es: "Pendiente", en: "Pending" }
  },
  paid: {
    bg: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    label: { es: "Pagado", en: "Paid" }
  },
  overdue: {
    bg: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    label: { es: "Vencido", en: "Overdue" }
  },
};

export default function ExternalAccounting() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "unit" | "condo">("all");
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedCondoId, setSelectedCondoId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: payments, isLoading: paymentsLoading, isError: paymentsError } = useQuery<ExternalPayment[]>({
    queryKey: ['/api/external-payments'],
  });

  const { data: condominiums, isLoading: condosLoading } = useQuery<ExternalCondominium[]>({
    queryKey: ['/api/external-condominiums'],
  });

  const { data: units, isLoading: unitsLoading } = useQuery<ExternalUnit[]>({
    queryKey: ['/api/external-units'],
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(insertExternalPaymentSchema),
    defaultValues: {
      unitId: undefined,
      amount: undefined,
      dueDate: "",
      type: "rent",
      status: "pending",
      description: "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      return await apiRequest('/api/external-payments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-payments'] });
      setShowPaymentDialog(false);
      paymentForm.reset();
      toast({
        title: language === "es" ? "Pago creado" : "Payment created",
        description: language === "es" ? "El pago se creó exitosamente" : "The payment was created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest(`/api/external-payments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-payments'] });
      toast({
        title: language === "es" ? "Estado actualizado" : "Status updated",
        description: language === "es" ? "El estado del pago se actualizó" : "The payment status was updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitPayment = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  const handleAddPayment = () => {
    paymentForm.reset({
      unitId: selectedUnitId || undefined,
      amount: undefined,
      dueDate: "",
      type: "rent",
      status: "pending",
      description: "",
    });
    setShowPaymentDialog(true);
  };

  const getFilteredPayments = () => {
    if (!payments) return [];

    let filtered = payments;

    if (filterType === "unit" && selectedUnitId) {
      filtered = filtered.filter(p => p.unitId === selectedUnitId);
    } else if (filterType === "condo" && selectedCondoId) {
      const condoUnitIds = units?.filter(u => u.condominiumId === selectedCondoId).map(u => u.id) || [];
      filtered = filtered.filter(p => condoUnitIds.includes(p.unitId));
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(p => p.type === typeFilter);
    }

    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  const filteredPayments = getFilteredPayments();

  const getPaymentStats = () => {
    const total = filteredPayments.length;
    const pending = filteredPayments.filter(p => p.status === 'pending').length;
    const paid = filteredPayments.filter(p => p.status === 'paid').length;
    const overdue = filteredPayments.filter(p => p.status === 'overdue').length;
    const totalAmount = filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const pendingAmount = filteredPayments
      .filter(p => p.status === 'pending' || p.status === 'overdue')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    return { total, pending, paid, overdue, totalAmount, pendingAmount };
  };

  const stats = getPaymentStats();

  const getUnitInfo = (unitId: number) => {
    const unit = units?.find(u => u.id === unitId);
    if (!unit) return null;
    const condo = condominiums?.find(c => c.id === unit.condominiumId);
    return { unit, condo };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Contabilidad" : "Accounting"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Gestiona los pagos y finanzas de tus propiedades"
              : "Manage payments and finances for your properties"}
          </p>
        </div>
        <Button onClick={handleAddPayment} data-testid="button-add-payment">
          <Plus className="mr-2 h-4 w-4" />
          {language === "es" ? "Nuevo Pago" : "New Payment"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Total de Pagos" : "Total Payments"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-payments">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Pendientes" : "Pending"}
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-payments">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${stats.pendingAmount.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Pagados" : "Paid"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-paid-payments">{stats.paid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Vencidos" : "Overdue"}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-overdue-payments">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {language === "es" ? "Filtros" : "Filters"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "es" ? "Vista" : "View"}</label>
              <Select value={filterType} onValueChange={(value: any) => {
                setFilterType(value);
                setSelectedUnitId(null);
                setSelectedCondoId(null);
              }}>
                <SelectTrigger data-testid="select-filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                  <SelectItem value="condo">{language === "es" ? "Por Condominio" : "By Condominium"}</SelectItem>
                  <SelectItem value="unit">{language === "es" ? "Por Unidad" : "By Unit"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === "condo" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "es" ? "Condominio" : "Condominium"}</label>
                <Select 
                  value={selectedCondoId?.toString() || ""} 
                  onValueChange={(value) => setSelectedCondoId(value ? parseInt(value) : null)}
                >
                  <SelectTrigger data-testid="select-condominium">
                    <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {condominiums?.map(condo => (
                      <SelectItem key={condo.id} value={condo.id.toString()}>{condo.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filterType === "unit" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "es" ? "Unidad" : "Unit"}</label>
                <Select 
                  value={selectedUnitId?.toString() || ""} 
                  onValueChange={(value) => setSelectedUnitId(value ? parseInt(value) : null)}
                >
                  <SelectTrigger data-testid="select-unit">
                    <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {units?.map(unit => {
                      const condo = condominiums?.find(c => c.id === unit.condominiumId);
                      return (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {condo?.name} - {unit.unitNumber}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "es" ? "Estado" : "Status"}</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                  <SelectItem value="pending">{language === "es" ? "Pendiente" : "Pending"}</SelectItem>
                  <SelectItem value="paid">{language === "es" ? "Pagado" : "Paid"}</SelectItem>
                  <SelectItem value="overdue">{language === "es" ? "Vencido" : "Overdue"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "es" ? "Tipo" : "Type"}</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="select-type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                  {Object.entries(paymentTypeColors).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      {config.label[language]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {paymentsError ? (
        <Card data-testid="card-error-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium" data-testid="text-error-title">
              {language === "es" ? "Error al cargar pagos" : "Error loading payments"}
            </p>
          </CardContent>
        </Card>
      ) : paymentsLoading || condosLoading || unitsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPayments.length > 0 ? (
        <div className="space-y-4">
          {filteredPayments.map((payment) => {
            const unitInfo = getUnitInfo(payment.unitId);
            const paymentTypeConfig = paymentTypeColors[payment.type] || paymentTypeColors['special'];
            const statusConfig = statusColors[payment.status] || statusColors['pending'];

            return (
              <Card key={payment.id} data-testid={`card-payment-${payment.id}`} className="hover-elevate">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div>
                        <CardTitle className="text-base">
                          {unitInfo && (
                            <span className="font-semibold">
                              {unitInfo.condo?.name} - {language === "es" ? "Unidad" : "Unit"} {unitInfo.unit.unitNumber}
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {payment.description || paymentTypeConfig.label[language]}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold">${parseFloat(payment.amount).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(payment.dueDate), language === "es" ? "d 'de' MMMM, yyyy" : "MMMM d, yyyy", {
                            locale: language === "es" ? es : undefined
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={paymentTypeConfig.bg} data-testid={`badge-type-${payment.id}`}>
                        {paymentTypeConfig.label[language]}
                      </Badge>
                      <Badge className={statusConfig.bg} data-testid={`badge-status-${payment.id}`}>
                        {statusConfig.label[language]}
                      </Badge>
                    </div>
                    {payment.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePaymentStatusMutation.mutate({ id: payment.id, status: 'paid' })}
                        disabled={updatePaymentStatusMutation.isPending}
                        data-testid={`button-mark-paid-${payment.id}`}
                      >
                        {language === "es" ? "Marcar como Pagado" : "Mark as Paid"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card data-testid="card-empty-payments-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium" data-testid="text-empty-payments-title">
              {language === "es" ? "No hay pagos registrados" : "No payments registered"}
            </p>
            <p className="text-sm text-muted-foreground mt-2" data-testid="text-empty-payments-description">
              {language === "es" 
                ? "Agrega el primer pago para comenzar"
                : "Add the first payment to get started"}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent data-testid="dialog-payment-form">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Nuevo Pago" : "New Payment"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Registra un nuevo pago para una unidad"
                : "Register a new payment for a unit"}
            </DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(handleSubmitPayment)} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Unidad" : "Unit"} *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        value={field.value || ""}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        data-testid="select-payment-unit"
                      >
                        <option value="">{language === "es" ? "Selecciona una unidad" : "Select a unit"}</option>
                        {units?.map(unit => {
                          const condo = condominiums?.find(c => c.id === unit.condominiumId);
                          return (
                            <option key={unit.id} value={unit.id}>
                              {condo?.name} - {unit.unitNumber}
                            </option>
                          );
                        })}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Tipo de Pago" : "Payment Type"} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(paymentTypeColors).map(([type, config]) => (
                          <SelectItem key={type} value={type}>
                            {config.label[language]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={paymentForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Monto" : "Amount"} *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field} 
                          value={field.value || ""} 
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          data-testid="input-payment-amount" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Fecha de Vencimiento" : "Due Date"} *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          data-testid="input-payment-due-date" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={paymentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Descripción" : "Description"}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-payment-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPaymentDialog(false)}
                  data-testid="button-cancel-payment"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPaymentMutation.isPending}
                  data-testid="button-submit-payment"
                >
                  {createPaymentMutation.isPending
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (language === "es" ? "Guardar" : "Save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
