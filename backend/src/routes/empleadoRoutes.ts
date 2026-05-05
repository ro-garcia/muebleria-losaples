import { Router } from "express";
import { z } from "zod";

import {
  actualizar,
  crear,
  eliminar,
  listar,
  obtener,
} from "../controllers/empleadoController";
import {
  actualizarCargoHandler,
  actualizarDepartamentoHandler,
  actualizarPuestoHandler,
  cambiarEstadoDepartamentoHandler,
  cambiarEstadoPuestoHandler,
  crearCargoHandler,
  crearDepartamentoHandler,
  crearPuestoHandler,
  eliminarCargoHandler,
  eliminarDepartamentoHandler,
  eliminarPuestoHandler,
  listarCargos,
  listarDepartamentos,
  listarPuestos,
  obtenerCargo,
  obtenerDepartamento,
  obtenerPuesto,
} from "../controllers/empleadoCatalogoController";
import { validarCuerpo } from "../middlewares/validar";

export const empleadoRoutes = Router();

const estadosEmpleado = ["ACTIVO", "INACTIVO"] as const;
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD");

const cargoSchema = z.object({
  CAR_Nombre: z.string().min(1).max(100),
});

const puestoSchema = z.object({
  PUE_Nombre: z.string().min(1).max(100),
  PUE_Estado: z.enum(estadosEmpleado).optional(),
});

const puestoEstadoSchema = z.object({
  PUE_Estado: z.enum(estadosEmpleado),
});

const departamentoSchema = z.object({
  DEP_Nombre: z.string().min(1).max(100),
  DEP_Estado: z.enum(estadosEmpleado).optional(),
});

const departamentoEstadoSchema = z.object({
  DEP_Estado: z.enum(estadosEmpleado),
});

const empleadoSchema = z
  .object({
    PER_Tipo_Documento: z.string().min(1).max(30),
    PER_Nombre: z.string().min(1).max(150),
    PER_Primer_Apellido: z.string().min(1).max(100),
    PER_Segundo_Apellido: z.string().max(100).optional().nullable(),
    PER_Correo: z.string().email().max(150).optional().nullable(),
    PER_Telefono: z.string().max(25).optional().nullable(),
    PER_Pais: z.string().max(80).optional().nullable(),
    PER_Departamento: z.string().max(80).optional().nullable(),
    PER_Municipio: z.string().max(80).optional().nullable(),
    PER_Zona_Aldea: z.string().max(80).optional().nullable(),
    PER_Domicilio: z.string().max(200).optional().nullable(),
    EMP_Tipo_Contrato: z.string().min(1).max(80),
    EMP_Estado: z.enum(estadosEmpleado),
    CAR_Cargo: z.coerce.number().int().positive(),
    PUE_Puesto: z.coerce.number().int().positive(),
    DEP_Departamento: z.coerce.number().int().positive(),
    DEM_Fecha_Inicio: dateSchema,
    DEM_Fecha_Fin: dateSchema.optional().nullable(),
    DEM_Salario: z.coerce.number().min(0),
    DEM_Estado: z.enum(estadosEmpleado),
  })
  .superRefine((data, ctx) => {
    if (data.DEM_Fecha_Fin && data.DEM_Fecha_Fin < data.DEM_Fecha_Inicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DEM_Fecha_Fin"],
        message: "La fecha fin no puede ser menor que la fecha inicio",
      });
    }
  });

empleadoRoutes.get("/", listar);
empleadoRoutes.post("/", validarCuerpo(empleadoSchema), crear);

empleadoRoutes.get("/catalogos/cargos", listarCargos);
empleadoRoutes.get("/catalogos/cargos/:id", obtenerCargo);
empleadoRoutes.post("/catalogos/cargos", validarCuerpo(cargoSchema), crearCargoHandler);
empleadoRoutes.put(
  "/catalogos/cargos/:id",
  validarCuerpo(cargoSchema),
  actualizarCargoHandler,
);
empleadoRoutes.delete("/catalogos/cargos/:id", eliminarCargoHandler);

empleadoRoutes.get("/catalogos/puestos", listarPuestos);
empleadoRoutes.get("/catalogos/puestos/:id", obtenerPuesto);
empleadoRoutes.post(
  "/catalogos/puestos",
  validarCuerpo(puestoSchema),
  crearPuestoHandler,
);
empleadoRoutes.put(
  "/catalogos/puestos/:id",
  validarCuerpo(puestoSchema),
  actualizarPuestoHandler,
);
empleadoRoutes.patch(
  "/catalogos/puestos/:id/estado",
  validarCuerpo(puestoEstadoSchema),
  cambiarEstadoPuestoHandler,
);
empleadoRoutes.delete("/catalogos/puestos/:id", eliminarPuestoHandler);

empleadoRoutes.get("/catalogos/departamentos", listarDepartamentos);
empleadoRoutes.get("/catalogos/departamentos/:id", obtenerDepartamento);
empleadoRoutes.post(
  "/catalogos/departamentos",
  validarCuerpo(departamentoSchema),
  crearDepartamentoHandler,
);
empleadoRoutes.put(
  "/catalogos/departamentos/:id",
  validarCuerpo(departamentoSchema),
  actualizarDepartamentoHandler,
);
empleadoRoutes.patch(
  "/catalogos/departamentos/:id/estado",
  validarCuerpo(departamentoEstadoSchema),
  cambiarEstadoDepartamentoHandler,
);
empleadoRoutes.delete(
  "/catalogos/departamentos/:id",
  eliminarDepartamentoHandler,
);

empleadoRoutes.get("/:id", obtener);
empleadoRoutes.put("/:id", validarCuerpo(empleadoSchema), actualizar);
empleadoRoutes.delete("/:id", eliminar);
