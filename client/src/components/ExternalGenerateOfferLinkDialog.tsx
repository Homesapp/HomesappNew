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
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId?.toString() || "");
  const [generatedToken, setGeneratedToken] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const { data: units, isLoading: isLoadingUnits } = useQuery({
    queryKey: ["/api/external/units", agencyId],
    enabled: open,
  });

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/external/clients", agencyId],
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
      const response = await apiRequest("POST", "/api/offer-tokens", {
        propertyId: unitId,
        externalClientId: clientId,
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
    return `${baseUrl}/public-offer/${generatedToken.token}`;
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
    const selectedUnit = units?.find((u: any) => u.id === parseInt(selectedUnitId));
    const unitTitle = selectedUnit 
      ? `${selectedUnit.condominium?.name} - ${selectedUnit.unitNumber}`
      : "unidad";
    const offerLink = getOfferLink();
    return language === "es"
      ? `¡Hola! 👋

Te envío el enlace para que puedas generar tu oferta de renta para *${unitTitle}*.

Este es un enlace privado y seguro, válido por 24 horas:
${offerLink}

El proceso es rápido y sencillo. Solo necesitas completar tus datos y la información de tu oferta.

¿Tienes alguna pregunta? ¡Estoy aquí para ayudarte! 😊`
      : `Hi! 👋

I'm sending you the link to generate your rental offer for *${unitTitle}*.

This is a private and secure link, valid for 24 hours:
${offerLink}

The process is quick and simple. You just need to complete your data and offer information.

Any questions? I'm here to help! 😊`;
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

  const selectedUnit = units?.find((u: any) => u.id === parseInt(selectedUnitId));
  const selectedClient = clients?.find((c: any) => c.id === parseInt(selectedClientId)) || 
    (clientInfo && { firstName: clientInfo.name.split(" ")[0], lastName: clientInfo.name.split(" ").slice(1).join(" ") || "" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "es" ? "Generar Link de Oferta Privado" : "Generate Private Offer Link"}
          </DialogTitle>
          <DialogDescription>
            {language === "es"
              ? "Crea un link privado de 24 horas para que un cliente pueda enviar su oferta de renta."
              : "Create a 24-hour private link for a client to send their rental offer."}
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
                      clients?.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.firstName} {client.lastName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="unit">
                {language === "es" ? "Selecciona la Unidad" : "Select Unit"}
              </Label>
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
                    units?.map((unit: any) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
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
                  <Label>{language === "es" ? "Link de Oferta" : "Offer Link"}</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={getOfferLink()}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-offer-link"
                    />
                    <Button
                      onClick={() => copyToClipboard(getOfferLink(), "link")}
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
                      onClick={() => window.open(getOfferLink(), "_blank")}
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
