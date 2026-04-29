import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface NuevaOrdenVenta {
  CLI_Cliente: number;
  TIE_Tienda: number;
  ODV_Subtotal: number;
  ODV_Total: number;
  ODV_Descuento?: number;
  ODV_Impuesto?: number;
  ODV_Estado?: string;
}

// ─── Obtener todas las órdenes de venta ───────────────────────────────────────

export const obtenerOrdenesVenta = async () => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT ODV_Orden_Venta, CLI_Cliente, TIE_Tienda, ODV_Fecha,
              ODV_Estado, ODV_Subtotal, ODV_Descuento, ODV_Impuesto, ODV_Total
       FROM   MUE_ORDENVENTA
       ORDER BY ODV_Orden_Venta`,
    );
    return resultado.rows;
  } finally {
    // Aislamiento (ACID): la conexión siempre se cierra para liberar recursos
    if (conexion) await conexion.close();
  }
};

// ─── Obtener orden de venta por ID ────────────────────────────────────────────

export const obtenerOrdenVentaPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT ODV_Orden_Venta, CLI_Cliente, TIE_Tienda, ODV_Fecha,
              ODV_Estado, ODV_Subtotal, ODV_Descuento, ODV_Impuesto, ODV_Total
       FROM   MUE_ORDENVENTA
       WHERE  ODV_Orden_Venta = :id`,
      { id },
    );
    const filas = resultado.rows as Record<string, unknown>[];
    return filas.length > 0 ? filas[0] : null;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Obtener órdenes de venta por cliente ─────────────────────────────────────

export const obtenerOrdenesVentaPorCliente = async (clienteId: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT ODV_Orden_Venta, CLI_Cliente, TIE_Tienda, ODV_Fecha,
              ODV_Estado, ODV_Subtotal, ODV_Descuento, ODV_Impuesto, ODV_Total
       FROM   MUE_ORDENVENTA
       WHERE  CLI_Cliente = :clienteId
       ORDER BY ODV_Fecha DESC`,
      { clienteId },
    );
    return resultado.rows;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Obtener órdenes de venta por tienda ──────────────────────────────────────

export const obtenerOrdenesVentaPorTienda = async (tiendaId: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT ODV_Orden_Venta, CLI_Cliente, TIE_Tienda, ODV_Fecha,
              ODV_Estado, ODV_Subtotal, ODV_Descuento, ODV_Impuesto, ODV_Total
       FROM   MUE_ORDENVENTA
       WHERE  TIE_Tienda = :tiendaId
       ORDER BY ODV_Fecha DESC`,
      { tiendaId },
    );
    return resultado.rows;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Crear orden de venta ─────────────────────────────────────────────────────

export const crearOrdenVenta = async (datos: NuevaOrdenVenta) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_ORDENVENTA
         (CLI_Cliente, TIE_Tienda, ODV_Estado,
          ODV_Subtotal, ODV_Descuento, ODV_Impuesto, ODV_Total)
       VALUES
         (:cliente, :tienda, :estado,
          :subtotal, :descuento, :impuesto, :total)
       RETURNING ODV_Orden_Venta INTO :id`,
      {
        cliente:   datos.CLI_Cliente,
        tienda:    datos.TIE_Tienda,
        estado:    datos.ODV_Estado    ?? "ACTIVO",
        subtotal:  datos.ODV_Subtotal,
        descuento: datos.ODV_Descuento ?? 0,
        impuesto:  datos.ODV_Impuesto  ?? 0,
        total:     datos.ODV_Total,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      // Atomicidad (ACID): COMMIT si éxito, ROLLBACK automático si falla
      { autoCommit: true },
    );
    const outBinds = resultado.outBinds as { id: number[] };
    return { ODV_Orden_Venta: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Actualizar orden de venta ────────────────────────────────────────────────

export const actualizarOrdenVenta = async (
  id: number,
  datos: NuevaOrdenVenta,
) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_ORDENVENTA SET
         CLI_Cliente   = :cliente,
         TIE_Tienda    = :tienda,
         ODV_Estado    = :estado,
         ODV_Subtotal  = :subtotal,
         ODV_Descuento = :descuento,
         ODV_Impuesto  = :impuesto,
         ODV_Total     = :total
       WHERE ODV_Orden_Venta = :id`,
      {
        cliente:   datos.CLI_Cliente,
        tienda:    datos.TIE_Tienda,
        estado:    datos.ODV_Estado    ?? "ACTIVO",
        subtotal:  datos.ODV_Subtotal,
        descuento: datos.ODV_Descuento ?? 0,
        impuesto:  datos.ODV_Impuesto  ?? 0,
        total:     datos.ODV_Total,
        id,
      },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Cambiar estado de la orden ───────────────────────────────────────────────

export const cambiarEstadoOrdenVenta = async (id: number, estado: string) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_ORDENVENTA SET ODV_Estado = :estado
       WHERE  ODV_Orden_Venta = :id`,
      { estado, id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Anular orden de venta (borrado lógico) ───────────────────────────────────

export const anularOrdenVenta = async (id: number) => {
  // Borrado lógico: pasa a ANULADO para preservar historial e integridad referencial
  return cambiarEstadoOrdenVenta(id, "ANULADO");
};
