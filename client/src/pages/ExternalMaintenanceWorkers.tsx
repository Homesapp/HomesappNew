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
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Building2, Home } from "lucide-react";
import { useState } from "react";
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
  condominiumId: z.string().optional(),
  unitId: z.string().optional(),
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
      condominiumId: "",
      unitId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateAssignmentForm) => {
      const payload: any = { userId: data.userId };
      if (assignmentType === "condominium" && data.condominiumId) {
        payload.condominiumId = data.condominiumId;
      } else if (assignmentType === "unit" && data.unitId) {
        payload.unitId = data.unitId;
      }
      return await apiRequest("POST", "/api/external-worker-assignments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-worker-assignments'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: language === "es" ? "Asignación creada" : "Assignment created",
        description: language === "es" 
          ? "El trabajador ha sido asignado exitosamente"
          : "Worker has been assigned successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo crear la asignación"
          : "Could not create assignment",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/external-worker-assignments/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-worker-assignments'] });
      setDeleteAssignmentId(null);
      toast({
        title: language === "es" ? "Asignación eliminada" : "Assignment deleted",
        description: language === "es" 
          ? "La asignación ha sido eliminada"
          : "Assignment has been deleted",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo eliminar la asignación"
          : "Could not delete assignment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateAssignmentForm) => {
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-assignment">
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Nueva Asignación" : "New Assignment"}
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-assignment">
            <DialogHeader>
              <DialogTitle>
                {language === "es" ? "Asignar Trabajador" : "Assign Worker"}
              </DialogTitle>
              <DialogDescription>
                {language === "es"
                  ? "Asigna un trabajador de mantenimiento a un condominio o unidad específica"
                  : "Assign a maintenance worker to a specific condominium or unit"}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                <Tabs value={assignmentType} onValueChange={(value) => setAssignmentType(value as "condominium" | "unit")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="condominium" data-testid="tab-condominium">
                      <Building2 className="h-4 w-4 mr-2" />
                      {language === "es" ? "Condominio" : "Condominium"}
                    </TabsTrigger>
                    <TabsTrigger value="unit" data-testid="tab-unit">
                      <Home className="h-4 w-4 mr-2" />
                      {language === "es" ? "Unidad" : "Unit"}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="condominium" className="mt-4">
                    <FormField
                      control={form.control}
                      name="condominiumId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Condominio" : "Condominium"}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-condominium">
                                <SelectValue placeholder={language === "es" ? "Selecciona condominio..." : "Select condominium..."} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {condominiums?.map((condo) => (
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
                  </TabsContent>

                  <TabsContent value="unit" className="mt-4">
                    <FormField
                      control={form.control}
                      name="unitId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Unidad" : "Unit"}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-unit">
                                <SelectValue placeholder={language === "es" ? "Selecciona unidad..." : "Select unit..."} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {units?.map((unit) => (
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
                  </TabsContent>
                </Tabs>

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
                        <TableHead className="min-w-[200px]">
                          {language === "es" ? "Condominio" : "Condominium"}
                        </TableHead>
                        <TableHead className="min-w-[150px]">
                          {language === "es" ? "Unidad" : "Unit"}
                        </TableHead>
                        <TableHead className="text-right min-w-[100px]">
                          {language === "es" ? "Acciones" : "Actions"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id} data-testid={`row-assignment-${assignment.id}`}>
                          <TableCell className="font-medium">
                            {getWorkerName(assignment.userId)}
                          </TableCell>
                          <TableCell>
                            {assignment.condominiumId ? (
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {getCondominiumName(assignment.condominiumId)}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {assignment.unitId ? (
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-muted-foreground" />
                                {getUnitName(assignment.unitId)}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setDeleteAssignmentId(assignment.id)}
                              data-testid={`button-delete-${assignment.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
              {language === "es" ? "¿Eliminar asignación?" : "Delete assignment?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es"
                ? "Esta acción no se puede deshacer. El trabajador ya no estará asignado a esta ubicación."
                : "This action cannot be undone. The worker will no longer be assigned to this location."}
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
