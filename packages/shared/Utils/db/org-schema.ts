import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// import { toZodV4SchemaTyped } from "@/lib/zod-utils";
import { generateUniqueId } from "./utils";
import { relations } from "drizzle-orm";

export const transactions = sqliteTable("transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateUniqueId('trx_')),
  type: text("type", { enum: ["off-ramp", "on-ramp", "transfer", "deposit"] }).default("off-ramp").notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] })
    .notNull()
    .default("pending"),
  network: text("network", { enum: ["bsc", "base"] }).default("base").notNull(),
  reference: text("reference").notNull(),
  trackingId: text("tracking_id"),
  walletId: text("wallet_id").references(() => wallet.id), // Will be null if type is on-ramp, destination is external wallet
  amount: real("amount").notNull(),
  narration: text("narration"),
  metadata: text("metadata", { mode: "json" }), // should hold transaction properties based on type, network, and status
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const selectTransactionSchema = createSelectSchema(transactions);

export const insertTransactionSchema = createInsertSchema(
  transactions,
).required({
  type: true,
  status: true,
  network: true,
  reference: true,
  amount: true,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const patchTransactionSchema = insertTransactionSchema.partial();

// TODO: add table for wallet and indexed event

export const wallet = sqliteTable("wallet", {
  id: text("id").primaryKey().$defaultFn(() => generateUniqueId('wal_')),
  network: text("network").notNull().$defaultFn(() => "evm"),
  derivationIndex: integer("derivation_index").notNull(),
  addresses: text("addresses", {mode: "json"}).notNull(),
  type: text("type", { enum: ["derived", "master"] })
    .notNull()
    .default("derived"), // master is the first smart account at index 0
  derivedFromId: text("derived_from_id"),
  isActive: integer("is_active", { mode: "boolean" })
    .notNull()
    .$defaultFn(() => false),
  isPermanent: integer("is_permanent", { mode: "boolean" })
    .notNull()
    .$defaultFn(() => false),
  autoSweep: integer("auto_sweep", { mode: "boolean" })
    .notNull()
    .$defaultFn(() => true),
  autoSwap: integer("auto_swap", { mode: "boolean" })
    .notNull()
    .$defaultFn(() => true),
  swapDelta: text("swap_delta"),
  label: text("label").unique(),
  metadata: text("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
}, table => [
  index("id_index").on(table.id),
  index("network_index").on(table.network),
  index("type_index").on(table.type),
  uniqueIndex("label_index").on(table.label),
  index("derivation_index").on(table.derivationIndex),
]);


export const walletRelations = relations(wallet, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallet, {
    fields: [transactions.walletId],
    references: [wallet.id],
  }),
}));
