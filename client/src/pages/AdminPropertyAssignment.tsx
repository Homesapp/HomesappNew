import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, User, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Property, User as UserType } from "@shared/schema";

export default function AdminPropertyAssignment() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedOwners, setSelectedOwners] = useState<Record<string, string>>({});

  const { data: properties = [], isLoading: loadingProperties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: owners = [], isLoading: loadingOwners } = useQuery<UserType[]>({
    queryKey: ["/api/users?role=owner"],
  });

  const reassignMutation = useMutation({
    mutationFn: async ({ propertyId, newOwnerId }: { propertyId: string; newOwnerId: string }) => {
      return await apiRequest("PATCH", `/api/properties/${propertyId}/reassign-owner`, { newOwnerId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: t.propertyReassigned || "Propiedad reasignada",
        description: t.propertyReassignedSuccess || "El propietario de la propiedad ha sido actualizado exitosamente",
      });
      setSelectedOwners(prev => {
        const newState = { ...prev };
        delete newState[variables.propertyId];
        return newState;
      });
    },
    onError: (error: any) => {
      toast({
        title: t.error || "Error",
        description: error.message || t.propertyReassignError || "No se pudo reasignar la propiedad",
        variant: "destructive",
      });
    },
  });

  const handleReassign = (propertyId: string) => {
    const newOwnerId = selectedOwners[propertyId];
    if (!newOwnerId) {
      toast({
        title: t.error || "Error",
        description: t.selectOwnerFirst || "Selecciona un propietario primero",
        variant: "destructive",
      });
      return;
    }
    reassignMutation.mutate({ propertyId, newOwnerId });
  };

  const getOwnerName = (ownerId: string) => {
    const owner = owners.find(o => o.id === ownerId);
    return owner ? `${owner.firstName} ${owner.lastName}` : ownerId;
  };

  if (loadingProperties || loadingOwners) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">{t.loading || "Cargando"}...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-property-assignment">
          {t.assignProperties || "Asignar Propiedades"}
        </h1>
        <p className="text-muted-foreground">
          {t.assignPropertiesDescription || "Reasigna propiedades a sus propietarios reales"}
        </p>
      </div>

      <Card data-testid="card-property-list">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>{t.properties || "Propiedades"} ({properties.length})</CardTitle>
          </div>
          <CardDescription>
            {t.assignPropertiesHint || "Selecciona el nuevo propietario para cada propiedad"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {properties.map((property) => (
              <div
                key={property.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-md"
                data-testid={`property-item-${property.id}`}
              >
                <div className="flex-1 space-y-1">
                  <div className="font-medium" data-testid={`property-title-${property.id}`}>
                    {property.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {property.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3" />
                    <span className="text-muted-foreground">
                      {t.currentOwner || "Propietario actual"}:
                    </span>
                    <span data-testid={`current-owner-${property.id}`}>
                      {getOwnerName(property.ownerId)}
                    </span>
                  </div>
                  {property.approvalStatus && (
                    <Badge variant={property.approvalStatus === "approved" ? "default" : "secondary"}>
                      {property.approvalStatus === "approved" ? t.approved || "Aprobada" : 
                       property.approvalStatus === "pending" ? t.pending || "Pendiente" :
                       t.draft || "Borrador"}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={selectedOwners[property.id] || ""}
                    onValueChange={(value) => setSelectedOwners(prev => ({ ...prev, [property.id]: value }))}
                  >
                    <SelectTrigger className="w-[250px]" data-testid={`select-owner-${property.id}`}>
                      <SelectValue placeholder={t.selectNewOwner || "Seleccionar nuevo propietario"} />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.firstName} {owner.lastName} ({owner.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => handleReassign(property.id)}
                    disabled={!selectedOwners[property.id] || reassignMutation.isPending}
                    size="sm"
                    data-testid={`button-reassign-${property.id}`}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t.reassign || "Reasignar"}
                  </Button>
                </div>
              </div>
            ))}

            {properties.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t.noProperties || "No hay propiedades para asignar"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
