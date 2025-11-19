import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, Plus, AlertCircle, AlertTriangle, Filter, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalMaintenanceTicket, ExternalCondominium, ExternalUnit, ExternalWorkerAssignment } from "@shared/schema";
import { insertExternalMaintenanceTicketSchema } from "@shared/schema";
import { z } from "zod";
import { format, toZonedTime, fromZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";

type MaintenanceFormData = z.infer<typeof insertExternalMaintenanceTicketSchema>;

const serviceTypeColors: Record<string, { bg: string; label: { es: string; en: string } }> = {
  plumbing: {
    bg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    label: { es: "Plomería", en: "Plumbing" }
  },
  electrical: {
    bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    label: { es: "Eléctrico", en: "Electrical" }
  },
  appliances: {
    bg: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
    label: { es: "Electrodomésticos", en: "Appliances" }
  },
  hvac: {
    bg: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    label: { es: "Climatización", en: "HVAC" }
  },
  general: {
    bg: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    label: { es: "General", en: "General" }
  },
  emergency: {
    bg: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    label: { es: "Emergencia", en: "Emergency" }
  },
  other: {
    bg: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300",
    label: { es: "Otro", en: "Other" }
  },
};

const statusColors: Record<string, { bg: string; label: { es: string; en: string } }> = {
  open: {
    bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
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
};

// Timezone constant for Cancun
const CANCUN_TIMEZONE = "America/Cancun";

export default function ExternalMaintenance() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "unit" | "condo">("all");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedCondoId, setSelectedCondoId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Form-specific states
  const [formCondominiumId, setFormCondominiumId] = useState<string>("");
  const [formDate, setFormDate] = useState<Date | undefined>(undefined);
  const [formTime, setFormTime] = useState<string>("09:00");

  const { data: maintenances, isLoading: maintenancesLoading, isError: maintenancesError } = useQuery<ExternalMaintenanceTicket[]>({
    queryKey: ['/api/external-tickets'],
  });

  const { data: condominiums, isLoading: condosLoading } = useQuery<ExternalCondominium[]>({
    queryKey: ['/api/external-condominiums'],
  });

  const { data: units, isLoading: unitsLoading } = useQuery<ExternalUnit[]>({
    queryKey: ['/api/external-units'],
  });

  const { data: agencyUsers } = useQuery<any[]>({
    queryKey: ['/api/external-agency-users'],
  });

  const { data: workerAssignments } = useQuery<ExternalWorkerAssignment[]>({
    queryKey: ['/api/external-worker-assignments'],
  });

  // Filter to get only maintenance workers
  const maintenanceWorkers = agencyUsers?.filter(u => 
    u.role === 'external_agency_maintenance' && u.maintenanceSpecialty
  ) || [];

  // Filter units by selected condominium in form
  const filteredUnitsForForm = formCondominiumId 
    ? (units ?? []).filter(u => u.condominiumId === formCondominiumId)
    : [];

  // Filter workers by assignments to the selected unit or condominium
  // If no specific assignments exist, show all maintenance workers
  const getAvailableWorkersForLocation = (unitId: string | undefined) => {
    if (!unitId) return [];
    
    const unit = units?.find(u => u.id === unitId);
    if (!unit) return [];
    
    // Get workers assigned to this specific unit or to the entire condominium
    const assignedWorkerIds = workerAssignments
      ?.filter(a => 
        (a.unitId === unitId) || 
        (a.condominiumId === unit.condominiumId && !a.unitId)
      )
      .map(a => a.userId) || [];
    
    // If there are specific assignments, return those workers
    // Otherwise, return all maintenance workers (fallback)
    if (assignedWorkerIds.length > 0) {
      return maintenanceWorkers.filter(w => assignedWorkerIds.includes(w.id));
    }
    
    // No assignments - return all maintenance workers for this agency
    return maintenanceWorkers;
  };

  useEffect(() => {
    setSelectedUnitId(null);
    setSelectedCondoId(null);
  }, [filterType]);

  const maintenanceForm = useForm<MaintenanceFormData>({
    resolver: zodResolver(insertExternalMaintenanceTicketSchema),
    defaultValues: {
      unitId: "",
      title: "",
      description: "",
      category: "other",
      priority: "medium",
      status: "open",
      scheduledDate: undefined,
      assignedTo: undefined,
      notes: "",
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      return await apiRequest('POST', '/api/external-tickets', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-tickets'] });
      setShowMaintenanceDialog(false);
      maintenanceForm.reset();
      toast({
        title: language === "es" ? "Mantenimiento creado" : "Maintenance created",
        description: language === "es" ? "El trabajo de mantenimiento se creó exitosamente" : "The maintenance job was created successfully",
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

  const updateMaintenanceStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!user?.id) throw new Error("User not authenticated");
      return await apiRequest(`/api/external-tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, updatedByUserId: user.id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-tickets'] });
      toast({
        title: language === "es" ? "Estado actualizado" : "Status updated",
        description: language === "es" ? "El estado del mantenimiento se actualizó" : "The maintenance status was updated",
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

  const handleSubmitMaintenance = (data: MaintenanceFormData) => {
    // Combine date and time into Cancun timezone
    if (formDate && formTime) {
      const [hours, minutes] = formTime.split(':').map(Number);
      const combinedDate = new Date(formDate);
      combinedDate.setHours(hours, minutes, 0, 0);
      
      // Convert FROM Cancun timezone TO UTC
      const cancunDate = toZonedTime(combinedDate, CANCUN_TIMEZONE);
      data.scheduledDate = cancunDate;
    }
    
    createMaintenanceMutation.mutate(data);
  };

  const handleAddMaintenance = () => {
    maintenanceForm.reset({
      unitId: "",
      title: "",
      description: "",
      category: "other",
      priority: "medium",
      status: "open",
      scheduledDate: undefined,
      assignedTo: undefined,
      notes: "",
    });
    setFormCondominiumId("");
    setFormDate(undefined);
    setFormTime("09:00");
    setShowMaintenanceDialog(true);
  };

  const getFilteredMaintenances = () => {
    if (!maintenances) return null;
    if (unitsLoading || condosLoading) return null;
    if (!units || !condominiums) return null;

    let filtered = maintenances;

    if (filterType === "unit" && selectedUnitId) {
      filtered = filtered.filter(m => m.unitId === selectedUnitId);
    } else if (filterType === "condo" && selectedCondoId) {
      const condoUnitIds = (units ?? []).filter(u => u.condominiumId === selectedCondoId).map(u => u.id);
      filtered = filtered.filter(m => condoUnitIds.includes(m.unitId));
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(m => m.category === typeFilter);
    }

    return filtered.sort((a, b) => {
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });
  };

  const filteredMaintenances = getFilteredMaintenances();

  const getMaintenanceStats = () => {
    if (!filteredMaintenances) return { total: 0, open: 0, inProgress: 0, resolved: 0 };
    
    const total = filteredMaintenances.length;
    const open = filteredMaintenances.filter(m => m.status === 'open').length;
    const inProgress = filteredMaintenances.filter(m => m.status === 'in_progress').length;
    const resolved = filteredMaintenances.filter(m => m.status === 'resolved' || m.status === 'closed').length;

    return { total, open, inProgress, resolved };
  };

  const stats = getMaintenanceStats();

  const getUnitInfo = (unitId: string) => {
    const unit = (units ?? []).find(u => u.id === unitId);
    if (!unit) return null;
    const condo = (condominiums ?? []).find(c => c.id === unit.condominiumId);
    return { unit, condo };
  };

  const getAssignedUserName = (userId: string | null) => {
    if (!userId) return null;
    const user = (agencyUsers ?? []).find(u => u.id === userId);
    if (!user) return null;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    const specialty = user.maintenanceSpecialty;
    if (specialty) {
      const specialtyLabels: Record<string, { es: string; en: string }> = {
        encargado_mantenimiento: { es: "Encargado", en: "Manager" },
        mantenimiento_general: { es: "General", en: "General" },
        electrico: { es: "Eléctrico", en: "Electrical" },
        plomero: { es: "Plomero", en: "Plumber" },
        refrigeracion: { es: "Refrigeración", en: "HVAC" },
        carpintero: { es: "Carpintero", en: "Carpenter" },
        pintor: { es: "Pintor", en: "Painter" },
        jardinero: { es: "Jardinero", en: "Gardener" },
        albanil: { es: "Albañil", en: "Mason" },
        limpieza: { es: "Limpieza", en: "Cleaning" },
      };
      const specialtyLabel = specialtyLabels[specialty]?.[language] || specialty;
      return `${name} (${specialtyLabel})`;
    }
    return name;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Mantenimiento" : "Maintenance"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Gestiona el mantenimiento y servicios de tus propiedades"
              : "Manage maintenance and services for your properties"}
          </p>
        </div>
        <Button onClick={handleAddMaintenance} data-testid="button-add-maintenance">
          <Plus className="mr-2 h-4 w-4" />
          {language === "es" ? "Nuevo Mantenimiento" : "New Maintenance"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Total de Trabajos" : "Total Jobs"}
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-maintenances">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Abiertos" : "Open"}
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-open-maintenances">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "En Progreso" : "In Progress"}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-in-progress-maintenances">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Resueltos" : "Resolved"}
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-resolved-maintenances">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {language === "es" ? "Filtros" : "Filters"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "es" ? "Vista" : "View"}</label>
              <Select value={filterType} onValueChange={(value: any) => {
                setFilterType(value);
                setSelectedUnitId(null);
                setSelectedCondoId(null);
              }}>
                <SelectTrigger data-testid="select-filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                  <SelectItem value="condo">{language === "es" ? "Por Condominio" : "By Condominium"}</SelectItem>
                  <SelectItem value="unit">{language === "es" ? "Por Unidad" : "By Unit"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === "condo" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "es" ? "Condominio" : "Condominium"}</label>
                <Select 
                  value={selectedCondoId || ""} 
                  onValueChange={(value) => setSelectedCondoId(value || null)}
                >
                  <SelectTrigger data-testid="select-condominium">
                    <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {condominiums?.map(condo => (
                      <SelectItem key={condo.id} value={condo.id}>{condo.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filterType === "unit" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "es" ? "Unidad" : "Unit"}</label>
                <Select 
                  value={selectedUnitId || ""} 
                  onValueChange={(value) => setSelectedUnitId(value || null)}
                >
                  <SelectTrigger data-testid="select-unit">
                    <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {units?.map(unit => {
                      const condo = condominiums?.find(c => c.id === unit.condominiumId);
                      return (
                        <SelectItem key={unit.id} value={unit.id}>
                          {condo?.name} - {unit.unitNumber}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "es" ? "Estado" : "Status"}</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                  <SelectItem value="open">{language === "es" ? "Abierto" : "Open"}</SelectItem>
                  <SelectItem value="in_progress">{language === "es" ? "En Progreso" : "In Progress"}</SelectItem>
                  <SelectItem value="resolved">{language === "es" ? "Resuelto" : "Resolved"}</SelectItem>
                  <SelectItem value="closed">{language === "es" ? "Cerrado" : "Closed"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "es" ? "Tipo" : "Type"}</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="select-type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                  {Object.entries(serviceTypeColors).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      {config.label[language]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {maintenancesError ? (
        <Card data-testid="card-error-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium" data-testid="text-error-title">
              {language === "es" ? "Error al cargar mantenimientos" : "Error loading maintenances"}
            </p>
          </CardContent>
        </Card>
      ) : maintenancesLoading || condosLoading || unitsLoading || !filteredMaintenances ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredMaintenances.length > 0 ? (
        <div className="space-y-4">
          {filteredMaintenances.map((maintenance) => {
            const unitInfo = getUnitInfo(maintenance.unitId);
            const serviceTypeConfig = serviceTypeColors[maintenance.category] || serviceTypeColors['other'];
            const statusConfig = statusColors[maintenance.status] || statusColors['open'];
            const assignedUserName = getAssignedUserName(maintenance.assignedTo);

            return (
              <Card key={maintenance.id} data-testid={`card-maintenance-${maintenance.id}`} className="hover-elevate">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {unitInfo && (
                            <span className="font-semibold">
                              {unitInfo.condo?.name} - {language === "es" ? "Unidad" : "Unit"} {unitInfo.unit.unitNumber}
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {maintenance.title}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      {maintenance.scheduledDate && (
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(maintenance.scheduledDate), language === "es" ? "d 'de' MMMM, yyyy" : "MMMM d, yyyy", {
                            locale: language === "es" ? es : undefined
                          })}
                        </div>
                      )}
                      {assignedUserName && (
                        <div className="text-sm font-medium mt-1">
                          {assignedUserName}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={serviceTypeConfig.bg} data-testid={`badge-type-${maintenance.id}`}>
                        {serviceTypeConfig.label[language]}
                      </Badge>
                      <Badge className={statusConfig.bg} data-testid={`badge-status-${maintenance.id}`}>
                        {statusConfig.label[language]}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {maintenance.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateMaintenanceStatusMutation.mutate({ id: maintenance.id, status: 'in_progress' })}
                          disabled={updateMaintenanceStatusMutation.isPending || isLoadingAuth || !user}
                          data-testid={`button-start-${maintenance.id}`}
                        >
                          {language === "es" ? "Iniciar" : "Start"}
                        </Button>
                      )}
                      {maintenance.status === 'in_progress' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateMaintenanceStatusMutation.mutate({ id: maintenance.id, status: 'resolved' })}
                          disabled={updateMaintenanceStatusMutation.isPending || isLoadingAuth || !user}
                          data-testid={`button-complete-${maintenance.id}`}
                        >
                          {language === "es" ? "Completar" : "Complete"}
                        </Button>
                      )}
                    </div>
                  </div>
                  {maintenance.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">{maintenance.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card data-testid="card-empty-maintenances-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium" data-testid="text-empty-maintenances-title">
              {language === "es" ? "No hay trabajos de mantenimiento registrados" : "No maintenance jobs registered"}
            </p>
            <p className="text-sm text-muted-foreground mt-2" data-testid="text-empty-maintenances-description">
              {language === "es" 
                ? "Agrega el primer trabajo para comenzar"
                : "Add the first job to get started"}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-maintenance-form">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Nuevo Mantenimiento" : "New Maintenance"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Crea un nuevo trabajo de mantenimiento para una unidad"
                : "Create a new maintenance job for a unit"}
            </DialogDescription>
          </DialogHeader>
          <Form {...maintenanceForm}>
            <form onSubmit={maintenanceForm.handleSubmit(handleSubmitMaintenance)} className="space-y-4">
              {/* Step 1: Select Condominium */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "es" ? "Condominio" : "Condominium"} *</label>
                <select
                  value={formCondominiumId}
                  onChange={(e) => {
                    setFormCondominiumId(e.target.value);
                    maintenanceForm.setValue("unitId", ""); // Reset unit when condo changes
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  data-testid="select-maintenance-condominium"
                >
                  <option value="">{language === "es" ? "Selecciona un condominio" : "Select a condominium"}</option>
                  {condominiums?.map(condo => (
                    <option key={condo.id} value={condo.id}>{condo.name}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Unit (filtered by condominium) */}
              <FormField
                control={maintenanceForm.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Unidad" : "Unit"} *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        value={field.value || ""}
                        onChange={e => field.onChange(e.target.value)}
                        disabled={!formCondominiumId}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        data-testid="select-maintenance-unit"
                      >
                        <option value="">
                          {!formCondominiumId 
                            ? (language === "es" ? "Primero selecciona un condominio" : "First select a condominium")
                            : (language === "es" ? "Selecciona una unidad" : "Select a unit")}
                        </option>
                        {filteredUnitsForForm.map(unit => (
                          <option key={unit.id} value={unit.id}>
                            {unit.unitNumber}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={maintenanceForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Título" : "Title"} *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-maintenance-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={maintenanceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Descripción" : "Description"} *</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-maintenance-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={maintenanceForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Categoría" : "Category"} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-maintenance-category">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(serviceTypeColors).map(([type, config]) => (
                          <SelectItem key={type} value={type}>
                            {config.label[language]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date and Time Picker - Always Visible */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  {language === "es" ? "Fecha y Hora Programada" : "Scheduled Date & Time"}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Calendar */}
                  <div className="border rounded-md p-3">
                    <Calendar
                      mode="single"
                      selected={formDate}
                      onSelect={setFormDate}
                      locale={language === "es" ? es : undefined}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="mx-auto"
                      data-testid="calendar-maintenance-date"
                    />
                  </div>
                  
                  {/* Time Picker */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {language === "es" ? "Hora (Cancún)" : "Time (Cancun)"}
                      </span>
                    </div>
                    <Input
                      type="time"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full"
                      data-testid="input-maintenance-time"
                    />
                    {formDate && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">
                          {language === "es" ? "Programado para:" : "Scheduled for:"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(formDate, language === "es" ? "d 'de' MMMM, yyyy" : "MMMM d, yyyy", {
                            locale: language === "es" ? es : undefined
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formTime} ({CANCUN_TIMEZONE})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <FormField
                control={maintenanceForm.control}
                name="assignedTo"
                render={({ field }) => {
                  const selectedUnitId = maintenanceForm.watch("unitId");
                  const availableWorkers = getAvailableWorkersForLocation(selectedUnitId);
                  
                  return (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Asignar a" : "Assign to"}</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          value={field.value || ""}
                          onChange={e => field.onChange(e.target.value || undefined)}
                          disabled={!selectedUnitId}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                          data-testid="select-maintenance-assigned-user"
                        >
                          <option value="">
                            {!selectedUnitId 
                              ? (language === "es" ? "Primero selecciona una unidad" : "First select a unit")
                              : (language === "es" ? "Sin asignar" : "Unassigned")}
                          </option>
                          {availableWorkers.map(worker => {
                            const name = `${worker.firstName || ''} ${worker.lastName || ''}`.trim() || worker.email;
                            const specialtyLabels: Record<string, { es: string; en: string }> = {
                              encargado_mantenimiento: { es: "Encargado", en: "Manager" },
                              mantenimiento_general: { es: "General", en: "General" },
                              electrico: { es: "Eléctrico", en: "Electrical" },
                              plomero: { es: "Plomero", en: "Plumber" },
                              refrigeracion: { es: "Refrigeración", en: "HVAC" },
                              carpintero: { es: "Carpintero", en: "Carpenter" },
                              pintor: { es: "Pintor", en: "Painter" },
                              jardinero: { es: "Jardinero", en: "Gardener" },
                              albanil: { es: "Albañil", en: "Mason" },
                              limpieza: { es: "Limpieza", en: "Cleaning" },
                            };
                            const specialtyLabel = worker.maintenanceSpecialty ? 
                              (specialtyLabels[worker.maintenanceSpecialty]?.[language] || worker.maintenanceSpecialty) : '';
                            return (
                              <option key={worker.id} value={worker.id}>
                                {specialtyLabel ? `${name} (${specialtyLabel})` : name}
                              </option>
                            );
                          })}
                        </select>
                      </FormControl>
                      {selectedUnitId && availableWorkers.length > 0 && workerAssignments && workerAssignments.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {language === "es" 
                            ? "Mostrando trabajadores asignados a esta ubicación" 
                            : "Showing workers assigned to this location"}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={maintenanceForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Notas" : "Notes"}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="input-maintenance-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowMaintenanceDialog(false)}
                  data-testid="button-cancel-maintenance"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMaintenanceMutation.isPending}
                  data-testid="button-submit-maintenance"
                >
                  {createMaintenanceMutation.isPending
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (language === "es" ? "Guardar" : "Save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
