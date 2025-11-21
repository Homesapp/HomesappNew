import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Home, DollarSign, Wrench, Calendar, CheckCircle2, Clock, AlertCircle, Plus, Upload, X, MessageSquare, Send, ExternalLink, Zap, Droplet, Wifi, Flame, Eye, FileText, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import { formatDistanceToNow } from "date-fns";
import type { ChatConversation, ChatMessage } from "@shared/schema";

interface ActiveRental {
  id: string;
  propertyId: string;
  rentalType?: string;
  monthlyRent: string;
  depositAmount?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  checkInDate?: string;
  status: string;
  includedServices?: string[]; // Lista de servicios: ["electricity", "water", "internet", "gas"]
  // Property information
  propertyTitle?: string;
  propertyType?: string;
  unitType?: string;
  condominiumId?: string;
  condoName?: string;
  unitNumber?: string;
}

interface RentalPayment {
  id: string;
  rentalContractId: string;
  tenantId: string;
  serviceType: string; // rent, electricity, water, internet, gas, maintenance, other
  amount: string;
  dueDate: string;
  paymentDate?: string;
  status: string;
  paymentProof?: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

interface MaintenanceRequest {
  id: string;
  rentalContractId: string;
  tenantId: string;
  ownerId: string;
  propertyId: string;
  title: string;
  description: string;
  urgency: string;
  status: string;
  requestedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  estimatedCost?: string;
  actualCost?: string;
  resolvedNotes?: string;
  createdAt: string;
}

const maintenanceRequestSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  urgency: z.enum(["low", "medium", "high", "emergency"]),
  photoData: z.string().optional(),
});

