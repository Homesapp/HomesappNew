import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const providerApplicationFormSchema = z.object({
  fullName: z.string().min(2, "El nombre completo es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Teléfono inválido"),
  specialty: z.string().min(1, "Selecciona una especialidad"),
  experience: z.string().min(10, "Describe tu experiencia (mínimo 10 caracteres)"),
  description: z.string().min(20, "Describe por qué quieres unirte (mínimo 20 caracteres)"),
  references: z.string().optional(),
});

type ProviderApplicationForm = z.infer<typeof providerApplicationFormSchema>;

export default function ProviderApplication() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ProviderApplicationForm>({
    resolver: zodResolver(providerApplicationFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      specialty: "",
      experience: "",
      description: "",
      references: "",
    },
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (data: ProviderApplicationForm) => {
      return await apiRequest("POST", "/api/provider-applications", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud ha sido recibida. Nos pondremos en contacto contigo pronto.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProviderApplicationForm) => {
    createApplicationMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">¡Solicitud Enviada!</CardTitle>
            <CardDescription className="text-base">
              Gracias por tu interés en unirte a nuestra red de proveedores de servicios.
              Revisaremos tu solicitud y nos pondremos en contacto contigo en los próximos días.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mientras tanto, puedes explorar las propiedades disponibles en nuestra plataforma.
            </p>
            <Button
              className="w-full"
              onClick={() => setLocation("/")}
              data-testid="button-back-home"
            >
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Solicitud de Proveedor de Servicios</CardTitle>
              <CardDescription className="text-base">
                Completa el formulario para unirte a nuestra red de proveedores confiables.
                Un administrador revisará tu solicitud y se pondrá en contacto contigo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Juan Pérez García"
                            {...field}
                            data-testid="input-fullname"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="juan@ejemplo.com"
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono *</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+52 984 123 4567"
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
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especialidad *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-specialty">
                              <SelectValue placeholder="Selecciona tu especialidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Limpieza">Limpieza</SelectItem>
                            <SelectItem value="Mantenimiento">Mantenimiento General</SelectItem>
                            <SelectItem value="Jardinería">Jardinería y Paisajismo</SelectItem>
                            <SelectItem value="Plomería">Plomería</SelectItem>
                            <SelectItem value="Electricidad">Electricidad</SelectItem>
                            <SelectItem value="Carpintería">Carpintería</SelectItem>
                            <SelectItem value="Pintura">Pintura</SelectItem>
                            <SelectItem value="Aire Acondicionado">Aire Acondicionado</SelectItem>
                            <SelectItem value="Alberca">Mantenimiento de Alberca</SelectItem>
                            <SelectItem value="Seguridad">Seguridad</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experiencia *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe tu experiencia profesional, años de experiencia, certificaciones, etc."
                            className="min-h-24"
                            {...field}
                            data-testid="textarea-experience"
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
                        <FormLabel>¿Por qué quieres unirte? *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Cuéntanos por qué te gustaría formar parte de nuestra red de proveedores"
                            className="min-h-24"
                            {...field}
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="references"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referencias (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Nombres y contactos de referencias profesionales"
                            className="min-h-20"
                            {...field}
                            data-testid="textarea-references"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={createApplicationMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createApplicationMutation.isPending ? "Enviando..." : "Enviar Solicitud"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
