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
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Building2, Home, Wrench, Pencil } from "lucide-react";
import { useState } from "react";
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(null);
  const [assignmentType, setAssignmentType] = useState<"condominium" | "unit">("condominium");
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  
  // Assignments table pagination & sorting
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [assignmentsPerPage, setAssignmentsPerPage] = useState(10);
  const [assignmentsSortColumn, setAssignmentsSortColumn] = useState<string>("");
  const [assignmentsSortDirection, setAssignmentsSortDirection] = useState<"asc" | "desc">("asc");
  
  // Workers table pagination & sorting
  const [workersPage, setWorkersPage] = useState(1);
  const [workersPerPage, setWorkersPerPage] = useState(10);
  const [workersSortColumn, setWorkersSortColumn] = useState<string>("");
  const [workersSortDirection, setWorkersSortDirection] = useState<"asc" | "desc">("asc");

  const { data: allUsers, isLoading: loadingWorkers } = useQuery<any[]>({
    queryKey: ['/api/external-agency-users'],
  });

  // Filter only maintenance workers (external_agency_maintenance role)
  const workers = allUsers?.filter(user => user.role === 'external_agency_maintenance') || [];

  const { data: assignments, isLoading: loadingAssignments } = useQuery<any[]>({
    queryKey: ['/api/external-worker-assignments'],
  });

  const { data: condominiums } = useQuery<any[]>({
    queryKey: ['/api/external-condominiums'],
  });

  const { data: units } = useQuery<any[]>({
    queryKey: ['/api/external-units'],
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
      
      // Add condominium assignments
      if (data.condominiumIds && data.condominiumIds.length > 0) {
        for (const condoId of data.condominiumIds) {
          // Check if "all units" is selected for this condo
          if (data.allUnitsPerCondo?.[condoId]) {
            // Get all units for this condo and create individual assignments
            const condoUnits = units?.filter(u => u.condominiumId === condoId) || [];
            for (const unit of condoUnits) {
              assignments.push({
                userId: data.userId,
                unitId: unit.id,
              });
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
      
      // Add specific unit assignments
      if (data.unitIds && data.unitIds.length > 0) {
        for (const unitId of data.unitIds) {
          assignments.push({
            userId: data.userId,
            unitId: unitId,
          });
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
      
      form.setValue("userId", workerId);
      form.setValue("condominiumIds", condoIds);
      form.setValue("unitIds", unitIds);
      setIsCreateDialogOpen(true);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
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
            <Button data-testid="button-create-assignment">
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Nueva Asignación" : "New Assignment"}
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-assignment">
            <DialogHeader>
              <DialogTitle>
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Trabajador" : "Worker"}</FormLabel>
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

                {/* Condominiums Section */}
                <FormField
                  control={form.control}
                  name="condominiumIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">
                          {language === "es" ? "Condominios" : "Condominiums"}
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          {language === "es" ? "Selecciona uno o más condominios" : "Select one or more condominiums"}
                        </p>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                        {condominiums?.map((condo) => (
                          <div key={condo.id} className="space-y-1">
                            <FormField
                              control={form.control}
                              name="condominiumIds"
                              render={({ field }) => {
                                return (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(condo.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), condo.id])
                                            : field.onChange(field.value?.filter((value) => value !== condo.id))
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {condo.name}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                            {/* "All units" checkbox for this condo */}
                            {form.watch("condominiumIds")?.includes(condo.id) && (
                              <FormField
                                control={form.control}
                                name="allUnitsPerCondo"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 ml-6">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.[condo.id] || false}
                                        onCheckedChange={(checked) => {
                                          field.onChange({
                                            ...(field.value || {}),
                                            [condo.id]: checked,
                                          });
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal text-muted-foreground cursor-pointer">
                                      {language === "es" ? "Todas las unidades" : "All units"}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Units Section */}
                <FormField
                  control={form.control}
                  name="unitIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">
                          {language === "es" ? "Unidades Específicas" : "Specific Units"}
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          {language === "es" ? "Selecciona unidades específicas adicionales" : "Select additional specific units"}
                        </p>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                        {units?.map((unit) => (
                          <FormField
                            key={unit.id}
                            control={form.control}
                            name="unitIds"
                            render={({ field }) => {
                              const condo = condominiums?.find(c => c.id === unit.condominiumId);
                              return (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(unit.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), unit.id])
                                          : field.onChange(field.value?.filter((value) => value !== unit.id))
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {unit.unitNumber} {condo && `(${condo.name})`}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

      <Tabs defaultValue="assignments" className="w-full">
        <TabsList>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            {language === "es" ? "Asignaciones" : "Assignments"}
          </TabsTrigger>
          <TabsTrigger value="workers" data-testid="tab-workers">
            {language === "es" ? "Trabajadores" : "Workers"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
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
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">
                          {language === "es" ? "Trabajador" : "Worker"}
                        </TableHead>
                        <TableHead className="min-w-[150px]">
                          {language === "es" ? "Especialidad" : "Specialty"}
                        </TableHead>
                        <TableHead className="min-w-[300px]">
                          {language === "es" ? "Asignaciones" : "Assignments"}
                        </TableHead>
                        <TableHead className="text-right min-w-[150px]">
                          {language === "es" ? "Acciones" : "Actions"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedAssignments.map(({ worker, assignments: workerAssignments }) => (
                        <TableRow key={worker.id} data-testid={`row-worker-${worker.id}`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-muted-foreground" />
                              {worker.firstName} {worker.lastName}
                            </div>
                          </TableCell>
                          <TableCell>
                            {worker.maintenanceSpecialty ? (
                              <Badge variant="secondary">
                                {SPECIALTY_LABELS[language][worker.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS['es']]}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {workerAssignments.map((assignment) => (
                                <div key={assignment.id} className="flex items-center gap-1">
                                  {assignment.condominiumId && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {getCondominiumName(assignment.condominiumId)}
                                    </Badge>
                                  )}
                                  {assignment.unitId && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Home className="h-3 w-3" />
                                      {getUnitName(assignment.unitId)}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers">
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
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">
                          {language === "es" ? "Nombre" : "Name"}
                        </TableHead>
                        <TableHead className="min-w-[200px]">Email</TableHead>
                        <TableHead className="min-w-[150px]">
                          {language === "es" ? "Teléfono" : "Phone"}
                        </TableHead>
                        <TableHead className="min-w-[150px]">
                          {language === "es" ? "Especialidad" : "Specialty"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workers.map((worker) => (
                        <TableRow key={worker.id} data-testid={`row-worker-${worker.id}`}>
                          <TableCell className="font-medium">
                            {worker.firstName} {worker.lastName}
                          </TableCell>
                          <TableCell>{worker.email}</TableCell>
                          <TableCell>{worker.phone || '-'}</TableCell>
                          <TableCell>
                            {worker.maintenanceSpecialty ? (
                              <Badge variant="secondary">
                                {SPECIALTY_LABELS[language][worker.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS['es']]}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
