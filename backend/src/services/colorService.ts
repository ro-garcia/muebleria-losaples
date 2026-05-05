import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

type Row = Record<string, unknown>;

export interface NuevoColor {
  COP_Nombre: string;
  COP_Estado?: string;
}

export class ColorServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

export const obtenerColores = async () => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT COP_Color_Producto, COP_Nombre, COP_Estado
       FROM   MUE_COLOR_PRODUCTO
       ORDER BY COP_Color_Producto`,
    );

    return resultado.rows ?? [];
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerColorPorId = async (id: number) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT COP_Color_Producto, COP_Nombre, COP_Estado
       FROM   MUE_COLOR_PRODUCTO
       WHERE  COP_Color_Producto = :id`,
      { id },
    );

    const filas = resultado.rows as Row[] | undefined;
    return filas && filas.length > 0 ? filas[0] : null;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const crearColor = async (datos: NuevoColor) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_COLOR_PRODUCTO (COP_Nombre, COP_Estado)
       VALUES (:nombre, :estado)
       RETURNING COP_Color_Producto INTO :id`,
      {
        nombre: datos.COP_Nombre.trim(),
        estado: datos.COP_Estado ?? "ACTIVO",
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );

    const outBinds = resultado.outBinds as { id: number[] };
    return { COP_Color_Producto: outBinds.id[0] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";

    if (msg.includes("ORA-00001")) {
      throw new ColorServiceError("Ya existe un color con ese nombre.", 409);
    }

    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const actualizarColor = async (id: number, datos: NuevoColor) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_COLOR_PRODUCTO
       SET    COP_Nombre = :nombre,
              COP_Estado = :estado
       WHERE  COP_Color_Producto = :id`,
      {
        nombre: datos.COP_Nombre.trim(),
        estado: datos.COP_Estado ?? "ACTIVO",
        id,
      },
      { autoCommit: true },
    );

    return resultado.rowsAffected ?? 0;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";

    if (msg.includes("ORA-00001")) {
      throw new ColorServiceError("Ya existe un color con ese nombre.", 409);
    }

    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const cambiarEstadoColor = async (id: number, estado: string) => {
  if (!["ACTIVO", "INACTIVO"].includes(estado)) {
    throw new ColorServiceError(
      "Estado invalido. Debe ser ACTIVO o INACTIVO.",
      400,
    );
  }

  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_COLOR_PRODUCTO
       SET    COP_Estado = :estado
       WHERE  COP_Color_Producto = :id`,
      { estado, id },
      { autoCommit: true },
    );

    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const eliminarColor = async (id: number) => {
  return cambiarEstadoColor(id, "INACTIVO");
};
