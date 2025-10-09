import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Home, DollarSign, Wrench, Calendar, CheckCircle2, Clock, AlertCircle, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ActiveRental {
  id: string;
  propertyId: string;
  rentalType: string;
  monthlyRent: string;
  depositAmount: string;
  contractStartDate: string;
  contractEndDate: string;
  checkInDate: string;
  status: string;
}

interface RentalPayment {
  id: string;
  rentalContractId: string;
  tenantId: string;
  ownerId: string;
  amount: string;
  dueDate: string;
  paidDate?: string;
  status: string;
  paymentMethod?: string;
  transactionReference?: string;
  notes?: string;
}

interface MaintenanceRequest {
  id: string;
  rentalContractId: string;
  tenantId: string;
  ownerId: string;
  propertyId: string;
  title: string;
  description: string;
  urgency: string;
  status: string;
  requestedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  estimatedCost?: string;
  actualCost?: string;
  resolvedNotes?: string;
  createdAt: string;
}

const maintenanceRequestSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  urgency: z.enum(["low", "medium", "high", "emergency"]),
});

export default function ActiveRentals() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [selectedRental, setSelectedRental] = useState<string | null>(null);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);

  const { data: rentals = [], isLoading: rentalsLoading } = useQuery<ActiveRental[]>({
    queryKey: ["/api/rentals/active"],
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<RentalPayment[]>({
    queryKey: ["/api/rentals", selectedRental, "payments"],
    enabled: !!selectedRental,
  });

  const { data: maintenanceRequests = [], isLoading: maintenanceLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ["/api/rentals", selectedRental, "maintenance-requests"],
    enabled: !!selectedRental,
  });

  const maintenanceForm = useForm({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      urgency: "medium" as const,
    },
  });

  const createMaintenanceRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof maintenanceRequestSchema>) => {
      if (!selectedRental) throw new Error("No rental selected");
      return await apiRequest("POST", `/api/rentals/${selectedRental}/maintenance-request`, data);
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "Solicitud enviada" : "Request sent",
        description: language === "es"
          ? "Tu solicitud de mantenimiento ha sido enviada al propietario"
          : "Your maintenance request has been sent to the owner",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rentals", selectedRental, "maintenance-requests"] });
      setShowMaintenanceDialog(false);
      maintenanceForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es"
          ? "No se pudo enviar la solicitud"
          : "Could not send request"),
        variant: "destructive",
      });
    },
  });

  const onSubmitMaintenanceRequest = (data: z.infer<typeof maintenanceRequestSchema>) => {
    createMaintenanceRequestMutation.mutate(data);
  };

  // Auto-select first rental when rentals load
  useEffect(() => {
    if (rentals.length > 0 && !selectedRental) {
      setSelectedRental(rentals[0].id);
    }
    // Reset selected rental if it's no longer in the list
    if (selectedRental && !rentals.find(r => r.id === selectedRental)) {
      setSelectedRental(rentals.length > 0 ? rentals[0].id : null);
    }
  }, [rentals, selectedRental]);

  if (rentalsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (rentals.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-active-rentals-title">
            {t("activeRentals.title", "Mis Rentas Activas")}
          </h1>
          <p className="text-secondary-foreground mt-2">
            {t("activeRentals.description", "Gestiona tus propiedades rentadas")}
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("activeRentals.noRentals", "No tienes rentas activas")}</CardTitle>
            <CardDescription>
              {t("activeRentals.noRentalsDesc", "Cuando tengas una propiedad rentada, aparecerá aquí")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const currentRental = rentals.find(r => r.id === selectedRental);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-active-rentals-title">
          {t("activeRentals.title", "Mis Rentas Activas")}
        </h1>
        <p className="text-secondary-foreground mt-2">
          {t("activeRentals.description", "Gestiona tus propiedades rentadas")}
        </p>
      </div>

      {/* Rental Selector */}
      {rentals.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("activeRentals.selectRental", "Seleccionar Renta")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedRental || ""} onValueChange={setSelectedRental}>
              <SelectTrigger data-testid="select-rental">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rentals.map((rental) => (
                  <SelectItem key={rental.id} value={rental.id}>
                    {rental.rentalType === "short_term" ? "Renta Corta" : "Renta Larga"} - ${rental.monthlyRent}/mes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("activeRentals.monthlyRent", "Renta Mensual")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-tertiary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-monthly-rent">
              ${currentRental?.monthlyRent}
            </div>
            <p className="text-xs text-tertiary-foreground">
              {currentRental?.rentalType === "short_term" ? "Renta corta plazo" : "Renta largo plazo"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("activeRentals.deposit", "Depósito")}
            </CardTitle>
            <Home className="h-4 w-4 text-tertiary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-deposit">
              ${currentRental?.depositAmount}
            </div>
            <p className="text-xs text-tertiary-foreground">
              {t("activeRentals.depositPaid", "Depósito pagado")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("activeRentals.contractEnd", "Fin de Contrato")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-tertiary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-contract-end">
              {currentRental?.contractEndDate ? format(new Date(currentRental.contractEndDate), "dd MMM yyyy", { locale: language === "es" ? es : undefined }) : "-"}
            </div>
            <p className="text-xs text-tertiary-foreground">
              {currentRental?.contractStartDate ? `Inicio: ${format(new Date(currentRental.contractStartDate), "dd MMM yyyy", { locale: language === "es" ? es : undefined })}` : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments" data-testid="tab-payments">
            <DollarSign className="h-4 w-4 mr-2" />
            {t("activeRentals.payments", "Pagos")}
          </TabsTrigger>
          <TabsTrigger value="maintenance" data-testid="tab-maintenance">
            <Wrench className="h-4 w-4 mr-2" />
            {t("activeRentals.maintenance", "Mantenimiento")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>{t("activeRentals.paymentHistory", "Historial de Pagos")}</CardTitle>
              <CardDescription>
                {t("activeRentals.paymentHistoryDesc", "Revisa tus pagos mensuales de renta")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : payments.length === 0 ? (
                <p className="text-center text-secondary-foreground py-8">
                  {t("activeRentals.noPayments", "No hay pagos registrados")}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("activeRentals.dueDate", "Fecha de Vencimiento")}</TableHead>
                      <TableHead>{t("activeRentals.amount", "Monto")}</TableHead>
                      <TableHead>{t("activeRentals.status", "Estado")}</TableHead>
                      <TableHead>{t("activeRentals.paidDate", "Fecha de Pago")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                        <TableCell>
                          {format(new Date(payment.dueDate), "dd MMM yyyy", { locale: language === "es" ? es : undefined })}
                        </TableCell>
                        <TableCell className="font-medium">${payment.amount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={payment.status === "paid" ? "default" : payment.status === "pending" ? "secondary" : "destructive"}
                            data-testid={`badge-payment-status-${payment.id}`}
                          >
                            {payment.status === "paid" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {payment.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                            {payment.status === "overdue" && <AlertCircle className="h-3 w-3 mr-1" />}
                            {payment.status === "paid" ? t("activeRentals.paid", "Pagado") :
                             payment.status === "pending" ? t("activeRentals.pending", "Pendiente") :
                             t("activeRentals.overdue", "Vencido")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.paidDate ? format(new Date(payment.paidDate), "dd MMM yyyy", { locale: language === "es" ? es : undefined }) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t("activeRentals.maintenanceRequests", "Solicitudes de Mantenimiento")}</CardTitle>
                  <CardDescription>
                    {t("activeRentals.maintenanceRequestsDesc", "Reporta problemas con la propiedad")}
                  </CardDescription>
                </div>
                <Button onClick={() => setShowMaintenanceDialog(true)} data-testid="button-new-maintenance-request">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("activeRentals.newRequest", "Nueva Solicitud")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {maintenanceLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : maintenanceRequests.length === 0 ? (
                <p className="text-center text-secondary-foreground py-8">
                  {t("activeRentals.noMaintenanceRequests", "No hay solicitudes de mantenimiento")}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("activeRentals.title", "Título")}</TableHead>
                      <TableHead>{t("activeRentals.urgency", "Urgencia")}</TableHead>
                      <TableHead>{t("activeRentals.status", "Estado")}</TableHead>
                      <TableHead>{t("activeRentals.requestedDate", "Fecha")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceRequests.map((request) => (
                      <TableRow key={request.id} data-testid={`row-maintenance-${request.id}`}>
                        <TableCell className="font-medium">{request.title}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.urgency === "emergency" ? "destructive" :
                              request.urgency === "high" ? "destructive" :
                              request.urgency === "medium" ? "secondary" : "outline"
                            }
                            data-testid={`badge-urgency-${request.id}`}
                          >
                            {request.urgency === "emergency" ? t("activeRentals.emergency", "Emergencia") :
                             request.urgency === "high" ? t("activeRentals.high", "Alta") :
                             request.urgency === "medium" ? t("activeRentals.medium", "Media") :
                             t("activeRentals.low", "Baja")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === "completed" ? "default" :
                              request.status === "in_progress" ? "secondary" : "outline"
                            }
                            data-testid={`badge-status-${request.id}`}
                          >
                            {request.status === "completed" ? t("activeRentals.completed", "Completado") :
                             request.status === "in_progress" ? t("activeRentals.inProgress", "En Proceso") :
                             t("activeRentals.pending", "Pendiente")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.createdAt), "dd MMM yyyy", { locale: language === "es" ? es : undefined })}
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

      {/* Maintenance Request Dialog */}
      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent data-testid="dialog-maintenance-request">
          <DialogHeader>
            <DialogTitle>{t("activeRentals.newMaintenanceRequest", "Nueva Solicitud de Mantenimiento")}</DialogTitle>
            <DialogDescription>
              {t("activeRentals.newMaintenanceRequestDesc", "Describe el problema y lo enviaremos al propietario")}
            </DialogDescription>
          </DialogHeader>
          <Form {...maintenanceForm}>
            <form onSubmit={maintenanceForm.handleSubmit(onSubmitMaintenanceRequest)} className="space-y-4">
              <FormField
                control={maintenanceForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("activeRentals.requestTitle", "Título")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("activeRentals.titlePlaceholder", "ej. Fuga de agua en baño")} data-testid="input-maintenance-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={maintenanceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("activeRentals.description", "Descripción")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder={t("activeRentals.descPlaceholder", "Describe el problema en detalle")} data-testid="textarea-maintenance-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={maintenanceForm.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("activeRentals.urgency", "Urgencia")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-urgency">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{t("activeRentals.low", "Baja")}</SelectItem>
                        <SelectItem value="medium">{t("activeRentals.medium", "Media")}</SelectItem>
                        <SelectItem value="high">{t("activeRentals.high", "Alta")}</SelectItem>
                        <SelectItem value="emergency">{t("activeRentals.emergency", "Emergencia")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMaintenanceDialog(false)}
                  data-testid="button-cancel-maintenance"
                >
                  {t("activeRentals.cancel", "Cancelar")}
                </Button>
                <Button
                  type="submit"
                  disabled={createMaintenanceRequestMutation.isPending}
                  data-testid="button-submit-maintenance"
                >
                  {createMaintenanceRequestMutation.isPending
                    ? t("activeRentals.sending", "Enviando...")
                    : t("activeRentals.send", "Enviar Solicitud")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
