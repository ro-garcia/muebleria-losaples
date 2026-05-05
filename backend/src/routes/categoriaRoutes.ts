import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  crear,
  eliminar,
  listarCategorias,
  obtenerCategoria,
} from "../controllers/categoriaController";
import { validarCuerpo } from "../middlewares/validar";

const esquemaCategoria = z.object({
  TIP_Nombre: z.string().min(1, "El nombre es requerido").max(100),
});

export const categoriaRoutes = Router();

categoriaRoutes.get("/", listarCategorias);
categoriaRoutes.get("/:id", obtenerCategoria);
categoriaRoutes.post("/", validarCuerpo(esquemaCategoria), crear);
categoriaRoutes.put("/:id", validarCuerpo(esquemaCategoria), actualizar);
categoriaRoutes.delete("/:id", eliminar);
