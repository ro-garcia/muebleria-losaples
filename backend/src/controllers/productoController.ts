import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarProducto,
  asignarCategoriaProducto,
  cambiarEstadoProducto,
  crearProducto,
  obtenerColores,
  obtenerMateriales,
  obtenerProductoPorId,
  obtenerProductos,
  obtenerTodosProductos,
  ProductoServiceError,
} from "../services/productoService";

const responderError = (
  response: Response,
  error: unknown,
  mensajeServidor: string,
) => {
  const statusCode =
    error instanceof ProductoServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message:
      error instanceof ProductoServiceError ? error.message : mensajeServidor,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
};

export const listarProductos = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const { categoriaId, categoria, todos } = request.query;

    if (todos === "true") {
      const productos = await obtenerTodosProductos();
      response.status(200).json({ ok: true, data: productos });
      return;
    }

    const categoriaParam = categoriaId ?? categoria;
    const catId =
      typeof categoriaParam === "string" && categoriaParam.trim() !== ""
        ? Number(categoriaParam)
        : undefined;

    if (categoriaParam && !Number.isFinite(catId)) {
      response.status(400).json({ ok: false, message: "Categoria invalida" });
      return;
    }

    const productos = await obtenerProductos(catId);
    response.status(200).json({ ok: true, data: productos });
  } catch (error) {
    responderError(response, error, "Error al obtener los productos");
  }
};

export const obtenerProducto = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const producto = await obtenerProductoPorId(id);

    if (!producto) {
      response
        .status(404)
        .json({ ok: false, message: "Producto no encontrado" });
      return;
    }

    response.status(200).json({ ok: true, data: producto });
  } catch (error) {
    responderError(response, error, "Error al obtener el producto");
  }
};

export const listarMateriales = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    const materiales = await obtenerMateriales();
    response.status(200).json({ ok: true, data: materiales });
  } catch (error) {
    responderError(response, error, "Error al obtener los materiales");
  }
};

export const listarColores = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    const colores = await obtenerColores();
    response.status(200).json({ ok: true, data: colores });
  } catch (error) {
    responderError(response, error, "Error al obtener los colores");
  }
};

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const { PRO_Codigo, PRO_Nombre } = request.body as Record<string, unknown>;

    if (!PRO_Nombre || String(PRO_Nombre).trim() === "") {
      response
        .status(400)
        .json({ ok: false, message: "El nombre del producto es requerido." });
      return;
    }

    if (!PRO_Codigo || String(PRO_Codigo).trim() === "") {
      response
        .status(400)
        .json({ ok: false, message: "El codigo del producto es requerido." });
      return;
    }

    const resultado = await crearProducto(request.body);
    response
      .status(201)
      .json({ 
        ok: true, 
        message: "Producto creado exitosamente.", 
        data: resultado 
      });
  } catch (error) {
    responderError(response, error, "Error al crear el producto");
  }
};

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const { PRO_Codigo, PRO_Nombre } = request.body as Record<string, unknown>;

    if (!PRO_Nombre || String(PRO_Nombre).trim() === "") {
      response
        .status(400)
        .json({ ok: false, message: "El nombre del producto es requerido." });
      return;
    }

    if (!PRO_Codigo || String(PRO_Codigo).trim() === "") {
      response
        .status(400)
        .json({ ok: false, message: "El codigo del producto es requerido." });
      return;
    }

    const resultado = await actualizarProducto(id, request.body);
    response
      .status(200)
      .json({ 
        ok: true, 
        message: "Producto actualizado exitosamente.",
        data: resultado
      });
  } catch (error) {
    responderError(response, error, "Error al actualizar el producto");
  }
};

export const asignarCategoria = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const { TIP_Tipo_Producto } = request.body as { TIP_Tipo_Producto?: number };

    if (!TIP_Tipo_Producto || !Number.isFinite(TIP_Tipo_Producto)) {
      response
        .status(400)
        .json({ ok: false, message: "El tipo de producto es requerido." });
      return;
    }

    await asignarCategoriaProducto(id, TIP_Tipo_Producto);
    response
      .status(200)
      .json({ ok: true, message: "Mueble vinculado a la categoria correctamente." });
  } catch (error) {
    responderError(response, error, "Error al asignar la categoria");
  }
};

export const cambiarEstado = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const { PRO_Estado } = request.body as { PRO_Estado?: string };

    if (!PRO_Estado) {
      response
        .status(400)
        .json({ ok: false, message: "El estado es requerido." });
      return;
    }

    const filas = await cambiarEstadoProducto(id, PRO_Estado);

    if (filas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Producto no encontrado." });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Estado actualizado exitosamente." });
  } catch (error) {
    responderError(response, error, "Error al cambiar el estado del producto");
  }
};
