import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Clock, User, DollarSign, Calendar, Home, ArrowLeftRight, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Offer, Property, User as UserType } from "@shared/schema";

interface OfferWithDetails extends Offer {
  property: Property;
  client: UserType;
}

export default function OwnerOffers() {
  const [selectedOffer, setSelectedOffer] = useState<OfferWithDetails | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [counterOfferDialogOpen, setCounterOfferDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [counterOfferAmount, setCounterOfferAmount] = useState("");
  const [counterOfferNotes, setCounterOfferNotes] = useState("");
  const [servicesIncluded, setServicesIncluded] = useState<string[]>([]);
  const [servicesExcluded, setServicesExcluded] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: offers = [], isLoading } = useQuery<OfferWithDetails[]>({
    queryKey: ["/api/owner/offers"],
  });

  const acceptMutation = useMutation({
    mutationFn: (offerId: string) => 
      apiRequest("PATCH", `/api/owner/offers/${offerId}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/offers"] });
      toast({
        title: "Oferta aceptada",
        description: "La oferta ha sido aceptada exitosamente",
      });
      setSelectedOffer(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo aceptar la oferta",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ offerId, reason }: { offerId: string; reason: string }) => 
      apiRequest("PATCH", `/api/owner/offers/${offerId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/offers"] });
      toast({
        title: "Oferta rechazada",
        description: "La oferta ha sido rechazada exitosamente",
      });
      setRejectDialogOpen(false);
      setSelectedOffer(null);
      setRejectReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar la oferta",
        variant: "destructive",
      });
    },
  });

  const counterOfferMutation = useMutation({
    mutationFn: (data: {
      offerId: string;
      counterOfferAmount?: string;
      counterOfferServicesIncluded?: string[];
      counterOfferServicesExcluded?: string[];
      counterOfferNotes?: string;
    }) => apiRequest("POST", `/api/owner/offers/${data.offerId}/counter-offer`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/offers"] });
      toast({
        title: "Contraoferta enviada",
        description: "Tu contraoferta ha sido enviada al cliente",
      });
      setCounterOfferDialogOpen(false);
      setSelectedOffer(null);
      setCounterOfferAmount("");
      setCounterOfferNotes("");
      setServicesIncluded([]);
      setServicesExcluded([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la contraoferta",
        variant: "destructive",
      });
    },
  });

  const handleAccept = (offer: OfferWithDetails) => {
    if (offer.status === 'countered' && offer.lastOfferedBy === 'owner') {
      toast({
        title: "No disponible",
        description: "No puedes aceptar tu propia contraoferta. Espera la respuesta del cliente.",
        variant: "destructive",
      });
      return;
    }
    acceptMutation.mutate(offer.id);
  };

  const handleReject = () => {
    if (selectedOffer) {
      rejectMutation.mutate({ offerId: selectedOffer.id, reason: rejectReason });
    }
  };

  const handleCounterOffer = () => {
    if (selectedOffer) {
      counterOfferMutation.mutate({
        offerId: selectedOffer.id,
        counterOfferAmount: counterOfferAmount || undefined,
        counterOfferServicesIncluded: servicesIncluded.length > 0 ? servicesIncluded : undefined,
        counterOfferServicesExcluded: servicesExcluded.length > 0 ? servicesExcluded : undefined,
        counterOfferNotes: counterOfferNotes || undefined,
      });
    }
  };

  const openCounterOfferDialog = (offer: OfferWithDetails) => {
    setSelectedOffer(offer);
    setCounterOfferAmount(offer.counterOfferAmount || offer.offerAmount || "");
    setServicesIncluded((offer.counterOfferServicesIncluded as string[]) || (offer.includedServices as string[]) || []);
    setServicesExcluded((offer.counterOfferServicesExcluded as string[]) || (offer.notIncludedServices as string[]) || []);
    setCounterOfferDialogOpen(true);
  };

  const getStatusBadge = (status: string, lastOfferedBy?: string | null) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500" data-testid={`badge-status-pending`}>Pendiente</Badge>;
      case "countered":
        return (
          <Badge className="bg-blue-500" data-testid={`badge-status-countered`}>
            Contraoferta {lastOfferedBy === 'owner' ? '(Tuya)' : '(Cliente)'}
          </Badge>
        );
      case "accepted":
        return <Badge className="bg-green-500" data-testid={`badge-status-accepted`}>Aceptada</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid={`badge-status-rejected`}>Rechazada</Badge>;
      default:
        return <Badge data-testid={`badge-status-${status}`}>{status}</Badge>;
    }
  };

  const canTakeAction = (offer: OfferWithDetails) => {
    if (offer.status === 'accepted' || offer.status === 'rejected') return false;
    if (offer.status === 'countered' && offer.lastOfferedBy === 'owner') return false;
    if ((offer.negotiationRound || 0) >= 3) return false;
    return true;
  };

  const pendingOffers = offers.filter(o => o.status === 'pending');
  const counteredOffers = offers.filter(o => o.status === 'countered');
  const acceptedOffers = offers.filter(o => o.status === 'accepted');
  const rejectedOffers = offers.filter(o => o.status === 'rejected');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando ofertas...</p>
        </div>
      </div>
    );
  }

  const renderOfferCard = (offer: OfferWithDetails) => (
    <Card key={offer.id} className="mb-4" data-testid={`card-offer-${offer.id}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              {offer.property.title || 'Sin título'}
            </CardTitle>
            <CardDescription>
              Cliente: {offer.client.firstName} {offer.client.lastName}
            </CardDescription>
          </div>
          {getStatusBadge(offer.status, offer.lastOfferedBy)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Monto Ofertado</p>
              <p className="text-lg font-bold" data-testid={`text-offer-amount-${offer.id}`}>
                ${offer.offerAmount}
              </p>
            </div>
          </div>
          {offer.counterOfferAmount && (
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Contraoferta</p>
                <p className="text-lg font-bold" data-testid={`text-counter-amount-${offer.id}`}>
                  ${offer.counterOfferAmount}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Fecha de Ingreso</p>
              <p className="text-sm">
                {offer.moveInDate ? format(new Date(offer.moveInDate), "dd/MM/yyyy", { locale: es }) : "No especificada"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Duración del Contrato</p>
              <p className="text-sm">{offer.contractDuration || "No especificada"}</p>
            </div>
          </div>
        </div>

        {offer.negotiationRound && offer.negotiationRound > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">
              Ronda de negociación: {offer.negotiationRound} de 3
            </p>
          </div>
        )}

        {offer.counterOfferNotes && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">Notas de la contraoferta:</p>
            <p className="text-sm">{offer.counterOfferNotes}</p>
          </div>
        )}

        {canTakeAction(offer) && (
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => handleAccept(offer)} 
              disabled={acceptMutation.isPending}
              className="flex-1"
              data-testid={`button-accept-${offer.id}`}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aceptar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => openCounterOfferDialog(offer)}
              disabled={counterOfferMutation.isPending}
              className="flex-1"
              data-testid={`button-counter-${offer.id}`}
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Contraofertar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setSelectedOffer(offer);
                setRejectDialogOpen(true);
              }}
              disabled={rejectMutation.isPending}
              data-testid={`button-reject-${offer.id}`}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
          </div>
        )}

        {!canTakeAction(offer) && offer.status !== 'accepted' && offer.status !== 'rejected' && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {offer.lastOfferedBy === 'owner' 
                ? "Esperando respuesta del cliente..." 
                : "Límite de rondas alcanzado"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Ofertas de Renta Recibidas</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona las ofertas de renta para tus propiedades
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" data-testid="tab-all">
            Todas ({offers.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes ({pendingOffers.length})
          </TabsTrigger>
          <TabsTrigger value="countered" data-testid="tab-countered">
            Contraoferta ({counteredOffers.length})
          </TabsTrigger>
          <TabsTrigger value="accepted" data-testid="tab-accepted">
            Aceptadas ({acceptedOffers.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rechazadas ({rejectedOffers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {offers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Home className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No has recibido ofertas aún</p>
              </CardContent>
            </Card>
          ) : (
            offers.map(renderOfferCard)
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {pendingOffers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay ofertas pendientes</p>
              </CardContent>
            </Card>
          ) : (
            pendingOffers.map(renderOfferCard)
          )}
        </TabsContent>

        <TabsContent value="countered" className="mt-6">
          {counteredOffers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay contraoferta activas</p>
              </CardContent>
            </Card>
          ) : (
            counteredOffers.map(renderOfferCard)
          )}
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          {acceptedOffers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay ofertas aceptadas</p>
              </CardContent>
            </Card>
          ) : (
            acceptedOffers.map(renderOfferCard)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {rejectedOffers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay ofertas rechazadas</p>
              </CardContent>
            </Card>
          ) : (
            rejectedOffers.map(renderOfferCard)
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent data-testid="dialog-reject">
          <DialogHeader>
            <DialogTitle>Rechazar Oferta</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas rechazar esta oferta? Puedes proporcionar una razón opcional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reject-reason">Razón (opcional)</Label>
              <Textarea
                id="reject-reason"
                data-testid="textarea-reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explica por qué rechazas esta oferta..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason("");
              }}
              data-testid="button-cancel-reject"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              Rechazar Oferta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Counter Offer Dialog */}
      <Dialog open={counterOfferDialogOpen} onOpenChange={setCounterOfferDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-counter-offer">
          <DialogHeader>
            <DialogTitle>Enviar Contraoferta</DialogTitle>
            <DialogDescription>
              Modifica el monto de renta y los servicios incluidos/excluidos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="counter-amount">Monto de Renta (MXN)</Label>
              <Input
                id="counter-amount"
                data-testid="input-counter-amount"
                type="number"
                value={counterOfferAmount}
                onChange={(e) => setCounterOfferAmount(e.target.value)}
                placeholder="Ingresa el nuevo monto"
              />
            </div>

            <div>
              <Label>Servicios Incluidos</Label>
              <div className="space-y-2 mt-2">
                {["Agua", "Luz", "Gas", "Internet", "Mantenimiento"].map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={`included-${service}`}
                      data-testid={`checkbox-included-${service.toLowerCase()}`}
                      checked={servicesIncluded.includes(service)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setServicesIncluded([...servicesIncluded, service]);
                          setServicesExcluded(servicesExcluded.filter(s => s !== service));
                        } else {
                          setServicesIncluded(servicesIncluded.filter(s => s !== service));
                        }
                      }}
                    />
                    <Label htmlFor={`included-${service}`}>{service}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Servicios Excluidos (paga el inquilino)</Label>
              <div className="space-y-2 mt-2">
                {["Agua", "Luz", "Gas", "Internet", "Mantenimiento"].map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={`excluded-${service}`}
                      data-testid={`checkbox-excluded-${service.toLowerCase()}`}
                      checked={servicesExcluded.includes(service)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setServicesExcluded([...servicesExcluded, service]);
                          setServicesIncluded(servicesIncluded.filter(s => s !== service));
                        } else {
                          setServicesExcluded(servicesExcluded.filter(s => s !== service));
                        }
                      }}
                    />
                    <Label htmlFor={`excluded-${service}`}>{service}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="counter-notes">Notas (opcional)</Label>
              <Textarea
                id="counter-notes"
                data-testid="textarea-counter-notes"
                value={counterOfferNotes}
                onChange={(e) => setCounterOfferNotes(e.target.value)}
                placeholder="Agrega notas o comentarios sobre la contraoferta..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCounterOfferDialogOpen(false);
                setCounterOfferAmount("");
                setCounterOfferNotes("");
                setServicesIncluded([]);
                setServicesExcluded([]);
              }}
              data-testid="button-cancel-counter"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCounterOffer}
              disabled={counterOfferMutation.isPending}
              data-testid="button-confirm-counter"
            >
              Enviar Contraoferta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
