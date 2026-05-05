import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  cambiarEstado,
  crear,
  eliminar,
  listarColores,
  obtenerColor,
} from "../controllers/colorController";
import { validarCuerpo } from "../middlewares/validar";

const estadosColor = ["ACTIVO", "INACTIVO"] as const;

const esquemaColor = z.object({
  COP_Nombre: z.string().min(1, "El nombre es requerido").max(50),
  COP_Estado: z.enum(estadosColor).optional(),
});

const esquemaEstado = z.object({
  COP_Estado: z.enum(estadosColor, "Estado invalido. Use ACTIVO o INACTIVO"),
});

export const colorRoutes = Router();

colorRoutes.get("/", listarColores);
colorRoutes.get("/:id", obtenerColor);
colorRoutes.post("/", validarCuerpo(esquemaColor), crear);
colorRoutes.put("/:id", validarCuerpo(esquemaColor), actualizar);
colorRoutes.patch("/:id/estado", validarCuerpo(esquemaEstado), cambiarEstado);
colorRoutes.delete("/:id", eliminar);
