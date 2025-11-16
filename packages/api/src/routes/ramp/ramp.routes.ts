import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import {
  jsonContent,
  jsonContentOneOf,
  jsonContentRequired,
} from "stoker/openapi/helpers";
import {
  bankListSchema,
  createRampResponseSchema,
  rampResponseSchema,
  rampRequestSchema,
  selectTransaction,
} from "./ramp.schema";
import { createErrorSchema } from "stoker/openapi/schemas";
import { validateRequest } from "@/middlewares/validate-request";

const tags = ["Ramp"];

export const ramp = createRoute({
  tags,
  path: "/ramp/initialise",
  method: "post",
  description: "Initialise a Ramp transaction - either off-ramp or on-ramp",
  middleware: [validateRequest()],
  request: {
    body: jsonContentRequired(rampRequestSchema, "Ramp transaction schema"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createRampResponseSchema(rampResponseSchema),
      "Ramp transaction schema",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(rampRequestSchema),
      "The validation error(s)",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      createRampResponseSchema("Internal server error"),
      "Internal server error",
    ),
  },
});

export const transaction = createRoute({
  tags,
  path: "/ramp/transactions",
  method: "get",
  description: "Get a transaction with id or reference",
  middleware: [validateRequest()],
  request: {
    query: z.object({
      id: z.string().startsWith("trx_").default(""),
      reference: z.string().default(""),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createRampResponseSchema(selectTransaction),
      "Get transaction",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createRampResponseSchema("Transaction not found"),
      "Transaction not found",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(
        z.object({
          id: z.uuid().optional(),
          reference: z.string().optional(),
        }),
      ),
      "The validation error(s)",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      createRampResponseSchema("Internal server error"),
      "Internal server error",
    ),
  },
});

export const banks = createRoute({
  tags,
  path: "/ramp/banks",
  method: "get",
  middleware: [validateRequest()],
  description: "Get a list of supported banks",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createRampResponseSchema(bankListSchema),
      "Bank list schema",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(bankListSchema),
      "The validation error(s)",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      createRampResponseSchema("Internal server error"),
      "Internal server error",
    ),
  },
});

export type RampRequest = typeof ramp;
export type BankListRequest = typeof banks;
export type TransactionRequest = typeof transaction;
