import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeadEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  showAction?: boolean;
  actionTestId?: string;
}

export function LeadEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  showAction = true,
  actionTestId,
}: LeadEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/50 mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
        {description}
      </p>
      {showAction && actionLabel && onAction && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={onAction}
          className="gap-2"
          data-testid={actionTestId}
        >
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
