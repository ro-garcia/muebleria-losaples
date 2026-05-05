import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarColor,
  cambiarEstadoColor,
  ColorServiceError,
  crearColor,
  eliminarColor,
  obtenerColorPorId,
  obtenerColores,
} from "../services/colorService";

const responderError = (
  response: Response,
  error: unknown,
  mensajeServidor: string,
) => {
  const statusCode = error instanceof ColorServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message: error instanceof ColorServiceError ? error.message : mensajeServidor,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
};

export const listarColores = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    const colores = await obtenerColores();
    response.status(200).json({ ok: true, data: colores });
  } catch (error) {
    responderError(response, error, "Error al obtener los colores");
  }
};

export const obtenerColor = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const color = await obtenerColorPorId(id);

    if (!color) {
      response.status(404).json({ ok: false, message: "Color no encontrado" });
      return;
    }

    response.status(200).json({ ok: true, data: color });
  } catch (error) {
    responderError(response, error, "Error al obtener el color");
  }
};

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const color = await crearColor(request.body);
    response.status(201).json({
      ok: true,
      message: "Color creado exitosamente",
      data: color,
    });
  } catch (error) {
    responderError(response, error, "Error al crear el color");
  }
};

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await actualizarColor(id, request.body);

    if (filasAfectadas === 0) {
      response.status(404).json({ ok: false, message: "Color no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Color actualizado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar el color");
  }
};

export const cambiarEstado = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const { COP_Estado } = request.body as { COP_Estado: string };
    const filasAfectadas = await cambiarEstadoColor(id, COP_Estado);

    if (filasAfectadas === 0) {
      response.status(404).json({ ok: false, message: "Color no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Estado actualizado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al cambiar el estado del color");
  }
};

export const eliminar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await eliminarColor(id);

    if (filasAfectadas === 0) {
      response.status(404).json({ ok: false, message: "Color no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Color desactivado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al eliminar el color");
  }
};
