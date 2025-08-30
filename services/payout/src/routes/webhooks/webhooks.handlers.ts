import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { Webhook } from "svix"

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { transactions } from "@/db/schema/app-schema";

import type { BellbankRoute, CentiivRoute } from "./webhooks.routes";
import env from "@/env";


export const centiiv: AppRouteHandler<CentiivRoute> = async (c) => {
  const body = c.req.valid("json")
  const headers = Object.fromEntries(c.req.raw.headers.entries()) as Record<string, string>;
  console.log("Headers", headers, body)

  try {
    // TODO: consume webhook and update transaction in db
    const wh = new Webhook(env.CENTIIV_WH_SECRET_KEY!);
    const msg = wh.verify(JSON.stringify(body), headers) as Record<string, any>
    console.log('Event msg', msg)

    const [updatedEvent] = await db.update(transactions).set({
      status: msg?.data?.status === "successful" ? "completed" : msg?.data?.status,
    }).where(eq(transactions.trackingId, msg?.data?.metadata?.trackingId)).returning();
    console.log("Event consumed, transaction updated", updatedEvent);

    return c.json({
      success: true,
      message: "Webhook consumed"
    }, HttpStatusCodes.OK)
  }
  catch (error: any) {
    console.log("Error consuming webhook", error);
    return c.json({
      success: false,
      message: 'Failed to consume webhook'
    }, HttpStatusCodes.BAD_REQUEST)
  }
}

export const bellbank: AppRouteHandler<BellbankRoute> = async (c) => {
  const body = c.req.valid("json");
  console.log("Event log", body);
  console.log("Event headers", c.req.raw.headers);

  try {
    const [newEvent] = await db.update(transactions).set({
      status: body?.status === "successful" ? "completed" : "pending",
    }).where(eq(transactions.reference, body?.reference)).returning();
    console.log("Saved event", newEvent);
  }
  catch (error: any) {
    console.log("Error storing to db", error);
  }

  return c.json({
    success: true,
    message: "webhook received and processed!",
  }, HttpStatusCodes.OK);
};
