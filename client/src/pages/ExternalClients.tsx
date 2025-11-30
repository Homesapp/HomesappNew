import { useState, useEffect, useLayoutEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Filter,
  Search,
  X,
  MoreVertical,
  Pencil,
  Edit2,
  Trash2,
  LayoutGrid,
  Table as TableIcon,
  Columns,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  CalendarDays,
  Tag,
  FileText,
  UserCheck,
  Ban,
  CheckCheck,
  Copy,
  Link as LinkIcon,
  RefreshCw,
  Building2,
  Handshake,
  User,
  Users,
  UserPlus,
  Briefcase,
  DollarSign,
  BedDouble,
  Home,
  Clock,
  PawPrint,
  Activity,
  Globe,
  Loader2,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  Save,
  ArrowLeftCircle,
  Sparkles,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import * as XLSX from "xlsx";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import { useDebounce } from "@/hooks/useDebounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, ApiError } from "@/lib/queryClient";
import type { ExternalClient, ExternalLead, ExternalLeadWithActiveCard } from "@shared/schema";
import { insertExternalClientSchema, insertExternalLeadSchema, updateExternalLeadSchema } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";
import LeadKanbanView from "@/components/external/LeadKanbanView";
import LeadCRMTabs from "@/components/external/LeadCRMTabs";
import ClientCRMTabs from "@/components/external/ClientCRMTabs";
import { SearchableSelect, type SelectOption } from "@/components/ui/searchable-select";
import { SearchableMultiSelect, type MultiSelectOption } from "@/components/ui/searchable-multi-select";

type ClientFormData = z.infer<typeof insertExternalClientSchema>;

const editClientSchema = insertExternalClientSchema.partial();
type EditClientFormData = z.infer<typeof editClientSchema>;

type LeadFormData = z.infer<typeof insertExternalLeadSchema>;
type EditLeadFormData = z.infer<typeof updateExternalLeadSchema>;

type SortField = "name" | "email" | "phone" | "status" | "createdAt";
type SortOrder = "asc" | "desc";

export default function ExternalClients() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();
  const [, navigate] = useLocation();

  const [activeTab, setActiveTab] = useState<"clients" | "leads">(user?.role === 'external_agency_seller' ? "leads" : "clients");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "kanban">(isMobile ? "cards" : "table");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ExternalClient | null>(null);

  // Lead states
  const [isCreateLeadDialogOpen, setIsCreateLeadDialogOpen] = useState(false);
  const [createLeadStep, setCreateLeadStep] = useState<1 | 2>(1); // 2-step wizard: 1=Contact, 2=Preferences
  const [isValidatingStep, setIsValidatingStep] = useState(false); // Validation loading state
  const [isEditLeadDialogOpen, setIsEditLeadDialogOpen] = useState(false);
  const [isDeleteLeadDialogOpen, setIsDeleteLeadDialogOpen] = useState(false);
  const [isConvertToLeadDialogOpen, setIsConvertToLeadDialogOpen] = useState(false);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<ExternalLead | null>(null);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [newAssignedSellerId, setNewAssignedSellerId] = useState<string>("");
  const [selectedAgencyIdForLead, setSelectedAgencyIdForLead] = useState<string>("");
  
  // Check if user is master/admin (needs agency selection)
  const isMasterOrAdmin = user?.role === 'master' || user?.role === 'admin';
  const isSeller = user?.role === 'external_agency_seller';
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const debouncedLeadSearchTerm = useDebounce(leadSearchTerm, 400);
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("all");
  const [leadRegistrationTypeFilter, setLeadRegistrationTypeFilter] = useState<string>("all");
  const [leadSellerFilter, setLeadSellerFilter] = useState<string>("all");
  const [leadHasPetsFilter, setLeadHasPetsFilter] = useState<string>("all");
  const [leadFollowUpFilter, setLeadFollowUpFilter] = useState<string>("all");
  const [isLeadFilterOpen, setIsLeadFilterOpen] = useState(false);
  const [leadCurrentPage, setLeadCurrentPage] = useState(1);
  const [leadItemsPerPage, setLeadItemsPerPage] = useState(12);
  const [leadSortField, setLeadSortField] = useState<string>("createdAt");
  const [leadSortOrder, setLeadSortOrder] = useState<"asc" | "desc">("desc");
  const [isPublicLinksExpanded, setIsPublicLinksExpanded] = useState(false);
  
  // Lead import states
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "importing" | "complete">("upload");
  const [importResults, setImportResults] = useState<{ imported: number; duplicates: number; errors: any[]; warnings?: any[] } | null>(null);

  useLayoutEffect(() => {
    setViewMode(isMobile ? "cards" : "table");
  }, [isMobile]);

  const { data: clientsResponse, isLoading } = useQuery<{ data: ExternalClient[]; total: number; limit: number; offset: number; hasMore: boolean }>({
    queryKey: ["/api/external-clients", statusFilter, verifiedFilter, debouncedSearchTerm, sortField, sortOrder, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (verifiedFilter !== "all") params.append("isVerified", verifiedFilter === "verified" ? "true" : "false");
      if (debouncedSearchTerm.trim()) params.append("search", debouncedSearchTerm.trim());
      if (sortField) params.append("sortField", sortField);
      if (sortOrder) params.append("sortOrder", sortOrder);
      params.append("limit", itemsPerPage.toString());
      params.append("offset", ((currentPage - 1) * itemsPerPage).toString());
      
      const response = await fetch(`/api/external-clients?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - clients change occasionally
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    keepPreviousData: true, // Smooth pagination
  });

  const clients = clientsResponse?.data || [];
  const totalClients = clientsResponse?.total || 0;

  const { data: leadsResponse, isLoading: leadsLoading } = useQuery<{ data: ExternalLeadWithActiveCard[]; total: number; limit: number; offset: number; hasMore: boolean }>({
    queryKey: ["/api/external-leads", leadStatusFilter, leadRegistrationTypeFilter, leadSellerFilter, debouncedLeadSearchTerm, leadSortField, leadSortOrder, leadCurrentPage, leadItemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (leadStatusFilter !== "all") params.append("status", leadStatusFilter);
      if (leadRegistrationTypeFilter !== "all") params.append("registrationType", leadRegistrationTypeFilter);
      if (leadSellerFilter !== "all") params.append("sellerId", leadSellerFilter);
      if (debouncedLeadSearchTerm.trim()) params.append("search", debouncedLeadSearchTerm.trim());
      if (leadSortField) params.append("sortField", leadSortField);
      if (leadSortOrder) params.append("sortOrder", leadSortOrder);
      params.append("limit", leadItemsPerPage.toString());
      params.append("offset", ((leadCurrentPage - 1) * leadItemsPerPage).toString());
      
      const response = await fetch(`/api/external-leads?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch leads');
      return response.json();
    },
    enabled: activeTab === "leads",
    staleTime: 0, // Always refetch when invalidated
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  const leads = leadsResponse?.data || [];
  const totalLeads = leadsResponse?.total || 0;
  
  const filteredLeads = leads.filter((lead: any) => {
    if (leadHasPetsFilter !== "all") {
      // Check activeCard first, then fallback to lead field
      const petsValue = lead.activeCard?.hasPets || lead.hasPets;
      const hasPets = petsValue && petsValue !== "No" && petsValue !== "no" && petsValue !== "";
      if (leadHasPetsFilter === "yes" && !hasPets) return false;
      if (leadHasPetsFilter === "no" && hasPets) return false;
    }
    if (leadFollowUpFilter !== "all" && lead.followUpDate) {
      const followUpDate = new Date(lead.followUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      followUpDate.setHours(0, 0, 0, 0);
      if (leadFollowUpFilter === "overdue" && followUpDate >= today) return false;
      if (leadFollowUpFilter === "today" && followUpDate.getTime() !== today.getTime()) return false;
    } else if (leadFollowUpFilter !== "all" && !lead.followUpDate) {
      return false;
    }
    return true;
  });
  
  const paginatedLeads = filteredLeads;
  const totalLeadPages = Math.max(1, Math.ceil(totalLeads / leadItemsPerPage));

  // Fetch agencies for master/admin users to select when creating leads
  const { data: agenciesData } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/external-agencies"],
    queryFn: async () => {
      const response = await fetch(`/api/external-agencies`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch agencies');
      return response.json();
    },
    enabled: isMasterOrAdmin,
    staleTime: 10 * 60 * 1000,
  });
  const agencies = agenciesData || [];

  // Fetch sellers for agency (for lead assignment dropdown)
  const { data: sellersData } = useQuery<{ id: string; firstName: string; lastName: string; email: string }[]>({
    queryKey: ["/api/external-sellers"],
    staleTime: 5 * 60 * 1000,
  });
  const sellers = sellersData || [];

  // Fetch condominiums for property interest selection in leads (get all, no limit)
  const { data: condominiumsData } = useQuery<{ data: { id: string; name: string; neighborhood?: string }[] }>({
    queryKey: ["/api/external-condominiums", "all"],
    queryFn: async () => {
      const response = await fetch(`/api/external-condominiums?limit=1000`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch condominiums');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });
  const condominiums = condominiumsData?.data || [];

  // State for added properties (list of {condominiumId, condominiumName, unitId?, unitNumber?})
  interface PropertySelection {
    condominiumId: string;
    condominiumName: string;
    unitId?: string;
    unitNumber?: string;
  }
  const [createPropertySelections, setCreatePropertySelections] = useState<PropertySelection[]>([]);
  const [editPropertySelections, setEditPropertySelections] = useState<PropertySelection[]>([]);
  
  // State for pending property selection (what's being picked before adding)
  const [createPendingCondoId, setCreatePendingCondoId] = useState<string>("");
  const [createPendingUnitId, setCreatePendingUnitId] = useState<string>("");
  const [createCondoSearchQuery, setCreateCondoSearchQuery] = useState("");
  const [createCondoPopoverOpen, setCreateCondoPopoverOpen] = useState(false);
  
  const [editPendingCondoId, setEditPendingCondoId] = useState<string>("");
  const [editPendingUnitId, setEditPendingUnitId] = useState<string>("");
  const [editCondoSearchQuery, setEditCondoSearchQuery] = useState("");
  const [editCondoPopoverOpen, setEditCondoPopoverOpen] = useState(false);
  
  // Legacy state for backward compatibility (derived from property selections)
  const selectedCreateCondominiums = createPropertySelections.map(p => p.condominiumId);
  const selectedCreateUnits = createPropertySelections.filter(p => p.unitId).map(p => p.unitId!);
  const selectedEditCondominiums = editPropertySelections.map(p => p.condominiumId);
  const selectedEditUnits = editPropertySelections.filter(p => p.unitId).map(p => p.unitId!);

  // State for pet quantity
  const [createPetQuantity, setCreatePetQuantity] = useState<number>(1);
  const [editPetQuantity, setEditPetQuantity] = useState<number>(1);

  // Fetch units for the PENDING condominium selection (create form)
  const { data: createPendingUnitsData } = useQuery<{ id: string; unitNumber: string; type?: string }[]>({
    queryKey: ["/api/external-condominiums", createPendingCondoId, "units"],
    queryFn: async () => {
      if (!createPendingCondoId) return [];
      const response = await fetch(`/api/external-condominiums/${createPendingCondoId}/units`, { credentials: 'include' });
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    enabled: !!createPendingCondoId,
    staleTime: 5 * 60 * 1000,
  });
  const createPendingUnits = createPendingUnitsData || [];

  // Fetch units for the PENDING condominium selection (edit form)
  const { data: editPendingUnitsData } = useQuery<{ id: string; unitNumber: string; type?: string }[]>({
    queryKey: ["/api/external-condominiums", editPendingCondoId, "units"],
    queryFn: async () => {
      if (!editPendingCondoId) return [];
      const response = await fetch(`/api/external-condominiums/${editPendingCondoId}/units`, { credentials: 'include' });
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    enabled: !!editPendingCondoId,
    staleTime: 5 * 60 * 1000,
  });
  const editPendingUnits = editPendingUnitsData || [];
  
  // Filter condominiums by search query
  const filteredCreateCondominiums = condominiums.filter(c => 
    !createCondoSearchQuery.trim() || 
    c.name.toLowerCase().includes(createCondoSearchQuery.toLowerCase())
  );
  const filteredEditCondominiums = condominiums.filter(c => 
    !editCondoSearchQuery.trim() || 
    c.name.toLowerCase().includes(editCondoSearchQuery.toLowerCase())
  );
  
  // Helper function to add property to create form
  const addCreateProperty = () => {
    if (!createPendingCondoId) return;
    const condo = condominiums.find(c => c.id === createPendingCondoId);
    if (!condo) return;
    
    const unit = createPendingUnitId ? createPendingUnits.find(u => u.id === createPendingUnitId) : null;
    
    // Check if already exists
    const exists = createPropertySelections.some(p => 
      p.condominiumId === createPendingCondoId && 
      p.unitId === (createPendingUnitId || undefined)
    );
    if (exists) return;
    
    setCreatePropertySelections(prev => [...prev, {
      condominiumId: createPendingCondoId,
      condominiumName: condo.name,
      unitId: createPendingUnitId || undefined,
      unitNumber: unit?.unitNumber
    }]);
    
    // Reset pending selection
    setCreatePendingCondoId("");
    setCreatePendingUnitId("");
    setCreateCondoSearchQuery("");
  };
  
  // Helper function to add property to edit form
  const addEditProperty = () => {
    if (!editPendingCondoId) return;
    const condo = condominiums.find(c => c.id === editPendingCondoId);
    if (!condo) return;
    
    const unit = editPendingUnitId ? editPendingUnits.find(u => u.id === editPendingUnitId) : null;
    
    // Check if already exists
    const exists = editPropertySelections.some(p => 
      p.condominiumId === editPendingCondoId && 
      p.unitId === (editPendingUnitId || undefined)
    );
    if (exists) return;
    
    setEditPropertySelections(prev => [...prev, {
      condominiumId: editPendingCondoId,
      condominiumName: condo.name,
      unitId: editPendingUnitId || undefined,
      unitNumber: unit?.unitNumber
    }]);
    
    // Reset pending selection
    setEditPendingCondoId("");
    setEditPendingUnitId("");
    setEditCondoSearchQuery("");
  };
  
  // Helper function to remove property from create form
  const removeCreateProperty = (index: number) => {
    setCreatePropertySelections(prev => prev.filter((_, i) => i !== index));
  };
  
  // Helper function to remove property from edit form
  const removeEditProperty = (index: number) => {
    setEditPropertySelections(prev => prev.filter((_, i) => i !== index));
  };
  
  // Helper function to hydrate edit property selections from lead data
  const hydrateEditPropertySelections = async (lead: any) => {
    const condoIds: string[] = lead.interestedCondominiumIds || [];
    const unitIds: string[] = lead.interestedUnitIds || [];
    
    const selections: PropertySelection[] = [];
    
    // Track which condos have units already added
    const condosWithUnits = new Set<string>();
    
    // If there are unit IDs, fetch their details using the dedicated endpoint
    if (unitIds.length > 0) {
      try {
        const response = await fetch('/api/external-units/by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ unitIds })
        });
        
        if (response.ok) {
          const units = await response.json();
          for (const unit of units) {
            selections.push({
              condominiumId: unit.condominiumId,
              condominiumName: unit.condominiumName,
              unitId: unit.id,
              unitNumber: unit.unitNumber
            });
            condosWithUnits.add(unit.condominiumId);
          }
        }
      } catch (e) {
        console.error('Error fetching units by IDs for hydration:', e);
      }
    }
    
    // Add condo-only entries for condos that don't have specific units
    for (const condoId of condoIds) {
      if (!condosWithUnits.has(condoId)) {
        const condo = condominiums.find(c => c.id === condoId);
        if (condo) {
          selections.push({
            condominiumId: condoId,
            condominiumName: condo.name,
            unitId: undefined,
            unitNumber: undefined
          });
        }
      }
    }
    
    setEditPropertySelections(selections);
  };

  // Fetch configurable zones
  const { data: zonesConfig = [] } = useQuery<Array<{id: string; name: string; isActive: boolean; sortOrder: number}>>({
    queryKey: ['/api/external/config/zones'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  const activeZones = zonesConfig.filter(z => z.isActive);

  // Fetch configurable property types  
  const { data: propertyTypesConfig = [] } = useQuery<Array<{id: string; name: string; isActive: boolean; sortOrder: number}>>({
    queryKey: ['/api/external/config/property-types'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  const activePropertyTypes = propertyTypesConfig.filter(pt => pt.isActive);

  // Fetch configurable unit characteristics
  const { data: characteristicsConfig = [] } = useQuery<Array<{id: string; name: string; nameEn?: string; category?: string; isActive: boolean; sortOrder: number}>>({
    queryKey: ['/api/external/config/unit-characteristics'],
    staleTime: 5 * 60 * 1000,
  });
  const activeCharacteristics = characteristicsConfig.filter(c => c.isActive);

  // Fetch configurable amenities
  const { data: amenitiesConfig = [] } = useQuery<Array<{id: string; name: string; nameEn?: string; category?: string; isActive: boolean; sortOrder: number}>>({
    queryKey: ['/api/external/config/amenities'],
    staleTime: 5 * 60 * 1000,
  });
  const activeAmenities = amenitiesConfig.filter(a => a.isActive);

  // State for selected characteristics and amenities in forms
  const [selectedCreateCharacteristics, setSelectedCreateCharacteristics] = useState<string[]>([]);
  const [selectedCreateAmenities, setSelectedCreateAmenities] = useState<string[]>([]);
  const [selectedEditCharacteristics, setSelectedEditCharacteristics] = useState<string[]>([]);
  const [selectedEditAmenities, setSelectedEditAmenities] = useState<string[]>([]);

  // State for multi-select property types and zones in forms
  const [selectedCreatePropertyTypes, setSelectedCreatePropertyTypes] = useState<string[]>([]);
  const [selectedCreateZones, setSelectedCreateZones] = useState<string[]>([]);
  const [selectedEditPropertyTypes, setSelectedEditPropertyTypes] = useState<string[]>([]);
  const [selectedEditZones, setSelectedEditZones] = useState<string[]>([]);

  useEffect(() => {
    if (totalLeadPages > 0 && leadCurrentPage > totalLeadPages) {
      setLeadCurrentPage(totalLeadPages);
    }
  }, [totalLeadPages]);

  // Backend handles all filtering, sorting, and pagination
  // No client-side processing needed
  const paginatedClients = clients;

  // Total pages based on server total (accounts for all filters)
  const totalPages = Math.max(1, Math.ceil(totalClients / itemsPerPage));

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(insertExternalClientSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phoneCountryCode: "+52",
      phone: "",
      alternatePhone: "",
      dateOfBirth: undefined,
      nationality: "",
      idType: "",
      idNumber: "",
      idCountry: "",
      idExpirationDate: undefined,
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      preferredLanguage: "es",
      propertyTypePreference: "",
      budgetMin: undefined,
      budgetMax: undefined,
      bedroomsPreference: undefined,
      bathroomsPreference: undefined,
      status: "active",
      isVerified: false,
      source: "",
      notes: "",
      tags: [],
      firstContactDate: undefined,
      lastContactDate: undefined,
    },
  });

  const editForm = useForm<EditClientFormData>({
    resolver: zodResolver(editClientSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const res = await apiRequest("POST", "/api/external-clients", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients"] });
      toast({
        title: language === "es" ? "Cliente creado" : "Client created",
        description: language === "es" 
          ? "El cliente se ha creado exitosamente."
          : "Client has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      if (error instanceof ApiError && error.status === 409 && error.data?.duplicate) {
        toast({
          variant: "destructive",
          title: language === "es" ? "Cliente Duplicado" : "Duplicate Client",
          description: error.data.detail || (language === "es"
            ? `Ya existe un cliente con el mismo nombre y últimos 4 dígitos de teléfono.`
            : `A client with the same name and phone last 4 digits already exists.`),
        });
      } else {
        toast({
          variant: "destructive",
          title: language === "es" ? "Error" : "Error",
          description: error instanceof ApiError ? error.data?.detail || error.message : error.message || (language === "es" 
            ? "No se pudo crear el cliente."
            : "Failed to create client."),
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditClientFormData }) => {
      const res = await apiRequest("PATCH", `/api/external-clients/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients"] });
      toast({
        title: language === "es" ? "Cliente actualizado" : "Client updated",
        description: language === "es" 
          ? "El cliente se ha actualizado exitosamente."
          : "Client has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedClient(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo actualizar el cliente."
          : "Failed to update client."),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/external-clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients"] });
      toast({
        title: language === "es" ? "Cliente eliminado" : "Client deleted",
        description: language === "es" 
          ? "El cliente se ha eliminado exitosamente."
          : "Client has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedClient(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo eliminar el cliente."
          : "Failed to delete client."),
      });
    },
  });

  const leadForm = useForm<LeadFormData>({
    resolver: zodResolver(insertExternalLeadSchema),
    defaultValues: {
      registrationType: "seller",
      firstName: "",
      lastName: "",
      phoneLast4: "",
      email: "",
      phone: "",
      status: "nuevo_lead",
      source: "",
      notes: "",
      contractDuration: "",
      checkInDate: undefined,
      hasPets: "",
      budgetMin: undefined,
      budgetMax: undefined,
      bedrooms: undefined,
      bedroomsText: "",
      desiredUnitType: "",
      desiredNeighborhood: "",
      sellerId: undefined,
      interestedCondominiumId: undefined,
      interestedUnitId: undefined,
    },
  });

  const editLeadForm = useForm<EditLeadFormData>({
    resolver: zodResolver(updateExternalLeadSchema),
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      // Helper: parse budget text to extract numeric value (in pesos)
      const parseBudgetText = (text?: string | null): number | undefined => {
        if (!text) return undefined;
        const cleanText = text.toLowerCase().replace(/,/g, '').replace(/\$/g, '').trim();
        // Match first number in string (e.g., "18-25 mil" -> 18)
        const match = cleanText.match(/(\d+(?:\.\d+)?)/);
        if (!match) return undefined;
        let num = parseFloat(match[1]);
        // Multiply by 1000 if "mil" or "k" is present, or if number is small (< 100 likely means thousands)
        if (cleanText.includes('mil') || cleanText.includes('k') || num < 100) {
          num = num * 1000;
        }
        return Math.round(num);
      };
      
      // Helper: parse bedrooms text to extract numeric value
      const parseBedroomsText = (text?: string | null): number | undefined => {
        if (!text) return undefined;
        // Match first number in string (e.g., "1-2" -> 1, "2+" -> 2)
        const match = text.match(/(\d+)/);
        return match ? parseInt(match[1]) : undefined;
      };
      
      // Convert Date to ISO string for API
      // Parse numeric values from text fields for filtering/analytics
      const processedData = {
        ...data,
        checkInDate: data.checkInDate ? new Date(data.checkInDate).toISOString() : undefined,
        // Budget values are now direct numeric inputs
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        bedrooms: data.bedrooms || parseBedroomsText(data.bedroomsText),
      };
      // Include selected characteristics, amenities, property types, and zones
      // Always use badge state directly (empty array = no selection)
      const dataWithSelections = {
        ...processedData,
        desiredCharacteristics: selectedCreateCharacteristics,
        desiredAmenities: selectedCreateAmenities,
        desiredUnitType: selectedCreatePropertyTypes.join(", ") || null,
        desiredNeighborhood: selectedCreateZones.join(", ") || null,
        interestedCondominiumIds: selectedCreateCondominiums.length > 0 ? selectedCreateCondominiums : null,
        interestedUnitIds: selectedCreateUnits.length > 0 ? selectedCreateUnits : null,
        petQuantity: createPetQuantity > 0 ? createPetQuantity : null,
        // Convert budget values to strings for API (decimal fields)
        budgetMin: processedData.budgetMin ? String(processedData.budgetMin) : undefined,
        budgetMax: processedData.budgetMax ? String(processedData.budgetMax) : undefined,
      };
      
      // For master/admin users, include the selected agencyId
      const payload = isMasterOrAdmin && selectedAgencyIdForLead 
        ? { ...dataWithSelections, agencyId: selectedAgencyIdForLead }
        : dataWithSelections;
      const res = await apiRequest("POST", "/api/external-leads", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads"] });
      toast({
        title: language === "es" ? "Lead creado" : "Lead created",
        description: language === "es" 
          ? "El lead se ha creado exitosamente."
          : "Lead has been created successfully.",
      });
      setIsCreateLeadDialogOpen(false);
      setCreateLeadStep(1); // Reset to first step
      setSelectedAgencyIdForLead(""); // Reset agency selection
      setSelectedCreateCharacteristics([]); // Reset selections
      setSelectedCreateAmenities([]);
      setSelectedCreatePropertyTypes([]);
      setSelectedCreateZones([]);
      setCreatePropertySelections([]);
      setCreatePetQuantity(1);
      leadForm.reset();
    },
    onError: (error: any) => {
      if (error instanceof ApiError && error.status === 409 && error.data?.duplicate) {
        const { sellerName, timeRemainingText } = error.data.duplicate || {};
        toast({
          variant: "destructive",
          title: language === "es" ? "Lead Ya Registrado" : "Lead Already Registered",
          description: error.data.detail || (sellerName 
            ? (language === "es"
                ? `Este lead ya está registrado por ${sellerName}. Podrá ser registrado nuevamente en ${timeRemainingText || 'algún tiempo'}.`
                : `This lead is already registered by ${sellerName}. Can be registered again in ${timeRemainingText || 'some time'}.`)
            : (language === "es"
                ? `Ya existe un lead con el mismo nombre y últimos 4 dígitos de teléfono.`
                : `A lead with the same name and phone last 4 digits already exists.`)),
          duration: 8000,
        });
      } else {
        toast({
          variant: "destructive",
          title: language === "es" ? "Error" : "Error",
          description: error instanceof ApiError ? error.data?.detail || error.message : error.message || (language === "es" 
            ? "No se pudo crear el lead."
            : "Failed to create lead."),
        });
      }
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditLeadFormData }) => {
      // Include selected characteristics, amenities, property types, and zones
      // Always use badge state directly (empty array = no selection)
      const dataWithSelections = {
        ...data,
        desiredCharacteristics: selectedEditCharacteristics,
        desiredAmenities: selectedEditAmenities,
        desiredUnitType: selectedEditPropertyTypes.join(", ") || null,
        desiredNeighborhood: selectedEditZones.join(", ") || null,
        interestedCondominiumIds: selectedEditCondominiums.length > 0 ? selectedEditCondominiums : null,
        interestedUnitIds: selectedEditUnits.length > 0 ? selectedEditUnits : null,
        petQuantity: editPetQuantity > 0 ? editPetQuantity : null,
        // Convert budget values to strings for API (decimal fields)
        budgetMin: data.budgetMin ? String(data.budgetMin) : undefined,
        budgetMax: data.budgetMax ? String(data.budgetMax) : undefined,
      };
      const res = await apiRequest("PATCH", `/api/external-leads/${id}`, dataWithSelections);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads"] });
      toast({
        title: language === "es" ? "Lead actualizado" : "Lead updated",
        description: language === "es" 
          ? "El lead se ha actualizado exitosamente."
          : "Lead has been updated successfully.",
      });
      setIsEditLeadDialogOpen(false);
      setSelectedLead(null);
      setSelectedEditCharacteristics([]); // Reset selections
      setSelectedEditAmenities([]);
      setSelectedEditPropertyTypes([]);
      setSelectedEditZones([]);
      setEditPropertySelections([]);
      setEditPetQuantity(1);
      editLeadForm.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo actualizar el lead."
          : "Failed to update lead."),
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/external-leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads"] });
      toast({
        title: language === "es" ? "Lead eliminado" : "Lead deleted",
        description: language === "es" 
          ? "El lead se ha eliminado exitosamente."
          : "Lead has been deleted successfully.",
      });
      setIsDeleteLeadDialogOpen(false);
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo eliminar el lead."
          : "Failed to delete lead."),
      });
    },
  });

  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/external-leads/${leadId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo actualizar el estado del lead."
          : "Failed to update lead status."),
      });
    },
  });

  // Reassign lead to different seller mutation
  const reassignLeadMutation = useMutation({
    mutationFn: async ({ leadId, newSellerId, newSellerName }: { leadId: string; newSellerId: string; newSellerName: string }) => {
      const res = await apiRequest("POST", `/api/external-leads/${leadId}/reassign`, { newSellerId, newSellerName });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads"] });
      setIsReassignDialogOpen(false);
      setNewAssignedSellerId("");
      toast({
        title: language === "es" ? "Lead reasignado" : "Lead reassigned",
        description: language === "es" 
          ? "El lead ha sido reasignado exitosamente."
          : "The lead has been successfully reassigned.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo reasignar el lead."
          : "Failed to reassign lead."),
      });
    },
  });

  // Convert lead to client mutation
  const convertLeadToClientMutation = useMutation({
    mutationFn: async (lead: ExternalLead) => {
      const clientData = {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        phoneCountryCode: lead.phoneCountryCode || undefined,
        nationality: lead.nationality || undefined,
        city: lead.city || undefined,
        address: lead.address || undefined,
        notes: lead.notes || undefined,
        status: "active",
        source: "lead_conversion",
        sourceLeadId: lead.id,
      };
      const res = await apiRequest("POST", "/api/external-clients", clientData);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.code === "DUPLICATE_ENTRY" || res.status === 409) {
          throw new Error(language === "es" 
            ? "Ya existe un cliente con el mismo email o telefono. Verifica los datos del lead."
            : "A client with the same email or phone already exists. Check the lead data.");
        }
        throw new Error(errorData.message || (language === "es" 
          ? "Error al crear cliente"
          : "Error creating client"));
      }
      const newClient = await res.json();
      
      // Update lead status to converted
      await apiRequest("PATCH", `/api/external-leads/${lead.id}`, { 
        status: "renta_concretada",
        convertedToClientId: newClient.id,
        notes: `${lead.notes || ""}\n\n[${new Date().toISOString()}] Convertido a cliente ID: ${newClient.id}`.trim()
      });
      
      return newClient;
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients"] });
      toast({
        title: language === "es" ? "Lead convertido" : "Lead converted",
        description: language === "es" 
          ? "El lead ha sido convertido a cliente exitosamente."
          : "Lead has been converted to client successfully.",
      });
      setIsLeadDetailOpen(false);
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo convertir el lead a cliente."
          : "Failed to convert lead to client."),
      });
    },
  });

  // Convert client back to lead mutation
  const convertClientToLeadMutation = useMutation({
    mutationFn: async ({ clientId, reason }: { clientId: string; reason: string }) => {
      const response = await apiRequest("POST", `/api/external-clients/${clientId}/convert-to-lead`, { reason });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || (language === "es" 
          ? "Error al reconvertir cliente a lead"
          : "Error converting client to lead"));
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads"] });
      toast({
        title: language === "es" ? "Cliente reconvertido" : "Client converted",
        description: language === "es" 
          ? "El cliente ha sido reconvertido a lead exitosamente."
          : "Client has been converted back to lead successfully.",
      });
      setIsClientDetailOpen(false);
      setSelectedClient(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo reconvertir el cliente a lead."
          : "Failed to convert client to lead."),
      });
    },
  });

  // Lead import mutation
  const importLeadsMutation = useMutation({
    mutationFn: async (leads: any[]) => {
      const response = await apiRequest("POST", "/api/external-leads/import", { leads });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads"] });
      setImportResults(data);
      setImportStep("complete");
      toast({
        title: language === "es" ? "Importación completada" : "Import completed",
        description: language === "es" 
          ? `${data.imported} leads importados, ${data.duplicates} duplicados omitidos`
          : `${data.imported} leads imported, ${data.duplicates} duplicates skipped`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error en importación" : "Import error",
        description: error.message || (language === "es" 
          ? "No se pudo completar la importación."
          : "Failed to complete import."),
      });
      setImportStep("preview");
    },
  });

  // Normalize header for matching (remove accents, lowercase, trim)
  const normalizeHeader = (header: string): string => {
    return header
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' '); // Normalize spaces
  };

  // Check if header matches any of the patterns
  const headerMatches = (header: string, patterns: string[]): boolean => {
    const normalized = normalizeHeader(header);
    return patterns.some(p => normalized.includes(normalizeHeader(p)));
  };

  // Handle Excel/CSV file upload
  const handleFileUpload = (file: File) => {
    setImportFile(file);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          toast({
            variant: "destructive",
            title: language === "es" ? "Archivo vacío" : "Empty file",
            description: language === "es" 
              ? "El archivo no contiene datos para importar."
              : "The file contains no data to import.",
          });
          return;
        }
        
        // Get headers from first row - keep original for display, normalize for matching
        const rawHeaders = (jsonData[0] as string[]).map(h => String(h || '').trim());
        
        // Map rows to lead objects
        const rows = jsonData.slice(1).filter((row: any) => 
          row.some((cell: any) => cell !== null && cell !== undefined && cell !== '')
        );
        
        const mappedLeads = rows.map((row: any, rowIndex: number) => {
          const lead: any = { _rowIndex: rowIndex + 2 }; // Track row for error reporting (1-indexed + header)
          
          // Map headers to fields using flexible matching
          rawHeaders.forEach((rawHeader, index) => {
            const value = row[index];
            if (value === null || value === undefined || value === '') return;
            
            // Date fields - support "Fecha registro", "Fecha de Registro", "Registration Date", etc.
            if (headerMatches(rawHeader, ['fecha registro', 'fecha de registro', 'registration date', 'date registered', 'fecha'])) {
              lead.originalCreatedAt = value;
            }
            // Full name - "Nombre completo", "Full Name", "Nombre Completo", etc.
            else if (headerMatches(rawHeader, ['nombre completo', 'full name', 'nombre y apellido'])) {
              lead.fullName = value;
            }
            // First name only
            else if (normalizeHeader(rawHeader) === 'nombre' || headerMatches(rawHeader, ['first name', 'primer nombre'])) {
              lead.firstName = value;
            }
            // Last name
            else if (headerMatches(rawHeader, ['apellido', 'last name', 'apellidos'])) {
              lead.lastName = value;
            }
            // Phone - "Teléfono", "Telefono", "Celular", "Phone", etc.
            else if (headerMatches(rawHeader, ['telefono', 'celular', 'phone', 'tel', 'movil', 'cel'])) {
              lead.phone = value;
            }
            // Contract duration - "Duración contrato", "Contract Duration", etc.
            else if (headerMatches(rawHeader, ['duracion', 'contrato', 'contract duration', 'meses'])) {
              lead.contractDuration = value;
            }
            // Check-in date - "Fecha entrada", "Move-in", "Check in", etc.
            else if (headerMatches(rawHeader, ['entrada', 'check in', 'move in', 'mudanza', 'ingreso'])) {
              lead.checkInDateText = value;
            }
            // Pets - "Mascotas", "Pets", etc.
            else if (headerMatches(rawHeader, ['mascota', 'pet', 'animales'])) {
              lead.hasPets = value;
            }
            // Budget - "Presupuesto", "Budget", "Renta", etc.
            else if (headerMatches(rawHeader, ['presupuesto', 'budget', 'renta mensual', 'costo', 'precio'])) {
              lead.estimatedRentCostText = value;
            }
            // Bedrooms - "Recámaras", "Recamaras", "Bedrooms", "Habitaciones", etc.
            else if (headerMatches(rawHeader, ['recamara', 'habitacion', 'bedroom', 'cuarto', 'dormitorio'])) {
              lead.bedroomsText = value;
            }
            // Desired property - "Propiedad deseada", "Propiedad específica", "Desired Property", etc.
            else if (headerMatches(rawHeader, ['propiedad', 'departamento especifico', 'unidad', 'desired property', 'specific'])) {
              lead.desiredProperty = value;
            }
            // Neighborhood - "Zona", "Colonia", "Área", "Neighborhood", etc.
            else if (headerMatches(rawHeader, ['zona', 'colonia', 'area', 'neighborhood', 'barrio', 'ubicacion'])) {
              lead.preferredNeighborhood = value;
            }
            // Primary seller - "Vendedor principal", "Asesor", "Seller", etc.
            else if (headerMatches(rawHeader, ['vendedor principal', 'asesor principal', 'seller', 'vendedor'])) {
              lead.sellerName = value;
            }
            // Assistant seller - "Vendedor secundario", "Asistente", etc.
            else if (headerMatches(rawHeader, ['vendedor secundario', 'asistente', 'segundo vendedor', 'assistant'])) {
              lead.assistantSellerName = value;
            }
            // Notes - "Notas", "Comentarios", "Observaciones", etc.
            else if (headerMatches(rawHeader, ['nota', 'comentario', 'observacion', 'notes', 'comment'])) {
              lead.notes = value;
            }
            // Status - "Estado", "Status", etc.
            else if (headerMatches(rawHeader, ['estado', 'status', 'estatus'])) {
              lead.status = value;
            }
            // Email
            else if (headerMatches(rawHeader, ['email', 'correo', 'e-mail'])) {
              lead.email = value;
            }
          });
          
          return lead;
        });

        // Validate required fields and prepare final data
        const validLeads: any[] = [];
        const invalidLeads: { row: number; reason: string }[] = [];

        mappedLeads.forEach((lead) => {
          const hasName = lead.fullName || lead.firstName || lead.phone;
          const hasPhone = lead.phone;
          
          if (!hasName) {
            invalidLeads.push({ 
              row: lead._rowIndex, 
              reason: language === "es" 
                ? "Sin nombre ni teléfono" 
                : "Missing name and phone" 
            });
            return;
          }

          if (!hasPhone) {
            invalidLeads.push({ 
              row: lead._rowIndex, 
              reason: language === "es" 
                ? "Sin número de teléfono" 
                : "Missing phone number" 
            });
            return;
          }

          // Remove internal tracking field before sending
          const { _rowIndex, ...cleanLead } = lead;
          validLeads.push(cleanLead);
        });

        if (validLeads.length === 0) {
          toast({
            variant: "destructive",
            title: language === "es" ? "No hay leads válidos" : "No valid leads",
            description: language === "es" 
              ? `El archivo contiene ${invalidLeads.length} filas sin los datos mínimos requeridos (nombre y teléfono).`
              : `The file contains ${invalidLeads.length} rows without minimum required data (name and phone).`,
          });
          return;
        }

        // Show warning if some leads are invalid
        if (invalidLeads.length > 0) {
          toast({
            title: language === "es" ? "Algunos registros omitidos" : "Some records skipped",
            description: language === "es" 
              ? `${invalidLeads.length} filas sin datos mínimos serán omitidas.`
              : `${invalidLeads.length} rows without minimum data will be skipped.`,
          });
        }
        
        setImportData(validLeads);
        setImportPreview(validLeads.slice(0, 10)); // Show first 10 for preview
        setImportStep("preview");
      } catch (error) {
        console.error('Error parsing file:', error);
        toast({
          variant: "destructive",
          title: language === "es" ? "Error al leer archivo" : "Error reading file",
          description: language === "es" 
            ? "No se pudo leer el archivo. Verifica que sea un Excel o CSV válido."
            : "Could not read the file. Make sure it's a valid Excel or CSV file.",
        });
      }
    };
    
    reader.readAsBinaryString(file);
  };

  const handleImportConfirm = () => {
    setImportStep("importing");
    importLeadsMutation.mutate(importData);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleEdit = (client: ExternalClient) => {
    navigate(`/external/clients/${client.id}`);
  };

  const handleDelete = (client: ExternalClient) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const handleClientClick = (client: ExternalClient) => {
    setSelectedClient(client);
    setIsClientDetailOpen(true);
  };

  const handleLeadClick = (lead: ExternalLead) => {
    navigate(`/external/leads/${lead.id}`);
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: string }) => (
    <TableHead 
      className="cursor-pointer hover-elevate text-sm font-normal"
      onClick={() => handleSort(field)}
      data-testid={`sort-${field}`}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: language === "es" ? "Activo" : "Active", variant: "default" as const },
      inactive: { label: language === "es" ? "Inactivo" : "Inactive", variant: "secondary" as const },
      archived: { label: language === "es" ? "Archivado" : "Archived", variant: "outline" as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.active;
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const getLeadStatusLabel = (status: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      nuevo_lead: { es: "Nuevo Lead", en: "New Lead" },
      cita_coordinada: { es: "Cita Coordinada", en: "Appointment Scheduled" },
      interesado: { es: "Interesado", en: "Interested" },
      oferta_enviada: { es: "Oferta Enviada", en: "Offer Sent" },
      oferta_completada: { es: "Oferta Completada", en: "Offer Completed" },
      formato_enviado: { es: "Formato Enviado", en: "Form Sent" },
      formato_completado: { es: "Formato Completado", en: "Form Completed" },
      proceso_renta: { es: "Proceso de Renta", en: "Rental Process" },
      renta_concretada: { es: "Renta Concretada", en: "Rental Completed" },
      perdido: { es: "Perdido", en: "Lost" },
      muerto: { es: "Muerto", en: "Dead" },
    };
    return labels[status]?.[language === "es" ? "es" : "en"] || status;
  };

  const getLeadStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    if (status === "renta_concretada") return "default";
    if (status === "perdido" || status === "muerto") return "destructive";
    return "secondary";
  };

  const getLeadStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      nuevo_lead: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
      cita_coordinada: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800",
      interesado: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
      oferta_enviada: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800",
      oferta_completada: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800",
      formato_enviado: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-800",
      formato_completado: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
      proceso_renta: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800",
      renta_concretada: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800",
      perdido: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
      muerto: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    };
    return colors[status] || colors.nuevo_lead;
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
      {/* Header - Compact */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate" data-testid="text-page-title">
            {isSeller 
              ? (language === "es" ? "Mis Leads" : "My Leads")
              : (language === "es" ? "Clientes" : "Clients")}
          </h1>
          {!isMobile && (
            <p className="text-sm text-muted-foreground">
              {isSeller
                ? (language === "es" 
                    ? "Gestiona tus prospectos y da seguimiento a tus oportunidades"
                    : "Manage your prospects and track your opportunities")
                : (language === "es" 
                    ? "Gestiona el registro de clientes e inquilinos"
                    : "Manage client and tenant registration")}
            </p>
          )}
        </div>
        {isSeller && !isMobile && (
          <Button 
            onClick={() => setIsCreateLeadDialogOpen(true)}
            data-testid="button-create-lead-header"
          >
            <Plus className="mr-2 h-4 w-4" />
            {language === "es" ? "Nuevo Lead" : "New Lead"}
          </Button>
        )}
      </div>

      {/* Broker Link Section for Sellers - Responsive */}
      {isSeller && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-lg bg-muted/50 border border-dashed border-primary/20">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Handshake className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {language === "es" ? "Link de Broker" : "Broker Link"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                {language === "es" 
                  ? "Comparte para que brokers registren leads"
                  : "Share so brokers can register leads"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/leads/broker`);
              toast({
                title: language === "es" ? "Link copiado" : "Link copied",
                description: language === "es" ? "El link ha sido copiado al portapapeles" : "The link has been copied to clipboard",
              });
            }}
            data-testid="button-copy-broker-link-seller"
          >
            <Copy className="h-4 w-4 mr-2" />
            {language === "es" ? "Copiar Link" : "Copy Link"}
          </Button>
        </div>
      )}

      {/* Public Registration Links Section - Hide for sellers */}
      {!isSeller && (
      <Collapsible open={isPublicLinksExpanded} onOpenChange={setIsPublicLinksExpanded}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  {language === "es" ? "Links de Registro Público" : "Public Registration Links"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {language === "es" 
                    ? "Comparte estos links permanentes para recibir registros de vendedores y brokers"
                    : "Share these permanent links to receive registrations from sellers and brokers"}
                </p>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-toggle-public-links">
                  {isPublicLinksExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Vendedor Link */}
                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">
                        {language === "es" ? "Registro de Vendedor" : "Seller Registration"}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-muted rounded-md font-mono text-xs break-all">
                      {`${window.location.origin}/leads/vendedor`}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/leads/vendedor`);
                        toast({
                          title: language === "es" ? "Link copiado" : "Link copied",
                          description: language === "es" ? "El link ha sido copiado al portapapeles" : "The link has been copied to clipboard",
                        });
                      }}
                      data-testid="button-copy-vendedor-link"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {language === "es" ? "Copiar Link" : "Copy Link"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Broker Link */}
                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Handshake className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">
                        {language === "es" ? "Registro de Broker" : "Broker Registration"}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-muted rounded-md font-mono text-xs break-all">
                      {`${window.location.origin}/leads/broker`}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/leads/broker`);
                        toast({
                          title: language === "es" ? "Link copiado" : "Link copied",
                          description: language === "es" ? "El link ha sido copiado al portapapeles" : "The link has been copied to clipboard",
                        });
                      }}
                      data-testid="button-copy-broker-link"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {language === "es" ? "Copiar Link" : "Copy Link"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>)}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "clients" | "leads")}>
        <div className="flex items-center justify-between gap-4">
          {!isSeller && (
            <TabsList className="grid grid-cols-2" style={{ width: "fit-content" }}>
              <TabsTrigger value="clients" data-testid="tab-clients">
                {language === "es" ? "Clientes" : "Clients"}
              </TabsTrigger>
              <TabsTrigger value="leads" data-testid="tab-leads">
                {language === "es" ? "Leads" : "Leads"}
              </TabsTrigger>
            </TabsList>
          )}

          {/* Create Button */}
          {activeTab === "clients" && !isSeller && (
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              data-testid="button-create-client"
            >
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Nuevo Cliente" : "New Client"}
            </Button>
          )}
          {activeTab === "leads" && !isSeller && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setIsImportDialogOpen(true);
                  setImportStep("upload");
                  setImportFile(null);
                  setImportData([]);
                  setImportPreview([]);
                  setImportResults(null);
                }}
                data-testid="button-import-leads"
              >
                <Upload className="mr-2 h-4 w-4" />
                {language === "es" ? "Importar" : "Import"}
              </Button>
              <Button 
                onClick={() => setIsCreateLeadDialogOpen(true)}
                data-testid="button-create-lead"
              >
                <Plus className="mr-2 h-4 w-4" />
                {language === "es" ? "Nuevo Lead" : "New Lead"}
              </Button>
            </div>
          )}
        </div>

        {/* Clients Tab Content */}
        <TabsContent value="clients" className="space-y-6 mt-6">

          {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input - Always visible */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={language === "es" ? "Buscar por nombre, email o teléfono..." : "Search by name, email or phone..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            {/* Filter Button with Popover - Icon only */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="flex-shrink-0 relative"
                  data-testid="button-filters"
                >
                  <Filter className="h-4 w-4" />
                  {(statusFilter !== "all" || verifiedFilter !== "all") && (
                    <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {(statusFilter !== "all" ? 1 : 0) + (verifiedFilter !== "all" ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">
                      {language === 'es' ? 'Filtrar por' : 'Filter by'}
                    </h4>

                    {/* Estado Filter */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        {language === "es" ? "Estado" : "Status"}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={statusFilter === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter("all")}
                          data-testid="button-filter-status-all"
                        >
                          {language === "es" ? "Todos" : "All"}
                        </Button>
                        <Button
                          variant={statusFilter === "active" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter("active")}
                          data-testid="button-filter-status-active"
                        >
                          {language === "es" ? "Activos" : "Active"}
                        </Button>
                        <Button
                          variant={statusFilter === "inactive" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter("inactive")}
                          data-testid="button-filter-status-inactive"
                        >
                          {language === "es" ? "Inactivos" : "Inactive"}
                        </Button>
                        <Button
                          variant={statusFilter === "archived" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter("archived")}
                          data-testid="button-filter-status-archived"
                        >
                          {language === "es" ? "Archivados" : "Archived"}
                        </Button>
                      </div>
                    </div>

                    {/* Verificación Filter */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        {language === "es" ? "Verificación" : "Verification"}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={verifiedFilter === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setVerifiedFilter("all")}
                          data-testid="button-filter-verified-all"
                        >
                          {language === "es" ? "Todos" : "All"}
                        </Button>
                        <Button
                          variant={verifiedFilter === "verified" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setVerifiedFilter("verified")}
                          data-testid="button-filter-verified-verified"
                        >
                          {language === "es" ? "Verificados" : "Verified"}
                        </Button>
                        <Button
                          variant={verifiedFilter === "unverified" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setVerifiedFilter("unverified")}
                          data-testid="button-filter-verified-unverified"
                        >
                          {language === "es" ? "No Verificados" : "Unverified"}
                        </Button>
                      </div>
                    </div>
                  </div>

                {(statusFilter !== "all" || verifiedFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("all");
                      setVerifiedFilter("all");
                    }}
                    className="w-full"
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {language === "es" ? "Limpiar Filtros" : "Clear Filters"}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* View Mode Toggle - Desktop only */}
          {!isMobile && (
            <>
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="icon"
                className="flex-shrink-0"
                onClick={() => setViewMode("cards")}
                data-testid="button-view-cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon"
                className="flex-shrink-0"
                onClick={() => setViewMode("table")}
                data-testid="button-view-table"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </>
          )}
          </div>
        </CardContent>
      </Card>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === "es" ? "Cargando clientes..." : "Loading clients..."}
          </div>
        ) : paginatedClients.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {language === "es" ? "No se encontraron clientes" : "No clients found"}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Pagination Controls - Above Content */}
            <ExternalPaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
              language={language}
            />

            {viewMode === "cards" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {paginatedClients.map((client) => (
                  <Card key={client.id} className="hover-elevate" data-testid={`card-client-${client.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm">
                      {client.firstName} {client.lastName}
                    </CardTitle>
                  <div className="flex items-center gap-1">
                    {client.isVerified && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" data-testid={`icon-verified-${client.id}`} />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-menu-${client.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(client)} data-testid={`button-edit-${client.id}`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          {language === "es" ? "Editar" : "Edit"}
                        </DropdownMenuItem>
                        {client.status === "active" && !client.convertedBackToLeadId && (
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedClient(client);
                              setIsConvertToLeadDialogOpen(true);
                            }}
                            data-testid={`button-convert-to-lead-${client.id}`}
                          >
                            <ArrowLeftCircle className="h-4 w-4 mr-2" />
                            {language === "es" ? "Reconvertir a Lead" : "Convert to Lead"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDelete(client)}
                          className="text-destructive"
                          data-testid={`button-delete-${client.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {language === "es" ? "Eliminar" : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate" data-testid={`text-email-${client.id}`}>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span data-testid={`text-phone-${client.id}`}>{client.phone}</span>
                    </div>
                  )}
                  {client.city && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span data-testid={`text-city-${client.id}`}>{client.city}</span>
                    </div>
                  )}
                  {client.source && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      <span className="capitalize" data-testid={`text-source-${client.id}`}>{client.source}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    {getStatusBadge(client.status)}
                    {client.preferredLanguage && (
                      <Badge variant="outline" className="text-xs uppercase">
                        {client.preferredLanguage}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader field="name">
                      {language === "es" ? "Nombre" : "Name"}
                    </SortableHeader>
                    <SortableHeader field="email">
                      {language === "es" ? "Email" : "Email"}
                    </SortableHeader>
                    <SortableHeader field="phone">
                      {language === "es" ? "Teléfono" : "Phone"}
                    </SortableHeader>
                    <TableHead className="text-sm font-normal">
                      {language === "es" ? "Nacionalidad" : "Nationality"}
                    </TableHead>
                    <TableHead className="text-sm font-normal">
                      {language === "es" ? "Ciudad" : "City"}
                    </TableHead>
                    <SortableHeader field="status">
                      {language === "es" ? "Estado" : "Status"}
                    </SortableHeader>
                    <TableHead className="text-sm font-normal">
                      {language === "es" ? "Verificado" : "Verified"}
                    </TableHead>
                    <TableHead className="text-sm font-normal text-right">
                      {language === "es" ? "Acciones" : "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRow 
                      key={client.id} 
                      data-testid={`row-client-${client.id}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedClient(client);
                        setIsClientDetailOpen(true);
                      }}
                    >
                      <TableCell className="text-sm">
                        {client.firstName} {client.lastName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.email || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.phone || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.nationality || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.city || "-"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(client.status)}
                      </TableCell>
                      <TableCell>
                        {client.isVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!client.isVerified && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateMutation.mutate({
                                  id: client.id,
                                  data: { isVerified: true }
                                });
                              }}
                              title={language === "es" ? "Verificar" : "Verify"}
                              data-testid={`button-verify-${client.id}`}
                            >
                              <UserCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {client.status === "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateMutation.mutate({
                                  id: client.id,
                                  data: { status: "inactive" }
                                });
                              }}
                              title={language === "es" ? "Suspender" : "Suspend"}
                              data-testid={`button-suspend-${client.id}`}
                            >
                              <Ban className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}
                          {client.status === "inactive" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateMutation.mutate({
                                  id: client.id,
                                  data: { status: "active" }
                                });
                              }}
                              title={language === "es" ? "Activar" : "Activate"}
                              data-testid={`button-activate-${client.id}`}
                            >
                              <CheckCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                data-testid={`button-menu-${client.id}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(client)} data-testid={`button-edit-${client.id}`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                {language === "es" ? "Editar" : "Edit"}
                              </DropdownMenuItem>
                              {client.status === "active" && !client.convertedBackToLeadId && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedClient(client);
                                    setIsConvertToLeadDialogOpen(true);
                                  }}
                                  data-testid={`button-convert-to-lead-${client.id}`}
                                >
                                  <ArrowLeftCircle className="h-4 w-4 mr-2" />
                                  {language === "es" ? "Reconvertir a Lead" : "Convert to Lead"}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDelete(client)}
                                className="text-destructive"
                                data-testid={`button-delete-${client.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {language === "es" ? "Eliminar" : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
          </div>
        )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {language === "es" ? "Registrar Nuevo Cliente" : "Register New Client"}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {language === "es" 
                    ? "Complete la información del cliente. Los campos con * son obligatorios." 
                    : "Fill in the client information. Fields with * are required."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6 py-4">
              
              {/* Section 1: Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">1</div>
                  {language === "es" ? "Datos Personales" : "Personal Information"}
                </div>
                
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Nombre *" : "First Name *"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={language === "es" ? "Juan" : "John"} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Segundo Nombre" : "Middle Name"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={language === "es" ? "Carlos" : "Michael"} data-testid="input-middle-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Apellido *" : "Last Name *"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={language === "es" ? "Perez" : "Smith"} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        {language === "es" ? "Nacionalidad" : "Nationality"}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-nationality">
                            <SelectValue placeholder={language === "es" ? "Seleccione nacionalidad" : "Select nationality"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="Mexicana">{language === "es" ? "Mexicana" : "Mexican"}</SelectItem>
                          <SelectItem value="Estadounidense">{language === "es" ? "Estadounidense" : "American"}</SelectItem>
                          <SelectItem value="Canadiense">{language === "es" ? "Canadiense" : "Canadian"}</SelectItem>
                          <SelectItem value="Britanica">{language === "es" ? "Britanica" : "British"}</SelectItem>
                          <SelectItem value="Francesa">{language === "es" ? "Francesa" : "French"}</SelectItem>
                          <SelectItem value="Alemana">{language === "es" ? "Alemana" : "German"}</SelectItem>
                          <SelectItem value="Espanola">{language === "es" ? "Espanola" : "Spanish"}</SelectItem>
                          <SelectItem value="Italiana">{language === "es" ? "Italiana" : "Italian"}</SelectItem>
                          <SelectItem value="Argentina">{language === "es" ? "Argentina" : "Argentine"}</SelectItem>
                          <SelectItem value="Colombiana">{language === "es" ? "Colombiana" : "Colombian"}</SelectItem>
                          <SelectItem value="Brasilena">{language === "es" ? "Brasilena" : "Brazilian"}</SelectItem>
                          <SelectItem value="Otra">{language === "es" ? "Otra" : "Other"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 2: Contact Information */}
              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground pt-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">2</div>
                  {language === "es" ? "Informacion de Contacto" : "Contact Information"}
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {language === "es" ? "Correo Electronico" : "Email"}
                      </FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="correo@ejemplo.com" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid gap-4 sm:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="phoneCountryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Codigo" : "Code"}
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "+52"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-phone-country-code">
                              <SelectValue placeholder="+52" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="+1">+1 (USA/CAN)</SelectItem>
                            <SelectItem value="+52">+52 (MX)</SelectItem>
                            <SelectItem value="+44">+44 (UK)</SelectItem>
                            <SelectItem value="+33">+33 (FR)</SelectItem>
                            <SelectItem value="+49">+49 (DE)</SelectItem>
                            <SelectItem value="+34">+34 (ES)</SelectItem>
                            <SelectItem value="+39">+39 (IT)</SelectItem>
                            <SelectItem value="+351">+351 (PT)</SelectItem>
                            <SelectItem value="+55">+55 (BR)</SelectItem>
                            <SelectItem value="+54">+54 (AR)</SelectItem>
                            <SelectItem value="+56">+56 (CL)</SelectItem>
                            <SelectItem value="+57">+57 (CO)</SelectItem>
                            <SelectItem value="+51">+51 (PE)</SelectItem>
                            <SelectItem value="+593">+593 (EC)</SelectItem>
                            <SelectItem value="+598">+598 (UY)</SelectItem>
                            <SelectItem value="+506">+506 (CR)</SelectItem>
                            <SelectItem value="+507">+507 (PA)</SelectItem>
                            <SelectItem value="+504">+504 (HN)</SelectItem>
                            <SelectItem value="+503">+503 (SV)</SelectItem>
                            <SelectItem value="+502">+502 (GT)</SelectItem>
                            <SelectItem value="+505">+505 (NI)</SelectItem>
                            <SelectItem value="+81">+81 (JP)</SelectItem>
                            <SelectItem value="+86">+86 (CN)</SelectItem>
                            <SelectItem value="+82">+82 (KR)</SelectItem>
                            <SelectItem value="+91">+91 (IN)</SelectItem>
                            <SelectItem value="+61">+61 (AU)</SelectItem>
                            <SelectItem value="+64">+64 (NZ)</SelectItem>
                            <SelectItem value="+27">+27 (ZA)</SelectItem>
                            <SelectItem value="+971">+971 (AE)</SelectItem>
                            <SelectItem value="+966">+966 (SA)</SelectItem>
                            <SelectItem value="+7">+7 (RU)</SelectItem>
                            <SelectItem value="+380">+380 (UA)</SelectItem>
                            <SelectItem value="+48">+48 (PL)</SelectItem>
                            <SelectItem value="+90">+90 (TR)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-3">
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Telefono" : "Phone"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="998 123 4567" data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Section 3: Location */}
              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground pt-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">3</div>
                  {language === "es" ? "Ubicacion" : "Location"}
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Ciudad" : "City"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={language === "es" ? "Ciudad de Mexico" : "Mexico City"} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Pais" : "Country"}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue placeholder={language === "es" ? "Seleccione pais" : "Select country"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="Mexico">Mexico</SelectItem>
                            <SelectItem value="Estados Unidos">{language === "es" ? "Estados Unidos" : "United States"}</SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                            <SelectItem value="Reino Unido">{language === "es" ? "Reino Unido" : "United Kingdom"}</SelectItem>
                            <SelectItem value="Francia">{language === "es" ? "Francia" : "France"}</SelectItem>
                            <SelectItem value="Alemania">{language === "es" ? "Alemania" : "Germany"}</SelectItem>
                            <SelectItem value="Espana">{language === "es" ? "Espana" : "Spain"}</SelectItem>
                            <SelectItem value="Italia">{language === "es" ? "Italia" : "Italy"}</SelectItem>
                            <SelectItem value="Argentina">Argentina</SelectItem>
                            <SelectItem value="Colombia">Colombia</SelectItem>
                            <SelectItem value="Brasil">Brasil</SelectItem>
                            <SelectItem value="Chile">Chile</SelectItem>
                            <SelectItem value="Peru">Peru</SelectItem>
                            <SelectItem value="Otro">{language === "es" ? "Otro" : "Other"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Section 4: Notes */}
              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground pt-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">4</div>
                  {language === "es" ? "Informacion Adicional" : "Additional Information"}
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        {language === "es" ? "Notas" : "Notes"}
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="min-h-[80px] resize-none"
                          placeholder={language === "es" ? "Informacion adicional sobre el cliente..." : "Additional client information..."} 
                          data-testid="input-notes" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit" className="gap-2">
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {language === "es" ? "Creando..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {language === "es" ? "Crear Cliente" : "Create Client"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Editar Cliente" : "Edit Client"}
            </DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => {
              if (selectedClient) {
                updateMutation.mutate({ id: selectedClient.id, data });
              }
            })} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nombre" : "First Name"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Apellido" : "Last Name"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Email" : "Email"}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={field.value || ""} data-testid="input-edit-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Teléfono" : "Phone"}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-edit-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Estado" : "Status"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">{language === "es" ? "Activo" : "Active"}</SelectItem>
                          <SelectItem value="inactive">{language === "es" ? "Inactivo" : "Inactive"}</SelectItem>
                          <SelectItem value="archived">{language === "es" ? "Archivado" : "Archived"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="isVerified"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Verificado" : "Verified"}</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-verified">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">{language === "es" ? "Sí" : "Yes"}</SelectItem>
                          <SelectItem value="false">{language === "es" ? "No" : "No"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Notas" : "Notes"}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="input-edit-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-edit-cancel"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-edit-submit">
                  {updateMutation.isPending 
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (language === "es" ? "Guardar Cambios" : "Save Changes")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Eliminar Cliente" : "Delete Client"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? `¿Está seguro de que desea eliminar a ${selectedClient?.firstName} ${selectedClient?.lastName}? Esta acción no se puede deshacer.`
                : `Are you sure you want to delete ${selectedClient?.firstName} ${selectedClient?.lastName}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              data-testid="button-delete-cancel"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedClient && deleteMutation.mutate(selectedClient.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-confirm"
            >
              {deleteMutation.isPending 
                ? (language === "es" ? "Eliminando..." : "Deleting...")
                : (language === "es" ? "Eliminar" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Detail Dialog */}
      <Dialog open={isClientDetailOpen} onOpenChange={setIsClientDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {selectedClient?.firstName} {selectedClient?.lastName}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {language === "es" ? "Información detallada del cliente" : "Detailed client information"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedClient && (
            <div className="space-y-6 py-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {language === "es" ? "Datos Personales" : "Personal Information"}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{language === "es" ? "Nombre:" : "Name:"}</span>
                    <p className="font-medium">{selectedClient.firstName} {selectedClient.lastName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{language === "es" ? "Estado:" : "Status:"}</span>
                    <div className="mt-1">{getStatusBadge(selectedClient.status)}</div>
                  </div>
                  {selectedClient.email && (
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {selectedClient.email}
                      </p>
                    </div>
                  )}
                  {selectedClient.phone && (
                    <div>
                      <span className="text-muted-foreground">{language === "es" ? "Teléfono:" : "Phone:"}</span>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {selectedClient.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Information */}
              {(selectedClient.nationality || selectedClient.city || selectedClient.address) && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {language === "es" ? "Ubicación" : "Location"}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedClient.nationality && (
                      <div>
                        <span className="text-muted-foreground">{language === "es" ? "Nacionalidad:" : "Nationality:"}</span>
                        <p className="font-medium">{selectedClient.nationality}</p>
                      </div>
                    )}
                    {selectedClient.city && (
                      <div>
                        <span className="text-muted-foreground">{language === "es" ? "Ciudad:" : "City:"}</span>
                        <p className="font-medium">{selectedClient.city}</p>
                      </div>
                    )}
                    {selectedClient.address && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">{language === "es" ? "Dirección:" : "Address:"}</span>
                        <p className="font-medium">{selectedClient.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Verification Status */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  {selectedClient.isVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  {language === "es" ? "Verificación" : "Verification"}
                </h3>
                <p className="text-sm">
                  {selectedClient.isVerified 
                    ? (language === "es" ? "Cliente verificado" : "Verified client")
                    : (language === "es" ? "Cliente no verificado" : "Unverified client")}
                </p>
              </div>

              {/* Notes */}
              {selectedClient.notes && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {language === "es" ? "Notas" : "Notes"}
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedClient.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* CRM Tabs */}
          {selectedClient && (
            <div className="border-t pt-4">
              <ClientCRMTabs 
                client={selectedClient} 
                onClientUpdate={() => queryClient.invalidateQueries({ queryKey: ["/api/external-clients"] })}
              />
            </div>
          )}

          <DialogFooter className="border-t pt-4 gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setIsClientDetailOpen(false)}
              data-testid="button-detail-close"
            >
              {language === "es" ? "Cerrar" : "Close"}
            </Button>
            {selectedClient && selectedClient.status === "active" && !selectedClient.convertedBackToLeadId && (
              <Button
                variant="outline"
                onClick={() => setIsConvertToLeadDialogOpen(true)}
                data-testid="button-convert-to-lead"
              >
                <ArrowLeftCircle className="h-4 w-4 mr-2" />
                {language === "es" ? "Reconvertir a Lead" : "Convert to Lead"}
              </Button>
            )}
            <Button
              onClick={() => {
                setIsClientDetailOpen(false);
                if (selectedClient) {
                  handleEdit(selectedClient);
                }
              }}
              data-testid="button-detail-edit"
            >
              <Pencil className="h-4 w-4 mr-2" />
              {language === "es" ? "Editar" : "Edit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Client to Lead Confirmation Dialog */}
      <Dialog open={isConvertToLeadDialogOpen} onOpenChange={setIsConvertToLeadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Reconvertir a Lead" : "Convert to Lead"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? `¿Está seguro de que desea reconvertir a ${selectedClient?.firstName} ${selectedClient?.lastName} en un nuevo lead? El cliente será archivado y se creará un nuevo lead con su información.`
                : `Are you sure you want to convert ${selectedClient?.firstName} ${selectedClient?.lastName} back to a lead? The client will be archived and a new lead will be created.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsConvertToLeadDialogOpen(false)}
              data-testid="button-convert-cancel"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={() => {
                if (selectedClient) {
                  convertClientToLeadMutation.mutate({ 
                    clientId: selectedClient.id, 
                    reason: "manual" 
                  });
                  setIsConvertToLeadDialogOpen(false);
                }
              }}
              disabled={convertClientToLeadMutation.isPending}
              data-testid="button-convert-confirm"
            >
              {convertClientToLeadMutation.isPending 
                ? (language === "es" ? "Convirtiendo..." : "Converting...")
                : (language === "es" ? "Reconvertir" : "Convert")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* Leads Tab Content */}
        <TabsContent value="leads" className="space-y-3 mt-3">
          {/* Search and Filters for Leads */}
          <Card className="shadow-none border">
            <CardContent className="py-2.5 px-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={language === "es" ? "Buscar..." : "Search..."}
                    value={leadSearchTerm}
                    onChange={(e) => setLeadSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                    data-testid="input-lead-search"
                  />
                </div>

                {/* View Mode Toggle - Desktop only */}
                {!isMobile && activeTab === "leads" && (
                  <>
                    <Button
                      variant={viewMode === "cards" ? "default" : "outline"}
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => setViewMode("cards")}
                      data-testid="button-view-cards"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => setViewMode("table")}
                      data-testid="button-view-table"
                    >
                      <TableIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "kanban" ? "default" : "outline"}
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => setViewMode("kanban")}
                      data-testid="button-view-kanban"
                    >
                      <Columns className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Filter Popover */}
                <Popover open={isLeadFilterOpen} onOpenChange={setIsLeadFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0 relative h-10 w-10"
                      data-testid="button-lead-filter-toggle"
                    >
                      <Filter className="h-4 w-4" />
                      {(leadStatusFilter !== "all" || leadRegistrationTypeFilter !== "all" || leadSellerFilter !== "all" || leadHasPetsFilter !== "all" || leadFollowUpFilter !== "all") && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-3 space-y-3" align="end">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">
                        {language === "es" ? "Filtrar por" : "Filter by"}
                      </h4>
                      {(leadStatusFilter !== "all" || leadRegistrationTypeFilter !== "all" || leadSellerFilter !== "all" || leadHasPetsFilter !== "all" || leadFollowUpFilter !== "all") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLeadStatusFilter("all");
                            setLeadRegistrationTypeFilter("all");
                            setLeadSellerFilter("all");
                            setLeadHasPetsFilter("all");
                            setLeadFollowUpFilter("all");
                          }}
                          className="h-6 px-2 text-xs"
                          data-testid="button-lead-clear-filters"
                        >
                          <X className="h-3 w-3 mr-1" />
                          {language === "es" ? "Limpiar" : "Clear"}
                        </Button>
                      )}
                    </div>
                    
                    {/* Status Filter */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {language === "es" ? "Estado" : "Status"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { value: "all", label: { es: "Todos", en: "All" } },
                          { value: "nuevo_lead", label: { es: "Nuevo", en: "New" } },
                          { value: "cita_coordinada", label: { es: "Cita", en: "Appt" } },
                          { value: "interesado", label: { es: "Interesado", en: "Interested" } },
                          { value: "oferta_enviada", label: { es: "Oferta", en: "Offer" } },
                          { value: "proceso_renta", label: { es: "Proceso", en: "Process" } },
                          { value: "renta_concretada", label: { es: "Cerrado", en: "Closed" } },
                          { value: "perdido", label: { es: "Perdido", en: "Lost" } },
                          { value: "muerto", label: { es: "Muerto", en: "Dead" } },
                        ].map((status) => (
                          <Badge
                            key={status.value}
                            variant={leadStatusFilter === status.value ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setLeadStatusFilter(status.value)}
                            data-testid={`button-filter-status-${status.value}`}
                          >
                            {language === "es" ? status.label.es : status.label.en}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Registration Type Filter */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {language === "es" ? "Tipo" : "Type"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { value: "all", label: { es: "Todos", en: "All" } },
                          { value: "broker", label: { es: "Broker", en: "Broker" } },
                          { value: "seller", label: { es: "Vendedor", en: "Seller" } },
                        ].map((type) => (
                          <Badge
                            key={type.value}
                            variant={leadRegistrationTypeFilter === type.value ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setLeadRegistrationTypeFilter(type.value)}
                            data-testid={`button-filter-type-${type.value}`}
                          >
                            {language === "es" ? type.label.es : type.label.en}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Has Pets Filter */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {language === "es" ? "Mascota" : "Pet"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { value: "all", label: { es: "Todos", en: "All" } },
                          { value: "yes", label: { es: "Con mascota", en: "With pet" } },
                          { value: "no", label: { es: "Sin mascota", en: "No pet" } },
                        ].map((option) => (
                          <Badge
                            key={option.value}
                            variant={leadHasPetsFilter === option.value ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setLeadHasPetsFilter(option.value)}
                            data-testid={`button-filter-pets-${option.value}`}
                          >
                            {language === "es" ? option.label.es : option.label.en}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Follow-up Filter */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {language === "es" ? "Seguimiento" : "Follow-up"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { value: "all", label: { es: "Todos", en: "All" } },
                          { value: "overdue", label: { es: "Vencido", en: "Overdue" } },
                          { value: "today", label: { es: "Hoy", en: "Today" } },
                        ].map((option) => (
                          <Badge
                            key={option.value}
                            variant={leadFollowUpFilter === option.value ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setLeadFollowUpFilter(option.value)}
                            data-testid={`button-filter-followup-${option.value}`}
                          >
                            {language === "es" ? option.label.es : option.label.en}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Seller Filter - Only visible for admins, not for sellers */}
                    {!isSeller && sellers.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {language === "es" ? "Vendedor" : "Seller"}
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                          <Badge
                            variant={leadSellerFilter === "all" ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setLeadSellerFilter("all")}
                            data-testid="button-filter-seller-all"
                          >
                            {language === "es" ? "Todos" : "All"}
                          </Badge>
                          {sellers.map((seller) => (
                            <Badge
                              key={seller.id}
                              variant={leadSellerFilter === seller.id ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => setLeadSellerFilter(seller.id)}
                              data-testid={`button-filter-seller-${seller.id}`}
                            >
                              {`${seller.firstName} ${seller.lastName}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Active Filters Display - Compact inline */}
              {(leadStatusFilter !== "all" || leadRegistrationTypeFilter !== "all" || leadSellerFilter !== "all" || leadHasPetsFilter !== "all" || leadFollowUpFilter !== "all") && (
                <div className="flex flex-wrap gap-1.5 items-center mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    {language === "es" ? "Filtros:" : "Filters:"}
                  </span>
                  {leadStatusFilter !== "all" && (
                    <Badge variant="secondary" className="gap-0.5 text-[10px] h-5 px-1.5">
                      {
                        [
                          { value: "nuevo_lead", label: { es: "Nuevo", en: "New" } },
                          { value: "cita_coordinada", label: { es: "Cita", en: "Appt" } },
                          { value: "interesado", label: { es: "Interesado", en: "Interested" } },
                          { value: "oferta_enviada", label: { es: "Oferta", en: "Offer" } },
                          { value: "proceso_renta", label: { es: "Proceso", en: "Process" } },
                          { value: "renta_concretada", label: { es: "Cerrado", en: "Closed" } },
                          { value: "perdido", label: { es: "Perdido", en: "Lost" } },
                          { value: "muerto", label: { es: "Muerto", en: "Dead" } },
                        ].find(s => s.value === leadStatusFilter)?.label[language === "es" ? "es" : "en"] || leadStatusFilter
                      }
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setLeadStatusFilter("all")}
                      />
                    </Badge>
                  )}
                  {leadRegistrationTypeFilter !== "all" && (
                    <Badge variant="secondary" className="gap-0.5 text-[10px] h-5 px-1.5">
                      {leadRegistrationTypeFilter === "broker" ? "Broker" : (language === "es" ? "Vendedor" : "Seller")}
                      <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setLeadRegistrationTypeFilter("all")} />
                    </Badge>
                  )}
                  {!isSeller && leadSellerFilter !== "all" && (
                    <Badge variant="secondary" className="gap-0.5 text-[10px] h-5 px-1.5">
                      {sellers.find(s => s.id === leadSellerFilter)?.firstName || ""}
                      <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setLeadSellerFilter("all")} />
                    </Badge>
                  )}
                  {leadHasPetsFilter !== "all" && (
                    <Badge variant="secondary" className="gap-0.5 text-[10px] h-5 px-1.5">
                      {leadHasPetsFilter === "yes" ? (language === "es" ? "Mascota" : "Pet") : (language === "es" ? "Sin mascota" : "No pet")}
                      <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setLeadHasPetsFilter("all")} />
                    </Badge>
                  )}
                  {leadFollowUpFilter !== "all" && (
                    <Badge variant="secondary" className="gap-0.5 text-[10px] h-5 px-1.5">
                      {leadFollowUpFilter === "overdue" ? (language === "es" ? "Vencido" : "Overdue") : (language === "es" ? "Hoy" : "Today")}
                      <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setLeadFollowUpFilter("all")} />
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination Controls - Above table for visual consistency */}
          {!leadsLoading && paginatedLeads.length > 0 && viewMode !== "kanban" && (
            <ExternalPaginationControls
              currentPage={leadCurrentPage}
              totalPages={totalLeadPages}
              totalItems={totalLeads}
              itemsPerPage={leadItemsPerPage}
              onPageChange={setLeadCurrentPage}
              onItemsPerPageChange={(value) => {
                setLeadItemsPerPage(value);
                setLeadCurrentPage(1);
              }}
              language={language}
              isMobile={isMobile}
            />
          )}

          {/* Leads Content */}
          {leadsLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-muted-foreground">{language === "es" ? "Cargando..." : "Loading..."}</div>
            </div>
          ) : paginatedLeads.length === 0 ? (
            <Card>
              <CardContent className="flex justify-center py-12">
                <p className="text-muted-foreground">
                  {language === "es" ? "No se encontraron leads" : "No leads found"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {viewMode === "kanban" ? (
                <LeadKanbanView
                  leads={leads}
                  onUpdateStatus={(leadId, newStatus) => {
                    updateLeadStatusMutation.mutate({ leadId, status: newStatus });
                  }}
                  onEdit={(lead) => {
                    setSelectedLead(lead);
                    editLeadForm.reset(lead);
                    setEditCondominiumId(lead.interestedCondominiumId || "");
                    setSelectedEditCharacteristics((lead as any).desiredCharacteristics || []);
                    setSelectedEditAmenities((lead as any).desiredAmenities || []);
                    // Initialize property types and zones from comma-separated string
                    setSelectedEditPropertyTypes(lead.desiredUnitType ? lead.desiredUnitType.split(", ").filter(Boolean) : []);
                    setSelectedEditZones(lead.desiredNeighborhood ? lead.desiredNeighborhood.split(", ").filter(Boolean) : []);
                    // Initialize multi-select condominiums and units
                    hydrateEditPropertySelections(lead);
                    // Initialize pet quantity
                    setEditPetQuantity((lead as any).petQuantity || 1);
                    setIsEditLeadDialogOpen(true);
                  }}
                  onDelete={(lead) => {
                    setSelectedLead(lead);
                    setIsDeleteLeadDialogOpen(true);
                  }}
                  onViewDetail={handleLeadClick}
                />
              ) : viewMode === "table" ? (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                          <TableHead>{language === "es" ? "Nombre" : "Name"}</TableHead>
                          <TableHead>{language === "es" ? "Contacto" : "Contact"}</TableHead>
                          <TableHead>{language === "es" ? "Presupuesto" : "Budget"}</TableHead>
                          <TableHead>{language === "es" ? "Tipo Unidad" : "Unit Type"}</TableHead>
                          <TableHead>{language === "es" ? "Mascota" : "Pet"}</TableHead>
                          <TableHead>{language === "es" ? "Oferta" : "Offer"}</TableHead>
                          <TableHead>{language === "es" ? "Formato" : "Form"}</TableHead>
                          {!isSeller && (
                            <TableHead>{language === "es" ? "Vendedor" : "Seller"}</TableHead>
                          )}
                          <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedLeads.map((lead) => (
                          <TableRow 
                            key={lead.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleLeadClick(lead)}
                          >
                            {/* Estado */}
                            <TableCell>
                              <Badge className={`text-xs border ${getLeadStatusColor(lead.status)}`}>
                                {getLeadStatusLabel(lead.status)}
                              </Badge>
                            </TableCell>
                            {/* Nombre */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{`${lead.firstName} ${lead.lastName}`}</span>
                                {(() => {
                                  const followUpDate = lead.followUpDate ? new Date(lead.followUpDate) : null;
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  if (followUpDate) {
                                    followUpDate.setHours(0, 0, 0, 0);
                                    if (followUpDate < today) {
                                      return (
                                        <span 
                                          className="flex items-center text-red-600" 
                                          title={language === "es" ? "Seguimiento vencido" : "Follow-up overdue"}
                                        >
                                          <AlertTriangle className="h-4 w-4" />
                                        </span>
                                      );
                                    } else if (followUpDate.getTime() === today.getTime()) {
                                      return (
                                        <span 
                                          className="flex items-center text-amber-600" 
                                          title={language === "es" ? "Seguimiento hoy" : "Follow-up today"}
                                        >
                                          <Clock className="h-4 w-4" />
                                        </span>
                                      );
                                    }
                                  }
                                  return null;
                                })()}
                              </div>
                            </TableCell>
                            {/* Contacto */}
                            <TableCell>
                              <div className="text-sm">
                                {lead.registrationType === "broker" ? (
                                  <span className="text-muted-foreground">****{lead.phoneLast4}</span>
                                ) : (
                                  <span>{lead.phone || "-"}</span>
                                )}
                              </div>
                            </TableCell>
                            {/* Presupuesto - prefer activeCard, fallback to lead fields */}
                            <TableCell className="text-sm">
                              {lead.activeCard?.budgetText 
                                ? lead.activeCard.budgetText
                                : (lead.activeCard?.budgetMin || lead.activeCard?.budgetMax)
                                  ? `$${lead.activeCard.budgetMin ? Number(lead.activeCard.budgetMin).toLocaleString() : '0'} - $${lead.activeCard.budgetMax ? Number(lead.activeCard.budgetMax).toLocaleString() : '∞'}`
                                  : (lead.budgetMin || lead.budgetMax) 
                                    ? `$${lead.budgetMin ? Number(lead.budgetMin).toLocaleString() : '0'} - $${lead.budgetMax ? Number(lead.budgetMax).toLocaleString() : '∞'}`
                                    : (lead.estimatedRentCostText || (lead.estimatedRentCost ? `$${lead.estimatedRentCost.toLocaleString()}` : "-"))}
                            </TableCell>
                            {/* Tipo Unidad - prefer activeCard, fallback to lead */}
                            <TableCell className="text-sm">
                              {lead.activeCard?.propertyType || lead.desiredUnitType || "-"}
                            </TableCell>
                            {/* Mascota - prefer activeCard, fallback to lead */}
                            <TableCell className="text-sm">
                              {(lead.activeCard?.hasPets || lead.hasPets) ? (
                                <div className="flex items-center gap-1">
                                  <PawPrint className="h-3.5 w-3.5 text-amber-600" />
                                  <span>{lead.activeCard?.hasPets || lead.hasPets}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No</span>
                              )}
                            </TableCell>
                            {/* Oferta */}
                            <TableCell className="text-sm">
                              {lead.offerSentAt ? (
                                lead.offerCompletedAt ? (
                                  <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 text-xs">
                                    {language === "es" ? "Completada" : "Completed"}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 text-xs">
                                    {language === "es" ? "Enviada" : "Sent"}
                                  </Badge>
                                )
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            {/* Formato */}
                            <TableCell className="text-sm">
                              {lead.formSentAt ? (
                                lead.formCompletedAt ? (
                                  <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 text-xs">
                                    {language === "es" ? "Completada" : "Completed"}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 text-xs">
                                    {language === "es" ? "Enviada" : "Sent"}
                                  </Badge>
                                )
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            {/* Vendedor - only for admin */}
                            {!isSeller && (
                              <TableCell className="text-sm">
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="truncate max-w-[120px]">
                                    {lead.sellerName || (lead.sellerId && sellers.find(s => s.id === lead.sellerId) 
                                      ? `${sellers.find(s => s.id === lead.sellerId)?.firstName} ${sellers.find(s => s.id === lead.sellerId)?.lastName || ""}`.trim() 
                                      : "-")}
                                  </span>
                                </div>
                              </TableCell>
                            )}
                            {/* Acciones */}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                {lead.phone && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                                    onClick={() => {
                                      const phone = lead.phone?.replace(/\D/g, '');
                                      window.open(`https://wa.me/${phone}`, '_blank');
                                    }}
                                    data-testid={`button-whatsapp-lead-${lead.id}`}
                                  >
                                    <SiWhatsapp className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    editLeadForm.reset(lead);
                                    setEditCondominiumId(lead.interestedCondominiumId || "");
                                    setSelectedEditCharacteristics((lead as any).desiredCharacteristics || []);
                                    setSelectedEditAmenities((lead as any).desiredAmenities || []);
                                    setSelectedEditPropertyTypes(lead.desiredUnitType ? lead.desiredUnitType.split(", ").filter(Boolean) : []);
                                    setSelectedEditZones(lead.desiredNeighborhood ? lead.desiredNeighborhood.split(", ").filter(Boolean) : []);
                                    hydrateEditPropertySelections(lead);
                                    setEditPetQuantity((lead as any).petQuantity || 1);
                                    setIsEditLeadDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-lead-${lead.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setIsDeleteLeadDialogOpen(true);
                                  }}
                                  data-testid={`button-delete-lead-${lead.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-2 sm:gap-3 md:grid-cols-2">
                  {paginatedLeads.map((lead) => {
                    const followUpDate = lead.followUpDate ? new Date(lead.followUpDate) : null;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    let followUpIndicator = null;
                    if (followUpDate) {
                      followUpDate.setHours(0, 0, 0, 0);
                      if (followUpDate < today) {
                        followUpIndicator = <AlertTriangle className="h-3.5 w-3.5 text-red-600" />;
                      } else if (followUpDate.getTime() === today.getTime()) {
                        followUpIndicator = <Clock className="h-3.5 w-3.5 text-amber-600" />;
                      }
                    }
                    
                    return (
                      <Card 
                        key={lead.id} 
                        className="hover-elevate cursor-pointer border shadow-none"
                        onClick={() => handleLeadClick(lead)}
                      >
                        <CardContent className="p-3">
                          {/* Header Row: Name + Status + Actions */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-semibold text-sm truncate">{`${lead.firstName} ${lead.lastName}`}</span>
                                {followUpIndicator}
                              </div>
                              <div className="flex gap-1.5 flex-wrap">
                                <Badge variant={lead.registrationType === "broker" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                                  {lead.registrationType === "broker" ? "Broker" : (language === "es" ? "Vendedor" : "Seller")}
                                </Badge>
                                <Badge 
                                  className={`text-[10px] px-1.5 py-0 border ${getLeadStatusColor(lead.status)}`}
                                >
                                  {getLeadStatusLabel(lead.status)}
                                </Badge>
                              </div>
                            </div>
                            {/* Desktop Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hidden sm:flex" data-testid={`button-menu-lead-${lead.id}`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                {lead.phone && lead.registrationType !== "broker" && (
                                  <DropdownMenuItem
                                    className="text-green-600"
                                    onClick={() => {
                                      const phone = lead.phone?.replace(/\D/g, '');
                                      window.open(`https://wa.me/${phone}`, '_blank');
                                    }}
                                  >
                                    <SiWhatsapp className="h-4 w-4 mr-2" />
                                    WhatsApp
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    editLeadForm.reset(lead);
                                    setEditCondominiumId(lead.interestedCondominiumId || "");
                                    setSelectedEditCharacteristics((lead as any).desiredCharacteristics || []);
                                    setSelectedEditAmenities((lead as any).desiredAmenities || []);
                                    setSelectedEditPropertyTypes(lead.desiredUnitType ? lead.desiredUnitType.split(", ").filter(Boolean) : []);
                                    setSelectedEditZones(lead.desiredNeighborhood ? lead.desiredNeighborhood.split(", ").filter(Boolean) : []);
                                    hydrateEditPropertySelections(lead);
                                    setEditPetQuantity((lead as any).petQuantity || 1);
                                    setIsEditLeadDialogOpen(true);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  {language === "es" ? "Editar" : "Edit"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setIsDeleteLeadDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {language === "es" ? "Eliminar" : "Delete"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {/* Info Grid - Compact 2 columns - prefer activeCard, fallback to lead */}
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mb-2">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {lead.activeCard?.budgetText 
                                  ? lead.activeCard.budgetText
                                  : (lead.activeCard?.budgetMin || lead.activeCard?.budgetMax)
                                    ? `$${lead.activeCard.budgetMin ? Number(lead.activeCard.budgetMin).toLocaleString() : '0'}-$${lead.activeCard.budgetMax ? Number(lead.activeCard.budgetMax).toLocaleString() : '∞'}`
                                    : (lead.budgetMin || lead.budgetMax)
                                      ? `$${lead.budgetMin ? Number(lead.budgetMin).toLocaleString() : '0'}-$${lead.budgetMax ? Number(lead.budgetMax).toLocaleString() : '∞'}`
                                      : "-"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Home className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{lead.activeCard?.propertyType || lead.desiredUnitType || "-"}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <PawPrint className={`h-3 w-3 flex-shrink-0 ${(lead.activeCard?.hasPets || lead.hasPets) ? "text-amber-600" : ""}`} />
                              <span>{lead.activeCard?.hasPets || lead.hasPets || "No"}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <CalendarDays className="h-3 w-3 flex-shrink-0" />
                              <span>{lead.createdAt ? format(new Date(lead.createdAt), "dd/MM/yy", { locale: language === "es" ? es : enUS }) : "-"}</span>
                            </div>
                          </div>
                          
                          {/* Contact + Actions Row */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {lead.registrationType === "broker" ? `****${lead.phoneLast4}` : (lead.phone || "-")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {lead.phone && lead.registrationType !== "broker" && (
                                <Button
                                  size="sm"
                                  className="h-8 px-2 sm:px-3 bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => {
                                    const phone = lead.phone?.replace(/\D/g, '');
                                    window.open(`https://wa.me/${phone}`, '_blank');
                                  }}
                                  data-testid={`button-whatsapp-lead-footer-${lead.id}`}
                                >
                                  <SiWhatsapp className="h-4 w-4" />
                                  <span className="hidden sm:inline ml-1.5">WhatsApp</span>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  editLeadForm.reset(lead);
                                  setEditCondominiumId(lead.interestedCondominiumId || "");
                                  setSelectedEditCharacteristics((lead as any).desiredCharacteristics || []);
                                  setSelectedEditAmenities((lead as any).desiredAmenities || []);
                                  setSelectedEditPropertyTypes(lead.desiredUnitType ? lead.desiredUnitType.split(", ").filter(Boolean) : []);
                                  setSelectedEditZones(lead.desiredNeighborhood ? lead.desiredNeighborhood.split(", ").filter(Boolean) : []);
                                  hydrateEditPropertySelections(lead);
                                  setEditPetQuantity((lead as any).petQuantity || 1);
                                  setIsEditLeadDialogOpen(true);
                                }}
                                data-testid={`button-edit-lead-footer-${lead.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setIsDeleteLeadDialogOpen(true);
                                }}
                                data-testid={`button-delete-lead-footer-${lead.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Mobile FAB for New Lead - Fixed position, always visible when scrolling */}
      {isMobile && activeTab === "leads" && (
        <div className="fixed bottom-6 right-6 z-[9999]">
          <Button
            className="h-14 w-14 rounded-full shadow-xl"
            size="icon"
            onClick={() => setIsCreateLeadDialogOpen(true)}
            data-testid="fab-create-lead"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Create Lead Dialog - Full screen on mobile - 2-Step Wizard */}
      <Dialog open={isCreateLeadDialogOpen} onOpenChange={(open) => {
        setIsCreateLeadDialogOpen(open);
        if (!open) setCreateLeadStep(1);
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto max-sm:!left-0 max-sm:!top-0 max-sm:!translate-x-0 max-sm:!translate-y-0 max-sm:!w-full max-sm:!h-full max-sm:!max-w-none max-sm:!rounded-none">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    {language === "es" ? "Registrar Nuevo Lead" : "Register New Lead"}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {createLeadStep === 1 
                      ? (language === "es" 
                          ? "Paso 1: Información de contacto básica" 
                          : "Step 1: Basic contact information")
                      : (language === "es" 
                          ? "Paso 2: Preferencias de búsqueda" 
                          : "Step 2: Search preferences")}
                  </DialogDescription>
                </div>
              </div>
              {/* Step indicators */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  createLeadStep === 1 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-primary/20 text-primary"
                }`}>
                  1
                </div>
                <div className="w-8 h-0.5 bg-muted" />
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  createLeadStep === 2 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  2
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <Form {...leadForm}>
            <form onSubmit={leadForm.handleSubmit((data) => createLeadMutation.mutate(data))} className="space-y-6 py-4">
              
              {/* ===== STEP 1: Contact Information ===== */}
              {createLeadStep === 1 && (
                <>
                  {/* Agency selector for master/admin users */}
                  {isMasterOrAdmin && (
                    <div className="p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{language === "es" ? "Asignación de Agencia" : "Agency Assignment"}</span>
                      </div>
                      <Select 
                        value={selectedAgencyIdForLead} 
                        onValueChange={setSelectedAgencyIdForLead}
                      >
                        <SelectTrigger data-testid="select-create-lead-agency" className="bg-background">
                          <SelectValue placeholder={language === "es" ? "Seleccione la agencia" : "Select agency"} />
                        </SelectTrigger>
                        <SelectContent>
                          {agencies.map((agency) => (
                            <SelectItem key={agency.id} value={agency.id} data-testid={`select-item-agency-${agency.id}`}>
                              {agency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!selectedAgencyIdForLead && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {language === "es" 
                            ? "Como administrador, debes seleccionar una agencia para el lead."
                            : "As an administrator, you must select an agency for the lead."}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Contact Type & Basic Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <User className="h-4 w-4 text-primary" />
                      {language === "es" ? "Información de Contacto" : "Contact Information"}
                    </div>
                
{!isSeller && (
                <FormField
                  control={leadForm.control}
                  name="registrationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        {language === "es" ? "Tipo de Registro *" : "Registration Type *"}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-create-lead-type">
                            <SelectValue placeholder={language === "es" ? "Seleccione el tipo" : "Select type"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="seller">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {language === "es" ? "Vendedor (contacto completo)" : "Seller (full contact)"}
                            </div>
                          </SelectItem>
                          <SelectItem value="broker">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              {language === "es" ? "Broker (solo últimos 4 dígitos)" : "Broker (last 4 digits only)"}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={leadForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Nombre *" : "First Name *"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={language === "es" ? "Ingrese el nombre" : "Enter first name"} data-testid="input-create-lead-firstname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={leadForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Apellido *" : "Last Name *"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={language === "es" ? "Ingrese el apellido" : "Enter last name"} data-testid="input-create-lead-lastname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {leadForm.watch("registrationType") === "broker" ? (
                  <FormField
                    control={leadForm.control}
                    name="phoneLast4"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Últimos 4 dígitos del teléfono *" : "Last 4 Phone Digits *"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} maxLength={4} placeholder="1234" className="max-w-[150px]" data-testid="input-create-lead-phonelast4" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={leadForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {language === "es" ? "Teléfono *" : "Phone *"}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="+52 998 123 4567" data-testid="input-create-lead-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={leadForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {language === "es" ? "Email" : "Email"}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} type="email" placeholder="correo@ejemplo.com" data-testid="input-create-lead-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                  </div>
                </>
              )}

              {/* ===== STEP 2: Property Preferences ===== */}
              {createLeadStep === 2 && (
                <>
              {/* Property Search Preferences */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Home className="h-4 w-4 text-primary" />
                  {language === "es" ? "Preferencias de Búsqueda" : "Search Preferences"}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      {language === "es" ? "Presupuesto (MXN)" : "Budget (MXN)"}
                    </FormLabel>
                    <div className="flex items-center gap-2">
                      <FormField
                        control={leadForm.control}
                        name="budgetMin"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                value={field.value || ""} 
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder={language === "es" ? "Mín" : "Min"}
                                data-testid="input-create-lead-budget-min" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <span className="text-muted-foreground">-</span>
                      <FormField
                        control={leadForm.control}
                        name="budgetMax"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                value={field.value || ""} 
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder={language === "es" ? "Máx" : "Max"}
                                data-testid="input-create-lead-budget-max" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <FormField
                    control={leadForm.control}
                    name="bedroomsText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Recámaras" : "Bedrooms"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            placeholder={language === "es" ? "Ej: 1-2, 2+" : "E.g: 1-2, 2+"}
                            data-testid="input-create-lead-bedrooms" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Home className="h-3.5 w-3.5 text-muted-foreground" />
                      {language === "es" ? "Tipo de Propiedad" : "Property Type"}
                    </FormLabel>
                    <SearchableMultiSelect
                      value={selectedCreatePropertyTypes}
                      onValueChange={setSelectedCreatePropertyTypes}
                      options={(activePropertyTypes.length > 0 ? activePropertyTypes : [
                        { id: "dept", name: language === "es" ? "Departamento" : "Apartment" },
                        { id: "casa", name: language === "es" ? "Casa" : "House" },
                        { id: "estudio", name: language === "es" ? "Estudio" : "Studio" },
                        { id: "ph", name: "PH / Penthouse" },
                        { id: "villa", name: "Villa" },
                      ]).map((pt) => ({ value: pt.name, label: pt.name }))}
                      placeholder={language === "es" ? "Seleccionar tipos..." : "Select types..."}
                      searchPlaceholder={language === "es" ? "Buscar tipo..." : "Search type..."}
                      emptyMessage={language === "es" ? "No se encontraron tipos." : "No types found."}
                      showSelectedBelow={false}
                      data-testid="multiselect-create-lead-unittype"
                    />
                  </FormItem>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {language === "es" ? "Zona / Colonia" : "Area"}
                    </FormLabel>
                    <SearchableMultiSelect
                      value={selectedCreateZones}
                      onValueChange={setSelectedCreateZones}
                      options={(activeZones.length > 0 ? activeZones : [
                        { id: "aldea", name: "Aldea Zama" },
                        { id: "veleta", name: "La Veleta" },
                        { id: "centro", name: "Centro" },
                        { id: "otro", name: language === "es" ? "Otro" : "Other" },
                      ]).map((zone) => ({ value: zone.name, label: zone.name }))}
                      placeholder={language === "es" ? "Seleccionar zonas..." : "Select areas..."}
                      searchPlaceholder={language === "es" ? "Buscar zona..." : "Search area..."}
                      emptyMessage={language === "es" ? "No se encontraron zonas." : "No areas found."}
                      showSelectedBelow={false}
                      data-testid="multiselect-create-lead-neighborhood"
                    />
                  </FormItem>
                  <FormField
                    control={leadForm.control}
                    name="contractDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Duración del Contrato" : "Contract Duration"}
                        </FormLabel>
                        <SearchableSelect
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          options={[
                            { value: "6 meses", label: `6 ${language === "es" ? "meses" : "months"}` },
                            { value: "1 año", label: `1 ${language === "es" ? "año" : "year"}` },
                            { value: "2 años", label: `2 ${language === "es" ? "años" : "years"}` },
                            { value: "3+ años", label: `3+ ${language === "es" ? "años" : "years"}` },
                          ]}
                          placeholder={language === "es" ? "Seleccionar" : "Select"}
                          searchPlaceholder={language === "es" ? "Buscar duración..." : "Search duration..."}
                          emptyMessage={language === "es" ? "No encontrado." : "Not found."}
                          data-testid="select-create-lead-duration"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={leadForm.control}
                    name="checkInDate"
                    render={({ field }) => {
                      const today = new Date();
                      const minYear = today.getFullYear();
                      const maxYear = today.getFullYear() + 3;
                      
                      const formatDateForInput = (date: Date | string | null | undefined): string => {
                        if (!date) return "";
                        const d = new Date(date);
                        if (isNaN(d.getTime())) return "";
                        const year = d.getFullYear();
                        if (year < minYear || year > maxYear) return "";
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      };
                      
                      const handleDateChange = (dateString: string) => {
                        if (!dateString) {
                          field.onChange(undefined);
                          return;
                        }
                        const [year, month, day] = dateString.split('-').map(Number);
                        if (year < minYear || year > maxYear) {
                          return;
                        }
                        const newDate = new Date(year, month - 1, day, 12, 0, 0);
                        if (!isNaN(newDate.getTime())) {
                          field.onChange(newDate);
                        }
                      };
                      
                      const minDate = `${minYear}-01-01`;
                      const maxDate = `${maxYear}-12-31`;
                      
                      return (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            {language === "es" ? "Fecha de Entrada Deseada" : "Desired Move-in Date"}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              min={minDate}
                              max={maxDate}
                              value={formatDateForInput(field.value)} 
                              onChange={(e) => handleDateChange(e.target.value)}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  const [year] = val.split('-').map(Number);
                                  if (year < minYear || year > maxYear) {
                                    field.onChange(undefined);
                                  }
                                }
                              }}
                              data-testid="input-create-lead-checkin"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={leadForm.control}
                    name="hasPets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <PawPrint className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "¿Tiene Mascotas?" : "Has Pets?"}
                        </FormLabel>
                        <SearchableSelect
                          value={field.value || ""}
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === "No") {
                              setCreatePetQuantity(0);
                            } else if (createPetQuantity === 0) {
                              setCreatePetQuantity(1);
                            }
                          }}
                          options={[
                            { value: "No", label: "No" },
                            { value: "Sí - Perro", label: language === "es" ? "Sí - Perro" : "Yes - Dog" },
                            { value: "Sí - Gato", label: language === "es" ? "Sí - Gato" : "Yes - Cat" },
                            { value: "Sí - Otro", label: language === "es" ? "Sí - Otro" : "Yes - Other" },
                          ]}
                          placeholder={language === "es" ? "Seleccionar" : "Select"}
                          searchPlaceholder={language === "es" ? "Buscar..." : "Search..."}
                          emptyMessage={language === "es" ? "No encontrado." : "Not found."}
                          data-testid="select-create-lead-pets"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {leadForm.watch("hasPets") && leadForm.watch("hasPets") !== "No" && (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <PawPrint className="h-3.5 w-3.5 text-muted-foreground" />
                        {language === "es" ? "Cantidad de Mascotas" : "Number of Pets"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          max={10}
                          value={createPetQuantity}
                          onChange={(e) => setCreatePetQuantity(parseInt(e.target.value) || 1)}
                          data-testid="input-create-lead-pet-quantity"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                </div>
                
                {/* Property Interest Selectors - Sequential Picker */}
                <div className="space-y-4">
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {language === "es" ? "Propiedades de Interés" : "Interested Properties"}
                  </FormLabel>
                  
                  {/* Property Picker Row */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Condominium Selector */}
                    <Popover open={createCondoPopoverOpen} onOpenChange={setCreateCondoPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={createCondoPopoverOpen}
                          className="flex-1 justify-between"
                          data-testid="button-create-lead-select-condo"
                        >
                          {createPendingCondoId
                            ? (condominiums.find(c => c.id === createPendingCondoId)?.name || (language === "es" ? "Seleccionar condominio" : "Select condominium"))
                            : (language === "es" ? "Seleccionar condominio" : "Select condominium")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder={language === "es" ? "Buscar condominio..." : "Search condominium..."}
                            value={createCondoSearchQuery}
                            onValueChange={setCreateCondoSearchQuery}
                            data-testid="input-create-lead-condo-search"
                          />
                          <CommandList>
                            <CommandEmpty>
                              {language === "es" ? "No se encontraron condominios" : "No condominiums found"}
                            </CommandEmpty>
                            <CommandGroup>
                              <ScrollArea className="h-[200px]">
                                {filteredCreateCondominiums.map((condo) => (
                                  <CommandItem
                                    key={condo.id}
                                    value={condo.id}
                                    onSelect={() => {
                                      setCreatePendingCondoId(condo.id);
                                      setCreatePendingUnitId("");
                                      setCreateCondoPopoverOpen(false);
                                    }}
                                    data-testid={`item-create-condo-${condo.id}`}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        createPendingCondoId === condo.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {condo.name} {condo.neighborhood ? `(${condo.neighborhood})` : ""}
                                  </CommandItem>
                                ))}
                              </ScrollArea>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    {/* Unit Selector - Only shown when condominium is selected */}
                    {createPendingCondoId && (
                      <Select
                        value={createPendingUnitId}
                        onValueChange={setCreatePendingUnitId}
                      >
                        <SelectTrigger className="flex-1" data-testid="select-create-lead-unit">
                          <SelectValue placeholder={language === "es" ? "Unidad (opcional)" : "Unit (optional)"} />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-[200px]">
                            {createPendingUnits.length === 0 ? (
                              <SelectItem value="loading" disabled>
                                {language === "es" ? "Cargando unidades..." : "Loading units..."}
                              </SelectItem>
                            ) : (
                              createPendingUnits.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.unitNumber} {unit.type ? `(${unit.type})` : ""}
                                </SelectItem>
                              ))
                            )}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    )}
                    
                    {/* Add Property Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addCreateProperty}
                      disabled={!createPendingCondoId}
                      data-testid="button-create-lead-add-property"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Added Properties List */}
                  {createPropertySelections.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {createPropertySelections.length} {language === "es" ? "propiedad(es) agregada(s)" : "property(ies) added"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {createPropertySelections.map((prop, index) => (
                          <Badge
                            key={`${prop.condominiumId}-${prop.unitId || 'condo'}-${index}`}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1"
                            data-testid={`badge-create-property-${index}`}
                          >
                            <span>
                              {prop.condominiumName}
                              {prop.unitNumber && ` - ${prop.unitNumber}`}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-destructive/20"
                              onClick={() => removeCreateProperty(index)}
                              data-testid={`button-remove-create-property-${index}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <FormDescription className="text-xs">
                    {language === "es" 
                      ? "Opcional: Seleccione condominio, opcionalmente una unidad, y presione + para agregar" 
                      : "Optional: Select condominium, optionally a unit, and press + to add"}
                  </FormDescription>
                </div>
              </div>

              {/* Property Characteristics & Amenities - Collapsible */}
              {(activeCharacteristics.length > 0 || activeAmenities.length > 0) && (
                <Collapsible className="space-y-2 pt-4 border-t">
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {language === "es" ? "Características y Amenidades" : "Characteristics & Amenities"}
                      {(selectedCreateCharacteristics.length > 0 || selectedCreateAmenities.length > 0) && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {selectedCreateCharacteristics.length + selectedCreateAmenities.length}
                        </Badge>
                      )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <p className="text-xs text-muted-foreground">
                      {language === "es" 
                        ? "Opcional: características y amenidades que busca el cliente"
                        : "Optional: characteristics and amenities the client is looking for"}
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Unit Characteristics - Searchable Multi-select */}
                      {activeCharacteristics.length > 0 && (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Home className="h-3.5 w-3.5 text-muted-foreground" />
                            {language === "es" ? "Características" : "Characteristics"}
                          </FormLabel>
                          <SearchableMultiSelect
                            value={selectedCreateCharacteristics}
                            onValueChange={setSelectedCreateCharacteristics}
                            options={activeCharacteristics.map((char) => ({
                              value: char.id,
                              label: language === "es" ? char.name : (char.nameEn || char.name)
                            }))}
                            placeholder={language === "es" ? "Seleccionar..." : "Select..."}
                            searchPlaceholder={language === "es" ? "Buscar característica..." : "Search characteristic..."}
                            emptyMessage={language === "es" ? "No encontrado." : "Not found."}
                            showSelectedBelow={false}
                            data-testid="multiselect-create-characteristics"
                          />
                        </FormItem>
                      )}

                      {/* Amenities - Searchable Multi-select */}
                      {activeAmenities.length > 0 && (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {language === "es" ? "Amenidades" : "Amenities"}
                          </FormLabel>
                          <SearchableMultiSelect
                            value={selectedCreateAmenities}
                            onValueChange={setSelectedCreateAmenities}
                            options={activeAmenities.map((amenity) => ({
                              value: amenity.id,
                              label: language === "es" ? amenity.name : (amenity.nameEn || amenity.name)
                            }))}
                            placeholder={language === "es" ? "Seleccionar..." : "Select..."}
                            searchPlaceholder={language === "es" ? "Buscar amenidad..." : "Search amenity..."}
                            emptyMessage={language === "es" ? "No encontrado." : "Not found."}
                            showSelectedBelow={false}
                            data-testid="multiselect-create-amenities"
                          />
                        </FormItem>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Section 4: Status & Additional Info */}
              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground pt-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">{activeCharacteristics.length > 0 || activeAmenities.length > 0 ? '4' : '3'}</div>
                  {language === "es" ? "Estado y Seguimiento" : "Status & Follow-up"}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={leadForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Estado del Lead" : "Lead Status"}
                        </FormLabel>
                        <SearchableSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          options={[
                            { value: "nuevo_lead", label: language === "es" ? "Nuevo Lead" : "New Lead" },
                            { value: "cita_coordinada", label: language === "es" ? "Cita Coordinada" : "Appointment Scheduled" },
                            { value: "interesado", label: language === "es" ? "Interesado" : "Interested" },
                            { value: "oferta_enviada", label: language === "es" ? "Oferta Enviada" : "Offer Sent" },
                            { value: "proceso_renta", label: language === "es" ? "Proceso de Renta" : "Rental Process" },
                            { value: "renta_concretada", label: language === "es" ? "Renta Concretada" : "Rental Completed" },
                            { value: "perdido", label: language === "es" ? "Perdido" : "Lost" },
                            { value: "muerto", label: language === "es" ? "Muerto" : "Dead" },
                          ]}
                          placeholder={language === "es" ? "Seleccionar estado" : "Select status"}
                          searchPlaceholder={language === "es" ? "Buscar estado..." : "Search status..."}
                          emptyMessage={language === "es" ? "No encontrado." : "Not found."}
                          data-testid="select-create-lead-status"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={leadForm.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Fuente / Origen" : "Source"}
                        </FormLabel>
                        <SearchableSelect
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          options={[
                            { value: "WhatsApp", label: "WhatsApp" },
                            { value: "Web", label: "Web" },
                            { value: "Referido", label: language === "es" ? "Referido" : "Referral" },
                            { value: "Redes Sociales", label: language === "es" ? "Redes Sociales" : "Social Media" },
                            { value: "Llamada", label: language === "es" ? "Llamada" : "Phone Call" },
                            { value: "Evento", label: language === "es" ? "Evento" : "Event" },
                            { value: "Otro", label: language === "es" ? "Otro" : "Other" },
                          ]}
                          placeholder={language === "es" ? "¿Cómo llegó?" : "How did they find us?"}
                          searchPlaceholder={language === "es" ? "Buscar fuente..." : "Search source..."}
                          emptyMessage={language === "es" ? "No encontrado." : "Not found."}
                          data-testid="select-create-lead-source"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
{!isSeller && (
                <FormField
                  control={leadForm.control}
                  name="sellerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        {language === "es" ? "Vendedor Asignado" : "Assigned Seller"}
                      </FormLabel>
                      <SearchableSelect
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        options={sellers.length === 0 
                          ? [{ value: "none", label: language === "es" ? "No hay vendedores disponibles" : "No sellers available" }]
                          : sellers.map((seller) => ({
                              value: seller.id,
                              label: `${seller.firstName} ${seller.lastName}`
                            }))
                        }
                        placeholder={language === "es" ? "Seleccionar vendedor" : "Select seller"}
                        searchPlaceholder={language === "es" ? "Buscar vendedor..." : "Search seller..."}
                        emptyMessage={language === "es" ? "No encontrado." : "Not found."}
                        data-testid="select-create-lead-seller"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                )}

                <FormField
                  control={leadForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        {language === "es" ? "Notas Adicionales" : "Additional Notes"}
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          value={field.value || ""} 
                          placeholder={language === "es" ? "Información adicional sobre el prospecto..." : "Additional information about the prospect..."}
                          className="min-h-[80px] resize-none"
                          data-testid="input-create-lead-notes" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
                </>
              )}

              {/* Footer with step navigation */}
              <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
                {createLeadStep === 1 ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        leadForm.clearErrors();
                        setIsCreateLeadDialogOpen(false);
                      }}
                      data-testid="button-create-lead-cancel"
                    >
                      {language === "es" ? "Cancelar" : "Cancel"}
                    </Button>
                    <Button 
                      type="button"
                      onClick={async () => {
                        setIsValidatingStep(true);
                        try {
                          const registrationType = leadForm.getValues("registrationType");
                          const fieldsToValidate: ("firstName" | "lastName" | "phone" | "phoneLast4" | "email" | "registrationType")[] = 
                            registrationType === "broker" 
                              ? ["firstName", "lastName", "phoneLast4", "registrationType"]
                              : ["firstName", "lastName", "phone", "registrationType"];
                          const isValid = await leadForm.trigger(fieldsToValidate);
                          if (isValid && (!isMasterOrAdmin || selectedAgencyIdForLead)) {
                            setCreateLeadStep(2);
                          }
                        } finally {
                          setIsValidatingStep(false);
                        }
                      }}
                      disabled={isValidatingStep || (isMasterOrAdmin && !selectedAgencyIdForLead)}
                      data-testid="button-create-lead-next"
                      className="gap-2"
                    >
                      {isValidatingStep ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {language === "es" ? "Validando..." : "Validating..."}
                        </>
                      ) : (
                        <>
                          {language === "es" ? "Siguiente" : "Next"}
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        leadForm.clearErrors();
                        setCreateLeadStep(1);
                      }}
                      data-testid="button-create-lead-back"
                      className="gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {language === "es" ? "Anterior" : "Back"}
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createLeadMutation.isPending || (isMasterOrAdmin && !selectedAgencyIdForLead)} 
                      data-testid="button-create-lead-submit"
                      className="gap-2"
                    >
                      {createLeadMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {language === "es" ? "Creando..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          {language === "es" ? "Crear Lead" : "Create Lead"}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog - Full screen on mobile */}
      <Dialog open={isEditLeadDialogOpen} onOpenChange={(open) => {
        setIsEditLeadDialogOpen(open);
        if (!open) {
          setSelectedEditCharacteristics([]);
          setSelectedEditAmenities([]);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto max-sm:!left-0 max-sm:!top-0 max-sm:!translate-x-0 max-sm:!translate-y-0 max-sm:!w-full max-sm:!h-full max-sm:!max-w-none max-sm:!rounded-none">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Pencil className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">
                    {language === "es" ? "Editar Lead" : "Edit Lead"}
                  </DialogTitle>
                  {selectedLead && (
                    <Badge variant={selectedLead.registrationType === "broker" ? "default" : "secondary"}>
                      {selectedLead.registrationType === "broker" ? "Broker" : (language === "es" ? "Vendedor" : "Seller")}
                    </Badge>
                  )}
                </div>
                <DialogDescription className="mt-1">
                  {language === "es" 
                    ? "Modifique la información del prospecto."
                    : "Modify the prospect information."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Form {...editLeadForm}>
            <form onSubmit={editLeadForm.handleSubmit((data) => selectedLead && updateLeadMutation.mutate({ id: selectedLead.id, data }))} className="space-y-6 py-4">
              
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {language === "es" ? "Información Personal" : "Personal Information"}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={editLeadForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Nombre" : "First Name"}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-edit-lead-firstname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editLeadForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Apellido" : "Last Name"}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-edit-lead-lastname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {language === "es" ? "Información de Contacto" : "Contact Information"}
                </h3>
                {selectedLead?.registrationType === "broker" ? (
                  <FormField
                    control={editLeadForm.control}
                    name="phoneLast4"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Últimos 4 dígitos del teléfono" : "Last 4 Phone Digits"}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} maxLength={4} placeholder="1234" data-testid="input-edit-lead-phonelast4" />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {language === "es" ? "Por seguridad, solo se almacenan los últimos 4 dígitos" : "For security, only the last 4 digits are stored"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={editLeadForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Teléfono" : "Phone"}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="+52 984 123 4567" data-testid="input-edit-lead-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editLeadForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} type="email" placeholder="ejemplo@correo.com" data-testid="input-edit-lead-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Location Information Section - Only for Seller type */}
              {selectedLead?.registrationType !== "broker" && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {language === "es" ? "Ubicación" : "Location"}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={editLeadForm.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Nacionalidad" : "Nationality"}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder={language === "es" ? "Mexicana" : "Mexican"} data-testid="input-edit-lead-nationality" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editLeadForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Ciudad" : "City"}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="Tulum" data-testid="input-edit-lead-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editLeadForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>{language === "es" ? "Dirección" : "Address"}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder={language === "es" ? "Calle, número, colonia..." : "Street, number, neighborhood..."} data-testid="input-edit-lead-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Status and Source Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {language === "es" ? "Estado y Origen" : "Status & Source"}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={editLeadForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Estado" : "Status"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-lead-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nuevo_lead">{language === "es" ? "Nuevo Lead" : "New Lead"}</SelectItem>
                            <SelectItem value="cita_coordinada">{language === "es" ? "Cita Coordinada" : "Appointment Scheduled"}</SelectItem>
                            <SelectItem value="interesado">{language === "es" ? "Interesado" : "Interested"}</SelectItem>
                            <SelectItem value="oferta_enviada">{language === "es" ? "Oferta Enviada" : "Offer Sent"}</SelectItem>
                            <SelectItem value="proceso_renta">{language === "es" ? "Proceso de Renta" : "Rental Process"}</SelectItem>
                            <SelectItem value="renta_concretada">{language === "es" ? "Renta Concretada" : "Rental Completed"}</SelectItem>
                            <SelectItem value="perdido">{language === "es" ? "Perdido" : "Lost"}</SelectItem>
                            <SelectItem value="muerto">{language === "es" ? "Muerto" : "Dead"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editLeadForm.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Fuente" : "Source"}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder={language === "es" ? "Facebook, Referido, etc." : "Facebook, Referral, etc."} data-testid="input-edit-lead-source" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Property Interest Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {language === "es" ? "Propiedad de Interés" : "Property Interest"}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={editLeadForm.control}
                    name="interestedCondominiumId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Condominio" : "Condominium"}</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setEditCondominiumId(value);
                            editLeadForm.setValue("interestedUnitId", undefined);
                          }} 
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-lead-condominium">
                              <SelectValue placeholder={language === "es" ? "Seleccionar condominio" : "Select condominium"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {condominiums.map((condo) => (
                              <SelectItem key={condo.id} value={condo.id}>
                                {condo.name} {condo.neighborhood ? `(${condo.neighborhood})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editLeadForm.control}
                    name="interestedUnitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Unidad" : "Unit"}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                          disabled={!editCondominiumId || editUnits.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-lead-unit">
                              <SelectValue placeholder={
                                !editCondominiumId 
                                  ? (language === "es" ? "Primero seleccione condominio" : "First select condominium")
                                  : editUnits.length === 0
                                    ? (language === "es" ? "Sin unidades disponibles" : "No units available")
                                    : (language === "es" ? "Seleccionar unidad" : "Select unit")
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {editUnits.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.unitNumber} {unit.type ? `(${unit.type})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Property Preferences Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {language === "es" ? "Preferencias de Propiedad" : "Property Preferences"}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      {language === "es" ? "Presupuesto (MXN)" : "Budget (MXN)"}
                    </FormLabel>
                    <div className="flex items-center gap-2">
                      <FormField
                        control={editLeadForm.control}
                        name="budgetMin"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                value={field.value || ""} 
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder={language === "es" ? "Mín" : "Min"}
                                data-testid="input-edit-lead-budget-min" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <span className="text-muted-foreground">-</span>
                      <FormField
                        control={editLeadForm.control}
                        name="budgetMax"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                value={field.value || ""} 
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder={language === "es" ? "Máx" : "Max"}
                                data-testid="input-edit-lead-budget-max" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Home className="h-3.5 w-3.5 text-muted-foreground" />
                      {language === "es" ? "Tipo de Propiedad" : "Property Type"}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between" data-testid="multiselect-edit-lead-unittype">
                          {selectedEditPropertyTypes.length > 0 
                            ? `${selectedEditPropertyTypes.length} ${language === "es" ? "seleccionado(s)" : "selected"}`
                            : (language === "es" ? "Seleccionar tipos..." : "Select types...")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-2" align="start">
                        <div className="space-y-1">
                          {(activePropertyTypes.length > 0 ? activePropertyTypes : [
                            { id: "dept", name: language === "es" ? "Departamento" : "Apartment" },
                            { id: "casa", name: language === "es" ? "Casa" : "House" },
                            { id: "estudio", name: language === "es" ? "Estudio" : "Studio" },
                            { id: "ph", name: "PH / Penthouse" },
                            { id: "villa", name: "Villa" },
                          ]).map((pt) => (
                            <div
                              key={pt.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                              onClick={() => {
                                setSelectedEditPropertyTypes(prev => 
                                  prev.includes(pt.name) 
                                    ? prev.filter(t => t !== pt.name) 
                                    : [...prev, pt.name]
                                );
                              }}
                              data-testid={`checkbox-edit-propertytype-${pt.name.toLowerCase().replace(/[^a-z]/g, '-')}`}
                            >
                              <div className={cn("h-4 w-4 rounded border flex items-center justify-center", selectedEditPropertyTypes.includes(pt.name) ? "bg-primary border-primary" : "border-input")}>
                                {selectedEditPropertyTypes.includes(pt.name) && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              <span className="text-sm">{pt.name}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {language === "es" ? "Zona / Colonia" : "Area"}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between" data-testid="multiselect-edit-lead-neighborhood">
                          {selectedEditZones.length > 0 
                            ? `${selectedEditZones.length} ${language === "es" ? "seleccionado(s)" : "selected"}`
                            : (language === "es" ? "Seleccionar zonas..." : "Select areas...")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-2" align="start">
                        <div className="space-y-1">
                          {(activeZones.length > 0 ? activeZones : [
                            { id: "aldea", name: "Aldea Zama" },
                            { id: "veleta", name: "La Veleta" },
                            { id: "centro", name: "Centro" },
                            { id: "otro", name: language === "es" ? "Otro" : "Other" },
                          ]).map((zone) => (
                            <div
                              key={zone.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                              onClick={() => {
                                setSelectedEditZones(prev => 
                                  prev.includes(zone.name) 
                                    ? prev.filter(z => z !== zone.name) 
                                    : [...prev, zone.name]
                                );
                              }}
                              data-testid={`checkbox-edit-zone-${zone.name.toLowerCase().replace(/[^a-z]/g, '-')}`}
                            >
                              <div className={cn("h-4 w-4 rounded border flex items-center justify-center", selectedEditZones.includes(zone.name) ? "bg-primary border-primary" : "border-input")}>
                                {selectedEditZones.includes(zone.name) && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              <span className="text-sm">{zone.name}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                  <FormField
                    control={editLeadForm.control}
                    name="contractDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Duración del Contrato" : "Contract Duration"}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-lead-duration">
                              <SelectValue placeholder={language === "es" ? "Seleccionar" : "Select"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="6 meses">6 {language === "es" ? "meses" : "months"}</SelectItem>
                            <SelectItem value="1 año">1 {language === "es" ? "año" : "year"}</SelectItem>
                            <SelectItem value="2 años">2 {language === "es" ? "años" : "years"}</SelectItem>
                            <SelectItem value="3+ años">3+ {language === "es" ? "años" : "years"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={editLeadForm.control}
                    name="checkInDate"
                    render={({ field }) => {
                      const today = new Date();
                      const minYear = today.getFullYear();
                      const maxYear = today.getFullYear() + 3;
                      
                      const formatDateForInput = (date: Date | string | null | undefined): string => {
                        if (!date) return "";
                        const d = new Date(date);
                        if (isNaN(d.getTime())) return "";
                        const year = d.getFullYear();
                        if (year < minYear || year > maxYear) return "";
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      };
                      
                      const handleDateChange = (dateString: string) => {
                        if (!dateString) {
                          field.onChange(undefined);
                          return;
                        }
                        const [year, month, day] = dateString.split('-').map(Number);
                        if (year < minYear || year > maxYear) {
                          return;
                        }
                        const newDate = new Date(year, month - 1, day, 12, 0, 0);
                        if (!isNaN(newDate.getTime())) {
                          field.onChange(newDate);
                        }
                      };
                      
                      const minDate = `${minYear}-01-01`;
                      const maxDate = `${maxYear}-12-31`;
                      
                      return (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            {language === "es" ? "Fecha de Mudanza" : "Move-in Date"}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              min={minDate}
                              max={maxDate}
                              value={formatDateForInput(field.value)} 
                              onChange={(e) => handleDateChange(e.target.value)}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  const [year] = val.split('-').map(Number);
                                  if (year < minYear || year > maxYear) {
                                    field.onChange(undefined);
                                  }
                                }
                              }}
                              data-testid="input-edit-lead-checkin"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={editLeadForm.control}
                    name="hasPets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <PawPrint className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "¿Tiene Mascotas?" : "Has Pets?"}
                        </FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "No") {
                            setEditPetQuantity(0);
                          } else if (editPetQuantity === 0) {
                            setEditPetQuantity(1);
                          }
                        }} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-lead-pets">
                              <SelectValue placeholder={language === "es" ? "Seleccionar" : "Select"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="Sí - Perro">{language === "es" ? "Sí - Perro" : "Yes - Dog"}</SelectItem>
                            <SelectItem value="Sí - Gato">{language === "es" ? "Sí - Gato" : "Yes - Cat"}</SelectItem>
                            <SelectItem value="Sí - Otro">{language === "es" ? "Sí - Otro" : "Yes - Other"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {editLeadForm.watch("hasPets") && editLeadForm.watch("hasPets") !== "No" && (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <PawPrint className="h-3.5 w-3.5 text-muted-foreground" />
                        {language === "es" ? "Cantidad de Mascotas" : "Number of Pets"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          max={10}
                          value={editPetQuantity}
                          onChange={(e) => setEditPetQuantity(parseInt(e.target.value) || 1)}
                          data-testid="input-edit-lead-pet-quantity"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                </div>
              </div>

              {/* Property Interest Selectors - Sequential Picker */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {language === "es" ? "Propiedades de Interés" : "Interested Properties"}
                </h3>
                
                {/* Property Picker Row */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Condominium Selector */}
                  <Popover open={editCondoPopoverOpen} onOpenChange={setEditCondoPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={editCondoPopoverOpen}
                        className="flex-1 justify-between"
                        data-testid="button-edit-lead-select-condo"
                      >
                        {editPendingCondoId
                          ? (condominiums.find(c => c.id === editPendingCondoId)?.name || (language === "es" ? "Seleccionar condominio" : "Select condominium"))
                          : (language === "es" ? "Seleccionar condominio" : "Select condominium")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder={language === "es" ? "Buscar condominio..." : "Search condominium..."}
                          value={editCondoSearchQuery}
                          onValueChange={setEditCondoSearchQuery}
                          data-testid="input-edit-lead-condo-search"
                        />
                        <CommandList>
                          <CommandEmpty>
                            {language === "es" ? "No se encontraron condominios" : "No condominiums found"}
                          </CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-[200px]">
                              {filteredEditCondominiums.map((condo) => (
                                <CommandItem
                                  key={condo.id}
                                  value={condo.id}
                                  onSelect={() => {
                                    setEditPendingCondoId(condo.id);
                                    setEditPendingUnitId("");
                                    setEditCondoPopoverOpen(false);
                                  }}
                                  data-testid={`item-edit-condo-${condo.id}`}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      editPendingCondoId === condo.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {condo.name} {condo.neighborhood ? `(${condo.neighborhood})` : ""}
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Unit Selector - Only shown when condominium is selected */}
                  {editPendingCondoId && (
                    <Select
                      value={editPendingUnitId}
                      onValueChange={setEditPendingUnitId}
                    >
                      <SelectTrigger className="flex-1" data-testid="select-edit-lead-unit">
                        <SelectValue placeholder={language === "es" ? "Unidad (opcional)" : "Unit (optional)"} />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {editPendingUnits.length === 0 ? (
                            <SelectItem value="loading" disabled>
                              {language === "es" ? "Cargando unidades..." : "Loading units..."}
                            </SelectItem>
                          ) : (
                            editPendingUnits.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.unitNumber} {unit.type ? `(${unit.type})` : ""}
                              </SelectItem>
                            ))
                          )}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* Add Property Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addEditProperty}
                    disabled={!editPendingCondoId}
                    data-testid="button-edit-lead-add-property"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Added Properties List */}
                {editPropertySelections.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {editPropertySelections.length} {language === "es" ? "propiedad(es) agregada(s)" : "property(ies) added"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {editPropertySelections.map((prop, index) => (
                        <Badge
                          key={`${prop.condominiumId}-${prop.unitId || 'condo'}-${index}`}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                          data-testid={`badge-edit-property-${index}`}
                        >
                          <span>
                            {prop.condominiumName}
                            {prop.unitNumber && ` - ${prop.unitNumber}`}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-destructive/20"
                            onClick={() => removeEditProperty(index)}
                            data-testid={`button-remove-edit-property-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <FormDescription className="text-xs">
                  {language === "es" 
                    ? "Opcional: Seleccione condominio, opcionalmente una unidad, y presione + para agregar" 
                    : "Optional: Select condominium, optionally a unit, and press + to add"}
                </FormDescription>
              </div>

              {/* Characteristics & Amenities Section - Collapsible */}
              {(activeCharacteristics.length > 0 || activeAmenities.length > 0) && (
                <Collapsible className="space-y-2 pt-4 border-t">
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Building2 className="h-4 w-4" />
                      {language === "es" ? "Características y Amenidades" : "Characteristics & Amenities"}
                      {(selectedEditCharacteristics.length > 0 || selectedEditAmenities.length > 0) && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {selectedEditCharacteristics.length + selectedEditAmenities.length}
                        </Badge>
                      )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <p className="text-xs text-muted-foreground">
                      {language === "es" 
                        ? "Opcional: características y amenidades que busca el cliente"
                        : "Optional: characteristics and amenities the client is looking for"}
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Unit Characteristics - Popover */}
                      {activeCharacteristics.length > 0 && (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Home className="h-3.5 w-3.5 text-muted-foreground" />
                            {language === "es" ? "Características" : "Characteristics"}
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between" data-testid="multiselect-edit-characteristics">
                                {selectedEditCharacteristics.length > 0 
                                  ? `${selectedEditCharacteristics.length} ${language === "es" ? "seleccionado(s)" : "selected"}`
                                  : (language === "es" ? "Seleccionar..." : "Select...")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] p-2" align="start">
                              <ScrollArea className="h-[200px]">
                                <div className="space-y-1">
                                  {activeCharacteristics.map((char) => (
                                    <div
                                      key={char.id}
                                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                      onClick={() => {
                                        setSelectedEditCharacteristics(prev => 
                                          prev.includes(char.id) 
                                            ? prev.filter(id => id !== char.id)
                                            : [...prev, char.id]
                                        );
                                      }}
                                      data-testid={`checkbox-edit-char-${char.id}`}
                                    >
                                      <div className={cn("h-4 w-4 rounded border flex items-center justify-center", selectedEditCharacteristics.includes(char.id) ? "bg-primary border-primary" : "border-input")}>
                                        {selectedEditCharacteristics.includes(char.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                                      </div>
                                      <span className="text-sm">{language === "es" ? char.name : (char.nameEn || char.name)}</span>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}

                      {/* Amenities - Popover */}
                      {activeAmenities.length > 0 && (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {language === "es" ? "Amenidades" : "Amenities"}
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between" data-testid="multiselect-edit-amenities">
                                {selectedEditAmenities.length > 0 
                                  ? `${selectedEditAmenities.length} ${language === "es" ? "seleccionado(s)" : "selected"}`
                                  : (language === "es" ? "Seleccionar..." : "Select...")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] p-2" align="start">
                              <ScrollArea className="h-[200px]">
                                <div className="space-y-1">
                                  {activeAmenities.map((amenity) => (
                                    <div
                                      key={amenity.id}
                                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                      onClick={() => {
                                        setSelectedEditAmenities(prev => 
                                          prev.includes(amenity.id) 
                                            ? prev.filter(id => id !== amenity.id)
                                            : [...prev, amenity.id]
                                        );
                                      }}
                                      data-testid={`checkbox-edit-amenity-${amenity.id}`}
                                    >
                                      <div className={cn("h-4 w-4 rounded border flex items-center justify-center", selectedEditAmenities.includes(amenity.id) ? "bg-primary border-primary" : "border-input")}>
                                        {selectedEditAmenities.includes(amenity.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                                      </div>
                                      <span className="text-sm">{language === "es" ? amenity.name : (amenity.nameEn || amenity.name)}</span>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Notes Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {language === "es" ? "Notas y Comentarios" : "Notes & Comments"}
                </h3>
                <FormField
                  control={editLeadForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          value={field.value || ""} 
                          placeholder={language === "es" ? "Agregue notas relevantes sobre el prospecto..." : "Add relevant notes about the prospect..."}
                          className="min-h-[100px]"
                          data-testid="input-edit-lead-notes" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditLeadDialogOpen(false);
                    setSelectedEditCharacteristics([]);
                    setSelectedEditAmenities([]);
                  }}
                  data-testid="button-edit-lead-cancel"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button type="submit" disabled={updateLeadMutation.isPending} className="gap-2" data-testid="button-edit-lead-submit">
                  {updateLeadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {language === "es" ? "Guardando..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {language === "es" ? "Guardar Cambios" : "Save Changes"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Lead Dialog */}
      <Dialog open={isDeleteLeadDialogOpen} onOpenChange={setIsDeleteLeadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Eliminar Lead" : "Delete Lead"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? `¿Está seguro de que desea eliminar a ${selectedLead?.firstName} ${selectedLead?.lastName}? Esta acción no se puede deshacer.`
                : `Are you sure you want to delete ${selectedLead?.firstName} ${selectedLead?.lastName}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteLeadDialogOpen(false)}
              data-testid="button-delete-lead-cancel"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedLead && deleteLeadMutation.mutate(selectedLead.id)}
              disabled={deleteLeadMutation.isPending}
              data-testid="button-delete-lead-confirm"
            >
              {deleteLeadMutation.isPending 
                ? (language === "es" ? "Eliminando..." : "Deleting...")
                : (language === "es" ? "Eliminar" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Lead Detail Dialog - Enhanced */}
      <Dialog open={isLeadDetailOpen} onOpenChange={setIsLeadDetailOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto w-full h-full sm:h-auto sm:w-auto fixed sm:relative inset-0 sm:inset-auto rounded-none sm:rounded-lg p-4 sm:p-6">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <DialogTitle className="text-xl">
                    {selectedLead?.firstName} {selectedLead?.lastName}
                  </DialogTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={selectedLead?.registrationType === "broker" ? "default" : "secondary"}>
                      {selectedLead?.registrationType === "broker" ? "Broker" : (language === "es" ? "Vendedor" : "Seller")}
                    </Badge>
                    <Badge variant={getLeadStatusVariant(selectedLead?.status || "nuevo_lead")}>
                      {getLeadStatusLabel(selectedLead?.status || "nuevo_lead")}
                    </Badge>
                  </div>
                </div>
                <DialogDescription className="mt-1">
                  {language === "es" ? "Información detallada del prospecto" : "Detailed prospect information"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedLead && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <User className="h-4 w-4" />
                    {language === "es" ? "Información de Contacto" : "Contact Information"}
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">{language === "es" ? "Nombre" : "Name"}</span>
                        <p className="font-medium">{selectedLead.firstName} {selectedLead.lastName}</p>
                      </div>
                      {selectedLead.registrationType === "broker" ? (
                        <div>
                          <span className="text-muted-foreground text-xs">{language === "es" ? "Teléfono" : "Phone"}</span>
                          <p className="font-medium">****{selectedLead.phoneLast4}</p>
                        </div>
                      ) : (
                        <>
                          {selectedLead.phone && (
                            <div>
                              <span className="text-muted-foreground text-xs">{language === "es" ? "Teléfono" : "Phone"}</span>
                              <p className="font-medium flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {selectedLead.phone}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {selectedLead.email && selectedLead.registrationType !== "broker" && (
                      <div>
                        <span className="text-muted-foreground text-xs">Email</span>
                        <p className="font-medium flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {selectedLead.email}
                        </p>
                      </div>
                    )}
                    {(selectedLead.nationality || selectedLead.city) && (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedLead.nationality && (
                          <div>
                            <span className="text-muted-foreground text-xs">{language === "es" ? "Nacionalidad" : "Nationality"}</span>
                            <p className="font-medium">{selectedLead.nationality}</p>
                          </div>
                        )}
                        {selectedLead.city && (
                          <div>
                            <span className="text-muted-foreground text-xs">{language === "es" ? "Ciudad" : "City"}</span>
                            <p className="font-medium">{selectedLead.city}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Property Preferences - prefer activeCard, fallback to lead fields */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <Home className="h-4 w-4" />
                    {language === "es" ? "Preferencias de Propiedad" : "Property Preferences"}
                    {selectedLead.activeCard && (
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        ({language === "es" ? "de tarjeta" : "from card"})
                      </span>
                    )}
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {(selectedLead.activeCard?.budgetText || selectedLead.activeCard?.budgetMin || selectedLead.activeCard?.budgetMax || selectedLead.budgetMin || selectedLead.budgetMax || selectedLead.estimatedRentCost || selectedLead.estimatedRentCostText) && (
                        <div>
                          <span className="text-muted-foreground text-xs">{language === "es" ? "Presupuesto" : "Budget"}</span>
                          <p className="font-medium text-green-600">
                            {selectedLead.activeCard?.budgetText 
                              ? selectedLead.activeCard.budgetText
                              : (selectedLead.activeCard?.budgetMin || selectedLead.activeCard?.budgetMax)
                                ? `$${selectedLead.activeCard.budgetMin ? Number(selectedLead.activeCard.budgetMin).toLocaleString() : '0'} - $${selectedLead.activeCard.budgetMax ? Number(selectedLead.activeCard.budgetMax).toLocaleString() : '∞'}`
                                : (selectedLead.budgetMin || selectedLead.budgetMax) 
                                  ? `$${selectedLead.budgetMin ? Number(selectedLead.budgetMin).toLocaleString() : '0'} - $${selectedLead.budgetMax ? Number(selectedLead.budgetMax).toLocaleString() : '∞'}`
                                  : (selectedLead.estimatedRentCostText || (selectedLead.estimatedRentCost ? `$${selectedLead.estimatedRentCost.toLocaleString()}` : "-"))}
                          </p>
                        </div>
                      )}
                      {(selectedLead.activeCard?.bedrooms || selectedLead.activeCard?.bedroomsText || selectedLead.bedrooms || selectedLead.bedroomsText) && (
                        <div>
                          <span className="text-muted-foreground text-xs">{language === "es" ? "Recámaras" : "Bedrooms"}</span>
                          <p className="font-medium">{selectedLead.activeCard?.bedroomsText || selectedLead.activeCard?.bedrooms || selectedLead.bedrooms || selectedLead.bedroomsText}</p>
                        </div>
                      )}
                      {(selectedLead.activeCard?.propertyType || selectedLead.desiredUnitType) && (
                        <div>
                          <span className="text-muted-foreground text-xs">{language === "es" ? "Tipo de Unidad" : "Unit Type"}</span>
                          <p className="font-medium">{selectedLead.activeCard?.propertyType || selectedLead.desiredUnitType}</p>
                        </div>
                      )}
                      {(selectedLead.activeCard?.contractDuration || selectedLead.contractDuration) && (
                        <div>
                          <span className="text-muted-foreground text-xs">{language === "es" ? "Duración Contrato" : "Contract Duration"}</span>
                          <p className="font-medium">{selectedLead.activeCard?.contractDuration || selectedLead.contractDuration}</p>
                        </div>
                      )}
                      {(selectedLead.activeCard?.hasPets || selectedLead.hasPets) && (
                        <div>
                          <span className="text-muted-foreground text-xs">{language === "es" ? "Mascotas" : "Pets"}</span>
                          <p className="font-medium">{selectedLead.activeCard?.hasPets || selectedLead.hasPets}</p>
                        </div>
                      )}
                      {(selectedLead.activeCard?.moveInDate || selectedLead.checkInDate || selectedLead.checkInDateText) && (
                        <div>
                          <span className="text-muted-foreground text-xs">{language === "es" ? "Fecha de Mudanza" : "Move-in Date"}</span>
                          <p className="font-medium">
                            {selectedLead.activeCard?.moveInDate 
                              ? format(new Date(selectedLead.activeCard.moveInDate), "dd MMM yyyy", { locale: language === "es" ? es : enUS })
                              : selectedLead.checkInDate 
                                ? format(new Date(selectedLead.checkInDate), "dd MMM yyyy", { locale: language === "es" ? es : enUS })
                                : selectedLead.checkInDateText}
                          </p>
                        </div>
                      )}
                    </div>
                    {(selectedLead.activeCard?.zone || selectedLead.desiredNeighborhood) && (
                      <div>
                        <span className="text-muted-foreground text-xs">{language === "es" ? "Zona Preferida" : "Preferred Area"}</span>
                        <p className="font-medium">{selectedLead.activeCard?.zone || selectedLead.desiredNeighborhood}</p>
                      </div>
                    )}
                    {selectedLead.desiredProperty && (
                      <div>
                        <span className="text-muted-foreground text-xs">{language === "es" ? "Propiedad de Interés" : "Property of Interest"}</span>
                        <p className="font-medium">{selectedLead.desiredProperty}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Seller Assignment */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <Users className="h-4 w-4" />
                    {language === "es" ? "Vendedor Asignado" : "Assigned Seller"}
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-muted-foreground text-xs">{language === "es" ? "Vendedor Actual" : "Current Seller"}</span>
                        <p className="font-medium">
                          {selectedLead.sellerName || 
                           sellers.find(s => s.id === selectedLead.sellerId || s.id === selectedLead.assignedSellerId)?.firstName + ' ' + 
                           sellers.find(s => s.id === selectedLead.sellerId || s.id === selectedLead.assignedSellerId)?.lastName ||
                           (language === "es" ? "Sin asignar" : "Unassigned")}
                        </p>
                      </div>
                      {!isSeller && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setNewAssignedSellerId(selectedLead.assignedSellerId || selectedLead.sellerId || "");
                            setIsReassignDialogOpen(true);
                          }}
                          data-testid="button-reassign-lead"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {language === "es" ? "Reasignar" : "Reassign"}
                        </Button>
                      )}
                    </div>
                    {selectedLead.assistantSellerName && (
                      <div>
                        <span className="text-muted-foreground text-xs">{language === "es" ? "Vendedor Secundario" : "Secondary Seller"}</span>
                        <p className="font-medium">{selectedLead.assistantSellerName}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Source and Dates */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <CalendarIcon className="h-4 w-4" />
                    {language === "es" ? "Origen y Fechas" : "Source & Dates"}
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedLead.source && (
                        <div>
                          <span className="text-muted-foreground text-xs">{language === "es" ? "Fuente" : "Source"}</span>
                          <p className="font-medium">{selectedLead.source}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground text-xs">{language === "es" ? "Fecha de Registro" : "Registration Date"}</span>
                        <p className="font-medium">
                          {selectedLead.createdAt ? format(new Date(selectedLead.createdAt), "dd MMM yyyy", { locale: language === "es" ? es : enUS }) : "-"}
                        </p>
                      </div>
                      {selectedLead.firstContactDate && (
                        <div>
                          <span className="text-muted-foreground text-xs">{language === "es" ? "Primer Contacto" : "First Contact"}</span>
                          <p className="font-medium">
                            {format(new Date(selectedLead.firstContactDate), "dd MMM yyyy", { locale: language === "es" ? es : enUS })}
                          </p>
                        </div>
                      )}
                      {selectedLead.lastContactDate && (
                        <div>
                          <span className="text-muted-foreground text-xs">{language === "es" ? "Último Contacto" : "Last Contact"}</span>
                          <p className="font-medium">
                            {format(new Date(selectedLead.lastContactDate), "dd MMM yyyy", { locale: language === "es" ? es : enUS })}
                          </p>
                        </div>
                      )}
                    </div>
                    {selectedLead.validUntil && (
                      <div className="pt-2 border-t">
                        <span className="text-muted-foreground text-xs">{language === "es" ? "Válido Hasta" : "Valid Until"}</span>
                        <p className={`font-medium ${new Date(selectedLead.validUntil) < new Date() ? 'text-red-500' : ''}`}>
                          {format(new Date(selectedLead.validUntil), "dd MMM yyyy", { locale: language === "es" ? es : enUS })}
                          {new Date(selectedLead.validUntil) < new Date() && (
                            <Badge variant="destructive" className="ml-2 text-xs">{language === "es" ? "Expirado" : "Expired"}</Badge>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Update */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <RefreshCw className="h-4 w-4" />
                    {language === "es" ? "Actualizar Estado" : "Update Status"}
                  </h3>
                  {isSeller && ["proceso_renta", "renta_concretada"].includes(selectedLead.status) && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
                      {language === "es" 
                        ? "El administrador de la agencia es responsable de este lead en esta etapa."
                        : "The agency admin is responsible for this lead at this stage."}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {["nuevo_lead", "cita_coordinada", "interesado", "oferta_enviada", "proceso_renta", "renta_concretada", "perdido", "muerto"].map((status) => {
                      const lockedStatuses = ["proceso_renta", "renta_concretada"];
                      const isStatusLocked = isSeller && (
                        lockedStatuses.includes(selectedLead.status) || 
                        lockedStatuses.includes(status)
                      );
                      return (
                        <Button
                          key={status}
                          size="sm"
                          variant={selectedLead.status === status ? "default" : "outline"}
                          onClick={() => {
                            updateLeadStatusMutation.mutate({ leadId: selectedLead.id, status });
                            setSelectedLead({ ...selectedLead, status });
                          }}
                          disabled={updateLeadStatusMutation.isPending || isStatusLocked}
                          className="text-xs h-9 sm:h-8 px-3"
                          title={isStatusLocked ? (language === "es" ? "Solo el administrador puede cambiar este estado" : "Only admin can change this status") : undefined}
                        >
                          {getLeadStatusLabel(status)}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                {/* Notes */}
                {selectedLead.notes && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                      <FileText className="h-4 w-4" />
                      {language === "es" ? "Notas" : "Notes"}
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{selectedLead.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CRM Tabs */}
          {selectedLead && (
            <div className="border-t pt-4">
              <LeadCRMTabs lead={selectedLead} />
            </div>
          )}

          <DialogFooter className="border-t pt-4 gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              className="h-11 sm:h-9 w-full sm:w-auto order-last sm:order-first"
              onClick={() => setIsLeadDetailOpen(false)}
              data-testid="button-lead-detail-close"
            >
              {language === "es" ? "Cerrar" : "Close"}
            </Button>
            <Button
              variant="outline"
              className="h-11 sm:h-9 w-full sm:w-auto"
              onClick={() => {
                setIsLeadDetailOpen(false);
                if (selectedLead) {
                  editLeadForm.reset(selectedLead);
                  setEditCondominiumId(selectedLead.interestedCondominiumId || "");
                  setSelectedEditCharacteristics((selectedLead as any).desiredCharacteristics || []);
                  setSelectedEditAmenities((selectedLead as any).desiredAmenities || []);
                  setSelectedEditPropertyTypes(selectedLead.desiredUnitType ? selectedLead.desiredUnitType.split(", ").filter(Boolean) : []);
                  setSelectedEditZones(selectedLead.desiredNeighborhood ? selectedLead.desiredNeighborhood.split(", ").filter(Boolean) : []);
                  hydrateEditPropertySelections(selectedLead);
                  setEditPetQuantity((selectedLead as any).petQuantity || 1);
                  setIsEditLeadDialogOpen(true);
                }
              }}
              data-testid="button-lead-detail-edit"
            >
              <Pencil className="h-4 w-4 mr-2" />
              {language === "es" ? "Editar" : "Edit"}
            </Button>
            {selectedLead && selectedLead.registrationType === "seller" && selectedLead.status !== "renta_concretada" && !isSeller && (
              <Button
                onClick={() => convertLeadToClientMutation.mutate(selectedLead)}
                disabled={convertLeadToClientMutation.isPending}
                className="h-11 sm:h-9 w-full sm:w-auto bg-green-600 hover:bg-green-700"
                data-testid="button-convert-to-client"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                {convertLeadToClientMutation.isPending 
                  ? (language === "es" ? "Convirtiendo..." : "Converting...")
                  : (language === "es" ? "Convertir a Cliente" : "Convert to Client")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Lead Dialog */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              {language === "es" ? "Reasignar Lead" : "Reassign Lead"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Selecciona el nuevo vendedor para este lead."
                : "Select the new seller for this lead."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>{language === "es" ? "Nuevo Vendedor" : "New Seller"}</Label>
            <Select value={newAssignedSellerId} onValueChange={setNewAssignedSellerId}>
              <SelectTrigger data-testid="select-new-seller">
                <SelectValue placeholder={language === "es" ? "Seleccionar vendedor..." : "Select seller..."} />
              </SelectTrigger>
              <SelectContent>
                {sellers.map((seller) => (
                  <SelectItem key={seller.id} value={seller.id} data-testid={`select-seller-${seller.id}`}>
                    {seller.firstName} {seller.lastName} {seller.isAgency ? `(${language === "es" ? "Agencia" : "Agency"})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReassignDialogOpen(false)}>
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              onClick={() => {
                if (selectedLead && newAssignedSellerId) {
                  const seller = sellers.find(s => s.id === newAssignedSellerId);
                  reassignLeadMutation.mutate({ 
                    leadId: selectedLead.id, 
                    newSellerId: newAssignedSellerId,
                    newSellerName: seller ? `${seller.firstName} ${seller.lastName}` : ""
                  });
                }
              }}
              disabled={!newAssignedSellerId || reassignLeadMutation.isPending}
              data-testid="button-confirm-reassign"
            >
              {reassignLeadMutation.isPending 
                ? (language === "es" ? "Reasignando..." : "Reassigning...")
                : (language === "es" ? "Reasignar" : "Reassign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Lead Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {language === "es" ? "Importar Leads desde Excel" : "Import Leads from Excel"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Sube un archivo Excel o CSV con tu base de datos de leads existente."
                : "Upload an Excel or CSV file with your existing leads database."}
            </DialogDescription>
          </DialogHeader>

          {importStep === "upload" && (
            <div className="space-y-6">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate cursor-pointer"
                onClick={() => document.getElementById('import-file-input')?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileUpload(file);
                }}
              >
                <input
                  id="import-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  data-testid="input-import-file"
                />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  {language === "es" ? "Arrastra un archivo aquí o haz clic para seleccionar" : "Drag a file here or click to select"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "es" ? "Formatos soportados: Excel (.xlsx, .xls) y CSV" : "Supported formats: Excel (.xlsx, .xls) and CSV"}
                </p>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  {language === "es" ? "Columnas esperadas" : "Expected columns"}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <span>Fecha de Registro</span>
                  <span>Nombre Completo</span>
                  <span>Teléfono</span>
                  <span>Duración Contrato</span>
                  <span>Fecha de Entrada</span>
                  <span>Mascotas</span>
                  <span>Presupuesto</span>
                  <span>Recámaras</span>
                  <span>Propiedad Específica</span>
                  <span>Zona/Colonia</span>
                  <span>Vendedor Principal</span>
                  <span>Vendedor Secundario</span>
                  <span>Notas</span>
                  <span>Estado</span>
                </div>
              </div>
            </div>
          )}

          {importStep === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">
                    {language === "es" 
                      ? `${importData.length} leads encontrados en el archivo`
                      : `${importData.length} leads found in the file`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {importFile?.name}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImportStep("upload");
                    setImportFile(null);
                    setImportData([]);
                    setImportPreview([]);
                  }}
                >
                  {language === "es" ? "Cambiar archivo" : "Change file"}
                </Button>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>{language === "es" ? "Nombre" : "Name"}</TableHead>
                      <TableHead>{language === "es" ? "Teléfono" : "Phone"}</TableHead>
                      <TableHead>{language === "es" ? "Presupuesto" : "Budget"}</TableHead>
                      <TableHead>{language === "es" ? "Zona" : "Area"}</TableHead>
                      <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.map((lead, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>{lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || '-'}</TableCell>
                        <TableCell>{lead.phone || '-'}</TableCell>
                        <TableCell>{lead.estimatedRentCostText || '-'}</TableCell>
                        <TableCell>{lead.preferredNeighborhood || '-'}</TableCell>
                        <TableCell>{lead.status || 'nuevo_lead'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {importData.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  {language === "es" 
                    ? `Mostrando 10 de ${importData.length} leads`
                    : `Showing 10 of ${importData.length} leads`}
                </p>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  {language === "es" 
                    ? "Los leads duplicados (mismo teléfono con registro menor a 3 meses) serán omitidos automáticamente."
                    : "Duplicate leads (same phone with registration less than 3 months ago) will be automatically skipped."}
                </p>
              </div>
            </div>
          )}

          {importStep === "importing" && (
            <div className="py-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium mb-2">
                {language === "es" ? "Importando leads..." : "Importing leads..."}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === "es" 
                  ? `Procesando ${importData.length} registros`
                  : `Processing ${importData.length} records`}
              </p>
            </div>
          )}

          {importStep === "complete" && importResults && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold mb-2">
                  {language === "es" ? "Importación Completada" : "Import Completed"}
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-green-600">{importResults.imported}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === "es" ? "Importados" : "Imported"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-yellow-600">{importResults.duplicates}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === "es" ? "Duplicados" : "Duplicates"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-orange-500">{importResults.warnings?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === "es" ? "Advertencias" : "Warnings"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-red-600">{importResults.errors.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === "es" ? "Errores" : "Errors"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {importResults.warnings && importResults.warnings.length > 0 && (
                <div className="border border-orange-200 rounded-lg p-4 max-h-40 overflow-y-auto bg-orange-50 dark:bg-orange-950/20">
                  <h4 className="font-medium mb-2 text-orange-600">
                    {language === "es" ? "Advertencias (sin fecha de registro original):" : "Warnings (missing original registration date):"}
                  </h4>
                  <ul className="text-sm space-y-1">
                    {importResults.warnings.slice(0, 10).map((warning: any, index: number) => (
                      <li key={index} className="text-muted-foreground">
                        {language === "es" ? "Fila" : "Row"} {warning.row}: {warning.name} - {warning.warning}
                      </li>
                    ))}
                    {importResults.warnings.length > 10 && (
                      <li className="text-muted-foreground">
                        ... {language === "es" ? "y" : "and"} {importResults.warnings.length - 10} {language === "es" ? "más" : "more"}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {importResults.errors.length > 0 && (
                <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                  <h4 className="font-medium mb-2 text-red-600">
                    {language === "es" ? "Errores encontrados:" : "Errors found:"}
                  </h4>
                  <ul className="text-sm space-y-1">
                    {importResults.errors.slice(0, 10).map((error: any, index: number) => (
                      <li key={index} className="text-muted-foreground">
                        {language === "es" ? "Fila" : "Row"} {error.row}: {error.error}
                      </li>
                    ))}
                    {importResults.errors.length > 10 && (
                      <li className="text-muted-foreground">
                        ... {language === "es" ? "y" : "and"} {importResults.errors.length - 10} {language === "es" ? "más" : "more"}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {importStep === "upload" && (
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                {language === "es" ? "Cancelar" : "Cancel"}
              </Button>
            )}
            {importStep === "preview" && (
              <>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button onClick={handleImportConfirm} data-testid="button-import-confirm">
                  <Upload className="mr-2 h-4 w-4" />
                  {language === "es" 
                    ? `Importar ${importData.length} leads`
                    : `Import ${importData.length} leads`}
                </Button>
              </>
            )}
            {importStep === "complete" && (
              <Button onClick={() => setIsImportDialogOpen(false)} data-testid="button-import-close">
                {language === "es" ? "Cerrar" : "Close"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
