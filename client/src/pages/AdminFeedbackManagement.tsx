import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Bug,
  Lightbulb,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Archive,
  ExternalLink,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Eye,
  RefreshCw,
} from "lucide-react";

interface UserFeedback {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  agencyId: string | null;
  type: string;
  title: string;
  description: string;
  urgency: string;
  category: string | null;
  pageUrl: string | null;
  status: string;
  adminNotes: string | null;
  resolution: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackResponse {
  feedback: UserFeedback[];
  total: number;
}

interface FeedbackStats {
  newCount: number;
  highUrgencyCount: number;
}

const typeConfig: Record<string, { icon: typeof Bug; label: string; color: string }> = {
  bug: { icon: Bug, label: "Error", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  suggestion: { icon: Lightbulb, label: "Sugerencia", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  feature_request: { icon: MessageSquare, label: "Nueva función", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  complaint: { icon: AlertTriangle, label: "Queja", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  general: { icon: MessageSquare, label: "General", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "Nuevo", color: "bg-blue-100 text-blue-700" },
  in_review: { label: "En revisión", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "En progreso", color: "bg-purple-100 text-purple-700" },
  resolved: { label: "Resuelto", color: "bg-green-100 text-green-700" },
  closed: { label: "Cerrado", color: "bg-gray-100 text-gray-700" },
  wont_fix: { label: "No se arreglará", color: "bg-red-100 text-red-700" },
};

const urgencyConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Baja", color: "border-gray-300" },
  medium: { label: "Media", color: "border-yellow-400" },
  high: { label: "Alta", color: "border-red-500" },
};

function FeedbackCard({
  feedback,
  onSelect,
}: {
  feedback: UserFeedback;
  onSelect: () => void;
}) {
  const typeInfo = typeConfig[feedback.type] || typeConfig.general;
  const statusInfo = statusConfig[feedback.status] || statusConfig.new;
  const urgencyInfo = urgencyConfig[feedback.urgency] || urgencyConfig.medium;
  const TypeIcon = typeInfo.icon;

  return (
    <Card
      className={`cursor-pointer hover-elevate border-l-4 ${urgencyInfo.color}`}
      onClick={onSelect}
      data-testid={`feedback-card-${feedback.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${typeInfo.color}`}>
            <TypeIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-medium text-sm line-clamp-1">{feedback.title}</h3>
              <Badge variant="secondary" className={`flex-shrink-0 text-xs ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {feedback.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{feedback.userName || feedback.userEmail || "Anónimo"}</span>
              <span>•</span>
              <span>{format(new Date(feedback.createdAt), "d MMM yyyy", { locale: es })}</span>
              {feedback.category && (
                <>
                  <span>•</span>
                  <span className="capitalize">{feedback.category}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedbackDetailDialog({
  feedback,
  open,
  onOpenChange,
  onUpdate,
}: {
  feedback: UserFeedback | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}) {
  const { toast } = useToast();
  const [newStatus, setNewStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [resolution, setResolution] = useState<string>("");

  const updateMutation = useMutation({
    mutationFn: async (data: { status: string; adminNotes?: string; resolution?: string }) => {
      const response = await apiRequest("PATCH", `/api/user-feedback/${feedback?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Feedback actualizado", description: "Los cambios se guardaron correctamente." });
      onUpdate();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!feedback) return null;

  const typeInfo = typeConfig[feedback.type] || typeConfig.general;
  const statusInfo = statusConfig[feedback.status] || statusConfig.new;
  const urgencyInfo = urgencyConfig[feedback.urgency] || urgencyConfig.medium;
  const TypeIcon = typeInfo.icon;

  const handleUpdateStatus = () => {
    if (!newStatus) return;
    updateMutation.mutate({
      status: newStatus,
      adminNotes: adminNotes || undefined,
      resolution: newStatus === "resolved" ? resolution : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-feedback-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${typeInfo.color}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            {feedback.title}
          </DialogTitle>
          <DialogDescription>
            Enviado por {feedback.userName || feedback.userEmail || "Anónimo"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className={typeInfo.color}>{typeInfo.label}</Badge>
            <Badge variant="secondary" className={statusInfo.color}>{statusInfo.label}</Badge>
            <Badge variant="outline" className={urgencyInfo.color}>Urgencia: {urgencyInfo.label}</Badge>
            {feedback.category && (
              <Badge variant="outline" className="capitalize">{feedback.category}</Badge>
            )}
          </div>

          <Separator />

          <div>
            <h4 className="font-medium text-sm mb-2">Descripción</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {feedback.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Rol de usuario:</span>
              <span className="ml-2 capitalize">{feedback.userRole || "Desconocido"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Fecha:</span>
              <span className="ml-2">{format(new Date(feedback.createdAt), "d MMM yyyy, HH:mm", { locale: es })}</span>
            </div>
            {feedback.pageUrl && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Página:</span>
                <span className="ml-2 text-primary">{feedback.pageUrl}</span>
              </div>
            )}
          </div>

          {feedback.adminNotes && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-sm mb-2">Notas del administrador</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {feedback.adminNotes}
                </p>
              </div>
            </>
          )}

          {feedback.resolution && (
            <div>
              <h4 className="font-medium text-sm mb-2">Resolución</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {feedback.resolution}
              </p>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Actualizar estado</h4>
            
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger data-testid="select-new-status">
                <SelectValue placeholder="Seleccionar nuevo estado" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Notas del administrador (opcional)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="min-h-[80px]"
              data-testid="textarea-admin-notes"
            />

            {newStatus === "resolved" && (
              <Textarea
                placeholder="Descripción de la resolución"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="min-h-[80px]"
                data-testid="textarea-resolution"
              />
            )}

            <Button
              onClick={handleUpdateStatus}
              disabled={!newStatus || updateMutation.isPending}
              className="w-full"
              data-testid="button-update-status"
            >
              {updateMutation.isPending ? "Guardando..." : "Actualizar estado"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminFeedbackManagement() {
  const queryClient = useQueryClient();
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data: stats } = useQuery<FeedbackStats>({
    queryKey: ["/api/user-feedback/stats"],
  });

  const { data, isLoading, refetch } = useQuery<FeedbackResponse>({
    queryKey: [
      "/api/user-feedback",
      statusFilter !== "all" ? `status=${statusFilter}` : "",
      typeFilter !== "all" ? `type=${typeFilter}` : "",
      urgencyFilter !== "all" ? `urgency=${urgencyFilter}` : "",
      `limit=${pageSize}`,
      `offset=${page * pageSize}`,
    ].filter(Boolean).join("&"),
  });

  const handleSelectFeedback = (feedback: UserFeedback) => {
    setSelectedFeedback(feedback);
    setDialogOpen(true);
  };

  const handleUpdate = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["/api/user-feedback/stats"] });
  };

  const filteredFeedback = (data?.feedback || []).filter((f) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query) ||
        f.userName?.toLowerCase().includes(query) ||
        f.userEmail?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  return (
    <div className="space-y-6" data-testid="admin-feedback-management">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Feedback</h1>
          <p className="text-muted-foreground">
            Administra los comentarios, reportes de errores y sugerencias de los usuarios
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.newCount || 0}</p>
              <p className="text-xs text-muted-foreground">Nuevos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.highUrgencyCount || 0}</p>
              <p className="text-xs text-muted-foreground">Alta urgencia</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {filteredFeedback.filter((f) => f.status === "resolved").length}
              </p>
              <p className="text-xs text-muted-foreground">Resueltos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descripción o usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-feedback"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(typeConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-urgency-filter">
                  <SelectValue placeholder="Urgencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(urgencyConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Cargando feedback...
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
              <p>No hay feedback que mostrar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedback.map((feedback) => (
                <FeedbackCard
                  key={feedback.id}
                  feedback={feedback}
                  onSelect={() => handleSelectFeedback(feedback)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                data-testid="button-next-page"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <FeedbackDetailDialog
        feedback={selectedFeedback}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
