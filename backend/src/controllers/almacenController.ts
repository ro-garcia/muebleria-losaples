import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarAlmacen,
  AlmacenServiceError,
  cambiarEstadoAlmacen,
  crearAlmacen,
  eliminarAlmacen,
  obtenerAlmacenPorId,
  obtenerAlmacenes,
} from "../services/almacenService";

const responderError = (
  response: Response,
  error: unknown,
  mensajeServidor: string,
) => {
  const statusCode =
    error instanceof AlmacenServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message:
      error instanceof AlmacenServiceError ? error.message : mensajeServidor,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
};

export const listarAlmacenes = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    const data = await obtenerAlmacenes();
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener los almacenes");
  }
};

export const obtenerAlmacen = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const data = await obtenerAlmacenPorId(id);

    if (!data) {
      response.status(404).json({ ok: false, message: "Almacen no encontrado" });
      return;
    }

    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener el almacen");
  }
};

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const data = await crearAlmacen(request.body);
    response.status(201).json({
      ok: true,
      message: "Almacen creado exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al crear el almacen");
  }
};

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const rowsAffected = await actualizarAlmacen(id, request.body);

    if (rowsAffected === 0) {
      response.status(404).json({ ok: false, message: "Almacen no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Almacen actualizado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar el almacen");
  }
};

export const cambiarEstado = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const { ALM_Estado } = request.body as { ALM_Estado: string };
    const rowsAffected = await cambiarEstadoAlmacen(id, ALM_Estado);

    if (rowsAffected === 0) {
      response.status(404).json({ ok: false, message: "Almacen no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Estado del almacen actualizado",
    });
  } catch (error) {
    responderError(response, error, "Error al cambiar estado del almacen");
  }
};

export const eliminar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const rowsAffected = await eliminarAlmacen(id);

    if (rowsAffected === 0) {
      response.status(404).json({ ok: false, message: "Almacen no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Almacen inactivado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al eliminar el almacen");
  }
};
