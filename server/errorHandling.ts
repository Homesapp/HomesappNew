import { Response } from "express";
import { ZodError } from "zod";

export interface ApiError {
  message: string;
  errors?: any[];
  code?: string;
}

export function handleZodError(res: Response, error: ZodError): Response {
  return res.status(400).json({
    message: "Datos inválidos",
    errors: error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    })),
  });
}

export function handleDatabaseError(res: Response, error: any): Response {
  console.error("Database error:", error);
  
  if (error.code === '23505') {
    return res.status(409).json({
      message: "El registro ya existe",
      code: "DUPLICATE_ENTRY",
    });
  }
  
  if (error.code === '23503') {
    return res.status(400).json({
      message: "Referencia inválida - el registro relacionado no existe",
      code: "FOREIGN_KEY_VIOLATION",
    });
  }
  
  if (error.code === '23502') {
    return res.status(400).json({
      message: "Faltan campos requeridos",
      code: "NOT_NULL_VIOLATION",
    });
  }
  
  return res.status(500).json({
    message: "Error al procesar la solicitud en la base de datos",
    code: "DATABASE_ERROR",
  });
}

export function handleGenericError(res: Response, error: any, context: string = ""): Response {
  console.error(`Error ${context}:`, error);
  
  if (error instanceof ZodError) {
    return handleZodError(res, error);
  }
  
  if (error.code && error.code.startsWith('23')) {
    return handleDatabaseError(res, error);
  }
  
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || `Error ${context}`;
  
  return res.status(statusCode).json({
    message,
    ...(error.code && { code: error.code }),
  });
}

export function createErrorResponse(
  statusCode: number,
  message: string,
  code?: string,
  errors?: any[]
): ApiError {
  return {
    message,
    ...(code && { code }),
    ...(errors && { errors }),
  };
}
