import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Home, 
  User, 
  FileText, 
  Package, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Banknote,
  Car,
  PawPrint,
  Users,
  Zap,
  Droplet,
  Wifi,
  Flame,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ActiveRental {
  id: string;
  propertyId: string;
  tenantId: string;
  monthlyRent: string;
  depositAmount: string;
  leaseStartDate: string;
  leaseEndDate: string;
  checkInDate: string;
  status: string;
}

interface PropertyDeliveryInventory {
  id: string;
  rentalContractId: string;
  generalCondition: string;
  generalNotes?: string;
  livingRoomItems?: any[];
  kitchenItems?: any[];
  bedroomItems?: any[];
  bathroomItems?: any[];
  waterMeterReading?: string;
  electricityMeterReading?: string;
  gasMeterReading?: string;
  keysProvided: number;
  remoteControls: number;
  accessCards: number;
  ownerSignedAt?: string;
  tenantSignedAt?: string;
}

interface TenantMoveInForm {
  id: string;
  rentalContractId: string;
  fullName: string;
  dateOfBirth?: string;
  nationality?: string;
  occupation?: string;
  employer?: string;
  idType?: string;
  idNumber?: string;
  emergencyContact1Name?: string;
  emergencyContact1Phone?: string;
  emergencyContact1Relationship?: string;
  emergencyContact2Name?: string;
  emergencyContact2Phone?: string;
  emergencyContact2Relationship?: string;
  hasVehicle: boolean;
  vehicleMake?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
  hasPets: boolean;
  petDetails?: string;
  additionalOccupants?: any[];
  specialRequests?: string;
  allergies?: string;
  tenantSignedAt?: string;
}

interface RentalPayment {
  id: string;
  rentalContractId: string;
  tenantId: string;
  serviceType: string;
  amount: string;
  dueDate: string;
  paymentDate?: string;
  status: string;
  paymentProof?: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export default function OwnerActiveRentals() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [selectedRental, setSelectedRental] = useState<string | null>(null);

  const { data: rentals = [], isLoading: rentalsLoading } = useQuery<ActiveRental[]>({
    queryKey: ["/api/owner/active-rentals"],
  });

  // Obtener contratos en proceso del propietario
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ["/api/rental-contracts", { ownerId: user?.id, statuses: "draft,apartado,firmado,check_in" }],
    queryFn: async () => {
      const params = new URLSearchParams();
      // Necesitamos obtener contratos donde el usuario es propietario
      const response = await fetch(`/api/rental-contracts`);
      if (!response.ok) throw new Error("Failed to fetch contracts");
      const allContracts = await response.json();
      // Filtrar contratos en proceso donde el usuario es el propietario
      return allContracts.filter((c: any) => 
        ["draft", "apartado", "firmado", "check_in"].includes(c.status) &&
        c.ownerId === user?.id
      );
    },
    enabled: !!user?.id,
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery<PropertyDeliveryInventory>({
    queryKey: ["/api/owner/rentals", selectedRental, "inventory"],
    queryFn: async () => {
      const response = await fetch(`/api/owner/rentals/${selectedRental}/inventory`);
      if (!response.ok) throw new Error("Failed to fetch inventory");
      return response.json();
    },
    enabled: !!selectedRental,
  });

