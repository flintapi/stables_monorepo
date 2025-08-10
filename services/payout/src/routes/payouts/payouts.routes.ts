import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

const payoutBodySchema = z.object({
  amount: z.number().describe("Amount to process"),
  accountNumber: z.string().min(10),
  bankCode: z.string().min(3),
  network: z.enum(["bsc", "base"]).default("base"),
  transactionHash: z.string().startsWith("0x").min(64),
  reference: z.string(),
  narration: z.string().optional(),
});

const tags = ["Payout"];
export const payout = createRoute({
  tags,
  method: "post",
  path: "/payout",
  request: {
    body: jsonContent(
      payoutBodySchema,
      "Request from payout initialize",
    ),
    headers: z.object({
      "x-api-key": z.string().min(3),
      "flint-api-key": z.string().min(3),
      "content-type": z.string().default("application/json"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        address: z.string().startsWith("0x").describe("Address to send token"),
        payoutRef: z.string().describe("Reference to track payout with"),
        status: z.string().describe("Status for the payout"),
      }),
      "Response from initialize payout",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      "Response from failed request payout",
    ),
  },
});

export const list = createRoute({
  tags,
  method: "get",
  path: "/payout",
  request: {
    headers: z.object({
      "authorization": z.string().min(3),
      "content-type": z.string().default("application/json"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(z.any()),
      "Response from initialize payout",
    ),
  },
});

export const getOne = createRoute({
  tags,
  method: "get",
  path: "/payout/{ref}",
  request: {
    headers: z.object({
      "authorization": z.string().min(3),
      "content-type": z.string().default("application/json"),
    }),
    params: z.object({
      ref: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        address: z.string().startsWith("0x").describe("Address to send token"),
        payoutRef: z.string().describe("Reference to track payout with"),
        statusUrl: z.url().describe("Status page for the payout"),
      }),
      "Response from initialize payout",
    ),
  },
});

export type InitPayoutRoute = typeof payout;
export type ListPayoutRoute = typeof list;
export type GetOnePayoutRoute = typeof getOne;
export type PayoutPayload = z.infer<typeof payoutBodySchema>;
