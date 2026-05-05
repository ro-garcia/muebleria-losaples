import type { BindParameters } from "oracledb";

import { getDatabaseConnection } from "../config/database";

type Row = Record<string, unknown>;
type BindValue = string | number | null;

export interface ClienteProfileRow extends Row {
  CLI_CLIENTE: number;
  CLI_PRIMER_NOMBRE?: string | null;
  CLI_SEGUNDO_NOMBRE?: string | null;
  CLI_PRIMER_APELLIDO?: string | null;
  CLI_SEGUNDO_APELLIDO?: string | null;
  CLI_DEPARTAMENTO?: string | null;
  CLI_MUNICIPIO?: string | null;
  CLI_ZONA_ALDEA?: string | null;
  CLI_TELEFONO?: string | null;
  CLI_PAIS?: string | null;
  CLI_TIPO_DOCUMENTO?: string | null;
  CLI_NUMERO_DOCUMENTO?: string | null;
  CLI_CORREO_ELECTRONICO?: string | null;
  PER_PERSONA?: number | null;
  PER_TIPO_DOCUMENTO?: string | null;
  PER_NOMBRE?: string | null;
  PER_PRIMER_APELLIDO?: string | null;
  PER_SEGUNDO_APELLIDO?: string | null;
  PER_CORREO?: string | null;
  PER_TELEFONO?: string | null;
  PER_PAIS?: string | null;
  PER_DEPARTAMENTO?: string | null;
  PER_MUNICIPIO?: string | null;
  PER_ZONA_ALDEA?: string | null;
  PER_DOMICILIO?: string | null;
  USU_USUARIO?: number | null;
  USU_NOMBRE_USUARIO?: string | null;
  USU_PASSWORD_STATUS?: string | null;
  DIRECCION_VALIDA?: number;
  DIRECCION_RESUMEN?: string | null;
  DIR_PAIS?: string | null;
  DIR_DEPARTAMENTO?: string | null;
  DIR_MUNICIPIO?: string | null;
  DIR_ZONA_ALDEA?: string | null;
  DIR_TELEFONO?: string | null;
}

interface UsuarioMeta {
  hasCliCliente: boolean;
  hasPerPersona: boolean;
}

interface ClienteListFilters {
  search?: string;
  documento?: string;
  nombre?: string;
  correo?: string;
}

export class ClienteServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

const toText = (value: unknown) => String(value ?? "").trim();
const toNumber = (value: unknown) => Number(value ?? 0);

const optionalText = (value: unknown) => {
  const text = toText(value);
  return text.length > 0 ? text : null;
};

const normalizeFilter = (value?: string) => {
  const text = optionalText(value);
  return text ? `%${text.toLowerCase()}%` : null;
};

const buildAddressSummary = (profile: Row) => {
  const pais = toText(profile.CLI_PAIS) || toText(profile.PER_PAIS);
  const departamento =
    toText(profile.CLI_DEPARTAMENTO) || toText(profile.PER_DEPARTAMENTO);
  const municipio =
    toText(profile.CLI_MUNICIPIO) || toText(profile.PER_MUNICIPIO);
  const zona =
    toText(profile.CLI_ZONA_ALDEA) ||
    toText(profile.PER_ZONA_ALDEA) ||
    toText(profile.PER_DOMICILIO);
  const telefono =
    toText(profile.CLI_TELEFONO) || toText(profile.PER_TELEFONO);

  const addressParts = [zona, municipio, departamento, pais].filter(Boolean);
  const isValid = Boolean(pais && departamento && municipio && zona && telefono);

  return {
    direccionValida: isValid,
    direccionResumen: addressParts.join(", ") || null,
    pais: pais || null,
    departamento: departamento || null,
    municipio: municipio || null,
    zonaAldea: zona || null,
    telefono: telefono || null,
  };
};

const getUsuarioMeta = async (connection: Awaited<ReturnType<typeof getDatabaseConnection>>) => {
  const result = await connection.execute(
    `SELECT COLUMN_NAME
     FROM USER_TAB_COLUMNS
     WHERE TABLE_NAME = 'MUE_USUARIO'`,
  );

  const columns = new Set(
    ((result.rows ?? []) as Row[]).map((row) => String(row.COLUMN_NAME ?? "")),
  );

  return {
    hasCliCliente: columns.has("CLI_CLIENTE"),
    hasPerPersona: columns.has("PER_PERSONA"),
  } satisfies UsuarioMeta;
};

