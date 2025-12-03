import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Copy,
  Send,
  Loader2,
  Home,
  User,
  Users,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { LeadEmptyState } from "./LeadEmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { ExternalLead, ExternalUnit, ExternalCondominium, ExternalUnitWithCondominium } from "@shared/schema";

interface LeadRentalFormsTabProps {
  lead: ExternalLead;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

interface RentalFormToken {
  id: string;
  token: string;
  recipientType: string;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
  createdByName: string;
  propertyTitle: string;
  unitNumber?: string;
  condoName?: string;
}

interface UnitOption {
  id: string;
  unitNumber: string;
  condoName?: string;
}

interface OfferToken {
  id: string;
  token: string;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
  externalUnitId: string;
  unitNumber: string;
  condoName: string;
  condoId: string;
  propertyTitle: string;
  offerData?: any;
}

export default function LeadRentalFormsTab({ lead, dialogOpen, onDialogOpenChange }: LeadRentalFormsTabProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const locale = language === "es" ? es : enUS;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [recipientType, setRecipientType] = useState<string>("tenant");
  
  // Check if user is a seller (not admin)
  const isSeller = user?.role === 'external_agency_seller';

  // Sync with controlled props from parent
  useEffect(() => {
    if (dialogOpen !== undefined) {
      setIsDialogOpen(dialogOpen);
    }
  }, [dialogOpen]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    onDialogOpenChange?.(open);
  };

  const { data: rentalForms, isLoading } = useQuery<RentalFormToken[]>({
    queryKey: ["/api/external-leads", lead.id, "rental-forms"],
    queryFn: async () => {
      const response = await fetch(`/api/external-leads/${lead.id}/rental-forms`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch offer tokens for this lead (to check for completed offers)
  const { data: offerTokens, isLoading: isLoadingOffers } = useQuery<OfferToken[]>({
    queryKey: ["/api/external-leads", lead.id, "offer-tokens"],
    queryFn: async () => {
      const response = await fetch(`/api/external-leads/${lead.id}/offer-tokens`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Get completed offers (only for seller restrictions)
  const completedOffers = useMemo(() => {
    if (!offerTokens) return [];
    return offerTokens.filter(token => token.isUsed);
  }, [offerTokens]);

  // For sellers: get condominiums that have completed offers
  const sellerAllowedCondoIds = useMemo(() => {
    if (!isSeller) return null; // No restrictions for admins
    return new Set(completedOffers.map(offer => offer.condoId).filter(Boolean));
  }, [isSeller, completedOffers]);

  // For sellers: get units that have completed offers
  const sellerAllowedUnitIds = useMemo(() => {
    if (!isSeller) return null; // No restrictions for admins
    return new Set(completedOffers.map(offer => offer.externalUnitId).filter(Boolean));
  }, [isSeller, completedOffers]);

  // Load all condominiums (no limit)
  const { data: condominiumsResponse, isLoading: isLoadingCondominiums } = useQuery<{ data: any[], total: number }>({
    queryKey: ["/api/external-condominiums", "for-rental-forms-dialog"],
    queryFn: async () => {
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

  const condominiumOptions = useMemo(() => {
    const condos = condominiumsResponse?.data || [];
    let filteredCondos = condos;
    
    // For sellers: only show condominiums with completed offers
    if (isSeller && sellerAllowedCondoIds) {
      filteredCondos = condos.filter(condo => sellerAllowedCondoIds.has(String(condo.id)));
    }
    
    return filteredCondos
      .map(condo => ({
        value: String(condo.id),
        label: condo.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [condominiumsResponse, isSeller, sellerAllowedCondoIds]);

  // Load units for selected condominium
  const { data: unitsResponse, isLoading: isLoadingUnits } = useQuery<{ data: ExternalUnitWithCondominium[], total: number }>({
    queryKey: ["/api/external-units", "by-condominium-for-rental-form", selectedCondominiumId],
    queryFn: async () => {
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

  const unitOptions = useMemo(() => {
    if (!selectedCondominiumId || !unitsResponse?.data) return [];
    
    let filteredUnits = unitsResponse.data;
    
    // For sellers: only show units with completed offers
    if (isSeller && sellerAllowedUnitIds) {
      filteredUnits = unitsResponse.data.filter(unit => sellerAllowedUnitIds.has(String(unit.id)));
    }
    
    return filteredUnits
      .sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || '', undefined, { numeric: true }))
      .map(unit => ({
        value: String(unit.id),
        label: `${unit.unitNumber}${unit.price ? ` - $${Number(unit.price).toLocaleString()}/mes` : ''}`,
        description: unit.typology || undefined,
      }));
  }, [unitsResponse, selectedCondominiumId, isSeller, sellerAllowedUnitIds]);

  const selectedUnit = useMemo(() => {
    if (!selectedUnitId || !unitsResponse?.data) return null;
    return unitsResponse.data.find(u => String(u.id) === selectedUnitId);
  }, [selectedUnitId, unitsResponse]);

  const handleCondominiumChange = (value: string) => {
    setSelectedCondominiumId(value);
    setSelectedUnitId("");
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedCondominiumId("");
      setSelectedUnitId("");
      setRecipientType("tenant");
    }
  };

  const createFormMutation = useMutation({
    mutationFn: async (data: { externalUnitId: string; recipientType: string }) => {
      const res = await apiRequest("POST", `/api/external-leads/${lead.id}/rental-forms`, data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads", lead.id, "rental-forms"] });
      handleDialogClose(false);
      
      if (data.shareUrl) {
        navigator.clipboard.writeText(data.shareUrl);
        toast({
          title: language === "es" ? "Formulario generado" : "Form generated",
          description: language === "es" 
            ? "El enlace se copió al portapapeles" 
            : "Link copied to clipboard",
        });
      } else {
        toast({
          title: language === "es" ? "Formulario generado" : "Form generated",
        });
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: language === "es" 
          ? "No se pudo generar el formulario" 
          : "Failed to generate form",
      });
    },
  });

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/rental-form/${token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: language === "es" ? "Enlace copiado" : "Link copied",
    });
  };

  const shareViaWhatsApp = (token: string, propertyTitle: string) => {
    const url = `${window.location.origin}/rental-form/${token}`;
    const phone = lead.phone?.replace(/\D/g, '');
    const message = language === "es"
      ? `Hola ${lead.firstName}, por favor complete el formulario de renta para ${propertyTitle}: ${url}`
      : `Hi ${lead.firstName}, please complete the rental form for ${propertyTitle}: ${url}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSubmit = () => {
    if (!selectedUnitId) {
      toast({
        variant: "destructive",
        title: language === "es" ? "Selecciona una unidad" : "Select a unit",
      });
      return;
    }
    createFormMutation.mutate({ externalUnitId: selectedUnitId, recipientType });
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const getStatusBadge = (form: RentalFormToken) => {
    if (form.isUsed) {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {language === "es" ? "Completado" : "Completed"}
        </Badge>
      );
    }
    if (isExpired(form.expiresAt)) {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          {language === "es" ? "Expirado" : "Expired"}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="w-3 h-3 mr-1" />
        {language === "es" ? "Pendiente" : "Pending"}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h4 className="font-medium text-sm">
          {language === "es" ? "Formatos de Renta" : "Rental Forms"}
        </h4>
        <div className="flex items-center gap-2">
          {/* Send Form button - visible on web only (mobile uses FAB) */}
          <Button
            size="sm"
            className="hidden md:flex gap-1.5"
            onClick={() => handleDialogOpenChange(true)}
            data-testid="button-send-rental-form"
          >
            <Send className="h-4 w-4" />
            {language === "es" ? "Enviar Formato" : "Send Form"}
          </Button>
          <Badge variant="outline">
            {rentalForms?.length || 0} {language === "es" ? "enviados" : "sent"}
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : rentalForms && rentalForms.length > 0 ? (
        <div className="space-y-3">
          {rentalForms.map((form) => (
            <Card key={form.id} className="hover-elevate">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-full shrink-0 ${
                      form.isUsed 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-primary/10 text-primary"
                    }`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{form.propertyTitle}</p>
                        <Badge variant="outline" className="text-xs">
                          {form.recipientType === 'tenant' 
                            ? (language === "es" ? "Inquilino" : "Tenant")
                            : (language === "es" ? "Propietario" : "Owner")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span>{format(new Date(form.createdAt), "PPp", { locale })}</span>
                        <span>•</span>
                        <span>{form.createdByName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(form)}
                    {!form.isUsed && !isExpired(form.expiresAt) && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-h-[44px] min-w-[44px]"
                          onClick={() => copyToClipboard(form.token)}
                          data-testid={`button-copy-form-${form.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {lead.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-h-[44px] min-w-[44px] text-green-600"
                            onClick={() => shareViaWhatsApp(form.token, form.propertyTitle)}
                            data-testid={`button-whatsapp-form-${form.id}`}
                          >
                            <SiWhatsapp className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <LeadEmptyState
          icon={FileText}
          title={language === "es" ? "No hay formatos" : "No forms"}
          description={language === "es" ? "Envía el formato de renta para recopilar información del inquilino" : "Send rental forms to collect tenant information"}
          showAction={false}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {language === "es" ? "Enviar Formato de Renta" : "Send Rental Form"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? `Selecciona una propiedad y tipo de destinatario para enviar el formulario a ${lead.firstName}`
                : `Select a property and recipient type to send the form to ${lead.firstName}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Alert for sellers with no completed offers */}
            {isSeller && completedOffers.length === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {language === "es" 
                    ? "No hay ofertas completadas para este lead. Primero debes enviar una oferta y esperar a que el cliente la complete antes de enviar el formato de renta."
                    : "No completed offers for this lead. You must first send an offer and wait for the client to complete it before sending the rental form."}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Recipient Type Selection - First (hidden for sellers, always tenant) */}
            {!isSeller && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {language === "es" ? "Tipo de Destinatario" : "Recipient Type"}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={recipientType === "tenant" ? "default" : "outline"}
                    className="justify-start gap-2"
                    onClick={() => setRecipientType("tenant")}
                    data-testid="button-recipient-tenant"
                  >
                    <User className="h-4 w-4" />
                    {language === "es" ? "Inquilino" : "Tenant"}
                  </Button>
                  <Button
                    type="button"
                    variant={recipientType === "owner" ? "default" : "outline"}
                    className="justify-start gap-2"
                    onClick={() => setRecipientType("owner")}
                    data-testid="button-recipient-owner"
                  >
                    <Home className="h-4 w-4" />
                    {language === "es" ? "Propietario" : "Owner"}
                  </Button>
                </div>
              </div>
            )}

            {/* Condominium Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                {language === "es" ? "Condominio" : "Condominium"}
              </Label>
              <SearchableSelect
                value={selectedCondominiumId}
                onValueChange={handleCondominiumChange}
                options={condominiumOptions}
                placeholder={language === "es" ? "Buscar condominio..." : "Search condominium..."}
                searchPlaceholder={language === "es" ? "Escriba para buscar..." : "Type to search..."}
                emptyMessage={language === "es" ? "No se encontraron condominios" : "No condominiums found"}
                disabled={isLoadingCondominiums}
                data-testid="select-condominium-for-form"
              />
            </div>

            {/* Unit Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Home className="h-3.5 w-3.5 text-muted-foreground" />
                {language === "es" ? "Unidad" : "Unit"}
              </Label>
              <SearchableSelect
                value={selectedUnitId}
                onValueChange={setSelectedUnitId}
                options={unitOptions}
                placeholder={
                  !selectedCondominiumId 
                    ? (language === "es" ? "Primero selecciona un condominio" : "First select a condominium")
                    : isLoadingUnits
                      ? (language === "es" ? "Cargando unidades..." : "Loading units...")
                      : (language === "es" ? "Buscar unidad..." : "Search unit...")
                }
                searchPlaceholder={language === "es" ? "Escriba para buscar..." : "Type to search..."}
                emptyMessage={language === "es" ? "No hay unidades disponibles" : "No units available"}
                disabled={!selectedCondominiumId || isLoadingUnits}
                data-testid="select-unit-for-form"
              />
            </div>

            {/* Selected Unit Preview */}
            {selectedUnit && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Home className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {selectedUnit.unitNumber}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {selectedUnit.condominium?.name || condominiumOptions.find(c => c.value === selectedCondominiumId)?.label}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {recipientType === "tenant" 
                        ? (language === "es" ? "Inquilino" : "Tenant")
                        : (language === "es" ? "Propietario" : "Owner")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => handleDialogClose(false)}
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createFormMutation.isPending || !selectedUnitId || (isSeller && completedOffers.length === 0)}
              data-testid="button-confirm-send-form"
            >
              {createFormMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              {createFormMutation.isPending 
                ? (language === "es" ? "Enviando..." : "Sending...")
                : (language === "es" ? "Enviar Formato" : "Send Form")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
