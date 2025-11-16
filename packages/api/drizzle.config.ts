import { defineConfig } from "drizzle-kit";

import env from "@/env";

export default defineConfig({
  schema: env.NODE_ENV !== "development"? "./src/db/schema.ts" : "./dist/src/db/schema.js",
  out: env.NODE_ENV !== "development"? "./src/db/migrations" : "./dist/src/db/migrations",
  dialect: env.NODE_ENV !== "development" ? "turso" : "sqlite",
  casing: "snake_case",
  dbCredentials: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
});
