import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Building2, Home, Wrench, Pencil, ArrowUpDown, X, ChevronDown, LayoutGrid, Table as TableIcon, User, Mail, Phone, Search, Filter } from "lucide-react";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import React from "react";
import { z } from "zod";
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

const createAssignmentSchema = z.object({
  userId: z.string().min(1, "Worker required"),
  condominiumIds: z.array(z.string()).optional(),
  unitIds: z.array(z.string()).optional(),
  allUnitsPerCondo: z.record(z.boolean()).optional(), // { condoId: true/false }
});

type CreateAssignmentForm = z.infer<typeof createAssignmentSchema>;

const SPECIALTY_LABELS = {
  es: {
    encargado_mantenimiento: "Encargado de Mantenimiento",
    mantenimiento_general: "Mantenimiento General",
    electrico: "Eléctrico",
    plomero: "Plomero",
    refrigeracion: "Refrigeración",
    carpintero: "Carpintero",
    pintor: "Pintor",
    jardinero: "Jardinero",
    albanil: "Albañil",
    limpieza: "Limpieza",
  },
  en: {
    encargado_mantenimiento: "Maintenance Manager",
    mantenimiento_general: "General Maintenance",
    electrico: "Electrician",
    plomero: "Plumber",
    refrigeracion: "HVAC",
    carpintero: "Carpenter",
    pintor: "Painter",
    jardinero: "Gardener",
    albanil: "Mason",
    limpieza: "Cleaning",
  },
};

