import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Users, Building2, Phone, Mail, DollarSign, Percent, Search, ChevronDown, ChevronRight, Plus, UserPlus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReferrerGroup {
  referrerName: string;
  referrerPhone: string | null;
  referrerEmail: string | null;
  units: {
    id: string;
    unitNumber: string;
    condominiumName: string | null;
    monthlyRent12: number | null;
    status: string;
  }[];
  totalUnits: number;
  estimatedCommission: number;
}

interface ExistingReferrer {
  name: string;
  email: string | null;
  phone: string | null;
}

interface AvailableUnit {
  id: string;
  unitNumber: string;
  condominiumName: string | null;
  currentReferrer: string | null;
}

export default function ExternalReferralNetwork() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedReferrers, setExpandedReferrers] = useState<Set<string>>(new Set());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [referrerTab, setReferrerTab] = useState<"existing" | "new">("existing");
  const [selectedExistingReferrer, setSelectedExistingReferrer] = useState<ExistingReferrer | null>(null);
  const [newReferrer, setNewReferrer] = useState({ name: "", email: "", phone: "" });
  const [unitSearchQuery, setUnitSearchQuery] = useState("");

  const { data: referrers, isLoading } = useQuery<ReferrerGroup[]>({
    queryKey: ['/api/external/referral-network'],
  });

  const { data: existingReferrers } = useQuery<ExistingReferrer[]>({
    queryKey: ['/api/external/referral-network/referrers'],
  });

  const { data: availableUnits } = useQuery<AvailableUnit[]>({
    queryKey: ['/api/external/referral-network/available-units'],
    enabled: assignDialogOpen,
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async (data: { referrerName: string; referrerEmail: string | null; referrerPhone: string | null; unitIds: string[] }) => {
      const response = await apiRequest('POST', '/api/external/referral-network/bulk-assign', data);
      return response.json();
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/referral-network'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/referral-network/referrers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/referral-network/available-units'] });
      toast({
        title: language === "es" ? "Referido asignado" : "Referrer assigned",
        description: result.message || `${selectedUnits.size} unidades actualizadas`,
      });
      resetDialog();
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetDialog = () => {
    setAssignDialogOpen(false);
    setSelectedUnits(new Set());
    setSelectedExistingReferrer(null);
    setNewReferrer({ name: "", email: "", phone: "" });
    setReferrerTab("existing");
    setUnitSearchQuery("");
  };

  const handleAssign = () => {
    const referrer = referrerTab === "existing" && selectedExistingReferrer
      ? selectedExistingReferrer
      : { name: newReferrer.name, email: newReferrer.email || null, phone: newReferrer.phone || null };

    if (!referrer.name) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "El nombre del referido es requerido" : "Referrer name is required",
        variant: "destructive",
      });
      return;
    }

    if (selectedUnits.size === 0) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "Selecciona al menos una propiedad" : "Select at least one property",
        variant: "destructive",
      });
      return;
    }

    bulkAssignMutation.mutate({
      referrerName: referrer.name,
      referrerEmail: referrer.email,
      referrerPhone: referrer.phone,
      unitIds: Array.from(selectedUnits),
    });
  };

  const toggleUnit = (unitId: string) => {
    const newSet = new Set(selectedUnits);
    if (newSet.has(unitId)) {
      newSet.delete(unitId);
    } else {
      newSet.add(unitId);
    }
    setSelectedUnits(newSet);
  };

  const selectAllUnits = () => {
    const filteredUnits = (availableUnits || []).filter(u => 
      u.unitNumber.toLowerCase().includes(unitSearchQuery.toLowerCase()) ||
      u.condominiumName?.toLowerCase().includes(unitSearchQuery.toLowerCase())
    );
    setSelectedUnits(new Set(filteredUnits.map(u => u.id)));
  };

  const clearAllUnits = () => {
    setSelectedUnits(new Set());
  };

  const text = {
    title: language === "es" ? "Red de Referidos" : "Referral Network",
    subtitle: language === "es" 
      ? "Gestiona la red de referidos y sus propiedades asignadas" 
      : "Manage the referral network and their assigned properties",
    back: language === "es" ? "Volver" : "Back",
    search: language === "es" ? "Buscar referido..." : "Search referrer...",
    noReferrers: language === "es" ? "No hay referidos registrados" : "No referrers registered",
    noReferrersDesc: language === "es" 
      ? "Las propiedades con comisión tipo 'referido' aparecerán aquí" 
      : "Properties with 'referido' commission type will appear here",
    units: language === "es" ? "unidades" : "units",
    unit: language === "es" ? "unidad" : "unit",
    estimatedCommission: language === "es" ? "Comisión estimada" : "Estimated commission",
    monthlyRent: language === "es" ? "Renta mensual" : "Monthly rent",
    totalReferrers: language === "es" ? "Total de referidos" : "Total referrers",
    totalUnits: language === "es" ? "Unidades referidas" : "Referred units",
    totalCommission: language === "es" ? "Comisión total estimada" : "Total estimated commission",
    viewUnit: language === "es" ? "Ver unidad" : "View unit",
    bulkAssign: language === "es" ? "Asignación Masiva" : "Bulk Assignment",
    bulkAssignDesc: language === "es" 
      ? "Asigna un referido a múltiples propiedades a la vez" 
      : "Assign a referrer to multiple properties at once",
    existingReferrer: language === "es" ? "Referido Existente" : "Existing Referrer",
    newReferrer: language === "es" ? "Nuevo Referido" : "New Referrer",
    selectReferrer: language === "es" ? "Selecciona un referido" : "Select a referrer",
    referrerName: language === "es" ? "Nombre" : "Name",
    referrerEmail: language === "es" ? "Email" : "Email",
    referrerPhone: language === "es" ? "Teléfono" : "Phone",
    selectProperties: language === "es" ? "Selecciona propiedades" : "Select properties",
    searchProperties: language === "es" ? "Buscar propiedades..." : "Search properties...",
    selectAll: language === "es" ? "Seleccionar todo" : "Select all",
    clearAll: language === "es" ? "Limpiar" : "Clear",
    selected: language === "es" ? "seleccionadas" : "selected",
    currentReferrer: language === "es" ? "Referido actual" : "Current referrer",
    assign: language === "es" ? "Asignar" : "Assign",
    cancel: language === "es" ? "Cancelar" : "Cancel",
    noExistingReferrers: language === "es" ? "No hay referidos existentes" : "No existing referrers",
    addFirstReferrer: language === "es" ? "Crea el primer referido en la pestaña 'Nuevo Referido'" : "Create the first referrer in the 'New Referrer' tab",
  };

  const filteredReferrers = referrers?.filter(r => 
    r.referrerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.referrerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.referrerPhone?.includes(searchQuery)
  ) || [];

  const toggleReferrer = (name: string) => {
    const newSet = new Set(expandedReferrers);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    setExpandedReferrers(newSet);
  };

  const totalStats = {
    referrers: filteredReferrers.length,
    units: filteredReferrers.reduce((sum, r) => sum + r.totalUnits, 0),
    commission: filteredReferrers.reduce((sum, r) => sum + r.estimatedCommission, 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredAvailableUnits = (availableUnits || []).filter(u => 
    u.unitNumber.toLowerCase().includes(unitSearchQuery.toLowerCase()) ||
    u.condominiumName?.toLowerCase().includes(unitSearchQuery.toLowerCase())
  );

  // Group units by condominium
  const groupedUnits = filteredAvailableUnits.reduce((groups, unit) => {
    const condoName = unit.condominiumName || (language === "es" ? "Sin Condominio" : "No Condominium");
    if (!groups[condoName]) {
      groups[condoName] = [];
    }
    groups[condoName].push(unit);
    return groups;
  }, {} as Record<string, AvailableUnit[]>);

  const sortedCondoNames = Object.keys(groupedUnits).sort();

  const [expandedCondos, setExpandedCondos] = useState<Set<string>>(new Set());

  const toggleCondo = (condoName: string) => {
    const newSet = new Set(expandedCondos);
    if (newSet.has(condoName)) {
      newSet.delete(condoName);
    } else {
      newSet.add(condoName);
    }
    setExpandedCondos(newSet);
  };

  const selectAllInCondo = (condoName: string) => {
    const newSet = new Set(selectedUnits);
    groupedUnits[condoName].forEach(u => newSet.add(u.id));
    setSelectedUnits(newSet);
  };

  const clearAllInCondo = (condoName: string) => {
    const newSet = new Set(selectedUnits);
    groupedUnits[condoName].forEach(u => newSet.delete(u.id));
    setSelectedUnits(newSet);
  };

  const getCondoSelectedCount = (condoName: string) => {
    return groupedUnits[condoName].filter(u => selectedUnits.has(u.id)).length;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/external/dashboard")}
              data-testid="link-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">{text.title}</h1>
              <p className="text-muted-foreground text-sm">{text.subtitle}</p>
            </div>
          </div>
          <Button
            onClick={() => setAssignDialogOpen(true)}
            className="gap-2"
            data-testid="button-bulk-assign"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">{text.bulkAssign}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card data-testid="card-stat-referrers">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-referrers">{totalStats.referrers}</p>
                  <p className="text-sm text-muted-foreground">{text.totalReferrers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-stat-units">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-units">{totalStats.units}</p>
                  <p className="text-sm text-muted-foreground">{text.totalUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-stat-commission">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-commission">{formatCurrency(totalStats.commission)}</p>
                  <p className="text-sm text-muted-foreground">{text.totalCommission}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {text.title}
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={text.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-referrer"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredReferrers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium" data-testid="text-no-referrers">{text.noReferrers}</p>
                <p className="text-sm text-muted-foreground mb-4">{text.noReferrersDesc}</p>
                <Button
                  variant="outline"
                  onClick={() => setAssignDialogOpen(true)}
                  className="gap-2"
                  data-testid="button-add-first-referrer"
                >
                  <Plus className="h-4 w-4" />
                  {language === "es" ? "Agregar primer referido" : "Add first referrer"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReferrers.map((referrer) => (
                  <Collapsible
                    key={referrer.referrerName}
                    open={expandedReferrers.has(referrer.referrerName)}
                    onOpenChange={() => toggleReferrer(referrer.referrerName)}
                  >
                    <div 
                      className="border rounded-lg overflow-hidden"
                      data-testid={`referrer-card-${referrer.referrerName.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="p-4 cursor-pointer hover-elevate flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium truncate" data-testid={`text-referrer-name-${referrer.referrerName.replace(/\s+/g, '-').toLowerCase()}`}>{referrer.referrerName}</p>
                                <Badge variant="outline" className="h-5 text-[10px] shrink-0" data-testid={`badge-commission-${referrer.referrerName.replace(/\s+/g, '-').toLowerCase()}`}>
                                  <Percent className="h-3 w-3 mr-1" />
                                  20%
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                                {referrer.referrerEmail && (
                                  <span className="flex items-center gap-1" data-testid={`text-referrer-email-${referrer.referrerName.replace(/\s+/g, '-').toLowerCase()}`}>
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-[150px]">{referrer.referrerEmail}</span>
                                  </span>
                                )}
                                {referrer.referrerPhone && (
                                  <span className="flex items-center gap-1" data-testid={`text-referrer-phone-${referrer.referrerName.replace(/\s+/g, '-').toLowerCase()}`}>
                                    <Phone className="h-3 w-3" />
                                    {referrer.referrerPhone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right hidden sm:block">
                              <p className="text-sm font-medium">
                                {referrer.totalUnits} {referrer.totalUnits === 1 ? text.unit : text.units}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(referrer.estimatedCommission)}
                              </p>
                            </div>
                            {expandedReferrers.has(referrer.referrerName) ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t bg-muted/30 p-3 space-y-2">
                          {referrer.units.map((unit) => (
                            <div
                              key={unit.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-md bg-background border"
                              data-testid={`unit-row-${unit.id}`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {unit.condominiumName} - {unit.unitNumber}
                                  </p>
                                  {unit.monthlyRent12 && (
                                    <p className="text-xs text-muted-foreground">
                                      {formatCurrency(unit.monthlyRent12)}/mes
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge 
                                  variant={unit.status === 'available' ? 'default' : 'secondary'}
                                  className="h-5 text-[10px]"
                                >
                                  {unit.status === 'available' 
                                    ? (language === "es" ? "Disponible" : "Available")
                                    : (language === "es" ? "Ocupada" : "Occupied")}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="h-7"
                                  data-testid={`button-view-unit-${unit.id}`}
                                >
                                  <Link href={`/external/units/${unit.id}`}>
                                    {text.viewUnit}
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {text.bulkAssign}
            </DialogTitle>
            <DialogDescription>{text.bulkAssignDesc}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <Tabs value={referrerTab} onValueChange={(v) => setReferrerTab(v as "existing" | "new")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing" data-testid="tab-existing-referrer">{text.existingReferrer}</TabsTrigger>
                <TabsTrigger value="new" data-testid="tab-new-referrer">{text.newReferrer}</TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="mt-4 space-y-2">
                {existingReferrers && existingReferrers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                    {existingReferrers.map((ref) => (
                      <div
                        key={ref.name}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedExistingReferrer?.name === ref.name 
                            ? 'border-primary bg-primary/5' 
                            : 'hover-elevate'
                        }`}
                        onClick={() => setSelectedExistingReferrer(ref)}
                        data-testid={`referrer-option-${ref.name.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ref.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {ref.email && <span className="truncate">{ref.email}</span>}
                            {ref.phone && <span>{ref.phone}</span>}
                          </div>
                        </div>
                        {selectedExistingReferrer?.name === ref.name && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{text.noExistingReferrers}</p>
                    <p className="text-xs">{text.addFirstReferrer}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="new" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-referrer-name">{text.referrerName} *</Label>
                  <Input
                    id="new-referrer-name"
                    value={newReferrer.name}
                    onChange={(e) => setNewReferrer({ ...newReferrer, name: e.target.value })}
                    placeholder="Paula González"
                    data-testid="input-new-referrer-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-referrer-email">{text.referrerEmail}</Label>
                    <Input
                      id="new-referrer-email"
                      type="email"
                      value={newReferrer.email}
                      onChange={(e) => setNewReferrer({ ...newReferrer, email: e.target.value })}
                      placeholder="paula@example.com"
                      data-testid="input-new-referrer-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-referrer-phone">{text.referrerPhone}</Label>
                    <Input
                      id="new-referrer-phone"
                      type="tel"
                      value={newReferrer.phone}
                      onChange={(e) => setNewReferrer({ ...newReferrer, phone: e.target.value })}
                      placeholder="+52 984 123 4567"
                      data-testid="input-new-referrer-phone"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <Label>{text.selectProperties}</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedUnits.size} {text.selected}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={selectAllUnits} className="h-7 text-xs" data-testid="button-select-all">
                    {text.selectAll}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearAllUnits} className="h-7 text-xs" data-testid="button-clear-all">
                    {text.clearAll}
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={text.searchProperties}
                  value={unitSearchQuery}
                  onChange={(e) => setUnitSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-units"
                />
              </div>
              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="p-2 space-y-2">
                  {sortedCondoNames.map((condoName) => {
                    const condoUnits = groupedUnits[condoName];
                    const selectedCount = getCondoSelectedCount(condoName);
                    const isExpanded = expandedCondos.has(condoName);
                    
                    return (
                      <Collapsible key={condoName} open={isExpanded} onOpenChange={() => toggleCondo(condoName)}>
                        <div className="border rounded-lg overflow-hidden">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-2 bg-muted/50 cursor-pointer hover-elevate">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <Building2 className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">{condoName}</span>
                                <Badge variant="outline" className="h-5 text-[10px]">
                                  {selectedCount}/{condoUnits.length}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2 text-[10px]"
                                  onClick={(e) => { e.stopPropagation(); selectAllInCondo(condoName); }}
                                  data-testid={`button-select-condo-${condoName.replace(/\s+/g, '-').toLowerCase()}`}
                                >
                                  {language === "es" ? "Todas" : "All"}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2 text-[10px]"
                                  onClick={(e) => { e.stopPropagation(); clearAllInCondo(condoName); }}
                                  data-testid={`button-clear-condo-${condoName.replace(/\s+/g, '-').toLowerCase()}`}
                                >
                                  {language === "es" ? "Ninguna" : "None"}
                                </Button>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-2 space-y-1 bg-background">
                              {condoUnits.map((unit) => (
                                <div
                                  key={unit.id}
                                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                    selectedUnits.has(unit.id) ? 'bg-primary/10' : 'hover-elevate'
                                  }`}
                                  onClick={() => toggleUnit(unit.id)}
                                  data-testid={`unit-option-${unit.id}`}
                                >
                                  <Checkbox 
                                    checked={selectedUnits.has(unit.id)} 
                                    onCheckedChange={() => toggleUnit(unit.id)}
                                    className="shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{unit.unitNumber}</p>
                                    {unit.currentReferrer && (
                                      <p className="text-xs text-muted-foreground">
                                        {text.currentReferrer}: {unit.currentReferrer}
                                      </p>
                                    )}
                                  </div>
                                  {selectedUnits.has(unit.id) && (
                                    <Check className="h-4 w-4 text-primary shrink-0" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={resetDialog} data-testid="button-cancel-assign">
              {text.cancel}
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={bulkAssignMutation.isPending || selectedUnits.size === 0 || 
                (referrerTab === "existing" && !selectedExistingReferrer) ||
                (referrerTab === "new" && !newReferrer.name)}
              data-testid="button-confirm-assign"
            >
              {bulkAssignMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {language === "es" ? "Asignando..." : "Assigning..."}
                </span>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {text.assign} ({selectedUnits.size})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
