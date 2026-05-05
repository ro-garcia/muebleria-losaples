import oracledb from "oracledb";

import { getDatabaseConnection } from "../config/database";

type Row = Record<string, unknown>;

export interface EmpleadoPayload {
  PER_Tipo_Documento: string;
  PER_Nombre: string;
  PER_Primer_Apellido: string;
  PER_Segundo_Apellido?: string | null;
  PER_Correo?: string | null;
  PER_Telefono?: string | null;
  PER_Pais?: string | null;
  PER_Departamento?: string | null;
  PER_Municipio?: string | null;
  PER_Zona_Aldea?: string | null;
  PER_Domicilio?: string | null;
  EMP_Tipo_Contrato: string;
  EMP_Estado: "ACTIVO" | "INACTIVO";
  CAR_Cargo: number;
  PUE_Puesto: number;
  DEP_Departamento: number;
  DEM_Fecha_Inicio: string;
  DEM_Fecha_Fin?: string | null;
  DEM_Salario: number;
  DEM_Estado: "ACTIVO" | "INACTIVO";
}

export class EmpleadoServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

const getRows = (rows: unknown) => (rows ?? []) as Row[];

const getFirstRow = <T extends Row>(rows: unknown): T | null => {
  const data = rows as T[] | undefined;
  return data && data.length > 0 ? data[0] : null;
};

const toText = (value: unknown) => String(value ?? "").trim();

const optionalText = (value: unknown) => {
  const text = toText(value);
  return text.length > 0 ? text : null;
};

const validatePositiveId = (value: number, label: string) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new EmpleadoServiceError(`${label} invalido.`, 400);
  }
};

const CURRENT_DETAIL_JOIN = `
  LEFT JOIN (
    SELECT d.DEM_Detalle_Empleado,
           d.EMP_Empleado,
           d.CAR_Cargo,
           d.PUE_Puesto,
           d.DEP_Departamento,
           d.DEM_Fecha_Inicio,
           d.DEM_Fecha_Fin,
           d.DEM_Salario,
           d.DEM_Estado,
           c.CAR_Nombre,
           pue.PUE_Nombre,
           dep.DEP_Nombre,
           ROW_NUMBER() OVER (
             PARTITION BY d.EMP_Empleado
             ORDER BY CASE WHEN d.DEM_Estado = 'ACTIVO' THEN 0 ELSE 1 END,
                      NVL(d.DEM_Fecha_Inicio, DATE '1900-01-01') DESC,
                      d.DEM_Detalle_Empleado DESC
           ) AS rn
    FROM MUE_DETALLE_EMPLEADO d
    LEFT JOIN MUE_CARGO c
      ON c.CAR_Cargo = d.CAR_Cargo
    LEFT JOIN MUE_PUESTO pue
      ON pue.PUE_Puesto = d.PUE_Puesto
    LEFT JOIN MUE_DEPARTAMENTO dep
      ON dep.DEP_Departamento = d.DEP_Departamento
  ) detalle
    ON detalle.EMP_Empleado = e.EMP_Empleado
   AND detalle.rn = 1
`;

const EMPLEADO_SELECT = `
  SELECT e.EMP_Empleado,
         e.PER_Persona,
         e.EMP_Estado,
         e.EMP_Tipo_Contrato,
         p.PER_Tipo_Documento,
         p.PER_Nombre,
         p.PER_Primer_Apellido,
         p.PER_Segundo_Apellido,
         p.PER_Correo,
         p.PER_Telefono,
         p.PER_Pais,
         p.PER_Departamento,
         p.PER_Municipio,
         p.PER_Zona_Aldea,
         p.PER_Domicilio,
         p.PER_Fecha_Creacion,
         TRIM(
           p.PER_Nombre || ' ' ||
           p.PER_Primer_Apellido || ' ' ||
           NVL(p.PER_Segundo_Apellido, '')
         ) AS EMPLEADO_NOMBRE,
         detalle.DEM_Detalle_Empleado,
         detalle.CAR_Cargo,
         detalle.CAR_Nombre,
         detalle.PUE_Puesto,
         detalle.PUE_Nombre,
         detalle.DEP_Departamento,
         detalle.DEP_Nombre,
         detalle.DEM_Fecha_Inicio,
         detalle.DEM_Fecha_Fin,
         detalle.DEM_Salario,
         detalle.DEM_Estado
  FROM MUE_EMPLEADO e
  JOIN MUE_PERSONA p
    ON p.PER_Persona = e.PER_Persona
  ${CURRENT_DETAIL_JOIN}
`;

const getEmpleadoByIdInternal = async (
  connection: oracledb.Connection,
  empleadoId: number,
) => {
  const result = await connection.execute(
    `${EMPLEADO_SELECT}
     WHERE e.EMP_Empleado = :empleadoId`,
    { empleadoId },
  );

  return getFirstRow(result.rows);
};

