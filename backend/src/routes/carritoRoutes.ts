import { Router } from "express";
import { z } from "zod";

import {
  actualizarItem,
  agregarItem,
  agregarItemActivo,
  crear,
  eliminarItem,
  finalizar,
  obtenerPorCliente,
  obtenerPorId,
  vaciar,
} from "../controllers/carritoController";
import { validarCuerpo } from "../middlewares/validar";

const esquemaCrearCarrito = z.object({
  CLI_Cliente: z
    .number({ error: "El cliente debe ser un numero" })
    .int()
    .positive("El ID de cliente debe ser positivo"),
  TIE_Tienda: z
    .number({ error: "La tienda debe ser un numero" })
    .int()
    .positive("El ID de tienda debe ser positivo"),
});

const esquemaAgregarItemActivo = esquemaCrearCarrito.extend({
  PRO_Producto: z
    .number({ error: "El producto debe ser un numero" })
    .int()
    .positive("El ID de producto debe ser positivo"),
  DOV_Cantidad: z
    .number({ error: "La cantidad debe ser un numero" })
    .positive("La cantidad debe ser mayor a 0"),
  DOV_Descuento: z.number().min(0).optional(),
});

const esquemaAgregarItem = z.object({
  PRO_Producto: z
    .number({ error: "El producto debe ser un numero" })
    .int()
    .positive("El ID de producto debe ser positivo"),
  DOV_Cantidad: z
    .number({ error: "La cantidad debe ser un numero" })
    .positive("La cantidad debe ser mayor a 0"),
  DOV_Descuento: z.number().min(0).optional(),
});

const esquemaActualizarItem = z.object({
  DOV_Cantidad: z
    .number({ error: "La cantidad debe ser un numero" })
    .positive("La cantidad debe ser mayor a 0"),
  DOV_Descuento: z.number().min(0).optional(),
});

export const carritoRoutes = Router();

// GET /carrito/cliente/:clienteId -> carrito activo del cliente
carritoRoutes.get("/cliente/:clienteId", obtenerPorCliente);

// GET /carrito/:ordenId -> obtiene un carrito/orden por ID
carritoRoutes.get("/:ordenId", obtenerPorId);

// POST /carrito -> crea o recupera el carrito activo del cliente
carritoRoutes.post("/", validarCuerpo(esquemaCrearCarrito), crear);

// POST /carrito/items -> agrega a carrito activo, creandolo si no existe
carritoRoutes.post(
  "/items",
  validarCuerpo(esquemaAgregarItemActivo),
  agregarItemActivo,
);

// POST /carrito/:ordenId/items -> agrega un producto a un carrito existente
carritoRoutes.post("/:ordenId/items", validarCuerpo(esquemaAgregarItem), agregarItem);

// PUT /carrito/items/:detalleId -> actualiza cantidad/descuento de un item
carritoRoutes.put(
  "/items/:detalleId",
  validarCuerpo(esquemaActualizarItem),
  actualizarItem,
);

// DELETE /carrito/items/:detalleId -> elimina un item del carrito
carritoRoutes.delete("/items/:detalleId", eliminarItem);

// DELETE /carrito/:ordenId -> vacia el carrito
carritoRoutes.delete("/:ordenId", vaciar);

// PATCH /carrito/:ordenId/finalizar -> cambia la orden a FINALIZADO
carritoRoutes.patch("/:ordenId/finalizar", finalizar);
