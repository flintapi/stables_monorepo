import {createRoute, z} from "@hono/zod-openapi";
import {jsonContent} from "stoker/openapi/helpers"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { autofundResponseSchema, createAutofundRequestSchema, createAutofundResponseSchema } from "./spec-ops.schema";
import { createErrorSchema } from "stoker/openapi/schemas";
import { lockPayoutRequest } from "@/middlewares/lock-request";
import { validateRequest } from "@/middlewares/validate-request";

const tags = ["Spec ops"];

export const createAutofund = createRoute({
  hide: false,
  tags,
  path: "/spec-ops/autofund/create",
  middleware: [
    lockPayoutRequest(),
    validateRequest(),
  ],
  method: "post",
  request: {
    body: jsonContent(
      createAutofundRequestSchema,
      "Payload to create auto fund wallet with"
    )
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      autofundResponseSchema(createAutofundResponseSchema),
      "Response for successful auto fund wallet creation"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      autofundResponseSchema(createAutofundRequestSchema),
      "Response for internal errors"
    )
  },
})

const getAutofundDetails = createRoute({
  hide: true,
  tags,
  path: "/spec-ops/autofund/details",
  method: "get",
  request: {
    params: z.object({
      id: z.string()
    })
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      autofundResponseSchema(z.any()),
      "Response for successful auto fund wallet creation"
    )
  },
})



export type CreateAutofundRoute = typeof createAutofund;
export type GetAutofundDetailsRoute = typeof getAutofundDetails;
