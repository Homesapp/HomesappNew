import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { useMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search, 
  Filter, 
  Home, 
  Bed, 
  Bath, 
  DollarSign, 
  MapPin, 
  Share2, 
  MessageCircle,
  Users,
  Check,
  Copy,
  ExternalLink,
  Building2,
  SlidersHorizontal,
  X,
  User,
  Wallet,
  Target,
  Calendar,
  PawPrint,
  ChevronRight,
  CheckCircle2,
  Phone,
  LayoutGrid,
  LayoutList,
  FileText,
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Loader2,
  Maximize2,
  Square,
  Star,
  Eye
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

interface Unit {
  id: string;
  name: string;
  unitNumber: string | null;
  zone: string | null;
  unitType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  monthlyRent: number | null;
  salePrice?: string | null;
  currency: string | null;
  status: string | null;
  images: string[] | null;
  amenities: string[] | null;
  condominiumId: string | null;
  condominiumName: string | null;
  squareMeters: number | null;
  hasFurniture: boolean | null;
  hasParking: boolean | null;
  hasAC?: boolean | null;
  petsAllowed: boolean | null;
  description: string | null;
  commissionType?: string | null;
  referrerName?: string | null;
  listingType?: string | null;
}

interface ActiveCardSummary {
  id: string;
  title: string | null;
  propertyType: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  budgetText: string | null;
  bedrooms: number | null;
  bedroomsText: string | null;
  bathrooms: number | null;
  hasPets: string | null;
  zone: string | null;
  moveInDate: string | null;
  contractDuration: string | null;
  interestedUnitIds: string[] | null;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  status: string;
  estimatedRentCost: number | null;
  estimatedRentCostText: string | null;
  bedrooms: number | null;
  bedroomsText: string | null;
  desiredUnitType: string | null;
  desiredNeighborhood: string | null;
  contractDuration: string | null;
  hasPets: string | null;
  createdAt?: string;
  activeCard?: ActiveCardSummary | null;
}

interface MatchingLead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  matchScore: number;
  matchReasons: string[];
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
}

interface PresentationCard {
  id: string;
  title: string;
  propertyType: string | null;
  propertyTypeList: string[] | null;
  minBudget: string | null;
  maxBudget: string | null;
  budgetText: string | null;
  bedrooms: number | null;
  bedroomsText: string | null;
  bathrooms: number | null;
  preferredZone: string | null;
  preferredZoneList: string[] | null;
  contractDuration: string | null;
  hasPets: boolean | null;
  petsDescription: string | null;
  isDefault: boolean;
  status: string;
}

const singlePropertyTemplates: MessageTemplate[] = [
  {
    id: "single-1",
    name: "Presentacion inicial",
    content: `Hola {nombre}! Te comparto esta propiedad que puede interesarte:

Propiedad: {propiedad}
Ubicacion: {zona}
Recamaras: {recamaras}, Banos: {banos}
Precio: ${"{precio}"} {moneda}/mes

Te gustaria agendar una visita?`,
    isDefault: true
  },
  {
    id: "single-2",
    name: "Seguimiento",
    content: `Hola {nombre}! Que tal? Te comparto otra opcion que acaba de entrar disponible:

Propiedad: {propiedad}
Ubicacion: {zona}
Recamaras: {recamaras}
Precio: ${"{precio}"} {moneda}/mes

Esta propiedad cumple con lo que buscas. Te interesa verla?`,
    isDefault: true
  },
  {
    id: "single-3",
    name: "Oferta especial",
    content: `Hola {nombre}! Tengo excelentes noticias.

Esta propiedad tiene una promocion especial disponible:

Propiedad: {propiedad}
Ubicacion: {zona}
Precio: ${"{precio}"} {moneda}/mes

Te gustaria aprovechar esta oportunidad?`,
    isDefault: true
  }
];

const multiPropertyTemplates: MessageTemplate[] = [
  {
    id: "multi-1", 
    name: "Listado de propiedades",
    content: `Hola {nombre}! Encontre estas propiedades perfectas para ti:

{propiedades_lista}

Cual te gustaria visitar primero?`,
    isDefault: true
  },
  {
    id: "multi-2",
    name: "Opciones destacadas",
    content: `Hola {nombre}! Te comparto varias opciones que se ajustan a lo que buscas:

{propiedades_lista}

Cualquier pregunta estoy a tus ordenes.`,
    isDefault: true
  }
];

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80",
];

const SAMPLE_UNITS: Unit[] = [
  {
    id: "sample-1",
    name: "Penthouse Vista Mar",
    unitNumber: "PH-401",
    zone: "Aldea Zama",
    unitType: "Penthouse",
    bedrooms: 3,
    bathrooms: 3,
    monthlyRent: 85000,
    currency: "MXN",
    status: "active",
    images: [SAMPLE_IMAGES[0], SAMPLE_IMAGES[1]],
    amenities: ["Pool", "Gym", "Rooftop"],
    condominiumId: "condo-1",
    condominiumName: "Mistiq Tulum",
    squareMeters: 180,
    hasFurniture: true,
    hasParking: true,
    petsAllowed: true,
    description: "Espectacular penthouse con vista al mar"
  },
  {
    id: "sample-2",
    name: "Suite Ejecutiva",
    unitNumber: "A-205",
    zone: "Centro",
    unitType: "Departamento",
    bedrooms: 2,
    bathrooms: 2,
    monthlyRent: 35000,
    currency: "MXN",
    status: "active",
    images: [SAMPLE_IMAGES[2], SAMPLE_IMAGES[3]],
    amenities: ["Pool", "Seguridad 24/7"],
    condominiumId: "condo-2",
    condominiumName: "Town Center",
    squareMeters: 95,
    hasFurniture: true,
    hasParking: true,
    petsAllowed: false,
    description: "Suite moderna en el centro de Tulum"
  },
  {
    id: "sample-3",
    name: "Villa Selvática",
    unitNumber: "V-12",
    zone: "La Veleta",
    unitType: "Casa",
    bedrooms: 4,
    bathrooms: 4,
    monthlyRent: 120000,
    currency: "MXN",
    status: "active",
    images: [SAMPLE_IMAGES[4], SAMPLE_IMAGES[5]],
    amenities: ["Pool privada", "Jardín", "Estudio"],
    condominiumId: "condo-3",
    condominiumName: "Bravo Towers",
    squareMeters: 280,
    hasFurniture: true,
    hasParking: true,
    petsAllowed: true,
    description: "Villa de lujo rodeada de naturaleza"
  },
  {
    id: "sample-4",
    name: "Studio Minimalista",
    unitNumber: "B-101",
    zone: "Kukulkán",
    unitType: "Studio",
    bedrooms: 1,
    bathrooms: 1,
    monthlyRent: 18500,
    currency: "MXN",
    status: "active",
    images: [SAMPLE_IMAGES[6]],
    amenities: ["Coworking", "Rooftop"],
    condominiumId: "condo-4",
    condominiumName: "Azura",
    squareMeters: 45,
    hasFurniture: true,
    hasParking: false,
    petsAllowed: false,
    description: "Studio ideal para nómadas digitales"
  },
  {
    id: "sample-5",
    name: "Loft Industrial",
    unitNumber: "L-302",
    zone: "Aldea Zama",
    unitType: "Loft",
    bedrooms: 2,
    bathrooms: 2,
    monthlyRent: 55000,
    currency: "MXN",
    status: "rented",
    images: [SAMPLE_IMAGES[7], SAMPLE_IMAGES[0]],
    amenities: ["Terraza", "Jacuzzi"],
    condominiumId: "condo-5",
    condominiumName: "Casa Santiago",
    squareMeters: 120,
    hasFurniture: false,
    hasParking: true,
    petsAllowed: true,
    description: "Loft con diseño industrial moderno"
  },
  {
    id: "sample-6",
    name: "Departamento Familiar",
    unitNumber: "C-508",
    zone: "Centro",
    unitType: "Departamento",
    bedrooms: 3,
    bathrooms: 2,
    monthlyRent: 42000,
    currency: "MXN",
    status: "active",
    images: [SAMPLE_IMAGES[1], SAMPLE_IMAGES[2]],
    amenities: ["Área de juegos", "Pool", "Gym"],
    condominiumId: "condo-6",
    condominiumName: "Sky Tulum",
    squareMeters: 130,
    hasFurniture: true,
    hasParking: true,
    petsAllowed: true,
    description: "Ideal para familias con áreas comunes"
  },
  {
    id: "sample-7",
    name: "Suite Premium",
    unitNumber: "D-701",
    zone: "La Veleta",
    unitType: "Departamento",
    bedrooms: 2,
    bathrooms: 2,
    monthlyRent: 48000,
    currency: "MXN",
    status: "active",
    images: [SAMPLE_IMAGES[3], SAMPLE_IMAGES[4]],
    amenities: ["Vista panorámica", "Smart home"],
    condominiumId: "condo-7",
    condominiumName: "Nader",
    squareMeters: 105,
    hasFurniture: true,
    hasParking: true,
    petsAllowed: false,
    description: "Suite con acabados de lujo y tecnología"
  },
  {
    id: "sample-8",
    name: "Casa de Playa",
    unitNumber: "CP-15",
    zone: "Zona Hotelera",
    unitType: "Casa",
    bedrooms: 5,
    bathrooms: 5,
    monthlyRent: 180000,
    currency: "MXN",
    status: "active",
    images: [SAMPLE_IMAGES[5], SAMPLE_IMAGES[6]],
    amenities: ["Acceso a playa", "Pool infinity", "Chef kitchen"],
    condominiumId: "condo-8",
    condominiumName: "Tao",
    squareMeters: 350,
    hasFurniture: true,
    hasParking: true,
    petsAllowed: true,
    description: "Propiedad exclusiva frente al mar"
  }
];

