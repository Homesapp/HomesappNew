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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  AlertTriangle,
  Ban,
  Shield,
  Building2,
  User,
  CheckCircle,
  CreditCard,
  Star,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalClient } from "@shared/schema";
import PresentationCardsTab from "./PresentationCardsTab";

interface ClientCRMTabsProps {
  client: ExternalClient;
  onClientUpdate?: () => void;
}

type ActivityType = "call" | "email" | "meeting" | "whatsapp" | "note" | "payment" | "contract";
type RelationshipType = "tenant" | "owner" | "guarantor" | "reference";
type BlacklistStatus = "none" | "warning" | "blacklisted";

const ACTIVITY_ICONS: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  whatsapp: MessageSquare,
  note: Activity,
  payment: Building2,
  contract: Home,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  call: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  email: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  meeting: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  whatsapp: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  note: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  payment: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  contract: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
};

export default function ClientCRMTabs({ client, onClientUpdate }: ClientCRMTabsProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isAddPropertyHistoryOpen, setIsAddPropertyHistoryOpen] = useState(false);
  const [isBlacklistDialogOpen, setIsBlacklistDialogOpen] = useState(false);
  const [newActivityType, setNewActivityType] = useState<ActivityType>("call");
  const [newActivityNotes, setNewActivityNotes] = useState("");
  const [newPropertyName, setNewPropertyName] = useState("");
  const [newRelationshipType, setNewRelationshipType] = useState<RelationshipType>("tenant");
  const [newPropertyStartDate, setNewPropertyStartDate] = useState("");
  const [newPropertyEndDate, setNewPropertyEndDate] = useState("");
  const [newPropertyNotes, setNewPropertyNotes] = useState("");
  const [blacklistAction, setBlacklistAction] = useState<BlacklistStatus>("warning");
  const [blacklistReason, setBlacklistReason] = useState("");

  const { data: activities, isLoading: activitiesLoading } = useQuery<any[]>({
    queryKey: ["/api/external-clients", client.id, "activities"],
    queryFn: async () => {
      const response = await fetch(`/api/external-clients/${client.id}/activities`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: propertyHistory, isLoading: historyLoading } = useQuery<any[]>({
    queryKey: ["/api/external-clients", client.id, "property-history"],
    queryFn: async () => {
      const response = await fetch(`/api/external-clients/${client.id}/property-history`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async (data: { activityType: string; title: string; description?: string }) => {
      const res = await apiRequest("POST", `/api/external-clients/${client.id}/activities`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients", client.id, "activities"] });
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

  const addPropertyHistoryMutation = useMutation({
    mutationFn: async (data: { propertyName: string; relationshipType: string; startDate?: string; endDate?: string; notes?: string }) => {
      const res = await apiRequest("POST", `/api/external-clients/${client.id}/property-history`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients", client.id, "property-history"] });
      setIsAddPropertyHistoryOpen(false);
      setNewPropertyName("");
      setNewPropertyStartDate("");
      setNewPropertyEndDate("");
      setNewPropertyNotes("");
      toast({
        title: language === "es" ? "Historial actualizado" : "History updated",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        variant: "destructive",
      });
    },
  });

  const updateBlacklistMutation = useMutation({
    mutationFn: async (data: { blacklistStatus: BlacklistStatus; blacklistReason?: string }) => {
      const res = await apiRequest("PATCH", `/api/external-clients/${client.id}/blacklist`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients"] });
      setIsBlacklistDialogOpen(false);
      setBlacklistReason("");
      onClientUpdate?.();
      toast({
        title: language === "es" ? "Estado actualizado" : "Status updated",
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
      note: { es: "Nota", en: "Note" },
      payment: { es: "Pago", en: "Payment" },
      contract: { es: "Contrato", en: "Contract" },
    };
    return labels[type]?.[language as 'es' | 'en'] || type;
  };

  const getRelationshipLabel = (type: RelationshipType) => {
    const labels: Record<RelationshipType, { es: string; en: string }> = {
      tenant: { es: "Inquilino", en: "Tenant" },
      owner: { es: "Propietario", en: "Owner" },
      guarantor: { es: "Aval", en: "Guarantor" },
      reference: { es: "Referencia", en: "Reference" },
    };
    return labels[type]?.[language as 'es' | 'en'] || type;
  };

  const getBlacklistBadge = () => {
    const status = (client as any).blacklistStatus as BlacklistStatus;
    if (status === "blacklisted") {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Ban className="h-3 w-3" />
          {language === "es" ? "Lista Negra" : "Blacklisted"}
        </Badge>
      );
    }
    if (status === "warning") {
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-600">
          <AlertTriangle className="h-3 w-3" />
          {language === "es" ? "Advertencia" : "Warning"}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-600">
        <CheckCircle className="h-3 w-3" />
        {language === "es" ? "Sin Problemas" : "No Issues"}
      </Badge>
    );

  const getRatingBadge = () => {
    const rating = (client as any).cumulativeRating || 0;
    if (rating === 0) return null;
    const isPositive = rating > 0;
    return (
      <Badge 
        variant="outline" 
        className={`flex items-center gap-1 ${isPositive ? "border-yellow-500 text-yellow-600" : "border-red-500 text-red-600"}`}
      >
        <Star className="h-3 w-3" />
        {rating > 0 ? `+${rating}` : rating}
      </Badge>
    );
  };
  };

  return (
    <div className="mt-4">
      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="cards" className="flex items-center gap-2" data-testid="tab-client-cards">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Tarjetas" : "Cards"}</span>
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2" data-testid="tab-client-activities">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Actividades" : "Activities"}</span>
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2" data-testid="tab-client-properties">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Propiedades" : "Properties"}</span>
          </TabsTrigger>
          <TabsTrigger value="blacklist" className="flex items-center gap-2" data-testid="tab-client-blacklist">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Estado" : "Status"}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-4">
          <PresentationCardsTab 
            clientId={client.id} 
            personName={`${client.firstName} ${client.lastName}`}
          />
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">
              {language === "es" ? "Registro de Actividades" : "Activity Log"}
            </h4>
            <Button size="sm" onClick={() => setIsAddActivityOpen(true)} data-testid="button-add-client-activity">
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

        <TabsContent value="properties" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">
              {language === "es" ? "Historial de Propiedades" : "Property History"}
            </h4>
            <Button size="sm" onClick={() => setIsAddPropertyHistoryOpen(true)} data-testid="button-add-property-history">
              <Plus className="h-4 w-4 mr-1" />
              {language === "es" ? "Agregar" : "Add"}
            </Button>
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : propertyHistory && propertyHistory.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {propertyHistory.map((history: any) => (
                <Card key={history.id} className="hover-elevate">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-medium text-sm">{history.propertyName}</span>
                          <Badge variant="outline" className="text-xs">
                            {getRelationshipLabel(history.relationshipType)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {history.startDate && format(new Date(history.startDate), "MMM yyyy", { locale: language === "es" ? es : enUS })}
                          {history.endDate && ` - ${format(new Date(history.endDate), "MMM yyyy", { locale: language === "es" ? es : enUS })}`}
                          {!history.endDate && history.startDate && ` - ${language === "es" ? "Presente" : "Present"}`}
                        </div>
                        {history.notes && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{language === "es" ? "No hay historial de propiedades" : "No property history"}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="blacklist" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">
              {language === "es" ? "Estado del Cliente" : "Client Status"}
            </h4>
          </div>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{language === "es" ? "Estado Actual:" : "Current Status:"}</span>
                {getBlacklistBadge()}
                {getRatingBadge()}
              </div>

              {(client as any).blacklistReason && (
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-xs text-muted-foreground">{language === "es" ? "Razón:" : "Reason:"}</span>
                  <p className="text-sm mt-1">{(client as any).blacklistReason}</p>
                </div>
              )}

              {(client as any).blacklistedAt && (
                <div className="text-xs text-muted-foreground">
                  {language === "es" ? "Marcado el:" : "Marked on:"}{" "}
                  {format(new Date((client as any).blacklistedAt), "d MMM yyyy", { locale: language === "es" ? es : enUS })}
                </div>
              )}

              <div className="flex gap-2 flex-wrap pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  onClick={() => {
                    setBlacklistAction("none");
                    setIsBlacklistDialogOpen(true);
                  }}
                  disabled={(client as any).blacklistStatus === "none" || !(client as any).blacklistStatus}
                  data-testid="button-clear-blacklist"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {language === "es" ? "Limpiar" : "Clear"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                  onClick={() => {
                    setBlacklistAction("warning");
                    setIsBlacklistDialogOpen(true);
                  }}
                  disabled={(client as any).blacklistStatus === "warning"}
                  data-testid="button-warn-client"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {language === "es" ? "Advertir" : "Warn"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setBlacklistAction("blacklisted");
                    setIsBlacklistDialogOpen(true);
                  }}
                  disabled={(client as any).blacklistStatus === "blacklisted"}
                  data-testid="button-blacklist-client"
                >
                  <Ban className="h-4 w-4 mr-1" />
                  {language === "es" ? "Lista Negra" : "Blacklist"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {(client as any).sourceLeadId && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {language === "es" ? "Convertido desde Lead" : "Converted from Lead"}
                  </span>
                </div>
              </CardContent>
            </Card>
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
                <SelectTrigger data-testid="select-client-activity-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">{language === "es" ? "Llamada" : "Call"}</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">{language === "es" ? "Reunión" : "Meeting"}</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="payment">{language === "es" ? "Pago" : "Payment"}</SelectItem>
                  <SelectItem value="contract">{language === "es" ? "Contrato" : "Contract"}</SelectItem>
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
                data-testid="input-client-activity-notes"
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
              data-testid="button-save-client-activity"
            >
              {addActivityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "es" ? "Guardar" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddPropertyHistoryOpen} onOpenChange={setIsAddPropertyHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Agregar Propiedad" : "Add Property"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "es" ? "Nombre de Propiedad" : "Property Name"}
              </label>
              <Input
                value={newPropertyName}
                onChange={(e) => setNewPropertyName(e.target.value)}
                placeholder={language === "es" ? "Ej: Casa en Aldea Zama" : "Ex: House in Aldea Zama"}
                data-testid="input-property-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "es" ? "Tipo de Relación" : "Relationship Type"}
              </label>
              <Select value={newRelationshipType} onValueChange={(v) => setNewRelationshipType(v as RelationshipType)}>
                <SelectTrigger data-testid="select-relationship-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant">{language === "es" ? "Inquilino" : "Tenant"}</SelectItem>
                  <SelectItem value="owner">{language === "es" ? "Propietario" : "Owner"}</SelectItem>
                  <SelectItem value="guarantor">{language === "es" ? "Aval" : "Guarantor"}</SelectItem>
                  <SelectItem value="reference">{language === "es" ? "Referencia" : "Reference"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "es" ? "Fecha Inicio" : "Start Date"}
                </label>
                <Input
                  type="date"
                  value={newPropertyStartDate}
                  onChange={(e) => setNewPropertyStartDate(e.target.value)}
                  data-testid="input-property-start-date"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "es" ? "Fecha Fin (opcional)" : "End Date (optional)"}
                </label>
                <Input
                  type="date"
                  value={newPropertyEndDate}
                  onChange={(e) => setNewPropertyEndDate(e.target.value)}
                  data-testid="input-property-end-date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "es" ? "Notas (opcional)" : "Notes (optional)"}
              </label>
              <Textarea
                value={newPropertyNotes}
                onChange={(e) => setNewPropertyNotes(e.target.value)}
                placeholder={language === "es" ? "Notas adicionales..." : "Additional notes..."}
                data-testid="input-property-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPropertyHistoryOpen(false)}>
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={() => addPropertyHistoryMutation.mutate({
                propertyName: newPropertyName,
                relationshipType: newRelationshipType,
                startDate: newPropertyStartDate || undefined,
                endDate: newPropertyEndDate || undefined,
                notes: newPropertyNotes || undefined,
              })}
              disabled={addPropertyHistoryMutation.isPending || !newPropertyName}
              data-testid="button-save-property-history"
            >
              {addPropertyHistoryMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "es" ? "Guardar" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isBlacklistDialogOpen} onOpenChange={setIsBlacklistDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blacklistAction === "none" 
                ? (language === "es" ? "Limpiar Estado" : "Clear Status")
                : blacklistAction === "warning"
                ? (language === "es" ? "Agregar Advertencia" : "Add Warning")
                : (language === "es" ? "Agregar a Lista Negra" : "Add to Blacklist")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blacklistAction === "none" 
                ? (language === "es" ? "El cliente será marcado sin problemas." : "The client will be marked with no issues.")
                : blacklistAction === "warning"
                ? (language === "es" ? "El cliente será marcado con una advertencia. Por favor proporciona una razón." : "The client will be marked with a warning. Please provide a reason.")
                : (language === "es" ? "El cliente será añadido a la lista negra. Esta acción es seria. Por favor proporciona una razón." : "The client will be added to the blacklist. This is a serious action. Please provide a reason.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {blacklistAction !== "none" && (
            <div className="py-4">
              <Textarea
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                placeholder={language === "es" ? "Razón..." : "Reason..."}
                data-testid="input-blacklist-reason"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "es" ? "Cancelar" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => updateBlacklistMutation.mutate({
                blacklistStatus: blacklistAction,
                blacklistReason: blacklistAction !== "none" ? blacklistReason : undefined,
              })}
              disabled={updateBlacklistMutation.isPending || (blacklistAction !== "none" && !blacklistReason)}
              className={blacklistAction === "blacklisted" ? "bg-red-600 hover:bg-red-700" : ""}
              data-testid="button-confirm-blacklist"
            >
              {updateBlacklistMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "es" ? "Confirmar" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
