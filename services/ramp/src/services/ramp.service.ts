import type { RampServiceJob } from "@flintapi/shared/Queue";
import type { TransactionMetadata } from "@flintapi/shared/Utils";

import { FiatPaymentContext, PaymentProvider } from "@flintapi/shared/Adapters";
import { rampLogger } from "@flintapi/shared/Logger";

import db, { orgDb } from "@/db";

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
      const transaction = await orgDb({ dbUrl: (organization?.metadata as { dbUrl: string })?.dbUrl }).query.transactions.findFirst({
        where(fields, ops) {
          return ops.eq(fields.id, transactionId);
        },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      const { accountNumber, bankCode } = transaction.metadata as TransactionMetadata;

      return await fiatPaymentContext.transfer({
        accountNumber: accountNumber!,
        bankCode: bankCode!,
        reference: transaction.reference,
        amount: transaction.amount,
        narration: transaction?.narration || "Default narration",
      });
    }
    else {
      const { transactionId, organizationId } = data;
      const organization = await db.query.organization.findFirst({
        where(fields, ops) {
          return ops.eq(fields.id, organizationId);
        },
      });
      const transaction = await orgDb({ dbUrl: (organization?.metadata as { dbUrl: string })?.dbUrl }).query.transactions.findFirst({
        where(fields, ops) {
          return ops.eq(fields.id, transactionId);
        },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      const { accountNumber, bankCode } = transaction.metadata as TransactionMetadata;

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
    throw new Error("Not implemented");
  }
}

export default Ramp;
