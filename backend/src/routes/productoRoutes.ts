import { Router } from "express";

import {
  actualizar,
  asignarCategoria,
  cambiarEstado,
  crear,
  listarColores,
  listarMateriales,
  listarProductos,
  obtenerProducto,
} from "../controllers/productoController";

export const productoRoutes = Router();

// Rutas específicas antes de las parametrizadas
productoRoutes.get("/materiales", listarMateriales);
productoRoutes.get("/colores",    listarColores);

productoRoutes.get("/",           listarProductos);
productoRoutes.get("/:id",        obtenerProducto);
productoRoutes.post("/",          crear);
productoRoutes.put("/:id",        actualizar);
productoRoutes.patch("/:id/estado",    cambiarEstado);
productoRoutes.patch("/:id/categoria", asignarCategoria);
