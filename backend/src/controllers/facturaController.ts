import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarFactura,
  anularFactura,
  cambiarEstadoFactura,
  crearFactura,
  obtenerFacturaDetalle,
  obtenerFacturaPorId,
  obtenerFacturas,
  obtenerFacturasPorOrden,
  registrarPago,
} from "../services/facturaService";

// ─── Listar todas las facturas ────────────────────────────────────────────────

export const listarFacturas = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const search =
      typeof request.query.search === "string" ? request.query.search : undefined;
    const facturas = await obtenerFacturas(search);
    response.status(200).json({ ok: true, data: facturas });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener las facturas",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Obtener factura por ID ───────────────────────────────────────────────────

export const obtenerFactura = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const factura = await obtenerFacturaPorId(id);

    if (!factura) {
      response
        .status(404)
        .json({ ok: false, message: "Factura no encontrada" });
      return;
    }

    response.status(200).json({ ok: true, data: factura });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener la factura",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

export const obtenerFacturaDetalleController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const detalle = await obtenerFacturaDetalle(id);

    if (!detalle) {
      response.status(404).json({ ok: false, message: "Factura no encontrada" });
      return;
    }

    response.status(200).json({ ok: true, data: detalle });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener el detalle de la factura",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Obtener facturas por orden de venta ──────────────────────────────────────

export const listarPorOrden = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const ordenId = Number(request.params.ordenId);
    const facturas = await obtenerFacturasPorOrden(ordenId);
    response.status(200).json({ ok: true, data: facturas });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener las facturas de la orden",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Crear factura ────────────────────────────────────────────────────────────

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const resultado = await crearFactura(request.body);
    response.status(201).json({
      ok: true,
      message: "Factura creada exitosamente",
      data: resultado,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al crear la factura",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Actualizar factura ───────────────────────────────────────────────────────

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await actualizarFactura(id, request.body);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Factura no encontrada" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Factura actualizada exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al actualizar la factura",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Cambiar estado de la factura ─────────────────────────────────────────────

export const cambiarEstado = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const { FAC_Estado_Factura } = request.body as {
      FAC_Estado_Factura: string;
    };
    const filasAfectadas = await cambiarEstadoFactura(id, FAC_Estado_Factura);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Factura no encontrada" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Estado actualizado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al cambiar el estado de la factura",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Registrar pago (parcial o total) ────────────────────────────────────────

export const pagar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await registrarPago(id, request.body);

    if (filasAfectadas === 0) {
      response.status(404).json({
        ok: false,
        message: "Factura no encontrada o ya se encuentra anulada",
      });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Pago registrado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al registrar el pago",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Anular factura (borrado lógico) ──────────────────────────────────────────

export const anular = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await anularFactura(id);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Factura no encontrada" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Factura anulada exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al anular la factura",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};
