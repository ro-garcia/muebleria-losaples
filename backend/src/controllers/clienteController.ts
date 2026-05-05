import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  ClienteServiceError,
  actualizarCliente,
  eliminarCliente,
  listarClientes,
  obtenerClientePorId,
  obtenerComprasCliente,
} from "../services/clienteService";
import { registerCliente, ShopAuthServiceError } from "../services/shopAuthService";

const responderError = (
  response: Response,
  error: unknown,
  message: string,
) => {
  const statusCode =
    error instanceof ClienteServiceError || error instanceof ShopAuthServiceError
      ? error.statusCode
      : 500;
  response.status(statusCode).json({
    ok: false,
    message:
      error instanceof ClienteServiceError || error instanceof ShopAuthServiceError
        ? error.message
        : message,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
};

const getQueryText = (value: unknown) =>
  typeof value === "string" ? value : undefined;

export const listar = async (request: Request, response: Response) => {
  try {
    const data = await listarClientes({
      search: getQueryText(request.query.search),
      documento: getQueryText(request.query.documento),
      nombre: getQueryText(request.query.nombre),
      correo: getQueryText(request.query.correo),
    });
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener clientes");
  }
};

export const obtener = async (request: Request, response: Response) => {
  try {
    const clienteId = Number(request.params.id);
    const data = await obtenerClientePorId(clienteId);
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener cliente");
  }
};

export const compras = async (request: Request, response: Response) => {
  try {
    const clienteId = Number(request.params.id);
    const data = await obtenerComprasCliente(clienteId);
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener compras del cliente");
  }
};

export const crear = async (request: Request, response: Response) => {
  try {
    const session = await registerCliente(request.body);
    const data = await obtenerClientePorId(session.user.clienteId);
    response.status(201).json({
      ok: true,
      message: "Cliente registrado exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al registrar cliente");
  }
};

export const actualizar = async (request: Request, response: Response) => {
  try {
    const clienteId = Number(request.params.id);
    const data = await actualizarCliente(clienteId, request.body);
    response.status(200).json({
      ok: true,
      message: "Cliente actualizado exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar cliente");
  }
};

export const eliminar = async (request: Request, response: Response) => {
  try {
    const clienteId = Number(request.params.id);
    await eliminarCliente(clienteId);
    response.status(200).json({
      ok: true,
      message: "Cliente eliminado exitosamente",
    });
  } catch (error) {
    responderError(response, error, "Error al eliminar cliente");
  }
};
