import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ArrowLeft, Plus, Edit, Trash2, Calendar, DollarSign, FileText, Download, ExternalLink, CheckCircle2, Home, Building2 } from "lucide-react";
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

const paymentRegistrationSchema = z.object({
  paidDate: z.date(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentRegistrationData = z.infer<typeof paymentRegistrationSchema>;

const contractEditSchema = z.object({
  tenantName: z.string().min(1, "Tenant name is required"),
  tenantEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  tenantPhone: z.string().optional(),
  monthlyRent: z.coerce.number().positive("Monthly rent must be greater than 0"),
  rentalPurpose: z.enum(["living", "sublease"]),
  endDate: z.date(),
  notes: z.string().optional(),
});

type ContractEditData = z.infer<typeof contractEditSchema>;

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

const paymentMethodTranslations = {
  cash: { es: "Efectivo", en: "Cash" },
  bank_transfer: { es: "Transferencia Bancaria", en: "Bank Transfer" },
  credit_card: { es: "Tarjeta de Crédito", en: "Credit Card" },
  debit_card: { es: "Tarjeta de Débito", en: "Debit Card" },
  check: { es: "Cheque", en: "Check" },
  other: { es: "Otro", en: "Other" },
};

const rentalPurposeTranslations = {
  living: { es: "Para Vivir", en: "For Living" },
  sublease: { es: "Para Subarrendar", en: "For Sublease" },
};

export default function ExternalRentalContractDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user, isLoading: isLoadingAuth } = useAuth();
  
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExternalPaymentSchedule | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ExternalPayment | null>(null);
  const [showContractEditDialog, setShowContractEditDialog] = useState(false);

  const { data: contract, isLoading: contractLoading } = useQuery<ExternalRentalContract>({
    queryKey: [`/api/external-rental-contracts/${id}`],
    enabled: !!id,
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery<ExternalPaymentSchedule[]>({
    queryKey: ["/api/external-payment-schedules", { contractId: id }],
    queryFn: async () => {
      const response = await fetch(`/api/external-payment-schedules?contractId=${id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch schedules");
      return response.json();
    },
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

  const paymentForm = useForm<PaymentRegistrationData>({
    resolver: zodResolver(paymentRegistrationSchema),
    defaultValues: {
      paidDate: new Date(),
      paymentMethod: "",
      paymentReference: "",
      notes: "",
    },
  });

  const contractEditForm = useForm<ContractEditData>({
    resolver: zodResolver(contractEditSchema),
    defaultValues: {
      tenantName: "",
      tenantEmail: "",
      tenantPhone: "",
      monthlyRent: 0,
      rentalPurpose: "living",
      endDate: new Date(),
      notes: "",
    },
  });

  useEffect(() => {
    if (contract) {
      contractEditForm.reset({
        tenantName: contract.tenantName,
        tenantEmail: contract.tenantEmail || "",
        tenantPhone: contract.tenantPhone || "",
        monthlyRent: parseFloat(contract.monthlyRent.toString()),
        rentalPurpose: (contract as any).rentalPurpose || "living",
        endDate: new Date(contract.endDate),
        notes: contract.notes || "",
      });
    }
  }, [contract]);

  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      if (!id) throw new Error("Contract ID is required");
      return await apiRequest('POST', `/api/external-rental-contracts/${id}/schedules`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-payment-schedules", { contractId: id }] });
      queryClient.invalidateQueries({ queryKey: [`/api/external-rental-contracts/${id}/overview`] });
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
    mutationFn: async ({ scheduleId, data }: { scheduleId: string, data: Partial<ScheduleFormData> }) => {
      if (!id) throw new Error("Contract ID is required");
      return await apiRequest('PATCH', `/api/external-rental-contracts/${id}/schedules/${scheduleId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-payment-schedules", { contractId: id }] });
      queryClient.invalidateQueries({ queryKey: [`/api/external-rental-contracts/${id}/overview`] });
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
    mutationFn: async (scheduleId: string) => {
      if (!id) throw new Error("Contract ID is required");
      await apiRequest('DELETE', `/api/external-rental-contracts/${id}/schedules/${scheduleId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-payment-schedules", { contractId: id }] });
      queryClient.invalidateQueries({ queryKey: [`/api/external-rental-contracts/${id}/overview`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/external-payments?contractId=${id}`] });
      toast({
        title: language === "es" ? "Éxito" : "Success",
        description: language === "es" 
          ? `Se generaron ${data.generated} pagos exitosamente` 
          : `${data.generated} payments generated successfully`,
      });
    },
  });

  const registerPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, data }: { paymentId: string, data: PaymentRegistrationData }) => {
      return await apiRequest('PATCH', `/api/external-payments/${paymentId}`, {
        ...data,
        paidDate: data.paidDate.toISOString(),
        status: 'paid',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-payments?contractId=${id}`] });
      setShowPaymentDialog(false);
      setEditingPayment(null);
      paymentForm.reset();
      toast({
        title: language === "es" ? "Éxito" : "Success",
        description: language === "es" ? "El pago se registró exitosamente" : "Payment registered successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "Error al registrar el pago" : "Error registering payment"),
        variant: "destructive",
      });
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: async (data: ContractEditData) => {
      if (!id) throw new Error("Contract ID is required");
      return await apiRequest('PATCH', `/api/external-rental-contracts/${id}`, {
        tenantName: data.tenantName,
        tenantEmail: data.tenantEmail || undefined,
        tenantPhone: data.tenantPhone || undefined,
        monthlyRent: data.monthlyRent,
        rentalPurpose: data.rentalPurpose,
        endDate: data.endDate.toISOString(),
        notes: data.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/external-rental-contracts/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/external-rental-contracts/${id}/overview`] });
      setShowContractEditDialog(false);
      toast({
        title: language === "es" ? "Éxito" : "Success",
        description: language === "es" ? "El contrato se actualizó exitosamente" : "Contract updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "Error al actualizar el contrato" : "Error updating contract"),
        variant: "destructive",
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
    if (!id) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "El contrato no está cargado aún" : "Contract not loaded yet",
        variant: "destructive",
      });
      return;
    }
    
    if (editingSchedule) {
      updateScheduleMutation.mutate({ scheduleId: editingSchedule.id, data });
    } else {
      createScheduleMutation.mutate(data);
    }
  };

  const handleRegisterPayment = (payment: ExternalPayment) => {
    setEditingPayment(payment);
    paymentForm.reset({
      paidDate: payment.paidDate ? new Date(payment.paidDate) : new Date(),
      paymentMethod: payment.paymentMethod || "",
      paymentReference: payment.paymentReference || "",
      notes: payment.notes || "",
    });
    setShowPaymentDialog(true);
  };

  const handleSubmitPayment = async (data: PaymentRegistrationData) => {
    if (!editingPayment) return;
    registerPaymentMutation.mutate({ paymentId: editingPayment.id, data });
  };

  const handleEditContract = () => {
    setShowContractEditDialog(true);
  };

  const handleSubmitContractEdit = async (data: ContractEditData) => {
    updateContractMutation.mutate(data);
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

  const rentalPurpose = (contract as any).rentalPurpose || "living";
  const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0;
  const paidPayments = payments?.filter(p => p.status === 'paid').length || 0;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/external/rentals')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-contract-title">
              {contract.tenantName}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Badge variant={contract.status === 'active' ? 'default' : 'secondary'} data-testid="badge-status">
                {contract.status === 'active' ? (language === "es" ? "Activo" : "Active") : (language === "es" ? "Completado" : "Completed")}
              </Badge>
              <Badge variant="outline" data-testid="badge-rental-purpose">
                {rentalPurpose === 'living' ? <Home className="h-3 w-3 mr-1" /> : <Building2 className="h-3 w-3 mr-1" />}
                {rentalPurposeTranslations[rentalPurpose as keyof typeof rentalPurposeTranslations][language]}
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {contract.status === 'active' && (
            <Button
              variant="outline"
              onClick={handleEditContract}
              data-testid="button-edit-contract"
            >
              <Edit className="h-4 w-4 mr-2" />
              {language === "es" ? "Editar" : "Edit"}
            </Button>
          )}
          {contract.status === 'completed' && (
            <Button
              onClick={() => navigate(`/external/checkout/${contract.id}`)}
              data-testid="button-checkout"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {language === "es" ? "Check-Out" : "Check-Out"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contract Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{language === "es" ? "Información del Contrato" : "Contract Information"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <p className="text-2xl font-bold" data-testid="text-monthly-rent">
                  ${Number(contract.monthlyRent).toLocaleString()} {contract.currency}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{language === "es" ? "Duración" : "Duration"}</p>
                <p className="text-sm" data-testid="text-duration">{contract.leaseDurationMonths} {language === "es" ? "meses" : "months"}</p>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{language === "es" ? "Inicio" : "Start"}</p>
                  <p className="text-sm" data-testid="text-start-date">
                    {format(new Date(contract.startDate), "MMM d, yyyy", { locale: language === "es" ? es : enUS })}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{language === "es" ? "Fin" : "End"}</p>
                  <p className="text-sm" data-testid="text-end-date">
                    {format(new Date(contract.endDate), "MMM d, yyyy", { locale: language === "es" ? es : enUS })}
                  </p>
                </div>
              </div>
              {contract.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">{language === "es" ? "Notas" : "Notes"}</p>
                  <p className="text-sm text-muted-foreground">{contract.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          {(contract.leaseContractUrl || contract.inventoryUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  <FileText className="inline h-4 w-4 mr-2" />
                  {language === "es" ? "Documentos" : "Documents"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {contract.leaseContractUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full justify-start"
                    data-testid="button-view-lease"
                  >
                    <a href={contract.leaseContractUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      {language === "es" ? "Contrato" : "Lease"}
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  </Button>
                )}
                {contract.inventoryUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full justify-start"
                    data-testid="button-view-inventory"
                  >
                    <a href={contract.inventoryUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      {language === "es" ? "Inventario" : "Inventory"}
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <DollarSign className="inline h-4 w-4 mr-2" />
                {language === "es" ? "Resumen de Pagos" : "Payment Summary"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{language === "es" ? "Pendientes" : "Pending"}</span>
                <Badge variant="secondary" data-testid="badge-pending-count">{pendingPayments}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{language === "es" ? "Pagados" : "Paid"}</span>
                <Badge variant="default" data-testid="badge-paid-count">{paidPayments}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Schedules & Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Schedules */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-lg">
                <Calendar className="inline h-5 w-5 mr-2" />
                {language === "es" ? "Servicios y Calendarios" : "Services & Schedules"}
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
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    {language === "es" ? "No hay servicios configurados" : "No services configured"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" 
                      ? "Agrega calendarios de pago para electricidad, agua, internet, etc." 
                      : "Add payment schedules for electricity, water, internet, etc."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {schedules.map((schedule) => (
                      <div 
                        key={schedule.id}
                        className="flex items-start justify-between p-4 border rounded-md hover-elevate"
                        data-testid={`schedule-item-${schedule.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={schedule.isActive ? "default" : "secondary"} data-testid={`badge-schedule-type-${schedule.id}`}>
                              {serviceTypeTranslations[schedule.serviceType][language]}
                            </Badge>
                            {!schedule.isActive && (
                              <Badge variant="outline" data-testid={`badge-inactive-${schedule.id}`}>
                                {language === "es" ? "Inactivo" : "Inactive"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-lg font-bold mt-2" data-testid={`text-schedule-amount-${schedule.id}`}>
                            ${Number(schedule.amount).toLocaleString()} {schedule.currency}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid={`text-schedule-day-${schedule.id}`}>
                            {language === "es" ? "Día" : "Day"} {schedule.dayOfMonth}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
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
                </>
              )}
            </CardContent>
          </Card>

          {/* Generated Payments */}
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
                <p className="text-center text-muted-foreground py-8">
                  {language === "es" ? "No hay pagos generados" : "No payments generated"}
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {payments.map((payment) => (
                    <div 
                      key={payment.id}
                      className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                      data-testid={`payment-item-${payment.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs" data-testid={`badge-payment-type-${payment.id}`}>
                            {serviceTypeTranslations[payment.serviceType][language]}
                          </Badge>
                          <Badge 
                            variant={
                              payment.status === 'paid' ? 'default' : 
                              payment.status === 'overdue' ? 'destructive' : 
                              'secondary'
                            }
                            className="text-xs"
                            data-testid={`badge-payment-status-${payment.id}`}
                          >
                            {statusTranslations[payment.status][language]}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1 font-semibold" data-testid={`text-payment-amount-${payment.id}`}>
                          ${Number(payment.amount).toLocaleString()} {payment.currency}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-payment-due-${payment.id}`}>
                          {format(new Date(payment.dueDate), "MMM d, yyyy", { locale: language === "es" ? es : enUS })}
                        </p>
                        {payment.status === 'paid' && payment.paymentMethod && (
                          <p className="text-xs text-muted-foreground mt-1" data-testid={`text-payment-method-${payment.id}`}>
                            {paymentMethodTranslations[payment.paymentMethod as keyof typeof paymentMethodTranslations]?.[language] || payment.paymentMethod}
                          </p>
                        )}
                      </div>
                      <div className="ml-3">
                        {payment.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRegisterPayment(payment)}
                            disabled={isLoadingAuth || !user}
                            data-testid={`button-register-payment-${payment.id}`}
                          >
                            {language === "es" ? "Registrar" : "Register"}
                          </Button>
                        )}
                        {payment.status === 'paid' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRegisterPayment(payment)}
                            disabled={isLoadingAuth || !user}
                            data-testid={`button-edit-payment-${payment.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
                    <FormLabel>{language === "es" ? "Tipo de Servicio" : "Service Type"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-service-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="electricity">{serviceTypeTranslations.electricity[language]}</SelectItem>
                        <SelectItem value="water">{serviceTypeTranslations.water[language]}</SelectItem>
                        <SelectItem value="internet">{serviceTypeTranslations.internet[language]}</SelectItem>
                        <SelectItem value="gas">{serviceTypeTranslations.gas[language]}</SelectItem>
                        <SelectItem value="maintenance">{serviceTypeTranslations.maintenance[language]}</SelectItem>
                        <SelectItem value="other">{serviceTypeTranslations.other[language]}</SelectItem>
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
                      <FormLabel>{language === "es" ? "Monto" : "Amount"}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={scheduleForm.control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Día del Mes" : "Day of Month"}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="31"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                          data-testid="input-day-of-month"
                        />
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
                  data-testid="button-save-schedule"
                >
                  {(createScheduleMutation.isPending || updateScheduleMutation.isPending)
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (language === "es" ? "Guardar" : "Save")
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent data-testid="dialog-payment-form">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Registrar Pago" : "Register Payment"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Ingrese los detalles del pago realizado" 
                : "Enter the payment details"}
            </DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(handleSubmitPayment)} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="paidDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{language === "es" ? "Fecha de Pago" : "Payment Date"}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-select-paid-date"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: language === "es" ? es : enUS }) : <span>{language === "es" ? "Seleccionar fecha" : "Pick a date"}</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          locale={language === "es" ? es : enUS}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={paymentForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Método de Pago" : "Payment Method"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">{paymentMethodTranslations.cash[language]}</SelectItem>
                        <SelectItem value="bank_transfer">{paymentMethodTranslations.bank_transfer[language]}</SelectItem>
                        <SelectItem value="credit_card">{paymentMethodTranslations.credit_card[language]}</SelectItem>
                        <SelectItem value="debit_card">{paymentMethodTranslations.debit_card[language]}</SelectItem>
                        <SelectItem value="check">{paymentMethodTranslations.check[language]}</SelectItem>
                        <SelectItem value="other">{paymentMethodTranslations.other[language]}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={paymentForm.control}
                name="paymentReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Referencia (opcional)" : "Reference (optional)"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-payment-reference" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={paymentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Notas (opcional)" : "Notes (optional)"}</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="textarea-payment-notes" />
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
                    setShowPaymentDialog(false);
                    setEditingPayment(null);
                    paymentForm.reset();
                  }}
                  data-testid="button-cancel-payment"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={registerPaymentMutation.isPending}
                  data-testid="button-save-payment"
                >
                  {registerPaymentMutation.isPending
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (language === "es" ? "Registrar" : "Register")
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Contract Edit Dialog */}
      <Dialog open={showContractEditDialog} onOpenChange={setShowContractEditDialog}>
        <DialogContent data-testid="dialog-contract-edit-form">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Editar Contrato" : "Edit Contract"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Actualice la información del contrato" 
                : "Update the contract information"}
            </DialogDescription>
          </DialogHeader>
          <Form {...contractEditForm}>
            <form onSubmit={contractEditForm.handleSubmit(handleSubmitContractEdit)} className="space-y-6">
              <FormField
                control={contractEditForm.control}
                name="tenantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Nombre del Inquilino" : "Tenant Name"}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={language === "es" ? "Nombre completo del inquilino" : "Tenant full name"}
                        data-testid="input-tenant-name" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={contractEditForm.control}
                  name="tenantEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Email (opcional)" : "Email (optional)"}</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          {...field} 
                          placeholder={language === "es" ? "email@ejemplo.com" : "email@example.com"}
                          data-testid="input-tenant-email-edit" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={contractEditForm.control}
                  name="tenantPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Teléfono (opcional)" : "Phone (optional)"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder={language === "es" ? "+52 998 555 6666" : "+52 998 555 6666"}
                          data-testid="input-tenant-phone-edit" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={contractEditForm.control}
                  name="monthlyRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Renta Mensual" : "Monthly Rent"}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-monthly-rent-edit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={contractEditForm.control}
                  name="rentalPurpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Propósito" : "Purpose"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-rental-purpose">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="living">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              {rentalPurposeTranslations.living[language]}
                            </div>
                          </SelectItem>
                          <SelectItem value="sublease">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {rentalPurposeTranslations.sublease[language]}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={contractEditForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{language === "es" ? "Fecha de Fin" : "End Date"}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-select-end-date"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: language === "es" ? es : enUS }) : <span>{language === "es" ? "Seleccionar fecha" : "Pick a date"}</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(contract.startDate)}
                          initialFocus
                          locale={language === "es" ? es : enUS}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contractEditForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Notas (opcional)" : "Notes (optional)"}</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder={language === "es" ? "Con opción a renovación" : "Option to renew"}
                        className="min-h-[80px] resize-none"
                        data-testid="textarea-contract-notes" 
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
                    setShowContractEditDialog(false);
                    if (contract) {
                      contractEditForm.reset({
                        tenantName: contract.tenantName,
                        tenantEmail: contract.tenantEmail || "",
                        tenantPhone: contract.tenantPhone || "",
                        monthlyRent: parseFloat(contract.monthlyRent.toString()),
                        rentalPurpose: (contract as any).rentalPurpose || "living",
                        endDate: new Date(contract.endDate),
                        notes: contract.notes || "",
                      });
                    }
                  }}
                  data-testid="button-cancel-contract-edit"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateContractMutation.isPending}
                  data-testid="button-save-contract-edit"
                >
                  {updateContractMutation.isPending
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (language === "es" ? "Guardar" : "Save")
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
