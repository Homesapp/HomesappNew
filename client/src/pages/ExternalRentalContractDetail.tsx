import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Edit, Trash2, Calendar, DollarSign, FileText, Wrench, Download, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { 
  ExternalRentalContract,
  ExternalPaymentSchedule,
  ExternalPayment,
  InsertExternalPaymentSchedule
} from "@shared/schema";
import { insertExternalPaymentScheduleSchema } from "@shared/schema";

type ScheduleFormData = z.infer<typeof insertExternalPaymentScheduleSchema>;

const serviceTypeTranslations = {
  rent: { es: "Renta", en: "Rent" },
  electricity: { es: "Electricidad", en: "Electricity" },
  water: { es: "Agua", en: "Water" },
  internet: { es: "Internet", en: "Internet" },
  gas: { es: "Gas", en: "Gas" },
  maintenance: { es: "Mantenimiento", en: "Maintenance" },
  other: { es: "Otro", en: "Other" },
};

const statusTranslations = {
  pending: { es: "Pendiente", en: "Pending" },
  paid: { es: "Pagado", en: "Paid" },
  overdue: { es: "Vencido", en: "Overdue" },
  cancelled: { es: "Cancelado", en: "Cancelled" },
};

export default function ExternalRentalContractDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user, isLoading: isLoadingAuth } = useAuth();
  
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExternalPaymentSchedule | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  const { data: contract, isLoading: contractLoading } = useQuery<ExternalRentalContract>({
    queryKey: [`/api/external-rental-contracts/${id}`],
    enabled: !!id,
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery<ExternalPaymentSchedule[]>({
    queryKey: [`/api/external-payment-schedules?contractId=${id}`],
    enabled: !!id,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<ExternalPayment[]>({
    queryKey: [`/api/external-payments?contractId=${id}`],
    enabled: !!id,
  });

  const scheduleForm = useForm<ScheduleFormData>({
    resolver: zodResolver(insertExternalPaymentScheduleSchema.omit({ agencyId: true, createdBy: true })),
    defaultValues: {
      contractId: "",
      serviceType: "electricity",
      amount: 0,
      currency: "USD",
      dayOfMonth: 1,
      isActive: true,
      sendReminderDaysBefore: 3,
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      return await apiRequest('POST', '/api/external-payment-schedules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-payment-schedules`] });
      setShowScheduleDialog(false);
      scheduleForm.reset();
      toast({
        title: language === "es" ? "Éxito" : "Success",
        description: language === "es" ? "El calendario de pagos se creó exitosamente" : "The payment schedule was created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "Error al crear el calendario de pagos" : "Error creating payment schedule"),
        variant: "destructive",
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<ScheduleFormData> }) => {
      return await apiRequest('PATCH', `/api/external-payment-schedules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-payment-schedules`] });
      setShowScheduleDialog(false);
      setEditingSchedule(null);
      scheduleForm.reset();
      toast({
        title: language === "es" ? "Éxito" : "Success",
        description: language === "es" ? "El calendario de pagos se actualizó exitosamente" : "The payment schedule was updated successfully",
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/external-payment-schedules/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-payment-schedules`] });
      toast({
        title: language === "es" ? "Eliminado" : "Deleted",
        description: language === "es" ? "El calendario de pagos se eliminó exitosamente" : "The payment schedule was deleted successfully",
      });
    },
  });

  const generatePaymentsMutation = useMutation({
    mutationFn: async ({ contractId, monthsAhead }: { contractId: string, monthsAhead: number }) => {
      return await apiRequest('POST', `/api/external-payment-schedules/generate-payments/${contractId}`, { monthsAhead });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-payments`] });
      toast({
        title: language === "es" ? "Éxito" : "Success",
        description: language === "es" 
          ? `Se generaron ${data.generated} pagos exitosamente` 
          : `${data.generated} payments generated successfully`,
      });
    },
  });

  const handleEditSchedule = (schedule: ExternalPaymentSchedule) => {
    setEditingSchedule(schedule);
    scheduleForm.reset({
      contractId: schedule.contractId,
      serviceType: schedule.serviceType,
      amount: schedule.amount,
      currency: schedule.currency,
      dayOfMonth: schedule.dayOfMonth,
      isActive: schedule.isActive,
      sendReminderDaysBefore: schedule.sendReminderDaysBefore || 3,
    });
    setShowScheduleDialog(true);
  };

  const handleSubmitSchedule = async (data: ScheduleFormData) => {
    if (!data.contractId || !id) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "El contrato no está cargado aún" : "Contract not loaded yet",
        variant: "destructive",
      });
      return;
    }
    
    if (editingSchedule) {
      updateScheduleMutation.mutate({ id: editingSchedule.id, data });
    } else {
      createScheduleMutation.mutate({ ...data, contractId: id });
    }
  };

  if (contractLoading || isLoadingAuth) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">
              {language === "es" ? "Contrato no encontrado" : "Contract not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/external-rentals')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-contract-title">
            {language === "es" ? "Detalle del Contrato" : "Contract Details"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {contract.tenantName}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" data-testid="tab-general">
            <FileText className="h-4 w-4 mr-2" />
            {language === "es" ? "General" : "General"}
          </TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">
            <DollarSign className="h-4 w-4 mr-2" />
            {language === "es" ? "Pagos" : "Payments"}
          </TabsTrigger>
          <TabsTrigger value="maintenance" data-testid="tab-maintenance">
            <Wrench className="h-4 w-4 mr-2" />
            {language === "es" ? "Mantenimientos" : "Maintenance"}
          </TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">
            <Download className="h-4 w-4 mr-2" />
            {language === "es" ? "Documentos" : "Documents"}
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === "es" ? "Información del Contrato" : "Contract Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{language === "es" ? "Inquilino" : "Tenant"}</p>
                <p className="font-medium" data-testid="text-tenant-name">{contract.tenantName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{language === "es" ? "Email" : "Email"}</p>
                <p className="text-sm" data-testid="text-tenant-email">{contract.tenantEmail || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{language === "es" ? "Teléfono" : "Phone"}</p>
                <p className="text-sm" data-testid="text-tenant-phone">{contract.tenantPhone || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{language === "es" ? "Renta Mensual" : "Monthly Rent"}</p>
                <p className="font-semibold text-lg" data-testid="text-monthly-rent">
                  {contract.currency === 'MXN' ? '$' : '$'}{contract.monthlyRent.toLocaleString()} {contract.currency}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{language === "es" ? "Duración" : "Duration"}</p>
                <p className="text-sm" data-testid="text-duration">{contract.leaseDurationMonths} {language === "es" ? "meses" : "months"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{language === "es" ? "Estado" : "Status"}</p>
                <Badge variant={contract.status === 'active' ? 'default' : 'secondary'} data-testid="badge-status">
                  {contract.status === 'active' ? (language === "es" ? "Activo" : "Active") : (language === "es" ? "Inactivo" : "Inactive")}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{language === "es" ? "Inicio" : "Start Date"}</p>
                <p className="text-sm" data-testid="text-start-date">
                  {format(new Date(contract.startDate), "PPP", { locale: language === "es" ? es : enUS })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{language === "es" ? "Fin" : "End Date"}</p>
                <p className="text-sm" data-testid="text-end-date">
                  {format(new Date(contract.endDate), "PPP", { locale: language === "es" ? es : enUS })}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          {/* Payment Schedules Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">
                <Calendar className="inline h-5 w-5 mr-2" />
                {language === "es" ? "Calendarios de Pago" : "Payment Schedules"}
              </CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  if (!id || !contract) return;
                  
                  setEditingSchedule(null);
                  scheduleForm.reset({
                    contractId: id,
                    serviceType: "electricity",
                    amount: 0,
                    currency: contract.currency,
                    dayOfMonth: 1,
                    isActive: true,
                    sendReminderDaysBefore: 3,
                  });
                  setShowScheduleDialog(true);
                }}
                disabled={isLoadingAuth || !user || !id || !contract}
                data-testid="button-add-schedule"
              >
                <Plus className="h-4 w-4 mr-1" />
                {language === "es" ? "Agregar" : "Add"}
              </Button>
            </CardHeader>
            <CardContent>
              {schedulesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : !schedules || schedules.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  {language === "es" ? "No hay calendarios de pago" : "No payment schedules"}
                </p>
              ) : (
                <div className="space-y-3">
                  {schedules.map((schedule) => (
                    <div 
                      key={schedule.id}
                      className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                      data-testid={`schedule-item-${schedule.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={schedule.isActive ? "default" : "secondary"} data-testid={`badge-schedule-type-${schedule.id}`}>
                            {serviceTypeTranslations[schedule.serviceType][language]}
                          </Badge>
                          {!schedule.isActive && (
                            <Badge variant="outline" data-testid={`badge-inactive-${schedule.id}`}>
                              {language === "es" ? "Inactivo" : "Inactive"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1 font-semibold" data-testid={`text-schedule-amount-${schedule.id}`}>
                          {schedule.currency === 'MXN' ? '$' : '$'}{schedule.amount.toLocaleString()} {schedule.currency}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-schedule-day-${schedule.id}`}>
                          {language === "es" ? "Día" : "Day"} {schedule.dayOfMonth} {language === "es" ? "de cada mes" : "of each month"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditSchedule(schedule)}
                          disabled={isLoadingAuth || !user}
                          data-testid={`button-edit-schedule-${schedule.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                          disabled={deleteScheduleMutation.isPending || isLoadingAuth || !user}
                          data-testid={`button-delete-schedule-${schedule.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {schedules && schedules.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={() => generatePaymentsMutation.mutate({ contractId: id!, monthsAhead: 3 })}
                    disabled={generatePaymentsMutation.isPending || isLoadingAuth || !user}
                    variant="outline"
                    className="w-full"
                    data-testid="button-generate-payments"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {generatePaymentsMutation.isPending
                      ? (language === "es" ? "Generando..." : "Generating...")
                      : (language === "es" ? "Generar Pagos (3 meses)" : "Generate Payments (3 months)")
                    }
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated Payments Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <DollarSign className="inline h-5 w-5 mr-2" />
                {language === "es" ? "Pagos Generados" : "Generated Payments"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : !payments || payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  {language === "es" ? "No hay pagos generados" : "No payments generated"}
                </p>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div 
                      key={payment.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                      data-testid={`payment-item-${payment.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" data-testid={`badge-payment-type-${payment.id}`}>
                            {serviceTypeTranslations[payment.serviceType][language]}
                          </Badge>
                          <Badge 
                            variant={
                              payment.status === 'paid' ? 'default' : 
                              payment.status === 'overdue' ? 'destructive' : 
                              'secondary'
                            }
                            data-testid={`badge-payment-status-${payment.id}`}
                          >
                            {statusTranslations[payment.status][language]}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1 font-medium" data-testid={`text-payment-amount-${payment.id}`}>
                          {payment.currency === 'MXN' ? '$' : '$'}{payment.amount.toLocaleString()} {payment.currency}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-payment-due-${payment.id}`}>
                          {language === "es" ? "Vence:" : "Due:"} {format(new Date(payment.dueDate), "PPP", { locale: language === "es" ? es : enUS })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <Wrench className="inline h-5 w-5 mr-2" />
                {language === "es" ? "Tickets de Mantenimiento" : "Maintenance Tickets"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                {language === "es" 
                  ? "No hay tickets de mantenimiento registrados para este contrato" 
                  : "No maintenance tickets registered for this contract"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <Download className="inline h-5 w-5 mr-2" />
                {language === "es" ? "Documentos del Contrato" : "Contract Documents"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract.leaseContractUrl ? (
                <div className="flex items-center justify-between p-3 border rounded-md hover-elevate">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium" data-testid="text-lease-contract">
                        {language === "es" ? "Contrato de Arrendamiento" : "Lease Contract"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Documento del contrato" : "Contract document"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    data-testid="button-view-lease"
                  >
                    <a href={contract.leaseContractUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {language === "es" ? "Ver" : "View"}
                    </a>
                  </Button>
                </div>
              ) : null}

              {contract.inventoryUrl ? (
                <div className="flex items-center justify-between p-3 border rounded-md hover-elevate">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium" data-testid="text-inventory">
                        {language === "es" ? "Inventario" : "Inventory"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Listado de bienes" : "Inventory list"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    data-testid="button-view-inventory"
                  >
                    <a href={contract.inventoryUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {language === "es" ? "Ver" : "View"}
                    </a>
                  </Button>
                </div>
              ) : null}

              {!contract.leaseContractUrl && !contract.inventoryUrl && (
                <p className="text-center text-muted-foreground py-8">
                  {language === "es" 
                    ? "No hay documentos cargados para este contrato" 
                    : "No documents uploaded for this contract"}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent data-testid="dialog-schedule-form">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule 
                ? (language === "es" ? "Editar Calendario" : "Edit Schedule")
                : (language === "es" ? "Agregar Calendario" : "Add Schedule")
              }
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Configure un calendario de pago recurrente para servicios adicionales" 
                : "Configure a recurring payment schedule for additional services"
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...scheduleForm}>
            <form onSubmit={scheduleForm.handleSubmit(handleSubmitSchedule)} className="space-y-4">
              <FormField
                control={scheduleForm.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Tipo de Servicio *" : "Service Type *"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-service-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(serviceTypeTranslations)
                          .filter(([key]) => key !== 'rent')
                          .map(([key, translations]) => (
                            <SelectItem key={key} value={key}>
                              {translations[language]}
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
                  control={scheduleForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Monto *" : "Amount *"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-amount" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={scheduleForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Moneda *" : "Currency *"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MXN">MXN</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={scheduleForm.control}
                name="dayOfMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Día del Mes *" : "Day of Month *"}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="1"
                        max="31"
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-day-of-month" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scheduleForm.control}
                name="sendReminderDaysBefore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Días de Recordatorio" : "Reminder Days"}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="0"
                        max="30"
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-reminder-days" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowScheduleDialog(false);
                    setEditingSchedule(null);
                    scheduleForm.reset();
                  }}
                  data-testid="button-cancel-schedule"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                  data-testid="button-submit-schedule"
                >
                  {(createScheduleMutation.isPending || updateScheduleMutation.isPending)
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : editingSchedule
                      ? (language === "es" ? "Actualizar" : "Update")
                      : (language === "es" ? "Crear" : "Create")
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
