import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";
import {
  acreditarStockProducto,
  descontarStockMateriaPrima,
  validarStockMateriaPrimaSuficiente,
} from "./inventarioService";

type Row = Record<string, unknown>;

export interface NuevaOrdenProduccion {
  PRO_Producto: number;
  EMP_Empleado: number;
  OPR_Cantidad_Programada: number;
  OPR_Cantidad_Producida?: number | null;
  OPR_Fecha_Inicio?: string | null;
  OPR_Fecha_Fin?: string | null;
  OPR_Estado?: string;
}

export interface NuevoDetalleOrdenProduccion {
  MAP_Materia_Prima: number;
  DOP_Cantidad_Requerida: number;
  DOP_Cantidad_Utilizada?: number | null;
}

export class OrdenProduccionServiceError extends Error {
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

const validarOrdenPayload = (datos: NuevaOrdenProduccion) => {
  if (datos.OPR_Cantidad_Programada <= 0) {
    throw new OrdenProduccionServiceError(
      "La cantidad programada debe ser mayor a 0.",
      400,
    );
  }

  if (
    datos.OPR_Cantidad_Producida != null &&
    datos.OPR_Cantidad_Producida < 0
  ) {
    throw new OrdenProduccionServiceError(
      "La cantidad producida no puede ser negativa.",
      400,
    );
  }
};

const validarDetallePayload = (datos: NuevoDetalleOrdenProduccion) => {
  if (datos.DOP_Cantidad_Requerida <= 0) {
    throw new OrdenProduccionServiceError(
      "La cantidad requerida debe ser mayor a 0.",
      400,
    );
  }

  if (
    datos.DOP_Cantidad_Utilizada != null &&
    datos.DOP_Cantidad_Utilizada < 0
  ) {
    throw new OrdenProduccionServiceError(
      "La cantidad utilizada no puede ser negativa.",
      400,
    );
  }
};

export const obtenerOrdenesProduccion = async (filters?: {
  estado?: string;
  productoId?: number;
}) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT op.OPR_Ordenproduccion, op.PRO_Producto, op.EMP_Empleado,
              op.OPR_Fecha_Creacion, op.OPR_Fecha_Inicio, op.OPR_Fecha_Fin,
              op.OPR_Cantidad_Programada, op.OPR_Cantidad_Producida,
              op.OPR_Estado,
              p.PRO_Codigo, p.PRO_Nombre,
              TRIM(
                per.PER_Nombre || ' ' ||
                per.PER_Primer_Apellido || ' ' ||
                NVL(per.PER_Segundo_Apellido, '')
              ) AS EMPLEADO_NOMBRE,
              (
                SELECT COUNT(*)
                FROM MUE_DETALLEORDENPRODUCCION dop
                WHERE dop.OPR_Ordenproduccion = op.OPR_Ordenproduccion
              ) AS TOTAL_DETALLES
       FROM MUE_ORDENPRODUCCION op
       JOIN MUE_PRODUCTO p
         ON p.PRO_Producto = op.PRO_Producto
       JOIN MUE_EMPLEADO emp
         ON emp.EMP_Empleado = op.EMP_Empleado
       JOIN MUE_PERSONA per
         ON per.PER_Persona = emp.PER_Persona
       WHERE (:estado IS NULL OR op.OPR_Estado = :estado)
         AND (:productoId IS NULL OR op.PRO_Producto = :productoId)
       ORDER BY op.OPR_Ordenproduccion DESC`,
      {
        estado: filters?.estado ?? null,
        productoId: filters?.productoId ?? null,
      },
    );
    return resultado.rows ?? [];
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerOrdenProduccionPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT OPR_Ordenproduccion, PRO_Producto, EMP_Empleado,
              OPR_Fecha_Creacion, OPR_Fecha_Inicio, OPR_Fecha_Fin,
              OPR_Cantidad_Programada, OPR_Cantidad_Producida,
              OPR_Estado
       FROM MUE_ORDENPRODUCCION
       WHERE OPR_Ordenproduccion = :id`,
      { id },
    );
    return getFirstRow(resultado.rows);
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerDetalleOrdenProduccion = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();

    const ordenResult = await conexion.execute(
      `SELECT op.OPR_Ordenproduccion, op.PRO_Producto, op.EMP_Empleado,
              op.OPR_Fecha_Creacion, op.OPR_Fecha_Inicio, op.OPR_Fecha_Fin,
              op.OPR_Cantidad_Programada, op.OPR_Cantidad_Producida,
              op.OPR_Estado,
              p.PRO_Codigo, p.PRO_Nombre,
              TRIM(
                per.PER_Nombre || ' ' ||
                per.PER_Primer_Apellido || ' ' ||
                NVL(per.PER_Segundo_Apellido, '')
              ) AS EMPLEADO_NOMBRE
       FROM MUE_ORDENPRODUCCION op
       JOIN MUE_PRODUCTO p
         ON p.PRO_Producto = op.PRO_Producto
       JOIN MUE_EMPLEADO emp
         ON emp.EMP_Empleado = op.EMP_Empleado
       JOIN MUE_PERSONA per
         ON per.PER_Persona = emp.PER_Persona
       WHERE op.OPR_Ordenproduccion = :id`,
      { id },
    );

    const orden = getFirstRow(ordenResult.rows);
    if (!orden) {
      return null;
    }

    const detallesResult = await conexion.execute(
      `SELECT dop.DOP_Detalle_OrdenProduccion, dop.OPR_Ordenproduccion,
              dop.MAP_Materia_Prima, dop.DOP_Cantidad_Requerida,
              dop.DOP_Cantidad_Utilizada,
              mp.MAP_Nombre, mp.MAP_Unidad_Medida, mp.MAP_Costo_Referencial,
              (
                SELECT NVL(SUM(smp.SMP_Cantidad), 0)
                FROM MUE_STOCKMATPRIMA smp
                WHERE smp.MAP_Materia_Prima = dop.MAP_Materia_Prima
              ) AS STOCK_DISPONIBLE
       FROM MUE_DETALLEORDENPRODUCCION dop
       JOIN MUE_MATERIA_PRIMA mp
         ON mp.MAP_Materia_Prima = dop.MAP_Materia_Prima
       WHERE dop.OPR_Ordenproduccion = :id
       ORDER BY dop.DOP_Detalle_OrdenProduccion`,
      { id },
    );

    return {
      orden,
      detalles: detallesResult.rows ?? [],
    };
  } finally {
    if (conexion) await conexion.close();
  }
};

