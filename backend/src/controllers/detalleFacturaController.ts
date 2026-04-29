import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarDetalleFactura,
  crearDetalleFactura,
  eliminarDetalleFactura,
  obtenerDetalleFacturaPorId,
  obtenerDetallesPorFactura,
} from "../services/detalleFacturaService";

// ─── Listar detalles por factura ──────────────────────────────────────────────

export const listarPorFactura = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const facturaId = Number(request.params.facturaId);
    const detalles = await obtenerDetallesPorFactura(facturaId);
    response.status(200).json({ ok: true, data: detalles });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener los detalles de la factura",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Obtener detalle de factura por ID ────────────────────────────────────────

export const obtenerDetalle = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const detalle = await obtenerDetalleFacturaPorId(id);

    if (!detalle) {
      response
        .status(404)
        .json({ ok: false, message: "Detalle de factura no encontrado" });
      return;
    }

    response.status(200).json({ ok: true, data: detalle });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener el detalle de factura",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Crear detalle de factura ─────────────────────────────────────────────────

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const resultado = await crearDetalleFactura(request.body);
    response.status(201).json({
      ok: true,
      message: "Detalle de factura creado exitosamente",
      data: resultado,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al crear el detalle de factura",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Actualizar detalle de factura ────────────────────────────────────────────

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await actualizarDetalleFactura(id, request.body);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Detalle de factura no encontrado" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Detalle de factura actualizado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al actualizar el detalle de factura",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Eliminar detalle de factura ──────────────────────────────────────────────

export const eliminar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await eliminarDetalleFactura(id);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Detalle de factura no encontrado" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Detalle de factura eliminado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al eliminar el detalle de factura",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};
