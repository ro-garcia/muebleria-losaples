import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import oracledb from "oracledb";

import { env } from "../config/env";
import { getDatabaseConnection } from "../config/database";
import type { AuthClaims } from "../middlewares/auth";

type Row = Record<string, unknown>;

interface TableColumn {
  COLUMN_NAME: string;
  NULLABLE: "Y" | "N";
  DATA_DEFAULT: string | null;
}

interface UsuarioMeta {
  hasCliCliente: boolean;
  hasPerPersona: boolean;
  requiresCliCliente: boolean;
  requiresPerPersona: boolean;
}

export type AuthRole = "CLIENTE" | "ADMIN";

export interface AuthSessionUser {
  role: AuthRole;
  clienteId: number | null;
  empleadoId: number | null;
  personaId: number | null;
  username: string;
  correo: string;
  nombreCompleto: string;
}

export interface AuthSessionResponse {
  token: string;
  user: AuthSessionUser;
}

export interface ClienteRegisterPayload {
  CLI_Primer_Nombre: string;
  CLI_Segundo_Nombre?: string | null;
  CLI_Primer_Apellido: string;
  CLI_Segundo_Apellido?: string | null;
  CLI_Departamento?: string | null;
  CLI_Municipio?: string | null;
  CLI_Zona_Aldea?: string | null;
  CLI_Telefono?: string | null;
  CLI_Pais?: string | null;
  CLI_Tipo_Documento?: string | null;
  CLI_Numero_Documento?: string | null;
  CLI_Correo_Electronico: string;
  PER_Tipo_Documento?: string | null;
  PER_Nombre?: string | null;
  PER_Primer_Apellido?: string | null;
  PER_Segundo_Apellido?: string | null;
  PER_Correo?: string | null;
  PER_Telefono?: string | null;
  PER_Pais?: string | null;
  PER_Departamento?: string | null;
  PER_Municipio?: string | null;
  PER_Zona_Aldea?: string | null;
  PER_Domicilio?: string | null;
  username?: string;
  password: string;
}

export interface ClienteLoginPayload {
  username: string;
  password: string;
}

export interface EmployeeAccessPayload {
  username: string;
  password: string;
}

export class ShopAuthServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

const optionalText = (value: string | null | undefined) => {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
};

const buildFullName = (...parts: Array<string | null | undefined>) =>
  parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();

const hasPersonaPayload = (payload: ClienteRegisterPayload) =>
  Boolean(
    optionalText(payload.PER_Tipo_Documento) ??
      optionalText(payload.PER_Nombre) ??
      optionalText(payload.PER_Primer_Apellido) ??
      optionalText(payload.PER_Segundo_Apellido) ??
      optionalText(payload.PER_Correo) ??
      optionalText(payload.PER_Telefono) ??
      optionalText(payload.PER_Pais) ??
      optionalText(payload.PER_Departamento) ??
      optionalText(payload.PER_Municipio) ??
      optionalText(payload.PER_Zona_Aldea) ??
      optionalText(payload.PER_Domicilio),
  );

const getTableColumns = async (
  connection: oracledb.Connection,
  tableName: string,
) => {
  const result = await connection.execute(
    `SELECT COLUMN_NAME, NULLABLE, DATA_DEFAULT
     FROM USER_TAB_COLUMNS
     WHERE TABLE_NAME = :tableName`,
    { tableName: tableName.toUpperCase() },
  );

  return (result.rows ?? []) as TableColumn[];
};

const mustProvideColumn = (columns: TableColumn[], columnName: string) => {
  const column = columns.find((item) => item.COLUMN_NAME === columnName);
  if (!column) return false;
  return column.NULLABLE === "N" && !column.DATA_DEFAULT;
};

const getUsuarioMeta = async (connection: oracledb.Connection) => {
  const columns = await getTableColumns(connection, "MUE_USUARIO");
  return {
    hasCliCliente: columns.some((column) => column.COLUMN_NAME === "CLI_CLIENTE"),
    hasPerPersona: columns.some((column) => column.COLUMN_NAME === "PER_PERSONA"),
    requiresCliCliente: mustProvideColumn(columns, "CLI_CLIENTE"),
    requiresPerPersona: mustProvideColumn(columns, "PER_PERSONA"),
  } satisfies UsuarioMeta;
};

