import type { RampServiceJob } from "@flintapi/shared/Queue";

import { FiatPaymentContext, PaymentProvider } from "@flintapi/shared/Adapters";

const fiatPaymentContext = new FiatPaymentContext(PaymentProvider.BELLBANK);

class Ramp {
  static async processOffRampJob(data: RampServiceJob, attemptsMade: number) {
    if (attemptsMade > 0) {
      fiatPaymentContext.setStrategy(PaymentProvider.CENTIIV);
      // TODO: check last provider used in updated job data
      const { transactionData, organizationData } = data;
      const { accountNumber, bankCode, reference, amount, narration } = transactionData;
      return await fiatPaymentContext.transfer({
        accountNumber,
        bankCode,
        reference,
        amount,
        narration,
      });
    }
    else {
      const { transactionData, organizationData } = job.data;
      const { accountNumber, bankCode, reference, amount, narration } = transactionData;
      return await fiatPaymentContext.transfer({
        accountNumber,
        bankCode,
        reference,
        amount,
        narration,
      });
    }
  }

  static async processOnRampJob() {

  }
}

export default Ramp;
