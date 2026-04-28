import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarTienda,
  cambiarEstadoTienda,
  crearTienda,
  eliminarTienda,
  obtenerTiendaPorId,
  obtenerTiendas,
} from "../services/tiendaService";

// ─── Listar todas las tiendas ─────────────────────────────────────────────────

export const listarTiendas = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    const tiendas = await obtenerTiendas();
    response.status(200).json({ ok: true, data: tiendas });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener las tiendas",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Obtener tienda por ID ────────────────────────────────────────────────────

export const obtenerTienda = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const tienda = await obtenerTiendaPorId(id);

    if (!tienda) {
      response.status(404).json({ ok: false, message: "Tienda no encontrada" });
      return;
    }

    response.status(200).json({ ok: true, data: tienda });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener la tienda",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Crear tienda ─────────────────────────────────────────────────────────────

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    // El body ya fue validado por el middleware validarCuerpo antes de llegar aquí
    const resultado = await crearTienda(request.body);
    response.status(201).json({
      ok: true,
      message: "Tienda creada exitosamente",
      data: resultado,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al crear la tienda",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Actualizar tienda ────────────────────────────────────────────────────────

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await actualizarTienda(id, request.body);

    if (filasAfectadas === 0) {
      response.status(404).json({ ok: false, message: "Tienda no encontrada" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Tienda actualizada exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al actualizar la tienda",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Cambiar estado de tienda ─────────────────────────────────────────────────

export const cambiarEstado = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    // El estado ya fue validado por el middleware validarCuerpo
    const { TIE_Estado } = request.body as { TIE_Estado: string };
    const filasAfectadas = await cambiarEstadoTienda(id, TIE_Estado);

    if (filasAfectadas === 0) {
      response.status(404).json({ ok: false, message: "Tienda no encontrada" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Estado actualizado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al cambiar el estado de la tienda",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Eliminar tienda (borrado lógico) ─────────────────────────────────────────

export const eliminar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await eliminarTienda(id);

    if (filasAfectadas === 0) {
      response.status(404).json({ ok: false, message: "Tienda no encontrada" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Tienda desactivada exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al eliminar la tienda",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};
