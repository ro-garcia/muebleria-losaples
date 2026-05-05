import type { Request, Response } from "express";

import { env } from "../config/env";
import { type AuthRequest } from "../middlewares/auth";
import {
  checkoutShop,
  getOrderById,
  listOrdersByCliente,
  ShopCheckoutServiceError,
} from "../services/shopCheckoutService";

const responderError = (
  response: Response,
  error: unknown,
  message: string,
) => {
  const statusCode =
    error instanceof ShopCheckoutServiceError ? error.statusCode : 500;

  response.status(statusCode).json({
    ok: false,
    message: error instanceof ShopCheckoutServiceError ? error.message : message,
    ...(env.nodeEnv !== "production" && {
      error: error instanceof Error ? error.message : "Error desconocido",
    }),
  });
};

export const checkout = async (request: Request, response: Response) => {
  try {
    const auth = (request as AuthRequest).auth;
    if (!auth) {
      response.status(401).json({ ok: false, message: "No autenticado" });
      return;
    }

    const { metodoPagoId, ordenId } = request.body as {
      metodoPagoId: number;
      ordenId?: number;
    };

    const data = await checkoutShop({
      clienteId: auth.clienteId,
      metodoPagoId,
      ordenId,
    });

    response.status(200).json({
      ok: true,
      message: "Compra realizada exitosamente",
      data,
    });
  } catch (error) {
    responderError(response, error, "Error al procesar checkout");
  }
};

export const listarMisOrdenes = async (request: Request, response: Response) => {
  try {
    const auth = (request as AuthRequest).auth;
    if (!auth) {
      response.status(401).json({ ok: false, message: "No autenticado" });
      return;
    }

    const data = await listOrdersByCliente(auth.clienteId);
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener historial de compras");
  }
};

export const obtenerMiOrden = async (request: Request, response: Response) => {
  try {
    const auth = (request as AuthRequest).auth;
    if (!auth) {
      response.status(401).json({ ok: false, message: "No autenticado" });
      return;
    }
    const ordenId = Number(request.params.id);
    const data = await getOrderById(auth.clienteId, ordenId);
    response.status(200).json({ ok: true, data });
  } catch (error) {
    responderError(response, error, "Error al obtener la compra");
  }
};
