import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  anular,
  cambiarEstado,
  crear,
  listarOrdenesVenta,
  listarPorCliente,
  listarPorTienda,
  obtenerOrdenVenta,
} from "../controllers/ordenVentaController";
import { validarCuerpo } from "../middlewares/validar";

// ─── Esquemas de validación Zod ────────────────────────────────────────────────

const estadosOrden = ["ACTIVO", "ANULADO", "FINALIZADO"] as const;

const esquemaOrdenVenta = z.object({
  CLI_Cliente: z
    .number({ error: "El cliente debe ser un número" })
    .int()
    .positive("El ID de cliente debe ser positivo"),
  TIE_Tienda: z
    .number({ error: "La tienda debe ser un número" })
    .int()
    .positive("El ID de tienda debe ser positivo"),
  ODV_Subtotal: z
    .number({ error: "El subtotal debe ser un número" })
    .min(0, "El subtotal no puede ser negativo"),
  ODV_Total: z
    .number({ error: "El total debe ser un número" })
    .min(0, "El total no puede ser negativo"),
  ODV_Descuento: z.number().min(0).optional(),
  ODV_Impuesto:  z.number().min(0).optional(),
  ODV_Estado:    z.enum(estadosOrden).optional(),
});

const esquemaEstado = z.object({
  // Zod v4: usa string de mensaje directo en lugar de errorMap
  ODV_Estado: z.enum(estadosOrden, "Estado inválido. Use ACTIVO, ANULADO o FINALIZADO"),
});

// ─── Rutas ─────────────────────────────────────────────────────────────────────

export const ordenVentaRoutes = Router();

// Las rutas con segmentos fijos deben declararse ANTES de las parametrizadas
// para evitar que Express las interprete como parámetros dinámicos.

// GET    /ordenes-venta                      → lista todas las órdenes
ordenVentaRoutes.get("/", listarOrdenesVenta);

// GET    /ordenes-venta/cliente/:clienteId   → órdenes de un cliente
ordenVentaRoutes.get("/cliente/:clienteId", listarPorCliente);

// GET    /ordenes-venta/tienda/:tiendaId     → órdenes de una tienda
ordenVentaRoutes.get("/tienda/:tiendaId", listarPorTienda);

// GET    /ordenes-venta/:id                  → obtiene una orden por ID
ordenVentaRoutes.get("/:id", obtenerOrdenVenta);

// POST   /ordenes-venta                      → crea una nueva orden
ordenVentaRoutes.post("/", validarCuerpo(esquemaOrdenVenta), crear);

// PUT    /ordenes-venta/:id                  → actualiza una orden
ordenVentaRoutes.put("/:id", validarCuerpo(esquemaOrdenVenta), actualizar);

// PATCH  /ordenes-venta/:id/estado           → cambia el estado
ordenVentaRoutes.patch(
  "/:id/estado",
  validarCuerpo(esquemaEstado),
  cambiarEstado,
);

// DELETE /ordenes-venta/:id                  → borrado lógico (ANULADO)
ordenVentaRoutes.delete("/:id", anular);
