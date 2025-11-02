import { createMiddleware } from "hono/factory";

import { auth } from "@/lib/auth";
import db, { orgDb } from "@/db";
import { AppBindings, Organization } from "@/lib/types";
import { APIError } from "better-auth";

export const validateConsoleSession = () =>
  createMiddleware<AppBindings>(async (c, next) => {
    console.log("Before get session");

    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      throw new APIError("BAD_REQUEST", {
        message: "Invalid session, login to continue",
        code: "BAD_REQUEST",
      });
    }

    if ("activeOrganizationId" in session?.session) {
      const organizationId = session?.session?.activeOrganizationId as string;
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

      console.log("Organization", organization);
    } else {
    }

    console.log("No organization ID");
    await next();
  });
