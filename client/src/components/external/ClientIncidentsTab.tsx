import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalClientIncident } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClientIncidentsTabProps {
  clientId: string;
  incidents: ExternalClientIncident[];
  isLoading: boolean;
  isError: boolean;
}

const createIncidentSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  description: z.string().min(1, "Descripción requerida"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  occurredAt: z.coerce.date(),
});

const updateIncidentSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  resolution: z.string().optional(),
  resolvedAt: z.coerce.date().optional(),
});

type CreateIncidentData = z.infer<typeof createIncidentSchema>;
type UpdateIncidentData = z.infer<typeof updateIncidentSchema>;

const severityLabels = {
  low: { label: "Baja", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  medium: { label: "Media", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  critical: { label: "Crítica", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
};

const statusLabels = {
  open: { label: "Abierta", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  in_progress: { label: "En Progreso", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  resolved: { label: "Resuelta", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  closed: { label: "Cerrada", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
};

export default function ClientIncidentsTab({ clientId, incidents, isLoading, isError }: ClientIncidentsTabProps) {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<ExternalClientIncident | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const createForm = useForm<CreateIncidentData>({
    resolver: zodResolver(createIncidentSchema),
    defaultValues: {
      title: "",
      description: "",
      severity: "low",
      occurredAt: new Date(),
    },
  });

  const updateForm = useForm<UpdateIncidentData>({
    resolver: zodResolver(updateIncidentSchema),
    defaultValues: {
      status: "open",
      resolution: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateIncidentData) => {
      return apiRequest("POST", `/api/external-clients/${clientId}/incidents`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients", clientId, "incidents"] });
      toast({
        title: "Incidencia creada",
        description: "La incidencia se ha creado exitosamente.",
      });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la incidencia",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateIncidentData }) => {
      return apiRequest("PATCH", `/api/external-client-incidents/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients", clientId, "incidents"] });
      toast({
        title: "Incidencia actualizada",
        description: "La incidencia se ha actualizado exitosamente.",
      });
      setEditingIncident(null);
      updateForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la incidencia",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (incidentId: string) => {
      return apiRequest("DELETE", `/api/external-client-incidents/${incidentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients", clientId, "incidents"] });
      toast({
        title: "Incidencia eliminada",
        description: "La incidencia se ha eliminado exitosamente.",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la incidencia",
        variant: "destructive",
      });
      setDeleteId(null);
    },
  });

  const handleEdit = (incident: ExternalClientIncident) => {
    setEditingIncident(incident);
    updateForm.reset({
      status: incident.status,
      resolution: incident.resolution || "",
      resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Incidencias ({incidents.length})</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-incident">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Incidencia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Incidencia</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Queja de ruido" data-testid="input-incident-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe la incidencia..." 
                          className="min-h-[100px]"
                          data-testid="textarea-incident-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severidad *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-incident-severity">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="critical">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="occurredAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Ocurrencia *</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-incident-occurredAt"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-incident">
                    {createMutation.isPending ? "Creando..." : "Crear"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Incidents List */}
      {isError ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
              <p className="text-muted-foreground">Error al cargar incidencias</p>
              <p className="text-xs text-muted-foreground mt-1">
                Por favor, intenta recargar la página
              </p>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : incidents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No hay incidencias registradas</p>
              <p className="text-xs text-muted-foreground mt-1">
                Crea una nueva incidencia usando el botón de arriba
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => (
            <Card key={incident.id} className="border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{incident.title}</h3>
                        <Badge className={severityLabels[incident.severity].color}>
                          {severityLabels[incident.severity].label}
                        </Badge>
                        <Badge className={statusLabels[incident.status].color}>
                          {statusLabels[incident.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Ocurrió el {format(new Date(incident.occurredAt), "PPP 'a las' p", { locale: es })}
                      </p>
                      {incident.resolvedAt && (
                        <p className="text-xs text-muted-foreground">
                          Resuelta el {format(new Date(incident.resolvedAt), "PPP", { locale: es })}
                        </p>
                      )}
                      {incident.resolution && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <p className="text-xs font-semibold mb-1">Resolución:</p>
                          <p className="text-sm">{incident.resolution}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(incident)}
                        data-testid={`button-edit-incident-${incident.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(incident.id)}
                        data-testid={`button-delete-incident-${incident.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Incident Dialog */}
      <Dialog open={!!editingIncident} onOpenChange={() => setEditingIncident(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Actualizar Incidencia</DialogTitle>
          </DialogHeader>
          {editingIncident && (
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit((data) => {
                updateMutation.mutate({ id: editingIncident.id, data });
              })} className="space-y-4">
                <div className="p-4 bg-muted rounded-md">
                  <p className="font-semibold">{editingIncident.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{editingIncident.description}</p>
                </div>
                <FormField
                  control={updateForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-incident-status-update">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Abierta</SelectItem>
                          <SelectItem value="in_progress">En Progreso</SelectItem>
                          <SelectItem value="resolved">Resuelta</SelectItem>
                          <SelectItem value="closed">Cerrada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {(updateForm.watch("status") === "resolved" || updateForm.watch("status") === "closed") && (
                  <>
                    <FormField
                      control={updateForm.control}
                      name="resolution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resolución</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Describe cómo se resolvió la incidencia..." 
                              className="min-h-[100px]"
                              data-testid="textarea-incident-resolution"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={updateForm.control}
                      name="resolvedAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Resolución</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field} 
                              value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ""}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                              data-testid="input-incident-resolvedAt"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditingIncident(null)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-incident-update">
                    {updateMutation.isPending ? "Actualizando..." : "Actualizar"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar incidencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La incidencia será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