const getDetallesHistoricos = async (
  connection: oracledb.Connection,
  empleadoId: number,
) => {
  const result = await connection.execute(
    `SELECT d.DEM_Detalle_Empleado,
            d.EMP_Empleado,
            d.CAR_Cargo,
            c.CAR_Nombre,
            d.PUE_Puesto,
            pue.PUE_Nombre,
            d.DEP_Departamento,
            dep.DEP_Nombre,
            d.DEM_Fecha_Inicio,
            d.DEM_Fecha_Fin,
            d.DEM_Salario,
            d.DEM_Estado
     FROM MUE_DETALLE_EMPLEADO d
     LEFT JOIN MUE_CARGO c
       ON c.CAR_Cargo = d.CAR_Cargo
     LEFT JOIN MUE_PUESTO pue
       ON pue.PUE_Puesto = d.PUE_Puesto
     LEFT JOIN MUE_DEPARTAMENTO dep
       ON dep.DEP_Departamento = d.DEP_Departamento
     WHERE d.EMP_Empleado = :empleadoId
     ORDER BY NVL(d.DEM_Fecha_Inicio, DATE '1900-01-01') DESC,
              d.DEM_Detalle_Empleado DESC`,
    { empleadoId },
  );

  return getRows(result.rows);
};

const ensureCatalogExists = async (
  connection: oracledb.Connection,
  query: string,
  binds: oracledb.BindParameters,
  message: string,
) => {
  const result = await connection.execute(query, binds);
  if (!getFirstRow(result.rows)) {
    throw new EmpleadoServiceError(message, 400);
  }
};

const validateCatalogs = async (
  connection: oracledb.Connection,
  payload: EmpleadoPayload,
) => {
  validatePositiveId(payload.CAR_Cargo, "Cargo");
  validatePositiveId(payload.PUE_Puesto, "Puesto");
  validatePositiveId(payload.DEP_Departamento, "Departamento laboral");

  if (payload.DEM_Salario < 0) {
    throw new EmpleadoServiceError(
      "El salario no puede ser negativo.",
      400,
    );
  }

  await Promise.all([
    ensureCatalogExists(
      connection,
      `SELECT CAR_Cargo
       FROM MUE_CARGO
       WHERE CAR_Cargo = :id
       FETCH FIRST 1 ROW ONLY`,
      { id: payload.CAR_Cargo },
      "El cargo seleccionado no existe.",
    ),
    ensureCatalogExists(
      connection,
      `SELECT PUE_Puesto
       FROM MUE_PUESTO
       WHERE PUE_Puesto = :id
       FETCH FIRST 1 ROW ONLY`,
      { id: payload.PUE_Puesto },
      "El puesto seleccionado no existe.",
    ),
    ensureCatalogExists(
      connection,
      `SELECT DEP_Departamento
       FROM MUE_DEPARTAMENTO
       WHERE DEP_Departamento = :id
       FETCH FIRST 1 ROW ONLY`,
      { id: payload.DEP_Departamento },
      "El departamento laboral seleccionado no existe.",
    ),
  ]);
};

