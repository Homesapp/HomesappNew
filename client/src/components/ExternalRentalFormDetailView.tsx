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
  Briefcase,
  Globe,
  Phone,
  Mail,
  CheckCircle2,
  Building2,
  PawPrint,
  CreditCard,
  Users,
  MapPin,
  Shield,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png";

interface TenantFormData {
  fullName?: string;
  address?: string;
  nationality?: string;
  age?: number;
  timeInTulum?: string;
  jobPosition?: string;
  companyName?: string;
  workplaceAddress?: string;
  monthlyIncome?: string;
  companyTenure?: string;
  maritalStatus?: string;
  whatsappNumber?: string;
  cellphone?: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  checkInDate?: string;
  numberOfTenants?: number;
  paymentMethod?: string;
  hasPets?: boolean;
  petDetails?: string;
  desiredProperty?: string;
  desiredCondoUnit?: string;
  guarantorFullName?: string;
  guarantorNationality?: string;
  guarantorAge?: number;
  guarantorJobPosition?: string;
  guarantorCompanyName?: string;
  guarantorMonthlyIncome?: string;
  guarantorWhatsappNumber?: string;
  guarantorEmail?: string;
  guarantorIdType?: string;
  guarantorIdNumber?: string;
  referenceFullName?: string;
  referenceRelationship?: string;
  referencePhoneNumber?: string;
  signature?: string;
}

interface OwnerFormData {
  fullName?: string;
  nationality?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  email?: string;
  subleasingAllowed?: boolean;
  propertyAddress?: string;
  condominiumName?: string;
  unitNumber?: string;
  monthlyRent?: number;
  currency?: string;
  depositMonths?: number;
  advanceMonths?: number;
  contractDuration?: string;
  includedServices?: string[];
  excludedServices?: string[];
  petPolicy?: string;
  additionalNotes?: string;
  signature?: string;
}

interface ExternalRentalFormDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rentalForm: {
    id: string;
    propertyTitle?: string;
    condominiumName?: string;
    unitNumber?: string;
    recipientType?: string;
    formData?: any;
    tenantData?: TenantFormData;
    ownerData?: OwnerFormData;
    createdAt?: string;
    createdByName?: string;
    clientName?: string;
    ownerName?: string;
    isUsed?: boolean;
    expiresAt?: string;
    agencyName?: string;
    agencyLogoUrl?: string;
  } | null;
}

