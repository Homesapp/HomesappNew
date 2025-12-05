import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Home,
  FileText,
  CreditCard,
  Wrench,
  MessageSquare,
  LogOut,
  Calendar,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
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
  ExternalLink,
  ScrollText,
  Filter,
  Download,
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
  contractUrl?: string;
  inventoryUrl?: string;
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
  updates?: TicketUpdate[];
}

interface ChatMessage {
  id: number;
  senderType: string;
  message: string;
  sentAt: string;
  isAi?: boolean;
}

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

interface PortalDocument {
  id: string;
  contractId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  description?: string;
  uploadedByRole: string;
  createdAt: string;
}

interface PortalMessage {
  id: string;
  contractId: string;
  senderRole?: string;
  senderName?: string;
  messageType: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
}

interface TicketUpdate {
  id: string;
  ticketId: string;
  updateType: string;
  comment?: string;
  updatedByRole: string;
  updatedByName?: string;
  previousStatus?: string;
  newStatus?: string;
  attachmentUrl?: string;
  createdAt: string;
}

const receiptSchema = z.object({
  paymentMonth: z.string().min(1, "Month is required"),
  paymentYear: z.number().min(2020).max(2100),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  notes: z.string().optional(),
});

const maintenanceSchema = z.object({
  type: z.enum(["plumbing", "electrical", "hvac", "appliance", "structural", "pest", "other"]),
  priority: z.enum(["low", "medium", "high", "emergency"]),
  description: z.string().min(10, "Please provide a detailed description"),
});

const terminationSchema = z.object({
  reason: z.string().min(10, "Please explain your reason"),
  requestedDate: z.string().min(1, "Please select a date"),
});

