import crypto from "crypto";
import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";
import { sendEmail } from "./emailService";
import {
  InventarioServiceError,
  descontarStockProducto,
  validarStockProductoSuficiente,
} from "./inventarioService";
import { compraConfirmacionTemplate } from "../templates/compraConfirmacion";

type Row = Record<string, unknown>;

export interface CheckoutItemResult {
  PRO_Producto: number;
  PRO_Codigo: string | null;
  PRO_Nombre: string;
  DOV_Cantidad: number;
  DOV_Precio_Unitario: number;
  DOV_Descuento: number;
  DOV_Subtotal: number;
}

export interface CheckoutResult {
  ordenId: number;
  facturaId: number;
  referencia: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  metodoPagoId: number;
  items: CheckoutItemResult[];
  warning?: string;
}

export class ShopCheckoutServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

const toNumber = (value: unknown) => Number(value ?? 0);
const toText = (value: unknown) => String(value ?? "").trim();

const fetchOne = <T extends Row>(rows: unknown): T | null => {
  const data = rows as T[] | undefined;
  return data && data.length > 0 ? data[0] : null;
};

const getOpenCartByCliente = async (
  connection: oracledb.Connection,
  clienteId: number,
) => {
  const result = await connection.execute(
    `SELECT o.ODV_Orden_Venta, o.TIE_Tienda, o.ODV_Estado
     FROM MUE_ORDENVENTA o
     WHERE o.CLI_Cliente = :clienteId
       AND o.ODV_Estado = 'ACTIVO'
       AND NOT EXISTS (
             SELECT 1
             FROM MUE_FACTURA f
             WHERE f.ORD_Orden_Venta = o.ODV_Orden_Venta
           )
     ORDER BY o.ODV_Fecha DESC, o.ODV_Orden_Venta DESC
     FETCH FIRST 1 ROW ONLY`,
    { clienteId },
  );
  return fetchOne(result.rows);
};

const getOrderByIdForCliente = async (
  connection: oracledb.Connection,
  ordenId: number,
  clienteId: number,
) => {
  const result = await connection.execute(
    `SELECT o.ODV_Orden_Venta,
            o.TIE_Tienda,
            o.ODV_Estado,
            CASE
              WHEN EXISTS (
                SELECT 1
                FROM MUE_FACTURA f
                WHERE f.ORD_Orden_Venta = o.ODV_Orden_Venta
              )
              THEN 1
              ELSE 0
            END AS HAS_FACTURA
     FROM MUE_ORDENVENTA o
     WHERE o.ODV_Orden_Venta = :ordenId
       AND o.CLI_Cliente = :clienteId`,
    { ordenId, clienteId },
  );
  return fetchOne(result.rows);
};

const getOrderItems = async (connection: oracledb.Connection, ordenId: number) => {
  const result = await connection.execute(
    `SELECT d.DOV_Det_Orden_Venta,
            d.PRO_Producto,
            d.DOV_Cantidad,
            d.DOV_Descuento,
            p.PRO_Codigo,
            p.PRO_Nombre
     FROM MUE_DETORDENVENTA d
     JOIN MUE_PRODUCTO p
       ON p.PRO_Producto = d.PRO_Producto
     WHERE d.ODV_Orden_Venta = :ordenId
     ORDER BY d.DOV_Det_Orden_Venta`,
    { ordenId },
  );
  return (result.rows ?? []) as Row[];
};

const getCurrentPrice = async (connection: oracledb.Connection, productoId: number) => {
  const result = await connection.execute(
    `SELECT PRE_Precio
     FROM MUE_PRECIOPRODUCTO
     WHERE PRO_Producto = :productoId
       AND PRE_Fecha_Inicio <= SYSDATE
       AND (PRE_Fecha_Fin IS NULL OR PRE_Fecha_Fin >= SYSDATE)
     ORDER BY PRE_Fecha_Inicio DESC, PRE_Precio_Producto DESC
     FETCH FIRST 1 ROW ONLY`,
    { productoId },
  );
  const row = fetchOne(result.rows);
  if (!row) {
    throw new ShopCheckoutServiceError(
      `No hay precio vigente para el producto ${productoId}.`,
      409,
    );
  }
  return toNumber(row.PRE_PRECIO);
};

