import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus, AlertCircle, AlertTriangle, Home, Edit, Trash2, Search, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
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
import type { ExternalCondominium, ExternalUnit, ExternalRentalContract } from "@shared/schema";
import { insertExternalCondominiumSchema, insertExternalUnitSchema } from "@shared/schema";
import { z } from "zod";

type CondominiumFormData = z.infer<typeof insertExternalCondominiumSchema>;
type UnitFormData = z.infer<typeof insertExternalUnitSchema>;

export default function ExternalCondominiums() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showCondoDialog, setShowCondoDialog] = useState(false);
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [showDeleteCondoDialog, setShowDeleteCondoDialog] = useState(false);
  const [editingCondo, setEditingCondo] = useState<ExternalCondominium | null>(null);
  const [editingUnit, setEditingUnit] = useState<ExternalUnit | null>(null);
  const [deletingCondo, setDeletingCondo] = useState<ExternalCondominium | null>(null);
  const [selectedCondoId, setSelectedCondoId] = useState<string | null>(null);
  
  // Unit filters state
  const [unitSearchText, setUnitSearchText] = useState("");
  const [selectedCondoFilter, setSelectedCondoFilter] = useState<string>("all");
  const [rentalStatusFilter, setRentalStatusFilter] = useState<string>("all");

  const { data: condominiums, isLoading: condosLoading, isError: condosError, error: condosErrorMsg } = useQuery<ExternalCondominium[]>({
    queryKey: ['/api/external-condominiums'],
  });

  const { data: units, isLoading: unitsLoading } = useQuery<ExternalUnit[]>({
    queryKey: ['/api/external-units'],
  });

  const contractsQuery = useQuery<ExternalRentalContract[]>({
    queryKey: ['/api/external-rental-contracts'],
  });
  const { data: rentalContracts, isLoading: contractsLoading, isError: contractsError, refetch: refetchContracts } = contractsQuery;

  const condoForm = useForm<CondominiumFormData>({
    resolver: zodResolver(insertExternalCondominiumSchema),
    defaultValues: {
      name: "",
      address: "",
      description: "",
      totalUnits: undefined,
    },
  });

  const unitForm = useForm<UnitFormData>({
    resolver: zodResolver(insertExternalUnitSchema),
    defaultValues: {
      condominiumId: undefined,
      unitNumber: "",
      floor: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      squareMeters: undefined,
      airbnbPhotosLink: "",
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
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
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
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
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
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
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
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
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
    onError: (error: Error) => {
      setShowDeleteCondoDialog(false);
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddCondo = () => {
    setEditingCondo(null);
    condoForm.reset({
      name: "",
      address: "",
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
      floor: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      squareMeters: undefined,
    });
    setShowUnitDialog(true);
  };

  const handleEditUnit = (unit: ExternalUnit) => {
    setEditingUnit(unit);
    unitForm.reset({
      condominiumId: unit.condominiumId,
      unitNumber: unit.unitNumber,
      floor: unit.floor || undefined,
      bedrooms: unit.bedrooms || undefined,
      bathrooms: unit.bathrooms || undefined,
      squareMeters: unit.squareMeters || undefined,
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
    return units?.filter(u => u.condominiumId === condoId) || [];
  };

  const hasActiveRental = (unitId: string): boolean | undefined => {
    if (contractsLoading || contractsError || !rentalContracts) return undefined;
    return rentalContracts.some(contract => 
      contract.unitId === unitId && contract.status === 'active'
    );
  };

  const getCondominiumName = (condoId: string): string => {
    return condominiums?.find(c => c.id === condoId)?.name || '';
  };

  const filteredUnits = units?.filter(unit => {
    // Filter by search text (unit number or condominium name)
    const searchLower = unitSearchText.toLowerCase();
    const matchesSearch = !searchLower || 
      unit.unitNumber.toLowerCase().includes(searchLower) ||
      getCondominiumName(unit.condominiumId).toLowerCase().includes(searchLower);

    // Filter by condominium
    const matchesCondominium = selectedCondoFilter === "all" || unit.condominiumId === selectedCondoFilter;

    // Filter by rental status
    const hasRental = hasActiveRental(unit.id);
    const matchesRentalStatus = rentalStatusFilter === "all" || 
      (rentalStatusFilter === "with-rental" && hasRental === true) ||
      (rentalStatusFilter === "without-rental" && hasRental === false);

    return matchesSearch && matchesCondominium && matchesRentalStatus;
  }) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Condominios y Unidades" : "Condominiums & Units"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Gestiona tus condominios y unidades"
              : "Manage your condominiums and units"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="condominiums" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="condominiums" data-testid="tab-condominiums">
            <Building2 className="mr-2 h-4 w-4" />
            {language === "es" ? "Condominios" : "Condominiums"}
          </TabsTrigger>
          <TabsTrigger value="units" data-testid="tab-units">
            <Home className="mr-2 h-4 w-4" />
            {language === "es" ? "Unidades" : "Units"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="condominiums" className="space-y-4">
          <div className="flex justify-between items-center">
            {selectedCondoId && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedCondoId(null)}
                data-testid="button-back-to-condos"
              >
                ← {language === "es" ? "Volver a Condominios" : "Back to Condominiums"}
              </Button>
            )}
            <div className={selectedCondoId ? "" : "ml-auto"}>
              <Button onClick={handleAddCondo} data-testid="button-add-condominium">
                <Plus className="mr-2 h-4 w-4" />
                {language === "es" ? "Agregar Condominio" : "Add Condominium"}
              </Button>
            </div>
          </div>

          {condosError ? (
            <Card data-testid="card-error-state">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-lg font-medium" data-testid="text-error-title">
                  {language === "es" ? "Error al cargar condominios" : "Error loading condominiums"}
                </p>
                <p className="text-sm text-muted-foreground mt-2" data-testid="text-error-message">
                  {condosErrorMsg instanceof Error ? condosErrorMsg.message : language === "es" ? "Ocurrió un error inesperado" : "An unexpected error occurred"}
                </p>
              </CardContent>
            </Card>
          ) : condosLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : condominiums && condominiums.length > 0 ? (
            selectedCondoId ? (
              // Detail view for selected condominium
              (() => {
                const selectedCondo = condominiums.find(c => c.id === selectedCondoId);
                if (!selectedCondo) return null;
                const condoUnits = getUnitsForCondo(selectedCondoId);
                
                return (
                  <div className="space-y-4">
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

                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">
                        {language === "es" ? "Unidades" : "Units"}
                      </h2>
                      <Button onClick={() => handleAddUnit(selectedCondoId)} data-testid="button-add-unit-in-detail">
                        <Plus className="mr-2 h-4 w-4" />
                        {language === "es" ? "Agregar Unidad" : "Add Unit"}
                      </Button>
                    </div>

                    {condoUnits.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {condoUnits.map((unit) => (
                          <Card 
                            key={unit.id} 
                            data-testid={`card-unit-detail-${unit.id}`}
                            className="hover-elevate active-elevate-2 cursor-pointer"
                            onClick={() => navigate(`/external/units/${unit.id}`)}
                          >
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 justify-between">
                                <div className="flex items-center gap-2">
                                  <Home className="h-5 w-5" />
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
                            <CardContent className="space-y-2">
                              {unit.floor !== null && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{language === "es" ? "Piso:" : "Floor:"}</span>
                                  <span data-testid={`text-floor-detail-${unit.id}`}>{unit.floor}</span>
                                </div>
                              )}
                              {unit.bedrooms !== null && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{language === "es" ? "Recámaras:" : "Bedrooms:"}</span>
                                  <span data-testid={`text-bedrooms-detail-${unit.id}`}>{unit.bedrooms}</span>
                                </div>
                              )}
                              {unit.bathrooms !== null && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{language === "es" ? "Baños:" : "Bathrooms:"}</span>
                                  <span data-testid={`text-bathrooms-detail-${unit.id}`}>{unit.bathrooms}</span>
                                </div>
                              )}
                              {unit.squareMeters !== null && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{language === "es" ? "m²:" : "sqm:"}</span>
                                  <span data-testid={`text-sqm-detail-${unit.id}`}>{unit.squareMeters}</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
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
              // Grid view of all condominiums
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {condominiums.map((condo) => {
                  const condoUnits = getUnitsForCondo(condo.id);
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
                            <Building2 className="h-5 w-5" />
                            <span>{condo.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
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
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {language === "es" ? "Total de unidades:" : "Total units:"}
                          </span>
                          <Badge variant="secondary" data-testid={`badge-total-units-${condo.id}`}>
                            {condo.totalUnits || condoUnits.length}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {language === "es" ? "Unidades registradas:" : "Registered units:"}
                          </span>
                          <Badge variant="outline" data-testid={`badge-registered-units-${condo.id}`}>
                            {condoUnits.length}
                          </Badge>
                        </div>
                        {condo.description && (
                          <p className="text-sm mt-2 line-clamp-2">{condo.description}</p>
                        )}
                        <Button 
                          variant="outline" 
                          className="w-full mt-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddUnit(condo.id);
                          }}
                          data-testid={`button-add-unit-${condo.id}`}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {language === "es" ? "Agregar Unidad" : "Add Unit"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          ) : (
            <Card data-testid="card-empty-state">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium" data-testid="text-empty-title">
                  {language === "es" ? "No hay condominios registrados" : "No condominiums registered"}
                </p>
                <p className="text-sm text-muted-foreground mt-2" data-testid="text-empty-description">
                  {language === "es" 
                    ? "Agrega tu primer condominio para comenzar"
                    : "Add your first condominium to get started"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          {/* Filters Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {language === "es" ? "Filtros" : "Filters"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === "es" ? "Buscar" : "Search"}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={language === "es" ? "Número de unidad o condominio..." : "Unit number or condominium..."}
                      value={unitSearchText}
                      onChange={(e) => setUnitSearchText(e.target.value)}
                      className="pl-8"
                      data-testid="input-search-units"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === "es" ? "Condominio" : "Condominium"}
                  </label>
                  <Select 
                    value={selectedCondoFilter} 
                    onValueChange={setSelectedCondoFilter}
                    disabled={condosLoading}
                  >
                    <SelectTrigger data-testid="select-filter-condominium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {language === "es" ? "Todos los condominios" : "All condominiums"}
                      </SelectItem>
                      {condominiums?.map(condo => (
                        <SelectItem key={condo.id} value={condo.id}>
                          {condo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === "es" ? "Estado de Renta" : "Rental Status"}
                  </label>
                  <Select 
                    value={rentalStatusFilter} 
                    onValueChange={setRentalStatusFilter}
                    disabled={contractsLoading || contractsError}
                  >
                    <SelectTrigger data-testid="select-filter-rental-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {language === "es" ? "Todas las unidades" : "All units"}
                      </SelectItem>
                      <SelectItem value="with-rental">
                        {language === "es" ? "Con renta activa" : "With active rental"}
                      </SelectItem>
                      <SelectItem value="without-rental">
                        {language === "es" ? "Sin renta activa" : "Without active rental"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Alert for Rental Contracts */}
          {contractsError && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">
                      {language === "es" 
                        ? "Error al cargar contratos de renta"
                        : "Error loading rental contracts"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === "es" 
                        ? "No se puede determinar el estado de disponibilidad de las unidades. El filtro de estado de renta está deshabilitado."
                        : "Cannot determine unit availability status. Rental status filter is disabled."}
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

          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground" data-testid="text-units-count">
              {language === "es" 
                ? `${filteredUnits.length} de ${units?.length || 0} unidades`
                : `${filteredUnits.length} of ${units?.length || 0} units`}
            </p>
            <Button onClick={() => handleAddUnit()} data-testid="button-add-unit">
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Agregar Unidad" : "Add Unit"}
            </Button>
          </div>

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
            <Card>
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">{language === "es" ? "Número" : "Number"}</TableHead>
                      <TableHead className="min-w-[180px]">{language === "es" ? "Condominio" : "Condominium"}</TableHead>
                      <TableHead className="min-w-[80px]">{language === "es" ? "Piso" : "Floor"}</TableHead>
                      <TableHead className="min-w-[100px]">{language === "es" ? "Recámaras" : "Bedrooms"}</TableHead>
                      <TableHead className="min-w-[80px]">{language === "es" ? "Baños" : "Bathrooms"}</TableHead>
                      <TableHead className="min-w-[80px]">{language === "es" ? "m²" : "sqm"}</TableHead>
                      <TableHead className="min-w-[120px]">{language === "es" ? "Estado" : "Status"}</TableHead>
                      <TableHead className="text-right min-w-[100px]">{language === "es" ? "Acciones" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnits.map((unit) => {
                      const condo = condominiums?.find(c => c.id === unit.condominiumId);
                      const hasRental = hasActiveRental(unit.id);
                      return (
                        <TableRow 
                          key={unit.id}
                          data-testid={`row-unit-${unit.id}`}
                          className="cursor-pointer hover-elevate"
                          onClick={() => navigate(`/external/units/${unit.id}`)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              {unit.unitNumber}
                            </div>
                          </TableCell>
                          <TableCell>{condo?.name || '-'}</TableCell>
                          <TableCell>{unit.floor ?? '-'}</TableCell>
                          <TableCell>{unit.bedrooms ?? '-'}</TableCell>
                          <TableCell>{unit.bathrooms ?? '-'}</TableCell>
                          <TableCell>{unit.squareMeters ?? '-'}</TableCell>
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
                                {language === "es" ? "Con renta" : "Rented"}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" data-testid={`badge-rental-inactive-${unit.id}`}>
                                {language === "es" ? "Disponible" : "Available"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditUnit(unit);
                              }}
                              data-testid={`button-edit-unit-${unit.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
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
      </Tabs>

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
            <form onSubmit={condoForm.handleSubmit(handleSubmitCondo)} className="space-y-4">
              <FormField
                control={condoForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Nombre" : "Name"} *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-condo-name" />
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
                      <Input {...field} value={field.value || ""} data-testid="input-condo-address" />
                    </FormControl>
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
                      <Textarea {...field} value={field.value || ""} data-testid="input-condo-description" />
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
            <form onSubmit={unitForm.handleSubmit(handleSubmitUnit)} className="space-y-4">
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
                        data-testid="select-unit-condo"
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
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Piso" : "Floor"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value || ""} 
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        data-testid="input-unit-floor" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={unitForm.control}
                name="airbnbPhotosLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Link de Fotos Airbnb" : "Airbnb Photos Link"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="url"
                        placeholder="https://..."
                        {...field} 
                        value={field.value || ""} 
                        data-testid="input-unit-airbnb-link" 
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
              <AlertTriangle className="h-5 w-5 text-destructive" />
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
    </div>
  );
}