const createPersona = async (
  connection: oracledb.Connection,
  payload: EmpleadoPayload,
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
       PER_Domicilio,
       PER_Fecha_Creacion
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
       :domicilio,
       SYSDATE
     )
     RETURNING PER_Persona INTO :id`,
    {
      tipoDocumento: payload.PER_Tipo_Documento.trim(),
      nombre: payload.PER_Nombre.trim(),
      primerApellido: payload.PER_Primer_Apellido.trim(),
      segundoApellido: optionalText(payload.PER_Segundo_Apellido),
      correo: optionalText(payload.PER_Correo)?.toLowerCase() ?? null,
      telefono: optionalText(payload.PER_Telefono),
      pais: optionalText(payload.PER_Pais),
      departamento: optionalText(payload.PER_Departamento),
      municipio: optionalText(payload.PER_Municipio),
      zonaAldea: optionalText(payload.PER_Zona_Aldea),
      domicilio: optionalText(payload.PER_Domicilio),
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    },
    { autoCommit: false },
  );

  const outBinds = result.outBinds as { id: number[] };
  return outBinds.id[0];
};

const createEmpleado = async (
  connection: oracledb.Connection,
  personaId: number,
  payload: EmpleadoPayload,
) => {
  const result = await connection.execute(
    `INSERT INTO MUE_EMPLEADO (
       PER_Persona,
       EMP_Estado,
       EMP_Tipo_Contrato
     ) VALUES (
       :personaId,
       :estado,
       :tipoContrato
     )
     RETURNING EMP_Empleado INTO :id`,
    {
      personaId,
      estado: payload.EMP_Estado,
      tipoContrato: payload.EMP_Tipo_Contrato.trim(),
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    },
    { autoCommit: false },
  );

  const outBinds = result.outBinds as { id: number[] };
  return outBinds.id[0];
};

const createDetalleEmpleado = async (
  connection: oracledb.Connection,
  empleadoId: number,
  payload: EmpleadoPayload,
) => {
  const result = await connection.execute(
    `INSERT INTO MUE_DETALLE_EMPLEADO (
       EMP_Empleado,
       CAR_Cargo,
       PUE_Puesto,
       DEP_Departamento,
       DEM_Fecha_Inicio,
       DEM_Fecha_Fin,
       DEM_Salario,
       DEM_Estado
     ) VALUES (
       :empleadoId,
       :cargoId,
       :puestoId,
       :departamentoId,
       TO_DATE(:fechaInicio, 'YYYY-MM-DD'),
       CASE
         WHEN :fechaFin IS NULL THEN NULL
         ELSE TO_DATE(:fechaFin, 'YYYY-MM-DD')
       END,
       :salario,
       :estado
     )
     RETURNING DEM_Detalle_Empleado INTO :id`,
    {
      empleadoId,
      cargoId: payload.CAR_Cargo,
      puestoId: payload.PUE_Puesto,
      departamentoId: payload.DEP_Departamento,
      fechaInicio: payload.DEM_Fecha_Inicio,
      fechaFin: payload.DEM_Fecha_Fin ?? null,
      salario: payload.DEM_Salario,
      estado: payload.DEM_Estado,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    },
    { autoCommit: false },
  );

  const outBinds = result.outBinds as { id: number[] };
  return outBinds.id[0];
};

const updatePersona = async (
  connection: oracledb.Connection,
  personaId: number,
  payload: EmpleadoPayload,
) => {
  await connection.execute(
    `UPDATE MUE_PERSONA
     SET PER_Tipo_Documento = :tipoDocumento,
         PER_Nombre = :nombre,
         PER_Primer_Apellido = :primerApellido,
         PER_Segundo_Apellido = :segundoApellido,
         PER_Correo = :correo,
         PER_Telefono = :telefono,
         PER_Pais = :pais,
         PER_Departamento = :departamento,
         PER_Municipio = :municipio,
         PER_Zona_Aldea = :zonaAldea,
         PER_Domicilio = :domicilio
     WHERE PER_Persona = :personaId`,
    {
      personaId,
      tipoDocumento: payload.PER_Tipo_Documento.trim(),
      nombre: payload.PER_Nombre.trim(),
      primerApellido: payload.PER_Primer_Apellido.trim(),
      segundoApellido: optionalText(payload.PER_Segundo_Apellido),
      correo: optionalText(payload.PER_Correo)?.toLowerCase() ?? null,
      telefono: optionalText(payload.PER_Telefono),
      pais: optionalText(payload.PER_Pais),
      departamento: optionalText(payload.PER_Departamento),
      municipio: optionalText(payload.PER_Municipio),
      zonaAldea: optionalText(payload.PER_Zona_Aldea),
      domicilio: optionalText(payload.PER_Domicilio),
    },
    { autoCommit: false },
  );
};

const updateEmpleado = async (
  connection: oracledb.Connection,
  empleadoId: number,
  payload: EmpleadoPayload,
) => {
  await connection.execute(
    `UPDATE MUE_EMPLEADO
     SET EMP_Estado = :estado,
         EMP_Tipo_Contrato = :tipoContrato
     WHERE EMP_Empleado = :empleadoId`,
    {
      empleadoId,
      estado: payload.EMP_Estado,
      tipoContrato: payload.EMP_Tipo_Contrato.trim(),
    },
    { autoCommit: false },
  );
};

const updateDetalleEmpleado = async (
  connection: oracledb.Connection,
  detalleId: number,
  payload: EmpleadoPayload,
) => {
  await connection.execute(
    `UPDATE MUE_DETALLE_EMPLEADO
     SET CAR_Cargo = :cargoId,
         PUE_Puesto = :puestoId,
         DEP_Departamento = :departamentoId,
         DEM_Fecha_Inicio = TO_DATE(:fechaInicio, 'YYYY-MM-DD'),
         DEM_Fecha_Fin = CASE
           WHEN :fechaFin IS NULL THEN NULL
           ELSE TO_DATE(:fechaFin, 'YYYY-MM-DD')
         END,
         DEM_Salario = :salario,
         DEM_Estado = :estado
     WHERE DEM_Detalle_Empleado = :detalleId`,
    {
      detalleId,
      cargoId: payload.CAR_Cargo,
      puestoId: payload.PUE_Puesto,
      departamentoId: payload.DEP_Departamento,
      fechaInicio: payload.DEM_Fecha_Inicio,
      fechaFin: payload.DEM_Fecha_Fin ?? null,
      salario: payload.DEM_Salario,
      estado: payload.DEM_Estado,
    },
    { autoCommit: false },
  );
};

export const obtenerEmpleados = async (soloActivos = true) => {
  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `${EMPLEADO_SELECT}
       WHERE (:soloActivos = 0 OR e.EMP_Estado = 'ACTIVO')
       ORDER BY e.EMP_Empleado DESC`,
      { soloActivos: soloActivos ? 1 : 0 },
    );
    return getRows(result.rows);
  } finally {
    await connection.close();
  }
};

export const obtenerEmpleadoPorId = async (empleadoId: number) => {
  validatePositiveId(empleadoId, "Empleado");

  const connection = await getDatabaseConnection();
  try {
    const empleado = await getEmpleadoByIdInternal(connection, empleadoId);
    if (!empleado) {
      throw new EmpleadoServiceError("Empleado no encontrado.", 404);
    }

    const detalles = await getDetallesHistoricos(connection, empleadoId);
    return {
      empleado,
      detalles,
    };
  } finally {
    await connection.close();
  }
};

export const crearEmpleado = async (payload: EmpleadoPayload) => {
  let connection: oracledb.Connection | undefined;
  try {
    connection = await getDatabaseConnection();
    await validateCatalogs(connection, payload);

    const personaId = await createPersona(connection, payload);
    const empleadoId = await createEmpleado(connection, personaId, payload);
    await createDetalleEmpleado(connection, empleadoId, payload);

    await connection.commit();
    return obtenerEmpleadoPorId(empleadoId);
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

export const actualizarEmpleado = async (
  empleadoId: number,
  payload: EmpleadoPayload,
) => {
  validatePositiveId(empleadoId, "Empleado");

  let connection: oracledb.Connection | undefined;
  try {
    connection = await getDatabaseConnection();
    const current = await getEmpleadoByIdInternal(connection, empleadoId);

    if (!current) {
      throw new EmpleadoServiceError("Empleado no encontrado.", 404);
    }

    const personaId = Number(current.PER_PERSONA ?? 0);
    const detalleId = Number(current.DEM_DETALLE_EMPLEADO ?? 0);

    if (personaId <= 0 || detalleId <= 0) {
      throw new EmpleadoServiceError(
        "El empleado no tiene la relacion completa de persona o detalle laboral.",
        404,
      );
    }

    await validateCatalogs(connection, payload);
    await updatePersona(connection, personaId, payload);
    await updateEmpleado(connection, empleadoId, payload);
    await updateDetalleEmpleado(connection, detalleId, payload);

    await connection.commit();
    return obtenerEmpleadoPorId(empleadoId);
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

export const eliminarEmpleado = async (empleadoId: number) => {
  validatePositiveId(empleadoId, "Empleado");

  let connection: oracledb.Connection | undefined;
  try {
    connection = await getDatabaseConnection();
    const current = await getEmpleadoByIdInternal(connection, empleadoId);

    if (!current) {
      throw new EmpleadoServiceError("Empleado no encontrado.", 404);
    }

    await connection.execute(
      `UPDATE MUE_EMPLEADO
       SET EMP_Estado = 'INACTIVO'
       WHERE EMP_Empleado = :empleadoId`,
      { empleadoId },
      { autoCommit: false },
    );

    await connection.execute(
      `UPDATE MUE_DETALLE_EMPLEADO
       SET DEM_Estado = 'INACTIVO'
       WHERE EMP_Empleado = :empleadoId`,
      { empleadoId },
      { autoCommit: false },
    );

    await connection.commit();
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

export const obtenerCatalogoCargos = async () => {
  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `SELECT CAR_Cargo, CAR_Nombre
       FROM MUE_CARGO
       ORDER BY CAR_Nombre`,
    );
    return getRows(result.rows);
  } finally {
    await connection.close();
  }
};

export const obtenerCatalogoPuestos = async () => {
  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `SELECT PUE_Puesto, PUE_Nombre, PUE_Estado
       FROM MUE_PUESTO
       WHERE PUE_Estado = 'ACTIVO'
       ORDER BY PUE_Nombre`,
    );
    return getRows(result.rows);
  } finally {
    await connection.close();
  }
};

export const obtenerCatalogoDepartamentos = async () => {
  const connection = await getDatabaseConnection();
  try {
    const result = await connection.execute(
      `SELECT DEP_Departamento, DEP_Nombre, DEP_Estado
       FROM MUE_DEPARTAMENTO
       WHERE DEP_Estado = 'ACTIVO'
       ORDER BY DEP_Nombre`,
    );
    return getRows(result.rows);
  } finally {
    await connection.close();
  }
};
