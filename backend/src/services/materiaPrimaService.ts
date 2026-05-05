import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

type Row = Record<string, unknown>;

export interface NuevaMateriaPrima {
  MAP_Nombre: string;
  MAP_Unidad_Medida?: string | null;
  MAP_Costo_Referencial?: number | null;
  MAP_Estado?: string;
}

export class MateriaPrimaServiceError extends Error {
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

export const obtenerMateriasPrimas = async () => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT MAP_Materia_Prima, MAP_Nombre, MAP_Unidad_Medida,
              MAP_Costo_Referencial, MAP_Estado
       FROM MUE_MATERIA_PRIMA
       ORDER BY MAP_Materia_Prima DESC`,
    );
    return resultado.rows ?? [];
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerMateriaPrimaPorId = async (id: number) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT MAP_Materia_Prima, MAP_Nombre, MAP_Unidad_Medida,
              MAP_Costo_Referencial, MAP_Estado
       FROM MUE_MATERIA_PRIMA
       WHERE MAP_Materia_Prima = :id`,
      { id },
    );
    return getFirstRow(resultado.rows);
  } finally {
    if (conexion) await conexion.close();
  }
};

export const crearMateriaPrima = async (datos: NuevaMateriaPrima) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `INSERT INTO MUE_MATERIA_PRIMA (
         MAP_Nombre,
         MAP_Unidad_Medida,
         MAP_Costo_Referencial,
         MAP_Estado
       ) VALUES (
         :nombre,
         :unidad,
         :costo,
         :estado
       )
       RETURNING MAP_Materia_Prima INTO :id`,
      {
        nombre: datos.MAP_Nombre.trim(),
        unidad: datos.MAP_Unidad_Medida?.trim() || null,
        costo: datos.MAP_Costo_Referencial ?? null,
        estado: datos.MAP_Estado ?? "ACTIVO",
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true },
    );
    const outBinds = resultado.outBinds as { id: number[] };
    return { MAP_Materia_Prima: outBinds.id[0] };
  } finally {
    if (conexion) await conexion.close();
  }
};

export const actualizarMateriaPrima = async (
  id: number,
  datos: NuevaMateriaPrima,
) => {
  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_MATERIA_PRIMA SET
         MAP_Nombre = :nombre,
         MAP_Unidad_Medida = :unidad,
         MAP_Costo_Referencial = :costo,
         MAP_Estado = :estado
       WHERE MAP_Materia_Prima = :id`,
      {
        nombre: datos.MAP_Nombre.trim(),
        unidad: datos.MAP_Unidad_Medida?.trim() || null,
        costo: datos.MAP_Costo_Referencial ?? null,
        estado: datos.MAP_Estado ?? "ACTIVO",
        id,
      },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const cambiarEstadoMateriaPrima = async (id: number, estado: string) => {
  if (!["ACTIVO", "INACTIVO"].includes(estado)) {
    throw new MateriaPrimaServiceError("Estado invalido para materia prima.", 400);
  }

  let conexion;
  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_MATERIA_PRIMA
       SET MAP_Estado = :estado
       WHERE MAP_Materia_Prima = :id`,
      { estado, id },
      { autoCommit: true },
    );
    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const eliminarMateriaPrima = async (id: number) =>
  cambiarEstadoMateriaPrima(id, "INACTIVO");
