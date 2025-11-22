import { useState } from "react";
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
import { Loader2, Copy, Check, MessageCircle, Mail, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import type { ExternalUnitWithCondominium } from "@shared/schema";

const emailFormSchema = z.object({
  clientEmail: z.string().email("Email inválido"),
  clientName: z.string().min(2, "Nombre es requerido"),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface ExternalGenerateRentalFormLinkDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  clientId?: number;
  clientInfo?: {
    name: string;
    email: string;
  };
}

export default function ExternalGenerateRentalFormLinkDialog({ 
  open = false, 
  onOpenChange,
  clientId,
  clientInfo
}: ExternalGenerateRentalFormLinkDialogProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { user } = useAuth();
  const agencyId = user?.externalAgencyId;
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId?.toString() || "");
  const [generatedToken, setGeneratedToken] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [unitSearchTerm, setUnitSearchTerm] = useState<string>("");

  const { data: units, isLoading: isLoadingUnits } = useQuery<ExternalUnitWithCondominium[]>({
    queryKey: ["/api/external-units"],
    enabled: open,
  });

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/external-clients"],
    enabled: open && !clientId,
  });

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      clientName: clientInfo?.name || "",
      clientEmail: clientInfo?.email || "",
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: async ({ unitId, clientId }: { unitId: string; clientId: string }) => {
      const response = await apiRequest("POST", "/api/rental-form-tokens", {
        externalUnitId: unitId,
        externalClientId: clientId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedToken(data);
      queryClient.invalidateQueries({ queryKey: ["/api/external/rental-form-tokens"] });
      toast({
        title: language === "es" ? "Link generado exitosamente" : "Link generated successfully",
        description: language === "es" 
          ? "Ahora puedes compartir el link para completar el formato de renta."
          : "You can now share the link to complete the rental form.",
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
      return apiRequest("POST", `/api/rental-form-tokens/${generatedToken.id}/send-email`, data);
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "Email enviado" : "Email sent",
        description: language === "es"
          ? "El cliente recibirá el link del formato de renta en su correo."
          : "The client will receive the rental form link in their email.",
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

  const getFormLink = () => {
    if (!generatedToken) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/public-rental-form/${generatedToken.token}`;
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
    const selectedUnit = units?.find((u) => String(u.id) === selectedUnitId);
    const unitTitle = selectedUnit 
      ? `${selectedUnit.condominium?.name} - ${selectedUnit.unitNumber}`
      : "unidad";
    const formLink = getFormLink();
    return language === "es"
      ? `¡Hola! 👋

Te envío el enlace para completar el formato de renta de *${unitTitle}*.

Este es un enlace privado y seguro, válido por 24 horas:
${formLink}

Por favor completa todos los datos solicitados para continuar con el proceso.

¿Necesitas ayuda? ¡Estoy disponible para cualquier duda! 😊`
      : `Hi! 👋

I'm sending you the link to complete the rental form for *${unitTitle}*.

This is a private and secure link, valid for 24 hours:
${formLink}

Please complete all the requested data to continue with the process.

Need help? I'm available for any questions! 😊`;
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(getWhatsAppMessage());
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
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

  const selectedUnit = units?.find((u) => String(u.id) === selectedUnitId);
  const selectedClient = clients?.find((c) => String(c.id) === selectedClientId) || 
    (clientInfo && { firstName: clientInfo.name.split(" ")[0], lastName: clientInfo.name.split(" ").slice(1).join(" ") || "" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "es" ? "Generar Link de Formato de Renta" : "Generate Rental Form Link"}
          </DialogTitle>
          <DialogDescription>
            {language === "es"
              ? "Crea un link privado de 24 horas para que un cliente complete el formato de renta."
              : "Create a 24-hour private link for a client to complete the rental form."}
          </DialogDescription>
        </DialogHeader>

        {!generatedToken ? (
          <div className="space-y-4">
            {!clientId && (
              <div>
                <Label htmlFor="client">
                  {language === "es" ? "Selecciona el Cliente" : "Select Client"}
                </Label>
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                >
                  <SelectTrigger data-testid="select-client">
                    <SelectValue placeholder={language === "es" ? "Selecciona un cliente" : "Select a client"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingClients ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.firstName} {client.lastName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="unit">
                {language === "es" ? "Selecciona la Unidad" : "Select Unit"}
              </Label>
              <Input
                placeholder={language === "es" ? "Buscar por condominio o número de unidad..." : "Search by condominium or unit number..."}
                value={unitSearchTerm}
                onChange={(e) => setUnitSearchTerm(e.target.value)}
                data-testid="input-search-unit"
                className="mb-2"
              />
              <Select
                value={selectedUnitId}
                onValueChange={setSelectedUnitId}
              >
                <SelectTrigger data-testid="select-unit">
                  <SelectValue placeholder={language === "es" ? "Selecciona una unidad" : "Select a unit"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingUnits ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    units
                      ?.filter((unit) => {
                        if (!unitSearchTerm) return true;
                        const searchLower = unitSearchTerm.toLowerCase();
                        const condominiumName = unit.condominium?.name?.toLowerCase() || "";
                        const unitNumber = unit.unitNumber?.toLowerCase() || "";
                        return condominiumName.includes(searchLower) || unitNumber.includes(searchLower);
                      })
                      ?.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.condominium?.name} - {unit.unitNumber}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateLink}
              disabled={!selectedUnitId || !selectedClientId || generateTokenMutation.isPending}
              className="w-full"
              data-testid="button-create-token"
            >
              {generateTokenMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === "es" ? "Generar Link" : "Generate Link"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {language === "es" ? "Cliente:" : "Client:"} {selectedClient?.firstName} {selectedClient?.lastName}
                </p>
                <p className="text-sm font-medium">
                  {language === "es" ? "Unidad:" : "Unit:"} {selectedUnit?.condominium?.name} - {selectedUnit?.unitNumber}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "es" ? "Válido hasta:" : "Valid until:"} {new Date(generatedToken.expiresAt).toLocaleString(language === "es" ? "es-MX" : "en-US")}
                </p>
              </div>
            </Card>

            <Tabs defaultValue="link" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="link" data-testid="tab-link">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Link
                </TabsTrigger>
                <TabsTrigger value="whatsapp" data-testid="tab-whatsapp">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </TabsTrigger>
                <TabsTrigger value="email" data-testid="tab-email">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="link" className="space-y-4">
                <div>
                  <Label>{language === "es" ? "Link de Formato" : "Form Link"}</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={getFormLink()}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-form-link"
                    />
                    <Button
                      onClick={() => copyToClipboard(getFormLink(), "link")}
                      variant="outline"
                      size="icon"
                      data-testid="button-copy-link"
                    >
                      {copiedLink ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => window.open(getFormLink(), "_blank")}
                      variant="outline"
                      size="icon"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="whatsapp" className="space-y-4">
                <div>
                  <Label>{language === "es" ? "Mensaje para WhatsApp" : "WhatsApp Message"}</Label>
                  <div className="flex gap-2 mt-2">
                    <textarea
                      value={getWhatsAppMessage()}
                      readOnly
                      className="flex-1 min-h-[200px] text-sm rounded-md border border-input bg-background px-3 py-2 font-mono"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => copyToClipboard(getWhatsAppMessage(), "whatsapp")}
                      variant="outline"
                      className="flex-1"
                    >
                      {copiedWhatsApp ? (
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {language === "es" ? "Copiar Mensaje" : "Copy Message"}
                    </Button>
                    <Button onClick={openWhatsApp} className="flex-1">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {language === "es" ? "Abrir WhatsApp" : "Open WhatsApp"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <form onSubmit={form.handleSubmit(onSubmitEmail)} className="space-y-4">
                  <div>
                    <Label htmlFor="clientName">{language === "es" ? "Nombre del Cliente" : "Client Name"}</Label>
                    <Input
                      id="clientName"
                      {...form.register("clientName")}
                      placeholder={language === "es" ? "Nombre completo" : "Full name"}
                    />
                    {form.formState.errors.clientName && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.clientName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="clientEmail">{language === "es" ? "Email del Cliente" : "Client Email"}</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      {...form.register("clientEmail")}
                      placeholder={language === "es" ? "correo@ejemplo.com" : "email@example.com"}
                    />
                    {form.formState.errors.clientEmail && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.clientEmail.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={sendEmailMutation.isPending}
                  >
                    {sendEmailMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Mail className="h-4 w-4 mr-2" />
                    {language === "es" ? "Enviar por Email" : "Send by Email"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                {language === "es" ? "Cerrar" : "Close"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
