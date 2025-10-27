import { z } from "zod";
import { orgSchema } from "@flintapi/shared/Utils";

export const wallet = orgSchema.wallet;
export const selectWalletSchema = orgSchema.selectWalletSchema;
export const insertWalletSchema = orgSchema.insertWalletSchema;
export const updateWalletSchema = orgSchema.updateWalletSchema;

export const createWalletResponseSchema = (
  schemaOrMessage: z.ZodSchema | string,
) =>
  typeof schemaOrMessage === "string"
    ? z.object({
        status: z.enum(["success", "failed", "pending"]).default("failed"),
        message: z.string().min(1).default(schemaOrMessage),
        data: z.any().nullable().default(null),
      })
    : z.object({
        status: z.enum(["success", "failed", "pending"]).default("pending"),
        message: z.string().min(1),
        data: schemaOrMessage,
      });
