import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { auth } from "@/lib/auth";
import db from "@/db";

export const validateRequest = createMiddleware(async (c, next) => {
  const key = c.req.header("x-api-key") || c.req.header("flint-api-key");

  console.log("API Key", key);

  if (!key) {
    return c.json({
      success: false,
      message: "No API key provided",
    }, HttpStatusCodes.BAD_REQUEST);
  }
  const result = await auth.api.verifyApiKey({
    body: {
      key,
    },
  });

  console.log("Result of verify", result);

  if (!result.valid) {
    return c.json({
      success: false,
      message: result.error?.message || "Invalid API key",
    });
  }

  const merchant = await db.query.user.findFirst({
    where(fields, ops) {
      return ops.eq(fields.id, result.key?.userId!)
    }
  })

  c.set("merchant", merchant)
  c.set("merchantName", merchant?.name)

  await next();
});
