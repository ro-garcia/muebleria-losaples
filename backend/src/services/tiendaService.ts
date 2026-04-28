import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface NuevaTienda {
  TIE_Nombre: string;
  TIE_Departamento?: string | null;
  TIE_Municipio?: string | null;
  TIE_Zona_Aldea?: string | null;
  TIE_Domicilio?: string | null;
  TIE_Telefono?: string | null;
  TIE_Estado?: string;
}

// ─── Obtener todas las tiendas ────────────────────────────────────────────────

export const obtenerTiendas = async () => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT TIE_Tienda, TIE_Nombre, TIE_Departamento, TIE_Municipio,
              TIE_Zona_Aldea, TIE_Domicilio, TIE_Telefono, TIE_Estado
       FROM   MUE_TIENDA
       ORDER BY TIE_Tienda`,
    );
    return resultado.rows;
  } finally {
    // Aislamiento (ACID): la conexión siempre se libera, evitando bloqueos
    if (conexion) await conexion.close();
  }
};

// ─── Obtener tienda por ID ────────────────────────────────────────────────────

export const obtenerTiendaPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT TIE_Tienda, TIE_Nombre, TIE_Departamento, TIE_Municipio,
              TIE_Zona_Aldea, TIE_Domicilio, TIE_Telefono, TIE_Estado
       FROM   MUE_TIENDA
       WHERE  TIE_Tienda = :id`,
      { id },
    );
    const filas = resultado.rows as Record<string, unknown>[];
    return filas.length > 0 ? filas[0] : null;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Crear tienda ─────────────────────────────────────────────────────────────

export const crearTienda = async (datos: NuevaTienda) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_TIENDA
         (TIE_Nombre, TIE_Departamento, TIE_Municipio, TIE_Zona_Aldea,
          TIE_Domicilio, TIE_Telefono, TIE_Estado)
       VALUES
         (:nombre, :departamento, :municipio, :zona,
          :domicilio, :telefono, :estado)
       RETURNING TIE_Tienda INTO :id`,
      {
        nombre:       datos.TIE_Nombre,
        departamento: datos.TIE_Departamento ?? null,
        municipio:    datos.TIE_Municipio    ?? null,
        zona:         datos.TIE_Zona_Aldea   ?? null,
        domicilio:    datos.TIE_Domicilio    ?? null,
        telefono:     datos.TIE_Telefono     ?? null,
        estado:       datos.TIE_Estado       ?? "ACTIVO",
        // RETURNING captura el ID generado por IDENTITY de Oracle
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      // Atomicidad (ACID): confirma si tiene éxito, revierte automáticamente si falla
      { autoCommit: true },
    );
    const outBinds = resultado.outBinds as { id: number[] };
    return { TIE_Tienda: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Actualizar tienda ────────────────────────────────────────────────────────

export const actualizarTienda = async (id: number, datos: NuevaTienda) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_TIENDA SET
         TIE_Nombre       = :nombre,
         TIE_Departamento = :departamento,
         TIE_Municipio    = :municipio,
         TIE_Zona_Aldea   = :zona,
         TIE_Domicilio    = :domicilio,
         TIE_Telefono     = :telefono,
         TIE_Estado       = :estado
       WHERE TIE_Tienda = :id`,
      {
        nombre:       datos.TIE_Nombre,
        departamento: datos.TIE_Departamento ?? null,
        municipio:    datos.TIE_Municipio    ?? null,
        zona:         datos.TIE_Zona_Aldea   ?? null,
        domicilio:    datos.TIE_Domicilio    ?? null,
        telefono:     datos.TIE_Telefono     ?? null,
        estado:       datos.TIE_Estado       ?? "ACTIVO",
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

export const cambiarEstadoTienda = async (id: number, estado: string) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_TIENDA SET TIE_Estado = :estado WHERE TIE_Tienda = :id`,
      { estado, id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Eliminar tienda (borrado lógico) ─────────────────────────────────────────

export const eliminarTienda = async (id: number) => {
  // Borrado lógico: preserva integridad referencial con MUE_ORDENVENTA
  return cambiarEstadoTienda(id, "INACTIVO");
};
