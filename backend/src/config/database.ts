import oracledb from "oracledb";

import { env } from "./env";

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const getRequiredDatabaseValue = (key: keyof typeof env.db) => {
  const value = env.db[key];

  if (!value) {
    throw new Error(`Missing required database environment variable: ${key}`);
  }

  return value;
};

export const getDatabaseConnection = () => {
  const user = getRequiredDatabaseValue("user");
  const password = getRequiredDatabaseValue("password");
  const host = getRequiredDatabaseValue("host");
  const serviceName = getRequiredDatabaseValue("serviceName");

  return oracledb.getConnection({
    user: String(user),
    password: String(password),
    connectString: `${host}:${env.db.port}/${serviceName}`,
  });
};
