import { betterFetch } from "@better-fetch/fetch";

import crypto from "node:crypto";


export default class Webhook {
  static trigger(url: string, key: string, payload: any) {

    const webhook = new Webhook()

    betterFetch(url, {
      body: payload,
      headers: {
        'x-signature': webhook.signBody(payload, key)
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
