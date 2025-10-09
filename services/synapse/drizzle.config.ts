import { defineConfig } from "drizzle-kit";

import env from "@/env";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: env.NODE_ENV !== "development" ? "turso" : "sqlite",
  casing: "snake_case",
  dbCredentials: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
});
