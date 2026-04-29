import type { NextFunction, Request, Response } from "express";
import { type ZodSchema } from "zod";

/**
 * Middleware genérico para validar el cuerpo (body) de la petición HTTP
 * usando un esquema Zod proporcionado por la ruta.
 *
 * Principio de Consistencia (ACID):
 * Al validar los datos de entrada antes de cualquier operación de base de datos,
 * se garantiza que solo datos bien formados llegan al servicio, evitando estados
 * inconsistentes o inserciones parciales.
 *
 * Si la validación falla → responde 400 con la lista de errores por campo.
 * Si la validación pasa  → reemplaza request.body con los datos ya tipados y
 *                          continúa al siguiente middleware/controlador.
 */
export const validarCuerpo = (esquema: ZodSchema) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    const resultado = esquema.safeParse(request.body);

    if (!resultado.success) {
      response.status(400).json({
        ok: false,
        message: "Datos de entrada inválidos",
        // En Zod v4 los errores están en .issues (antes .errors)
        errores: resultado.error.issues.map((e) => ({
          campo: e.path.join("."),
          mensaje: e.message,
        })),
      });
      return;
    }

    // Sustituye el body con los datos validados y transformados por Zod
    request.body = resultado.data;
    next();
  };
};
