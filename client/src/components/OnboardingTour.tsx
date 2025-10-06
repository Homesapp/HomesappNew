import { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingTourProps {
  role: string;
}

export function OnboardingTour({ role }: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (user && userId) {
      const hasSeenOnboarding = localStorage.getItem(`onboarding-seen-${userId}-${role}`);
      if (!hasSeenOnboarding) {
        setTimeout(() => setRun(true), 1000);
      }
    }
  }, [user, userId, role]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    if ((status === STATUS.FINISHED || status === STATUS.SKIPPED) && userId) {
      setRun(false);
      localStorage.setItem(`onboarding-seen-${userId}-${role}`, "true");
    }
  };

  const getStepsByRole = (role: string): Step[] => {
    const commonSteps: Step[] = [
      {
        target: '[data-testid="sidebar"]',
        content: "Este es tu menú de navegación principal. Aquí encontrarás todas las funciones disponibles para tu rol.",
        disableBeacon: true,
      },
      {
        target: '[data-testid="button-notifications"]',
        content: "Aquí recibirás notificaciones importantes sobre tu actividad.",
      },
      {
        target: '[data-testid="user-menu"]',
        content: "Accede a tu perfil y configuración desde aquí.",
      },
    ];

    const roleSpecificSteps: Record<string, Step[]> = {
      cliente: [
        {
          target: '[data-testid="link-search-properties"]',
          content: "¡Comienza aquí! Busca propiedades que se ajusten a tus necesidades.",
          disableBeacon: true,
        },
        {
          target: '[data-testid="link-favorites"]',
          content: "Guarda tus propiedades favoritas para revisarlas después.",
        },
        {
          target: '[data-testid="link-appointments"]',
          content: "Agenda citas para visitar propiedades que te interesen.",
        },
        {
          target: '[data-testid="link-chat"]',
          content: "Chatea con MARCO, nuestro asistente virtual, para encontrar tu propiedad ideal.",
        },
      ],
      owner: [
        {
          target: '[data-testid="link-my-properties"]',
          content: "Administra todas tus propiedades desde aquí.",
          disableBeacon: true,
        },
        {
          target: '[data-testid="link-appointments"]',
          content: "Revisa y aprueba las citas solicitadas para tus propiedades.",
        },
        {
          target: '[data-testid="link-my-income"]',
          content: "Consulta tus ingresos y comisiones generadas.",
        },
      ],
      seller: [
        {
          target: '[data-testid="link-leads"]',
          content: "Gestiona tus leads en el tablero Kanban.",
          disableBeacon: true,
        },
        {
          target: '[data-testid="link-properties"]',
          content: "Explora todas las propiedades disponibles.",
        },
        {
          target: '[data-testid="link-referrals"]',
          content: "Administra tus referidos y gana comisiones adicionales.",
        },
        {
          target: '[data-testid="link-appointments"]',
          content: "Coordina citas con tus clientes.",
        },
      ],
      admin: [
        {
          target: '[data-testid="link-admin-dashboard"]',
          content: "Dashboard principal con métricas del sistema.",
          disableBeacon: true,
        },
        {
          target: '[data-testid="link-admin-properties"]',
          content: "Aprueba y gestiona propiedades pendientes.",
        },
        {
          target: '[data-testid="link-admin-users"]',
          content: "Administra usuarios y solicitudes de roles.",
        },
        {
          target: '[data-testid="link-admin-config"]',
          content: "Configura el sistema, horarios y reglas de negocio.",
        },
      ],
      concierge: [
        {
          target: '[data-testid="link-appointments"]',
          content: "Ve y gestiona las citas asignadas a ti.",
          disableBeacon: true,
        },
        {
          target: '[data-testid="link-concierge-schedule"]',
          content: "Configura tus horarios y bloquea tiempos personales.",
        },
        {
          target: '[data-testid="link-chat"]',
          content: "Comunícate con clientes sobre sus visitas.",
        },
      ],
    };

    const steps = roleSpecificSteps[role] || [];
    return [...steps, ...commonSteps];
  };

  const steps = getStepsByRole(role);

  if (steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "8px",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          borderRadius: "6px",
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
        },
      }}
      locale={{
        back: "Atrás",
        close: "Cerrar",
        last: "Finalizar",
        next: "Siguiente",
        skip: "Saltar",
      }}
    />
  );
}
