import { createClient } from "@tursodatabase/api";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

import env from "@/env";

import { orgSchema, appSchema } from "@flintapi/shared/Utils";

const db = drizzle({
  connection: {
    url: env.DATABASE_URL!,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
  casing: "snake_case",
  schema: { ...appSchema },
});

export default db;

// @ts-ignore
export function tursoApi() {
  return createClient({
    org: env.TURSO_ORGANIZATION || "afullsnack",
    token: env.TURSO_API_TOKEN!,
  });
}

interface OrgDatabaseProps {
  dbUrl: string;
}
export function orgDb({ dbUrl }: OrgDatabaseProps) {
  console.log("Getting database...", env.ORG_DATABASE_AUTH_TOKEN)
  return drizzle({
    connection: {
      url: dbUrl,
      authToken: env.ORG_DATABASE_AUTH_TOKEN,
    },
    casing: "snake_case",
    schema: orgSchema,
  });
}

// NOTE: For local use mostly
export async function migrateDatabase(dbUrl: string) {
  const db = orgDb({ dbUrl });

  console.log("DB URL", dbUrl);
  console.log("Starting migration...", "Protocol:", db.$client.protocol);
  await migrate(db, { migrationsFolder: env.NODE_ENV !== "development"? "./dist/src/db/org-migrations" : "./src/db/org-migrations" });
  console.log("Migration finalised");

  db.$client.close();
}
