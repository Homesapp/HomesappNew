import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Eye, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import ContractDetailDialog from "./ContractDetailDialog";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";

interface ExternalContractProcessesProps {
  searchTerm: string;
  statusFilter: string;
  viewMode: string;
}

export default function ExternalContractProcesses({ searchTerm, statusFilter, viewMode }: ExternalContractProcessesProps) {
  const { language } = useLanguage();
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Fetch contracts from API
  const { data: contractsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/external/contracts'],
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
  });

  const contractProcesses: any[] = Array.isArray(contractsData) ? contractsData : [];

  const filteredProcesses = useMemo(() => {
    return contractProcesses.filter((item: any) => {
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
  }, [contractProcesses, searchTerm, statusFilter]);

  const sortedProcesses = useMemo(() => {
    if (!filteredProcesses || !sortColumn) return filteredProcesses;
    
    return [...filteredProcesses].sort((a: any, b: any) => {
      const contractA = a.contract;
      const contractB = b.contract;
      
      let aVal: any;
      let bVal: any;
      
      switch (sortColumn) {
        case "tenant":
          aVal = contractA.tenantName || "";
          bVal = contractB.tenantName || "";
          break;
        case "rent":
          aVal = contractA.monthlyRent || 0;
          bVal = contractB.monthlyRent || 0;
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        case "createdAt":
          aVal = new Date(contractA.createdAt).getTime();
          bVal = new Date(contractB.createdAt).getTime();
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        case "status":
          aVal = contractA.status || "";
          bVal = contractB.status || "";
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredProcesses, sortColumn, sortDirection]);

  const paginatedProcesses = useMemo(() => {
    if (!sortedProcesses) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedProcesses.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedProcesses, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil((sortedProcesses?.length || 0) / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, viewMode]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

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
        <>
          <ExternalPaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
            totalItems={sortedProcesses?.length || 0}
            language={language as 'en' | 'es'}
          />
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {paginatedProcesses.map((item: any) => {
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
        </>
      ) : (
        <div className="space-y-4">
          <ExternalPaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
            totalItems={sortedProcesses?.length || 0}
            language={language as 'en' | 'es'}
          />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("tenant")}
                    data-testid="sort-tenant"
                  >
                    <div className="flex items-center gap-2">
                      {language === "es" ? "Inquilino" : "Tenant"}
                      {getSortIcon("tenant")}
                    </div>
                  </TableHead>
                  <TableHead>{language === "es" ? "Propiedad" : "Property"}</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("rent")}
                    data-testid="sort-rent"
                  >
                    <div className="flex items-center gap-2">
                      {language === "es" ? "Renta" : "Rent"}
                      {getSortIcon("rent")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("createdAt")}
                    data-testid="sort-createdAt"
                  >
                    <div className="flex items-center gap-2">
                      {language === "es" ? "Creado" : "Created"}
                      {getSortIcon("createdAt")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("status")}
                    data-testid="sort-status"
                  >
                    <div className="flex items-center gap-2">
                      {language === "es" ? "Estado" : "Status"}
                      {getSortIcon("status")}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProcesses.map((item: any) => {
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
