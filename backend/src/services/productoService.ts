import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

type Row = Record<string, unknown>;

export class ProductoServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

export interface NuevoProducto {
  PRO_Codigo: string;
  PRO_Nombre: string;
  PRO_Estado?: string;
  TIP_Tipo_Producto?: number | null;
  MAP_Material?: number | null;
  COP_Color_Producto?: number | null;
  DEP_Peso?: number | null;
  DEP_Longitud?: number | null;
  PRE_Precio?: number | null;
  PRE_Fecha_Inicio?: string | null;
}

export interface ProductoCompleto {
  PRO_Producto: number;
  PRO_Codigo: string;
  PRO_Nombre: string;
  PRO_Estado: string;
  DEP_Detalle_Producto?: number;
  TIP_Tipo_Producto?: number;
  TIP_Nombre?: string;
  MAP_Material?: number;
  MAP_Nombre?: string;
  COP_Color_Producto?: number;
  COP_Nombre?: string;
  DEP_Peso?: number;
  DEP_Longitud?: number;
  PRE_Precio?: number;
  STOCK_DISPONIBLE?: number;
}

const BASE_QUERY = `
  SELECT p.PRO_Producto,
         p.PRO_Codigo,
         p.PRO_Nombre,
         p.PRO_Estado,
         detalle.DEP_Detalle_Producto,
         detalle.TIP_Tipo_Producto,
         detalle.TIP_Nombre,
         detalle.MAP_Material,
         detalle.MAP_Nombre,
         detalle.COP_Color_Producto,
         detalle.COP_Nombre,
         detalle.DEP_Peso,
         detalle.DEP_Longitud,
         precio.PRE_Precio,
         NVL(stock.STOCK_DISPONIBLE, 0) AS STOCK_DISPONIBLE
  FROM   MUE_PRODUCTO p
  LEFT JOIN (
    SELECT dp.DEP_Detalle_Producto,
           dp.PRO_Producto,
           dp.MAP_Material,
           dp.COP_Color_Producto,
           dp.TIP_Tipo_Producto,
           dp.DEP_Peso,
           dp.DEP_Longitud,
           tp.TIP_Nombre,
           mp.MAP_Nombre,
           cp.COP_Nombre,
           ROW_NUMBER() OVER (
             PARTITION BY dp.PRO_Producto
             ORDER BY dp.DEP_Detalle_Producto
           ) AS rn
    FROM   MUE_DETALLE_PRODUCTO dp
    JOIN   MUE_TIPO_PRODUCTO tp
      ON   tp.TIP_Tipo_Producto = dp.TIP_Tipo_Producto
    JOIN   MUE_MATERIAL_PRODUCTO mp
      ON   mp.MAP_Material_Producto = dp.MAP_Material
    JOIN   MUE_COLOR_PRODUCTO cp
      ON   cp.COP_Color_Producto = dp.COP_Color_Producto
  ) detalle ON detalle.PRO_Producto = p.PRO_Producto AND detalle.rn = 1
  LEFT JOIN (
    SELECT PRO_Producto,
           PRE_Precio,
           ROW_NUMBER() OVER (
             PARTITION BY PRO_Producto
             ORDER BY PRE_Fecha_Inicio DESC, PRE_Precio_Producto DESC
           ) AS rn
    FROM   MUE_PRECIOPRODUCTO
    WHERE  PRE_Fecha_Inicio <= SYSDATE
      AND  (PRE_Fecha_Fin IS NULL OR PRE_Fecha_Fin >= SYSDATE)
  ) precio ON precio.PRO_Producto = p.PRO_Producto AND precio.rn = 1
  LEFT JOIN (
    SELECT PRO_Producto,
           NVL(SUM(STP_Cantidad), 0) AS STOCK_DISPONIBLE
    FROM   MUE_STOCK_PRODUCTO
    GROUP BY PRO_Producto
  ) stock ON stock.PRO_Producto = p.PRO_Producto
`;

