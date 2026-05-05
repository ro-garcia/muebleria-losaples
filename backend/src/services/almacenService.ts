import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

type Row = Record<string, unknown>;

export interface NuevoAlmacen {
  ALM_Nombre: string;
  ALM_Departamento?: string | null;
  ALM_Municipio?: string | null;
  ALM_Zona_Aldea?: string | null;
  ALM_Domicilio?: string | null;
  ALM_Telefono?: string | null;
  ALM_Estado?: string;
}

export class AlmacenServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

const toRow = (rows: unknown) => {
  const data = rows as Row[] | undefined;
  return data && data.length > 0 ? data[0] : null;
};

export const obtenerAlmacenes = async () => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT ALM_almacen, ALM_Nombre, ALM_Departamento, ALM_Municipio,
              ALM_Zona_Aldea, ALM_Domicilio, ALM_Telefono, ALM_Estado
       FROM MUE_ALMACEN
       ORDER BY ALM_almacen DESC`,
    );
    return resultado.rows ?? [];
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerAlmacenPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT ALM_almacen, ALM_Nombre, ALM_Departamento, ALM_Municipio,
              ALM_Zona_Aldea, ALM_Domicilio, ALM_Telefono, ALM_Estado
       FROM MUE_ALMACEN
       WHERE ALM_almacen = :id`,
      { id },
    );
    return toRow(resultado.rows);
  } finally {
    if (conexion) await conexion.close();
  }
};

export const crearAlmacen = async (datos: NuevoAlmacen) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_ALMACEN (
         ALM_Nombre,
         ALM_Departamento,
         ALM_Municipio,
         ALM_Zona_Aldea,
         ALM_Domicilio,
         ALM_Telefono,
         ALM_Estado
       ) VALUES (
         :nombre,
         :departamento,
         :municipio,
         :zona,
         :domicilio,
         :telefono,
         :estado
       )
       RETURNING ALM_almacen INTO :id`,
      {
        nombre: datos.ALM_Nombre.trim(),
        departamento: datos.ALM_Departamento?.trim() || null,
        municipio: datos.ALM_Municipio?.trim() || null,
        zona: datos.ALM_Zona_Aldea?.trim() || null,
        domicilio: datos.ALM_Domicilio?.trim() || null,
        telefono: datos.ALM_Telefono?.trim() || null,
        estado: datos.ALM_Estado ?? "ACTIVO",
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );
    const outBinds = resultado.outBinds as { id: number[] };
    return { ALM_almacen: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

export const actualizarAlmacen = async (id: number, datos: NuevoAlmacen) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_ALMACEN SET
         ALM_Nombre = :nombre,
         ALM_Departamento = :departamento,
         ALM_Municipio = :municipio,
         ALM_Zona_Aldea = :zona,
         ALM_Domicilio = :domicilio,
         ALM_Telefono = :telefono,
         ALM_Estado = :estado
       WHERE ALM_almacen = :id`,
      {
        nombre: datos.ALM_Nombre.trim(),
        departamento: datos.ALM_Departamento?.trim() || null,
        municipio: datos.ALM_Municipio?.trim() || null,
        zona: datos.ALM_Zona_Aldea?.trim() || null,
        domicilio: datos.ALM_Domicilio?.trim() || null,
        telefono: datos.ALM_Telefono?.trim() || null,
        estado: datos.ALM_Estado ?? "ACTIVO",
        id,
      },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const cambiarEstadoAlmacen = async (id: number, estado: string) => {
  if (!["ACTIVO", "INACTIVO"].includes(estado)) {
    throw new AlmacenServiceError("Estado invalido para almacen.", 400);
  }

  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_ALMACEN
       SET ALM_Estado = :estado
       WHERE ALM_almacen = :id`,
      { estado, id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const eliminarAlmacen = async (id: number) =>
  cambiarEstadoAlmacen(id, "INACTIVO");
