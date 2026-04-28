import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface NuevoMetodoPago {
  MET_Nombre: string;
  MET_Estado?: string;
}

// ─── Obtener todos los métodos de pago ────────────────────────────────────────

export const obtenerMetodosPago = async () => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT MET_Metodo_Pago, MET_Nombre, MET_Estado
       FROM   MUE_METODOPAGO
       ORDER BY MET_Metodo_Pago`,
    );
    return resultado.rows;
  } finally {
    // Aislamiento (ACID): la conexión siempre se cierra para liberar recursos
    if (conexion) await conexion.close();
  }
};

// ─── Obtener método de pago por ID ────────────────────────────────────────────

export const obtenerMetodoPagoPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT MET_Metodo_Pago, MET_Nombre, MET_Estado
       FROM   MUE_METODOPAGO
       WHERE  MET_Metodo_Pago = :id`,
      { id },
    );
    const filas = resultado.rows as Record<string, unknown>[];
    return filas.length > 0 ? filas[0] : null;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Crear método de pago ─────────────────────────────────────────────────────

export const crearMetodoPago = async (datos: NuevoMetodoPago) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_METODOPAGO (MET_Nombre, MET_Estado)
       VALUES (:nombre, :estado)
       RETURNING MET_Metodo_Pago INTO :id`,
      {
        nombre: datos.MET_Nombre,
        estado: datos.MET_Estado ?? "ACTIVO",
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      // Atomicidad (ACID): COMMIT automático si la operación tiene éxito
      { autoCommit: true },
    );
    const outBinds = resultado.outBinds as { id: number[] };
    return { MET_Metodo_Pago: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Actualizar método de pago ────────────────────────────────────────────────

export const actualizarMetodoPago = async (
  id: number,
  datos: NuevoMetodoPago,
) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_METODOPAGO SET
         MET_Nombre  = :nombre,
         MET_Estado  = :estado
       WHERE MET_Metodo_Pago = :id`,
      {
        nombre: datos.MET_Nombre,
        estado: datos.MET_Estado ?? "ACTIVO",
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

export const cambiarEstadoMetodoPago = async (id: number, estado: string) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_METODOPAGO SET MET_Estado = :estado
       WHERE  MET_Metodo_Pago = :id`,
      { estado, id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Eliminar método de pago (borrado lógico) ─────────────────────────────────

export const eliminarMetodoPago = async (id: number) => {
  // Borrado lógico: preserva integridad referencial con MUE_FACTURA
  return cambiarEstadoMetodoPago(id, "INACTIVO");
};
