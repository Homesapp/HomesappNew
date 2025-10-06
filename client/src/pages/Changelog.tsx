import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Bug, Sparkles, Shield, Zap, Palette, Database, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChangelogSchema, type Changelog } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formSchema = insertChangelogSchema.extend({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

const categoryLabels: Record<string, string> = {
  feature: "Nueva Funcionalidad",
  enhancement: "Mejora",
  bugfix: "Corrección de Error",
  security: "Seguridad",
  performance: "Rendimiento",
  ui: "Interfaz",
  database: "Base de Datos",
};

const categoryIcons: Record<string, any> = {
  feature: Sparkles,
  enhancement: Zap,
  bugfix: Bug,
  security: Shield,
  performance: Zap,
  ui: Palette,
  database: Database,
};

const categoryColors: Record<string, string> = {
  feature: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  enhancement: "bg-green-500/10 text-green-700 dark:text-green-300",
  bugfix: "bg-red-500/10 text-red-700 dark:text-red-300",
  security: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  performance: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  ui: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  database: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
};

export default function Changelog() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedChangelog, setSelectedChangelog] = useState<Changelog | null>(null);

  const { data: changelogs = [], isLoading } = useQuery<Changelog[]>({
    queryKey: ["/api/changelogs"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      version: "",
      title: "",
      description: "",
      category: "feature",
      implementedBy: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/changelogs", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/changelogs"] });
      toast({
        title: "Éxito",
        description: "Registro del changelog creado correctamente",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el registro del changelog",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/changelogs/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/changelogs"] });
      toast({
        title: "Éxito",
        description: "Registro del changelog eliminado correctamente",
      });
      setDeleteDialogOpen(false);
      setSelectedChangelog(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el registro del changelog",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const handleDelete = () => {
    if (selectedChangelog) {
      deleteMutation.mutate(selectedChangelog.id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando changelog...</div>
        </div>
      </div>
    );
  }

  // Group changelogs by category
  const groupedChangelogs = changelogs.reduce((acc, changelog) => {
    if (!acc[changelog.category]) {
      acc[changelog.category] = [];
    }
    acc[changelog.category].push(changelog);
    return acc;
  }, {} as Record<string, Changelog[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-changelog">Changelog</h1>
          <p className="text-muted-foreground">
            Historial completo de implementaciones y cambios del sistema
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-changelog">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Agregar Registro al Changelog</DialogTitle>
              <DialogDescription>
                Documenta una nueva implementación o cambio en el sistema
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Versión (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="v1.0.0" 
                          {...field} 
                          data-testid="input-version"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="feature">Nueva Funcionalidad</SelectItem>
                          <SelectItem value="enhancement">Mejora</SelectItem>
                          <SelectItem value="bugfix">Corrección de Error</SelectItem>
                          <SelectItem value="security">Seguridad</SelectItem>
                          <SelectItem value="performance">Rendimiento</SelectItem>
                          <SelectItem value="ui">Interfaz</SelectItem>
                          <SelectItem value="database">Base de Datos</SelectItem>
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
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Título de la implementación" 
                          {...field} 
                          data-testid="input-title"
                        />
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
                          placeholder="Describe los detalles de la implementación..." 
                          rows={4}
                          {...field} 
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="implementedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Implementado por (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre del desarrollador" 
                          {...field} 
                          data-testid="input-implemented-by"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cambios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-changes">{changelogs.length}</div>
          </CardContent>
        </Card>

        {Object.entries(categoryLabels).slice(0, 3).map(([key, label]) => {
          const count = groupedChangelogs[key]?.length || 0;
          const Icon = categoryIcons[key];
          return (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`stat-${key}`}>{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Changelog Timeline */}
      <div className="space-y-4">
        {changelogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay registros en el changelog. Agrega el primer registro para comenzar.
              </p>
            </CardContent>
          </Card>
        ) : (
          changelogs.map((changelog) => {
            const Icon = categoryIcons[changelog.category];
            return (
              <Card key={changelog.id} data-testid={`changelog-${changelog.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {changelog.version && (
                          <Badge variant="outline" data-testid={`badge-version-${changelog.id}`}>
                            {changelog.version}
                          </Badge>
                        )}
                        <Badge className={categoryColors[changelog.category]} data-testid={`badge-category-${changelog.id}`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {categoryLabels[changelog.category]}
                        </Badge>
                        <span className="text-sm text-muted-foreground" data-testid={`date-${changelog.id}`}>
                          {format(new Date(changelog.createdAt), "PPP 'a las' p", { locale: es })}
                        </span>
                      </div>
                      <CardTitle className="text-lg" data-testid={`title-${changelog.id}`}>
                        {changelog.title}
                      </CardTitle>
                      {changelog.implementedBy && (
                        <p className="text-sm text-muted-foreground" data-testid={`implementer-${changelog.id}`}>
                          Implementado por: {changelog.implementedBy}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedChangelog(changelog);
                        setDeleteDialogOpen(true);
                      }}
                      data-testid={`button-delete-${changelog.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap" data-testid={`description-${changelog.id}`}>
                    {changelog.description}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este registro del changelog? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedChangelog(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
