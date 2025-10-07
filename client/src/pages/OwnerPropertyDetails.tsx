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
  PawPrint,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Zap,
  Wifi,
  Calendar,
  Key,
  Lock,
  User,
  Phone,
  MapPinned,
  ExternalLink,
  Home,
  Trees,
  Waves,
  Flame,
  Check,
  X as XIcon,
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
import { PropertyStaffManagement } from "@/components/PropertyStaffManagement";
import { PropertyVisits } from "@/components/PropertyVisits";
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    <div className="space-y-4">
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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            {property?.title || "Nueva Propiedad"}
          </h1>
          {property && (
            <div className="flex items-center gap-2 mt-1">
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
        <>
          {/* Photo Gallery */}
          {property.images && property.images.length > 0 && (
          <Card className="overflow-hidden">
            <div className="relative h-72">
              <img
                src={property.images[currentImageIndex]}
                alt={`${property.title} - imagen ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {property.images.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? property.images!.length - 1 : prev - 1
                      )
                    }
                    data-testid="button-prev-image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === property.images!.length - 1 ? 0 : prev + 1
                      )
                    }
                    data-testid="button-next-image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {property.images.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? "bg-white w-6"
                            : "bg-white/50"
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                        data-testid={`button-image-indicator-${index}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>
          )}

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

          <TabsContent value="details" className="space-y-4">
            {/* Rental and Sale Listings Section */}
            {(property.status === "both" || property.status === "rent" || property.status === "sale") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(property.status === "rent" || property.status === "both") && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        Listing de Renta
                        <Badge variant="default">Renta</Badge>
                      </CardTitle>
                      <CardDescription>Información para renta mensual</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Precio Mensual</label>
                        <div className="flex items-center gap-1 text-xl font-semibold mt-1 text-primary">
                          <span data-testid="text-rental-price">
                            ${Number(property.price).toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">/mes</span>
                        </div>
                      </div>
                      {property.availableFrom && (
                        <>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Disponible desde</label>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">
                                {new Date(property.availableFrom).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                      {property.acceptedLeaseDurations && property.acceptedLeaseDurations.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Duraciones aceptadas
                            </label>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {property.acceptedLeaseDurations.map((duration) => (
                                <Badge key={duration} variant="secondary" className="text-xs" data-testid={`badge-lease-duration-${duration}`}>
                                  {duration}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

                {(property.status === "sale" || property.status === "both") && property.salePrice && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        Listing de Venta
                        <Badge variant="secondary">Venta</Badge>
                      </CardTitle>
                      <CardDescription>Información para venta de propiedad</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Precio de Venta</label>
                        <div className="flex items-center gap-1 text-xl font-semibold mt-1 text-primary">
                          <span data-testid="text-sale-price">
                            ${Number(property.salePrice).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Property Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main Details */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Título</label>
                    <p className="text-sm mt-1" data-testid="text-property-title">
                      {property.title}
                    </p>
                  </div>
                  {property.description && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                        <p className="text-sm mt-1 text-muted-foreground">
                          {property.description}
                        </p>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center gap-1 p-3 border rounded-md">
                      <Bed className="h-5 w-5 text-muted-foreground" />
                      <span className="text-lg font-semibold" data-testid="text-bedrooms">{property.bedrooms}</span>
                      <span className="text-xs text-muted-foreground">Habitaciones</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-3 border rounded-md">
                      <Bath className="h-5 w-5 text-muted-foreground" />
                      <span className="text-lg font-semibold" data-testid="text-bathrooms">{property.bathrooms}</span>
                      <span className="text-xs text-muted-foreground">Baños</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-3 border rounded-md">
                      <Square className="h-5 w-5 text-muted-foreground" />
                      <span className="text-lg font-semibold" data-testid="text-area">{property.area}</span>
                      <span className="text-xs text-muted-foreground">m²</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-3 border rounded-md">
                      <Home className="h-5 w-5 text-muted-foreground" />
                      <span className="text-lg font-semibold capitalize" data-testid="text-property-type">{property.propertyType}</span>
                      <span className="text-xs text-muted-foreground">Tipo</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex gap-2 flex-wrap">
                    {property.petFriendly && (
                      <Badge variant="secondary" className="gap-1">
                        <PawPrint className="h-3 w-3" />
                        Pet Friendly
                      </Badge>
                    )}
                    {property.allowsSubleasing && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Permite Subarriendo
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Location Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPinned className="h-5 w-5" />
                    Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                    <p className="text-sm mt-1" data-testid="text-location">{property.location}</p>
                  </div>
                  {property.condoName && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Condominio</label>
                        <p className="text-sm mt-1" data-testid="text-condominium">{property.condoName}</p>
                      </div>
                    </>
                  )}
                  {property.colonyName && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Colonia</label>
                        <p className="text-sm mt-1" data-testid="text-colony">{property.colonyName}</p>
                      </div>
                    </>
                  )}
                  {property.unitNumber && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Unidad</label>
                        <p className="text-sm mt-1" data-testid="text-unit-number">{property.unitNumber}</p>
                      </div>
                    </>
                  )}
                  {property.googleMapsUrl && (
                    <>
                      <Separator />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={() => window.open(property.googleMapsUrl!, "_blank")}
                        data-testid="button-maps"
                      >
                        <MapPin className="h-4 w-4" />
                        Ver en Google Maps
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Amenidades</CardTitle>
                  <CardDescription>{property.amenities.length} amenidades disponibles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm" data-testid={`amenity-${amenity}`}>
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="capitalize">{amenity.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {property.includedServices && (
              <ServicesSection services={property.includedServices as any} />
            )}

            {/* Access Information */}
            {property.accessInfo && (
              <AccessInfoSection accessInfo={property.accessInfo as any} />
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
            <PropertyStaffManagement propertyId={id!} />
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <PropertyVisits propertyId={id!} />
          </TabsContent>
        </Tabs>
        </>
      )}
    </div>
  );
}

// Services Section Component
function ServicesSection({ services }: { services: any }) {
  if (!services) return null;

  const hasWater = services.water || services.waterIncluded;
  const hasElectricity = services.electricity || services.electricityIncluded;
  const hasInternet = services.internet || services.internetIncluded;
  const hasAdditional = services.additionalServices && services.additionalServices.length > 0;

  if (!hasWater && !hasElectricity && !hasInternet && !hasAdditional) return null;

  const serviceIcons: Record<string, any> = {
    pool_cleaning: Waves,
    garden: Trees,
    gas: Flame,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Included Services */}
      {(hasWater || hasElectricity || hasInternet) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Servicios Incluidos</CardTitle>
            <CardDescription>Servicios incluidos en la renta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasWater && (
              <div className="flex items-start gap-3 p-3 border rounded-md" data-testid="service-water">
                <Droplet className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">Agua</p>
                    {services.water?.included || services.waterIncluded ? (
                      <Badge variant="secondary" className="gap-1" data-testid="badge-water-included">
                        <Check className="h-3 w-3" />
                        Incluido
                      </Badge>
                    ) : null}
                  </div>
                  {services.water?.provider && (
                    <p className="text-xs text-muted-foreground mt-1" data-testid="text-water-provider">
                      Proveedor: {services.water.provider}
                    </p>
                  )}
                  {services.water?.cost && (
                    <p className="text-xs text-muted-foreground" data-testid="text-water-cost">
                      Costo aprox: ${services.water.cost}/mes
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {hasElectricity && (
              <div className="flex items-start gap-3 p-3 border rounded-md" data-testid="service-electricity">
                <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">Electricidad</p>
                    {services.electricity?.included || services.electricityIncluded ? (
                      <Badge variant="secondary" className="gap-1" data-testid="badge-electricity-included">
                        <Check className="h-3 w-3" />
                        Incluido
                      </Badge>
                    ) : null}
                  </div>
                  {services.electricity?.provider && (
                    <p className="text-xs text-muted-foreground mt-1" data-testid="text-electricity-provider">
                      Proveedor: {services.electricity.provider}
                    </p>
                  )}
                  {services.electricity?.cost && (
                    <p className="text-xs text-muted-foreground" data-testid="text-electricity-cost">
                      Costo aprox: ${services.electricity.cost}
                      {services.electricity?.billingCycle === "bimonthly" ? " (bimestral)" : "/mes"}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {hasInternet && (
              <div className="flex items-start gap-3 p-3 border rounded-md" data-testid="service-internet">
                <Wifi className="h-5 w-5 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">Internet</p>
                    {services.internet?.included || services.internetIncluded ? (
                      <Badge variant="secondary" className="gap-1" data-testid="badge-internet-included">
                        <Check className="h-3 w-3" />
                        Incluido
                      </Badge>
                    ) : null}
                  </div>
                  {services.internet?.provider && (
                    <p className="text-xs text-muted-foreground mt-1" data-testid="text-internet-provider">
                      Proveedor: {services.internet.provider}
                    </p>
                  )}
                  {services.internet?.cost && (
                    <p className="text-xs text-muted-foreground" data-testid="text-internet-cost">
                      Costo aprox: ${services.internet.cost}/mes
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Services */}
      {hasAdditional && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Servicios Adicionales</CardTitle>
            <CardDescription>Servicios extra disponibles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {services.additionalServices.map((service: any, index: number) => {
              const ServiceIcon = serviceIcons[service.type] || Building2;
              return (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-md" data-testid={`additional-service-${index}`}>
                  <ServiceIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm" data-testid={`text-additional-service-name-${index}`}>
                      {service.customName || 
                        (service.type === "pool_cleaning" ? "Limpieza de Alberca" :
                         service.type === "garden" ? "Jardín" :
                         service.type === "gas" ? "Gas" : service.type)}
                    </p>
                    {service.provider && (
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-additional-service-provider-${index}`}>
                        Proveedor: {service.provider}
                      </p>
                    )}
                    {service.cost && (
                      <p className="text-xs text-muted-foreground" data-testid={`text-additional-service-cost-${index}`}>
                        Costo aprox: ${service.cost}/mes
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Access Info Section Component
function AccessInfoSection({ accessInfo }: { accessInfo: any }) {
  if (!accessInfo) return null;

  const accessType = accessInfo.accessType || accessInfo.type;
  const isUnattended = accessType === "unattended";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Key className="h-5 w-5" />
          Información de Acceso
        </CardTitle>
        <CardDescription>Configuración de acceso a la propiedad</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={isUnattended ? "secondary" : "default"} className="gap-1" data-testid="badge-access-type">
            {isUnattended ? <Lock className="h-3 w-3" /> : <User className="h-3 w-3" />}
            {isUnattended ? "Acceso Desatendido" : "Acceso Asistido"}
          </Badge>
        </div>

        <Separator />

        {isUnattended ? (
          <>
            {accessInfo.accessMethod === "lockbox" && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Método de Acceso</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm" data-testid="text-access-method">Lockbox (Caja de Llaves)</p>
                  </div>
                </div>
                {accessInfo.lockboxCode && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Código Lockbox</label>
                      <p className="text-sm mt-1 font-mono bg-muted px-3 py-2 rounded-md" data-testid="text-lockbox-code">
                        {accessInfo.lockboxCode}
                      </p>
                    </div>
                  </>
                )}
                {accessInfo.lockboxLocation && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ubicación Lockbox</label>
                      <p className="text-sm mt-1" data-testid="text-lockbox-location">{accessInfo.lockboxLocation}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {accessInfo.accessMethod === "smart_lock" && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Método de Acceso</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm" data-testid="text-access-method">Cerradura Inteligente (Smart Lock)</p>
                  </div>
                </div>
                {accessInfo.smartLockProvider && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Proveedor</label>
                      <p className="text-sm mt-1" data-testid="text-smart-lock-provider">{accessInfo.smartLockProvider}</p>
                    </div>
                  </>
                )}
                {accessInfo.smartLockInstructions && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Instrucciones</label>
                      <p className="text-sm mt-1 text-muted-foreground" data-testid="text-smart-lock-instructions">
                        {accessInfo.smartLockInstructions}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {accessInfo.contactPerson && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Persona de Contacto</label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm" data-testid="text-contact-person">{accessInfo.contactPerson}</p>
                </div>
              </div>
            )}
            {accessInfo.contactPhone && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Teléfono de Contacto</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-mono" data-testid="text-contact-phone">{accessInfo.contactPhone}</p>
                  </div>
                </div>
              </>
            )}
            {accessInfo.contactNotes && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notas Adicionales</label>
                  <p className="text-sm mt-1 text-muted-foreground" data-testid="text-contact-notes">{accessInfo.contactNotes}</p>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
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
