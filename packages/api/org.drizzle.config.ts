// TODO: Implement organization
import { defineConfig } from "drizzle-kit";

import env from "@/env";

export default defineConfig({
  schema: "./src/db/org-schema.ts",
  out: "./src/db/org-migrations",
  dialect: env.NODE_ENV !== "development" ? "turso" : "sqlite",
  casing: "snake_case",
  dbCredentials: {
    url: `./.local_dbs/tenant-db-1758501227976.db`,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
});
