import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  cambiarEstado,
  crear,
  eliminar,
  listarAlmacenes,
  obtenerAlmacen,
} from "../controllers/almacenController";
import { validarCuerpo } from "../middlewares/validar";

const schema = z.object({
  ALM_Nombre: z.string().min(1, "El nombre del almacen es requerido"),
  ALM_Departamento: z.string().max(80).optional().nullable(),
  ALM_Municipio: z.string().max(80).optional().nullable(),
  ALM_Zona_Aldea: z.string().max(80).optional().nullable(),
  ALM_Domicilio: z.string().max(200).optional().nullable(),
  ALM_Telefono: z.string().max(25).optional().nullable(),
  ALM_Estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});

const estadoSchema = z.object({
  ALM_Estado: z.enum(["ACTIVO", "INACTIVO"]),
});

export const almacenRoutes = Router();

almacenRoutes.get("/", listarAlmacenes);
almacenRoutes.get("/:id", obtenerAlmacen);
almacenRoutes.post("/", validarCuerpo(schema), crear);
almacenRoutes.put("/:id", validarCuerpo(schema), actualizar);
almacenRoutes.patch("/:id/estado", validarCuerpo(estadoSchema), cambiarEstado);
almacenRoutes.delete("/:id", eliminar);
