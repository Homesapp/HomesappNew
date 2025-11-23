import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import ContractDetailDialog from "./ContractDetailDialog";

interface ExternalContractProcessesProps {
  searchTerm: string;
  statusFilter: string;
  viewMode: string;
}

export default function ExternalContractProcesses({ searchTerm, statusFilter, viewMode }: ExternalContractProcessesProps) {
  const { language } = useLanguage();
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  // Fetch contracts from API
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['/api/external/contracts'],
    staleTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
    refetchIntervalInBackground: false, // Pause polling when tab is hidden (80% traffic reduction)
  });

  const contractProcesses = contractsData || [];

  const filteredProcesses = contractProcesses.filter((item: any) => {
    const contract = item.contract;
    const unit = item.unit;
    const condominium = item.condominium;
    
    // Apply search filter
    const matchesSearch = !searchTerm || 
      contract.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(unit?.unit_number || unit?.unitNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      condominium?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    let matchesStatus = true;
    if (statusFilter && statusFilter !== "all") {
      matchesStatus = contract.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
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
      case "pending_validation":
        return "outline";
      case "documents_validated":
        return "secondary";
      case "contract_uploaded":
        return "default";
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <h2 className="text-2xl font-bold">
          {language === "es" ? "Procesos de Contrato" : "Contract Processes"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {language === "es"
            ? "Gestiona el proceso completo desde la oferta hasta la activación de la renta"
            : "Manage the complete process from offer to rental activation"}
        </p>
      </div>

      {filteredProcesses.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {language === "es" ? "No hay procesos de contrato" : "No contract processes"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === "es"
              ? "Los procesos de contrato aparecerán aquí cuando se completen ofertas y formularios de renta"
              : "Contract processes will appear here when offers and rental forms are completed"}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredProcesses.map((item: any) => {
            const contract = item.contract;
            const unit = item.unit;
            const condominium = item.condominium;
            
            return (
              <Card key={contract.id} className="hover-elevate" data-testid={`card-process-${contract.id}`}>
                <CardHeader>
                  <CardTitle className="text-base">{contract.tenantName}</CardTitle>
                  <CardDescription>
                    {language === "es" ? "Unidad" : "Unit"} {unit?.unit_number || unit?.unitNumber || "N/A"}
                    {condominium ? ` - ${condominium.name}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === "es" ? "Creado" : "Created"}
                    </span>
                    <span>
                      {format(new Date(contract.createdAt), "dd/MM/yyyy", {
                        locale: language === "es" ? es : enUS,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === "es" ? "Renta Mensual" : "Monthly Rent"}
                    </span>
                    <span className="font-medium">
                      ${contract.monthlyRent} {contract.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {language === "es" ? "Estado" : "Status"}
                    </span>
                    <div className="flex gap-2">
                      <Badge variant={getStatusVariant(contract.status)}>
                        {getStatusLabel(contract.status)}
                      </Badge>
                      {contract.cancelledAt && (
                        <Badge variant="destructive">
                          {language === "es" ? "Cancelado" : "Cancelled"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedContractId(contract.id)}
                    data-testid={`button-view-process-${contract.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {language === "es" ? "Ver Detalles" : "View Details"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === "es" ? "Inquilino" : "Tenant"}</TableHead>
                <TableHead>{language === "es" ? "Propiedad" : "Property"}</TableHead>
                <TableHead>{language === "es" ? "Renta" : "Rent"}</TableHead>
                <TableHead>{language === "es" ? "Creado" : "Created"}</TableHead>
                <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProcesses.map((item: any) => {
                const contract = item.contract;
                const unit = item.unit;
                const condominium = item.condominium;
                
                return (
                  <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                    <TableCell className="font-medium">{contract.tenantName}</TableCell>
                    <TableCell>
                      {language === "es" ? "Unidad" : "Unit"} {unit?.unit_number || unit?.unitNumber || "N/A"}
                      {condominium && <div className="text-xs text-muted-foreground">{condominium.name}</div>}
                    </TableCell>
                    <TableCell>
                      ${contract.monthlyRent} <span className="text-xs text-muted-foreground">{contract.currency}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(contract.createdAt), "dd/MM/yyyy", {
                        locale: language === "es" ? es : enUS,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant={getStatusVariant(contract.status)}>
                          {getStatusLabel(contract.status)}
                        </Badge>
                        {contract.cancelledAt && (
                          <Badge variant="destructive">
                            {language === "es" ? "Cancelado" : "Cancelled"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedContractId(contract.id)}
                        data-testid={`button-view-process-${contract.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {language === "es" ? "Ver" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ContractDetailDialog 
        contractId={selectedContractId}
        open={!!selectedContractId}
        onOpenChange={(open) => {
          if (!open) setSelectedContractId(null);
        }}
      />
    </>
  );
}
