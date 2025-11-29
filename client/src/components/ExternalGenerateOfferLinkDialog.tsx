import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Copy, Check, MessageCircle, Mail, Link as LinkIcon, ExternalLink, Building2, Home, User, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import type { ExternalUnitWithCondominium, ExternalClient, PaginatedResponse } from "@shared/schema";

const emailFormSchema = z.object({
  clientEmail: z.string().email("Email inválido"),
  clientName: z.string().min(2, "Nombre es requerido"),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface ExternalGenerateOfferLinkDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  clientId?: number;
  clientInfo?: {
    name: string;
    email: string;
  };
}

export default function ExternalGenerateOfferLinkDialog({ 
  open = false, 
  onOpenChange,
  clientId,
  clientInfo
}: ExternalGenerateOfferLinkDialogProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { user } = useAuth();
  const agencyId = user?.externalAgencyId;
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId?.toString() || "");
  const [generatedToken, setGeneratedToken] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Load all condominiums directly from the condominiums endpoint
  const { data: condominiumsResponse, isLoading: isLoadingCondominiums } = useQuery<{ data: any[], total: number }>({
    queryKey: ["/api/external-condominiums", "all-for-dialog"],
    queryFn: async () => {
      // Fetch all condominiums in batches to bypass 100 limit
      let allCondos: any[] = [];
      let offset = 0;
      const batchSize = 100;
      let hasMore = true;
      
      while (hasMore) {
        const response = await fetch(`/api/external-condominiums?limit=${batchSize}&offset=${offset}`, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch condominiums');
        const result = await response.json();
        allCondos = [...allCondos, ...(result.data || [])];
        hasMore = result.data?.length === batchSize;
        offset += batchSize;
      }
      
      return { data: allCondos, total: allCondos.length };
    },
    staleTime: 5 * 60 * 1000,
  });

  const condominiums = useMemo(() => {
    const condos = condominiumsResponse?.data || [];
    return condos
      .map(condo => ({
        id: condo.id,
        name: condo.name,
        unitCount: condo.unitCount || 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [condominiumsResponse]);

  // Load units only for selected condominium
  const { data: unitsResponse, isLoading: isLoadingUnits } = useQuery<{ data: ExternalUnitWithCondominium[], total: number }>({
    queryKey: ["/api/external-units", "by-condominium", selectedCondominiumId],
    queryFn: async () => {
      // Fetch all units for the selected condominium in batches
      let allUnits: ExternalUnitWithCondominium[] = [];
      let offset = 0;
      const batchSize = 100;
      let hasMore = true;
      
      while (hasMore) {
        const response = await fetch(`/api/external-units?condominiumId=${selectedCondominiumId}&limit=${batchSize}&offset=${offset}`, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch units');
        const result = await response.json();
        allUnits = [...allUnits, ...(result.data || [])];
        hasMore = result.data?.length === batchSize;
        offset += batchSize;
      }
      
      return { data: allUnits, total: allUnits.length };
    },
    enabled: !!selectedCondominiumId,
    staleTime: 5 * 60 * 1000,
  });

  const filteredUnits = useMemo(() => {
    if (!selectedCondominiumId || !unitsResponse?.data) return [];
    return unitsResponse.data.sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || '', undefined, { numeric: true }));
  }, [unitsResponse, selectedCondominiumId]);

  const { data: clientsResponse, isLoading: isLoadingClients } = useQuery<PaginatedResponse<ExternalClient>>({
    queryKey: ["/api/external-clients", { limit: 10000 }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("limit", "10000");
      params.append("offset", "0");
      const response = await fetch(`/api/external-clients?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
    enabled: !clientId,
    staleTime: 5 * 60 * 1000,
  });
  
  const clients = clientsResponse?.data || [];

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      clientName: clientInfo?.name || "",
      clientEmail: clientInfo?.email || "",
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: async ({ unitId, clientId }: { unitId: string; clientId: string }) => {
      if (!unitId || !clientId) {
        throw new Error("Unit ID and Client ID are required");
      }
      
      const response = await apiRequest("POST", "/api/offer-tokens", {
        externalUnitId: String(unitId),
        externalClientId: String(clientId),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedToken(data);
      queryClient.invalidateQueries({ queryKey: ["/api/external/offer-tokens"] });
      toast({
        title: language === "es" ? "Link generado exitosamente" : "Link generated successfully",
        description: language === "es" 
          ? "Ahora puedes compartir el link o enviarlo por email."
          : "You can now share the link or send it by email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error al generar link" : "Error generating link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: EmailFormValues) => {
      return apiRequest("POST", `/api/offer-tokens/${generatedToken.id}/send-email`, data);
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "Email enviado" : "Email sent",
        description: language === "es"
          ? "El cliente recibirá el link de oferta en su correo."
          : "The client will receive the offer link in their email.",
      });
      form.reset();
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error al enviar email" : "Error sending email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCondominiumChange = (value: string) => {
    setSelectedCondominiumId(value);
    setSelectedUnitId("");
  };

  const handleGenerateLink = () => {
    if (!selectedUnitId) {
      toast({
        title: language === "es" ? "Selecciona una unidad" : "Select a unit",
        description: language === "es" 
          ? "Debes seleccionar una unidad para generar el link."
          : "You must select a unit to generate the link.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedClientId) {
      toast({
        title: language === "es" ? "Selecciona un cliente" : "Select a client",
        description: language === "es"
          ? "Debes seleccionar un cliente para generar el link."
          : "You must select a client to generate the link.",
        variant: "destructive",
      });
      return;
    }
    generateTokenMutation.mutate({ unitId: selectedUnitId, clientId: selectedClientId });
  };

  const getOfferLink = () => {
    if (!generatedToken) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/offer/${generatedToken.token}`;
  };

  const copyToClipboard = async (text: string, type: "link" | "whatsapp") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedWhatsApp(true);
        setTimeout(() => setCopiedWhatsApp(false), 2000);
      }
      toast({
        title: language === "es" ? "Copiado al portapapeles" : "Copied to clipboard",
        description: type === "link" 
          ? language === "es" ? "Link copiado" : "Link copied"
          : language === "es" ? "Mensaje de WhatsApp copiado" : "WhatsApp message copied",
      });
    } catch (err) {
      toast({
        title: language === "es" ? "Error al copiar" : "Error copying",
        description: language === "es" 
          ? "No se pudo copiar al portapapeles"
          : "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getWhatsAppMessage = () => {
    if (!generatedToken) return "";
    const selectedUnit = filteredUnits?.find((u) => String(u.id) === selectedUnitId);
    const unitTitle = selectedUnit 
      ? `${selectedUnit.condominium?.name} - ${selectedUnit.unitNumber}`
      : "unidad";
    const offerLink = getOfferLink();
    return language === "es"
      ? `Hola,

Te envio el enlace para que puedas generar tu oferta de renta para *${unitTitle}*.

Este es un enlace privado y seguro, valido por 24 horas:
${offerLink}

El proceso es rapido y sencillo. Solo necesitas completar tus datos y la informacion de tu oferta.

Tienes alguna pregunta? Estoy aqui para ayudarte.`
      : `Hi,

I'm sending you the link to generate your rental offer for *${unitTitle}*.

This is a private and secure link, valid for 24 hours:
${offerLink}

The process is quick and simple. You just need to complete your data and offer information.

Any questions? I'm here to help.`;
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(getWhatsAppMessage());
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    setSelectedCondominiumId("");
    setSelectedUnitId("");
    if (!clientId) setSelectedClientId("");
    setGeneratedToken(null);
    setCopiedLink(false);
    setCopiedWhatsApp(false);
    form.reset();
  };

  const onSubmitEmail = (data: EmailFormValues) => {
    sendEmailMutation.mutate(data);
  };

  const selectedUnit = filteredUnits?.find((u) => String(u.id) === selectedUnitId);
  const selectedCondominium = condominiums?.find((c) => c.id === selectedCondominiumId);
  const selectedClient = clients?.find((c) => String(c.id) === selectedClientId) || 
    (clientInfo && { firstName: clientInfo.name.split(" ")[0], lastName: clientInfo.name.split(" ").slice(1).join(" ") || "" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <LinkIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {language === "es" ? "Generar Link de Oferta" : "Generate Offer Link"}
                </DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  {language === "es"
                    ? "Link privado de 24 horas para recibir oferta de renta"
                    : "24-hour private link to receive rental offer"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 pt-4">
          {!generatedToken ? (
            <div className="space-y-5">
              {!clientId && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">
                      {language === "es" ? "Cliente" : "Client"}
                    </Label>
                  </div>
                  <Select
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                  >
                    <SelectTrigger className="min-h-[44px]" data-testid="select-client">
                      <SelectValue placeholder={language === "es" ? "Selecciona un cliente..." : "Select a client..."} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {isLoadingClients ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            <span className="font-medium">{client.firstName} {client.lastName}</span>
                            {client.email && (
                              <span className="ml-2 text-muted-foreground text-xs">({client.email})</span>
                            )}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Label className="font-medium">
                    {language === "es" ? "Condominio" : "Condominium"}
                  </Label>
                </div>
                <Select
                  value={selectedCondominiumId}
                  onValueChange={handleCondominiumChange}
                >
                  <SelectTrigger className="min-h-[44px]" data-testid="select-condominium">
                    <SelectValue placeholder={language === "es" ? "Selecciona un condominio..." : "Select a condominium..."} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {isLoadingCondominiums ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      condominiums.map((condo) => (
                        <SelectItem key={condo.id} value={condo.id}>
                          <div className="flex items-center justify-between w-full gap-3">
                            <span className="font-medium">{condo.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {condo.unitCount} {language === "es" ? "unidades" : "units"}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <Label className="font-medium">
                    {language === "es" ? "Unidad" : "Unit"}
                  </Label>
                </div>
                <Select
                  value={selectedUnitId}
                  onValueChange={setSelectedUnitId}
                  disabled={!selectedCondominiumId}
                >
                  <SelectTrigger className="min-h-[44px]" data-testid="select-unit">
                    <SelectValue placeholder={
                      !selectedCondominiumId 
                        ? (language === "es" ? "Primero selecciona un condominio" : "First select a condominium")
                        : (language === "es" ? "Selecciona una unidad..." : "Select a unit...")
                    } />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {isLoadingUnits ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : filteredUnits.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {language === "es" ? "No hay unidades en este condominio" : "No units in this condominium"}
                      </div>
                    ) : (
                      filteredUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{unit.unitNumber}</span>
                            {unit.propertyType && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {unit.propertyType}
                              </Badge>
                            )}
                            {unit.bedrooms !== null && unit.bedrooms !== undefined && (
                              <span className="text-muted-foreground text-xs">
                                {unit.bedrooms} {language === "es" ? "rec." : "bed"}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedUnit && (
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-background rounded-lg border">
                        <Home className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {selectedUnit.condominium?.name} - {selectedUnit.unitNumber}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {selectedUnit.propertyType && (
                            <span className="capitalize">{selectedUnit.propertyType}</span>
                          )}
                          {selectedUnit.bedrooms !== null && selectedUnit.bedrooms !== undefined && (
                            <span> • {selectedUnit.bedrooms} {language === "es" ? "recámaras" : "bedrooms"}</span>
                          )}
                          {selectedUnit.bathrooms !== null && selectedUnit.bathrooms !== undefined && (
                            <span> • {selectedUnit.bathrooms} {language === "es" ? "baños" : "bathrooms"}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleGenerateLink}
                disabled={!selectedUnitId || !selectedClientId || generateTokenMutation.isPending}
                className="w-full min-h-[44px]"
                size="lg"
                data-testid="button-create-token"
              >
                {generateTokenMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LinkIcon className="mr-2 h-4 w-4" />
                )}
                {language === "es" ? "Generar Link" : "Generate Link"}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="font-medium text-green-800 dark:text-green-200">
                        {language === "es" ? "Link generado exitosamente" : "Link generated successfully"}
                      </p>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{selectedClient?.firstName} {selectedClient?.lastName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{selectedUnit?.condominium?.name} - {selectedUnit?.unitNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs">
                            {language === "es" ? "Válido hasta:" : "Valid until:"} {new Date(generatedToken.expiresAt).toLocaleString(language === "es" ? "es-MX" : "en-US")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="link" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                  <TabsTrigger value="link" className="min-h-[44px] gap-1.5" data-testid="tab-link">
                    <LinkIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Link</span>
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="min-h-[44px] gap-1.5" data-testid="tab-whatsapp">
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </TabsTrigger>
                  <TabsTrigger value="email" className="min-h-[44px] gap-1.5" data-testid="tab-email">
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">Email</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="link" className="space-y-4 pt-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      {language === "es" ? "Link de Oferta" : "Offer Link"}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={getOfferLink()}
                        readOnly
                        className="font-mono text-xs min-h-[44px]"
                        data-testid="input-offer-link"
                      />
                      <Button
                        onClick={() => copyToClipboard(getOfferLink(), "link")}
                        variant="outline"
                        size="icon"
                        className="min-w-[44px] min-h-[44px]"
                        data-testid="button-copy-link"
                      >
                        {copiedLink ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => window.open(getOfferLink(), "_blank")}
                        variant="outline"
                        size="icon"
                        className="min-w-[44px] min-h-[44px]"
                        data-testid="button-open-link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="whatsapp" className="space-y-4 pt-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      {language === "es" ? "Mensaje para WhatsApp" : "WhatsApp Message"}
                    </Label>
                    <textarea
                      value={getWhatsAppMessage()}
                      readOnly
                      className="w-full min-h-[150px] text-xs rounded-md border border-input bg-muted/50 px-3 py-2 font-mono resize-none"
                    />
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={() => copyToClipboard(getWhatsAppMessage(), "whatsapp")}
                        variant="outline"
                        className="flex-1 min-h-[44px]"
                      >
                        {copiedWhatsApp ? (
                          <Check className="h-4 w-4 mr-2 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        {language === "es" ? "Copiar" : "Copy"}
                      </Button>
                      <Button onClick={openWhatsApp} className="flex-1 min-h-[44px] bg-green-600 hover:bg-green-700">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {language === "es" ? "Abrir WhatsApp" : "Open WhatsApp"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4 pt-4">
                  <form onSubmit={form.handleSubmit(onSubmitEmail)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName" className="text-xs">
                        {language === "es" ? "Nombre del Cliente" : "Client Name"}
                      </Label>
                      <Input
                        id="clientName"
                        {...form.register("clientName")}
                        placeholder={language === "es" ? "Nombre completo" : "Full name"}
                        className="min-h-[44px]"
                      />
                      {form.formState.errors.clientName && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.clientName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientEmail" className="text-xs">
                        {language === "es" ? "Email del Cliente" : "Client Email"}
                      </Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        {...form.register("clientEmail")}
                        placeholder={language === "es" ? "correo@ejemplo.com" : "email@example.com"}
                        className="min-h-[44px]"
                      />
                      {form.formState.errors.clientEmail && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.clientEmail.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full min-h-[44px]"
                      disabled={sendEmailMutation.isPending}
                    >
                      {sendEmailMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Mail className="h-4 w-4 mr-2" />
                      {language === "es" ? "Enviar por Email" : "Send by Email"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <Separator />

              <Button variant="outline" onClick={handleClose} className="w-full min-h-[44px]">
                {language === "es" ? "Cerrar" : "Close"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
