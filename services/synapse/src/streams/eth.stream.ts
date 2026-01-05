import { createListenerCache } from "@/lib/cache.listener";
import { ListenerConfig } from "@/lib/types";
import { eventLogger, kmsLogger } from "@flintapi/shared/Logger";
import { ChainId } from "@flintapi/shared/Utils";
import { Readable } from "node:stream";
import { Address, parseAbiItem, PublicClient } from "viem";


export class EthStream extends Readable {
  private readonly chainId: ChainId;
  private client: PublicClient;
  private interval: NodeJS.Timeout | null = null;
  private lastProcessedBlock: number = 0;
  private isProcessing: boolean = false;

  private config: ListenerConfig

  constructor(client: PublicClient, chainId: ChainId, config: ListenerConfig) {
    super({ objectMode: true, highWaterMark: 1000 });
    this.client = client;
    this.chainId = chainId;
    this.config = config;
    this.lastProcessedBlock = Number(config.fromBlock);
  }

  async _read(size: number) {
    // TODO: Implement timeout tracker to kill listener when current time in seconds exceeds timeout
    console.log("Looping log to track _read function for a Readable stream")
    if(!this.interval && !this.isProcessing) {
      await this.FetchAndStreamLogs();
      this.interval = setInterval(() => this.FetchAndStreamLogs(), 3000) as unknown as NodeJS.Timeout;
    }
  }

  private async FetchAndStreamLogs(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    const listenerCache = await createListenerCache()

    const maxRetries = 5;
    const baseDelay = 1000;
    const chunkSize = 1000; // number of blocks to query at a time, based on provider support
    let retryCount = 0;
    try {
      const transferEventAbi = parseAbiItem([
        "event Transfer(address indexed from, address indexed to, uint256 value)"
      ]);
      const approveEventAbi = parseAbiItem([
        "event Approval(address indexed owner, address indexed sender, uint256 value)"
      ])
      const latestBlock = Number(await this.client.getBlockNumber());
      let fromBlock = Math.max(0, this.lastProcessedBlock > 0? this.lastProcessedBlock+1 : latestBlock - chunkSize)

      while(fromBlock <= latestBlock) {
        // TODO: Check timeout
        if(this.config?.timeout && Date.now() > this.config?.timeout) {
          kmsLogger.info(`Timout reached for the screen time`)
          this.emit('end')
          this.emit('close', this.config.id)
          return;
        }
        const toBlock = Math.min(fromBlock + chunkSize - 999, latestBlock);

        while(retryCount < maxRetries) {
          try {
            const logs = await this.client.getLogs({
              address: this.config.filter.address,
              event: transferEventAbi,
              args: {
                to: this.config.filter.args.to as Address | Array<Address>,
                from: this.config.filter.args.from as Address | Array<Address>,
              },
              fromBlock: BigInt(fromBlock),
              toBlock: BigInt(toBlock),
              strict: true // turn on strict mode, only get logs that conform to the args
            })

            // Loop through logs and send for processing
            for (const log of logs) {
              try {
                if (!this.push(log)) {
                  await new Promise(resolve => this.once('drain', resolve));
                }
                if(!this.config.persistent) {
                  eventLogger.info(`End stream for: ${this.config.id}`, this.config);
                  this.emit('end');
                  this.emit('close');
                }
              } catch (error: any) {
                eventLogger.warn("Failed to parse log:", error);
                continue;
              }
            }

            // Reset retry count, and move to next range
            retryCount = 0;
            break;
          }
          catch (error: any) {
            if (error.code === -32005 || error.code === -32000) {
                // Handle rate limit or invalid range errors
                retryCount++;
                const delay = baseDelay * Math.pow(2, retryCount);
                eventLogger.warn(
                    `Error fetching logs on chain ${this.chainId} for blocks ${fromBlock} to ${toBlock}, retrying in ${delay}ms (attempt ${retryCount}): ${error.message}`
                );
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Unrecoverable error
                eventLogger.warn(`Unrecoverable error on chain ${this.chainId}: ${error.message}`);
                throw error;
            }
          }
        }

        if(retryCount >= maxRetries) {
          eventLogger.error(`Failed to fetch logs for blocks ${fromBlock} to ${toBlock} on chain ${this.chainId} after ${maxRetries} attempts`);
          this.emit('error', new Error(`Max retries exceeded for blocks ${fromBlock} to ${toBlock}.`));
          return;
        }

        fromBlock = toBlock + 1; // Move to the next chunk
        // TODO: Cache new fromBlock to preserve restore state
        await listenerCache.updateFromBlock(this.config.id, fromBlock)
          .catch(eventLogger.error);
      }

      this.lastProcessedBlock = latestBlock; // Update latest block
    } catch (error) {
      eventLogger.error("Error getting logs", error);
      this.emit('error', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async _destroy(error: Error | null, callback: (error?: Error | null) => void): Promise<void> {
    if(this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    try {
      if(this.isProcessing) {
        this.isProcessing = false;
      }
    }
    catch(error: any) {
      eventLogger.error("Error: ", error);
      callback(error)
      return;
    }
    callback(error)
  }
}
