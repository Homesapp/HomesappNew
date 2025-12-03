import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings, FileText, CheckCircle, XCircle, Plus, Edit, Trash2, Building2, Plug, Calendar, Bot, FileSpreadsheet, Upload, Download, Eye, MapPin, Home, List, Users, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

const termsFormSchema = z.object({
  version: z.string().min(1, "Version is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["tenant", "owner"]),
});

type TermsFormData = z.infer<typeof termsFormSchema>;

// Backfill Presentation Cards Component
function BackfillPresentationCards({ language, toast }: { language: string; toast: any }) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors?: string[] } | null>(null);

  const backfillMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/external-leads/backfill-presentation-cards");
    },
    onSuccess: (data: any) => {
      setResult(data);
      toast({
        title: language === "es" ? "Backfill completado" : "Backfill complete",
        description: language === "es" 
          ? `Se crearon ${data.created} tarjetas, ${data.skipped} leads ya tenían tarjetas`
          : `Created ${data.created} cards, ${data.skipped} leads already had cards`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/external-presentation-cards"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error en backfill" : "Backfill error",
        variant: "destructive",
        description: error.message,
      });
    },
    onSettled: () => {
      setIsRunning(false);
    },
  });

  const handleBackfill = () => {
    setIsRunning(true);
    setResult(null);
    backfillMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button 
          onClick={handleBackfill} 
          disabled={isRunning}
          data-testid="button-backfill-cards"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {language === "es" ? "Procesando..." : "Processing..."}
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              {language === "es" ? "Generar Tarjetas Iniciales" : "Generate Initial Cards"}
            </>
          )}
        </Button>
      </div>
      
      {result && (
        <div className="p-4 rounded-lg bg-muted">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="font-medium">
              {language === "es" ? "Resultados" : "Results"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">
                {language === "es" ? "Tarjetas creadas:" : "Cards created:"}
              </span>
              <span className="ml-2 font-medium">{result.created}</span>
            </div>
            <div>
              <span className="text-muted-foreground">
                {language === "es" ? "Leads ya con tarjetas:" : "Leads with cards:"}
              </span>
              <span className="ml-2 font-medium">{result.skipped}</span>
            </div>
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  {language === "es" ? `${result.errors.length} errores` : `${result.errors.length} errors`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      
      <p className="text-sm text-muted-foreground">
        {language === "es" 
          ? "Esta acción creará tarjetas de presentación iniciales basadas en los datos de registro de cada lead que aún no tenga tarjetas."
          : "This will create initial presentation cards based on each lead's registration data for leads that don't have any cards yet."}
      </p>
    </div>
  );
}

export default function ExternalConfiguration() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"terms" | "designs" | "integrations" | "data" | "catalogs">("terms");
  const [termsSubTab, setTermsSubTab] = useState<"tenant" | "owner">("tenant");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTerms, setEditingTerms] = useState<any>(null);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);

  const form = useForm<TermsFormData>({
    resolver: zodResolver(termsFormSchema),
    defaultValues: {
      version: "",
      title: "",
      content: "",
      type: "tenant",
    },
  });

  // Fetch current user to check role
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user'],
  });
  
  // Check if user can switch agencies (only master/admin can)
  const canSwitchAgencies = currentUser?.role && ["master", "admin"].includes(currentUser.role);

  // Fetch all terms
  const { data: allTerms, isLoading } = useQuery({
    queryKey: ['/api/external/configuration/terms'],
  });

  // Fetch agency data for PDF template selection
  const { data: agencies, isLoading: isLoadingAgencies } = useQuery({
    queryKey: ['/api/external-agencies'],
  });
  
  // Derive agency using useMemo for proper reactivity
  const agency = useMemo(() => {
    if (!agencies || agencies.length === 0) return undefined;
    
    // Auto-select if only one agency
    if (agencies.length === 1) return agencies[0];
    
    // For multiple agencies, use selected ID or default to first
    if (selectedAgencyId) {
      return agencies.find((a: any) => a.id === selectedAgencyId) || agencies[0];
    }
    
    // Auto-select first agency for multi-agency contexts
    return agencies[0];
  }, [agencies, selectedAgencyId]);
  
  const hasNoAgency = !isLoadingAgencies && (!agencies || agencies.length === 0);
  const hasMultipleAgencies = !isLoadingAgencies && agencies && agencies.length > 1;
  
  // Auto-select first agency when agencies load and we don't have a selection
  useEffect(() => {
    if (hasMultipleAgencies && !selectedAgencyId && agencies && agencies.length > 0) {
      setSelectedAgencyId(agencies[0].id);
    }
  }, [agencies, hasMultipleAgencies, selectedAgencyId]);

  // Filter terms by type
  const tenantTerms = allTerms?.filter((term: any) => term.type === "tenant") || [];
  const ownerTerms = allTerms?.filter((term: any) => term.type === "owner") || [];

  // Create/Update mutation
  const createOrUpdateMutation = useMutation({
    mutationFn: async (data: TermsFormData) => {
      if (editingTerms) {
        return apiRequest('PATCH', `/api/external/configuration/terms/${editingTerms.id}`, data);
      } else {
        return apiRequest('POST', '/api/external/configuration/terms', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/configuration/terms'] });
      toast({
        title: t("configuration.saved"),
        description: t("configuration.savedDesc"),
      });
      setIsDialogOpen(false);
      form.reset();
      setEditingTerms(null);
    },
    onError: (error: any) => {
      toast({
        title: t("configuration.saveError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/external/configuration/terms/${id}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/configuration/terms'] });
      toast({
        title: t("configuration.published"),
        description: t("configuration.publishedDesc"),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unpublish mutation
  const unpublishMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/external/configuration/terms/${id}/unpublish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/configuration/terms'] });
      toast({
        title: t("configuration.unpublished"),
        description: t("configuration.unpublishedDesc"),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/external/configuration/terms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/configuration/terms'] });
      toast({
        title: "Eliminado",
        description: "Los términos y condiciones han sido eliminados",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update PDF template style mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (templateStyle: string) => {
      if (!agency) throw new Error("No agency found");
      return apiRequest('PATCH', `/api/external-agencies/${agency.id}`, {
        pdfTemplateStyle: templateStyle,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agencies'] });
      toast({
        title: language === "es" ? "Diseño actualizado" : "Design updated",
        description: language === "es" 
          ? "El diseño de PDF ha sido actualizado exitosamente"
          : "PDF design has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (terms?: any) => {
    if (terms) {
      setEditingTerms(terms);
      form.reset({
        version: terms.version,
        title: terms.title,
        content: terms.content,
        type: terms.type,
      });
    } else {
      setEditingTerms(null);
      form.reset({
        version: "",
        title: "",
        content: "",
        type: termsSubTab,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: TermsFormData) => {
    createOrUpdateMutation.mutate(data);
  };

  const renderTermsList = (terms: any[], type: "tenant" | "owner") => {
    if (terms.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-2">{t("configuration.noTerms")}</p>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {t("configuration.noTermsDesc")}
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              data-testid={`button-create-terms-${type}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("configuration.createTerms")}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {terms.map((term: any) => (
          <Card key={term.id} data-testid={`card-terms-${term.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{term.title}</CardTitle>
                    {term.isActive && (
                      <Badge variant="default" className="ml-2" data-testid={`badge-active-${term.id}`}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t("configuration.isActive")}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {t("configuration.version")}: {term.version}
                    {term.publishedAt && (
                      <span className="ml-4">
                        {t("configuration.publishedAt")}: {new Date(term.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(term)}
                    data-testid={`button-edit-${term.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {term.isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unpublishMutation.mutate(term.id)}
                      data-testid={`button-unpublish-${term.id}`}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => publishMutation.mutate(term.id)}
                      data-testid={`button-publish-${term.id}`}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(term.id)}
                    disabled={term.isActive}
                    data-testid={`button-delete-${term.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none dark:prose-invert">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                  {term.content}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Integrations Content Component
  const IntegrationsContent = ({ agencyId, agency, language, toast }: { agencyId?: string, agency?: any, language: string, toast: any }) => {
    const [openaiApiKey, setOpenaiApiKey] = useState("");
    const [useReplitIntegration, setUseReplitIntegration] = useState(true);
    const [aiCreditsEnabled, setAiCreditsEnabled] = useState(true);

    // Fetch integrations
    const { data: integrations, isLoading: isLoadingIntegrations } = useQuery({
      queryKey: [`/api/external-agencies/${agencyId}/integrations`],
      enabled: !!agencyId,
    });

    // Hydrate local state when integrations data loads
    useEffect(() => {
      if (integrations) {
        setUseReplitIntegration(integrations.openaiUseReplitIntegration ?? true);
      }
    }, [integrations]);

    // Hydrate AI credits toggle from agency data
    useEffect(() => {
      if (agency) {
        setAiCreditsEnabled(agency.aiCreditsEnabled ?? true);
      }
    }, [agency]);

    // Update AI Credits mutation
    const updateAiCreditsMutation = useMutation({
      mutationFn: async (enabled: boolean) => {
        return apiRequest('PATCH', `/api/external-agencies/${agencyId}`, { aiCreditsEnabled: enabled });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/external-agencies'] });
        toast({
          title: language === "es" ? "Configuración actualizada" : "Configuration updated",
          description: language === "es" 
            ? "La configuración de IA se actualizó correctamente." 
            : "AI configuration updated successfully.",
        });
      },
      onError: (error: any) => {
        setAiCreditsEnabled(!aiCreditsEnabled);
        toast({
          title: language === "es" ? "Error" : "Error",
          description: error.message || (language === "es" ? "Error al actualizar configuración" : "Failed to update configuration"),
          variant: "destructive",
        });
      },
    });

    // Update OpenAI mutation
    const updateOpenAIMutation = useMutation({
      mutationFn: async (config: { apiKey?: string, useReplitIntegration: boolean }) => {
        return apiRequest('PATCH', `/api/external-agencies/${agencyId}/integrations/openai`, config);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/external-agencies/${agencyId}/integrations`] });
        toast({
          title: language === "es" ? "OpenAI configurado" : "OpenAI configured",
          description: language === "es" 
            ? "La configuración de OpenAI se actualizó correctamente." 
            : "OpenAI configuration updated successfully.",
        });
        setOpenaiApiKey("");
      },
      onError: (error: any) => {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: error.message || (language === "es" ? "Error al configurar OpenAI" : "Failed to configure OpenAI"),
          variant: "destructive",
        });
      },
    });

    // Disconnect Google Calendar mutation
    const disconnectGoogleCalendarMutation = useMutation({
      mutationFn: async () => {
        return apiRequest('DELETE', `/api/external-agencies/${agencyId}/integrations/google-calendar`, {});
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/external-agencies/${agencyId}/integrations`] });
        toast({
          title: language === "es" ? "Google Calendar desconectado" : "Google Calendar disconnected",
          description: language === "es" 
            ? "Google Calendar se desconectó correctamente." 
            : "Google Calendar disconnected successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: error.message || (language === "es" ? "Error al desconectar Google Calendar" : "Failed to disconnect Google Calendar"),
          variant: "destructive",
        });
      },
    });

    const handleSaveOpenAI = () => {
      updateOpenAIMutation.mutate({
        apiKey: openaiApiKey || undefined,
        useReplitIntegration,
      });
    };

    const handleConnectGoogleCalendar = () => {
      // Google Calendar is connected via Replit Integration
      // The connection is automatically managed by Replit
      queryClient.invalidateQueries({ queryKey: [`/api/external-agencies/${agencyId}/integrations`] });
      toast({
        title: language === "es" ? "Verificando conexión..." : "Checking connection...",
        description: language === "es"
          ? "Verificando la conexión con Google Calendar."
          : "Verifying Google Calendar connection.",
      });
    };

    if (isLoadingIntegrations) {
      return (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              {language === "es" ? "Cargando integraciones..." : "Loading integrations..."}
            </div>
          </CardContent>
        </Card>
      );
    }

    const googleCalendarConnected = integrations?.googleCalendarConnected || false;
    const openaiConnected = integrations?.openaiConnected || false;

    return (
      <div className="space-y-6">
        {/* OpenAI Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {language === "es" ? "OpenAI Chatbot" : "OpenAI Chatbot"}
            </CardTitle>
            <CardDescription>
              {language === "es" 
                ? "Configura OpenAI para habilitar el chatbot inteligente en tu agencia."
                : "Configure OpenAI to enable intelligent chatbot for your agency."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {openaiConnected ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <span className="font-medium">
                  {language === "es" ? "Estado:" : "Status:"}{" "}
                  {openaiConnected 
                    ? (language === "es" ? "Conectado" : "Connected")
                    : (language === "es" ? "No configurado" : "Not configured")}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useReplitIntegration"
                  checked={useReplitIntegration}
                  onChange={(e) => setUseReplitIntegration(e.target.checked)}
                  className="h-4 w-4"
                  data-testid="checkbox-use-replit-integration"
                />
                <Label htmlFor="useReplitIntegration">
                  {language === "es" 
                    ? "Usar integración de Replit (recomendado - sin costo de API key)" 
                    : "Use Replit integration (recommended - no API key cost)"}
                </Label>
              </div>

              {!useReplitIntegration && (
                <div className="space-y-2">
                  <Label htmlFor="openaiApiKey">
                    {language === "es" ? "API Key de OpenAI" : "OpenAI API Key"}
                  </Label>
                  <Input
                    id="openaiApiKey"
                    type="password"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder={integrations?.openaiHasCustomKey 
                      ? (language === "es" ? "•••• (configurada)" : "•••• (configured)")
                      : "sk-..."}
                    data-testid="input-openai-api-key"
                  />
                  {integrations?.openaiHasCustomKey ? (
                    <p className="text-sm text-muted-foreground">
                      {language === "es" 
                        ? "✓ API key personalizada configurada. Deja en blanco para mantenerla o ingresa una nueva para reemplazarla."
                        : "✓ Custom API key configured. Leave blank to keep it or enter a new one to replace it."}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {language === "es" 
                        ? "Tu API key se almacenará de forma segura y encriptada."
                        : "Your API key will be stored securely and encrypted."}
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={handleSaveOpenAI}
                disabled={updateOpenAIMutation.isPending || (!useReplitIntegration && !openaiApiKey && !integrations?.openaiHasCustomKey)}
                className="w-full"
                data-testid="button-save-openai"
              >
                {updateOpenAIMutation.isPending 
                  ? (language === "es" ? "Guardando..." : "Saving...") 
                  : (language === "es" ? "Guardar configuración" : "Save configuration")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Google Calendar Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {language === "es" ? "Google Calendar" : "Google Calendar"}
            </CardTitle>
            <CardDescription>
              {language === "es" 
                ? "Sincroniza tus citas y eventos con Google Calendar."
                : "Sync your appointments and events with Google Calendar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {googleCalendarConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="font-medium">
                    {language === "es" ? "Estado:" : "Status:"}{" "}
                    {googleCalendarConnected 
                      ? (language === "es" ? "Conectado" : "Connected")
                      : (language === "es" ? "No conectado" : "Not connected")}
                  </span>
                </div>
                {googleCalendarConnected && integrations?.googleCalendarEmail && (
                  <span className="text-sm text-muted-foreground ml-7">
                    {integrations.googleCalendarEmail}
                  </span>
                )}
              </div>
            </div>

            {!googleCalendarConnected && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {language === "es" 
                      ? "Para conectar Google Calendar, utiliza el panel de Integraciones en la barra lateral de Replit y conecta la cuenta de Google Calendar."
                      : "To connect Google Calendar, use the Integrations panel in the Replit sidebar and connect your Google Calendar account."}
                  </p>
                </div>
                <Button
                  onClick={handleConnectGoogleCalendar}
                  variant="outline"
                  className="w-full"
                  data-testid="button-connect-google-calendar"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {language === "es" ? "Verificar conexión" : "Verify connection"}
                </Button>
              </div>
            )}

            {googleCalendarConnected && (
              <p className="text-sm text-muted-foreground">
                {language === "es" 
                  ? "Google Calendar está conectado y listo para sincronizar eventos."
                  : "Google Calendar is connected and ready to sync events."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* AI Credits Control - Only visible to admins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {language === "es" ? "Control de Créditos IA" : "AI Credits Control"}
            </CardTitle>
            <CardDescription>
              {language === "es" 
                ? "Controla el uso de funciones de IA que consumen créditos para los vendedores de esta agencia."
                : "Control the use of AI features that consume credits for this agency's sellers."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex-1 mr-4">
                <Label htmlFor="ai-credits-toggle" className="text-base font-medium">
                  {language === "es" ? "Funciones de IA habilitadas" : "AI features enabled"}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === "es" 
                    ? "Cuando está desactivado, los vendedores no podrán usar funciones que consuman créditos de IA (generación de contenido, chatbot, etc.)"
                    : "When disabled, sellers cannot use features that consume AI credits (content generation, chatbot, etc.)"}
                </p>
              </div>
              <Switch
                id="ai-credits-toggle"
                checked={aiCreditsEnabled}
                onCheckedChange={(checked) => {
                  setAiCreditsEnabled(checked);
                  updateAiCreditsMutation.mutate(checked);
                }}
                disabled={updateAiCreditsMutation.isPending}
                data-testid="switch-ai-credits"
              />
            </div>
            <div className={`p-3 rounded-lg ${aiCreditsEnabled ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800'}`}>
              <p className={`text-sm ${aiCreditsEnabled ? 'text-green-800 dark:text-green-200' : 'text-orange-800 dark:text-orange-200'}`}>
                {aiCreditsEnabled 
                  ? (language === "es" 
                      ? "Las funciones de IA están activas. Los vendedores pueden usar generación de contenido y otras funciones de IA."
                      : "AI features are active. Sellers can use content generation and other AI features.")
                  : (language === "es" 
                      ? "Las funciones de IA están desactivadas. Los vendedores no podrán generar contenido con IA hasta que las actives."
                      : "AI features are disabled. Sellers cannot generate AI content until you enable them.")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Google Sheets Import Component
  const GoogleSheetsImport = ({ agencyId, language, toast }: { agencyId?: string, language: string, toast: any }) => {
    const [spreadsheetId, setSpreadsheetId] = useState("");
    const [sheetRange, setSheetRange] = useState("Sheet1!A2:M");
    const [selectedCondominiumId, setSelectedCondominiumId] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Fetch condominiums
    const { data: condominiums, isLoading: isLoadingCondominiums } = useQuery({
      queryKey: [`/api/external-condominiums`, agencyId],
      enabled: !!agencyId,
    });

    // Preview mutation
    const previewMutation = useMutation({
      mutationFn: async () => {
        const response = await apiRequest('GET', `/api/external-agencies/${agencyId}/preview-sheets-data?spreadsheetId=${encodeURIComponent(spreadsheetId)}&sheetRange=${encodeURIComponent(sheetRange)}`);
        return response;
      },
      onSuccess: (data) => {
        setPreviewData(data);
        setIsPreviewOpen(true);
      },
      onError: (error: any) => {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: error.message || (language === "es" ? "Error al obtener vista previa" : "Failed to get preview"),
          variant: "destructive",
        });
      },
    });

    // Import mutation
    const importMutation = useMutation({
      mutationFn: async () => {
        return apiRequest('POST', `/api/external-agencies/${agencyId}/import-units-from-sheets`, {
          spreadsheetId,
          sheetRange,
          condominiumId: selectedCondominiumId,
        });
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/external-units'] });
        toast({
          title: language === "es" ? "Importación completada" : "Import complete",
          description: data.message,
        });
        setIsPreviewOpen(false);
        setPreviewData(null);
      },
      onError: (error: any) => {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: error.message || (language === "es" ? "Error al importar datos" : "Failed to import data"),
          variant: "destructive",
        });
      },
    });

    const extractSpreadsheetId = (input: string) => {
      // Extract ID from URL like https://docs.google.com/spreadsheets/d/1abc123/edit
      const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        return match[1];
      }
      return input;
    };

    const handleSpreadsheetIdChange = (value: string) => {
      const extractedId = extractSpreadsheetId(value);
      setSpreadsheetId(extractedId);
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {language === "es" ? "Importar Unidades desde Google Sheets" : "Import Units from Google Sheets"}
            </CardTitle>
            <CardDescription>
              {language === "es" 
                ? "Importa datos de unidades desde una hoja de cálculo de Google Sheets. Asegúrate de que la hoja tenga el formato correcto."
                : "Import unit data from a Google Sheets spreadsheet. Make sure the sheet has the correct format."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template info */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium">
                {language === "es" ? "Formato esperado de la hoja:" : "Expected sheet format:"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {language === "es" 
                  ? "Columnas: A) Número de Unidad, B) Nombre del Condominio, C) Propósito de Renta, D) Piso, E) Recámaras, F) Baños, G) Tamaño (m²), H) Monto de Renta, I) Monto de Depósito, J) Nombre del Propietario, K) Email del Propietario, L) Teléfono del Propietario, M) Notas"
                  : "Columns: A) Unit Number, B) Condominium Name, C) Rent Purpose, D) Floor, E) Bedrooms, F) Bathrooms, G) Size (sqm), H) Rent Amount, I) Deposit Amount, J) Owner Name, K) Owner Email, L) Owner Phone, M) Notes"}
              </p>
            </div>

            {/* Condominium selector */}
            <div className="space-y-2">
              <Label htmlFor="condominium">
                {language === "es" ? "Condominio destino *" : "Destination Condominium *"}
              </Label>
              <Select 
                value={selectedCondominiumId || ""} 
                onValueChange={setSelectedCondominiumId}
              >
                <SelectTrigger data-testid="select-condominium-import">
                  <SelectValue placeholder={language === "es" ? "Selecciona un condominio" : "Select a condominium"} />
                </SelectTrigger>
                <SelectContent>
                  {condominiums?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id} data-testid={`select-condo-item-${c.id}`}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {language === "es" 
                  ? "Las unidades importadas se asignarán a este condominio."
                  : "Imported units will be assigned to this condominium."}
              </p>
            </div>

            {/* Spreadsheet ID */}
            <div className="space-y-2">
              <Label htmlFor="spreadsheetId">
                {language === "es" ? "URL o ID de la hoja de cálculo *" : "Spreadsheet URL or ID *"}
              </Label>
              <Input
                id="spreadsheetId"
                value={spreadsheetId}
                onChange={(e) => handleSpreadsheetIdChange(e.target.value)}
                placeholder={language === "es" 
                  ? "https://docs.google.com/spreadsheets/d/1abc123... o simplemente el ID"
                  : "https://docs.google.com/spreadsheets/d/1abc123... or just the ID"}
                data-testid="input-spreadsheet-id"
              />
            </div>

            {/* Range */}
            <div className="space-y-2">
              <Label htmlFor="sheetRange">
                {language === "es" ? "Rango de celdas" : "Cell Range"}
              </Label>
              <Input
                id="sheetRange"
                value={sheetRange}
                onChange={(e) => setSheetRange(e.target.value)}
                placeholder="Sheet1!A2:M"
                data-testid="input-sheet-range"
              />
              <p className="text-sm text-muted-foreground">
                {language === "es" 
                  ? "Por defecto: Sheet1!A2:M (omite la fila de encabezados)"
                  : "Default: Sheet1!A2:M (skips the header row)"}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => previewMutation.mutate()}
                disabled={!spreadsheetId || !selectedCondominiumId || previewMutation.isPending}
                data-testid="button-preview-sheets"
              >
                {previewMutation.isPending ? (
                  <>
                    {language === "es" ? "Cargando..." : "Loading..."}
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {language === "es" ? "Vista Previa" : "Preview"}
                  </>
                )}
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={!spreadsheetId || !selectedCondominiumId || importMutation.isPending}
                data-testid="button-import-sheets"
              >
                {importMutation.isPending ? (
                  <>
                    {language === "es" ? "Importando..." : "Importing..."}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {language === "es" ? "Importar Datos" : "Import Data"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {language === "es" ? "Vista Previa de Datos" : "Data Preview"}
              </DialogTitle>
              <DialogDescription>
                {language === "es" 
                  ? `Se encontraron ${previewData?.totalRows || 0} filas. Mostrando las primeras 10:`
                  : `Found ${previewData?.totalRows || 0} rows. Showing first 10:`}
              </DialogDescription>
            </DialogHeader>

            {previewData?.preview && previewData.preview.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="p-2 text-left">{language === "es" ? "# Unidad" : "Unit #"}</th>
                      <th className="p-2 text-left">{language === "es" ? "Propósito" : "Purpose"}</th>
                      <th className="p-2 text-left">{language === "es" ? "Piso" : "Floor"}</th>
                      <th className="p-2 text-left">{language === "es" ? "Recámaras" : "Bedrooms"}</th>
                      <th className="p-2 text-left">{language === "es" ? "Baños" : "Bathrooms"}</th>
                      <th className="p-2 text-left">{language === "es" ? "Renta" : "Rent"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.preview.map((row: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{row.unitNumber || '-'}</td>
                        <td className="p-2">{row.rentPurpose || '-'}</td>
                        <td className="p-2">{row.floorNumber || '-'}</td>
                        <td className="p-2">{row.bedrooms || '-'}</td>
                        <td className="p-2">{row.bathrooms || '-'}</td>
                        <td className="p-2">{row.rentAmount || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {language === "es" ? "No se encontraron datos" : "No data found"}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
                data-testid="button-close-preview"
              >
                {language === "es" ? "Cerrar" : "Close"}
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending || !previewData?.preview?.length}
                data-testid="button-confirm-import"
              >
                {importMutation.isPending ? (
                  <>
                    {language === "es" ? "Importando..." : "Importing..."}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {language === "es" ? "Confirmar Importación" : "Confirm Import"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // CSV Data Manager Component
  const CSVDataManager = ({ agencyId, language, toast }: { agencyId?: string, language: string, toast: any }) => {
    const [importSection, setImportSection] = useState<string | null>(null);
    const [importData, setImportData] = useState<string>("");
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
    const [importJobId, setImportJobId] = useState<string | null>(null);
    const [importProgress, setImportProgress] = useState<{
      status: 'processing' | 'completed' | 'failed';
      total: number;
      processed: number;
      imported: number;
      skipped: number;
      progress: number;
      message?: string;
      errors?: string[];
    } | null>(null);

    const dataSections = [
      { id: 'condominiums', label: language === 'es' ? 'Condominios' : 'Condominiums', icon: Building2, canImport: true },
      { id: 'units', label: language === 'es' ? 'Unidades' : 'Units', icon: Home, canImport: true },
      { id: 'owners', label: language === 'es' ? 'Propietarios' : 'Owners', icon: Users, canImport: true },
      { id: 'clients', label: language === 'es' ? 'Clientes' : 'Clients', icon: Users, canImport: true },
      { id: 'leads', label: language === 'es' ? 'Leads' : 'Leads', icon: Users, canImport: true },
      { id: 'contracts', label: language === 'es' ? 'Contratos' : 'Contracts', icon: FileText, canImport: true },
      { id: 'maintenance', label: language === 'es' ? 'Mantenimiento' : 'Maintenance', icon: Settings, canImport: true },
      { id: 'transactions', label: language === 'es' ? 'Transacciones' : 'Transactions', icon: FileText, canImport: true },
      { id: 'quotations', label: language === 'es' ? 'Cotizaciones' : 'Quotations', icon: FileText, canImport: true },
      { id: 'accounts', label: language === 'es' ? 'Cuentas' : 'Accounts', icon: Users, canImport: true },
    ];

    const exportMutation = useMutation({
      mutationFn: async (section: string) => {
        const response = await fetch(`/api/external/data/export/${section}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Export failed');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${section}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return section;
      },
      onSuccess: (section) => {
        toast({
          title: language === 'es' ? 'Exportación completada' : 'Export complete',
          description: language === 'es' ? `Los datos de ${section} han sido exportados.` : `${section} data has been exported.`,
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || (language === 'es' ? 'Error al exportar' : 'Export failed'),
          variant: 'destructive',
        });
      },
    });

    // Function to poll import progress
    const pollImportProgress = async (jobId: string) => {
      try {
        const response = await fetch(`/api/external/imports/${jobId}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to get import status');
        }
        const data = await response.json();
        setImportProgress(data);
        
        if (data.status === 'processing') {
          // Continue polling
          setTimeout(() => pollImportProgress(jobId), 500);
        } else if (data.status === 'completed') {
          // Import completed
          queryClient.invalidateQueries({ queryKey: ['/api/external-condominiums'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external-units'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external-owners'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external-clients'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external/leads'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external-rental-contracts'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external-tickets'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/transactions'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external-quotations'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external-agency-users'] });
          toast({
            title: language === 'es' ? 'Importación completada' : 'Import complete',
            description: data.message || `${data.imported} ${language === 'es' ? 'registros importados' : 'records imported'}`,
          });
        } else if (data.status === 'failed') {
          toast({
            title: 'Error',
            description: data.message || (language === 'es' ? 'Error al importar' : 'Import failed'),
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error polling import progress:', error);
      }
    };

    const importMutation = useMutation({
      mutationFn: async ({ section, csvData }: { section: string, csvData: string }) => {
        return apiRequest('POST', `/api/external/data/import/${section}`, { csvData });
      },
      onSuccess: (data: any) => {
        if (data.jobId) {
          // New async import with progress tracking
          setImportJobId(data.jobId);
          setImportProgress({
            status: 'processing',
            total: data.total || 0,
            processed: 0,
            imported: 0,
            skipped: 0,
            progress: 0,
          });
          setIsImportDialogOpen(false);
          setIsProgressDialogOpen(true);
          setImportData("");
          // Start polling for progress
          pollImportProgress(data.jobId);
        } else {
          // Legacy sync response
          queryClient.invalidateQueries({ queryKey: ['/api/external-condominiums'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external-units'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external-owners'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external-clients'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external/leads'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external-rental-contracts'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external-tickets'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external/accounting/transactions'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external-quotations'] });
          queryClient.invalidateQueries({ queryKey: ['/api/external-agency-users'] });
          toast({
            title: language === 'es' ? 'Importación completada' : 'Import complete',
            description: data.message,
          });
          setIsImportDialogOpen(false);
          setImportData("");
          setImportSection(null);
        }
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || (language === 'es' ? 'Error al importar' : 'Import failed'),
          variant: 'destructive',
        });
      },
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImportData(event.target?.result as string);
        };
        reader.readAsText(file);
      }
    };

    const openImportDialog = (section: string) => {
      setImportSection(section);
      setImportData("");
      setIsImportDialogOpen(true);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {language === 'es' ? 'Gestión de Datos CSV' : 'CSV Data Management'}
          </CardTitle>
          <CardDescription>
            {language === 'es' 
              ? 'Exporta e importa datos en formato CSV para cada sección del sistema.'
              : 'Export and import data in CSV format for each system section.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dataSections.map((section) => {
              const IconComponent = section.icon;
              return (
                <Card key={section.id} className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <h4 className="font-medium">{section.label}</h4>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => exportMutation.mutate(section.id)}
                      disabled={exportMutation.isPending}
                      data-testid={`button-export-${section.id}`}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {language === 'es' ? 'Exportar' : 'Export'}
                    </Button>
                    {section.canImport && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openImportDialog(section.id)}
                        data-testid={`button-import-${section.id}`}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {language === 'es' ? 'Importar' : 'Import'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">
              {language === 'es' ? 'Notas sobre la importación:' : 'Import notes:'}
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>{language === 'es' ? 'Los registros duplicados (mismo nombre) serán omitidos' : 'Duplicate records (same name) will be skipped'}</li>
              <li>{language === 'es' ? 'El archivo debe tener encabezados en la primera fila' : 'The file must have headers in the first row'}</li>
              <li>{language === 'es' ? 'Usa el botón de exportar para ver el formato esperado' : 'Use the export button to see the expected format'}</li>
            </ul>
          </div>
        </CardContent>

        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {language === 'es' 
                  ? `Importar ${dataSections.find(s => s.id === importSection)?.label || ''}`
                  : `Import ${dataSections.find(s => s.id === importSection)?.label || ''}`}
              </DialogTitle>
              <DialogDescription>
                {language === 'es'
                  ? 'Sube un archivo CSV o pega los datos directamente.'
                  : 'Upload a CSV file or paste the data directly.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>{language === 'es' ? 'Subir archivo CSV' : 'Upload CSV file'}</Label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="mt-2"
                  data-testid="input-import-file"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {language === 'es' ? 'o pega los datos' : 'or paste data'}
                  </span>
                </div>
              </div>

              <div>
                <Label>{language === 'es' ? 'Datos CSV' : 'CSV Data'}</Label>
                <Textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder={language === 'es' ? 'Pega aquí los datos CSV...' : 'Paste CSV data here...'}
                  className="mt-2 min-h-[200px] font-mono text-sm"
                  data-testid="textarea-import-data"
                />
              </div>

              {importData && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' 
                      ? `${importData.split('\n').length - 1} registros detectados (excluyendo encabezado)`
                      : `${importData.split('\n').length - 1} records detected (excluding header)`}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(false)}
                data-testid="button-cancel-import"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button
                onClick={() => importSection && importMutation.mutate({ section: importSection, csvData: importData })}
                disabled={importMutation.isPending || !importData.trim()}
                data-testid="button-confirm-csv-import"
              >
                {importMutation.isPending ? (
                  language === 'es' ? 'Importando...' : 'Importing...'
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Importar' : 'Import'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Progress Dialog */}
        <Dialog open={isProgressDialogOpen} onOpenChange={(open) => {
          if (!open && importProgress?.status !== 'processing') {
            setIsProgressDialogOpen(false);
            setImportProgress(null);
            setImportJobId(null);
            setImportSection(null);
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {importProgress?.status === 'processing' && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
                {importProgress?.status === 'completed' && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {importProgress?.status === 'failed' && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                {language === 'es' 
                  ? (importProgress?.status === 'processing' ? 'Importando...' : 
                     importProgress?.status === 'completed' ? 'Importación Completada' : 'Error de Importación')
                  : (importProgress?.status === 'processing' ? 'Importing...' : 
                     importProgress?.status === 'completed' ? 'Import Complete' : 'Import Failed')}
              </DialogTitle>
              <DialogDescription>
                {importSection && dataSections.find(s => s.id === importSection)?.label}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Progress value={importProgress?.progress || 0} className="h-3" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-muted-foreground">
                    {language === 'es' ? 'Procesados' : 'Processed'}
                  </div>
                  <div className="text-lg font-semibold">
                    {importProgress?.processed || 0} / {importProgress?.total || 0}
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-muted-foreground">
                    {language === 'es' ? 'Progreso' : 'Progress'}
                  </div>
                  <div className="text-lg font-semibold">
                    {importProgress?.progress || 0}%
                  </div>
                </div>
              </div>

              {importProgress?.status !== 'processing' && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <div className="text-green-600 dark:text-green-400">
                      {language === 'es' ? 'Importados' : 'Imported'}
                    </div>
                    <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                      {importProgress?.imported || 0}
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                    <div className="text-yellow-600 dark:text-yellow-400">
                      {language === 'es' ? 'Omitidos' : 'Skipped'}
                    </div>
                    <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
                      {importProgress?.skipped || 0}
                    </div>
                  </div>
                </div>
              )}

              {importProgress?.message && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {importProgress.message}
                </div>
              )}

              {importProgress?.errors && importProgress.errors.length > 0 && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <div className="text-sm font-medium text-destructive mb-2">
                    {language === 'es' ? 'Errores:' : 'Errors:'}
                  </div>
                  <ul className="text-xs text-destructive space-y-1 max-h-24 overflow-y-auto">
                    {importProgress.errors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                    {importProgress.errors.length > 5 && (
                      <li className="text-muted-foreground">
                        +{importProgress.errors.length - 5} {language === 'es' ? 'más' : 'more'}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsProgressDialogOpen(false);
                  setImportProgress(null);
                  setImportJobId(null);
                  setImportSection(null);
                }}
                disabled={importProgress?.status === 'processing'}
                data-testid="button-close-progress"
              >
                {language === 'es' ? 'Cerrar' : 'Close'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    );
  };

  const ConfigurableCatalogSection = ({ 
    type, 
    language, 
    toast 
  }: { 
    type: 'zones' | 'property-types' | 'unit-characteristics' | 'amenities', 
    language: string, 
    toast: any 
  }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', nameEn: '', category: '', sortOrder: 0 });

    const apiEndpoints: Record<string, string> = {
      'zones': '/api/external/config/zones',
      'property-types': '/api/external/config/property-types',
      'unit-characteristics': '/api/external/config/unit-characteristics',
      'amenities': '/api/external/config/amenities',
    };

    const apiEndpoint = apiEndpoints[type];

    const titles: Record<string, { es: string; en: string }> = {
      'zones': { es: 'Zonas / Colonias', en: 'Zones / Neighborhoods' },
      'property-types': { es: 'Tipos de Propiedad', en: 'Property Types' },
      'unit-characteristics': { es: 'Características de Unidad', en: 'Unit Characteristics' },
      'amenities': { es: 'Amenidades', en: 'Amenities' },
    };

    const descriptions: Record<string, { es: string; en: string }> = {
      'zones': { es: 'Gestiona las zonas o colonias disponibles para las propiedades', en: 'Manage available zones or neighborhoods for properties' },
      'property-types': { es: 'Gestiona los tipos de propiedades disponibles', en: 'Manage available property types' },
      'unit-characteristics': { es: 'Características internas de la unidad (cocina, lavandería, clima, etc.)', en: 'Internal unit features (kitchen, laundry, climate, etc.)' },
      'amenities': { es: 'Amenidades del desarrollo o edificio (alberca, gimnasio, seguridad, etc.)', en: 'Development or building amenities (pool, gym, security, etc.)' },
    };

    const title = titles[type][language === 'es' ? 'es' : 'en'];
    const description = descriptions[type][language === 'es' ? 'es' : 'en'];

    const hasCategory = type === 'unit-characteristics' || type === 'amenities';
    const hasNameEn = type === 'unit-characteristics' || type === 'amenities';

    const { data: items, isLoading } = useQuery({
      queryKey: [apiEndpoint],
    });

    const createMutation = useMutation({
      mutationFn: async (data: { name: string, nameEn?: string, category?: string, sortOrder: number }) => {
        return apiRequest('POST', apiEndpoint, data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [apiEndpoint] });
        toast({
          title: language === 'es' ? 'Creado exitosamente' : 'Created successfully',
          description: language === 'es' ? 'El elemento ha sido creado' : 'Item has been created',
        });
        handleCloseDialog();
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || (language === 'es' ? 'Error al crear' : 'Failed to create'),
          variant: 'destructive',
        });
      },
    });

    const updateMutation = useMutation({
      mutationFn: async ({ id, data }: { id: string, data: { name?: string, nameEn?: string, category?: string, sortOrder?: number, isActive?: boolean } }) => {
        return apiRequest('PATCH', `${apiEndpoint}/${id}`, data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [apiEndpoint] });
        toast({
          title: language === 'es' ? 'Actualizado exitosamente' : 'Updated successfully',
          description: language === 'es' ? 'El elemento ha sido actualizado' : 'Item has been updated',
        });
        handleCloseDialog();
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || (language === 'es' ? 'Error al actualizar' : 'Failed to update'),
          variant: 'destructive',
        });
      },
    });

    const deleteMutation = useMutation({
      mutationFn: async (id: string) => {
        return apiRequest('DELETE', `${apiEndpoint}/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [apiEndpoint] });
        toast({
          title: language === 'es' ? 'Eliminado exitosamente' : 'Deleted successfully',
          description: language === 'es' ? 'El elemento ha sido eliminado' : 'Item has been deleted',
        });
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || (language === 'es' ? 'Error al eliminar' : 'Failed to delete'),
          variant: 'destructive',
        });
      },
    });

    const handleOpenDialog = (item?: any) => {
      if (item) {
        setEditingItem(item);
        setFormData({ 
          name: item.name, 
          nameEn: item.nameEn || '',
          category: item.category || '',
          sortOrder: item.sortOrder || 0 
        });
      } else {
        setEditingItem(null);
        setFormData({ name: '', nameEn: '', category: '', sortOrder: 0 });
      }
      setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({ name: '', nameEn: '', category: '', sortOrder: 0 });
    };

    const handleSubmit = () => {
      if (!formData.name.trim()) {
        toast({
          title: 'Error',
          description: language === 'es' ? 'El nombre es requerido' : 'Name is required',
          variant: 'destructive',
        });
        return;
      }

      const dataToSubmit: any = { name: formData.name, sortOrder: formData.sortOrder };
      if (hasNameEn && formData.nameEn) dataToSubmit.nameEn = formData.nameEn;
      if (hasCategory && formData.category) dataToSubmit.category = formData.category;

      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id, data: dataToSubmit });
      } else {
        createMutation.mutate(dataToSubmit);
      }
    };

    const handleToggleActive = (item: any) => {
      updateMutation.mutate({ id: item.id, data: { isActive: !item.isActive } });
    };

    const handleDeleteClick = (item: any) => {
      setItemToDelete(item);
      setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
      if (itemToDelete) {
        deleteMutation.mutate(itemToDelete.id);
      }
    };

    const sortedItems = useMemo(() => {
      if (!items) return [];
      return [...items].sort((a: any, b: any) => {
        // For items with categories, sort by category first, then by sortOrder
        if (hasCategory) {
          const catCompare = (a.category || '').localeCompare(b.category || '');
          if (catCompare !== 0) return catCompare;
        }
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
    }, [items, hasCategory]);

    const categoryLabels: Record<string, { es: string; en: string }> = {
      'kitchen': { es: 'Cocina', en: 'Kitchen' },
      'laundry': { es: 'Lavandería', en: 'Laundry' },
      'climate': { es: 'Climatización', en: 'Climate' },
      'bathroom': { es: 'Baño', en: 'Bathroom' },
      'bedroom': { es: 'Recámara', en: 'Bedroom' },
      'living': { es: 'Sala/Estar', en: 'Living' },
      'exterior': { es: 'Exterior', en: 'Exterior' },
      'common_areas': { es: 'Áreas Comunes', en: 'Common Areas' },
      'security': { es: 'Seguridad', en: 'Security' },
      'parking': { es: 'Estacionamiento', en: 'Parking' },
      'services': { es: 'Servicios', en: 'Services' },
      'location': { es: 'Ubicación', en: 'Location' },
    };

    const getCategoryLabel = (cat: string) => {
      const label = categoryLabels[cat];
      return label ? label[language === 'es' ? 'es' : 'en'] : cat;
    };

    const icons: Record<string, any> = {
      'zones': MapPin,
      'property-types': Home,
      'unit-characteristics': List,
      'amenities': Building2,
    };

    const Icon = icons[type] || List;

    return (
      <Card data-testid={`card-catalog-${type}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => handleOpenDialog()}
              data-testid={`button-add-${type}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Agregar' : 'Add'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'es' ? 'Cargando...' : 'Loading...'}
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{language === 'es' ? 'No hay elementos configurados' : 'No items configured'}</p>
              <p className="text-sm mt-1">
                {language === 'es' ? 'Haz clic en "Agregar" para crear uno nuevo' : 'Click "Add" to create a new one'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3">
                {sortedItems.map((item: any) => (
                  <div 
                    key={item.id} 
                    className="p-4 border rounded-lg bg-card"
                    data-testid={`card-${type}-${item.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.name}</p>
                        {hasNameEn && item.nameEn && (
                          <p className="text-sm text-muted-foreground">{item.nameEn}</p>
                        )}
                      </div>
                      <Badge 
                        variant={item.isActive ? 'default' : 'secondary'}
                        className="cursor-pointer flex-shrink-0"
                        onClick={() => handleToggleActive(item)}
                        data-testid={`badge-status-${type}-${item.id}`}
                      >
                        {item.isActive 
                          ? (language === 'es' ? 'Activo' : 'Active')
                          : (language === 'es' ? 'Inactivo' : 'Inactive')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      {hasCategory && item.category && (
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(item.category)}
                        </Badge>
                      )}
                      <span>{language === 'es' ? 'Orden:' : 'Order:'} {item.sortOrder || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-10"
                        onClick={() => handleOpenDialog(item)}
                        data-testid={`button-edit-${type}-${item.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {language === 'es' ? 'Editar' : 'Edit'}
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10"
                        size="icon"
                        onClick={() => handleDeleteClick(item)}
                        data-testid={`button-delete-${type}-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">
                        {language === 'es' ? 'Nombre' : 'Name'}
                      </th>
                      {hasCategory && (
                        <th className="p-3 text-left font-medium w-32">
                          {language === 'es' ? 'Categoría' : 'Category'}
                        </th>
                      )}
                      <th className="p-3 text-left font-medium w-24">
                        {language === 'es' ? 'Orden' : 'Order'}
                      </th>
                      <th className="p-3 text-left font-medium w-24">
                        {language === 'es' ? 'Estado' : 'Status'}
                      </th>
                      <th className="p-3 text-right font-medium w-32">
                        {language === 'es' ? 'Acciones' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedItems.map((item: any) => (
                      <tr key={item.id} className="border-b" data-testid={`row-${type}-${item.id}`}>
                        <td className="p-3">
                          <div>
                            <span>{item.name}</span>
                            {hasNameEn && item.nameEn && (
                              <span className="text-xs text-muted-foreground ml-2">({item.nameEn})</span>
                            )}
                          </div>
                        </td>
                        {hasCategory && (
                          <td className="p-3">
                            {item.category && (
                              <Badge variant="outline" className="text-xs">
                                {getCategoryLabel(item.category)}
                              </Badge>
                            )}
                          </td>
                        )}
                        <td className="p-3 text-muted-foreground">{item.sortOrder || 0}</td>
                        <td className="p-3">
                          <Badge 
                            variant={item.isActive ? 'default' : 'secondary'}
                            className="cursor-pointer"
                            onClick={() => handleToggleActive(item)}
                            data-testid={`badge-status-${type}-${item.id}`}
                          >
                            {item.isActive 
                              ? (language === 'es' ? 'Activo' : 'Active')
                              : (language === 'es' ? 'Inactivo' : 'Inactive')}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(item)}
                              data-testid={`button-edit-${type}-${item.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(item)}
                              data-testid={`button-delete-${type}-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem 
                  ? (language === 'es' ? 'Editar' : 'Edit')
                  : (language === 'es' ? 'Agregar' : 'Add')} {title}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? (language === 'es' ? 'Modifica los datos del elemento' : 'Modify item data')
                  : (language === 'es' ? 'Ingresa los datos del nuevo elemento' : 'Enter new item data')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor={`name-${type}`}>
                  {language === 'es' ? 'Nombre' : 'Name'} *
                </Label>
                <Input
                  id={`name-${type}`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'es' ? 'Ingresa el nombre' : 'Enter name'}
                  data-testid={`input-name-${type}`}
                />
              </div>

              {hasNameEn && (
                <div className="space-y-2">
                  <Label htmlFor={`nameEn-${type}`}>
                    {language === 'es' ? 'Nombre en Inglés' : 'English Name'}
                  </Label>
                  <Input
                    id={`nameEn-${type}`}
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder={language === 'es' ? 'Ingresa el nombre en inglés' : 'Enter English name'}
                    data-testid={`input-nameEn-${type}`}
                  />
                </div>
              )}

              {hasCategory && (
                <div className="space-y-2">
                  <Label htmlFor={`category-${type}`}>
                    {language === 'es' ? 'Categoría' : 'Category'}
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id={`category-${type}`} data-testid={`select-category-${type}`}>
                      <SelectValue placeholder={language === 'es' ? 'Selecciona una categoría' : 'Select a category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, labels]) => (
                        <SelectItem key={key} value={key}>
                          {labels[language === 'es' ? 'es' : 'en']}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`sortOrder-${type}`}>
                  {language === 'es' ? 'Orden' : 'Order'}
                </Label>
                <Input
                  id={`sortOrder-${type}`}
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  data-testid={`input-sortOrder-${type}`}
                />
                <p className="text-sm text-muted-foreground">
                  {language === 'es' 
                    ? 'Los elementos se ordenan de menor a mayor' 
                    : 'Items are sorted from lowest to highest'}
                </p>
              </div>

              {editingItem && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <Label htmlFor={`isActive-${type}`}>
                    {language === 'es' ? 'Estado activo' : 'Active status'}
                  </Label>
                  <Switch
                    id={`isActive-${type}`}
                    checked={editingItem.isActive}
                    onCheckedChange={(checked) => {
                      setEditingItem({ ...editingItem, isActive: checked });
                      updateMutation.mutate({ id: editingItem.id, data: { isActive: checked } });
                    }}
                    data-testid={`switch-isActive-${type}`}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                data-testid={`button-cancel-${type}`}
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid={`button-submit-${type}`}
              >
                {(createMutation.isPending || updateMutation.isPending)
                  ? (language === 'es' ? 'Guardando...' : 'Saving...')
                  : (language === 'es' ? 'Guardar' : 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === 'es' ? '¿Estás seguro?' : 'Are you sure?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === 'es' 
                  ? `Esta acción eliminará "${itemToDelete?.name}" permanentemente. Esta acción no se puede deshacer.`
                  : `This action will permanently delete "${itemToDelete?.name}". This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid={`button-cancel-delete-${type}`}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid={`button-confirm-delete-${type}`}
              >
                {deleteMutation.isPending 
                  ? (language === 'es' ? 'Eliminando...' : 'Deleting...')
                  : (language === 'es' ? 'Eliminar' : 'Delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl" data-testid="page-external-configuration">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8" />
            {t("configuration.title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t("configuration.subtitle")}</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          data-testid="button-create-terms"
          className="w-full sm:w-auto h-11"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("configuration.createTerms")}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <TabsList className="inline-flex w-auto min-w-full sm:w-full sm:max-w-4xl sm:grid sm:grid-cols-5 gap-1">
            <TabsTrigger value="terms" data-testid="tab-terms" className="min-w-fit px-3 sm:px-4">
              <FileText className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{language === "es" ? "Términos" : "Terms"}</span>
              <span className="sm:hidden text-xs">{language === "es" ? "Térm." : "Terms"}</span>
            </TabsTrigger>
            <TabsTrigger value="catalogs" data-testid="tab-catalogs" className="min-w-fit px-3 sm:px-4">
              <List className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{language === "es" ? "Catálogos" : "Catalogs"}</span>
              <span className="sm:hidden text-xs">{language === "es" ? "Cat." : "Cat."}</span>
            </TabsTrigger>
            <TabsTrigger value="designs" data-testid="tab-pdf-designs" className="min-w-fit px-3 sm:px-4">
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{language === "es" ? "Diseños PDF" : "PDF Designs"}</span>
              <span className="sm:hidden text-xs">PDF</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" data-testid="tab-integrations" className="min-w-fit px-3 sm:px-4">
              <Plug className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{language === "es" ? "Integraciones" : "Integrations"}</span>
              <span className="sm:hidden text-xs">{language === "es" ? "Integ." : "Integ."}</span>
            </TabsTrigger>
            <TabsTrigger value="data" data-testid="tab-data-import" className="min-w-fit px-3 sm:px-4">
              <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{language === "es" ? "Datos" : "Data"}</span>
              <span className="sm:hidden text-xs">{language === "es" ? "Datos" : "Data"}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="terms" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-3">
              <Button
                variant={termsSubTab === "tenant" ? "default" : "outline"}
                size="sm"
                onClick={() => setTermsSubTab("tenant")}
                data-testid="subtab-tenant-terms"
              >
                <Users className="h-4 w-4 mr-2" />
                {language === "es" ? "Inquilinos" : "Tenants"}
              </Button>
              <Button
                variant={termsSubTab === "owner" ? "default" : "outline"}
                size="sm"
                onClick={() => setTermsSubTab("owner")}
                data-testid="subtab-owner-terms"
              >
                <Building2 className="h-4 w-4 mr-2" />
                {language === "es" ? "Propietarios" : "Owners"}
              </Button>
            </div>
            
            {isLoading ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    {language === "es" ? "Cargando..." : "Loading..."}
                  </div>
                </CardContent>
              </Card>
            ) : termsSubTab === "tenant" ? (
              renderTermsList(tenantTerms, "tenant")
            ) : (
              renderTermsList(ownerTerms, "owner")
            )}
          </div>
        </TabsContent>

        <TabsContent value="catalogs" className="mt-6">
          <div className="space-y-6">
            <ConfigurableCatalogSection 
              type="zones" 
              language={language} 
              toast={toast} 
            />
            <ConfigurableCatalogSection 
              type="property-types" 
              language={language} 
              toast={toast} 
            />
            <ConfigurableCatalogSection 
              type="unit-characteristics" 
              language={language} 
              toast={toast} 
            />
            <ConfigurableCatalogSection 
              type="amenities" 
              language={language} 
              toast={toast} 
            />
          </div>
        </TabsContent>

        <TabsContent value="designs" className="mt-6">
          {isLoadingAgencies ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  {language === "es" 
                    ? "Cargando información de la agencia..."
                    : "Loading agency information..."}
                </div>
              </CardContent>
            </Card>
          ) : hasNoAgency ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {language === "es" 
                      ? "No hay agencia configurada"
                      : "No agency configured"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" 
                      ? "Contacta al administrador para configurar tu agencia primero."
                      : "Contact the administrator to configure your agency first."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>
                      {language === "es" ? "Diseño de PDFs" : "PDF Design"}
                    </CardTitle>
                    <CardDescription>
                      {language === "es" 
                        ? "Selecciona el diseño que se aplicará a los PDFs de formularios de renta y ofertas"
                        : "Select the design that will be applied to rental forms and offer PDFs"}
                    </CardDescription>
                  </div>
                  {hasMultipleAgencies && canSwitchAgencies && agencies && agencies.length > 0 && (
                    <div className="flex items-center gap-2 min-w-[250px]">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <Select value={selectedAgencyId || agencies[0]?.id} onValueChange={setSelectedAgencyId}>
                        <SelectTrigger data-testid="select-agency">
                          <SelectValue placeholder={language === "es" ? "Seleccionar agencia" : "Select agency"} />
                        </SelectTrigger>
                        <SelectContent>
                          {agencies.map((ag: any) => (
                            <SelectItem key={ag.id} value={ag.id} data-testid={`select-item-agency-${ag.id}`}>
                              {ag.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Professional Template */}
                  <Card 
                  className={cn(
                      "cursor-pointer hover-elevate border-2",
                      agency?.pdfTemplateStyle === 'professional' || !agency?.pdfTemplateStyle
                        ? "border-primary" 
                        : "border-border"
                    )}
                    onClick={() => updateTemplateMutation.mutate('professional')}
                    data-testid="card-template-professional"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {language === "es" ? "Profesional" : "Professional"}
                        {(agency?.pdfTemplateStyle === 'professional' || !agency?.pdfTemplateStyle) && (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {language === "es" ? "Activo" : "Active"}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {language === "es" ? "Diseño clásico y elegante" : "Classic and elegant design"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2F2A1F' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Café oscuro" : "Dark brown"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#C19A6B' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Dorado/Tan" : "Gold/Tan"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F7F4EF' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Beige claro" : "Light beige"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
  
                  {/* Modern Template */}
                  <Card 
                    className={cn(
                      "cursor-pointer hover-elevate border-2",
                      agency?.pdfTemplateStyle === 'modern'
                        ? "border-primary" 
                        : "border-border"
                    )}
                    onClick={() => updateTemplateMutation.mutate('modern')}
                    data-testid="card-template-modern"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {language === "es" ? "Moderno" : "Modern"}
                        {agency?.pdfTemplateStyle === 'modern' && (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {language === "es" ? "Activo" : "Active"}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {language === "es" ? "Diseño limpio y minimalista" : "Clean and minimalist design"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1a2332' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Gris oscuro" : "Dark slate"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#7C9CBF' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Azul suave" : "Soft blue"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F5F7FA' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Gris claro" : "Light gray"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
  
                  {/* Elegant Template */}
                  <Card 
                    className={cn(
                      "cursor-pointer hover-elevate border-2",
                      agency?.pdfTemplateStyle === 'elegant'
                        ? "border-primary" 
                        : "border-border"
                    )}
                    onClick={() => updateTemplateMutation.mutate('elegant')}
                    data-testid="card-template-elegant"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {language === "es" ? "Elegante" : "Elegant"}
                        {agency?.pdfTemplateStyle === 'elegant' && (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {language === "es" ? "Activo" : "Active"}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {language === "es" ? "Diseño sofisticado y refinado" : "Sophisticated and refined design"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2C1810' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Café espresso" : "Deep espresso"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#A0826D' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Oro rosado" : "Muted rose gold"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FAF8F5' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Blanco cálido" : "Warm off-white"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {language === "es" 
                    ? "El diseño seleccionado se aplicará automáticamente a todos los PDFs de formularios de renta (inquilino y propietario) y ofertas de renta."
                    : "The selected design will be automatically applied to all rental form PDFs (tenant and owner) and rental offer PDFs."}
                </p>
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          {isLoadingAgencies ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  {language === "es" 
                    ? "Cargando información de la agencia..."
                    : "Loading agency information..."}
                </div>
              </CardContent>
            </Card>
          ) : hasNoAgency ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {language === "es" 
                      ? "No hay agencia configurada"
                      : "No agency configured"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" 
                      ? "Contacta al administrador para configurar tu agencia primero."
                      : "Contact the administrator to configure your agency first."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {hasMultipleAgencies && canSwitchAgencies && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <Label className="text-base font-medium">
                        {language === "es" ? "Agencia" : "Agency"}
                      </Label>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Select value={agency?.id} onValueChange={setSelectedAgencyId}>
                      <SelectTrigger className="w-full min-w-[250px]" data-testid="select-agency-integrations">
                        <SelectValue placeholder={language === "es" ? "Selecciona una agencia" : "Select an agency"} />
                      </SelectTrigger>
                      <SelectContent>
                        {agencies?.map((a: any) => (
                          <SelectItem key={a.id} value={a.id} data-testid={`select-agency-item-${a.id}`}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}

              <IntegrationsContent 
                agencyId={agency?.id}
                agency={agency}
                language={language}
                toast={toast}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          {isLoadingAgencies ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  {language === "es" 
                    ? "Cargando información de la agencia..."
                    : "Loading agency information..."}
                </div>
              </CardContent>
            </Card>
          ) : hasNoAgency ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {language === "es" 
                      ? "No hay agencia configurada"
                      : "No agency configured"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" 
                      ? "Contacta al administrador para configurar tu agencia primero."
                      : "Contact the administrator to configure your agency first."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {hasMultipleAgencies && canSwitchAgencies && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <Label className="text-base font-medium">
                        {language === "es" ? "Agencia" : "Agency"}
                      </Label>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Select value={agency?.id} onValueChange={setSelectedAgencyId}>
                      <SelectTrigger className="w-full min-w-[250px]" data-testid="select-agency-data">
                        <SelectValue placeholder={language === "es" ? "Selecciona una agencia" : "Select an agency"} />
                      </SelectTrigger>
                      <SelectContent>
                        {agencies?.map((a: any) => (
                          <SelectItem key={a.id} value={a.id} data-testid={`select-agency-data-item-${a.id}`}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}

              {/* Presentation Cards Backfill - Prominent at top */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    {language === "es" ? "Tarjetas de Presentación" : "Presentation Cards"}
                  </CardTitle>
                  <CardDescription>
                    {language === "es" 
                      ? "Genera tarjetas de presentación iniciales para leads existentes que no tienen ninguna"
                      : "Generate initial presentation cards for existing leads that don't have any"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BackfillPresentationCards language={language} toast={toast} />
                </CardContent>
              </Card>

              {/* Google Sheets Import */}
              <GoogleSheetsImport 
                agencyId={agency?.id} 
                language={language}
                toast={toast}
              />

              {/* CSV Import/Export */}
              <CSVDataManager
                agencyId={agency?.id}
                language={language}
                toast={toast}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTerms ? t("configuration.editTerms") : t("configuration.createTerms")}
            </DialogTitle>
            <DialogDescription>
              {editingTerms
                ? "Edita los términos y condiciones existentes"
                : "Crea nuevos términos y condiciones que se mostrarán a los usuarios"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("configuration.termsAndConditions")}</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={field.value === "tenant" ? "default" : "outline"}
                          onClick={() => field.onChange("tenant")}
                          className="w-full"
                          data-testid="button-type-tenant"
                        >
                          {t("configuration.tenantTerms")}
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "owner" ? "default" : "outline"}
                          onClick={() => field.onChange("owner")}
                          className="w-full"
                          data-testid="button-type-owner"
                        >
                          {t("configuration.ownerTerms")}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("configuration.version")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("configuration.versionPlaceholder")}
                        {...field}
                        data-testid="input-version"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("configuration.title.field")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("configuration.titlePlaceholder")}
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("configuration.content")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("configuration.contentPlaceholder")}
                        className="min-h-[300px]"
                        {...field}
                        data-testid="textarea-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    form.reset();
                    setEditingTerms(null);
                  }}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createOrUpdateMutation.isPending}
                  data-testid="button-submit"
                >
                  {createOrUpdateMutation.isPending ? "Guardando..." : t("configuration.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
