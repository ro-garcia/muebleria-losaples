import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

type Row = Record<string, unknown>;

export interface NuevoPrecioProducto {
  PRO_Producto: number;
  PRE_Precio: number;
  PRE_Fecha_Inicio: string;
  PRE_Fecha_Fin?: string | null;
}

export class PrecioProductoServiceError extends Error {
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

const validarPayload = (datos: NuevoPrecioProducto) => {
  if (datos.PRE_Precio < 0) {
    throw new PrecioProductoServiceError(
      "El precio del producto no puede ser negativo.",
      400,
    );
  }

  if (!datos.PRE_Fecha_Inicio) {
    throw new PrecioProductoServiceError(
      "La fecha de inicio del precio es requerida.",
      400,
    );
  }

  if (datos.PRE_Fecha_Fin && datos.PRE_Fecha_Fin < datos.PRE_Fecha_Inicio) {
    throw new PrecioProductoServiceError(
      "La fecha fin no puede ser menor a la fecha inicio.",
      400,
    );
  }
};

export const obtenerPreciosProducto = async (productoId?: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT pp.PRE_Precio_Producto, pp.PRO_Producto, pp.PRE_Precio,
              pp.PRE_Fecha_Inicio, pp.PRE_Fecha_Fin,
              p.PRO_Codigo, p.PRO_Nombre,
              CASE
                WHEN pp.PRE_Fecha_Inicio <= TRUNC(SYSDATE)
                 AND (pp.PRE_Fecha_Fin IS NULL OR pp.PRE_Fecha_Fin >= TRUNC(SYSDATE))
                THEN 1
                ELSE 0
              END AS ES_VIGENTE
       FROM MUE_PRECIOPRODUCTO pp
       JOIN MUE_PRODUCTO p
         ON p.PRO_Producto = pp.PRO_Producto
       WHERE (:productoId IS NULL OR pp.PRO_Producto = :productoId)
       ORDER BY p.PRO_Nombre, pp.PRE_Fecha_Inicio DESC, pp.PRE_Precio_Producto DESC`,
      { productoId: productoId ?? null },
    );
    return resultado.rows ?? [];
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerPrecioProductoPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT PRE_Precio_Producto, PRO_Producto, PRE_Precio,
              PRE_Fecha_Inicio, PRE_Fecha_Fin
       FROM MUE_PRECIOPRODUCTO
       WHERE PRE_Precio_Producto = :id`,
      { id },
    );
    return getFirstRow(resultado.rows);
  } finally {
    if (conexion) await conexion.close();
  }
};

export const crearPrecioProducto = async (datos: NuevoPrecioProducto) => {
  validarPayload(datos);

  let conexion;
  try {
    conexion = await getDatabaseConnection();

    if (!datos.PRE_Fecha_Fin) {
      await conexion.execute(
        `UPDATE MUE_PRECIOPRODUCTO
         SET PRE_Fecha_Fin = TO_DATE(:fechaInicio, 'YYYY-MM-DD') - 1
         WHERE PRO_Producto = :productoId
           AND (PRE_Fecha_Fin IS NULL OR PRE_Fecha_Fin >= TO_DATE(:fechaInicio, 'YYYY-MM-DD'))`,
        {
          productoId: datos.PRO_Producto,
          fechaInicio: datos.PRE_Fecha_Inicio,
        },
        { autoCommit: false },
      );
    }

    const resultado = await conexion.execute(
      `INSERT INTO MUE_PRECIOPRODUCTO (
         PRO_Producto,
         PRE_Precio,
         PRE_Fecha_Inicio,
         PRE_Fecha_Fin
       ) VALUES (
         :productoId,
         :precio,
         TO_DATE(:fechaInicio, 'YYYY-MM-DD'),
         CASE
           WHEN :fechaFin IS NULL THEN NULL
           ELSE TO_DATE(:fechaFin, 'YYYY-MM-DD')
         END
       )
       RETURNING PRE_Precio_Producto INTO :id`,
      {
        productoId: datos.PRO_Producto,
        precio: datos.PRE_Precio,
        fechaInicio: datos.PRE_Fecha_Inicio,
        fechaFin: datos.PRE_Fecha_Fin ?? null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );

    const outBinds = resultado.outBinds as { id: number[] };
    return { PRE_Precio_Producto: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

export const actualizarPrecioProducto = async (
  id: number,
  datos: NuevoPrecioProducto,
) => {
  validarPayload(datos);

  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_PRECIOPRODUCTO SET
         PRO_Producto = :productoId,
         PRE_Precio = :precio,
         PRE_Fecha_Inicio = TO_DATE(:fechaInicio, 'YYYY-MM-DD'),
         PRE_Fecha_Fin = CASE
           WHEN :fechaFin IS NULL THEN NULL
           ELSE TO_DATE(:fechaFin, 'YYYY-MM-DD')
         END
       WHERE PRE_Precio_Producto = :id`,
      {
        productoId: datos.PRO_Producto,
        precio: datos.PRE_Precio,
        fechaInicio: datos.PRE_Fecha_Inicio,
        fechaFin: datos.PRE_Fecha_Fin ?? null,
        id,
      },
      { autoCommit: true },
    );

    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const eliminarPrecioProducto = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `DELETE FROM MUE_PRECIOPRODUCTO
       WHERE PRE_Precio_Producto = :id`,
      { id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};
