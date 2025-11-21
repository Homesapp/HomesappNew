import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, X, Edit2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalClient } from "@shared/schema";

const updateClientSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Apellido requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  phoneCountryCode: z.string().optional(),
  nationality: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  passportNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  occupation: z.string().optional(),
  notes: z.string().optional(),
});

type UpdateClientData = z.infer<typeof updateClientSchema>;

interface ClientSummaryTabProps {
  client: ExternalClient;
}

export default function ClientSummaryTab({ client }: ClientSummaryTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const form = useForm<UpdateClientData>({
    resolver: zodResolver(updateClientSchema),
    defaultValues: {
      firstName: client.firstName,
      middleName: client.middleName || "",
      lastName: client.lastName,
      email: client.email || "",
      phone: client.phone || "",
      phoneCountryCode: client.phoneCountryCode || "+52",
      nationality: client.nationality || "",
      city: client.city || "",
      state: client.state || "",
      country: client.country || "",
      address: client.address || "",
      passportNumber: client.passportNumber || "",
      dateOfBirth: client.dateOfBirth || "",
      occupation: client.occupation || "",
      notes: client.notes || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateClientData) => {
      return apiRequest("PATCH", `/api/external-clients/${client.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-clients", client.id] });
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente se han actualizado exitosamente.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el cliente",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateClientData) => {
    updateMutation.mutate(data);
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Información del Cliente</CardTitle>
            <Button
              onClick={() => setIsEditing(true)}
              size="sm"
              data-testid="button-edit-client"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Data */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Datos Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Nombre</Label>
                <p className="font-medium">{client.firstName} {client.middleName || ""} {client.lastName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Nacionalidad</Label>
                <p className="font-medium">{client.nationality || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Fecha de Nacimiento</Label>
                <p className="font-medium">{client.dateOfBirth || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Pasaporte</Label>
                <p className="font-medium">{client.passportNumber || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Ocupación</Label>
                <p className="font-medium">{client.occupation || "—"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{client.email || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Teléfono</Label>
                <p className="font-medium">{client.phoneCountryCode || ""} {client.phone || "—"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Ubicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Dirección</Label>
                <p className="font-medium">{client.address || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Ciudad</Label>
                <p className="font-medium">{client.city || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Estado</Label>
                <p className="font-medium">{client.state || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">País</Label>
                <p className="font-medium">{client.country || "—"}</p>
              </div>
            </div>
          </div>

          {client.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Notas</h3>
                <p className="text-sm">{client.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Editar Información del Cliente</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                form.reset();
              }}
              size="sm"
              data-testid="button-cancel-edit"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              size="sm"
              disabled={updateMutation.isPending}
              data-testid="button-save-client"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            {/* Personal Data Section */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-firstName" />
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
                      <FormLabel>Segundo Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-middleName" />
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
                      <FormLabel>Apellido *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-lastName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nacionalidad</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-nationality" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Nacimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-dateOfBirth" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passportNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pasaporte</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-passportNumber" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ocupación</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-occupation" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Contact Section */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="phoneCountryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-phoneCountryCode">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+52">+52 (MX)</SelectItem>
                            <SelectItem value="+1">+1 (US/CA)</SelectItem>
                            <SelectItem value="+44">+44 (UK)</SelectItem>
                            <SelectItem value="+34">+34 (ES)</SelectItem>
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
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Section */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Ubicación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-state" />
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
                      <FormLabel>País</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Notes Section */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
