import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Save, CheckCircle, Plus, X, Loader2, AlertCircle } from "lucide-react";

const ownerFormSchema = z.object({
  // Datos Generales del Arrendador
  fullName: z.string().min(1, "Nombre completo es requerido"),
  nationality: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  subleaseAllowed: z.boolean().default(false),
  propertyAddress: z.string().optional(),
  subdivision: z.string().optional(),
  unitNumber: z.string().optional(),
  agreedRent: z.string().optional(),
  agreedDeposit: z.string().optional(),
  checkInDate: z.string().optional(),
  contractDuration: z.string().optional(),
  includedServices: z.array(z.string()).optional(),
  excludedServices: z.array(z.string()).optional(),
  petsAccepted: z.boolean().default(false),
  specialNotes: z.string().optional(),
  
  // Datos Bancarios
  bankName: z.string().optional(),
  clabe: z.string().optional(),
  accountNumber: z.string().optional(),
  accountHolderName: z.string().optional(),
  swiftCode: z.string().optional(),
  bankAddress: z.string().optional(),
  
  // Documentos
  propertyDeedUrl: z.string().optional(),
  proofOfOwnershipUrl: z.string().optional(),
  propertyTaxReceiptUrl: z.string().optional(),
  ownerIdUrl: z.string().optional(),
  
  // Términos
  acceptedTerms: z.boolean().default(false),
});

type OwnerFormData = z.infer<typeof ownerFormSchema>;

