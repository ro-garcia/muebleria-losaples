import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  EmpleadoServiceError,
  actualizarEmpleado,
  crearEmpleado,
  eliminarEmpleado,
  obtenerEmpleadoPorId,
  obtenerEmpleados,
} from "../services/empleadoService";

const responderError = (
  response: Response,
  error: unknown,
  message: string,
) => {
  const statusCode =
    error instanceof EmpleadoServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message: error instanceof EmpleadoServiceError ? error.message : message,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
};

export const listar = async (request: Request, response: Response) => {
  try {
    const soloActivos =
      request.query.activos !== "false" && request.query.activos !== "0";
    const data = await obtenerEmpleados(soloActivos);
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener empleados");
  }
};

export const obtener = async (request: Request, response: Response) => {
  try {
    const empleadoId = Number(request.params.id);
    const data = await obtenerEmpleadoPorId(empleadoId);
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener empleado");
  }
};

export const crear = async (request: Request, response: Response) => {
  try {
    const data = await crearEmpleado(request.body);
    response.status(201).json({
      ok: true,
      message: "Empleado creado exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al crear empleado");
  }
};

export const actualizar = async (request: Request, response: Response) => {
  try {
    const empleadoId = Number(request.params.id);
    const data = await actualizarEmpleado(empleadoId, request.body);
    response.status(200).json({
      ok: true,
      message: "Empleado actualizado exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar empleado");
  }
};

export const eliminar = async (request: Request, response: Response) => {
  try {
    const empleadoId = Number(request.params.id);
    await eliminarEmpleado(empleadoId);
    response.status(200).json({
      ok: true,
      message: "Empleado inactivado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al eliminar empleado");
  }
};
