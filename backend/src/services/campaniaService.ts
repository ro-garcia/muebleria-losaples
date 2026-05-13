import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface NuevaCampania {
  COM_Nombre: string;
  TIE_Tiempo?: string | null;
  COM_Estado?: string;
  COM_Fecha_Inicio?: string | null;
  COM_Fecha_Final?: string | null;
  REG_Regla_Promocion: number;
}

export interface NuevoProductoCampania {
  COM_Compaign: number;
  PRO_Producto: number;
  CMP_Tipo_Descuento?: string | null;
  CMP_Valor_Descuento?: number | null;
  CMP_Estado?: string;
}

// ─── Obtener todas las campañas ───────────────────────────────────────────────

export const obtenerCampanias = async () => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT c.COM_Compaign,
              c.COM_Nombre,
              c.TIE_Tiempo,
              c.COM_Estado,
              c.COM_Fecha_Inicio,
              c.COM_Fecha_Final,
              c.REG_Regla_Promocion,
              r.REG_Tipo,
              r.REG_Valor,
              r.REG_Estado
       FROM   MUE_COMPAIGN c
              INNER JOIN MUE_REGLA_PROMOCION r
                      ON r.REG_Regla_Promocion = c.REG_Regla_Promocion
       ORDER BY c.COM_Compaign`,
    );
    return resultado.rows;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Obtener campaña por ID ──────────────────────────────────────────────────

export const obtenerCampaniaPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT c.COM_Compaign,
              c.COM_Nombre,
              c.TIE_Tiempo,
              c.COM_Estado,
              c.COM_Fecha_Inicio,
              c.COM_Fecha_Final,
              c.REG_Regla_Promocion,
              r.REG_Tipo,
              r.REG_Valor,
              r.REG_Estado
       FROM   MUE_COMPAIGN c
              INNER JOIN MUE_REGLA_PROMOCION r
                      ON r.REG_Regla_Promocion = c.REG_Regla_Promocion
       WHERE  c.COM_Compaign = :id`,
      { id },
    );

    const filas = resultado.rows as Record<string, unknown>[];
    return filas.length > 0 ? filas[0] : null;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Obtener productos de una campaña ─────────────────────────────────────────

