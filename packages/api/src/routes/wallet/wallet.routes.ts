import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { walletSchema } from "./wallet.schema";
import { createErrorSchema } from "stoker/openapi/schemas";
import { validateRequest } from "@/middlewares/validate-request";

const tags = ["Wallet"];

export const create = createRoute({
  tags,
  path: "/wallet",
  method: "post",
  middleware: [validateRequest()],
  request: {
    body: jsonContentRequired(walletSchema, "Create a new wallet"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      walletSchema,
      "New wallet created successfully",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(walletSchema),
      "Validation error",
    ),
  },
});

export const list = createRoute({
  tags,
  path: "/wallet",
  method: "get",
  middleware: [validateRequest()],
  request: {
    query: z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(walletSchema),
      "Wallets retrieved successfully",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(z.object({})),
      "Validation error",
    ),
  },
});

export const getOne = createRoute({
  tags,
  path: "/wallet/{walletId}",
  method: "get",
  middleware: [validateRequest()],
  request: {
    params: z.object({
      walletId: z.uuid(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      walletSchema,
      "Wallet retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createErrorSchema(walletSchema),
      "Wallet not found",
    ),
  },
});

export const update = createRoute({
  tags,
  path: "/wallet/{walletId}",
  method: "put",
  middleware: [validateRequest()],
  request: {
    params: z.object({
      walletId: z.uuid(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      walletSchema,
      "Wallet updated successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createErrorSchema(walletSchema),
      "Wallet not found",
    ),
  },
});

// Wallet operations endpoints

export const operation = createRoute({
  tags,
  path: "/wallet/{walletId}/{action}",
  method: "post",
  middleware: [validateRequest()],
  request: {
    params: z.object({
      walletId: z.uuid(),
      action: z
        .enum(["send", "sign"])
        .describe("Operations to carry out on a wallet"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      walletSchema,
      "Wallet operation successful",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createErrorSchema(walletSchema),
      "Wallet not found",
    ),
  },
});

export const getWalletData = createRoute({
  tags,
  path: "/wallet/{walletId}/{type}",
  method: "get",
  middleware: [validateRequest()],
  description: "Get specific data for a wallet with `walletId`",
  request: {
    params: z.object({
      walletId: z.uuid(),
      type: z
        .enum(["transactions", "events"])
        .describe("Get specific data for a wallet"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      walletSchema,
      "Wallet operation successful",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createErrorSchema(walletSchema),
      "Wallet not found",
    ),
  },
});

export type CreateWalletRequest = typeof create;
export type ListWalletRequest = typeof list;
export type GetOneWalletRequest = typeof getOne;
export type UpdateWalletRequest = typeof update;
export type WalletOperationRequest = typeof operation;
export type WalletDataRequest = typeof getWalletData;
