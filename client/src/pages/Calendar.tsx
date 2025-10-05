import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, User, MapPin, Eye, Video } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { Appointment, User as UserType, Property } from "@shared/schema";
import { AppointmentFormDialog } from "@/components/AppointmentFormDialog";

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

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const { data: appointments = [], isLoading } = useQuery<AppointmentWithRelations[]>({
    queryKey: ["/api/appointments"],
  });


  // Get appointments for selected date
  const selectedDateAppointments = selectedDate
    ? appointments.filter((apt) => isSameDay(parseISO(apt.date as any), selectedDate))
    : [];

  // Get dates that have appointments for calendar highlighting
  const appointmentDates = appointments.map((apt) => parseISO(apt.date as any));

  const handleCancelAppointment = async (appointmentId: string) => {
    // This will be handled through the edit dialog
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      setEditingAppointment(appointment);
    }
  };

  if (isLoading) {
    return (
      <LoadingScreen className="h-full" />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-calendar-title">
            <CalendarIcon className="h-8 w-8" />
            Calendario de Citas
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualiza y gestiona todas las citas programadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <CalendarIcon className="h-3 w-3" />
            {appointments.length} citas totales
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={es}
              className="rounded-md border"
              modifiers={{
                hasAppointment: appointmentDates,
              }}
              modifiersStyles={{
                hasAppointment: {
                  fontWeight: "bold",
                  textDecoration: "underline",
                  color: "hsl(var(--primary))",
                },
              }}
              data-testid="calendar-main"
            />
          </CardContent>
        </Card>

        {/* Selected Date Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate
                ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })
                : "Selecciona una fecha"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay citas en esta fecha</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateAppointments.map((appointment) => (
                  <Card
                    key={appointment.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => setSelectedAppointment(appointment)}
                    data-testid={`appointment-card-${appointment.id}`}
                  >
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(parseISO(appointment.date as any), "HH:mm")}
                            </span>
                          </div>
                          <Badge
                            className={STATUS_COLORS[appointment.status]}
                            variant="secondary"
                          >
                            {STATUS_LABELS[appointment.status]}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          {appointment.type === "video" ? (
                            <Video className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-muted-foreground">
                            {appointment.type === "video" ? "Videollamada" : "Presencial"}
                          </span>
                        </div>

                        {appointment.concierge && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {appointment.concierge.firstName} {appointment.concierge.lastName}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Citas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments
              .filter((apt) => new Date(apt.date) >= new Date() && apt.status !== "cancelled")
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 10)
              .map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate cursor-pointer"
                  onClick={() => setSelectedAppointment(appointment)}
                  data-testid={`upcoming-appointment-${appointment.id}`}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(parseISO(appointment.date as any), "d MMM yyyy", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{format(parseISO(appointment.date as any), "HH:mm")}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {appointment.property && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{appointment.property.title}</span>
                        </div>
                      )}
                      {appointment.concierge && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>
                            {appointment.concierge.firstName} {appointment.concierge.lastName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Badge
                    className={STATUS_COLORS[appointment.status]}
                    variant="secondary"
                  >
                    {STATUS_LABELS[appointment.status]}
                  </Badge>
                </div>
              ))}

            {appointments.filter((apt) => new Date(apt.date) >= new Date() && apt.status !== "cancelled").length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay citas próximas programadas</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      {selectedAppointment && (
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="max-w-2xl" data-testid="dialog-appointment-details">
            <DialogHeader>
              <DialogTitle>Detalles de la Cita</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha y Hora</label>
                  <p className="text-base">
                    {format(parseISO(selectedAppointment.date as any), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                      locale: es,
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <div>
                    <Badge
                      className={STATUS_COLORS[selectedAppointment.status]}
                      variant="secondary"
                    >
                      {STATUS_LABELS[selectedAppointment.status]}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <p className="text-base flex items-center gap-2">
                  {selectedAppointment.type === "video" ? (
                    <>
                      <Video className="h-4 w-4" /> Videollamada
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" /> Presencial
                    </>
                  )}
                </p>
              </div>

              {selectedAppointment.property && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Propiedad</label>
                  <p className="text-base">{selectedAppointment.property.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.property.location}</p>
                </div>
              )}

              {selectedAppointment.client && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                  <p className="text-base">
                    {selectedAppointment.client.firstName} {selectedAppointment.client.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.client.email}</p>
                </div>
              )}

              {selectedAppointment.concierge && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Conserje Asignado</label>
                  <p className="text-base">
                    {selectedAppointment.concierge.firstName} {selectedAppointment.concierge.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.concierge.email}</p>
                </div>
              )}

              {selectedAppointment.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notas</label>
                  <p className="text-base">{selectedAppointment.notes}</p>
                </div>
              )}

              {selectedAppointment.meetLink && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Link de Videollamada</label>
                  <a
                    href={selectedAppointment.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2"
                    data-testid="link-meet"
                  >
                    <Eye className="h-4 w-4" />
                    {selectedAppointment.meetLink}
                  </a>
                </div>
              )}

              {selectedAppointment.conciergeReport && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reporte del Conserje</label>
                  <p className="text-base">{selectedAppointment.conciergeReport}</p>
                </div>
              )}

              {selectedAppointment.accessIssues && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Problemas de Acceso</label>
                  <p className="text-base text-red-600 dark:text-red-400">{selectedAppointment.accessIssues}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAppointment(null);
                  }}
                  data-testid="button-close-details"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setEditingAppointment(selectedAppointment);
                    setSelectedAppointment(null);
                  }}
                  data-testid="button-edit-appointment"
                >
                  Editar Cita
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Appointment Dialog */}
      {editingAppointment && (
        <AppointmentFormDialog
          open={!!editingAppointment}
          onOpenChange={(open) => !open && setEditingAppointment(null)}
          appointment={editingAppointment}
          mode="edit"
        />
      )}
    </div>
  );
}
