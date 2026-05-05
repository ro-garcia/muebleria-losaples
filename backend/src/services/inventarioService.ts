import type oracledb from "oracledb";

type Row = Record<string, unknown>;

export class InventarioServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

const toNumber = (value: unknown) => Number(value ?? 0);

const getFirstRow = <T extends Row>(rows: unknown): T | null => {
  const data = rows as T[] | undefined;
  return data && data.length > 0 ? data[0] : null;
};

export const obtenerStockProductoDisponible = async (
  connection: oracledb.Connection,
  productoId: number,
) => {
  const result = await connection.execute(
    `SELECT NVL(SUM(STP_Cantidad), 0) AS STOCK_DISPONIBLE
     FROM MUE_STOCK_PRODUCTO
     WHERE PRO_Producto = :productoId`,
    { productoId },
  );

  const row = getFirstRow(result.rows);
  return toNumber(row?.STOCK_DISPONIBLE);
};

export const obtenerStockMateriaPrimaDisponible = async (
  connection: oracledb.Connection,
  materiaPrimaId: number,
) => {
  const result = await connection.execute(
    `SELECT NVL(SUM(SMP_Cantidad), 0) AS STOCK_DISPONIBLE
     FROM MUE_STOCKMATPRIMA
     WHERE MAP_Materia_Prima = :materiaPrimaId`,
    { materiaPrimaId },
  );

  const row = getFirstRow(result.rows);
  return toNumber(row?.STOCK_DISPONIBLE);
};

export const validarStockProductoSuficiente = async (
  connection: oracledb.Connection,
  productoId: number,
  cantidadRequerida: number,
) => {
  const disponible = await obtenerStockProductoDisponible(connection, productoId);

  if (cantidadRequerida > disponible) {
    throw new InventarioServiceError(
      `Stock insuficiente para el producto ${productoId}. Disponible: ${disponible}.`,
      409,
    );
  }
};

export const validarStockMateriaPrimaSuficiente = async (
  connection: oracledb.Connection,
  materiaPrimaId: number,
  cantidadRequerida: number,
) => {
  const disponible = await obtenerStockMateriaPrimaDisponible(
    connection,
    materiaPrimaId,
  );

  if (cantidadRequerida > disponible) {
    throw new InventarioServiceError(
      `Materia prima insuficiente (${materiaPrimaId}). Disponible: ${disponible}.`,
      409,
    );
  }
};

const descontarDesdeFilas = async (
  connection: oracledb.Connection,
  query: string,
  updateQuery: string,
  bindKey: string,
  bindValue: number,
  cantidad: number,
) => {
  const result = await connection.execute(
    query,
    { [bindKey]: bindValue },
  );

  const rows = (result.rows ?? []) as Row[];
  let restante = cantidad;

  for (const row of rows) {
    if (restante <= 0) {
      break;
    }

    const rowId =
      toNumber(row.STP_STOCK_PRODUCTO) ||
      toNumber(row.SMP_STOCK_MAT_PRIMA);
    const actual = toNumber(row.STP_CANTIDAD ?? row.SMP_CANTIDAD);
    if (actual <= 0) {
      continue;
    }

    const descuento = Math.min(actual, restante);
    const nuevoValor = actual - descuento;

    await connection.execute(updateQuery, {
      id: rowId,
      cantidad: nuevoValor,
    });

    restante -= descuento;
  }

  if (restante > 0) {
    throw new InventarioServiceError(
      "No fue posible descontar la cantidad completa del inventario.",
      409,
    );
  }
};

export const descontarStockProducto = async (
  connection: oracledb.Connection,
  productoId: number,
  cantidad: number,
) => {
  await validarStockProductoSuficiente(connection, productoId, cantidad);

  await descontarDesdeFilas(
    connection,
    `SELECT STP_Stock_Producto, STP_Cantidad
     FROM MUE_STOCK_PRODUCTO
     WHERE PRO_Producto = :productoId
     ORDER BY STP_Stock_Producto`,
    `UPDATE MUE_STOCK_PRODUCTO
     SET STP_Cantidad = :cantidad,
         STP_Ultima_Actualizacion = SYSDATE
     WHERE STP_Stock_Producto = :id`,
    "productoId",
    productoId,
    cantidad,
  );
};

export const descontarStockMateriaPrima = async (
  connection: oracledb.Connection,
  materiaPrimaId: number,
  cantidad: number,
) => {
  await validarStockMateriaPrimaSuficiente(connection, materiaPrimaId, cantidad);

  await descontarDesdeFilas(
    connection,
    `SELECT SMP_Stock_Mat_Prima, SMP_Cantidad
     FROM MUE_STOCKMATPRIMA
     WHERE MAP_Materia_Prima = :materiaPrimaId
     ORDER BY SMP_Stock_Mat_Prima`,
    `UPDATE MUE_STOCKMATPRIMA
     SET SMP_Cantidad = :cantidad,
         SMP_Ultima_Actualizacion = SYSDATE
     WHERE SMP_Stock_Mat_Prima = :id`,
    "materiaPrimaId",
    materiaPrimaId,
    cantidad,
  );
};

const obtenerPrimerAlmacenActivo = async (connection: oracledb.Connection) => {
  const result = await connection.execute(
    `SELECT ALM_almacen
     FROM MUE_ALMACEN
     WHERE ALM_Estado = 'ACTIVO'
     ORDER BY ALM_almacen
     FETCH FIRST 1 ROW ONLY`,
  );

  const row = getFirstRow(result.rows);
  return toNumber(row?.ALM_ALMACEN);
};

export const acreditarStockProducto = async (
  connection: oracledb.Connection,
  productoId: number,
  cantidad: number,
  almacenId?: number | null,
) => {
  let destinoAlmacen = almacenId ? Number(almacenId) : 0;

  if (destinoAlmacen <= 0) {
    const existing = await connection.execute(
      `SELECT STP_Stock_Producto, ALM_almacen
       FROM MUE_STOCK_PRODUCTO
       WHERE PRO_Producto = :productoId
       ORDER BY STP_Stock_Producto
       FETCH FIRST 1 ROW ONLY`,
      { productoId },
    );

    const row = getFirstRow(existing.rows);
    destinoAlmacen = toNumber(row?.ALM_ALMACEN);
  }

  if (destinoAlmacen <= 0) {
    destinoAlmacen = await obtenerPrimerAlmacenActivo(connection);
  }

  if (destinoAlmacen <= 0) {
    throw new InventarioServiceError(
      "No existe un almacen activo para acreditar el producto terminado.",
      409,
    );
  }

  const existing = await connection.execute(
    `SELECT STP_Stock_Producto, STP_Cantidad
     FROM MUE_STOCK_PRODUCTO
     WHERE ALM_almacen = :almacenId
       AND PRO_Producto = :productoId
     FETCH FIRST 1 ROW ONLY`,
    {
      almacenId: destinoAlmacen,
      productoId,
    },
  );

  const row = getFirstRow(existing.rows);
  if (row) {
    await connection.execute(
      `UPDATE MUE_STOCK_PRODUCTO
       SET STP_Cantidad = :cantidad,
           STP_Ultima_Actualizacion = SYSDATE
       WHERE STP_Stock_Producto = :id`,
      {
        id: toNumber(row.STP_STOCK_PRODUCTO),
        cantidad: toNumber(row.STP_CANTIDAD) + cantidad,
      },
    );
    return;
  }

  await connection.execute(
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
       0,
       NULL,
       SYSDATE
     )`,
    {
      almacenId: destinoAlmacen,
      productoId,
      cantidad,
    },
  );
};