const getDefaultImpuesto = async (connection: oracledb.Connection) => {
  const result = await connection.execute(
    `SELECT IMP_Impuesto, IMP_Porcentaje
     FROM MUE_IMPUESTO
     WHERE IMP_Estado = 'ACTIVO'
     ORDER BY IMP_Impuesto
     FETCH FIRST 1 ROW ONLY`,
  );
  const row = fetchOne(result.rows);
  if (!row) {
    throw new ShopCheckoutServiceError(
      "No existe un impuesto activo para generar detalle de factura.",
      409,
    );
  }
  return {
    impuestoId: toNumber(row.IMP_IMPUESTO),
    porcentaje: toNumber(row.IMP_PORCENTAJE),
  };
};

const getMetodoPago = async (connection: oracledb.Connection, metodoPagoId: number) => {
  const result = await connection.execute(
    `SELECT MET_Metodo_Pago
     FROM MUE_METODOPAGO
     WHERE MET_Metodo_Pago = :metodoPagoId
       AND MET_Estado = 'ACTIVO'`,
    { metodoPagoId },
  );
  const row = fetchOne(result.rows);
  if (!row) {
    throw new ShopCheckoutServiceError("Metodo de pago no disponible.", 404);
  }
};

const updateOrderItem = async (
  connection: oracledb.Connection,
  detalleId: number,
  precio: number,
  subtotal: number,
) =>
  connection.execute(
    `UPDATE MUE_DETORDENVENTA
     SET DOV_Precio_Unitario = :precio,
         DOV_Subtotal = :subtotal
     WHERE DOV_Det_Orden_Venta = :detalleId`,
    { detalleId, precio, subtotal },
  );

const updateOrderTotals = async (
  connection: oracledb.Connection,
  ordenId: number,
  subtotal: number,
  descuento: number,
  impuesto: number,
  total: number,
) =>
  connection.execute(
    `UPDATE MUE_ORDENVENTA
     SET ODV_Subtotal = :subtotal,
         ODV_Descuento = :descuento,
         ODV_Impuesto = :impuesto,
         ODV_Total = :total,
         ODV_Estado = 'ACTIVO'
     WHERE ODV_Orden_Venta = :ordenId`,
    { ordenId, subtotal, descuento, impuesto, total },
  );

const createFactura = async (
  connection: oracledb.Connection,
  ordenId: number,
  metodoPagoId: number,
  subtotal: number,
  descuento: number,
  impuesto: number,
  total: number,
) => {
  const numero = `${new Date().getFullYear()}-${String(ordenId).padStart(6, "0")}`;
  const uuid = crypto.randomUUID();
  const result = await connection.execute(
    `INSERT INTO MUE_FACTURA (
       ORD_Orden_Venta,
       MET_Metodo_Pago,
       FAC_UUID,
       FAC_Serie,
       FAC_Numero,
       FAC_Subtotal,
       FAC_Descuento_Total,
       FAC_Impuesto_Total,
       FAC_Total,
       FAC_Pendiente_Pago,
       FAC_Total_Pagado,
       FAC_Estado_Factura
     ) VALUES (
       :ordenId,
       :metodoPagoId,
       :uuid,
       'A',
       :numero,
       :subtotal,
       :descuento,
       :impuesto,
       :total,
       0,
       :total,
       'PAGADA'
     )
     RETURNING FAC_Factura INTO :id`,
    {
      ordenId,
      metodoPagoId,
      uuid,
      numero,
      subtotal,
      descuento,
      impuesto,
      total,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    },
  );

  const outBinds = result.outBinds as { id: number[] };
  return { facturaId: outBinds.id[0], referencia: numero };
};

