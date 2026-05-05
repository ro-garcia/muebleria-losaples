import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  actualizarDetalle,
  agregarDetalle,
  cambiarEstado,
  crear,
  eliminarDetalle,
  finalizar,
  listarOrdenes,
  obtenerDetalle,
  obtenerOrden,
} from "../controllers/ordenProduccionController";
import { validarCuerpo } from "../middlewares/validar";

const ordenSchema = z.object({
  PRO_Producto: z.number().int().positive(),
  EMP_Empleado: z.number().int().positive(),
  OPR_Cantidad_Programada: z.number().positive(),
  OPR_Cantidad_Producida: z.number().min(0).optional().nullable(),
  OPR_Fecha_Inicio: z.string().optional().nullable(),
  OPR_Fecha_Fin: z.string().optional().nullable(),
  OPR_Estado: z.string().max(20).optional(),
});

const detalleSchema = z.object({
  MAP_Materia_Prima: z.number().int().positive(),
  DOP_Cantidad_Requerida: z.number().positive(),
  DOP_Cantidad_Utilizada: z.number().min(0).optional().nullable(),
});

const estadoSchema = z.object({
  OPR_Estado: z.string().min(1).max(20),
});

const finalizarSchema = z.object({
  ALM_almacen: z.number().int().positive().optional(),
});

export const ordenProduccionRoutes = Router();

ordenProduccionRoutes.get("/", listarOrdenes);
ordenProduccionRoutes.get("/:id", obtenerOrden);
ordenProduccionRoutes.get("/:id/detalle", obtenerDetalle);
ordenProduccionRoutes.post("/", validarCuerpo(ordenSchema), crear);
ordenProduccionRoutes.put("/:id", validarCuerpo(ordenSchema), actualizar);
ordenProduccionRoutes.patch("/:id/estado", validarCuerpo(estadoSchema), cambiarEstado);
ordenProduccionRoutes.patch("/:id/finalizar", validarCuerpo(finalizarSchema), finalizar);
ordenProduccionRoutes.post("/:id/detalles", validarCuerpo(detalleSchema), agregarDetalle);
ordenProduccionRoutes.put("/detalles/:detalleId", validarCuerpo(detalleSchema), actualizarDetalle);
ordenProduccionRoutes.delete("/detalles/:detalleId", eliminarDetalle);
