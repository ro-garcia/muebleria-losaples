import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  crear,
  eliminar,
  listarPorFactura,
  obtenerDetalle,
} from "../controllers/detalleFacturaController";
import { validarCuerpo } from "../middlewares/validar";

// ─── Esquemas de validación Zod ────────────────────────────────────────────────

const esquemaDetalleFactura = z.object({
  FAC_Factura: z
    .number({ error: "La factura debe ser un número" })
    .int()
    .positive("El ID de factura debe ser positivo"),
  PRO_Producto: z
    .number({ error: "El producto debe ser un número" })
    .int()
    .positive("El ID de producto debe ser positivo"),
  IMP_Impuesto: z
    .number({ error: "El impuesto debe ser un número" })
    .int()
    .positive("El ID de impuesto debe ser positivo"),
  DFA_Cantidad: z
    .number({ error: "La cantidad debe ser un número" })
    .positive("La cantidad debe ser mayor a 0"),
  DFA_Precio: z
    .number({ error: "El precio debe ser un número" })
    .min(0, "El precio no puede ser negativo"),
  DFA_Subtotal: z
    .number({ error: "El subtotal debe ser un número" })
    .min(0, "El subtotal no puede ser negativo"),
  DFA_Descuento: z.number().min(0).optional(),
  DFA_Impuesto:  z.number().min(0).optional(),
});

// ─── Rutas ─────────────────────────────────────────────────────────────────────

export const detalleFacturaRoutes = Router();

// GET    /detalle-factura/factura/:facturaId → detalles de una factura
detalleFacturaRoutes.get("/factura/:facturaId", listarPorFactura);

// GET    /detalle-factura/:id               → obtiene un detalle por su ID
detalleFacturaRoutes.get("/:id", obtenerDetalle);

// POST   /detalle-factura                   → agrega un detalle a una factura
detalleFacturaRoutes.post("/", validarCuerpo(esquemaDetalleFactura), crear);

// PUT    /detalle-factura/:id               → actualiza un detalle
detalleFacturaRoutes.put(
  "/:id",
  validarCuerpo(esquemaDetalleFactura),
  actualizar,
);

// DELETE /detalle-factura/:id               → eliminación física del detalle
detalleFacturaRoutes.delete("/:id", eliminar);
