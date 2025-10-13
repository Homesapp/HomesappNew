import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Upload, X, FileText, User, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Schema for owner and referral data
const ownerDataSchema = z.object({
  // Owner private data
  ownerFirstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  ownerLastName: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres"),
  ownerPhone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  ownerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  
  // Referral data (optional)
  hasReferral: z.boolean().default(false),
  referredByName: z.string().optional(),
  referredByLastName: z.string().optional(),
  referredByPhone: z.string().optional(),
  referredByEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  
  // Documents (optional but recommended)
  documents: z.array(z.object({
    type: z.string(),
    url: z.string(),
    name: z.string(),
  })).optional().default([]),
}).superRefine((data, ctx) => {
  // Validate referral data if hasReferral is true
  if (data.hasReferral) {
    if (!data.referredByName || data.referredByName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El nombre del referido es requerido",
        path: ["referredByName"],
      });
    }
    if (!data.referredByLastName || data.referredByLastName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Los apellidos del referido son requeridos",
        path: ["referredByLastName"],
      });
    }
    if (!data.referredByPhone || data.referredByPhone.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El teléfono del referido es requerido",
        path: ["referredByPhone"],
      });
    }
  }
});

type OwnerDataForm = z.infer<typeof ownerDataSchema>;

type Step6Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  onPrevious: () => void;
};

// Available document types
const DOCUMENT_TYPES = [
  { value: "ife_ine_frente", label: "INE/IFE Frente" },
  { value: "ife_ine_reverso", label: "INE/IFE Reverso" },
  { value: "pasaporte", label: "Pasaporte" },
  { value: "legal_estancia", label: "Legal Estancia" },
  { value: "escrituras", label: "Escrituras" },
  { value: "contrato_compraventa", label: "Contrato de Compraventa" },
  { value: "fideicomiso", label: "Fideicomiso" },
  { value: "recibo_agua", label: "Recibo de Agua" },
  { value: "recibo_luz", label: "Recibo de Luz" },
  { value: "recibo_internet", label: "Recibo de Internet" },
  { value: "reglas_internas", label: "Reglas Internas" },
  { value: "reglamento_condominio", label: "Reglamento de Condominio" },
  { value: "comprobante_no_adeudo", label: "Comprobante de No Adeudo" },
  { value: "acta_constitutiva", label: "Acta Constitutiva" },
  { value: "poder_notarial", label: "Poder Notarial" },
  { value: "identificacion_representante", label: "Identificación de Representante" },
];

export default function Step6OwnerData({ data, onUpdate, onNext, onPrevious }: Step6Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>(DOCUMENT_TYPES[0].value);
  const [documents, setDocuments] = useState<Array<{ type: string; url: string; name: string }>>(
    data.ownerData?.documents || []
  );

  const form = useForm<OwnerDataForm>({
    resolver: zodResolver(ownerDataSchema),
    defaultValues: {
      ownerFirstName: data.ownerData?.ownerFirstName || "",
      ownerLastName: data.ownerData?.ownerLastName || "",
      ownerPhone: data.ownerData?.ownerPhone || "",
      ownerEmail: data.ownerData?.ownerEmail || "",
      hasReferral: data.ownerData?.hasReferral || false,
      referredByName: data.ownerData?.referredByName || "",
      referredByLastName: data.ownerData?.referredByLastName || "",
      referredByPhone: data.ownerData?.referredByPhone || "",
      referredByEmail: data.ownerData?.referredByEmail || "",
      documents: documents,
    },
  });

  const hasReferral = form.watch("hasReferral");

  const onSubmit = (formData: OwnerDataForm) => {
    const ownerData = {
      ...formData,
      documents,
    };
    onNext({ ownerData });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo no debe exceder 10MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos JPG, PNG o PDF",
        variant: "destructive",
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newDoc = {
          type: selectedDocType,
          url: base64String,
          name: file.name,
        };
        
        const updatedDocs = [...documents, newDoc];
        setDocuments(updatedDocs);
        form.setValue("documents", updatedDocs);
        
        toast({
          title: "Documento agregado",
          description: `${file.name} ha sido agregado exitosamente`,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el documento",
        variant: "destructive",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveDocument = (index: number) => {
    const updatedDocs = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocs);
    form.setValue("documents", updatedDocs);
    
    toast({
      title: "Documento eliminado",
      description: "El documento ha sido eliminado",
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = DOCUMENT_TYPES.find(dt => dt.value === type);
    return docType?.label || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step6-title">
          Datos del Propietario y Documentos
        </h2>
        <p className="text-muted-foreground" data-testid="text-step6-description">
          Información privada del propietario y documentación opcional
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Owner Private Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Datos Privados del Propietario Real
              </CardTitle>
              <CardDescription>
                Esta información es confidencial y solo será visible para administradores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownerFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre(s) *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Juan Carlos"
                          {...field}
                          data-testid="input-owner-first-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellidos *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="García López"
                          {...field}
                          data-testid="input-owner-last-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono WhatsApp *</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+52 984 123 4567"
                          {...field}
                          data-testid="input-owner-phone"
                        />
                      </FormControl>
                      <FormDescription>
                        Incluye código de país
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="propietario@ejemplo.com"
                          {...field}
                          data-testid="input-owner-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Referral Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Datos del Referido
              </CardTitle>
              <CardDescription>
                Si alguien refirió al propietario, registra sus datos aquí
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="hasReferral"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        ¿Esta propiedad fue referida?
                      </FormLabel>
                      <FormDescription>
                        Activa si alguien trajo a este propietario
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={field.value}
                        onChange={field.onChange}
                        data-testid="checkbox-has-referral"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {hasReferral && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="referredByName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre(s) del Referido *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="María"
                              {...field}
                              data-testid="input-referral-first-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="referredByLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellidos del Referido *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="González"
                              {...field}
                              data-testid="input-referral-last-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="referredByPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono WhatsApp del Referido *</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+52 984 987 6543"
                              {...field}
                              data-testid="input-referral-phone"
                            />
                          </FormControl>
                          <FormDescription>
                            Incluye código de país
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="referredByEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email del Referido (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="referido@ejemplo.com"
                              {...field}
                              data-testid="input-referral-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Documents Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos del Propietario
              </CardTitle>
              <CardDescription>
                Sube documentos importantes (INE, escrituras, recibos, etc.) - Opcional pero recomendado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:max-w-xs"
                  data-testid="select-document-type"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="input-document-file"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto"
                  data-testid="button-upload-document"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Documento
                </Button>
              </div>

              {documents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Documentos cargados ({documents.length}):</p>
                  <div className="grid grid-cols-1 gap-2">
                    {documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`document-item-${index}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <Badge variant="outline" className="mt-1">
                              {getDocumentTypeLabel(doc.type)}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDocument(index)}
                          data-testid={`button-remove-document-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Formatos permitidos: JPG, PNG, PDF. Tamaño máximo: 10MB por archivo.
              </p>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="w-full sm:w-auto"
              data-testid="button-previous-step6"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              data-testid="button-next-step6"
            >
              Continuar
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
