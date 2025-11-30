import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Home,
  Plus,
  Activity,
  History,
  Loader2,
  Building2,
  Send,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LeadEmptyState } from "./LeadEmptyState";

interface LeadActivitiesTabProps {
  leadId: string;
}

type ActivityType = "call" | "email" | "meeting" | "whatsapp" | "showing" | "note" | "status_change";

const ACTIVITY_ICONS: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  whatsapp: MessageSquare,
  showing: Home,
  note: Activity,
  status_change: History,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  call: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  email: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  meeting: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  whatsapp: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  showing: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  note: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  status_change: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
};

const ACTIVITY_LABELS: Record<ActivityType, { es: string; en: string }> = {
  call: { es: "Llamada", en: "Call" },
  email: { es: "Correo", en: "Email" },
  meeting: { es: "Reunión", en: "Meeting" },
  whatsapp: { es: "WhatsApp", en: "WhatsApp" },
  showing: { es: "Visita", en: "Showing" },
  note: { es: "Nota", en: "Note" },
  status_change: { es: "Cambio de estado", en: "Status change" },
};

export default function LeadActivitiesTab({ leadId }: LeadActivitiesTabProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [newActivityType, setNewActivityType] = useState<ActivityType>("call");
  const [newActivityNotes, setNewActivityNotes] = useState("");

  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/external-leads", leadId, "activities"],
    queryFn: async () => {
      const res = await fetch(`/api/external-leads/${leadId}/activities`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/external-leads/${leadId}/activities`, {
        type: newActivityType,
        notes: newActivityNotes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads", leadId, "activities"] });
      setIsAddActivityOpen(false);
      setNewActivityNotes("");
      toast({
        title: language === "es" ? "Actividad registrada" : "Activity recorded",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error al registrar actividad" : "Error recording activity",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-sm">
          {language === "es" ? "Historial de Actividades" : "Activity History"}
        </h4>
        <Button 
          size="sm" 
          onClick={() => setIsAddActivityOpen(true)}
          data-testid="button-add-activity"
        >
          <Plus className="h-4 w-4 mr-1" />
          {language === "es" ? "Registrar" : "Record"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : activities && activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity: any) => {
            const activityType = activity.activityType || activity.type;
            const isPropertyActivity = activity.title?.toLowerCase().includes('propiedad') || 
                                       activity.title?.toLowerCase().includes('oferta de renta');
            const Icon = isPropertyActivity ? Building2 : (ACTIVITY_ICONS[activityType as ActivityType] || Activity);
            const colorClass = isPropertyActivity 
              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
              : (ACTIVITY_COLORS[activityType as ActivityType] || ACTIVITY_COLORS.note);
            
            return (
              <div 
                key={activity.id} 
                className={`flex gap-3 p-3 rounded-lg border bg-card ${isPropertyActivity ? 'border-indigo-200 dark:border-indigo-800' : ''}`}
                data-testid={`activity-item-${activity.id}`}
              >
                <div className={`p-2 rounded-lg ${colorClass} h-fit`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {activity.title || ACTIVITY_LABELS[activityType as ActivityType]?.[language] || activityType}
                    </span>
                    {isPropertyActivity && (
                      <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                        <Send className="h-3 w-3 mr-1" />
                        {language === "es" ? "Propiedad" : "Property"}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.createdAt && format(new Date(activity.createdAt), "PPp", { 
                      locale: language === "es" ? es : enUS 
                    })}
                  </span>
                  {(activity.description || activity.notes) && (
                    <p className="text-sm text-muted-foreground mt-1">{activity.description || activity.notes}</p>
                  )}
                  {activity.recordedByName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === "es" ? "Por: " : "By: "}{activity.recordedByName}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <LeadEmptyState
          icon={Activity}
          title={language === "es" ? "No hay actividades" : "No activities"}
          description={language === "es" ? "Registra llamadas, correos y reuniones con este lead" : "Record calls, emails and meetings with this lead"}
          actionLabel={language === "es" ? "Registrar actividad" : "Record activity"}
          actionIcon={Plus}
          onAction={() => setIsAddActivityOpen(true)}
          actionTestId="button-add-first-activity"
        />
      )}

      {/* Add Activity Dialog */}
      <Dialog open={isAddActivityOpen} onOpenChange={setIsAddActivityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Registrar Actividad" : "Record Activity"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {language === "es" ? "Tipo de Actividad" : "Activity Type"}
              </label>
              <Select value={newActivityType} onValueChange={(v) => setNewActivityType(v as ActivityType)}>
                <SelectTrigger data-testid="select-activity-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ACTIVITY_LABELS) as ActivityType[])
                    .filter(t => t !== "status_change")
                    .map((type) => (
                      <SelectItem key={type} value={type}>
                        {ACTIVITY_LABELS[type][language]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">
                {language === "es" ? "Notas" : "Notes"}
              </label>
              <Textarea
                value={newActivityNotes}
                onChange={(e) => setNewActivityNotes(e.target.value)}
                placeholder={language === "es" ? "Describe la actividad..." : "Describe the activity..."}
                rows={3}
                data-testid="textarea-activity-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddActivityOpen(false)}>
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              onClick={() => addActivityMutation.mutate()}
              disabled={addActivityMutation.isPending}
              data-testid="button-confirm-add-activity"
            >
              {addActivityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "es" ? "Guardar" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