const getUsuarioSelect = (meta: UsuarioMeta) => {
  const columns = ["USU_Usuario", "USU_Nombre_Usuario", "USU_Clave"];
  if (meta.hasCliCliente) {
    columns.push("CLI_Cliente");
  }
  if (meta.hasPerPersona) {
    columns.push("PER_Persona");
  }
  return columns.join(", ");
};

const createAuthToken = (payload: {
  role: AuthRole;
  username: string;
  usuarioId?: number | null;
  clienteId?: number | null;
  empleadoId?: number | null;
  personaId?: number | null;
}) =>
  jwt.sign(
    {
      sub: String(
        payload.usuarioId ?? payload.empleadoId ?? payload.clienteId ?? payload.username,
      ),
      username: payload.username,
      role: payload.role,
      usuarioId: payload.usuarioId ?? 0,
      clienteId: payload.clienteId ?? 0,
      empleadoId: payload.empleadoId ?? 0,
      personaId: payload.personaId ?? 0,
    },
    env.auth.jwtSecret,
    { expiresIn: env.auth.jwtExpiresIn as jwt.SignOptions["expiresIn"] },
  );

const getFirstRow = <T extends Row>(rows: unknown): T | null => {
  const data = rows as T[] | undefined;
  return data && data.length > 0 ? data[0] : null;
};

const findClienteByEmail = async (
  connection: oracledb.Connection,
  email: string,
) => {
  const result = await connection.execute(
    `SELECT CLI_Cliente, CLI_Primer_Nombre, CLI_Primer_Apellido, CLI_Correo_Electronico
     FROM MUE_CLIENTE
     WHERE LOWER(CLI_Correo_Electronico) = LOWER(:email)
     FETCH FIRST 1 ROW ONLY`,
    { email },
  );

  return getFirstRow(result.rows);
};

const findClienteById = async (
  connection: oracledb.Connection,
  clienteId: number,
) => {
  const result = await connection.execute(
    `SELECT CLI_Cliente, CLI_Primer_Nombre, CLI_Primer_Apellido, CLI_Correo_Electronico
     FROM MUE_CLIENTE
     WHERE CLI_Cliente = :clienteId
     FETCH FIRST 1 ROW ONLY`,
    { clienteId },
  );

  return getFirstRow(result.rows);
};

const getUsuarioByUsername = async (
  connection: oracledb.Connection,
  username: string,
  meta?: UsuarioMeta,
) => {
  const usuarioMeta = meta ?? (await getUsuarioMeta(connection));
  const select = getUsuarioSelect(usuarioMeta);

  const result = await connection.execute(
    `SELECT ${select}
     FROM MUE_USUARIO
     WHERE LOWER(USU_Nombre_Usuario) = LOWER(:username)
     FETCH FIRST 1 ROW ONLY`,
    { username },
  );

  return getFirstRow(result.rows);
};

const getUsuarioByPersonaId = async (
  connection: oracledb.Connection,
  personaId: number,
  meta?: UsuarioMeta,
) => {
  const usuarioMeta = meta ?? (await getUsuarioMeta(connection));
  if (!usuarioMeta.hasPerPersona) {
    return null;
  }

  const select = getUsuarioSelect(usuarioMeta);
  const result = await connection.execute(
    `SELECT ${select}
     FROM MUE_USUARIO
     WHERE PER_Persona = :personaId
     ORDER BY USU_Usuario DESC
     FETCH FIRST 1 ROW ONLY`,
    { personaId },
  );

  return getFirstRow(result.rows);
};

const getPersonaById = async (
  connection: oracledb.Connection,
  personaId: number,
) => {
  const result = await connection.execute(
    `SELECT PER_Persona, PER_Correo, PER_Nombre, PER_Primer_Apellido, PER_Segundo_Apellido
     FROM MUE_PERSONA
     WHERE PER_Persona = :personaId
     FETCH FIRST 1 ROW ONLY`,
    { personaId },
  );

  return getFirstRow(result.rows);
};

