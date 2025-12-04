import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { 
  FileText, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileSignature,
  Home,
  Calendar,
  DollarSign,
  User,
  Building,
  Download,
  Upload,
  Eye,
  ExternalLink,
  Users,
  FileCheck,
  History,
  MessageSquare,
  Paperclip,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Edit,
  Send,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMobile } from "@/hooks/use-mobile";
import ContractDocuments from "@/components/ContractDocuments";
import ContractTimeline from "@/components/ContractTimeline";

interface RentalContract {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  sellerId: string;
  status: "draft" | "apartado" | "firmado" | "check_in" | "activo" | "completado" | "cancelado";
  monthlyRent: string;
  leaseDurationMonths: number;
  depositAmount: string;
  administrativeFee: string;
  isForSublease: boolean;
  totalCommissionMonths: string;
  totalCommissionAmount: string;
  sellerCommissionPercent: string;
  referralCommissionPercent: string;
  homesappCommissionPercent: string;
  sellerCommissionAmount: string;
  referralCommissionAmount: string;
  homesappCommissionAmount: string;
  apartadoDate: string | null;
  contractSignedDate: string | null;
  checkInDate: string | null;
  leaseStartDate: string | null;
  leaseEndDate: string | null;
  payoutReleasedAt: string | null;
  ownerTermsSignedAt: string | null;
  tenantTermsSignedAt: string | null;
  notes: string | null;
  includedServices: string[] | null;
  createdAt: string;
  property?: { 
    id: string;
    title: string; 
    address: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    images?: string[];
  };
  tenant?: { 
    id: string;
    fullName: string; 
    email: string;
    phone?: string;
    profileImageUrl?: string;
  };
  owner?: { 
    id: string;
    fullName: string; 
    email: string;
    phone?: string;
    profileImageUrl?: string;
  };
  seller?: { 
    id: string;
    fullName: string; 
    email: string;
    phone?: string;
    profileImageUrl?: string;
  };
}

interface ContractEvent {
  id: string;
  type: "status_change" | "note" | "document" | "payment" | "action";
  title: string;
  description?: string;
  createdAt: string;
  userId?: string;
  userName?: string;
}

const STATUS_CONFIG = {
  draft: { 
    variant: "secondary" as const, 
    label: "Borrador", 
    icon: FileText,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    progress: 10,
  },
  apartado: { 
    variant: "outline" as const, 
    label: "Apartado", 
    icon: Clock,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    progress: 30,
  },
  firmado: { 
    variant: "outline" as const, 
    label: "Firmado", 
    icon: FileSignature,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    progress: 50,
  },
  check_in: { 
    variant: "outline" as const, 
    label: "Check-in", 
    icon: Home,
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    progress: 70,
  },
  activo: { 
    variant: "outline" as const, 
    label: "Activo", 
    icon: CheckCircle,
    color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    progress: 85,
  },
  completado: { 
    variant: "outline" as const, 
    label: "Completado", 
    icon: CheckCircle2,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    progress: 100,
  },
  cancelado: { 
    variant: "outline" as const, 
    label: "Cancelado", 
    icon: XCircle,
    color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    progress: 0,
  },
};

