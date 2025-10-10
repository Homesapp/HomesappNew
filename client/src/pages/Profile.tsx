import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Trash2, Save, Upload, X, MessageCircle, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { ChatConversation } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserProfileSchema, type UpdateUserProfile } from "@shared/schema";
import { useEffect, useRef, useState } from "react";

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <Separator />
      <div>
        <h3 className="text-lg font-medium mb-2">{t("profile.appearance") || "Apariencia"}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("profile.appearanceDesc") || "Personaliza cómo se ve la aplicación"}
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
            {t("profile.lightMode") || "Modo claro"}
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
            {t("profile.darkMode") || "Modo oscuro"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageChanged, setImageChanged] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>("");
  const dateLocale = language === 'en' ? enUS : es;

  const form = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      bio: "",
      profileImageUrl: "",
    },
  });

  useEffect(() => {
    if (user) {
      const userImage = user.profileImageUrl || "";
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        bio: user.bio || "",
        profileImageUrl: userImage,
      });
      setImagePreview(userImage);
      setOriginalImage(userImage);
      setImageChanged(false);
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfile) => {
      const payload = { ...data };
      
      // Solo incluir profileImageUrl si cambió
      if (!imageChanged) {
        delete payload.profileImageUrl;
      }
      
      return await apiRequest("PATCH", "/api/profile", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setImageChanged(false);
      toast({
        title: t("profile.profileUpdated"),
        description: t("profile.profileUpdatedDesc"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error") || "Error",
        description: error.message || t("profile.updateError"),
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/profile");
    },
    onSuccess: () => {
      toast({
        title: t("profile.accountDeleted"),
        description: t("profile.accountDeletedDesc"),
      });
      setTimeout(() => {
        setLocation("/");
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || t("profile.deleteError"),
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: t("profile.imageError"),
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: t("profile.imageSizeError"),
        variant: "destructive",
      });
      return;
    }

    // Convertir a base64
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

  const { data: conversations = [] } = useQuery<ChatConversation[]>({
    queryKey: ["/api/chat/conversations"],
    queryFn: async () => {
      const response = await fetch("/api/chat/conversations");
      if (!response.ok) throw new Error("Failed to fetch conversations");
      return response.json();
    },
  });

  const recentConversations = conversations.slice(0, 5);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{t("profile.title")}</h1>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal" data-testid="tab-personal">
            {t("profile.personalInfo")}
          </TabsTrigger>
          <TabsTrigger value="chat" data-testid="tab-chat">
            <MessageCircle className="h-4 w-4 mr-2" />
            {t("profile.conversations")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
            <CardHeader>
              <CardTitle>{t("profile.personalInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image Upload Section */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={imagePreview} alt={`${form.watch("firstName")} ${form.watch("lastName")}`} />
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
                  control={form.control}
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
                  control={form.control}
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

              <FormItem>
                <FormLabel>{t("profile.email")}</FormLabel>
                <FormControl>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                    data-testid="input-email"
                  />
                </FormControl>
                <FormDescription>
                  {t("profile.emailCannotChange")}
                </FormDescription>
              </FormItem>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile.phone")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+52 123 456 7890"
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile.bio")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t("profile.bioPlaceholder")}
                        rows={4}
                        data-testid="textarea-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Appearance Settings */}
              <AppearanceSettings />
            </CardContent>
            <CardFooter className="flex flex-col-reverse sm:flex-row justify-between gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deleteAccountMutation.isPending}
                    className="w-full sm:w-auto"
                    data-testid="button-delete-account"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteAccountMutation.isPending ? t("profile.deleting") : t("profile.deleteAccount")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("profile.deleteConfirmTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("profile.deleteConfirmDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-delete">{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteAccountMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-testid="button-confirm-delete"
                      disabled={deleteAccountMutation.isPending}
                    >
                      {deleteAccountMutation.isPending ? t("profile.deleting") : t("common.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full sm:w-auto"
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

        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.recentConversations")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentConversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("profile.noConversations")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentConversations.map((conversation) => (
                    <Card
                      key={conversation.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => setLocation("/chat")}
                      data-testid={`conversation-${conversation.id}`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {conversation.isBot ? "🤖" : "👤"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm">
                                  {conversation.title}
                                </h4>
                                {conversation.isBot && (
                                  <Badge variant="secondary" className="text-xs">
                                    {t("profile.bot")}
                                  </Badge>
                                )}
                              </div>
                              {conversation.lastMessageAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                                    addSuffix: true,
                                    locale: dateLocale,
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/chat")}
                  data-testid="button-view-all-chats"
                >
                  {t("profile.viewAllChats")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