const createFacturaDetails = async (
  connection: oracledb.Connection,
  facturaId: number,
  impuestoId: number,
  impuestoPorcentaje: number,
  items: CheckoutItemResult[],
) => {
  for (const item of items) {
    const impuestoItem = item.DOV_Subtotal * (impuestoPorcentaje / 100);
    await connection.execute(
      `INSERT INTO MUE_DETALLE_FACTURA (
         FAC_Factura,
         PRO_Producto,
         IMP_Impuesto,
         DFA_Cantidad,
         DFA_Precio,
         DFA_Descuento,
         DFA_Impuesto,
         DFA_Subtotal
       ) VALUES (
         :facturaId,
         :productoId,
         :impuestoId,
         :cantidad,
         :precio,
         :descuento,
         :impuesto,
         :subtotal
       )`,
      {
        facturaId,
        productoId: item.PRO_Producto,
        impuestoId,
        cantidad: item.DOV_Cantidad,
        precio: item.DOV_Precio_Unitario,
        descuento: item.DOV_Descuento,
        impuesto: impuestoItem,
        subtotal: item.DOV_Subtotal,
      },
    );
  }
};

const getClienteProfile = async (clienteId: number) => {
  const { obtenerClientePorId } = await import("./clienteService");
  return obtenerClientePorId(clienteId);
};

const ensureClienteHasValidAddress = async (clienteId: number) => {
  const profile = await getClienteProfile(clienteId);
  if (toNumber(profile.DIRECCION_VALIDA) !== 1) {
    throw new ShopCheckoutServiceError(
      "Debes completar una direccion valida antes de continuar con la compra.",
      409,
    );
  }
  return profile;
};

export const checkoutShop = async (payload: {
  clienteId: number;
  metodoPagoId: number;
  ordenId?: number;
}) => {
  let connection: oracledb.Connection | undefined;

  try {
    const cliente = await ensureClienteHasValidAddress(payload.clienteId);
    connection = await getDatabaseConnection();

    const order = payload.ordenId
      ? await getOrderByIdForCliente(connection, payload.ordenId, payload.clienteId)
      : await getOpenCartByCliente(connection, payload.clienteId);

    if (!order) {
      throw new ShopCheckoutServiceError("No existe un carrito activo para checkout.", 404);
    }

    if (toText(order.ODV_ESTADO || "ACTIVO") !== "ACTIVO") {
      throw new ShopCheckoutServiceError("La orden ya no se encuentra activa.", 409);
    }

    if (toNumber(order.HAS_FACTURA) > 0) {
      throw new ShopCheckoutServiceError("La orden ya fue procesada anteriormente.", 409);
    }

    await getMetodoPago(connection, payload.metodoPagoId);
    const impuesto = await getDefaultImpuesto(connection);

    const orderId = toNumber(order.ODV_ORDEN_VENTA);
    const rows = await getOrderItems(connection, orderId);
    if (rows.length === 0) {
      throw new ShopCheckoutServiceError("No se puede procesar un carrito vacio.", 409);
    }

    const items: CheckoutItemResult[] = [];
    let subtotal = 0;
    let descuento = 0;
    let impuestoMonto = 0;

    for (const row of rows) {
      const productoId = toNumber(row.PRO_PRODUCTO);
      const cantidad = toNumber(row.DOV_CANTIDAD);
      const descuentoItem = toNumber(row.DOV_DESCUENTO);
      const precioVigente = await getCurrentPrice(connection, productoId);

      try {
        await validarStockProductoSuficiente(connection, productoId, cantidad);
      } catch (error) {
        if (error instanceof InventarioServiceError) {
          throw new ShopCheckoutServiceError(error.message, error.statusCode);
        }
        throw error;
      }

      const subtotalItem = cantidad * precioVigente - descuentoItem;

      if (subtotalItem < 0) {
        throw new ShopCheckoutServiceError(
          `El subtotal del producto ${productoId} es invalido.`,
          409,
        );
      }

      await updateOrderItem(
        connection,
        toNumber(row.DOV_DET_ORDEN_VENTA),
        precioVigente,
        subtotalItem,
      );

      subtotal += cantidad * precioVigente;
      descuento += descuentoItem;
      impuestoMonto += subtotalItem * (impuesto.porcentaje / 100);

      items.push({
        PRO_Producto: productoId,
        PRO_Codigo: (row.PRO_CODIGO ?? null) as string | null,
        PRO_Nombre: toText(row.PRO_NOMBRE),
        DOV_Cantidad: cantidad,
        DOV_Precio_Unitario: precioVigente,
        DOV_Descuento: descuentoItem,
        DOV_Subtotal: subtotalItem,
      });
    }

    const total = subtotal - descuento + impuestoMonto;

    await updateOrderTotals(
      connection,
      orderId,
      subtotal,
      descuento,
      impuestoMonto,
      total,
    );

    const { facturaId, referencia } = await createFactura(
      connection,
      orderId,
      payload.metodoPagoId,
      subtotal,
      descuento,
      impuestoMonto,
      total,
    );

    await createFacturaDetails(
      connection,
      facturaId,
      impuesto.impuestoId,
      impuesto.porcentaje,
      items,
    );

    for (const item of items) {
      try {
        await descontarStockProducto(
          connection,
          item.PRO_Producto,
          item.DOV_Cantidad,
        );
      } catch (error) {
        if (error instanceof InventarioServiceError) {
          throw new ShopCheckoutServiceError(error.message, error.statusCode);
        }
        throw error;
      }
    }

    await connection.commit();

    let warning = "";
    const correo = toText(cliente.CLI_CORREO_ELECTRONICO) || toText(cliente.PER_CORREO);
    const nombre = [
      toText(cliente.CLI_PRIMER_NOMBRE) || toText(cliente.PER_NOMBRE),
      toText(cliente.CLI_PRIMER_APELLIDO) || toText(cliente.PER_PRIMER_APELLIDO),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (correo) {
      try {
        await sendEmail({
          to: correo,
          subject: `Compra confirmada #${orderId}`,
          html: compraConfirmacionTemplate({
            clienteNombre: nombre || "cliente",
            ordenId: orderId,
            facturaId,
            referencia,
            total,
            items: items.map((item) => ({
              nombre: item.PRO_Nombre,
              cantidad: item.DOV_Cantidad,
              precio: item.DOV_Precio_Unitario,
              subtotal: item.DOV_Subtotal,
            })),
          }),
        });
      } catch {
        warning = "La compra fue creada, pero no se pudo enviar el correo de confirmacion.";
      }
    }

    return {
      ordenId: orderId,
      facturaId,
      referencia,
      subtotal,
      descuento,
      impuesto: impuestoMonto,
      total,
      metodoPagoId: payload.metodoPagoId,
      items,
      warning: warning || undefined,
    } satisfies CheckoutResult;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) await connection.close();
  }
};

