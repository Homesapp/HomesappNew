import { Check, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PipelineStep = {
  id: string;
  label: string;
  description?: string;
  status: "completed" | "current" | "pending" | "error";
  date?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

interface PipelineStepperProps {
  steps: PipelineStep[];
  orientation?: "horizontal" | "vertical";
  compact?: boolean;
}

const statusIcons = {
  completed: Check,
  current: Clock,
  pending: Clock,
  error: AlertCircle,
};

const statusColors = {
  completed: "bg-green-500 text-white border-green-500",
  current: "bg-primary text-primary-foreground border-primary",
  pending: "bg-muted text-muted-foreground border-muted-foreground/30",
  error: "bg-destructive text-destructive-foreground border-destructive",
};

const lineColors = {
  completed: "bg-green-500",
  current: "bg-primary",
  pending: "bg-muted-foreground/30",
  error: "bg-destructive",
};

export function PipelineStepper({ steps, orientation = "horizontal", compact = false }: PipelineStepperProps) {
  if (orientation === "vertical") {
    return (
      <div className="space-y-0" data-testid="pipeline-stepper-vertical">
        {steps.map((step, index) => {
          const Icon = statusIcons[step.status];
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="flex gap-3" data-testid={`pipeline-step-${step.id}`}>
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0",
                  statusColors[step.status]
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                {!isLast && (
                  <div className={cn(
                    "w-0.5 flex-1 min-h-[24px]",
                    lineColors[step.status === "completed" ? "completed" : "pending"]
                  )} />
                )}
              </div>
              
              <div className={cn("pb-6", isLast && "pb-0")}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "font-medium text-sm",
                    step.status === "pending" && "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                  {step.status === "current" && (
                    <Badge variant="default" className="text-[10px] h-5">
                      Actual
                    </Badge>
                  )}
                </div>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                )}
                {step.date && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.date}
                  </p>
                )}
                {step.action && step.status === "current" && (
                  <button
                    onClick={step.action.onClick}
                    className="text-xs text-primary hover:underline mt-1 font-medium"
                    data-testid={`button-action-${step.id}`}
                  >
                    {step.action.label} →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full" data-testid="pipeline-stepper-horizontal">
      <div className={cn(
        "flex items-center",
        compact ? "gap-1" : "gap-2"
      )}>
        {steps.map((step, index) => {
          const Icon = statusIcons[step.status];
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none" data-testid={`pipeline-step-${step.id}`}>
              <div className="flex flex-col items-center">
                <div className={cn(
                  "rounded-full flex items-center justify-center border-2 shrink-0",
                  compact ? "w-6 h-6" : "w-8 h-8",
                  statusColors[step.status]
                )}>
                  <Icon className={compact ? "h-3 w-3" : "h-4 w-4"} />
                </div>
                {!compact && (
                  <span className={cn(
                    "text-[10px] mt-1 text-center max-w-[80px] line-clamp-2",
                    step.status === "pending" ? "text-muted-foreground" : "text-foreground"
                  )}>
                    {step.label}
                  </span>
                )}
              </div>
              
              {!isLast && (
                <div className={cn(
                  "flex-1 h-0.5 mx-1",
                  step.status === "completed" ? lineColors.completed : lineColors.pending
                )} />
              )}
            </div>
          );
        })}
      </div>
      
      {compact && (
        <div className="flex justify-between mt-1">
          {steps.map((step) => (
            <span 
              key={step.id}
              className={cn(
                "text-[9px] text-center flex-1",
                step.status === "pending" ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {step.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
