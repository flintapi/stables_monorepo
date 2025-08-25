import db from "@/db";
import { transactions } from "@/db/schema/app-schema";
import BellBankAdapter from "@/routes/payouts/adapters/bellbank.adapter";
import { CronJob } from "cron"
import { eq } from "drizzle-orm";

export const bellbankCronListener = async () => {
  console.log('Registering event listener for 30 seconds interval...');
  const reconcileBellBankTransaction = new CronJob('*/30 * * * *', async () => {
    try {
      // Get all pending transaction
      const transactionList = await db.query.transactions.findMany({
        where(fields, ops) {
          return ops.and(
            ops.eq(fields.status, "pending"),
            ops.isNotNull(fields.transactionHash)
          )
        }
      });
      // Hit bellbank requery endpoint for status
      if (transactionList.length) {
        const adapter = new BellBankAdapter()

        for (const trx of transactionList) {
          console.log("Transaction to query", trx, trx.reference)
          const result = await adapter.queryTransaction({ reference: trx.reference }).catch((error) => {
            console.log("Error getting transaction with ref", trx.reference, error)
            return {
              status: 'failed'
            }
          })

          // Check status and update
          if (result['status'] && result['status'] === 'successful') {
            // Update transaction status based on requery data
            await db.update(transactions)
              .set({
                status: 'completed'
              })
              .where(eq(transactions.reference, trx.reference))
            console.log("Transaction updated")
          }
          else if(result['status'] && result['status'] === 'failed') {
            await db.update(transactions)
              .set({
                status: 'failed'
              })
              .where(eq(transactions.reference, trx.reference))
            console.log("Transaction updated")
            
          }
        }
      }
    }
    catch (error) {
      console.error('Error processing transaction:', error);
    }
  });

  reconcileBellBankTransaction.start();
};
