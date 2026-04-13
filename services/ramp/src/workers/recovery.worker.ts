import type { RampServiceJob } from "@flintapi/shared/Queue";

import { CacheFacade } from "@flintapi/shared/Cache";
import { rampLogger } from "@flintapi/shared/Logger";
import { ensureQueueEventHandlers, QueueInstances, QueueNames } from "@flintapi/shared/Queue";
import { BellbankAdapter } from "@flintapi/shared/Adapters"
import { Worker } from "bullmq";

const name = QueueNames.RECOVERY_QUEUE;
const worker = new Worker<any, any, "retry" | "schedule">(
  name,
  async (job) => {
    if(job.name === "schedule") {
      const reference = job.data?.reference;
      const adapter = new BellbankAdapter()
      const queryResult = await adapter.queryTransaction({
        reference,
      })

      rampLogger.info("Found transaction", queryResult?.data);
      rampLogger.info("Transaction status", queryResult?.data?.status);
    }
  },
  {
    connection: CacheFacade.redisCache,
    concurrency: 5,
    lockDuration: 120_000,
    maxStalledCount: 2,
    removeOnComplete: {
      age: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  },
);

const events = ensureQueueEventHandlers(name, (events) => {
  events.on("failed", async ({ jobId, failedReason }) => {
    rampLogger.error(`Failed job ${jobId} with reason: ${failedReason}`);
  });

  events.on("completed", async ({ jobId, returnvalue, prev }) => {
    const job = await QueueInstances[name].getJob(jobId);
    rampLogger.info(`Job with name ${job?.name} completed with return value`, returnvalue);
    rampLogger.info("Previous value", prev);
  });
});

async function shutdown() {
  rampLogger.info(`Closing worker and events for ${name}...`);
  await Promise.allSettled([worker.close(), events.close()]);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
