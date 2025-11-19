import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Eye, EyeOff, Search, Copy, Check, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

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

  const { data: accesses, isLoading } = useQuery<AccessControl[]>({
    queryKey: ['/api/external-all-access-controls'],
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

  const filteredAccesses = accesses?.filter(access => {
    const searchLower = searchTerm.toLowerCase();
    return (
      access.unitNumber.toLowerCase().includes(searchLower) ||
      access.condominiumName.toLowerCase().includes(searchLower) ||
      access.accessType.toLowerCase().includes(searchLower) ||
      (access.description && access.description.toLowerCase().includes(searchLower))
    );
  }) || [];

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
          <CardTitle>{language === "es" ? "Filtros" : "Filters"}</CardTitle>
          <CardDescription>
            {language === "es" 
              ? "Busca por condominio, unidad o tipo de acceso"
              : "Search by condominium, unit or access type"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "es" ? "Buscar..." : "Search..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search"
            />
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
                    return (
                      <TableRow key={access.id} data-testid={`row-access-${access.id}`}>
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
