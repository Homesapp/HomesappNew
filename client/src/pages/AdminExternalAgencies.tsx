import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExternalAgencySchema } from "@shared/schema";
import type { ExternalAgency, ExternalAgencySummary, ExternalAgencyListResponse } from "@shared/schema";
import { z } from "zod";
import { Plus, Pencil, Trash2, Building2, Search, Key, Copy, Upload, X, ChevronLeft, ChevronRight, Home, Users, FileText, Loader2, MoreVertical, Phone, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { compressImage } from "@/lib/imageCompression";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formSchema = insertExternalAgencySchema.extend({
  assignedUserId: z.string().min(1, "Please select a user"),
});

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

function AgencyCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );
}

function AgencyRowSkeleton() {
  return (
    <TableRow className="animate-pulse">
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </TableCell>
    </TableRow>
  );
}

interface AgencyCardProps {
  agency: ExternalAgencySummary;
  language: string;
  onEdit: (agency: ExternalAgencySummary) => void;
  onDelete: (agency: ExternalAgencySummary) => void;
  onResetPassword: (userId: string) => void;
  isLoadingEdit: boolean;
  isResettingPassword: boolean;
}

function AgencyCard({ agency, language, onEdit, onDelete, onResetPassword, isLoadingEdit, isResettingPassword }: AgencyCardProps) {
  return (
    <Card data-testid={`card-agency-${agency.id}`} className="hover-elevate transition-all">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold truncate" data-testid={`text-agency-name-${agency.id}`}>
              {agency.name}
            </h3>
            {agency.contactName && (
              <p className="text-sm text-muted-foreground truncate">
                {agency.contactName}
              </p>
            )}
          </div>
          <Badge variant={agency.isActive ? "default" : "secondary"} className="shrink-0">
            {agency.isActive 
              ? (language === "es" ? "Activa" : "Active")
              : (language === "es" ? "Inactiva" : "Inactive")}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs">
            <Home className="h-3 w-3 mr-1" />
            {agency.propertiesCount} {language === "es" ? "prop." : "prop."}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {agency.leadsCount} {language === "es" ? "leads" : "leads"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            {agency.contractsCount} {language === "es" ? "contr." : "contr."}
          </Badge>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          {agency.contactEmail && (
            <div className="flex items-center gap-1 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{agency.contactEmail}</span>
            </div>
          )}
          {agency.contactPhone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{agency.contactPhone}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {format(new Date(agency.createdAt), 'dd/MM/yyyy')}
          </span>
          <div className="flex items-center gap-1">
            {agency.assignedUser && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onResetPassword(agency.assignedUser!.id)}
                disabled={isResettingPassword}
                title={language === "es" ? "Gestionar contraseña" : "Manage password"}
                data-testid={`button-password-mobile-${agency.id}`}
              >
                <Key className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(agency)}
              disabled={isLoadingEdit}
              data-testid={`button-edit-mobile-${agency.id}`}
            >
              {isLoadingEdit ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(agency)}
              data-testid={`button-delete-mobile-${agency.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminExternalAgencies() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<ExternalAgency | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<{password: string, email: string} | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: agencyResponse, isLoading: isLoadingAgencies, isFetching } = useQuery<ExternalAgencyListResponse>({
    queryKey: ['/api/external-agencies/summary', { page, limit, search: debouncedSearch }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      const response = await fetch(`/api/external-agencies/summary?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch agencies');
      }
      return response.json();
    },
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  const agencies = agencyResponse?.agencies ?? [];
  const totalPages = agencyResponse?.totalPages ?? 1;
  const totalAgencies = agencyResponse?.total ?? 0;

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    select: (users) => users.filter(user => user.status === "approved"),
    staleTime: 60000,
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "Solo se permiten imágenes" : "Only images are allowed",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingLogo(true);
      setUploadProgress(0);

      const result = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85,
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      const originalSizeKB = Math.round(result.originalSize / 1024);
      const compressedSizeKB = Math.round(result.compressedSize / 1024);

      setLogoPreview(result.base64);
      form.setValue("agencyLogoUrl", result.base64);
      setUploadProgress(100);
      
      toast({
        title: language === "es" ? "Logo cargado" : "Logo uploaded",
        description: language === "es" 
          ? `Imagen comprimida de ${originalSizeKB}KB a ${compressedSizeKB}KB`
          : `Image compressed from ${originalSizeKB}KB to ${compressedSizeKB}KB`,
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" 
          ? "No se pudo cargar el logo"
          : "Could not upload logo",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    form.setValue("agencyLogoUrl", "");
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      agencyLogoUrl: "",
      isActive: true,
      autoApprovePublications: false,
      assignedUserId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const { assignedUserId, ...agencyData } = data;
      return await apiRequest("POST", "/api/external-agencies", {
        ...agencyData,
        createdBy: assignedUserId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agencies/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external-agencies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsCreateDialogOpen(false);
      form.reset();
      setLogoPreview(null);
      toast({
        title: language === "es" ? "Agencia creada" : "Agency created",
        description: language === "es" 
          ? "La agencia externa ha sido creada exitosamente"
          : "External agency has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo crear la agencia"
          : "Could not create agency",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!selectedAgency) return;
      const { assignedUserId, ...agencyData } = data;
      return await apiRequest("PATCH", `/api/external-agencies/${selectedAgency.id}`, {
        ...agencyData,
        createdBy: assignedUserId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agencies/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external-agencies'] });
      setIsEditDialogOpen(false);
      setSelectedAgency(null);
      toast({
        title: language === "es" ? "Agencia actualizada" : "Agency updated",
        description: language === "es" 
          ? "La agencia ha sido actualizada exitosamente"
          : "Agency has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo actualizar la agencia"
          : "Could not update agency",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/external-agencies/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agencies/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external-agencies'] });
      setIsDeleteDialogOpen(false);
      setSelectedAgency(null);
      toast({
        title: language === "es" ? "Agencia eliminada" : "Agency deleted",
        description: language === "es" 
          ? "La agencia ha sido eliminada exitosamente"
          : "Agency has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo eliminar la agencia"
          : "Could not delete agency",
        variant: "destructive",
      });
    },
  });

  const setPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/set-password`, {});
      return await response.json();
    },
    onSuccess: (data: any) => {
      setGeneratedPassword({ password: data.temporaryPassword, email: data.email });
      setIsPasswordDialogOpen(true);
      toast({
        title: language === "es" ? "Contraseña generada" : "Password generated",
        description: language === "es" 
          ? "La contraseña temporal ha sido generada exitosamente"
          : "Temporary password has been generated successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo generar la contraseña"
          : "Could not generate password",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`, {});
      return await response.json();
    },
    onSuccess: (data: any) => {
      setGeneratedPassword({ 
        password: data.temporaryPassword, 
        email: data.email 
      });
      setIsPasswordDialogOpen(true);
      toast({
        title: language === "es" ? "Contraseña restablecida" : "Password reset",
        description: language === "es" 
          ? "La contraseña ha sido restablecida exitosamente"
          : "Password has been reset successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo restablecer la contraseña"
          : "Could not reset password",
        variant: "destructive",
      });
    },
  });

  const onSubmitCreate = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(data);
  };

  const onSubmitEdit = (data: z.infer<typeof formSchema>) => {
    updateMutation.mutate(data);
  };

  const handleEdit = async (agencySummary: ExternalAgencySummary) => {
    try {
      setLoadingEditId(agencySummary.id);
      const response = await fetch(`/api/external-agencies/${agencySummary.id}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch agency details');
      }
      const agency: ExternalAgency = await response.json();
      setSelectedAgency(agency);
      setLogoPreview(agency.agencyLogoUrl || null);
      form.reset({
        name: agency.name,
        description: agency.description || "",
        contactName: agency.contactName || "",
        contactEmail: agency.contactEmail || "",
        contactPhone: agency.contactPhone || "",
        agencyLogoUrl: agency.agencyLogoUrl || "",
        isActive: agency.isActive,
        autoApprovePublications: agency.autoApprovePublications ?? false,
        assignedUserId: agency.createdBy || "",
      });
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Error fetching agency details:", error);
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudieron cargar los detalles de la agencia"
          : "Could not load agency details",
        variant: "destructive",
      });
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleDelete = (agencySummary: ExternalAgencySummary) => {
    setSelectedAgency({ id: agencySummary.id, name: agencySummary.name } as ExternalAgency);
    setIsDeleteDialogOpen(true);
  };

  const renderTableView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{language === "es" ? "Nombre" : "Name"}</TableHead>
          <TableHead>{language === "es" ? "Contacto" : "Contact"}</TableHead>
          <TableHead>{language === "es" ? "KPIs" : "KPIs"}</TableHead>
          <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
          <TableHead>{language === "es" ? "Fecha" : "Date"}</TableHead>
          <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoadingAgencies ? (
          Array.from({ length: 5 }).map((_, i) => (
            <AgencyRowSkeleton key={i} />
          ))
        ) : agencies.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              {language === "es" 
                ? "No hay agencias externas registradas"
                : "No external agencies registered"}
            </TableCell>
          </TableRow>
        ) : (
          agencies.map((agency) => {
            const assignedUser = agency.assignedUser;
            const isEditLoading = loadingEditId === agency.id;
            return (
              <TableRow key={agency.id} data-testid={`row-agency-${agency.id}`}>
                <TableCell>
                  <div className="font-medium">{agency.name}</div>
                  {assignedUser && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {assignedUser.firstName} {assignedUser.lastName}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm space-y-0.5">
                    {agency.contactName && <div>{agency.contactName}</div>}
                    {agency.contactEmail && (
                      <div className="text-muted-foreground text-xs">{agency.contactEmail}</div>
                    )}
                    {agency.contactPhone && (
                      <div className="text-muted-foreground text-xs">{agency.contactPhone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      <Home className="h-3 w-3 mr-1" />
                      {agency.propertiesCount}
                    </Badge>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      <Users className="h-3 w-3 mr-1" />
                      {agency.leadsCount}
                    </Badge>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      <FileText className="h-3 w-3 mr-1" />
                      {agency.contractsCount}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={agency.isActive ? "default" : "secondary"}>
                    {agency.isActive 
                      ? (language === "es" ? "Activa" : "Active")
                      : (language === "es" ? "Inactiva" : "Inactive")}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {format(new Date(agency.createdAt), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {assignedUser && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => resetPasswordMutation.mutate(assignedUser.id)}
                        disabled={resetPasswordMutation.isPending}
                        title={language === "es" ? "Gestionar contraseña" : "Manage password"}
                        data-testid={`button-password-${agency.id}`}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(agency)}
                      disabled={isEditLoading}
                      data-testid={`button-edit-${agency.id}`}
                    >
                      {isEditLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Pencil className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(agency)}
                      data-testid={`button-delete-${agency.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  const renderCardView = () => (
    <div className="grid gap-3">
      {isLoadingAgencies ? (
        Array.from({ length: 4 }).map((_, i) => (
          <AgencyCardSkeleton key={i} />
        ))
      ) : agencies.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground" data-testid="div-no-agencies">
          {language === "es" 
            ? "No hay agencias externas registradas"
            : "No external agencies registered"}
        </div>
      ) : (
        agencies.map((agency) => (
          <AgencyCard
            key={agency.id}
            agency={agency}
            language={language}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onResetPassword={(userId) => resetPasswordMutation.mutate(userId)}
            isLoadingEdit={loadingEditId === agency.id}
            isResettingPassword={resetPasswordMutation.isPending}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Agencias Externas" : "External Agencies"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-page-description">
            {language === "es" 
              ? "Gestiona las agencias externas del sistema"
              : "Manage external agencies in the system"}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-agency" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {language === "es" ? "Nueva Agencia" : "New Agency"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {language === "es" ? "Crear Agencia Externa" : "Create External Agency"}
              </DialogTitle>
              <DialogDescription>
                {language === "es" 
                  ? "Completa la información para crear una nueva agencia externa"
                  : "Fill in the information to create a new external agency"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="assignedUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Usuario Asignado" : "Assigned User"} *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoadingUsers}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-assigned-user">
                            <SelectValue placeholder={language === "es" ? "Seleccionar usuario" : "Select user"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {language === "es" 
                          ? "El usuario recibirá el rol de administrador de agencia externa"
                          : "The user will receive the external agency admin role"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nombre de la Agencia" : "Agency Name"} *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-agency-name"
                          placeholder={language === "es" ? "Ej: Inmobiliaria Tulum" : "E.g.: Tulum Real Estate"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Descripción" : "Description"}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          data-testid="textarea-description"
                          placeholder={language === "es" ? "Descripción de la agencia" : "Agency description"}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Nombre de Contacto" : "Contact Name"}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            data-testid="input-contact-name"
                            placeholder={language === "es" ? "Nombre" : "Name"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Email de Contacto" : "Contact Email"}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            data-testid="input-contact-email"
                            type="email"
                            placeholder="contact@agency.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Teléfono de Contacto" : "Contact Phone"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-contact-phone"
                          placeholder="+52 123 456 7890"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === "es" ? "Logo de la Agencia" : "Agency Logo"}
                  </label>
                  
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-32 h-32 object-contain border rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={handleRemoveLogo}
                        data-testid="button-remove-logo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        {language === "es" 
                          ? "Haz clic para subir el logo"
                          : "Click to upload logo"}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                        data-testid="input-logo-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        disabled={isUploadingLogo}
                        data-testid="button-upload-logo"
                      >
                        {isUploadingLogo 
                          ? `${uploadProgress}%` 
                          : (language === "es" ? "Seleccionar archivo" : "Select file")}
                      </Button>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {language === "es" ? "Agencia Activa" : "Active Agency"}
                        </FormLabel>
                        <FormDescription>
                          {language === "es" 
                            ? "Las agencias inactivas no pueden publicar propiedades"
                            : "Inactive agencies cannot publish properties"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoApprovePublications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {language === "es" ? "Auto-aprobar Publicaciones" : "Auto-approve Publications"}
                        </FormLabel>
                        <FormDescription>
                          {language === "es" 
                            ? "Las propiedades se publicarán automáticamente sin revisión manual"
                            : "Properties will be published automatically without manual review"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-auto-approve"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      form.reset();
                      setLogoPreview(null);
                    }}
                    data-testid="button-cancel-create"
                    className="w-full sm:w-auto"
                  >
                    {language === "es" ? "Cancelar" : "Cancel"}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit-create"
                    className="w-full sm:w-auto"
                  >
                    {createMutation.isPending 
                      ? (language === "es" ? "Creando..." : "Creating...") 
                      : (language === "es" ? "Crear Agencia" : "Create Agency")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === "es" ? "Buscar agencias..." : "Search agencies..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-agencies"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" data-testid="badge-agency-count" className="whitespace-nowrap">
            {totalAgencies} {language === "es" ? "agencias" : "agencies"}
          </Badge>
          {isFetching && !isLoadingAgencies && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <Card data-testid="card-agencies-table">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            {language === "es" ? "Agencias Externas" : "External Agencies"}
          </CardTitle>
          <CardDescription className="text-sm">
            {language === "es" 
              ? "Lista de todas las agencias externas registradas"
              : "List of all registered external agencies"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isMobile ? renderCardView() : renderTableView()}
          
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                {language === "es" 
                  ? `Página ${page} de ${totalPages}`
                  : `Page ${page} of ${totalPages}`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {language === "es" ? "Anterior" : "Previous"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isFetching}
                  data-testid="button-next-page"
                >
                  {language === "es" ? "Siguiente" : "Next"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Editar Agencia" : "Edit Agency"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Actualiza la información de la agencia"
                : "Update agency information"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Nombre de la Agencia" : "Agency Name"} *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        data-testid="input-edit-agency-name"
                        placeholder={language === "es" ? "Ej: Inmobiliaria Tulum" : "E.g.: Tulum Real Estate"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Descripción" : "Description"}</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        data-testid="textarea-edit-description"
                        placeholder={language === "es" ? "Descripción de la agencia" : "Agency description"}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nombre de Contacto" : "Contact Name"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-edit-contact-name"
                          placeholder={language === "es" ? "Nombre" : "Name"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Email de Contacto" : "Contact Email"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-edit-contact-email"
                          type="email"
                          placeholder="contact@agency.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Teléfono de Contacto" : "Contact Phone"}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        data-testid="input-edit-contact-phone"
                        placeholder="+52 123 456 7890"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Usuario Asignado" : "Assigned User"}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoadingUsers}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-assigned-user">
                          <SelectValue placeholder={language === "es" ? "Seleccionar usuario" : "Select user"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {language === "es" 
                        ? "Cambiar el usuario asignado reasignará el rol de administrador"
                        : "Changing the assigned user will reassign the admin role"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "es" ? "Logo de la Agencia" : "Agency Logo"}
                </label>
                
                {logoPreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-32 h-32 object-contain border rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={handleRemoveLogo}
                      data-testid="button-remove-logo-edit"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {language === "es" 
                        ? "Haz clic para subir el logo"
                        : "Click to upload logo"}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload-edit"
                      data-testid="input-logo-upload-edit"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload-edit')?.click()}
                      disabled={isUploadingLogo}
                      data-testid="button-upload-logo-edit"
                    >
                      {isUploadingLogo 
                        ? `${uploadProgress}%` 
                        : (language === "es" ? "Seleccionar archivo" : "Select file")}
                    </Button>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {language === "es" ? "Agencia Activa" : "Active Agency"}
                      </FormLabel>
                      <FormDescription>
                        {language === "es" 
                          ? "Las agencias inactivas no pueden publicar propiedades"
                          : "Inactive agencies cannot publish properties"}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-is-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoApprovePublications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {language === "es" ? "Auto-aprobar Publicaciones" : "Auto-approve Publications"}
                      </FormLabel>
                      <FormDescription>
                        {language === "es" 
                          ? "Las propiedades de esta agencia se publicarán automáticamente sin revisión manual"
                          : "Properties from this agency will be published automatically without manual review"}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-auto-approve"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                  className="w-full sm:w-auto"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-submit-edit"
                  className="w-full sm:w-auto"
                >
                  {updateMutation.isPending 
                    ? (language === "es" ? "Actualizando..." : "Updating...") 
                    : (language === "es" ? "Actualizar" : "Update")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "es" ? "¿Eliminar agencia?" : "Delete agency?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es" 
                ? `¿Estás seguro que deseas eliminar la agencia "${selectedAgency?.name}"? Esta acción eliminará todas las propiedades, pagos y tickets asociados a esta agencia. Esta acción no se puede deshacer.`
                : `Are you sure you want to delete the agency "${selectedAgency?.name}"? This action will delete all properties, payments, and tickets associated with this agency. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel data-testid="button-cancel-delete" className="w-full sm:w-auto">
              {language === "es" ? "Cancelar" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAgency && deleteMutation.mutate(selectedAgency.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending
                ? (language === "es" ? "Eliminando..." : "Deleting...")
                : (language === "es" ? "Eliminar" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Contraseña Temporal Generada" : "Temporary Password Generated"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? "Comparte estas credenciales con el usuario. La contraseña solo se mostrará una vez."
                : "Share these credentials with the user. The password will only be shown once."}
            </DialogDescription>
          </DialogHeader>
          {generatedPassword && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "es" ? "Email" : "Email"}
                </label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={generatedPassword.email} 
                    readOnly 
                    className="bg-muted"
                    data-testid="input-generated-email"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword.email);
                      toast({
                        title: language === "es" ? "Copiado" : "Copied",
                        description: language === "es" ? "Email copiado al portapapeles" : "Email copied to clipboard",
                      });
                    }}
                    data-testid="button-copy-email"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "es" ? "Contraseña Temporal" : "Temporary Password"}
                </label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={generatedPassword.password} 
                    readOnly 
                    className="bg-muted font-mono"
                    data-testid="input-generated-password"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword.password);
                      toast({
                        title: language === "es" ? "Copiado" : "Copied",
                        description: language === "es" ? "Contraseña copiada al portapapeles" : "Password copied to clipboard",
                      });
                    }}
                    data-testid="button-copy-password"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-900">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {language === "es" 
                    ? "El usuario deberá cambiar esta contraseña en su primer inicio de sesión."
                    : "The user must change this password on their first login."}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                setIsPasswordDialogOpen(false);
                setGeneratedPassword(null);
              }}
              data-testid="button-close-password-dialog"
              className="w-full sm:w-auto"
            >
              {language === "es" ? "Cerrar" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
