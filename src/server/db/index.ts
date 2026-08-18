import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  db: Database | undefined;
};

function createDb(): Database {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  globalForDb.conn ??= postgres(env.DATABASE_URL);
  globalForDb.db ??= drizzle(globalForDb.conn, { schema });
  return globalForDb.db;
}

/**
 * Real Drizzle instance when DATABASE_URL exists (Auth.js adapter
 * rejects a Proxy). postgres.js does not connect until the first query,
 * so this is safe at build time.
 */
export const db: Database = env.DATABASE_URL
  ? createDb()
  : new Proxy({} as Database, {
      get() {
        throw new Error("DATABASE_URL is not set");
      },
    });

