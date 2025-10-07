import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X, Rocket } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface OnboardingStep {
  title: string;
  description: string;
  target?: string; // CSS selector or element ID to highlight
  action?: string; // Optional action text
}

interface OnboardingTourProps {
  userRole: string;
  onboardingCompleted: boolean;
  onboardingSteps?: Record<string, boolean>;
}

const tourSteps: Record<string, OnboardingStep[]> = {
  cliente: [
    {
      title: "¡Bienvenido a HomesApp!",
      description: "Estamos emocionados de ayudarte a encontrar tu hogar ideal en Tulum. Permítenos guiarte a través de las funciones principales.",
    },
    {
      title: "Explora Propiedades",
      description: "Usa el Dashboard para ver propiedades disponibles, filtrar por precio, ubicación y características. Todas las propiedades están verificadas por nuestro equipo.",
      target: "[data-testid='link-dashboard']",
    },
    {
      title: "Agenda Citas",
      description: "Cuando encuentres una propiedad que te interese, puedes agendar una visita directamente desde la tarjeta de la propiedad. Elige entre visitas individuales o tours de múltiples propiedades.",
      target: "[data-testid='link-appointments']",
    },
    {
      title: "Tarjetas de Presentación",
      description: "Guarda tus propiedades favoritas en tarjetas de presentación personalizadas. Podrás compartirlas con amigos o familiares.",
      target: "[data-testid='link-presentation-cards']",
    },
    {
      title: "Notificaciones",
      description: "Mantente al día con actualizaciones sobre tus citas, ofertas y nuevas propiedades que coincidan con tus preferencias.",
      target: "[data-testid='button-notifications']",
    },
    {
      title: "¡Listo para Empezar!",
      description: "Ya estás listo para comenzar tu búsqueda. Si tienes preguntas, nuestro equipo está aquí para ayudarte. ¡Buena suerte!",
    },
  ],
  owner: [
    {
      title: "¡Bienvenido Propietario!",
      description: "Gracias por confiar en HomesApp para gestionar tus propiedades. Te mostraremos cómo sacar el máximo provecho de la plataforma.",
    },
    {
      title: "Mis Propiedades",
      description: "Aquí verás todas tus propiedades publicadas. Puedes editar información, ver estadísticas de visitas y gestionar la disponibilidad.",
      target: "[data-testid='link-my-properties']",
    },
    {
      title: "Agregar Nueva Propiedad",
      description: "Usa nuestro wizard de 5 pasos para agregar propiedades fácilmente. Incluye fotos, amenidades, servicios y firma digital de términos.",
      action: "Sube tu primera propiedad cuando estés listo",
    },
    {
      title: "Gestión de Citas",
      description: "Recibe y gestiona solicitudes de visitas. Puedes aprobar o rechazar citas, y configurar aprobación automática.",
      target: "[data-testid='link-appointments']",
    },
    {
      title: "Clientes Interesados",
      description: "Ve quién está interesado en tus propiedades, revisa su perfil y comunícate directamente con ellos.",
      target: "[data-testid='link-interested-clients']",
    },
    {
      title: "Contratos y Pagos",
      description: "Cuando aceptes un inquilino, podrás gestionar contratos de renta y dar seguimiento a comisiones y pagos.",
      target: "[data-testid='link-backoffice']",
    },
    {
      title: "¡Todo Configurado!",
      description: "Ya tienes todo listo para empezar a rentar tus propiedades. ¡Éxito en tu gestión!",
    },
  ],
  seller: [
    {
      title: "¡Bienvenido Vendedor!",
      description: "Como vendedor de HomesApp, tienes acceso a herramientas poderosas para gestionar propiedades y cerrar rentas. Empecemos.",
    },
    {
      title: "Dashboard de Ventas",
      description: "Tu dashboard muestra estadísticas clave: propiedades asignadas, citas programadas, comisiones pendientes y más.",
      target: "[data-testid='link-dashboard']",
    },
    {
      title: "Propiedades Asignadas",
      description: "Gestiona las propiedades que tienes asignadas. Puedes ayudar a los propietarios a optimizar sus listados.",
      target: "[data-testid='link-my-properties']",
    },
    {
      title: "Agendar Citas",
      description: "Coordina visitas para tus clientes. Puedes agendar tours de múltiples propiedades para maximizar las oportunidades.",
      target: "[data-testid='link-appointments']",
    },
    {
      title: "Back Office",
      description: "Gestiona ofertas, contratos y da seguimiento al ciclo completo de renta. Aquí verás tus comisiones y pagos.",
      target: "[data-testid='link-backoffice']",
    },
    {
      title: "Referidos",
      description: "Aumenta tus ingresos refiriendo clientes y propietarios. Ganarás comisiones adicionales por cada referido exitoso.",
      target: "[data-testid='link-referrals']",
    },
    {
      title: "¡A Vender!",
      description: "Tienes todas las herramientas para tener éxito. ¡Mucha suerte en tus ventas!",
    },
  ],
  admin: [
    {
      title: "¡Bienvenido Administrador!",
      description: "Como administrador, tienes control total sobre la plataforma. Te mostraremos las funciones administrativas clave.",
    },
    {
      title: "Gestión de Propiedades",
      description: "Aprueba, rechaza o edita propiedades enviadas por propietarios. Controla la calidad de los listados.",
      target: "[data-testid='link-admin-properties']",
    },
    {
      title: "Cola de Tareas",
      description: "Gestiona y asigna tareas al equipo. Prioriza trabajo, da seguimiento y asegura que todo fluya eficientemente.",
      target: "[data-testid='link-admin-tasks']",
    },
    {
      title: "Contratos de Renta",
      description: "Supervisa todos los contratos activos, verifica comisiones, y da seguimiento al ciclo de vida completo.",
      target: "[data-testid='link-admin-contracts']",
    },
    {
      title: "Control de Integraciones",
      description: "Monitorea el estado de APIs externas: Google Calendar, OpenAI, Resend, etc. Detecta problemas antes de que afecten a los usuarios.",
      target: "[data-testid='link-admin-integrations']",
    },
    {
      title: "Gestión de Usuarios",
      description: "Administra roles, aprueba vendedores, revisa documentos y mantén el control sobre quién accede a la plataforma.",
      target: "[data-testid='link-admin-users']",
    },
    {
      title: "¡Control Total!",
      description: "Tienes todas las herramientas administrativas a tu disposición. ¡Buena gestión!",
    },
  ],
  master: [
    {
      title: "¡Bienvenido Master Admin!",
      description: "Como usuario master, tienes acceso completo a todas las funcionalidades y datos del sistema.",
    },
    {
      title: "Analytics Global",
      description: "Accede a métricas completas del negocio: ingresos, conversiones, usuarios activos, y más.",
    },
    {
      title: "Configuración del Sistema",
      description: "Configura parámetros globales, templates de acuerdos, comisiones, y reglas de negocio.",
    },
    {
      title: "Control Total",
      description: "Todas las funcionalidades están a tu disposición. Usa este poder sabiamente.",
    },
  ],
};

export function OnboardingTour({ userRole, onboardingCompleted, onboardingSteps }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const steps = tourSteps[userRole] || tourSteps.cliente;

  useEffect(() => {
    // Show tour if onboarding not completed
    if (!onboardingCompleted) {
      // Small delay to let the page load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted]);

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/user/complete-onboarding");
    },
    onSuccess: () => {
      // Invalidate both regular and admin auth queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/admin/user"] });
      setIsOpen(false);
    },
  });

  const skipOnboardingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/user/skip-onboarding");
    },
    onSuccess: () => {
      // Invalidate both regular and admin auth queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/admin/user"] });
      setIsOpen(false);
    },
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboardingMutation.mutate();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    skipOnboardingMutation.mutate();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleSkip(); }}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-onboarding-tour">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            {step.title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step.action && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">{step.action}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Paso {currentStep + 1} de {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={skipOnboardingMutation.isPending}
            data-testid="button-skip-tour"
          >
            Saltar tour
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              data-testid="button-previous-step"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              onClick={handleNext}
              disabled={completeOnboardingMutation.isPending}
              data-testid="button-next-step"
            >
              {currentStep === steps.length - 1 ? "Finalizar" : "Siguiente"}
              {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