export const crearOrdenProduccion = async (datos: NuevaOrdenProduccion) => {
  validarOrdenPayload(datos);

  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_ORDENPRODUCCION (
         PRO_Producto,
         EMP_Empleado,
         OPR_Fecha_Inicio,
         OPR_Fecha_Fin,
         OPR_Cantidad_Programada,
         OPR_Cantidad_Producida,
         OPR_Estado
       ) VALUES (
         :productoId,
         :empleadoId,
         CASE
           WHEN :fechaInicio IS NULL THEN NULL
           ELSE TO_DATE(:fechaInicio, 'YYYY-MM-DD')
         END,
         CASE
           WHEN :fechaFin IS NULL THEN NULL
           ELSE TO_DATE(:fechaFin, 'YYYY-MM-DD')
         END,
         :cantidadProgramada,
         :cantidadProducida,
         :estado
       )
       RETURNING OPR_Ordenproduccion INTO :id`,
      {
        productoId: datos.PRO_Producto,
        empleadoId: datos.EMP_Empleado,
        fechaInicio: datos.OPR_Fecha_Inicio ?? null,
        fechaFin: datos.OPR_Fecha_Fin ?? null,
        cantidadProgramada: datos.OPR_Cantidad_Programada,
        cantidadProducida: datos.OPR_Cantidad_Producida ?? 0,
        estado: datos.OPR_Estado ?? "ACTIVO",
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );
    const outBinds = resultado.outBinds as { id: number[] };
    return { OPR_Ordenproduccion: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

export const actualizarOrdenProduccion = async (
  id: number,
  datos: NuevaOrdenProduccion,
) => {
  validarOrdenPayload(datos);

  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_ORDENPRODUCCION SET
         PRO_Producto = :productoId,
         EMP_Empleado = :empleadoId,
         OPR_Fecha_Inicio = CASE
           WHEN :fechaInicio IS NULL THEN NULL
           ELSE TO_DATE(:fechaInicio, 'YYYY-MM-DD')
         END,
         OPR_Fecha_Fin = CASE
           WHEN :fechaFin IS NULL THEN NULL
           ELSE TO_DATE(:fechaFin, 'YYYY-MM-DD')
         END,
         OPR_Cantidad_Programada = :cantidadProgramada,
         OPR_Cantidad_Producida = :cantidadProducida,
         OPR_Estado = :estado
       WHERE OPR_Ordenproduccion = :id`,
      {
        productoId: datos.PRO_Producto,
        empleadoId: datos.EMP_Empleado,
        fechaInicio: datos.OPR_Fecha_Inicio ?? null,
        fechaFin: datos.OPR_Fecha_Fin ?? null,
        cantidadProgramada: datos.OPR_Cantidad_Programada,
        cantidadProducida: datos.OPR_Cantidad_Producida ?? 0,
        estado: datos.OPR_Estado ?? "ACTIVO",
        id,
      },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const cambiarEstadoOrdenProduccion = async (
  id: number,
  estado: string,
) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_ORDENPRODUCCION
       SET OPR_Estado = :estado
       WHERE OPR_Ordenproduccion = :id`,
      { estado, id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const crearDetalleOrdenProduccion = async (
  ordenId: number,
  datos: NuevoDetalleOrdenProduccion,
) => {
  validarDetallePayload(datos);

  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_DETALLEORDENPRODUCCION (
         OPR_Ordenproduccion,
         MAP_Materia_Prima,
         DOP_Cantidad_Requerida,
         DOP_Cantidad_Utilizada
       ) VALUES (
         :ordenId,
         :materiaPrimaId,
         :cantidadRequerida,
         :cantidadUtilizada
       )
       RETURNING DOP_Detalle_OrdenProduccion INTO :id`,
      {
        ordenId,
        materiaPrimaId: datos.MAP_Materia_Prima,
        cantidadRequerida: datos.DOP_Cantidad_Requerida,
        cantidadUtilizada: datos.DOP_Cantidad_Utilizada ?? null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );

    const outBinds = resultado.outBinds as { id: number[] };
    return { DOP_Detalle_OrdenProduccion: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

export const actualizarDetalleOrdenProduccion = async (
  detalleId: number,
  datos: NuevoDetalleOrdenProduccion,
) => {
  validarDetallePayload(datos);

  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_DETALLEORDENPRODUCCION SET
         MAP_Materia_Prima = :materiaPrimaId,
         DOP_Cantidad_Requerida = :cantidadRequerida,
         DOP_Cantidad_Utilizada = :cantidadUtilizada
       WHERE DOP_Detalle_OrdenProduccion = :detalleId`,
      {
        materiaPrimaId: datos.MAP_Materia_Prima,
        cantidadRequerida: datos.DOP_Cantidad_Requerida,
        cantidadUtilizada: datos.DOP_Cantidad_Utilizada ?? null,
        detalleId,
      },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const eliminarDetalleOrdenProduccion = async (detalleId: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `DELETE FROM MUE_DETALLEORDENPRODUCCION
       WHERE DOP_Detalle_OrdenProduccion = :detalleId`,
      { detalleId },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const finalizarOrdenProduccion = async (
  id: number,
  almacenId?: number | null,
) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();

    const detalle = await obtenerDetalleOrdenProduccion(id);
    if (!detalle) {
      throw new OrdenProduccionServiceError(
        "Orden de produccion no encontrada.",
        404,
      );
    }

    const orden = detalle.orden;
    if (String(orden.OPR_ESTADO ?? "ACTIVO") === "FINALIZADO") {
      throw new OrdenProduccionServiceError(
        "La orden de produccion ya fue finalizada.",
        409,
      );
    }

    const detalles = detalle.detalles as Row[];
    if (detalles.length === 0) {
      throw new OrdenProduccionServiceError(
        "La orden de produccion no tiene materias primas asociadas.",
        409,
      );
    }

    for (const item of detalles) {
      const cantidad = toNumber(
        item.DOP_CANTIDAD_UTILIZADA ?? item.DOP_CANTIDAD_REQUERIDA,
      );
      await validarStockMateriaPrimaSuficiente(
        conexion,
        toNumber(item.MAP_MATERIA_PRIMA),
        cantidad,
      );
    }

    for (const item of detalles) {
      const cantidad = toNumber(
        item.DOP_CANTIDAD_UTILIZADA ?? item.DOP_CANTIDAD_REQUERIDA,
      );
      await descontarStockMateriaPrima(
        conexion,
        toNumber(item.MAP_MATERIA_PRIMA),
        cantidad,
      );
    }

    const cantidadProducida =
      toNumber(orden.OPR_CANTIDAD_PRODUCIDA) > 0
        ? toNumber(orden.OPR_CANTIDAD_PRODUCIDA)
        : toNumber(orden.OPR_CANTIDAD_PROGRAMADA);

    if (cantidadProducida <= 0) {
      throw new OrdenProduccionServiceError(
        "La orden no tiene una cantidad producida valida.",
        409,
      );
    }

    await acreditarStockProducto(
      conexion,
      toNumber(orden.PRO_PRODUCTO),
      cantidadProducida,
      almacenId ?? null,
    );

    await conexion.execute(
      `UPDATE MUE_ORDENPRODUCCION
       SET OPR_Cantidad_Producida = :cantidadProducida,
           OPR_Fecha_Fin = SYSDATE,
           OPR_Estado = 'FINALIZADO'
       WHERE OPR_Ordenproduccion = :id`,
      {
        cantidadProducida,
        id,
      },
      { autoCommit: false },
    );

    await conexion.commit();

    return obtenerDetalleOrdenProduccion(id);
  } catch (error) {
    if (conexion) {
      try {
        await conexion.rollback();
      } catch {}
    }
    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};
