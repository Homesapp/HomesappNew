import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Home,
  Plus,
  Clock,
  History,
  Activity,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowRight,
  CreditCard,
  Share2,
  DollarSign,
  Building2,
  Eye,
  ThumbsUp,
  FileText,
  Send,
  Lock,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalLead } from "@shared/schema";
import PresentationCardsTab from "./PresentationCardsTab";

interface LeadCRMTabsProps {
  lead: ExternalLead;
}

type ActivityType = "call" | "email" | "meeting" | "whatsapp" | "showing" | "note" | "status_change";
type ShowingOutcome = "interested" | "not_interested" | "pending" | "cancelled";

const ACTIVITY_ICONS: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  whatsapp: MessageSquare,
  showing: Home,
  note: Activity,
  status_change: History,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  call: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  email: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  meeting: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  whatsapp: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  showing: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  note: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  status_change: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
};

const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  nuevo_lead: { es: "Nuevo Lead", en: "New Lead" },
  cita_coordinada: { es: "Cita Coordinada", en: "Appointment Scheduled" },
  interesado: { es: "Interesado", en: "Interested" },
  oferta_enviada: { es: "Oferta Enviada", en: "Offer Sent" },
  proceso_renta: { es: "Proceso de Renta", en: "Rental Process" },
  renta_concretada: { es: "Renta Concretada", en: "Rental Completed" },
  perdido: { es: "Lead Perdido", en: "Lead Lost" },
  muerto: { es: "Lead Muerto", en: "Dead Lead" },
};

