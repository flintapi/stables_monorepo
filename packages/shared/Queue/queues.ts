import type { QueueOptions } from "bullmq";
import type { Address, Hex, TransactionReceipt } from "viem";

import { Queue } from "bullmq";

import { CacheFacade } from "Cache/cache.facade";

import type {
  EventServiceJob,
  MiscJob,
  RampServiceJob,
  SwapServiceJob,
  WalletGetOrCreateJob,
  WalletSignTransactionJob,
} from "./queue.types";

export const bullMqBase: QueueOptions = { connection: CacheFacade.redisCache };

// NOTE: Make sure the queue name does not have `:` use `-` to avoid redis error
export enum QueueNames {
  RAMP_QUEUE = "ramp-queue",
  SWAP_QUEUE = "swap-queue",
  EVENT_QUEUE = "event-queue",
  MISC_QUEUE = "misc-queue",
  RAMP_RETRY_QUEUE = "ramp-retry-queue",
  WALLET_QUEUE = "wallet-queue",
}

const rampServiceQueue = new Queue<RampServiceJob, any, "off-ramp" | "on-ramp">(
  QueueNames.RAMP_QUEUE,
  bullMqBase,
);
const swapServiceQueue = new Queue<SwapServiceJob>(
  QueueNames.SWAP_QUEUE,
  bullMqBase,
);
const eventServiceQueue = new Queue<
  EventServiceJob,
  any,
  "Transfer" | "Approval"
>(QueueNames.EVENT_QUEUE, bullMqBase);
// This queue will run other jobs that can't go into its own dedicated queue:
// Such as: webhook calls, failed ramp ops auto re-try, scheduled repeating jobs etc
const miscQueue = new Queue<MiscJob, any, "webhook" | "repeat-schedule">(
  QueueNames.MISC_QUEUE,
  bullMqBase,
);
// TODO: Implement new queue for payment failed re-retry with different provider
const rampServiceRetryQueue = new Queue<
  RampServiceJob,
  any,
  "off-ramp-retry" | "on-ramp-retry"
>(QueueNames.RAMP_RETRY_QUEUE, bullMqBase);

// TODO: Implement queue for wallet service
const walletServiceQueue = new Queue<
  WalletGetOrCreateJob | WalletSignTransactionJob,
  { address: Address; index: number } | { hash: Hex },
  "get-address" | "sign-transaction"
>(QueueNames.WALLET_QUEUE, bullMqBase);

// For DLQ
// export const webhookEvmDLQ = new Queue<WebhookEvmJob>(QueueNames.DLQ_BURN_EVM, bullMqBase);

export const QueueInstances = {
  [QueueNames.RAMP_QUEUE]: rampServiceQueue,
  [QueueNames.SWAP_QUEUE]: swapServiceQueue,
  [QueueNames.EVENT_QUEUE]: eventServiceQueue,
  [QueueNames.MISC_QUEUE]: miscQueue,
  [QueueNames.RAMP_RETRY_QUEUE]: rampServiceRetryQueue,
  [QueueNames.WALLET_QUEUE]: walletServiceQueue,
};
