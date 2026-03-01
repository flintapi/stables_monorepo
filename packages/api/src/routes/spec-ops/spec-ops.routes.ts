import {createRoute, z} from "@hono/zod-openapi";
import {jsonContent} from "stoker/openapi/helpers"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { autofundResponseSchema, createAutofundRequestSchema, createAutofundResponseSchema, otcResponseSchema } from "./spec-ops.schema";
import { createErrorSchema } from "stoker/openapi/schemas";
import { lockPayoutRequest } from "@/middlewares/lock-request";
import { validateRequest } from "@/middlewares/validate-request";

const tags = ["Spec ops"];

export const createAutofund = createRoute({
  hide: false,
  tags,
  path: "/spec-ops/autofund/create",
  middleware: [
    lockPayoutRequest(),
    validateRequest(),
  ],
  method: "post",
  request: {
    body: jsonContent(
      createAutofundRequestSchema,
      "Payload to create auto fund wallet with"
    )
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      autofundResponseSchema(createAutofundResponseSchema),
      "Response for successful auto fund wallet creation"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      autofundResponseSchema(createAutofundRequestSchema),
      "Response for internal errors"
    )
  },
})

const getAutofundDetails = createRoute({
  hide: true,
  tags,
  path: "/spec-ops/autofund/details",
  middleware: [
    lockPayoutRequest(),
    validateRequest(),
  ],
  method: "get",
  request: {
    params: z.object({
      id: z.string()
    })
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      autofundResponseSchema(z.any()),
      "Response for successful auto fund wallet creation"
    )
  },
})

export const getTradeQuote = createRoute({
  hide: false,
  tags,
  path: "/spec-ops/otc/onramp/quote",
  method: "post",
  middleware: [
    lockPayoutRequest(),
    validateRequest(),
  ],
  request: {
    body: jsonContent(
      z.object({
        amount: z.number().min(0),
        currency: z.string().default('NGN'),
        network: z.enum(['base', 'bsc']),
        asset: z.enum(['usdc']),
        feePercent: z.number().optional(),
      }),
      "Payload to get quote for assets listed"
    )
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      otcResponseSchema(z.any()),
      "Response for successful quote request"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      otcResponseSchema(z.any()),
      "Response for internal errors"
    )
  },
})

export const executeTrade = createRoute({
  hide: false,
  tags,
  path: "/spec-ops/otc/onramp/execute",
  method: "post",
  middleware: [
    lockPayoutRequest(),
    validateRequest(),
  ],
  request: {
    body: jsonContent(
      z.object({
        amount: z.number(),
        feePercent: z.number(),
        network: z.enum(['base', 'bsc']),
        asset: z.enum(['usdc']),
        reference: z.uuid(),
        notifyUrl: z.url(),
        destination: z.object({
          address: z.string().startsWith('0x')
        })
      }),
      "Payload to execute trade"
    )
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      otcResponseSchema(z.any()),
      "Response for successful trade execution"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      otcResponseSchema(z.any()),
      "Response for internal errors"
    )
  },
})



export type CreateAutofundRoute = typeof createAutofund;
export type GetAutofundDetailsRoute = typeof getAutofundDetails;
export type GetTradeQuote = typeof getTradeQuote;
export type ExecuteTrade = typeof executeTrade;
