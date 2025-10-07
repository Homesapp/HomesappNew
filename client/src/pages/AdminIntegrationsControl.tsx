import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RefreshCw, Settings, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  id: string;
  name: string;
  status: "connected" | "disconnected";
  description: string;
  configFields: string[];
}

export default function AdminIntegrationsControl() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data, isLoading, refetch, isRefetching } = useQuery<{ integrations: Integration[] }>({
    queryKey: ["/api/admin/integrations/status"],
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: t("adminIntegrations.refreshing"),
      description: t("adminIntegrations.refreshingDescription"),
    });
  };

  const getStatusIcon = (status: string) => {
    return status === "connected" ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    return status === "connected" ? (
      <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
        {t("adminIntegrations.connected")}
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
        {t("adminIntegrations.disconnected")}
      </Badge>
    );
  };

  const connectedCount = data?.integrations.filter(i => i.status === "connected").length || 0;
  const totalCount = data?.integrations.length || 0;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
              {t("adminIntegrations.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("adminIntegrations.subtitle")}
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefetching}
            variant="outline"
            data-testid="button-refresh-integrations"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            {t("adminIntegrations.refresh")}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t("adminIntegrations.overview")}
              </CardTitle>
              <CardDescription>
                {t("adminIntegrations.overviewDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("adminIntegrations.activeIntegrations")}
                    </p>
                    <p className="text-3xl font-bold">
                      {connectedCount} / {totalCount}
                    </p>
                  </div>
                  {connectedCount < totalCount && (
                    <div className="flex items-center gap-2 ml-4 text-amber-600 dark:text-amber-500">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        {t("adminIntegrations.someDisconnected")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Integrations List */}
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              data?.integrations.map((integration) => (
                <Card 
                  key={integration.id} 
                  className={integration.status === "disconnected" ? "border-red-200 dark:border-red-900" : ""}
                  data-testid={`card-integration-${integration.id}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                    <CardDescription>{integration.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          {t("adminIntegrations.requiredFields")}:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {integration.configFields.map((field) => (
                            <Badge 
                              key={field} 
                              variant="secondary" 
                              className="text-xs font-mono"
                            >
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {integration.status === "disconnected" && (
                        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            {t("adminIntegrations.configurationRequired")}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
