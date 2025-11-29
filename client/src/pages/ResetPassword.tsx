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
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { resetPasswordSchema } from "@shared/schema";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";

export default function ResetPassword() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token") || "";

  type FormData = z.infer<typeof resetPasswordSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token,
      newPassword: "",
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/password-reset/reset", data);
    },
    onSuccess: () => {
      setPasswordReset(true);
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido restablecida exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo restablecer la contraseña",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    resetMutation.mutate(data);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <div className="flex flex-col items-center justify-center mb-4">
              <img src={logoIcon} alt="HomesApp" className="h-12 w-auto" data-testid="img-logo" />
              <span className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">Smart Real Estate</span>
            </div>
            <CardTitle className="text-2xl text-center">Token inválido</CardTitle>
            <CardDescription className="text-center">
              El enlace de restablecimiento es inválido o ha expirado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/forgot-password")}
              data-testid="button-request-new-link"
            >
              Solicitar nuevo enlace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex flex-col items-center justify-center mb-4">
            <img src={logoIcon} alt="HomesApp" className="h-12 w-auto" data-testid="img-logo" />
            <span className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">Smart Real Estate</span>
          </div>
          <CardTitle className="text-2xl text-center">Restablecer contraseña</CardTitle>
          <CardDescription className="text-center">
            Ingresa tu nueva contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!passwordReset ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...form.register("token")} />
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...form.register("newPassword")}
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.newPassword.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  La contraseña debe tener al menos 8 caracteres
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={resetMutation.isPending}
                data-testid="button-reset-password"
              >
                {resetMutation.isPending ? "Restableciendo..." : "Restablecer contraseña"}
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
              <div className="rounded-full bg-green-500/10 p-4 w-16 h-16 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Contraseña restablecida</h3>
                <p className="text-sm text-muted-foreground">
                  Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => setLocation("/login")}
                data-testid="button-go-to-login"
              >
                Ir a inicio de sesión
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
