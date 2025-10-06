import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface PendingAction {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  link: string;
  icon: "alert" | "clock" | "check";
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

interface ActionsDashboardProps {
  role: string;
  userId?: string;
}

export function ActionsDashboard({ role, userId }: ActionsDashboardProps) {
  const { data: pendingActions, isLoading: loadingActions } = useQuery<PendingAction[]>({
    queryKey: ["/api/dashboard/pending-actions", userId, role],
    enabled: !!userId,
  });

  const { data: metrics, isLoading: loadingMetrics } = useQuery<MetricCard[]>({
    queryKey: ["/api/dashboard/metrics", userId, role],
    enabled: !!userId,
  });

  const getIconComponent = (icon: string) => {
    switch (icon) {
      case "alert":
        return AlertCircle;
      case "clock":
        return Clock;
      case "check":
        return CheckCircle;
      default:
        return AlertCircle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  if (loadingActions || loadingMetrics) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="actions-dashboard">
      {/* Métricas Clave */}
      {metrics && metrics.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <Card key={index} className="hover-elevate transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                {metric.trend && (
                  <TrendingUp
                    className={`h-4 w-4 ${
                      metric.trend === "up"
                        ? "text-green-500"
                        : metric.trend === "down"
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.change && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.change}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Acciones Pendientes */}
      {pendingActions && pendingActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Acciones Pendientes
            </CardTitle>
            <CardDescription>
              Tareas que requieren tu atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingActions.map((action) => {
                const Icon = getIconComponent(action.icon);
                return (
                  <div
                    key={action.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover-elevate active-elevate-2 transition-all"
                    data-testid={`action-${action.id}`}
                  >
                    <div className="flex-shrink-0">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{action.title}</h4>
                        <Badge variant={getPriorityColor(action.priority) as any}>
                          {action.priority === "high"
                            ? "Alta"
                            : action.priority === "medium"
                            ? "Media"
                            : "Baja"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <Link href={action.link}>
                      <Button size="sm" data-testid={`button-action-${action.id}`}>
                        Ver
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingActions && pendingActions.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-medium mb-1">¡Todo al día!</h3>
            <p className="text-sm text-muted-foreground">
              No tienes acciones pendientes en este momento
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
