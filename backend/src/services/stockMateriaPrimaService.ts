import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

type Row = Record<string, unknown>;

export interface NuevoStockMateriaPrima {
  MAP_Materia_Prima: number;
  SMP_Cantidad: number;
  SMP_Stock_Minimo?: number | null;
  SMP_Stock_Maximo?: number | null;
}

export class StockMateriaPrimaServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

const getFirstRow = (rows: unknown) => {
  const data = rows as Row[] | undefined;
  return data && data.length > 0 ? data[0] : null;
};

const validarPayload = (datos: NuevoStockMateriaPrima) => {
  if (datos.SMP_Cantidad < 0) {
    throw new StockMateriaPrimaServiceError(
      "La cantidad de materia prima no puede ser negativa.",
      400,
    );
  }

  if (
    datos.SMP_Stock_Minimo != null &&
    datos.SMP_Stock_Maximo != null &&
    datos.SMP_Stock_Minimo > datos.SMP_Stock_Maximo
  ) {
    throw new StockMateriaPrimaServiceError(
      "El stock minimo no puede ser mayor al stock maximo.",
      400,
    );
  }
};

const asegurarUnicidad = async (
  connection: oracledb.Connection,
  materiaPrimaId: number,
  stockId?: number,
) => {
  const result = await connection.execute(
    `SELECT SMP_Stock_Mat_Prima
     FROM MUE_STOCKMATPRIMA
     WHERE MAP_Materia_Prima = :materiaPrimaId
       AND (:stockId IS NULL OR SMP_Stock_Mat_Prima <> :stockId)
     FETCH FIRST 1 ROW ONLY`,
    {
      materiaPrimaId,
      stockId: stockId ?? null,
    },
  );

  if (getFirstRow(result.rows)) {
    throw new StockMateriaPrimaServiceError(
      "Ya existe un stock registrado para esa materia prima.",
      409,
    );
  }
};

export const obtenerStockMateriasPrimas = async (filters?: {
  materiaPrimaId?: number;
}) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT smp.SMP_Stock_Mat_Prima, smp.MAP_Materia_Prima,
              smp.SMP_Cantidad, smp.SMP_Stock_Minimo, smp.SMP_Stock_Maximo,
              smp.SMP_Ultima_Actualizacion,
              mp.MAP_Nombre, mp.MAP_Unidad_Medida, mp.MAP_Costo_Referencial,
              mp.MAP_Estado,
              CASE
                WHEN smp.SMP_Stock_Minimo IS NOT NULL
                 AND smp.SMP_Cantidad < smp.SMP_Stock_Minimo
                THEN 1
                ELSE 0
              END AS STOCK_BAJO
       FROM MUE_STOCKMATPRIMA smp
       JOIN MUE_MATERIA_PRIMA mp
         ON mp.MAP_Materia_Prima = smp.MAP_Materia_Prima
       WHERE (:materiaPrimaId IS NULL OR smp.MAP_Materia_Prima = :materiaPrimaId)
       ORDER BY mp.MAP_Nombre`,
      { materiaPrimaId: filters?.materiaPrimaId ?? null },
    );
    return resultado.rows ?? [];
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerStockMateriaPrimaPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT smp.SMP_Stock_Mat_Prima, smp.MAP_Materia_Prima,
              smp.SMP_Cantidad, smp.SMP_Stock_Minimo, smp.SMP_Stock_Maximo,
              smp.SMP_Ultima_Actualizacion,
              mp.MAP_Nombre, mp.MAP_Unidad_Medida, mp.MAP_Costo_Referencial,
              mp.MAP_Estado
       FROM MUE_STOCKMATPRIMA smp
       JOIN MUE_MATERIA_PRIMA mp
         ON mp.MAP_Materia_Prima = smp.MAP_Materia_Prima
       WHERE smp.SMP_Stock_Mat_Prima = :id`,
      { id },
    );
    return getFirstRow(resultado.rows);
  } finally {
    if (conexion) await conexion.close();
  }
};

export const crearStockMateriaPrima = async (datos: NuevoStockMateriaPrima) => {
  validarPayload(datos);

  let conexion;
  try {
    conexion = await getDatabaseConnection();
    await asegurarUnicidad(conexion, datos.MAP_Materia_Prima);

    const resultado = await conexion.execute(
      `INSERT INTO MUE_STOCKMATPRIMA (
         MAP_Materia_Prima,
         SMP_Cantidad,
         SMP_Stock_Minimo,
         SMP_Stock_Maximo,
         SMP_Ultima_Actualizacion
       ) VALUES (
         :materiaPrimaId,
         :cantidad,
         :stockMinimo,
         :stockMaximo,
         SYSDATE
       )
       RETURNING SMP_Stock_Mat_Prima INTO :id`,
      {
        materiaPrimaId: datos.MAP_Materia_Prima,
        cantidad: datos.SMP_Cantidad,
        stockMinimo: datos.SMP_Stock_Minimo ?? null,
        stockMaximo: datos.SMP_Stock_Maximo ?? null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );

    const outBinds = resultado.outBinds as { id: number[] };
    return { SMP_Stock_Mat_Prima: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

export const actualizarStockMateriaPrima = async (
  id: number,
  datos: NuevoStockMateriaPrima,
) => {
  validarPayload(datos);

  let conexion;
  try {
    conexion = await getDatabaseConnection();
    await asegurarUnicidad(conexion, datos.MAP_Materia_Prima, id);

    const resultado = await conexion.execute(
      `UPDATE MUE_STOCKMATPRIMA SET
         MAP_Materia_Prima = :materiaPrimaId,
         SMP_Cantidad = :cantidad,
         SMP_Stock_Minimo = :stockMinimo,
         SMP_Stock_Maximo = :stockMaximo,
         SMP_Ultima_Actualizacion = SYSDATE
       WHERE SMP_Stock_Mat_Prima = :id`,
      {
        materiaPrimaId: datos.MAP_Materia_Prima,
        cantidad: datos.SMP_Cantidad,
        stockMinimo: datos.SMP_Stock_Minimo ?? null,
        stockMaximo: datos.SMP_Stock_Maximo ?? null,
        id,
      },
      { autoCommit: true },
    );

    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const eliminarStockMateriaPrima = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `DELETE FROM MUE_STOCKMATPRIMA
       WHERE SMP_Stock_Mat_Prima = :id`,
      { id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};
