import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  crearStockMateriaPrima,
  eliminarStockMateriaPrima,
  obtenerStockMateriaPrimaPorId,
  obtenerStockMateriasPrimas,
  StockMateriaPrimaServiceError,
  actualizarStockMateriaPrima,
} from "../services/stockMateriaPrimaService";

const responderError = (
  response: Response,
  error: unknown,
  mensajeServidor: string,
) => {
  const statusCode =
    error instanceof StockMateriaPrimaServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message:
      error instanceof StockMateriaPrimaServiceError
        ? error.message
        : mensajeServidor,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
};

export const listarStock = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const materiaPrimaId =
      typeof request.query.materiaPrimaId === "string"
        ? Number(request.query.materiaPrimaId)
        : undefined;
    const data = await obtenerStockMateriasPrimas({
      materiaPrimaId: Number.isFinite(materiaPrimaId)
        ? materiaPrimaId
        : undefined,
    });
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener el stock de materia prima");
  }
};

export const obtenerStock = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const data = await obtenerStockMateriaPrimaPorId(id);

    if (!data) {
      response
        .status(404)
        .json({ ok: false, message: "Registro de stock no encontrado" });
      return;
    }

    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener el stock de materia prima");
  }
};

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const data = await crearStockMateriaPrima(request.body);
    response.status(201).json({
      ok: true,
      message: "Stock de materia prima creado exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al crear el stock de materia prima");
  }
};

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const rowsAffected = await actualizarStockMateriaPrima(id, request.body);

    if (rowsAffected === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Registro de stock no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Stock de materia prima actualizado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar el stock de materia prima");
  }
};

export const eliminar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const rowsAffected = await eliminarStockMateriaPrima(id);

    if (rowsAffected === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Registro de stock no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Registro de stock eliminado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al eliminar el stock de materia prima");
  }
};
