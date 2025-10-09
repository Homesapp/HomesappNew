import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
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
  Users
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

export default function OwnerActiveRentals() {
  const { t, language } = useLanguage();
  const [selectedRental, setSelectedRental] = useState<string | null>(null);

  const { data: rentals = [], isLoading: rentalsLoading } = useQuery<ActiveRental[]>({
    queryKey: ["/api/owner/active-rentals"],
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

  if (rentalsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (rentals.length === 0) {
    return (
      <div className="container mx-auto p-6">
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
              <TabsList className="grid w-full grid-cols-3" data-testid="tabs-rental-sections">
                <TabsTrigger value="contract" data-testid="tab-contract">
                  <FileText className="mr-2 h-4 w-4" />
                  {language === "es" ? "Contrato" : "Contract"}
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
  );
}
