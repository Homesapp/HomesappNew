import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Building2, MapPin, DollarSign, Bed, Bath, Square, Clock, CheckCircle, XCircle, AlertCircle, Plus, LayoutGrid, List, LayoutList, MoreVertical, Edit, Eye, Calendar } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Property } from "@shared/schema";

const approvalStatusLabels: Record<string, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  pending_review: "En Revisión",
  approved: "Aprobado",
  published: "Publicado",
  rejected: "Rechazado",
};

const approvalStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  pending: "outline",
  pending_review: "outline",
  approved: "default",
  published: "default",
  rejected: "destructive",
};

const approvalStatusIcons: Record<string, typeof Clock> = {
  draft: AlertCircle,
  pending: Clock,
  pending_review: Clock,
  approved: CheckCircle,
  published: CheckCircle,
  rejected: XCircle,
};

type ViewMode = "grid" | "list" | "compact";

export default function MyProperties() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("compact");

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/owner/properties"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Mis Propiedades</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y administra tus propiedades
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)}>
            <ToggleGroupItem value="grid" aria-label="Vista cuadrícula" data-testid="toggle-view-grid">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vista lista" data-testid="toggle-view-list">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="compact" aria-label="Vista compacta" data-testid="toggle-view-compact">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button 
            onClick={() => setLocation("/owner/property/new")}
            data-testid="button-add-property"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Propiedad
          </Button>
        </div>
      </div>

      {properties.length === 0 ? (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes propiedades</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza agregando tu primera propiedad para gestionar y administrar.
            </p>
            <Button onClick={() => setLocation("/owner/property/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primera Propiedad
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Vista Cuadrícula */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => {
                const statusKey = property.approvalStatus || "draft";
                const StatusIcon = approvalStatusIcons[statusKey] || AlertCircle;
                
                return (
                  <Card
                    key={property.id}
                    className="overflow-hidden hover-elevate"
                    data-testid={`card-property-${property.id}`}
                  >
                    <div 
                      className="aspect-video relative overflow-hidden bg-muted cursor-pointer"
                      onClick={() => setLocation(`/owner/property/${property.id}`)}
                    >
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={approvalStatusColors[statusKey] || "secondary"}
                          className="gap-1"
                        >
                          <StatusIcon className="h-3 w-3" />
                          {approvalStatusLabels[statusKey] || statusKey}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle 
                          className="line-clamp-1 cursor-pointer hover:text-primary"
                          onClick={() => setLocation(`/owner/property/${property.id}`)}
                          data-testid={`text-property-title-${property.id}`}
                        >
                          {property.title}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              data-testid={`button-menu-${property.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setLocation(`/owner/property/${property.id}`)}
                              data-testid={`menu-view-${property.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setLocation(`/owner/property/${property.id}/edit`)}
                              data-testid={`menu-edit-${property.id}`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setLocation(`/owner/appointments`)}
                              data-testid={`menu-appointments-${property.id}`}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Ver Citas
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{property.location}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <DollarSign className="h-5 w-5" />
                        <span data-testid={`text-property-price-${property.id}`}>
                          ${Number(property.price).toLocaleString()}
                        </span>
                        {(property.status === "rent" || property.status === "both") && (
                          <span className="text-sm font-normal text-muted-foreground">/mes</span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          <span>{property.bedrooms}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4 text-muted-foreground" />
                          <span>{property.bathrooms}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Square className="h-4 w-4 text-muted-foreground" />
                          <span>{property.area}m²</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Vista Lista */}
          {viewMode === "list" && (
            <div className="space-y-4">
              {properties.map((property) => {
                const statusKey = property.approvalStatus || "draft";
                const StatusIcon = approvalStatusIcons[statusKey] || AlertCircle;
                
                return (
                  <Card
                    key={property.id}
                    className="hover-elevate"
                    data-testid={`card-property-${property.id}`}
                  >
                    <div className="flex flex-col md:flex-row gap-4 p-4">
                      <div 
                        className="w-full md:w-64 aspect-video md:aspect-auto md:h-40 relative overflow-hidden bg-muted rounded-md flex-shrink-0 cursor-pointer"
                        onClick={() => setLocation(`/owner/property/${property.id}`)}
                      >
                        {property.images && property.images.length > 0 ? (
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 
                              className="text-xl font-semibold line-clamp-1 cursor-pointer hover:text-primary"
                              onClick={() => setLocation(`/owner/property/${property.id}`)}
                              data-testid={`text-property-title-${property.id}`}
                            >
                              {property.title}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge
                                variant={approvalStatusColors[statusKey] || "secondary"}
                                className="gap-1"
                              >
                                <StatusIcon className="h-3 w-3" />
                                {approvalStatusLabels[statusKey] || statusKey}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    data-testid={`button-menu-${property.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => setLocation(`/owner/property/${property.id}`)}
                                    data-testid={`menu-view-${property.id}`}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Detalles
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setLocation(`/owner/property/${property.id}/edit`)}
                                    data-testid={`menu-edit-${property.id}`}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setLocation(`/owner/appointments`)}
                                    data-testid={`menu-appointments-${property.id}`}
                                  >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Ver Citas
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{property.location}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                            <div className="flex items-center gap-1">
                              <Bed className="h-4 w-4 text-muted-foreground" />
                              <span>{property.bedrooms} rec</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bath className="h-4 w-4 text-muted-foreground" />
                              <span>{property.bathrooms} baños</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Square className="h-4 w-4 text-muted-foreground" />
                              <span>{property.area}m²</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xl font-bold">
                          <DollarSign className="h-5 w-5" />
                          <span data-testid={`text-property-price-${property.id}`}>
                            ${Number(property.price).toLocaleString()}
                          </span>
                          {(property.status === "rent" || property.status === "both") && (
                            <span className="text-sm font-normal text-muted-foreground">/mes</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Vista Compacta */}
          {viewMode === "compact" && (
            <div className="space-y-2">
              {properties.map((property) => {
                const statusKey = property.approvalStatus || "draft";
                const StatusIcon = approvalStatusIcons[statusKey] || AlertCircle;
                
                return (
                  <Card
                    key={property.id}
                    className="hover-elevate"
                    data-testid={`card-property-${property.id}`}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div 
                        className="w-20 h-20 relative overflow-hidden bg-muted rounded-md flex-shrink-0 cursor-pointer"
                        onClick={() => setLocation(`/owner/property/${property.id}`)}
                      >
                        {property.images && property.images.length > 0 ? (
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 
                            className="font-semibold line-clamp-1 cursor-pointer hover:text-primary"
                            onClick={() => setLocation(`/owner/property/${property.id}`)}
                            data-testid={`text-property-title-${property.id}`}
                          >
                            {property.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              variant={approvalStatusColors[statusKey] || "secondary"}
                              className="gap-1 text-xs"
                            >
                              <StatusIcon className="h-2.5 w-2.5" />
                              {approvalStatusLabels[statusKey] || statusKey}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  data-testid={`button-menu-${property.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setLocation(`/owner/property/${property.id}`)}
                                  data-testid={`menu-view-${property.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setLocation(`/owner/property/${property.id}/edit`)}
                                  data-testid={`menu-edit-${property.id}`}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setLocation(`/owner/appointments`)}
                                  data-testid={`menu-appointments-${property.id}`}
                                >
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Ver Citas
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{property.location}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Bed className="h-3 w-3" />
                              {property.bedrooms}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bath className="h-3 w-3" />
                              {property.bathrooms}
                            </span>
                            <span className="flex items-center gap-1">
                              <Square className="h-3 w-3" />
                              {property.area}m²
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-bold flex-shrink-0">
                            <DollarSign className="h-4 w-4" />
                            <span data-testid={`text-property-price-${property.id}`}>
                              ${Number(property.price).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
