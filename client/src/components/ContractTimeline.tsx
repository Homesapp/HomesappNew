import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Home,
  DollarSign,
  FileSignature,
  Upload,
  Send,
  Mail,
  Bell,
  Plus,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ContractEvent } from "@shared/schema";

interface ContractTimelineProps {
  contractId: string;
  contractData: {
    createdAt: string;
    apartadoDate?: string | null;
    contractSignedDate?: string | null;
    checkInDate?: string | null;
    payoutReleasedAt?: string | null;
    notes?: string | null;
  };
  readOnly?: boolean;
}

const EVENT_ICONS: Record<string, typeof FileText> = {
  status_change: CheckCircle,
  note_added: MessageSquare,
  document_uploaded: Upload,
  document_verified: FileSignature,
  payment_recorded: DollarSign,
  terms_signed: FileSignature,
  email_sent: Mail,
  reminder_sent: Bell,
  comment: MessageSquare,
};

const EVENT_COLORS: Record<string, string> = {
  status_change: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
  note_added: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  document_uploaded: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
  document_verified: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  payment_recorded: "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
  terms_signed: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  email_sent: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400",
  reminder_sent: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  comment: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const MILESTONE_EVENTS = [
  { key: "created", title: "Contrato creado", icon: FileText, color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
  { key: "apartado", title: "Apartado confirmado", icon: Clock, color: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
  { key: "signed", title: "Contrato firmado", icon: FileSignature, color: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" },
  { key: "checkin", title: "Check-in realizado", icon: Home, color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" },
  { key: "payout", title: "Pago liberado", icon: DollarSign, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
];

export default function ContractTimeline({ contractId, contractData, readOnly = false }: ContractTimelineProps) {
  const { toast } = useToast();
  const [newNote, setNewNote] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: events = [], isLoading, refetch } = useQuery<ContractEvent[]>({
    queryKey: ["/api/contract-events", contractId],
    enabled: !!contractId,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      return apiRequest(`/api/contract-events/${contractId}`, {
        method: "POST",
        body: JSON.stringify({
          eventType: "note_added",
          title: "Nota agregada",
          description: note,
        }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contract-events", contractId] });
      setNewNote("");
      toast({
        title: "Nota agregada",
        description: "La nota se ha guardado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar la nota",
        variant: "destructive",
      });
    },
  });

  const getMilestoneStatus = (key: string) => {
    switch (key) {
      case "created":
        return { completed: true, date: contractData.createdAt };
      case "apartado":
        return { completed: !!contractData.apartadoDate, date: contractData.apartadoDate };
      case "signed":
        return { completed: !!contractData.contractSignedDate, date: contractData.contractSignedDate };
      case "checkin":
        return { completed: !!contractData.checkInDate, date: contractData.checkInDate };
      case "payout":
        return { completed: !!contractData.payoutReleasedAt, date: contractData.payoutReleasedAt };
      default:
        return { completed: false, date: null };
    }
  };

  const allTimelineItems = [
    ...MILESTONE_EVENTS.map(milestone => {
      const status = getMilestoneStatus(milestone.key);
      return {
        id: `milestone-${milestone.key}`,
        type: "milestone" as const,
        eventType: milestone.key,
        title: milestone.title,
        description: null,
        createdAt: status.date || "",
        completed: status.completed,
        icon: milestone.icon,
        color: milestone.color,
        userName: null,
      };
    }).filter(item => item.completed),
    ...events.map(event => ({
      id: event.id,
      type: "event" as const,
      eventType: event.eventType,
      title: event.title,
      description: event.description,
      createdAt: event.createdAt,
      completed: true,
      icon: EVENT_ICONS[event.eventType] || MessageSquare,
      color: EVENT_COLORS[event.eventType] || EVENT_COLORS.comment,
      userName: event.userName,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredItems = filterType === "all" 
    ? allTimelineItems 
    : filterType === "milestones"
      ? allTimelineItems.filter(item => item.type === "milestone")
      : allTimelineItems.filter(item => item.eventType === filterType);

  return (
    <div className="space-y-4">
      {/* Progress Milestones */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" />
            Progreso del Contrato
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            {MILESTONE_EVENTS.map((milestone, index) => {
              const status = getMilestoneStatus(milestone.key);
              const Icon = milestone.icon;
              return (
                <div key={milestone.key} className="flex flex-col items-center relative">
                  {index > 0 && (
                    <div 
                      className={`absolute top-4 -left-1/2 w-full h-0.5 -translate-x-1/2 ${
                        status.completed ? "bg-green-500" : "bg-muted"
                      }`}
                      style={{ width: "calc(100% + 2rem)" }}
                    />
                  )}
                  <div 
                    className={`relative z-10 p-2 rounded-full ${
                      status.completed 
                        ? milestone.color 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs mt-1 text-center max-w-[80px]">{milestone.title}</span>
                  {status.date && (
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(status.date), "dd/MM")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Timeline & Notes */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Línea de Tiempo
              </CardTitle>
              <CardDescription>
                Historial de eventos y notas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[160px]" data-testid="select-filter-events">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="milestones">Hitos</SelectItem>
                  <SelectItem value="status_change">Cambios de estado</SelectItem>
                  <SelectItem value="note_added">Notas</SelectItem>
                  <SelectItem value="document_uploaded">Documentos</SelectItem>
                  <SelectItem value="payment_recorded">Pagos</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => refetch()}
                data-testid="button-refresh-timeline"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Note Form */}
          {!readOnly && (
            <div className="space-y-2 pb-4 border-b">
              <Textarea
                placeholder="Agregar una nota o comentario interno..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-new-note"
              />
              <Button 
                className="w-full" 
                disabled={!newNote.trim() || addNoteMutation.isPending}
                onClick={() => newNote.trim() && addNoteMutation.mutate(newNote)}
                data-testid="button-add-note"
              >
                {addNoteMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Nota
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Timeline */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start gap-4">
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {filterType !== "all" 
                  ? "No hay eventos de este tipo" 
                  : "No hay eventos registrados aún"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className={`mt-0.5 p-2 rounded-full flex-shrink-0 ${item.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.type === "event" && (
                          <Badge variant="outline" className="flex-shrink-0 text-xs">
                            {item.eventType === "note_added" ? "Nota" : 
                             item.eventType === "status_change" ? "Estado" :
                             item.eventType === "document_uploaded" ? "Doc" : "Evento"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {item.createdAt && (
                          <span>
                            {format(new Date(item.createdAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                          </span>
                        )}
                        {item.userName && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.userName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legacy Notes (from contract.notes field) */}
          {contractData.notes && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notas del contrato
              </h4>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{contractData.notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
