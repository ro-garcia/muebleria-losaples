import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

type Row = Record<string, unknown>;

export interface NuevoCargo {
  CAR_Nombre: string;
}

export interface NuevoPuesto {
  PUE_Nombre: string;
  PUE_Estado?: "ACTIVO" | "INACTIVO";
}

export interface NuevoDepartamentoLaboral {
  DEP_Nombre: string;
  DEP_Estado?: "ACTIVO" | "INACTIVO";
}

export class EmpleadoCatalogoServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

const toRows = (rows: unknown) => (rows ?? []) as Row[];

const toRow = (rows: unknown) => {
  const data = rows as Row[] | undefined;
  return data && data.length > 0 ? data[0] : null;
};

const validatePositiveId = (value: number, label: string) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new EmpleadoCatalogoServiceError(`${label} invalido.`, 400);
  }
};

const normalizeState = (value: string | undefined) => value ?? "ACTIVO";

export const obtenerCargos = async () => {
  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `SELECT CAR_Cargo, CAR_Nombre
       FROM MUE_CARGO
       ORDER BY CAR_Nombre`,
    );
    return toRows(result.rows);
  } finally {
    await connection.close();
  }
};

export const obtenerCargoPorId = async (cargoId: number) => {
  validatePositiveId(cargoId, "Cargo");

  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `SELECT CAR_Cargo, CAR_Nombre
       FROM MUE_CARGO
       WHERE CAR_Cargo = :cargoId`,
      { cargoId },
    );
    return toRow(result.rows);
  } finally {
    await connection.close();
  }
};

export const crearCargo = async (payload: NuevoCargo) => {
  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `INSERT INTO MUE_CARGO (
         CAR_Nombre
       ) VALUES (
         :nombre
       )
       RETURNING CAR_Cargo INTO :id`,
      {
        nombre: payload.CAR_Nombre.trim(),
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );

    const outBinds = result.outBinds as { id: number[] };
    return { CAR_Cargo: outBinds.id[0] };
  } finally {
    await connection.close();
  }
};

export const actualizarCargo = async (
  cargoId: number,
  payload: NuevoCargo,
) => {
  validatePositiveId(cargoId, "Cargo");

  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `UPDATE MUE_CARGO
       SET CAR_Nombre = :nombre
       WHERE CAR_Cargo = :cargoId`,
      {
        cargoId,
        nombre: payload.CAR_Nombre.trim(),
      },
      { autoCommit: true },
    );
    return result.rowsAffected ?? 0;
  } finally {
    await connection.close();
  }
};

export const eliminarCargo = async (cargoId: number) => {
  validatePositiveId(cargoId, "Cargo");

  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `DELETE FROM MUE_CARGO
       WHERE CAR_Cargo = :cargoId`,
      { cargoId },
      { autoCommit: true },
    );
    return result.rowsAffected ?? 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("ORA-02292")) {
      throw new EmpleadoCatalogoServiceError(
        "No se puede eliminar un cargo con empleados asociados.",
        409,
      );
    }
    throw error;
  } finally {
    await connection.close();
  }
};

export const obtenerPuestos = async (soloActivos = true) => {
  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `SELECT PUE_Puesto, PUE_Nombre, PUE_Estado
       FROM MUE_PUESTO
       WHERE (:soloActivos = 0 OR PUE_Estado = 'ACTIVO')
       ORDER BY PUE_Nombre`,
      { soloActivos: soloActivos ? 1 : 0 },
    );
    return toRows(result.rows);
  } finally {
    await connection.close();
  }
};

export const obtenerPuestoPorId = async (puestoId: number) => {
  validatePositiveId(puestoId, "Puesto");

  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `SELECT PUE_Puesto, PUE_Nombre, PUE_Estado
       FROM MUE_PUESTO
       WHERE PUE_Puesto = :puestoId`,
      { puestoId },
    );
    return toRow(result.rows);
  } finally {
    await connection.close();
  }
};

export const crearPuesto = async (payload: NuevoPuesto) => {
  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `INSERT INTO MUE_PUESTO (
         PUE_Nombre,
         PUE_Estado
       ) VALUES (
         :nombre,
         :estado
       )
       RETURNING PUE_Puesto INTO :id`,
      {
        nombre: payload.PUE_Nombre.trim(),
        estado: normalizeState(payload.PUE_Estado),
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );
    const outBinds = result.outBinds as { id: number[] };
    return { PUE_Puesto: outBinds.id[0] };
  } finally {
    await connection.close();
  }
};

