import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarMetodoPago,
  cambiarEstadoMetodoPago,
  crearMetodoPago,
  eliminarMetodoPago,
  obtenerMetodoPagoPorId,
  obtenerMetodosPago,
} from "../services/metodoPagoService";

// ─── Listar todos los métodos de pago ─────────────────────────────────────────

export const listarMetodosPago = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    const metodos = await obtenerMetodosPago();
    response.status(200).json({ ok: true, data: metodos });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener los métodos de pago",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Obtener método de pago por ID ────────────────────────────────────────────

export const obtenerMetodoPago = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const metodo = await obtenerMetodoPagoPorId(id);

    if (!metodo) {
      response
        .status(404)
        .json({ ok: false, message: "Método de pago no encontrado" });
      return;
    }

    response.status(200).json({ ok: true, data: metodo });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener el método de pago",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Crear método de pago ─────────────────────────────────────────────────────

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const resultado = await crearMetodoPago(request.body);
    response.status(201).json({
      ok: true,
      message: "Método de pago creado exitosamente",
      data: resultado,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al crear el método de pago",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Actualizar método de pago ────────────────────────────────────────────────

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await actualizarMetodoPago(id, request.body);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Método de pago no encontrado" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Método de pago actualizado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al actualizar el método de pago",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Cambiar estado del método de pago ───────────────────────────────────────

export const cambiarEstado = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const { MET_Estado } = request.body as { MET_Estado: string };
    const filasAfectadas = await cambiarEstadoMetodoPago(id, MET_Estado);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Método de pago no encontrado" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Estado actualizado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al cambiar el estado del método de pago",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Eliminar método de pago (borrado lógico) ─────────────────────────────────

export const eliminar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await eliminarMetodoPago(id);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Método de pago no encontrado" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Método de pago desactivado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al eliminar el método de pago",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};
