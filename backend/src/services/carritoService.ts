import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";
import {
  InventarioServiceError,
  validarStockProductoSuficiente,
} from "./inventarioService";

export interface CrearCarrito {
  CLI_Cliente: number;
  TIE_Tienda: number;
}

export interface AgregarItemCarrito extends CrearCarrito {
  PRO_Producto: number;
  DOV_Cantidad: number;
  DOV_Descuento?: number;
}

export interface AgregarItemOrden {
  PRO_Producto: number;
  DOV_Cantidad: number;
  DOV_Descuento?: number;
}

export interface ActualizarItemCarrito {
  DOV_Cantidad: number;
  DOV_Descuento?: number;
}

type Row = Record<string, unknown>;

export class CarritoServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

const toCarritoError = (error: unknown) => {
  if (error instanceof InventarioServiceError) {
    return new CarritoServiceError(error.message, error.statusCode);
  }
  return error;
};

const obtenerFila = <T extends Row>(rows: unknown): T | null => {
  const filas = rows as T[] | undefined;
  return filas && filas.length > 0 ? filas[0] : null;
};

const obtenerNumero = (valor: unknown) => Number(valor ?? 0);

const obtenerOrdenPorId = async (
  conexion: oracledb.Connection,
  ordenId: number,
) => {
  const resultado = await conexion.execute(
    `SELECT ODV_Orden_Venta, CLI_Cliente, TIE_Tienda, ODV_Fecha,
            ODV_Estado, ODV_Subtotal, ODV_Descuento, ODV_Impuesto, ODV_Total
     FROM   MUE_ORDENVENTA
     WHERE  ODV_Orden_Venta = :ordenId`,
    { ordenId },
  );

  return obtenerFila(resultado.rows);
};

const obtenerCarritoActivoPorCliente = async (
  conexion: oracledb.Connection,
  clienteId: number,
) => {
  const resultado = await conexion.execute(
    `SELECT ODV_Orden_Venta, CLI_Cliente, TIE_Tienda, ODV_Fecha,
            ODV_Estado, ODV_Subtotal, ODV_Descuento, ODV_Impuesto, ODV_Total
     FROM   MUE_ORDENVENTA
     WHERE  CLI_Cliente = :clienteId
       AND  ODV_Estado = 'ACTIVO'
       AND  NOT EXISTS (
              SELECT 1
              FROM MUE_FACTURA f
              WHERE f.ORD_Orden_Venta = MUE_ORDENVENTA.ODV_Orden_Venta
            )
     ORDER BY ODV_Fecha DESC, ODV_Orden_Venta DESC
     FETCH FIRST 1 ROW ONLY`,
    { clienteId },
  );

  return obtenerFila(resultado.rows);
};

const obtenerItemsPorOrden = async (
  conexion: oracledb.Connection,
  ordenId: number,
) => {
  const resultado = await conexion.execute(
    `SELECT d.DOV_Det_Orden_Venta,
            d.ODV_Orden_Venta,
            d.PRO_Producto,
            p.PRO_Codigo,
            p.PRO_Nombre,
            d.DOV_Cantidad,
            d.DOV_Precio_Unitario,
            d.DOV_Descuento,
            d.DOV_Subtotal
     FROM   MUE_DETORDENVENTA d
     JOIN   MUE_PRODUCTO p ON p.PRO_Producto = d.PRO_Producto
     WHERE  d.ODV_Orden_Venta = :ordenId
     ORDER BY d.DOV_Det_Orden_Venta`,
    { ordenId },
  );

  return (resultado.rows ?? []) as Row[];
};

const construirCarrito = async (
  conexion: oracledb.Connection,
  ordenId: number,
) => {
  const orden = await obtenerOrdenPorId(conexion, ordenId);

  if (!orden) {
    return null;
  }

  const items = await obtenerItemsPorOrden(conexion, ordenId);

  return {
    orden,
    items,
  };
};

const crearCarritoVacio = async (
  conexion: oracledb.Connection,
  datos: CrearCarrito,
) => {
  const resultado = await conexion.execute(
    `INSERT INTO MUE_ORDENVENTA
       (CLI_Cliente, TIE_Tienda, ODV_Estado, ODV_Subtotal,
        ODV_Descuento, ODV_Impuesto, ODV_Total)
     VALUES
       (:cliente, :tienda, 'ACTIVO', 0, 0, 0, 0)
     RETURNING ODV_Orden_Venta INTO :id`,
    {
      cliente: datos.CLI_Cliente,
      tienda: datos.TIE_Tienda,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    },
  );

  const outBinds = resultado.outBinds as { id: number[] };
  return outBinds.id[0];
};

