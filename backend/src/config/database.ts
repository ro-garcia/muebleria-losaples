import oracledb from "oracledb";
import { env } from "./env";

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const buildConnectString = (host: string) =>
  `${host}:${env.db.port}/${env.db.serviceName}`;

const PRIMARY_CONNECT_STRING =
  env.db.connectString || buildConnectString(env.db.host);

const STANDBY_CONNECT_STRING =
  env.db.standbyConnectString || buildConnectString(env.db.standbyHost || "");

const tryConnect = async (connectString: string) => {
  return oracledb.getConnection({
    user: env.db.user,
    password: env.db.password,
    connectString,
    connectTimeout: Math.floor(env.db.connectionTimeoutMs / 1000),
  });
};

export const getDatabaseConnection = async () => {
  // Intentar Primary primero
  try {
    const conn = await tryConnect(PRIMARY_CONNECT_STRING);
    return conn;
  } catch (primaryError) {
    console.warn(
      "[DB] Primary no disponible, intentando Standby...",
      primaryError instanceof Error ? primaryError.message : primaryError,
    );
  }

  // Fallback al Standby
  try {
    const conn = await tryConnect(STANDBY_CONNECT_STRING);
    console.info("[DB] Conectado al Standby (modo lectura)");
    return conn;
  } catch (standbyError) {
    console.error("[DB] Standby tampoco disponible.");
    throw new Error(
      "No se pudo conectar a ninguna base de datos. " +
        (standbyError instanceof Error ? standbyError.message : ""),
    );
  }
};