import { useState, useMemo, useEffect, useLayoutEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, startOfMonth, endOfMonth, subMonths, Locale } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useMobile } from "@/hooks/use-mobile";
import { ExternalPaginationControls } from "@/components/external/ExternalPaginationControls";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Trophy,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Award,
  Calendar as CalendarIcon,
  UserPlus,
  Briefcase,
  BarChart3,
  CheckCircle2,
  Clock,
  XCircle,
  Percent,
  Wallet,
  CreditCard,
  ArrowRight,
  RefreshCw,
  Download
} from "lucide-react";

type SellerWithStats = {
  id: string;
  userId: string;
  agencyId: string;
  status: string;
  commissionRate: string | null;
  hireDate: string | null;
  terminationDate: string | null;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl: string | null;
  } | null;
  stats: {
    totalLeads: number;
    convertedLeads: number;
    totalContracts: number;
    totalRevenue: number;
    totalCommissions: number;
    unpaidCommissions: number;
    totalShowings: number;
  };
};

type LeaderboardEntry = {
  sellerId: string;
  userId: string;
  name: string;
  profileImageUrl: string | null;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalContracts: number;
  totalRevenue: number;
  totalCommissions: number;
  unpaidCommissions: number;
};

type SellerGoal = {
  id: string;
  sellerId: string;
  goalType: string;
  target: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  progress: number;
  progressPercent: number;
};

type SellerCommission = {
  id: string;
  sellerId: string;
  contractId: string | null;
  amount: string;
  commissionType: string;
  description: string | null;
  isPaid: boolean;
  paidAt: string | null;
  payoutId: string | null;
  createdAt: string;
};

type SellerPayout = {
  id: string;
  sellerId: string;
  amount: string;
  status: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  notes: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

type CommissionDefault = {
  id: string | null;
  agencyId: string;
  concept: string;
  rate: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  updatedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type CommissionOverride = {
  id: string;
  agencyId: string;
  concept: string;
  overrideType: 'role' | 'user';
  roleValue: string | null;
  userId: string | null;
  rate: string;
  notes: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl: string | null;
  } | null;
};

type AgencySeller = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImageUrl: string | null;
  createdAt: string;
};

const COMMISSION_CONCEPTS: Record<string, Record<string, string>> = {
  es: {
    rental_no_referral: "Renta sin Referido",
    rental_with_referral: "Renta con Referido",
    property_recruitment: "Captación de Propiedad",
    broker_referral: "Referido de Broker"
  },
  en: {
    rental_no_referral: "Rental without Referral",
    rental_with_referral: "Rental with Referral",
    property_recruitment: "Property Recruitment",
    broker_referral: "Broker Referral"
  }
};

const ROLE_LABELS: Record<string, Record<string, string>> = {
  es: {
    external_agency_admin: "Administrador",
    external_agency_seller: "Vendedor"
  },
  en: {
    external_agency_admin: "Administrator",
    external_agency_seller: "Seller"
  }
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  es: {
    active: "Activo",
    inactive: "Inactivo",
    probation: "Prueba",
    terminated: "Terminado"
  },
  en: {
    active: "Active",
    inactive: "Inactive",
    probation: "Probation",
    terminated: "Terminated"
  }
};

const GOAL_TYPE_LABELS: Record<string, Record<string, string>> = {
  es: {
    leads: "Leads",
    conversions: "Conversiones",
    revenue: "Ingresos",
    showings: "Visitas",
    contracts: "Contratos"
  },
  en: {
    leads: "Leads",
    conversions: "Conversions",
    revenue: "Revenue",
    showings: "Showings",
    contracts: "Contracts"
  }
};

const PAYOUT_STATUS_LABELS: Record<string, Record<string, string>> = {
  es: {
    pending: "Pendiente",
    approved: "Aprobado",
    paid: "Pagado",
    rejected: "Rechazado"
  },
  en: {
    pending: "Pending",
    approved: "Approved",
    paid: "Paid",
    rejected: "Rejected"
  }
};



// =====================================================
// SELLER DETAIL TAB COMPONENTS
// =====================================================

type TimelineItem = {
  id: string;
  type: "commission" | "payout" | "goal";
  title: string;
  description: string;
  amount?: string;
  date: string;
  status?: string;
};

