import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSlaConfigurationSchema, type InsertSlaConfiguration, type SlaConfiguration } from "@shared/schema";
import { Plus, Edit, Trash2, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
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

const processOptions = [
  { value: "lead_response", label: "Respuesta a Lead" },
  { value: "appointment_confirmation", label: "Confirmación de Cita" },
  { value: "offer_review", label: "Revisión de Oferta" },
  { value: "contract_processing", label: "Procesamiento de Contrato" },
  { value: "service_booking", label: "Reserva de Servicio" },
  { value: "property_review", label: "Revisión de Propiedad" },
];

export default function AdminSLAConfig() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SlaConfiguration | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<SlaConfiguration | null>(null);

  const { data: configs, isLoading } = useQuery<SlaConfiguration[]>({
    queryKey: ["/api/sla-configs"],
  });

  const form = useForm<InsertSlaConfiguration>({
    resolver: zodResolver(insertSlaConfigurationSchema),
    defaultValues: {
      processName: "lead_response",
      targetMinutes: 60,
      warningThresholdPercent: 80,
      isActive: true,
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSlaConfiguration) => {
      return await apiRequest("POST", "/api/sla-configs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sla-configs"] });
      toast({
        title: "SLA configurado",
        description: "La configuración de SLA se ha creado exitosamente",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la configuración de SLA",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSlaConfiguration> }) => {
      return await apiRequest("PATCH", `/api/sla-configs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sla-configs"] });
      toast({
        title: "SLA actualizado",
        description: "La configuración de SLA se ha actualizado exitosamente",
      });
      setIsCreateDialogOpen(false);
      setEditingConfig(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración de SLA",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sla-configs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sla-configs"] });
      toast({
        title: "SLA eliminado",
        description: "La configuración de SLA se ha eliminado exitosamente",
      });
      setDeletingConfig(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la configuración de SLA",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSlaConfiguration) => {
    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (config: SlaConfiguration) => {
    setEditingConfig(config);
    form.reset({
      processName: config.processName,
      targetMinutes: config.targetMinutes,
      warningThresholdPercent: config.warningThresholdPercent,
      isActive: config.isActive,
      description: config.description || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingConfig(null);
    form.reset();
  };

  if (isLoading) {
    return <LoadingScreen className="h-full" />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-page-title">
            Configuración de SLAs
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="text-page-description">
            Gestiona los tiempos de respuesta objetivo para diferentes procesos
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingConfig(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-sla">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo SLA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">
                {editingConfig ? "Editar SLA" : "Nuevo SLA"}
              </DialogTitle>
              <DialogDescription data-testid="text-dialog-description">
                {editingConfig
                  ? "Actualiza la configuración del SLA"
                  : "Crea una nueva configuración de tiempo de respuesta"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="processName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proceso</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-process">
                            <SelectValue placeholder="Selecciona un proceso" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {processOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        El proceso al que se aplica este SLA
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiempo Objetivo (minutos)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="60"
                          data-testid="input-target-minutes"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Tiempo objetivo para completar el proceso
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warningThresholdPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Umbral de Advertencia (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="80"
                          data-testid="input-warning-threshold"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Porcentaje del tiempo objetivo para generar advertencia (ej: 80%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción del SLA..."
                          data-testid="textarea-description"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Información adicional sobre este SLA
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">SLA Activo</FormLabel>
                        <FormDescription>
                          Activar o desactivar este SLA
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && "Guardando..."}
                    {!createMutation.isPending && !updateMutation.isPending && (editingConfig ? "Actualizar" : "Crear")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {configs?.map((config) => (
          <Card key={config.id} data-testid={`card-sla-${config.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {processOptions.find(o => o.value === config.processName)?.label}
                  </CardTitle>
                  <CardDescription>
                    {config.description || "Sin descripción"}
                  </CardDescription>
                </div>
                {config.isActive ? (
                  <Badge variant="default" data-testid={`badge-status-${config.id}`}>Activo</Badge>
                ) : (
                  <Badge variant="secondary" data-testid={`badge-status-${config.id}`}>Inactivo</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tiempo Objetivo:</span>
                  <span className="font-semibold" data-testid={`text-target-${config.id}`}>
                    {config.targetMinutes} min
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Umbral Advertencia:</span>
                  <span className="font-semibold" data-testid={`text-threshold-${config.id}`}>
                    {config.warningThresholdPercent}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Alerta a los {Math.floor(config.targetMinutes * config.warningThresholdPercent / 100)} min</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(config)}
                    data-testid={`button-edit-${config.id}`}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeletingConfig(config)}
                    data-testid={`button-delete-${config.id}`}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {configs && configs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center" data-testid="text-empty-state">
              No hay configuraciones de SLA. Crea una para empezar.
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deletingConfig} onOpenChange={(open) => !open && setDeletingConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar configuración de SLA?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la configuración de SLA para "
              {deletingConfig && processOptions.find(o => o.value === deletingConfig.processName)?.label}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingConfig && deleteMutation.mutate(deletingConfig.id)}
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
