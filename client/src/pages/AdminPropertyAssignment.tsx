import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
    queryKey: ["/api/admin/properties"],
  });

  const { data: allUsers = [], isLoading: loadingOwners } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  // Filter only users with owner or seller role
  const owners = allUsers.filter(user => ["owner", "seller"].includes(user.role));

  const reassignMutation = useMutation({
    mutationFn: async ({ propertyId, newOwnerId }: { propertyId: string; newOwnerId: string }) => {
      return await apiRequest("PATCH", `/api/properties/${propertyId}/reassign-owner`, { newOwnerId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: t("propertyReassigned"),
        description: t("propertyReassignedSuccess"),
      });
      setSelectedOwners(prev => {
        const newState = { ...prev };
        delete newState[variables.propertyId];
        return newState;
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("propertyReassignError"),
        variant: "destructive",
      });
    },
  });

  const handleReassign = (propertyId: string) => {
    const newOwnerId = selectedOwners[propertyId];
    if (!newOwnerId) {
      toast({
        title: t("error"),
        description: t("selectOwnerFirst"),
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
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-md">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-[250px]" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-property-assignment">
          {t("assignProperties")}
        </h1>
        <p className="text-muted-foreground">
          {t("assignPropertiesDescription")}
        </p>
      </div>

      <Card data-testid="card-property-list">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>{t("properties")} ({properties.length})</CardTitle>
          </div>
          <CardDescription>
            {t("assignPropertiesHint")}
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
                      {t("currentOwner")}:
                    </span>
                    <span data-testid={`current-owner-${property.id}`}>
                      {getOwnerName(property.ownerId)}
                    </span>
                  </div>
                  {property.approvalStatus && (
                    <Badge variant={property.approvalStatus === "approved" ? "default" : "secondary"} data-testid={`badge-status-${property.id}`}>
                      {property.approvalStatus === "approved" ? t("approved") : 
                       property.approvalStatus === "pending" ? t("pending") :
                       t("draft")}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={selectedOwners[property.id] || ""}
                    onValueChange={(value) => setSelectedOwners(prev => ({ ...prev, [property.id]: value }))}
                  >
                    <SelectTrigger className="w-[250px]" data-testid={`select-owner-${property.id}`}>
                      <SelectValue placeholder={t("selectNewOwner")} />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id} data-testid={`owner-option-${owner.id}`}>
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
                    {t("reassign")}
                  </Button>
                </div>
              </div>
            ))}

            {properties.length === 0 && (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-properties">
                {t("noProperties")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
