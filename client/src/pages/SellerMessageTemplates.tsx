import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  MessageSquare, 
  Star,
  Copy,
  Check,
  Home,
  Calendar,
  Info,
  Users
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

interface Template {
  id: string;
  templateType: string;
  title: string;
  body: string;
  isDefault: boolean;
  isActive: boolean;
  sellerId: string | null;
  createdAt: string;
}

const TEMPLATE_TYPES = [
  { value: "property_share", label: { es: "Compartir Propiedad", en: "Property Share" }, icon: Home },
  { value: "follow_up", label: { es: "Seguimiento", en: "Follow Up" }, icon: Calendar },
  { value: "initial_contact", label: { es: "Contacto Inicial", en: "Initial Contact" }, icon: Users },
  { value: "appointment", label: { es: "Cita", en: "Appointment" }, icon: Calendar },
  { value: "general", label: { es: "General", en: "General" }, icon: MessageSquare },
];

const TEMPLATE_VARIABLES = [
  { key: "{{nombre}}", description: { es: "Nombre del lead", en: "Lead name" } },
  { key: "{{propiedad}}", description: { es: "Nombre de la propiedad", en: "Property name" } },
  { key: "{{precio}}", description: { es: "Precio mensual", en: "Monthly price" } },
  { key: "{{zona}}", description: { es: "Zona/Ubicación", en: "Zone/Location" } },
  { key: "{{recamaras}}", description: { es: "Número de recámaras", en: "Number of bedrooms" } },
  { key: "{{vendedor}}", description: { es: "Tu nombre", en: "Your name" } },
];

