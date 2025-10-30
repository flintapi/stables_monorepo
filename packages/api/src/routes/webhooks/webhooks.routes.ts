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
  path: "/webhooks/ramp/offramp",
  hide: true,
  method: "post",
  middleware: [getOrganization()],
  request: {
    body: jsonContent(
      z.object({
        organizationId: z.string(),
        transactionId: z.string(),
        event: z.any(),
        type: z.enum(["off", "on"]),
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

export type BellbankRoute = typeof bellbank;
export type CentiivRoute = typeof centiiv;
export type OffRampRoute = typeof offramp;
