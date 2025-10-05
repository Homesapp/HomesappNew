import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bug, Lightbulb, CheckCircle2, Clock, XCircle, Eye } from "lucide-react";
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

export default function AdminFeedback() {
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  const { data: allFeedback = [], isLoading } = useQuery<FeedbackType[]>({
    queryKey: ["/api/feedback", filterType !== "all" ? { type: filterType } : {}, filterStatus !== "all" ? { status: filterStatus } : {}],
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: async (data: { id: string; status?: string; adminNotes?: string }) => {
      const { id, ...updates } = data;
      return await apiRequest(`/api/feedback/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      toast({
        title: "Feedback actualizado",
        description: "El estado del feedback ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      setSelectedFeedback(null);
      setNewStatus("");
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el feedback",
        variant: "destructive",
      });
    },
  });

  const handleUpdateFeedback = () => {
    if (!selectedFeedback) return;

    const updates: any = {};
    if (newStatus) updates.status = newStatus;
    if (adminNotes.trim()) updates.adminNotes = adminNotes.trim();

    if (Object.keys(updates).length === 0) {
      toast({
        title: "Sin cambios",
        description: "No hay cambios que guardar",
        variant: "destructive",
      });
      return;
    }

    updateFeedbackMutation.mutate({
      id: selectedFeedback.id,
      ...updates,
    });
  };

  const filteredFeedback = allFeedback.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    return true;
  });

  const bugCount = allFeedback.filter(f => f.type === "bug").length;
  const mejoraCount = allFeedback.filter(f => f.type === "mejora").length;
  const nuevoCount = allFeedback.filter(f => f.status === "nuevo").length;
  const enRevisionCount = allFeedback.filter(f => f.status === "en_revision").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-admin-feedback">
          Administración de Feedback
        </h1>
        <p className="text-muted-foreground">
          Gestiona los reportes de bugs y sugerencias de mejora de los usuarios
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-stat-bugs">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugs Reportados</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bugCount}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-improvements">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sugerencias</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mejoraCount}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-new">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nuevoCount}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-in-review">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enRevisionCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-feedback-filters">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="bug">Bugs</SelectItem>
                  <SelectItem value="mejora">Mejoras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="nuevo">Nuevos</SelectItem>
                  <SelectItem value="en_revision">En Revisión</SelectItem>
                  <SelectItem value="resuelto">Resueltos</SelectItem>
                  <SelectItem value="rechazado">Rechazados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-feedback-list">
        <CardHeader>
          <CardTitle>Reportes ({filteredFeedback.length})</CardTitle>
          <CardDescription>
            Lista de todos los reportes de feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No hay reportes que coincidan con los filtros
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedback.map((item) => {
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
                      <div className="flex flex-col gap-2 items-end">
                        <Badge className={STATUS_COLORS[item.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {STATUS_LABELS[item.status]}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFeedback(item);
                                setNewStatus(item.status);
                                setAdminNotes(item.adminNotes || "");
                              }}
                              data-testid={`button-manage-${item.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Gestionar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Gestionar Feedback</DialogTitle>
                              <DialogDescription>
                                Actualiza el estado del feedback y añade notas
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {item.type === "bug" ? (
                                    <Bug className="h-5 w-5 text-red-600" />
                                  ) : (
                                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                                  )}
                                  <h3 className="font-semibold">{item.title}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {item.description}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="status">Estado</Label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                  <SelectTrigger id="status" data-testid="select-new-status">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="nuevo">Nuevo</SelectItem>
                                    <SelectItem value="en_revision">En Revisión</SelectItem>
                                    <SelectItem value="resuelto">Resuelto</SelectItem>
                                    <SelectItem value="rechazado">Rechazado</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="adminNotes">Notas del Administrador</Label>
                                <Textarea
                                  id="adminNotes"
                                  placeholder="Añade notas sobre este feedback..."
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  rows={4}
                                  data-testid="textarea-admin-notes"
                                />
                              </div>

                              <Button
                                onClick={handleUpdateFeedback}
                                disabled={updateFeedbackMutation.isPending}
                                className="w-full"
                                data-testid="button-update-feedback"
                              >
                                {updateFeedbackMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
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
