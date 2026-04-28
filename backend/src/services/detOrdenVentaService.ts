import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface NuevoDetOrdenVenta {
  ODV_Orden_Venta: number;
  PRO_Producto: number;
  DOV_Cantidad: number;
  DOV_Precio_Unitario: number;
  DOV_Subtotal: number;
  DOV_Descuento?: number;
}

// ─── Obtener detalles por orden de venta ──────────────────────────────────────

export const obtenerDetallesPorOrden = async (ordenId: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT DOV_Det_Orden_Venta, ODV_Orden_Venta, PRO_Producto,
              DOV_Cantidad, DOV_Precio_Unitario, DOV_Descuento, DOV_Subtotal
       FROM   MUE_DETORDENVENTA
       WHERE  ODV_Orden_Venta = :ordenId
       ORDER BY DOV_Det_Orden_Venta`,
      { ordenId },
    );
    return resultado.rows;
  } finally {
    // Aislamiento (ACID): la conexión siempre se libera
    if (conexion) await conexion.close();
  }
};

// ─── Obtener detalle por ID ───────────────────────────────────────────────────

export const obtenerDetOrdenVentaPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT DOV_Det_Orden_Venta, ODV_Orden_Venta, PRO_Producto,
              DOV_Cantidad, DOV_Precio_Unitario, DOV_Descuento, DOV_Subtotal
       FROM   MUE_DETORDENVENTA
       WHERE  DOV_Det_Orden_Venta = :id`,
      { id },
    );
    const filas = resultado.rows as Record<string, unknown>[];
    return filas.length > 0 ? filas[0] : null;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Crear detalle de orden de venta ──────────────────────────────────────────

export const crearDetOrdenVenta = async (datos: NuevoDetOrdenVenta) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_DETORDENVENTA
         (ODV_Orden_Venta, PRO_Producto, DOV_Cantidad,
          DOV_Precio_Unitario, DOV_Descuento, DOV_Subtotal)
       VALUES
         (:orden, :producto, :cantidad,
          :precioUnitario, :descuento, :subtotal)
       RETURNING DOV_Det_Orden_Venta INTO :id`,
      {
        orden:          datos.ODV_Orden_Venta,
        producto:       datos.PRO_Producto,
        cantidad:       datos.DOV_Cantidad,
        precioUnitario: datos.DOV_Precio_Unitario,
        descuento:      datos.DOV_Descuento ?? 0,
        subtotal:       datos.DOV_Subtotal,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      // Atomicidad (ACID): COMMIT si éxito, ROLLBACK automático si falla
      { autoCommit: true },
    );
    const outBinds = resultado.outBinds as { id: number[] };
    return { DOV_Det_Orden_Venta: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Actualizar detalle de orden de venta ─────────────────────────────────────

export const actualizarDetOrdenVenta = async (
  id: number,
  datos: NuevoDetOrdenVenta,
) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_DETORDENVENTA SET
         ODV_Orden_Venta    = :orden,
         PRO_Producto       = :producto,
         DOV_Cantidad       = :cantidad,
         DOV_Precio_Unitario = :precioUnitario,
         DOV_Descuento      = :descuento,
         DOV_Subtotal       = :subtotal
       WHERE DOV_Det_Orden_Venta = :id`,
      {
        orden:          datos.ODV_Orden_Venta,
        producto:       datos.PRO_Producto,
        cantidad:       datos.DOV_Cantidad,
        precioUnitario: datos.DOV_Precio_Unitario,
        descuento:      datos.DOV_Descuento ?? 0,
        subtotal:       datos.DOV_Subtotal,
        id,
      },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Eliminar detalle de orden de venta (borrado físico) ──────────────────────

export const eliminarDetOrdenVenta = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `DELETE FROM MUE_DETORDENVENTA WHERE DOV_Det_Orden_Venta = :id`,
      { id },
      // Atomicidad (ACID): la eliminación es atómica — se confirma o revierte completa
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};
