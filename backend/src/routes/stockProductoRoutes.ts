import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  crear,
  eliminar,
  listarStock,
  obtenerStock,
} from "../controllers/stockProductoController";
import { validarCuerpo } from "../middlewares/validar";

const schema = z
  .object({
    ALM_almacen: z.number().int().positive(),
    PRO_Producto: z.number().int().positive(),
    STP_Cantidad: z.number().min(0),
    STP_Stock_Minimo: z.number().min(0).optional().nullable(),
    STP_Stock_Maximo: z.number().min(0).optional().nullable(),
  })
  .refine(
    (data) =>
      data.STP_Stock_Minimo == null ||
      data.STP_Stock_Maximo == null ||
      data.STP_Stock_Minimo <= data.STP_Stock_Maximo,
    {
      path: ["STP_Stock_Minimo"],
      message: "El stock minimo no puede ser mayor al stock maximo",
    },
  );

export const stockProductoRoutes = Router();

stockProductoRoutes.get("/", listarStock);
stockProductoRoutes.get("/:id", obtenerStock);
stockProductoRoutes.post("/", validarCuerpo(schema), crear);
stockProductoRoutes.put("/:id", validarCuerpo(schema), actualizar);
stockProductoRoutes.delete("/:id", eliminar);
