import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, DollarSign, Wrench, Calendar as CalIcon, User, Clock, AlertCircle, FileText, Filter, Eye, EyeOff, ChevronDown, ChevronUp, Home, List, Zap, Droplet, Wifi, Flame, Receipt } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, isSameDay, isWithinInterval, addDays, startOfDay, isToday } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ExternalPayment, ExternalMaintenanceTicket, SelectUser, ExternalRentalContract, ExternalPaymentSchedule } from "@shared/schema";
import { TodayView } from "./external-calendar/TodayView";
import { AgendaView } from "./external-calendar/AgendaView";

type EventData = {
  type: 'payment' | 'ticket' | 'contract' | 'service';
  title: string;
  time: string;
  status: string;
  priority?: string;
  serviceType?: string;
  data: ExternalPayment | ExternalMaintenanceTicket | ExternalRentalContract | ExternalPaymentSchedule;
  condominium: string;
  unitNumber: string;
  tenantName?: string;
};

export default function ExternalCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [expandedEventIndex, setExpandedEventIndex] = useState<number | null>(null);
  const [selectedCondominium, setSelectedCondominium] = useState<string>("all");
  const [showPayments, setShowPayments] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [showTickets, setShowTickets] = useState(true);
  const [showContracts, setShowContracts] = useState(true);
  const [showCheckOut, setShowCheckOut] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "today" | "agenda" | "option1" | "option2" | "option3">("calendar");
  const [eventPage, setEventPage] = useState(0);
  const { language } = useLanguage();
  
  const EVENTS_PER_PAGE = 5;

  // Reset event page when date changes
  useEffect(() => {
    setEventPage(0);
    setExpandedEventIndex(null);
  }, [selectedDate]);

  // Fetch payments
  const { data: payments = [] } = useQuery<ExternalPayment[]>({
    queryKey: ["/api/external-payments"],
  });

  // Fetch all payment schedules (services)
  const { data: allPaymentSchedules = [] } = useQuery<ExternalPaymentSchedule[]>({
    queryKey: ['/api/external-payment-schedules'],
    queryFn: async () => {
      const response = await fetch('/api/external-payment-schedules', { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch maintenance tickets
  const { data: tickets = [] } = useQuery<ExternalMaintenanceTicket[]>({
    queryKey: ["/api/external-tickets"],
  });

  // Fetch units for ticket details
  const { data: units = [] } = useQuery<any[]>({
    queryKey: ["/api/external-units"],
  });

  // Fetch condominiums for filtering
  const { data: condominiums = [] } = useQuery<any[]>({
    queryKey: ["/api/external-condominiums"],
  });

  // Fetch owners for payment details
  const { data: owners = [] } = useQuery<any[]>({
    queryKey: ["/api/external-owners"],
  });

  // Fetch rental contracts for tenant info
  const { data: contracts = [] } = useQuery<any[]>({
    queryKey: ["/api/external-rental-contracts"],
  });

  // Fetch users for assignment details
  const { data: users = [] } = useQuery<SelectUser[]>({
    queryKey: ["/api/external-agency-users"],
  });

  // Normalize rental contracts (handle both nested and flat structures)
  // Preserve unit and condominium metadata when present
  const normalizedContracts = useMemo(() => {
    return (contracts ?? []).map((item: any) => {
      if ('contract' in item) {
        // Already has nested structure with unit/condominium
        return item;
      } else {
        // Flat structure - look up unit and condominium
        const unit = units?.find((u: any) => u.id === item.unitId);
        const condominium = condominiums?.find((c: any) => c.id === unit?.condominiumId);
        return { contract: item, unit: unit || null, condominium: condominium || null };
      }
    });
  }, [contracts, units, condominiums]);

  // Helper function to get unitId from contractId
  const getUnitIdFromContract = (contractId: string | undefined) => {
    if (!contractId) return undefined;
    const contractItem = normalizedContracts.find((item: any) => 
      (item.contract?.id === contractId) || (item.id === contractId)
    );
    return contractItem?.contract?.unitId || contractItem?.unitId;
  };

  // Helper function to get condominium name from unitId
  const getCondominiumInfo = (unitId: string | undefined) => {
    if (!unitId) return { condominium: '', unitNumber: '' };
    const unit = units.find(u => u.id === unitId);
    if (!unit) return { condominium: '', unitNumber: '' };
    const condo = condominiums.find(c => c.id === unit.condominiumId);
    return {
      condominium: condo?.name || (language === "es" ? "Sin condominio" : "No condominium"),
      unitNumber: unit.unitNumber || ''
    };
  };

  // Helper function to get condominium info from contractId
  const getCondominiumInfoFromContract = (contractId: string | undefined) => {
    const unitId = getUnitIdFromContract(contractId);
    return getCondominiumInfo(unitId);
  };

  // Filter payments and tickets by condominium
  const filteredPayments = useMemo(() => {
    if (selectedCondominium === "all") return payments;
    return payments.filter((p) => {
      const unitId = getUnitIdFromContract(p.contractId);
      const unit = units.find(u => u.id === unitId);
      return unit?.condominiumId === selectedCondominium;
    });
  }, [payments, units, selectedCondominium, normalizedContracts]);

  // Filter payment schedules (services) by condominium
  const filteredServices = useMemo(() => {
    if (selectedCondominium === "all") return allPaymentSchedules;
    return allPaymentSchedules.filter((s: any) => {
      const unit = units.find(u => u.id === s.unitId);
      return unit?.condominiumId === selectedCondominium;
    });
  }, [allPaymentSchedules, units, selectedCondominium]);

  const filteredTickets = useMemo(() => {
    if (selectedCondominium === "all") return tickets;
    return tickets.filter((t) => {
      const unit = units.find(u => u.id === t.unitId);
      return unit?.condominiumId === selectedCondominium;
    });
  }, [tickets, units, selectedCondominium]);

  // Filter contracts by condominium
  const filteredContracts = useMemo(() => {
    if (selectedCondominium === "all") return normalizedContracts;
    return normalizedContracts.filter((item: any) => {
      // Use unit from normalized data if available, otherwise look up
      const unit = item.unit || units.find(u => u.id === item.contract.unitId);
      return unit?.condominiumId === selectedCondominium;
    });
  }, [normalizedContracts, units, selectedCondominium]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const next30Days = addDays(now, 30);

    const pendingPayments = filteredPayments.filter(
      (p) => p.dueDate && 
      p.serviceType === 'rent' &&
      p.status === "pending" && 
      new Date(p.dueDate) >= startOfDay(now) &&
      new Date(p.dueDate) <= next30Days
    ).length;

    const scheduledTickets = filteredTickets.filter(
      (t) => t.scheduledDate && 
      (t.status === "open" || t.status === "in_progress") &&
      new Date(t.scheduledDate) >= startOfDay(now)
    ).length;

    // Count events separately to avoid mixing different data structures
    const paymentsThisMonth = showPayments ? filteredPayments.filter((p) => {
      if (!p.dueDate || p.serviceType !== 'rent') return false;
      const date = new Date(p.dueDate);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length : 0;

    const servicePaymentsThisMonth = showServices ? filteredPayments.filter((p) => {
      if (!p.dueDate || p.serviceType === 'rent') return false;
      const date = new Date(p.dueDate);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length : 0;
    
    const ticketsThisMonth = showTickets ? filteredTickets.filter((t) => {
      if (!t.scheduledDate) return false;
      const date = new Date(t.scheduledDate);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length : 0;
    
    const contractsThisMonth = showContracts ? filteredContracts.filter((item: any) => {
      if (!item.contract.startDate) return false;
      const date = new Date(item.contract.startDate);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length : 0;

    const servicesThisMonth = showServices ? filteredServices.filter((s: ExternalPaymentSchedule) => {
      if (!s.dueDate) return false;
      const date = new Date(s.dueDate);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length : 0;
    
    const thisMonthEvents = paymentsThisMonth + servicePaymentsThisMonth + servicesThisMonth + ticketsThisMonth + contractsThisMonth;

    return { pendingPayments, scheduledTickets, thisMonthEvents };
  }, [filteredPayments, filteredServices, filteredTickets, filteredContracts, showPayments, showServices, showTickets, showContracts]);

  // Translate status helper
  const translateStatus = (status: string): string => {
    if (language === "es") {
      switch(status) {
        case 'pending': return 'Pendiente';
        case 'paid': return 'Pagado';
        case 'overdue': return 'Vencido';
        case 'open': return 'Abierto';
        case 'in_progress': return 'En Progreso';
        case 'completed': return 'Completado';
        case 'cancelled': return 'Cancelado';
        case 'active': return 'Activo';
        case 'closed': return 'Cerrado';
        default: return status;
      }
    }
    return status;
  };

  // Translate priority helper
  const translatePriority = (priority: string): string => {
    if (language === "es") {
      switch(priority) {
        case 'low': return 'Baja';
        case 'medium': return 'Media';
        case 'high': return 'Alta';
        default: return priority;
      }
    }
    return priority;
  };

  // Translate category helper
  const translateCategory = (category: string): string => {
    if (language === "es") {
      switch(category) {
        case 'plumbing': return 'Plomería';
        case 'electrical': return 'Eléctrico';
        case 'hvac': return 'Climatización';
        case 'appliance': return 'Electrodomésticos';
        case 'structural': return 'Estructural';
        case 'cleaning': return 'Limpieza';
        case 'painting': return 'Pintura';
        case 'landscaping': return 'Jardinería';
        case 'pest_control': return 'Control de Plagas';
        case 'security': return 'Seguridad';
        case 'other': return 'Otro';
        default: return category;
      }
    }
    return category;
  };

  // Get events for selected date
  const eventsForDate = useMemo((): EventData[] => {
    if (!selectedDate) return [];

    // Separate rent payments from service payments
    const dayPayments = showPayments && units.length > 0 && condominiums.length > 0 ? filteredPayments
      .filter((p) => p.dueDate && isSameDay(new Date(p.dueDate), selectedDate) && p.serviceType === 'rent')
      .map((p) => {
        const { condominium, unitNumber } = getCondominiumInfoFromContract(p.contractId);
        const contractItem = normalizedContracts.find((item: any) => 
          (item.contract?.id === p.contractId) || (item.id === p.contractId)
        );
        const tenantName = contractItem?.contract?.tenantName || contractItem?.tenantName || '';
        
        return {
          type: 'payment' as const,
          title: `${condominium} - ${unitNumber} - ${language === "es" ? "Renta" : "Rent"}${tenantName ? ` (${tenantName})` : ''}`,
          time: '',
          status: p.status,
          data: p,
          condominium,
          unitNumber,
          tenantName,
        };
      }) : [];

    // Service payments from ExternalPayment table (non-rent)
    const dayServicePayments = showServices && units.length > 0 && condominiums.length > 0 ? filteredPayments
      .filter((p) => p.dueDate && isSameDay(new Date(p.dueDate), selectedDate) && p.serviceType !== 'rent')
      .map((p) => {
        const { condominium, unitNumber } = getCondominiumInfoFromContract(p.contractId);
        const serviceTypeLabel = language === "es"
          ? (p.serviceType === 'electricity' ? 'Electricidad' :
             p.serviceType === 'water' ? 'Agua' :
             p.serviceType === 'internet' ? 'Internet' :
             p.serviceType === 'gas' ? 'Gas' : p.serviceType)
          : p.serviceType;
        
        const responsiblePerson = language === "es" ? "Propietario" : "Owner";
        
        return {
          type: 'service' as const,
          title: `${condominium} - ${unitNumber} - ${serviceTypeLabel} (${responsiblePerson})`,
          time: '',
          status: p.status,
          serviceType: p.serviceType,
          data: p,
          condominium,
          unitNumber,
        };
      }) : [];

    // Add service payments - only include if dueDate exists
    const dayServices = showServices ? filteredServices
      .filter((s: ExternalPaymentSchedule) => s.dueDate && isSameDay(new Date(s.dueDate), selectedDate))
      .map((s: ExternalPaymentSchedule) => {
        const { condominium, unitNumber } = getCondominiumInfo(s.unitId);
        const serviceTypeLabel = language === "es"
          ? (s.serviceType === 'electricity' ? 'Electricidad' :
             s.serviceType === 'water' ? 'Agua' :
             s.serviceType === 'internet' ? 'Internet' :
             s.serviceType === 'gas' ? 'Gas' : s.serviceType || 'Servicio')
          : s.serviceType || 'Service';
        
        // Services are typically paid by owner
        const responsiblePerson = language === "es" ? "Propietario" : "Owner";
        
        return {
          type: 'service' as const,
          title: `${condominium} - ${unitNumber} - ${serviceTypeLabel} (${responsiblePerson})`,
          time: '',  // No time for services
          status: s.status,
          serviceType: s.serviceType,
          data: s,
          condominium,
          unitNumber,
        };
      }) : [];

    const dayTickets = showTickets && units.length > 0 && condominiums.length > 0 ? filteredTickets
      .filter((t) => t.scheduledDate && isSameDay(new Date(t.scheduledDate), selectedDate))
      .map((t) => {
        const { condominium, unitNumber } = getCondominiumInfo(t.unitId);
        return {
          type: 'ticket' as const,
          title: `${condominium} - ${unitNumber} - ${t.title}`,
          time: format(new Date(t.scheduledDate!), 'HH:mm'),
          status: t.status,
          priority: t.priority,
          data: t,
          condominium,
          unitNumber,
        };
      }) : [];

    // Add contract start dates as events - only include if startDate exists
    const dayContracts = showContracts && units.length > 0 && condominiums.length > 0 ? filteredContracts
      .filter((item: any) => item.contract.startDate && isSameDay(new Date(item.contract.startDate), selectedDate))
      .map((item: any) => {
        // Use condominium and unit from normalized data if available
        const condominium = item.condominium?.name || getCondominiumInfo(item.contract.unitId).condominium;
        const unitNumber = item.unit?.unitNumber || getCondominiumInfo(item.contract.unitId).unitNumber;
        return {
          type: 'contract' as const,
          title: language === "es" 
            ? `${condominium} - ${unitNumber} - Inicio de Renta: ${item.contract.tenantName}`
            : `${condominium} - ${unitNumber} - Rental Start: ${item.contract.tenantName}`,
          time: format(new Date(item.contract.startDate!), 'HH:mm'),
          status: item.contract.status,
          data: item.contract,
          condominium,
          unitNumber,
        };
      }) : [];

    return [...dayPayments, ...dayServicePayments, ...dayServices, ...dayTickets, ...dayContracts].sort((a, b) => 
      a.time.localeCompare(b.time)
    );
  }, [selectedDate, filteredPayments, filteredServices, filteredTickets, filteredContracts, language, units, condominiums, normalizedContracts, showPayments, showServices, showTickets, showContracts]);

  // Events for today (for TodayView)
  const eventsForToday = useMemo((): EventData[] => {
    const today = new Date();
    
    // Separate rent payments from service payments
    const todayPayments = showPayments && units.length > 0 && condominiums.length > 0 ? filteredPayments
      .filter((p) => p.dueDate && isSameDay(new Date(p.dueDate), today) && p.serviceType === 'rent')
      .map((p) => {
        const { condominium, unitNumber } = getCondominiumInfoFromContract(p.contractId);
        const contractItem = normalizedContracts.find((item: any) => 
          (item.contract?.id === p.contractId) || (item.id === p.contractId)
        );
        const tenantName = contractItem?.contract?.tenantName || contractItem?.tenantName || '';
        
        return {
          type: 'payment' as const,
          title: `${condominium} - ${unitNumber} - ${language === "es" ? "Renta" : "Rent"}${tenantName ? ` (${tenantName})` : ''}`,
          time: '',
          status: p.status,
          data: p,
          condominium,
          unitNumber,
          tenantName,
        };
      }) : [];

    // Service payments from ExternalPayment table (non-rent)
    const todayServicePayments = showServices && units.length > 0 && condominiums.length > 0 ? filteredPayments
      .filter((p) => p.dueDate && isSameDay(new Date(p.dueDate), today) && p.serviceType !== 'rent')
      .map((p) => {
        const { condominium, unitNumber } = getCondominiumInfoFromContract(p.contractId);
        const serviceTypeLabel = language === "es"
          ? (p.serviceType === 'electricity' ? 'Electricidad' :
             p.serviceType === 'water' ? 'Agua' :
             p.serviceType === 'internet' ? 'Internet' :
             p.serviceType === 'gas' ? 'Gas' : p.serviceType)
          : p.serviceType;
        
        const responsiblePerson = language === "es" ? "Propietario" : "Owner";
        
        return {
          type: 'service' as const,
          title: `${condominium} - ${unitNumber} - ${serviceTypeLabel} (${responsiblePerson})`,
          time: '',
          status: p.status,
          serviceType: p.serviceType,
          data: p,
          condominium,
          unitNumber,
        };
      }) : [];

    const todayServices = showServices ? filteredServices
      .filter((s: ExternalPaymentSchedule) => s.dueDate && isSameDay(new Date(s.dueDate), today))
      .map((s: ExternalPaymentSchedule) => {
        const { condominium, unitNumber } = getCondominiumInfo(s.unitId);
        const serviceTypeLabel = language === "es"
          ? (s.serviceType === 'electricity' ? 'Electricidad' :
             s.serviceType === 'water' ? 'Agua' :
             s.serviceType === 'internet' ? 'Internet' :
             s.serviceType === 'gas' ? 'Gas' : s.serviceType || 'Servicio')
          : s.serviceType || 'Service';
        
        // Services are typically paid by owner
        const responsiblePerson = language === "es" ? "Propietario" : "Owner";
        
        return {
          type: 'service' as const,
          title: `${condominium} - ${unitNumber} - ${serviceTypeLabel} (${responsiblePerson})`,
          time: '',
          status: s.status,
          serviceType: s.serviceType,
          data: s,
          condominium,
          unitNumber,
        };
      }) : [];

    const todayTickets = showTickets && units.length > 0 && condominiums.length > 0 ? filteredTickets
      .filter((t) => t.scheduledDate && isSameDay(new Date(t.scheduledDate), today))
      .map((t) => {
        const { condominium, unitNumber } = getCondominiumInfo(t.unitId);
        return {
          type: 'ticket' as const,
          title: `${condominium} - ${unitNumber} - ${t.title}`,
          time: format(new Date(t.scheduledDate!), 'HH:mm'),
          status: t.status,
          priority: t.priority,
          data: t,
          condominium,
          unitNumber,
        };
      }) : [];

    const todayContracts = showContracts && units.length > 0 && condominiums.length > 0 ? filteredContracts
      .filter((item: any) => item.contract.startDate && isSameDay(new Date(item.contract.startDate), today))
      .map((item: any) => {
        const condominium = item.condominium?.name || getCondominiumInfo(item.contract.unitId).condominium;
        const unitNumber = item.unit?.unitNumber || getCondominiumInfo(item.contract.unitId).unitNumber;
        return {
          type: 'contract' as const,
          title: language === "es" 
            ? `${condominium} - ${unitNumber} - Inicio de Renta: ${item.contract.tenantName}`
            : `${condominium} - ${unitNumber} - Rental Start: ${item.contract.tenantName}`,
          time: format(new Date(item.contract.startDate!), 'HH:mm'),
          status: item.contract.status,
          data: item.contract,
          condominium,
          unitNumber,
        };
      }) : [];

    return [...todayPayments, ...todayServicePayments, ...todayServices, ...todayTickets, ...todayContracts].sort((a, b) => 
      a.time.localeCompare(b.time)
    );
  }, [filteredPayments, filteredServices, filteredTickets, filteredContracts, language, units, normalizedContracts, showPayments, showServices, showTickets, showContracts]);

  // All events (for AgendaView)
  const allEvents = useMemo((): EventData[] => {
    // Separate rent payments from service payments
    const allPayments = showPayments && units.length > 0 && condominiums.length > 0 ? filteredPayments
      .filter((p) => p.dueDate && p.serviceType === 'rent')
      .map((p) => {
        const { condominium, unitNumber } = getCondominiumInfoFromContract(p.contractId);
        const contractItem = normalizedContracts.find((item: any) => 
          (item.contract?.id === p.contractId) || (item.id === p.contractId)
        );
        const tenantName = contractItem?.contract?.tenantName || contractItem?.tenantName || '';
        
        return {
          type: 'payment' as const,
          title: `${condominium} - ${unitNumber} - ${language === "es" ? "Renta" : "Rent"}${tenantName ? ` (${tenantName})` : ''}`,
          time: '',
          status: p.status,
          data: p,
          condominium,
          unitNumber,
          tenantName,
        };
      }) : [];

    // Service payments from ExternalPayment table (non-rent)
    const allServicePayments = showServices && units.length > 0 && condominiums.length > 0 ? filteredPayments
      .filter((p) => p.dueDate && p.serviceType !== 'rent')
      .map((p) => {
        const { condominium, unitNumber } = getCondominiumInfoFromContract(p.contractId);
        const serviceTypeLabel = language === "es"
          ? (p.serviceType === 'electricity' ? 'Electricidad' :
             p.serviceType === 'water' ? 'Agua' :
             p.serviceType === 'internet' ? 'Internet' :
             p.serviceType === 'gas' ? 'Gas' : p.serviceType)
          : p.serviceType;
        
        const responsiblePerson = language === "es" ? "Propietario" : "Owner";
        
        return {
          type: 'service' as const,
          title: `${condominium} - ${unitNumber} - ${serviceTypeLabel} (${responsiblePerson})`,
          time: '',
          status: p.status,
          serviceType: p.serviceType,
          data: p,
          condominium,
          unitNumber,
        };
      }) : [];

    const allServices = showServices ? filteredServices
      .filter((s: ExternalPaymentSchedule) => s.dueDate)
      .map((s: ExternalPaymentSchedule) => {
        const { condominium, unitNumber } = getCondominiumInfo(s.unitId);
        const serviceTypeLabel = language === "es"
          ? (s.serviceType === 'electricity' ? 'Electricidad' :
             s.serviceType === 'water' ? 'Agua' :
             s.serviceType === 'internet' ? 'Internet' :
             s.serviceType === 'gas' ? 'Gas' : s.serviceType || 'Servicio')
          : s.serviceType || 'Service';
        
        // Services are typically paid by owner
        const responsiblePerson = language === "es" ? "Propietario" : "Owner";
        
        return {
          type: 'service' as const,
          title: `${condominium} - ${unitNumber} - ${serviceTypeLabel} (${responsiblePerson})`,
          time: '',
          status: s.status,
          serviceType: s.serviceType,
          data: s,
          condominium,
          unitNumber,
        };
      }) : [];

    const allTickets = showTickets && units.length > 0 && condominiums.length > 0 ? filteredTickets
      .filter((t) => t.scheduledDate)
      .map((t) => {
        const { condominium, unitNumber } = getCondominiumInfo(t.unitId);
        return {
          type: 'ticket' as const,
          title: `${condominium} - ${unitNumber} - ${t.title}`,
          time: format(new Date(t.scheduledDate!), 'HH:mm'),
          status: t.status,
          priority: t.priority,
          data: t,
          condominium,
          unitNumber,
        };
      }) : [];

    const allContracts = showContracts && units.length > 0 && condominiums.length > 0 ? filteredContracts
      .filter((item: any) => item.contract.startDate)
      .map((item: any) => {
        const condominium = item.condominium?.name || getCondominiumInfo(item.contract.unitId).condominium;
        const unitNumber = item.unit?.unitNumber || getCondominiumInfo(item.contract.unitId).unitNumber;
        return {
          type: 'contract' as const,
          title: language === "es" 
            ? `${condominium} - ${unitNumber} - Inicio de Renta: ${item.contract.tenantName}`
            : `${condominium} - ${unitNumber} - Rental Start: ${item.contract.tenantName}`,
          time: format(new Date(item.contract.startDate!), 'HH:mm'),
          status: item.contract.status,
          data: item.contract,
          condominium,
          unitNumber,
        };
      }) : [];

    return [...allPayments, ...allServicePayments, ...allServices, ...allTickets, ...allContracts];
  }, [filteredPayments, filteredServices, filteredTickets, filteredContracts, language, units, normalizedContracts, showPayments, showServices, showTickets, showContracts]);

  // Get event modifiers for calendar highlighting
  const datesWithPayments = useMemo(() => {
    if (!showPayments) return [];
    return filteredPayments
      .filter((p) => p.dueDate && p.serviceType === 'rent')
      .map((p) => new Date(p.dueDate!));
  }, [filteredPayments, showPayments]);

  const datesWithTickets = useMemo(() => {
    if (!showTickets) return [];
    return filteredTickets
      .filter((t) => t.scheduledDate)
      .map((t) => new Date(t.scheduledDate!));
  }, [filteredTickets, showTickets]);

  const datesWithContracts = useMemo(() => {
    if (!showContracts) return [];
    return filteredContracts
      .filter((item: any) => item.contract.startDate)
      .map((item: any) => new Date(item.contract.startDate));
  }, [filteredContracts, showContracts]);

  // Get events by date for indicators
  const eventsByDate = useMemo(() => {
    const dateMap = new Map<string, { payments: number; services: number; tickets: number; contracts: number }>();
    
    if (showPayments) {
      filteredPayments.forEach((p) => {
        if (!p.dueDate || p.serviceType !== 'rent') return;
        const dateKey = format(new Date(p.dueDate), 'yyyy-MM-dd');
        const current = dateMap.get(dateKey) || { payments: 0, services: 0, tickets: 0, contracts: 0 };
        dateMap.set(dateKey, { ...current, payments: current.payments + 1 });
      });
    }
    
    if (showServices) {
      // Service payments from ExternalPayment (non-rent)
      filteredPayments.forEach((p) => {
        if (!p.dueDate || p.serviceType === 'rent') return;
        const dateKey = format(new Date(p.dueDate), 'yyyy-MM-dd');
        const current = dateMap.get(dateKey) || { payments: 0, services: 0, tickets: 0, contracts: 0 };
        dateMap.set(dateKey, { ...current, services: current.services + 1 });
      });
      
      // Service schedules
      filteredServices.forEach((s: ExternalPaymentSchedule) => {
        if (s.dueDate) {
          const dateKey = format(new Date(s.dueDate), 'yyyy-MM-dd');
          const current = dateMap.get(dateKey) || { payments: 0, services: 0, tickets: 0, contracts: 0 };
          dateMap.set(dateKey, { ...current, services: current.services + 1 });
        }
      });
    }
    
    if (showTickets) {
      filteredTickets.forEach((t) => {
        if (t.scheduledDate) {
          const dateKey = format(new Date(t.scheduledDate), 'yyyy-MM-dd');
          const current = dateMap.get(dateKey) || { payments: 0, services: 0, tickets: 0, contracts: 0 };
          dateMap.set(dateKey, { ...current, tickets: current.tickets + 1 });
        }
      });
    }
    
    if (showContracts) {
      filteredContracts.forEach((item: any) => {
        if (item.contract.startDate) {
          const dateKey = format(new Date(item.contract.startDate), 'yyyy-MM-dd');
          const current = dateMap.get(dateKey) || { payments: 0, services: 0, tickets: 0, contracts: 0 };
          dateMap.set(dateKey, { ...current, contracts: current.contracts + 1 });
        }
      });
    }
    
    return dateMap;
  }, [filteredPayments, filteredServices, filteredTickets, filteredContracts, showPayments, showServices, showTickets, showContracts]);

  return (
    <div className="space-y-4">
      {/* Header Simple */}
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-calendar-title">
          {language === "es" ? "Calendario" : "Calendar"}
        </h1>
      </div>

      {/* Barra Unificada: Condominio + Filtros + Pestañas */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4 pb-4 flex items-center gap-3 flex-wrap">
          {/* Selector de Condominio */}
          <Select value={selectedCondominium} onValueChange={setSelectedCondominium}>
            <SelectTrigger data-testid="select-condominium-filter" className="h-9 w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === "es" ? "Todos los condominios" : "All condominiums"}
              </SelectItem>
              {condominiums.map((condo) => (
                <SelectItem key={condo.id} value={condo.id}>
                  {condo.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Separador */}
          <div className="hidden sm:block h-5 w-px bg-border" />
          
          {/* Filtros de tipo de evento */}
          <div className="flex gap-2 flex-wrap flex-1">
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="filter-payments"
                checked={showPayments}
                onCheckedChange={setShowPayments}
                data-testid="checkbox-filter-payments"
                className="h-4 w-4"
              />
              <Label htmlFor="filter-payments" className="flex items-center gap-1.5 cursor-pointer">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs">{language === "es" ? "Renta" : "Rent"}</span>
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="filter-services"
                checked={showServices}
                onCheckedChange={setShowServices}
                data-testid="checkbox-filter-services"
                className="h-4 w-4"
              />
              <Label htmlFor="filter-services" className="flex items-center gap-1.5 cursor-pointer">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-xs">{language === "es" ? "Servicios" : "Services"}</span>
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="filter-tickets"
                checked={showTickets}
                onCheckedChange={setShowTickets}
                data-testid="checkbox-filter-tickets"
                className="h-4 w-4"
              />
              <Label htmlFor="filter-tickets" className="flex items-center gap-1.5 cursor-pointer">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs">{language === "es" ? "Mant." : "Maint."}</span>
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="filter-contracts"
                checked={showContracts}
                onCheckedChange={setShowContracts}
                data-testid="checkbox-filter-contracts"
                className="h-4 w-4"
              />
              <Label htmlFor="filter-contracts" className="flex items-center gap-1.5 cursor-pointer">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-xs">{language === "es" ? "Check in" : "Check in"}</span>
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="filter-checkout"
                checked={showCheckOut}
                onCheckedChange={setShowCheckOut}
                data-testid="checkbox-filter-checkout"
                className="h-4 w-4"
              />
              <Label htmlFor="filter-checkout" className="flex items-center gap-1.5 cursor-pointer">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="text-xs">{language === "es" ? "Check out" : "Check out"}</span>
              </Label>
            </div>
          </div>
          
          {/* Separador */}
          <div className="hidden sm:block h-5 w-px bg-border" />
          
          {/* Pestañas de Vista */}
          <div className="flex gap-1 w-full sm:w-auto">
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              data-testid="tab-calendar"
              className="flex-1 sm:flex-none"
            >
              {language === "es" ? "Calendario" : "Calendar"}
            </Button>
            <Button
              variant={viewMode === "today" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("today")}
              data-testid="tab-today"
              className="flex-1 sm:flex-none"
            >
              {language === "es" ? "HOY" : "TODAY"}
            </Button>
            <Button
              variant={viewMode === "agenda" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("agenda")}
              data-testid="tab-agenda"
              className="flex-1 sm:flex-none"
            >
              {language === "es" ? "Agenda" : "Agenda"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vista de Calendario */}
      {viewMode === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Calendar Column */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{language === "es" ? "Calendario" : "Calendar"}</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={language === "es" ? es : enUS}
                  className="rounded-md border w-full [&_.rdp-day_button]:relative"
                  data-testid="calendar-main"
                  modifiers={{
                    hasPayments: datesWithPayments,
                    hasTickets: datesWithTickets,
                    hasContracts: datesWithContracts,
                  }}
                  components={{
                    DayContent: ({ date }) => {
                      const dateKey = format(date, 'yyyy-MM-dd');
                      const events = eventsByDate.get(dateKey);
                      
                      return (
                        <>
                          {format(date, 'd')}
                          {events && (
                            <div style={{
                              position: 'absolute',
                              bottom: '2px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              display: 'flex',
                              gap: '2px',
                              pointerEvents: 'none'
                            }}>
                              {events.payments > 0 && (
                                <div 
                                  style={{
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgb(34, 197, 94)'
                                  }}
                                  data-testid="indicator-payment" 
                                />
                              )}
                              {events.services > 0 && (
                                <div 
                                  style={{
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgb(234, 179, 8)'
                                  }}
                                  data-testid="indicator-service" 
                                />
                              )}
                              {events.tickets > 0 && (
                                <div 
                                  style={{
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgb(59, 130, 246)'
                                  }}
                                  data-testid="indicator-ticket" 
                                />
                              )}
                              {events.contracts > 0 && (
                                <div 
                                  style={{
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgb(168, 85, 247)'
                                  }}
                                  data-testid="indicator-contract" 
                                />
                              )}
                            </div>
                          )}
                        </>
                      );
                    },
                  }}
                />
              </CardContent>
            </Card>

            {/* Events Column with Inline Expansion */}
            <Card className="relative">
              {/* Stats integrados en la esquina */}
              <div className="absolute top-3 right-3 flex gap-3 text-xs font-semibold z-10">
                <span className="text-blue-600" data-testid="text-pending-payments">
                  {stats.pendingPayments} {language === "es" ? "rentas" : "rents"}
                </span>
                <span className="text-green-600" data-testid="text-scheduled-tickets">
                  {stats.scheduledTickets} {language === "es" ? "mant." : "maint."}
                </span>
                <span className="text-muted-foreground" data-testid="text-month-events">
                  {stats.thisMonthEvents} {language === "es" ? "total" : "total"}
                </span>
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {selectedDate
                    ? format(selectedDate, language === "es" ? "d 'de' MMMM, yyyy" : "MMMM d, yyyy", { 
                        locale: language === "es" ? es : enUS 
                      })
                    : language === "es" ? "Selecciona una fecha" : "Select a date"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {eventsForDate.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {language === "es" 
                      ? "No hay eventos para esta fecha" 
                      : "No events for this date"}
                  </p>
                ) : (
                  <>
                    {/* Navigation arrows */}
                    <div className="flex items-center justify-between mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEventPage(Math.max(0, eventPage - 1));
                          setExpandedEventIndex(null);
                        }}
                        disabled={eventPage === 0}
                        data-testid="button-events-prev"
                      >
                        <ChevronUp className="h-4 w-4 mr-1" />
                        {language === "es" ? "Anterior" : "Previous"}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {Math.min(eventPage * EVENTS_PER_PAGE + 1, eventsForDate.length)}-{Math.min((eventPage + 1) * EVENTS_PER_PAGE, eventsForDate.length)} {language === "es" ? "de" : "of"} {eventsForDate.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEventPage(Math.min(Math.ceil(eventsForDate.length / EVENTS_PER_PAGE) - 1, eventPage + 1));
                          setExpandedEventIndex(null);
                        }}
                        disabled={(eventPage + 1) * EVENTS_PER_PAGE >= eventsForDate.length}
                        data-testid="button-events-next"
                      >
                        {language === "es" ? "Siguiente" : "Next"}
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </div>

                    {/* Events list */}
                    <div className="space-y-1.5">
                      {eventsForDate.slice(eventPage * EVENTS_PER_PAGE, (eventPage + 1) * EVENTS_PER_PAGE).map((event, idx) => {
                        const actualIdx = eventPage * EVENTS_PER_PAGE + idx;
                        return (
                        <Collapsible
                          key={actualIdx}
                          open={expandedEventIndex === actualIdx}
                          onOpenChange={() => setExpandedEventIndex(expandedEventIndex === actualIdx ? null : actualIdx)}
                        >
                          <div className={cn(
                            "border rounded-md",
                            event.type === 'payment' && "border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/10",
                            event.type === 'service' && "border-yellow-200 dark:border-yellow-900 bg-yellow-50/30 dark:bg-yellow-950/10",
                            event.type === 'ticket' && "border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-950/10",
                            event.type === 'contract' && "border-purple-200 dark:border-purple-900 bg-purple-50/30 dark:bg-purple-950/10"
                          )}>
                            <CollapsibleTrigger asChild>
                              <div
                                className="p-2.5 hover-elevate cursor-pointer w-full"
                                data-testid={`event-${event.type}-${actualIdx}`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <div className="mt-1">
                                    {event.type === 'payment' ? (
                                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    ) : event.type === 'service' ? (
                                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                    ) : event.type === 'ticket' ? (
                                      <div className="h-2 w-2 rounded-full bg-green-500" />
                                    ) : (
                                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium text-sm truncate">{event.title}</p>
                                      {expandedEventIndex === actualIdx ? (
                                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      )}
                                    </div>
                                    {event.time && (
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-muted-foreground">{event.time}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <div className="px-2.5 pb-2.5 pt-1 border-t">
                                {event.type === 'payment' && (() => {
                                  const payment = event.data as ExternalPayment;
                                  const parsedAmount = payment.amount ? parseFloat(payment.amount) : NaN;
                                  const hasValidAmount = Number.isFinite(parsedAmount);

                                  return (
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center justify-between">
                                        <Badge variant={payment.status === 'paid' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs">
                                          {translateStatus(payment.status)}
                                        </Badge>
                                        {hasValidAmount && (
                                          <p className="text-lg font-bold text-blue-600">
                                            ${parsedAmount.toFixed(2)}
                                          </p>
                                        )}
                                      </div>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex items-start gap-2">
                                          <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                                          <div className="min-w-0">
                                            <p className="font-medium">{language === "es" ? "Unidad" : "Unit"}</p>
                                            <p className="text-muted-foreground break-words">
                                              {event.condominium} - {event.unitNumber}
                                              {event.tenantName && ` (${event.tenantName})`}
                                            </p>
                                          </div>
                                        </div>
                                        {payment.dueDate && (
                                          <div className="flex items-start gap-2">
                                            <CalIcon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                                            <div>
                                              <p className="font-medium">{language === "es" ? "Vencimiento" : "Due Date"}</p>
                                              <p className="text-muted-foreground">
                                                {format(new Date(payment.dueDate), "PPP", { locale: language === "es" ? es : enUS })}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {event.type === 'service' && (() => {
                                  const service = event.data as ExternalPaymentSchedule;
                                  const parsedAmount = service.amount ? parseFloat(service.amount) : NaN;
                                  const hasValidAmount = Number.isFinite(parsedAmount);

                                  return (
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center justify-between">
                                        <Badge variant={service.status === 'paid' ? 'default' : service.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs">
                                          {translateStatus(service.status)}
                                        </Badge>
                                        {hasValidAmount && (
                                          <p className="text-lg font-bold text-yellow-600">
                                            ${parsedAmount.toFixed(2)}
                                          </p>
                                        )}
                                      </div>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex items-start gap-2">
                                          <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                                          <div className="min-w-0">
                                            <p className="font-medium">{language === "es" ? "Unidad" : "Unit"}</p>
                                            <p className="text-muted-foreground break-words">
                                              {event.condominium} - {event.unitNumber}
                                            </p>
                                          </div>
                                        </div>
                                        {service.dueDate && (
                                          <div className="flex items-start gap-2">
                                            <CalIcon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                                            <div>
                                              <p className="font-medium">{language === "es" ? "Vencimiento" : "Due Date"}</p>
                                              <p className="text-muted-foreground">
                                                {format(new Date(service.dueDate), "PPP", { locale: language === "es" ? es : enUS })}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {event.type === 'ticket' && (() => {
                                  const ticket = event.data as ExternalMaintenanceTicket;
                                  const assignedUser = users.find(u => u.id === ticket.assignedTo);

                                  return (
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant={ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                                          {translatePriority(ticket.priority)}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">{translateCategory(ticket.category)}</Badge>
                                        <Badge variant={ticket.status === 'in_progress' ? 'default' : 'secondary'} className="text-xs">
                                          {translateStatus(ticket.status)}
                                        </Badge>
                                      </div>
                                      {ticket.description && (
                                        <p className="text-xs text-muted-foreground">{ticket.description}</p>
                                      )}
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex items-start gap-2">
                                          <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                                          <div className="min-w-0">
                                            <p className="font-medium">{language === "es" ? "Ubicación" : "Location"}</p>
                                            <p className="text-muted-foreground break-words">
                                              {event.condominium} - {event.unitNumber}
                                            </p>
                                          </div>
                                        </div>
                                        {ticket.scheduledDate && (
                                          <div className="flex items-start gap-2">
                                            <Clock className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                                            <div>
                                              <p className="font-medium">{language === "es" ? "Programado" : "Scheduled"}</p>
                                              <p className="text-muted-foreground">
                                                {format(new Date(ticket.scheduledDate), "PPP p", { locale: language === "es" ? es : enUS })}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                        {assignedUser && (
                                          <div className="flex items-start gap-2">
                                            <User className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                                            <div>
                                              <p className="font-medium">{language === "es" ? "Trabajador" : "Worker"}</p>
                                              <p className="text-muted-foreground">
                                                {assignedUser.name}{assignedUser.maintenanceSpecialty ? ` (${assignedUser.maintenanceSpecialty})` : ''}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {event.type === 'contract' && (() => {
                                  const contract = event.data as ExternalRentalContract;
                                  const parsedRent = contract.monthlyRent ? parseFloat(contract.monthlyRent) : NaN;
                                  const hasValidRent = Number.isFinite(parsedRent);

                                  return (
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center justify-between">
                                        <Badge variant={contract.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                          {translateStatus(contract.status)}
                                        </Badge>
                                        {contract.rentalPurpose && (
                                          <Badge variant="outline" className="text-xs">
                                            {contract.rentalPurpose === 'living' ? (
                                              <><Home className="h-3 w-3 mr-1" />{language === "es" ? "Vivienda" : "Living"}</>
                                            ) : (
                                              <>{language === "es" ? "Subarrendamiento" : "Sublease"}</>
                                            )}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="space-y-1.5 text-xs">
                                        <div className="flex items-start gap-2">
                                          <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                                          <div className="min-w-0">
                                            <p className="font-medium">{language === "es" ? "Unidad" : "Unit"}</p>
                                            <p className="text-muted-foreground break-words">
                                              {event.condominium} - {event.unitNumber}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <DollarSign className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                                          <div>
                                            <p className="font-medium">{language === "es" ? "Renta Mensual" : "Monthly Rent"}</p>
                                            <p className="text-muted-foreground">
                                              {hasValidRent 
                                                ? `${contract.currency || 'MXN'} $${parsedRent.toLocaleString()}`
                                                : (language === "es" ? "Monto no especificado" : "Amount not specified")
                                              }
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <CalIcon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                                          <div>
                                            <p className="font-medium">{language === "es" ? "Duración" : "Duration"}</p>
                                            <p className="text-muted-foreground">
                                              {contract.leaseDurationMonths} {language === "es" ? "meses" : "months"}
                                            </p>
                                          </div>
                                        </div>
                                        {contract.startDate && (
                                          <div className="flex items-start gap-2">
                                            <CalIcon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                                            <div>
                                              <p className="font-medium">{language === "es" ? "Inicio" : "Start"}</p>
                                              <p className="text-muted-foreground">
                                                {format(new Date(contract.startDate), "PPP", { locale: language === "es" ? es : enUS })}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
        </Card>
          </div>
      )}

      {/* Vista HOY */}
      {viewMode === "today" && (
        <TodayView events={eventsForToday} language={language} />
      )}

      {/* Vista Agenda */}
      {viewMode === "agenda" && (
        <AgendaView allEvents={allEvents} language={language} />
      )}
    </div>
  );
}
