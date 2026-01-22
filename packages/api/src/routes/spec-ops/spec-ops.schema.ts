import { z } from "zod";

export const createAutofundRequestSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  bvn: z.string(),
  dateOfBirth: z.string().describe("in the format YYYY-MM-DD"),
  customerEmail: z.email(),
  phoneNumber: z.string().min(10),
  autofundAddress: z.string().startsWith('0x'),
  network: z.enum(["base", "bsc"])
})

export const createAutofundResponseSchema = z.object({
  accountReference: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
  bankName: z.string(),
  bankCode: z.string()
})

export const autofundResponseSchema = (
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


export type CreateAutofund = z.infer<typeof createAutofundRequestSchema>;
