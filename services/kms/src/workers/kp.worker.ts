import type {
  WalletGetOrCreateJob,
  WalletSignTransactionJob,
} from "@flintapi/shared/Queue";

import { kmsLogger } from "@flintapi/shared/Logger";
import {
  ensureQueueEventHandlers,
  QueueInstances,
  QueueNames,
} from "@flintapi/shared/Queue";
import { Worker } from "bullmq";

import kmsService from "../services/kms.services";
import env from "@/env";

const name = QueueNames.WALLET_QUEUE;
const worker = new Worker<
  WalletGetOrCreateJob | WalletSignTransactionJob,
  any,
  "get-address" | "sign-transaction"
>(name, async (job) => {
  switch (job.name) {
    case "get-address": {
      const { chainId, keyLabel, index, isSmartAccount } =
        job.data as WalletGetOrCreateJob;
      const address = await kmsService.getAddress(
        keyLabel || env.TREASURY_KEY_LABEL,
        chainId,
        index,
      );

      return { address };
    }

    case "sign-transaction": {
      const { keyLabel, chainId, index, data, contractAddress } =
        job.data as WalletSignTransactionJob;
      const receipt = await kmsService.transfer(
        keyLabel || process.env.MASTER_LABEL_KEY!,
        chainId,
        contractAddress,
        data,
        index,
      );

      return { receipt };
    }
  }
});

const event = ensureQueueEventHandlers(name, (events) => {
  events.on("failed", async ({ failedReason, jobId }) => {
    const job = await QueueInstances[name].getJob(jobId);

    kmsLogger.error("Job failed", failedReason, {
      name: job?.name,
      data: job?.data,
      id: jobId,
    });
  });

  events.on("completed", async ({ jobId, returnvalue }) => {
    const job = await QueueInstances[name].getJob(jobId);

    kmsLogger.info(`Job: ${jobId} completed with value`, returnvalue, {
      name: job?.name,
      data: job?.data,
      id: jobId,
    });
  });
});

async function shutdown() {
  await Promise.allSettled([worker.close(), event.close()]);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
