import * as HttpStatusCodes from "stoker/http-status-codes";
import { createPublicClient, http } from "viem";
import { base, baseSepolia, bsc, bscTestnet } from "viem/chains";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { transactions } from "@/db/schema/app-schema";
import env from "@/env";
import { confirmChainTransactionAmount, initializeDisbursement } from "@/lib/confirm-transaction";
import { sendEmail } from "@/lib/email";

import type { CollectionAddressRoute, InitPayoutRoute, ListBanksRoute } from "./payouts.routes";

// import BellBankAdapter from "./adapters/bellbank.adapter";
import CentiivAdapter from "./adapters/centiiv.adapter";

export const payout: AppRouteHandler<InitPayoutRoute> = async (c) => {
  const FEE_AMOUNT_IN_NAIRA = 60.00;
  try {
    const body = c.req.valid("json");
    console.log("body", body);
    const getChain = () => {
      if (env.NODE_ENV === "development" && body.network === "base") {
        return baseSepolia;
      }
      else if (env.NODE_ENV === "development" && body.network === "bsc") {
        return bscTestnet;
      }
      else if (env.NODE_ENV !== "development" && body.network === "base") {
        return base;
      }
      else if (env.NODE_ENV !== "development" && body.network === "bsc") {
        return bsc;
      }
      else {
        return false;
      }
    };
    const chain = getChain();
    if (!chain) {
      return c.json({
        success: false,
        message: "Unsupported network",
      }, HttpStatusCodes.BAD_REQUEST);
    }
    const client = createPublicClient({
      transport: http(),
      chain,
    });

    if (body.accountNumber.length !== 10) {
      return c.json({
        success: false,
        message: "Account number cannot be less than or greater than 10 digits",
      }, HttpStatusCodes.BAD_REQUEST);
    }

    if(body.amount < 500) {
      return c.json({
        success: false,
        message: "Amount must be larger than 500"
      }, HttpStatusCodes.BAD_REQUEST);
    }

    const tx = await client.getTransactionReceipt({ hash: body.transactionHash as `0x${string}` }).catch((error: any) => console.log("Error in transaction receipt", error));
    console.log("Transaction receipt in payout handler", tx);

    if (!tx) {
      return c.json({
        success: false,
        message: "Transaction not found",
      }, HttpStatusCodes.BAD_REQUEST);
    }

    const isValidAmount = await confirmChainTransactionAmount(tx, Number(body.amount), body.network, c.get("merchant"));
    if (!isValidAmount) {
      return c.json({
        success: false,
        message: "Transaction amount does not match: blockchain amount does not match amount in payload or transfer was not to collection address",
      }, HttpStatusCodes.BAD_REQUEST);
    }

    // const adapter = new BellBankAdapter();
    const centiivAdapter = new CentiivAdapter();
    let accountDetails: Record<string, any>;
    try {
      const result = await centiivAdapter.nameEnquiry({
        bankCode: body.bankCode,
        accountNumber: body.accountNumber
      })
      // const result = await adapter.nameEnquiry({
      //   accountNumber: body.accountNumber,
      //   bankCode: body.bankCode,
      // });
      accountDetails = result;

      console.log("Name Enquiry Result", result);
    }
    catch (error: any) {
      console.log("Name enquiry failed", error);
      // return c.json({
      //   success: false,
      //   message: "Account name enquiry failed",
      // }, HttpStatusCodes.BAD_REQUEST);
    }

    // Create transaction in db
    const centiivTrackingId = crypto.randomUUID()
    try {
      const [newTransaction] = await db.insert(transactions).values({
        reference: body.reference,
        trackingId: centiivTrackingId,
        accountNumber: body.accountNumber,
        bankCode: body.bankCode,
        amount: body.amount.toString(),
        transactionHash: body.transactionHash,
        network: body.network,
      }).returning();
      console.log("New Transaction", newTransaction);
    }
    catch (error: any) {
      console.log("Transaction creation failed", error);
      // return c.json({
      //   success: false,
      //   message: "Transaction creation failed",
      // }, HttpStatusCodes.BAD_REQUEST);
    }

    const merchantName = c.get("merchantName");
    const collectionAddress = c.get("merchant").collectionAddress;

    initializeDisbursement({
      accountNumber: body.accountNumber,
      bankCode: body.bankCode,
      amount: merchantName.toLowerCase() === "bread"
        ? Number(body.amount.toFixed(2))
        : Number(getAmountAfterFee(body.amount).toFixed(2)),
      reference: centiivTrackingId,
      narration: body.narration,
      transactionHash: body.transactionHash as `0x${string}`,
      senderName: merchantName || "Bread",
    }).then((data) => {
      console.log("Data", data);
      // if (!data.sessionId) {
      // TODO: transaction issue from NIBBS
      // sendEmail({
      //   to: env.TRANSACTION_EMAIL || "flintapi.io@gmail.com",
      //   subject: "Absent session ID from NIBSS with bell bank",
      //   body: `
      //   The transaction with with transaction hash ${body.transactionHash}<br/>
      //   from the merchant ${merchantName}<br/>
      //   on the ${body.network} failed to be disbursed, confirm and retry manually<br/>
      //   with the following account details:<br/>
      //   - Bank: ${accountDetails?.bank?.name}<br/>
      //   - Account Name: ${accountDetails?.accountName}<br/>
      //   - Account Number: ${body.accountNumber}<br/>
      //   - Bank Code: ${body.bankCode}<br/>
      //   - Amount: ${body.amount}<br/>
      //   - Narration: ${body.narration}
      // `,
      // })
      //   .then(value => console.log("Failure alert sent", value))
      //   .catch(error => console.log("Failed to send failure alert", error));
      // }
    }).catch((error: any) => {
      console.log("Error confirming and disbuesing", error);
      sendEmail({
        to: env.TRANSACTION_EMAIL || "flintapi.io@gmail.com",
        subject: "Failed payout transaction with Centiiv",
        body: `
          The transaction with with transaction hash ${body.transactionHash}<br/>
          from the merchant ${merchantName}<br/>
          on the ${body.network} failed to be disbursed, confirm and retry manually<br/>
          with the following account details:<br/>
          - Bank: ${accountDetails?.bank?.name}<br/>
          - Account Name: ${accountDetails?.accountName}<br/>
          - Account Number: ${body.accountNumber}<br/>
          - Bank Code: ${body.bankCode}<br/>
          - Amount: ${body.amount}<br/>
          - Narration: ${body.narration}
        `,
      })
        .then(value => console.log("Failure alert sent", value))
        .catch(error => console.log("Failed to send failure alert", error));
    });

    return c.json({
      address: collectionAddress!,
      payoutRef: body.reference,
      status: "pending",
    }, HttpStatusCodes.OK);
  }
  catch (error: any) {
    console.log("Error resolving route", error);
    return c.json({
      success: false,
      message: "Something went wrong",
    }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const listBanks: AppRouteHandler<ListBanksRoute> = async (c) => {
  // const adapter = new BellBankAdapter();
  const centiivAdapter = new CentiivAdapter();
  const banks = await centiivAdapter.listBanks();
  return c.json(banks.map((bank) => ({
    institutionCode: bank?.code,
    institutionName: bank?.name
  })), HttpStatusCodes.OK);
};

export const collectionAddress: AppRouteHandler<CollectionAddressRoute> = async (c) => {
  const merchant = c.get("merchant");

  return c.json({
    success: true,
    message: "Merchant collection address retrieved",
    address: merchant.collectionAddress!,
  });
};


function getAmountAfterFee(amount: number): number {
  const FEE_PERCENT = 0.001
  const FEE_CAP = 200;

  const fee = (amount * FEE_PERCENT);
  return fee > FEE_CAP? (amount - FEE_CAP) : (amount - fee);
}