const getEmpleadoByPersonaId = async (
  connection: oracledb.Connection,
  personaId: number,
) => {
  const result = await connection.execute(
    `SELECT e.EMP_Empleado,
            e.EMP_Estado,
            p.PER_Persona,
            p.PER_Nombre,
            p.PER_Primer_Apellido,
            p.PER_Segundo_Apellido,
            p.PER_Correo
     FROM MUE_EMPLEADO e
     JOIN MUE_PERSONA p
       ON p.PER_Persona = e.PER_Persona
     WHERE e.PER_Persona = :personaId
     ORDER BY e.EMP_Empleado DESC
     FETCH FIRST 1 ROW ONLY`,
    { personaId },
  );

  return getFirstRow(result.rows);
};

const getEmpleadoById = async (
  connection: oracledb.Connection,
  empleadoId: number,
) => {
  const result = await connection.execute(
    `SELECT e.EMP_Empleado,
            e.EMP_Estado,
            e.PER_Persona,
            p.PER_Nombre,
            p.PER_Primer_Apellido,
            p.PER_Segundo_Apellido,
            p.PER_Correo
     FROM MUE_EMPLEADO e
     JOIN MUE_PERSONA p
       ON p.PER_Persona = e.PER_Persona
     WHERE e.EMP_Empleado = :empleadoId
     FETCH FIRST 1 ROW ONLY`,
    { empleadoId },
  );

  return getFirstRow(result.rows);
};

const createCliente = async (
  connection: oracledb.Connection,
  payload: ClienteRegisterPayload,
) => {
  const result = await connection.execute(
    `INSERT INTO MUE_CLIENTE (
       CLI_Primer_Nombre,
       CLI_Segundo_Nombre,
       CLI_Primer_Apellido,
       CLI_Segundo_Apellido,
       CLI_Departamento,
       CLI_Municipio,
       CLI_Zona_Aldea,
       CLI_Telefono,
       CLI_Pais,
       CLI_Tipo_Documento,
       CLI_Numero_Documento,
       CLI_Correo_Electronico
     ) VALUES (
       :primerNombre,
       :segundoNombre,
       :primerApellido,
       :segundoApellido,
       :departamento,
       :municipio,
       :zonaAldea,
       :telefono,
       :pais,
       :tipoDocumento,
       :numeroDocumento,
       :correo
     )
     RETURNING CLI_Cliente INTO :id`,
    {
      primerNombre: payload.CLI_Primer_Nombre.trim(),
      segundoNombre: optionalText(payload.CLI_Segundo_Nombre),
      primerApellido: payload.CLI_Primer_Apellido.trim(),
      segundoApellido: optionalText(payload.CLI_Segundo_Apellido),
      departamento: optionalText(payload.CLI_Departamento),
      municipio: optionalText(payload.CLI_Municipio),
      zonaAldea: optionalText(payload.CLI_Zona_Aldea),
      telefono: optionalText(payload.CLI_Telefono),
      pais: optionalText(payload.CLI_Pais),
      tipoDocumento: optionalText(payload.CLI_Tipo_Documento),
      numeroDocumento: optionalText(payload.CLI_Numero_Documento),
      correo: payload.CLI_Correo_Electronico.trim().toLowerCase(),
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    },
  );

  const outBinds = result.outBinds as { id: number[] };
  return outBinds.id[0];
};

