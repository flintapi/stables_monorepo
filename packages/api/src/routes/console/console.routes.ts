import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createErrorSchema, IdParamsSchema } from "stoker/openapi/schemas";
import { notFoundSchema } from "@/lib/constants";
import { selectTransaction } from "../ramp/ramp.schema";
import { selectWalletSchema } from "../wallet/wallet.schema";
import { validateConsoleSession } from "@/middlewares/validate-console-session";

const tags = ["Console"];

export const transactionList = createRoute({
  path: "/console/transactions",
  method: "get",
  hide: true,
  tags,
  middleware: [validateConsoleSession()],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(selectTransaction),
      "The list of transactions for the organization",
    ),
  },
});

export const walletList = createRoute({
  path: "/console/wallets",
  method: "get",
  hide: true,
  tags,
  middleware: [validateConsoleSession()],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(selectWalletSchema),
      "The list of wallets for the organization",
    ),
  },
});

export const eventList = createRoute({
  path: "/console/events",
  method: "get",
  hide: true,
  tags,
  middleware: [validateConsoleSession()],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(z.any()),
      "The list of events for the organization",
    ),
  },
});

export type TransactionListRoute = typeof transactionList;
export type WalletListRoute = typeof walletList;
export type EventListRoute = typeof eventList;
