import { useParams, Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  MessageCircle, 
  HelpCircle,
  DollarSign,
  Wrench,
  FileText,
  Users,
  Settings,
  Building2,
  Calendar,
  CreditCard,
  ClipboardList,
  Phone,
  Mail,
  AlertCircle,
  Lightbulb,
  Target
} from "lucide-react";

interface ModuleHelpContent {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: any;
  steps: { title: string; titleEn: string; description: string; descriptionEn: string }[];
  tips: { text: string; textEn: string }[];
  faqs: { q: string; qEn: string; a: string; aEn: string }[];
  relatedModules: { path: string; label: string; labelEn: string }[];
}

const moduleHelpData: Record<string, Record<string, ModuleHelpContent>> = {
  tenant: {
    payments: {
      title: "Pagos de Renta",
      titleEn: "Rent Payments",
      description: "Aprende cómo consultar, realizar y dar seguimiento a tus pagos de renta mensuales.",
      descriptionEn: "Learn how to view, make, and track your monthly rent payments.",
      icon: DollarSign,
      steps: [
        { 
          title: "Ver próximo pago", 
          titleEn: "View next payment",
          description: "En la sección de pagos verás la fecha límite y el monto de tu próximo pago de renta.",
          descriptionEn: "In the payments section you'll see the due date and amount of your next rent payment."
        },
        { 
          title: "Consultar historial", 
          titleEn: "Check payment history",
          description: "Revisa todos los pagos que has realizado con fechas, montos y estado de cada uno.",
          descriptionEn: "Review all payments you've made with dates, amounts, and status of each."
        },
        { 
          title: "Descargar recibos", 
          titleEn: "Download receipts",
          description: "Haz clic en cualquier pago para descargar el comprobante en PDF.",
          descriptionEn: "Click on any payment to download the receipt in PDF."
        },
        { 
          title: "Ver estado de pagos", 
          titleEn: "View payment status",
          description: "El indicador de color te muestra si estás al corriente (verde), próximo a vencer (amarillo) o vencido (rojo).",
          descriptionEn: "The color indicator shows if you're current (green), due soon (yellow), or overdue (red)."
        }
      ],
      tips: [
        { text: "Configura recordatorios para no olvidar la fecha de pago", textEn: "Set reminders so you don't forget the payment date" },
        { text: "Guarda tus comprobantes de pago como respaldo", textEn: "Save your payment receipts as backup" },
        { text: "Si tienes problemas para pagar, contacta a soporte antes de la fecha límite", textEn: "If you have trouble paying, contact support before the due date" }
      ],
      faqs: [
        { 
          q: "¿Cuándo debo pagar la renta?", 
          qEn: "When should I pay rent?",
          a: "El pago debe realizarse antes del día 5 de cada mes. Recibirás un recordatorio unos días antes.",
          aEn: "Payment must be made before the 5th of each month. You'll receive a reminder a few days before."
        },
        { 
          q: "¿Qué métodos de pago aceptan?", 
          qEn: "What payment methods do you accept?",
          a: "Aceptamos transferencia bancaria, depósito en efectivo y algunos medios electrónicos. Consulta los detalles en la sección de pagos.",
          aEn: "We accept bank transfer, cash deposit, and some electronic methods. Check the details in the payments section."
        },
        { 
          q: "¿Qué pasa si pago tarde?", 
          qEn: "What happens if I pay late?",
          a: "Se aplican cargos por mora según lo establecido en tu contrato. Contacta a soporte si tienes dificultades.",
          aEn: "Late fees apply as stated in your contract. Contact support if you have difficulties."
        }
      ],
      relatedModules: [
        { path: "/help/tenant/documents", label: "Documentos", labelEn: "Documents" },
        { path: "/help/tenant/maintenance", label: "Mantenimiento", labelEn: "Maintenance" }
      ]
    },
    maintenance: {
      title: "Mantenimiento y Reportes",
      titleEn: "Maintenance and Reports",
      description: "Aprende a reportar problemas en tu unidad y dar seguimiento a las solicitudes de mantenimiento.",
      descriptionEn: "Learn to report issues in your unit and track maintenance requests.",
      icon: Wrench,
      steps: [
        { 
          title: "Crear un reporte", 
          titleEn: "Create a report",
          description: "Haz clic en 'Nuevo Reporte', describe el problema y adjunta fotos si es posible.",
          descriptionEn: "Click 'New Report', describe the issue and attach photos if possible."
        },
        { 
          title: "Categorizar el problema", 
          titleEn: "Categorize the issue",
          description: "Selecciona la categoría correcta (plomería, eléctrico, aires, etc.) para agilizar la atención.",
          descriptionEn: "Select the correct category (plumbing, electrical, AC, etc.) to speed up service."
        },
        { 
          title: "Seguimiento del reporte", 
          titleEn: "Track the report",
          description: "Ve el estado actualizado de tu solicitud: Pendiente, En Proceso, Completado.",
          descriptionEn: "See the updated status of your request: Pending, In Progress, Completed."
        },
        { 
          title: "Calificar el servicio", 
          titleEn: "Rate the service",
          description: "Una vez resuelto, puedes calificar la atención recibida.",
          descriptionEn: "Once resolved, you can rate the service received."
        }
      ],
      tips: [
        { text: "Toma fotos claras del problema para ayudar al técnico", textEn: "Take clear photos of the problem to help the technician" },
        { text: "Proporciona horarios de disponibilidad para la visita del técnico", textEn: "Provide availability times for the technician's visit" },
        { text: "Los problemas urgentes (fugas de agua, fallas eléctricas) tienen prioridad", textEn: "Urgent issues (water leaks, electrical failures) have priority" }
      ],
      faqs: [
        { 
          q: "¿Cuánto tiempo tardan en atender mi reporte?", 
          qEn: "How long does it take to address my report?",
          a: "Dependiendo de la urgencia: emergencias en 24 horas, problemas normales en 48-72 horas.",
          aEn: "Depending on urgency: emergencies in 24 hours, normal issues in 48-72 hours."
        },
        { 
          q: "¿Quién paga las reparaciones?", 
          qEn: "Who pays for repairs?",
          a: "El propietario cubre reparaciones por desgaste normal. Daños causados por el inquilino pueden tener costo.",
          aEn: "The owner covers repairs for normal wear. Damage caused by the tenant may have a cost."
        },
        { 
          q: "¿Puedo contratar mi propio técnico?", 
          qEn: "Can I hire my own technician?",
          a: "Por garantía y seguridad, te pedimos usar los proveedores autorizados. Consulta antes de contratar externamente.",
          aEn: "For warranty and safety, we ask you to use authorized providers. Check before hiring externally."
        }
      ],
      relatedModules: [
        { path: "/help/tenant/payments", label: "Pagos", labelEn: "Payments" },
        { path: "/help/tenant/documents", label: "Documentos", labelEn: "Documents" }
      ]
    },
    documents: {
      title: "Documentos y Contratos",
      titleEn: "Documents and Contracts",
      description: "Accede a todos los documentos relacionados con tu contrato de renta.",
      descriptionEn: "Access all documents related to your rental contract.",
      icon: FileText,
      steps: [
        { 
          title: "Ver tu contrato", 
          titleEn: "View your contract",
          description: "Encuentra tu contrato firmado con todos los términos y condiciones.",
          descriptionEn: "Find your signed contract with all terms and conditions."
        },
        { 
          title: "Descargar documentos", 
          titleEn: "Download documents",
          description: "Haz clic en el ícono de descarga para obtener PDFs de contratos y recibos.",
          descriptionEn: "Click the download icon to get PDFs of contracts and receipts."
        },
        { 
          title: "Revisar inventario", 
          titleEn: "Review inventory",
          description: "Consulta el inventario de la unidad que se firmó al inicio del contrato.",
          descriptionEn: "Check the unit inventory that was signed at the start of the contract."
        },
        { 
          title: "Ver reglamento", 
          titleEn: "View rules",
          description: "Accede al reglamento del condominio y normas de convivencia.",
          descriptionEn: "Access the condominium rules and coexistence guidelines."
        }
      ],
      tips: [
        { text: "Guarda copias de todos los documentos importantes en tu dispositivo", textEn: "Save copies of all important documents on your device" },
        { text: "Revisa el inventario al inicio para reportar cualquier discrepancia", textEn: "Review the inventory at the start to report any discrepancies" },
        { text: "Conoce el reglamento para evitar infracciones", textEn: "Know the rules to avoid violations" }
      ],
      faqs: [
        { 
          q: "¿Puedo solicitar cambios en mi contrato?", 
          qEn: "Can I request changes to my contract?",
          a: "Los cambios deben solicitarse con anticipación y aprobarse por ambas partes. Contacta a soporte para más información.",
          aEn: "Changes must be requested in advance and approved by both parties. Contact support for more information."
        },
        { 
          q: "¿Dónde veo la fecha de fin de mi contrato?", 
          qEn: "Where can I see my contract end date?",
          a: "La fecha de término aparece en los detalles del contrato y en el dashboard de tu portal.",
          aEn: "The end date appears in the contract details and on your portal dashboard."
        }
      ],
      relatedModules: [
        { path: "/help/tenant/payments", label: "Pagos", labelEn: "Payments" },
        { path: "/help/tenant/maintenance", label: "Mantenimiento", labelEn: "Maintenance" }
      ]
    }
  },
  owner: {
    payments: {
      title: "Pagos e Ingresos",
      titleEn: "Payments and Income",
      description: "Consulta los pagos recibidos de tus rentas y el estado de tus ingresos.",
      descriptionEn: "Check payments received from your rentals and the status of your income.",
      icon: DollarSign,
      steps: [
        { 
          title: "Ver resumen mensual", 
          titleEn: "View monthly summary",
          description: "El dashboard muestra cuánto has recibido este mes por cada propiedad.",
          descriptionEn: "The dashboard shows how much you've received this month for each property."
        },
        { 
          title: "Consultar próximos depósitos", 
          titleEn: "Check upcoming deposits",
          description: "Ve las fechas estimadas de los próximos pagos a tu cuenta.",
          descriptionEn: "See estimated dates for upcoming payments to your account."
        },
        { 
          title: "Revisar deducciones", 
          titleEn: "Review deductions",
          description: "Consulta el desglose de comisiones, gastos de mantenimiento y otros descuentos.",
          descriptionEn: "Check the breakdown of commissions, maintenance expenses, and other deductions."
        },
        { 
          title: "Exportar reportes", 
          titleEn: "Export reports",
          description: "Descarga reportes mensuales o anuales para tu contabilidad.",
          descriptionEn: "Download monthly or annual reports for your accounting."
        }
      ],
      tips: [
        { text: "Revisa los reportes mensuales para tener control de tus finanzas", textEn: "Review monthly reports to keep track of your finances" },
        { text: "Verifica que los datos bancarios estén actualizados", textEn: "Verify that your bank details are up to date" },
        { text: "Guarda los reportes para tus declaraciones fiscales", textEn: "Save reports for your tax returns" }
      ],
      faqs: [
        { 
          q: "¿Cuándo recibo el pago de la renta?", 
          qEn: "When do I receive rent payment?",
          a: "Los pagos se depositan entre el día 1 y 5 de cada mes, después de descontar la comisión de administración.",
          aEn: "Payments are deposited between the 1st and 5th of each month, after deducting the management commission."
        },
        { 
          q: "¿Por qué mi pago fue menor al esperado?", 
          qEn: "Why was my payment less than expected?",
          a: "Puede haber deducciones por mantenimiento, servicios o comisiones. Revisa el desglose en tu reporte mensual.",
          aEn: "There may be deductions for maintenance, services, or commissions. Check the breakdown in your monthly report."
        }
      ],
      relatedModules: [
        { path: "/help/owner/documents", label: "Documentos", labelEn: "Documents" },
        { path: "/help/owner/maintenance", label: "Mantenimiento", labelEn: "Maintenance" }
      ]
    },
    maintenance: {
      title: "Mantenimiento de Propiedades",
      titleEn: "Property Maintenance",
      description: "Gestiona y supervisa el mantenimiento de tus propiedades en renta.",
      descriptionEn: "Manage and supervise maintenance of your rental properties.",
      icon: Wrench,
      steps: [
        { 
          title: "Ver reportes activos", 
          titleEn: "View active reports",
          description: "Consulta los reportes de mantenimiento pendientes o en proceso de tus propiedades.",
          descriptionEn: "Check pending or in-progress maintenance reports for your properties."
        },
        { 
          title: "Aprobar trabajos", 
          titleEn: "Approve work",
          description: "Para trabajos mayores, recibirás notificaciones para aprobar presupuestos.",
          descriptionEn: "For major work, you'll receive notifications to approve quotes."
        },
        { 
          title: "Ver historial", 
          titleEn: "View history",
          description: "Consulta el historial completo de mantenimientos realizados.",
          descriptionEn: "Check the complete history of maintenance performed."
        },
        { 
          title: "Solicitar servicios", 
          titleEn: "Request services",
          description: "Crea solicitudes de mantenimiento preventivo o mejoras.",
          descriptionEn: "Create requests for preventive maintenance or improvements."
        }
      ],
      tips: [
        { text: "El mantenimiento preventivo reduce costos a largo plazo", textEn: "Preventive maintenance reduces long-term costs" },
        { text: "Responde rápido a las solicitudes de aprobación para agilizar reparaciones", textEn: "Respond quickly to approval requests to speed up repairs" },
        { text: "Mantén comunicación activa con el equipo de administración", textEn: "Keep active communication with the management team" }
      ],
      faqs: [
        { 
          q: "¿Quién paga las reparaciones?", 
          qEn: "Who pays for repairs?",
          a: "El propietario cubre reparaciones por desgaste normal. Daños causados por inquilinos pueden descontarse de su depósito.",
          aEn: "The owner covers repairs for normal wear. Damage caused by tenants may be deducted from their deposit."
        },
        { 
          q: "¿Puedo usar mis propios proveedores?", 
          qEn: "Can I use my own providers?",
          a: "Sí, puedes solicitar usar proveedores específicos. Coordínalo con el equipo de administración.",
          aEn: "Yes, you can request to use specific providers. Coordinate with the management team."
        }
      ],
      relatedModules: [
        { path: "/help/owner/payments", label: "Pagos", labelEn: "Payments" },
        { path: "/help/owner/documents", label: "Documentos", labelEn: "Documents" }
      ]
    },
    documents: {
      title: "Documentos y Contratos",
      titleEn: "Documents and Contracts",
      description: "Accede a contratos, documentos legales y comprobantes de tus propiedades.",
      descriptionEn: "Access contracts, legal documents, and receipts for your properties.",
      icon: FileText,
      steps: [
        { 
          title: "Ver contratos activos", 
          titleEn: "View active contracts",
          description: "Consulta los contratos vigentes con fechas, términos y datos de inquilinos.",
          descriptionEn: "Check current contracts with dates, terms, and tenant information."
        },
        { 
          title: "Descargar documentos", 
          titleEn: "Download documents",
          description: "Baja contratos firmados, identificaciones y comprobantes.",
          descriptionEn: "Download signed contracts, IDs, and receipts."
        },
        { 
          title: "Historial de contratos", 
          titleEn: "Contract history",
          description: "Accede a contratos anteriores y su documentación.",
          descriptionEn: "Access previous contracts and their documentation."
        },
        { 
          title: "Documentos fiscales", 
          titleEn: "Tax documents",
          description: "Encuentra constancias y documentos para tus declaraciones.",
          descriptionEn: "Find certificates and documents for your tax returns."
        }
      ],
      tips: [
        { text: "Mantén copias de todos los documentos importantes", textEn: "Keep copies of all important documents" },
        { text: "Revisa los contratos antes de firmar renovaciones", textEn: "Review contracts before signing renewals" },
        { text: "Consulta los documentos fiscales para tu contador", textEn: "Check tax documents for your accountant" }
      ],
      faqs: [
        { 
          q: "¿Puedo cambiar términos del contrato?", 
          qEn: "Can I change contract terms?",
          a: "Los cambios deben acordarse con el inquilino y formalizarse mediante un anexo al contrato.",
          aEn: "Changes must be agreed with the tenant and formalized through a contract addendum."
        },
        { 
          q: "¿Dónde veo el depósito de garantía?", 
          qEn: "Where can I see the security deposit?",
          a: "El monto y estado del depósito aparecen en los detalles del contrato activo.",
          aEn: "The deposit amount and status appear in the active contract details."
        }
      ],
      relatedModules: [
        { path: "/help/owner/payments", label: "Pagos", labelEn: "Payments" },
        { path: "/help/owner/maintenance", label: "Mantenimiento", labelEn: "Maintenance" }
      ]
    }
  },
  seller: {
    leads: {
      title: "Gestión de Leads",
      titleEn: "Lead Management",
      description: "Aprende a gestionar y dar seguimiento efectivo a tus leads de clientes potenciales.",
      descriptionEn: "Learn to manage and effectively follow up on your potential customer leads.",
      icon: Users,
      steps: [
        { 
          title: "Ver tablero Kanban", 
          titleEn: "View Kanban board",
          description: "El tablero organiza tus leads por estado: Nuevo, Contactado, Calificado, Mostrando, Negociando.",
          descriptionEn: "The board organizes your leads by status: New, Contacted, Qualified, Showing, Negotiating."
        },
        { 
          title: "Mover leads entre columnas", 
          titleEn: "Move leads between columns",
          description: "Arrastra y suelta las tarjetas para actualizar el estado de cada lead.",
          descriptionEn: "Drag and drop cards to update each lead's status."
        },
        { 
          title: "Registrar actividades", 
          titleEn: "Log activities",
          description: "Añade llamadas, emails, reuniones y notas para mantener un historial completo.",
          descriptionEn: "Add calls, emails, meetings, and notes to maintain a complete history."
        },
        { 
          title: "Convertir a cliente", 
          titleEn: "Convert to client",
          description: "Cuando un lead esté listo, conviértelo a cliente para iniciar el proceso de contrato.",
          descriptionEn: "When a lead is ready, convert them to a client to start the contract process."
        }
      ],
      tips: [
        { text: "Contacta a los leads nuevos en las primeras 24 horas", textEn: "Contact new leads within the first 24 hours" },
        { text: "Registra cada interacción para tener un historial completo", textEn: "Log every interaction to have a complete history" },
        { text: "Usa los filtros para enfocarte en leads prioritarios", textEn: "Use filters to focus on priority leads" },
        { text: "Configura recordatorios para seguimientos pendientes", textEn: "Set reminders for pending follow-ups" }
      ],
      faqs: [
        { 
          q: "¿Cómo me asignan nuevos leads?", 
          qEn: "How are new leads assigned to me?",
          a: "Los leads se asignan automáticamente según disponibilidad y zona, o manualmente por un administrador.",
          aEn: "Leads are assigned automatically based on availability and zone, or manually by an administrator."
        },
        { 
          q: "¿Qué hago si un lead no responde?", 
          qEn: "What do I do if a lead doesn't respond?",
          a: "Intenta contactarlo por diferentes canales. Si después de 3 intentos no hay respuesta, puedes moverlo a 'Perdido'.",
          aEn: "Try contacting them through different channels. If no response after 3 attempts, you can move them to 'Lost'."
        },
        { 
          q: "¿Puedo ver leads de otros vendedores?", 
          qEn: "Can I see other sellers' leads?",
          a: "Solo puedes ver tus propios leads asignados, a menos que tengas permisos de supervisor.",
          aEn: "You can only see your own assigned leads, unless you have supervisor permissions."
        }
      ],
      relatedModules: []
    }
  },
  agency: {
    settings: {
      title: "Configuración de Agencia",
      titleEn: "Agency Settings",
      description: "Administra la configuración, comisiones e integraciones de tu agencia.",
      descriptionEn: "Manage your agency's settings, commissions, and integrations.",
      icon: Settings,
      steps: [
        { 
          title: "Datos de la agencia", 
          titleEn: "Agency information",
          description: "Configura el nombre, logo, dirección y datos de contacto de tu agencia.",
          descriptionEn: "Set up your agency's name, logo, address, and contact information."
        },
        { 
          title: "Estructura de comisiones", 
          titleEn: "Commission structure",
          description: "Define los porcentajes de comisión por tipo de operación (renta larga, corta, venta).",
          descriptionEn: "Define commission percentages by operation type (long-term rent, short-term, sale)."
        },
        { 
          title: "Configurar notificaciones", 
          titleEn: "Set up notifications",
          description: "Elige cómo y cuándo recibir alertas sobre leads, pagos y actividad.",
          descriptionEn: "Choose how and when to receive alerts about leads, payments, and activity."
        },
        { 
          title: "Importación de emails", 
          titleEn: "Email import",
          description: "Conecta fuentes de email para importar leads automáticamente desde portales.",
          descriptionEn: "Connect email sources to automatically import leads from portals."
        }
      ],
      tips: [
        { text: "Mantén actualizado el logo y datos de contacto para profesionalismo", textEn: "Keep logo and contact info updated for professionalism" },
        { text: "Revisa las comisiones periódicamente para mantener competitividad", textEn: "Review commissions periodically to stay competitive" },
        { text: "Configura las notificaciones según tus preferencias de trabajo", textEn: "Set up notifications according to your work preferences" }
      ],
      faqs: [
        { 
          q: "¿Cómo cambio el logo de mi agencia?", 
          qEn: "How do I change my agency's logo?",
          a: "Ve a Configuración > Datos de la Agencia y haz clic en el ícono de la cámara para subir un nuevo logo.",
          aEn: "Go to Settings > Agency Information and click the camera icon to upload a new logo."
        },
        { 
          q: "¿Puedo tener diferentes comisiones por vendedor?", 
          qEn: "Can I have different commissions per seller?",
          a: "Sí, puedes configurar comisiones individuales desde la sección de Comisiones.",
          aEn: "Yes, you can set individual commissions from the Commissions section."
        }
      ],
      relatedModules: []
    }
  }
};

