import { useState, useEffect, useLayoutEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Filter,
  Search,
  X,
  MoreVertical,
  Pencil,
  Trash2,
  LayoutGrid,
  Table as TableIcon,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  Tag,
  FileText,
  UserCheck,
  Ban,
  CheckCheck,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalClient } from "@shared/schema";
import { insertExternalClientSchema } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";

type ClientFormData = z.infer<typeof insertExternalClientSchema>;

const editClientSchema = insertExternalClientSchema.partial();
type EditClientFormData = z.infer<typeof editClientSchema>;

type SortField = "name" | "email" | "phone" | "status" | "createdAt";
type SortOrder = "asc" | "desc";

export default function ExternalClients() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();
  const [, navigate] = useLocation();

  const [viewMode, setViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ExternalClient | null>(null);

  useLayoutEffect(() => {
    setViewMode(isMobile ? "cards" : "table");
  }, [isMobile]);

  const { data: clientsResponse, isLoading } = useQuery<{ data: ExternalClient[]; total: number; limit: number; offset: number; hasMore: boolean }>({
    queryKey: ["/api/external-clients", statusFilter, verifiedFilter, searchTerm, sortField, sortOrder, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (verifiedFilter !== "all") params.append("isVerified", verifiedFilter === "verified" ? "true" : "false");
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (sortField) params.append("sortField", sortField);
      if (sortOrder) params.append("sortOrder", sortOrder);
      params.append("limit", itemsPerPage.toString());
      params.append("offset", ((currentPage - 1) * itemsPerPage).toString());
      
      const response = await fetch(`/api/external-clients?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - clients change occasionally
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    keepPreviousData: true, // Smooth pagination
  });

  const clients = clientsResponse?.data || [];
  const totalClients = clientsResponse?.total || 0;

  // Backend handles all filtering, sorting, and pagination
  // No client-side processing needed
  const paginatedClients = clients;

  // Total pages based on server total (accounts for all filters)
  const totalPages = Math.max(1, Math.ceil(totalClients / itemsPerPage));

  useEffect(() => {
    const clampedPage = Math.min(currentPage, totalPages);
    if (clampedPage !== currentPage) {
      setCurrentPage(clampedPage);
    }
  }, [totalPages, currentPage]);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(insertExternalClientSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phoneCountryCode: "+52",
      phone: "",
      alternatePhone: "",
      dateOfBirth: undefined,
      nationality: "",
      idType: "",
      idNumber: "",
      idCountry: "",
      idExpirationDate: undefined,
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      preferredLanguage: "es",
      propertyTypePreference: "",
      budgetMin: undefined,
      budgetMax: undefined,
      bedroomsPreference: undefined,
      bathroomsPreference: undefined,
      status: "active",
      isVerified: false,
      source: "",
      notes: "",
      tags: [],
      firstContactDate: undefined,
      lastContactDate: undefined,
    },
  });

  const editForm = useForm<EditClientFormData>({
    resolver: zodResolver(editClientSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const res = await apiRequest("POST", "/api/external-clients", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients"] });
      toast({
        title: language === "es" ? "Cliente creado" : "Client created",
        description: language === "es" 
          ? "El cliente se ha creado exitosamente."
          : "Client has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo crear el cliente."
          : "Failed to create client."),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditClientFormData }) => {
      const res = await apiRequest("PATCH", `/api/external-clients/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients"] });
      toast({
        title: language === "es" ? "Cliente actualizado" : "Client updated",
        description: language === "es" 
          ? "El cliente se ha actualizado exitosamente."
          : "Client has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedClient(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo actualizar el cliente."
          : "Failed to update client."),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/external-clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients"] });
      toast({
        title: language === "es" ? "Cliente eliminado" : "Client deleted",
        description: language === "es" 
          ? "El cliente se ha eliminado exitosamente."
          : "Client has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedClient(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo eliminar el cliente."
          : "Failed to delete client."),
      });
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleEdit = (client: ExternalClient) => {
    navigate(`/external/clients/${client.id}`);
  };

  const handleDelete = (client: ExternalClient) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: string }) => (
    <TableHead 
      className="cursor-pointer hover-elevate text-sm font-normal"
      onClick={() => handleSort(field)}
      data-testid={`sort-${field}`}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: language === "es" ? "Activo" : "Active", variant: "default" as const },
      inactive: { label: language === "es" ? "Inactivo" : "Inactive", variant: "secondary" as const },
      archived: { label: language === "es" ? "Archivado" : "Archived", variant: "outline" as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.active;
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Clientes" : "Clients"}
          </h1>
          <p className="text-muted-foreground">
            {language === "es" 
              ? "Gestiona el registro de clientes e inquilinos"
              : "Manage client and tenant registration"}
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid="button-create-client"
        >
          <Plus className="mr-2 h-4 w-4" />
          {language === "es" ? "Nuevo Cliente" : "New Client"}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input - Always visible */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={language === "es" ? "Buscar por nombre, email o teléfono..." : "Search by name, email or phone..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            {/* Filter Button with Popover - Icon only */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="flex-shrink-0 relative"
                  data-testid="button-filters"
                >
                  <Filter className="h-4 w-4" />
                  {(statusFilter !== "all" || verifiedFilter !== "all") && (
                    <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {(statusFilter !== "all" ? 1 : 0) + (verifiedFilter !== "all" ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">
                      {language === 'es' ? 'Filtrar por' : 'Filter by'}
                    </h4>

                    {/* Estado Filter */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        {language === "es" ? "Estado" : "Status"}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={statusFilter === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter("all")}
                          data-testid="button-filter-status-all"
                        >
                          {language === "es" ? "Todos" : "All"}
                        </Button>
                        <Button
                          variant={statusFilter === "active" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter("active")}
                          data-testid="button-filter-status-active"
                        >
                          {language === "es" ? "Activos" : "Active"}
                        </Button>
                        <Button
                          variant={statusFilter === "inactive" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter("inactive")}
                          data-testid="button-filter-status-inactive"
                        >
                          {language === "es" ? "Inactivos" : "Inactive"}
                        </Button>
                        <Button
                          variant={statusFilter === "archived" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter("archived")}
                          data-testid="button-filter-status-archived"
                        >
                          {language === "es" ? "Archivados" : "Archived"}
                        </Button>
                      </div>
                    </div>

                    {/* Verificación Filter */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        {language === "es" ? "Verificación" : "Verification"}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={verifiedFilter === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setVerifiedFilter("all")}
                          data-testid="button-filter-verified-all"
                        >
                          {language === "es" ? "Todos" : "All"}
                        </Button>
                        <Button
                          variant={verifiedFilter === "verified" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setVerifiedFilter("verified")}
                          data-testid="button-filter-verified-verified"
                        >
                          {language === "es" ? "Verificados" : "Verified"}
                        </Button>
                        <Button
                          variant={verifiedFilter === "unverified" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setVerifiedFilter("unverified")}
                          data-testid="button-filter-verified-unverified"
                        >
                          {language === "es" ? "No Verificados" : "Unverified"}
                        </Button>
                      </div>
                    </div>
                  </div>

                {(statusFilter !== "all" || verifiedFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("all");
                      setVerifiedFilter("all");
                    }}
                    className="w-full"
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {language === "es" ? "Limpiar Filtros" : "Clear Filters"}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* View Mode Toggle - Desktop only */}
          {!isMobile && (
            <>
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="icon"
                className="flex-shrink-0"
                onClick={() => setViewMode("cards")}
                data-testid="button-view-cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon"
                className="flex-shrink-0"
                onClick={() => setViewMode("table")}
                data-testid="button-view-table"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </>
          )}
          </div>
        </CardContent>
      </Card>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === "es" ? "Cargando clientes..." : "Loading clients..."}
          </div>
        ) : filteredAndSortedClients.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {language === "es" ? "No se encontraron clientes" : "No clients found"}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Pagination Controls - Above Content */}
            <ExternalPaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
              language={language}
            />

            {viewMode === "cards" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedClients.map((client) => (
                  <Card key={client.id} className="hover-elevate" data-testid={`card-client-${client.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm">
                      {client.firstName} {client.lastName}
                    </CardTitle>
                  <div className="flex items-center gap-1">
                    {client.isVerified && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" data-testid={`icon-verified-${client.id}`} />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-menu-${client.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(client)} data-testid={`button-edit-${client.id}`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          {language === "es" ? "Editar" : "Edit"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(client)}
                          className="text-destructive"
                          data-testid={`button-delete-${client.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {language === "es" ? "Eliminar" : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate" data-testid={`text-email-${client.id}`}>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span data-testid={`text-phone-${client.id}`}>{client.phone}</span>
                    </div>
                  )}
                  {client.city && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span data-testid={`text-city-${client.id}`}>{client.city}</span>
                    </div>
                  )}
                  {client.source && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      <span className="capitalize" data-testid={`text-source-${client.id}`}>{client.source}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    {getStatusBadge(client.status)}
                    {client.preferredLanguage && (
                      <Badge variant="outline" className="text-xs uppercase">
                        {client.preferredLanguage}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader field="name">
                      {language === "es" ? "Nombre" : "Name"}
                    </SortableHeader>
                    <SortableHeader field="email">
                      {language === "es" ? "Email" : "Email"}
                    </SortableHeader>
                    <SortableHeader field="phone">
                      {language === "es" ? "Teléfono" : "Phone"}
                    </SortableHeader>
                    <TableHead className="text-sm font-normal">
                      {language === "es" ? "Nacionalidad" : "Nationality"}
                    </TableHead>
                    <TableHead className="text-sm font-normal">
                      {language === "es" ? "Ciudad" : "City"}
                    </TableHead>
                    <SortableHeader field="status">
                      {language === "es" ? "Estado" : "Status"}
                    </SortableHeader>
                    <TableHead className="text-sm font-normal">
                      {language === "es" ? "Verificado" : "Verified"}
                    </TableHead>
                    <TableHead className="text-sm font-normal text-right">
                      {language === "es" ? "Acciones" : "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                      <TableCell className="text-sm">
                        {client.firstName} {client.lastName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.email || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.phone || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.nationality || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.city || "-"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(client.status)}
                      </TableCell>
                      <TableCell>
                        {client.isVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!client.isVerified && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                updateMutation.mutate({
                                  id: client.id,
                                  data: { isVerified: true }
                                });
                              }}
                              title={language === "es" ? "Verificar" : "Verify"}
                              data-testid={`button-verify-${client.id}`}
                            >
                              <UserCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {client.status === "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                updateMutation.mutate({
                                  id: client.id,
                                  data: { status: "inactive" }
                                });
                              }}
                              title={language === "es" ? "Suspender" : "Suspend"}
                              data-testid={`button-suspend-${client.id}`}
                            >
                              <Ban className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}
                          {client.status === "inactive" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                updateMutation.mutate({
                                  id: client.id,
                                  data: { status: "active" }
                                });
                              }}
                              title={language === "es" ? "Activar" : "Activate"}
                              data-testid={`button-activate-${client.id}`}
                            >
                              <CheckCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-menu-${client.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(client)} data-testid={`button-edit-${client.id}`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                {language === "es" ? "Editar" : "Edit"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(client)}
                                className="text-destructive"
                                data-testid={`button-delete-${client.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {language === "es" ? "Eliminar" : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
          </div>
        )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Nuevo Cliente" : "New Client"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Complete la información del nuevo cliente." 
                : "Fill in the new client information."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
              {/* Datos Personales */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {language === "es" ? "Datos Personales" : "Personal Information"}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Nombre *" : "First Name *"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Segundo Nombre" : "Middle Name"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-middle-name" />
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
                        <FormLabel>{language === "es" ? "Apellido *" : "Last Name *"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nacionalidad" : "Nationality"}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={language === "es" ? "Ej: Mexicana, Estadounidense..." : "E.g: Mexican, American..."} data-testid="input-nationality" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Información de Contacto */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {language === "es" ? "Información de Contacto" : "Contact Information"}
                </h3>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Email" : "Email"}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="phoneCountryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Código" : "Code"}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "+52"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-phone-country-code">
                              <SelectValue placeholder="+52" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="+1">🇺🇸 +1 (USA/CAN)</SelectItem>
                            <SelectItem value="+52">🇲🇽 +52 (MX)</SelectItem>
                            <SelectItem value="+44">🇬🇧 +44 (UK)</SelectItem>
                            <SelectItem value="+33">🇫🇷 +33 (FR)</SelectItem>
                            <SelectItem value="+49">🇩🇪 +49 (DE)</SelectItem>
                            <SelectItem value="+34">🇪🇸 +34 (ES)</SelectItem>
                            <SelectItem value="+39">🇮🇹 +39 (IT)</SelectItem>
                            <SelectItem value="+351">🇵🇹 +351 (PT)</SelectItem>
                            <SelectItem value="+55">🇧🇷 +55 (BR)</SelectItem>
                            <SelectItem value="+54">🇦🇷 +54 (AR)</SelectItem>
                            <SelectItem value="+56">🇨🇱 +56 (CL)</SelectItem>
                            <SelectItem value="+57">🇨🇴 +57 (CO)</SelectItem>
                            <SelectItem value="+51">🇵🇪 +51 (PE)</SelectItem>
                            <SelectItem value="+593">🇪🇨 +593 (EC)</SelectItem>
                            <SelectItem value="+598">🇺🇾 +598 (UY)</SelectItem>
                            <SelectItem value="+506">🇨🇷 +506 (CR)</SelectItem>
                            <SelectItem value="+507">🇵🇦 +507 (PA)</SelectItem>
                            <SelectItem value="+504">🇭🇳 +504 (HN)</SelectItem>
                            <SelectItem value="+503">🇸🇻 +503 (SV)</SelectItem>
                            <SelectItem value="+502">🇬🇹 +502 (GT)</SelectItem>
                            <SelectItem value="+505">🇳🇮 +505 (NI)</SelectItem>
                            <SelectItem value="+81">🇯🇵 +81 (JP)</SelectItem>
                            <SelectItem value="+86">🇨🇳 +86 (CN)</SelectItem>
                            <SelectItem value="+82">🇰🇷 +82 (KR)</SelectItem>
                            <SelectItem value="+91">🇮🇳 +91 (IN)</SelectItem>
                            <SelectItem value="+61">🇦🇺 +61 (AU)</SelectItem>
                            <SelectItem value="+64">🇳🇿 +64 (NZ)</SelectItem>
                            <SelectItem value="+27">🇿🇦 +27 (ZA)</SelectItem>
                            <SelectItem value="+971">🇦🇪 +971 (AE)</SelectItem>
                            <SelectItem value="+966">🇸🇦 +966 (SA)</SelectItem>
                            <SelectItem value="+7">🇷🇺 +7 (RU)</SelectItem>
                            <SelectItem value="+380">🇺🇦 +380 (UA)</SelectItem>
                            <SelectItem value="+48">🇵🇱 +48 (PL)</SelectItem>
                            <SelectItem value="+90">🇹🇷 +90 (TR)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>{language === "es" ? "Teléfono" : "Phone"}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="998 123 4567" data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Ubicación */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {language === "es" ? "Ubicación" : "Location"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Ciudad" : "City"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "País" : "Country"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Notas */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Notas" : "Notes"}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder={language === "es" ? "Información adicional sobre el cliente..." : "Additional client information..."} data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                  {createMutation.isPending 
                    ? (language === "es" ? "Creando..." : "Creating...")
                    : (language === "es" ? "Crear Cliente" : "Create Client")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Editar Cliente" : "Edit Client"}
            </DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => {
              if (selectedClient) {
                updateMutation.mutate({ id: selectedClient.id, data });
              }
            })} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nombre" : "First Name"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Apellido" : "Last Name"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Email" : "Email"}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={field.value || ""} data-testid="input-edit-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Teléfono" : "Phone"}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-edit-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Estado" : "Status"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">{language === "es" ? "Activo" : "Active"}</SelectItem>
                          <SelectItem value="inactive">{language === "es" ? "Inactivo" : "Inactive"}</SelectItem>
                          <SelectItem value="archived">{language === "es" ? "Archivado" : "Archived"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="isVerified"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Verificado" : "Verified"}</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-verified">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">{language === "es" ? "Sí" : "Yes"}</SelectItem>
                          <SelectItem value="false">{language === "es" ? "No" : "No"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Notas" : "Notes"}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="input-edit-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-edit-cancel"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-edit-submit">
                  {updateMutation.isPending 
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (language === "es" ? "Guardar Cambios" : "Save Changes")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Eliminar Cliente" : "Delete Client"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? `¿Está seguro de que desea eliminar a ${selectedClient?.firstName} ${selectedClient?.lastName}? Esta acción no se puede deshacer.`
                : `Are you sure you want to delete ${selectedClient?.firstName} ${selectedClient?.lastName}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              data-testid="button-delete-cancel"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedClient && deleteMutation.mutate(selectedClient.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-confirm"
            >
              {deleteMutation.isPending 
                ? (language === "es" ? "Eliminando..." : "Deleting...")
                : (language === "es" ? "Eliminar" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
