import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  Home,
  DollarSign,
  BedDouble,
  Clock,
  PawPrint,
  User,
  Users,
  Briefcase,
  Activity,
  History,
  Send,
  FileText,
  MoreVertical,
  Edit2,
  Trash2,
  UserPlus,
  Lock,
  Star,
  Eye,
  Copy,
  Building2,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Plus,
  Bell,
  ChevronDown,
  ChevronUp,
  Menu,
  Info,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalLead, ExternalPresentationCard, ExternalAgencyUnitCharacteristic, ExternalAgencyAmenity } from "@shared/schema";
import PresentationCardsTab from "@/components/external/PresentationCardsTab";
import LeadOffersSection from "@/components/external/LeadOffersSection";
import LeadActivitiesTab from "@/components/external/LeadActivitiesTab";
import LeadShowingsTab from "@/components/external/LeadShowingsTab";
import LeadStatusHistoryTab from "@/components/external/LeadStatusHistoryTab";
import LeadRemindersTab from "@/components/external/LeadRemindersTab";
import LeadRentalFormsTab from "@/components/external/LeadRentalFormsTab";

const LEAD_STATUS_OPTIONS = [
  { value: "nuevo_lead", label: { es: "Nuevo Lead", en: "New Lead" }, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  { value: "cita_coordinada", label: { es: "Cita Coordinada", en: "Appointment Scheduled" }, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
  { value: "interesado", label: { es: "Interesado", en: "Interested" }, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  { value: "oferta_enviada", label: { es: "Oferta Enviada", en: "Offer Sent" }, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" },
  { value: "oferta_completada", label: { es: "Oferta Completada", en: "Offer Completed" }, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300" },
  { value: "formato_enviado", label: { es: "Formato Enviado", en: "Form Sent" }, color: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300" },
  { value: "formato_completado", label: { es: "Formato Completado", en: "Form Completed" }, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
  { value: "proceso_renta", label: { es: "Proceso de Renta", en: "Rental Process" }, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300" },
  { value: "renta_concretada", label: { es: "Renta Concretada", en: "Rental Completed" }, color: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" },
  { value: "perdido", label: { es: "Perdido", en: "Lost" }, color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  { value: "muerto", label: { es: "Muerto", en: "Dead" }, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
];

const formatBudgetRange = (min?: number | string | null, max?: number | string | null): string => {
  const minNum = min ? Number(min) : null;
  const maxNum = max ? Number(max) : null;
  
  if (minNum && maxNum) {
    return `$${minNum.toLocaleString()} - $${maxNum.toLocaleString()}`;
  } else if (minNum) {
    return `$${minNum.toLocaleString()}+`;
  } else if (maxNum) {
    return `Hasta $${maxNum.toLocaleString()}`;
  }
  return "-";
};

export default function ExternalLeadDetail() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [matched, params] = useRoute("/external/leads/:id");
  const leadId = params?.id;
  
  const [activeTab, setActiveTab] = useState("cards");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMobileInfoOpen, setIsMobileInfoOpen] = useState(false);

  const { data: lead, isLoading, error } = useQuery<ExternalLead>({
    queryKey: ["/api/external-leads", leadId],
    queryFn: async () => {
      const res = await fetch(`/api/external-leads/${leadId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch lead');
      return res.json();
    },
    enabled: !!leadId,
  });

  const { data: presentationCards } = useQuery<ExternalPresentationCard[]>({
    queryKey: ["/api/external/presentation-cards/lead", leadId],
    queryFn: async () => {
      const res = await fetch(`/api/external/presentation-cards/lead/${leadId}`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!leadId,
  });

  const { data: characteristics = [] } = useQuery<ExternalAgencyUnitCharacteristic[]>({
    queryKey: ["/api/external/config/unit-characteristics"],
    queryFn: async () => {
      const response = await fetch("/api/external/config/unit-characteristics", { credentials: 'include' });
      return response.json();
    },
  });

  const { data: amenitiesList = [] } = useQuery<ExternalAgencyAmenity[]>({
    queryKey: ["/api/external/config/amenities"],
    queryFn: async () => {
      const response = await fetch("/api/external/config/amenities", { credentials: 'include' });
      return response.json();
    },
  });

  const activeCard = presentationCards?.find(c => c.isDefault) || (presentationCards && presentationCards.length > 0 ? presentationCards[0] : null);
  
  const getCharacteristicName = (id: string) => characteristics.find(c => c.id === id)?.name || id;
  const getAmenityName = (id: string) => amenitiesList.find(a => a.id === id)?.name || id;

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", `/api/external-leads/${leadId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads"] });
      toast({
        title: language === "es" ? "Estado actualizado" : "Status updated",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/external-leads/${leadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads"] });
      toast({
        title: language === "es" ? "Lead eliminado" : "Lead deleted",
      });
      navigate("/external/leads");
    },
  });

  const createCardFromPreferencesMutation = useMutation({
    mutationFn: async () => {
      if (!lead) throw new Error("No lead data");
      const cardData = {
        leadId: lead.id,
        title: `${language === "es" ? "Preferencias de" : "Preferences of"} ${lead.firstName} ${lead.lastName}`,
        propertyType: lead.desiredUnitType ?? undefined,
        zone: lead.desiredNeighborhood ?? undefined,
        minBudget: lead.budgetMin ?? undefined,
        maxBudget: lead.budgetMax ?? undefined,
        bedrooms: lead.desiredBedrooms ?? undefined,
        rentalDuration: lead.contractDuration ?? undefined,
        hasPets: lead.hasPets ?? undefined,
        desiredAmenities: lead.desiredAmenities ?? [],
        desiredCharacteristics: lead.desiredCharacteristics ?? [],
        isDefault: true,
      };
      const res = await apiRequest("POST", "/api/external/presentation-cards", cardData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/presentation-cards/lead", leadId] });
      toast({
        title: language === "es" ? "Tarjeta creada" : "Card created",
        description: language === "es" 
          ? "Se creó una tarjeta desde las preferencias del lead"
          : "A card was created from the lead's preferences",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusConfig = (status: string) => {
    return LEAD_STATUS_OPTIONS.find(s => s.value === status) || LEAD_STATUS_OPTIONS[0];
  };

  const isInterestedStatus = lead?.status === "interesado" || 
    lead?.status === "oferta_enviada" ||
    lead?.status === "oferta_completada" ||
    lead?.status === "formato_enviado" ||
    lead?.status === "formato_completado" ||
    lead?.status === "proceso_renta" || 
    lead?.status === "renta_concretada";

  if (!matched) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="w-80 border-r p-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              {language === "es" ? "Lead no encontrado" : "Lead not found"}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate("/external/clients")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === "es" ? "Volver" : "Go back"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(lead.status);

  // Helper function to send WhatsApp message
  const sendWhatsAppMessage = () => {
    const phone = lead.phone?.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };

  // Reusable lead info content for both mobile and desktop
  const LeadInfoContent = () => (
    <div className="space-y-5">
      {/* Lead Name & Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">
              {lead.firstName} {lead.lastName}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-medium">
                {lead.registrationType === "vendedor" 
                  ? (language === "es" ? "Vendedor" : "Seller")
                  : (language === "es" ? "Broker" : "Broker")}
              </Badge>
              {lead.source && (
                <Badge variant="secondary" className="text-xs">
                  {lead.source}
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0" data-testid="button-lead-actions">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/external/clients?edit=${lead.id}`)}>
                <Edit2 className="h-4 w-4 mr-2" />
                {language === "es" ? "Editar" : "Edit"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {language === "es" ? "Eliminar" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* WhatsApp Quick Action Button - Prominent */}
        {lead.phone && (
          <Button
            onClick={sendWhatsAppMessage}
            className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
            data-testid="button-whatsapp-main"
          >
            <SiWhatsapp className="h-5 w-5" />
            {language === "es" ? "Enviar WhatsApp" : "Send WhatsApp"}
          </Button>
        )}

        {/* Contact Info Cards */}
        <div className="grid gap-2">
          {lead.phone && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium">
                  {language === "es" ? "Teléfono" : "Phone"}
                </p>
                <p className="text-sm font-medium truncate">{lead.phone}</p>
              </div>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium">
                  {language === "es" ? "Email" : "Email"}
                </p>
                <a 
                  href={`mailto:${lead.email}`} 
                  className="text-sm font-medium truncate block hover:text-primary hover:underline"
                >
                  {lead.email}
                </a>
              </div>
            </div>
          )}
          {lead.phoneLast4 && !lead.phone && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium">
                  {language === "es" ? "Teléfono" : "Phone"}
                </p>
                <p className="text-sm font-medium">****{lead.phoneLast4}</p>
              </div>
            </div>
          )}
        </div>

        {/* Status selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {language === "es" ? "Estado del Lead" : "Lead Status"}
          </label>
          <Select
            value={lead.status}
            onValueChange={(value) => updateStatusMutation.mutate(value)}
          >
            <SelectTrigger className="w-full h-10" data-testid="select-lead-status">
              <div className="flex items-center gap-2">
                <Badge className={`${statusConfig.color} px-2.5 py-0.5`}>
                  {statusConfig.label[language]}
                </Badge>
              </div>
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <Badge className={`${status.color} px-2.5 py-0.5`}>
                    {status.label[language]}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Move-in Date - Highlighted */}
      {(lead.checkInDateText || lead.checkInDate) && (
        <>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1">
            <div className="text-xs text-muted-foreground font-medium">
              {language === "es" ? "Fecha de Mudanza" : "Move-in Date"}
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {lead.checkInDateText || (lead.checkInDate ? format(new Date(lead.checkInDate), "PPP", { locale: language === "es" ? es : enUS }) : "")}
              </span>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Search Preferences */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Home className="h-4 w-4" />
          {language === "es" ? "Preferencias de Búsqueda" : "Search Preferences"}
        </h3>
        
        {/* Budget - Highlight Card */}
        {(lead.budgetMin || lead.budgetMax) && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="h-9 w-9 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {language === "es" ? "Presupuesto" : "Budget"}
              </p>
              <p className="text-sm font-bold text-green-700 dark:text-green-400">
                {formatBudgetRange(lead.budgetMin, lead.budgetMax)}
              </p>
            </div>
          </div>
        )}

        {/* Property Preferences Grid */}
        <div className="grid grid-cols-2 gap-2">
          {(lead.bedrooms || lead.bedroomsText) && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border">
              <BedDouble className="h-4 w-4 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {language === "es" ? "Recámaras" : "Bedrooms"}
                </p>
                <p className="text-sm font-medium truncate">{lead.bedroomsText || lead.bedrooms}</p>
              </div>
            </div>
          )}
          {lead.desiredUnitType && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border">
              <Building2 className="h-4 w-4 text-purple-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {language === "es" ? "Tipo" : "Type"}
                </p>
                <p className="text-sm font-medium truncate">{lead.desiredUnitType}</p>
              </div>
            </div>
          )}
          {lead.contractDuration && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border">
              <Clock className="h-4 w-4 text-teal-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {language === "es" ? "Contrato" : "Contract"}
                </p>
                <p className="text-sm font-medium truncate">{lead.contractDuration}</p>
              </div>
            </div>
          )}
          {lead.hasPets && lead.hasPets !== "No" && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border">
              <PawPrint className="h-4 w-4 text-amber-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {language === "es" ? "Mascotas" : "Pets"}
                </p>
                <p className="text-sm font-medium truncate">{lead.hasPets}</p>
              </div>
            </div>
          )}
        </div>

        {/* Zone/Location */}
        {lead.desiredNeighborhood && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <div className="h-9 w-9 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">
                {language === "es" ? "Zona Preferida" : "Preferred Zone"}
              </p>
              <p className="text-sm font-medium">{lead.desiredNeighborhood}</p>
            </div>
          </div>
        )}

        {/* Desired Characteristics */}
        {lead.desiredCharacteristics && lead.desiredCharacteristics.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
              {language === "es" ? "Características" : "Features"}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {lead.desiredCharacteristics.map((charId) => (
                <Badge key={charId} variant="secondary" className="text-xs font-medium">
                  {getCharacteristicName(charId)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Desired Amenities */}
        {lead.desiredAmenities && lead.desiredAmenities.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
              {language === "es" ? "Amenidades" : "Amenities"}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {lead.desiredAmenities.map((amenityId) => (
                <Badge key={amenityId} variant="outline" className="text-xs font-medium">
                  {getAmenityName(amenityId)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assigned Seller */}
      {lead.sellerName && (
        <>
          <Separator />
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">
                {language === "es" ? "Vendedor Asignado" : "Assigned Seller"}
              </p>
              <p className="text-sm font-semibold">{lead.sellerName}</p>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Active Presentation Card */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {language === "es" ? "Tarjeta de Presentación" : "Presentation Card"}
        </h3>
        
        {activeCard ? (
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm">{activeCard.title}</span>
              {activeCard.isDefault && (
                <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {activeCard.propertyType && (
                <div className="flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5" />
                  <span>{activeCard.propertyType}</span>
                </div>
              )}
              {(activeCard.minBudget || activeCard.maxBudget) && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>{formatBudgetRange(activeCard.minBudget, activeCard.maxBudget)}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                <span>{activeCard.usageCount || 0} {language === "es" ? "usos" : "uses"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-5 px-4 border rounded-lg border-dashed space-y-3 bg-muted/20">
            <div className="h-10 w-10 rounded-full bg-muted mx-auto flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {language === "es" 
                ? "Sin tarjeta de presentación" 
                : "No presentation card"}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => createCardFromPreferencesMutation.mutate()}
              disabled={createCardFromPreferencesMutation.isPending}
              data-testid="button-create-card-from-preferences"
            >
              {createCardFromPreferencesMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {language === "es" 
                ? "Crear desde Preferencias" 
                : "Create from Preferences"}
            </Button>
          </div>
        )}
      </div>

      {/* Timestamps */}
      <Separator />
      <div className="text-xs text-muted-foreground space-y-1.5 py-1">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>
            {language === "es" ? "Registrado: " : "Registered: "}
            {lead.createdAt ? format(new Date(lead.createdAt), "PPp", { locale: language === "es" ? es : enUS }) : "-"}
          </span>
        </div>
        {lead.updatedAt && (
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>
              {language === "es" ? "Actualizado: " : "Updated: "}
              {format(new Date(lead.updatedAt), "PPp", { locale: language === "es" ? es : enUS })}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full bg-background">
      {/* Mobile Header - Visible only on mobile */}
      <div className="lg:hidden border-b bg-card/50 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/external/clients")}
              data-testid="button-back-to-leads-mobile"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">
                {lead.firstName} {lead.lastName}
              </h1>
              <Badge className={`${statusConfig.color} text-xs`}>
                {statusConfig.label[language]}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* WhatsApp Quick Button - Mobile */}
            {lead.phone && (
              <Button 
                size="icon"
                onClick={sendWhatsAppMessage}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-whatsapp-mobile"
              >
                <SiWhatsapp className="h-4 w-4" />
              </Button>
            )}
            <Sheet open={isMobileInfoOpen} onOpenChange={setIsMobileInfoOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-show-lead-info">
                  <Info className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-[340px] p-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <LeadInfoContent />
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-lead-actions-mobile">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/external/clients?edit=${lead.id}`)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  {language === "es" ? "Editar" : "Edit"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === "es" ? "Eliminar" : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Desktop Left Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex w-80 border-r flex-col bg-card/50">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Header with back button */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/external/clients")}
                data-testid="button-back-to-leads"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {language === "es" ? "Volver a leads" : "Back to leads"}
              </span>
            </div>

            <LeadInfoContent />
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b px-2 sm:px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-x-auto">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-7 sm:w-full sm:max-w-3xl gap-0.5 sm:gap-1">
              <TabsTrigger value="cards" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm" data-testid="tab-cards">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">{language === "es" ? "Tarjetas" : "Cards"}</span>
              </TabsTrigger>
              <TabsTrigger value="offers" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm" data-testid="tab-offers">
                <Send className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">{language === "es" ? "Ofertas" : "Offers"}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="forms" 
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
                disabled={!isInterestedStatus}
                data-testid="tab-forms"
              >
                {isInterestedStatus ? (
                  <FileText className="h-4 w-4 shrink-0" />
                ) : (
                  <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <span className="hidden md:inline">{language === "es" ? "Formatos" : "Forms"}</span>
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm" data-testid="tab-activities">
                <Activity className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">{language === "es" ? "Actividades" : "Activities"}</span>
              </TabsTrigger>
              <TabsTrigger value="showings" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm" data-testid="tab-showings">
                <Home className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">{language === "es" ? "Visitas" : "Showings"}</span>
              </TabsTrigger>
              <TabsTrigger value="reminders" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm" data-testid="tab-reminders">
                <Bell className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">{language === "es" ? "Recordatorios" : "Reminders"}</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm" data-testid="tab-history">
                <History className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">{language === "es" ? "Historial" : "History"}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 sm:p-4">
              <TabsContent value="cards" className="mt-0 space-y-4">
                <PresentationCardsTab 
                  leadId={lead.id} 
                  personName={`${lead.firstName} ${lead.lastName}`}
                  leadPreferences={{
                    budgetMin: lead.budgetMin,
                    budgetMax: lead.budgetMax,
                    estimatedRentCost: lead.estimatedRentCost,
                    estimatedRentCostText: lead.estimatedRentCostText,
                    bedrooms: lead.bedrooms,
                    bedroomsText: lead.bedroomsText,
                    desiredUnitType: lead.desiredUnitType,
                    desiredNeighborhood: lead.desiredNeighborhood,
                    contractDuration: lead.contractDuration,
                    hasPets: lead.hasPets,
                  }}
                />
              </TabsContent>

              <TabsContent value="offers" className="mt-0 space-y-4">
                <LeadOffersSection lead={lead} />
              </TabsContent>

              <TabsContent value="forms" className="mt-0 space-y-4">
                {isInterestedStatus ? (
                  <LeadRentalFormsTab lead={lead} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === "es" 
                      ? "Esta función está disponible cuando el lead está en estado 'Interesado' o superior" 
                      : "This feature is available when lead is in 'Interested' status or higher"}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activities" className="mt-0 space-y-4">
                <LeadActivitiesTab leadId={lead.id} />
              </TabsContent>

              <TabsContent value="showings" className="mt-0 space-y-4">
                <LeadShowingsTab leadId={lead.id} />
              </TabsContent>

              <TabsContent value="reminders" className="mt-0 space-y-4">
                <LeadRemindersTab leadId={lead.id} leadName={`${lead.firstName} ${lead.lastName}`} />
              </TabsContent>

              <TabsContent value="history" className="mt-0 space-y-4">
                <LeadStatusHistoryTab leadId={lead.id} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Eliminar Lead" : "Delete Lead"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? `¿Estás seguro de que deseas eliminar a ${lead.firstName} ${lead.lastName}? Esta acción no se puede deshacer.`
                : `Are you sure you want to delete ${lead.firstName} ${lead.lastName}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending 
                ? (language === "es" ? "Eliminando..." : "Deleting...")
                : (language === "es" ? "Eliminar" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
