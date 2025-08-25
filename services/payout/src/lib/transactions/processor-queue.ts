// payment-processor.ts

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
// @ts-ignore
import Redlock, { type Lock, } from 'redlock';
import { logger } from '../logger';
import { initializeDisbursement } from '../confirm-transaction';

interface PaymentData {
  reference: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
  senderName: string;
  narration: string;
  transactionHash: `0x${string}`;
}

interface PaymentProcessorOptions {
  redisUrl: string;
  queueName?: string;
}

export class PaymentProcessor {
  private readonly queue: Queue;
  private readonly worker: Worker;
  private readonly redlock: Redlock;
  private readonly redis: Redis;
  private readonly queueName: string;

  private constructor(redis: Redis, redlock: Redlock, queue: Queue, worker: Worker, queueName: string) {
    this.redis = redis;
    this.redlock = redlock;
    this.queue = queue;
    this.worker = worker;
    this.queueName = queueName;
  }

  // Factory method
  public static create(options: PaymentProcessorOptions): PaymentProcessor {
    const queueName = options.queueName || 'payment-queue';
    const redis = new Redis(options.redisUrl);
    // @ts-ignore
    const redlock = new Redlock([redis], {
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
    });

    const queue = new Queue(queueName, { connection: redis });

    // Worker will be attached below
    let worker: Worker;

    // Create the instance first so we can reference it in the worker
    const processor = new PaymentProcessor(redis, redlock, queue, null as any, queueName);

    worker = new Worker(
      queueName,
      async (job: Job) => {
        await processor.handleJob(job);
      },
      { connection: redis }
    );

    // Attach the worker to the instance
    (processor as any).worker = worker;

    return processor;
  }

  // Add a payment job to the queue (to be called from HTTP handler)
  public async enqueuePayment(data: PaymentData): Promise<void> {
    await this.queue.add('process-payment', data, {
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  // Internal: process a payment job with distributed locking
  private async handleJob(job: Job): Promise<void> {
    const data = job.data as PaymentData;
    const lockKey = `lock:payment:${data.transactionHash}:${data.accountNumber}`;

    let lock: Lock | undefined;
    try {
      // Acquire lock for this user/payment method to prevent double processing
      lock = await this.redlock.acquire([lockKey], 5000);

      await this.processPayment(data);

    } catch (err) {
      // Optionally: log error, send to error tracking, etc.
      logger.error('Failed to process transaction', err)
      throw err;
    } finally {
      if (lock) {
        try {
          await this.redlock.release(lock);
        } catch (releaseErr) {
          // Optionally: log lock release error
          logger.error('Failed to release lock', releaseErr)
        }
      }
    }
  }

  // Actual payment processing logic (replace with real implementation)
  private async processPayment(data: PaymentData): Promise<void> {
    // const adapter = new BellBankAdapter()

    const {bankCode, accountNumber, transactionHash, reference, narration, amount, senderName} = data;
    try {
      const data = await initializeDisbursement({
        accountNumber: accountNumber,
        bankCode: bankCode,
        transactionHash,
        reference,
        narration,
        amount: Number(amount.toFixed(2)),
        senderName
      })

      logger.info('Payout success', data)
    }
    catch(payoutErr) {
      logger.error('Failed to call payout endpoint', payoutErr)
      throw payoutErr
    }
  }

  // Graceful shutdown
  public async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    await this.redis.quit();
  }
}
