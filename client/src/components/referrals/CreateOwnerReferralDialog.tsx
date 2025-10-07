import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { insertOwnerReferralSchema } from "@shared/schema";

const formSchema = insertOwnerReferralSchema.extend({
  propertyAddress: z.string().min(1, "La dirección de la propiedad es requerida"),
  propertyDescription: z.string().optional(),
  estimatedValue: z.string().optional(),
}).omit({
  id: true,
  referrerId: true,
  assignedTo: true,
  emailVerified: true,
  verificationToken: true,
  verificationTokenExpiry: true,
  status: true,
  commissionPercent: true,
  commissionAmount: true,
  commissionPaid: true,
  commissionPaidAt: true,
  adminApprovedById: true,
  adminApprovedAt: true,
  rejectedById: true,
  rejectedAt: true,
  rejectionReason: true,
  notes: true,
  adminNotes: true,
  linkedOwnerId: true,
  linkedPropertyId: true,
  createdAt: true,
  updatedAt: true,
});

type FormData = z.infer<typeof formSchema>;

interface CreateOwnerReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOwnerReferralDialog({
  open,
  onOpenChange,
}: CreateOwnerReferralDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      nationality: "",
      whatsappNumber: "",
      propertyType: "",
      condominiumName: "",
      unitNumber: "",
      propertyAddress: "",
      propertyDescription: "",
      estimatedValue: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/referrals/owners", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/owners"] });
      toast({
        title: t("referrals.ownerReferralCreated", "Referido de propietario creado"),
        description: t("referrals.ownerReferralCreatedDesc", "Se ha enviado un email de verificación al propietario"),
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: t("common.error", "Error"),
        description: error.message || t("referrals.createError", "No se pudo crear el referido"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("referrals.addOwnerReferral", "Agregar Referido de Propietario")}
          </DialogTitle>
          <DialogDescription>
            {t("referrals.addOwnerReferralDesc", "Recomienda una persona con propiedades para rentar")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.firstName", "Nombre")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("common.firstName", "Nombre")}
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
                    <FormLabel>{t("common.lastName", "Apellido")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("common.lastName", "Apellido")}
                        data-testid="input-last-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.email", "Correo electrónico")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder={t("common.email", "Correo electrónico")}
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.phone", "Teléfono")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder={t("common.phone", "Teléfono")}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("referrals.whatsapp", "WhatsApp")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        type="tel"
                        placeholder={t("referrals.whatsapp", "WhatsApp")}
                        data-testid="input-whatsapp"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("referrals.nationality", "Nacionalidad")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder={t("referrals.nationality", "Nacionalidad")}
                      data-testid="input-nationality"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("referrals.propertyType", "Tipo de Propiedad")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-property-type">
                        <SelectValue placeholder={t("referrals.selectPropertyType", "Selecciona tipo")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">{t("propertyTypes.private", "Casa/Propiedad Privada")}</SelectItem>
                      <SelectItem value="condominium">{t("propertyTypes.condominium", "Condominio")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="condominiumName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("referrals.condoName", "Nombre del Condominio")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder={t("referrals.condoName", "Nombre del Condominio")}
                        data-testid="input-condo-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("referrals.unitNumber", "Número de Unidad")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder={t("referrals.unitNumber", "Ej: 101, A-5")}
                        data-testid="input-unit-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="propertyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("referrals.propertyAddress", "Dirección de la Propiedad")} *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("referrals.propertyAddress", "Calle, Número, Colonia, Ciudad")}
                      data-testid="input-property-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="propertyDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("referrals.propertyDescription", "Descripción de la Propiedad")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder={t("referrals.propertyDescription", "Características, habitaciones, etc.")}
                      data-testid="input-property-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("referrals.estimatedValue", "Valor Estimado (Renta Mensual)")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      type="number"
                      placeholder={t("referrals.estimatedValue", "Ej: 15000")}
                      data-testid="input-estimated-value"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending
                  ? t("common.creating", "Creando...")
                  : t("common.create", "Crear")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
