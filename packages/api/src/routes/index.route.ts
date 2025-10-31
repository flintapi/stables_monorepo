import { QueueInstances, QueueNames, bullMqBase } from "@flintapi/shared/Queue";
import {
  TOKEN_ADDRESSES,
  SupportedChains,
  networkToChainidMap,
  // networkToChainidMap,
} from "@flintapi/shared/Utils";
import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createMessageObjectSchema } from "stoker/openapi/schemas";

import { createRouter } from "@/lib/create-app";
import { Address, encodeFunctionData, parseAbi, parseUnits } from "viem";
import { QueueEvents } from "bullmq";

const eventQueue = QueueInstances["event-queue"];
const walletQueue = QueueInstances[QueueNames.WALLET_QUEUE];

const walletQueueEvents = new QueueEvents(QueueNames.WALLET_QUEUE, bullMqBase);

const router = createRouter().openapi(
  createRoute({
    tags: ["Index"],
    method: "get",
    path: "/",
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        createMessageObjectSchema("Ramp and wallet service API"),
        "Wallet service API Index",
      ),
    },
  }),
  async (c) => {
    const token = TOKEN_ADDRESSES[SupportedChains.baseSepolia].cngn;
    const address = `0xf8b0FBA9849370313A86c437B52423D6c0516026` as Address;
    const organization = { name: "Flint", id: "1234" };
    // TODO: get transaction after creating in db
    const transaction = {
      amount: 230,
      id: crypto.randomUUID().substring(0, 6),
      type: "off-ramp",
      network: "base",
      status: "pending",
      reference: "ext-ref-1234",
    };
    const chainId = networkToChainidMap["base"];

    await eventQueue.add(
      "Transfer",
      {
        chainId,
        eventName: "Transfer",
        eventArgType: "to",
        address,
        tokenAddress: token.address as Address,
        callbackUrl: `https://webhook.site/890e0fd5-9bb8-4e01-bb66-bc23beae312f`,
        persist: false,
        rampData: {
          type: "off",
          organizationId: organization.id,
          transactionId: transaction.id,
        },
      },
      {
        jobId: `Transfer:${token.address}:${crypto.randomUUID().substring(0, 6)}`,
        attempts: 2,
      },
    );

    // for (const index of [0, 1, 2]) {
    //   await walletQueue.add(
    //     "sign-transaction",
    //     {
    //       chainId: SupportedChains.baseSepolia,
    //       keyLabel: `test-key-01`, // will be the signer if index for smart account is not provided
    //       index,
    //       data: encodeFunctionData({
    //         abi: parseAbi([
    //           "function transfer(address to, uint256 amount) external returns (bool)",
    //         ]),
    //         functionName: "transfer",
    //         args: [
    //           "0x6480d80d340d57ad82A7E79A91F0EceC3869D479",
    //           parseUnits("0", token.decimal),
    //         ],
    //       }),
    //       contractAddress: token.address as Address,
    //     },
    //     {
    //       jobId: `wallet-test-key-01-${SupportedChains.baseSepolia.toString()}-${crypto.randomUUID().substring(0, 6)}`,
    //       attempts: 1,
    //     },
    //   );
    // }

    // const value = await job.waitUntilFinished(walletQueueEvents);

    // console.log("Value", value);

    return c.json(
      {
        message: "Ramp and wallet service API",
      },
      HttpStatusCodes.OK,
    );
  },
);

export default router;