export default function TenantPortal() {
  const [, setLocation] = useLocation();
  const { session, logout, isLoading: authLoading } = usePortalAuth();
  const { get, post } = usePortalApi();
  const { toast } = useToast();
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showTerminationDialog, setShowTerminationDialog] = useState(false);
  
  // Payment filters
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [paymentYearFilter, setPaymentYearFilter] = useState<string>("all");
  
  // Document filters
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>("all");

  const receiptForm = useForm<z.infer<typeof receiptSchema>>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      paymentMonth: format(new Date(), "MMMM"),
      paymentYear: new Date().getFullYear(),
      amount: 0,
      notes: "",
    },
  });

  const maintenanceForm = useForm<z.infer<typeof maintenanceSchema>>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      type: "other",
      priority: "medium",
      description: "",
    },
  });

  const terminationForm = useForm<z.infer<typeof terminationSchema>>({
    resolver: zodResolver(terminationSchema),
    defaultValues: {
      reason: "",
      requestedDate: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !session) {
      setLocation("/portal");
    }
    if (session && session.user.role !== "tenant") {
      setLocation("/portal/owner");
    }
  }, [session, authLoading, setLocation]);

  const { data: contractInfo, isLoading: contractLoading } = useQuery<ContractInfo>({
    queryKey: ["/api/portal/tenant/contract"],
    queryFn: () => get("/api/portal/tenant/contract"),
    enabled: !!session,
  });

  const { data: receipts = [], isLoading: receiptsLoading } = useQuery<PaymentReceipt[]>({
    queryKey: ["/api/portal/tenant/receipts"],
    queryFn: () => get("/api/portal/tenant/receipts"),
    enabled: !!session,
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<MaintenanceTicket[]>({
    queryKey: ["/api/portal/tenant/maintenance"],
    queryFn: () => get("/api/portal/tenant/maintenance"),
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
    refetchInterval: 30000, // Check every 30 seconds
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: (data: z.infer<typeof receiptSchema>) => post("/api/portal/tenant/receipts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tenant/receipts"] });
      toast({ title: t("tenant.receiptUploaded", "Receipt submitted successfully") });
      setShowReceiptDialog(false);
      receiptForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: t("common.error", "Error"), description: error.message, variant: "destructive" });
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: (data: z.infer<typeof maintenanceSchema>) => post("/api/portal/tenant/maintenance", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/tenant/maintenance"] });
      toast({ title: t("tenant.ticketCreated", "Maintenance request submitted") });
      setShowMaintenanceDialog(false);
      maintenanceForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: t("common.error", "Error"), description: error.message, variant: "destructive" });
    },
  });

  const requestTerminationMutation = useMutation({
    mutationFn: (data: z.infer<typeof terminationSchema>) => post("/api/portal/tenant/termination", data),
    onSuccess: () => {
      toast({ title: t("tenant.terminationRequested", "Termination request submitted") });
      setShowTerminationDialog(false);
      terminationForm.reset();
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

  const getNextPaymentDate = () => {
    if (!contractInfo) return null;
    const today = new Date();
    const paymentDay = contractInfo.paymentDay;
    const nextPayment = new Date(today.getFullYear(), today.getMonth(), paymentDay);
    if (nextPayment <= today) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }
    return nextPayment;
  };

  const getDaysUntilPayment = () => {
    const nextPayment = getNextPaymentDate();
    if (!nextPayment) return null;
    return differenceInDays(nextPayment, new Date());
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
      pending: { variant: "secondary", icon: Clock },
      approved: { variant: "default", icon: CheckCircle2 },
      rejected: { variant: "destructive", icon: XCircle },
      open: { variant: "secondary", icon: Clock },
      in_progress: { variant: "default", icon: Wrench },
      resolved: { variant: "default", icon: CheckCircle2 },
      // Portal 2.0 payment statuses
      paid: { variant: "default", icon: CheckCircle2 },
      verified: { variant: "default", icon: CheckCircle2 },
      overdue: { variant: "destructive", icon: AlertTriangle },
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
    };
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {labels[status] || status.replace("_", " ")}
      </Badge>
    );
  };

  if (authLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const daysUntilPayment = getDaysUntilPayment();
  const nextPaymentDate = getNextPaymentDate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{t("tenant.portal", "Portal del Inquilino")}</h1>
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
              <span className="hidden sm:inline">{t("common.logout", "Cerrar sesión")}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1" data-testid="tabs-navigation">
            <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tenant.overview", "Inicio")}</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2" data-testid="tab-payments">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tenant.payments", "Pagos")}</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-2" data-testid="tab-maintenance">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tenant.maintenance", "Mantenimiento")}</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2" data-testid="tab-documents">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tenant.documents", "Documentos")}</span>
            </TabsTrigger>
            <TabsTrigger value="contract" className="gap-2" data-testid="tab-contract">
              <ScrollText className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tenant.contract", "Contrato")}</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2" data-testid="tab-support">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t("tenant.support", "Mensajes")}</span>
              {unreadCount && unreadCount.unread > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs">
                  {unreadCount.unread > 9 ? '9+' : unreadCount.unread}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Hero Card - Next Payment */}
              <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20" data-testid="card-hero-payment">
                <CardContent className="p-6">
                  {contractLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !contractInfo ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <CreditCard className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">{t("tenant.noContractData", "No hay informaci\u00f3n de contrato disponible")}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          {t("tenant.nextRentPayment", "Pr\u00f3ximo Pago de Renta")}
                        </p>
                        <div className="flex items-baseline gap-2" data-testid="text-next-payment-amount">
                          <span className="text-4xl font-bold">{contractInfo.currency || "MXN"} ${(contractInfo.monthlyRent ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm" data-testid="text-next-payment-date">
                              {nextPaymentDate ? format(nextPaymentDate, "d 'de' MMMM, yyyy", { locale: es }) : t("tenant.noDate", "Sin fecha")}
                            </span>
                          </div>
                          {daysUntilPayment !== null && (
                            <Badge 
                              variant={daysUntilPayment <= 0 ? "destructive" : daysUntilPayment <= 5 ? "secondary" : "outline"}
                              className="gap-1"
                              data-testid="badge-days-until-payment"
                            >
                              {daysUntilPayment < 0 && <AlertTriangle className="h-3 w-3" />}
                              {daysUntilPayment === 0
                                ? t("tenant.dueToday", "Vence hoy")
                                : daysUntilPayment < 0
                                ? t("tenant.overdue", "Vencido")
                                : `${daysUntilPayment} ${t("tenant.daysLeft", "d\u00edas restantes")}`}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={() => setShowReceiptDialog(true)} data-testid="button-register-payment-hero">
                          <Upload className="mr-2 h-4 w-4" />
                          {t("tenant.registerPayment", "Registrar Pago")}
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab("contract")} data-testid="button-view-contract-hero">
                          <ScrollText className="mr-2 h-4 w-4" />
                          {t("tenant.viewContract", "Ver Contrato")}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card data-testid="card-stat-contract-status">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">{t("tenant.contractStatus", "Estado")}</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {contractLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : contractInfo ? (
                      <>
                        <Badge variant="default" className="gap-1" data-testid="badge-contract-status">
                          <CheckCircle2 className="h-3 w-3" />
                          {contractInfo.status === 'active' ? 'Vigente' : contractInfo.status || 'N/A'}
                        </Badge>
                        <p className="mt-2 text-xs text-muted-foreground" data-testid="text-contract-end-date">
                          {t("tenant.until", "Hasta")}: {contractInfo.endDate ? format(new Date(contractInfo.endDate), "dd/MM/yyyy") : 'N/A'}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">N/A</p>
                    )}
                  </CardContent>
                </Card>

                <Card data-testid="card-stat-open-tickets">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">{t("tenant.openTickets", "Tickets")}</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {ticketsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold" data-testid="text-open-tickets-count">
                          {tickets.filter((t) => t.status !== "resolved").length}
                        </div>
                        <p className="text-xs text-muted-foreground" data-testid="text-total-tickets-count">
                          {tickets.length} {t("tenant.total", "total")}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card data-testid="card-stat-pending-payments">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">{t("tenant.pendingPayments", "Pendientes")}</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {paymentSummaryLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-count">{paymentSummary?.pendingCount ?? 0}</div>
                        <p className="text-xs text-muted-foreground">{t("tenant.toRegister", "por registrar")}</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card data-testid="card-stat-messages">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">{t("tenant.messages", "Mensajes")}</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600" data-testid="text-unread-count">{unreadCount?.unread ?? 0}</div>
                    <p className="text-xs text-muted-foreground">{t("tenant.unread", "sin leer")}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t("tenant.quickActions", "Acciones R\u00e1pidas")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setShowReceiptDialog(true)}
                      data-testid="button-quick-register-payment"
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-xs">{t("tenant.registerPayment", "Registrar Pago")}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setShowMaintenanceDialog(true)}
                      data-testid="button-quick-report-issue"
                    >
                      <Wrench className="h-5 w-5" />
                      <span className="text-xs">{t("tenant.reportIssue", "Reportar Problema")}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setActiveTab("support")}
                      data-testid="button-quick-messages"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-xs">{t("tenant.sendMessage", "Enviar Mensaje")}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setActiveTab("contract")}
                      data-testid="button-quick-contract"
                    >
                      <ScrollText className="h-5 w-5" />
                      <span className="text-xs">{t("tenant.viewContract", "Ver Contrato")}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Portal 2.0 Payment Summary Card - Always shown */}
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("tenant.paymentSummary", "Payment Summary")}
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {paymentSummaryLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : paymentSummary ? (
                    <>
                      <div className="grid gap-4 md:grid-cols-5">
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold">{paymentSummary.currency} ${paymentSummary.totalDue.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{t("tenant.totalDue", "Total Due")}</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-green-500/10">
                          <p className="text-2xl font-bold text-green-600">{paymentSummary.currency} ${paymentSummary.totalPaid.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{t("tenant.totalPaid", "Paid")}</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-primary/10">
                          <p className="text-2xl font-bold text-primary">{paymentSummary.currency} ${paymentSummary.totalVerified.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{t("tenant.verified", "Verified")}</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                          <p className="text-2xl font-bold text-yellow-600">{paymentSummary.pendingCount}</p>
                          <p className="text-xs text-muted-foreground">{t("tenant.pendingPayments", "Pending")}</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-red-500/10">
                          <p className="text-2xl font-bold text-red-600">{paymentSummary.overdueCount}</p>
                          <p className="text-xs text-muted-foreground">{t("tenant.overduePayments", "Overdue")}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => setActiveTab("payments")}
                        data-testid="button-view-payments"
                      >
                        {t("tenant.viewPayments", "View Payments")}
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <CreditCard className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">{t("tenant.noPaymentData", "No payment data available")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Unread Messages Indicator */}
              {unreadCount && unreadCount.unread > 0 && (
                <Card className="md:col-span-2 lg:col-span-3 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">
                        {t("tenant.unreadMessages", `You have ${unreadCount.unread} unread message(s)`)}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab("support")}
                      data-testid="button-view-messages"
                    >
                      {t("tenant.viewMessages", "View Messages")}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle>{t("tenant.propertyDetails", "Property Details")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {contractLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{contractInfo?.propertyTitle}</span>
                        </div>
                        {contractInfo?.propertyAddress && (
                          <p className="text-sm text-muted-foreground pl-6">{contractInfo.propertyAddress}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium">{t("tenant.managedBy", "Managed by")}: {contractInfo?.agencyName}</p>
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
                  <h2 className="text-lg font-semibold">{t("tenant.paymentHistory", "Payment History")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("tenant.paymentHistoryDesc", "Upload your payment receipts for verification")}
                  </p>
                </div>
                <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-upload-receipt">
                      <Upload className="mr-2 h-4 w-4" />
                      {t("tenant.uploadReceipt", "Upload Receipt")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("tenant.submitReceipt", "Submit Payment Receipt")}</DialogTitle>
                      <DialogDescription>
                        {t("tenant.submitReceiptDesc", "Enter the details of your payment")}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...receiptForm}>
                      <form onSubmit={receiptForm.handleSubmit((data) => uploadReceiptMutation.mutate(data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={receiptForm.control}
                            name="paymentMonth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("tenant.month", "Month")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-month">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month) => (
                                      <SelectItem key={month} value={month}>{month}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={receiptForm.control}
                            name="paymentYear"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("tenant.year", "Year")}</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} data-testid="input-year" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={receiptForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("tenant.amount", "Amount")} ({contractInfo?.currency || "USD"})</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} data-testid="input-amount" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={receiptForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("tenant.notes", "Notes")} ({t("common.optional", "optional")})</FormLabel>
                              <FormControl>
                                <Textarea {...field} data-testid="input-notes" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" disabled={uploadReceiptMutation.isPending} data-testid="button-submit-receipt">
                            {uploadReceiptMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("tenant.submit", "Submit")}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

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
                {(paymentStatusFilter !== "all" || paymentYearFilter !== "all") && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setPaymentStatusFilter("all");
                      setPaymentYearFilter("all");
                    }}
                    data-testid="button-clear-payment-filters"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t("common.clearFilters", "Clear")}
                  </Button>
                )}
              </div>

              {/* Portal 2.0 Payment Records - Always shown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t("tenant.scheduledPayments", "Scheduled Payments")}</CardTitle>
                  <CardDescription>
                    {t("tenant.scheduledPaymentsDesc", "Track your upcoming and completed payments")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {portalPaymentsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (() => {
                    const filteredPayments = portalPayments.filter((payment) => {
                      if (paymentStatusFilter !== "all" && payment.status !== paymentStatusFilter) return false;
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
                            ? t("tenant.noScheduledPayments", "No scheduled payments")
                            : t("common.noMatchingRecords", "No matching records")}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 gap-4 flex-wrap" data-testid={`payment-row-${payment.id}`}>
                          <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              payment.status === 'overdue' ? 'bg-destructive/10' : 
                              payment.status === 'verified' ? 'bg-green-500/10' : 
                              'bg-primary/10'
                            }`}>
                              <DollarSign className={`h-5 w-5 ${
                                payment.status === 'overdue' ? 'text-destructive' : 
                                payment.status === 'verified' ? 'text-green-600' : 
                                'text-primary'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium">{payment.category}</p>
                              {payment.description && (
                                <p className="text-sm text-muted-foreground">{payment.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {t("tenant.dueDate", "Due")}: {format(new Date(payment.dueDate), "MMM d, yyyy", { locale: locale === "es" ? es : undefined })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-medium">{payment.currency} ${payment.amount.toLocaleString()}</span>
                            {getStatusBadge(payment.status)}
                          </div>
                        </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Existing Receipts Section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t("tenant.uploadedReceipts", "Uploaded Receipts")}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {receiptsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : receipts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t("tenant.noReceipts", "No payment receipts yet")}</p>
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
            </div>
          </TabsContent>

          <TabsContent value="maintenance">
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{t("tenant.maintenanceRequests", "Maintenance Requests")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("tenant.maintenanceDesc", "Report issues with your property")}
                  </p>
                </div>
                <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-new-ticket">
                      <Wrench className="mr-2 h-4 w-4" />
                      {t("tenant.newRequest", "New Request")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("tenant.reportIssue", "Report an Issue")}</DialogTitle>
                      <DialogDescription>
                        {t("tenant.reportIssueDesc", "Describe the maintenance issue you're experiencing")}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...maintenanceForm}>
                      <form onSubmit={maintenanceForm.handleSubmit((data) => createTicketMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={maintenanceForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("tenant.issueType", "Issue Type")}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="plumbing">{t("tenant.plumbing", "Plumbing")}</SelectItem>
                                  <SelectItem value="electrical">{t("tenant.electrical", "Electrical")}</SelectItem>
                                  <SelectItem value="hvac">{t("tenant.hvac", "HVAC/Air Conditioning")}</SelectItem>
                                  <SelectItem value="appliance">{t("tenant.appliance", "Appliance")}</SelectItem>
                                  <SelectItem value="structural">{t("tenant.structural", "Structural")}</SelectItem>
                                  <SelectItem value="pest">{t("tenant.pest", "Pest Control")}</SelectItem>
                                  <SelectItem value="other">{t("tenant.other", "Other")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={maintenanceForm.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("tenant.priority", "Priority")}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-priority">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">{t("tenant.low", "Low")}</SelectItem>
                                  <SelectItem value="medium">{t("tenant.medium", "Medium")}</SelectItem>
                                  <SelectItem value="high">{t("tenant.high", "High")}</SelectItem>
                                  <SelectItem value="emergency">{t("tenant.emergency", "Emergency")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={maintenanceForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("tenant.description", "Description")}</FormLabel>
                              <FormControl>
                                <Textarea rows={4} {...field} data-testid="input-description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" disabled={createTicketMutation.isPending} data-testid="button-submit-ticket">
                            {createTicketMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("tenant.submit", "Submit")}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
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
                      <p className="text-muted-foreground">{t("tenant.noTickets", "No maintenance requests")}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="p-4 space-y-3" data-testid={`ticket-row-${ticket.id}`}>
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{ticket.type}</Badge>
                              <Badge variant={ticket.priority === "emergency" ? "destructive" : ticket.priority === "high" ? "destructive" : "secondary"}>
                                {ticket.priority}
                              </Badge>
                            </div>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <p className="text-sm">{ticket.description}</p>
                          
                          {/* Timeline of updates */}
                          <div className="mt-3 ml-2 border-l-2 border-muted pl-4 space-y-3">
                            {/* Created event */}
                            <div className="relative">
                              <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary" />
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a", { locale: locale === "es" ? es : undefined })}
                                </span>
                              </div>
                              <p className="text-sm font-medium mt-1">{t("tenant.ticketCreated", "Ticket created")}</p>
                            </div>
                            
                            {/* Updates from API */}
                            {ticket.updates?.map((update, idx) => (
                              <div key={update.id} className="relative" data-testid={`ticket-update-${update.id}`}>
                                <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ${
                                  update.updateType === 'status_change' ? 'bg-blue-500' :
                                  update.updateType === 'comment' ? 'bg-green-500' :
                                  update.updateType === 'resolved' ? 'bg-primary' :
                                  'bg-muted-foreground'
                                }`} />
                                <div className="flex items-center gap-2">
                                  {update.updateType === 'status_change' && <Info className="h-3 w-3 text-blue-500" />}
                                  {update.updateType === 'comment' && <MessageSquare className="h-3 w-3 text-green-500" />}
                                  {update.updateType === 'resolved' && <CheckCircle2 className="h-3 w-3 text-primary" />}
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(update.createdAt), "MMM d, yyyy 'at' h:mm a", { locale: locale === "es" ? es : undefined })}
                                  </span>
                                  {update.updatedByName && (
                                    <Badge variant="outline" className="text-xs h-5">
                                      {update.updatedByName}
                                    </Badge>
                                  )}
                                </div>
                                {update.updateType === 'status_change' && update.previousStatus && update.newStatus && (
                                  <p className="text-sm mt-1">
                                    {t("tenant.statusChanged", "Status changed")}: 
                                    <span className="text-muted-foreground ml-1">{update.previousStatus}</span>
                                    <span className="mx-1">→</span>
                                    <span className="font-medium">{update.newStatus}</span>
                                  </p>
                                )}
                                {update.comment && (
                                  <p className="text-sm mt-1 text-muted-foreground">{update.comment}</p>
                                )}
                                {update.attachmentUrl && (
                                  <a 
                                    href={update.attachmentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                                  >
                                    <FileText className="h-3 w-3" />
                                    {t("tenant.viewAttachment", "View attachment")}
                                  </a>
                                )}
                              </div>
                            ))}
                            
                            {/* Resolution event */}
                            {ticket.resolution && (
                              <div className="relative">
                                <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-green-600" />
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  <span className="text-xs text-muted-foreground">
                                    {ticket.resolvedAt ? format(new Date(ticket.resolvedAt), "MMM d, yyyy 'at' h:mm a", { locale: locale === "es" ? es : undefined }) : t("tenant.resolved", "Resolved")}
                                  </span>
                                </div>
                                <p className="text-sm font-medium mt-1">{t("tenant.ticketResolved", "Ticket resolved")}</p>
                                <p className="text-sm text-muted-foreground mt-1">{ticket.resolution}</p>
                              </div>
                            )}
                          </div>
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
                <h2 className="text-lg font-semibold">{t("tenant.contractDocuments", "Contract Documents")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("tenant.contractDocumentsDesc", "Access your rental contract and related documents")}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover-elevate cursor-pointer" data-testid="card-contract">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t("tenant.rentalContract", "Rental Contract")}</p>
                      <p className="text-sm text-muted-foreground">{t("tenant.signedCopy", "Signed copy")}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate cursor-pointer" data-testid="card-inventory">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t("tenant.inventoryList", "Inventory List")}</p>
                      <p className="text-sm text-muted-foreground">{t("tenant.propertyContents", "Property contents")}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate cursor-pointer" data-testid="card-checkin">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t("tenant.checkInReport", "Check-in Report")}</p>
                      <p className="text-sm text-muted-foreground">{t("tenant.moveInCondition", "Move-in condition")}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Portal 2.0 Documents - Grouped by Type - Always shown */}
              <Separator />
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">{t("tenant.sharedDocuments", "Shared Documents")}</h3>
                  
                  {/* Document Filters */}
                  {portalDocuments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Select 
                        value={documentTypeFilter} 
                        onValueChange={setDocumentTypeFilter}
                      >
                        <SelectTrigger 
                          className="w-[160px] h-9" 
                          data-testid="select-document-type"
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder={t("documents.filterByType", "Filter by type")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("common.allTypes", "All Types")}</SelectItem>
                          <SelectItem value="lease">{t("documents.typeLeaseContract", "Lease Contract")}</SelectItem>
                          <SelectItem value="contract">{t("documents.typeContract", "Contract")}</SelectItem>
                          <SelectItem value="invoice">{t("documents.typeInvoice", "Invoice")}</SelectItem>
                          <SelectItem value="receipt">{t("documents.typeReceipt", "Receipt")}</SelectItem>
                          <SelectItem value="maintenance">{t("documents.typeMaintenance", "Maintenance")}</SelectItem>
                          <SelectItem value="legal">{t("documents.typeLegal", "Legal")}</SelectItem>
                          <SelectItem value="other">{t("documents.typeOther", "Other")}</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {documentTypeFilter !== "all" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDocumentTypeFilter("all")}
                          data-testid="button-doc-filter-reset"
                        >
                          <X className="h-4 w-4 mr-1" />
                          {t("common.clear", "Clear")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                {portalDocumentsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : portalDocuments.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t("tenant.noSharedDocuments", "No shared documents yet")}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Group documents by type with filter applied */}
                    {(() => {
                      const filteredDocs = documentTypeFilter === "all" 
                        ? portalDocuments 
                        : portalDocuments.filter(doc => (doc.documentType || 'other') === documentTypeFilter);
                      
                      if (filteredDocs.length === 0) {
                        return (
                          <Card>
                            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                              <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">{t("documents.noMatchingDocuments", "No documents match your filter")}</p>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      const documentTypeLabels: Record<string, string> = {
                        lease: t("documents.typeLeaseContract", "Lease Contract"),
                        contract: t("documents.typeContract", "Contract"),
                        invoice: t("documents.typeInvoice", "Invoice"),
                        receipt: t("documents.typeReceipt", "Receipt"),
                        maintenance: t("documents.typeMaintenance", "Maintenance"),
                        legal: t("documents.typeLegal", "Legal Documents"),
                        other: t("documents.typeOther", "Other Documents"),
                      };
                      
                      return Object.entries(
                        filteredDocs.reduce((acc, doc) => {
                          const type = doc.documentType || 'other';
                          if (!acc[type]) acc[type] = [];
                          acc[type].push(doc);
                          return acc;
                        }, {} as Record<string, PortalDocument[]>)
                      ).map(([type, docs]) => {
                        const typeLabel = documentTypeLabels[type] || type.replace('_', ' ');
                        return (
                          <Card key={type}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-sm font-medium">{typeLabel}</CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                  {docs.length} {docs.length === 1 ? t("common.document", "doc") : t("common.documents", "docs")}
                                </Badge>
                              </div>
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
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium truncate">{doc.fileName}</p>
                                        {/* Visibility chip */}
                                        <Badge 
                                          variant="outline" 
                                          className="text-xs h-5 gap-1"
                                        >
                                          {doc.uploadedByRole === 'tenant' ? (
                                            <>
                                              <User className="h-3 w-3" />
                                              {t("documents.uploadedByYou", "You")}
                                            </>
                                          ) : (
                                            <>
                                              <Building className="h-3 w-3" />
                                              {t("documents.uploadedByAgency", "Agency")}
                                            </>
                                          )}
                                        </Badge>
                                      </div>
                                      {doc.description && (
                                        <p className="text-sm text-muted-foreground truncate">{doc.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(doc.createdAt), "MMM d, yyyy", { locale: locale === "es" ? es : undefined })}
                                        {doc.fileSize && (
                                          <>
                                            <span className="text-muted-foreground/50">|</span>
                                            <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <Download className="h-4 w-4 text-muted-foreground" />
                                  </a>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

            </div>
          </TabsContent>

          <TabsContent value="contract">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">{t("tenant.contractDetails", "Detalles del Contrato")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("tenant.contractDetailsDesc", "Informaci\u00f3n de tu contrato de arrendamiento")}
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
                      <p className="text-muted-foreground">{t("tenant.noContractData", "No hay informaci\u00f3n de contrato disponible")}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ScrollText className="h-7 w-7 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{t("tenant.rentalContract", "Contrato de Arrendamiento")}</h3>
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

              {/* Property & Agency Info */}
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
                      <User className="h-4 w-4" />
                      {t("contract.managedBy", "Administrado por")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
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
                  </CardContent>
                </Card>
              </div>

              {/* Early Termination */}
              <Card className="border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/50 dark:bg-yellow-900/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    {t("tenant.earlyTermination", "Terminaci\u00f3n Anticipada")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("tenant.terminationDesc", "Solicita terminar tu contrato antes de tiempo. Esto puede implicar cargos adicionales seg\u00fan las condiciones de tu contrato.")}
                  </p>
                  <Dialog open={showTerminationDialog} onOpenChange={setShowTerminationDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" data-testid="button-request-termination">
                        {t("tenant.requestTermination", "Solicitar Terminaci\u00f3n")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("tenant.terminationRequest", "Solicitud de Terminaci\u00f3n")}</DialogTitle>
                        <DialogDescription>
                          {t("tenant.terminationRequestDesc", "Proporciona los detalles de tu solicitud")}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...terminationForm}>
                        <form onSubmit={terminationForm.handleSubmit((data) => requestTerminationMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={terminationForm.control}
                            name="requestedDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("tenant.requestedMoveOut", "Fecha de Salida Solicitada")}</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-termination-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={terminationForm.control}
                            name="reason"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("tenant.reason", "Motivo")}</FormLabel>
                                <FormControl>
                                  <Textarea rows={4} {...field} data-testid="input-termination-reason" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="submit" disabled={requestTerminationMutation.isPending} data-testid="button-submit-termination">
                              {requestTerminationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {t("tenant.submit", "Enviar")}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="support">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">{t("tenant.aiSupport", "AI Support Assistant")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("tenant.aiSupportDesc", "Get instant help with questions about your rental")}
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
                        <p className="font-medium">{t("tenant.startConversation", "Start a Conversation")}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("tenant.askAnything", "Ask anything about your rental, payments, or maintenance")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.senderType === "tenant" ? "justify-end" : "justify-start"}`}
                          >
                            {msg.senderType !== "tenant" && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {msg.isAi ? "AI" : "S"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                msg.senderType === "tenant"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {format(new Date(msg.sentAt), "h:mm a")}
                              </p>
                            </div>
                            {msg.senderType === "tenant" && (
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
                        placeholder={t("tenant.typeMessage", "Type your message...")}
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