const createPersona = async (
  connection: oracledb.Connection,
  payload: ClienteRegisterPayload,
) => {
  const result = await connection.execute(
    `INSERT INTO MUE_PERSONA (
       PER_Tipo_Documento,
       PER_Nombre,
       PER_Primer_Apellido,
       PER_Segundo_Apellido,
       PER_Correo,
       PER_Telefono,
       PER_Pais,
       PER_Departamento,
       PER_Municipio,
       PER_Zona_Aldea,
       PER_Domicilio
     ) VALUES (
       :tipoDocumento,
       :nombre,
       :primerApellido,
       :segundoApellido,
       :correo,
       :telefono,
       :pais,
       :departamento,
       :municipio,
       :zonaAldea,
       :domicilio
     )
     RETURNING PER_Persona INTO :id`,
    {
      tipoDocumento:
        optionalText(payload.PER_Tipo_Documento) ??
        optionalText(payload.CLI_Tipo_Documento) ??
        "DPI",
      nombre: optionalText(payload.PER_Nombre) ?? payload.CLI_Primer_Nombre.trim(),
      primerApellido:
        optionalText(payload.PER_Primer_Apellido) ??
        payload.CLI_Primer_Apellido.trim(),
      segundoApellido:
        optionalText(payload.PER_Segundo_Apellido) ??
        optionalText(payload.CLI_Segundo_Apellido),
      correo:
        optionalText(payload.PER_Correo)?.toLowerCase() ??
        payload.CLI_Correo_Electronico.trim().toLowerCase(),
      telefono:
        optionalText(payload.PER_Telefono) ?? optionalText(payload.CLI_Telefono),
      pais: optionalText(payload.PER_Pais) ?? optionalText(payload.CLI_Pais),
      departamento:
        optionalText(payload.PER_Departamento) ??
        optionalText(payload.CLI_Departamento),
      municipio:
        optionalText(payload.PER_Municipio) ?? optionalText(payload.CLI_Municipio),
      zonaAldea:
        optionalText(payload.PER_Zona_Aldea) ?? optionalText(payload.CLI_Zona_Aldea),
      domicilio: optionalText(payload.PER_Domicilio),
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    },
  );

  const outBinds = result.outBinds as { id: number[] };
  return outBinds.id[0];
};

