import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  db: {
    user: process.env.DB_USER ?? "",
    password: process.env.DB_PASSWORD ?? "",
    host: process.env.DB_HOST ?? "",
    port: Number(process.env.DB_PORT ?? 1521),
    serviceName: process.env.DB_SERVICE_NAME ?? "",
    connectionTimeoutMs: Number(process.env.DB_CONNECTION_TIMEOUT_MS ?? 8000),
  },
};
