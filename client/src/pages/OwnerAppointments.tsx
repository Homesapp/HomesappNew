import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Clock, Calendar as CalendarIcon, MapPin, User, Settings, Filter, ChevronDown, ChevronRight, Phone, Mail, Globe, CreditCard, MessageCircle, Star, Eye, CalendarClock, UserCircle } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, startOfDay, endOfDay, addWeeks, subWeeks, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import type { Appointment, Property, OwnerSettings } from "@shared/schema";
import { datetimeLocalToCancunDate, dateToDatetimeLocalCancun, utcToCancunDate } from "@/lib/timezoneHelpers";

type OwnerApprovalStatus = "pending" | "approved" | "rejected";

interface AppointmentWithDetails extends Appointment {
  property?: Property;
  client?: { 
    email: string; 
    firstName?: string; 
    lastName?: string;
    phone?: string;
    nationality?: string;
    profileImageUrl?: string;
  };
  concierge?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    profileImageUrl?: string;
    rating?: number;
    reviewCount?: number;
  };
  presentationCard?: {
    id: string;
    clientId: string;
    propertyId: string;
    visitType: string;
    budget?: string;
    timeFrame?: string;
    propertyType?: string;
    hasPets?: boolean;
    petPhotoUrl?: string;
    moveInDate?: string;
    numberOfOccupants?: number;
    createdAt: Date;
  };
}

