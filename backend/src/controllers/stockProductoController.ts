import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  crearStockProducto,
  eliminarStockProducto,
  obtenerStockProductoPorId,
  obtenerStockProductos,
  StockProductoServiceError,
  actualizarStockProducto,
} from "../services/stockProductoService";

const responderError = (
  response: Response,
  error: unknown,
  mensajeServidor: string,
) => {
  const statusCode =
    error instanceof StockProductoServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message:
      error instanceof StockProductoServiceError ? error.message : mensajeServidor,
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
    const productoId =
      typeof request.query.productoId === "string"
        ? Number(request.query.productoId)
        : undefined;
    const almacenId =
      typeof request.query.almacenId === "string"
        ? Number(request.query.almacenId)
        : undefined;

    const data = await obtenerStockProductos({
      productoId: Number.isFinite(productoId) ? productoId : undefined,
      almacenId: Number.isFinite(almacenId) ? almacenId : undefined,
    });
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener el stock de productos");
  }
};

export const obtenerStock = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const data = await obtenerStockProductoPorId(id);

    if (!data) {
      response
        .status(404)
        .json({ ok: false, message: "Registro de stock no encontrado" });
      return;
    }

    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener el stock del producto");
  }
};

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const data = await crearStockProducto(request.body);
    response.status(201).json({
      ok: true,
      message: "Stock de producto creado exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al crear el stock del producto");
  }
};

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const rowsAffected = await actualizarStockProducto(id, request.body);

    if (rowsAffected === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Registro de stock no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Stock de producto actualizado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar el stock del producto");
  }
};

export const eliminar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const rowsAffected = await eliminarStockProducto(id);

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
    responderError(response, error, "Error al eliminar el stock del producto");
  }
};