const getUsuarioSelect = (meta: UsuarioMeta) => {
  const fields = ["USU_Usuario", "USU_Nombre_Usuario", "USU_Clave"];
  if (meta.hasCliCliente) fields.push("CLI_Cliente");
  if (meta.hasPerPersona) fields.push("PER_Persona");
  return fields.join(", ");
};

const getUsuarioByCliente = async (
  connection: Awaited<ReturnType<typeof getDatabaseConnection>>,
  clienteId: number,
  clienteEmail: string,
  meta?: UsuarioMeta,
) => {
  const usuarioMeta = meta ?? (await getUsuarioMeta(connection));
  const select = getUsuarioSelect(usuarioMeta);

  if (usuarioMeta.hasCliCliente) {
    const byCliente = await connection.execute(
      `SELECT ${select}
       FROM MUE_USUARIO
       WHERE CLI_Cliente = :clienteId
       ORDER BY USU_Usuario DESC
       FETCH FIRST 1 ROW ONLY`,
      { clienteId },
    );

    const rows = byCliente.rows as Row[] | undefined;
    if (rows && rows.length > 0) {
      return rows[0];
    }
  }

  if (!clienteEmail) {
    return null;
  }

  const byEmail = await connection.execute(
    `SELECT ${select}
     FROM MUE_USUARIO
     WHERE LOWER(USU_Nombre_Usuario) = LOWER(:clienteEmail)
     ORDER BY USU_Usuario DESC
     FETCH FIRST 1 ROW ONLY`,
    { clienteEmail },
  );

  const rows = byEmail.rows as Row[] | undefined;
  return rows && rows.length > 0 ? rows[0] : null;
};

const getPersonaById = async (
  connection: Awaited<ReturnType<typeof getDatabaseConnection>>,
  personaId: number,
): Promise<ClienteProfileRow | null> => {
  const result = await connection.execute(
    `SELECT PER_Persona, PER_Tipo_Documento, PER_Nombre, PER_Primer_Apellido,
            PER_Segundo_Apellido, PER_Correo, PER_Telefono, PER_Pais,
            PER_Departamento, PER_Municipio, PER_Zona_Aldea, PER_Domicilio
     FROM MUE_PERSONA
     WHERE PER_Persona = :personaId`,
    { personaId },
  );

  const rows = result.rows as ClienteProfileRow[] | undefined;
  return rows && rows.length > 0 ? rows[0] : null;
};

const buildClienteListWhere = (
  filters: ClienteListFilters,
  binds: Record<string, BindValue>,
) => {
  const clauses = ["1 = 1"];
  const search = normalizeFilter(filters.search);
  const documento = normalizeFilter(filters.documento);
  const nombre = normalizeFilter(filters.nombre);
  const correo = normalizeFilter(filters.correo);

  if (search) {
    binds.search = search;
    clauses.push(`(
      LOWER(NVL(c.CLI_Numero_Documento, '')) LIKE :search
      OR LOWER(NVL(c.CLI_Correo_Electronico, '')) LIKE :search
      OR LOWER(
        TRIM(
          c.CLI_Primer_Nombre || ' ' ||
          NVL(c.CLI_Segundo_Nombre, '') || ' ' ||
          c.CLI_Primer_Apellido || ' ' ||
          NVL(c.CLI_Segundo_Apellido, '')
        )
      ) LIKE :search
    )`);
  }

  if (documento) {
    binds.documento = documento;
    clauses.push(`LOWER(NVL(c.CLI_Numero_Documento, '')) LIKE :documento`);
  }

  if (nombre) {
    binds.nombre = nombre;
    clauses.push(`LOWER(
      TRIM(
        c.CLI_Primer_Nombre || ' ' ||
        NVL(c.CLI_Segundo_Nombre, '') || ' ' ||
        c.CLI_Primer_Apellido || ' ' ||
        NVL(c.CLI_Segundo_Apellido, '')
      )
    ) LIKE :nombre`);
  }

  if (correo) {
    binds.correo = correo;
    clauses.push(`LOWER(NVL(c.CLI_Correo_Electronico, '')) LIKE :correo`);
  }

  return clauses.join(" AND ");
};

