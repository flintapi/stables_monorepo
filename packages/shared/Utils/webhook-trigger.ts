import { betterFetch } from "@better-fetch/fetch";

import crypto from "node:crypto";


export class Webhook {
  static async trigger(url: string, key: string, payload: any) {

    const webhook = new Webhook()

    await betterFetch(url, {
      body: payload,
      headers: {
        'x-flint-signature': webhook.signBody(payload, key)
      },
      retry: {
        type: 'exponential',
        attempts: 3,
        maxDelay: 10000,
        baseDelay: 1000,
        shouldRetry: (respoonse) => {
          if(respoonse?.ok) {
            return false
          }
          return true
        }
      }
    })
  }

  private signBody(payload: any, key: string) {
    return crypto.createHmac("sha512", key)
      .update(JSON.stringify(payload))
      .digest("hex");
  }
}
