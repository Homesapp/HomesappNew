import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  FileText,
  Check,
  X,
  Sparkles,
  Building2,
  Loader2,
  Upload,
  Image as ImageIcon,
  Dog,
  Cat,
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
import type { ExternalPresentationCard, ExternalAgencyUnitCharacteristic, ExternalAgencyAmenity } from "@shared/schema";

interface LeadPreferences {
  budgetMin?: number | string | null;
  budgetMax?: number | string | null;
  estimatedRentCost?: number | null;
  estimatedRentCostText?: string | null;
  bedrooms?: number | null;
  bedroomsText?: string | null;
  desiredUnitType?: string | null;
  desiredNeighborhood?: string | null;
  contractDuration?: string | null;
  hasPets?: string | null;
  desiredCharacteristics?: string[] | null;
  desiredAmenities?: string[] | null;
}

interface PresentationCardsTabProps {
  leadId?: string;
  clientId?: string;
  personName: string;
  leadPreferences?: LeadPreferences;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

const PROPERTY_TYPES = [
  { value: "departamento", label: { es: "Departamento", en: "Apartment" } },
  { value: "casa", label: { es: "Casa", en: "House" } },
  { value: "estudio", label: { es: "Estudio", en: "Studio" } },
  { value: "penthouse", label: { es: "Penthouse", en: "Penthouse" } },
  { value: "townhouse", label: { es: "Townhouse", en: "Townhouse" } },
  { value: "loft", label: { es: "Loft", en: "Loft" } },
  { value: "villa", label: { es: "Villa", en: "Villa" } },
];

const MODALITIES = [
  { value: "rent", label: { es: "Renta", en: "Rent" } },
  { value: "sale", label: { es: "Venta", en: "Sale" } },
  { value: "both", label: { es: "Ambos", en: "Both" } },
];

const CONTRACT_DURATIONS = [
  { value: "1 mes", label: { es: "1 mes", en: "1 month" } },
  { value: "3 meses", label: { es: "3 meses", en: "3 months" } },
  { value: "6 meses", label: { es: "6 meses", en: "6 months" } },
  { value: "12 meses", label: { es: "12 meses", en: "12 months" } },
  { value: "24 meses", label: { es: "24 meses", en: "24 months" } },
  { value: "36 meses", label: { es: "36 meses", en: "36 months" } },
  { value: "indefinido", label: { es: "Indefinido", en: "Indefinite" } },
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

interface PetInfo {
  type: "dog" | "cat" | "other";
  name?: string;
  photoUrl?: string;
  photoFile?: File;
}

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
  moveInDate: Date | undefined;
  moveInDateText: string;
  contractDuration: string;
  hasPets: boolean;
  petsDescription: string;
  pets: PetInfo[];
  amenities: string[];
  desiredCharacteristics: string[];
  desiredAmenities: string[];
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
  moveInDate: undefined,
  moveInDateText: "",
  contractDuration: "",
  hasPets: false,
  petsDescription: "",
  pets: [],
  amenities: [],
  desiredCharacteristics: [],
  desiredAmenities: [],
  additionalRequirements: "",
  specificProperty: "",
  isDefault: false,
};

const PET_TYPES = [
  { value: "dog" as const, label: { es: "Perro", en: "Dog" }, icon: "🐕" },
  { value: "cat" as const, label: { es: "Gato", en: "Cat" }, icon: "🐈" },
  { value: "other" as const, label: { es: "Otro", en: "Other" }, icon: "🐾" },
];

export default function PresentationCardsTab({ leadId, clientId, personName, leadPreferences, dialogOpen, onDialogOpenChange }: PresentationCardsTabProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Sync with controlled props from parent and reset form when opening from FAB
  useEffect(() => {
    if (dialogOpen !== undefined) {
      setIsCreateOpen(dialogOpen);
      if (dialogOpen) {
        // Reset form when opening via FAB
        setFormData(defaultFormData);
        setSelectedPropertyTypes([]);
        setSelectedZones([]);
      }
    }
  }, [dialogOpen]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateOpen(open);
    onDialogOpenChange?.(open);
  };
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

  const { data: characteristics = [] } = useQuery<ExternalAgencyUnitCharacteristic[]>({
    queryKey: ["agency-characteristics"],
    queryFn: async () => {
      const response = await fetch("/api/external/config/unit-characteristics", { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: amenitiesList = [] } = useQuery<ExternalAgencyAmenity[]>({
    queryKey: ["agency-amenities"],
    queryFn: async () => {
      const response = await fetch("/api/external/config/amenities", { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch zones and property types configuration
  const { data: zonesConfig = [] } = useQuery<Array<{id: string; name: string; isActive: boolean}>>({
    queryKey: ['/api/external/config/zones'],
  });
  const activeZones = zonesConfig.filter(z => z.isActive);

  const { data: propertyTypesConfig = [] } = useQuery<Array<{id: string; name: string; isActive: boolean}>>({
    queryKey: ['/api/external/config/property-types'],
  });
  const activePropertyTypes = propertyTypesConfig.filter(p => p.isActive);

  // State for multi-select property types and zones
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);

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
      // Also invalidate the query used in ExternalLeadDetail sidebar
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: ["/api/external/presentation-cards/lead", leadId] });
      }
      handleDialogOpenChange(false);
      resetForm();
      toast({
        title: language === "es" ? "Tarjeta creada" : "Card created",
        description: language === "es" ? "La tarjeta de presentacion se creo correctamente" : "Presentation card was created successfully",
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
      return { result: await res.json(), wasSetAsDefault: data.isDefault === true };
    },
    onSuccess: ({ wasSetAsDefault }) => {
      queryClient.invalidateQueries({ queryKey: ["presentation-cards", leadId || clientId] });
      // Also invalidate the query used in ExternalLeadDetail sidebar
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: ["/api/external/presentation-cards/lead", leadId] });
      }
      setIsEditOpen(false);
      setSelectedCard(null);
      resetForm();
      toast({
        title: wasSetAsDefault 
          ? (language === "es" ? "Tarjeta elegida" : "Card chosen")
          : (language === "es" ? "Tarjeta actualizada" : "Card updated"),
        description: wasSetAsDefault
          ? (language === "es" ? "Esta tarjeta se usara para filtrar propiedades" : "This card will be used to filter properties")
          : (language === "es" ? "La tarjeta de presentacion se actualizo correctamente" : "Presentation card was updated successfully"),
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
      // Also invalidate the query used in ExternalLeadDetail sidebar
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: ["/api/external/presentation-cards/lead", leadId] });
      }
      toast({
        title: language === "es" ? "Tarjeta eliminada" : "Card deleted",
        description: language === "es" ? "La tarjeta de presentacion se elimino correctamente" : "Presentation card was deleted successfully",
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
    setSelectedPropertyTypes([]);
    setSelectedZones([]);
  };

  const handleCreate = () => {
    const petsData = formData.pets.map(p => ({ type: p.type, name: p.name, photoUrl: p.photoUrl }));
    createMutation.mutate({
      title: formData.title || `${language === "es" ? "Busqueda de" : "Search for"} ${personName}`,
      propertyType: selectedPropertyTypes.join(", ") || null,
      modality: formData.modality,
      minBudget: formData.minBudget || null,
      maxBudget: formData.maxBudget || null,
      budgetText: formData.budgetText,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bedroomsText: formData.bedroomsText,
      bathrooms: formData.bathrooms || null,
      preferredZone: selectedZones.join(", ") || null,
      moveInDateText: formData.moveInDateText,
      contractDuration: formData.contractDuration,
      hasPets: formData.hasPets,
      petsDescription: formData.petsDescription,
      pets: petsData.length > 0 ? petsData : null,
      amenities: formData.amenities,
      desiredCharacteristics: formData.desiredCharacteristics,
      desiredAmenities: formData.desiredAmenities,
      additionalRequirements: formData.additionalRequirements,
      specificProperty: formData.specificProperty,
      isDefault: formData.isDefault,
      status: "active",
    });
  };

  const handleEdit = () => {
    if (!selectedCard) return;
    const petsData = formData.pets.map(p => ({ type: p.type, name: p.name, photoUrl: p.photoUrl }));
    updateMutation.mutate({
      id: selectedCard.id,
      data: {
        title: formData.title,
        propertyType: selectedPropertyTypes.join(", ") || null,
        modality: formData.modality,
        minBudget: formData.minBudget || null,
        maxBudget: formData.maxBudget || null,
        budgetText: formData.budgetText,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bedroomsText: formData.bedroomsText,
        bathrooms: formData.bathrooms || null,
        preferredZone: selectedZones.join(", ") || null,
        moveInDateText: formData.moveInDateText,
        contractDuration: formData.contractDuration,
        hasPets: formData.hasPets,
        petsDescription: formData.petsDescription,
        pets: petsData.length > 0 ? petsData : null,
        amenities: formData.amenities,
        desiredCharacteristics: formData.desiredCharacteristics,
        desiredAmenities: formData.desiredAmenities,
        additionalRequirements: formData.additionalRequirements,
        specificProperty: formData.specificProperty,
        isDefault: formData.isDefault,
      },
    });
  };

  const openEdit = (card: ExternalPresentationCard) => {
    setSelectedCard(card);
    // Parse moveInDateText to Date if possible
    let parsedDate: Date | undefined = undefined;
    if (card.moveInDateText) {
      try {
        const parsed = new Date(card.moveInDateText);
        if (!isNaN(parsed.getTime())) {
          parsedDate = parsed;
        }
      } catch (e) {
        // Keep undefined if parsing fails
      }
    }
    // Load pets from card
    const petsFromCard: PetInfo[] = (card as any).pets?.map((p: any) => ({
      type: p.type as "dog" | "cat" | "other",
      name: p.name || "",
      photoUrl: p.photoUrl,
    })) || [];
    
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
      moveInDate: parsedDate,
      moveInDateText: card.moveInDateText || "",
      contractDuration: card.contractDuration || "",
      hasPets: card.hasPets || false,
      petsDescription: card.petsDescription || "",
      pets: petsFromCard,
      amenities: card.amenities || [],
      desiredCharacteristics: card.desiredCharacteristics || [],
      desiredAmenities: card.desiredAmenities || [],
      additionalRequirements: card.additionalRequirements || "",
      specificProperty: card.specificProperty || "",
      isDefault: card.isDefault || false,
    });
    // Initialize multi-select state from comma-separated values
    setSelectedPropertyTypes(card.propertyType ? card.propertyType.split(", ").filter(Boolean) : []);
    setSelectedZones(card.preferredZone ? card.preferredZone.split(", ").filter(Boolean) : []);
    setIsEditOpen(true);
  };

  const toggleStatus = (card: ExternalPresentationCard) => {
    const newStatus = card.status === "active" ? "inactive" : "active";
    updateMutation.mutate({
      id: card.id,
      data: { status: newStatus },
    });
  };

  const setAsDefault = (card: ExternalPresentationCard) => {
    updateMutation.mutate({
      id: card.id,
      data: { isDefault: true },
    });
  };

  const hasPreferences = leadPreferences && (
    leadPreferences.budgetMin ||
    leadPreferences.budgetMax ||
    leadPreferences.estimatedRentCost || 
    leadPreferences.estimatedRentCostText || 
    leadPreferences.bedrooms || 
    leadPreferences.desiredNeighborhood || 
    leadPreferences.desiredUnitType
  );

  const initFormFromPreferences = () => {
    if (!leadPreferences) return;
    const budgetMinNum = leadPreferences.budgetMin ? Number(leadPreferences.budgetMin) : null;
    const budgetMaxNum = leadPreferences.budgetMax ? Number(leadPreferences.budgetMax) : null;
    setFormData({
      ...defaultFormData,
      title: `${language === "es" ? "Busqueda de" : "Search for"} ${personName}`,
      propertyType: leadPreferences.desiredUnitType || "",
      budgetText: "",
      minBudget: budgetMinNum ? String(budgetMinNum) : (leadPreferences.estimatedRentCost ? String(Math.round(leadPreferences.estimatedRentCost * 0.85)) : ""),
      maxBudget: budgetMaxNum ? String(budgetMaxNum) : (leadPreferences.estimatedRentCost ? String(Math.round(leadPreferences.estimatedRentCost * 1.15)) : ""),
      bedrooms: leadPreferences.bedrooms ? String(leadPreferences.bedrooms) : "",
      bedroomsText: leadPreferences.bedroomsText || "",
      preferredZone: leadPreferences.desiredNeighborhood || "",
      moveInDate: undefined,
      moveInDateText: "",
      contractDuration: leadPreferences.contractDuration || "",
      hasPets: leadPreferences.hasPets && leadPreferences.hasPets !== "No" ? true : false,
      petsDescription: leadPreferences.hasPets && leadPreferences.hasPets !== "No" ? leadPreferences.hasPets : "",
      desiredCharacteristics: leadPreferences.desiredCharacteristics || [],
      desiredAmenities: leadPreferences.desiredAmenities || [],
    });
    // Initialize multi-select state from preferences
    setSelectedPropertyTypes(leadPreferences.desiredUnitType ? leadPreferences.desiredUnitType.split(", ").filter(Boolean) : []);
    setSelectedZones(leadPreferences.desiredNeighborhood ? leadPreferences.desiredNeighborhood.split(", ").filter(Boolean) : []);
    handleDialogOpenChange(true);
  };

  const toggleCharacteristic = (id: string) => {
    setFormData(prev => ({
      ...prev,
      desiredCharacteristics: prev.desiredCharacteristics.includes(id)
        ? prev.desiredCharacteristics.filter(c => c !== id)
        : [...prev.desiredCharacteristics, id]
    }));
  };

  const toggleAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      desiredAmenities: prev.desiredAmenities.includes(id)
        ? prev.desiredAmenities.filter(a => a !== id)
        : [...prev.desiredAmenities, id]
    }));
  };

  const getCharacteristicName = (id: string) => {
    return characteristics.find(c => c.id === id)?.name || id;
  };

  const getAmenityName = (id: string) => {
    return amenitiesList.find(a => a.id === id)?.name || id;
  };

  const renderCardForm = () => (
    <ScrollArea className="max-h-[70vh] pr-4">
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <FileText className="w-4 h-4" />
            {language === "es" ? "Informacion Basica" : "Basic Information"}
          </div>
          
          <div>
            <Label className="text-sm">{language === "es" ? "Titulo de la tarjeta" : "Card title"}</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={language === "es" ? "Ej: Busqueda principal" : "E.g: Main search"}
              className="min-h-[44px]"
              data-testid="input-card-title"
            />
          </div>

          <div>
            <Label className="text-sm">{language === "es" ? "Tipo de propiedad (múltiple)" : "Property type (multiple)"}</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5" data-testid="multiselect-property-type">
              {(activePropertyTypes.length > 0 ? activePropertyTypes : PROPERTY_TYPES.map(t => ({ id: t.value, name: t.label[language] }))).map((pt) => (
                <Badge
                  key={pt.id}
                  variant={selectedPropertyTypes.includes(pt.name) ? "default" : "outline"}
                  className="cursor-pointer min-h-[32px] px-3"
                  onClick={() => {
                    setSelectedPropertyTypes(prev => 
                      prev.includes(pt.name) 
                        ? prev.filter(t => t !== pt.name) 
                        : [...prev, pt.name]
                    );
                  }}
                  data-testid={`badge-propertytype-${pt.id}`}
                >
                  {pt.name}
                </Badge>
              ))}
            </div>
            {selectedPropertyTypes.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedPropertyTypes.length} {language === "es" ? "seleccionado(s)" : "selected"}
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm">{language === "es" ? "Modalidad" : "Modality"}</Label>
            <Select value={formData.modality} onValueChange={(v) => setFormData({ ...formData, modality: v })}>
              <SelectTrigger className="min-h-[44px]" data-testid="select-modality">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODALITIES.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="min-h-[44px]">
                    {m.label[language]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <DollarSign className="w-4 h-4" />
            {language === "es" ? "Presupuesto de Renta" : "Rent Budget"}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">{language === "es" ? "Renta Mínima ($)" : "Minimum Rent ($)"}</Label>
              <Input
                type="number"
                value={formData.minBudget}
                onChange={(e) => setFormData({ ...formData, minBudget: e.target.value })}
                placeholder="15000"
                className="min-h-[44px]"
                data-testid="input-min-budget"
              />
            </div>
            <div>
              <Label className="text-sm">{language === "es" ? "Renta Máxima ($)" : "Maximum Rent ($)"}</Label>
              <Input
                type="number"
                value={formData.maxBudget}
                onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
                placeholder="30000"
                className="min-h-[44px]"
                data-testid="input-max-budget"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Building2 className="w-4 h-4" />
            {language === "es" ? "Especificaciones" : "Specifications"}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">{language === "es" ? "Recamaras" : "Bedrooms"}</Label>
              <Input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                placeholder="2"
                className="min-h-[44px]"
                data-testid="input-bedrooms"
              />
            </div>
            <div>
              <Label className="text-sm">{language === "es" ? "Banos" : "Bathrooms"}</Label>
              <Input
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                placeholder="2"
                className="min-h-[44px]"
                data-testid="input-bathrooms"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">{language === "es" ? "Zona preferida (múltiple)" : "Preferred zone (multiple)"}</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5" data-testid="multiselect-zone">
              {(activeZones.length > 0 ? activeZones : [
                { id: "aldea", name: "Aldea Zama" },
                { id: "veleta", name: "La Veleta" },
                { id: "centro", name: "Centro" },
                { id: "region15", name: "Region 15" },
              ]).map((zone) => (
                <Badge
                  key={zone.id}
                  variant={selectedZones.includes(zone.name) ? "default" : "outline"}
                  className="cursor-pointer min-h-[32px] px-3"
                  onClick={() => {
                    setSelectedZones(prev => 
                      prev.includes(zone.name) 
                        ? prev.filter(z => z !== zone.name) 
                        : [...prev, zone.name]
                    );
                  }}
                  data-testid={`badge-zone-${zone.id}`}
                >
                  {zone.name}
                </Badge>
              ))}
            </div>
            {selectedZones.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedZones.length} {language === "es" ? "seleccionado(s)" : "selected"}
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm">{language === "es" ? "Propiedad especifica" : "Specific property"}</Label>
            <Input
              value={formData.specificProperty}
              onChange={(e) => setFormData({ ...formData, specificProperty: e.target.value })}
              placeholder={language === "es" ? "Ej: Naia Naay E302" : "E.g: Naia Naay E302"}
              className="min-h-[44px]"
              data-testid="input-specific-property"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Calendar className="w-4 h-4" />
            {language === "es" ? "Tiempos" : "Timeline"}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">{language === "es" ? "Fecha de ingreso" : "Move-in date"}</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="min-h-[44px] shrink-0"
                      data-testid="button-move-in-date"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.moveInDate}
                      onSelect={(date) => setFormData({ 
                        ...formData, 
                        moveInDate: date,
                        moveInDateText: date ? format(date, "dd MMM yyyy", { locale }) : ""
                      })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      locale={locale}
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  value={formData.moveInDateText}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    moveInDateText: e.target.value,
                    moveInDate: undefined
                  })}
                  placeholder={language === "es" ? "Ej: Enero 2025" : "E.g: January 2025"}
                  className="min-h-[44px] flex-1"
                  data-testid="input-move-in"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">{language === "es" ? "Duracion del contrato" : "Contract duration"}</Label>
              <Select value={formData.contractDuration} onValueChange={(v) => setFormData({ ...formData, contractDuration: v })}>
                <SelectTrigger className="min-h-[44px]" data-testid="select-contract-duration">
                  <SelectValue placeholder={language === "es" ? "Seleccionar" : "Select"} />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value} className="min-h-[44px]">
                      {d.label[language]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <PawPrint className="w-4 h-4" />
            {language === "es" ? "Mascotas" : "Pets"}
          </div>

          <div className="flex items-center justify-between min-h-[44px] px-3 py-2 border rounded-md">
            <Label className="text-sm">{language === "es" ? "Tiene mascotas?" : "Has pets?"}</Label>
            <Switch
              checked={formData.hasPets}
              onCheckedChange={(v) => {
                if (!v) {
                  setFormData({ ...formData, hasPets: v, pets: [], petsDescription: "" });
                } else {
                  setFormData({ ...formData, hasPets: v });
                }
              }}
              data-testid="switch-pets"
            />
          </div>

          {formData.hasPets && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {language === "es" ? "Agregar mascotas" : "Add pets"}
                </Label>
                <div className="flex gap-2">
                  {PET_TYPES.map((petType) => (
                    <Button
                      key={petType.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-[36px] gap-1"
                      onClick={() => {
                        const newPet: PetInfo = { type: petType.value, name: "", photoUrl: undefined };
                        setFormData({ ...formData, pets: [...formData.pets, newPet] });
                      }}
                      data-testid={`button-add-${petType.value}`}
                    >
                      {petType.value === "dog" && <Dog className="w-4 h-4" />}
                      {petType.value === "cat" && <Cat className="w-4 h-4" />}
                      {petType.value === "other" && <PawPrint className="w-4 h-4" />}
                      {petType.label[language]}
                    </Button>
                  ))}
                </div>
              </div>

              {formData.pets.length > 0 && (
                <div className="space-y-3">
                  {formData.pets.map((pet, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50">
                          {pet.photoUrl ? (
                            <img
                              src={pet.photoUrl}
                              alt={pet.name || `Pet ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full hover:bg-muted transition-colors">
                              <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground">
                                {language === "es" ? "Foto" : "Photo"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast({
                                        title: language === "es" ? "Error" : "Error",
                                        description: language === "es" ? "La imagen no debe superar 5MB" : "Image must be under 5MB",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      const newPets = [...formData.pets];
                                      newPets[index] = { ...newPets[index], photoUrl: reader.result as string };
                                      setFormData({ ...formData, pets: newPets });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                data-testid={`input-pet-photo-${index}`}
                              />
                            </label>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="gap-1">
                              {pet.type === "dog" && <Dog className="w-3 h-3" />}
                              {pet.type === "cat" && <Cat className="w-3 h-3" />}
                              {pet.type === "other" && <PawPrint className="w-3 h-3" />}
                              {PET_TYPES.find(t => t.value === pet.type)?.label[language]}
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-auto"
                              onClick={() => {
                                const newPets = formData.pets.filter((_, i) => i !== index);
                                setFormData({ ...formData, pets: newPets });
                              }}
                              data-testid={`button-remove-pet-${index}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <Input
                            placeholder={language === "es" ? "Nombre de la mascota (opcional)" : "Pet name (optional)"}
                            value={pet.name || ""}
                            onChange={(e) => {
                              const newPets = [...formData.pets];
                              newPets[index] = { ...newPets[index], name: e.target.value };
                              setFormData({ ...formData, pets: newPets });
                            }}
                            className="h-9"
                            data-testid={`input-pet-name-${index}`}
                          />
                          {pet.photoUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                const newPets = [...formData.pets];
                                newPets[index] = { ...newPets[index], photoUrl: undefined };
                                setFormData({ ...formData, pets: newPets });
                              }}
                              data-testid={`button-remove-photo-${index}`}
                            >
                              <X className="w-3 h-3 mr-1" />
                              {language === "es" ? "Quitar foto" : "Remove photo"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {formData.pets.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
                  {language === "es" 
                    ? "Haz clic en los botones de arriba para agregar mascotas" 
                    : "Click the buttons above to add pets"}
                </p>
              )}
            </div>
          )}
        </div>

        {characteristics.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="w-4 h-4" />
                {language === "es" ? "Caracteristicas Deseadas" : "Desired Characteristics"}
              </div>
              <div className="flex flex-wrap gap-2">
                {characteristics.map((char) => (
                  <Button
                    key={char.id}
                    type="button"
                    variant={formData.desiredCharacteristics.includes(char.id) ? "default" : "outline"}
                    size="sm"
                    className="min-h-[44px] px-3"
                    onClick={() => toggleCharacteristic(char.id)}
                    data-testid={`toggle-characteristic-${char.id}`}
                  >
                    {formData.desiredCharacteristics.includes(char.id) && (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    {char.name}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {amenitiesList.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Home className="w-4 h-4" />
                {language === "es" ? "Amenidades Deseadas" : "Desired Amenities"}
              </div>
              <div className="flex flex-wrap gap-2">
                {amenitiesList.map((amenity) => (
                  <Button
                    key={amenity.id}
                    type="button"
                    variant={formData.desiredAmenities.includes(amenity.id) ? "default" : "outline"}
                    size="sm"
                    className="min-h-[44px] px-3"
                    onClick={() => toggleAmenity(amenity.id)}
                    data-testid={`toggle-amenity-${amenity.id}`}
                  >
                    {formData.desiredAmenities.includes(amenity.id) && (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    {amenity.name}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <FileText className="w-4 h-4" />
            {language === "es" ? "Notas Adicionales" : "Additional Notes"}
          </div>

          <div>
            <Label className="text-sm">{language === "es" ? "Requisitos adicionales" : "Additional requirements"}</Label>
            <Textarea
              value={formData.additionalRequirements}
              onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
              placeholder={language === "es" ? "Otros requisitos o preferencias del cliente..." : "Other client requirements or preferences..."}
              className="min-h-[88px] resize-none"
              data-testid="textarea-requirements"
            />
          </div>

          <div className="flex items-center justify-between min-h-[44px] px-3 py-2 border rounded-md bg-muted/30">
            <div>
              <Label className="text-sm font-medium">{language === "es" ? "Tarjeta predeterminada" : "Default card"}</Label>
              <p className="text-xs text-muted-foreground">
                {language === "es" ? "Usar como perfil principal de busqueda" : "Use as main search profile"}
              </p>
            </div>
            <Switch
              checked={formData.isDefault}
              onCheckedChange={(v) => setFormData({ ...formData, isDefault: v })}
              data-testid="switch-default"
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-11 w-28" />
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
      <div>
        <h3 className="text-lg font-medium">
          {language === "es" ? "Tarjetas de Presentacion" : "Presentation Cards"}
        </h3>
      </div>

      {(!cards || cards.length === 0) ? (
        hasPreferences ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="w-4 h-4 text-primary" />
                  {language === "es" ? "Preferencias de Busqueda" : "Search Preferences"}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {language === "es" ? "Del perfil" : "From profile"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(leadPreferences?.budgetMin || leadPreferences?.budgetMax || leadPreferences?.estimatedRentCost || leadPreferences?.estimatedRentCostText) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-muted-foreground text-xs block">{language === "es" ? "Presupuesto" : "Budget"}</span>
                      <span className="font-medium truncate block">
                        {leadPreferences?.budgetMin || leadPreferences?.budgetMax 
                          ? `$${leadPreferences.budgetMin ? Number(leadPreferences.budgetMin).toLocaleString() : '0'} - $${leadPreferences.budgetMax ? Number(leadPreferences.budgetMax).toLocaleString() : ''}`
                          : (leadPreferences?.estimatedRentCostText || 
                            (leadPreferences?.estimatedRentCost ? `$${leadPreferences.estimatedRentCost.toLocaleString()}` : "-"))}
                      </span>
                    </div>
                  </div>
                )}
                {(leadPreferences?.bedrooms || leadPreferences?.bedroomsText) && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-muted-foreground text-xs block">{language === "es" ? "Recamaras" : "Bedrooms"}</span>
                      <span className="font-medium">{leadPreferences?.bedroomsText || leadPreferences?.bedrooms}</span>
                    </div>
                  </div>
                )}
                {leadPreferences?.desiredNeighborhood && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-muted-foreground text-xs block">{language === "es" ? "Zona" : "Zone"}</span>
                      <span className="font-medium truncate block">{leadPreferences.desiredNeighborhood}</span>
                    </div>
                  </div>
                )}
                {leadPreferences?.desiredUnitType && (
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-purple-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-muted-foreground text-xs block">{language === "es" ? "Tipo" : "Type"}</span>
                      <span className="font-medium">{leadPreferences.desiredUnitType}</span>
                    </div>
                  </div>
                )}
                {leadPreferences?.contractDuration && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-muted-foreground text-xs block">{language === "es" ? "Duracion" : "Duration"}</span>
                      <span className="font-medium">{leadPreferences.contractDuration}</span>
                    </div>
                  </div>
                )}
                {leadPreferences?.hasPets && leadPreferences.hasPets !== "No" && (
                  <div className="flex items-center gap-2">
                    <PawPrint className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-muted-foreground text-xs block">{language === "es" ? "Mascotas" : "Pets"}</span>
                      <span className="font-medium">{leadPreferences.hasPets}</span>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-2 min-h-[44px]"
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
                  ? `${personName} no tiene tarjetas de presentacion aun`
                  : `${personName} has no presentation cards yet`}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {language === "es" 
                  ? "Usa el boton + para crear una tarjeta"
                  : "Use the + button to create a card"}
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <Card key={card.id} className={card.status === "archived" ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <CardTitle className="text-base truncate">
                      {card.title}
                    </CardTitle>
                    {card.isDefault && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge className={STATUS_COLORS[card.status]}>
                      {STATUS_LABELS[card.status]?.[language] || card.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-[44px] min-w-[44px]"
                      onClick={() => openEdit(card)}
                      data-testid={`button-edit-card-${card.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" data-testid={`button-card-menu-${card.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!card.isDefault && (
                          <DropdownMenuItem onClick={() => setAsDefault(card)} className="min-h-[44px]">
                            <Star className="w-4 h-4 mr-2" />
                            {language === "es" ? "Elegir Tarjeta" : "Choose Card"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => toggleStatus(card)} className="min-h-[44px]">
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
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive min-h-[44px]">
                              <Trash2 className="w-4 h-4 mr-2" />
                              {language === "es" ? "Eliminar" : "Delete"}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {language === "es" ? "Eliminar tarjeta?" : "Delete card?"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {language === "es" 
                                  ? "Esta accion no se puede deshacer."
                                  : "This action cannot be undone."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="min-h-[44px]">
                                {language === "es" ? "Cancelar" : "Cancel"}
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(card.id)} className="min-h-[44px]">
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
                    <Home className="w-4 h-4 shrink-0" />
                    <span>{PROPERTY_TYPES.find(t => t.value === card.propertyType)?.label[language] || card.propertyType}</span>
                  </div>
                )}
                {(card.budgetText || card.minBudget || card.maxBudget) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="w-4 h-4 shrink-0" />
                    <span>
                      {card.budgetText || 
                        (card.minBudget && card.maxBudget 
                          ? `$${Number(card.minBudget).toLocaleString()} - $${Number(card.maxBudget).toLocaleString()}`
                          : card.minBudget 
                            ? `${language === "es" ? "Desde" : "From"} $${Number(card.minBudget).toLocaleString()}`
                            : card.maxBudget
                              ? `${language === "es" ? "Hasta" : "Up to"} $${Number(card.maxBudget).toLocaleString()}`
                              : "-"
                        )
                      }
                    </span>
                  </div>
                )}
                {(card.bedrooms || card.bedroomsText || card.bathrooms) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bed className="w-4 h-4 shrink-0" />
                    <span>
                      {(card.bedroomsText || card.bedrooms) && `${card.bedroomsText || card.bedrooms} ${language === "es" ? "rec." : "bed."}`}
                      {(card.bedroomsText || card.bedrooms) && card.bathrooms && " • "}
                      {card.bathrooms && (
                        <><Bath className="inline w-3.5 h-3.5 ml-1 -mt-0.5" /> {card.bathrooms} {language === "es" ? "baños" : "bath."}</>
                      )}
                    </span>
                  </div>
                )}
                {card.preferredZone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{card.preferredZone}</span>
                  </div>
                )}
                {card.hasPets && card.petsDescription && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <PawPrint className="w-4 h-4 shrink-0" />
                    <span>{card.petsDescription}</span>
                  </div>
                )}
                {(card.desiredCharacteristics && card.desiredCharacteristics.length > 0) && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {card.desiredCharacteristics.slice(0, 3).map((charId) => (
                      <Badge key={charId} variant="secondary" className="text-xs">
                        {getCharacteristicName(charId)}
                      </Badge>
                    ))}
                    {card.desiredCharacteristics.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{card.desiredCharacteristics.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                {(card.desiredAmenities && card.desiredAmenities.length > 0) && (
                  <div className="flex flex-wrap gap-1">
                    {card.desiredAmenities.slice(0, 3).map((amenityId) => (
                      <Badge key={amenityId} variant="outline" className="text-xs border-primary/30 text-primary">
                        {getAmenityName(amenityId)}
                      </Badge>
                    ))}
                    {card.desiredAmenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{card.desiredAmenities.length - 3}
                      </Badge>
                    )}
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

      <Dialog open={isCreateOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {language === "es" ? "Nueva Tarjeta de Presentacion" : "New Presentation Card"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Define los criterios de busqueda para este cliente. Cuanto mas detallado, mejor sera el matching de propiedades."
                : "Define the search criteria for this client. The more detailed, the better the property matching."}
            </DialogDescription>
          </DialogHeader>
          {renderCardForm()}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)} className="min-h-[44px]">
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="min-h-[44px]">
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {createMutation.isPending 
                ? (language === "es" ? "Creando..." : "Creating...")
                : (language === "es" ? "Crear Tarjeta" : "Create Card")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              {language === "es" ? "Editar Tarjeta de Presentacion" : "Edit Presentation Card"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Modifica los criterios de busqueda segun las nuevas preferencias del cliente."
                : "Modify the search criteria according to the client's new preferences."}
            </DialogDescription>
          </DialogHeader>
          {renderCardForm()}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="min-h-[44px]">
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending} className="min-h-[44px]">
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
