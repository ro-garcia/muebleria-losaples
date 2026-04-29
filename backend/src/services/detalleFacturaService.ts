import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface NuevoDetalleFactura {
  FAC_Factura: number;
  PRO_Producto: number;
  IMP_Impuesto: number;
  DFA_Cantidad: number;
  DFA_Precio: number;
  DFA_Subtotal: number;
  DFA_Descuento?: number;
  DFA_Impuesto?: number;
}

// ─── Obtener detalles por factura ─────────────────────────────────────────────

export const obtenerDetallesPorFactura = async (facturaId: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT DFA_Detalle_Factura, FAC_Factura, PRO_Producto, IMP_Impuesto,
              DFA_Cantidad, DFA_Precio, DFA_Descuento, DFA_Impuesto, DFA_Subtotal
       FROM   MUE_DETALLE_FACTURA
       WHERE  FAC_Factura = :facturaId
       ORDER BY DFA_Detalle_Factura`,
      { facturaId },
    );
    return resultado.rows;
  } finally {
    // Aislamiento (ACID): la conexión siempre se cierra para liberar recursos
    if (conexion) await conexion.close();
  }
};

// ─── Obtener detalle de factura por ID ───────────────────────────────────────

export const obtenerDetalleFacturaPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT DFA_Detalle_Factura, FAC_Factura, PRO_Producto, IMP_Impuesto,
              DFA_Cantidad, DFA_Precio, DFA_Descuento, DFA_Impuesto, DFA_Subtotal
       FROM   MUE_DETALLE_FACTURA
       WHERE  DFA_Detalle_Factura = :id`,
      { id },
    );
    const filas = resultado.rows as Record<string, unknown>[];
    return filas.length > 0 ? filas[0] : null;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Crear detalle de factura ─────────────────────────────────────────────────

export const crearDetalleFactura = async (datos: NuevoDetalleFactura) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_DETALLE_FACTURA
         (FAC_Factura, PRO_Producto, IMP_Impuesto,
          DFA_Cantidad, DFA_Precio, DFA_Descuento, DFA_Impuesto, DFA_Subtotal)
       VALUES
         (:factura, :producto, :impuesto,
          :cantidad, :precio, :descuento, :impuestoMonto, :subtotal)
       RETURNING DFA_Detalle_Factura INTO :id`,
      {
        factura:       datos.FAC_Factura,
        producto:      datos.PRO_Producto,
        impuesto:      datos.IMP_Impuesto,
        cantidad:      datos.DFA_Cantidad,
        precio:        datos.DFA_Precio,
        descuento:     datos.DFA_Descuento ?? 0,
        impuestoMonto: datos.DFA_Impuesto  ?? 0,
        subtotal:      datos.DFA_Subtotal,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      // Atomicidad (ACID): COMMIT si éxito, ROLLBACK automático si falla
      { autoCommit: true },
    );
    const outBinds = resultado.outBinds as { id: number[] };
    return { DFA_Detalle_Factura: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Actualizar detalle de factura ────────────────────────────────────────────

export const actualizarDetalleFactura = async (
  id: number,
  datos: NuevoDetalleFactura,
) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_DETALLE_FACTURA SET
         FAC_Factura   = :factura,
         PRO_Producto  = :producto,
         IMP_Impuesto  = :impuesto,
         DFA_Cantidad  = :cantidad,
         DFA_Precio    = :precio,
         DFA_Descuento = :descuento,
         DFA_Impuesto  = :impuestoMonto,
         DFA_Subtotal  = :subtotal
       WHERE DFA_Detalle_Factura = :id`,
      {
        factura:       datos.FAC_Factura,
        producto:      datos.PRO_Producto,
        impuesto:      datos.IMP_Impuesto,
        cantidad:      datos.DFA_Cantidad,
        precio:        datos.DFA_Precio,
        descuento:     datos.DFA_Descuento ?? 0,
        impuestoMonto: datos.DFA_Impuesto  ?? 0,
        subtotal:      datos.DFA_Subtotal,
        id,
      },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Eliminar detalle de factura (borrado físico) ─────────────────────────────

export const eliminarDetalleFactura = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `DELETE FROM MUE_DETALLE_FACTURA WHERE DFA_Detalle_Factura = :id`,
      { id },
      // Atomicidad (ACID): la eliminación es atómica — se confirma o revierte completa
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};
