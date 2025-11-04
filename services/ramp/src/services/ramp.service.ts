import type { RampServiceJob } from "@flintapi/shared/Queue";
import type { Address, Hex } from "viem";

import { FiatPaymentContext, PaymentProvider } from "@flintapi/shared/Adapters";
import { rampLogger } from "@flintapi/shared/Logger";
import { bullMqBase, QueueInstances, QueueNames } from "@flintapi/shared/Queue";
import {
  networkToChainidMap,
  orgSchema,
  TOKEN_ADDRESSES,
  type TransactionMetadata,
} from "@flintapi/shared/Utils";
import { QueueEvents } from "bullmq";
import { encodeFunctionData, parseAbi, parseUnits } from "viem";

import db, { orgDb } from "@/db";
import env from "@/env";
import { eq } from "drizzle-orm";

const walletQueue = QueueInstances[QueueNames.WALLET_QUEUE];
const walletQueueEvents = new QueueEvents(QueueNames.WALLET_QUEUE, bullMqBase);

const fiatPaymentContext = new FiatPaymentContext(PaymentProvider.BELLBANK);

class Ramp {
  static async processOffRampJob(data: RampServiceJob, attemptsMade: number) {
    if (attemptsMade > 0) {
      fiatPaymentContext.setStrategy(PaymentProvider.CENTIIV);
      // TODO: check last provider used in updated job data
      const { transactionId, organizationId } = data;
      const organization = await db.query.organization.findFirst({
        where(fields, ops) {
          return ops.eq(fields.id, organizationId);
        },
      });
      const transaction = await orgDb({
        dbUrl: (organization?.metadata as { dbUrl: string })?.dbUrl,
      }).query.transactions.findFirst({
        where(fields, ops) {
          return ops.eq(fields.id, transactionId);
        },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      const { accountNumber, bankCode } =
        transaction.metadata as TransactionMetadata;

      return await fiatPaymentContext.transfer({
        accountNumber: accountNumber!,
        bankCode: bankCode!,
        reference: transaction.reference,
        amount: transaction.amount,
        narration: transaction?.narration || "Default narration",
      });
    } else {
      const { transactionId, organizationId, amountReceived } = data;
      const organization = await db.query.organization.findFirst({
        where(fields, ops) {
          return ops.eq(fields.id, organizationId);
        },
      });
      const transaction = await orgDb({
        dbUrl: (organization?.metadata as { dbUrl: string })?.dbUrl,
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

      return await fiatPaymentContext.transfer({
        accountNumber: accountNumber!,
        bankCode: bankCode!,
        reference: transaction.reference,
        amount: transaction.amount,
        narration: transaction?.narration || "Default narration",
      });
    }
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

    const orgDatabase = orgDb({ dbUrl: organization.metadata?.dbUrl! });

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
            parseUnits(amountReceived?.toString() || "0", token.decimal),
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

    return { status: updateTransaction.status };
  }
}

export default Ramp;
