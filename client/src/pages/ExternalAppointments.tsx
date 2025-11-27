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
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Plus, 
  Search, 
  Filter, 
  List, 
  LayoutGrid, 
  Phone, 
  Mail, 
  Building2, 
  Building,
  Home,
  X, 
  Edit, 
  Edit3,
  Trash2, 
  Check, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  CalendarPlus,
  Users,
  UserPlus,
  Video,
  FileText,
  CheckCircle2,
  Key,
  Wifi,
  Lock,
  Car,
  UserCheck,
  Info,
  MessageCircle,
  Bed,
  DollarSign,
  PawPrint,
  CalendarCheck,
  Target,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, isToday, isBefore, addHours } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";

type ExternalAppointment = {
  id: string;
  agencyId: string;
  unitId: string | null;
  clientId: string | null;
  leadId: string | null;
  presentationCardId: string | null;
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
  feedbackOutcome?: string | null;
  feedbackNotes?: string | null;
  feedbackRatingDelta?: number | null;
  feedbackSubmittedAt?: string | null;
  feedbackSubmittedBy?: string | null;
};

type PresentationCard = {
  id: string;
  cardName: string | null;
  status: string;
  propertyType: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  bedrooms: number | null;
  zone: string | null;
  moveInDate: string | null;
};

type LeadPreferences = {
  checkInDate: string | null;
  checkInDateText: string | null;
  hasPets: string | null;
  estimatedRentCost: number | null;
  estimatedRentCostText: string | null;
  bedrooms: number | null;
  bedroomsText: string | null;
  desiredUnitType: string | null;
  desiredProperty: string | null;
  desiredNeighborhood: string | null;
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

type ExternalCondominium = {
  id: string;
  name: string;
  agencyId: string;
};

type ExternalClient = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
};

type ExternalLead = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
};

type AgencyUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
};

