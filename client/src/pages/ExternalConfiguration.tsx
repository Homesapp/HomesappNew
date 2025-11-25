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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings, FileText, CheckCircle, XCircle, Plus, Edit, Trash2, Building2, Plug, Calendar, Bot, FileSpreadsheet, Upload, Download, Eye } from "lucide-react";
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

export default function ExternalConfiguration() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"tenant" | "owner" | "designs" | "integrations" | "data">("tenant");
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
        type: activeTab,
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
  const IntegrationsContent = ({ agencyId, language, toast }: { agencyId?: string, language: string, toast: any }) => {
    const [openaiApiKey, setOpenaiApiKey] = useState("");
    const [useReplitIntegration, setUseReplitIntegration] = useState(true);

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

  return (
    <div className="container mx-auto p-6 max-w-6xl" data-testid="page-external-configuration">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            {t("configuration.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("configuration.subtitle")}</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          data-testid="button-create-terms"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("configuration.createTerms")}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
        <TabsList className="grid w-full max-w-4xl grid-cols-5">
          <TabsTrigger value="tenant" data-testid="tab-tenant-terms">
            {t("configuration.tenantTerms")}
          </TabsTrigger>
          <TabsTrigger value="owner" data-testid="tab-owner-terms">
            {t("configuration.ownerTerms")}
          </TabsTrigger>
          <TabsTrigger value="designs" data-testid="tab-pdf-designs">
            {language === "es" ? "Diseños de PDF" : "PDF Designs"}
          </TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-integrations">
            <Plug className="h-4 w-4 mr-2" />
            {language === "es" ? "Integraciones" : "Integrations"}
          </TabsTrigger>
          <TabsTrigger value="data" data-testid="tab-data-import">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {language === "es" ? "Importar Datos" : "Import Data"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tenant" className="mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">Cargando...</div>
              </CardContent>
            </Card>
          ) : (
            renderTermsList(tenantTerms, "tenant")
          )}
        </TabsContent>

        <TabsContent value="owner" className="mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">Cargando...</div>
              </CardContent>
            </Card>
          ) : (
            renderTermsList(ownerTerms, "owner")
          )}
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
                  {hasMultipleAgencies && agencies && agencies.length > 0 && (
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
              {hasMultipleAgencies && (
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
              {hasMultipleAgencies && (
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

              <GoogleSheetsImport 
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