export default function RoleModuleHelp() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const params = useParams() as { role?: string; module?: string };
  const { role = "", module = "" } = params;
  
  const roleContent = moduleHelpData[role];
  const moduleContent = roleContent?.[module];
  
  if (!moduleContent) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="border-destructive/50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {isSpanish ? "Página de ayuda no encontrada" : "Help page not found"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isSpanish 
                ? "El contenido de ayuda solicitado no está disponible." 
                : "The requested help content is not available."}
            </p>
            <Link href="/ayuda">
              <Button variant="outline" data-testid="button-back-to-help">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {isSpanish ? "Volver al centro de ayuda" : "Back to help center"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const Icon = moduleContent.icon;
  const title = isSpanish ? moduleContent.title : moduleContent.titleEn;
  const description = isSpanish ? moduleContent.description : moduleContent.descriptionEn;
  
  const getBreadcrumb = () => {
    const roleLabels: Record<string, { es: string; en: string }> = {
      tenant: { es: "Inquilino", en: "Tenant" },
      owner: { es: "Propietario", en: "Owner" },
      seller: { es: "Vendedor", en: "Seller" },
      agency: { es: "Agencia", en: "Agency" }
    };
    const roleLabel = roleLabels[role]?.[isSpanish ? "es" : "en"] || role;
    return `${isSpanish ? "Ayuda" : "Help"} / ${roleLabel} / ${title}`;
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-4xl">
      <div className="space-y-2" data-testid="help-module-header">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          {getBreadcrumb()}
        </div>
        
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </div>
          
          <Link href="/ayuda">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isSpanish ? "Volver" : "Back"}
            </Button>
          </Link>
        </div>
      </div>

      <Card data-testid="card-how-to-steps">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {isSpanish ? "Cómo usar esta sección" : "How to use this section"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moduleContent.steps.map((step, idx) => (
              <div 
                key={idx} 
                className="flex gap-4 p-4 bg-muted/50 rounded-lg"
                data-testid={`step-item-${idx}`}
              >
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold mb-1">
                    {isSpanish ? step.title : step.titleEn}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {isSpanish ? step.description : step.descriptionEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-tips">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            {isSpanish ? "Consejos útiles" : "Helpful tips"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {moduleContent.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3" data-testid={`tip-item-${idx}`}>
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {isSpanish ? tip.text : tip.textEn}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card data-testid="card-faqs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {isSpanish ? "Preguntas frecuentes" : "Frequently asked questions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moduleContent.faqs.map((faq, idx) => (
              <div key={idx} className="space-y-2" data-testid={`faq-item-${idx}`}>
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {isSpanish ? "P" : "Q"}
                  </Badge>
                  {isSpanish ? faq.q : faq.qEn}
                </h4>
                <p className="text-sm text-muted-foreground pl-8">
                  {isSpanish ? faq.a : faq.aEn}
                </p>
                {idx < moduleContent.faqs.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {moduleContent.relatedModules.length > 0 && (
        <Card data-testid="card-related">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {isSpanish ? "Temas relacionados" : "Related topics"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {moduleContent.relatedModules.map((related, idx) => (
                <Link key={idx} href={related.path}>
                  <Button variant="outline" size="sm" data-testid={`link-related-${idx}`}>
                    {isSpanish ? related.label : related.labelEn}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-primary/5 border-primary/20" data-testid="card-support">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">
                {isSpanish ? "¿Necesitas más ayuda?" : "Need more help?"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isSpanish 
                  ? "Contacta a nuestro equipo de soporte" 
                  : "Contact our support team"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <a 
              href="mailto:soporte@tulumrentalhomes.com" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover-elevate active-elevate-2 h-10 px-4 py-2"
              data-testid="link-email-support"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </a>
            <a 
              href="https://wa.me/529841234567" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover-elevate active-elevate-2 h-10 px-4 py-2"
              data-testid="link-whatsapp-support"
            >
              <Phone className="h-4 w-4 mr-2" />
              WhatsApp
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
