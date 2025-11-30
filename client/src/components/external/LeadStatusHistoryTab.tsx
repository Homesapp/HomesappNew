import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  History,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LeadEmptyState } from "./LeadEmptyState";

interface LeadStatusHistoryTabProps {
  leadId: string;
}

const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  nuevo_lead: { es: "Nuevo Lead", en: "New Lead" },
  cita_coordinada: { es: "Cita Coordinada", en: "Appointment Scheduled" },
  interesado: { es: "Interesado", en: "Interested" },
  oferta_enviada: { es: "Oferta Enviada", en: "Offer Sent" },
  oferta_completada: { es: "Oferta Completada", en: "Offer Completed" },
  formato_enviado: { es: "Formato Enviado", en: "Form Sent" },
  formato_completado: { es: "Formato Completado", en: "Form Completed" },
  proceso_de_renta: { es: "Proceso de Renta", en: "Rental Process" },
  proceso_renta: { es: "Proceso de Renta", en: "Rental Process" },
  renta_concretada: { es: "Renta Concretada", en: "Rental Completed" },
  perdido: { es: "Lead Perdido", en: "Lead Lost" },
  muerto: { es: "Lead Muerto", en: "Dead Lead" },
};

const STATUS_COLORS: Record<string, string> = {
  nuevo_lead: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  cita_coordinada: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  interesado: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  oferta_enviada: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  oferta_completada: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  formato_enviado: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  formato_completado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  proceso_de_renta: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
  proceso_renta: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
  renta_concretada: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  perdido: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  muerto: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function LeadStatusHistoryTab({ leadId }: LeadStatusHistoryTabProps) {
  const { language } = useLanguage();

  const { data: statusHistory, isLoading } = useQuery({
    queryKey: ["/api/external-leads", leadId, "status-history"],
    queryFn: async () => {
      const res = await fetch(`/api/external-leads/${leadId}/status-history`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const getStatusLabel = (status: string) => {
    return STATUS_LABELS[status]?.[language] || status;
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status] || STATUS_COLORS.nuevo_lead;
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">
        {language === "es" ? "Historial de Estados" : "Status History"}
      </h4>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : statusHistory && statusHistory.length > 0 ? (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-4">
            {statusHistory.map((entry: any, index: number) => (
              <div key={entry.id || index} className="relative pl-10">
                <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.previousStatus && (
                      <>
                        <Badge className={getStatusColor(entry.previousStatus)}>
                          {getStatusLabel(entry.previousStatus)}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </>
                    )}
                    <Badge className={getStatusColor(entry.newStatus)}>
                      {getStatusLabel(entry.newStatus)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>
                      {entry.createdAt && format(new Date(entry.createdAt), "PPp", { 
                        locale: language === "es" ? es : enUS 
                      })}
                    </span>
                    {entry.changedByName && (
                      <>
                        <span>•</span>
                        <span>{entry.changedByName}</span>
                      </>
                    )}
                  </div>
                  {entry.reason && (
                    <p className="text-sm text-muted-foreground mt-2">{entry.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <LeadEmptyState
          icon={History}
          title={language === "es" ? "No hay historial" : "No history"}
          description={language === "es" ? "El historial de estados se creará automáticamente al cambiar el estado del lead" : "Status history will be created automatically when the lead status changes"}
          showAction={false}
        />
      )}
    </div>
  );
}
