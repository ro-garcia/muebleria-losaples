import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },
  email: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "",
    secure: process.env.SMTP_SECURE === "true",
  },
  db: {
    user: process.env.DB_USER ?? "",
    password: process.env.DB_PASSWORD ?? "",
    host: process.env.DB_HOST ?? "",
    port: Number(process.env.DB_PORT ?? 1521),
    serviceName: process.env.DB_SERVICE_NAME ?? "",
    connectionTimeoutMs: Number(process.env.DB_CONNECTION_TIMEOUT_MS ?? 8000),
  },
};
