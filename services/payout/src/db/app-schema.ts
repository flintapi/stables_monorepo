// import { z } from "@hono/zod-openapi";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { toZodV4SchemaTyped } from "@/lib/zod-utils";

export const transactions = sqliteTable("transactions", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text({ enum: ["payout", "ramp"] }).default("payout").notNull(),
  status: text({ enum: ["pending", "completed", "failed"] })
    .notNull()
    .default("pending"),
  network: text({ enum: ["bsc", "base"] }).default("base").notNull(),
  reference: text().notNull(),
  accountNumber: text().notNull(),
  bankCode: text().notNull(),
  amount: real().notNull(),
  createdAt: integer({ mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer({ mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const selectTransactionSchema = toZodV4SchemaTyped(createSelectSchema(transactions));

export const insertTransactionSchema = toZodV4SchemaTyped(createInsertSchema(
  transactions,
).required({
  type: true,
  status: true,
  network: true,
  reference: true,
  accountNumber: true,
  bankCode: true,
  amount: true,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}));

// @ts-expect-error partial exists on zod v4 type
export const patchTransactionSchema = insertTransactionSchema.partial();