export const obtenerProductos = async (categoriaId?: number) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      BASE_QUERY +
        `WHERE  p.PRO_Estado = 'ACTIVO'
           AND  (:categoriaId IS NULL OR detalle.TIP_Tipo_Producto = :categoriaId)
         ORDER BY p.PRO_Nombre`,
      { categoriaId: categoriaId ?? null },
    );

    return resultado.rows ?? [];
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerTodosProductos = async () => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      BASE_QUERY + `ORDER BY p.PRO_Nombre`,
    );

    return resultado.rows ?? [];
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerProductoPorId = async (id: number) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      BASE_QUERY + `WHERE p.PRO_Producto = :id AND p.PRO_Estado = 'ACTIVO'`,
      { id },
    );

    const filas = resultado.rows as Row[] | undefined;
    return filas && filas.length > 0 ? filas[0] : null;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerMateriales = async () => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT MAP_Material_Producto, MAP_Nombre
       FROM   MUE_MATERIAL_PRODUCTO
       ORDER BY MAP_Nombre`,
    );

    return resultado.rows ?? [];
  } finally {
    if (conexion) await conexion.close();
  }
};

export const obtenerColores = async () => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `SELECT COP_Color_Producto, COP_Nombre, COP_Estado
       FROM   MUE_COLOR_PRODUCTO
       WHERE  COP_Estado = 'ACTIVO'
       ORDER BY COP_Nombre`,
    );

    return resultado.rows ?? [];
  } finally {
    if (conexion) await conexion.close();
  }
};

export const crearProducto = async (datos: NuevoProducto) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();

    // Insertar producto base
    const prodResult = await conexion.execute(
      `INSERT INTO MUE_PRODUCTO (PRO_Codigo, PRO_Nombre, PRO_Estado)
       VALUES (:codigo, :nombre, :estado)
       RETURNING PRO_Producto INTO :id`,
      {
        codigo: datos.PRO_Codigo.trim(),
        nombre: datos.PRO_Nombre.trim(),
        estado: datos.PRO_Estado ?? "ACTIVO",
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: false },
    );

    const outBinds = prodResult.outBinds as { id: number[] };
    const productoId = outBinds.id[0];

    // Insertar detalle del producto si se proporcionan datos de clasificación
    if (
      datos.TIP_Tipo_Producto &&
      datos.MAP_Material &&
      datos.COP_Color_Producto
    ) {
      await conexion.execute(
        `INSERT INTO MUE_DETALLE_PRODUCTO
           (PRO_Producto, MAP_Material, COP_Color_Producto,
            TIP_Tipo_Producto, DEP_Peso, DEP_Longitud)
         VALUES (:pro, :material, :color, :tipo, :peso, :longitud)`,
        {
          pro: productoId,
          material: datos.MAP_Material,
          color: datos.COP_Color_Producto,
          tipo: datos.TIP_Tipo_Producto,
          peso: datos.DEP_Peso ?? null,
          longitud: datos.DEP_Longitud ?? null,
        },
        { autoCommit: false },
      );
    }

    // Insertar precio si se proporciona
    if (datos.PRE_Precio !== null && datos.PRE_Precio !== undefined) {
      await conexion.execute(
        `INSERT INTO MUE_PRECIOPRODUCTO
           (PRO_Producto, PRE_Precio, PRE_Fecha_Inicio)
         VALUES (
           :pro,
           :precio,
           CASE
             WHEN :fechaInicio IS NULL THEN SYSDATE
             ELSE TO_DATE(:fechaInicio, 'YYYY-MM-DD')
           END
         )`,
        {
          pro: productoId,
          precio: datos.PRE_Precio,
          fechaInicio: datos.PRE_Fecha_Inicio ?? null,
        },
        { autoCommit: false },
      );
    }

    await conexion.commit();

    // Obtener y retornar el producto completo
    const productoCompleto = await obtenerProductoPorId(productoId);
    return productoCompleto;
  } catch (error) {
    if (conexion) {
      try {
        await conexion.rollback();
      } catch {}
    }

    const msg = error instanceof Error ? error.message : "";

    if (
      msg.includes("ORA-00001") ||
      msg.includes("UQ_MUE_PRODUCTO_CODIGO")
    ) {
      throw new ProductoServiceError(
        "Ya existe un producto con ese codigo.",
        409,
      );
    }

    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const actualizarProducto = async (
  id: number,
  datos: NuevoProducto,
) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();

    // Actualizar producto base
    const prodResult = await conexion.execute(
      `UPDATE MUE_PRODUCTO
       SET    PRO_Codigo = :codigo,
              PRO_Nombre = :nombre,
              PRO_Estado = :estado
       WHERE  PRO_Producto = :id`,
      {
        codigo: datos.PRO_Codigo.trim(),
        nombre: datos.PRO_Nombre.trim(),
        estado: datos.PRO_Estado ?? "ACTIVO",
        id,
      },
      { autoCommit: false },
    );

    if ((prodResult.rowsAffected ?? 0) === 0) {
      await conexion.rollback();
      throw new ProductoServiceError("Producto no encontrado.", 404);
    }

    // Actualizar o insertar detalle del producto
    if (
      datos.TIP_Tipo_Producto &&
      datos.MAP_Material &&
      datos.COP_Color_Producto
    ) {
      const detalleResult = await conexion.execute(
        `SELECT DEP_Detalle_Producto
         FROM   MUE_DETALLE_PRODUCTO
         WHERE  PRO_Producto = :id
           AND  ROWNUM = 1`,
        { id },
      );

      const filas = detalleResult.rows as Row[] | undefined;

      if (filas && filas.length > 0) {
        const detalleId = filas[0].DEP_DETALLE_PRODUCTO as number;
        await conexion.execute(
          `UPDATE MUE_DETALLE_PRODUCTO
           SET    MAP_Material       = :material,
                  COP_Color_Producto = :color,
                  TIP_Tipo_Producto  = :tipo,
                  DEP_Peso           = :peso,
                  DEP_Longitud       = :longitud
           WHERE  DEP_Detalle_Producto = :detalleId`,
          {
            material: datos.MAP_Material,
            color: datos.COP_Color_Producto,
            tipo: datos.TIP_Tipo_Producto,
            peso: datos.DEP_Peso ?? null,
            longitud: datos.DEP_Longitud ?? null,
            detalleId,
          },
          { autoCommit: false },
        );
      } else {
        await conexion.execute(
          `INSERT INTO MUE_DETALLE_PRODUCTO
             (PRO_Producto, MAP_Material, COP_Color_Producto,
              TIP_Tipo_Producto, DEP_Peso, DEP_Longitud)
           VALUES (:pro, :material, :color, :tipo, :peso, :longitud)`,
          {
            pro: id,
            material: datos.MAP_Material,
            color: datos.COP_Color_Producto,
            tipo: datos.TIP_Tipo_Producto,
            peso: datos.DEP_Peso ?? null,
            longitud: datos.DEP_Longitud ?? null,
          },
          { autoCommit: false },
        );
      }
    }

    // Actualizar o insertar precio
    if (datos.PRE_Precio !== null && datos.PRE_Precio !== undefined) {
      const precioResult = await conexion.execute(
        `SELECT PRE_Precio_Producto
         FROM   MUE_PRECIOPRODUCTO
         WHERE  PRO_Producto = :id
           AND  PRE_Fecha_Fin IS NULL
           AND  ROWNUM = 1`,
        { id },
      );

      const filas = precioResult.rows as Row[] | undefined;

      if (filas && filas.length > 0) {
        // Cerrar el precio activo
        await conexion.execute(
          `UPDATE MUE_PRECIOPRODUCTO
           SET    PRE_Fecha_Fin = TRUNC(SYSDATE)
           WHERE  PRO_Producto = :id
             AND  PRE_Fecha_Fin IS NULL`,
          { id },
          { autoCommit: false },
        );
      }

      // Insertar nuevo precio con fecha de inicio válida según esquema
      await conexion.execute(
        `INSERT INTO MUE_PRECIOPRODUCTO
           (PRO_Producto, PRE_Precio, PRE_Fecha_Inicio)
         VALUES (
           :pro,
           :precio,
           CASE
             WHEN :fechaInicio IS NULL THEN SYSDATE
             ELSE TO_DATE(:fechaInicio, 'YYYY-MM-DD')
           END
         )`,
        {
          pro: id,
          precio: datos.PRE_Precio,
          fechaInicio: datos.PRE_Fecha_Inicio ?? null,
        },
        { autoCommit: false },
      );
    }

    await conexion.commit();

    // Obtener y retornar el producto actualizado
    const productoCompleto = await obtenerProductoPorId(id);
    return productoCompleto;
  } catch (error) {
    if (conexion) {
      try {
        await conexion.rollback();
      } catch {}
    }

    if (error instanceof ProductoServiceError) throw error;

    const msg = error instanceof Error ? error.message : "";

    if (msg.includes("ORA-00001")) {
      throw new ProductoServiceError(
        "Ya existe un producto con ese codigo.",
        409,
      );
    }

    throw error;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const asignarCategoriaProducto = async (
  productoId: number,
  categoriaId: number,
) => {
  let conexion;

  try {
    conexion = await getDatabaseConnection();

    const detalleResult = await conexion.execute(
      `SELECT DEP_Detalle_Producto
       FROM   MUE_DETALLE_PRODUCTO
       WHERE  PRO_Producto = :id
         AND  ROWNUM = 1`,
      { id: productoId },
    );

    const filas = detalleResult.rows as Row[] | undefined;

    if (!filas || filas.length === 0) {
      throw new ProductoServiceError(
        "El mueble no tiene clasificacion. Editelo primero para asignarle tipo, material y color.",
        400,
      );
    }

    const detalleId = filas[0].DEP_DETALLE_PRODUCTO as number;

    await conexion.execute(
      `UPDATE MUE_DETALLE_PRODUCTO
       SET    TIP_Tipo_Producto = :categoriaId
       WHERE  DEP_Detalle_Producto = :detalleId`,
      { categoriaId, detalleId },
      { autoCommit: true },
    );

    return true;
  } finally {
    if (conexion) await conexion.close();
  }
};

export const cambiarEstadoProducto = async (
  id: number,
  estado: string,
) => {
  if (!["ACTIVO", "INACTIVO"].includes(estado)) {
    throw new ProductoServiceError(
      "Estado invalido. Debe ser ACTIVO o INACTIVO.",
    );
  }

  let conexion;

  try {
    conexion = await getDatabaseConnection();
    const resultado = await conexion.execute(
      `UPDATE MUE_PRODUCTO SET PRO_Estado = :estado WHERE PRO_Producto = :id`,
      { estado, id },
      { autoCommit: true },
    );

    return resultado.rowsAffected ?? 0;
  } finally {
    if (conexion) await conexion.close();
  }
};
