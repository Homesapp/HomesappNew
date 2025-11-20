import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, RotateCw, Copy, Check, Pencil, LayoutGrid, LayoutList, Mail, Phone, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import type { User } from "@shared/schema";
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

const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  phone: z.string().optional(),
  role: z.enum(["external_agency_admin", "external_agency_accounting", "external_agency_maintenance", "external_agency_staff"]),
  maintenanceSpecialty: z.enum(["encargado_mantenimiento", "mantenimiento_general", "electrico", "plomero", "refrigeracion", "carpintero", "pintor", "jardinero", "albanil", "limpieza"]).optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  phone: z.string().optional(),
  role: z.enum(["external_agency_admin", "external_agency_accounting", "external_agency_maintenance", "external_agency_staff"]),
  maintenanceSpecialty: z.enum(["encargado_mantenimiento", "mantenimiento_general", "electrico", "plomero", "refrigeracion", "carpintero", "pintor", "jardinero", "albanil", "limpieza"]).optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type UpdateUserForm = z.infer<typeof updateUserSchema>;

const ROLE_LABELS = {
  es: {
    external_agency_admin: "Admin Jr",
    external_agency_accounting: "Contabilidad",
    external_agency_maintenance: "Mantenimiento",
    external_agency_staff: "Staff",
  },
  en: {
    external_agency_admin: "Admin Jr",
    external_agency_accounting: "Accounting",
    external_agency_maintenance: "Maintenance",
    external_agency_staff: "Staff",
  },
};

const SPECIALTY_LABELS = {
  es: {
    encargado_mantenimiento: "Encargado de Mantenimiento",
    mantenimiento_general: "Mantenimiento General",
    electrico: "Eléctrico",
    plomero: "Plomero",
    refrigeracion: "Refrigeración",
    carpintero: "Carpintero",
    pintor: "Pintor",
    jardinero: "Jardinero",
    albanil: "Albañil",
    limpieza: "Limpieza",
  },
  en: {
    encargado_mantenimiento: "Maintenance Manager",
    mantenimiento_general: "General Maintenance",
    electrico: "Electrician",
    plomero: "Plumber",
    refrigeracion: "HVAC",
    carpintero: "Carpenter",
    pintor: "Painter",
    jardinero: "Gardener",
    albanil: "Mason",
    limpieza: "Cleaning",
  },
};