const createClienteUsuario = async (
  connection: oracledb.Connection,
  payload: ClienteRegisterPayload,
  clienteId: number,
) => {
  const username = (payload.username ?? payload.CLI_Correo_Electronico)
    .trim()
    .toLowerCase();
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const meta = await getUsuarioMeta(connection);

  const existingUser = await getUsuarioByUsername(connection, username, meta);
  if (existingUser) {
    throw new ShopAuthServiceError("El nombre de usuario ya esta en uso.", 409);
  }

  const shouldCreatePersona =
    meta.hasPerPersona && (meta.requiresPerPersona || hasPersonaPayload(payload));
  const personaId = shouldCreatePersona ? await createPersona(connection, payload) : null;

  if (meta.hasCliCliente && meta.hasPerPersona) {
    const result = await connection.execute(
      `INSERT INTO MUE_USUARIO (
         CLI_Cliente,
         PER_Persona,
         USU_Nombre_Usuario,
         USU_Clave
       ) VALUES (
         :clienteId,
         :personaId,
         :username,
         :password
       )
       RETURNING USU_Usuario INTO :id`,
      {
        clienteId,
        personaId,
        username,
        password: passwordHash,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );

    const outBinds = result.outBinds as { id: number[] };
    return { usuarioId: outBinds.id[0], username, personaId };
  }

  if (meta.hasCliCliente) {
    const result = await connection.execute(
      `INSERT INTO MUE_USUARIO (
         CLI_Cliente,
         USU_Nombre_Usuario,
         USU_Clave
       ) VALUES (
         :clienteId,
         :username,
         :password
       )
       RETURNING USU_Usuario INTO :id`,
      {
        clienteId,
        username,
        password: passwordHash,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );

    const outBinds = result.outBinds as { id: number[] };
    return { usuarioId: outBinds.id[0], username, personaId };
  }

  const result = await connection.execute(
    `INSERT INTO MUE_USUARIO (
       PER_Persona,
       USU_Nombre_Usuario,
       USU_Clave
     ) VALUES (
       :personaId,
       :username,
       :password
     )
     RETURNING USU_Usuario INTO :id`,
    {
      personaId,
      username,
      password: passwordHash,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    },
  );

  const outBinds = result.outBinds as { id: number[] };
  return { usuarioId: outBinds.id[0], username, personaId };
};

const buildClienteSessionUser = (
  cliente: Row,
  username: string,
  personaId?: number | null,
): AuthSessionUser => ({
  role: "CLIENTE",
  clienteId: Number(cliente.CLI_CLIENTE ?? 0) || null,
  empleadoId: null,
  personaId: personaId ?? null,
  username,
  correo: String(cliente.CLI_CORREO_ELECTRONICO ?? username),
  nombreCompleto:
    buildFullName(
      String(cliente.CLI_PRIMER_NOMBRE ?? ""),
      String(cliente.CLI_PRIMER_APELLIDO ?? ""),
    ) || username,
});

const buildAdminSessionUser = (empleado: Row, username: string): AuthSessionUser => ({
  role: "ADMIN",
  clienteId: null,
  empleadoId: Number(empleado.EMP_EMPLEADO ?? 0) || null,
  personaId: Number(empleado.PER_PERSONA ?? 0) || null,
  username,
  correo: String(empleado.PER_CORREO ?? username),
  nombreCompleto:
    buildFullName(
      String(empleado.PER_NOMBRE ?? ""),
      String(empleado.PER_PRIMER_APELLIDO ?? ""),
      String(empleado.PER_SEGUNDO_APELLIDO ?? ""),
    ) || username,
});

const resolveClienteFromUsuario = async (
  connection: oracledb.Connection,
  user: Row,
  username: string,
) => {
  let cliente: Row | null = null;

  const clienteIdDirecto = Number(user.CLI_CLIENTE ?? 0);
  if (clienteIdDirecto > 0) {
    cliente = await findClienteById(connection, clienteIdDirecto);
  }

  const personaId = Number(user.PER_PERSONA ?? 0);
  if (!cliente && personaId > 0) {
    const persona = await getPersonaById(connection, personaId);
    const correoPersona = String(persona?.PER_CORREO ?? "").trim().toLowerCase();
    if (correoPersona) {
      cliente = await findClienteByEmail(connection, correoPersona);
    }
  }

  if (!cliente) {
    cliente = await findClienteByEmail(connection, username);
  }

  return cliente;
};

const buildSessionFromUsuario = async (
  connection: oracledb.Connection,
  user: Row,
): Promise<AuthSessionResponse> => {
  const username = String(user.USU_NOMBRE_USUARIO ?? "").trim().toLowerCase();
  const usuarioId = Number(user.USU_USUARIO ?? 0) || null;
  const personaId = Number(user.PER_PERSONA ?? 0) || null;

  if (personaId) {
    const empleado = await getEmpleadoByPersonaId(connection, personaId);
    if (empleado) {
      if (String(empleado.EMP_ESTADO ?? "INACTIVO").toUpperCase() !== "ACTIVO") {
        throw new ShopAuthServiceError(
          "El acceso del empleado no se encuentra activo.",
          403,
        );
      }

      const sessionUser = buildAdminSessionUser(empleado, username);
      return {
        token: createAuthToken({
          role: sessionUser.role,
          username: sessionUser.username,
          usuarioId,
          empleadoId: sessionUser.empleadoId,
          personaId: sessionUser.personaId,
        }),
        user: sessionUser,
      };
    }
  }

  const cliente = await resolveClienteFromUsuario(connection, user, username);
  if (!cliente) {
    throw new ShopAuthServiceError(
      "El usuario no tiene un perfil asociado.",
      404,
    );
  }

  const sessionUser = buildClienteSessionUser(cliente, username, personaId);
  return {
    token: createAuthToken({
      role: sessionUser.role,
      username: sessionUser.username,
      usuarioId,
      clienteId: sessionUser.clienteId,
      personaId: sessionUser.personaId,
    }),
    user: sessionUser,
  };
};

export const registerCliente = async (
  payload: ClienteRegisterPayload,
): Promise<AuthSessionResponse> => {
  let connection: oracledb.Connection | undefined;
  try {
    connection = await getDatabaseConnection();

    const existing = await findClienteByEmail(connection, payload.CLI_Correo_Electronico);
    if (existing) {
      throw new ShopAuthServiceError(
        "Ya existe un cliente registrado con ese correo.",
        409,
      );
    }

    const clienteId = await createCliente(connection, payload);
    const usuario = await createClienteUsuario(connection, payload, clienteId);

    await connection.commit();

    const sessionUser = buildClienteSessionUser(
      {
        CLI_CLIENTE: clienteId,
        CLI_PRIMER_NOMBRE: payload.CLI_Primer_Nombre.trim(),
        CLI_PRIMER_APELLIDO: payload.CLI_Primer_Apellido.trim(),
        CLI_CORREO_ELECTRONICO: payload.CLI_Correo_Electronico.trim().toLowerCase(),
      },
      usuario.username,
      usuario.personaId,
    );

    return {
      token: createAuthToken({
        role: sessionUser.role,
        username: sessionUser.username,
        usuarioId: usuario.usuarioId,
        clienteId: sessionUser.clienteId,
        personaId: sessionUser.personaId,
      }),
      user: sessionUser,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    const message = error instanceof Error ? error.message : "";
    if (message.includes("ORA-00001")) {
      throw new ShopAuthServiceError(
        "Ya existe un registro con los datos proporcionados.",
        409,
      );
    }
    throw error;
  } finally {
    if (connection) await connection.close();
  }
};

export const loginUsuario = async (
  payload: ClienteLoginPayload,
): Promise<AuthSessionResponse> => {
  let connection: oracledb.Connection | undefined;
  try {
    connection = await getDatabaseConnection();

    const user = await getUsuarioByUsername(
      connection,
      payload.username.trim().toLowerCase(),
    );
    if (!user) {
      throw new ShopAuthServiceError("Credenciales invalidas.", 401);
    }

    const hash = String(user.USU_CLAVE ?? "");
    const isValidPassword = await bcrypt.compare(payload.password, hash);
    if (!isValidPassword) {
      throw new ShopAuthServiceError("Credenciales invalidas.", 401);
    }

    return await buildSessionFromUsuario(connection, user);
  } finally {
    if (connection) await connection.close();
  }
};

export const loginCliente = loginUsuario;

export const getProfileByClienteId = async (clienteId: number) => {
  try {
    const { obtenerClientePorId } = await import("./clienteService");
    return await obtenerClientePorId(clienteId);
  } catch (error) {
    if (error instanceof ShopAuthServiceError) {
      throw error;
    }
    const { ClienteServiceError } = await import("./clienteService");
    if (error instanceof ClienteServiceError) {
      throw new ShopAuthServiceError(error.message, error.statusCode);
    }
    throw error;
  }
};

export const getAuthenticatedAccount = async (claims: AuthClaims) => {
  if (claims.role === "ADMIN") {
    if (!claims.empleadoId) {
      throw new ShopAuthServiceError(
        "El usuario autenticado no tiene un empleado asociado.",
        403,
      );
    }

    const { obtenerEmpleadoPorId } = await import("./empleadoService");
    const data = await obtenerEmpleadoPorId(claims.empleadoId);

    return {
      role: "ADMIN" as const,
      empleadoId: claims.empleadoId,
      username: claims.username,
      profile: data.empleado,
      detalles: data.detalles,
    };
  }

  if (!claims.clienteId) {
    throw new ShopAuthServiceError(
      "El usuario autenticado no tiene un cliente asociado.",
      403,
    );
  }

  const profile = await getProfileByClienteId(claims.clienteId);

  return {
    role: "CLIENTE" as const,
    clienteId: profile.CLI_CLIENTE,
    username: claims.username,
    profile,
  };
};

const getEmpleadoAccesoContext = async (
  connection: oracledb.Connection,
  empleadoId: number,
) => {
  const empleado = await getEmpleadoById(connection, empleadoId);
  if (!empleado) {
    throw new ShopAuthServiceError("Empleado no encontrado.", 404);
  }

  const personaId = Number(empleado.PER_PERSONA ?? 0);
  if (personaId <= 0) {
    throw new ShopAuthServiceError(
      "El empleado no tiene una persona asociada para crear acceso.",
      400,
    );
  }

  return {
    empleado,
    personaId,
  };
};

export const getEmpleadoAccessById = async (empleadoId: number) => {
  let connection: oracledb.Connection | undefined;
  try {
    connection = await getDatabaseConnection();
    const meta = await getUsuarioMeta(connection);
    const context = await getEmpleadoAccesoContext(connection, empleadoId);
    const user = await getUsuarioByPersonaId(connection, context.personaId, meta);

    return {
      empleadoId,
      personaId: context.personaId,
      usuarioId: Number(user?.USU_USUARIO ?? 0) || null,
      username: user ? String(user.USU_NOMBRE_USUARIO ?? "") : null,
      passwordStatus: user ? "CONFIGURADA" : "SIN_ACCESO",
    };
  } finally {
    if (connection) await connection.close();
  }
};

export const createEmpleadoAccess = async (
  empleadoId: number,
  payload: EmployeeAccessPayload,
) => {
  let connection: oracledb.Connection | undefined;
  try {
    connection = await getDatabaseConnection();
    const meta = await getUsuarioMeta(connection);

    if (!meta.hasPerPersona) {
      throw new ShopAuthServiceError(
        "La tabla MUE_USUARIO no permite asociar accesos por persona.",
        400,
      );
    }

    if (meta.requiresCliCliente) {
      throw new ShopAuthServiceError(
        "La estructura actual de MUE_USUARIO requiere un cliente asociado y no permite crear accesos de empleado en esta configuracion.",
        400,
      );
    }

    const context = await getEmpleadoAccesoContext(connection, empleadoId);
    const username = payload.username.trim().toLowerCase();
    const existingUser = await getUsuarioByUsername(connection, username, meta);
    if (existingUser) {
      throw new ShopAuthServiceError("El nombre de usuario ya esta en uso.", 409);
    }

    const existingAccess = await getUsuarioByPersonaId(
      connection,
      context.personaId,
      meta,
    );
    if (existingAccess) {
      throw new ShopAuthServiceError(
        "El empleado ya tiene un acceso registrado.",
        409,
      );
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const columns: string[] = [];
    const values: string[] = [];
    const binds: Record<string, unknown> = {
      username,
      password: passwordHash,
    };

    if (meta.hasCliCliente) {
      columns.push("CLI_Cliente");
      values.push(":clienteId");
      binds.clienteId = null;
    }

    columns.push("PER_Persona");
    values.push(":personaId");
    binds.personaId = context.personaId;

    columns.push("USU_Nombre_Usuario", "USU_Clave");
    values.push(":username", ":password");

    const result = await connection.execute(
      `INSERT INTO MUE_USUARIO (${columns.join(", ")})
       VALUES (${values.join(", ")})
       RETURNING USU_Usuario INTO :id`,
      {
        ...binds,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );

    const outBinds = result.outBinds as { id: number[] };
    await connection.commit();

    return {
      empleadoId,
      personaId: context.personaId,
      usuarioId: outBinds.id[0],
      username,
      passwordStatus: "CONFIGURADA" as const,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    const message = error instanceof Error ? error.message : "";
    if (message.includes("ORA-00001")) {
      throw new ShopAuthServiceError(
        "Ya existe un usuario con los datos proporcionados.",
        409,
      );
    }
    throw error;
  } finally {
    if (connection) await connection.close();
  }
};

export const updateEmpleadoAccess = async (
  empleadoId: number,
  payload: EmployeeAccessPayload,
) => {
  let connection: oracledb.Connection | undefined;
  try {
    connection = await getDatabaseConnection();
    const meta = await getUsuarioMeta(connection);
    const context = await getEmpleadoAccesoContext(connection, empleadoId);
    const existingAccess = await getUsuarioByPersonaId(
      connection,
      context.personaId,
      meta,
    );

    if (!existingAccess) {
      throw new ShopAuthServiceError(
        "El empleado no tiene un acceso previo para actualizar.",
        404,
      );
    }

    const username = payload.username.trim().toLowerCase();
    const existingUsername = await getUsuarioByUsername(connection, username, meta);
    if (
      existingUsername &&
      Number(existingUsername.USU_USUARIO ?? 0) !==
        Number(existingAccess.USU_USUARIO ?? 0)
    ) {
      throw new ShopAuthServiceError("El nombre de usuario ya esta en uso.", 409);
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const usuarioId = Number(existingAccess.USU_USUARIO ?? 0);

    await connection.execute(
      `UPDATE MUE_USUARIO
       SET USU_Nombre_Usuario = :username,
           USU_Clave = :password
       WHERE USU_Usuario = :usuarioId`,
      {
        usuarioId,
        username,
        password: passwordHash,
      },
    );

    await connection.commit();

    return {
      empleadoId,
      personaId: context.personaId,
      usuarioId,
      username,
      passwordStatus: "CONFIGURADA" as const,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    const message = error instanceof Error ? error.message : "";
    if (message.includes("ORA-00001")) {
      throw new ShopAuthServiceError(
        "Ya existe un usuario con los datos proporcionados.",
        409,
      );
    }
    throw error;
  } finally {
    if (connection) await connection.close();
  }
};
