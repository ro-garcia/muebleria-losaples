import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";
import { obtenerStockProductoDisponible } from "./inventarioService";

type Row = Record<string, unknown>;

export interface NuevoStockProducto {
  ALM_almacen: number;
  PRO_Producto: number;
  STP_Cantidad: number;
  STP_Stock_Minimo?: number | null;
  STP_Stock_Maximo?: number | null;
}

export class StockProductoServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

const toNumber = (value: unknown) => Number(value ?? 0);

const getFirstRow = (rows: unknown) => {
  const data = rows as Row[] | undefined;
  return data && data.length > 0 ? data[0] : null;
};

const validarPayload = (datos: NuevoStockProducto) => {
  if (datos.STP_Cantidad < 0) {
    throw new StockProductoServiceError(
      "La cantidad del stock del producto no puede ser negativa.",
      400,
    );
  }

  if (
    datos.STP_Stock_Minimo != null &&
    datos.STP_Stock_Maximo != null &&
    datos.STP_Stock_Minimo > datos.STP_Stock_Maximo
  ) {
    throw new StockProductoServiceError(
      "El stock minimo no puede ser mayor al stock maximo.",
      400,
    );
  }
};

const asegurarUnicidad = async (
  connection: oracledb.Connection,
  datos: NuevoStockProducto,
  stockId?: number,
) => {
  const result = await connection.execute(
    `SELECT STP_Stock_Producto
     FROM MUE_STOCK_PRODUCTO
     WHERE ALM_almacen = :almacenId
       AND PRO_Producto = :productoId
       AND (:stockId IS NULL OR STP_Stock_Producto <> :stockId)
     FETCH FIRST 1 ROW ONLY`,
    {
      almacenId: datos.ALM_almacen,
      productoId: datos.PRO_Producto,
      stockId: stockId ?? null,
    },
  );

  if (getFirstRow(result.rows)) {
    throw new StockProductoServiceError(
      "Ya existe un registro de stock para ese producto en el almacen seleccionado.",
      409,
    );
  }
};

export const obtenerStockProductos = async (filters?: {
  productoId?: number;
  almacenId?: number;
}) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT sp.STP_Stock_Producto, sp.ALM_almacen, sp.PRO_Producto,
              sp.STP_Cantidad, sp.STP_Stock_Minimo, sp.STP_Stock_Maximo,
              sp.STP_Ultima_Actualizacion,
              a.ALM_Nombre, a.ALM_Estado,
              p.PRO_Codigo, p.PRO_Nombre, p.PRO_Estado,
              CASE
                WHEN sp.STP_Stock_Minimo IS NOT NULL
                 AND sp.STP_Cantidad < sp.STP_Stock_Minimo
                THEN 1
                ELSE 0
              END AS STOCK_BAJO
       FROM MUE_STOCK_PRODUCTO sp
       JOIN MUE_ALMACEN a
         ON a.ALM_almacen = sp.ALM_almacen
       JOIN MUE_PRODUCTO p
         ON p.PRO_Producto = sp.PRO_Producto
       WHERE (:productoId IS NULL OR sp.PRO_Producto = :productoId)
         AND (:almacenId IS NULL OR sp.ALM_almacen = :almacenId)
       ORDER BY p.PRO_Nombre, a.ALM_Nombre`,
      {
        productoId: filters?.productoId ?? null,
        almacenId: filters?.almacenId ?? null,
      },
    );
    return resultado.rows ?? [];
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerStockProductoPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT sp.STP_Stock_Producto, sp.ALM_almacen, sp.PRO_Producto,
              sp.STP_Cantidad, sp.STP_Stock_Minimo, sp.STP_Stock_Maximo,
              sp.STP_Ultima_Actualizacion,
              a.ALM_Nombre, a.ALM_Estado,
              p.PRO_Codigo, p.PRO_Nombre, p.PRO_Estado
       FROM MUE_STOCK_PRODUCTO sp
       JOIN MUE_ALMACEN a
         ON a.ALM_almacen = sp.ALM_almacen
       JOIN MUE_PRODUCTO p
         ON p.PRO_Producto = sp.PRO_Producto
       WHERE sp.STP_Stock_Producto = :id`,
      { id },
    );
    return getFirstRow(resultado.rows);
  } finally {
    if (conexion) await conexion.close();
  }
};

export const crearStockProducto = async (datos: NuevoStockProducto) => {
  validarPayload(datos);

  let conexion;
  try {
    conexion = await getDatabaseConnection();
    await asegurarUnicidad(conexion, datos);

    const resultado = await conexion.execute(
      `INSERT INTO MUE_STOCK_PRODUCTO (
         ALM_almacen,
         PRO_Producto,
         STP_Cantidad,
         STP_Stock_Minimo,
         STP_Stock_Maximo,
         STP_Ultima_Actualizacion
       ) VALUES (
         :almacenId,
         :productoId,
         :cantidad,
         :stockMinimo,
         :stockMaximo,
         SYSDATE
       )
       RETURNING STP_Stock_Producto INTO :id`,
      {
        almacenId: datos.ALM_almacen,
        productoId: datos.PRO_Producto,
        cantidad: datos.STP_Cantidad,
        stockMinimo: datos.STP_Stock_Minimo ?? null,
        stockMaximo: datos.STP_Stock_Maximo ?? null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );

    const outBinds = resultado.outBinds as { id: number[] };
    return { STP_Stock_Producto: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

export const actualizarStockProducto = async (
  id: number,
  datos: NuevoStockProducto,
) => {
  validarPayload(datos);

  let conexion;
  try {
    conexion = await getDatabaseConnection();
    await asegurarUnicidad(conexion, datos, id);

    const resultado = await conexion.execute(
      `UPDATE MUE_STOCK_PRODUCTO SET
         ALM_almacen = :almacenId,
         PRO_Producto = :productoId,
         STP_Cantidad = :cantidad,
         STP_Stock_Minimo = :stockMinimo,
         STP_Stock_Maximo = :stockMaximo,
         STP_Ultima_Actualizacion = SYSDATE
       WHERE STP_Stock_Producto = :id`,
      {
        almacenId: datos.ALM_almacen,
        productoId: datos.PRO_Producto,
        cantidad: datos.STP_Cantidad,
        stockMinimo: datos.STP_Stock_Minimo ?? null,
        stockMaximo: datos.STP_Stock_Maximo ?? null,
        id,
      },
      { autoCommit: true },
    );

    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const eliminarStockProducto = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `DELETE FROM MUE_STOCK_PRODUCTO
       WHERE STP_Stock_Producto = :id`,
      { id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerResumenStockProducto = async (productoId: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    return obtenerStockProductoDisponible(conexion, productoId);
  } finally {
    if (conexion) await conexion.close();
  }
};
