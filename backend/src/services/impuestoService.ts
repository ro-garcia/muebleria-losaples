import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface NuevoImpuesto {
  IMP_Nombre: string;
  IMP_Porcentaje: number;
  IMP_Estado?: string;
}

// ─── Obtener todos los impuestos ──────────────────────────────────────────────

export const obtenerImpuestos = async () => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT IMP_Impuesto, IMP_Nombre, IMP_Porcentaje, IMP_Estado
       FROM   MUE_IMPUESTO
       ORDER BY IMP_Impuesto`,
    );
    return resultado.rows;
  } finally {
    // Aislamiento (ACID): conexión liberada siempre, independientemente del resultado
    if (conexion) await conexion.close();
  }
};

// ─── Obtener impuesto por ID ──────────────────────────────────────────────────

export const obtenerImpuestoPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT IMP_Impuesto, IMP_Nombre, IMP_Porcentaje, IMP_Estado
       FROM   MUE_IMPUESTO
       WHERE  IMP_Impuesto = :id`,
      { id },
    );
    const filas = resultado.rows as Record<string, unknown>[];
    return filas.length > 0 ? filas[0] : null;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Crear impuesto ───────────────────────────────────────────────────────────

export const crearImpuesto = async (datos: NuevoImpuesto) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_IMPUESTO (IMP_Nombre, IMP_Porcentaje, IMP_Estado)
       VALUES (:nombre, :porcentaje, :estado)
       RETURNING IMP_Impuesto INTO :id`,
      {
        nombre:     datos.IMP_Nombre,
        porcentaje: datos.IMP_Porcentaje,
        estado:     datos.IMP_Estado ?? "ACTIVO",
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      // Atomicidad (ACID): Oracle hace COMMIT si tiene éxito, ROLLBACK si falla
      { autoCommit: true },
    );
    const outBinds = resultado.outBinds as { id: number[] };
    return { IMP_Impuesto: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Actualizar impuesto ──────────────────────────────────────────────────────

export const actualizarImpuesto = async (id: number, datos: NuevoImpuesto) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_IMPUESTO SET
         IMP_Nombre      = :nombre,
         IMP_Porcentaje  = :porcentaje,
         IMP_Estado      = :estado
       WHERE IMP_Impuesto = :id`,
      {
        nombre:     datos.IMP_Nombre,
        porcentaje: datos.IMP_Porcentaje,
        estado:     datos.IMP_Estado ?? "ACTIVO",
        id,
      },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Cambiar estado ───────────────────────────────────────────────────────────

export const cambiarEstadoImpuesto = async (id: number, estado: string) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_IMPUESTO SET IMP_Estado = :estado WHERE IMP_Impuesto = :id`,
      { estado, id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Eliminar impuesto (borrado lógico) ───────────────────────────────────────

export const eliminarImpuesto = async (id: number) => {
  // Borrado lógico: preserva integridad referencial con MUE_DETALLE_FACTURA
  return cambiarEstadoImpuesto(id, "INACTIVO");
};