export default function ContractOwnerForm() {
  const { contractId } = useParams<{ contractId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newIncludedService, setNewIncludedService] = useState("");
  const [newExcludedService, setNewExcludedService] = useState("");

  // Fetch contract and existing info
  const { data: contractData, isLoading: isLoadingContract, error: contractError } = useQuery({
    queryKey: ["/api/contracts", contractId],
    enabled: !!contractId,
    retry: false,
  });

  const { data: ownerInfo, isLoading: isLoadingInfo } = useQuery({
    queryKey: ["/api/contracts", contractId, "owner-info"],
    enabled: !!contractId && !!contractData,
  });

  const isLoading = isLoadingContract || isLoadingInfo;

  const form = useForm<OwnerFormData>({
    resolver: zodResolver(ownerFormSchema),
    defaultValues: {
      subleaseAllowed: false,
      petsAccepted: false,
      acceptedTerms: false,
      includedServices: [],
      excludedServices: [],
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (ownerInfo) {
      form.reset({
        ...ownerInfo,
        includedServices: ownerInfo.includedServices || [],
        excludedServices: ownerInfo.excludedServices || [],
        subleaseAllowed: ownerInfo.subleaseAllowed || false,
        petsAccepted: ownerInfo.petsAccepted || false,
        acceptedTerms: ownerInfo.acceptedTerms || false,
      });
    }
  }, [ownerInfo, form]);

  const saveMutation = useMutation({
    mutationFn: (data: OwnerFormData) => 
      apiRequest(`/api/contracts/${contractId}/owner-info`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey.some(key => 
            typeof key === 'string' && key.includes('/api/contracts')
          )
      });
      toast({
        title: "Guardado",
        description: "Tu información ha sido guardada correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la información",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OwnerFormData) => {
    saveMutation.mutate(data);
  };

  const addIncludedService = () => {
    if (newIncludedService.trim()) {
      const current = form.getValues("includedServices") || [];
      form.setValue("includedServices", [...current, newIncludedService.trim()]);
      setNewIncludedService("");
    }
  };

  const removeIncludedService = (index: number) => {
    const current = form.getValues("includedServices") || [];
    form.setValue("includedServices", current.filter((_, i) => i !== index));
  };

  const addExcludedService = () => {
    if (newExcludedService.trim()) {
      const current = form.getValues("excludedServices") || [];
      form.setValue("excludedServices", [...current, newExcludedService.trim()]);
      setNewExcludedService("");
    }
  };

  const removeExcludedService = (index: number) => {
    const current = form.getValues("excludedServices") || [];
    form.setValue("excludedServices", current.filter((_, i) => i !== index));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" data-testid="container-loading-owner-form">
        <Card className="max-w-md w-full" data-testid="card-loading-owner-form">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="spinner-loading-owner-form" />
              <p className="text-muted-foreground" data-testid="text-loading-message">Cargando formulario...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - contract not found
  if (contractError || !contractData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" data-testid="container-error-owner-form">
        <Card className="max-w-md w-full" data-testid="card-error-owner-form">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" data-testid="icon-error" />
              <h2 className="text-xl font-semibold text-center" data-testid="text-error-title">Contrato no encontrado</h2>
              <p className="text-muted-foreground text-center" data-testid="text-error-description">
                {(contractError as any)?.message || 
                  "Este enlace no es válido o el contrato ya no está disponible. Por favor contacta a tu agente."}
              </p>
              <Button onClick={() => navigate("/")} data-testid="button-go-home">
                Ir al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/owner/offers")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formato de Propietario</CardTitle>
          <CardDescription>
            Completa la información requerida para el contrato de arrendamiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Datos Generales del Arrendador</h2>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-full-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nacionalidad</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-nationality" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-phone" />
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
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-whatsapp" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-2xl font-bold mb-4">Detalles de la Propiedad</h2>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="propertyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección de la Propiedad</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-property-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="subdivision"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fraccionamiento/Condominio</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-subdivision" />
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
                          <FormLabel>Número de Unidad</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-unit-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="agreedRent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renta Acordada</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0.00" data-testid="input-agreed-rent" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="agreedDeposit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Depósito Acordado</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0.00" data-testid="input-agreed-deposit" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contractDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duración del Contrato</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ej: 12 meses" data-testid="input-contract-duration" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="checkInDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Check-in</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-check-in-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="subleaseAllowed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-sublease-allowed"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>¿Se permite subarrendar?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="petsAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-pets-accepted"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>¿Se aceptan mascotas?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-2xl font-bold mb-4">Servicios</h2>
                
                <div className="space-y-4">
                  <div>
                    <FormLabel>Servicios Incluidos</FormLabel>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newIncludedService}
                        onChange={(e) => setNewIncludedService(e.target.value)}
                        placeholder="ej: Agua, Luz, Gas"
                        data-testid="input-new-included-service"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addIncludedService();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={addIncludedService}
                        size="icon"
                        data-testid="button-add-included-service"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(form.watch("includedServices") || []).map((service, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {service}
                          <button
                            type="button"
                            onClick={() => removeIncludedService(index)}
                            className="ml-1 hover:text-destructive"
                            data-testid={`button-remove-included-service-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <FormLabel>Servicios Excluidos</FormLabel>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newExcludedService}
                        onChange={(e) => setNewExcludedService(e.target.value)}
                        placeholder="ej: Internet, Cable"
                        data-testid="input-new-excluded-service"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addExcludedService();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={addExcludedService}
                        size="icon"
                        data-testid="button-add-excluded-service"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(form.watch("excludedServices") || []).map((service, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {service}
                          <button
                            type="button"
                            onClick={() => removeExcludedService(index)}
                            className="ml-1 hover:text-destructive"
                            data-testid={`button-remove-excluded-service-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="specialNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas Especiales</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="textarea-special-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-2xl font-bold mb-4">Datos Bancarios</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Para recibir el apartado y pagos de renta
                </p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Banco</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-bank-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="accountHolderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titular de la Cuenta</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-account-holder-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="clabe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CLABE Interbancaria</FormLabel>
                          <FormControl>
                            <Input {...field} maxLength={18} data-testid="input-clabe" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Cuenta</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-account-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="swiftCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código SWIFT (internacional)</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-swift-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bankAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección del Banco</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-bank-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-2xl font-bold mb-4">Términos y Condiciones</h2>
                
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm">
                      Al aceptar estos términos, confirmo que toda la información proporcionada es verídica
                      y completa. Entiendo que soy responsable de cumplir con las obligaciones del contrato
                      de arrendamiento.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="acceptedTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-accept-terms"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Acepto los términos y condiciones del contrato de arrendamiento
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-between gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/owner/offers")}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.handleSubmit(onSubmit)()}
                    disabled={saveMutation.isPending}
                    data-testid="button-save"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>

                  <Button
                    type="submit"
                    disabled={saveMutation.isPending || !form.watch("acceptedTerms")}
                    data-testid="button-submit"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enviar Formulario
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
