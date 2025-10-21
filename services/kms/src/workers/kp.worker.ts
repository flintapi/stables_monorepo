import { CacheFacade } from "@flintapi/shared/Cache";
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
import { Address, Hex, TransactionReceipt } from "viem";
import walletFactory from "@/services/wallet.factory";

const name = QueueNames.WALLET_QUEUE;

console.log("Queue name:", name);

const worker = new Worker<
  WalletGetOrCreateJob | WalletSignTransactionJob,
  { address: Address; index?: number } | { hash: Hex },
  "get-address" | "sign-transaction"
>(
  name,
  async (job) => {
    console.log("Job name:", job.name);
    switch (job.name) {
      case "get-address": {
        const jobData = job.data as WalletGetOrCreateJob;

        switch (jobData.type) {
          case "smart": {
            const { keyLabel, chainId, index } = jobData;

            console.log("Job data", keyLabel, chainId, index);

            const { address } = await kmsService.getCollectionAddress(
              keyLabel,
              chainId,
              typeof index !== "undefined" ? BigInt(index) : undefined,
            );

            kmsLogger.info(address, index);

            return { address, index };
          }
          case "eoa": {
            const { keyLabel, chainId } = jobData;
            console.log("keyLabel", keyLabel);

            const address = await kmsService.getAddress(keyLabel, chainId);

            kmsLogger.info("Address", address);

            console.log("Address", address);

            return { address: address };
          }
        }
      }

      case "sign-transaction": {
        const { keyLabel, chainId, index, data, contractAddress } =
          job.data as WalletSignTransactionJob;

        const receipt = await kmsService.transfer(
          keyLabel,
          chainId,
          contractAddress,
          data,
          typeof index !== "undefined" ? BigInt(index) : undefined,
        );

        console.log("Receipt", receipt);

        return { hash: receipt.transactionHash };
      }
    }
  },
  {
    connection: CacheFacade.redisCache,
    concurrency: 10,
    lockDuration: 120_000,
    maxStalledCount: 2,
    removeOnComplete: {
      age: 1000 * 60 * 60 * 24 * 1, // 1 day
    },
  },
);

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
