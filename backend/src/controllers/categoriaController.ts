import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarCategoria,
  CategoriaServiceError,
  crearCategoria,
  eliminarCategoria,
  obtenerCategoriaPorId,
  obtenerCategorias,
} from "../services/categoriaService";

const responderError = (
  response: Response,
  error: unknown,
  mensajeServidor: string,
) => {
  const statusCode =
    error instanceof CategoriaServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message:
      error instanceof CategoriaServiceError ? error.message : mensajeServidor,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
};

export const listarCategorias = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    const categorias = await obtenerCategorias();
    response.status(200).json({ ok: true, data: categorias });
  } catch (error) {
    responderError(response, error, "Error al obtener las categorias");
  }
};

export const obtenerCategoria = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const categoria = await obtenerCategoriaPorId(id);

    if (!categoria) {
      response
        .status(404)
        .json({ ok: false, message: "Categoria no encontrada" });
      return;
    }

    response.status(200).json({ ok: true, data: categoria });
  } catch (error) {
    responderError(response, error, "Error al obtener la categoria");
  }
};

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const categoria = await crearCategoria(request.body);

    response.status(201).json({
      ok: true,
      message: "Categoria creada exitosamente",
      data: categoria,
    });
  } catch (error) {
    responderError(response, error, "Error al crear la categoria");
  }
};

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await actualizarCategoria(id, request.body);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Categoria no encontrada" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Categoria actualizada exitosamente" });
  } catch (error) {
    responderError(response, error, "Error al actualizar la categoria");
  }
};

export const eliminar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await eliminarCategoria(id);

    if (filasAfectadas === 0) {
      response
        .status(404)
        .json({ ok: false, message: "Categoria no encontrada" });
      return;
    }

    response
      .status(200)
      .json({ ok: true, message: "Categoria eliminada exitosamente" });
  } catch (error) {
    responderError(response, error, "Error al eliminar la categoria");
  }
};
