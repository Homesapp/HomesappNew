import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isBefore, startOfDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Building2,
  MapPin,
  Phone,
  Eye,
  EyeOff,
  X,
  Check,
  Loader2,
  Route,
  Home,
  ChevronsUpDown,
  Search,
  Bell,
  MessageCircle,
  Mail,
  FileText,
  AlertCircle
} from "lucide-react";

interface Appointment {
  id: string;
  date: string;
  endTime: string;
  mode: 'individual' | 'tour';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  condominiumName?: string;
  unitNumber?: string;
  notes?: string;
  isRestricted?: boolean;
  canEdit?: boolean;
  canCancel?: boolean;
  leadId?: string;
  tourStops?: any[];
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  condominiumId: string;
  condominium?: { name: string };
}

interface Condominium {
  id: string;
  name: string;
}

interface Reminder {
  id: string;
  leadId: string;
  reminderType: 'follow_up' | 'call' | 'whatsapp' | 'email' | 'meeting' | 'document' | 'other';
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'completed' | 'cancelled';
  lead?: {
    firstName: string;
    lastName: string;
  };
}

export default function SellerCalendar() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();
  const locale = language === "es" ? es : enUS;
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    mode: 'individual' as 'individual' | 'tour',
    leadId: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    date: '',
    time: '10:00',
    notes: '',
    tourStops: [] as { unitId: string; condominiumId: string; notes: string }[],
    unitId: '', // For individual appointments
    condominiumId: '', // For individual appointments - select condominium first
  });

  // Fetch appointments
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/external-seller/appointments"],
  });

  // Fetch reminders for calendar (private to seller)
  const { data: reminders = [] } = useQuery<Reminder[]>({
    queryKey: ["/api/external-seller/reminders"],
  });

  // Fetch leads for dropdown
  const { data: leadsResponse, isLoading: isLoadingLeads, error: leadsError } = useQuery<{ data: Lead[] }>({
    queryKey: ["/api/external-leads", { limit: 1000 }],
    queryFn: async () => {
      const response = await fetch('/api/external-leads?limit=1000', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch leads');
      return response.json();
    },
    staleTime: 0, // Always fetch fresh data
  });
  const leads = leadsResponse?.data || [];
  
  // Debug leads
  console.log("[SellerCalendar] Leads response:", { 
    leadsResponse, 
    leadsCount: leads.length, 
    isLoadingLeads, 
    leadsError,
    sampleLead: leads[0]
  });

  // Fetch units for property selection
  const { data: unitsResponse } = useQuery<{ data: Unit[], total: number }>({
    queryKey: ["/api/external-units", "for-appointments"],
    queryFn: async () => {
      const response = await fetch('/api/external-units?limit=1000&isActive=true', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch units');
      return response.json();
    },
  });
  const units = unitsResponse?.data || [];

  // Fetch all condominiums directly from API
  const { data: condominiumsResponse } = useQuery<{ data: Condominium[] }>({
    queryKey: ["/api/external-condominiums"],
    queryFn: async () => {
      const response = await fetch('/api/external-condominiums?limit=500', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch condominiums');
      return response.json();
    },
  });
  const condominiums = useMemo(() => {
    const data = condominiumsResponse?.data || [];
    return data.sort((a, b) => a.name.localeCompare(b.name));
  }, [condominiumsResponse]);
  
  // State for condominium popover search
  const [condoPopoverOpen, setCondoPopoverOpen] = useState(false);
  const [tourCondoPopoverOpen, setTourCondoPopoverOpen] = useState<number | null>(null);

  // Filter units by selected condominium
  const filteredUnits = useMemo(() => {
    if (!formData.condominiumId) return [];
    return units.filter(u => u.condominiumId === formData.condominiumId);
  }, [units, formData.condominiumId]);

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/external-seller/appointments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/appointments"] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: language === "es" ? "Cita creada" : "Appointment created",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error al crear cita" : "Error creating appointment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/external-seller/appointments/${id}/cancel`, { 
        cancellationReason: reason 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/appointments"] });
      setSelectedAppointment(null);
      toast({
        title: language === "es" ? "Cita cancelada" : "Appointment cancelled",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error al cancelar" : "Error cancelling",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      mode: 'individual',
      leadId: '',
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
      time: '10:00',
      notes: '',
      tourStops: [],
      unitId: '',
      condominiumId: '',
    });
  };

  // Calendar navigation
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Get days of current month
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date): Appointment[] => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.date), date)
    );
  };

  // Get reminders for a specific day
  const getRemindersForDay = (date: Date): Reminder[] => {
    return reminders.filter(rem => 
      isSameDay(new Date(rem.dueDate), date)
    );
  };

  // Get appointments for selected date
  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return [];
    return getAppointmentsForDay(selectedDate);
  }, [selectedDate, appointments]);

  // Get reminders for selected date
  const selectedDateReminders = useMemo(() => {
    if (!selectedDate) return [];
    return getRemindersForDay(selectedDate);
  }, [selectedDate, reminders]);

  // Get reminder type icon
  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'whatsapp': return MessageCircle;
      case 'email': return Mail;
      case 'meeting': return User;
      case 'document': return FileText;
      default: return Bell;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
    }
  };

  // Handle lead selection
  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setFormData(prev => ({
        ...prev,
        leadId,
        clientName: `${lead.firstName} ${lead.lastName}`,
        clientPhone: lead.phone || '',
        clientEmail: lead.email || '',
      }));
    }
  };

  // Handle tour stop add
  const addTourStop = () => {
    if (formData.tourStops.length >= 3) {
      toast({
        title: language === "es" ? "Máximo 3 propiedades" : "Maximum 3 properties",
        variant: "destructive",
      });
      return;
    }
    setFormData(prev => ({
      ...prev,
      tourStops: [...prev.tourStops, { unitId: '', condominiumId: '', notes: '' }],
    }));
  };

  // Handle tour stop remove
  const removeTourStop = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tourStops: prev.tourStops.filter((_, i) => i !== index),
    }));
  };

  // Handle tour stop update
  const updateTourStop = (index: number, field: 'unitId' | 'condominiumId' | 'notes', value: string) => {
    setFormData(prev => ({
      ...prev,
      tourStops: prev.tourStops.map((stop, i) => {
        if (i !== index) return stop;
        // If changing condominium, reset unitId
        if (field === 'condominiumId') {
          return { ...stop, condominiumId: value, unitId: '' };
        }
        return { ...stop, [field]: value };
      }),
    }));
  };

  // Get units filtered by condominium for tour stops
  const getUnitsForTourStop = (condominiumId: string) => {
    if (!condominiumId) return [];
    return units.filter(u => u.condominiumId === condominiumId);
  };

  // Handle form submit
  const handleSubmit = () => {
    if (!formData.leadId) {
      toast({
        title: language === "es" ? "Selecciona un lead" : "Select a lead",
        variant: "destructive",
      });
      return;
    }

    if (formData.mode === 'individual' && !formData.unitId) {
      toast({
        title: language === "es" ? "Selecciona una propiedad" : "Select a property",
        variant: "destructive",
      });
      return;
    }

    if (formData.mode === 'tour' && formData.tourStops.length === 0) {
      toast({
        title: language === "es" ? "Agrega al menos una propiedad al tour" : "Add at least one property to the tour",
        variant: "destructive",
      });
      return;
    }

    // Find unit info for appointment
    const unit = formData.mode === 'individual' 
      ? units.find(u => u.id === formData.unitId)
      : null;

    const dateTime = new Date(`${formData.date}T${formData.time}`);

    createMutation.mutate({
      mode: formData.mode,
      leadId: formData.leadId,
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      clientEmail: formData.clientEmail,
      date: dateTime.toISOString(),
      notes: formData.notes,
      unitId: formData.mode === 'individual' ? formData.unitId : null,
      condominiumName: unit?.condominium?.name,
      unitNumber: unit?.unitNumber,
      tourStops: formData.mode === 'tour' ? formData.tourStops : undefined,
    });
  };

  // Open create dialog with selected date
  const openCreateDialog = (date?: Date) => {
    const targetDate = date || selectedDate || new Date();
    setFormData(prev => ({
      ...prev,
      date: format(targetDate, 'yyyy-MM-dd'),
    }));
    setIsCreateOpen(true);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
      confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    };
    const labels: Record<string, { es: string; en: string }> = {
      pending: { es: "Pendiente", en: "Pending" },
      confirmed: { es: "Confirmada", en: "Confirmed" },
      completed: { es: "Completada", en: "Completed" },
      cancelled: { es: "Cancelada", en: "Cancelled" },
    };
    return (
      <Badge className={styles[status] || styles.pending}>
        {labels[status]?.[language] || status}
      </Badge>
    );
  };

  // Get unit display name
  const getUnitDisplayName = (unit: Unit) => {
    return unit.condominium?.name 
      ? `${unit.condominium.name} - ${unit.unitNumber}`
      : unit.unitNumber;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-calendar-title">
            {language === "es" ? "Mi Calendario" : "My Calendar"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {language === "es" 
              ? "Gestiona tus citas con clientes" 
              : "Manage your client appointments"}
          </p>
        </div>
        {!isMobile && (
          <Button 
            onClick={() => openCreateDialog()}
            className="min-h-[44px]"
            data-testid="button-create-appointment"
          >
            <Plus className="mr-2 h-4 w-4" />
            {language === "es" ? "Nueva Cita" : "New Appointment"}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(currentMonth, 'MMMM yyyy', { locale })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={goToToday}
                  className="min-h-[44px]"
                  data-testid="button-today"
                >
                  {language === "es" ? "Hoy" : "Today"}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={goToPreviousMonth}
                  className="min-h-[44px] min-w-[44px]"
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={goToNextMonth}
                  className="min-h-[44px] min-w-[44px]"
                  data-testid="button-next-month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {(language === "es" 
                ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
                : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
              ).map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before first of month */}
              {Array.from({ length: getDay(daysInMonth[0]) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}
              
              {/* Day cells */}
              {daysInMonth.map(day => {
                const dayAppointments = getAppointmentsForDay(day);
                const dayReminders = getRemindersForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isPast = isBefore(day, startOfDay(new Date()));
                const hasItems = dayAppointments.length > 0 || dayReminders.length > 0;
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "h-10 p-1 rounded-md text-sm relative transition-colors",
                      "hover-elevate focus:outline-none focus:ring-2 focus:ring-primary",
                      isToday(day) && "bg-primary/10 font-bold",
                      isSelected && "bg-primary text-primary-foreground",
                      isPast && !isToday(day) && "text-muted-foreground/50"
                    )}
                    data-testid={`day-${format(day, 'yyyy-MM-dd')}`}
                  >
                    <span>{format(day, 'd')}</span>
                    {hasItems && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {/* Appointment dots */}
                        {dayAppointments.slice(0, 2).map((apt, i) => (
                          <div
                            key={`apt-${i}`}
                            className={cn(
                              "w-1 h-1 rounded-full",
                              apt.status === 'cancelled' ? "bg-red-400" :
                              apt.status === 'completed' ? "bg-green-400" :
                              apt.isRestricted ? "bg-gray-400" : "bg-primary"
                            )}
                          />
                        ))}
                        {/* Reminder dots (orange/yellow) */}
                        {dayReminders.slice(0, 2).map((rem, i) => (
                          <div
                            key={`rem-${i}`}
                            className={cn(
                              "w-1 h-1 rounded-full",
                              rem.status === 'completed' ? "bg-green-400" :
                              rem.priority === 'urgent' ? "bg-red-400" :
                              rem.priority === 'high' ? "bg-orange-400" : "bg-yellow-400"
                            )}
                          />
                        ))}
                        {(dayAppointments.length + dayReminders.length) > 4 && (
                          <span className="text-[8px] text-muted-foreground">+{(dayAppointments.length + dayReminders.length) - 4}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected day appointments and reminders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {selectedDate 
                ? format(selectedDate, 'EEEE, d MMMM', { locale })
                : (language === "es" ? "Selecciona un día" : "Select a day")}
            </CardTitle>
            {selectedDate && (
              <CardDescription>
                {selectedDateAppointments.length} {language === "es" ? "citas" : "appointments"}
                {selectedDateReminders.length > 0 && (
                  <span className="ml-1">
                    · {selectedDateReminders.length} {language === "es" ? "recordatorios" : "reminders"}
                  </span>
                )}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingAppointments ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : selectedDate ? (
              (selectedDateAppointments.length > 0 || selectedDateReminders.length > 0) ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-4">
                    {/* Reminders Section */}
                    {selectedDateReminders.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                          <Bell className="h-3 w-3" />
                          {language === "es" ? "Recordatorios" : "Reminders"}
                        </div>
                        {selectedDateReminders.map(rem => {
                          const ReminderIcon = getReminderIcon(rem.reminderType);
                          return (
                            <Card 
                              key={rem.id} 
                              className="border-l-4 border-l-yellow-400"
                              data-testid={`reminder-${rem.id}`}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <ReminderIcon className="h-4 w-4 text-yellow-600" />
                                    <span className="font-medium text-sm truncate">{rem.title}</span>
                                  </div>
                                  <Badge className={getPriorityColor(rem.priority)} variant="secondary">
                                    {rem.priority === 'urgent' ? (language === "es" ? "Urgente" : "Urgent") :
                                     rem.priority === 'high' ? (language === "es" ? "Alta" : "High") :
                                     rem.priority === 'medium' ? (language === "es" ? "Media" : "Medium") :
                                     (language === "es" ? "Baja" : "Low")}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-1 text-sm">
                                  {rem.lead && (
                                    <div className="flex items-center gap-2">
                                      <User className="h-3 w-3 text-muted-foreground" />
                                      <span>{rem.lead.firstName} {rem.lead.lastName}</span>
                                    </div>
                                  )}
                                  {rem.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {rem.description}
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                        {selectedDateAppointments.length > 0 && <Separator className="my-2" />}
                      </>
                    )}
                    
                    {/* Appointments Section */}
                    {selectedDateAppointments.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                          <CalendarIcon className="h-3 w-3" />
                          {language === "es" ? "Citas" : "Appointments"}
                        </div>
                        {selectedDateAppointments.map(apt => (
                          <Card 
                            key={apt.id} 
                            className={cn(
                              "cursor-pointer hover-elevate",
                              apt.isRestricted && "opacity-75"
                            )}
                            onClick={() => setSelectedAppointment(apt)}
                            data-testid={`appointment-${apt.id}`}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  {apt.mode === 'tour' ? (
                                    <Route className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Home className="h-4 w-4 text-primary" />
                                  )}
                                  <span className="font-medium text-sm">
                                    {apt.mode === 'tour' 
                                      ? (language === "es" ? "Tour" : "Tour")
                                      : (language === "es" ? "Cita Individual" : "Individual")}
                                  </span>
                                </div>
                                {getStatusBadge(apt.status)}
                              </div>
                              
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span>{format(new Date(apt.date), 'HH:mm')}</span>
                                  {apt.endTime && (
                                    <span className="text-muted-foreground">
                                      - {format(new Date(apt.endTime), 'HH:mm')}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className={apt.isRestricted ? "text-muted-foreground" : ""}>
                                    {apt.clientName}
                                  </span>
                                  {apt.isRestricted && (
                                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </div>
                                
                                {apt.condominiumName && (
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate">
                                      {apt.condominiumName} {apt.unitNumber && `- ${apt.unitNumber}`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-sm mb-4">
                    {language === "es" 
                      ? "No hay citas para este día"
                      : "No appointments for this day"}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openCreateDialog(selectedDate)}
                    className="min-h-[44px]"
                    data-testid="button-create-empty-state"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {language === "es" ? "Crear cita" : "Create appointment"}
                  </Button>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {language === "es" 
                  ? "Selecciona un día en el calendario"
                  : "Select a day on the calendar"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Appointment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {language === "es" ? "Nueva Cita" : "New Appointment"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Agenda una cita con uno de tus leads"
                : "Schedule an appointment with one of your leads"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Appointment Type */}
            <div className="space-y-2">
              <Label>{language === "es" ? "Tipo de cita" : "Appointment type"}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.mode === 'individual' ? 'default' : 'outline'}
                  className="flex-1 min-h-[44px]"
                  onClick={() => setFormData(prev => ({ ...prev, mode: 'individual', tourStops: [] }))}
                  data-testid="button-mode-individual"
                >
                  <Home className="mr-2 h-4 w-4" />
                  {language === "es" ? "Individual (1 hr)" : "Individual (1 hr)"}
                </Button>
                <Button
                  type="button"
                  variant={formData.mode === 'tour' ? 'default' : 'outline'}
                  className="flex-1 min-h-[44px]"
                  onClick={() => setFormData(prev => ({ ...prev, mode: 'tour', unitId: '' }))}
                  data-testid="button-mode-tour"
                >
                  <Route className="mr-2 h-4 w-4" />
                  {language === "es" ? "Tour (30 min c/u)" : "Tour (30 min each)"}
                </Button>
              </div>
            </div>

            {/* Lead Selection */}
            <div className="space-y-2">
              <Label>{language === "es" ? "Lead / Cliente" : "Lead / Client"}</Label>
              <Select value={formData.leadId} onValueChange={handleLeadSelect} disabled={isLoadingLeads}>
                <SelectTrigger className="min-h-[44px]" data-testid="select-lead">
                  <SelectValue placeholder={
                    isLoadingLeads 
                      ? (language === "es" ? "Cargando leads..." : "Loading leads...")
                      : leads.length === 0
                        ? (language === "es" ? "No hay leads disponibles" : "No leads available")
                        : (language === "es" ? "Seleccionar lead..." : "Select lead...")
                  } />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingLeads ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-muted-foreground text-sm">
                        {language === "es" ? "Cargando..." : "Loading..."}
                      </span>
                    </div>
                  ) : leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 px-2">
                      <User className="h-8 w-8 text-muted-foreground/40 mb-2" />
                      <span className="text-muted-foreground text-sm text-center">
                        {language === "es" 
                          ? "No tienes leads asignados. Registra nuevos leads desde la sección de Leads."
                          : "You have no assigned leads. Register new leads from the Leads section."
                        }
                      </span>
                    </div>
                  ) : (
                    leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id} className="min-h-[44px]">
                        {lead.firstName} {lead.lastName}
                        {lead.phone && <span className="text-muted-foreground ml-2">({lead.phone})</span>}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {leads.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {language === "es" 
                    ? `${leads.length} lead(s) disponible(s)`
                    : `${leads.length} lead(s) available`
                  }
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "es" ? "Fecha" : "Date"}</Label>
                <Input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="min-h-[44px]"
                  data-testid="input-date"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "es" ? "Hora" : "Time"}</Label>
                <Input 
                  type="time" 
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="min-h-[44px]"
                  data-testid="input-time"
                />
              </div>
            </div>

            {/* Individual: Condominium + Unit Selection */}
            {formData.mode === 'individual' && (
              <div className="space-y-4">
                {/* Condominium Selection with Search */}
                <div className="space-y-2">
                  <Label>{language === "es" ? "Condominio" : "Condominium"}</Label>
                  <Popover open={condoPopoverOpen} onOpenChange={setCondoPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={condoPopoverOpen}
                        className="w-full justify-between min-h-[44px]"
                        data-testid="select-condominium"
                      >
                        {formData.condominiumId ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                              {condominiums.find(c => c.id === formData.condominiumId)?.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            {language === "es" ? "Buscar condominio..." : "Search condominium..."}
                          </span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder={language === "es" ? "Buscar condominio..." : "Search condominium..."} 
                        />
                        <CommandList>
                          <CommandEmpty>
                            {language === "es" ? "No se encontraron condominios" : "No condominiums found"}
                          </CommandEmpty>
                          <CommandGroup>
                            {condominiums.map(condo => (
                              <CommandItem
                                key={condo.id}
                                value={condo.name}
                                onSelect={() => {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    condominiumId: condo.id,
                                    unitId: ''
                                  }));
                                  setCondoPopoverOpen(false);
                                }}
                                className="min-h-[44px]"
                              >
                                <Building2 className="mr-2 h-4 w-4" />
                                {condo.name}
                                {formData.condominiumId === condo.id && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Unit Selection - only show when condominium is selected */}
                <div className="space-y-2">
                  <Label>{language === "es" ? "Unidad" : "Unit"}</Label>
                  <Select 
                    value={formData.unitId} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, unitId: v }))}
                    disabled={!formData.condominiumId}
                  >
                    <SelectTrigger className="min-h-[44px]" data-testid="select-unit">
                      <SelectValue placeholder={
                        !formData.condominiumId 
                          ? (language === "es" ? "Primero selecciona un condominio" : "First select a condominium")
                          : (language === "es" ? "Seleccionar unidad..." : "Select unit...")
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUnits.map(unit => (
                        <SelectItem key={unit.id} value={unit.id} className="min-h-[44px]">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            {unit.unitNumber}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Tour: Multiple Properties */}
            {formData.mode === 'tour' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    {language === "es" ? "Propiedades del tour" : "Tour properties"}
                    <span className="text-muted-foreground ml-1">({formData.tourStops.length}/3)</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTourStop}
                    disabled={formData.tourStops.length >= 3}
                    className="min-h-[44px]"
                    data-testid="button-add-tour-stop"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {language === "es" ? "Agregar" : "Add"}
                  </Button>
                </div>
                
                {formData.tourStops.length === 0 ? (
                  <div className="text-center py-4 border border-dashed rounded-lg">
                    <Building2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {language === "es" 
                        ? "Agrega propiedades al tour (máx. 3)"
                        : "Add properties to the tour (max. 3)"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.tourStops.map((stop, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {index + 1}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formData.time && format(
                                new Date(`2000-01-01T${formData.time}`).getTime() + index * 30 * 60 * 1000,
                                'HH:mm'
                              )}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTourStop(index)}
                            className="shrink-0 min-h-[44px] min-w-[44px]"
                            data-testid={`button-remove-stop-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Condominium Selection with Search */}
                        <Popover 
                          open={tourCondoPopoverOpen === index} 
                          onOpenChange={(open) => setTourCondoPopoverOpen(open ? index : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between min-h-[44px]"
                              data-testid={`select-tour-condo-${index}`}
                            >
                              {stop.condominiumId ? (
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 shrink-0" />
                                  <span className="truncate">
                                    {condominiums.find(c => c.id === stop.condominiumId)?.name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  {language === "es" ? "Buscar condominio..." : "Search condominium..."}
                                </span>
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[280px] p-0" align="start">
                            <Command>
                              <CommandInput 
                                placeholder={language === "es" ? "Buscar condominio..." : "Search condominium..."} 
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {language === "es" ? "No se encontraron condominios" : "No condominiums found"}
                                </CommandEmpty>
                                <CommandGroup>
                                  {condominiums.map(condo => (
                                    <CommandItem
                                      key={condo.id}
                                      value={condo.name}
                                      onSelect={() => {
                                        updateTourStop(index, 'condominiumId', condo.id);
                                        setTourCondoPopoverOpen(null);
                                      }}
                                      className="min-h-[44px]"
                                    >
                                      <Building2 className="mr-2 h-4 w-4" />
                                      {condo.name}
                                      {stop.condominiumId === condo.id && (
                                        <Check className="ml-auto h-4 w-4" />
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        
                        {/* Unit Selection */}
                        <Select 
                          value={stop.unitId} 
                          onValueChange={(v) => updateTourStop(index, 'unitId', v)}
                          disabled={!stop.condominiumId}
                        >
                          <SelectTrigger className="min-h-[44px]" data-testid={`select-tour-unit-${index}`}>
                            <SelectValue placeholder={
                              !stop.condominiumId 
                                ? (language === "es" ? "Primero selecciona un condominio" : "First select a condominium")
                                : (language === "es" ? "Seleccionar unidad..." : "Select unit...")
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {getUnitsForTourStop(stop.condominiumId)
                              .filter(u => !formData.tourStops.some((s, i) => i !== index && s.unitId === u.id))
                              .map(unit => (
                                <SelectItem key={unit.id} value={unit.id} className="min-h-[44px]">
                                  <div className="flex items-center gap-2">
                                    <Home className="h-4 w-4" />
                                    {unit.unitNumber}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>{language === "es" ? "Notas" : "Notes"}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={language === "es" 
                  ? "Notas adicionales para la cita..."
                  : "Additional notes for the appointment..."}
                rows={3}
                data-testid="textarea-notes"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateOpen(false)}
              className="min-h-[44px]"
              data-testid="button-cancel-dialog"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="min-h-[44px]"
              data-testid="button-save-appointment"
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === "es" ? "Crear Cita" : "Create Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAppointment?.mode === 'tour' ? (
                <Route className="h-5 w-5 text-primary" />
              ) : (
                <Home className="h-5 w-5 text-primary" />
              )}
              {selectedAppointment?.mode === 'tour' 
                ? (language === "es" ? "Tour de Propiedades" : "Property Tour")
                : (language === "es" ? "Cita Individual" : "Individual Appointment")}
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedAppointment.status)}
                {selectedAppointment.isRestricted && (
                  <Badge variant="secondary" className="gap-1">
                    <EyeOff className="h-3 w-3" />
                    {language === "es" ? "Vista limitada" : "Limited view"}
                  </Badge>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(selectedAppointment.date), 'EEEE, d MMMM yyyy', { locale })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedAppointment.date), 'HH:mm')}
                      {selectedAppointment.endTime && ` - ${format(new Date(selectedAppointment.endTime), 'HH:mm')}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedAppointment.clientName}</p>
                    {!selectedAppointment.isRestricted && selectedAppointment.clientPhone && (
                      <p className="text-sm text-muted-foreground">{selectedAppointment.clientPhone}</p>
                    )}
                  </div>
                </div>

                {selectedAppointment.condominiumName && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{selectedAppointment.condominiumName}</p>
                      {selectedAppointment.unitNumber && (
                        <p className="text-sm text-muted-foreground">
                          {language === "es" ? "Unidad" : "Unit"} {selectedAppointment.unitNumber}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!selectedAppointment.isRestricted && selectedAppointment.notes && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>

              {selectedAppointment.canCancel && 
               selectedAppointment.status !== 'cancelled' && 
               selectedAppointment.status !== 'completed' && (
                <DialogFooter>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="w-full min-h-[44px]"
                        data-testid="button-cancel-appointment"
                      >
                        <X className="mr-2 h-4 w-4" />
                        {language === "es" ? "Cancelar Cita" : "Cancel Appointment"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {language === "es" ? "Cancelar cita" : "Cancel appointment"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {language === "es"
                            ? "¿Estás seguro de que deseas cancelar esta cita?"
                            : "Are you sure you want to cancel this appointment?"}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {language === "es" ? "No, mantener" : "No, keep it"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => cancelMutation.mutate({ 
                            id: selectedAppointment.id, 
                            reason: 'Cancelled by seller' 
                          })}
                        >
                          {language === "es" ? "Sí, cancelar" : "Yes, cancel"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile FAB for New Appointment - Fixed position, always visible when scrolling */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-[9999]">
          <Button
            className="h-14 w-14 rounded-full shadow-xl"
            size="icon"
            onClick={() => openCreateDialog()}
            data-testid="fab-create-appointment"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
