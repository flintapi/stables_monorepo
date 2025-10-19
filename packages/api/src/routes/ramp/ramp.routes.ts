import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { bankListSchema, rampResponse, rampSchema } from "./ramp.schema";
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
    body: jsonContentRequired(rampSchema, "Ramp transaction schema"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(rampResponse, "Ramp transaction schema"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(rampSchema),
      "The validation error(s)",
    ),
  },
});

export const transaction = createRoute({
  tags,
  path: "/ramp/transaction",
  method: "get",
  description: "Get a transaction with id or reference",
  middleware: [
    // validateRequest()
  ],
  request: {
    query: z.object({
      id: z.uuid().optional(),
      reference: z.string().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.any(), "Get transaction"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(
        z.object({
          id: z.uuid().optional(),
          reference: z.string().optional(),
        }),
      ),
      "The validation error(s)",
    ),
  },
});

export const banks = createRoute({
  tags,
  path: "/ramp/banks",
  method: "get",
  middleware: [
    // validateRequest()
  ],
  // hide: true,
  description: "Get a list of supported banks",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(bankListSchema, "Bank list schema"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(bankListSchema),
      "The validation error(s)",
    ),
  },
});

export type RampRequest = typeof ramp;
export type BankListRequest = typeof banks;
export type TransactionRequest = typeof transaction;
