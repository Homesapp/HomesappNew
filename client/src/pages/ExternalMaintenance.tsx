import { useState, useEffect, useLayoutEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalMaintenanceTicket, ExternalCondominium, ExternalUnit, ExternalWorkerAssignment } from "@shared/schema";
import { insertExternalMaintenanceTicketSchema } from "@shared/schema";
import { z } from "zod";
import { format, toZonedTime, fromZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";

type MaintenanceFormData = z.infer<typeof insertExternalMaintenanceTicketSchema>;

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
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useMobile();
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [condominiumFilter, setCondominiumFilter] = useState<string>("all");
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

  const { data: tickets, isLoading: ticketsLoading } = useQuery<ExternalMaintenanceTicket[]>({
    queryKey: ['/api/external-tickets'],
  });

  const { data: condominiums } = useQuery<ExternalCondominium[]>({
    queryKey: ['/api/external-condominiums'],
  });

  const { data: units } = useQuery<ExternalUnit[]>({
    queryKey: ['/api/external-units'],
  });

  const { data: agencyUsers } = useQuery<any[]>({
    queryKey: ['/api/external-agency-users'],
  });

  const { data: workerAssignments } = useQuery<ExternalWorkerAssignment[]>({
    queryKey: ['/api/external-worker-assignments'],
  });

  const maintenanceWorkers = agencyUsers?.filter(u => 
    u.role === 'external_agency_maintenance' && u.maintenanceSpecialty
  ) || [];

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(insertExternalMaintenanceTicketSchema),
    defaultValues: {
      unitId: "",
      title: "",
      description: "",
      category: "other",
      priority: "medium",
      status: "open",
      scheduledDate: scheduleToISOString(getDefaultSchedule()),
      assignedTo: undefined,
      notes: "",
    },
  });

  // Initialize form with default schedule on mount
  useEffect(() => {
    const defaultSchedule = getDefaultSchedule();
    setSchedule(defaultSchedule);
    form.setValue('scheduledDate', scheduleToISOString(defaultSchedule));
  }, []);

  const handleSubmit = form.handleSubmit((data) => {
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
  });

  const createMutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      const selectedUnit = units?.find(u => u.id === data.unitId);
      if (!selectedUnit?.agencyId) {
        throw new Error(language === "es" 
          ? "No se pudo obtener la información de la unidad" 
          : "Could not get unit information"
        );
      }

      return await apiRequest('POST', '/api/external-tickets', {
        ...data,
        agencyId: selectedUnit.agencyId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-tickets'] });
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

  // Filter and search logic
  const filteredTickets = tickets?.filter(ticket => {
    const unitInfo = getUnitInfo(ticket.unitId);
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      ticket.title.toLowerCase().includes(searchLower) ||
      ticket.description.toLowerCase().includes(searchLower) ||
      unitInfo?.unit?.unitNumber?.toLowerCase().includes(searchLower) ||
      unitInfo?.condo?.name?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;
    const matchesCondo = condominiumFilter === "all" || unitInfo?.condo?.id === condominiumFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesCondo;
  }) || [];

  // Calculate metrics
  const stats = {
    total: filteredTickets.length,
    open: filteredTickets.filter(t => t.status === 'open').length,
    inProgress: filteredTickets.filter(t => t.status === 'in_progress').length,
    resolved: filteredTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    totalCost: filteredTickets.reduce((sum, t) => sum + parseFloat(t.actualCost || '0'), 0),
    estimatedCost: filteredTickets.reduce((sum, t) => sum + parseFloat(t.estimatedCost || '0'), 0),
  };

  // Sorting logic with type normalization
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'unit':
        const aUnitInfo = getUnitInfo(a.unitId);
        const bUnitInfo = getUnitInfo(b.unitId);
        aValue = (aUnitInfo?.unit?.unitNumber || '').toLowerCase();
        bValue = (bUnitInfo?.unit?.unitNumber || '').toLowerCase();
        break;
      case 'category':
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
        break;
      case 'priority':
        const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        break;
      case 'status':
        aValue = a.status.toLowerCase();
        bValue = b.status.toLowerCase();
        break;
      case 'assigned':
        aValue = (getAssignedUserName(a.assignedTo) || '').toLowerCase();
        bValue = (getAssignedUserName(b.assignedTo) || '').toLowerCase();
        break;
      case 'created':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'updated':
        aValue = new Date(a.updatedAt);
        bValue = new Date(b.updatedAt);
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTickets.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = sortedTickets.slice(startIndex, endIndex);

  // Pre-render page clamping using useLayoutEffect
  useLayoutEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Clamp page when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [sortedTickets.length, itemsPerPage]);

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
    open: 'Abiertos',
    inProgress: 'En Progreso',
    resolved: 'Resueltos',
    estimatedCost: 'Costo Estimado',
    actualCost: 'Costo Real',
    search: 'Buscar por título, descripción o unidad...',
    filters: 'Filtros',
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
    open: 'Open',
    inProgress: 'In Progress',
    resolved: 'Resolved',
    estimatedCost: 'Estimated Cost',
    actualCost: 'Actual Cost',
    search: 'Search by title, description or unit...',
    filters: 'Filters',
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="button-new-ticket">
          <Plus className="mr-2 h-4 w-4" />
          {t.newTicket}
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalJobs}</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.open}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="text-open">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.inProgress}</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-in-progress">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.resolved}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-resolved">{stats.resolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.estimatedCost}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold" data-testid="text-estimated-cost">{formatCurrency(stats.estimatedCost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.actualCost}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold" data-testid="text-actual-cost">{formatCurrency(stats.totalCost)}</div>
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
          
          {/* View Mode Toggles - Desktop Only */}
          {!isMobile && (
            <>
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
            </>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Tickets - Cards or Table */}
      {ticketsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
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

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                            <span>{format(new Date(ticket.createdAt), 'dd MMM yyyy', { locale: language === 'es' ? es : undefined })}</span>
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
                          onClick={() => handleSort('title')}
                          className="hover-elevate -ml-3 h-8"
                          data-testid="sort-title"
                        >
                          {t.ticketTitle}
                          {renderSortIcon('title')}
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
                          onClick={() => handleSort('assigned')}
                          className="hover-elevate -ml-3 h-8"
                          data-testid="sort-assigned"
                        >
                          {t.assigned}
                          {renderSortIcon('assigned')}
                        </Button>
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
                      <TableRow key={ticket.id} data-testid={`row-ticket-${ticket.id}`} className="hover-elevate">
                        <TableCell className="px-3 py-3">
                          <span className="truncate max-w-xs">{ticket.title}</span>
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
                          <Badge className={priorityConfig.bg} data-testid={`badge-priority-${ticket.id}`}>
                            {priorityConfig.label[language]}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <Badge className={statusConfig.bg} data-testid={`badge-status-${ticket.id}`}>
                            {statusConfig.label[language]}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <span>{assignedName || '-'}</span>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <span>
                            {format(new Date(ticket.updatedAt), 'dd MMM yyyy HH:mm', { locale: language === 'es' ? es : undefined })}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          <div className="flex gap-1 justify-end">
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
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t.scheduleDate}</label>
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
                        // Prevent clearing the date - always keep a schedule for calendar visibility
                        if (date) {
                          setSchedule(prev => {
                            const newSchedule = { ...prev, date };
                            // Sync with React Hook Form for validation and persistence
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
                          // Sync with React Hook Form for validation and persistence
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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.notes}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} rows={2} data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
    </div>
  );
}
