import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import {Webhook} from "@flintapi/shared/Utils";
import { Webhook as SvixWebhook } from "svix"

import type { AppRouteHandler } from "@/lib/types";
import crypto from "node:crypto"

import db, { orgDb } from "@/db";
import { networkToChainidMap, orgSchema } from "@flintapi/shared/Utils";

import type {
  BellbankRoute,
  OnbrailsRoute,
  CentiivRoute,
  OffRampRoute,
  PalmpayRoute
} from "./webhooks.routes";
import env from "@/env";
import { clearVirtualAccount, fetchVirtualAccount, sweepFunds } from "../ramp/ramp.utils";
import { apiLogger } from "@flintapi/shared/Logger";
import { bullMqBase, QueueInstances, QueueNames } from "@flintapi/shared/Queue";
import { Job, QueueEvents } from "bullmq";
import { auth } from "@/lib/auth";

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

  if (body?.event === "collection") {
    try {
      const amount = body?.amountReceived;
      const result = await fetchVirtualAccount(body?.virtualAccount);

      if (!result.transactionId) {
        apiLogger.warn("No transaction found in bellbank on-ramp webhook:", body)
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
          jobId: `ramp-on-ramp-${result.transactionId}`,
          attempts: 3,
        },
      ).then((job) => apiLogger.info("On-Ramp Job sent...", job.data));
      return c.json(
        { success: true, message: "Transaction processed successfully" },
        HttpStatusCodes.OK,
      );
    } catch (error: any) {
      apiLogger.error("Failed to add On-Ramp Job", error);
      return c.json(
        {
          success: false,
          message: "Something went wrong with transaction processing",
        },
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  } else {
    apiLogger.info("Invalid bellbank event, expected 'collection'", body)
    return c.json(
      {
        success: false,
        message: "Invalid event type",
      },
      HttpStatusCodes.BAD_REQUEST,
    );
  }
};

