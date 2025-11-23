import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
  FileText,
  CheckCircle2,
  Upload,
  User,
  Home,
  Info,
  Download,
  Eye,
  Check,
  Edit,
  X,
  Save,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ContractDetailDialogProps {
  contractId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContractDetailDialog({ contractId, open, onOpenChange }: ContractDetailDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [contractFileUrl, setContractFileUrl] = useState("");
  const [editingTenant, setEditingTenant] = useState(false);
  const [editingOwner, setEditingOwner] = useState(false);
  const [tenantFormData, setTenantFormData] = useState<any>({});
  const [ownerFormData, setOwnerFormData] = useState<any>({});

  // Fetch contract details
  const { data, isLoading } = useQuery({
    queryKey: ['/api/external/contracts', contractId],
    enabled: !!contractId && open,
    staleTime: 0,
  });

  const contract = data?.contract;
  const unit = data?.unit;
  const tenantForm = data?.tenantForm;
  const ownerForm = data?.ownerForm;

  // Initialize form data when tenant/owner data loads
  useEffect(() => {
    if (tenantForm?.tenantData) {
      setTenantFormData(tenantForm.tenantData);
    }
  }, [tenantForm]);

  useEffect(() => {
    if (ownerForm?.ownerData) {
      setOwnerFormData(ownerForm.ownerData);
    }
  }, [ownerForm]);

  // Update tenant data mutation
  const updateTenantDataMutation = useMutation({
    mutationFn: async (tenantData: any) => {
      return apiRequest(`/api/external/contracts/${contractId}/update-tenant-data`, {
        method: 'PATCH',
        body: { tenantData },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/contracts', contractId] });
      setEditingTenant(false);
      toast({
        title: language === "es" ? "Datos actualizados" : "Data updated",
        description: language === "es" 
          ? "Los datos del inquilino han sido actualizados correctamente" 
          : "Tenant data has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudieron actualizar los datos" : "Could not update data"),
        variant: "destructive",
      });
    },
  });

  // Update owner data mutation
  const updateOwnerDataMutation = useMutation({
    mutationFn: async (ownerData: any) => {
      return apiRequest(`/api/external/contracts/${contractId}/update-owner-data`, {
        method: 'PATCH',
        body: { ownerData },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/contracts', contractId] });
      setEditingOwner(false);
      toast({
        title: language === "es" ? "Datos actualizados" : "Data updated",
        description: language === "es" 
          ? "Los datos del propietario han sido actualizados correctamente" 
          : "Owner data has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudieron actualizar los datos" : "Could not update data"),
        variant: "destructive",
      });
    },
  });

  // Validate tenant documents mutation
  const validateTenantDocsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/external/contracts/${contractId}/validate-documents`, {
        method: 'PATCH',
        body: { documentType: 'tenant' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/contracts', contractId] });
      toast({
        title: language === "es" ? "Documentos validados" : "Documents validated",
        description: language === "es" 
          ? "Los documentos del inquilino han sido validados correctamente" 
          : "Tenant documents have been validated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudieron validar los documentos" : "Could not validate documents"),
        variant: "destructive",
      });
    },
  });

  // Validate owner documents mutation
  const validateOwnerDocsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/external/contracts/${contractId}/validate-documents`, {
        method: 'PATCH',
        body: { documentType: 'owner' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/contracts', contractId] });
      toast({
        title: language === "es" ? "Documentos validados" : "Documents validated",
        description: language === "es" 
          ? "Los documentos del propietario han sido validados correctamente" 
          : "Owner documents have been validated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudieron validar los documentos" : "Could not validate documents"),
        variant: "destructive",
      });
    },
  });

  // Upload contract mutation
  const uploadContractMutation = useMutation({
    mutationFn: async () => {
      if (!contractFileUrl.trim()) {
        throw new Error(language === "es" ? "Por favor ingrese la URL del contrato" : "Please enter the contract URL");
      }
      return apiRequest(`/api/external/contracts/${contractId}/upload-contract`, {
        method: 'PATCH',
        body: { contractUrl: contractFileUrl },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/contracts', contractId] });
      toast({
        title: language === "es" ? "Contrato subido" : "Contract uploaded",
        description: language === "es" 
          ? "El contrato elaborado ha sido subido correctamente" 
          : "Elaborated contract has been uploaded successfully",
      });
      setContractFileUrl("");
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo subir el contrato" : "Could not upload contract"),
        variant: "destructive",
      });
    },
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, Record<string, string>> = {
      pending_validation: { es: "Pendiente Validación", en: "Pending Validation" },
      documents_validated: { es: "Documentos Validados", en: "Documents Validated" },
      contract_uploaded: { es: "Contrato Subido", en: "Contract Uploaded" },
      active: { es: "Activo", en: "Active" },
      completed: { es: "Completado", en: "Completed" },
      cancelled: { es: "Cancelado", en: "Cancelled" },
    };
    return labels[status]?.[language] || status;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending_validation": return "outline";
      case "documents_validated": return "secondary";
      case "contract_uploaded": return "default";
      case "active": return "default";
      case "completed": return "secondary";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  const renderDocumentLink = (url: string | null | undefined, label: string) => {
    if (!url) {
      return (
        <div className="text-sm text-muted-foreground">
          {language === "es" ? "No disponible" : "Not available"}
        </div>
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary hover:underline flex items-center gap-1"
      >
        <Eye className="h-3 w-3" />
        {label}
      </a>
    );
  };

  const handleStartEditTenant = () => {
    setTenantFormData(tenantForm?.tenantData || {});
    setEditingTenant(true);
  };

  const handleCancelEditTenant = () => {
    setTenantFormData(tenantForm?.tenantData || {});
    setEditingTenant(false);
  };

  const handleStartEditOwner = () => {
    setOwnerFormData(ownerForm?.ownerData || {});
    setEditingOwner(true);
  };

  const handleCancelEditOwner = () => {
    setOwnerFormData(ownerForm?.ownerData || {});
    setEditingOwner(false);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <Skeleton className="h-8 w-64" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!contract) {
    return null;
  }

  const tenantData = tenantForm?.tenantData as any;
  const ownerData = ownerForm?.ownerData as any;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {language === "es" ? "Detalles del Contrato" : "Contract Details"}
            </DialogTitle>
            <Badge variant={getStatusVariant(contract.status)}>
              {getStatusLabel(contract.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                {language === "es" ? "Información General" : "General Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  {language === "es" ? "Inquilino" : "Tenant"}
                </div>
                <div className="text-base font-semibold">{contract.tenantName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  {language === "es" ? "Propiedad" : "Property"}
                </div>
                <div className="text-base font-semibold">
                  {language === "es" ? "Unidad" : "Unit"} {unit?.unit_number || unit?.unitNumber || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  {language === "es" ? "Renta Mensual" : "Monthly Rent"}
                </div>
                <div className="text-base font-semibold">
                  ${contract.monthlyRent} {contract.currency}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  {language === "es" ? "Duración" : "Duration"}
                </div>
                <div className="text-base font-semibold">
                  {contract.leaseDurationMonths} {language === "es" ? "meses" : "months"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  {language === "es" ? "Fecha Inicio" : "Start Date"}
                </div>
                <div className="text-base">
                  {format(new Date(contract.startDate), "dd/MM/yyyy", {
                    locale: language === "es" ? es : enUS,
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  {language === "es" ? "Fecha Fin" : "End Date"}
                </div>
                <div className="text-base">
                  {format(new Date(contract.endDate), "dd/MM/yyyy", {
                    locale: language === "es" ? es : enUS,
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forms and Documents */}
          <Tabs defaultValue="tenant" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tenant">
                {language === "es" ? "Formulario Inquilino" : "Tenant Form"}
              </TabsTrigger>
              <TabsTrigger value="owner">
                {language === "es" ? "Formulario Propietario" : "Owner Form"}
              </TabsTrigger>
            </TabsList>

            {/* Tenant Form Tab */}
            <TabsContent value="tenant" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {language === "es" ? "Información del Inquilino" : "Tenant Information"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {editingTenant ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEditTenant}
                            data-testid="button-cancel-edit-tenant"
                          >
                            <X className="h-4 w-4 mr-2" />
                            {language === "es" ? "Cancelar" : "Cancel"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateTenantDataMutation.mutate(tenantFormData)}
                            disabled={updateTenantDataMutation.isPending}
                            data-testid="button-save-tenant"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {language === "es" ? "Guardar" : "Save"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleStartEditTenant}
                            data-testid="button-edit-tenant"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {language === "es" ? "Editar" : "Edit"}
                          </Button>
                          {contract.tenantDocsValidated ? (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {language === "es" ? "Validado" : "Validated"}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => validateTenantDocsMutation.mutate()}
                              disabled={validateTenantDocsMutation.isPending}
                              data-testid="button-validate-tenant"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              {language === "es" ? "Validar Documentos" : "Validate Documents"}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {tenantData && (
                    <>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          {language === "es" ? "Nombre Completo" : "Full Name"}
                        </div>
                        {editingTenant ? (
                          <Input
                            value={tenantFormData.fullName || ""}
                            onChange={(e) => setTenantFormData({ ...tenantFormData, fullName: e.target.value })}
                            data-testid="input-tenant-fullname"
                          />
                        ) : (
                          <div className="text-base">{tenantData.fullName || "N/A"}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                        {editingTenant ? (
                          <Input
                            type="email"
                            value={tenantFormData.email || ""}
                            onChange={(e) => setTenantFormData({ ...tenantFormData, email: e.target.value })}
                            data-testid="input-tenant-email"
                          />
                        ) : (
                          <div className="text-base">{tenantData.email || "N/A"}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">WhatsApp</div>
                        {editingTenant ? (
                          <Input
                            value={tenantFormData.whatsapp || ""}
                            onChange={(e) => setTenantFormData({ ...tenantFormData, whatsapp: e.target.value })}
                            data-testid="input-tenant-whatsapp"
                          />
                        ) : (
                          <div className="text-base">{tenantData.whatsapp || "N/A"}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          {language === "es" ? "Nacionalidad" : "Nationality"}
                        </div>
                        {editingTenant ? (
                          <Input
                            value={tenantFormData.nationality || ""}
                            onChange={(e) => setTenantFormData({ ...tenantFormData, nationality: e.target.value })}
                            data-testid="input-tenant-nationality"
                          />
                        ) : (
                          <div className="text-base">{tenantData.nationality || "N/A"}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          {language === "es" ? "Edad" : "Age"}
                        </div>
                        {editingTenant ? (
                          <Input
                            type="number"
                            value={tenantFormData.age || ""}
                            onChange={(e) => setTenantFormData({ ...tenantFormData, age: e.target.value })}
                            data-testid="input-tenant-age"
                          />
                        ) : (
                          <div className="text-base">{tenantData.age || "N/A"}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          {language === "es" ? "Ocupación" : "Occupation"}
                        </div>
                        {editingTenant ? (
                          <Input
                            value={tenantFormData.occupation || ""}
                            onChange={(e) => setTenantFormData({ ...tenantFormData, occupation: e.target.value })}
                            data-testid="input-tenant-occupation"
                          />
                        ) : (
                          <div className="text-base">{tenantData.occupation || "N/A"}</div>
                        )}
                      </div>
                      
                      <Separator className="col-span-2" />
                      
                      <div className="col-span-2">
                        <div className="text-sm font-semibold mb-3">
                          {language === "es" ? "Documentos" : "Documents"}
                        </div>
                        <div className="grid gap-2 md:grid-cols-3">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {language === "es" ? "Identificación" : "ID"}
                            </div>
                            {renderDocumentLink(tenantData.idDocument, language === "es" ? "Ver ID" : "View ID")}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {language === "es" ? "Comp. Domicilio" : "Proof of Address"}
                            </div>
                            {renderDocumentLink(tenantData.proofOfAddress, language === "es" ? "Ver Comprobante" : "View Proof")}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {language === "es" ? "Comp. Ingresos" : "Proof of Income"}
                            </div>
                            {renderDocumentLink(tenantData.proofOfIncome, language === "es" ? "Ver Comprobante" : "View Proof")}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Owner Form Tab */}
            <TabsContent value="owner" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      {language === "es" ? "Información del Propietario" : "Owner Information"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {editingOwner ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEditOwner}
                            data-testid="button-cancel-edit-owner"
                          >
                            <X className="h-4 w-4 mr-2" />
                            {language === "es" ? "Cancelar" : "Cancel"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateOwnerDataMutation.mutate(ownerFormData)}
                            disabled={updateOwnerDataMutation.isPending}
                            data-testid="button-save-owner"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {language === "es" ? "Guardar" : "Save"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleStartEditOwner}
                            data-testid="button-edit-owner"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {language === "es" ? "Editar" : "Edit"}
                          </Button>
                          {contract.ownerDocsValidated ? (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {language === "es" ? "Validado" : "Validated"}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => validateOwnerDocsMutation.mutate()}
                              disabled={validateOwnerDocsMutation.isPending}
                              data-testid="button-validate-owner"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              {language === "es" ? "Validar Documentos" : "Validate Documents"}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {ownerData && (
                    <>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          {language === "es" ? "Nombre Completo" : "Full Name"}
                        </div>
                        {editingOwner ? (
                          <Input
                            value={ownerFormData.fullName || ""}
                            onChange={(e) => setOwnerFormData({ ...ownerFormData, fullName: e.target.value })}
                            data-testid="input-owner-fullname"
                          />
                        ) : (
                          <div className="text-base">{ownerData.fullName || "N/A"}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                        {editingOwner ? (
                          <Input
                            type="email"
                            value={ownerFormData.email || ""}
                            onChange={(e) => setOwnerFormData({ ...ownerFormData, email: e.target.value })}
                            data-testid="input-owner-email"
                          />
                        ) : (
                          <div className="text-base">{ownerData.email || "N/A"}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">WhatsApp</div>
                        {editingOwner ? (
                          <Input
                            value={ownerFormData.whatsapp || ""}
                            onChange={(e) => setOwnerFormData({ ...ownerFormData, whatsapp: e.target.value })}
                            data-testid="input-owner-whatsapp"
                          />
                        ) : (
                          <div className="text-base">{ownerData.whatsapp || "N/A"}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          {language === "es" ? "Nacionalidad" : "Nationality"}
                        </div>
                        {editingOwner ? (
                          <Input
                            value={ownerFormData.nationality || ""}
                            onChange={(e) => setOwnerFormData({ ...ownerFormData, nationality: e.target.value })}
                            data-testid="input-owner-nationality"
                          />
                        ) : (
                          <div className="text-base">{ownerData.nationality || "N/A"}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          {language === "es" ? "Banco" : "Bank"}
                        </div>
                        {editingOwner ? (
                          <Input
                            value={ownerFormData.bankName || ""}
                            onChange={(e) => setOwnerFormData({ ...ownerFormData, bankName: e.target.value })}
                            data-testid="input-owner-bank"
                          />
                        ) : (
                          <div className="text-base">{ownerData.bankName || "N/A"}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          {language === "es" ? "Cuenta" : "Account Number"}
                        </div>
                        {editingOwner ? (
                          <Input
                            value={ownerFormData.accountNumber || ""}
                            onChange={(e) => setOwnerFormData({ ...ownerFormData, accountNumber: e.target.value })}
                            data-testid="input-owner-account"
                          />
                        ) : (
                          <div className="text-base">{ownerData.accountNumber || "N/A"}</div>
                        )}
                      </div>
                      
                      <Separator className="col-span-2" />
                      
                      <div className="col-span-2">
                        <div className="text-sm font-semibold mb-3">
                          {language === "es" ? "Documentos" : "Documents"}
                        </div>
                        <div className="grid gap-2 md:grid-cols-3">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {language === "es" ? "Escritura" : "Property Deed"}
                            </div>
                            {renderDocumentLink(ownerData.propertyDeed, language === "es" ? "Ver Escritura" : "View Deed")}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {language === "es" ? "RFC" : "Tax ID"}
                            </div>
                            {renderDocumentLink(ownerData.taxId, language === "es" ? "Ver RFC" : "View Tax ID")}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {language === "es" ? "Comp. Propiedad" : "Proof of Ownership"}
                            </div>
                            {renderDocumentLink(ownerData.proofOfOwnership, language === "es" ? "Ver Comprobante" : "View Proof")}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Upload Elaborated Contract */}
          {contract.status !== 'pending_validation' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  {language === "es" ? "Contrato Elaborado" : "Elaborated Contract"}
                </CardTitle>
                <CardDescription>
                  {language === "es"
                    ? "Sube el contrato final elaborado por el abogado"
                    : "Upload the final contract elaborated by the lawyer"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.elaboratedContractUrl ? (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="font-medium">
                        {language === "es" ? "Contrato subido" : "Contract uploaded"}
                      </span>
                    </div>
                    <a
                      href={contract.elaboratedContractUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      {language === "es" ? "Descargar" : "Download"}
                    </a>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder={language === "es" ? "URL del contrato..." : "Contract URL..."}
                      value={contractFileUrl}
                      onChange={(e) => setContractFileUrl(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md"
                      data-testid="input-contract-url"
                    />
                    <Button
                      onClick={() => uploadContractMutation.mutate()}
                      disabled={uploadContractMutation.isPending || !contractFileUrl.trim()}
                      data-testid="button-upload-contract"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {language === "es" ? "Subir" : "Upload"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
