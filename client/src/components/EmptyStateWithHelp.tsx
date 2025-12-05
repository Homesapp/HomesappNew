import { LucideIcon, Package, FileText, Wrench, CreditCard, Users, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";

interface EmptyStateAction {
  labelKey: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "secondary";
}

interface EmptyStateWithHelpProps {
  stateKey: string;
  icon?: LucideIcon;
  className?: string;
  actions?: EmptyStateAction[];
}

interface EmptyStateContent {
  title: string;
  description: string;
  defaultIcon: LucideIcon;
  defaultActions: EmptyStateAction[];
}

const emptyStates: Record<string, { es: EmptyStateContent; en: EmptyStateContent }> = {
  "tenant-payments": {
    es: {
      title: "Sin pagos registrados",
      description: "Aquí verás tu historial de pagos de renta y servicios. En cuanto registremos tu primer pago, aparecerá en esta lista.",
      defaultIcon: CreditCard,
      defaultActions: [
        { labelKey: "Ver mi contrato", href: "/portal/tenant", icon: FileText, variant: "outline" },
      ],
    },
    en: {
      title: "No payments registered",
      description: "Here you will see your rent and service payment history. As soon as we register your first payment, it will appear in this list.",
      defaultIcon: CreditCard,
      defaultActions: [
        { labelKey: "View my contract", href: "/portal/tenant", icon: FileText, variant: "outline" },
      ],
    },
  },
  "tenant-maintenance": {
    es: {
      title: "Sin tickets de mantenimiento",
      description: "¡Todo en orden! No tienes tickets de mantenimiento abiertos. Si algo necesita atención, puedes crear un nuevo ticket.",
      defaultIcon: Wrench,
      defaultActions: [
        { labelKey: "Crear primer ticket", href: "/portal/tenant/maintenance/new", icon: Wrench, variant: "default" },
      ],
    },
    en: {
      title: "No maintenance tickets",
      description: "All good! You don't have any open maintenance tickets. If something needs attention, you can create a new ticket.",
      defaultIcon: Wrench,
      defaultActions: [
        { labelKey: "Create first ticket", href: "/portal/tenant/maintenance/new", icon: Wrench, variant: "default" },
      ],
    },
  },
  "tenant-documents": {
    es: {
      title: "Sin documentos disponibles",
      description: "Los documentos de tu contrato aparecerán aquí cuando estén disponibles. Esto incluye tu contrato, recibos y reglamentos.",
      defaultIcon: FolderOpen,
      defaultActions: [],
    },
    en: {
      title: "No documents available",
      description: "Your contract documents will appear here when available. This includes your lease, receipts, and regulations.",
      defaultIcon: FolderOpen,
      defaultActions: [],
    },
  },
  "owner-payments": {
    es: {
      title: "Sin movimientos registrados",
      description: "Aquí podrás revisar pagos marcados por tu inquilino y verificarlos. Por ahora no hay movimientos registrados para este contrato.",
      defaultIcon: CreditCard,
      defaultActions: [
        { labelKey: "Ver propiedades", href: "/mis-propiedades", icon: Package, variant: "outline" },
      ],
    },
    en: {
      title: "No movements registered",
      description: "Here you can review payments marked by your tenant and verify them. Currently there are no movements registered for this contract.",
      defaultIcon: CreditCard,
      defaultActions: [
        { labelKey: "View properties", href: "/mis-propiedades", icon: Package, variant: "outline" },
      ],
    },
  },
  "owner-maintenance": {
    es: {
      title: "Sin tickets de mantenimiento",
      description: "¡Excelente! No hay tickets de mantenimiento pendientes en tus propiedades. Los inquilinos pueden reportar problemas desde su portal.",
      defaultIcon: Wrench,
      defaultActions: [
        { labelKey: "Ver propiedades", href: "/mis-propiedades", icon: Package, variant: "outline" },
      ],
    },
    en: {
      title: "No maintenance tickets",
      description: "Excellent! There are no pending maintenance tickets on your properties. Tenants can report issues from their portal.",
      defaultIcon: Wrench,
      defaultActions: [
        { labelKey: "View properties", href: "/mis-propiedades", icon: Package, variant: "outline" },
      ],
    },
  },
  "owner-documents": {
    es: {
      title: "Sin documentos disponibles",
      description: "Los documentos de tus contratos y propiedades aparecerán aquí. Esto incluye contratos, reportes financieros y documentos legales.",
      defaultIcon: FolderOpen,
      defaultActions: [],
    },
    en: {
      title: "No documents available",
      description: "Documents for your contracts and properties will appear here. This includes contracts, financial reports, and legal documents.",
      defaultIcon: FolderOpen,
      defaultActions: [],
    },
  },
  "seller-leads": {
    es: {
      title: "Todavía no tienes leads",
      description: "Empieza compartiendo tu catálogo o tu link de captación para recibir interesados. Los leads que generes aparecerán aquí.",
      defaultIcon: Users,
      defaultActions: [
        { labelKey: "Ver catálogo de propiedades", href: "/seller-catalog", icon: Package, variant: "default" },
        { labelKey: "Copiar mi link de captación", icon: Users, variant: "outline" },
      ],
    },
    en: {
      title: "No leads yet",
      description: "Start sharing your catalog or capture link to receive interested prospects. The leads you generate will appear here.",
      defaultIcon: Users,
      defaultActions: [
        { labelKey: "View property catalog", href: "/seller-catalog", icon: Package, variant: "default" },
        { labelKey: "Copy my capture link", icon: Users, variant: "outline" },
      ],
    },
  },
  "external-leads": {
    es: {
      title: "Sin leads asignados",
      description: "Todavía no tienes leads asignados. Los leads que captures o te asignen aparecerán aquí para que les des seguimiento.",
      defaultIcon: Users,
      defaultActions: [
        { labelKey: "Ver catálogo", href: "/seller-catalog", icon: Package, variant: "default" },
        { labelKey: "Invitar agente", href: "/external/agency/team", icon: Users, variant: "outline" },
      ],
    },
    en: {
      title: "No assigned leads",
      description: "You don't have any assigned leads yet. Leads you capture or are assigned will appear here for follow-up.",
      defaultIcon: Users,
      defaultActions: [
        { labelKey: "View catalog", href: "/seller-catalog", icon: Package, variant: "default" },
        { labelKey: "Invite agent", href: "/external/agency/team", icon: Users, variant: "outline" },
      ],
    },
  },
  "agency-team": {
    es: {
      title: "Sin miembros en el equipo",
      description: "Invita a los miembros de tu agencia para que puedan gestionar propiedades y leads junto contigo.",
      defaultIcon: Users,
      defaultActions: [
        { labelKey: "Invitar primer miembro", icon: Users, variant: "default" },
      ],
    },
    en: {
      title: "No team members",
      description: "Invite your agency members so they can manage properties and leads with you.",
      defaultIcon: Users,
      defaultActions: [
        { labelKey: "Invite first member", icon: Users, variant: "default" },
      ],
    },
  },
};

export function EmptyStateWithHelp({ 
  stateKey, 
  icon: CustomIcon, 
  className = "",
  actions: customActions,
}: EmptyStateWithHelpProps) {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();

  const content = emptyStates[stateKey]?.[language] || emptyStates[stateKey]?.es;

  if (!content) {
    return (
      <Card className={`border-dashed ${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {language === "es" ? "No hay datos disponibles" : "No data available"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const Icon = CustomIcon || content.defaultIcon;
  const actions = customActions || content.defaultActions;

  return (
    <Card className={`border-dashed ${className}`} data-testid={`empty-state-${stateKey}`}>
      <CardContent className="flex flex-col items-center justify-center py-10 md:py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
        </div>
        
        <h3 
          className="text-lg font-semibold mb-2"
          data-testid={`empty-state-title-${stateKey}`}
        >
          {content.title}
        </h3>
        
        <p 
          className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed"
          data-testid={`empty-state-desc-${stateKey}`}
        >
          {content.description}
        </p>

        {actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "default"}
                onClick={() => {
                  if (action.onClick) {
                    action.onClick();
                  } else if (action.href) {
                    setLocation(action.href);
                  }
                }}
                className="w-full sm:w-auto"
                data-testid={`empty-state-action-${stateKey}-${index}`}
              >
                {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                {action.labelKey}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
