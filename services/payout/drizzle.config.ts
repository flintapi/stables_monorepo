import { defineConfig } from "drizzle-kit";

import env from "@/env";

console.log("Auth token", env.NODE_ENV);

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./src/db/migrations",
  dialect: "postgresql",
  // casing: "snake_case",
  dbCredentials: {
    url: env.DATABASE_URL,
    // authToken: env.DATABASE_AUTH_TOKEN,
  },
  strict: true,
  verbose: true
});
