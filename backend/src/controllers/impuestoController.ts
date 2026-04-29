import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarImpuesto,
  cambiarEstadoImpuesto,
  crearImpuesto,
  eliminarImpuesto,
  obtenerImpuestoPorId,
  obtenerImpuestos,
} from "../services/impuestoService";

// ─── Listar todos los impuestos ───────────────────────────────────────────────

export const listarImpuestos = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    const impuestos = await obtenerImpuestos();
    response.status(200).json({ ok: true, data: impuestos });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener los impuestos",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Obtener impuesto por ID ──────────────────────────────────────────────────

export const obtenerImpuesto = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const impuesto = await obtenerImpuestoPorId(id);

    if (!impuesto) {
      response
        .status(404)
        .json({ ok: false, message: "Impuesto no encontrado" });
      return;
    }

    response.status(200).json({ ok: true, data: impuesto });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener el impuesto",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Crear impuesto ───────────────────────────────────────────────────────────

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const resultado = await crearImpuesto(request.body);
    response.status(201).json({
      ok: true,
      message: "Impuesto creado exitosamente",
      data: resultado,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al crear el impuesto",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Actualizar impuesto ──────────────────────────────────────────────────────

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await actualizarImpuesto(id, request.body);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Impuesto no encontrado" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Impuesto actualizado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al actualizar el impuesto",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Cambiar estado del impuesto ──────────────────────────────────────────────

export const cambiarEstado = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const { IMP_Estado } = request.body as { IMP_Estado: string };
    const filasAfectadas = await cambiarEstadoImpuesto(id, IMP_Estado);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Impuesto no encontrado" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Estado actualizado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al cambiar el estado del impuesto",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Eliminar impuesto (borrado lógico) ───────────────────────────────────────

export const eliminar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await eliminarImpuesto(id);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Impuesto no encontrado" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Impuesto desactivado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al eliminar el impuesto",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};
