import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Wrench, Plus, AlertCircle, Search, Filter, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExternalMaintenanceTicketSchema } from "@shared/schema";
import type { ExternalMaintenanceTicket, ExternalProperty } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formSchema = insertExternalMaintenanceTicketSchema.omit({ propertyId: true }).extend({
  propertyId: z.string(),
});

export default function ExternalMaintenanceTickets() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<ExternalMaintenanceTicket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: properties } = useQuery<ExternalProperty[]>({
    queryKey: ['/api/external-properties'],
  });

  const { data: tickets, isLoading } = useQuery<ExternalMaintenanceTicket[]>({
    queryKey: ['/api/external-tickets'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: "",
      title: "",
      description: "",
      priority: "normal",
      status: "open",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (editingTicket) {
        return await apiRequest("PATCH", `/api/external-tickets/${editingTicket.id}`, data);
      }
      return await apiRequest("POST", "/api/external-tickets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-tickets'] });
      toast({
        title: language === "es" ? "Ticket guardado" : "Ticket saved",
        description: language === "es" 
          ? "El ticket ha sido guardado exitosamente"
          : "Ticket has been saved successfully",
      });
      setIsDialogOpen(false);
      setEditingTicket(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo guardar el ticket"
          : "Could not save ticket",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/external-tickets/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-tickets'] });
      toast({
        title: language === "es" ? "Estado actualizado" : "Status updated",
        description: language === "es" 
          ? "El estado del ticket ha sido actualizado"
          : "Ticket status has been updated",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo actualizar el estado"
          : "Could not update status",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (ticket: ExternalMaintenanceTicket) => {
    setEditingTicket(ticket);
    form.reset({
      propertyId: ticket.propertyId,
      title: ticket.title,
      description: ticket.description || "",
      priority: ticket.priority,
      status: ticket.status,
    });
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(data);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-500 text-white';
      case 'urgent': return 'bg-orange-500 text-white';
      case 'high': return 'bg-yellow-500 text-white';
      case 'normal': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'emergency': return language === "es" ? "Emergencia" : "Emergency";
      case 'urgent': return language === "es" ? "Urgente" : "Urgent";
      case 'high': return language === "es" ? "Alta" : "High";
      case 'normal': return language === "es" ? "Normal" : "Normal";
      case 'low': return language === "es" ? "Baja" : "Low";
      default: return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return language === "es" ? "Abierto" : "Open";
      case 'in_progress': return language === "es" ? "En Progreso" : "In Progress";
      case 'resolved': return language === "es" ? "Resuelto" : "Resolved";
      case 'cancelled': return language === "es" ? "Cancelado" : "Cancelled";
      default: return status;
    }
  };

  const filteredTickets = tickets?.filter((ticket) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const title = ticket.title.toLowerCase();
      const description = ticket.description?.toLowerCase() || '';
      const propertyAddress = getPropertyAddress(ticket.propertyId).toLowerCase();
      
      if (!title.includes(searchLower) && !description.includes(searchLower) && !propertyAddress.includes(searchLower)) {
        return false;
      }
    }
    
    // Status filter
    if (filterStatus !== "all" && ticket.status !== filterStatus) return false;
    
    // Priority filter
    if (filterPriority !== "all" && ticket.priority !== filterPriority) return false;
    
    return true;
  });

  const getPropertyAddress = (propertyId: string) => {
    const property = properties?.find(p => p.id === propertyId);
    return property?.address || (language === "es" ? "Propiedad desconocida" : "Unknown property");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === "es" ? "Tickets de Mantenimiento" : "Maintenance Tickets"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Gestiona las solicitudes de mantenimiento de tus propiedades"
              : "Manage maintenance requests for your properties"}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingTicket(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-ticket">
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Nuevo Ticket" : "New Ticket"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTicket 
                  ? (language === "es" ? "Editar Ticket" : "Edit Ticket")
                  : (language === "es" ? "Nuevo Ticket" : "New Ticket")}
              </DialogTitle>
              <DialogDescription>
                {language === "es" 
                  ? "Registra una solicitud de mantenimiento"
                  : "Register a maintenance request"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Propiedad" : "Property"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-property">
                            <SelectValue placeholder={language === "es" ? "Selecciona una propiedad" : "Select a property"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties?.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.address} - {property.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Título" : "Title"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-title"
                          placeholder={language === "es" ? "Ej: Fuga de agua en cocina" : "E.g.: Water leak in kitchen"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Descripción" : "Description"}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          data-testid="input-description"
                          placeholder={language === "es" 
                            ? "Describe el problema en detalle..."
                            : "Describe the issue in detail..."}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Prioridad" : "Priority"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="emergency">{language === "es" ? "Emergencia" : "Emergency"}</SelectItem>
                            <SelectItem value="urgent">{language === "es" ? "Urgente" : "Urgent"}</SelectItem>
                            <SelectItem value="high">{language === "es" ? "Alta" : "High"}</SelectItem>
                            <SelectItem value="normal">{language === "es" ? "Normal" : "Normal"}</SelectItem>
                            <SelectItem value="low">{language === "es" ? "Baja" : "Low"}</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="open">{language === "es" ? "Abierto" : "Open"}</SelectItem>
                            <SelectItem value="in_progress">{language === "es" ? "En Progreso" : "In Progress"}</SelectItem>
                            <SelectItem value="resolved">{language === "es" ? "Resuelto" : "Resolved"}</SelectItem>
                            <SelectItem value="cancelled">{language === "es" ? "Cancelado" : "Cancelled"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-ticket">
                    {createMutation.isPending 
                      ? (language === "es" ? "Guardando..." : "Saving...")
                      : (language === "es" ? "Guardar" : "Save")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "es" ? "Buscar tickets..." : "Search tickets..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-tickets"
              />
            </div>

            {/* Filter Button with Popover */}
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="flex-shrink-0 relative"
                  data-testid="button-filters"
                >
                  <Filter className="h-4 w-4" />
                  {(filterStatus !== "all" || filterPriority !== "all") && (
                    <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {[filterStatus !== "all", filterPriority !== "all"].filter(Boolean).length}
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
                    
                    {/* Status Filter */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        {language === 'es' ? 'Estado' : 'Status'}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={filterStatus === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterStatus("all")}
                          data-testid="button-filter-status-all"
                        >
                          {language === 'es' ? 'Todos' : 'All'}
                        </Button>
                        <Button
                          variant={filterStatus === "open" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterStatus("open")}
                          data-testid="button-filter-status-open"
                        >
                          {language === 'es' ? 'Abierto' : 'Open'}
                        </Button>
                        <Button
                          variant={filterStatus === "in_progress" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterStatus("in_progress")}
                          data-testid="button-filter-status-in-progress"
                        >
                          {language === 'es' ? 'En Progreso' : 'In Progress'}
                        </Button>
                        <Button
                          variant={filterStatus === "resolved" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterStatus("resolved")}
                          data-testid="button-filter-status-resolved"
                        >
                          {language === 'es' ? 'Resuelto' : 'Resolved'}
                        </Button>
                        <Button
                          variant={filterStatus === "cancelled" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterStatus("cancelled")}
                          data-testid="button-filter-status-cancelled"
                        >
                          {language === 'es' ? 'Cancelado' : 'Cancelled'}
                        </Button>
                      </div>
                    </div>

                    {/* Priority Filter */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        {language === 'es' ? 'Prioridad' : 'Priority'}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={filterPriority === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterPriority("all")}
                          data-testid="button-filter-priority-all"
                        >
                          {language === 'es' ? 'Todas' : 'All'}
                        </Button>
                        <Button
                          variant={filterPriority === "emergency" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterPriority("emergency")}
                          data-testid="button-filter-priority-emergency"
                        >
                          {language === 'es' ? 'Emergencia' : 'Emergency'}
                        </Button>
                        <Button
                          variant={filterPriority === "urgent" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterPriority("urgent")}
                          data-testid="button-filter-priority-urgent"
                        >
                          {language === 'es' ? 'Urgente' : 'Urgent'}
                        </Button>
                        <Button
                          variant={filterPriority === "high" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterPriority("high")}
                          data-testid="button-filter-priority-high"
                        >
                          {language === 'es' ? 'Alta' : 'High'}
                        </Button>
                        <Button
                          variant={filterPriority === "normal" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterPriority("normal")}
                          data-testid="button-filter-priority-normal"
                        >
                          {language === 'es' ? 'Normal' : 'Normal'}
                        </Button>
                        <Button
                          variant={filterPriority === "low" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterPriority("low")}
                          data-testid="button-filter-priority-low"
                        >
                          {language === 'es' ? 'Baja' : 'Low'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {(filterStatus !== "all" || filterPriority !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterStatus("all");
                        setFilterPriority("all");
                      }}
                      className="w-full"
                      data-testid="button-clear-filters"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Limpiar filtros' : 'Clear filters'}
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {language === "es" ? "Lista de Tickets" : "Tickets List"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : filteredTickets && filteredTickets.length > 0 ? (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="hover-elevate" data-testid={`ticket-card-${ticket.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-semibold text-lg">{ticket.title}</h3>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {getPriorityLabel(ticket.priority)}
                          </Badge>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {getPropertyAddress(ticket.propertyId)}
                        </p>
                        {ticket.description && (
                          <p className="text-sm mb-2">{ticket.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {language === "es" ? "Creado:" : "Created:"} {format(new Date(ticket.createdAt), "PPP", { locale: language === "es" ? es : undefined })}
                        </p>
                        {ticket.resolvedAt && (
                          <p className="text-xs text-green-600">
                            {language === "es" ? "Resuelto:" : "Resolved:"} {format(new Date(ticket.resolvedAt), "PPP", { locale: language === "es" ? es : undefined })}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(ticket)}
                          data-testid={`button-edit-${ticket.id}`}
                        >
                          {language === "es" ? "Editar" : "Edit"}
                        </Button>
                        {ticket.status === 'open' && (
                          <Button 
                            size="sm"
                            onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                            data-testid={`button-start-${ticket.id}`}
                          >
                            {language === "es" ? "Iniciar" : "Start"}
                          </Button>
                        )}
                        {ticket.status === 'in_progress' && (
                          <Button 
                            size="sm"
                            onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                            data-testid={`button-resolve-${ticket.id}`}
                          >
                            {language === "es" ? "Resolver" : "Resolve"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {language === "es" ? "No hay tickets registrados" : "No tickets registered"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
