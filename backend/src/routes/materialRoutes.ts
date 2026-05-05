import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  crear,
  eliminar,
  listarMateriales,
  obtenerMaterial,
} from "../controllers/materialController";
import { validarCuerpo } from "../middlewares/validar";

const esquemaMaterial = z.object({
  MAP_Nombre: z.string().min(1, "El nombre es requerido").max(100),
  MAP_Detalle: z.string().max(200).optional().nullable(),
});

export const materialRoutes = Router();

materialRoutes.get("/", listarMateriales);
materialRoutes.get("/:id", obtenerMaterial);
materialRoutes.post("/", validarCuerpo(esquemaMaterial), crear);
materialRoutes.put("/:id", validarCuerpo(esquemaMaterial), actualizar);
materialRoutes.delete("/:id", eliminar);
