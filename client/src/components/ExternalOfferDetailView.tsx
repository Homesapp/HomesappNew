import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import { 
  Download, 
  User, 
  Home, 
  Calendar, 
  DollarSign, 
  Users, 
  PawPrint,
  Briefcase,
  Globe,
  Phone,
  Mail,
  Clock,
  FileText,
  Zap,
  Droplets,
  Wifi,
  Flame,
  CheckCircle2,
  X,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png";

interface OfferData {
  nombreCompleto?: string;
  nacionalidad?: string;
  edad?: number;
  tiempoResidenciaTulum?: string;
  trabajoPosicion?: string;
  companiaTrabaja?: string;
  tieneMascotas?: string;
  petPhotos?: string[];
  ingresoMensualPromedio?: string;
  numeroInquilinos?: number;
  tieneGarante?: string;
  usoInmueble?: "vivienda" | "subarrendamiento";
  rentaOfertada?: number;
  rentasAdelantadas?: number;
  fechaIngreso?: string;
  fechaSalida?: string;
  duracionContrato?: string;
  contractCost?: number;
  securityDeposit?: number;
  serviciosIncluidos?: string;
  serviciosNoIncluidos?: string;
  propertyRequiredServices?: string[];
  offeredServices?: string[];
  pedidoEspecial?: string;
  signature?: string;
  submittedAt?: string;
  clientEmail?: string;
  clientPhone?: string;
}

interface ExternalOfferDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: {
    id: string;
    propertyTitle?: string;
    propertyAddress?: string;
    condominiumName?: string;
    unitNumber?: string;
    monthlyRent?: number;
    currency?: string;
    offerData?: OfferData;
    createdAt?: string;
    createdByName?: string;
    clientName?: string;
    isUsed?: boolean;
    expiresAt?: string;
  } | null;
}

const translations = {
  es: {
    title: "Detalle de Oferta",
    downloadImage: "Descargar Imagen",
    downloading: "Descargando...",
    downloadSuccess: "Imagen descargada",
    downloadError: "Error al descargar",
    
    propertySection: "Propiedad",
    clientSection: "Información del Cliente",
    offerSection: "Detalles de la Oferta",
    servicesSection: "Servicios",
    additionalSection: "Información Adicional",
    
    property: "Propiedad",
    address: "Dirección",
    requestedRent: "Renta Solicitada",
    
    fullName: "Nombre Completo",
    nationality: "Nacionalidad",
    age: "Edad",
    residenceTime: "Tiempo en Tulum",
    occupation: "Ocupación",
    company: "Empresa",
    monthlyIncome: "Ingreso Mensual",
    email: "Email",
    phone: "Teléfono",
    
    offeredRent: "Renta Ofertada",
    usageType: "Tipo de Uso",
    usageLiving: "Vivienda",
    usageSublet: "Subarrendamiento",
    contractDuration: "Duración del Contrato",
    moveInDate: "Fecha de Ingreso",
    moveOutDate: "Fecha de Salida",
    occupants: "Ocupantes",
    advanceRents: "Rentas Adelantadas",
    contractCost: "Costo de Contrato",
    securityDeposit: "Depósito de Seguridad",
    hasGuarantor: "Tiene Aval",
    yes: "Sí",
    no: "No",
    
    clientOffersServices: "Servicios que el Cliente Ofrece Pagar",
    ownerRequiresServices: "Servicios que Requiere el Propietario",
    
    hasPets: "Mascotas",
    petDetails: "Detalles de Mascotas",
    specialRequest: "Pedido Especial",
    signature: "Firma Digital",
    
    submittedAt: "Enviado el",
    createdBy: "Creado por",
    offerStatus: "Estado",
    completed: "Completada",
    pending: "Pendiente",
    expired: "Expirada",
    
    perMonth: "/mes",
    months: "meses",
    years: "años",
    person: "persona",
    people: "personas",
    
    serviceWater: "Agua",
    serviceElectricity: "Electricidad",
    serviceInternet: "Internet",
    serviceGas: "Gas",
    serviceCleaning: "Limpieza",
    serviceGardening: "Jardinería",
    serviceMaintenance: "Mantenimiento",
    
    generatedBy: "Generado por HomesApp - Tulum Rental Homes",
    
    noDataAvailable: "Datos pendientes",
    awaitingSubmission: "Esta oferta aún no ha sido completada por el cliente.",
  },
  en: {
    title: "Offer Detail",
    downloadImage: "Download Image",
    downloading: "Downloading...",
    downloadSuccess: "Image downloaded",
    downloadError: "Download error",
    
    propertySection: "Property",
    clientSection: "Client Information",
    offerSection: "Offer Details",
    servicesSection: "Services",
    additionalSection: "Additional Information",
    
    property: "Property",
    address: "Address",
    requestedRent: "Requested Rent",
    
    fullName: "Full Name",
    nationality: "Nationality",
    age: "Age",
    residenceTime: "Time in Tulum",
    occupation: "Occupation",
    company: "Company",
    monthlyIncome: "Monthly Income",
    email: "Email",
    phone: "Phone",
    
    offeredRent: "Offered Rent",
    usageType: "Usage Type",
    usageLiving: "Living",
    usageSublet: "Subletting",
    contractDuration: "Contract Duration",
    moveInDate: "Move-in Date",
    moveOutDate: "Move-out Date",
    occupants: "Occupants",
    advanceRents: "Advance Rents",
    contractCost: "Contract Cost",
    securityDeposit: "Security Deposit",
    hasGuarantor: "Has Guarantor",
    yes: "Yes",
    no: "No",
    
    clientOffersServices: "Services Client Offers to Pay",
    ownerRequiresServices: "Services Required by Owner",
    
    hasPets: "Pets",
    petDetails: "Pet Details",
    specialRequest: "Special Request",
    signature: "Digital Signature",
    
    submittedAt: "Submitted on",
    createdBy: "Created by",
    offerStatus: "Status",
    completed: "Completed",
    pending: "Pending",
    expired: "Expired",
    
    perMonth: "/month",
    months: "months",
    years: "years",
    person: "person",
    people: "people",
    
    serviceWater: "Water",
    serviceElectricity: "Electricity",
    serviceInternet: "Internet",
    serviceGas: "Gas",
    serviceCleaning: "Cleaning",
    serviceGardening: "Gardening",
    serviceMaintenance: "Maintenance",
    
    generatedBy: "Generated by HomesApp - Tulum Rental Homes",
    
    noDataAvailable: "Pending data",
    awaitingSubmission: "This offer has not yet been completed by the client.",
  }
};

