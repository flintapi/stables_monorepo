import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { auth } from "@/lib/auth";
import db, { orgDb } from "@/db";
import { OrgMetadata } from "@flintapi/shared/Utils";
import { AppBindings, Organization } from "@/lib/types";
import { APIError } from "better-auth";

export const getOrganization = () =>
  createMiddleware<AppBindings>(async (c, next) => {
    let organizationId =
      c.req.header("X-Flint-Organization-Id") ||
      c.req.header("x-flint-organization-id");

    console.log("Organization ID", organizationId);

    if (!organizationId) {
      return c.json(
        {
          success: false,
          message:
            "No organization ID provided, please use the header 'x-flint-organization-id' or 'X-Flint-Organization-Id'",
        },
        HttpStatusCodes.BAD_REQUEST,
      );
    }

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

    const orgDatabase = orgDb({ dbUrl: organization?.metadata!.dbUrl });

    c.set("organization", organization as Organization);
    c.set("orgDatabase", orgDatabase);

    await next();
  });
