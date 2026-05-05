import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  agregarProducto,
  cambiarEstado,
  cambiarEstadoProducto,
  crear,
  eliminar,
  eliminarProducto,
  listarCampanias,
  listarProductosCampania,
  obtenerCampania,
  listarDetalleCampanias,
} from "../controllers/campaniaController";
import { validarCuerpo } from "../middlewares/validar";

// ─── Esquemas de validación Zod ────────────────────────────────────────────────

const estadosCampania = ["ACTIVO", "INACTIVO"] as const;

const esquemaFecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD")
  .optional()
  .nullable();

const esquemaCampania = z.object({
  COM_Nombre:          z.string().min(1, "El nombre es requerido").max(150),
  TIE_Tiempo:          z.string().max(50).optional().nullable(),
  COM_Estado:          z.enum(estadosCampania).optional(),
  COM_Fecha_Inicio:    esquemaFecha,
  COM_Fecha_Final:     esquemaFecha,
  REG_Regla_Promocion: z.number().int().positive("La regla de promoción es requerida"),
});

const esquemaEstadoCampania = z.object({
  COM_Estado: z.enum(estadosCampania, "Estado inválido. Use ACTIVO o INACTIVO"),
});

const esquemaProductoCampania = z.object({
  COM_Compaign:        z.number().int().positive("La campaña es requerida"),
  PRO_Producto:        z.number().int().positive("El producto es requerido"),
  CMP_Tipo_Descuento:  z.string().max(50).optional().nullable(),
  CMP_Valor_Descuento: z.number().nonnegative().optional().nullable(),
  CMP_Estado:          z.enum(estadosCampania).optional(),
});

const esquemaEstadoProductoCampania = z.object({
  CMP_Estado: z.enum(estadosCampania, "Estado inválido. Use ACTIVO o INACTIVO"),
});

// ─── Rutas ─────────────────────────────────────────────────────────────────────

export const campaniaRoutes = Router();

// GET    /campanias                 → lista todas las campañas
campaniaRoutes.get("/", listarCampanias);

// GET    /campanias/detalle         → lista todos los productos por campaña
campaniaRoutes.get("/detalle", listarDetalleCampanias);

// GET    /campanias/:id             → obtiene una campaña por su ID
campaniaRoutes.get("/:id", obtenerCampania);

// GET    /campanias/:id/productos   → lista productos de una campaña
campaniaRoutes.get("/:id/productos", listarProductosCampania);

// POST   /campanias                 → crea una nueva campaña
campaniaRoutes.post("/", validarCuerpo(esquemaCampania), crear);

// PUT    /campanias/:id             → actualiza una campaña
campaniaRoutes.put("/:id", validarCuerpo(esquemaCampania), actualizar);

// PATCH  /campanias/:id/estado      → cambia estado de campaña
campaniaRoutes.patch("/:id/estado", validarCuerpo(esquemaEstadoCampania), cambiarEstado);

// DELETE /campanias/:id             → borrado lógico de campaña
campaniaRoutes.delete("/:id", eliminar);

// POST   /campanias/productos       → agrega producto a campaña
campaniaRoutes.post("/productos", validarCuerpo(esquemaProductoCampania), agregarProducto);

// PATCH  /campanias/productos/:id/estado → cambia estado de producto de campaña
campaniaRoutes.patch(
  "/productos/:id/estado",
  validarCuerpo(esquemaEstadoProductoCampania),
  cambiarEstadoProducto,
);

// DELETE /campanias/productos/:id   → borrado lógico de producto de campaña
campaniaRoutes.delete("/productos/:id", eliminarProducto);
