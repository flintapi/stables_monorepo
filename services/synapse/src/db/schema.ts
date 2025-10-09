import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  listenerId: text("listener_id").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  contractAddress: text("contract_address").notNull(),
  blockNumber: integer("block_number").notNull(),
  name: text("event_name").notNull(),
  data: text("event_data", { mode: "json" }).notNull(),
  organizationId: text("organization_id"),
  transactionId: text("transaction_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
