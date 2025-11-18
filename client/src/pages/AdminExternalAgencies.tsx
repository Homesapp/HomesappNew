import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExternalAgencySchema } from "@shared/schema";
import type { ExternalAgency } from "@shared/schema";
import { z } from "zod";
import { Plus, Pencil, Trash2, Building2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

const formSchema = insertExternalAgencySchema.extend({
  assignedUserId: z.string().min(1, "Please select a user"),
});

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function AdminExternalAgencies() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<ExternalAgency | null>(null);

  const { data: agencies = [], isLoading: isLoadingAgencies } = useQuery<ExternalAgency[]>({
    queryKey: ['/api/external-agencies'],
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      agencyLogoUrl: "",
      isActive: true,
      assignedUserId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const { assignedUserId, ...agencyData } = data;
      // Backend automatically assigns external_agency_admin role when creating agency
      return await apiRequest("POST", "/api/external-agencies", {
        ...agencyData,
        createdBy: assignedUserId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agencies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: language === "es" ? "Agencia creada" : "Agency created",
        description: language === "es" 
          ? "La agencia externa ha sido creada exitosamente"
          : "External agency has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo crear la agencia"
          : "Could not create agency",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!selectedAgency) return;
      const { assignedUserId, ...agencyData } = data;
      return await apiRequest("PATCH", `/api/external-agencies/${selectedAgency.id}`, agencyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agencies'] });
      setIsEditDialogOpen(false);
      setSelectedAgency(null);
      toast({
        title: language === "es" ? "Agencia actualizada" : "Agency updated",
        description: language === "es" 
          ? "La agencia ha sido actualizada exitosamente"
          : "Agency has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo actualizar la agencia"
          : "Could not update agency",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/external-agencies/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agencies'] });
      setIsDeleteDialogOpen(false);
      setSelectedAgency(null);
      toast({
        title: language === "es" ? "Agencia eliminada" : "Agency deleted",
        description: language === "es" 
          ? "La agencia ha sido eliminada exitosamente"
          : "Agency has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo eliminar la agencia"
          : "Could not delete agency",
        variant: "destructive",
      });
    },
  });

  const onSubmitCreate = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(data);
  };

  const onSubmitEdit = (data: z.infer<typeof formSchema>) => {
    updateMutation.mutate(data);
  };

  const handleEdit = (agency: ExternalAgency) => {
    setSelectedAgency(agency);
    form.reset({
      name: agency.name,
      description: agency.description || "",
      contactName: agency.contactName || "",
      contactEmail: agency.contactEmail || "",
      contactPhone: agency.contactPhone || "",
      agencyLogoUrl: agency.agencyLogoUrl || "",
      isActive: agency.isActive,
      assignedUserId: agency.createdBy || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (agency: ExternalAgency) => {
    setSelectedAgency(agency);
    setIsDeleteDialogOpen(true);
  };

  const filteredAgencies = agencies.filter(agency =>
    agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agency.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAssignedUser = (createdBy: string | null) => {
    if (!createdBy) return null;
    return users.find(u => u.id === createdBy);
  };

  if (isLoadingAgencies) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Gestión de Agencias Externas" : "External Agencies Management"}
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="text-page-description">
            {language === "es" 
              ? "Crea y administra agencias externas que utilizan el sistema"
              : "Create and manage external agencies using the system"}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-agency">
              <Plus className="h-4 w-4 mr-2" />
              {language === "es" ? "Nueva Agencia" : "New Agency"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {language === "es" ? "Crear Agencia Externa" : "Create External Agency"}
              </DialogTitle>
              <DialogDescription>
                {language === "es" 
                  ? "Completa la información para crear una nueva agencia externa"
                  : "Fill in the information to create a new external agency"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="assignedUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Usuario Asignado" : "Assigned User"} *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoadingUsers}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-assigned-user">
                            <SelectValue placeholder={language === "es" ? "Seleccionar usuario" : "Select user"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {language === "es" 
                          ? "El usuario recibirá el rol de administrador de agencia externa"
                          : "The user will receive the external agency admin role"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nombre de la Agencia" : "Agency Name"} *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-agency-name"
                          placeholder={language === "es" ? "Ej: Inmobiliaria Tulum" : "E.g.: Tulum Real Estate"}
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
                          data-testid="textarea-description"
                          placeholder={language === "es" ? "Descripción de la agencia" : "Agency description"}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Nombre de Contacto" : "Contact Name"}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            data-testid="input-contact-name"
                            placeholder={language === "es" ? "Nombre" : "Name"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Email de Contacto" : "Contact Email"}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            data-testid="input-contact-email"
                            type="email"
                            placeholder="contact@agency.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Teléfono de Contacto" : "Contact Phone"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-contact-phone"
                          placeholder="+52 123 456 7890"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agencyLogoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "URL del Logo" : "Logo URL"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-logo-url"
                          placeholder="https://example.com/logo.png"
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
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-create"
                  >
                    {language === "es" ? "Cancelar" : "Cancel"}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit-create"
                  >
                    {createMutation.isPending 
                      ? (language === "es" ? "Creando..." : "Creating...") 
                      : (language === "es" ? "Crear Agencia" : "Create Agency")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={language === "es" ? "Buscar agencias..." : "Search agencies..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-agencies"
          />
        </div>
        <Badge variant="outline" data-testid="badge-agency-count">
          {filteredAgencies.length} {language === "es" ? "agencias" : "agencies"}
        </Badge>
      </div>

      <Card data-testid="card-agencies-table">
        <CardHeader>
          <CardTitle>
            <Building2 className="h-5 w-5 inline mr-2" />
            {language === "es" ? "Agencias Externas" : "External Agencies"}
          </CardTitle>
          <CardDescription>
            {language === "es" 
              ? "Lista de todas las agencias externas registradas en el sistema"
              : "List of all external agencies registered in the system"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAgencies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="div-no-agencies">
              {language === "es" 
                ? "No hay agencias externas registradas"
                : "No external agencies registered"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "es" ? "Nombre" : "Name"}</TableHead>
                  <TableHead>{language === "es" ? "Contacto" : "Contact"}</TableHead>
                  <TableHead>{language === "es" ? "Usuario Asignado" : "Assigned User"}</TableHead>
                  <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                  <TableHead>{language === "es" ? "Fecha de Creación" : "Created Date"}</TableHead>
                  <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgencies.map((agency) => {
                  const assignedUser = getAssignedUser(agency.createdBy);
                  return (
                    <TableRow key={agency.id} data-testid={`row-agency-${agency.id}`}>
                      <TableCell className="font-medium">{agency.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {agency.contactName && <div>{agency.contactName}</div>}
                          {agency.contactEmail && <div className="text-muted-foreground">{agency.contactEmail}</div>}
                          {agency.contactPhone && <div className="text-muted-foreground">{agency.contactPhone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignedUser ? (
                          <div className="text-sm">
                            <div>{assignedUser.firstName} {assignedUser.lastName}</div>
                            <div className="text-muted-foreground">{assignedUser.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {language === "es" ? "Sin asignar" : "Unassigned"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={agency.isActive ? "default" : "secondary"}>
                          {agency.isActive 
                            ? (language === "es" ? "Activa" : "Active")
                            : (language === "es" ? "Inactiva" : "Inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(agency.createdAt), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(agency)}
                            data-testid={`button-edit-${agency.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(agency)}
                            data-testid={`button-delete-${agency.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Editar Agencia" : "Edit Agency"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Actualiza la información de la agencia"
                : "Update agency information"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Nombre de la Agencia" : "Agency Name"} *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        data-testid="input-edit-agency-name"
                        placeholder={language === "es" ? "Ej: Inmobiliaria Tulum" : "E.g.: Tulum Real Estate"}
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
                        data-testid="textarea-edit-description"
                        placeholder={language === "es" ? "Descripción de la agencia" : "Agency description"}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nombre de Contacto" : "Contact Name"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-edit-contact-name"
                          placeholder={language === "es" ? "Nombre" : "Name"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Email de Contacto" : "Contact Email"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-edit-contact-email"
                          type="email"
                          placeholder="contact@agency.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Teléfono de Contacto" : "Contact Phone"}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        data-testid="input-edit-contact-phone"
                        placeholder="+52 123 456 7890"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agencyLogoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "URL del Logo" : "Logo URL"}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        data-testid="input-edit-logo-url"
                        placeholder="https://example.com/logo.png"
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
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateMutation.isPending 
                    ? (language === "es" ? "Actualizando..." : "Updating...") 
                    : (language === "es" ? "Actualizar" : "Update")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "es" ? "¿Eliminar agencia?" : "Delete agency?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es" 
                ? `¿Estás seguro que deseas eliminar la agencia "${selectedAgency?.name}"? Esta acción eliminará todas las propiedades, pagos y tickets asociados a esta agencia. Esta acción no se puede deshacer.`
                : `Are you sure you want to delete the agency "${selectedAgency?.name}"? This action will delete all properties, payments, and tickets associated with this agency. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {language === "es" ? "Cancelar" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAgency && deleteMutation.mutate(selectedAgency.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {language === "es" ? "Eliminar" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
