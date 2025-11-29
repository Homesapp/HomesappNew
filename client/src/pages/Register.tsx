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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building2, Eye, EyeOff } from "lucide-react";
import { userRegistrationSchema } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import logoIcon from "@assets/H mes (500 x 300 px)_1759672952263.png";

export default function Register() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formSchema = userRegistrationSchema.extend({
    confirmPassword: z.string().min(1, t("register.confirmPasswordRequired")),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("register.passwordMismatch"),
    path: ["confirmPassword"],
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      preferredLanguage: language,
      nationality: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { confirmPassword, ...registerData } = data;
      return await apiRequest("POST", "/api/register", registerData);
    },
    onSuccess: (data: any, variables: FormData) => {
      // Store email in session for verification page
      sessionStorage.setItem("verificationEmail", variables.email);
      
      toast({
        title: t("register.success"),
        description: "Revisa tu email para el código de verificación",
      });
      setLocation("/verify-email");
    },
    onError: (error: any) => {
      toast({
        title: t("register.error"),
        description: error.message || t("register.errorDesc"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    registerMutation.mutate(data);
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
          <CardTitle className="text-2xl">{t("register.title")}</CardTitle>
          <CardDescription>
            {t("register.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("register.firstName")}</Label>
                <Input
                  id="firstName"
                  placeholder="Juan"
                  {...form.register("firstName")}
                  data-testid="input-firstName"
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("register.lastName")}</Label>
                <Input
                  id="lastName"
                  placeholder="Pérez"
                  {...form.register("lastName")}
                  data-testid="input-lastName"
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("register.email")}</Label>
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
              <Label htmlFor="phone">{t("register.phoneOptional")}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                {...form.register("phone")}
                data-testid="input-phone"
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredLanguage">{t("register.preferredLanguage")}</Label>
              <Select
                value={form.watch("preferredLanguage")}
                onValueChange={(value) => form.setValue("preferredLanguage", value as "es" | "en")}
              >
                <SelectTrigger id="preferredLanguage" data-testid="select-language">
                  <SelectValue placeholder="Selecciona un idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">{t("register.languageSpanish")}</SelectItem>
                  <SelectItem value="en">{t("register.languageEnglish")}</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.preferredLanguage && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.preferredLanguage.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationality">{t("register.nationality")}</Label>
              <Input
                id="nationality"
                placeholder={language === "es" ? "México" : "Mexico"}
                {...form.register("nationality")}
                data-testid="input-nationality"
              />
              {form.formState.errors.nationality && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nationality.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("register.password")}</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("register.confirmPassword")}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...form.register("confirmPassword")}
                  data-testid="input-confirmPassword"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  data-testid="button-toggle-confirmPassword"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
              data-testid="button-register"
            >
              {registerMutation.isPending ? t("register.submitting") : t("register.submit")}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {t("register.hasAccount")}{" "}
              <button
                type="button"
                onClick={() => setLocation("/")}
                className="text-primary hover:underline"
                data-testid="link-login"
              >
                {t("register.loginLink")}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
