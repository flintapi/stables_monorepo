import { z } from "zod";
import { orgSchema } from "@flintapi/shared/Utils";

export const transaction = orgSchema.transactions;
export const selectTransaction = orgSchema.selectTransactionSchema;
export const insertTransaction = orgSchema.insertTransactionSchema;
export const updateTransaction = orgSchema.patchTransactionSchema;

export type Transaction = z.infer<typeof selectTransaction>;

const offRampSchema = z.object({
  type: z.literal("off"),
  reference: z.string().min(10),
  network: z.enum(["base", "bsc"]),
  amount: z.number().min(500),
  destination: z.object({
    bankCode: z.string().min(3),
    accountNumber: z.string().min(10),
  }),
});

const offRampResponseSchema = z.object({
  type: z.literal("off-ramp"),
  status: z.enum(["pending", "completed", "failed"]),
  depositAddress: z.string().min(12).startsWith("0x"),
});

const onRampSchema = z.object({
  type: z.literal("on"),
  reference: z.string().min(10),
  network: z.enum(["base", "bsc"]),
  amount: z.number().min(500),
  destination: z.object({
    address: z.string().min(12).startsWith("0x"),
  }),
});

const onRampResponseSchema = z.object({
  type: z.literal("on"),
  status: z.enum(["pending", "completed", "failed"]),
  depositAccount: z.object({
    accountNumber: z.string().min(10),
    bankCode: z.string().min(3),
    bankName: z.string().optional(),
    accountName: z.string().optional(),
  }),
});

export const rampRequestSchema = z.discriminatedUnion("type", [
  offRampSchema,
  onRampSchema,
]);

export const rampResponseSchema = z.discriminatedUnion("type", [
  offRampResponseSchema,
  onRampResponseSchema,
]);

export const bankListSchema = z.array(
  z.object({
    institutionName: z.string().min(1).max(100),
    institutionCode: z.string().min(3).max(10),
  }),
);

export const createRampResponseSchema = (
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

export type ResponseStatus = "success" | "failed" | "pending";
export type RampRequestType = z.infer<typeof rampRequestSchema>;
export type RampResponseType = z.infer<typeof rampResponseSchema>;
export type BankListType = z.infer<typeof bankListSchema>;
