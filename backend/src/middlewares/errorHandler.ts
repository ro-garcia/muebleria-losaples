import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);

  response.status(500).json({
    ok: false,
    message: "Error interno en el servidor estado 500.",
  });
};
