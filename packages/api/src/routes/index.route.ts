import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createMessageObjectSchema } from "stoker/openapi/schemas";

import { createRouter } from "@/lib/create-app";
import { apiLogger } from "@flintapi/shared/Logger";
import { QueueInstances, QueueNames, bullMqBase } from "@flintapi/shared/Queue";
import { QueueEvents } from "bullmq";
import { networkToChainidMap } from "@flintapi/shared/Utils";
import env from "@/env";
import { Address } from "viem";

const kmsQueue = QueueInstances[QueueNames.WALLET_QUEUE];
const kmsQueueEvents = new QueueEvents(QueueNames.WALLET_QUEUE, bullMqBase);

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
    try {
      const chainId = networkToChainidMap['base'];
      const getAddressJob = await kmsQueue.add(
        "get-address",
        {
          chainId,
          type: "eoa",
          keyLabel: env.TREASURY_KEY_LABEL,
        },
        {
          jobId: `kms-get-address-${chainId}-${c.get("requestId")}`,
        },
      );

      // TODO: Get deposit address
      const result = (await getAddressJob.waitUntilFinished(
        kmsQueueEvents,
        1000*10
      )) as { address: Address; index?: number };
      apiLogger.info("Treasury address", result)
    }
    catch(error: any) {
      apiLogger.error("Failed getting treasury address", error);
    }

    return c.json(
      {
        message: "Ramp and wallet service API",
      },
      HttpStatusCodes.OK,
    );
  },
);

export default router;
