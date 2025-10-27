import { orgDb } from "@/db";
import { sql } from "drizzle-orm";
import { transaction } from "./ramp.schema";
import { CacheFacade } from "@flintapi/shared/Cache";

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

export async function cacheVirtualAccount(
  accountNumber: string,
  data: { organizationId: string; transactionId: string },
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
      transactionId: string;
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