export default function ActiveRentals() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRental, setSelectedRental] = useState<string | null>(null);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<RentalPayment | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [problemPhotoFile, setProblemPhotoFile] = useState<{ name: string; data: string } | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Payment history pagination & sorting
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPerPage, setPaymentsPerPage] = useState(10);
  const [paymentsSortColumn, setPaymentsSortColumn] = useState<string>("");
  const [paymentsSortDirection, setPaymentsSortDirection] = useState<"asc" | "desc">("asc");
  const [currentServiceType, setCurrentServiceType] = useState<string>("rent");

  // Maintenance requests pagination & sorting
  const [maintenancePage, setMaintenancePage] = useState(1);
  const [maintenancePerPage, setMaintenancePerPage] = useState(10);
  const [maintenanceSortColumn, setMaintenanceSortColumn] = useState<string>("createdAt");
  const [maintenanceSortDirection, setMaintenanceSortDirection] = useState<"asc" | "desc">("desc");

  // Reset payments page when items per page changes
  useEffect(() => {
    setPaymentsPage(1);
  }, [paymentsPerPage]);
  
  // Handler for service type change - resets page synchronously
  const handleServiceTypeChange = (serviceType: string) => {
    setCurrentServiceType(serviceType);
    setPaymentsPage(1);
  };

  // Handler for maintenance per page change - resets page synchronously
  const handleMaintenancePerPageChange = (value: string) => {
    setMaintenancePerPage(Number(value));
    setMaintenancePage(1);
  };

  const isOwner = user?.role === "owner";
  const rentalsEndpoint = isOwner ? "/api/owner/active-rentals" : "/api/rentals/active";

  const { data: rentals = [], isLoading: rentalsLoading } = useQuery<ActiveRental[]>({
    queryKey: [rentalsEndpoint],
  });

  // Obtener contratos en proceso del cliente
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ["/api/rental-contracts", { tenantId: user?.id, statuses: "draft,apartado,firmado,check_in" }],
    queryFn: async () => {
      const params = new URLSearchParams({
        tenantId: user?.id || "",
      });
      const response = await fetch(`/api/rental-contracts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch contracts");
      const allContracts = await response.json();
      // Filtrar solo contratos en proceso (no activos ni completados)
      return allContracts.filter((c: any) => 
        ["draft", "apartado", "firmado", "check_in"].includes(c.status)
      );
    },
    enabled: !!user?.id && !isOwner,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<RentalPayment[]>({
    queryKey: ["/api/rentals", selectedRental, "payments"],
    queryFn: async () => {
      const response = await fetch(`/api/rentals/${selectedRental}/payments`);
      if (!response.ok) throw new Error("Failed to fetch payments");
      return response.json();
    },
    enabled: !!selectedRental,
  });

  const { data: maintenanceRequests = [], isLoading: maintenanceLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ["/api/rentals", selectedRental, "maintenance-requests"],
    enabled: !!selectedRental,
  });

  // Chat conversation and messages
  const { data: chatConversation } = useQuery<ChatConversation>({
    queryKey: ["/api/rentals", selectedRental, "chat-conversation"],
    enabled: !!selectedRental,
  });

  const { data: chatMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/conversations", chatConversation?.id, "messages"],
    enabled: !!chatConversation?.id,
  });

  // Connect to WebSocket for real-time chat updates
  useChatWebSocket(chatConversation?.id || null);

  const maintenanceForm = useForm({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      urgency: "medium" as const,
    },
  });

  const createMaintenanceRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof maintenanceRequestSchema>) => {
      if (!selectedRental) throw new Error("No rental selected");
      return await apiRequest("POST", `/api/rentals/${selectedRental}/maintenance-request`, data);
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "Solicitud enviada" : "Request sent",
        description: language === "es"
          ? "Tu solicitud de mantenimiento ha sido enviada al propietario"
          : "Your maintenance request has been sent to the owner",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rentals", selectedRental, "maintenance-requests"] });
      setShowMaintenanceDialog(false);
      maintenanceForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es"
          ? "No se pudo enviar la solicitud"
          : "Could not send request"),
        variant: "destructive",
      });
    },
  });

  const registerPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPayment) throw new Error("No payment selected");
      
      const formData = new FormData();
      if (paymentProofFile) {
        formData.append('proof', paymentProofFile);
      }
      
      const response = await fetch(`/api/rentals/payments/${selectedPayment.id}/register`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register payment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "Pago registrado" : "Payment registered",
        description: language === "es"
          ? "Tu pago ha sido registrado exitosamente"
          : "Your payment has been registered successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rentals", selectedRental, "payments"] });
      setShowPaymentDialog(false);
      setSelectedPayment(null);
      setPaymentProofFile(null);
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es"
          ? "No se pudo registrar el pago"
          : "Could not register payment"),
        variant: "destructive",
      });
    },
  });

  const sendChatMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string; message: string; senderId: string }) => {
      return await apiRequest("POST", `/api/chat/messages`, data);
    },
    onSuccess: () => {
      setChatMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", chatConversation?.id, "messages"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es"
          ? "No se pudo enviar el mensaje"
          : "Could not send message"),
        variant: "destructive",
      });
    },
  });

  const handleProblemPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" 
          ? "Solo se permiten imágenes" 
          : "Only images are allowed",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" 
          ? "La imagen no debe superar los 10MB" 
          : "Image must not exceed 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProblemPhotoFile({
        name: file.name,
        data: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const onSubmitMaintenanceRequest = (data: z.infer<typeof maintenanceRequestSchema>) => {
    const submitData = {
      ...data,
      photoData: problemPhotoFile?.data,
    };
    createMaintenanceRequestMutation.mutate(submitData);
  };

  // Auto-select first rental when rentals load
  useEffect(() => {
    if (rentals.length > 0 && !selectedRental) {
      setSelectedRental(rentals[0].id);
    }
    // Reset selected rental if it's no longer in the list
    if (selectedRental && !rentals.find(r => r.id === selectedRental)) {
      setSelectedRental(rentals.length > 0 ? rentals[0].id : null);
    }
  }, [rentals, selectedRental]);

  // Clean up problem photo when dialog closes
  useEffect(() => {
    if (!showMaintenanceDialog) {
      setProblemPhotoFile(null);
      maintenanceForm.reset();
    }
  }, [showMaintenanceDialog, maintenanceForm]);

  // Auto-scroll to bottom when new chat messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChatMessage = () => {
    if (!chatMessage.trim() || !chatConversation?.id || !user?.id) return;
    
    sendChatMessageMutation.mutate({
      conversationId: chatConversation.id,
      message: chatMessage.trim(),
      senderId: user.id,
    });
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (rentalsLoading || contractsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const currentRental = rentals.find(r => r.id === selectedRental);

  const getContractStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Borrador", variant: "secondary" as const },
      apartado: { label: "Apartado", variant: "default" as const },
      firmado: { label: "Firmado", variant: "default" as const },
      check_in: { label: "Check-in Pendiente", variant: "default" as const },
      activo: { label: "Activo", variant: "default" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getContractProgress = (contract: any) => {
    const steps = {
      draft: { step: 1, total: 5, message: "Completa tu información de inquilino" },
      apartado: { step: 2, total: 5, message: "Esperando revisión de documentos" },
      firmado: { step: 3, total: 5, message: "Contrato firmado, agenda check-in" },
      check_in: { step: 4, total: 5, message: "Completar check-in" },
      activo: { step: 5, total: 5, message: "Contrato activo" },
    };
    return steps[contract.status as keyof typeof steps] || steps.draft;
  };

  // Get sorted payments for current service type
  const currentServicePayments = useMemo(() => {
    const servicePayments = payments.filter(p => p.serviceType === currentServiceType);
    
    return [...servicePayments].sort((a, b) => {
      if (!paymentsSortColumn) return 0;
      
      let aVal: any = (a as any)[paymentsSortColumn];
      let bVal: any = (b as any)[paymentsSortColumn];
      
      // Handle date columns
      if (paymentsSortColumn === 'dueDate' || paymentsSortColumn === 'paymentDate') {
        if (!aVal) return paymentsSortDirection === "asc" ? 1 : -1;
        if (!bVal) return paymentsSortDirection === "asc" ? -1 : 1;
        const aTime = new Date(aVal).getTime();
        const bTime = new Date(bVal).getTime();
        return paymentsSortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }
      
      // Handle numeric columns
      if (paymentsSortColumn === 'amount') {
        const aNum = parseFloat(aVal || '0');
        const bNum = parseFloat(bVal || '0');
        return paymentsSortDirection === "asc" ? aNum - bNum : bNum - aNum;
      }
      
      // Handle string columns
      if (typeof aVal === "string" || typeof bVal === "string") {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }
      
      if (aVal < bVal) return paymentsSortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return paymentsSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [payments, currentServiceType, paymentsSortColumn, paymentsSortDirection]);

  // Clamp payments page when data length changes
  useEffect(() => {
    if (currentServicePayments.length === 0) {
      setPaymentsPage(1);
      return;
    }
    const maxPage = Math.ceil(currentServicePayments.length / paymentsPerPage) || 1;
    if (paymentsPage > maxPage) {
      setPaymentsPage(maxPage);
    }
  }, [currentServicePayments.length, paymentsPerPage]);

  // Helper function to get paginated payments for a service type
  const getPaginatedPayments = (serviceType: string) => {
    // For the current service type, use memoized sorted data
    // For other service types, compute on the fly (they're only used for tabs, not rendering)
    let sortedPayments: RentalPayment[];
    
    if (serviceType === currentServiceType) {
      sortedPayments = currentServicePayments;
    } else {
      const servicePayments = payments.filter(p => p.serviceType === serviceType);
      sortedPayments = [...servicePayments].sort((a, b) => {
        if (!paymentsSortColumn) return 0;
        
        let aVal: any = (a as any)[paymentsSortColumn];
        let bVal: any = (b as any)[paymentsSortColumn];
        
        if (paymentsSortColumn === 'dueDate' || paymentsSortColumn === 'paymentDate') {
          if (!aVal) return paymentsSortDirection === "asc" ? 1 : -1;
          if (!bVal) return paymentsSortDirection === "asc" ? -1 : 1;
          const aTime = new Date(aVal).getTime();
          const bTime = new Date(bVal).getTime();
          return paymentsSortDirection === "asc" ? aTime - bTime : bTime - aTime;
        }
        
        if (paymentsSortColumn === 'amount') {
          const aNum = parseFloat(aVal || '0');
          const bNum = parseFloat(bVal || '0');
          return paymentsSortDirection === "asc" ? aNum - bNum : bNum - aNum;
        }
        
        if (typeof aVal === "string" || typeof bVal === "string") {
          aVal = (aVal || '').toString().toLowerCase();
          bVal = (bVal || '').toString().toLowerCase();
        }
        
        if (aVal < bVal) return paymentsSortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return paymentsSortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    
    const totalPages = Math.ceil(sortedPayments.length / paymentsPerPage) || 1;
    const paginatedPayments = sortedPayments.slice((paymentsPage - 1) * paymentsPerPage, paymentsPage * paymentsPerPage);
    
    return { paginatedPayments, totalPages, totalCount: sortedPayments.length };
  };

  const handlePaymentsSort = (column: string) => {
    if (paymentsSortColumn === column) {
      setPaymentsSortDirection(paymentsSortDirection === "asc" ? "desc" : "asc");
    } else {
      setPaymentsSortColumn(column);
      setPaymentsSortDirection("asc");
    }
  };

  // Sorted and paginated maintenance requests
  const sortedMaintenanceRequests = useMemo(() => {
    if (!maintenanceSortColumn) return maintenanceRequests;

    return [...maintenanceRequests].sort((a, b) => {
      let aVal: any = (a as any)[maintenanceSortColumn];
      let bVal: any = (b as any)[maintenanceSortColumn];

      // Handle date fields
      if (maintenanceSortColumn === 'createdAt' || maintenanceSortColumn === 'requestedDate' || maintenanceSortColumn === 'completedDate') {
        if (!aVal) return maintenanceSortDirection === "asc" ? 1 : -1;
        if (!bVal) return maintenanceSortDirection === "asc" ? -1 : 1;
        const aTime = new Date(aVal).getTime();
        const bTime = new Date(bVal).getTime();
        return maintenanceSortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }

      // Handle string fields
      if (typeof aVal === "string" || typeof bVal === "string") {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (aVal < bVal) return maintenanceSortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return maintenanceSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [maintenanceRequests, maintenanceSortColumn, maintenanceSortDirection]);

  const maintenanceTotalPages = Math.ceil(sortedMaintenanceRequests.length / maintenancePerPage) || 1;
  const paginatedMaintenanceRequests = sortedMaintenanceRequests.slice(
    (maintenancePage - 1) * maintenancePerPage,
    maintenancePage * maintenancePerPage
  );

  // Clamp maintenance page if it exceeds total pages
  useEffect(() => {
    if (maintenancePage > maintenanceTotalPages && maintenanceTotalPages > 0) {
      setMaintenancePage(maintenanceTotalPages);
    }
  }, [maintenancePage, maintenanceTotalPages, sortedMaintenanceRequests.length, maintenancePerPage]);

  const handleMaintenanceSort = (column: string) => {
    if (maintenanceSortColumn === column) {
      setMaintenanceSortDirection(maintenanceSortDirection === "asc" ? "desc" : "asc");
    } else {
      setMaintenanceSortColumn(column);
      setMaintenanceSortDirection("asc");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-active-rentals-title">
          {t("activeRentals.title", "Mis Rentas Activas")}
        </h1>
        <p className="text-secondary-foreground mt-2">
          {t("activeRentals.description", "Gestiona tus propiedades rentadas y contratos")}
        </p>
      </div>

      {/* Alertas de acciones pendientes */}
      {contracts.some((c: any) => c.status === "draft") && (
        <Alert data-testid="alert-pending-actions">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tienes contratos que requieren tu atención. Completa la información de inquilino para continuar el proceso.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={contracts.length > 0 ? "contracts" : "rentals"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contracts" data-testid="tab-contracts-in-process">
            Contratos en Proceso
            {contracts.length > 0 && (
              <Badge variant="secondary" className="ml-2">{contracts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rentals" data-testid="tab-active-rentals">
            Rentas Activas
            {rentals.length > 0 && (
              <Badge variant="secondary" className="ml-2">{rentals.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="mt-6 space-y-4">
          {contracts.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No tienes contratos en proceso</CardTitle>
                <CardDescription>
                  Cuando una oferta sea aceptada, el contrato aparecerá aquí para que completes la información
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              {contracts.map((contract: any) => {
                const progress = getContractProgress(contract);
                return (
                  <Card key={contract.id} className="hover-elevate" data-testid={`card-contract-${contract.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Contrato de Renta
                          </CardTitle>
                          <CardDescription>
                            Propiedad ID: {contract.propertyId}
                          </CardDescription>
                        </div>
                        {getContractStatusBadge(contract.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-tertiary-foreground" />
                          <span className="text-sm">Renta: ${contract.monthlyRent}/mes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-tertiary-foreground" />
                          <span className="text-sm">Duración: {contract.leaseDurationMonths} meses</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-tertiary-foreground">Progreso del contrato</span>
                          <span className="font-medium">{progress.step} de {progress.total}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all" 
                            style={{ width: `${(progress.step / progress.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-sm text-tertiary-foreground">{progress.message}</p>
                      </div>

                      {contract.status === "draft" && (
                        <Button 
                          className="w-full" 
                          onClick={() => window.location.href = `/contract-tenant-form/${contract.id}`}
                          data-testid={`button-complete-tenant-form-${contract.id}`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Completar Información de Inquilino
                        </Button>
                      )}
                      
                      {contract.status === "check_in" && (
                        <Button 
                          className="w-full" 
                          onClick={() => window.location.href = `/contract/${contract.id}`}
                          data-testid={`button-view-contract-${contract.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Contrato y Agendar Check-in
                        </Button>
                      )}

                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.location.href = `/contract/${contract.id}`}
                        data-testid={`button-view-details-${contract.id}`}
                      >
                        Ver Detalles del Contrato
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </TabsContent>

        <TabsContent value="rentals" className="mt-6 space-y-6">
          {rentals.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("activeRentals.noRentals", "No tienes rentas activas")}</CardTitle>
                <CardDescription>
                  {t("activeRentals.noRentalsDesc", "Cuando tengas una propiedad rentada, aparecerá aquí")}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-6">

      {/* Property Information */}
      {currentRental && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                {currentRental.propertyTitle || t("activeRentals.property", "Propiedad")}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(`/properties/${currentRental.propertyId}`, '_blank')}
                data-testid="button-view-property"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              {currentRental.unitType === "condominio" ? (
                <>
                  {currentRental.condoName && (
                    <span data-testid="text-condo-name">
                      {t("activeRentals.condominium", "Condominio")}: {currentRental.condoName}
                    </span>
                  )}
                  {currentRental.unitNumber && (
                    <span className="ml-2" data-testid="text-unit-number">
                      {t("activeRentals.unit", "Unidad")}: {currentRental.unitNumber}
                    </span>
                  )}
                </>
              ) : (
                <span data-testid="text-property-type">
                  {currentRental.propertyType === "house" ? t("activeRentals.privateHouse", "Casa Privada") : t("activeRentals.property", "Propiedad")}
                </span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Rental Selector */}
      {rentals.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t("activeRentals.selectRental", "Seleccionar Renta")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedRental || ""} onValueChange={setSelectedRental}>
              <SelectTrigger data-testid="select-rental">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rentals.map((rental) => {
                  const propertyName = rental.unitType === "condominio" 
                    ? `${rental.condoName || ""} ${rental.unitNumber || ""}`.trim()
                    : rental.propertyTitle || t("activeRentals.property", "Propiedad");
                  
                  return (
                    <SelectItem key={rental.id} value={rental.id}>
                      {propertyName} - ${rental.monthlyRent}/mes
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("activeRentals.monthlyRent", "Renta Mensual")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-tertiary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-monthly-rent">
              ${currentRental?.monthlyRent}
            </div>
            <p className="text-xs text-tertiary-foreground">
              {currentRental?.rentalType === "short_term" ? "Renta corta plazo" : "Renta largo plazo"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("activeRentals.deposit", "Depósito")}
            </CardTitle>
            <Home className="h-4 w-4 text-tertiary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-deposit">
              ${currentRental?.depositAmount}
            </div>
            <p className="text-xs text-tertiary-foreground">
              {t("activeRentals.depositPaid", "Depósito pagado")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("activeRentals.contractEnd", "Fin de Contrato")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-tertiary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-contract-end">
              {currentRental?.contractEndDate ? format(new Date(currentRental.contractEndDate), "dd MMM yyyy", { locale: language === "es" ? es : undefined }) : "-"}
            </div>
            <p className="text-xs text-tertiary-foreground">
              {currentRental?.contractStartDate ? `Inicio: ${format(new Date(currentRental.contractStartDate), "dd MMM yyyy", { locale: language === "es" ? es : undefined })}` : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments" data-testid="tab-payments">
            <DollarSign className="h-4 w-4 mr-2" />
            {t("activeRentals.payments", "Pagos")}
          </TabsTrigger>
          <TabsTrigger value="maintenance" data-testid="tab-maintenance">
            <Wrench className="h-4 w-4 mr-2" />
            {t("activeRentals.maintenance", "Mantenimiento")}
          </TabsTrigger>
          <TabsTrigger value="chat" data-testid="tab-chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            {t("activeRentals.chat", "Chat")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>{t("activeRentals.paymentHistory", "Historial de Pagos")}</CardTitle>
              <CardDescription>
                {t("activeRentals.paymentHistoryDesc", "Revisa tus pagos por servicio")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={currentServiceType} className="w-full" onValueChange={handleServiceTypeChange}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="rent" data-testid="tab-rent-payments">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {t("services.rent", "Renta")}
                  </TabsTrigger>
                  <TabsTrigger value="electricity" data-testid="tab-electricity-payments">
                    <Zap className="h-3 w-3 mr-1" />
                    {t("services.electricity", "Luz")}
                  </TabsTrigger>
                  <TabsTrigger value="water" data-testid="tab-water-payments">
                    <Droplet className="h-3 w-3 mr-1" />
                    {t("services.water", "Agua")}
                  </TabsTrigger>
                  <TabsTrigger value="internet" data-testid="tab-internet-payments">
                    <Wifi className="h-3 w-3 mr-1" />
                    {t("services.internet", "Internet")}
                  </TabsTrigger>
                  <TabsTrigger value="gas" data-testid="tab-gas-payments">
                    <Flame className="h-3 w-3 mr-1" />
                    {t("services.gas", "Gas")}
                  </TabsTrigger>
                </TabsList>
                
                {['rent', 'electricity', 'water', 'internet', 'gas'].map((serviceType) => {
                  // Only compute pagination for active service to avoid stale page renders
                  const isActiveService = serviceType === currentServiceType;
                  const { paginatedPayments, totalPages, totalCount } = isActiveService 
                    ? getPaginatedPayments(serviceType)
                    : { paginatedPayments: [], totalPages: 1, totalCount: payments.filter(p => p.serviceType === serviceType).length };
                  
                  return (
                    <TabsContent key={serviceType} value={serviceType} className="mt-4">
                      {paymentsLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : totalCount === 0 ? (
                        <p className="text-center text-secondary-foreground py-8">
                          {t("activeRentals.noPayments", "No hay pagos registrados")}
                        </p>
                      ) : isActiveService ? (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePaymentsSort("dueDate")}
                                    className="hover-elevate gap-1"
                                    data-testid="sort-due-date"
                                  >
                                    {t("activeRentals.dueDate", "Fecha de Vencimiento")}
                                    <ArrowUpDown className="h-4 w-4" />
                                  </Button>
                                </TableHead>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePaymentsSort("amount")}
                                    className="hover-elevate gap-1"
                                    data-testid="sort-amount"
                                  >
                                    {t("activeRentals.amount", "Monto")}
                                    <ArrowUpDown className="h-4 w-4" />
                                  </Button>
                                </TableHead>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePaymentsSort("status")}
                                    className="hover-elevate gap-1"
                                    data-testid="sort-status"
                                  >
                                    {t("activeRentals.status", "Estado")}
                                    <ArrowUpDown className="h-4 w-4" />
                                  </Button>
                                </TableHead>
                                <TableHead>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePaymentsSort("paymentDate")}
                                    className="hover-elevate gap-1"
                                    data-testid="sort-payment-date"
                                  >
                                    {t("activeRentals.paidDate", "Fecha de Pago")}
                                    <ArrowUpDown className="h-4 w-4" />
                                  </Button>
                                </TableHead>
                                {!isOwner && <TableHead>{t("activeRentals.actions", "Acciones")}</TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedPayments.map((payment) => (
                              <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                                <TableCell>
                                  {format(new Date(payment.dueDate), "dd MMM yyyy", { locale: language === "es" ? es : undefined })}
                                </TableCell>
                                <TableCell className="font-medium">${payment.amount}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={payment.status === "paid" ? "default" : payment.status === "pending" ? "secondary" : "destructive"}
                                    data-testid={`badge-payment-status-${payment.id}`}
                                  >
                                    {payment.status === "paid" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                    {payment.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                    {payment.status === "overdue" && <AlertCircle className="h-3 w-3 mr-1" />}
                                    {payment.status === "paid" ? t("activeRentals.paid", "Pagado") :
                                     payment.status === "pending" ? t("activeRentals.pending", "Pendiente") :
                                     t("activeRentals.overdue", "Vencido")}
                                  </Badge>
                                  {payment.approvedBy && (
                                    <Badge variant="outline" className="ml-2">
                                      {t("activeRentals.approved", "Aprobado")}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {payment.paymentDate ? format(new Date(payment.paymentDate), "dd MMM yyyy", { locale: language === "es" ? es : undefined }) : "-"}
                                </TableCell>
                                {!isOwner && (
                                  <TableCell>
                                    {payment.status === "pending" && (
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          setSelectedPayment(payment);
                                          setShowPaymentDialog(true);
                                        }}
                                        data-testid={`button-register-payment-${payment.id}`}
                                      >
                                        {t("activeRentals.registerPayment", "Registrar Pago")}
                                      </Button>
                                    )}
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        {/* Pagination Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {language === "es" ? "Mostrar" : "Show"}
                            </span>
                            <Select
                              value={paymentsPerPage.toString()}
                              onValueChange={(value) => setPaymentsPerPage(Number(value))}
                            >
                              <SelectTrigger className="w-20" data-testid="select-payments-per-page">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="30">30</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">
                              {language === "es" ? "por página" : "per page"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {language === "es" ? "Página" : "Page"} {paymentsPage} {language === "es" ? "de" : "of"} {totalPages}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPaymentsPage(Math.max(1, paymentsPage - 1))}
                                disabled={paymentsPage === 1}
                                data-testid="button-payments-prev-page"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPaymentsPage(Math.min(totalPages, paymentsPage + 1))}
                                disabled={paymentsPage === totalPages}
                                data-testid="button-payments-next-page"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        </>
                      ) : null}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t("activeRentals.maintenanceRequests", "Solicitudes de Mantenimiento")}</CardTitle>
                  <CardDescription>
                    {t("activeRentals.maintenanceRequestsDesc", "Reporta problemas con la propiedad")}
                  </CardDescription>
                </div>
                <Button onClick={() => setShowMaintenanceDialog(true)} data-testid="button-new-maintenance-request">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("activeRentals.newRequest", "Nueva Solicitud")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {maintenanceLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : maintenanceRequests.length === 0 ? (
                <p className="text-center text-secondary-foreground py-8">
                  {t("activeRentals.noMaintenanceRequests", "No hay solicitudes de mantenimiento")}
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMaintenanceSort("title")}
                            className="hover-elevate gap-1"
                            data-testid="sort-title"
                          >
                            {t("activeRentals.title", "Título")}
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>{t("activeRentals.description", "Descripción")}</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMaintenanceSort("urgency")}
                            className="hover-elevate gap-1"
                            data-testid="sort-urgency"
                          >
                            {t("activeRentals.urgency", "Urgencia")}
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMaintenanceSort("status")}
                            className="hover-elevate gap-1"
                            data-testid="sort-status"
                          >
                            {t("activeRentals.status", "Estado")}
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMaintenanceSort("createdAt")}
                            className="hover-elevate gap-1"
                            data-testid="sort-created-at"
                          >
                            {t("activeRentals.createdAt", "Fecha")}
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMaintenanceRequests.map((request) => (
                        <TableRow key={request.id} data-testid={`row-maintenance-${request.id}`}>
                          <TableCell className="font-medium">
                            {request.title || t("activeRentals.maintenanceRequest", "Solicitud de Mantenimiento")}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {request.description || t("activeRentals.noDescription", "Sin descripción")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                request.urgency === "emergency" ? "destructive" :
                                request.urgency === "urgent" ? "destructive" :
                                request.urgency === "high" ? "destructive" :
                                request.urgency === "normal" ? "secondary" :
                                request.urgency === "medium" ? "secondary" : "outline"
                              }
                              data-testid={`badge-urgency-${request.id}`}
                            >
                              {request.urgency === "emergency" ? t("activeRentals.emergency", "Emergencia") :
                               request.urgency === "urgent" ? t("activeRentals.urgent", "Urgente") :
                               request.urgency === "high" ? t("activeRentals.high", "Alta") :
                               request.urgency === "normal" ? t("activeRentals.normal", "Normal") :
                               request.urgency === "medium" ? t("activeRentals.medium", "Media") :
                               t("activeRentals.low", "Baja")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                request.status === "completed" ? "default" :
                                request.status === "in_progress" ? "secondary" : "outline"
                              }
                              data-testid={`badge-status-${request.id}`}
                            >
                              {request.status === "completed" ? t("activeRentals.completed", "Completado") :
                               request.status === "in_progress" ? t("activeRentals.inProgress", "En Proceso") :
                               t("activeRentals.pending", "Pendiente")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-secondary-foreground">
                            {format(new Date(request.createdAt), "dd MMM yyyy", { locale: language === "es" ? es : undefined })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {language === "es" ? "Mostrar" : "Show"}
                      </span>
                      <Select
                        value={String(maintenancePerPage)}
                        onValueChange={handleMaintenancePerPageChange}
                      >
                        <SelectTrigger className="w-20" data-testid="select-maintenance-per-page">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">
                        {language === "es" ? "por página" : "per page"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {language === "es" ? "Página" : "Page"} {maintenancePage} {language === "es" ? "de" : "of"} {maintenanceTotalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setMaintenancePage(Math.max(1, maintenancePage - 1))}
                          disabled={maintenancePage === 1}
                          data-testid="button-maintenance-prev-page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setMaintenancePage(Math.min(maintenanceTotalPages, maintenancePage + 1))}
                          disabled={maintenancePage === maintenanceTotalPages}
                          data-testid="button-maintenance-next-page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="border-b">
              <CardTitle>{t("activeRentals.chat", "Chat")}</CardTitle>
              <CardDescription>
                {t("activeRentals.chatDesc", "Comunícate con el propietario y el personal de mantenimiento")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-secondary-foreground py-12">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{t("activeRentals.noMessages", "No hay mensajes aún")}</p>
                      <p className="text-sm">{t("activeRentals.startConversation", "Inicia la conversación")}</p>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((msg) => {
                        const isOwn = msg.senderId === user?.id;
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                            data-testid={`message-${msg.id}`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {getUserInitials(user?.firstName || undefined)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
                              <div
                                className={`inline-block p-3 rounded-lg ${
                                  isOwn
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                              </div>
                              <p className="text-xs text-tertiary-foreground mt-1">
                                {formatDistanceToNow(new Date(msg.createdAt), {
                                  addSuffix: true,
                                  locale: language === "es" ? es : undefined,
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder={t("activeRentals.typeMessage", "Escribe un mensaje...")}
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                    data-testid="input-chat-message"
                  />
                  <Button
                    onClick={handleSendChatMessage}
                    disabled={!chatMessage.trim() || sendChatMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Maintenance Request Dialog */}
      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent data-testid="dialog-maintenance-request">
          <DialogHeader>
            <DialogTitle>{t("activeRentals.newMaintenanceRequest", "Nueva Solicitud de Mantenimiento")}</DialogTitle>
            <DialogDescription>
              {t("activeRentals.newMaintenanceRequestDesc", "Describe el problema y lo enviaremos al propietario")}
            </DialogDescription>
          </DialogHeader>
          <Form {...maintenanceForm}>
            <form onSubmit={maintenanceForm.handleSubmit(onSubmitMaintenanceRequest)} className="space-y-4">
              <FormField
                control={maintenanceForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("activeRentals.requestTitle", "Título")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("activeRentals.titlePlaceholder", "ej. Fuga de agua en baño")} data-testid="input-maintenance-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={maintenanceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("activeRentals.descriptionLabel", "Descripción")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder={t("activeRentals.descPlaceholder", "Describe el problema en detalle")} data-testid="textarea-maintenance-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={maintenanceForm.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("activeRentals.urgency", "Urgencia")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-urgency">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{t("activeRentals.low", "Baja")}</SelectItem>
                        <SelectItem value="medium">{t("activeRentals.medium", "Media")}</SelectItem>
                        <SelectItem value="high">{t("activeRentals.high", "Alta")}</SelectItem>
                        <SelectItem value="emergency">{t("activeRentals.emergency", "Emergencia")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>{t("activeRentals.problemPhoto", "Foto del Problema (Opcional)")}</FormLabel>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleProblemPhotoUpload}
                    data-testid="input-problem-photo"
                  />
                  <Upload className="h-5 w-5 text-secondary-foreground" />
                </div>
                {problemPhotoFile && (
                  <div className="relative group">
                    <img
                      src={problemPhotoFile.data}
                      alt="Problem preview"
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => setProblemPhotoFile(null)}
                        data-testid="button-remove-problem-photo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMaintenanceDialog(false)}
                  data-testid="button-cancel-maintenance"
                >
                  {t("activeRentals.cancel", "Cancelar")}
                </Button>
                <Button
                  type="submit"
                  disabled={createMaintenanceRequestMutation.isPending}
                  data-testid="button-submit-maintenance"
                >
                  {createMaintenanceRequestMutation.isPending
                    ? t("activeRentals.sending", "Enviando...")
                    : t("activeRentals.send", "Enviar Solicitud")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Register Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent data-testid="dialog-register-payment">
          <DialogHeader>
            <DialogTitle>{t("activeRentals.registerPayment", "Registrar Pago")}</DialogTitle>
            <DialogDescription>
              {t("activeRentals.registerPaymentDesc", "Sube el comprobante de tu transferencia")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment && (
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">{t("activeRentals.amount", "Monto")}: </span>
                  ${selectedPayment.amount}
                </p>
                <p className="text-sm">
                  <span className="font-medium">{t("activeRentals.dueDate", "Fecha de Vencimiento")}: </span>
                  {format(new Date(selectedPayment.dueDate), "dd MMM yyyy", { locale: language === "es" ? es : undefined })}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("activeRentals.paymentProof", "Comprobante de Pago")}
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPaymentProofFile(file);
                  }
                }}
                data-testid="input-payment-proof"
              />
              {paymentProofFile && (
                <p className="text-sm text-secondary-foreground">
                  {t("activeRentals.fileSelected", "Archivo seleccionado")}: {paymentProofFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPaymentDialog(false);
                setSelectedPayment(null);
                setPaymentProofFile(null);
              }}
              data-testid="button-cancel-payment"
            >
              {t("activeRentals.cancel", "Cancelar")}
            </Button>
            <Button
              onClick={() => registerPaymentMutation.mutate()}
              disabled={!paymentProofFile || registerPaymentMutation.isPending}
              data-testid="button-submit-payment"
            >
              {registerPaymentMutation.isPending
                ? t("activeRentals.registering", "Registrando...")
                : t("activeRentals.register", "Registrar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
