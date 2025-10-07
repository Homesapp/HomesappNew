import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, X, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateAdminProfileSchema, updateAdminPasswordSchema, type UpdateAdminProfile, type UpdateAdminPassword } from "@shared/schema";
import { useEffect, useRef, useState } from "react";

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <Separator />
      <div>
        <h3 className="text-lg font-medium mb-2">{t("adminProfile.appearance")}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("adminProfile.appearanceDesc")}
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={theme === "light" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("light")}
            data-testid="button-theme-light"
            className="flex-1"
          >
            <Sun className="h-4 w-4 mr-2" />
            {t("adminProfile.lightMode")}
          </Button>
          <Button
            type="button"
            variant={theme === "dark" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("dark")}
            data-testid="button-theme-dark"
            className="flex-1"
          >
            <Moon className="h-4 w-4 mr-2" />
            {t("adminProfile.darkMode")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProfile() {
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageChanged, setImageChanged] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>("");

  const profileForm = useForm<UpdateAdminProfile>({
    resolver: zodResolver(updateAdminProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      profileImageUrl: "",
    },
  });

  const passwordForm = useForm<UpdateAdminPassword>({
    resolver: zodResolver(updateAdminPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (adminUser) {
      const userImage = adminUser.profileImageUrl || "";
      profileForm.reset({
        firstName: adminUser.firstName || "",
        lastName: adminUser.lastName || "",
        email: adminUser.email || "",
        profileImageUrl: userImage,
      });
      setImagePreview(userImage);
      setOriginalImage(userImage);
      setImageChanged(false);
    }
  }, [adminUser, profileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateAdminProfile) => {
      const payload = { ...data };
      
      if (!imageChanged) {
        delete payload.profileImageUrl;
      }
      
      return await apiRequest("PATCH", "/api/auth/admin/profile", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/admin/user"] });
      setImageChanged(false);
      toast({
        title: t("profile.profileUpdated"),
        description: t("profile.profileUpdatedDesc"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("profile.updateError"),
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: UpdateAdminPassword) => {
      return await apiRequest("PATCH", "/api/auth/admin/password", data);
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: t("adminProfile.passwordUpdated"),
        description: t("adminProfile.passwordUpdatedDesc"),
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "";
      if (errorMessage.includes("incorrect")) {
        toast({
          title: t("common.error"),
          description: t("adminProfile.incorrectPassword"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("common.error"),
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: t("profile.imageError"),
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: t("profile.imageSizeError"),
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      profileForm.setValue("profileImageUrl", base64String, { shouldDirty: true });
      setImageChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    profileForm.setValue("profileImageUrl", "", { shouldDirty: true });
    setImageChanged(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmitProfile = (data: UpdateAdminProfile) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitPassword = (data: UpdateAdminPassword) => {
    updatePasswordMutation.mutate(data);
  };

  const getInitials = () => {
    const firstName = profileForm.watch("firstName");
    const lastName = profileForm.watch("lastName");
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (adminUser?.email) {
      return adminUser.email[0].toUpperCase();
    }
    return "A";
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6" data-testid="heading-admin-profile">{t("adminProfile.title")}</h1>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal" data-testid="tab-personal">
            {t("adminProfile.personalInfo")}
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            {t("adminProfile.security")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
              <Card>
                <CardHeader>
                  <CardTitle>{t("adminProfile.personalInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={imagePreview} alt={`${profileForm.watch("firstName")} ${profileForm.watch("lastName")}`} />
                      <AvatarFallback className="text-3xl">{getInitials()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="button-upload-image"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {t("profile.uploadPhoto")}
                      </Button>
                      
                      {imagePreview && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveImage}
                          data-testid="button-remove-image"
                        >
                          <X className="h-4 w-4 mr-2" />
                          {t("profile.removePhoto")}
                        </Button>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="input-image-file"
                    />

                    <p className="text-sm text-muted-foreground text-center">
                      {t("profile.imageFormats")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.firstName")}</FormLabel>
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
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.lastName")}</FormLabel>
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
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("profile.email")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="admin@example.com"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <AppearanceSettings />
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfileMutation.isPending ? t("profile.saving") : t("profile.saveChanges")}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="security">
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)}>
              <Card>
                <CardHeader>
                  <CardTitle>{t("adminProfile.security")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("adminProfile.currentPassword")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            data-testid="input-current-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("adminProfile.newPassword")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            data-testid="input-new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("adminProfile.confirmPassword")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            data-testid="input-confirm-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    disabled={updatePasswordMutation.isPending}
                    data-testid="button-update-password"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updatePasswordMutation.isPending ? t("adminProfile.updatingPassword") : t("adminProfile.updatePassword")}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
