import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertExternalAgencySchema } from "@shared/schema";
import type { ExternalAgency, ExternalNotification } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, CheckCheck, Settings, AlertTriangle, CreditCard, Wrench, FileText, Calendar, Percent } from "lucide-react";
import CommissionManagement from "@/components/CommissionManagement";

const formSchema = insertExternalAgencySchema.extend({});

export default function ExternalAgencyConfig() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("config");

  const { data: agencies, isLoading } = useQuery<ExternalAgency[]>({
    queryKey: ['/api/external-agencies'],
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<ExternalNotification[]>({
    queryKey: ['/api/external/notifications'],
    refetchInterval: 30000,
  });

  const { data: notificationCount } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/external/notifications/count'],
    refetchInterval: 30000,
  });

  const agency = agencies?.[0];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      agencyLogoUrl: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (agency) {
      form.reset({
        name: agency.name,
        description: agency.description || "",
        contactName: agency.contactName || "",
        contactEmail: agency.contactEmail || "",
        contactPhone: agency.contactPhone || "",
        agencyLogoUrl: agency.agencyLogoUrl || "",
        isActive: agency.isActive,
      });
    }
  }, [agency?.id]);

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!agency) {
        throw new Error("No agency assigned");
      }
      return await apiRequest("PATCH", `/api/external-agencies/${agency.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agencies'] });
      toast({
        title: language === "es" ? "Agencia actualizada" : "Agency updated",
        description: language === "es" 
          ? "La información de la agencia ha sido actualizada exitosamente"
          : "Agency information has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo actualizar la información de la agencia"
          : "Could not update agency information",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/external/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/notifications/count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/external/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/notifications/count'] });
      toast({
        title: language === "es" ? "Notificaciones marcadas" : "Notifications marked",
        description: language === "es"
          ? "Todas las notificaciones han sido marcadas como leídas"
          : "All notifications have been marked as read",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateMutation.mutate(data);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment_reminder":
        return <CreditCard className="h-4 w-4 text-yellow-500" />;
      case "rental_update":
      case "contract_update":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "appointment":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "system":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive" className="text-xs">{language === "es" ? "Urgente" : "Urgent"}</Badge>;
      case "high":
        return <Badge className="bg-orange-500 text-xs">{language === "es" ? "Alta" : "High"}</Badge>;
      default:
        return null;
    }
  };

  const unreadCount = notificationCount?.unreadCount || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "es" ? "Configuración de Agencia" : "Agency Configuration"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "es" 
            ? "Administra la información y notificaciones de tu agencia"
            : "Manage your agency information and notifications"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config" className="flex items-center gap-2" data-testid="tab-config">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Configuración" : "Configuration"}</span>
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center gap-2" data-testid="tab-commissions">
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Comisiones" : "Commissions"}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2" data-testid="tab-notifications">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Notificaciones" : "Notifications"}</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-6">
          <Card data-testid="card-agency-info">
            <CardHeader>
              <CardTitle>
                {language === "es" ? "Información de la Agencia" : "Agency Information"}
              </CardTitle>
              <CardDescription>
                {language === "es" 
                  ? "Actualiza los datos de contacto y detalles de tu agencia"
                  : "Update your agency contact details and information"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !agency ? (
                <div className="text-center py-8" data-testid="div-no-agency">
                  <p className="text-muted-foreground">
                    {language === "es" 
                      ? "No tienes una agencia asignada. Por favor contacta al administrador de HomesApp para crear tu cuenta de agencia externa."
                      : "You don't have an assigned agency. Please contact the HomesApp administrator to create your external agency account."}
                  </p>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Nombre de la Agencia" : "Agency Name"}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              data-testid="input-agency-name"
                              placeholder={language === "es" ? "Ej: Mi Agencia Inmobiliaria" : "E.g.: My Real Estate Agency"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Descripción" : "Description"}</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              data-testid="input-agency-description"
                              placeholder={language === "es" 
                                ? "Descripción breve de tu agencia inmobiliaria" 
                                : "Brief description of your real estate agency"}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Persona de Contacto" : "Contact Person"}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              data-testid="input-contact-name"
                              placeholder={language === "es" ? "Juan Pérez" : "John Doe"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Email de Contacto" : "Contact Email"}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              data-testid="input-contact-email"
                              placeholder={language === "es" ? "contacto@miagencia.com" : "contact@myagency.com"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Teléfono de Contacto" : "Contact Phone"}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              data-testid="input-contact-phone"
                              placeholder="+52 984 123 4567"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateMutation.isPending}
                        data-testid="button-save-agency"
                      >
                        {updateMutation.isPending 
                          ? (language === "es" ? "Guardando..." : "Saving...")
                          : (language === "es" ? "Guardar Cambios" : "Save Changes")}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="mt-6">
          <CommissionManagement />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card data-testid="card-notifications">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    {language === "es" ? "Centro de Notificaciones" : "Notification Center"}
                  </CardTitle>
                  <CardDescription>
                    {language === "es" 
                      ? "Notificaciones de tu agencia sobre pagos, contratos y mantenimiento"
                      : "Agency notifications about payments, contracts and maintenance"}
                  </CardDescription>
                </div>
                {unreadCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    data-testid="button-mark-all-read"
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    {language === "es" ? "Marcar todas como leídas" : "Mark all as read"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12" data-testid="div-no-notifications">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {language === "es" 
                      ? "No tienes notificaciones"
                      : "You don't have any notifications"}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsReadMutation.mutate(notification.id);
                          }
                        }}
                        className={`w-full p-4 rounded-lg border text-left transition-colors hover-elevate ${
                          !notification.isRead 
                            ? "bg-accent/50 border-accent" 
                            : "bg-card border-border"
                        }`}
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium text-sm ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                {notification.title}
                              </span>
                              {getPriorityBadge(notification.priority)}
                              {!notification.isRead && (
                                <span className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: language === "es" ? es : undefined,
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
