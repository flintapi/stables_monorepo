import {Redis} from 'ioredis';

class RedisCache {
    private static instance: Redis | null = null;
    private static isInitialized = false;
    private static redisConnectionUrl = process.env.REDIS_CONNECTION_URL;

    private constructor() {
        if (RedisCache.instance) {
            throw new Error('Use RedisCache.getInstance() instead of new.');
        }
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
export default redis;