export default function SellerPropertyCatalog() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isMobile = useMobile();

  const [search, setSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    zone: "",
    propertyType: "",
    status: "active",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [matchingLeadsOpen, setMatchingLeadsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadPanel, setShowLeadPanel] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [bulkShareDialogOpen, setBulkShareDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("single-1");
  const [selectedBulkTemplateId, setSelectedBulkTemplateId] = useState<string>("multi-1");
  const [leadsPanelExpanded, setLeadsPanelExpanded] = useState(true);
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailUnit, setDetailUnit] = useState<Unit | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);

  // Create stable filter key for useEffect dependency
  const filterKey = useMemo(() => JSON.stringify({
    search,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    bedrooms: filters.bedrooms,
    zone: filters.zone,
    propertyType: filters.propertyType,
    status: filters.status,
  }), [search, filters.minPrice, filters.maxPrice, filters.bedrooms, filters.zone, filters.propertyType, filters.status]);

  const buildQueryString = (pageNum: number = page, perPage: number = itemsPerPage) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (filters.minPrice) params.append("minPrice", filters.minPrice);
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
    if (filters.bedrooms && filters.bedrooms !== "_all") params.append("bedrooms", filters.bedrooms);
    if (filters.zone && filters.zone !== "_all") params.append("zone", filters.zone);
    if (filters.propertyType && filters.propertyType !== "_all") params.append("propertyType", filters.propertyType);
    if (filters.status && filters.status !== "_all") params.append("status", filters.status);
    params.append("limit", String(perPage));
    params.append("offset", String((pageNum - 1) * perPage));
    return params.toString();
  };

  // Reset page when filters change (use stable filterKey)
  const prevFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey;
      setPage(1);
    }
  }, [filterKey]);
  
  const { data: catalogData, isLoading, isFetching } = useQuery<{ data: any[]; total: number }>({
    queryKey: ["/api/external-seller/property-catalog", filterKey, page, itemsPerPage],
    queryFn: async () => {
      const qs = buildQueryString(page, itemsPerPage);
      const res = await fetch(`/api/external-seller/property-catalog?${qs}`);
      if (!res.ok) throw new Error("Failed to fetch properties");
      return res.json();
    },
  });

  // Map backend data to frontend Unit interface
  const mappedUnits: Unit[] = useMemo(() => {
    if (!catalogData?.data) return [];
    return catalogData.data.map((u: any) => ({
      ...u,
      status: u.isActive ? 'active' : 'rented',
      petsAllowed: Boolean(u.petsAllowed ?? u.petFriendly ?? u.allowsPets ?? false),
    }));
  }, [catalogData?.data]);

  const { data: leadsData, isLoading: leadsLoading } = useQuery<{ data: Lead[] }>({
    queryKey: ["/api/external-leads"],
    queryFn: async () => {
      const res = await fetch("/api/external-leads?limit=100");
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
  });

  const { data: matchingLeads, isLoading: matchingLoading } = useQuery<MatchingLead[]>({
    queryKey: ["/api/external-seller/matching-leads", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit) return [];
      const res = await fetch(`/api/external-seller/matching-leads/${selectedUnit.id}`);
      if (!res.ok) throw new Error("Failed to fetch matching leads");
      return res.json();
    },
    enabled: !!selectedUnit && matchingLeadsOpen,
  });

  const { data: zones } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/external/config/zones"],
  });

  const { data: propertyTypes } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/external/config/property-types"],
  });

  // Fetch presentation cards for the selected lead to get the chosen card's criteria
  const { data: presentationCards } = useQuery<PresentationCard[]>({
    queryKey: ["/api/external/presentation-cards/lead", selectedLead?.id],
    queryFn: async () => {
      if (!selectedLead?.id) return [];
      const res = await fetch(`/api/external/presentation-cards/lead/${selectedLead.id}`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedLead?.id,
  });

  // Get the chosen presentation card (isDefault=true, or fallback to first card)
  const chosenCard = useMemo(() => {
    if (!presentationCards || presentationCards.length === 0) return null;
    return presentationCards.find(c => c.isDefault) || presentationCards[0];
  }, [presentationCards]);

  const sharePropertyMutation = useMutation({
    mutationFn: async (data: { leadId: string; unitId: string; message?: string }) => {
      const res = await apiRequest("POST", "/api/external-seller/share-property", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }
      toast({
        title: t("sellerCatalog.shareSent", "Propiedad compartida"),
        description: t("sellerCatalog.shareSuccess", "Se abrió WhatsApp para enviar el mensaje"),
      });
      setShareDialogOpen(false);
      setBulkShareDialogOpen(false);
      setSelectedLead(null);
      setCustomMessage("");
      setSelectedUnits(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/external-seller/metrics"] });
    },
    onError: () => {
      toast({
        title: t("common.error", "Error"),
        description: t("sellerCatalog.shareError", "No se pudo compartir la propiedad"),
        variant: "destructive",
      });
    },
  });

  const displayUnits = useMemo(() => {
    if (mappedUnits.length > 0) return mappedUnits;
    return SAMPLE_UNITS;
  }, [mappedUnits]);

  const totalUnits = catalogData?.total || 0;
  const totalPages = Math.ceil(totalUnits / itemsPerPage);
  const allLeads = leadsData?.data || [];
  
  // Clear selection when page changes
  useEffect(() => {
    setSelectedUnits(new Set());
  }, [page]);
  
  const filteredLeads = useMemo(() => {
    let result = [...allLeads];
    
    // Keep selected lead in the list to allow toggle behavior (click to select, click again to deselect)
    
    if (leadSearch) {
      const searchLower = leadSearch.toLowerCase();
      result = result.filter(lead => 
        lead.firstName?.toLowerCase().includes(searchLower) ||
        lead.lastName?.toLowerCase().includes(searchLower) ||
        lead.phone?.includes(leadSearch)
      );
    }
    
    if (leadStatusFilter !== "all") {
      result = result.filter(lead => lead.status === leadStatusFilter);
    }
    
    result.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
    
    return result;
  }, [allLeads, leadSearch, leadStatusFilter, selectedLead]);

  const hasActiveFilters = Object.values(filters).some((v) => v && v !== "active");

  const clearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      zone: "",
      propertyType: "",
      status: "active",
    });
    setSearch("");
    setSelectedLead(null);
  };

  // Apply chosen presentation card filters when available
  useEffect(() => {
    if (!selectedLead || !chosenCard) return;
    
    const newFilters = {
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      zone: "",
      propertyType: "",
      status: "active",
    };
    
    // Use the chosen card's budget range (+/- 30% variance for flexibility)
    let hasBudgetFilter = false;
    if (chosenCard.minBudget) {
      const minBudget = parseFloat(chosenCard.minBudget);
      if (!isNaN(minBudget)) {
        newFilters.minPrice = String(Math.max(0, Math.round(minBudget * 0.7)));
        hasBudgetFilter = true;
      }
    }
    if (chosenCard.maxBudget) {
      const maxBudget = parseFloat(chosenCard.maxBudget);
      if (!isNaN(maxBudget)) {
        newFilters.maxPrice = String(Math.round(maxBudget * 1.3));
        hasBudgetFilter = true;
      }
    }
    
    // Fallback to lead's estimate if no numeric budget on card
    if (!hasBudgetFilter && selectedLead.estimatedRentCost) {
      const variance = Math.round(selectedLead.estimatedRentCost * 0.30);
      newFilters.minPrice = String(Math.max(0, selectedLead.estimatedRentCost - variance));
      newFilters.maxPrice = String(selectedLead.estimatedRentCost + variance);
    }
    
    // Use the chosen card's preferred zone for search (not strict filter)
    // The zone is used as a search term since catalog may use IDs internally
    if (chosenCard.preferredZone) {
      setSearch(chosenCard.preferredZone);
    } else if (chosenCard.preferredZoneList && chosenCard.preferredZoneList.length > 0) {
      setSearch(chosenCard.preferredZoneList[0]);
    } else if (selectedLead.desiredNeighborhood) {
      setSearch(selectedLead.desiredNeighborhood);
    }
    
    // Note: Property type is NOT applied as a strict filter because the card stores
    // human-readable labels while the catalog expects IDs. Using search is more flexible.
    // The matching score system will still prioritize matching property types visually.
    
    setFilters(newFilters);
  }, [selectedLead, chosenCard]);

  // Calculate match score between a unit and the selected lead (using chosen card criteria if available)
  const calculateMatchScore = (unit: Unit, lead: Lead | null): { score: number; reasons: string[] } => {
    if (!lead) return { score: 0, reasons: [] };
    
    let score = 0;
    const reasons: string[] = [];
    
    // Determine budget criteria - use chosen card if available, else lead's preference
    let targetBudget = lead.estimatedRentCost;
    if (chosenCard) {
      const minBudget = chosenCard.minBudget ? parseFloat(chosenCard.minBudget) : null;
      const maxBudget = chosenCard.maxBudget ? parseFloat(chosenCard.maxBudget) : null;
      if (minBudget !== null && maxBudget !== null && !isNaN(minBudget) && !isNaN(maxBudget)) {
        targetBudget = (minBudget + maxBudget) / 2;
      } else if (maxBudget !== null && !isNaN(maxBudget)) {
        targetBudget = maxBudget;
      }
    }
    
    // Price match (max 40 points)
    if (targetBudget && unit.monthlyRent) {
      const priceDiff = Math.abs(unit.monthlyRent - targetBudget) / targetBudget;
      if (priceDiff <= 0.10) {
        score += 40;
        reasons.push("Precio ideal");
      } else if (priceDiff <= 0.20) {
        score += 30;
        reasons.push("Precio cercano");
      } else if (priceDiff <= 0.30) {
        score += 15;
        reasons.push("Precio aceptable");
      }
    }
    
    // Determine bedrooms criteria - use chosen card if available
    let targetBedrooms = lead.bedrooms;
    if (chosenCard?.bedrooms) {
      targetBedrooms = chosenCard.bedrooms;
    }
    
    // Bedrooms match (max 25 points)
    if (targetBedrooms && unit.bedrooms) {
      if (unit.bedrooms === targetBedrooms) {
        score += 25;
        reasons.push("Recámaras exactas");
      } else if (Math.abs(unit.bedrooms - targetBedrooms) === 1) {
        score += 15;
        reasons.push("Recámaras similares");
      }
    }
    
    // Determine zone criteria - use chosen card if available
    let targetZone = lead.desiredNeighborhood;
    if (chosenCard?.preferredZone) {
      targetZone = chosenCard.preferredZone;
    } else if (chosenCard?.preferredZoneList && chosenCard.preferredZoneList.length > 0) {
      targetZone = chosenCard.preferredZoneList[0];
    }
    
    // Zone match (max 25 points)
    if (targetZone && unit.zone) {
      const zoneLower = unit.zone.toLowerCase();
      const desiredLower = targetZone.toLowerCase();
      if (zoneLower.includes(desiredLower) || desiredLower.includes(zoneLower)) {
        score += 25;
        reasons.push("Zona preferida");
      }
    }
    
    // Determine property type - use chosen card if available
    let targetPropertyType = lead.desiredUnitType;
    if (chosenCard?.propertyType) {
      targetPropertyType = chosenCard.propertyType;
    } else if (chosenCard?.propertyTypeList && chosenCard.propertyTypeList.length > 0) {
      targetPropertyType = chosenCard.propertyTypeList[0];
    }
    
    // Property type match (max 10 points)
    if (targetPropertyType && unit.unitType) {
      if (unit.unitType.toLowerCase() === targetPropertyType.toLowerCase()) {
        score += 10;
        reasons.push("Tipo ideal");
      }
    }
    
    return { score, reasons };
  };

  // Sort units by match score when a lead is selected (uses chosenCard criteria when available)
  const units = useMemo(() => {
    if (!selectedLead) return displayUnits;
    return [...displayUnits].sort((a, b) => {
      const scoreA = calculateMatchScore(a, selectedLead).score;
      const scoreB = calculateMatchScore(b, selectedLead).score;
      return scoreB - scoreA; // Higher scores first
    });
  }, [displayUnits, selectedLead, chosenCard]);

  const applyLeadFilters = (lead: Lead) => {
    // Toggle behavior: if same lead is clicked, deselect it
    if (selectedLead?.id === lead.id) {
      clearFilters();
      return;
    }
    // Set the lead - the useEffect will apply filters from the chosen presentation card
    // if available, otherwise we'll use the lead's direct preferences as fallback
    setSelectedLead(lead);
    // Reset filters first - they will be set by the useEffect when chosenCard is loaded
    // or by the fallback below if no chosen card exists
    setFilters({
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      zone: "",
      propertyType: "",
      status: "active",
    });
    setSearch("");
  };

  // Fallback: Apply lead preferences if no chosen presentation card exists
  useEffect(() => {
    if (!selectedLead || chosenCard) return; // Only apply if no chosen card
    
    // Wait a bit for the presentation cards query to complete
    const timer = setTimeout(() => {
      if (presentationCards !== undefined && !chosenCard) {
        // No chosen card, use lead's direct preferences as fallback
        const newFilters = {
          minPrice: "",
          maxPrice: "",
          bedrooms: "",
          zone: "",
          propertyType: "",
          status: "active",
        };
        
        if (selectedLead.estimatedRentCost) {
          const variance = Math.round(selectedLead.estimatedRentCost * 0.30);
          newFilters.minPrice = String(Math.max(0, selectedLead.estimatedRentCost - variance));
          newFilters.maxPrice = String(selectedLead.estimatedRentCost + variance);
        }
        
        if (selectedLead.desiredNeighborhood) {
          setSearch(selectedLead.desiredNeighborhood);
        }
        
        setFilters(newFilters);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [selectedLead, presentationCards, chosenCard]);

  const generateMessageFromTemplate = (template: MessageTemplate, unit: Unit, lead?: Lead | null) => {
    let message = template.content;
    
    const propertyName = unit.name || unit.condominiumName || unit.unitNumber || "Propiedad";
    const propertyLink = `${window.location.origin}/unidad/${unit.id}`;
    
    message = message.replace(/\{\{?nombre\}\}?/g, lead?.firstName || "");
    message = message.replace(/\{\{?propiedad\}\}?/g, propertyName);
    message = message.replace(/\{\{?zona\}\}?/g, unit.zone || "");
    message = message.replace(/\{\{?recamaras\}\}?/g, String(unit.bedrooms || 0));
    message = message.replace(/\{\{?banos\}\}?/g, String(unit.bathrooms || 0));
    message = message.replace(/\{\{?precio\}\}?/g, unit.monthlyRent?.toLocaleString() || "Consultar");
    message = message.replace(/\{\{?moneda\}\}?/g, unit.currency || "MXN");
    message = message.replace(/\{\{?vendedor\}\}?/g, "");
    message = message.replace(/\{\{?link\}\}?/g, propertyLink);
    message = message.replace(/\{\{?enlace\}\}?/g, propertyLink);
    return message;
  };

  const generateBulkMessage = (template: MessageTemplate, unitsList: Unit[], lead?: Lead | null) => {
    let message = template.content;
    message = message.replace(/\{\{?nombre\}\}?/g, lead?.firstName || "");
    
    const propertiesList = unitsList.map((unit, i) => {
      const propertyName = unit.name || unit.condominiumName || unit.unitNumber || "Propiedad";
      const propertyLink = `${window.location.origin}/unidad/${unit.id}`;
      return `${i + 1}. ${propertyName}\n   Ubicacion: ${unit.zone || "Sin zona"}\n   ${unit.bedrooms || 0} rec. | $${unit.monthlyRent?.toLocaleString() || "—"} ${unit.currency || "MXN"}/mes\n   Ver: ${propertyLink}`;
    }).join("\n\n");
    
    message = message.replace(/\{\{?propiedades_lista\}\}?/g, propertiesList);
    
    return message;
  };

  const handleOpenDetail = (unit: Unit) => {
    setDetailUnit(unit);
    setDetailImageIndex(0);
    setDetailDialogOpen(true);
  };

  const handleShareClick = (unit: Unit) => {
    setSelectedUnit(unit);
    const template = singlePropertyTemplates.find(t => t.id === selectedTemplateId) || singlePropertyTemplates[0];
    setCustomMessage(generateMessageFromTemplate(template, unit, selectedLead));
    setShareDialogOpen(true);
  };

  const handleDirectWhatsApp = (unit: Unit, lead: Lead) => {
    if (!lead.phone) {
      toast({
        title: t("common.error", "Error"),
        description: t("sellerCatalog.noPhone", "El lead no tiene teléfono registrado"),
        variant: "destructive",
      });
      return;
    }
    setSelectedUnit(unit);
    setSelectedLead(lead);
    const template = singlePropertyTemplates.find(t => t.id === selectedTemplateId) || singlePropertyTemplates[0];
    setCustomMessage(generateMessageFromTemplate(template, unit, lead));
    setShareDialogOpen(true);
  };

  const handleFindMatches = (unit: Unit) => {
    setSelectedUnit(unit);
    setMatchingLeadsOpen(true);
  };

  const handleShareWithLead = (lead: MatchingLead) => {
    const fullLead = allLeads.find(l => l.id === lead.id);
    if (fullLead) {
      setSelectedLead(fullLead);
    }
    if (selectedUnit) {
      const template = singlePropertyTemplates.find(t => t.id === selectedTemplateId) || singlePropertyTemplates[0];
      setCustomMessage(generateMessageFromTemplate(template, selectedUnit, fullLead));
    }
    setMatchingLeadsOpen(false);
    setShareDialogOpen(true);
  };

  const handleSendShare = () => {
    if (!selectedUnit || !selectedLead) return;
    sharePropertyMutation.mutate({
      leadId: selectedLead.id,
      unitId: selectedUnit.id,
      message: customMessage,
    });
  };

  const handleBulkShare = () => {
    if (selectedUnits.size === 0 || !selectedLead) return;
    
    const phone = selectedLead.phone?.replace(/\D/g, "") || "";
    if (!phone) {
      toast({
        title: "Error",
        description: "El lead no tiene teléfono registrado",
        variant: "destructive",
      });
      return;
    }
    
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(customMessage)}`;
    window.open(whatsappUrl, "_blank");
    
    toast({
      title: "Propiedades compartidas",
      description: `Se abrió WhatsApp con ${selectedUnits.size} propiedades`,
    });
    
    setBulkShareDialogOpen(false);
    setSelectedUnits(new Set());
    setCustomMessage("");
  };

  const handleOpenBulkShare = () => {
    if (selectedUnits.size === 0) {
      toast({
        title: "Selecciona propiedades",
        description: "Primero selecciona las propiedades que quieres compartir",
        variant: "destructive",
      });
      return;
    }
    
    const selectedUnitsList = units.filter(u => selectedUnits.has(u.id));
    const template = multiPropertyTemplates.find(t => t.id === selectedBulkTemplateId) || multiPropertyTemplates[0];
    setCustomMessage(generateBulkMessage(template, selectedUnitsList, selectedLead));
    setBulkShareDialogOpen(true);
  };

  const toggleUnitSelection = (unitId: string) => {
    const newSet = new Set(selectedUnits);
    if (newSet.has(unitId)) {
      newSet.delete(unitId);
    } else {
      newSet.add(unitId);
    }
    setSelectedUnits(newSet);
  };

  const selectAllUnits = () => {
    if (selectedUnits.size === units.length) {
      setSelectedUnits(new Set());
    } else {
      setSelectedUnits(new Set(units.map(u => u.id)));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(customMessage);
    toast({
      title: t("common.copied", "Copiado"),
      description: t("sellerCatalog.messageCopied", "Mensaje copiado al portapapeles"),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "nuevo": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "nuevo_lead": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "interesado": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
      case "contactado": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "cita_coordinada": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "cita_agendada": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "en_negociacion": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "oferta_enviada": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "proceso_renta": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rentado": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "perdido": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "descartado": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      nuevo: "Nuevo",
      nuevo_lead: "Nuevo Lead",
      interesado: "Interesado",
      contactado: "Contactado",
      cita_coordinada: "Cita Coordinada",
      cita_agendada: "Cita Agendada",
      en_negociacion: "En Negociación",
      oferta_enviada: "Oferta Enviada",
      proceso_renta: "En Proceso",
      rentado: "Rentado",
      perdido: "Perdido",
      descartado: "Descartado"
    };
    return labels[status] || status;
  };

  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());

  const toggleLeadExpanded = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(expandedLeads);
    if (newSet.has(leadId)) {
      newSet.delete(leadId);
    } else {
      newSet.add(leadId);
    }
    setExpandedLeads(newSet);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "—";
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col sm:flex-row gap-0">
      {showLeadPanel && (
        <div className="w-full sm:w-80 flex-shrink-0 border-b sm:border-b-0 sm:border-r bg-muted/30">
          <div className="flex h-12 sm:h-14 items-center justify-between border-b px-3 sm:px-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h2 className="font-semibold text-sm sm:text-base">{t("sellerCatalog.myLeads", "Mis Leads")}</h2>
              <Badge variant="secondary" className="ml-1">{filteredLeads.length}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                className="sm:hidden h-9 w-9"
                onClick={() => setLeadsPanelExpanded(!leadsPanelExpanded)}
                data-testid="button-toggle-leads-mobile"
              >
                {leadsPanelExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setShowLeadPanel(false)}
                data-testid="button-hide-leads"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className={`${leadsPanelExpanded ? 'block' : 'hidden'} sm:block`}>
            <div className="p-2 sm:p-3 space-y-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar lead..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="pl-9 h-10"
                  data-testid="input-lead-search"
                />
              </div>
              <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
                <SelectTrigger className="h-10" data-testid="select-lead-status-filter">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="contactado">Contactado</SelectItem>
                  <SelectItem value="en_negociacion">En Negociación</SelectItem>
                  <SelectItem value="cita_agendada">Cita Agendada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Selected Lead Quick Actions - Minimal bar to clear selection */}
            {selectedLead && (
              <div className="p-2 sm:p-3 border-b bg-primary/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <p className="font-medium text-sm truncate">{selectedLead.firstName} {selectedLead.lastName}</p>
                    {selectedLead.activeCard?.title && (
                      <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                        {selectedLead.activeCard.title}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => clearFilters()}
                    data-testid="button-clear-lead-filter"
                  >
                    <X className="h-3 w-3" />
                    Limpiar
                  </Button>
                </div>
              </div>
            )}
            
            <ScrollArea className={`${selectedLead ? 'h-[180px] sm:h-[calc(100vh-20rem)]' : 'h-[200px] sm:h-[calc(100vh-14rem)]'}`}>
              <div className="space-y-2 p-2 sm:p-3">
                {leadsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))
                ) : filteredLeads.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {leadSearch ? "No se encontraron leads" : "No tienes leads asignados"}
                    </p>
                  </div>
                ) : (
                  filteredLeads.map((lead) => {
                    const isExpanded = expandedLeads.has(lead.id);
                    return (
                      <Card 
                        key={lead.id} 
                        className={`cursor-pointer transition-all hover-elevate ${
                          selectedLead?.id === lead.id 
                            ? "ring-2 ring-primary" 
                            : ""
                        }`}
                        onClick={() => applyLeadFilters(lead)}
                        data-testid={`card-lead-${lead.id}`}
                      >
                        <CardContent className="p-2 sm:p-3">
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10">
                                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium leading-tight text-sm">
                                  {lead.firstName} {lead.lastName}
                                </p>
                                {lead.phone && (
                                  <p className="text-xs text-muted-foreground">{lead.phone}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {selectedLead?.id === lead.id && (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => toggleLeadExpanded(lead.id, e)}
                                data-testid={`button-expand-lead-${lead.id}`}
                              >
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Show activeCard title if available */}
                          {lead.activeCard?.title && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                              <FileText className="h-3 w-3 text-primary" />
                              <span className="truncate font-medium text-primary">{lead.activeCard.title}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between gap-1 text-xs mb-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Wallet className="h-3 w-3" />
                              <span className="font-medium text-foreground truncate">
                                {/* Prefer activeCard budget, fallback to legacy */}
                                {lead.activeCard?.budgetMin || lead.activeCard?.budgetMax
                                  ? `$${lead.activeCard.budgetMin ? parseFloat(lead.activeCard.budgetMin).toLocaleString() : "0"} - $${lead.activeCard.budgetMax ? parseFloat(lead.activeCard.budgetMax).toLocaleString() : "—"}`
                                  : lead.estimatedRentCost 
                                    ? `$${lead.estimatedRentCost.toLocaleString()}` 
                                    : "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Bed className="h-3 w-3" />
                                <span className="font-medium text-foreground">
                                  {/* Prefer activeCard bedrooms, fallback to legacy */}
                                  {lead.activeCard?.bedrooms ?? lead.bedrooms ?? "—"}
                                </span>
                              </div>
                              {/* Prefer activeCard hasPets, fallback to legacy */}
                              {(() => {
                                const hasPetsValue = lead.activeCard?.hasPets ?? lead.hasPets;
                                const hasPets = hasPetsValue === "yes" || hasPetsValue === "si" || hasPetsValue === "sí" || hasPetsValue === "true" || (hasPetsValue && hasPetsValue !== "no" && hasPetsValue !== "No");
                                return hasPets ? <PawPrint className="h-3 w-3 text-amber-500" /> : null;
                              })()}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between gap-2">
                            <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
                              {getStatusLabel(lead.status)}
                            </Badge>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="h-7 gap-1 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                applyLeadFilters(lead);
                              }}
                            >
                              <Target className="h-3 w-3" />
                              Filtrar
                            </Button>
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span className="text-foreground truncate">{formatDate(lead.createdAt)}</span>
                              </div>
                              {/* Prefer activeCard zone, fallback to legacy */}
                              {(lead.activeCard?.zone || lead.desiredNeighborhood) && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span className="text-foreground truncate">{lead.activeCard?.zone || lead.desiredNeighborhood}</span>
                                </div>
                              )}
                              {/* Prefer activeCard propertyType, fallback to legacy */}
                              {(lead.activeCard?.propertyType || lead.desiredUnitType) && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Home className="h-3 w-3" />
                                  <span className="text-foreground truncate">{lead.activeCard?.propertyType || lead.desiredUnitType}</span>
                                </div>
                              )}
                              {/* Prefer activeCard contractDuration, fallback to legacy */}
                              {(lead.activeCard?.contractDuration || lead.contractDuration) && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <FileText className="h-3 w-3" />
                                  <span className="text-foreground truncate">{lead.activeCard?.contractDuration || lead.contractDuration}</span>
                                </div>
                              )}
                              {/* Show bathrooms from activeCard if available */}
                              {lead.activeCard?.bathrooms && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Bath className="h-3 w-3" />
                                  <span className="text-foreground truncate">{lead.activeCard.bathrooms} baños</span>
                                </div>
                              )}
                              {/* Show move-in date from activeCard if available */}
                              {lead.activeCard?.moveInDate && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="h-3 w-3 text-primary" />
                                  <span className="text-foreground truncate">Check-in: {formatDate(lead.activeCard.moveInDate)}</span>
                                </div>
                              )}
                              {lead.email && (
                                <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                                  <span className="text-foreground truncate">{lead.email}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-shrink-0 border-b bg-background p-3 sm:p-4">
          {/* Mobile: Compact header with title and controls in one row */}
          {isMobile ? (
            <div className="space-y-3">
              {/* Title row with leads toggle */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Button 
                    variant={showLeadPanel ? "default" : "outline"} 
                    size="icon" 
                    className="h-9 w-9 flex-shrink-0"
                    onClick={() => setShowLeadPanel(!showLeadPanel)}
                    data-testid="button-toggle-leads"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <h1 className="text-base font-bold truncate" data-testid="text-page-title">
                    Catálogo
                  </h1>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {catalogData?.total || 0}
                  </Badge>
                </div>
                {/* View mode toggle */}
                <div className="flex border rounded-md overflow-hidden flex-shrink-0">
                  <Button 
                    variant={viewMode === "grid" ? "default" : "ghost"} 
                    size="icon" 
                    className="h-9 w-9 rounded-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === "table" ? "default" : "ghost"} 
                    size="icon" 
                    className="h-9 w-9 rounded-none"
                    onClick={() => setViewMode("table")}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Search + Filter row */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10"
                    data-testid="input-search"
                  />
                </div>
                <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 relative flex-shrink-0" data-testid="button-filters">
                      <SlidersHorizontal className="h-4 w-4" />
                      {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtrar propiedades</h4>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="mr-1 h-3 w-3" />
                        Limpiar
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Precio mín</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={filters.minPrice}
                          onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                          data-testid="input-min-price"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Precio máx</Label>
                        <Input
                          type="number"
                          placeholder="100000"
                          value={filters.maxPrice}
                          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                          data-testid="input-max-price"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Recámaras</Label>
                      <Select
                        value={filters.bedrooms}
                        onValueChange={(v) => setFilters({ ...filters, bedrooms: v })}
                      >
                        <SelectTrigger data-testid="select-bedrooms">
                          <SelectValue placeholder="Cualquiera" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_all">Cualquiera</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Zona</Label>
                      <Select
                        value={filters.zone}
                        onValueChange={(v) => setFilters({ ...filters, zone: v })}
                      >
                        <SelectTrigger data-testid="select-zone">
                          <SelectValue placeholder="Todas las zonas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_all">Todas las zonas</SelectItem>
                          {zones?.map((zone) => (
                            <SelectItem key={zone.id} value={zone.name}>
                              {zone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Tipo de propiedad</Label>
                      <Select
                        value={filters.propertyType}
                        onValueChange={(v) => setFilters({ ...filters, propertyType: v })}
                      >
                        <SelectTrigger data-testid="select-property-type">
                          <SelectValue placeholder="Todos los tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_all">Todos los tipos</SelectItem>
                          {propertyTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Estado</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(v) => setFilters({ ...filters, status: v })}
                      >
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Disponible</SelectItem>
                          <SelectItem value="rented">Rentada</SelectItem>
                          <SelectItem value="_all">Todas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={() => setFiltersOpen(false)} className="w-full h-10">
                    Aplicar filtros
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {selectedLead && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1 h-10">
                <X className="h-3 w-3" />
                <span className="hidden sm:inline">Quitar filtros de {selectedLead.firstName}</span>
                <span className="sm:hidden">Limpiar</span>
              </Button>
            )}

            {viewMode === "table" && selectedUnits.size > 0 && (
              <Button 
                onClick={handleOpenBulkShare} 
                className="gap-2 h-10"
                data-testid="button-bulk-share"
              >
                <SiWhatsapp className="h-4 w-4" />
                <span className="hidden sm:inline">Enviar {selectedUnits.size} propiedades</span>
                <span className="sm:hidden">{selectedUnits.size}</span>
              </Button>
            )}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop: Original layout */}
              <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  {!showLeadPanel && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowLeadPanel(true)}
                      className="gap-1 h-9"
                      data-testid="button-show-leads"
                    >
                      <Users className="h-4 w-4" />
                      <span>Leads</span>
                    </Button>
                  )}
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold" data-testid="text-page-title">
                      {t("sellerCatalog.title", "Catálogo de Propiedades")}
                    </h1>
                    {selectedLead && (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Propiedades para <span className="font-medium text-primary">{selectedLead.firstName} {selectedLead.lastName}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {catalogData?.total || 0} propiedades
                  </Badge>
                  <div className="flex border rounded-md overflow-hidden">
                    <Button 
                      variant={viewMode === "grid" ? "default" : "ghost"} 
                      size="icon" 
                      className="h-9 w-9 rounded-none"
                      onClick={() => setViewMode("grid")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={viewMode === "table" ? "default" : "ghost"} 
                      size="icon" 
                      className="h-9 w-9 rounded-none"
                      onClick={() => setViewMode("table")}
                    >
                      <LayoutList className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="relative flex-1 min-w-[150px] sm:min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("sellerCatalog.searchPlaceholder", "Buscar propiedad...")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10"
                    data-testid="input-search"
                  />
                </div>

                <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2 h-10" data-testid="button-filters">
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>Filtros</span>
                      {hasActiveFilters && (
                        <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                          {Object.values(filters).filter((v) => v && v !== "active").length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Filtrar propiedades</h4>
                        {hasActiveFilters && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            <X className="mr-1 h-3 w-3" />
                            Limpiar
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Precio mín</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={filters.minPrice}
                              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                              data-testid="input-min-price"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Precio máx</Label>
                            <Input
                              type="number"
                              placeholder="100000"
                              value={filters.maxPrice}
                              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                              data-testid="input-max-price"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Recámaras</Label>
                          <Select
                            value={filters.bedrooms}
                            onValueChange={(v) => setFilters({ ...filters, bedrooms: v })}
                          >
                            <SelectTrigger data-testid="select-bedrooms">
                              <SelectValue placeholder="Cualquiera" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_all">Cualquiera</SelectItem>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Zona</Label>
                          <Select
                            value={filters.zone}
                            onValueChange={(v) => setFilters({ ...filters, zone: v })}
                          >
                            <SelectTrigger data-testid="select-zone">
                              <SelectValue placeholder="Todas las zonas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_all">Todas las zonas</SelectItem>
                              {zones?.map((zone) => (
                                <SelectItem key={zone.id} value={zone.name}>
                                  {zone.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Tipo de propiedad</Label>
                          <Select
                            value={filters.propertyType}
                            onValueChange={(v) => setFilters({ ...filters, propertyType: v })}
                          >
                            <SelectTrigger data-testid="select-property-type">
                              <SelectValue placeholder="Todos los tipos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_all">Todos los tipos</SelectItem>
                              {propertyTypes?.map((type) => (
                                <SelectItem key={type.id} value={type.name}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Estado</Label>
                          <Select
                            value={filters.status}
                            onValueChange={(v) => setFilters({ ...filters, status: v })}
                          >
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Disponible</SelectItem>
                              <SelectItem value="rented">Rentada</SelectItem>
                              <SelectItem value="_all">Todas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button onClick={() => setFiltersOpen(false)} className="w-full h-10">
                        Aplicar filtros
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {selectedLead && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1 h-10">
                    <X className="h-3 w-3" />
                    <span>Quitar filtros de {selectedLead.firstName}</span>
                  </Button>
                )}

                {viewMode === "table" && selectedUnits.size > 0 && (
                  <Button 
                    onClick={handleOpenBulkShare} 
                    className="gap-2 h-10"
                    data-testid="button-bulk-share"
                  >
                    <SiWhatsapp className="h-4 w-4" />
                    <span>Enviar {selectedUnits.size} propiedades</span>
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pagination Controls - Compact for Mobile */}
        {!isLoading && totalUnits > 0 && (
          isMobile ? (
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="h-9 w-9"
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {page}/{totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
                disabled={page === totalPages || totalPages === 0 || isFetching}
                className="h-9 w-9"
                data-testid="button-next-page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mostrar</span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(val) => {
                    setItemsPerPage(Number(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px] h-9" data-testid="select-items-per-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">por página</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages || 1}
                </span>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isFetching}
                    className="h-9 w-9"
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
                    disabled={page === totalPages || totalPages === 0 || isFetching}
                    className="h-9 w-9"
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )
        )}

        <ScrollArea className="flex-1 p-3 sm:p-4">
          {isLoading ? (
            viewMode === "grid" ? (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-36 sm:h-40 w-full rounded-t-lg" />
                    <CardContent className="p-3 sm:p-4">
                      <Skeleton className="mb-2 h-5 w-3/4" />
                      <Skeleton className="mb-4 h-4 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            )
          ) : units.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">
                No se encontraron propiedades
              </h3>
              <p className="text-muted-foreground">
                Intenta ajustar los filtros de búsqueda
              </p>
              {selectedLead && (
                <Button variant="outline" className="mt-4 h-10" onClick={clearFilters}>
                  Quitar filtros de {selectedLead.firstName}
                </Button>
              )}
            </Card>
          ) : viewMode === "grid" ? (
            /* ============================================
               PROFESSIONAL CARD GRID VIEW - Redesigned
               ============================================ */
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {units.map((unit) => {
                const matchInfo = selectedLead ? calculateMatchScore(unit, selectedLead) : { score: 0, reasons: [] };
                return (
                  <Card 
                    key={unit.id} 
                    className="group overflow-hidden flex flex-col bg-card hover-elevate transition-all duration-200" 
                    data-testid={`card-property-${unit.id}`}
                  >
                    {/* Image Section - Clickable to open detail */}
                    <div 
                      className="relative aspect-[16/10] bg-muted overflow-hidden cursor-pointer"
                      onClick={() => handleOpenDetail(unit)}
                      data-testid={`button-open-detail-${unit.id}`}
                    >
                      {unit.images && unit.images.length > 0 ? (
                        <img
                          src={unit.images[0]}
                          alt={unit.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                          <Home className="h-12 w-12 text-muted-foreground/40" />
                        </div>
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      
                      {/* Top Left: Match Score */}
                      {matchInfo.score > 0 && (
                        <div className={`absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-white ${
                          matchInfo.score >= 70 ? "bg-green-600" : 
                          matchInfo.score >= 40 ? "bg-amber-500" : 
                          "bg-orange-500"
                        }`}>
                          <Target className="h-3 w-3" />
                          {matchInfo.score}%
                        </div>
                      )}
                      
                      {/* Top Right: Image Count */}
                      {unit.images && unit.images.length > 1 && (
                        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
                          <Maximize2 className="h-3 w-3" />
                          {unit.images.length}
                        </div>
                      )}
                      
                    </div>

                    {/* Content Section */}
                    <CardContent className="p-3 flex-1 flex flex-col gap-2">
                      {/* Status Badge - outside image container to avoid clipping */}
                      <Badge
                        className={`w-fit text-xs px-2 py-0.5 mb-1 ${
                          unit.status === "active" 
                            ? "bg-green-600 hover:bg-green-700 text-white border-0" 
                            : "bg-red-600 hover:bg-red-700 text-white border-0"
                        }`}
                      >
                        {unit.status === "active" ? "Disponible" : "Rentada"}
                      </Badge>
                      {/* Referrer Badge - Shows if property has a referrer for higher commission */}
                      {unit.referrerName && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-[10px] px-1.5 py-0.5">
                            <Star className="h-3 w-3 mr-0.5 fill-current" />
                            Referido
                          </Badge>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            40-50% comisión
                          </span>
                        </div>
                      )}
                      
                      {/* Title Row: Name + Prices */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base line-clamp-1" data-testid={`text-unit-name-${unit.id}`}>
                            {unit.condominiumName || unit.name}
                          </h3>
                          <div className="flex items-center justify-start gap-2 text-sm text-muted-foreground w-full">
                            {unit.unitNumber && (
                              <span className="font-medium text-foreground">#{unit.unitNumber}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{unit.zone || "Sin zona"}</span>
                            </span>
                          </div>
                        </div>
                        {/* Prices - Clean black text style */}
                        <div className="flex-shrink-0 text-right">
                          {/* Rent Price */}
                          {unit.monthlyRent && (
                            <div className="flex items-center gap-1 justify-end">
                              <span className="text-sm font-bold text-foreground">
                                ${unit.monthlyRent?.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                /{unit.currency || "MXN"}/mes
                              </span>
                            </div>
                          )}
                          {/* Sale Price */}
                          {unit.salePrice && parseFloat(unit.salePrice) > 0 && (
                            <div className="flex items-center gap-1 justify-end">
                              <span className="text-sm font-bold text-foreground">
                                ${parseFloat(unit.salePrice).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {unit.currency || "MXN"} venta
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Property Specs Row - Recámaras, Baños, M2, Pet Friendly */}
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 py-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{unit.bedrooms || 0}</span>
                          <span className="text-muted-foreground text-xs">rec</span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{unit.bathrooms || 0}</span>
                          <span className="text-muted-foreground text-xs">baños</span>
                        </div>
                        {unit.squareMeters && (
                          <>
                            <Separator orientation="vertical" className="h-4" />
                            <div className="flex items-center gap-1">
                              <Square className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{unit.squareMeters}</span>
                              <span className="text-muted-foreground text-xs">m²</span>
                            </div>
                          </>
                        )}
                        {unit.petsAllowed && (
                          <>
                            <Separator orientation="vertical" className="h-4" />
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                              <PawPrint className="h-4 w-4" />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Characteristics Badges Row */}
                      <div className="flex flex-wrap gap-1">
                        {unit.unitType && (
                          <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0.5">
                            {unit.unitType}
                          </Badge>
                        )}
                        {unit.hasFurniture && (
                          <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0.5">
                            Amueblado
                          </Badge>
                        )}
                        {unit.hasParking && (
                          <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0.5">
                            Estacionamiento
                          </Badge>
                        )}
                        {unit.hasAC && (
                          <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0.5">
                            A/C
                          </Badge>
                        )}
                      </div>

                      {/* Amenities Badges Row */}
                      {(unit.amenities && unit.amenities.length > 0) && (
                        <div className="flex flex-wrap gap-1">
                          {unit.amenities.slice(0, 4).map((amenity, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] font-normal px-1.5 py-0.5">
                              {amenity}
                            </Badge>
                          ))}
                          {unit.amenities.length > 4 && (
                            <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0.5">
                              +{unit.amenities.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>

                    {/* Action Footer */}
                    <CardFooter className="p-3 pt-0 gap-2 mt-auto">
                      {selectedLead ? (
                        <Button
                          className="flex-1 h-11 gap-2 text-sm font-medium"
                          onClick={() => handleDirectWhatsApp(unit, selectedLead)}
                          data-testid={`button-whatsapp-${unit.id}`}
                        >
                          <SiWhatsapp className="h-4 w-4" />
                          Enviar a {selectedLead.firstName}
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            className="flex-1 h-11 gap-2 text-sm"
                            onClick={() => handleFindMatches(unit)}
                            data-testid={`button-find-matches-${unit.id}`}
                          >
                            <Users className="h-4 w-4" />
                            Buscar Leads
                          </Button>
                          <Button
                            className="flex-1 h-11 gap-2 text-sm font-medium"
                            onClick={() => handleShareClick(unit)}
                            data-testid={`button-share-${unit.id}`}
                          >
                            <SiWhatsapp className="h-4 w-4" />
                            Compartir
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* ============================================
               PROFESSIONAL TABLE/LIST VIEW - Redesigned
               ============================================ */
            <div className="space-y-3">
              {/* Header Row */}
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg sticky top-0 z-10">
                <Checkbox 
                  checked={selectedUnits.size === units.length && units.length > 0}
                  onCheckedChange={selectAllUnits}
                  className="h-5 w-5"
                  data-testid="checkbox-select-all"
                />
                <span className="text-sm font-medium flex-1">
                  {selectedUnits.size > 0 
                    ? `${selectedUnits.size} de ${units.length} propiedades seleccionadas` 
                    : "Seleccionar todas las propiedades"}
                </span>
                {selectedUnits.size > 0 && selectedLead && (
                  <Button 
                    size="sm"
                    className="gap-2 h-9"
                    onClick={handleOpenBulkShare}
                  >
                    <SiWhatsapp className="h-4 w-4" />
                    Enviar selección
                  </Button>
                )}
              </div>
              
              {/* Property Rows */}
              {units.map((unit) => {
                const matchInfo = selectedLead ? calculateMatchScore(unit, selectedLead) : { score: 0, reasons: [] };
                const isSelected = selectedUnits.has(unit.id);
                
                return (
                  <Card 
                    key={unit.id} 
                    className={`overflow-hidden transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-primary shadow-md' : 'hover-elevate'
                    }`}
                    data-testid={`row-property-${unit.id}`}
                  >
                    <div className="flex items-stretch min-h-[140px]">
                      {/* Checkbox Column */}
                      <div 
                        className="flex items-center justify-center w-12 sm:w-14 border-r bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleUnitSelection(unit.id)}
                      >
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleUnitSelection(unit.id)}
                          className="h-5 w-5"
                          data-testid={`checkbox-unit-${unit.id}`}
                        />
                      </div>
                      
                      {/* Image Column */}
                      <div className="w-32 sm:w-40 flex-shrink-0 relative bg-muted">
                        {unit.images && unit.images.length > 0 ? (
                          <img
                            src={unit.images[0]}
                            alt={unit.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                            <Home className="h-10 w-10 text-muted-foreground/40" />
                          </div>
                        )}
                        
                        
                        {/* Match Score */}
                        {matchInfo.score > 0 && (
                          <div className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${
                            matchInfo.score >= 70 ? "bg-green-600" : 
                            matchInfo.score >= 40 ? "bg-amber-500" : 
                            "bg-orange-500"
                          }`}>
                            {matchInfo.score}%
                          </div>
                        )}
                      </div>
                      
                      {/* Main Content */}
                      <div className="flex-1 p-3 flex flex-col gap-2">
                        {/* Status Badge - outside image to avoid clipping */}
                        <Badge
                          className={`w-fit text-xs px-2 py-0.5 ${
                            unit.status === "active" 
                              ? "bg-green-600 text-white border-0" 
                              : "bg-red-600 text-white border-0"
                          }`}
                        >
                          {unit.status === "active" ? "Disponible" : "Rentada"}
                        </Badge>
                        {/* Title Row: Name + Price */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-base line-clamp-1">
                              {unit.condominiumName || unit.name}
                            </h3>
                            <div className="flex items-center justify-start gap-2 text-sm text-muted-foreground w-full">
                              {unit.unitNumber && (
                                <span className="font-medium text-foreground">#{unit.unitNumber}</span>
                              )}
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{unit.zone || "Sin zona"}</span>
                              </span>
                            </div>
                          </div>
                          {/* Price Badge */}
                          <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 rounded-lg px-2.5 py-1.5 border border-primary/20">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-primary" />
                              <span className="text-sm font-bold text-foreground">
                                {unit.monthlyRent?.toLocaleString() || "—"}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground block text-center">
                              {unit.currency || "MXN"}/mes
                            </span>
                          </div>
                        </div>
                        
                        {/* Specs Row - Recámaras, Baños, M2, Pet Friendly */}
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{unit.bedrooms || 0}</span>
                            <span className="text-muted-foreground text-xs">rec</span>
                          </div>
                          <Separator orientation="vertical" className="h-4" />
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{unit.bathrooms || 0}</span>
                            <span className="text-muted-foreground text-xs">baños</span>
                          </div>
                          {unit.squareMeters && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <div className="flex items-center gap-1">
                                <Square className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{unit.squareMeters}</span>
                                <span className="text-muted-foreground text-xs">m²</span>
                              </div>
                            </>
                          )}
                          {unit.petsAllowed && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                                <PawPrint className="h-4 w-4" />
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Characteristics Badges */}
                        <div className="flex flex-wrap gap-1">
                          {unit.unitType && (
                            <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0.5">
                              {unit.unitType}
                            </Badge>
                          )}
                          {unit.hasFurniture && (
                            <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0.5">
                              Amueblado
                            </Badge>
                          )}
                          {unit.hasParking && (
                            <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0.5">
                              Estacionamiento
                            </Badge>
                          )}
                          {unit.hasAC && (
                            <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0.5">
                              A/C
                            </Badge>
                          )}
                        </div>

                        {/* Amenities Badges */}
                        {(unit.amenities && unit.amenities.length > 0) && (
                          <div className="flex flex-wrap gap-1">
                            {unit.amenities.slice(0, 3).map((amenity, idx) => (
                              <Badge key={idx} variant="outline" className="text-[10px] font-normal px-1.5 py-0.5">
                                {amenity}
                              </Badge>
                            ))}
                            {unit.amenities.length > 3 && (
                              <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0.5">
                                +{unit.amenities.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Actions Column */}
                      <div className="flex flex-col justify-center gap-2 p-3 border-l bg-muted/20">
                        {selectedLead ? (
                          <Button
                            className="h-11 w-11 p-0"
                            onClick={() => handleDirectWhatsApp(unit, selectedLead)}
                            data-testid={`button-whatsapp-table-${unit.id}`}
                          >
                            <SiWhatsapp className="h-5 w-5" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-11 w-11"
                              onClick={() => handleFindMatches(unit)}
                              data-testid={`button-find-matches-table-${unit.id}`}
                              title="Buscar leads compatibles"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              className="h-11 w-11"
                              onClick={() => handleShareClick(unit)}
                              data-testid={`button-share-table-${unit.id}`}
                              title="Compartir por WhatsApp"
                            >
                              <SiWhatsapp className="h-5 w-5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

        </ScrollArea>
      </div>

      <Dialog open={matchingLeadsOpen} onOpenChange={setMatchingLeadsOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leads compatibles
            </DialogTitle>
            <DialogDescription>
              {selectedUnit?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 space-y-2 overflow-y-auto">
            {matchingLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : matchingLeads && matchingLeads.length > 0 ? (
              matchingLeads.map((lead) => (
                <Card
                  key={lead.id}
                  className="cursor-pointer transition-colors hover-elevate"
                  onClick={() => handleShareWithLead(lead)}
                  data-testid={`card-matching-lead-${lead.id}`}
                >
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{lead.phone}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {lead.matchReasons.map((reason, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={lead.matchScore >= 50 ? "default" : "secondary"}>
                        {lead.matchScore}%
                      </Badge>
                      <SiWhatsapp className="h-5 w-5 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-8 text-center">
                <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  No se encontraron leads compatibles
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SiWhatsapp className="h-5 w-5 text-green-600" />
              Compartir por WhatsApp
            </DialogTitle>
            <DialogDescription>
              {selectedUnit?.name}
              {selectedLead && ` → ${selectedLead.firstName} ${selectedLead.lastName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedLead && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Primero selecciona un lead desde el panel izquierdo o desde "Leads compatibles"
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-10"
                  onClick={() => {
                    setShareDialogOpen(false);
                    setMatchingLeadsOpen(true);
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Seleccionar lead
                </Button>
              </div>
            )}

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Plantilla de mensaje
              </Label>
              <Select value={selectedTemplateId} onValueChange={(v) => {
                setSelectedTemplateId(v);
                const template = singlePropertyTemplates.find(t => t.id === v);
                if (template && selectedUnit) {
                  setCustomMessage(generateMessageFromTemplate(template, selectedUnit, selectedLead));
                }
              }}>
                <SelectTrigger data-testid="select-template">
                  <SelectValue placeholder="Selecciona una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {singlePropertyTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mensaje</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={8}
                className="mt-1 font-mono text-sm"
                data-testid="textarea-share-message"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1 h-10">
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              {selectedUnit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const template = singlePropertyTemplates.find(t => t.id === selectedTemplateId) || singlePropertyTemplates[0];
                    setCustomMessage(generateMessageFromTemplate(template, selectedUnit, selectedLead));
                  }}
                  className="gap-1 h-10"
                >
                  Restaurar
                </Button>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShareDialogOpen(false)} className="w-full sm:w-auto h-10">
              Cancelar
            </Button>
            <Button
              onClick={handleSendShare}
              disabled={!selectedLead || sharePropertyMutation.isPending}
              className="gap-2 w-full sm:w-auto h-10"
              data-testid="button-send-share"
            >
              <SiWhatsapp className="h-4 w-4" />
              {sharePropertyMutation.isPending
                ? "Enviando..."
                : "Abrir WhatsApp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkShareDialogOpen} onOpenChange={setBulkShareDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SiWhatsapp className="h-5 w-5 text-green-600" />
              Enviar {selectedUnits.size} propiedades
            </DialogTitle>
            <DialogDescription>
              {selectedLead 
                ? `Enviar a ${selectedLead.firstName} ${selectedLead.lastName}` 
                : "Selecciona un lead para enviar las propiedades"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedLead && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Selecciona un lead desde el panel lateral para poder enviar las propiedades
                </p>
              </div>
            )}

            <div className="max-h-32 overflow-y-auto rounded-lg border p-2">
              {units.filter(u => selectedUnits.has(u.id)).map((unit) => (
                <div key={unit.id} className="flex items-center gap-2 py-1 text-sm">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{unit.name}</span>
                  <span className="text-muted-foreground ml-auto">${unit.monthlyRent?.toLocaleString() || "—"}</span>
                </div>
              ))}
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Plantilla de mensaje
              </Label>
              <Select value={selectedBulkTemplateId} onValueChange={(v) => {
                setSelectedBulkTemplateId(v);
                const template = multiPropertyTemplates.find(t => t.id === v);
                if (template) {
                  const selectedUnitsList = units.filter(u => selectedUnits.has(u.id));
                  setCustomMessage(generateBulkMessage(template, selectedUnitsList, selectedLead));
                }
              }}>
                <SelectTrigger data-testid="select-bulk-template">
                  <SelectValue placeholder="Selecciona una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {multiPropertyTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mensaje</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                data-testid="textarea-bulk-message"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1 h-10">
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setBulkShareDialogOpen(false)} className="w-full sm:w-auto h-10">
              Cancelar
            </Button>
            <Button
              onClick={handleBulkShare}
              disabled={!selectedLead}
              className="gap-2 w-full sm:w-auto h-10"
              data-testid="button-send-bulk-share"
            >
              <SiWhatsapp className="h-4 w-4" />
              Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Property Detail Modal */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          {detailUnit && (
            <div className="flex flex-col max-h-[90vh]">
              {/* Image Gallery */}
              <div className="relative aspect-[16/9] bg-muted overflow-hidden">
                {detailUnit.images && detailUnit.images.length > 0 ? (
                  <>
                    <img
                      src={detailUnit.images[detailImageIndex]}
                      alt={detailUnit.name}
                      className="h-full w-full object-cover"
                    />
                    {/* Image Navigation */}
                    {detailUnit.images.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background"
                          onClick={() => setDetailImageIndex(prev => prev === 0 ? detailUnit.images!.length - 1 : prev - 1)}
                          data-testid="button-prev-image"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background"
                          onClick={() => setDetailImageIndex(prev => prev === detailUnit.images!.length - 1 ? 0 : prev + 1)}
                          data-testid="button-next-image"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                        {/* Image Counter */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {detailUnit.images.map((_, idx) => (
                            <button
                              key={idx}
                              className={`h-2 w-2 rounded-full transition-colors ${idx === detailImageIndex ? 'bg-white' : 'bg-white/50'}`}
                              onClick={() => setDetailImageIndex(idx)}
                            />
                          ))}
                        </div>
                        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                          {detailImageIndex + 1} / {detailUnit.images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                    <Home className="h-16 w-16 text-muted-foreground/40" />
                  </div>
                )}
                
                {/* Status Badge */}
                <Badge
                  className={`absolute top-3 left-3 ${
                    detailUnit.status === "active" 
                      ? "bg-green-600 hover:bg-green-700 text-white border-0" 
                      : "bg-red-600 hover:bg-red-700 text-white border-0"
                  }`}
                >
                  {detailUnit.status === "active" ? "Disponible" : "Rentada"}
                </Badge>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 max-h-[50vh]">
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {detailUnit.condominiumName || detailUnit.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                        {detailUnit.unitNumber && (
                          <span className="font-medium text-foreground">#{detailUnit.unitNumber}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {detailUnit.zone || "Sin zona"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ${detailUnit.monthlyRent?.toLocaleString() || "—"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {detailUnit.currency || "MXN"}/mes
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Property Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Bed className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold">{detailUnit.bedrooms || 0}</div>
                        <div className="text-xs text-muted-foreground">Recámaras</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Bath className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold">{detailUnit.bathrooms || 0}</div>
                        <div className="text-xs text-muted-foreground">Baños</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Square className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold">{detailUnit.squareMeters || "—"}</div>
                        <div className="text-xs text-muted-foreground">m²</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold">{detailUnit.unitType || "—"}</div>
                        <div className="text-xs text-muted-foreground">Tipo</div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {detailUnit.hasFurniture && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Amueblado
                      </Badge>
                    )}
                    {detailUnit.hasParking && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Estacionamiento
                      </Badge>
                    )}
                    {detailUnit.petsAllowed && (
                      <Badge variant="secondary" className="gap-1 text-green-600 dark:text-green-500">
                        <PawPrint className="h-3 w-3" />
                        Pet Friendly
                      </Badge>
                    )}
                  </div>

                  {/* Amenities */}
                  {detailUnit.amenities && detailUnit.amenities.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Amenidades</h4>
                      <div className="flex flex-wrap gap-2">
                        {detailUnit.amenities.map((amenity, idx) => (
                          <Badge key={idx} variant="outline">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {detailUnit.description && (
                    <div>
                      <h4 className="font-semibold mb-2">Descripción</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {detailUnit.description}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Action Footer */}
              <div className="border-t p-4 bg-background">
                <div className="flex flex-col sm:flex-row gap-3">
                  {selectedLead ? (
                    <>
                      <Button
                        className="flex-1 h-12 gap-2"
                        onClick={() => {
                          handleDirectWhatsApp(detailUnit, selectedLead);
                          setDetailDialogOpen(false);
                        }}
                        data-testid="button-detail-whatsapp"
                      >
                        <SiWhatsapp className="h-5 w-5" />
                        Enviar a {selectedLead.firstName} por WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 h-12 gap-2"
                        onClick={() => {
                          handleFindMatches(detailUnit);
                          setDetailDialogOpen(false);
                        }}
                        data-testid="button-detail-find-matches"
                      >
                        <Users className="h-5 w-5" />
                        Buscar otros leads
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        className="flex-1 h-12 gap-2"
                        onClick={() => {
                          handleFindMatches(detailUnit);
                          setDetailDialogOpen(false);
                        }}
                        data-testid="button-detail-find-leads"
                      >
                        <Sparkles className="h-5 w-5" />
                        Buscar Leads Compatibles
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 h-12 gap-2"
                        onClick={() => {
                          handleShareClick(detailUnit);
                          setDetailDialogOpen(false);
                        }}
                        data-testid="button-detail-share"
                      >
                        <Share2 className="h-5 w-5" />
                        Compartir
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
