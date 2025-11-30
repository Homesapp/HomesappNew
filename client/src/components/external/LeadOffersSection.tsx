import { useState, useMemo } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Send,
  Building2,
  DollarSign,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Loader2,
  Home,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { LeadEmptyState } from "./LeadEmptyState";
import type { ExternalLead, ExternalUnitWithCondominium } from "@shared/schema";

interface LeadOffersSectionProps {
  lead: ExternalLead;
}

export default function LeadOffersSection({ lead }: LeadOffersSectionProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [selectedCondominiumId, setSelectedCondominiumId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [generatedOffer, setGeneratedOffer] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: propertyOffers, isLoading: offersLoading } = useQuery({
    queryKey: ["/api/external-leads", lead.id, "properties-sent"],
    queryFn: async () => {
      const res = await fetch(`/api/external-leads/${lead.id}/properties-sent`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Load all condominiums
  const { data: condominiumsResponse, isLoading: isLoadingCondominiums } = useQuery<{ data: any[], total: number }>({
    queryKey: ["/api/external-condominiums", "for-offer-dialog"],
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
    return condos
      .map(condo => ({
        value: String(condo.id),
        label: condo.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [condominiumsResponse]);

  // Load units for selected condominium
  const { data: unitsResponse, isLoading: isLoadingUnits } = useQuery<{ data: ExternalUnitWithCondominium[], total: number }>({
    queryKey: ["/api/external-units", "by-condominium-for-offer", selectedCondominiumId],
    queryFn: async () => {
      let allUnits: ExternalUnitWithCondominium[] = [];
      let offset = 0;
      const batchSize = 100;
      let hasMore = true;
      
      while (hasMore) {
        const response = await fetch(`/api/external-units?condominiumId=${selectedCondominiumId}&status=disponible&limit=${batchSize}&offset=${offset}`, { credentials: 'include' });
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
    return unitsResponse.data
      .sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || '', undefined, { numeric: true }))
      .map(unit => ({
        value: String(unit.id),
        label: `${unit.unitNumber}${unit.price ? ` - $${Number(unit.price).toLocaleString()}/mes` : ''}`,
        description: unit.typology || undefined,
      }));
  }, [unitsResponse, selectedCondominiumId]);

  const selectedUnit = useMemo(() => {
    if (!selectedUnitId || !unitsResponse?.data) return null;
    return unitsResponse.data.find(u => String(u.id) === selectedUnitId);
  }, [selectedUnitId, unitsResponse]);

  const handleCondominiumChange = (value: string) => {
    setSelectedCondominiumId(value);
    setSelectedUnitId("");
  };

  const generateOfferMutation = useMutation({
    mutationFn: async (unitId: string) => {
      const res = await apiRequest("POST", `/api/external-leads/${lead.id}/offers`, { externalUnitId: unitId });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedOffer(data);
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads", lead.id, "properties-sent"] });
      toast({
        title: language === "es" ? "Oferta generada" : "Offer generated",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error al generar oferta" : "Error generating offer",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast({
      title: language === "es" ? "Enlace copiado" : "Link copied",
    });
  };

  const shareViaWhatsApp = (url: string, unitName?: string) => {
    const phone = lead.phone?.replace(/\D/g, '');
    const message = language === "es"
      ? `Hola ${lead.firstName}, te comparto información sobre ${unitName || 'esta propiedad'}: ${url}`
      : `Hi ${lead.firstName}, here's information about ${unitName || 'this property'}: ${url}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-sm">
          {language === "es" ? "Ofertas Enviadas" : "Offers Sent"}
        </h4>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {propertyOffers?.length || 0} {language === "es" ? "enviadas" : "sent"}
          </Badge>
          <Button 
            size="sm" 
            onClick={() => setIsOfferDialogOpen(true)}
            data-testid="button-generate-offer"
          >
            <Plus className="h-4 w-4 mr-1" />
            {language === "es" ? "Nueva Oferta" : "New Offer"}
          </Button>
        </div>
      </div>

      {offersLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : propertyOffers && propertyOffers.length > 0 ? (
        <div className="space-y-3">
          {propertyOffers.map((offer: any) => (
            <Card key={offer.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{offer.unitNumber}</p>
                    <p className="text-xs text-muted-foreground">{offer.condoName}</p>
                    {offer.rentPrice && (
                      <p className="text-xs flex items-center gap-1 mt-1">
                        <DollarSign className="h-3 w-3" />
                        ${Number(offer.rentPrice).toLocaleString()}/mes
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={offer.isViewed ? "default" : "secondary"}>
                    {offer.isViewed 
                      ? (language === "es" ? "Visto" : "Viewed")
                      : (language === "es" ? "Enviado" : "Sent")}
                  </Badge>
                  {offer.publicUrl && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(offer.publicUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <LeadEmptyState
          icon={Send}
          title={language === "es" ? "No hay ofertas" : "No offers"}
          description={language === "es" ? "Envía propiedades a este lead para generar interés" : "Send properties to this lead to generate interest"}
          actionLabel={language === "es" ? "Enviar oferta" : "Send offer"}
          actionIcon={Plus}
          onAction={() => setIsOfferDialogOpen(true)}
          actionTestId="button-send-first-offer"
        />
      )}

      {/* Generate Offer Dialog */}
      <Dialog open={isOfferDialogOpen} onOpenChange={(open) => {
        setIsOfferDialogOpen(open);
        if (!open) {
          setSelectedCondominiumId("");
          setSelectedUnitId("");
          setGeneratedOffer(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {language === "es" ? "Generar Oferta de Propiedad" : "Generate Property Offer"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Selecciona un condominio y unidad para enviar una oferta a este lead" 
                : "Select a condominium and unit to send an offer to this lead"}
            </DialogDescription>
          </DialogHeader>

          {!generatedOffer ? (
            <div className="space-y-4">
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
                  data-testid="select-condominium-for-offer"
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
                  emptyMessage={language === "es" ? "No hay unidades disponibles" : "No available units"}
                  disabled={!selectedCondominiumId || isLoadingUnits}
                  data-testid="select-unit-for-offer"
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
                      {selectedUnit.price && (
                        <div className="text-right">
                          <p className="font-medium text-sm text-primary">
                            ${Number(selectedUnit.price).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">/mes</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsOfferDialogOpen(false)}>
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button 
                  onClick={() => generateOfferMutation.mutate(selectedUnitId)}
                  disabled={!selectedUnitId || generateOfferMutation.isPending}
                  data-testid="button-confirm-generate-offer"
                >
                  {generateOfferMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {language === "es" ? "Generar Oferta" : "Generate Offer"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-green-700 dark:text-green-300">
                  {language === "es" ? "Oferta generada exitosamente" : "Offer generated successfully"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedOffer.publicUrl)}
                >
                  {copiedLink ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {language === "es" ? "Copiar Enlace" : "Copy Link"}
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => shareViaWhatsApp(generatedOffer.publicUrl, generatedOffer.unitNumber)}
                >
                  <SiWhatsapp className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>

              <DialogFooter>
                <Button onClick={() => {
                  setIsOfferDialogOpen(false);
                  setGeneratedOffer(null);
                  setSelectedCondominiumId("");
                  setSelectedUnitId("");
                }}>
                  {language === "es" ? "Cerrar" : "Close"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
