import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

const tags = ["Off-Ramp"];

export const getQuote = createRoute({
  method: "get",
  path: "/ramp/off/quote",
  tags,
  request: {
    headers: z.object({
      authorization: z.string().min(1),
    }),
    params: z.object({
      pair: z.string(),
      amount: z.number().min(10).optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        quote: z.number().min(1),
        quoteId: z.string().min(1).max(255),
      }),
      "Get quote for pair",
    ),
  },
});

export const finalize = createRoute({
  method: "post",
  path: "/ramp/off/finalize",
  tags,
  request: {
    headers: z.object({
      authorization: z.string().min(1),
    }),
    body: jsonContentRequired(
      z.object({
        quoteId: z.string().describe("Quote ID to operate the off-ramp"),
        walletId: z.string().describe("Internal wallet ID to debit"),
      }),
      "Finalize body",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        reference: z.string(),
        quoteId: z.string().min(1).max(255),
        fee: z.number().min(1),
        status: z.string(),
        receivable: z.number(),
      }),
      "Finalize off-ramp response",
    ),
  },
});

export type GetQuote = typeof getQuote;
export type Finalize = typeof finalize;
