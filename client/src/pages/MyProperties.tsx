import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Building2, MapPin, Bed, Bath, Square, Clock, CheckCircle, XCircle, AlertCircle, Plus, MoreVertical, Edit, Eye, Calendar, PawPrint } from "lucide-react";
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

export default function MyProperties() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

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
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
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
        <Button 
          onClick={() => setLocation("/owner/property/new")}
          data-testid="button-add-property"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Propiedad
        </Button>
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
                          {property.petFriendly && (
                            <PawPrint className="h-3 w-3 ml-0.5" title="Pet Friendly" />
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {property.price && (
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline">
                              Renta
                            </Badge>
                            <span className="text-sm font-bold" data-testid={`text-property-price-rental-${property.id}`}>
                              ${Number(property.price).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {property.salePrice && (
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline">
                              Venta
                            </Badge>
                            <span className="text-sm font-bold" data-testid={`text-property-price-sale-${property.id}`}>
                              ${Number(property.salePrice).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
