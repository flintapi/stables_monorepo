import {z} from "zod";

const offRampSchema = z.object({
  type: z.literal('off'),
  reference: z.string().min(10),
  network: z.enum(['base', 'bsc']),
  amount: z.number().min(500),
  destination: z.object({
    bankCode: z.string().min(3),
    accountNumber: z.string().min(10),
  })
})

const offRampResponseSchema = z.object({
  type: z.literal('off'),
  status: z.enum(['pending', 'completed', 'failed']),
  message: z.string().min(1).max(255),
  depositAddress: z.string().min(12).startsWith('0x'),
})

const onRampSchema = z.object({
  type: z.literal('on'),
  reference: z.string().min(10),
  network: z.enum(['base', 'bsc']),
  amount: z.number().min(500),
  destination: z.object({
    address: z.string().min(12).startsWith('0x'),
  })
})

const onRampResponseSchema = z.object({
  type: z.literal('on'),
  status: z.enum(['pending', 'completed', 'failed']),
  message: z.string().min(1).max(255),
  depositAccount: z.object({
    accountNumber: z.string().min(10),
    bankCode: z.string().min(3),
    bankName: z.string().optional(),
    accountName: z.string().optional()
  }),
})

export const rampSchema = z.discriminatedUnion('type', [
  offRampSchema,
  onRampSchema
])

export const rampResponse = z.discriminatedUnion('type', [
  offRampResponseSchema,
  onRampResponseSchema
])

export type RampRequestType = z.infer<typeof rampSchema>;
export type RampResponseType = z.infer<typeof rampResponse>;
