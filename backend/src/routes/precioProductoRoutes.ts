import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  crear,
  eliminar,
  listarPrecios,
  obtenerPrecio,
} from "../controllers/precioProductoController";
import { validarCuerpo } from "../middlewares/validar";

const schema = z.object({
  PRO_Producto: z.number().int().positive(),
  PRE_Precio: z.number().min(0),
  PRE_Fecha_Inicio: z.string().min(1),
  PRE_Fecha_Fin: z.string().optional().nullable(),
});

export const precioProductoRoutes = Router();

precioProductoRoutes.get("/", listarPrecios);
precioProductoRoutes.get("/:id", obtenerPrecio);
precioProductoRoutes.post("/", validarCuerpo(schema), crear);
precioProductoRoutes.put("/:id", validarCuerpo(schema), actualizar);
precioProductoRoutes.delete("/:id", eliminar);
