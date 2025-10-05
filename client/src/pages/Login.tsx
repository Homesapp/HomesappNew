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
import { Eye, EyeOff } from "lucide-react";
import { userLoginSchema } from "@shared/schema";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function Login() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
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
      return await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      const userData = await queryClient.fetchQuery({ queryKey: ["/api/auth/user"] });
      
      if (userData && typeof userData === 'object' && 'role' in userData) {
        const role = (userData as any).role;
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
        title: t("login.error"),
        description: error.message || t("login.errorDesc"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <img src={logoIcon} alt="HomesApp" className="h-16 w-auto" data-testid="img-logo" />
          </div>
          <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
          <CardDescription>
            {t("login.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                {...form.register("email")}
                data-testid="input-email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...form.register("password")}
                  data-testid="input-password"
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
              data-testid="button-login"
            >
              {loginMutation.isPending ? t("login.submitting") : t("login.submit")}
            </Button>

            <div className="space-y-3 text-center text-sm">
              <div className="text-muted-foreground">
                {t("login.noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/register")}
                  className="text-primary hover:underline"
                  data-testid="link-register"
                >
                  {t("login.registerLink")}
                </button>
              </div>
              <div className="text-muted-foreground">
                {t("login.orContinueWith")}{" "}
                <a
                  href="/api/login"
                  className="text-primary hover:underline"
                  data-testid="link-replit-login"
                >
                  Replit
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
