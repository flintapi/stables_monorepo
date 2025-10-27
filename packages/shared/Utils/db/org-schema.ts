import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { WalletMetadata, WalletAddresses } from "./types";

// import { toZodV4SchemaTyped } from "@/lib/zod-utils";
import { generateUniqueId } from "./utils";
import { relations } from "drizzle-orm";

export const transactions = sqliteTable("transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateUniqueId("trx_")),
  type: text("type", { enum: ["off-ramp", "on-ramp", "transfer", "deposit"] })
    .default("off-ramp")
    .notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] })
    .notNull()
    .default("pending"),
  network: text("network", { enum: ["bsc", "base"] })
    .default("base")
    .notNull(),
  reference: text("reference").notNull(),
  trackingId: text("tracking_id"),
  walletId: text("wallet_id").references(() => wallet.id), // Will be null if type is on-ramp, destination is external wallet
  amount: real("amount").notNull(),
  narration: text("narration"),
  metadata: text("metadata", { mode: "json" }), // should hold transaction properties based on type, network, and status
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const selectTransactionSchema = createSelectSchema(transactions);

export const insertTransactionSchema = createInsertSchema(transactions)
  .required({
    type: true,
    status: true,
    network: true,
    reference: true,
    amount: true,
  })
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export const patchTransactionSchema = insertTransactionSchema.partial();

// TODO: add table for wallet and indexed event

export const wallet = sqliteTable(
  "wallet",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateUniqueId("wal_")),
    network: text("network", { enum: ["evm", "btc", "sol"] })
      .notNull()
      .$defaultFn(() => "evm"),
    keyLabel: text("key_label").unique().notNull(),
    primaryAddress: text("primary_address"),
    addresses: text("addresses", { mode: "json" })
      .$type<WalletAddresses>()
      .notNull(),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .$defaultFn(() => true), // should also update to true after eip7702 authorization/or first transaction. can also be deactivated
    autoSweep: integer("auto_sweep", { mode: "boolean" })
      .notNull()
      .$defaultFn(() => true),
    autoSwap: integer("auto_swap", { mode: "boolean" })
      .notNull()
      .$defaultFn(() => false),
    hasVirtualAccount: integer("has_virtual_account", { mode: "boolean" })
      .notNull()
      .$defaultFn(() => false),
    swapDelta: text("swap_delta"), // asset (token/fiat) to swap to
    metadata: text("metadata", { mode: "json" }).$type<WalletMetadata>(),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date(),
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("id_index").on(table.id),
    index("network_index").on(table.network),
    uniqueIndex("key_label_index").on(table.keyLabel),
  ],
);

export const selectWalletSchema = createSelectSchema(wallet);
export const insertWalletSchema = createInsertSchema(wallet)
  .required({
    network: true,
    autoSweep: true,
    autoSwap: true,
  })
  .omit({
    keyLabel: true,
    swapDelta: true,
    addresses: true,
    metadata: true,
    id: true,
    createdAt: true,
    updatedAt: true,
  });
export const updateWalletSchema = insertWalletSchema.partial();

export const walletRelations = relations(wallet, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallet, {
    fields: [transactions.walletId],
    references: [wallet.id],
  }),
}));
