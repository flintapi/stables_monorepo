import {Redis} from "ioredis"
import redis, { queuConnection, workerConnection } from "./redis"

export class CacheFacade {
  public static redisCache: Redis = redis;
  public static redisWorker: Redis = workerConnection;
  public static redisQueue: Redis = queuConnection;
}