const getClienteByIdInternal = async (
  connection: Awaited<ReturnType<typeof getDatabaseConnection>>,
  clienteId: number,
): Promise<ClienteProfileRow | null> => {
  const clienteResult = await connection.execute(
    `SELECT CLI_Cliente, CLI_Primer_Nombre, CLI_Segundo_Nombre, CLI_Primer_Apellido,
            CLI_Segundo_Apellido, CLI_Departamento, CLI_Municipio, CLI_Zona_Aldea,
            CLI_Telefono, CLI_Pais, CLI_Tipo_Documento, CLI_Numero_Documento,
            CLI_Correo_Electronico
     FROM MUE_CLIENTE
     WHERE CLI_Cliente = :clienteId`,
    { clienteId },
  );

  const clienteRows = clienteResult.rows as ClienteProfileRow[] | undefined;
  if (!clienteRows || clienteRows.length === 0) {
    return null;
  }

  const cliente = clienteRows[0];
  const usuarioMeta = await getUsuarioMeta(connection);
  const usuario = await getUsuarioByCliente(
    connection,
    clienteId,
    toText(cliente.CLI_CORREO_ELECTRONICO).toLowerCase(),
    usuarioMeta,
  );

  let persona: ClienteProfileRow | null = null;
  const personaId =
    usuarioMeta.hasPerPersona && usuario
      ? toNumber(usuario.PER_PERSONA)
      : 0;

  if (personaId > 0) {
    persona = await getPersonaById(connection, personaId);
  }

  const merged: ClienteProfileRow = {
    ...cliente,
    ...(persona ?? {}),
    USU_USUARIO: usuario ? toNumber(usuario.USU_USUARIO) || null : null,
    USU_NOMBRE_USUARIO: usuario ? optionalText(usuario.USU_NOMBRE_USUARIO) : null,
    USU_PASSWORD_STATUS: usuario?.USU_CLAVE ? "********" : null,
  };

  const address = buildAddressSummary(merged);

  return {
    ...merged,
    DIRECCION_VALIDA: address.direccionValida ? 1 : 0,
    DIRECCION_RESUMEN: address.direccionResumen,
    DIR_PAIS: address.pais,
    DIR_DEPARTAMENTO: address.departamento,
    DIR_MUNICIPIO: address.municipio,
    DIR_ZONA_ALDEA: address.zonaAldea,
    DIR_TELEFONO: address.telefono,
  };
};

export const listarClientes = async (filters: ClienteListFilters = {}) => {
  const connection = await getDatabaseConnection();
  try {
    const binds: Record<string, BindValue> = {};
    const where = buildClienteListWhere(filters, binds);
    const result = await connection.execute(
      `SELECT c.CLI_Cliente, c.CLI_Primer_Nombre, c.CLI_Segundo_Nombre,
              c.CLI_Primer_Apellido, c.CLI_Segundo_Apellido,
              c.CLI_Tipo_Documento, c.CLI_Numero_Documento,
              c.CLI_Correo_Electronico, c.CLI_Telefono, c.CLI_Pais,
              c.CLI_Departamento, c.CLI_Municipio, c.CLI_Zona_Aldea
       FROM MUE_CLIENTE c
       WHERE ${where}
       ORDER BY c.CLI_Cliente DESC`,
      binds,
    );

    const rows = (result.rows ?? []) as Row[];
    return rows.map((row) => {
      const address = buildAddressSummary(row);
      return {
        ...row,
        DIRECCION_VALIDA: address.direccionValida ? 1 : 0,
        DIRECCION_RESUMEN: address.direccionResumen,
      };
    });
  } finally {
    await connection.close();
  }
};

export const obtenerClientePorId = async (
  clienteId: number,
): Promise<ClienteProfileRow> => {
  const connection = await getDatabaseConnection();
  try {
    const cliente = await getClienteByIdInternal(connection, clienteId);
    if (!cliente) {
      throw new ClienteServiceError("Cliente no encontrado.", 404);
    }
    return cliente;
  } finally {
    await connection.close();
  }
};

