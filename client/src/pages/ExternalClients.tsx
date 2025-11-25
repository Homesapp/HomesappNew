import { useState, useEffect, useLayoutEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import * as XLSX from "xlsx";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import { useDebounce } from "@/hooks/useDebounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, ApiError } from "@/lib/queryClient";
import type { ExternalClient, ExternalLead } from "@shared/schema";
import { insertExternalClientSchema, insertExternalLeadSchema, updateExternalLeadSchema } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";
import LeadKanbanView from "@/components/external/LeadKanbanView";

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

  const [activeTab, setActiveTab] = useState<"clients" | "leads">("clients");
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
  const [isEditLeadDialogOpen, setIsEditLeadDialogOpen] = useState(false);
  const [isDeleteLeadDialogOpen, setIsDeleteLeadDialogOpen] = useState(false);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<ExternalLead | null>(null);
  const [selectedAgencyIdForLead, setSelectedAgencyIdForLead] = useState<string>("");
  
  // Check if user is master/admin (needs agency selection)
  const isMasterOrAdmin = user?.role === 'master' || user?.role === 'admin';
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const debouncedLeadSearchTerm = useDebounce(leadSearchTerm, 400);
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("all");
  const [leadRegistrationTypeFilter, setLeadRegistrationTypeFilter] = useState<string>("all");
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

  const { data: leadsResponse, isLoading: leadsLoading } = useQuery<{ data: ExternalLead[]; total: number; limit: number; offset: number; hasMore: boolean }>({
    queryKey: ["/api/external-leads", leadStatusFilter, leadRegistrationTypeFilter, debouncedLeadSearchTerm, leadSortField, leadSortOrder, leadCurrentPage, leadItemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (leadStatusFilter !== "all") params.append("status", leadStatusFilter);
      if (leadRegistrationTypeFilter !== "all") params.append("registrationType", leadRegistrationTypeFilter);
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
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    keepPreviousData: true,
  });

  const leads = leadsResponse?.data || [];
  const totalLeads = leadsResponse?.total || 0;
  const paginatedLeads = leads;
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
  useEffect(() => {
    const clampedPage = Math.min(leadCurrentPage, totalLeadPages);
    if (clampedPage !== leadCurrentPage) {
      setLeadCurrentPage(clampedPage);
    }
  }, [totalLeadPages, leadCurrentPage]);

  // Backend handles all filtering, sorting, and pagination
  // No client-side processing needed
  const paginatedClients = clients;

  // Total pages based on server total (accounts for all filters)
  const totalPages = Math.max(1, Math.ceil(totalClients / itemsPerPage));

  useEffect(() => {
    const clampedPage = Math.min(currentPage, totalPages);
    if (clampedPage !== currentPage) {
      setCurrentPage(clampedPage);
    }
  }, [totalPages, currentPage]);

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
      estimatedRentCost: undefined,
      bedrooms: undefined,
      desiredUnitType: "",
      desiredNeighborhood: "",
      sellerId: undefined,
    },
  });

  const editLeadForm = useForm<EditLeadFormData>({
    resolver: zodResolver(updateExternalLeadSchema),
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      // Convert Date to ISO string for API
      const processedData = {
        ...data,
        checkInDate: data.checkInDate ? new Date(data.checkInDate).toISOString() : undefined,
      };
      // For master/admin users, include the selected agencyId
      const payload = isMasterOrAdmin && selectedAgencyIdForLead 
        ? { ...processedData, agencyId: selectedAgencyIdForLead }
        : processedData;
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
      setSelectedAgencyIdForLead(""); // Reset agency selection
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
      const res = await apiRequest("PATCH", `/api/external-leads/${id}`, data);
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
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Clientes" : "Clients"}
          </h1>
          <p className="text-muted-foreground">
            {language === "es" 
              ? "Gestiona el registro de clientes e inquilinos"
              : "Manage client and tenant registration"}
          </p>
        </div>
      </div>

      {/* Public Registration Links Section */}
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
      </Collapsible>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "clients" | "leads")}>
        <div className="flex items-center justify-between gap-4">
          <TabsList className="grid grid-cols-2" style={{ width: "fit-content" }}>
            <TabsTrigger value="clients" data-testid="tab-clients">
              {language === "es" ? "Clientes" : "Clients"}
            </TabsTrigger>
            <TabsTrigger value="leads" data-testid="tab-leads">
              {language === "es" ? "Leads" : "Leads"}
            </TabsTrigger>
          </TabsList>

          {/* Create Button */}
          {activeTab === "clients" && (
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              data-testid="button-create-client"
            >
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Nuevo Cliente" : "New Client"}
            </Button>
          )}
          {activeTab === "leads" && (
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
                    <p className="mt-1">{getStatusBadge(selectedClient.status)}</p>
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

          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsClientDetailOpen(false)}
              data-testid="button-detail-close"
            >
              {language === "es" ? "Cerrar" : "Close"}
            </Button>
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
        </TabsContent>

        {/* Leads Tab Content */}
        <TabsContent value="leads" className="space-y-6 mt-6">
          {/* Search and Filters for Leads */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={language === "es" ? "Buscar por nombre, email o teléfono..." : "Search by name, email or phone..."}
                    value={leadSearchTerm}
                    onChange={(e) => setLeadSearchTerm(e.target.value)}
                    className="pl-10"
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

                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="flex-shrink-0 relative"
                      data-testid="button-lead-filters"
                    >
                      <Filter className="h-4 w-4" />
                      {(leadStatusFilter !== "all" || leadRegistrationTypeFilter !== "all") && (
                        <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                          {(leadStatusFilter !== "all" ? 1 : 0) + (leadRegistrationTypeFilter !== "all" ? 1 : 0)}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">{language === "es" ? "Estado" : "Status"}</h4>
                        <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
                          <SelectTrigger data-testid="select-lead-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
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
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">{language === "es" ? "Tipo de Registro" : "Registration Type"}</h4>
                        <Select value={leadRegistrationTypeFilter} onValueChange={setLeadRegistrationTypeFilter}>
                          <SelectTrigger data-testid="select-lead-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                            <SelectItem value="broker">{language === "es" ? "Broker" : "Broker"}</SelectItem>
                            <SelectItem value="seller">{language === "es" ? "Vendedor" : "Seller"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(leadStatusFilter !== "all" || leadRegistrationTypeFilter !== "all") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLeadStatusFilter("all");
                            setLeadRegistrationTypeFilter("all");
                          }}
                          className="w-full"
                          data-testid="button-lead-clear-filters"
                        >
                          {language === "es" ? "Limpiar Filtros" : "Clear Filters"}
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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
                          <TableHead>{language === "es" ? "Nombre" : "Name"}</TableHead>
                          <TableHead>{language === "es" ? "Tipo" : "Type"}</TableHead>
                          <TableHead>{language === "es" ? "Contacto" : "Contact"}</TableHead>
                          <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                          <TableHead>{language === "es" ? "Fuente" : "Source"}</TableHead>
                          <TableHead>{language === "es" ? "Fecha" : "Date"}</TableHead>
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
                            <TableCell className="font-medium">{`${lead.firstName} ${lead.lastName}`}</TableCell>
                            <TableCell>
                              <Badge variant={lead.registrationType === "broker" ? "default" : "secondary"}>
                                {lead.registrationType === "broker" ? "Broker" : (language === "es" ? "Vendedor" : "Seller")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                {lead.registrationType === "broker" ? (
                                  <div>****{lead.phoneLast4}</div>
                                ) : (
                                  <>
                                    {lead.phone && <div>{lead.phone}</div>}
                                    {lead.email && <div className="text-muted-foreground">{lead.email}</div>}
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getLeadStatusVariant(lead.status)}>
                                {getLeadStatusLabel(lead.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{lead.source || "-"}</TableCell>
                            <TableCell className="text-sm">
                              {lead.createdAt ? format(new Date(lead.createdAt), "dd MMM yyyy", { locale: language === "es" ? es : enUS }) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    editLeadForm.reset(lead);
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
                <div className="grid gap-4 md:grid-cols-2">
                  {paginatedLeads.map((lead) => (
                    <Card 
                      key={lead.id} 
                      className="hover-elevate cursor-pointer"
                      onClick={() => handleLeadClick(lead)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base">{`${lead.firstName} ${lead.lastName}`}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant={lead.registrationType === "broker" ? "default" : "secondary"} className="text-xs">
                                {lead.registrationType === "broker" ? "Broker" : (language === "es" ? "Vendedor" : "Seller")}
                              </Badge>
                              <Badge 
                                variant={getLeadStatusVariant(lead.status)}
                                className="text-xs"
                              >
                                {getLeadStatusLabel(lead.status)}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedLead(lead);
                                editLeadForm.reset(lead);
                                setIsEditLeadDialogOpen(true);
                              }}
                              data-testid={`button-edit-lead-${lead.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
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
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div>
                          {lead.registrationType === "broker" ? (
                            <div className="text-muted-foreground">****{lead.phoneLast4}</div>
                          ) : (
                            <>
                              {lead.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span>{lead.phone}</span>
                                </div>
                              )}
                              {lead.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate">{lead.email}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {lead.source && (
                          <div className="text-muted-foreground">
                            {language === "es" ? "Fuente" : "Source"}: {lead.source}
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          {lead.createdAt ? format(new Date(lead.createdAt), "dd MMM yyyy", { locale: language === "es" ? es : enUS }) : "-"}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Lead Dialog */}
      <Dialog open={isCreateLeadDialogOpen} onOpenChange={setIsCreateLeadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {language === "es" ? "Registrar Nuevo Lead" : "Register New Lead"}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {language === "es" 
                    ? "Complete la información del prospecto. Los campos con * son obligatorios."
                    : "Fill in the prospect information. Fields with * are required."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <Form {...leadForm}>
            <form onSubmit={leadForm.handleSubmit((data) => createLeadMutation.mutate(data))} className="space-y-6 py-4">
              
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

              {/* Section 1: Contact Type & Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">1</div>
                  {language === "es" ? "Información de Contacto" : "Contact Information"}
                </div>
                
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
                            {language === "es" ? "Email *" : "Email *"}
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

              {/* Section 2: Property Search Preferences */}
              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground pt-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">2</div>
                  {language === "es" ? "Preferencias de Búsqueda" : "Search Preferences"}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={leadForm.control}
                    name="estimatedRentCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Presupuesto (MXN)" : "Budget (MXN)"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            value={field.value || ""} 
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="25000"
                            data-testid="input-create-lead-budget" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={leadForm.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Recámaras" : "Bedrooms"}
                        </FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-create-lead-bedrooms">
                              <SelectValue placeholder={language === "es" ? "Seleccionar" : "Select"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Studio</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4+</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={leadForm.control}
                    name="desiredUnitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Home className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Tipo de Propiedad" : "Property Type"}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-lead-unittype">
                              <SelectValue placeholder={language === "es" ? "Seleccionar" : "Select"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Departamento">{language === "es" ? "Departamento" : "Apartment"}</SelectItem>
                            <SelectItem value="Casa">{language === "es" ? "Casa" : "House"}</SelectItem>
                            <SelectItem value="Estudio">{language === "es" ? "Estudio" : "Studio"}</SelectItem>
                            <SelectItem value="PH">PH / Penthouse</SelectItem>
                            <SelectItem value="Villa">Villa</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={leadForm.control}
                    name="desiredNeighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Zona / Colonia Preferida" : "Preferred Area"}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-lead-neighborhood">
                              <SelectValue placeholder={language === "es" ? "Seleccione zona" : "Select area"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Aldea Zama">Aldea Zama</SelectItem>
                            <SelectItem value="Centro">Centro</SelectItem>
                            <SelectItem value="La Veleta">La Veleta</SelectItem>
                            <SelectItem value="Region 15">Region 15</SelectItem>
                            <SelectItem value="Region 8">Region 8</SelectItem>
                            <SelectItem value="Holistika">Holistika</SelectItem>
                            <SelectItem value="Selva Zama">Selva Zama</SelectItem>
                            <SelectItem value="Otro">{language === "es" ? "Otro" : "Other"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={leadForm.control}
                    name="contractDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Duración del Contrato" : "Contract Duration"}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-lead-duration">
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
                    control={leadForm.control}
                    name="checkInDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Fecha de Entrada Deseada" : "Desired Move-in Date"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""} 
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                            data-testid="input-create-lead-checkin"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-lead-pets">
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
                </div>
              </div>

              {/* Section 3: Status & Additional Info */}
              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground pt-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">3</div>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-lead-status">
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
                    control={leadForm.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          {language === "es" ? "Fuente / Origen" : "Source"}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-lead-source">
                              <SelectValue placeholder={language === "es" ? "¿Cómo llegó?" : "How did they find us?"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            <SelectItem value="Web">Web</SelectItem>
                            <SelectItem value="Referido">{language === "es" ? "Referido" : "Referral"}</SelectItem>
                            <SelectItem value="Redes Sociales">{language === "es" ? "Redes Sociales" : "Social Media"}</SelectItem>
                            <SelectItem value="Llamada">{language === "es" ? "Llamada" : "Phone Call"}</SelectItem>
                            <SelectItem value="Evento">{language === "es" ? "Evento" : "Event"}</SelectItem>
                            <SelectItem value="Otro">{language === "es" ? "Otro" : "Other"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={leadForm.control}
                  name="sellerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        {language === "es" ? "Vendedor Asignado" : "Assigned Seller"}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-create-lead-seller">
                            <SelectValue placeholder={language === "es" ? "Seleccionar vendedor" : "Select seller"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sellers.length === 0 ? (
                            <SelectItem value="none" disabled>{language === "es" ? "No hay vendedores disponibles" : "No sellers available"}</SelectItem>
                          ) : (
                            sellers.map((seller) => (
                              <SelectItem key={seller.id} value={seller.id}>
                                {seller.firstName} {seller.lastName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

              <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateLeadDialogOpen(false)}
                  data-testid="button-create-lead-cancel"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
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
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditLeadDialogOpen} onOpenChange={setIsEditLeadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Editar Lead" : "Edit Lead"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Modifique la información del lead."
                : "Modify the lead information."}
            </DialogDescription>
          </DialogHeader>
          <Form {...editLeadForm}>
            <form onSubmit={editLeadForm.handleSubmit((data) => selectedLead && updateLeadMutation.mutate({ id: selectedLead.id, data }))} className="space-y-4">
              {selectedLead && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <strong>{language === "es" ? "Tipo de Registro: " : "Registration Type: "}</strong>
                  {selectedLead.registrationType === "broker" ? "Broker" : (language === "es" ? "Vendedor" : "Seller")}
                </div>
              )}

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
                          <Input {...field} value={field.value || ""} data-testid="input-edit-lead-phone" />
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
                        <FormLabel>{language === "es" ? "Email" : "Email"}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="email" data-testid="input-edit-lead-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

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
                        <Input {...field} value={field.value || ""} data-testid="input-edit-lead-source" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editLeadForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Notas" : "Notes"}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="input-edit-lead-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditLeadDialogOpen(false)}
                  data-testid="button-edit-lead-cancel"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button type="submit" disabled={updateLeadMutation.isPending} data-testid="button-edit-lead-submit">
                  {updateLeadMutation.isPending 
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (language === "es" ? "Guardar Cambios" : "Save Changes")}
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
