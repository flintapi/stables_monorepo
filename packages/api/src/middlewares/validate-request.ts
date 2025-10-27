import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { auth } from "@/lib/auth";
import db, { orgDb } from "@/db";
import { APIKeyMetada, OrgMetadata } from "@flintapi/shared/Utils";
import { AppBindings, Organization } from "@/lib/types";
import { APIError } from "better-auth";

export const validateRequest = () =>
  createMiddleware<AppBindings>(async (c, next) => {
    const key = c.req.header("x-api-key") || c.req.header("flint-api-key");

    console.log("API Key", key);

    if (!key) {
      return c.json(
        {
          success: false,
          message:
            "No API key provided, please use the header 'x-api-key' or 'flint-api-key'",
        },
        HttpStatusCodes.BAD_REQUEST,
      );
    }

    const result = await auth.api.verifyApiKey({
      body: {
        key,
        permissions: {
          [c.req.path]: ["enabled"],
        },
      },
    });

    console.log("Result of verify", result);

    if (!result.valid) {
      return c.json({
        success: false,
        message: result.error?.message || "Invalid API key",
      });
    }

    const { organizationId } = result.key?.metadata as APIKeyMetada;

    const organization = await db.query.organization.findFirst({
      where(fields, ops) {
        return ops.eq(fields.id, organizationId);
      },
    });

    if (!organization)
      throw new APIError("NOT_FOUND", {
        message: "No organization found with api key",
        code: "ORG_NOT_FOUND",
      });

    // const orgMetadata = organization.metadata as OrgMetadata;

    const orgDatabase = orgDb({ dbUrl: organization.metadata.dbUrl });

    c.set("organization", organization as Organization);
    c.set("orgDatabase", orgDatabase);

    await next();
  });
