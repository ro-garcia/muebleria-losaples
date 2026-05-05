import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  compras,
  crear,
  eliminar,
  listar,
  obtener,
} from "../controllers/clienteController";
import { validarCuerpo } from "../middlewares/validar";

export const clienteRoutes = Router();

const clienteCreateSchema = z.object({
  CLI_Primer_Nombre: z.string().min(1).max(100),
  CLI_Segundo_Nombre: z.string().max(100).optional().nullable(),
  CLI_Primer_Apellido: z.string().min(1).max(100),
  CLI_Segundo_Apellido: z.string().max(100).optional().nullable(),
  CLI_Departamento: z.string().max(80).optional().nullable(),
  CLI_Municipio: z.string().max(80).optional().nullable(),
  CLI_Zona_Aldea: z.string().max(80).optional().nullable(),
  CLI_Telefono: z.string().max(25).optional().nullable(),
  CLI_Pais: z.string().max(80).optional().nullable(),
  CLI_Tipo_Documento: z.string().max(30).optional().nullable(),
  CLI_Numero_Documento: z.string().max(50).optional().nullable(),
  CLI_Correo_Electronico: z.string().email().max(150),
  PER_Tipo_Documento: z.string().max(30).optional().nullable(),
  PER_Nombre: z.string().max(150).optional().nullable(),
  PER_Primer_Apellido: z.string().max(100).optional().nullable(),
  PER_Segundo_Apellido: z.string().max(100).optional().nullable(),
  PER_Correo: z.string().email().max(150).optional().nullable(),
  PER_Telefono: z.string().max(25).optional().nullable(),
  PER_Pais: z.string().max(80).optional().nullable(),
  PER_Departamento: z.string().max(80).optional().nullable(),
  PER_Municipio: z.string().max(80).optional().nullable(),
  PER_Zona_Aldea: z.string().max(80).optional().nullable(),
  PER_Domicilio: z.string().max(200).optional().nullable(),
  username: z.string().min(3).max(80).optional().nullable(),
  password: z.string().min(6).max(200),
});

const clienteUpdateSchema = z.object({
  CLI_Primer_Nombre: z.string().min(1).max(100).optional(),
  CLI_Segundo_Nombre: z.string().max(100).optional().nullable(),
  CLI_Primer_Apellido: z.string().min(1).max(100).optional(),
  CLI_Segundo_Apellido: z.string().max(100).optional().nullable(),
  CLI_Departamento: z.string().max(80).optional().nullable(),
  CLI_Municipio: z.string().max(80).optional().nullable(),
  CLI_Zona_Aldea: z.string().max(80).optional().nullable(),
  CLI_Telefono: z.string().max(25).optional().nullable(),
  CLI_Pais: z.string().max(80).optional().nullable(),
  CLI_Tipo_Documento: z.string().max(30).optional().nullable(),
  CLI_Numero_Documento: z.string().max(50).optional().nullable(),
  CLI_Correo_Electronico: z.string().email().max(150).optional(),
  PER_Tipo_Documento: z.string().max(30).optional().nullable(),
  PER_Nombre: z.string().max(150).optional().nullable(),
  PER_Primer_Apellido: z.string().max(100).optional().nullable(),
  PER_Segundo_Apellido: z.string().max(100).optional().nullable(),
  PER_Correo: z.string().email().max(150).optional().nullable(),
  PER_Telefono: z.string().max(25).optional().nullable(),
  PER_Pais: z.string().max(80).optional().nullable(),
  PER_Departamento: z.string().max(80).optional().nullable(),
  PER_Municipio: z.string().max(80).optional().nullable(),
  PER_Zona_Aldea: z.string().max(80).optional().nullable(),
  PER_Domicilio: z.string().max(200).optional().nullable(),
});

clienteRoutes.get("/", listar);
clienteRoutes.post("/", validarCuerpo(clienteCreateSchema), crear);
clienteRoutes.get("/:id", obtener);
clienteRoutes.put("/:id", validarCuerpo(clienteUpdateSchema), actualizar);
clienteRoutes.delete("/:id", eliminar);
clienteRoutes.get("/:id/compras", compras);
