import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  crear,
  eliminar,
  listarStock,
  obtenerStock,
} from "../controllers/stockMateriaPrimaController";
import { validarCuerpo } from "../middlewares/validar";

const schema = z
  .object({
    MAP_Materia_Prima: z.number().int().positive(),
    SMP_Cantidad: z.number().min(0),
    SMP_Stock_Minimo: z.number().min(0).optional().nullable(),
    SMP_Stock_Maximo: z.number().min(0).optional().nullable(),
  })
  .refine(
    (data) =>
      data.SMP_Stock_Minimo == null ||
      data.SMP_Stock_Maximo == null ||
      data.SMP_Stock_Minimo <= data.SMP_Stock_Maximo,
    {
      path: ["SMP_Stock_Minimo"],
      message: "El stock minimo no puede ser mayor al stock maximo",
    },
  );

export const stockMateriaPrimaRoutes = Router();

stockMateriaPrimaRoutes.get("/", listarStock);
stockMateriaPrimaRoutes.get("/:id", obtenerStock);
stockMateriaPrimaRoutes.post("/", validarCuerpo(schema), crear);
stockMateriaPrimaRoutes.put("/:id", validarCuerpo(schema), actualizar);
stockMateriaPrimaRoutes.delete("/:id", eliminar);
