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
  DialogTrigger,
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
import { Loader2, Link as LinkIcon, Mail, MessageCircle, Copy, Check, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { getPropertyTitle } from "@/lib/propertyHelpers";

const emailFormSchema = z.object({
  clientEmail: z.string().email("Email inválido"),
  clientName: z.string().min(2, "Nombre es requerido"),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface GenerateOfferLinkDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  leadInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function GenerateOfferLinkDialog({ trigger, open: externalOpen, onOpenChange, leadInfo }: GenerateOfferLinkDialogProps) {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [generatedToken, setGeneratedToken] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const { data: properties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ["/api/properties"],
    enabled: open,
  });

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      clientName: leadInfo?.name || "",
      clientEmail: leadInfo?.email || "",
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await apiRequest("POST", "/api/offer-tokens", { propertyId });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedToken(data);
      toast({
        title: "Link generado exitosamente",
        description: "Ahora puedes compartir el link o enviarlo por email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al generar link",
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
        title: "Email enviado",
        description: "El cliente recibirá el link de oferta en su correo.",
      });
      form.reset();
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al enviar email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateLink = () => {
    if (!selectedPropertyId) {
      toast({
        title: "Selecciona una propiedad",
        description: "Debes seleccionar una propiedad para generar el link.",
        variant: "destructive",
      });
      return;
    }
    generateTokenMutation.mutate(selectedPropertyId);
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
        title: "Copiado al portapapeles",
        description: type === "link" ? "Link copiado" : "Mensaje de WhatsApp copiado",
      });
    } catch (err) {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  const getWhatsAppMessage = () => {
    if (!generatedToken?.property) return "";
    const propertyTitle = getPropertyTitle(generatedToken.property);
    const offerLink = getOfferLink();
    return `¡Hola! 👋

Te envío el enlace para que puedas generar tu oferta de renta para *${propertyTitle}*.

Este es un enlace privado y seguro, válido por 24 horas:
${offerLink}

El proceso es rápido y sencillo. Solo necesitas completar tus datos y la información de tu oferta.

¿Tienes alguna pregunta? ¡Estoy aquí para ayudarte! 😊`;
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(getWhatsAppMessage());
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPropertyId("");
    setGeneratedToken(null);
    setCopiedLink(false);
    setCopiedWhatsApp(false);
    form.reset();
  };

  const onSubmitEmail = (data: EmailFormValues) => {
    sendEmailMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-generate-offer-link">
            <LinkIcon className="h-4 w-4 mr-2" />
            Generar Link de Oferta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar Link de Oferta Privado</DialogTitle>
          <DialogDescription>
            Crea un link privado de 24 horas para que un cliente pueda enviar su oferta de renta sin necesidad de login.
          </DialogDescription>
        </DialogHeader>

        {!generatedToken ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="property">Selecciona la Propiedad</Label>
              <Select
                value={selectedPropertyId}
                onValueChange={setSelectedPropertyId}
              >
                <SelectTrigger data-testid="select-property">
                  <SelectValue placeholder="Selecciona una propiedad" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingProperties ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    properties?.map((property: any) => (
                      <SelectItem key={property.id} value={property.id}>
                        {getPropertyTitle(property)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateLink}
              disabled={!selectedPropertyId || generateTokenMutation.isPending}
              className="w-full"
              data-testid="button-create-token"
            >
              {generateTokenMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generar Link
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <div className="space-y-2">
                <p className="text-sm font-medium">Propiedad:</p>
                <p className="text-sm text-muted-foreground">
                  {getPropertyTitle(generatedToken.property)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Válido hasta: {new Date(generatedToken.expiresAt).toLocaleString("es-MX")}
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
                  <Label>Link de Oferta</Label>
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
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Comparte este link directamente con el cliente. Será válido por 24 horas.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="whatsapp" className="space-y-4">
                <div>
                  <Label>Mensaje para WhatsApp</Label>
                  <textarea
                    value={getWhatsAppMessage()}
                    readOnly
                    className="w-full h-40 p-3 mt-2 text-sm border rounded-md resize-none font-mono bg-muted"
                    data-testid="textarea-whatsapp-message"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => copyToClipboard(getWhatsAppMessage(), "whatsapp")}
                      variant="outline"
                      className="flex-1"
                      data-testid="button-copy-whatsapp"
                    >
                      {copiedWhatsApp ? (
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      Copiar Mensaje
                    </Button>
                    <Button
                      onClick={openWhatsApp}
                      className="flex-1"
                      data-testid="button-open-whatsapp"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir WhatsApp
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <form onSubmit={form.handleSubmit(onSubmitEmail)} className="space-y-4">
                  <div>
                    <Label htmlFor="clientName">Nombre del Cliente</Label>
                    <Input
                      {...form.register("clientName")}
                      placeholder="Juan Pérez"
                      data-testid="input-client-name"
                    />
                    {form.formState.errors.clientName && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.clientName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="clientEmail">Email del Cliente</Label>
                    <Input
                      {...form.register("clientEmail")}
                      type="email"
                      placeholder="juan@ejemplo.com"
                      data-testid="input-client-email"
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
                    data-testid="button-send-email"
                  >
                    {sendEmailMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Email
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                data-testid="button-close"
              >
                Cerrar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedToken(null);
                  setSelectedPropertyId("");
                }}
                className="flex-1"
                data-testid="button-generate-another"
              >
                Generar Otro Link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
