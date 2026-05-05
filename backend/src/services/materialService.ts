import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

type Row = Record<string, unknown>;

export interface NuevoMaterial {
  MAP_Nombre: string;
  MAP_Detalle?: string | null;
}

export class MaterialServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

export const obtenerMateriales = async () => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT MAP_Material_Producto, MAP_Nombre, MAP_Detalle
       FROM   MUE_MATERIAL_PRODUCTO
       ORDER BY MAP_Material_Producto`,
    );

    return resultado.rows ?? [];
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerMaterialPorId = async (id: number) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT MAP_Material_Producto, MAP_Nombre, MAP_Detalle
       FROM   MUE_MATERIAL_PRODUCTO
       WHERE  MAP_Material_Producto = :id`,
      { id },
    );

    const filas = resultado.rows as Row[] | undefined;
    return filas && filas.length > 0 ? filas[0] : null;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const crearMaterial = async (datos: NuevoMaterial) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_MATERIAL_PRODUCTO (MAP_Nombre, MAP_Detalle)
       VALUES (:nombre, :detalle)
       RETURNING MAP_Material_Producto INTO :id`,
      {
        nombre: datos.MAP_Nombre.trim(),
        detalle: datos.MAP_Detalle?.trim() || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );

    const outBinds = resultado.outBinds as { id: number[] };
    return { MAP_Material_Producto: outBinds.id[0] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";

    if (msg.includes("ORA-00001")) {
      throw new MaterialServiceError("Ya existe un material con ese nombre.", 409);
    }

    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const actualizarMaterial = async (id: number, datos: NuevoMaterial) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_MATERIAL_PRODUCTO
       SET    MAP_Nombre = :nombre,
              MAP_Detalle = :detalle
       WHERE  MAP_Material_Producto = :id`,
      {
        nombre: datos.MAP_Nombre.trim(),
        detalle: datos.MAP_Detalle?.trim() || null,
        id,
      },
      { autoCommit: true },
    );

    return resultado.rowsAffected ?? 0;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";

    if (msg.includes("ORA-00001")) {
      throw new MaterialServiceError("Ya existe un material con ese nombre.", 409);
    }

    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const eliminarMaterial = async (id: number) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `DELETE FROM MUE_MATERIAL_PRODUCTO
       WHERE MAP_Material_Producto = :id`,
      { id },
      { autoCommit: true },
    );

    return resultado.rowsAffected ?? 0;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";

    if (msg.includes("ORA-02292")) {
      throw new MaterialServiceError(
        "No se puede eliminar un material con productos asociados.",
        409,
      );
    }

    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};
