import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { auth, defaultPermissions } from "@/lib/auth";
import db, { orgDb } from "@/db";
import { APIKeyMetadata, OrgMetadata } from "@flintapi/shared/Utils";
import { AppBindings, Organization } from "@/lib/types";
import { APIError } from "better-auth";
import env from "@/env";

export const validateRequest = () =>
  createMiddleware<AppBindings>(async (c, next) => {
    const key = c.req.header("x-api-key") || c.req.header("flint-api-key");
    const path = c.req.path;

    console.log("API Key", key);
    console.log("Path", path);

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
          ...defaultPermissions,
        },
      },
    });

    console.log("Result of verify", result);

    if (!result.valid) {
      return c.json({
        success: false,
        message: result.error?.message || "Invalid API key",
      }, HttpStatusCodes.BAD_REQUEST);
    }

    const { organizationId } = result.key?.metadata as APIKeyMetadata;

    const organization = await db.query.organization.findFirst({
      where(fields, ops) {
        return ops.eq(fields.id, organizationId);
      },
    });

    console.log("Organization", organization);

    if (!organization) {
      return c.json({
        message: "No organization found with api key",
        success: false
      }, HttpStatusCodes.BAD_REQUEST);
    }

    const metadata: OrgMetadata = typeof organization.metadata !== 'string'? organization.metadata : JSON.parse(organization.metadata)
    if (!(metadata as unknown as { active: boolean })?.active && env.NODE_ENV !== "development") {
      return c.json({
        message: "Organization is not active",
        success: false,
      }, HttpStatusCodes.BAD_REQUEST);
    }

    const orgDatabase = orgDb({ dbUrl: metadata.dbUrl });

    c.set("organization", organization as Organization);
    c.set("orgDatabase", orgDatabase);
    c.set('webhookUrl', result.key?.metadata?.webhookUrl)
    c.set('webhookSecret', result.key?.metadata?.webhookSecret)

    await next();
  });
