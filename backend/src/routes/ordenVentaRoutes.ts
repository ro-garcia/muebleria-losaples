import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  anular,
  cambiarEstado,
  crear,
  listarOrdenesVenta,
  listarPorCliente,
  listarPorTienda,
  obtenerOrdenVenta,
  obtenerOrdenVentaDetalleController,
} from "../controllers/ordenVentaController";
import { validarCuerpo } from "../middlewares/validar";

const estadosOrden = ["ACTIVO", "ANULADO", "FINALIZADO"] as const;

const esquemaOrdenVenta = z.object({
  CLI_Cliente: z.number({ error: "El cliente debe ser un numero" }).int().positive(),
  TIE_Tienda: z.number({ error: "La tienda debe ser un numero" }).int().positive(),
  ODV_Subtotal: z.number({ error: "El subtotal debe ser un numero" }).min(0),
  ODV_Total: z.number({ error: "El total debe ser un numero" }).min(0),
  ODV_Descuento: z.number().min(0).optional(),
  ODV_Impuesto: z.number().min(0).optional(),
  ODV_Estado: z.enum(estadosOrden).optional(),
});

const esquemaEstado = z.object({
  ODV_Estado: z.enum(estadosOrden, "Estado invalido. Use ACTIVO, ANULADO o FINALIZADO"),
});

export const ordenVentaRoutes = Router();

ordenVentaRoutes.get("/", listarOrdenesVenta);
ordenVentaRoutes.get("/cliente/:clienteId", listarPorCliente);
ordenVentaRoutes.get("/tienda/:tiendaId", listarPorTienda);
ordenVentaRoutes.get("/:id/detalle", obtenerOrdenVentaDetalleController);
ordenVentaRoutes.get("/:id", obtenerOrdenVenta);
ordenVentaRoutes.post("/", validarCuerpo(esquemaOrdenVenta), crear);
ordenVentaRoutes.put("/:id", validarCuerpo(esquemaOrdenVenta), actualizar);
ordenVentaRoutes.patch("/:id/estado", validarCuerpo(esquemaEstado), cambiarEstado);
ordenVentaRoutes.delete("/:id", anular);
