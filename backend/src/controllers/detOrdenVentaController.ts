import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarDetOrdenVenta,
  crearDetOrdenVenta,
  eliminarDetOrdenVenta,
  obtenerDetOrdenVentaPorId,
  obtenerDetallesPorOrden,
} from "../services/detOrdenVentaService";

// ─── Listar detalles por orden de venta ───────────────────────────────────────

export const listarPorOrden = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const ordenId = Number(request.params.ordenId);
    const detalles = await obtenerDetallesPorOrden(ordenId);
    response.status(200).json({ ok: true, data: detalles });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener los detalles de la orden",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Obtener detalle por ID ───────────────────────────────────────────────────

export const obtenerDetalle = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const detalle = await obtenerDetOrdenVentaPorId(id);

    if (!detalle) {
      response
        .status(404)
        .json({ ok: false, message: "Detalle de orden no encontrado" });
      return;
    }

    response.status(200).json({ ok: true, data: detalle });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener el detalle de orden",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Crear detalle de orden de venta ──────────────────────────────────────────

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const resultado = await crearDetOrdenVenta(request.body);
    response.status(201).json({
      ok: true,
      message: "Detalle de orden creado exitosamente",
      data: resultado,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al crear el detalle de orden",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Actualizar detalle de orden de venta ─────────────────────────────────────

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await actualizarDetOrdenVenta(id, request.body);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Detalle de orden no encontrado" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Detalle de orden actualizado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al actualizar el detalle de orden",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Eliminar detalle de orden de venta ───────────────────────────────────────

export const eliminar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await eliminarDetOrdenVenta(id);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Detalle de orden no encontrado" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Detalle de orden eliminado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al eliminar el detalle de orden",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};