type UnitAccessControl = {
  id: string;
  unitId: string;
  accessType: "door_code" | "wifi" | "contact" | "lockbox" | "key_location" | "parking" | "other";
  accessValue: string;
  accessName: string | null;
  notes: string | null;
  isActive: boolean;
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
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [appointmentForFeedback, setAppointmentForFeedback] = useState<ExternalAppointment | null>(null);
  const [feedbackData, setFeedbackData] = useState({
    outcome: "" as string,
    ratingDelta: 0,
    notes: "",
  });
  const [condoComboOpen, setCondoComboOpen] = useState(false);
  const [tourCondoComboOpen, setTourCondoComboOpen] = useState<number | null>(null);
  const [condoSearchTerm, setCondoSearchTerm] = useState("");
  const [tourCondoSearchTerm, setTourCondoSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    clientSource: "client" as "client" | "lead" | "manual",
    clientId: "",
    leadId: "",
    presentationCardId: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    mode: "individual" as "individual" | "tour",
    type: "in-person" as "in-person" | "video",
    date: new Date(),
    time: "10:00",
    condominiumId: "",
    unitId: "",
    notes: "",
    tourStops: [] as { unitId: string; condominiumId: string; notes: string }[],
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

  const { data: condominiumsData } = useQuery<{ data: ExternalCondominium[]; total: number }>({
    queryKey: ["/api/external-condominiums"],
  });
  
  const { data: allCondominiums = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/external-condominiums-for-filters"],
  });
  const condominiums = condominiumsData?.data ?? [];

  const { data: clientsData } = useQuery<{ data: ExternalClient[]; total: number }>({
    queryKey: ["/api/external-clients"],
  });
  const clients = clientsData?.data ?? [];

  const { data: leadsData } = useQuery<{ data: ExternalLead[]; total: number }>({
    queryKey: ["/api/external-leads"],
  });
  const leads = leadsData?.data ?? [];

  const hasPresentationCardContext = (formData.clientSource === "client" && !!formData.clientId) || 
                                     (formData.clientSource === "lead" && !!formData.leadId);
  
  const presentationCardQueryEndpoint = formData.clientSource === "client" && formData.clientId 
    ? `/api/external/presentation-cards?clientId=${formData.clientId}`
    : formData.clientSource === "lead" && formData.leadId 
      ? `/api/external/presentation-cards?leadId=${formData.leadId}`
      : "";

  const { data: presentationCards = [] } = useQuery<PresentationCard[]>({
    queryKey: ["/api/external/presentation-cards", formData.clientSource, formData.clientId, formData.leadId],
    queryFn: () => fetch(presentationCardQueryEndpoint, { credentials: "include" }).then(r => r.json()),
    enabled: hasPresentationCardContext && !!presentationCardQueryEndpoint,
  });

  const { data: agencyUsers = [] } = useQuery<AgencyUser[]>({
    queryKey: ["/api/external/users"],
  });

  const { data: condoUnits = [] } = useQuery<{ id: string; unitNumber: string; type: string }[]>({
    queryKey: ["/api/external-condominiums", formData.condominiumId, "units"],
    enabled: !!formData.condominiumId,
  });

  const selectedUnitIds = useMemo(() => {
    if (!selectedAppointment) return [];
    if (selectedAppointment.mode === "tour" && selectedAppointment.tourStops?.length) {
      return selectedAppointment.tourStops.map(s => s.unitId);
    }
    return selectedAppointment.unitId ? [selectedAppointment.unitId] : [];
  }, [selectedAppointment]);

  const selectedUnitIdsKey = selectedUnitIds.join(",");
  
  // Fetch unit details with condominium info for display in detail dialog
  const { data: selectedUnitsDetails = {} } = useQuery<Record<string, { unit: ExternalUnit; condominiumName: string | null }>>({
    queryKey: ["/api/external-units-details/batch", selectedUnitIdsKey],
    queryFn: async () => {
      if (selectedUnitIds.length === 0) return {};
      const results: Record<string, { unit: ExternalUnit; condominiumName: string | null }> = {};
      await Promise.all(selectedUnitIds.map(async (unitId) => {
        try {
          const response = await fetch(`/api/external-units/${unitId}/overview`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            results[unitId] = {
              unit: data.unit,
              condominiumName: data.condominium?.name || null
            };
          }
        } catch (error) {
          console.error(`Error fetching unit details for ${unitId}:`, error);
        }
      }));
      return results;
    },
    enabled: selectedUnitIds.length > 0 && !!selectedAppointment,
  });
  
  const { data: selectedUnitAccessControls = {} } = useQuery<Record<string, UnitAccessControl[]>>({
    queryKey: ["/api/external-unit-access-controls/batch", selectedUnitIdsKey],
    queryFn: async () => {
      if (selectedUnitIds.length === 0) return {};
      const results: Record<string, UnitAccessControl[]> = {};
      await Promise.all(selectedUnitIds.map(async (unitId) => {
        try {
          const response = await fetch(`/api/external-unit-access-controls/by-unit/${unitId}?isActive=true`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            results[unitId] = Array.isArray(data) ? data : [];
          }
        } catch (error) {
          console.error(`Error fetching access controls for unit ${unitId}:`, error);
          results[unitId] = [];
        }
      }));
      return results;
    },
    enabled: selectedUnitIds.length > 0 && !!selectedAppointment,
  });
  
  // Fetch lead preferences for display in detail dialog
  const selectedLeadId = selectedAppointment?.leadId || null;
  const { data: selectedLeadPreferences } = useQuery<LeadPreferences | null>({
    queryKey: ["/api/external-leads", selectedLeadId, "preferences"],
    queryFn: async () => {
      if (!selectedLeadId) return null;
      try {
        const response = await fetch(`/api/external-leads/${selectedLeadId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const lead = await response.json();
          return {
            checkInDate: lead.checkInDate || null,
            checkInDateText: lead.checkInDateText || null,
            hasPets: lead.hasPets || null,
            estimatedRentCost: lead.estimatedRentCost ? Number(lead.estimatedRentCost) : null,
            estimatedRentCostText: lead.estimatedRentCostText || null,
            bedrooms: lead.bedrooms || null,
            bedroomsText: lead.bedroomsText || null,
            desiredUnitType: lead.desiredUnitType || null,
            desiredProperty: lead.desiredProperty || null,
            desiredNeighborhood: lead.desiredNeighborhood || null,
          };
        }
        return null;
      } catch (error) {
        console.error("Error fetching lead preferences:", error);
        return null;
      }
    },
    enabled: !!selectedLeadId,
  });

  const salespersons = useMemo(() => {
    return agencyUsers.filter(u => 
      u.role === "external_agency_staff" || 
      u.role === "external_agency_admin"
    );
  }, [agencyUsers]);

  const filteredUnits = condoUnits;

  const [tourUnitsCache, setTourUnitsCache] = useState<Record<string, { id: string; unitNumber: string; type: string }[]>>({});

  const fetchUnitsForCondominium = async (condominiumId: string) => {
    if (!condominiumId || tourUnitsCache[condominiumId]) return;
    try {
      const response = await fetch(`/api/external-condominiums/${condominiumId}/units`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTourUnitsCache(prev => ({ ...prev, [condominiumId]: data }));
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  const filteredCondominiums = useMemo(() => {
    if (!condoSearchTerm) return allCondominiums;
    return allCondominiums.filter(c => 
      c.name.toLowerCase().includes(condoSearchTerm.toLowerCase())
    );
  }, [allCondominiums, condoSearchTerm]);

  const filteredTourCondominiums = useMemo(() => {
    if (!tourCondoSearchTerm) return allCondominiums;
    return allCondominiums.filter(c => 
      c.name.toLowerCase().includes(tourCondoSearchTerm.toLowerCase())
    );
  }, [allCondominiums, tourCondoSearchTerm]);


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

  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ id, outcome, notes, ratingDelta }: { id: string; outcome: string; notes: string; ratingDelta: number }) => {
      return await apiRequest("PATCH", `/api/external-appointments/${id}/feedback`, { outcome, notes, ratingDelta });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-appointments"] });
      toast({
        title: language === "es" ? "Feedback guardado" : "Feedback saved",
      });
      setFeedbackDialogOpen(false);
      setAppointmentForFeedback(null);
      setFeedbackData({ outcome: "", notes: "", ratingDelta: 0 });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error al guardar feedback" : "Error saving feedback",
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
      clientSource: "client",
      clientId: "",
      leadId: "",
      presentationCardId: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      mode: "individual",
      type: "in-person",
      date: new Date(),
      time: "10:00",
      condominiumId: "",
      unitId: "",
      notes: "",
      tourStops: [],
    });
  };

  const handleOpenEdit = (appointment: ExternalAppointment) => {
    const appointmentDate = new Date(appointment.date);
    setEditingAppointment(appointment);
    const clientSource = appointment.clientId ? "client" : appointment.leadId ? "lead" : "manual";
    const unit = units.find(u => u.id === appointment.unitId);
    setFormData({
      clientSource: clientSource as "client" | "lead" | "manual",
      clientId: appointment.clientId || "",
      leadId: appointment.leadId || "",
      presentationCardId: appointment.presentationCardId || "",
      clientName: appointment.clientName,
      clientEmail: appointment.clientEmail || "",
      clientPhone: appointment.clientPhone || "",
      mode: appointment.mode,
      type: appointment.type,
      date: appointmentDate,
      time: format(appointmentDate, "HH:mm"),
      condominiumId: unit?.condominiumId || "",
      unitId: appointment.unitId || "",
      notes: appointment.notes || "",
      tourStops: appointment.tourStops?.map(s => ({ unitId: s.unitId, condominiumId: "", notes: s.notes || "" })) || [],
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

    if (formData.clientSource === "client" && formData.clientId) {
      data.clientId = formData.clientId;
    }
    if (formData.clientSource === "lead" && formData.leadId) {
      data.leadId = formData.leadId;
    }
    if (formData.presentationCardId) {
      data.presentationCardId = formData.presentationCardId;
    }

    if (formData.mode === "individual") {
      data.unitId = formData.unitId || null;
    } else {
      data.tourStops = formData.tourStops.filter(stop => stop.unitId);
    }

    createMutation.mutate(data);
  };

  const handleAddTourStop = () => {
    if (formData.tourStops.length < 3) {
      setFormData(prev => ({
        ...prev,
        tourStops: [...prev.tourStops, { unitId: "", condominiumId: "", notes: "" }],
      }));
    }
  };

  const handleRemoveTourStop = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tourStops: prev.tourStops.filter((_, i) => i !== index),
    }));
  };

  const handleTourStopChange = (index: number, field: "unitId" | "notes" | "condominiumId", value: string) => {
    setFormData(prev => ({
      ...prev,
      tourStops: prev.tourStops.map((stop, i) => {
        if (i !== index) return stop;
        if (field === "condominiumId") {
          return { ...stop, condominiumId: value, unitId: "" };
        }
        return { ...stop, [field]: value };
      }),
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

  const getUnitInfo = (unitId: string | null) => {
    if (!unitId) return null;
    // First try to get from detailed data (fetched for selected appointment)
    const detailedInfo = selectedUnitsDetails[unitId];
    if (detailedInfo) {
      return {
        unitNumber: detailedInfo.unit.unitNumber,
        name: detailedInfo.unit.name,
        condominiumName: detailedInfo.condominiumName,
      };
    }
    // Fallback to paginated units list
    const unit = units.find(u => u.id === unitId);
    if (!unit) return null;
    const condo = unit.condominiumId ? allCondominiums.find(c => c.id === unit.condominiumId) : null;
    return {
      unitNumber: unit.unitNumber,
      name: unit.name,
      condominiumName: condo?.name || null,
    };
  };

  const getAccessTypeLabel = (type: UnitAccessControl["accessType"]) => {
    const labels: Record<string, { es: string; en: string }> = {
      door_code: { es: "Código de puerta", en: "Door Code" },
      wifi: { es: "WiFi", en: "WiFi" },
      contact: { es: "Contacto", en: "Contact" },
      lockbox: { es: "Caja de llaves", en: "Lockbox" },
      key_location: { es: "Ubicación de llave", en: "Key Location" },
      parking: { es: "Estacionamiento", en: "Parking" },
      other: { es: "Otro", en: "Other" },
    };
    return labels[type]?.[language] || type;
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

      {/* Create/Edit Dialog - Professional Design */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) handleCloseDialog();
        else setIsDialogOpen(true);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarPlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    {editingAppointment 
                      ? (language === "es" ? "Editar Cita" : "Edit Appointment")
                      : (language === "es" ? "Nueva Cita" : "New Appointment")}
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    {language === "es" 
                      ? "Complete la informacion para agendar la cita"
                      : "Complete the information to schedule the appointment"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* Appointment Type Selection - Card Style */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                <CalendarIcon className="h-4 w-4" />
                {language === "es" ? "Tipo de Cita" : "Appointment Type"}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mode: "individual", tourStops: [] }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.mode === "individual" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover-elevate"
                  }`}
                  data-testid="button-mode-individual"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      formData.mode === "individual" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{language === "es" ? "Individual" : "Individual"}</div>
                      <div className="text-xs text-muted-foreground">{language === "es" ? "1 hora - 1 propiedad" : "1 hour - 1 property"}</div>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mode: "tour", tourStops: [] }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.mode === "tour" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover-elevate"
                  }`}
                  data-testid="button-mode-tour"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      formData.mode === "tour" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{language === "es" ? "Tour" : "Tour"}</div>
                      <div className="text-xs text-muted-foreground">{language === "es" ? "30 min por propiedad (max 3)" : "30 min per property (max 3)"}</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Client Section */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                <Users className="h-4 w-4" />
                {language === "es" ? "Informacion del Cliente" : "Client Information"}
              </div>
              
              {/* Client Source Tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                {[
                  { value: "client", label: language === "es" ? "Cliente" : "Client", icon: User },
                  { value: "lead", label: "Lead", icon: UserPlus },
                  { value: "manual", label: language === "es" ? "Manual" : "Manual", icon: Edit3 }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      clientSource: value as any,
                      clientId: "",
                      leadId: "",
                      clientName: "",
                      clientEmail: "",
                      clientPhone: ""
                    }))}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      formData.clientSource === value 
                        ? "bg-background shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`tab-source-${value}`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Client Selection */}
              {formData.clientSource === "client" && (
                <div className="space-y-2">
                  <Label className="text-sm">{language === "es" ? "Seleccionar cliente" : "Select client"}</Label>
                  <Select 
                    value={formData.clientId} 
                    onValueChange={(v) => {
                      const selectedClient = clients.find(c => c.id === v);
                      setFormData(prev => ({ 
                        ...prev, 
                        clientId: v,
                        clientName: selectedClient ? `${selectedClient.firstName}${selectedClient.lastName ? ` ${selectedClient.lastName}` : ""}` : "",
                        clientEmail: selectedClient?.email || "",
                        clientPhone: selectedClient?.phone || ""
                      }));
                    }}
                  >
                    <SelectTrigger className="bg-background" data-testid="select-client">
                      <SelectValue placeholder={language === "es" ? "Buscar cliente..." : "Search client..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{client.firstName} {client.lastName || ""}</span>
                            {client.email && <span className="text-muted-foreground">({client.email})</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.clientId && (
                    <div className="flex items-center gap-4 p-3 rounded-md bg-background border text-sm">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{formData.clientName}</div>
                        <div className="text-muted-foreground flex flex-wrap gap-3">
                          {formData.clientEmail && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{formData.clientEmail}</span>}
                          {formData.clientPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{formData.clientPhone}</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formData.clientSource === "lead" && (
                <div className="space-y-2">
                  <Label className="text-sm">{language === "es" ? "Seleccionar lead" : "Select lead"}</Label>
                  <Select 
                    value={formData.leadId} 
                    onValueChange={(v) => {
                      const selectedLead = leads.find(l => l.id === v);
                      setFormData(prev => ({ 
                        ...prev, 
                        leadId: v,
                        clientName: selectedLead ? `${selectedLead.firstName}${selectedLead.lastName ? ` ${selectedLead.lastName}` : ""}` : "",
                        clientEmail: selectedLead?.email || "",
                        clientPhone: selectedLead?.phone || ""
                      }));
                    }}
                  >
                    <SelectTrigger className="bg-background" data-testid="select-lead">
                      <SelectValue placeholder={language === "es" ? "Buscar lead..." : "Search lead..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map(lead => (
                        <SelectItem key={lead.id} value={lead.id}>
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                            <span>{lead.firstName} {lead.lastName || ""}</span>
                            {lead.email && <span className="text-muted-foreground">({lead.email})</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.leadId && (
                    <div className="flex items-center gap-4 p-3 rounded-md bg-background border text-sm">
                      <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{formData.clientName}</div>
                        <div className="text-muted-foreground flex flex-wrap gap-3">
                          {formData.clientEmail && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{formData.clientEmail}</span>}
                          {formData.clientPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{formData.clientPhone}</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formData.clientSource === "manual" && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">{language === "es" ? "Nombre completo" : "Full name"} *</Label>
                    <Input
                      value={formData.clientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder={language === "es" ? "Ej: Juan Perez" : "Ex: John Doe"}
                      className="bg-background mt-1"
                      data-testid="input-client-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">{language === "es" ? "Email" : "Email"}</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          value={formData.clientEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                          className="bg-background pl-9"
                          placeholder="email@ejemplo.com"
                          data-testid="input-client-email"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">{language === "es" ? "Telefono" : "Phone"}</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={formData.clientPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                          className="bg-background pl-9"
                          placeholder="+52 998 123 4567"
                          data-testid="input-client-phone"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Presentation Card Selector */}
              {presentationCards.length > 0 && (formData.clientId || formData.leadId) && (
                <div className="space-y-2 pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Target className="h-4 w-4" />
                    {language === "es" ? "Tarjeta de Presentacion (Opcional)" : "Presentation Card (Optional)"}
                  </div>
                  <Select 
                    value={formData.presentationCardId} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, presentationCardId: v }))}
                  >
                    <SelectTrigger className="bg-background" data-testid="select-presentation-card">
                      <SelectValue placeholder={language === "es" ? "Seleccionar tarjeta..." : "Select card..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        <span className="text-muted-foreground">{language === "es" ? "Sin tarjeta" : "No card"}</span>
                      </SelectItem>
                      {presentationCards.map(card => (
                        <SelectItem key={card.id} value={card.id}>
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="font-medium">{card.cardName || (language === "es" ? "Sin nombre" : "Unnamed")}</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {card.bedrooms && (
                                <span className="flex items-center gap-0.5">
                                  <Bed className="h-3 w-3" />
                                  {card.bedrooms}
                                </span>
                              )}
                              {card.budgetMax && (
                                <span className="flex items-center gap-0.5">
                                  <DollarSign className="h-3 w-3" />
                                  ${(card.budgetMax / 1000).toFixed(0)}K
                                </span>
                              )}
                              {card.zone && <span>• {card.zone}</span>}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.presentationCardId && (
                    <p className="text-xs text-muted-foreground">
                      {language === "es" 
                        ? "Esta cita se vinculara con la tarjeta de presentacion seleccionada"
                        : "This appointment will be linked to the selected presentation card"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Date, Time & Modality Section */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {language === "es" ? "Fecha" : "Date"} *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal" data-testid="button-date">
                      {format(formData.date, "d MMM yyyy", { locale })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100]" align="start" sideOffset={5}>
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {language === "es" ? "Hora" : "Time"} *
                </Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="font-medium"
                  data-testid="input-time"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  {formData.type === "in-person" ? <MapPin className="h-4 w-4 text-muted-foreground" /> : <Video className="h-4 w-4 text-muted-foreground" />}
                  {language === "es" ? "Modalidad" : "Modality"}
                </Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as any }))}>
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-person">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {language === "es" ? "Presencial" : "In-person"}
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        {language === "es" ? "Video llamada" : "Video call"}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Property Section */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                <Building2 className="h-4 w-4" />
                {formData.mode === "individual" 
                  ? (language === "es" ? "Propiedad a Visitar" : "Property to Visit")
                  : (language === "es" ? "Propiedades del Tour" : "Tour Properties")}
              </div>

              {formData.mode === "individual" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm">{language === "es" ? "Condominio" : "Condominium"}</Label>
                    <Popover open={condoComboOpen} onOpenChange={setCondoComboOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={condoComboOpen}
                          className="w-full justify-between bg-background font-normal"
                          data-testid="select-condominium"
                        >
                          {formData.condominiumId 
                            ? allCondominiums.find(c => c.id === formData.condominiumId)?.name 
                            : (language === "es" ? "Buscar condominio..." : "Search condominium...")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 z-[100]" align="start">
                        <div className="flex flex-col">
                          <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <Input
                              placeholder={language === "es" ? "Buscar condominio..." : "Search condominium..."}
                              value={condoSearchTerm}
                              onChange={(e) => setCondoSearchTerm(e.target.value)}
                              className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </div>
                          <div className="max-h-[200px] overflow-y-auto p-1">
                            {filteredCondominiums.length === 0 ? (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                {language === "es" ? "No se encontraron condominios" : "No condominiums found"}
                              </div>
                            ) : (
                              filteredCondominiums.map(condo => (
                                <div
                                  key={condo.id}
                                  className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    formData.condominiumId === condo.id && "bg-accent"
                                  )}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, condominiumId: condo.id, unitId: "" }));
                                    setCondoComboOpen(false);
                                    setCondoSearchTerm("");
                                  }}
                                >
                                  <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                                  {condo.name}
                                  {formData.condominiumId === condo.id && (
                                    <Check className="ml-auto h-4 w-4" />
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{language === "es" ? "Unidad" : "Unit"}</Label>
                    <Select 
                      value={formData.unitId} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, unitId: v }))}
                      disabled={!formData.condominiumId}
                    >
                      <SelectTrigger className="bg-background" data-testid="select-unit">
                        <SelectValue placeholder={formData.condominiumId 
                          ? (language === "es" ? "Seleccionar..." : "Select...")
                          : (language === "es" ? "Primero seleccione condominio" : "First select condo")
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUnits.map(unit => (
                          <SelectItem key={unit.id} value={unit.id}>
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              {unit.unitNumber}{unit.type ? ` - ${unit.type}` : ""}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.tourStops.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg">
                      <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {language === "es" 
                          ? "Agrega hasta 3 propiedades para el tour"
                          : "Add up to 3 properties for the tour"}
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={handleAddTourStop}
                        data-testid="button-add-stop-empty"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {language === "es" ? "Agregar propiedad" : "Add property"}
                      </Button>
                    </div>
                  )}
                  {formData.tourStops.map((stop, index) => (
                    <div key={index} className="flex gap-3 items-center p-3 bg-background border rounded-lg">
                      <div className="flex flex-col items-center gap-1">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <span className="text-xs text-muted-foreground">30 min</span>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Popover open={tourCondoComboOpen === index} onOpenChange={(open) => setTourCondoComboOpen(open ? index : null)}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="h-9 justify-between font-normal"
                              data-testid={`select-tour-condo-${index}`}
                            >
                              <span className="truncate">
                                {stop.condominiumId 
                                  ? allCondominiums.find(c => c.id === stop.condominiumId)?.name 
                                  : (language === "es" ? "Condominio" : "Condo")}
                              </span>
                              <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[250px] p-0 z-[100]" align="start">
                            <div className="flex flex-col">
                              <div className="flex items-center border-b px-3">
                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                <Input
                                  placeholder={language === "es" ? "Buscar..." : "Search..."}
                                  value={tourCondoSearchTerm}
                                  onChange={(e) => setTourCondoSearchTerm(e.target.value)}
                                  className="h-9 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </div>
                              <div className="max-h-[200px] overflow-y-auto p-1">
                                {filteredTourCondominiums.length === 0 ? (
                                  <div className="py-4 text-center text-sm text-muted-foreground">
                                    {language === "es" ? "No encontrado" : "Not found"}
                                  </div>
                                ) : (
                                  filteredTourCondominiums.map(condo => (
                                    <div
                                      key={condo.id}
                                      className={cn(
                                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                        stop.condominiumId === condo.id && "bg-accent"
                                      )}
                                      onClick={() => {
                                        handleTourStopChange(index, "condominiumId", condo.id);
                                        fetchUnitsForCondominium(condo.id);
                                        setTourCondoComboOpen(null);
                                        setTourCondoSearchTerm("");
                                      }}
                                    >
                                      {condo.name}
                                      {stop.condominiumId === condo.id && (
                                        <Check className="ml-auto h-4 w-4" />
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Select 
                          value={stop.unitId} 
                          onValueChange={(v) => handleTourStopChange(index, "unitId", v)}
                          disabled={!stop.condominiumId}
                        >
                          <SelectTrigger className="h-9" data-testid={`select-tour-unit-${index}`}>
                            <SelectValue placeholder={language === "es" ? "Unidad" : "Unit"} />
                          </SelectTrigger>
                          <SelectContent>
                            {(tourUnitsCache[stop.condominiumId || ""] || []).map(unit => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.unitNumber}{unit.type ? ` - ${unit.type}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveTourStop(index)}
                        data-testid={`button-remove-stop-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {formData.tourStops.length > 0 && formData.tourStops.length < 3 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={handleAddTourStop}
                      data-testid="button-add-stop"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {language === "es" ? "Agregar otra propiedad" : "Add another property"}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {language === "es" ? "Notas adicionales" : "Additional notes"}
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={language === "es" ? "Informacion adicional sobre la cita..." : "Additional information about the appointment..."}
                rows={3}
                className="resize-none"
                data-testid="input-notes"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-4 bg-muted/30 border-t">
            <div className="text-sm text-muted-foreground">
              {formData.clientName && (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {language === "es" ? "Listo para guardar" : "Ready to save"}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
                {language === "es" ? "Cancelar" : "Cancel"}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.clientName || createMutation.isPending}
                className="min-w-[120px]"
                data-testid="button-save"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {language === "es" ? "Guardando..." : "Saving..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CalendarPlus className="h-4 w-4" />
                    {language === "es" ? "Crear Cita" : "Create Appointment"}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        {selectedAppointment && (
          <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={statusColors[selectedAppointment.status]}>
                      {statusLabels[selectedAppointment.status][language]}
                    </Badge>
                    <Badge className={modeColors[selectedAppointment.mode]}>
                      {modeLabels[selectedAppointment.mode][language]}
                    </Badge>
                  </div>
                  <DialogTitle className="text-xl font-semibold">{selectedAppointment.clientName}</DialogTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4" />
                      {format(new Date(selectedAppointment.date), "PPP", { locale })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {format(new Date(selectedAppointment.date), "HH:mm", { locale })}
                      {selectedAppointment.endTime && ` - ${format(new Date(selectedAppointment.endTime), "HH:mm", { locale })}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {language === "es" ? "Información del Cliente" : "Client Information"}
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      {selectedAppointment.clientEmail && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <span>{selectedAppointment.clientEmail}</span>
                        </div>
                      )}
                      {selectedAppointment.clientPhone && (() => {
                        const rawPhone = selectedAppointment.clientPhone;
                        const cleanPhone = rawPhone.replace(/\D/g, '');
                        const isValidPhone = cleanPhone.length >= 10;
                        return (
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-500" />
                            <span>{rawPhone}</span>
                          </div>
                          {isValidPhone && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => {
                                window.open(`https://wa.me/${cleanPhone}`, '_blank');
                              }}
                              data-testid="button-whatsapp"
                            >
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp
                            </Button>
                          )}
                        </div>
                        );
                      })()}
                      {!selectedAppointment.clientEmail && !selectedAppointment.clientPhone && (
                        <p className="text-sm text-muted-foreground italic">
                          {language === "es" ? "Sin información de contacto" : "No contact information"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Client Preferences / What they're looking for */}
                  {selectedLeadPreferences && (() => {
                    const hasPreferences = 
                      selectedLeadPreferences.bedrooms || 
                      selectedLeadPreferences.bedroomsText ||
                      selectedLeadPreferences.checkInDate || 
                      selectedLeadPreferences.checkInDateText ||
                      selectedLeadPreferences.desiredUnitType ||
                      selectedLeadPreferences.estimatedRentCost || 
                      selectedLeadPreferences.estimatedRentCostText ||
                      selectedLeadPreferences.hasPets ||
                      selectedLeadPreferences.desiredNeighborhood ||
                      selectedLeadPreferences.desiredProperty;
                    
                    if (!hasPreferences) return null;
                    
                    return (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        {language === "es" ? "¿Qué Busca?" : "What They're Looking For"}
                      </h4>
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        {(selectedLeadPreferences.bedrooms || selectedLeadPreferences.bedroomsText) && (
                          <div className="flex items-center gap-2 text-sm">
                            <Bed className="h-4 w-4 text-indigo-500" />
                            <span className="text-muted-foreground">{language === "es" ? "Recámaras:" : "Bedrooms:"}</span>
                            <span className="font-medium">
                              {selectedLeadPreferences.bedroomsText || selectedLeadPreferences.bedrooms}
                            </span>
                          </div>
                        )}
                        {(selectedLeadPreferences.checkInDate || selectedLeadPreferences.checkInDateText) && (
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarCheck className="h-4 w-4 text-blue-500" />
                            <span className="text-muted-foreground">{language === "es" ? "Fecha entrada:" : "Move-in:"}</span>
                            <span className="font-medium">
                              {selectedLeadPreferences.checkInDateText || 
                               (selectedLeadPreferences.checkInDate ? format(new Date(selectedLeadPreferences.checkInDate), "PPP", { locale }) : null)}
                            </span>
                          </div>
                        )}
                        {selectedLeadPreferences.desiredUnitType && (
                          <div className="flex items-center gap-2 text-sm">
                            <Home className="h-4 w-4 text-amber-500" />
                            <span className="text-muted-foreground">{language === "es" ? "Tipo:" : "Type:"}</span>
                            <span className="font-medium">{selectedLeadPreferences.desiredUnitType}</span>
                          </div>
                        )}
                        {(selectedLeadPreferences.estimatedRentCost || selectedLeadPreferences.estimatedRentCostText) && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="text-muted-foreground">{language === "es" ? "Presupuesto:" : "Budget:"}</span>
                            <span className="font-medium">
                              {selectedLeadPreferences.estimatedRentCostText || 
                               (selectedLeadPreferences.estimatedRentCost ? `$${selectedLeadPreferences.estimatedRentCost.toLocaleString()}` : null)}
                            </span>
                          </div>
                        )}
                        {selectedLeadPreferences.hasPets && (
                          <div className="flex items-center gap-2 text-sm">
                            <PawPrint className="h-4 w-4 text-orange-500" />
                            <span className="text-muted-foreground">{language === "es" ? "Mascotas:" : "Pets:"}</span>
                            <span className="font-medium">{selectedLeadPreferences.hasPets}</span>
                          </div>
                        )}
                        {selectedLeadPreferences.desiredNeighborhood && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-red-500" />
                            <span className="text-muted-foreground">{language === "es" ? "Zona:" : "Zone:"}</span>
                            <span className="font-medium">{selectedLeadPreferences.desiredNeighborhood}</span>
                          </div>
                        )}
                        {selectedLeadPreferences.desiredProperty && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-purple-500" />
                            <span className="text-muted-foreground">{language === "es" ? "Propiedad interés:" : "Property interest:"}</span>
                            <span className="font-medium">{selectedLeadPreferences.desiredProperty}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })()}

                  {selectedAppointment.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {language === "es" ? "Notas" : "Notes"}
                      </h4>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedAppointment.notes}</p>
                    </div>
                  )}

                  {/* Feedback Section */}
                  {selectedAppointment.status === "completed" && selectedAppointment.feedbackOutcome && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        {language === "es" ? "Feedback de la cita" : "Appointment Feedback"}
                      </h4>
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {({
                              liked: language === "es" ? "Le gustó" : "Liked",
                              disliked: language === "es" ? "No le gustó" : "Disliked",
                              will_make_offer: language === "es" ? "Hará oferta" : "Will make offer",
                              needs_followup: language === "es" ? "Necesita seguimiento" : "Needs follow-up",
                              rescheduled: language === "es" ? "Reagendada" : "Rescheduled",
                              no_show: language === "es" ? "No se presentó" : "No show",
                              not_qualified: language === "es" ? "No calificado" : "Not qualified",
                              other: language === "es" ? "Otro" : "Other",
                            }[selectedAppointment.feedbackOutcome] || selectedAppointment.feedbackOutcome)}
                          </Badge>
                        </div>
                        {selectedAppointment.feedbackNotes && (
                          <p className="text-sm text-muted-foreground">{selectedAppointment.feedbackNotes}</p>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                <div className="space-y-4">
                  {selectedAppointment.mode === "individual" && selectedAppointment.unitId && (() => {
                    const unitInfo = getUnitInfo(selectedAppointment.unitId);
                    const accessControls = selectedUnitAccessControls[selectedAppointment.unitId] || [];
                    return (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {language === "es" ? "Propiedad" : "Property"}
                        </h4>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          {unitInfo?.condominiumName && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-primary" />
                              <span className="font-medium">{unitInfo.condominiumName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-primary" />
                            <span>{unitInfo?.unitNumber || unitInfo?.name || selectedAppointment.unitId}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          {language === "es" ? "Credenciales de Acceso" : "Access Credentials"}
                        </h4>
                        {accessControls.length > 0 ? (
                          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                            {accessControls.map((control) => (
                              <div key={control.id} className="flex items-start gap-3">
                                <div className="mt-0.5">
                                  {control.accessType === "wifi" && <Wifi className="h-5 w-5 text-blue-500" />}
                                  {control.accessType === "door_code" && <Lock className="h-5 w-5 text-green-500" />}
                                  {control.accessType === "lockbox" && <Key className="h-5 w-5 text-orange-500" />}
                                  {control.accessType === "contact" && <UserCheck className="h-5 w-5 text-purple-500" />}
                                  {control.accessType === "parking" && <Car className="h-5 w-5 text-gray-500" />}
                                  {(control.accessType === "key_location" || control.accessType === "other") && <Info className="h-5 w-5 text-muted-foreground" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm">{getAccessTypeLabel(control.accessType)}</div>
                                  <div className="text-sm">
                                    {control.accessName && <span className="text-muted-foreground mr-1">{control.accessName}:</span>}
                                    <code className="bg-background px-2 py-0.5 rounded text-primary font-mono">{control.accessValue}</code>
                                  </div>
                                  {control.notes && (
                                    <div className="text-xs text-muted-foreground mt-1">{control.notes}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              {language === "es" ? "Sin credenciales registradas" : "No credentials registered"}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                    );
                  })()}

                  {selectedAppointment.tourStops && selectedAppointment.tourStops.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {language === "es" ? "Propiedades del Tour" : "Tour Properties"}
                      </h4>
                      <div className="space-y-3">
                        {selectedAppointment.tourStops.map((stop, i) => {
                          const stopUnitInfo = getUnitInfo(stop.unitId);
                          const stopAccessControls = selectedUnitAccessControls[stop.unitId] || [];
                          return (
                            <div key={stop.id} className="bg-muted/50 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs">{i + 1}</Badge>
                                <span className="font-medium">{format(new Date(stop.scheduledTime), "HH:mm")}</span>
                              </div>
                              <div className="pl-8 space-y-2">
                                {stopUnitInfo?.condominiumName && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Building className="h-4 w-4 text-primary" />
                                    <span>{stopUnitInfo.condominiumName}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                  <Home className="h-4 w-4 text-primary" />
                                  <span>{stopUnitInfo?.unitNumber || stopUnitInfo?.name || stop.unitId}</span>
                                </div>
                                {stopAccessControls.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                                    {stopAccessControls.map((control) => (
                                      <div key={control.id} className="flex items-center gap-2 text-xs">
                                        {control.accessType === "wifi" && <Wifi className="h-3 w-3 text-blue-500" />}
                                        {control.accessType === "door_code" && <Lock className="h-3 w-3 text-green-500" />}
                                        {control.accessType === "lockbox" && <Key className="h-3 w-3 text-orange-500" />}
                                        {control.accessType === "contact" && <UserCheck className="h-3 w-3 text-purple-500" />}
                                        {control.accessType === "parking" && <Car className="h-3 w-3 text-gray-500" />}
                                        {(control.accessType === "key_location" || control.accessType === "other") && <Info className="h-3 w-3 text-muted-foreground" />}
                                        <span className="text-muted-foreground">{getAccessTypeLabel(control.accessType)}:</span>
                                        <code className="bg-background px-1 rounded">{control.accessValue}</code>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t p-4 bg-muted/30 flex flex-wrap gap-2 justify-end">
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
                      setAppointmentForFeedback(selectedAppointment);
                      setFeedbackDialogOpen(true);
                      setSelectedAppointment(null);
                    }}
                    data-testid="button-complete"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {language === "es" ? "Completar con feedback" : "Complete with feedback"}
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
            </div>
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

      {/* Feedback Modal */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Feedback de la cita" : "Appointment Feedback"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Registra el resultado y notas de esta cita" 
                : "Record the outcome and notes for this appointment"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === "es" ? "Resultado" : "Outcome"}</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "liked", label: language === "es" ? "Le gustó" : "Liked", icon: "👍" },
                  { value: "disliked", label: language === "es" ? "No le gustó" : "Disliked", icon: "👎" },
                  { value: "will_make_offer", label: language === "es" ? "Hará oferta" : "Will make offer", icon: "💰" },
                  { value: "needs_followup", label: language === "es" ? "Necesita seguimiento" : "Needs follow-up", icon: "📞" },
                  { value: "rescheduled", label: language === "es" ? "Reagendada" : "Rescheduled", icon: "📅" },
                  { value: "no_show", label: language === "es" ? "No se presentó" : "No show", icon: "❌" },
                  { value: "not_qualified", label: language === "es" ? "No calificado" : "Not qualified", icon: "⚠️" },
                  { value: "other", label: language === "es" ? "Otro" : "Other", icon: "📝" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={feedbackData.outcome === option.value ? "default" : "outline"}
                    className="justify-start h-auto py-2 px-3"
                    onClick={() => setFeedbackData(prev => ({ ...prev, outcome: option.value }))}
                    data-testid={`button-feedback-${option.value}`}
                  >
                    <span className="mr-2">{option.icon}</span>
                    <span className="text-sm">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === "es" ? "Ajuste de rating del cliente" : "Client rating adjustment"}</Label>
              <div className="flex gap-2">
                {[
                  { value: 1, label: "+1", color: "text-green-600" },
                  { value: 0, label: "0", color: "text-muted-foreground" },
                  { value: -1, label: "-1", color: "text-red-600" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={feedbackData.ratingDelta === option.value ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setFeedbackData(prev => ({ ...prev, ratingDelta: option.value }))}
                    data-testid={`button-rating-${option.value > 0 ? 'plus' : option.value < 0 ? 'minus' : 'neutral'}`}
                  >
                    <span className={feedbackData.ratingDelta === option.value ? "" : option.color}>
                      {option.label}
                    </span>
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "es" 
                  ? "Ajusta el puntaje del cliente basado en su comportamiento durante la cita"
                  : "Adjust client score based on their behavior during the appointment"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-notes">
                {language === "es" ? "Notas del concierge" : "Concierge notes"}
              </Label>
              <Textarea
                id="feedback-notes"
                placeholder={language === "es" 
                  ? "Detalles sobre la visita, interés del cliente, próximos pasos..." 
                  : "Details about the visit, client interest, next steps..."}
                value={feedbackData.notes}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                data-testid="textarea-feedback-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setFeedbackDialogOpen(false);
                setAppointmentForFeedback(null);
                setFeedbackData({ outcome: "", notes: "", ratingDelta: 0 });
              }}
              data-testid="button-cancel-feedback"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={() => {
                if (appointmentForFeedback && feedbackData.outcome) {
                  submitFeedbackMutation.mutate({
                    id: appointmentForFeedback.id,
                    outcome: feedbackData.outcome,
                    ratingDelta: feedbackData.ratingDelta,
                    notes: feedbackData.notes,
                  });
                }
              }}
              disabled={!feedbackData.outcome || submitFeedbackMutation.isPending}
              data-testid="button-submit-feedback"
            >
              {submitFeedbackMutation.isPending 
                ? (language === "es" ? "Guardando..." : "Saving...")
                : (language === "es" ? "Guardar feedback" : "Save feedback")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
