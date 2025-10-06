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
import { insertLeadScoringRuleSchema, type InsertLeadScoringRule, type LeadScoringRule } from "@shared/schema";
import { Plus, Edit, Trash2, Target, TrendingUp } from "lucide-react";
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

const criteriaFields = [
  { value: "source", label: "Fuente del Lead" },
  { value: "budget", label: "Presupuesto" },
  { value: "urgency", label: "Urgencia" },
  { value: "propertyType", label: "Tipo de Propiedad" },
  { value: "location", label: "Ubicación" },
];

const operators = [
  { value: "equals", label: "Es igual a" },
  { value: "greater_than", label: "Mayor que" },
  { value: "less_than", label: "Menor que" },
  { value: "contains", label: "Contiene" },
];

export default function AdminLeadScoring() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LeadScoringRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<LeadScoringRule | null>(null);

  const { data: rules, isLoading } = useQuery<LeadScoringRule[]>({
    queryKey: ["/api/lead-scoring-rules"],
  });

  const form = useForm<InsertLeadScoringRule>({
    resolver: zodResolver(insertLeadScoringRuleSchema),
    defaultValues: {
      name: "",
      description: "",
      criteriaField: "source",
      criteriaOperator: "equals",
      criteriaValue: "",
      scorePoints: 10,
      priority: 1,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertLeadScoringRule) => {
      return await apiRequest("POST", "/api/lead-scoring-rules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-scoring-rules"] });
      toast({
        title: "Regla creada",
        description: "La regla de scoring se ha creado exitosamente",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la regla de scoring",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertLeadScoringRule> }) => {
      return await apiRequest("PATCH", `/api/lead-scoring-rules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-scoring-rules"] });
      toast({
        title: "Regla actualizada",
        description: "La regla de scoring se ha actualizado exitosamente",
      });
      setIsCreateDialogOpen(false);
      setEditingRule(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la regla de scoring",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/lead-scoring-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-scoring-rules"] });
      toast({
        title: "Regla eliminada",
        description: "La regla de scoring se ha eliminado exitosamente",
      });
      setDeletingRule(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la regla de scoring",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertLeadScoringRule) => {
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (rule: LeadScoringRule) => {
    setEditingRule(rule);
    form.reset({
      name: rule.name,
      description: rule.description || "",
      criteriaField: rule.criteriaField,
      criteriaOperator: rule.criteriaOperator as any,
      criteriaValue: rule.criteriaValue,
      scorePoints: rule.scorePoints,
      priority: rule.priority,
      isActive: rule.isActive,
    });
    setIsCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingRule(null);
    form.reset();
  };

  if (isLoading) {
    return <LoadingScreen className="h-full" />;
  }

  const sortedRules = rules?.sort((a, b) => a.priority - b.priority) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-page-title">
            Reglas de Scoring de Leads
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="text-page-description">
            Define reglas para calcular automáticamente la calidad de los leads
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingRule(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-rule">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Regla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">
                {editingRule ? "Editar Regla" : "Nueva Regla"}
              </DialogTitle>
              <DialogDescription data-testid="text-dialog-description">
                {editingRule
                  ? "Actualiza la regla de scoring"
                  : "Crea una nueva regla para calificar leads"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Regla</FormLabel>
                      <FormControl>
                        <Input placeholder="Lead de referido" data-testid="input-name" {...field} />
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
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción de la regla..."
                          data-testid="textarea-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="criteriaField"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-field">
                              <SelectValue placeholder="Campo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {criteriaFields.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
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
                    name="criteriaOperator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operador</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-operator">
                              <SelectValue placeholder="Operador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {operators.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
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
                  name="criteriaValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor de Comparación</FormLabel>
                      <FormControl>
                        <Input placeholder="referral" data-testid="input-criteria-value" {...field} />
                      </FormControl>
                      <FormDescription>
                        El valor contra el cual se comparará el campo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scorePoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Puntos</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            data-testid="input-score-points"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Puntos a sumar si cumple
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            data-testid="input-priority"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Orden de evaluación
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Regla Activa</FormLabel>
                        <FormDescription>
                          Activar o desactivar esta regla
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
                    {!createMutation.isPending && !updateMutation.isPending && (editingRule ? "Actualizar" : "Crear")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sortedRules.map((rule) => (
          <Card key={rule.id} data-testid={`card-rule-${rule.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {rule.name}
                    <Badge variant="outline" className="ml-2">
                      Prioridad {rule.priority}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {rule.description || "Sin descripción"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={rule.scorePoints > 0 ? "default" : "secondary"} data-testid={`badge-points-${rule.id}`}>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {rule.scorePoints > 0 ? '+' : ''}{rule.scorePoints} pts
                  </Badge>
                  {rule.isActive ? (
                    <Badge variant="default" data-testid={`badge-status-${rule.id}`}>Activo</Badge>
                  ) : (
                    <Badge variant="secondary" data-testid={`badge-status-${rule.id}`}>Inactivo</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm p-3 bg-muted rounded-md font-mono">
                  <span className="font-semibold">Si</span>
                  <Badge variant="outline">{criteriaFields.find(f => f.value === rule.criteriaField)?.label}</Badge>
                  <span>{operators.find(o => o.value === rule.criteriaOperator)?.label}</span>
                  <Badge variant="outline">{rule.criteriaValue}</Badge>
                  <span className="font-semibold">entonces +{rule.scorePoints} puntos</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(rule)}
                    data-testid={`button-edit-${rule.id}`}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeletingRule(rule)}
                    data-testid={`button-delete-${rule.id}`}
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

      {sortedRules.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center" data-testid="text-empty-state">
              No hay reglas de scoring. Crea una para empezar a calificar leads automáticamente.
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deletingRule} onOpenChange={(open) => !open && setDeletingRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar regla de scoring?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la regla "{deletingRule?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRule && deleteMutation.mutate(deletingRule.id)}
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
