import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Plus,
  Search,
  Filter,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ChevronDown,
  CalendarIcon,
  Clock,
  Eye,
  LayoutGrid,
  TableIcon,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Link } from "wouter";

type ExternalMaintenanceTicket = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  unitId: string;
  condominiumId: string;
  assignedToUserId?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  actualCost?: string;
  createdAt: string;
  unit?: { name: string; propertyName: string };
  condominium?: { name: string };
  assignedUser?: { firstName: string; lastName: string };
};

type BiweeklyStatsResponse = {
  period: {
    label: string;
    startDate: string;
    endDate: string;
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

type PaginatedResponse = {
  data: ExternalMaintenanceTicket[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const cleaningFormSchema = z.object({
  unitId: z.string().min(1, "Selecciona una unidad"),
  title: z.string().min(3, "Mínimo 3 caracteres"),
  description: z.string().min(10, "Mínimo 10 caracteres"),
  priority: z.string().min(1, "Selecciona prioridad"),
  notes: z.string().optional(),
});

type CleaningFormData = z.infer<typeof cleaningFormSchema>;

interface ExternalCleaningTabProps {
  language: 'es' | 'en';
}

export function ExternalCleaningTab({ language }: ExternalCleaningTabProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [condominiumFilter, setCondominiumFilter] = useState<string>("all");
  const [formCondominiumId, setFormCondominiumId] = useState<string>("");
  
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string>('created');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const now = new Date();
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodIndex, setPeriodIndex] = useState(now.getDate() <= 15 ? 1 : 2);
  
  const goToPreviousPeriod = () => {
    if (periodIndex === 2) {
      setPeriodIndex(1);
    } else {
      const newMonth = periodMonth === 1 ? 12 : periodMonth - 1;
      const newYear = periodMonth === 1 ? periodYear - 1 : periodYear;
      setPeriodMonth(newMonth);
      setPeriodYear(newYear);
      setPeriodIndex(2);
    }
  };
  
  const goToNextPeriod = () => {
    if (periodIndex === 1) {
      setPeriodIndex(2);
    } else {
      const newMonth = periodMonth === 12 ? 1 : periodMonth + 1;
      const newYear = periodMonth === 12 ? periodYear + 1 : periodYear;
      setPeriodMonth(newMonth);
      setPeriodYear(newYear);
      setPeriodIndex(1);
    }
  };
  
  const getSpanishMonthName = (month: number): string => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return monthNames[month - 1] || '';
  };
  
  const getBiweeklyPeriodLabel = (): string => {
    const periodText = periodIndex === 1 ? '1ra' : '2da';
    const monthName = getSpanishMonthName(periodMonth);
    return `${periodText} Quincena de ${monthName} ${periodYear}`;
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, priorityFilter, condominiumFilter]);

  const ticketsQueryParams = new URLSearchParams();
  ticketsQueryParams.set('page', String(currentPage));
  ticketsQueryParams.set('pageSize', String(itemsPerPage));
  ticketsQueryParams.set('category', 'cleaning');
  if (debouncedSearch) ticketsQueryParams.set('search', debouncedSearch);
  if (statusFilter !== 'all') ticketsQueryParams.set('status', statusFilter);
  if (priorityFilter !== 'all') ticketsQueryParams.set('priority', priorityFilter);
  if (condominiumFilter !== 'all') ticketsQueryParams.set('condominiumId', condominiumFilter);
  ticketsQueryParams.set('sortField', sortColumn);
  ticketsQueryParams.set('sortOrder', sortDirection);

  const ticketsUrl = `/api/external-tickets?${ticketsQueryParams.toString()}`;

  const { data: ticketsResponse, isLoading: ticketsLoading } = useQuery<PaginatedResponse>({
    queryKey: [ticketsUrl],
  });

  const tickets = ticketsResponse?.data || [];
  const totalItems = ticketsResponse?.total || 0;
  const totalPages = ticketsResponse?.totalPages || 1;

  const { data: condominiums } = useQuery<any[]>({
    queryKey: ['/api/external-condominiums-for-filters'],
  });

  const { data: units } = useQuery<any[]>({
    queryKey: ['/api/external-units-for-filters'],
  });

  const biweeklyStatsUrl = `/api/external-tickets/stats/biweekly?year=${periodYear}&month=${periodMonth}&period=${periodIndex}&category=cleaning`;
  const { data: biweeklyStats } = useQuery<BiweeklyStatsResponse>({
    queryKey: ['/api/external-tickets/stats/biweekly', 'cleaning', periodYear, periodMonth, periodIndex],
    queryFn: () => fetch(biweeklyStatsUrl, { credentials: 'include' }).then(res => res.json()),
  });

  const form = useForm<CleaningFormData>({
    resolver: zodResolver(cleaningFormSchema),
    defaultValues: {
      unitId: "",
      title: "",
      description: "",
      priority: "medium",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CleaningFormData) => {
      return apiRequest('/api/external-tickets', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          category: 'cleaning',
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: language === 'es' ? 'Limpieza creada' : 'Cleaning created',
        description: language === 'es' ? 'El ticket de limpieza fue creado exitosamente' : 'Cleaning ticket was created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/external-tickets'] });
      setShowDialog(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' ? 'No se pudo crear el ticket' : 'Could not create ticket',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CleaningFormData) => {
    createMutation.mutate(data);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const filteredUnits = formCondominiumId
    ? units?.filter((u) => u.condominiumId === formCondominiumId) || []
    : [];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    const labels: Record<string, { es: string; en: string }> = {
      open: { es: "Abierto", en: "Open" },
      in_progress: { es: "En Progreso", en: "In Progress" },
      resolved: { es: "Resuelto", en: "Resolved" },
      closed: { es: "Cerrado", en: "Closed" },
    };
    return (
      <Badge className={styles[status] || styles.open}>
        {labels[status]?.[language] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    const labels: Record<string, { es: string; en: string }> = {
      low: { es: "Baja", en: "Low" },
      medium: { es: "Media", en: "Medium" },
      high: { es: "Alta", en: "High" },
      urgent: { es: "Urgente", en: "Urgent" },
    };
    return (
      <Badge className={styles[priority] || styles.medium}>
        {labels[priority]?.[language] || priority}
      </Badge>
    );
  };

  const t = language === 'es' ? {
    title: 'Limpieza',
    subtitle: 'Gestiona los servicios de limpieza para tus propiedades',
    newCleaning: 'Nueva Limpieza',
    totalCleanings: 'Total Limpiezas',
    open: 'Total Abiertas',
    resolved: 'Resueltas',
    actualCost: 'Costo Real',
    commissions: 'Comisiones (15%)',
    totalCharge: 'Total a Cobrar',
    paidTotal: 'Total Pagado',
    search: 'Buscar por título o descripción...',
    filters: 'Filtros',
    today: 'HOY',
    status: 'Estado',
    priority: 'Prioridad',
    condominium: 'Condominio',
    all: 'Todos',
    unit: 'Unidad',
    created: 'Creado',
    scheduled: 'Programado',
    actions: 'Acciones',
    view: 'Ver',
    noCleanings: 'No se encontraron servicios de limpieza',
    noCleaningsDesc: 'Crea un nuevo servicio de limpieza para empezar',
    createCleaning: 'Crear Servicio de Limpieza',
    selectCondominium: 'Seleccionar Condominio',
    selectUnit: 'Seleccionar Unidad',
    cleaningTitle: 'Título del Servicio',
    description: 'Descripción',
    selectPriority: 'Seleccionar Prioridad',
    notes: 'Notas Adicionales (Opcional)',
    cancel: 'Cancelar',
    create: 'Crear Servicio',
    creating: 'Creando...',
  } : {
    title: 'Cleaning',
    subtitle: 'Manage cleaning services for your properties',
    newCleaning: 'New Cleaning',
    totalCleanings: 'Total Cleanings',
    open: 'Total Open',
    resolved: 'Resolved',
    actualCost: 'Actual Cost',
    commissions: 'Commissions (15%)',
    totalCharge: 'Total Charge',
    paidTotal: 'Total Paid',
    search: 'Search by title or description...',
    filters: 'Filters',
    today: 'TODAY',
    status: 'Status',
    priority: 'Priority',
    condominium: 'Condominium',
    all: 'All',
    unit: 'Unit',
    created: 'Created',
    scheduled: 'Scheduled',
    actions: 'Actions',
    view: 'View',
    noCleanings: 'No cleaning services found',
    noCleaningsDesc: 'Create a new cleaning service to get started',
    createCleaning: 'Create Cleaning Service',
    selectCondominium: 'Select Condominium',
    selectUnit: 'Select Unit',
    cleaningTitle: 'Service Title',
    description: 'Description',
    selectPriority: 'Select Priority',
    notes: 'Additional Notes (Optional)',
    cancel: 'Cancel',
    create: 'Create Service',
    creating: 'Creating...',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="button-new-cleaning">
          <Plus className="mr-2 h-4 w-4" />
          {t.newCleaning}
        </Button>
      </div>

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
            {getBiweeklyPeriodLabel()}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalCleanings}</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-cleaning">{biweeklyStats?.stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.open}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="text-open-cleaning">{biweeklyStats?.stats?.open || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.resolved}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-resolved-cleaning">{biweeklyStats?.stats?.resolved || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.actualCost}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold" data-testid="text-actual-cost-cleaning">{formatCurrency(biweeklyStats?.stats?.actualCost || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.commissions}</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600" data-testid="text-commissions-cleaning">{formatCurrency(biweeklyStats?.stats?.commission || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalCharge}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600" data-testid="text-total-charge-cleaning">{formatCurrency(biweeklyStats?.stats?.totalCharge || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.paidTotal}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold" data-testid="text-paid-total-cleaning">{formatCurrency(biweeklyStats?.stats?.paidTotal || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.search}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-cleaning"
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="default" data-testid="button-filters-cleaning">
              <Filter className="mr-2 h-4 w-4" />
              {t.filters}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">{t.status}</h4>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-cleaning">
                    <SelectValue placeholder={t.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    <SelectItem value="open">{language === 'es' ? 'Abierto' : 'Open'}</SelectItem>
                    <SelectItem value="in_progress">{language === 'es' ? 'En Progreso' : 'In Progress'}</SelectItem>
                    <SelectItem value="resolved">{language === 'es' ? 'Resuelto' : 'Resolved'}</SelectItem>
                    <SelectItem value="closed">{language === 'es' ? 'Cerrado' : 'Closed'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium leading-none">{t.priority}</h4>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger data-testid="select-priority-cleaning">
                    <SelectValue placeholder={t.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    <SelectItem value="low">{language === 'es' ? 'Baja' : 'Low'}</SelectItem>
                    <SelectItem value="medium">{language === 'es' ? 'Media' : 'Medium'}</SelectItem>
                    <SelectItem value="high">{language === 'es' ? 'Alta' : 'High'}</SelectItem>
                    <SelectItem value="urgent">{language === 'es' ? 'Urgente' : 'Urgent'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium leading-none">{t.condominium}</h4>
                <Select value={condominiumFilter} onValueChange={setCondominiumFilter}>
                  <SelectTrigger data-testid="select-condominium-cleaning">
                    <SelectValue placeholder={t.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    {condominiums?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button 
          variant="outline" 
          onClick={() => {
            const today = new Date();
            setPeriodYear(today.getFullYear());
            setPeriodMonth(today.getMonth() + 1);
            setPeriodIndex(today.getDate() <= 15 ? 1 : 2);
          }}
          data-testid="button-today-cleaning"
        >
          {t.today}
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('table')}
            data-testid="button-view-table-cleaning"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('cards')}
            data-testid="button-view-cards-cleaning"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {ticketsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">{t.noCleanings}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t.noCleaningsDesc}</p>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t.newCleaning}
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.cleaningTitle}</TableHead>
                <TableHead>{t.unit}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.priority}</TableHead>
                <TableHead>{t.created}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id} data-testid={`row-cleaning-${ticket.id}`}>
                  <TableCell className="font-medium">{ticket.title}</TableCell>
                  <TableCell>{ticket.unit?.name || '-'}</TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                  <TableCell>
                    {format(new Date(ticket.createdAt), 'dd/MM/yyyy', { locale: language === 'es' ? es : enUS })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/external/maintenance/${ticket.id}`}>
                      <Button variant="ghost" size="icon" data-testid={`button-view-cleaning-${ticket.id}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="hover-elevate" data-testid={`card-cleaning-${ticket.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{ticket.title}</CardTitle>
                  {getStatusBadge(ticket.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span>{ticket.unit?.name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(ticket.createdAt), 'dd/MM/yyyy', { locale: language === 'es' ? es : enUS })}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    {getPriorityBadge(ticket.priority)}
                    <Link href={`/external/maintenance/${ticket.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-view-cleaning-card-${ticket.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t.view}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            {language === 'es' ? 'Anterior' : 'Previous'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {language === 'es' ? `Página ${currentPage} de ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            {language === 'es' ? 'Siguiente' : 'Next'}
          </Button>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.createCleaning}</DialogTitle>
            <DialogDescription>
              {language === 'es' 
                ? 'Completa los detalles del servicio de limpieza' 
                : 'Fill in the cleaning service details'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <FormLabel>{t.condominium}</FormLabel>
                <Select value={formCondominiumId} onValueChange={setFormCondominiumId}>
                  <SelectTrigger data-testid="select-form-condominium-cleaning">
                    <SelectValue placeholder={t.selectCondominium} />
                  </SelectTrigger>
                  <SelectContent>
                    {condominiums?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.unit}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-form-unit-cleaning">
                          <SelectValue placeholder={t.selectUnit} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredUnits.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.cleaningTitle}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-title-cleaning" />
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
                      <Textarea {...field} data-testid="textarea-description-cleaning" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.priority}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-form-priority-cleaning">
                          <SelectValue placeholder={t.selectPriority} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{language === 'es' ? 'Baja' : 'Low'}</SelectItem>
                        <SelectItem value="medium">{language === 'es' ? 'Media' : 'Medium'}</SelectItem>
                        <SelectItem value="high">{language === 'es' ? 'Alta' : 'High'}</SelectItem>
                        <SelectItem value="urgent">{language === 'es' ? 'Urgente' : 'Urgent'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.notes}</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="textarea-notes-cleaning" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-cleaning">
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