export default function OwnerAppointments() {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<OwnerApprovalStatus | "all" | "archived">("all");
  const [visitTypeFilter, setVisitTypeFilter] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [petPhotoDialogOpen, setPetPhotoDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [clientProfileOpen, setClientProfileOpen] = useState(false);
  const [conciergeProfileOpen, setConciergeProfileOpen] = useState(false);
  const [selectedClientAppointment, setSelectedClientAppointment] = useState<AppointmentWithDetails | null>(null);
  const [selectedConciergeAppointment, setSelectedConciergeAppointment] = useState<AppointmentWithDetails | null>(null);
  const [assignConciergeDialogOpen, setAssignConciergeDialogOpen] = useState(false);
  const [selectedConciergeId, setSelectedConciergeId] = useState("");
  const [accessType, setAccessType] = useState<"lockbox" | "electronic" | "manual" | "other">("lockbox");
  const [accessCode, setAccessCode] = useState("");
  const [accessInstructions, setAccessInstructions] = useState("");
  const { toast } = useToast();

  // Handler to reset concierge assignment form
  const handleCloseAssignConciergeDialog = (open: boolean) => {
    setAssignConciergeDialogOpen(open);
    if (!open) {
      setSelectedConciergeId("");
      setAccessType("lockbox");
      setAccessCode("");
      setAccessInstructions("");
    }
  };

  const { data: allAppointments = [], isLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: ownerSettings, isLoading: isLoadingSettings} = useQuery<OwnerSettings>({
    queryKey: ["/api/owner/settings"],
  });

  // Fetch concierge reviews when modal is open
  const conciergeId = selectedConciergeAppointment?.concierge?.id;
  const { data: conciergeReviews = [] } = useQuery<any[]>({
    queryKey: [`/api/reviews/concierges?conciergeId=${conciergeId}`],
    enabled: !!conciergeId && conciergeProfileOpen,
  });

  // Fetch available concierges when assigning
  const { data: availableConcierges = [], isLoading: isLoadingConcierges } = useQuery<any[]>({
    queryKey: [`/api/appointments/available-concierges?date=${selectedAppointment?.date}&mode=${selectedAppointment?.mode || 'individual'}`],
    enabled: assignConciergeDialogOpen && !!selectedAppointment,
  });

  // Calculate date range for calendar
  const dateRange = useMemo(() => {
    return {
      start: startOfWeek(currentDate, { weekStartsOn: 1 }),
      end: endOfWeek(currentDate, { weekStartsOn: 1 }),
    };
  }, [currentDate]);

  // Days to display in calendar
  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  // Filter by ownerApprovalStatus and visit type
  const filteredAppointments = useMemo(() => {
    let filtered = allAppointments;
    
    // Filter by status - solo oculta completed y cancelled
    if (statusFilter === "archived") {
      filtered = filtered.filter(apt => apt.status === "completed" || apt.status === "cancelled");
    } else if (statusFilter !== "all") {
      // Para pending, approved, rejected - mostrar solo esas y excluir archived
      filtered = filtered.filter(apt => 
        apt.ownerApprovalStatus === statusFilter && 
        apt.status !== "completed" && 
        apt.status !== "cancelled"
      );
    } else {
      // "all" muestra todas excepto archived
      filtered = filtered.filter(apt => apt.status !== "completed" && apt.status !== "cancelled");
    }
    
    // Filter by visit type
    if (visitTypeFilter !== "all") {
      filtered = filtered.filter(apt => apt.visitType === visitTypeFilter);
    }
    
    return filtered;
  }, [allAppointments, statusFilter, visitTypeFilter]);

  // Filter "visitas en curso" - appointments within 1 hour before to 1 hour after
  const ongoingAppointments = useMemo(() => {
    const now = new Date();
    const oneHourBefore = new Date(now.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(now.getTime() + 60 * 60 * 1000);

    return allAppointments.filter((appointment) => {
      if (appointment.ownerApprovalStatus !== "approved") return false;
      if (appointment.status === "completed" || appointment.status === "cancelled") return false;
      
      const appointmentDate = new Date(appointment.date);
      return appointmentDate >= oneHourBefore && appointmentDate <= oneHourAfter;
    });
  }, [allAppointments]);

  // Get visit type options with counts
  const visitTypeOptions = useMemo(() => {
    const types = [
      { value: "all", label: "Todas las visitas", count: allAppointments.length },
      { value: "visita_cliente", label: "Visitas de clientes", count: allAppointments.filter(a => a.visitType === "visita_cliente").length },
      { value: "visita_mantenimiento", label: "Visitas de mantenimiento", count: allAppointments.filter(a => a.visitType === "visita_mantenimiento").length },
      { value: "visita_limpieza", label: "Visitas de limpieza", count: allAppointments.filter(a => a.visitType === "visita_limpieza").length },
      { value: "visita_reconocimiento", label: "Visitas de reconocimiento", count: allAppointments.filter(a => a.visitType === "visita_reconocimiento").length },
      { value: "material_multimedia", label: "Material multimedia", count: allAppointments.filter(a => a.visitType === "material_multimedia").length },
      { value: "visita_inspeccion", label: "Visitas de inspección", count: allAppointments.filter(a => a.visitType === "visita_inspeccion").length },
      { value: "otra", label: "Otras visitas", count: allAppointments.filter(a => a.visitType === "otra").length },
    ];
    return types;
  }, [allAppointments]);

  // Build property display name
  const getPropertyDisplay = (property?: Property): string => {
    if (!property) return "Propiedad";
    
    // If it's a condominium with unit number
    if (property.condoName && property.unitNumber) {
      return `${property.condoName} - Unidad ${property.unitNumber}`;
    } else if (property.condoName) {
      return property.condoName;
    } else if (property.unitNumber) {
      // Has unit number but no condominium name
      if (property.customListingTitle) {
        return `${property.customListingTitle} - Unidad ${property.unitNumber}`;
      }
      return `${property.title} - Unidad ${property.unitNumber}`;
    }
    
    // If it's a private house with custom listing title (nombre de la casa)
    if (property.customListingTitle) {
      return property.customListingTitle;
    }
    
    // Fallback to regular title
    return property.title || "Propiedad";
  };

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return apiRequest("PATCH", `/api/owner/appointments/${id}/approve`, { notes });
    },
    onSuccess: () => {
      toast({
        title: "Visita aprobada",
        description: "La visita ha sido aprobada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/appointments/pending"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar la visita",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return apiRequest("PATCH", `/api/owner/appointments/${id}/reject`, { notes });
    },
    onSuccess: () => {
      toast({
        title: "Visita rechazada",
        description: "La visita ha sido rechazada",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/appointments/pending"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar la visita",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { autoApproveAppointments: boolean }) => {
      return apiRequest("POST", "/api/owner/settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Configuración actualizada",
        description: "Tus preferencias han sido guardadas exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    },
  });

  const requestRescheduleMutation = useMutation({
    mutationFn: async ({ id, newDate, notes }: { id: string; newDate: Date; notes?: string }) => {
      return apiRequest("PATCH", `/api/owner/appointments/${id}/request-reschedule`, { 
        rescheduleRequestedDate: newDate.toISOString(),
        rescheduleNotes: notes 
      });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud enviada",
        description: "Se ha enviado la solicitud de reprogramación al cliente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setRescheduleDialogOpen(false);
      setSelectedAppointment(null);
      setRescheduleDate(undefined);
      setRescheduleNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo solicitar la reprogramación",
        variant: "destructive",
      });
    },
  });

  const openAppointmentChatMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      return apiRequest("POST", `/api/chat/appointment/${appointmentId}`, {});
    },
    onSuccess: (conversation: any) => {
      // Navigate to chat page with the conversation selected
      window.location.href = `/chat?conversation=${conversation.id}`;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo abrir el chat de la cita",
        variant: "destructive",
      });
    },
  });

  const assignConciergeMutation = useMutation({
    mutationFn: async ({ appointmentId, conciergeId, accessType, accessCode, accessInstructions }: {
      appointmentId: string;
      conciergeId: string;
      accessType: string;
      accessCode: string;
      accessInstructions: string;
    }) => {
      return apiRequest("PATCH", `/api/appointments/${appointmentId}/assign-concierge`, {
        conciergeId,
        accessType,
        accessCode,
        accessInstructions,
      });
    },
    onSuccess: () => {
      toast({
        title: "Conserje asignado",
        description: "El conserje ha sido asignado exitosamente a la cita",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      // Invalidate available concierges queries to prevent stale data
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/appointments/available-concierges');
        }
      });
      setAssignConciergeDialogOpen(false);
      setSelectedConciergeId("");
      setAccessType("lockbox");
      setAccessCode("");
      setAccessInstructions("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el conserje",
        variant: "destructive",
      });
    },
  });

  const handleToggleAutoApprove = (enabled: boolean) => {
    updateSettingsMutation.mutate({ autoApproveAppointments: enabled });
  };

  const handleOpenReview = (appointment: AppointmentWithDetails, action: "approve" | "reject") => {
    setSelectedAppointment(appointment);
    setReviewAction(action);
    setReviewNotes(appointment.notes || "");
  };

  const handleCloseDialog = () => {
    setSelectedAppointment(null);
    setReviewAction(null);
    setReviewNotes("");
  };

  const handleSubmitReview = () => {
    if (!selectedAppointment) return;

    if (reviewAction === "approve") {
      approveMutation.mutate({ id: selectedAppointment.id, notes: reviewNotes });
    } else if (reviewAction === "reject") {
      rejectMutation.mutate({ id: selectedAppointment.id, notes: reviewNotes });
    }
  };

  const handleOpenReschedule = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setRescheduleDialogOpen(true);
    setRescheduleDate(new Date(appointment.date));
    setRescheduleNotes("");
  };

  const handleSubmitReschedule = () => {
    if (!selectedAppointment || !rescheduleDate) return;
    
    requestRescheduleMutation.mutate({
      id: selectedAppointment.id,
      newDate: rescheduleDate,
      notes: rescheduleNotes
    });
  };

  const handleOpenAssignConcierge = () => {
    setAssignConciergeDialogOpen(true);
  };

  const handleSubmitAssignConcierge = () => {
    if (!selectedAppointment || !selectedConciergeId) return;
    
    assignConciergeMutation.mutate({
      appointmentId: selectedAppointment.id,
      conciergeId: selectedConciergeId,
      accessType,
      accessCode,
      accessInstructions,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "default", icon: Clock, label: "Pendiente" },
      approved: { variant: "default", icon: CheckCircle2, label: "Aprobada" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rechazada" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1" data-testid={`badge-status-${status}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatAppointmentType = (type: string): string => {
    const types: Record<string, string> = {
      viewing: "Visita presencial",
      virtual: "Visita virtual",
      inspection: "Inspección",
      meeting: "Reunión",
    };
    return types[type] || type;
  };

  const formatVisitType = (visitType?: string): string => {
    const types: Record<string, string> = {
      visita_cliente: "Visita de cliente",
      visita_mantenimiento: "Visita de mantenimiento",
      visita_limpieza: "Visita de limpieza",
      visita_reconocimiento: "Visita de reconocimiento",
      material_multimedia: "Material multimedia",
      visita_inspeccion: "Visita de inspección",
      otra: "Otra visita",
    };
    return visitType ? types[visitType] || visitType : "Sin especificar";
  };

  const getClientName = (client?: { firstName?: string; lastName?: string; email: string }): string => {
    if (client?.firstName && client?.lastName) {
      return `${client.firstName} ${client.lastName}`;
    }
    return client?.email || "Cliente desconocido";
  };

  const getConciergeName = (concierge?: { firstName?: string; lastName?: string; email: string }): string => {
    if (!concierge) return "Sin asignar";
    if (concierge?.firstName && concierge?.lastName) {
      return `${concierge.firstName} ${concierge.lastName}`;
    }
    return concierge?.email || "Conserje";
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getEventsForDay = (day: Date) => {
    return filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return isSameDay(aptDate, day);
    });
  };

  const getEventColor = (appointment: AppointmentWithDetails): string => {
    // Verde: aprobada
    if (appointment.ownerApprovalStatus === "approved" && appointment.rescheduleStatus === "none") {
      return "border-green-500 bg-green-50";
    }
    // Amarilla: reprogramada (requested o approved)
    if (appointment.rescheduleStatus === "requested" || appointment.rescheduleStatus === "approved") {
      return "border-yellow-500 bg-yellow-50";
    }
    // Roja: cancelada o rechazada
    if (appointment.status === "cancelled" || appointment.ownerApprovalStatus === "rejected") {
      return "border-red-500 bg-red-50";
    }
    // Gris: pendiente
    return "border-gray-300 bg-gray-50";
  };

  const handlePrevWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando visitas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-owner-appointments">Gestión de Visitas</h1>
          <p className="text-muted-foreground">
            Administra las solicitudes de visita a tus propiedades
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filtersOpen ? "default" : "outline"}
            size="icon"
            onClick={() => setFiltersOpen(!filtersOpen)}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button
            variant={settingsOpen ? "default" : "outline"}
            size="icon"
            onClick={() => setSettingsOpen(!settingsOpen)}
            data-testid="button-toggle-settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros Colapsables */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} data-testid="collapsible-filters">
        <CollapsibleContent>
          <Card data-testid="card-visit-type-filter">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <CardTitle>Filtrar por tipo de visita</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Select value={visitTypeFilter} onValueChange={setVisitTypeFilter}>
                <SelectTrigger data-testid="select-visit-type">
                  <SelectValue placeholder="Selecciona un tipo de visita" />
                </SelectTrigger>
                <SelectContent>
                  {visitTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Configuración Colapsable */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen} data-testid="collapsible-settings">
        <CollapsibleContent>
          <Card data-testid="card-settings">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                <CardTitle>Configuración de Visitas</CardTitle>
              </div>
              <CardDescription>
                Configura cómo se gestionan las solicitudes de visita a tus propiedades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-approve" className="text-base font-medium">
                    Aprobación automática de visitas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Las solicitudes de visita serán aprobadas automáticamente si tienes lockbox o cerradura inteligente sin vencimiento
                  </p>
                </div>
                <Switch
                  id="auto-approve"
                  checked={ownerSettings?.autoApproveAppointments ?? false}
                  onCheckedChange={handleToggleAutoApprove}
                  disabled={isLoadingSettings || updateSettingsMutation.isPending || !ownerSettings}
                  aria-label="Activar o desactivar aprobación automática de visitas"
                  data-testid="switch-auto-approve"
                />
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Vista Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("list")}
          data-testid="button-view-list"
        >
          Lista
        </Button>
        <Button
          variant={viewMode === "calendar" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("calendar")}
          data-testid="button-view-calendar"
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Calendario
        </Button>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="space-y-4">
          {/* Calendar Navigation */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>
                    {format(currentDate, "MMMM yyyy", { locale: es })}
                  </CardTitle>
                  <CardDescription>
                    {format(dateRange.start, "dd MMM", { locale: es })} - {format(dateRange.end, "dd MMM", { locale: es })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrevWeek} data-testid="button-prev-week">
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleToday} data-testid="button-today">
                    Hoy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextWeek} data-testid="button-next-week">
                    Siguiente
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const eventsForDay = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <Card key={idx} className={isToday ? "border-primary" : ""} data-testid={`calendar-day-${idx}`}>
                  <CardHeader className="p-3 space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {format(day, "EEE", { locale: es })}
                    </div>
                    <div className="text-lg font-semibold">
                      {format(day, "dd", { locale: es })}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    {eventsForDay.map((apt) => (
                      <Button
                        key={apt.id}
                        variant="outline"
                        size="sm"
                        className={`w-full justify-start text-left h-auto py-2 ${getEventColor(apt)}`}
                        onClick={() => setSelectedAppointment(apt)}
                        data-testid={`calendar-event-${apt.id}`}
                      >
                        <div className="w-full">
                          <div className="font-medium text-xs truncate">
                            {format(utcToCancunDate(apt.date), "HH:mm")} - {getPropertyDisplay(apt.property)}
                          </div>
                          {apt.client && (
                            <div className="text-xs text-muted-foreground truncate">
                              {getClientName(apt.client)}
                            </div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Ongoing Visits Section */}
      {ongoingAppointments.length > 0 && (
        <div className="mb-6">
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                  <CardTitle className="text-lg">Visitas en Curso</CardTitle>
                </div>
                <Badge variant="secondary" data-testid="badge-ongoing-count">
                  {ongoingAppointments.length}
                </Badge>
              </div>
              <CardDescription>
                Visitas programadas desde 1 hora antes hasta 1 hora después
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ongoingAppointments.map((appointment) => (
                <Card
                  key={appointment.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setSelectedAppointment(appointment)}
                  data-testid={`card-ongoing-${appointment.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(utcToCancunDate(appointment.date), "HH:mm")}
                          </span>
                          <Badge variant="outline" className="ml-2">
                            {appointment.visitType === "visita_cliente" ? "Cliente" : 
                             appointment.visitType === "visita_mantenimiento" ? "Mantenimiento" :
                             appointment.visitType === "visita_limpieza" ? "Limpieza" : 
                             "Otra"}
                          </Badge>
                        </div>
                        <div className="font-semibold">{getPropertyDisplay(appointment.property)}</div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {getClientName(appointment.client)}
                          </div>
                          {appointment.concierge && (
                            <div className="flex items-center gap-1">
                              <UserCircle className="h-3 w-3" />
                              {getConciergeName(appointment.concierge)}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAppointmentChatMutation.mutate(appointment.id);
                        }}
                        disabled={openAppointmentChatMutation.isPending}
                        data-testid={`button-chat-${appointment.id}`}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pendientes ({allAppointments.filter(a => a.ownerApprovalStatus === "pending" && a.status !== "completed" && a.status !== "cancelled").length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Aprobadas ({allAppointments.filter(a => a.ownerApprovalStatus === "approved" && a.status !== "completed" && a.status !== "cancelled").length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rechazadas ({allAppointments.filter(a => a.ownerApprovalStatus === "rejected" && a.status !== "completed" && a.status !== "cancelled").length})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              Todas ({allAppointments.filter(a => a.status !== "completed" && a.status !== "cancelled").length})
            </TabsTrigger>
            <TabsTrigger value="archived" data-testid="tab-archived">
              Archivadas ({allAppointments.filter(a => a.status === "completed" || a.status === "cancelled").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="space-y-4 mt-4">
            {filteredAppointments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No hay visitas en este estado
                </CardContent>
              </Card>
            ) : (
              filteredAppointments.map((appointment) => (
                <Card 
                  key={appointment.id} 
                  className="hover-elevate cursor-pointer" 
                  onClick={() => setSelectedAppointment(appointment)}
                  data-testid={`card-appointment-${appointment.id}`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">
                            {getPropertyDisplay(appointment.property)}
                          </h3>
                          {getStatusBadge(appointment.ownerApprovalStatus)}
                          {appointment.visitType && (
                            <Badge variant="outline" className="text-xs" data-testid={`badge-visit-type-${appointment.id}`}>
                              {formatVisitType(appointment.visitType)}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Fecha y ubicación */}
                        <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{format(utcToCancunDate(appointment.date), "dd MMM, HH:mm", { locale: es })}</span>
                          </div>
                          {appointment.property?.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{appointment.property.location}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Cliente y Conserje alineados */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {appointment.client?.profileImageUrl && (
                                <AvatarImage src={appointment.client.profileImageUrl} />
                              )}
                              <AvatarFallback className="text-xs">
                                {getInitials(getClientName(appointment.client))}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-muted-foreground">Cliente</div>
                              <div className="font-medium text-sm truncate">{getClientName(appointment.client)}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClientAppointment(appointment);
                                setClientProfileOpen(true);
                              }}
                              data-testid={`button-view-client-${appointment.id}`}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {appointment.concierge?.profileImageUrl && (
                                <AvatarImage src={appointment.concierge.profileImageUrl} />
                              )}
                              <AvatarFallback className="text-xs">
                                {appointment.concierge ? getInitials(getConciergeName(appointment.concierge)) : "NA"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-muted-foreground">Conserje</div>
                              <div className="font-medium text-sm truncate">{getConciergeName(appointment.concierge)}</div>
                            </div>
                            {appointment.concierge && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedConciergeAppointment(appointment);
                                  setConciergeProfileOpen(true);
                                }}
                                data-testid={`button-view-concierge-${appointment.id}`}
                              >
                                <User className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {appointment.ownerApprovalStatus === "pending" ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleOpenReview(appointment, "approve")}
                              data-testid={`button-approve-${appointment.id}`}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleOpenReview(appointment, "reject")}
                              data-testid={`button-reject-${appointment.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rechazar
                            </Button>
                          </>
                        ) : appointment.ownerApprovalStatus === "approved" && appointment.rescheduleStatus === "none" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReschedule(appointment)}
                            data-testid={`button-reschedule-${appointment.id}`}
                          >
                            <CalendarClock className="w-4 h-4 mr-1" />
                            Reprogramar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Appointment Details Dialog */}
      {selectedAppointment && !reviewAction && (
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-appointment-details">
            <DialogHeader>
              <DialogTitle>Detalles de la Visita</DialogTitle>
              <DialogDescription>
                {getPropertyDisplay(selectedAppointment.property)} - {format(utcToCancunDate(selectedAppointment.date), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Conserje Information */}
              {selectedAppointment.concierge && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Conserje Asignado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        {selectedAppointment.concierge.profileImageUrl && (
                          <AvatarImage src={selectedAppointment.concierge.profileImageUrl} />
                        )}
                        <AvatarFallback>
                          {getInitials(getConciergeName(selectedAppointment.concierge))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="font-semibold text-lg" data-testid="text-concierge-name">
                            {getConciergeName(selectedAppointment.concierge)}
                          </p>
                          {selectedAppointment.concierge.rating && selectedAppointment.concierge.reviewCount ? (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < Math.round(selectedAppointment.concierge!.rating!)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                ({selectedAppointment.concierge.reviewCount} reviews)
                              </span>
                            </div>
                          ) : null}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/chat?userId=${selectedAppointment.concierge!.id}`}
                            data-testid="button-message-concierge"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Mensaje
                          </Button>
                          {selectedAppointment.concierge.phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`https://wa.me/${selectedAppointment.concierge!.phone!.replace(/\D/g, '')}`, '_blank')}
                              data-testid="button-whatsapp-concierge"
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              WhatsApp
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Client Information */}
              {selectedAppointment.client && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información del Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        {selectedAppointment.client.profileImageUrl && (
                          <AvatarImage src={selectedAppointment.client.profileImageUrl} />
                        )}
                        <AvatarFallback>
                          {getInitials(getClientName(selectedAppointment.client))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <p className="font-semibold text-lg" data-testid="text-client-name">
                          {getClientName(selectedAppointment.client)}
                        </p>
                        {selectedAppointment.client.nationality && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span data-testid="text-client-nationality">{selectedAppointment.client.nationality}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Presentation Card Details */}
                    {selectedAppointment.presentationCard && (
                      <div className="border-t pt-4 space-y-3">
                        <h4 className="font-semibold text-sm">Tarjeta de Presentación</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {selectedAppointment.presentationCard.propertyType && (
                            <div>
                              <span className="text-muted-foreground">Tipo de propiedad: </span>
                              <span className="font-medium">{selectedAppointment.presentationCard.propertyType}</span>
                            </div>
                          )}
                          {selectedAppointment.presentationCard.budget && (
                            <div>
                              <span className="text-muted-foreground">Presupuesto: </span>
                              <span className="font-medium" data-testid="text-presentation-budget">
                                {selectedAppointment.presentationCard.budget}
                              </span>
                            </div>
                          )}
                          {selectedAppointment.presentationCard.hasPets !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Mascotas: </span>
                              <span className="font-medium">
                                {selectedAppointment.presentationCard.hasPets ? "Sí" : "No"}
                              </span>
                              {selectedAppointment.presentationCard.hasPets && selectedAppointment.presentationCard.petPhotoUrl && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => setPetPhotoDialogOpen(true)}
                                  data-testid="button-view-pet-photo"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                          {selectedAppointment.presentationCard.moveInDate && (
                            <div>
                              <span className="text-muted-foreground">Fecha de ingreso: </span>
                              <span className="font-medium">{selectedAppointment.presentationCard.moveInDate}</span>
                            </div>
                          )}
                          {selectedAppointment.presentationCard.numberOfOccupants && (
                            <div>
                              <span className="text-muted-foreground">Ocupantes: </span>
                              <span className="font-medium">{selectedAppointment.presentationCard.numberOfOccupants} personas</span>
                            </div>
                          )}
                          {selectedAppointment.presentationCard.timeFrame && (
                            <div>
                              <span className="text-muted-foreground">Plazo: </span>
                              <span className="font-medium" data-testid="text-presentation-timeframe">
                                {selectedAppointment.presentationCard.timeFrame}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedAppointment.ownerApprovalStatus === "pending" && (
                  <>
                    <Button
                      className="flex-1"
                      onClick={() => handleOpenReview(selectedAppointment, "approve")}
                      data-testid="button-approve-dialog"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aprobar Visita
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={() => handleOpenReview(selectedAppointment, "reject")}
                      data-testid="button-reject-dialog"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rechazar Visita
                    </Button>
                  </>
                )}
                
                {selectedAppointment.ownerApprovalStatus === "approved" && selectedAppointment.rescheduleStatus === "none" && (
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => {
                      setSelectedAppointment(selectedAppointment);
                      handleOpenReschedule(selectedAppointment);
                    }}
                    data-testid="button-reschedule-dialog"
                  >
                    <CalendarClock className="w-4 h-4 mr-2" />
                    Solicitar Reprogramación
                  </Button>
                )}
                
                {selectedAppointment.ownerApprovalStatus === "approved" && !selectedAppointment.conciergeId && (
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={handleOpenAssignConcierge}
                    data-testid="button-assign-concierge"
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Asignar Conserje
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewAction} onOpenChange={() => handleCloseDialog()}>
        <DialogContent data-testid="dialog-review">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Aprobar visita" : "Rechazar visita"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "El cliente será notificado de que su visita ha sido aprobada."
                : "El cliente será notificado de que su visita ha sido rechazada."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedAppointment && (
              <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                <div>
                  <span className="font-medium">Propiedad:</span>{" "}
                  {getPropertyDisplay(selectedAppointment.property)}
                </div>
                <div>
                  <span className="font-medium">Cliente:</span>{" "}
                  {getClientName(selectedAppointment.client)}
                </div>
                <div>
                  <span className="font-medium">Fecha:</span>{" "}
                  {new Date(selectedAppointment.date).toLocaleString()}
                </div>
                {selectedAppointment.visitType && (
                  <div>
                    <span className="font-medium">Tipo de visita:</span>{" "}
                    {formatVisitType(selectedAppointment.visitType)}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="reviewNotes">Notas adicionales (opcional)</Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Agrega notas sobre tu decisión..."
                rows={3}
                data-testid="input-review-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              data-testid="button-cancel-review"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              variant={reviewAction === "reject" ? "destructive" : "default"}
              data-testid="button-confirm-review"
            >
              {approveMutation.isPending || rejectMutation.isPending
                ? "Procesando..."
                : reviewAction === "approve"
                ? "Aprobar"
                : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent data-testid="dialog-reschedule">
          <DialogHeader>
            <DialogTitle>Solicitar Reprogramación</DialogTitle>
            <DialogDescription>
              Propón una nueva fecha y hora para esta visita. El cliente deberá aprobar la reprogramación.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedAppointment && (
              <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                <div>
                  <span className="font-medium">Propiedad:</span>{" "}
                  {getPropertyDisplay(selectedAppointment.property)}
                </div>
                <div>
                  <span className="font-medium">Cliente:</span>{" "}
                  {getClientName(selectedAppointment.client)}
                </div>
                <div>
                  <span className="font-medium">Fecha actual:</span>{" "}
                  {format(utcToCancunDate(selectedAppointment.date), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="rescheduleDate">Nueva fecha y hora *</Label>
              <Input
                id="rescheduleDate"
                type="datetime-local"
                value={rescheduleDate ? dateToDatetimeLocalCancun(rescheduleDate) : ""}
                onChange={(e) => setRescheduleDate(datetimeLocalToCancunDate(e.target.value))}
                data-testid="input-reschedule-date"
              />
            </div>

            <div>
              <Label htmlFor="rescheduleNotes">Motivo de reprogramación (opcional)</Label>
              <Textarea
                id="rescheduleNotes"
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                placeholder="Explica por qué necesitas reprogramar..."
                rows={3}
                data-testid="input-reschedule-notes"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-sm text-yellow-800">
              <strong>Nota:</strong> El cliente recibirá una notificación para aprobar o rechazar la reprogramación. 
              Si el cliente rechaza, la cita se cancelará automáticamente.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRescheduleDialogOpen(false);
                setRescheduleDate(undefined);
                setRescheduleNotes("");
              }}
              data-testid="button-cancel-reschedule"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitReschedule}
              disabled={!rescheduleDate || requestRescheduleMutation.isPending}
              data-testid="button-confirm-reschedule"
            >
              {requestRescheduleMutation.isPending ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pet Photo Dialog */}
      <Dialog open={petPhotoDialogOpen} onOpenChange={setPetPhotoDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-pet-photo">
          <DialogHeader>
            <DialogTitle>Foto de Mascota</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedAppointment?.presentationCard?.petPhotoUrl && (
              <img
                src={selectedAppointment.presentationCard.petPhotoUrl}
                alt="Mascota del cliente"
                className="max-h-96 object-contain rounded-md"
                data-testid="img-pet-photo"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Profile Dialog */}
      <Dialog open={clientProfileOpen} onOpenChange={setClientProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-client-profile">
          <DialogHeader>
            <DialogTitle>Perfil del Cliente</DialogTitle>
          </DialogHeader>

          {selectedClientAppointment?.client && (
            <div className="space-y-6">
              {/* Client Basic Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  {selectedClientAppointment.client.profileImageUrl && (
                    <AvatarImage src={selectedClientAppointment.client.profileImageUrl} />
                  )}
                  <AvatarFallback className="text-lg">
                    {getInitials(getClientName(selectedClientAppointment.client))}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-xl" data-testid="text-client-profile-name">
                    {getClientName(selectedClientAppointment.client)}
                  </h3>
                </div>
              </div>

              {/* Presentation Card Details */}
              {selectedClientAppointment.presentationCard && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tarjeta de Presentación</CardTitle>
                    <CardDescription>Lo que el cliente está buscando</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedClientAppointment.presentationCard.propertyType && (
                        <div>
                          <div className="text-xs text-muted-foreground">Tipo de propiedad</div>
                          <div className="font-medium">{selectedClientAppointment.presentationCard.propertyType}</div>
                        </div>
                      )}
                      {selectedClientAppointment.presentationCard.visitType && (
                        <div>
                          <div className="text-xs text-muted-foreground">Modalidad</div>
                          <div className="font-medium">{selectedClientAppointment.presentationCard.visitType}</div>
                        </div>
                      )}
                      {selectedClientAppointment.presentationCard.budget && (
                        <div>
                          <div className="text-xs text-muted-foreground">Presupuesto</div>
                          <div className="font-medium">{selectedClientAppointment.presentationCard.budget}</div>
                        </div>
                      )}
                      {selectedClientAppointment.presentationCard.timeFrame && (
                        <div>
                          <div className="text-xs text-muted-foreground">Plazo</div>
                          <div className="font-medium">{selectedClientAppointment.presentationCard.timeFrame}</div>
                        </div>
                      )}
                      {selectedClientAppointment.presentationCard.moveInDate && (
                        <div>
                          <div className="text-xs text-muted-foreground">Fecha de ingreso</div>
                          <div className="font-medium">
                            {format(new Date(selectedClientAppointment.presentationCard.moveInDate), "dd 'de' MMM, yyyy", { locale: es })}
                          </div>
                        </div>
                      )}
                      {selectedClientAppointment.presentationCard.numberOfOccupants && (
                        <div>
                          <div className="text-xs text-muted-foreground">Ocupantes</div>
                          <div className="font-medium">{selectedClientAppointment.presentationCard.numberOfOccupants} personas</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-muted-foreground">Mascotas</div>
                        <div className="font-medium">{selectedClientAppointment.presentationCard.hasPets ? "Sí" : "No"}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Concierge Profile Dialog */}
      <Dialog open={conciergeProfileOpen} onOpenChange={setConciergeProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-concierge-profile">
          <DialogHeader>
            <DialogTitle>Perfil del Conserje</DialogTitle>
          </DialogHeader>

          {selectedConciergeAppointment?.concierge && (
            <div className="space-y-6">
              {/* Concierge Basic Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  {selectedConciergeAppointment.concierge.profileImageUrl && (
                    <AvatarImage src={selectedConciergeAppointment.concierge.profileImageUrl} />
                  )}
                  <AvatarFallback className="text-lg">
                    {getInitials(getConciergeName(selectedConciergeAppointment.concierge))}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-xl" data-testid="text-concierge-profile-name">
                    {getConciergeName(selectedConciergeAppointment.concierge)}
                  </h3>
                  {selectedConciergeAppointment.concierge.rating && selectedConciergeAppointment.concierge.reviewCount && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(selectedConciergeAppointment.concierge!.rating!)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({selectedConciergeAppointment.concierge.reviewCount} reviews)
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/chat?userId=${selectedConciergeAppointment.concierge!.id}`}
                      data-testid="button-message-concierge-profile"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Mensaje
                    </Button>
                    {selectedConciergeAppointment.concierge.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://wa.me/${selectedConciergeAppointment.concierge!.phone!.replace(/\D/g, '')}`, '_blank')}
                        data-testid="button-whatsapp-concierge-profile"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                    )}
                    {selectedConciergeAppointment.concierge.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `mailto:${selectedConciergeAppointment.concierge!.email}`}
                        data-testid="button-email-concierge-profile"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Reviews</CardTitle>
                  <CardDescription>Calificaciones de clientes anteriores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {conciergeReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay reviews disponibles para este conserje.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {conciergeReviews.slice(0, 3).map((review: any) => (
                        <div key={review.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < parseInt(review.rating)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(review.createdAt), "dd MMM yyyy", { locale: es })}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {conciergeReviews.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Mostrando 3 de {conciergeReviews.length} reviews
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Concierge Dialog */}
      <Dialog open={assignConciergeDialogOpen} onOpenChange={handleCloseAssignConciergeDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-assign-concierge">
          <DialogHeader>
            <DialogTitle>Asignar Conserje a la Cita</DialogTitle>
            <DialogDescription>
              Selecciona un conserje disponible y proporciona las instrucciones de acceso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Appointment Info */}
            {selectedAppointment && (
              <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                <div>
                  <span className="font-medium">Propiedad:</span>{" "}
                  {getPropertyDisplay(selectedAppointment.property)}
                </div>
                <div>
                  <span className="font-medium">Fecha:</span>{" "}
                  {format(utcToCancunDate(selectedAppointment.date), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                </div>
                {selectedAppointment.visitType && (
                  <div>
                    <span className="font-medium">Tipo de visita:</span>{" "}
                    {formatVisitType(selectedAppointment.visitType)}
                  </div>
                )}
              </div>
            )}

            {/* Concierge Select */}
            <div>
              <Label htmlFor="concierge-select">Conserje *</Label>
              <Select value={selectedConciergeId} onValueChange={setSelectedConciergeId}>
                <SelectTrigger id="concierge-select" data-testid="select-concierge">
                  <SelectValue placeholder="Selecciona un conserje" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingConcierges ? (
                    <SelectItem value="loading" disabled>Cargando conserjes...</SelectItem>
                  ) : availableConcierges.length === 0 ? (
                    <SelectItem value="none" disabled>No hay conserjes disponibles</SelectItem>
                  ) : (
                    availableConcierges.map((concierge: any) => (
                      <SelectItem key={concierge.id} value={concierge.id}>
                        <div className="flex items-center gap-2">
                          <span>{concierge.firstName && concierge.lastName ? `${concierge.firstName} ${concierge.lastName}` : concierge.email}</span>
                          {concierge.rating && (
                            <span className="text-xs text-muted-foreground">
                              ({concierge.rating.toFixed(1)} ⭐)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Access Type Select */}
            <div>
              <Label htmlFor="access-type-select">Tipo de Acceso *</Label>
              <Select value={accessType} onValueChange={(value) => setAccessType(value as "lockbox" | "electronic" | "manual" | "other")}>
                <SelectTrigger id="access-type-select" data-testid="select-access-type">
                  <SelectValue placeholder="Selecciona tipo de acceso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lockbox">Lockbox</SelectItem>
                  <SelectItem value="electronic">Cerradura Electrónica</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Access Code - Only show if not manual */}
            {accessType !== "manual" && (
              <div>
                <Label htmlFor="access-code">Código/Clave de Acceso</Label>
                <Input
                  id="access-code"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Ingresa el código o clave"
                  data-testid="input-access-code"
                />
              </div>
            )}

            {/* Access Instructions */}
            <div>
              <Label htmlFor="access-instructions">Instrucciones Adicionales</Label>
              <Textarea
                id="access-instructions"
                value={accessInstructions}
                onChange={(e) => setAccessInstructions(e.target.value)}
                placeholder="Proporciona instrucciones adicionales sobre el acceso..."
                rows={3}
                data-testid="textarea-access-instructions"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignConciergeDialogOpen(false);
                setSelectedConciergeId("");
                setAccessType("lockbox");
                setAccessCode("");
                setAccessInstructions("");
              }}
              data-testid="button-cancel-assign-concierge"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitAssignConcierge}
              disabled={!selectedConciergeId || assignConciergeMutation.isPending}
              data-testid="button-confirm-assign-concierge"
            >
              {assignConciergeMutation.isPending ? "Asignando..." : "Asignar Conserje"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
