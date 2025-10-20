import type { SupportedChains } from "./wallet.constants";

import * as supportedChains from "./wallet.chains";

// Types and interfaces
export interface CollectionAddressParams {
  treasuryKeyLabel: string;
  sweep: boolean;
  chain: SupportedChains;
  index: bigint;
}

export interface CreateOrGetAccountConfig {
  chainId: ChainId;
  keyLabel: string;
  index?: bigint;
  isMaster?: boolean;
}

export type Network = "base" | "bsc";

// Collection of available bundler URLs
const ids = Object.values(supportedChains).map((network) => network.id);
export type ChainId = (typeof ids)[number];
export type BundlerCollection = Map<ChainId, Array<string>>;

export interface IndexManager {
  get: (keyLabel: string) => Promise<number>; // get the last recorded index for the keyLabel
  set: (keyLabel: string, index: number) => Promise<void>;
}
