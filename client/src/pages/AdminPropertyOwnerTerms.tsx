import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PropertyOwnerTerms } from "@shared/schema";

export default function AdminPropertyOwnerTerms() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<PropertyOwnerTerms | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    titleEn: "",
    content: "",
    contentEn: "",
    orderIndex: 0,
    isActive: true,
  });

  const { data: terms = [], isLoading } = useQuery<PropertyOwnerTerms[]>({
    queryKey: ["/api/property-owner-terms"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/property-owner-terms", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Término creado",
        description: "El término ha sido creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/property-owner-terms"] });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el término",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<typeof formData> }) => {
      return await apiRequest(`/api/property-owner-terms/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.updates),
      });
    },
    onSuccess: () => {
      toast({
        title: "Término actualizado",
        description: "El término ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/property-owner-terms"] });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el término",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/property-owner-terms/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Término eliminado",
        description: "El término ha sido eliminado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/property-owner-terms"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el término",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      titleEn: "",
      content: "",
      contentEn: "",
      orderIndex: 0,
      isActive: true,
    });
    setEditingTerm(null);
  };

  const handleEdit = (term: PropertyOwnerTerms) => {
    setEditingTerm(term);
    setFormData({
      title: term.title,
      titleEn: term.titleEn,
      content: term.content,
      contentEn: term.contentEn,
      orderIndex: term.orderIndex,
      isActive: term.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.titleEn || !formData.content || !formData.contentEn) {
      toast({
        title: "Campos requeridos",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    if (editingTerm) {
      updateMutation.mutate({ id: editingTerm.id, updates: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este término?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-admin-terms">
            Términos y Condiciones de Propietarios
          </h1>
          <p className="text-muted-foreground">
            Gestiona los términos y condiciones que se muestran en el wizard de carga de propiedades
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-term">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Término
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTerm ? "Editar Término" : "Nuevo Término"}
              </DialogTitle>
              <DialogDescription>
                Ingresa los textos en español e inglés para el término
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título (Español)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Propiedad y Titularidad"
                    data-testid="input-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="titleEn">Título (English)</Label>
                  <Input
                    id="titleEn"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    placeholder="Ex: Property and Ownership"
                    data-testid="input-title-en"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenido (Español)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Describe el término en español"
                  rows={4}
                  data-testid="textarea-content"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentEn">Contenido (English)</Label>
                <Textarea
                  id="contentEn"
                  value={formData.contentEn}
                  onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
                  placeholder="Describe the term in English"
                  rows={4}
                  data-testid="textarea-content-en"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderIndex">Orden</Label>
                  <Input
                    id="orderIndex"
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                    data-testid="input-order"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    data-testid="switch-active"
                  />
                  <Label htmlFor="isActive">Activo</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save"
              >
                {editingTerm ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Términos</CardTitle>
          <CardDescription>
            {terms.length} término(s) configurado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : terms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay términos configurados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {terms.map((term) => (
                <Card key={term.id} className="border-l-4" style={{ borderLeftColor: term.isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-muted-foreground">Orden: {term.orderIndex}</span>
                          {term.isActive ? (
                            <span className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-1 rounded">Activo</span>
                          ) : (
                            <span className="text-xs bg-gray-500/10 text-gray-700 dark:text-gray-400 px-2 py-1 rounded">Inactivo</span>
                          )}
                        </div>
                        <h3 className="font-semibold mb-1">{term.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{term.titleEn}</p>
                        <p className="text-sm line-clamp-2">{term.content}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(term)}
                          data-testid={`button-edit-${term.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(term.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${term.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
