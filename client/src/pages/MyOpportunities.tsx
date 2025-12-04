import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  DollarSign, 
  Zap,
} from "lucide-react";
import { type RentalOpportunityRequest, type Property, type Appointment, type Offer, type User as UserType } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MyOpportunities() {
  const { toast } = useToast();

  // Visited properties with appointments
  type VisitedPropertyWithAppointment = Property & {
    appointment: Appointment;
  };

  const { data: visitedProperties = [], isLoading: visitedLoading } = useQuery<VisitedPropertyWithAppointment[]>({
    queryKey: ["/api/client/visited-properties"],
  });

  const { data: rentalRequests = [], isLoading: rentalRequestsLoading } = useQuery<RentalOpportunityRequest[]>({
    queryKey: ["/api/rental-opportunity-requests"],
  });

  interface OfferWithDetails extends Offer {
    property?: Property;
    owner?: UserType;
  }

  const { data: myOffers = [], isLoading: offersLoading } = useQuery<OfferWithDetails[]>({
    queryKey: ["/api/client/my-offers"],
  });

  const createRentalRequestMutation = useMutation({
    mutationFn: async (data: { propertyId: string; appointmentId: string }) => {
      return await apiRequest("POST", "/api/rental-opportunity-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey.some(key => key === "/api/rental-opportunity-requests")
      });
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de oportunidad ha sido enviada al administrador",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud",
        variant: "destructive",
      });
    },
  });

  if (visitedLoading && offersLoading && rentalRequestsLoading) {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-bold">Mis Oportunidades</h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Revisa las propiedades que has visitado y gestiona tus ofertas de renta
        </p>
      </div>

      <Tabs defaultValue="visited" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="visited" className="min-h-[44px] text-xs sm:text-sm py-2 px-2 sm:px-4" data-testid="tab-visited">
            <CheckCircle2 className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">Visitadas</span>
          </TabsTrigger>
          <TabsTrigger value="my-offers" className="min-h-[44px] text-xs sm:text-sm py-2 px-2 sm:px-4" data-testid="tab-my-offers">
            <DollarSign className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">Mis Ofertas</span>
          </TabsTrigger>
        </TabsList>

        {/* Propiedades Visitadas */}
        <TabsContent value="visited" className="mt-6">
          {visitedLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : visitedProperties.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No has visitado ninguna propiedad aún
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Programa citas para visitar propiedades y luego podrás solicitar oportunidades de renta aquí
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visitedProperties.map((property) => {
                const request = rentalRequests.find(req => req.propertyId === property.id);
                const canRequest = !request || request.status === 'rejected';
                
                return (
                  <Card key={property.id} className="hover-elevate" data-testid={`card-visited-${property.id}`}>
                    <CardHeader>
                      <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted mb-3">
                        {property.primaryImages && property.primaryImages.length > 0 ? (
                          <img 
                            src={property.primaryImages[0]} 
                            alt={property.title}
                            className="h-full w-full object-cover"
                            data-testid={`img-visited-${property.id}`}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <MapPin className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-lg" data-testid={`text-title-${property.id}`}>
                        {property.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {property.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Visitada: {format(new Date(property.appointment.appointmentDate), "dd 'de' MMMM, yyyy", { locale: es })}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Tipo: {property.appointment.type === 'individual' ? 'Individual' : 'Tour'}</span>
                        </div>
                      </div>

                      {request && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Estado:</span>
                            <Badge variant={
                              request.status === 'pending' ? 'secondary' : 
                              request.status === 'approved' ? 'default' : 
                              'destructive'
                            }>
                              {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {request.status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {request.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                              {request.status === 'pending' ? 'Pendiente' : request.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                            </Badge>
                          </div>
                          {request.rejectionReason && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Razón: {request.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {canRequest ? (
                          <Button 
                            className="w-full min-h-[44px] text-sm" 
                            onClick={() => createRentalRequestMutation.mutate({ propertyId: property.id, appointmentId: property.appointment.id })}
                            disabled={createRentalRequestMutation.isPending}
                            data-testid={`button-request-${property.id}`}
                          >
                            {request?.status === 'rejected' ? 'Solicitar Nuevamente' : 'Solicitar Oportunidad'}
                          </Button>
                        ) : request?.status === 'approved' ? (
                          <Button 
                            className="w-full min-h-[44px] text-sm" 
                            onClick={() => window.location.href = `/rental-offer/${property.id}?requestId=${request.id}`}
                            data-testid={`button-create-offer-${property.id}`}
                          >
                            Crear Oferta de Renta
                          </Button>
                        ) : (
                          <Button 
                            className="w-full min-h-[44px] text-sm" 
                            variant="outline"
                            disabled
                            data-testid={`button-pending-${property.id}`}
                          >
                            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">Esperando Aprobación</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Mis Ofertas */}
        <TabsContent value="my-offers" className="mt-6">
          {offersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : myOffers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No has enviado ofertas aún
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Solicita oportunidades de renta para las propiedades visitadas y envía ofertas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myOffers.map((offer) => {
                const isMyTurn = offer.status === 'countered' && offer.lastOfferedBy === 'owner';
                const canAcceptReject = isMyTurn;
                const canCounterOffer = isMyTurn && (offer.negotiationRound || 0) < 3;
                
                return (
                  <Card key={offer.id} className="hover-elevate" data-testid={`card-offer-${offer.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {offer.property?.title || 'Propiedad'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {offer.property?.location}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          offer.status === 'pending' ? 'secondary' :
                          offer.status === 'countered' ? 'default' :
                          offer.status === 'accepted' ? 'default' :
                          'destructive'
                        } data-testid={`badge-status-${offer.id}`}>
                          {offer.status === 'pending' && 'Pendiente'}
                          {offer.status === 'countered' && `Contraoferta ${offer.lastOfferedBy === 'owner' ? '(Propietario)' : '(Tuya)'}`}
                          {offer.status === 'accepted' && 'Aceptada'}
                          {offer.status === 'rejected' && 'Rechazada'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Monto Ofertado</p>
                          <p className="text-lg font-bold" data-testid={`text-amount-${offer.id}`}>
                            ${offer.offerAmount}
                          </p>
                        </div>
                        {offer.counterOfferAmount && (
                          <div>
                            <p className="text-sm text-muted-foreground">Contraoferta</p>
                            <p className="text-lg font-bold text-primary" data-testid={`text-counter-${offer.id}`}>
                              ${offer.counterOfferAmount}
                            </p>
                          </div>
                        )}
                      </div>

                      {offer.negotiationRound && offer.negotiationRound > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <Clock className="h-4 w-4" />
                          <p className="text-sm">Ronda de negociación: {offer.negotiationRound} de 3</p>
                        </div>
                      )}

                      {offer.counterOfferNotes && (
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium mb-1">Notas del propietario:</p>
                          <p className="text-sm">{offer.counterOfferNotes}</p>
                        </div>
                      )}

                      {isMyTurn && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                            El propietario envió una contraoferta. Es tu turno de responder.
                          </p>
                        </div>
                      )}

                      {offer.status === 'accepted' && (
                        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md">
                          <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                            ¡Oferta aceptada! El propietario se pondrá en contacto contigo.
                          </p>
                        </div>
                      )}

                      {offer.status === 'rejected' && offer.notes && (
                        <div className="p-3 bg-red-50 dark:bg-red-950 rounded-md">
                          <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">
                            Oferta rechazada
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            Razón: {offer.notes}
                          </p>
                        </div>
                      )}

                      {canAcceptReject && (
                        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                          <Button 
                            variant="default" 
                            className="flex-1 min-h-[44px] text-sm"
                            onClick={() => {
                              apiRequest("PATCH", `/api/client/offers/${offer.id}/accept-counter`, {})
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: ["/api/client/my-offers"] });
                                  toast({ title: "Contraoferta aceptada", description: "Has aceptado la contraoferta del propietario" });
                                })
                                .catch((error: any) => {
                                  toast({ title: "Error", description: error.message || "No se pudo aceptar la contraoferta", variant: "destructive" });
                                });
                            }}
                            data-testid={`button-accept-counter-${offer.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">Aceptar Contraoferta</span>
                          </Button>
                          {canCounterOffer && (
                            <Button 
                              variant="outline"
                              className="min-h-[44px] text-sm"
                              onClick={() => {
                                const amount = prompt(`Contraoferta al propietario (monto actual: $${offer.counterOfferAmount || offer.offerAmount}):`);
                                if (amount && !isNaN(Number(amount))) {
                                  const notes = prompt("Notas opcionales para el propietario:");
                                  apiRequest("POST", `/api/client/offers/${offer.id}/counter-offer`, { 
                                    counterOfferAmount: Number(amount),
                                    counterOfferNotes: notes || undefined 
                                  })
                                    .then(() => {
                                      queryClient.invalidateQueries({ queryKey: ["/api/client/my-offers"] });
                                      toast({ title: "Contraoferta enviada", description: "Tu contraoferta ha sido enviada al propietario" });
                                    })
                                    .catch((error: any) => {
                                      toast({ title: "Error", description: error.message || "No se pudo enviar la contraoferta", variant: "destructive" });
                                    });
                                }
                              }}
                              data-testid={`button-counter-${offer.id}`}
                            >
                              <span className="truncate">Enviar Contraoferta</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
