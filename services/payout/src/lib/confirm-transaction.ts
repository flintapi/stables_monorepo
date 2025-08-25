import { formatUnits, parseAbiItem, parseEventLogs, TransactionReceipt, type PublicClient } from "viem";

import BellBankAdapter from "@/routes/payouts/adapters/bellbank.adapter";
import env from "@/env";
import { Merchant } from "@/lib/types";

interface Payload {
  accountNumber: string;
  bankCode: string;
  amount: number;
  narration: string;
  reference: string;
  transactionHash: `0x${string}`;
  senderName?: string;
}
export async function initializeDisbursement(payload: Payload) {

  const adapter = new BellBankAdapter();

  const transferResult = await adapter.transfer({
    beneficiaryAccountNumber: payload?.accountNumber,
    beneficiaryBankCode: payload?.bankCode,
    amount: payload?.amount,
    narration: payload?.narration,
    reference: payload?.reference,
    senderName: payload?.senderName,
  });

  console.log("Transfer result", transferResult);

  // await db.update(transactions).set({
  //   status: "completed",
  // }).where(eq(transactions.reference, payload.reference)).returning();
  return transferResult;
}


export async function confirmChainTransactionAmount(transaction: TransactionReceipt, amount: number, chain: 'base' | 'bsc', merchant: Merchant): Promise<boolean> {
  console.log("Amount", amount)
  const transferEventAbi = parseAbiItem(
    'event Transfer(address indexed from, address indexed to, uint256 value)'
  )
  const tokenAddress = chain === 'base'? `0x46C85152bFe9f96829aA94755D9f915F9B10EF5F` : `0xa8AEA66B361a8d53e8865c62D142167Af28Af058`
  const transferLogs = transaction.logs.filter(log => log.address.toLowerCase() === tokenAddress.toLowerCase())

  const transfers = []

  for (const log of transferLogs) {
    try {
      const decodedLog = parseEventLogs({
        abi: [transferEventAbi],
        logs: [log]
      })[0]

      if (decodedLog.eventName === 'Transfer' && decodedLog.args.to.toLowerCase() === merchant.collectionAddress?.toLowerCase()) {
        transfers.push({
          from: decodedLog.args.from,
          to: decodedLog.args.to,
          value: formatUnits(decodedLog.args.value, 6), // This is the amount in wei/smallest unit
          tokenAddress: log.address
        })
      }
    } catch (parseError) {
      console.warn('Failed to parse log:', parseError)
      continue
    }
  }

  console.log('Transfers', transfers)

  // TODO: check for batch transactions
  if (transfers.length && Number(transfers[0].value) === amount) {
    return true;
  }

  return false;
}
