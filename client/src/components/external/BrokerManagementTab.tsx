import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  LayoutGrid,
  Table as TableIcon,
  Mail,
  Phone,
  Building2,
  User,
  DollarSign,
  Loader2,
  ChevronUp,
  ChevronDown,
  Copy,
  Users,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobile } from "@/hooks/use-mobile";
import { useDebounce } from "@/hooks/useDebounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalBroker } from "@shared/schema";
import { insertExternalBrokerSchema, updateExternalBrokerSchema } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";

type BrokerFormData = z.infer<typeof insertExternalBrokerSchema>;
type EditBrokerFormData = z.infer<typeof updateExternalBrokerSchema>;

type SortField = "firstName" | "lastName" | "email" | "company" | "commissionRate" | "status" | "createdAt";
type SortOrder = "asc" | "desc";

interface BrokersResponse {
  brokers: ExternalBroker[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function BrokerManagementTab() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const isMobile = useMobile();

  const [viewMode, setViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<ExternalBroker | null>(null);

  const { data: brokersData, isLoading, error } = useQuery<BrokersResponse>({
    queryKey: ["/api/external-brokers", { 
      search: debouncedSearchTerm, 
      status: statusFilter,
      sortBy,
      sortOrder,
      page: currentPage,
      limit: pageSize
    }],
  });

  const brokers = brokersData?.brokers || [];
  const pagination = brokersData?.pagination;

  const createForm = useForm<BrokerFormData>({
    resolver: zodResolver(insertExternalBrokerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      commissionRate: "20",
      status: "active",
      notes: "",
    },
  });

  const editForm = useForm<EditBrokerFormData>({
    resolver: zodResolver(updateExternalBrokerSchema),
    defaultValues: {},
  });

  const createMutation = useMutation({
    mutationFn: async (data: BrokerFormData) => {
      return apiRequest("/api/external-brokers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-brokers"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: language === "es" ? "Broker creado" : "Broker created",
        description: language === "es" ? "El broker ha sido creado exitosamente" : "The broker has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo crear el broker" : "Could not create the broker"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EditBrokerFormData & { id: string }) => {
      const { id, ...updateData } = data;
      return apiRequest(`/api/external-brokers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-brokers"] });
      setIsEditDialogOpen(false);
      setSelectedBroker(null);
      editForm.reset();
      toast({
        title: language === "es" ? "Broker actualizado" : "Broker updated",
        description: language === "es" ? "El broker ha sido actualizado exitosamente" : "The broker has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo actualizar el broker" : "Could not update the broker"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/external-brokers/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-brokers"] });
      setIsDeleteDialogOpen(false);
      setSelectedBroker(null);
      toast({
        title: language === "es" ? "Broker eliminado" : "Broker deleted",
        description: language === "es" ? "El broker ha sido eliminado exitosamente" : "The broker has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo eliminar el broker" : "Could not delete the broker"),
        variant: "destructive",
      });
    },
  });

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleEditClick = (broker: ExternalBroker) => {
    setSelectedBroker(broker);
    editForm.reset({
      firstName: broker.firstName,
      lastName: broker.lastName || "",
      email: broker.email || "",
      phone: broker.phone || "",
      company: broker.company || "",
      commissionRate: broker.commissionRate || "20",
      status: broker.status,
      notes: broker.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (broker: ExternalBroker) => {
    setSelectedBroker(broker);
    setIsDeleteDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: language === "es" ? "Copiado" : "Copied",
      description: language === "es" ? "Copiado al portapapeles" : "Copied to clipboard",
    });
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMM yyyy", {
      locale: language === "es" ? es : enUS,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: language === "es" ? "Activo" : "Active", variant: "default" },
      inactive: { label: language === "es" ? "Inactivo" : "Inactive", variant: "secondary" },
      blocked: { label: language === "es" ? "Bloqueado" : "Blocked", variant: "destructive" },
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSourceBadge = (source: string | null | undefined) => {
    if (source === "seller_invite") {
      return (
        <Badge variant="outline" className="text-xs">
          {language === "es" ? "Referido" : "Referred"}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        {language === "es" ? "Público" : "Public"}
      </Badge>
    );
  };

  const getTermsBadge = (broker: ExternalBroker) => {
    if (broker.termsAcceptedAt) {
      return (
        <Badge variant="default" className="text-xs bg-green-600">
          {language === "es" ? "Aceptados" : "Accepted"}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        {language === "es" ? "Pendiente" : "Pending"}
      </Badge>
    );
  };

  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead
      className="cursor-pointer hover-elevate select-none"
      onClick={() => handleSort(field)}
      data-testid={`sort-header-${field}`}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === field && (
          sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  );

  const BrokerFormFields = ({ form, isEdit = false }: { form: any; isEdit?: boolean }) => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{language === "es" ? "Nombre" : "First Name"} *</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-broker-firstname" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{language === "es" ? "Apellido" : "Last Name"}</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-broker-lastname" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{language === "es" ? "Correo electrónico" : "Email"}</FormLabel>
            <FormControl>
              <Input type="email" {...field} data-testid="input-broker-email" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{language === "es" ? "Teléfono" : "Phone"}</FormLabel>
            <FormControl>
              <Input {...field} data-testid="input-broker-phone" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="company"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{language === "es" ? "Empresa / Agencia" : "Company / Agency"}</FormLabel>
            <FormControl>
              <Input {...field} data-testid="input-broker-company" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="commissionRate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{language === "es" ? "Tasa de comisión (%)" : "Commission Rate (%)"}</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                max="100" 
                step="0.5"
                {...field} 
                data-testid="input-broker-commission" 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{language === "es" ? "Estado" : "Status"}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-broker-status">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="active">{language === "es" ? "Activo" : "Active"}</SelectItem>
                <SelectItem value="inactive">{language === "es" ? "Inactivo" : "Inactive"}</SelectItem>
                <SelectItem value="blocked">{language === "es" ? "Bloqueado" : "Blocked"}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{language === "es" ? "Notas" : "Notes"}</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                rows={3}
                placeholder={language === "es" ? "Notas adicionales sobre el broker..." : "Additional notes about the broker..."}
                data-testid="input-broker-notes" 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const BrokerCard = ({ broker }: { broker: ExternalBroker }) => (
    <Card className="hover-elevate" data-testid={`card-broker-${broker.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium truncate">
                {broker.firstName} {broker.lastName}
              </span>
              {getStatusBadge(broker.status)}
            </div>

            {broker.company && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{broker.company}</span>
              </div>
            )}

            {broker.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Mail className="h-3 w-3" />
                <span className="truncate">{broker.email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => copyToClipboard(broker.email!)}
                  data-testid={`copy-email-${broker.id}`}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}

            {broker.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Phone className="h-3 w-3" />
                <span>{broker.phone}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-green-600"
                  onClick={() => openWhatsApp(broker.phone!)}
                  data-testid={`whatsapp-${broker.id}`}
                >
                  <SiWhatsapp className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <DollarSign className="h-3 w-3" />
              <span>{language === "es" ? "Comisión:" : "Commission:"} {broker.commissionRate}%</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {getSourceBadge(broker.registrationSource)}
              {getTermsBadge(broker)}
              {broker.isFreelancer && (
                <Badge variant="outline" className="text-xs">
                  Freelancer
                </Badge>
              )}
            </div>

            <div className="text-xs text-muted-foreground mt-2">
              {language === "es" ? "Registrado:" : "Registered:"} {formatDate(broker.createdAt)}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid={`menu-broker-${broker.id}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditClick(broker)} data-testid={`edit-broker-${broker.id}`}>
                <Pencil className="h-4 w-4 mr-2" />
                {language === "es" ? "Editar" : "Edit"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteClick(broker)} 
                className="text-destructive"
                data-testid={`delete-broker-${broker.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {language === "es" ? "Eliminar" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  const DialogWrapper = isMobile ? Drawer : Dialog;
  const DialogContentWrapper = isMobile ? DrawerContent : DialogContent;
  const DialogHeaderWrapper = isMobile ? DrawerHeader : DialogHeader;
  const DialogTitleWrapper = isMobile ? DrawerTitle : DialogTitle;
  const DialogDescriptionWrapper = isMobile ? DrawerDescription : DialogDescription;
  const DialogFooterWrapper = isMobile ? DrawerFooter : DialogFooter;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={language === "es" ? "Buscar brokers..." : "Search brokers..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-brokers"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
              <SelectValue placeholder={language === "es" ? "Estado" : "Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
              <SelectItem value="active">{language === "es" ? "Activos" : "Active"}</SelectItem>
              <SelectItem value="inactive">{language === "es" ? "Inactivos" : "Inactive"}</SelectItem>
              <SelectItem value="blocked">{language === "es" ? "Bloqueados" : "Blocked"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {!isMobile && (
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("cards")}
                data-testid="view-cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("table")}
                data-testid="view-table"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-broker">
            <Plus className="h-4 w-4 mr-2" />
            {language === "es" ? "Nuevo Broker" : "New Broker"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {language === "es" ? "Error al cargar los brokers" : "Error loading brokers"}
          </CardContent>
        </Card>
      ) : brokers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? (language === "es" ? "No se encontraron brokers con esos criterios" : "No brokers found with those criteria")
                : (language === "es" ? "No hay brokers registrados" : "No brokers registered")}
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setIsCreateDialogOpen(true)}
              data-testid="button-create-first-broker"
            >
              <Plus className="h-4 w-4 mr-2" />
              {language === "es" ? "Registrar primer broker" : "Register first broker"}
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "cards" || isMobile ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brokers.map((broker) => (
            <BrokerCard key={broker.id} broker={broker} />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="firstName" label={language === "es" ? "Nombre" : "Name"} />
                <SortableHeader field="company" label={language === "es" ? "Empresa" : "Company"} />
                <TableHead>{language === "es" ? "Contacto" : "Contact"}</TableHead>
                <SortableHeader field="commissionRate" label={language === "es" ? "Comisión" : "Commission"} />
                <TableHead>{language === "es" ? "Fuente" : "Source"}</TableHead>
                <TableHead>{language === "es" ? "Términos" : "Terms"}</TableHead>
                <SortableHeader field="status" label={language === "es" ? "Estado" : "Status"} />
                <SortableHeader field="createdAt" label={language === "es" ? "Fecha" : "Date"} />
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brokers.map((broker) => (
                <TableRow key={broker.id} data-testid={`row-broker-${broker.id}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {broker.firstName} {broker.lastName}
                      {broker.isFreelancer && (
                        <Badge variant="outline" className="text-xs">
                          Freelancer
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{broker.company || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {broker.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{broker.email}</span>
                        </div>
                      )}
                      {broker.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{broker.phone}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-green-600"
                            onClick={() => openWhatsApp(broker.phone!)}
                            data-testid={`whatsapp-table-${broker.id}`}
                          >
                            <SiWhatsapp className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{broker.commissionRate}%</TableCell>
                  <TableCell>{getSourceBadge(broker.registrationSource)}</TableCell>
                  <TableCell>{getTermsBadge(broker)}</TableCell>
                  <TableCell>{getStatusBadge(broker.status)}</TableCell>
                  <TableCell>{formatDate(broker.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`menu-table-broker-${broker.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(broker)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          {language === "es" ? "Editar" : "Edit"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(broker)} 
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {language === "es" ? "Eliminar" : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {pagination && pagination.totalPages > 1 && (
        <ExternalPaginationControls
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          pageSize={pageSize}
          totalItems={pagination.total}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      <DialogWrapper open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContentWrapper className={isMobile ? "" : "max-w-md"}>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}>
              <DialogHeaderWrapper>
                <DialogTitleWrapper>
                  {language === "es" ? "Nuevo Broker" : "New Broker"}
                </DialogTitleWrapper>
                <DialogDescriptionWrapper>
                  {language === "es" 
                    ? "Registra un nuevo broker externo para seguimiento de comisiones" 
                    : "Register a new external broker for commission tracking"}
                </DialogDescriptionWrapper>
              </DialogHeaderWrapper>

              <BrokerFormFields form={createForm} />

              <DialogFooterWrapper className={isMobile ? "flex-col gap-2" : ""}>
                {isMobile && (
                  <DrawerClose asChild>
                    <Button variant="outline" type="button" data-testid="cancel-create-broker">
                      {language === "es" ? "Cancelar" : "Cancel"}
                    </Button>
                  </DrawerClose>
                )}
                <Button type="submit" disabled={createMutation.isPending} data-testid="submit-create-broker">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {language === "es" ? "Crear Broker" : "Create Broker"}
                </Button>
              </DialogFooterWrapper>
            </form>
          </Form>
        </DialogContentWrapper>
      </DialogWrapper>

      <DialogWrapper open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContentWrapper className={isMobile ? "" : "max-w-md"}>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => 
              selectedBroker && updateMutation.mutate({ ...data, id: selectedBroker.id })
            )}>
              <DialogHeaderWrapper>
                <DialogTitleWrapper>
                  {language === "es" ? "Editar Broker" : "Edit Broker"}
                </DialogTitleWrapper>
                <DialogDescriptionWrapper>
                  {language === "es" 
                    ? "Actualiza la información del broker" 
                    : "Update broker information"}
                </DialogDescriptionWrapper>
              </DialogHeaderWrapper>

              <BrokerFormFields form={editForm} isEdit />

              <DialogFooterWrapper className={isMobile ? "flex-col gap-2" : ""}>
                {isMobile && (
                  <DrawerClose asChild>
                    <Button variant="outline" type="button" data-testid="cancel-edit-broker">
                      {language === "es" ? "Cancelar" : "Cancel"}
                    </Button>
                  </DrawerClose>
                )}
                <Button type="submit" disabled={updateMutation.isPending} data-testid="submit-edit-broker">
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {language === "es" ? "Guardar Cambios" : "Save Changes"}
                </Button>
              </DialogFooterWrapper>
            </form>
          </Form>
        </DialogContentWrapper>
      </DialogWrapper>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Eliminar Broker" : "Delete Broker"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? `¿Estás seguro de que deseas eliminar a ${selectedBroker?.firstName} ${selectedBroker?.lastName}? Esta acción no se puede deshacer.`
                : `Are you sure you want to delete ${selectedBroker?.firstName} ${selectedBroker?.lastName}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              data-testid="cancel-delete-broker"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedBroker && deleteMutation.mutate(selectedBroker.id)}
              disabled={deleteMutation.isPending}
              data-testid="confirm-delete-broker"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "es" ? "Eliminar" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