export const onbrails: AppRouteHandler<OnbrailsRoute> = async (c) => {
  const body = c.req.valid("json");
  const signature = c.req.header('x-brails-signature');
  const hash = crypto.createHmac('sha512', env.ONBRAILS_WHS).update(JSON.stringify(body)).digest('hex');
  if (hash !== signature) {
    apiLogger.warn("[onbrails]: Invalid request signature", {body, signature});
    return c.json({
      success: false,
      message: "Invalid request signature"
    }, HttpStatusCodes.BAD_REQUEST)
  }

  if (body?.event === "transaction.deposit.success") {
    try {
      const amount = body.data.amount;
      const result = await fetchVirtualAccount(body.data.bankAccountNumber);

      if (!result.transactionId) {
        apiLogger.warn("No transaction found in onbrails on-ramp webhook:", body)
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
          jobId: `ramp-on-ramp-${result.transactionId}`,
          attempts: 3,
        },
      ).then(async (job) => {
        await clearVirtualAccount(body.data.bankAccountNumber)
        apiLogger.info("On-Ramp Job sent...", job.data);
      });
      return c.json(
        { success: true, message: "Transaction processed successfully" },
        HttpStatusCodes.OK,
      );
    } catch (error: any) {
      apiLogger.error("Failed to add On-Ramp Job", error);
      return c.json(
        {
          success: false,
          message: "Something went wrong with transaction processing",
        },
        HttpStatusCodes.BAD_REQUEST,
      );
    }
  } else {
    apiLogger.info("Invalid bellbank event, expected 'collection'", body)
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
  const signature = c.req.header('x-signature')

  console.log("Body", body)
  const hash = crypto.createHmac("sha512", Buffer.from(env.SYNAPSE_WH_KEY, 'utf8')).update(Buffer.from(JSON.stringify({...body,amountReceived: body.amountReceived.toString()}).trim(), 'utf8')).digest("hex")
  console.log("Hash", hash)
  if(signature !== hash) {
    console.log(`Invalid event from synapse service`, signature)
    apiLogger.warn(`Invalid signature from synapse service abandon processing...`)
    return c.json({
      success: false,
      message: `Invalid event signaure from synapse`
    }, HttpStatusCodes.BAD_REQUEST)
  }

  const transactionId = body.transactionId;
  const organizationId = body.organizationId;
  const amountReceived = body.amountReceived;
  const type = body?.type;
  apiLogger.info("Event from synapse service", { body });

  if (type !== "off") {
    return c.json(
      {
        success: false,
        message: "Invalid event type: Expected 'off'",
      },
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  try {
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
    ).then((jsb) => apiLogger.info("Off-Ramp Job sent...", jsb.data));
    return c.json(
      {
        success: true,
        message: "webhook received and processed!",
      },
      HttpStatusCodes.OK,
    );
  } catch (error: any) {
    apiLogger.error("Failed to add Off-Ramp Job", error)
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

  if (!organization) {
    return c.text('failed', HttpStatusCodes.BAD_REQUEST);
  }

  const metadata = typeof organization.metadata !== 'string' ? organization.metadata : JSON.parse(organization.metadata);
  const orgDatabase = orgDb({ dbUrl: metadata?.dbUrl! });
  // TODO: validate transaction
  const transaction = await orgDatabase.query.transactions.findFirst({
    where(fields, ops) {
      return ops.eq(fields.id, params.transactionId)
    }
  })
  if (!transaction) {
    return c.text('failed', HttpStatusCodes.BAD_REQUEST);
  } else if (transaction.status === "completed") {
    return c.text('success', HttpStatusCodes.OK)
  }

  if (body.orderStatus === 3) {
    let retryRef = transaction.reference.includes('.', transaction.reference.length - 1)
      ? `${transaction.reference.split('.')[0]}.${crypto.randomUUID().substring(0, 6)}`
      : `${transaction.reference}.${crypto.randomUUID().substring(0, 6)}`;

    apiLogger.info("Order status is failed, retry ref", retryRef)
    const [updatedTransaction] = await orgDatabase.update(orgSchema.transactions)
      .set({
        status: "failed",
        reference: retryRef // update refernce for provider
      })
      .where(eq(orgSchema.transactions.id, transaction.id))
      .returning();
    console.log("Transaction update", updatedTransaction);
    const job = await rampQueue.getJob(`ramp-off-ramp-${transaction.id}`)
    console.log("Found job", "Attempt made", job?.attemptsMade, "Job data", job?.data)
    if(job) {
      const state = await job.getState()
      if(state === 'completed' || state === 'failed') {
        await job.retry('completed')
        apiLogger.info("Retrying failed payout from payment provider", {data: job.data, jobId: job.id})
      }
      // TODO: send a retrying webhook event
    }
  } else if (body.orderStatus === 2) {
    const [updatedTransaction] = await orgDatabase.update(orgSchema.transactions)
      .set({
        status: "completed",
      })
      .where(eq(orgSchema.transactions.id, transaction.id))
      .returning();
    apiLogger.info("Off-Ramp Transaction completed", updatedTransaction)
    // TODO: Call webhook utility function
    const event = `offramp.completed`;
    Webhook.trigger(transaction.metadata?.notifyUrl, transaction.metadata?.webhookSecret, {
      event,
      data: {
        transactionId: transaction.id,
        reference: transaction.reference,
        amount: transaction.amount,
        status: updatedTransaction.status,
        network: transaction.network,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      }
    }).then(() => apiLogger.info(`Webhook triggered: [${event}]`))
    .catch((error) => apiLogger.warn(`API Key data not found to trigger webhook!!! SOS`, {error}))

    await sweepFunds(env.TREASURY_KEY_LABEL, {
      chainId: networkToChainidMap[transaction.network],
      amount: transaction.amount,
      destinationAddress: env.TREASURY_EVM_ADDRESS,
      depositAddress: transaction.metadata?.depositAddress,
      queue: kmsQueue,
      queueEvents: kmsQueueEvents,
      index: transaction.metadata?.index || 0,
      transactionId: transaction.id,
    }).catch((error: any) => {
      apiLogger.error("Failed to sweep off-ramp funds", error);
      return null;
    })
      .then(async (result) => {
        if (result) {
          const [sweepUpdatedTransaction] = await orgDatabase.update(orgSchema.transactions)
            .set({
              metadata: {
                ...transaction.metadata!,
                sweepHash: result.hash
              },
            })
            .where(eq(orgSchema.transactions.id, transaction.id))
            .returning();
          apiLogger.info("Sweep update transaction", sweepUpdatedTransaction);
        }
      });

  } else {
    apiLogger.info("Still pending payout...", body)
  }

  return c.text('success', HttpStatusCodes.OK);
};
