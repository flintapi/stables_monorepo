import { Receiver } from "@upstash/qstash";
import { serve } from "@upstash/workflow/hono";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

import type { AppBindings } from "@/lib/types";

import env from "@/env";
import createApp from "@/lib/create-app";

import BellBankAdapter from "../payouts/adapters/bellbank.adapter";

const app = createApp();

interface Payload {
  accountNumber: string;
  bankCode: string;
  amount: number;
  narration: string;
  reference: string;
  senderName?: string;
}

app.post("/workflows/payout", async (c) => {
  const handler = serve<Payload, { Bindings: AppBindings; Variables: AppBindings["Variables"]; QSTASH_TOKEN: AppBindings["QSTASH_TOKEN"] }>(
    async (context) => {
      let isConfirmed: boolean = false;
      const timeoutInMs = 60000;

      const payload = context.requestPayload;

      while (!isConfirmed) {
        console.log("Confirming transaction....");
        // Run confirmations
        await context.run("Await confirmations required", async () => {
          const client = createPublicClient({
            chain: base,
            transport: http(),
          });

          const tx = await client.waitForTransactionReceipt({ hash: ``, confirmations: 64, timeout: timeoutInMs * 20 });
          if (tx) {
            isConfirmed = true;
          }
        });
      }

      // Trigger payout
      await context.run("Initialize bellbank transfer", async () => {
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
      });
    },
    {
      receiver: new Receiver({
        currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
      }),
    },
  );

  // @ts-expect-error partial exists on zod v4 type
  return await handler(c);
});

export default app;
