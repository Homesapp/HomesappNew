import { useState } from "react";
import { ClientPresentationCard } from "@/components/ClientPresentationCard";
import { PresentationCardFormDialog } from "@/components/PresentationCardFormDialog";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { usePresentationCards, useMatchPropertiesForCard } from "@/hooks/usePresentationCards";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PropertyCard } from "@/components/PropertyCard";
import type { Property, User, PresentationCard } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getPropertyTitle } from "@/lib/propertyHelpers";

const MAX_CARDS = 3;

export default function PresentationCards() {
  const { user } = useAuth();
  const { data: cards, isLoading, error } = usePresentationCards(user?.id);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [matchesDialogOpen, setMatchesDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PresentationCard | undefined>(undefined);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const { toast } = useToast();
  
  const { data: matchingProperties = [], isLoading: matchesLoading } = useMatchPropertiesForCard(
    selectedCardId || ""
  );

  const toggleActiveMutation = useMutation({
    mutationFn: async (cardId: string) => {
      return apiRequest("PATCH", `/api/presentation-cards/${cardId}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentation-cards"] });
      toast({
        title: "Tarjeta actualizada",
        description: "La tarjeta ha sido activada para recibir oportunidades",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo activar la tarjeta",
        variant: "destructive",
      });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      return apiRequest("DELETE", `/api/presentation-cards/${cardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentation-cards"] });
      toast({
        title: "Tarjeta eliminada",
        description: "La tarjeta de presentación ha sido eliminada",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la tarjeta",
        variant: "destructive",
      });
    },
  });

  const handleViewMatches = (cardId: string) => {
    setSelectedCardId(cardId);
    setMatchesDialogOpen(true);
  };

  const handleNewCard = () => {
    if (cards && cards.length >= MAX_CARDS) {
      toast({
        title: "Límite alcanzado",
        description: `Solo puedes tener hasta ${MAX_CARDS} tarjetas de presentación activas`,
        variant: "destructive",
      });
      return;
    }
    setFormMode("create");
    setEditingCard(undefined);
    setFormDialogOpen(true);
  };

  const handleEditCard = (card: PresentationCard) => {
    setFormMode("edit");
    setEditingCard(card);
    setFormDialogOpen(true);
  };

  const handleToggleActive = (cardId: string) => {
    toggleActiveMutation.mutate(cardId);
  };

  const handleDeleteCard = (cardId: string) => {
    deleteCardMutation.mutate(cardId);
  };

  const getClientName = (card: any) => {
    return `${(card.client as User)?.firstName || ""} ${(card.client as User)?.lastName || ""}`.trim() || "Cliente";
  };

  const canCreateCard = !cards || cards.length < MAX_CARDS;
  const activeCardsCount = cards?.filter(c => c.isActive).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tarjetas de Presentación</h1>
            <p className="text-muted-foreground">
              Perfiles de búsqueda de clientes ({cards?.length || 0}/{MAX_CARDS})
            </p>
          </div>
          <Button data-testid="button-new-card" onClick={handleNewCard} disabled>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarjeta
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-64" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tarjetas de Presentación</h1>
            <p className="text-muted-foreground">
              Perfiles de búsqueda de clientes ({cards?.length || 0}/{MAX_CARDS})
            </p>
          </div>
          <Button data-testid="button-new-card" onClick={handleNewCard} disabled={!canCreateCard}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarjeta
          </Button>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">Error al cargar las tarjetas: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tarjetas de Presentación</h1>
          <p className="text-muted-foreground">
            Perfiles de búsqueda de clientes ({cards?.length || 0}/{MAX_CARDS})
            {activeCardsCount > 0 && ` • ${activeCardsCount} activa${activeCardsCount > 1 ? 's' : ''}`}
          </p>
        </div>
        <Button 
          data-testid="button-new-card" 
          onClick={handleNewCard}
          disabled={!canCreateCard}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarjeta
        </Button>
      </div>

      {!canCreateCard && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Has alcanzado el límite de {MAX_CARDS} tarjetas de presentación. Elimina una existente para crear una nueva.
          </AlertDescription>
        </Alert>
      )}

      {cards && cards.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Solo una tarjeta puede estar activa a la vez. La tarjeta activa recibirá sugerencias automáticas y recomendaciones de vendedores.
          </AlertDescription>
        </Alert>
      )}

      <PresentationCardFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        card={editingCard}
        mode={formMode}
      />

      {!cards || cards.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No hay tarjetas de presentación aún</p>
            <p className="text-sm text-muted-foreground mt-2">
              Crea una nueva tarjeta para empezar a recibir oportunidades personalizadas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            return (
              <PresentationCardWithMatches
                key={card.id}
                card={card}
                clientName={getClientName(card)}
                onViewMatches={() => handleViewMatches(card.id)}
                onEdit={() => handleEditCard(card)}
                onToggleActive={() => handleToggleActive(card.id)}
                onDelete={() => handleDeleteCard(card.id)}
              />
            );
          })}
        </div>
      )}

      <Dialog open={matchesDialogOpen} onOpenChange={setMatchesDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Propiedades Coincidentes</DialogTitle>
          </DialogHeader>
          {matchesLoading ? (
            <div className="grid gap-6 md:grid-cols-2 py-4">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-48" />
                </Card>
              ))}
            </div>
          ) : matchingProperties.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No se encontraron propiedades que coincidan con esta tarjeta
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 py-4">
              {matchingProperties.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  id={property.id}
                  title={getPropertyTitle(property)}
                  price={Number(property.price)}
                  bedrooms={property.bedrooms}
                  bathrooms={Number(property.bathrooms)}
                  area={Number(property.area)}
                  location={property.location}
                  status={property.status}
                  image={property.primaryImages?.[property.coverImageIndex || 0] || property.images?.[0]}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PresentationCardWithMatches({ 
  card, 
  clientName, 
  onViewMatches,
  onEdit,
  onToggleActive,
  onDelete,
}: { 
  card: any; 
  clientName: string; 
  onViewMatches: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const { data: matchingProperties = [] } = useMatchPropertiesForCard(card.id);
  const matchCount = matchingProperties.length;

  return (
    <ClientPresentationCard
      id={card.id}
      clientName={clientName}
      propertyType={card.propertyType}
      modality={card.modality}
      minPrice={parseFloat(card.minPrice)}
      maxPrice={parseFloat(card.maxPrice)}
      location={card.location}
      bedrooms={card.bedrooms || undefined}
      bathrooms={card.bathrooms || undefined}
      amenities={card.amenities || []}
      matchCount={matchCount}
      isActive={card.isActive}
      onSave={onEdit}
      onShare={() => console.log("Compartir tarjeta", card.id)}
      onViewMatches={onViewMatches}
      onToggleActive={onToggleActive}
      onDelete={onDelete}
    />
  );
}
