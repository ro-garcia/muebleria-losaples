import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

export interface NuevaOrdenVenta {
  CLI_Cliente: number;
  TIE_Tienda: number;
  ODV_Subtotal: number;
  ODV_Total: number;
  ODV_Descuento?: number;
  ODV_Impuesto?: number;
  ODV_Estado?: string;
}

export const obtenerOrdenesVenta = async (search?: string) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const searchValue = search?.trim().toLowerCase() || null;
    const resultado = await conexion.execute(
      `SELECT o.ODV_Orden_Venta, o.CLI_Cliente, o.TIE_Tienda, o.ODV_Fecha,
              o.ODV_Estado, o.ODV_Subtotal, o.ODV_Descuento, o.ODV_Impuesto, o.ODV_Total,
              c.CLI_Tipo_Documento, c.CLI_Numero_Documento, c.CLI_Correo_Electronico,
              c.CLI_Telefono, t.TIE_Nombre,
              TRIM(
                c.CLI_Primer_Nombre || ' ' ||
                NVL(c.CLI_Segundo_Nombre, '') || ' ' ||
                c.CLI_Primer_Apellido || ' ' ||
                NVL(c.CLI_Segundo_Apellido, '')
              ) AS CLIENTE_NOMBRE,
              (
                SELECT f.FAC_Factura
                FROM MUE_FACTURA f
                WHERE f.ORD_Orden_Venta = o.ODV_Orden_Venta
                ORDER BY f.FAC_Factura DESC
                FETCH FIRST 1 ROW ONLY
              ) AS FAC_FACTURA,
              (
                SELECT f.FAC_Estado_Factura
                FROM MUE_FACTURA f
                WHERE f.ORD_Orden_Venta = o.ODV_Orden_Venta
                ORDER BY f.FAC_Factura DESC
                FETCH FIRST 1 ROW ONLY
              ) AS FAC_ESTADO_FACTURA,
              (
                SELECT m.MET_Nombre
                FROM MUE_FACTURA f
                JOIN MUE_METODOPAGO m
                  ON m.MET_Metodo_Pago = f.MET_Metodo_Pago
                WHERE f.ORD_Orden_Venta = o.ODV_Orden_Venta
                ORDER BY f.FAC_Factura DESC
                FETCH FIRST 1 ROW ONLY
              ) AS MET_NOMBRE,
              (
                SELECT LISTAGG(p.PRO_Nombre, ', ')
                  WITHIN GROUP (ORDER BY d.DOV_Det_Orden_Venta)
                FROM MUE_DETORDENVENTA d
                JOIN MUE_PRODUCTO p
                  ON p.PRO_Producto = d.PRO_Producto
                WHERE d.ODV_Orden_Venta = o.ODV_Orden_Venta
              ) AS RESUMEN_PRODUCTOS
       FROM MUE_ORDENVENTA o
       JOIN MUE_CLIENTE c
         ON c.CLI_Cliente = o.CLI_Cliente
       LEFT JOIN MUE_TIENDA t
         ON t.TIE_Tienda = o.TIE_Tienda
       WHERE (:searchValue IS NULL OR TO_CHAR(o.ODV_Orden_Venta) LIKE '%' || :searchValue || '%')
       ORDER BY o.ODV_Orden_Venta DESC`,
      { searchValue },
    );
    return resultado.rows;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerOrdenVentaPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT ODV_Orden_Venta, CLI_Cliente, TIE_Tienda, ODV_Fecha,
              ODV_Estado, ODV_Subtotal, ODV_Descuento, ODV_Impuesto, ODV_Total
       FROM MUE_ORDENVENTA
       WHERE ODV_Orden_Venta = :id`,
      { id },
    );
    const filas = resultado.rows as Record<string, unknown>[] | undefined;
    return filas && filas.length > 0 ? filas[0] : null;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerOrdenesVentaPorCliente = async (clienteId: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT ODV_Orden_Venta, CLI_Cliente, TIE_Tienda, ODV_Fecha,
              ODV_Estado, ODV_Subtotal, ODV_Descuento, ODV_Impuesto, ODV_Total
       FROM MUE_ORDENVENTA
       WHERE CLI_Cliente = :clienteId
       ORDER BY ODV_Fecha DESC`,
      { clienteId },
    );
    return resultado.rows;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerOrdenesVentaPorTienda = async (tiendaId: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT ODV_Orden_Venta, CLI_Cliente, TIE_Tienda, ODV_Fecha,
              ODV_Estado, ODV_Subtotal, ODV_Descuento, ODV_Impuesto, ODV_Total
       FROM MUE_ORDENVENTA
       WHERE TIE_Tienda = :tiendaId
       ORDER BY ODV_Fecha DESC`,
      { tiendaId },
    );
    return resultado.rows;
  } finally {
    if (conexion) await conexion.close();
  }
};

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
        cliente: datos.CLI_Cliente,
        tienda: datos.TIE_Tienda,
        estado: datos.ODV_Estado ?? "ACTIVO",
        subtotal: datos.ODV_Subtotal,
        descuento: datos.ODV_Descuento ?? 0,
        impuesto: datos.ODV_Impuesto ?? 0,
        total: datos.ODV_Total,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );
    const outBinds = resultado.outBinds as { id: number[] };
    return { ODV_Orden_Venta: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

export const actualizarOrdenVenta = async (
  id: number,
  datos: NuevaOrdenVenta,
) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_ORDENVENTA SET
         CLI_Cliente = :cliente,
         TIE_Tienda = :tienda,
         ODV_Estado = :estado,
         ODV_Subtotal = :subtotal,
         ODV_Descuento = :descuento,
         ODV_Impuesto = :impuesto,
         ODV_Total = :total
       WHERE ODV_Orden_Venta = :id`,
      {
        cliente: datos.CLI_Cliente,
        tienda: datos.TIE_Tienda,
        estado: datos.ODV_Estado ?? "ACTIVO",
        subtotal: datos.ODV_Subtotal,
        descuento: datos.ODV_Descuento ?? 0,
        impuesto: datos.ODV_Impuesto ?? 0,
        total: datos.ODV_Total,
        id,
      },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const cambiarEstadoOrdenVenta = async (id: number, estado: string) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_ORDENVENTA SET ODV_Estado = :estado
       WHERE ODV_Orden_Venta = :id`,
      { estado, id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const anularOrdenVenta = async (id: number) =>
  cambiarEstadoOrdenVenta(id, "ANULADO");

export const obtenerOrdenVentaDetalle = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();

    const ordenResult = await conexion.execute(
      `SELECT o.ODV_Orden_Venta, o.CLI_Cliente, o.TIE_Tienda, o.ODV_Fecha,
              o.ODV_Estado, o.ODV_Subtotal, o.ODV_Descuento, o.ODV_Impuesto, o.ODV_Total,
              c.CLI_Primer_Nombre, c.CLI_Segundo_Nombre, c.CLI_Primer_Apellido,
              c.CLI_Segundo_Apellido, c.CLI_Tipo_Documento, c.CLI_Numero_Documento,
              c.CLI_Correo_Electronico, c.CLI_Telefono,
              c.CLI_Pais, c.CLI_Departamento, c.CLI_Municipio, c.CLI_Zona_Aldea,
              t.TIE_Nombre, t.TIE_Departamento, t.TIE_Municipio, t.TIE_Zona_Aldea,
              t.TIE_Domicilio, t.TIE_Telefono
       FROM MUE_ORDENVENTA o
       JOIN MUE_CLIENTE c
         ON c.CLI_Cliente = o.CLI_Cliente
       LEFT JOIN MUE_TIENDA t
         ON t.TIE_Tienda = o.TIE_Tienda
       WHERE o.ODV_Orden_Venta = :id`,
      { id },
    );

    const ordenes = ordenResult.rows as Record<string, unknown>[] | undefined;
    if (!ordenes || ordenes.length === 0) {
      return null;
    }

    const itemsResult = await conexion.execute(
      `SELECT d.DOV_Det_Orden_Venta, d.ODV_Orden_Venta, d.PRO_Producto,
              d.DOV_Cantidad, d.DOV_Precio_Unitario, d.DOV_Descuento, d.DOV_Subtotal,
              p.PRO_Codigo, p.PRO_Nombre,
              df.DFA_Detalle_Factura, df.DFA_Cantidad, df.DFA_Precio,
              df.DFA_Descuento, df.DFA_Impuesto, df.DFA_Subtotal,
              i.IMP_Impuesto, i.IMP_Nombre, i.IMP_Porcentaje
       FROM MUE_DETORDENVENTA d
       JOIN MUE_PRODUCTO p
         ON p.PRO_Producto = d.PRO_Producto
       LEFT JOIN MUE_FACTURA f
         ON f.ORD_Orden_Venta = d.ODV_Orden_Venta
       LEFT JOIN MUE_DETALLE_FACTURA df
         ON df.FAC_Factura = f.FAC_Factura
        AND df.PRO_Producto = d.PRO_Producto
       LEFT JOIN MUE_IMPUESTO i
         ON i.IMP_Impuesto = df.IMP_Impuesto
       WHERE d.ODV_Orden_Venta = :id
       ORDER BY d.DOV_Det_Orden_Venta, df.DFA_Detalle_Factura`,
      { id },
    );

    const facturasResult = await conexion.execute(
      `SELECT f.FAC_Factura, f.ORD_Orden_Venta, f.MET_Metodo_Pago,
              f.FAC_Fecha_Emision, f.FAC_UUID, f.FAC_Serie, f.FAC_Numero,
              f.FAC_Subtotal, f.FAC_Descuento_Total, f.FAC_Impuesto_Total,
              f.FAC_Total, f.FAC_Pendiente_Pago, f.FAC_Total_Pagado,
              f.FAC_Estado_Factura, m.MET_Nombre
       FROM MUE_FACTURA f
       LEFT JOIN MUE_METODOPAGO m
         ON m.MET_Metodo_Pago = f.MET_Metodo_Pago
       WHERE f.ORD_Orden_Venta = :id
       ORDER BY f.FAC_Factura DESC`,
      { id },
    );

    return {
      orden: ordenes[0],
      items: itemsResult.rows ?? [],
      facturas: facturasResult.rows ?? [],
    };
  } finally {
    if (conexion) await conexion.close();
  }
};
