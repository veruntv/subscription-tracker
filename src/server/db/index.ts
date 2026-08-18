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
 * Lazy so the empty skeleton can boot (and build) without a database.
 * First query without DATABASE_URL throws.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(createDb(), prop, receiver);
  },
});
