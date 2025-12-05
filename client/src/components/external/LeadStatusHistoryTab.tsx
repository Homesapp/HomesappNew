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
  opciones_enviadas: { es: "Opciones Enviadas", en: "Options Sent" },
  cita_coordinada: { es: "Cita Coordinada", en: "Appointment Scheduled" },
  cita_concretada: { es: "Cita Concretada", en: "Appointment Completed" },
  cita_cancelada: { es: "Cita Cancelada", en: "Appointment Cancelled" },
  reprogramar_cita: { es: "Reprogramar Cita", en: "Reschedule" },
  interesado: { es: "Interesado", en: "Interested" },
  oferta_enviada: { es: "Oferta Enviada", en: "Offer Sent" },
  formato_renta_enviado: { es: "Formato Renta Enviado", en: "Rental Form Sent" },
  proceso_renta: { es: "Proceso de Renta", en: "Rental Process" },
  renta_concretada: { es: "Renta Concretada", en: "Rental Completed" },
  no_responde: { es: "No Responde", en: "No Response" },
  muerto: { es: "Lead Muerto", en: "Dead Lead" },
  no_dar_servicio: { es: "No Dar Servicio", en: "Do Not Service" },
};

const STATUS_COLORS: Record<string, string> = {
  nuevo_lead: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  opciones_enviadas: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  cita_coordinada: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  cita_concretada: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  cita_cancelada: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  reprogramar_cita: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  interesado: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
  oferta_enviada: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  formato_renta_enviado: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  proceso_renta: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  renta_concretada: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  no_responde: "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
  muerto: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  no_dar_servicio: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
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
