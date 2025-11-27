import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Plus,
  Edit2,
  Trash2,
  Home,
  DollarSign,
  Bed,
  Bath,
  MapPin,
  Calendar,
  PawPrint,
  Star,
  Eye,
  Archive,
  MoreVertical,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalPresentationCard } from "@shared/schema";

interface PresentationCardsTabProps {
  leadId?: string;
  clientId?: string;
  personName: string;
}

const PROPERTY_TYPES = [
  { value: "departamento", label: { es: "Departamento", en: "Apartment" } },
  { value: "casa", label: { es: "Casa", en: "House" } },
  { value: "estudio", label: { es: "Estudio", en: "Studio" } },
  { value: "penthouse", label: { es: "Penthouse", en: "Penthouse" } },
  { value: "townhouse", label: { es: "Townhouse", en: "Townhouse" } },
];

const MODALITIES = [
  { value: "rent", label: { es: "Renta", en: "Rent" } },
  { value: "sale", label: { es: "Venta", en: "Sale" } },
  { value: "both", label: { es: "Ambos", en: "Both" } },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  inactive: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  archived: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
};

const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  active: { es: "Activa", en: "Active" },
  inactive: { es: "Inactiva", en: "Inactive" },
  archived: { es: "Archivada", en: "Archived" },
};

interface FormData {
  title: string;
  propertyType: string;
  modality: string;
  minBudget: string;
  maxBudget: string;
  budgetText: string;
  bedrooms: string;
  bedroomsText: string;
  bathrooms: string;
  preferredZone: string;
  moveInDateText: string;
  contractDuration: string;
  hasPets: boolean;
  petsDescription: string;
  amenities: string[];
  additionalRequirements: string;
  specificProperty: string;
  isDefault: boolean;
}

const defaultFormData: FormData = {
  title: "",
  propertyType: "",
  modality: "rent",
  minBudget: "",
  maxBudget: "",
  budgetText: "",
  bedrooms: "",
  bedroomsText: "",
  bathrooms: "",
  preferredZone: "",
  moveInDateText: "",
  contractDuration: "",
  hasPets: false,
  petsDescription: "",
  amenities: [],
  additionalRequirements: "",
  specificProperty: "",
  isDefault: false,
};

