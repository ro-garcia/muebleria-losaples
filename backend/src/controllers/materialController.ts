import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarMaterial,
  crearMaterial,
  eliminarMaterial,
  MaterialServiceError,
  obtenerMateriales,
  obtenerMaterialPorId,
} from "../services/materialService";

const responderError = (
  response: Response,
  error: unknown,
  mensajeServidor: string,
) => {
  const statusCode = error instanceof MaterialServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message:
      error instanceof MaterialServiceError ? error.message : mensajeServidor,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
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

export const obtenerMaterial = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const material = await obtenerMaterialPorId(id);

    if (!material) {
      response.status(404).json({ ok: false, message: "Material no encontrado" });
      return;
    }

    response.status(200).json({ ok: true, data: material });
  } catch (error) {
    responderError(response, error, "Error al obtener el material");
  }
};

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const material = await crearMaterial(request.body);
    response.status(201).json({
      ok: true,
      message: "Material creado exitosamente",
      data: material,
    });
  } catch (error) {
    responderError(response, error, "Error al crear el material");
  }
};

export const actualizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await actualizarMaterial(id, request.body);

    if (filasAfectadas === 0) {
      response.status(404).json({ ok: false, message: "Material no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Material actualizado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar el material");
  }
};

export const eliminar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = Number(request.params.id);
    const filasAfectadas = await eliminarMaterial(id);

    if (filasAfectadas === 0) {
      response.status(404).json({ ok: false, message: "Material no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Material eliminado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al eliminar el material");
  }
};
