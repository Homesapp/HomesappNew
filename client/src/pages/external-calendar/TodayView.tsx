import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, DollarSign, Wrench, Home, Zap, Droplet, Wifi, Flame, Receipt } from "lucide-react";
import { format } from "date-fns";
import type { ExternalPayment, ExternalMaintenanceTicket, ExternalRentalContract, ExternalPaymentSchedule } from "@shared/schema";

type EventData = {
  type: 'payment' | 'ticket' | 'contract' | 'service';
  title: string;
  time: string;
  status: string;
  priority?: string;
  serviceType?: string;
  data: ExternalPayment | ExternalMaintenanceTicket | ExternalRentalContract | ExternalPaymentSchedule;
  condominium: string;
  unitNumber: string;
  tenantName?: string;
};

interface TodayViewProps {
  events: EventData[];
  language: string;
}

export function TodayView({ events, language }: TodayViewProps) {
  // Group events by condominium
  const groupedByCondominium = events.reduce((acc, event) => {
    const key = event.condominium || (language === "es" ? "Sin condominio" : "No condominium");
    if (!acc[key]) {
      acc[key] = {
        payments: [],
        services: [],
        tickets: [],
        contracts: []
      };
    }
    
    if (event.type === 'payment') acc[key].payments.push(event);
    else if (event.type === 'service') acc[key].services.push(event);
    else if (event.type === 'ticket') acc[key].tickets.push(event);
    else if (event.type === 'contract') acc[key].contracts.push(event);
    
    return acc;
  }, {} as Record<string, {payments: EventData[], services: EventData[], tickets: EventData[], contracts: EventData[]}>);

  const getServiceIcon = (serviceType?: string) => {
    if (!serviceType) return <Receipt className="h-4 w-4" />;
    switch (serviceType) {
      case 'electricity': return <Zap className="h-4 w-4" />;
      case 'water': return <Droplet className="h-4 w-4" />;
      case 'internet': return <Wifi className="h-4 w-4" />;
      case 'gas': return <Flame className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  const t = {
    title: language === "es" ? "Hoy" : "Today",
    noEvents: language === "es" ? "No hay eventos pendientes para hoy" : "No pending events for today",
    payments: language === "es" ? "Pagos de Renta" : "Rental Payments",
    services: language === "es" ? "Servicios" : "Services",
    tickets: language === "es" ? "Mantenimientos" : "Maintenance",
    contracts: language === "es" ? "Contratos" : "Contracts",
    unit: language === "es" ? "Unidad" : "Unit",
    tenant: language === "es" ? "Inquilino" : "Tenant",
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t.noEvents}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="today-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2" data-testid="text-today-title">
          <Clock className="h-6 w-6" />
          {t.title} - {format(new Date(), language === "es" ? "d 'de' MMMM" : "MMMM d")}
        </h2>
        <Badge variant="secondary" className="text-lg px-3 py-1" data-testid="badge-today-count">
          {events.length} {language === "es" ? "eventos" : "events"}
        </Badge>
      </div>

      {Object.entries(groupedByCondominium).map(([condoName, condoEvents]) => (
        <Card key={condoName} className="hover-elevate" data-testid={`card-condo-${condoName}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid={`text-condo-${condoName}`}>
              <Home className="h-5 w-5" />
              {condoName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {condoEvents.payments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  {t.payments} ({condoEvents.payments.length})
                </h4>
                <div className="space-y-2 ml-6">
                  {condoEvents.payments.map((event, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/50" data-testid={`payment-${idx}`}>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs" data-testid={`payment-time-${idx}`}>{event.time}</Badge>
                        <div>
                          <p className="text-sm font-medium" data-testid={`payment-unit-${idx}`}>{t.unit}: {event.unitNumber}</p>
                          {event.tenantName && (
                            <p className="text-xs text-muted-foreground" data-testid={`payment-tenant-${idx}`}>{t.tenant}: {event.tenantName}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={event.status === 'paid' ? 'default' : 'secondary'} data-testid={`payment-status-${idx}`}>
                        {event.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {condoEvents.services.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <Receipt className="h-4 w-4" />
                  {t.services} ({condoEvents.services.length})
                </h4>
                <div className="space-y-2 ml-6">
                  {condoEvents.services.map((event, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/50" data-testid={`service-${idx}`}>
                      <div className="flex items-center gap-3">
                        {getServiceIcon(event.serviceType)}
                        <Badge variant="outline" className="text-xs" data-testid={`service-time-${idx}`}>{event.time}</Badge>
                        <div>
                          <p className="text-sm font-medium" data-testid={`service-unit-${idx}`}>{t.unit}: {event.unitNumber}</p>
                          <p className="text-xs text-muted-foreground" data-testid={`service-title-${idx}`}>{event.title}</p>
                        </div>
                      </div>
                      <Badge variant={event.status === 'paid' ? 'default' : 'secondary'} data-testid={`service-status-${idx}`}>
                        {event.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {condoEvents.tickets.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <Wrench className="h-4 w-4" />
                  {t.tickets} ({condoEvents.tickets.length})
                </h4>
                <div className="space-y-2 ml-6">
                  {condoEvents.tickets.map((event, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">{event.time}</Badge>
                        <div>
                          <p className="text-sm font-medium">{t.unit}: {event.unitNumber}</p>
                          <p className="text-xs text-muted-foreground">{event.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.priority && (
                          <Badge variant={event.priority === 'high' ? 'destructive' : event.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                            {event.priority}
                          </Badge>
                        )}
                        <Badge variant={event.status === 'completed' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {condoEvents.contracts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4" />
                  {t.contracts} ({condoEvents.contracts.length})
                </h4>
                <div className="space-y-2 ml-6">
                  {condoEvents.contracts.map((event, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{t.unit}: {event.unitNumber}</p>
                      </div>
                      <Badge variant="default">{event.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
