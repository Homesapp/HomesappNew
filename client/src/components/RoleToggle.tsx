import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, User, Plus, FileText, Briefcase, Scale, Calculator, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { User as UserType } from "@shared/schema";

const ROLE_ICONS: Record<string, any> = {
  owner: Building2,
  cliente: User,
  abogado: Scale,
  contador: Calculator,
  seller: Briefcase,
  management: Star,
  provider: FileText,
  hoa_manager: Building2,
};

const ROLE_NAMES: Record<string, string> = {
  owner: "Propietario",
  cliente: "Cliente", 
  abogado: "Abogado",
  contador: "Contador",
  seller: "Vendedor",
  management: "Gestión",
  provider: "Proveedor",
  concierge: "Conserje",
  agente_servicios_especiales: "Agente de Servicios Especiales",
  hoa_manager: "HOA Manager",
};

const ROLE_DESCRIPTIONS: Record<string, { question: string; placeholder: string }> = {
  abogado: {
    question: "¿Cuál es tu experiencia como abogado especializado en bienes raíces?",
    placeholder: "Describe tu experiencia en derecho inmobiliario, transacciones, contratos, etc..."
  },
  contador: {
    question: "¿Cuál es tu experiencia en contabilidad inmobiliaria o gestión financiera?",
    placeholder: "Describe tu experiencia en contabilidad, finanzas, impuestos, etc..."
  },
  seller: {
    question: "¿Cuál es tu experiencia como vendedor de propiedades?",
    placeholder: "Describe tu experiencia en ventas, negociación, cierre de tratos, etc..."
  },
  management: {
    question: "¿Cuál es tu experiencia en gestión de propiedades?",
    placeholder: "Describe tu experiencia en administración de propiedades, mantenimiento, etc..."
  },
  provider: {
    question: "¿Qué tipo de servicios ofreces y cuál es tu experiencia?",
    placeholder: "Describe los servicios que ofreces (limpieza, mantenimiento, etc.) y tu experiencia..."
  },
  concierge: {
    question: "¿Cuál es tu experiencia en servicios de conserjería o atención al cliente?",
    placeholder: "Describe tu experiencia en servicio al cliente, coordinación, etc..."
  },
  hoa_manager: {
    question: "¿Cuál es tu experiencia en administración de condominios y comunidades?",
    placeholder: "Describe tu experiencia en gestión de condominios, relaciones con residentes, mantenimiento, etc..."
  },
};

const roleApplicationSchema = z.object({
  requestedRole: z.string().min(1, "Debes seleccionar un rol"),
  email: z.string().email("Correo electrónico inválido"),
  whatsapp: z.string().min(10, "WhatsApp debe tener al menos 10 dígitos"),
  reason: z.string().min(20, "Explica brevemente por qué necesitas este rol (mínimo 20 caracteres)"),
  experience: z.string().min(50, "Describe tu experiencia en detalle (mínimo 50 caracteres)"),
  yearsOfExperience: z.coerce.number().min(0, "Años de experiencia debe ser un número positivo"),
  additionalInfo: z.string().optional(),
});

type RoleApplicationFormData = z.infer<typeof roleApplicationSchema>;

