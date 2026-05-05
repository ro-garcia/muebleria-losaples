import { Router } from "express";
import { z } from "zod";

import {
  checkout,
  listarMisOrdenes,
  obtenerMiOrden,
} from "../controllers/shopCheckoutController";
import { requireAuth } from "../middlewares/auth";
import { validarCuerpo } from "../middlewares/validar";

const checkoutSchema = z.object({
  metodoPagoId: z.number().int().positive(),
  ordenId: z.number().int().positive().optional(),
  tarjeta: z
    .object({
      titular: z.string().optional(),
      numero: z.string().optional(),
      vencimiento: z.string().optional(),
      cvv: z.string().optional(),
    })
    .optional(),
});

export const shopCheckoutRoutes = Router();

shopCheckoutRoutes.post("/", requireAuth, validarCuerpo(checkoutSchema), checkout);
shopCheckoutRoutes.get("/orders", requireAuth, listarMisOrdenes);
shopCheckoutRoutes.get("/orders/:id", requireAuth, obtenerMiOrden);
