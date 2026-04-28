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
  pagar,
} from "../controllers/facturaController";
import { validarCuerpo } from "../middlewares/validar";

// ─── Esquemas de validación Zod ────────────────────────────────────────────────

const estadosFactura = ["ACTIVA", "ANULADA", "PAGADA", "PENDIENTE"] as const;

const esquemaFactura = z.object({
  ORD_Orden_Venta: z
    .number({ error: "La orden de venta debe ser un número" })
    .int()
    .positive("El ID de orden debe ser positivo"),
  MET_Metodo_Pago: z
    .number({ error: "El método de pago debe ser un número" })
    .int()
    .positive("El ID de método de pago debe ser positivo"),
  FAC_Subtotal: z
    .number({ error: "El subtotal debe ser un número" })
    .min(0, "El subtotal no puede ser negativo"),
  FAC_Total: z
    .number({ error: "El total debe ser un número" })
    .min(0, "El total no puede ser negativo"),
  FAC_UUID:           z.string().max(100).optional().nullable(),
  FAC_Serie:          z.string().max(30).optional().nullable(),
  FAC_Numero:         z.string().max(30).optional().nullable(),
  FAC_Descuento_Total: z.number().min(0).optional(),
  FAC_Impuesto_Total:  z.number().min(0).optional(),
  FAC_Pendiente_Pago:  z.number().min(0).optional(),
  FAC_Total_Pagado:    z.number().min(0).optional(),
  FAC_Estado_Factura:  z.enum(estadosFactura).optional(),
});

const esquemaEstado = z.object({
  // Zod v4: usa string de mensaje directo en lugar de errorMap
  FAC_Estado_Factura: z.enum(estadosFactura, "Estado inválido. Use ACTIVA, ANULADA, PAGADA o PENDIENTE"),
});

const esquemaPago = z.object({
  monto: z
    .number({ error: "El monto debe ser un número" })
    .positive("El monto del pago debe ser mayor a 0"),
});

// ─── Rutas ─────────────────────────────────────────────────────────────────────

export const facturaRoutes = Router();

// GET    /facturas                   → lista todas las facturas
facturaRoutes.get("/", listarFacturas);

// GET    /facturas/orden/:ordenId    → facturas de una orden de venta
facturaRoutes.get("/orden/:ordenId", listarPorOrden);

// GET    /facturas/:id               → obtiene una factura por su ID
facturaRoutes.get("/:id", obtenerFactura);

// POST   /facturas                   → crea una nueva factura
facturaRoutes.post("/", validarCuerpo(esquemaFactura), crear);

// PUT    /facturas/:id               → actualiza una factura
facturaRoutes.put("/:id", validarCuerpo(esquemaFactura), actualizar);

// PATCH  /facturas/:id/estado        → cambia el estado de la factura
facturaRoutes.patch("/:id/estado", validarCuerpo(esquemaEstado), cambiarEstado);

// PATCH  /facturas/:id/pago          → registra un pago parcial o total
facturaRoutes.patch("/:id/pago", validarCuerpo(esquemaPago), pagar);

// DELETE /facturas/:id               → borrado lógico (pasa a ANULADA)
facturaRoutes.delete("/:id", anular);