  const { data: moveInForm, isLoading: moveInFormLoading } = useQuery<TenantMoveInForm>({
    queryKey: ["/api/owner/rentals", selectedRental, "move-in-form"],
    queryFn: async () => {
      const response = await fetch(`/api/owner/rentals/${selectedRental}/move-in-form`);
      if (!response.ok) throw new Error("Failed to fetch move-in form");
      return response.json();
    },
    enabled: !!selectedRental,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<RentalPayment[]>({
    queryKey: ["/api/rentals", selectedRental, "payments"],
    queryFn: async () => {
      const response = await fetch(`/api/rentals/${selectedRental}/payments`);
      if (!response.ok) throw new Error("Failed to fetch payments");
      return response.json();
    },
    enabled: !!selectedRental,
  });

  const approvePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      return apiRequest("POST", `/api/rentals/payments/${paymentId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals", selectedRental, "payments"] });
    },
  });

  const selectedRentalData = rentals.find(r => r.id === selectedRental);

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(num);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "PPP", { locale: language === "es" ? es : undefined });
  };

  const getConditionBadge = (condition: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      excellent: { variant: "default", label: language === "es" ? "Excelente" : "Excellent" },
      good: { variant: "secondary", label: language === "es" ? "Bueno" : "Good" },
      fair: { variant: "outline", label: language === "es" ? "Regular" : "Fair" },
      poor: { variant: "destructive", label: language === "es" ? "Malo" : "Poor" },
    };
    const config = variants[condition] || variants.good;
    return <Badge variant={config.variant} data-testid={`badge-condition-${condition}`}>{config.label}</Badge>;
  };

  const getContractStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: language === "es" ? "Borrador" : "Draft", variant: "secondary" as const },
      apartado: { label: language === "es" ? "Apartado" : "Reserved", variant: "default" as const },
      firmado: { label: language === "es" ? "Firmado" : "Signed", variant: "default" as const },
      check_in: { label: language === "es" ? "Check-in Pendiente" : "Check-in Pending", variant: "default" as const },
      activo: { label: language === "es" ? "Activo" : "Active", variant: "default" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getContractProgress = (contract: any) => {
    const steps = {
      draft: { 
        step: 1, 
        total: 5, 
        message: language === "es" 
          ? "Esperando información del inquilino" 
          : "Waiting for tenant information" 
      },
      apartado: { 
        step: 2, 
        total: 5, 
        message: language === "es" 
          ? "Revisión de documentos en proceso" 
          : "Document review in process" 
      },
      firmado: { 
        step: 3, 
        total: 5, 
        message: language === "es" 
          ? "Contrato firmado, esperando check-in" 
          : "Contract signed, awaiting check-in" 
      },
      check_in: { 
        step: 4, 
        total: 5, 
        message: language === "es" 
          ? "Check-in pendiente" 
          : "Check-in pending" 
      },
      activo: { 
        step: 5, 
        total: 5, 
        message: language === "es" 
          ? "Contrato activo" 
          : "Active contract" 
      },
    };
    return steps[contract.status as keyof typeof steps] || steps.draft;
  };

  if (rentalsLoading || contractsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          {language === "es" ? "Rentas Activas" : "Active Rentals"}
        </h1>
      </div>

      {/* Alertas de acciones pendientes */}
      {contracts.some((c: any) => c.status === "apartado") && (
        <Alert data-testid="alert-pending-actions">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {language === "es" 
              ? "Tienes contratos que requieren tu atención. Completa la información de propietario para continuar el proceso."
              : "You have contracts that require your attention. Complete the owner information to continue the process."}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={contracts.length > 0 ? "contracts" : "rentals"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contracts" data-testid="tab-contracts-in-process">
            {language === "es" ? "Contratos en Proceso" : "Contracts in Progress"}
            {contracts.length > 0 && (
              <Badge variant="secondary" className="ml-2">{contracts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rentals" data-testid="tab-active-rentals">
            {language === "es" ? "Rentas Activas" : "Active Rentals"}
            {rentals.length > 0 && (
              <Badge variant="secondary" className="ml-2">{rentals.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="mt-6 space-y-4">
          {contracts.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "es" ? "No tienes contratos en proceso" : "No contracts in progress"}
                </CardTitle>
                <CardDescription>
                  {language === "es"
                    ? "Cuando una oferta sea aceptada, el contrato aparecerá aquí"
                    : "When an offer is accepted, the contract will appear here"}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              {contracts.map((contract: any) => {
                const progress = getContractProgress(contract);
                return (
                  <Card key={contract.id} className="hover-elevate" data-testid={`card-contract-${contract.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {language === "es" ? "Contrato de Renta" : "Rental Contract"}
                          </CardTitle>
                          <CardDescription>
                            {language === "es" ? "Propiedad ID" : "Property ID"}: {contract.propertyId}
                          </CardDescription>
                        </div>
                        {getContractStatusBadge(contract.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-tertiary-foreground" />
                          <span className="text-sm">
                            {language === "es" ? "Renta" : "Rent"}: ${contract.monthlyRent}/{language === "es" ? "mes" : "month"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-tertiary-foreground" />
                          <span className="text-sm">
                            {language === "es" ? "Duración" : "Duration"}: {contract.leaseDurationMonths} {language === "es" ? "meses" : "months"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-tertiary-foreground">
                            {language === "es" ? "Progreso del contrato" : "Contract progress"}
                          </span>
                          <span className="font-medium">{progress.step} {language === "es" ? "de" : "of"} {progress.total}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all" 
                            style={{ width: `${(progress.step / progress.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-sm text-tertiary-foreground">{progress.message}</p>
                      </div>

                      {contract.status === "apartado" && (
                        <Button 
                          className="w-full" 
                          onClick={() => window.location.href = `/contract-owner-form/${contract.id}`}
                          data-testid={`button-complete-owner-form-${contract.id}`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {language === "es" ? "Completar Información de Propietario" : "Complete Owner Information"}
                        </Button>
                      )}

                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.location.href = `/contract/${contract.id}`}
                        data-testid={`button-view-details-${contract.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {language === "es" ? "Ver Detalles del Contrato" : "View Contract Details"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </TabsContent>

        <TabsContent value="rentals" className="mt-6">
          {rentals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Home className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2" data-testid="text-no-rentals">
                  {language === "es" ? "No tienes rentas activas" : "You have no active rentals"}
                </h3>
                <p className="text-muted-foreground text-center" data-testid="text-no-rentals-description">
                  {language === "es"
                    ? "Cuando tengas propiedades rentadas, aparecerán aquí"
                    : "When you have rented properties, they will appear here"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card data-testid="card-rentals-list">
            <CardHeader>
              <CardTitle data-testid="text-rentals-list-title">
                {language === "es" ? "Mis Rentas" : "My Rentals"}
              </CardTitle>
              <CardDescription data-testid="text-rentals-count">
                {rentals.length} {rentals.length === 1 
                  ? (language === "es" ? "renta activa" : "active rental")
                  : (language === "es" ? "rentas activas" : "active rentals")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {rentals.map((rental) => (
                <Button
                  key={rental.id}
                  variant={selectedRental === rental.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedRental(rental.id)}
                  data-testid={`button-select-rental-${rental.id}`}
                >
                  <Home className="mr-2 h-4 w-4" />
                  <div className="flex-1 text-left">
                    <div className="font-medium" data-testid={`text-rental-id-${rental.id}`}>
                      {language === "es" ? "Propiedad" : "Property"} #{rental.propertyId.slice(0, 8)}
                    </div>
                    <div className="text-sm text-muted-foreground" data-testid={`text-rental-amount-${rental.id}`}>
                      {formatCurrency(rental.monthlyRent)}/{language === "es" ? "mes" : "month"}
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedRental && selectedRentalData ? (
            <Tabs defaultValue="contract" className="w-full">
              <TabsList className="grid w-full grid-cols-4" data-testid="tabs-rental-sections">
                <TabsTrigger value="contract" data-testid="tab-contract">
                  <FileText className="mr-2 h-4 w-4" />
                  {language === "es" ? "Contrato" : "Contract"}
                </TabsTrigger>
                <TabsTrigger value="payments" data-testid="tab-payments">
                  <DollarSign className="mr-2 h-4 w-4" />
                  {language === "es" ? "Pagos" : "Payments"}
                </TabsTrigger>
                <TabsTrigger value="inventory" data-testid="tab-inventory">
                  <Package className="mr-2 h-4 w-4" />
                  {language === "es" ? "Inventario" : "Inventory"}
                </TabsTrigger>
                <TabsTrigger value="tenant" data-testid="tab-tenant">
                  <User className="mr-2 h-4 w-4" />
                  {language === "es" ? "Inquilino" : "Tenant"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contract" className="space-y-4">
                <Card data-testid="card-contract-details">
                  <CardHeader>
                    <CardTitle data-testid="text-contract-title">
                      {language === "es" ? "Detalles del Contrato" : "Contract Details"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground" data-testid="label-monthly-rent">
                          {language === "es" ? "Renta Mensual" : "Monthly Rent"}
                        </p>
                        <p className="text-2xl font-bold" data-testid="text-monthly-rent">
                          {formatCurrency(selectedRentalData.monthlyRent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground" data-testid="label-deposit">
                          {language === "es" ? "Depósito" : "Deposit"}
                        </p>
                        <p className="text-2xl font-bold" data-testid="text-deposit">
                          {formatCurrency(selectedRentalData.depositAmount)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground" data-testid="label-lease-start">
                          {language === "es" ? "Inicio del Contrato" : "Lease Start"}
                        </span>
                        <span className="font-medium" data-testid="text-lease-start">
                          {formatDate(selectedRentalData.leaseStartDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground" data-testid="label-lease-end">
                          {language === "es" ? "Fin del Contrato" : "Lease End"}
                        </span>
                        <span className="font-medium" data-testid="text-lease-end">
                          {formatDate(selectedRentalData.leaseEndDate)}
                        </span>
                      </div>
                      {selectedRentalData.checkInDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground" data-testid="label-check-in">
                            {language === "es" ? "Check-in" : "Check-in"}
                          </span>
                          <span className="font-medium" data-testid="text-check-in">
                            {formatDate(selectedRentalData.checkInDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-bank-info">
                  <CardHeader>
                    <CardTitle data-testid="text-bank-info-title">
                      <Banknote className="inline mr-2 h-5 w-5" />
                      {language === "es" ? "Cuenta para Depósitos" : "Bank Account for Deposits"}
                    </CardTitle>
                    <CardDescription data-testid="text-bank-info-description">
                      {language === "es" 
                        ? "El inquilino puede depositar la renta mensual a esta cuenta"
                        : "Tenant can deposit monthly rent to this account"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" data-testid="button-configure-bank">
                      {language === "es" ? "Configurar Cuenta Bancaria" : "Configure Bank Account"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                {paymentsLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <Card data-testid="card-payments">
                    <CardHeader>
                      <CardTitle data-testid="text-payments-title">
                        {language === "es" ? "Gestión de Pagos" : "Payment Management"}
                      </CardTitle>
                      <CardDescription data-testid="text-payments-description">
                        {language === "es" 
                          ? "Revisa y aprueba los pagos por servicio"
                          : "Review and approve service payments"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="rent" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                          <TabsTrigger value="rent" data-testid="tab-service-rent">
                            <DollarSign className="mr-2 h-4 w-4" />
                            {t("services.rent")}
                          </TabsTrigger>
                          <TabsTrigger value="electricity" data-testid="tab-service-electricity">
                            <Zap className="mr-2 h-4 w-4" />
                            {t("services.electricity")}
                          </TabsTrigger>
                          <TabsTrigger value="water" data-testid="tab-service-water">
                            <Droplet className="mr-2 h-4 w-4" />
                            {t("services.water")}
                          </TabsTrigger>
                          <TabsTrigger value="internet" data-testid="tab-service-internet">
                            <Wifi className="mr-2 h-4 w-4" />
                            {t("services.internet")}
                          </TabsTrigger>
                          <TabsTrigger value="gas" data-testid="tab-service-gas">
                            <Flame className="mr-2 h-4 w-4" />
                            {t("services.gas")}
                          </TabsTrigger>
                        </TabsList>

                        {["rent", "electricity", "water", "internet", "gas"].map((serviceType) => {
                          const servicePayments = payments.filter(p => p.serviceType === serviceType);
                          
                          return (
                            <TabsContent key={serviceType} value={serviceType} className="space-y-4">
                              {servicePayments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8" data-testid={`no-payments-${serviceType}`}>
                                  <DollarSign className="h-12 w-12 text-muted-foreground mb-2" />
                                  <p className="text-muted-foreground">
                                    {language === "es" 
                                      ? `No hay pagos de ${t(`services.${serviceType}`).toLowerCase()}` 
                                      : `No ${t(`services.${serviceType}`).toLowerCase()} payments`}
                                  </p>
                                </div>
                              ) : (
                                <Table data-testid={`table-payments-${serviceType}`}>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead data-testid={`header-due-date-${serviceType}`}>
                                        {language === "es" ? "Fecha de Vencimiento" : "Due Date"}
                                      </TableHead>
                                      <TableHead data-testid={`header-amount-${serviceType}`}>
                                        {language === "es" ? "Monto" : "Amount"}
                                      </TableHead>
                                      <TableHead data-testid={`header-status-${serviceType}`}>
                                        {language === "es" ? "Estado" : "Status"}
                                      </TableHead>
                                      <TableHead data-testid={`header-payment-date-${serviceType}`}>
                                        {language === "es" ? "Fecha de Pago" : "Payment Date"}
                                      </TableHead>
                                      <TableHead data-testid={`header-actions-${serviceType}`}>
                                        {language === "es" ? "Acciones" : "Actions"}
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {servicePayments.map((payment) => (
                                      <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                                        <TableCell data-testid={`cell-due-date-${payment.id}`}>
                                          {formatDate(payment.dueDate)}
                                        </TableCell>
                                        <TableCell data-testid={`cell-amount-${payment.id}`}>
                                          {formatCurrency(payment.amount)}
                                        </TableCell>
                                        <TableCell data-testid={`cell-status-${payment.id}`}>
                                          <Badge 
                                            variant={payment.status === "paid" ? "default" : "outline"}
                                            data-testid={`badge-status-${payment.id}`}
                                          >
                                            {payment.status === "paid" 
                                              ? (language === "es" ? "Pagado" : "Paid")
                                              : (language === "es" ? "Pendiente" : "Pending")}
                                          </Badge>
                                        </TableCell>
                                        <TableCell data-testid={`cell-payment-date-${payment.id}`}>
                                          {payment.paymentDate ? formatDate(payment.paymentDate) : "-"}
                                        </TableCell>
                                        <TableCell data-testid={`cell-actions-${payment.id}`}>
                                          {payment.approvedBy ? (
                                            <Badge variant="secondary" data-testid={`badge-approved-${payment.id}`}>
                                              {language === "es" ? "Aprobado" : "Approved"}
                                            </Badge>
                                          ) : payment.status === "paid" ? (
                                            <Button
                                              size="sm"
                                              onClick={() => approvePaymentMutation.mutate(payment.id)}
                                              disabled={approvePaymentMutation.isPending}
                                              data-testid={`button-approve-${payment.id}`}
                                            >
                                              {approvePaymentMutation.isPending 
                                                ? (language === "es" ? "Aprobando..." : "Approving...")
                                                : (language === "es" ? "Aprobar" : "Approve")}
                                            </Button>
                                          ) : null}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </TabsContent>
                          );
                        })}
                      </Tabs>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4">
                {inventoryLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : inventory ? (
                  <Card data-testid="card-inventory-details">
                    <CardHeader>
                      <CardTitle data-testid="text-inventory-title">
                        {language === "es" ? "Inventario de Entrega" : "Delivery Inventory"}
                      </CardTitle>
                      <CardDescription data-testid="text-inventory-description">
                        {language === "es"
                          ? "Estado de la propiedad al momento de la entrega"
                          : "Property condition at delivery"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2" data-testid="text-general-condition-label">
                          {language === "es" ? "Estado General" : "General Condition"}
                        </h3>
                        {getConditionBadge(inventory.generalCondition)}
                        {inventory.generalNotes && (
                          <p className="mt-2 text-sm text-muted-foreground" data-testid="text-general-notes">
                            {inventory.generalNotes}
                          </p>
                        )}
                      </div>

                      <Separator />

                      {inventory.livingRoomItems && inventory.livingRoomItems.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3" data-testid="text-living-room-label">
                            {language === "es" ? "Sala" : "Living Room"}
                          </h3>
                          <Table data-testid="table-living-room-items">
                            <TableHeader>
                              <TableRow>
                                <TableHead data-testid="header-item">{language === "es" ? "Artículo" : "Item"}</TableHead>
                                <TableHead data-testid="header-quantity">{language === "es" ? "Cantidad" : "Quantity"}</TableHead>
                                <TableHead data-testid="header-condition">{language === "es" ? "Estado" : "Condition"}</TableHead>
                                <TableHead data-testid="header-notes">{language === "es" ? "Notas" : "Notes"}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {inventory.livingRoomItems.map((item: any, idx: number) => (
                                <TableRow key={idx} data-testid={`row-living-room-item-${idx}`}>
                                  <TableCell data-testid={`cell-item-${idx}`}>{item.item}</TableCell>
                                  <TableCell data-testid={`cell-quantity-${idx}`}>{item.quantity}</TableCell>
                                  <TableCell data-testid={`cell-condition-${idx}`}>{getConditionBadge(item.condition)}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground" data-testid={`cell-notes-${idx}`}>
                                    {item.notes}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {inventory.kitchenItems && inventory.kitchenItems.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3" data-testid="text-kitchen-label">
                            {language === "es" ? "Cocina" : "Kitchen"}
                          </h3>
                          <Table data-testid="table-kitchen-items">
                            <TableHeader>
                              <TableRow>
                                <TableHead>{language === "es" ? "Artículo" : "Item"}</TableHead>
                                <TableHead>{language === "es" ? "Cantidad" : "Quantity"}</TableHead>
                                <TableHead>{language === "es" ? "Estado" : "Condition"}</TableHead>
                                <TableHead>{language === "es" ? "Notas" : "Notes"}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {inventory.kitchenItems.map((item: any, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell>{item.item}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>{getConditionBadge(item.condition)}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{item.notes}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground" data-testid="label-keys">
                            {language === "es" ? "Llaves Entregadas" : "Keys Provided"}
                          </p>
                          <p className="text-lg font-semibold" data-testid="text-keys-count">{inventory.keysProvided}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground" data-testid="label-remotes">
                            {language === "es" ? "Controles Remotos" : "Remote Controls"}
                          </p>
                          <p className="text-lg font-semibold" data-testid="text-remotes-count">{inventory.remoteControls}</p>
                        </div>
                      </div>

                      {(inventory.waterMeterReading || inventory.electricityMeterReading) && (
                        <>
                          <Separator />
                          <div className="grid grid-cols-2 gap-4">
                            {inventory.waterMeterReading && (
                              <div>
                                <p className="text-sm text-muted-foreground" data-testid="label-water-meter">
                                  {language === "es" ? "Medidor de Agua" : "Water Meter"}
                                </p>
                                <p className="font-medium" data-testid="text-water-meter">{inventory.waterMeterReading}</p>
                              </div>
                            )}
                            {inventory.electricityMeterReading && (
                              <div>
                                <p className="text-sm text-muted-foreground" data-testid="label-electricity-meter">
                                  {language === "es" ? "Medidor de Luz" : "Electricity Meter"}
                                </p>
                                <p className="font-medium" data-testid="text-electricity-meter">{inventory.electricityMeterReading}</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card data-testid="card-no-inventory">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Package className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground" data-testid="text-no-inventory">
                        {language === "es"
                          ? "No hay inventario de entrega registrado"
                          : "No delivery inventory recorded"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="tenant" className="space-y-4">
                {moveInFormLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : moveInForm ? (
                  <Card data-testid="card-tenant-info">
                    <CardHeader>
                      <CardTitle data-testid="text-tenant-info-title">
                        {language === "es" ? "Información del Inquilino" : "Tenant Information"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-3" data-testid="text-personal-info-label">
                          {language === "es" ? "Información Personal" : "Personal Information"}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground" data-testid="label-full-name">
                              {language === "es" ? "Nombre Completo" : "Full Name"}
                            </p>
                            <p className="font-medium" data-testid="text-full-name">{moveInForm.fullName}</p>
                          </div>
                          {moveInForm.dateOfBirth && (
                            <div>
                              <p className="text-sm text-muted-foreground" data-testid="label-date-of-birth">
                                {language === "es" ? "Fecha de Nacimiento" : "Date of Birth"}
                              </p>
                              <p className="font-medium" data-testid="text-date-of-birth">
                                {formatDate(moveInForm.dateOfBirth)}
                              </p>
                            </div>
                          )}
                          {moveInForm.nationality && (
                            <div>
                              <p className="text-sm text-muted-foreground" data-testid="label-nationality">
                                {language === "es" ? "Nacionalidad" : "Nationality"}
                              </p>
                              <p className="font-medium" data-testid="text-nationality">{moveInForm.nationality}</p>
                            </div>
                          )}
                          {moveInForm.occupation && (
                            <div>
                              <p className="text-sm text-muted-foreground" data-testid="label-occupation">
                                {language === "es" ? "Ocupación" : "Occupation"}
                              </p>
                              <p className="font-medium" data-testid="text-occupation">{moveInForm.occupation}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-semibold mb-3" data-testid="text-emergency-contacts-label">
                          {language === "es" ? "Contactos de Emergencia" : "Emergency Contacts"}
                        </h3>
                        <div className="space-y-4">
                          {moveInForm.emergencyContact1Name && (
                            <div>
                              <p className="font-medium" data-testid="text-emergency1-name">{moveInForm.emergencyContact1Name}</p>
                              <p className="text-sm text-muted-foreground" data-testid="text-emergency1-details">
                                {moveInForm.emergencyContact1Phone} - {moveInForm.emergencyContact1Relationship}
                              </p>
                            </div>
                          )}
                          {moveInForm.emergencyContact2Name && (
                            <div>
                              <p className="font-medium" data-testid="text-emergency2-name">{moveInForm.emergencyContact2Name}</p>
                              <p className="text-sm text-muted-foreground" data-testid="text-emergency2-details">
                                {moveInForm.emergencyContact2Phone} - {moveInForm.emergencyContact2Relationship}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {moveInForm.hasVehicle && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="font-semibold mb-3 flex items-center" data-testid="text-vehicle-label">
                              <Car className="mr-2 h-5 w-5" />
                              {language === "es" ? "Vehículo" : "Vehicle"}
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground" data-testid="label-vehicle-make">
                                  {language === "es" ? "Marca/Modelo" : "Make/Model"}
                                </p>
                                <p className="font-medium" data-testid="text-vehicle-make-model">
                                  {moveInForm.vehicleMake} {moveInForm.vehicleModel}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground" data-testid="label-vehicle-plate">
                                  {language === "es" ? "Placa" : "License Plate"}
                                </p>
                                <p className="font-medium" data-testid="text-vehicle-plate">{moveInForm.vehiclePlate}</p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {moveInForm.hasPets && moveInForm.petDetails && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="font-semibold mb-3 flex items-center" data-testid="text-pets-label">
                              <PawPrint className="mr-2 h-5 w-5" />
                              {language === "es" ? "Mascotas" : "Pets"}
                            </h3>
                            <p className="text-muted-foreground" data-testid="text-pet-details">{moveInForm.petDetails}</p>
                          </div>
                        </>
                      )}

                      {moveInForm.additionalOccupants && moveInForm.additionalOccupants.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="font-semibold mb-3 flex items-center" data-testid="text-occupants-label">
                              <Users className="mr-2 h-5 w-5" />
                              {language === "es" ? "Ocupantes Adicionales" : "Additional Occupants"}
                            </h3>
                            <div className="space-y-2">
                              {moveInForm.additionalOccupants.map((occupant: any, idx: number) => (
                                <div key={idx} className="flex justify-between" data-testid={`div-occupant-${idx}`}>
                                  <span data-testid={`text-occupant-name-${idx}`}>{occupant.name}</span>
                                  <span className="text-muted-foreground" data-testid={`text-occupant-details-${idx}`}>
                                    {occupant.age} {language === "es" ? "años" : "years"} - {occupant.relationship}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card data-testid="card-no-tenant-info">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <User className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground" data-testid="text-no-tenant-info">
                        {language === "es"
                          ? "No hay formulario de ingreso registrado"
                          : "No move-in form recorded"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-select-rental">
                  {language === "es"
                    ? "Selecciona una renta para ver los detalles"
                    : "Select a rental to view details"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
