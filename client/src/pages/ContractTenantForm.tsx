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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Save, CheckCircle, Loader2, AlertCircle } from "lucide-react";

const tenantFormSchema = z.object({
  // Datos Generales del Arrendatario
  fullName: z.string().min(1, "Nombre completo es requerido"),
  address: z.string().optional(),
  nationality: z.string().optional(),
  age: z.coerce.number().optional(),
  timeInTulum: z.string().optional(),
  occupation: z.string().optional(),
  company: z.string().optional(),
  workplaceAddress: z.string().optional(),
  monthlyIncome: z.string().optional(),
  companyTenure: z.string().optional(),
  maritalStatus: z.string().optional(),
  whatsappNumber: z.string().optional(),
  cellNumber: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  checkInDate: z.string().optional(),
  numberOfTenants: z.coerce.number().optional(),
  paymentMethod: z.string().optional(),
  hasPets: z.boolean().default(false),
  petDescription: z.string().optional(),
  propertyToRent: z.string().optional(),
  condominiumAndUnit: z.string().optional(),
  
  // Datos del Garante
  guarantorName: z.string().optional(),
  guarantorAddress: z.string().optional(),
  guarantorBirthInfo: z.string().optional(),
  guarantorNationality: z.string().optional(),
  guarantorAge: z.coerce.number().optional(),
  guarantorTimeInTulum: z.string().optional(),
  guarantorOccupation: z.string().optional(),
  guarantorCompany: z.string().optional(),
  guarantorWorkAddress: z.string().optional(),
  guarantorWorkPhone: z.string().optional(),
  guarantorMaritalStatus: z.string().optional(),
  guarantorLandline: z.string().optional(),
  guarantorCell: z.string().optional(),
  guarantorEmail: z.string().optional(),
  guarantorIdNumber: z.string().optional(),
  
  // Referencias del Arrendamiento Anterior
  previousLandlordName: z.string().optional(),
  previousLandlordCell: z.string().optional(),
  previousLandlordAddress: z.string().optional(),
  previousTenancyDuration: z.string().optional(),
  
  // Referencias Laborales
  directBossName: z.string().optional(),
  companyNameAddress: z.string().optional(),
  companyLandline: z.string().optional(),
  companyManagerCell: z.string().optional(),
  
  // Referencias No Familiares
  reference1Name: z.string().optional(),
  reference1Address: z.string().optional(),
  reference1Landline: z.string().optional(),
  reference1Cell: z.string().optional(),
  reference2Name: z.string().optional(),
  reference2Address: z.string().optional(),
  reference2Landline: z.string().optional(),
  reference2Cell: z.string().optional(),
  
  // Términos
  acceptedTerms: z.boolean().default(false),
});

type TenantFormData = z.infer<typeof tenantFormSchema>;

