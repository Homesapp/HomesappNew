import { useState } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Building2,
  DollarSign,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Loader2,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalLead } from "@shared/schema";

interface LeadOffersSectionProps {
  lead: ExternalLead;
}

export default function LeadOffersSection({ lead }: LeadOffersSectionProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
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

  const { data: units } = useQuery<{ data: any[] }>({
    queryKey: ["/api/external-units"],
    queryFn: async () => {
      const res = await fetch("/api/external-units?status=disponible&limit=100", { credentials: 'include' });
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

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
          {language === "es" ? "Propiedades Compartidas" : "Shared Properties"}
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
        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
          <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>{language === "es" ? "No hay ofertas enviadas" : "No offers sent"}</p>
        </div>
      )}

      {/* Generate Offer Dialog */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Generar Oferta de Propiedad" : "Generate Property Offer"}
            </DialogTitle>
          </DialogHeader>

          {!generatedOffer ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  {language === "es" ? "Seleccionar Unidad" : "Select Unit"}
                </label>
                <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                  <SelectTrigger data-testid="select-unit-for-offer">
                    <SelectValue placeholder={language === "es" ? "Selecciona una unidad" : "Select a unit"} />
                  </SelectTrigger>
                  <SelectContent>
                    {units?.data?.map((unit: any) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unitNumber} - {unit.condoName}
                        {unit.rentPrice && ` ($${Number(unit.rentPrice).toLocaleString()})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
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
                  {language === "es" ? "Generar" : "Generate"}
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
