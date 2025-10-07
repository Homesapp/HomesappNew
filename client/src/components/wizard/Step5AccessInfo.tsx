import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Lock, User, Key, Home, Shield } from "lucide-react";
import { Label } from "@/components/ui/label";

const accessInfoSchema = z.discriminatedUnion("accessType", [
  // Unattended access - with lockbox or smart lock
  z.object({
    accessType: z.literal("unattended"),
    method: z.enum(["lockbox", "smart_lock"]),
    lockboxCode: z.string().optional(),
    lockboxLocation: z.string().optional(),
    smartLockInstructions: z.string().optional(),
    smartLockProvider: z.string().optional(),
  }).refine(
    (data) => {
      // If lockbox, require lockboxCode
      if (data.method === "lockbox" && !data.lockboxCode) {
        return false;
      }
      return true;
    },
    {
      message: "Código de lockbox requerido",
      path: ["lockboxCode"],
    }
  ),
  // Attended access
  z.object({
    accessType: z.literal("attended"),
    contactPerson: z.string().min(1, "Nombre de contacto requerido"),
    contactPhone: z.string().min(1, "Teléfono de contacto requerido"),
    contactNotes: z.string().optional(),
  }),
]).optional();

type AccessInfoForm = z.infer<typeof accessInfoSchema>;

type Step5Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  onPrevious: () => void;
};

export default function Step5AccessInfo({ data, onUpdate, onNext, onPrevious }: Step5Props) {
  const form = useForm<AccessInfoForm>({
    resolver: zodResolver(accessInfoSchema.optional()),
    defaultValues: data.accessInfo || {
      accessType: "unattended" as const,
      method: "lockbox" as const,
      lockboxCode: "",
      lockboxLocation: "",
    },
  });

  const accessType = form.watch("accessType");
  const method = form.watch("method");

  const onSubmit = (formData: AccessInfoForm) => {
    onNext({ accessInfo: formData });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step5-title">
          Información de Acceso a la Propiedad
        </h2>
        <p className="text-muted-foreground" data-testid="text-step5-description">
          Configura cómo el personal autorizado podrá acceder a tu propiedad para citas y mantenimiento
        </p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacidad y Seguridad
          </CardTitle>
          <CardDescription>
            Esta información es privada y solo será compartida con personal autorizado (administradores, conserjes o mantenimiento) cuando tengan citas confirmadas en tu propiedad.
          </CardDescription>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Tipo de Acceso */}
          <FormField
            control={form.control}
            name="accessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Acceso *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="unattended"
                        id="unattended"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="unattended"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover-elevate peer-data-[state=checked]:border-primary cursor-pointer"
                        data-testid="radio-unattended"
                      >
                        <Key className="mb-3 h-6 w-6" />
                        <div className="text-center">
                          <div className="font-semibold">Desatendido</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Acceso con lockbox o cerradura inteligente
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="attended"
                        id="attended"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="attended"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover-elevate peer-data-[state=checked]:border-primary cursor-pointer"
                        data-testid="radio-attended"
                      >
                        <User className="mb-3 h-6 w-6" />
                        <div className="text-center">
                          <div className="font-semibold">Asistido</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Alguien abrirá la propiedad
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unattended Access Fields */}
          {accessType === "unattended" && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Acceso *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-access-method">
                          <SelectValue placeholder="Selecciona el método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lockbox">Lockbox con clave única</SelectItem>
                        <SelectItem value="smart_lock">Cerradura inteligente con clave variable</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {method === "lockbox" && (
                <>
                  <FormField
                    control={form.control}
                    name="lockboxCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código del Lockbox *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: 1234"
                            {...field}
                            data-testid="input-lockbox-code"
                          />
                        </FormControl>
                        <FormDescription>
                          El código que el personal usará para abrir el lockbox
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lockboxLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación del Lockbox (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: En la puerta principal, lado derecho"
                            {...field}
                            data-testid="input-lockbox-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {method === "smart_lock" && (
                <>
                  <FormField
                    control={form.control}
                    name="smartLockProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proveedor de Cerradura (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: August, Yale, Schlage"
                            {...field}
                            data-testid="input-smart-lock-provider"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smartLockInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instrucciones para Generar Clave (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe cómo generar una clave temporal única para cada visita..."
                            {...field}
                            data-testid="textarea-smart-lock-instructions"
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormDescription>
                          Como propietario, deberás proporcionar una clave única antes de cada cita confirmada
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          )}

          {/* Attended Access Fields */}
          {accessType === "attended" && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Contacto *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre de la persona que abrirá"
                        {...field}
                        data-testid="input-contact-person"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono de Contacto *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+52 998 123 4567"
                        {...field}
                        data-testid="input-contact-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Adicionales (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Cualquier información adicional sobre el acceso..."
                        {...field}
                        data-testid="textarea-contact-notes"
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              data-testid="button-previous"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button
              type="submit"
              data-testid="button-next"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
