import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Handshake, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const brokerFormSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  phoneLast4: z.string().length(4, "Últimos 4 dígitos del teléfono"),
  source: z.string().optional(),
  notes: z.string().optional(),
});

type BrokerFormData = z.infer<typeof brokerFormSchema>;

export default function LeadRegistrationBroker() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<BrokerFormData>({
    resolver: zodResolver(brokerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneLast4: "",
      source: "",
      notes: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: BrokerFormData) => {
      const response = await fetch("/api/public/leads/broker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Error al enviar" }));
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "¡Registro Exitoso!",
        description: "Gracias por tu interés. Te contactaremos pronto.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al enviar tu registro",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BrokerFormData) => {
    submitMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">¡Registro Completado!</CardTitle>
            <CardDescription className="text-base">
              Hemos recibido tu información. Nuestro equipo se pondrá en contacto contigo pronto.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Handshake className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl">Registro de Broker</CardTitle>
          <CardDescription className="text-base">
            Completa tus datos básicos para conectar con oportunidades inmobiliarias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Juan"
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
                      <FormLabel>Apellido *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Pérez"
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
                name="phoneLast4"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Últimos 4 dígitos de teléfono *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        maxLength={4}
                        placeholder="1234"
                        data-testid="input-phone-last4"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Cómo nos conociste?</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Redes sociales, referencia, etc."
                        data-testid="input-source"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentarios adicionales</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Cuéntanos sobre tu experiencia y área de especialización..."
                        rows={4}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={submitMutation.isPending}
                data-testid="button-submit"
              >
                {submitMutation.isPending ? "Enviando..." : "Registrarme"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
