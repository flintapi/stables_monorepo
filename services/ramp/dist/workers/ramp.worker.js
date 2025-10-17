import { PaymentProvider } from "@flintapi/shared/Adapters";
import { CacheFacade } from "@flintapi/shared/Cache";
import { rampLogger } from "@flintapi/shared/Logger";
import { ensureQueueEventHandlers, QueueInstances, QueueNames } from "@flintapi/shared/Queue";
import { Worker } from "bullmq";
import Ramp from "@/services/ramp.service";
// Will be run in its own docker container
const name = QueueNames.RAMP_QUEUE;
const worker = new Worker(name, async (job) => {
    // Log job start
    rampLogger.info("Processing ramp job", {
        jobId: job.id,
        jobName: job.name,
        attemptsMade: job.attemptsMade,
        data: job.data,
    });
    switch (job.name) {
        case "off-ramp": {
            try {
                return await Ramp.processOffRampJob(job.data, job.attemptsMade);
            }
            catch (offRampError) {
                // TODO: Log error attempt and retry with updated job
                rampLogger.error(offRampError);
                const updatedData = { ...job.data, prevProviders: [...job.data?.prevProviders, PaymentProvider.BELLBANK] };
                await job.updateData(updatedData);
                throw offRampError;
            }
            break;
        }
        case "on-ramp": {
            throw new Error("On-ramp job not implemented");
            break;
        }
        default:
            throw new Error("Invalid job name");
            break;
    }
}, {
    connection: CacheFacade.redisCache,
    concurrency: 10,
    lockDuration: 120_000,
    maxStalledCount: 2,
    removeOnComplete: {
        age: 1000 * 60 * 60 * 24 * 1, // 1 day
    },
});
const events = ensureQueueEventHandlers(name, (events) => {
    events.on("failed", async ({ jobId, failedReason }) => {
        try {
            const job = await QueueInstances["ramp-queue"].getJob(jobId);
            rampLogger.error(`Failed job with id: ${jobId}`, {
                failedReason,
                name: job?.name,
                opts: job?.opts,
                data: job?.data,
                retryCount: job?.attemptsMade,
            });
        }
        catch (error) {
            rampLogger.error("Failed to get job", error);
        }
    });
    events.on("completed", async ({ jobId, returnvalue }) => {
        try {
            const job = await QueueInstances["ramp-queue"].getJob(jobId);
            rampLogger.info(`Complete job with id: ${jobId}`, {
                returnvalue,
                name: job?.name,
                opts: job?.opts,
                data: job?.data,
                retryCount: job?.attemptsMade,
            });
            rampLogger.info("Job name", job?.name);
        }
        catch (error) {
            rampLogger.error("Failed to get job", error);
        }
    });
});
async function shutdown() {
    rampLogger.info(`Closing worker and events for ${name}...`);
    await Promise.allSettled([worker.close(), events.close()]);
    process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