const translations = {
  es: {
    tenantTitle: "FORMULARIO DE RENTA",
    ownerTitle: "FORMULARIO DE ARRENDADOR",
    subtitle: "LARGO PLAZO",
    downloadImage: "Descargar Imagen",
    downloading: "Descargando...",
    downloadSuccess: "Imagen descargada",
    downloadError: "Error al descargar",
    
    date: "Fecha",
    propertyLabel: "PROPIEDAD",
    
    tenantSection: "DATOS DEL ARRENDATARIO",
    guarantorSection: "DATOS DEL AVAL",
    referenceSection: "REFERENCIA PERSONAL",
    ownerSection: "DATOS DEL ARRENDADOR",
    propertyDetailsSection: "DETALLES DE LA PROPIEDAD",
    rentalTermsSection: "TÉRMINOS DEL ARRENDAMIENTO",
    
    fullName: "Nombre completo",
    address: "Dirección",
    nationality: "Nacionalidad",
    age: "Edad",
    timeInTulum: "Tiempo de residencia en Tulum",
    jobPosition: "Trabajo/Posición",
    companyName: "Empresa donde trabaja",
    workplaceAddress: "Dirección del trabajo",
    monthlyIncome: "Ingreso mensual",
    companyTenure: "Antigüedad en la empresa",
    maritalStatus: "Estado civil",
    whatsapp: "WhatsApp",
    cellphone: "Celular",
    email: "Correo electrónico",
    idType: "Tipo de identificación",
    idNumber: "Número de identificación",
    checkInDate: "Fecha de ingreso",
    numberOfTenants: "Número de ocupantes",
    paymentMethod: "Método de pago",
    hasPets: "¿Tiene mascotas?",
    petDetails: "Detalles de mascotas",
    desiredProperty: "Propiedad deseada",
    
    guarantorFullName: "Nombre del aval",
    guarantorNationality: "Nacionalidad del aval",
    guarantorAge: "Edad del aval",
    guarantorJobPosition: "Ocupación del aval",
    guarantorCompanyName: "Empresa del aval",
    guarantorMonthlyIncome: "Ingreso mensual del aval",
    guarantorWhatsapp: "WhatsApp del aval",
    guarantorEmail: "Email del aval",
    guarantorIdType: "Tipo de ID del aval",
    guarantorIdNumber: "Número de ID del aval",
    
    referenceFullName: "Nombre de la referencia",
    referenceRelationship: "Parentesco/Relación",
    referencePhone: "Teléfono de referencia",
    
    subleasingAllowed: "¿Permite subarrendamiento?",
    monthlyRent: "Renta mensual",
    depositMonths: "Meses de depósito",
    advanceMonths: "Meses de renta adelantada",
    contractDuration: "Duración del contrato",
    includedServices: "Servicios incluidos",
    excludedServices: "Servicios no incluidos",
    petPolicy: "Política de mascotas",
    additionalNotes: "Notas adicionales",
    
    signature: "Firma del solicitante",
    ownerSignature: "Firma del propietario",
    
    generatedBy: "Generado por HomesApp",
    createdBy: "Creado por",
    
    yes: "Sí",
    no: "No",
    yearsOld: "años",
    
    formalClosing: "Por medio del presente documento, se hace constar la información proporcionada para el proceso de arrendamiento.",
    sincerely: "Atte.",
    
    pending: "Pendiente",
    completed: "Completado",
    expired: "Expirado",
  },
  en: {
    tenantTitle: "RENTAL FORM",
    ownerTitle: "LANDLORD FORM",
    subtitle: "LONG TERM",
    downloadImage: "Download Image",
    downloading: "Downloading...",
    downloadSuccess: "Image downloaded",
    downloadError: "Download error",
    
    date: "Date",
    propertyLabel: "PROPERTY",
    
    tenantSection: "TENANT INFORMATION",
    guarantorSection: "GUARANTOR INFORMATION",
    referenceSection: "PERSONAL REFERENCE",
    ownerSection: "LANDLORD INFORMATION",
    propertyDetailsSection: "PROPERTY DETAILS",
    rentalTermsSection: "RENTAL TERMS",
    
    fullName: "Full name",
    address: "Address",
    nationality: "Nationality",
    age: "Age",
    timeInTulum: "Time living in Tulum",
    jobPosition: "Job/Position",
    companyName: "Company name",
    workplaceAddress: "Workplace address",
    monthlyIncome: "Monthly income",
    companyTenure: "Company tenure",
    maritalStatus: "Marital status",
    whatsapp: "WhatsApp",
    cellphone: "Cell phone",
    email: "Email",
    idType: "ID type",
    idNumber: "ID number",
    checkInDate: "Check-in date",
    numberOfTenants: "Number of occupants",
    paymentMethod: "Payment method",
    hasPets: "Has pets?",
    petDetails: "Pet details",
    desiredProperty: "Desired property",
    
    guarantorFullName: "Guarantor name",
    guarantorNationality: "Guarantor nationality",
    guarantorAge: "Guarantor age",
    guarantorJobPosition: "Guarantor occupation",
    guarantorCompanyName: "Guarantor company",
    guarantorMonthlyIncome: "Guarantor monthly income",
    guarantorWhatsapp: "Guarantor WhatsApp",
    guarantorEmail: "Guarantor email",
    guarantorIdType: "Guarantor ID type",
    guarantorIdNumber: "Guarantor ID number",
    
    referenceFullName: "Reference name",
    referenceRelationship: "Relationship",
    referencePhone: "Reference phone",
    
    subleasingAllowed: "Subleasing allowed?",
    monthlyRent: "Monthly rent",
    depositMonths: "Deposit months",
    advanceMonths: "Advance rent months",
    contractDuration: "Contract duration",
    includedServices: "Services included",
    excludedServices: "Services not included",
    petPolicy: "Pet policy",
    additionalNotes: "Additional notes",
    
    signature: "Applicant signature",
    ownerSignature: "Owner signature",
    
    generatedBy: "Generated by HomesApp",
    createdBy: "Created by",
    
    yes: "Yes",
    no: "No",
    yearsOld: "years old",
    
    formalClosing: "This document certifies the information provided for the rental process.",
    sincerely: "Sincerely,",
    
    pending: "Pending",
    completed: "Completed",
    expired: "Expired",
  }
};

