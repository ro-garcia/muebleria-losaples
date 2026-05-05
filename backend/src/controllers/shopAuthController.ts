import type { Request, Response } from "express";

import { env } from "../config/env";
import { type AuthRequest } from "../middlewares/auth";
import {
  getProfileByClienteId,
  loginCliente,
  registerCliente,
  ShopAuthServiceError,
} from "../services/shopAuthService";

const responderError = (
  response: Response,
  error: unknown,
  mensajeServidor: string,
) => {
  const statusCode = error instanceof ShopAuthServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message: error instanceof ShopAuthServiceError ? error.message : mensajeServidor,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
};

export const register = async (request: Request, response: Response) => {
  try {
    const data = await registerCliente(request.body);
    response.status(201).json({
      ok: true,
      message: "Cliente registrado exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al registrar el cliente");
  }
};

export const login = async (request: Request, response: Response) => {
  try {
    const data = await loginCliente(request.body);
    response.status(200).json({
      ok: true,
      message: "Inicio de sesion exitoso",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al iniciar sesion");
  }
};

export const me = async (request: Request, response: Response) => {
  try {
    const auth = (request as AuthRequest).auth;
    if (!auth) {
      response.status(401).json({
        ok: false,
        message: "No autenticado",
      });
      return;
    }

    const profile = await getProfileByClienteId(auth.clienteId);
    response.status(200).json({
      ok: true,
      data: {
        clienteId: profile.CLI_CLIENTE,
        username: auth.username,
        profile,
      },
    });
  } catch (error) {
    responderError(response, error, "Error al obtener perfil");
  }
};

export const updateMe = async (request: Request, response: Response) => {
  try {
    const auth = (request as AuthRequest).auth;
    if (!auth) {
      response.status(401).json({ ok: false, message: "No autenticado" });
      return;
    }

    const allowed: Record<string, unknown> = {};
    const body = request.body as Record<string, unknown>;
    const fields = [
      "CLI_Primer_Nombre",
      "CLI_Segundo_Nombre",
      "CLI_Primer_Apellido",
      "CLI_Segundo_Apellido",
      "CLI_Departamento",
      "CLI_Municipio",
      "CLI_Zona_Aldea",
      "CLI_Telefono",
      "CLI_Pais",
      "CLI_Tipo_Documento",
      "CLI_Numero_Documento",
      "CLI_Correo_Electronico",
      "PER_Tipo_Documento",
      "PER_Nombre",
      "PER_Primer_Apellido",
      "PER_Segundo_Apellido",
      "PER_Correo",
      "PER_Telefono",
      "PER_Pais",
      "PER_Departamento",
      "PER_Municipio",
      "PER_Zona_Aldea",
      "PER_Domicilio",
    ];

    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(body, f)) {
        allowed[f] = body[f];
      }
    }

    const { actualizarCliente } = await import("../services/clienteService");

    const updated = await actualizarCliente(auth.clienteId, allowed);

    response.status(200).json({ ok: true, data: { profile: updated } });
  } catch (error) {
    responderError(response, error, "Error al actualizar perfil");
  }
};
