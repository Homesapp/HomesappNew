import { useState, useEffect, useLayoutEffect, useMemo, lazy, Suspense, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus, AlertCircle, AlertTriangle, Home, Edit, Trash2, Search, Filter, CheckCircle2, XCircle, DoorOpen, DoorClosed, Key, Power, PowerOff, ChevronDown, ChevronUp, LayoutGrid, Table as TableIcon, ArrowUpDown, FileSpreadsheet, Target, UserCheck, Clock, Phone, Mail, MapPin, Calendar, Globe, Clock4, MoreHorizontal, Eye } from "lucide-react";
import { logError, getErrorMessage } from "@/lib/errorHandling";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableLoading } from "@/components/ui/table-loading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobile } from "@/hooks/use-mobile";
import { useDebounce } from "@/hooks/useDebounce";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalCondominium, ExternalUnit, ExternalRentalContract, ExternalPaymentSchedule } from "@shared/schema";
import { insertExternalCondominiumSchema, insertExternalUnitSchema, externalUnitFormSchema } from "@shared/schema";
import { z } from "zod";
import { floorOptions, formatFloor } from "@/lib/unitHelpers";
import ExternalGoogleSheetsImportDialog from "@/components/ExternalGoogleSheetsImportDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type CondominiumFormData = z.infer<typeof insertExternalCondominiumSchema>;
type UnitFormData = z.infer<typeof insertExternalUnitSchema>;

