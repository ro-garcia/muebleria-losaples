import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  cambiarEstado,
  crear,
  eliminar,
  listarMateriasPrimas,
  obtenerMateriaPrima,
} from "../controllers/materiaPrimaController";
import { validarCuerpo } from "../middlewares/validar";

const schema = z.object({
  MAP_Nombre: z.string().min(1, "El nombre de la materia prima es requerido"),
  MAP_Unidad_Medida: z.string().max(50).optional().nullable(),
  MAP_Costo_Referencial: z.number().min(0).optional().nullable(),
  MAP_Estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});

const estadoSchema = z.object({
  MAP_Estado: z.enum(["ACTIVO", "INACTIVO"]),
});

export const materiaPrimaRoutes = Router();

materiaPrimaRoutes.get("/", listarMateriasPrimas);
materiaPrimaRoutes.get("/:id", obtenerMateriaPrima);
materiaPrimaRoutes.post("/", validarCuerpo(schema), crear);
materiaPrimaRoutes.put("/:id", validarCuerpo(schema), actualizar);
materiaPrimaRoutes.patch("/:id/estado", validarCuerpo(estadoSchema), cambiarEstado);
materiaPrimaRoutes.delete("/:id", eliminar);