export const obtenerComprasCliente = async (clienteId: number) => {
  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `SELECT o.ODV_Orden_Venta, o.ODV_Fecha, o.ODV_Estado, o.ODV_Subtotal,
              o.ODV_Descuento, o.ODV_Impuesto, o.ODV_Total,
              t.TIE_Tienda, t.TIE_Nombre,
              f.FAC_Factura, f.FAC_Serie, f.FAC_Numero, f.FAC_UUID,
              f.FAC_Fecha_Emision, f.FAC_Estado_Factura, f.FAC_Subtotal,
              f.FAC_Descuento_Total, f.FAC_Impuesto_Total, f.FAC_Total,
              f.FAC_Pendiente_Pago, f.FAC_Total_Pagado,
              m.MET_Metodo_Pago, m.MET_Nombre,
              d.DOV_Det_Orden_Venta, d.PRO_Producto, d.DOV_Cantidad,
              d.DOV_Precio_Unitario, d.DOV_Descuento, d.DOV_Subtotal,
              p.PRO_Codigo, p.PRO_Nombre,
              df.DFA_Detalle_Factura, df.DFA_Cantidad, df.DFA_Precio,
              df.DFA_Descuento, df.DFA_Impuesto, df.DFA_Subtotal,
              i.IMP_Impuesto, i.IMP_Nombre, i.IMP_Porcentaje
       FROM MUE_ORDENVENTA o
       LEFT JOIN MUE_TIENDA t
         ON t.TIE_Tienda = o.TIE_Tienda
       LEFT JOIN MUE_FACTURA f
         ON f.ORD_Orden_Venta = o.ODV_Orden_Venta
       LEFT JOIN MUE_METODOPAGO m
         ON m.MET_Metodo_Pago = f.MET_Metodo_Pago
       LEFT JOIN MUE_DETORDENVENTA d
         ON d.ODV_Orden_Venta = o.ODV_Orden_Venta
       LEFT JOIN MUE_PRODUCTO p
         ON p.PRO_Producto = d.PRO_Producto
       LEFT JOIN MUE_DETALLE_FACTURA df
         ON df.FAC_Factura = f.FAC_Factura
        AND df.PRO_Producto = d.PRO_Producto
       LEFT JOIN MUE_IMPUESTO i
         ON i.IMP_Impuesto = df.IMP_Impuesto
       WHERE o.CLI_Cliente = :clienteId
       ORDER BY o.ODV_Fecha DESC,
                o.ODV_Orden_Venta DESC,
                d.DOV_Det_Orden_Venta,
                df.DFA_Detalle_Factura`,
      { clienteId },
    );
    return result.rows ?? [];
  } finally {
    await connection.close();
  }
};

const obtenerRelacionesCliente = async (
  connection: Awaited<ReturnType<typeof getDatabaseConnection>>,
  clienteId: number,
) => {
  const result = await connection.execute(
    `SELECT
       (SELECT COUNT(*)
          FROM MUE_ORDENVENTA o
         WHERE o.CLI_Cliente = :clienteId) AS TOTAL_ORDENES,
       (SELECT COUNT(*)
          FROM MUE_FACTURA f
          JOIN MUE_ORDENVENTA o
            ON o.ODV_Orden_Venta = f.ORD_Orden_Venta
         WHERE o.CLI_Cliente = :clienteId) AS TOTAL_FACTURAS
     FROM DUAL`,
    { clienteId },
  );

  const rows = result.rows as Row[] | undefined;
  return {
    totalOrdenes: rows && rows.length > 0 ? toNumber(rows[0].TOTAL_ORDENES) : 0,
    totalFacturas: rows && rows.length > 0 ? toNumber(rows[0].TOTAL_FACTURAS) : 0,
  };
};

