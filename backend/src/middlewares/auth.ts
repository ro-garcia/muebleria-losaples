import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";

export type AuthRole = "CLIENTE" | "ADMIN";

export interface AuthClaims {
  sub: string;
  username: string;
  role: AuthRole;
  usuarioId?: number | null;
  clienteId?: number | null;
  empleadoId?: number | null;
  personaId?: number | null;
}

export interface AuthRequest extends Request {
  auth?: AuthClaims;
}

export const requireAuth = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const authHeader = request.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (!token) {
    response.status(401).json({
      ok: false,
      message: "Token de acceso requerido",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.auth.jwtSecret) as AuthClaims;

    (request as AuthRequest).auth = {
      sub: String(decoded.sub),
      username: String(decoded.username),
      role: decoded.role === "ADMIN" ? "ADMIN" : "CLIENTE",
      usuarioId: Number(decoded.usuarioId ?? 0) || null,
      clienteId: Number(decoded.clienteId ?? 0) || null,
      empleadoId: Number(decoded.empleadoId ?? 0) || null,
      personaId: Number(decoded.personaId ?? 0) || null,
    };

    next();
  } catch {
    response.status(401).json({
      ok: false,
      message: "Token invalido o expirado",
    });
  }
};

export const requireAdmin = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  requireAuth(request, response, () => {
    const auth = (request as AuthRequest).auth;

    if (!auth || auth.role !== "ADMIN" || !auth.empleadoId) {
      response.status(403).json({
        ok: false,
        message: "Acceso restringido al personal autorizado",
      });
      return;
    }

    next();
  });
};
