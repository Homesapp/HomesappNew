import { type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PortalSummaryCardProps {
  title: string;
  icon: LucideIcon;
  value?: string | number;
  subtitle?: string;
  loading?: boolean;
  variant?: "default" | "success" | "warning" | "danger";
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
}

const variantStyles = {
  default: "",
  success: "border-green-500/30 bg-green-500/5",
  warning: "border-yellow-500/30 bg-yellow-500/5",
  danger: "border-destructive/30 bg-destructive/5",
};

const iconVariantStyles = {
  default: "text-muted-foreground",
  success: "text-green-600 dark:text-green-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  danger: "text-destructive",
};

export function PortalSummaryCard({
  title,
  icon: Icon,
  value,
  subtitle,
  loading = false,
  variant = "default",
  badge,
  action,
  children,
}: PortalSummaryCardProps) {
  if (loading) {
    return (
      <Card className={cn("overflow-hidden", variantStyles[variant])} data-testid="portal-summary-card-loading">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", variantStyles[variant])} data-testid={`portal-summary-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4 shrink-0", iconVariantStyles[variant])} />
      </CardHeader>
      <CardContent>
        {value !== undefined && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-bold">{value}</span>
            {badge && (
              <Badge variant={badge.variant || "secondary"} className="text-[10px]">
                {badge.label}
              </Badge>
            )}
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {children}
        {action && (
          <Button 
            variant="link" 
            size="sm" 
            className="h-auto p-0 mt-2 text-xs"
            onClick={action.onClick}
            data-testid={`button-action-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {action.label} →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface PortalSummaryGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function PortalSummaryGrid({ children, columns = 4 }: PortalSummaryGridProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-3 sm:gap-4", gridCols[columns])} data-testid="portal-summary-grid">
      {children}
    </div>
  );
}
