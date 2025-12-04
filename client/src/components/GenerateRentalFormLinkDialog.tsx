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
import { Loader2, Copy, Check, MessageCircle, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { getPropertyTitle } from "@/lib/propertyHelpers";
import { logError, getErrorMessage } from "@/lib/errorHandling";

const emailFormSchema = z.object({
  clientEmail: z.string().email("Email inválido"),
  clientName: z.string().min(2, "Nombre es requerido"),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface GenerateRentalFormLinkDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  leadId?: string;
  leadInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function GenerateRentalFormLinkDialog({ 
  open = false, 
  onOpenChange, 
  leadId, 
  leadInfo 
}: GenerateRentalFormLinkDialogProps) {
  const { toast } = useToast();
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
      const payload: any = { propertyId };
      if (leadId) {
        payload.leadId = leadId;
      }
      const response = await apiRequest("POST", "/api/rental-form-tokens", payload);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedToken(data);
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Link generado exitosamente",
        description: "Ahora puedes compartir el link para completar el formato de renta.",
      });
    },
    onError: (error: unknown) => {
      logError("GenerateRentalFormLinkDialog.generateTokenMutation", error);
      toast({
        title: "Error al generar link",
        description: getErrorMessage(error, "es"),
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
        title: "Email enviado",
        description: "El cliente recibirá el link del formato de renta en su correo.",
      });
      form.reset();
      handleClose();
    },
    onError: (error: unknown) => {
      logError("GenerateRentalFormLinkDialog.sendEmailMutation", error);
      toast({
        title: "Error al enviar email",
        description: getErrorMessage(error, "es"),
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

  const getRentalFormLink = () => {
    if (!generatedToken) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/rental-form/${generatedToken.token}`;
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
      logError("GenerateRentalFormLinkDialog.copyToClipboard", err);
      toast({
        title: "Error al copiar",
        description: getErrorMessage(err, "es"),
        variant: "destructive",
      });
    }
  };

  const getWhatsAppMessage = () => {
    if (!generatedToken?.property) return "";
    const propertyTitle = getPropertyTitle(generatedToken.property);
    const rentalFormLink = getRentalFormLink();
    return `¡Hola! 👋

Te envío el enlace para que puedas completar el *Formato de Renta de Inquilino* para *${propertyTitle}*.

Este es un enlace privado y seguro, válido por 24 horas:
${rentalFormLink}

El formato incluye:
• Datos generales del arrendatario
• Información del garante (si aplica)
• Referencias laborales y personales
• Subida de documentos requeridos
• Términos y condiciones
• Firma digital

El proceso tarda aproximadamente 15-20 minutos. Una vez completado, revisaremos tu solicitud en 48-72 horas.

¿Tienes alguna pregunta? ¡Estoy aquí para ayudarte! 😊`;
  };

  const handleClose = () => {
    setGeneratedToken(null);
    setSelectedPropertyId("");
    form.reset();
    onOpenChange?.(false);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    sendEmailMutation.mutate(data);
  });

  const selectedProperty = properties?.find((p: any) => p.id === selectedPropertyId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-generate-rental-form-link">
        <DialogHeader>
          <DialogTitle>Enviar Formato de Renta de Inquilino</DialogTitle>
          <DialogDescription>
            Genera un link temporal (24 horas) para que el cliente complete el formato de renta con todos sus datos y documentos.
          </DialogDescription>
        </DialogHeader>

        {!generatedToken ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="property-select">Seleccionar Propiedad *</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger id="property-select" data-testid="select-property">
                  <SelectValue placeholder="Selecciona una propiedad..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingProperties ? (
                    <SelectItem value="loading" disabled>
                      Cargando propiedades...
                    </SelectItem>
                  ) : properties?.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No hay propiedades disponibles
                    </SelectItem>
                  ) : (
                    properties?.map((property: any) => (
                      <SelectItem key={property.id} value={property.id}>
                        {getPropertyTitle(property)} - ${property.price} {property.currency}/mes
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedProperty && (
              <Card className="p-4 bg-muted/50">
                <div className="space-y-2">
                  <h4 className="font-semibold">{getPropertyTitle(selectedProperty)}</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>💵 Renta: ${selectedProperty.price} {selectedProperty.currency}/mes</p>
                    <p>🛏️ {selectedProperty.bedrooms} rec. | 🚿 {selectedProperty.bathrooms} baños</p>
                    <p>📍 {selectedProperty.location}</p>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateLink}
                disabled={!selectedPropertyId || generateTokenMutation.isPending}
                className="flex-1"
                data-testid="button-generate-link"
              >
                {generateTokenMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generar Link
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="link" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="link">Link Directo</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-4">
              <div className="space-y-2">
                <Label>Link del Formato de Renta</Label>
                <div className="flex gap-2">
                  <Input
                    value={getRentalFormLink()}
                    readOnly
                    className="font-mono text-sm"
                    data-testid="input-rental-form-link"
                  />
                  <Button
                    onClick={() => copyToClipboard(getRentalFormLink(), "link")}
                    variant="outline"
                    size="icon"
                    data-testid="button-copy-link"
                  >
                    {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⏰ Este link expira en 24 horas
                </p>
              </div>

              <Button
                onClick={() => window.open(getRentalFormLink(), "_blank")}
                variant="outline"
                className="w-full gap-2"
                data-testid="button-open-link"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir Link
              </Button>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4">
              <div className="space-y-2">
                <Label>Mensaje para WhatsApp</Label>
                <textarea
                  value={getWhatsAppMessage()}
                  readOnly
                  className="w-full h-64 p-3 text-sm border rounded-md font-mono resize-none"
                  data-testid="textarea-whatsapp-message"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(getWhatsAppMessage(), "whatsapp")}
                  variant="outline"
                  className="flex-1 gap-2"
                  data-testid="button-copy-whatsapp"
                >
                  {copiedWhatsApp ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copiar Mensaje
                </Button>
                {leadInfo?.phone && (
                  <Button
                    onClick={() => {
                      const phone = leadInfo.phone.replace(/[^0-9]/g, "");
                      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(getWhatsAppMessage())}`;
                      window.open(whatsappUrl, "_blank");
                    }}
                    className="flex-1 gap-2"
                    data-testid="button-send-whatsapp"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Abrir WhatsApp
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nombre del Cliente *</Label>
                  <Input
                    id="clientName"
                    {...form.register("clientName")}
                    placeholder="Juan Pérez"
                    data-testid="input-client-name"
                  />
                  {form.formState.errors.clientName && (
                    <p className="text-sm text-destructive">{form.formState.errors.clientName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email del Cliente *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    {...form.register("clientEmail")}
                    placeholder="juan@ejemplo.com"
                    data-testid="input-client-email"
                  />
                  {form.formState.errors.clientEmail && (
                    <p className="text-sm text-destructive">{form.formState.errors.clientEmail.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={sendEmailMutation.isPending}
                  className="w-full"
                  data-testid="button-send-email"
                >
                  {sendEmailMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enviar Email
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}

        {generatedToken && (
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleClose} variant="outline" className="flex-1" data-testid="button-close">
              Cerrar
            </Button>
            <Button
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
        )}
      </DialogContent>
    </Dialog>
  );
}
