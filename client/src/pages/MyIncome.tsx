import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DollarSign, TrendingUp, Clock, CheckCircle2, FileText, Upload, AlertTriangle, BookOpen, Info, CheckCircle, CreditCard, Building, Wallet } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateBankInfoSchema, type UpdateBankInfo } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface IncomeTransaction {
  id: string;
  category: string;
  beneficiaryId: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  payoutBatchId?: string;
}

interface IncomeSummary {
  totalEarnings: number;
  paidAmount: number;
  pendingAmount: number;
  transactionCount: number;
  byCategory: Record<string, { count: number; total: number }>;
}

export default function MyIncome() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [termsAccepted, setTermsAccepted] = useState(user?.commissionTermsAccepted || false);
  const [documentType, setDocumentType] = useState<"passport" | "ine">("ine");
  const [documentPreview, setDocumentPreview] = useState<string>("");

  const bankForm = useForm<UpdateBankInfo>({
    resolver: zodResolver(updateBankInfoSchema),
    defaultValues: {
      paymentMethod: "bank",
      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
      bankClabe: "",
      bankEmail: "",
      bankAddress: "",
    },
  });

  // Reset bank form when user data loads or after successful update
  useEffect(() => {
    if (user) {
      bankForm.reset({
        paymentMethod: (user.paymentMethod as "bank" | "zelle" | "wise") || "bank",
        bankName: user.bankName || "",
        bankAccountName: user.bankAccountName || "",
        bankAccountNumber: user.bankAccountNumber || "",
        bankClabe: user.bankClabe || "",
        bankEmail: user.bankEmail || "",
        bankAddress: user.bankAddress || "",
      });
    }
  }, [user, bankForm]);

  const { data: summary, isLoading: summaryLoading } = useQuery<IncomeSummary>({
    queryKey: ["/api/income/my-summary"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<IncomeTransaction[]>({
    queryKey: ["/api/income/my-transactions"],
  });

  const acceptTermsMutation = useMutation({
    mutationFn: async (accepted: boolean) => {
      return await apiRequest("PATCH", "/api/seller/commission-terms", { accepted });
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "Términos aceptados" : "Terms accepted",
        description: language === "es" 
          ? "Has aceptado los términos y condiciones de comisiones"
          : "You have accepted the commission terms and conditions",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudieron aceptar los términos"
          : "Could not accept terms",
        variant: "destructive",
      });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: { documentType: string; documentUrl: string }) => {
      return await apiRequest("POST", "/api/seller/upload-document", data);
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "Documento subido" : "Document uploaded",
        description: language === "es"
          ? "Tu documento ha sido enviado y está pendiente de revisión"
          : "Your document has been submitted and is pending review",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setDocumentPreview("");
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo subir el documento"
          : "Could not upload document",
        variant: "destructive",
      });
    },
  });

  const updateBankInfoMutation = useMutation({
    mutationFn: async (data: UpdateBankInfo) => {
      return await apiRequest("PATCH", "/api/profile/bank-info", data);
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "Información actualizada" : "Information updated",
        description: language === "es"
          ? "Tu información bancaria ha sido actualizada exitosamente"
          : "Your bank information has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es"
          ? "No se pudo actualizar la información bancaria"
          : "Could not update bank information"),
        variant: "destructive",
      });
    },
  });

  const isLoading = summaryLoading || transactionsLoading;

  const handleAcceptTerms = () => {
    if (!termsAccepted) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "Debes aceptar los términos y condiciones"
          : "You must accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }
    acceptTermsMutation.mutate(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "Solo se permiten imágenes o archivos PDF"
          : "Only images or PDF files are allowed",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "El archivo no debe superar los 5MB"
          : "File size must not exceed 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setDocumentPreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadDocument = () => {
    if (!documentPreview) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "Debes seleccionar un documento"
          : "You must select a document",
        variant: "destructive",
      });
      return;
    }

    uploadDocumentMutation.mutate({
      documentType,
      documentUrl: documentPreview,
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      referral_client: { es: "Referido de Cliente", en: "Client Referral" },
      referral_owner: { es: "Referido de Propietario", en: "Owner Referral" },
      rental_commission: { es: "Comisión de Renta", en: "Rental Commission" },
      other_income: { es: "Otros Ingresos", en: "Other Income" },
    };
    return labels[category]?.[language] || category;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: { es: string; en: string } }> = {
      pending: { 
        variant: "secondary", 
        label: { es: "Pendiente", en: "Pending" } 
      },
      paid: { 
        variant: "default", 
        label: { es: "Pagado", en: "Paid" } 
      },
      cancelled: { 
        variant: "destructive", 
        label: { es: "Cancelado", en: "Cancelled" } 
      },
    };

    const config = statusConfig[status] || { 
      variant: "secondary", 
      label: { es: status, en: status } 
    };

    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        {config.label[language]}
      </Badge>
    );
  };

  const getDocumentStatusBadge = () => {
    if (!user?.documentApprovalStatus) {
      return (
        <Badge variant="secondary" data-testid="badge-document-none">
          {language === "es" ? "Sin documento" : "No document"}
        </Badge>
      );
    }

    const statusConfig: Record<string, { variant: any; label: { es: string; en: string } }> = {
      pending: {
        variant: "secondary",
        label: { es: "En revisión", en: "Under review" }
      },
      approved: {
        variant: "default",
        label: { es: "Aprobado", en: "Approved" }
      },
      rejected: {
        variant: "destructive",
        label: { es: "Rechazado", en: "Rejected" }
      },
    };

    const config = statusConfig[user.documentApprovalStatus];
    return (
      <Badge variant={config.variant} data-testid={`badge-document-${user.documentApprovalStatus}`}>
        {config.label[language]}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-state">
        <div className="text-muted-foreground">
          {language === "es" ? "Cargando..." : "Loading..."}
        </div>
      </div>
    );
  }

  const canReceivePayments = user?.commissionTermsAccepted && user?.documentApprovalStatus === "approved";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          {language === "es" ? "Mis Ingresos" : "My Income"}
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          {language === "es"
            ? "Consulta tus ingresos por referidos y comisiones"
            : "View your income from referrals and commissions"}
        </p>
      </div>

      {!canReceivePayments && (
        <Alert variant="destructive" data-testid="alert-requirements">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {language === "es" ? (
              <>
                <strong>Acción requerida:</strong> Para poder cobrar tus comisiones debes:
                <ul className="list-disc ml-6 mt-2">
                  {!user?.commissionTermsAccepted && (
                    <li>Aceptar los términos y condiciones de comisiones</li>
                  )}
                  {(!user?.documentApprovalStatus || user?.documentApprovalStatus !== "approved") && (
                    <li>Subir tu documento de identificación (pasaporte o INE) y esperar su aprobación</li>
                  )}
                </ul>
              </>
            ) : (
              <>
                <strong>Action required:</strong> To receive your commissions you must:
                <ul className="list-disc ml-6 mt-2">
                  {!user?.commissionTermsAccepted && (
                    <li>Accept the commission terms and conditions</li>
                  )}
                  {(!user?.documentApprovalStatus || user?.documentApprovalStatus !== "approved") && (
                    <li>Upload your identification document (passport or INE) and wait for approval</li>
                  )}
                </ul>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className={`grid w-full ${(user?.role === "cliente" || user?.role === "owner") ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-5"}`} data-testid="tabs-list">
          <TabsTrigger value="overview" data-testid="tab-overview">
            {language === "es" ? "Resumen" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="commissions" data-testid="tab-commissions">
            {language === "es" ? "Comisiones" : "Commissions"}
          </TabsTrigger>
          <TabsTrigger value="bank-info" data-testid="tab-bank-info">
            {language === "es" ? "Cuenta Bancaria" : "Bank Account"}
          </TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">
            {language === "es" ? "Documentos" : "Documents"}
          </TabsTrigger>
          {user?.role !== "cliente" && user?.role !== "owner" && (
            <TabsTrigger value="training" data-testid="tab-training">
              {language === "es" ? "Entrenamiento" : "Training"}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card data-testid="card-stat-total">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "es" ? "Ingresos Totales" : "Total Earnings"}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-earnings">
                  ${summary?.totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-paid">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "es" ? "Pagado" : "Paid"}
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-paid-amount">
                  ${summary?.paidAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-pending">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "es" ? "Pendiente" : "Pending"}
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="text-pending-amount">
                  ${summary?.pendingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-transactions">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === "es" ? "Transacciones" : "Transactions"}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-transaction-count">
                  {summary?.transactionCount || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {summary?.byCategory && Object.keys(summary.byCategory).length > 0 && (
            <Card data-testid="card-by-category">
              <CardHeader>
                <CardTitle>
                  {language === "es" ? "Ingresos por Categoría" : "Income by Category"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(summary.byCategory).map(([category, data]) => (
                    <div 
                      key={category} 
                      className="flex items-center justify-between p-3 rounded-md hover-elevate"
                      data-testid={`category-item-${category}`}
                    >
                      <div>
                        <div className="font-medium">{getCategoryLabel(category)}</div>
                        <div className="text-sm text-muted-foreground">
                          {data.count} {language === "es" ? "transacciones" : "transactions"}
                        </div>
                      </div>
                      <div className="text-lg font-bold">
                        ${data.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card data-testid="card-transactions">
            <CardHeader>
              <CardTitle>
                {language === "es" ? "Historial de Transacciones" : "Transaction History"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!transactions || transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-transactions">
                  {language === "es"
                    ? "No tienes transacciones de ingresos aún"
                    : "You don't have any income transactions yet"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "es" ? "Fecha" : "Date"}</TableHead>
                      <TableHead>{language === "es" ? "Categoría" : "Category"}</TableHead>
                      <TableHead>{language === "es" ? "Descripción" : "Description"}</TableHead>
                      <TableHead>{language === "es" ? "Monto" : "Amount"}</TableHead>
                      <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                      <TableHead>{language === "es" ? "Fecha de Pago" : "Payment Date"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                        <TableCell>
                          {format(new Date(transaction.createdAt), "PP", {
                            locale: language === "es" ? es : undefined,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-category-${transaction.id}`}>
                            {getCategoryLabel(transaction.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="font-semibold">
                          ${transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell>
                          {transaction.paidAt
                            ? format(new Date(transaction.paidAt), "PP", {
                                locale: language === "es" ? es : undefined,
                              })
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <Card data-testid="card-commission-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                {language === "es" ? "¿Cómo funcionan las comisiones?" : "How do commissions work?"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold">
                  {language === "es" ? "Tipos de comisiones:" : "Commission types:"}
                </h3>
                <div className="space-y-2 text-sm">
                  {user?.role !== "cliente" && user?.role !== "owner" && (
                    <div className="p-3 rounded-md bg-muted">
                      <strong>{language === "es" ? "Comisión por Renta:" : "Rental Commission:"}</strong>
                      <p className="text-muted-foreground mt-1">
                        {language === "es"
                          ? "Recibes el 50% de la comisión total cuando completas una renta. Si hay un referido, tu porcentaje se reduce a la mitad del porcentaje del referido."
                          : "You receive 50% of the total commission when you complete a rental. If there is a referral, your percentage is reduced by half of the referral percentage."}
                      </p>
                    </div>
                  )}
                  <div className="p-3 rounded-md bg-muted">
                    <strong>{language === "es" ? "Referido de Cliente:" : "Client Referral:"}</strong>
                    <p className="text-muted-foreground mt-1">
                      {language === "es"
                        ? "Ganas el 25% de la comisión que nosotros obtenemos cuando refieres un cliente que completa una renta."
                        : "You earn 25% of the commission we obtain when you refer a client who completes a rental."}
                    </p>
                    <div className="mt-2 p-2 bg-background rounded text-xs space-y-1">
                      <p className="font-medium">{language === "es" ? "Ejemplo:" : "Example:"}</p>
                      <p>
                        {language === "es"
                          ? "• Si rentamos una propiedad a 1 año por $18,000, ganamos $18,000 de comisión y tú ganas el 25% = $4,500"
                          : "• If we rent a property for 1 year at $18,000, we earn $18,000 commission and you earn 25% = $4,500"}
                      </p>
                      <p>
                        {language === "es"
                          ? "• Si es por 6 meses y ganamos $9,000, tú ganas el 25% = $2,250"
                          : "• If it's for 6 months and we earn $9,000, you earn 25% = $2,250"}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-muted">
                    <strong>{language === "es" ? "Referido de Propietario:" : "Owner Referral:"}</strong>
                    <p className="text-muted-foreground mt-1">
                      {language === "es"
                        ? "Ganas el 20% de la comisión que nosotros obtenemos cuando refieres un propietario cuya propiedad se renta."
                        : "You earn 20% of the commission we obtain when you refer an owner whose property gets rented."}
                    </p>
                    <div className="mt-2 p-2 bg-background rounded text-xs space-y-1">
                      <p className="font-medium">{language === "es" ? "Ejemplo:" : "Example:"}</p>
                      <p>
                        {language === "es"
                          ? "• Si rentamos la propiedad a 1 año por $18,000 y ganamos $18,000, tú ganas el 20% = $3,600"
                          : "• If we rent the property for 1 year at $18,000 and earn $18,000, you earn 20% = $3,600"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold">
                  {language === "es" ? "¿Cuándo se pagan las comisiones?" : "When are commissions paid?"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === "es"
                    ? "Las comisiones se procesan y pagan mensualmente. Una vez que tu comisión está marcada como 'Pagada', el pago se realiza dentro de los próximos 5 días hábiles."
                    : "Commissions are processed and paid monthly. Once your commission is marked as 'Paid', payment is made within the next 5 business days."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-commission-terms">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {language === "es" ? "Términos y Condiciones de Comisiones" : "Commission Terms and Conditions"}
              </CardTitle>
              {user?.commissionTermsAccepted && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {language === "es" ? "Aceptados" : "Accepted"}
                  {user?.commissionTermsAcceptedAt && (
                    <span className="text-muted-foreground">
                      • {format(new Date(user.commissionTermsAcceptedAt), "PP", { locale: language === "es" ? es : undefined })}
                    </span>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {!user?.commissionTermsAccepted ? (
                <>
                  <div className="max-h-64 overflow-y-auto border rounded-md p-4 space-y-2 text-sm">
                    <h4 className="font-semibold">
                      {language === "es" ? "Términos y Condiciones:" : "Terms and Conditions:"}
                    </h4>
                    <ol className="list-decimal ml-4 space-y-2">
                      <li>
                        {language === "es"
                          ? "Las comisiones se calculan en base al monto total de renta acordado."
                          : "Commissions are calculated based on the total agreed rental amount."}
                      </li>
                      <li>
                        {language === "es"
                          ? "El pago de comisiones está sujeto a la verificación y aprobación de documentos de identificación."
                          : "Commission payment is subject to verification and approval of identification documents."}
                      </li>
                      <li>
                        {language === "es"
                          ? "Las comisiones se pagarán únicamente después de que el contrato de renta esté firmado y el pago inicial haya sido recibido."
                          : "Commissions will be paid only after the rental contract is signed and initial payment has been received."}
                      </li>
                      <li>
                        {language === "es"
                          ? "HomesApp se reserva el derecho de retener o cancelar comisiones en caso de fraude o violación de términos."
                          : "HomesApp reserves the right to withhold or cancel commissions in case of fraud or violation of terms."}
                      </li>
                      <li>
                        {language === "es"
                          ? "Los vendedores son responsables de reportar sus ingresos por comisiones a las autoridades fiscales correspondientes."
                          : "Sellers are responsible for reporting their commission income to the appropriate tax authorities."}
                      </li>
                    </ol>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms-checkbox"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                      data-testid="checkbox-terms"
                    />
                    <Label htmlFor="terms-checkbox" className="text-sm cursor-pointer">
                      {language === "es"
                        ? "He leído y acepto los términos y condiciones de comisiones"
                        : "I have read and accept the commission terms and conditions"}
                    </Label>
                  </div>

                  <Button
                    onClick={handleAcceptTerms}
                    disabled={!termsAccepted || acceptTermsMutation.isPending}
                    data-testid="button-accept-terms"
                  >
                    {acceptTermsMutation.isPending
                      ? (language === "es" ? "Procesando..." : "Processing...")
                      : (language === "es" ? "Aceptar Términos" : "Accept Terms")}
                  </Button>
                </>
              ) : (
                <Alert data-testid="alert-terms-accepted">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {language === "es"
                      ? "Has aceptado los términos y condiciones de comisiones."
                      : "You have accepted the commission terms and conditions."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card data-testid="card-document-upload">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {language === "es" ? "Documentación" : "Documentation"}
              </CardTitle>
              <CardDescription>
                {language === "es"
                  ? "Para poder recibir tus comisiones, necesitamos verificar tu identidad."
                  : "To receive your commissions, we need to verify your identity."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {language === "es" ? "Estado del documento:" : "Document status:"}
                  </p>
                  <div className="flex items-center gap-2">
                    {getDocumentStatusBadge()}
                    {user?.documentType && (
                      <Badge variant="outline" data-testid="badge-document-type">
                        {user.documentType === "passport" 
                          ? (language === "es" ? "Pasaporte" : "Passport")
                          : "INE"}
                      </Badge>
                    )}
                  </div>
                </div>
                {user?.documentReviewedAt && (
                  <p className="text-xs text-muted-foreground">
                    {language === "es" ? "Revisado:" : "Reviewed:"}{" "}
                    {format(new Date(user.documentReviewedAt), "PP", { locale: language === "es" ? es : undefined })}
                  </p>
                )}
              </div>

              {user?.documentApprovalStatus === "rejected" && user?.documentRejectionReason && (
                <Alert variant="destructive" data-testid="alert-document-rejected">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{language === "es" ? "Documento rechazado:" : "Document rejected:"}</strong>
                    <p className="mt-1">{user.documentRejectionReason}</p>
                  </AlertDescription>
                </Alert>
              )}

              {(!user?.documentApprovalStatus || user?.documentApprovalStatus === "rejected") && (
                <div className="space-y-4">
                  <Separator />
                  
                  <div className="space-y-3">
                    <Label>{language === "es" ? "Tipo de documento:" : "Document type:"}</Label>
                    <RadioGroup value={documentType} onValueChange={(value: any) => setDocumentType(value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ine" id="ine" data-testid="radio-ine" />
                        <Label htmlFor="ine" className="cursor-pointer">INE (Identificación Nacional Electoral)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="passport" id="passport" data-testid="radio-passport" />
                        <Label htmlFor="passport" className="cursor-pointer">
                          {language === "es" ? "Pasaporte" : "Passport"}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="document-upload">
                      {language === "es" ? "Subir documento:" : "Upload document:"}
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="document-upload"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="input-document"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                      data-testid="button-select-file"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {language === "es" ? "Seleccionar archivo" : "Select file"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {language === "es"
                        ? "Formatos permitidos: JPG, PNG, PDF (máx. 5MB)"
                        : "Allowed formats: JPG, PNG, PDF (max. 5MB)"}
                    </p>
                  </div>

                  {documentPreview && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-2">
                        {language === "es" ? "Vista previa:" : "Preview:"}
                      </p>
                      {documentPreview.startsWith("data:application/pdf") ? (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4" />
                          PDF seleccionado
                        </div>
                      ) : (
                        <img
                          src={documentPreview}
                          alt="Document preview"
                          className="max-h-40 mx-auto rounded"
                        />
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleUploadDocument}
                    disabled={!documentPreview || uploadDocumentMutation.isPending}
                    className="w-full"
                    data-testid="button-upload-document"
                  >
                    {uploadDocumentMutation.isPending
                      ? (language === "es" ? "Subiendo..." : "Uploading...")
                      : (language === "es" ? "Subir Documento" : "Upload Document")}
                  </Button>
                </div>
              )}

              {user?.documentApprovalStatus === "pending" && (
                <Alert data-testid="alert-document-pending">
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    {language === "es"
                      ? "Tu documento está en revisión. Te notificaremos cuando sea aprobado."
                      : "Your document is under review. We will notify you when it's approved."}
                  </AlertDescription>
                </Alert>
              )}

              {user?.documentApprovalStatus === "approved" && (
                <Alert data-testid="alert-document-approved">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {language === "es"
                      ? "Tu documento ha sido aprobado. Ya puedes recibir tus comisiones."
                      : "Your document has been approved. You can now receive your commissions."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank-info" className="space-y-6">
          <Card data-testid="card-bank-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {language === "es" ? "Información Bancaria" : "Bank Information"}
              </CardTitle>
              <CardDescription>
                {language === "es"
                  ? "Configura tu cuenta para recibir pagos"
                  : "Set up your account to receive payments"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...bankForm}>
                <form onSubmit={bankForm.handleSubmit((data) => updateBankInfoMutation.mutate(data))} className="space-y-6">
                  <FormField
                    control={bankForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "es" ? "Método de Pago" : "Payment Method"}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payment-method">
                              <SelectValue placeholder={language === "es" ? "Selecciona un método" : "Select a method"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bank">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                {language === "es" ? "Banco Mexicano" : "Mexican Bank"}
                              </div>
                            </SelectItem>
                            <SelectItem value="zelle">
                              <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4" />
                                Zelle
                              </div>
                            </SelectItem>
                            <SelectItem value="wise">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Wise
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {bankForm.watch("paymentMethod") === "bank" && (
                    <FormField
                      control={bankForm.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "es" ? "Nombre del Banco" : "Bank Name"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={language === "es" ? "Ej: BBVA, Santander, Banorte" : "e.g., BBVA, Santander, Banorte"}
                              data-testid="input-bank-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={bankForm.control}
                    name="bankAccountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "es" ? "Nombre del Titular" : "Account Holder Name"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={language === "es" ? "Nombre completo" : "Full name"}
                            data-testid="input-account-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={bankForm.control}
                    name="bankAccountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "es" ? "Número de Cuenta" : "Account Number"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={language === "es" ? "Número de cuenta" : "Account number"}
                            data-testid="input-account-number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {bankForm.watch("paymentMethod") === "bank" && (
                    <FormField
                      control={bankForm.control}
                      name="bankClabe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "es" ? "CLABE Interbancaria" : "Interbank CLABE"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="18 dígitos"
                              maxLength={18}
                              data-testid="input-clabe"
                            />
                          </FormControl>
                          <FormDescription>
                            {language === "es"
                              ? "La CLABE es necesaria para transferencias en México"
                              : "CLABE is required for transfers in Mexico"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={bankForm.control}
                    name="bankEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "es" ? "Correo Electrónico" : "Email Address"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder={language === "es" ? "correo@ejemplo.com" : "email@example.com"}
                            data-testid="input-bank-email"
                          />
                        </FormControl>
                        <FormDescription>
                          {language === "es"
                            ? "Email asociado a tu cuenta (opcional)"
                            : "Email associated with your account (optional)"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={bankForm.control}
                    name="bankAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "es" ? "Dirección" : "Address"}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={language === "es" ? "Dirección completa" : "Full address"}
                            className="resize-none"
                            rows={3}
                            data-testid="textarea-bank-address"
                          />
                        </FormControl>
                        <FormDescription>
                          {language === "es"
                            ? "Dirección asociada a tu cuenta (opcional)"
                            : "Address associated with your account (optional)"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateBankInfoMutation.isPending}
                    data-testid="button-save-bank-info"
                  >
                    {updateBankInfoMutation.isPending
                      ? (language === "es" ? "Guardando..." : "Saving...")
                      : (language === "es" ? "Guardar Información Bancaria" : "Save Bank Information")}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card data-testid="card-training">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {language === "es" ? "Tips y Entrenamiento" : "Tips and Training"}
              </CardTitle>
              <CardDescription>
                {language === "es"
                  ? "Recursos para ayudarte a tener éxito como vendedor"
                  : "Resources to help you succeed as a seller"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" data-testid="accordion-leads">
                  <AccordionTrigger>
                    {language === "es" ? "Cómo generar y calificar leads" : "How to generate and qualify leads"}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm">
                    <p>
                      {language === "es"
                        ? "Los mejores leads provienen de referidos y de seguimiento constante. Aquí algunos tips:"
                        : "The best leads come from referrals and constant follow-up. Here are some tips:"}
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        {language === "es"
                          ? "Mantén contacto regular con tus clientes anteriores"
                          : "Keep regular contact with your previous clients"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Responde rápido a las consultas (dentro de 2 horas si es posible)"
                          : "Respond quickly to inquiries (within 2 hours if possible)"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Califica leads preguntando por presupuesto, fecha de mudanza y preferencias"
                          : "Qualify leads by asking about budget, move-in date and preferences"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Usa el sistema de seguimiento para no perder ninguna oportunidad"
                          : "Use the tracking system to not miss any opportunity"}
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" data-testid="accordion-properties">
                  <AccordionTrigger>
                    {language === "es" ? "Presentación de propiedades" : "Property presentation"}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm">
                    <p>
                      {language === "es"
                        ? "Una buena presentación aumenta tus posibilidades de cerrar:"
                        : "A good presentation increases your chances of closing:"}
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        {language === "es"
                          ? "Llega 10 minutos antes que el cliente para preparar la visita"
                          : "Arrive 10 minutes before the client to prepare the visit"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Conoce bien la propiedad y el vecindario"
                          : "Know the property and neighborhood well"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Destaca las características únicas y los beneficios"
                          : "Highlight unique features and benefits"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Toma fotos y video durante la visita para seguimiento"
                          : "Take photos and video during the visit for follow-up"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Siempre haz seguimiento dentro de 24 horas"
                          : "Always follow up within 24 hours"}
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" data-testid="accordion-negotiation">
                  <AccordionTrigger>
                    {language === "es" ? "Negociación y cierre" : "Negotiation and closing"}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm">
                    <p>
                      {language === "es"
                        ? "Cerrar el trato es el paso más importante:"
                        : "Closing the deal is the most important step:"}
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        {language === "es"
                          ? "Escucha más de lo que hablas - entiende las necesidades del cliente"
                          : "Listen more than you talk - understand the client's needs"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Maneja objeciones con calma y ofrece soluciones"
                          : "Handle objections calmly and offer solutions"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Presenta el contrato de forma clara y transparente"
                          : "Present the contract clearly and transparently"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Facilita el proceso de firma y pago inicial"
                          : "Facilitate the signing process and initial payment"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Mantén contacto post-cierre para asegurar satisfacción"
                          : "Keep post-closing contact to ensure satisfaction"}
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" data-testid="accordion-referrals">
                  <AccordionTrigger>
                    {language === "es" ? "Programa de referidos" : "Referral program"}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm">
                    <p>
                      {language === "es"
                        ? "Los referidos son una excelente fuente de ingreso adicional:"
                        : "Referrals are an excellent source of additional income:"}
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        {language === "es"
                          ? "Pide referidos a todos tus clientes satisfechos"
                          : "Ask for referrals from all your satisfied clients"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Mantén una red de contactos con otros profesionales del sector"
                          : "Keep a network of contacts with other industry professionals"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Refiere propietarios que quieran enlistar propiedades"
                          : "Refer owners who want to list properties"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Explica los beneficios de nuestro servicio a tus contactos"
                          : "Explain the benefits of our service to your contacts"}
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" data-testid="accordion-tools">
                  <AccordionTrigger>
                    {language === "es" ? "Uso de herramientas de la plataforma" : "Using platform tools"}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm">
                    <p>
                      {language === "es"
                        ? "Saca provecho de todas las herramientas disponibles:"
                        : "Take advantage of all available tools:"}
                    </p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>
                        {language === "es"
                          ? "Dashboard: Monitorea tus leads y propiedades activas"
                          : "Dashboard: Monitor your leads and active properties"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Chat: Comunícate rápidamente con clientes y administración"
                          : "Chat: Communicate quickly with clients and administration"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Calendario: Organiza tus citas y visitas"
                          : "Calendar: Organize your appointments and visits"}
                      </li>
                      <li>
                        {language === "es"
                          ? "Reportes: Analiza tu desempeño y áreas de mejora"
                          : "Reports: Analyze your performance and areas for improvement"}
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
