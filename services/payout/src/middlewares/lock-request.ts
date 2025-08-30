import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";
import Redlock from 'redlock';
import { CacheFacade } from "@/lib/cache.facade";

// @ts-ignore
const redlock = new Redlock([CacheFacade.redisCache], {
  driftFactor: 0.01,
  retryCount: 0,
});

export const lockPayoutRequest = (ttl = 5000) => {
  return createMiddleware(async (c, next) => {
    // @ts-ignore
    const body = await c.req.json();
    const lockKey = `locks:request:payout:${(body as {network: string})?.network}:${(body as {transactionHash: string})?.transactionHash}`;

    let lock: any;
    try {
      lock = await redlock.acquire([lockKey], ttl);
    }
    catch {
      return c.json({
        success: false,
        message: 'Operation is already in progress.'
      }, HttpStatusCodes.TOO_MANY_REQUESTS);
    }

    let lockReleased = false;

    const releaseLock = async () => {
      if (!lockReleased) {
        lockReleased = true;
        try {
          await lock.release();
        } catch (err: any) {
          console.warn('Failed to release lock (may have expired):', err?.message);
        }
      }
    };

    try {
      await next();
    }
    catch (error) {
      console.log("Error occured for the request", error)
      await releaseLock();
      throw error;
    }
  })
};