export default function LeadCRMTabs({ lead }: LeadCRMTabsProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isAddShowingOpen, setIsAddShowingOpen] = useState(false);
  const [newActivityType, setNewActivityType] = useState<ActivityType>("call");
  const [newActivityNotes, setNewActivityNotes] = useState("");
  const [newShowingProperty, setNewShowingProperty] = useState("");
  const [newShowingDate, setNewShowingDate] = useState("");
  const [newShowingNotes, setNewShowingNotes] = useState("");

  const { data: activities, isLoading: activitiesLoading } = useQuery<any[]>({
    queryKey: ["/api/external-leads", lead.id, "activities"],
    queryFn: async () => {
      const response = await fetch(`/api/external-leads/${lead.id}/activities`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: showings, isLoading: showingsLoading } = useQuery<any[]>({
    queryKey: ["/api/external-leads", lead.id, "showings"],
    queryFn: async () => {
      const response = await fetch(`/api/external-leads/${lead.id}/showings`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: statusHistory, isLoading: historyLoading } = useQuery<any[]>({
    queryKey: ["/api/external-leads", lead.id, "status-history"],
    queryFn: async () => {
      const response = await fetch(`/api/external-leads/${lead.id}/status-history`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: propertyOffers, isLoading: offersLoading } = useQuery<any[]>({
    queryKey: ["/api/external-leads", lead.id, "properties-sent"],
    queryFn: async () => {
      const response = await fetch(`/api/external-leads/${lead.id}/properties-sent`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async (data: { activityType: string; title: string; description?: string }) => {
      const res = await apiRequest("POST", `/api/external-leads/${lead.id}/activities`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads", lead.id, "activities"] });
      setIsAddActivityOpen(false);
      setNewActivityNotes("");
      toast({
        title: language === "es" ? "Actividad registrada" : "Activity recorded",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        variant: "destructive",
      });
    },
  });

  const addShowingMutation = useMutation({
    mutationFn: async (data: { propertyName: string; scheduledAt: string; agentNotes?: string }) => {
      const res = await apiRequest("POST", `/api/external-leads/${lead.id}/showings`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads", lead.id, "showings"] });
      setIsAddShowingOpen(false);
      setNewShowingProperty("");
      setNewShowingDate("");
      setNewShowingNotes("");
      toast({
        title: language === "es" ? "Visita programada" : "Showing scheduled",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        variant: "destructive",
      });
    },
  });

  const getActivityLabel = (type: ActivityType) => {
    const labels: Record<ActivityType, { es: string; en: string }> = {
      call: { es: "Llamada", en: "Call" },
      email: { es: "Email", en: "Email" },
      meeting: { es: "Reunión", en: "Meeting" },
      whatsapp: { es: "WhatsApp", en: "WhatsApp" },
      showing: { es: "Visita", en: "Showing" },
      note: { es: "Nota", en: "Note" },
      status_change: { es: "Cambio de Estado", en: "Status Change" },
    };
    return labels[type]?.[language as 'es' | 'en'] || type;
  };

  const getOutcomeLabel = (outcome: ShowingOutcome) => {
    const labels: Record<ShowingOutcome, { es: string; en: string }> = {
      interested: { es: "Interesado", en: "Interested" },
      not_interested: { es: "No Interesado", en: "Not Interested" },
      pending: { es: "Pendiente", en: "Pending" },
      cancelled: { es: "Cancelado", en: "Cancelled" },
    };
    return labels[outcome]?.[language as 'es' | 'en'] || outcome;
  };

  const getOutcomeVariant = (outcome: ShowingOutcome): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<ShowingOutcome, "default" | "secondary" | "destructive" | "outline"> = {
      interested: "default",
      not_interested: "secondary",
      pending: "outline",
      cancelled: "destructive",
    };
    return variants[outcome] || "outline";
  };

  const isInterestedStatus = ["interesado", "oferta_enviada", "proceso_renta", "renta_concretada"].includes(lead.status);

  return (
    <div className="mt-4">
      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="w-full grid grid-cols-6 mb-4">
          <TabsTrigger value="cards" className="flex items-center gap-2" data-testid="tab-lead-cards">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Tarjetas" : "Cards"}</span>
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex items-center gap-2" data-testid="tab-lead-offers">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Enviadas" : "Sent"}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="rental-offers" 
            className="flex items-center gap-2" 
            disabled={!isInterestedStatus}
            data-testid="tab-lead-rental-offers"
          >
            {isInterestedStatus ? (
              <FileText className="h-4 w-4" />
            ) : (
              <Lock className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="hidden sm:inline">{language === "es" ? "Ofertas" : "Offers"}</span>
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2" data-testid="tab-lead-activities">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Actividades" : "Activities"}</span>
          </TabsTrigger>
          <TabsTrigger value="showings" className="flex items-center gap-2" data-testid="tab-lead-showings">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Visitas" : "Showings"}</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2" data-testid="tab-lead-history">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Historial" : "History"}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-4">
          <PresentationCardsTab 
            leadId={lead.id} 
            personName={`${lead.firstName} ${lead.lastName}`}
            leadPreferences={{
              estimatedRentCost: lead.estimatedRentCost,
              estimatedRentCostText: lead.estimatedRentCostText,
              bedrooms: lead.bedrooms,
              bedroomsText: lead.bedroomsText,
              desiredUnitType: lead.desiredUnitType,
              desiredNeighborhood: lead.desiredNeighborhood,
              contractDuration: lead.contractDuration,
              hasPets: lead.hasPets,
            }}
          />
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">
              {language === "es" ? "Propiedades Compartidas" : "Shared Properties"}
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {propertyOffers?.length || 0} {language === "es" ? "enviadas" : "sent"}
              </Badge>
              {lead.phone && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const phone = lead.phone?.replace(/\D/g, '');
                    window.open(`https://wa.me/${phone}`, '_blank');
                  }}
                  data-testid="button-whatsapp-lead"
                >
                  <SiWhatsapp className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>
              )}
            </div>
          </div>

          {offersLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : propertyOffers && propertyOffers.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {propertyOffers.map((offer: any) => {
                const getResponseBadge = () => {
                  if (offer.leadResponse === 'interested') return { variant: "default" as const, label: language === "es" ? "Interesado" : "Interested", icon: ThumbsUp };
                  if (offer.leadResponse === 'not_interested') return { variant: "destructive" as const, label: language === "es" ? "No interesado" : "Not Interested", icon: XCircle };
                  if (offer.leadResponse === 'visited') return { variant: "secondary" as const, label: language === "es" ? "Visitó" : "Visited", icon: Eye };
                  return null;
                };
                const responseBadge = getResponseBadge();
                return (
                  <Card key={offer.id} className="hover-elevate">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                          <SiWhatsapp className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">
                                {offer.propertyName || (language === "es" ? "Propiedad" : "Property")}
                                {offer.unitNumber && ` - ${offer.unitNumber}`}
                              </span>
                            </div>
                            {responseBadge && (
                              <Badge variant={responseBadge.variant} className="text-xs gap-1">
                                <responseBadge.icon className="h-3 w-3" />
                                {responseBadge.label}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                            {offer.zone && (
                              <span>{offer.zone}</span>
                            )}
                            {offer.rentPrice && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${Number(offer.rentPrice).toLocaleString()} {offer.currency || 'MXN'}
                              </span>
                            )}
                            {offer.bedrooms && (
                              <span>{offer.bedrooms} {language === "es" ? "rec" : "bd"}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(offer.sentAt), "d MMM yyyy HH:mm", { locale: language === "es" ? es : enUS })}
                            <span className="text-muted-foreground">
                              • {offer.sharedVia === 'whatsapp' ? 'WhatsApp' : offer.sharedVia === 'email' ? 'Email' : offer.sharedVia}
                            </span>
                          </div>
                          {offer.message && (
                            <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">"{offer.message}"</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Share2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{language === "es" ? "No se han compartido propiedades" : "No properties shared yet"}</p>
              <p className="text-xs mt-1">
                {language === "es" 
                  ? "Envía propiedades desde el catálogo para verlas aquí" 
                  : "Send properties from the catalog to see them here"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rental-offers" className="space-y-4">
          {isInterestedStatus ? (
            <>
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-sm">
                  {language === "es" ? "Ofertas de Renta" : "Rental Offers"}
                </h4>
                <Button size="sm" data-testid="button-create-rental-offer">
                  <Plus className="h-4 w-4 mr-1" />
                  {language === "es" ? "Nueva Oferta" : "New Offer"}
                </Button>
              </div>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">{language === "es" ? "Sistema de Ofertas de Renta" : "Rental Offer System"}</p>
                <p className="text-xs mt-1 max-w-sm mx-auto">
                  {language === "es" 
                    ? "Aquí podrás generar y enviar ofertas formales de renta para propiedades en las que el lead está interesado" 
                    : "Here you can generate and send formal rental offers for properties the lead is interested in"}
                </p>
                <div className="mt-4 flex flex-col gap-2 items-center">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Send className="h-4 w-4" />
                    {language === "es" ? "Enviar Oferta vía WhatsApp" : "Send Offer via WhatsApp"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">{language === "es" ? "Pestaña Bloqueada" : "Tab Locked"}</p>
              <p className="text-xs mt-1">
                {language === "es" 
                  ? "El lead debe estar en estado 'Interesado' o superior para acceder a las ofertas de renta" 
                  : "Lead must be in 'Interested' status or higher to access rental offers"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">
              {language === "es" ? "Registro de Actividades" : "Activity Log"}
            </h4>
            <Button size="sm" onClick={() => setIsAddActivityOpen(true)} data-testid="button-add-activity">
              <Plus className="h-4 w-4 mr-1" />
              {language === "es" ? "Agregar" : "Add"}
            </Button>
          </div>

          {activitiesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activities.map((activity: any) => {
                const IconComponent = ACTIVITY_ICONS[activity.activityType as ActivityType] || Activity;
                return (
                  <Card key={activity.id} className="hover-elevate">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${ACTIVITY_COLORS[activity.activityType as ActivityType] || ACTIVITY_COLORS.note}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline" className="text-xs">
                              {getActivityLabel(activity.activityType)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(activity.createdAt), "d MMM yyyy HH:mm", { locale: language === "es" ? es : enUS })}
                            </span>
                          </div>
                          {activity.title && (
                            <p className="text-sm font-medium mt-1">{activity.title}</p>
                          )}
                          {activity.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{language === "es" ? "No hay actividades registradas" : "No activities recorded"}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="showings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">
              {language === "es" ? "Visitas a Propiedades" : "Property Showings"}
            </h4>
            <Button size="sm" onClick={() => setIsAddShowingOpen(true)} data-testid="button-add-showing">
              <Plus className="h-4 w-4 mr-1" />
              {language === "es" ? "Programar" : "Schedule"}
            </Button>
          </div>

          {showingsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : showings && showings.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {showings.map((showing: any) => (
                <Card key={showing.id} className="hover-elevate">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                        <Home className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-medium text-sm">{showing.propertyName}</span>
                          <Badge variant={getOutcomeVariant(showing.outcome)} className="text-xs">
                            {getOutcomeLabel(showing.outcome)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(showing.scheduledAt), "d MMM yyyy HH:mm", { locale: language === "es" ? es : enUS })}
                        </div>
                        {showing.agentNotes && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{showing.agentNotes}</p>
                        )}
                        {showing.leadFeedback && (
                          <p className="text-sm text-muted-foreground mt-1 italic">"{showing.leadFeedback}"</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{language === "es" ? "No hay visitas programadas" : "No showings scheduled"}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <h4 className="font-medium text-sm">
            {language === "es" ? "Historial de Estados" : "Status History"}
          </h4>

          {historyLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : statusHistory && statusHistory.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {statusHistory.map((history: any, index: number) => (
                <div key={history.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {history.fromStatus && (
                      <>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {STATUS_LABELS[history.fromStatus]?.[language as 'es' | 'en'] || history.fromStatus}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </>
                    )}
                    <Badge variant="default" className="text-xs shrink-0">
                      {STATUS_LABELS[history.toStatus]?.[language as 'es' | 'en'] || history.toStatus}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(history.changedAt), "d MMM yyyy", { locale: language === "es" ? es : enUS })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{language === "es" ? "No hay cambios de estado registrados" : "No status changes recorded"}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddActivityOpen} onOpenChange={setIsAddActivityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Registrar Actividad" : "Record Activity"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "es" ? "Tipo de Actividad" : "Activity Type"}
              </label>
              <Select value={newActivityType} onValueChange={(v) => setNewActivityType(v as ActivityType)}>
                <SelectTrigger data-testid="select-activity-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">{language === "es" ? "Llamada" : "Call"}</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">{language === "es" ? "Reunión" : "Meeting"}</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="note">{language === "es" ? "Nota" : "Note"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "es" ? "Notas" : "Notes"}
              </label>
              <Textarea
                value={newActivityNotes}
                onChange={(e) => setNewActivityNotes(e.target.value)}
                placeholder={language === "es" ? "Describe la actividad..." : "Describe the activity..."}
                data-testid="input-activity-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddActivityOpen(false)}>
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={() => addActivityMutation.mutate({ 
                activityType: newActivityType, 
                title: getActivityLabel(newActivityType),
                description: newActivityNotes || undefined 
              })}
              disabled={addActivityMutation.isPending}
              data-testid="button-save-activity"
            >
              {addActivityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "es" ? "Guardar" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddShowingOpen} onOpenChange={setIsAddShowingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Programar Visita" : "Schedule Showing"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "es" ? "Propiedad" : "Property"}
              </label>
              <Input
                value={newShowingProperty}
                onChange={(e) => setNewShowingProperty(e.target.value)}
                placeholder={language === "es" ? "Nombre de la propiedad..." : "Property name..."}
                data-testid="input-showing-property"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "es" ? "Fecha y Hora" : "Date and Time"}
              </label>
              <Input
                type="datetime-local"
                value={newShowingDate}
                onChange={(e) => setNewShowingDate(e.target.value)}
                data-testid="input-showing-date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "es" ? "Notas (opcional)" : "Notes (optional)"}
              </label>
              <Textarea
                value={newShowingNotes}
                onChange={(e) => setNewShowingNotes(e.target.value)}
                placeholder={language === "es" ? "Notas adicionales..." : "Additional notes..."}
                data-testid="input-showing-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddShowingOpen(false)}>
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={() => addShowingMutation.mutate({
                propertyName: newShowingProperty,
                scheduledAt: newShowingDate,
                agentNotes: newShowingNotes || undefined,
              })}
              disabled={addShowingMutation.isPending || !newShowingProperty || !newShowingDate}
              data-testid="button-save-showing"
            >
              {addShowingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "es" ? "Programar" : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