const obtenerPrecioVigente = async (
  conexion: oracledb.Connection,
  productoId: number,
) => {
  const resultado = await conexion.execute(
    `SELECT p.PRO_Producto,
            p.PRO_Nombre,
            pp.PRE_Precio
     FROM   MUE_PRODUCTO p
     JOIN   MUE_PRECIOPRODUCTO pp ON pp.PRO_Producto = p.PRO_Producto
     WHERE  p.PRO_Producto = :productoId
       AND  p.PRO_Estado = 'ACTIVO'
       AND  pp.PRE_Fecha_Inicio <= SYSDATE
       AND  (pp.PRE_Fecha_Fin IS NULL OR pp.PRE_Fecha_Fin >= SYSDATE)
     ORDER BY pp.PRE_Fecha_Inicio DESC, pp.PRE_Precio_Producto DESC
     FETCH FIRST 1 ROW ONLY`,
    { productoId },
  );

  const producto = obtenerFila(resultado.rows);

  if (!producto) {
    throw new CarritoServiceError(
      "Producto activo con precio vigente no encontrado",
      404,
    );
  }

  return {
    productoId: obtenerNumero(producto.PRO_PRODUCTO),
    nombre: String(producto.PRO_NOMBRE),
    precio: obtenerNumero(producto.PRE_PRECIO),
  };
};

const obtenerDetallePorProducto = async (
  conexion: oracledb.Connection,
  ordenId: number,
  productoId: number,
) => {
  const resultado = await conexion.execute(
    `SELECT DOV_Det_Orden_Venta, ODV_Orden_Venta, PRO_Producto,
            DOV_Cantidad, DOV_Precio_Unitario, DOV_Descuento, DOV_Subtotal
     FROM   MUE_DETORDENVENTA
     WHERE  ODV_Orden_Venta = :ordenId
       AND  PRO_Producto = :productoId`,
    { ordenId, productoId },
  );

  return obtenerFila(resultado.rows);
};

const obtenerDetalleConOrden = async (
  conexion: oracledb.Connection,
  detalleId: number,
) => {
  const resultado = await conexion.execute(
    `SELECT d.DOV_Det_Orden_Venta,
            d.ODV_Orden_Venta,
            d.PRO_Producto,
            d.DOV_Cantidad,
            d.DOV_Precio_Unitario,
            d.DOV_Descuento,
            d.DOV_Subtotal,
            o.ODV_Estado
     FROM   MUE_DETORDENVENTA d
     JOIN   MUE_ORDENVENTA o ON o.ODV_Orden_Venta = d.ODV_Orden_Venta
     WHERE  d.DOV_Det_Orden_Venta = :detalleId`,
    { detalleId },
  );

  return obtenerFila(resultado.rows);
};

const validarOrdenActiva = (orden: Row | null) => {
  if (!orden) {
    throw new CarritoServiceError("Carrito no encontrado", 404);
  }

  if (orden.ODV_ESTADO !== "ACTIVO") {
    throw new CarritoServiceError("El carrito ya no esta activo", 409);
  }
};

const recalcularTotales = async (
  conexion: oracledb.Connection,
  ordenId: number,
) => {
  await conexion.execute(
    `UPDATE MUE_ORDENVENTA
     SET    ODV_Subtotal = (
              SELECT NVL(SUM(DOV_Cantidad * DOV_Precio_Unitario), 0)
              FROM   MUE_DETORDENVENTA
              WHERE  ODV_Orden_Venta = :ordenId
            ),
            ODV_Descuento = (
              SELECT NVL(SUM(DOV_Descuento), 0)
              FROM   MUE_DETORDENVENTA
              WHERE  ODV_Orden_Venta = :ordenId
            ),
            ODV_Impuesto = 0,
            ODV_Total = (
              SELECT NVL(SUM(DOV_Subtotal), 0)
              FROM   MUE_DETORDENVENTA
              WHERE  ODV_Orden_Venta = :ordenId
            )
     WHERE  ODV_Orden_Venta = :ordenId`,
    { ordenId },
  );
};

