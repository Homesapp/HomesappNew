import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";
import { Eye, EyeOff, Search, Copy, Check, Mail, Filter, Plus, LayoutGrid, LayoutList, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown, XCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";
import { useState, useMemo, useEffect, useLayoutEffect } from "react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, ExternalCondominium, InsertExternalUnitAccessControl } from "@shared/schema";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExternalUnitAccessControlSchema } from "@shared/schema";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type AccessControl = {
  id: string;
  unitId: string;
  unitNumber: string;
  condominiumId: string;
  condominiumName: string;
  accessType: string;
  accessCode: string | null;
  description: string | null;
  isActive: boolean;
  canShareWithMaintenance: boolean;
  createdAt: string;
  updatedAt: string;
};

type GroupedAccess = {
  unitId: string;
  unitNumber: string;
  condominiumId: string;
  condominiumName: string;
  accesses: AccessControl[];
};

const accessFormSchema = insertExternalUnitAccessControlSchema.extend({
  accessCode: z.string().optional(),
  description: z.string().optional(),
});

export default function ExternalAccesses() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isMobile = useMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendEmailAccessId, setSendEmailAccessId] = useState<string | null>(null);
  const [selectedMaintenanceUser, setSelectedMaintenanceUser] = useState<string>("");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [manualViewModeOverride, setManualViewModeOverride] = useState(false);
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // New filter states
  const [selectedCondominium, setSelectedCondominium] = useState<string>("all");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedAccessType, setSelectedAccessType] = useState<string>("all");
  const [selectedAccesses, setSelectedAccesses] = useState<Set<string>>(new Set());
  const [copiedMultiple, setCopiedMultiple] = useState(false);

  // Pagination and sorting states (unified for both table and cards)
  const [tablePage, setTablePage] = useState(1);
  const [cardsPage, setCardsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string>("condominium");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Auto-switch view mode on genuine breakpoint transitions (only if no manual override)
  useEffect(() => {
    // Only act on actual breakpoint transitions (not every isMobile change)
    if (isMobile !== prevIsMobile) {
      setPrevIsMobile(isMobile);
      
      if (!manualViewModeOverride) {
        const preferredMode = isMobile ? "cards" : "table";
        setViewMode(preferredMode);
      }
    }
  }, [isMobile, prevIsMobile, manualViewModeOverride]);

  // Access control codes (updates when new codes are added)
  const { data: accesses, isLoading } = useQuery<AccessControl[]>({
    queryKey: ['/api/external-all-access-controls'],
    staleTime: 2 * 60 * 1000, // 2 minutes cache (reduces unnecessary refetches)
  });

  // Lightweight condominiums for dropdowns (only id+name)
  const { data: condominiums } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['/api/external-condominiums-for-filters'],
    staleTime: 15 * 60 * 1000, // 15 minutes (rarely changes)
  });

  // Lightweight units for dropdowns
  const { data: units } = useQuery<{ id: string; unitNumber: string; condominiumId: string }[]>({
    queryKey: ['/api/external-units-for-filters'],
    staleTime: 15 * 60 * 1000, // 15 minutes (rarely changes)
  });

  // Static/semi-static data: maintenance users for sharing
  const { data: maintenanceUsers } = useQuery<User[]>({
    queryKey: ['/api/external-agency-users'],
    select: (users) => users?.filter(u => u.role === 'external_agency_maintenance') || [],
    staleTime: 15 * 60 * 1000, // 15 minutes (rarely changes)
  });

  // Pre-computed condominium lookup map for O(1) access in unit dropdown
  const condominiumMap = useMemo(() => {
    const map = new Map<string, string>();
    condominiums?.forEach(c => map.set(c.id, c.name));
    return map;
  }, [condominiums]);

  const form = useForm<z.infer<typeof accessFormSchema>>({
    resolver: zodResolver(accessFormSchema),
    defaultValues: {
      unitId: "",
      accessType: "door_code",
      accessCode: "",
      description: "",
      isActive: true,
      canShareWithMaintenance: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof accessFormSchema>) => {
      return await apiRequest("POST", "/api/external-unit-access-controls", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-all-access-controls'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: language === "es" ? "Acceso creado" : "Access created",
        description: language === "es"
          ? "El código de acceso ha sido creado exitosamente"
          : "Access code has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo crear el código de acceso"
          : "Could not create access code",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof accessFormSchema>) => {
    createMutation.mutate(data);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getAccessTypeLabel = (type: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      door_code: { es: "Código Puerta", en: "Door Code" },
      wifi: { es: "WiFi", en: "WiFi" },
      gate: { es: "Portón", en: "Gate" },
      parking: { es: "Estacionamiento", en: "Parking" },
      elevator: { es: "Elevador", en: "Elevator" },
      pool: { es: "Alberca", en: "Pool" },
      gym: { es: "Gimnasio", en: "Gym" },
      other: { es: "Otro", en: "Other" },
    };

    return labels[type]?.[language] || type;
  };

  const getAccessTypeColor = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    const colorMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      door_code: "default",
      wifi: "secondary",
      gate: "outline",
      parking: "outline",
      elevator: "outline",
      pool: "outline",
      gym: "outline",
      other: "secondary",
    };
    return colorMap[type] || "outline";
  };

  const copyToClipboard = async (access: AccessControl) => {
    const text = `${language === "es" ? "Acceso" : "Access"}: ${getAccessTypeLabel(access.accessType)}
${language === "es" ? "Condominio" : "Condominium"}: ${access.condominiumName}
${language === "es" ? "Unidad" : "Unit"}: ${access.unitNumber}
${language === "es" ? "Código" : "Code"}: ${access.accessCode || 'N/A'}
${access.description ? `${language === "es" ? "Descripción" : "Description"}: ${access.description}` : ''}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(access.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: language === "es" ? "Copiado" : "Copied",
        description: language === "es" 
          ? "Información de acceso copiada al portapapeles"
          : "Access information copied to clipboard",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo copiar al portapapeles"
          : "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const sendEmailMutation = useMutation({
    mutationFn: async ({ accessId, userId }: { accessId: string; userId: string }) => {
      return await apiRequest("POST", "/api/external-access-controls/send-email", {
        accessId,
        userId,
      });
    },
    onSuccess: () => {
      setSendEmailAccessId(null);
      setSelectedMaintenanceUser("");
      toast({
        title: language === "es" ? "Email enviado" : "Email sent",
        description: language === "es"
          ? "El código de acceso ha sido enviado por email"
          : "Access code has been sent by email",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo enviar el email"
          : "Could not send email",
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = () => {
    if (!sendEmailAccessId || !selectedMaintenanceUser) return;
    sendEmailMutation.mutate({
      accessId: sendEmailAccessId,
      userId: selectedMaintenanceUser,
    });
  };

  // Get unique units from selected condominium
  const availableUnits = useMemo(() => {
    if (selectedCondominium === "all") {
      return units || [];
    }
    return units?.filter(u => u.condominiumId === selectedCondominium) || [];
  }, [units, selectedCondominium]);

  // Reset unit filter when condominium changes
  const handleCondominiumChange = (value: string) => {
    setSelectedCondominium(value);
    setSelectedUnit("all");
    setTablePage(1);
    setCardsPage(1);
    form.setValue("unitId", "");
  };

  const handleUnitChange = (value: string) => {
    setSelectedUnit(value);
    setTablePage(1);
    setCardsPage(1);
  };

  const handleAccessTypeChange = (value: string) => {
    setSelectedAccessType(value);
    setTablePage(1);
    setCardsPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setTablePage(1);
    setCardsPage(1);
  };

  // Clear selection when filters change
  useEffect(() => {
    setSelectedAccesses(new Set());
  }, [selectedCondominium, selectedUnit, selectedAccessType, searchTerm]);

  const filteredAccesses = accesses?.filter(access => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      access.unitNumber.toLowerCase().includes(searchLower) ||
      access.condominiumName.toLowerCase().includes(searchLower) ||
      access.accessType.toLowerCase().includes(searchLower) ||
      (access.description && access.description.toLowerCase().includes(searchLower))
    );

    const matchesCondominium = selectedCondominium === "all" || access.condominiumId === selectedCondominium;
    const matchesUnit = selectedUnit === "all" || access.unitId === selectedUnit;
    const matchesType = selectedAccessType === "all" || access.accessType === selectedAccessType;

    return matchesSearch && matchesCondominium && matchesUnit && matchesType;
  }) || [];

  // Sorting logic for table view
  const sortedAccesses = useMemo(() => {
    if (!sortColumn) return filteredAccesses;

    const sorted = [...filteredAccesses].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'condominium':
          aValue = a.condominiumName.toLowerCase();
          bValue = b.condominiumName.toLowerCase();
          break;
        case 'unit':
          aValue = a.unitNumber.toLowerCase();
          bValue = b.unitNumber.toLowerCase();
          break;
        case 'type':
          aValue = getAccessTypeLabel(a.accessType).toLowerCase();
          bValue = getAccessTypeLabel(b.accessType).toLowerCase();
          break;
        case 'code':
          aValue = a.accessCode?.toLowerCase() || '';
          bValue = b.accessCode?.toLowerCase() || '';
          break;
        case 'description':
          aValue = a.description?.toLowerCase() || '';
          bValue = b.description?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredAccesses, sortColumn, sortDirection, language]);

  // Table pagination
  const tableTotalPages = Math.max(1, Math.ceil(sortedAccesses.length / itemsPerPage));
  const tableStartIndex = (tablePage - 1) * itemsPerPage;
  const tableEndIndex = tableStartIndex + itemsPerPage;
  const paginatedTableAccesses = sortedAccesses.slice(tableStartIndex, tableEndIndex);

  // Page clamping for table (useLayoutEffect for flicker-free UI)
  useLayoutEffect(() => {
    if (tablePage > tableTotalPages && tableTotalPages > 0) {
      setTablePage(tableTotalPages);
    }
  }, [tablePage, tableTotalPages, sortedAccesses.length, itemsPerPage]);

  // Group accesses by unit for cards view
  const groupedAccesses = useMemo(() => {
    const groups = new Map<string, GroupedAccess>();
    
    filteredAccesses.forEach(access => {
      const key = access.unitId;
      if (!groups.has(key)) {
        groups.set(key, {
          unitId: access.unitId,
          unitNumber: access.unitNumber,
          condominiumId: access.condominiumId,
          condominiumName: access.condominiumName,
          accesses: [],
        });
      }
      groups.get(key)!.accesses.push(access);
    });

    return Array.from(groups.values()).sort((a, b) => {
      const condoCompare = a.condominiumName.localeCompare(b.condominiumName);
      if (condoCompare !== 0) return condoCompare;
      return a.unitNumber.localeCompare(b.unitNumber);
    });
  }, [filteredAccesses]);

  // Cards pagination
  const cardsTotalPages = Math.max(1, Math.ceil(groupedAccesses.length / itemsPerPage));
  const cardsStartIndex = (cardsPage - 1) * itemsPerPage;
  const cardsEndIndex = cardsStartIndex + itemsPerPage;
  const paginatedGroupedAccesses = groupedAccesses.slice(cardsStartIndex, cardsEndIndex);

  // Page clamping for cards (useLayoutEffect for flicker-free UI)
  useLayoutEffect(() => {
    if (cardsPage > cardsTotalPages && cardsTotalPages > 0) {
      setCardsPage(cardsTotalPages);
    }
  }, [cardsPage, cardsTotalPages, groupedAccesses.length, itemsPerPage]);

  // Handle sort column click
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleAccessSelection = (accessId: string) => {
    setSelectedAccesses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accessId)) {
        newSet.delete(accessId);
      } else {
        newSet.add(accessId);
      }
      return newSet;
    });
  };

  const toggleAllAccesses = () => {
    if (selectedAccesses.size === filteredAccesses.length) {
      setSelectedAccesses(new Set());
    } else {
      setSelectedAccesses(new Set(filteredAccesses.map(a => a.id)));
    }
  };

  const copySelectedAccesses = async () => {
    const accessesToCopy = filteredAccesses.filter(a => selectedAccesses.has(a.id));
    
    if (accessesToCopy.length === 0) {
      toast({
        title: language === "es" ? "Sin selección" : "No selection",
        description: language === "es"
          ? "No hay accesos seleccionados para copiar"
          : "No accesses selected to copy",
        variant: "default",
      });
      return;
    }

    let text = `${language === "es" ? "CÓDIGOS DE ACCESO" : "ACCESS CODES"}\n\n`;

    accessesToCopy.forEach((access, idx) => {
      if (idx > 0) text += '\n---\n\n';
      text += `${language === "es" ? "Condominio" : "Condominium"}: ${access.condominiumName}\n`;
      text += `${language === "es" ? "Unidad" : "Unit"}: ${access.unitNumber}\n`;
      text += `${language === "es" ? "Tipo" : "Type"}: ${getAccessTypeLabel(access.accessType)}\n`;
      if (access.accessCode) {
        text += `${language === "es" ? "Código" : "Code"}: ${access.accessCode}\n`;
      }
      if (access.description) {
        text += `${language === "es" ? "Descripción" : "Description"}: ${access.description}\n`;
      }
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopiedMultiple(true);
      setTimeout(() => setCopiedMultiple(false), 2000);
      toast({
        title: language === "es" ? "Copiado" : "Copied",
        description: language === "es" 
          ? `${accessesToCopy.length} accesos copiados al portapapeles`
          : `${accessesToCopy.length} accesses copied to clipboard`,
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo copiar al portapapeles"
          : "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSelectedCondominium("all");
    setSelectedUnit("all");
    setSelectedAccessType("all");
    setSearchTerm("");
    setTablePage(1);
    setCardsPage(1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {language === "es" ? "Accesos y Contraseñas" : "Access Codes & Passwords"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Vista consolidada de todos los códigos de acceso de tus unidades"
              : "Consolidated view of all access codes for your units"}
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-access" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Nuevo Acceso" : "New Access"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {language === "es" ? "Crear Código de Acceso" : "Create Access Code"}
              </DialogTitle>
              <DialogDescription>
                {language === "es"
                  ? "Registra un nuevo código de acceso para una unidad"
                  : "Register a new access code for a unit"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Unidad" : "Unit"} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-form-unit">
                              <SelectValue placeholder={language === "es" ? "Selecciona una unidad" : "Select a unit"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {units?.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {condominiumMap.get(unit.condominiumId)} - {unit.unitNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Tipo de Acceso" : "Access Type"} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-form-access-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="door_code">{getAccessTypeLabel("door_code")}</SelectItem>
                            <SelectItem value="wifi">{getAccessTypeLabel("wifi")}</SelectItem>
                            <SelectItem value="gate">{getAccessTypeLabel("gate")}</SelectItem>
                            <SelectItem value="parking">{getAccessTypeLabel("parking")}</SelectItem>
                            <SelectItem value="elevator">{getAccessTypeLabel("elevator")}</SelectItem>
                            <SelectItem value="pool">{getAccessTypeLabel("pool")}</SelectItem>
                            <SelectItem value="gym">{getAccessTypeLabel("gym")}</SelectItem>
                            <SelectItem value="other">{getAccessTypeLabel("other")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="accessCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Código/Contraseña" : "Code/Password"}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={language === "es" ? "Ingresa el código" : "Enter code"}
                          {...field}
                          data-testid="input-form-code"
                        />
                      </FormControl>
                      <FormDescription>
                        {language === "es" 
                          ? "El código de acceso o contraseña" 
                          : "The access code or password"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Descripción" : "Description"}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={language === "es" ? "Detalles adicionales..." : "Additional details..."}
                          {...field}
                          data-testid="input-form-description"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {language === "es" ? "Activo" : "Active"}
                          </FormLabel>
                          <FormDescription>
                            {language === "es" 
                              ? "¿Este código está activo?" 
                              : "Is this code active?"}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-form-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="canShareWithMaintenance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {language === "es" ? "Compartir" : "Share"}
                          </FormLabel>
                          <FormDescription>
                            {language === "es" 
                              ? "¿Compartir con mantenimiento?" 
                              : "Share with maintenance?"}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-form-share"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    data-testid="button-cancel-form"
                  >
                    {language === "es" ? "Cancelar" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-form"
                  >
                    {createMutation.isPending
                      ? (language === "es" ? "Guardando..." : "Saving...")
                      : (language === "es" ? "Crear Acceso" : "Create Access")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "es" ? "Buscar accesos..." : "Search accesses..."}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            {/* Filter Button with Popover */}
            <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="relative flex-shrink-0"
                  data-testid="button-toggle-filters"
                >
                  <Filter className="h-4 w-4" />
                  {(selectedCondominium !== "all" || selectedUnit !== "all" || selectedAccessType !== "all") && (
                    <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {[selectedCondominium !== "all", selectedUnit !== "all", selectedAccessType !== "all"].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
            <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === "es" ? "Condominio" : "Condominium"}
                  </label>
                  <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2">
                    <Button
                      variant={selectedCondominium === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCondominiumChange("all")}
                      data-testid="button-filter-condo-all"
                      className="flex-shrink-0"
                    >
                      {language === "es" ? "Todos" : "All"}
                    </Button>
                    {condominiums?.map((condo) => (
                      <Button
                        key={condo.id}
                        variant={selectedCondominium === condo.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCondominiumChange(condo.id)}
                        data-testid={`button-filter-condo-${condo.id}`}
                        className="flex-shrink-0"
                      >
                        {condo.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedCondominium !== "all" && availableUnits.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === "es" ? "Unidad" : "Unit"}
                    </label>
                    <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2">
                      <Button
                        variant={selectedUnit === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUnitChange("all")}
                        data-testid="button-filter-unit-all"
                        className="flex-shrink-0"
                      >
                        {language === "es" ? "Todas" : "All"}
                      </Button>
                      {availableUnits.map((unit) => (
                        <Button
                          key={unit.id}
                          variant={selectedUnit === unit.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleUnitChange(unit.id)}
                          data-testid={`button-filter-unit-${unit.id}`}
                          className="flex-shrink-0"
                        >
                          {unit.unitNumber}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === "es" ? "Tipo de Acceso" : "Access Type"}
                  </label>
                  <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2">
                    <Button
                      variant={selectedAccessType === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAccessTypeChange("all")}
                      data-testid="button-filter-type-all"
                      className="flex-shrink-0"
                    >
                      {language === "es" ? "Todos" : "All"}
                    </Button>
                    <Button
                      variant={selectedAccessType === "door_code" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAccessTypeChange("door_code")}
                      data-testid="button-filter-type-door"
                      className="flex-shrink-0"
                    >
                      {getAccessTypeLabel("door_code")}
                    </Button>
                    <Button
                      variant={selectedAccessType === "wifi" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAccessTypeChange("wifi")}
                      data-testid="button-filter-type-wifi"
                      className="flex-shrink-0"
                    >
                      {getAccessTypeLabel("wifi")}
                    </Button>
                    <Button
                      variant={selectedAccessType === "gate" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAccessTypeChange("gate")}
                      data-testid="button-filter-type-gate"
                      className="flex-shrink-0"
                    >
                      {getAccessTypeLabel("gate")}
                    </Button>
                    <Button
                      variant={selectedAccessType === "parking" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAccessTypeChange("parking")}
                      data-testid="button-filter-type-parking"
                      className="flex-shrink-0"
                    >
                      {getAccessTypeLabel("parking")}
                    </Button>
                    <Button
                      variant={selectedAccessType === "elevator" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAccessTypeChange("elevator")}
                      data-testid="button-filter-type-elevator"
                      className="flex-shrink-0"
                    >
                      {getAccessTypeLabel("elevator")}
                    </Button>
                    <Button
                      variant={selectedAccessType === "pool" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAccessTypeChange("pool")}
                      data-testid="button-filter-type-pool"
                      className="flex-shrink-0"
                    >
                      {getAccessTypeLabel("pool")}
                    </Button>
                    <Button
                      variant={selectedAccessType === "gym" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAccessTypeChange("gym")}
                      data-testid="button-filter-type-gym"
                      className="flex-shrink-0"
                    >
                      {getAccessTypeLabel("gym")}
                    </Button>
                    <Button
                      variant={selectedAccessType === "other" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAccessTypeChange("other")}
                      data-testid="button-filter-type-other"
                      className="flex-shrink-0"
                    >
                      {getAccessTypeLabel("other")}
                    </Button>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={clearFilters}>
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
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => {
                    setViewMode('cards');
                    setManualViewModeOverride(false);
                  }}
                  className="flex-shrink-0"
                  data-testid="button-view-cards"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => {
                    setViewMode('table');
                    setManualViewModeOverride(true);
                  }}
                  className="flex-shrink-0"
                  data-testid="button-view-table"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedAccesses.size > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={copySelectedAccesses}
            variant="default"
            size="sm"
            data-testid="button-copy-selected"
          >
            {copiedMultiple ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {language === "es" ? `Copiar ${selectedAccesses.size}` : `Copy ${selectedAccesses.size}`}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : !accesses || accesses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12" data-testid="div-no-accesses">
            <p className="text-muted-foreground">
              {language === "es" 
                ? "No hay códigos de acceso registrados aún"
                : "No access codes registered yet"}
            </p>
            <Button
              className="mt-4"
              onClick={() => setIsAddDialogOpen(true)}
              data-testid="button-add-first-access"
            >
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Crear Primer Acceso" : "Create First Access"}
            </Button>
          </CardContent>
        </Card>
      ) : filteredAccesses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12" data-testid="div-no-results">
            <p className="text-muted-foreground">
              {language === "es" 
                ? "No se encontraron resultados para tu búsqueda"
                : "No results found for your search"}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <>
          <ExternalPaginationControls
            currentPage={tablePage}
            totalPages={tableTotalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setTablePage}
            onItemsPerPageChange={setItemsPerPage}
            language={language}
            testIdPrefix="table"
          />

          <Card className="border">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedAccesses.size === filteredAccesses.length && filteredAccesses.length > 0}
                        onCheckedChange={toggleAllAccesses}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead className="min-w-[150px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('condominium')}
                        className="hover-elevate active-elevate-2 p-0 h-auto font-normal"
                        data-testid="button-sort-condominium"
                      >
                        {language === "es" ? "Condominio" : "Condominium"}
                        {sortColumn === 'condominium' ? (
                          sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('unit')}
                        className="hover-elevate active-elevate-2 p-0 h-auto font-normal"
                        data-testid="button-sort-unit"
                      >
                        {language === "es" ? "Unidad" : "Unit"}
                        {sortColumn === 'unit' ? (
                          sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[150px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('type')}
                        className="hover-elevate active-elevate-2 p-0 h-auto font-normal"
                        data-testid="button-sort-type"
                      >
                        {language === "es" ? "Tipo" : "Type"}
                        {sortColumn === 'type' ? (
                          sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[200px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('code')}
                        className="hover-elevate active-elevate-2 p-0 h-auto font-normal"
                        data-testid="button-sort-code"
                      >
                        {language === "es" ? "Código/Contraseña" : "Code/Password"}
                        {sortColumn === 'code' ? (
                          sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[200px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('description')}
                        className="hover-elevate active-elevate-2 p-0 h-auto font-normal"
                        data-testid="button-sort-description"
                      >
                        {language === "es" ? "Descripción" : "Description"}
                        {sortColumn === 'description' ? (
                          sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[150px]">
                      {language === "es" ? "Compartir" : "Share"}
                    </TableHead>
                    <TableHead className="text-right min-w-[200px]">
                      {language === "es" ? "Acciones" : "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTableAccesses.map((access) => {
                    const isVisible = visiblePasswords.has(access.id);
                    const isSelected = selectedAccesses.has(access.id);
                    return (
                      <TableRow key={access.id} data-testid={`row-access-${access.id}`}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleAccessSelection(access.id)}
                            data-testid={`checkbox-access-${access.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          {access.condominiumName}
                        </TableCell>
                        <TableCell>
                          <Link href={`/external/condominiums/${access.condominiumId}/units/${access.unitId}`}>
                            <Button variant="ghost" className="p-0 h-auto text-primary underline-offset-4 hover:underline" data-testid={`link-unit-${access.unitId}`}>
                              {access.unitNumber}
                            </Button>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getAccessTypeColor(access.accessType)}>
                            {getAccessTypeLabel(access.accessType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {access.accessCode ? (
                            <div className="flex items-center gap-2">
                              <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                {isVisible ? access.accessCode : '••••••••'}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePasswordVisibility(access.id)}
                                data-testid={`button-toggle-visibility-${access.id}`}
                              >
                                {isVisible ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {access.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={access.canShareWithMaintenance ? "default" : "secondary"}>
                            {access.canShareWithMaintenance 
                              ? (language === "es" ? "Sí" : "Yes")
                              : (language === "es" ? "No" : "No")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(access)}
                              data-testid={`button-copy-${access.id}`}
                            >
                              {copiedId === access.id ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setSendEmailAccessId(access.id)}
                              data-testid={`button-email-${access.id}`}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
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
      ) : (
        <>
          <ExternalPaginationControls
            currentPage={cardsPage}
            totalPages={cardsTotalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCardsPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCardsPage(1);
            }}
            language={language}
            testIdPrefix="cards"
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {paginatedGroupedAccesses.map((group) => (
              <Card key={group.unitId} className="overflow-hidden" data-testid={`card-unit-${group.unitId}`}>
                <CardHeader className="bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        <Link href={`/external/condominiums/${group.condominiumId}/units/${group.unitId}`}>
                          <Button variant="ghost" className="p-0 h-auto text-lg font-semibold text-primary underline-offset-4 hover:underline" data-testid={`link-unit-card-${group.unitId}`}>
                            {group.unitNumber}
                          </Button>
                        </Link>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {group.condominiumName}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {group.accesses.length} {language === "es" ? "accesos" : "accesses"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {group.accesses.map((access) => {
                      const isVisible = visiblePasswords.has(access.id);
                      const isSelected = selectedAccesses.has(access.id);
                      return (
                        <div
                          key={access.id}
                          className={`p-4 space-y-3 ${isSelected ? 'bg-accent/50' : ''}`}
                          data-testid={`card-access-${access.id}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleAccessSelection(access.id)}
                                data-testid={`checkbox-card-access-${access.id}`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={getAccessTypeColor(access.accessType)} className="text-xs">
                                    {getAccessTypeLabel(access.accessType)}
                                  </Badge>
                                  {access.canShareWithMaintenance && (
                                    <Badge variant="secondary" className="text-xs">
                                      {language === "es" ? "Compartible" : "Shareable"}
                                    </Badge>
                                  )}
                                  {!access.isActive && (
                                    <Badge variant="destructive" className="text-xs">
                                      {language === "es" ? "Inactivo" : "Inactive"}
                                    </Badge>
                                  )}
                                </div>
                                {access.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {access.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(access)}
                                data-testid={`button-copy-card-${access.id}`}
                              >
                                {copiedId === access.id ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSendEmailAccessId(access.id)}
                                data-testid={`button-email-card-${access.id}`}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {access.accessCode && (
                            <div className="flex items-center gap-2 pl-9">
                              <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono flex-1">
                                {isVisible ? access.accessCode : '••••••••'}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePasswordVisibility(access.id)}
                                data-testid={`button-toggle-card-visibility-${access.id}`}
                              >
                                {isVisible ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={!!sendEmailAccessId} onOpenChange={(open) => !open && setSendEmailAccessId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Enviar por Email" : "Send by Email"}
            </DialogTitle>
            <DialogDescription>
              {language === "es"
                ? "Selecciona un trabajador de mantenimiento para enviarle este código de acceso"
                : "Select a maintenance worker to send this access code to"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "es" ? "Trabajador" : "Worker"}
              </label>
              <Select value={selectedMaintenanceUser} onValueChange={setSelectedMaintenanceUser}>
                <SelectTrigger data-testid="select-maintenance-user">
                  <SelectValue placeholder={language === "es" ? "Selecciona..." : "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceUsers?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                      {user.maintenanceSpecialty && ` (${user.maintenanceSpecialty})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendEmailAccessId(null)}
              data-testid="button-cancel-email"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={!selectedMaintenanceUser || sendEmailMutation.isPending}
              data-testid="button-send-email"
            >
              {sendEmailMutation.isPending
                ? (language === "es" ? "Enviando..." : "Sending...")
                : (language === "es" ? "Enviar" : "Send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
