import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  anular,
  cambiarEstado,
  crear,
  listarFacturas,
  listarPorOrden,
  obtenerFactura,
  obtenerFacturaDetalleController,
  pagar,
} from "../controllers/facturaController";
import { validarCuerpo } from "../middlewares/validar";

const estadosFactura = ["ACTIVA", "ANULADA", "PAGADA", "PENDIENTE"] as const;

const esquemaFactura = z.object({
  ORD_Orden_Venta: z.number({ error: "La orden de venta debe ser un numero" }).int().positive(),
  MET_Metodo_Pago: z.number({ error: "El metodo de pago debe ser un numero" }).int().positive(),
  FAC_Subtotal: z.number({ error: "El subtotal debe ser un numero" }).min(0),
  FAC_Total: z.number({ error: "El total debe ser un numero" }).min(0),
  FAC_UUID: z.string().max(100).optional().nullable(),
  FAC_Serie: z.string().max(30).optional().nullable(),
  FAC_Numero: z.string().max(30).optional().nullable(),
  FAC_Descuento_Total: z.number().min(0).optional(),
  FAC_Impuesto_Total: z.number().min(0).optional(),
  FAC_Pendiente_Pago: z.number().min(0).optional(),
  FAC_Total_Pagado: z.number().min(0).optional(),
  FAC_Estado_Factura: z.enum(estadosFactura).optional(),
});

const esquemaEstado = z.object({
  FAC_Estado_Factura: z.enum(
    estadosFactura,
    "Estado invalido. Use ACTIVA, ANULADA, PAGADA o PENDIENTE",
  ),
});

const esquemaPago = z.object({
  monto: z.number({ error: "El monto debe ser un numero" }).positive(),
});

export const facturaRoutes = Router();

facturaRoutes.get("/", listarFacturas);
facturaRoutes.get("/orden/:ordenId", listarPorOrden);
facturaRoutes.get("/:id/detalle", obtenerFacturaDetalleController);
facturaRoutes.get("/:id", obtenerFactura);
facturaRoutes.post("/", validarCuerpo(esquemaFactura), crear);
facturaRoutes.put("/:id", validarCuerpo(esquemaFactura), actualizar);
facturaRoutes.patch("/:id/estado", validarCuerpo(esquemaEstado), cambiarEstado);
facturaRoutes.patch("/:id/pago", validarCuerpo(esquemaPago), pagar);
facturaRoutes.delete("/:id", anular);
