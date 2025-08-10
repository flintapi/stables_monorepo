import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { auth } from "@/lib/auth";

import type { CreateAPIKeyRoute, CreateUserRoute, VerifyUserRoute } from "./users.routes";

export const create: AppRouteHandler<CreateUserRoute> = async (c) => {
  const body = c.req.valid("json");

  const data = await auth.api.sendVerificationOTP({
    body: {
      email: body.email,
      type: "sign-in",
    },
  });
  console.log("Email verified successfully", data.success);

  if (data.success) {
    return c.json({
      successful: true,
      message: "Email verification successful",
    }, 200);
  }

  return c.json({
    successful: false,
    message: "Email verification failed, try again",
  }, 400);
};

export const verifyEmail: AppRouteHandler<VerifyUserRoute> = async (c) => {
  const body = c.req.valid("json");

  const data = await auth.api.signInEmailOTP({
    body: {
      email: body.email,
      otp: body.otp,
    },
  });
  console.log("Email verified successfully", data);

  if (data.token) {
    return c.json({
      successful: true,
      message: "Email verified successfully",
    }, 200);
  }

  return c.json({
    successful: false,
    message: "Email verification failed, try again",
  }, 400);
};

export const createApiKey: AppRouteHandler<CreateAPIKeyRoute> = async (c) => {
  const body = c.req.valid("json");

  const user = await db.query.user.findFirst({
    where(fields, ops) {
      return ops.eq(fields.email, body.email);
    },
  });

  if (!user) {
    return c.json({
      successful: false,
      message: "User not found",
    }, 400);
  }

  const data = await auth.api.createApiKey({
    body: {
      userId: user?.id,
      name: `${user.name} API Key`,
      metadata: {
        ownerEmail: user.email,
        type: "payout-api-key",
      },
    },
  });
  console.log("API key created successfully", data);

  return c.json({
    successful: true,
    message: "API key created successfully",
    data,
  }, 200);
};
