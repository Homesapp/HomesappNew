import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Clock, Calendar as CalendarIcon, MapPin, User, Settings, Filter, ChevronDown, ChevronRight, Phone, Mail, Globe, CreditCard, MessageCircle, Star, Eye } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, startOfDay, endOfDay, addWeeks, subWeeks, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import type { Appointment, Property, OwnerSettings } from "@shared/schema";

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
  const [statusFilter, setStatusFilter] = useState<OwnerApprovalStatus | "all">("pending");
  const [visitTypeFilter, setVisitTypeFilter] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [petPhotoDialogOpen, setPetPhotoDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: allAppointments = [], isLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: ownerSettings, isLoading: isLoadingSettings } = useQuery<OwnerSettings>({
    queryKey: ["/api/owner/settings"],
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
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(apt => apt.ownerApprovalStatus === statusFilter);
    }
    
    // Filter by visit type
    if (visitTypeFilter !== "all") {
      filtered = filtered.filter(apt => apt.visitType === visitTypeFilter);
    }
    
    return filtered;
  }, [allAppointments, statusFilter, visitTypeFilter]);

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
    
    if (property.condoName && property.unitNumber) {
      return `${property.condoName} - Unidad ${property.unitNumber}`;
    } else if (property.condoName) {
      return property.condoName;
    } else if (property.unitNumber) {
      return `${property.title} - Unidad ${property.unitNumber}`;
    }
    
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
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => setSelectedAppointment(apt)}
                        data-testid={`calendar-event-${apt.id}`}
                      >
                        <div className="w-full">
                          <div className="font-medium text-xs truncate">
                            {format(new Date(apt.date), "HH:mm")} - {getPropertyDisplay(apt.property)}
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

      {/* List View */}
      {viewMode === "list" && (
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pendientes ({allAppointments.filter(a => a.ownerApprovalStatus === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Aprobadas ({allAppointments.filter(a => a.ownerApprovalStatus === "approved").length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rechazadas ({allAppointments.filter(a => a.ownerApprovalStatus === "rejected").length})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              Todas ({allAppointments.length})
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                        
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span className="truncate">{format(new Date(appointment.date), "dd MMM, HH:mm", { locale: es })}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              {appointment.client?.profileImageUrl && (
                                <AvatarImage src={appointment.client.profileImageUrl} />
                              )}
                              <AvatarFallback className="text-[10px]">
                                {getInitials(getClientName(appointment.client))}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-xs">{getClientName(appointment.client)}</span>
                          </div>

                          {appointment.property?.location && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate text-xs">{appointment.property.location}</span>
                            </div>
                          )}

                          {appointment.concierge && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                {appointment.concierge.profileImageUrl && (
                                  <AvatarImage src={appointment.concierge.profileImageUrl} />
                                )}
                                <AvatarFallback className="text-[10px]">
                                  {getInitials(getConciergeName(appointment.concierge))}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate text-xs">{getConciergeName(appointment.concierge)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {appointment.ownerApprovalStatus === "pending" && (
                        <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
                        </div>
                      )}
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
                {getPropertyDisplay(selectedAppointment.property)} - {format(new Date(selectedAppointment.date), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
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
              {selectedAppointment.ownerApprovalStatus === "pending" && (
                <div className="flex gap-2 pt-4 border-t">
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
                </div>
              )}
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
    </div>
  );
}
