import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User, Wrench, Image as ImageIcon, FileText, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import type { ExternalMaintenanceTicket, ExternalMaintenanceUpdate, ExternalMaintenancePhoto } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusColors: Record<string, { bg: string; label: { es: string; en: string } }> = {
  open: {
    bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    label: { es: "Abierto", en: "Open" }
  },
  in_progress: {
    bg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    label: { es: "En Progreso", en: "In Progress" }
  },
  resolved: {
    bg: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    label: { es: "Resuelto", en: "Resolved" }
  },
  closed: {
    bg: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300",
    label: { es: "Cerrado", en: "Closed" }
  },
  on_hold: {
    bg: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    label: { es: "En Espera", en: "On Hold" }
  },
};

const priorityColors: Record<string, { bg: string; label: { es: string; en: string } }> = {
  low: {
    bg: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300",
    label: { es: "Baja", en: "Low" }
  },
  medium: {
    bg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    label: { es: "Media", en: "Medium" }
  },
  high: {
    bg: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    label: { es: "Alta", en: "High" }
  },
  urgent: {
    bg: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    label: { es: "Urgente", en: "Urgent" }
  },
};

export default function ExternalMaintenanceDetail() {
  const { id } = useParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("timeline");

  // Fetch ticket details
  const { data: ticket, isLoading: ticketLoading } = useQuery<ExternalMaintenanceTicket>({
    queryKey: ['/api/external-tickets', id],
    enabled: !!id,
  });

  // Fetch updates
  const { data: updates, isLoading: updatesLoading } = useQuery<ExternalMaintenanceUpdate[]>({
    queryKey: ['/api/external-tickets', id, 'updates'],
    enabled: !!id,
  });

  // Fetch photos
  const { data: photos, isLoading: photosLoading } = useQuery<ExternalMaintenancePhoto[]>({
    queryKey: ['/api/external-tickets', id, 'photos'],
    enabled: !!id,
  });

  if (ticketLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">
              {language === "es" ? "Ticket no encontrado" : "Ticket not found"}
            </p>
            <Link href="/external/maintenance">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === "es" ? "Volver" : "Go Back"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = statusColors[ticket.status] || statusColors.open;
  const priorityConfig = priorityColors[ticket.priority] || priorityColors.medium;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/external/maintenance">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wrench className="h-6 w-6" />
              {ticket.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "es" ? "Ticket de Mantenimiento" : "Maintenance Ticket"} #{ticket.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className={priorityConfig.bg} data-testid="badge-priority">
            {priorityConfig.label[language]}
          </Badge>
          <Badge className={statusConfig.bg} data-testid="badge-status">
            {statusConfig.label[language]}
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Main content with tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline" data-testid="tab-timeline">
            <Clock className="h-4 w-4 mr-2" />
            {language === "es" ? "Historial" : "Timeline"}
          </TabsTrigger>
          <TabsTrigger value="photos" data-testid="tab-photos">
            <ImageIcon className="h-4 w-4 mr-2" />
            {language === "es" ? "Fotos" : "Photos"}
            {photos && photos.length > 0 && (
              <Badge variant="secondary" className="ml-2">{photos.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="details" data-testid="tab-details">
            <FileText className="h-4 w-4 mr-2" />
            {language === "es" ? "Detalles" : "Details"}
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === "es" ? "Historial de Actualizaciones" : "Update Timeline"}</CardTitle>
              <CardDescription>
                {language === "es" 
                  ? "Cronología de todas las actividades y cambios en este ticket" 
                  : "Timeline of all activities and changes on this ticket"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {updatesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : updates && updates.length > 0 ? (
                <div className="space-y-4">
                  {updates.map((update, index) => (
                    <div key={update.id} className="flex gap-4" data-testid={`update-${update.id}`}>
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                        {index < updates.length - 1 && (
                          <div className="flex-1 w-px bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{update.type}</span>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(update.createdAt), language === "es" ? "d 'de' MMM, yyyy HH:mm" : "MMM d, yyyy HH:mm", {
                                locale: language === "es" ? es : undefined
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{update.notes}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {language === "es" ? "No hay actualizaciones aún" : "No updates yet"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === "es" ? "Galería de Fotos" : "Photo Gallery"}</CardTitle>
              <CardDescription>
                {language === "es" 
                  ? "Documentación fotográfica del trabajo de mantenimiento" 
                  : "Photographic documentation of the maintenance work"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {photosLoading ? (
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
              ) : photos && photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {photos.map(photo => (
                    <div key={photo.id} className="space-y-2" data-testid={`photo-${photo.id}`}>
                      <div className="relative aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        <Badge className="absolute top-2 right-2" variant="secondary">
                          {photo.phase}
                        </Badge>
                      </div>
                      {photo.caption && (
                        <p className="text-sm text-muted-foreground">{photo.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "es" ? "No hay fotos aún" : "No photos yet"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === "es" ? "Información del Ticket" : "Ticket Information"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {language === "es" ? "Descripción" : "Description"}
                  </label>
                  <p className="mt-1">{ticket.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {language === "es" ? "Categoría" : "Category"}
                  </label>
                  <p className="mt-1">{ticket.category}</p>
                </div>
                {ticket.scheduledWindowStart && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {language === "es" ? "Ventana de Programación" : "Scheduled Window"}
                    </label>
                    <p className="mt-1">
                      {format(new Date(ticket.scheduledWindowStart), language === "es" ? "d 'de' MMM, yyyy HH:mm" : "MMM d, yyyy HH:mm", {
                        locale: language === "es" ? es : undefined
                      })}
                      {ticket.scheduledWindowEnd && (
                        <> - {format(new Date(ticket.scheduledWindowEnd), "HH:mm")}</>
                      )}
                    </p>
                  </div>
                )}
                {ticket.estimatedCost && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {language === "es" ? "Costo Estimado" : "Estimated Cost"}
                    </label>
                    <p className="mt-1">${ticket.estimatedCost}</p>
                  </div>
                )}
                {ticket.actualCost && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {language === "es" ? "Costo Real" : "Actual Cost"}
                    </label>
                    <p className="mt-1">${ticket.actualCost}</p>
                  </div>
                )}
                {ticket.completionNotes && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {language === "es" ? "Notas de Completación" : "Completion Notes"}
                    </label>
                    <p className="mt-1">{ticket.completionNotes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