export default function ExternalMaintenanceWorkers() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isMobile = useMobile();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(null);
  const [assignmentType, setAssignmentType] = useState<"condominium" | "unit">("condominium");
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"assignments" | "workers">("assignments");
  const [workersViewMode, setWorkersViewMode] = useState<"cards" | "table">("table");
  const [assignmentsViewMode, setAssignmentsViewMode] = useState<"cards" | "table">("table");
  const [manualViewModeOverride, setManualViewModeOverride] = useState(false);
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  
  // Workers search and filter
  const [workersSearchTerm, setWorkersSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [showWorkersFilters, setShowWorkersFilters] = useState(false);
  
  // Assignments pagination & sorting (shared between table and cards)
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [assignmentsPerPage, setAssignmentsPerPage] = useState(10);
  const [assignmentsSortColumn, setAssignmentsSortColumn] = useState<string>("");
  const [assignmentsSortDirection, setAssignmentsSortDirection] = useState<"asc" | "desc">("asc");
  
  // Workers pagination & sorting (shared between table and cards)
  const [workersPage, setWorkersPage] = useState(1);
  const [workersPerPage, setWorkersPerPage] = useState(10);
  const [workersSortColumn, setWorkersSortColumn] = useState<string>("");
  const [workersSortDirection, setWorkersSortDirection] = useState<"asc" | "desc">("asc");

  // Auto-switch view mode on genuine breakpoint transitions (only if no manual override)
  useEffect(() => {
    // Only act on actual breakpoint transitions (not every isMobile change)
    if (isMobile !== prevIsMobile) {
      setPrevIsMobile(isMobile);
      
      if (!manualViewModeOverride) {
        const preferredMode = isMobile ? "cards" : "table";
        setWorkersViewMode(preferredMode);
        setAssignmentsViewMode(preferredMode);
        setWorkersPerPage(10);
        setAssignmentsPerPage(10);
      }
    }
  }, [isMobile, prevIsMobile, manualViewModeOverride]);

  // Reset assignments page when items per page changes
  useEffect(() => {
    setAssignmentsPage(1);
  }, [assignmentsPerPage]);

  // Reset page to 1 when assignments view mode changes
  useEffect(() => {
    const defaultPerPage = 10;
    const validOptions = [10, 20, 30, 40];
    
    // Only auto-adjust if current value is not valid for the new mode
    if (!validOptions.includes(assignmentsPerPage)) {
      setAssignmentsPerPage(defaultPerPage);
    }
    setAssignmentsPage(1);
  }, [assignmentsViewMode, assignmentsPerPage]);

  // Reset page to 1 when workers view mode changes
  useEffect(() => {
    const defaultPerPage = 10;
    const validOptions = [10, 20, 30, 40];
    
    // Only auto-adjust if current value is not valid for the new mode
    if (!validOptions.includes(workersPerPage)) {
      setWorkersPerPage(defaultPerPage);
    }
    setWorkersPage(1);
  }, [workersViewMode, workersPerPage]);
  
  // Reset page when items per page changes (from user selecting different value)
  useEffect(() => {
    setWorkersPage(1);
  }, [workersPerPage]);
  
  // Reset page when search or filter changes
  useEffect(() => {
    setWorkersPage(1);
  }, [workersSearchTerm, selectedSpecialty]);

  // Static/semi-static data: agency users for worker selection
  const { data: allUsers, isLoading: loadingWorkers } = useQuery<any[]>({
    queryKey: ['/api/external-agency-users'],
    staleTime: 15 * 60 * 1000, // 15 minutes (rarely changes)
  });

  // Filter only maintenance workers (external_agency_maintenance role)
  const workers = allUsers?.filter(user => user.role === 'external_agency_maintenance') || [];

  // Real-time data: worker assignments (frequently updated)
  const { data: assignments, isLoading: loadingAssignments } = useQuery<any[]>({
    queryKey: ['/api/external-worker-assignments'],
  });

  // Static/semi-static data: condominiums for dropdowns
  const { data: condominiums } = useQuery<any[]>({
    queryKey: ['/api/external-condominiums'],
    staleTime: 15 * 60 * 1000, // 15 minutes (rarely changes)
  });

  // Static/semi-static data: units for dropdowns
  const { data: units } = useQuery<any[]>({
    queryKey: ['/api/external-units'],
    staleTime: 15 * 60 * 1000, // 15 minutes (rarely changes)
  });

  const form = useForm<CreateAssignmentForm>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      userId: "",
      condominiumIds: [],
      unitIds: [],
      allUnitsPerCondo: {},
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateAssignmentForm) => {
      // Build assignments array
      const assignments: any[] = [];
      const assignedUnitIds = new Set<string>();
      
      // Add condominium assignments
      if (data.condominiumIds && data.condominiumIds.length > 0) {
        for (const condoId of data.condominiumIds) {
          // Check if "all units" is selected for this condo
          if (data.allUnitsPerCondo?.[condoId]) {
            // Get all units for this condo and create individual assignments
            const condoUnits = units?.filter(u => u.condominiumId === condoId) || [];
            for (const unit of condoUnits) {
              if (!assignedUnitIds.has(unit.id)) {
                assignments.push({
                  userId: data.userId,
                  unitId: unit.id,
                });
                assignedUnitIds.add(unit.id);
              }
            }
          } else {
            // Just assign to the condominium
            assignments.push({
              userId: data.userId,
              condominiumId: condoId,
            });
          }
        }
      }
      
      // Add specific unit assignments (with deduplication)
      if (data.unitIds && data.unitIds.length > 0) {
        for (const unitId of data.unitIds) {
          if (!assignedUnitIds.has(unitId)) {
            assignments.push({
              userId: data.userId,
              unitId: unitId,
            });
            assignedUnitIds.add(unitId);
          }
        }
      }
      
      // Create all assignments in batch
      return await apiRequest("POST", "/api/external-worker-assignments/batch", { assignments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-worker-assignments'] });
      setIsCreateDialogOpen(false);
      const isEditing = editingWorkerId !== null;
      setEditingWorkerId(null);
      form.reset();
      toast({
        title: isEditing
          ? (language === "es" ? "Asignaciones actualizadas" : "Assignments updated")
          : (language === "es" ? "Asignaciones creadas" : "Assignments created"),
        description: isEditing
          ? (language === "es" 
              ? "Las asignaciones se actualizaron exitosamente"
              : "Assignments were updated successfully")
          : (language === "es" 
              ? "El trabajador ha sido asignado exitosamente"
              : "Worker has been assigned successfully"),
      });
    },
    onError: () => {
      const isEditing = editingWorkerId !== null;
      // Invalidate queries to ensure UI matches backend state
      queryClient.invalidateQueries({ queryKey: ['/api/external-worker-assignments'] });
      toast({
        title: language === "es" ? "Error" : "Error",
        description: isEditing
          ? (language === "es"
              ? "No se pudieron actualizar las asignaciones"
              : "Could not update assignments")
          : (language === "es"
              ? "No se pudieron crear las asignaciones"
              : "Could not create assignments"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (workerId: string) => {
      // Delete all assignments for this worker
      const workerAssignments = assignments?.filter(a => a.userId === workerId) || [];
      const deletePromises = workerAssignments.map(assignment =>
        apiRequest("DELETE", `/api/external-worker-assignments/${assignment.id}`, {})
      );
      return await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-worker-assignments'] });
      setDeleteAssignmentId(null);
      toast({
        title: language === "es" ? "Asignaciones eliminadas" : "Assignments deleted",
        description: language === "es" 
          ? "Todas las asignaciones del trabajador han sido eliminadas"
          : "All worker assignments have been deleted",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudieron eliminar las asignaciones"
          : "Could not delete assignments",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CreateAssignmentForm) => {
    // If editing, first delete all existing assignments for this worker
    if (editingWorkerId) {
      const workerAssignments = assignments?.filter(a => a.userId === editingWorkerId) || [];
      
      // Get unique assignment IDs to avoid duplicates
      const uniqueAssignmentIds = [...new Set(workerAssignments.map(a => a.id))];
      
      // Delete assignments sequentially to avoid race conditions
      for (const assignmentId of uniqueAssignmentIds) {
        try {
          await apiRequest("DELETE", `/api/external-worker-assignments/${assignmentId}`, {});
        } catch (error: any) {
          // Ignore 404 errors (assignment already deleted)
          if (error?.status !== 404) {
            toast({
              title: language === "es" ? "Error" : "Error",
              description: language === "es"
                ? "No se pudieron eliminar las asignaciones anteriores"
                : "Could not delete previous assignments",
              variant: "destructive",
            });
            return;
          }
        }
      }
    }
    
    createMutation.mutate(data);
  };

  const getWorkerName = (workerId: string) => {
    const worker = workers?.find(w => w.id === workerId);
    return worker ? `${worker.firstName} ${worker.lastName}` : workerId;
  };

  const getCondominiumName = (condominiumId: string | null) => {
    if (!condominiumId) return "-";
    const condo = condominiums?.find(c => c.id === condominiumId);
    return condo?.name || condominiumId;
  };

  const getUnitName = (unitId: string | null) => {
    if (!unitId) return "-";
    const unit = units?.find(u => u.id === unitId);
    return unit?.unitNumber || unitId;
  };

  // Group assignments by worker
  const groupedAssignments = React.useMemo(() => {
    if (!assignments || !workers) return [];
    
    const grouped = new Map<string, {
      worker: any;
      assignments: any[];
    }>();

    assignments.forEach((assignment) => {
      const workerId = assignment.userId;
      if (!grouped.has(workerId)) {
        const worker = workers.find(w => w.id === workerId);
        if (worker) {
          grouped.set(workerId, {
            worker,
            assignments: []
          });
        }
      }
      grouped.get(workerId)?.assignments.push(assignment);
    });

    return Array.from(grouped.values());
  }, [assignments, workers]);

  // Sort grouped assignments
  const sortedGroupedAssignments = useMemo(() => {
    return [...groupedAssignments].sort((a, b) => {
      if (!assignmentsSortColumn) return 0;
      
      let aVal: any;
      let bVal: any;
      
      if (assignmentsSortColumn === 'workerName') {
        aVal = `${a.worker.firstName} ${a.worker.lastName}`.toLowerCase();
        bVal = `${b.worker.firstName} ${b.worker.lastName}`.toLowerCase();
      } else if (assignmentsSortColumn === 'specialty') {
        aVal = a.worker.maintenanceSpecialty ? SPECIALTY_LABELS[language][a.worker.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS['es']].toLowerCase() : '';
        bVal = b.worker.maintenanceSpecialty ? SPECIALTY_LABELS[language][b.worker.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS['es']].toLowerCase() : '';
      } else if (assignmentsSortColumn === 'assignmentCount') {
        const aCount = a.assignments.length;
        const bCount = b.assignments.length;
        return assignmentsSortDirection === "asc" ? aCount - bCount : bCount - aCount;
      }
      
      if (typeof aVal === "string" || typeof bVal === "string") {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }
      
      if (aVal < bVal) return assignmentsSortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return assignmentsSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [groupedAssignments, assignmentsSortColumn, assignmentsSortDirection, language]);

  // Clamp assignments page
  useEffect(() => {
    if (sortedGroupedAssignments.length === 0) {
      setAssignmentsPage(1);
      return;
    }
    const maxPage = Math.ceil(sortedGroupedAssignments.length / assignmentsPerPage) || 1;
    if (assignmentsPage > maxPage) {
      setAssignmentsPage(maxPage);
    }
  }, [sortedGroupedAssignments.length, assignmentsPerPage, assignmentsPage]);

  // Paginate grouped assignments
  const paginatedGroupedAssignments = useMemo(() => {
    return sortedGroupedAssignments.slice((assignmentsPage - 1) * assignmentsPerPage, assignmentsPage * assignmentsPerPage);
  }, [sortedGroupedAssignments, assignmentsPage, assignmentsPerPage]);
  
  const assignmentsTotalPages = Math.ceil(sortedGroupedAssignments.length / assignmentsPerPage);

  // Filter and sort workers
  const sortedWorkers = useMemo(() => {
    // First filter
    let filtered = workers.filter(worker => {
      // Search filter
      if (workersSearchTerm) {
        const searchLower = workersSearchTerm.toLowerCase();
        const fullName = `${worker.firstName} ${worker.lastName}`.toLowerCase();
        const email = worker.email?.toLowerCase() || '';
        const phone = worker.phone?.toLowerCase() || '';
        
        if (!fullName.includes(searchLower) && !email.includes(searchLower) && !phone.includes(searchLower)) {
          return false;
        }
      }
      
      // Specialty filter
      if (selectedSpecialty && worker.maintenanceSpecialty !== selectedSpecialty) {
        return false;
      }
      
      return true;
    });
    
    // Then sort
    return [...filtered].sort((a, b) => {
      if (!workersSortColumn) return 0;
      
      let aVal: any = (a as any)[workersSortColumn];
      let bVal: any = (b as any)[workersSortColumn];
      
      if (workersSortColumn === 'workerName') {
        aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
        bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else if (workersSortColumn === 'specialty') {
        aVal = a.maintenanceSpecialty ? SPECIALTY_LABELS[language][a.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS['es']].toLowerCase() : '';
        bVal = b.maintenanceSpecialty ? SPECIALTY_LABELS[language][b.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS['es']].toLowerCase() : '';
      }
      
      if (typeof aVal === "string" || typeof bVal === "string") {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }
      
      if (aVal < bVal) return workersSortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return workersSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [workers, workersSortColumn, workersSortDirection, language, workersSearchTerm, selectedSpecialty]);

  // Clamp workers page
  useEffect(() => {
    if (sortedWorkers.length === 0) {
      setWorkersPage(1);
      return;
    }
    const maxPage = Math.ceil(sortedWorkers.length / workersPerPage) || 1;
    if (workersPage > maxPage) {
      setWorkersPage(maxPage);
    }
  }, [sortedWorkers.length, workersPerPage]);

  // Paginate workers
  const paginatedWorkers = useMemo(() => {
    return sortedWorkers.slice((workersPage - 1) * workersPerPage, workersPage * workersPerPage);
  }, [sortedWorkers, workersPage, workersPerPage]);
  
  const workersTotalPages = Math.ceil(sortedWorkers.length / workersPerPage);

  const handleAssignmentsSort = (column: string) => {
    if (assignmentsSortColumn === column) {
      setAssignmentsSortDirection(assignmentsSortDirection === "asc" ? "desc" : "asc");
    } else {
      setAssignmentsSortColumn(column);
      setAssignmentsSortDirection("asc");
    }
  };

  const handleWorkersSort = (column: string) => {
    if (workersSortColumn === column) {
      setWorkersSortDirection(workersSortDirection === "asc" ? "desc" : "asc");
    } else {
      setWorkersSortColumn(column);
      setWorkersSortDirection("asc");
    }
  };

  const handleEditWorker = (workerId: string) => {
    setEditingWorkerId(workerId);
    const workerAssignments = assignments?.filter(a => a.userId === workerId);
    if (workerAssignments && workerAssignments.length > 0) {
      const condoIds = workerAssignments
        .filter(a => a.condominiumId)
        .map(a => a.condominiumId as string);
      const unitIds = workerAssignments
        .filter(a => a.unitId)
        .map(a => a.unitId as string);
      
      // Calculate allUnitsPerCondo based on coverage
      const allUnitsPerCondo: Record<string, boolean> = {};
      condominiums?.forEach(condo => {
        const condoUnits = units?.filter(u => u.condominiumId === condo.id) || [];
        if (condoUnits.length > 0) {
          const assignedUnitsForCondo = unitIds.filter(unitId => 
            condoUnits.some(u => u.id === unitId)
          );
          // If all units of this condo are assigned, mark "all units" as true
          if (assignedUnitsForCondo.length === condoUnits.length) {
            allUnitsPerCondo[condo.id] = true;
            // Add condo to condoIds if not already there
            if (!condoIds.includes(condo.id)) {
              condoIds.push(condo.id);
            }
          }
        }
      });
      
      form.setValue("userId", workerId);
      form.setValue("condominiumIds", condoIds);
      form.setValue("unitIds", unitIds);
      form.setValue("allUnitsPerCondo", allUnitsPerCondo);
      setIsCreateDialogOpen(true);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {language === "es" ? "Trabajadores de Mantenimiento" : "Maintenance Workers"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Asigna trabajadores de mantenimiento a condominios y unidades"
              : "Assign maintenance workers to condominiums and units"}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingWorkerId(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-assignment" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Nueva Asignación" : "New Assignment"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh]" data-testid="dialog-create-assignment">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                {editingWorkerId 
                  ? (language === "es" ? "Editar Asignaciones" : "Edit Assignments")
                  : (language === "es" ? "Asignar Trabajador" : "Assign Worker")}
              </DialogTitle>
              <DialogDescription>
                {editingWorkerId 
                  ? (language === "es"
                      ? "Modifica las asignaciones del trabajador"
                      : "Modify worker assignments")
                  : (language === "es"
                      ? "Asigna un trabajador de mantenimiento a un condominio o unidad específica"
                      : "Assign a maintenance worker to a specific condominium or unit")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">{language === "es" ? "Trabajador" : "Worker"}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={editingWorkerId !== null}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-worker">
                            <SelectValue placeholder={language === "es" ? "Selecciona trabajador..." : "Select worker..."} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workers?.map((worker) => (
                            <SelectItem key={worker.id} value={worker.id}>
                              {worker.firstName} {worker.lastName}
                              {worker.maintenanceSpecialty && ` (${SPECIALTY_LABELS[language][worker.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS['es']]})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="grid md:grid-cols-[2fr,1fr] gap-6">
                  {/* Left Panel: Selection */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4" />
                        {language === "es" ? "Condominios y Unidades" : "Condominiums and Units"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {language === "es" 
                          ? "Selecciona los condominios o unidades específicas para asignar"
                          : "Select condominiums or specific units to assign"}
                      </p>
                    </div>

                    <ScrollArea className="h-[400px] border rounded-md">
                      <Accordion type="multiple" className="w-full px-4">
                        {condominiums?.map((condo) => {
                          const condoUnits = units?.filter(u => u.condominiumId === condo.id) || [];
                          const isCondoSelected = form.watch("condominiumIds")?.includes(condo.id);
                          const allUnitsSelected = form.watch("allUnitsPerCondo")?.[condo.id] || false;
                          const selectedUnitIds = form.watch("unitIds") || [];
                          const condoSelectedUnitsCount = condoUnits.filter(u => selectedUnitIds.includes(u.id)).length;
                          
                          return (
                            <AccordionItem key={condo.id} value={condo.id} data-testid={`accordion-condo-${condo.id}`}>
                              <div className="flex items-center gap-3 py-3">
                                <FormField
                                  control={form.control}
                                  name="condominiumIds"
                                  render={({ field }) => (
                                    <FormControl>
                                      <Checkbox
                                        checked={isCondoSelected}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([...(field.value || []), condo.id]);
                                          } else {
                                            field.onChange(field.value?.filter((value) => value !== condo.id));
                                            // Also clear the allUnitsPerCondo flag for this condo
                                            const currentAllUnits = form.getValues("allUnitsPerCondo") || {};
                                            form.setValue("allUnitsPerCondo", {
                                              ...currentAllUnits,
                                              [condo.id]: false,
                                            });
                                          }
                                        }}
                                        data-testid={`checkbox-condo-${condo.id}`}
                                      />
                                    </FormControl>
                                  )}
                                />
                                <AccordionTrigger className="hover:no-underline flex-1">
                                  <div className="flex items-center justify-between flex-1 pr-4">
                                    <div className="flex flex-col items-start">
                                      <span className="font-medium text-sm">{condo.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {condoUnits.length} {language === "es" ? "unidades" : "units"}
                                      </span>
                                    </div>
                                    {(isCondoSelected || condoSelectedUnitsCount > 0) && (
                                      <Badge variant="secondary" className="ml-2">
                                        {allUnitsSelected 
                                          ? `${condoUnits.length} ${language === "es" ? "unidades" : "units"}`
                                          : condoSelectedUnitsCount > 0
                                            ? `${condoSelectedUnitsCount} ${language === "es" ? "unidades" : "units"}`
                                            : language === "es" ? "Condominio" : "Condominium"}
                                      </Badge>
                                    )}
                                  </div>
                                </AccordionTrigger>
                              </div>
                              <AccordionContent className="pb-4">
                                <div className="space-y-3 pl-8">
                                  {/* All Units Toggle */}
                                  {isCondoSelected && (
                                    <FormField
                                      control={form.control}
                                      name="allUnitsPerCondo"
                                      render={({ field }) => (
                                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                          <div className="flex items-center gap-2">
                                            <Home className="h-4 w-4 text-muted-foreground" />
                                            <FormLabel className="text-sm font-medium cursor-pointer">
                                              {language === "es" ? "Todas las unidades" : "All units"}
                                            </FormLabel>
                                          </div>
                                          <FormControl>
                                            <Switch
                                              checked={field.value?.[condo.id] || false}
                                              onCheckedChange={(checked) => {
                                                field.onChange({
                                                  ...(field.value || {}),
                                                  [condo.id]: checked,
                                                });
                                                // Clear individual unit selections for this condo when "all units" is enabled
                                                if (checked) {
                                                  const currentUnitIds = form.getValues("unitIds") || [];
                                                  const condoUnitIds = condoUnits.map(u => u.id);
                                                  const filteredUnits = currentUnitIds.filter(id => !condoUnitIds.includes(id));
                                                  form.setValue("unitIds", filteredUnits);
                                                }
                                              }}
                                              data-testid={`switch-all-units-${condo.id}`}
                                            />
                                          </FormControl>
                                        </div>
                                      )}
                                    />
                                  )}

                                  {/* Individual Units */}
                                  <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground font-medium">
                                      {language === "es" ? "O selecciona unidades específicas:" : "Or select specific units:"}
                                    </p>
                                    <ScrollArea className="max-h-[200px]">
                                      <div className="space-y-2 pr-4">
                                        {condoUnits.map((unit) => (
                                          <FormField
                                            key={unit.id}
                                            control={form.control}
                                            name="unitIds"
                                            render={({ field }) => (
                                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                <FormControl>
                                                  <Checkbox
                                                    checked={field.value?.includes(unit.id)}
                                                    disabled={allUnitsSelected}
                                                    onCheckedChange={(checked) => {
                                                      if (checked) {
                                                        field.onChange([...(field.value || []), unit.id]);
                                                        // Turn off "all units" switch when selecting individual units
                                                        const currentAllUnits = form.getValues("allUnitsPerCondo") || {};
                                                        if (currentAllUnits[condo.id]) {
                                                          form.setValue("allUnitsPerCondo", {
                                                            ...currentAllUnits,
                                                            [condo.id]: false,
                                                          });
                                                        }
                                                      } else {
                                                        field.onChange(field.value?.filter((value) => value !== unit.id));
                                                      }
                                                    }}
                                                    data-testid={`checkbox-unit-${unit.id}`}
                                                  />
                                                </FormControl>
                                                <FormLabel className={`text-sm font-normal cursor-pointer ${allUnitsSelected ? 'text-muted-foreground' : ''}`}>
                                                  {language === "es" ? "Unidad" : "Unit"} {unit.unitNumber}
                                                </FormLabel>
                                              </FormItem>
                                            )}
                                          />
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </ScrollArea>
                  </div>

                  {/* Right Panel: Summary */}
                  <div className="space-y-4">
                    <Card className="sticky top-0">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {language === "es" ? "Resumen de Asignación" : "Assignment Summary"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Selected Condominiums */}
                        {form.watch("condominiumIds")?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                              {language === "es" ? "Condominios" : "Condominiums"}
                            </p>
                            <div className="space-y-2">
                              {form.watch("condominiumIds")?.map((condoId: string) => {
                                const condo = condominiums?.find(c => c.id === condoId);
                                const allUnitsForCondo = form.watch("allUnitsPerCondo")?.[condoId];
                                const condoUnits = units?.filter(u => u.condominiumId === condoId) || [];
                                
                                return (
                                  <div key={condoId} className="flex items-start justify-between gap-2 p-2 bg-muted/50 rounded-md">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <Building2 className="h-3 w-3 flex-shrink-0" />
                                        <p className="text-sm font-medium truncate">{condo?.name}</p>
                                      </div>
                                      {allUnitsForCondo && (
                                        <p className="text-xs text-muted-foreground ml-5">
                                          {condoUnits.length} {language === "es" ? "unidades" : "units"}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 flex-shrink-0"
                                      onClick={() => {
                                        const currentCondos = form.getValues("condominiumIds") || [];
                                        form.setValue("condominiumIds", currentCondos.filter(id => id !== condoId));
                                        const currentAllUnits = form.getValues("allUnitsPerCondo") || {};
                                        form.setValue("allUnitsPerCondo", {
                                          ...currentAllUnits,
                                          [condoId]: false,
                                        });
                                        // Also remove any specific unit selections for this condo
                                        const currentUnitIds = form.getValues("unitIds") || [];
                                        const condoUnitIds = condoUnits.map(u => u.id);
                                        const filteredUnits = currentUnitIds.filter(id => !condoUnitIds.includes(id));
                                        form.setValue("unitIds", filteredUnits);
                                      }}
                                      data-testid={`button-remove-condo-${condoId}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Selected Units */}
                        {form.watch("unitIds")?.length > 0 && (
                          <div className="space-y-2">
                            <Separator />
                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                              {language === "es" ? "Unidades Específicas" : "Specific Units"}
                            </p>
                            <ScrollArea className="max-h-[200px]">
                              <div className="space-y-2 pr-2">
                                {form.watch("unitIds")?.map((unitId: string) => {
                                  const unit = units?.find(u => u.id === unitId);
                                  const condo = condominiums?.find(c => c.id === unit?.condominiumId);
                                  
                                  return (
                                    <div key={unitId} className="flex items-start justify-between gap-2 p-2 bg-muted/50 rounded-md">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <Home className="h-3 w-3 flex-shrink-0" />
                                          <p className="text-sm font-medium">
                                            {language === "es" ? "Unidad" : "Unit"} {unit?.unitNumber}
                                          </p>
                                        </div>
                                        <p className="text-xs text-muted-foreground ml-5 truncate">{condo?.name}</p>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 flex-shrink-0"
                                        onClick={() => {
                                          const currentUnits = form.getValues("unitIds") || [];
                                          form.setValue("unitIds", currentUnits.filter(id => id !== unitId));
                                        }}
                                        data-testid={`button-remove-unit-${unitId}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </ScrollArea>
                          </div>
                        )}

                        {/* Empty State */}
                        {(!form.watch("condominiumIds") || form.watch("condominiumIds")?.length === 0) &&
                         (!form.watch("unitIds") || form.watch("unitIds")?.length === 0) && (
                          <div className="text-center py-8">
                            <Building2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {language === "es" 
                                ? "No hay selecciones aún"
                                : "No selections yet"}
                            </p>
                          </div>
                        )}

                        {/* Total Count */}
                        {((form.watch("condominiumIds")?.length || 0) > 0 || (form.watch("unitIds")?.length || 0) > 0) && (
                          <>
                            <Separator />
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{language === "es" ? "Total:" : "Total:"}</span>
                              <span className="font-bold">
                                {(form.watch("condominiumIds")?.length || 0) + (form.watch("unitIds")?.length || 0)}{" "}
                                {language === "es" ? "asignaciones" : "assignments"}
                              </span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-assignment">
                    {createMutation.isPending 
                      ? (language === "es" ? "Asignando..." : "Assigning...")
                      : (language === "es" ? "Asignar Trabajador" : "Assign Worker")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="assignments" value={activeTab} onValueChange={(value) => setActiveTab(value as "assignments" | "workers")} className="w-full">
        <TabsList>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            {language === "es" ? "Asignaciones" : "Assignments"}
          </TabsTrigger>
          <TabsTrigger value="workers" data-testid="tab-workers">
            {language === "es" ? "Trabajadores" : "Workers"}
          </TabsTrigger>
        </TabsList>

        {/* Search and Filters - Visible in all tabs */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === "es" ? "Buscar trabajadores..." : "Search workers..."}
                  value={workersSearchTerm}
                  onChange={(e) => setWorkersSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-workers-search"
                />
              </div>

              {/* Filter Button with Popover */}
              <Popover open={showWorkersFilters} onOpenChange={setShowWorkersFilters}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="flex-shrink-0 relative"
                    data-testid="button-workers-filters"
                  >
                    <Filter className="h-4 w-4" />
                    {selectedSpecialty && (
                      <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                        1
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">
                        {language === 'es' ? 'Filtrar por especialidad' : 'Filter by specialty'}
                      </h4>
                      
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={selectedSpecialty === null ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSpecialty(null)}
                          data-testid="button-filter-specialty-all"
                        >
                          {language === 'es' ? 'Todas' : 'All'}
                        </Button>
                        {Object.keys(SPECIALTY_LABELS.es).map((specialty) => (
                          <Button
                            key={specialty}
                            variant={selectedSpecialty === specialty ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedSpecialty(specialty)}
                            data-testid={`button-filter-specialty-${specialty}`}
                          >
                            {SPECIALTY_LABELS[language][specialty as keyof typeof SPECIALTY_LABELS['es']]}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    {selectedSpecialty && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSpecialty(null)}
                        className="w-full"
                        data-testid="button-clear-workers-filters"
                      >
                        <X className="h-4 w-4 mr-2" />
                        {language === 'es' ? 'Limpiar filtros' : 'Clear filters'}
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* View Mode Toggle - Desktop only, context-aware */}
              {!isMobile && (
                <>
                  <Button
                    variant={(activeTab === "assignments" ? assignmentsViewMode : workersViewMode) === "cards" ? "default" : "outline"}
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => {
                      if (activeTab === "assignments") {
                        setAssignmentsViewMode("cards");
                      } else {
                        setWorkersViewMode("cards");
                      }
                      setManualViewModeOverride(false);
                    }}
                    data-testid="button-view-cards"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={(activeTab === "assignments" ? assignmentsViewMode : workersViewMode) === "table" ? "default" : "outline"}
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => {
                      if (activeTab === "assignments") {
                        setAssignmentsViewMode("table");
                      } else {
                        setWorkersViewMode("table");
                      }
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

        <TabsContent value="assignments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "es" ? "Asignaciones Actuales" : "Current Assignments"}</CardTitle>
              <CardDescription>
                {language === "es" 
                  ? "Lista de trabajadores asignados a condominios y unidades"
                  : "List of workers assigned to condominiums and units"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAssignments ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !assignments || assignments.length === 0 ? (
                <div className="text-center py-8" data-testid="div-no-assignments">
                  <p className="text-muted-foreground">
                    {language === "es" 
                      ? "No hay asignaciones creadas aún"
                      : "No assignments created yet"}
                  </p>
                </div>
              ) : (
                <>
                  {assignmentsViewMode === "cards" ? (
                    <>
                      {/* Assignments Cards Pagination Controls */}
                      <ExternalPaginationControls
                        currentPage={assignmentsPage}
                        totalPages={assignmentsTotalPages}
                        itemsPerPage={assignmentsPerPage}
                        onPageChange={setAssignmentsPage}
                        onItemsPerPageChange={(value) => {
                          setAssignmentsPerPage(value);
                          setAssignmentsPage(1);
                        }}
                        language={language}
                        testIdPrefix="assignments-cards"
                      />

                      {/* Cards View */}
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {paginatedGroupedAssignments.map(({ worker, assignments: workerAssignments }) => (
                            <Card key={worker.id} className="hover-elevate flex flex-col" data-testid={`card-assignment-${worker.id}`}>
                              <CardHeader className="space-y-2">
                                <CardTitle className="text-lg flex items-start gap-2">
                                  <Wrench className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <span className="flex-1 min-w-0 break-words" data-testid={`text-assignment-worker-name-${worker.id}`}>
                                    {worker.firstName} {worker.lastName}
                                  </span>
                                </CardTitle>
                                {worker.maintenanceSpecialty && (
                                  <Badge variant="secondary" className="flex-shrink-0 self-start" data-testid={`badge-assignment-specialty-${worker.id}`}>
                                    <Wrench className="h-3 w-3 mr-1 flex-shrink-0" />
                                    {SPECIALTY_LABELS[language][worker.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS['es']]}
                                  </Badge>
                                )}
                              </CardHeader>
                              <CardContent className="space-y-3 flex-1 flex flex-col">
                                {/* Assignments List */}
                                <div className="space-y-2 flex-1">
                                  <h4 className="text-sm font-medium text-muted-foreground">
                                    {language === "es" ? "Asignaciones:" : "Assignments:"}
                                  </h4>
                                  <ScrollArea className="max-h-[200px]">
                                    <div className="flex flex-wrap gap-2 pr-4">
                                      {workerAssignments.map((assignment) => (
                                        <div key={assignment.id} className="flex items-center gap-1">
                                          {assignment.condominiumId && (
                                            <Badge variant="outline" className="flex items-center gap-1" data-testid={`badge-condo-${assignment.id}`}>
                                              <Building2 className="h-3 w-3 flex-shrink-0" />
                                              <span className="break-words">{getCondominiumName(assignment.condominiumId)}</span>
                                            </Badge>
                                          )}
                                          {assignment.unitId && (
                                            <Badge variant="outline" className="flex items-center gap-1" data-testid={`badge-unit-${assignment.id}`}>
                                              <Home className="h-3 w-3 flex-shrink-0" />
                                              <span className="break-words">{getUnitName(assignment.unitId)}</span>
                                            </Badge>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </div>
                                
                                {/* Assignment Count */}
                                <div className="text-sm text-muted-foreground pt-2 border-t">
                                  <span className="font-medium">
                                    {workerAssignments.length} {language === "es" ? "asignaciones" : "assignments"}
                                  </span>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex gap-2 pt-2 border-t">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleEditWorker(worker.id)}
                                    data-testid={`button-card-edit-${worker.id}`}
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    {language === "es" ? "Editar" : "Edit"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                      if (workerAssignments.length > 0) {
                                        setDeleteAssignmentId(worker.id);
                                      }
                                    }}
                                    data-testid={`button-card-delete-${worker.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {language === "es" ? "Eliminar" : "Delete"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Assignments Table Pagination Controls */}
                      <ExternalPaginationControls
                        currentPage={assignmentsPage}
                        totalPages={assignmentsTotalPages}
                        itemsPerPage={assignmentsPerPage}
                        onPageChange={setAssignmentsPage}
                        onItemsPerPageChange={(value) => {
                          setAssignmentsPerPage(value);
                          setAssignmentsPage(1);
                        }}
                        language={language}
                        testIdPrefix="assignments-table"
                      />

                      {/* Table View */}
                      <div className="w-full overflow-x-auto">
                        <Table className="text-xs">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="h-9 px-2 min-w-[180px]">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAssignmentsSort("workerName")}
                                  className="hover-elevate gap-1 h-7 text-xs"
                                  data-testid="sort-worker-name"
                                >
                                  {language === "es" ? "Trabajador" : "Worker"}
                                  <ArrowUpDown className="h-3 w-3" />
                                </Button>
                              </TableHead>
                              <TableHead className="h-9 px-2 min-w-[130px]">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAssignmentsSort("specialty")}
                                  className="hover-elevate gap-1 h-7 text-xs"
                                  data-testid="sort-specialty"
                                >
                                  {language === "es" ? "Especialidad" : "Specialty"}
                                  <ArrowUpDown className="h-3 w-3" />
                                </Button>
                              </TableHead>
                              <TableHead className="h-9 px-2 min-w-[280px]">
                                {language === "es" ? "Asignaciones" : "Assignments"}
                              </TableHead>
                              <TableHead className="h-9 px-2 text-right min-w-[120px]">
                                {language === "es" ? "Acciones" : "Actions"}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedGroupedAssignments.map(({ worker, assignments: workerAssignments }) => (
                            <TableRow key={worker.id} data-testid={`row-worker-${worker.id}`}>
                              <TableCell className="px-2 py-2 font-medium">
                                <div className="flex items-center gap-2">
                                  <Wrench className="h-3 w-3 text-muted-foreground" />
                                  {worker.firstName} {worker.lastName}
                                </div>
                              </TableCell>
                              <TableCell className="px-2 py-2">
                                {worker.maintenanceSpecialty ? (
                                  <Badge variant="secondary" className="text-xs">
                                    {SPECIALTY_LABELS[language][worker.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS['es']]}
                                  </Badge>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="px-2 py-2">
                                <div className="flex flex-wrap gap-1">
                                  {workerAssignments.map((assignment) => (
                                    <div key={assignment.id} className="flex items-center gap-1">
                                      {assignment.condominiumId && (
                                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                          <Building2 className="h-3 w-3" />
                                          {getCondominiumName(assignment.condominiumId)}
                                        </Badge>
                                      )}
                                      {assignment.unitId && (
                                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                          <Home className="h-3 w-3" />
                                          {getUnitName(assignment.unitId)}
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="px-2 py-2 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleEditWorker(worker.id)}
                                    data-testid={`button-edit-${worker.id}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      // Delete all assignments for this worker
                                      if (workerAssignments.length > 0) {
                                        setDeleteAssignmentId(worker.id);
                                      }
                                    }}
                                    data-testid={`button-delete-${worker.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "es" ? "Trabajadores Disponibles" : "Available Workers"}</CardTitle>
              <CardDescription>
                {language === "es" 
                  ? "Lista de trabajadores de mantenimiento de tu agencia"
                  : "List of your agency's maintenance workers"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWorkers ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !workers || workers.length === 0 ? (
                <div className="text-center py-8" data-testid="div-no-workers">
                  <p className="text-muted-foreground">
                    {language === "es" 
                      ? "No hay trabajadores de mantenimiento creados aún. Crea usuarios con rol de Mantenimiento en la página de Cuentas."
                      : "No maintenance workers created yet. Create users with Maintenance role in the Accounts page."}
                  </p>
                </div>
              ) : (
                <>
                  {workersViewMode === "cards" ? (
                    <>
                      {/* Workers Cards Pagination Controls */}
                      <ExternalPaginationControls
                        currentPage={workersPage}
                        totalPages={workersTotalPages}
                        itemsPerPage={workersPerPage}
                        onPageChange={setWorkersPage}
                        onItemsPerPageChange={(value) => {
                          setWorkersPerPage(value);
                          setWorkersPage(1);
                        }}
                        language={language}
                        testIdPrefix="workers-cards"
                      />

                      {/* Cards View */}
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {paginatedWorkers.map((worker) => (
                          <Card key={worker.id} className="hover-elevate" data-testid={`card-worker-${worker.id}`}>
                            <CardHeader className="space-y-2">
                              <CardTitle className="text-lg flex items-start gap-2">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <span className="flex-1 min-w-0 break-words" data-testid={`text-worker-name-${worker.id}`}>
                                  {worker.firstName} {worker.lastName}
                                </span>
                              </CardTitle>
                              {worker.maintenanceSpecialty && (
                                <Badge variant="secondary" className="flex-shrink-0 self-start" data-testid={`badge-specialty-${worker.id}`}>
                                  <Wrench className="h-3 w-3 mr-1 flex-shrink-0" />
                                  {SPECIALTY_LABELS[language][worker.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS['es']]}
                                </Badge>
                              )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {/* Email */}
                              <div className="flex items-start gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <span className="flex-1 min-w-0 break-words" data-testid={`text-worker-email-${worker.id}`}>
                                  {worker.email}
                                </span>
                              </div>
                              
                              {/* Phone */}
                              {worker.phone && (
                                <div className="flex items-start gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <span className="flex-1 min-w-0 break-words" data-testid={`text-worker-phone-${worker.id}`}>
                                    {worker.phone}
                                  </span>
                                </div>
                              )}
                              
                              {/* Assignment Stats */}
                              <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground pt-2 border-t">
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3 flex-shrink-0" />
                                  <span>
                                    {assignments?.filter(a => a.userId === worker.id && a.condominiumId).length || 0}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Home className="h-3 w-3 flex-shrink-0" />
                                  <span>
                                    {assignments?.filter(a => a.userId === worker.id && a.unitId).length || 0}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Workers Table Pagination Controls */}
                      <ExternalPaginationControls
                        currentPage={workersPage}
                        totalPages={workersTotalPages}
                        itemsPerPage={workersPerPage}
                        onPageChange={setWorkersPage}
                        onItemsPerPageChange={(value) => {
                          setWorkersPerPage(value);
                          setWorkersPage(1);
                        }}
                        language={language}
                        testIdPrefix="workers-table"
                      />

                      {/* Table View */}
                      <div className="w-full overflow-x-auto">
                        <Table className="text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="h-9 px-2 min-w-[180px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWorkersSort("workerName")}
                              className="hover-elevate gap-1 h-7 text-xs"
                              data-testid="sort-worker-name-workers"
                            >
                              {language === "es" ? "Nombre" : "Name"}
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </TableHead>
                          <TableHead className="h-9 px-2 min-w-[180px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWorkersSort("email")}
                              className="hover-elevate gap-1 h-7 text-xs"
                              data-testid="sort-email"
                            >
                              Email
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </TableHead>
                          <TableHead className="h-9 px-2 min-w-[130px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWorkersSort("phone")}
                              className="hover-elevate gap-1 h-7 text-xs"
                              data-testid="sort-phone"
                            >
                              {language === "es" ? "Teléfono" : "Phone"}
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </TableHead>
                          <TableHead className="h-9 px-2 min-w-[130px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWorkersSort("specialty")}
                              className="hover-elevate gap-1 h-7 text-xs"
                              data-testid="sort-specialty-workers"
                            >
                              {language === "es" ? "Especialidad" : "Specialty"}
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedWorkers.map((worker) => (
                          <TableRow key={worker.id} data-testid={`row-worker-${worker.id}`}>
                            <TableCell className="px-2 py-2 font-medium">
                              {worker.firstName} {worker.lastName}
                            </TableCell>
                            <TableCell className="px-2 py-2">{worker.email}</TableCell>
                            <TableCell className="px-2 py-2">{worker.phone || '-'}</TableCell>
                            <TableCell className="px-2 py-2">
                              {worker.maintenanceSpecialty ? (
                                <Badge variant="secondary" className="text-xs">
                                  {SPECIALTY_LABELS[language][worker.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS['es']]}
                                </Badge>
                              ) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </>
            )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteAssignmentId !== null} onOpenChange={(open) => !open && setDeleteAssignmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "es" ? "¿Eliminar todas las asignaciones?" : "Delete all assignments?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es"
                ? "Esta acción no se puede deshacer. Se eliminarán todas las asignaciones de este trabajador."
                : "This action cannot be undone. All assignments for this worker will be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {language === "es" ? "Cancelar" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAssignmentId && deleteMutation.mutate(deleteAssignmentId)}
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
