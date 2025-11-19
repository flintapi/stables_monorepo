import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
// import Webhook from "@/lib/webhook-trigger";
import {Webhook as SvixWebhook} from "svix"

import type { AppRouteHandler } from "@/lib/types";

import db, { orgDb } from "@/db";
import { networkToChainidMap, orgSchema } from "@flintapi/shared/Utils";

import type {
  BellbankRoute,
  CentiivRoute,
  OffRampRoute,
  PalmpayRoute
} from "./webhooks.routes";
import env from "@/env";
import { fetchVirtualAccount, sweepFunds } from "../ramp/ramp.utils";
import { apiLogger } from "@flintapi/shared/Logger";
import { bullMqBase, QueueInstances, QueueNames } from "@flintapi/shared/Queue";
import { QueueEvents } from "bullmq";

const rampQueue = QueueInstances[QueueNames.RAMP_QUEUE];
const rampQueueEvents = new QueueEvents(QueueNames.RAMP_QUEUE, bullMqBase);
const kmsQueue = QueueInstances[QueueNames.WALLET_QUEUE];
const kmsQueueEvents = new QueueEvents(QueueNames.WALLET_QUEUE, bullMqBase);

export const centiiv: AppRouteHandler<CentiivRoute> = async (c) => {
  const body = c.req.valid("json");
  const headers = Object.fromEntries(c.req.raw.headers.entries()) as Record<
    string,
    string
  >;
  console.log("Headers", headers, body);

  try {
    // TODO: consume webhook and update transaction in db
    const wh = new SvixWebhook(env.CENTIIV_WH_SECRET_KEY!);
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

  if (body?.event === "collection") {
    try {
      const amount = body?.amountReceived;
      const result = await fetchVirtualAccount(body?.virtualAccount);
      const nonce = crypto.randomUUID().substring(0, 6)

      if (!result.transactionId) {
        return c.json(
          { success: false, message: "No transaction found" },
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      await rampQueue.add(
        "on-ramp",
        {
          type: "on",
          organizationId: result.organizationId,
          transactionId: result.transactionId,
          amountReceived: Number(amount),
        },
        {
          jobId: `ramp-on-ramp-${result.transactionId}-${nonce}`,
          attempts: 3,
        },
      );
      return c.json(
        { success: true, message: "Transaction processed successfully" },
        HttpStatusCodes.OK,
      );
    } catch (error: any) {
      apiLogger.error("Bellbank webhook failed", error);
      return c.json(
        {
          success: false,
          message: "Something went wrong with transaction processing",
        },
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  } else {
    return c.json(
      {
        success: false,
        message: "Invalid event type",
      },
      HttpStatusCodes.BAD_REQUEST,
    );
  }
};

export const offramp: AppRouteHandler<OffRampRoute> = async (c) => {
  const body = c.req.valid("json");
  console.log("Event log", body);
  console.log("Event headers", c.req.raw.headers);

  const transactionId = body.transactionId;
  const organizationId = body.organizationId;
  const amountReceived = body.amountReceived;
  const type = body?.type;
  const event = JSON.parse(body.event);
  apiLogger.info("Event from synapse service", event);

  if(type !== "off") {
    return c.json(
      {
        success: false,
        message: "Invalid event type: Expected 'off'",
      },
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  try {
    // TODO: Add off-ramp job to ramp service queue
    await rampQueue.add(
      "off-ramp",
      {
        type: "off",
        organizationId: organizationId,
        transactionId: transactionId,
        amountReceived,
      },
      {
        jobId: `ramp-off-ramp-${transactionId}`,
        attempts: 2,
      },
    );
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

export const palmpayPaymentNotify: AppRouteHandler<PalmpayRoute> = async (c) => {
  const params = c.req.valid("param")
  const body = c.req.valid("json")

  const organization = await db.query.organization.findFirst({
    where(fields, ops) {
      return ops.eq(fields.id, params.organizationId)
    }
  })

  if(!organization) {
    return c.text('failed', HttpStatusCodes.BAD_REQUEST);
  }

  const orgDatabase = orgDb({ dbUrl: organization.metadata?.dbUrl! });
  // TODO: validate transaction
  const transaction = await orgDatabase.query.transactions.findFirst({
    where(fields, ops) {
      return ops.eq(fields.id, params.transactionId)
    }
  })
  if(!transaction) {
    return c.text('failed', HttpStatusCodes.BAD_REQUEST);
  }

  // TODO: Update transaction status
  if(body.orderStatus === 3) {
  // TODO: trigger refund or sweep to treasury if failed
    const [updatedTransaction] = await orgDatabase.update(orgSchema.transactions)
      .set({
        status: "failed",
      })
      .where(eq(orgSchema.transactions.id, transaction.id))
      .returning();
    console.log("Transaction update", updatedTransaction);
    // TODO: Optionally trigger refund
  } else if(body.orderStatus === 2) {
    const [updatedTransaction] = await orgDatabase.update(orgSchema.transactions)
      .set({
        status: "completed",
      })
      .where(eq(orgSchema.transactions.id, transaction.id))
      .returning();
    // TODO: Trigger sweep
    const result = await sweepFunds(env.TREASURY_KEY_LABEL, {
      chainId: networkToChainidMap[transaction.network],
      amount: transaction.amount,
      destinationAddress: env.TREASURY_EVM_ADDRESS,
      queue: kmsQueue,
      queueEvents: kmsQueueEvents,
      index: transaction.metadata?.index || 0,
      transactionId: transaction.id,
    }).catch((error: any) => null);

    if(result) {
      // TODO: Update sweepHash in metadata
      const [sweepUpdatedTransaction] = await orgDatabase.update(orgSchema.transactions)
        .set({
          metadata: {
            ...transaction.metadata!,
            sweepHash: result.hash
          },
        })
        .where(eq(orgSchema.transactions.id, transaction.id))
        .returning();
      console.log("Sweep update transaction", sweepUpdatedTransaction);
    }
    console.log("Sweep result", result);
    console.log("Transaction update", updatedTransaction);
  } else {
    console.log("Still pending payout...", body)
  }
  // TODO: Call webhook utility function
  // Webhook.trigger(transaction.metadata?.notifyUrl, )

  return c.text('success', HttpStatusCodes.OK);
};
