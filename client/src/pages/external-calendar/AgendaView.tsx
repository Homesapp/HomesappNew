import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, DollarSign, Wrench, Home, Zap, Droplet, Wifi, Flame, Receipt, Clock } from "lucide-react";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
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

interface AgendaViewProps {
  allEvents: EventData[];
  language: string;
}

export function AgendaView({ allEvents, language }: AgendaViewProps) {
  const now = new Date();
  const next7Days = addDays(now, 7);

  // Filter and group events by date for the next 7 days
  const upcomingEvents = allEvents.filter(event => {
    if (!event.data) return false;
    const eventDate = event.data.dueDate || event.data.scheduledDate || event.data.startDate;
    if (!eventDate) return false;
    const date = new Date(eventDate);
    return date >= startOfDay(now) && date <= next7Days;
  });

  // Sort by date and time - events are already filtered to have valid dates
  const sortedEvents = upcomingEvents.sort((a, b) => {
    const eventDateA = a.data?.dueDate || a.data?.scheduledDate || a.data?.startDate;
    const eventDateB = b.data?.dueDate || b.data?.scheduledDate || b.data?.startDate;
    
    // Skip comparison if either event lacks a date (should not happen after filter)
    if (!eventDateA || !eventDateB) return 0;
    
    const dateA = new Date(eventDateA);
    const dateB = new Date(eventDateB);
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    return a.time.localeCompare(b.time);
  });

  // Group by date
  const eventsByDate = sortedEvents.reduce((acc, event) => {
    const eventDateValue = event.data?.dueDate || event.data?.scheduledDate || event.data?.startDate;
    if (!eventDateValue) return acc;
    const eventDate = new Date(eventDateValue);
    const dateKey = format(eventDate, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: eventDate,
        events: []
      };
    }
    acc[dateKey].events.push(event);
    return acc;
  }, {} as Record<string, {date: Date, events: EventData[]}>);

  const getEventIcon = (event: EventData) => {
    if (event.type === 'payment') return <DollarSign className="h-4 w-4 text-green-600" />;
    if (event.type === 'service') {
      switch (event.serviceType) {
        case 'electricity': return <Zap className="h-4 w-4 text-yellow-600" />;
        case 'water': return <Droplet className="h-4 w-4 text-blue-600" />;
        case 'internet': return <Wifi className="h-4 w-4 text-purple-600" />;
        case 'gas': return <Flame className="h-4 w-4 text-orange-600" />;
        default: return <Receipt className="h-4 w-4" />;
      }
    }
    if (event.type === 'ticket') return <Wrench className="h-4 w-4 text-orange-600" />;
    return <Home className="h-4 w-4" />;
  };

  const t = {
    title: language === "es" ? "Agenda - Próximos 7 Días" : "Agenda - Next 7 Days",
    noEvents: language === "es" ? "No hay eventos próximos" : "No upcoming events",
    unit: language === "es" ? "Unidad" : "Unit",
    tenant: language === "es" ? "Inquilino" : "Tenant",
    today: language === "es" ? "Hoy" : "Today",
    tomorrow: language === "es" ? "Mañana" : "Tomorrow",
  };

  if (sortedEvents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t.noEvents}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="agenda-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2" data-testid="text-agenda-title">
          <Calendar className="h-6 w-6" />
          {t.title}
        </h2>
        <Badge variant="secondary" className="text-lg px-3 py-1" data-testid="badge-agenda-count">
          {sortedEvents.length} {language === "es" ? "eventos" : "events"}
        </Badge>
      </div>

      <div className="space-y-4">
        {Object.entries(eventsByDate).map(([dateKey, {date, events}]) => {
          const isToday = isSameDay(date, now);
          const isTomorrow = isSameDay(date, addDays(now, 1));
          
          let dateLabel = format(date, language === "es" ? "EEEE, d 'de' MMMM" : "EEEE, MMMM d");
          if (isToday) dateLabel = `${t.today} - ${dateLabel}`;
          else if (isTomorrow) dateLabel = `${t.tomorrow} - ${dateLabel}`;

          return (
            <Card key={dateKey} className="hover-elevate">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{dateLabel}</span>
                  <Badge variant="outline">{events.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {events.map((event, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors" data-testid={`agenda-event-${dateKey}-${idx}`}>
                    <div className="flex items-center gap-3 flex-1">
                      {getEventIcon(event)}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono" data-testid={`agenda-time-${dateKey}-${idx}`}>{event.time}</Badge>
                        <Separator orientation="vertical" className="h-4" />
                        <div>
                          <p className="text-sm font-medium" data-testid={`agenda-title-${dateKey}-${idx}`}>{event.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid={`agenda-location-${dateKey}-${idx}`}>
                            <span>{event.condominium}</span>
                            <span>•</span>
                            <span>{t.unit}: {event.unitNumber}</span>
                            {event.tenantName && (
                              <>
                                <span>•</span>
                                <span>{event.tenantName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.priority && (
                        <Badge 
                          variant={event.priority === 'high' ? 'destructive' : event.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                          data-testid={`agenda-priority-${dateKey}-${idx}`}
                        >
                          {event.priority}
                        </Badge>
                      )}
                      <Badge variant={
                        event.status === 'paid' || event.status === 'completed' || event.status === 'active' ? 'default' : 'secondary'
                      } data-testid={`agenda-status-${dateKey}-${idx}`}>
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
