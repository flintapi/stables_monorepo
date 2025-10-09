import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

import env from "@/env";

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

export async function migrateDatabase() {
  console.log("Starting migration...");
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("Migration finalised");

  db.$client.close();
}
