import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";
import Redlock from 'redlock';
import { CacheFacade } from "@flintapi/shared/Cache";
import crypto from "node:crypto"

// @ts-ignore
const redlock = new Redlock([CacheFacade.redisCache], {
  driftFactor: 0.01,
  retryCount: 0,
});

export const lockPayoutRequest = (ttl = 5000) => {
  return createMiddleware(async (c, next) => {
    // @ts-ignore
    const body = await c.req.json();
    const bodyhash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
    const lockKey = `locks:request:payout:${bodyhash}`;

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
      await releaseLock();
    }
    catch (error) {
      console.log("Error occured for the request", error)
      await releaseLock();
      throw error;
    }
  })
};
