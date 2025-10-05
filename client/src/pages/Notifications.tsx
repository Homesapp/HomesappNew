import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Bell, Check, CheckCheck, Settings, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@shared/schema";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: settings } = useQuery<{
    notificationPreferences?: Record<string, boolean>;
    autoApproveAppointments?: boolean;
    autoAcceptOffers?: boolean;
  }>({
    queryKey: ["/api/owner/settings"],
    enabled: !!user && ["owner", "seller", "admin", "admin_jr", "master", "cliente"].includes(user.role || ""),
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/notifications/mark-all-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Record<string, boolean>) => {
      return await apiRequest("POST", "/api/owner/settings", {
        notificationPreferences: preferences,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/settings"] });
      toast({
        title: "Preferencias actualizadas",
        description: "Tus preferencias de notificaciones han sido guardadas",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron guardar las preferencias",
        variant: "destructive",
      });
    },
  });

  const handlePreferenceChange = (key: string, value: boolean) => {
    const currentPreferences = (settings?.notificationPreferences || {}) as Record<string, boolean>;
    const newPreferences = { ...currentPreferences, [key]: value };
    updatePreferencesMutation.mutate(newPreferences);
  };

  const emailPreferences = (settings?.notificationPreferences || {}) as Record<string, boolean>;

  const handleNotificationClick = (notification: Notification) => {
    markAsReadMutation.mutate(notification.id);
    
    if (notification.relatedEntityType && notification.relatedEntityId) {
      if (notification.relatedEntityType === "property") {
        setLocation(`/propiedad/${notification.relatedEntityId}/completo`);
      } else if (notification.relatedEntityType === "appointment") {
        setLocation(`/appointments`);
      } else if (notification.relatedEntityType === "offer") {
        setLocation(`/backoffice`);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return "📅";
      case "offer":
        return "💰";
      case "message":
        return "💬";
      case "property_update":
        return "🏠";
      case "rental_update":
        return "🔑";
      default:
        return "📢";
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  if (isLoading) {
    return <LoadingScreen className="h-64" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-notifications">
              Notificaciones
            </h1>
            <p className="text-muted-foreground">
              Mantente al día con todas tus notificaciones
            </p>
          </div>
        </div>
        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            Todas
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" data-testid="tab-unread">
            No leídas
            {unreadNotifications.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read" data-testid="tab-read">
            Leídas
            {readNotifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {readNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">
            <Settings className="h-4 w-4 mr-2" />
            Preferencias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No tienes notificaciones</h3>
                <p className="text-muted-foreground">
                  Cuando recibas notificaciones, aparecerán aquí
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`hover-elevate cursor-pointer transition-all ${
                  !notification.read ? "border-l-4 border-l-primary" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-card-${notification.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="text-3xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold">{notification.title}</h3>
                        {!notification.read && (
                          <Badge variant="default">Nueva</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{notification.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-3">
          {unreadNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">¡Todo al día!</h3>
                <p className="text-muted-foreground">
                  No tienes notificaciones sin leer
                </p>
              </CardContent>
            </Card>
          ) : (
            unreadNotifications.map((notification) => (
              <Card
                key={notification.id}
                className="hover-elevate cursor-pointer transition-all border-l-4 border-l-primary"
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-card-${notification.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="text-3xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <Badge variant="default">Nueva</Badge>
                      </div>
                      <p className="text-muted-foreground">{notification.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-3">
          {readNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay notificaciones leídas</h3>
                <p className="text-muted-foreground">
                  Las notificaciones que marques como leídas aparecerán aquí
                </p>
              </CardContent>
            </Card>
          ) : (
            readNotifications.map((notification) => (
              <Card
                key={notification.id}
                className="hover-elevate cursor-pointer transition-all"
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-card-${notification.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="text-3xl opacity-60">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold opacity-80">{notification.title}</h3>
                      <p className="text-muted-foreground">{notification.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Preferencias de Email</CardTitle>
                  <CardDescription>
                    Configura qué notificaciones deseas recibir por correo electrónico
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="appointments-email" className="text-base">
                      Citas
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones sobre nuevas citas y cambios
                    </p>
                  </div>
                  <Switch
                    id="appointments-email"
                    checked={emailPreferences.appointments !== false}
                    onCheckedChange={(checked) => handlePreferenceChange("appointments", checked)}
                    data-testid="switch-appointments-email"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="offers-email" className="text-base">
                      Ofertas
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones sobre nuevas ofertas
                    </p>
                  </div>
                  <Switch
                    id="offers-email"
                    checked={emailPreferences.offers !== false}
                    onCheckedChange={(checked) => handlePreferenceChange("offers", checked)}
                    data-testid="switch-offers-email"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="messages-email" className="text-base">
                      Mensajes
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones sobre nuevos mensajes
                    </p>
                  </div>
                  <Switch
                    id="messages-email"
                    checked={emailPreferences.messages !== false}
                    onCheckedChange={(checked) => handlePreferenceChange("messages", checked)}
                    data-testid="switch-messages-email"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="property-updates-email" className="text-base">
                      Actualizaciones de Propiedades
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones sobre cambios en propiedades
                    </p>
                  </div>
                  <Switch
                    id="property-updates-email"
                    checked={emailPreferences.propertyUpdates !== false}
                    onCheckedChange={(checked) => handlePreferenceChange("propertyUpdates", checked)}
                    data-testid="switch-property-updates-email"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="rental-updates-email" className="text-base">
                      Actualizaciones de Rentas
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones sobre el estado de tus rentas
                    </p>
                  </div>
                  <Switch
                    id="rental-updates-email"
                    checked={emailPreferences.rentalUpdates !== false}
                    onCheckedChange={(checked) => handlePreferenceChange("rentalUpdates", checked)}
                    data-testid="switch-rental-updates-email"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing-email" className="text-base">
                      Marketing y Promociones
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe ofertas especiales y novedades
                    </p>
                  </div>
                  <Switch
                    id="marketing-email"
                    checked={emailPreferences.marketing === true}
                    onCheckedChange={(checked) => handlePreferenceChange("marketing", checked)}
                    data-testid="switch-marketing-email"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
