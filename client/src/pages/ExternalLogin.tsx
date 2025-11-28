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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Building2 } from "lucide-react";
import { userLoginSchema } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ExternalLogin() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);

  type FormData = z.infer<typeof userLoginSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response;
    },
    onSuccess: async (response) => {
      try {
        // Invalidate and refetch user data
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Fetch fresh user data - returns User object directly
        const userData = await queryClient.fetchQuery({
          queryKey: ["/api/auth/user"],
        }) as any;
        
        // Extract user role
        const userRole = userData?.role;
        
        // Check if user has external agency role
        const externalRoles = ["external_agency_admin", "external_agency_accounting", "external_agency_maintenance", "external_agency_staff", "external_agency_seller", "external_agency_seller_assistant"];
        if (externalRoles.includes(userRole)) {
          // Success - redirect to external dashboard
          setLocation("/external/dashboard");
        } else {
          // Wrong user type - logout and show error
          toast({
            title: language === "es" ? "Acceso denegado" : "Access denied",
            description: language === "es" 
              ? "Esta página es solo para usuarios de agencias externas. Por favor, usa el login principal."
              : "This page is only for external agency users. Please use the main login.",
            variant: "destructive",
          });
          
          // Logout the user
          try {
            await apiRequest("POST", "/api/auth/logout");
            await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          } catch (logoutError) {
            console.error("Logout error:", logoutError);
          }
          
          // Re-enable form after logout
          form.reset();
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: language === "es" ? "Error" : "Error",
          description: language === "es" 
            ? "Ocurrió un error al verificar tu cuenta. Por favor, intenta nuevamente."
            : "An error occurred while verifying your account. Please try again.",
          variant: "destructive",
        });
        
        // Logout and reset form
        try {
          await apiRequest("POST", "/api/auth/logout");
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        } catch (logoutError) {
          console.error("Logout error:", logoutError);
        }
        form.reset();
      }
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error al iniciar sesión" : "Login error",
        description: error.message || (language === "es" 
          ? "No se pudo iniciar sesión. Verifica tus credenciales." 
          : "Could not log in. Check your credentials."),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-slate-100">
            {language === "es" ? "Portal de Agencias Externas" : "External Agencies Portal"}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {language === "es" 
              ? "Ingresa tus credenciales para acceder al panel de gestión"
              : "Enter your credentials to access the management panel"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                {language === "es" ? "Correo Electrónico" : "Email"}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={language === "es" ? "tu@email.com" : "your@email.com"}
                {...form.register("email")}
                data-testid="input-email"
                className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                {language === "es" ? "Contraseña" : "Password"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...form.register("password")}
                  data-testid="input-password"
                  className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-submit"
            >
              {loginMutation.isPending 
                ? (language === "es" ? "Iniciando sesión..." : "Logging in...") 
                : (language === "es" ? "Iniciar Sesión" : "Log In")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              {language === "es" 
                ? "¿Olvidaste tu contraseña? Contacta al administrador de HomesApp"
                : "Forgot your password? Contact the HomesApp administrator"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
