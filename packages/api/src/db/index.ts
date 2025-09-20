import { drizzle } from "drizzle-orm/libsql";

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

interface OrgDatabaseProps {
  dbUrl: string;
  orgName?: string;
}
export function orgDb({ dbUrl, orgName }: OrgDatabaseProps) {
  console.log("Database called for: ", orgName);
  return drizzle({
    connection: {
      url: dbUrl,
      authToken: env.DATABASE_AUTH_TOKEN,
    },
    casing: "snake_case",
    schema: orgSchema,
  });
}

export default db;
