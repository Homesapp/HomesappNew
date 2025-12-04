import { useLocation } from "wouter";
import { Building2, MapPin, Calendar, ChevronRight, Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PipelineStepper, type PipelineStep } from "./PipelineStepper";
import { cn } from "@/lib/utils";

export type ApplicationStatus = 
  | "contact_received"
  | "appointment_scheduled"
  | "appointment_completed"
  | "documents_pending"
  | "under_review"
  | "approved"
  | "contract_active"
  | "rejected";

interface ApplicationCardProps {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage?: string;
  propertyLocation?: string;
  status: ApplicationStatus;
  nextSteps?: string;
  appointmentDate?: string;
  hasActiveContract?: boolean;
  contractId?: string;
  onViewDetails?: () => void;
  compact?: boolean;
}

const statusConfig: Record<ApplicationStatus, { 
  label: string; 
  color: string; 
  icon: typeof Clock;
  step: number;
}> = {
  contact_received: { label: "Contacto recibido", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400", icon: Clock, step: 1 },
  appointment_scheduled: { label: "Cita programada", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400", icon: Calendar, step: 2 },
  appointment_completed: { label: "Cita completada", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400", icon: CheckCircle2, step: 2 },
  documents_pending: { label: "Documentos pendientes", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400", icon: FileText, step: 3 },
  under_review: { label: "En revisión", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400", icon: Clock, step: 3 },
  approved: { label: "Aprobado", color: "bg-green-500/10 text-green-700 dark:text-green-400", icon: CheckCircle2, step: 4 },
  contract_active: { label: "Contrato activo", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", icon: CheckCircle2, step: 5 },
  rejected: { label: "No aprobado", color: "bg-red-500/10 text-red-700 dark:text-red-400", icon: AlertCircle, step: 0 },
};

function getStepStatus(stepNumber: number, currentStep: number): "completed" | "current" | "pending" {
  if (stepNumber < currentStep) return "completed";
  if (stepNumber === currentStep) return "current";
  return "pending";
}

export function ApplicationCard({
  id,
  propertyId,
  propertyTitle,
  propertyImage,
  propertyLocation,
  status,
  nextSteps,
  appointmentDate,
  hasActiveContract,
  contractId,
  onViewDetails,
  compact = false,
}: ApplicationCardProps) {
  const [, setLocation] = useLocation();
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const pipelineSteps: PipelineStep[] = [
    { id: "contact", label: "Contacto", status: getStepStatus(1, config.step) },
    { id: "appointment", label: "Cita", status: getStepStatus(2, config.step) },
    { id: "review", label: "Revisión", status: getStepStatus(3, config.step) },
    { id: "approved", label: "Aprobado", status: getStepStatus(4, config.step) },
    { id: "contract", label: "Contrato", status: getStepStatus(5, config.step) },
  ];

  const handleViewProperty = () => {
    setLocation(`/propiedad/${propertyId}/completo`);
  };

  const handleGoToPortal = () => {
    if (contractId) {
      setLocation(`/portal/tenant?contract=${contractId}`);
    } else {
      setLocation("/portal/tenant");
    }
  };

  if (compact) {
    return (
      <Card className="hover-elevate cursor-pointer" onClick={onViewDetails} data-testid={`application-card-${id}`}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted shrink-0">
              {propertyImage ? (
                <img src={propertyImage} alt={propertyTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-1">{propertyTitle}</h4>
              <Badge className={cn("text-[10px] mt-1", config.color)}>
                {config.label}
              </Badge>
              {nextSteps && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{nextSteps}</p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 self-center" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" data-testid={`application-card-${id}`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-32 md:w-40 h-32 sm:h-auto bg-muted shrink-0">
            {propertyImage ? (
              <img 
                src={propertyImage} 
                alt={propertyTitle} 
                className="w-full h-full object-cover cursor-pointer"
                onClick={handleViewProperty}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={handleViewProperty}>
                <Building2 className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h4 className="font-semibold text-sm sm:text-base line-clamp-1">{propertyTitle}</h4>
                {propertyLocation && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {propertyLocation}
                  </p>
                )}
              </div>
              <Badge className={cn("shrink-0", config.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>

            <div className="pt-1">
              <PipelineStepper steps={pipelineSteps} compact />
            </div>

            {(nextSteps || appointmentDate) && (
              <div className="text-xs text-muted-foreground space-y-1">
                {appointmentDate && status === "appointment_scheduled" && (
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Cita: {appointmentDate}
                  </p>
                )}
                {nextSteps && (
                  <p className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    Próximo paso: {nextSteps}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              {hasActiveContract ? (
                <Button size="sm" onClick={handleGoToPortal} data-testid="button-go-portal">
                  Ir al Portal
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleViewProperty} data-testid="button-view-property">
                    Ver propiedad
                  </Button>
                  {onViewDetails && (
                    <Button size="sm" onClick={onViewDetails} data-testid="button-view-details">
                      Ver detalles
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
