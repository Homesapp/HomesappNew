import { useState, useEffect } from "react";
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
import { Loader2, Copy, Check, MessageCircle, Mail, Link as LinkIcon, ExternalLink, Building2, User, FileText, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ExternalUnitWithCondominium, ExternalClient } from "@shared/schema";

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
  const [recipientType, setRecipientType] = useState<"tenant" | "owner">("tenant");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId?.toString() || "");
  const [generatedToken, setGeneratedToken] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [unitSearchTerm, setUnitSearchTerm] = useState<string>("");
  const [clientSearchTerm, setClientSearchTerm] = useState<string>("");

  // Queries
  const { data: units, isLoading: isLoadingUnits } = useQuery<ExternalUnitWithCondominium[]>({
    queryKey: ["/api/external-units"],
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: clients, isLoading: isLoadingClients } = useQuery<ExternalClient[]>({
    queryKey: ["/api/external-clients"],
    enabled: open && !clientId && recipientType === "tenant",
    staleTime: 5 * 60 * 1000,
  });

  // Query para obtener owners de la unidad seleccionada
  const { data: unitOwners, isLoading: isLoadingOwners } = useQuery({
    queryKey: ["/api/external-unit-owners/active", selectedUnitId],
    queryFn: async () => {
      if (!selectedUnitId) return [];
      const response = await apiRequest("GET", `/api/external-unit-owners/active/${selectedUnitId}`);
      return response.json();
    },
    enabled: open && !!selectedUnitId && recipientType === "owner",
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select owner when owners load and there's only one
  useEffect(() => {
    if (recipientType === "owner" && unitOwners) {
      if (unitOwners.length === 1) {
        setSelectedOwnerId(unitOwners[0].id);
      } else if (unitOwners.length === 0) {
        setSelectedOwnerId("");
      } else if (!unitOwners.find(o => o.id === selectedOwnerId)) {
        // Clear selection if previously selected owner is not in new list
        setSelectedOwnerId("");
      }
    }
  }, [unitOwners, recipientType]);

  // Reset owner only when unit changes (not when recipientType changes)
  useEffect(() => {
    if (recipientType === "owner") {
      setSelectedOwnerId("");
    }
  }, [selectedUnitId]);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      clientName: clientInfo?.name || "",
      clientEmail: clientInfo?.email || "",
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: async ({ unitId, clientId, ownerId, recipientType }: { unitId: string; clientId?: string; ownerId?: string; recipientType: "tenant" | "owner" }) => {
      const response = await apiRequest("POST", "/api/rental-form-tokens", {
        externalUnitId: unitId,
        externalClientId: clientId,
        externalUnitOwnerId: ownerId,
        recipientType: recipientType,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedToken(data);
      queryClient.invalidateQueries({ queryKey: ["/api/external/rental-form-tokens"] });
      toast({
        title: language === "es" ? "✓ Link generado exitosamente" : "✓ Link generated successfully",
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
      if (!generatedToken?.id) {
        throw new Error("No generated token");
      }
      return apiRequest("POST", `/api/rental-form-tokens/${generatedToken.id}/send-email`, data);
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "✓ Email enviado" : "✓ Email sent",
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

    if (recipientType === "tenant") {
      if (!selectedClientId) {
        toast({
          title: language === "es" ? "Selecciona un inquilino" : "Select a tenant",
          description: language === "es"
            ? "Debes seleccionar un inquilino para generar el link."
            : "You must select a tenant to generate the link.",
          variant: "destructive",
        });
        return;
      }
      
      // Verify client exists in current list
      const clientExists = clients?.find(c => String(c.id) === selectedClientId) || clientInfo;
      if (!clientExists) {
        toast({
          title: language === "es" ? "Cliente no válido" : "Invalid client",
          description: language === "es"
            ? "El cliente seleccionado ya no está disponible. Por favor selecciona otro."
            : "The selected client is no longer available. Please select another.",
          variant: "destructive",
        });
        setSelectedClientId("");
        return;
      }
    }

    if (recipientType === "owner") {
      if (!selectedOwnerId) {
        toast({
          title: language === "es" ? "Selecciona un propietario" : "Select an owner",
          description: language === "es"
            ? "Debes seleccionar un propietario para generar el link."
            : "You must select an owner to generate the link.",
          variant: "destructive",
        });
        return;
      }

      // Verify owner exists in current unit's owner list
      const ownerExists = unitOwners?.find(o => o.id === selectedOwnerId);
      if (!ownerExists) {
        toast({
          title: language === "es" ? "Propietario no válido" : "Invalid owner",
          description: language === "es"
            ? "El propietario seleccionado no pertenece a esta unidad. Por favor recarga la página."
            : "The selected owner does not belong to this unit. Please reload the page.",
          variant: "destructive",
        });
        setSelectedOwnerId("");
        return;
      }
    }

    generateTokenMutation.mutate({ 
      unitId: selectedUnitId, 
      clientId: recipientType === "tenant" ? selectedClientId : undefined,
      ownerId: recipientType === "owner" ? selectedOwnerId : undefined,
      recipientType 
    });
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
        title: language === "es" ? "✓ Copiado" : "✓ Copied",
        description: type === "link" 
          ? language === "es" ? "Link copiado al portapapeles" : "Link copied to clipboard"
          : language === "es" ? "Mensaje copiado al portapapeles" : "Message copied to clipboard",
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
    
    const recipientName = recipientType === "tenant" 
      ? (selectedClient?.firstName || "")
      : (selectedOwner?.ownerName || "");

    return language === "es"
      ? `¡Hola${recipientName ? ` ${recipientName}` : ''}! 👋

Te envío el enlace para completar el formato de ${recipientType === "tenant" ? "inquilino" : "propietario"} de *${unitTitle}*.

Este es un enlace privado y seguro, válido por 24 horas:
${formLink}

Por favor completa todos los datos solicitados para continuar con el proceso.

¿Necesitas ayuda? ¡Estoy disponible para cualquier duda! 😊`
      : `Hi${recipientName ? ` ${recipientName}` : ''}! 👋

I'm sending you the link to complete the ${recipientType === "tenant" ? "tenant" : "owner"} form for *${unitTitle}*.

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
    setSelectedOwnerId("");
    if (!clientId) setSelectedClientId("");
    setGeneratedToken(null);
    setCopiedLink(false);
    setCopiedWhatsApp(false);
    setUnitSearchTerm("");
    form.reset();
  };

  const onSubmitEmail = (data: EmailFormValues) => {
    sendEmailMutation.mutate(data);
  };

  const selectedUnit = units?.find((u) => String(u.id) === selectedUnitId);
  const selectedClient = clients?.find((c) => String(c.id) === selectedClientId) || 
    (clientInfo && { firstName: clientInfo.name.split(" ")[0], lastName: clientInfo.name.split(" ").slice(1).join(" ") || "" });
  const selectedOwner = unitOwners?.find((o) => String(o.id) === selectedOwnerId);

  const filteredUnits = units?.filter((unit) => {
    if (!unitSearchTerm) return true;
    const searchLower = unitSearchTerm.toLowerCase();
    const condominiumName = unit.condominium?.name?.toLowerCase() || "";
    const unitNumber = unit.unitNumber?.toLowerCase() || "";
    return condominiumName.includes(searchLower) || unitNumber.includes(searchLower);
  });

  const filteredClients = clients?.filter((client) => {
    if (!clientSearchTerm) return true;
    const searchLower = clientSearchTerm.toLowerCase();
    const fullName = `${client.firstName || ""} ${client.lastName || ""}`.toLowerCase();
    const email = (client.email || "").toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {language === "es" ? "Generar Link de Formato de Renta" : "Generate Rental Form Link"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {language === "es"
                  ? "Crea un link privado de 24 horas para completar el formato de renta"
                  : "Create a 24-hour private link to complete the rental form"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!generatedToken ? (
          <div className="space-y-6 mt-6">
            {/* Step 1: Recipient Type */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    1
                  </div>
                  <CardTitle className="text-lg">
                    {language === "es" ? "Tipo de Formulario" : "Form Type"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={recipientType}
                  onValueChange={(value: "tenant" | "owner") => {
                    setRecipientType(value);
                    setSelectedUnitId("");
                    setSelectedClientId(clientId?.toString() || "");
                    setSelectedOwnerId("");
                  }}
                >
                  <SelectTrigger data-testid="select-recipient-type" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant">
                      <div className="flex items-center gap-3 py-1">
                        <User className="w-4 h-4 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium">
                            {language === "es" ? "Inquilino (Arrendatario)" : "Tenant"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {language === "es" 
                              ? "Datos personales, laborales y referencias" 
                              : "Personal, employment & references"}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="owner">
                      <div className="flex items-center gap-3 py-1">
                        <Building2 className="w-4 h-4 text-green-600" />
                        <div className="text-left">
                          <div className="font-medium">
                            {language === "es" ? "Propietario (Arrendador)" : "Owner (Landlord)"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {language === "es"
                              ? "Datos de propiedad, bancarios y documentos"
                              : "Property, banking & documents"}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Separator />

            {/* Step 2: Select Unit */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    2
                  </div>
                  <CardTitle className="text-lg">
                    {language === "es" ? "Selecciona la Unidad" : "Select Unit"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder={language === "es" ? "🔍 Buscar por condominio o número de unidad..." : "🔍 Search by condominium or unit number..."}
                  value={unitSearchTerm}
                  onChange={(e) => setUnitSearchTerm(e.target.value)}
                  data-testid="input-search-unit"
                  className="h-11"
                />
                <Select
                  value={selectedUnitId}
                  onValueChange={setSelectedUnitId}
                >
                  <SelectTrigger data-testid="select-unit" className="h-12">
                    <SelectValue placeholder={language === "es" ? "Selecciona una unidad" : "Select a unit"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingUnits ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredUnits && filteredUnits.length > 0 ? (
                      filteredUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{unit.condominium?.name}</span>
                            <span className="text-muted-foreground">-</span>
                            <span>{unit.unitNumber}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {language === "es" ? "No se encontraron unidades" : "No units found"}
                      </div>
                    )}
                  </SelectContent>
                </Select>

                {selectedUnit && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {selectedUnit.condominium?.name} - {selectedUnit.unitNumber}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Step 3: Select Client or Owner */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    3
                  </div>
                  <CardTitle className="text-lg">
                    {recipientType === "tenant"
                      ? (language === "es" ? "Selecciona el Inquilino" : "Select Tenant")
                      : (language === "es" ? "Propietario de la Unidad" : "Unit Owner")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recipientType === "tenant" ? (
                  // Tenant selection
                  !clientId ? (
                    <div className="space-y-3">
                      <Input
                        placeholder={language === "es" ? "🔍 Buscar por nombre o email..." : "🔍 Search by name or email..."}
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        data-testid="input-search-client"
                        className="h-11"
                      />
                      <Select
                        value={selectedClientId}
                        onValueChange={setSelectedClientId}
                      >
                        <SelectTrigger data-testid="select-client" className="h-12">
                          <SelectValue placeholder={language === "es" ? "Selecciona un inquilino" : "Select a tenant"} />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingClients ? (
                            <div className="flex items-center justify-center p-8">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : filteredClients && filteredClients.length > 0 ? (
                            filteredClients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">{client.firstName} {client.lastName}</div>
                                    {client.email && (
                                      <div className="text-xs text-muted-foreground">{client.email}</div>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          ) : clients && clients.length > 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              {language === "es" ? "No se encontraron clientes" : "No clients found"}
                            </div>
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              {language === "es" ? "No hay clientes disponibles" : "No clients available"}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <User className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900 dark:text-green-100">
                        {clientInfo?.name}
                      </span>
                    </div>
                  )
                ) : (
                  // Owner selection
                  <div className="space-y-3">
                    {!selectedUnitId ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {language === "es" 
                            ? "Primero selecciona una unidad para ver sus propietarios"
                            : "First select a unit to see its owners"}
                        </AlertDescription>
                      </Alert>
                    ) : isLoadingOwners ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : unitOwners && unitOwners.length > 0 ? (
                      <>
                        {unitOwners.length === 1 ? (
                          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-start gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
                                <Building2 className="w-5 h-5 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-green-900 dark:text-green-100">
                                  {unitOwners[0].ownerName}
                                </div>
                                <div className="text-sm text-green-700 dark:text-green-300 mt-1 space-y-1">
                                  {unitOwners[0].ownerEmail && (
                                    <div>✉️ {unitOwners[0].ownerEmail}</div>
                                  )}
                                  {unitOwners[0].ownerPhone && (
                                    <div>📞 {unitOwners[0].ownerPhone}</div>
                                  )}
                                </div>
                                <Badge className="mt-2" variant="secondary">
                                  {language === "es" ? "Propietario Principal" : "Primary Owner"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Select
                            value={selectedOwnerId}
                            onValueChange={setSelectedOwnerId}
                          >
                            <SelectTrigger data-testid="select-owner" className="h-12">
                              <SelectValue placeholder={language === "es" ? "Selecciona un propietario" : "Select an owner"} />
                            </SelectTrigger>
                            <SelectContent>
                              {unitOwners.map((owner) => (
                                <SelectItem key={owner.id} value={owner.id}>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium">{owner.ownerName}</div>
                                      {owner.ownerEmail && (
                                        <div className="text-xs text-muted-foreground">{owner.ownerEmail}</div>
                                      )}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </>
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {language === "es" 
                            ? "Esta unidad no tiene propietarios asignados. Por favor, agrega un propietario antes de generar el link."
                            : "This unit has no assigned owners. Please add an owner before generating the link."}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                data-testid="button-cancel"
              >
                {language === "es" ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                onClick={handleGenerateLink}
                disabled={
                  !selectedUnitId || 
                  (recipientType === "tenant" && !selectedClientId) ||
                  (recipientType === "owner" && !selectedOwnerId) ||
                  generateTokenMutation.isPending
                }
                className="flex-1"
                size="lg"
                data-testid="button-create-token"
              >
                {generateTokenMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === "es" ? "Generar Link" : "Generate Link"}
              </Button>
            </div>
          </div>
        ) : (
          // Generated Token View
          <div className="space-y-6 mt-6">
            <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
              <CardHeader>
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Check className="w-5 h-5" />
                  <CardTitle className="text-lg">
                    {language === "es" ? "Link Generado Exitosamente" : "Link Generated Successfully"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                      {recipientType === "tenant" 
                        ? (language === "es" ? "Inquilino" : "Tenant")
                        : (language === "es" ? "Propietario" : "Owner")}
                    </div>
                    <div className="font-semibold text-green-900 dark:text-green-100">
                      {recipientType === "tenant" 
                        ? `${selectedClient?.firstName} ${selectedClient?.lastName}`
                        : selectedOwner?.ownerName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                      {language === "es" ? "Unidad" : "Unit"}
                    </div>
                    <div className="font-semibold text-green-900 dark:text-green-100">
                      {selectedUnit?.condominium?.name} - {selectedUnit?.unitNumber}
                    </div>
                  </div>
                </div>
                <Separator className="bg-green-200 dark:bg-green-800" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700 dark:text-green-400">
                    {language === "es" ? "Válido hasta:" : "Valid until:"}
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {new Date(generatedToken.expiresAt).toLocaleString(language === "es" ? "es-MX" : "en-US", {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="link" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="link" data-testid="tab-link" className="gap-2">
                  <LinkIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Link</span>
                </TabsTrigger>
                <TabsTrigger value="whatsapp" data-testid="tab-whatsapp" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </TabsTrigger>
                <TabsTrigger value="email" data-testid="tab-email" className="gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="link" className="space-y-4 mt-4">
                <div>
                  <Label className="text-base font-semibold">
                    {language === "es" ? "Link de Formato" : "Form Link"}
                  </Label>
                  <div className="flex gap-2 mt-3">
                    <Input
                      value={getFormLink()}
                      readOnly
                      className="font-mono text-sm h-12 bg-muted"
                      data-testid="input-form-link"
                    />
                    <Button
                      onClick={() => copyToClipboard(getFormLink(), "link")}
                      variant="outline"
                      size="icon"
                      className="h-12 w-12"
                      data-testid="button-copy-link"
                    >
                      {copiedLink ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      onClick={() => window.open(getFormLink(), "_blank")}
                      variant="outline"
                      size="icon"
                      className="h-12 w-12"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="whatsapp" className="space-y-4 mt-4">
                <div>
                  <Label className="text-base font-semibold">
                    {language === "es" ? "Mensaje para WhatsApp" : "WhatsApp Message"}
                  </Label>
                  <div className="mt-3">
                    <textarea
                      value={getWhatsAppMessage()}
                      readOnly
                      className="w-full min-h-[240px] text-sm rounded-lg border border-input bg-muted px-4 py-3 font-mono resize-none"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => copyToClipboard(getWhatsAppMessage(), "whatsapp")}
                      variant="outline"
                      className="flex-1 h-12"
                    >
                      {copiedWhatsApp ? (
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {language === "es" ? "Copiar Mensaje" : "Copy Message"}
                    </Button>
                    <Button onClick={openWhatsApp} className="flex-1 h-12 bg-green-600 hover:bg-green-700">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {language === "es" ? "Abrir WhatsApp" : "Open WhatsApp"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-4 mt-4">
                <form onSubmit={form.handleSubmit(onSubmitEmail)} className="space-y-4">
                  <div>
                    <Label htmlFor="clientName" className="text-base">
                      {language === "es" ? "Nombre del Cliente" : "Client Name"}
                    </Label>
                    <Input
                      id="clientName"
                      {...form.register("clientName")}
                      placeholder={language === "es" ? "Nombre completo" : "Full name"}
                      className="h-12 mt-2"
                    />
                    {form.formState.errors.clientName && (
                      <p className="text-sm text-destructive mt-2">
                        {form.formState.errors.clientName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="clientEmail" className="text-base">
                      {language === "es" ? "Email del Cliente" : "Client Email"}
                    </Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      {...form.register("clientEmail")}
                      placeholder={language === "es" ? "correo@ejemplo.com" : "email@example.com"}
                      className="h-12 mt-2"
                    />
                    {form.formState.errors.clientEmail && (
                      <p className="text-sm text-destructive mt-2">
                        {form.formState.errors.clientEmail.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12"
                    disabled={sendEmailMutation.isPending}
                  >
                    {sendEmailMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Mail className="h-4 w-4 mr-2" />
                    {language === "es" ? "Enviar por Email" : "Send by Email"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1 h-12">
                {language === "es" ? "Cerrar" : "Close"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