export default function AdminContractManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const isMobile = useMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("resumen");

  const { data: contracts, isLoading } = useQuery<RentalContract[]>({
    queryKey: [`/api/admin/rental-contracts`, statusFilter],
  });

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={`gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredContracts = contracts?.filter((contract) => {
    const matchesSearch = 
      (contract.property?.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.tenant?.fullName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.owner?.fullName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    const matchesType = typeFilter === "all" || 
      (typeFilter === "sublease" && contract.isForSublease) ||
      (typeFilter === "regular" && !contract.isForSublease);
    return matchesSearch && matchesStatus && matchesType;
  });

  const openContractDetail = (contract: RentalContract) => {
    setSelectedContract(contract);
    setActiveTab("resumen");
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedContract(null);
  };

  const getContractProgress = (contract: RentalContract) => {
    const config = STATUS_CONFIG[contract.status as keyof typeof STATUS_CONFIG];
    return config?.progress || 0;
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case "draft": return "Confirmar apartado";
      case "apartado": return "Firmar contrato";
      case "firmado": return "Registrar check-in";
      case "check_in": return "Activar contrato";
      case "activo": return "Completar";
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-page-title">
                Gestión de Contratos
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Administra el ciclo de vida de los contratos de renta
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" data-testid="button-export-contracts">
                <Download className="h-4 w-4 mr-2" />
                {!isMobile && "Exportar"}
              </Button>
              <Button data-testid="button-new-contract">
                <Plus className="h-4 w-4 mr-2" />
                {!isMobile && "Nuevo Contrato"}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por propiedad, inquilino, propietario o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-contracts"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="apartado">Apartado</SelectItem>
                  <SelectItem value="firmado">Firmado</SelectItem>
                  <SelectItem value="check_in">Check-in</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[160px]" data-testid="select-type-filter">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="regular">Arrendamiento</SelectItem>
                  <SelectItem value="sublease">Subarrendamiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{contracts?.length || 0}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Activos</p>
                  <p className="text-lg font-bold">
                    {contracts?.filter(c => c.status === "activo").length || 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-950 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">En proceso</p>
                  <p className="text-lg font-bold">
                    {contracts?.filter(c => ["draft", "apartado", "firmado", "check_in"].includes(c.status)).length || 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
                  <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Renta mensual</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(
                      contracts?.filter(c => c.status === "activo")
                        .reduce((sum, c) => sum + parseFloat(c.monthlyRent || "0"), 0) || 0,
                      "MXN"
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredContracts?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay contratos</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {searchTerm || statusFilter !== "all" 
                    ? "No se encontraron contratos con los filtros aplicados"
                    : "Aún no hay contratos registrados"}
                </p>
              </CardContent>
            </Card>
          ) : isMobile ? (
            <div className="space-y-3">
              {filteredContracts?.map((contract) => (
                <Card 
                  key={contract.id} 
                  className="hover-elevate cursor-pointer"
                  onClick={() => openContractDetail(contract)}
                  data-testid={`card-contract-${contract.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contract.property?.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {contract.property?.address}
                        </p>
                      </div>
                      {getStatusBadge(contract.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Inquilino</p>
                        <p className="font-medium truncate">{contract.tenant?.fullName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Renta</p>
                        <p className="font-medium">
                          {formatCurrency(parseFloat(contract.monthlyRent), "MXN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={getContractProgress(contract)} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground">
                        {getContractProgress(contract)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID / Propiedad</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Renta Mensual</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts?.map((contract) => (
                    <TableRow 
                      key={contract.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openContractDetail(contract)}
                      data-testid={`row-contract-${contract.id}`}
                    >
                      <TableCell>
                        <div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {contract.id.substring(0, 8)}...
                          </div>
                          <div className="font-medium">{contract.property?.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {contract.property?.address}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={contract.tenant?.profileImageUrl} />
                            <AvatarFallback>
                              {contract.tenant?.fullName?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{contract.tenant?.fullName}</div>
                            <div className="text-sm text-muted-foreground">{contract.tenant?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={contract.owner?.profileImageUrl} />
                            <AvatarFallback>
                              {contract.owner?.fullName?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{contract.owner?.fullName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(parseFloat(contract.monthlyRent), "MXN")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {contract.leaseDurationMonths} meses
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {contract.leaseStartDate && (
                            <div>
                              <span className="text-muted-foreground">Inicio: </span>
                              {format(new Date(contract.leaseStartDate), "dd/MM/yyyy")}
                            </div>
                          )}
                          {contract.leaseEndDate && (
                            <div>
                              <span className="text-muted-foreground">Fin: </span>
                              {format(new Date(contract.leaseEndDate), "dd/MM/yyyy")}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={getContractProgress(contract)} className="w-20" />
                          <span className="text-sm text-muted-foreground">
                            {getContractProgress(contract)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openContractDetail(contract);
                          }}
                          data-testid={`button-view-contract-${contract.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Contract Detail Sheet/Dialog */}
      {isMobile ? (
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-xl p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Detalle del Contrato</SheetTitle>
              <SheetDescription>
                {selectedContract?.property?.title}
              </SheetDescription>
            </SheetHeader>
            {selectedContract && (
              <ContractDetailContent 
                contract={selectedContract} 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isMobile={true}
              />
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalle del Contrato
              </DialogTitle>
              <DialogDescription>
                {selectedContract?.property?.title} - {selectedContract?.id.substring(0, 8)}
              </DialogDescription>
            </DialogHeader>
            {selectedContract && (
              <ContractDetailContent 
                contract={selectedContract} 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isMobile={false}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface ContractDetailContentProps {
  contract: RentalContract;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile: boolean;
}

function ContractDetailContent({ 
  contract, 
  activeTab, 
  setActiveTab, 
  isMobile,
}: ContractDetailContentProps) {
  const statusConfig = STATUS_CONFIG[contract.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  const getNextAction = (status: string) => {
    switch (status) {
      case "draft": return { label: "Confirmar apartado", nextStatus: "apartado" };
      case "apartado": return { label: "Firmar contrato", nextStatus: "firmado" };
      case "firmado": return { label: "Registrar check-in", nextStatus: "check_in" };
      case "check_in": return { label: "Activar contrato", nextStatus: "activo" };
      case "activo": return { label: "Completar contrato", nextStatus: "completado" };
      default: return null;
    }
  };

  const nextAction = getNextAction(contract.status);

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4 md:px-6">
          <TabsList className={`w-full justify-start ${isMobile ? "flex-wrap h-auto py-2 gap-1" : ""}`}>
            <TabsTrigger value="resumen" className="gap-1">
              <FileCheck className="h-4 w-4" />
              {!isMobile && "Resumen"}
            </TabsTrigger>
            <TabsTrigger value="partes" className="gap-1">
              <Users className="h-4 w-4" />
              {!isMobile && "Partes"}
            </TabsTrigger>
            <TabsTrigger value="propiedad" className="gap-1">
              <Building className="h-4 w-4" />
              {!isMobile && "Propiedad"}
            </TabsTrigger>
            <TabsTrigger value="finanzas" className="gap-1">
              <DollarSign className="h-4 w-4" />
              {!isMobile && "Finanzas"}
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-1">
              <Paperclip className="h-4 w-4" />
              {!isMobile && "Documentos"}
            </TabsTrigger>
            <TabsTrigger value="historial" className="gap-1">
              <History className="h-4 w-4" />
              {!isMobile && "Historial"}
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6">
            {/* Tab: Resumen */}
            <TabsContent value="resumen" className="m-0 space-y-4">
              {/* Status & Progress */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${statusConfig.color}`}>
                        <StatusIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estado actual</p>
                        <p className="text-xl font-bold">{statusConfig.label}</p>
                      </div>
                    </div>
                    <div className="flex-1 max-w-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progreso</span>
                        <span className="text-sm font-medium">{statusConfig.progress}%</span>
                      </div>
                      <Progress value={statusConfig.progress} className="h-2" />
                    </div>
                    {nextAction && (
                      <Button data-testid="button-next-action">
                        {nextAction.label}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Propiedad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="font-medium">{contract.property?.title}</p>
                    <p className="text-sm text-muted-foreground">{contract.property?.address}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Inquilino
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contract.tenant?.profileImageUrl} />
                        <AvatarFallback>{contract.tenant?.fullName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{contract.tenant?.fullName}</p>
                        <p className="text-sm text-muted-foreground">{contract.tenant?.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Renta Mensual
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(parseFloat(contract.monthlyRent), "MXN")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {contract.leaseDurationMonths} meses
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Dates */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fechas del Contrato
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Inicio</p>
                      <p className="font-medium">
                        {contract.leaseStartDate 
                          ? format(new Date(contract.leaseStartDate), "dd/MM/yyyy")
                          : "Pendiente"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fin</p>
                      <p className="font-medium">
                        {contract.leaseEndDate 
                          ? format(new Date(contract.leaseEndDate), "dd/MM/yyyy")
                          : "Pendiente"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check-in</p>
                      <p className="font-medium">
                        {contract.checkInDate 
                          ? format(new Date(contract.checkInDate), "dd/MM/yyyy")
                          : "Pendiente"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Depósito</p>
                      <p className="font-medium">
                        {formatCurrency(parseFloat(contract.depositAmount || "0"), "MXN")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" data-testid="button-generate-pdf">
                      <FileText className="h-4 w-4 mr-2" />
                      Generar PDF
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-upload-signed">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Firmado
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-view-portal">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ir al Portal
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-send-reminder">
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Recordatorio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Partes */}
            <TabsContent value="partes" className="m-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Inquilino
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={contract.tenant?.profileImageUrl} />
                      <AvatarFallback className="text-xl">
                        {contract.tenant?.fullName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nombre completo</p>
                        <p className="font-medium">{contract.tenant?.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{contract.tenant?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Teléfono</p>
                        <p className="font-medium">{contract.tenant?.phone || "No registrado"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Términos firmados</p>
                        <p className="font-medium">
                          {contract.tenantTermsSignedAt 
                            ? format(new Date(contract.tenantTermsSignedAt), "dd/MM/yyyy HH:mm")
                            : "Pendiente"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Propietario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={contract.owner?.profileImageUrl} />
                      <AvatarFallback className="text-xl">
                        {contract.owner?.fullName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nombre completo</p>
                        <p className="font-medium">{contract.owner?.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{contract.owner?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Teléfono</p>
                        <p className="font-medium">{contract.owner?.phone || "No registrado"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Términos firmados</p>
                        <p className="font-medium">
                          {contract.ownerTermsSignedAt 
                            ? format(new Date(contract.ownerTermsSignedAt), "dd/MM/yyyy HH:mm")
                            : "Pendiente"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {contract.seller && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Vendedor / Agente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={contract.seller?.profileImageUrl} />
                        <AvatarFallback className="text-xl">
                          {contract.seller?.fullName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Nombre completo</p>
                          <p className="font-medium">{contract.seller?.fullName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{contract.seller?.email}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Propiedad */}
            <TabsContent value="propiedad" className="m-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Información de la Propiedad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contract.property?.images?.[0] && (
                    <img 
                      src={contract.property.images[0]} 
                      alt={contract.property.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Título</p>
                      <p className="font-medium">{contract.property?.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p className="font-medium">{contract.property?.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p className="font-medium">{contract.property?.propertyType || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Recámaras</p>
                      <p className="font-medium">{contract.property?.bedrooms || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Baños</p>
                      <p className="font-medium">{contract.property?.bathrooms || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Área</p>
                      <p className="font-medium">{contract.property?.area ? `${contract.property.area} m²` : "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Condiciones del Contrato
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Duración</p>
                      <p className="font-medium">{contract.leaseDurationMonths} meses</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de renta</p>
                      <p className="font-medium">
                        {contract.isForSublease ? "Subarrendamiento" : "Arrendamiento directo"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Servicios incluidos</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {contract.includedServices?.length ? (
                          contract.includedServices.map((service, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">Ninguno</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Finanzas */}
            <TabsContent value="finanzas" className="m-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Términos Económicos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Renta Mensual</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(parseFloat(contract.monthlyRent), "MXN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Depósito</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(parseFloat(contract.depositAmount || "0"), "MXN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cuota Administrativa</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(parseFloat(contract.administrativeFee || "0"), "MXN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Contrato</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(
                          parseFloat(contract.monthlyRent) * contract.leaseDurationMonths,
                          "MXN"
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Comisiones</CardTitle>
                  <CardDescription>
                    Total: {formatCurrency(parseFloat(contract.totalCommissionAmount), "MXN")} 
                    ({contract.totalCommissionMonths} meses de renta)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Vendedor</p>
                          <p className="text-sm text-muted-foreground">
                            {contract.sellerCommissionPercent}% del total
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(parseFloat(contract.sellerCommissionAmount), "MXN")}
                      </p>
                    </div>

                    {parseFloat(contract.referralCommissionPercent || "0") > 0 && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Referido</p>
                            <p className="text-sm text-muted-foreground">
                              {contract.referralCommissionPercent}% del total
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(parseFloat(contract.referralCommissionAmount || "0"), "MXN")}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">HomesApp</p>
                          <p className="text-sm text-muted-foreground">
                            {contract.homesappCommissionPercent}% del total
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(parseFloat(contract.homesappCommissionAmount), "MXN")}
                      </p>
                    </div>
                  </div>

                  {contract.payoutReleasedAt && (
                    <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-950 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-300">
                          Pago liberado
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {format(new Date(contract.payoutReleasedAt), "dd 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Documentos */}
            <TabsContent value="documentos" className="m-0">
              <ContractDocuments contractId={contract.id} />
            </TabsContent>

            {/* Tab: Historial */}
            <TabsContent value="historial" className="m-0">
              <ContractTimeline 
                contractId={contract.id} 
                contractData={{
                  createdAt: contract.createdAt,
                  apartadoDate: contract.apartadoDate,
                  contractSignedDate: contract.contractSignedDate,
                  checkInDate: contract.checkInDate,
                  payoutReleasedAt: contract.payoutReleasedAt,
                  notes: contract.notes,
                }}
              />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
