import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forcePasswordChangeSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function ForcePasswordChange() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof forcePasswordChangeSchema>>({
    resolver: zodResolver(forcePasswordChangeSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Redirect to dashboard when password change requirement is cleared
  useEffect(() => {
    if (user && !user.requirePasswordChange) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof forcePasswordChangeSchema>) => {
      return await apiRequest("POST", "/api/auth/force-password-change", data);
    },
    onSuccess: async () => {
      // Invalidate auth cache to refresh user data (requirePasswordChange will be false)
      // The useEffect above will automatically redirect when the flag clears
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: language === "es" ? "Contraseña actualizada" : "Password updated",
        description: language === "es" 
          ? "Tu contraseña ha sido actualizada exitosamente. Redirigiendo..."
          : "Your password has been updated successfully. Redirecting...",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es"
          ? "No se pudo cambiar la contraseña"
          : "Could not change password"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof forcePasswordChangeSchema>) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md" data-testid="card-force-password-change">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {language === "es" ? "Cambio de Contraseña Requerido" : "Password Change Required"}
          </CardTitle>
          <CardDescription>
            {language === "es" 
              ? "Por motivos de seguridad, debes cambiar tu contraseña temporal antes de continuar"
              : "For security reasons, you must change your temporary password before continuing"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Nueva Contraseña" : "New Password"}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field} 
                          type={showPassword ? "text" : "password"}
                          data-testid="input-new-password"
                          placeholder={language === "es" ? "Ingresa tu nueva contraseña" : "Enter your new password"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === "es" 
                        ? "Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números"
                        : "Minimum 8 characters, must include uppercase, lowercase and numbers"}
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Confirmar Contraseña" : "Confirm Password"}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field} 
                          type={showConfirmPassword ? "text" : "password"}
                          data-testid="input-confirm-password"
                          placeholder={language === "es" ? "Confirma tu nueva contraseña" : "Confirm your new password"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          data-testid="button-toggle-confirm-password"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={changePasswordMutation.isPending}
                  data-testid="button-submit-password-change"
                >
                  {changePasswordMutation.isPending 
                    ? (language === "es" ? "Actualizando..." : "Updating...") 
                    : (language === "es" ? "Actualizar Contraseña" : "Update Password")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
