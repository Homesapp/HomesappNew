import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
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
import { Home, DollarSign, Wrench, Calendar, CheckCircle2, Clock, AlertCircle, Plus, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ActiveRental {
  id: string;
  propertyId: string;
  rentalType?: string;
  monthlyRent: string;
  depositAmount?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  checkInDate?: string;
  status: string;
  // Property information
  propertyTitle?: string;
  propertyType?: string;
  unitType?: string;
  condominiumId?: string;
  condoName?: string;
  unitNumber?: string;
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
  photoData: z.string().optional(),
});

export default function ActiveRentals() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRental, setSelectedRental] = useState<string | null>(null);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<RentalPayment | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [problemPhotoFile, setProblemPhotoFile] = useState<{ name: string; data: string } | null>(null);

  const isOwner = user?.role === "owner";
  const rentalsEndpoint = isOwner ? "/api/owner/active-rentals" : "/api/rentals/active";

  const { data: rentals = [], isLoading: rentalsLoading } = useQuery<ActiveRental[]>({
    queryKey: [rentalsEndpoint],
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

  const registerPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPayment) throw new Error("No payment selected");
      
      const formData = new FormData();
      if (paymentProofFile) {
        formData.append('proof', paymentProofFile);
      }
      
      const response = await fetch(`/api/rentals/payments/${selectedPayment.id}/register`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register payment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "Pago registrado" : "Payment registered",
        description: language === "es"
          ? "Tu pago ha sido registrado exitosamente"
          : "Your payment has been registered successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rentals", selectedRental, "payments"] });
      setShowPaymentDialog(false);
      setSelectedPayment(null);
      setPaymentProofFile(null);
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es"
          ? "No se pudo registrar el pago"
          : "Could not register payment"),
        variant: "destructive",
      });
    },
  });

  const handleProblemPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" 
          ? "Solo se permiten imágenes" 
          : "Only images are allowed",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" 
          ? "La imagen no debe superar los 10MB" 
          : "Image must not exceed 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProblemPhotoFile({
        name: file.name,
        data: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const onSubmitMaintenanceRequest = (data: z.infer<typeof maintenanceRequestSchema>) => {
    const submitData = {
      ...data,
      photoData: problemPhotoFile?.data,
    };
    createMaintenanceRequestMutation.mutate(submitData);
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

  // Clean up problem photo when dialog closes
  useEffect(() => {
    if (!showMaintenanceDialog) {
      setProblemPhotoFile(null);
      maintenanceForm.reset();
    }
  }, [showMaintenanceDialog, maintenanceForm]);

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

      {/* Property Information */}
      {currentRental && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              {currentRental.propertyTitle || t("activeRentals.property", "Propiedad")}
            </CardTitle>
            <CardDescription>
              {currentRental.unitType === "condominio" ? (
                <>
                  {currentRental.condoName && (
                    <span data-testid="text-condo-name">
                      {t("activeRentals.condominium", "Condominio")}: {currentRental.condoName}
                    </span>
                  )}
                  {currentRental.unitNumber && (
                    <span className="ml-2" data-testid="text-unit-number">
                      {t("activeRentals.unit", "Unidad")}: {currentRental.unitNumber}
                    </span>
                  )}
                </>
              ) : (
                <span data-testid="text-property-type">
                  {currentRental.propertyType === "house" ? t("activeRentals.privateHouse", "Casa Privada") : t("activeRentals.property", "Propiedad")}
                </span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

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
                {rentals.map((rental) => {
                  const propertyName = rental.unitType === "condominio" 
                    ? `${rental.condoName || ""} ${rental.unitNumber || ""}`.trim()
                    : rental.propertyTitle || t("activeRentals.property", "Propiedad");
                  
                  return (
                    <SelectItem key={rental.id} value={rental.id}>
                      {propertyName} - ${rental.monthlyRent}/mes
                    </SelectItem>
                  );
                })}
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
                      {!isOwner && <TableHead>{t("activeRentals.actions", "Acciones")}</TableHead>}
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
                        {!isOwner && (
                          <TableCell>
                            {payment.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowPaymentDialog(true);
                                }}
                                data-testid={`button-register-payment-${payment.id}`}
                              >
                                {t("activeRentals.registerPayment", "Registrar Pago")}
                              </Button>
                            )}
                          </TableCell>
                        )}
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
                      <TableHead>{t("activeRentals.requestTitle", "Título")}</TableHead>
                      <TableHead>{t("activeRentals.urgency", "Urgencia")}</TableHead>
                      <TableHead>{t("activeRentals.status", "Estado")}</TableHead>
                      <TableHead>{t("activeRentals.requestedDate", "Fecha")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceRequests.map((request) => (
                      <TableRow key={request.id} data-testid={`row-maintenance-${request.id}`}>
                        <TableCell className="font-medium">{request.description}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.urgency === "emergency" ? "destructive" :
                              request.urgency === "urgent" ? "destructive" :
                              request.urgency === "high" ? "destructive" :
                              request.urgency === "normal" ? "secondary" :
                              request.urgency === "medium" ? "secondary" : "outline"
                            }
                            data-testid={`badge-urgency-${request.id}`}
                          >
                            {request.urgency === "emergency" ? t("activeRentals.emergency", "Emergencia") :
                             request.urgency === "urgent" ? t("activeRentals.urgent", "Urgente") :
                             request.urgency === "high" ? t("activeRentals.high", "Alta") :
                             request.urgency === "normal" ? t("activeRentals.normal", "Normal") :
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
              
              <div className="space-y-2">
                <FormLabel>{t("activeRentals.problemPhoto", "Foto del Problema (Opcional)")}</FormLabel>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleProblemPhotoUpload}
                    data-testid="input-problem-photo"
                  />
                  <Upload className="h-5 w-5 text-secondary-foreground" />
                </div>
                {problemPhotoFile && (
                  <div className="relative group">
                    <img
                      src={problemPhotoFile.data}
                      alt="Problem preview"
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => setProblemPhotoFile(null)}
                        data-testid="button-remove-problem-photo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
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

      {/* Register Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent data-testid="dialog-register-payment">
          <DialogHeader>
            <DialogTitle>{t("activeRentals.registerPayment", "Registrar Pago")}</DialogTitle>
            <DialogDescription>
              {t("activeRentals.registerPaymentDesc", "Sube el comprobante de tu transferencia")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment && (
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">{t("activeRentals.amount", "Monto")}: </span>
                  ${selectedPayment.amount}
                </p>
                <p className="text-sm">
                  <span className="font-medium">{t("activeRentals.dueDate", "Fecha de Vencimiento")}: </span>
                  {format(new Date(selectedPayment.dueDate), "dd MMM yyyy", { locale: language === "es" ? es : undefined })}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("activeRentals.paymentProof", "Comprobante de Pago")}
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPaymentProofFile(file);
                  }
                }}
                data-testid="input-payment-proof"
              />
              {paymentProofFile && (
                <p className="text-sm text-secondary-foreground">
                  {t("activeRentals.fileSelected", "Archivo seleccionado")}: {paymentProofFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPaymentDialog(false);
                setSelectedPayment(null);
                setPaymentProofFile(null);
              }}
              data-testid="button-cancel-payment"
            >
              {t("activeRentals.cancel", "Cancelar")}
            </Button>
            <Button
              onClick={() => registerPaymentMutation.mutate()}
              disabled={!paymentProofFile || registerPaymentMutation.isPending}
              data-testid="button-submit-payment"
            >
              {registerPaymentMutation.isPending
                ? t("activeRentals.registering", "Registrando...")
                : t("activeRentals.register", "Registrar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
