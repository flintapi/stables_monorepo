import { getOrganization } from "@/middlewares/get-organization";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

const tags = ["Webhooks"];
export const bellbank = createRoute({
  tags,
  path: "/webhooks/bellbank",
  hide: true,
  method: "post",
  request: {
    body: jsonContent(z.any(), "Event payload"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      "Webhook response",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      "Bad request",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      "Internal server error",
    ),
  },
});

export const centiiv = createRoute({
  tags,
  path: "/webhooks/centiiv",
  hide: true,
  method: "post",
  request: {
    body: jsonContent(z.any(), "Event payload"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      "Webhook response",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      "Bad request",
    ),
  },
});

export const offramp = createRoute({
  tags,
  path: "/webhooks/synapse/offramp",
  hide: true,
  method: "post",
  middleware: [],
  request: {
    body: jsonContent(
      z.object({
        organizationId: z.string(),
        transactionId: z.string(),
        event: z.any(),
        amountReceived: z.coerce.number(),
        type: z.enum(['on', 'off']),
      }),
      "Event payload",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      "Webhook response",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      "Bad request",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      "Bad request",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      "Bad request",
    ),
  },
});


export const palmpayPaymentNotify = createRoute({
  tags,
  path: "/webhooks/palmpay/payment/{organizationId}/{transactionId}",
  method: "post",
  hide: true,
  middleware: [],
  request: {
    params: z.object({
      organizationId: z.string(),
      transactionId: z.string(),
    }),
    body: jsonContent(
      z.object({
        orderId: z.string(),
        orderNo: z.string(),
        appId: z.string(),
        currency: z.string(),
        amount: z.number(),
        orderStatus: z.coerce.number(),
        sign: z.string(),
        sessionId: z.string().optional(),
        completeTime: z.coerce.string().optional(),
        errorMsg: z.string().optional(),
      }),
      "NOtification payload",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        'text/plain': {
          schema: z.string().default('success').openapi({
            example: 'success', // Optional: provides an example value for documentation
          }),
        },
      },
      description: "Palmpay payment notification response"
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: {
        'text/plain': {
          schema: z.string().default('failed').openapi({
            example: 'success', // Optional: provides an example value for documentation
          }),
        },
      },
      description: "Palmpay payment notification error response"
    }
  },
})

export type BellbankRoute = typeof bellbank;
export type CentiivRoute = typeof centiiv;
export type OffRampRoute = typeof offramp;
export type PalmpayRoute = typeof palmpayPaymentNotify;
