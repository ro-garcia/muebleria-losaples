import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarMateriaPrima,
  cambiarEstadoMateriaPrima,
  crearMateriaPrima,
  eliminarMateriaPrima,
  MateriaPrimaServiceError,
  obtenerMateriaPrimaPorId,
  obtenerMateriasPrimas,
} from "../services/materiaPrimaService";

const responderError = (
  response: Response,
  error: unknown,
  mensajeServidor: string,
) => {
  const statusCode =
    error instanceof MateriaPrimaServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message:
      error instanceof MateriaPrimaServiceError
        ? error.message
        : mensajeServidor,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
};

export const listarMateriasPrimas = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    const data = await obtenerMateriasPrimas();
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener la materia prima");
  }
};

export const obtenerMateriaPrima = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const data = await obtenerMateriaPrimaPorId(id);

    if (!data) {
      response
        .status(404)
        .json({ ok: false, message: "Materia prima no encontrada" });
      return;
    }

    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener la materia prima");
  }
};

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const data = await crearMateriaPrima(request.body);
    response.status(201).json({
      ok: true,
      message: "Materia prima creada exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al crear la materia prima");
  }
};

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const rowsAffected = await actualizarMateriaPrima(id, request.body);

    if (rowsAffected === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Materia prima no encontrada" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Materia prima actualizada exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar la materia prima");
  }
};

export const cambiarEstado = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const { MAP_Estado } = request.body as { MAP_Estado: string };
    const rowsAffected = await cambiarEstadoMateriaPrima(id, MAP_Estado);

    if (rowsAffected === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Materia prima no encontrada" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Estado de materia prima actualizado",
    });
  } catch (error) {
    responderError(response, error, "Error al cambiar estado de la materia prima");
  }
};

export const eliminar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const rowsAffected = await eliminarMateriaPrima(id);

    if (rowsAffected === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Materia prima no encontrada" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Materia prima inactivada exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al eliminar la materia prima");
  }
};
