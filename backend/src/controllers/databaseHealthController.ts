import type { Request, Response } from "express";

import { env } from "../config/env";
import { checkDatabaseHealth } from "../services/databaseHealthService";

export const getDatabaseHealth = async (_request: Request, response: Response) => {
  try {
    await checkDatabaseHealth();

    response.status(200).json({
      ok: true,
      message: "Conexion de Oracle funciona",
    });
  } catch (error) {
    response.status(503).json({
      ok: false,
      message: "No se pudo conectar a Oracle",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};