export function RoleToggle() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { state } = useSidebar();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);

  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/auth/user"],
  });

  const form = useForm<RoleApplicationFormData>({
    resolver: zodResolver(roleApplicationSchema),
    defaultValues: {
      requestedRole: "",
      email: "",
      whatsapp: "",
      reason: "",
      experience: "",
      yearsOfExperience: 0,
      additionalInfo: "",
    },
  });

  const switchRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      return apiRequest("PATCH", "/api/users/switch-role", { role: newRole });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: t("role.updated"),
        description: t("role.updatedDesc"),
      });
      setIsOpen(false);
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("role.updateError"),
        variant: "destructive",
      });
    },
  });

  const applyRoleMutation = useMutation({
    mutationFn: async (data: RoleApplicationFormData) => {
      return apiRequest("POST", "/api/role-requests", {
        userId: user?.id,
        requestedRole: data.requestedRole,
        email: data.email,
        whatsapp: data.whatsapp,
        reason: data.reason,
        yearsOfExperience: data.yearsOfExperience,
        experience: data.experience,
        additionalInfo: data.additionalInfo,
      });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de rol ha sido enviada. Un administrador la revisará pronto.",
      });
      setShowApplicationDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || "Error al enviar solicitud",
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  // Show for users who have owner/cliente roles or an additional approved role
  const hasOwnerClienteRole = user.role === "owner" || user.role === "cliente";
  const hasAdditionalRole = !!user.additionalRole;
  
  if (!hasOwnerClienteRole && !hasAdditionalRole) return null;

  const isOwner = user.role === "owner";
  const isClient = user.role === "cliente";
  const isCollapsed = state === "collapsed";
  
  const CurrentIcon = ROLE_ICONS[user.role] || User;
  const currentRoleName = ROLE_NAMES[user.role] || user.role;

  // Available roles to apply for
  const availableRoles = ["abogado", "contador", "seller", "management", "provider", "concierge", "hoa_manager"];

  const selectedRole = form.watch("requestedRole");
  const roleInfo = selectedRole ? ROLE_DESCRIPTIONS[selectedRole] : null;

  const onSubmit = (data: RoleApplicationFormData) => {
    applyRoleMutation.mutate(data);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size={isCollapsed ? "icon" : "default"}
            className={isCollapsed ? "" : "gap-2 w-full justify-start"} 
            data-testid="button-role-toggle"
          >
            <CurrentIcon className="h-4 w-4" />
            {!isCollapsed && <span>{currentRoleName}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Cambiar Rol</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => switchRoleMutation.mutate("owner")}
            disabled={isOwner || switchRoleMutation.isPending}
            data-testid="option-switch-to-owner"
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">Propietario</span>
              <span className="text-xs text-muted-foreground">
                Gestiona tus propiedades
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => switchRoleMutation.mutate("cliente")}
            disabled={isClient || switchRoleMutation.isPending}
            data-testid="option-switch-to-client"
            className="gap-2"
          >
            <User className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">Cliente</span>
              <span className="text-xs text-muted-foreground">
                Busca propiedades
              </span>
            </div>
          </DropdownMenuItem>

          {hasAdditionalRole && user.additionalRole && (
            <DropdownMenuItem
              onClick={() => switchRoleMutation.mutate(user.additionalRole as any)}
              disabled={user.role === user.additionalRole || switchRoleMutation.isPending}
              data-testid={`option-switch-to-${user.additionalRole}`}
              className="gap-2"
            >
              {ROLE_ICONS[user.additionalRole] && 
                (() => {
                  const Icon = ROLE_ICONS[user.additionalRole];
                  return <Icon className="h-4 w-4" />;
                })()
              }
              <div className="flex flex-col">
                <span className="font-medium">{ROLE_NAMES[user.additionalRole]}</span>
                <span className="text-xs text-muted-foreground">
                  Rol adicional aprobado
                </span>
              </div>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => {
              setShowApplicationDialog(true);
              setIsOpen(false);
            }}
            data-testid="button-apply-role"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Solicitar otro rol</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" data-testid="dialog-role-application">
          <DialogHeader>
            <DialogTitle>Solicitar Rol Adicional</DialogTitle>
            <DialogDescription>
              Completa el formulario para solicitar acceso a un rol adicional. Un administrador revisará tu solicitud.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="requestedRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol a solicitar</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_NAMES[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tucorreo@ejemplo.com"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormDescription>
                      Correo donde podamos contactarte
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp *</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+52 998 123 4567"
                        {...field}
                        data-testid="input-whatsapp"
                      />
                    </FormControl>
                    <FormDescription>
                      Número de WhatsApp con código de país (ej: +52 para México)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Por qué necesitas este rol?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explica brevemente por qué necesitas este rol..."
                        {...field}
                        data-testid="input-reason"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {roleInfo && (
                <>
                  <FormField
                    control={form.control}
                    name="yearsOfExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Años de experiencia</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ej: 5"
                            {...field}
                            data-testid="input-years-experience"
                          />
                        </FormControl>
                        <FormDescription>
                          ¿Cuántos años de experiencia tienes en este rol?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{roleInfo.question}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={roleInfo.placeholder}
                            className="min-h-[120px]"
                            {...field}
                            data-testid="input-experience"
                          />
                        </FormControl>
                        <FormDescription>
                          Describe en detalle tu experiencia relevante para este rol
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Información adicional (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Certificaciones, referencias, logros destacados..."
                            {...field}
                            data-testid="input-additional-info"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowApplicationDialog(false);
                    form.reset();
                  }}
                  data-testid="button-cancel-application"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedRole || applyRoleMutation.isPending}
                  data-testid="button-submit-application"
                >
                  {applyRoleMutation.isPending ? "Enviando..." : "Enviar Solicitud"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
