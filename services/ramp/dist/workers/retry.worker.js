import { CacheFacade } from "@flintapi/shared/Cache";
import { rampLogger } from "@flintapi/shared/Logger";
import { ensureQueueEventHandlers, QueueInstances, QueueNames } from "@flintapi/shared/Queue";
import { Worker } from "bullmq";
import env from "../env.js";
const name = QueueNames.RAMP_RETRY_QUEUE;
const worker = new Worker(name, async (job) => {
    rampLogger.info("Executing job", job.name, "with data", job.data);
}, {
    connection: CacheFacade.redisCache,
    concurrency: 5,
    lockDuration: 120_000,
    maxStalledCount: 2,
    removeOnComplete: {
        age: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
});
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
    rampLogger.info(`Environment... ${env.NODE_ENV}`);
    rampLogger.info(`Closing worker for ${name} and events...`);
    await Promise.allSettled([worker.close(), events.close()]);
    process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
