import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { AppBindings } from "@/lib/types";
import { APIError } from "better-auth";
import env from "@/env";
import { validateAmount } from "@/routes/ramp/ramp.utils";
import { apiLogger } from "@flintapi/shared/Logger";

export const validateTransactionAmount = () =>
  createMiddleware<AppBindings>(async (c, next) => {
    try {
      const body = await c.req.json()
      const amount = body?.amount as number

      validateAmount(amount, c)

      await next();
    }
    catch(error: any) {
      apiLogger.error(`Error occured validating amount`, error)
      return c.json({
        message: error?.message || "Something went wrong with the request, kindly contact support: support@flintapi.io",
        success: false,
      }, HttpStatusCodes.BAD_REQUEST)
    }
  });
