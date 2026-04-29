import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  crear,
  eliminar,
  listarPorOrden,
  obtenerDetalle,
} from "../controllers/detOrdenVentaController";
import { validarCuerpo } from "../middlewares/validar";

// ─── Esquemas de validación Zod ────────────────────────────────────────────────

const esquemaDetOrdenVenta = z.object({
  ODV_Orden_Venta: z
    .number({ error: "La orden debe ser un número" })
    .int()
    .positive("El ID de orden debe ser positivo"),
  PRO_Producto: z
    .number({ error: "El producto debe ser un número" })
    .int()
    .positive("El ID de producto debe ser positivo"),
  DOV_Cantidad: z
    .number({ error: "La cantidad debe ser un número" })
    .positive("La cantidad debe ser mayor a 0"),
  DOV_Precio_Unitario: z
    .number({ error: "El precio unitario debe ser un número" })
    .min(0, "El precio no puede ser negativo"),
  DOV_Subtotal: z
    .number({ error: "El subtotal debe ser un número" })
    .min(0, "El subtotal no puede ser negativo"),
  DOV_Descuento: z.number().min(0).optional(),
});

// ─── Rutas ─────────────────────────────────────────────────────────────────────

export const detOrdenVentaRoutes = Router();

// GET    /det-orden-venta/orden/:ordenId → detalles de una orden específica
detOrdenVentaRoutes.get("/orden/:ordenId", listarPorOrden);

// GET    /det-orden-venta/:id            → obtiene un detalle por su ID
detOrdenVentaRoutes.get("/:id", obtenerDetalle);

// POST   /det-orden-venta                → agrega un detalle a una orden
detOrdenVentaRoutes.post("/", validarCuerpo(esquemaDetOrdenVenta), crear);

// PUT    /det-orden-venta/:id            → actualiza un detalle
detOrdenVentaRoutes.put(
  "/:id",
  validarCuerpo(esquemaDetOrdenVenta),
  actualizar,
);

// DELETE /det-orden-venta/:id            → elimina físicamente el detalle
detOrdenVentaRoutes.delete("/:id", eliminar);
