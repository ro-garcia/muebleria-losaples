import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  cambiarEstado,
  crear,
  eliminar,
  listarImpuestos,
  obtenerImpuesto,
} from "../controllers/impuestoController";
import { validarCuerpo } from "../middlewares/validar";

// ─── Esquemas de validación Zod ────────────────────────────────────────────────

const estadosImpuesto = ["ACTIVO", "INACTIVO"] as const;

const esquemaImpuesto = z.object({
  IMP_Nombre: z.string().min(1, "El nombre es requerido").max(100),
  IMP_Porcentaje: z
    .number({ error: "El porcentaje debe ser un número" })
    .min(0, "El porcentaje no puede ser negativo")
    .max(100, "El porcentaje no puede superar 100"),
  IMP_Estado: z.enum(estadosImpuesto).optional(),
});

const esquemaEstado = z.object({
  // Zod v4: usa "error" en lugar de "errorMap"
  IMP_Estado: z.enum(estadosImpuesto, "Estado inválido. Use ACTIVO o INACTIVO"),
});

// ─── Rutas ─────────────────────────────────────────────────────────────────────

export const impuestoRoutes = Router();

// GET    /impuestos         → lista todos los impuestos
impuestoRoutes.get("/", listarImpuestos);

// GET    /impuestos/:id     → obtiene un impuesto por su ID
impuestoRoutes.get("/:id", obtenerImpuesto);

// POST   /impuestos         → crea un nuevo impuesto
impuestoRoutes.post("/", validarCuerpo(esquemaImpuesto), crear);

// PUT    /impuestos/:id     → actualiza un impuesto
impuestoRoutes.put("/:id", validarCuerpo(esquemaImpuesto), actualizar);

// PATCH  /impuestos/:id/estado → cambia solo el estado
impuestoRoutes.patch("/:id/estado", validarCuerpo(esquemaEstado), cambiarEstado);

// DELETE /impuestos/:id     → borrado lógico (pasa a INACTIVO)
impuestoRoutes.delete("/:id", eliminar);
