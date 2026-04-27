import { getDatabaseConnection } from "../config/database";
import { env } from "../config/env";

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout?: () => void,
) => {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          onTimeout?.();
          reject(new Error(`Database connection timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

export const checkDatabaseHealth = async () => {
  let connection;
  let connectionTimedOut = false;

  try {
    const connectionPromise = getDatabaseConnection();

    connectionPromise
      .then((lateConnection) => {
        if (connectionTimedOut) {
          void lateConnection.close().catch(console.error);
        }
      })
      .catch(() => undefined);

    connection = await withTimeout(connectionPromise, env.db.connectionTimeoutMs, () => {
      connectionTimedOut = true;
    });

    await connection.execute("SELECT 1 AS ok FROM dual");
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};
