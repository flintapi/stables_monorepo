import { drizzle } from "drizzle-orm/libsql";

import env from "@/env";

import * as appSchema from "./app-schema";
import * as authSchema from "./auth-schema";

const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
  casing: "snake_case",
  schema: { ...appSchema, ...authSchema },
});

export default db;
