import { CacheFacade } from "@flintapi/shared/Cache";
import { ChainId, supportedChains } from "@flintapi/shared/Utils";
import { createPublicClient, extractChain } from "viem";
import { getTransport, RPC_URLS } from "./constants";
import EventListenerService from "@/services/listener.service";
import { EventServiceJob } from "@flintapi/shared/Queue";

export async function createListenerCache() {

  const activeListeners = await CacheFacade.redisCache.keys("synapse:listener:*")


  const restoreListeners = async () => {
    console.log("Attempting restore...")
    console.log("Active listeners count:", activeListeners.length)
    const ttlSeconds = 5 * 60;
    if(activeListeners.length) {
      const cacheListenerConfigs = await Promise.all(activeListeners.map(async (key) => {
        // TODO: add TTL of 5 minutes
        await CacheFacade.redisCache.expire(key, ttlSeconds);
        const config = await CacheFacade.redisCache.hgetall(key);
        return { key, config } as { key: string;  config: any};
      }));

      for(const listenerConfig of cacheListenerConfigs) {
        const {key, config} = listenerConfig
        const [_, __, listenerId] = key.split(":")
        // Call listener service with data
        const { chainId } = config;

        const chain = extractChain({
          chains: Object.values(supportedChains),
          id: Number(chainId) as ChainId,
        });
        const rpc = RPC_URLS[Number(chainId) as ChainId];
        console.log("Listener RPC", rpc)
        const publicClient = createPublicClient({
          chain,
          transport: getTransport(rpc, chain.id)
        });

        console.log("Restored config", config, "Typeof rampData: ", typeof config?.rampData);

        const listenerService = new EventListenerService(publicClient);
        const { listenerId: restoredListenerId } = await listenerService.CreateOfframpListener(
          {...config, fromBlock: BigInt(config?.fromBlock), persist: config?.persist === 'true', chainId: Number(config.chainId), rampData: JSON.parse(config?.rampData)} as EventServiceJob & {fromBlock: bigint},
          listenerId
        );
        console.log("Restored listener id", restoredListenerId);
      }
    }
  }

  const storeListener = async (listenerId: string, config: any) => {
    const hasKey = await CacheFacade.redisCache.exists(`synapse:listener:${listenerId}`);
    if (hasKey) return;
    await CacheFacade.redisCache.hset(`synapse:listener:${listenerId}`, config);
  }

  const updateFromBlock = async (listenerId: string, fromBlock: number) => {
    const hasKey = await CacheFacade.redisCache.exists(`synapse:listener:${listenerId}`);
    if (!hasKey) return;

    const lastBlock = await CacheFacade.redisCache.hget(`synapse:listener:${listenerId}`, 'fromBlock');

    if (!lastBlock) return;
    if (fromBlock <= BigInt(lastBlock)) return;

    await CacheFacade.redisCache.hset(`synapse:listener:${listenerId}`, { fromBlock });
  }

  const deleteListener = async (listenerId: string) => {
    await CacheFacade.redisCache.del(`synapse:listener:${listenerId}`);
  }

  const listenerIds = activeListeners.map((key) => key.split(":").slice(-1)[0])

  return {
    restoreListeners,
    listenerIds,
    storeListener,
    deleteListener,
    updateFromBlock
  }
}
