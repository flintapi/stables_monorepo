import { Queue, QueueOptions } from "bullmq";
import { CacheFacade } from "Cache/cache.facade";
import {SwapServiceJob, RampServiceJob} from "./queue.types";

export const bullMqBase: QueueOptions = { connection: CacheFacade.redisCache };

//NOTE: Make sure the queue name does not have `:` use `-` to avoid redis error
export enum QueueNames {
  RAMP_QUEUE = "ramp-queue",
  SWAP_QUEUE = "swap-queue"
}

const rampServiceQueue = new Queue<RampServiceJob, any, "off-ramp" | "on-ramp">(QueueNames.RAMP_QUEUE, bullMqBase);
const swapServiceQueue = new Queue<SwapServiceJob>(QueueNames.SWAP_QUEUE, bullMqBase);

// TODO: Implement new queue for payment failed re-retry with different provider
// const paymentRetryQueue = new Queue<PaymentRetryJob>(QueueNames.PAYMENT_RETRY_QUEUE, bullMqBase);

//For DLQ
// export const webhookEvmDLQ = new Queue<WebhookEvmJob>(QueueNames.DLQ_BURN_EVM, bullMqBase);

export const QueueInstances = {
  [QueueNames.RAMP_QUEUE]: rampServiceQueue,
  [QueueNames.SWAP_QUEUE]: swapServiceQueue,
};
