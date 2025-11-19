import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, DollarSign, Wrench, Calendar as CalIcon, User, Clock, AlertCircle, FileText } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, isSameDay, isWithinInterval, addDays, startOfDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { ExternalPayment, ExternalMaintenanceTicket } from "@shared/schema";

type SelectedEvent = {
  type: 'payment' | 'ticket';
  data: ExternalPayment | ExternalMaintenanceTicket;
};

export default function ExternalCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const { language } = useLanguage();

  // Fetch payments
  const { data: payments = [] } = useQuery<ExternalPayment[]>({
    queryKey: ["/api/external-payments"],
  });

  // Fetch maintenance tickets
  const { data: tickets = [] } = useQuery<ExternalMaintenanceTicket[]>({
    queryKey: ["/api/external-tickets"],
  });

  // Fetch units for ticket details
  const { data: units = [] } = useQuery<any[]>({
    queryKey: ["/api/external-units"],
  });

  // Fetch users for assignment details
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: false, // Solo para admins, pero lo mantenemos para evitar errores
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const next30Days = addDays(now, 30);

    const pendingPayments = payments.filter(
      (p) => p.status === "pending" && 
      new Date(p.dueDate) >= startOfDay(now) &&
      new Date(p.dueDate) <= next30Days
    ).length;

    const scheduledTickets = tickets.filter(
      (t) => t.scheduledDate && 
      (t.status === "open" || t.status === "in_progress") &&
      new Date(t.scheduledDate) >= startOfDay(now)
    ).length;

    const thisMonthEvents = [...payments, ...tickets].filter((item) => {
      const date = 'dueDate' in item ? new Date(item.dueDate) : 
                   item.scheduledDate ? new Date(item.scheduledDate) : null;
      if (!date) return false;
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    }).length;

    return { pendingPayments, scheduledTickets, thisMonthEvents };
  }, [payments, tickets]);

  // Get events for selected date
  const eventsForDate = useMemo(() => {
    if (!selectedDate) return [];

    const dayPayments = payments
      .filter((p) => isSameDay(new Date(p.dueDate), selectedDate))
      .map((p) => ({
        type: 'payment' as const,
        title: language === "es" 
          ? `Pago: ${p.serviceType} - ${p.currency} $${p.amount}`
          : `Payment: ${p.serviceType} - ${p.currency} $${p.amount}`,
        time: format(new Date(p.dueDate), 'HH:mm'),
        status: p.status,
        data: p,
      }));

    const dayTickets = tickets
      .filter((t) => t.scheduledDate && isSameDay(new Date(t.scheduledDate), selectedDate))
      .map((t) => ({
        type: 'ticket' as const,
        title: t.title,
        time: t.scheduledDate ? format(new Date(t.scheduledDate), 'HH:mm') : '--:--',
        status: t.status,
        priority: t.priority,
        data: t,
      }));

    return [...dayPayments, ...dayTickets].sort((a, b) => 
      a.time.localeCompare(b.time)
    );
  }, [selectedDate, payments, tickets, language]);

  // Dates with events for highlighting in calendar
  const datesWithEvents = useMemo(() => {
    const dates = new Set<string>();
    payments.forEach((p) => {
      dates.add(format(new Date(p.dueDate), 'yyyy-MM-dd'));
    });
    tickets.forEach((t) => {
      if (t.scheduledDate) {
        dates.add(format(new Date(t.scheduledDate), 'yyyy-MM-dd'));
      }
    });
    return dates;
  }, [payments, tickets]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-calendar-title">
            <CalendarIcon className="h-8 w-8" />
            {language === "es" ? "Calendario" : "Calendar"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Visualiza pagos, mantenimientos y eventos importantes" 
              : "View payments, maintenance, and important events"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{language === "es" ? "Calendario" : "Calendar"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={language === "es" ? es : enUS}
              className="rounded-md border"
              data-testid="calendar-main"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate
                ? format(selectedDate, language === "es" ? "d 'de' MMMM, yyyy" : "MMMM d, yyyy", { 
                    locale: language === "es" ? es : enUS 
                  })
                : language === "es" ? "Selecciona una fecha" : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventsForDate.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {language === "es" 
                    ? "No hay eventos para esta fecha" 
                    : "No events for this date"}
                </p>
              ) : selectedEvent ? (
                // Vista detallada del evento seleccionado
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedEvent(null)}
                      data-testid="button-back-to-list"
                    >
                      ← {language === "es" ? "Volver" : "Back"}
                    </Button>
                    {selectedEvent.type === 'payment' ? (
                      <DollarSign className="h-6 w-6 text-green-600" />
                    ) : (
                      <Wrench className="h-6 w-6 text-blue-600" />
                    )}
                  </div>

                  <div className="space-y-3">
                    {selectedEvent.type === 'ticket' ? (
                      // Detalles del ticket de mantenimiento
                      (() => {
                        const ticket = selectedEvent.data as ExternalMaintenanceTicket;
                        const unit = units.find(u => u.id === ticket.unitId);
                        
                        return (
                          <>
                            <div>
                              <h3 className="font-semibold text-base">{ticket.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                            </div>

                            <Separator />

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant={ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'default' : 'secondary'}>
                                  {ticket.priority}
                                </Badge>
                                <Badge variant="outline">{ticket.category}</Badge>
                                <Badge variant={ticket.status === 'in_progress' ? 'default' : 'secondary'}>
                                  {ticket.status}
                                </Badge>
                              </div>

                              {unit && (
                                <div className="flex items-start gap-2">
                                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{language === "es" ? "Ubicación" : "Location"}</p>
                                    <p className="text-muted-foreground">
                                      {unit.unitNumber} - {unit.condominium?.name || ""}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {ticket.scheduledDate && (
                                <div className="flex items-start gap-2">
                                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{language === "es" ? "Programado" : "Scheduled"}</p>
                                    <p className="text-muted-foreground">
                                      {format(new Date(ticket.scheduledDate), "PPP p", { locale: language === "es" ? es : enUS })}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {ticket.assignedTo && (
                                <div className="flex items-start gap-2">
                                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{language === "es" ? "Asignado a" : "Assigned to"}</p>
                                    <p className="text-muted-foreground">
                                      {ticket.assignedTo}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {ticket.estimatedCost && (
                                <div className="flex items-start gap-2">
                                  <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{language === "es" ? "Costo estimado" : "Estimated cost"}</p>
                                    <p className="text-muted-foreground">
                                      ${parseFloat(ticket.estimatedCost).toFixed(2)} MXN
                                    </p>
                                  </div>
                                </div>
                              )}

                              {ticket.notes && (
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{language === "es" ? "Notas" : "Notes"}</p>
                                    <p className="text-muted-foreground">{ticket.notes}</p>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-start gap-2 pt-2">
                                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{language === "es" ? "Creado" : "Created"}</p>
                                  <p className="text-muted-foreground">
                                    {format(new Date(ticket.createdAt), "PPP p", { locale: language === "es" ? es : enUS })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      // Detalles del pago
                      (() => {
                        const payment = selectedEvent.data as ExternalPayment;
                        
                        return (
                          <>
                            <div>
                              <h3 className="font-semibold text-base">
                                {language === "es" ? "Pago" : "Payment"}: {payment.serviceType}
                              </h3>
                              <p className="text-2xl font-bold mt-2 text-green-600">
                                {payment.currency} ${parseFloat(payment.amount).toFixed(2)}
                              </p>
                            </div>

                            <Separator />

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant={payment.status === 'pending' ? 'secondary' : payment.status === 'paid' ? 'default' : 'outline'}>
                                  {payment.status}
                                </Badge>
                              </div>

                              <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{language === "es" ? "Fecha de vencimiento" : "Due date"}</p>
                                  <p className="text-muted-foreground">
                                    {format(new Date(payment.dueDate), "PPP", { locale: language === "es" ? es : enUS })}
                                  </p>
                                </div>
                              </div>

                              {payment.notes && (
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{language === "es" ? "Notas" : "Notes"}</p>
                                    <p className="text-muted-foreground">{payment.notes}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()
                    )}
                  </div>
                </div>
              ) : (
                // Lista de eventos
                eventsForDate.map((event, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full h-auto p-3 justify-start hover-elevate"
                    onClick={() => setSelectedEvent({ type: event.type, data: event.data })}
                    data-testid={`button-event-${index}`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {event.type === 'payment' ? (
                        <DollarSign className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Wrench className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">{event.time}</span>
                          <Badge 
                            variant={event.status === 'pending' ? 'secondary' : 
                                    event.status === 'in_progress' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {event.status}
                          </Badge>
                          {'priority' in event && event.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs">
                              {language === "es" ? "Alta" : "High"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "es" ? "Pagos Pendientes" : "Pending Payments"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-payments">{stats.pendingPayments}</div>
            <Badge variant="secondary" className="mt-2">
              {language === "es" ? "Próximos 30 días" : "Next 30 days"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "es" ? "Mantenimientos" : "Maintenance"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-maintenance-count">{stats.scheduledTickets}</div>
            <Badge variant="secondary" className="mt-2">
              {language === "es" ? "Programados" : "Scheduled"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "es" ? "Eventos" : "Events"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-events-count">{stats.thisMonthEvents}</div>
            <Badge variant="secondary" className="mt-2">
              {language === "es" ? "Este mes" : "This month"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
