import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { transactions } from "@/db/schema/app-schema";

import type { BellbankRoute } from "./webhooks.routes";

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
