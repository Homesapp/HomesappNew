import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Building2,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Users,
  History,
  FileText,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Property } from "@shared/schema";

const approvalStatusLabels: Record<string, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const approvalStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  pending: "outline",
  approved: "default",
  rejected: "destructive",
};

const approvalStatusIcons: Record<string, typeof Clock> = {
  draft: AlertCircle,
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

interface ChangeRequest {
  id: string;
  propertyId: string;
  changedFields: Record<string, any>;
  status: string;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

export default function OwnerPropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ["/api/owner/properties", id, "detail"],
    queryFn: async () => {
      const response = await fetch(`/api/owner/properties/${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch property");
      }
      return response.json();
    },
    enabled: !!id && id !== "new",
  });

  const { data: changeRequests = [] } = useQuery<ChangeRequest[]>({
    queryKey: ["/api/owner/change-requests", { propertyId: id }],
    enabled: !!id && id !== "new",
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!property && id !== "new") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Propiedad no encontrada</h3>
          <Button onClick={() => setLocation("/mis-propiedades")}>
            Volver a Mis Propiedades
          </Button>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = property
    ? approvalStatusIcons[property.approvalStatus || "draft"]
    : AlertCircle;

  const pendingChanges = changeRequests.filter((cr) => cr.status === "pending");
  const hasPendingChanges = pendingChanges.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/mis-propiedades")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {property?.title || "Nueva Propiedad"}
          </h1>
          {property && (
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={approvalStatusColors[property.approvalStatus || "draft"]}
                className="gap-1"
              >
                <StatusIcon className="h-3 w-3" />
                {approvalStatusLabels[property.approvalStatus || "draft"]}
              </Badge>
              {hasPendingChanges && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {pendingChanges.length} cambio{pendingChanges.length > 1 ? "s" : ""} pendiente
                  {pendingChanges.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          )}
        </div>
        {property && (
          <div className="flex gap-2">
            <Button
              onClick={() => setLocation(`/owner/property/${id}/edit`)}
              data-testid="button-edit-property"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Propiedad
            </Button>
            <DeletePropertyButton propertyId={id!} propertyTitle={property.title} />
          </div>
        )}
      </div>

      {property && (
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="changes">
              Solicitudes de Cambio
              {hasPendingChanges && (
                <Badge variant="secondary" className="ml-2">
                  {pendingChanges.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="staff">Personal</TabsTrigger>
            <TabsTrigger value="appointments">Visitas</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Título</label>
                    <p className="text-base mt-1" data-testid="text-property-title">
                      {property.title}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                    <p className="text-base mt-1 text-muted-foreground">
                      {property.description || "Sin descripción"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-base">{property.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalles de Propiedad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Precio</label>
                      <div className="flex items-center gap-1 text-xl font-semibold mt-1">
                        <DollarSign className="h-5 w-5" />
                        <span data-testid="text-property-price">
                          ${Number(property.price).toLocaleString()}
                        </span>
                      </div>
                      {(property.status === "rent" || property.status === "both") && (
                        <span className="text-sm text-muted-foreground">/mes</span>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                      <p className="text-base mt-1 capitalize">{property.propertyType}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center gap-2 p-3 border rounded-md">
                      <Bed className="h-5 w-5 text-muted-foreground" />
                      <span className="text-lg font-semibold">{property.bedrooms}</span>
                      <span className="text-xs text-muted-foreground">Habitaciones</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-3 border rounded-md">
                      <Bath className="h-5 w-5 text-muted-foreground" />
                      <span className="text-lg font-semibold">{property.bathrooms}</span>
                      <span className="text-xs text-muted-foreground">Baños</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-3 border rounded-md">
                      <Square className="h-5 w-5 text-muted-foreground" />
                      <span className="text-lg font-semibold">{property.area}</span>
                      <span className="text-xs text-muted-foreground">m²</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {property.images && property.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Imágenes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {property.images.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-md overflow-hidden border bg-muted"
                      >
                        <img
                          src={image}
                          alt={`${property.title} - imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="changes" className="space-y-4">
            {changeRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay solicitudes de cambio</h3>
                  <p className="text-muted-foreground text-center">
                    Los cambios que realices a la propiedad aparecerán aquí
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {changeRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <CardTitle className="text-lg">Solicitud de Cambio</CardTitle>
                        <Badge
                          variant={
                            request.status === "pending"
                              ? "outline"
                              : request.status === "approved"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {request.status === "pending"
                            ? "Pendiente"
                            : request.status === "approved"
                            ? "Aprobado"
                            : "Rechazado"}
                        </Badge>
                      </div>
                      <CardDescription>
                        Solicitado el{" "}
                        {new Date(request.requestedAt).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Campos modificados:</label>
                        <div className="mt-2 space-y-2">
                          {Object.entries(request.changedFields).map(([key, value]) => (
                            <div key={key} className="flex items-start gap-2 text-sm">
                              <span className="font-medium capitalize">{key}:</span>
                              <span className="text-muted-foreground flex-1">
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {request.reviewNotes && (
                        <>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium">Notas de revisión:</label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {request.reviewNotes}
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Gestión de Personal</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Próximamente podrás asignar personal a esta propiedad
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Visitas</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Las solicitudes de visita aparecerán aquí
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function DeletePropertyButton({ propertyId, propertyTitle }: { propertyId: string; propertyTitle: string }) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/properties/${propertyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/properties"] });
      toast({
        title: "Propiedad eliminada",
        description: "La propiedad ha sido eliminada exitosamente",
      });
      setLocation("/mis-propiedades");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la propiedad",
        variant: "destructive",
      });
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" data-testid="button-delete-property">
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente la propiedad "{propertyTitle}" y todos sus datos asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? "Eliminando..." : "Eliminar propiedad"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
