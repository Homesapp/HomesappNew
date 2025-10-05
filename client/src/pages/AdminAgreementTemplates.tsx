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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAgreementTemplateSchema, type InsertAgreementTemplate, type AgreementTemplate } from "@shared/schema";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export default function AdminAgreementTemplates() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AgreementTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<AgreementTemplate | null>(null);

  const { data: templates, isLoading } = useQuery<AgreementTemplate[]>({
    queryKey: ["/api/admin/agreement-templates"],
  });

  const form = useForm<InsertAgreementTemplate>({
    resolver: zodResolver(insertAgreementTemplateSchema),
    defaultValues: {
      name: "",
      type: "sale_authorization",
      content: "",
      description: "",
      active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAgreementTemplate) => {
      return await apiRequest("POST", "/api/admin/agreement-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agreement-templates"] });
      toast({
        title: "Plantilla creada",
        description: "La plantilla se ha creado exitosamente",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la plantilla",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAgreementTemplate> }) => {
      return await apiRequest("PATCH", `/api/admin/agreement-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agreement-templates"] });
      toast({
        title: "Plantilla actualizada",
        description: "La plantilla se ha actualizado exitosamente",
      });
      setIsCreateDialogOpen(false);
      setEditingTemplate(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la plantilla",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/agreement-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agreement-templates"] });
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla se ha eliminado exitosamente",
      });
      setDeletingTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la plantilla",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAgreementTemplate) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (template: AgreementTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      type: template.type,
      content: template.content,
      description: template.description || "",
      active: template.active,
    });
    setIsCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingTemplate(null);
    form.reset();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" data-testid="loading-spinner" />
          <p className="text-muted-foreground" data-testid="text-loading">Cargando plantillas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-page-title">Plantillas de Acuerdos</h1>
          <p className="text-muted-foreground mt-2" data-testid="text-page-description">
            Gestiona las plantillas para acuerdos de carga de propiedades
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingTemplate(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-template">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">
                {editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
              </DialogTitle>
              <DialogDescription data-testid="text-dialog-description">
                {editingTemplate
                  ? "Actualiza los detalles de la plantilla"
                  : "Crea una nueva plantilla de acuerdo. Usa {{variable.name}} para variables dinámicas."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Acuerdo de Carga de Propiedad" {...field} data-testid="input-template-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <FormControl>
                        <Input placeholder="terms_and_conditions, rent_authorization, o sale_authorization" {...field} data-testid="input-template-type" />
                      </FormControl>
                      <FormDescription data-testid="text-form-type-description">
                        Identificador único del tipo de acuerdo
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
                        <Input placeholder="Descripción breve de la plantilla" value={field.value || ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} data-testid="input-template-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenido</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Contenido del acuerdo. Usa variables como owner.name, property.address, etc."
                          className="min-h-[300px] font-mono text-sm"
                          {...field}
                          data-testid="textarea-template-content"
                        />
                      </FormControl>
                      <FormDescription data-testid="text-form-content-description">
                        Variables disponibles: {`{{owner.name}}, {{owner.email}}, {{property.title}}, {{property.address}}, {{property.city}}, {{property.price}}, {{agreement.date}}`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Activa</FormLabel>
                        <FormDescription data-testid="text-form-active-description">
                          Las plantillas activas están disponibles para usar
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-template-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Guardando..." : editingTemplate ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates && templates.length === 0 && (
          <Card data-testid="card-empty-state">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" data-testid="icon-empty-state" />
              <p className="text-muted-foreground" data-testid="text-empty-state">No hay plantillas creadas</p>
            </CardContent>
          </Card>
        )}

        {templates?.map((template) => (
          <Card key={template.id} data-testid={`card-template-${template.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle data-testid={`text-template-name-${template.id}`}>{template.name}</CardTitle>
                    <Badge variant={template.active ? "default" : "secondary"} data-testid={`badge-status-${template.id}`}>
                      <span data-testid={`text-status-${template.id}`}>{template.active ? "Activa" : "Inactiva"}</span>
                    </Badge>
                  </div>
                  {template.description && (
                    <CardDescription className="mt-2" data-testid={`text-description-${template.id}`}>{template.description}</CardDescription>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span data-testid={`text-type-${template.id}`}>Tipo: {template.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    data-testid={`button-edit-${template.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingTemplate(template)}
                    data-testid={`button-delete-${template.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <pre className="text-sm whitespace-pre-wrap font-mono" data-testid={`text-content-${template.id}`}>
                  {template.content.length > 300
                    ? template.content.substring(0, 300) + "..."
                    : template.content}
                </pre>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-alert-title">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription data-testid="text-alert-description">
              Esta acción no se puede deshacer. La plantilla "{deletingTemplate?.name}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTemplate && deleteMutation.mutate(deletingTemplate.id)}
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