export const listOrdersByCliente = async (clienteId: number) => {
  let connection: oracledb.Connection | undefined;
  try {
    connection = await getDatabaseConnection();
    const result = await connection.execute(
      `SELECT o.ODV_Orden_Venta,
              o.CLI_Cliente,
              o.TIE_Tienda,
              o.ODV_Fecha,
              o.ODV_Estado,
              o.ODV_Subtotal,
              o.ODV_Descuento,
              o.ODV_Impuesto,
              o.ODV_Total,
              f.FAC_Factura,
              f.FAC_Numero,
              f.FAC_Estado_Factura,
              f.FAC_Total_Pagado,
              f.FAC_Pendiente_Pago,
              m.MET_Metodo_Pago,
              m.MET_Nombre,
              LISTAGG(p.PRO_Nombre || ' x' || d.DOV_Cantidad, ', ')
                WITHIN GROUP (ORDER BY d.DOV_Det_Orden_Venta) AS RESUMEN_PRODUCTOS
       FROM MUE_ORDENVENTA o
       LEFT JOIN MUE_FACTURA f
         ON f.ORD_Orden_Venta = o.ODV_Orden_Venta
       LEFT JOIN MUE_METODOPAGO m
         ON m.MET_Metodo_Pago = f.MET_Metodo_Pago
       LEFT JOIN MUE_DETORDENVENTA d
         ON d.ODV_Orden_Venta = o.ODV_Orden_Venta
       LEFT JOIN MUE_PRODUCTO p
         ON p.PRO_Producto = d.PRO_Producto
       WHERE o.CLI_Cliente = :clienteId
       GROUP BY o.ODV_Orden_Venta,
                o.CLI_Cliente,
                o.TIE_Tienda,
                o.ODV_Fecha,
                o.ODV_Estado,
                o.ODV_Subtotal,
                o.ODV_Descuento,
                o.ODV_Impuesto,
                o.ODV_Total,
                f.FAC_Factura,
                f.FAC_Numero,
                f.FAC_Estado_Factura,
                f.FAC_Total_Pagado,
                f.FAC_Pendiente_Pago,
                m.MET_Metodo_Pago,
                m.MET_Nombre
       ORDER BY o.ODV_Fecha DESC, o.ODV_Orden_Venta DESC`,
      { clienteId },
    );
    return result.rows ?? [];
  } finally {
    if (connection) await connection.close();
  }
};

