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
import { Eye, EyeOff, Search, Copy, Check, Mail, Filter } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { User, ExternalCondominium } from "@shared/schema";

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

export default function ExternalAccesses() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendEmailAccessId, setSendEmailAccessId] = useState<string | null>(null);
  const [selectedMaintenanceUser, setSelectedMaintenanceUser] = useState<string>("");
  
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

  const { data: maintenanceUsers } = useQuery<User[]>({
    queryKey: ['/api/external-agency-users'],
    select: (users) => users?.filter(u => u.role === 'external_agency_maintenance') || [],
  });

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
    if (selectedCondominium === "all") return [];
    return Array.from(
      new Set(
        accesses
          ?.filter(a => a.condominiumId === selectedCondominium)
          .map(a => ({ id: a.unitId, number: a.unitNumber }))
          .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i) || []
      )
    );
  }, [accesses, selectedCondominium]);

  // Reset unit filter when condominium changes
  const handleCondominiumChange = (value: string) => {
    setSelectedCondominium(value);
    setSelectedUnit("all");
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

  return (
    <div className="container mx-auto p-6 space-y-6">
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

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {language === "es" ? "Filtros" : "Filters"}
              </CardTitle>
              <CardDescription>
                {language === "es" 
                  ? "Filtra por condominio, unidad o tipo de acceso"
                  : "Filter by condominium, unit or access type"}
              </CardDescription>
            </div>
            {selectedAccesses.size > 0 && (
              <Button
                onClick={copySelectedAccesses}
                variant="default"
                data-testid="button-copy-selected"
              >
                {copiedMultiple ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {language === "es" ? `Copiar ${selectedAccesses.size} Seleccionados` : `Copy ${selectedAccesses.size} Selected`}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      {unit.number}
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
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground absolute ml-2" />
                <Input
                  placeholder={language === "es" ? "Buscar..." : "Search..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
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
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !accesses || accesses.length === 0 ? (
            <div className="text-center py-8" data-testid="div-no-accesses">
              <p className="text-muted-foreground">
                {language === "es" 
                  ? "No hay códigos de acceso registrados aún"
                  : "No access codes registered yet"}
              </p>
            </div>
          ) : filteredAccesses.length === 0 ? (
            <div className="text-center py-8" data-testid="div-no-results">
              <p className="text-muted-foreground">
                {language === "es" 
                  ? "No se encontraron resultados para tu búsqueda"
                  : "No results found for your search"}
              </p>
            </div>
          ) : (
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
                          <Badge variant="outline">
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
                            <Link href={`/external/condominiums/${access.condominiumId}/units/${access.unitId}`}>
                              <Button variant="outline" size="sm" data-testid={`button-view-unit-${access.unitId}`}>
                                {language === "es" ? "Ver" : "View"}
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!sendEmailAccessId} onOpenChange={(open) => !open && setSendEmailAccessId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Enviar por Email" : "Send by Email"}
            </DialogTitle>
            <DialogDescription>
              {language === "es"
                ? "Selecciona el usuario de mantenimiento al que deseas enviar este código de acceso"
                : "Select the maintenance user to send this access code to"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "es" ? "Usuario de Mantenimiento" : "Maintenance User"}
              </label>
              <Select value={selectedMaintenanceUser} onValueChange={setSelectedMaintenanceUser}>
                <SelectTrigger data-testid="select-maintenance-user">
                  <SelectValue placeholder={language === "es" ? "Seleccionar usuario..." : "Select user..."} />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceUsers && maintenanceUsers.length > 0 ? (
                    maintenanceUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-users" disabled>
                      {language === "es" 
                        ? "No hay usuarios de mantenimiento"
                        : "No maintenance users available"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendEmailAccessId(null)} data-testid="button-cancel-email">
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={!selectedMaintenanceUser || sendEmailMutation.isPending}
              data-testid="button-confirm-email"
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
