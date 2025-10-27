import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import {
  createWalletResponseSchema,
  insertWalletSchema,
  selectWalletSchema,
  updateWalletSchema,
} from "./wallet.schema";
import { createErrorSchema } from "stoker/openapi/schemas";
import { validateRequest } from "@/middlewares/validate-request";

const tags = ["Wallet"];

export const create = createRoute({
  tags,
  path: "/wallet",
  method: "post",
  middleware: [validateRequest()],
  request: {
    body: jsonContentRequired(insertWalletSchema, "Create a new wallet"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createWalletResponseSchema(
        selectWalletSchema.omit({ createdAt: true, updatedAt: true, id: true }),
      ),
      "New wallet created successfully",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertWalletSchema),
      "Validation error",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      createWalletResponseSchema("Internal server error"),
      "Internal server error",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      createWalletResponseSchema("Request is invalid, kindly check again"),
      "Request is invalid",
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
      createWalletResponseSchema(
        z.array(
          selectWalletSchema.omit({
            createdAt: true,
            updatedAt: true,
            id: true,
          }),
        ),
      ),
      "Wallets retrieved successfully",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(
        z.object({
          limit: z.number().min(1).max(100).default(10),
          offset: z.number().min(0).default(0),
        }),
      ),
      "Validation or retrieval error",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      createWalletResponseSchema("Internal server error"),
      "Internal server error",
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
      createWalletResponseSchema(
        selectWalletSchema.omit({ createdAt: true, updatedAt: true, id: true }),
      ),
      "Wallet retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createWalletResponseSchema("Wallet not found"),
      "Wallet not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      createWalletResponseSchema("Internal server error"),
      "Internal server error",
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
    body: jsonContentRequired(updateWalletSchema, "Update a wallet"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createWalletResponseSchema(selectWalletSchema),
      "Wallet updated successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createWalletResponseSchema("Wallet not found"),
      "Wallet not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      createWalletResponseSchema("Internal server error"),
      "Internal server error",
    ),
  },
});

// Wallet operations endpoints

export const operation = createRoute({
  tags,
  path: "/wallet/{walletId}/{action}",
  method: "post",
  hide: true,
  middleware: [validateRequest()],
  request: {
    params: z.object({
      walletId: z.uuid(),
      action: z
        .enum(["send", "call"])
        .describe("Operations to carry out on a wallet"),
    }),
    body: jsonContentRequired(
      z.object({
        network: z.enum(["bsc", "base"]),
        contractAddress: z.string().startsWith("0x"),
        data: z.string().startsWith("0x"),
      }),
      "Operation configuration and input data",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createWalletResponseSchema("Wallet operation successful"),
      "Wallet operation successful",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createWalletResponseSchema("Wallet not found"),
      "Wallet not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      createWalletResponseSchema("Internal server error"),
      "Internal server error",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      createWalletResponseSchema("Invalid request"),
      "Invalid request",
    ),
  },
});

export const getWalletData = createRoute({
  tags,
  path: "/wallet/{walletId}/{type}",
  method: "get",
  hide: true,
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
      createWalletResponseSchema(z.any()),
      "Wallet operation successful",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createWalletResponseSchema("Could not find wallet data"),
      "Wallet not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      createWalletResponseSchema("Internal server error"),
      "Internal server error",
    ),
  },
});

export type CreateWalletRequest = typeof create;
export type ListWalletRequest = typeof list;
export type GetOneWalletRequest = typeof getOne;
export type UpdateWalletRequest = typeof update;
export type WalletOperationRequest = typeof operation;
export type WalletDataRequest = typeof getWalletData;
