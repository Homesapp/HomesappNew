import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, CheckCircle, Clock, Home, TrendingUp, ArrowRight } from "lucide-react";
import type { Lead, Property } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type LeadWithOffersCount = Lead & {
  offersCount?: number;
};

export default function SellerDashboard() {
  const { user } = useAuth();
  
  const { data: myLeads = [], isLoading: loadingLeads } = useQuery<LeadWithOffersCount[]>({
    queryKey: ["/api/leads"],
  });

  const { data: properties = [], isLoading: loadingProperties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const totalLeads = myLeads.length;
  const verifiedLeads = myLeads.filter(lead => lead.emailVerified).length;
  const unverifiedLeads = myLeads.filter(lead => !lead.emailVerified).length;
  const recentLeads = myLeads
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const activeProperties = properties.filter(p => p.approvalStatus === "published" && p.active).length;

  const isLoading = loadingLeads || loadingProperties;

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
        <h1 className="text-2xl font-bold" data-testid="heading-seller-dashboard">
          Dashboard de Vendedor
        </h1>
        <p className="text-muted-foreground">
          Bienvenido, {user?.firstName} {user?.lastName}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-leads">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Leads registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-verified-leads">{verifiedLeads}</div>
            <p className="text-xs text-muted-foreground">
              Con email verificado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-unverified-leads">{unverifiedLeads}</div>
            <p className="text-xs text-muted-foreground">
              Sin verificar email
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-properties">{activeProperties}</div>
            <p className="text-xs text-muted-foreground">
              Activas disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle data-testid="heading-recent-leads">Leads Recientes</CardTitle>
                <CardDescription>
                  Tus últimos 5 leads registrados
                </CardDescription>
              </div>
              <Link href="/leads">
                <Button variant="outline" size="sm" data-testid="button-view-all-leads">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tienes leads registrados aún
              </div>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border rounded-lg hover-elevate"
                    data-testid={`card-lead-${lead.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate" data-testid={`text-lead-name-${lead.id}`}>
                          {lead.firstName} {lead.lastName}
                        </h3>
                        {lead.emailVerified ? (
                          <Badge variant="default" className="gap-1" data-testid={`badge-verified-${lead.id}`}>
                            <CheckCircle className="h-3 w-3" />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1" data-testid={`badge-pending-${lead.id}`}>
                            <Clock className="h-3 w-3" />
                            Pendiente
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </span>
                        {lead.phone && (
                          <span>Tel: {lead.phone}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Registrado: {format(new Date(lead.createdAt), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                    <Link href={`/leads?leadId=${lead.id}`} className="block md:inline">
                      <Button variant="ghost" size="sm" className="w-full md:w-auto" data-testid={`button-view-lead-${lead.id}`}>
                        Ver detalles
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle data-testid="heading-quick-actions">Acciones Rápidas</CardTitle>
            <CardDescription>
              Gestiona tus leads y propiedades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/leads">
                <Button variant="outline" className="w-full justify-start" data-testid="button-manage-leads">
                  <Users className="mr-2 h-4 w-4" />
                  Gestionar Leads
                </Button>
              </Link>
              <Link href="/properties">
                <Button variant="outline" className="w-full justify-start" data-testid="button-view-properties">
                  <Home className="mr-2 h-4 w-4" />
                  Ver Propiedades
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="outline" className="w-full justify-start" data-testid="button-open-chat">
                  <Mail className="mr-2 h-4 w-4" />
                  Chat con Leads
                </Button>
              </Link>
              <Link href="/referidos">
                <Button variant="outline" className="w-full justify-start" data-testid="button-view-referrals">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Mis Referidos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
