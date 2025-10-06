import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, CheckCircle2 } from "lucide-react";

const userRoles = [
  { value: "master", label: "Master" },
  { value: "admin", label: "Administrador" },
  { value: "admin_jr", label: "Administrador Jr" },
  { value: "cliente", label: "Cliente" },
  { value: "seller", label: "Vendedor" },
  { value: "owner", label: "Propietario" },
  { value: "management", label: "Management" },
  { value: "concierge", label: "Concierge" },
  { value: "provider", label: "Proveedor" },
  { value: "abogado", label: "Abogado" },
  { value: "contador", label: "Contador" },
  { value: "agente_servicios_especiales", label: "Agente Servicios Especiales" },
] as const;

const createUserFormSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  firstName: z.string().min(2, "El nombre es requerido"),
  lastName: z.string().min(2, "El apellido es requerido"),
  role: z.enum([
    "master",
    "admin",
    "admin_jr",
    "cliente",
    "seller",
    "owner",
    "management",
    "concierge",
    "provider",
    "abogado",
    "contador",
    "agente_servicios_especiales",
  ]),
  phone: z.string().optional(),
  sendEmail: z.boolean().optional(),
});

type CreateUserForm = z.infer<typeof createUserFormSchema>;

export function CreateUserTab() {
  const { toast } = useToast();
  const [created, setCreated] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "cliente",
      phone: "",
      sendEmail: false,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      return await apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: (response: any) => {
      setCreatedUser(response.user);
      setCreated(true);
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  if (created && createdUser) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl" data-testid="heading-user-created">Usuario Creado Exitosamente</CardTitle>
            <CardDescription className="text-base">
              El usuario ha sido creado y puede iniciar sesión inmediatamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-muted-foreground">Nombre:</p>
                <p className="text-sm font-medium" data-testid="text-created-name">{createdUser.firstName} {createdUser.lastName}</p>
                <p className="text-sm text-muted-foreground">Email:</p>
                <p className="text-sm font-medium" data-testid="text-created-email">{createdUser.email}</p>
                <p className="text-sm text-muted-foreground">Rol:</p>
                <p className="text-sm font-medium" data-testid="text-created-role">
                  {userRoles.find(r => r.value === createdUser.role)?.label}
                </p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setCreated(false);
                setCreatedUser(null);
                form.reset();
              }}
              data-testid="button-create-another"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Crear Otro Usuario
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold" data-testid="heading-create-user">Crear Nueva Cuenta de Usuario</h2>
        <p className="text-muted-foreground">
          Crea una cuenta de usuario con un rol personalizado. El usuario podrá iniciar sesión inmediatamente.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Juan"
                          {...field}
                          data-testid="input-first-name"
                        />
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
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Pérez"
                          {...field}
                          data-testid="input-last-name"
                        />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="usuario@ejemplo.com"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        {...field}
                        data-testid="input-password"
                      />
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
                    <FormLabel>Teléfono (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="9981234567"
                        {...field}
                        data-testid="input-phone"
                      />
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
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
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
                name="sendEmail"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-send-email"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enviar email de bienvenida</FormLabel>
                      <FormDescription>
                        El usuario recibirá un email con sus credenciales de acceso
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createUserMutation.isPending}
                data-testid="button-submit"
              >
                {createUserMutation.isPending ? "Creando..." : "Crear Usuario"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
