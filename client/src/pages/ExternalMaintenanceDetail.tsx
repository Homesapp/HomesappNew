import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Wrench,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  DollarSign,
  Edit,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Home,
  Building2,
  Plus,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { 
  ExternalMaintenanceTicket, 
  ExternalMaintenanceUpdate, 
  ExternalMaintenancePhoto,
  ExternalUnit,
  ExternalCondominium,
} from "@shared/schema";
import { insertExternalMaintenanceUpdateSchema } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const updateFormSchema = z.object({
  type: z.enum(['comment', 'status_change', 'assignment', 'cost_update', 'schedule_update']),
  notes: z.string().min(1, "Notes are required"),
  newStatus: z.enum(['open', 'in_progress', 'resolved', 'closed', 'on_hold']).optional(),
  newPriority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  newAssignedTo: z.string().optional(),
});

type UpdateFormData = z.infer<typeof updateFormSchema>;

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

const phaseColors: Record<string, { bg: string; label: { es: string; en: string } }> = {
  before: { bg: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300", label: { es: "Antes", en: "Before" } },
  during: { bg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300", label: { es: "Durante", en: "During" } },
  after: { bg: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300", label: { es: "Después", en: "After" } },
  other: { bg: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300", label: { es: "Otro", en: "Other" } },
};

const updateTypeLabels: Record<string, { es: string; en: string }> = {
  comment: { es: "Comentario", en: "Comment" },
  status_change: { es: "Cambio de Estado", en: "Status Change" },
  assignment: { es: "Reasignación", en: "Assignment" },
  cost_update: { es: "Actualización de Costo", en: "Cost Update" },
  schedule_update: { es: "Cambio de Programación", en: "Schedule Update" },
};

export default function ExternalMaintenanceDetail() {
  const { id } = useParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCost, setEditingCost] = useState<'estimated' | 'actual' | null>(null);
  const [costValue, setCostValue] = useState("");

  // Check if user can modify maintenance tickets (admin/maintenance manager roles)
  const canModifyTicket = user?.role && ['master', 'admin', 'external_agency_admin', 'external_agency_maintenance'].includes(user.role);

  // Main ticket data - with extended info from backend
  const { data: ticket, isLoading: ticketLoading } = useQuery<ExternalMaintenanceTicket & { 
    unitNumber?: string; 
    condominiumName?: string;
    assignedToName?: string;
    createdByName?: string;
  }>({
    queryKey: ['/api/external-tickets', id],
    enabled: !!id,
    staleTime: 30000, // Cache for 30 seconds
  });

  const { data: updates, isLoading: updatesLoading } = useQuery<ExternalMaintenanceUpdate[]>({
    queryKey: ['/api/external-tickets', id, 'updates'],
    enabled: !!id,
    staleTime: 30000,
  });

  const { data: photos, isLoading: photosLoading } = useQuery<ExternalMaintenancePhoto[]>({
    queryKey: ['/api/external-tickets', id, 'photos'],
    enabled: !!id,
    staleTime: 30000,
  });

  // Only load filter data when editing is active - lazy load
  const [needsFilterData, setNeedsFilterData] = useState(false);
  
  const { data: units } = useQuery<{ id: string; unitNumber: string; condominiumId: string }[]>({
    queryKey: ['/api/external-units-for-filters'],
    enabled: needsFilterData,
    staleTime: 300000, // Cache for 5 minutes
  });

  const { data: condominiums } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['/api/external-condominiums-for-filters'],
    enabled: needsFilterData,
    staleTime: 300000,
  });

  const { data: agencyUsers } = useQuery<any[]>({
    queryKey: ['/api/external-agency-users'],
    enabled: needsFilterData || showUpdateDialog,
    staleTime: 300000,
  });

  const form = useForm<UpdateFormData>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      type: 'comment',
      notes: '',
    },
  });

  const createUpdateMutation = useMutation({
    mutationFn: async (data: UpdateFormData) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      // Only admins/managers can modify ticket status
      if (data.newStatus && !canModifyTicket) {
        throw new Error("Only administrators and maintenance managers can modify ticket status");
      }
      
      const updateData = {
        ticketId: id!,
        type: data.type,
        notes: data.notes,
        statusSnapshot: data.newStatus || ticket?.status,
        prioritySnapshot: data.newPriority || ticket?.priority,
        assignedToSnapshot: data.newAssignedTo || ticket?.assignedTo,
        createdBy: user.id,
      };

      // If status changed, also update the ticket (only for authorized users)
      if (data.newStatus && data.newStatus !== ticket?.status && canModifyTicket) {
        await apiRequest('PATCH', `/api/external-tickets/${id}/status`, {
          status: data.newStatus,
          updatedByUserId: user.id,
        });
      }

      return await apiRequest('POST', `/api/external-tickets/${id}/updates`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-tickets', id, 'updates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external-tickets', id] });
      setShowUpdateDialog(false);
      form.reset();
      toast({
        title: language === 'es' ? 'Actualización agregada' : 'Update added',
        description: language === 'es' ? 'La actualización se registró correctamente' : 'Update recorded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCostMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !editingCost) throw new Error("Invalid state");
      
      const field = editingCost === 'estimated' ? 'estimatedCost' : 'actualCost';
      return await apiRequest('PATCH', `/api/external-tickets/${id}`, {
        [field]: costValue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-tickets', id] });
      setEditingCost(null);
      setCostValue("");
      toast({
        title: language === 'es' ? 'Costo actualizado' : 'Cost updated',
      });
    },
  });

  const getUnitInfo = (unitId: string) => {
    // First try to use extended data from ticket
    if (ticket?.unitNumber || ticket?.condominiumName) {
      return { 
        unit: { unitNumber: ticket.unitNumber },
        condo: { name: ticket.condominiumName }
      };
    }
    // Fall back to filter data if available
    if (needsFilterData && units && condominiums) {
      const unit = units.find(u => u.id === unitId);
      if (!unit) return null;
      const condo = condominiums.find(c => c.id === unit.condominiumId);
      return { unit, condo };
    }
    return null;
  };

  const getUserName = (userId: string | null | undefined, fieldType?: 'assigned' | 'created') => {
    // First try to use extended data from ticket
    if (fieldType === 'assigned' && ticket?.assignedToName) {
      return ticket.assignedToName;
    }
    if (fieldType === 'created' && ticket?.createdByName) {
      return ticket.createdByName;
    }
    // Fall back to filter data if available
    if (!userId) return null;
    const foundUser = agencyUsers?.find(u => u.id === userId);
    if (!foundUser) return null;
    return `${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim() || foundUser.email;
  };
  
  // Calculate base cost (without 15% admin fee)
  const getBaseCost = (estimatedCost: string | number | null | undefined) => {
    if (!estimatedCost) return null;
    const total = typeof estimatedCost === 'string' ? parseFloat(estimatedCost) : estimatedCost;
    return total / 1.15; // Remove 15% admin fee to get base cost
  };

  const formatCurrency = (amount: string | number | null | undefined) => {
    if (!amount) return '-';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: 'MXN',
    }).format(num);
  };

  const handleSubmitUpdate = (data: UpdateFormData) => {
    createUpdateMutation.mutate(data);
  };

  const t = language === 'es' ? {
    back: 'Volver',
    ticketDetail: 'Detalle del Ticket',
    overview: 'Información General',
    timeline: 'Historial de Seguimiento',
    photos: 'Fotos del Trabajo',
    unit: 'Unidad',
    condominium: 'Condominio',
    category: 'Categoría',
    reported: 'Reportado por',
    assigned: 'Asignado a',
    created: 'Creado',
    scheduled: 'Programado',
    resolved: 'Resuelto',
    estimatedCost: 'Costo Estimado',
    actualCost: 'Costo Real',
    edit: 'Editar',
    description: 'Descripción del Problema',
    notes: 'Notas Adicionales',
    addUpdate: 'Agregar Actualización',
    noUpdates: 'No hay actualizaciones',
    noUpdatesDesc: 'Agrega la primera actualización de seguimiento',
    noPhotos: 'No hay fotos',
    noPhotosDesc: 'Las fotos del trabajo se mostrarán aquí',
    updateType: 'Tipo de Actualización',
    comment: 'Comentario',
    statusChange: 'Cambio de Estado',
    updateNotes: 'Descripción de la Actualización',
    newStatus: 'Nuevo Estado',
    cancel: 'Cancelar',
    save: 'Guardar',
    saving: 'Guardando...',
    ticketNotFound: 'Ticket no encontrado',
    loading: 'Cargando...',
  } : {
    back: 'Back',
    ticketDetail: 'Ticket Detail',
    overview: 'Overview',
    timeline: 'Work Timeline',
    photos: 'Work Photos',
    unit: 'Unit',
    condominium: 'Condominium',
    category: 'Category',
    reported: 'Reported by',
    assigned: 'Assigned to',
    created: 'Created',
    scheduled: 'Scheduled',
    resolved: 'Resolved',
    estimatedCost: 'Estimated Cost',
    actualCost: 'Actual Cost',
    edit: 'Edit',
    description: 'Problem Description',
    notes: 'Additional Notes',
    addUpdate: 'Add Update',
    noUpdates: 'No updates',
    noUpdatesDesc: 'Add the first work update',
    noPhotos: 'No photos',
    noPhotosDesc: 'Work photos will appear here',
    updateType: 'Update Type',
    comment: 'Comment',
    statusChange: 'Status Change',
    updateNotes: 'Update Description',
    newStatus: 'New Status',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    ticketNotFound: 'Ticket not found',
    loading: 'Loading...',
  };

  if (ticketLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">{t.ticketNotFound}</p>
            <Link href="/external/maintenance">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.back}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unitInfo = getUnitInfo(ticket.unitId);
  const statusConfig = statusColors[ticket.status] || statusColors.open;
  const priorityConfig = priorityColors[ticket.priority] || priorityColors.medium;
  const assignedName = getUserName(ticket.assignedTo);
  const createdByName = getUserName(ticket.createdBy);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/external/maintenance">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wrench className="h-6 w-6" />
              {ticket.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t.ticketDetail} #{ticket.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className={priorityConfig.bg} data-testid="badge-priority">
            {priorityConfig.label[language]}
          </Badge>
          <Badge className={statusConfig.bg} data-testid="badge-status">
            {statusConfig.label[language]}
          </Badge>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t.overview}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t.unit}</p>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span className="font-medium">{unitInfo?.unit?.unitNumber || '-'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t.condominium}</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{unitInfo?.condo?.name || '-'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t.category}</p>
                  <span className="font-medium capitalize">{ticket.category}</span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t.reported}</p>
                  <span className="font-medium">{ticket.reportedBy || createdByName || '-'}</span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t.assigned}</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{assignedName || '-'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t.created}</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">
                      {format(new Date(ticket.createdAt), 'dd MMM yyyy HH:mm', { locale: language === 'es' ? es : undefined })}
                    </span>
                  </div>
                </div>

                {ticket.scheduledDate && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t.scheduled}</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">
                        {format(new Date(ticket.scheduledDate), 'dd MMM yyyy HH:mm', { locale: language === 'es' ? es : undefined })}
                      </span>
                    </div>
                  </div>
                )}

                {ticket.resolvedDate && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t.resolved}</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium">
                        {format(new Date(ticket.resolvedDate), 'dd MMM yyyy HH:mm', { locale: language === 'es' ? es : undefined })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">{t.description}</p>
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {ticket.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{t.notes}</p>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">{ticket.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">{t.estimatedCost}</p>
                    {canModifyTicket && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingCost('estimated');
                          setCostValue(ticket.estimatedCost || "");
                        }}
                        data-testid="button-edit-estimated-cost"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-lg font-bold">{formatCurrency(ticket.estimatedCost)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">{t.actualCost}</p>
                    {canModifyTicket && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingCost('actual');
                          setCostValue(ticket.actualCost || "");
                        }}
                        data-testid="button-edit-actual-cost"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-bold text-green-600">{formatCurrency(ticket.actualCost)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t.timeline}
                </CardTitle>
                <Button size="sm" onClick={() => setShowUpdateDialog(true)} data-testid="button-add-update">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.addUpdate}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {updatesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !updates || updates.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="font-medium">{t.noUpdates}</p>
                  <p className="text-sm text-muted-foreground">{t.noUpdatesDesc}</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {updates.map((update, index) => {
                      const authorName = getUserName(update.createdBy);
                      const isStatusChange = update.type === 'status_change';
                      const statusSnapshot = update.statusSnapshot ? statusColors[update.statusSnapshot] : null;

                      return (
                        <div key={update.id} className="relative pl-6 pb-4 border-l-2 border-muted last:border-0">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary" />
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{updateTypeLabels[update.type]?.[language] || update.type}</Badge>
                                {statusSnapshot && isStatusChange && (
                                  <Badge className={statusSnapshot.bg}>
                                    {statusSnapshot.label[language]}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(update.createdAt), 'dd MMM yyyy HH:mm', { locale: language === 'es' ? es : undefined })}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{update.notes}</p>
                            <p className="text-xs text-muted-foreground">Por: {authorName}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Photos Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {t.photos}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {photosLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="aspect-square" />
                  <Skeleton className="aspect-square" />
                </div>
              ) : !photos || photos.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">{t.noPhotos}</p>
                  <p className="text-xs text-muted-foreground">{t.noPhotosDesc}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(['before', 'during', 'after', 'other'] as const).map(phase => {
                    const phasePhotos = photos.filter(p => p.phase === phase);
                    if (phasePhotos.length === 0) return null;

                    const phaseConfig = phaseColors[phase];

                    return (
                      <div key={phase} className="space-y-2">
                        <Badge className={phaseConfig.bg}>{phaseConfig.label[language]}</Badge>
                        <div className="grid grid-cols-2 gap-2">
                          {phasePhotos.map(photo => (
                            <div key={photo.id} className="relative aspect-square rounded-md overflow-hidden border">
                              <img
                                src={photo.storageKey}
                                alt={photo.caption || ''}
                                className="object-cover w-full h-full"
                              />
                              {photo.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                                  {photo.caption}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.addUpdate}</DialogTitle>
            <DialogDescription>
              {language === 'es' 
                ? 'Registra el progreso o cambios en el trabajo de mantenimiento'
                : 'Record progress or changes in the maintenance work'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.updateType}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-update-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comment">{updateTypeLabels.comment[language]}</SelectItem>
                        {canModifyTicket && (
                          <SelectItem value="status_change">{updateTypeLabels.status_change[language]}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('type') === 'status_change' && (
                <FormField
                  control={form.control}
                  name="newStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.newStatus}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-new-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">{statusColors.open.label[language]}</SelectItem>
                          <SelectItem value="in_progress">{statusColors.in_progress.label[language]}</SelectItem>
                          <SelectItem value="resolved">{statusColors.resolved.label[language]}</SelectItem>
                          <SelectItem value="closed">{statusColors.closed.label[language]}</SelectItem>
                          <SelectItem value="on_hold">{statusColors.on_hold.label[language]}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.updateNotes}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} data-testid="textarea-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowUpdateDialog(false)}>
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={createUpdateMutation.isPending}>
                  {createUpdateMutation.isPending ? t.saving : t.save}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Cost Edit Dialog */}
      <Dialog open={!!editingCost} onOpenChange={() => setEditingCost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCost === 'estimated' ? t.estimatedCost : t.actualCost}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{language === 'es' ? 'Monto (MXN)' : 'Amount (MXN)'}</label>
              <Input
                type="number"
                step="0.01"
                value={costValue}
                onChange={(e) => setCostValue(e.target.value)}
                placeholder="0.00"
                data-testid="input-cost"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCost(null)}>
                {t.cancel}
              </Button>
              <Button onClick={() => updateCostMutation.mutate()} disabled={updateCostMutation.isPending}>
                {updateCostMutation.isPending ? t.saving : t.save}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
