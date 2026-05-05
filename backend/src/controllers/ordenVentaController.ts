import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarOrdenVenta,
  anularOrdenVenta,
  cambiarEstadoOrdenVenta,
  crearOrdenVenta,
  obtenerOrdenVentaDetalle,
  obtenerOrdenVentaPorId,
  obtenerOrdenesVenta,
  obtenerOrdenesVentaPorCliente,
  obtenerOrdenesVentaPorTienda,
} from "../services/ordenVentaService";

// ─── Listar todas las órdenes de venta ───────────────────────────────────────

export const listarOrdenesVenta = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const search =
      typeof request.query.search === "string" ? request.query.search : undefined;
    const ordenes = await obtenerOrdenesVenta(search);
    response.status(200).json({ ok: true, data: ordenes });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener las órdenes de venta",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Obtener orden de venta por ID ────────────────────────────────────────────

export const obtenerOrdenVenta = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const orden = await obtenerOrdenVentaPorId(id);

    if (!orden) {
      response
        .status(404)
        .json({ ok: false, message: "Orden de venta no encontrada" });
      return;
    }

    response.status(200).json({ ok: true, data: orden });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener la orden de venta",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

export const obtenerOrdenVentaDetalleController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const detalle = await obtenerOrdenVentaDetalle(id);

    if (!detalle) {
      response
        .status(404)
        .json({ ok: false, message: "Orden de venta no encontrada" });
      return;
    }

    response.status(200).json({ ok: true, data: detalle });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener el detalle de la orden",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Obtener órdenes por cliente ──────────────────────────────────────────────

export const listarPorCliente = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const clienteId = Number(request.params.clienteId);
    const ordenes = await obtenerOrdenesVentaPorCliente(clienteId);
    response.status(200).json({ ok: true, data: ordenes });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener las órdenes del cliente",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Obtener órdenes por tienda ───────────────────────────────────────────────

export const listarPorTienda = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const tiendaId = Number(request.params.tiendaId);
    const ordenes = await obtenerOrdenesVentaPorTienda(tiendaId);
    response.status(200).json({ ok: true, data: ordenes });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener las órdenes de la tienda",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Crear orden de venta ─────────────────────────────────────────────────────

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const resultado = await crearOrdenVenta(request.body);
    response.status(201).json({
      ok: true,
      message: "Orden de venta creada exitosamente",
      data: resultado,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al crear la orden de venta",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Actualizar orden de venta ────────────────────────────────────────────────

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await actualizarOrdenVenta(id, request.body);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Orden de venta no encontrada" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Orden de venta actualizada exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al actualizar la orden de venta",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Cambiar estado de la orden de venta ──────────────────────────────────────

export const cambiarEstado = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const { ODV_Estado } = request.body as { ODV_Estado: string };
    const filasAfectadas = await cambiarEstadoOrdenVenta(id, ODV_Estado);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Orden de venta no encontrada" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Estado actualizado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al cambiar el estado de la orden",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Anular orden de venta (borrado lógico) ───────────────────────────────────

export const anular = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await anularOrdenVenta(id);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Orden de venta no encontrada" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Orden de venta anulada exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al anular la orden de venta",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};
