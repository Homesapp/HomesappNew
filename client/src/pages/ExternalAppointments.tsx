import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar as CalendarIcon, Clock, User, MapPin, Plus, Search, Filter, List, LayoutGrid, Phone, Mail, Building2, X, Edit, Trash2, Check, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, isToday, isBefore, addHours } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type ExternalAppointment = {
  id: string;
  agencyId: string;
  unitId: string | null;
  clientId: string | null;
  salespersonId: string | null;
  conciergeId: string | null;
  mode: "individual" | "tour";
  type: "in-person" | "video";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  date: string;
  endTime: string | null;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  notes: string | null;
  cancellationReason: string | null;
  tourGroupId: string | null;
  googleEventId: string | null;
  meetLink: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tourStops?: TourStop[];
};

type TourStop = {
  id: string;
  appointmentId: string;
  unitId: string;
  sequence: number;
  scheduledTime: string;
  notes: string | null;
};

type ExternalUnit = {
  id: string;
  name: string;
  unitNumber: string | null;
  condominiumId: string | null;
};

type AgencyUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const modeColors: Record<string, string> = {
  individual: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  tour: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
};

export default function ExternalAppointments() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const locale = language === "es" ? es : enUS;

  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<"week" | "month">("week");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [salespersonFilter, setSalespersonFilter] = useState<string>("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<ExternalAppointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<ExternalAppointment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<ExternalAppointment | null>(null);

  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    mode: "individual" as "individual" | "tour",
    type: "in-person" as "in-person" | "video",
    date: new Date(),
    time: "10:00",
    unitId: "",
    notes: "",
    tourStops: [] as { unitId: string; notes: string }[],
  });

  const statusLabels: Record<string, { es: string; en: string }> = {
    pending: { es: "Pendiente", en: "Pending" },
    confirmed: { es: "Confirmada", en: "Confirmed" },
    completed: { es: "Completada", en: "Completed" },
    cancelled: { es: "Cancelada", en: "Cancelled" },
  };

  const modeLabels: Record<string, { es: string; en: string }> = {
    individual: { es: "Individual", en: "Individual" },
    tour: { es: "Tour", en: "Tour" },
  };

  const { data: appointments = [], isLoading } = useQuery<ExternalAppointment[]>({
    queryKey: ["/api/external-appointments"],
  });

  const { data: unitsData } = useQuery<{ data: ExternalUnit[]; total: number }>({
    queryKey: ["/api/external-units"],
  });
  const units = unitsData?.data ?? [];

  const { data: agencyUsers = [] } = useQuery<AgencyUser[]>({
    queryKey: ["/api/external/users"],
  });

  const salespersons = useMemo(() => {
    return agencyUsers.filter(u => 
      u.role === "external_agency_staff" || 
      u.role === "external_agency_admin"
    );
  }, [agencyUsers]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingAppointment) {
        return await apiRequest("PATCH", `/api/external-appointments/${editingAppointment.id}`, data);
      }
      return await apiRequest("POST", "/api/external-appointments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-appointments"] });
      toast({
        title: language === "es" ? "Cita guardada" : "Appointment saved",
        description: language === "es" 
          ? "La cita ha sido guardada exitosamente"
          : "Appointment has been saved successfully",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo guardar la cita"
          : "Could not save appointment",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, cancellationReason }: { id: string; status: string; cancellationReason?: string }) => {
      return await apiRequest("PATCH", `/api/external-appointments/${id}/status`, { status, cancellationReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-appointments"] });
      toast({
        title: language === "es" ? "Estado actualizado" : "Status updated",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/external-appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-appointments"] });
      toast({
        title: language === "es" ? "Cita eliminada" : "Appointment deleted",
      });
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        variant: "destructive",
      });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAppointment(null);
    setFormData({
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      mode: "individual",
      type: "in-person",
      date: new Date(),
      time: "10:00",
      unitId: "",
      notes: "",
      tourStops: [],
    });
  };

  const handleOpenEdit = (appointment: ExternalAppointment) => {
    const appointmentDate = new Date(appointment.date);
    setEditingAppointment(appointment);
    setFormData({
      clientName: appointment.clientName,
      clientEmail: appointment.clientEmail || "",
      clientPhone: appointment.clientPhone || "",
      mode: appointment.mode,
      type: appointment.type,
      date: appointmentDate,
      time: format(appointmentDate, "HH:mm"),
      unitId: appointment.unitId || "",
      notes: appointment.notes || "",
      tourStops: appointment.tourStops?.map(s => ({ unitId: s.unitId, notes: s.notes || "" })) || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const dateTime = new Date(formData.date);
    const [hours, minutes] = formData.time.split(":");
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const data: any = {
      clientName: formData.clientName,
      clientEmail: formData.clientEmail || null,
      clientPhone: formData.clientPhone || null,
      mode: formData.mode,
      type: formData.type,
      date: dateTime.toISOString(),
      notes: formData.notes || null,
    };

    if (formData.mode === "individual") {
      data.unitId = formData.unitId || null;
    } else {
      data.tourStops = formData.tourStops;
    }

    createMutation.mutate(data);
  };

  const handleAddTourStop = () => {
    if (formData.tourStops.length < 3) {
      setFormData(prev => ({
        ...prev,
        tourStops: [...prev.tourStops, { unitId: "", notes: "" }],
      }));
    }
  };

  const handleRemoveTourStop = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tourStops: prev.tourStops.filter((_, i) => i !== index),
    }));
  };

  const handleTourStopChange = (index: number, field: "unitId" | "notes", value: string) => {
    setFormData(prev => ({
      ...prev,
      tourStops: prev.tourStops.map((stop, i) => 
        i === index ? { ...stop, [field]: value } : stop
      ),
    }));
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!apt.clientName.toLowerCase().includes(search) &&
            !apt.clientEmail?.toLowerCase().includes(search) &&
            !apt.clientPhone?.includes(search)) {
          return false;
        }
      }
      if (statusFilter !== "all" && apt.status !== statusFilter) return false;
      if (modeFilter !== "all" && apt.mode !== modeFilter) return false;
      if (salespersonFilter !== "all" && apt.salespersonId !== salespersonFilter) return false;
      return true;
    });
  }, [appointments, searchTerm, statusFilter, modeFilter, salespersonFilter]);

  const dateRange = useMemo(() => {
    if (calendarView === "week") {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    }
  }, [currentDate, calendarView]);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  const appointmentsByDay = useMemo(() => {
    const grouped = new Map<string, ExternalAppointment[]>();
    filteredAppointments.forEach(apt => {
      const dayKey = format(new Date(apt.date), "yyyy-MM-dd");
      const existing = grouped.get(dayKey) || [];
      grouped.set(dayKey, [...existing, apt]);
    });
    return grouped;
  }, [filteredAppointments]);

  const getUnitName = (unitId: string | null) => {
    if (!unitId) return language === "es" ? "Sin unidad" : "No unit";
    const unit = units.find(u => u.id === unitId);
    return unit ? (unit.unitNumber ? `${unit.name} - ${unit.unitNumber}` : unit.name) : unitId;
  };

  const navigatePrev = () => {
    if (calendarView === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (calendarView === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const AppointmentCard = ({ appointment }: { appointment: ExternalAppointment }) => (
    <Card 
      className="cursor-pointer hover-elevate"
      onClick={() => setSelectedAppointment(appointment)}
      data-testid={`appointment-card-${appointment.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusColors[appointment.status]}>
                {statusLabels[appointment.status][language]}
              </Badge>
              <Badge className={modeColors[appointment.mode]}>
                {modeLabels[appointment.mode][language]}
              </Badge>
            </div>
            <h4 className="font-medium mt-2 truncate">{appointment.clientName}</h4>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(appointment.date), "HH:mm", { locale })}</span>
              <span className="mx-1">-</span>
              <span>
                {appointment.mode === "individual" 
                  ? (language === "es" ? "1 hora" : "1 hour")
                  : `${appointment.tourStops?.length || 1} ${language === "es" ? "propiedades" : "properties"}`
                }
              </span>
            </div>
            {appointment.unitId && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{getUnitName(appointment.unitId)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">
            {language === "es" ? "Citas" : "Appointments"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "es" 
              ? "Gestiona las citas y recorridos de propiedades"
              : "Manage property appointments and tours"}
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-appointment">
          <Plus className="mr-2 h-4 w-4" />
          {language === "es" ? "Nueva Cita" : "New Appointment"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{appointments.length}</div>
            <p className="text-sm text-muted-foreground">
              {language === "es" ? "Total" : "Total"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">
              {appointments.filter(a => a.status === "pending").length}
            </div>
            <p className="text-sm text-muted-foreground">
              {language === "es" ? "Pendientes" : "Pending"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {appointments.filter(a => a.status === "confirmed").length}
            </div>
            <p className="text-sm text-muted-foreground">
              {language === "es" ? "Confirmadas" : "Confirmed"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.status === "completed").length}
            </div>
            <p className="text-sm text-muted-foreground">
              {language === "es" ? "Completadas" : "Completed"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "es" ? "Buscar cliente..." : "Search client..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
              data-testid="input-search"
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-filters">
                <Filter className="h-4 w-4 mr-2" />
                {language === "es" ? "Filtros" : "Filters"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div>
                  <Label>{language === "es" ? "Estado" : "Status"}</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                      <SelectItem value="pending">{language === "es" ? "Pendiente" : "Pending"}</SelectItem>
                      <SelectItem value="confirmed">{language === "es" ? "Confirmada" : "Confirmed"}</SelectItem>
                      <SelectItem value="completed">{language === "es" ? "Completada" : "Completed"}</SelectItem>
                      <SelectItem value="cancelled">{language === "es" ? "Cancelada" : "Cancelled"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === "es" ? "Modo" : "Mode"}</Label>
                  <Select value={modeFilter} onValueChange={setModeFilter}>
                    <SelectTrigger data-testid="select-mode-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                      <SelectItem value="individual">{language === "es" ? "Individual" : "Individual"}</SelectItem>
                      <SelectItem value="tour">{language === "es" ? "Tour" : "Tour"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {salespersons.length > 0 && (
                  <div>
                    <Label>{language === "es" ? "Vendedor" : "Salesperson"}</Label>
                    <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
                      <SelectTrigger data-testid="select-salesperson-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                        {salespersons.map(sp => (
                          <SelectItem key={sp.id} value={sp.id}>
                            {`${sp.firstName || ""} ${sp.lastName || ""}`.trim() || sp.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
            data-testid="button-calendar-view"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {language === "es" ? "Calendario" : "Calendar"}
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            data-testid="button-list-view"
          >
            <List className="h-4 w-4 mr-2" />
            {language === "es" ? "Lista" : "List"}
          </Button>
        </div>
      </div>

      {viewMode === "calendar" && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={navigatePrev} data-testid="button-prev">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={navigateNext} data-testid="button-next">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">
                  {calendarView === "week"
                    ? `${format(dateRange.start, "d MMM", { locale })} - ${format(dateRange.end, "d MMM yyyy", { locale })}`
                    : format(currentDate, "MMMM yyyy", { locale })}
                </h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={calendarView === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCalendarView("week")}
                  data-testid="button-week-view"
                >
                  {language === "es" ? "Semana" : "Week"}
                </Button>
                <Button
                  variant={calendarView === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCalendarView("month")}
                  data-testid="button-month-view"
                >
                  {language === "es" ? "Mes" : "Month"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "grid gap-2",
              calendarView === "week" ? "grid-cols-7" : "grid-cols-7"
            )}>
              {["L", "M", "X", "J", "V", "S", "D"].map((day, i) => (
                <div key={i} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              {days.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayAppointments = appointmentsByDay.get(dayKey) || [];
                
                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "min-h-[100px] p-2 border rounded-lg",
                      isToday(day) && "bg-primary/5 border-primary",
                      isBefore(day, new Date()) && !isToday(day) && "opacity-50"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1",
                      isToday(day) && "text-primary"
                    )}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            "text-xs p-1 rounded cursor-pointer truncate",
                            statusColors[apt.status]
                          )}
                          onClick={() => setSelectedAppointment(apt)}
                          data-testid={`calendar-apt-${apt.id}`}
                        >
                          {format(new Date(apt.date), "HH:mm")} - {apt.clientName}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayAppointments.length - 3} {language === "es" ? "más" : "more"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === "list" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {language === "es" 
                ? "No hay citas que coincidan con los filtros"
                : "No appointments match the filters"}
            </div>
          ) : (
            filteredAppointments.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) handleCloseDialog();
        else setIsDialogOpen(true);
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment 
                ? (language === "es" ? "Editar Cita" : "Edit Appointment")
                : (language === "es" ? "Nueva Cita" : "New Appointment")}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Completa los datos para agendar una cita"
                : "Fill in the details to schedule an appointment"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{language === "es" ? "Tipo de cita" : "Appointment type"}</Label>
              <Select value={formData.mode} onValueChange={(v) => setFormData(prev => ({ ...prev, mode: v as any, tourStops: [] }))}>
                <SelectTrigger data-testid="select-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">
                    {language === "es" ? "Individual (1 hora)" : "Individual (1 hour)"}
                  </SelectItem>
                  <SelectItem value="tour">
                    {language === "es" ? "Tour (30 min por propiedad, máx. 3)" : "Tour (30 min per property, max 3)"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{language === "es" ? "Nombre del cliente" : "Client name"} *</Label>
              <Input
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder={language === "es" ? "Nombre completo" : "Full name"}
                data-testid="input-client-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === "es" ? "Email" : "Email"}</Label>
                <Input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  data-testid="input-client-email"
                />
              </div>
              <div>
                <Label>{language === "es" ? "Teléfono" : "Phone"}</Label>
                <Input
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  data-testid="input-client-phone"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === "es" ? "Fecha" : "Date"} *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-date">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.date, "PPP", { locale })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>{language === "es" ? "Hora" : "Time"} *</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  data-testid="input-time"
                />
              </div>
            </div>

            <div>
              <Label>{language === "es" ? "Modalidad" : "Modality"}</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as any }))}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">{language === "es" ? "Presencial" : "In-person"}</SelectItem>
                  <SelectItem value="video">{language === "es" ? "Video llamada" : "Video call"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.mode === "individual" ? (
              <div>
                <Label>{language === "es" ? "Propiedad" : "Property"}</Label>
                <Select value={formData.unitId} onValueChange={(v) => setFormData(prev => ({ ...prev, unitId: v }))}>
                  <SelectTrigger data-testid="select-unit">
                    <SelectValue placeholder={language === "es" ? "Seleccionar propiedad" : "Select property"} />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unitNumber ? `${unit.name} - ${unit.unitNumber}` : unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{language === "es" ? "Propiedades del tour" : "Tour properties"}</Label>
                  {formData.tourStops.length < 3 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddTourStop}
                      data-testid="button-add-stop"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {language === "es" ? "Agregar" : "Add"}
                    </Button>
                  )}
                </div>
                {formData.tourStops.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {language === "es" 
                      ? "Agrega hasta 3 propiedades para el tour"
                      : "Add up to 3 properties for the tour"}
                  </p>
                )}
                {formData.tourStops.map((stop, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {language === "es" ? "30 min" : "30 min"}
                        </span>
                      </div>
                      <Select 
                        value={stop.unitId} 
                        onValueChange={(v) => handleTourStopChange(index, "unitId", v)}
                      >
                        <SelectTrigger data-testid={`select-tour-unit-${index}`}>
                          <SelectValue placeholder={language === "es" ? "Seleccionar propiedad" : "Select property"} />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.unitNumber ? `${unit.name} - ${unit.unitNumber}` : unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveTourStop(index)}
                      data-testid={`button-remove-stop-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label>{language === "es" ? "Notas" : "Notes"}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={language === "es" ? "Notas adicionales..." : "Additional notes..."}
                rows={3}
                data-testid="input-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.clientName || createMutation.isPending}
              data-testid="button-save"
            >
              {createMutation.isPending 
                ? (language === "es" ? "Guardando..." : "Saving...")
                : (language === "es" ? "Guardar" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        {selectedAppointment && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[selectedAppointment.status]}>
                  {statusLabels[selectedAppointment.status][language]}
                </Badge>
                <Badge className={modeColors[selectedAppointment.mode]}>
                  {modeLabels[selectedAppointment.mode][language]}
                </Badge>
              </div>
              <DialogTitle className="mt-2">{selectedAppointment.clientName}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(selectedAppointment.date), "PPP", { locale })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(selectedAppointment.date), "HH:mm", { locale })}
                  {selectedAppointment.endTime && ` - ${format(new Date(selectedAppointment.endTime), "HH:mm", { locale })}`}
                </span>
              </div>
              {selectedAppointment.clientEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedAppointment.clientEmail}</span>
                </div>
              )}
              {selectedAppointment.clientPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedAppointment.clientPhone}</span>
                </div>
              )}
              {selectedAppointment.unitId && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{getUnitName(selectedAppointment.unitId)}</span>
                </div>
              )}
              {selectedAppointment.notes && (
                <div className="text-sm">
                  <Label className="text-muted-foreground">{language === "es" ? "Notas" : "Notes"}</Label>
                  <p className="mt-1">{selectedAppointment.notes}</p>
                </div>
              )}

              {selectedAppointment.tourStops && selectedAppointment.tourStops.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">
                    {language === "es" ? "Propiedades del tour" : "Tour properties"}
                  </Label>
                  <div className="mt-2 space-y-2">
                    {selectedAppointment.tourStops.map((stop, i) => (
                      <div key={stop.id} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                        <Badge variant="outline">{i + 1}</Badge>
                        <span>{getUnitName(stop.unitId)}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(stop.scheduledTime), "HH:mm")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {selectedAppointment.status === "pending" && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    updateStatusMutation.mutate({ id: selectedAppointment.id, status: "confirmed" });
                    setSelectedAppointment(null);
                  }}
                  data-testid="button-confirm"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {language === "es" ? "Confirmar" : "Confirm"}
                </Button>
              )}
              {(selectedAppointment.status === "pending" || selectedAppointment.status === "confirmed") && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedAppointment.id, status: "completed" });
                      setSelectedAppointment(null);
                    }}
                    data-testid="button-complete"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {language === "es" ? "Completar" : "Complete"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedAppointment.id, status: "cancelled" });
                      setSelectedAppointment(null);
                    }}
                    data-testid="button-cancel-appointment"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {language === "es" ? "Cancelar" : "Cancel"}
                  </Button>
                </>
              )}
              <Button 
                variant="outline"
                onClick={() => {
                  handleOpenEdit(selectedAppointment);
                  setSelectedAppointment(null);
                }}
                data-testid="button-edit"
              >
                <Edit className="h-4 w-4 mr-2" />
                {language === "es" ? "Editar" : "Edit"}
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  setAppointmentToDelete(selectedAppointment);
                  setDeleteDialogOpen(true);
                  setSelectedAppointment(null);
                }}
                data-testid="button-delete"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {language === "es" ? "Eliminar" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "es" ? "¿Eliminar cita?" : "Delete appointment?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es" 
                ? "Esta acción no se puede deshacer. La cita será eliminada permanentemente."
                : "This action cannot be undone. The appointment will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {language === "es" ? "Cancelar" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => appointmentToDelete && deleteMutation.mutate(appointmentToDelete.id)}
              data-testid="button-confirm-delete"
            >
              {language === "es" ? "Eliminar" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
