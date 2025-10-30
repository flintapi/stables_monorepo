import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { Webhook } from "svix";

import type { AppRouteHandler } from "@/lib/types";

import db, { orgDb } from "@/db";
import { orgSchema } from "@flintapi/shared/Utils";

import type {
  BellbankRoute,
  CentiivRoute,
  OffRampRoute,
} from "./webhooks.routes";
import env from "@/env";

export const centiiv: AppRouteHandler<CentiivRoute> = async (c) => {
  const body = c.req.valid("json");
  const headers = Object.fromEntries(c.req.raw.headers.entries()) as Record<
    string,
    string
  >;
  console.log("Headers", headers, body);

  try {
    // TODO: consume webhook and update transaction in db
    const wh = new Webhook(env.CENTIIV_WH_SECRET_KEY!);
    const msg = wh.verify(JSON.stringify(body), headers) as Record<string, any>;
    console.log("Event msg", msg);

    const [updatedEvent] = await db
      .update(orgSchema.transactions)
      .set({
        status:
          msg?.data?.status === "successful" ? "completed" : msg?.data?.status,
      })
      .where(
        eq(orgSchema.transactions.trackingId, msg?.data?.metadata?.trackingId),
      )
      .returning();
    console.log("Event consumed, transaction updated", updatedEvent);

    return c.json(
      {
        success: true,
        message: "Webhook consumed",
      },
      HttpStatusCodes.OK,
    );
  } catch (error: any) {
    console.log("Error consuming webhook", error);
    return c.json(
      {
        success: false,
        message: "Failed to consume webhook",
      },
      HttpStatusCodes.BAD_REQUEST,
    );
  }
};

export const bellbank: AppRouteHandler<BellbankRoute> = async (c) => {
  const body = c.req.valid("json");
  console.log("Event log", body);
  console.log("Event headers", c.req.raw.headers);

  try {
    const [newEvent] = await db
      .update(orgSchema.transactions)
      .set({
        status: body?.status === "successful" ? "completed" : "pending",
      })
      .where(eq(orgSchema.transactions.reference, body?.reference))
      .returning();
    console.log("Saved event", newEvent);
  } catch (error: any) {
    console.log("Error storing to db", error);
  }

  return c.json(
    {
      success: true,
      message: "webhook received and processed!",
    },
    HttpStatusCodes.OK,
  );
};

export const offramp: AppRouteHandler<OffRampRoute> = async (c) => {
  const body = c.req.valid("json");
  console.log("Event log", body);
  console.log("Event headers", c.req.raw.headers);

  const transactionId = body.transactionId;
  const organizationId = body.organizationId;
  const event = JSON.parse(body.event);
  const type = body.type;

  const orgDatabase = c.get("orgDatabase");

  if (type !== "off") {
    return c.json(
      {
        success: false,
        message: "Wrong type passed to webhook",
      },
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  try {
    const transaction = orgDatabase.query.transactions.findFirst({
      where(fields, ops) {
        return ops.eq(fields.id, transactionId);
      },
    });

    if (!transaction) {
      return c.json(
        {
          success: false,
          message: "Transaction not found",
        },
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // TODO: Add off-ramp job to ramp service queue

    return c.json(
      {
        success: true,
        message: "webhook received and processed!",
      },
      HttpStatusCodes.OK,
    );
  } catch (error: any) {
    return c.json(
      {
        success: false,
        message: "Failed to process transaction",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const palmpay: AppRouteHandler<any> = async (c) => {
  return c.json(
    {
      success: true,
      message: "Webhook received!",
    },
    HttpStatusCodes.OK,
  );
};