export default function ExternalCondominiums() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const isMobile = useMobile();
  const [showUnifiedDialog, setShowUnifiedDialog] = useState(false);
  const [creationType, setCreationType] = useState<'condominium' | 'unit' | null>(null);
  const [showDeleteCondoDialog, setShowDeleteCondoDialog] = useState(false);
  const [editingCondo, setEditingCondo] = useState<ExternalCondominium | null>(null);
  const [editingUnit, setEditingUnit] = useState<ExternalUnit | null>(null);
  const [deletingCondo, setDeletingCondo] = useState<ExternalCondominium | null>(null);
  const [selectedCondoId, setSelectedCondoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"condominiums" | "units" | "recruitment">("condominiums");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [manualViewModeOverride, setManualViewModeOverride] = useState(false);
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  
  // For creating condominium with multiple units
  const [tempUnits, setTempUnits] = useState<Array<{ unitNumber: string; propertyType?: string; floor?: string; bedrooms?: number; bathrooms?: number; squareMeters?: number }>>([]);
  
  // For adding multiple units to existing condominium
  const [showAddUnitsDialog, setShowAddUnitsDialog] = useState(false);
  const [selectedCondoForAddUnits, setSelectedCondoForAddUnits] = useState<ExternalCondominium | null>(null);
  const [addUnitsTemp, setAddUnitsTemp] = useState<Array<{ unitNumber: string; propertyType?: string; floor?: string; bedrooms?: number; bathrooms?: number; squareMeters?: number }>>([{ unitNumber: '' }]);
  
  // Legacy states for backwards compatibility with edit mode
  const [showCondoDialog, setShowCondoDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  
  // Unit filters state
  const [unitSearchText, setUnitSearchText] = useState("");
  const debouncedUnitSearchText = useDebounce(unitSearchText, 400);
  const [selectedCondoFilter, setSelectedCondoFilter] = useState<string>("all");
  const [rentalStatusFilter, setRentalStatusFilter] = useState<string>("all");
  const [unitStatusFilter, setUnitStatusFilter] = useState<string>("all"); // active, suspended, all
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Condominium filters state
  const [condoSearchText, setCondoSearchText] = useState("");
  const debouncedCondoSearchText = useDebounce(condoSearchText, 400);
  const [condoFiltersExpanded, setCondoFiltersExpanded] = useState(false);
  const [condoZoneFilter, setCondoZoneFilter] = useState<string>("all");
  
  // Unit zone and property type filters
  const [unitZoneFilter, setUnitZoneFilter] = useState<string>("all");
  const [unitPropertyTypeFilter, setUnitPropertyTypeFilter] = useState<string>("all");
  
  // Condominium pagination state (default to 10 for table view)
  const [condoCurrentPage, setCondoCurrentPage] = useState(1);
  const [condoItemsPerPage, setCondoItemsPerPage] = useState(10); // Default: table mode
  const [condoPageTransition, setCondoPageTransition] = useState(false);
  
  // Condominiums table sorting
  const [condosSortColumn, setCondosSortColumn] = useState<string>("");
  const [condosSortDirection, setCondosSortDirection] = useState<"asc" | "desc">("asc");
  
  // Unit carousel indices (for showing 2 units at a time per condo)
  const [unitCarouselIndices, setUnitCarouselIndices] = useState<Record<string, number>>({});
  
  // Units table pagination & sorting
  const [unitsPage, setUnitsPage] = useState(1);
  const [unitsPerPage, setUnitsPerPage] = useState(10);
  const [unitsPageTransition, setUnitsPageTransition] = useState(false);
  const [unitsSortColumn, setUnitsSortColumn] = useState<string>("");
  const [unitsSortDirection, setUnitsSortDirection] = useState<"asc" | "desc">("asc");


  // Auto-switch view mode on genuine breakpoint transitions (only if no manual override)
  useEffect(() => {
    // Only act on actual breakpoint transitions (not every isMobile change)
    if (isMobile !== prevIsMobile) {
      setPrevIsMobile(isMobile);
      
      if (!manualViewModeOverride) {
        const preferredMode = isMobile ? "cards" : "table";
        setViewMode(preferredMode);
        setCondoItemsPerPage(preferredMode === "cards" ? 9 : 10);
      }
    }
  }, [isMobile, prevIsMobile, manualViewModeOverride]);

  // Reset units page to 1 when ONLY search/filter criteria change (not when page changes)
  const prevUnitSearchText = useRef(unitSearchText);
  const prevSelectedCondoFilter = useRef(selectedCondoFilter);
  const prevRentalStatusFilter = useRef(rentalStatusFilter);
  const prevUnitStatusFilter = useRef(unitStatusFilter);
  
  useEffect(() => {
    // Only reset if actual filter values changed, not on every render
    if (prevUnitSearchText.current !== unitSearchText ||
        prevSelectedCondoFilter.current !== selectedCondoFilter ||
        prevRentalStatusFilter.current !== rentalStatusFilter ||
        prevUnitStatusFilter.current !== unitStatusFilter) {
      setUnitsPage(1);
      prevUnitSearchText.current = unitSearchText;
      prevSelectedCondoFilter.current = selectedCondoFilter;
      prevRentalStatusFilter.current = rentalStatusFilter;
      prevUnitStatusFilter.current = unitStatusFilter;
    }
  }, [unitSearchText, selectedCondoFilter, rentalStatusFilter, unitStatusFilter]);

  // Backend-paginated condominiums data
  const { data: condominiumsResponse, isLoading: condosLoading, isFetching: condosFetching, isError: condosError, error: condosErrorMsg } = useQuery<{
    data: ExternalCondominium[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }>({
    queryKey: ['/api/external-condominiums', debouncedCondoSearchText, condosSortColumn, condosSortDirection, condoItemsPerPage, condoCurrentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedCondoSearchText) params.append('search', debouncedCondoSearchText);
      if (condosSortColumn) params.append('sortField', condosSortColumn);
      if (condosSortDirection) params.append('sortOrder', condosSortDirection);
      params.append('limit', condoItemsPerPage.toString());
      params.append('offset', ((condoCurrentPage - 1) * condoItemsPerPage).toString());
      
      const response = await fetch(`/api/external-condominiums?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch condominiums');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes in cache
    keepPreviousData: true, // Keep previous data while fetching new data for smooth UX
  });
  
  const condominiums = condominiumsResponse?.data || [];
  const condoTotalPages = Math.max(1, Math.ceil((condominiumsResponse?.total || 0) / condoItemsPerPage));

  // Lightweight condominiums lookup (only id+name for units table and filters)
  const { data: allCondominiums, isLoading: allCondominiumsLoading } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['/api/external-condominiums-for-filters'],
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });

  // Zones configuration for filters
  const { data: zones, isLoading: zonesLoading } = useQuery<{ id: string; name: string; isActive: boolean }[]>({
    queryKey: ['/api/external/config/zones'],
    staleTime: 30 * 60 * 1000,
  });

  // Property types configuration for filters
  const { data: propertyTypes, isLoading: propertyTypesLoading } = useQuery<{ id: string; name: string; isActive: boolean }[]>({
    queryKey: ['/api/external/config/property-types'],
    staleTime: 30 * 60 * 1000,
  });

  // Units with full backend pagination - data, filtering, sorting all handled by server
  const { data: unitsResponse, isLoading: unitsLoading, isFetching: unitsFetching } = useQuery<{ data: ExternalUnit[], total: number }>({
    queryKey: ['/api/external-units', unitsPage, unitsPerPage, debouncedUnitSearchText, selectedCondoFilter, unitStatusFilter, unitZoneFilter, unitPropertyTypeFilter, unitsSortColumn, unitsSortDirection],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', unitsPerPage.toString());
      params.append('offset', ((unitsPage - 1) * unitsPerPage).toString());
      if (debouncedUnitSearchText) params.append('search', debouncedUnitSearchText);
      if (selectedCondoFilter !== 'all') params.append('condominiumId', selectedCondoFilter);
      if (unitStatusFilter !== 'all') params.append('isActive', unitStatusFilter === 'active' ? 'true' : 'false');
      if (unitZoneFilter !== 'all') params.append('zone', unitZoneFilter);
      if (unitPropertyTypeFilter !== 'all') params.append('propertyType', unitPropertyTypeFilter);
      if (unitsSortColumn) {
        params.append('sortField', unitsSortColumn);
        params.append('sortOrder', unitsSortDirection);
      }
      const response = await fetch(`/api/external-units?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch units');
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    keepPreviousData: true,
  });
  const units = unitsResponse?.data || [];
  const unitsTotalFromBackend = unitsResponse?.total || 0;

  // Dedicated query for units of the selected condominium (loads ALL units without pagination)
  const { data: selectedCondoUnits, isLoading: selectedCondoUnitsLoading } = useQuery<ExternalUnit[]>({
    queryKey: ['/api/external-units/by-condominium', selectedCondoId],
    queryFn: async () => {
      const response = await fetch(`/api/external-units/by-condominium/${selectedCondoId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch units for condominium');
      return response.json();
    },
    enabled: !!selectedCondoId, // Only fetch when a condominium is selected
    staleTime: 2 * 60 * 1000,
  });

  // Clear page transition when data loads
  useEffect(() => {
    if (!condosFetching && condoPageTransition) {
      setCondoPageTransition(false);
    }
  }, [condosFetching, condoPageTransition]);

  useEffect(() => {
    if (!unitsFetching && unitsPageTransition) {
      setUnitsPageTransition(false);
    }
  }, [unitsFetching, unitsPageTransition]);

  // Frequently changing data: rental contracts
  const contractsQuery = useQuery<ExternalRentalContract[]>({
    queryKey: ['/api/external-rental-contracts'],
    staleTime: 2 * 60 * 1000, // 2 minutes - contracts change occasionally
    cacheTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });
  const { data: rawContracts, isLoading: contractsLoading, isError: contractsError, refetch: refetchContracts } = contractsQuery;

  // Normalize contracts - unwrap nested structure if present
  // Normalize contracts to handle both flat and nested structures
  const rentalContracts = (rawContracts ?? []).map((c: any) => {
    if ('contract' in c && c.contract) {
      // Merge top-level and nested contract properties
      return { ...c, ...c.contract };
    }
    return c;
  });

  // Frequently changing data: unit services and payment schedules
  const { data: allUnitServices } = useQuery<Record<string, ExternalPaymentSchedule[]>>({
    queryKey: ['/api/external-units/all-services'],
    queryFn: async () => {
      if (!units || units.length === 0) return {};
      
      // Fetch services for all units in parallel
      const servicesPromises = units.map(async (unit) => {
        try {
          const response = await fetch(`/api/external-units/${unit.id}/services`, { credentials: 'include' });
          if (!response.ok) return { unitId: unit.id, services: [] };
          const services = await response.json();
          return { unitId: unit.id, services };
        } catch (error) {
          return { unitId: unit.id, services: [] };
        }
      });

      const results = await Promise.all(servicesPromises);
      
      // Convert to map
      const servicesMap: Record<string, ExternalPaymentSchedule[]> = {};
      results.forEach(({ unitId, services }) => {
        servicesMap[unitId] = services;
      });
      
      return servicesMap;
    },
    enabled: !!units && units.length > 0,
  });

  // Helper to get publication status for a unit based on its actual fields
  const getPublicationStatus = (unit: ExternalUnitWithCondominium & { publishToMain?: boolean; publishStatus?: string }): 'approved' | 'pending' | 'rejected' | 'not_requested' => {
    if (!unit.publishToMain) return 'not_requested';
    if (unit.publishStatus === 'approved') return 'approved';
    if (unit.publishStatus === 'pending') return 'pending';
    if (unit.publishStatus === 'rejected') return 'rejected';
    return 'not_requested';
  };

  const condoForm = useForm<CondominiumFormData>({
    resolver: zodResolver(insertExternalCondominiumSchema),
    defaultValues: {
      name: "",
      address: "",
      zone: "",
      description: "",
      totalUnits: undefined,
    },
  });

  const unitForm = useForm<UnitFormData>({
    resolver: zodResolver(insertExternalUnitSchema),
    defaultValues: {
      condominiumId: undefined,
      unitNumber: "",
      propertyType: undefined,
      floor: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      squareMeters: undefined,
      photosDriveLink: "",
    },
  });

  const createCondoMutation = useMutation({
    mutationFn: async (data: CondominiumFormData) => {
      return await apiRequest('POST', '/api/external-condominiums', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-condominiums'] });
      setShowCondoDialog(false);
      condoForm.reset();
      toast({
        title: language === "es" ? "Condominio creado" : "Condominium created",
        description: language === "es" ? "El condominio se creó exitosamente" : "The condominium was created successfully",
      });
    },
    onError: (error: unknown) => {
      logError("ExternalCondominiums.createCondoMutation", error);
      toast({
        title: language === "es" ? "Error al crear condominio" : "Error creating condominium",
        description: getErrorMessage(error, language),
        variant: "destructive",
      });
    },
  });

  const updateCondoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CondominiumFormData }) => {
      return await apiRequest('PATCH', `/api/external-condominiums/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-condominiums'] });
      setShowCondoDialog(false);
      setEditingCondo(null);
      condoForm.reset();
      toast({
        title: language === "es" ? "Condominio actualizado" : "Condominium updated",
        description: language === "es" ? "El condominio se actualizó exitosamente" : "The condominium was updated successfully",
      });
    },
    onError: (error: unknown) => {
      logError("ExternalCondominiums.updateCondoMutation", error);
      toast({
        title: language === "es" ? "Error al actualizar condominio" : "Error updating condominium",
        description: getErrorMessage(error, language),
        variant: "destructive",
      });
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: async (data: UnitFormData) => {
      return await apiRequest('POST', '/api/external-units', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-units'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external-condominiums'] });
      setShowUnitDialog(false);
      unitForm.reset();
      toast({
        title: language === "es" ? "Unidad creada" : "Unit created",
        description: language === "es" ? "La unidad se creó exitosamente" : "The unit was created successfully",
      });
    },
    onError: (error: unknown) => {
      logError("ExternalCondominiums.createUnitMutation", error);
      toast({
        title: language === "es" ? "Error al crear unidad" : "Error creating unit",
        description: getErrorMessage(error, language),
        variant: "destructive",
      });
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UnitFormData }) => {
      return await apiRequest('PATCH', `/api/external-units/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-units'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external-condominiums'] });
      setShowUnitDialog(false);
      setEditingUnit(null);
      unitForm.reset();
      toast({
        title: language === "es" ? "Unidad actualizada" : "Unit updated",
        description: language === "es" ? "La unidad se actualizó exitosamente" : "The unit was updated successfully",
      });
    },
    onError: (error: unknown) => {
      logError("ExternalCondominiums.updateUnitMutation", error);
      toast({
        title: language === "es" ? "Error al actualizar unidad" : "Error updating unit",
        description: getErrorMessage(error, language),
        variant: "destructive",
      });
    },
  });

  const toggleUnitStatusMutation = useMutation({
    mutationFn: async (unitId: string) => {
      return await apiRequest('PATCH', `/api/external-units/${unitId}/toggle-status`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-units'] });
      toast({
        title: language === "es" ? "Estado actualizado" : "Status updated",
        description: language === "es" ? "El estado de la unidad se actualizó exitosamente" : "The unit status was updated successfully",
      });
    },
    onError: (error: unknown) => {
      logError("ExternalCondominiums.toggleUnitStatusMutation", error);
      toast({
        title: language === "es" ? "Error al cambiar estado" : "Error changing status",
        description: getErrorMessage(error, language),
        variant: "destructive",
      });
    },
  });

  const deleteCondoMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/external-condominiums/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-condominiums'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external-units'] });
      setShowDeleteCondoDialog(false);
      setDeletingCondo(null);
      toast({
        title: language === "es" ? "Condominio eliminado" : "Condominium deleted",
        description: language === "es" ? "El condominio se eliminó exitosamente" : "The condominium was deleted successfully",
      });
    },
    onError: (error: unknown) => {
      logError("ExternalCondominiums.deleteCondoMutation", error);
      setShowDeleteCondoDialog(false);
      toast({
        title: language === "es" ? "Error al eliminar condominio" : "Error deleting condominium",
        description: getErrorMessage(error, language),
        variant: "destructive",
      });
    },
  });

  const handleOpenUnifiedDialog = () => {
    setCreationType(null);
    setTempUnits([]);
    condoForm.reset({
      name: "",
      address: "",
      zone: "",
      description: "",
      totalUnits: undefined,
    });
    unitForm.reset({
      condominiumId: undefined,
      unitNumber: "",
      propertyType: undefined,
      floor: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      squareMeters: undefined,
      photosDriveLink: "",
    });
    setShowUnifiedDialog(true);
  };

  const handleAddCondo = () => {
    setEditingCondo(null);
    condoForm.reset({
      name: "",
      address: "",
      zone: "",
      description: "",
      totalUnits: undefined,
    });
    setShowCondoDialog(true);
  };

  const handleEditCondo = (condo: ExternalCondominium) => {
    setEditingCondo(condo);
    condoForm.reset({
      name: condo.name,
      address: condo.address || "",
      zone: condo.zone || "",
      description: condo.description || "",
      totalUnits: condo.totalUnits || undefined,
    });
    setShowCondoDialog(true);
  };

  const handleSubmitCondo = (data: CondominiumFormData) => {
    if (editingCondo) {
      updateCondoMutation.mutate({ id: editingCondo.id, data });
    } else {
      createCondoMutation.mutate(data);
    }
  };

  const handleAddUnit = (condoId?: string) => {
    setEditingUnit(null);
    unitForm.reset({
      condominiumId: condoId || undefined,
      unitNumber: "",
      propertyType: undefined,
      floor: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      squareMeters: undefined,
      photosDriveLink: "",
    });
    setShowUnitDialog(true);
  };

  const handleEditUnit = (unit: ExternalUnit) => {
    setEditingUnit(unit);
    unitForm.reset({
      condominiumId: unit.condominiumId,
      unitNumber: unit.unitNumber,
      propertyType: unit.propertyType || undefined,
      floor: unit.floor || undefined,
      bedrooms: unit.bedrooms || undefined,
      bathrooms: unit.bathrooms || undefined,
      squareMeters: unit.squareMeters || undefined,
      photosDriveLink: unit.photosDriveLink || "",
    });
    setShowUnitDialog(true);
  };

  const handleSubmitUnit = (data: UnitFormData) => {
    if (editingUnit) {
      updateUnitMutation.mutate({ id: editingUnit.id, data });
    } else {
      createUnitMutation.mutate(data);
    }
  };

  const handleAddTempUnit = () => {
    setTempUnits([...tempUnits, { unitNumber: "", propertyType: undefined, floor: undefined, bedrooms: undefined, bathrooms: undefined, squareMeters: undefined }]);
  };

  const handleRemoveTempUnit = (index: number) => {
    setTempUnits(tempUnits.filter((_, i) => i !== index));
  };

  const handleUpdateTempUnit = (index: number, field: string, value: any) => {
    const updated = [...tempUnits];
    updated[index] = { ...updated[index], [field]: value };
    setTempUnits(updated);
  };

  const handleUnifiedSubmit = async (data: any) => {
    if (creationType === 'condominium') {
      // Use atomic creation endpoint that creates condominium and units in a transaction
      try {
        const validUnits = tempUnits.filter(unit => unit.unitNumber.trim() !== '');
        
        // Parse and validate units with externalUnitFormSchema to convert strings to numbers
        const parsedUnits = validUnits.map(unit => {
          try {
            return externalUnitFormSchema.parse(unit);
          } catch (error: any) {
            throw new Error(`Invalid unit data: ${error.message}`);
          }
        });
        
        const payload = {
          condominium: data,
          units: parsedUnits
        };
        
        const result = await apiRequest('POST', '/api/external-condominiums/with-units', payload);
        
        queryClient.invalidateQueries({ queryKey: ['/api/external-condominiums'] });
        queryClient.invalidateQueries({ queryKey: ['/api/external-units'] });
        
        setShowUnifiedDialog(false);
        setCreationType(null);
        setTempUnits([]);
        condoForm.reset();
        
        toast({
          title: language === "es" ? "Condominio creado" : "Condominium created",
          description: parsedUnits.length > 0 
            ? (language === "es" ? `Condominio creado con ${parsedUnits.length} unidades` : `Condominium created with ${parsedUnits.length} units`)
            : (language === "es" ? "El condominio se creó exitosamente" : "The condominium was created successfully"),
        });
      } catch (error: any) {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: error.message || (language === "es" ? "No se pudo crear el condominio" : "Failed to create condominium"),
          variant: "destructive",
        });
      }
    } else if (creationType === 'unit') {
      // Add multiple units to existing condominium
      try {
        if (!data.condominiumId) {
          toast({
            title: language === "es" ? "Error" : "Error",
            description: language === "es" ? "Debes seleccionar un condominio" : "You must select a condominium",
            variant: "destructive",
          });
          return;
        }

        const validUnits = tempUnits.filter(unit => unit.unitNumber.trim() !== '');
        
        if (validUnits.length === 0) {
          toast({
            title: language === "es" ? "Error" : "Error",
            description: language === "es" ? "Debes agregar al menos una unidad" : "You must add at least one unit",
            variant: "destructive",
          });
          return;
        }
        
        // Parse and validate units with externalUnitFormSchema to convert strings to numbers
        const parsedUnits = validUnits.map(unit => {
          try {
            return externalUnitFormSchema.parse(unit);
          } catch (error: any) {
            throw new Error(`Invalid unit data: ${error.message}`);
          }
        });
        
        const payload = {
          units: parsedUnits
        };
        
        await apiRequest('POST', `/api/external-condominiums/${data.condominiumId}/units/bulk`, payload);
        
        queryClient.invalidateQueries({ queryKey: ['/api/external-units'] });
        
        setShowUnifiedDialog(false);
        setCreationType(null);
        setTempUnits([]);
        unitForm.reset();
        
        toast({
          title: language === "es" ? "Unidades creadas" : "Units created",
          description: language === "es" ? `${parsedUnits.length} unidades agregadas exitosamente` : `${parsedUnits.length} units added successfully`,
        });
      } catch (error: any) {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: error.message || (language === "es" ? "No se pudieron crear las unidades" : "Failed to create units"),
          variant: "destructive",
        });
      }
    }
  };

  // Functions for adding multiple units to existing condominium
  const handleAddUnitsToCondominium = (condo: ExternalCondominium) => {
    setSelectedCondoForAddUnits(condo);
    setAddUnitsTemp([{ unitNumber: '' }]);
    setShowAddUnitsDialog(true);
  };

  const handleAddMoreUnit = () => {
    setAddUnitsTemp([...addUnitsTemp, { unitNumber: "", propertyType: undefined, floor: undefined, bedrooms: undefined, bathrooms: undefined, squareMeters: undefined }]);
  };

  const handleRemoveAddUnit = (index: number) => {
    if (addUnitsTemp.length > 1) {
      setAddUnitsTemp(addUnitsTemp.filter((_, i) => i !== index));
    }
  };

  const handleUpdateAddUnit = (index: number, field: string, value: any) => {
    const updated = [...addUnitsTemp];
    updated[index] = { ...updated[index], [field]: value };
    setAddUnitsTemp(updated);
  };

  const handleSubmitAddUnits = async () => {
    if (!selectedCondoForAddUnits) return;
    
    try {
      const validUnits = addUnitsTemp.filter(unit => unit.unitNumber.trim() !== '');
      
      if (validUnits.length === 0) {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: language === "es" ? "Debes agregar al menos una unidad" : "You must add at least one unit",
          variant: "destructive",
        });
        return;
      }
      
      // Parse and validate units with externalUnitFormSchema to convert strings to numbers
      const parsedUnits = validUnits.map(unit => {
        try {
          return externalUnitFormSchema.parse(unit);
        } catch (error: any) {
          throw new Error(`Invalid unit data: ${error.message}`);
        }
      });
      
      const payload = {
        units: parsedUnits
      };
      
      await apiRequest('POST', `/api/external-condominiums/${selectedCondoForAddUnits.id}/units/bulk`, payload);
      
      queryClient.invalidateQueries({ queryKey: ['/api/external-units'] });
      
      setShowAddUnitsDialog(false);
      setSelectedCondoForAddUnits(null);
      setAddUnitsTemp([{ unitNumber: '' }]);
      
      toast({
        title: language === "es" ? "Unidades agregadas" : "Units added",
        description: language === "es" ? `${parsedUnits.length} unidades agregadas exitosamente` : `${parsedUnits.length} units added successfully`,
      });
    } catch (error: any) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudieron agregar las unidades" : "Failed to add units"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteCondo = (condo: ExternalCondominium) => {
    setDeletingCondo(condo);
    setShowDeleteCondoDialog(true);
  };

  const confirmDeleteCondo = () => {
    if (deletingCondo) {
      deleteCondoMutation.mutate(deletingCondo.id);
    }
  };

  const getUnitsForCondo = (condoId: string) => {
    // If viewing the selected condominium, use the dedicated query that loads all units
    if (condoId === selectedCondoId && selectedCondoUnits) {
      return selectedCondoUnits;
    }
    // Fallback to filtering from paginated units (for cards/table view)
    return units?.filter(u => u.condominiumId === condoId) || [];
  };

  const hasActiveRental = (unitId: string): boolean | undefined => {
    if (contractsLoading || contractsError) return undefined;
    if (!rentalContracts || rentalContracts.length === 0) return false;
    // rentalContracts is already normalized, so we can directly access properties
    return rentalContracts.some((contract: any) => 
      contract.unitId === unitId && contract.status === 'active'
    );
  };

  const clearCondoFilters = () => {
    setCondoSearchText("");
    setCondoZoneFilter("all");
    setCondoCurrentPage(1);
  };

  const clearUnitFilters = () => {
    setUnitSearchText("");
    setSelectedCondoFilter("all");
    setRentalStatusFilter("all");
    setUnitStatusFilter("all");
    setUnitZoneFilter("all");
    setUnitTypologyFilter("all");
    setUnitsPage(1);
  };

  const getActiveRentalContract = (unitId: string): any | null => {
    if (contractsLoading || contractsError || !rentalContracts) return null;
    // rentalContracts is already normalized, so we can directly access properties
    return rentalContracts.find((contract: any) => 
      contract.unitId === unitId && contract.status === 'active'
    ) || null;
  };

  const getCondominiumName = (condoId: string): string => {
    return allCondominiums?.find(c => c.id === condoId)?.name || '';
  };

  // Backend now handles search, condominiumId, isActive filters and sorting
  // Only rental-status filter is applied client-side (using currentContractId from backend)
  const filteredUnits = useMemo(() => {
    if (!units || units.length === 0) return [];
    if (rentalStatusFilter === "all") return units;
    
    return units.filter((unit: any) => {
      const hasRental = !!unit.currentContractId;
      if (rentalStatusFilter === "with-rental") return hasRental;
      if (rentalStatusFilter === "without-rental") return !hasRental;
      return true;
    });
  }, [units, rentalStatusFilter]);

  // Units are already sorted by backend - use directly for display
  const paginatedUnits = filteredUnits;
  
  // Calculate total pages from backend total (adjusted for client-side rental filter)
  const unitsTotalPages = Math.ceil(
    rentalStatusFilter === "all" 
      ? unitsTotalFromBackend / unitsPerPage 
      : filteredUnits.length / unitsPerPage
  );

  // Clamp unitsPage to valid range when total changes significantly
  // Use ref to track previous total to avoid unnecessary resets during loading states
  const prevUnitsTotalRef = useRef(unitsTotalFromBackend);
  useEffect(() => {
    // Skip if data is loading (total = 0 during transition) 
    if (unitsTotalFromBackend === 0 && prevUnitsTotalRef.current > 0) {
      // Data is loading, don't reset
      return;
    }
    prevUnitsTotalRef.current = unitsTotalFromBackend;
    
    if (unitsTotalFromBackend === 0) return;
    
    const maxPage = Math.ceil(unitsTotalFromBackend / unitsPerPage) || 1;
    if (unitsPage > maxPage) {
      setUnitsPage(maxPage);
    }
  }, [unitsTotalFromBackend, unitsPerPage, unitsPage]);

  const handleUnitsSort = (column: string) => {
    if (unitsSortColumn === column) {
      setUnitsSortDirection(unitsSortDirection === "asc" ? "desc" : "asc");
    } else {
      setUnitsSortColumn(column);
      setUnitsSortDirection("asc");
    }
  };

  const getUnitsSortIcon = (column: string) => {
    if (unitsSortColumn !== column) return null;
    return unitsSortDirection === "asc" ? "↑" : "↓";
  };

  const handleCondosSort = (column: string) => {
    if (condosSortColumn === column) {
      setCondosSortDirection(condosSortDirection === "asc" ? "desc" : "asc");
    } else {
      setCondosSortColumn(column);
      setCondosSortDirection("asc");
    }
  };

  const getCondosSortIcon = (column: string) => {
    if (condosSortColumn !== column) return null;
    return condosSortDirection === "asc" ? "↑" : "↓";
  };

  // Backend handles filtering, sorting, and pagination - use data directly
  const paginatedCondominiums = condominiums;

  // Clamp condo page only when truly needed (user is beyond last page)
  // Skip during loading transitions to prevent unnecessary resets
  const prevCondoTotalRef = useRef(condominiumsResponse?.total || 0);
  useEffect(() => {
    const currentTotal = condominiumsResponse?.total || 0;
    
    // Skip if data is loading (total = 0 during transition)
    if (currentTotal === 0 && prevCondoTotalRef.current > 0) {
      return;
    }
    prevCondoTotalRef.current = currentTotal;
    
    if (condoTotalPages > 0 && condoCurrentPage > condoTotalPages) {
      setCondoCurrentPage(condoTotalPages);
    }
  }, [condominiumsResponse?.total, condoTotalPages, condoCurrentPage]);

  // Reset condo page when search changes (using ref to avoid unnecessary resets)
  const prevCondoSearchText = useRef(debouncedCondoSearchText);
  useEffect(() => {
    if (prevCondoSearchText.current !== debouncedCondoSearchText) {
      setCondoCurrentPage(1);
      prevCondoSearchText.current = debouncedCondoSearchText;
    }
  }, [debouncedCondoSearchText]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Propiedades" : "Properties"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Gestiona condominios, unidades y reclutamiento de propiedades"
              : "Manage condominiums, units and property recruitment"}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <Button 
            variant="outline" 
            onClick={() => setShowImportDialog(true)} 
            data-testid="button-import-sheet"
            className="flex-1 sm:flex-none"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {language === "es" ? "Importar" : "Import"}
          </Button>
          <Button onClick={handleOpenUnifiedDialog} data-testid="button-add-unified" className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            {language === "es" ? "Agregar" : "Add"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value as "condominiums" | "units" | "recruitment");
        // Close filters when switching tabs
        if (value === "condominiums") {
          setFiltersExpanded(false);
        } else {
          setCondoFiltersExpanded(false);
        }
      }} className="w-full">
        <TabsList className="grid w-full sm:max-w-lg grid-cols-3 mb-4">
          <TabsTrigger value="condominiums" data-testid="tab-condominiums">
            <Building2 className="mr-2 h-4 w-4" />
            {language === "es" ? "Condominios" : "Condominiums"}
          </TabsTrigger>
          <TabsTrigger value="units" data-testid="tab-units">
            <Home className="mr-2 h-4 w-4" />
            {language === "es" ? "Unidades" : "Units"}
          </TabsTrigger>
          <TabsTrigger value="recruitment" data-testid="tab-recruitment">
            <Target className="mr-2 h-4 w-4" />
            {language === "es" ? "Reclutamiento" : "Recruitment"}
          </TabsTrigger>
        </TabsList>

        {!selectedCondoId && (
          activeTab === "condominiums" ? (
            <Card className="mb-[2px]">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={language === "es" ? "Buscar condominios..." : "Search condominiums..."}
                      value={condoSearchText}
                      onChange={(e) => setCondoSearchText(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-condos"
                    />
                  </div>

                  {/* Filter Button with Popover */}
                  <Popover open={condoFiltersExpanded} onOpenChange={setCondoFiltersExpanded}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="relative flex-shrink-0"
                        data-testid="button-toggle-condo-filters"
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="end">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">
                            {language === 'es' ? 'Filtrar por' : 'Filter by'}
                          </h4>

                          {/* Zona/Colonia Filter */}
                          <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">
                              {language === "es" ? "Zona / Colonia" : "Zone / Neighborhood"}
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                variant={condoZoneFilter === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCondoZoneFilter("all")}
                                data-testid="button-filter-condo-zone-all"
                              >
                                {language === "es" ? "Todas" : "All"}
                              </Button>
                              {zonesLoading ? (
                                <span className="text-sm text-muted-foreground">{language === "es" ? "Cargando..." : "Loading..."}</span>
                              ) : zones?.filter(z => z.isActive).map(zone => (
                                <Button
                                  key={zone.id}
                                  variant={condoZoneFilter === zone.name ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCondoZoneFilter(zone.name)}
                                  data-testid={`button-filter-condo-zone-${zone.id}`}
                                >
                                  {zone.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <Button variant="outline" className="w-full" onClick={clearCondoFilters}>
                          <XCircle className="mr-2 h-4 w-4" />
                          {language === "es" ? "Limpiar Filtros" : "Clear Filters"}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* View Toggle Buttons - Desktop Only */}
                  {!isMobile && (
                    <>
                      <Button
                        variant={viewMode === "cards" ? "default" : "outline"}
                        size="icon"
                        onClick={() => {
                          setViewMode("cards");
                          setManualViewModeOverride(false);
                        }}
                        className="flex-shrink-0"
                        data-testid="button-view-cards"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "table" ? "default" : "outline"}
                        size="icon"
                        onClick={() => {
                          setViewMode("table");
                          setManualViewModeOverride(true);
                        }}
                        className="flex-shrink-0"
                        data-testid="button-view-table"
                      >
                        <TableIcon className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-[2px]">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={language === "es" ? "Buscar unidades..." : "Search units..."}
                      value={unitSearchText}
                      onChange={(e) => setUnitSearchText(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-units"
                    />
                  </div>

                  {/* Filter Button with Popover */}
                  <Popover open={filtersExpanded} onOpenChange={setFiltersExpanded}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="relative flex-shrink-0"
                        data-testid="button-toggle-unit-filters"
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                  <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">
                          {language === 'es' ? 'Filtrar por' : 'Filter by'}
                        </h4>

                        {/* Condominio Filter */}
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">
                            {language === "es" ? "Condominio" : "Condominium"}
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant={selectedCondoFilter === "all" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedCondoFilter("all")}
                              disabled={condosLoading}
                              data-testid="button-filter-condominium-all"
                            >
                              {language === "es" ? "Todos" : "All"}
                            </Button>
                            {allCondominiumsLoading ? (
                              <span className="text-sm text-muted-foreground">{language === "es" ? "Cargando..." : "Loading..."}</span>
                            ) : allCondominiums?.map(condo => (
                              <Button
                                key={condo.id}
                                variant={selectedCondoFilter === condo.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCondoFilter(condo.id)}
                                data-testid={`button-filter-condominium-${condo.id}`}
                              >
                                {condo.name}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Estado de Unidad Filter */}
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">
                            {language === "es" ? "Estado de Unidad" : "Unit Status"}
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant={unitStatusFilter === "all" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setUnitStatusFilter("all")}
                              data-testid="button-filter-unit-status-all"
                            >
                              {language === "es" ? "Todas" : "All"}
                            </Button>
                            <Button
                              variant={unitStatusFilter === "active" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setUnitStatusFilter("active")}
                              data-testid="button-filter-unit-status-active"
                            >
                              {language === "es" ? "Activas" : "Active"}
                            </Button>
                            <Button
                              variant={unitStatusFilter === "suspended" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setUnitStatusFilter("suspended")}
                              data-testid="button-filter-unit-status-suspended"
                            >
                              {language === "es" ? "Suspendidas" : "Suspended"}
                            </Button>
                          </div>
                        </div>

                        {/* Zona/Colonia Filter */}
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">
                            {language === "es" ? "Zona / Colonia" : "Zone / Neighborhood"}
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant={unitZoneFilter === "all" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setUnitZoneFilter("all")}
                              data-testid="button-filter-unit-zone-all"
                            >
                              {language === "es" ? "Todas" : "All"}
                            </Button>
                            {zonesLoading ? (
                              <span className="text-sm text-muted-foreground">{language === "es" ? "Cargando..." : "Loading..."}</span>
                            ) : zones?.filter(z => z.isActive).map(zone => (
                              <Button
                                key={zone.id}
                                variant={unitZoneFilter === zone.name ? "default" : "outline"}
                                size="sm"
                                onClick={() => setUnitZoneFilter(zone.name)}
                                data-testid={`button-filter-unit-zone-${zone.id}`}
                              >
                                {zone.name}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Property Type Filter */}
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">
                            {language === "es" ? "Tipo de Propiedad" : "Property Type"}
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant={unitPropertyTypeFilter === "all" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setUnitPropertyTypeFilter("all")}
                              data-testid="button-filter-unit-property-type-all"
                            >
                              {language === "es" ? "Todas" : "All"}
                            </Button>
                            {propertyTypesLoading ? (
                              <span className="text-sm text-muted-foreground">{language === "es" ? "Cargando..." : "Loading..."}</span>
                            ) : propertyTypes?.filter(pt => pt.isActive).map(pt => (
                              <Button
                                key={pt.id}
                                variant={unitPropertyTypeFilter === pt.name ? "default" : "outline"}
                                size="sm"
                                onClick={() => setUnitPropertyTypeFilter(pt.name)}
                                data-testid={`button-filter-unit-property-type-${pt.id}`}
                              >
                                {pt.name}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Estado de Renta Filter */}
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">
                            {language === "es" ? "Estado de Renta" : "Rental Status"}
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant={rentalStatusFilter === "all" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setRentalStatusFilter("all")}
                              disabled={contractsLoading || contractsError}
                              data-testid="button-filter-rental-status-all"
                            >
                              {language === "es" ? "Todas" : "All"}
                            </Button>
                            <Button
                              variant={rentalStatusFilter === "with-rental" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setRentalStatusFilter("with-rental")}
                              disabled={contractsLoading || contractsError}
                              data-testid="button-filter-rental-status-with"
                            >
                              {language === "es" ? "Con renta" : "With rental"}
                            </Button>
                            <Button
                              variant={rentalStatusFilter === "without-rental" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setRentalStatusFilter("without-rental")}
                              disabled={contractsLoading || contractsError}
                              data-testid="button-filter-rental-status-without"
                            >
                              {language === "es" ? "Sin renta" : "Without rental"}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" className="w-full" onClick={clearUnitFilters} data-testid="button-clear-filters">
                        <XCircle className="mr-2 h-4 w-4" />
                        {language === "es" ? "Limpiar Filtros" : "Clear Filters"}
                      </Button>
                    </div>
                </PopoverContent>
              </Popover>

                  {/* View Toggle Buttons - Desktop Only */}
                  {!isMobile && (
                    <>
                      <Button
                        variant={viewMode === "cards" ? "default" : "outline"}
                        size="icon"
                        onClick={() => {
                          setViewMode("cards");
                          setManualViewModeOverride(false);
                        }}
                        className="flex-shrink-0"
                        data-testid="button-view-cards"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "table" ? "default" : "outline"}
                        size="icon"
                        onClick={() => {
                          setViewMode("table");
                          setManualViewModeOverride(true);
                        }}
                        className="flex-shrink-0"
                        data-testid="button-view-table"
                      >
                        <TableIcon className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        )}
        
        <TabsContent value="condominiums" className="space-y-6">
          {condosError ? (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <div>
                    <p className="text-sm" data-testid="text-error-title">
                      {language === "es" ? "Error al cargar condominios" : "Error loading condominiums"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1" data-testid="text-error-message">
                      {condosErrorMsg instanceof Error ? condosErrorMsg.message : language === "es" ? "Ocurrió un error inesperado" : "An unexpected error occurred"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : condosLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : !condominiums || condominiums.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8" data-testid="div-empty-state">
                  <p className="text-muted-foreground">
                    {language === "es" 
                      ? "No hay condominios que coincidan con los filtros"
                      : "No condominiums match the filters"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6 mt-[2px]">
              {selectedCondoId ? (
                    // Detail view for selected condominium
                    (() => {
                      const selectedCondo = condominiums.find(c => c.id === selectedCondoId);
                      if (!selectedCondo) return null;
                      const condoUnits = getUnitsForCondo(selectedCondoId);
                      
                      return (
                  <div className="space-y-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => setSelectedCondoId(null)}
                      data-testid="button-back-to-condos"
                      className="mb-2"
                    >
                      ← {language === "es" ? "Volver a Condominios" : "Back to Condominiums"}
                    </Button>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-6 w-6" />
                            <span>{selectedCondo.name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCondo(selectedCondo)}
                            data-testid={`button-edit-selected-condo`}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {language === "es" ? "Editar" : "Edit"}
                          </Button>
                        </CardTitle>
                        <CardDescription>{selectedCondo.address}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">
                              {language === "es" ? "Total de unidades:" : "Total units:"}
                            </span>
                            <div className="text-2xl font-bold mt-1" data-testid="text-selected-total-units">
                              {selectedCondo.totalUnits || condoUnits.length}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">
                              {language === "es" ? "Unidades registradas:" : "Registered units:"}
                            </span>
                            <div className="text-2xl font-bold mt-1" data-testid="text-selected-registered-units">
                              {condoUnits.length}
                            </div>
                          </div>
                        </div>
                        {selectedCondo.description && (
                          <div>
                            <span className="text-sm text-muted-foreground">
                              {language === "es" ? "Descripción:" : "Description:"}
                            </span>
                            <p className="mt-1">{selectedCondo.description}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <h2 className="text-xl font-semibold">
                      {language === "es" ? "Unidades" : "Units"}
                    </h2>

                    {selectedCondoUnitsLoading ? (
                      <div className="flex justify-center py-8">
                        <p className="text-muted-foreground">
                          {language === "es" ? "Cargando unidades..." : "Loading units..."}
                        </p>
                      </div>
                    ) : condoUnits.length > 0 ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        {condoUnits.map((unit) => {
                          const activeContract = getActiveRentalContract(unit.id);
                          const isRented = activeContract !== null;
                          
                          return (
                            <Card 
                              key={unit.id} 
                              data-testid={`card-unit-detail-${unit.id}`}
                              className="hover-elevate active-elevate-2 cursor-pointer"
                              onClick={() => navigate(`/external/units/${unit.id}`)}
                            >
                              <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 justify-between">
                                  <div className="flex items-center gap-2">
                                    <Home className="h-4 w-4" />
                                    <span>{language === "es" ? "Unidad" : "Unit"} {unit.unitNumber}</span>
                                  </div>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditUnit(unit);
                                    }}
                                    data-testid={`button-edit-unit-detail-${unit.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {/* Rental Status */}
                                <div className="flex items-center justify-between pb-3 border-b">
                                  <span className="text-sm text-muted-foreground">{language === "es" ? "Estado:" : "Status:"}</span>
                                  {isRented ? (
                                    <div className="flex flex-col items-end gap-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {language === "es" ? "Rentada" : "Rented"}
                                      </Badge>
                                      {(() => {
                                        const endDate = activeContract?.endDate;
                                        if (endDate) {
                                          try {
                                            const date = new Date(endDate);
                                            if (!isNaN(date.getTime())) {
                                              return (
                                                <span className="text-xs text-muted-foreground">
                                                  {language === "es" ? "Hasta " : "Until "}
                                                  {format(date, "dd/MM/yyyy")}
                                                </span>
                                              );
                                            }
                                          } catch (e) {
                                            // Invalid date
                                          }
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                                      {language === "es" ? "Disponible" : "Available"}
                                    </Badge>
                                  )}
                                </div>

                                {/* Unit Details */}
                                <div className="space-y-2">
                                  {unit.propertyType && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">{language === "es" ? "Tipo:" : "Type:"}</span>
                                      <span className="font-medium" data-testid={`text-property-type-detail-${unit.id}`}>{unit.propertyType}</span>
                                    </div>
                                  )}
                                  {unit.floor && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">{language === "es" ? "Piso:" : "Floor:"}</span>
                                      <span className="font-medium" data-testid={`text-floor-detail-${unit.id}`}>{formatFloor(unit.floor, language)}</span>
                                    </div>
                                  )}
                                  {unit.bedrooms !== null && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">{language === "es" ? "Recámaras:" : "Bedrooms:"}</span>
                                      <span className="font-medium" data-testid={`text-bedrooms-detail-${unit.id}`}>{unit.bedrooms}</span>
                                    </div>
                                  )}
                                  {unit.bathrooms !== null && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">{language === "es" ? "Baños:" : "Bathrooms:"}</span>
                                      <span className="font-medium" data-testid={`text-bathrooms-detail-${unit.id}`}>{unit.bathrooms}</span>
                                    </div>
                                  )}
                                  {unit.area !== null && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">{language === "es" ? "m²:" : "sqm:"}</span>
                                      <span className="font-medium" data-testid={`text-sqm-detail-${unit.id}`}>{unit.area}</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <Card data-testid="card-no-units-in-condo">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Home className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-lg font-medium">
                            {language === "es" ? "No hay unidades registradas" : "No units registered"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {language === "es" 
                              ? "Agrega la primera unidad para este condominio"
                              : "Add the first unit for this condominium"}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })()
            ) : (
              <>
                {/* Pagination Controls - shared by both cards and table view */}
                <ExternalPaginationControls
                  currentPage={condoCurrentPage}
                  totalPages={condoTotalPages}
                  itemsPerPage={condoItemsPerPage}
                  onPageChange={(page) => {
                    setCondoPageTransition(true);
                    setCondoCurrentPage(page);
                  }}
                  onItemsPerPageChange={(items) => {
                    setCondoPageTransition(true);
                    setCondoItemsPerPage(items);
                    setCondoCurrentPage(1);
                  }}
                  language={language}
                  testIdPrefix="condos"
                />

                {viewMode === "cards" ? (
                  <div className="grid gap-6 md:grid-cols-2 mt-[2px]">
                  {paginatedCondominiums.map((condo) => {
                  const condoUnits = getUnitsForCondo(condo.id);
                  const activeUnits = condoUnits.filter(u => u.isActive);
                  const suspendedUnits = condoUnits.filter(u => !u.isActive);
                  const rentedUnits = condoUnits.filter(u => hasActiveRental(u.id) === true);
                  const availableUnits = condoUnits.filter(u => hasActiveRental(u.id) === false && u.isActive);
                  
                  return (
                    <Card 
                      key={condo.id} 
                      data-testid={`card-condominium-${condo.id}`} 
                      className="hover-elevate active-elevate-2 cursor-pointer"
                      onClick={() => setSelectedCondoId(condo.id)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>{condo.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddUnitsToCondominium(condo);
                              }}
                              data-testid={`button-add-units-condo-${condo.id}`}
                              title={language === "es" ? "Agregar múltiples unidades" : "Add multiple units"}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCondo(condo);
                              }}
                              data-testid={`button-edit-condo-${condo.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCondo(condo);
                              }}
                              data-testid={`button-delete-condo-${condo.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardTitle>
                        <CardDescription>
                          {condo.address}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Units Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 pb-3 border-b">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Home className="h-3.5 w-3.5" />
                              <span>{language === "es" ? "Total" : "Total"}</span>
                            </div>
                            <div className="text-2xl font-bold" data-testid={`stat-total-${condo.id}`}>
                              {condoUnits.length}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <DoorClosed className="h-3.5 w-3.5" />
                              <span>{language === "es" ? "Rentadas" : "Rented"}</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid={`stat-rented-${condo.id}`}>
                              {rentedUnits.length}
                            </div>
                          </div>
                        </div>

                        {/* Status Stats */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center justify-between p-2 rounded-md bg-green-50 dark:bg-green-950/20">
                            <div className="flex items-center gap-1.5">
                              <Power className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                              <span className="text-xs text-green-700 dark:text-green-300">
                                {language === "es" ? "Activas" : "Active"}
                              </span>
                            </div>
                            <Badge variant="outline" className="bg-white dark:bg-gray-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" data-testid={`badge-active-${condo.id}`}>
                              {activeUnits.length}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-900/50">
                            <div className="flex items-center gap-1.5">
                              <PowerOff className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                {language === "es" ? "Inactivas" : "Inactive"}
                              </span>
                            </div>
                            <Badge variant="outline" className="bg-white dark:bg-gray-950" data-testid={`badge-suspended-${condo.id}`}>
                              {suspendedUnits.length}
                            </Badge>
                          </div>
                        </div>

                        {/* Availability */}
                        <div className="flex items-center justify-between p-2 rounded-md bg-blue-50 dark:bg-blue-950/20">
                          <div className="flex items-center gap-1.5">
                            <DoorOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs text-blue-700 dark:text-blue-300">
                              {language === "es" ? "Disponibles" : "Available"}
                            </span>
                          </div>
                          <Badge variant="outline" className="bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" data-testid={`badge-available-${condo.id}`}>
                            {availableUnits.length}
                          </Badge>
                        </div>

                        {/* Units Carousel */}
                        {(() => {
                          if (condoUnits.length === 0) return null;
                          
                          // Sort units: available first, then rented; tie-break by unit number
                          const sortedUnits = [...condoUnits].sort((a, b) => {
                            const aRented = getActiveRentalContract(a.id) !== null;
                            const bRented = getActiveRentalContract(b.id) !== null;
                            
                            if (aRented !== bRented) {
                              return aRented ? 1 : -1; // Available first
                            }
                            
                            // Tie-break by unit number
                            return a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true });
                          });
                          
                          const unitsPerView = 2;
                          const currentIndex = unitCarouselIndices[condo.id] || 0;
                          const totalUnits = sortedUnits.length;
                          const visibleUnits = sortedUnits.slice(currentIndex, currentIndex + unitsPerView);
                          const canScrollUp = currentIndex > 0;
                          const canScrollDown = currentIndex + unitsPerView < totalUnits;
                          
                          const handleScrollUp = () => {
                            setUnitCarouselIndices(prev => ({
                              ...prev,
                              [condo.id]: Math.max(0, currentIndex - 1)
                            }));
                          };
                          
                          const handleScrollDown = () => {
                            setUnitCarouselIndices(prev => ({
                              ...prev,
                              [condo.id]: Math.min(totalUnits - unitsPerView, currentIndex + 1)
                            }));
                          };
                          
                          return (
                            <div className="pt-3 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium">{language === "es" ? "Unidades" : "Units"}</h4>
                                {totalUnits > unitsPerView && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleScrollUp();
                                      }}
                                      disabled={!canScrollUp}
                                      data-testid={`button-unit-prev-${condo.id}`}
                                    >
                                      <ChevronUp className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                      {currentIndex + 1}-{Math.min(currentIndex + unitsPerView, totalUnits)} / {totalUnits}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleScrollDown();
                                      }}
                                      disabled={!canScrollDown}
                                      data-testid={`button-unit-next-${condo.id}`}
                                    >
                                      <ChevronDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2 min-h-[120px]">
                                {visibleUnits.map((unit) => {
                                  const activeContract = getActiveRentalContract(unit.id);
                                  const isRented = activeContract !== null;
                                  
                                  return (
                                    <div 
                                      key={unit.id} 
                                      className="flex items-center justify-between p-2 text-xs rounded-md bg-muted/50 hover:bg-muted cursor-pointer min-h-[56px]"
                                      data-testid={`unit-row-${unit.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/external/units/${unit.id}`);
                                      }}
                                    >
                                      <div className="flex-1 grid grid-cols-3 gap-2">
                                        <div>
                                          <span className="font-medium">{unit.unitNumber}</span>
                                          {unit.propertyType && (
                                            <span className="text-muted-foreground ml-1">
                                              ({unit.propertyType})
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-muted-foreground">
                                          {unit.floor ? formatFloor(unit.floor, language) : "-"}
                                        </div>
                                        <div>
                                          {isRented ? (
                                            <div className="flex flex-col">
                                              <Badge variant="secondary" className="text-xs w-fit">
                                                {language === "es" ? "Rentada" : "Rented"}
                                              </Badge>
                                              {(() => {
                                                const endDate = activeContract?.endDate;
                                                if (endDate) {
                                                  try {
                                                    const date = new Date(endDate);
                                                    if (!isNaN(date.getTime())) {
                                                      return (
                                                        <span className="text-muted-foreground text-[10px] mt-0.5">
                                                          {language === "es" ? "Hasta: " : "Until: "}
                                                          {format(date, "dd/MM/yy")}
                                                        </span>
                                                      );
                                                    }
                                                  } catch (e) {
                                                    // Invalid date, don't show anything
                                                  }
                                                }
                                                return null;
                                              })()}
                                            </div>
                                          ) : (
                                            <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                                              {language === "es" ? "Disponible" : "Available"}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {condo.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 pt-2 border-t">{condo.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                  })}
                </div>
                ) : (
                <Card className="border mt-[2px]">
                  <CardContent className="p-0">
                    <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="h-10 px-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => handleCondosSort('name')}
                        data-testid="th-condo-name"
                      >
                        <div className="flex items-center gap-1">
                          {language === "es" ? "Nombre" : "Name"}
                          <ArrowUpDown className="h-3 w-3" />
                          {getCondosSortIcon('name') && <span className="text-xs">{getCondosSortIcon('name')}</span>}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="h-10 px-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => handleCondosSort('address')}
                        data-testid="th-condo-address"
                      >
                        <div className="flex items-center gap-1">
                          {language === "es" ? "Dirección" : "Address"}
                          <ArrowUpDown className="h-3 w-3" />
                          {getCondosSortIcon('address') && <span className="text-xs">{getCondosSortIcon('address')}</span>}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="h-10 px-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => handleCondosSort('zone')}
                        data-testid="th-condo-zone"
                      >
                        <div className="flex items-center gap-1">
                          {language === "es" ? "Zona / Colonia" : "Zone"}
                          <ArrowUpDown className="h-3 w-3" />
                          {getCondosSortIcon('zone') && <span className="text-xs">{getCondosSortIcon('zone')}</span>}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="h-10 px-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => handleCondosSort('totalUnits')}
                        data-testid="th-condo-total-units"
                      >
                        <div className="flex items-center gap-1">
                          {language === "es" ? "Total Unidades" : "Total Units"}
                          <ArrowUpDown className="h-3 w-3" />
                          {getCondosSortIcon('totalUnits') && <span className="text-xs">{getCondosSortIcon('totalUnits')}</span>}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="h-10 px-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => handleCondosSort('activeUnits')}
                        data-testid="th-condo-active-units"
                      >
                        <div className="flex items-center gap-1">
                          {language === "es" ? "Unidades Activas" : "Active Units"}
                          <ArrowUpDown className="h-3 w-3" />
                          {getCondosSortIcon('activeUnits') && <span className="text-xs">{getCondosSortIcon('activeUnits')}</span>}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="h-10 px-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => handleCondosSort('rentedUnits')}
                        data-testid="th-condo-rented-units"
                      >
                        <div className="flex items-center gap-1">
                          {language === "es" ? "Unidades Rentadas" : "Rented Units"}
                          <ArrowUpDown className="h-3 w-3" />
                          {getCondosSortIcon('rentedUnits') && <span className="text-xs">{getCondosSortIcon('rentedUnits')}</span>}
                        </div>
                      </TableHead>
                      <TableHead className="h-10 px-3" data-testid="th-condo-actions">
                        {language === "es" ? "Acciones" : "Actions"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(condoPageTransition || condosFetching) && !condosLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-[300px] p-0">
                          <TableLoading minHeight="300px" />
                        </TableCell>
                      </TableRow>
                    ) : paginatedCondominiums.map((condo) => {
                      const condoUnits = getUnitsForCondo(condo.id);
                      const activeUnits = condoUnits.filter(u => u.isActive);
                      const rentedUnits = condoUnits.filter(u => hasActiveRental(u.id));
                      
                      return (
                        <TableRow 
                          key={condo.id}
                          className="cursor-pointer hover-elevate"
                          onClick={() => setSelectedCondoId(condo.id)}
                          data-testid={`row-condo-${condo.id}`}
                        >
                          <TableCell data-testid={`cell-name-${condo.id}`}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {condo.name}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`cell-address-${condo.id}`}>
                            {condo.address || '-'}
                          </TableCell>
                          <TableCell data-testid={`cell-zone-${condo.id}`}>
                            {condo.zone || '-'}
                          </TableCell>
                          <TableCell data-testid={`cell-total-${condo.id}`}>
                            {condo.totalUnits || 0}
                          </TableCell>
                          <TableCell data-testid={`cell-active-${condo.id}`}>
                            {activeUnits.length}
                          </TableCell>
                          <TableCell data-testid={`cell-rented-${condo.id}`}>
                            {rentedUnits.length}
                          </TableCell>
                          <TableCell data-testid={`cell-actions-${condo.id}`}>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddUnitsToCondominium(condo);
                                }}
                                data-testid={`button-add-units-table-${condo.id}`}
                                title={language === "es" ? "Agregar múltiples unidades" : "Add multiple units"}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCondo(condo);
                                }}
                                data-testid={`button-edit-table-${condo.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCondo(condo);
                                }}
                                data-testid={`button-delete-table-${condo.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                  </CardContent>
                </Card>
                )}
              </>
            )}
            </div>
        )}
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          {contractsError && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">
                      {language === "es" ? "Error al cargar contratos" : "Error loading contracts"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === "es" ? "No se puede determinar disponibilidad" : "Cannot determine availability"}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => refetchContracts()}
                  data-testid="button-retry-contracts"
                >
                  {language === "es" ? "Reintentar" : "Retry"}
                </Button>
              </CardContent>
            </Card>
          )}

          {unitsLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : filteredUnits.length > 0 ? (
            <div className="space-y-6 mt-[2px]">
              {viewMode === "cards" ? (
                <>
                  <ExternalPaginationControls
                    currentPage={unitsPage}
                    totalPages={unitsTotalPages}
                    itemsPerPage={unitsPerPage}
                    onPageChange={(page) => {
                      setUnitsPageTransition(true);
                      setUnitsPage(page);
                    }}
                    onItemsPerPageChange={(items) => {
                      setUnitsPageTransition(true);
                      setUnitsPerPage(items);
                      setUnitsPage(1);
                    }}
                    language={language}
                    testIdPrefix="units-cards"
                  />

                  <div className="grid gap-6 md:grid-cols-2 mt-[2px]">
                {paginatedUnits.map((unit) => {
                  const condo = allCondominiums?.find(c => c.id === unit.condominiumId);
                  const hasRental = hasActiveRental(unit.id);
                  const unitServices = allUnitServices?.[unit.id] || [];
                  
                  return (
                    <Card 
                      key={unit.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => navigate(`/external/units/${unit.id}`)}
                      data-testid={`card-unit-${unit.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-base">{unit.unitNumber}</CardTitle>
                          </div>
                          {unit.isActive ? (
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                              <Power className="h-3 w-3 mr-1" />
                              {language === "es" ? "Activa" : "Active"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">
                              <PowerOff className="h-3 w-3 mr-1" />
                              {language === "es" ? "Suspendida" : "Suspended"}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {condo?.name || '-'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">{language === "es" ? "Tipo:" : "Type:"}</span>
                            <div className="font-medium">{unit.propertyType || "-"}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{language === "es" ? "Piso:" : "Floor:"}</span>
                            <div className="font-medium">{formatFloor(unit.floor, language)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{language === "es" ? "Recámaras:" : "Beds:"}</span>
                            <div className="font-medium">{unit.bedrooms ?? '-'}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{language === "es" ? "Baños:" : "Baths:"}</span>
                            <div className="font-medium">{unit.bathrooms ?? '-'}</div>
                          </div>
                        </div>

                        {/* Price display */}
                        {unit.price && (
                          <div className="flex items-center justify-between py-2 border-t">
                            <span className="text-muted-foreground text-sm">{language === "es" ? "Precio Renta:" : "Rent Price:"}</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              ${Number(unit.price).toLocaleString(language === "es" ? "es-MX" : "en-US")} MXN
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex items-center justify-between gap-2 pt-2 ${!unit.price ? 'border-t' : ''}`}>
                          <div className="flex items-center gap-2">
                            {hasRental === undefined ? (
                              contractsLoading ? (
                                <Skeleton className="h-5 w-20" />
                              ) : (
                                <Badge variant="outline">
                                  {language === "es" ? "Desconocido" : "Unknown"}
                                </Badge>
                              )
                            ) : hasRental ? (
                              <Badge variant="default">
                                <DoorClosed className="h-3 w-3 mr-1" />
                                {language === "es" ? "Rentada" : "Rented"}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <DoorOpen className="h-3 w-3 mr-1" />
                                {language === "es" ? "Disponible" : "Available"}
                              </Badge>
                            )}
                          </div>
                          {unitServices.length > 0 && (
                            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                              <Key className="h-3 w-3 mr-1" />
                              {unitServices.length} {language === "es" ? "servicios" : "services"}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                  </div>
                </>
              ) : (
                <>
                {/* Units Pagination Controls */}
                {filteredUnits.length > 0 && (
                  <ExternalPaginationControls
                    currentPage={unitsPage}
                    totalPages={unitsTotalPages}
                    itemsPerPage={unitsPerPage}
                    onPageChange={(page) => {
                      setUnitsPageTransition(true);
                      setUnitsPage(page);
                    }}
                    onItemsPerPageChange={(items) => {
                      setUnitsPageTransition(true);
                      setUnitsPerPage(items);
                      setUnitsPage(1);
                    }}
                    language={language}
                    testIdPrefix="units"
                  />
                )}

                {/* Table view of units */}
                <Card className="border mt-[2px]">
                  <CardContent className="p-0">
                    <div className="w-full overflow-x-auto">
                      <Table className="text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="h-10 px-3 min-w-[60px]">
                              {language === "es" ? "Foto" : "Photo"}
                            </TableHead>
                            <TableHead className="h-10 px-3 min-w-[100px]">
                              {language === "es" ? "Portal" : "Portal"}
                            </TableHead>
                            <TableHead className="h-10 px-3 min-w-[120px] cursor-pointer hover:bg-muted" onClick={() => handleUnitsSort('unitNumber')}>
                              {language === "es" ? "Número" : "Number"} {getUnitsSortIcon('unitNumber')}
                            </TableHead>
                            <TableHead className="h-10 px-3 min-w-[180px] cursor-pointer hover:bg-muted" onClick={() => handleUnitsSort('condominiumName')}>
                              {language === "es" ? "Condominio" : "Condominium"} {getUnitsSortIcon('condominiumName')}
                            </TableHead>
                            <TableHead className="h-10 px-3 min-w-[120px] cursor-pointer hover:bg-muted" onClick={() => handleUnitsSort('propertyType')}>
                              {language === "es" ? "Tipo" : "Type"} {getUnitsSortIcon('propertyType')}
                            </TableHead>
                            <TableHead className="h-10 px-3 min-w-[120px] cursor-pointer hover:bg-muted" onClick={() => handleUnitsSort('floor')}>
                              {language === "es" ? "Piso" : "Floor"} {getUnitsSortIcon('floor')}
                            </TableHead>
                            <TableHead className="h-10 px-3 min-w-[100px] cursor-pointer hover:bg-muted" onClick={() => handleUnitsSort('bedrooms')}>
                              {language === "es" ? "Recámaras" : "Bedrooms"} {getUnitsSortIcon('bedrooms')}
                            </TableHead>
                            <TableHead className="h-10 px-3 min-w-[80px] cursor-pointer hover:bg-muted" onClick={() => handleUnitsSort('bathrooms')}>
                              {language === "es" ? "Baños" : "Bathrooms"} {getUnitsSortIcon('bathrooms')}
                            </TableHead>
                            <TableHead className="h-10 px-3 min-w-[80px] cursor-pointer hover:bg-muted" onClick={() => handleUnitsSort('area')}>
                              {language === "es" ? "m²" : "sqm"} {getUnitsSortIcon('area')}
                            </TableHead>
                            <TableHead className="h-10 px-3 min-w-[120px] cursor-pointer hover:bg-muted" onClick={() => handleUnitsSort('price')}>
                              {language === "es" ? "Renta" : "Rent"} {getUnitsSortIcon('price')}
                            </TableHead>
                            <TableHead className="h-10 px-3 min-w-[120px] cursor-pointer hover:bg-muted" onClick={() => handleUnitsSort('salePrice')}>
                              {language === "es" ? "Venta" : "Sale"} {getUnitsSortIcon('salePrice')}
                            </TableHead>
                            <TableHead className="h-10 px-3 min-w-[120px] cursor-pointer hover:bg-muted" onClick={() => handleUnitsSort('isActive')}>
                              {language === "es" ? "Estado" : "Status"} {getUnitsSortIcon('isActive')}
                            </TableHead>
                            <TableHead className="h-10 px-3 min-w-[100px]">{language === "es" ? "Disponibilidad" : "Availability"}</TableHead>
                            <TableHead className="h-10 px-3 text-right min-w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                  <TableBody>
                    {(unitsPageTransition || unitsFetching) && !unitsLoading ? (
                      <TableRow>
                        <TableCell colSpan={14} className="h-[300px] p-0">
                          <TableLoading minHeight="300px" />
                        </TableCell>
                      </TableRow>
                    ) : paginatedUnits.map((unit) => {
                      const condo = allCondominiums?.find(c => c.id === unit.condominiumId);
                      const hasRental = hasActiveRental(unit.id);
                      const unitServices = allUnitServices?.[unit.id] || [];
                      const serviceTypes = unitServices.map(s => {
                        const typeMap: Record<string, string> = {
                          rent: language === "es" ? "Renta" : "Rent",
                          electricity: language === "es" ? "Electricidad" : "Electricity",
                          water: language === "es" ? "Agua" : "Water",
                          internet: "Internet",
                          gas: "Gas",
                          maintenance: language === "es" ? "Mantenimiento" : "Maintenance"
                        };
                        return typeMap[s.serviceType] || s.serviceType;
                      });
                      
                      const pubStatus = getPublicationStatus(unit as any);
                      
                      return (
                        <TableRow 
                          key={unit.id}
                          data-testid={`row-unit-${unit.id}`}
                          className="cursor-pointer hover-elevate"
                          onClick={() => navigate(`/external/units/${unit.id}`)}
                        >
                          <TableCell className="p-1">
                            {(unit as any).coverPhotoUrl ? (
                              <img 
                                src={(unit as any).coverPhotoUrl} 
                                alt={unit.unitNumber}
                                className="w-12 h-9 object-cover rounded"
                                data-testid={`img-cover-${unit.id}`}
                              />
                            ) : (
                              <div className="w-12 h-9 bg-muted rounded flex items-center justify-center" data-testid={`img-placeholder-${unit.id}`}>
                                <Home className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {pubStatus === 'approved' ? (
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" data-testid={`badge-pub-approved-${unit.id}`}>
                                <Globe className="h-3 w-3 mr-1" />
                                {language === "es" ? "Publicado" : "Published"}
                              </Badge>
                            ) : pubStatus === 'pending' ? (
                              <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800" data-testid={`badge-pub-pending-${unit.id}`}>
                                <Clock4 className="h-3 w-3 mr-1" />
                                {language === "es" ? "Pendiente" : "Pending"}
                              </Badge>
                            ) : pubStatus === 'rejected' ? (
                              <Badge variant="outline" className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" data-testid={`badge-pub-rejected-${unit.id}`}>
                                <XCircle className="h-3 w-3 mr-1" />
                                {language === "es" ? "Rechazado" : "Rejected"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground" data-testid={`badge-pub-none-${unit.id}`}>
                                -
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              {unit.unitNumber}
                            </div>
                          </TableCell>
                          <TableCell>{condo?.name || '-'}</TableCell>
                          <TableCell>{unit.propertyType || '-'}</TableCell>
                          <TableCell>{formatFloor(unit.floor, language)}</TableCell>
                          <TableCell>{unit.bedrooms ?? '-'}</TableCell>
                          <TableCell>{unit.bathrooms ?? '-'}</TableCell>
                          <TableCell>{unit.area ? Number(unit.area).toLocaleString(language === "es" ? "es-MX" : "en-US") : '-'}</TableCell>
                          <TableCell>
                            {unit.price ? (
                              <span className="font-medium text-blue-600 dark:text-blue-400">
                                ${Number(unit.price).toLocaleString(language === "es" ? "es-MX" : "en-US")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {unit.salePrice && Number(unit.salePrice) > 0 ? (
                              <span className="font-medium text-green-600 dark:text-green-400">
                                ${Number(unit.salePrice).toLocaleString(language === "es" ? "es-MX" : "en-US")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {unit.isActive ? (
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" data-testid={`badge-unit-active-${unit.id}`}>
                                <Power className="h-3 w-3 mr-1" />
                                {language === "es" ? "Activa" : "Active"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300" data-testid={`badge-unit-suspended-${unit.id}`}>
                                <PowerOff className="h-3 w-3 mr-1" />
                                {language === "es" ? "Suspendida" : "Suspended"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {hasRental === undefined ? (
                              contractsLoading ? (
                                <Skeleton className="h-5 w-20" />
                              ) : (
                                <Badge variant="outline" data-testid={`badge-rental-unknown-${unit.id}`}>
                                  {language === "es" ? "Desconocido" : "Unknown"}
                                </Badge>
                              )
                            ) : hasRental ? (
                              <Badge variant="default" data-testid={`badge-rental-active-${unit.id}`}>
                                <DoorClosed className="h-3 w-3 mr-1" />
                                {language === "es" ? "Rentada" : "Rented"}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" data-testid={`badge-rental-inactive-${unit.id}`}>
                                <DoorOpen className="h-3 w-3 mr-1" />
                                {language === "es" ? "Disponible" : "Available"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button size="icon" variant="ghost" data-testid={`button-actions-${unit.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/external/units/${unit.id}`);
                                  }}
                                  data-testid={`menu-view-${unit.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  {language === "es" ? "Ver detalle" : "View detail"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditUnit(unit);
                                  }}
                                  data-testid={`menu-edit-${unit.id}`}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  {language === "es" ? "Editar" : "Edit"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleUnitStatusMutation.mutate(unit.id);
                                  }}
                                  disabled={toggleUnitStatusMutation.isPending}
                                  data-testid={`menu-toggle-status-${unit.id}`}
                                >
                                  {unit.isActive ? (
                                    <>
                                      <PowerOff className="h-4 w-4 mr-2 text-orange-600" />
                                      {language === "es" ? "Suspender" : "Suspend"}
                                    </>
                                  ) : (
                                    <>
                                      <Power className="h-4 w-4 mr-2 text-green-600" />
                                      {language === "es" ? "Activar" : "Activate"}
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            </div>
          ) : units && units.length > 0 ? (
            <Card data-testid="card-no-results-state">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">
                  {language === "es" ? "No se encontraron unidades" : "No units found"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {language === "es" 
                    ? "Intenta ajustar los filtros de búsqueda"
                    : "Try adjusting the search filters"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="card-empty-units-state">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium" data-testid="text-empty-units-title">
                  {language === "es" ? "No hay unidades registradas" : "No units registered"}
                </p>
                <p className="text-sm text-muted-foreground mt-2" data-testid="text-empty-units-description">
                  {language === "es" 
                    ? "Agrega tu primera unidad para comenzar"
                    : "Add your first unit to get started"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recruitment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {language === "es" ? "Reclutamiento de Propiedades" : "Property Recruitment"}
              </CardTitle>
              <CardDescription>
                {language === "es" 
                  ? "Revisa y aprueba propiedades enviadas por vendedores. Valida datos del propietario antes de aprobar."
                  : "Review and approve properties submitted by sellers. Validate owner data before approval."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === "es" ? "No hay propiedades pendientes de aprobación" : "No properties pending approval"}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {language === "es" 
                    ? "Las propiedades enviadas por vendedores aparecerán aquí para su revisión y aprobación."
                    : "Properties submitted by sellers will appear here for review and approval."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Unified Add Dialog */}
      <Dialog open={showUnifiedDialog} onOpenChange={(open) => {
        setShowUnifiedDialog(open);
        if (!open) {
          setCreationType(null);
          setTempUnits([]);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-unified-form">
          <DialogHeader>
            <DialogTitle>
              {!creationType 
                ? (language === "es" ? "¿Qué deseas agregar?" : "What would you like to add?")
                : creationType === 'condominium' 
                  ? (language === "es" ? "Agregar Condominio" : "Add Condominium")
                  : (language === "es" ? "Agregar Unidad" : "Add Unit")}
            </DialogTitle>
            <DialogDescription>
              {!creationType 
                ? (language === "es" ? "Selecciona qué deseas crear" : "Select what you want to create")
                : creationType === 'condominium'
                  ? (language === "es" ? "Completa la información del condominio y agrega las unidades que desees" : "Fill in the condominium information and add the units you want")
                  : (language === "es" ? "Completa la información de la unidad" : "Fill in the unit information")}
            </DialogDescription>
          </DialogHeader>

          {!creationType ? (
            <div className="grid grid-cols-2 gap-4 py-4">
              <Card 
                className="cursor-pointer hover-elevate active-elevate-2" 
                onClick={() => setCreationType('condominium')}
                data-testid="card-select-condominium"
              >
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 mb-4 text-primary" />
                  <p className="text-lg font-medium">{language === "es" ? "Condominio" : "Condominium"}</p>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {language === "es" ? "Crea un condominio con múltiples unidades" : "Create a condominium with multiple units"}
                  </p>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover-elevate active-elevate-2" 
                onClick={() => {
                  setCreationType('unit');
                  setTempUnits([{ unitNumber: '' }]);
                }}
                data-testid="card-select-unit"
              >
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Home className="h-12 w-12 mb-4 text-primary" />
                  <p className="text-lg font-medium">{language === "es" ? "Unidad" : "Unit"}</p>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {language === "es" ? "Agrega una unidad a un condominio existente" : "Add a unit to an existing condominium"}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : creationType === 'condominium' ? (
            <Form {...condoForm}>
              <form onSubmit={condoForm.handleSubmit(handleUnifiedSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">{language === "es" ? "Información del Condominio" : "Condominium Information"}</h3>
                  
                  <FormField
                    control={condoForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Nombre" : "Name"} *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-unified-condo-name" placeholder={language === "es" ? "Ej: Condominio Aldea Zama" : "E.g: Aldea Zama Condominium"} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={condoForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Dirección" : "Address"}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-unified-condo-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={condoForm.control}
                    name="zone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Zona / Colonia" : "Zone / Neighborhood"}</FormLabel>
                        <Select 
                          value={field.value || ""} 
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-unified-condo-zone">
                              <SelectValue placeholder={language === "es" ? "Selecciona una zona" : "Select a zone"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {zones?.filter(z => z.isActive).map((zone) => (
                              <SelectItem key={zone.id} value={zone.name}>
                                {zone.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={condoForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Descripción" : "Description"}</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} rows={2} data-testid="input-unified-condo-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{language === "es" ? "Unidades" : "Units"}</h3>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddTempUnit} data-testid="button-add-temp-unit">
                      <Plus className="mr-2 h-4 w-4" />
                      {language === "es" ? "Agregar Unidad" : "Add Unit"}
                    </Button>
                  </div>
                  
                  {tempUnits.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {language === "es" ? "No hay unidades agregadas. Puedes agregar unidades ahora o más tarde." : "No units added. You can add units now or later."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {tempUnits.map((unit, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-1 grid gap-3 md:grid-cols-5">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">{language === "es" ? "Número *" : "Number *"}</label>
                                  <Input
                                    placeholder={language === "es" ? "Ej: 101" : "E.g: 101"}
                                    value={unit.unitNumber}
                                    onChange={(e) => handleUpdateTempUnit(index, 'unitNumber', e.target.value)}
                                    data-testid={`input-temp-unit-number-${index}`}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">{language === "es" ? "Tipo" : "Type"}</label>
                                  <Input
                                    placeholder={language === "es" ? "Ej: Departamento" : "E.g: Apartment"}
                                    value={unit.propertyType || ""}
                                    onChange={(e) => handleUpdateTempUnit(index, 'propertyType', e.target.value || undefined)}
                                    data-testid={`input-temp-unit-property-type-${index}`}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">{language === "es" ? "Piso" : "Floor"}</label>
                                  <select
                                    value={unit.floor || ""}
                                    onChange={(e) => handleUpdateTempUnit(index, 'floor', e.target.value || undefined)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                    data-testid={`select-temp-unit-floor-${index}`}
                                  >
                                    <option value="">{language === "es" ? "Selecciona" : "Select"}</option>
                                    {floorOptions.map(opt => (
                                      <option key={opt.value} value={opt.value}>
                                        {language === "es" ? opt.labelEs : opt.labelEn}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">{language === "es" ? "Recámaras" : "Bedrooms"}</label>
                                  <Input
                                    type="number"
                                    placeholder="2"
                                    value={unit.bedrooms || ""}
                                    onChange={(e) => handleUpdateTempUnit(index, 'bedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
                                    data-testid={`input-temp-unit-bedrooms-${index}`}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">{language === "es" ? "Baños" : "Bathrooms"}</label>
                                  <Input
                                    type="number"
                                    placeholder="1"
                                    value={unit.bathrooms || ""}
                                    onChange={(e) => handleUpdateTempUnit(index, 'bathrooms', e.target.value ? parseInt(e.target.value) : undefined)}
                                    data-testid={`input-temp-unit-bathrooms-${index}`}
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveTempUnit(index)}
                                data-testid={`button-remove-temp-unit-${index}`}
                                className="mt-5"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setCreationType(null);
                      setTempUnits([]);
                    }}
                    data-testid="button-back-unified"
                  >
                    {language === "es" ? "Atrás" : "Back"}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createCondoMutation.isPending}
                    data-testid="button-submit-unified-condo"
                  >
                    {createCondoMutation.isPending
                      ? (language === "es" ? "Creando..." : "Creating...")
                      : (language === "es" ? "Crear Condominio" : "Create Condominium")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <Form {...unitForm}>
              <form onSubmit={unitForm.handleSubmit(handleUnifiedSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={unitForm.control}
                    name="condominiumId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Condominio" : "Condominium"} *</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            value={field.value || ""}
                            onChange={e => field.onChange(e.target.value || undefined)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            data-testid="select-unified-unit-condo"
                          >
                            <option value="">{language === "es" ? "Selecciona un condominio" : "Select a condominium"}</option>
                            {condominiums?.map(condo => (
                              <option key={condo.id} value={condo.id}>{condo.name}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{language === "es" ? "Unidades" : "Units"}</h3>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddTempUnit} data-testid="button-add-temp-unit-unified">
                      <Plus className="mr-2 h-4 w-4" />
                      {language === "es" ? "Agregar Unidad" : "Add Unit"}
                    </Button>
                  </div>
                  
                  {tempUnits.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {language === "es" ? "No hay unidades agregadas. Agrega al menos una unidad." : "No units added. Add at least one unit."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {tempUnits.map((unit, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-1 grid gap-3 md:grid-cols-5">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">{language === "es" ? "Número *" : "Number *"}</label>
                                  <Input
                                    placeholder={language === "es" ? "Ej: 101" : "E.g: 101"}
                                    value={unit.unitNumber}
                                    onChange={(e) => handleUpdateTempUnit(index, 'unitNumber', e.target.value)}
                                    data-testid={`input-temp-unit-number-unified-${index}`}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">{language === "es" ? "Tipo" : "Type"}</label>
                                  <Input
                                    placeholder={language === "es" ? "Ej: Departamento" : "E.g: Apartment"}
                                    value={unit.propertyType || ""}
                                    onChange={(e) => handleUpdateTempUnit(index, 'propertyType', e.target.value || undefined)}
                                    data-testid={`input-temp-unit-property-type-unified-${index}`}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">{language === "es" ? "Piso" : "Floor"}</label>
                                  <select
                                    value={unit.floor || ""}
                                    onChange={(e) => handleUpdateTempUnit(index, 'floor', e.target.value || undefined)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                    data-testid={`select-temp-unit-floor-unified-${index}`}
                                  >
                                    <option value="">{language === "es" ? "Selecciona" : "Select"}</option>
                                    {floorOptions.map(opt => (
                                      <option key={opt.value} value={opt.value}>
                                        {language === "es" ? opt.labelEs : opt.labelEn}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">{language === "es" ? "Recámaras" : "Bedrooms"}</label>
                                  <Input
                                    type="number"
                                    placeholder="2"
                                    value={unit.bedrooms || ""}
                                    onChange={(e) => handleUpdateTempUnit(index, 'bedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
                                    data-testid={`input-temp-unit-bedrooms-unified-${index}`}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">{language === "es" ? "Baños" : "Bathrooms"}</label>
                                  <Input
                                    type="number"
                                    placeholder="1"
                                    value={unit.bathrooms || ""}
                                    onChange={(e) => handleUpdateTempUnit(index, 'bathrooms', e.target.value ? parseInt(e.target.value) : undefined)}
                                    data-testid={`input-temp-unit-bathrooms-unified-${index}`}
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveTempUnit(index)}
                                data-testid={`button-remove-temp-unit-unified-${index}`}
                                className="mt-5"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setCreationType(null);
                      setTempUnits([]);
                    }}
                    data-testid="button-back-to-selection"
                  >
                    {language === "es" ? "Atrás" : "Back"}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createUnitMutation.isPending}
                    data-testid="button-submit-unified-unit"
                  >
                    {createUnitMutation.isPending
                      ? (language === "es" ? "Creando..." : "Creating...")
                      : (language === "es" ? "Crear Unidades" : "Create Units")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Condominium Dialog */}
      <Dialog open={showCondoDialog} onOpenChange={setShowCondoDialog}>
        <DialogContent data-testid="dialog-condominium-form">
          <DialogHeader>
            <DialogTitle>
              {editingCondo 
                ? (language === "es" ? "Editar Condominio" : "Edit Condominium")
                : (language === "es" ? "Agregar Condominio" : "Add Condominium")}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Completa la información del condominio"
                : "Fill in the condominium information"}
            </DialogDescription>
          </DialogHeader>
          <Form {...condoForm}>
            <form onSubmit={condoForm.handleSubmit(handleSubmitCondo)} className="space-y-6">
              <FormField
                control={condoForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Nombre" : "Name"} *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={language === "es" ? "Nombre del condominio" : "Condominium name"} 
                        data-testid="input-condo-name" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={condoForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Dirección" : "Address"}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""} 
                        placeholder={language === "es" ? "Dirección completa" : "Full address"} 
                        data-testid="input-condo-address" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={condoForm.control}
                name="zone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Zona / Colonia" : "Zone / Neighborhood"}</FormLabel>
                    <Select 
                      value={field.value || ""} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-condo-zone">
                          <SelectValue placeholder={language === "es" ? "Selecciona una zona" : "Select a zone"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {zones?.filter(z => z.isActive).map((zone) => (
                          <SelectItem key={zone.id} value={zone.name}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={condoForm.control}
                name="totalUnits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Total de Unidades" : "Total Units"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value || ""} 
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder={language === "es" ? "Ej: 16" : "E.g: 16"}
                        data-testid="input-condo-total-units" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={condoForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Descripción" : "Description"}</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""} 
                        placeholder={language === "es" ? "Desarrollo moderno cerca del centro" : "Modern development near downtown"} 
                        className="min-h-[100px] resize-none"
                        data-testid="input-condo-description" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCondoDialog(false)}
                  data-testid="button-cancel-condo"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCondoMutation.isPending || updateCondoMutation.isPending}
                  data-testid="button-submit-condo"
                >
                  {(createCondoMutation.isPending || updateCondoMutation.isPending)
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (language === "es" ? "Guardar" : "Save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Unit Dialog */}
      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
        <DialogContent data-testid="dialog-unit-form">
          <DialogHeader>
            <DialogTitle>
              {editingUnit 
                ? (language === "es" ? "Editar Unidad" : "Edit Unit")
                : (language === "es" ? "Agregar Unidad" : "Add Unit")}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Completa la información de la unidad"
                : "Fill in the unit information"}
            </DialogDescription>
          </DialogHeader>
          <Form {...unitForm}>
            <form onSubmit={unitForm.handleSubmit(handleSubmitUnit)} className="space-y-6">
              <FormField
                control={unitForm.control}
                name="condominiumId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Condominio" : "Condominium"} *</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-unit-condo">
                          <SelectValue placeholder={language === "es" ? "Selecciona un condominio" : "Select a condominium"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {condominiums?.map(condo => (
                          <SelectItem key={condo.id} value={condo.id}>{condo.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={unitForm.control}
                  name="unitNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Número de Unidad" : "Unit Number"} *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-unit-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={unitForm.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Tipo de Propiedad" : "Property Type"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""} 
                          placeholder={language === "es" ? "Ej: Departamento" : "E.g: Apartment"}
                          data-testid="input-unit-property-type" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={unitForm.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Piso" : "Floor"}</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-unit-floor">
                            <SelectValue placeholder={language === "es" ? "Selecciona" : "Select"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {floorOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {language === "es" ? opt.labelEs : opt.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={unitForm.control}
                  name="squareMeters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Metros Cuadrados" : "Square Meters"}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field} 
                          value={field.value || ""} 
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          data-testid="input-unit-sqm" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={unitForm.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Recámaras" : "Bedrooms"}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value || ""} 
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-unit-bedrooms" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={unitForm.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Baños" : "Bathrooms"}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.5"
                          {...field} 
                          value={field.value || ""} 
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          data-testid="input-unit-bathrooms" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={unitForm.control}
                name="photosDriveLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Link de Fotos (Drive/Airbnb)" : "Photos Link (Drive/Airbnb)"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="url"
                        placeholder="https://drive.google.com/... o https://airbnb.com/..."
                        {...field} 
                        value={field.value || ""} 
                        data-testid="input-unit-photos-link" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowUnitDialog(false)}
                  data-testid="button-cancel-unit"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUnitMutation.isPending || updateUnitMutation.isPending}
                  data-testid="button-submit-unit"
                >
                  {(createUnitMutation.isPending || updateUnitMutation.isPending)
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (language === "es" ? "Guardar" : "Save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Condominium Confirmation Dialog */}
      <Dialog open={showDeleteCondoDialog} onOpenChange={setShowDeleteCondoDialog}>
        <DialogContent data-testid="dialog-delete-condo">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              {language === "es" ? "Eliminar Condominio" : "Delete Condominium"}
            </DialogTitle>
            <DialogDescription>
              {deletingCondo && (
                <>
                  {language === "es" ? (
                    <>
                      ¿Estás seguro de que deseas eliminar el condominio <strong>{deletingCondo.name}</strong>?
                      <br /><br />
                      {getUnitsForCondo(deletingCondo.id).length > 0 ? (
                        <span className="text-destructive font-semibold">
                          Este condominio tiene {getUnitsForCondo(deletingCondo.id).length} unidades registradas. 
                          Debes eliminar todas las unidades primero antes de poder eliminar el condominio.
                        </span>
                      ) : (
                        "Esta acción no se puede deshacer."
                      )}
                    </>
                  ) : (
                    <>
                      Are you sure you want to delete the condominium <strong>{deletingCondo.name}</strong>?
                      <br /><br />
                      {getUnitsForCondo(deletingCondo.id).length > 0 ? (
                        <span className="text-destructive font-semibold">
                          This condominium has {getUnitsForCondo(deletingCondo.id).length} registered units. 
                          You must delete all units first before you can delete the condominium.
                        </span>
                      ) : (
                        "This action cannot be undone."
                      )}
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteCondoDialog(false)}
              data-testid="button-cancel-delete-condo"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={confirmDeleteCondo}
              disabled={deleteCondoMutation.isPending || (deletingCondo && getUnitsForCondo(deletingCondo.id).length > 0)}
              data-testid="button-confirm-delete-condo"
            >
              {deleteCondoMutation.isPending
                ? (language === "es" ? "Eliminando..." : "Deleting...")
                : (language === "es" ? "Eliminar" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Multiple Units to Existing Condominium Dialog */}
      <Dialog open={showAddUnitsDialog} onOpenChange={(open) => {
        setShowAddUnitsDialog(open);
        if (!open) {
          setSelectedCondoForAddUnits(null);
          setAddUnitsTemp([{ unitNumber: '' }]);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-add-units-form">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Agregar Múltiples Unidades" : "Add Multiple Units"}
            </DialogTitle>
            <DialogDescription>
              {selectedCondoForAddUnits && (
                <>
                  {language === "es" ? "Agrega varias unidades a " : "Add multiple units to "}
                  <strong>{selectedCondoForAddUnits.name}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{language === "es" ? "Unidades" : "Units"}</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddMoreUnit} data-testid="button-add-more-unit">
                <Plus className="mr-2 h-4 w-4" />
                {language === "es" ? "Agregar Unidad" : "Add Unit"}
              </Button>
            </div>
            
            <div className="space-y-3">
              {addUnitsTemp.map((unit, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 grid gap-3 md:grid-cols-5">
                        <div className="space-y-1">
                          <label className="text-xs font-medium">{language === "es" ? "Número *" : "Number *"}</label>
                          <Input
                            placeholder={language === "es" ? "Ej: 101" : "E.g: 101"}
                            value={unit.unitNumber}
                            onChange={(e) => handleUpdateAddUnit(index, 'unitNumber', e.target.value)}
                            data-testid={`input-add-unit-number-${index}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">{language === "es" ? "Tipo" : "Type"}</label>
                          <Input
                            placeholder={language === "es" ? "Ej: Departamento" : "E.g: Apartment"}
                            value={unit.propertyType || ""}
                            onChange={(e) => handleUpdateAddUnit(index, 'propertyType', e.target.value || undefined)}
                            data-testid={`input-add-unit-property-type-${index}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">{language === "es" ? "Piso" : "Floor"}</label>
                          <select
                            value={unit.floor || ""}
                            onChange={(e) => handleUpdateAddUnit(index, 'floor', e.target.value || undefined)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            data-testid={`select-add-unit-floor-${index}`}
                          >
                            <option value="">{language === "es" ? "Selecciona" : "Select"}</option>
                            {floorOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {language === "es" ? opt.labelEs : opt.labelEn}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">{language === "es" ? "Recámaras" : "Bedrooms"}</label>
                          <Input
                            type="number"
                            placeholder="2"
                            value={unit.bedrooms || ""}
                            onChange={(e) => handleUpdateAddUnit(index, 'bedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid={`input-add-unit-bedrooms-${index}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">{language === "es" ? "Baños" : "Bathrooms"}</label>
                          <Input
                            type="number"
                            placeholder="1"
                            value={unit.bathrooms || ""}
                            onChange={(e) => handleUpdateAddUnit(index, 'bathrooms', e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid={`input-add-unit-bathrooms-${index}`}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAddUnit(index)}
                        data-testid={`button-remove-add-unit-${index}`}
                        className="mt-5"
                        disabled={addUnitsTemp.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddUnitsDialog(false)}
              data-testid="button-cancel-add-units"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              type="button"
              onClick={handleSubmitAddUnits}
              data-testid="button-submit-add-units"
            >
              {language === "es" ? "Agregar Unidades" : "Add Units"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExternalGoogleSheetsImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />
    </div>
  );
}
