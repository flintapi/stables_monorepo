import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { rampResponse, rampSchema } from "./ramp.schema";
import { createErrorSchema } from "stoker/openapi/schemas";

const tags = ["Ramp"];

export const ramp = createRoute({
  tags,
  path: "/ramp",
  method: "post",
  request: {
    body: jsonContentRequired(
      rampSchema,
      "Ramp transaction schema"
    )
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      rampResponse,
      "Ramp transaction schema"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(rampSchema),
      "The validation error(s)",
    ),
  }
})


export type RampRequest = typeof ramp;
