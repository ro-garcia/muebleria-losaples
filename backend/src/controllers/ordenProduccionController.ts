import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarDetalleOrdenProduccion,
  actualizarOrdenProduccion,
  cambiarEstadoOrdenProduccion,
  crearDetalleOrdenProduccion,
  crearOrdenProduccion,
  eliminarDetalleOrdenProduccion,
  finalizarOrdenProduccion,
  NuevoDetalleOrdenProduccion,
  obtenerDetalleOrdenProduccion,
  obtenerOrdenesProduccion,
  obtenerOrdenProduccionPorId,
  OrdenProduccionServiceError,
} from "../services/ordenProduccionService";

const responderError = (
  response: Response,
  error: unknown,
  mensajeServidor: string,
) => {
  const statusCode =
    error instanceof OrdenProduccionServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message:
      error instanceof OrdenProduccionServiceError
        ? error.message
        : mensajeServidor,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
};

export const listarOrdenes = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const productoId =
      typeof request.query.productoId === "string"
        ? Number(request.query.productoId)
        : undefined;
    const estado =
      typeof request.query.estado === "string"
        ? request.query.estado
        : undefined;

    const data = await obtenerOrdenesProduccion({
      productoId: Number.isFinite(productoId) ? productoId : undefined,
      estado,
    });
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener las ordenes de produccion");
  }
};

export const obtenerOrden = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const data = await obtenerOrdenProduccionPorId(id);

    if (!data) {
      response
        .status(404)
        .json({ ok: false, message: "Orden de produccion no encontrada" });
      return;
    }

    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener la orden de produccion");
  }
};

export const obtenerDetalle = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const data = await obtenerDetalleOrdenProduccion(id);

    if (!data) {
      response
        .status(404)
        .json({ ok: false, message: "Orden de produccion no encontrada" });
      return;
    }

    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener el detalle de produccion");
  }
};

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const data = await crearOrdenProduccion(request.body);
    response.status(201).json({
      ok: true,
      message: "Orden de produccion creada exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al crear la orden de produccion");
  }
};

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const rowsAffected = await actualizarOrdenProduccion(id, request.body);

    if (rowsAffected === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Orden de produccion no encontrada" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Orden de produccion actualizada exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar la orden de produccion");
  }
};

export const cambiarEstado = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const { OPR_Estado } = request.body as { OPR_Estado: string };
    const rowsAffected = await cambiarEstadoOrdenProduccion(id, OPR_Estado);

    if (rowsAffected === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Orden de produccion no encontrada" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Estado de orden de produccion actualizado",
    });
  } catch (error) {
    responderError(response, error, "Error al cambiar estado de produccion");
  }
};

export const agregarDetalle = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const ordenId = Number(request.params.id);
    const data = await crearDetalleOrdenProduccion(
      ordenId,
      request.body as NuevoDetalleOrdenProduccion,
    );
    response.status(201).json({
      ok: true,
      message: "Detalle de produccion creado exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al crear el detalle de produccion");
  }
};

export const actualizarDetalle = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const detalleId = Number(request.params.detalleId);
    const rowsAffected = await actualizarDetalleOrdenProduccion(
      detalleId,
      request.body as NuevoDetalleOrdenProduccion,
    );

    if (rowsAffected === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Detalle de produccion no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Detalle de produccion actualizado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar el detalle de produccion");
  }
};

export const eliminarDetalle = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const detalleId = Number(request.params.detalleId);
    const rowsAffected = await eliminarDetalleOrdenProduccion(detalleId);

    if (rowsAffected === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Detalle de produccion no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Detalle de produccion eliminado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al eliminar el detalle de produccion");
  }
};

export const finalizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const almacenId =
      typeof request.body?.ALM_almacen === "number"
        ? Number(request.body.ALM_almacen)
        : undefined;
    const data = await finalizarOrdenProduccion(id, almacenId);
    response.status(200).json({
      ok: true,
      message: "Orden de produccion finalizada exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al finalizar la orden de produccion");
  }
};