export default function ExternalRentalFormDetailView({ 
  open, 
  onOpenChange, 
  rentalForm 
}: ExternalRentalFormDetailViewProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!rentalForm) return null;

  const t = translations[language as keyof typeof translations] || translations.es;
  const dateLocale = language === "es" ? es : enUS;
  
  const isOwnerForm = rentalForm.recipientType === 'owner';
  const formData = rentalForm.formData || (isOwnerForm ? rentalForm.ownerData : rentalForm.tenantData) || {};
  const agencyName = rentalForm.agencyName || "Agencia";
  
  const displayDate = rentalForm.createdAt 
    ? format(new Date(rentalForm.createdAt), "d 'de' MMMM, yyyy", { locale: dateLocale })
    : format(new Date(), "d 'de' MMMM, yyyy", { locale: dateLocale });
  
  const propertyTitle = rentalForm.condominiumName && rentalForm.unitNumber 
    ? `${rentalForm.condominiumName} - ${rentalForm.unitNumber}`
    : rentalForm.propertyTitle || formData.desiredProperty || "Propiedad";

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: dateLocale });
    } catch {
      return dateString;
    }
  };

  const handleDownloadImage = async () => {
    if (!contentRef.current) return;
    
    setIsDownloading(true);
    try {
      const mainCanvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 15000,
      });
      
      const ctx = mainCanvas.getContext('2d');
      
      const signature = formData.signature;
      if (ctx && signature) {
        const signatureImg = contentRef.current.querySelector('[data-testid="img-signature"]') as HTMLImageElement;
        if (signatureImg) {
          const rect = signatureImg.getBoundingClientRect();
          const containerRect = contentRef.current.getBoundingClientRect();
          
          const x = (rect.left - containerRect.left) * 2;
          const y = (rect.top - containerRect.top) * 2;
          const width = rect.width * 2;
          const height = rect.height * 2;
          
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, x, y, width, height);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = signature;
          });
        }
      }
      
      const link = document.createElement("a");
      const formType = isOwnerForm ? 'propietario' : 'inquilino';
      link.download = `formulario-${formType}-${rentalForm.unitNumber || rentalForm.id}.png`;
      link.href = mainCanvas.toDataURL("image/png");
      link.click();
      
      toast({
        title: t.downloadSuccess,
        description: `formulario-${formType}-${rentalForm.unitNumber || rentalForm.id}.png`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: t.downloadError,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const renderTenantForm = () => (
    <>
      {/* Tenant Information Section */}
      <div data-testid="section-tenant-info">
        <h2 className="text-sm font-bold text-primary mb-3 uppercase tracking-wide border-b pb-1">{t.tenantSection}</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.fullName}:</span>
            <span className="font-medium text-right" data-testid="text-full-name">{formData.fullName || formData.nombreCompleto || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.nationality}:</span>
            <span className="font-medium" data-testid="text-nationality">{formData.nationality || formData.nacionalidad || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.age}:</span>
            <span className="font-medium" data-testid="text-age">{formData.age ? `${formData.age} ${t.yearsOld}` : "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.address}:</span>
            <span className="font-medium text-right max-w-[200px] truncate" data-testid="text-address">{formData.address || formData.direccion || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.timeInTulum}:</span>
            <span className="font-medium" data-testid="text-time-tulum">{formData.timeInTulum || formData.tiempoResidenciaTulum || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.maritalStatus}:</span>
            <span className="font-medium" data-testid="text-marital">{formData.maritalStatus || formData.estadoCivil || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.jobPosition}:</span>
            <span className="font-medium" data-testid="text-job">{formData.jobPosition || formData.trabajoPosicion || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.companyName}:</span>
            <span className="font-medium text-right max-w-[150px] truncate" data-testid="text-company">{formData.companyName || formData.companiaTrabaja || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.monthlyIncome}:</span>
            <span className="font-medium" data-testid="text-income">{formData.monthlyIncome || formData.ingresoMensual || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.whatsapp}:</span>
            <span className="font-medium" data-testid="text-whatsapp">{formData.whatsappNumber || formData.whatsapp || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.email}:</span>
            <span className="font-medium text-right max-w-[180px] truncate" data-testid="text-email">{formData.email || formData.correo || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.idType}:</span>
            <span className="font-medium" data-testid="text-id-type">{formData.idType || formData.tipoId || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.checkInDate}:</span>
            <span className="font-medium" data-testid="text-checkin">{formatDate(formData.checkInDate || formData.fechaIngreso)}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.numberOfTenants}:</span>
            <span className="font-medium" data-testid="text-tenants">{formData.numberOfTenants || formData.numeroInquilinos || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.paymentMethod}:</span>
            <span className="font-medium" data-testid="text-payment">{formData.paymentMethod || formData.metodoPago || "-"}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="text-muted-foreground">{t.hasPets}:</span>
            <span className="font-medium" data-testid="text-pets">
              {formData.hasPets || formData.tieneMascotas ? t.yes : t.no}
              {formData.petDetails && ` - ${formData.petDetails}`}
            </span>
          </div>
        </div>
      </div>

      {/* Guarantor Section */}
      {(formData.guarantorFullName || formData.avalNombreCompleto) && (
        <div data-testid="section-guarantor" className="mt-4">
          <h2 className="text-sm font-bold text-primary mb-3 uppercase tracking-wide border-b pb-1">{t.guarantorSection}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-dotted pb-1">
              <span className="text-muted-foreground">{t.guarantorFullName}:</span>
              <span className="font-medium" data-testid="text-guarantor-name">{formData.guarantorFullName || formData.avalNombreCompleto || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-1">
              <span className="text-muted-foreground">{t.guarantorNationality}:</span>
              <span className="font-medium" data-testid="text-guarantor-nationality">{formData.guarantorNationality || formData.avalNacionalidad || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-1">
              <span className="text-muted-foreground">{t.guarantorJobPosition}:</span>
              <span className="font-medium" data-testid="text-guarantor-job">{formData.guarantorJobPosition || formData.avalOcupacion || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-1">
              <span className="text-muted-foreground">{t.guarantorMonthlyIncome}:</span>
              <span className="font-medium" data-testid="text-guarantor-income">{formData.guarantorMonthlyIncome || formData.avalIngresoMensual || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-1">
              <span className="text-muted-foreground">{t.guarantorWhatsapp}:</span>
              <span className="font-medium" data-testid="text-guarantor-whatsapp">{formData.guarantorWhatsappNumber || formData.avalWhatsapp || "-"}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-muted-foreground">{t.guarantorEmail}:</span>
              <span className="font-medium" data-testid="text-guarantor-email">{formData.guarantorEmail || formData.avalEmail || "-"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Personal Reference Section */}
      {(formData.referenceFullName || formData.referenciaNombre) && (
        <div data-testid="section-reference" className="mt-4">
          <h2 className="text-sm font-bold text-primary mb-3 uppercase tracking-wide border-b pb-1">{t.referenceSection}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-dotted pb-1">
              <span className="text-muted-foreground">{t.referenceFullName}:</span>
              <span className="font-medium" data-testid="text-ref-name">{formData.referenceFullName || formData.referenciaNombre || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-1">
              <span className="text-muted-foreground">{t.referenceRelationship}:</span>
              <span className="font-medium" data-testid="text-ref-relationship">{formData.referenceRelationship || formData.referenciaParentesco || "-"}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-muted-foreground">{t.referencePhone}:</span>
              <span className="font-medium" data-testid="text-ref-phone">{formData.referencePhoneNumber || formData.referenciaTelefono || "-"}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderOwnerForm = () => (
    <>
      {/* Owner Information Section */}
      <div data-testid="section-owner-info">
        <h2 className="text-sm font-bold text-primary mb-3 uppercase tracking-wide border-b pb-1">{t.ownerSection}</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.fullName}:</span>
            <span className="font-medium text-right" data-testid="text-owner-name">{formData.fullName || formData.nombreCompleto || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.nationality}:</span>
            <span className="font-medium" data-testid="text-owner-nationality">{formData.nationality || formData.nacionalidad || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.cellphone}:</span>
            <span className="font-medium" data-testid="text-owner-phone">{formData.phoneNumber || formData.telefono || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.whatsapp}:</span>
            <span className="font-medium" data-testid="text-owner-whatsapp">{formData.whatsappNumber || formData.whatsapp || "-"}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="text-muted-foreground">{t.email}:</span>
            <span className="font-medium" data-testid="text-owner-email">{formData.email || formData.correo || "-"}</span>
          </div>
        </div>
      </div>

      {/* Rental Terms Section */}
      <div data-testid="section-rental-terms" className="mt-4">
        <h2 className="text-sm font-bold text-primary mb-3 uppercase tracking-wide border-b pb-1">{t.rentalTermsSection}</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.monthlyRent}:</span>
            <span className="font-bold text-green-600" data-testid="text-monthly-rent">
              {formData.monthlyRent ? `$${formData.monthlyRent.toLocaleString()} ${formData.currency || 'MXN'}` : "-"}
            </span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.depositMonths}:</span>
            <span className="font-medium" data-testid="text-deposit">{formData.depositMonths || formData.mesesDeposito || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.advanceMonths}:</span>
            <span className="font-medium" data-testid="text-advance">{formData.advanceMonths || formData.mesesAdelanto || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.contractDuration}:</span>
            <span className="font-medium" data-testid="text-duration">{formData.contractDuration || formData.duracionContrato || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-dotted pb-1">
            <span className="text-muted-foreground">{t.subleasingAllowed}:</span>
            <span className="font-medium" data-testid="text-subleasing">
              {formData.subleasingAllowed || formData.permiteSubarrendamiento ? t.yes : t.no}
            </span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="text-muted-foreground">{t.petPolicy}:</span>
            <span className="font-medium" data-testid="text-pet-policy">{formData.petPolicy || formData.politicaMascotas || "-"}</span>
          </div>
          
          {/* Services */}
          {formData.includedServices && formData.includedServices.length > 0 && (
            <div className="pt-2 border-t border-dotted">
              <p className="text-muted-foreground mb-1">{t.includedServices}:</p>
              <p className="font-medium text-xs" data-testid="text-included-services">
                {formData.includedServices.join(", ")}
              </p>
            </div>
          )}
          
          {formData.excludedServices && formData.excludedServices.length > 0 && (
            <div className="pt-2">
              <p className="text-muted-foreground mb-1">{t.excludedServices}:</p>
              <p className="font-medium text-xs" data-testid="text-excluded-services">
                {formData.excludedServices.join(", ")}
              </p>
            </div>
          )}
          
          {formData.additionalNotes && (
            <div className="pt-2 border-t border-dotted">
              <p className="text-muted-foreground mb-1">{t.additionalNotes}:</p>
              <p className="font-medium text-xs bg-gray-50 p-2 rounded" data-testid="text-notes">
                {formData.additionalNotes}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-4 pb-2 border-b flex-row items-center justify-between">
          <DialogTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isOwnerForm ? t.ownerTitle : t.tenantTitle}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadImage}
              disabled={isDownloading}
              data-testid="button-download-image"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? t.downloading : t.downloadImage}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} data-testid="button-close">
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div 
            ref={contentRef} 
            className="p-6 bg-white"
            data-testid="rental-form-content"
          >
            {/* PDF-Style Header */}
            <div className="flex items-start justify-between mb-6">
              {/* Left: Logos with names */}
              <div className="flex items-start gap-6">
                {/* HomesApp Logo + Slogan */}
                <div className="flex flex-col items-center">
                  <img src={logoPath} alt="HomesApp" className="h-16 object-contain" crossOrigin="anonymous" />
                  <p className="text-[10px] text-muted-foreground mt-1 italic">Smart Real Estate</p>
                </div>
                
                {/* Agency Logo + Name */}
                <div className="flex flex-col items-center">
                  {rentalForm.agencyLogoUrl ? (
                    <img 
                      src={rentalForm.agencyLogoUrl} 
                      alt={agencyName} 
                      className="h-16 object-contain" 
                      crossOrigin="anonymous"
                      data-testid="img-agency-logo"
                    />
                  ) : (
                    <div className="h-16 flex items-center justify-center px-4 border rounded-lg bg-gray-50">
                      <p className="text-sm font-semibold text-gray-700">{agencyName}</p>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">{agencyName}</p>
                </div>
              </div>
              
              {/* Right: Date and Property */}
              <div className="text-right border-2 border-gray-300 rounded-lg p-3 min-w-[180px]">
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground uppercase">{t.date}</p>
                  <p className="font-semibold text-sm" data-testid="text-form-date">{displayDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">{t.propertyLabel}</p>
                  <p className="font-bold text-primary text-sm" data-testid="text-property-name">{propertyTitle}</p>
                </div>
              </div>
            </div>

            {/* Title Banner */}
            <div className="text-center mb-6 py-3 border-y-2 border-primary/30">
              <h1 className="text-2xl font-bold text-primary tracking-wide" data-testid="text-title">
                {isOwnerForm ? t.ownerTitle : t.tenantTitle}
              </h1>
              <p className="text-sm text-muted-foreground tracking-widest">{t.subtitle}</p>
            </div>

            {/* Form Content - Two Column Layout for Tenant, Single for Owner */}
            <div className={isOwnerForm ? "mb-6" : "grid grid-cols-2 gap-6 mb-6"}>
              {isOwnerForm ? renderOwnerForm() : renderTenantForm()}
            </div>

            {/* Signature and Closing */}
            <div className="grid grid-cols-2 gap-6 items-end">
              {/* Left: Signature */}
              <div className="text-center" data-testid="section-signature">
                <p className="text-xs text-muted-foreground mb-2">{isOwnerForm ? t.ownerSignature : t.signature}</p>
                {formData.signature ? (
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-white inline-block w-[200px] h-[80px] flex items-center justify-center">
                    <img 
                      src={formData.signature} 
                      alt="Signature" 
                      className="max-h-[64px] max-w-full object-contain"
                      crossOrigin="anonymous"
                      data-testid="img-signature"
                    />
                  </div>
                ) : (
                  <div className="border-b-2 border-gray-400 w-[200px] mx-auto h-[80px]"></div>
                )}
              </div>

              {/* Right: Formal Closing */}
              <div className="text-right text-sm" data-testid="section-closing">
                <p className="italic text-muted-foreground mb-3">{t.formalClosing}</p>
                <p className="font-semibold">{t.sincerely} {agencyName} ™</p>
              </div>
            </div>

            {/* Footer */}
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-xs text-muted-foreground" data-testid="section-footer">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t.generatedBy}
              </div>
              {rentalForm.createdByName && (
                <div data-testid="text-created-by">
                  {t.createdBy}: {rentalForm.createdByName}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
