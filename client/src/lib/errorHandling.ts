import { toast } from "@/hooks/use-toast";

const isDevelopment = import.meta.env.DEV;

interface ErrorMessages {
  es: string;
  en: string;
}

const DEFAULT_ERROR_MESSAGES: Record<string, ErrorMessages> = {
  network: {
    es: "Error de conexión. Verifica tu internet e inténtalo de nuevo.",
    en: "Connection error. Check your internet and try again.",
  },
  server: {
    es: "Error del servidor. Inténtalo de nuevo más tarde.",
    en: "Server error. Please try again later.",
  },
  unauthorized: {
    es: "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
    en: "Your session has expired. Please log in again.",
  },
  forbidden: {
    es: "No tienes permisos para realizar esta acción.",
    en: "You don't have permission to perform this action.",
  },
  notFound: {
    es: "El recurso solicitado no existe.",
    en: "The requested resource does not exist.",
  },
  validation: {
    es: "Por favor verifica los datos ingresados.",
    en: "Please check the entered data.",
  },
  generic: {
    es: "Ocurrió un error inesperado. Inténtalo de nuevo.",
    en: "An unexpected error occurred. Please try again.",
  },
};

export function getErrorMessage(error: unknown, language: "es" | "en" = "es"): string {
  if (error instanceof Error) {
    if (error.message && error.message !== "Failed to fetch") {
      return error.message;
    }
    if (error.message === "Failed to fetch") {
      return DEFAULT_ERROR_MESSAGES.network[language];
    }
  }

  if (typeof error === "object" && error !== null) {
    const errObj = error as any;
    
    if (errObj.message) {
      return errObj.message;
    }
    
    if (errObj.status) {
      switch (errObj.status) {
        case 401:
          return DEFAULT_ERROR_MESSAGES.unauthorized[language];
        case 403:
          return DEFAULT_ERROR_MESSAGES.forbidden[language];
        case 404:
          return DEFAULT_ERROR_MESSAGES.notFound[language];
        case 422:
        case 400:
          return errObj.message || DEFAULT_ERROR_MESSAGES.validation[language];
        case 500:
        case 502:
        case 503:
          return DEFAULT_ERROR_MESSAGES.server[language];
      }
    }
  }

  if (typeof error === "string") {
    return error;
  }

  return DEFAULT_ERROR_MESSAGES.generic[language];
}

export function logError(context: string, error: unknown): void {
  if (isDevelopment) {
    console.error(`[${context}]`, error);
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
  }
}

export function showErrorToast(
  title: string,
  error: unknown,
  language: "es" | "en" = "es"
): void {
  const description = getErrorMessage(error, language);
  
  toast({
    title,
    description,
    variant: "destructive",
  });
  
  logError(title, error);
}

export function showSuccessToast(title: string, description: string): void {
  toast({
    title,
    description,
  });
}

export type SafeActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: unknown };

export async function safeAction<T>(
  action: () => Promise<T>,
  context: string,
  errorTitle: string,
  language: "es" | "en" = "es"
): Promise<SafeActionResult<T>> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (error) {
    showErrorToast(errorTitle, error, language);
    return { success: false, error };
  }
}

export function safeClickHandler(
  handler: () => void | Promise<void>,
  context: string,
  errorTitle: string,
  language: "es" | "en" = "es"
): () => void {
  return async () => {
    try {
      await handler();
    } catch (error) {
      showErrorToast(errorTitle, error, language);
    }
  };
}

export function createMutationErrorHandler(
  actionName: string,
  language: "es" | "en" = "es"
) {
  return (error: unknown) => {
    const errorMessages: Record<string, ErrorMessages> = {
      createOffer: {
        es: "Error al crear la oferta",
        en: "Error creating offer",
      },
      sendOffer: {
        es: "Error al enviar la oferta",
        en: "Error sending offer",
      },
      generateLink: {
        es: "Error al generar el link",
        en: "Error generating link",
      },
      scheduleAppointment: {
        es: "Error al agendar la cita",
        en: "Error scheduling appointment",
      },
      saveChanges: {
        es: "Error al guardar los cambios",
        en: "Error saving changes",
      },
      deleteItem: {
        es: "Error al eliminar",
        en: "Error deleting",
      },
      loadData: {
        es: "Error al cargar los datos",
        en: "Error loading data",
      },
    };

    const title = errorMessages[actionName]?.[language] || 
      (language === "es" ? "Error en la operación" : "Operation error");
    
    showErrorToast(title, error, language);
  };
}

export function handleFormSubmitError(
  error: unknown,
  language: "es" | "en" = "es"
): string {
  logError("Form submission error", error);
  return getErrorMessage(error, language);
}
