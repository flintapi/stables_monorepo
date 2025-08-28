// import { z } from "@hono/zod-openapi";
import { integer, decimal, uuid, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { toZodV4SchemaTyped } from "@/lib/zod-utils";

export const transactions = pgTable("transactions", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text("type", { enum: ["payout", "ramp"] }).default("payout").notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] })
    .notNull()
    .default("pending"),
  network: text("network", { enum: ["bsc", "base"] }).default("base").notNull(),
  reference: text("reference").notNull(),
  trackingId: uuid("tracking_id"),
  accountNumber: text("account_number").notNull(),
  bankCode: text("bank_code").notNull(),
  amount: decimal("amount").notNull(),
  transactionHash: text("transaction_hash"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at")
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
