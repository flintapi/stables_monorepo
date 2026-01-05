import EventListenerService from "./services/listener.service";

import { Worker } from "bullmq";
import {
  QueueNames,
  QueueInstances,
  EventServiceJob,
  ensureQueueEventHandlers,
} from "@flintapi/shared/Queue";
import { ChainId, supportedChains } from "@flintapi/shared/Utils";
import { eventLogger, kmsLogger } from "@flintapi/shared/Logger";
import { CacheFacade } from "@flintapi/shared/Cache";
import { createPublicClient, http, webSocket, extractChain } from "viem";
import { getTransport, RPC_URLS } from "./lib/constants";
import { createListenerCache } from "./lib/cache.listener";
import env from "./env";

const name = QueueNames.EVENT_QUEUE;
const worker = new Worker<EventServiceJob, any, "Transfer" | "Approval">(
  name,
  async (job) => {
    try {
      const { chainId } = job.data;

      const chain = extractChain({
        chains: Object.values(supportedChains),
        id: chainId as ChainId,
      });
      const rpc = RPC_URLS[chainId as ChainId];
      console.log("Listener RPC", rpc)
      const publicClient = createPublicClient({
        chain,
        transport: getTransport(rpc, chainId),
      });

      const fromBlock = await publicClient.getBlockNumber()
      const listenerService = new EventListenerService(publicClient);
      const { listenerId } = await listenerService.CreateOfframpListener(
        {...job.data, fromBlock },
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
    concurrency: 2,
    lockDuration: 120_000,
    maxStalledCount: 2,
    removeOnFail: {
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
    eventLogger.info(`Job finished with id: ${jobId}`, {
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

// async function triggerTestJob() {
//   const chainId = 84532;
//   const jobData = {
//     rampData: {
//       type: "on",
//       transactionId: '',
//       organizationId: '',
//       amountReceived: 10000
//     },
//     eventArgType: 'to',
//     address: '0xC5dDD7A035fC6e664f0E8f18299fB09f8766676e',
//     tokenAddress: '0x46C85152bFe9f96829aA94755D9f915F9B10EF5F',
//     chainId: 84532,
//     persist: false,
//     callbackUrl: 'https://stables.flintapi.io/webhooks/synapse',
//     eventName: 'Transfer'
//   }

//   const chain = extractChain({
//     chains: Object.values(supportedChains),
//     id: chainId as ChainId,
//   });
//   const rpc = RPC_URLS[chainId as ChainId];
//   console.log("Listener RPC", rpc)
//   const publicClient = createPublicClient({
//     chain,
//     transport: getTransport(rpc, chainId),
//   });

//   const fromBlock = await publicClient.getBlockNumber()
//   const listenerService = new EventListenerService(publicClient);
//   const { listenerId: testListenerId } = await listenerService.CreateOfframpListener(
//     {...jobData, fromBlock} as EventServiceJob & {fromBlock: bigint},
//   );

//   console.log(`Listner ID ${testListenerId} added....`)
// }

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
  .catch(kmsLogger.error)