export default function SellerMessageTemplates() {
  const { t, locale } = useTranslation();
  const language = locale;
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    templateType: "property_share",
    title: "",
    body: "",
    isDefault: false,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["/api/external-seller/templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/external-seller/templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/templates"] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: language === "es" ? "Plantilla creada" : "Template created",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error al crear plantilla" : "Error creating template",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await apiRequest("PATCH", `/api/external-seller/templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/templates"] });
      setIsEditOpen(false);
      setSelectedTemplate(null);
      toast({
        title: language === "es" ? "Plantilla actualizada" : "Template updated",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error al actualizar" : "Error updating",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/external-seller/templates/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/templates"] });
      toast({
        title: language === "es" ? "Plantilla eliminada" : "Template deleted",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error al eliminar" : "Error deleting",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      templateType: "property_share",
      title: "",
      body: "",
      isDefault: false,
    });
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      templateType: template.templateType,
      title: template.title,
      body: template.body,
      isDefault: template.isDefault,
    });
    setIsEditOpen(true);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: language === "es" ? "Copiado" : "Copied",
      description: language === "es" ? "Plantilla copiada al portapapeles" : "Template copied to clipboard",
    });
  };

  const insertVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      body: prev.body + variable,
    }));
  };

  const getTypeLabel = (type: string) => {
    const found = TEMPLATE_TYPES.find((t) => t.value === type);
    return found ? found.label[language as "es" | "en"] : type;
  };

  const getTypeIcon = (type: string) => {
    const found = TEMPLATE_TYPES.find((t) => t.value === type);
    return found ? found.icon : MessageSquare;
  };

  const groupedTemplates = templates?.reduce((acc, template) => {
    if (!acc[template.templateType]) {
      acc[template.templateType] = [];
    }
    acc[template.templateType].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Plantillas de Mensaje" : "Message Templates"}
          </h1>
          <p className="text-muted-foreground">
            {language === "es" 
              ? "Crea plantillas personalizadas para WhatsApp" 
              : "Create custom templates for WhatsApp"}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-template">
          <Plus className="mr-2 h-4 w-4" />
          {language === "es" ? "Nueva Plantilla" : "New Template"}
        </Button>
      </div>

      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4" />
            {language === "es" ? "Variables Disponibles" : "Available Variables"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_VARIABLES.map((v) => (
              <Badge
                key={v.key}
                variant="outline"
                className="cursor-pointer hover-elevate"
                onClick={() => {
                  navigator.clipboard.writeText(v.key);
                  toast({
                    title: language === "es" ? "Variable copiada" : "Variable copied",
                  });
                }}
                data-testid={`badge-variable-${v.key}`}
              >
                <code className="text-xs">{v.key}</code>
                <span className="ml-1 text-muted-foreground text-xs">
                  - {v.description[language as "es" | "en"]}
                </span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">
            {language === "es" ? "No hay plantillas" : "No templates yet"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === "es" 
              ? "Crea tu primera plantilla para agilizar tus mensajes" 
              : "Create your first template to speed up messaging"}
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {language === "es" ? "Crear Plantilla" : "Create Template"}
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTemplates || {}).map(([type, typeTemplates]) => {
            const TypeIcon = getTypeIcon(type);
            return (
              <div key={type}>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <TypeIcon className="h-4 w-4" />
                  {getTypeLabel(type)}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {typeTemplates.map((template) => (
                    <Card 
                      key={template.id} 
                      className={template.isDefault ? "border-primary/50" : ""}
                      data-testid={`card-template-${template.id}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{template.title}</CardTitle>
                          <div className="flex items-center gap-1">
                            {template.isDefault && (
                              <Badge variant="default" className="gap-1 text-xs">
                                <Star className="h-3 w-3" />
                                {language === "es" ? "Predeterminada" : "Default"}
                              </Badge>
                            )}
                            {!template.sellerId && (
                              <Badge variant="secondary" className="text-xs">
                                {language === "es" ? "Compartida" : "Shared"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="whitespace-pre-wrap text-sm line-clamp-6">
                            {template.body}
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="gap-2 pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => copyToClipboard(template.body, template.id)}
                          data-testid={`button-copy-${template.id}`}
                        >
                          {copiedId === template.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {language === "es" ? "Copiar" : "Copy"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          data-testid={`button-edit-${template.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`button-delete-${template.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {language === "es" ? "Eliminar plantilla" : "Delete template"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {language === "es"
                                  ? "¿Estás seguro de que deseas eliminar esta plantilla?"
                                  : "Are you sure you want to delete this template?"}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {language === "es" ? "Cancelar" : "Cancel"}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(template.id)}
                              >
                                {language === "es" ? "Eliminar" : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SiWhatsapp className="h-5 w-5 text-green-600" />
              {language === "es" ? "Nueva Plantilla" : "New Template"}
            </DialogTitle>
            <DialogDescription>
              {language === "es"
                ? "Crea una plantilla personalizada para tus mensajes"
                : "Create a custom template for your messages"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{language === "es" ? "Tipo" : "Type"}</Label>
              <Select
                value={formData.templateType}
                onValueChange={(v) => setFormData({ ...formData, templateType: v })}
              >
                <SelectTrigger data-testid="select-template-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label[language as "es" | "en"]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{language === "es" ? "Título" : "Title"}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={language === "es" ? "Ej: Saludo inicial" : "Ex: Initial greeting"}
                data-testid="input-template-title"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>{language === "es" ? "Mensaje" : "Message"}</Label>
                <div className="flex flex-wrap gap-1">
                  {TEMPLATE_VARIABLES.slice(0, 3).map((v) => (
                    <Button
                      key={v.key}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => insertVariable(v.key)}
                    >
                      {v.key}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={8}
                placeholder={language === "es" 
                  ? "Escribe tu mensaje aquí. Usa variables como {{nombre}} para personalizar."
                  : "Write your message here. Use variables like {{nombre}} to personalize."}
                data-testid="textarea-template-body"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                data-testid="switch-is-default"
              />
              <Label className="text-sm">
                {language === "es" 
                  ? "Establecer como predeterminada para este tipo"
                  : "Set as default for this type"}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.title || !formData.body || createMutation.isPending}
              data-testid="button-save-template"
            >
              {createMutation.isPending
                ? (language === "es" ? "Guardando..." : "Saving...")
                : (language === "es" ? "Crear Plantilla" : "Create Template")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              {language === "es" ? "Editar Plantilla" : "Edit Template"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{language === "es" ? "Tipo" : "Type"}</Label>
              <Select
                value={formData.templateType}
                onValueChange={(v) => setFormData({ ...formData, templateType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label[language as "es" | "en"]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{language === "es" ? "Título" : "Title"}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>{language === "es" ? "Mensaje" : "Message"}</Label>
                <div className="flex flex-wrap gap-1">
                  {TEMPLATE_VARIABLES.slice(0, 3).map((v) => (
                    <Button
                      key={v.key}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => insertVariable(v.key)}
                    >
                      {v.key}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={8}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
              <Label className="text-sm">
                {language === "es" 
                  ? "Establecer como predeterminada"
                  : "Set as default"}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={() => selectedTemplate && updateMutation.mutate({ 
                id: selectedTemplate.id, 
                data: formData 
              })}
              disabled={!formData.title || !formData.body || updateMutation.isPending}
            >
              {updateMutation.isPending
                ? (language === "es" ? "Guardando..." : "Saving...")
                : (language === "es" ? "Guardar Cambios" : "Save Changes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
