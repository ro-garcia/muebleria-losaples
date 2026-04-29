import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface NuevaFactura {
  ORD_Orden_Venta: number;
  MET_Metodo_Pago: number;
  FAC_Subtotal: number;
  FAC_Total: number;
  FAC_UUID?: string | null;
  FAC_Serie?: string | null;
  FAC_Numero?: string | null;
  FAC_Descuento_Total?: number;
  FAC_Impuesto_Total?: number;
  FAC_Pendiente_Pago?: number;
  FAC_Total_Pagado?: number;
  FAC_Estado_Factura?: string;
}

export interface RegistrarPago {
  monto: number;
}

// ─── Obtener todas las facturas ───────────────────────────────────────────────

export const obtenerFacturas = async () => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT FAC_Factura, ORD_Orden_Venta, MET_Metodo_Pago,
              FAC_Fecha_Emision, FAC_UUID, FAC_Serie, FAC_Numero,
              FAC_Subtotal, FAC_Descuento_Total, FAC_Impuesto_Total,
              FAC_Total, FAC_Pendiente_Pago, FAC_Total_Pagado,
              FAC_Estado_Factura
       FROM   MUE_FACTURA
       ORDER BY FAC_Factura`,
    );
    return resultado.rows;
  } finally {
    // Aislamiento (ACID): la conexión siempre se cierra para liberar recursos
    if (conexion) await conexion.close();
  }
};

// ─── Obtener factura por ID ───────────────────────────────────────────────────

export const obtenerFacturaPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT FAC_Factura, ORD_Orden_Venta, MET_Metodo_Pago,
              FAC_Fecha_Emision, FAC_UUID, FAC_Serie, FAC_Numero,
              FAC_Subtotal, FAC_Descuento_Total, FAC_Impuesto_Total,
              FAC_Total, FAC_Pendiente_Pago, FAC_Total_Pagado,
              FAC_Estado_Factura
       FROM   MUE_FACTURA
       WHERE  FAC_Factura = :id`,
      { id },
    );
    const filas = resultado.rows as Record<string, unknown>[];
    return filas.length > 0 ? filas[0] : null;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Obtener facturas por orden de venta ──────────────────────────────────────

export const obtenerFacturasPorOrden = async (ordenId: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT FAC_Factura, ORD_Orden_Venta, MET_Metodo_Pago,
              FAC_Fecha_Emision, FAC_UUID, FAC_Serie, FAC_Numero,
              FAC_Subtotal, FAC_Descuento_Total, FAC_Impuesto_Total,
              FAC_Total, FAC_Pendiente_Pago, FAC_Total_Pagado,
              FAC_Estado_Factura
       FROM   MUE_FACTURA
       WHERE  ORD_Orden_Venta = :ordenId
       ORDER BY FAC_Fecha_Emision DESC`,
      { ordenId },
    );
    return resultado.rows;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Crear factura ────────────────────────────────────────────────────────────

export const crearFactura = async (datos: NuevaFactura) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_FACTURA
         (ORD_Orden_Venta, MET_Metodo_Pago, FAC_UUID, FAC_Serie, FAC_Numero,
          FAC_Subtotal, FAC_Descuento_Total, FAC_Impuesto_Total,
          FAC_Total, FAC_Pendiente_Pago, FAC_Total_Pagado, FAC_Estado_Factura)
       VALUES
         (:orden, :metodoPago, :uuid, :serie, :numero,
          :subtotal, :descuentoTotal, :impuestoTotal,
          :total, :pendientePago, :totalPagado, :estado)
       RETURNING FAC_Factura INTO :id`,
      {
        orden:          datos.ORD_Orden_Venta,
        metodoPago:     datos.MET_Metodo_Pago,
        uuid:           datos.FAC_UUID            ?? null,
        serie:          datos.FAC_Serie           ?? null,
        numero:         datos.FAC_Numero          ?? null,
        subtotal:       datos.FAC_Subtotal,
        descuentoTotal: datos.FAC_Descuento_Total ?? 0,
        impuestoTotal:  datos.FAC_Impuesto_Total  ?? 0,
        total:          datos.FAC_Total,
        pendientePago:  datos.FAC_Pendiente_Pago  ?? datos.FAC_Total,
        totalPagado:    datos.FAC_Total_Pagado    ?? 0,
        estado:         datos.FAC_Estado_Factura  ?? "ACTIVA",
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      // Atomicidad (ACID): COMMIT automático si tiene éxito, ROLLBACK si falla
      { autoCommit: true },
    );
    const outBinds = resultado.outBinds as { id: number[] };
    return { FAC_Factura: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Actualizar factura ───────────────────────────────────────────────────────

export const actualizarFactura = async (id: number, datos: NuevaFactura) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_FACTURA SET
         ORD_Orden_Venta    = :orden,
         MET_Metodo_Pago    = :metodoPago,
         FAC_UUID           = :uuid,
         FAC_Serie          = :serie,
         FAC_Numero         = :numero,
         FAC_Subtotal       = :subtotal,
         FAC_Descuento_Total = :descuentoTotal,
         FAC_Impuesto_Total  = :impuestoTotal,
         FAC_Total          = :total,
         FAC_Pendiente_Pago = :pendientePago,
         FAC_Total_Pagado   = :totalPagado,
         FAC_Estado_Factura = :estado
       WHERE FAC_Factura = :id`,
      {
        orden:          datos.ORD_Orden_Venta,
        metodoPago:     datos.MET_Metodo_Pago,
        uuid:           datos.FAC_UUID            ?? null,
        serie:          datos.FAC_Serie           ?? null,
        numero:         datos.FAC_Numero          ?? null,
        subtotal:       datos.FAC_Subtotal,
        descuentoTotal: datos.FAC_Descuento_Total ?? 0,
        impuestoTotal:  datos.FAC_Impuesto_Total  ?? 0,
        total:          datos.FAC_Total,
        pendientePago:  datos.FAC_Pendiente_Pago  ?? 0,
        totalPagado:    datos.FAC_Total_Pagado    ?? 0,
        estado:         datos.FAC_Estado_Factura  ?? "ACTIVA",
        id,
      },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Cambiar estado de la factura ─────────────────────────────────────────────

export const cambiarEstadoFactura = async (id: number, estado: string) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_FACTURA SET FAC_Estado_Factura = :estado
       WHERE  FAC_Factura = :id`,
      { estado, id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Registrar pago parcial o total ───────────────────────────────────────────

export const registrarPago = async (id: number, datos: RegistrarPago) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();

    /*
     * Consistencia (ACID): se calcula el nuevo saldo en la misma sentencia SQL
     * para evitar condiciones de carrera si dos pagos llegan simultáneamente.
     * El estado se actualiza automáticamente a PAGADA cuando el pendiente llega a 0.
     */
    const resultado = await conexion.execute(
      `UPDATE MUE_FACTURA SET
         FAC_Total_Pagado   = FAC_Total_Pagado   + :monto,
         FAC_Pendiente_Pago = FAC_Pendiente_Pago - :monto,
         FAC_Estado_Factura = CASE
           WHEN (FAC_Pendiente_Pago - :monto) <= 0 THEN 'PAGADA'
           ELSE 'PENDIENTE'
         END
       WHERE FAC_Factura = :id
         AND FAC_Estado_Factura NOT IN ('ANULADA')`,
      { monto: datos.monto, id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

// ─── Anular factura (borrado lógico) ──────────────────────────────────────────

export const anularFactura = async (id: number) => {
  // Borrado lógico: preserva historial contable e integridad referencial
  return cambiarEstadoFactura(id, "ANULADA");
};
