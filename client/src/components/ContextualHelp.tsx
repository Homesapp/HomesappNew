import { useState } from "react";
import { HelpCircle, X, ExternalLink, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";

export interface HelpContent {
  titleKey: string;
  descriptionKey: string;
  bullets: Array<{
    textKey: string;
  }>;
  detailLink?: string;
}

interface ContextualHelpProps {
  helpKey: string;
  className?: string;
  iconSize?: "sm" | "md" | "lg";
}

const helpContent: Record<string, { es: HelpContent; en: HelpContent }> = {
  "tenant-payments": {
    es: {
      titleKey: "Ayuda con Pagos",
      descriptionKey: "En esta sección puedes gestionar tus pagos de renta y servicios.",
      bullets: [
        { textKey: "Ver el historial completo de tus pagos de renta" },
        { textKey: "Subir comprobantes de pago para verificación" },
        { textKey: "Los estados son: Pendiente (amarillo), Verificado (verde), Rechazado (rojo)" },
        { textKey: "Paso 1: Selecciona un pago pendiente" },
        { textKey: "Paso 2: Sube el comprobante de pago (imagen o PDF)" },
        { textKey: "Paso 3: Espera la verificación del propietario o administrador" },
      ],
      detailLink: "/help/tenant/payments",
    },
    en: {
      titleKey: "Help with Payments",
      descriptionKey: "In this section you can manage your rent and service payments.",
      bullets: [
        { textKey: "View the complete history of your rent payments" },
        { textKey: "Upload payment receipts for verification" },
        { textKey: "Statuses are: Pending (yellow), Verified (green), Rejected (red)" },
        { textKey: "Step 1: Select a pending payment" },
        { textKey: "Step 2: Upload the payment receipt (image or PDF)" },
        { textKey: "Step 3: Wait for verification from the owner or administrator" },
      ],
      detailLink: "/help/tenant/payments",
    },
  },
  "tenant-maintenance": {
    es: {
      titleKey: "Ayuda con Mantenimiento",
      descriptionKey: "Reporta y da seguimiento a problemas de mantenimiento en tu propiedad.",
      bullets: [
        { textKey: "Crear tickets de mantenimiento para reportar problemas" },
        { textKey: "Adjuntar fotos para describir mejor el problema" },
        { textKey: "Estados: Abierto → En progreso → Resuelto" },
        { textKey: "Paso 1: Haz clic en 'Nuevo ticket'" },
        { textKey: "Paso 2: Describe el problema y adjunta fotos" },
        { textKey: "Paso 3: Recibirás actualizaciones cuando el equipo trabaje en él" },
      ],
      detailLink: "/help/tenant/maintenance",
    },
    en: {
      titleKey: "Help with Maintenance",
      descriptionKey: "Report and track maintenance issues in your property.",
      bullets: [
        { textKey: "Create maintenance tickets to report problems" },
        { textKey: "Attach photos to better describe the issue" },
        { textKey: "Statuses: Open → In Progress → Resolved" },
        { textKey: "Step 1: Click on 'New ticket'" },
        { textKey: "Step 2: Describe the problem and attach photos" },
        { textKey: "Step 3: You will receive updates when the team works on it" },
      ],
      detailLink: "/help/tenant/maintenance",
    },
  },
  "tenant-documents": {
    es: {
      titleKey: "Ayuda con Documentos",
      descriptionKey: "Accede a todos los documentos relacionados con tu contrato de renta.",
      bullets: [
        { textKey: "Ver y descargar tu contrato de arrendamiento" },
        { textKey: "Acceder a recibos de pago y comprobantes" },
        { textKey: "Consultar el reglamento del condominio" },
        { textKey: "Los documentos están organizados por categoría" },
        { textKey: "Puedes descargar en PDF para guardar una copia" },
      ],
      detailLink: "/help/tenant/documents",
    },
    en: {
      titleKey: "Help with Documents",
      descriptionKey: "Access all documents related to your rental contract.",
      bullets: [
        { textKey: "View and download your lease agreement" },
        { textKey: "Access payment receipts and proofs" },
        { textKey: "Check the condominium regulations" },
        { textKey: "Documents are organized by category" },
        { textKey: "You can download as PDF to keep a copy" },
      ],
      detailLink: "/help/tenant/documents",
    },
  },
  "owner-payments": {
    es: {
      titleKey: "Ayuda con Pagos",
      descriptionKey: "Revisa y verifica los pagos de tus inquilinos.",
      bullets: [
        { textKey: "Ver todos los pagos registrados por tus inquilinos" },
        { textKey: "Verificar o rechazar comprobantes de pago" },
        { textKey: "Estados: Pendiente (esperando verificación), Verificado, Rechazado" },
        { textKey: "Paso 1: Revisa el comprobante adjunto" },
        { textKey: "Paso 2: Confirma que el monto y fecha son correctos" },
        { textKey: "Paso 3: Marca como verificado o rechazado con motivo" },
      ],
      detailLink: "/help/owner/payments",
    },
    en: {
      titleKey: "Help with Payments",
      descriptionKey: "Review and verify your tenants' payments.",
      bullets: [
        { textKey: "View all payments registered by your tenants" },
        { textKey: "Verify or reject payment receipts" },
        { textKey: "Statuses: Pending (awaiting verification), Verified, Rejected" },
        { textKey: "Step 1: Review the attached receipt" },
        { textKey: "Step 2: Confirm amount and date are correct" },
        { textKey: "Step 3: Mark as verified or rejected with reason" },
      ],
      detailLink: "/help/owner/payments",
    },
  },
  "owner-maintenance": {
    es: {
      titleKey: "Ayuda con Mantenimiento",
      descriptionKey: "Gestiona los tickets de mantenimiento de tus propiedades.",
      bullets: [
        { textKey: "Ver tickets abiertos por tus inquilinos" },
        { textKey: "Asignar proveedores de servicio a los tickets" },
        { textKey: "Aprobar o rechazar solicitudes de mantenimiento" },
        { textKey: "Estados: Abierto → Asignado → En progreso → Resuelto" },
        { textKey: "Puedes agregar comentarios y actualizaciones" },
      ],
      detailLink: "/help/owner/maintenance",
    },
    en: {
      titleKey: "Help with Maintenance",
      descriptionKey: "Manage maintenance tickets for your properties.",
      bullets: [
        { textKey: "View tickets opened by your tenants" },
        { textKey: "Assign service providers to tickets" },
        { textKey: "Approve or reject maintenance requests" },
        { textKey: "Statuses: Open → Assigned → In Progress → Resolved" },
        { textKey: "You can add comments and updates" },
      ],
      detailLink: "/help/owner/maintenance",
    },
  },
  "owner-documents": {
    es: {
      titleKey: "Ayuda con Documentos",
      descriptionKey: "Gestiona los documentos de tus contratos y propiedades.",
      bullets: [
        { textKey: "Ver contratos activos con tus inquilinos" },
        { textKey: "Descargar reportes financieros" },
        { textKey: "Acceder a documentos legales de la propiedad" },
        { textKey: "Subir documentos adicionales si es necesario" },
        { textKey: "Los documentos se organizan por propiedad y contrato" },
      ],
      detailLink: "/help/owner/documents",
    },
    en: {
      titleKey: "Help with Documents",
      descriptionKey: "Manage documents for your contracts and properties.",
      bullets: [
        { textKey: "View active contracts with your tenants" },
        { textKey: "Download financial reports" },
        { textKey: "Access legal documents for the property" },
        { textKey: "Upload additional documents if needed" },
        { textKey: "Documents are organized by property and contract" },
      ],
      detailLink: "/help/owner/documents",
    },
  },
  "seller-leads": {
    es: {
      titleKey: "Ayuda con Leads",
      descriptionKey: "Gestiona tus prospectos y avanza en el proceso de venta o renta.",
      bullets: [
        { textKey: "Ver todos tus leads organizados por estado" },
        { textKey: "Arrastrar leads entre columnas para cambiar su estado" },
        { textKey: "Estados: Nuevo → Contactado → Calificado → En negociación → Cerrado" },
        { textKey: "Haz clic en un lead para ver detalles y agregar notas" },
        { textKey: "Usa filtros para encontrar leads específicos" },
        { textKey: "Comparte tu catálogo para generar nuevos leads" },
      ],
      detailLink: "/help/seller/leads",
    },
    en: {
      titleKey: "Help with Leads",
      descriptionKey: "Manage your prospects and advance in the sales or rental process.",
      bullets: [
        { textKey: "View all your leads organized by status" },
        { textKey: "Drag leads between columns to change their status" },
        { textKey: "Statuses: New → Contacted → Qualified → Negotiating → Closed" },
        { textKey: "Click on a lead to view details and add notes" },
        { textKey: "Use filters to find specific leads" },
        { textKey: "Share your catalog to generate new leads" },
      ],
      detailLink: "/help/seller/leads",
    },
  },
  "agency-settings": {
    es: {
      titleKey: "Ayuda con Configuración de Agencia",
      descriptionKey: "Configura tu agencia y gestiona los accesos de tu equipo.",
      bullets: [
        { textKey: "Personaliza el logo y nombre de tu agencia" },
        { textKey: "Invita a nuevos miembros del equipo" },
        { textKey: "Asigna roles y permisos a cada usuario" },
        { textKey: "Configura las notificaciones de la agencia" },
        { textKey: "Gestiona las integraciones y conexiones" },
      ],
      detailLink: "/help/agency/settings",
    },
    en: {
      titleKey: "Help with Agency Settings",
      descriptionKey: "Configure your agency and manage team access.",
      bullets: [
        { textKey: "Customize your agency logo and name" },
        { textKey: "Invite new team members" },
        { textKey: "Assign roles and permissions to each user" },
        { textKey: "Configure agency notifications" },
        { textKey: "Manage integrations and connections" },
      ],
      detailLink: "/help/agency/settings",
    },
  },
};

export function ContextualHelp({ helpKey, className = "", iconSize = "md" }: ContextualHelpProps) {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const [, setLocation] = useLocation();

  const content = helpContent[helpKey]?.[language] || helpContent[helpKey]?.es;

  if (!content) {
    return null;
  }

  const iconSizeClass = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }[iconSize];

  const buttonSizeClass = {
    sm: "h-7 w-7",
    md: "h-8 w-8",
    lg: "h-9 w-9",
  }[iconSize];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`${buttonSizeClass} rounded-full hover:bg-primary/10 ${className}`}
          data-testid={`button-help-${helpKey}`}
        >
          <HelpCircle className={`${iconSizeClass} text-muted-foreground hover:text-primary`} />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md"
        data-testid={`sheet-help-${helpKey}`}
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2" data-testid={`title-help-${helpKey}`}>
            <HelpCircle className="h-5 w-5 text-primary" />
            {content.titleKey}
          </SheetTitle>
          <SheetDescription data-testid={`desc-help-${helpKey}`}>
            {content.descriptionKey}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] mt-6 pr-4">
          <div className="space-y-4">
            <ul className="space-y-3">
              {content.bullets.map((bullet, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-3"
                  data-testid={`bullet-help-${helpKey}-${index}`}
                >
                  <ChevronRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{bullet.textKey}</span>
                </li>
              ))}
            </ul>

            {content.detailLink && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => {
                    setOpen(false);
                    setLocation(content.detailLink!);
                  }}
                  data-testid={`button-help-detail-${helpKey}`}
                >
                  <span>
                    {language === "es" ? "Ver guía completa" : "View complete guide"}
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export function HelpPageHeader({ 
  title, 
  helpKey, 
  children 
}: { 
  title: string; 
  helpKey: string; 
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <h2 className="text-xl font-semibold" data-testid={`heading-${helpKey}`}>{title}</h2>
      <div className="flex items-center gap-2">
        {children}
        <ContextualHelp helpKey={helpKey} />
      </div>
    </div>
  );
}
