import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarPrecioProducto,
  crearPrecioProducto,
  eliminarPrecioProducto,
  obtenerPrecioProductoPorId,
  obtenerPreciosProducto,
  PrecioProductoServiceError,
} from "../services/precioProductoService";

const responderError = (
  response: Response,
  error: unknown,
  mensajeServidor: string,
) => {
  const statusCode =
    error instanceof PrecioProductoServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message:
      error instanceof PrecioProductoServiceError ? error.message : mensajeServidor,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
};

export const listarPrecios = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const productoId =
      typeof request.query.productoId === "string"
        ? Number(request.query.productoId)
        : undefined;
    const data = await obtenerPreciosProducto(
      Number.isFinite(productoId) ? productoId : undefined,
    );
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener los precios del producto");
  }
};

export const obtenerPrecio = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const data = await obtenerPrecioProductoPorId(id);

    if (!data) {
      response.status(404).json({ ok: false, message: "Precio no encontrado" });
      return;
    }

    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener el precio del producto");
  }
};

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const data = await crearPrecioProducto(request.body);
    response.status(201).json({
      ok: true,
      message: "Precio de producto creado exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al crear el precio del producto");
  }
};

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const rowsAffected = await actualizarPrecioProducto(id, request.body);

    if (rowsAffected === 0) {
      response.status(404).json({ ok: false, message: "Precio no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Precio de producto actualizado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar el precio del producto");
  }
};

export const eliminar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const rowsAffected = await eliminarPrecioProducto(id);

    if (rowsAffected === 0) {
      response.status(404).json({ ok: false, message: "Precio no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Precio eliminado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al eliminar el precio del producto");
  }
};
