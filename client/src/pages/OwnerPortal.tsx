import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Key,
  FileText,
  CreditCard,
  Wrench,
  MessageSquare,
  LogOut,
  Calendar,
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  Mail,
  Loader2,
  Send,
  XCircle,
  Info,
  DollarSign,
  Receipt,
  User,
  Zap,
  Droplets,
  Flame,
  AlertCircle,
  TrendingUp,
  Check,
  ExternalLink,
  ScrollText,
  Filter,
  Download,
  Eye,
  Users,
  X
} from "lucide-react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { usePortalApi } from "@/hooks/usePortalApi";
import { useTranslation } from "@/hooks/useTranslation";

interface ContractInfo {
  id: number;
  status: string;
  monthlyRent: number;
  depositAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  paymentDay: number;
  propertyTitle: string;
  propertyAddress?: string;
  agencyName: string;
  agencyPhone?: string;
  agencyEmail?: string;
  tenantName: string;
  tenantEmail?: string;
  contractUrl?: string;
  inventoryUrl?: string;
  tenantPhone?: string;
}

interface PaymentReceipt {
  id: number;
  paymentMonth: string;
  paymentYear: number;
  amount: number;
  currency: string;
  uploadedAt: string;
  status: string;
  receiptUrl?: string;
  notes?: string;
  tenantName: string;
}

interface ServiceAccount {
  id: number;
  serviceType: string;
  accountNumber: string;
  provider: string;
  status: string;
  lastReading?: number;
  lastReadingDate?: string;
  currentBalance?: number;
}

interface MaintenanceTicket {
  id: number;
  type: string;
  priority: string;
  status: string;
  description: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
  estimatedCost?: number;
  actualCost?: number;
}

interface ChatMessage {
  id: number;
  senderType: string;
  message: string;
  sentAt: string;
  isAi?: boolean;
}

// Portal 2.0 Interfaces
interface PortalPaymentRecord {
  id: string;
  contractId: string;
  category: string;
  description?: string;
  amount: number;
  currency: string;
  dueDate: string;
  datePaid?: string;
  status: string;
  paidBy?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  tenantNotes?: string;
  ownerNotes?: string;
  verifiedAt?: string;
  createdAt: string;
}

interface PortalPaymentSummary {
  totalDue: number;
  totalPaid: number;
  totalVerified: number;
  pendingCount: number;
  overdueCount: number;
  currency: string;
}

interface PortalServiceConfig {
  id: string;
  contractId: string;
  serviceType: string;
  provider?: string;
  accountNumber?: string;
  monthlyEstimate?: number;
  paymentResponsibility: string;
  notes?: string;
  showToTenant: boolean;
  tenantCanEdit: boolean;
  isActive: boolean;
  createdAt: string;
}

interface PortalDocument {
  id: string;
  contractId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  description?: string;
  uploadedByRole: string;
  visibleToTenant: boolean;
  visibleToOwner: boolean;
  createdAt: string;
}

interface PortalMessage {
  id: string;
  contractId: string;
  senderRole?: string;
  senderName?: string;
  messageType: string;
  content: string;
  isInternal: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  readByTenant: boolean;
  readByOwner: boolean;
  createdAt: string;
}

interface FinancialSummary {
  totalRevenue: number;
  pendingPayments: number;
  maintenanceCosts: number;
  netIncome: number;
  currency: string;
}

const serviceAccountSchema = z.object({
  serviceType: z.enum(["electricity", "water", "gas", "internet", "other"]),
  accountNumber: z.string().min(1, "Account number is required"),
  provider: z.string().min(1, "Provider name is required"),
});

