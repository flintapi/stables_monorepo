import { createClient } from "@tursodatabase/api";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import fs from "node:fs/promises";

import env from "@/env";

import * as orgSchema from "./org-schema";
import * as schema from "./schema";

const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
  casing: "snake_case",
  schema,
});

export default db;

export function tursoApi() {
  if (env.NODE_ENV === "development") {
    return {
      organizations: {

      },
      databases: {
        create: async (dbName: string): Promise<string> => {
          try {
            const dbFileName = `.local_dbs/${dbName.toLowerCase()}.db`;
            await fs.writeFile(dbFileName, "", { encoding: "utf-8" });

            return `file:${dbFileName}`;
          }
          catch (error: any) {
            console.error("Failed to created db", error);
            throw error;
          }
        },
      },
    };
  }

  return createClient({
    org: "flintapi",
    token: env.TURSO_API_TOKEN,
  });
}

interface OrgDatabaseProps {
  dbUrl: string;
}
export function orgDb({ dbUrl }: OrgDatabaseProps) {
  return drizzle({
    connection: {
      url: dbUrl,
      authToken: env.DATABASE_AUTH_TOKEN,
    },
    casing: "snake_case",
    schema: orgSchema,
  });
}

// NOTE: For local use mostly
export async function migrateDatabase(dbUrl: string) {
  const db = orgDb({ dbUrl });

  console.log("Starting migration...");
  await migrate(db, { migrationsFolder: "./src/db/org-migrations" });
  console.log("Migration finalised");

  db.$client.close();
}
