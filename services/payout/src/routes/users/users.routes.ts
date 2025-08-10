import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

const tags = ["Users"];

export const create = createRoute({
  tags,
  method: "post",
  path: "/users",
  request: {
    body: jsonContent(
      z.object({
        name: z.string().min(4),
        email: z.email(),
      }),
      "Create user request",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        successful: z.boolean(),
        message: z.string(),
      }),
      "User creation response",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        successful: z.boolean(),
        message: z.string(),
      }),
      "Email verification response",
    ),
  },
});

export const verifyEmail = createRoute({
  tags,
  method: "post",
  path: "/users/verify",
  request: {
    body: jsonContent(
      z.object({
        otp: z.string().min(4),
        email: z.email(),
      }),
      "Verify email request",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        successful: z.boolean(),
        message: z.string(),
      }),
      "Email verification response",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        successful: z.boolean(),
        message: z.string(),
      }),
      "Email verification response",
    ),
  },
});

export const createApiKey = createRoute({
  tags,
  method: "post",
  path: "/users/api-key",
  request: {
    body: jsonContent(
      z.object({
        email: z.email(),
      }),
      "Api key creation email",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        successful: z.boolean(),
        message: z.string(),
        data: z.any(),
      }),
      "API key creation response",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        successful: z.boolean(),
        message: z.string(),
      }),
      "API Key creattion failed response",
    ),
  },
});

export type CreateUserRoute = typeof create;
export type VerifyUserRoute = typeof verifyEmail;
export type CreateAPIKeyRoute = typeof createApiKey;
