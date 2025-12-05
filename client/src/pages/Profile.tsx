import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  Upload, 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  Globe, 
  Bell, 
  Shield, 
  CheckCircle2,
  Building2,
  Briefcase,
  Clock,
  MessageSquare
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserProfileSchema, type UpdateUserProfile, changePasswordSchema, type ChangePassword } from "@shared/schema";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

const TIMEZONES = [
  { value: "America/Mexico_City", label: "Ciudad de México (GMT-6)" },
  { value: "America/Cancun", label: "Cancún (GMT-5)" },
  { value: "America/Tijuana", label: "Tijuana (GMT-8)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8)" },
  { value: "America/New_York", label: "New York (GMT-5)" },
  { value: "America/Chicago", label: "Chicago (GMT-6)" },
  { value: "America/Denver", label: "Denver (GMT-7)" },
  { value: "Europe/Madrid", label: "Madrid (GMT+1)" },
  { value: "Europe/London", label: "Londres (GMT+0)" },
  { value: "UTC", label: "UTC (GMT+0)" },
];

const changePasswordFormSchema = changePasswordSchema.extend({
  confirmPassword: z.string().min(1, "Por favor confirma tu contraseña"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordFormSchema>;

function SecurityTab() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePassword) => {
      return await apiRequest("POST", "/api/auth/change-password", data);
    },
    onSuccess: () => {
      form.reset();
      setSuccessMessage(language === "es" 
        ? "Tu contraseña se actualizó correctamente." 
        : "Your password was updated successfully.");
      toast({
        title: language === "es" ? "Contraseña actualizada" : "Password updated",
        description: language === "es" 
          ? "Tu contraseña se ha actualizado correctamente."
          : "Your password has been updated successfully.",
      });
    },
    onError: (error: any) => {
      setSuccessMessage(null);
      const errorMessage = error.message || "";
      if (errorMessage.includes("incorrect") || errorMessage.includes("Current password")) {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: language === "es" 
            ? "La contraseña actual es incorrecta."
            : "Current password is incorrect.",
          variant: "destructive",
        });
      } else {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: error.message || (language === "es" 
            ? "No se pudo actualizar la contraseña."
            : "Failed to update password."),
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: ChangePasswordForm) => {
    setSuccessMessage(null);
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {language === "es" ? "Seguridad" : "Security"}
        </CardTitle>
        <CardDescription>
          {language === "es" 
            ? "Gestiona tu contraseña y la seguridad de tu cuenta."
            : "Manage your password and account security."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">
              {language === "es" ? "Cambiar contraseña" : "Change password"}
            </h3>
            
            {successMessage && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Contraseña actual" : "Current password"}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="••••••••"
                            data-testid="input-current-password"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            data-testid="button-toggle-current-password"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nueva contraseña" : "New password"}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showNewPassword ? "text" : "password"}
                            placeholder="••••••••"
                            data-testid="input-new-password"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            data-testid="button-toggle-new-password"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        {language === "es" 
                          ? "Mínimo 8 caracteres, 1 mayúscula, 1 número"
                          : "Minimum 8 characters, 1 uppercase, 1 number"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Confirmar nueva contraseña" : "Confirm new password"}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            data-testid="input-confirm-password"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            data-testid="button-toggle-confirm-password"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="gap-2"
                  data-testid="button-update-password"
                >
                  <Lock className="h-4 w-4" />
                  {changePasswordMutation.isPending 
                    ? (language === "es" ? "Actualizando..." : "Updating...")
                    : (language === "es" ? "Actualizar contraseña" : "Update password")}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getRoleBadge(role: string, language: string) {
  const roleLabels: Record<string, { es: string; en: string; variant: "default" | "secondary" | "outline" }> = {
    admin: { es: "Administrador de Plataforma", en: "Platform Administrator", variant: "default" },
    master: { es: "Master", en: "Master", variant: "default" },
    super_admin: { es: "Super Administrador", en: "Super Administrator", variant: "default" },
    vendedor: { es: "Vendedor", en: "Seller", variant: "secondary" },
    propietario: { es: "Propietario", en: "Property Owner", variant: "secondary" },
    cliente: { es: "Cliente", en: "Client", variant: "outline" },
    external_agency_admin: { es: "Admin de Agencia", en: "Agency Admin", variant: "default" },
    external_agency_seller: { es: "Vendedor de Agencia", en: "Agency Seller", variant: "secondary" },
    external_agency_owner: { es: "Propietario Externo", en: "External Owner", variant: "secondary" },
    external_agency_accountant: { es: "Contador", en: "Accountant", variant: "secondary" },
    external_agency_maintenance: { es: "Mantenimiento", en: "Maintenance", variant: "secondary" },
    sales_agent: { es: "Agente de Ventas", en: "Sales Agent", variant: "secondary" },
    lawyer: { es: "Abogado", en: "Lawyer", variant: "secondary" },
  };
  
  const roleInfo = roleLabels[role] || { es: role, en: role, variant: "outline" as const };
  return (
    <Badge variant={roleInfo.variant}>
      {language === "es" ? roleInfo.es : roleInfo.en}
    </Badge>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageChanged, setImageChanged] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>("");

  const form = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      whatsapp: "",
      bio: "",
      profileImageUrl: "",
      preferredLanguage: "es",
      timezone: "America/Mexico_City",
      notificationPreferences: {
        newVisits: true,
        paymentReminders: true,
        appUpdates: true,
        emailNotifications: true,
      },
    },
  });

  useEffect(() => {
    if (user) {
      const userImage = user.profileImageUrl || "";
      const notifPrefs = (user as any).notificationPreferences || {
        newVisits: true,
        paymentReminders: true,
        appUpdates: true,
        emailNotifications: true,
      };
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        whatsapp: (user as any).whatsapp || "",
        bio: user.bio || "",
        profileImageUrl: userImage,
        preferredLanguage: (user.preferredLanguage === "en" ? "en" : "es") as "es" | "en",
        timezone: (user as any).timezone || "America/Mexico_City",
        notificationPreferences: notifPrefs,
      });
      setImagePreview(userImage);
      setOriginalImage(userImage);
      setImageChanged(false);
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfile) => {
      const payload = { ...data };
      if (!imageChanged) {
        delete payload.profileImageUrl;
      }
      return await apiRequest("PATCH", "/api/profile", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setImageChanged(false);
      toast({
        title: language === "es" ? "Perfil actualizado" : "Profile updated",
        description: language === "es" 
          ? "Tu perfil se ha actualizado correctamente."
          : "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" 
          ? "No se pudo actualizar el perfil."
          : "Failed to update profile."),
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: language === "es" ? "Por favor selecciona una imagen válida." : "Please select a valid image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: language === "es" ? "La imagen no puede superar 2MB." : "Image cannot exceed 2MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      form.setValue("profileImageUrl", base64String, { shouldDirty: true });
      setImageChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    form.setValue("profileImageUrl", "", { shouldDirty: true });
    setImageChanged(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (data: UpdateUserProfile) => {
    updateProfileMutation.mutate(data);
  };

  const getInitials = () => {
    const firstName = form.watch("firstName");
    const lastName = form.watch("lastName");
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const isAdminRole = user?.role === "admin" || user?.role === "master" || user?.role === "super_admin";
  const isAgencyRole = user?.role?.startsWith("external_agency_");
  const isOwnerRole = user?.role === "propietario" || user?.role === "external_agency_owner";
  const isTenantRole = user?.role === "cliente";

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <User className="h-7 w-7 text-primary" />
          {language === "es" ? "Mi Perfil" : "My Profile"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === "es" 
            ? "Administra tu información personal, contacto y seguridad de tu cuenta."
            : "Manage your personal information, contact details, and account security."}
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="personal" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-personal">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Datos Personales" : "Personal Data"}</span>
            <span className="sm:hidden">{language === "es" ? "Personal" : "Personal"}</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-contact">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Contacto" : "Contact"}</span>
            <span className="sm:hidden">{language === "es" ? "Contacto" : "Contact"}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-security">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Seguridad" : "Security"}</span>
            <span className="sm:hidden">{language === "es" ? "Seguridad" : "Security"}</span>
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {language === "es" ? "Datos Personales" : "Personal Data"}
                  </CardTitle>
                  <CardDescription>
                    {language === "es" 
                      ? "Información básica de tu cuenta y perfil."
                      : "Basic information about your account and profile."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex flex-col items-center gap-3">
                      <Avatar className="h-28 w-28 border-4 border-primary/20">
                        <AvatarImage src={imagePreview} alt={`${form.watch("firstName")} ${form.watch("lastName")}`} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">{getInitials()}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          data-testid="button-upload-image"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {language === "es" ? "Subir" : "Upload"}
                        </Button>
                        
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveImage}
                            data-testid="button-remove-image"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        data-testid="input-image-file"
                      />
                      
                      <p className="text-xs text-muted-foreground text-center">
                        JPG, PNG, WebP. {language === "es" ? "Máx. 2MB" : "Max 2MB"}
                      </p>
                    </div>

                    <div className="flex-1 w-full space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === "es" ? "Nombre" : "First Name"}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Juan" data-testid="input-first-name" />
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
                              <FormLabel>{language === "es" ? "Apellido" : "Last Name"}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Pérez" data-testid="input-last-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="preferredLanguage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                {language === "es" ? "Idioma" : "Language"}
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-language">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="es">Español</SelectItem>
                                  <SelectItem value="en">English</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="timezone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {language === "es" ? "Zona Horaria" : "Timezone"}
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-timezone">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TIMEZONES.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value}>
                                      {tz.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{language === "es" ? "Tu rol en la plataforma" : "Your role on the platform"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {language === "es" ? "Este rol determina tu acceso y permisos." : "This role determines your access and permissions."}
                      </p>
                    </div>
                    {getRoleBadge(user?.role || "cliente", language)}
                  </div>

                  {isAdminRole && (
                    <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h4 className="font-medium">{language === "es" ? "Información de Administrador" : "Administrator Information"}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{language === "es" ? "Empresa:" : "Company:"}</span>
                          <p className="font-medium">HomesApp</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{language === "es" ? "Nivel de acceso:" : "Access level:"}</span>
                          <p className="font-medium">{language === "es" ? "Administrador completo" : "Full administrator"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isAgencyRole && (
                    <div className="p-4 rounded-lg border bg-muted/50">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-medium">{language === "es" ? "Información de Agencia" : "Agency Information"}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {language === "es" 
                          ? "Tu información de agencia se gestiona desde la configuración de agencia."
                          : "Your agency information is managed from agency settings."}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-4">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="gap-2"
                    data-testid="button-save-personal"
                  >
                    <Save className="h-4 w-4" />
                    {updateProfileMutation.isPending 
                      ? (language === "es" ? "Guardando..." : "Saving...")
                      : (language === "es" ? "Guardar cambios" : "Save changes")}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    {language === "es" ? "Contacto y Preferencias" : "Contact & Preferences"}
                  </CardTitle>
                  <CardDescription>
                    {language === "es" 
                      ? "Gestiona tu información de contacto y preferencias de notificación."
                      : "Manage your contact information and notification preferences."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {language === "es" ? "Correo electrónico" : "Email"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          value={user?.email || ""}
                          disabled
                          className="bg-muted"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormDescription>
                        {language === "es" 
                          ? "El correo electrónico no se puede cambiar aquí."
                          : "Email cannot be changed here."}
                      </FormDescription>
                    </FormItem>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {language === "es" ? "Teléfono" : "Phone"}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+52 123 456 7890" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              WhatsApp
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+52 123 456 7890" data-testid="input-whatsapp" />
                            </FormControl>
                            <FormDescription className="text-xs">
                              {language === "es" 
                                ? "Puede ser diferente al teléfono"
                                : "Can be different from phone"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      {language === "es" ? "Preferencias de Notificación" : "Notification Preferences"}
                    </h3>
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="notificationPreferences.newVisits"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="font-medium cursor-pointer">
                                {language === "es" ? "Nuevas visitas" : "New visits"}
                              </FormLabel>
                              <FormDescription className="text-xs">
                                {language === "es" 
                                  ? "Recibir notificaciones cuando se programen nuevas visitas"
                                  : "Receive notifications when new visits are scheduled"}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-notif-visits"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="notificationPreferences.paymentReminders"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="font-medium cursor-pointer">
                                {language === "es" ? "Recordatorios de pagos" : "Payment reminders"}
                              </FormLabel>
                              <FormDescription className="text-xs">
                                {language === "es" 
                                  ? "Recibir recordatorios sobre pagos próximos o pendientes"
                                  : "Receive reminders about upcoming or pending payments"}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-notif-payments"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="notificationPreferences.appUpdates"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="font-medium cursor-pointer">
                                {language === "es" ? "Actualizaciones de la app" : "App updates"}
                              </FormLabel>
                              <FormDescription className="text-xs">
                                {language === "es" 
                                  ? "Recibir información sobre nuevas funciones y mejoras"
                                  : "Receive information about new features and improvements"}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-notif-updates"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="notificationPreferences.emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="font-medium cursor-pointer">
                                {language === "es" ? "Notificaciones por email" : "Email notifications"}
                              </FormLabel>
                              <FormDescription className="text-xs">
                                {language === "es" 
                                  ? "Recibir notificaciones importantes por correo electrónico"
                                  : "Receive important notifications via email"}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-notif-email"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-4">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="gap-2"
                    data-testid="button-save-contact"
                  >
                    <Save className="h-4 w-4" />
                    {updateProfileMutation.isPending 
                      ? (language === "es" ? "Guardando..." : "Saving...")
                      : (language === "es" ? "Guardar cambios" : "Save changes")}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </form>
        </Form>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
