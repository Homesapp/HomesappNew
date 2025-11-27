import { useState, useEffect, useLayoutEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TableLoading } from "@/components/ui/table-loading";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Wrench,
  Plus,
  AlertCircle,
  AlertTriangle,
  Filter,
  Search,
  Clock,
  Home,
  Eye,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  LayoutGrid,
  Table as TableIcon,
  X,
  Building2,
  Tag,
  User,
  Calendar as CalendarIcon,
  MoreVertical,
  Pencil,
  Upload,
  Image as ImageIcon,
  Trash2,
  FileText,
  MapPin,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalMaintenanceTicket, ExternalCondominium, ExternalUnit, ExternalWorkerAssignment, ExternalMaintenancePhoto } from "@shared/schema";
import { insertExternalMaintenanceTicketSchema } from "@shared/schema";
import { z } from "zod";
import { format, toZonedTime, fromZonedTime } from "date-fns-tz";
import { startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";
import ExternalQuotationsTab from "@/components/ExternalQuotationsTab";
import ExternalMaintenanceWorkers from "@/pages/ExternalMaintenanceWorkers";

// Form-specific schema - agencyId added after validation, scheduledDate as string
const maintenanceFormSchema = z.object({
  unitId: z.string().min(1, "Unit is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["plumbing", "electrical", "appliances", "hvac", "general", "emergency", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  scheduledDate: z.string().optional(), // ISO string, converted to Date on submit
  assignedTo: z.string().optional(),
  reportedBy: z.string().optional(), // Who reported the issue
  estimatedCost: z.string().optional(), // Estimated cost for the repair
  notes: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>;

// Edit-specific schema - expanded editable fields
const editMaintenanceTicketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["plumbing", "electrical", "appliances", "hvac", "general", "emergency", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  reportedBy: z.string().optional(),
  estimatedCost: z.string().optional(),
  actualCost: z.string().optional(),
  notes: z.string().optional(),
});

type EditMaintenanceFormData = z.infer<typeof editMaintenanceTicketSchema>;

const CANCUN_TIMEZONE = "America/Cancun";

// Schedule state that never allows undefined to guarantee calendar visibility
type ScheduleState = {
  date: Date;
  time: string;
};

// Helper to get default schedule (tomorrow at 9:00 AM)
function getDefaultSchedule(): ScheduleState {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return { date: tomorrow, time: "09:00" };
}

// Helper to convert ScheduleState to ISO string for React Hook Form
function scheduleToISOString(schedule: ScheduleState): string {
  const timeToUse = schedule.time && schedule.time.trim() !== '' ? schedule.time : '09:00';
  const [hours, minutes] = timeToUse.split(':').map(Number);
  const combinedDate = new Date(schedule.date);
  combinedDate.setHours(hours, minutes, 0, 0);
  const utcDate = fromZonedTime(combinedDate, CANCUN_TIMEZONE);
  return utcDate.toISOString();
}

const statusColors: Record<string, { bg: string; label: { es: string; en: string } }> = {
  open: {
    bg: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    label: { es: "Abierto", en: "Open" }
  },
  in_progress: {
    bg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    label: { es: "En Progreso", en: "In Progress" }
  },
  resolved: {
    bg: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    label: { es: "Resuelto", en: "Resolved" }
  },
  closed: {
    bg: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300",
    label: { es: "Cerrado", en: "Closed" }
  },
  on_hold: {
    bg: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    label: { es: "En Espera", en: "On Hold" }
  },
};

const priorityColors: Record<string, { bg: string; label: { es: string; en: string } }> = {
  low: {
    bg: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300",
    label: { es: "Baja", en: "Low" }
  },
  medium: {
    bg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    label: { es: "Media", en: "Medium" }
  },
  high: {
    bg: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    label: { es: "Alta", en: "High" }
  },
  urgent: {
    bg: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    label: { es: "Urgente", en: "Urgent" }
  },
};

const categoryLabels: Record<string, { es: string; en: string }> = {
  plumbing: { es: "Plomería", en: "Plumbing" },
  electrical: { es: "Eléctrico", en: "Electrical" },
  appliances: { es: "Electrodomésticos", en: "Appliances" },
  hvac: { es: "Climatización", en: "HVAC" },
  general: { es: "General", en: "General" },
  emergency: { es: "Emergencia", en: "Emergency" },
  other: { es: "Otro", en: "Other" },
};

export default function ExternalMaintenance() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useMobile();
  const [showDialog, setShowDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTicket, setEditingTicket] = useState<ExternalMaintenanceTicket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeServiceTab, setActiveServiceTab] = useState<"maintenance" | "cleaning">("maintenance");
  const [condominiumFilter, setCondominiumFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [formCondominiumId, setFormCondominiumId] = useState<string>("");
  // Schedule state that guarantees calendar visibility
  const [schedule, setSchedule] = useState<ScheduleState>(getDefaultSchedule());
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // View mode states
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [manualViewModeOverride, setManualViewModeOverride] = useState(false);
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  
  // Pagination and sorting states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string>('created');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pageTransition, setPageTransition] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Photo upload states
  const [ticketPhotos, setTicketPhotos] = useState<ExternalMaintenancePhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhotoPhase, setSelectedPhotoPhase] = useState<"before" | "during" | "after" | "other">("before");
  const [editingPhotoPhase, setEditingPhotoPhase] = useState<{ photoId: string; currentPhase: string } | null>(null);
  const [showPhotoPhaseDialog, setShowPhotoPhaseDialog] = useState(false);
  
  // Closure report states
  const [showClosureDialog, setShowClosureDialog] = useState(false);
  const [closingTicket, setClosingTicket] = useState<ExternalMaintenanceTicket | null>(null);
  const [closureWorkNotes, setClosureWorkNotes] = useState("");
  const [closureInvoiceDate, setClosureInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [closureFinalAmount, setClosureFinalAmount] = useState("");
  const [closureApplyAdminFee, setClosureApplyAdminFee] = useState(true);
  const [closureAfterPhotos, setClosureAfterPhotos] = useState<string[]>([]);
  
  // Biweekly period navigation states
  const now = new Date();
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1); // 1-based
  const [periodIndex, setPeriodIndex] = useState(now.getDate() <= 15 ? 1 : 2);
  
  // Navigate to previous biweekly period
  const goToPreviousPeriod = () => {
    if (periodIndex === 2) {
      setPeriodIndex(1);
    } else {
      // Move to previous month, second period
      const newMonth = periodMonth === 1 ? 12 : periodMonth - 1;
      const newYear = periodMonth === 1 ? periodYear - 1 : periodYear;
      setPeriodMonth(newMonth);
      setPeriodYear(newYear);
      setPeriodIndex(2);
    }
  };
  
  // Navigate to next biweekly period
  const goToNextPeriod = () => {
    if (periodIndex === 1) {
      setPeriodIndex(2);
    } else {
      // Move to next month, first period
      const newMonth = periodMonth === 12 ? 1 : periodMonth + 1;
      const newYear = periodMonth === 12 ? periodYear + 1 : periodYear;
      setPeriodMonth(newMonth);
      setPeriodYear(newYear);
      setPeriodIndex(1);
    }
  };
  
  // Auto-switch view mode on genuine breakpoint transitions
  useEffect(() => {
    if (isMobile !== prevIsMobile) {
      setPrevIsMobile(isMobile);
      
      if (!manualViewModeOverride) {
        const preferredMode = isMobile ? "cards" : "table";
        setViewMode(preferredMode);
      }
    }
  }, [isMobile, prevIsMobile, manualViewModeOverride]);

  // Debounce search term to avoid excessive server requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, priorityFilter, categoryFilter, condominiumFilter, dateFilter]);

  // Server-side paginated query for tickets
  type PaginatedResponse = {
    data: ExternalMaintenanceTicket[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };

  // Build query params for the URL
  const ticketsQueryParams = new URLSearchParams();
  ticketsQueryParams.set('page', String(currentPage));
  ticketsQueryParams.set('pageSize', String(itemsPerPage));
  if (debouncedSearch) ticketsQueryParams.set('search', debouncedSearch);
  if (statusFilter !== 'all') ticketsQueryParams.set('status', statusFilter);
  if (priorityFilter !== 'all') ticketsQueryParams.set('priority', priorityFilter);
  // Filter by active service tab - tab-level filtering takes precedence over category filter
  if (activeServiceTab === "cleaning") {
    // Cleaning tab: ONLY show cleaning category, ignore categoryFilter
    ticketsQueryParams.set('category', 'cleaning');
  } else if (activeServiceTab === "maintenance") {
    // Maintenance tab: ALWAYS exclude cleaning category
    ticketsQueryParams.set('excludeCategories', 'cleaning');
    // Apply additional category filter if selected (except cleaning which is excluded)
    if (categoryFilter !== 'all' && categoryFilter !== 'cleaning') {
      ticketsQueryParams.set('category', categoryFilter);
    }
  } else {
    // Default: apply category filter as normal
    if (categoryFilter !== 'all') ticketsQueryParams.set('category', categoryFilter);
  }
  if (condominiumFilter !== 'all') ticketsQueryParams.set('condominiumId', condominiumFilter);
  if (dateFilter !== 'all') ticketsQueryParams.set('dateFilter', dateFilter);
  ticketsQueryParams.set('sortField', sortColumn);
  ticketsQueryParams.set('sortOrder', sortDirection);

  const ticketsUrl = `/api/external-tickets?${ticketsQueryParams.toString()}`;

  const { data: ticketsResponse, isLoading: ticketsLoading, isFetching } = useQuery<PaginatedResponse>({
    queryKey: [ticketsUrl],
  });

  const tickets = ticketsResponse?.data || [];
  const totalItems = ticketsResponse?.total || 0;
  const serverTotalPages = ticketsResponse?.totalPages || 1;

  // Show page transition state when fetching but already have data
  useEffect(() => {
    if (isFetching && ticketsResponse) {
      setPageTransition(true);
    } else {
      setPageTransition(false);
    }
  }, [isFetching, ticketsResponse]);

  // Lightweight condominiums for dropdowns (only id+name)
  const { data: condominiums } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['/api/external-condominiums-for-filters'],
  });

  // Lightweight units for dropdowns
  const { data: units } = useQuery<{ id: string; unitNumber: string; condominiumId: string }[]>({
    queryKey: ['/api/external-units-for-filters'],
  });

  const { data: agencyUsers } = useQuery<any[]>({
    queryKey: ['/api/external-agency-users'],
  });

  const { data: workerAssignments } = useQuery<ExternalWorkerAssignment[]>({
    queryKey: ['/api/external-worker-assignments'],
  });

  // Biweekly stats query
  type BiweeklyStatsResponse = {
    period: {
      year: number;
      month: number;
      biweekly: number;
      startDate: string;
      endDate: string;
      label: string;
    };
    stats: {
      total: number;
      open: number;
      resolved: number;
      actualCost: number;
      commission: number;
      totalCharge: number;
      paidTotal: number;
    };
  };

  const biweeklyStatsUrl = `/api/external-tickets/stats/biweekly?year=${periodYear}&month=${periodMonth}&period=${periodIndex}`;
  const { data: biweeklyStats } = useQuery<BiweeklyStatsResponse>({
    queryKey: ['/api/external-tickets/stats/biweekly', periodYear, periodMonth, periodIndex],
    queryFn: () => fetch(biweeklyStatsUrl, { credentials: 'include' }).then(res => res.json()),
  });

  const maintenanceWorkers = agencyUsers?.filter(u => 
    u.role === 'external_agency_maintenance' && u.maintenanceSpecialty
  ) || [];

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      unitId: "",
      title: "",
      description: "",
      category: "other",
      priority: "medium",
      status: "open",
      scheduledDate: scheduleToISOString(getDefaultSchedule()),
      assignedTo: undefined,
      reportedBy: "",
      estimatedCost: "",
      notes: "",
    },
  });

  const editForm = useForm<EditMaintenanceFormData>({
    resolver: zodResolver(editMaintenanceTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "other",
      priority: "medium",
      reportedBy: "",
      estimatedCost: "",
      actualCost: "",
      notes: "",
    },
  });

  // Initialize form with default schedule on mount
  useEffect(() => {
    const defaultSchedule = getDefaultSchedule();
    setSchedule(defaultSchedule);
    form.setValue('scheduledDate', scheduleToISOString(defaultSchedule));
  }, []);

  // Populate edit form when editingTicket changes
  useEffect(() => {
    if (editingTicket) {
      editForm.reset({
        title: editingTicket.title,
        description: editingTicket.description,
        category: editingTicket.category,
        priority: editingTicket.priority,
        reportedBy: editingTicket.reportedBy || "",
        estimatedCost: editingTicket.estimatedCost || "",
        actualCost: editingTicket.actualCost || "",
        notes: editingTicket.notes || "",
      });
    }
  }, [editingTicket]);

  const handleSubmit = form.handleSubmit(
    (data) => {
      // scheduledDate is already set via form.setValue in calendar/time onChange
      // Just validate it exists before submission
      if (!data.scheduledDate) {
        form.setError('scheduledDate', {
          message: language === "es"
            ? "Por favor selecciona una fecha de programación para que el ticket aparezca en el calendario"
            : "Please select a scheduled date so the ticket appears in the calendar"
        });
        return;
      }

      createMutation.mutate(data);
    },
    (errors) => {
      // Log validation errors for debugging
      console.error('Form validation errors:', errors);
    }
  );

  const createMutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      const selectedUnit = units?.find(u => u.id === data.unitId);
      if (!selectedUnit?.agencyId) {
        throw new Error(language === "es" 
          ? "No se pudo obtener la información de la unidad" 
          : "Could not get unit information"
        );
      }

      // Convert scheduledDate from ISO string to Date for backend
      // Convert string cost values to numbers or undefined
      const payload = {
        ...data,
        agencyId: selectedUnit.agencyId,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : undefined,
        reportedBy: data.reportedBy?.trim() || undefined,
      };

      return await apiRequest('POST', '/api/external-tickets', payload);
    },
    onSuccess: () => {
      // Invalidate all queries that start with /api/external-tickets
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/external-tickets');
        }
      });
      setShowDialog(false);
      setFormCondominiumId("");
      // Reset schedule and sync with form
      const defaultSchedule = getDefaultSchedule();
      setSchedule(defaultSchedule);
      form.reset({
        unitId: "",
        title: "",
        description: "",
        category: "other",
        priority: "medium",
        status: "open",
        scheduledDate: scheduleToISOString(defaultSchedule),
        assignedTo: undefined,
        reportedBy: "",
        estimatedCost: "",
        notes: "",
      });
      toast({
        title: language === "es" ? "Ticket creado" : "Ticket created",
        description: language === "es" ? "El ticket de mantenimiento se creó exitosamente" : "Maintenance ticket created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      return await apiRequest('PATCH', `/api/external-tickets/${ticketId}/status`, { status });
    },
    onSuccess: () => {
      // Invalidate all queries that start with /api/external-tickets
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/external-tickets');
        }
      });
      toast({
        title: language === "es" ? "Estado actualizado" : "Status updated",
        description: language === "es" ? "El estado del ticket se actualizó exitosamente" : "Ticket status updated successfully",
      });
    },
    onError: (error: any) => {
      let errorMessage = language === "es" ? "No se pudo actualizar el estado" : "Failed to update status";
      
      if (error?.message && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.statusText) {
        errorMessage = error.statusText;
      }
      
      toast({
        title: language === "es" ? "Error" : "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation for closing ticket with full report
  const closeWithReportMutation = useMutation({
    mutationFn: async ({ 
      ticketId, 
      closureWorkNotes, 
      invoiceDate, 
      finalChargeAmount, 
      applyAdminFee, 
      afterWorkPhotos 
    }: { 
      ticketId: string; 
      closureWorkNotes: string;
      invoiceDate: string;
      finalChargeAmount: string;
      applyAdminFee: boolean;
      afterWorkPhotos: string[];
    }) => {
      return await apiRequest('POST', `/api/external-tickets/${ticketId}/close-with-report`, {
        closureWorkNotes,
        invoiceDate,
        finalChargeAmount,
        applyAdminFee,
        afterWorkPhotos,
        completionNotes: closureWorkNotes
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && (
            key.startsWith('/api/external-tickets') || 
            key.startsWith('/api/external/accounting')
          );
        }
      });
      setShowClosureDialog(false);
      setClosingTicket(null);
      setClosureWorkNotes("");
      setClosureFinalAmount("");
      setClosureApplyAdminFee(true);
      setClosureAfterPhotos([]);
      
      const message = data?.transactionId 
        ? (language === "es" ? "Ticket cerrado y enviado a contabilidad" : "Ticket closed and sent to accounting")
        : (language === "es" ? "Ticket cerrado exitosamente" : "Ticket closed successfully");
      
      toast({
        title: language === "es" ? "Ticket cerrado" : "Ticket closed",
        description: message,
      });
    },
    onError: (error: any) => {
      let errorMessage = language === "es" ? "No se pudo cerrar el ticket" : "Failed to close ticket";
      if (error?.message) errorMessage = error.message;
      
      toast({
        title: language === "es" ? "Error" : "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, data }: { ticketId: string; data: EditMaintenanceFormData }) => {
      // Convert string values to proper types for backend
      const payload = {
        ...data,
        reportedBy: data.reportedBy?.trim() || undefined,
        estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : undefined,
        actualCost: data.actualCost ? parseFloat(data.actualCost) : undefined,
      };
      return await apiRequest('PATCH', `/api/external-tickets/${ticketId}`, payload);
    },
    onSuccess: () => {
      // Invalidate all queries that start with /api/external-tickets
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/external-tickets');
        }
      });
      setShowEditDialog(false);
      setEditingTicket(null);
      editForm.reset();
      toast({
        title: language === "es" ? "Ticket actualizado" : "Ticket updated",
        description: language === "es" ? "El ticket se actualizó exitosamente" : "Ticket updated successfully",
      });
    },
    onError: (error: any) => {
      let errorMessage = language === "es" ? "No se pudo actualizar el ticket" : "Failed to update ticket";
      
      if (error?.message && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.statusText) {
        errorMessage = error.statusText;
      }
      
      toast({
        title: language === "es" ? "Error" : "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const filteredUnitsForForm = formCondominiumId 
    ? (units ?? []).filter(u => u.condominiumId === formCondominiumId)
    : [];

  const getAvailableWorkersForLocation = (unitId: string | undefined) => {
    if (!unitId) return [];
    const unit = units?.find(u => u.id === unitId);
    if (!unit) return [];
    
    const assignedWorkerIds = workerAssignments
      ?.filter(a => (a.unitId === unitId) || (a.condominiumId === unit.condominiumId && !a.unitId))
      .map(a => a.userId) || [];
    
    if (assignedWorkerIds.length > 0) {
      return maintenanceWorkers.filter(w => assignedWorkerIds.includes(w.id));
    }
    
    return maintenanceWorkers;
  };

  const getUnitInfo = (unitId: string) => {
    const unit = units?.find(u => u.id === unitId);
    if (!unit) return null;
    const condo = condominiums?.find(c => c.id === unit.condominiumId);
    return { unit, condo };
  };

  const getAssignedUserName = (userId: string | null) => {
    if (!userId) return null;
    const user = agencyUsers?.find(u => u.id === userId);
    if (!user) return null;
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  };

  // Helper to translate photo phases
  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      before: { es: 'Antes', en: 'Before' },
      during: { es: 'Durante', en: 'During' },
      after: { es: 'Después', en: 'After' },
      other: { es: 'Otro', en: 'Other' },
    };
    return language === 'es' ? labels[phase]?.es || phase : labels[phase]?.en || phase;
  };

  // Photo management functions
  const loadPhotos = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/external-tickets/${ticketId}/photos`, { credentials: 'include' });
      if (response.ok) {
        const photos = await response.json();
        setTicketPhotos(photos);
      }
    } catch (error) {
      console.error("Error loading photos:", error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingTicket || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('photo', file);
    
    setUploadingPhoto(true);
    try {
      // First upload the file
      const uploadResponse = await fetch('/api/upload/maintenance-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload photo');
      }
      
      const { url } = await uploadResponse.json();
      
      // Then create the photo record
      const photoData = {
        ticketId: editingTicket.id,
        storageKey: url,
        phase: selectedPhotoPhase,
        uploadedBy: user?.id || '',
      };
      
      const createResponse = await apiRequest('POST', `/api/external-tickets/${editingTicket.id}/photos`, photoData);
      
      // Reload photos
      await loadPhotos(editingTicket.id);
      
      toast({
        title: language === "es" ? "Foto subida" : "Photo uploaded",
        description: language === "es" ? "La foto se subió exitosamente" : "Photo uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error?.message || (language === "es" ? "No se pudo subir la foto" : "Failed to upload photo"),
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await apiRequest('DELETE', `/api/external-maintenance-photos/${photoId}`, undefined);
      
      // Remove from local state
      setTicketPhotos(prev => prev.filter(p => p.id !== photoId));
      
      toast({
        title: language === "es" ? "Foto eliminada" : "Photo deleted",
        description: language === "es" ? "La foto se eliminó exitosamente" : "Photo deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error?.message || (language === "es" ? "No se pudo eliminar la foto" : "Failed to delete photo"),
        variant: "destructive",
      });
    }
  };

  const handleUpdatePhotoPhase = async (photoId: string, newPhase: string) => {
    try {
      await apiRequest('PATCH', `/api/external-maintenance-photos/${photoId}`, { phase: newPhase });
      
      // Update local state
      setTicketPhotos(prev => prev.map(p => p.id === photoId ? { ...p, phase: newPhase as any } : p));
      setEditingPhotoPhase(null);
      setShowPhotoPhaseDialog(false);
      
      toast({
        title: language === "es" ? "Fase actualizada" : "Phase updated",
        description: language === "es" ? "La fase de la foto se actualizó exitosamente" : "Photo phase updated successfully",
      });
    } catch (error: any) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error?.message || (language === "es" ? "No se pudo actualizar la fase" : "Failed to update phase"),
        variant: "destructive",
      });
    }
  };

  // Load photos when edit dialog opens
  useEffect(() => {
    if (showEditDialog && editingTicket) {
      loadPhotos(editingTicket.id);
      // Reset photo phase to default when opening ticket
      setSelectedPhotoPhase("before");
      setEditingPhotoPhase(null);
      setShowPhotoPhaseDialog(false);
    } else if (!showEditDialog) {
      setTicketPhotos([]);
      // Reset photo phase when closing dialog
      setSelectedPhotoPhase("before");
      setEditingPhotoPhase(null);
      setShowPhotoPhaseDialog(false);
    }
  }, [showEditDialog, editingTicket]);

  // Data comes pre-filtered from server, no client-side filtering needed
  const filteredTickets = tickets || [];

  // Calculate metrics from current page data (server handles filtering)
  // Note: For accurate totals across all pages, consider a separate stats endpoint
  const stats = {
    total: totalItems, // Total matching items from server
    open: filteredTickets.filter(t => t.status === 'open').length,
    inProgress: filteredTickets.filter(t => t.status === 'in_progress').length,
    resolved: filteredTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    totalCost: filteredTickets.reduce((sum, t) => sum + parseFloat(t.actualCost || '0'), 0),
    estimatedCost: filteredTickets.reduce((sum, t) => sum + parseFloat(t.estimatedCost || '0'), 0),
  };

  // Data comes pre-sorted from server, no client-side sorting needed
  const sortedTickets = filteredTickets;

  // Server-side pagination - data is already paginated
  const totalPages = serverTotalPages;
  const paginatedTickets = tickets;

  // Clamp page when server reports fewer pages than current
  useLayoutEffect(() => {
    if (currentPage > serverTotalPages && serverTotalPages > 0) {
      setCurrentPage(serverTotalPages);
    }
  }, [currentPage, serverTotalPages]);

  // Handle sort column click
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="ml-1 h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="ml-1 h-4 w-4" />
      : <ChevronDown className="ml-1 h-4 w-4" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const t = language === 'es' ? {
    title: 'Mantenimiento',
    subtitle: 'Gestiona tickets de mantenimiento y servicios',
    newTicket: 'Nuevo Ticket',
    totalJobs: 'Total Trabajos',
    open: 'Total Abiertos',
    resolved: 'Resueltos',
    actualCost: 'Costo Real',
    commissions: 'Comisiones (15%)',
    totalCharge: 'Total a Cobrar',
    paidTotal: 'Total Pagado',
    search: 'Buscar por título, descripción o unidad...',
    filters: 'Filtros',
    today: 'HOY',
    status: 'Estado',
    priority: 'Prioridad',
    category: 'Categoría',
    condominium: 'Condominio',
    all: 'Todos',
    unit: 'Unidad',
    assigned: 'Asignado',
    created: 'Creado',
    scheduled: 'Programado',
    actions: 'Acciones',
    view: 'Ver',
    noTickets: 'No se encontraron tickets',
    noTicketsDesc: 'Crea un nuevo ticket para empezar',
    createTicket: 'Crear Ticket de Mantenimiento',
    selectCondominium: 'Seleccionar Condominio',
    selectUnit: 'Seleccionar Unidad',
    ticketTitle: 'Título del Ticket',
    description: 'Descripción',
    selectCategory: 'Seleccionar Categoría',
    selectPriority: 'Seleccionar Prioridad',
    selectWorker: 'Seleccionar Trabajador (Opcional)',
    scheduleDate: 'Fecha Programada (Opcional)',
    scheduleTime: 'Hora',
    notes: 'Notas Adicionales (Opcional)',
    cancel: 'Cancelar',
    create: 'Crear Ticket',
    creating: 'Creando...',
  } : {
    title: 'Maintenance',
    subtitle: 'Manage maintenance tickets and services',
    newTicket: 'New Ticket',
    totalJobs: 'Total Jobs',
    open: 'Total Open',
    resolved: 'Resolved',
    actualCost: 'Actual Cost',
    commissions: 'Commissions (15%)',
    totalCharge: 'Total Charge',
    paidTotal: 'Total Paid',
    search: 'Search by title, description or unit...',
    filters: 'Filters',
    today: 'TODAY',
    status: 'Status',
    priority: 'Priority',
    category: 'Category',
    condominium: 'Condominium',
    all: 'All',
    unit: 'Unit',
    assigned: 'Assigned',
    created: 'Created',
    scheduled: 'Scheduled',
    actions: 'Actions',
    view: 'View',
    noTickets: 'No tickets found',
    noTicketsDesc: 'Create a new ticket to get started',
    createTicket: 'Create Maintenance Ticket',
    selectCondominium: 'Select Condominium',
    selectUnit: 'Select Unit',
    ticketTitle: 'Ticket Title',
    description: 'Description',
    selectCategory: 'Select Category',
    selectPriority: 'Select Priority',
    selectWorker: 'Select Worker (Optional)',
    scheduleDate: 'Schedule Date (Optional)',
    scheduleTime: 'Time',
    notes: 'Additional Notes (Optional)',
    cancel: 'Cancel',
    create: 'Create Ticket',
    creating: 'Creating...',
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with New Ticket Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
      </div>
      {/* Tabs for Maintenance, Cleaning, Quotations and Assignments */}
      <Tabs defaultValue="maintenance" className="w-full" onValueChange={(value) => { if (value === "maintenance" || value === "cleaning") setActiveServiceTab(value); }}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="maintenance" data-testid="tab-maintenance">
            {language === 'es' ? 'Mantenimientos' : 'Maintenance'}
          </TabsTrigger>
          <TabsTrigger value="cleaning" data-testid="tab-cleaning">
            {language === 'es' ? 'Limpieza' : 'Cleaning'}
          </TabsTrigger>
          <TabsTrigger value="quotations" data-testid="tab-quotations">
            {language === 'es' ? 'Cotizaciones' : 'Quotations'}
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            {language === 'es' ? 'Asignaciones' : 'Assignments'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="space-y-6 mt-6">
          {/* Tickets Header with Action */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{language === 'es' ? 'Mantenimientos' : 'Maintenance'}</h2>
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
            <Button onClick={() => setShowDialog(true)} data-testid="button-new-ticket">
              <Plus className="mr-2 h-4 w-4" />
              {t.newTicket}
            </Button>
          </div>

      {/* Biweekly Period Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousPeriod}
          data-testid="button-prev-period"
        >
          <ChevronDown className="h-4 w-4 rotate-90" />
        </Button>
        <div className="flex items-center gap-2 text-sm px-3 py-1 bg-muted rounded-md">
          <CalendarIcon className="h-4 w-4" />
          <span className="font-medium">
            {biweeklyStats?.period?.label || `${periodIndex === 1 ? '1ra' : '2da'} Quincena`}
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextPeriod}
          data-testid="button-next-period"
        >
          <ChevronDown className="h-4 w-4 -rotate-90" />
        </Button>
      </div>

      {/* Metrics - Biweekly Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalJobs}</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total">{biweeklyStats?.stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.open}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="text-open">{biweeklyStats?.stats?.open || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.resolved}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-resolved">{biweeklyStats?.stats?.resolved || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.actualCost}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold" data-testid="text-actual-cost">{formatCurrency(biweeklyStats?.stats?.actualCost || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.commissions}</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600" data-testid="text-commissions">{formatCurrency(biweeklyStats?.stats?.commission || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalCharge}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600" data-testid="text-total-charge">{formatCurrency(biweeklyStats?.stats?.totalCharge || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.paidTotal}</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600" data-testid="text-paid-total">{formatCurrency(biweeklyStats?.stats?.paidTotal || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            {/* Filter Button with Popover */}
            <Popover open={filtersExpanded} onOpenChange={setFiltersExpanded}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="flex-shrink-0 relative"
                  data-testid="button-toggle-filters"
                >
                  <Filter className="h-4 w-4" />
                  {(statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" || condominiumFilter !== "all") && (
                    <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {[statusFilter !== "all", priorityFilter !== "all", categoryFilter !== "all", condominiumFilter !== "all"].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
            <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.status}</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={statusFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setStatusFilter("all");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-status-all"
                    >
                      {t.all}
                    </Button>
                    <Button
                      variant={statusFilter === "open" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setStatusFilter("open");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-status-open"
                    >
                      {statusColors.open.label[language]}
                    </Button>
                    <Button
                      variant={statusFilter === "in_progress" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setStatusFilter("in_progress");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-status-progress"
                    >
                      {statusColors.in_progress.label[language]}
                    </Button>
                    <Button
                      variant={statusFilter === "resolved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setStatusFilter("resolved");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-status-resolved"
                    >
                      {statusColors.resolved.label[language]}
                    </Button>
                    <Button
                      variant={statusFilter === "closed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setStatusFilter("closed");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-status-closed"
                    >
                      {statusColors.closed.label[language]}
                    </Button>
                    <Button
                      variant={statusFilter === "on_hold" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setStatusFilter("on_hold");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-status-hold"
                    >
                      {statusColors.on_hold.label[language]}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.priority}</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={priorityFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setPriorityFilter("all");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-priority-all"
                    >
                      {t.all}
                    </Button>
                    <Button
                      variant={priorityFilter === "low" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setPriorityFilter("low");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-priority-low"
                    >
                      {priorityColors.low.label[language]}
                    </Button>
                    <Button
                      variant={priorityFilter === "medium" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setPriorityFilter("medium");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-priority-medium"
                    >
                      {priorityColors.medium.label[language]}
                    </Button>
                    <Button
                      variant={priorityFilter === "high" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setPriorityFilter("high");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-priority-high"
                    >
                      {priorityColors.high.label[language]}
                    </Button>
                    <Button
                      variant={priorityFilter === "urgent" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setPriorityFilter("urgent");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-priority-urgent"
                    >
                      {priorityColors.urgent.label[language]}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.category}</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={categoryFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCategoryFilter("all");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-category-all"
                    >
                      {t.all}
                    </Button>
                    <Button
                      variant={categoryFilter === "plumbing" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCategoryFilter("plumbing");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-category-plumbing"
                    >
                      {categoryLabels.plumbing[language]}
                    </Button>
                    <Button
                      variant={categoryFilter === "electrical" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCategoryFilter("electrical");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-category-electrical"
                    >
                      {categoryLabels.electrical[language]}
                    </Button>
                    <Button
                      variant={categoryFilter === "appliances" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCategoryFilter("appliances");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-category-appliances"
                    >
                      {categoryLabels.appliances[language]}
                    </Button>
                    <Button
                      variant={categoryFilter === "hvac" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCategoryFilter("hvac");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-category-hvac"
                    >
                      {categoryLabels.hvac[language]}
                    </Button>
                    <Button
                      variant={categoryFilter === "general" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCategoryFilter("general");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-category-general"
                    >
                      {categoryLabels.general[language]}
                    </Button>
                    <Button
                      variant={categoryFilter === "emergency" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCategoryFilter("emergency");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-category-emergency"
                    >
                      {categoryLabels.emergency[language]}
                    </Button>
                    <Button
                      variant={categoryFilter === "other" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCategoryFilter("other");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-category-other"
                    >
                      {categoryLabels.other[language]}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.condominium}</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={condominiumFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCondominiumFilter("all");
                        setCurrentPage(1);
                      }}
                      data-testid="button-filter-condo-all"
                    >
                      {t.all}
                    </Button>
                    {condominiums?.map(condo => (
                      <Button
                        key={condo.id}
                        variant={condominiumFilter === condo.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setCondominiumFilter(condo.id);
                          setCurrentPage(1);
                        }}
                        data-testid={`button-filter-condo-${condo.id}`}
                      >
                        {condo.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setCategoryFilter("all");
                    setCondominiumFilter("all");
                    setCurrentPage(1);
                  }}
                  data-testid="button-clear-filters"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {language === 'es' ? 'Limpiar' : 'Clear'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* HOY Button - Filter Today's Scheduled Tickets */}
          <Button
            variant={dateFilter === "today" ? "default" : "outline"}
            className="flex-shrink-0"
            onClick={() => {
              setDateFilter(dateFilter === "today" ? "all" : "today");
              setCurrentPage(1);
            }}
            data-testid="button-today"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {t.today}
          </Button>
          
          {/* View Mode Toggles */}
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="icon"
            className="flex-shrink-0"
            onClick={() => {
              setViewMode("cards");
              setManualViewModeOverride(false);
            }}
            data-testid="button-view-cards"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            className="flex-shrink-0"
            onClick={() => {
              setViewMode("table");
              setManualViewModeOverride(true);
            }}
            data-testid="button-view-table"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets - Cards or Table */}
      {ticketsLoading && !ticketsResponse ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : pageTransition ? (
        <Card>
          <CardContent className="py-8">
            <TableLoading />
          </CardContent>
        </Card>
      ) : sortedTickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">{t.noTickets}</h3>
            <p className="text-sm text-muted-foreground">{t.noTicketsDesc}</p>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
            // Cards View
            <div className="p-6">
              <ExternalPaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(items) => {
                  setItemsPerPage(items);
                  setCurrentPage(1);
                }}
                language={language}
                testIdPrefix="cards"
              />

              <div className="grid gap-4 md:grid-cols-2">
                {paginatedTickets.map(ticket => {
                  const unitInfo = getUnitInfo(ticket.unitId);
                  const assignedName = getAssignedUserName(ticket.assignedTo);
                  const statusConfig = statusColors[ticket.status] || statusColors.open;
                  const priorityConfig = priorityColors[ticket.priority] || priorityColors.medium;

                  return (
                    <Link key={ticket.id} href={`/external/maintenance/${ticket.id}`}>
                      <Card 
                        className="hover-elevate cursor-pointer h-full"
                        data-testid={`card-ticket-${ticket.id}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base font-medium truncate">
                                {ticket.title}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={statusConfig.bg} data-testid={`badge-status-${ticket.id}`}>
                                  {statusConfig.label[language]}
                                </Badge>
                                <Badge className={priorityConfig.bg} data-testid={`badge-priority-${ticket.id}`}>
                                  {priorityConfig.label[language]}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium truncate">{unitInfo?.unit?.unitNumber || '-'}</span>
                              <span className="text-xs text-muted-foreground truncate">{unitInfo?.condo?.name}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{categoryLabels[ticket.category]?.[language] || ticket.category}</span>
                          </div>
                          
                          {assignedName && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{assignedName}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-xs">{language === 'es' ? 'Creado:' : 'Created:'} {format(new Date(ticket.createdAt), 'dd MMM yyyy', { locale: language === 'es' ? es : undefined })}</span>
                              <span className="text-xs">
                                {language === 'es' ? 'Actualizado:' : 'Updated:'} {ticket.updatedAt 
                                  ? format(new Date(ticket.updatedAt), 'dd MMM yyyy HH:mm', { locale: language === 'es' ? es : undefined })
                                  : (language === 'es' ? 'Sin actualizar' : 'Not updated')}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            // Table View
            <>
              <ExternalPaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(items) => {
                  setItemsPerPage(items);
                  setCurrentPage(1);
                }}
                language={language}
                testIdPrefix="table"
              />

              <Card>
                <div className="overflow-x-auto">
                  <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-10 px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('status')}
                          className="hover-elevate -ml-3 h-8"
                          data-testid="sort-status"
                        >
                          {t.status}
                          {renderSortIcon('status')}
                        </Button>
                      </TableHead>
                      <TableHead className="h-10 px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('priority')}
                          className="hover-elevate -ml-3 h-8"
                          data-testid="sort-priority"
                        >
                          {t.priority}
                          {renderSortIcon('priority')}
                        </Button>
                      </TableHead>
                      <TableHead className="h-10 px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('unit')}
                          className="hover-elevate -ml-3 h-8"
                          data-testid="sort-unit"
                        >
                          {t.unit}
                          {renderSortIcon('unit')}
                        </Button>
                      </TableHead>
                      <TableHead className="h-10 px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('category')}
                          className="hover-elevate -ml-3 h-8"
                          data-testid="sort-category"
                        >
                          {t.category}
                          {renderSortIcon('category')}
                        </Button>
                      </TableHead>
                      <TableHead className="h-10 px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('title')}
                          className="hover-elevate -ml-3 h-8"
                          data-testid="sort-title"
                        >
                          {t.ticketTitle}
                          {renderSortIcon('title')}
                        </Button>
                      </TableHead>
                      <TableHead className="h-10 px-3 text-right">
                        {language === 'es' ? 'Costo Real' : 'Actual Cost'}
                      </TableHead>
                      <TableHead className="h-10 px-3 text-right">
                        {language === 'es' ? 'Comisión' : 'Commission'}
                      </TableHead>
                      <TableHead className="h-10 px-3 text-right">
                        {language === 'es' ? 'Total' : 'Total'}
                      </TableHead>
                      <TableHead className="h-10 px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('updated')}
                          className="hover-elevate -ml-3 h-8"
                          data-testid="sort-updated"
                        >
                          {language === 'es' ? 'Última Act.' : 'Last Update'}
                          {renderSortIcon('updated')}
                        </Button>
                      </TableHead>
                      <TableHead className="h-10 px-3 text-right">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTickets.map(ticket => {
                    const unitInfo = getUnitInfo(ticket.unitId);
                    const assignedName = getAssignedUserName(ticket.assignedTo);
                    const statusConfig = statusColors[ticket.status] || statusColors.open;
                    const priorityConfig = priorityColors[ticket.priority] || priorityColors.medium;

                    return (
                      <TableRow 
                        key={ticket.id} 
                        data-testid={`row-ticket-${ticket.id}`} 
                        className="hover-elevate cursor-pointer"
                        onClick={() => setLocation(`/external/maintenance/${ticket.id}`)}
                      >
                        <TableCell className="px-3 py-3">
                          <Badge className={statusConfig.bg} data-testid={`badge-status-${ticket.id}`}>
                            {statusConfig.label[language]}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <Badge className={priorityConfig.bg} data-testid={`badge-priority-${ticket.id}`}>
                            {priorityConfig.label[language]}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <div className="flex flex-col">
                            <span>{unitInfo?.unit?.unitNumber || '-'}</span>
                            <span className="text-xs text-muted-foreground">{unitInfo?.condo?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <span>{categoryLabels[ticket.category]?.[language] || ticket.category}</span>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <span className="truncate max-w-xs">{ticket.title}</span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          {ticket.actualCost ? formatCurrency(parseFloat(ticket.actualCost)) : '-'}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          {ticket.actualCost ? formatCurrency(parseFloat(ticket.actualCost) * 0.15) : '-'}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right font-medium">
                          {ticket.actualCost ? formatCurrency(parseFloat(ticket.actualCost) * 1.15) : '-'}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <span className="text-muted-foreground">
                            {ticket.updatedAt 
                              ? format(new Date(ticket.updatedAt), 'dd MMM yyyy HH:mm', { locale: language === 'es' ? es : undefined })
                              : (language === 'es' ? 'Sin actualizar' : 'Not updated')}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1 justify-end">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTicket(ticket);
                                setShowEditDialog(true);
                              }}
                              disabled={updateStatusMutation.isPending || updateTicketMutation.isPending}
                              data-testid={`button-edit-${ticket.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  data-testid={`button-status-menu-${ticket.id}`}
                                  disabled={updateStatusMutation.isPending || updateTicketMutation.isPending}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {Object.entries(statusColors)
                                  .filter(([status]) => status !== ticket.status)
                                  .map(([status, config]) => (
                                    <DropdownMenuItem
                                      key={status}
                                      onClick={() => {
                                        if (status === 'closed') {
                                          setClosingTicket(ticket);
                                          // If ticket came from quotation, use base cost (without 15%)
                                          // because the estimatedCost already includes the admin fee
                                          const hasQuotation = ticket.sourceQuotationId || ticket.quotationId;
                                          const rawCost = ticket.estimatedCost || ticket.quotedTotal || '0';
                                          const baseCost = hasQuotation && rawCost ? (parseFloat(rawCost) / 1.15).toFixed(2) : rawCost;
                                          setClosureFinalAmount(baseCost);
                                          // Keep admin fee ON so total stays correct
                                          setClosureApplyAdminFee(true);
                                          setShowClosureDialog(true);
                                        } else if (!updateStatusMutation.isPending) {
                                          updateStatusMutation.mutate({ 
                                            ticketId: ticket.id, 
                                            status 
                                          });
                                        }
                                      }}
                                      disabled={updateStatusMutation.isPending || closeWithReportMutation.isPending}
                                      data-testid={`menu-status-${status}-${ticket.id}`}
                                    >
                                      {status === 'closed' 
                                        ? (language === 'es' ? 'Cerrar con Reporte' : 'Close with Report')
                                        : config.label[language]}
                                    </DropdownMenuItem>
                                  ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Link href={`/external/maintenance/${ticket.id}`}>
                              <Button size="icon" variant="ghost" data-testid={`button-view-${ticket.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
                </div>
              </Card>
            </>
          )}

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.createTicket}</DialogTitle>
            <DialogDescription>
              {language === 'es' 
                ? 'Complete la información del ticket de mantenimiento'
                : 'Fill in the maintenance ticket information'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section: Ubicación */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">
                    {language === 'es' ? 'Ubicación' : 'Location'}
                  </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="unitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.selectCondominium}</FormLabel>
                        <Select 
                          value={formCondominiumId} 
                          onValueChange={(value) => {
                            setFormCondominiumId(value);
                            field.onChange("");
                          }}
                        >
                          <SelectTrigger data-testid="select-form-condominium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {condominiums?.map(condo => (
                              <SelectItem key={condo.id} value={condo.id}>
                                {condo.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.selectUnit}</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                          disabled={!formCondominiumId}
                        >
                          <SelectTrigger data-testid="select-form-unit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredUnitsForForm.map(unit => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.unitNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Section: Detalles del Ticket */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">
                    {language === 'es' ? 'Detalles del Ticket' : 'Ticket Details'}
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.ticketTitle}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.description}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.selectCategory}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-form-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="plumbing">{categoryLabels.plumbing[language]}</SelectItem>
                            <SelectItem value="electrical">{categoryLabels.electrical[language]}</SelectItem>
                            <SelectItem value="appliances">{categoryLabels.appliances[language]}</SelectItem>
                            <SelectItem value="hvac">{categoryLabels.hvac[language]}</SelectItem>
                            <SelectItem value="general">{categoryLabels.general[language]}</SelectItem>
                            <SelectItem value="emergency">{categoryLabels.emergency[language]}</SelectItem>
                            <SelectItem value="other">{categoryLabels.other[language]}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.selectPriority}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-form-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">{priorityColors.low.label[language]}</SelectItem>
                            <SelectItem value="medium">{priorityColors.medium.label[language]}</SelectItem>
                            <SelectItem value="high">{priorityColors.high.label[language]}</SelectItem>
                            <SelectItem value="urgent">{priorityColors.urgent.label[language]}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Section: Asignación */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">
                    {language === 'es' ? 'Asignación' : 'Assignment'}
                  </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.selectWorker}</FormLabel>
                        <Select 
                          value={field.value || ""} 
                          onValueChange={field.onChange}
                          disabled={!form.watch("unitId")}
                        >
                          <SelectTrigger data-testid="select-form-worker">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableWorkersForLocation(form.watch("unitId")).map(worker => (
                              <SelectItem key={worker.id} value={worker.id}>
                                {`${worker.firstName || ''} ${worker.lastName || ''}`.trim() || worker.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reportedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "es" ? "Reportado por" : "Reported by"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            placeholder={language === "es" ? "Nombre de quien reporta" : "Name of reporter"}
                            data-testid="input-reported-by" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Section: Programación */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                      {language === 'es' ? 'Programación' : 'Scheduling'}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' 
                      ? 'Requerido para aparecer en calendario' 
                      : 'Required to appear in calendar'}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Calendar
                      mode="single"
                      selected={schedule.date}
                      onSelect={(date) => {
                        if (date) {
                          setSchedule(prev => {
                            const newSchedule = { ...prev, date };
                            form.setValue('scheduledDate', scheduleToISOString(newSchedule));
                            form.clearErrors('scheduledDate');
                            return newSchedule;
                          });
                        }
                      }}
                      className="rounded-md border"
                      locale={language === 'es' ? es : undefined}
                    />
                  </div>

                  <FormItem>
                    <FormLabel>{t.scheduleTime}</FormLabel>
                    <Input
                      type="time"
                      value={schedule.time}
                      onChange={(e) => {
                        setSchedule(prev => {
                          const newSchedule = { ...prev, time: e.target.value };
                          form.setValue('scheduledDate', scheduleToISOString(newSchedule));
                          form.clearErrors('scheduledDate');
                          return newSchedule;
                        });
                      }}
                      data-testid="input-time"
                    />
                  </FormItem>
                </div>
              </div>

              {/* Section: Información Financiera */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">
                    {language === 'es' ? 'Información Financiera' : 'Financial Information'}
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="estimatedCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "es" ? "Costo Estimado (MXN)" : "Estimated Cost (MXN)"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          step="0.01"
                          min="0"
                          value={field.value || ""} 
                          placeholder="0.00"
                          data-testid="input-estimated-cost" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section: Notas Adicionales */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">
                    {language === 'es' ? 'Notas Adicionales' : 'Additional Notes'}
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} rows={2} data-testid="input-notes" placeholder={language === 'es' ? 'Agregue cualquier nota o comentario adicional...' : 'Add any additional notes or comments...'} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDialog(false)}
                  data-testid="button-cancel"
                >
                  {t.cancel}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending ? t.creating : t.create}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'es' ? 'Editar Ticket' : 'Edit Ticket'}
            </DialogTitle>
            <DialogDescription>
              {language === 'es' 
                ? 'Actualiza la información del ticket de mantenimiento'
                : 'Update the maintenance ticket information'}
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => {
              if (editingTicket) {
                updateTicketMutation.mutate({ ticketId: editingTicket.id, data });
              }
            })} className="space-y-6">
              {/* Section: Detalles del Ticket */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">
                    {language === 'es' ? 'Detalles del Ticket' : 'Ticket Details'}
                  </h3>
                </div>
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.ticketTitle}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.description}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="input-edit-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={editForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.category}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-category">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(categoryLabels).map(([key, labels]) => (
                              <SelectItem key={key} value={key}>
                                {labels[language]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.priority}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(priorityColors).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label[language]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Section: Asignación e Información */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">
                    {language === 'es' ? 'Asignación e Información' : 'Assignment & Information'}
                  </h3>
                </div>
                <FormField
                  control={editForm.control}
                  name="reportedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "es" ? "Reportado por" : "Reported by"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""} 
                          placeholder={language === "es" ? "Nombre de quien reporta" : "Name of reporter"}
                          data-testid="input-edit-reported-by" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section: Información Financiera */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">
                    {language === 'es' ? 'Información Financiera' : 'Financial Information'}
                  </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={editForm.control}
                    name="estimatedCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "es" ? "Costo Estimado (MXN)" : "Estimated Cost (MXN)"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value || ""} 
                            placeholder="0.00"
                            data-testid="input-edit-estimated-cost" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="actualCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "es" ? "Costo Real (MXN)" : "Actual Cost (MXN)"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value || ""} 
                            placeholder="0.00"
                            data-testid="input-edit-actual-cost" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Cost Summary with Admin Fee */}
                {(editForm.watch("actualCost") || editForm.watch("estimatedCost")) && (
                  <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {language === 'es' ? 'Costo Base:' : 'Base Cost:'}
                      </span>
                      <span className="font-medium">
                        ${parseFloat(editForm.watch("actualCost") || editForm.watch("estimatedCost") || "0").toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {language === 'es' ? 'Comisión Administrativa (15%):' : 'Admin Fee (15%):'}
                      </span>
                      <span className="font-medium">
                        ${(parseFloat(editForm.watch("actualCost") || editForm.watch("estimatedCost") || "0") * 0.15).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-600">
                        {language === 'es' ? 'Total a Cobrar:' : 'Total Charge:'}
                      </span>
                      <span className="font-bold text-lg text-green-600">
                        ${(parseFloat(editForm.watch("actualCost") || editForm.watch("estimatedCost") || "0") * 1.15).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Notas Adicionales */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">
                    {language === 'es' ? 'Notas Adicionales' : 'Additional Notes'}
                  </h3>
                </div>
                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} rows={2} data-testid="input-edit-notes" placeholder={language === 'es' ? 'Agregue cualquier nota o comentario adicional...' : 'Add any additional notes or comments...'} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section: Fotos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">
                    {language === 'es' ? 'Fotos' : 'Photos'}
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 ml-auto">
                    <Select value={selectedPhotoPhase} onValueChange={(value: any) => setSelectedPhotoPhase(value)}>
                      <SelectTrigger className="w-[140px]" data-testid="select-photo-phase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before">
                          {language === 'es' ? 'Antes' : 'Before'}
                        </SelectItem>
                        <SelectItem value="during">
                          {language === 'es' ? 'Durante' : 'During'}
                        </SelectItem>
                        <SelectItem value="after">
                          {language === 'es' ? 'Después' : 'After'}
                        </SelectItem>
                        <SelectItem value="other">
                          {language === 'es' ? 'Otro' : 'Other'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingPhoto}
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      data-testid="button-upload-photo"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingPhoto 
                        ? (language === 'es' ? 'Subiendo...' : 'Uploading...') 
                        : (language === 'es' ? 'Subir foto' : 'Upload photo')}
                    </Button>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                  </div>
                </div>

                {ticketPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ticketPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group rounded-md border overflow-hidden aspect-square"
                        data-testid={`photo-${photo.id}`}
                      >
                        <img
                          src={photo.storageKey}
                          alt={photo.caption || 'Maintenance photo'}
                          className="w-full h-full object-cover"
                        />
                        {/* Phase Badge - clickable to edit */}
                        <Badge 
                          variant="secondary" 
                          className="absolute top-2 left-2 text-xs cursor-pointer hover-elevate"
                          onClick={() => {
                            setEditingPhotoPhase({ photoId: photo.id, currentPhase: photo.phase });
                            setShowPhotoPhaseDialog(true);
                          }}
                          data-testid={`badge-photo-phase-${photo.id}`}
                          title={language === 'es' ? 'Clic para editar fase' : 'Click to edit phase'}
                        >
                          {getPhaseLabel(photo.phase)}
                        </Badge>
                        {/* Action button - always visible on mobile, hover on desktop */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeletePhoto(photo.id)}
                            data-testid={`button-delete-photo-${photo.id}`}
                            title={language === 'es' ? 'Eliminar foto' : 'Delete photo'}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/20">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' ? 'No hay fotos adjuntas' : 'No photos attached'}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingTicket(null);
                  }}
                  data-testid="button-edit-cancel"
                >
                  {t.cancel}
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTicketMutation.isPending}
                  data-testid="button-edit-submit"
                >
                  {updateTicketMutation.isPending 
                    ? (language === 'es' ? 'Guardando...' : 'Saving...') 
                    : (language === 'es' ? 'Guardar' : 'Save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Photo Phase Dialog */}
      <Dialog open={showPhotoPhaseDialog} onOpenChange={(open) => {
        setShowPhotoPhaseDialog(open);
        if (!open) setEditingPhotoPhase(null);
      }}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-edit-photo-phase">
          <DialogHeader>
            <DialogTitle>
              {language === 'es' ? 'Editar Fase de Foto' : 'Edit Photo Phase'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'es' ? 'Seleccionar Fase' : 'Select Phase'}
              </label>
              <Select 
                value={editingPhotoPhase?.currentPhase || 'other'} 
                onValueChange={(value) => 
                  setEditingPhotoPhase(prev => prev ? { ...prev, currentPhase: value } : null)
                }
              >
                <SelectTrigger data-testid="select-edit-photo-phase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">
                    {language === 'es' ? 'Antes' : 'Before'}
                  </SelectItem>
                  <SelectItem value="during">
                    {language === 'es' ? 'Durante' : 'During'}
                  </SelectItem>
                  <SelectItem value="after">
                    {language === 'es' ? 'Después' : 'After'}
                  </SelectItem>
                  <SelectItem value="other">
                    {language === 'es' ? 'Otro' : 'Other'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setEditingPhotoPhase(null);
                setShowPhotoPhaseDialog(false);
              }}
              data-testid="button-cancel-edit-phase"
            >
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button 
              type="button" 
              onClick={() => {
                if (editingPhotoPhase) {
                  handleUpdatePhotoPhase(editingPhotoPhase.photoId, editingPhotoPhase.currentPhase);
                }
              }}
              data-testid="button-save-edit-phase"
            >
              {language === 'es' ? 'Guardar' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="cleaning" className="space-y-6 mt-6">
          {/* Cleaning Header with Action */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{language === 'es' ? 'Limpieza' : 'Cleaning'}</h2>
              <p className="text-sm text-muted-foreground">{language === 'es' ? 'Gestiona trabajos del personal de limpieza' : 'Manage cleaning staff jobs'}</p>
            </div>
            <Button onClick={() => setShowDialog(true)} data-testid="button-new-cleaning-ticket">
              <Plus className="mr-2 h-4 w-4" />
              {t.newTicket}
            </Button>
          </div>

          {/* Biweekly Period Navigation - Same as Maintenance */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousPeriod}
              data-testid="button-prev-period-cleaning"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <div className="flex items-center gap-2 text-sm px-3 py-1 bg-muted rounded-md">
              <CalendarIcon className="h-4 w-4" />
              <span className="font-medium">
                {biweeklyStats?.period?.label || `${periodIndex === 1 ? '1ra' : '2da'} Quincena`}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextPeriod}
              data-testid="button-next-period-cleaning"
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>

          {/* Metrics - Biweekly Stats (same as Maintenance) */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.totalJobs}</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-cleaning-total">{biweeklyStats?.stats?.total || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.open}</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600" data-testid="text-cleaning-open">{biweeklyStats?.stats?.open || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.resolved}</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-cleaning-resolved">{biweeklyStats?.stats?.resolved || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.actualCost}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold" data-testid="text-cleaning-actual-cost">{formatCurrency(biweeklyStats?.stats?.actualCost || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.commissions}</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-blue-600" data-testid="text-cleaning-commissions">{formatCurrency(biweeklyStats?.stats?.commission || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.totalCharge}</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-green-600" data-testid="text-cleaning-total-charge">{formatCurrency(biweeklyStats?.stats?.totalCharge || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.paidTotal}</CardTitle>
                <CreditCard className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-purple-600" data-testid="text-cleaning-paid-total">{formatCurrency(biweeklyStats?.stats?.paidTotal || 0)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters (same as Maintenance) */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.search}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                    data-testid="input-search-cleaning"
                  />
                </div>

                {/* Filter Button with Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="flex-shrink-0 relative"
                      data-testid="button-toggle-filters-cleaning"
                    >
                      <Filter className="h-4 w-4" />
                      {(statusFilter !== "all" || priorityFilter !== "all" || condominiumFilter !== "all") && (
                        <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                          {[statusFilter !== "all", priorityFilter !== "all", condominiumFilter !== "all"].filter(Boolean).length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t.status}</label>
                        <div className="flex flex-wrap gap-2">
                          <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}>{t.all}</Button>
                          <Button variant={statusFilter === "open" ? "default" : "outline"} size="sm" onClick={() => { setStatusFilter("open"); setCurrentPage(1); }}>{statusColors.open.label[language]}</Button>
                          <Button variant={statusFilter === "in_progress" ? "default" : "outline"} size="sm" onClick={() => { setStatusFilter("in_progress"); setCurrentPage(1); }}>{statusColors.in_progress.label[language]}</Button>
                          <Button variant={statusFilter === "resolved" ? "default" : "outline"} size="sm" onClick={() => { setStatusFilter("resolved"); setCurrentPage(1); }}>{statusColors.resolved.label[language]}</Button>
                          <Button variant={statusFilter === "closed" ? "default" : "outline"} size="sm" onClick={() => { setStatusFilter("closed"); setCurrentPage(1); }}>{statusColors.closed.label[language]}</Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t.priority}</label>
                        <div className="flex flex-wrap gap-2">
                          <Button variant={priorityFilter === "all" ? "default" : "outline"} size="sm" onClick={() => { setPriorityFilter("all"); setCurrentPage(1); }}>{t.all}</Button>
                          <Button variant={priorityFilter === "low" ? "default" : "outline"} size="sm" onClick={() => { setPriorityFilter("low"); setCurrentPage(1); }}>{priorityColors.low.label[language]}</Button>
                          <Button variant={priorityFilter === "medium" ? "default" : "outline"} size="sm" onClick={() => { setPriorityFilter("medium"); setCurrentPage(1); }}>{priorityColors.medium.label[language]}</Button>
                          <Button variant={priorityFilter === "high" ? "default" : "outline"} size="sm" onClick={() => { setPriorityFilter("high"); setCurrentPage(1); }}>{priorityColors.high.label[language]}</Button>
                          <Button variant={priorityFilter === "urgent" ? "default" : "outline"} size="sm" onClick={() => { setPriorityFilter("urgent"); setCurrentPage(1); }}>{priorityColors.urgent.label[language]}</Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t.condominium}</label>
                        <Select value={condominiumFilter} onValueChange={(value) => { setCondominiumFilter(value); setCurrentPage(1); }}>
                          <SelectTrigger><SelectValue placeholder={t.all} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t.all}</SelectItem>
                            {condominiums?.map((condo) => (
                              <SelectItem key={condo.id} value={condo.id}>{condo.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => { setStatusFilter("all"); setPriorityFilter("all"); setCondominiumFilter("all"); setCurrentPage(1); }}>
                        {language === 'es' ? 'Limpiar filtros' : 'Clear filters'}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Today Button */}
                <Button
                  variant={dateFilter === 'today' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
                  data-testid="button-today-cleaning"
                >
                  {language === 'es' ? 'HOY' : 'TODAY'}
                </Button>

                {/* View Mode Toggle */}
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === 'cards' ? "default" : "outline"}
                    size="icon"
                    onClick={() => { setViewMode('cards'); setManualViewModeOverride(true); }}
                    data-testid="button-view-cards-cleaning"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? "default" : "outline"}
                    size="icon"
                    onClick={() => { setViewMode('table'); setManualViewModeOverride(true); }}
                    data-testid="button-view-table-cleaning"
                  >
                    <TableIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Table/Cards */}
          {ticketsLoading ? (
            <TableLoading />
          ) : tickets.length === 0 ? (
            <Card className="p-8 text-center">
              <Wrench className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {language === 'es' ? 'No hay tickets de limpieza' : 'No cleaning tickets'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'es' 
                  ? 'Crea el primer ticket de limpieza para comenzar' 
                  : 'Create the first cleaning ticket to get started'}
              </p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t.newTicket}
              </Button>
            </Card>
          ) : viewMode === 'table' ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'es' ? 'Estado' : 'Status'}</TableHead>
                    <TableHead>{language === 'es' ? 'Prioridad' : 'Priority'}</TableHead>
                    <TableHead>{language === 'es' ? 'Unidad' : 'Unit'}</TableHead>
                    <TableHead>{language === 'es' ? 'Título' : 'Title'}</TableHead>
                    <TableHead>{language === 'es' ? 'Costo Real' : 'Actual Cost'}</TableHead>
                    <TableHead>{language === 'es' ? 'Total' : 'Total'}</TableHead>
                    <TableHead>{language === 'es' ? 'Última Act.' : 'Last Update'}</TableHead>
                    <TableHead>{language === 'es' ? 'Acciones' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket: any) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <Badge variant={ticket.status === 'open' ? 'destructive' : ticket.status === 'closed' ? 'default' : 'secondary'}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 'outline'}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{ticket.unit?.name || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{ticket.title}</TableCell>
                      <TableCell>${parseFloat(ticket.actualCost || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>${parseFloat(ticket.totalChargeAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{ticket.updatedAt ? format(new Date(ticket.updatedAt), 'dd MMM yyyy HH:mm', { locale: es }) : '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditTicket(ticket)}
                            data-testid={`button-edit-cleaning-${ticket.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewTicket(ticket)}
                            data-testid={`button-view-cleaning-${ticket.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tickets.map((ticket: any) => (
                <Card key={ticket.id} className="hover-elevate cursor-pointer" onClick={() => handleViewTicket(ticket)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={ticket.status === 'open' ? 'destructive' : ticket.status === 'closed' ? 'default' : 'secondary'}>
                        {ticket.status}
                      </Badge>
                      <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 'outline'}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2 line-clamp-1">{ticket.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Home className="h-4 w-4" />
                        <span>{ticket.unit?.name || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{language === 'es' ? 'Total:' : 'Total:'}</span>
                        <span className="font-medium">${parseFloat(ticket.totalChargeAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {tickets.length > 0 && (
            <ExternalPaginationControls
              currentPage={currentPage}
              totalPages={serverTotalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="quotations" className="mt-6">
          <ExternalQuotationsTab />
        </TabsContent>


        <TabsContent value="assignments" className="mt-6">
          <ExternalMaintenanceWorkers initialTab="assignments" hideHeader />
        </TabsContent>
      </Tabs>

      {/* Closure Report Dialog - Outside of Tabs for proper rendering */}
      <Dialog open={showClosureDialog} onOpenChange={(open) => {
        setShowClosureDialog(open);
        if (!open) {
          setClosingTicket(null);
          setClosureWorkNotes("");
          setClosureFinalAmount("");
          setClosureApplyAdminFee(true);
          setClosureAfterPhotos([]);
        }
      }}>
        <DialogContent className="max-w-lg" data-testid="dialog-closure-report">
          <DialogHeader>
            <DialogTitle>
              {language === 'es' ? 'Reporte de Cierre de Trabajo' : 'Work Closure Report'}
            </DialogTitle>
            <DialogDescription>
              {language === 'es' 
                ? 'Complete el reporte de cierre para cerrar el ticket y generar el cobro' 
                : 'Complete the closure report to close the ticket and generate the charge'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Source Quotation Info - show if ticket originated from quotation */}
            {closingTicket?.quotationId && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                  <FileText className="h-4 w-4" />
                  {language === 'es' ? 'Originado de Cotización' : 'From Quotation'}
                </div>
                {(closingTicket.quotedTotal || closingTicket.quotedAdminFee) && (
                  <div className="text-sm space-y-1">
                    {closingTicket.quotedTotal && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{language === 'es' ? 'Total cotizado:' : 'Quoted total:'}</span>
                        <span className="font-medium">${parseFloat(closingTicket.quotedTotal).toFixed(2)} MXN</span>
                      </div>
                    )}
                    {closingTicket.quotedAdminFee && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{language === 'es' ? 'Fee administrativo:' : 'Admin fee:'}</span>
                        <span>${parseFloat(closingTicket.quotedAdminFee).toFixed(2)} MXN</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Work Notes */}
            <div className="space-y-2">
              <Label htmlFor="closure-notes">
                {language === 'es' ? 'Notas del Trabajo Realizado' : 'Work Notes'}
              </Label>
              <Textarea
                id="closure-notes"
                placeholder={language === 'es' ? 'Describa el trabajo realizado...' : 'Describe the work done...'}
                value={closureWorkNotes}
                onChange={(e) => setClosureWorkNotes(e.target.value)}
                rows={3}
                data-testid="input-closure-notes"
              />
            </div>

            {/* Invoice Date */}
            <div className="space-y-2">
              <Label htmlFor="invoice-date">
                {language === 'es' ? 'Fecha de Cobro' : 'Invoice Date'}
              </Label>
              <Input
                id="invoice-date"
                type="date"
                value={closureInvoiceDate}
                onChange={(e) => setClosureInvoiceDate(e.target.value)}
                data-testid="input-invoice-date"
              />
            </div>

            {/* Amount to Charge */}
            <div className="space-y-2">
              <Label htmlFor="final-amount">
                {language === 'es' ? 'Monto del Trabajo' : 'Work Amount'}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="final-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={closureFinalAmount}
                  onChange={(e) => setClosureFinalAmount(e.target.value)}
                  className="pl-7"
                  data-testid="input-final-amount"
                />
              </div>
            </div>

            {/* Apply Admin Fee Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="apply-admin-fee" className="cursor-pointer">
                  {language === 'es' ? 'Aplicar Cargo Administrativo (15%)' : 'Apply Admin Fee (15%)'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {closureApplyAdminFee && closureFinalAmount
                    ? `+ $${(parseFloat(closureFinalAmount || '0') * 0.15).toFixed(2)} MXN`
                    : language === 'es' ? 'Sin cargo adicional' : 'No additional charge'}
                </p>
              </div>
              <Switch
                id="apply-admin-fee"
                checked={closureApplyAdminFee}
                onCheckedChange={setClosureApplyAdminFee}
                data-testid="switch-apply-admin-fee"
              />
            </div>

            {/* Total Summary */}
            {closureFinalAmount && parseFloat(closureFinalAmount) > 0 && (
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{language === 'es' ? 'Monto del trabajo:' : 'Work amount:'}</span>
                  <span>${parseFloat(closureFinalAmount).toFixed(2)} MXN</span>
                </div>
                {closureApplyAdminFee && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{language === 'es' ? 'Cargo administrativo (15%):' : 'Admin fee (15%):'}</span>
                    <span>+ ${(parseFloat(closureFinalAmount) * 0.15).toFixed(2)} MXN</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>{language === 'es' ? 'Total a cobrar:' : 'Total to charge:'}</span>
                  <span>
                    ${(parseFloat(closureFinalAmount) * (closureApplyAdminFee ? 1.15 : 1)).toFixed(2)} MXN
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowClosureDialog(false)}
              data-testid="button-cancel-closure"
            >
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button 
              type="button" 
              onClick={() => {
                if (closingTicket) {
                  closeWithReportMutation.mutate({
                    ticketId: closingTicket.id,
                    closureWorkNotes,
                    invoiceDate: closureInvoiceDate,
                    finalChargeAmount: closureFinalAmount || '0',
                    applyAdminFee: closureApplyAdminFee,
                    afterWorkPhotos: closureAfterPhotos
                  });
                }
              }}
              disabled={closeWithReportMutation.isPending}
              data-testid="button-submit-closure"
            >
              {closeWithReportMutation.isPending 
                ? (language === 'es' ? 'Cerrando...' : 'Closing...') 
                : (language === 'es' ? 'Cerrar y Enviar a Contabilidad' : 'Close & Send to Accounting')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
