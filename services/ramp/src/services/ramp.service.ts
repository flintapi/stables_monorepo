import type { RampServiceJob } from "@flintapi/shared/Queue";
import type { Address, Hex } from "viem";

import { FiatPaymentContext, PaymentProvider } from "@flintapi/shared/Adapters";
import { rampLogger } from "@flintapi/shared/Logger";
import { bullMqBase, QueueInstances, QueueNames } from "@flintapi/shared/Queue";

import {
  networkToChainidMap,
  orgSchema,
  TOKEN_ADDRESSES,
  Webhook,
  type TransactionMetadata,
  getAmountAfterFee
} from "@flintapi/shared/Utils";
import { QueueEvents } from "bullmq";
import { encodeFunctionData, parseAbi, parseUnits } from "viem";

import db, { orgDb } from "@/db";
import env from "@/env";
import { eq } from "drizzle-orm";

const walletQueue = QueueInstances[QueueNames.WALLET_QUEUE];
const walletQueueEvents = new QueueEvents(QueueNames.WALLET_QUEUE, bullMqBase);

const fiatPaymentContext = new FiatPaymentContext(PaymentProvider.PALMPAY);

class Ramp {
  static async processOffRampJob(data: RampServiceJob, attemptsMade: number) {
    // if (attemptsMade > 0) {
    //   fiatPaymentContext.setStrategy(PaymentProvider.CENTIIV);
    //   // TODO: check last provider used in updated job data
    //   const { transactionId, organizationId, amountReceived } = data;
    //   const organization = await db.query.organization.findFirst({
    //     where(fields, ops) {
    //       return ops.eq(fields.id, organizationId);
    //     },
    //   });
    //   if(!organization) {
    //     throw new Error("Organization not found")
    //   }
    //   const metadata = typeof organization.metadata !== 'string'? organization.metadata : JSON.parse(organization.metadata)
    //   const transaction = await orgDb({
    //     dbUrl: (metadata as { dbUrl: string })?.dbUrl,
    //   }).query.transactions.findFirst({
    //     where(fields, ops) {
    //       return ops.eq(fields.id, transactionId);
    //     },
    //   });

    //   if (!transaction) {
    //     throw new Error("Transaction not found");
    //   }

    //   const { accountNumber, bankCode } =
    //     transaction.metadata as TransactionMetadata;

    //   return await fiatPaymentContext.transfer({
    //     accountNumber: accountNumber!,
    //     bankCode: bankCode!,
    //     reference: transaction.reference,
    //     amount: Math.min(transaction.amount, amountReceived!),
    //     narration: transaction?.narration || "Default narration",
    //   }).then((responses) => rampLogger.info("Transfer made and completed...", responses));
    // } else {
      const { transactionId, organizationId, amountReceived, prevProviders } = data;
      rampLogger.info("Payout transaction with palmpay...", prevProviders, amountReceived);
      const organization = await db.query.organization.findFirst({
        where(fields, ops) {
          return ops.eq(fields.id, organizationId);
        },
      });
      if(!organization) {
        throw new Error("Organization not found")
      }
      const metadata = typeof organization.metadata !== 'string'? organization.metadata : JSON.parse(organization.metadata)
      const transaction = await orgDb({
        dbUrl: metadata?.dbUrl
      }).query.transactions.findFirst({
        where(fields, ops) {
          return ops.eq(fields.id, transactionId);
        },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      const accountNumber = transaction.metadata?.accountNumber;
      const bankCode = transaction.metadata?.bankCode;

      if(!accountNumber || !bankCode) {
        throw new Error("Account number or bank code not found");
      }

      return await fiatPaymentContext.transfer({
        accountNumber: accountNumber,
        bankCode: bankCode,
        reference: transaction.reference,
        amount: getAmountAfterFee(transaction.amount),
        narration: transaction?.narration || "Default narration",
        transactionId: transaction.id,
        organizationId: organization?.id,
      });
    // }
  }

  static async processOnRampJob(data: RampServiceJob, attemptsMade: number) {
    rampLogger.info(`processOnRampJob`, data, attemptsMade);

    const { transactionId, organizationId, type, amountReceived } = data;

    if (type !== "on") {
      throw new Error("Ramp is not of type on");
    }

    const organization = await db.query.organization.findFirst({
      where(fields, ops) {
        return ops.eq(fields.id, organizationId);
      },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    const metadata = typeof organization.metadata !== 'string'? organization.metadata : JSON.parse(organization.metadata)
    const orgDatabase = orgDb({ dbUrl: metadata?.dbUrl! });

    const transaction = await orgDatabase.query.transactions.findFirst({
      where(fields, ops) {
        return ops.eq(fields.id, transactionId);
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const toAddress = transaction.metadata?.address;
    if (!toAddress) {
      throw new Error("No receiving address added to this transaction");
    }
    const chainId = networkToChainidMap[transaction.network];
    const token = TOKEN_ADDRESSES[chainId].cngn;

    const job = await walletQueue.add(
      "sign-transaction",
      {
        chainId,
        keyLabel: env.TREASURY_KEY_LABEL, // will be the signer if index for smart account is not provided
        data: encodeFunctionData({
          abi: parseAbi([
            "function transfer(address to, uint256 amount) external returns (bool)",
          ]),
          functionName: "transfer",
          args: [
            transaction.metadata!.address! as Address,
            parseUnits(getAmountAfterFee(amountReceived || 0)?.toString() || "0", token.decimal),
          ],
        }),
        contractAddress: token.address as Address,
      },
      { jobId: `kms-payout-${chainId}-cngn-${transaction.id}`, attempts: 1 },
    );

    const result = (await job.waitUntilFinished(walletQueueEvents)) as {
      hash: Hex;
    };

    const [updateTransaction] = await orgDatabase
      .update(orgSchema.transactions)
      .set({
        status: "completed",
        metadata: {
          ...transaction.metadata,
          transactionHash: result.hash,
        } as any,
      })
      .where(eq(orgSchema.transactions.id, transactionId))
      .returning();
    rampLogger.info("Transaction updated", updateTransaction);

    // TODO: Trigger webhook utils function
    const event = `onramp.completed`;
    Webhook.trigger(transaction.metadata?.notifyUrl, transaction.metadata?.webhookSecret, {
      event,
      data: {
        transactionId: transaction.id,
        reference: transaction.reference,
        amount: transaction.amount,
        status: updateTransaction.status,
        network: transaction.network,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      }
    }).then(() => rampLogger.info(`Webhook triggered: [${event}]`))
    .catch((error) => rampLogger.warn(`API Key data not found to trigger webhook!!! SOS`, {error}))

    return { status: updateTransaction.status };
  }
}

export default Ramp;
