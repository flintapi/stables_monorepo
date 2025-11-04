import { appSchema, orgSchema } from "@flintapi/shared/Utils";
import { createClient } from "@tursodatabase/api";
import { drizzle } from "drizzle-orm/libsql";
import fs from "node:fs/promises";

import env from "@/env";

const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
  casing: "snake_case",
  schema: { ...appSchema },
});

export default db;

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
  return drizzle({
    connection: {
      url: dbUrl,
      authToken: env.ORG_DATABASE_AUTH_TOKEN!,
    },
    casing: "snake_case",
    schema: orgSchema,
  });
}
