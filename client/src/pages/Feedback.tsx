import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bug, Lightbulb, Send, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Feedback as FeedbackType } from "@shared/schema";

const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  en_revision: "En Revisión",
  resuelto: "Resuelto",
  rechazado: "Rechazado",
};

const STATUS_ICONS: Record<string, any> = {
  nuevo: Clock,
  en_revision: Clock,
  resuelto: CheckCircle2,
  rechazado: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  nuevo: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  en_revision: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  resuelto: "bg-green-500/10 text-green-700 dark:text-green-400",
  rechazado: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export default function Feedback() {
  const { toast } = useToast();
  const [feedbackType, setFeedbackType] = useState<"bug" | "mejora">("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: myFeedback = [], isLoading } = useQuery<FeedbackType[]>({
    queryKey: ["/api/feedback/my-feedback"],
  });

  const createFeedbackMutation = useMutation({
    mutationFn: async (data: { type: string; title: string; description: string }) => {
      return await apiRequest("/api/feedback", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Feedback enviado",
        description: "Tu reporte ha sido enviado exitosamente. Gracias por tu aportación.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/my-feedback"] });
      setTitle("");
      setDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el feedback",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    createFeedbackMutation.mutate({
      type: feedbackType,
      title: title.trim(),
      description: description.trim(),
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-feedback">
          Reportar Bugs y Sugerencias
        </h1>
        <p className="text-muted-foreground">
          Ayúdanos a mejorar la plataforma reportando errores o sugiriendo mejoras
        </p>
      </div>

      <Card data-testid="card-new-feedback">
        <CardHeader>
          <CardTitle>Nuevo Reporte</CardTitle>
          <CardDescription>
            Describe el problema que encontraste o la mejora que te gustaría ver
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Reporte</Label>
              <Select
                value={feedbackType}
                onValueChange={(value: "bug" | "mejora") => setFeedbackType(value)}
              >
                <SelectTrigger id="type" data-testid="select-feedback-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      <span>Bug / Error</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="mejora">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      <span>Sugerencia de Mejora</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Resumen breve del problema o sugerencia"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe detalladamente el problema o tu sugerencia..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                data-testid="textarea-description"
              />
              <p className="text-xs text-muted-foreground">
                {feedbackType === "bug" 
                  ? "Incluye los pasos para reproducir el error si es posible"
                  : "Explica cómo esta mejora beneficiaría a los usuarios"}
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={createFeedbackMutation.isPending}
              data-testid="button-submit-feedback"
            >
              {createFeedbackMutation.isPending ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Reporte
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card data-testid="card-my-feedback">
        <CardHeader>
          <CardTitle>Mis Reportes</CardTitle>
          <CardDescription>
            Historial de tus reportes de bugs y sugerencias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : myFeedback.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Aún no has enviado ningún reporte
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myFeedback.map((item) => {
                const StatusIcon = STATUS_ICONS[item.status];
                return (
                  <div
                    key={item.id}
                    className="p-4 border rounded-md space-y-2"
                    data-testid={`feedback-item-${item.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.type === "bug" ? (
                            <Bug className="h-4 w-4 text-red-600" />
                          ) : (
                            <Lightbulb className="h-4 w-4 text-yellow-600" />
                          )}
                          <h3 className="font-medium line-clamp-1">{item.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.createdAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge className={STATUS_COLORS[item.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </div>
                    {item.adminNotes && (
                      <div className="mt-2 p-2 bg-muted rounded-sm">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Nota del Administrador:
                        </p>
                        <p className="text-sm">{item.adminNotes}</p>
                      </div>
                    )}
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
