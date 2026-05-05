import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  actualizarCargo,
  actualizarDepartamentoLaboral,
  actualizarPuesto,
  cambiarEstadoDepartamentoLaboral,
  cambiarEstadoPuesto,
  crearCargo,
  crearDepartamentoLaboral,
  crearPuesto,
  eliminarCargo,
  eliminarDepartamentoLaboral,
  eliminarPuesto,
  EmpleadoCatalogoServiceError,
  obtenerCargoPorId,
  obtenerCargos,
  obtenerDepartamentoLaboralPorId,
  obtenerDepartamentosLaborales,
  obtenerPuestoPorId,
  obtenerPuestos,
} from "../services/empleadoCatalogoService";

const responderError = (
  response: Response,
  error: unknown,
  message: string,
) => {
  const statusCode =
    error instanceof EmpleadoCatalogoServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message:
      error instanceof EmpleadoCatalogoServiceError ? error.message : message,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
};

export const listarCargos = async (_request: Request, response: Response) => {
  try {
    const data = await obtenerCargos();
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener cargos");
  }
};

export const obtenerCargo = async (request: Request, response: Response) => {
  try {
    const cargoId = Number(request.params.id);
    const data = await obtenerCargoPorId(cargoId);

    if (!data) {
      response.status(404).json({ ok: false, message: "Cargo no encontrado" });
      return;
    }

    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener cargo");
  }
};

export const crearCargoHandler = async (
  request: Request,
  response: Response,
) => {
  try {
    const data = await crearCargo(request.body);
    response.status(201).json({
      ok: true,
      message: "Cargo creado exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al crear cargo");
  }
};

export const actualizarCargoHandler = async (
  request: Request,
  response: Response,
) => {
  try {
    const cargoId = Number(request.params.id);
    const rowsAffected = await actualizarCargo(cargoId, request.body);

    if (rowsAffected === 0) {
      response.status(404).json({ ok: false, message: "Cargo no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Cargo actualizado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar cargo");
  }
};

export const eliminarCargoHandler = async (
  request: Request,
  response: Response,
) => {
  try {
    const cargoId = Number(request.params.id);
    const rowsAffected = await eliminarCargo(cargoId);

    if (rowsAffected === 0) {
      response.status(404).json({ ok: false, message: "Cargo no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Cargo eliminado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al eliminar cargo");
  }
};

export const listarPuestos = async (request: Request, response: Response) => {
  try {
    const soloActivos =
      request.query.activos !== "false" && request.query.activos !== "0";
    const data = await obtenerPuestos(soloActivos);
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener puestos");
  }
};

export const obtenerPuesto = async (request: Request, response: Response) => {
  try {
    const puestoId = Number(request.params.id);
    const data = await obtenerPuestoPorId(puestoId);

    if (!data) {
      response.status(404).json({ ok: false, message: "Puesto no encontrado" });
      return;
    }

    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener puesto");
  }
};

export const crearPuestoHandler = async (
  request: Request,
  response: Response,
) => {
  try {
    const data = await crearPuesto(request.body);
    response.status(201).json({
      ok: true,
      message: "Puesto creado exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al crear puesto");
  }
};

export const actualizarPuestoHandler = async (
  request: Request,
  response: Response,
) => {
  try {
    const puestoId = Number(request.params.id);
    const rowsAffected = await actualizarPuesto(puestoId, request.body);

    if (rowsAffected === 0) {
      response.status(404).json({ ok: false, message: "Puesto no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Puesto actualizado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar puesto");
  }
};

export const cambiarEstadoPuestoHandler = async (
  request: Request,
  response: Response,
) => {
  try {
    const puestoId = Number(request.params.id);
    const rowsAffected = await cambiarEstadoPuesto(
      puestoId,
      request.body.PUE_Estado,
    );

    if (rowsAffected === 0) {
      response.status(404).json({ ok: false, message: "Puesto no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Estado del puesto actualizado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar el estado del puesto");
  }
};

export const eliminarPuestoHandler = async (
  request: Request,
  response: Response,
) => {
  try {
    const puestoId = Number(request.params.id);
    const rowsAffected = await eliminarPuesto(puestoId);

    if (rowsAffected === 0) {
      response.status(404).json({ ok: false, message: "Puesto no encontrado" });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Puesto inactivado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al eliminar puesto");
  }
};

export const listarDepartamentos = async (
  request: Request,
  response: Response,
) => {
  try {
    const soloActivos =
      request.query.activos !== "false" && request.query.activos !== "0";
    const data = await obtenerDepartamentosLaborales(soloActivos);
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener departamentos laborales");
  }
};

export const obtenerDepartamento = async (
  request: Request,
  response: Response,
) => {
  try {
    const departamentoId = Number(request.params.id);
    const data = await obtenerDepartamentoLaboralPorId(departamentoId);

    if (!data) {
      response.status(404).json({
        ok: false,
        message: "Departamento laboral no encontrado",
      });
      return;
    }

    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener departamento laboral");
  }
};

export const crearDepartamentoHandler = async (
  request: Request,
  response: Response,
) => {
  try {
    const data = await crearDepartamentoLaboral(request.body);
    response.status(201).json({
      ok: true,
      message: "Departamento laboral creado exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al crear departamento laboral");
  }
};

export const actualizarDepartamentoHandler = async (
  request: Request,
  response: Response,
) => {
  try {
    const departamentoId = Number(request.params.id);
    const rowsAffected = await actualizarDepartamentoLaboral(
      departamentoId,
      request.body,
    );

    if (rowsAffected === 0) {
      response.status(404).json({
        ok: false,
        message: "Departamento laboral no encontrado",
      });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Departamento laboral actualizado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar departamento laboral");
  }
};

export const cambiarEstadoDepartamentoHandler = async (
  request: Request,
  response: Response,
) => {
  try {
    const departamentoId = Number(request.params.id);
    const rowsAffected = await cambiarEstadoDepartamentoLaboral(
      departamentoId,
      request.body.DEP_Estado,
    );

    if (rowsAffected === 0) {
      response.status(404).json({
        ok: false,
        message: "Departamento laboral no encontrado",
      });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Estado del departamento laboral actualizado exitosamente",
    });
  } catch (error) {
    responderError(
      response,
      error,
      "Error al actualizar el estado del departamento laboral",
    );
  }
};

export const eliminarDepartamentoHandler = async (
  request: Request,
  response: Response,
) => {
  try {
    const departamentoId = Number(request.params.id);
    const rowsAffected = await eliminarDepartamentoLaboral(departamentoId);

    if (rowsAffected === 0) {
      response.status(404).json({
        ok: false,
        message: "Departamento laboral no encontrado",
      });
      return;
    }

    response.status(200).json({
      ok: true,
      message: "Departamento laboral inactivado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al eliminar departamento laboral");
  }
};
