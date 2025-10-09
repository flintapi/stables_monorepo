import EventListenerService from "./services/listener.service";

import {Worker} from "bullmq"
import { QueueNames, QueueInstances, EventServiceJob, ensureQueueEventHandlers } from "@flintapi/shared/Queue"
import { ChainId, baseSepolia, bsc, bscTestnet, base } from "@flintapi/shared/Utils"
import {CacheFacade} from "@flintapi/shared/Cache"
import { createPublicClient, http, extractChain } from "viem";


const name = QueueNames.EVENT_QUEUE;
const worker = new Worker<EventServiceJob, any, "Transfer" | "Approval">(
  name,
  async (job) => {
    try {
      console.log("Job: ", job.id, await job.getState())
      console.log("Job Name: ", job.name)
      console.log("Job Data: ", job.data)
      // TODO: implement handler

      const { chainId } = job.data;

      const chain = extractChain({
        chains: [
          baseSepolia,
          base,
          bsc,
          bscTestnet
        ],
        id: chainId as ChainId
      })
      const publicClient = createPublicClient({
        chain,
        transport: http()
      })

      const listenerService = new EventListenerService(publicClient)
      const { listenerId } = await listenerService.CreateOfframpListener(job.data)
      console.log("Created listener id", listenerId)

      return `Created listener with id: ${listenerId}`
    }
    catch(error) {
      console.error(error)
    }
  },
  {
    connection: CacheFacade.redisCache,
    concurrency: 10,
    lockDuration: 120_000,
    maxStalledCount: 2,
    removeOnComplete: {
      age: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  }
)

const events = ensureQueueEventHandlers(name, (events) => {
  events.on("failed", async ({jobId, failedReason}) => {
    console.log("Failed job", jobId, "Cos of: ", failedReason)
    try {
      const job = await QueueInstances[name].getJob(jobId)
      console.log("Current attempts", job?.attemptsMade)
      console.log("Job options", job?.opts)
    }
    catch(error: any) {
      console.error("Failed to handle retry", error)
    }
  })

  events.on("ioredis:close", () => {
    console.log("Redis connection is closed")
  })

  events.on("active", () => {
    console.log("Active job")
  })

  events.on("completed", async ({jobId, returnvalue, prev}) => {
    console.log("Job finished with ", jobId, returnvalue, prev)
    const job = await QueueInstances[name].getJob(jobId)
    console.log("Job name", job?.name)
  })
})

const shutdown = async () => {
  await Promise.allSettled([worker.close(), events.close()])
  console.log("Closing worker and events...")
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
