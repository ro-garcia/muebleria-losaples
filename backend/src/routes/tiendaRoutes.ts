import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  cambiarEstado,
  crear,
  eliminar,
  listarTiendas,
  obtenerTienda,
} from "../controllers/tiendaController";
import { validarCuerpo } from "../middlewares/validar";

// ─── Esquemas de validación Zod ────────────────────────────────────────────────

// Estados válidos según la restricción CHECK de la base de datos
const estadosTienda = ["ACTIVO", "INACTIVO"] as const;

const esquemaTienda = z.object({
  TIE_Nombre:       z.string().min(1, "El nombre es requerido").max(100),
  TIE_Departamento: z.string().max(80).optional().nullable(),
  TIE_Municipio:    z.string().max(80).optional().nullable(),
  TIE_Zona_Aldea:   z.string().max(80).optional().nullable(),
  TIE_Domicilio:    z.string().max(200).optional().nullable(),
  TIE_Telefono:     z.string().max(25).optional().nullable(),
  TIE_Estado:       z.enum(estadosTienda).optional(),
});

const esquemaEstado = z.object({
  // Zod v4: usa "error" en lugar de "errorMap"
  TIE_Estado: z.enum(estadosTienda, "Estado inválido. Use ACTIVO o INACTIVO"),
});

// ─── Rutas ─────────────────────────────────────────────────────────────────────

export const tiendaRoutes = Router();

// GET    /tiendas         → lista todas las tiendas
tiendaRoutes.get("/", listarTiendas);

// GET    /tiendas/:id     → obtiene una tienda por su ID
tiendaRoutes.get("/:id", obtenerTienda);

// POST   /tiendas         → crea una nueva tienda
tiendaRoutes.post("/", validarCuerpo(esquemaTienda), crear);

// PUT    /tiendas/:id     → actualiza todos los campos de una tienda
tiendaRoutes.put("/:id", validarCuerpo(esquemaTienda), actualizar);

// PATCH  /tiendas/:id/estado → cambia solo el estado (ACTIVO/INACTIVO)
tiendaRoutes.patch("/:id/estado", validarCuerpo(esquemaEstado), cambiarEstado);

// DELETE /tiendas/:id     → borrado lógico (pasa a INACTIVO)
tiendaRoutes.delete("/:id", eliminar);
