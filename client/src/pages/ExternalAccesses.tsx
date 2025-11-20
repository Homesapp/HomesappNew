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
import { useLanguage } from "@/contexts/LanguageContext";
import { Eye, EyeOff, Search, Copy, Check, Mail, Filter, Plus, LayoutGrid, LayoutList } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, ExternalCondominium, InsertExternalUnitAccessControl } from "@shared/schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendEmailAccessId, setSendEmailAccessId] = useState<string | null>(null);
  const [selectedMaintenanceUser, setSelectedMaintenanceUser] = useState<string>("");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // New filter states
  const [selectedCondominium, setSelectedCondominium] = useState<string>("all");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedAccessType, setSelectedAccessType] = useState<string>("all");
  const [selectedAccesses, setSelectedAccesses] = useState<Set<string>>(new Set());
  const [copiedMultiple, setCopiedMultiple] = useState(false);

  const { data: accesses, isLoading } = useQuery<AccessControl[]>({
    queryKey: ['/api/external-all-access-controls'],
  });

  const { data: condominiums } = useQuery<ExternalCondominium[]>({
    queryKey: ['/api/external-condominiums'],
  });

  const { data: units } = useQuery<{ id: string; unitNumber: string; condominiumId: string }[]>({
    queryKey: ['/api/external-units'],
  });

  const { data: maintenanceUsers } = useQuery<User[]>({
    queryKey: ['/api/external-agency-users'],
    select: (users) => users?.filter(u => u.role === 'external_agency_maintenance') || [],
  });

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
      return await apiRequest("POST", "/api/external-access-controls", data);
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
    form.setValue("unitId", "");
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

  // Group accesses by unit
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
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

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              data-testid="button-view-table"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              data-testid="button-view-cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-access">
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
                              {units?.map((unit) => {
                                const condo = condominiums?.find(c => c.id === unit.condominiumId);
                                return (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    {condo?.name} - {unit.unitNumber}
                                  </SelectItem>
                                );
                              })}
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
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" data-testid="button-toggle-filters">
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[600px]" align="start">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">
                    {language === "es" ? "Filtros" : "Filters"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" 
                      ? "Filtra por condominio, unidad o tipo de acceso"
                      : "Filter by condominium, unit or access type"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === "es" ? "Condominio" : "Condominium"}
                    </label>
                    <Select value={selectedCondominium} onValueChange={handleCondominiumChange}>
                      <SelectTrigger data-testid="select-condominium">
                        <SelectValue placeholder={language === "es" ? "Todos" : "All"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {language === "es" ? "Todos los condominios" : "All condominiums"}
                        </SelectItem>
                        {condominiums?.map((condo) => (
                          <SelectItem key={condo.id} value={condo.id}>
                            {condo.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === "es" ? "Unidad" : "Unit"}
                    </label>
                    <Select 
                      value={selectedUnit} 
                      onValueChange={setSelectedUnit}
                      disabled={selectedCondominium === "all"}
                    >
                      <SelectTrigger data-testid="select-unit">
                        <SelectValue placeholder={language === "es" ? "Todas" : "All"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {language === "es" ? "Todas las unidades" : "All units"}
                        </SelectItem>
                        {availableUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.unitNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === "es" ? "Tipo de Acceso" : "Access Type"}
                    </label>
                    <Select value={selectedAccessType} onValueChange={setSelectedAccessType}>
                      <SelectTrigger data-testid="select-access-type">
                        <SelectValue placeholder={language === "es" ? "Todos" : "All"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {language === "es" ? "Todos los tipos" : "All types"}
                        </SelectItem>
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === "es" ? "Buscar" : "Search"}
                    </label>
                    <div className="relative">
                      <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        placeholder={language === "es" ? "Buscar..." : "Search..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                        data-testid="input-search"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              data-testid="button-view-table"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              data-testid="button-view-cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {selectedAccesses.size > 0 && (
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
        )}
      </div>

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
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>{language === "es" ? "Códigos de Acceso" : "Access Codes"}</CardTitle>
                <CardDescription>
                  {language === "es" 
                    ? `${filteredAccesses.length} de ${accesses?.length || 0} registros`
                    : `${filteredAccesses.length} of ${accesses?.length || 0} records`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
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
                      {language === "es" ? "Condominio" : "Condominium"}
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      {language === "es" ? "Unidad" : "Unit"}
                    </TableHead>
                    <TableHead className="min-w-[150px]">
                      {language === "es" ? "Tipo" : "Type"}
                    </TableHead>
                    <TableHead className="min-w-[200px]">
                      {language === "es" ? "Código/Contraseña" : "Code/Password"}
                    </TableHead>
                    <TableHead className="min-w-[200px]">
                      {language === "es" ? "Descripción" : "Description"}
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
                  {filteredAccesses.map((access) => {
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
                        <TableCell className="font-medium">
                          {access.condominiumName}
                        </TableCell>
                        <TableCell>
                          <Link href={`/external/condominiums/${access.condominiumId}/units/${access.unitId}`}>
                            <Button variant="link" className="p-0 h-auto" data-testid={`link-unit-${access.unitId}`}>
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
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {language === "es" 
                ? `${groupedAccesses.length} unidades con ${filteredAccesses.length} accesos`
                : `${groupedAccesses.length} units with ${filteredAccesses.length} accesses`}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groupedAccesses.map((group) => (
              <Card key={group.unitId} className="overflow-hidden" data-testid={`card-unit-${group.unitId}`}>
                <CardHeader className="bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        <Link href={`/external/condominiums/${group.condominiumId}/units/${group.unitId}`}>
                          <Button variant="link" className="p-0 h-auto text-lg font-semibold" data-testid={`link-unit-card-${group.unitId}`}>
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
        </div>
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
                      {user.name}
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
