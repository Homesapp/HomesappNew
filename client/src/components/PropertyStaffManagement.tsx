import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Plus, CheckCircle2, XCircle, ClipboardList, Calendar, AlertCircle } from "lucide-react";
import type { PropertyStaff, PropertyTask } from "@shared/schema";

interface PropertyStaffManagementProps {
  propertyId: string;
}

interface ExtendedPropertyStaff extends PropertyStaff {
  staffName?: string;
  staffEmail?: string;
}

interface ExtendedPropertyTask extends PropertyTask {
  assignedToName?: string;
}

const staffRoles = [
  { value: "cleaning", label: "Limpieza" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "concierge", label: "Concierge" },
  { value: "accounting", label: "Contabilidad" },
  { value: "legal", label: "Legal" },
];

const taskPriorities = [
  { value: "low", label: "Baja", color: "secondary" as const },
  { value: "medium", label: "Media", color: "default" as const },
  { value: "high", label: "Alta", color: "destructive" as const },
  { value: "urgent", label: "Urgente", color: "destructive" as const },
];

const taskStatuses = [
  { value: "pending", label: "Pendiente", icon: AlertCircle },
  { value: "in_progress", label: "En Progreso", icon: ClipboardList },
  { value: "completed", label: "Completada", icon: CheckCircle2 },
  { value: "cancelled", label: "Cancelada", icon: XCircle },
];

const staffFormSchema = z.object({
  staffId: z.string().min(1, "El ID del personal es requerido"),
  role: z.string().min(1, "El rol es requerido"),
});

const taskFormSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  priority: z.string().min(1, "La prioridad es requerida"),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;
type TaskFormValues = z.infer<typeof taskFormSchema>;

export function PropertyStaffManagement({ propertyId }: PropertyStaffManagementProps) {
  const { toast } = useToast();
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const staffForm = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      staffId: "",
      role: "",
    },
  });

  const taskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      assignedToId: "",
      dueDate: "",
    },
  });

  const { data: staff = [], isLoading: staffLoading } = useQuery<ExtendedPropertyStaff[]>({
    queryKey: ["/api/properties", propertyId, "staff"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<ExtendedPropertyTask[]>({
    queryKey: ["/api/properties", propertyId, "tasks"],
  });

  const addStaffMutation = useMutation({
    mutationFn: async (data: StaffFormValues) => {
      return apiRequest("POST", `/api/properties/${propertyId}/staff`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "staff"] });
      toast({ title: "Personal agregado", description: "El personal ha sido asignado exitosamente" });
      staffForm.reset();
      setStaffDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el personal",
        variant: "destructive",
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      return apiRequest("POST", `/api/properties/${propertyId}/tasks`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "tasks"] });
      toast({ title: "Tarea creada", description: "La tarea ha sido creada exitosamente" });
      taskForm.reset();
      setTaskDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la tarea",
        variant: "destructive",
      });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return apiRequest("PATCH", `/api/tasks/${taskId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "tasks"] });
      toast({ title: "Tarea actualizada", description: "El estado de la tarea ha sido actualizado" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la tarea",
        variant: "destructive",
      });
    },
  });

  if (staffLoading || tasksLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Personal Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap space-y-0 pb-2">
          <div>
            <CardTitle>Personal Asignado</CardTitle>
            <CardDescription>Gestiona el personal de esta propiedad</CardDescription>
          </div>
          <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-staff">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Personal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Personal</DialogTitle>
                <DialogDescription>Asigna un miembro del personal a esta propiedad</DialogDescription>
              </DialogHeader>
              <Form {...staffForm}>
                <form onSubmit={staffForm.handleSubmit((data) => addStaffMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={staffForm.control}
                    name="staffId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Miembro del Personal</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ID del usuario" data-testid="input-staff-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={staffForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rol</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-staff-role">
                              <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {staffRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={addStaffMutation.isPending} data-testid="button-submit-staff">
                      {addStaffMutation.isPending ? "Agregando..." : "Agregar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay personal asignado a esta propiedad</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                  data-testid={`staff-member-${member.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{member.staffName || member.staffId}</p>
                      <p className="text-sm text-muted-foreground">
                        {staffRoles.find((r) => r.value === member.role)?.label || member.role}
                      </p>
                    </div>
                  </div>
                  <Badge variant={member.active ? "default" : "secondary"}>
                    {member.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap space-y-0 pb-2">
          <div>
            <CardTitle>Tareas</CardTitle>
            <CardDescription>Gestiona las tareas de esta propiedad</CardDescription>
          </div>
          <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-task">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Tarea</DialogTitle>
                <DialogDescription>Crea una nueva tarea para esta propiedad</DialogDescription>
              </DialogHeader>
              <Form {...taskForm}>
                <form onSubmit={taskForm.handleSubmit((data) => createTaskMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={taskForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-task-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={taskForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} data-testid="input-task-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={taskForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue="medium">
                          <FormControl>
                            <SelectTrigger data-testid="select-task-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {taskPriorities.map((priority) => (
                              <SelectItem key={priority.value} value={priority.value}>
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={taskForm.control}
                    name="assignedToId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asignar a (opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-task-assignee">
                              <SelectValue placeholder="Selecciona un miembro" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {staff.map((member) => (
                              <SelectItem key={member.staffId} value={member.staffId}>
                                {member.staffName || member.staffId}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={taskForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de vencimiento (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} type="datetime-local" data-testid="input-task-due-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createTaskMutation.isPending} data-testid="button-submit-task">
                      {createTaskMutation.isPending ? "Creando..." : "Crear Tarea"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay tareas para esta propiedad</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const statusInfo = taskStatuses.find((s) => s.value === task.status);
                const priorityInfo = taskPriorities.find((p) => p.value === task.priority);
                const StatusIcon = statusInfo?.icon || AlertCircle;

                return (
                  <div
                    key={task.id}
                    className="flex items-start justify-between p-4 border rounded-md"
                    data-testid={`task-${task.id}`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge variant={priorityInfo?.color}>{priorityInfo?.label}</Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      {task.assignedToName && (
                        <p className="text-sm text-muted-foreground">
                          Asignado a: {task.assignedToName}
                        </p>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString("es-ES")}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        <span className="text-xs">{statusInfo?.label}</span>
                      </Badge>
                      <Select
                        value={task.status}
                        onValueChange={(value) =>
                          updateTaskStatusMutation.mutate({ taskId: task.id, status: value })
                        }
                      >
                        <SelectTrigger className="w-[140px]" data-testid={`select-task-status-${task.id}`}>
                          <SelectValue placeholder="Cambiar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {taskStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center gap-2">
                                <status.icon className="h-4 w-4" />
                                {status.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
