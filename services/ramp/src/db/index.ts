import { appSchema, orgSchema } from "@flintapi/shared/Utils";
import { createClient } from "@tursodatabase/api";
import { drizzle } from "drizzle-orm/libsql";
import fs from "node:fs/promises";

import env from "@/env";

const db = drizzle({
  connection: {
    url: env.DATABASE_URL!,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
  casing: "snake_case",
  schema: { ...appSchema },
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
  else {
    return createClient({
      org: "flintapi",
      token: env.TURSO_API_TOKEN!,
    });
  }
}

interface OrgDatabaseProps {
  dbUrl: string;
}
export function orgDb({ dbUrl }: OrgDatabaseProps) {
  return drizzle({
    connection: {
      url: dbUrl,
      authToken: env.DATABASE_AUTH_TOKEN!,
    },
    casing: "snake_case",
    schema: orgSchema,
  });
}
