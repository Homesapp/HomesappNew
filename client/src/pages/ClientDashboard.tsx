import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, MapPin, Home, Clock, Video, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Appointment, Property, User as UserType } from "@shared/schema";
import { AppointmentFormDialog } from "@/components/AppointmentFormDialog";
import { WelcomeModal } from "@/components/WelcomeModal";

type AppointmentWithRelations = Appointment & {
  property?: Property;
  client?: UserType;
  concierge?: UserType;
};

const STATUS_COLORS = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const STATUS_LABELS = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

export default function ClientDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();

  const { data: appointments = [], isLoading } = useQuery<AppointmentWithRelations[]>({
    queryKey: ["/api/appointments"],
  });

  const myAppointments = appointments.filter(apt => apt.clientId === user?.id);
  
  const upcomingAppointments = myAppointments
    .filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= new Date() && (apt.status === "pending" || apt.status === "confirmed");
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const selectedDateAppointments = selectedDate
    ? myAppointments.filter((apt) => isSameDay(parseISO(apt.date as any), selectedDate))
    : [];

  const appointmentDates = myAppointments.map((apt) => parseISO(apt.date as any));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isAuthLoading && user && (
        <WelcomeModal 
          userRole="cliente" 
          hasSeenWelcome={user.hasSeenWelcome || false} 
        />
      )}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">Mis Citas</h1>
          <p className="text-muted-foreground">
            Gestiona tus visitas a propiedades y agenda nuevas citas
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">
            Próximas Citas
          </TabsTrigger>
          <TabsTrigger value="calendar" data-testid="tab-calendar">
            Calendario
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Tienes {upcomingAppointments.length} citas próximas
            </p>
            <Button onClick={() => setShowAppointmentForm(true)} data-testid="button-new-appointment">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Nueva Cita
            </Button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No tienes citas próximas programadas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="hover-elevate" data-testid={`card-appointment-${appointment.id}`}>
                  <CardHeader className="space-y-0 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-medium line-clamp-1">
                        {appointment.property?.title || "Propiedad"}
                      </CardTitle>
                      <Badge className={STATUS_COLORS[appointment.status]}>
                        {STATUS_LABELS[appointment.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{appointment.property?.location || "Ubicación no disponible"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(appointment.date), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                        {" a las "}
                        {format(new Date(appointment.date), "HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {appointment.type === "video" ? (
                        <>
                          <Video className="h-4 w-4" />
                          <span>Video llamada</span>
                        </>
                      ) : (
                        <>
                          <Home className="h-4 w-4" />
                          <span>Presencial</span>
                        </>
                      )}
                    </div>
                    {appointment.concierge && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Conserje asignado</span>
                      </div>
                    )}
                    {appointment.meetLink && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => window.open(appointment.meetLink!, "_blank")}
                        data-testid={`button-join-meet-${appointment.id}`}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Unirse a la videollamada
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Calendario</CardTitle>
                <CardDescription>
                  Selecciona una fecha para ver tus citas
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    hasAppointment: appointmentDates,
                  }}
                  modifiersStyles={{
                    hasAppointment: {
                      backgroundColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                      fontWeight: "bold",
                    },
                  }}
                  data-testid="calendar-appointments"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate
                    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: es })
                    : "Selecciona una fecha"}
                </CardTitle>
                <CardDescription>
                  {selectedDateAppointments.length} cita(s) programada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {selectedDateAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mb-4" />
                      <p>No hay citas para esta fecha</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDateAppointments.map((appointment) => (
                        <Card key={appointment.id} data-testid={`card-date-appointment-${appointment.id}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base">
                                {appointment.property?.title}
                              </CardTitle>
                              <Badge className={STATUS_COLORS[appointment.status]}>
                                {STATUS_LABELS[appointment.status]}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4" />
                              <span>{format(new Date(appointment.date), "HH:mm")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {appointment.type === "video" ? (
                                <>
                                  <Video className="h-4 w-4" />
                                  <span>Video llamada</span>
                                </>
                              ) : (
                                <>
                                  <Home className="h-4 w-4" />
                                  <span>Presencial</span>
                                </>
                              )}
                            </div>
                            {appointment.meetLink && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => window.open(appointment.meetLink!, "_blank")}
                                data-testid={`button-join-calendar-meet-${appointment.id}`}
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Unirse
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="space-y-4">
            {myAppointments
              .filter(apt => {
                const aptDate = new Date(apt.date);
                return aptDate < new Date() || apt.status === "completed" || apt.status === "cancelled";
              })
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((appointment) => (
                <Card key={appointment.id} data-testid={`card-history-appointment-${appointment.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-1">
                        {appointment.property?.title || "Propiedad"}
                      </CardTitle>
                      <CardDescription className="line-clamp-1">
                        {appointment.property?.location}
                      </CardDescription>
                    </div>
                    <Badge className={STATUS_COLORS[appointment.status]}>
                      {STATUS_LABELS[appointment.status]}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(appointment.date), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {appointment.type === "video" ? (
                        <>
                          <Video className="h-4 w-4" />
                          <span>Video llamada</span>
                        </>
                      ) : (
                        <>
                          <Home className="h-4 w-4" />
                          <span>Presencial</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      <AppointmentFormDialog
        open={showAppointmentForm}
        onOpenChange={setShowAppointmentForm}
        mode="create"
      />
      </div>
    </>
  );
}