const guardarItem = async (
  conexion: oracledb.Connection,
  ordenId: number,
  datos: AgregarItemOrden,
) => {
  if (datos.DOV_Cantidad <= 0) {
    throw new CarritoServiceError(
      "La cantidad del producto debe ser mayor a 0.",
      400,
    );
  }

  const producto = await obtenerPrecioVigente(conexion, datos.PRO_Producto);
  const detalleActual = await obtenerDetallePorProducto(
    conexion,
    ordenId,
    datos.PRO_Producto,
  );

  const cantidadActual = obtenerNumero(detalleActual?.DOV_CANTIDAD);
  const descuentoActual = obtenerNumero(detalleActual?.DOV_DESCUENTO);
  const nuevaCantidad = cantidadActual + datos.DOV_Cantidad;
  const nuevoDescuento = descuentoActual + (datos.DOV_Descuento ?? 0);
  const nuevoSubtotal = nuevaCantidad * producto.precio - nuevoDescuento;

  try {
    await validarStockProductoSuficiente(
      conexion,
      datos.PRO_Producto,
      nuevaCantidad,
    );
  } catch (error) {
    throw toCarritoError(error);
  }

  if (nuevoSubtotal < 0) {
    throw new CarritoServiceError(
      "El descuento no puede superar el subtotal del item",
    );
  }

  if (detalleActual) {
    await conexion.execute(
      `UPDATE MUE_DETORDENVENTA
       SET    DOV_Cantidad = :cantidad,
              DOV_Precio_Unitario = :precio,
              DOV_Descuento = :descuento,
              DOV_Subtotal = :subtotal
       WHERE  DOV_Det_Orden_Venta = :detalleId`,
      {
        cantidad: nuevaCantidad,
        precio: producto.precio,
        descuento: nuevoDescuento,
        subtotal: nuevoSubtotal,
        detalleId: obtenerNumero(detalleActual.DOV_DET_ORDEN_VENTA),
      },
    );
    return;
  }

  await conexion.execute(
    `INSERT INTO MUE_DETORDENVENTA
       (ODV_Orden_Venta, PRO_Producto, DOV_Cantidad,
        DOV_Precio_Unitario, DOV_Descuento, DOV_Subtotal)
     VALUES
       (:ordenId, :productoId, :cantidad, :precio, :descuento, :subtotal)`,
    {
      ordenId,
      productoId: datos.PRO_Producto,
      cantidad: datos.DOV_Cantidad,
      precio: producto.precio,
      descuento: datos.DOV_Descuento ?? 0,
      subtotal:
        datos.DOV_Cantidad * producto.precio - (datos.DOV_Descuento ?? 0),
    },
  );
};

export const obtenerCarritoPorId = async (ordenId: number) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    return await construirCarrito(conexion, ordenId);
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerCarritoPorCliente = async (clienteId: number) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const carrito = await obtenerCarritoActivoPorCliente(conexion, clienteId);

    if (!carrito) {
      return null;
    }

    return await construirCarrito(
      conexion,
      obtenerNumero(carrito.ODV_ORDEN_VENTA),
    );
  } finally {
    if (conexion) await conexion.close();
  }
};

