import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

export interface NuevaCategoria {
  TIP_Nombre: string;
}

type Row = Record<string, unknown>;

export class CategoriaServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

export const obtenerCategorias = async () => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT TIP_Tipo_Producto, TIP_Nombre
       FROM   MUE_TIPO_PRODUCTO
       ORDER BY TIP_Nombre`,
    );

    return resultado.rows ?? [];
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerCategoriaPorId = async (id: number) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT TIP_Tipo_Producto, TIP_Nombre
       FROM   MUE_TIPO_PRODUCTO
       WHERE  TIP_Tipo_Producto = :id`,
      { id },
    );

    const filas = resultado.rows as Row[] | undefined;
    return filas && filas.length > 0 ? filas[0] : null;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const crearCategoria = async (datos: NuevaCategoria) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_TIPO_PRODUCTO (TIP_Nombre)
       VALUES (:nombre)
       RETURNING TIP_Tipo_Producto INTO :id`,
      {
        nombre: datos.TIP_Nombre,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );

    const outBinds = resultado.outBinds as { id: number[] };
    return { TIP_Tipo_Producto: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

export const actualizarCategoria = async (
  id: number,
  datos: NuevaCategoria,
) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_TIPO_PRODUCTO
       SET    TIP_Nombre = :nombre
       WHERE  TIP_Tipo_Producto = :id`,
      {
        nombre: datos.TIP_Nombre,
        id,
      },
      { autoCommit: true },
    );

    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const eliminarCategoria = async (id: number) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `DELETE FROM MUE_TIPO_PRODUCTO
       WHERE TIP_Tipo_Producto = :id`,
      { id },
      { autoCommit: true },
    );

    return resultado.rowsAffected ?? 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("ORA-02292")) {
      throw new CategoriaServiceError(
        "No se puede eliminar una categoria con productos asociados",
        409,
      );
    }

    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};
