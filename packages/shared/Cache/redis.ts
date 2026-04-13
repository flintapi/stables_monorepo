import { Redis, type RedisOptions } from 'ioredis';
import { error } from 'winston';

export const redisConfig: RedisOptions = {
  maxRetriesPerRequest: null,
  // ======== AUTO-PIPELINING (Reduces Redis Calls by ~50-70%) ========
  /**
    * Automatically batches commands issued in the same event loop iteration
    * This dramatically reduces network roundtrips and Redis CPU usage
    */
  enableAutoPipelining: true,
  /**
    * Controls how many commands can be batched in a single pipeline
    * Higher = fewer Redis calls, but larger network packets
    */
  autoPipeliningIgnoredCommands: [],
  lazyConnect: false,
  enableReadyCheck: true,
  /**
    * Disable offline queue for Queue instances (fail fast)
    * Keep enabled for Workers (default: true)
    */
  enableOfflineQueue: true,
  /**
    * Exponential backoff: 1s -> 2s -> 4s -> 8s -> ... -> 20s max
    * Reduces connection storms during Redis outages
    */
  retryStrategy(times: number) {
    const delay = Math.min(times * 1000, 20000);
    console.log(`[IORedis] Retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  /**
    * Reconnect on error - useful for automatic recovery
    */
  reconnectOnError(err: Error) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some(target => err.message.includes(target));
  },
  // ======== TIMEOUTS ========
  /**
    * Connection timeout during initial connect
    */
  connectTimeout: 10000,

  /**
    * Command timeout - prevents hanging on slow Redis operations
    * Set higher for long-running Lua scripts
    */
  commandTimeout: 5000,

  /**
    * Keep-alive to detect dead connections
    */
  keepAlive: 30000,
}

class RedisCache {
  private static instance: Redis | null = null;
  private static queueInstance: Redis | null = null;
  private static workerInstance: Redis | null = null;
  private static isInitialized = false;
  private static redisConnectionUrl = process.env.REDIS_CONNECTION_URL;

  private constructor() {
      if (RedisCache.instance) {
          throw new Error('Use RedisCache.getInstance() instead of new.');
      }
  }

  // Return specific redis for queue config
  public static getWorkerInstance(): Redis {
    if (!RedisCache.workerInstance) {
      try {
        if (!RedisCache.redisConnectionUrl) {
            throw new Error('REDIS_CONNECTION_URL is not defined in environment variables');
        }
        RedisCache.workerInstance = new Redis(RedisCache.redisConnectionUrl, {
          ...redisConfig,
          maxRetriesPerRequest: null, // should be set to null for bullmq
          enableOfflineQueue: true // Don't queue commands when offline
        });
        RedisCache.workerInstance.on('error', (error: Error) => {
          console.error('Redis connection error:', error);
        });
        RedisCache.workerInstance.on('connect', () => {
          console.log('Successfully connected to Redis');
          RedisCache.isInitialized = true;
        });

        RedisCache.workerInstance.on("reconnecting", () => {
          console.log("Reconnecting...")
        })
      }
      catch(error) {
        console.error(`Failed to initialize worker queue instance`, { error })
        throw error;
      }
    }

    return RedisCache.workerInstance;
  }

  public static getQueueInstance(): Redis {
    if (!RedisCache.queueInstance) {
      try {
        if (!RedisCache.redisConnectionUrl) {
            throw new Error('REDIS_CONNECTION_URL is not defined in environment variables');
        }
        RedisCache.queueInstance = new Redis(RedisCache.redisConnectionUrl, {
          ...redisConfig,
          maxRetriesPerRequest: 20, // should be set to null for bullmq
          enableOfflineQueue: false // Don't queue commands when offline
        });
        RedisCache.queueInstance.on('error', (error: Error) => {
          console.error('Redis connection error:', error);
        });
        RedisCache.queueInstance.on('connect', () => {
          console.log('Successfully connected to Redis');
          RedisCache.isInitialized = true;
        });

        RedisCache.queueInstance.on("reconnecting", () => {
          console.log("Reconnecting...")
        })
      }
      catch (error) {
        console.error("Failed to initialise queue redis instance", { error })
        throw error;
      }
    }

    return RedisCache.queueInstance;
  }

    public static getInstance(): Redis {
        if (!RedisCache.instance) {
            try {
                if (!RedisCache.redisConnectionUrl) {
                    throw new Error('REDIS_CONNECTION_URL is not defined in environment variables');
                }
                RedisCache.instance = new Redis(RedisCache.redisConnectionUrl, {
                    retryStrategy: (times: number) => {
                        console.log(`Retrying redis connection: attempt ${times}`);
                        return Math.min(times * 50, 2000);
                    },
                    maxRetriesPerRequest: null, // should be set to null for bullmq
                    enableReadyCheck: true,
                });
                RedisCache.instance.on('error', (error: Error) => {
                    console.error('Redis connection error:', error);
                });
                RedisCache.instance.on('connect', () => {
                    console.log('Successfully connected to Redis');
                    RedisCache.isInitialized = true;
                });

                RedisCache.instance.on("reconnecting", () => {
                    console.log("Reconnecting...")
                })
            }
            catch (error) {
                console.error('Failed to initialize Redis connection:', error);
                throw error;
            }
        }

        return RedisCache.instance;
    }

    public static async closeConnection(): Promise<void> {
        if (RedisCache.instance) {
            await RedisCache.instance.quit();
            RedisCache.instance = null;
            RedisCache.isInitialized = false;
        }
    }

    public static isConnected(): boolean {
        return RedisCache.isInitialized && RedisCache.instance !== null;
    }
}


const redis = RedisCache.getInstance();
const queuConnection = RedisCache.getQueueInstance();
const workerConnection = RedisCache.getWorkerInstance();
export { queuConnection, workerConnection }
export default redis;
