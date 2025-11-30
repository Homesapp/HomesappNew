import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ThumbsUp,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface LeadShowingsTabProps {
  leadId: string;
}

type ShowingOutcome = "interested" | "not_interested" | "pending" | "cancelled";

const OUTCOME_COLORS: Record<ShowingOutcome, string> = {
  interested: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  not_interested: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const OUTCOME_LABELS: Record<ShowingOutcome, { es: string; en: string }> = {
  interested: { es: "Interesado", en: "Interested" },
  not_interested: { es: "No interesado", en: "Not interested" },
  pending: { es: "Pendiente", en: "Pending" },
  cancelled: { es: "Cancelada", en: "Cancelled" },
};

export default function LeadShowingsTab({ leadId }: LeadShowingsTabProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isAddShowingOpen, setIsAddShowingOpen] = useState(false);
  const [newShowingProperty, setNewShowingProperty] = useState("");
  const [newShowingDate, setNewShowingDate] = useState("");
  const [newShowingNotes, setNewShowingNotes] = useState("");

  const { data: showings, isLoading } = useQuery({
    queryKey: ["/api/external-leads", leadId, "showings"],
    queryFn: async () => {
      const res = await fetch(`/api/external-leads/${leadId}/showings`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const addShowingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/external-leads/${leadId}/showings`, {
        propertyDescription: newShowingProperty,
        scheduledDate: newShowingDate,
        notes: newShowingNotes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads", leadId, "showings"] });
      setIsAddShowingOpen(false);
      setNewShowingProperty("");
      setNewShowingDate("");
      setNewShowingNotes("");
      toast({
        title: language === "es" ? "Visita programada" : "Showing scheduled",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error al programar visita" : "Error scheduling showing",
      });
    },
  });

  const getOutcomeIcon = (outcome: ShowingOutcome) => {
    switch (outcome) {
      case "interested": return ThumbsUp;
      case "not_interested": return XCircle;
      case "cancelled": return XCircle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-sm">
          {language === "es" ? "Visitas a Propiedades" : "Property Showings"}
        </h4>
        <Button 
          size="sm" 
          onClick={() => setIsAddShowingOpen(true)}
          data-testid="button-schedule-showing"
        >
          <Plus className="h-4 w-4 mr-1" />
          {language === "es" ? "Programar" : "Schedule"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : showings && showings.length > 0 ? (
        <div className="space-y-3">
          {showings.map((showing: any) => {
            const outcome = (showing.outcome || "pending") as ShowingOutcome;
            const OutcomeIcon = getOutcomeIcon(outcome);
            return (
              <div 
                key={showing.id} 
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                      <Home className="h-4 w-4 text-orange-700 dark:text-orange-300" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {showing.propertyDescription || showing.unitNumber || (language === "es" ? "Propiedad" : "Property")}
                      </p>
                      {showing.scheduledDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(showing.scheduledDate), "PPp", { 
                            locale: language === "es" ? es : enUS 
                          })}
                        </p>
                      )}
                      {showing.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{showing.notes}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={OUTCOME_COLORS[outcome]}>
                    <OutcomeIcon className="h-3 w-3 mr-1" />
                    {OUTCOME_LABELS[outcome][language]}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed bg-muted/20">
          <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
            <Home className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm">{language === "es" ? "No hay visitas programadas" : "No showings scheduled"}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setIsAddShowingOpen(true)}
            data-testid="button-schedule-first-showing"
          >
            <Plus className="h-4 w-4 mr-1" />
            {language === "es" ? "Programar primera visita" : "Schedule first showing"}
          </Button>
        </div>
      )}

      {/* Schedule Showing Dialog */}
      <Dialog open={isAddShowingOpen} onOpenChange={setIsAddShowingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Programar Visita" : "Schedule Showing"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {language === "es" ? "Propiedad" : "Property"}
              </label>
              <Input
                value={newShowingProperty}
                onChange={(e) => setNewShowingProperty(e.target.value)}
                placeholder={language === "es" ? "Ej: Naia E302" : "E.g: Naia E302"}
                data-testid="input-showing-property"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                {language === "es" ? "Fecha y Hora" : "Date and Time"}
              </label>
              <Input
                type="datetime-local"
                value={newShowingDate}
                onChange={(e) => setNewShowingDate(e.target.value)}
                data-testid="input-showing-date"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                {language === "es" ? "Notas" : "Notes"}
              </label>
              <Textarea
                value={newShowingNotes}
                onChange={(e) => setNewShowingNotes(e.target.value)}
                placeholder={language === "es" ? "Notas adicionales..." : "Additional notes..."}
                rows={2}
                data-testid="textarea-showing-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddShowingOpen(false)}>
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              onClick={() => addShowingMutation.mutate()}
              disabled={!newShowingProperty || addShowingMutation.isPending}
              data-testid="button-confirm-schedule-showing"
            >
              {addShowingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "es" ? "Programar" : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