export default function ExternalOfferDetailView({ open, onOpenChange, offer }: ExternalOfferDetailViewProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const t = translations[language as keyof typeof translations] || translations.es;
  const dateLocale = language === "es" ? es : enUS;
  
  if (!offer) return null;
  
  const offerData = offer.offerData || {};
  
  const getOfferStatus = () => {
    if (offer.isUsed) return { label: t.completed, variant: "default" as const };
    if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) return { label: t.expired, variant: "secondary" as const };
    return { label: t.pending, variant: "outline" as const };
  };
  
  const status = getOfferStatus();
  
  const formatCurrency = (amount: number | undefined, currency: string = "MXN") => {
    if (!amount) return "-";
    return new Intl.NumberFormat(language === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: dateLocale });
    } catch {
      return dateString;
    }
  };
  
  const getServiceIcon = (service: string) => {
    const lowered = service.toLowerCase();
    if (lowered.includes("agua") || lowered.includes("water")) return <Droplets className="h-4 w-4" />;
    if (lowered.includes("luz") || lowered.includes("electric")) return <Zap className="h-4 w-4" />;
    if (lowered.includes("internet") || lowered.includes("wifi")) return <Wifi className="h-4 w-4" />;
    if (lowered.includes("gas")) return <Flame className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };
  
  const handleDownloadImage = async () => {
    if (!contentRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      
      const link = document.createElement("a");
      link.download = `oferta-${offer.unitNumber || offer.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast({
        title: t.downloadSuccess,
        description: `oferta-${offer.unitNumber || offer.id}.png`,
      });
    } catch (error) {
      toast({
        title: t.downloadError,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  const propertyTitle = offer.condominiumName && offer.unitNumber 
    ? `${offer.condominiumName} - ${offer.unitNumber}`
    : offer.propertyTitle || "Propiedad";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">{t.title}</DialogTitle>
          <Button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            size="sm"
            data-testid="button-download-offer-image"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? t.downloading : t.downloadImage}
          </Button>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div ref={contentRef} className="bg-white p-6" data-testid="offer-detail-content">
            {/* Header with Logo and Status */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-primary/20">
              <div className="flex items-center gap-4">
                <img src={logoPath} alt="HomesApp" className="h-14 object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-primary">HomesApp</h1>
                  <p className="text-sm text-muted-foreground">Tulum Rental Homes ™</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={status.variant} className="mb-2">{status.label}</Badge>
                {offerData.submittedAt && (
                  <p className="text-xs text-muted-foreground">
                    {t.submittedAt}: {formatDate(offerData.submittedAt)}
                  </p>
                )}
              </div>
            </div>
            
            {/* Property Section */}
            <div className="mb-6" data-testid="section-property">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-primary">{t.propertySection}</h2>
              </div>
              <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-4 border border-primary/10">
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <Home className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-lg" data-testid="text-property-title">{propertyTitle}</p>
                      {offer.propertyAddress && (
                        <p className="text-sm text-muted-foreground" data-testid="text-property-address">{offer.propertyAddress}</p>
                      )}
                    </div>
                  </div>
                  {offer.monthlyRent && (
                    <div className="flex items-center gap-3 mt-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <span className="text-sm text-muted-foreground">{t.requestedRent}: </span>
                        <span className="font-bold text-green-600 text-lg" data-testid="text-requested-rent">
                          {formatCurrency(offer.monthlyRent, offer.currency)}{t.perMonth}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Client Information Section */}
            <div className="mb-6" data-testid="section-client-info">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-blue-600">{t.clientSection}</h2>
              </div>
              <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                {/* Show client name from token if offerData doesn't have it */}
                {!offerData.nombreCompleto && !offerData.clientEmail && offer.clientName ? (
                  <div className="flex items-center gap-2" data-testid="text-client-name">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t.fullName}</p>
                      <p className="font-medium">{offer.clientName}</p>
                    </div>
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-4">
                  {offerData.nombreCompleto && (
                    <div className="flex items-center gap-2" data-testid="text-full-name">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.fullName}</p>
                        <p className="font-medium">{offerData.nombreCompleto}</p>
                      </div>
                    </div>
                  )}
                  {offerData.nacionalidad && (
                    <div className="flex items-center gap-2" data-testid="text-nationality">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.nationality}</p>
                        <p className="font-medium">{offerData.nacionalidad}</p>
                      </div>
                    </div>
                  )}
                  {offerData.clientEmail && (
                    <div className="flex items-center gap-2" data-testid="text-email">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                        <p className="font-medium">{offerData.clientEmail}</p>
                      </div>
                    </div>
                  )}
                  {offerData.clientPhone && (
                    <div className="flex items-center gap-2" data-testid="text-phone">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.phone}</p>
                        <p className="font-medium">{offerData.clientPhone}</p>
                      </div>
                    </div>
                  )}
                  {offerData.trabajoPosicion && (
                    <div className="flex items-center gap-2" data-testid="text-occupation">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.occupation}</p>
                        <p className="font-medium">{offerData.trabajoPosicion}</p>
                      </div>
                    </div>
                  )}
                  {offerData.companiaTrabaja && (
                    <div className="flex items-center gap-2" data-testid="text-company">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.company}</p>
                        <p className="font-medium">{offerData.companiaTrabaja}</p>
                      </div>
                    </div>
                  )}
                  {offerData.ingresoMensualPromedio && (
                    <div className="flex items-center gap-2" data-testid="text-income">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.monthlyIncome}</p>
                        <p className="font-medium">{offerData.ingresoMensualPromedio}</p>
                      </div>
                    </div>
                  )}
                  {offerData.tiempoResidenciaTulum && (
                    <div className="flex items-center gap-2" data-testid="text-residence">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.residenceTime}</p>
                        <p className="font-medium">{offerData.tiempoResidenciaTulum}</p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Show message when no data available and offer not completed */}
                {!offer.isUsed && !offerData.nombreCompleto && !offerData.clientEmail && !offer.clientName && (
                  <p className="text-sm text-muted-foreground italic" data-testid="text-awaiting">{t.awaitingSubmission}</p>
                )}
              </div>
            </div>
            
            {/* Offer Details Section */}
            <div className="mb-6" data-testid="section-offer-details">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-green-600">{t.offerSection}</h2>
              </div>
              <div className="bg-green-50/50 rounded-lg p-4 border border-green-100">
                {/* Highlighted Offered Rent */}
                {offerData.rentaOfertada && (
                  <div className="bg-green-100 rounded-lg p-4 mb-4 text-center" data-testid="text-offered-rent">
                    <p className="text-sm text-green-700 mb-1">{t.offeredRent}</p>
                    <p className="text-3xl font-bold text-green-700">
                      {formatCurrency(offerData.rentaOfertada, offer.currency)}<span className="text-lg font-normal">{t.perMonth}</span>
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {offerData.usoInmueble && (
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.usageType}</p>
                        <p className="font-medium">
                          {offerData.usoInmueble === "vivienda" ? t.usageLiving : t.usageSublet}
                        </p>
                      </div>
                    </div>
                  )}
                  {offerData.duracionContrato && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.contractDuration}</p>
                        <p className="font-medium">{offerData.duracionContrato}</p>
                      </div>
                    </div>
                  )}
                  {offerData.fechaIngreso && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.moveInDate}</p>
                        <p className="font-medium">{formatDate(offerData.fechaIngreso)}</p>
                      </div>
                    </div>
                  )}
                  {offerData.fechaSalida && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.moveOutDate}</p>
                        <p className="font-medium">{formatDate(offerData.fechaSalida)}</p>
                      </div>
                    </div>
                  )}
                  {offerData.numeroInquilinos && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.occupants}</p>
                        <p className="font-medium">
                          {offerData.numeroInquilinos} {offerData.numeroInquilinos === 1 ? t.person : t.people}
                        </p>
                      </div>
                    </div>
                  )}
                  {offerData.rentasAdelantadas && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.advanceRents}</p>
                        <p className="font-medium">{offerData.rentasAdelantadas} {t.months}</p>
                      </div>
                    </div>
                  )}
                  {offerData.contractCost && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.contractCost}</p>
                        <p className="font-medium">{formatCurrency(offerData.contractCost, "MXN")}</p>
                      </div>
                    </div>
                  )}
                  {offerData.securityDeposit && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.securityDeposit}</p>
                        <p className="font-medium">{offerData.securityDeposit} {t.months}</p>
                      </div>
                    </div>
                  )}
                  {offerData.tieneGarante && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.hasGuarantor}</p>
                        <p className="font-medium">
                          {offerData.tieneGarante === "si" || offerData.tieneGarante === "yes" ? t.yes : t.no}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Services Section */}
            {((offerData.offeredServices && offerData.offeredServices.length > 0) || 
              (offerData.propertyRequiredServices && offerData.propertyRequiredServices.length > 0)) && (
              <div className="mb-6" data-testid="section-services">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-purple-600">{t.servicesSection}</h2>
                </div>
                <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-100">
                  <div className="grid grid-cols-2 gap-4">
                    {offerData.offeredServices && offerData.offeredServices.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-purple-700 mb-2">{t.clientOffersServices}</p>
                        <div className="flex flex-wrap gap-2">
                          {offerData.offeredServices.map((service, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-700 flex items-center gap-1">
                              {getServiceIcon(service)}
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {offerData.propertyRequiredServices && offerData.propertyRequiredServices.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-purple-700 mb-2">{t.ownerRequiresServices}</p>
                        <div className="flex flex-wrap gap-2">
                          {offerData.propertyRequiredServices.map((service, idx) => (
                            <Badge key={idx} variant="outline" className="border-purple-300 text-purple-700 flex items-center gap-1">
                              {getServiceIcon(service)}
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Additional Information Section */}
            {(offerData.tieneMascotas || offerData.pedidoEspecial || offerData.signature) && (
              <div className="mb-6" data-testid="section-additional">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <PawPrint className="h-5 w-5 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-amber-600">{t.additionalSection}</h2>
                </div>
                <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100 space-y-4">
                  {offerData.tieneMascotas && (
                    <div className="flex items-start gap-2" data-testid="text-pets">
                      <PawPrint className="h-4 w-4 text-amber-600 mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t.hasPets}</p>
                        <p className="font-medium">
                          {offerData.tieneMascotas === "si" || offerData.tieneMascotas === "yes" ? t.yes : t.no}
                        </p>
                      </div>
                    </div>
                  )}
                  {offerData.pedidoEspecial && (
                    <div data-testid="text-special-request">
                      <p className="text-xs text-muted-foreground mb-1">{t.specialRequest}</p>
                      <p className="text-sm bg-white p-3 rounded border">{offerData.pedidoEspecial}</p>
                    </div>
                  )}
                  {offerData.signature && (
                    <div data-testid="img-signature">
                      <p className="text-xs text-muted-foreground mb-1">{t.signature}</p>
                      <div className="bg-white p-2 rounded border inline-block">
                        <img 
                          src={offerData.signature} 
                          alt="Signature" 
                          className="h-16 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Footer */}
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-xs text-muted-foreground" data-testid="section-footer">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t.generatedBy}
              </div>
              {offer.createdByName && (
                <div data-testid="text-created-by">
                  {t.createdBy}: {offer.createdByName}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
