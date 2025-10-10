import type { RampServiceJob } from "@flintapi/shared/Queue";

import { CacheFacade } from "@flintapi/shared/Cache";
import { ensureQueueEventHandlers, QueueInstances, QueueNames } from "@flintapi/shared/Queue";
import { Worker } from "bullmq";

// Will be run in its own docker container

const name = QueueNames.RAMP_QUEUE;
const worker = new Worker<RampServiceJob, any, "off-ramp" | "on-ramp">(
  name,
  async (job) => {
    console.log("Job: ", job.id, await job.getState());
    console.log("Job Name: ", job.name);
    // TODO: implement handler

    // throw new Error('Simulated error from a provider')

    return `finished processing ${job.name}`;
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
    console.log("Failed job", jobId, "Cos of: ", failedReason);
    try {
      const job = await QueueInstances["ramp-queue"].getJob(jobId);
      console.log("Current attempts", job?.attemptsMade);
      console.log("Job options", job?.opts);
    }
    catch (error: any) {
      console.error("Failed to handle retry", error);
    }
  });

  events.on("ioredis:close", () => {
    console.log("Redis connection is closed");
  });

  events.on("active", () => {
    console.log("Active job");
  });

  events.on("completed", async ({ jobId, returnvalue, prev }) => {
    console.log("Job finished with ", jobId, returnvalue, prev);
    const job = await QueueInstances["ramp-queue"].getJob(jobId);
    console.log("Job name", job?.name);
  });
});

async function shutdown() {
  await Promise.allSettled([worker.close(), events.close()]);
  console.log("Closing worker and events...");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
