import { QueueInstances } from "@flintapi/shared/Queue";
import {
  TOKEN_ADDRESSES,
  SupportedChains,
  networkToChainidMap,
} from "@flintapi/shared/Utils";
import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createMessageObjectSchema } from "stoker/openapi/schemas";

import { createRouter } from "@/lib/create-app";
import { Address } from "viem";

const eventQueue = QueueInstances["event-queue"];

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
    // const tokenAddress = TOKEN_ADDRESSES[SupportedChains.baseSepolia].cngn
    //   .address as Address;
    // const address = `0xf8b0FBA9849370313A86c437B52423D6c0516026` as Address;
    // const organization = { name: "Flint", id: "1234" };
    // // TODO: get transaction after creating in db
    // const transaction = {
    //   amount: 230,
    //   id: crypto.randomUUID().substring(0, 6),
    //   type: "off-ramp",
    //   network: "base",
    //   status: "pending",
    //   reference: "ext-ref-1234",
    // };
    // const chainId = networkToChainidMap["base"];

    // await eventQueue.add(
    //   "Transfer",
    //   {
    //     chainId,
    //     eventName: "Transfer",
    //     eventArgType: "to",
    //     address,
    //     tokenAddress,
    //     persist: false,
    //     rampData: {
    //       type: "off",
    //       organizationId: organization.id,
    //       transactionId: transaction.id,
    //     },
    //   },
    //   {
    //     jobId: `Transfer:${tokenAddress}:${crypto.randomUUID().substring(0, 6)}`,
    //     attempts: 2,
    //   },
    // );

    return c.json(
      {
        message: "Ramp and wallet service API",
      },
      HttpStatusCodes.OK,
    );
  },
);

export default router;
