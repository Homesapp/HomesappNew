import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, RotateCw, Copy, Check, Pencil, LayoutGrid, LayoutList, Mail, Phone, User as UserIcon, ArrowUpDown, ChevronUp, ChevronDown, Search, Filter } from "lucide-react";
import { useState, useLayoutEffect, useEffect, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { z } from "zod";
import type { User } from "@shared/schema";
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
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";

const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  phone: z.string().optional(),
  role: z.enum(["external_agency_admin", "external_agency_accounting", "external_agency_maintenance", "external_agency_staff", "external_agency_seller"]),
  maintenanceSpecialty: z.enum(["encargado_mantenimiento", "mantenimiento_general", "electrico", "plomero", "refrigeracion", "carpintero", "pintor", "jardinero", "albanil", "limpieza"]).optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  phone: z.string().optional(),
  role: z.enum(["external_agency_admin", "external_agency_accounting", "external_agency_maintenance", "external_agency_staff", "external_agency_seller"]),
  maintenanceSpecialty: z.enum(["encargado_mantenimiento", "mantenimiento_general", "electrico", "plomero", "refrigeracion", "carpintero", "pintor", "jardinero", "albanil", "limpieza"]).optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type UpdateUserForm = z.infer<typeof updateUserSchema>;

const ROLE_LABELS = {
  es: {
    external_agency_admin: "Admin Jr",
    external_agency_accounting: "Contabilidad",
    external_agency_maintenance: "Mantenimiento",
    external_agency_staff: "Staff",
    external_agency_seller: "Vendedor",
  },
  en: {
    external_agency_admin: "Admin Jr",
    external_agency_accounting: "Accounting",
    external_agency_maintenance: "Maintenance",
    external_agency_staff: "Staff",
    external_agency_seller: "Seller",
  },
};

const SPECIALTY_LABELS = {
  es: {
    encargado_mantenimiento: "Encargado de Mantenimiento",
    mantenimiento_general: "Mantenimiento General",
    electrico: "Eléctrico",
    plomero: "Plomero",
    refrigeracion: "Refrigeración",
    carpintero: "Carpintero",
    pintor: "Pintor",
    jardinero: "Jardinero",
    albanil: "Albañil",
    limpieza: "Limpieza",
  },
  en: {
    encargado_mantenimiento: "Maintenance Manager",
    mantenimiento_general: "General Maintenance",
    electrico: "Electrician",
    plomero: "Plumber",
    refrigeracion: "HVAC",
    carpintero: "Carpenter",
    pintor: "Painter",
    jardinero: "Gardener",
    albanil: "Mason",
    limpieza: "Cleaning",
  },
};

export default function ExternalAccounts() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState<string | null>(null);
  const [tempUserName, setTempUserName] = useState<string | null>(null);
  const [tempUserRole, setTempUserRole] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // View mode with SSR-safe auto-detection
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [manualViewModeOverride, setManualViewModeOverride] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Separate pagination for table and cards
  const [tablePage, setTablePage] = useState(1);
  const [cardsPage, setCardsPage] = useState(1);
  const [tableItemsPerPage, setTableItemsPerPage] = useState(10);
  const [cardsItemsPerPage, setCardsItemsPerPage] = useState(10);
  
  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Auto-detect mobile and set view mode (SSR-safe)
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!manualViewModeOverride) {
        setViewMode(mobile ? 'cards' : 'table');
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [manualViewModeOverride]);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/external-agency-users'],
  });

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "external_agency_staff",
    },
  });

  const editForm = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      role: "external_agency_staff",
    },
  });

  const openEditDialog = (user: User) => {
    editForm.reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      role: user.role as any,
      maintenanceSpecialty: (user.maintenanceSpecialty || undefined) as any,
    });
    setEditUserId(user.id);
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      const res = await apiRequest("POST", "/api/external-agency-users", data);
      return await res.json();
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agency-users'] });
      setTempPassword(response.tempPassword);
      setTempEmail(response.user.email);
      setTempUserName(`${response.user.firstName} ${response.user.lastName}`);
      setTempUserRole(response.user.role);
      setIsCreateDialogOpen(false);
      setShowWelcomeModal(true);
      form.reset();
    },
    onError: (error: any) => {
      const rawMessage = error?.message || "";
      // Normalize: lowercase and remove accents for comparison
      const errorMessage = rawMessage.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      let description = language === "es" ? "No se pudo crear el usuario" : "Could not create user";
      
      // Check for duplicate email first (more specific) - using normalized text without accents
      if (errorMessage.includes("already exists") || 
          errorMessage.includes("ya existe") || 
          errorMessage.includes("ya esta registrado") ||
          errorMessage.includes("correo electronico ya") ||
          errorMessage.includes("correo ya") ||
          errorMessage.includes("email ya") ||
          errorMessage.includes("duplicate") ||
          errorMessage.includes("registrado") ||
          error?.status === 409) {
        description = language === "es" 
          ? "Ya existe un usuario con este email. Usa otro email o busca al usuario en la lista."
          : "A user with this email already exists. Use a different email or find the user in the list.";
      } else if (errorMessage.includes("invalid email") || errorMessage.includes("formato") || errorMessage.includes("format")) {
        description = language === "es"
          ? "El formato del email no es valido"
          : "The email format is not valid";
      }
      
      toast({
        title: language === "es" ? "Error" : "Error",
        description,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserForm }) => {
      return await apiRequest("PATCH", `/api/external-agency-users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agency-users'] });
      setEditUserId(null);
      editForm.reset();
      toast({
        title: language === "es" ? "✅ Usuario actualizado" : "✅ User updated",
        description: language === "es"
          ? "Los datos del usuario han sido actualizados exitosamente"
          : "User data has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo actualizar el usuario"
          : "Could not update user",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("PATCH", `/api/external-agency-users/${userId}/reset-password`, {});
    },
    onSuccess: (response: any) => {
      setTempPassword(response.tempPassword);
      toast({
        title: language === "es" ? "Contraseña reseteada" : "Password reset",
        description: language === "es" 
          ? "Se ha generado una nueva contraseña temporal"
          : "A new temporary password has been generated",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo resetear la contraseña"
          : "Could not reset password",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/external-agency-users/${userId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agency-users'] });
      setDeleteUserId(null);
      toast({
        title: language === "es" ? "Usuario eliminado" : "User deleted",
        description: language === "es" 
          ? "El usuario ha sido eliminado exitosamente"
          : "User has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo eliminar el usuario"
          : "Could not delete user",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUserForm) => {
    createMutation.mutate(data);
  };

  const onUpdateSubmit = (data: UpdateUserForm) => {
    if (!editUserId) return;
    updateMutation.mutate({ id: editUserId, data });
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: language === "es" ? "Copiado" : "Copied",
        description: language === "es" ? "Texto copiado al portapapeles" : "Text copied to clipboard",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const generateWelcomeMessage = () => {
    if (!tempEmail || !tempPassword || !tempUserName || !tempUserRole) return "";
    
    const roleLabel = ROLE_LABELS[language][tempUserRole as keyof typeof ROLE_LABELS['es']] || tempUserRole;
    const loginUrl = `${window.location.origin}/external-login`;
    
    if (language === "es") {
      return `Hola ${tempUserName},

Bienvenido/a a HomesApp. Tu cuenta ha sido creada exitosamente.

Tu rol asignado: ${roleLabel}

Credenciales de acceso:
- Email: ${tempEmail}
- Contrasena temporal: ${tempPassword}

IMPORTANTE: Esta contrasena es de un solo uso. Deberas cambiarla en tu primer inicio de sesion.

Para acceder al sistema, ingresa al siguiente enlace:
${loginUrl}

Si tienes alguna pregunta, no dudes en contactarnos.

Saludos,
El equipo de HomesApp`;
    } else {
      return `Hello ${tempUserName},

Welcome to HomesApp! Your account has been created successfully.

Your assigned role: ${roleLabel}

Access credentials:
- Email: ${tempEmail}
- Temporary password: ${tempPassword}

IMPORTANT: This password is for single use only. You must change it on your first login.

To access the system, go to the following link:
${loginUrl}

If you have any questions, feel free to contact us.

Best regards,
The HomesApp Team`;
    }
  };

  const closeWelcomeModal = () => {
    setShowWelcomeModal(false);
    setTempPassword(null);
    setTempEmail(null);
    setTempUserName(null);
    setTempUserRole(null);
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    if (role === "external_agency_admin") return "default";
    if (role === "external_agency_accounting") return "secondary";
    if (role === "external_agency_maintenance") return "outline";
    return "outline";
  };

  // Filtered users based on search and filters
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      // Search filter (name and email)
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email?.toLowerCase() || '';
      const matchesSearch = searchTerm === "" || 
        fullName.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase());
      
      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Sorting logic - memoized to compute before pagination clamping
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortColumn) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'role':
          aValue = a.role || '';
          bValue = b.role || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortColumn, sortDirection]);

  // Table pagination
  const tableTotalPages = Math.max(1, Math.ceil(sortedUsers.length / tableItemsPerPage));
  const tableStartIndex = (tablePage - 1) * tableItemsPerPage;
  const tableEndIndex = tableStartIndex + tableItemsPerPage;
  const paginatedTableUsers = sortedUsers.slice(tableStartIndex, tableEndIndex);

  // Cards pagination
  const cardsTotalPages = Math.max(1, Math.ceil(sortedUsers.length / cardsItemsPerPage));
  const cardsStartIndex = (cardsPage - 1) * cardsItemsPerPage;
  const cardsEndIndex = cardsStartIndex + cardsItemsPerPage;
  const paginatedCardsUsers = sortedUsers.slice(cardsStartIndex, cardsEndIndex);

  // Pre-render page clamping for table using useLayoutEffect
  useLayoutEffect(() => {
    if (tablePage > tableTotalPages) {
      setTablePage(tableTotalPages);
    }
  }, [tablePage, tableTotalPages]);

  // Pre-render page clamping for cards using useLayoutEffect
  useLayoutEffect(() => {
    if (cardsPage > cardsTotalPages) {
      setCardsPage(cardsTotalPages);
    }
  }, [cardsPage, cardsTotalPages]);

  // Clamp table page when data changes
  useEffect(() => {
    if (tablePage > tableTotalPages && tableTotalPages > 0) {
      setTablePage(tableTotalPages);
    }
  }, [sortedUsers.length, tableItemsPerPage]);

  // Clamp cards page when data changes
  useEffect(() => {
    if (cardsPage > cardsTotalPages && cardsTotalPages > 0) {
      setCardsPage(cardsTotalPages);
    }
  }, [sortedUsers.length, cardsItemsPerPage]);

  // Reset pages when filters change
  useEffect(() => {
    setTablePage(1);
    setCardsPage(1);
  }, [searchTerm, roleFilter]);

  // Reset pages when items per page changes
  useEffect(() => {
    setTablePage(1);
  }, [tableItemsPerPage]);

  useEffect(() => {
    setCardsPage(1);
  }, [cardsItemsPerPage]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (roleFilter !== "all") count++;
    return count;
  }, [roleFilter]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setTablePage(1);
    setCardsPage(1);
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  const handleTablePageChange = (newPage: number) => {
    const clampedPage = Math.max(1, Math.min(newPage, tableTotalPages));
    setTablePage(clampedPage);
  };

  const handleCardsPageChange = (newPage: number) => {
    const clampedPage = Math.max(1, Math.min(newPage, cardsTotalPages));
    setCardsPage(clampedPage);
  };

  const editingUser = users?.find(u => u.id === editUserId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header (outside Card) */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {language === "es" ? "Cuentas de Usuario" : "User Accounts"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Administra los usuarios de tu agencia con diferentes roles"
              : "Manage your agency users with different roles"}
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user">
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Crear Usuario" : "Create User"}
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-user" className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg">
                    {language === "es" ? "Nuevo Usuario" : "New User"}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    {language === "es"
                      ? "Se generara una contrasena temporal automaticamente"
                      : "A temporary password will be generated automatically"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
                {/* Contact Info Section */}
                <div className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {language === "es" ? "Informacion de Contacto" : "Contact Information"}
                  </p>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">{language === "es" ? "Correo Electronico" : "Email Address"} *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email" 
                            placeholder="ejemplo@correo.com"
                            data-testid="input-email" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{language === "es" ? "Nombre" : "First Name"} *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Juan" data-testid="input-firstname" />
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
                          <FormLabel className="text-xs">{language === "es" ? "Apellido" : "Last Name"} *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Perez" data-testid="input-lastname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">{language === "es" ? "Telefono" : "Phone"} ({language === "es" ? "opcional" : "optional"})</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+52 998 123 4567" data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Role Section */}
                <div className="space-y-4 pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 pt-3">
                    <UserIcon className="h-4 w-4" />
                    {language === "es" ? "Rol y Permisos" : "Role & Permissions"}
                  </p>
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">{language === "es" ? "Rol del Usuario" : "User Role"} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-role">
                              <SelectValue placeholder={language === "es" ? "Selecciona un rol..." : "Select a role..."} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="external_agency_admin">
                              {ROLE_LABELS[language].external_agency_admin}
                            </SelectItem>
                            <SelectItem value="external_agency_accounting">
                              {ROLE_LABELS[language].external_agency_accounting}
                            </SelectItem>
                            <SelectItem value="external_agency_maintenance">
                              {ROLE_LABELS[language].external_agency_maintenance}
                            </SelectItem>
                            <SelectItem value="external_agency_staff">
                              {ROLE_LABELS[language].external_agency_staff}
                            </SelectItem>
                            <SelectItem value="external_agency_seller">
                              {ROLE_LABELS[language].external_agency_seller}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("role") === "external_agency_maintenance" && (
                    <FormField
                      control={form.control}
                      name="maintenanceSpecialty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{language === "es" ? "Especialidad" : "Specialty"}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-specialty">
                                <SelectValue placeholder={language === "es" ? "Selecciona especialidad..." : "Select specialty..."} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="encargado_mantenimiento">{SPECIALTY_LABELS[language].encargado_mantenimiento}</SelectItem>
                              <SelectItem value="mantenimiento_general">{SPECIALTY_LABELS[language].mantenimiento_general}</SelectItem>
                              <SelectItem value="electrico">{SPECIALTY_LABELS[language].electrico}</SelectItem>
                              <SelectItem value="plomero">{SPECIALTY_LABELS[language].plomero}</SelectItem>
                              <SelectItem value="refrigeracion">{SPECIALTY_LABELS[language].refrigeracion}</SelectItem>
                              <SelectItem value="carpintero">{SPECIALTY_LABELS[language].carpintero}</SelectItem>
                              <SelectItem value="pintor">{SPECIALTY_LABELS[language].pintor}</SelectItem>
                              <SelectItem value="jardinero">{SPECIALTY_LABELS[language].jardinero}</SelectItem>
                              <SelectItem value="albanil">{SPECIALTY_LABELS[language].albanil}</SelectItem>
                              <SelectItem value="limpieza">{SPECIALTY_LABELS[language].limpieza}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <DialogFooter className="pt-4 border-t gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={createMutation.isPending}
                  >
                    {language === "es" ? "Cancelar" : "Cancel"}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-user">
                    {createMutation.isPending 
                      ? (language === "es" ? "Creando..." : "Creating...")
                      : (language === "es" ? "Crear Usuario" : "Create User")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Welcome Modal with Credentials */}
      <Dialog open={showWelcomeModal} onOpenChange={(open) => !open && closeWelcomeModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-welcome">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {language === "es" ? "Usuario Creado Exitosamente" : "User Created Successfully"}
                </DialogTitle>
                <DialogDescription>
                  {tempUserName && (
                    <span className="font-medium text-foreground">{tempUserName}</span>
                  )}
                  {tempUserRole && (
                    <Badge variant="outline" className="ml-2">
                      {ROLE_LABELS[language][tempUserRole as keyof typeof ROLE_LABELS['es']] || tempUserRole}
                    </Badge>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Quick Copy Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {language === "es" ? "Email" : "Email"}
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono flex-1 truncate">{tempEmail}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 shrink-0"
                    onClick={() => tempEmail && copyToClipboard(tempEmail, 'email')}
                    data-testid="button-copy-email"
                  >
                    {copiedId === 'email' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <UserIcon className="h-3 w-3" />
                  {language === "es" ? "Contrasena temporal" : "Temporary password"}
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono flex-1 truncate">{tempPassword}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 shrink-0"
                    onClick={() => tempPassword && copyToClipboard(tempPassword, 'password')}
                    data-testid="button-copy-password"
                  >
                    {copiedId === 'password' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Full Welcome Message */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
                <p className="text-sm font-medium">
                  {language === "es" ? "Mensaje de Bienvenida" : "Welcome Message"}
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => copyToClipboard(generateWelcomeMessage(), 'welcome-msg')}
                  data-testid="button-copy-welcome"
                  className="gap-1.5"
                >
                  {copiedId === 'welcome-msg' ? (
                    <>
                      <Check className="h-4 w-4" />
                      {language === "es" ? "Copiado" : "Copied"}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {language === "es" ? "Copiar Todo" : "Copy All"}
                    </>
                  )}
                </Button>
              </div>
              <pre className="p-4 text-sm whitespace-pre-wrap font-sans bg-background max-h-[250px] overflow-y-auto">
                {generateWelcomeMessage()}
              </pre>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {language === "es" 
                ? "Copia el mensaje completo y envíalo al nuevo usuario por WhatsApp o email."
                : "Copy the complete message and send it to the new user via WhatsApp or email."}
            </p>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeWelcomeModal} data-testid="button-close-welcome">
              {language === "es" ? "Cerrar" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search, Filters, and View Toggle Card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "es" ? "Buscar por nombre o email..." : "Search by name or email..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>

            {/* Filter Popover */}
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative" data-testid="button-filter">
                  <Filter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center p-0 text-xs"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{language === "es" ? "Filtrar por Rol" : "Filter by Role"}</h4>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger data-testid="select-role-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                        <SelectItem value="external_agency_admin">{ROLE_LABELS[language].external_agency_admin}</SelectItem>
                        <SelectItem value="external_agency_accounting">{ROLE_LABELS[language].external_agency_accounting}</SelectItem>
                        <SelectItem value="external_agency_maintenance">{ROLE_LABELS[language].external_agency_maintenance}</SelectItem>
                        <SelectItem value="external_agency_staff">{ROLE_LABELS[language].external_agency_staff}</SelectItem>
                        <SelectItem value="external_agency_seller">{ROLE_LABELS[language].external_agency_seller}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRoleFilter("all");
                        setIsFilterOpen(false);
                      }}
                      className="w-full"
                      data-testid="button-clear-filters"
                    >
                      {language === "es" ? "Limpiar Filtros" : "Clear Filters"}
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* View Toggle Buttons */}
            <div className="hidden md:flex gap-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="icon"
                onClick={() => {
                  setViewMode('table');
                  setManualViewModeOverride(true);
                }}
                data-testid="button-view-table"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="icon"
                onClick={() => {
                  setViewMode('cards');
                  setManualViewModeOverride(false);
                }}
                data-testid="button-view-cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading/Empty/Content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : !users || users.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12" data-testid="div-no-users">
            <p className="text-muted-foreground">
              {language === "es" 
                ? "No hay usuarios creados aún"
                : "No users created yet"}
            </p>
            <Button
              className="mt-4"
              onClick={() => setIsCreateDialogOpen(true)}
              data-testid="button-create-first-user"
            >
              <Plus className="mr-2 h-4 w-4" />
              {language === "es" ? "Crear Primer Usuario" : "Create First User"}
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <>
          <ExternalPaginationControls
            currentPage={tablePage}
            totalPages={tableTotalPages}
            itemsPerPage={tableItemsPerPage}
            onPageChange={setTablePage}
            onItemsPerPageChange={(items) => {
              setTableItemsPerPage(items);
              setTablePage(1);
            }}
            language={language}
            testIdPrefix="table"
          />

          <Card className="border">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="min-w-[200px] cursor-pointer hover-elevate font-normal"
                      onClick={() => handleSort('name')}
                      data-testid="header-name"
                    >
                      <div className="flex items-center gap-2">
                        {language === "es" ? "Nombre" : "Name"}
                        {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[200px] cursor-pointer hover-elevate font-normal"
                      onClick={() => handleSort('email')}
                      data-testid="header-email"
                    >
                      <div className="flex items-center gap-2">
                        Email
                        {getSortIcon('email')}
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[150px]">
                      {language === "es" ? "Teléfono" : "Phone"}
                    </TableHead>
                    <TableHead 
                      className="min-w-[150px] cursor-pointer hover-elevate font-normal"
                      onClick={() => handleSort('role')}
                      data-testid="header-role"
                    >
                      <div className="flex items-center gap-2">
                        {language === "es" ? "Rol" : "Role"}
                        {getSortIcon('role')}
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[150px]">
                      {language === "es" ? "Especialidad" : "Specialty"}
                    </TableHead>
                    <TableHead 
                      className="min-w-[100px] cursor-pointer hover-elevate font-normal"
                      onClick={() => handleSort('status')}
                      data-testid="header-status"
                    >
                      <div className="flex items-center gap-2">
                        {language === "es" ? "Estado" : "Status"}
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right min-w-[200px]">
                      {language === "es" ? "Acciones" : "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTableUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell>
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {ROLE_LABELS[language][user.role as keyof typeof ROLE_LABELS.es] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.maintenanceSpecialty ? (
                          <Badge variant="outline" className="text-xs">
                            {SPECIALTY_LABELS[language][user.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS.es]}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'approved' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            data-testid={`button-edit-${user.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => resetPasswordMutation.mutate(user.id)}
                            disabled={resetPasswordMutation.isPending}
                            data-testid={`button-reset-password-${user.id}`}
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDeleteUserId(user.id)}
                            data-testid={`button-delete-${user.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Pagination Controls for Cards */}
          <ExternalPaginationControls
            currentPage={cardsPage}
            totalPages={cardsTotalPages}
            itemsPerPage={cardsItemsPerPage}
            onPageChange={setCardsPage}
            onItemsPerPageChange={(items) => {
              setCardsItemsPerPage(items);
              setCardsPage(1);
            }}
            language={language}
            testIdPrefix="cards"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedCardsUsers.map((user) => (
            <Card key={user.id} data-testid={`card-user-${user.id}`} className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1 text-xs truncate">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {user.email}
                    </CardDescription>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)} className="ml-2 flex-shrink-0">
                    {ROLE_LABELS[language][user.role as keyof typeof ROLE_LABELS.es]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{user.phone}</span>
                  </div>
                )}
                
                {user.maintenanceSpecialty && (
                  <div className="flex items-center gap-2 text-sm">
                    <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Badge variant="outline" className="text-xs">
                      {SPECIALTY_LABELS[language][user.maintenanceSpecialty as keyof typeof SPECIALTY_LABELS.es]}
                    </Badge>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-2 border-t">
                  <Badge variant={user.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                    {user.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(user)}
                      data-testid={`button-edit-card-${user.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => resetPasswordMutation.mutate(user.id)}
                      disabled={resetPasswordMutation.isPending}
                      data-testid={`button-reset-card-${user.id}`}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteUserId(user.id)}
                      data-testid={`button-delete-card-${user.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </>
      )}

      {/* Edit User Dialog */}
      <Dialog open={!!editUserId} onOpenChange={(open) => !open && setEditUserId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Editar Usuario" : "Edit User"}
            </DialogTitle>
            <DialogDescription>
              {language === "es"
                ? `Edita los datos de ${editingUser?.firstName} ${editingUser?.lastName}`
                : `Edit ${editingUser?.firstName} ${editingUser?.lastName}'s information`}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nombre" : "First Name"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-firstname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Apellido" : "Last Name"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-lastname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Teléfono" : "Phone"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Rol" : "Role"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-role">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="external_agency_admin">
                          {ROLE_LABELS[language].external_agency_admin}
                        </SelectItem>
                        <SelectItem value="external_agency_accounting">
                          {ROLE_LABELS[language].external_agency_accounting}
                        </SelectItem>
                        <SelectItem value="external_agency_maintenance">
                          {ROLE_LABELS[language].external_agency_maintenance}
                        </SelectItem>
                        <SelectItem value="external_agency_staff">
                          {ROLE_LABELS[language].external_agency_staff}
                        </SelectItem>
                        <SelectItem value="external_agency_seller">
                          {ROLE_LABELS[language].external_agency_seller}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editForm.watch("role") === "external_agency_maintenance" && (
                <FormField
                  control={editForm.control}
                  name="maintenanceSpecialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Especialidad" : "Specialty"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-specialty">
                            <SelectValue placeholder={language === "es" ? "Selecciona..." : "Select..."} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="encargado_mantenimiento">{SPECIALTY_LABELS[language].encargado_mantenimiento}</SelectItem>
                          <SelectItem value="mantenimiento_general">{SPECIALTY_LABELS[language].mantenimiento_general}</SelectItem>
                          <SelectItem value="electrico">{SPECIALTY_LABELS[language].electrico}</SelectItem>
                          <SelectItem value="plomero">{SPECIALTY_LABELS[language].plomero}</SelectItem>
                          <SelectItem value="refrigeracion">{SPECIALTY_LABELS[language].refrigeracion}</SelectItem>
                          <SelectItem value="carpintero">{SPECIALTY_LABELS[language].carpintero}</SelectItem>
                          <SelectItem value="pintor">{SPECIALTY_LABELS[language].pintor}</SelectItem>
                          <SelectItem value="jardinero">{SPECIALTY_LABELS[language].jardinero}</SelectItem>
                          <SelectItem value="albanil">{SPECIALTY_LABELS[language].albanil}</SelectItem>
                          <SelectItem value="limpieza">{SPECIALTY_LABELS[language].limpieza}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditUserId(null)}
                  data-testid="button-cancel-edit"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                  {updateMutation.isPending 
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (language === "es" ? "Guardar Cambios" : "Save Changes")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "es" ? "¿Estás seguro?" : "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es"
                ? "Esta acción no se puede deshacer. El usuario será eliminado permanentemente."
                : "This action cannot be undone. The user will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {language === "es" ? "Cancelar" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {language === "es" ? "Eliminar" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