export default function ExternalAccounts() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/external-agency-users'],
  });

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "external_agency_staff",
    },
  });

  const editForm = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      role: "external_agency_staff",
    },
  });

  const openEditDialog = (user: User) => {
    editForm.reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      role: user.role as any,
      maintenanceSpecialty: (user.maintenanceSpecialty || undefined) as any,
    });
    setEditUserId(user.id);
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      return await apiRequest("POST", "/api/external-agency-users", data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agency-users'] });
      setTempPassword(response.tempPassword);
      setTempEmail(response.user.email);
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: language === "es" ? "✅ Usuario creado" : "✅ User created",
        description: language === "es" 
          ? "El usuario ha sido creado exitosamente. Copia las credenciales temporales abajo."
          : "User has been created successfully. Copy the temporary credentials below.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "";
      let description = language === "es" ? "No se pudo crear el usuario" : "Could not create user";
      
      if (errorMessage.includes("already exists") || errorMessage.includes("ya existe")) {
        description = language === "es" 
          ? "Ya existe un usuario con este email. Usa otro email o busca al usuario en la lista."
          : "A user with this email already exists. Use a different email or find the user in the list.";
      } else if (errorMessage.includes("Invalid email") || errorMessage.includes("email")) {
        description = language === "es"
          ? "El formato del email no es válido"
          : "The email format is not valid";
      }
      
      toast({
        title: language === "es" ? "Error" : "Error",
        description,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserForm }) => {
      return await apiRequest("PATCH", `/api/external-agency-users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agency-users'] });
      setEditUserId(null);
      editForm.reset();
      toast({
        title: language === "es" ? "✅ Usuario actualizado" : "✅ User updated",
        description: language === "es"
          ? "Los datos del usuario han sido actualizados exitosamente"
          : "User data has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo actualizar el usuario"
          : "Could not update user",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("PATCH", `/api/external-agency-users/${userId}/reset-password`, {});
    },
    onSuccess: (response: any) => {
      setTempPassword(response.tempPassword);
      toast({
        title: language === "es" ? "Contraseña reseteada" : "Password reset",
        description: language === "es" 
          ? "Se ha generado una nueva contraseña temporal"
          : "A new temporary password has been generated",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo resetear la contraseña"
          : "Could not reset password",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/external-agency-users/${userId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agency-users'] });
      setDeleteUserId(null);
      toast({
        title: language === "es" ? "Usuario eliminado" : "User deleted",
        description: language === "es" 
          ? "El usuario ha sido eliminado exitosamente"
          : "User has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo eliminar el usuario"
          : "Could not delete user",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUserForm) => {
    createMutation.mutate(data);
  };

  const onUpdateSubmit = (data: UpdateUserForm) => {
    if (!editUserId) return;
    updateMutation.mutate({ id: editUserId, data });
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    if (role === "external_agency_admin") return "default";
    if (role === "external_agency_accounting") return "secondary";
    if (role === "external_agency_maintenance") return "outline";
    return "outline";
  };

  const editingUser = users?.find(u => u.id === editUserId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {language === "es" ? "Cuentas de Usuario" : "User Accounts"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Administra los usuarios de tu agencia con diferentes roles"
              : "Manage your agency users with different roles"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              data-testid="button-view-table"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              data-testid="button-view-cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-user">
                <Plus className="mr-2 h-4 w-4" />
                {language === "es" ? "Crear Usuario" : "Create User"}
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-create-user" className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === "es" ? "Crear Nuevo Usuario" : "Create New User"}
                </DialogTitle>
                <DialogDescription>
                  {language === "es"
                    ? "Crea un nuevo usuario para tu agencia. Se generará una contraseña temporal."
                    : "Create a new user for your agency. A temporary password will be generated."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Email" : "Email"}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Nombre" : "First Name"}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-firstname" />
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
                            <Input {...field} data-testid="input-lastname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Teléfono (opcional)" : "Phone (optional)"}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Rol" : "Role"}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-role">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="external_agency_admin">
                              {ROLE_LABELS[language].external_agency_admin}
                            </SelectItem>
                            <SelectItem value="external_agency_accounting">
                              {ROLE_LABELS[language].external_agency_accounting}
                            </SelectItem>
                            <SelectItem value="external_agency_maintenance">
                              {ROLE_LABELS[language].external_agency_maintenance}
                            </SelectItem>
                            <SelectItem value="external_agency_staff">
                              {ROLE_LABELS[language].external_agency_staff}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("role") === "external_agency_maintenance" && (
                    <FormField
                      control={form.control}
                      name="maintenanceSpecialty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "es" ? "Especialidad" : "Specialty"}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-specialty">
                                <SelectValue placeholder={language === "es" ? "Selecciona..." : "Select..."} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="encargado_mantenimiento">{SPECIALTY_LABELS[language].encargado_mantenimiento}</SelectItem>
                              <SelectItem value="mantenimiento_general">{SPECIALTY_LABELS[language].mantenimiento_general}</SelectItem>
                              <SelectItem value="electrico">{SPECIALTY_LABELS[language].electrico}</SelectItem>
                              <SelectItem value="plomero">{SPECIALTY_LABELS[language].plomero}</SelectItem>
                              <SelectItem value="refrigeracion">{SPECIALTY_LABELS[language].refrigeracion}</SelectItem>
                              <SelectItem value="carpintero">{SPECIALTY_LABELS[language].carpintero}</SelectItem>
                              <SelectItem value="pintor">{SPECIALTY_LABELS[language].pintor}</SelectItem>
                              <SelectItem value="jardinero">{SPECIALTY_LABELS[language].jardinero}</SelectItem>
                              <SelectItem value="albanil">{SPECIALTY_LABELS[language].albanil}</SelectItem>
                              <SelectItem value="limpieza">{SPECIALTY_LABELS[language].limpieza}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-user">
                      {createMutation.isPending 
                        ? (language === "es" ? "Creando..." : "Creating...")
                        : (language === "es" ? "Crear Usuario" : "Create User")}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {tempPassword && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-base">
                  {language === "es" ? "Credenciales Temporales Generadas" : "Temporary Credentials Generated"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === "es" 
                    ? "Copia estas credenciales y compártelas con el usuario. El usuario deberá cambiar la contraseña en el primer inicio de sesión."
                    : "Copy these credentials and share them with the user. The user must change the password on first login."}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTempPassword(null);
                  setTempEmail(null);
                }}
                data-testid="button-dismiss-password"
              >
                {language === "es" ? "Cerrar" : "Dismiss"}
              </Button>
            </div>
            
            <div className="space-y-3">
              {tempEmail && (
                <div>
                  <p className="text-sm font-medium mb-1">{language === "es" ? "Usuario (Email)" : "Username (Email)"}</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-3 py-2 rounded border text-sm font-mono flex-1">
                      {tempEmail}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(tempEmail, 'temp-email')}
                      data-testid="button-copy-temp-email"
                    >
                      {copiedId === 'temp-email' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium mb-1">{language === "es" ? "Contraseña Temporal" : "Temporary Password"}</p>
                <div className="flex items-center gap-2">
                  <code className="bg-background px-3 py-2 rounded border text-sm font-mono flex-1">
                    {tempPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(tempPassword, 'temp-pass')}
                    data-testid="button-copy-temp-password"
                  >
                    {copiedId === 'temp-pass' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : !users || users.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12" data-testid="div-no-users">
            <p className="text-muted-foreground">
              {language === "es" 
                ? "No hay usuarios creados aún"
                : "No users created yet"}
            </p>
            <Button
              className="mt-4"
              onClick={() => setIsCreateDialogOpen(true)}
              data-testid="button-create-first-user"
            >
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Crear Primer Usuario" : "Create First User"}
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle>{language === "es" ? "Usuarios de la Agencia" : "Agency Users"}</CardTitle>
            <CardDescription>
              {language === "es" 
                ? "Lista de todos los usuarios con acceso a tu agencia"
                : "List of all users with access to your agency"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">
                      {language === "es" ? "Nombre" : "Name"}
                    </TableHead>
                    <TableHead className="min-w-[200px]">Email</TableHead>
                    <TableHead className="min-w-[150px]">
                      {language === "es" ? "Teléfono" : "Phone"}
                    </TableHead>
                    <TableHead className="min-w-[150px]">Rol</TableHead>
                    <TableHead className="min-w-[150px]">
                      {language === "es" ? "Especialidad" : "Specialty"}
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      {language === "es" ? "Estado" : "Status"}
                    </TableHead>
                    <TableHead className="text-right min-w-[200px]">
                      {language === "es" ? "Acciones" : "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {ROLE_LABELS[language][user.role as keyof typeof ROLE_LABELS.es] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.maintenanceSpecialty ? (
                          <Badge variant="outline" className="text-xs">
                            {SPECIALTY_LABELS[language][user.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS.es]}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'approved' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            data-testid={`button-edit-${user.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => resetPasswordMutation.mutate(user.id)}
                            disabled={resetPasswordMutation.isPending}
                            data-testid={`button-reset-password-${user.id}`}
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDeleteUserId(user.id)}
                            data-testid={`button-delete-${user.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id} data-testid={`card-user-${user.id}`} className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1 text-xs truncate">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {user.email}
                    </CardDescription>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)} className="ml-2 flex-shrink-0">
                    {ROLE_LABELS[language][user.role as keyof typeof ROLE_LABELS.es]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{user.phone}</span>
                  </div>
                )}
                
                {user.maintenanceSpecialty && (
                  <div className="flex items-center gap-2 text-sm">
                    <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Badge variant="outline" className="text-xs">
                      {SPECIALTY_LABELS[language][user.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS.es]}
                    </Badge>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-2 border-t">
                  <Badge variant={user.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                    {user.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(user)}
                      data-testid={`button-edit-card-${user.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => resetPasswordMutation.mutate(user.id)}
                      disabled={resetPasswordMutation.isPending}
                      data-testid={`button-reset-card-${user.id}`}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteUserId(user.id)}
                      data-testid={`button-delete-card-${user.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editUserId} onOpenChange={(open) => !open && setEditUserId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Editar Usuario" : "Edit User"}
            </DialogTitle>
            <DialogDescription>
              {language === "es"
                ? `Edita los datos de ${editingUser?.firstName} ${editingUser?.lastName}`
                : `Edit ${editingUser?.firstName} ${editingUser?.lastName}'s information`}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nombre" : "First Name"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-firstname" />
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
                        <Input {...field} data-testid="input-edit-lastname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Teléfono" : "Phone"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Rol" : "Role"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-role">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="external_agency_admin">
                          {ROLE_LABELS[language].external_agency_admin}
                        </SelectItem>
                        <SelectItem value="external_agency_accounting">
                          {ROLE_LABELS[language].external_agency_accounting}
                        </SelectItem>
                        <SelectItem value="external_agency_maintenance">
                          {ROLE_LABELS[language].external_agency_maintenance}
                        </SelectItem>
                        <SelectItem value="external_agency_staff">
                          {ROLE_LABELS[language].external_agency_staff}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editForm.watch("role") === "external_agency_maintenance" && (
                <FormField
                  control={editForm.control}
                  name="maintenanceSpecialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Especialidad" : "Specialty"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-specialty">
                            <SelectValue placeholder={language === "es" ? "Selecciona..." : "Select..."} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="encargado_mantenimiento">{SPECIALTY_LABELS[language].encargado_mantenimiento}</SelectItem>
                          <SelectItem value="mantenimiento_general">{SPECIALTY_LABELS[language].mantenimiento_general}</SelectItem>
                          <SelectItem value="electrico">{SPECIALTY_LABELS[language].electrico}</SelectItem>
                          <SelectItem value="plomero">{SPECIALTY_LABELS[language].plomero}</SelectItem>
                          <SelectItem value="refrigeracion">{SPECIALTY_LABELS[language].refrigeracion}</SelectItem>
                          <SelectItem value="carpintero">{SPECIALTY_LABELS[language].carpintero}</SelectItem>
                          <SelectItem value="pintor">{SPECIALTY_LABELS[language].pintor}</SelectItem>
                          <SelectItem value="jardinero">{SPECIALTY_LABELS[language].jardinero}</SelectItem>
                          <SelectItem value="albanil">{SPECIALTY_LABELS[language].albanil}</SelectItem>
                          <SelectItem value="limpieza">{SPECIALTY_LABELS[language].limpieza}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditUserId(null)}
                  data-testid="button-cancel-edit"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                  {updateMutation.isPending 
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (language === "es" ? "Guardar Cambios" : "Save Changes")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "es" ? "¿Estás seguro?" : "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es"
                ? "Esta acción no se puede deshacer. El usuario será eliminado permanentemente."
                : "This action cannot be undone. The user will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {language === "es" ? "Cancelar" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
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
