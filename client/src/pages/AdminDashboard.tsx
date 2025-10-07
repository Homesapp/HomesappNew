import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, FileEdit, ClipboardCheck, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import type { Property, PropertyChangeRequest, InspectionReport, User } from "@shared/schema";

export default function AdminDashboard() {
  const { data: properties = [], isLoading: loadingProperties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: changeRequests = [], isLoading: loadingChangeRequests } = useQuery<PropertyChangeRequest[]>({
    queryKey: ["/api/admin/change-requests"],
  });

  const { data: inspectionReports = [], isLoading: loadingInspections } = useQuery<InspectionReport[]>({
    queryKey: ["/api/admin/inspection-reports"],
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Calculate stats
  const totalProperties = properties.length;
  const publishedProperties = properties.filter(p => p.approvalStatus === "published").length;
  const pendingReview = properties.filter(p => p.approvalStatus === "pending_review").length;
  const inspectionScheduled = properties.filter(p => p.approvalStatus === "inspection_scheduled").length;

  const pendingChangeRequests = changeRequests.filter(cr => cr.status === "pending");
  const approvedChangeRequests = changeRequests.filter(cr => cr.status === "approved");
  const rejectedChangeRequests = changeRequests.filter(cr => cr.status === "rejected");

  const pendingInspections = inspectionReports.filter(ir => ir.status === "pending");
  const approvedInspections = inspectionReports.filter(ir => ir.status === "approved");

  const ownerUsers = users.filter(u => u.role === "owner").length;
  const clientUsers = users.filter(u => u.role === "cliente").length;

  const isLoading = loadingProperties || loadingChangeRequests || loadingInspections || loadingUsers;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-admin-dashboard">Dashboard Administrador</h1>
        <p className="text-muted-foreground">
          Métricas globales y actividades del sistema
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-properties">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {publishedProperties} publicadas, {pendingReview} pendientes
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {ownerUsers} propietarios, {clientUsers} clientes
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-changes">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cambios Pendientes</CardTitle>
            <FileEdit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingChangeRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {approvedChangeRequests.length} aprobados, {rejectedChangeRequests.length} rechazados
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-inspections">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspecciones Pendientes</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInspections.length}</div>
            <p className="text-xs text-muted-foreground">
              {approvedInspections.length} aprobadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews */}
      {(pendingChangeRequests.length > 0 || pendingInspections.length > 0 || pendingReview > 0) && (
        <Card data-testid="card-pending-reviews">
          <CardHeader>
            <CardTitle>Revisiones Pendientes</CardTitle>
            <CardDescription>
              Elementos que requieren tu atención
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingChangeRequests.length > 0 && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <FileEdit className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium">Solicitudes de cambio</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingChangeRequests.length} solicitud{pendingChangeRequests.length > 1 ? "es" : ""} esperando revisión
                    </p>
                  </div>
                </div>
                <Link href="/admin/change-requests">
                  <Button size="sm" className="w-full md:w-auto" data-testid="button-view-change-requests">
                    Revisar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {pendingInspections.length > 0 && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium">Reportes de inspección</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingInspections.length} reporte{pendingInspections.length > 1 ? "s" : ""} pendiente{pendingInspections.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <Link href="/admin/inspection-reports">
                  <Button size="sm" className="w-full md:w-auto" data-testid="button-view-inspections">
                    Revisar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {pendingReview > 0 && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium">Propiedades en revisión</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingReview} propiedad{pendingReview > 1 ? "es" : ""} esperando revisión inicial
                    </p>
                  </div>
                </div>
                <Link href="/properties">
                  <Button size="sm" variant="outline" className="w-full md:w-auto" data-testid="button-view-properties">
                    Ver propiedades
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Property Status Overview */}
      <Card data-testid="card-property-overview">
        <CardHeader>
          <CardTitle>Estado de Propiedades</CardTitle>
          <CardDescription>Distribución por estado de aprobación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Publicadas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{publishedProperties}</span>
                <Badge variant="default">{Math.round((publishedProperties / totalProperties) * 100)}%</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">En revisión inicial</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{pendingReview}</span>
                <Badge variant="default">{totalProperties > 0 ? Math.round((pendingReview / totalProperties) * 100) : 0}%</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Inspección programada</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{inspectionScheduled}</span>
                <Badge variant="default">{totalProperties > 0 ? Math.round((inspectionScheduled / totalProperties) * 100) : 0}%</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Rechazadas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {properties.filter(p => p.approvalStatus === "rejected").length}
                </span>
                <Badge variant="destructive">
                  {totalProperties > 0 ? Math.round((properties.filter(p => p.approvalStatus === "rejected").length / totalProperties) * 100) : 0}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Acceso rápido a funciones administrativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/properties">
              <Button className="w-full justify-start gap-2" variant="outline" data-testid="button-properties">
                <Building2 className="h-4 w-4" />
                Propiedades
              </Button>
            </Link>
            <Link href="/admin/change-requests">
              <Button className="w-full justify-start gap-2" variant="outline" data-testid="button-change-requests">
                <FileEdit className="h-4 w-4" />
                Solicitudes de cambio
              </Button>
            </Link>
            <Link href="/admin/inspection-reports">
              <Button className="w-full justify-start gap-2" variant="outline" data-testid="button-inspections">
                <ClipboardCheck className="h-4 w-4" />
                Inspecciones
              </Button>
            </Link>
            <Link href="/users">
              <Button className="w-full justify-start gap-2" variant="outline" data-testid="button-users">
                <Users className="h-4 w-4" />
                Usuarios
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
