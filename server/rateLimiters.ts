import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: 'Demasiadas solicitudes de registro. Por favor, intenta de nuevo en 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { message: 'Demasiadas solicitudes de verificación. Por favor, intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { message: 'Demasiados mensajes al chatbot. Por favor, espera un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const propertySubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 draft create/update operations per 15 minutes
  message: { message: 'Demasiadas operaciones de guardado. Por favor, intenta de nuevo en unos minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
});

export const publicLeadRegistrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 lead registrations per hour per IP
  message: { message: 'Demasiadas solicitudes de registro. Por favor, intenta de nuevo en 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export const tokenRegenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 token regenerations per 15 minutes per IP
  message: { message: 'Demasiadas regeneraciones de token. Por favor, intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