export const actualizarPuesto = async (
  puestoId: number,
  payload: NuevoPuesto,
) => {
  validatePositiveId(puestoId, "Puesto");

  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `UPDATE MUE_PUESTO
       SET PUE_Nombre = :nombre,
           PUE_Estado = :estado
       WHERE PUE_Puesto = :puestoId`,
      {
        puestoId,
        nombre: payload.PUE_Nombre.trim(),
        estado: normalizeState(payload.PUE_Estado),
      },
      { autoCommit: true },
    );
    return result.rowsAffected ?? 0;
  } finally {
    await connection.close();
  }
};

export const cambiarEstadoPuesto = async (
  puestoId: number,
  estado: "ACTIVO" | "INACTIVO",
) => {
  validatePositiveId(puestoId, "Puesto");

  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `UPDATE MUE_PUESTO
       SET PUE_Estado = :estado
       WHERE PUE_Puesto = :puestoId`,
      { puestoId, estado },
      { autoCommit: true },
    );
    return result.rowsAffected ?? 0;
  } finally {
    await connection.close();
  }
};

export const eliminarPuesto = async (puestoId: number) =>
  cambiarEstadoPuesto(puestoId, "INACTIVO");

export const obtenerDepartamentosLaborales = async (soloActivos = true) => {
  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `SELECT DEP_Departamento, DEP_Nombre, DEP_Estado
       FROM MUE_DEPARTAMENTO
       WHERE (:soloActivos = 0 OR DEP_Estado = 'ACTIVO')
       ORDER BY DEP_Nombre`,
      { soloActivos: soloActivos ? 1 : 0 },
    );
    return toRows(result.rows);
  } finally {
    await connection.close();
  }
};

export const obtenerDepartamentoLaboralPorId = async (departamentoId: number) => {
  validatePositiveId(departamentoId, "Departamento laboral");

  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `SELECT DEP_Departamento, DEP_Nombre, DEP_Estado
       FROM MUE_DEPARTAMENTO
       WHERE DEP_Departamento = :departamentoId`,
      { departamentoId },
    );
    return toRow(result.rows);
  } finally {
    await connection.close();
  }
};

export const crearDepartamentoLaboral = async (
  payload: NuevoDepartamentoLaboral,
) => {
  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `INSERT INTO MUE_DEPARTAMENTO (
         DEP_Nombre,
         DEP_Estado
       ) VALUES (
         :nombre,
         :estado
       )
       RETURNING DEP_Departamento INTO :id`,
      {
        nombre: payload.DEP_Nombre.trim(),
        estado: normalizeState(payload.DEP_Estado),
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );
    const outBinds = result.outBinds as { id: number[] };
    return { DEP_Departamento: outBinds.id[0] };
  } finally {
    await connection.close();
  }
};

export const actualizarDepartamentoLaboral = async (
  departamentoId: number,
  payload: NuevoDepartamentoLaboral,
) => {
  validatePositiveId(departamentoId, "Departamento laboral");

  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `UPDATE MUE_DEPARTAMENTO
       SET DEP_Nombre = :nombre,
           DEP_Estado = :estado
       WHERE DEP_Departamento = :departamentoId`,
      {
        departamentoId,
        nombre: payload.DEP_Nombre.trim(),
        estado: normalizeState(payload.DEP_Estado),
      },
      { autoCommit: true },
    );
    return result.rowsAffected ?? 0;
  } finally {
    await connection.close();
  }
};

export const cambiarEstadoDepartamentoLaboral = async (
  departamentoId: number,
  estado: "ACTIVO" | "INACTIVO",
) => {
  validatePositiveId(departamentoId, "Departamento laboral");

  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `UPDATE MUE_DEPARTAMENTO
       SET DEP_Estado = :estado
       WHERE DEP_Departamento = :departamentoId`,
      { departamentoId, estado },
      { autoCommit: true },
    );
    return result.rowsAffected ?? 0;
  } finally {
    await connection.close();
  }
};

export const eliminarDepartamentoLaboral = async (departamentoId: number) =>
  cambiarEstadoDepartamentoLaboral(departamentoId, "INACTIVO");
