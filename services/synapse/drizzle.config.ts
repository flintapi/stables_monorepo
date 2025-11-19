import { defineConfig } from "drizzle-kit";

import env from "@/env";

export default defineConfig({
  schema: env.NODE_ENV !== "development"? "./dist/src/db/schema.js" : "./src/db/schema.ts",
  out: env.NODE_ENV !== "development"? "./dist/src/db/migrations" : "./src/db/migrations",
  dialect: env.NODE_ENV !== "development" ? "turso" : "sqlite",
  casing: "snake_case",
  dbCredentials: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
});
