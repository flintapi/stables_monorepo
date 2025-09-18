import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { toZodV4SchemaTyped } from "@/lib/zod-utils";

export const transactions = sqliteTable("transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text("type", { enum: ["payout", "ramp"] }).default("payout").notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] })
    .notNull()
    .default("pending"),
  network: text("network", { enum: ["bsc", "base"] }).default("base").notNull(),
  reference: text("reference").notNull(),
  trackingId: text("tracking_id"),
  accountNumber: text("account_number").notNull(),
  bankCode: text("bank_code").notNull(),
  amount: real("amount").notNull(),
  transactionHash: text("transaction_hash"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
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
