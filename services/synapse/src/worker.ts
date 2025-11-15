import EventListenerService from "./services/listener.service";

import { Worker } from "bullmq";
import {
  QueueNames,
  QueueInstances,
  EventServiceJob,
  ensureQueueEventHandlers,
} from "@flintapi/shared/Queue";
import { ChainId, supportedChains } from "@flintapi/shared/Utils";
import { eventLogger } from "@flintapi/shared/Logger";
import { CacheFacade } from "@flintapi/shared/Cache";
import { createPublicClient, http, extractChain } from "viem";
import { RPC_URLS } from "./lib/constants";
import { createListenerCache } from "./lib/cache.listener";

const name = QueueNames.EVENT_QUEUE;
const worker = new Worker<EventServiceJob, any, "Transfer" | "Approval">(
  name,
  async (job) => {
    try {
      console.log("Job: ", job.id, await job.getState());
      console.log("Job Name: ", job.name);
      console.log("Job Data: ", job.data);
      // TODO: implement handler

      const { chainId } = job.data;

      const chain = extractChain({
        chains: Object.values(supportedChains),
        id: chainId as ChainId,
      });
      const rpc = RPC_URLS[chainId as ChainId];
      const publicClient = createPublicClient({
        chain,
        transport: http(rpc),
      });

      const listenerService = new EventListenerService(publicClient);
      const { listenerId } = await listenerService.CreateOfframpListener(
        job.data,
      );
      console.log("Created listener id", listenerId);

      return `Created listener with id: ${listenerId}`;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to create listener");
    }
  },
  {
    connection: CacheFacade.redisCache,
    concurrency: 10,
    lockDuration: 120_000,
    maxStalledCount: 2,
    removeOnComplete: {
      age: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  },
);

const events = ensureQueueEventHandlers(name, (events) => {
  events.on("failed", async ({ jobId, failedReason }) => {
    try {
      const job = await QueueInstances[name].getJob(jobId);
      eventLogger.error(`Failed job: ${jobId}`, {
        failedReason,
        ...job?.data,
      });
    } catch (error: any) {
      eventLogger.error("Failed to handle retry", error);
    }
  });

  events.on("completed", async ({ jobId, returnvalue, prev }) => {
    const job = await QueueInstances[name].getJob(jobId);
    eventLogger.log(`Job finished with id: ${jobId}`, {
      returnvalue,
      prev,
      jobName: job?.name,
    });
  });
});

async function restoreListeners() {
  const cache = await createListenerCache()
  await cache.restoreListeners();
}

function reportMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  console.log("Worker Memory Usage:");
  console.log(`  RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(
    `  Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(
    `  Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(
    `  External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(
    `  ArrayBuffers: ${(memoryUsage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`,
  );
  if (typeof (global as any).gc === "function") {
    (global as any).gc();
  }
}
// setInterval(reportMemoryUsage, 3000);

const shutdown = async () => {
  await Promise.allSettled([worker.close(), events.close()]);
  console.log("Closing worker and events...");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

restoreListeners()
  .catch(console.log)
