// import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/node-postgres";
import {Pool} from "pg"
import env from "@/env";

import * as appSchema from "./schema/app-schema";
import * as authSchema from "./schema/auth-schema";

const pool = new Pool({
  connectionString: env.DATABASE_URL
})

const db = drizzle({
  client: pool,
  casing: "snake_case",
  schema: { ...appSchema, ...authSchema },
});

export default db;
