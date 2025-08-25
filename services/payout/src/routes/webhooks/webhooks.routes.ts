import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

const tags = ["Webhooks"];
export const bellbank = createRoute({
  tags,
  path: "/webhooks/bellbank",
  hide: true,
  method: "post",
  request: {
    body: jsonContent(
      z.any(),
      "Event payload",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      "Webhook response",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      "Bad request",
    ),
  },
});

export type BellbankRoute = typeof bellbank;