export default function ContractTenantForm() {
  const { contractId } = useParams<{ contractId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState(0);

  // Fetch contract and existing info
  const { data: contractData, isLoading: isLoadingContract, error: contractError } = useQuery({
    queryKey: ["/api/contracts", contractId],
    enabled: !!contractId,
    retry: false,
  });

  const { data: tenantInfo, isLoading: isLoadingInfo } = useQuery({
    queryKey: ["/api/contracts", contractId, "tenant-info"],
    enabled: !!contractId && !!contractData,
  });

  const isLoading = isLoadingContract || isLoadingInfo;

  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      hasPets: false,
      acceptedTerms: false,
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (tenantInfo) {
      form.reset({
        ...tenantInfo,
        age: tenantInfo.age || undefined,
        guarantorAge: tenantInfo.guarantorAge || undefined,
        numberOfTenants: tenantInfo.numberOfTenants || undefined,
        hasPets: tenantInfo.hasPets || false,
        acceptedTerms: tenantInfo.acceptedTerms || false,
      });
    }
  }, [tenantInfo, form]);

  const saveMutation = useMutation({
    mutationFn: (data: TenantFormData) => 
      apiRequest("POST", `/api/contracts/${contractId}/tenant-info`, data),
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

  const onSubmit = (data: TenantFormData) => {
    saveMutation.mutate(data);
  };

  const sections = [
    {
      title: "Datos Generales del Arrendatario",
      description: "Información personal y laboral",
      fields: (
        <>
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domicilio</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Edad</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} data-testid="input-age" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="timeInTulum"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiempo en Tulum</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ej: 2 años" data-testid="input-time-in-tulum" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="maritalStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Civil</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-marital-status">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="soltero">Soltero/a</SelectItem>
                      <SelectItem value="casado">Casado/a</SelectItem>
                      <SelectItem value="divorciado">Divorciado/a</SelectItem>
                      <SelectItem value="viudo">Viudo/a</SelectItem>
                      <SelectItem value="union_libre">Unión Libre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ocupación</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-occupation" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-company" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="workplaceAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Domicilio del Trabajo</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-workplace-address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="monthlyIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingreso Mensual</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="0.00" data-testid="input-monthly-income" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="companyTenure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Antigüedad en la Empresa</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ej: 3 años" data-testid="input-company-tenure" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="whatsappNumber"
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
            
            <FormField
              control={form.control}
              name="cellNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-cell-number" />
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
              name="idType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Identificación</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-id-type">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ine">INE</SelectItem>
                      <SelectItem value="pasaporte">Pasaporte</SelectItem>
                      <SelectItem value="licencia">Licencia de Conducir</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Identificación</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-id-number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="numberOfTenants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Inquilinos</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} data-testid="input-number-of-tenants" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pago</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
          </div>

          <div className="space-y-3">
            <FormField
              control={form.control}
              name="hasPets"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-has-pets"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>¿Tiene mascotas?</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {form.watch("hasPets") && (
              <FormField
                control={form.control}
                name="petDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción de Mascotas</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="textarea-pet-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </>
      ),
    },
    {
      title: "Datos del Garante",
      description: "Información de la persona que avalará el contrato",
      fields: (
        <>
          <FormField
            control={form.control}
            name="guarantorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo del Garante</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-guarantor-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="guarantorAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Domicilio del Garante</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-guarantor-address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="guarantorBirthInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lugar y Fecha de Nacimiento</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ej: Tulum, 01/01/1980" data-testid="input-guarantor-birth-info" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="guarantorNationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nacionalidad</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-guarantor-nationality" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="guarantorAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Edad</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} data-testid="input-guarantor-age" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="guarantorTimeInTulum"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiempo en Tulum</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-guarantor-time-in-tulum" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="guarantorMaritalStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Civil</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-guarantor-marital-status">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="soltero">Soltero/a</SelectItem>
                      <SelectItem value="casado">Casado/a</SelectItem>
                      <SelectItem value="divorciado">Divorciado/a</SelectItem>
                      <SelectItem value="viudo">Viudo/a</SelectItem>
                      <SelectItem value="union_libre">Unión Libre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="guarantorOccupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ocupación</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-guarantor-occupation" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="guarantorCompany"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-guarantor-company" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="guarantorWorkAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Domicilio del Trabajo</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-guarantor-work-address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="guarantorWorkPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono del Trabajo</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-guarantor-work-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="guarantorLandline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono Fijo</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-guarantor-landline" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="guarantorCell"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-guarantor-cell" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="guarantorEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" data-testid="input-guarantor-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="guarantorIdNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Identificación</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-guarantor-id-number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      ),
    },
    {
      title: "Referencias",
      description: "Referencias laborales, de arrendamiento anterior y personales",
      fields: (
        <>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Arrendamiento Anterior</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="previousLandlordName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Anterior Arrendador</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-previous-landlord-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="previousLandlordCell"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular del Anterior Arrendador</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-previous-landlord-cell" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="previousLandlordAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domicilio Anterior</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-previous-landlord-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previousTenancyDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duración del Arrendamiento Anterior</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ej: 2 años" data-testid="input-previous-tenancy-duration" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Referencias Laborales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="directBossName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Jefe Directo</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-direct-boss-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="companyNameAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre y Dirección de la Empresa</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-name-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyLandline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono de la Empresa</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-landline" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="companyManagerCell"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular del Gerente</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-manager-cell" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Referencias No Familiares</h3>
            <div className="space-y-4">
              <h4 className="font-medium">Referencia 1</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reference1Name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-reference1-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reference1Address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domicilio</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-reference1-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reference1Landline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono Fijo</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-reference1-landline" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reference1Cell"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-reference1-cell" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Referencia 2</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reference2Name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-reference2-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reference2Address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domicilio</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-reference2-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reference2Landline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono Fijo</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-reference2-landline" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reference2Cell"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-reference2-cell" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      title: "Términos y Condiciones",
      description: "Aceptación de términos del contrato",
      fields: (
        <>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                Al aceptar estos términos, confirmo que toda la información proporcionada es verídica
                y completa. Entiendo que cualquier falsedad puede resultar en la terminación del contrato.
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
        </>
      ),
    },
  ];

  const currentSectionData = sections[currentSection];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" data-testid="container-loading-tenant-form">
        <Card className="max-w-md w-full" data-testid="card-loading-tenant-form">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="spinner-loading-tenant-form" />
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
      <div className="min-h-screen flex items-center justify-center p-4" data-testid="container-error-tenant-form">
        <Card className="max-w-md w-full" data-testid="card-error-tenant-form">
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
          onClick={() => navigate("/my-opportunities")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formato de Inquilino</CardTitle>
          <CardDescription>
            Completa toda la información requerida para el contrato de arrendamiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">
                Sección {currentSection + 1} de {sections.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(((currentSection + 1) / sections.length) * 100)}% completo
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
              />
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">{currentSectionData.title}</h2>
                <p className="text-muted-foreground">{currentSectionData.description}</p>
              </div>

              <div className="space-y-4">{currentSectionData.fields}</div>

              <div className="flex justify-between gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                  disabled={currentSection === 0}
                  data-testid="button-previous"
                >
                  Anterior
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

                  {currentSection < sections.length - 1 ? (
                    <Button
                      type="button"
                      onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
                      data-testid="button-next"
                    >
                      Siguiente
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={saveMutation.isPending || !form.watch("acceptedTerms")}
                      data-testid="button-submit"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enviar Formulario
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
