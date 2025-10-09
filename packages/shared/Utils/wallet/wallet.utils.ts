import { IndexManager } from "./wallet.entities";
import {CacheFacade} from "@flintapi/shared/Cache"


const getKey = (keyLabel: string) => `account:index:${keyLabel}`;

export function indexManager(): IndexManager {
  return {
    async get(keyLabel) {
      const key = getKey(keyLabel)

      const previousIndex = await CacheFacade.redisCache.get(key)
      if (previousIndex) return Number(previousIndex);
      return 0;
    },

    async set(keyLabel, index) {
      const key = getKey(keyLabel)

      await CacheFacade.redisCache.set(key, index.toString())
    }
  }
}