export default function PresentationCardsTab({ leadId, clientId, personName }: PresentationCardsTabProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ExternalPresentationCard | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const locale = language === "es" ? es : enUS;

  const endpoint = leadId 
    ? `/api/external/presentation-cards/lead/${leadId}`
    : `/api/external/presentation-cards/client/${clientId}`;

  const { data: cards, isLoading } = useQuery<ExternalPresentationCard[]>({
    queryKey: ["presentation-cards", leadId || clientId],
    queryFn: async () => {
      const response = await fetch(endpoint, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<ExternalPresentationCard>) => {
      const res = await apiRequest("POST", "/api/external/presentation-cards", {
        ...data,
        leadId,
        clientId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presentation-cards", leadId || clientId] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: language === "es" ? "Tarjeta creada" : "Card created",
        description: language === "es" ? "La tarjeta de presentación se creó correctamente" : "Presentation card was created successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "No se pudo crear la tarjeta" : "Failed to create card",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExternalPresentationCard> }) => {
      const res = await apiRequest("PATCH", `/api/external/presentation-cards/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presentation-cards", leadId || clientId] });
      setIsEditOpen(false);
      setSelectedCard(null);
      resetForm();
      toast({
        title: language === "es" ? "Tarjeta actualizada" : "Card updated",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/external/presentation-cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presentation-cards", leadId || clientId] });
      toast({
        title: language === "es" ? "Tarjeta eliminada" : "Card deleted",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const handleCreate = () => {
    const data: Partial<ExternalPresentationCard> = {
      title: formData.title || `${language === "es" ? "Búsqueda" : "Search"} #${(cards?.length || 0) + 1}`,
      propertyType: formData.propertyType || null,
      modality: formData.modality || "rent",
      minBudget: formData.minBudget ? formData.minBudget : null,
      maxBudget: formData.maxBudget ? formData.maxBudget : null,
      budgetText: formData.budgetText || null,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bedroomsText: formData.bedroomsText || null,
      bathrooms: formData.bathrooms ? formData.bathrooms : null,
      preferredZone: formData.preferredZone || null,
      moveInDateText: formData.moveInDateText || null,
      contractDuration: formData.contractDuration || null,
      hasPets: formData.hasPets,
      petsDescription: formData.petsDescription || null,
      amenities: formData.amenities.length > 0 ? formData.amenities : [],
      additionalRequirements: formData.additionalRequirements || null,
      specificProperty: formData.specificProperty || null,
      isDefault: formData.isDefault,
    };
    createMutation.mutate(data);
  };

  const handleEdit = () => {
    if (!selectedCard) return;
    const data: Partial<ExternalPresentationCard> = {
      title: formData.title,
      propertyType: formData.propertyType || null,
      modality: formData.modality || "rent",
      minBudget: formData.minBudget ? formData.minBudget : null,
      maxBudget: formData.maxBudget ? formData.maxBudget : null,
      budgetText: formData.budgetText || null,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bedroomsText: formData.bedroomsText || null,
      bathrooms: formData.bathrooms ? formData.bathrooms : null,
      preferredZone: formData.preferredZone || null,
      moveInDateText: formData.moveInDateText || null,
      contractDuration: formData.contractDuration || null,
      hasPets: formData.hasPets,
      petsDescription: formData.petsDescription || null,
      amenities: formData.amenities.length > 0 ? formData.amenities : [],
      additionalRequirements: formData.additionalRequirements || null,
      specificProperty: formData.specificProperty || null,
      isDefault: formData.isDefault,
    };
    updateMutation.mutate({ id: selectedCard.id, data });
  };

  const openEditDialog = (card: ExternalPresentationCard) => {
    setSelectedCard(card);
    setFormData({
      title: card.title,
      propertyType: card.propertyType || "",
      modality: card.modality || "rent",
      minBudget: card.minBudget?.toString() || "",
      maxBudget: card.maxBudget?.toString() || "",
      budgetText: card.budgetText || "",
      bedrooms: card.bedrooms?.toString() || "",
      bedroomsText: card.bedroomsText || "",
      bathrooms: card.bathrooms?.toString() || "",
      preferredZone: card.preferredZone || "",
      moveInDateText: card.moveInDateText || "",
      contractDuration: card.contractDuration || "",
      hasPets: card.hasPets || false,
      petsDescription: card.petsDescription || "",
      amenities: card.amenities || [],
      additionalRequirements: card.additionalRequirements || "",
      specificProperty: card.specificProperty || "",
      isDefault: card.isDefault || false,
    });
    setIsEditOpen(true);
  };

  const archiveCard = (card: ExternalPresentationCard) => {
    updateMutation.mutate({
      id: card.id,
      data: { status: card.status === "archived" ? "active" : "archived" },
    });
  };

  const renderCardForm = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">
            {language === "es" ? "Nombre de la Búsqueda" : "Search Name"}
          </Label>
          <Input
            id="title"
            data-testid="input-card-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={language === "es" ? "Ej: Renta Corta Playa del Carmen" : "E.g.: Short Term Rental Playa"}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{language === "es" ? "Tipo de Propiedad" : "Property Type"}</Label>
            <Select
              value={formData.propertyType}
              onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
            >
              <SelectTrigger data-testid="select-property-type">
                <SelectValue placeholder={language === "es" ? "Seleccionar" : "Select"} />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label[language]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{language === "es" ? "Modalidad" : "Modality"}</Label>
            <Select
              value={formData.modality}
              onValueChange={(value) => setFormData({ ...formData, modality: value })}
            >
              <SelectTrigger data-testid="select-modality">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODALITIES.map((mod) => (
                  <SelectItem key={mod.value} value={mod.value}>
                    {mod.label[language]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{language === "es" ? "Presupuesto" : "Budget"}</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              data-testid="input-min-budget"
              type="number"
              value={formData.minBudget}
              onChange={(e) => setFormData({ ...formData, minBudget: e.target.value })}
              placeholder={language === "es" ? "Mínimo" : "Min"}
            />
            <Input
              data-testid="input-max-budget"
              type="number"
              value={formData.maxBudget}
              onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
              placeholder={language === "es" ? "Máximo" : "Max"}
            />
          </div>
          <Input
            data-testid="input-budget-text"
            value={formData.budgetText}
            onChange={(e) => setFormData({ ...formData, budgetText: e.target.value })}
            placeholder={language === "es" ? "O texto libre: 25-35mil" : "Or free text: 25-35k"}
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{language === "es" ? "Recámaras" : "Bedrooms"}</Label>
            <Input
              data-testid="input-bedrooms"
              type="number"
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
              placeholder="2"
            />
            <Input
              data-testid="input-bedrooms-text"
              value={formData.bedroomsText}
              onChange={(e) => setFormData({ ...formData, bedroomsText: e.target.value })}
              placeholder={language === "es" ? "O: 1-2" : "Or: 1-2"}
            />
          </div>
          <div className="space-y-2">
            <Label>{language === "es" ? "Baños" : "Bathrooms"}</Label>
            <Input
              data-testid="input-bathrooms"
              type="number"
              step="0.5"
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
              placeholder="1.5"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{language === "es" ? "Zona Preferida" : "Preferred Zone"}</Label>
          <Input
            data-testid="input-zone"
            value={formData.preferredZone}
            onChange={(e) => setFormData({ ...formData, preferredZone: e.target.value })}
            placeholder={language === "es" ? "La Veleta, Aldea Zama..." : "La Veleta, Aldea Zama..."}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{language === "es" ? "Fecha de Entrada" : "Move-in Date"}</Label>
            <Input
              data-testid="input-movein"
              value={formData.moveInDateText}
              onChange={(e) => setFormData({ ...formData, moveInDateText: e.target.value })}
              placeholder={language === "es" ? "Noviembre, Inmediato" : "November, ASAP"}
            />
          </div>
          <div className="space-y-2">
            <Label>{language === "es" ? "Duración" : "Duration"}</Label>
            <Input
              data-testid="input-duration"
              value={formData.contractDuration}
              onChange={(e) => setFormData({ ...formData, contractDuration: e.target.value })}
              placeholder={language === "es" ? "6 meses, 1 año" : "6 months, 1 year"}
            />
          </div>
        </div>

        <div className="space-y-3 p-3 rounded-md border">
          <div className="flex items-center justify-between">
            <Label htmlFor="has-pets" className="flex items-center gap-2">
              <PawPrint className="w-4 h-4" />
              {language === "es" ? "¿Tiene Mascotas?" : "Has Pets?"}
            </Label>
            <Switch
              id="has-pets"
              data-testid="switch-pets"
              checked={formData.hasPets}
              onCheckedChange={(checked) => setFormData({ ...formData, hasPets: checked })}
            />
          </div>
          {formData.hasPets && (
            <Input
              data-testid="input-pets-desc"
              value={formData.petsDescription}
              onChange={(e) => setFormData({ ...formData, petsDescription: e.target.value })}
              placeholder={language === "es" ? "Descripción: 2 perros pequeños" : "Description: 2 small dogs"}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>{language === "es" ? "Propiedad Específica" : "Specific Property"}</Label>
          <Input
            data-testid="input-specific-property"
            value={formData.specificProperty}
            onChange={(e) => setFormData({ ...formData, specificProperty: e.target.value })}
            placeholder={language === "es" ? "Naia Naay E302" : "Naia Naay E302"}
          />
        </div>

        <div className="space-y-2">
          <Label>{language === "es" ? "Requisitos Adicionales" : "Additional Requirements"}</Label>
          <Textarea
            data-testid="input-requirements"
            value={formData.additionalRequirements}
            onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
            placeholder={language === "es" ? "Alberca, Gym, Estacionamiento..." : "Pool, Gym, Parking..."}
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-md border">
          <Label htmlFor="is-default" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            {language === "es" ? "Búsqueda Principal" : "Primary Search"}
          </Label>
          <Switch
            id="is-default"
            data-testid="switch-default"
            checked={formData.isDefault}
            onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
          />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {language === "es" ? "Tarjetas de Presentación" : "Presentation Cards"}
        </h3>
        <Button 
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          size="sm"
          data-testid="button-add-card"
        >
          <Plus className="w-4 h-4 mr-2" />
          {language === "es" ? "Nueva Tarjeta" : "New Card"}
        </Button>
      </div>

      {(!cards || cards.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Home className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {language === "es" 
                ? `${personName} no tiene tarjetas de presentación aún`
                : `${personName} has no presentation cards yet`}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              data-testid="button-create-first-card"
            >
              <Plus className="w-4 h-4 mr-2" />
              {language === "es" ? "Crear Primera Tarjeta" : "Create First Card"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <Card key={card.id} className={card.status === "archived" ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base">
                      {card.title}
                    </CardTitle>
                    {card.isDefault && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className={STATUS_COLORS[card.status]}>
                      {STATUS_LABELS[card.status]?.[language] || card.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-card-menu-${card.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(card)} data-testid={`button-edit-card-${card.id}`}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          {language === "es" ? "Editar" : "Edit"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => archiveCard(card)} data-testid={`button-archive-card-${card.id}`}>
                          <Archive className="w-4 h-4 mr-2" />
                          {card.status === "archived" 
                            ? (language === "es" ? "Activar" : "Activate")
                            : (language === "es" ? "Archivar" : "Archive")}
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive"
                              data-testid={`button-delete-card-${card.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {language === "es" ? "Eliminar" : "Delete"}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {language === "es" ? "¿Eliminar tarjeta?" : "Delete card?"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {language === "es" 
                                  ? "Esta acción no se puede deshacer. Se eliminará la tarjeta y todo su historial."
                                  : "This action cannot be undone. The card and all its history will be deleted."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{language === "es" ? "Cancelar" : "Cancel"}</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteMutation.mutate(card.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {language === "es" ? "Eliminar" : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {card.propertyType && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Home className="w-3.5 h-3.5" />
                      <span>{PROPERTY_TYPES.find(t => t.value === card.propertyType)?.label[language] || card.propertyType}</span>
                    </div>
                  )}
                  {(card.minBudget || card.maxBudget || card.budgetText) && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>
                        {card.budgetText || (
                          card.minBudget && card.maxBudget 
                            ? `$${card.minBudget} - $${card.maxBudget}`
                            : card.minBudget ? `> $${card.minBudget}` : `< $${card.maxBudget}`
                        )}
                      </span>
                    </div>
                  )}
                  {(card.bedrooms || card.bedroomsText) && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Bed className="w-3.5 h-3.5" />
                      <span>{card.bedroomsText || card.bedrooms}</span>
                    </div>
                  )}
                  {card.bathrooms && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Bath className="w-3.5 h-3.5" />
                      <span>{card.bathrooms}</span>
                    </div>
                  )}
                  {card.preferredZone && (
                    <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{card.preferredZone}</span>
                    </div>
                  )}
                  {(card.moveInDateText || card.contractDuration) && (
                    <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        {[card.moveInDateText, card.contractDuration].filter(Boolean).join(" • ")}
                      </span>
                    </div>
                  )}
                  {card.hasPets && (
                    <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                      <PawPrint className="w-3.5 h-3.5" />
                      <span>{card.petsDescription || (language === "es" ? "Con mascotas" : "Has pets")}</span>
                    </div>
                  )}
                </div>
                {card.specificProperty && (
                  <p className="text-sm font-medium text-primary">
                    {language === "es" ? "Busca:" : "Looking for:"} {card.specificProperty}
                  </p>
                )}
              </CardContent>
              <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{card.usageCount} {language === "es" ? "visitas" : "showings"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{format(new Date(card.createdAt), "d MMM yyyy", { locale })}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Nueva Tarjeta de Presentación" : "New Presentation Card"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Define los criterios de búsqueda para este cliente"
                : "Define search criteria for this client"}
            </DialogDescription>
          </DialogHeader>
          {renderCardForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={createMutation.isPending}
              data-testid="button-save-new-card"
            >
              {createMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {language === "es" ? "Guardando..." : "Saving..."}
                </span>
              ) : (
                language === "es" ? "Crear Tarjeta" : "Create Card"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Editar Tarjeta" : "Edit Card"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Modifica los criterios de búsqueda"
                : "Modify search criteria"}
            </DialogDescription>
          </DialogHeader>
          {renderCardForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              onClick={handleEdit} 
              disabled={updateMutation.isPending}
              data-testid="button-save-edit-card"
            >
              {updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {language === "es" ? "Guardando..." : "Saving..."}
                </span>
              ) : (
                language === "es" ? "Guardar Cambios" : "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
