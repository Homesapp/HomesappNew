import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail } from "lucide-react";
import { requestPasswordResetSchema } from "@shared/schema";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";

export default function ForgotPassword() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);

  type FormData = z.infer<typeof requestPasswordResetSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/password-reset/request", data);
    },
    onSuccess: () => {
      setEmailSent(true);
      toast({
        title: "Correo enviado",
        description: "Si el email existe en nuestro sistema, recibirás un enlace de restablecimiento.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el correo de restablecimiento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    resetMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/login")}
              data-testid="button-back-to-login"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col items-center justify-center flex-1">
              <img src={logoIcon} alt="HomesApp" className="h-12 w-auto" data-testid="img-logo" />
              <span className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">Smart Real Estate</span>
            </div>
            <div className="w-10" />
          </div>
          <CardTitle className="text-2xl text-center">¿Olvidaste tu contraseña?</CardTitle>
          <CardDescription className="text-center">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!emailSent ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-9"
                    {...form.register("email")}
                    data-testid="input-email"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={resetMutation.isPending}
                data-testid="button-send-reset-link"
              >
                {resetMutation.isPending ? "Enviando..." : "Enviar enlace de restablecimiento"}
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setLocation("/login")}
                  className="text-muted-foreground hover:text-primary hover:underline"
                  data-testid="link-back-to-login"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="rounded-full bg-primary/10 p-4 w-16 h-16 mx-auto flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Revisa tu correo</h3>
                <p className="text-sm text-muted-foreground">
                  Te hemos enviado un enlace de restablecimiento a{" "}
                  <span className="font-medium text-foreground">{form.getValues("email")}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Si no ves el correo en unos minutos, revisa tu carpeta de spam.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/login")}
                data-testid="button-go-to-login"
              >
                Volver al inicio de sesión
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
