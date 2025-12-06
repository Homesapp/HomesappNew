import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { es as esLocale, enUS as enLocale } from "date-fns/locale";
import { Check, AlertCircle, MessageSquare, ThumbsUp, ThumbsDown, Bug, Lightbulb, HelpCircle, Clock } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Feedback {
  id: string;
  userId: string;
  userEmail?: string;
  type: string;
  message: string;
  pageUrl?: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface FeedbackListProps {
  language: "es" | "en";
}

const typeIcons: Record<string, typeof MessageSquare> = {
  suggestion: Lightbulb,
  bug: Bug,
  complaint: ThumbsDown,
  praise: ThumbsUp,
  question: HelpCircle,
  other: MessageSquare,
};

const typeLabels: Record<string, Record<string, string>> = {
  es: {
    suggestion: "Sugerencia",
    bug: "Bug",
    complaint: "Queja",
    praise: "Elogio",
    question: "Pregunta",
    other: "Otro",
  },
  en: {
    suggestion: "Suggestion",
    bug: "Bug",
    complaint: "Complaint",
    praise: "Praise",
    question: "Question",
    other: "Other",
  },
};

const statusLabels: Record<string, Record<string, string>> = {
  es: {
    pending: "Pendiente",
    in_progress: "En Progreso",
    resolved: "Resuelto",
    dismissed: "Descartado",
  },
  en: {
    pending: "Pending",
    in_progress: "In Progress",
    resolved: "Resolved",
    dismissed: "Dismissed",
  },
};

export function FeedbackList({ language }: FeedbackListProps) {
  const { toast } = useToast();
  const locale = language === "es" ? esLocale : enLocale;
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const t = {
    es: {
      loading: "Cargando feedback...",
      noFeedback: "No hay feedback registrado",
      noFeedbackDesc: "Cuando los usuarios envíen comentarios, aparecerán aquí",
      filterAll: "Todos",
      filterPending: "Pendientes",
      filterResolved: "Resueltos",
      markResolved: "Marcar resuelto",
      from: "De",
      page: "Página",
      resolved: "Resuelto",
    },
    en: {
      loading: "Loading feedback...",
      noFeedback: "No feedback registered",
      noFeedbackDesc: "When users send comments, they will appear here",
      filterAll: "All",
      filterPending: "Pending",
      filterResolved: "Resolved",
      markResolved: "Mark resolved",
      from: "From",
      page: "Page",
      resolved: "Resolved",
    },
  }[language];

  const { data: feedbackList, isLoading } = useQuery<Feedback[]>({
    queryKey: ['/api/feedback', statusFilter],
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/feedback/${id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ status: 'resolved' }) 
      }),
    onSuccess: () => {
      toast({ title: t.resolved });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const filtered = feedbackList?.filter(f => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return f.status === "pending";
    if (statusFilter === "resolved") return f.status === "resolved";
    return true;
  }) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-feedback-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.filterAll}</SelectItem>
            <SelectItem value="pending">{t.filterPending}</SelectItem>
            <SelectItem value="resolved">{t.filterResolved}</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline">{filtered.length}</Badge>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="font-medium">{t.noFeedback}</p>
          <p className="text-sm text-muted-foreground">{t.noFeedbackDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((feedback) => {
            const Icon = typeIcons[feedback.type] || MessageSquare;
            return (
              <Card key={feedback.id} data-testid={`card-feedback-${feedback.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-full bg-muted">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[language][feedback.type] || feedback.type}
                          </Badge>
                          <Badge 
                            variant={feedback.status === "resolved" ? "default" : "secondary"} 
                            className="text-xs"
                          >
                            {feedback.status === "resolved" ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {statusLabels[language][feedback.status] || feedback.status}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{feedback.message}</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {feedback.userEmail && (
                            <p>{t.from}: {feedback.userEmail}</p>
                          )}
                          {feedback.pageUrl && (
                            <p>{t.page}: {feedback.pageUrl}</p>
                          )}
                          <p>
                            {formatDistanceToNow(new Date(feedback.createdAt), { 
                              addSuffix: true, 
                              locale 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    {feedback.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveMutation.mutate(feedback.id)}
                        disabled={resolveMutation.isPending}
                        data-testid={`button-resolve-${feedback.id}`}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t.markResolved}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