export const actualizarCliente = async (
  clienteId: number,
  payload: Partial<Record<string, unknown>>,
) => {
  const connection = await getDatabaseConnection();
  try {
    const current = await getClienteByIdInternal(connection, clienteId);
    if (!current) {
      throw new ClienteServiceError("Cliente no encontrado.", 404);
    }

    const clienteFields: string[] = [];
    const clienteBinds: BindParameters = { clienteId };

    const allowedCliente = [
      "CLI_Primer_Nombre",
      "CLI_Segundo_Nombre",
      "CLI_Primer_Apellido",
      "CLI_Segundo_Apellido",
      "CLI_Departamento",
      "CLI_Municipio",
      "CLI_Zona_Aldea",
      "CLI_Telefono",
      "CLI_Pais",
      "CLI_Tipo_Documento",
      "CLI_Numero_Documento",
      "CLI_Correo_Electronico",
    ];

    for (const key of allowedCliente) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        const bindKey = `b_${key}`;
        clienteFields.push(`${key} = :${bindKey}`);
        clienteBinds[bindKey] = optionalText(payload[key as keyof typeof payload]);
      }
    }

    if (clienteFields.length > 0) {
      await connection.execute(
        `UPDATE MUE_CLIENTE
         SET ${clienteFields.join(", ")}
         WHERE CLI_Cliente = :clienteId`,
        clienteBinds,
      );
    }

    const personaId = toNumber(current.PER_PERSONA);
    const personaFields: string[] = [];
    const personaBinds: BindParameters = { personaId };
    const allowedPersona = [
      "PER_Tipo_Documento",
      "PER_Nombre",
      "PER_Primer_Apellido",
      "PER_Segundo_Apellido",
      "PER_Correo",
      "PER_Telefono",
      "PER_Pais",
      "PER_Departamento",
      "PER_Municipio",
      "PER_Zona_Aldea",
      "PER_Domicilio",
    ];

    for (const key of allowedPersona) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        const bindKey = `b_${key}`;
        personaFields.push(`${key} = :${bindKey}`);
        personaBinds[bindKey] = optionalText(payload[key as keyof typeof payload]);
      }
    }

    if (personaId > 0 && personaFields.length > 0) {
      await connection.execute(
        `UPDATE MUE_PERSONA
         SET ${personaFields.join(", ")}
         WHERE PER_Persona = :personaId`,
        personaBinds,
      );
    }

    const oldEmail = toText(current.CLI_CORREO_ELECTRONICO).toLowerCase();
    const newEmail = Object.prototype.hasOwnProperty.call(payload, "CLI_Correo_Electronico")
      ? toText(payload.CLI_Correo_Electronico).toLowerCase()
      : oldEmail;
    const username = toText(current.USU_NOMBRE_USUARIO).toLowerCase();
    const usuarioId = toNumber(current.USU_USUARIO);

    if (usuarioId > 0 && newEmail && username === oldEmail && username !== newEmail) {
      await connection.execute(
        `UPDATE MUE_USUARIO
         SET USU_Nombre_Usuario = :newEmail
         WHERE USU_Usuario = :usuarioId`,
        { newEmail, usuarioId },
      );
    }

    await connection.commit();

    const updated = await getClienteByIdInternal(connection, clienteId);
    if (!updated) {
      throw new ClienteServiceError("Cliente no encontrado.", 404);
    }

    return updated;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
};

export const eliminarCliente = async (clienteId: number) => {
  const connection = await getDatabaseConnection();

  try {
    const current = await getClienteByIdInternal(connection, clienteId);
    if (!current) {
      throw new ClienteServiceError("Cliente no encontrado.", 404);
    }

    const relaciones = await obtenerRelacionesCliente(connection, clienteId);
    if (relaciones.totalOrdenes > 0 || relaciones.totalFacturas > 0) {
      throw new ClienteServiceError(
        "No se puede eliminar el cliente porque ya tiene compras registradas.",
        409,
      );
    }

    const usuarioMeta = await getUsuarioMeta(connection);
    const usuario = await getUsuarioByCliente(
      connection,
      clienteId,
      toText(current.CLI_CORREO_ELECTRONICO).toLowerCase(),
      usuarioMeta,
    );

    const usuarioId = usuario ? toNumber(usuario.USU_USUARIO) : 0;
    const personaId =
      usuarioMeta.hasPerPersona && usuario ? toNumber(usuario.PER_PERSONA) : 0;

    if (usuarioId > 0) {
      await connection.execute(
        `DELETE FROM MUE_USUARIO
         WHERE USU_Usuario = :usuarioId`,
        { usuarioId },
      );
    }

    if (personaId > 0) {
      const personaRefsResult = await connection.execute(
        `SELECT COUNT(*) AS TOTAL
         FROM MUE_USUARIO
         WHERE PER_Persona = :personaId`,
        { personaId },
      );

      const personaRefsRows = personaRefsResult.rows as Row[] | undefined;
      const personaRefs =
        personaRefsRows && personaRefsRows.length > 0
          ? toNumber(personaRefsRows[0].TOTAL)
          : 0;

      if (personaRefs === 0) {
        await connection.execute(
          `DELETE FROM MUE_PERSONA
           WHERE PER_Persona = :personaId`,
          { personaId },
        );
      }
    }

    const deleteResult = await connection.execute(
      `DELETE FROM MUE_CLIENTE
       WHERE CLI_Cliente = :clienteId`,
      { clienteId },
    );

    if ((deleteResult.rowsAffected ?? 0) === 0) {
      throw new ClienteServiceError("Cliente no encontrado.", 404);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
};