export const obtenerProductosPorCampania = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT cp.CMP_Compaign_Producto,
              cp.COM_Compaign,
              cp.PRO_Producto,
              p.PRO_Codigo,
              p.PRO_Nombre,
              cp.CMP_Tipo_Descuento,
              cp.CMP_Valor_Descuento,
              cp.CMP_Estado
       FROM   MUE_COMPAIGN_PRODUCTO cp
              INNER JOIN MUE_PRODUCTO p
                      ON p.PRO_Producto = cp.PRO_Producto
       WHERE  cp.COM_Compaign = :id
       ORDER BY cp.CMP_Compaign_Producto`,
      { id },
    );
    return resultado.rows;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Crear campaña ────────────────────────────────────────────────────────────

export const crearCampania = async (datos: NuevaCampania) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_COMPAIGN
         (COM_Nombre, TIE_Tiempo, COM_Estado, COM_Fecha_Inicio,
          COM_Fecha_Final, REG_Regla_Promocion)
       VALUES
         (:nombre, :tiempo, :estado,
          CASE WHEN :fechaInicio IS NULL THEN NULL ELSE TO_DATE(:fechaInicio, 'YYYY-MM-DD') END,
          CASE WHEN :fechaFinal IS NULL THEN NULL ELSE TO_DATE(:fechaFinal, 'YYYY-MM-DD') END,
          :reglaPromocion)
       RETURNING COM_Compaign INTO :id`,
      {
        nombre:          datos.COM_Nombre,
        tiempo:          datos.TIE_Tiempo ?? null,
        estado:          datos.COM_Estado ?? "ACTIVO",
        fechaInicio:     datos.COM_Fecha_Inicio ?? null,
        fechaFinal:      datos.COM_Fecha_Final ?? null,
        reglaPromocion:  datos.REG_Regla_Promocion,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );

    const outBinds = resultado.outBinds as { id: number[] };
    return { COM_Compaign: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Actualizar campaña ───────────────────────────────────────────────────────

export const actualizarCampania = async (id: number, datos: NuevaCampania) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_COMPAIGN SET
         COM_Nombre          = :nombre,
         TIE_Tiempo          = :tiempo,
         COM_Estado          = :estado,
         COM_Fecha_Inicio    = CASE WHEN :fechaInicio IS NULL THEN NULL ELSE TO_DATE(:fechaInicio, 'YYYY-MM-DD') END,
         COM_Fecha_Final     = CASE WHEN :fechaFinal IS NULL THEN NULL ELSE TO_DATE(:fechaFinal, 'YYYY-MM-DD') END,
         REG_Regla_Promocion = :reglaPromocion
       WHERE COM_Compaign = :id`,
      {
        nombre:         datos.COM_Nombre,
        tiempo:         datos.TIE_Tiempo ?? null,
        estado:         datos.COM_Estado ?? "ACTIVO",
        fechaInicio:    datos.COM_Fecha_Inicio ?? null,
        fechaFinal:     datos.COM_Fecha_Final ?? null,
        reglaPromocion: datos.REG_Regla_Promocion,
        id,
      },
      { autoCommit: true },
    );

    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Cambiar estado de campaña ────────────────────────────────────────────────

export const cambiarEstadoCampania = async (id: number, estado: string) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_COMPAIGN SET COM_Estado = :estado WHERE COM_Compaign = :id`,
      { estado, id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Eliminar campaña (borrado lógico) ────────────────────────────────────────

export const eliminarCampania = async (id: number) => {
  return cambiarEstadoCampania(id, "INACTIVO");
};

// ─── Agregar producto a campaña ───────────────────────────────────────────────

export const agregarProductoCampania = async (datos: NuevoProductoCampania) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_COMPAIGN_PRODUCTO
         (COM_Compaign, PRO_Producto, CMP_Tipo_Descuento,
          CMP_Valor_Descuento, CMP_Estado)
       VALUES
         (:campania, :producto, :tipoDescuento, :valorDescuento, :estado)
       RETURNING CMP_Compaign_Producto INTO :id`,
      {
        campania:       datos.COM_Compaign,
        producto:       datos.PRO_Producto,
        tipoDescuento:  datos.CMP_Tipo_Descuento ?? null,
        valorDescuento: datos.CMP_Valor_Descuento ?? null,
        estado:         datos.CMP_Estado ?? "ACTIVO",
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );

    const outBinds = resultado.outBinds as { id: number[] };
    return { CMP_Compaign_Producto: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Cambiar estado de producto en campaña ────────────────────────────────────

export const cambiarEstadoProductoCampania = async (id: number, estado: string) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_COMPAIGN_PRODUCTO
       SET    CMP_Estado = :estado
       WHERE  CMP_Compaign_Producto = :id`,
      { estado, id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Eliminar producto de campaña (borrado lógico) ────────────────────────────

export const eliminarProductoCampania = async (id: number) => {
  return cambiarEstadoProductoCampania(id, "INACTIVO");
};


export const obtenerDetalleCampanias = async () => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();

    const resultado = await conexion.execute(
      `SELECT
          c.COM_Compaign,
          c.COM_Nombre,
          c.TIE_Tiempo,
          c.COM_Estado,
          c.COM_Fecha_Inicio,
          c.COM_Fecha_Final,
          r.REG_Tipo,
          r.REG_Valor,
          cp.CMP_Compaign_Producto,
          cp.CMP_Tipo_Descuento,
          cp.CMP_Valor_Descuento,
          cp.CMP_Estado,
          p.PRO_Producto,
          p.PRO_Codigo,
          p.PRO_Nombre
       FROM MUE_COMPAIGN c
       INNER JOIN MUE_REGLA_PROMOCION r
          ON r.REG_Regla_Promocion = c.REG_Regla_Promocion
       INNER JOIN MUE_COMPAIGN_PRODUCTO cp
          ON cp.COM_Compaign = c.COM_Compaign
       INNER JOIN MUE_PRODUCTO p
          ON p.PRO_Producto = cp.PRO_Producto
       WHERE c.COM_Estado = 'ACTIVO'
       ORDER BY c.COM_Compaign, p.PRO_Nombre`
    );

    return resultado.rows;
  } finally {
    if (conexion) await conexion.close();
  }
};