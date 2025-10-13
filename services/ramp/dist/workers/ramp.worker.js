import { CacheFacade } from "@flintapi/shared/Cache";
import { rampLogger } from "@flintapi/shared/Logger";
import { ensureQueueEventHandlers, QueueInstances, QueueNames } from "@flintapi/shared/Queue";
import { Worker } from "bullmq";
// Will be run in its own docker container
const name = QueueNames.RAMP_QUEUE;
const worker = new Worker(name, async (job) => {
    rampLogger.info("Job: ", job.id, await job.getState());
    rampLogger.info("Job Name: ", job.name);
    // TODO: implement ramp handler
    return `finished processing ${job.name}`;
}, {
    connection: CacheFacade.redisCache,
    concurrency: 10,
    lockDuration: 120_000,
    maxStalledCount: 2,
    removeOnComplete: {
        age: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
});
const events = ensureQueueEventHandlers(name, (events) => {
    events.on("failed", async ({ jobId, failedReason }) => {
        rampLogger.info("Failed job", jobId, "Cos of: ", failedReason);
        try {
            const job = await QueueInstances["ramp-queue"].getJob(jobId);
            rampLogger.info("Current attempts", job?.attemptsMade);
            rampLogger.info("Job options", job?.opts);
        }
        catch (error) {
            rampLogger.info("Failed to handle retry", error);
        }
    });
    events.on("completed", async ({ jobId, returnvalue, prev }) => {
        rampLogger.info("Job finished with ", jobId, returnvalue, prev);
        const job = await QueueInstances["ramp-queue"].getJob(jobId);
        rampLogger.info("Job name", job?.name);
    });
});
async function shutdown() {
    rampLogger.info(`Closing worker for ${name} and events...`);
    await Promise.allSettled([worker.close(), events.close()]);
    process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
