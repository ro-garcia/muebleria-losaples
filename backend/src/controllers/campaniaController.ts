import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarCampania,
  agregarProductoCampania,
  cambiarEstadoCampania,
  cambiarEstadoProductoCampania,
  crearCampania,
  eliminarCampania,
  eliminarProductoCampania,
  obtenerCampaniaPorId,
  obtenerCampanias,
  obtenerProductosPorCampania,
  obtenerDetalleCampanias,
} from "../services/campaniaService";

// ─── Listar todas las campañas ────────────────────────────────────────────────

export const listarCampanias = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    const campanias = await obtenerCampanias();
    response.status(200).json({ ok: true, data: campanias });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener las campañas",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};
// ─── Obtener Productos por campaña ───────────────────────────────────────────
export const listarDetalleCampanias = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    const detalle = await obtenerDetalleCampanias();

    response.status(200).json({
      ok: true,
      data: detalle,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener el detalle de campañas",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};
// ─── Obtener campaña por ID ──────────────────────────────────────────────────

export const obtenerCampania = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const campania = await obtenerCampaniaPorId(id);

    if (!campania) {
      response.status(404).json({ ok: false, message: "Campaña no encontrada" });
      return;
    }

    response.status(200).json({ ok: true, data: campania });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener la campaña",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Obtener productos de una campaña ─────────────────────────────────────────

export const listarProductosCampania = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const productos = await obtenerProductosPorCampania(id);
    response.status(200).json({ ok: true, data: productos });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al obtener los productos de la campaña",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Crear campaña ────────────────────────────────────────────────────────────

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const resultado = await crearCampania(request.body);
    response.status(201).json({
      ok: true,
      message: "Campaña creada exitosamente",
      data: resultado,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al crear la campaña",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Actualizar campaña ───────────────────────────────────────────────────────

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await actualizarCampania(id, request.body);

    if (filasAfectadas === 0) {
      response.status(404).json({ ok: false, message: "Campaña no encontrada" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Campaña actualizada exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al actualizar la campaña",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Cambiar estado de campaña ────────────────────────────────────────────────

export const cambiarEstado = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const { COM_Estado } = request.body as { COM_Estado: string };
    const filasAfectadas = await cambiarEstadoCampania(id, COM_Estado);

    if (filasAfectadas === 0) {
      response.status(404).json({ ok: false, message: "Campaña no encontrada" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Estado actualizado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al cambiar el estado de la campaña",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Eliminar campaña ─────────────────────────────────────────────────────────

export const eliminar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await eliminarCampania(id);

    if (filasAfectadas === 0) {
      response.status(404).json({ ok: false, message: "Campaña no encontrada" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Campaña desactivada exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al eliminar la campaña",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Agregar producto a campaña ───────────────────────────────────────────────

export const agregarProducto = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const resultado = await agregarProductoCampania(request.body);
    response.status(201).json({
      ok: true,
      message: "Producto agregado a la campaña exitosamente",
      data: resultado,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al agregar el producto a la campaña",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Cambiar estado de producto en campaña ────────────────────────────────────

export const cambiarEstadoProducto = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const { CMP_Estado } = request.body as { CMP_Estado: string };
    const filasAfectadas = await cambiarEstadoProductoCampania(id, CMP_Estado);

    if (filasAfectadas === 0) {
      response.status(404).json({
        ok: false,
        message: "Producto de campaña no encontrado",
      });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Estado actualizado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al cambiar el estado del producto de campaña",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};

// ─── Eliminar producto de campaña ─────────────────────────────────────────────

export const eliminarProducto = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await eliminarProductoCampania(id);

    if (filasAfectadas === 0) {
      response.status(404).json({
        ok: false,
        message: "Producto de campaña no encontrado",
      });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Producto de campaña desactivado exitosamente" });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: "Error al eliminar el producto de campaña",
      ...(env.nodeEnv !== "production" && {
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
    });
  }
};
