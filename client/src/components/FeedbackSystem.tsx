import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Bug, Lightbulb, Send, CheckCircle2 } from "lucide-react";

const feedbackFormSchema = z.object({
  type: z.enum(["bug", "suggestion", "complaint", "feature_request", "general"]),
  title: z.string().min(5, "El título debe tener al menos 5 caracteres").max(200),
  description: z.string().min(20, "Por favor proporciona más detalles (mínimo 20 caracteres)").max(5000),
  urgency: z.enum(["low", "medium", "high"]),
  category: z.string().optional(),
  pageUrl: z.string().optional(),
  userEmail: z.string().email().optional().or(z.literal("")),
  userName: z.string().optional(),
});

type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: FeedbackFormData["type"];
  currentPage?: string;
}

const typeOptions = [
  { value: "bug", label: "Reportar un error", icon: Bug, color: "text-red-500" },
  { value: "suggestion", label: "Sugerencia", icon: Lightbulb, color: "text-yellow-500" },
  { value: "feature_request", label: "Solicitar función", icon: MessageSquare, color: "text-blue-500" },
  { value: "complaint", label: "Queja", icon: MessageSquare, color: "text-orange-500" },
  { value: "general", label: "Comentario general", icon: MessageSquare, color: "text-gray-500" },
];

const urgencyOptions = [
  { value: "low", label: "Baja - No urgente" },
  { value: "medium", label: "Media - Afecta mi trabajo" },
  { value: "high", label: "Alta - Urgente / Bloquea trabajo" },
];

const categoryOptions = [
  { value: "dashboard", label: "Dashboard / Inicio" },
  { value: "calendar", label: "Calendario" },
  { value: "properties", label: "Propiedades" },
  { value: "leads", label: "Leads / Clientes" },
  { value: "contracts", label: "Contratos" },
  { value: "payments", label: "Pagos" },
  { value: "notifications", label: "Notificaciones" },
  { value: "tickets", label: "Tickets / Mantenimiento" },
  { value: "chat", label: "Chat" },
  { value: "reports", label: "Reportes" },
  { value: "settings", label: "Configuración" },
  { value: "mobile", label: "Versión móvil" },
  { value: "other", label: "Otro" },
];

export function FeedbackDialog({
  open,
  onOpenChange,
  defaultType = "suggestion",
  currentPage,
}: FeedbackDialogProps) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      type: defaultType,
      title: "",
      description: "",
      urgency: "medium",
      category: "",
      pageUrl: currentPage || (typeof window !== "undefined" ? window.location.pathname : ""),
      userEmail: "",
      userName: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      const response = await apiRequest("POST", "/api/user-feedback", data);
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "¡Gracias por tu comentario!",
        description: "Hemos recibido tu mensaje y lo revisaremos pronto.",
      });
      setTimeout(() => {
        setSubmitted(false);
        form.reset();
        onOpenChange(false);
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al enviar",
        description: error.message || "Por favor intenta de nuevo",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FeedbackFormData) => {
    submitMutation.mutate(data);
  };

  const selectedType = form.watch("type");
  const TypeIcon = typeOptions.find((t) => t.value === selectedType)?.icon || MessageSquare;

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-feedback-success">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">¡Gracias!</h3>
            <p className="text-muted-foreground mt-2">
              Tu comentario ha sido enviado exitosamente. Valoramos mucho tu opinión.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-feedback">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className={`h-5 w-5 ${typeOptions.find((t) => t.value === selectedType)?.color}`} />
            Enviar comentario
          </DialogTitle>
          <DialogDescription>
            Tu opinión nos ayuda a mejorar. Cuéntanos qué podemos hacer mejor.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de comentario</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-feedback-type">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} data-testid={`option-type-${option.value}`}>
                          <div className="flex items-center gap-2">
                            <option.icon className={`h-4 w-4 ${option.color}`} />
                            {option.label}
                          </div>
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        selectedType === "bug"
                          ? "Ej: Error al guardar cambios en el calendario"
                          : "Resumen breve de tu comentario"
                      }
                      data-testid="input-feedback-title"
                      {...field}
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
                      placeholder={
                        selectedType === "bug"
                          ? "Describe qué pasó, qué esperabas que pasara, y los pasos para reproducir el error..."
                          : "Cuéntanos más detalles sobre tu sugerencia o comentario..."
                      }
                      className="min-h-[120px] resize-none"
                      data-testid="textarea-feedback-description"
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
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgencia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-feedback-urgency">
                          <SelectValue placeholder="Urgencia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {urgencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} data-testid={`option-urgency-${option.value}`}>
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-feedback-category">
                          <SelectValue placeholder="Seleccionar área" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} data-testid={`option-category-${option.value}`}>
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

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-feedback-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                data-testid="button-feedback-submit"
              >
                {submitMutation.isPending ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface FeedbackButtonProps {
  variant?: "floating" | "inline" | "icon";
  className?: string;
  defaultType?: FeedbackFormData["type"];
}

export function FeedbackButton({
  variant = "floating",
  className = "",
  defaultType,
}: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);

  if (variant === "floating") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={`fixed bottom-20 right-3 z-40 flex items-center justify-center 
            w-9 h-9 bg-muted/80 text-muted-foreground rounded-full shadow-md border
            hover:bg-primary hover:text-primary-foreground hover:shadow-lg
            transition-all duration-200 backdrop-blur-sm
            md:bottom-6 md:right-4 ${className}`}
          data-testid="button-feedback-floating"
          title="Enviar feedback"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
        <FeedbackDialog open={open} onOpenChange={setOpen} defaultType={defaultType} />
      </>
    );
  }

  if (variant === "icon") {
    return (
      <>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setOpen(true)}
          className={className}
          data-testid="button-feedback-icon"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
        <FeedbackDialog open={open} onOpenChange={setOpen} defaultType={defaultType} />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className={className}
        data-testid="button-feedback-inline"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Enviar feedback
      </Button>
      <FeedbackDialog open={open} onOpenChange={setOpen} defaultType={defaultType} />
    </>
  );
}

export function ReportBugButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={`text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950 ${className}`}
        data-testid="button-report-bug"
      >
        <Bug className="h-4 w-4 mr-2" />
        Reportar error
      </Button>
      <FeedbackDialog open={open} onOpenChange={setOpen} defaultType="bug" />
    </>
  );
}
