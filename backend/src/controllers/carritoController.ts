import type { Request, Response } from "express";

import { env } from "../config/env";
import {
  agregarItemACarritoActivo,
  agregarItemAOrden,
  actualizarItemCarrito,
  CarritoServiceError,
  crearORecuperarCarrito,
  eliminarItemCarrito,
  finalizarCarrito,
  obtenerCarritoPorCliente,
  obtenerCarritoPorId,
  vaciarCarrito,
} from "../services/carritoService";

const responderError = (
  response: Response,
  error: unknown,
  mensajeServidor: string,
) => {
  const statusCode =
    error instanceof CarritoServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message:
      error instanceof CarritoServiceError ? error.message : mensajeServidor,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
};

export const obtenerPorCliente = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const clienteId = Number(request.params.clienteId);
    const carrito = await obtenerCarritoPorCliente(clienteId);

    response.status(200).json({ ok: true, data: carrito });
  } catch (error) {
    responderError(response, error, "Error al obtener el carrito del cliente");
  }
};

export const obtenerPorId = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const ordenId = Number(request.params.ordenId);
    const carrito = await obtenerCarritoPorId(ordenId);

    if (!carrito) {
      response.status(404).json({ ok: false, message: "Carrito no encontrado" });
      return;
    }

    response.status(200).json({ ok: true, data: carrito });
  } catch (error) {
    responderError(response, error, "Error al obtener el carrito");
  }
};

export const crear = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const carrito = await crearORecuperarCarrito(request.body);

    response.status(201).json({
      ok: true,
      message: "Carrito creado o recuperado exitosamente",
      data: carrito,
    });
  } catch (error) {
    responderError(response, error, "Error al crear el carrito");
  }
};

export const agregarItemActivo = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const carrito = await agregarItemACarritoActivo(request.body);

    response.status(200).json({
      ok: true,
      message: "Producto agregado al carrito exitosamente",
      data: carrito,
    });
  } catch (error) {
    responderError(response, error, "Error al agregar el producto al carrito");
  }
};

export const agregarItem = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const ordenId = Number(request.params.ordenId);
    const carrito = await agregarItemAOrden(ordenId, request.body);

    response.status(200).json({
      ok: true,
      message: "Producto agregado al carrito exitosamente",
      data: carrito,
    });
  } catch (error) {
    responderError(response, error, "Error al agregar el producto al carrito");
  }
};

export const actualizarItem = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const detalleId = Number(request.params.detalleId);
    const carrito = await actualizarItemCarrito(detalleId, request.body);

    response.status(200).json({
      ok: true,
      message: "Item de carrito actualizado exitosamente",
      data: carrito,
    });
  } catch (error) {
    responderError(response, error, "Error al actualizar el item del carrito");
  }
};

export const eliminarItem = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const detalleId = Number(request.params.detalleId);
    const carrito = await eliminarItemCarrito(detalleId);

    response.status(200).json({
      ok: true,
      message: "Item de carrito eliminado exitosamente",
      data: carrito,
    });
  } catch (error) {
    responderError(response, error, "Error al eliminar el item del carrito");
  }
};

export const vaciar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const ordenId = Number(request.params.ordenId);
    const carrito = await vaciarCarrito(ordenId);

    response.status(200).json({
      ok: true,
      message: "Carrito vaciado exitosamente",
      data: carrito,
    });
  } catch (error) {
    responderError(response, error, "Error al vaciar el carrito");
  }
};

export const finalizar = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const ordenId = Number(request.params.ordenId);
    const carrito = await finalizarCarrito(ordenId);

    response.status(200).json({
      ok: true,
      message: "Carrito finalizado exitosamente",
      data: carrito,
    });
  } catch (error) {
    responderError(response, error, "Error al finalizar el carrito");
  }
};
