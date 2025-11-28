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

interface LeadPreferences {
  estimatedRentCost?: number | null;
  estimatedRentCostText?: string | null;
  bedrooms?: number | null;
  bedroomsText?: string | null;
  desiredUnitType?: string | null;
  desiredNeighborhood?: string | null;
  contractDuration?: string | null;
  hasPets?: string | null;
}

interface PresentationCardsTabProps {
  leadId?: string;
  clientId?: string;
  personName: string;
  leadPreferences?: LeadPreferences;
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

export default function PresentationCardsTab({ leadId, clientId, personName, leadPreferences }: PresentationCardsTabProps) {
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
        description: language === "es" ? "La tarjeta de presentación se actualizó correctamente" : "Presentation card was updated successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "No se pudo actualizar la tarjeta" : "Failed to update card",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/external/presentation-cards/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presentation-cards", leadId || clientId] });
      toast({
        title: language === "es" ? "Tarjeta eliminada" : "Card deleted",
        description: language === "es" ? "La tarjeta de presentación se eliminó correctamente" : "Presentation card was deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "No se pudo eliminar la tarjeta" : "Failed to delete card",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setSelectedCard(null);
  };

  const handleCreate = () => {
    createMutation.mutate({
      title: formData.title || `${language === "es" ? "Búsqueda de" : "Search for"} ${personName}`,
      propertyType: formData.propertyType,
      modality: formData.modality,
      minBudget: formData.minBudget || null,
      maxBudget: formData.maxBudget || null,
      budgetText: formData.budgetText,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bedroomsText: formData.bedroomsText,
      bathrooms: formData.bathrooms || null,
      preferredZone: formData.preferredZone,
      moveInDateText: formData.moveInDateText,
      contractDuration: formData.contractDuration,
      hasPets: formData.hasPets,
      petsDescription: formData.petsDescription,
      amenities: formData.amenities,
      additionalRequirements: formData.additionalRequirements,
      specificProperty: formData.specificProperty,
      isDefault: formData.isDefault,
      status: "active",
    });
  };

  const handleEdit = () => {
    if (!selectedCard) return;
    updateMutation.mutate({
      id: selectedCard.id,
      data: {
        title: formData.title,
        propertyType: formData.propertyType,
        modality: formData.modality,
        minBudget: formData.minBudget || null,
        maxBudget: formData.maxBudget || null,
        budgetText: formData.budgetText,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bedroomsText: formData.bedroomsText,
        bathrooms: formData.bathrooms || null,
        preferredZone: formData.preferredZone,
        moveInDateText: formData.moveInDateText,
        contractDuration: formData.contractDuration,
        hasPets: formData.hasPets,
        petsDescription: formData.petsDescription,
        amenities: formData.amenities,
        additionalRequirements: formData.additionalRequirements,
        specificProperty: formData.specificProperty,
        isDefault: formData.isDefault,
      },
    });
  };

  const openEdit = (card: ExternalPresentationCard) => {
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

  const toggleStatus = (card: ExternalPresentationCard) => {
    const newStatus = card.status === "active" ? "inactive" : "active";
    updateMutation.mutate({
      id: card.id,
      data: { status: newStatus },
    });
  };

  const hasPreferences = leadPreferences && (
    leadPreferences.estimatedRentCost || 
    leadPreferences.estimatedRentCostText || 
    leadPreferences.bedrooms || 
    leadPreferences.desiredNeighborhood || 
    leadPreferences.desiredUnitType
  );

  const initFormFromPreferences = () => {
    if (!leadPreferences) return;
    setFormData({
      ...defaultFormData,
      title: `${language === "es" ? "Búsqueda de" : "Search for"} ${personName}`,
      propertyType: leadPreferences.desiredUnitType?.toLowerCase() || "",
      budgetText: leadPreferences.estimatedRentCostText || "",
      minBudget: leadPreferences.estimatedRentCost ? String(Math.round(leadPreferences.estimatedRentCost * 0.85)) : "",
      maxBudget: leadPreferences.estimatedRentCost ? String(Math.round(leadPreferences.estimatedRentCost * 1.15)) : "",
      bedrooms: leadPreferences.bedrooms ? String(leadPreferences.bedrooms) : "",
      bedroomsText: leadPreferences.bedroomsText || "",
      preferredZone: leadPreferences.desiredNeighborhood || "",
      contractDuration: leadPreferences.contractDuration || "",
      hasPets: leadPreferences.hasPets && leadPreferences.hasPets !== "No" ? true : false,
      petsDescription: leadPreferences.hasPets && leadPreferences.hasPets !== "No" ? leadPreferences.hasPets : "",
    });
    setIsCreateOpen(true);
  };

  const renderCardForm = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div>
        <Label>{language === "es" ? "Título" : "Title"}</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder={language === "es" ? "Ej: Búsqueda principal" : "E.g: Main search"}
          data-testid="input-card-title"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{language === "es" ? "Tipo de propiedad" : "Property type"}</Label>
          <Select value={formData.propertyType} onValueChange={(v) => setFormData({ ...formData, propertyType: v })}>
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
        <div>
          <Label>{language === "es" ? "Modalidad" : "Modality"}</Label>
          <Select value={formData.modality} onValueChange={(v) => setFormData({ ...formData, modality: v })}>
            <SelectTrigger data-testid="select-modality">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODALITIES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label[language]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>{language === "es" ? "Presupuesto (texto)" : "Budget (text)"}</Label>
        <Input
          value={formData.budgetText}
          onChange={(e) => setFormData({ ...formData, budgetText: e.target.value })}
          placeholder={language === "es" ? "Ej: 20-30 mil" : "E.g: 20-30k"}
          data-testid="input-budget-text"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{language === "es" ? "Presupuesto mín" : "Min budget"}</Label>
          <Input
            type="number"
            value={formData.minBudget}
            onChange={(e) => setFormData({ ...formData, minBudget: e.target.value })}
            placeholder="15000"
            data-testid="input-min-budget"
          />
        </div>
        <div>
          <Label>{language === "es" ? "Presupuesto máx" : "Max budget"}</Label>
          <Input
            type="number"
            value={formData.maxBudget}
            onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
            placeholder="30000"
            data-testid="input-max-budget"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{language === "es" ? "Recámaras" : "Bedrooms"}</Label>
          <Input
            type="number"
            value={formData.bedrooms}
            onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
            placeholder="2"
            data-testid="input-bedrooms"
          />
        </div>
        <div>
          <Label>{language === "es" ? "Baños" : "Bathrooms"}</Label>
          <Input
            type="number"
            value={formData.bathrooms}
            onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
            placeholder="2"
            data-testid="input-bathrooms"
          />
        </div>
      </div>

      <div>
        <Label>{language === "es" ? "Zona preferida" : "Preferred zone"}</Label>
        <Input
          value={formData.preferredZone}
          onChange={(e) => setFormData({ ...formData, preferredZone: e.target.value })}
          placeholder={language === "es" ? "Ej: Aldea Zama, Centro" : "E.g: Downtown, Beach area"}
          data-testid="input-zone"
        />
      </div>

      <div>
        <Label>{language === "es" ? "Duración del contrato" : "Contract duration"}</Label>
        <Input
          value={formData.contractDuration}
          onChange={(e) => setFormData({ ...formData, contractDuration: e.target.value })}
          placeholder={language === "es" ? "Ej: 12 meses" : "E.g: 12 months"}
          data-testid="input-contract-duration"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>{language === "es" ? "¿Tiene mascotas?" : "Has pets?"}</Label>
        <Switch
          checked={formData.hasPets}
          onCheckedChange={(v) => setFormData({ ...formData, hasPets: v })}
          data-testid="switch-pets"
        />
      </div>

      {formData.hasPets && (
        <div>
          <Label>{language === "es" ? "Descripción de mascotas" : "Pets description"}</Label>
          <Input
            value={formData.petsDescription}
            onChange={(e) => setFormData({ ...formData, petsDescription: e.target.value })}
            placeholder={language === "es" ? "Ej: 1 perro pequeño" : "E.g: 1 small dog"}
            data-testid="input-pets-description"
          />
        </div>
      )}

      <div>
        <Label>{language === "es" ? "Requisitos adicionales" : "Additional requirements"}</Label>
        <Textarea
          value={formData.additionalRequirements}
          onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
          placeholder={language === "es" ? "Otros requisitos..." : "Other requirements..."}
          data-testid="textarea-requirements"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>{language === "es" ? "Tarjeta predeterminada" : "Default card"}</Label>
        <Switch
          checked={formData.isDefault}
          onCheckedChange={(v) => setFormData({ ...formData, isDefault: v })}
          data-testid="switch-default"
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
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
        hasPreferences ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="w-4 h-4 text-primary" />
                  {language === "es" ? "Preferencias de Búsqueda" : "Search Preferences"}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {language === "es" ? "Del perfil" : "From profile"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(leadPreferences?.estimatedRentCost || leadPreferences?.estimatedRentCostText) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <span className="text-muted-foreground text-xs block">{language === "es" ? "Presupuesto" : "Budget"}</span>
                      <span className="font-medium">
                        {leadPreferences?.estimatedRentCostText || 
                          (leadPreferences?.estimatedRentCost ? `$${leadPreferences.estimatedRentCost.toLocaleString()}` : "-")}
                      </span>
                    </div>
                  </div>
                )}
                {(leadPreferences?.bedrooms || leadPreferences?.bedroomsText) && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="text-muted-foreground text-xs block">{language === "es" ? "Recámaras" : "Bedrooms"}</span>
                      <span className="font-medium">{leadPreferences?.bedroomsText || leadPreferences?.bedrooms}</span>
                    </div>
                  </div>
                )}
                {leadPreferences?.desiredNeighborhood && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <div>
                      <span className="text-muted-foreground text-xs block">{language === "es" ? "Zona" : "Zone"}</span>
                      <span className="font-medium">{leadPreferences.desiredNeighborhood}</span>
                    </div>
                  </div>
                )}
                {leadPreferences?.desiredUnitType && (
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-purple-600" />
                    <div>
                      <span className="text-muted-foreground text-xs block">{language === "es" ? "Tipo" : "Type"}</span>
                      <span className="font-medium">{leadPreferences.desiredUnitType}</span>
                    </div>
                  </div>
                )}
                {leadPreferences?.contractDuration && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal-600" />
                    <div>
                      <span className="text-muted-foreground text-xs block">{language === "es" ? "Duración" : "Duration"}</span>
                      <span className="font-medium">{leadPreferences.contractDuration}</span>
                    </div>
                  </div>
                )}
                {leadPreferences?.hasPets && leadPreferences.hasPets !== "No" && (
                  <div className="flex items-center gap-2">
                    <PawPrint className="h-4 w-4 text-amber-600" />
                    <div>
                      <span className="text-muted-foreground text-xs block">{language === "es" ? "Mascotas" : "Pets"}</span>
                      <span className="font-medium">{leadPreferences.hasPets}</span>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full mt-2"
                onClick={initFormFromPreferences}
                data-testid="button-create-from-preferences"
              >
                <Plus className="w-4 h-4 mr-2" />
                {language === "es" ? "Crear Tarjeta desde Preferencias" : "Create Card from Preferences"}
              </Button>
            </CardContent>
          </Card>
        ) : (
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
        )
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
                        <DropdownMenuItem onClick={() => openEdit(card)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          {language === "es" ? "Editar" : "Edit"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(card)}>
                          {card.status === "active" ? (
                            <>
                              <Archive className="w-4 h-4 mr-2" />
                              {language === "es" ? "Desactivar" : "Deactivate"}
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              {language === "es" ? "Activar" : "Activate"}
                            </>
                          )}
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
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
                                  ? "Esta acción no se puede deshacer."
                                  : "This action cannot be undone."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {language === "es" ? "Cancelar" : "Cancel"}
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(card.id)}>
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
              <CardContent className="space-y-2 text-sm">
                {card.propertyType && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Home className="w-4 h-4" />
                    <span>{PROPERTY_TYPES.find(t => t.value === card.propertyType)?.label[language] || card.propertyType}</span>
                  </div>
                )}
                {(card.budgetText || card.minBudget || card.maxBudget) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      {card.budgetText || 
                        (card.minBudget && card.maxBudget 
                          ? `$${card.minBudget.toLocaleString()} - $${card.maxBudget.toLocaleString()}`
                          : card.minBudget 
                            ? `${language === "es" ? "Desde" : "From"} $${card.minBudget.toLocaleString()}`
                            : card.maxBudget
                              ? `${language === "es" ? "Hasta" : "Up to"} $${card.maxBudget.toLocaleString()}`
                              : "-"
                        )
                      }
                    </span>
                  </div>
                )}
                {(card.bedrooms || card.bedroomsText) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bed className="w-4 h-4" />
                    <span>{card.bedroomsText || card.bedrooms} {language === "es" ? "recámaras" : "bedrooms"}</span>
                  </div>
                )}
                {card.preferredZone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{card.preferredZone}</span>
                  </div>
                )}
                {card.hasPets && card.petsDescription && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <PawPrint className="w-4 h-4" />
                    <span>{card.petsDescription}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground pt-0">
                <Clock className="w-3 h-3 mr-1" />
                {format(new Date(card.updatedAt), "dd MMM yyyy", { locale })}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Nueva Tarjeta de Presentación" : "New Presentation Card"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Define los criterios de búsqueda para este cliente"
                : "Define the search criteria for this client"}
            </DialogDescription>
          </DialogHeader>
          {renderCardForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending 
                ? (language === "es" ? "Creando..." : "Creating...")
                : (language === "es" ? "Crear Tarjeta" : "Create Card")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Editar Tarjeta" : "Edit Card"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Modifica los criterios de búsqueda"
                : "Modify the search criteria"}
            </DialogDescription>
          </DialogHeader>
          {renderCardForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending 
                ? (language === "es" ? "Guardando..." : "Saving...")
                : (language === "es" ? "Guardar Cambios" : "Save Changes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
