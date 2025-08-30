import { transactionHashAndRefDedup } from "@/lib/transaction-hash-dedup";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { createMiddleware } from "hono/factory";

export const validateHash = () => createMiddleware(async (c, next) => {
  const body = await c.req.json();

  const isValidHash = await transactionHashAndRefDedup(body.transactionHash as `0x${string}`, body.reference);
  if (!isValidHash) {
    return c.json({
      success: false,
      message: "Transaction with provided hash or reference, already processed",
    }, HttpStatusCodes.BAD_REQUEST);
  }

  await next()
})