export const getOrderById = async (clienteId: number, ordenId: number) => {
  let connection: oracledb.Connection | undefined;
  try {
    connection = await getDatabaseConnection();
    const order = await connection.execute(
      `SELECT o.ODV_Orden_Venta,
              o.CLI_Cliente,
              o.TIE_Tienda,
              o.ODV_Fecha,
              o.ODV_Estado,
              o.ODV_Subtotal,
              o.ODV_Descuento,
              o.ODV_Impuesto,
              o.ODV_Total,
              t.TIE_Nombre,
              t.TIE_Departamento,
              t.TIE_Municipio,
              t.TIE_Zona_Aldea,
              t.TIE_Domicilio,
              t.TIE_Telefono
       FROM MUE_ORDENVENTA o
       LEFT JOIN MUE_TIENDA t
         ON t.TIE_Tienda = o.TIE_Tienda
       WHERE o.ODV_Orden_Venta = :ordenId
         AND o.CLI_Cliente = :clienteId`,
      { ordenId, clienteId },
    );

    const orderRow = fetchOne(order.rows);
    if (!orderRow) {
      throw new ShopCheckoutServiceError("Orden no encontrada.", 404);
    }

    const profile = await getClienteProfile(clienteId);

    const itemsResult = await connection.execute(
      `SELECT d.DOV_Det_Orden_Venta,
              d.ODV_Orden_Venta,
              d.PRO_Producto,
              p.PRO_Codigo,
              p.PRO_Nombre,
              d.DOV_Cantidad,
              d.DOV_Precio_Unitario,
              d.DOV_Descuento,
              d.DOV_Subtotal,
              df.DFA_Detalle_Factura,
              df.DFA_Cantidad,
              df.DFA_Precio,
              df.DFA_Descuento,
              df.DFA_Impuesto,
              df.DFA_Subtotal,
              i.IMP_Impuesto,
              i.IMP_Nombre,
              i.IMP_Porcentaje
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
       WHERE d.ODV_Orden_Venta = :ordenId
       ORDER BY d.DOV_Det_Orden_Venta, df.DFA_Detalle_Factura`,
      { ordenId },
    );

    const facturaResult = await connection.execute(
      `SELECT f.FAC_Factura,
              f.ORD_Orden_Venta,
              f.MET_Metodo_Pago,
              f.FAC_Fecha_Emision,
              f.FAC_UUID,
              f.FAC_Serie,
              f.FAC_Numero,
              f.FAC_Subtotal,
              f.FAC_Descuento_Total,
              f.FAC_Impuesto_Total,
              f.FAC_Total,
              f.FAC_Pendiente_Pago,
              f.FAC_Total_Pagado,
              f.FAC_Estado_Factura,
              m.MET_Nombre
       FROM MUE_FACTURA f
       LEFT JOIN MUE_METODOPAGO m
         ON m.MET_Metodo_Pago = f.MET_Metodo_Pago
       WHERE f.ORD_Orden_Venta = :ordenId
       ORDER BY f.FAC_Factura DESC`,
      { ordenId },
    );

    return {
      orden: {
        ...orderRow,
        DIRECCION_VALIDA: profile.DIRECCION_VALIDA,
        DIRECCION_RESUMEN: profile.DIRECCION_RESUMEN,
        DIR_PAIS: profile.DIR_PAIS,
        DIR_DEPARTAMENTO: profile.DIR_DEPARTAMENTO,
        DIR_MUNICIPIO: profile.DIR_MUNICIPIO,
        DIR_ZONA_ALDEA: profile.DIR_ZONA_ALDEA,
        DIR_TELEFONO: profile.DIR_TELEFONO,
      },
      cliente: profile,
      items: itemsResult.rows ?? [],
      facturas: facturaResult.rows ?? [],
    };
  } finally {
    if (connection) await connection.close();
  }
};
