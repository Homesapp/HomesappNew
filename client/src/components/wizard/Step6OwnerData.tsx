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
import { getTranslation, Language } from "@/lib/wizardTranslations";

// Schema for owner and referral data
const getOwnerDataSchema = (language: Language) => {
  const t = getTranslation(language);
  return z.object({
    // Owner private data
    ownerFirstName: z.string().min(2, t.step6.firstNameMinLength),
    ownerLastName: z.string().min(2, t.step6.lastNameMinLength),
    ownerPhone: z.string().min(10, t.step6.phoneMinLength),
    ownerEmail: z.string().email(t.step6.invalidEmail).optional().or(z.literal("")),
    
    // Referral data (optional)
    hasReferral: z.boolean().default(false),
    referredByName: z.string().optional(),
    referredByLastName: z.string().optional(),
    referredByPhone: z.string().optional(),
    referredByEmail: z.string().email(t.step6.invalidEmail).optional().or(z.literal("")),
    
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
          message: t.step6.referralNameRequired,
          path: ["referredByName"],
        });
      }
      if (!data.referredByLastName || data.referredByLastName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t.step6.referralLastNameRequired,
          path: ["referredByLastName"],
        });
      }
      if (!data.referredByPhone || data.referredByPhone.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t.step6.referralPhoneRequired,
          path: ["referredByPhone"],
        });
      }
    }
  });
};

type OwnerDataForm = z.infer<ReturnType<typeof getOwnerDataSchema>>;

type Step6Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  onPrevious: () => void;
  language?: Language;
};

// Available document types - labels will be generated from translations
const getDocumentTypes = (t: ReturnType<typeof getTranslation>) => [
  { value: "ife_ine_frente", label: t.step6.doc_ife_ine_frente },
  { value: "ife_ine_reverso", label: t.step6.doc_ife_ine_reverso },
  { value: "pasaporte", label: t.step6.doc_pasaporte },
  { value: "legal_estancia", label: t.step6.doc_legal_estancia },
  { value: "escrituras", label: t.step6.doc_escrituras },
  { value: "contrato_compraventa", label: t.step6.doc_contrato_compraventa },
  { value: "fideicomiso", label: t.step6.doc_fideicomiso },
  { value: "recibo_agua", label: t.step6.doc_recibo_agua },
  { value: "recibo_luz", label: t.step6.doc_recibo_luz },
  { value: "recibo_internet", label: t.step6.doc_recibo_internet },
  { value: "reglas_internas", label: t.step6.doc_reglas_internas },
  { value: "reglamento_condominio", label: t.step6.doc_reglamento_condominio },
  { value: "comprobante_no_adeudo", label: t.step6.doc_comprobante_no_adeudo },
  { value: "acta_constitutiva", label: t.step6.doc_acta_constitutiva },
  { value: "poder_notarial", label: t.step6.doc_poder_notarial },
  { value: "identificacion_representante", label: t.step6.doc_identificacion_representante },
];

export default function Step6OwnerData({ data, onUpdate, onNext, onPrevious, language = "es" }: Step6Props) {
  const t = getTranslation(language);
  const ownerDataSchema = getOwnerDataSchema(language);
  const DOCUMENT_TYPES = getDocumentTypes(t);
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
        title: t.step6.error,
        description: t.step6.fileSizeError,
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t.step6.error,
        description: t.step6.fileTypeError,
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
          title: t.step6.documentAdded,
          description: `${file.name} ${t.step6.documentAddedDesc}`,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: t.step6.error,
        description: t.step6.documentUploadError,
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
      title: t.step6.documentRemoved,
      description: t.step6.documentRemovedDesc,
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
          {t.step6.title}
        </h2>
        <p className="text-muted-foreground" data-testid="text-step6-description">
          {t.step6.subtitle}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Owner Private Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t.step6.ownerDataTitle}
              </CardTitle>
              <CardDescription>
                {t.step6.ownerDataDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownerFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.step6.firstNameLabel}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t.step6.firstNamePlaceholder}
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
                      <FormLabel>{t.step6.lastNameLabel}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t.step6.lastNamePlaceholder}
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
                      <FormLabel>{t.step6.phoneLabel}</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder={t.step6.phonePlaceholder}
                          {...field}
                          data-testid="input-owner-phone"
                        />
                      </FormControl>
                      <FormDescription>
                        {t.step6.phoneDesc}
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
                      <FormLabel>{t.step6.emailLabel}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t.step6.emailPlaceholder}
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
                {t.step6.referralDataTitle}
              </CardTitle>
              <CardDescription>
                {t.step6.referralDataDesc}
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
                        {t.step6.hasReferralLabel}
                      </FormLabel>
                      <FormDescription>
                        {t.step6.hasReferralDesc}
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
                          <FormLabel>{t.step6.referralFirstNameLabel}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t.step6.referralFirstNamePlaceholder}
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
                          <FormLabel>{t.step6.referralLastNameLabel}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t.step6.referralLastNamePlaceholder}
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
                          <FormLabel>{t.step6.referralPhoneLabel}</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder={t.step6.referralPhonePlaceholder}
                              {...field}
                              data-testid="input-referral-phone"
                            />
                          </FormControl>
                          <FormDescription>
                            {t.step6.phoneDesc}
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
                          <FormLabel>{t.step6.referralEmailLabel}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={t.step6.referralEmailPlaceholder}
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
                {t.step6.documentsTitle}
              </CardTitle>
              <CardDescription>
                {t.step6.documentsDesc}
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
                  {t.step6.uploadDocument}
                </Button>
              </div>

              {documents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t.step6.uploadedDocuments} ({documents.length}):</p>
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
                {t.step6.fileFormatsInfo}
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
              {t.previous}
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              data-testid="button-next-step6"
            >
              {t.next}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
