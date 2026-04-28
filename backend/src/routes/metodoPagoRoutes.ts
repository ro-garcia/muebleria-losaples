import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  cambiarEstado,
  crear,
  eliminar,
  listarMetodosPago,
  obtenerMetodoPago,
} from "../controllers/metodoPagoController";
import { validarCuerpo } from "../middlewares/validar";

// ─── Esquemas de validación Zod ────────────────────────────────────────────────

const estadosMetodoPago = ["ACTIVO", "INACTIVO"] as const;

const esquemaMetodoPago = z.object({
  MET_Nombre: z.string().min(1, "El nombre es requerido").max(100),
  MET_Estado: z.enum(estadosMetodoPago).optional(),
});

const esquemaEstado = z.object({
  // Zod v4: usa string de mensaje directo en lugar de errorMap
  MET_Estado: z.enum(estadosMetodoPago, "Estado inválido. Use ACTIVO o INACTIVO"),
});

// ─── Rutas ─────────────────────────────────────────────────────────────────────

export const metodoPagoRoutes = Router();

// GET    /metodos-pago         → lista todos los métodos de pago
metodoPagoRoutes.get("/", listarMetodosPago);

// GET    /metodos-pago/:id     → obtiene un método de pago por su ID
metodoPagoRoutes.get("/:id", obtenerMetodoPago);

// POST   /metodos-pago         → crea un nuevo método de pago
metodoPagoRoutes.post("/", validarCuerpo(esquemaMetodoPago), crear);

// PUT    /metodos-pago/:id     → actualiza un método de pago
metodoPagoRoutes.put("/:id", validarCuerpo(esquemaMetodoPago), actualizar);

// PATCH  /metodos-pago/:id/estado → cambia solo el estado
metodoPagoRoutes.patch(
  "/:id/estado",
  validarCuerpo(esquemaEstado),
  cambiarEstado,
);

// DELETE /metodos-pago/:id     → borrado lógico (pasa a INACTIVO)
metodoPagoRoutes.delete("/:id", eliminar);
