import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

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

export const obtenerFacturas = async (search?: string) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const searchValue = search?.trim().toLowerCase() || null;
    const resultado = await conexion.execute(
      `SELECT f.FAC_Factura, f.ORD_Orden_Venta, f.MET_Metodo_Pago,
              f.FAC_Fecha_Emision, f.FAC_UUID, f.FAC_Serie, f.FAC_Numero,
              f.FAC_Subtotal, f.FAC_Descuento_Total, f.FAC_Impuesto_Total,
              f.FAC_Total, f.FAC_Pendiente_Pago, f.FAC_Total_Pagado,
              f.FAC_Estado_Factura,
              o.CLI_Cliente,
              c.CLI_Tipo_Documento, c.CLI_Numero_Documento, c.CLI_Correo_Electronico,
              TRIM(
                c.CLI_Primer_Nombre || ' ' ||
                NVL(c.CLI_Segundo_Nombre, '') || ' ' ||
                c.CLI_Primer_Apellido || ' ' ||
                NVL(c.CLI_Segundo_Apellido, '')
              ) AS CLIENTE_NOMBRE,
              m.MET_Nombre
       FROM MUE_FACTURA f
       JOIN MUE_ORDENVENTA o
         ON o.ODV_Orden_Venta = f.ORD_Orden_Venta
       JOIN MUE_CLIENTE c
         ON c.CLI_Cliente = o.CLI_Cliente
       LEFT JOIN MUE_METODOPAGO m
         ON m.MET_Metodo_Pago = f.MET_Metodo_Pago
       WHERE (
         :searchValue IS NULL
         OR TO_CHAR(f.FAC_Factura) LIKE '%' || :searchValue || '%'
         OR LOWER(NVL(f.FAC_Numero, '')) LIKE '%' || :searchValue || '%'
       )
       ORDER BY f.FAC_Factura DESC`,
      { searchValue },
    );
    return resultado.rows;
  } finally {
    if (conexion) await conexion.close();
  }
};

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
       FROM MUE_FACTURA
       WHERE FAC_Factura = :id`,
      { id },
    );
    const filas = resultado.rows as Record<string, unknown>[] | undefined;
    return filas && filas.length > 0 ? filas[0] : null;
  } finally {
    if (conexion) await conexion.close();
  }
};

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
       FROM MUE_FACTURA
       WHERE ORD_Orden_Venta = :ordenId
       ORDER BY FAC_Fecha_Emision DESC`,
      { ordenId },
    );
    return resultado.rows;
  } finally {
    if (conexion) await conexion.close();
  }
};

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
        orden: datos.ORD_Orden_Venta,
        metodoPago: datos.MET_Metodo_Pago,
        uuid: datos.FAC_UUID ?? null,
        serie: datos.FAC_Serie ?? null,
        numero: datos.FAC_Numero ?? null,
        subtotal: datos.FAC_Subtotal,
        descuentoTotal: datos.FAC_Descuento_Total ?? 0,
        impuestoTotal: datos.FAC_Impuesto_Total ?? 0,
        total: datos.FAC_Total,
        pendientePago: datos.FAC_Pendiente_Pago ?? datos.FAC_Total,
        totalPagado: datos.FAC_Total_Pagado ?? 0,
        estado: datos.FAC_Estado_Factura ?? "ACTIVA",
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );
    const outBinds = resultado.outBinds as { id: number[] };
    return { FAC_Factura: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

export const actualizarFactura = async (id: number, datos: NuevaFactura) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_FACTURA SET
         ORD_Orden_Venta = :orden,
         MET_Metodo_Pago = :metodoPago,
         FAC_UUID = :uuid,
         FAC_Serie = :serie,
         FAC_Numero = :numero,
         FAC_Subtotal = :subtotal,
         FAC_Descuento_Total = :descuentoTotal,
         FAC_Impuesto_Total = :impuestoTotal,
         FAC_Total = :total,
         FAC_Pendiente_Pago = :pendientePago,
         FAC_Total_Pagado = :totalPagado,
         FAC_Estado_Factura = :estado
       WHERE FAC_Factura = :id`,
      {
        orden: datos.ORD_Orden_Venta,
        metodoPago: datos.MET_Metodo_Pago,
        uuid: datos.FAC_UUID ?? null,
        serie: datos.FAC_Serie ?? null,
        numero: datos.FAC_Numero ?? null,
        subtotal: datos.FAC_Subtotal,
        descuentoTotal: datos.FAC_Descuento_Total ?? 0,
        impuestoTotal: datos.FAC_Impuesto_Total ?? 0,
        total: datos.FAC_Total,
        pendientePago: datos.FAC_Pendiente_Pago ?? 0,
        totalPagado: datos.FAC_Total_Pagado ?? 0,
        estado: datos.FAC_Estado_Factura ?? "ACTIVA",
        id,
      },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const cambiarEstadoFactura = async (id: number, estado: string) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_FACTURA SET FAC_Estado_Factura = :estado
       WHERE FAC_Factura = :id`,
      { estado, id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const registrarPago = async (id: number, datos: RegistrarPago) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_FACTURA SET
         FAC_Total_Pagado = FAC_Total_Pagado + :monto,
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

export const anularFactura = async (id: number) =>
  cambiarEstadoFactura(id, "ANULADA");

export const obtenerFacturaDetalle = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();

    const facturaResult = await conexion.execute(
      `SELECT f.FAC_Factura, f.ORD_Orden_Venta, f.MET_Metodo_Pago,
              f.FAC_Fecha_Emision, f.FAC_UUID, f.FAC_Serie, f.FAC_Numero,
              f.FAC_Subtotal, f.FAC_Descuento_Total, f.FAC_Impuesto_Total,
              f.FAC_Total, f.FAC_Pendiente_Pago, f.FAC_Total_Pagado,
              f.FAC_Estado_Factura,
              m.MET_Nombre,
              o.CLI_Cliente, o.TIE_Tienda, o.ODV_Fecha, o.ODV_Estado,
              o.ODV_Subtotal, o.ODV_Descuento, o.ODV_Impuesto, o.ODV_Total,
              c.CLI_Primer_Nombre, c.CLI_Segundo_Nombre, c.CLI_Primer_Apellido,
              c.CLI_Segundo_Apellido, c.CLI_Tipo_Documento, c.CLI_Numero_Documento,
              c.CLI_Correo_Electronico, c.CLI_Telefono,
              c.CLI_Pais, c.CLI_Departamento, c.CLI_Municipio, c.CLI_Zona_Aldea,
              t.TIE_Nombre, t.TIE_Departamento, t.TIE_Municipio, t.TIE_Zona_Aldea,
              t.TIE_Domicilio, t.TIE_Telefono
       FROM MUE_FACTURA f
       JOIN MUE_ORDENVENTA o
         ON o.ODV_Orden_Venta = f.ORD_Orden_Venta
       JOIN MUE_CLIENTE c
         ON c.CLI_Cliente = o.CLI_Cliente
       LEFT JOIN MUE_TIENDA t
         ON t.TIE_Tienda = o.TIE_Tienda
       LEFT JOIN MUE_METODOPAGO m
         ON m.MET_Metodo_Pago = f.MET_Metodo_Pago
       WHERE f.FAC_Factura = :id`,
      { id },
    );

    const facturas = facturaResult.rows as Record<string, unknown>[] | undefined;
    if (!facturas || facturas.length === 0) {
      return null;
    }

    const itemsResult = await conexion.execute(
      `SELECT df.DFA_Detalle_Factura, df.FAC_Factura, df.PRO_Producto, df.IMP_Impuesto,
              df.DFA_Cantidad, df.DFA_Precio, df.DFA_Descuento, df.DFA_Impuesto, df.DFA_Subtotal,
              p.PRO_Codigo, p.PRO_Nombre,
              i.IMP_Nombre, i.IMP_Porcentaje
       FROM MUE_DETALLE_FACTURA df
       JOIN MUE_PRODUCTO p
         ON p.PRO_Producto = df.PRO_Producto
       LEFT JOIN MUE_IMPUESTO i
         ON i.IMP_Impuesto = df.IMP_Impuesto
       WHERE df.FAC_Factura = :id
       ORDER BY df.DFA_Detalle_Factura`,
      { id },
    );

    return {
      factura: facturas[0],
      items: itemsResult.rows ?? [],
    };
  } finally {
    if (conexion) await conexion.close();
  }
};
