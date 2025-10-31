import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import type {
  TransactionListRoute,
  EventListRoute,
  WalletListRoute,
} from "./console.routes";

export const transactionList: AppRouteHandler<TransactionListRoute> = async (
  c,
) => {
  const organization = c.get("organization");
  const orgDatabase = c.get("orgDatabase");

  const transactions = await orgDatabase.query.transactions.findMany();
  return c.json(transactions, HttpStatusCodes.OK);
};

export const walletList: AppRouteHandler<WalletListRoute> = async (c) => {
  const organization = c.get("organization");
  const orgDatabase = c.get("orgDatabase");

  const wallets = await orgDatabase.query.wallet.findMany();
  return c.json(wallets, HttpStatusCodes.OK);
};

export const eventList: AppRouteHandler<EventListRoute> = async (c) => {
  const organization = c.get("organization");
  const orgDatabase = c.get("orgDatabase");

  // TODO: Get event database and fetch and join with organization
  // const events = await orgDatabase.query.events.findMany();
  return c.json([], HttpStatusCodes.OK);
};