function SellerTimelineContent({ 
  sellerId, 
  language, 
  dateLocale,
  formatCurrency 
}: { 
  sellerId: string; 
  language: string; 
  dateLocale: Locale;
  formatCurrency: (amount: number) => string;
}) {
  const { data: sellerDetail, isLoading } = useQuery<{
    commissions: SellerCommission[];
    payouts: SellerPayout[];
    goals: SellerGoal[];
  }>({
    queryKey: ["/api/external/sellers", sellerId, "detail"],
    queryFn: async () => {
      const res = await fetch(`/api/external/sellers/${sellerId}`);
      if (!res.ok) throw new Error("Failed to fetch seller details");
      return res.json();
    },
    enabled: !!sellerId,
  });

  const timelineItems = useMemo(() => {
    if (!sellerDetail) return [];
    
    const items: TimelineItem[] = [];
    
    // Add commissions
    sellerDetail.commissions?.forEach(c => {
      items.push({
        id: `commission-${c.id}`,
        type: "commission",
        title: language === "es" ? "Comisión Registrada" : "Commission Recorded",
        description: c.description || (c.commissionType === "sale" 
          ? (language === "es" ? "Venta" : "Sale")
          : (language === "es" ? "Renta" : "Rental")),
        amount: c.amount,
        date: c.createdAt,
        status: c.isPaid ? "paid" : "pending"
      });
    });
    
    // Add payouts
    sellerDetail.payouts?.forEach(p => {
      items.push({
        id: `payout-${p.id}`,
        type: "payout",
        title: language === "es" ? "Pago Procesado" : "Payout Processed",
        description: p.paymentMethod || (language === "es" ? "Transferencia" : "Transfer"),
        amount: p.amount,
        date: p.createdAt,
        status: p.status
      });
    });
    
    // Sort by date descending
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sellerDetail, language]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>{language === "es" ? "Sin actividad registrada" : "No activity recorded"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto">
      {timelineItems.map((item, index) => (
        <div 
          key={item.id}
          className="flex gap-3 p-3 rounded-lg border bg-card"
          data-testid={`timeline-item-${index}`}
        >
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
            item.type === "commission" 
              ? "bg-green-100 dark:bg-green-900/30" 
              : "bg-blue-100 dark:bg-blue-900/30"
          }`}>
            {item.type === "commission" ? (
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm truncate">{item.title}</p>
              <span className="text-xs text-muted-foreground shrink-0">
                {format(new Date(item.date), "d MMM", { locale: dateLocale })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{item.description}</p>
            {item.amount && (
              <div className="flex items-center justify-between mt-1">
                <span className="font-semibold text-sm">
                  {formatCurrency(parseFloat(item.amount))}
                </span>
                {item.status && (
                  <Badge variant={item.status === "paid" ? "default" : "secondary"} className="text-xs">
                    {item.status === "paid" 
                      ? (language === "es" ? "Pagado" : "Paid")
                      : (language === "es" ? "Pendiente" : "Pending")
                    }
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SellerGoalsContent({ 
  sellerId,
  userId, 
  language, 
  dateLocale 
}: { 
  sellerId: string;
  userId: string; 
  language: string; 
  dateLocale: Locale;
}) {
  const { data: sellerDetail, isLoading } = useQuery<{
    goals: SellerGoal[];
  }>({
    queryKey: ["/api/external/sellers", sellerId, "detail"],
    queryFn: async () => {
      const res = await fetch(`/api/external/sellers/${sellerId}`);
      if (!res.ok) throw new Error("Failed to fetch seller details");
      return res.json();
    },
    enabled: !!sellerId,
  });

  const goals = sellerDetail?.goals || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>{language === "es" ? "Sin metas activas" : "No active goals"}</p>
      </div>
    );
  }

  const goalTypeLabels: Record<string, string> = {
    leads: language === "es" ? "Leads" : "Leads",
    conversions: language === "es" ? "Conversiones" : "Conversions",
    revenue: language === "es" ? "Ingresos" : "Revenue",
    showings: language === "es" ? "Visitas" : "Showings",
    contracts: language === "es" ? "Contratos" : "Contracts"
  };

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto">
      {goals.map((goal, index) => (
        <Card key={goal.id} data-testid={`goal-card-${index}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                {goalTypeLabels[goal.goalType] || goal.goalType}
              </CardTitle>
              <Badge variant={goal.isActive ? "default" : "secondary"}>
                {goal.isActive 
                  ? (language === "es" ? "Activa" : "Active")
                  : (language === "es" ? "Inactiva" : "Inactive")
                }
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {format(new Date(goal.startDate), "d MMM", { locale: dateLocale })} - {format(new Date(goal.endDate), "d MMM yyyy", { locale: dateLocale })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{language === "es" ? "Progreso" : "Progress"}</span>
                <span className="font-semibold">
                  {goal.progress || 0} / {goal.target}
                </span>
              </div>
              <Progress value={goal.progressPercent || 0} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(goal.progressPercent || 0)}%
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SellerCommissionsContent({ 
  sellerId,
  userId, 
  language, 
  dateLocale,
  formatCurrency 
}: { 
  sellerId: string;
  userId: string; 
  language: string; 
  dateLocale: Locale;
  formatCurrency: (amount: number) => string;
}) {
  const { data: sellerDetail, isLoading } = useQuery<{
    commissions: SellerCommission[];
  }>({
    queryKey: ["/api/external/sellers", sellerId, "detail"],
    queryFn: async () => {
      const res = await fetch(`/api/external/sellers/${sellerId}`);
      if (!res.ok) throw new Error("Failed to fetch seller details");
      return res.json();
    },
    enabled: !!sellerId,
  });

  const commissions = sellerDetail?.commissions || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (commissions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>{language === "es" ? "Sin comisiones registradas" : "No commissions recorded"}</p>
      </div>
    );
  }

  const totalPaid = commissions
    .filter(c => c.isPaid)
    .reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0);
  
  const totalPending = commissions
    .filter(c => !c.isPaid)
    .reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">
                {language === "es" ? "Pagado" : "Paid"}
              </span>
            </div>
            <div className="text-lg font-bold mt-1">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">
                {language === "es" ? "Pendiente" : "Pending"}
              </span>
            </div>
            <div className="text-lg font-bold mt-1 text-amber-600">{formatCurrency(totalPending)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Commission List */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === "es" ? "Fecha" : "Date"}</TableHead>
              <TableHead>{language === "es" ? "Tipo" : "Type"}</TableHead>
              <TableHead className="text-right">{language === "es" ? "Monto" : "Amount"}</TableHead>
              <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.slice(0, 10).map((commission, index) => (
              <TableRow key={commission.id} data-testid={`commission-row-${index}`}>
                <TableCell className="text-sm">
                  {format(new Date(commission.createdAt), "d MMM", { locale: dateLocale })}
                </TableCell>
                <TableCell className="text-sm">
                  {commission.commissionType === "sale" 
                    ? (language === "es" ? "Venta" : "Sale")
                    : commission.commissionType === "rental"
                      ? (language === "es" ? "Renta" : "Rental")
                      : commission.commissionType
                  }
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(parseFloat(commission.amount || "0"))}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={commission.isPaid ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {commission.isPaid 
                      ? (language === "es" ? "Pagado" : "Paid")
                      : (language === "es" ? "Pendiente" : "Pending")
                    }
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {commissions.length > 10 && (
          <div className="p-2 text-center text-sm text-muted-foreground border-t">
            {language === "es" 
              ? `+ ${commissions.length - 10} más`
              : `+ ${commissions.length - 10} more`
            }
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExternalSellersManagement() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isMobile = useMobile();
  const dateLocale = language === "es" ? es : enUS;

  const [activeTab, setActiveTab] = useState<"overview" | "sellers" | "commissions" | "payouts" | "goals">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [sortColumn, setSortColumn] = useState<string>("totalRevenue");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedSeller, setSelectedSeller] = useState<SellerWithStats | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SellerGoal | null>(null);
  const [goalFormData, setGoalFormData] = useState({
    sellerId: "",
    goalType: "leads",
    target: 10,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    isActive: true
  });

  useLayoutEffect(() => {
    setViewMode(isMobile ? "cards" : "table");
  }, [isMobile]);

  const { data: sellers = [], isLoading: sellersLoading } = useQuery<SellerWithStats[]>({
    queryKey: ["/api/external/sellers", statusFilter !== "all" ? { status: statusFilter } : null],
    staleTime: 2 * 60 * 1000,
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/external/sellers-leaderboard"],
    staleTime: 2 * 60 * 1000,
  });

  const { data: commissions = [], isLoading: commissionsLoading } = useQuery<SellerCommission[]>({
    queryKey: ["/api/external/commissions"],
    staleTime: 2 * 60 * 1000,
  });

  const { data: payouts = [], isLoading: payoutsLoading } = useQuery<SellerPayout[]>({
    queryKey: ["/api/external/payouts"],
    staleTime: 2 * 60 * 1000,
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<SellerGoal[]>({
    queryKey: ["/api/external/goals", { isActive: true }],
    staleTime: 2 * 60 * 1000,
  });

  const createPayoutMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/external/payouts", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error creating payout");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external/commissions"] });
      toast({
        title: language === "es" ? "Pago creado" : "Payout created",
        description: language === "es" 
          ? "El pago ha sido registrado exitosamente"
          : "The payout has been registered successfully"
      });
      setIsPayoutDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message
      });
    }
  });

  const updatePayoutMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest("PATCH", `/api/external/payouts/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error updating payout");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/payouts"] });
      toast({
        title: language === "es" ? "Pago actualizado" : "Payout updated",
        description: language === "es" 
          ? "El estado del pago ha sido actualizado"
          : "The payout status has been updated"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message
      });
    }
  });

  // Goal mutations
  const createGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/external/goals", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error creating goal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/goals"] });
      toast({
        title: language === "es" ? "Meta creada" : "Goal created",
        description: language === "es" 
          ? "La meta ha sido creada exitosamente"
          : "The goal has been created successfully"
      });
      resetGoalForm();
      setIsGoalDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message
      });
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest("PATCH", `/api/external/goals/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error updating goal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/goals"] });
      toast({
        title: language === "es" ? "Meta actualizada" : "Goal updated",
        description: language === "es" 
          ? "La meta ha sido actualizada exitosamente"
          : "The goal has been updated successfully"
      });
      resetGoalForm();
      setIsGoalDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message
      });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/external/goals/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error deleting goal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/goals"] });
      toast({
        title: language === "es" ? "Meta eliminada" : "Goal deleted",
        description: language === "es" 
          ? "La meta ha sido eliminada"
          : "The goal has been deleted"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: error.message
      });
    }
  });

  const resetGoalForm = () => {
    setEditingGoal(null);
    setGoalFormData({
      sellerId: "",
      goalType: "leads",
      target: 10,
      startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
      isActive: true
    });
  };

  const handleEditGoal = (goal: SellerGoal) => {
    setEditingGoal(goal);
    setGoalFormData({
      sellerId: goal.sellerId || "",
      goalType: goal.goalType,
      target: goal.target,
      startDate: goal.startDate.split("T")[0],
      endDate: goal.endDate.split("T")[0],
      isActive: goal.isActive
    });
    setIsGoalDialogOpen(true);
  };

  const handleSubmitGoal = () => {
    if (editingGoal) {
      updateGoalMutation.mutate({
        id: editingGoal.id,
        ...goalFormData,
        sellerId: goalFormData.sellerId || undefined
      });
    } else {
      createGoalMutation.mutate({
        ...goalFormData,
        sellerId: goalFormData.sellerId || undefined
      });
    }
  };

    const filteredSellers = useMemo(() => {
    return sellers.filter(seller => {
      const name = seller.user ? `${seller.user.firstName} ${seller.user.lastName}`.toLowerCase() : "";
      const email = seller.user?.email?.toLowerCase() || "";
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || seller.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sellers, searchTerm, statusFilter]);

  const sortedSellers = useMemo(() => {
    return [...filteredSellers].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortColumn) {
        case "name":
          aVal = a.user ? `${a.user.firstName} ${a.user.lastName}` : "";
          bVal = b.user ? `${b.user.firstName} ${b.user.lastName}` : "";
          break;
        case "totalLeads":
          aVal = a.stats.totalLeads;
          bVal = b.stats.totalLeads;
          break;
        case "totalContracts":
          aVal = a.stats.totalContracts;
          bVal = b.stats.totalContracts;
          break;
        case "totalRevenue":
          aVal = a.stats.totalRevenue;
          bVal = b.stats.totalRevenue;
          break;
        case "totalCommissions":
          aVal = a.stats.totalCommissions;
          bVal = b.stats.totalCommissions;
          break;
        case "unpaidCommissions":
          aVal = a.stats.unpaidCommissions;
          bVal = b.stats.unpaidCommissions;
          break;
        default:
          aVal = a.stats.totalRevenue;
          bVal = b.stats.totalRevenue;
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc" 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredSellers, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedSellers.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedSellers = sortedSellers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const totalStats = useMemo(() => {
    return sellers.reduce((acc, seller) => ({
      totalLeads: acc.totalLeads + seller.stats.totalLeads,
      convertedLeads: acc.convertedLeads + seller.stats.convertedLeads,
      totalContracts: acc.totalContracts + seller.stats.totalContracts,
      totalRevenue: acc.totalRevenue + seller.stats.totalRevenue,
      totalCommissions: acc.totalCommissions + seller.stats.totalCommissions,
      unpaidCommissions: acc.unpaidCommissions + seller.stats.unpaidCommissions
    }), {
      totalLeads: 0,
      convertedLeads: 0,
      totalContracts: 0,
      totalRevenue: 0,
      totalCommissions: 0,
      unpaidCommissions: 0
    });
  }, [sellers]);

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
      inactive: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      probation: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
      terminated: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
    };
    return (
      <Badge className={statusColors[status] || statusColors.inactive}>
        {STATUS_LABELS[language][status] || status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-sellers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Vendedores Activos" : "Active Sellers"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {sellersLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-sellers">
                {sellers.filter(s => s.status === "active").length}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {sellers.length} {language === "es" ? "total" : "total"}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Ingresos Totales" : "Total Revenue"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {sellersLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-revenue">
                {formatCurrency(totalStats.totalRevenue)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {totalStats.totalContracts} {language === "es" ? "contratos" : "contracts"}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-commissions">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Comisiones Totales" : "Total Commissions"}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {sellersLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-commissions">
                {formatCurrency(totalStats.totalCommissions)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 text-amber-600">
              {formatCurrency(totalStats.unpaidCommissions)} {language === "es" ? "sin pagar" : "unpaid"}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion-rate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "es" ? "Tasa de Conversión" : "Conversion Rate"}
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {sellersLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-conversion-rate">
                {totalStats.totalLeads > 0 
                  ? Math.round((totalStats.convertedLeads / totalStats.totalLeads) * 100)
                  : 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {totalStats.convertedLeads}/{totalStats.totalLeads} {language === "es" ? "leads" : "leads"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-leaderboard">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              {language === "es" ? "Tabla de Líderes" : "Leaderboard"}
            </CardTitle>
            <CardDescription>
              {language === "es" ? "Top vendedores por ingresos" : "Top sellers by revenue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div 
                    key={entry.sellerId} 
                    className="flex items-center gap-3 p-2 rounded-lg hover-elevate"
                    data-testid={`leaderboard-row-${index}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
                      ${index === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : 
                        index === 1 ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300" : 
                        index === 2 ? "bg-amber-700/20 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400" : 
                        "bg-muted text-muted-foreground"}`}
                    >
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {entry.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.conversionRate}% {language === "es" ? "conversión" : "conversion"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(entry.totalRevenue)}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.totalContracts} {language === "es" ? "contratos" : "contracts"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-active-goals">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {language === "es" ? "Metas Activas" : "Active Goals"}
            </CardTitle>
            <CardDescription>
              {language === "es" ? "Progreso de metas del equipo" : "Team goals progress"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{language === "es" ? "Sin metas activas" : "No active goals"}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 4).map((goal) => (
                  <div key={goal.id} className="space-y-2" data-testid={`goal-${goal.id}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {GOAL_TYPE_LABELS[language][goal.goalType] || goal.goalType}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {goal.progress} / {goal.target}
                      </span>
                    </div>
                    <Progress value={goal.progressPercent} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {format(new Date(goal.startDate), "d MMM", { locale: dateLocale })} - 
                        {format(new Date(goal.endDate), "d MMM", { locale: dateLocale })}
                      </span>
                      <span className={goal.progressPercent >= 100 ? "text-green-600" : ""}>
                        {goal.progressPercent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setActiveTab("goals")}
              data-testid="button-view-all-goals"
            >
              {language === "es" ? "Ver todas las metas" : "View all goals"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );

  const renderSellersTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "es" ? "Buscar vendedores..." : "Search sellers..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-sellers"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
              <SelectValue placeholder={language === "es" ? "Estado" : "Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
              <SelectItem value="active">{language === "es" ? "Activos" : "Active"}</SelectItem>
              <SelectItem value="inactive">{language === "es" ? "Inactivos" : "Inactive"}</SelectItem>
              <SelectItem value="probation">{language === "es" ? "Prueba" : "Probation"}</SelectItem>
              <SelectItem value="terminated">{language === "es" ? "Terminados" : "Terminated"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sellersLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : viewMode === "table" && !isMobile ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort("name")}
                    data-testid="button-sort-name"
                  >
                    {language === "es" ? "Vendedor" : "Seller"}
                    {sortColumn === "name" && (
                      sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="text-center">{language === "es" ? "Estado" : "Status"}</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort("totalLeads")}
                    data-testid="button-sort-leads"
                  >
                    {language === "es" ? "Leads" : "Leads"}
                    {sortColumn === "totalLeads" && (
                      sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort("totalContracts")}
                    data-testid="button-sort-contracts"
                  >
                    {language === "es" ? "Contratos" : "Contracts"}
                    {sortColumn === "totalContracts" && (
                      sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort("totalRevenue")}
                    data-testid="button-sort-revenue"
                  >
                    {language === "es" ? "Ingresos" : "Revenue"}
                    {sortColumn === "totalRevenue" && (
                      sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort("unpaidCommissions")}
                    data-testid="button-sort-unpaid"
                  >
                    {language === "es" ? "Por Pagar" : "Unpaid"}
                    {sortColumn === "unpaidCommissions" && (
                      sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSellers.map((seller) => (
                <TableRow 
                  key={seller.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  data-testid={`seller-row-${seller.id}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={seller.user?.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {seller.user 
                            ? `${seller.user.firstName?.[0] || ""}${seller.user.lastName?.[0] || ""}`.toUpperCase()
                            : "?"
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {seller.user 
                            ? `${seller.user.firstName} ${seller.user.lastName}`
                            : language === "es" ? "Sin nombre" : "No name"
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">{seller.user?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(seller.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{seller.stats.totalLeads}</span>
                      <span className="text-muted-foreground text-xs ml-1">
                        ({seller.stats.convertedLeads} {language === "es" ? "conv." : "conv."})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{seller.stats.totalContracts}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(seller.stats.totalRevenue)}</TableCell>
                  <TableCell>
                    <span className={seller.stats.unpaidCommissions > 0 ? "text-amber-600 font-medium" : ""}>
                      {formatCurrency(seller.stats.unpaidCommissions)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedSeller(seller);
                        setIsDetailDialogOpen(true);
                      }}
                      data-testid={`button-view-seller-${seller.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedSellers.map((seller) => (
            <Card 
              key={seller.id}
              className="hover-elevate cursor-pointer"
              onClick={() => {
                setSelectedSeller(seller);
                setIsDetailDialogOpen(true);
              }}
              data-testid={`seller-card-${seller.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={seller.user?.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {seller.user 
                          ? `${seller.user.firstName?.[0] || ""}${seller.user.lastName?.[0] || ""}`.toUpperCase()
                          : "?"
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {seller.user 
                          ? `${seller.user.firstName} ${seller.user.lastName}`
                          : language === "es" ? "Sin nombre" : "No name"
                        }
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{seller.user?.email}</p>
                    </div>
                  </div>
                  {getStatusBadge(seller.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">{language === "es" ? "Leads" : "Leads"}</p>
                    <p className="font-medium">{seller.stats.totalLeads}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{language === "es" ? "Contratos" : "Contracts"}</p>
                    <p className="font-medium">{seller.stats.totalContracts}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{language === "es" ? "Ingresos" : "Revenue"}</p>
                    <p className="font-medium">{formatCurrency(seller.stats.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{language === "es" ? "Por Pagar" : "Unpaid"}</p>
                    <p className={`font-medium ${seller.stats.unpaidCommissions > 0 ? "text-amber-600" : ""}`}>
                      {formatCurrency(seller.stats.unpaidCommissions)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {sortedSellers.length > itemsPerPage && (
        <ExternalPaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={sortedSellers.length}
        />
      )}
    </div>
  );

  const renderCommissionsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {language === "es" ? "Comisiones" : "Commissions"}
        </h3>
      </div>

      {commissionsLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : commissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {language === "es" ? "No hay comisiones registradas" : "No commissions registered"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === "es" ? "Vendedor" : "Seller"}</TableHead>
                <TableHead>{language === "es" ? "Descripción" : "Description"}</TableHead>
                <TableHead>{language === "es" ? "Monto" : "Amount"}</TableHead>
                <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                <TableHead>{language === "es" ? "Fecha" : "Date"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.slice(0, 20).map((commission) => {
                const seller = sellers.find(s => s.userId === commission.sellerId);
                return (
                  <TableRow key={commission.id} data-testid={`commission-row-${commission.id}`}>
                    <TableCell>
                      {seller?.user 
                        ? `${seller.user.firstName} ${seller.user.lastName}`
                        : commission.sellerId
                      }
                    </TableCell>
                    <TableCell>{commission.description || "-"}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(parseFloat(commission.amount))}</TableCell>
                    <TableCell>
                      {commission.isPaid ? (
                        <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {language === "es" ? "Pagado" : "Paid"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          <Clock className="mr-1 h-3 w-3" />
                          {language === "es" ? "Pendiente" : "Pending"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(commission.createdAt), "d MMM yyyy", { locale: dateLocale })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  const renderPayoutsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {language === "es" ? "Pagos" : "Payouts"}
        </h3>
        <Button 
          onClick={() => setIsPayoutDialogOpen(true)}
          data-testid="button-create-payout"
        >
          <Plus className="mr-2 h-4 w-4" />
          {language === "es" ? "Nuevo Pago" : "New Payout"}
        </Button>
      </div>

      {payoutsLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : payouts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {language === "es" ? "No hay pagos registrados" : "No payouts registered"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === "es" ? "Vendedor" : "Seller"}</TableHead>
                <TableHead>{language === "es" ? "Monto" : "Amount"}</TableHead>
                <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                <TableHead>{language === "es" ? "Método" : "Method"}</TableHead>
                <TableHead>{language === "es" ? "Fecha" : "Date"}</TableHead>
                <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => {
                const seller = sellers.find(s => s.userId === payout.sellerId);
                return (
                  <TableRow key={payout.id} data-testid={`payout-row-${payout.id}`}>
                    <TableCell>
                      {seller?.user 
                        ? `${seller.user.firstName} ${seller.user.lastName}`
                        : payout.sellerId
                      }
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(parseFloat(payout.amount))}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          payout.status === "paid" 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                            : payout.status === "approved"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                            : payout.status === "rejected"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        }
                      >
                        {PAYOUT_STATUS_LABELS[language][payout.status] || payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{payout.paymentMethod || "-"}</TableCell>
                    <TableCell>
                      {format(new Date(payout.createdAt), "d MMM yyyy", { locale: dateLocale })}
                    </TableCell>
                    <TableCell className="text-right">
                      {payout.status === "pending" && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updatePayoutMutation.mutate({ id: payout.id, status: "approved" })}
                            data-testid={`button-approve-payout-${payout.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updatePayoutMutation.mutate({ id: payout.id, status: "rejected" })}
                            data-testid={`button-reject-payout-${payout.id}`}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                      {payout.status === "approved" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updatePayoutMutation.mutate({ id: payout.id, status: "paid" })}
                          data-testid={`button-mark-paid-${payout.id}`}
                        >
                          {language === "es" ? "Marcar Pagado" : "Mark Paid"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  const renderGoalsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {language === "es" ? "Metas" : "Goals"}
        </h3>
        <Button 
          onClick={() => setIsGoalDialogOpen(true)}
          data-testid="button-create-goal"
        >
          <Plus className="mr-2 h-4 w-4" />
          {language === "es" ? "Nueva Meta" : "New Goal"}
        </Button>
      </div>

      {goalsLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {language === "es" ? "No hay metas configuradas" : "No goals configured"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const seller = sellers.find(s => s.userId === goal.sellerId);
            return (
              <Card key={goal.id} data-testid={`goal-card-${goal.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {GOAL_TYPE_LABELS[language][goal.goalType] || goal.goalType}
                      </CardTitle>
                      <CardDescription>
                        {seller?.user 
                          ? `${seller.user.firstName} ${seller.user.lastName}`
                          : language === "es" ? "Equipo" : "Team"
                        }
                      </CardDescription>
                    </div>
                    <Badge variant={goal.isActive ? "default" : "secondary"}>
                      {goal.isActive 
                        ? (language === "es" ? "Activa" : "Active")
                        : (language === "es" ? "Inactiva" : "Inactive")
                      }
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {language === "es" ? "Progreso" : "Progress"}
                      </span>
                      <span className="font-medium">
                        {goal.progress} / {goal.target}
                      </span>
                    </div>
                    <Progress 
                      value={goal.progressPercent} 
                      className={`h-3 ${goal.progressPercent >= 100 ? "[&>div]:bg-green-500" : ""}`} 
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {format(new Date(goal.startDate), "d MMM", { locale: dateLocale })} - 
                      {format(new Date(goal.endDate), "d MMM yyyy", { locale: dateLocale })}
                    </span>
                    <span className={goal.progressPercent >= 100 ? "text-green-600 font-medium" : ""}>
                      {goal.progressPercent}% {goal.progressPercent >= 100 && "✓"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-3 gap-2 flex-wrap justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditGoal(goal)}
                    data-testid={`button-edit-goal-${goal.id}`}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {language === "es" ? "Editar" : "Edit"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(language === "es" ? "¿Eliminar esta meta?" : "Delete this goal?")) {
                        deleteGoalMutation.mutate(goal.id);
                      }
                    }}
                    data-testid={`button-delete-goal-${goal.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                    {language === "es" ? "Eliminar" : "Delete"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderRatesTab = () => {
    // Query for commission defaults
    const { data: commissionDefaults = [], isLoading: defaultsLoading } = useQuery<CommissionDefault[]>({
      queryKey: ["/api/external/seller-commission-rates/defaults"],
    });

    // Query for commission overrides
    const { data: commissionOverrides = [], isLoading: overridesLoading } = useQuery<CommissionOverride[]>({
      queryKey: ["/api/external/seller-commission-rates/overrides"],
    });

    // Query for agency sellers
    const { data: agencySellers = [] } = useQuery<AgencySeller[]>({
      queryKey: ["/api/external/agency-sellers"],
    });

    const [editingDefaultId, setEditingDefaultId] = useState<string | null>(null);
    const [editingRate, setEditingRate] = useState<string>("");
    const [isAddOverrideOpen, setIsAddOverrideOpen] = useState(false);
    const [newOverride, setNewOverride] = useState({
      concept: "rental_no_referral",
      overrideType: "role" as "role" | "user",
      roleValue: "external_agency_seller",
      targetUserId: "",
      rate: "",
      notes: ""
    });

    // Update default rate mutation
    const updateDefaultMutation = useMutation({
      mutationFn: async (data: { concept: string; rate: number }) => {
        return apiRequest("/api/external/seller-commission-rates/defaults", {
          method: "PUT",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" }
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/external/seller-commission-rates/defaults"] });
        toast({
          title: language === "es" ? "Porcentaje actualizado" : "Rate updated",
          description: language === "es" ? "El porcentaje por defecto ha sido actualizado" : "Default rate has been updated"
        });
        setEditingDefaultId(null);
      },
      onError: (error: Error) => {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    });

    // Create override mutation
    const createOverrideMutation = useMutation({
      mutationFn: async (data: typeof newOverride) => {
        return apiRequest("/api/external/seller-commission-rates/overrides", {
          method: "POST",
          body: JSON.stringify({
            ...data,
            rate: parseFloat(data.rate)
          }),
          headers: { "Content-Type": "application/json" }
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/external/seller-commission-rates/overrides"] });
        toast({
          title: language === "es" ? "Excepción creada" : "Override created",
          description: language === "es" ? "La excepción de porcentaje ha sido creada" : "Rate override has been created"
        });
        setIsAddOverrideOpen(false);
        setNewOverride({
          concept: "rental_no_referral",
          overrideType: "role",
          roleValue: "external_agency_seller",
          targetUserId: "",
          rate: "",
          notes: ""
        });
      },
      onError: (error: Error) => {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    });

    // Delete override mutation
    const deleteOverrideMutation = useMutation({
      mutationFn: async (id: string) => {
        return apiRequest(`/api/external/seller-commission-rates/overrides/${id}`, {
          method: "DELETE"
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/external/seller-commission-rates/overrides"] });
        toast({
          title: language === "es" ? "Excepción eliminada" : "Override deleted",
          description: language === "es" ? "La excepción ha sido eliminada" : "Override has been deleted"
        });
      },
      onError: (error: Error) => {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    });

    const handleSaveDefault = (concept: string) => {
      const rate = parseFloat(editingRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        toast({
          title: language === "es" ? "Error" : "Error",
          description: language === "es" ? "Ingresa un porcentaje válido (0-100)" : "Enter a valid percentage (0-100)",
          variant: "destructive"
        });
        return;
      }
      updateDefaultMutation.mutate({ concept, rate });
    };

    return (
      <div className="space-y-6">
        {/* Agency Default Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              {language === "es" ? "Porcentajes por Defecto" : "Default Rates"}
            </CardTitle>
            <CardDescription>
              {language === "es" 
                ? "Porcentajes de comisión que aplican a todos los vendedores por defecto"
                : "Commission percentages that apply to all sellers by default"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {defaultsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {commissionDefaults.map((d) => (
                  <Card key={d.concept} className="bg-muted/30" data-testid={`card-default-${d.concept}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">
                            {COMMISSION_CONCEPTS[language][d.concept] || d.concept}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === "es" ? "Porcentaje del vendedor" : "Seller percentage"}
                          </p>
                        </div>
                        {editingDefaultId === d.concept ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              value={editingRate}
                              onChange={(e) => setEditingRate(e.target.value)}
                              className="w-20 h-9"
                              data-testid={`input-rate-${d.concept}`}
                            />
                            <span className="text-sm">%</span>
                            <Button
                              size="sm"
                              onClick={() => handleSaveDefault(d.concept)}
                              disabled={updateDefaultMutation.isPending}
                              data-testid={`button-save-${d.concept}`}
                            >
                              {language === "es" ? "Guardar" : "Save"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingDefaultId(null)}
                              data-testid={`button-cancel-${d.concept}`}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-lg px-3 py-1">
                              {parseFloat(d.rate)}%
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingDefaultId(d.concept);
                                setEditingRate(d.rate);
                              }}
                              data-testid={`button-edit-${d.concept}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rate Overrides */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {language === "es" ? "Excepciones de Porcentaje" : "Rate Overrides"}
                </CardTitle>
                <CardDescription>
                  {language === "es" 
                    ? "Porcentajes personalizados por rol o vendedor específico"
                    : "Custom rates by role or specific seller"
                  }
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddOverrideOpen(true)} data-testid="button-add-override">
                <Plus className="mr-2 h-4 w-4" />
                {language === "es" ? "Agregar" : "Add"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {overridesLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : commissionOverrides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{language === "es" ? "No hay excepciones configuradas" : "No overrides configured"}</p>
                <p className="text-sm mt-1">
                  {language === "es" 
                    ? "Todos los vendedores usan los porcentajes por defecto"
                    : "All sellers use default rates"
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "es" ? "Concepto" : "Concept"}</TableHead>
                    <TableHead>{language === "es" ? "Aplica a" : "Applies to"}</TableHead>
                    <TableHead className="text-right">{language === "es" ? "Porcentaje" : "Rate"}</TableHead>
                    <TableHead>{language === "es" ? "Notas" : "Notes"}</TableHead>
                    <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionOverrides.map((o) => (
                    <TableRow key={o.id} data-testid={`row-override-${o.id}`}>
                      <TableCell className="font-medium">
                        {COMMISSION_CONCEPTS[language][o.concept] || o.concept}
                      </TableCell>
                      <TableCell>
                        {o.overrideType === "role" ? (
                          <Badge variant="outline">
                            {ROLE_LABELS[language][o.roleValue || ""] || o.roleValue}
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={o.user?.profileImageUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {o.user ? `${o.user.firstName?.[0] || ""}${o.user.lastName?.[0] || ""}` : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {o.user ? `${o.user.firstName} ${o.user.lastName}` : o.userId}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{parseFloat(o.rate)}%</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {o.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(language === "es" ? "¿Eliminar esta excepción?" : "Delete this override?")) {
                              deleteOverrideMutation.mutate(o.id);
                            }
                          }}
                          data-testid={`button-delete-override-${o.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Override Dialog */}
        <Dialog open={isAddOverrideOpen} onOpenChange={setIsAddOverrideOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === "es" ? "Agregar Excepción de Porcentaje" : "Add Rate Override"}
              </DialogTitle>
              <DialogDescription>
                {language === "es" 
                  ? "Define un porcentaje personalizado para un rol o vendedor específico"
                  : "Define a custom rate for a specific role or seller"
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{language === "es" ? "Concepto" : "Concept"}</Label>
                <Select
                  value={newOverride.concept}
                  onValueChange={(v) => setNewOverride(prev => ({ ...prev, concept: v }))}
                >
                  <SelectTrigger data-testid="select-concept">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COMMISSION_CONCEPTS[language]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === "es" ? "Tipo de Excepción" : "Override Type"}</Label>
                <Select
                  value={newOverride.overrideType}
                  onValueChange={(v: "role" | "user") => setNewOverride(prev => ({ ...prev, overrideType: v }))}
                >
                  <SelectTrigger data-testid="select-override-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="role">{language === "es" ? "Por Rol" : "By Role"}</SelectItem>
                    <SelectItem value="user">{language === "es" ? "Por Vendedor" : "By Seller"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newOverride.overrideType === "role" ? (
                <div className="space-y-2">
                  <Label>{language === "es" ? "Rol" : "Role"}</Label>
                  <Select
                    value={newOverride.roleValue}
                    onValueChange={(v) => setNewOverride(prev => ({ ...prev, roleValue: v }))}
                  >
                    <SelectTrigger data-testid="select-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="external_agency_seller">
                        {language === "es" ? "Vendedor" : "Seller"}
                      </SelectItem>
                      <SelectItem value="external_agency_admin">
                        {language === "es" ? "Administrador" : "Administrator"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{language === "es" ? "Vendedor" : "Seller"}</Label>
                  <Select
                    value={newOverride.targetUserId}
                    onValueChange={(v) => setNewOverride(prev => ({ ...prev, targetUserId: v }))}
                  >
                    <SelectTrigger data-testid="select-seller">
                      <SelectValue placeholder={language === "es" ? "Seleccionar vendedor" : "Select seller"} />
                    </SelectTrigger>
                    <SelectContent>
                      {agencySellers.map((seller) => (
                        <SelectItem key={seller.id} value={seller.id}>
                          {seller.firstName} {seller.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>{language === "es" ? "Porcentaje (%)" : "Percentage (%)"}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={newOverride.rate}
                  onChange={(e) => setNewOverride(prev => ({ ...prev, rate: e.target.value }))}
                  placeholder="50"
                  data-testid="input-override-rate"
                />
              </div>

              <div className="space-y-2">
                <Label>{language === "es" ? "Notas (opcional)" : "Notes (optional)"}</Label>
                <Textarea
                  value={newOverride.notes}
                  onChange={(e) => setNewOverride(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={language === "es" ? "Razón de la excepción..." : "Reason for override..."}
                  data-testid="input-override-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddOverrideOpen(false)}
                data-testid="button-cancel-override"
              >
                {language === "es" ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                onClick={() => createOverrideMutation.mutate(newOverride)}
                disabled={createOverrideMutation.isPending || !newOverride.rate || (newOverride.overrideType === "user" && !newOverride.targetUserId)}
                data-testid="button-save-override"
              >
                {createOverrideMutation.isPending 
                  ? (language === "es" ? "Guardando..." : "Saving...")
                  : (language === "es" ? "Guardar" : "Save")
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate" data-testid="text-page-title">
            {language === "es" ? "Gestión de Vendedores" : "Sellers Management"}
          </h1>
          {!isMobile && (
            <p className="text-sm text-muted-foreground">
              {language === "es" 
                ? "Gestiona tu equipo de ventas, comisiones y metas"
                : "Manage your sales team, commissions and goals"}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/external/sellers"] });
            queryClient.invalidateQueries({ queryKey: ["/api/external/sellers-leaderboard"] });
            queryClient.invalidateQueries({ queryKey: ["/api/external/commissions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/external/payouts"] });
            queryClient.invalidateQueries({ queryKey: ["/api/external/goals"] });
          }}
          data-testid="button-refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            {!isMobile && (language === "es" ? "General" : "Overview")}
          </TabsTrigger>
          <TabsTrigger value="sellers" data-testid="tab-sellers">
            <Users className="h-4 w-4 mr-2" />
            {!isMobile && (language === "es" ? "Vendedores" : "Sellers")}
          </TabsTrigger>
          <TabsTrigger value="commissions" data-testid="tab-commissions">
            <Wallet className="h-4 w-4 mr-2" />
            {!isMobile && (language === "es" ? "Comisiones" : "Commissions")}
          </TabsTrigger>
          <TabsTrigger value="payouts" data-testid="tab-payouts">
            <CreditCard className="h-4 w-4 mr-2" />
            {!isMobile && (language === "es" ? "Pagos" : "Payouts")}
          </TabsTrigger>
          <TabsTrigger value="goals" data-testid="tab-goals">
            <Target className="h-4 w-4 mr-2" />
            {!isMobile && (language === "es" ? "Metas" : "Goals")}
          </TabsTrigger>
          <TabsTrigger value="rates" data-testid="tab-rates">
            <Percent className="h-4 w-4 mr-2" />
            {!isMobile && (language === "es" ? "Porcentajes" : "Rates")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="sellers" className="mt-6">
          {renderSellersTab()}
        </TabsContent>

        <TabsContent value="commissions" className="mt-6">
          {renderCommissionsTab()}
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          {renderPayoutsTab()}
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          {renderGoalsTab()}
        </TabsContent>

        <TabsContent value="rates" className="mt-6">
          {renderRatesTab()}
        </TabsContent>
      </Tabs>

      {/* Enhanced Seller Detail Dialog with Tabs */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedSeller?.user?.profileImageUrl || undefined} />
                <AvatarFallback>
                  {selectedSeller?.user 
                    ? `${selectedSeller.user.firstName?.[0] || ""}${selectedSeller.user.lastName?.[0] || ""}`.toUpperCase()
                    : "?"
                  }
                </AvatarFallback>
              </Avatar>
              <div>
                {selectedSeller?.user 
                  ? `${selectedSeller.user.firstName} ${selectedSeller.user.lastName}`
                  : language === "es" ? "Detalles del Vendedor" : "Seller Details"
                }
              </div>
              {selectedSeller && getStatusBadge(selectedSeller.status)}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {selectedSeller?.user?.email}
              {selectedSeller?.hireDate && (
                <span className="text-xs">
                  • {language === "es" ? "Desde" : "Since"}: {format(new Date(selectedSeller.hireDate), "MMM yyyy", { locale: dateLocale })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSeller && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" data-testid="tab-seller-overview">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {language === "es" ? "Resumen" : "Overview"}
                </TabsTrigger>
                <TabsTrigger value="timeline" data-testid="tab-seller-timeline">
                  <Clock className="h-4 w-4 mr-2" />
                  {language === "es" ? "Historial" : "Timeline"}
                </TabsTrigger>
                <TabsTrigger value="goals" data-testid="tab-seller-goals">
                  <Target className="h-4 w-4 mr-2" />
                  {language === "es" ? "Metas" : "Goals"}
                </TabsTrigger>
                <TabsTrigger value="commissions" data-testid="tab-seller-commissions">
                  <DollarSign className="h-4 w-4 mr-2" />
                  {language === "es" ? "Comisiones" : "Commissions"}
                </TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{selectedSeller.stats.totalLeads}</div>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Total Leads" : "Total Leads"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{selectedSeller.stats.convertedLeads}</div>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Convertidos" : "Converted"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{selectedSeller.stats.totalContracts}</div>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Contratos" : "Contracts"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{formatCurrency(selectedSeller.stats.totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Ingresos" : "Revenue"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{formatCurrency(selectedSeller.stats.totalCommissions)}</div>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Comisiones" : "Commissions"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className={`text-2xl font-bold ${selectedSeller.stats.unpaidCommissions > 0 ? "text-amber-600" : ""}`}>
                        {formatCurrency(selectedSeller.stats.unpaidCommissions)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {language === "es" ? "Por Pagar" : "Unpaid"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Conversion Rate */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {language === "es" ? "Tasa de Conversión" : "Conversion Rate"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Progress 
                        value={selectedSeller.stats.totalLeads > 0 
                          ? (selectedSeller.stats.convertedLeads / selectedSeller.stats.totalLeads) * 100 
                          : 0
                        } 
                        className="flex-1"
                      />
                      <span className="text-lg font-bold">
                        {selectedSeller.stats.totalLeads > 0 
                          ? Math.round((selectedSeller.stats.convertedLeads / selectedSeller.stats.totalLeads) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {selectedSeller.notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {language === "es" ? "Notas" : "Notes"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{selectedSeller.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Timeline Tab */}
              <TabsContent value="timeline" className="mt-4">
                <SellerTimelineContent 
                  sellerId={selectedSeller.id}
                  language={language}
                  dateLocale={dateLocale}
                  formatCurrency={formatCurrency}
                />
              </TabsContent>
              
              {/* Goals Tab */}
              <TabsContent value="goals" className="mt-4">
                <SellerGoalsContent 
                  sellerId={selectedSeller.id}
                  userId={selectedSeller.userId}
                  language={language}
                  dateLocale={dateLocale}
                />
              </TabsContent>
              
              {/* Commissions Tab */}
              <TabsContent value="commissions" className="mt-4">
                <SellerCommissionsContent 
                  sellerId={selectedSeller.id}
                  userId={selectedSeller.userId}
                  language={language}
                  dateLocale={dateLocale}
                  formatCurrency={formatCurrency}
                />
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              {language === "es" ? "Cerrar" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Creation/Edit Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={(open) => {
        if (!open) resetGoalForm();
        setIsGoalDialogOpen(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGoal 
                ? (language === "es" ? "Editar Meta" : "Edit Goal")
                : (language === "es" ? "Nueva Meta" : "New Goal")
              }
            </DialogTitle>
            <DialogDescription>
              {editingGoal 
                ? (language === "es" ? "Actualiza los detalles de la meta" : "Update goal details")
                : (language === "es" ? "Crea una nueva meta para un vendedor" : "Create a new goal for a seller")
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "es" ? "Vendedor" : "Seller"}</Label>
              <Select
                value={goalFormData.sellerId || "_team"}
                onValueChange={(value) => setGoalFormData(prev => ({ 
                  ...prev, 
                  sellerId: value === "_team" ? "" : value 
                }))}
              >
                <SelectTrigger data-testid="select-goal-seller">
                  <SelectValue placeholder={language === "es" ? "Seleccionar vendedor" : "Select seller"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_team">
                    {language === "es" ? "Meta de Equipo" : "Team Goal"}
                  </SelectItem>
                  {sellers.map(seller => (
                    <SelectItem key={seller.userId} value={seller.userId}>
                      {seller.user ? `${seller.user.firstName} ${seller.user.lastName}` : seller.userId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === "es" ? "Tipo de Meta" : "Goal Type"}</Label>
              <Select
                value={goalFormData.goalType}
                onValueChange={(value) => setGoalFormData(prev => ({ ...prev, goalType: value }))}
              >
                <SelectTrigger data-testid="select-goal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads">{language === "es" ? "Leads" : "Leads"}</SelectItem>
                  <SelectItem value="conversions">{language === "es" ? "Conversiones" : "Conversions"}</SelectItem>
                  <SelectItem value="revenue">{language === "es" ? "Ingresos" : "Revenue"}</SelectItem>
                  <SelectItem value="showings">{language === "es" ? "Visitas" : "Showings"}</SelectItem>
                  <SelectItem value="contracts">{language === "es" ? "Contratos" : "Contracts"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === "es" ? "Objetivo" : "Target"}</Label>
              <Input
                type="number"
                min={1}
                value={goalFormData.target}
                onChange={(e) => setGoalFormData(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                data-testid="input-goal-target"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{language === "es" ? "Fecha Inicio" : "Start Date"}</Label>
                <Input
                  type="date"
                  value={goalFormData.startDate}
                  onChange={(e) => setGoalFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  data-testid="input-goal-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "es" ? "Fecha Fin" : "End Date"}</Label>
                <Input
                  type="date"
                  value={goalFormData.endDate}
                  onChange={(e) => setGoalFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  data-testid="input-goal-end-date"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="goalActive"
                checked={goalFormData.isActive}
                onChange={(e) => setGoalFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="goalActive" className="cursor-pointer">
                {language === "es" ? "Meta Activa" : "Active Goal"}
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                resetGoalForm();
                setIsGoalDialogOpen(false);
              }}
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              onClick={handleSubmitGoal}
              disabled={createGoalMutation.isPending || updateGoalMutation.isPending || goalFormData.target < 1}
              data-testid="button-submit-goal"
            >
              {(createGoalMutation.isPending || updateGoalMutation.isPending) && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingGoal 
                ? (language === "es" ? "Actualizar" : "Update")
                : (language === "es" ? "Crear" : "Create")
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
