import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  DollarSign, 
  Wrench, 
  Users, 
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Key,
  FileText,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PortalSummaryCard, PortalSummaryGrid } from "@/components/shared/PortalSummaryCard";
import { PropertyStatusCard, type PropertyStatus } from "@/components/shared/PropertyStatusCard";
import type { Property, RentalContract, MaintenanceSchedule } from "@shared/schema";

function mapPropertyStatus(approvalStatus: string, isRented: boolean): PropertyStatus {
  if (isRented) return "rented";
  const statusMap: Record<string, PropertyStatus> = {
    draft: "draft",
    pending_review: "pending_review",
    published: "published",
    rejected: "inactive",
  };
  return statusMap[approvalStatus] || "draft";
}

export default function OwnerHomeDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: properties = [], isLoading: loadingProperties } = useQuery<Property[]>({
    queryKey: ["/api/owner/properties"],
  });

  const { data: financialSummary, isLoading: loadingFinancial } = useQuery<{
    totalEarnings: number;
    paidAmount: number;
    pendingAmount: number;
    transactionCount: number;
  }>({
    queryKey: ["/api/income/my-summary"],
  });

  const { data: maintenanceSchedules = [], isLoading: loadingMaintenance } = useQuery<MaintenanceSchedule[]>({
    queryKey: ["/api/owner/maintenance-schedules"],
  });

  const { data: activeRentals = [], isLoading: loadingRentals } = useQuery<RentalContract[]>({
    queryKey: ["/api/owner/active-rentals"],
  });

  const { data: ownerApplication, isLoading: loadingApplication } = useQuery<any>({
    queryKey: ["/api/owner/my-application"],
    retry: false,
  });

  const isLoading = loadingProperties || loadingFinancial || loadingMaintenance || loadingRentals;

  const publishedProperties = properties.filter(p => p.approvalStatus === "published").length;
  const rentedProperties = activeRentals.length;
  const pendingProperties = properties.filter(p => p.approvalStatus === "pending_review").length;

  const pendingMaintenance = maintenanceSchedules.filter(m => {
    const dueDate = new Date(m.nextDue);
    return dueDate <= new Date() && m.isActive;
  }).length;

  const hasActiveContracts = activeRentals.length > 0;

  const propertiesWithStatus = properties.map(property => {
    const rental = activeRentals.find(r => r.propertyId === property.id);
    return {
      ...property,
      isRented: !!rental,
      rental,
      status: mapPropertyStatus(property.approvalStatus || "draft", !!rental),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-owner-welcome">
            ¡Hola, {user?.firstName || "Propietario"}!
          </h1>
          <p className="text-muted-foreground">
            Resumen de tus propiedades y actividades
          </p>
        </div>
        {hasActiveContracts && (
          <Button onClick={() => setLocation("/portal/owner")} data-testid="button-go-owner-portal">
            <Key className="h-4 w-4 mr-2" />
            Ir al Portal
          </Button>
        )}
      </div>

      {ownerApplication && ownerApplication.status === "pending" && (
        <Card className="border-yellow-500/30 bg-yellow-500/5" data-testid="card-owner-application-pending">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Tu solicitud como propietario está en revisión</h3>
                  <p className="text-sm text-muted-foreground">
                    Te notificaremos cuando sea aprobada
                  </p>
                </div>
              </div>
              <Badge variant="secondary">En revisión</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <PortalSummaryGrid columns={4}>
        <PortalSummaryCard
          title="Total Propiedades"
          icon={Building2}
          value={properties.length}
          subtitle={`${publishedProperties} publicadas`}
          loading={isLoading}
          action={{
            label: "Ver propiedades",
            onClick: () => setLocation("/mis-propiedades"),
          }}
        />
        <PortalSummaryCard
          title="Propiedades Rentadas"
          icon={Users}
          value={rentedProperties}
          subtitle={rentedProperties > 0 ? "Con inquilino activo" : "Sin inquilinos"}
          loading={isLoading}
          variant={rentedProperties > 0 ? "success" : "default"}
          action={hasActiveContracts ? {
            label: "Ver contratos",
            onClick: () => setLocation("/portal/owner"),
          } : undefined}
        />
        <PortalSummaryCard
          title="Ingresos del Mes"
          icon={DollarSign}
          value={financialSummary ? `$${financialSummary.paidAmount.toLocaleString()}` : "$0"}
          subtitle={financialSummary?.pendingAmount ? `$${financialSummary.pendingAmount.toLocaleString()} pendiente` : "Sin pagos pendientes"}
          loading={isLoading}
          variant={financialSummary?.pendingAmount && financialSummary.pendingAmount > 0 ? "warning" : "default"}
          action={{
            label: "Ver detalles",
            onClick: () => setLocation("/portal/owner?tab=payments"),
          }}
        />
        <PortalSummaryCard
          title="Mantenimientos"
          icon={Wrench}
          value={pendingMaintenance}
          subtitle={pendingMaintenance > 0 ? "Tareas pendientes" : "Todo al día"}
          loading={isLoading}
          variant={pendingMaintenance > 0 ? "warning" : "success"}
          action={{
            label: "Ver tareas",
            onClick: () => setLocation("/portal/owner?tab=maintenance"),
          }}
        />
      </PortalSummaryGrid>

      {pendingProperties > 0 && (
        <Card className="border-blue-500/30 bg-blue-500/5" data-testid="card-pending-properties">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">
                    {pendingProperties} propiedad{pendingProperties > 1 ? "es" : ""} en revisión
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Estamos verificando la información
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocation("/mis-propiedades")}>
                Ver estado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Mis Propiedades</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/mis-propiedades")}
            data-testid="button-view-all-properties"
          >
            Ver todas
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {properties.length === 0 ? (
          <Card className="text-center p-8" data-testid="empty-properties">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No tienes propiedades registradas</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Agrega tu primera propiedad para comenzar a rentarla
            </p>
            <Button onClick={() => setLocation("/owner/add-property")} data-testid="button-add-property-empty">
              <Plus className="h-4 w-4 mr-2" />
              Agregar propiedad
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {propertiesWithStatus.slice(0, 8).map((property) => (
              <PropertyStatusCard
                key={property.id}
                id={property.id}
                title={property.title || `Propiedad en ${property.location}`}
                image={property.images?.[0]}
                location={property.location}
                zone={property.zone}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                status={property.status}
                rentAmount={property.rental?.monthlyRent}
                currency={property.rental?.currency || "USD"}
                hasActiveContract={property.isRented}
                contractId={property.rental?.id}
                tenantName={property.rental?.tenantName}
                onEdit={() => setLocation(`/owner/edit-property/${property.id}`)}
                onViewPortal={() => setLocation("/portal/owner")}
              />
            ))}
          </div>
        )}
      </section>

      {activeRentals.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Contratos Activos</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/portal/owner")}
              data-testid="button-view-contracts"
            >
              Ver Portal
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeRentals.slice(0, 3).map((contract) => (
              <Card key={contract.id} className="hover-elevate cursor-pointer" onClick={() => setLocation("/portal/owner")} data-testid={`card-contract-${contract.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                      <Key className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {contract.propertyTitle || "Contrato de renta"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Inquilino: {contract.tenantName || "—"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          ${contract.monthlyRent?.toLocaleString()}/mes
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-green-600 border-green-600">
                          Activo
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {financialSummary && financialSummary.totalEarnings > 0 && (
        <Card data-testid="card-financial-summary">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Resumen Financiero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-green-600">
                  ${financialSummary.paidAmount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Cobrado este mes</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-yellow-600">
                  ${financialSummary.pendingAmount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Pendiente de cobro</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">
                  ${financialSummary.totalEarnings.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total histórico</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => setLocation("/portal/owner?tab=payments")}
              data-testid="button-view-financial-details"
            >
              Ver detalles financieros
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
