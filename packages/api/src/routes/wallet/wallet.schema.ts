import { z } from "zod";

export const walletSchema = z.object({
  address: z.string().startsWith("0x"),
  balance: z.number(),
  index: z.bigint().optional(),
  isMaster: z.boolean().default(false),
});