export const crearORecuperarCarrito = async (datos: CrearCarrito) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const carritoActivo = await obtenerCarritoActivoPorCliente(
      conexion,
      datos.CLI_Cliente,
    );

    if (carritoActivo) {
      return await construirCarrito(
        conexion,
        obtenerNumero(carritoActivo.ODV_ORDEN_VENTA),
      );
    }

    const ordenId = await crearCarritoVacio(conexion, datos);
    await conexion.commit();

    return await construirCarrito(conexion, ordenId);
  } catch (error) {
    if (conexion) await conexion.rollback();
    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const agregarItemACarritoActivo = async (datos: AgregarItemCarrito) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    let carrito = await obtenerCarritoActivoPorCliente(conexion, datos.CLI_Cliente);
    let ordenId: number;

    if (carrito) {
      ordenId = obtenerNumero(carrito.ODV_ORDEN_VENTA);
    } else {
      ordenId = await crearCarritoVacio(conexion, {
        CLI_Cliente: datos.CLI_Cliente,
        TIE_Tienda: datos.TIE_Tienda,
      });
    }

    await guardarItem(conexion, ordenId, datos);
    await recalcularTotales(conexion, ordenId);
    await conexion.commit();

    return await construirCarrito(conexion, ordenId);
  } catch (error) {
    if (conexion) await conexion.rollback();
    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const agregarItemAOrden = async (
  ordenId: number,
  datos: AgregarItemOrden,
) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const orden = await obtenerOrdenPorId(conexion, ordenId);
    validarOrdenActiva(orden);

    await guardarItem(conexion, ordenId, datos);
    await recalcularTotales(conexion, ordenId);
    await conexion.commit();

    return await construirCarrito(conexion, ordenId);
  } catch (error) {
    if (conexion) await conexion.rollback();
    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const actualizarItemCarrito = async (
  detalleId: number,
  datos: ActualizarItemCarrito,
) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const detalle = await obtenerDetalleConOrden(conexion, detalleId);

    if (!detalle) {
      throw new CarritoServiceError("Item de carrito no encontrado", 404);
    }

    if (detalle.ODV_ESTADO !== "ACTIVO") {
      throw new CarritoServiceError("El carrito ya no esta activo", 409);
    }

    if (datos.DOV_Cantidad <= 0) {
      throw new CarritoServiceError(
        "La cantidad del producto debe ser mayor a 0.",
        400,
      );
    }

    const precio = obtenerNumero(detalle.DOV_PRECIO_UNITARIO);
    const descuento = datos.DOV_Descuento ?? obtenerNumero(detalle.DOV_DESCUENTO);
    const subtotal = datos.DOV_Cantidad * precio - descuento;

    if (subtotal < 0) {
      throw new CarritoServiceError(
        "El descuento no puede superar el subtotal del item",
      );
    }

    try {
      await validarStockProductoSuficiente(
        conexion,
        obtenerNumero(detalle.PRO_PRODUCTO),
        datos.DOV_Cantidad,
      );
    } catch (error) {
      throw toCarritoError(error);
    }

    await conexion.execute(
      `UPDATE MUE_DETORDENVENTA
       SET    DOV_Cantidad = :cantidad,
              DOV_Descuento = :descuento,
              DOV_Subtotal = :subtotal
       WHERE  DOV_Det_Orden_Venta = :detalleId`,
      {
        cantidad: datos.DOV_Cantidad,
        descuento,
        subtotal,
        detalleId,
      },
    );

    const ordenId = obtenerNumero(detalle.ODV_ORDEN_VENTA);
    await recalcularTotales(conexion, ordenId);
    await conexion.commit();

    return await construirCarrito(conexion, ordenId);
  } catch (error) {
    if (conexion) await conexion.rollback();
    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const eliminarItemCarrito = async (detalleId: number) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const detalle = await obtenerDetalleConOrden(conexion, detalleId);

    if (!detalle) {
      throw new CarritoServiceError("Item de carrito no encontrado", 404);
    }

    if (detalle.ODV_ESTADO !== "ACTIVO") {
      throw new CarritoServiceError("El carrito ya no esta activo", 409);
    }

    const ordenId = obtenerNumero(detalle.ODV_ORDEN_VENTA);

    await conexion.execute(
      `DELETE FROM MUE_DETORDENVENTA
       WHERE DOV_Det_Orden_Venta = :detalleId`,
      { detalleId },
    );

    await recalcularTotales(conexion, ordenId);
    await conexion.commit();

    return await construirCarrito(conexion, ordenId);
  } catch (error) {
    if (conexion) await conexion.rollback();
    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const vaciarCarrito = async (ordenId: number) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const orden = await obtenerOrdenPorId(conexion, ordenId);
    validarOrdenActiva(orden);

    await conexion.execute(
      `DELETE FROM MUE_DETORDENVENTA
       WHERE ODV_Orden_Venta = :ordenId`,
      { ordenId },
    );

    await recalcularTotales(conexion, ordenId);
    await conexion.commit();

    return await construirCarrito(conexion, ordenId);
  } catch (error) {
    if (conexion) await conexion.rollback();
    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const finalizarCarrito = async (ordenId: number) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const orden = await obtenerOrdenPorId(conexion, ordenId);
    validarOrdenActiva(orden);

    const items = await obtenerItemsPorOrden(conexion, ordenId);

    if (items.length === 0) {
      throw new CarritoServiceError("No se puede finalizar un carrito vacio");
    }

    await conexion.execute(
      `UPDATE MUE_ORDENVENTA
       SET    ODV_Estado = 'FINALIZADO'
       WHERE  ODV_Orden_Venta = :ordenId`,
      { ordenId },
    );

    await conexion.commit();

    return await construirCarrito(conexion, ordenId);
  } catch (error) {
    if (conexion) await conexion.rollback();
    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};
