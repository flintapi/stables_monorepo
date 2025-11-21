import { orgDb } from "@/db";
import { sql } from "drizzle-orm";
import { transaction } from "./ramp.schema";
import type { Transaction } from "./ramp.schema";
import { CacheFacade } from "@flintapi/shared/Cache";
import { QueueInstances, QueueNames } from "@flintapi/shared/Queue";
import { QueueEvents } from "bullmq";
import env from "@/env";
import { ChainId, supportedChains, TOKEN_ADDRESSES } from "@flintapi/shared/Utils";
import { Address, createPublicClient, encodeFunctionData, Hex, parseAbi, parseUnits, extractChain, http } from "viem";

export async function queryTransactionByVirtualAccount(
  db: ReturnType<typeof orgDb>,
  virtualAccount: string,
) {
  const result = await db.query.transactions.findFirst({
    where(fields, ops) {
      return ops.eq(
        sql`json_extract(${transaction.metadata}, '$.accountNumber')`,
        virtualAccount,
      );
    },
  });
  console.log(result);

  result;
}

export const getDefaultVirtualAccountArgs = {
  type: "corporate" as "corporate",
  rcNumber: "1234567890",
  businessName: "FlintAPI Ltd",
  emailAddress: "contact@flintapi.io",
  phoneNumber: "1852282",
  bvn: "00011100011",
  dateOfBirth: "1998-06-29",
  incorporationDate: "20-10-2021",
};

export const defaultBankCode = "090672";

export async function cacheVirtualAccount(
  accountNumber: string,
  data: { organizationId: string; transactionId?: string },
) {
  try {
    const key = `va:${accountNumber}`;

    await CacheFacade.redisCache.hmset(key, data);
    await CacheFacade.redisCache.expire(key, 60 * 60 * 24); // ttl: 24hours
  } catch (error) {
    console.log("Failed to cache virtual account", error);
    throw new Error("Failed to cache virtual account");
  }
}

export async function fetchVirtualAccount(accountNumber: string) {
  try {
    const key = `va:${accountNumber}`;

    const data = (await CacheFacade.redisCache.hgetall(key)) as {
      organizationId: string;
      transactionId?: string;
    } | null;
    if (!data) {
      throw new Error("Virtual account not found");
    }
    return data;
  } catch (error) {
    console.log("Failed to fetch virtual account", error);
    throw new Error("Failed to fetch virtual account");
  }
}


interface ISweepFundsProps {
  amount: number;
  destinationAddress: string;
  depositAddress: Address;
  queue: typeof QueueInstances[QueueNames.WALLET_QUEUE];
  queueEvents: QueueEvents;
  chainId: ChainId;
  index: number;
  transactionId: string;
}
export async function sweepFunds(keyLabel: string, params: ISweepFundsProps) {
  const {queue, queueEvents, amount, destinationAddress, chainId, index, transactionId, depositAddress} = params

  const token = TOKEN_ADDRESSES[chainId].cngn;

  const client = createPublicClient({
    chain: extractChain({chains: Object.values(supportedChains), id: chainId}),
    transport: http()
  })

  const balance = await client.readContract({
    address: token.address as Address,
    abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
    functionName: 'balanceOf',
    args: [depositAddress],
  }).catch(() => null)

  const job = await queue.add(
    "sign-transaction",
    {
      chainId,
      keyLabel: keyLabel, // will be the signer if index for smart account is not provided
      data: encodeFunctionData({
        abi: parseAbi([
          "function transfer(address to, uint256 amount) external returns (bool)",
        ]),
        functionName: "transfer",
        args: [
          destinationAddress! as Address,
          balance ?? parseUnits(amount?.toString() || "0", token.decimal),
        ],
      }),
      contractAddress: token.address as Address,
      index,
    },
    { jobId: `kms-sweep-${chainId}-cngn-${transactionId}`, attempts: 1 },
  );

  const result = (await job.waitUntilFinished(queueEvents)) as {
    hash: Hex;
  }

  return result;
}
