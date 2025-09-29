import env from "@/env";
import { BundlerCollection, ChainId } from "./wallet.entities";

export enum SupportedChains {
  bsc = 56,
  bscTestnet = 97,
  base = 8453,
  baseSepolia = 84532,
}

export const BUNDLER_URLS: BundlerCollection = new Map([
  [SupportedChains.baseSepolia, [`https://rpc.zerodev.app/api/v3/f8bb7207-a626-4675-97ac-bbff20688173/chain/84532`]],
  [SupportedChains.bscTestnet, [`https://rpc.zerodev.app/api/v3/f8bb7207-a626-4675-97ac-bbff20688173/chain/97`]]
]);

export const networkToChainidMap: Record<string, ChainId> = {
  "base": env.NODE_ENV === "development"? 84532 : 8453,
  "bsc": env.NODE_ENV === "development"? 97 : 56,
}