const specialChargeSchema = z.object({
  description: z.string().min(5, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  chargeType: z.enum(["maintenance", "utility", "repair", "other"]),
});

export default function OwnerPortal() {
  const [, setLocation] = useLocation();
  const { session, logout, isLoading: authLoading } = usePortalAuth();
  const { get, post, put } = usePortalApi();
  const { toast } = useToast();
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const [showChargeDialog, setShowChargeDialog] = useState(false);
  
  // Payment filters
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [paymentCategoryFilter, setPaymentCategoryFilter] = useState<string>("all");
  const [paymentYearFilter, setPaymentYearFilter] = useState<string>("all");

  const serviceForm = useForm<z.infer<typeof serviceAccountSchema>>({
    resolver: zodResolver(serviceAccountSchema),
    defaultValues: {
      serviceType: "electricity",
      accountNumber: "",
      provider: "",
    },
  });

  const chargeForm = useForm<z.infer<typeof specialChargeSchema>>({
    resolver: zodResolver(specialChargeSchema),
    defaultValues: {
      description: "",
      amount: 0,
      chargeType: "other",
    },
  });

  useEffect(() => {
    if (!authLoading && !session) {
      setLocation("/portal");
    }
    if (session && session.user.role !== "owner") {
      setLocation("/portal/tenant");
    }
  }, [session, authLoading, setLocation]);

  const { data: contractInfo, isLoading: contractLoading } = useQuery<ContractInfo>({
    queryKey: ["/api/portal/owner/contract"],
    queryFn: () => get("/api/portal/owner/contract"),
    enabled: !!session,
  });

  const { data: receipts = [], isLoading: receiptsLoading } = useQuery<PaymentReceipt[]>({
    queryKey: ["/api/portal/owner/receipts"],
    queryFn: () => get("/api/portal/owner/receipts"),
    enabled: !!session,
  });

  const { data: serviceAccounts = [], isLoading: servicesLoading } = useQuery<ServiceAccount[]>({
    queryKey: ["/api/portal/owner/services"],
    queryFn: () => get("/api/portal/owner/services"),
    enabled: !!session,
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<MaintenanceTicket[]>({
    queryKey: ["/api/portal/owner/maintenance"],
    queryFn: () => get("/api/portal/owner/maintenance"),
    enabled: !!session,
  });

  const { data: financials, isLoading: financialsLoading } = useQuery<FinancialSummary>({
    queryKey: ["/api/portal/owner/financials"],
    queryFn: () => get("/api/portal/owner/financials"),
    enabled: !!session,
  });

  const { data: chatMessages = [], isLoading: chatLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/portal/chat"],
    queryFn: () => get("/api/portal/chat"),
    enabled: !!session && activeTab === "support",
  });

  // Portal 2.0 Queries
  const { data: portalPayments = [], isLoading: portalPaymentsLoading } = useQuery<PortalPaymentRecord[]>({
    queryKey: ["/api/portal/payments"],
    queryFn: () => get("/api/portal/payments"),
    enabled: !!session,
  });

  const { data: paymentSummary, isLoading: paymentSummaryLoading } = useQuery<PortalPaymentSummary>({
    queryKey: ["/api/portal/payments/summary"],
    queryFn: () => get("/api/portal/payments/summary"),
    enabled: !!session,
  });

  const { data: portalServices = [], isLoading: portalServicesLoading } = useQuery<PortalServiceConfig[]>({
    queryKey: ["/api/portal/services"],
    queryFn: () => get("/api/portal/services"),
    enabled: !!session,
  });

  const { data: portalDocuments = [], isLoading: portalDocumentsLoading } = useQuery<PortalDocument[]>({
    queryKey: ["/api/portal/documents"],
    queryFn: () => get("/api/portal/documents"),
    enabled: !!session,
  });

  const { data: portalMessages = [], isLoading: portalMessagesLoading } = useQuery<PortalMessage[]>({
    queryKey: ["/api/portal/messages"],
    queryFn: () => get("/api/portal/messages"),
    enabled: !!session && activeTab === "support",
  });

  const { data: unreadCount } = useQuery<{ unread: number }>({
    queryKey: ["/api/portal/messages/unread"],
    queryFn: () => get("/api/portal/messages/unread"),
    enabled: !!session,
    refetchInterval: 30000,
  });

  const confirmReceiptMutation = useMutation({
    mutationFn: (receiptId: number) => put(`/api/portal/owner/receipts/${receiptId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/owner/receipts"] });
      toast({ title: t("owner.receiptConfirmed", "Payment confirmed") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error", "Error"), description: error.message, variant: "destructive" });
    },
  });

  const rejectReceiptMutation = useMutation({
    mutationFn: (receiptId: number) => put(`/api/portal/owner/receipts/${receiptId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/owner/receipts"] });
      toast({ title: t("owner.receiptRejected", "Payment rejected") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error", "Error"), description: error.message, variant: "destructive" });
    },
  });

  const addServiceMutation = useMutation({
    mutationFn: (data: z.infer<typeof serviceAccountSchema>) => post("/api/portal/owner/services", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/owner/services"] });
      toast({ title: t("owner.serviceAdded", "Service account added") });
      setShowServiceDialog(false);
      serviceForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: t("common.error", "Error"), description: error.message, variant: "destructive" });
    },
  });

  const addChargeMutation = useMutation({
    mutationFn: (data: z.infer<typeof specialChargeSchema>) => post("/api/portal/owner/charges", data),
    onSuccess: () => {
      toast({ title: t("owner.chargeAdded", "Special charge added") });
      setShowChargeDialog(false);
      chargeForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: t("common.error", "Error"), description: error.message, variant: "destructive" });
    },
  });

  // Portal 2.0 Mutations
  const verifyPaymentMutation = useMutation({
    mutationFn: ({ id, ownerNotes }: { id: string; ownerNotes?: string }) => 
      post(`/api/portal/payments/${id}/verify`, { ownerNotes }),
    onMutate: ({ id }) => {
      setProcessingPaymentId(id);
    },
    onSettled: () => {
      setProcessingPaymentId(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/payments/summary"] });
      toast({ title: t("owner.paymentVerified", "Payment verified successfully") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error", "Error"), description: error.message, variant: "destructive" });
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: ({ id, ownerNotes }: { id: string; ownerNotes?: string }) => 
      post(`/api/portal/payments/${id}/reject`, { ownerNotes }),
    onMutate: ({ id }) => {
      setProcessingPaymentId(id);
    },
    onSettled: () => {
      setProcessingPaymentId(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/payments/summary"] });
      toast({ title: t("owner.paymentRejected", "Payment rejected") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error", "Error"), description: error.message, variant: "destructive" });
    },
  });

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    setIsSendingChat(true);
    try {
      await post("/api/portal/chat", { message: chatInput });
      setChatInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/portal/chat"] });
    } catch (error) {
      toast({ title: t("common.error", "Error"), description: "Failed to send message", variant: "destructive" });
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/portal");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
      pending: { variant: "secondary", icon: Clock },
      approved: { variant: "default", icon: CheckCircle2 },
      rejected: { variant: "destructive", icon: XCircle },
      open: { variant: "secondary", icon: Clock },
      in_progress: { variant: "default", icon: Wrench },
      resolved: { variant: "default", icon: CheckCircle2 },
      active: { variant: "default", icon: CheckCircle2 },
      // Portal 2.0 payment statuses
      paid: { variant: "default", icon: CheckCircle2 },
      verified: { variant: "default", icon: Check },
      overdue: { variant: "destructive", icon: AlertCircle },
    };
    const config = variants[status] || { variant: "outline", icon: Info };
    const Icon = config.icon;
    
    // Custom labels for payment statuses
    const labels: Record<string, string> = {
      pending: t("status.pending", "Pending"),
      paid: t("status.paid", "Paid"),
      verified: t("status.verified", "Verified"),
      rejected: t("status.rejected", "Rejected"),
      overdue: t("status.overdue", "Overdue"),
      open: t("status.open", "Open"),
      in_progress: t("status.inProgress", "In Progress"),
      resolved: t("status.resolved", "Resolved"),
      active: t("status.active", "Active"),
    };
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {labels[status] || status.replace("_", " ")}
      </Badge>
    );
  };

  const getServiceIcon = (type: string) => {
    const icons: Record<string, typeof Zap> = {
      electricity: Zap,
      water: Droplets,
      gas: Flame,
      internet: Building2,
      other: Info,
    };
    const Icon = icons[type] || Info;
    return <Icon className="h-5 w-5" />;
  };

  if (authLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingReceipts = receipts.filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{t("owner.portal", "Portal del Propietario")}</h1>
              <p className="text-sm text-muted-foreground">{session.user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation("/")}
              data-testid="button-go-home"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t("portal.goToHomesApp", "Ir a HomesApp")}</span>
              <span className="sm:hidden">Home</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t("common.logout", "Cerrar sesi\u00f3n")}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1" data-testid="tabs-navigation">
            <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t("owner.overview", "Inicio")}</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2 relative" data-testid="tab-payments">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">{t("owner.payments", "Pagos")}</span>
              {pendingReceipts.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingReceipts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2" data-testid="tab-services">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">{t("owner.services", "Servicios")}</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-2" data-testid="tab-maintenance">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">{t("owner.maintenance", "Mantenimiento")}</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2" data-testid="tab-documents">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t("owner.documents", "Documentos")}</span>
            </TabsTrigger>
            <TabsTrigger value="contract" className="gap-2" data-testid="tab-contract">
              <ScrollText className="h-4 w-4" />
              <span className="hidden sm:inline">{t("owner.contract", "Contrato")}</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2" data-testid="tab-support">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t("owner.support", "Mensajes")}</span>
              {unreadCount && unreadCount.unread > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs">
                  {unreadCount.unread > 9 ? '9+' : unreadCount.unread}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Hero Card - Payment Summary */}
              <Card className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-background border-green-500/20" data-testid="card-hero-income">
                <CardContent className="p-6">
                  {contractLoading || financialsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    </div>
                  ) : !contractInfo && !financials ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <TrendingUp className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">{t("owner.noIncomeData", "No hay informaci\u00f3n de ingresos disponible")}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          {t("owner.netIncomeThisMonth", "Ingreso Neto Este Mes")}
                        </p>
                        <div className="flex items-baseline gap-2" data-testid="text-net-income">
                          <span className="text-4xl font-bold text-green-600">
                            {financials?.currency || contractInfo?.currency || "MXN"} ${(financials?.netIncome ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-sm" data-testid="text-monthly-rent">
                              {t("owner.monthlyRent", "Renta")}: {contractInfo?.currency || "MXN"} ${(contractInfo?.monthlyRent ?? 0).toLocaleString()}
                            </span>
                          </div>
                          {pendingReceipts.length > 0 && (
                            <Badge variant="secondary" className="gap-1" data-testid="badge-pending-receipts">
                              <Receipt className="h-3 w-3" />
                              {pendingReceipts.length} {t("owner.pendingApproval", "por aprobar")}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={() => setActiveTab("payments")} data-testid="button-view-payments-hero">
                          <Eye className="mr-2 h-4 w-4" />
                          {t("owner.viewPayments", "Ver Pagos")}
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab("contract")} data-testid="button-view-contract-hero">
                          <ScrollText className="mr-2 h-4 w-4" />
                          {t("owner.viewContract", "Ver Contrato")}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card data-testid="card-stat-monthly-rent">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">{t("owner.monthlyRent", "Renta")}</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {contractLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : contractInfo ? (
                      <>
                        <div className="text-2xl font-bold" data-testid="text-stat-rent">${(contractInfo.monthlyRent ?? 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{t("owner.dueDay", "D\u00eda")} {contractInfo.paymentDay ?? 1}</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">N/A</p>
                    )}
                  </CardContent>
                </Card>

                <Card data-testid="card-stat-pending-receipts">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">{t("owner.pendingApproval", "Pendientes")}</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {receiptsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-yellow-600" data-testid="text-stat-pending">{pendingReceipts.length}</div>
                        <p className="text-xs text-muted-foreground">{t("owner.toReview", "por revisar")}</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card data-testid="card-stat-open-tickets">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">{t("owner.openTickets", "Tickets")}</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {ticketsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold" data-testid="text-stat-tickets">{tickets.filter((t) => t.status !== "resolved").length}</div>
                        <p className="text-xs text-muted-foreground">{t("owner.active", "activos")}</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card data-testid="card-stat-messages">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">{t("owner.messages", "Mensajes")}</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600" data-testid="text-stat-unread">{unreadCount?.unread ?? 0}</div>
                    <p className="text-xs text-muted-foreground">{t("owner.unread", "sin leer")}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t("owner.quickActions", "Acciones R\u00e1pidas")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setActiveTab("payments")}
                      data-testid="button-quick-payments"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span className="text-xs">{t("owner.reviewPayments", "Revisar Pagos")}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setActiveTab("maintenance")}
                      data-testid="button-quick-maintenance"
                    >
                      <Wrench className="h-5 w-5" />
                      <span className="text-xs">{t("owner.viewMaintenance", "Mantenimiento")}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setActiveTab("support")}
                      data-testid="button-quick-messages"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-xs">{t("owner.sendMessage", "Enviar Mensaje")}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setActiveTab("contract")}
                      data-testid="button-quick-contract"
                    >
                      <ScrollText className="h-5 w-5" />
                      <span className="text-xs">{t("owner.viewContract", "Ver Contrato")}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Property & Tenant Info Cards */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {t("owner.propertyDetails", "Propiedad")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {contractLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <div className="space-y-3">
                        <p className="font-medium">{contractInfo?.propertyTitle}</p>
                        {contractInfo?.propertyAddress && (
                          <p className="text-sm text-muted-foreground">{contractInfo.propertyAddress}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {contractInfo?.startDate && format(new Date(contractInfo.startDate), "d MMM yyyy", { locale: es })}
                            {" - "}
                            {contractInfo?.endDate && format(new Date(contractInfo.endDate), "d MMM yyyy", { locale: es })}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t("owner.tenantInfo", "Inquilino")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {contractLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <div className="space-y-2">
                        <p className="font-medium">{contractInfo?.tenantName}</p>
                        {contractInfo?.tenantEmail && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {contractInfo.tenantEmail}
                          </div>
                        )}
                        {contractInfo?.tenantPhone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {contractInfo.tenantPhone}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Portal 2.0 Payment Summary - Always shown */}
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>{t("owner.paymentSummary", "Payment Summary")}</CardTitle>
                  <CardDescription>{t("owner.paymentSummaryDesc", "Overview of payment activity")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentSummaryLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : paymentSummary ? (
                    <div className="grid gap-4 md:grid-cols-5">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{paymentSummary.currency} ${paymentSummary.totalDue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{t("owner.totalDue", "Total Due")}</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-green-500/10">
                        <p className="text-2xl font-bold text-green-600">{paymentSummary.currency} ${paymentSummary.totalPaid.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{t("owner.totalPaid", "Paid")}</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-primary/10">
                        <p className="text-2xl font-bold text-primary">{paymentSummary.currency} ${paymentSummary.totalVerified.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{t("owner.totalVerified", "Verified")}</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                        <p className="text-2xl font-bold text-yellow-600">{paymentSummary.pendingCount}</p>
                        <p className="text-xs text-muted-foreground">{t("owner.pendingVerification", "Awaiting Review")}</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-red-500/10">
                        <p className="text-2xl font-bold text-red-600">{paymentSummary.overdueCount}</p>
                        <p className="text-xs text-muted-foreground">{t("owner.overduePayments", "Overdue")}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <DollarSign className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">{t("owner.noPaymentData", "No payment data available")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{t("owner.paymentReceipts", "Payment Receipts")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("owner.reviewReceipts", "Review and confirm tenant payment receipts")}
                  </p>
                </div>
                <Dialog open={showChargeDialog} onOpenChange={setShowChargeDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="button-add-charge">
                      <DollarSign className="mr-2 h-4 w-4" />
                      {t("owner.addCharge", "Add Special Charge")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("owner.specialCharge", "Add Special Charge")}</DialogTitle>
                      <DialogDescription>
                        {t("owner.specialChargeDesc", "Add an extra charge to the tenant's account")}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...chargeForm}>
                      <form onSubmit={chargeForm.handleSubmit((data) => addChargeMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={chargeForm.control}
                          name="chargeType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("owner.chargeType", "Type")}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-charge-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="maintenance">{t("owner.maintenance", "Maintenance")}</SelectItem>
                                  <SelectItem value="utility">{t("owner.utility", "Utility")}</SelectItem>
                                  <SelectItem value="repair">{t("owner.repair", "Repair")}</SelectItem>
                                  <SelectItem value="other">{t("owner.other", "Other")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={chargeForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("owner.amount", "Amount")} ({contractInfo?.currency || "USD"})</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} data-testid="input-charge-amount" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={chargeForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("owner.description", "Description")}</FormLabel>
                              <FormControl>
                                <Textarea {...field} data-testid="input-charge-description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" disabled={addChargeMutation.isPending} data-testid="button-submit-charge">
                            {addChargeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("owner.addCharge", "Add Charge")}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {pendingReceipts.length > 0 && (
                <Card className="border-yellow-500/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <CardTitle className="text-base">{t("owner.pendingReview", "Pending Review")}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      {pendingReceipts.map((receipt) => (
                        <div key={receipt.id} className="flex items-center justify-between py-3 gap-4 flex-wrap" data-testid={`pending-receipt-${receipt.id}`}>
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                              <Receipt className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                              <p className="font-medium">{receipt.paymentMonth} {receipt.paymentYear}</p>
                              <p className="text-sm text-muted-foreground">
                                {receipt.currency} ${receipt.amount.toLocaleString()} - {receipt.tenantName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectReceiptMutation.mutate(receipt.id)}
                              disabled={rejectReceiptMutation.isPending}
                              data-testid={`button-reject-${receipt.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {t("owner.reject", "Reject")}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => confirmReceiptMutation.mutate(receipt.id)}
                              disabled={confirmReceiptMutation.isPending}
                              data-testid={`button-confirm-${receipt.id}`}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {t("owner.confirm", "Confirm")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>{t("owner.allReceipts", "All Receipts")}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {receiptsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : receipts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t("owner.noReceipts", "No payment receipts yet")}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {receipts.map((receipt) => (
                        <div key={receipt.id} className="flex items-center justify-between p-4 gap-4" data-testid={`receipt-row-${receipt.id}`}>
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <DollarSign className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{receipt.paymentMonth} {receipt.paymentYear}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(receipt.uploadedAt), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-medium">{receipt.currency} ${receipt.amount.toLocaleString()}</span>
                            {getStatusBadge(receipt.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("common.filters", "Filters")}:</span>
                </div>
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-payment-status-filter">
                    <SelectValue placeholder={t("common.status", "Status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.allStatuses", "All Statuses")}</SelectItem>
                    <SelectItem value="pending">{t("status.pending", "Pending")}</SelectItem>
                    <SelectItem value="paid">{t("status.paid", "Paid")}</SelectItem>
                    <SelectItem value="verified">{t("status.verified", "Verified")}</SelectItem>
                    <SelectItem value="overdue">{t("status.overdue", "Overdue")}</SelectItem>
                    <SelectItem value="rejected">{t("status.rejected", "Rejected")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentCategoryFilter} onValueChange={setPaymentCategoryFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-payment-category-filter">
                    <SelectValue placeholder={t("common.category", "Category")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.allCategories", "All Categories")}</SelectItem>
                    <SelectItem value="rent">{t("category.rent", "Rent")}</SelectItem>
                    <SelectItem value="utilities">{t("category.utilities", "Utilities")}</SelectItem>
                    <SelectItem value="maintenance">{t("category.maintenance", "Maintenance")}</SelectItem>
                    <SelectItem value="deposit">{t("category.deposit", "Deposit")}</SelectItem>
                    <SelectItem value="other">{t("category.other", "Other")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentYearFilter} onValueChange={setPaymentYearFilter}>
                  <SelectTrigger className="w-[120px]" data-testid="select-payment-year-filter">
                    <SelectValue placeholder={t("common.year", "Year")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.allYears", "All Years")}</SelectItem>
                    {[2025, 2024, 2023, 2022].map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(paymentStatusFilter !== "all" || paymentCategoryFilter !== "all" || paymentYearFilter !== "all") && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setPaymentStatusFilter("all");
                      setPaymentCategoryFilter("all");
                      setPaymentYearFilter("all");
                    }}
                    data-testid="button-clear-payment-filters"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t("common.clearFilters", "Clear")}
                  </Button>
                )}
              </div>

              {/* Portal 2.0 Payment Records with Verification Workflow - Always shown */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("owner.portal2Payments", "Payment Records")}</CardTitle>
                  <CardDescription>{t("owner.portal2PaymentsDesc", "View and verify all payment submissions")}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {portalPaymentsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (() => {
                    const filteredPayments = portalPayments.filter((payment) => {
                      if (paymentStatusFilter !== "all" && payment.status !== paymentStatusFilter) return false;
                      if (paymentCategoryFilter !== "all" && payment.category !== paymentCategoryFilter) return false;
                      if (paymentYearFilter !== "all") {
                        const paymentYear = new Date(payment.dueDate).getFullYear().toString();
                        if (paymentYear !== paymentYearFilter) return false;
                      }
                      return true;
                    });
                    
                    return filteredPayments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          {portalPayments.length === 0 
                            ? t("owner.noPaymentRecords", "No payment records yet")
                            : t("common.noMatchingRecords", "No matching records")}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredPayments.map((payment) => (
                          <div key={payment.id} className="p-4 space-y-3" data-testid={`payment-record-${payment.id}`}>
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <div className="flex items-center gap-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                  payment.status === 'paid' ? 'bg-green-500/10' :
                                  payment.status === 'verified' ? 'bg-primary/10' :
                                  payment.status === 'overdue' ? 'bg-red-500/10' :
                                  payment.status === 'rejected' ? 'bg-red-500/10' :
                                  'bg-yellow-500/10'
                                }`}>
                                  <DollarSign className={`h-5 w-5 ${
                                    payment.status === 'paid' ? 'text-green-500' :
                                    payment.status === 'verified' ? 'text-primary' :
                                    payment.status === 'overdue' || payment.status === 'rejected' ? 'text-red-500' :
                                    'text-yellow-500'
                                  }`} />
                                </div>
                                <div>
                                  <p className="font-medium capitalize">{payment.category.replace('_', ' ')}</p>
                                  {payment.description && (
                                    <p className="text-sm text-muted-foreground">{payment.description}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    {t("owner.dueDate", "Due")}: {format(new Date(payment.dueDate), "MMM d, yyyy")}
                                    {payment.datePaid && ` | ${t("owner.paidDate", "Paid")}: ${format(new Date(payment.datePaid), "MMM d, yyyy")}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="font-medium">{payment.currency} ${payment.amount.toLocaleString()}</span>
                                {getStatusBadge(payment.status)}
                              </div>
                            </div>
                            
                            {/* Tenant notes and receipt */}
                            {(payment.tenantNotes || payment.receiptUrl) && (
                              <div className="ml-14 p-3 rounded-lg bg-muted/50 text-sm">
                                {payment.tenantNotes && (
                                  <p className="text-muted-foreground">{t("owner.tenantNote", "Tenant note")}: {payment.tenantNotes}</p>
                                )}
                                {payment.receiptUrl && (
                                  <a 
                                    href={payment.receiptUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline mt-1"
                                    data-testid={`receipt-link-${payment.id}`}
                                  >
                                    <FileText className="h-4 w-4" />
                                    {payment.receiptFileName || t("owner.viewReceipt", "View Receipt")}
                                  </a>
                                )}
                              </div>
                            )}
                            
                            {/* Owner notes */}
                            {payment.ownerNotes && (
                              <div className="ml-14 p-3 rounded-lg bg-primary/5 text-sm">
                                <p className="text-muted-foreground">{t("owner.yourNote", "Your note")}: {payment.ownerNotes}</p>
                              </div>
                            )}
                            
                            {/* Verification actions for 'paid' payments */}
                            {payment.status === 'paid' && (
                              <div className="ml-14 flex items-center gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectPaymentMutation.mutate({ id: payment.id })}
                                  disabled={processingPaymentId !== null}
                                  data-testid={`button-reject-payment-${payment.id}`}
                                >
                                  {processingPaymentId === payment.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                                  {processingPaymentId !== payment.id && <XCircle className="h-4 w-4 mr-1" />}
                                  {t("owner.rejectPayment", "Reject")}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => verifyPaymentMutation.mutate({ id: payment.id })}
                                  disabled={processingPaymentId !== null}
                                  data-testid={`button-verify-payment-${payment.id}`}
                                >
                                  {processingPaymentId === payment.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                                  {processingPaymentId !== payment.id && <Check className="h-4 w-4 mr-1" />}
                                  {t("owner.verifyPayment", "Verify")}
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{t("owner.serviceAccounts", "Service Accounts")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("owner.serviceAccountsDesc", "Manage utility and service accounts for your property")}
                  </p>
                </div>
                <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-service">
                      <Zap className="mr-2 h-4 w-4" />
                      {t("owner.addService", "Add Service")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("owner.addServiceAccount", "Add Service Account")}</DialogTitle>
                      <DialogDescription>
                        {t("owner.addServiceAccountDesc", "Add a utility or service account for your property")}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...serviceForm}>
                      <form onSubmit={serviceForm.handleSubmit((data) => addServiceMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={serviceForm.control}
                          name="serviceType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("owner.serviceType", "Service Type")}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-service-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="electricity">{t("owner.electricity", "Electricity")}</SelectItem>
                                  <SelectItem value="water">{t("owner.water", "Water")}</SelectItem>
                                  <SelectItem value="gas">{t("owner.gas", "Gas")}</SelectItem>
                                  <SelectItem value="internet">{t("owner.internet", "Internet")}</SelectItem>
                                  <SelectItem value="other">{t("owner.other", "Other")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={serviceForm.control}
                          name="provider"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("owner.provider", "Provider")}</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-provider" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={serviceForm.control}
                          name="accountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("owner.accountNumber", "Account Number")}</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-account-number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" disabled={addServiceMutation.isPending} data-testid="button-submit-service">
                            {addServiceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("owner.addService", "Add Service")}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {servicesLoading ? (
                  <div className="col-span-full flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : serviceAccounts.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                      <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t("owner.noServices", "No service accounts added yet")}</p>
                    </CardContent>
                  </Card>
                ) : (
                  serviceAccounts.map((service) => (
                    <Card key={service.id} data-testid={`service-card-${service.id}`}>
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          {getServiceIcon(service.serviceType)}
                        </div>
                        <div>
                          <CardTitle className="text-base capitalize">{service.serviceType}</CardTitle>
                          <CardDescription>{service.provider}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("owner.account", "Account")}:</span>
                            <span className="font-medium">{service.accountNumber}</span>
                          </div>
                          {service.currentBalance !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t("owner.balance", "Balance")}:</span>
                              <span className="font-medium">${service.currentBalance.toLocaleString()}</span>
                            </div>
                          )}
                          {service.lastReadingDate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t("owner.lastReading", "Last Reading")}:</span>
                              <span className="font-medium">{format(new Date(service.lastReadingDate), "MMM d, yyyy")}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="maintenance">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">{t("owner.maintenanceReports", "Maintenance Reports")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("owner.maintenanceReportsDesc", "View and track maintenance issues reported by tenants")}
                </p>
              </div>

              <Card>
                <CardContent className="p-0">
                  {ticketsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t("owner.noTickets", "No maintenance requests")}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="p-4 space-y-3" data-testid={`ticket-row-${ticket.id}`}>
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">{ticket.type}</Badge>
                              <Badge variant={ticket.priority === "emergency" || ticket.priority === "high" ? "destructive" : "secondary"}>
                                {ticket.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(ticket.status)}
                              {ticket.estimatedCost && (
                                <Badge variant="outline">
                                  Est: ${ticket.estimatedCost.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm">{ticket.description}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{t("owner.created", "Created")}: {format(new Date(ticket.createdAt), "MMM d, yyyy")}</span>
                            {ticket.resolvedAt && (
                              <span>{t("owner.resolved", "Resolved")}: {format(new Date(ticket.resolvedAt), "MMM d, yyyy")}</span>
                            )}
                          </div>
                          {ticket.resolution && (
                            <div className="p-3 bg-muted rounded-md">
                              <p className="text-sm font-medium">{t("owner.resolution", "Resolution")}:</p>
                              <p className="text-sm text-muted-foreground">{ticket.resolution}</p>
                              {ticket.actualCost && (
                                <p className="text-sm mt-1">
                                  <span className="font-medium">{t("owner.actualCost", "Actual Cost")}:</span> ${ticket.actualCost.toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">{t("owner.contractDocuments", "Contract Documents")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("owner.contractDocumentsDesc", "Access rental contract and property documents")}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover-elevate cursor-pointer" data-testid="card-contract">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t("owner.rentalContract", "Rental Contract")}</p>
                      <p className="text-sm text-muted-foreground">{t("owner.signedCopy", "Signed copy")}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate cursor-pointer" data-testid="card-inventory">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t("owner.inventoryList", "Inventory List")}</p>
                      <p className="text-sm text-muted-foreground">{t("owner.propertyContents", "Property contents")}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate cursor-pointer" data-testid="card-checkin">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t("owner.checkInReport", "Check-in Report")}</p>
                      <p className="text-sm text-muted-foreground">{t("owner.moveInCondition", "Move-in condition")}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate cursor-pointer" data-testid="card-financial">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t("owner.financialReport", "Financial Report")}</p>
                      <p className="text-sm text-muted-foreground">{t("owner.incomeExpenses", "Income & expenses")}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Portal 2.0 Documents - Grouped by Type - Always shown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t("owner.sharedDocuments", "Shared Documents")}</h3>
                {portalDocumentsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : portalDocuments.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t("owner.noSharedDocuments", "No shared documents yet")}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Group documents by type */}
                    {Object.entries(
                      portalDocuments.reduce((acc, doc) => {
                        const type = doc.documentType || 'other';
                        if (!acc[type]) acc[type] = [];
                        acc[type].push(doc);
                        return acc;
                      }, {} as Record<string, PortalDocument[]>)
                    ).map(([type, docs]) => {
                      const documentTypeLabels: Record<string, string> = {
                        lease: t("documents.typeLeaseContract", "Lease Contract"),
                        contract: t("documents.typeContract", "Contract"),
                        invoice: t("documents.typeInvoice", "Invoice"),
                        receipt: t("documents.typeReceipt", "Receipt"),
                        maintenance: t("documents.typeMaintenance", "Maintenance"),
                        legal: t("documents.typeLegal", "Legal Documents"),
                        other: t("documents.typeOther", "Other Documents"),
                      };
                      const typeLabel = documentTypeLabels[type] || type.replace('_', ' ');
                      return (
                      <Card key={type}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">{typeLabel}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="divide-y">
                            {docs.map((doc) => (
                              <a 
                                key={doc.id} 
                                href={doc.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-4 hover-elevate"
                                data-testid={`doc-row-${doc.id}`}
                              >
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{doc.fileName}</p>
                                  {doc.description && (
                                    <p className="text-sm text-muted-foreground truncate">{doc.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{format(new Date(doc.createdAt), "MMM d, yyyy")}</span>
                                    <span>-</span>
                                    <span className="capitalize">{doc.uploadedByRole}</span>
                                    {doc.visibleToTenant && (
                                      <Badge variant="secondary" className="text-xs">{t("owner.visibleToTenant", "Visible to Tenant")}</Badge>
                                    )}
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contract">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">{t("owner.contractDetails", "Detalles del Contrato")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("owner.contractDetailsDesc", "Informaci\u00f3n del contrato de arrendamiento de tu propiedad")}
                </p>
              </div>

              {/* Contract Summary Hero */}
              <Card className="bg-gradient-to-br from-muted/50 to-background" data-testid="card-contract-summary">
                <CardContent className="p-6">
                  {contractLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : !contractInfo ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <ScrollText className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">{t("owner.noContractData", "No hay informaci\u00f3n de contrato disponible")}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ScrollText className="h-7 w-7 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{t("owner.rentalContract", "Contrato de Arrendamiento")}</h3>
                            <p className="text-sm text-muted-foreground" data-testid="text-contract-property">{contractInfo.propertyTitle || 'N/A'}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={contractInfo.status === 'active' ? 'default' : 'secondary'}
                          className="gap-1 text-sm py-1"
                          data-testid="badge-contract-status"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {contractInfo.status === 'active' ? t("contract.active", "Vigente") : contractInfo.status || 'N/A'}
                        </Badge>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="p-4 rounded-lg bg-background border" data-testid="card-contract-start-date">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("contract.startDate", "Fecha de Inicio")}</p>
                          <p className="text-lg font-semibold mt-1">
                            {contractInfo.startDate ? format(new Date(contractInfo.startDate), "d MMM yyyy", { locale: es }) : 'N/A'}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-background border" data-testid="card-contract-end-date">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("contract.endDate", "Fecha de T\u00e9rmino")}</p>
                          <p className="text-lg font-semibold mt-1">
                            {contractInfo.endDate ? format(new Date(contractInfo.endDate), "d MMM yyyy", { locale: es }) : 'N/A'}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-background border" data-testid="card-contract-rent">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("contract.monthlyRent", "Renta Mensual")}</p>
                          <p className="text-lg font-semibold mt-1">
                            {contractInfo.currency || 'MXN'} ${(contractInfo.monthlyRent ?? 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-background border" data-testid="card-contract-deposit">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("contract.deposit", "Dep\u00f3sito")}</p>
                          <p className="text-lg font-semibold mt-1">
                            {contractInfo.currency || 'MXN'} ${(contractInfo.depositAmount ?? 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <Button 
                          variant="outline" 
                          data-testid="button-download-contract"
                          disabled={!contractInfo.contractUrl}
                          title={!contractInfo.contractUrl ? t("contract.notAvailable", "Documento no disponible") : undefined}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {t("contract.downloadPDF", "Descargar Contrato")}
                        </Button>
                        <Button 
                          variant="outline" 
                          data-testid="button-download-inventory"
                          disabled={!contractInfo.inventoryUrl}
                          title={!contractInfo.inventoryUrl ? t("contract.notAvailable", "Documento no disponible") : undefined}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          {t("contract.inventory", "Inventario")}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tenant & Property Info */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {t("contract.property", "Propiedad")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{contractInfo?.propertyTitle}</p>
                    {contractInfo?.propertyAddress && (
                      <p className="text-sm text-muted-foreground">{contractInfo.propertyAddress}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t("contract.tenant", "Inquilino")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{contractInfo?.tenantName}</p>
                    {contractInfo?.tenantEmail && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {contractInfo.tenantEmail}
                      </div>
                    )}
                    {contractInfo?.tenantPhone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {contractInfo.tenantPhone}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Management Agency */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("contract.managedBy", "Administrado por")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <p className="font-medium">{contractInfo?.agencyName}</p>
                      {contractInfo?.agencyPhone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {contractInfo.agencyPhone}
                        </div>
                      )}
                      {contractInfo?.agencyEmail && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {contractInfo.agencyEmail}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" onClick={() => setActiveTab("support")} data-testid="button-contact-agency">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {t("contract.contactAgency", "Contactar Agencia")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="support">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">{t("owner.aiSupport", "AI Support Assistant")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("owner.aiSupportDesc", "Get instant help with questions about your property")}
                </p>
              </div>

              <Card className="h-[500px] flex flex-col">
                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-4">
                    {chatLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="font-medium">{t("owner.startConversation", "Start a Conversation")}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("owner.askAnything", "Ask anything about your property, payments, or maintenance")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.senderType === "owner" ? "justify-end" : "justify-start"}`}
                          >
                            {msg.senderType !== "owner" && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {msg.isAi ? "AI" : "S"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                msg.senderType === "owner"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {format(new Date(msg.sentAt), "h:mm a")}
                              </p>
                            </div>
                            {msg.senderType === "owner" && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                        placeholder={t("owner.typeMessage", "Type your message...")}
                        disabled={isSendingChat}
                        data-testid="input-chat"
                      />
                      <Button onClick={handleSendChat} disabled={isSendingChat || !chatInput.trim()} data-testid="button-send-chat">
                        {isSendingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
