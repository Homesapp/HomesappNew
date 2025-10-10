import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleVisitDialog } from "@/components/ScheduleVisitDialog";
import { MakeOfferDialog } from "@/components/MakeOfferDialog";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Video, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  DollarSign, 
  MessageSquare, 
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  User,
  Zap,
  Star,
} from "lucide-react";
import { type RentalOpportunityRequest, type Property, type Appointment, type Offer, type User as UserType } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SORWithDetails extends RentalOpportunityRequest {
  property?: Property;
  appointment?: Appointment;
  offer?: Offer;
}

interface PropertyRecommendation {
  id: string;
  propertyId: string;
  sellerId: string;
  presentationCardId: string | null;
  message: string | null;
  isRead: boolean;
  isInterested: boolean | null;
  createdAt: string;
  property: Property | null;
  seller: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  } | null;
}

interface AutoSuggestion {
  id: string;
  propertyId: string;
  presentationCardId: string;
  matchScore: number | null;
  matchReasons: string[] | null;
  isRead: boolean;
  isInterested: boolean | null;
  createdAt: string;
  property: Property | null;
}

export default function MyOpportunities() {
  const [selectedSOR, setSelectedSOR] = useState<SORWithDetails | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const { toast } = useToast();

  const { data: sors = [], isLoading: sorsLoading } = useQuery<SORWithDetails[]>({
    queryKey: ["/api/my-rental-opportunities"],
  });

  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery<PropertyRecommendation[]>({
    queryKey: ["/api/my-property-recommendations"],
  });

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<AutoSuggestion[]>({
    queryKey: ["/api/my-auto-suggestions"],
  });

  // New queries for visited properties and rental opportunity requests
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

  const setRecommendationInterest = useMutation({
    mutationFn: async ({ id, isInterested }: { id: string; isInterested: boolean }) => {
      return apiRequest("PATCH", `/api/property-recommendations/${id}/set-interest`, { isInterested });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-property-recommendations"] });
      toast({
        title: "Preferencia guardada",
        description: "Tu respuesta ha sido registrada",
      });
    },
  });

  const setSuggestionInterest = useMutation({
    mutationFn: async ({ id, isInterested }: { id: string; isInterested: boolean }) => {
      return apiRequest("PATCH", `/api/auto-suggestions/${id}/set-interest`, { isInterested });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-auto-suggestions"] });
      toast({
        title: "Preferencia guardada",
        description: "Tu respuesta ha sido registrada",
      });
    },
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "secondary" as const, icon: Clock },
      scheduled_visit: { label: "Visita Programada", variant: "default" as const, icon: Calendar },
      visit_completed: { label: "Visita Completada", variant: "default" as const, icon: CheckCircle2 },
      offer_submitted: { label: "Oferta Enviada", variant: "default" as const, icon: DollarSign },
      offer_negotiation: { label: "En Negociación", variant: "default" as const, icon: MessageSquare },
      offer_accepted: { label: "Oferta Aceptada", variant: "default" as const, icon: CheckCircle2 },
      accepted: { label: "Aceptada", variant: "default" as const, icon: CheckCircle2 },
      rejected: { label: "Rechazada", variant: "destructive" as const, icon: XCircle },
      expired: { label: "Expirada", variant: "secondary" as const, icon: XCircle },
      cancelled: { label: "Cancelada", variant: "secondary" as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleScheduleVisit = (sor: SORWithDetails) => {
    setSelectedSOR(sor);
    setShowScheduleDialog(true);
  };

  const handleMakeOffer = (sor: SORWithDetails) => {
    setSelectedSOR(sor);
    setShowOfferDialog(true);
  };

  if (sorsLoading && recommendationsLoading && suggestionsLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const unreadRecommendations = recommendations.filter(r => !r.isRead).length;
  const unreadSuggestions = suggestions.filter(s => !s.isRead).length;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Mis Oportunidades</h1>
        </div>
        <p className="text-muted-foreground">
          Revisa las recomendaciones personalizadas, sugerencias automáticas y tus solicitudes activas
        </p>
      </div>

      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="visited" data-testid="tab-visited">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Visitadas
          </TabsTrigger>
          <TabsTrigger value="my-offers" data-testid="tab-my-offers">
            <DollarSign className="h-4 w-4 mr-2" />
            Mis Ofertas
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="relative" data-testid="tab-recommendations">
            <User className="h-4 w-4 mr-2" />
            Recomendaciones
            {unreadRecommendations > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {unreadRecommendations}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="relative" data-testid="tab-suggestions">
            <Sparkles className="h-4 w-4 mr-2" />
            Sugerencias
            {unreadSuggestions > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {unreadSuggestions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sors" data-testid="tab-sors">
            <Calendar className="h-4 w-4 mr-2" />
            Mis Solicitudes
          </TabsTrigger>
        </TabsList>

        {/* Propiedades Visitadas - New Tab */}
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
                            className="w-full" 
                            onClick={() => createRentalRequestMutation.mutate({ propertyId: property.id, appointmentId: property.appointment.id })}
                            disabled={createRentalRequestMutation.isPending}
                            data-testid={`button-request-${property.id}`}
                          >
                            {request?.status === 'rejected' ? 'Solicitar Nuevamente' : 'Solicitar Oportunidad'}
                          </Button>
                        ) : request?.status === 'approved' ? (
                          <Button 
                            className="w-full" 
                            onClick={() => window.location.href = `/rental-offer/${property.id}?requestId=${request.id}`}
                            data-testid={`button-create-offer-${property.id}`}
                          >
                            Crear Oferta de Renta
                          </Button>
                        ) : (
                          <Button 
                            className="w-full" 
                            variant="outline"
                            disabled
                            data-testid={`button-pending-${property.id}`}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Esperando Aprobación
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
                const canAcceptReject = isMyTurn; // Can accept/reject when it's client's turn
                const canCounterOffer = isMyTurn && (offer.negotiationRound || 0) < 3; // Can counter-offer only if under round limit
                
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
                        <div className="flex gap-2 pt-2 border-t">
                          <Button 
                            variant="default" 
                            className="flex-1"
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
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Aceptar Contraoferta
                          </Button>
                          {canCounterOffer && (
                            <Button 
                              variant="outline"
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
                              data-testid={`button-counter-back-${offer.id}`}
                            >
                              Contraofertar
                            </Button>
                          )}
                          <Button 
                            variant="destructive"
                            onClick={() => {
                              const reason = prompt("¿Por qué rechazas esta contraoferta? (opcional)");
                              apiRequest("PATCH", `/api/client/offers/${offer.id}/reject-counter`, { reason: reason || undefined })
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: ["/api/client/my-offers"] });
                                  toast({ title: "Contraoferta rechazada", description: "Has rechazado la contraoferta" });
                                })
                                .catch((error: any) => {
                                  toast({ title: "Error", description: error.message || "No se pudo rechazar la contraoferta", variant: "destructive" });
                                });
                            }}
                            data-testid={`button-reject-counter-${offer.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rechazar
                          </Button>
                        </div>
                      )}

                      {!canAcceptReject && offer.status === 'countered' && offer.lastOfferedBy === 'client' && (
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground">
                            Esperando respuesta del propietario...
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Recomendaciones de Vendedores */}
        <TabsContent value="recommendations" className="mt-6">
          {recommendationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : recommendations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No tienes recomendaciones de vendedores aún
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {recommendations.map((rec) => (
                <Card key={rec.id} className={!rec.isRead ? "border-primary" : ""} data-testid={`card-recommendation-${rec.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">
                            {rec.property?.title || "Propiedad"}
                          </CardTitle>
                          {!rec.isRead && (
                            <Badge variant="default">Nuevo</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>{rec.property?.location}</span>
                        </div>
                        {rec.seller && (
                          <div className="mt-2 flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              Recomendado por: <span className="font-medium">
                                {rec.seller.firstName} {rec.seller.lastName}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                      {rec.property && (
                        <div className="text-right">
                          <Badge variant="default" className="text-lg">
                            ${parseFloat(rec.property.price).toLocaleString()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {rec.message && (
                      <div className="p-4 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Mensaje del vendedor:</p>
                        <p className="text-sm">{rec.message}</p>
                      </div>
                    )}

                    {rec.property && (
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>{rec.property.bedrooms} hab</span>
                        <span>{rec.property.bathrooms} baños</span>
                        <span>{rec.property.area} m²</span>
                        <span className="capitalize">{rec.property.propertyType}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {rec.isInterested === null && (
                        <>
                          <Button
                            variant="default"
                            onClick={() => setRecommendationInterest.mutate({ id: rec.id, isInterested: true })}
                            disabled={setRecommendationInterest.isPending}
                            data-testid={`button-interested-${rec.id}`}
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Me interesa
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setRecommendationInterest.mutate({ id: rec.id, isInterested: false })}
                            disabled={setRecommendationInterest.isPending}
                            data-testid={`button-not-interested-${rec.id}`}
                          >
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            No me interesa
                          </Button>
                        </>
                      )}
                      {rec.isInterested !== null && (
                        <Badge variant={rec.isInterested ? "default" : "secondary"}>
                          {rec.isInterested ? "Te interesa" : "No te interesa"}
                        </Badge>
                      )}
                      {rec.property && (
                        <Button
                          variant="outline"
                          onClick={() => window.location.href = `/propiedad/${rec.property.id}/completo`}
                          data-testid={`button-view-property-${rec.id}`}
                        >
                          Ver propiedad
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sugerencias Automáticas */}
        <TabsContent value="suggestions" className="mt-6">
          {suggestionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : suggestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No hay sugerencias automáticas disponibles
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Activa una tarjeta de presentación para recibir sugerencias personalizadas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {suggestions.map((sug) => (
                <Card key={sug.id} className={!sug.isRead ? "border-primary" : ""} data-testid={`card-suggestion-${sug.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">
                            {sug.property?.title || "Propiedad"}
                          </CardTitle>
                          {!sug.isRead && (
                            <Badge variant="default">Nuevo</Badge>
                          )}
                          {sug.matchScore && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              {sug.matchScore}% coincidencia
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>{sug.property?.location}</span>
                        </div>
                      </div>
                      {sug.property && (
                        <div className="text-right">
                          <Badge variant="default" className="text-lg">
                            ${parseFloat(sug.property.price).toLocaleString()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {sug.matchReasons && sug.matchReasons.length > 0 && (
                      <div className="p-4 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-2">Por qué coincide:</p>
                        <ul className="space-y-1">
                          {sug.matchReasons.map((reason, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {sug.property && (
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>{sug.property.bedrooms} hab</span>
                        <span>{sug.property.bathrooms} baños</span>
                        <span>{sug.property.area} m²</span>
                        <span className="capitalize">{sug.property.propertyType}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {sug.isInterested === null && (
                        <>
                          <Button
                            variant="default"
                            onClick={() => setSuggestionInterest.mutate({ id: sug.id, isInterested: true })}
                            disabled={setSuggestionInterest.isPending}
                            data-testid={`button-interested-${sug.id}`}
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Me interesa
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setSuggestionInterest.mutate({ id: sug.id, isInterested: false })}
                            disabled={setSuggestionInterest.isPending}
                            data-testid={`button-not-interested-${sug.id}`}
                          >
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            No me interesa
                          </Button>
                        </>
                      )}
                      {sug.isInterested !== null && (
                        <Badge variant={sug.isInterested ? "default" : "secondary"}>
                          {sug.isInterested ? "Te interesa" : "No te interesa"}
                        </Badge>
                      )}
                      {sug.property && (
                        <Button
                          variant="outline"
                          onClick={() => window.location.href = `/propiedad/${sug.property.id}/completo`}
                          data-testid={`button-view-property-${sug.id}`}
                        >
                          Ver propiedad
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Mis Solicitudes (SORs) */}
        <TabsContent value="sors" className="mt-6">
          {sorsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sors.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No tienes solicitudes de oportunidad de renta activas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sors.map((sor) => (
                <Card key={sor.id} data-testid={`card-sor-${sor.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {sor.property?.title || "Propiedad"}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{sor.property?.location}</span>
                        </div>
                      </div>
                      {getStatusBadge(sor.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {sor.desiredMoveInDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Fecha deseada de mudanza:</span>
                        <span className="font-medium">
                          {format(new Date(sor.desiredMoveInDate), "dd 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                    )}

                    {sor.preferredContactMethod && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Método de contacto preferido:</span>
                        <Badge variant="outline">{sor.preferredContactMethod}</Badge>
                      </div>
                    )}

                    {sor.notes && (
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">Notas:</p>
                        <p className="text-foreground">{sor.notes}</p>
                      </div>
                    )}

                    {sor.status === "scheduled_visit" && sor.appointment && (
                      <div className="bg-muted p-4 rounded-md space-y-2">
                        <p className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          Visita Programada
                        </p>
                        <div className="text-sm space-y-1">
                          <p>
                            Fecha: {format(new Date(sor.appointment.date), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                          </p>
                          <p className="flex items-center gap-2">
                            Tipo: {sor.appointment.type === "video" ? (
                              <>
                                <Video className="h-4 w-4" />
                                <span>Virtual</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="h-4 w-4" />
                                <span>Presencial</span>
                              </>
                            )}
                          </p>
                          {sor.appointment.meetLink && (
                            <div className="pt-2">
                              <a
                                href={sor.appointment.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-2"
                                data-testid="link-meet"
                              >
                                <Video className="h-4 w-4" />
                                Unirse a la reunión de Google Meet
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {sor.status === "pending" && (
                      <Button
                        onClick={() => handleScheduleVisit(sor)}
                        className="w-full"
                        data-testid="button-schedule-visit"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar Visita
                      </Button>
                    )}

                    {(sor.status === "visit_completed" || sor.status === "scheduled_visit") && (
                      <Button
                        onClick={() => handleMakeOffer(sor)}
                        className="w-full"
                        data-testid="button-make-offer"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Hacer Oferta
                      </Button>
                    )}

                    {(sor.status === "offer_submitted" || sor.status === "offer_negotiation" || sor.status === "offer_accepted") && sor.offer && (
                      <div className="bg-muted p-4 rounded-md space-y-3">
                        <p className="font-medium flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          Tu Oferta
                        </p>
                        <div className="text-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Monto ofrecido:</span>
                            <span className="font-semibold text-lg">${parseFloat(sor.offer.offerAmount).toLocaleString()}</span>
                          </div>
                          {sor.offer.counterOfferAmount && (
                            <div className="flex items-center justify-between border-t pt-2">
                              <span className="text-muted-foreground">Contraoferta:</span>
                              <span className="font-semibold text-lg text-primary">${parseFloat(sor.offer.counterOfferAmount).toLocaleString()}</span>
                            </div>
                          )}
                          {sor.offer.notes && (
                            <div className="border-t pt-2">
                              <p className="text-muted-foreground mb-1">Tus notas:</p>
                              <p className="text-foreground">{sor.offer.notes}</p>
                            </div>
                          )}
                          {sor.offer.counterOfferNotes && (
                            <div className="border-t pt-2">
                              <p className="text-muted-foreground mb-1">Respuesta del propietario:</p>
                              <p className="text-foreground">{sor.offer.counterOfferNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedSOR && (
        <>
          <ScheduleVisitDialog
            open={showScheduleDialog}
            onOpenChange={setShowScheduleDialog}
            sorId={selectedSOR.id}
            propertyTitle={selectedSOR.property?.title || "Propiedad"}
          />
          <MakeOfferDialog
            open={showOfferDialog}
            onOpenChange={setShowOfferDialog}
            sorId={selectedSOR.id}
            propertyPrice={selectedSOR.property?.price || "0"}
            propertyTitle={selectedSOR.property?.title || "Propiedad"}
          />
        </>
      )}
    </div>
  );
}
