import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

const verificationSchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos").regex(/^\d+$/, "El código solo debe contener números"),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

export default function VerifyEmail() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [email, setEmail] = useState<string>("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("verificationEmail");
    if (!storedEmail) {
      toast({
        title: "Error",
        description: "No hay una sesión de verificación activa",
        variant: "destructive",
      });
      setLocation("/register");
      return;
    }
    setEmail(storedEmail);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: VerificationFormData) => {
      return await apiRequest("POST", "/api/verify-email", {
        email,
        code: data.code,
      });
    },
    onSuccess: async (data: any) => {
      sessionStorage.removeItem("verificationEmail");
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "¡Verificación exitosa!",
        description: "Tu cuenta ha sido verificada correctamente.",
      });

      // Redirect based on role
      if (data.user && data.user.role) {
        const role = data.user.role;
        if (role === "owner") {
          setLocation("/owner/dashboard");
        } else if (role === "master" || role === "admin" || role === "admin_jr") {
          setLocation("/admin/dashboard");
        } else {
          setLocation("/");
        }
      } else {
        setLocation("/");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error de verificación",
        description: error.message || "El código ingresado es incorrecto o ha expirado",
        variant: "destructive",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/resend-verification", { email });
    },
    onSuccess: () => {
      toast({
        title: "Código reenviado",
        description: "Se ha enviado un nuevo código a tu email",
      });
      setCountdown(60);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo reenviar el código",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VerificationFormData) => {
    verifyMutation.mutate(data);
  };

  const handleResend = () => {
    if (countdown === 0) {
      resendMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex flex-col items-center justify-center mb-4">
            <img src={logoIcon} alt="HomesApp" className="h-16 w-auto" data-testid="img-logo" />
            <span className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">Smart Real Estate</span>
          </div>
          <CardTitle className="text-2xl">Verifica tu email</CardTitle>
          <CardDescription>
            Hemos enviado un código de 6 dígitos a<br />
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Input
                id="code"
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                {...form.register("code")}
                data-testid="input-verification-code"
                autoComplete="off"
                autoFocus
              />
              {form.formState.errors.code && (
                <p className="text-sm text-destructive text-center">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={verifyMutation.isPending}
              data-testid="button-verify"
            >
              {verifyMutation.isPending ? "Verificando..." : "Verificar código"}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                ¿No recibiste el código?
              </p>
              <Button
                type="button"
                variant="link"
                onClick={handleResend}
                disabled={countdown > 0 || resendMutation.isPending}
                data-testid="button-resend"
                className="text-primary"
              >
                {countdown > 0
                  ? `Reenviar en ${countdown}s`
                  : resendMutation.isPending
                  ? "Reenviando..."
                  : "Reenviar código"}
              </Button>
            </div>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  sessionStorage.removeItem("verificationEmail");
                  setLocation("/login");
                }}
                data-testid="link-back-to-login"
                className="text-sm text-muted-foreground"
              >
                Volver al inicio de sesión
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
