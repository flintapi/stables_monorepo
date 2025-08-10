import * as HttpStatusCodes from "stoker/http-status-codes";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { transactions } from "@/db/app-schema";

import type { InitPayoutRoute } from "./payouts.routes";

import BellBankAdapter from "./adapters/bellbank.adapter";

export const payout: AppRouteHandler<InitPayoutRoute> = async (c) => {
  const body = c.req.valid("json");

  const client = createPublicClient({
    transport: http(),
    chain: base,
  });

  const tx = await client.waitForTransactionReceipt({ hash: body.transactionHash as `0x${string}` });

  if (!tx) {
    return c.json({
      success: false,
      message: "Transaction not found",
    }, HttpStatusCodes.BAD_REQUEST);
  }

  const adapter = new BellBankAdapter();
  try {
    await adapter.nameEnquiry({
      accountNumber: body.accountNumber,
      bankCode: body.bankCode,
    });
  }
  catch (error: any) {
    console.log("Name enquiry failed", error);
    return c.json({
      success: false,
      message: "Account name enquiry failed",
    }, HttpStatusCodes.BAD_REQUEST);
  }

  // Create transaction in db
  try {
    const [newTransaction] = await db.insert(transactions).values({
      reference: body.reference,
      accountNumber: body.accountNumber,
      bankCode: body.bankCode,
      amount: body.amount,
    }).returning();
    console.log("New Transaction", newTransaction);
  }
  catch (error: any) {
    console.log("Transaction creation failed", error);
    return c.json({
      success: false,
      message: "Transaction creation failed",
    }, HttpStatusCodes.BAD_REQUEST);
  }
  // trigger payout workflow with data
  // const workflowClient = new Client()

  return c.json({
    address: "0x",
    payoutRef: "sdvasodbv",
    status: body.reference,
  }, HttpStatusCodes.OK);
};
