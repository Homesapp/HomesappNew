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
import { Plus, Trash2, RotateCw, Copy, Check } from "lucide-react";
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
  maintenanceSpecialty: z.enum(["encargado", "electrico", "plomero", "refrigeracion", "carpintero", "pintor", "jardinero", "limpieza", "seguridad", "general"]).optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

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
    encargado: "Encargado",
    electrico: "Eléctrico",
    plomero: "Plomero",
    refrigeracion: "Refrigeración",
    carpintero: "Carpintero",
    pintor: "Pintor",
    jardinero: "Jardinero",
    limpieza: "Limpieza",
    seguridad: "Seguridad",
    general: "General",
  },
  en: {
    encargado: "Manager",
    electrico: "Electrician",
    plomero: "Plumber",
    refrigeracion: "HVAC",
    carpintero: "Carpenter",
    pintor: "Painter",
    jardinero: "Gardener",
    limpieza: "Cleaning",
    seguridad: "Security",
    general: "General",
  },
};

export default function ExternalAccounts() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const createMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      return await apiRequest("POST", "/api/external-agency-users", data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agency-users'] });
      setTempPassword(response.tempPassword);
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: language === "es" ? "Usuario creado" : "User created",
        description: language === "es" 
          ? "El usuario ha sido creado exitosamente. Copia la contraseña temporal."
          : "User has been created successfully. Copy the temporary password.",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo crear el usuario"
          : "Could not create user",
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

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user">
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Crear Usuario" : "Create User"}
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-user">
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
                <div className="grid grid-cols-2 gap-4">
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-specialty">
                              <SelectValue placeholder={language === "es" ? "Selecciona especialidad..." : "Select specialty..."} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="encargado">{SPECIALTY_LABELS[language].encargado}</SelectItem>
                            <SelectItem value="electrico">{SPECIALTY_LABELS[language].electrico}</SelectItem>
                            <SelectItem value="plomero">{SPECIALTY_LABELS[language].plomero}</SelectItem>
                            <SelectItem value="refrigeracion">{SPECIALTY_LABELS[language].refrigeracion}</SelectItem>
                            <SelectItem value="carpintero">{SPECIALTY_LABELS[language].carpintero}</SelectItem>
                            <SelectItem value="pintor">{SPECIALTY_LABELS[language].pintor}</SelectItem>
                            <SelectItem value="jardinero">{SPECIALTY_LABELS[language].jardinero}</SelectItem>
                            <SelectItem value="limpieza">{SPECIALTY_LABELS[language].limpieza}</SelectItem>
                            <SelectItem value="seguridad">{SPECIALTY_LABELS[language].seguridad}</SelectItem>
                            <SelectItem value="general">{SPECIALTY_LABELS[language].general}</SelectItem>
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

      {tempPassword && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {language === "es" ? "Contraseña Temporal Generada" : "Temporary Password Generated"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "es" 
                  ? "Copia esta contraseña y compártela con el usuario. No podrás verla nuevamente."
                  : "Copy this password and share it with the user. You won't be able to see it again."}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <code className="bg-background px-3 py-1 rounded border text-base font-mono">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTempPassword(null)}
              data-testid="button-dismiss-password"
            >
              {language === "es" ? "Cerrar" : "Dismiss"}
            </Button>
          </CardContent>
        </Card>
      )}

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
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-8" data-testid="div-no-users">
              <p className="text-muted-foreground">
                {language === "es" 
                  ? "No hay usuarios creados aún"
                  : "No users created yet"}
              </p>
            </div>
          ) : (
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
                    <TableHead className="min-w-[150px]">
                      {language === "es" ? "Rol" : "Role"}
                    </TableHead>
                    <TableHead className="min-w-[150px]">
                      {language === "es" ? "Especialidad" : "Specialty"}
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      {language === "es" ? "Estado" : "Status"}
                    </TableHead>
                    <TableHead className="text-right min-w-[150px]">
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
                        <Badge variant="outline">
                          {ROLE_LABELS[language][user.role as keyof typeof ROLE_LABELS['es']]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.maintenanceSpecialty ? (
                          <Badge variant="secondary">
                            {SPECIALTY_LABELS[language][user.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS['es']]}
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
                            data-testid={`button-delete-user-${user.id}`}
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
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "es" ? "¿Estás seguro?" : "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es"
                ? "Esta acción no se puede deshacer. Se eliminará permanentemente el usuario y su acceso a la agencia."
                : "This action cannot be undone. This will permanently delete the user and their access to the agency."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {language === "es" ? "Cancelar" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending
                ? (language === "es" ? "Eliminando..." : "Deleting...")
                : (language === "es" ? "Eliminar" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
