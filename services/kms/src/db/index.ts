import { kmsLogger } from "@flintapi/shared/Logger";
import { appSchema, orgSchema } from "@flintapi/shared/Utils";
// data base initialization for application db and organization client
import { createClient } from "@tursodatabase/api";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

import env from "@/env";

const db: ReturnType<typeof drizzle> = drizzle({
  connection: {
    url: env.DATABASE_URL!,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
  casing: "snake_case",
  schema: { ...appSchema },
});

export default db;

export const tursoClient: ReturnType<typeof createClient> = createClient({
  org: "flintapi",
  token: env.TURSO_API_TOKEN!,
});

interface OrgDatabaseProps {
  dbUrl: string;
}
export function orgDb({ dbUrl }: OrgDatabaseProps): ReturnType<typeof drizzle> {
  return drizzle({
    connection: {
      url: dbUrl,
      authToken: env.DATABASE_AUTH_TOKEN!,
    },
    casing: "snake_case",
    schema: orgSchema,
  });
}

// NOTE: For local use mostly
export async function migrateDatabase(dbUrl: string) {
  const db = orgDb({ dbUrl });

  kmsLogger.info("Starting migration...");
  await migrate(db, { migrationsFolder: "./src/db/org-migrations" });
  kmsLogger.info("Migration finalised");

  db.$client.close();
}
