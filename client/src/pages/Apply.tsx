import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, Briefcase, Wrench } from "lucide-react";

const providerApplicationFormSchema = z.object({
  fullName: z.string().min(2, "El nombre completo es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Teléfono inválido"),
  specialty: z.string().min(1, "Selecciona una especialidad"),
  experience: z.string().min(10, "Describe tu experiencia (mínimo 10 caracteres)"),
  description: z.string().min(20, "Describe por qué quieres unirte (mínimo 20 caracteres)"),
  references: z.string().optional(),
});

const sellerApplicationFormSchema = z.object({
  email: z.string().email("Email inválido"),
  whatsapp: z.string().min(10, "WhatsApp debe tener al menos 10 dígitos"),
  reason: z.string().min(50, "Describe tu experiencia en ventas (mínimo 50 caracteres)"),
});

type ProviderApplicationForm = z.infer<typeof providerApplicationFormSchema>;
type SellerApplicationForm = z.infer<typeof sellerApplicationFormSchema>;

export default function Apply() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [applicationType, setApplicationType] = useState<"provider" | "seller" | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const providerForm = useForm<ProviderApplicationForm>({
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

  const sellerForm = useForm<SellerApplicationForm>({
    resolver: zodResolver(sellerApplicationFormSchema),
    defaultValues: {
      email: "",
      whatsapp: "",
      reason: "",
    },
  });

  const createProviderMutation = useMutation({
    mutationFn: async (data: ProviderApplicationForm) => {
      return await apiRequest("POST", "/api/provider-applications", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud como proveedor de servicios ha sido recibida.",
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

  const createSellerMutation = useMutation({
    mutationFn: async (data: SellerApplicationForm) => {
      return await apiRequest("POST", "/api/role-requests", {
        requestedRole: "seller",
        email: data.email,
        whatsapp: data.whatsapp,
        reason: data.reason,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud como vendedor ha sido recibida.",
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

  const onProviderSubmit = (data: ProviderApplicationForm) => {
    createProviderMutation.mutate(data);
  };

  const onSellerSubmit = (data: SellerApplicationForm) => {
    createSellerMutation.mutate(data);
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
              Gracias por tu interés en unirte a nuestro equipo.
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

  if (!applicationType) {
    return (
      <div className="min-h-screen bg-background">
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
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Únete a Nuestro Equipo</h1>
              <p className="text-lg text-muted-foreground">
                Selecciona el tipo de colaboración que te interesa
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card 
                className="cursor-pointer hover-elevate active-elevate-2 transition-all"
                onClick={() => setApplicationType("seller")}
                data-testid="card-seller"
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Vendedor</CardTitle>
                  <CardDescription className="text-base">
                    Únete como agente de ventas y ayuda a conectar clientes con sus propiedades ideales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Comisiones competitivas</li>
                    <li>• Acceso a cartera de propiedades</li>
                    <li>• Herramientas de gestión de leads</li>
                    <li>• Soporte y capacitación</li>
                  </ul>
                  <Button className="w-full mt-6" data-testid="button-apply-seller">
                    Aplicar como Vendedor
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover-elevate active-elevate-2 transition-all"
                onClick={() => setApplicationType("provider")}
                data-testid="card-provider"
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Wrench className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Proveedor de Servicios</CardTitle>
                  <CardDescription className="text-base">
                    Ofrece servicios especializados como limpieza, mantenimiento y más
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Acceso a red de propiedades</li>
                    <li>• Sistema de reservas integrado</li>
                    <li>• Pagos seguros y puntuales</li>
                    <li>• Calificaciones y referencias</li>
                  </ul>
                  <Button className="w-full mt-6" data-testid="button-apply-provider">
                    Aplicar como Proveedor
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (applicationType === "seller") {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Button
              variant="ghost"
              onClick={() => setApplicationType(null)}
              data-testid="button-back-to-selection"
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
                <CardTitle className="text-3xl">Solicitud de Vendedor</CardTitle>
                <CardDescription className="text-base">
                  Completa el formulario para unirte a nuestro equipo de ventas.
                  Un administrador revisará tu solicitud y se pondrá en contacto contigo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...sellerForm}>
                  <form onSubmit={sellerForm.handleSubmit(onSellerSubmit)} className="space-y-6">
                    <FormField
                      control={sellerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo electrónico *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="tucorreo@ejemplo.com"
                              {...field}
                              data-testid="input-seller-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={sellerForm.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp *</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+52 998 123 4567"
                              {...field}
                              data-testid="input-seller-whatsapp"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={sellerForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Experiencia en Ventas *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe tu experiencia en ventas inmobiliarias o relacionadas, logros destacados, certificaciones, etc. (mínimo 50 caracteres)"
                              className="min-h-32"
                              {...field}
                              data-testid="textarea-seller-reason"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <p className="text-sm font-medium">Requisitos:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Experiencia previa en ventas (preferiblemente inmobiliarias)</li>
                        <li>• Habilidades de comunicación y negociación</li>
                        <li>• Conocimiento del mercado de Tulum, Quintana Roo</li>
                        <li>• Disponibilidad para atender clientes</li>
                      </ul>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={createSellerMutation.isPending}
                      data-testid="button-submit-seller"
                    >
                      {createSellerMutation.isPending ? "Enviando..." : "Enviar Solicitud"}
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

  // Provider form
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button
            variant="ghost"
            onClick={() => setApplicationType(null)}
            data-testid="button-back-to-selection"
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
              <Form {...providerForm}>
                <form onSubmit={providerForm.handleSubmit(onProviderSubmit)} className="space-y-6">
                  <FormField
                    control={providerForm.control}
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
                    control={providerForm.control}
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
                    control={providerForm.control}
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
                    control={providerForm.control}
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
                    control={providerForm.control}
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
                    control={providerForm.control}
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
                    control={providerForm.control}
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
                    disabled={createProviderMutation.isPending}
                    data-testid="button-submit-provider"
                  >
                    {createProviderMutation.isPending ? "Enviando..." : "Enviar Solicitud"}
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
